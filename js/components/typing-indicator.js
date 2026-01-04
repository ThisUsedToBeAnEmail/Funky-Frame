/**
 * TypingIndicator - Real-time typing status component
 *
 * Shows when users are typing in chat, comments, or collaborative editing.
 * Handles debouncing, automatic timeout, and text formatting.
 *
 * @namespace Funky.TypingIndicator
 */
(function(global) {
    'use strict';

    var Funky = global.Funky || (global.Funky = {});

    // Guard against double registration
    if (Funky.isRegistered && Funky.isRegistered('TypingIndicator')) {
        return;
    }

    // =========================================================================
    // DEFAULT OPTIONS
    // =========================================================================

    var DEFAULTS = {
        container: null,
        channel: null,
        timeout: 3000,           // Auto-stop after 3 seconds
        debounce: 300,           // Debounce input events
        maxTypers: 5,            // Max names before "N people typing"
        showDots: true,
        format: null,            // Custom format function
        excludeSelf: true,       // Exclude self from display
        onStart: null,
        onStop: null,
        onChange: null
    };

    // =========================================================================
    // TYPING INDICATOR INSTANCE
    // =========================================================================

    /**
     * TypingIndicator instance
     * @param {Object} options - Configuration options
     */
    function TypingIndicatorInstance(options) {
        this.options = {};
        for (var key in DEFAULTS) {
            if (DEFAULTS.hasOwnProperty(key)) {
                this.options[key] = options && options.hasOwnProperty(key)
                    ? options[key]
                    : DEFAULTS[key];
            }
        }

        this.typers = {};           // { userId: { id, name, timestamp } }
        this.isTyping = false;      // Local typing state
        this.typingTimer = null;    // Timeout timer
        this.debounceTimer = null;  // Debounce timer
        this.boundInputs = [];      // Bound input elements
        this.eventHandlers = {};    // Event handlers
        this.element = null;        // DOM element
        this.currentUser = null;    // Current user info
        this._channelSubscription = null;

        this._init();
    }

    /**
     * Initialize the instance
     * @private
     */
    TypingIndicatorInstance.prototype._init = function() {
        // Get current user from Presence or Channel if available
        if (Funky.Presence && Funky.Presence.getCurrentUser) {
            this.currentUser = Funky.Presence.getCurrentUser();
        } else if (Funky.Channel && Funky.Channel.getCurrentUser) {
            this.currentUser = Funky.Channel.getCurrentUser();
        }

        // Subscribe to channel typing events if channel provided
        if (this.options.channel && Funky.Channel) {
            this._subscribeToChannel();
        }

        // Create/attach UI element if container provided
        if (this.options.container) {
            this._createUI();
        }
    };

    // =========================================================================
    // LOCAL TYPING CONTROL
    // =========================================================================

    /**
     * Start typing (local user)
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.startTyping = function() {
        // Clear existing timer
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        // If already typing, just reset timer
        if (this.isTyping) {
            this._resetTypingTimer();
            return this;
        }

        this.isTyping = true;

        // Emit start event
        this._emit('start', { user: this.currentUser });

        // Broadcast to channel if configured
        if (this.options.channel && Funky.Channel && Funky.Channel.publish) {
            Funky.Channel.publish(this.options.channel, {
                type: 'typing',
                typing: true,
                user: this.currentUser
            });
        }

        // Call callback
        if (typeof this.options.onStart === 'function') {
            this.options.onStart();
        }

        // Set auto-stop timer
        this._resetTypingTimer();

        return this;
    };

    /**
     * Stop typing (local user)
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.stopTyping = function() {
        if (!this.isTyping) return this;

        // Clear timers
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }

        this.isTyping = false;

        // Emit stop event
        this._emit('stop', { user: this.currentUser });

        // Broadcast to channel if configured
        if (this.options.channel && Funky.Channel && Funky.Channel.publish) {
            Funky.Channel.publish(this.options.channel, {
                type: 'typing',
                typing: false,
                user: this.currentUser
            });
        }

        // Call callback
        if (typeof this.options.onStop === 'function') {
            this.options.onStop();
        }

        return this;
    };

    /**
     * Check if local user is typing
     * @returns {boolean}
     */
    TypingIndicatorInstance.prototype.isLocalTyping = function() {
        return this.isTyping;
    };

    /**
     * Reset typing timer
     * @private
     */
    TypingIndicatorInstance.prototype._resetTypingTimer = function() {
        var self = this;

        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        this.typingTimer = setTimeout(function() {
            self.stopTyping();
        }, this.options.timeout);
    };

    // =========================================================================
    // REMOTE TYPERS TRACKING
    // =========================================================================

    /**
     * Add a remote typer
     * @param {Object} user - User object { id, name, avatar }
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.addTyper = function(user) {
        if (!user || !user.id) return this;

        // Don't add self if excludeSelf
        if (this.options.excludeSelf && this.currentUser && user.id === this.currentUser.id) {
            return this;
        }

        var isNew = !this.typers[user.id];

        this.typers[user.id] = {
            id: user.id,
            name: user.name || 'Someone',
            avatar: user.avatar,
            timestamp: Date.now()
        };

        if (isNew) {
            this._emit('remote:start', { user: user });
        }

        this._onChange();

        return this;
    };

    /**
     * Remove a remote typer
     * @param {string} userId - User ID
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.removeTyper = function(userId) {
        if (!userId || !this.typers[userId]) return this;

        var user = this.typers[userId];
        delete this.typers[userId];

        this._emit('remote:stop', { user: user });
        this._onChange();

        return this;
    };

    /**
     * Clear all remote typers
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.clearTypers = function() {
        this.typers = {};
        this._onChange();
        return this;
    };

    /**
     * Get all typers
     * @returns {Array}
     */
    TypingIndicatorInstance.prototype.getTypers = function() {
        var self = this;
        var result = [];
        for (var id in this.typers) {
            if (this.typers.hasOwnProperty(id)) {
                // Create a copy of the typer object
                var typer = this.typers[id];
                result.push({
                    id: typer.id,
                    name: typer.name,
                    avatar: typer.avatar,
                    timestamp: typer.timestamp
                });
            }
        }
        return result;
    };

    /**
     * Get typer count
     * @returns {number}
     */
    TypingIndicatorInstance.prototype.getTyperCount = function() {
        var count = 0;
        for (var id in this.typers) {
            if (this.typers.hasOwnProperty(id)) {
                count++;
            }
        }
        return count;
    };

    /**
     * Check if anyone is typing
     * @returns {boolean}
     */
    TypingIndicatorInstance.prototype.hasTypers = function() {
        for (var id in this.typers) {
            if (this.typers.hasOwnProperty(id)) {
                return true;
            }
        }
        return false;
    };

    // =========================================================================
    // INPUT BINDING
    // =========================================================================

    /**
     * Bind to an input element
     * @param {string|Element} selector - Input element or selector
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.bindInput = function(selector) {
        var self = this;

        var input = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (!input) {
            console.warn('[TypingIndicator] Input not found:', selector);
            return this;
        }

        // Check if already bound
        for (var i = 0; i < this.boundInputs.length; i++) {
            if (this.boundInputs[i].element === input) {
                return this; // Already bound
            }
        }

        // Input event handler (debounced)
        var onInput = function() {
            if (self.debounceTimer) {
                clearTimeout(self.debounceTimer);
            }

            self.debounceTimer = setTimeout(function() {
                // Check if input has content
                if (input.value && input.value.trim()) {
                    self.startTyping();
                } else {
                    self.stopTyping();
                }
            }, self.options.debounce);
        };

        // Blur handler - stop typing when leaving input
        var onBlur = function() {
            self.stopTyping();
        };

        // Keydown handler - stop on Enter (message sent)
        var onKeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                self.stopTyping();
            }
        };

        // Bind events
        input.addEventListener('input', onInput);
        input.addEventListener('blur', onBlur);
        input.addEventListener('keydown', onKeydown);

        // Store for cleanup
        this.boundInputs.push({
            element: input,
            handlers: {
                input: onInput,
                blur: onBlur,
                keydown: onKeydown
            }
        });

        return this;
    };

    /**
     * Unbind from an input element
     * @param {Element} input - Input element
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.unbindInput = function(input) {
        var index = -1;
        for (var i = 0; i < this.boundInputs.length; i++) {
            if (this.boundInputs[i].element === input) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            var binding = this.boundInputs[index];

            binding.element.removeEventListener('input', binding.handlers.input);
            binding.element.removeEventListener('blur', binding.handlers.blur);
            binding.element.removeEventListener('keydown', binding.handlers.keydown);

            this.boundInputs.splice(index, 1);
        }

        return this;
    };

    /**
     * Unbind from all inputs
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.unbindAllInputs = function() {
        for (var i = 0; i < this.boundInputs.length; i++) {
            var binding = this.boundInputs[i];
            binding.element.removeEventListener('input', binding.handlers.input);
            binding.element.removeEventListener('blur', binding.handlers.blur);
            binding.element.removeEventListener('keydown', binding.handlers.keydown);
        }

        this.boundInputs = [];
        return this;
    };

    // =========================================================================
    // CHANNEL INTEGRATION
    // =========================================================================

    /**
     * Subscribe to channel typing events
     * @private
     */
    TypingIndicatorInstance.prototype._subscribeToChannel = function() {
        var self = this;

        if (!Funky.Channel || !Funky.Channel.subscribe) return;

        // Subscribe to typing messages on channel
        this._channelSubscription = Funky.Channel.subscribe(
            this.options.channel,
            function(message, sender) {
                if (message && message.type === 'typing') {
                    var user = message.user || sender;
                    if (user && user.id) {
                        if (message.typing) {
                            self.addTyper(user);
                        } else {
                            self.removeTyper(user.id);
                        }
                    }
                }
            }
        );
    };

    /**
     * Set current user
     * @param {Object} user - User object { id, name }
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.setCurrentUser = function(user) {
        this.currentUser = user;
        return this;
    };

    /**
     * Get current user
     * @returns {Object|null}
     */
    TypingIndicatorInstance.prototype.getCurrentUser = function() {
        return this.currentUser;
    };

    // =========================================================================
    // TEXT FORMATTING
    // =========================================================================

    /**
     * Get formatted typing text
     * @returns {string}
     */
    TypingIndicatorInstance.prototype.getText = function() {
        var typers = this.getTypers();

        if (typers.length === 0) return '';

        // Use custom format if provided
        if (typeof this.options.format === 'function') {
            return this.options.format(typers);
        }

        return TypingIndicator.formatText(typers, this.options.maxTypers);
    };

    // =========================================================================
    // UI RENDERING
    // =========================================================================

    /**
     * Render the typing indicator UI
     * @private
     */
    TypingIndicatorInstance.prototype._renderUI = function() {
        if (!this.options.container) return;

        var container = typeof this.options.container === 'string'
            ? document.querySelector(this.options.container)
            : this.options.container;

        if (!container) {
            console.warn('[TypingIndicator] Container not found');
            return;
        }

        var D = Funky.Dom;

        // Build UI
        if (D) {
            // Use Funky.Dom if available
            this.element = D.div()
                .class('typing-indicator')
                .aria('live', 'polite')
                .attr('hidden', '')
                .el;

            if (this.options.showDots) {
                var dots = D.span()
                    .class('typing-indicator__dots')
                    .aria('hidden', 'true')
                    .appendTo(D.wrap(this.element));

                D.span().appendTo(dots);
                D.span().appendTo(dots);
                D.span().appendTo(dots);
            }

            this.textElement = D.span()
                .class('typing-indicator__text')
                .appendTo(D.wrap(this.element))
                .el;

            container.appendChild(this.element);
        } else {
            // Vanilla JS fallback
            this.element = document.createElement('div');
            this.element.className = 'typing-indicator';
            this.element.setAttribute('aria-live', 'polite');
            this.element.setAttribute('hidden', '');

            if (this.options.showDots) {
                var dotsEl = document.createElement('span');
                dotsEl.className = 'typing-indicator__dots';
                dotsEl.setAttribute('aria-hidden', 'true');
                dotsEl.innerHTML = '<span></span><span></span><span></span>';
                this.element.appendChild(dotsEl);
            }

            this.textElement = document.createElement('span');
            this.textElement.className = 'typing-indicator__text';
            this.element.appendChild(this.textElement);

            container.appendChild(this.element);
        }

        this._rendered = true;
    };

    /**
     * Create UI element (attach to existing or render new)
     * @private
     */
    TypingIndicatorInstance.prototype._createUI = function() {
        var container = this.options.container;

        if (typeof container === 'string') {
            var el = document.querySelector(container);
            // Check if container already has typing indicator structure
            if (el && el.classList.contains('typing-indicator')) {
                this.element = el;
                this.textElement = el.querySelector('.typing-indicator__text');
                this._rendered = true;
            } else {
                // Render new UI into container
                this._renderUI();
            }
        } else if (container instanceof Element) {
            if (container.classList.contains('typing-indicator')) {
                this.element = container;
                this.textElement = container.querySelector('.typing-indicator__text');
                this._rendered = true;
            } else {
                this._renderUI();
            }
        }
    };

    /**
     * Update UI based on current state
     * @private
     */
    TypingIndicatorInstance.prototype._updateUI = function() {
        if (!this.element) return;

        var typers = this.getTypers();

        if (typers.length === 0) {
            // Hide indicator
            this.element.setAttribute('hidden', '');
            this.element.classList.remove('typing-indicator--active');
        } else {
            // Show indicator
            this.element.removeAttribute('hidden');
            this.element.classList.add('typing-indicator--active');

            // Update text
            if (this.textElement) {
                this.textElement.textContent = this.getText();
            }
        }
    };

    /**
     * Show the indicator (manual control)
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.show = function() {
        if (this.element) {
            this.element.removeAttribute('hidden');
            this.element.classList.add('typing-indicator--active');
        }
        return this;
    };

    /**
     * Hide the indicator (manual control)
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.hide = function() {
        if (this.element) {
            this.element.setAttribute('hidden', '');
            this.element.classList.remove('typing-indicator--active');
        }
        return this;
    };

    /**
     * Toggle indicator visibility
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.toggle = function() {
        if (this.element && this.element.classList.contains('typing-indicator--active')) {
            return this.hide();
        }
        return this.show();
    };

    /**
     * Check if indicator is visible
     * @returns {boolean}
     */
    TypingIndicatorInstance.prototype.isVisible = function() {
        return this.element && this.element.classList.contains('typing-indicator--active');
    };

    /**
     * Set custom text (manual override)
     * @param {string} text - Text to display
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.setText = function(text) {
        if (this.textElement) {
            this.textElement.textContent = text;
        }
        return this;
    };

    /**
     * Get the DOM element
     * @returns {Element|null}
     */
    TypingIndicatorInstance.prototype.getElement = function() {
        return this.element;
    };

    // =========================================================================
    // EVENTS
    // =========================================================================

    /**
     * Register event handler
     * @param {string} event - Event name
     * @param {Function} handler - Callback
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.on = function(event, handler) {
        if (typeof handler !== 'function') {
            console.warn('[TypingIndicator] Handler must be a function');
            return this;
        }

        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
        return this;
    };

    /**
     * Remove event handler
     * @param {string} event - Event name
     * @param {Function} handler - Callback (optional, removes all if omitted)
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.off = function(event, handler) {
        if (this.eventHandlers[event]) {
            if (handler) {
                this.eventHandlers[event] = this.eventHandlers[event].filter(function(h) {
                    return h !== handler;
                });
            } else {
                delete this.eventHandlers[event];
            }
        }
        return this;
    };

    /**
     * Register one-time event handler
     * @param {string} event - Event name
     * @param {Function} handler - Callback
     * @returns {TypingIndicatorInstance} this for chaining
     */
    TypingIndicatorInstance.prototype.once = function(event, handler) {
        var self = this;

        var wrappedHandler = function(data) {
            self.off(event, wrappedHandler);
            handler(data);
        };

        return this.on(event, wrappedHandler);
    };

    /**
     * Emit event
     * @private
     */
    TypingIndicatorInstance.prototype._emit = function(event, data) {
        var handlers = this.eventHandlers[event];
        if (handlers) {
            for (var i = 0; i < handlers.length; i++) {
                try {
                    handlers[i](data);
                } catch (e) {
                    console.error('[TypingIndicator] Event handler error:', e);
                }
            }
        }

        // Emit via PubSub
        if (Funky.PubSub && this.options.channel) {
            var pubsubData = { channel: this.options.channel };
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    pubsubData[key] = data[key];
                }
            }
            Funky.PubSub.emit('funky:typing:' + event, pubsubData);
        }
    };

    /**
     * Handle change in typers list
     * @private
     */
    TypingIndicatorInstance.prototype._onChange = function() {
        var typers = this.getTypers();
        var text = this.getText();

        this._emit('change', { typers: typers, text: text });

        if (typeof this.options.onChange === 'function') {
            this.options.onChange(typers, text);
        }

        // Update UI if element exists
        this._updateUI();
    };

    // =========================================================================
    // CLEANUP
    // =========================================================================

    /**
     * Destroy the instance
     */
    TypingIndicatorInstance.prototype.destroy = function() {
        // Stop typing
        this.stopTyping();

        // Clear timers
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // Unbind inputs
        this.unbindAllInputs();

        // Unsubscribe from channel
        if (this._channelSubscription && Funky.Channel && Funky.Channel.unsubscribe) {
            Funky.Channel.unsubscribe(this._channelSubscription);
        }

        // Remove UI element if we rendered it
        if (this.element) {
            this.element.setAttribute('hidden', '');
            this.element.classList.remove('typing-indicator--active');

            // If we created the element, remove it from DOM
            if (this._rendered && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }

        // Clear state
        this.typers = {};
        this.eventHandlers = {};
        this.element = null;
        this.textElement = null;
        this._rendered = false;
    };

    // =========================================================================
    // STATIC API
    // =========================================================================

    var TypingIndicator = {
        /**
         * Create a new typing indicator instance
         * @param {Object} options - Configuration
         * @returns {TypingIndicatorInstance}
         */
        create: function(options) {
            return new TypingIndicatorInstance(options);
        },

        /**
         * Format typing text from array of users
         * @param {Array} users - Array of user objects
         * @param {number} maxNames - Max names before "N people"
         * @returns {string}
         */
        formatText: function(users, maxNames) {
            maxNames = maxNames || 5;

            if (!users || users.length === 0) return '';

            var names = [];
            for (var i = 0; i < users.length; i++) {
                names.push(users[i].name || 'Someone');
            }

            if (names.length === 1) {
                return names[0] + ' is typing...';
            }

            if (names.length === 2) {
                return names[0] + ' and ' + names[1] + ' are typing...';
            }

            if (names.length <= maxNames) {
                var last = names.pop();
                return names.join(', ') + ', and ' + last + ' are typing...';
            }

            return names.length + ' people are typing...';
        },

        /**
         * Default options reference
         */
        DEFAULTS: DEFAULTS,

        /**
         * Store of all instances for tracking
         * @private
         */
        _instances: [],

        /**
         * Auto-initialize typing indicators from data attributes
         */
        autoInit: function() {
            var self = this;

            // Auto-init indicators with [data-typing-indicator]
            var indicators = document.querySelectorAll('[data-typing-indicator]');
            for (var i = 0; i < indicators.length; i++) {
                var el = indicators[i];

                // Skip if already initialized
                if (el._typingIndicator) continue;

                var channel = el.getAttribute('data-typing-channel');
                var timeout = parseInt(el.getAttribute('data-typing-timeout'), 10) || undefined;
                var showDots = el.getAttribute('data-typing-dots') !== 'false';

                var instance = self.create({
                    container: el,
                    channel: channel,
                    timeout: timeout,
                    showDots: showDots
                });

                el._typingIndicator = instance;
                self._instances.push(instance);
            }

            // Auto-bind inputs with [data-typing-input]
            var inputs = document.querySelectorAll('[data-typing-input]');
            for (var j = 0; j < inputs.length; j++) {
                var input = inputs[j];

                // Skip if already bound
                if (input._typingBound) continue;

                var inputChannel = input.getAttribute('data-typing-channel');

                if (inputChannel) {
                    // Find existing indicator for this channel or create one
                    var indicator = self.getByChannel(inputChannel);

                    if (!indicator) {
                        indicator = self.create({
                            channel: inputChannel
                        });
                        self._instances.push(indicator);
                    }

                    indicator.bindInput(input);
                    input._typingBound = true;
                }
            }
        },

        /**
         * Get indicator instance by channel
         * @param {string} channel - Channel name
         * @returns {TypingIndicatorInstance|null}
         */
        getByChannel: function(channel) {
            for (var i = 0; i < this._instances.length; i++) {
                if (this._instances[i].options.channel === channel) {
                    return this._instances[i];
                }
            }
            return null;
        },

        /**
         * Destroy all instances
         */
        destroyAll: function() {
            for (var i = 0; i < this._instances.length; i++) {
                this._instances[i].destroy();
            }
            this._instances = [];
        },

        /**
         * LiveBinding handler for typing indicator
         * @param {Element} element - Target element
         * @param {Object} binding - Binding configuration
         * @returns {Object} Controller with destroy method
         */
        liveBindingHandler: function(element, binding) {
            binding = binding || {};

            var channel = binding.channel || element.getAttribute('data-typing-channel');
            var showDots = binding.showDots !== false;
            var timeout = binding.timeout;

            var indicator = TypingIndicator.create({
                container: element,
                channel: channel,
                showDots: showDots,
                timeout: timeout
            });

            // Store for cleanup
            element._typingIndicator = indicator;

            return {
                destroy: function() {
                    if (element._typingIndicator) {
                        element._typingIndicator.destroy();
                        delete element._typingIndicator;
                    }
                }
            };
        }
    };

    // =========================================================================
    // AUTO-INIT ON DOM READY
    // =========================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            TypingIndicator.autoInit();
        });
    } else {
        // DOM already ready
        TypingIndicator.autoInit();
    }

    // =========================================================================
    // LIVEBINDING REGISTRATION
    // =========================================================================

    // Register with LiveBinding if available
    if (Funky.LiveBinding && Funky.LiveBinding.register) {
        Funky.LiveBinding.register('typing-indicator', TypingIndicator.liveBindingHandler);
    }

    // =========================================================================
    // EXPORT
    // =========================================================================

    if (Funky.register) {
        Funky.register('TypingIndicator', TypingIndicator);
    }

})(window);
