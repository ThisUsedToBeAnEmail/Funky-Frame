/**
 * Funky.PWA.Device - Device Capabilities API
 *
 * Detects device hardware capabilities to adapt the app experience.
 * Provides information about memory, CPU cores, and battery status.
 *
 * Use cases:
 * - Disable animations on low-end devices
 * - Use virtual scrolling for large lists
 * - Reduce page sizes for limited memory
 * - Pause background tasks on low battery
 * - Load simpler chart renderers
 *
 * Browser Support:
 * - Device Memory: Chrome 63+, Edge 79+
 * - Hardware Concurrency: All modern browsers
 * - Battery: Chrome only (deprecated in some contexts)
 *
 * @namespace Funky.PWA.Device
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _batteryCallbacks = [];
	var _battery = null;
	var _batteryListenersSetup = false;

	// =========================================================================
	// DEVICE API
	// =========================================================================

	var Device = {
		/**
		 * Get device memory in GB
		 * Returns approximate values: 0.25, 0.5, 1, 2, 4, 8
		 * @returns {number|null}
		 */
		getMemory: function() {
			return navigator.deviceMemory || null;
		},

		/**
		 * Check if device has low memory
		 * @param {number} [threshold=4] - GB threshold
		 * @returns {boolean}
		 */
		isLowMemory: function(threshold) {
			threshold = typeof threshold === 'number' ? threshold : 4;
			var memory = this.getMemory();

			if (memory === null) return false; // Unknown, assume OK
			return memory < threshold;
		},

		/**
		 * Get number of logical CPU cores
		 * @returns {number|null}
		 */
		getCores: function() {
			return navigator.hardwareConcurrency || null;
		},

		/**
		 * Check if device has low CPU
		 * @param {number} [threshold=4] - Core threshold
		 * @returns {boolean}
		 */
		isLowCPU: function(threshold) {
			threshold = typeof threshold === 'number' ? threshold : 4;
			var cores = this.getCores();

			if (cores === null) return false; // Unknown, assume OK
			return cores < threshold;
		},

		/**
		 * Get battery info
		 * @returns {Promise<Object|null>} Battery info or null if unsupported
		 */
		getBattery: function() {
			if (!('getBattery' in navigator)) {
				return Promise.resolve(null);
			}

			return navigator.getBattery()
				.then(function(battery) {
					_battery = battery;

					return {
						charging: battery.charging,
						level: Math.round(battery.level * 100),
						chargingTime: battery.chargingTime,
						dischargingTime: battery.dischargingTime
					};
				})
				.catch(function(error) {
					console.warn('[Funky.PWA.Device] Battery API error:', error);
					return null;
				});
		},

		/**
		 * Check if battery is low (not charging and below threshold)
		 * @param {number} [threshold=20] - Percentage threshold
		 * @returns {Promise<boolean>}
		 */
		isLowBattery: function(threshold) {
			threshold = typeof threshold === 'number' ? threshold : 20;

			return this.getBattery().then(function(battery) {
				if (!battery) return false; // Unknown, assume OK
				return !battery.charging && battery.level < threshold;
			});
		},

		/**
		 * Check if device is charging
		 * @returns {Promise<boolean>}
		 */
		isCharging: function() {
			return this.getBattery().then(function(battery) {
				if (!battery) return false;
				return battery.charging;
			});
		},

		/**
		 * Listen for battery changes
		 * @param {function} callback - Called with battery info object
		 * @returns {function} Unsubscribe function
		 */
		onBatteryChange: function(callback) {
			if (typeof callback !== 'function') {
				return function() {};
			}

			_batteryCallbacks.push(callback);

			// Setup battery listeners once
			if (!_batteryListenersSetup && 'getBattery' in navigator) {
				_batteryListenersSetup = true;

				navigator.getBattery()
					.then(function(battery) {
						_battery = battery;

						var notify = function() {
							var info = {
								charging: battery.charging,
								level: Math.round(battery.level * 100),
								chargingTime: battery.chargingTime,
								dischargingTime: battery.dischargingTime
							};

							_batteryCallbacks.forEach(function(cb) {
								try {
									cb(info);
								} catch (e) {
									console.warn('[Funky.PWA.Device] Battery callback error:', e);
								}
							});

							// Emit PubSub events
							if (Funky.PubSub) {
								Funky.PubSub.emit('funky:pwa:battery', info);

								if (!info.charging && info.level < 20) {
									Funky.PubSub.emit('funky:pwa:lowbattery', { level: info.level });
								}
							}
						};

						battery.addEventListener('chargingchange', notify);
						battery.addEventListener('levelchange', notify);
					})
					.catch(function(error) {
						console.warn('[Funky.PWA.Device] Battery setup error:', error);
					});
			}

			// Return unsubscribe function
			return function() {
				var index = _batteryCallbacks.indexOf(callback);
				if (index > -1) {
					_batteryCallbacks.splice(index, 1);
				}
			};
		},

		/**
		 * Remove battery change callback
		 * @param {function} callback - Callback to remove
		 */
		offBatteryChange: function(callback) {
			var index = _batteryCallbacks.indexOf(callback);
			if (index > -1) {
				_batteryCallbacks.splice(index, 1);
			}
		},

		/**
		 * Check if this is a low-end device
		 * Considers memory, CPU, network, and battery
		 * @returns {Promise<boolean>}
		 */
		isLowEndDevice: function() {
			var self = this;

			// Check sync properties first
			if (this.isLowMemory()) return Promise.resolve(true);
			if (this.isLowCPU()) return Promise.resolve(true);

			// Check network (if available)
			if (Funky.PWA && Funky.PWA.Network && Funky.PWA.Network.isSlowConnection()) {
				return Promise.resolve(true);
			}

			// Check battery
			return this.isLowBattery().then(function(isLow) {
				return isLow;
			});
		},

		/**
		 * Get device class based on capabilities
		 * @returns {Promise<string>} 'low', 'medium', 'high'
		 */
		getDeviceClass: function() {
			var self = this;
			var memory = this.getMemory() || 4; // Assume 4GB if unknown
			var cores = this.getCores() || 4;   // Assume 4 cores if unknown

			return this.isLowBattery().then(function(lowBattery) {
				// Calculate score (0-6 base)
				var score = 0;

				// Memory score (0-3)
				if (memory >= 8) score += 3;
				else if (memory >= 4) score += 2;
				else if (memory >= 2) score += 1;

				// CPU score (0-3)
				if (cores >= 8) score += 3;
				else if (cores >= 4) score += 2;
				else if (cores >= 2) score += 1;

				// Battery penalty
				if (lowBattery) score -= 2;

				// Network penalty (if available)
				if (Funky.PWA && Funky.PWA.Network && Funky.PWA.Network.isSlowConnection()) {
					score -= 1;
				}

				// Classify
				if (score <= 2) return 'low';
				if (score <= 4) return 'medium';
				return 'high';
			});
		},

		/**
		 * Get recommended settings based on device capabilities
		 * @returns {Promise<Object>} Configuration object
		 */
		getRecommendedSettings: function() {
			var self = this;

			return this.getDeviceClass().then(function(deviceClass) {
				var settings = {
					deviceClass: deviceClass,
					animations: true,
					animationDuration: 300,
					imageQuality: 'high',
					videoAutoplay: true,
					prefetch: true,
					pageSize: 25,
					virtualization: false,
					reducedMotion: false,
					lazyLoad: true,
					cacheSize: 100
				};

				if (deviceClass === 'low') {
					settings.animations = false;
					settings.animationDuration = 0;
					settings.imageQuality = 'low';
					settings.videoAutoplay = false;
					settings.prefetch = false;
					settings.pageSize = 10;
					settings.virtualization = true;
					settings.reducedMotion = true;
					settings.cacheSize = 25;
				} else if (deviceClass === 'medium') {
					settings.animationDuration = 200;
					settings.imageQuality = 'medium';
					settings.pageSize = 15;
					settings.cacheSize = 50;
				}

				return settings;
			});
		},

		/**
		 * Get all device info
		 * @returns {Promise<Object>} Complete device information
		 */
		getInfo: function() {
			var self = this;

			return Promise.all([
				this.getBattery(),
				this.getDeviceClass()
			]).then(function(results) {
				return {
					memory: self.getMemory(),
					cores: self.getCores(),
					battery: results[0],
					deviceClass: results[1],
					platform: navigator.platform,
					userAgent: navigator.userAgent,
					language: navigator.language,
					languages: navigator.languages ? Array.prototype.slice.call(navigator.languages) : [navigator.language],
					online: navigator.onLine,
					cookieEnabled: navigator.cookieEnabled,
					doNotTrack: navigator.doNotTrack,
					maxTouchPoints: navigator.maxTouchPoints || 0,
					pdfViewerEnabled: navigator.pdfViewerEnabled || false
				};
			});
		},

		/**
		 * Check if device supports touch
		 * @returns {boolean}
		 */
		hasTouch: function() {
			return 'ontouchstart' in global || navigator.maxTouchPoints > 0;
		},

		/**
		 * Check if device is mobile-like (touch + small screen)
		 * @returns {boolean}
		 */
		isMobile: function() {
			return this.hasTouch() && global.innerWidth < 768;
		},

		/**
		 * Check if device is tablet-like (touch + medium screen)
		 * @returns {boolean}
		 */
		isTablet: function() {
			return this.hasTouch() && global.innerWidth >= 768 && global.innerWidth < 1024;
		},

		/**
		 * Check if device is desktop-like (no touch or large screen)
		 * @returns {boolean}
		 */
		isDesktop: function() {
			return !this.hasTouch() || global.innerWidth >= 1024;
		},

		/**
		 * Check if reduced motion is preferred
		 * @returns {boolean}
		 */
		prefersReducedMotion: function() {
			if (global.matchMedia) {
				return global.matchMedia('(prefers-reduced-motion: reduce)').matches;
			}
			return false;
		},

		/**
		 * Check if dark mode is preferred
		 * @returns {boolean}
		 */
		prefersDarkMode: function() {
			if (global.matchMedia) {
				return global.matchMedia('(prefers-color-scheme: dark)').matches;
			}
			return false;
		}
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.Device = Device;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.Device', Device);
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
