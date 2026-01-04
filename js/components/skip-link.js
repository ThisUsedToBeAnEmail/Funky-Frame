/**
 * Funky.SkipLink - Accessible Skip Link Component
 *
 * Provides keyboard navigation shortcuts to bypass repetitive content.
 * Auto-discovers skip targets and integrates with SPA navigation.
 *
 * Features:
 * - Auto-discovery via data-skip-target attributes
 * - Multiple skip links per page
 * - SPA-aware (reinitializes on page transitions)
 * - ARIA announcements
 * - Smooth focus and scroll management
 *
 * Usage:
 *   // Auto-initialization (recommended)
 *   Funky.SkipLink.init();
 *
 *   // Manual registration
 *   Funky.SkipLink.register({
 *     label: 'Skip to main content',
 *     target: '#spaContent',
 *     order: 1
 *   });
 *
 *   // Programmatic skip
 *   Funky.SkipLink.skipTo('#spaContent');
 *
 * HTML Attributes:
 *   <main id="spaContent" data-skip-target="main" data-skip-label="main content">
 *   <nav data-skip-target="navigation" data-skip-label="primary navigation" data-skip-order="0">
 *
 * @version 1.0.1
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.SkipLink] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('SkipLink')) {
		return;
	}

	// Shortcuts
	var D = Funky.Dom;
	var Events = Funky.Events;

	// Keyboard is loaded separately, so we access it dynamically
	function getKeyboard() {
		return window.Funky && window.Funky.Keyboard;
	}

	// =========================================================================
	// CORE SKIP LINK OBJECT
	// =========================================================================

	var SkipLink = {
		// Configuration
		config: {
			containerSelector: '#skip-links',
			targetAttribute: 'data-skip-target',
			labelAttribute: 'data-skip-label',
			orderAttribute: 'data-skip-order',
			announcerSelector: '#spa-announcer',
			skipLinkClass: 'skip-link',
			focusScrollBehavior: 'smooth',
			fKeyStart: 3,  // Start at F3 (F1 is help, F2 is filter in help modal)
			showHelpOnFirstTab: true  // Show keyboard help modal on first tab to skip link
		},

		// State
		skipLinks: [],
		container: null,
		initialized: false,
		registeredShortcuts: [],  // Track registered keyboard shortcuts
		hasShownHelp: false,  // Track if help has been shown on first tab

		/**
		 * Initialize skip link component
		 * @param {Object} options - Configuration options
		 */
		init: function(options) {
			if (this.initialized) {
				console.warn('[Funky.SkipLink] Already initialized');
				return;
			}

			// Merge options
			if (options) {
				Object.assign(this.config, options);
			}

			// Find or create container (D.one returns ElementWrapper)
			var containerWrapper = D.one(this.config.containerSelector);
			// D.one always returns ElementWrapper - check if underlying el exists
			this.container = (containerWrapper && containerWrapper.el) ? containerWrapper.el : null;
			if (!this.container || typeof this.container.appendChild !== 'function') {
				console.warn('[Funky.SkipLink] Container not found:', this.config.containerSelector);
				return;
			}

			// Check if Keyboard component is available (warn but continue)
			if (!getKeyboard()) {
				console.warn('[Funky.SkipLink] Funky.Keyboard not yet loaded. F-key shortcuts will be registered when available.');
			}

			// Scan and register shortcuts
			this.refresh();

			// Mark as initialized
			this.initialized = true;

			console.log('[Funky.SkipLink] Initialized');
		},

		/**
		 * Refresh skip links (scan targets, generate buttons, and register keyboard shortcuts)
		 */
		refresh: function() {
			// Unregister previous shortcuts
			this.unregisterAllShortcuts();

			// Scan targets
			this.skipLinks = this.scanTargets();

			// Generate visible skip links (WCAG requirement)
			this.generateLinks();

			// Register F-key keyboard shortcuts
			this.registerKeyboardShortcuts();
		},

		/**
		 * Scan document for skip targets
		 * @returns {Array} Array of skip link configurations
		 */
		scanTargets: function() {
			var selector = '[' + this.config.targetAttribute + ']';
			var targets = document.querySelectorAll(selector);
			var links = [];

			targets.forEach(function(target) {
				// Ensure target has an ID
				var id = target.id;
				if (!id) {
					id = 'skip-' + this.config.targetAttribute + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
					target.id = id;
				}

				// Get label
				var label = target.getAttribute(this.config.labelAttribute);
				if (!label) {
					label = id.replace(/[_-]/g, ' ');
				}

				// Get order
				var order = parseInt(target.getAttribute(this.config.orderAttribute) || '0', 10);

				links.push({
					id: id,
					label: label,
					element: target,
					order: order
				});
			}, this);

			// Sort by order attribute
			links.sort(function(a, b) {
				return a.order - b.order;
			});

			return links;
		},

		/**
		 * Generate skip link discovery element
		 * Creates a visually hidden focusable element that shows help on first Tab press (WCAG requirement)
		 */
		generateLinks: function() {
			if (!this.container) return;

			// Clear existing content (this.container is now always a DOM element)
			this.container.innerHTML = '';

			// Create a single discovery link (visually hidden but focusable)
			var a = document.createElement('a');
			a.href = '#';
			a.className = this.config.skipLinkClass;
			a.textContent = 'Keyboard shortcuts';  // Screen reader only
			a.setAttribute('role', 'button');
			a.setAttribute('aria-label', 'Show keyboard shortcuts');
			a.setAttribute('tabindex', '1');  // Ensure first in tab order

			// Add focus handler to show help on first tab
			var self = this;
			Events.on(a, 'focus', function() {
				var Keyboard = getKeyboard();
				if (self.config.showHelpOnFirstTab && !self.hasShownHelp && Keyboard) {
					self.hasShownHelp = true;
					Keyboard.showHelp();
					// Remove from tab order after first use - user knows about F1 now
					a.setAttribute('tabindex', '-1');
					a.blur();
				}
			});

			// Add click handler to always show help (for screen readers)
			Events.on(a, 'click', function(e) {
				e.preventDefault();
				var Keyboard = getKeyboard();
				if (Keyboard) {
					Keyboard.showHelp();
				}
			});

			this.container.appendChild(a);
		},

		/**
		 * Register keyboard shortcuts for all skip links
		 */
		registerKeyboardShortcuts: function() {
			var Keyboard = getKeyboard();
			if (!Keyboard) return;

			// Reserved F-keys that should not be used for skip links
			// F1 = Browser help, F6 = Region navigation (standard accessibility)
			var reservedFKeys = [1, 6];

			// Register F-keys for skip links (starting from fKeyStart, skipping reserved)
			var fKeyIndex = this.config.fKeyStart;

			this.skipLinks.forEach(function(link) {
				// Skip reserved F-keys
				while (reservedFKeys.indexOf(fKeyIndex) !== -1 && fKeyIndex <= 12) {
					fKeyIndex++;
				}

				// Only register up to F12
				if (fKeyIndex > 12) return;

				var fKeyName = 'f' + fKeyIndex;

				// Register the keyboard shortcut
				var unregister = Keyboard.register({
					key: fKeyName,
					handler: this.skipTo.bind(this, '#' + link.id),
					description: 'Skip to ' + link.label,
					group: 'Navigation',
					priority: 50
				});

				// Track the unregister function
				this.registeredShortcuts.push(unregister);

				// Store the assigned F-key on the link for reference
				link.fKey = fKeyIndex;

				fKeyIndex++;
			}, this);

			console.log('[Funky.SkipLink] Registered ' + this.registeredShortcuts.length + ' keyboard shortcuts');
		},

		/**
		 * Unregister all keyboard shortcuts
		 */
		unregisterAllShortcuts: function() {
			this.registeredShortcuts.forEach(function(unregister) {
				unregister();
			});
			this.registeredShortcuts = [];
		},

		/**
		 * Skip to target element
		 * @param {string} targetSelector - CSS selector for target
		 */
		skipTo: function(targetSelector) {
			var target = D.one(targetSelector);
			// D.one returns ElementWrapper - get the underlying element
			var targetEl = target ? target.el : null;
			if (!targetEl) {
				console.warn('[Funky.SkipLink] Target not found:', targetSelector);
				return;
			}

			// Focus the target
			this.focusTarget(targetEl);

			// Announce the skip action
			var label = targetEl.getAttribute(this.config.labelAttribute) || targetEl.id || 'content';
			this.announce('Skipped to ' + label);
		},

		/**
		 * Focus target element with scroll
		 * @param {HTMLElement} element - Target element
		 */
		focusTarget: function(element) {
			// Guard against null/undefined element
			if (!element || typeof element.hasAttribute !== 'function') {
				console.warn('[Funky.SkipLink] Invalid element passed to focusTarget');
				return;
			}

			// Ensure element is focusable
			if (!element.hasAttribute('tabindex')) {
				element.setAttribute('tabindex', '-1');
			}

			// Focus the element
			element.focus();

			// Scroll into view
			element.scrollIntoView({
				behavior: this.config.focusScrollBehavior,
				block: 'start'
			});
		},

		/**
		 * Announce message to screen readers
		 * @param {string} message - Message to announce
		 */
		announce: function(message) {
			var announcer = document.querySelector(this.config.announcerSelector);
			if (!announcer) {
				console.warn('[Funky.SkipLink] Announcer not found:', this.config.announcerSelector);
				return;
			}

			// Set message
			announcer.textContent = message;

			// Clear after delay
			setTimeout(function() {
				announcer.textContent = '';
			}, 1000);
		},

		/**
		 * Manually register a skip link
		 * @param {Object} config - Skip link configuration
		 * @param {string} config.label - Link label
		 * @param {string} config.target - Target selector
		 * @param {number} config.order - Sort order (optional)
		 */
		register: function(config) {
			if (!config || !config.label || !config.target) {
				console.error('[Funky.SkipLink] Invalid configuration:', config);
				return;
			}

			var target = D.one(config.target);
			// D.one returns ElementWrapper - check if underlying element exists
			var targetEl = target ? (target.el || target) : null;
			if (!targetEl) {
				console.warn('[Funky.SkipLink] Target not found:', config.target);
				return;
			}

			// Ensure target has ID
			var id = targetEl.id;
			if (!id) {
				id = 'skip-manual-' + Date.now();
				targetEl.id = id;
			}

			// Add to skip links
			this.skipLinks.push({
				id: id,
				label: config.label,
				element: targetEl,
				order: config.order || 999
			});

			// Re-sort
			this.skipLinks.sort(function(a, b) {
				return a.order - b.order;
			});

			// Re-register keyboard shortcuts
			this.unregisterAllShortcuts();
			this.registerKeyboardShortcuts();
		},

		/**
		 * Destroy skip links
		 */
		destroy: function() {
			if (!this.initialized) return;

			// Unregister all keyboard shortcuts
			this.unregisterAllShortcuts();

			// Clear state
			this.skipLinks = [];
			this.initialized = false;

			console.log('[Funky.SkipLink] Destroyed');
		}
	};

	// =========================================================================
	// Auto-initialization
	// =========================================================================

	// Auto-init on DOM ready
	Events.ready(function() {
		SkipLink.init();
	});

	// Reinit on SPA page load (using DOM event, not Funky.PubSub)
	document.addEventListener('funky.spa.pageload', function(event) {
		console.log('[SkipLink] SPA pageload event received');

		// Small delay to allow DOM to settle
		setTimeout(function() {
			SkipLink.refresh();
		}, 50);
	});

	// =========================================================================
	// Register with Funky namespace
	// =========================================================================

	Funky.register('SkipLink', SkipLink);

	console.log('[Funky.SkipLink] v1.0.0 initialized');

})(window);
