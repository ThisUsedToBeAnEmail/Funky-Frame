/**
 * Funky.PWA.Visibility - Page Visibility API
 *
 * Detects when the page is visible or hidden to the user.
 * Use this to pause/resume expensive operations, save battery,
 * and track actual user engagement time.
 *
 * Use cases:
 * - Pause video/audio when tab is hidden
 * - Reduce polling frequency when hidden
 * - Pause animations to save battery
 * - Track engagement (actual time viewing content)
 * - Save state before user leaves
 *
 * Browser Support:
 * - All modern browsers (full support)
 *
 * @namespace Funky.PWA.Visibility
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _changeCallbacks = [];
	var _visibleCallbacks = [];
	var _hiddenCallbacks = [];
	var _listenerAttached = false;

	// =========================================================================
	// PRIVATE HELPERS
	// =========================================================================

	/**
	 * Format duration in ms to readable string
	 * @private
	 * @param {number} ms - Milliseconds
	 * @returns {string} Formatted duration
	 */
	function formatDuration(ms) {
		var seconds = Math.floor(ms / 1000);
		var minutes = Math.floor(seconds / 60);
		var hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return hours + 'h ' + (minutes % 60) + 'm';
		}
		if (minutes > 0) {
			return minutes + 'm ' + (seconds % 60) + 's';
		}
		return seconds + 's';
	}

	// =========================================================================
	// VISIBILITY API
	// =========================================================================

	var Visibility = {
		/**
		 * Check if page is currently visible
		 * @returns {boolean}
		 */
		isVisible: function() {
			return document.visibilityState === 'visible';
		},

		/**
		 * Check if page is currently hidden
		 * @returns {boolean}
		 */
		isHidden: function() {
			return document.visibilityState === 'hidden';
		},

		/**
		 * Get current visibility state
		 * @returns {string} 'visible', 'hidden', or 'prerender'
		 */
		getState: function() {
			return document.visibilityState;
		},

		/**
		 * Listen for visibility changes
		 * @param {function} callback - Called with { visible: boolean, state: string }
		 * @returns {function} Unsubscribe function
		 */
		onChange: function(callback) {
			if (typeof callback !== 'function') {
				return function() {};
			}

			_changeCallbacks.push(callback);
			this._ensureListener();

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
		 * Listen for when page becomes visible
		 * @param {function} callback
		 * @returns {function} Unsubscribe function
		 */
		onVisible: function(callback) {
			if (typeof callback !== 'function') {
				return function() {};
			}

			_visibleCallbacks.push(callback);
			this._ensureListener();

			return function() {
				var index = _visibleCallbacks.indexOf(callback);
				if (index > -1) {
					_visibleCallbacks.splice(index, 1);
				}
			};
		},

		/**
		 * Remove visible callback
		 * @param {function} callback - Callback to remove
		 */
		offVisible: function(callback) {
			var index = _visibleCallbacks.indexOf(callback);
			if (index > -1) {
				_visibleCallbacks.splice(index, 1);
			}
		},

		/**
		 * Listen for when page becomes hidden
		 * @param {function} callback
		 * @returns {function} Unsubscribe function
		 */
		onHidden: function(callback) {
			if (typeof callback !== 'function') {
				return function() {};
			}

			_hiddenCallbacks.push(callback);
			this._ensureListener();

			return function() {
				var index = _hiddenCallbacks.indexOf(callback);
				if (index > -1) {
					_hiddenCallbacks.splice(index, 1);
				}
			};
		},

		/**
		 * Remove hidden callback
		 * @param {function} callback - Callback to remove
		 */
		offHidden: function(callback) {
			var index = _hiddenCallbacks.indexOf(callback);
			if (index > -1) {
				_hiddenCallbacks.splice(index, 1);
			}
		},

		/**
		 * Returns a promise that resolves when page is visible
		 * If already visible, resolves immediately
		 * @returns {Promise}
		 */
		whenVisible: function() {
			var self = this;

			if (this.isVisible()) {
				return Promise.resolve();
			}

			return new Promise(function(resolve) {
				var handler = function() {
					if (self.isVisible()) {
						document.removeEventListener('visibilitychange', handler);
						resolve();
					}
				};
				document.addEventListener('visibilitychange', handler);
			});
		},

		/**
		 * Returns a promise that resolves when page becomes hidden
		 * If already hidden, resolves immediately
		 * @returns {Promise}
		 */
		whenHidden: function() {
			var self = this;

			if (this.isHidden()) {
				return Promise.resolve();
			}

			return new Promise(function(resolve) {
				var handler = function() {
					if (self.isHidden()) {
						document.removeEventListener('visibilitychange', handler);
						resolve();
					}
				};
				document.addEventListener('visibilitychange', handler);
			});
		},

		/**
		 * Start tracking time visible
		 * @returns {Object} Tracker with getTime(), getTimeFormatted(), stop()
		 */
		trackTimeVisible: function() {
			var self = this;

			var tracker = {
				_startTime: null,
				_totalTime: 0,
				_active: true,
				_boundHandler: null,

				_onVisibilityChange: function() {
					if (!this._active) return;

					if (self.isVisible()) {
						this._startTime = Date.now();
					} else if (this._startTime) {
						this._totalTime += Date.now() - this._startTime;
						this._startTime = null;
					}
				},

				/**
				 * Get total visible time in milliseconds
				 * @returns {number}
				 */
				getTime: function() {
					var time = this._totalTime;
					if (this._startTime && self.isVisible()) {
						time += Date.now() - this._startTime;
					}
					return time;
				},

				/**
				 * Get total visible time formatted
				 * @returns {string}
				 */
				getTimeFormatted: function() {
					return formatDuration(this.getTime());
				},

				/**
				 * Reset the tracker
				 */
				reset: function() {
					this._totalTime = 0;
					if (self.isVisible()) {
						this._startTime = Date.now();
					} else {
						this._startTime = null;
					}
				},

				/**
				 * Stop tracking and return total time
				 * @returns {number} Total visible time in ms
				 */
				stop: function() {
					this._active = false;
					if (this._startTime && self.isVisible()) {
						this._totalTime += Date.now() - this._startTime;
						this._startTime = null;
					}
					document.removeEventListener('visibilitychange', this._boundHandler);
					return this.getTime();
				}
			};

			// Bind and setup
			tracker._boundHandler = tracker._onVisibilityChange.bind(tracker);
			document.addEventListener('visibilitychange', tracker._boundHandler);

			// Start if visible
			if (this.isVisible()) {
				tracker._startTime = Date.now();
			}

			return tracker;
		},

		/**
		 * Defer function execution until page is visible
		 * @param {function} fn - Function to execute
		 * @param {number} [delay] - Optional delay after visible (ms)
		 */
		deferUntilVisible: function(fn, delay) {
			if (typeof fn !== 'function') return;

			if (this.isVisible()) {
				if (delay) {
					setTimeout(fn, delay);
				} else {
					fn();
				}
				return;
			}

			this.whenVisible().then(function() {
				if (delay) {
					setTimeout(fn, delay);
				} else {
					fn();
				}
			});
		},

		/**
		 * Run function on interval only while visible
		 * Automatically pauses when hidden, resumes when visible
		 * @param {function} fn - Function to run (receives stop callback)
		 * @param {number} interval - Interval in ms
		 * @returns {Object} Controller with pause(), resume(), stop()
		 */
		runWhileVisible: function(fn, interval) {
			var self = this;
			var timer = null;
			var paused = false;
			var stopped = false;

			var controller = {
				/**
				 * Pause the interval
				 */
				pause: function() {
					paused = true;
					if (timer) {
						clearInterval(timer);
						timer = null;
					}
				},

				/**
				 * Resume the interval
				 */
				resume: function() {
					if (stopped) return;
					if (!paused) return;
					paused = false;
					if (self.isVisible()) {
						this._start();
					}
				},

				/**
				 * Stop completely
				 */
				stop: function() {
					stopped = true;
					this.pause();
					document.removeEventListener('visibilitychange', this._onVisibility);
				},

				/**
				 * Check if running
				 * @returns {boolean}
				 */
				isRunning: function() {
					return timer !== null && !paused && !stopped;
				},

				_start: function() {
					if (timer || paused || stopped) return;
					fn(controller.stop.bind(controller));
					timer = setInterval(function() {
						fn(controller.stop.bind(controller));
					}, interval);
				},

				_onVisibility: function() {
					if (paused || stopped) return;

					if (self.isVisible()) {
						controller._start();
					} else {
						if (timer) {
							clearInterval(timer);
							timer = null;
						}
					}
				}
			};

			document.addEventListener('visibilitychange', controller._onVisibility);

			if (this.isVisible()) {
				controller._start();
			}

			return controller;
		},

		/**
		 * Format duration helper (exposed for external use)
		 * @param {number} ms - Milliseconds
		 * @returns {string} Formatted duration
		 */
		formatDuration: formatDuration,

		/**
		 * Ensure visibility listener is set up
		 * @private
		 */
		_ensureListener: function() {
			if (_listenerAttached) return;
			_listenerAttached = true;

			var self = this;

			document.addEventListener('visibilitychange', function() {
				var visible = self.isVisible();
				var state = self.getState();

				// Call change callbacks
				_changeCallbacks.forEach(function(cb) {
					try {
						cb({ visible: visible, state: state });
					} catch (e) {
						console.warn('[Funky.PWA.Visibility] Change callback error:', e);
					}
				});

				// Call specific callbacks and emit events
				if (visible) {
					_visibleCallbacks.forEach(function(cb) {
						try {
							cb();
						} catch (e) {
							console.warn('[Funky.PWA.Visibility] Visible callback error:', e);
						}
					});

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:visible');
					}
				} else {
					_hiddenCallbacks.forEach(function(cb) {
						try {
							cb();
						} catch (e) {
							console.warn('[Funky.PWA.Visibility] Hidden callback error:', e);
						}
					});

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:pwa:hidden');
					}
				}
			});
		}
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	// Ensure namespaces exist
	Funky.PWA = Funky.PWA || {};
	Funky.PWA.Visibility = Visibility;

	// Register with Funky.register if available
	if (typeof Funky.register === 'function') {
		Funky.register('PWA.Visibility', Visibility);
	}

	// Safely assign to global (may fail if Funky is frozen in test environments)
	try {
		global.Funky = Funky;
	} catch (e) {
		// Funky namespace already exists and is read-only
	}

})(typeof window !== 'undefined' ? window : this);
