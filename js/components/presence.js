/**
 * Presence - Real-time user presence system
 *
 * Orchestrates IdleDetector, Channel, and TypingIndicator to provide
 * a unified presence system for tracking online users, typing indicators,
 * and page presence with real-time updates.
 *
 * This is an ORCHESTRATION LAYER - it coordinates existing components
 * rather than reimplementing their functionality.
 *
 * @namespace Funky.Presence
 * @requires Funky.IdleDetector (core)
 * @requires Funky.Channel (component)
 * @requires Funky.TypingIndicator (component)
 * @optional Funky.AvatarStack (component)
 * @optional Funky.SPA (for auto page-channel join/leave)
 */
(function(global) {
    'use strict';

    var Funky = global.Funky || {};

    // Registry guard - prevent double registration
    if (Funky.isRegistered && Funky.isRegistered('Presence')) {
        return;
    }

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================

    var _initialized = false;
    var _config = {};
    var _currentUser = null;
    var _channels = {};           // { channelName: PresenceChannelState }
    var _heartbeatTimer = null;
    var _eventHandlers = {};      // { eventName: [callbacks] }
    var _idleSubscriptions = [];  // IdleDetector event subscriptions
    var _channelSubscriptions = []; // Channel event subscriptions
    var _spaSubscription = null;  // SPA navigation subscription
    var _currentPageChannel = null; // Current page channel for SPA tracking
    var _typingInputBindings = [];  // Array of typing input bindings
    var _uiComponents = [];         // Array of UI component instances

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    var STATUS = {
        ONLINE: 'online',
        AWAY: 'away',
        IDLE: 'idle',
        BUSY: 'busy',
        OFFLINE: 'offline'
    };

    var ACTIVITY_STATUS = {
        VIEWING: 'viewing',
        EDITING: 'editing',
        TYPING: 'typing'
    };

    // =========================================================================
    // DEFAULT OPTIONS
    // =========================================================================

    var DEFAULTS = {
        userId: null,
        userName: 'Anonymous',
        userAvatar: null,
        userMetadata: {},
        heartbeatInterval: 30000,   // 30 seconds
        autoJoinPage: true,         // Auto-join page channel on init
        autoTrackNavigation: true,  // Auto-join/leave on SPA navigation
        channelPrefix: 'presence:', // Prefix for presence channels
        typingTimeout: 3000,        // Auto-stop typing after 3s
        typingDebounce: 300,        // Debounce typing input events
        autoBindTypingInputs: true, // Auto-bind data-presence-input elements
        autoInitUI: true,           // Auto-init UI from data attributes
        maxAvatars: 5,              // Max avatars in stack before overflow
        defaultAvatar: null,        // Default avatar URL
        debug: false
    };

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    function log() {
        if (_config.debug) {
            console.log.apply(console, ['[Presence]'].concat(Array.prototype.slice.call(arguments)));
        }
    }

    function getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Emit event to handlers and PubSub
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    function emit(event, data) {
        data = data || {};

        // Call registered handlers
        var handlers = _eventHandlers[event];
        if (handlers) {
            for (var i = 0; i < handlers.length; i++) {
                try {
                    handlers[i](data);
                } catch (e) {
                    console.error('[Presence] Event handler error:', e);
                }
            }
        }

        // Emit via PubSub (colon notation)
        if (Funky.PubSub) {
            Funky.PubSub.emit('funky:presence:' + event, data);
        }

        // Emit DOM event (dot notation)
        if (Funky.Events && Funky.Events.emit) {
            Funky.Events.emit(document, 'funky.presence.' + event, data);
        }

        log('Event:', event, data);
    }

    /**
     * Get presence channel name for a page path
     * @param {string} path - Page path
     * @returns {string}
     */
    function getPageChannel(path) {
        return _config.channelPrefix + 'page:' + (path || window.location.pathname);
    }

    // =========================================================================
    // PRESENCE CHANNEL STATE
    // =========================================================================

    /**
     * Presence channel state object
     * @param {string} name - Channel name
     * @param {Object} options - Join options
     */
    function PresenceChannelState(name, options) {
        options = options || {};
        this.name = name;
        this.status = options.status || ACTIVITY_STATUS.VIEWING;
        this.metadata = options.metadata || {};
        this.joinedAt = getCurrentTimestamp();
        this.typingIndicator = null;  // TypingIndicator instance for this channel
    }

    // =========================================================================
    // IDLE DETECTOR INTEGRATION
    // =========================================================================

    /**
     * Set up IdleDetector event listeners
     * @private
     */
    function setupIdleDetectorIntegration() {
        var IdleDetector = Funky.IdleDetector;
        if (!IdleDetector) {
            log('IdleDetector not available - status broadcasting disabled');
            return;
        }

        // Listen for idle state changes and broadcast to all channels
        var onIdle = function(data) {
            log('IdleDetector: idle');
            broadcastStatus(STATUS.IDLE);
            emit('idle', { user: _currentUser });
        };

        var onActive = function(data) {
            log('IdleDetector: active');
            broadcastStatus(STATUS.ONLINE);
            emit('active', { user: _currentUser });
        };

        var onAway = function(data) {
            log('IdleDetector: away');
            broadcastStatus(STATUS.AWAY);
            emit('away', { user: _currentUser });
        };

        // Subscribe to IdleDetector events
        IdleDetector.on('idle', onIdle);
        IdleDetector.on('active', onActive);
        IdleDetector.on('away', onAway);

        // Store for cleanup
        _idleSubscriptions.push({ event: 'idle', handler: onIdle });
        _idleSubscriptions.push({ event: 'active', handler: onActive });
        _idleSubscriptions.push({ event: 'away', handler: onAway });
    }

    /**
     * Clean up IdleDetector subscriptions
     * @private
     */
    function cleanupIdleDetectorIntegration() {
        var IdleDetector = Funky.IdleDetector;
        if (!IdleDetector) return;

        for (var i = 0; i < _idleSubscriptions.length; i++) {
            var sub = _idleSubscriptions[i];
            IdleDetector.off(sub.event, sub.handler);
        }
        _idleSubscriptions = [];
    }

    // =========================================================================
    // CHANNEL INTEGRATION
    // =========================================================================

    /**
     * Set up Channel event listeners
     * @private
     */
    function setupChannelIntegration() {
        var Channel = Funky.Channel;
        if (!Channel) {
            log('Channel not available - real-time features disabled');
            return;
        }

        // Listen for channel member events
        var onMemberJoin = function(data) {
            // Only forward events for presence channels we're tracking
            if (_channels[data.channel]) {
                emit('user:join', {
                    channel: data.channel,
                    user: data.member
                });
            }
        };

        var onMemberLeave = function(data) {
            if (_channels[data.channel]) {
                emit('user:leave', {
                    channel: data.channel,
                    user: data.member
                });
            }
        };

        var onMessage = function(data) {
            // Handle presence-specific messages
            if (data.event === 'presence:status' && _channels[data.channel]) {
                var channelState = _channels[data.channel];
                emit('user:status', {
                    channel: data.channel,
                    userId: data.payload.userId,
                    status: data.payload.status
                });
            }
        };

        Channel.on('member:join', onMemberJoin);
        Channel.on('member:leave', onMemberLeave);
        Channel.on('message', onMessage);

        _channelSubscriptions.push({ event: 'member:join', handler: onMemberJoin });
        _channelSubscriptions.push({ event: 'member:leave', handler: onMemberLeave });
        _channelSubscriptions.push({ event: 'message', handler: onMessage });
    }

    /**
     * Clean up Channel subscriptions
     * @private
     */
    function cleanupChannelIntegration() {
        var Channel = Funky.Channel;
        if (!Channel) return;

        for (var i = 0; i < _channelSubscriptions.length; i++) {
            var sub = _channelSubscriptions[i];
            Channel.off(sub.event, sub.handler);
        }
        _channelSubscriptions = [];
    }

    // =========================================================================
    // SPA INTEGRATION
    // =========================================================================

    /**
     * Set up SPA navigation tracking
     * @private
     */
    function setupSPAIntegration() {
        if (!_config.autoTrackNavigation) return;

        var SPA = Funky.SPA;
        if (!SPA) {
            log('SPA not available - navigation tracking disabled');
            return;
        }

        var onNavigate = function(data) {
            var newPath = data.path || data.url || window.location.pathname;
            var newChannel = getPageChannel(newPath);

            // Leave old channel
            if (_currentPageChannel && _currentPageChannel !== newChannel) {
                Presence.leave(_currentPageChannel);
            }

            // Join new channel
            _currentPageChannel = newChannel;
            Presence.join(newChannel, { status: ACTIVITY_STATUS.VIEWING });

            log('SPA navigation:', _currentPageChannel);
        };

        // Subscribe via PubSub
        if (Funky.PubSub) {
            _spaSubscription = Funky.PubSub.on('funky:spa:navigate', onNavigate);
        }
    }

    /**
     * Clean up SPA integration
     * @private
     */
    function cleanupSPAIntegration() {
        if (_spaSubscription && Funky.PubSub && Funky.PubSub.off) {
            Funky.PubSub.off('funky:spa:navigate', _spaSubscription);
            _spaSubscription = null;
        }
    }

    // =========================================================================
    // HEARTBEAT SYSTEM
    // =========================================================================

    /**
     * Start heartbeat timer
     * @private
     */
    function startHeartbeat() {
        if (_heartbeatTimer) {
            clearInterval(_heartbeatTimer);
        }

        // Send initial heartbeat
        sendHeartbeat();

        _heartbeatTimer = setInterval(function() {
            sendHeartbeat();
        }, _config.heartbeatInterval);
    }

    /**
     * Send heartbeat to all channels
     * @private
     */
    function sendHeartbeat() {
        var Channel = Funky.Channel;
        if (!Channel) return;

        var status = getIdleStatus();
        var channels = Object.keys(_channels);

        for (var i = 0; i < channels.length; i++) {
            Channel.publish(channels[i], 'presence:heartbeat', {
                userId: _config.userId,
                status: status,
                timestamp: getCurrentTimestamp()
            });
        }

        log('Heartbeat sent to', channels.length, 'channels');
    }

    /**
     * Stop heartbeat timer
     * @private
     */
    function stopHeartbeat() {
        if (_heartbeatTimer) {
            clearInterval(_heartbeatTimer);
            _heartbeatTimer = null;
        }
    }

    // =========================================================================
    // STATUS HELPERS
    // =========================================================================

    /**
     * Get current status from IdleDetector
     * @returns {string}
     */
    function getIdleStatus() {
        var IdleDetector = Funky.IdleDetector;
        if (!IdleDetector || !IdleDetector.isInitialized || !IdleDetector.isInitialized()) {
            return STATUS.ONLINE;
        }

        var state = IdleDetector.getState();
        switch (state) {
            case 'idle': return STATUS.IDLE;
            case 'away': return STATUS.AWAY;
            default: return STATUS.ONLINE;
        }
    }

    /**
     * Broadcast status to all joined channels
     * @param {string} status - Status to broadcast
     * @private
     */
    function broadcastStatus(status) {
        var Channel = Funky.Channel;
        if (!Channel) return;

        var channels = Object.keys(_channels);

        for (var i = 0; i < channels.length; i++) {
            Channel.publish(channels[i], 'presence:status', {
                userId: _config.userId,
                status: status,
                timestamp: getCurrentTimestamp()
            });
        }

        // Update current user
        if (_currentUser) {
            _currentUser.status = status;
        }

        log('Broadcast status:', status, 'to', channels.length, 'channels');
    }

    // =========================================================================
    // TYPING INPUT AUTO-BINDING
    // =========================================================================

    /**
     * Auto-bind inputs with data-presence-input attribute
     * @private
     */
    function autoBindTypingInputs() {
        if (!_config.autoBindTypingInputs) return;

        var inputs = document.querySelectorAll('[data-presence-input]');

        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var channel = input.getAttribute('data-presence-channel');
            if (!channel) {
                console.warn('[Presence] data-presence-input missing data-presence-channel');
                continue;
            }

            var debounce = parseInt(input.getAttribute('data-presence-debounce'), 10) || _config.typingDebounce;

            Presence.bindTypingInput(channel, input, { debounce: debounce });
        }
    }

    /**
     * Clean up all typing input bindings
     * @private
     */
    function cleanupTypingInputBindings() {
        for (var i = 0; i < _typingInputBindings.length; i++) {
            var binding = _typingInputBindings[i];
            if (binding.element) {
                binding.element.removeEventListener('input', binding.onInput);
                binding.element.removeEventListener('blur', binding.onBlur);
                binding.element.removeEventListener('keydown', binding.onKeydown);
            }
            if (binding.debounceTimer) {
                clearTimeout(binding.debounceTimer);
            }
        }
        _typingInputBindings = [];
    }

    // =========================================================================
    // UI COMPONENT REGISTRY
    // =========================================================================

    /**
     * Register a UI component for automatic updates
     * @param {Element} element - DOM element
     * @param {string} type - Component type
     * @param {string} channel - Channel to watch ('*' for all)
     * @param {Function} updateFn - Update function
     * @private
     */
    function registerUIComponent(element, type, channel, updateFn) {
        _uiComponents.push({
            element: element,
            type: type,
            channel: channel,
            update: updateFn
        });
    }

    /**
     * Unregister a UI component
     * @param {Element} element - DOM element
     * @private
     */
    function unregisterUIComponent(element) {
        _uiComponents = _uiComponents.filter(function(c) {
            return c.element !== element;
        });
    }

    /**
     * Update all UI components for a channel
     * @param {string} channel - Channel name
     * @private
     */
    function updateUIComponents(channel) {
        for (var i = 0; i < _uiComponents.length; i++) {
            var component = _uiComponents[i];
            if (component.channel === channel || component.channel === '*') {
                try {
                    component.update();
                } catch (e) {
                    console.error('[Presence] UI component update error:', e);
                }
            }
        }
    }

    /**
     * Set up event hooks for automatic UI updates
     * @private
     */
    function setupUIEventHooks() {
        Presence.on('user:join', function(data) {
            updateUIComponents(data.channel);
        });

        Presence.on('user:leave', function(data) {
            updateUIComponents(data.channel);
        });

        Presence.on('user:status', function(data) {
            updateUIComponents(data.channel);
        });

        Presence.on('status', function() {
            // Update all components when local status changes
            for (var i = 0; i < _uiComponents.length; i++) {
                try {
                    _uiComponents[i].update();
                } catch (e) {
                    console.error('[Presence] UI update error:', e);
                }
            }
        });
    }

    /**
     * Auto-initialize UI components from data attributes
     * @private
     */
    function autoInitUIComponents() {
        if (!_config.autoInitUI) return;

        var D = Funky.Dom;
        if (!D) {
            log('Funky.Dom not available - UI auto-init disabled');
            return;
        }

        // Avatar stacks
        var avatarEls = document.querySelectorAll('[data-presence-avatars]');
        for (var i = 0; i < avatarEls.length; i++) {
            var el = avatarEls[i];
            var channel = el.getAttribute('data-presence-channel');
            if (channel) {
                Presence.createAvatarStack(el, channel, {
                    maxAvatars: parseInt(el.getAttribute('data-presence-max') || '5', 10),
                    excludeSelf: el.getAttribute('data-presence-exclude-self') !== 'false'
                });
            }
        }

        // Viewers lists
        var viewerEls = document.querySelectorAll('[data-presence-viewers]');
        for (var j = 0; j < viewerEls.length; j++) {
            var vel = viewerEls[j];
            var vChannel = vel.getAttribute('data-presence-channel');
            if (vChannel) {
                Presence.createViewersList(vel, vChannel, {
                    label: vel.getAttribute('data-presence-label'),
                    showStatus: vel.getAttribute('data-presence-show-status') !== 'false'
                });
            }
        }

        // Typing indicators
        var typingEls = document.querySelectorAll('[data-presence-typing-ui]');
        for (var k = 0; k < typingEls.length; k++) {
            var tel = typingEls[k];
            var tChannel = tel.getAttribute('data-presence-channel');
            if (tChannel) {
                Presence.createTypingIndicatorUI(tel, tChannel, {
                    showDots: tel.getAttribute('data-presence-dots') !== 'false'
                });
            }
        }

        // Status dots
        var dotEls = document.querySelectorAll('[data-presence-dot]');
        for (var l = 0; l < dotEls.length; l++) {
            var del = dotEls[l];
            var userId = del.getAttribute('data-presence-user') || null;
            Presence.createStatusDot(del, userId);
        }
    }

    /**
     * Clean up all UI components
     * @private
     */
    function cleanupUIComponents() {
        for (var i = 0; i < _uiComponents.length; i++) {
            var component = _uiComponents[i];
            if (component.element && component.element.parentNode) {
                component.element.parentNode.removeChild(component.element);
            }
        }
        _uiComponents = [];
    }

    // =========================================================================
    // MAIN MODULE
    // =========================================================================

    var Presence = {
        /**
         * Status constants
         */
        STATUS: STATUS,

        /**
         * Activity status constants
         */
        ACTIVITY_STATUS: ACTIVITY_STATUS,

        /**
         * Default options
         */
        DEFAULTS: DEFAULTS,

        /**
         * Initialize the presence system
         * @param {Object} options - Configuration options
         * @returns {Object} this for chaining
         */
        init: function(options) {
            if (_initialized) {
                log('Already initialized');
                return this;
            }

            _config = {};
            for (var key in DEFAULTS) {
                _config[key] = DEFAULTS[key];
            }
            for (var opt in options) {
                _config[opt] = options[opt];
            }

            // Validate required options
            if (!_config.userId) {
                console.error('[Presence] userId is required');
                return this;
            }

            // Set current user
            _currentUser = {
                id: _config.userId,
                name: _config.userName,
                avatar: _config.userAvatar,
                metadata: _config.userMetadata,
                status: STATUS.ONLINE,
                joinedAt: getCurrentTimestamp()
            };

            // Set up integrations
            setupIdleDetectorIntegration();
            setupChannelIntegration();
            setupSPAIntegration();

            // Start heartbeat
            startHeartbeat();

            _initialized = true;

            // Auto-join page channel if configured (must be after _initialized = true)
            if (_config.autoJoinPage) {
                _currentPageChannel = getPageChannel();
                this.join(_currentPageChannel);
            }

            // Set up UI event hooks
            setupUIEventHooks();

            // Auto-bind typing inputs and UI components after DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    if (_config.autoBindTypingInputs) autoBindTypingInputs();
                    if (_config.autoInitUI) autoInitUIComponents();
                });
            } else {
                if (_config.autoBindTypingInputs) autoBindTypingInputs();
                if (_config.autoInitUI) autoInitUIComponents();
            }

            emit('init', { user: _currentUser });
            log('Initialized for user:', _config.userId);

            return this;
        },

        /**
         * Check if presence system is initialized
         * @returns {boolean}
         */
        isInitialized: function() {
            return _initialized;
        },

        /**
         * Get current user info
         * @returns {Object|null}
         */
        getCurrentUser: function() {
            if (!_currentUser) return null;

            var user = {};
            for (var key in _currentUser) {
                user[key] = _currentUser[key];
            }
            return user;
        },

        /**
         * Get current status (from IdleDetector)
         * @returns {string}
         */
        getStatus: function() {
            if (!_initialized) return STATUS.OFFLINE;
            return getIdleStatus();
        },

        /**
         * Manually set status (overrides IdleDetector)
         * @param {string} status - Status value
         * @returns {Object} this for chaining
         */
        setStatus: function(status) {
            if (!_initialized) return this;

            // Validate status
            var valid = false;
            for (var key in STATUS) {
                if (STATUS[key] === status) {
                    valid = true;
                    break;
                }
            }

            if (!valid) {
                console.warn('[Presence] Invalid status:', status);
                return this;
            }

            broadcastStatus(status);
            emit('status', { user: _currentUser, status: status });

            return this;
        },

        /**
         * Set user as "away"
         * @returns {Object} this for chaining
         */
        setAway: function() {
            return this.setStatus(STATUS.AWAY);
        },

        /**
         * Set user as "online" (back from away/idle)
         * @returns {Object} this for chaining
         */
        setOnline: function() {
            return this.setStatus(STATUS.ONLINE);
        },

        /**
         * Set user as "busy" (do not disturb)
         * @returns {Object} this for chaining
         */
        setBusy: function() {
            return this.setStatus(STATUS.BUSY);
        },

        /**
         * Check if user is currently idle (delegates to IdleDetector)
         * @returns {boolean}
         */
        isIdle: function() {
            var IdleDetector = Funky.IdleDetector;
            if (!IdleDetector || !IdleDetector.isIdle) return false;
            return IdleDetector.isIdle();
        },

        /**
         * Check if user is currently away (delegates to IdleDetector)
         * @returns {boolean}
         */
        isAway: function() {
            var IdleDetector = Funky.IdleDetector;
            if (!IdleDetector || !IdleDetector.isAway) return false;
            return IdleDetector.isAway();
        },

        /**
         * Get time since last activity in ms (delegates to IdleDetector)
         * @returns {number}
         */
        getIdleTime: function() {
            var IdleDetector = Funky.IdleDetector;
            if (!IdleDetector || !IdleDetector.getIdleTime) return 0;
            return IdleDetector.getIdleTime();
        },

        /**
         * Get last activity timestamp (delegates to IdleDetector)
         * @returns {number}
         */
        getLastActivity: function() {
            var IdleDetector = Funky.IdleDetector;
            if (!IdleDetector || !IdleDetector.getLastActivity) return Date.now();
            return IdleDetector.getLastActivity();
        },

        /**
         * Manually trigger activity (resets idle timer)
         * @returns {Object} this for chaining
         */
        triggerActivity: function() {
            var IdleDetector = Funky.IdleDetector;
            if (IdleDetector && IdleDetector.triggerActivity) {
                IdleDetector.triggerActivity();
            }
            return this;
        },

        // =====================================================================
        // CHANNEL METHODS
        // =====================================================================

        /**
         * Join a presence channel
         * @param {string} channel - Channel name
         * @param {Object} options - Join options
         * @returns {Object} this for chaining
         */
        join: function(channel, options) {
            if (!_initialized) return this;

            options = options || {};

            // Already in channel?
            if (_channels[channel]) {
                log('Already in channel:', channel);
                return this;
            }

            // Create presence channel state
            _channels[channel] = new PresenceChannelState(channel, options);

            // Join via Channel component
            var Channel = Funky.Channel;
            if (Channel) {
                Channel.join(channel, {
                    metadata: {
                        status: options.status || ACTIVITY_STATUS.VIEWING,
                        userMetadata: _config.userMetadata
                    }
                });
            }

            emit('join', { channel: channel, user: _currentUser });
            log('Joined channel:', channel);

            return this;
        },

        /**
         * Leave a presence channel
         * @param {string} channel - Channel name
         * @returns {Object} this for chaining
         */
        leave: function(channel) {
            if (!_initialized) return this;

            if (!_channels[channel]) {
                log('Not in channel:', channel);
                return this;
            }

            // Clean up typing indicator if exists
            var channelState = _channels[channel];
            if (channelState.typingIndicator) {
                channelState.typingIndicator.destroy();
            }

            // Leave via Channel component
            var Channel = Funky.Channel;
            if (Channel) {
                Channel.leave(channel);
            }

            delete _channels[channel];

            emit('leave', { channel: channel, user: _currentUser });
            log('Left channel:', channel);

            return this;
        },

        /**
         * Leave all presence channels
         * @returns {Object} this for chaining
         */
        leaveAll: function() {
            if (!_initialized) return this;

            var channels = Object.keys(_channels);
            for (var i = 0; i < channels.length; i++) {
                this.leave(channels[i]);
            }
            return this;
        },

        /**
         * Check if in a channel
         * @param {string} channel - Channel name
         * @returns {boolean}
         */
        isInChannel: function(channel) {
            return !!_channels[channel];
        },

        /**
         * Get all joined channels
         * @returns {Array}
         */
        getChannels: function() {
            return Object.keys(_channels);
        },

        /**
         * Get users in a channel
         * @param {string} channel - Channel name
         * @returns {Array}
         */
        getUsers: function(channel) {
            var Channel = Funky.Channel;
            if (!Channel || !_channels[channel]) return [];

            return Channel.getMembers(channel);
        },

        /**
         * Get other users in a channel (excluding current user)
         * @param {string} channel - Channel name
         * @returns {Array}
         */
        getOtherUsers: function(channel) {
            var Channel = Funky.Channel;
            if (!Channel || !_channels[channel]) return [];

            var members = Channel.getMembers(channel);
            var userId = _config.userId;

            return members.filter(function(m) {
                return m.id !== userId;
            });
        },

        /**
         * Get user count in a channel
         * @param {string} channel - Channel name
         * @param {boolean} excludeSelf - Exclude current user from count
         * @returns {number}
         */
        getUserCount: function(channel, excludeSelf) {
            var Channel = Funky.Channel;
            if (!Channel || !_channels[channel]) return 0;

            var count = Channel.getMemberCount(channel);
            if (excludeSelf) {
                count = Math.max(0, count - 1);
            }
            return count;
        },

        /**
         * Check if a specific user is in a channel
         * @param {string} channel - Channel name
         * @param {string} userId - User ID
         * @returns {boolean}
         */
        isUserInChannel: function(channel, userId) {
            var Channel = Funky.Channel;
            if (!Channel || !_channels[channel]) return false;

            var members = Channel.getMembers(channel);
            for (var i = 0; i < members.length; i++) {
                if (members[i].id === userId) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Get a specific user from a channel
         * @param {string} channel - Channel name
         * @param {string} userId - User ID
         * @returns {Object|null}
         */
        getUser: function(channel, userId) {
            var Channel = Funky.Channel;
            if (!Channel || !_channels[channel]) return null;

            var members = Channel.getMembers(channel);
            for (var i = 0; i < members.length; i++) {
                if (members[i].id === userId) {
                    return members[i];
                }
            }
            return null;
        },

        /**
         * Check if a user is online (in any channel)
         * @param {string} userId - User ID
         * @returns {boolean}
         */
        isOnline: function(userId) {
            var Channel = Funky.Channel;
            if (!Channel) return false;

            var channels = Object.keys(_channels);
            for (var i = 0; i < channels.length; i++) {
                var members = Channel.getMembers(channels[i]);
                for (var j = 0; j < members.length; j++) {
                    if (members[j].id === userId) {
                        return true;
                    }
                }
            }
            return false;
        },

        /**
         * Get the current page channel (for SPA tracking)
         * @returns {string|null}
         */
        getCurrentPageChannel: function() {
            return _currentPageChannel;
        },

        /**
         * Set activity status for a specific channel
         * @param {string} channel - Channel name
         * @param {string} status - Activity status ('viewing', 'editing', etc.)
         * @returns {Object} this for chaining
         */
        setChannelStatus: function(channel, status) {
            if (!_initialized || !_channels[channel]) return this;

            _channels[channel].status = status;

            var Channel = Funky.Channel;
            if (Channel) {
                Channel.publish(channel, 'presence:status', {
                    userId: _config.userId,
                    activityStatus: status,
                    timestamp: getCurrentTimestamp()
                });
            }

            emit('channelStatus', {
                channel: channel,
                user: _currentUser,
                status: status
            });

            return this;
        },

        /**
         * Get activity status for a specific channel
         * @param {string} channel - Channel name
         * @returns {string|null}
         */
        getChannelStatus: function(channel) {
            if (!_channels[channel]) return null;
            return _channels[channel].status;
        },

        // =====================================================================
        // TYPING INDICATOR INTEGRATION
        // =====================================================================

        /**
         * Get or create typing indicator for a channel
         * @param {string} channel - Channel name
         * @param {Object} options - TypingIndicator options
         * @returns {Object|null} TypingIndicator instance
         */
        getTypingIndicator: function(channel, options) {
            if (!_initialized || !_channels[channel]) return null;

            var TypingIndicator = Funky.TypingIndicator;
            if (!TypingIndicator) {
                log('TypingIndicator not available');
                return null;
            }

            var channelState = _channels[channel];

            // Create if not exists
            if (!channelState.typingIndicator) {
                options = options || {};
                channelState.typingIndicator = TypingIndicator.create({
                    channel: channel,
                    timeout: options.timeout || 3000,
                    debounce: options.debounce || 300,
                    showDots: options.showDots !== false,
                    container: options.container || null
                });
            }

            return channelState.typingIndicator;
        },

        /**
         * Start typing in a channel
         * @param {string} channel - Channel name
         * @returns {Object} this for chaining
         */
        startTyping: function(channel) {
            var indicator = this.getTypingIndicator(channel);
            if (indicator) {
                indicator.startTyping();
            }
            return this;
        },

        /**
         * Stop typing in a channel
         * @param {string} channel - Channel name
         * @returns {Object} this for chaining
         */
        stopTyping: function(channel) {
            if (!_channels[channel]) return this;

            var channelState = _channels[channel];
            if (channelState.typingIndicator) {
                channelState.typingIndicator.stopTyping();
            }
            return this;
        },

        /**
         * Stop typing in all channels
         * @returns {Object} this for chaining
         */
        stopAllTyping: function() {
            var channels = Object.keys(_channels);
            for (var i = 0; i < channels.length; i++) {
                this.stopTyping(channels[i]);
            }
            return this;
        },

        /**
         * Check if currently typing in a channel
         * @param {string} channel - Channel name
         * @returns {boolean}
         */
        isTypingIn: function(channel) {
            if (!_channels[channel]) return false;

            var channelState = _channels[channel];
            if (channelState.typingIndicator) {
                return channelState.typingIndicator.isLocalTyping();
            }
            return false;
        },

        /**
         * Get users currently typing in a channel
         * @param {string} channel - Channel name
         * @returns {Array}
         */
        getTypingUsers: function(channel) {
            if (!_channels[channel]) return [];

            var channelState = _channels[channel];
            if (channelState.typingIndicator) {
                return channelState.typingIndicator.getTypers();
            }
            return [];
        },

        /**
         * Get other users typing (excluding self)
         * @param {string} channel - Channel name
         * @returns {Array}
         */
        getOtherTypingUsers: function(channel) {
            var typers = this.getTypingUsers(channel);
            var userId = _config.userId;

            return typers.filter(function(t) {
                return t.id !== userId;
            });
        },

        /**
         * Get typing text for a channel
         * @param {string} channel - Channel name
         * @returns {string}
         */
        getTypingText: function(channel) {
            if (!_channels[channel]) return '';

            var channelState = _channels[channel];
            if (channelState.typingIndicator) {
                return channelState.typingIndicator.getText();
            }
            return '';
        },

        /**
         * Bind an input to typing indicator for a channel
         * @param {string} channel - Channel name
         * @param {string|Element} input - Input selector or element
         * @param {Object} options - Binding options
         * @returns {Object} Binding reference for unbinding
         */
        bindTypingInput: function(channel, input, options) {
            if (!_initialized) return null;

            options = options || {};

            var element;
            if (typeof input === 'string') {
                element = document.querySelector(input);
            } else {
                element = input;
            }

            if (!element) {
                console.warn('[Presence] Input element not found:', input);
                return null;
            }

            // Get or create typing indicator for the channel
            var indicator = this.getTypingIndicator(channel, {
                timeout: options.timeout || _config.typingTimeout,
                debounce: options.debounce || _config.typingDebounce
            });

            if (!indicator) {
                // Channel not joined yet - create binding anyway for later
                log('Channel not joined, creating pending binding');
            }

            var debounceDelay = options.debounce || _config.typingDebounce;
            var debounceTimer = null;
            var self = this;

            // Handler for input event
            var onInput = function() {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                // Start typing immediately on first input
                self.startTyping(channel);

                // Debounce to check for empty
                debounceTimer = setTimeout(function() {
                    if (!element.value || element.value.trim() === '') {
                        self.stopTyping(channel);
                    }
                }, debounceDelay);
            };

            // Handler for blur event
            var onBlur = function() {
                self.stopTyping(channel);
            };

            // Handler for keydown event (detect Enter for submit)
            var onKeydown = function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    self.stopTyping(channel);
                }
            };

            // Bind events
            element.addEventListener('input', onInput);
            element.addEventListener('blur', onBlur);
            element.addEventListener('keydown', onKeydown);

            // Create binding reference
            var binding = {
                element: element,
                channel: channel,
                onInput: onInput,
                onBlur: onBlur,
                onKeydown: onKeydown,
                debounceTimer: debounceTimer
            };

            _typingInputBindings.push(binding);

            return binding;
        },

        /**
         * Unbind a typing input
         * @param {Object} binding - Binding reference from bindTypingInput()
         * @returns {Object} this for chaining
         */
        unbindTypingInput: function(binding) {
            if (!binding || !binding.element) return this;

            // Remove event listeners
            binding.element.removeEventListener('input', binding.onInput);
            binding.element.removeEventListener('blur', binding.onBlur);
            binding.element.removeEventListener('keydown', binding.onKeydown);

            // Clear debounce timer
            if (binding.debounceTimer) {
                clearTimeout(binding.debounceTimer);
            }

            // Remove from bindings array
            var index = _typingInputBindings.indexOf(binding);
            if (index !== -1) {
                _typingInputBindings.splice(index, 1);
            }

            // Stop typing in that channel
            this.stopTyping(binding.channel);

            return this;
        },

        /**
         * Unbind all typing inputs
         * @returns {Object} this for chaining
         */
        unbindAllTypingInputs: function() {
            var bindings = _typingInputBindings.slice();
            for (var i = 0; i < bindings.length; i++) {
                this.unbindTypingInput(bindings[i]);
            }
            return this;
        },

        /**
         * Refresh typing input bindings (call after dynamic content loaded)
         * @returns {Object} this for chaining
         */
        refreshTypingBindings: function() {
            this.unbindAllTypingInputs();
            autoBindTypingInputs();
            return this;
        },

        // =====================================================================
        // UI COMPONENTS
        // =====================================================================

        /**
         * Create an avatar stack component for a channel
         * @param {string|Element} container - Container element or selector
         * @param {string} channel - Channel name
         * @param {Object} options - Options
         * @returns {Object|null} Component instance
         */
        createAvatarStack: function(container, channel, options) {
            options = options || {};

            var element;
            if (typeof container === 'string') {
                element = document.querySelector(container);
            } else {
                element = container;
            }

            if (!element) {
                console.warn('[Presence] Container not found');
                return null;
            }

            var D = Funky.Dom;
            if (!D) {
                console.warn('[Presence] Funky.Dom required for UI components');
                return null;
            }

            var maxAvatars = options.maxAvatars || _config.maxAvatars || 5;
            var showCount = options.showCount !== false;
            var excludeSelf = options.excludeSelf !== false;
            var defaultAvatar = options.defaultAvatar || _config.defaultAvatar || '/assets/images/default-avatar.png';

            // Build DOM structure
            var wrapper = document.createElement('div');
            wrapper.className = 'presence-avatars';
            wrapper.setAttribute('data-presence-channel', channel);
            wrapper.setAttribute('role', 'group');
            wrapper.setAttribute('aria-label', 'Online users');

            var countSpan = document.createElement('span');
            countSpan.className = 'presence-avatars__count';
            wrapper.appendChild(countSpan);

            var avatarsContainer = document.createElement('div');
            avatarsContainer.className = 'presence-avatars__list';
            avatarsContainer.setAttribute('role', 'list');
            wrapper.appendChild(avatarsContainer);

            element.appendChild(wrapper);

            var self = this;

            // Update function
            var update = function() {
                var users = excludeSelf
                    ? self.getOtherUsers(channel)
                    : self.getUsers(channel);

                // Update count
                if (showCount) {
                    countSpan.textContent = users.length + ' online';
                }

                // Clear avatars
                avatarsContainer.innerHTML = '';

                // Add avatars (limited by maxAvatars)
                var displayUsers = users.slice(0, maxAvatars);
                for (var i = 0; i < displayUsers.length; i++) {
                    var user = displayUsers[i];
                    var avatar = document.createElement('img');
                    avatar.className = 'presence-avatars__avatar presence-avatars__avatar--' + (user.status || 'online');
                    avatar.src = user.avatar || defaultAvatar;
                    avatar.alt = user.name + ' - ' + (user.status || 'online');
                    avatar.title = user.name;
                    avatarsContainer.appendChild(avatar);
                }

                // Add overflow count if needed
                if (users.length > maxAvatars) {
                    var overflow = document.createElement('span');
                    overflow.className = 'presence-avatars__overflow';
                    overflow.textContent = '+' + (users.length - maxAvatars);
                    avatarsContainer.appendChild(overflow);
                }

                wrapper.setAttribute('aria-label', users.length + ' users online');
            };

            // Initial update
            update();

            // Register for automatic updates
            registerUIComponent(wrapper, 'avatars', channel, update);

            return {
                element: wrapper,
                channel: channel,
                update: update,
                destroy: function() {
                    unregisterUIComponent(wrapper);
                    if (wrapper.parentNode) {
                        wrapper.parentNode.removeChild(wrapper);
                    }
                }
            };
        },

        /**
         * Create a viewers list component for a channel
         * @param {string|Element} container - Container element or selector
         * @param {string} channel - Channel name
         * @param {Object} options - Options
         * @returns {Object|null} Component instance
         */
        createViewersList: function(container, channel, options) {
            options = options || {};

            var element;
            if (typeof container === 'string') {
                element = document.querySelector(container);
            } else {
                element = container;
            }

            if (!element) {
                console.warn('[Presence] Container not found');
                return null;
            }

            var labelText = options.label || 'Also viewing:';
            var showStatus = options.showStatus !== false;
            var defaultAvatar = options.defaultAvatar || _config.defaultAvatar || '/assets/images/default-avatar.png';

            // Build DOM structure
            var wrapper = document.createElement('div');
            wrapper.className = 'presence-viewers';
            wrapper.setAttribute('data-presence-channel', channel);
            wrapper.setAttribute('aria-live', 'polite');
            wrapper.hidden = true;

            var label = document.createElement('span');
            label.className = 'presence-viewers__label';
            label.textContent = labelText;
            wrapper.appendChild(label);

            var list = document.createElement('ul');
            list.className = 'presence-viewers__list';
            list.setAttribute('role', 'list');
            wrapper.appendChild(list);

            element.appendChild(wrapper);

            var self = this;

            // Update function
            var update = function() {
                var users = self.getOtherUsers(channel);

                // Show/hide based on user count
                if (users.length === 0) {
                    wrapper.hidden = true;
                    return;
                }

                wrapper.hidden = false;

                // Clear list
                list.innerHTML = '';

                // Add users
                for (var i = 0; i < users.length; i++) {
                    var user = users[i];
                    var li = document.createElement('li');

                    var img = document.createElement('img');
                    img.src = user.avatar || defaultAvatar;
                    img.alt = '';
                    li.appendChild(img);

                    var nameSpan = document.createElement('span');
                    nameSpan.textContent = user.name;
                    li.appendChild(nameSpan);

                    if (showStatus && user.status && user.status !== 'viewing') {
                        var statusSpan = document.createElement('span');
                        statusSpan.className = 'presence-viewers__status';
                        statusSpan.textContent = user.status;
                        li.appendChild(statusSpan);
                    }

                    list.appendChild(li);
                }
            };

            // Initial update
            update();

            // Register for automatic updates
            registerUIComponent(wrapper, 'viewers', channel, update);

            return {
                element: wrapper,
                channel: channel,
                update: update,
                destroy: function() {
                    unregisterUIComponent(wrapper);
                    if (wrapper.parentNode) {
                        wrapper.parentNode.removeChild(wrapper);
                    }
                }
            };
        },

        /**
         * Create a typing indicator UI component for a channel
         * @param {string|Element} container - Container element or selector
         * @param {string} channel - Channel name
         * @param {Object} options - Options
         * @returns {Object|null} Component instance
         */
        createTypingIndicatorUI: function(container, channel, options) {
            options = options || {};

            var element;
            if (typeof container === 'string') {
                element = document.querySelector(container);
            } else {
                element = container;
            }

            if (!element) {
                console.warn('[Presence] Container not found');
                return null;
            }

            var showDots = options.showDots !== false;

            // Build DOM structure
            var wrapper = document.createElement('div');
            wrapper.className = 'presence-typing-ui';
            wrapper.setAttribute('data-presence-channel', channel);
            wrapper.setAttribute('aria-live', 'polite');
            wrapper.hidden = true;

            if (showDots) {
                var dots = document.createElement('span');
                dots.className = 'presence-typing-ui__dots';
                dots.setAttribute('aria-hidden', 'true');

                for (var i = 0; i < 3; i++) {
                    var dot = document.createElement('span');
                    dots.appendChild(dot);
                }
                wrapper.appendChild(dots);
            }

            var text = document.createElement('span');
            text.className = 'presence-typing-ui__text';
            wrapper.appendChild(text);

            element.appendChild(wrapper);

            var self = this;

            // Update function
            var update = function() {
                var typingText = self.getTypingText(channel);

                if (!typingText) {
                    wrapper.hidden = true;
                    return;
                }

                wrapper.hidden = false;
                text.textContent = typingText;
            };

            // Initial update
            update();

            // Register for automatic updates
            registerUIComponent(wrapper, 'typing-ui', channel, update);

            // Also listen for typing events
            var onTyping = function(data) {
                if (data.channel === channel) {
                    update();
                }
            };

            Presence.on('typing:start', onTyping);
            Presence.on('typing:stop', onTyping);

            return {
                element: wrapper,
                channel: channel,
                update: update,
                destroy: function() {
                    unregisterUIComponent(wrapper);
                    Presence.off('typing:start', onTyping);
                    Presence.off('typing:stop', onTyping);
                    if (wrapper.parentNode) {
                        wrapper.parentNode.removeChild(wrapper);
                    }
                }
            };
        },

        /**
         * Create a status dot indicator
         * @param {string|Element} container - Container element or selector
         * @param {string} userId - User ID to watch (null for current user)
         * @param {Object} options - Options
         * @returns {Object|null} Component instance
         */
        createStatusDot: function(container, userId, options) {
            options = options || {};

            var element;
            if (typeof container === 'string') {
                element = document.querySelector(container);
            } else {
                element = container;
            }

            if (!element) return null;

            // Default to current user
            userId = userId || (_currentUser ? _currentUser.id : null);
            var isSelf = userId === (_currentUser ? _currentUser.id : null);

            // Build DOM
            var dot = document.createElement('span');
            dot.className = 'presence-dot presence-dot--' + (isSelf ? this.getStatus() : 'offline');
            dot.setAttribute('title', isSelf ? 'Your status' : 'User status');

            element.appendChild(dot);

            var self = this;

            // Update function
            var update = function() {
                var status;

                if (isSelf) {
                    status = self.getStatus();
                } else {
                    // Find user in any channel
                    status = 'offline';
                    var channels = Object.keys(_channels);
                    for (var i = 0; i < channels.length; i++) {
                        var user = self.getUser(channels[i], userId);
                        if (user) {
                            status = user.status || 'online';
                            break;
                        }
                    }
                }

                // Update class
                dot.className = 'presence-dot presence-dot--' + status;
                dot.setAttribute('title', status.charAt(0).toUpperCase() + status.slice(1));
            };

            // Initial update
            update();

            // Register for updates (watch all channels)
            registerUIComponent(dot, 'dot', '*', update);

            return {
                element: dot,
                userId: userId,
                update: update,
                destroy: function() {
                    unregisterUIComponent(dot);
                    if (dot.parentNode) {
                        dot.parentNode.removeChild(dot);
                    }
                }
            };
        },

        /**
         * Refresh all UI components
         * @returns {Object} this for chaining
         */
        refreshUI: function() {
            for (var i = 0; i < _uiComponents.length; i++) {
                try {
                    _uiComponents[i].update();
                } catch (e) {
                    console.error('[Presence] UI refresh error:', e);
                }
            }
            return this;
        },

        /**
         * Destroy all UI components
         * @returns {Object} this for chaining
         */
        destroyUI: function() {
            cleanupUIComponents();
            return this;
        },

        // =====================================================================
        // LAST SEEN TRACKING
        // =====================================================================

        /**
         * Get last seen timestamp for a user
         * Searches all joined channels for the user's most recent lastSeen
         * @param {string} userId - User ID
         * @returns {string|null} ISO timestamp
         */
        getLastSeen: function(userId) {
            var Channel = Funky.Channel;
            if (!Channel) return null;

            var lastSeen = null;
            var channels = Object.keys(_channels);

            for (var i = 0; i < channels.length; i++) {
                var members = Channel.getMembers(channels[i]);
                for (var j = 0; j < members.length; j++) {
                    var member = members[j];
                    if (member.id === userId && member.lastSeen) {
                        if (!lastSeen || member.lastSeen > lastSeen) {
                            lastSeen = member.lastSeen;
                        }
                    }
                }
            }

            return lastSeen;
        },

        /**
         * Get relative time since last seen
         * @param {string} userId - User ID
         * @returns {string|null} Human-readable string like "5 minutes ago"
         */
        getLastSeenRelative: function(userId) {
            var lastSeen = this.getLastSeen(userId);
            if (!lastSeen) return null;

            // Use Funky.RelativeTime if available
            if (Funky.RelativeTime && Funky.RelativeTime.format) {
                return Funky.RelativeTime.format(lastSeen);
            }

            // Fallback to simple calculation
            var diff = Date.now() - new Date(lastSeen).getTime();
            var seconds = Math.floor(diff / 1000);
            var minutes = Math.floor(seconds / 60);
            var hours = Math.floor(minutes / 60);
            var days = Math.floor(hours / 24);

            if (days > 0) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
            if (hours > 0) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
            if (minutes > 0) return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
            return 'just now';
        },

        // =====================================================================
        // EVENT METHODS
        // =====================================================================

        /**
         * Register an event handler
         * @param {string} event - Event name
         * @param {Function} handler - Callback function
         * @returns {Object} this for chaining
         */
        on: function(event, handler) {
            if (typeof handler !== 'function') return this;

            if (!_eventHandlers[event]) {
                _eventHandlers[event] = [];
            }
            _eventHandlers[event].push(handler);
            return this;
        },

        /**
         * Remove an event handler
         * @param {string} event - Event name
         * @param {Function} handler - Callback function
         * @returns {Object} this for chaining
         */
        off: function(event, handler) {
            if (!_eventHandlers[event]) return this;

            if (handler) {
                _eventHandlers[event] = _eventHandlers[event].filter(function(h) {
                    return h !== handler;
                });
            } else {
                // Remove all handlers for event
                delete _eventHandlers[event];
            }
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
            var wrapper = function(data) {
                self.off(event, wrapper);
                handler(data);
            };
            return this.on(event, wrapper);
        },

        // =====================================================================
        // CLEANUP
        // =====================================================================

        /**
         * Destroy the presence system
         */
        destroy: function() {
            if (!_initialized) return;

            log('Destroying...');

            // Stop all typing and unbind inputs
            this.stopAllTyping();
            cleanupTypingInputBindings();

            // Destroy UI components
            cleanupUIComponents();

            // Leave all channels
            var channels = Object.keys(_channels);
            for (var i = 0; i < channels.length; i++) {
                this.leave(channels[i]);
            }

            // Stop heartbeat
            stopHeartbeat();

            // Clean up integrations
            cleanupIdleDetectorIntegration();
            cleanupChannelIntegration();
            cleanupSPAIntegration();

            // Emit destroy event before clearing handlers
            emit('destroy', {});

            // Clear state
            _channels = {};
            _eventHandlers = {};
            _currentUser = null;
            _currentPageChannel = null;
            _initialized = false;
        }
    };

    // =========================================================================
    // EXPORT
    // =========================================================================

    if (Funky.register) {
        Funky.register('Presence', Presence);
    }

})(window);
