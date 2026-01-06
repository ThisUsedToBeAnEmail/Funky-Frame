/**
 * Funky.Popover - Native Popover System (Core Module)
 *
 * Replaces Bootstrap Popover JavaScript while keeping Bootstrap CSS styling.
 * Provides lightweight popovers with CSS-based positioning.
 * Core module dependency for SPA and other components.
 *
 * Usage:
 *   // Auto-initialize from data attributes
 *   Funky.Popover.init();
 *
 *   // Initialize on specific container
 *   Funky.Popover.init('#container');
 *
 *   // Manual creation
 *   var popover = new Funky.Popover(element, {
 *     title: 'Popover title',
 *     content: 'Popover content',
 *     placement: 'top',
 *     trigger: 'click'
 *   });
 *
 *   // Instance methods
 *   popover.show();
 *   popover.hide();
 *   popover.toggle();
 *   popover.dispose();
 *
 * @version 1.0.3
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Popover] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('Popover')) {
		return;
	}

	// Shortcuts
	var D = Funky.Dom;

	// Store popover instances: { element: PopoverInstance }
	var instances = new WeakMap();

	// Track currently open popover for click-outside handling
	var activePopover = null;

	// Default options
	var DEFAULTS = {
		title: '',
		content: '',
		placement: 'top',        // top | bottom | left | right
		trigger: 'click',        // click | hover | focus | manual
		html: false,
		width: null,             // Custom width (e.g., '300px', '20rem')
		maxWidth: null,          // Custom max-width (overrides Bootstrap's 276px)
		template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
	};

	// Use Funky.Animate for duration management
	var Animate = Funky.Animate;

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
	 * Handle click outside to close popover
	 * @param {Event} e
	 * @private
	 */
	function handleClickOutside(e) {
		if (!activePopover) return;

		var clickedInside = activePopover.el.contains(e.target) ||
		                   (activePopover.popoverEl && activePopover.popoverEl.contains(e.target));

		if (!clickedInside) {
			activePopover.hide();
		}
	}

	/**
	 * Popover Constructor
	 * @param {string|HTMLElement} target - Trigger element
	 * @param {Object} options - Configuration options
	 */
	function Popover(target, options) {
		var element = getElement(target);
		if (!element) {
			console.error('[Funky.Popover] Element not found:', target);
			return;
		}

		this.el = element;
		this.options = Object.assign({}, DEFAULTS, options || {});
		this.popoverEl = null;
		this.isShown = false;
		this.isTransitioning = false;
		this._pendingHide = false;

		// Read options from data attributes
		this._readDataAttributes();

		// Store instance
		instances.set(element, this);

		// Bind triggers
		if (this.options.trigger !== 'manual') {
			this._bindTriggers();
		}
	}

	Popover.prototype = {
		/**
		 * Read options from data attributes
		 * @private
		 */
		_readDataAttributes: function() {
			var el = this.el;

			// data-funky-popover-title or data-bs-title for title
			var title = el.getAttribute('data-funky-popover-title') ||
			           el.getAttribute('data-bs-title') ||
			           el.getAttribute('data-title');
			if (title) {
				this.options.title = title;
			}

			// data-funky-popover-content or data-bs-content for content
			var content = el.getAttribute('data-funky-popover-content') ||
			             el.getAttribute('data-bs-content') ||
			             el.getAttribute('data-content');
			if (content) {
				this.options.content = content;
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

			// data-width for custom width
			var width = el.getAttribute('data-width') ||
			           el.getAttribute('data-funky-popover-width');
			if (width) {
				this.options.width = width;
			}

			// data-max-width for custom max-width
			var maxWidth = el.getAttribute('data-max-width') ||
			              el.getAttribute('data-funky-popover-max-width');
			if (maxWidth) {
				this.options.maxWidth = maxWidth;
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
				if (trigger === 'click') {
					self.el.addEventListener('click', function(e) {
						e.preventDefault();
						e.stopPropagation();
						self.toggle();
					});
				} else if (trigger === 'hover') {
					self.el.addEventListener('mouseenter', function() { self.show(); });
					self.el.addEventListener('mouseleave', function() { self.hide(); });
				} else if (trigger === 'focus') {
					self.el.addEventListener('focus', function() { self.show(); });
					self.el.addEventListener('blur', function() { self.hide(); });
				}
			});
		},

		/**
		 * Show the popover
		 */
		show: function() {
			var self = this;

			// Guard against missing element
			if (!this.el) {
				return;
			}

			if (this.isShown || this.isTransitioning) {
				return;
			}

			// Hide any other open popover
			if (activePopover && activePopover !== this) {
				activePopover.hide();
			}

			// Get content
			var content = this.options.content;
			if (!content) {
				return;
			}

			this.isTransitioning = true;

			// Create popover element
			this._createPopover();

			// Add to DOM first (needed for accurate positioning)
			document.body.appendChild(this.popoverEl);

			// Position popover (after adding to DOM)
			this._positionPopover();

			// Force reflow for transition
			void this.popoverEl.offsetHeight;

			// Add show class
			this.popoverEl.classList.add('show');
			this.isShown = true;

			// Set as active popover
			activePopover = this;

			// Bind click outside handler
			setTimeout(function() {
				document.addEventListener('click', handleClickOutside);
			}, 0);

			// After transition
			var duration = Animate.getDuration(this.popoverEl, Animate.DURATION.FAST);
			setTimeout(function() {
				self.isTransitioning = false;
				// Check if hide was requested during show transition
				if (self._pendingHide) {
					self._pendingHide = false;
					self.hide();
				}
			}, duration);
		},

		/**
		 * Hide the popover
		 */
		hide: function() {
			var self = this;

			// If currently in show transition, queue the hide for after
			if (this.isTransitioning && this.isShown) {
				this._pendingHide = true;
				return;
			}

			if (!this.isShown) {
				return;
			}

			this.isTransitioning = true;

			// Remove show class
			this.popoverEl.classList.remove('show');

			// Clear active popover
			if (activePopover === this) {
				activePopover = null;
				document.removeEventListener('click', handleClickOutside);
			}

			var duration = Animate.getDuration(this.popoverEl, Animate.DURATION.FAST);

			// After transition, remove from DOM
			setTimeout(function() {
				if (self.popoverEl && self.popoverEl.parentNode) {
					self.popoverEl.parentNode.removeChild(self.popoverEl);
				}
				self.popoverEl = null;
				self.isShown = false;
				self.isTransitioning = false;
			}, duration);
		},

		/**
		 * Toggle popover visibility
		 */
		toggle: function() {
			if (this.isShown) {
				this.hide();
			} else {
				this.show();
			}
		},

		/**
		 * Create popover element
		 * @private
		 */
		_createPopover: function() {
			// Parse template
			var temp = document.createElement('div');
			temp.innerHTML = this.options.template.trim();
			this.popoverEl = temp.firstChild;

			// Add placement class
			this.popoverEl.classList.add('bs-popover-' + this.options.placement);

			// Add fade class
			this.popoverEl.classList.add('fade');

			// Apply custom width/maxWidth (overrides Bootstrap's 276px max-width)
			if (this.options.width) {
				this.popoverEl.style.width = this.options.width;
			}
			if (this.options.maxWidth) {
				this.popoverEl.style.maxWidth = this.options.maxWidth;
			}

			// Set title
			var header = this.popoverEl.querySelector('.popover-header');
			if (header) {
				if (this.options.title) {
					if (this.options.html) {
						header.innerHTML = this.options.title;
					} else {
						header.textContent = this.options.title;
					}
				} else {
					// Remove header if no title
					header.parentNode.removeChild(header);
				}
			}

			// Set content
			var body = this.popoverEl.querySelector('.popover-body');
			if (body) {
				if (this.options.html) {
					body.innerHTML = this.options.content;
				} else {
					body.textContent = this.options.content;
				}
			}
		},

		/**
		 * Position popover relative to trigger element
		 * @param {boolean} isReposition - True if this is a reposition after initial render
		 * @private
		 */
		_positionPopover: function(isReposition) {
			var self = this;

			// Force reflow to ensure popover has correct dimensions
			void this.popoverEl.offsetHeight;

			// Get actual computed dimensions
			var triggerRect = this.el.getBoundingClientRect();
			var popoverWidth = this.popoverEl.offsetWidth;
			var popoverHeight = this.popoverEl.offsetHeight;
			var popoverRect = {
				width: popoverWidth,
				height: popoverHeight
			};

			var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

			var top = 0;
			var left = 0;

			// Calculate ideal position
			var idealLeft = triggerRect.left + scrollLeft + (triggerRect.width - popoverRect.width) / 2;
			var idealTop = triggerRect.top + scrollTop + (triggerRect.height - popoverRect.height) / 2;

			switch (this.options.placement) {
				case 'top':
					top = triggerRect.top + scrollTop - popoverRect.height - ARROW_OFFSET;
					left = idealLeft;
					break;

				case 'bottom':
					top = triggerRect.bottom + scrollTop + ARROW_OFFSET;
					left = idealLeft;
					break;

				case 'left':
					top = idealTop;
					left = triggerRect.left + scrollLeft - popoverRect.width - ARROW_OFFSET;
					break;

				case 'right':
					top = idealTop;
					left = triggerRect.right + scrollLeft + ARROW_OFFSET;
					break;
			}

			// Viewport boundaries
			var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
			var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
			var padding = 8; // pixels from edge

			// Adjust horizontal position if overflowing
			if (left < scrollLeft + padding) {
				left = scrollLeft + padding;
			} else if (left + popoverRect.width > scrollLeft + viewportWidth - padding) {
				left = scrollLeft + viewportWidth - popoverRect.width - padding;
			}

			// Adjust vertical position if overflowing
			if (top < scrollTop + padding) {
				top = scrollTop + padding;
			} else if (top + popoverRect.height > scrollTop + viewportHeight - padding) {
				top = scrollTop + viewportHeight - popoverRect.height - padding;
			}

			// Apply position
			this.popoverEl.style.position = 'absolute';
			this.popoverEl.style.top = Math.round(top) + 'px';
			this.popoverEl.style.left = Math.round(left) + 'px';

			// Position arrow to point at trigger center
			this._positionArrow(triggerRect, popoverRect, left, top, scrollLeft, scrollTop);

			// If this is initial position, reposition after render to account for content reflow
			if (!isReposition) {
				requestAnimationFrame(function() {
					if (self.popoverEl) {
						self._positionPopover(true);
					}
				});
			}
		},

		/**
		 * Position the arrow to point at the trigger element
		 * @private
		 */
		_positionArrow: function(triggerRect, popoverRect, popoverLeft, popoverTop, scrollLeft, scrollTop) {
			var arrow = this.popoverEl.querySelector('.popover-arrow');
			if (!arrow) return;

			var placement = this.options.placement;
			var triggerCenterX = triggerRect.left + scrollLeft + triggerRect.width / 2;
			var triggerCenterY = triggerRect.top + scrollTop + triggerRect.height / 2;

			// Calculate arrow position relative to popover
			var arrowX = triggerCenterX - popoverLeft;
			var arrowY = triggerCenterY - popoverTop;

			// Clamp within popover bounds (with padding for border radius)
			var minX = 16;
			var maxX = popoverRect.width - 16;
			var minY = 16;
			var maxY = popoverRect.height - 16;

			arrowX = Math.max(minX, Math.min(maxX, arrowX));
			arrowY = Math.max(minY, Math.min(maxY, arrowY));

			// Use transform for positioning and set height to 0 to override Bootstrap defaults
			// This allows the ::before and ::after pseudo-elements to render the arrow correctly
			arrow.style.height = '0';

			var translateX = 0;
			var translateY = 0;

			var transform = '';

			switch (placement) {
				case 'top':
					// Arrow at bottom of popover, pointing down
					// Add arrow height (8px) to popover height
					translateX = arrowX;
					translateY = popoverRect.height + 8;
					transform = 'translateX(' + translateX + 'px) translateY(' + translateY + 'px)';
					break;
				case 'bottom':
					// Arrow at top of popover, pointing up
					translateX = arrowX;
					translateY = -8; // Offset for arrow height
					transform = 'translateX(' + translateX + 'px) translateY(' + translateY + 'px)';
					break;
				case 'left':
					// Arrow at right of popover, pointing right - use rotation
					transform = 'rotate(-90deg) translateX(-' + arrowY + 'px) translateY(' + popoverRect.width + 'px)';
					break;
				case 'right':
					// Arrow at left of popover, pointing left - use rotation
					// Account for arrow width (16px offset)
					transform = 'rotate(90deg) translateX(' + arrowY + 'px) translateY(16px)';
					break;
			}

			arrow.style.transform = transform;
		},

		/**
		 * Update popover content
		 * @param {string} title - New title (optional)
		 * @param {string} content - New content
		 */
		setContent: function(title, content) {
			if (typeof title === 'string' && typeof content === 'undefined') {
				// Only one argument: it's the content
				this.options.content = title;
			} else {
				if (title) this.options.title = title;
				if (content) this.options.content = content;
			}

			if (this.popoverEl && this.isShown) {
				var header = this.popoverEl.querySelector('.popover-header');
				var body = this.popoverEl.querySelector('.popover-body');

				if (header && this.options.title) {
					if (this.options.html) {
						header.innerHTML = this.options.title;
					} else {
						header.textContent = this.options.title;
					}
				}

				if (body) {
					if (this.options.html) {
						body.innerHTML = this.options.content;
					} else {
						body.textContent = this.options.content;
					}
				}

				// Reposition
				this._positionPopover();
			}
		},

		/**
		 * Dispose popover instance
		 */
		dispose: function() {
			// Hide popover
			if (this.isShown) {
				this.hide();
			}

			// Remove popover element
			if (this.popoverEl && this.popoverEl.parentNode) {
				this.popoverEl.parentNode.removeChild(this.popoverEl);
			}

			// Clear active reference
			if (activePopover === this) {
				activePopover = null;
				document.removeEventListener('click', handleClickOutside);
			}

			// Remove event listeners by cloning element
			var clone = this.el.cloneNode(true);
			if (this.el.parentNode) {
				this.el.parentNode.replaceChild(clone, this.el);
			}

			// Remove instance
			instances.delete(this.el);

			console.log('[Funky.Popover] Disposed');
		}
	};

	// =========================================================================
	// Static Methods
	// =========================================================================

	/**
	 * Get or create popover instance
	 * @param {string|HTMLElement} target
	 * @param {Object} options
	 * @returns {Popover}
	 */
	Popover.getOrCreateInstance = function(target, options) {
		var element = getElement(target);
		if (!element) return null;

		var instance = instances.get(element);
		if (instance) {
			return instance;
		}

		return new Popover(element, options);
	};

	/**
	 * Get existing instance
	 * @param {string|HTMLElement} target
	 * @returns {Popover|null}
	 */
	Popover.getInstance = function(target) {
		var element = getElement(target);
		if (!element) return null;
		return instances.get(element) || null;
	};

	/**
	 * Initialize popovers from data attributes
	 * @param {string|HTMLElement} container - Container to search (default: document)
	 */
	Popover.init = function(container) {
		var root = container ? getElement(container) : document;
		var popovers = root.querySelectorAll('[data-funky-popover], [data-bs-toggle="popover"]');

		popovers.forEach(function(el) {
			// Skip if already initialized
			if (instances.has(el)) {
				return;
			}

			// Auto-initialize
			new Popover(el);
		});
	};

	/**
	 * Destroy a popover instance
	 * @param {string|HTMLElement} target
	 */
	Popover.destroy = function(target) {
		var popover = Popover.getInstance(target);
		if (popover) {
			popover.dispose();
		}
	};

	/**
	 * Destroy all popover instances
	 */
	Popover.destroyAll = function() {
		// Note: WeakMap doesn't have iteration, so we can't dispose all
		// Instances will be garbage collected when elements are removed
		console.log('[Funky.Popover] All instances will be garbage collected');
	};

	// =========================================================================
	// Auto-initialize
	// =========================================================================

	// Initialize popovers on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			Popover.init();
		});
	} else {
		Popover.init();
	}

	// Register with Funky namespace
	Funky.register('Popover', Popover);

	console.log('[Funky.Popover] v1.0.0 initialized');

})(window);
