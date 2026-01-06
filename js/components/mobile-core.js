/**
 * Funky.MobileCore - Mobile Bottom Navigation Bar
 *
 * Provides a fixed bottom navigation bar for mobile/tablet users,
 * exposing keyboard-only features as touch-accessible buttons.
 *
 * Features:
 * - Auto-enables on mobile breakpoint (< 768px)
 * - Dynamic action registration from any component
 * - Default actions: sidenav toggle, search, shortcuts, skip navigation
 * - Overflow "More" menu for excess actions
 * - Viewport-reactive actions - show/hide based on what's visible
 * - Hide on scroll down, show on scroll up
 *
 * @example
 * Funky.MobileCore.init({
 *   breakpoint: 'mobile',
 *   maxVisibleActions: 5,
 *   hideOnScroll: true
 * });
 *
 * Funky.MobileCore.registerAction({
 *   id: 'my-action',
 *   icon: 'fas fa-star',
 *   label: 'Action',
 *   onClick: function() { ... }
 * });
 *
 * @version 1.0.3
 */
(function(global) {
	'use strict';

	// =========================================================================
	// Namespace Guards
	// =========================================================================

	if (!global.Funky || !global.Funky.register) {
		console.error('[Funky.MobileCore] Registry not found. Load namespace.js first.');
		return;
	}

	if (global.Funky.isRegistered && global.Funky.isRegistered('MobileCore')) {
		return;
	}

	var Funky = global.Funky;
	var D = Funky.Dom;
	var PubSub = Funky.PubSub;

	// =========================================================================
	// State
	// =========================================================================

	var state = {
		initialized: false,
		visible: false,                 // Currently showing (based on breakpoint)
		hidden: false,                  // Hidden due to scroll
		element: null,                  // Main nav element
		actionsContainer: null,         // Container for action buttons
		overflowPanel: null,            // Overflow menu panel
		overflowOpen: false,            // Is overflow menu open
		scrollTracker: null,            // Funky.ScrollTracker instance
		visibilityObserver: null,       // Funky.VisibilityObserver for viewport-reactive
		observedElements: new Map(),    // element -> [actionIds] for viewport reactivity
		keyboardScope: null             // Keyboard scope for overflow menu
	};

	// =========================================================================
	// Configuration Defaults
	// =========================================================================

	var DEFAULTS = {
		// Breakpoint to activate on
		breakpoint: 'mobile',

		// Maximum visible actions before overflow
		maxVisibleActions: 5,

		// Auto-detect and register default actions
		autoRegister: true,

		// Default actions to register
		defaultActions: {
			sidenavToggle: true,
			commandPalette: true,
			keyboardHelp: true,
			skipLinks: true
		},

		// Icons
		moreIcon: 'fas fa-ellipsis-h',
		moreLabel: 'More',

		// Accessibility
		ariaLabel: 'Mobile navigation',

		// Z-index
		zIndex: 1050,

		// Scroll behavior
		hideOnScroll: true,
		scrollThreshold: 56            // Height of the bar - hide after scrolling past this
	};

	var config = {};

	// =========================================================================
	// Action Registry (using Funky.ActionRegistry if available)
	// =========================================================================

	var ActionRegistry = null;

	function initActionRegistry() {
		if (Funky.ActionRegistry) {
			ActionRegistry = Funky.ActionRegistry.create({
				schema: {
					icon: 'fas fa-circle',
					label: '',
					badge: undefined,
					badgeType: 'count',
					order: 50,
					hidden: false,
					disabled: false,
					onClick: null,
					emit: null,
					emitData: null,
					className: '',
					// Viewport reactivity
					visibleWhen: null,     // element selector - show when element is visible
					hiddenWhen: null       // element selector - hide when element is visible
				},
				onAdd: function(action) {
					if (state.initialized && state.visible) {
						render();
					}
					PubSub.emit('funky:mobile:action:added', { id: action.id });
				},
				onRemove: function(id) {
					if (state.initialized && state.visible) {
						render();
					}
					PubSub.emit('funky:mobile:action:removed', { id: id });
				},
				onUpdate: function(id, updates) {
					if (state.initialized && state.visible) {
						render();
					}
					PubSub.emit('funky:mobile:action:updated', { id: id, updates: updates });
				},
				onClear: function() {
					if (state.initialized && state.visible) {
						render();
					}
				}
			});
		} else {
			// Simple fallback registry
			var actions = {};
			ActionRegistry = {
				add: function(action) {
					actions[action.id] = action;
					if (state.initialized && state.visible) render();
				},
				remove: function(id) {
					delete actions[id];
					if (state.initialized && state.visible) render();
				},
				update: function(id, updates) {
					if (actions[id]) {
						for (var key in updates) {
							if (updates.hasOwnProperty(key)) {
								actions[id][key] = updates[key];
							}
						}
					}
					if (state.initialized && state.visible) render();
				},
				get: function(id) {
					return actions[id] || null;
				},
				getAll: function() {
					var result = [];
					for (var id in actions) {
						if (actions.hasOwnProperty(id)) {
							result.push(actions[id]);
						}
					}
					return result;
				},
				clear: function() {
					actions = {};
					if (state.initialized && state.visible) render();
				}
			};
		}
	}

	// =========================================================================
	// Default Actions
	// =========================================================================

	var DEFAULT_ACTIONS = {
		'sidenav-toggle': {
			id: 'sidenav-toggle',
			icon: 'fas fa-bars',
			label: 'Menu',
			order: 10,
			onClick: function() {
				// Use FunkyApp.toggleSidebar for the main app sidebar
				if (typeof FunkyApp !== 'undefined' && FunkyApp.toggleSidebar) {
					FunkyApp.toggleSidebar();
				}
			}
		},
		'command-palette': {
			id: 'command-palette',
			icon: 'fas fa-search',
			label: 'Search',
			order: 20,
			onClick: function() {
				if (Funky.CommandPalette) {
					Funky.CommandPalette.open();
				}
			}
		},
		'keyboard-help': {
			id: 'keyboard-help',
			icon: 'fas fa-keyboard',
			label: 'Shortcuts',
			order: 30,
			onClick: function() {
				if (Funky.Keyboard && Funky.Keyboard.showHelp) {
					Funky.Keyboard.showHelp();
				}
			}
		},
		'skip-navigation': {
			id: 'skip-navigation',
			icon: 'fas fa-forward',
			label: 'Skip',
			order: 40,
			onClick: function() {
				if (Funky.FocusManager && Funky.FocusManager.nextRegion) {
					Funky.FocusManager.nextRegion();
				}
			}
		}
	};

	/**
	 * Register default actions based on config and available components
	 */
	function registerDefaultActions() {
		if (!config.autoRegister) return;

		var defaults = config.defaultActions;

		// Sidenav toggle - only if main app sidebar exists
		if (defaults.sidenavToggle && document.querySelector('.sidebar')) {
			ActionRegistry.add(DEFAULT_ACTIONS['sidenav-toggle']);
		}

		// Command palette - only if available
		if (defaults.commandPalette && Funky.CommandPalette) {
			ActionRegistry.add(DEFAULT_ACTIONS['command-palette']);
		}

		// Keyboard help - only if available
		if (defaults.keyboardHelp && Funky.Keyboard && Funky.Keyboard.showHelp) {
			ActionRegistry.add(DEFAULT_ACTIONS['keyboard-help']);
		}

		// Skip links - only if FocusManager available
		if (defaults.skipLinks && Funky.FocusManager) {
			ActionRegistry.add(DEFAULT_ACTIONS['skip-navigation']);
		}
	}

	/**
	 * Scan registered Funky components for mobileActions static property
	 */
	function scanForMobileActions() {
		if (!config.autoRegister) return;

		// Get list of registered components
		var components = Funky.list ? Funky.list() : [];

		components.forEach(function(name) {
			var component = Funky[name];
			if (component && component.mobileActions && Array.isArray(component.mobileActions)) {
				component.mobileActions.forEach(function(action) {
					// Don't add duplicates
					if (!ActionRegistry.get(action.id)) {
						ActionRegistry.add(action);
						// Setup viewport observation if needed
						observeActionElement(action);
					}
				});
			}
		});
	}

	// =========================================================================
	// DOM Creation
	// =========================================================================

	/**
	 * Create the mobile nav DOM structure
	 */
	function createDOM() {
		// Main nav element
		state.element = D.nav()
			.classAdd('mobile-core')
			.attr('role', 'navigation')
			.attr('aria-label', config.ariaLabel);

		// Actions container
		state.actionsContainer = D.div()
			.classAdd('mobile-core__actions');

		state.element.append(state.actionsContainer);

		// Overflow panel (hidden by default)
		state.overflowPanel = D.div()
			.classAdd('mobile-core__overflow')
			.attr('aria-hidden', 'true');

		var backdrop = D.div()
			.classAdd('mobile-core__overflow-backdrop')
			.on('click', closeOverflow);

		var panel = D.div()
			.classAdd('mobile-core__overflow-panel')
			.attr('role', 'menu');

		state.overflowPanel
			.append(backdrop)
			.append(panel);

		state.element.append(state.overflowPanel);

		// Append to body
		document.body.appendChild(state.element.el);
	}

	/**
	 * Render all action buttons
	 */
	function render() {
		if (!state.actionsContainer) return;

		// Clear current actions
		state.actionsContainer.html('');

		// Get all visible actions sorted by order
		var actions = ActionRegistry.getAll()
			.filter(function(a) { return !a.hidden; })
			.sort(function(a, b) { return (a.order || 50) - (b.order || 50); });

		// Split into visible and overflow
		var visibleActions = actions.slice(0, config.maxVisibleActions - 1);
		var overflowActions = actions.slice(config.maxVisibleActions - 1);

		// Render visible actions
		visibleActions.forEach(function(action) {
			var btn = createActionButton(action);
			state.actionsContainer.append(btn);
		});

		// Add "More" button if needed
		if (overflowActions.length > 0) {
			var moreBtn = createActionButton({
				id: 'more',
				icon: config.moreIcon,
				label: config.moreLabel,
				onClick: toggleOverflow
			});
			moreBtn.classAdd('mobile-core__action--more');
			state.actionsContainer.append(moreBtn);

			// Render overflow panel
			renderOverflowPanel(overflowActions);
		}
	}

	/**
	 * Create an action button element
	 * @param {Object} action - Action config
	 * @returns {Element} Button element
	 */
	function createActionButton(action) {
		var btn = D.button()
			.classAdd('mobile-core__action')
			.attr('type', 'button')
			.attr('data-action', action.id)
			.attr('aria-label', action.label);

		if (action.disabled) {
			btn.attr('disabled', 'disabled');
		}

		if (action.className) {
			btn.classAdd(action.className);
		}

		// Icon
		var iconSpan = D.span()
			.classAdd('mobile-core__action-icon');

		var icon = D.i()
			.classAdd(action.icon);

		iconSpan.append(icon);
		btn.append(iconSpan);

		// Label
		var label = D.span()
			.classAdd('mobile-core__action-label')
			.text(action.label);

		btn.append(label);

		// Badge
		if (action.badge !== undefined && action.badge !== null) {
			var badge = D.span()
				.classAdd('mobile-core__action-badge')
				.text(String(action.badge));
			btn.append(badge);
		}

		// Click handler
		btn.on('click', function(e) {
			e.preventDefault();

			if (action.disabled) return;

			// Close overflow if open
			if (state.overflowOpen && action.id !== 'more') {
				closeOverflow();
			}

			// Execute action
			if (action.onClick) {
				action.onClick(e);
			} else if (action.emit && PubSub) {
				PubSub.emit(action.emit, action.emitData || {});
			}

			// Emit action triggered event
			PubSub.emit('funky:mobile:action:triggered', { id: action.id });
		});

		return btn;
	}

	/**
	 * Render the overflow panel with actions
	 * @param {Array} actions - Overflow actions
	 */
	function renderOverflowPanel(actions) {
		var panel = state.overflowPanel.el.querySelector('.mobile-core__overflow-panel');
		if (!panel) return;

		panel.innerHTML = '';

		actions.forEach(function(action) {
			var item = createActionButton(action);
			item.classAdd('mobile-core__overflow-item');
			panel.appendChild(item.el);
		});
	}

	// =========================================================================
	// Overflow Menu
	// =========================================================================

	/**
	 * Toggle overflow menu
	 */
	function toggleOverflow() {
		if (state.overflowOpen) {
			closeOverflow();
		} else {
			openOverflow();
		}
	}

	/**
	 * Open overflow menu
	 */
	function openOverflow() {
		if (state.overflowOpen) return;

		state.overflowOpen = true;
		state.overflowPanel.attr('aria-hidden', 'false');
		state.element.classAdd('mobile-core--overflow-open');

		// Focus first item
		var firstItem = state.overflowPanel.el.querySelector('.mobile-core__overflow-item');
		if (firstItem) {
			firstItem.focus();
		}

		// Register keyboard scope for Escape
		if (Funky.Keyboard && Funky.Keyboard.pushScope) {
			state.keyboardScope = Funky.Keyboard.pushScope('mobile-core-overflow', {
				Escape: closeOverflow
			});
		}

		PubSub.emit('funky:mobile:overflow:opened');
	}

	/**
	 * Close overflow menu
	 */
	function closeOverflow() {
		if (!state.overflowOpen) return;

		state.overflowOpen = false;
		state.overflowPanel.attr('aria-hidden', 'true');
		state.element.classRemove('mobile-core--overflow-open');

		// Pop keyboard scope
		if (Funky.Keyboard && Funky.Keyboard.popScope && state.keyboardScope) {
			Funky.Keyboard.popScope(state.keyboardScope);
			state.keyboardScope = null;
		}

		// Return focus to More button
		var moreBtn = state.actionsContainer.el.querySelector('[data-action="more"]');
		if (moreBtn) {
			moreBtn.focus();
		}

		PubSub.emit('funky:mobile:overflow:closed');
	}

	// =========================================================================
	// Visibility Control
	// =========================================================================

	/**
	 * Show the mobile nav bar
	 */
	function show() {
		if (state.visible) return;

		state.visible = true;
		state.element.classAdd('mobile-core--active');

		// Setup scroll tracking
		setupScrollTracker();

		PubSub.emit('funky:mobile:shown');
	}

	/**
	 * Hide the mobile nav bar
	 */
	function hide() {
		if (!state.visible) return;

		state.visible = false;
		state.hidden = false;
		state.element.classRemove('mobile-core--active');
		state.element.classRemove('mobile-core--hidden');

		// Close overflow if open
		if (state.overflowOpen) {
			closeOverflow();
		}

		// Cleanup scroll tracking
		destroyScrollTracker();

		PubSub.emit('funky:mobile:hidden');
	}

	/**
	 * Hide bar due to scroll (slides out)
	 */
	function hideBar() {
		if (state.hidden || !state.visible) return;

		state.hidden = true;
		state.element.classAdd('mobile-core--hidden');
	}

	/**
	 * Show bar after scroll (slides back in)
	 */
	function showBar() {
		if (!state.hidden || !state.visible) return;

		state.hidden = false;
		state.element.classRemove('mobile-core--hidden');
	}

	// =========================================================================
	// Scroll Tracking
	// =========================================================================

	/**
	 * Find the main scrollable container on the page
	 * Pages should mark their scroll container with data-scroll-container attribute
	 * @returns {HTMLElement|null} The scrollable container or null for window
	 */
	function findScrollableContainer() {
		// Look for explicitly marked scroll container
		var container = document.querySelector('[data-scroll-container]');
		if (container) {
			console.log('[MobileCore] Found scroll container:', container.className || container.id || container.tagName);
			return container;
		}
		return null;
	}

	/**
	 * Setup scroll tracker for hide-on-scroll behavior
	 */
	function setupScrollTracker() {
		if (!config.hideOnScroll) return;

		if (!Funky.ScrollTracker) {
			console.warn('[MobileCore] ScrollTracker not available for hide-on-scroll');
			return;
		}

		// Find the active scrollable container, fallback to window
		var scrollTarget = findScrollableContainer() || window;

		console.log('[MobileCore] Scroll target:', scrollTarget === window ? 'window' : scrollTarget.className || scrollTarget.tagName);

		state.scrollTracker = Funky.ScrollTracker.init({
			namespace: 'mobile-core',
			target: scrollTarget,
			trackDirection: true,
			onScroll: function(data) {
				console.log('[MobileCore] Scroll:', data.direction, 'scrollY:', data.scrollY, 'threshold:', config.scrollThreshold);

				if (!data.direction) return;

				if (data.direction === 'down' && data.scrollY > config.scrollThreshold) {
					console.log('[MobileCore] Hiding bar');
					hideBar();
				} else if (data.direction === 'up') {
					console.log('[MobileCore] Showing bar');
					showBar();
				}
			}
		});
	}

	/**
	 * Destroy scroll tracker
	 */
	function destroyScrollTracker() {
		if (state.scrollTracker) {
			state.scrollTracker.destroy();
			state.scrollTracker = null;
		}
	}

	// =========================================================================
	// MediaQuery Integration
	// =========================================================================

	/**
	 * Setup MediaQuery listener for breakpoint
	 */
	function setupMediaQuery() {
		if (!Funky.MediaQuery) {
			console.warn('[MobileCore] MediaQuery not available');
			return;
		}

		Funky.MediaQuery.subscribe({
			breakpoint: config.breakpoint,
			namespace: 'mobile-core',
			onChange: function(matches) {
				if (matches) {
					show();
				} else {
					hide();
				}
			}
		});
	}

	/**
	 * Cleanup MediaQuery listener
	 */
	function cleanupMediaQuery() {
		if (Funky.MediaQuery) {
			Funky.MediaQuery.unsubscribe('mobile-core');
		}
	}

	// =========================================================================
	// Viewport-Reactive Actions (using VisibilityObserver)
	// =========================================================================

	/**
	 * Setup visibility observer for viewport-reactive actions
	 */
	function setupViewportObserver() {
		if (!Funky.VisibilityObserver) return;

		state.visibilityObserver = Funky.VisibilityObserver.init({
			threshold: config.viewportThreshold || 0.1,
			onVisible: function(element) {
				updateActionsForElement(element, true);
			},
			onHidden: function(element) {
				updateActionsForElement(element, false);
			}
		});
	}

	/**
	 * Update actions based on element visibility
	 * @param {Element} element - The observed element
	 * @param {boolean} isVisible - Whether element is visible
	 */
	function updateActionsForElement(element, isVisible) {
		var actionIds = state.observedElements.get(element);
		if (!actionIds) return;

		actionIds.forEach(function(actionId) {
			var action = ActionRegistry.get(actionId);
			if (!action) return;

			// visibleWhen = show when element is visible
			// hiddenWhen = hide when element is visible
			var shouldShow;
			if (action.visibleWhen) {
				shouldShow = isVisible;
			} else if (action.hiddenWhen) {
				shouldShow = !isVisible;
			} else {
				return; // No viewport binding
			}

			ActionRegistry.update(actionId, { hidden: !shouldShow });
		});
	}

	/**
	 * Observe element for an action's viewport binding
	 * @param {Object} action - Action config
	 */
	function observeActionElement(action) {
		if (!state.visibilityObserver) return;

		var selector = action.visibleWhen || action.hiddenWhen;
		if (!selector) return;

		var el = typeof selector === 'string'
			? document.querySelector(selector)
			: selector;

		if (!el) return;

		// Track which actions are tied to this element
		var existing = state.observedElements.get(el) || [];
		if (existing.indexOf(action.id) === -1) {
			existing.push(action.id);
			state.observedElements.set(el, existing);
		}

		// Start observing
		state.visibilityObserver.observe(el);

		// Set initial hidden state based on binding type
		if (action.visibleWhen) {
			// Hide until element becomes visible
			ActionRegistry.update(action.id, { hidden: true });
		}
	}

	/**
	 * Stop observing element for an action
	 * @param {string} actionId - Action ID
	 */
	function unobserveActionElement(actionId) {
		if (!state.visibilityObserver) return;

		state.observedElements.forEach(function(actionIds, element) {
			var index = actionIds.indexOf(actionId);
			if (index > -1) {
				actionIds.splice(index, 1);
				if (actionIds.length === 0) {
					state.visibilityObserver.unobserve(element);
					state.observedElements.delete(element);
				}
			}
		});
	}

	/**
	 * Destroy viewport observer
	 */
	function destroyViewportObserver() {
		if (state.visibilityObserver) {
			state.visibilityObserver.destroy();
			state.visibilityObserver = null;
		}
		state.observedElements.clear();
	}

	// =========================================================================
	// PubSub Integration
	// =========================================================================

	/**
	 * Setup PubSub listeners for external action registration
	 */
	function setupPubSub() {
		// Allow components to register actions via PubSub
		PubSub.on('funky:mobile:action:register', function(action) {
			ActionRegistry.add(action);
			// Setup viewport observation if needed
			observeActionElement(action);
		});

		PubSub.on('funky:mobile:action:unregister', function(data) {
			unobserveActionElement(data.id);
			ActionRegistry.remove(data.id);
		});

		PubSub.on('funky:mobile:action:update', function(data) {
			ActionRegistry.update(data.id, data.updates);
		});

		// Listen for component initialization to auto-register actions
		PubSub.on('funky:sidenav:initialized', function() {
			if (config.autoRegister && config.defaultActions.sidenavToggle) {
				if (!ActionRegistry.get('sidenav-toggle')) {
					ActionRegistry.add(DEFAULT_ACTIONS['sidenav-toggle']);
				}
			}
		});

		// Re-setup scroll tracker on SPA navigation (scroll container may change)
		// SPA uses DOM events (funky.spa.pageload), not PubSub
		document.addEventListener('funky.spa.pageload', handleSpaPageload);
	}

	/**
	 * Handle SPA page load - re-setup scroll tracker
	 */
	function handleSpaPageload() {
		console.log('[MobileCore] SPA pageload - re-setting up scroll tracker');
		// Small delay to let DOM settle
		setTimeout(function() {
			destroyScrollTracker();
			setupScrollTracker();
		}, 100);
	}

	/**
	 * Cleanup PubSub listeners
	 */
	function cleanupPubSub() {
		PubSub.off('funky:mobile:action:register');
		PubSub.off('funky:mobile:action:unregister');
		PubSub.off('funky:mobile:action:update');
		PubSub.off('funky:sidenav:initialized');
		document.removeEventListener('funky.spa.pageload', handleSpaPageload);
	}

	// =========================================================================
	// Initialization
	// =========================================================================

	/**
	 * Initialize MobileCore
	 * @param {Object} options - Configuration options
	 */
	function init(options) {
		if (state.initialized) {
			console.warn('[MobileCore] Already initialized');
			return MobileCore;
		}

		// Merge config
		config = {};
		for (var key in DEFAULTS) {
			if (DEFAULTS.hasOwnProperty(key)) {
				config[key] = DEFAULTS[key];
			}
		}
		if (options) {
			for (var optKey in options) {
				if (options.hasOwnProperty(optKey)) {
					config[optKey] = options[optKey];
				}
			}
		}

		// Initialize action registry
		initActionRegistry();

		// Create DOM
		createDOM();

		// Setup viewport observer (before registering actions)
		setupViewportObserver();

		// Register default actions
		registerDefaultActions();

		// Setup media query listener
		setupMediaQuery();

		// Setup PubSub listeners
		setupPubSub();

		// Scan for component mobile actions
		scanForMobileActions();

		// Initial render
		render();

		state.initialized = true;

		PubSub.emit('funky:mobile:initialized');

		return MobileCore;
	}

	/**
	 * Destroy MobileCore and cleanup
	 */
	function destroy() {
		if (!state.initialized) return;

		// Close overflow
		if (state.overflowOpen) {
			closeOverflow();
		}

		// Cleanup scroll tracker
		destroyScrollTracker();

		// Cleanup viewport observer
		destroyViewportObserver();

		// Cleanup media query
		cleanupMediaQuery();

		// Cleanup PubSub
		cleanupPubSub();

		// Remove DOM
		if (state.element && state.element.el && state.element.el.parentNode) {
			state.element.el.parentNode.removeChild(state.element.el);
		}

		// Clear action registry
		if (ActionRegistry) {
			ActionRegistry.clear();
		}

		// Reset state
		state.initialized = false;
		state.visible = false;
		state.hidden = false;
		state.element = null;
		state.actionsContainer = null;
		state.overflowPanel = null;
		state.overflowOpen = false;

		PubSub.emit('funky:mobile:destroyed');
	}

	// =========================================================================
	// Public API
	// =========================================================================

	var MobileCore = {
		/**
		 * Initialize MobileCore
		 * @param {Object} options - Configuration options
		 */
		init: init,

		/**
		 * Destroy MobileCore
		 */
		destroy: destroy,

		/**
		 * Show the mobile nav bar (manual override)
		 */
		show: show,

		/**
		 * Hide the mobile nav bar (manual override)
		 */
		hide: hide,

		/**
		 * Check if visible
		 * @returns {boolean}
		 */
		isVisible: function() {
			return state.visible;
		},

		/**
		 * Check if initialized
		 * @returns {boolean}
		 */
		isInitialized: function() {
			return state.initialized;
		},

		/**
		 * Register an action
		 * @param {Object} action - Action config
		 */
		registerAction: function(action) {
			if (!ActionRegistry) {
				console.warn('[MobileCore] Not initialized');
				return;
			}
			ActionRegistry.add(action);
		},

		/**
		 * Unregister an action
		 * @param {string} id - Action ID
		 */
		unregisterAction: function(id) {
			if (!ActionRegistry) return;
			ActionRegistry.remove(id);
		},

		/**
		 * Update an action
		 * @param {string} id - Action ID
		 * @param {Object} updates - Properties to update
		 */
		updateAction: function(id, updates) {
			if (!ActionRegistry) return;
			ActionRegistry.update(id, updates);
		},

		/**
		 * Get an action by ID
		 * @param {string} id - Action ID
		 * @returns {Object|null}
		 */
		getAction: function(id) {
			if (!ActionRegistry) return null;
			return ActionRegistry.get(id);
		},

		/**
		 * Get all actions
		 * @returns {Array}
		 */
		getActions: function() {
			if (!ActionRegistry) return [];
			return ActionRegistry.getAll();
		},

		/**
		 * Open overflow menu
		 */
		openOverflow: openOverflow,

		/**
		 * Close overflow menu
		 */
		closeOverflow: closeOverflow,

		/**
		 * Toggle overflow menu
		 */
		toggleOverflow: toggleOverflow
	};

	// =========================================================================
	// Auto-Init
	// =========================================================================

	document.addEventListener('DOMContentLoaded', function() {
		// Auto-init if data attribute present
		if (document.querySelector('[data-mobile-core]')) {
			init();
		}
	});

	// =========================================================================
	// Register with Funky
	// =========================================================================

	Funky.register('MobileCore', MobileCore);

	console.log('[Funky.MobileCore] v1.0.0 loaded');

})(typeof window !== 'undefined' ? window : this);
