/**
 * FunkyNav - Unified Navigation Position System
 * Handles navigation position detection, dropdown/flyout behavior,
 * modal slide direction awareness, and data-driven navigation rendering.
 * @module Funky.NavPosition
 * @version 1.1.0
 */
(function(window) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('NavPosition')) {
		return;
	}

	/**
	 * Navigation positions
	 */
	var POSITIONS = {
		LEFT: 'left',
		RIGHT: 'right',
		TOP: 'top',
		BOTTOM: 'bottom'
	};

	/**
	 * Modal slide directions
	 */
	var SLIDE_DIRECTIONS = {
		LEFT: 'left',
		RIGHT: 'right',
		TOP: 'top',
		BOTTOM: 'bottom',
		AUTO: 'auto'
	};

	/**
	 * FunkyNav Constructor
	 */
	function FunkyNav() {
		this.currentPosition = POSITIONS.LEFT;
		this.modalSlideDirection = SLIDE_DIRECTIONS.AUTO;
		this.openDropdowns = [];
		this.changeListeners = [];

		// DOM references (set on init)
		this.sidebar = null;
		this.sidebarNav = null;
		this.navGroups = [];

		// Data-driven navigation state
		this._items = null;           // Navigation items array
		this._config = null;          // Configuration object
		this._itemsById = {};         // Quick lookup by ID
		this._spaUnsubscribe = null;  // PubSub unsubscribe function

		// Bind methods for event handlers
		this._handleOutsideClick = this._handleOutsideClick.bind(this);
		this._handleEscapeKey = this._handleEscapeKey.bind(this);
		this._handleResize = this._handleResize.bind(this);
	}

	/**
	 * Initialize the navigation system
	 * Should be called after DOM is ready
	 * @param {Object} [config] - Optional configuration for data-driven navigation
	 * @param {Array} [config.items] - Navigation items to render
	 * @param {string} [config.container] - Container selector (default: '#sidebar')
	 * @param {string} [config.navId] - Nav element ID (default: 'sidebarNav')
	 * @param {string} [config.logoHref] - Logo link href
	 * @param {string} [config.logoText] - Logo text
	 * @param {string} [config.logoIcon] - Logo icon class
	 * @param {boolean} [config.collapsible] - Enable sidebar collapse (default: true)
	 * @param {string} [config.position] - Initial nav position
	 * @param {boolean} [config.spaMode] - Enable SPA route detection (default: true when items provided)
	 * @param {string} [config.activeClass] - CSS class for active items (default: 'active')
	 * @param {Function} [config.onSelect] - Callback when item is selected
	 */
	FunkyNav.prototype.init = function(config) {
		var self = this;
		config = config || {};
		this._config = config;

		// If items provided, render the navigation first
		if (config.items && Array.isArray(config.items)) {
			this._items = config.items;
			this._buildItemsLookup();
			this._renderNavigation(config);
		}

		// Set position from config if provided
		if (config.position) {
			document.body.setAttribute('data-nav-position', config.position);
		}

		// Get DOM references
		this.sidebar = document.getElementById(config.container ? config.container.replace('#', '') : 'sidebar');
		this.sidebarNav = document.getElementById(config.navId || 'sidebarNav');
		this.navGroups = this.sidebarNav ?
			Array.from(this.sidebarNav.querySelectorAll('.nav-group')) : [];

		// Detect initial position
		this._detectPosition();

		// Load user preference for modal slide direction
		this._loadModalSlidePreference();

		// Set up event listeners
		this._setupEventListeners();

		// Set up mutation observer to detect position changes
		this._setupPositionObserver();

		// Set up SPA mode if enabled (default true when items provided)
		if (this._items && config.spaMode !== false) {
			this._setupSpaMode();
			// Detect active item from current URL
			this._detectActiveFromUrl();
		}

		// Re-initialize Navigation scroll persistence for dynamic nav
		if (this._items && Funky.Navigation && Funky.Navigation.init) {
			Funky.Navigation.init();
		}

		console.log('[FunkyNav] Initialized with position:', this.currentPosition,
			this._items ? '(data-driven, ' + this._items.length + ' items)' : '(existing HTML)');

		return this;
	};

	/**
	 * Detect current navigation position from data attribute
	 * @private
	 */
	FunkyNav.prototype._detectPosition = function() {
		var position = document.body.getAttribute('data-nav-position');
		this.currentPosition = position || POSITIONS.LEFT;
	};

	/**
	 * Load modal slide direction preference
	 * @private
	 */
	FunkyNav.prototype._loadModalSlidePreference = function() {
		var self = this;

		// Check for explicit data attribute first
		var explicit = document.body.getAttribute('data-modal-slide');
		if (explicit && SLIDE_DIRECTIONS[explicit.toUpperCase()]) {
			this.modalSlideDirection = explicit;
			this._applyModalSlideDirection();
			return;
		}

		// Load from user preferences if available
		if (Funky.Preferences) {
			Funky.Preferences.load().then(function(prefs) {
				var themePrefs = prefs.theme || {};
				self.modalSlideDirection = themePrefs.modal_slide_direction || SLIDE_DIRECTIONS.AUTO;
				self._applyModalSlideDirection();
			}).catch(function() {
				self.modalSlideDirection = SLIDE_DIRECTIONS.AUTO;
				self._applyModalSlideDirection();
			});
		} else {
			this._applyModalSlideDirection();
		}
	};

	/**
	 * Apply modal slide direction to body attribute
	 * @private
	 */
	FunkyNav.prototype._applyModalSlideDirection = function() {
		var direction = this.getModalSlideDirection();
		document.body.setAttribute('data-modal-slide', direction);
	};

	/**
	 * Set up event listeners for dropdown behavior
	 * @private
	 */
	FunkyNav.prototype._setupEventListeners = function() {
		var self = this;

		// Close dropdowns on outside click
		document.addEventListener('click', this._handleOutsideClick);

		// Close dropdowns on Escape key - use Funky.Keyboard if available
		if (Funky.Keyboard) {
			this._keyboardUnregister = Funky.Keyboard.register({
				key: 'escape',
				scope: 'global',
				handler: function() {
					if (self.openDropdowns.length > 0) {
						self.closeAllDropdowns();
					}
				},
				description: 'Close navigation menus',
				group: 'Navigation',
				priority: -10 // Lower priority so component escape handlers run first
			});
		} else {
			document.addEventListener('keydown', this._handleEscapeKey);
		}

		// Handle resize for responsive behavior
		window.addEventListener('resize', this._handleResize);
	};

	/**
	 * Set up mutation observer to detect nav position changes
	 * @private
	 */
	FunkyNav.prototype._setupPositionObserver = function() {
		var self = this;

		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-nav-position') {
					var oldPosition = self.currentPosition;
					self._detectPosition();

					if (oldPosition !== self.currentPosition) {
						self._onPositionChange(oldPosition, self.currentPosition);
					}
				}
			});
		});

		observer.observe(document.body, { attributes: true });
	};

	/**
	 * Handle nav position change
	 * @private
	 */
	FunkyNav.prototype._onPositionChange = function(oldPosition, newPosition) {
		console.log('[FunkyNav] Position changed from', oldPosition, 'to', newPosition);

		// Close any open dropdowns
		this.closeAllDropdowns();

		// Re-apply modal slide direction (may change in auto mode)
		this._applyModalSlideDirection();

		// Notify listeners
		this.changeListeners.forEach(function(callback) {
			try {
				callback(newPosition, oldPosition);
			} catch (e) {
				console.error('[FunkyNav] Listener error:', e);
			}
		});
	};

	/**
	 * Handle click outside dropdowns
	 * @private
	 */
	FunkyNav.prototype._handleOutsideClick = function(e) {
		// Only relevant for horizontal nav positions
		if (!this.isHorizontal()) {
			return;
		}

		// Check if click is outside any open dropdown
		var clickedInside = false;
		this.openDropdowns.forEach(function(group) {
			if (group.contains(e.target)) {
				clickedInside = true;
			}
		});

		if (!clickedInside && this.openDropdowns.length > 0) {
			this.closeAllDropdowns();
		}
	};

	/**
	 * Handle Escape key to close dropdowns
	 * @private
	 */
	FunkyNav.prototype._handleEscapeKey = function(e) {
		if (e.key === 'Escape' && this.openDropdowns.length > 0) {
			this.closeAllDropdowns();
		}
	};

	/**
	 * Handle window resize
	 * @private
	 */
	FunkyNav.prototype._handleResize = function() {
		// Close dropdowns on resize to prevent positioning issues
		if (this.openDropdowns.length > 0) {
			this.closeAllDropdowns();
		}
	};

	// ============================================
	// DATA-DRIVEN NAVIGATION RENDERING
	// ============================================

	/**
	 * Build lookup table for items by ID
	 * @private
	 */
	FunkyNav.prototype._buildItemsLookup = function() {
		var self = this;
		this._itemsById = {};

		function traverse(items) {
			items.forEach(function(item) {
				if (item.id) {
					self._itemsById[item.id] = item;
				}
				if (item.children && item.children.length > 0) {
					traverse(item.children);
				}
			});
		}

		if (this._items) {
			traverse(this._items);
		}
	};

	/**
	 * Render navigation structure from data
	 * @param {Object} config - Configuration with items
	 * @private
	 */
	FunkyNav.prototype._renderNavigation = function(config) {
		var self = this;
		var D = Funky.Dom;

		if (!D) {
			console.error('[FunkyNav] Funky.Dom is required for data-driven navigation');
			return;
		}

		var containerId = config.container ? config.container.replace('#', '') : 'sidebar';
		var navId = config.navId || 'sidebarNav';
		var position = config.position || document.body.getAttribute('data-nav-position') || 'left';

		// Create sidebar element
		var sidebar = D.create('aside')
			.class('sidebar')
			.id(containerId);

		// Add position-specific class for horizontal nav
		if (position === 'top' || position === 'bottom') {
			sidebar.class('sidebar sidebar-horizontal');
		}

		// Header with logo
		if (config.logoText || config.logoHref || config.logoIcon) {
			var logoContent = [];
			if (config.logoIcon) {
				logoContent.push(D.icon(config.logoIcon));
			}
			if (config.logoText) {
				logoContent.push(D.span().class('sidebar-logo-text').text(config.logoText));
			}

			sidebar.child(
				D.div().class('sidebar-header').child(
					D.a()
						.class('sidebar-logo')
						.attr('href', config.logoHref || '/')
						.child(logoContent)
				)
			);
		}

		// Navigation container
		var nav = D.create('nav')
			.class('sidebar-nav')
			.id(navId);

		// Render items
		config.items.forEach(function(item) {
			nav.child(self._renderNavItem(item, config));
		});

		sidebar.child(nav);

		// Sidebar toggle button (for collapsible sidebar)
		if (config.collapsible !== false) {
			sidebar.child(
				D.button()
					.attr('type', 'button')
					.class('sidebar-toggle')
					.id('sidebarToggle')
					.attr('title', 'Toggle Sidebar')
					.aria('label', 'Toggle Sidebar')
					.child(D.span().class('toggle-icon').text('◀'))
			);
		}

		// Find or create container in DOM
		var existingContainer = document.getElementById(containerId);
		if (existingContainer) {
			existingContainer.parentNode.replaceChild(sidebar.get(), existingContainer);
		} else {
			// Insert at beginning of body or before main content
			var mainWrapper = document.querySelector('.main-wrapper');
			if (mainWrapper) {
				document.body.insertBefore(sidebar.get(), mainWrapper);
			} else {
				document.body.insertBefore(sidebar.get(), document.body.firstChild);
			}
		}
	};

	/**
	 * Render a single navigation item (recursive for groups)
	 * @param {Object} item - Navigation item data
	 * @param {Object} config - Navigation config
	 * @returns {Object} Funky.Dom element wrapper
	 * @private
	 */
	FunkyNav.prototype._renderNavItem = function(item, config) {
		var self = this;
		var D = Funky.Dom;
		var activeClass = config.activeClass || 'active';

		// Group item (has children)
		if (item.children && item.children.length > 0) {
			var isCollapsed = item.expanded === false;
			var contentId = 'nav-group-items-' + item.id;

			return D.li()
				.class(D.classes('nav-group', isCollapsed && 'collapsed'))
				.data('group', item.id)
				.child(
					D.button()
						.attr('type', 'button')
						.class('nav-group-header')
						.aria('expanded', String(!isCollapsed))
						.aria('controls', contentId)
						.child(
							item.icon && D.span().class('nav-icon').child(
								D.icon('fas ' + item.icon)
							),
							D.span().class('nav-text').text(item.label),
							item.badge !== undefined && D.span().class('nav-badge').text(String(item.badge)),
							D.span().class('nav-chevron').child(
								D.icon('fas fa-chevron-down')
							)
						),
					D.ul()
						.id(contentId)
						.class('nav-group-items')
						.child(item.children.map(function(child) {
							return self._renderNavItem(child, config);
						}))
				);
		}

		// Standalone item (leaf node)
		var linkClasses = D.classes(
			'nav-link',
			item.active && activeClass,
			item.disabled && 'disabled'
		);

		var link = D.a()
			.class(linkClasses)
			.attr('href', item.href || '#')
			.data('id', item.id)
			.child(
				item.icon && D.span().class('nav-icon').child(
					D.icon('fas ' + item.icon)
				),
				D.span().class('nav-text').text(item.label),
				item.badge !== undefined && D.span().class('nav-badge').text(String(item.badge))
			);

		if (item.tooltip) {
			link.data('tooltip', item.tooltip);
		}

		if (item.disabled) {
			link.attr('aria-disabled', 'true').attr('tabindex', '-1');
		}

		if (item.active) {
			link.aria('current', 'page');
		}

		// Add click handler for onSelect callback
		if (config.onSelect) {
			link.on('click', function(e) {
				if (!item.disabled) {
					config.onSelect(item, e);
				}
			});
		}

		return D.li()
			.class('nav-standalone')
			.data('id', item.id)
			.child(link);
	};

	// ============================================
	// SPA INTEGRATION
	// ============================================

	/**
	 * Set up SPA mode - listen for route changes
	 * @private
	 */
	FunkyNav.prototype._setupSpaMode = function() {
		var self = this;

		// Subscribe to SPA navigation events
		if (Funky.PubSub) {
			this._spaUnsubscribe = Funky.PubSub.on('funky:spa:navigate', function(data) {
				self._detectActiveFromUrl();
			});
		}

		// Also listen for popstate (browser back/forward)
		this._popstateHandler = function() {
			self._detectActiveFromUrl();
		};
		window.addEventListener('popstate', this._popstateHandler);
	};

	/**
	 * Detect and set active item based on current URL
	 * @private
	 */
	FunkyNav.prototype._detectActiveFromUrl = function() {
		if (!this._items || !this.sidebarNav) return;

		var self = this;
		var path = window.location.pathname;
		var activeClass = (this._config && this._config.activeClass) || 'active';
		var bestMatch = null;
		var bestMatchLength = 0;

		// Find best matching item (longest matching href)
		function findMatch(items) {
			items.forEach(function(item) {
				if (item.href) {
					// Exact match
					if (item.href === path) {
						if (item.href.length > bestMatchLength) {
							bestMatch = item;
							bestMatchLength = item.href.length;
						}
					}
					// Prefix match (for nested routes)
					else if (path.startsWith(item.href) && item.href !== '/') {
						if (item.href.length > bestMatchLength) {
							bestMatch = item;
							bestMatchLength = item.href.length;
						}
					}
					// Special case for root
					else if (item.href === '/' && path === '/') {
						bestMatch = item;
						bestMatchLength = 1;
					}
				}
				if (item.children) {
					findMatch(item.children);
				}
			});
		}

		findMatch(this._items);

		// Clear all active states
		var activeLinks = this.sidebarNav.querySelectorAll('.nav-link.' + activeClass);
		activeLinks.forEach(function(link) {
			link.classList.remove(activeClass);
			link.removeAttribute('aria-current');
		});

		// Set new active state
		if (bestMatch) {
			this.setActive(bestMatch.id);
		}
	};

	// ============================================
	// PUBLIC API - Data-Driven Navigation
	// ============================================

	/**
	 * Set the active navigation item
	 * @param {string} itemId - Item ID to mark as active
	 * @returns {FunkyNav} this for chaining
	 */
	FunkyNav.prototype.setActive = function(itemId) {
		if (!this.sidebarNav) return this;

		var activeClass = (this._config && this._config.activeClass) || 'active';

		// Clear all active states
		var activeLinks = this.sidebarNav.querySelectorAll('.nav-link.' + activeClass);
		activeLinks.forEach(function(link) {
			link.classList.remove(activeClass);
			link.removeAttribute('aria-current');
		});

		// Find and activate the new item
		var link = this.sidebarNav.querySelector('.nav-link[data-id="' + itemId + '"]');
		if (link) {
			link.classList.add(activeClass);
			link.setAttribute('aria-current', 'page');

			// Expand parent group if collapsed
			var parentGroup = link.closest('.nav-group');
			if (parentGroup && parentGroup.classList.contains('collapsed')) {
				parentGroup.classList.remove('collapsed');
				var header = parentGroup.querySelector('.nav-group-header');
				if (header) {
					header.setAttribute('aria-expanded', 'true');
				}
			}
		}

		return this;
	};

	/**
	 * Add items to the navigation
	 * @param {Array} items - Items to add
	 * @param {string} [parentId] - Parent group ID (adds to root if omitted)
	 * @returns {FunkyNav} this for chaining
	 */
	FunkyNav.prototype.addItems = function(items, parentId) {
		if (!this._items || !items || !Array.isArray(items)) return this;

		var self = this;

		if (parentId) {
			// Add to specific parent group
			var parent = this._itemsById[parentId];
			if (parent) {
				parent.children = parent.children || [];
				items.forEach(function(item) {
					parent.children.push(item);
					if (item.id) {
						self._itemsById[item.id] = item;
					}
				});
			}
		} else {
			// Add to root
			items.forEach(function(item) {
				self._items.push(item);
				if (item.id) {
					self._itemsById[item.id] = item;
				}
			});
		}

		// Re-render
		this._renderNavigation(this._config);

		return this;
	};

	/**
	 * Remove an item from navigation
	 * @param {string} itemId - Item ID to remove
	 * @returns {FunkyNav} this for chaining
	 */
	FunkyNav.prototype.removeItem = function(itemId) {
		if (!this._items) return this;

		var self = this;

		function removeFromArray(items) {
			for (var i = items.length - 1; i >= 0; i--) {
				if (items[i].id === itemId) {
					items.splice(i, 1);
					delete self._itemsById[itemId];
					return true;
				}
				if (items[i].children && removeFromArray(items[i].children)) {
					return true;
				}
			}
			return false;
		}

		removeFromArray(this._items);

		// Re-render
		this._renderNavigation(this._config);

		return this;
	};

	/**
	 * Update an existing item
	 * @param {string} itemId - Item ID to update
	 * @param {Object} updates - Properties to update
	 * @returns {FunkyNav} this for chaining
	 */
	FunkyNav.prototype.updateItem = function(itemId, updates) {
		var item = this._itemsById[itemId];
		if (!item) return this;

		// Merge updates
		Object.assign(item, updates);

		// Re-render
		this._renderNavigation(this._config);

		return this;
	};

	/**
	 * Get current navigation items as data
	 * @returns {Array|null} Items array or null if not data-driven
	 */
	FunkyNav.prototype.getItems = function() {
		return this._items ? JSON.parse(JSON.stringify(this._items)) : null;
	};

	/**
	 * Get an item by ID
	 * @param {string} itemId - Item ID
	 * @returns {Object|null} Item data or null
	 */
	FunkyNav.prototype.getItem = function(itemId) {
		var item = this._itemsById[itemId];
		return item ? Object.assign({}, item) : null;
	};

	// ============================================
	// PUBLIC API - Position Detection
	// ============================================

	/**
	 * Get current navigation position
	 * @returns {string} Current position (left, right, top, bottom)
	 */
	FunkyNav.prototype.getPosition = function() {
		this._detectPosition(); // Refresh from DOM
		return this.currentPosition;
	};

	/**
	 * Check if navigation is horizontal (top or bottom)
	 * @returns {boolean}
	 */
	FunkyNav.prototype.isHorizontal = function() {
		return this.currentPosition === POSITIONS.TOP ||
			this.currentPosition === POSITIONS.BOTTOM;
	};

	/**
	 * Check if navigation is vertical (left or right)
	 * @returns {boolean}
	 */
	FunkyNav.prototype.isVertical = function() {
		return this.currentPosition === POSITIONS.LEFT ||
			this.currentPosition === POSITIONS.RIGHT;
	};

	/**
	 * Check if navigation is on left side
	 * @returns {boolean}
	 */
	FunkyNav.prototype.isLeft = function() {
		return this.currentPosition === POSITIONS.LEFT;
	};

	/**
	 * Check if navigation is on right side
	 * @returns {boolean}
	 */
	FunkyNav.prototype.isRight = function() {
		return this.currentPosition === POSITIONS.RIGHT;
	};

	/**
	 * Check if navigation is at top
	 * @returns {boolean}
	 */
	FunkyNav.prototype.isTop = function() {
		return this.currentPosition === POSITIONS.TOP;
	};

	/**
	 * Check if navigation is at bottom
	 * @returns {boolean}
	 */
	FunkyNav.prototype.isBottom = function() {
		return this.currentPosition === POSITIONS.BOTTOM;
	};

	// ============================================
	// PUBLIC API - Modal Slide Direction
	// ============================================

	/**
	 * Get the effective modal slide direction
	 * Resolves 'auto' to the appropriate direction based on nav position
	 * @returns {string} Effective slide direction (left, right, top, bottom)
	 */
	FunkyNav.prototype.getModalSlideDirection = function() {
		if (this.modalSlideDirection !== SLIDE_DIRECTIONS.AUTO) {
			return this.modalSlideDirection;
		}

		// Auto logic: slide from opposite side of navigation
		switch (this.currentPosition) {
			case POSITIONS.LEFT:
				return SLIDE_DIRECTIONS.RIGHT;
			case POSITIONS.RIGHT:
				return SLIDE_DIRECTIONS.LEFT;
			case POSITIONS.TOP:
				return SLIDE_DIRECTIONS.RIGHT; // Default to right for horizontal nav
			case POSITIONS.BOTTOM:
				return SLIDE_DIRECTIONS.RIGHT;
			default:
				return SLIDE_DIRECTIONS.RIGHT;
		}
	};

	/**
	 * Set modal slide direction preference
	 * @param {string} direction - Direction (auto, left, right, top, bottom)
	 * @param {boolean} save - Whether to save to user preferences
	 * @returns {Promise} Resolves when saved (if save=true)
	 */
	FunkyNav.prototype.setModalSlideDirection = function(direction, save) {
		var self = this;

		if (!direction || typeof direction !== 'string' || !SLIDE_DIRECTIONS[direction.toUpperCase()]) {
			console.warn('[FunkyNav] Invalid slide direction:', direction);
			return Promise.reject(new Error('Invalid direction'));
		}

		this.modalSlideDirection = direction;
		this._applyModalSlideDirection();

		if (save && Funky.Preferences) {
			return Funky.Preferences.load().then(function(prefs) {
				var themeData = prefs.theme || {};
				themeData.modal_slide_direction = direction;
				return Funky.Preferences.save('theme', themeData);
			}).then(function() {
				if (Funky.Toast) {
					Funky.Toast.success('Modal slide direction updated', 'Settings');
				}
			});
		}

		return Promise.resolve();
	};

	/**
	 * Toggle fullscreen mode on a modal
	 * @param {HTMLElement|string} modalOrId - Modal element or its ID
	 * @returns {boolean} New fullscreen state
	 */
	FunkyNav.prototype.toggleModalFullscreen = function(modalOrId) {
		var modal = typeof modalOrId === 'string' ?
			document.getElementById(modalOrId.replace('#', '')) :
			modalOrId;

		if (!modal) {
			console.warn('[FunkyNav] Modal not found:', modalOrId);
			return false;
		}

		var isFullscreen = modal.classList.toggle('modal-fullscreen-mode');
		console.log('[FunkyNav] Modal fullscreen:', isFullscreen);
		return isFullscreen;
	};

	/**
	 * Set fullscreen mode on a modal
	 * @param {HTMLElement|string} modalOrId - Modal element or its ID
	 * @param {boolean} fullscreen - Whether to enable fullscreen
	 */
	FunkyNav.prototype.setModalFullscreen = function(modalOrId, fullscreen) {
		var modal = typeof modalOrId === 'string' ?
			document.getElementById(modalOrId.replace('#', '')) :
			modalOrId;

		if (!modal) {
			console.warn('[FunkyNav] Modal not found:', modalOrId);
			return;
		}

		if (fullscreen) {
			modal.classList.add('modal-fullscreen-mode');
		} else {
			modal.classList.remove('modal-fullscreen-mode');
		}
	};

	/**
	 * Initialize fullscreen toggle buttons on modals
	 * Adds a fullscreen toggle button to modal headers that have the class .modal-slide-panel
	 */
	FunkyNav.prototype.initModalFullscreenToggles = function() {
		var self = this;

		// Find all slide panel modals that don't already have a fullscreen toggle
		var modals = document.querySelectorAll('.modal-slide-panel .modal-header');

		modals.forEach(function(header) {
			// Skip if already has fullscreen toggle
			if (header.querySelector('.modal-fullscreen-toggle')) {
				return;
			}

			// Create fullscreen toggle button
			var toggle = document.createElement('button');
			toggle.type = 'button';
			toggle.className = 'modal-fullscreen-toggle';
			toggle.setAttribute('aria-label', 'Toggle fullscreen');
			toggle.setAttribute('title', 'Toggle fullscreen');
			toggle.innerHTML = '<i class="fas fa-expand"></i><i class="fas fa-compress"></i>';

			// Find the modal element
			var modal = header.closest('.modal-slide-panel');

			// Add click handler
			toggle.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				self.toggleModalFullscreen(modal);
			});

			// Insert at the beginning of the header (before the title)
			header.insertBefore(toggle, header.firstChild);
		});
	};

	/**
	 * Get the opposite side of the navigation
	 * Useful for positioning modals, flyouts, etc.
	 * @returns {string} Opposite side (left, right, top, bottom)
	 */
	FunkyNav.prototype.getOppositeSide = function() {
		switch (this.currentPosition) {
			case POSITIONS.LEFT:
				return POSITIONS.RIGHT;
			case POSITIONS.RIGHT:
				return POSITIONS.LEFT;
			case POSITIONS.TOP:
				return POSITIONS.BOTTOM;
			case POSITIONS.BOTTOM:
				return POSITIONS.TOP;
			default:
				return POSITIONS.RIGHT;
		}
	};

	// ============================================
	// PUBLIC API - Dropdown Management
	// ============================================

	/**
	 * Position a dropdown menu based on nav position and viewport
	 * Uses position: fixed to escape z-index stacking context issues
	 * @param {HTMLElement} group - The .nav-group element
	 * @param {HTMLElement} dropdown - The .nav-group-items element
	 * @private
	 */
	FunkyNav.prototype._positionDropdown = function(group, dropdown) {
		if (!group || !dropdown || !this.isHorizontal()) {
			return; // Only position for horizontal nav
		}

		var header = group.querySelector('.nav-group-header');
		if (!header) return;

		var headerRect = header.getBoundingClientRect();
		var viewportHeight = window.innerHeight;
		var viewportWidth = window.innerWidth;

		// Use position: fixed to escape z-index stacking context
		dropdown.style.position = 'fixed';
		dropdown.style.zIndex = '99999'; // Above everything including modals

		// Reset ALL previous positioning and sizing to get accurate measurements
		dropdown.style.top = '';
		dropdown.style.bottom = '';
		dropdown.style.left = '';
		dropdown.style.right = '';
		dropdown.style.maxHeight = 'none';
		dropdown.style.height = 'auto';
		dropdown.style.minWidth = headerRect.width + 'px';

		// Get dropdown dimensions (make visible briefly to measure)
		dropdown.style.visibility = 'hidden';
		dropdown.style.display = 'block';

		// Force reflow to get accurate dimensions
		void dropdown.offsetHeight;

		var dropdownRect = dropdown.getBoundingClientRect();
		dropdown.style.visibility = '';

		var dropdownHeight = dropdownRect.height;
		var dropdownWidth = Math.max(dropdownRect.width, headerRect.width);

		if (this.isTop()) {
			// Top nav: dropdown appears below the header
			var spaceBelow = viewportHeight - headerRect.bottom;
			var spaceAbove = headerRect.top;

			if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
				// Position below (default for top nav)
				dropdown.style.top = headerRect.bottom + 'px';
				dropdown.style.bottom = 'auto';
				dropdown.style.maxHeight = Math.min(dropdownHeight, spaceBelow - 20) + 'px';
			} else {
				// Flip to above if more space
				dropdown.style.top = 'auto';
				dropdown.style.bottom = (viewportHeight - headerRect.top) + 'px';
				dropdown.style.maxHeight = Math.min(dropdownHeight, spaceAbove - 20) + 'px';
			}
		} else if (this.isBottom()) {
			// Bottom nav: dropdown appears above the header
			var spaceAbove = headerRect.top;
			var spaceBelow = viewportHeight - headerRect.bottom;

			if (spaceAbove >= dropdownHeight || spaceAbove >= spaceBelow) {
				// Position above (default for bottom nav)
				dropdown.style.top = 'auto';
				dropdown.style.bottom = (viewportHeight - headerRect.top) + 'px';
				dropdown.style.maxHeight = Math.min(dropdownHeight, spaceAbove - 20) + 'px';
			} else {
				// Flip to below if more space
				dropdown.style.top = headerRect.bottom + 'px';
				dropdown.style.bottom = 'auto';
				dropdown.style.maxHeight = Math.min(dropdownHeight, spaceBelow - 20) + 'px';
			}
		}

		// Horizontal positioning using fixed coordinates
		var leftPos = headerRect.left;
		var rightOverflow = leftPos + dropdownWidth - viewportWidth;

		if (rightOverflow > 0) {
			// Dropdown would overflow right edge, align to right of header
			dropdown.style.left = 'auto';
			dropdown.style.right = (viewportWidth - headerRect.right) + 'px';
		} else {
			// Align to left of header
			dropdown.style.left = leftPos + 'px';
			dropdown.style.right = 'auto';
		}

		// Add overflow scrolling if needed
		dropdown.style.overflowY = 'auto';
	};

	/**
	 * Open a navigation group dropdown
	 * @param {HTMLElement} group - The .nav-group element
	 */
	FunkyNav.prototype.openDropdown = function(group) {
		if (!group || group.classList.contains('open')) {
			return;
		}

		// For horizontal nav, close other dropdowns first (single open at a time)
		if (this.isHorizontal()) {
			this.closeAllDropdowns();
		}

		group.classList.add('open');
		group.classList.add('expanded');

		// Position dropdown for horizontal nav
		if (this.isHorizontal()) {
			var dropdown = group.querySelector('.nav-group-items');
			if (dropdown) {
				this._positionDropdown(group, dropdown);
			}
		}

		// Track open dropdowns
		if (this.openDropdowns.indexOf(group) === -1) {
			this.openDropdowns.push(group);
		}

		// Update aria
		var header = group.querySelector('.nav-group-header');
		if (header) {
			header.setAttribute('aria-expanded', 'true');
		}
	};

	/**
	 * Close a navigation group dropdown
	 * @param {HTMLElement} group - The .nav-group element
	 */
	FunkyNav.prototype.closeDropdown = function(group) {
		if (!group) {
			return;
		}

		group.classList.remove('open');
		group.classList.remove('expanded');

		// For horizontal nav, also reset positioning styles
		if (this.isHorizontal()) {
			// Reset dropdown positioning styles (including position: fixed)
			var dropdown = group.querySelector('.nav-group-items');
			if (dropdown) {
				dropdown.style.position = '';
				dropdown.style.zIndex = '';
				dropdown.style.top = '';
				dropdown.style.bottom = '';
				dropdown.style.left = '';
				dropdown.style.right = '';
				dropdown.style.height = '';
				dropdown.style.maxHeight = '';
				dropdown.style.minWidth = '';
				dropdown.style.overflowY = '';
				dropdown.style.display = '';
			}
		}

		// Remove from tracking
		var index = this.openDropdowns.indexOf(group);
		if (index > -1) {
			this.openDropdowns.splice(index, 1);
		}

		// Update aria
		var header = group.querySelector('.nav-group-header');
		if (header) {
			header.setAttribute('aria-expanded', 'false');
		}
	};

	/**
	 * Toggle a navigation group dropdown
	 * @param {HTMLElement} group - The .nav-group element
	 */
	FunkyNav.prototype.toggleDropdown = function(group) {
		if (!group) {
			return;
		}

		var isOpen = group.classList.contains('open') ||
			(this.isHorizontal() && group.classList.contains('expanded'));

		if (isOpen) {
			this.closeDropdown(group);
		} else {
			this.openDropdown(group);
		}
	};

	/**
	 * Close all open dropdowns
	 */
	FunkyNav.prototype.closeAllDropdowns = function() {
		var self = this;

		// Clone array since we'll be modifying it
		var toClose = this.openDropdowns.slice();
		toClose.forEach(function(group) {
			self.closeDropdown(group);
		});

		// Also close any expanded groups in horizontal mode and reset fixed positioning
		if (this.isHorizontal()) {
			this.navGroups.forEach(function(group) {
				group.classList.remove('expanded');
				group.classList.remove('open');

				// Reset any fixed positioning on dropdowns
				var dropdown = group.querySelector('.nav-group-items');
				if (dropdown) {
					dropdown.style.position = '';
					dropdown.style.zIndex = '';
					dropdown.style.top = '';
					dropdown.style.bottom = '';
					dropdown.style.left = '';
					dropdown.style.right = '';
					dropdown.style.height = '';
					dropdown.style.maxHeight = '';
					dropdown.style.minWidth = '';
					dropdown.style.overflowY = '';
					dropdown.style.display = '';
				}
			});
		}

		this.openDropdowns = [];
	};

	// ============================================
	// PUBLIC API - Event Listeners
	// ============================================

	/**
	 * Add a listener for navigation position changes
	 * @param {Function} callback - Function called with (newPosition, oldPosition)
	 */
	FunkyNav.prototype.addPositionListener = function(callback) {
		if (typeof callback === 'function') {
			this.changeListeners.push(callback);
		}
	};

	/**
	 * Remove a position change listener
	 * @param {Function} callback - The callback to remove
	 */
	FunkyNav.prototype.removePositionListener = function(callback) {
		var index = this.changeListeners.indexOf(callback);
		if (index > -1) {
			this.changeListeners.splice(index, 1);
		}
	};

	// ============================================
	// PUBLIC API - Utility Methods
	// ============================================

	/**
	 * Check if sidebar is collapsed
	 * @returns {boolean}
	 */
	FunkyNav.prototype.isSidebarCollapsed = function() {
		return this.sidebar && this.sidebar.classList.contains('collapsed');
	};

	/**
	 * Get the CSS class for modal slide panels based on current direction
	 * @returns {string} CSS class name (e.g., 'modal-slide-left')
	 */
	FunkyNav.prototype.getModalSlideClass = function() {
		var direction = this.getModalSlideDirection();
		return 'modal-slide-' + direction;
	};

	// ============================================
	// USER MENU DROPDOWN
	// ============================================

	/**
	 * Initialize user menu dropdown
	 */
	FunkyNav.prototype.initUserMenu = function() {
		var self = this;
		var trigger = document.getElementById('userMenuTrigger');
		var dropdown = document.getElementById('userMenuDropdown');
		var logoutBtn = document.getElementById('userMenuLogout');

		if (!trigger || !dropdown) {
			return;
		}

		// Store references
		this.userMenuTrigger = trigger;
		this.userMenuDropdown = dropdown;

		// Store cleanups for user menu listeners
		this._userMenuCleanups = this._userMenuCleanups || [];

		// Toggle dropdown on trigger click
		var triggerClickHandler = function(e) {
			e.stopPropagation();
			self.toggleUserMenu();
		};
		trigger.addEventListener('click', triggerClickHandler);
		this._userMenuCleanups.push(function() {
			trigger.removeEventListener('click', triggerClickHandler);
		});

		// Handle SPA links inside dropdown - close menu and let SPA handle navigation
		dropdown.querySelectorAll('[data-spa-link]').forEach(function(link) {
			var linkHandler = function(e) {
				self.closeUserMenu();
				// Don't prevent default or stop propagation - let SPA's document handler work
			};
			link.addEventListener('click', linkHandler);
			self._userMenuCleanups.push(function() {
				link.removeEventListener('click', linkHandler);
			});
		});

		// Handle logout with confirmation
		if (logoutBtn) {
			var logoutHandler = function(e) {
				e.preventDefault();
				self.closeUserMenu();
				if (confirm('Are you sure you want to logout?')) {
					window.location.href = '/auth/logout';
				}
			};
			logoutBtn.addEventListener('click', logoutHandler);
			this._userMenuCleanups.push(function() {
				logoutBtn.removeEventListener('click', logoutHandler);
			});
		}

		// Close on outside click
		var outsideClickHandler = function(e) {
			if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
				self.closeUserMenu();
			}
		};
		document.addEventListener('click', outsideClickHandler);
		this._userMenuCleanups.push(function() {
			document.removeEventListener('click', outsideClickHandler);
		});

		// Close on Escape key - use Funky.Keyboard if available
		if (Funky.Keyboard) {
			var userMenuEscapeUnregister = Funky.Keyboard.register({
				key: 'escape',
				scope: 'global',
				handler: function() {
					self.closeUserMenu();
				},
				description: 'Close user menu',
				group: 'Navigation',
				priority: 5 // Higher priority than general nav escape
			});
			this._userMenuCleanups.push(userMenuEscapeUnregister);
		} else {
			var escapeHandler = function(e) {
				if (e.key === 'Escape') {
					self.closeUserMenu();
				}
			};
			document.addEventListener('keydown', escapeHandler);
			this._userMenuCleanups.push(function() {
				document.removeEventListener('keydown', escapeHandler);
			});
		}

		console.log('[FunkyNav] User menu initialized');
	};

	/**
	 * Toggle user menu dropdown
	 */
	FunkyNav.prototype.toggleUserMenu = function() {
		if (this.userMenuDropdown && this.userMenuDropdown.classList.contains('active')) {
			this.closeUserMenu();
		} else {
			this.openUserMenu();
		}
	};

	/**
	 * Open user menu dropdown
	 */
	FunkyNav.prototype.openUserMenu = function() {
		if (this.userMenuTrigger && this.userMenuDropdown) {
			this.userMenuTrigger.classList.add('active');
			this.userMenuTrigger.setAttribute('aria-expanded', 'true');
			this.userMenuDropdown.classList.add('active');
		}
	};

	/**
	 * Close user menu dropdown
	 */
	FunkyNav.prototype.closeUserMenu = function() {
		if (this.userMenuTrigger && this.userMenuDropdown) {
			this.userMenuTrigger.classList.remove('active');
			this.userMenuTrigger.setAttribute('aria-expanded', 'false');
			this.userMenuDropdown.classList.remove('active');
		}
	};

	/**
	 * Destroy the navigation system and clean up
	 */
	FunkyNav.prototype.destroy = function() {
		document.removeEventListener('click', this._handleOutsideClick);
		// Cleanup keyboard handler
		if (this._keyboardUnregister) {
			this._keyboardUnregister();
			this._keyboardUnregister = null;
		}
		document.removeEventListener('keydown', this._handleEscapeKey);
		window.removeEventListener('resize', this._handleResize);

		// Clean up SPA mode listeners
		if (this._spaUnsubscribe) {
			this._spaUnsubscribe();
			this._spaUnsubscribe = null;
		}
		if (this._popstateHandler) {
			window.removeEventListener('popstate', this._popstateHandler);
			this._popstateHandler = null;
		}

		// Clean up user menu listeners
		if (this._userMenuCleanups) {
			this._userMenuCleanups.forEach(function(fn) {
				try { fn(); } catch (e) { /* ignore */ }
			});
			this._userMenuCleanups = [];
		}

		// Reset data-driven state
		this._items = null;
		this._config = null;
		this._itemsById = {};

		this.openDropdowns = [];
		this.changeListeners = [];
	};

	// ============================================
	// CONSTANTS EXPORT
	// ============================================

	FunkyNav.POSITIONS = POSITIONS;
	FunkyNav.SLIDE_DIRECTIONS = SLIDE_DIRECTIONS;

	// ============================================
	// GLOBAL EXPORT
	// ============================================

	// Create singleton instance
	var instance = new FunkyNav();

	// Also expose constructor for testing
	instance.constructor = FunkyNav;

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('NavPosition', instance);
	}

	// Auto-initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			instance.init();
			instance.initModalFullscreenToggles();
			instance.initUserMenu();

			// Watch for dynamically added modals
			document.addEventListener('funky.modal.shown', function(e) {
				var modal = e.target;
				if (modal && modal.classList.contains('modal-slide-panel')) {
					instance.initModalFullscreenToggles();
				}
			});

			// Reset fullscreen mode when modal is hidden
			document.addEventListener('funky.modal.hidden', function(e) {
				var modal = e.target;
				if (modal && modal.classList.contains('modal-fullscreen-mode')) {
					modal.classList.remove('modal-fullscreen-mode');
				}
			});
		});
	} else {
		// DOM already ready
		instance.init();
		instance.initModalFullscreenToggles();
		instance.initUserMenu();

		// Watch for dynamically added modals
		document.addEventListener('funky.modal.shown', function(e) {
			var modal = e.target;
			if (modal && modal.classList.contains('modal-slide-panel')) {
				instance.initModalFullscreenToggles();
			}
		});

		// Reset fullscreen mode when modal is hidden
		document.addEventListener('funky.modal.hidden', function(e) {
			var modal = e.target;
			if (modal && modal.classList.contains('modal-fullscreen-mode')) {
				modal.classList.remove('modal-fullscreen-mode');
			}
		});
	}

})(window);
