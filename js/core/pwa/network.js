/**
 * Funky.PWA.Network - Network Information API
 *
 * Detects connection type, quality, and online/offline status.
 * Allows adapting app behavior based on network conditions.
 *
 * Use cases:
 * - Load lower quality images on slow connections
 * - Disable autoplay on cellular data
 * - Show offline indicator
 * - Prefetch content only on fast WiFi
 * - Adjust polling frequency
 *
 * Browser Support:
 * - Chrome 61+
 * - Edge 79+
 * - Safari: No (but supports online/offline)
 * - Firefox: No (but supports online/offline)
 *
 * @namespace Funky.PWA.Network
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _onlineCallbacks = [];
	var _connectionCallbacks = [];
	var _listenersInitialized = false;
	var _connectionListenerInitialized = false;

	// =========================================================================
	// NETWORK API
	// =========================================================================

	var Network = {
		/**
		 * Check if Network Information API is supported
		 * @returns {boolean}
		 */
		isSupported: function() {
			return !!(navigator.connection || navigator.mozConnection || navigator.webkitConnection);
		},

		/**
		 * Get the connection object (internal)
		 * @private
		 * @returns {NetworkInformation|null}
		 */
		_getConnection: function() {
			return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
		},

		/**
		 * Get connection information
		 * @returns {Object} Connection info object
		 */
		getConnection: function() {
			var conn = this._getConnection();

			if (!conn) {
				return {
					supported: false,
					type: 'unknown',
					effectiveType: 'unknown',
					downlink: null,
					downlinkMax: null,
					rtt: null,
					saveData: false
				};
			}

			return {
				supported: true,
				type: conn.type || 'unknown',           // wifi, cellular, ethernet, bluetooth, none
				effectiveType: conn.effectiveType || 'unknown', // slow-2g, 2g, 3g, 4g
				downlink: conn.downlink || null,        // Estimated bandwidth in Mbps
				downlinkMax: conn.downlinkMax || null,  // Max downlink speed
				rtt: conn.rtt || null,                  // Round-trip time in ms
				saveData: conn.saveData || false        // Data saver mode enabled
			};
		},

		/**
		 * Get effective connection type
		 * @returns {string} 'slow-2g', '2g', '3g', '4g', or 'unknown'
		 */
		getEffectiveType: function() {
			var conn = this._getConnection();
			return conn ? (conn.effectiveType || 'unknown') : 'unknown';
		},

		/**
		 * Get connection type
		 * @returns {string} 'wifi', 'cellular', 'ethernet', 'bluetooth', 'none', or 'unknown'
		 */
		getType: function() {
			var conn = this._getConnection();
			return conn ? (conn.type || 'unknown') : 'unknown';
		},

		/**
		 * Check if connection is slow (2g or slower)
		 * @returns {boolean}
		 */
		isSlowConnection: function() {
			var effectiveType = this.getEffectiveType();
			return effectiveType === 'slow-2g' || effectiveType === '2g';
		},

		/**
		 * Check if connection is fast (4g)
		 * @returns {boolean}
		 */
		isFastConnection: function() {
			return this.getEffectiveType() === '4g';
		},

		/**
		 * Check if data saver is enabled
		 * @returns {boolean}
		 */
		isSaveDataEnabled: function() {
			var conn = this._getConnection();
			return conn ? (conn.saveData || false) : false;
		},

		/**
		 * Check if on cellular/mobile data
		 * @returns {boolean}
		 */
		isCellular: function() {
			return this.getType() === 'cellular';
		},

		/**
		 * Check if on WiFi
		 * @returns {boolean}
		 */
		isWifi: function() {
			return this.getType() === 'wifi';
		},

		/**
		 * Check if online
		 * @returns {boolean}
		 */
		isOnline: function() {
			return navigator.onLine;
		},

		/**
		 * Check if offline
		 * @returns {boolean}
		 */
		isOffline: function() {
			return !navigator.onLine;
		},

		/**
		 * Listen for online/offline changes
		 * @param {function} callback - Called with boolean (true = online)
		 * @returns {function} Unsubscribe function
		 */
		onOnlineChange: function(callback) {
			if (typeof callback !== 'function') {
				return function() {};
			}

			_onlineCallbacks.push(callback);

			// Setup listeners once
			if (!_listenersInitialized) {
				_listenersInitialized = true;

				global.addEventListener('online', function() {
					_onlineCallbacks.forEach(function(cb) {
						try {
							cb(true);
						} catch (e) {
							console.warn('[Funky.PWA.Network] Online callback error:', e);
						}
					});

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:online');
					}
				});

				global.addEventListener('offline', function() {
					_onlineCallbacks.forEach(function(cb) {
						try {
							cb(false);
						} catch (e) {
							console.warn('[Funky.PWA.Network] Offline callback error:', e);
						}
					});

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:offline');
					}
				});
			}

			// Return unsubscribe function
			return function() {
				var index = _onlineCallbacks.indexOf(callback);
				if (index > -1) {
					_onlineCallbacks.splice(index, 1);
				}
			};
		},

		/**
		 * Remove online change callback
		 * @param {function} callback - Callback to remove
		 */
		offOnlineChange: function(callback) {
			var index = _onlineCallbacks.indexOf(callback);
			if (index > -1) {
				_onlineCallbacks.splice(index, 1);
			}
		},

		/**
		 * Listen for connection changes (type, speed, etc.)
		 * @param {function} callback - Called with connection info object
		 * @returns {function} Unsubscribe function
		 */
		onConnectionChange: function(callback) {
			if (typeof callback !== 'function') {
				return function() {};
			}

			var conn = this._getConnection();
			if (!conn) {
				return function() {};
			}

			_connectionCallbacks.push(callback);

			// Setup listener once
			if (!_connectionListenerInitialized) {
				_connectionListenerInitialized = true;

				var self = this;
				conn.addEventListener('change', function() {
					var info = self.getConnection();

					_connectionCallbacks.forEach(function(cb) {
						try {
							cb(info);
						} catch (e) {
							console.warn('[Funky.PWA.Network] Connection callback error:', e);
						}
					});

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:connection', info);
					}
				});
			}

			// Return unsubscribe function
			return function() {
				var index = _connectionCallbacks.indexOf(callback);
				if (index > -1) {
					_connectionCallbacks.splice(index, 1);
				}
			};
		},

		/**
		 * Remove connection change callback
		 * @param {function} callback - Callback to remove
		 */
		offConnectionChange: function(callback) {
			var index = _connectionCallbacks.indexOf(callback);
			if (index > -1) {
				_connectionCallbacks.splice(index, 1);
			}
		},

		/**
		 * Should we reduce data usage?
		 * True if: offline, save data mode, or slow connection
		 * @returns {boolean}
		 */
		shouldReduceData: function() {
			if (!this.isOnline()) return true;
			if (this.isSaveDataEnabled()) return true;
			if (this.isSlowConnection()) return true;
			return false;
		},

		/**
		 * Get recommended image quality based on connection
		 * @returns {string} 'low', 'medium', 'high'
		 */
		getRecommendedImageQuality: function() {
			if (!this.isOnline()) return 'low';
			if (this.isSaveDataEnabled()) return 'low';

			var effectiveType = this.getEffectiveType();

			switch (effectiveType) {
				case 'slow-2g':
				case '2g':
					return 'low';
				case '3g':
					return 'medium';
				case '4g':
				default:
					return 'high';
			}
		},

		/**
		 * Get recommended video quality based on connection
		 * @returns {string} '360p', '480p', '720p', '1080p'
		 */
		getRecommendedVideoQuality: function() {
			if (!this.isOnline()) return '360p';

			var conn = this.getConnection();

			if (conn.saveData) return '360p';
			if (!conn.downlink) return '480p'; // Unknown bandwidth

			if (conn.downlink < 1) return '360p';
			if (conn.downlink < 2.5) return '480p';
			if (conn.downlink < 5) return '720p';
			return '1080p';
		},

		/**
		 * Get recommended polling interval based on connection
		 * @param {number} [baseInterval=5000] - Base interval in ms for fast connection
		 * @returns {number} Recommended interval in ms
		 */
		getRecommendedPollingInterval: function(baseInterval) {
			baseInterval = baseInterval || 5000;

			if (!this.isOnline()) return baseInterval * 10;
			if (this.isSaveDataEnabled()) return baseInterval * 4;

			var effectiveType = this.getEffectiveType();

			switch (effectiveType) {
				case 'slow-2g':
					return baseInterval * 6;
				case '2g':
					return baseInterval * 4;
				case '3g':
					return baseInterval * 2;
				case '4g':
				default:
					return baseInterval;
			}
		},

		/**
		 * Get estimated bandwidth in Mbps
		 * @returns {number|null}
		 */
		getDownlink: function() {
			var conn = this._getConnection();
			return conn ? (conn.downlink || null) : null;
		},

		/**
		 * Get round-trip time in ms
		 * @returns {number|null}
		 */
		getRTT: function() {
			var conn = this._getConnection();
			return conn ? (conn.rtt || null) : null;
		}
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.Network = Network;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.Network', Network);
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
