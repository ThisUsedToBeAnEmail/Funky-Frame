/**
 * Funky.Tabs - Native Tab System
 *
 * Replaces Bootstrap Tab JavaScript while keeping Bootstrap CSS styling.
 * Provides show/hide API with events, keyboard navigation, and accessibility support.
 *
 * Usage:
 *   // Auto-initialize from data attributes
 *   Funky.Tabs.init();
 *
 *   // Manual initialization
 *   var tabs = new Funky.Tabs('#myTabs', {
 *     activeTab: 0,
 *     onChange: function(tabId, panelId) { }
 *   });
 *
 *   // Instance methods
 *   tabs.show(tabId);        // Show tab by ID or index
 *   tabs.getActive();        // Get current active tab
 *   tabs.dispose();          // Cleanup
 *
 *   // Static method
 *   Funky.Tabs.show('#myTab');
 *
 *   // Events (via Funky.PubSub - uses colons)
 *   P.on('funky:tabs:show', function(data) { console.log('Tab showing:', data.tabId); });
 *   P.on('funky:tabs:shown', function(data) { console.log('Tab shown:', data.tabId); });
 *
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Tabs] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('Tabs')) {
		return;
	}

	// Shortcuts
	var D = Funky.Dom;
	var P = Funky.PubSub;

	// Store tab instances: { tabContainerId: TabsInstance }
	var instances = {};

	// Default options
	var DEFAULTS = {
		activeTab: 0,           // Initial active tab (index or ID)
		keyboard: true,         // Enable keyboard navigation
		fade: true,             // Enable fade transitions
		onChange: null          // Callback when tab changes
	};

	// Use Funky.Animate for duration management
	var Animate = Funky.Animate;

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
		return target.el || target; // Handle ElementWrapper or raw element
	}

	/**
	 * Dispatch custom event on element
	 * @param {HTMLElement} element
	 * @param {string} eventName
	 * @param {Object} detail
	 * @returns {boolean}
	 */
	function dispatchEvent(element, eventName, detail) {
		var event = new CustomEvent(eventName, {
			bubbles: true,
			cancelable: true,
			detail: detail || {}
		});
		return element.dispatchEvent(event);
	}

	/**
	 * Tabs Constructor
	 * @param {string|HTMLElement} target - Tab container element or selector
	 * @param {Object} options - Configuration options
	 */
	function Tabs(target, options) {
		var element = getElement(target);
		if (!element) {
			console.error('[Funky.Tabs] Element not found:', target);
			return;
		}

		this.el = element;
		this.id = element.id || 'tabs-' + Date.now();
		this.options = Object.assign({}, DEFAULTS, options || {});
		this.tabButtons = [];
		this.tabPanels = [];
		this.activeTab = null;
		this.activePanel = null;
		this.isTransitioning = false;

		// Store instance
		instances[this.id] = this;

		// Initialize
		this._init();
	}

	Tabs.prototype = {
		/**
		 * Initialize tabs
		 * @private
		 */
		_init: function() {
			// Find all tab buttons within this container
			this.tabButtons = Array.prototype.slice.call(
				this.el.querySelectorAll('[data-funky-tab], [data-bs-toggle="tab"]')
			);

			if (this.tabButtons.length === 0) {
				console.warn('[Funky.Tabs] No tab buttons found in container:', this.id);
				return;
			}

			// Find associated panels and setup
			this._setupTabButtons();

			// Setup keyboard navigation
			if (this.options.keyboard) {
				this._setupKeyboardNav();
			}

			// Set initial active tab
			this._setInitialTab();

			console.log('[Funky.Tabs] Initialized with', this.tabButtons.length, 'tabs');
		},

		/**
		 * Setup tab buttons and find their panels
		 * @private
		 */
		_setupTabButtons: function() {
			var self = this;

			this.tabButtons.forEach(function(button) {
				// Get target panel
				var targetSelector = button.getAttribute('data-funky-tab') ||
				                    button.getAttribute('data-bs-target') ||
				                    button.getAttribute('href');

				if (!targetSelector) {
					console.warn('[Funky.Tabs] Tab button missing target:', button);
					return;
				}

				// Clean up selector
				if (targetSelector.charAt(0) !== '#') {
					targetSelector = '#' + targetSelector;
				}

				var panel = document.querySelector(targetSelector);
				if (!panel) {
					console.warn('[Funky.Tabs] Panel not found:', targetSelector);
					return;
				}

				// Store panel reference
				self.tabPanels.push(panel);

				// Setup ARIA attributes
				button.setAttribute('role', 'tab');
				button.setAttribute('aria-controls', panel.id);
				button.setAttribute('aria-selected', 'false');
				button.setAttribute('tabindex', '-1');
				panel.setAttribute('role', 'tabpanel');

				// Bind click event
				button.addEventListener('click', function(e) {
					e.preventDefault();
					self.show(button);
				});
			});
		},

		/**
		 * Setup keyboard navigation
		 * @private
		 */
		_setupKeyboardNav: function() {
			var self = this;

			this.tabButtons.forEach(function(button) {
				button.addEventListener('keydown', function(e) {
					var index = self.tabButtons.indexOf(button);
					var nextIndex = -1;

					// Arrow keys
					if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
						e.preventDefault();
						nextIndex = (index + 1) % self.tabButtons.length;
					} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
						e.preventDefault();
						nextIndex = (index - 1 + self.tabButtons.length) % self.tabButtons.length;
					} else if (e.key === 'Home') {
						e.preventDefault();
						nextIndex = 0;
					} else if (e.key === 'End') {
						e.preventDefault();
						nextIndex = self.tabButtons.length - 1;
					} else if (e.key === 'Enter' || e.key === ' ') {
						// Enter/Space activates the focused tab
						e.preventDefault();
						self.isTransitioning = false;
						self.show(button);
						return;
					}

					// Switch to tab and focus
					// Force immediate transition for keyboard navigation
					if (nextIndex !== -1) {
						self.isTransitioning = false; // Allow keyboard to override pending transition
						self.show(self.tabButtons[nextIndex]);
						self.tabButtons[nextIndex].focus();
					}
				});
			});
		},

		/**
		 * Set initial active tab
		 * @private
		 */
		_setInitialTab: function() {
			var activeTabOption = this.options.activeTab;
			var tabToActivate = null;

			// Find active tab based on option
			if (typeof activeTabOption === 'number') {
				// By index
				tabToActivate = this.tabButtons[activeTabOption];
			} else if (typeof activeTabOption === 'string') {
				// By ID or selector
				var selector = activeTabOption.charAt(0) === '#' ? activeTabOption : '#' + activeTabOption;
				var panel = document.querySelector(selector);
				if (panel) {
					// Find button that controls this panel
					tabToActivate = this.tabButtons.find(function(btn) {
						var target = btn.getAttribute('data-funky-tab') ||
						            btn.getAttribute('data-bs-target') ||
						            btn.getAttribute('href');
						return target === selector || target === activeTabOption;
					});
				}
			}

			// If no tab specified or found, look for already active tab in DOM
			if (!tabToActivate) {
				tabToActivate = this.tabButtons.find(function(btn) {
					return btn.classList.contains('active');
				});
			}

			// Fallback to first tab
			if (!tabToActivate && this.tabButtons.length > 0) {
				tabToActivate = this.tabButtons[0];
			}

			// Activate the tab
			if (tabToActivate) {
				this.show(tabToActivate, true); // silent = true to avoid event on init
			}
		},

		/**
		 * Show a tab
		 * @param {string|HTMLElement|number} target - Tab button element, selector, or index
		 * @param {boolean} silent - Don't emit events (for initial setup)
		 */
		show: function(target, silent) {
			var self = this;
			var button = null;
			var panel = null;

			// Find the button
			if (typeof target === 'number') {
				// By index
				button = this.tabButtons[target];
			} else if (typeof target === 'string') {
				// Check if it's a numeric string (treat as index)
				var numericIndex = parseInt(target, 10);
				if (!isNaN(numericIndex) && String(numericIndex) === target) {
					button = this.tabButtons[numericIndex];
				} else {
					// By selector (could be button or panel)
					try {
						var el = document.querySelector(target);
						if (el) {
							if (el.hasAttribute('data-funky-tab') || el.hasAttribute('data-bs-toggle')) {
								button = el;
							} else {
								// It's a panel, find the button
								button = this.tabButtons.find(function(btn) {
									var btnTarget = btn.getAttribute('data-funky-tab') ||
									               btn.getAttribute('data-bs-target') ||
									               btn.getAttribute('href');
									return btnTarget === target || btnTarget === '#' + target;
								});
							}
						}
					} catch (e) {
						// Invalid selector - ignore
						console.warn('[Funky.Tabs] Invalid selector:', target);
					}
				}
			} else if (target && target.nodeType === 1) {
				// It's an element
				button = target;
			}

			if (!button) {
				console.warn('[Funky.Tabs] Tab not found:', target);
				return;
			}

			// Get target panel
			var panelSelector = button.getAttribute('data-funky-tab') ||
			                   button.getAttribute('data-bs-target') ||
			                   button.getAttribute('href');

			if (panelSelector) {
				if (panelSelector.charAt(0) !== '#') {
					panelSelector = '#' + panelSelector;
				}
				panel = document.querySelector(panelSelector);
			}

			if (!panel) {
				console.warn('[Funky.Tabs] Panel not found for button:', button);
				return;
			}

			// Don't show if already active
			if (button === this.activeTab && panel === this.activePanel) {
				return;
			}

			// Prevent multiple transitions
			if (this.isTransitioning) {
				return;
			}

			// Emit show events (before transition)
			if (!silent) {
				var showEvent = dispatchEvent(button, 'funky.tabs.show', {
					tabs: this,
					tabId: panel.id,
					panelId: panel.id,
					button: button,
					panel: panel
				});
				P.emit('funky:tabs:show', {
					tabs: this,
					tabId: panel.id,
					panelId: panel.id,
					button: button,
					panel: panel
				});

				// Allow cancellation
				if (!showEvent) {
					return;
				}
			}

			// Store previous tab/panel
			var previousTab = this.activeTab;
			var previousPanel = this.activePanel;

			// Only track transition state for non-silent calls
			if (!silent) {
				this.isTransitioning = true;
			}

			// Hide previous panel
			if (previousPanel && previousPanel !== panel) {
				this._hidePanel(previousPanel, previousTab, silent);
			}

			// Show new panel
			this._showPanel(panel, button, silent);

			// Update active references
			this.activeTab = button;
			this.activePanel = panel;

			// Call onChange callback
			if (!silent && typeof this.options.onChange === 'function') {
				this.options.onChange(panel.id, panel.id);
			}

			// Get transition duration
			var duration = Animate.getDuration(panel, Animate.DURATION.FAST);

			// After transition complete
			setTimeout(function() {
				self.isTransitioning = false;

				// Emit shown events (after transition)
				if (!silent) {
					dispatchEvent(button, 'funky.tabs.shown', {
						tabs: self,
						tabId: panel.id,
						panelId: panel.id,
						button: button,
						panel: panel
					});
					P.emit('funky:tabs:shown', {
						tabs: self,
						tabId: panel.id,
						panelId: panel.id,
						button: button,
						panel: panel
					});
				}
			}, duration);
		},

		/**
		 * Hide a panel
		 * @private
		 */
		_hidePanel: function(panel, button, silent) {
			// Emit hide event
			if (!silent && button) {
				dispatchEvent(button, 'funky.tabs.hide', {
					tabs: this,
					tabId: panel.id,
					panelId: panel.id,
					button: button,
					panel: panel
				});
				P.emit('funky:tabs:hide', {
					tabs: this,
					tabId: panel.id,
					panelId: panel.id,
					button: button,
					panel: panel
				});
			}

			// Remove active state from button
			if (button) {
				button.classList.remove('active');
				button.setAttribute('aria-selected', 'false');
				button.setAttribute('tabindex', '-1');
			}

			// Remove active state from panel
			panel.classList.remove('show', 'active');

			var duration = Animate.getDuration(panel, Animate.DURATION.FAST);
			var self = this;

			// After transition
			setTimeout(function() {
				// Emit hidden event
				if (!silent && button) {
					dispatchEvent(button, 'funky.tabs.hidden', {
						tabs: self,
						tabId: panel.id,
						panelId: panel.id,
						button: button,
						panel: panel
					});
					P.emit('funky:tabs:hidden', {
						tabs: self,
						tabId: panel.id,
						panelId: panel.id,
						button: button,
						panel: panel
					});
				}
			}, duration);
		},

		/**
		 * Show a panel
		 * @private
		 */
		_showPanel: function(panel, button, silent) {
			// Add active state to button
			button.classList.add('active');
			button.setAttribute('aria-selected', 'true');
			button.setAttribute('tabindex', '0');

			// Add active state to panel
			if (panel.classList.contains('fade')) {
				// Force reflow for transition
				void panel.offsetHeight;
			}

			panel.classList.add('show', 'active');
		},

		/**
		 * Get the currently active tab
		 * @returns {Object} { button, panel, tabId }
		 */
		getActive: function() {
			if (!this.activeTab || !this.activePanel) {
				return null;
			}
			return {
				button: this.activeTab,
				panel: this.activePanel,
				tabId: this.activePanel.id
			};
		},

		/**
		 * Get tab button by index or ID
		 * @param {number|string} target
		 * @returns {HTMLElement|null}
		 */
		getTab: function(target) {
			// Guard against null/undefined
			if (target == null) {
				return null;
			}
			if (typeof target === 'number') {
				return this.tabButtons[target] || null;
			}
			// Handle string numeric index (e.g., '1')
			if (typeof target === 'string' && /^\d+$/.test(target)) {
				return this.tabButtons[parseInt(target, 10)] || null;
			}

			var selector = target.charAt(0) === '#' ? target : '#' + target;
			return this.tabButtons.find(function(btn) {
				var btnTarget = btn.getAttribute('data-funky-tab') ||
				               btn.getAttribute('data-bs-target') ||
				               btn.getAttribute('href');
				return btnTarget === selector || btnTarget === target;
			}) || null;
		},

		/**
		 * Dispose tabs instance
		 */
		dispose: function() {
			var self = this;

			// Remove event listeners
			this.tabButtons.forEach(function(button) {
				var newButton = button.cloneNode(true);
				button.parentNode.replaceChild(newButton, button);
			});

			// Clear state
			this.tabButtons = [];
			this.tabPanels = [];
			this.activeTab = null;
			this.activePanel = null;

			// Remove from instances
			delete instances[this.id];

			console.log('[Funky.Tabs] Disposed:', this.id);
		}
	};

	// =========================================================================
	// Static Methods
	// =========================================================================

	/**
	 * Get or create tabs instance
	 * @param {string|HTMLElement} target
	 * @param {Object} options
	 * @returns {Tabs}
	 */
	Tabs.getOrCreateInstance = function(target, options) {
		var element = getElement(target);
		if (!element) return null;

		var id = element.id;
		if (id && instances[id]) {
			return instances[id];
		}

		return new Tabs(element, options);
	};

	/**
	 * Get existing instance
	 * @param {string|HTMLElement} target
	 * @returns {Tabs|null}
	 */
	Tabs.getInstance = function(target) {
		var element = getElement(target);
		if (!element || !element.id) return null;
		return instances[element.id] || null;
	};

	/**
	 * Show a specific tab (static convenience method)
	 * @param {string|HTMLElement} target - Tab button or panel selector
	 * @param {Object} options - Options for new instance
	 */
	Tabs.show = function(target, options) {
		// Find the tab container
		var el = getElement(target);
		if (!el) return;

		// Find the tab container (nav element)
		var container = null;
		if (el.hasAttribute('data-funky-tab') || el.hasAttribute('data-bs-toggle')) {
			// It's a button, find the nav container
			container = el.closest('[role="tablist"], .nav-tabs, .nav-pills, .nav');
		} else {
			// It's a panel, find button then container
			var button = document.querySelector('[data-funky-tab="#' + el.id + '"], [data-bs-target="#' + el.id + '"]');
			if (button) {
				container = button.closest('[role="tablist"], .nav-tabs, .nav-pills, .nav');
			}
		}

		if (!container) {
			console.warn('[Funky.Tabs] Could not find tab container for:', target);
			return;
		}

		var tabs = Tabs.getOrCreateInstance(container, options);
		if (tabs) {
			tabs.show(target);
		}
	};

	/**
	 * Initialize tabs from data attributes
	 * @param {string|HTMLElement} container - Container to search (default: document)
	 */
	Tabs.init = function(container) {
		var root = container ? getElement(container) : document;
		var tabContainers = root.querySelectorAll('[role="tablist"], .nav-tabs, .nav-pills');

		tabContainers.forEach(function(el) {
			// Skip if already initialized
			if (el.id && instances[el.id]) {
				return;
			}

			// Auto-initialize
			new Tabs(el);
		});
	};

	/**
	 * Destroy an instance
	 * @param {string|HTMLElement} target
	 */
	Tabs.destroy = function(target) {
		var tabs = Tabs.getInstance(target);
		if (tabs) {
			tabs.dispose();
		}
	};

	// =========================================================================
	// Auto-initialize
	// =========================================================================

	// Initialize tabs on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			Tabs.init();
		});
	} else {
		Tabs.init();
	}

	// Register with Funky namespace
	Funky.register('Tabs', Tabs);

	console.log('[Funky.Tabs] v1.0.0 initialized');

})(window);
