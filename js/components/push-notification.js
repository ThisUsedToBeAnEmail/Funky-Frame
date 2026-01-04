/**
 * PushNotification - Browser Push Notification API wrapper
 *
 * Provides a clean API for requesting notification permissions and
 * sending push notifications via the Service Worker.
 *
 * @namespace Funky.PushNotification
 * @requires Service Worker with SHOW_NOTIFICATION handler
 *
 * @example Basic usage
 * // Request permission
 * Funky.PushNotification.requestPermission().then(function(permission) {
 *     if (permission === 'granted') {
 *         Funky.PushNotification.show('Hello!', {
 *             body: 'This is a notification',
 *             delay: 5
 *         });
 *     }
 * });
 *
 * @example Check support and permission
 * if (Funky.PushNotification.isSupported()) {
 *     var permission = Funky.PushNotification.getPermission();
 *     console.log('Current permission:', permission);
 * }
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// Registry guard - prevent double registration
	if (Funky.isRegistered && Funky.isRegistered('PushNotification')) {
		return;
	}

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _swRegistration = null;
	var _swReady = false;
	var _eventHandlers = {};

	// =========================================================================
	// DEFAULT OPTIONS
	// =========================================================================

	var DEFAULTS = {
		icon: '/assets/img/icon-192.png',
		badge: '/assets/img/badge-72.png',
		vibrate: [200, 100, 200],
		tag: null,
		renotify: true,
		requireInteraction: false,
		silent: false,
		delay: 0,
		data: {}
	};

	// =========================================================================
	// PRIVATE HELPERS
	// =========================================================================

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
					console.error('[PushNotification] Event handler error:', e);
				}
			}
		}

		// Emit via PubSub
		if (Funky.PubSub) {
			Funky.PubSub.emit('funky:push-notification:' + event, data);
		}

		// Emit DOM event
		if (Funky.Events && Funky.Events.emit) {
			Funky.Events.emit(document, 'funky.push-notification.' + event, data);
		}
	}

	/**
	 * Get the service worker registration
	 * @returns {Promise<ServiceWorkerRegistration>}
	 */
	function getServiceWorker() {
		if (_swRegistration) {
			return Promise.resolve(_swRegistration);
		}

		if (!('serviceWorker' in navigator)) {
			return Promise.reject(new Error('Service Worker not supported'));
		}

		return navigator.serviceWorker.ready.then(function(registration) {
			_swRegistration = registration;
			_swReady = true;
			return registration;
		});
	}

	// =========================================================================
	// MAIN MODULE
	// =========================================================================

	var PushNotification = {
		/**
		 * Default notification options
		 */
		DEFAULTS: DEFAULTS,

		/**
		 * Check if push notifications are supported
		 * @returns {boolean}
		 */
		isSupported: function() {
			return 'Notification' in window && 'serviceWorker' in navigator;
		},

		/**
		 * Check if service worker is ready
		 * @returns {boolean}
		 */
		isReady: function() {
			return _swReady && _swRegistration && _swRegistration.active;
		},

		/**
		 * Get current notification permission
		 * @returns {string} 'granted' | 'denied' | 'default'
		 */
		getPermission: function() {
			if (!('Notification' in window)) {
				return 'unsupported';
			}
			return Notification.permission;
		},

		/**
		 * Request notification permission
		 * @returns {Promise<string>} Permission result
		 */
		requestPermission: function() {
			if (!('Notification' in window)) {
				return Promise.reject(new Error('Notifications not supported'));
			}

			return Notification.requestPermission().then(function(permission) {
				emit('permission', { permission: permission });
				return permission;
			});
		},

		/**
		 * Initialize and wait for service worker to be ready
		 * @returns {Promise<boolean>} True if ready
		 */
		init: function() {
			var self = this;

			return getServiceWorker().then(function(registration) {
				console.log('[PushNotification] Service Worker ready');
				emit('ready', { registration: registration });
				return true;
			}).catch(function(error) {
				console.error('[PushNotification] Init failed:', error);
				emit('error', { error: error });
				return false;
			});
		},

		/**
		 * Show a push notification via Service Worker
		 * @param {string} title - Notification title
		 * @param {Object} [options] - Notification options
		 * @param {string} [options.body] - Notification body text
		 * @param {string} [options.icon] - Icon URL
		 * @param {string} [options.badge] - Badge icon URL
		 * @param {string} [options.tag] - Tag for grouping notifications
		 * @param {number} [options.delay] - Delay in seconds before showing
		 * @param {Object} [options.data] - Custom data for click handler
		 * @param {boolean} [options.renotify] - Vibrate again if same tag
		 * @param {boolean} [options.requireInteraction] - Keep visible until interaction
		 * @param {boolean} [options.silent] - Suppress sound/vibration
		 * @param {Array} [options.vibrate] - Vibration pattern
		 * @returns {Promise<void>}
		 */
		show: function(title, options) {
			var self = this;
			options = options || {};

			// Merge with defaults
			var mergedOptions = {};
			for (var key in DEFAULTS) {
				mergedOptions[key] = DEFAULTS[key];
			}
			for (var opt in options) {
				if (options[opt] !== undefined) {
					mergedOptions[opt] = options[opt];
				}
			}

			// Check permission
			if (this.getPermission() !== 'granted') {
				return Promise.reject(new Error('Notification permission not granted'));
			}

			return getServiceWorker().then(function(registration) {
				if (!registration.active) {
					throw new Error('Service Worker not active');
				}

				// Send message to service worker
				// FunkySW.Messaging expects { type: '...', data: { ... } } format
				registration.active.postMessage({
					type: 'SHOW_NOTIFICATION',
					data: {
						title: title,
						body: mergedOptions.body || '',
						icon: mergedOptions.icon,
						badge: mergedOptions.badge,
						tag: mergedOptions.tag,
						delay: mergedOptions.delay || 0,
						data: mergedOptions.data,
						renotify: mergedOptions.renotify,
						requireInteraction: mergedOptions.requireInteraction,
						silent: mergedOptions.silent,
						vibrate: mergedOptions.vibrate
					}
				});

				emit('show', {
					title: title,
					options: mergedOptions
				});

				console.log('[PushNotification] Sent:', title, mergedOptions.delay ? '(delay: ' + mergedOptions.delay + 's)' : '');
			});
		},

		/**
		 * Show notification immediately (no delay)
		 * @param {string} title - Notification title
		 * @param {Object} [options] - Notification options
		 * @returns {Promise<void>}
		 */
		showNow: function(title, options) {
			options = options || {};
			options.delay = 0;
			return this.show(title, options);
		},

		/**
		 * Schedule a notification with delay
		 * @param {string} title - Notification title
		 * @param {number} delaySeconds - Delay in seconds
		 * @param {Object} [options] - Notification options
		 * @returns {Promise<void>}
		 */
		schedule: function(title, delaySeconds, options) {
			options = options || {};
			options.delay = delaySeconds;
			return this.show(title, options);
		},

		/**
		 * Get the service worker registration
		 * @returns {ServiceWorkerRegistration|null}
		 */
		getRegistration: function() {
			return _swRegistration;
		},

		/**
		 * Update default options
		 * @param {Object} newDefaults - New default values
		 */
		setDefaults: function(newDefaults) {
			for (var key in newDefaults) {
				if (newDefaults.hasOwnProperty(key)) {
					DEFAULTS[key] = newDefaults[key];
				}
			}
		},

		/**
		 * Get current defaults
		 * @returns {Object}
		 */
		getDefaults: function() {
			var copy = {};
			for (var key in DEFAULTS) {
				copy[key] = DEFAULTS[key];
			}
			return copy;
		},

		// =====================================================================
		// EVENT METHODS
		// =====================================================================

		/**
		 * Register an event handler
		 * @param {string} event - Event name (permission, ready, show, error)
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
		 * @param {Function} [handler] - Handler to remove (all if omitted)
		 * @returns {Object} this for chaining
		 */
		off: function(event, handler) {
			if (!_eventHandlers[event]) return this;

			if (handler) {
				_eventHandlers[event] = _eventHandlers[event].filter(function(h) {
					return h !== handler;
				});
			} else {
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
		}
	};

	// =========================================================================
	// AUTO-INIT
	// =========================================================================

	// Auto-init when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			PushNotification.init();
		});
	} else {
		PushNotification.init();
	}

	// =========================================================================
	// EXPORT
	// =========================================================================

	if (Funky.register) {
		Funky.register('PushNotification', PushNotification);
	} else {
		Funky.PushNotification = PushNotification;
	}

	console.log('[Funky.PushNotification] v1.0.0 loaded');

})(window);
