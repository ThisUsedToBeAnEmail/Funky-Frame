/**
 * Funky.PWA.PeriodicSync - Periodic Background Sync API
 *
 * Allows your PWA to run tasks periodically, even when the app is closed.
 * Provides fallback using setInterval for unsupported browsers.
 *
 * Use cases:
 * - Refresh cached content (news, weather)
 * - Sync user data in background
 * - Pre-fetch resources before user needs them
 * - Check for updates and notify user
 *
 * Key concepts:
 * - Tag: Unique identifier for each sync task
 * - Minimum Interval: Hint for how often to run (browser decides actual frequency)
 * - Site Engagement: Browser considers how often user visits your site
 * - Permission: User can revoke in browser settings
 *
 * Browser Support:
 * - Chrome 80+, Edge 80+
 * - Safari: No
 * - Firefox: No
 *
 * @namespace Funky.PWA.PeriodicSync
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _fallbackTags = {};

	// =========================================================================
	// PERIODIC SYNC API
	// =========================================================================

	var PeriodicSync = {
		/**
		 * Check if Periodic Background Sync is supported
		 * @returns {boolean}
		 */
		isSupported: function() {
			return 'serviceWorker' in navigator &&
				'periodicSync' in (global.ServiceWorkerRegistration ? global.ServiceWorkerRegistration.prototype : {});
		},

		/**
		 * Register a periodic sync
		 * @param {string} tag - Unique identifier for this sync
		 * @param {Object} [options] - Configuration options
		 * @param {number} [options.minInterval] - Minimum interval in ms (default: 24 hours)
		 * @returns {Promise<boolean>}
		 */
		register: function(tag, options) {
			var self = this;
			options = options || {};

			if (!tag || typeof tag !== 'string') {
				return Promise.reject(new Error('Tag is required'));
			}

			if (!this.isSupported()) {
				console.log('[Funky.PWA.PeriodicSync] Not supported, falling back to manual sync');
				return this._fallbackRegister(tag, options);
			}

			return navigator.serviceWorker.ready.then(function(registration) {
				return registration.periodicSync.register(tag, {
					minInterval: options.minInterval || 24 * 60 * 60 * 1000 // Default: 24 hours
				}).then(function() {
					console.log('[Funky.PWA.PeriodicSync] Registered:', tag);

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:periodicsync:registered', { tag: tag });
					}

					return true;
				});
			}).catch(function(error) {
				console.error('[Funky.PWA.PeriodicSync] Registration failed:', error);

				// Permission denied or not engaged enough
				if (error.name === 'NotAllowedError') {
					console.log('[Funky.PWA.PeriodicSync] Permission denied, using fallback');
					return self._fallbackRegister(tag, options);
				}

				throw error;
			});
		},

		/**
		 * Unregister a periodic sync
		 * @param {string} tag - Tag to unregister
		 * @returns {Promise<boolean>}
		 */
		unregister: function(tag) {
			var self = this;

			if (!tag || typeof tag !== 'string') {
				return Promise.reject(new Error('Tag is required'));
			}

			// Always clean up fallback
			this._fallbackUnregister(tag);

			if (!this.isSupported()) {
				return Promise.resolve(true);
			}

			return navigator.serviceWorker.ready.then(function(registration) {
				return registration.periodicSync.unregister(tag).then(function() {
					console.log('[Funky.PWA.PeriodicSync] Unregistered:', tag);

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:periodicsync:unregistered', { tag: tag });
					}

					return true;
				});
			}).catch(function(error) {
				console.warn('[Funky.PWA.PeriodicSync] Unregister error:', error);
				return false;
			});
		},

		/**
		 * Unregister all periodic syncs
		 * @returns {Promise<boolean>}
		 */
		unregisterAll: function() {
			var self = this;

			return this.getTags().then(function(tags) {
				var promises = tags.map(function(tag) {
					return self.unregister(tag);
				});

				return Promise.all(promises).then(function() {
					return true;
				});
			});
		},

		/**
		 * Get all registered periodic sync tags
		 * @returns {Promise<string[]>}
		 */
		getTags: function() {
			var fallbackKeys = Object.keys(_fallbackTags);

			if (!this.isSupported()) {
				return Promise.resolve(fallbackKeys);
			}

			return navigator.serviceWorker.ready.then(function(registration) {
				return registration.periodicSync.getTags().then(function(nativeTags) {
					// Combine native and fallback tags
					var allTags = nativeTags.slice();

					fallbackKeys.forEach(function(key) {
						if (allTags.indexOf(key) === -1) {
							allTags.push(key);
						}
					});

					return allTags;
				});
			}).catch(function(error) {
				console.warn('[Funky.PWA.PeriodicSync] getTags error:', error);
				return fallbackKeys;
			});
		},

		/**
		 * Check permission status for periodic sync
		 * @returns {Promise<string>} 'granted', 'denied', 'prompt', 'unknown'
		 */
		getPermissionStatus: function() {
			if (!navigator.permissions) {
				return Promise.resolve('unknown');
			}

			return navigator.permissions.query({ name: 'periodic-background-sync' })
				.then(function(status) {
					return status.state;
				})
				.catch(function() {
					return 'unknown';
				});
		},

		/**
		 * Check if a specific tag is registered
		 * @param {string} tag - Tag to check
		 * @returns {Promise<boolean>}
		 */
		isRegistered: function(tag) {
			return this.getTags().then(function(tags) {
				return tags.indexOf(tag) !== -1;
			});
		},

		/**
		 * Get sync info for a specific tag
		 * @param {string} tag - Tag to check
		 * @returns {Promise<Object|null>}
		 */
		getInfo: function(tag) {
			var fallbackInfo = _fallbackTags[tag];

			if (fallbackInfo) {
				return Promise.resolve({
					tag: tag,
					minInterval: fallbackInfo.minInterval,
					fallback: true,
					lastSync: fallbackInfo.lastSync || null
				});
			}

			return this.isRegistered(tag).then(function(registered) {
				if (!registered) return null;

				return {
					tag: tag,
					fallback: false
				};
			});
		},

		/**
		 * Manually trigger a sync (useful for testing or immediate updates)
		 * @param {string} tag - Tag to trigger
		 * @returns {Promise}
		 */
		trigger: function(tag) {
			console.log('[Funky.PWA.PeriodicSync] Manual trigger:', tag);

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:pwa:periodicsync', { tag: tag, manual: true });
			}

			return Promise.resolve();
		},

		// =========================================================================
		// FALLBACK IMPLEMENTATION
		// Uses setInterval for unsupported browsers (only runs while page is open)
		// =========================================================================

		/**
		 * Register fallback sync using setInterval
		 * @private
		 * @param {string} tag
		 * @param {Object} options
		 * @returns {Promise<boolean>}
		 */
		_fallbackRegister: function(tag, options) {
			var self = this;
			var interval = options.minInterval || 24 * 60 * 60 * 1000;

			// For fallback, use a shorter interval when page is open
			// Max 1 hour or the requested interval, whichever is smaller
			var effectiveInterval = Math.min(interval, 60 * 60 * 1000);

			// Clear existing if any
			this._fallbackUnregister(tag);

			// Create interval
			_fallbackTags[tag] = {
				interval: setInterval(function() {
					self._triggerFallbackSync(tag);
				}, effectiveInterval),
				minInterval: interval,
				effectiveInterval: effectiveInterval,
				lastSync: null
			};

			// Trigger immediately
			this._triggerFallbackSync(tag);

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:pwa:periodicsync:registered', { tag: tag, fallback: true });
			}

			return Promise.resolve(true);
		},

		/**
		 * Unregister fallback sync
		 * @private
		 * @param {string} tag
		 * @returns {Promise<boolean>}
		 */
		_fallbackUnregister: function(tag) {
			if (_fallbackTags[tag]) {
				clearInterval(_fallbackTags[tag].interval);
				delete _fallbackTags[tag];
			}
			return Promise.resolve(true);
		},

		/**
		 * Trigger fallback sync event
		 * @private
		 * @param {string} tag
		 */
		_triggerFallbackSync: function(tag) {
			console.log('[Funky.PWA.PeriodicSync] Fallback sync triggered:', tag);

			if (_fallbackTags[tag]) {
				_fallbackTags[tag].lastSync = Date.now();
			}

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:pwa:periodicsync', { tag: tag, fallback: true });
			}
		},

		/**
		 * Get fallback tags (for testing)
		 * @private
		 * @returns {Object}
		 */
		_getFallbackTags: function() {
			return _fallbackTags;
		},

		/**
		 * Clear all fallback syncs (for cleanup)
		 * @private
		 */
		_clearFallbacks: function() {
			var self = this;
			Object.keys(_fallbackTags).forEach(function(tag) {
				self._fallbackUnregister(tag);
			});
		}
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.PeriodicSync = PeriodicSync;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.PeriodicSync', PeriodicSync);
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
