/**
 * IdleDetector - User activity and idle state detection
 *
 * Tracks user activity to determine idle states for presence,
 * auto-logout, resource management, and analytics.
 *
 * @namespace Funky.IdleDetector
 */
(function(global) {
    'use strict';

    // Ensure Funky namespace exists
    var Funky = global.Funky || (global.Funky = {});

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================

    var _initialized = false;
    var _config = {};
    var _state = 'active';        // 'active', 'idle', 'away'
    var _lastActivity = Date.now();
    var _idleTimer = null;
    var _checkTimer = null;
    var _idleStartTime = null;
    var _awayStartTime = null;
    var _paused = false;
    var _eventHandlers = {};
    var _boundHandlers = {};      // Stores bound event handlers for cleanup
    var _lastThrottleTime = 0;

    // Visibility state
    var _visibilityHidden = false;
    var _windowFocused = true;
    var _awayTimer = null;

    // =========================================================================
    // DEFAULT OPTIONS
    // =========================================================================

    var DEFAULTS = {
        idleTimeout: 300000,      // 5 minutes
        awayTimeout: 60000,       // 1 minute when tab hidden
        events: ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'],
        throttle: 1000,           // Throttle activity events
        checkInterval: 30000,     // Check idle state every 30s
        trackVisibility: true,
        onIdle: null,
        onActive: null,
        onAway: null,
        onReturn: null,
        debug: false
    };

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    function log() {
        if (_config.debug) {
            console.log.apply(console, ['[IdleDetector]'].concat(Array.prototype.slice.call(arguments)));
        }
    }

    function emit(event, data) {
        data = data || {};

        // Call registered handlers
        var handlers = _eventHandlers[event];
        if (handlers) {
            handlers.forEach(function(handler) {
                try {
                    handler(data);
                } catch (e) {
                    console.error('[IdleDetector] Event handler error:', e);
                }
            });
        }

        // Call config callback
        var callbackName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
        if (_config[callbackName] && typeof _config[callbackName] === 'function') {
            try {
                _config[callbackName](data);
            } catch (e) {
                console.error('[IdleDetector] Callback error:', e);
            }
        }

        // Emit via PubSub
        if (Funky.PubSub) {
            Funky.PubSub.emit('funky:idle:' + event, data);
        }

        // Emit DOM event
        if (Funky.Events && Funky.Events.emit) {
            Funky.Events.emit(document, 'funky.idle.' + event, data);
        }
    }

    // =========================================================================
    // ACTIVITY TRACKING
    // =========================================================================

    /**
     * Handle activity event (throttled)
     * @private
     */
    function handleActivity() {
        if (_paused) return;

        var now = Date.now();

        // Throttle activity events
        if (now - _lastThrottleTime < _config.throttle) {
            return;
        }
        _lastThrottleTime = now;

        log('Activity detected');

        _lastActivity = now;

        // If was idle, transition to active
        if (_state === 'idle') {
            var idleDuration = _idleStartTime ? now - _idleStartTime : 0;

            _state = 'active';
            _idleStartTime = null;

            log('State: idle → active (was idle for', idleDuration, 'ms)');

            emit('active', {
                idleDuration: idleDuration,
                timestamp: now
            });
        }

        // Reset idle timer
        resetIdleTimer();
    }

    /**
     * Reset the idle timer
     * @private
     */
    function resetIdleTimer() {
        if (_idleTimer) {
            clearTimeout(_idleTimer);
        }

        _idleTimer = setTimeout(function() {
            markIdle();
        }, _config.idleTimeout);
    }

    /**
     * Mark user as idle
     * @private
     */
    function markIdle() {
        if (_paused || _state === 'idle') return;

        var now = Date.now();
        var idleTime = now - _lastActivity;

        _state = 'idle';
        _idleStartTime = now;

        log('State: active → idle (inactive for', idleTime, 'ms)');

        emit('idle', {
            idleTime: idleTime,
            lastActivity: _lastActivity,
            timestamp: now
        });
    }

    /**
     * Bind activity event listeners
     * @private
     */
    function bindActivityListeners() {
        _config.events.forEach(function(eventType) {
            var handler = function() {
                handleActivity();
            };

            _boundHandlers[eventType] = handler;
            document.addEventListener(eventType, handler, { passive: true });
        });
    }

    /**
     * Unbind activity event listeners
     * @private
     */
    function unbindActivityListeners() {
        Object.keys(_boundHandlers).forEach(function(eventType) {
            document.removeEventListener(eventType, _boundHandlers[eventType]);
        });
        _boundHandlers = {};
    }

    // =========================================================================
    // VISIBILITY TRACKING
    // =========================================================================

    /**
     * Handle visibility change (tab hidden/shown)
     * @private
     */
    function handleVisibilityChange() {
        if (!_initialized || _paused) return;

        var now = Date.now();

        if (document.hidden) {
            // Tab is now hidden
            _visibilityHidden = true;

            log('Tab hidden');

            // Start away timer (shorter than idle timeout)
            if (_awayTimer) {
                clearTimeout(_awayTimer);
            }

            _awayTimer = setTimeout(function() {
                markAway();
            }, _config.awayTimeout);

        } else {
            // Tab is now visible
            _visibilityHidden = false;

            log('Tab visible');

            // Clear away timer
            if (_awayTimer) {
                clearTimeout(_awayTimer);
                _awayTimer = null;
            }

            // If was away, transition back
            if (_state === 'away') {
                var awayDuration = _awayStartTime ? now - _awayStartTime : 0;

                _awayStartTime = null;

                log('State: away → checking (was away for', awayDuration, 'ms)');

                // Check if should be idle based on time since last activity
                var timeSinceActivity = now - _lastActivity;
                if (timeSinceActivity >= _config.idleTimeout) {
                    // Was away long enough to be idle
                    _state = 'idle';
                    _idleStartTime = now;

                    log('Returning from away but idle timeout exceeded');

                    emit('return', {
                        awayDuration: awayDuration,
                        timestamp: now,
                        newState: 'idle'
                    });

                    emit('idle', {
                        idleTime: timeSinceActivity,
                        lastActivity: _lastActivity,
                        fromAway: true,
                        timestamp: now
                    });
                } else {
                    // Return to active state
                    _state = 'active';
                    _lastActivity = now;

                    emit('return', {
                        awayDuration: awayDuration,
                        timestamp: now,
                        newState: 'active'
                    });

                    // Reset idle timer
                    resetIdleTimer();
                }
            }
        }
    }

    /**
     * Handle window focus
     * @private
     */
    function handleWindowFocus() {
        if (!_initialized || _paused) return;

        _windowFocused = true;
        log('Window focused');

        // Cancel away timer if pending
        if (_awayTimer) {
            clearTimeout(_awayTimer);
            _awayTimer = null;
        }
    }

    /**
     * Handle window blur
     * @private
     */
    function handleWindowBlur() {
        if (!_initialized || _paused) return;

        _windowFocused = false;
        log('Window blurred');

        // The visibilitychange handler will manage away state
        // Window blur alone doesn't trigger away (user might have multiple monitors)
    }

    /**
     * Mark user as away
     * @private
     */
    function markAway() {
        if (_paused || _state === 'away') return;

        var now = Date.now();
        var previousState = _state;

        _state = 'away';
        _awayStartTime = now;

        // Clear idle timer when away
        if (_idleTimer) {
            clearTimeout(_idleTimer);
            _idleTimer = null;
        }

        log('State:', previousState, '→ away');

        emit('away', {
            timestamp: now,
            wasIdle: previousState === 'idle',
            previousState: previousState
        });
    }

    /**
     * Bind visibility and focus listeners
     * @private
     */
    function bindVisibilityListeners() {
        if (!_config.trackVisibility) return;

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('blur', handleWindowBlur);
    }

    /**
     * Unbind visibility and focus listeners
     * @private
     */
    function unbindVisibilityListeners() {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('blur', handleWindowBlur);
    }

    // =========================================================================
    // PERIODIC CHECKS
    // =========================================================================

    /**
     * Start periodic idle checks
     * @private
     */
    function startPeriodicCheck() {
        if (_checkTimer) {
            clearInterval(_checkTimer);
        }

        _checkTimer = setInterval(function() {
            checkIdleState();
        }, _config.checkInterval);
    }

    /**
     * Stop periodic idle checks
     * @private
     */
    function stopPeriodicCheck() {
        if (_checkTimer) {
            clearInterval(_checkTimer);
            _checkTimer = null;
        }
    }

    /**
     * Check if should be idle based on time since last activity
     * @private
     */
    function checkIdleState() {
        if (_paused || _state === 'idle' || _state === 'away') return;

        var timeSinceActivity = Date.now() - _lastActivity;

        if (timeSinceActivity >= _config.idleTimeout) {
            log('Periodic check: should be idle');
            markIdle();
        }
    }

    // =========================================================================
    // MAIN MODULE
    // =========================================================================

    var IdleDetector = {
        /**
         * Initialize the idle detector
         * @param {Object} options - Configuration options
         * @returns {Object} this for chaining
         */
        init: function(options) {
            if (_initialized) {
                console.warn('[IdleDetector] Already initialized');
                return this;
            }

            _config = Object.assign({}, DEFAULTS, options);
            _state = 'active';
            _lastActivity = Date.now();
            _paused = false;
            _visibilityHidden = document.hidden;
            _windowFocused = document.hasFocus();

            // Bind activity listeners
            bindActivityListeners();

            // Bind visibility listeners
            bindVisibilityListeners();

            // Start idle timer
            resetIdleTimer();

            // Start periodic checks
            startPeriodicCheck();

            // Check if tab is already hidden on init
            if (_config.trackVisibility && document.hidden) {
                log('Tab already hidden on init, starting away timer');
                _awayTimer = setTimeout(function() {
                    markAway();
                }, _config.awayTimeout);
            }

            _initialized = true;
            log('Initialized with timeout:', _config.idleTimeout);

            return this;
        },

        /**
         * Check if initialized
         * @returns {boolean}
         */
        isInitialized: function() {
            return _initialized;
        },

        /**
         * Check if user is idle
         * @returns {boolean}
         */
        isIdle: function() {
            return _state === 'idle';
        },

        /**
         * Check if user is away (tab hidden)
         * @returns {boolean}
         */
        isAway: function() {
            return _state === 'away';
        },

        /**
         * Check if user is active
         * @returns {boolean}
         */
        isActive: function() {
            return _state === 'active';
        },

        /**
         * Get current state
         * @returns {string} 'active', 'idle', or 'away'
         */
        getState: function() {
            return _state;
        },

        /**
         * Get time since last activity in milliseconds
         * @returns {number}
         */
        getIdleTime: function() {
            return Date.now() - _lastActivity;
        },

        /**
         * Get last activity timestamp
         * @returns {number}
         */
        getLastActivity: function() {
            return _lastActivity;
        },

        /**
         * Check if tab is hidden
         * @returns {boolean}
         */
        isTabHidden: function() {
            return document.hidden;
        },

        /**
         * Check if window is focused
         * @returns {boolean}
         */
        isWindowFocused: function() {
            return _windowFocused;
        },

        /**
         * Get away duration if currently away
         * @returns {number|null} Milliseconds away, or null if not away
         */
        getAwayDuration: function() {
            if (_state !== 'away' || !_awayStartTime) return null;
            return Date.now() - _awayStartTime;
        },

        /**
         * Get detailed state information
         * @returns {Object}
         */
        getStateInfo: function() {
            var now = Date.now();
            return {
                state: _state,
                isIdle: _state === 'idle',
                isAway: _state === 'away',
                isActive: _state === 'active',
                isPaused: _paused,
                tabHidden: document.hidden,
                windowFocused: _windowFocused,
                lastActivity: _lastActivity,
                idleTime: now - _lastActivity,
                idleDuration: _idleStartTime ? now - _idleStartTime : null,
                awayDuration: _awayStartTime ? now - _awayStartTime : null
            };
        },

        /**
         * Manually trigger activity (reset idle timer)
         * @returns {Object} this for chaining
         */
        triggerActivity: function() {
            _lastThrottleTime = 0;  // Bypass throttle
            handleActivity();
            return this;
        },

        /**
         * Pause idle detection
         * @returns {Object} this for chaining
         */
        pause: function() {
            _paused = true;

            if (_idleTimer) {
                clearTimeout(_idleTimer);
                _idleTimer = null;
            }

            log('Paused');
            return this;
        },

        /**
         * Resume idle detection
         * @returns {Object} this for chaining
         */
        resume: function() {
            _paused = false;
            _lastActivity = Date.now();
            resetIdleTimer();

            log('Resumed');
            return this;
        },

        /**
         * Check if paused
         * @returns {boolean}
         */
        isPaused: function() {
            return _paused;
        },

        /**
         * Register an event handler
         * @param {string} event - Event name
         * @param {Function} handler - Callback function
         * @returns {Object} this for chaining
         */
        on: function(event, handler) {
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
         * Update configuration
         * @param {Object} options - New options
         * @returns {Object} this for chaining
         */
        configure: function(options) {
            Object.assign(_config, options);

            // Reset timer if timeout changed
            if (options.idleTimeout) {
                resetIdleTimer();
            }

            return this;
        },

        /**
         * Get current configuration
         * @returns {Object}
         */
        getConfig: function() {
            return Object.assign({}, _config);
        },

        /**
         * Destroy the idle detector
         */
        destroy: function() {
            if (!_initialized) return;

            // Clear timers
            if (_idleTimer) {
                clearTimeout(_idleTimer);
                _idleTimer = null;
            }

            if (_awayTimer) {
                clearTimeout(_awayTimer);
                _awayTimer = null;
            }

            stopPeriodicCheck();

            // Unbind listeners
            unbindActivityListeners();
            unbindVisibilityListeners();

            // Clear state
            _eventHandlers = {};
            _state = 'active';
            _idleStartTime = null;
            _awayStartTime = null;
            _visibilityHidden = false;
            _windowFocused = true;
            _initialized = false;

            log('Destroyed');
        }
    };

    // =========================================================================
    // EXPORT
    // =========================================================================

    if (Funky.register) {
        Funky.register('IdleDetector', IdleDetector);
    }

})(window);
