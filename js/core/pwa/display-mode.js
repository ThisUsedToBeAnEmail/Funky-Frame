/**
 * Funky.PWA.DisplayMode - Display Mode API
 *
 * Detects how the web app is being displayed (browser, standalone, fullscreen, minimal-ui).
 * Provides utilities for fullscreen control and mode change detection.
 *
 * Use cases:
 * - Hide install prompts when already installed
 * - Enable native-like features in standalone mode
 * - Adjust padding for safe areas in fullscreen
 * - Track installation analytics
 * - Control fullscreen for presentations/video
 *
 * Display Modes:
 * - browser: Normal browser tab with address bar
 * - standalone: Installed PWA without browser UI
 * - minimal-ui: Minimal browser controls
 * - fullscreen: No browser UI at all
 *
 * Browser Support:
 * - All modern browsers (full support)
 * - iOS Safari via navigator.standalone
 *
 * @namespace Funky.PWA.DisplayMode
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _changeCallbacks = [];
	var _listenersAttached = false;

	// =========================================================================
	// DISPLAY MODE API
	// =========================================================================

	var DisplayMode = {
		/**
		 * Get current display mode
		 * @returns {string} 'browser', 'standalone', 'minimal-ui', 'fullscreen'
		 */
		get: function() {
			// Check Fullscreen API first (can change dynamically)
			if (this._isInFullscreen()) {
				return 'fullscreen';
			}

			// Check media queries for display-mode
			if (global.matchMedia) {
				if (global.matchMedia('(display-mode: fullscreen)').matches) {
					return 'fullscreen';
				}
				if (global.matchMedia('(display-mode: standalone)').matches) {
					return 'standalone';
				}
				if (global.matchMedia('(display-mode: minimal-ui)').matches) {
					return 'minimal-ui';
				}
			}

			// iOS Safari standalone mode
			if (navigator.standalone) {
				return 'standalone';
			}

			return 'browser';
		},

		/**
		 * Check if running in standalone mode (installed PWA)
		 * @returns {boolean}
		 */
		isStandalone: function() {
			return this.get() === 'standalone';
		},

		/**
		 * Check if running in fullscreen mode
		 * @returns {boolean}
		 */
		isFullscreen: function() {
			return this.get() === 'fullscreen' || this._isInFullscreen();
		},

		/**
		 * Check if running in minimal-ui mode
		 * @returns {boolean}
		 */
		isMinimalUI: function() {
			return this.get() === 'minimal-ui';
		},

		/**
		 * Check if running in browser mode
		 * @returns {boolean}
		 */
		isBrowser: function() {
			return this.get() === 'browser';
		},

		/**
		 * Check if app is installed (not in browser mode)
		 * @returns {boolean}
		 */
		isInstalled: function() {
			var mode = this.get();
			return mode !== 'browser';
		},

		/**
		 * Check if currently in Fullscreen API mode
		 * @private
		 * @returns {boolean}
		 */
		_isInFullscreen: function() {
			return !!(
				document.fullscreenElement ||
				document.webkitFullscreenElement ||
				document.mozFullScreenElement ||
				document.msFullscreenElement
			);
		},

		/**
		 * Get the current fullscreen element
		 * @returns {Element|null}
		 */
		getFullscreenElement: function() {
			return document.fullscreenElement ||
				document.webkitFullscreenElement ||
				document.mozFullScreenElement ||
				document.msFullscreenElement ||
				null;
		},

		/**
		 * Listen for display mode changes
		 * @param {function} callback - Called with mode string
		 * @returns {function} Unsubscribe function
		 */
		onChange: function(callback) {
			if (typeof callback !== 'function') {
				return function() {};
			}

			_changeCallbacks.push(callback);
			this._ensureListeners();

			return function() {
				var index = _changeCallbacks.indexOf(callback);
				if (index > -1) {
					_changeCallbacks.splice(index, 1);
				}
			};
		},

		/**
		 * Remove change callback
		 * @param {function} callback - Callback to remove
		 */
		offChange: function(callback) {
			var index = _changeCallbacks.indexOf(callback);
			if (index > -1) {
				_changeCallbacks.splice(index, 1);
			}
		},

		/**
		 * Request fullscreen for an element
		 * @param {HTMLElement} [element] - Element to fullscreen (default: document.documentElement)
		 * @returns {Promise}
		 */
		requestFullscreen: function(element) {
			element = element || document.documentElement;

			var result;

			if (element.requestFullscreen) {
				result = element.requestFullscreen();
			} else if (element.webkitRequestFullscreen) {
				result = element.webkitRequestFullscreen();
			} else if (element.mozRequestFullScreen) {
				result = element.mozRequestFullScreen();
			} else if (element.msRequestFullscreen) {
				result = element.msRequestFullscreen();
			} else {
				return Promise.reject(new Error('Fullscreen not supported'));
			}

			// Some browsers don't return a promise
			if (result && typeof result.then === 'function') {
				return result;
			}

			return Promise.resolve();
		},

		/**
		 * Exit fullscreen mode
		 * @returns {Promise}
		 */
		exitFullscreen: function() {
			if (!this._isInFullscreen()) {
				return Promise.resolve();
			}

			var result;

			if (document.exitFullscreen) {
				result = document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				result = document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				result = document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) {
				result = document.msExitFullscreen();
			} else {
				return Promise.resolve();
			}

			// Some browsers don't return a promise
			if (result && typeof result.then === 'function') {
				return result;
			}

			return Promise.resolve();
		},

		/**
		 * Toggle fullscreen mode
		 * @param {HTMLElement} [element] - Element to fullscreen
		 * @returns {Promise}
		 */
		toggleFullscreen: function(element) {
			if (this._isInFullscreen()) {
				return this.exitFullscreen();
			}
			return this.requestFullscreen(element);
		},

		/**
		 * Check if Fullscreen API is supported
		 * @returns {boolean}
		 */
		isFullscreenSupported: function() {
			return !!(
				document.fullscreenEnabled ||
				document.webkitFullscreenEnabled ||
				document.mozFullScreenEnabled ||
				document.msFullscreenEnabled
			);
		},

		/**
		 * Ensure media query and fullscreen listeners are set up
		 * @private
		 */
		_ensureListeners: function() {
			if (_listenersAttached) return;
			_listenersAttached = true;

			var self = this;
			var modes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];

			// Listen for display-mode media query changes
			if (global.matchMedia) {
				modes.forEach(function(mode) {
					var mq = global.matchMedia('(display-mode: ' + mode + ')');

					var handler = function(e) {
						if (e.matches) {
							self._notifyChange(mode);
						}
					};

					// Modern API
					if (mq.addEventListener) {
						mq.addEventListener('change', handler);
					} else if (mq.addListener) {
						// Legacy
						mq.addListener(handler);
					}
				});
			}

			// Listen for Fullscreen API changes
			var fullscreenHandler = function() {
				var mode = self.get();
				var isFullscreen = self._isInFullscreen();

				_changeCallbacks.forEach(function(cb) {
					try {
						cb(mode);
					} catch (e) {
						console.warn('[Funky.PWA.DisplayMode] Change callback error:', e);
					}
				});

				if (Funky.PubSub) {
					Funky.PubSub.emit('funky:pwa:displaymode', { mode: mode });
					Funky.PubSub.emit('funky:pwa:fullscreen', { active: isFullscreen });
				}
			};

			document.addEventListener('fullscreenchange', fullscreenHandler);
			document.addEventListener('webkitfullscreenchange', fullscreenHandler);
			document.addEventListener('mozfullscreenchange', fullscreenHandler);
			document.addEventListener('MSFullscreenChange', fullscreenHandler);
		},

		/**
		 * Notify callbacks of mode change
		 * @private
		 * @param {string} mode - New mode
		 */
		_notifyChange: function(mode) {
			_changeCallbacks.forEach(function(cb) {
				try {
					cb(mode);
				} catch (e) {
					console.warn('[Funky.PWA.DisplayMode] Change callback error:', e);
				}
			});

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:pwa:displaymode', { mode: mode });
			}
		}
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.DisplayMode = DisplayMode;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.DisplayMode', DisplayMode);
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
