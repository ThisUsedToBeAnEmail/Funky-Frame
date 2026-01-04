/**
 * Funky.ServiceWorker - Service Worker Client Module
 *
 * Provides client-side API for registering, messaging, and interacting with
 * service workers. Integrates with PubSub for lifecycle events.
 *
 * @module Funky.ServiceWorker
 * @version 1.0.1
 * @requires Funky (namespace.js must load first)
 * @requires Funky.PubSub (for lifecycle events)
 *
 * @example Registration
 * Funky.ServiceWorker.register('/sw.js', { scope: '/' })
 *   .then(function(reg) { console.log('SW registered'); });
 *
 * @example Messaging
 * Funky.ServiceWorker.postMessage('CACHE_CLEAR', { cacheName: 'my-cache' });
 * Funky.ServiceWorker.onMessage('SW_READY', function(data) { ... });
 *
 * @example Notifications
 * Funky.ServiceWorker.showNotification('Hello', { body: 'World' });
 *
 * PubSub Events:
 *   funky:sw:installing   - SW is installing
 *   funky:sw:installed    - SW installed, waiting to activate
 *   funky:sw:activating   - SW is activating
 *   funky:sw:activated    - SW activated and controlling page
 *   funky:sw:updated      - New version available
 *   funky:sw:error        - Registration or update error
 *   funky:sw:message      - Message received from SW
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.ServiceWorker] Registry not found. Load namespace.js first.');
        return;
    }

    // Guard against double registration
    if (Funky.isRegistered && Funky.isRegistered('ServiceWorker')) {
        return;
    }

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================

    var _registration = null;
    var _ready = false;
    var _messageHandlers = {};
    var _updateInterval = null;
    var _options = {};

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Emit PubSub event if available
     * @private
     */
    function _emit(event, data) {
        if (Funky.PubSub && typeof Funky.PubSub.emit === 'function') {
            Funky.PubSub.emit(event, data);
        }
    }

    /**
     * Track installing service worker state changes
     * @private
     */
    function _trackInstalling(sw) {
        if (!sw) return;

        _emit('funky:sw:installing', { registration: _registration });

        sw.addEventListener('statechange', function() {
            switch (sw.state) {
                case 'installed':
                    if (navigator.serviceWorker.controller) {
                        // New version waiting
                        _emit('funky:sw:updated', {
                            registration: _registration,
                            waiting: sw
                        });

                        if (_options.onUpdate) {
                            _options.onUpdate(_registration);
                        }
                    } else {
                        // First install
                        _emit('funky:sw:installed', { registration: _registration });
                    }
                    break;

                case 'activating':
                    _emit('funky:sw:activating', { registration: _registration });
                    break;

                case 'activated':
                    _ready = true;
                    _emit('funky:sw:activated', { registration: _registration });

                    if (_options.autoReload && navigator.serviceWorker.controller) {
                        window.location.reload();
                    }
                    break;

                case 'redundant':
                    console.warn('[Funky.ServiceWorker] SW became redundant');
                    break;
            }
        });
    }

    /**
     * Setup message listener from service worker
     * @private
     */
    function _setupMessageListener() {
        navigator.serviceWorker.addEventListener('message', function(event) {
            var type = event.data && event.data.type;
            var data = event.data && event.data.data;

            // Emit generic message event
            _emit('funky:sw:message', { type: type, data: data });

            // Call type-specific handlers
            if (type && _messageHandlers[type]) {
                var handlers = _messageHandlers[type].slice(); // Copy to avoid mutation issues
                for (var i = 0; i < handlers.length; i++) {
                    try {
                        handlers[i](data);
                    } catch (e) {
                        console.error('[Funky.ServiceWorker] Message handler error:', e);
                    }
                }
            }
        });
    }

    /**
     * Setup controller change listener
     * @private
     */
    function _setupControllerListener() {
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            _ready = true;
            _emit('funky:sw:activated', { registration: _registration });

            if (_options.autoReload) {
                window.location.reload();
            }
        });
    }

    /**
     * Start periodic update checking
     * @private
     */
    function _startUpdateInterval(interval) {
        if (_updateInterval) {
            clearInterval(_updateInterval);
        }

        if (interval > 0) {
            _updateInterval = setInterval(function() {
                ServiceWorker.update().catch(function() {
                    // Silently ignore update check errors
                });
            }, interval);
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    var ServiceWorker = {
        // =====================================================================
        // REGISTRATION
        // =====================================================================

        /**
         * Check if service workers are supported
         * @returns {boolean}
         */
        isSupported: function() {
            return 'serviceWorker' in navigator;
        },

        /**
         * Register a service worker
         * @param {string} swPath - Path to service worker file (e.g., '/sw.js')
         * @param {Object} [options] - Registration options
         * @param {string} [options.scope='/'] - URL scope the SW controls
         * @param {number} [options.updateInterval=0] - Check for updates every N ms (0 to disable)
         * @param {Function} [options.onUpdate] - Callback when update is available
         * @param {boolean} [options.autoReload=false] - Auto-reload page when update activates
         * @returns {Promise<ServiceWorkerRegistration>}
         */
        register: function(swPath, options) {
            var self = this;
            options = options || {};
            _options = options;

            if (!this.isSupported()) {
                return Promise.reject(new Error('Service workers not supported'));
            }

            if (!swPath || typeof swPath !== 'string') {
                return Promise.reject(new Error('Invalid service worker path'));
            }

            // Setup listeners once
            _setupMessageListener();
            _setupControllerListener();

            return navigator.serviceWorker.register(swPath, {
                scope: options.scope || '/'
            }).then(function(registration) {
                _registration = registration;

                console.log('[Funky.ServiceWorker] Registered:', swPath);

                // Track installing SW
                if (registration.installing) {
                    _trackInstalling(registration.installing);
                }

                // Already waiting = update available
                if (registration.waiting) {
                    _emit('funky:sw:updated', {
                        registration: registration,
                        waiting: registration.waiting
                    });

                    if (options.onUpdate) {
                        options.onUpdate(registration);
                    }
                }

                // Already active
                if (registration.active) {
                    _ready = true;
                }

                // Listen for future updates
                registration.addEventListener('updatefound', function() {
                    _trackInstalling(registration.installing);
                });

                // Start periodic update checking
                if (options.updateInterval) {
                    _startUpdateInterval(options.updateInterval);
                }

                return registration;
            }).catch(function(error) {
                console.error('[Funky.ServiceWorker] Registration failed:', error);
                _emit('funky:sw:error', { error: error });
                throw error;
            });
        },

        /**
         * Unregister the current service worker
         * @returns {Promise<boolean>} - true if unregistered
         */
        unregister: function() {
            if (!_registration) {
                return Promise.resolve(false);
            }

            if (_updateInterval) {
                clearInterval(_updateInterval);
                _updateInterval = null;
            }

            return _registration.unregister().then(function(success) {
                if (success) {
                    console.log('[Funky.ServiceWorker] Unregistered');
                    _registration = null;
                    _ready = false;
                }
                return success;
            });
        },

        /**
         * Force check for service worker updates
         * @returns {Promise<ServiceWorkerRegistration>}
         */
        update: function() {
            if (!_registration) {
                return Promise.reject(new Error('No service worker registered'));
            }

            return _registration.update();
        },

        /**
         * Skip waiting and activate the new service worker
         * @returns {Promise<void>}
         */
        skipWaiting: function() {
            if (!_registration || !_registration.waiting) {
                return Promise.reject(new Error('No waiting service worker'));
            }

            return this.postMessage('FUNKY_SW_SKIP_WAITING', null, _registration.waiting);
        },

        // =====================================================================
        // MESSAGING
        // =====================================================================

        /**
         * Send a message to the active service worker
         * @param {string} type - Message type identifier
         * @param {*} data - Data to send
         * @param {ServiceWorker} [targetSW] - Specific SW to message (default: active)
         * @returns {Promise<void>}
         */
        postMessage: function(type, data, targetSW) {
            var sw = targetSW || (_registration && _registration.active);

            if (!sw) {
                return Promise.reject(new Error('No active service worker'));
            }

            sw.postMessage({ type: type, data: data });
            return Promise.resolve();
        },

        /**
         * Listen for messages from the service worker
         * @param {string} type - Message type to listen for
         * @param {Function} handler - Callback receiving the data
         * @returns {Function} - Unsubscribe function
         */
        onMessage: function(type, handler) {
            if (typeof type !== 'string' || typeof handler !== 'function') {
                console.error('[Funky.ServiceWorker] Invalid arguments to onMessage()');
                return function() {};
            }

            if (!_messageHandlers[type]) {
                _messageHandlers[type] = [];
            }

            _messageHandlers[type].push(handler);

            // Return unsubscribe function
            var self = this;
            return function() {
                self.offMessage(type, handler);
            };
        },

        /**
         * Remove message listener
         * @param {string} type - Message type
         * @param {Function} [handler] - Specific handler to remove (omit to remove all)
         */
        offMessage: function(type, handler) {
            if (!_messageHandlers[type]) {
                return;
            }

            if (handler === undefined) {
                delete _messageHandlers[type];
                return;
            }

            _messageHandlers[type] = _messageHandlers[type].filter(function(h) {
                return h !== handler;
            });

            if (_messageHandlers[type].length === 0) {
                delete _messageHandlers[type];
            }
        },

        // =====================================================================
        // NOTIFICATIONS
        // =====================================================================

        /**
         * Show a notification via the service worker
         * (Bypasses some browser restrictions vs direct Notification API)
         * @param {string} title - Notification title
         * @param {Object} [options] - Notification options
         * @param {string} [options.body] - Notification body text
         * @param {string} [options.icon] - Icon URL
         * @param {string} [options.badge] - Badge icon URL
         * @param {string} [options.tag] - Tag for grouping/replacing
         * @param {Object} [options.data] - Custom data for click handler
         * @param {boolean} [options.requireInteraction] - Keep notification visible
         * @param {Array} [options.actions] - Action buttons
         * @returns {Promise<void>}
         */
        showNotification: function(title, options) {
            if (!_registration) {
                return Promise.reject(new Error('No service worker registered'));
            }

            options = options || {};

            return _registration.showNotification(title, {
                body: options.body,
                icon: options.icon,
                badge: options.badge,
                tag: options.tag,
                data: options.data,
                requireInteraction: options.requireInteraction || false,
                actions: options.actions || []
            });
        },

        /**
         * Request notification permission from the user
         * @returns {Promise<string>} - 'granted', 'denied', or 'default'
         */
        requestPermission: function() {
            if (!('Notification' in window)) {
                return Promise.resolve('denied');
            }

            return Notification.requestPermission();
        },

        /**
         * Get current notification permission state
         * @returns {string} - 'granted', 'denied', or 'default'
         */
        getPermission: function() {
            if (!('Notification' in window)) {
                return 'denied';
            }
            return Notification.permission;
        },

        // =====================================================================
        // PUSH SUBSCRIPTION
        // =====================================================================

        /**
         * Subscribe to push notifications
         * @param {string} vapidKey - VAPID public key (base64)
         * @param {Object} [options] - Subscription options
         * @param {boolean} [options.userVisibleOnly=true] - Only show visible notifications
         * @returns {Promise<PushSubscription>}
         */
        subscribe: function(vapidKey, options) {
            if (!_registration) {
                return Promise.reject(new Error('No service worker registered'));
            }

            options = options || {};

            // Convert VAPID key from base64 to Uint8Array
            var applicationServerKey = this._urlBase64ToUint8Array(vapidKey);

            return _registration.pushManager.subscribe({
                userVisibleOnly: options.userVisibleOnly !== false,
                applicationServerKey: applicationServerKey
            });
        },

        /**
         * Unsubscribe from push notifications
         * @returns {Promise<boolean>}
         */
        unsubscribe: function() {
            return this.getSubscription().then(function(subscription) {
                if (subscription) {
                    return subscription.unsubscribe();
                }
                return false;
            });
        },

        /**
         * Get current push subscription
         * @returns {Promise<PushSubscription|null>}
         */
        getSubscription: function() {
            if (!_registration) {
                return Promise.resolve(null);
            }

            return _registration.pushManager.getSubscription();
        },

        /**
         * Convert base64 VAPID key to Uint8Array
         * @private
         */
        _urlBase64ToUint8Array: function(base64String) {
            var padding = '='.repeat((4 - base64String.length % 4) % 4);
            var base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            var rawData = window.atob(base64);
            var outputArray = new Uint8Array(rawData.length);

            for (var i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }

            return outputArray;
        },

        // =====================================================================
        // STATE
        // =====================================================================

        /**
         * Check if service worker is active and controlling the page
         * @returns {boolean}
         */
        isReady: function() {
            return _ready && !!navigator.serviceWorker.controller;
        },

        /**
         * Get the service worker registration object
         * @returns {ServiceWorkerRegistration|null}
         */
        getRegistration: function() {
            return _registration;
        },

        /**
         * Get the active service worker
         * @returns {ServiceWorker|null}
         */
        getActive: function() {
            return _registration ? _registration.active : null;
        },

        /**
         * Get the waiting service worker (if update available)
         * @returns {ServiceWorker|null}
         */
        getWaiting: function() {
            return _registration ? _registration.waiting : null;
        },

        /**
         * Wait for service worker to be ready (activated and controlling)
         * @returns {Promise<ServiceWorkerRegistration>}
         */
        ready: function() {
            if (!this.isSupported()) {
                return Promise.reject(new Error('Service workers not supported'));
            }

            return navigator.serviceWorker.ready;
        },

        /**
         * Version info
         */
        version: '1.0.0'
    };

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    // Register with Funky namespace
    Funky.register('ServiceWorker', ServiceWorker);

    console.log('[Funky.ServiceWorker] v' + ServiceWorker.version + ' initialized');

})(window);
