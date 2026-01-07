/**
 * Funky.PageAnimate - Page-Level Animation Management
 *
 * High-level page animation management with SPA integration.
 *
 * Features:
 * - Page entrance/exit animations
 * - Scroll-triggered animations (IntersectionObserver)
 * - Stagger animations for lists
 * - Preset pattern library
 * - Auto-initialization
 *
 * Usage:
 *   // Register page animation
 *   Funky.PageAnimate.register('dashboard', {
 *     enter: { class: 'fade-in-up', duration: 400 },
 *     exit: { class: 'fade-out', duration: 300 }
 *   });
 *
 *   // Use preset
 *   Funky.PageAnimate.usePreset('trades', 'slideRight');
 *
 *   // Attribute-based
 *   <div data-page-animate="dashboard" data-page="dashboard">...</div>
 *
 * @version 1.0.4
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.PageAnimate] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('PageAnimate')) {
		return;
	}

	// Shortcuts
	var D = Funky.Dom;
	var Animate = Funky.Animate;

	// =========================================================================
	// CORE PAGE ANIMATE OBJECT
	// =========================================================================

	var PageAnimate = {
		// Configuration registry
		configs: {},

		/**
		 * Register page animation configuration
		 * @param {string} pageName - Name of the page
		 * @param {Object} config - Animation configuration
		 * @returns {Object} PageAnimate instance
		 */
		register: function(pageName, config) {
			this.configs[pageName] = config;
			return this;
		},

		/**
		 * Get configuration for a page
		 * @param {string} pageName - Name of the page
		 * @returns {Object} Animation configuration
		 */
		getConfig: function(pageName) {
			return this.configs[pageName] || this.configs['default'] || {};
		},

		/**
		 * Animate page entrance
		 * @param {HTMLElement} pageElement - Page element
		 * @param {string} pageName - Name of the page
		 */
		enter: function(pageElement, pageName) {
			var config = this.getConfig(pageName);

			if (config.enter) {
				if (typeof config.enter === 'function') {
					config.enter(pageElement);
				} else {
					Animate.animate(pageElement, config.enter);
				}
			}
		},

		/**
		 * Animate page exit
		 * @param {HTMLElement} pageElement - Page element
		 * @param {string} pageName - Name of the page
		 * @param {Function} onComplete - Callback when animation completes
		 */
		exit: function(pageElement, pageName, onComplete) {
			var config = this.getConfig(pageName);

			if (config.exit) {
				if (typeof config.exit === 'function') {
					config.exit(pageElement, onComplete);
				} else {
					Animate.animate(pageElement, Object.assign({}, config.exit, {
						onEnd: onComplete
					}));
				}
			} else if (onComplete) {
				onComplete();
			}
		},

		/**
		 * Initialize scroll animations
		 * @param {string|HTMLElement} container - Container to search in
		 * @returns {VisibilityObserverInstance} Observer instance
		 */
		initScrollAnimations: function(container) {
			var containerEl = container ? D.one(container) : document;

			// Get raw DOM element from wrapper (ElementWrapper has .el property)
			var el = containerEl && containerEl.el ? containerEl.el : containerEl;

			var elements = el.querySelectorAll('[data-animate-trigger="in-view"]');

			if (!elements.length) return null;

			// Helper to animate an element
			function animateElement(target) {
				// Skip if already animated
				if (target.classList.contains('animated')) {
					return;
				}

				var animClass = target.getAttribute('data-animate') || 'fade-in-up';
				var duration = target.getAttribute('data-animate-duration');

				// Mark as animating
				target.classList.add('animating');

				Animate.animate(target, {
					class: animClass,
					duration: duration ? parseInt(duration, 10) : null,
					onEnd: function() {
						// Mark as animated, remove animating
						target.classList.remove('animating');
						target.classList.add('animated');
					}
				});
			}

			// Create visibility observer
			var VisibilityObserver = Funky.VisibilityObserver;
			var observer = VisibilityObserver.init({
				threshold: 0.1,
				rootMargin: '0px 0px -50px 0px'
			});

			elements.forEach(function(element) {
				var isOnce = element.getAttribute('data-animate-once') === 'true';

				if (isOnce) {
					// One-shot animation - unobserve after visible
					observer.observeOnce(element, function(target) {
						animateElement(target);
					});
				} else {
					// Continuous observation
					observer.observe(element, {
						onVisible: function(target) {
							animateElement(target);
						}
					});
				}
			});

			return observer;
		},

		/**
		 * Animate list with stagger
		 * @param {string|NodeList|Array} selector - Elements to animate
		 * @param {Object} options - Animation options
		 * @returns {Object} Stagger control or observer
		 */
		animateList: function(selector, options) {
			var defaults = {
				class: 'fade-in-up',
				stagger: 75,
				trigger: 'immediate'
			};

			var opts = Object.assign({}, defaults, options);

			if (opts.trigger === 'immediate') {
				return Animate.stagger(selector, opts);
			} else if (opts.trigger === 'in-view') {
				var listWrapper = D.one(selector);
				if (!listWrapper) return null;
				// Get raw DOM element from wrapper
				var list = listWrapper.el || listWrapper;

				// Use VisibilityObserver for in-view stagger
				var VisibilityObserver = Funky.VisibilityObserver;
				var observer = VisibilityObserver.init({ threshold: 0.1 });

				observer.observeOnce(list, function() {
					Animate.stagger(selector + ' > *', opts);
				});

				return observer;
			}
		},

		/**
		 * Preset pattern library
		 */
		presets: {
			fade: {
				enter: { class: 'fade-in', duration: 300 },
				exit: { class: 'fade-out', duration: 200 }
			},

			slideRight: {
				enter: { class: 'slide-in-right', duration: 400 },
				exit: { class: 'slide-out-left', duration: 300 }
			},

			slideLeft: {
				enter: { class: 'slide-in-left', duration: 400 },
				exit: { class: 'slide-out-right', duration: 300 }
			},

			scale: {
				enter: { class: 'scale-fade-in', duration: 400 },
				exit: { class: 'scale-fade-out', duration: 300 }
			},

			dashboard: {
				enter: function(page) {
					var header = page.querySelector('.page-header');
					var content = page.querySelector('.page-content');

					if (header && content) {
						Animate.sequence([
							{ element: header, options: { class: 'fade-in' } },
							{ element: content, options: { class: 'fade-in-up', delay: 100 } }
						]).start();
					} else {
						Animate.animate(page, { class: 'fade-in' });
					}
				},
				exit: { class: 'fade-out', duration: 200 }
			}
		},

		/**
		 * Apply preset
		 * @param {string} pageName - Name of the page
		 * @param {string} presetName - Name of the preset
		 * @returns {Object} PageAnimate instance
		 */
		usePreset: function(pageName, presetName) {
			var preset = this.presets[presetName];
			if (preset) {
				this.register(pageName, preset);
			}
			return this;
		},

		/**
		 * Initialize attribute-based stagger
		 *
		 * Note: Stagger animations are now handled purely by CSS using nth-child selectors.
		 * This function is kept for backward compatibility but does nothing.
		 */
		initStagger: function() {
			// CSS-only stagger - no JS needed!
			// See animate.css for [data-animate-stagger] > [data-animate]:nth-child() rules
		},

		/**
		 * Auto-add animation attributes to children
		 * @param {string|HTMLElement} container - Container to search in
		 */
		initAutoAnimateChildren: function(container) {
			var containerEl = container ? D.one(container) : document;
			var el = containerEl && containerEl.el ? containerEl.el : containerEl;
			var autoContainers = el.querySelectorAll('[data-animate-children]');

			autoContainers.forEach(function(parent) {
				var animType = parent.getAttribute('data-animate-children') || 'in-view';
				var animClass = parent.getAttribute('data-animate-class') || 'fade-in';
				var animDuration = parent.getAttribute('data-animate-duration') || '600';

				// Select text elements that don't already have data-animate
				var selector = 'p:not([data-animate]), h1:not([data-animate]), h2:not([data-animate]), h3:not([data-animate]), h4:not([data-animate]), h5:not([data-animate]), h6:not([data-animate]), li:not([data-animate]), blockquote:not([data-animate])';
				var children = parent.querySelectorAll(selector);

				children.forEach(function(child) {
					// Only add attributes if element doesn't already have data-animate (respects overrides)
					if (!child.hasAttribute('data-animate')) {
						child.setAttribute('data-animate', animClass);
						child.setAttribute('data-animate-trigger', animType);
						child.setAttribute('data-animate-duration', animDuration);
						if (animType === 'in-view') {
							child.setAttribute('data-animate-once', 'true');
						}
					}
				});
			});
		},

		/**
		 * Auto-initialize
		 * @param {string|HTMLElement} container - Container to initialize in
		 */
		init: function(container) {
			this.initAutoAnimateChildren(container);
			this.initScrollAnimations(container);
			this.initStagger(container);

			var containerEl = container ? D.one(container) : document;
			// Get raw DOM element from wrapper (ElementWrapper has .el property)
			var el = containerEl && containerEl.el ? containerEl.el : containerEl;
			var elements = el.querySelectorAll('[data-page-animate]');

			var self = this;
			elements.forEach(function(el) {
				var preset = el.getAttribute('data-page-animate');
				var pageName = el.getAttribute('data-page') || 'default';

				if (preset && self.presets[preset]) {
					self.register(pageName, self.presets[preset]);
				}
			});
		}
	};

	// Auto-init on DOM ready
	document.addEventListener('DOMContentLoaded', function() {
		PageAnimate.init();
	});

	// Reinit on SPA page load (DOM event, not Funky.Events)
	document.addEventListener('funky.spa.pageload', function(event) {
		console.log('[PageAnimate] SPA pageload event received', event.detail);

		// Get the content container
		var container = document.querySelector('#spaContent');
		console.log('[PageAnimate] Container:', container);

		if (!container) {
			console.warn('[PageAnimate] Content container not found');
			return;
		}

		// Reset all animated elements with in-view trigger
		var animatedElements = container.querySelectorAll('[data-animate-trigger="in-view"]');
		console.log('[PageAnimate] Found', animatedElements.length, 'in-view elements to reset');

		animatedElements.forEach(function(el) {
			var animClass = el.getAttribute('data-animate');
			if (animClass) {
				console.log('[PageAnimate] Resetting element with class:', animClass);
				// Remove any existing animation classes and state markers
				el.classList.remove(animClass, 'fade-in', 'fade-in-up', 'fade-in-left', 'slide-in-left', 'slide-in-right', 'scale-fade-in', 'animated', 'animating');
			}
		});

		// Reset all stagger containers
		var staggerContainers = container.querySelectorAll('[data-animate-stagger]');
		console.log('[PageAnimate] Found', staggerContainers.length, 'stagger containers to reset');

		staggerContainers.forEach(function(parent) {
			// Remove stagger state markers
			parent.classList.remove('stagger-animated', 'stagger-animating');

			// Reset all children
			var children = parent.querySelectorAll('[data-animate]');
			children.forEach(function(child) {
				var animClass = child.getAttribute('data-animate');
				if (animClass) {
					// Remove animation classes and state markers
					child.classList.remove(animClass, 'fade-in', 'fade-in-up', 'fade-in-left', 'slide-in-left', 'slide-in-right', 'scale-fade-in', 'animated', 'animating');
					// Clear inline styles that might have been added
					child.style.animationDelay = '';
				}
			});
		});

		// Small delay to allow DOM to settle before reinitializing
		setTimeout(function() {
			console.log('[PageAnimate] Reinitializing with container:', container);
			PageAnimate.init(container);
		}, 100);
	});

	// =========================================================================
	// Register with Funky namespace
	// =========================================================================

	Funky.register('PageAnimate', PageAnimate);

	console.log('[Funky.PageAnimate] v1.0.0 initialized');

})(window);
