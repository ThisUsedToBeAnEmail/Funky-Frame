/**
 * Channel - Real-time room-based pub/sub system
 *
 * Provides channel-based communication for chat, presence,
 * collaboration, and other real-time features.
 *
 * @namespace Funky.Channel
 * @requires Funky.WebSocket
 */
(function(global) {
    'use strict';

    var Funky = global.Funky || {};

    // Registry guard - prevent double registration
    if (Funky.isRegistered && Funky.isRegistered('Channel')) {
        return;
    }

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================

    var _initialized = false;
    var _config = {};
    var _currentUser = null;
    var _channels = {};           // { channelName: ChannelState }
    var _subscriptions = {};      // { channelName: [subscriptions] }
    var _eventHandlers = {};      // { eventName: [callbacks] }
    var _channelHandlers = {};    // { channelName: { eventName: [callbacks] } }
    var _wildcardHandlers = [];   // Handlers for all events
    var _messageBuffer = {};      // { channelName: [messages] }
    var _pendingRequests = {};    // { requestId: { resolve, reject, timeout } }
    var _wsMessageHandler = null; // Stored for cleanup
    var _messageIdCounter = 0;
    var _subscriptionIdCounter = 0;

    // =========================================================================
    // DEFAULT OPTIONS
    // =========================================================================

    var DEFAULTS = {
        websocket: null,         // Deprecated: use useWebSocket instead
        useWebSocket: true,      // Use shared Funky.WebSocket if no custom websocket provided
        userId: null,
        userName: 'Anonymous',
        userMetadata: {},
        autoReconnect: true,
        maxChannels: 50,
        messageBuffer: 100,
        debug: false
    };

    // =========================================================================
    // CHANNEL STATE CLASS
    // =========================================================================

    /**
     * Channel state object
     * @param {string} name - Channel name
     * @param {Object} options - Join options
     */
    function ChannelState(name, options) {
        options = options || {};
        this.name = name;
        this.members = [];
        this.metadata = options.metadata || {};
        this.joinedAt = new Date().toISOString();
        this.lastActivity = this.joinedAt;
        this.status = 'joining';  // 'joining', 'joined', 'leaving', 'left'
    }

    /**
     * Add a member to the channel
     * @param {Object} member - Member object
     * @returns {boolean} True if member was added (not already present)
     */
    ChannelState.prototype.addMember = function(member) {
        var self = this;
        var exists = this.members.some(function(m) {
            return m.id === member.id;
        });

        if (!exists) {
            member.joinedAt = member.joinedAt || new Date().toISOString();
            this.members.push(member);
        }

        return !exists;
    };

    /**
     * Remove a member from the channel
     * @param {string} memberId - Member ID
     * @returns {Object|null} Removed member or null
     */
    ChannelState.prototype.removeMember = function(memberId) {
        var index = -1;
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].id === memberId) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            var member = this.members[index];
            this.members.splice(index, 1);
            return member;
        }

        return null;
    };

    /**
     * Get a member by ID
     * @param {string} memberId - Member ID
     * @returns {Object|null}
     */
    ChannelState.prototype.getMember = function(memberId) {
        for (var i = 0; i < this.members.length; i++) {
            if (this.members[i].id === memberId) {
                return this.members[i];
            }
        }
        return null;
    };

    /**
     * Update last activity timestamp
     */
    ChannelState.prototype.updateActivity = function() {
        this.lastActivity = new Date().toISOString();
    };

    /**
     * Set members list (for sync)
     * @param {Array} members - Members array
     */
    ChannelState.prototype.setMembers = function(members) {
        this.members = members || [];
    };

    /**
     * Get member count
     * @returns {number}
     */
    ChannelState.prototype.getMemberCount = function() {
        return this.members.length;
    };

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    function log() {
        if (_config.debug) {
            var args = ['[Channel]'].concat(Array.prototype.slice.call(arguments));
            console.log.apply(console, args);
        }
    }

    function warn(msg) {
        console.warn('[Channel] ' + msg);
    }

    function error(msg) {
        console.error('[Channel] ' + msg);
    }

    /**
     * Safely call a handler function
     * @param {Function} handler - Handler function
     * @param {Object} data - Event data
     * @param {string} event - Event name
     */
    function safeCall(handler, data, event) {
        try {
            handler(data);
        } catch (e) {
            error('Event handler error for "' + event + '": ' + e.message);
            if (_config.debug) {
                console.error(e);
            }
        }
    }

    /**
     * Emit event via all channels (internal, PubSub, DOM)
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    function emit(event, data) {
        data = data || {};

        var channel = data.channel;
        var i;

        // Call global handlers for this event
        var handlers = _eventHandlers[event];
        if (handlers) {
            for (i = 0; i < handlers.length; i++) {
                safeCall(handlers[i], data, event);
            }
        }

        // Call channel-specific handlers
        if (channel && _channelHandlers[channel]) {
            var channelHandlers = _channelHandlers[channel][event];
            if (channelHandlers) {
                for (i = 0; i < channelHandlers.length; i++) {
                    safeCall(channelHandlers[i], data, event);
                }
            }
        }

        // Call wildcard handlers
        for (i = 0; i < _wildcardHandlers.length; i++) {
            safeCall(_wildcardHandlers[i], data, event);
        }

        // Emit via PubSub (colon notation)
        if (Funky.PubSub) {
            Funky.PubSub.emit('funky:channel:' + event, data);

            // Also emit channel-specific PubSub event
            if (channel) {
                Funky.PubSub.emit('funky:channel:' + channel + ':' + event, data);
            }
        }

        // Emit DOM event (dot notation)
        if (Funky.Events && Funky.Events.emit) {
            Funky.Events.emit(document, 'funky.channel.' + event, data);
        } else {
            // Fallback to CustomEvent
            var domEvent = new CustomEvent('funky.channel.' + event, {
                detail: data,
                bubbles: true
            });
            document.dispatchEvent(domEvent);
        }
    }

    /**
     * Generate unique message ID
     * @returns {string}
     */
    function generateMessageId() {
        _messageIdCounter++;
        return 'msg_' + Date.now() + '_' + _messageIdCounter + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Generate unique subscription ID
     * @returns {string}
     */
    function generateSubscriptionId() {
        _subscriptionIdCounter++;
        return 'sub_' + Date.now() + '_' + _subscriptionIdCounter;
    }

    // =========================================================================
    // WEBSOCKET COMMUNICATION
    // =========================================================================

    /**
     * Send a message via WebSocket
     * @param {string} type - Message type
     * @param {Object} payload - Message payload
     * @returns {boolean} True if sent successfully
     */
    function sendMessage(type, payload) {
        var ws = _config._wsInstance || _config.websocket;
        if (!ws) {
            warn('WebSocket not configured');
            return false;
        }

        var message = { type: type };
        for (var key in payload) {
            if (payload.hasOwnProperty(key)) {
                message[key] = payload[key];
            }
        }

        try {
            if (typeof ws.send === 'function') {
                ws.send(type, payload);
                return true;
            } else {
                warn('WebSocket.send is not a function');
                return false;
            }
        } catch (e) {
            error('Failed to send message: ' + e.message);
            return false;
        }
    }

    /**
     * Handle incoming WebSocket messages
     * @param {Object} message - Message object
     */
    function handleWebSocketMessage(message) {
        if (!message || !message.type) return;

        // Only handle channel messages
        if (message.type.indexOf('channel:') !== 0) return;

        log('Received:', message.type, message);

        switch (message.type) {
            case 'channel:joined':
                handleJoined(message);
                break;
            case 'channel:left':
                handleLeft(message);
                break;
            case 'channel:member_joined':
                handleMemberJoined(message);
                break;
            case 'channel:member_left':
                handleMemberLeft(message);
                break;
            case 'channel:message':
                handleChannelMessage(message);
                break;
            case 'channel:sync':
                handleSync(message);
                break;
            case 'channel:error':
                handleChannelError(message);
                break;
        }
    }

    /**
     * Handle channel:joined message
     */
    function handleJoined(message) {
        var channel = _channels[message.channel];
        if (!channel) return;

        channel.status = 'joined';
        channel.setMembers(message.members || []);

        // Add self to members if not present
        var selfMember = channel.getMember(_config.userId);
        if (!selfMember) {
            channel.addMember({
                id: _config.userId,
                name: _config.userName,
                metadata: _config.userMetadata
            });
        }

        log('Joined channel:', message.channel, 'with', channel.getMemberCount(), 'members');

        emit('joined', {
            channel: message.channel,
            members: channel.members.slice()
        });
    }

    /**
     * Handle channel:left message
     */
    function handleLeft(message) {
        var channel = _channels[message.channel];
        if (channel) {
            channel.status = 'left';
            delete _channels[message.channel];
        }

        // Clear subscriptions for this channel
        delete _subscriptions[message.channel];

        log('Left channel:', message.channel);

        emit('left', { channel: message.channel });
    }

    /**
     * Handle channel:member_joined message
     */
    function handleMemberJoined(message) {
        var channel = _channels[message.channel];
        if (!channel) return;

        var added = channel.addMember(message.member);
        if (added) {
            log('Member joined:', message.member.name, 'in', message.channel);

            emit('join', {
                channel: message.channel,
                member: message.member
            });
        }
    }

    /**
     * Handle channel:member_left message
     */
    function handleMemberLeft(message) {
        var channel = _channels[message.channel];
        if (!channel) return;

        var member = channel.removeMember(message.memberId);
        if (member) {
            log('Member left:', member.name, 'from', message.channel);

            emit('leave', {
                channel: message.channel,
                member: member
            });
        }
    }

    /**
     * Handle channel:message with enhanced subscription support
     */
    function handleChannelMessage(message) {
        var channel = _channels[message.channel];
        if (channel) {
            channel.updateActivity();
        }

        var isLocal = message.local || false;
        var msg = message.message;
        var sender = message.sender;

        // Buffer message (unless local echo)
        if (!isLocal) {
            bufferMessage(message.channel, {
                message: msg,
                sender: sender,
                timestamp: message.timestamp || new Date().toISOString()
            });
        }

        // Check for response to pending request
        if (msg && msg._isResponse && msg._requestId) {
            var pending = _pendingRequests[msg._requestId];
            if (pending) {
                clearTimeout(pending.timeout);
                delete _pendingRequests[msg._requestId];
                pending.resolve(msg);
                return; // Don't emit as regular message
            }
        }

        // Call subscriptions for this channel
        var subs = _subscriptions[message.channel];
        if (subs) {
            for (var i = 0; i < subs.length; i++) {
                var subscription = subs[i];
                if (subscription.active && subscription.handler) {
                    subscription.handler(msg, sender);
                } else if (subscription.active && typeof subscription === 'function') {
                    // Legacy support for plain function callbacks
                    try {
                        subscription(msg, sender);
                    } catch (e) {
                        error('Subscription callback error: ' + e.message);
                    }
                }
            }
        }

        // Emit general message event
        emit('message', {
            channel: message.channel,
            message: msg,
            sender: sender,
            local: isLocal
        });

        // Emit typed event if message has type
        if (msg && msg.type) {
            emit('message:' + msg.type, {
                channel: message.channel,
                message: msg,
                sender: sender
            });
        }
    }

    /**
     * Handle channel:sync message with join/leave detection
     */
    function handleSync(message) {
        var channel = _channels[message.channel];
        if (!channel) return;

        // Store previous members for comparison
        var previousMembers = channel.members.slice();
        var previousIds = [];
        for (var i = 0; i < previousMembers.length; i++) {
            previousIds.push(previousMembers[i].id);
        }

        // Update members with sync timestamp
        var newMembers = message.members || [];
        var updatedMembers = [];
        for (var j = 0; j < newMembers.length; j++) {
            var m = newMembers[j];
            updatedMembers.push({
                id: m.id,
                name: m.name,
                metadata: m.metadata || {},
                joinedAt: m.joinedAt,
                syncedAt: new Date().toISOString()
            });
        }
        channel.setMembers(updatedMembers);

        var currentIds = [];
        for (var k = 0; k < channel.members.length; k++) {
            currentIds.push(channel.members[k].id);
        }

        // Detect who joined since last sync
        var joined = [];
        for (var l = 0; l < channel.members.length; l++) {
            if (previousIds.indexOf(channel.members[l].id) === -1) {
                joined.push(channel.members[l]);
            }
        }

        // Detect who left since last sync
        var left = [];
        for (var n = 0; n < previousMembers.length; n++) {
            if (currentIds.indexOf(previousMembers[n].id) === -1) {
                left.push(previousMembers[n]);
            }
        }

        // Emit individual join events
        for (var p = 0; p < joined.length; p++) {
            emit('join', {
                channel: message.channel,
                member: joined[p],
                fromSync: true
            });
        }

        // Emit individual leave events
        for (var q = 0; q < left.length; q++) {
            emit('leave', {
                channel: message.channel,
                member: left[q],
                fromSync: true
            });
        }

        log('Synced channel:', message.channel, 'with', channel.getMemberCount(), 'members',
            '(+' + joined.length + ', -' + left.length + ')');

        emit('sync', {
            channel: message.channel,
            members: channel.members.slice(),
            joined: joined,
            left: left
        });
    }

    /**
     * Handle channel:error message
     */
    function handleChannelError(message) {
        error('Channel error: ' + message.error + ' (channel: ' + message.channel + ')');

        emit('error', {
            channel: message.channel,
            error: message.error
        });
    }

    // =========================================================================
    // MESSAGE BUFFERING
    // =========================================================================

    /**
     * Buffer a message for a channel
     * @param {string} channel - Channel name
     * @param {Object} message - Message to buffer
     */
    function bufferMessage(channel, message) {
        if (!_messageBuffer[channel]) {
            _messageBuffer[channel] = [];
        }

        _messageBuffer[channel].push({
            message: message.message,
            sender: message.sender,
            timestamp: new Date().toISOString()
        });

        // Trim buffer if exceeds limit
        while (_messageBuffer[channel].length > _config.messageBuffer) {
            _messageBuffer[channel].shift();
        }
    }

    /**
     * Get buffered messages for a channel
     * @param {string} channel - Channel name
     * @returns {Array}
     */
    function getBufferedMessages(channel) {
        return (_messageBuffer[channel] || []).slice();
    }

    /**
     * Clear message buffer
     * @param {string} channel - Channel name (optional, clears all if omitted)
     */
    function clearMessageBuffer(channel) {
        if (channel) {
            delete _messageBuffer[channel];
        } else {
            _messageBuffer = {};
        }
    }

    // =========================================================================
    // RECONNECTION HANDLING
    // =========================================================================

    /**
     * Set up reconnect handler
     */
    function setupReconnectHandler() {
        if (!_config.autoReconnect) return;

        if (Funky.PubSub) {
            Funky.PubSub.on('funky:websocket:reconnected', handleReconnect);
        }

        // Also listen for status change DOM event
        document.addEventListener('funky.ws.status', function(event) {
            if (event.detail && event.detail.status === 'connected') {
                handleReconnect();
            }
        });
    }

    /**
     * Handle WebSocket reconnection
     */
    function handleReconnect() {
        log('WebSocket reconnected, rejoining channels');
        rejoinAllChannels();
    }

    /**
     * Rejoin all channels after reconnect
     */
    function rejoinAllChannels() {
        var channelNames = Object.keys(_channels);
        for (var i = 0; i < channelNames.length; i++) {
            var channelName = channelNames[i];
            var channel = _channels[channelName];

            if (channel.status === 'joined' || channel.status === 'joining') {
                channel.status = 'joining';
                sendMessage('channel:join', {
                    channel: channelName,
                    userId: _config.userId,
                    userName: _config.userName,
                    metadata: channel.metadata,
                    rejoin: true
                });
            }
        }
    }

    // =========================================================================
    // MAIN MODULE
    // =========================================================================

    var Channel = {
        /**
         * Initialize the channel system
         * @param {Object} options - Configuration options
         * @returns {Object} this for chaining
         */
        init: function(options) {
            if (_initialized) {
                warn('Already initialized');
                return this;
            }

            // Merge options with defaults
            _config = {};
            for (var key in DEFAULTS) {
                if (DEFAULTS.hasOwnProperty(key)) {
                    _config[key] = DEFAULTS[key];
                }
            }
            if (options) {
                for (var optKey in options) {
                    if (options.hasOwnProperty(optKey)) {
                        _config[optKey] = options[optKey];
                    }
                }
            }

            // Validate required options
            if (!_config.userId) {
                error('userId is required');
                return this;
            }

            // Set current user
            _currentUser = {
                id: _config.userId,
                name: _config.userName,
                metadata: _config.userMetadata || {}
            };

            // Set up WebSocket - prefer shared Funky.WebSocket, fall back to custom
            var ws = _config.websocket;
            if (!ws && _config.useWebSocket && Funky.WebSocket) {
                ws = Funky.WebSocket;
            }
            _config._wsInstance = ws;

            // Set up WebSocket message handler
            if (ws) {
                _wsMessageHandler = handleWebSocketMessage;
                if (typeof ws.on === 'function') {
                    ws.on('message', _wsMessageHandler);
                }
            }

            // Set up reconnect handler
            setupReconnectHandler();

            _initialized = true;
            log('Initialized with user:', _currentUser.name);

            emit('init', { user: _currentUser });

            return this;
        },

        /**
         * Check if channel system is initialized
         * @returns {boolean}
         */
        isInitialized: function() {
            return _initialized;
        },

        /**
         * Get current user
         * @returns {Object|null}
         */
        getCurrentUser: function() {
            if (!_currentUser) return null;

            // Return a copy
            return {
                id: _currentUser.id,
                name: _currentUser.name,
                metadata: _currentUser.metadata || {}
            };
        },

        /**
         * Get a channel by name
         * @param {string} name - Channel name
         * @returns {Object|null} Channel info or null
         */
        getChannel: function(name) {
            var channel = _channels[name];
            if (!channel) return null;

            return {
                name: channel.name,
                members: channel.members.slice(),
                metadata: channel.metadata,
                joinedAt: channel.joinedAt,
                lastActivity: channel.lastActivity,
                status: channel.status
            };
        },

        /**
         * Get all joined channels
         * @returns {Array} Array of channel names
         */
        getJoinedChannels: function() {
            var result = [];
            for (var name in _channels) {
                if (_channels.hasOwnProperty(name) && _channels[name].status === 'joined') {
                    result.push(name);
                }
            }
            return result;
        },

        /**
         * Get count of joined channels
         * @returns {number}
         */
        getChannelCount: function() {
            return Object.keys(_channels).length;
        },

        /**
         * Register an event handler
         * Supports:
         *   - Global events: on('message', handler)
         *   - Channel-specific: on('room:123:message', handler)
         *   - Wildcard: on('*', handler) - receives all events
         * @param {string} event - Event name or 'channel:eventName' for channel-specific
         * @param {Function} handler - Callback function
         * @returns {Object} this for chaining
         */
        on: function(event, handler) {
            if (typeof handler !== 'function') {
                warn('Handler must be a function');
                return this;
            }

            // Check for wildcard
            if (event === '*') {
                _wildcardHandlers.push(handler);
                return this;
            }

            // Check for channel-specific event (e.g., "room:123:message")
            // Pattern: channel:channelName:eventName
            var parts = event.split(':');
            if (parts.length >= 3) {
                // channel:channelName:eventName format
                var channelName = parts.slice(0, -1).join(':');
                var eventName = parts[parts.length - 1];

                if (!_channelHandlers[channelName]) {
                    _channelHandlers[channelName] = {};
                }
                if (!_channelHandlers[channelName][eventName]) {
                    _channelHandlers[channelName][eventName] = [];
                }
                _channelHandlers[channelName][eventName].push(handler);
                return this;
            }

            // Global event handler
            if (!_eventHandlers[event]) {
                _eventHandlers[event] = [];
            }
            _eventHandlers[event].push(handler);

            return this;
        },

        /**
         * Register a one-time event handler
         * @param {string} event - Event name
         * @param {Function} handler - Callback function
         * @returns {Object} this for chaining
         */
        once: function(event, handler) {
            var self = this;

            var wrappedHandler = function(data) {
                self.off(event, wrappedHandler);
                handler(data);
            };

            return this.on(event, wrappedHandler);
        },

        /**
         * Remove an event handler
         * @param {string} event - Event name
         * @param {Function} handler - Callback function (optional, removes all if omitted)
         * @returns {Object} this for chaining
         */
        off: function(event, handler) {
            // Wildcard removal
            if (event === '*') {
                if (handler) {
                    _wildcardHandlers = _wildcardHandlers.filter(function(h) {
                        return h !== handler;
                    });
                } else {
                    _wildcardHandlers = [];
                }
                return this;
            }

            // Channel-specific event
            var parts = event.split(':');
            if (parts.length >= 3) {
                var channelName = parts.slice(0, -1).join(':');
                var eventName = parts[parts.length - 1];

                if (_channelHandlers[channelName] && _channelHandlers[channelName][eventName]) {
                    if (handler) {
                        _channelHandlers[channelName][eventName] =
                            _channelHandlers[channelName][eventName].filter(function(h) {
                                return h !== handler;
                            });
                    } else {
                        delete _channelHandlers[channelName][eventName];
                    }
                }
                return this;
            }

            // Global event
            if (_eventHandlers[event]) {
                if (handler) {
                    _eventHandlers[event] = _eventHandlers[event].filter(function(h) {
                        return h !== handler;
                    });
                } else {
                    delete _eventHandlers[event];
                }
            }

            return this;
        },

        /**
         * Remove all event handlers for a channel
         * @param {string} channelName - Channel name
         * @returns {Object} this for chaining
         */
        offChannel: function(channelName) {
            delete _channelHandlers[channelName];
            return this;
        },

        /**
         * Get buffered messages for a channel
         * @param {string} channel - Channel name
         * @returns {Array}
         */
        getBuffer: function(channel) {
            return getBufferedMessages(channel);
        },

        /**
         * Clear message buffer
         * @param {string} channel - Channel name (optional, clears all if omitted)
         * @returns {Object} this for chaining
         */
        clearBuffer: function(channel) {
            clearMessageBuffer(channel);
            return this;
        },

        // =========================================================================
        // CHANNEL MEMBERSHIP (Phase 2)
        // =========================================================================

        /**
         * Join a channel
         * @param {string} channelName - Channel name
         * @param {Object} options - Join options
         * @param {Object} options.metadata - Custom metadata
         * @param {Function} options.onJoin - Callback when joined
         * @returns {Object} this for chaining
         */
        join: function(channelName, options) {
            var self = this;

            if (!_initialized) {
                warn('Not initialized');
                return this;
            }

            if (!channelName || typeof channelName !== 'string') {
                error('Invalid channel name');
                return this;
            }

            options = options || {};

            // Check max channels limit
            if (Object.keys(_channels).length >= _config.maxChannels) {
                error('Maximum channel limit reached: ' + _config.maxChannels);
                return this;
            }

            // Already in channel?
            if (_channels[channelName]) {
                var existingChannel = _channels[channelName];
                if (existingChannel.status === 'joined' || existingChannel.status === 'joining') {
                    log('Already in channel:', channelName);

                    // Call onJoin callback immediately if already joined
                    if (options.onJoin && existingChannel.status === 'joined') {
                        try {
                            options.onJoin(existingChannel.members.slice());
                        } catch (e) {
                            error('onJoin callback error: ' + e.message);
                        }
                    }

                    return this;
                }
            }

            // Create channel state
            var channelState = new ChannelState(channelName, options);
            _channels[channelName] = channelState;

            // Store onJoin callback if provided
            if (options.onJoin) {
                var handler = function(data) {
                    if (data.channel === channelName) {
                        try {
                            options.onJoin(data.members);
                        } catch (e) {
                            error('onJoin callback error: ' + e.message);
                        }
                        self.off('joined', handler);
                    }
                };
                this.on('joined', handler);
            }

            // Send join message
            sendMessage('channel:join', {
                channel: channelName,
                userId: _config.userId,
                userName: _config.userName,
                metadata: options.metadata || {}
            });

            log('Joining channel:', channelName);

            return this;
        },

        /**
         * Leave a channel
         * @param {string} channelName - Channel name
         * @returns {Object} this for chaining
         */
        leave: function(channelName) {
            if (!_initialized) return this;

            if (!channelName || !_channels[channelName]) {
                return this;
            }

            var channelState = _channels[channelName];
            channelState.status = 'leaving';

            // Send leave message
            sendMessage('channel:leave', {
                channel: channelName,
                userId: _config.userId
            });

            // Remove subscriptions
            delete _subscriptions[channelName];

            // Clear buffer
            clearMessageBuffer(channelName);

            // Remove channel state
            delete _channels[channelName];

            log('Left channel:', channelName);

            emit('left', {
                channel: channelName,
                user: _currentUser
            });

            return this;
        },

        /**
         * Leave all channels
         * @returns {Object} this for chaining
         */
        leaveAll: function() {
            var channelNames = Object.keys(_channels);
            for (var i = 0; i < channelNames.length; i++) {
                this.leave(channelNames[i]);
            }
            return this;
        },

        // =========================================================================
        // MEMBER QUERIES (Phase 2)
        // =========================================================================

        /**
         * Get all members in a channel
         * @param {string} channelName - Channel name
         * @returns {Array} Array of member objects
         */
        getMembers: function(channelName) {
            if (!_channels[channelName]) return [];

            var members = _channels[channelName].members;
            var result = [];
            for (var i = 0; i < members.length; i++) {
                result.push({
                    id: members[i].id,
                    name: members[i].name,
                    metadata: members[i].metadata || {},
                    joinedAt: members[i].joinedAt
                });
            }
            return result;
        },

        /**
         * Get other members in a channel (excluding self)
         * @param {string} channelName - Channel name
         * @returns {Array}
         */
        getOtherMembers: function(channelName) {
            if (!_channels[channelName]) return [];

            var members = _channels[channelName].members;
            var result = [];
            for (var i = 0; i < members.length; i++) {
                if (members[i].id !== _config.userId) {
                    result.push({
                        id: members[i].id,
                        name: members[i].name,
                        metadata: members[i].metadata || {},
                        joinedAt: members[i].joinedAt
                    });
                }
            }
            return result;
        },

        /**
         * Get member count in a channel
         * @param {string} channelName - Channel name
         * @param {boolean} excludeSelf - Exclude current user from count
         * @returns {number}
         */
        getMemberCount: function(channelName, excludeSelf) {
            if (!_channels[channelName]) return 0;

            var count = _channels[channelName].members.length;
            if (excludeSelf) {
                var hasSelf = _channels[channelName].getMember(_config.userId);
                if (hasSelf) {
                    count = Math.max(0, count - 1);
                }
            }
            return count;
        },

        /**
         * Get a specific member from a channel
         * @param {string} channelName - Channel name
         * @param {string} memberId - Member ID
         * @returns {Object|null}
         */
        getMember: function(channelName, memberId) {
            if (!_channels[channelName]) return null;

            var member = _channels[channelName].getMember(memberId);
            if (!member) return null;

            return {
                id: member.id,
                name: member.name,
                metadata: member.metadata || {},
                joinedAt: member.joinedAt
            };
        },

        /**
         * Check if a specific member is in a channel
         * @param {string} channelName - Channel name
         * @param {string} memberId - Member ID
         * @returns {boolean}
         */
        hasMember: function(channelName, memberId) {
            if (!_channels[channelName]) return false;
            return _channels[channelName].getMember(memberId) !== null;
        },

        // =========================================================================
        // CHANNEL QUERIES (Phase 2)
        // =========================================================================

        /**
         * Check if currently joined to a channel
         * @param {string} channelName - Channel name
         * @returns {boolean}
         */
        isJoined: function(channelName) {
            var channelState = _channels[channelName];
            return !!(channelState && channelState.status === 'joined');
        },

        /**
         * Check if currently joining a channel
         * @param {string} channelName - Channel name
         * @returns {boolean}
         */
        isJoining: function(channelName) {
            var channelState = _channels[channelName];
            return !!(channelState && channelState.status === 'joining');
        },

        /**
         * Get all joined channel names
         * @returns {Array}
         */
        getJoined: function() {
            var result = [];
            for (var name in _channels) {
                if (_channels.hasOwnProperty(name) && _channels[name].status === 'joined') {
                    result.push(name);
                }
            }
            return result;
        },

        /**
         * Get all channel states
         * @returns {Object}
         */
        getAll: function() {
            var result = {};
            for (var name in _channels) {
                if (_channels.hasOwnProperty(name)) {
                    result[name] = {
                        name: name,
                        status: _channels[name].status,
                        memberCount: _channels[name].members.length,
                        joinedAt: _channels[name].joinedAt,
                        lastActivity: _channels[name].lastActivity
                    };
                }
            }
            return result;
        },

        /**
         * Get channel metadata
         * @param {string} channelName - Channel name
         * @returns {Object|null}
         */
        getMetadata: function(channelName) {
            if (!_channels[channelName]) return null;

            var metadata = _channels[channelName].metadata;
            var result = {};
            for (var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    result[key] = metadata[key];
                }
            }
            return result;
        },

        /**
         * Update channel metadata
         * @param {string} channelName - Channel name
         * @param {Object} metadata - Metadata to merge
         * @returns {Object} this for chaining
         */
        setMetadata: function(channelName, metadata) {
            if (!_channels[channelName]) return this;

            var existing = _channels[channelName].metadata || {};
            var merged = {};

            // Copy existing
            for (var key in existing) {
                if (existing.hasOwnProperty(key)) {
                    merged[key] = existing[key];
                }
            }

            // Merge new
            if (metadata) {
                for (var newKey in metadata) {
                    if (metadata.hasOwnProperty(newKey)) {
                        merged[newKey] = metadata[newKey];
                    }
                }
            }

            _channels[channelName].metadata = merged;

            return this;
        },

        // =========================================================================
        // CHANNEL MESSAGING - PUBLISH (Phase 3)
        // =========================================================================

        /**
         * Publish a message to a channel
         * @param {string} channelName - Channel name
         * @param {Object} message - Message to publish
         * @param {Object} options - Publish options
         * @param {boolean} options.ack - Request acknowledgment
         * @param {boolean} options.echo - Echo message back to sender
         * @param {string} options.target - Target specific member ID
         * @returns {Object|boolean} Message ID if ack requested, true/false otherwise
         */
        publish: function(channelName, message, options) {
            if (!_initialized) {
                warn('Not initialized');
                return false;
            }

            if (!channelName || !_channels[channelName]) {
                warn('Not joined to channel: ' + channelName);
                return false;
            }

            if (_channels[channelName].status !== 'joined') {
                warn('Channel not ready: ' + channelName);
                return false;
            }

            options = options || {};

            var messageId = null;
            if (options.ack) {
                messageId = generateMessageId();
            }

            var payload = {
                channel: channelName,
                message: message,
                userId: _config.userId,
                timestamp: new Date().toISOString()
            };

            if (messageId) {
                payload.messageId = messageId;
                payload.ack = true;
            }

            if (options.echo) {
                payload.echo = true;
            }

            if (options.target) {
                payload.target = options.target;
            }

            var sent = sendMessage('channel:publish', payload);

            if (sent) {
                // Update channel activity
                _channels[channelName].updateActivity();

                log('Published to', channelName, message);

                // If echo, trigger local handlers immediately
                if (options.echo) {
                    handleChannelMessage({
                        type: 'channel:message',
                        channel: channelName,
                        message: message,
                        sender: _currentUser,
                        local: true
                    });
                }
            }

            return options.ack ? messageId : sent;
        },

        /**
         * Broadcast to all joined channels
         * @param {Object} message - Message to broadcast
         * @param {Object} options - Publish options
         * @returns {Object} Results keyed by channel
         */
        broadcast: function(message, options) {
            var self = this;
            var results = {};
            var joined = this.getJoined();

            for (var i = 0; i < joined.length; i++) {
                results[joined[i]] = self.publish(joined[i], message, options);
            }

            return results;
        },

        /**
         * Send a direct message to a specific member in a channel
         * @param {string} channelName - Channel name
         * @param {string} memberId - Target member ID
         * @param {Object} message - Message to send
         * @returns {boolean}
         */
        sendTo: function(channelName, memberId, message) {
            return this.publish(channelName, message, { target: memberId });
        },

        // =========================================================================
        // CHANNEL MESSAGING - SUBSCRIBE (Phase 3)
        // =========================================================================

        /**
         * Subscribe to messages on a channel
         * @param {string} channelName - Channel name
         * @param {Function} callback - Callback function(message, sender)
         * @param {Object} options - Subscribe options
         * @param {string} options.type - Filter by message type
         * @param {string} options.from - Filter by sender ID
         * @returns {Object} Subscription reference for unsubscribe
         */
        subscribe: function(channelName, callback, options) {
            if (!_initialized) {
                warn('Not initialized');
                return null;
            }

            if (typeof callback !== 'function') {
                error('Callback must be a function');
                return null;
            }

            options = options || {};

            // Create subscription object
            var subscription = {
                id: generateSubscriptionId(),
                channel: channelName,
                callback: callback,
                options: options,
                createdAt: new Date().toISOString(),
                active: true
            };

            // Wrap callback with filters
            subscription.handler = function(message, sender) {
                if (!subscription.active) return;

                // Apply filters
                if (options.type && (!message || message.type !== options.type)) return;
                if (options.from && (!sender || sender.id !== options.from)) return;

                try {
                    callback(message, sender);
                } catch (e) {
                    error('Subscription callback error: ' + e.message);
                }
            };

            // Add to subscriptions
            if (!_subscriptions[channelName]) {
                _subscriptions[channelName] = [];
            }
            _subscriptions[channelName].push(subscription);

            log('Subscribed to', channelName, 'subscription:', subscription.id);

            return subscription;
        },

        /**
         * Unsubscribe from a channel
         * @param {Object} subscription - Subscription reference from subscribe()
         * @returns {Object} this for chaining
         */
        unsubscribe: function(subscription) {
            if (!subscription || !subscription.channel) return this;

            subscription.active = false;

            var subs = _subscriptions[subscription.channel];
            if (subs) {
                _subscriptions[subscription.channel] = subs.filter(function(s) {
                    return s.id !== subscription.id;
                });
            }

            log('Unsubscribed:', subscription.id);

            return this;
        },

        /**
         * Unsubscribe all from a channel
         * @param {string} channelName - Channel name (optional, unsubscribes from all if omitted)
         * @returns {Object} this for chaining
         */
        unsubscribeAll: function(channelName) {
            if (channelName) {
                // Mark all as inactive
                var subs = _subscriptions[channelName];
                if (subs) {
                    for (var i = 0; i < subs.length; i++) {
                        subs[i].active = false;
                    }
                }
                delete _subscriptions[channelName];
            } else {
                // Unsubscribe from all channels
                for (var ch in _subscriptions) {
                    if (_subscriptions.hasOwnProperty(ch)) {
                        var channelSubs = _subscriptions[ch];
                        for (var j = 0; j < channelSubs.length; j++) {
                            channelSubs[j].active = false;
                        }
                    }
                }
                _subscriptions = {};
            }
            return this;
        },

        /**
         * Subscribe to a specific message type
         * @param {string} channelName - Channel name
         * @param {string} type - Message type
         * @param {Function} callback - Callback function
         * @returns {Object} Subscription reference
         */
        subscribeType: function(channelName, type, callback) {
            return this.subscribe(channelName, callback, { type: type });
        },

        /**
         * Subscribe once (auto-unsubscribe after first message)
         * @param {string} channelName - Channel name
         * @param {Function} callback - Callback function
         * @param {Object} options - Subscribe options
         * @returns {Object} Subscription reference
         */
        subscribeOnce: function(channelName, callback, options) {
            var self = this;
            var subscription;

            var wrappedCallback = function(message, sender) {
                self.unsubscribe(subscription);
                callback(message, sender);
            };

            subscription = this.subscribe(channelName, wrappedCallback, options);
            return subscription;
        },

        // =========================================================================
        // REQUEST/RESPONSE PATTERN (Phase 3)
        // =========================================================================

        /**
         * Send a request and wait for response
         * @param {string} channelName - Channel name
         * @param {Object} requestMessage - Request message
         * @param {Object} options - Options
         * @param {number} options.timeout - Timeout in ms (default: 10000)
         * @returns {Promise}
         */
        request: function(channelName, requestMessage, options) {
            var self = this;
            options = options || {};
            var timeout = options.timeout || 10000;

            return new Promise(function(resolve, reject) {
                var requestId = generateMessageId();

                // Store pending request
                _pendingRequests[requestId] = {
                    resolve: resolve,
                    reject: reject,
                    timeout: setTimeout(function() {
                        delete _pendingRequests[requestId];
                        reject(new Error('Request timeout'));
                    }, timeout)
                };

                // Build request message
                var msgWithId = {};
                for (var key in requestMessage) {
                    if (requestMessage.hasOwnProperty(key)) {
                        msgWithId[key] = requestMessage[key];
                    }
                }
                msgWithId._requestId = requestId;
                msgWithId._isRequest = true;

                // Send request
                var sent = self.publish(channelName, msgWithId);

                if (!sent) {
                    clearTimeout(_pendingRequests[requestId].timeout);
                    delete _pendingRequests[requestId];
                    reject(new Error('Failed to send request'));
                }
            });
        },

        /**
         * Send a response to a request
         * @param {string} channelName - Channel name
         * @param {string} requestId - Request ID from incoming message
         * @param {Object} responseMessage - Response data
         * @returns {boolean}
         */
        respond: function(channelName, requestId, responseMessage) {
            var msgWithId = {};
            for (var key in responseMessage) {
                if (responseMessage.hasOwnProperty(key)) {
                    msgWithId[key] = responseMessage[key];
                }
            }
            msgWithId._requestId = requestId;
            msgWithId._isResponse = true;

            return this.publish(channelName, msgWithId);
        },

        /**
         * Get subscriptions for a channel
         * @param {string} channelName - Channel name
         * @returns {Array} Array of subscription info
         */
        getSubscriptions: function(channelName) {
            if (!channelName) {
                // Return all subscriptions
                var all = [];
                for (var ch in _subscriptions) {
                    if (_subscriptions.hasOwnProperty(ch)) {
                        for (var i = 0; i < _subscriptions[ch].length; i++) {
                            var s = _subscriptions[ch][i];
                            all.push({
                                id: s.id,
                                channel: s.channel,
                                active: s.active,
                                createdAt: s.createdAt
                            });
                        }
                    }
                }
                return all;
            }

            var subs = _subscriptions[channelName] || [];
            var result = [];
            for (var j = 0; j < subs.length; j++) {
                result.push({
                    id: subs[j].id,
                    channel: subs[j].channel,
                    active: subs[j].active,
                    createdAt: subs[j].createdAt
                });
            }
            return result;
        },

        // =========================================================================
        // EVENTS SYSTEM (Phase 4)
        // =========================================================================

        /**
         * Delegate channel events to a DOM element
         * @param {string} channelName - Channel name
         * @param {Element|string} element - DOM element or selector
         * @param {Object} options - Delegation options
         * @param {Array} options.events - Events to delegate (default: join, leave, message, sync)
         * @returns {Object} Delegation reference for removal
         */
        delegate: function(channelName, element, options) {
            var self = this;
            options = options || {};

            var el = typeof element === 'string'
                ? document.querySelector(element)
                : element;

            if (!el) {
                warn('Delegation element not found');
                return null;
            }

            var events = options.events || ['join', 'leave', 'message', 'sync'];
            var handlers = {};

            for (var i = 0; i < events.length; i++) {
                (function(event) {
                    handlers[event] = function(data) {
                        if (data.channel !== channelName) return;

                        // Dispatch DOM event on element
                        var domEvent = new CustomEvent('funky.channel.' + event, {
                            detail: data,
                            bubbles: true,
                            cancelable: true
                        });

                        el.dispatchEvent(domEvent);
                    };

                    self.on(event, handlers[event]);
                })(events[i]);
            }

            var delegation = {
                channel: channelName,
                element: el,
                handlers: handlers,
                remove: function() {
                    for (var j = 0; j < events.length; j++) {
                        self.off(events[j], handlers[events[j]]);
                    }
                }
            };

            return delegation;
        },

        /**
         * Wait for a specific event
         * @param {string} event - Event name
         * @param {Object} options - Options
         * @param {number} options.timeout - Timeout in ms (default: 30000)
         * @param {Function} options.filter - Filter function to match specific events
         * @returns {Promise}
         */
        waitFor: function(event, options) {
            var self = this;
            options = options || {};
            var timeout = options.timeout || 30000;

            return new Promise(function(resolve, reject) {
                var timeoutId;

                var handler = function(data) {
                    // Apply filter if provided
                    if (options.filter && !options.filter(data)) {
                        return;
                    }

                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    self.off(event, handler);
                    resolve(data);
                };

                self.on(event, handler);

                if (timeout > 0) {
                    timeoutId = setTimeout(function() {
                        self.off(event, handler);
                        reject(new Error('Timeout waiting for event: ' + event));
                    }, timeout);
                }
            });
        },

        /**
         * Wait until joined a channel
         * @param {string} channelName - Channel name
         * @param {number} timeout - Timeout in ms (default: 10000)
         * @returns {Promise}
         */
        whenJoined: function(channelName, timeout) {
            var self = this;

            // Already joined?
            if (this.isJoined(channelName)) {
                return Promise.resolve(this.getMembers(channelName));
            }

            return this.waitFor('joined', {
                timeout: timeout || 10000,
                filter: function(data) {
                    return data.channel === channelName;
                }
            }).then(function(data) {
                return data.members;
            });
        },

        // =========================================================================
        // DEBUG HELPERS (Phase 4)
        // =========================================================================

        /**
         * Enable/disable debug mode
         * @param {boolean} enabled
         * @returns {Object} this for chaining
         */
        debug: function(enabled) {
            _config.debug = enabled !== false;
            return this;
        },

        /**
         * Get event listener counts
         * @returns {Object}
         */
        getListenerCounts: function() {
            var counts = {
                global: {},
                channel: {},
                wildcard: _wildcardHandlers.length
            };

            var event, ch;

            for (event in _eventHandlers) {
                if (_eventHandlers.hasOwnProperty(event)) {
                    counts.global[event] = _eventHandlers[event].length;
                }
            }

            for (ch in _channelHandlers) {
                if (_channelHandlers.hasOwnProperty(ch)) {
                    counts.channel[ch] = {};
                    for (event in _channelHandlers[ch]) {
                        if (_channelHandlers[ch].hasOwnProperty(event)) {
                            counts.channel[ch][event] = _channelHandlers[ch][event].length;
                        }
                    }
                }
            }

            return counts;
        },

        /**
         * Destroy the channel system
         * Cleans up all state, subscriptions, and event handlers
         */
        destroy: function() {
            if (!_initialized) return;

            log('Destroying');

            // Leave all channels (send leave messages)
            var channelNames = Object.keys(_channels);
            for (var i = 0; i < channelNames.length; i++) {
                sendMessage('channel:leave', {
                    channel: channelNames[i],
                    userId: _config.userId
                });
            }

            // Remove WebSocket message handler
            var ws = _config._wsInstance || _config.websocket;
            if (ws && _wsMessageHandler) {
                if (typeof ws.off === 'function') {
                    ws.off('message', _wsMessageHandler);
                }
            }
            _config._wsInstance = null;

            // Clear pending requests
            for (var reqId in _pendingRequests) {
                if (_pendingRequests.hasOwnProperty(reqId)) {
                    clearTimeout(_pendingRequests[reqId].timeout);
                    _pendingRequests[reqId].reject(new Error('Channel destroyed'));
                }
            }
            _pendingRequests = {};

            // Clear state
            _channels = {};
            _subscriptions = {};
            _eventHandlers = {};
            _channelHandlers = {};
            _wildcardHandlers = [];
            _messageBuffer = {};
            _currentUser = null;
            _wsMessageHandler = null;
            _messageIdCounter = 0;
            _subscriptionIdCounter = 0;
            _initialized = false;

            emit('destroy', {});

            log('Destroyed');
        }
    };

    // =========================================================================
    // EVENT TYPES CONSTANT
    // =========================================================================

    /**
     * Event type constants for type-safe event handling
     */
    Channel.EVENTS = {
        // Lifecycle events
        INIT: 'init',
        DESTROY: 'destroy',

        // Channel events
        JOINED: 'joined',       // Current user joined channel
        LEFT: 'left',           // Current user left channel
        JOIN: 'join',           // Another member joined
        LEAVE: 'leave',         // Another member left
        SYNC: 'sync',           // Member list synced

        // Message events
        MESSAGE: 'message',
        ERROR: 'error',

        // Connection events
        RECONNECT: 'reconnect',
        DISCONNECT: 'disconnect'
    };

    // =========================================================================
    // EXPORT
    // =========================================================================

    if (Funky.register) {
        Funky.register('Channel', Channel);
    }

})(window);
