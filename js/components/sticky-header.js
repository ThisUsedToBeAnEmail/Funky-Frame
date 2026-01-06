/**
 * Funky StickyHeader - Sticky page header with scroll detection
 * Keeps page title visible on scroll using IntersectionObserver
 *
 * Usage:
 *   // Global init (finds all .page-header-sticky elements)
 *   Funky.StickyHeader.init();
 *
 *   // Init with options
 *   Funky.StickyHeader.init({
 *     showShadow: true,
 *     compactOnStick: true,
 *     hideOnScrollDown: false
 *   });
 *
 *   // Init specific element with options
 *   var header = Funky.StickyHeader.initElement('#my-header', {
 *     showShadow: true,
 *     hideOnScrollDown: true
 *   });
 *
 *   // Cleanup
 *   Funky.StickyHeader.destroy(headerElement);
 *   Funky.StickyHeader.destroyAll();
 *
 * @version 1.0.3
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.StickyHeader] Registry not found. Load namespace.js first.');
		return;
	}

	// =========================================================================
	// Default Configuration
	// =========================================================================

	var DEFAULTS = {
		// Visual feedback
		showShadow: true,              // Add shadow when sticky
		compactOnStick: false,         // Reduce header height when sticky
		hideSubtitle: true,            // Hide subtitle when sticky (via CSS)

		// Behavior
		hideOnScrollDown: false,       // Hide header when scrolling down
		showOnScroll: false,           // Start hidden, show when user scrolls
		showOnScrollThreshold: 10,     // Scroll distance before header appears
		scrollThreshold: 50,           // Scroll distance before hide kicks in
		scrollDelta: 5,                // Minimum scroll delta to trigger hide/show

		// Scroll context
		scrollContainer: null,         // Element or selector for scroll container (null = window)

		// Selectors
		selector: '.page-header-sticky',

		// Callbacks
		onStick: null,                 // function(header, isSticky)
		onHide: null,                  // function(header, isHidden)
		onShow: null                   // function(header)
	};

	// =========================================================================
	// StickyHeader Module
	// =========================================================================

	var StickyHeader = {
		headers: [],
		globalOptions: {},

		/**
		 * Initialize sticky headers
		 * @param {Object} options - Configuration options
		 */
		init: function(options) {
			var self = this;
			this.globalOptions = Object.assign({}, DEFAULTS, options || {});

			var selector = this.globalOptions.selector || DEFAULTS.selector;
			var headers = document.querySelectorAll(selector);

			headers.forEach(function(header) {
				self.initElement(header, self.globalOptions);
			});

			return this;
		},

		/**
		 * Initialize a specific header element
		 * @param {string|Element} element - Selector or DOM element
		 * @param {Object} options - Configuration options
		 * @returns {Object} Header instance data
		 */
		initElement: function(element, options) {
			var header = typeof element === 'string' ? document.querySelector(element) : element;

			if (!header) {
				console.warn('[Funky.StickyHeader] Element not found:', element);
				return null;
			}

			// Check if already initialized
			if (this.headers.some(function(h) { return h.element === header; })) {
				return this.getInstance(header);
			}

			var config = Object.assign({}, DEFAULTS, this.globalOptions, options || {});

			// Resolve scroll container
			var scrollContainer = null;
			if (config.scrollContainer) {
				scrollContainer = typeof config.scrollContainer === 'string'
					? document.querySelector(config.scrollContainer)
					: config.scrollContainer;
			}

			// Create header instance data
			var instance = {
				element: header,
				config: config,
				scrollContainer: scrollContainer,  // null means window
				isSticky: false,
				isHidden: false,
				isRevealed: false,              // For showOnScroll mode
				lastScrollY: 0,
				observer: null,
				sentinel: null,
				scrollHandler: null,
				revealScrollHandler: null       // Separate handler for showOnScroll
			};

			// Store reference on element
			header._stickyHeader = instance;

			// Apply initial classes based on config
			this.applyConfigClasses(instance);

			// Set up IntersectionObserver for sticky detection
			this.observeHeader(instance);

			// Set up scroll handler for hide on scroll down
			if (config.hideOnScrollDown) {
				this.bindScrollHandler(instance);
			}

			// Set up showOnScroll behavior
			if (config.showOnScroll) {
				this.bindRevealHandler(instance);
			}

			this.headers.push(instance);

			return instance;
		},

		/**
		 * Apply CSS classes based on configuration
		 */
		applyConfigClasses: function(instance) {
			var header = instance.element;
			var config = instance.config;

			// Shadow class
			header.classList.toggle('sticky-header--no-shadow', !config.showShadow);

			// Compact mode class
			header.classList.toggle('sticky-header--compact-mode', config.compactOnStick);

			// Hide subtitle class
			header.classList.toggle('sticky-header--hide-subtitle', config.hideSubtitle);

			// Hideable class for scroll down behavior
			header.classList.toggle('sticky-header--hideable', config.hideOnScrollDown);

			// Show on scroll class (starts hidden)
			header.classList.toggle('sticky-header--show-on-scroll', config.showOnScroll);
		},

		/**
		 * Set up visibility observer for a header
		 */
		observeHeader: function(instance) {
			var header = instance.element;
			var config = instance.config;

			// Create a sentinel element above the header
			var sentinel = document.createElement('div');
			sentinel.className = 'page-header-sentinel';
			sentinel.style.cssText = 'height: 1px; width: 100%; position: absolute; top: 0; left: 0; pointer-events: none;';

			if (header.parentNode) {
				header.parentNode.insertBefore(sentinel, header);
			}

			instance.sentinel = sentinel;

			// Use VisibilityObserver
			var VisibilityObserver = Funky.VisibilityObserver;
			var observer = VisibilityObserver.init({
				threshold: 0,
				rootMargin: '0px 0px 0px 0px',
				onVisible: function(el) {
					if (el !== sentinel) return;

					var wasSticky = instance.isSticky;
					instance.isSticky = false;

					header.classList.remove('is-sticky');
					// Also remove hidden state when not sticky
					if (instance.isHidden) {
						instance.isHidden = false;
						header.classList.remove('is-hidden');
					}

					// Fire callback if state changed
					if (wasSticky !== instance.isSticky && config.onStick) {
						config.onStick(header, instance.isSticky);
					}
				},
				onHidden: function(el) {
					if (el !== sentinel) return;

					var wasSticky = instance.isSticky;
					instance.isSticky = true;

					header.classList.add('is-sticky');

					// Fire callback if state changed
					if (wasSticky !== instance.isSticky && config.onStick) {
						config.onStick(header, instance.isSticky);
					}
				}
			});

			observer.observe(sentinel);
			instance.observer = observer;
		},

		/**
		 * Get scroll position from container or window
		 */
		getScrollY: function(instance) {
			if (instance.scrollContainer) {
				return instance.scrollContainer.scrollTop;
			}
			return window.scrollY || window.pageYOffset;
		},

		/**
		 * Get scroll target (container or window)
		 */
		getScrollTarget: function(instance) {
			return instance.scrollContainer || window;
		},

		/**
		 * Bind scroll handler for hide on scroll down
		 */
		bindScrollHandler: function(instance) {
			var self = this;
			var header = instance.element;
			var config = instance.config;
			var scrollTarget = this.getScrollTarget(instance);

			instance.scrollHandler = function() {
				if (!instance.isSticky) return;

				var currentScrollY = self.getScrollY(instance);
				var delta = currentScrollY - instance.lastScrollY;

				// Only act if we've scrolled enough
				if (Math.abs(delta) < config.scrollDelta) return;

				// Only hide if we're past the threshold
				if (currentScrollY > config.scrollThreshold) {
					if (delta > 0 && !instance.isHidden) {
						// Scrolling down - hide
						instance.isHidden = true;
						header.classList.add('is-hidden');
						if (config.onHide) config.onHide(header, true);
					} else if (delta < 0 && instance.isHidden) {
						// Scrolling up - show
						instance.isHidden = false;
						header.classList.remove('is-hidden');
						if (config.onShow) config.onShow(header);
					}
				} else if (instance.isHidden) {
					// At top of page, ensure visible
					instance.isHidden = false;
					header.classList.remove('is-hidden');
					if (config.onShow) config.onShow(header);
				}

				instance.lastScrollY = currentScrollY;
			};

			scrollTarget.addEventListener('scroll', instance.scrollHandler, { passive: true });
		},

		/**
		 * Bind scroll handler for showOnScroll (reveal on scroll)
		 */
		bindRevealHandler: function(instance) {
			var self = this;
			var header = instance.element;
			var config = instance.config;
			var scrollTarget = this.getScrollTarget(instance);

			instance.revealScrollHandler = function() {
				var currentScrollY = self.getScrollY(instance);

				// Reveal header once scroll threshold is reached
				if (!instance.isRevealed && currentScrollY >= config.showOnScrollThreshold) {
					instance.isRevealed = true;
					header.classList.add('is-revealed');
					if (config.onShow) config.onShow(header);
				} else if (instance.isRevealed && currentScrollY < config.showOnScrollThreshold) {
					// Hide again if scrolled back to top
					instance.isRevealed = false;
					header.classList.remove('is-revealed');
					if (config.onHide) config.onHide(header, false);
				}
			};

			scrollTarget.addEventListener('scroll', instance.revealScrollHandler, { passive: true });
		},

		/**
		 * Get instance for an element
		 */
		getInstance: function(element) {
			var header = typeof element === 'string' ? document.querySelector(element) : element;
			if (!header) return null;

			return this.headers.find(function(h) { return h.element === header; }) || null;
		},

		/**
		 * Update options for a header
		 */
		updateOptions: function(element, options) {
			var instance = this.getInstance(element);
			if (!instance) return null;

			Object.assign(instance.config, options);
			this.applyConfigClasses(instance);

			// Handle hideOnScrollDown toggle
			if (options.hideOnScrollDown !== undefined) {
				if (options.hideOnScrollDown && !instance.scrollHandler) {
					this.bindScrollHandler(instance);
				} else if (!options.hideOnScrollDown && instance.scrollHandler) {
					var scrollTarget = this.getScrollTarget(instance);
					scrollTarget.removeEventListener('scroll', instance.scrollHandler);
					instance.scrollHandler = null;
					instance.isHidden = false;
					instance.element.classList.remove('is-hidden');
				}
			}

			// Handle showOnScroll toggle
			if (options.showOnScroll !== undefined) {
				if (options.showOnScroll && !instance.revealScrollHandler) {
					this.bindRevealHandler(instance);
				} else if (!options.showOnScroll && instance.revealScrollHandler) {
					var revealScrollTarget = this.getScrollTarget(instance);
					revealScrollTarget.removeEventListener('scroll', instance.revealScrollHandler);
					instance.revealScrollHandler = null;
					instance.isRevealed = true; // Show immediately when disabled
					instance.element.classList.add('is-revealed');
				}
			}

			return instance;
		},

		/**
		 * Clean up a sticky header
		 */
		destroy: function(element) {
			var header = typeof element === 'string' ? document.querySelector(element) : element;
			if (!header) return;

			var index = this.headers.findIndex(function(h) { return h.element === header; });
			if (index === -1) return;

			var instance = this.headers[index];

			// Cleanup observer
			if (instance.observer) {
				instance.observer.destroy();
			}

			// Cleanup sentinel
			if (instance.sentinel && instance.sentinel.parentNode) {
				instance.sentinel.remove();
			}

			// Cleanup scroll handler
			if (instance.scrollHandler) {
				var scrollTarget = this.getScrollTarget(instance);
				scrollTarget.removeEventListener('scroll', instance.scrollHandler);
			}

			// Cleanup reveal scroll handler
			if (instance.revealScrollHandler) {
				var revealScrollTarget = this.getScrollTarget(instance);
				revealScrollTarget.removeEventListener('scroll', instance.revealScrollHandler);
			}

			// Remove classes
			header.classList.remove('is-sticky', 'is-hidden', 'is-revealed');
			header.classList.remove('sticky-header--no-shadow', 'sticky-header--compact-mode');
			header.classList.remove('sticky-header--hide-subtitle', 'sticky-header--hideable');
			header.classList.remove('sticky-header--show-on-scroll');

			// Remove reference
			delete header._stickyHeader;

			// Remove from array
			this.headers.splice(index, 1);
		},

		/**
		 * Destroy all sticky headers
		 */
		destroyAll: function() {
			var self = this;
			// Create a copy to avoid array mutation during iteration
			var headersCopy = this.headers.slice();
			headersCopy.forEach(function(instance) {
				self.destroy(instance.element);
			});
			this.headers = [];
			this.globalOptions = {};
		}
	};

	// Auto-init on page load
	document.addEventListener('DOMContentLoaded', function() {
		StickyHeader.init();
	});

	// Re-init after SPA navigation
	document.addEventListener('funky.spa.pageload', function() {
		// Cleanup old observers first
		StickyHeader.destroyAll();
		StickyHeader.init();
	});

	// Register with Funky namespace
	Funky.register('StickyHeader', StickyHeader);

})(window);
