/**
 * Funky.PWA.WakeLock - Screen Wake Lock API
 *
 * Prevents the device screen from dimming or locking while your app is active.
 * Essential for video playback, presentations, recipes, navigation, and kiosks.
 *
 * The lock is automatically released when the tab becomes hidden. Use
 * enableAutoReacquire() to re-acquire when the user returns.
 *
 * Browser Support:
 * - Chrome 84+
 * - Edge 84+
 * - Safari: No
 * - Firefox: No
 *
 * @namespace Funky.PWA.WakeLock
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _wakeLock = null;
	var _releaseCallbacks = [];
	var _autoReacquireEnabled = false;
	var _wasActiveBeforeHidden = false;

	// =========================================================================
	// WAKE LOCK API
	// =========================================================================

	var WakeLock = {
		/**
		 * Check if Screen Wake Lock API is supported
		 * @returns {boolean}
		 */
		isSupported: function() {
			return 'wakeLock' in navigator;
		},

		/**
		 * Request a screen wake lock
		 * Prevents the screen from dimming or locking.
		 * @returns {Promise<boolean>} Resolves to true on success
		 */
		request: function() {
			var self = this;

			if (!this.isSupported()) {
				return Promise.resolve(false);
			}

			// Already active
			if (_wakeLock && !_wakeLock.released) {
				return Promise.resolve(true);
			}

			return navigator.wakeLock.request('screen')
				.then(function(lock) {
					_wakeLock = lock;

					// Emit PubSub event
					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:wakelock:acquired');
					}

					// Handle release (e.g., tab hidden, low battery)
					lock.addEventListener('release', function() {
						_wakeLock = null;

						// Call registered callbacks
						_releaseCallbacks.forEach(function(cb) {
							try {
								cb();
							} catch (e) {
								console.warn('[Funky.PWA.WakeLock] Release callback error:', e);
							}
						});

						// Emit PubSub event
						if (Funky.PubSub) {
							Funky.PubSub.emit('funky:pwa:wakelock:released');
						}
					});

					return true;
				})
				.catch(function(error) {
					console.warn('[Funky.PWA.WakeLock] Failed to acquire:', error);
					return false;
				});
		},

		/**
		 * Release the wake lock
		 * @returns {Promise<boolean>} Resolves to true if released
		 */
		release: function() {
			if (_wakeLock && !_wakeLock.released) {
				return _wakeLock.release()
					.then(function() {
						_wakeLock = null;
						return true;
					})
					.catch(function(error) {
						console.warn('[Funky.PWA.WakeLock] Failed to release:', error);
						return false;
					});
			}
			return Promise.resolve(false);
		},

		/**
		 * Check if wake lock is currently active
		 * @returns {boolean}
		 */
		isActive: function() {
			return !!_wakeLock && !_wakeLock.released;
		},

		/**
		 * Toggle wake lock on/off
		 * @returns {Promise<boolean>} Resolves to new state (true = active)
		 */
		toggle: function() {
			if (this.isActive()) {
				return this.release().then(function() {
					return false;
				});
			} else {
				return this.request();
			}
		},

		/**
		 * Register callback for when lock is released
		 * Callbacks are called when the lock is released for any reason
		 * (tab hidden, low battery, explicit release, etc.)
		 * @param {function} callback - Function to call on release
		 * @returns {function} Unsubscribe function
		 */
		onRelease: function(callback) {
			if (typeof callback === 'function') {
				_releaseCallbacks.push(callback);

				// Return unsubscribe function
				return function() {
					var index = _releaseCallbacks.indexOf(callback);
					if (index > -1) {
						_releaseCallbacks.splice(index, 1);
					}
				};
			}
			return function() {};
		},

		/**
		 * Remove a release callback
		 * @param {function} callback - Function to remove
		 */
		offRelease: function(callback) {
			var index = _releaseCallbacks.indexOf(callback);
			if (index > -1) {
				_releaseCallbacks.splice(index, 1);
			}
		},

		/**
		 * Enable auto-reacquire when page becomes visible
		 * Call this once to enable the behavior. When the tab is hidden,
		 * the browser releases the wake lock. With auto-reacquire enabled,
		 * the lock will be re-acquired when the tab becomes visible again.
		 */
		enableAutoReacquire: function() {
			if (_autoReacquireEnabled) {
				return;
			}

			var self = this;
			_autoReacquireEnabled = true;

			document.addEventListener('visibilitychange', function() {
				if (document.visibilityState === 'hidden') {
					// Remember if we had an active lock before hiding
					_wasActiveBeforeHidden = self.isActive();
				} else if (document.visibilityState === 'visible' && _wasActiveBeforeHidden) {
					// Re-acquire if we had one before
					self.request();
				}
			});
		},

		/**
		 * Disable auto-reacquire behavior
		 * Note: This doesn't remove the event listener, just prevents re-acquisition
		 */
		disableAutoReacquire: function() {
			_autoReacquireEnabled = false;
			_wasActiveBeforeHidden = false;
		},

		/**
		 * Check if auto-reacquire is enabled
		 * @returns {boolean}
		 */
		isAutoReacquireEnabled: function() {
			return _autoReacquireEnabled;
		}
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.WakeLock = WakeLock;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.WakeLock', WakeLock);
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
