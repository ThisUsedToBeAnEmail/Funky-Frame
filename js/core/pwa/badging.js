/**
 * Funky.PWA.Badging - App Badging API
 *
 * Displays badge counts on the installed PWA icon (dock, taskbar, home screen).
 * Similar to native app unread message counts.
 *
 * Browser Support:
 * - Chrome 81+
 * - Edge 81+
 * - Safari: No
 * - Firefox: No
 *
 * Note: Badge only visible when PWA is installed (standalone mode).
 *
 * @namespace Funky.PWA.Badging
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// BADGING API
	// =========================================================================

	var Badging = {
		/**
		 * Check if App Badging API is supported
		 * @returns {boolean}
		 */
		isSupported: function() {
			return 'setAppBadge' in navigator;
		},

		/**
		 * Set badge count on app icon
		 * @param {number} count - Number to display (0 or negative clears badge)
		 * @returns {Promise<boolean>} Resolves to true on success
		 */
		set: function(count) {
			if (!this.isSupported()) {
				return Promise.resolve(false);
			}

			count = parseInt(count, 10) || 0;

			if (count <= 0) {
				return this.clear();
			}

			return navigator.setAppBadge(count)
				.then(function() {
					return true;
				})
				.catch(function(error) {
					console.warn('[Funky.PWA.Badging] Failed to set badge:', error);
					return false;
				});
		},

		/**
		 * Clear the badge
		 * @returns {Promise<boolean>} Resolves to true on success
		 */
		clear: function() {
			if (!this.isSupported()) {
				return Promise.resolve(false);
			}

			return navigator.clearAppBadge()
				.then(function() {
					return true;
				})
				.catch(function(error) {
					console.warn('[Funky.PWA.Badging] Failed to clear badge:', error);
					return false;
				});
		},

		/**
		 * Set a flag badge (dot indicator, no number)
		 * Shows that something needs attention without a specific count.
		 * @returns {Promise<boolean>} Resolves to true on success
		 */
		setFlag: function() {
			if (!this.isSupported()) {
				return Promise.resolve(false);
			}

			// Calling setAppBadge without a number shows a dot
			return navigator.setAppBadge()
				.then(function() {
					return true;
				})
				.catch(function(error) {
					console.warn('[Funky.PWA.Badging] Failed to set flag:', error);
					return false;
				});
		}
	};

	// =========================================================================
	// NOTIFICATION CENTER INTEGRATION
	// =========================================================================

	/**
	 * Auto-update badge when notification count changes
	 */
	function setupNotificationCenterIntegration() {
		if (!Funky.PubSub) {
			return;
		}

		// Update badge when unread count changes
		Funky.PubSub.on('funky:notification:count', function(data) {
			if (typeof data.unread === 'number') {
				Badging.set(data.unread);
			}
		});

		// Clear badge when all notifications read
		Funky.PubSub.on('funky:notification:markAllRead', function() {
			Badging.clear();
		});

		// Also listen for notification center specific events
		Funky.PubSub.on('funky:notification-center:count', function(data) {
			if (typeof data.unread === 'number') {
				Badging.set(data.unread);
			}
		});

		Funky.PubSub.on('funky:notification-center:cleared', function() {
			Badging.clear();
		});
	}

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.Badging = Badging;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.Badging', Badging);
	}

	// Setup integration after DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setupNotificationCenterIntegration);
	} else {
		setupNotificationCenterIntegration();
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
