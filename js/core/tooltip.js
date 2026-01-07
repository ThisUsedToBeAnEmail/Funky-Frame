/**
 * Funky.Tooltip - Native Tooltip System (Core Module)
 *
 * Replaces Bootstrap Tooltip JavaScript while keeping Bootstrap CSS styling.
 * Provides lightweight tooltips with CSS-based positioning.
 * Core module dependency for SPA and other components.
 *
 * Usage:
 *   // Auto-initialize from data attributes
 *   Funky.Tooltip.init();
 *
 *   // Initialize on specific container
 *   Funky.Tooltip.init('#container');
 *
 *   // Manual creation
 *   var tooltip = new Funky.Tooltip(element, {
 *     title: 'Tooltip text',
 *     placement: 'top',
 *     trigger: 'hover'
 *   });
 *
 *   // Instance methods
 *   tooltip.show();
 *   tooltip.hide();
 *   tooltip.toggle();
 *   tooltip.dispose();
 *
 * @version 1.0.4
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Tooltip] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('Tooltip')) {
		return;
	}

	// Shortcuts
	var D = Funky.Dom;

	// Store tooltip instances: { element: TooltipInstance }
	var instances = new WeakMap();

	// Default options
	var DEFAULTS = {
		title: '',
		placement: 'top',        // top | bottom | left | right
		trigger: 'hover',        // hover | focus | click | manual
		delay: { show: 0, hide: 0 },
		html: false,
		template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
	};

	// Use Funky.Animate for duration management (accessed dynamically in case loaded after tooltip)
	function getAnimateDuration(el, defaultMs) {
		var Animate = Funky.Animate;
		if (Animate && Animate.getDuration) {
			return Animate.getDuration(el, defaultMs);
		}
		// Fallback if Animate not available
		return defaultMs || 150;
	}

	// Offset from trigger element (pixels)
	var ARROW_OFFSET = 8;

	/**
	 * Get element from selector or element
	 * @param {string|HTMLElement} target
	 * @returns {HTMLElement|null}
	 */
	function getElement(target) {
		if (!target) return null;
		if (typeof target === 'string') {
			return document.querySelector(target);
		}
		return target.el || target;
	}

	/**
	 * Tooltip Constructor
	 * @param {string|HTMLElement} target - Trigger element
	 * @param {Object} options - Configuration options
	 */
	function Tooltip(target, options) {
		var element = getElement(target);
		if (!element) {
			console.error('[Funky.Tooltip] Element not found:', target);
			return;
		}

		this.el = element;
		this.options = Object.assign({}, DEFAULTS, options || {});
		this.tooltipEl = null;
		this.isShown = false;
		this.isTransitioning = false;
		this.showTimer = null;
		this.hideTimer = null;

		// Read options from data attributes
		this._readDataAttributes();

		// Store instance
		instances.set(element, this);

		// Bind triggers
		if (this.options.trigger !== 'manual') {
			this._bindTriggers();
		}
	}

	Tooltip.prototype = {
		/**
		 * Read options from data attributes
		 * @private
		 */
		_readDataAttributes: function() {
			var el = this.el;

			// data-funky-tooltip or data-bs-title for title
			var title = el.getAttribute('data-funky-tooltip') ||
			           el.getAttribute('data-bs-title') ||
			           el.getAttribute('title');
			if (title) {
				this.options.title = title;
				// Remove title to prevent browser tooltip
				if (el.hasAttribute('title')) {
					el.setAttribute('data-original-title', title);
					el.removeAttribute('title');
				}
			}

			// data-placement or data-bs-placement
			var placement = el.getAttribute('data-placement') ||
			               el.getAttribute('data-bs-placement');
			if (placement) {
				this.options.placement = placement;
			}

			// data-trigger or data-bs-trigger
			var trigger = el.getAttribute('data-trigger') ||
			             el.getAttribute('data-bs-trigger');
			if (trigger) {
				this.options.trigger = trigger;
			}
		},

		/**
		 * Bind trigger events
		 * @private
		 */
		_bindTriggers: function() {
			var self = this;
			var triggers = this.options.trigger.split(' ');

			triggers.forEach(function(trigger) {
				if (trigger === 'hover') {
					self.el.addEventListener('mouseenter', function() {
						self._scheduleShow();
					});
					self.el.addEventListener('mouseleave', function() {
						self._scheduleHide();
					});
				} else if (trigger === 'focus') {
					self.el.addEventListener('focus', function() { self._scheduleShow(); });
					self.el.addEventListener('blur', function() { self._scheduleHide(); });
				} else if (trigger === 'click') {
					self.el.addEventListener('click', function(e) {
						e.preventDefault();
						self.toggle();
					});
				}
			});
		},

		/**
		 * Schedule show with delay
		 * @private
		 */
		_scheduleShow: function() {
			var self = this;

			// Cancel any pending hide
			if (this.hideTimer) {
				clearTimeout(this.hideTimer);
				this.hideTimer = null;
			}

			// Show immediately or with delay
			var delay = typeof this.options.delay === 'object' ? this.options.delay.show : this.options.delay;
			if (delay) {
				this.showTimer = setTimeout(function() {
					self.show();
				}, delay);
			} else {
				this.show();
			}
		},

		/**
		 * Schedule hide with delay
		 * @private
		 */
		_scheduleHide: function() {
			var self = this;

			// Cancel any pending show
			if (this.showTimer) {
				clearTimeout(this.showTimer);
				this.showTimer = null;
			}

			// Hide immediately or with delay
			var delay = typeof this.options.delay === 'object' ? this.options.delay.hide : this.options.delay;
			if (delay) {
				this.hideTimer = setTimeout(function() {
					self.hide();
				}, delay);
			} else {
				this.hide();
			}
		},

		/**
		 * Show the tooltip
		 */
		show: function() {
			var self = this;

			if (this.isShown || this.isTransitioning) {
				return;
			}

			// Get title
			var title = this.options.title;
			if (!title) {
				return;
			}

			this.isTransitioning = true;

			// Create tooltip element
			this._createTooltip();

			// Add to DOM first (needed for accurate positioning)
			document.body.appendChild(this.tooltipEl);

			// Force reflow so we can measure dimensions before positioning
			void this.tooltipEl.offsetHeight;

			// Position tooltip (after adding to DOM and reflow)
			this._positionTooltip();

			// Force reflow for transition
			void this.tooltipEl.offsetHeight;

			// Add show class
			this.tooltipEl.classList.add('show');
			this.isShown = true;

			// After transition
			var duration = getAnimateDuration(this.tooltipEl, 150);
			setTimeout(function() {
				self.isTransitioning = false;
			}, duration);
		},

		/**
		 * Hide the tooltip
		 */
		hide: function() {
			var self = this;

			if (!this.isShown || this.isTransitioning) {
				return;
			}

			this.isTransitioning = true;

			// Remove show class
			this.tooltipEl.classList.remove('show');

			var duration = getAnimateDuration(this.tooltipEl, 150);

			// After transition, remove from DOM
			setTimeout(function() {
				if (self.tooltipEl && self.tooltipEl.parentNode) {
					self.tooltipEl.parentNode.removeChild(self.tooltipEl);
				}
				self.tooltipEl = null;
				self.isShown = false;
				self.isTransitioning = false;
			}, duration);
		},

		/**
		 * Toggle tooltip visibility
		 */
		toggle: function() {
			if (this.isShown) {
				this.hide();
			} else {
				this.show();
			}
		},

		/**
		 * Create tooltip element
		 * @private
		 */
		_createTooltip: function() {
			// Parse template
			var temp = document.createElement('div');
			temp.innerHTML = this.options.template.trim();
			this.tooltipEl = temp.firstChild;

			// Add placement class
			this.tooltipEl.classList.add('bs-tooltip-' + this.options.placement);

			// Add fade class
			this.tooltipEl.classList.add('fade');

			// Ensure tooltip shrinks to content (Bootstrap .tooltip is display: block which expands to full width)
			this.tooltipEl.style.width = 'max-content';

			// Set content
			var inner = this.tooltipEl.querySelector('.tooltip-inner');
			if (inner) {
				if (this.options.html) {
					inner.innerHTML = this.options.title;
				} else {
					inner.textContent = this.options.title;
				}
			}
		},

		/**
		 * Position tooltip relative to trigger element
		 * @private
		 */
		_positionTooltip: function() {
			var triggerRect = this.el.getBoundingClientRect();
			var tooltipRect = this.tooltipEl.getBoundingClientRect();
			var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

			var top = 0;
			var left = 0;

			switch (this.options.placement) {
				case 'top':
					top = triggerRect.top + scrollTop - tooltipRect.height - ARROW_OFFSET;
					left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
					break;

				case 'bottom':
					top = triggerRect.bottom + scrollTop + ARROW_OFFSET;
					left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
					break;

				case 'left':
					top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
					left = triggerRect.left + scrollLeft - tooltipRect.width - ARROW_OFFSET;
					break;

				case 'right':
					top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
					left = triggerRect.right + scrollLeft + ARROW_OFFSET;
					break;
			}

			// Viewport boundaries
			var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
			var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
			var padding = 8; // pixels from edge

			// Adjust horizontal position if overflowing
			if (left < scrollLeft + padding) {
				// Too far left
				left = scrollLeft + padding;
			} else if (left + tooltipRect.width > scrollLeft + viewportWidth - padding) {
				// Too far right
				left = scrollLeft + viewportWidth - tooltipRect.width - padding;
			}

			// Adjust vertical position if overflowing
			if (top < scrollTop + padding) {
				// Too far up
				top = scrollTop + padding;
			} else if (top + tooltipRect.height > scrollTop + viewportHeight - padding) {
				// Too far down
				top = scrollTop + viewportHeight - tooltipRect.height - padding;
			}

			// Apply position
			this.tooltipEl.style.position = 'absolute';
			this.tooltipEl.style.top = Math.round(top) + 'px';
			this.tooltipEl.style.left = Math.round(left) + 'px';
		},

		/**
		 * Update tooltip content
		 * @param {string} title - New title
		 */
		setContent: function(title) {
			this.options.title = title;

			if (this.tooltipEl && this.isShown) {
				var inner = this.tooltipEl.querySelector('.tooltip-inner');
				if (inner) {
					if (this.options.html) {
						inner.innerHTML = title;
					} else {
						inner.textContent = title;
					}
				}

				// Reposition
				this._positionTooltip();
			}
		},

		/**
		 * Dispose tooltip instance
		 */
		dispose: function() {
			// Clear timers
			if (this.showTimer) {
				clearTimeout(this.showTimer);
			}
			if (this.hideTimer) {
				clearTimeout(this.hideTimer);
			}

			// Remove tooltip element immediately (don't animate hide during dispose)
			if (this.tooltipEl && this.tooltipEl.parentNode) {
				this.tooltipEl.parentNode.removeChild(this.tooltipEl);
			}
			this.tooltipEl = null;
			this.isShown = false;
			this.isTransitioning = false;

			// Restore original title
			var originalTitle = this.el.getAttribute('data-original-title');
			if (originalTitle) {
				this.el.setAttribute('title', originalTitle);
				this.el.removeAttribute('data-original-title');
			}

			// Remove event listeners by cloning element
			// (simpler than tracking all bound handlers)
			var clone = this.el.cloneNode(true);
			if (this.el.parentNode) {
				this.el.parentNode.replaceChild(clone, this.el);
			}

			// Remove instance
			instances.delete(this.el);
		}
	};

	// =========================================================================
	// Static Methods
	// =========================================================================

	/**
	 * Initialize a tooltip on target
	 * @param {string|HTMLElement} target
	 * @param {Object} options
	 * @returns {Tooltip}
	 */
	Tooltip.init = function(target, options) {
		var element = getElement(target);
		if (!element) return null;

		var instance = instances.get(element);
		if (instance) {
			return instance;
		}

		return new Tooltip(element, options);
	};

	/**
	 * @deprecated Use Tooltip.init() instead
	 */
	Tooltip.getOrCreateInstance = function(target, options) {
		return Tooltip.init(target, options);
	};

	/**
	 * Get existing instance
	 * @param {string|HTMLElement} target
	 * @returns {Tooltip|null}
	 */
	Tooltip.getInstance = function(target) {
		var element = getElement(target);
		if (!element) return null;
		return instances.get(element) || null;
	};

	/**
	 * Initialize all tooltips from data attributes in container
	 * @param {string|HTMLElement} container - Container to search (default: document)
	 */
	Tooltip.initAll = function(container) {
		var root = container ? getElement(container) : document;
		var tooltips = root.querySelectorAll('[data-funky-tooltip], [data-bs-toggle="tooltip"]');

		tooltips.forEach(function(el) {
			// Skip if already initialized
			if (instances.has(el)) {
				return;
			}

			// Auto-initialize
			new Tooltip(el);
		});
	};

	/**
	 * Destroy a tooltip instance
	 * @param {string|HTMLElement} target
	 */
	Tooltip.destroy = function(target) {
		var tooltip = Tooltip.getInstance(target);
		if (tooltip) {
			tooltip.dispose();
		}
	};

	/**
	 * Destroy all tooltip instances
	 * Note: WeakMap doesn't have iteration, so instances will be garbage collected when elements are removed
	 */
	Tooltip.destroyAll = function() {
		// WeakMap instances will be garbage collected when elements are removed from DOM
	};

	// =========================================================================
	// Auto-initialize
	// =========================================================================

	// Initialize tooltips on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			Tooltip.initAll();
		});
	} else {
		Tooltip.initAll();
	}

	// Register with Funky namespace
	Funky.register('Tooltip', Tooltip);

	console.log('[Funky.Tooltip] v1.0.0 initialized');

})(window);
