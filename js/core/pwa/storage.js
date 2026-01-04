/**
 * Funky.PWA.Storage - Storage API
 *
 * Manages persistent storage and quota estimation for your PWA.
 * Helps prevent quota exceeded errors and protects data from eviction.
 *
 * Key concepts:
 * - Quota: Maximum storage allowed (varies by browser/device)
 * - Usage: Current storage consumption
 * - Persistence: Whether data is protected from eviction
 * - Usage breakdown: Storage by type (Cache API, IndexedDB, etc.)
 *
 * Browser Support:
 * - Chrome 55+
 * - Firefox 57+
 * - Safari 15.2+
 * - Edge 79+
 *
 * @namespace Funky.PWA.Storage
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// PRIVATE HELPERS
	// =========================================================================

	/**
	 * Format bytes to human-readable string
	 * @private
	 * @param {number} bytes - Number of bytes
	 * @returns {string} Formatted string (e.g., "1.5 MB")
	 */
	function formatBytes(bytes) {
		if (bytes === 0) return '0 B';

		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// =========================================================================
	// STORAGE API
	// =========================================================================

	var Storage = {
		/**
		 * Check if Storage API is supported
		 * @returns {boolean}
		 */
		isSupported: function() {
			return !!(navigator.storage && navigator.storage.estimate);
		},

		/**
		 * Check if storage is persisted (won't be evicted under pressure)
		 * @returns {Promise<boolean>}
		 */
		isPersisted: function() {
			if (navigator.storage && navigator.storage.persisted) {
				return navigator.storage.persisted();
			}
			return Promise.resolve(false);
		},

		/**
		 * Request persistent storage
		 * Browser may show permission prompt to user.
		 * Once granted, data won't be evicted under storage pressure.
		 * @returns {Promise<boolean>} Whether persistence was granted
		 */
		requestPersistence: function() {
			if (navigator.storage && navigator.storage.persist) {
				return navigator.storage.persist()
					.then(function(granted) {
						// Emit PubSub event
						if (Funky.PubSub) {
							Funky.PubSub.emit('funky:pwa:storage:persistence', {
								granted: granted
							});
						}

						return granted;
					})
					.catch(function(error) {
						console.warn('[Funky.PWA.Storage] Persistence request failed:', error);
						return false;
					});
			}
			return Promise.resolve(false);
		},

		/**
		 * Get storage estimate
		 * Returns current usage, available quota, and calculated percentages.
		 * @returns {Promise<Object>} Storage estimate object
		 */
		getEstimate: function() {
			if (!this.isSupported()) {
				return Promise.resolve({
					usage: 0,
					quota: 0,
					usagePercent: 0,
					available: 0,
					supported: false,
					usageFormatted: '0 B',
					quotaFormatted: '0 B',
					availableFormatted: '0 B'
				});
			}

			return navigator.storage.estimate()
				.then(function(estimate) {
					var usage = estimate.usage || 0;
					var quota = estimate.quota || 0;
					var available = Math.max(0, quota - usage);
					var usagePercent = quota > 0 ? Math.round((usage / quota) * 100) : 0;

					return {
						usage: usage,
						quota: quota,
						usagePercent: usagePercent,
						available: available,
						supported: true,
						// Human-readable formats
						usageFormatted: formatBytes(usage),
						quotaFormatted: formatBytes(quota),
						availableFormatted: formatBytes(available)
					};
				})
				.catch(function(error) {
					console.warn('[Funky.PWA.Storage] Estimate failed:', error);
					return {
						usage: 0,
						quota: 0,
						usagePercent: 0,
						available: 0,
						supported: false,
						usageFormatted: '0 B',
						quotaFormatted: '0 B',
						availableFormatted: '0 B'
					};
				});
		},

		/**
		 * Get storage usage breakdown by storage type
		 * Note: usageDetails is Chrome-only
		 * @returns {Promise<Object>} Breakdown by storage type
		 */
		getUsageBreakdown: function() {
			if (!this.isSupported()) {
				return Promise.resolve({});
			}

			return navigator.storage.estimate()
				.then(function(estimate) {
					// usageDetails is Chrome-specific
					if (!estimate.usageDetails) {
						return {
							total: estimate.usage || 0,
							totalFormatted: formatBytes(estimate.usage || 0)
						};
					}

					var breakdown = {};
					for (var key in estimate.usageDetails) {
						if (estimate.usageDetails.hasOwnProperty(key)) {
							breakdown[key] = {
								bytes: estimate.usageDetails[key],
								formatted: formatBytes(estimate.usageDetails[key])
							};
						}
					}
					breakdown.total = estimate.usage || 0;
					breakdown.totalFormatted = formatBytes(estimate.usage || 0);

					return breakdown;
				})
				.catch(function(error) {
					console.warn('[Funky.PWA.Storage] Breakdown failed:', error);
					return {};
				});
		},

		/**
		 * Check if storage quota is running low
		 * @param {number} [threshold=80] - Percentage threshold (0-100)
		 * @returns {Promise<boolean>} True if usage >= threshold
		 */
		isQuotaLow: function(threshold) {
			threshold = typeof threshold === 'number' ? threshold : 80;

			return this.getEstimate().then(function(estimate) {
				return estimate.usagePercent >= threshold;
			});
		},

		/**
		 * Monitor storage and emit events when low
		 * @param {Object} [options] - Configuration options
		 * @param {number} [options.threshold=80] - Warning threshold percentage
		 * @param {number} [options.checkInterval=60000] - Check interval in ms
		 * @param {boolean} [options.showToast=true] - Show toast notification
		 * @returns {number} Interval ID for cancellation
		 */
		monitorQuota: function(options) {
			var self = this;
			options = options || {};
			var threshold = typeof options.threshold === 'number' ? options.threshold : 80;
			var interval = options.checkInterval || 60000;
			var showToast = options.showToast !== false;
			var lastWarnTime = 0;
			var warnCooldown = 300000; // 5 minutes between warnings

			var check = function() {
				self.isQuotaLow(threshold).then(function(isLow) {
					if (isLow) {
						var now = Date.now();
						if (now - lastWarnTime < warnCooldown) {
							return; // Still in cooldown
						}
						lastWarnTime = now;

						self.getEstimate().then(function(estimate) {
							console.warn('[Funky.PWA.Storage] Quota low:', estimate.usagePercent + '%');

							// Emit PubSub event
							if (Funky.PubSub) {
								Funky.PubSub.emit('funky:pwa:storage:low', estimate);
							}

							// Show toast notification
							if (showToast && Funky.Toast) {
								Funky.Toast.warning(
									'Storage is running low (' + estimate.usagePercent + '% used)'
								);
							}
						});
					}
				});
			};

			// Check immediately
			check();

			// Then periodically
			return setInterval(check, interval);
		},

		/**
		 * Stop monitoring quota
		 * @param {number} intervalId - ID returned by monitorQuota
		 */
		stopMonitoring: function(intervalId) {
			if (intervalId) {
				clearInterval(intervalId);
			}
		},

		/**
		 * Format bytes to human-readable string
		 * Exposed for use by other components
		 * @param {number} bytes - Number of bytes
		 * @returns {string} Formatted string
		 */
		formatBytes: formatBytes
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.Storage = Storage;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.Storage', Storage);
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
