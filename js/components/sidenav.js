/**
 * Funky.SideNav - Searchable Sidebar Navigation Component
 * Supports flat or grouped items with selection, filtering, and keyboard navigation
 * Uses Funky.SelectableList for keyboard navigation and focus management
 * @module Funky.SideNav
 * @version 1.0.3
 */
(function(window) {
	'use strict';

	// Guard against double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('SideNav')) {
		return;
	}

	// Bindable Interface: Instance registry by container ID
	var _instances = Funky.Registry.createInstanceRegistry('SideNav');
	
	// Get SelectableList at runtime
	function getSelectableList() {
		return window.Funky && window.Funky.SelectableList;
	}

	/**
	 * SideNav Constructor
	 * @param {string|Element} selector - Container element or selector
	 * @param {Object} config - Configuration options
	 */
	function SideNav(selector, config) {
		this.container = typeof selector === 'string' 
			? document.querySelector(selector) 
			: selector;
		
		if (!this.container) {
			console.error('[SideNav] Container not found:', selector);
			return;
		}

		// Default configuration
		this.config = Object.assign({
			items: [],
			searchable: true,
			searchPlaceholder: 'Search...',
			collapsible: true,
			rememberState: false,
			selected: null,
			storageKey: 'funky_sidenav_state',
			// Sorting options
			sortable: false,
			sortOrder: 'asc',  // 'asc', 'desc', or 'none'
			sortKey: 'label',  // 'label' or 'id'
			// Mobile behavior
			closeOnSelect: false,  // Close sidenav after selecting an item (useful for mobile)
			// Fuzzy search options
			fuzzySearch: false,        // Enable fuzzy matching
			fuzzyThreshold: 0.3,       // Minimum score (0-1)
			fuzzyTokenize: false,      // Split query into tokens
			highlightMatches: true,    // Highlight matched text
			sortByScore: true,         // Sort results by match score
			// Recent searches options
			recentSearches: false,         // Enable recent searches feature
			recentSearchesKey: null,       // Storage key (auto-generated if not provided)
			maxRecentSearches: 5,          // Max recent searches to show
			recentSearchesLabel: 'Recent', // Label for recent section
			minSearchLength: 2             // Min chars before adding to recent
		}, config || {});

		// State
		this.selectedId = null;
		this.collapsedGroups = {};
		this.flatItems = [];
		this.currentSortOrder = this.config.sortOrder;
		
		// SelectableList instance for keyboard navigation (replaces focusedIndex)
		this._selectableList = null;
		this._listContainer = null;  // Hidden container for SelectableList
		
		// Filter state
		this.filterQuery = '';
		this.filterResults = new Map();  // id -> { score, matches }
		this.filteredOrder = null;       // Sorted indices when fuzzy active
		this._flatItemsById = {};        // id -> item lookup for original labels
		
		// Recent searches state
		this.recentHistory = null;       // Funky.History instance
		this._recentDropdown = null;     // Dropdown DOM element
		this._recentSelectedIndex = -1;  // Currently selected index for keyboard nav

		// DOM references
		this.elements = {
			search: null,
			list: null,
			sortToggle: null
		};

		// Cleanup functions for proper memory management
		this._cleanups = [];

		// Initialize
		this._init();
	}

	/**
	 * Initialize the component
	 */
	SideNav.prototype._init = function() {
		// Load persisted state
		if (this.config.rememberState) {
			this._loadState();
		}

		// Initialize recent searches
		this._initRecentSearches();

		// Render
		this._render();

		// Build flat items list for keyboard nav
		this._buildFlatItems();
		
		// Initialize SelectableList for keyboard navigation
		this._initSelectableList();

		// Set up event listeners
		this._setupEventListeners();

		// Set up PubSub listeners for external control
		this._setupPubSubListeners();

		// Set initial selection
		if (this.config.selected) {
			this.select(this.config.selected, true);
		}

		// Bindable Interface: Register by container ID or nav ID
		var containerId = this.container.id || this.config.id;
		if (containerId) {
			this._containerId = containerId;
			_instances.register(containerId, this);
		}

		console.log('[SideNav] Initialized with', this.config.items.length, 'items');
	};

	/**
	 * Sort items by configured key and order
	 */
	SideNav.prototype._getSortedItems = function(items) {
		var self = this;
		if (!this.config.sortable || this.currentSortOrder === 'none') {
			return items;
		}
		
		var sortKey = this.config.sortKey || 'label';
		var order = this.currentSortOrder === 'desc' ? -1 : 1;
		
		// Create a shallow copy to avoid mutating original
		var sorted = items.slice().sort(function(a, b) {
			var aVal = (a[sortKey] || '').toString().toLowerCase();
			var bVal = (b[sortKey] || '').toString().toLowerCase();
			if (aVal < bVal) return -1 * order;
			if (aVal > bVal) return 1 * order;
			return 0;
		});
		
		// Recursively sort children
		return sorted.map(function(item) {
			if (item.children && item.children.length > 0) {
				return Object.assign({}, item, {
					children: self._getSortedItems(item.children)
				});
			}
			return item;
		});
	};

	/**
	 * Toggle sort order
	 */
	SideNav.prototype.toggleSort = function() {
		if (this.currentSortOrder === 'asc') {
			this.currentSortOrder = 'desc';
		} else {
			this.currentSortOrder = 'asc';
		}
		
		// Update toggle button state
		this._updateSortToggle();
		
		// Re-render items
		this._rerenderItems();
		
		// Fire callback
		if (typeof this.config.onSort === 'function') {
			this.config.onSort(this.currentSortOrder);
		}
	};

	/**
	 * Update sort toggle button appearance
	 */
	SideNav.prototype._updateSortToggle = function() {
		if (!this.elements.sortToggle) return;

		var icon = this.elements.sortToggle.querySelector('i');
		if (icon) {
			icon.className = 'fas fa-sort-alpha-' + (this.currentSortOrder === 'desc' ? 'up-alt' : 'down');
		}
		var sortTitle = 'Sort ' + (this.currentSortOrder === 'desc' ? 'A-Z' : 'Z-A');
		this.elements.sortToggle.setAttribute('title', sortTitle);
		this.elements.sortToggle.setAttribute('aria-label', sortTitle);
	};

	/**
	 * Re-render just the items list
	 */
	SideNav.prototype._rerenderItems = function() {
		if (!this.elements.list) return;
		
		var D = Funky.Dom;
		var sortedItems = this._getSortedItems(this.config.items);
		
		// Clear and rebuild list
		this.elements.list.innerHTML = '';
		var items = this._renderItems(sortedItems);
		items.forEach(function(wrapper) {
			if (wrapper && wrapper.el) {
				this.elements.list.appendChild(wrapper.el);
			}
		}, this);
		
		// Rebuild flat items for keyboard nav
		this._buildFlatItems();
		
		// Sync SelectableList with new sorted items
		if (this._selectableList) {
			this._updateSelectableListItems(this.flatItems);
		}
		
		// Restore selection state
		if (this.selectedId) {
			var activeItem = this.elements.list.querySelector('[data-id="' + this.selectedId + '"]');
			if (activeItem) {
				activeItem.classList.add('active');
				activeItem.setAttribute('aria-current', 'page');
			}
		}
	};

	/**
	 * Render the component
	 */
	SideNav.prototype._render = function() {
		var self = this;
		var D = Funky.Dom;
		var sortedItems = this._getSortedItems(this.config.items);

		// Generate unique ID for search input
		var searchId = 'sidenav-search-' + (this.container.id || Date.now());

		// Build header if search or sort enabled
		var header = null;
		if (this.config.searchable || this.config.sortable) {
			var sortIcon = this.currentSortOrder === 'desc' ? 'fa-sort-alpha-up-alt' : 'fa-sort-alpha-down';
			var sortTitle = 'Sort ' + (this.currentSortOrder === 'desc' ? 'A-Z' : 'Z-A');

			header = D.div().class('sidenav-header').child(
				// Search input with role and label
				this.config.searchable && D.div()
					.class('sidenav-search-wrapper')
					.attr('role', 'search')
					.child(
						D.create('label')
							.class('visually-hidden')
							.attr('for', searchId)
							.text('Search navigation'),
						D.create('input')
							.attr('id', searchId)
							.attr('type', 'search')
							.class('sidenav-search')
							.attr('placeholder', this.config.searchPlaceholder),
						D.icon('fas fa-search sidenav-search-icon')
					),
				// Sort toggle with aria-label
				this.config.sortable && D.button()
					.attr('type', 'button')
					.class('sidenav-sort-toggle')
					.attr('title', sortTitle)
					.aria('label', sortTitle)
					.child(D.icon('fas ' + sortIcon))
			);
		}

		// Build full structure wrapped in nav element
		var nav = D.create('nav')
			.aria('label', this.config.ariaLabel || 'Sidebar navigation')
			.child(
				header,
				D.ul().class('sidenav-list').attr('role', 'tree').child(
					this._renderItems(sortedItems)
				)
			);

		this.container.innerHTML = '';
		this.container.appendChild(nav.get());
		this.container.classList.add('funky-sidenav');

		// Set ARIA role on container for accessibility
		this.container.setAttribute('role', 'navigation');

		// Don't add tabindex="0" to container - let focus go directly to search input
		// Keyboard shortcuts use element scope (#containerId) which works when any child is focused

		// Cache element references
		this.elements.search = this.container.querySelector('.sidenav-search');
		this.elements.list = this.container.querySelector('.sidenav-list');
		this.elements.sortToggle = this.container.querySelector('.sidenav-sort-toggle');
	};

	/**
	 * Render items (recursive for groups)
	 * @returns {Array} Array of ElementWrappers
	 */
	SideNav.prototype._renderItems = function(items, isNested) {
		var self = this;
		var D = Funky.Dom;

		return items.map(function(item) {
			if (item.children && item.children.length > 0) {
				// Group item
				var isCollapsed = self.collapsedGroups[item.id] === true;
				var contentId = 'sidenav-group-items-' + item.id;

				return D.li()
					.class(D.classes('sidenav-group', isCollapsed && 'collapsed'))
					.attr('role', 'treeitem')
					.data('group', item.id)
					.child(
						D.button()
							.attr('type', 'button')
							.class('sidenav-group-header')
							.aria('expanded', String(!isCollapsed))
							.aria('controls', contentId)
							.child(
								item.icon && D.span().class('sidenav-icon').child(
									D.icon('fas ' + item.icon)
								),
								D.span().class('sidenav-label').text(item.label),
								item.badge !== undefined && D.span().class('sidenav-badge').child(
									D.span().class('visually-hidden').text('Count: '),
									D.text(String(item.badge))
								),
								D.span().class('sidenav-chevron').child(
									D.icon('fas fa-chevron-down')
								)
							),
						D.ul()
							.attr('id', contentId)
							.class('sidenav-group-items')
							.attr('role', 'group')
							.child(self._renderItems(item.children, true))
					);
			} else {
				// Regular item
				return D.li()
					.class('sidenav-item')
					.attr('role', 'treeitem')
					.attr('tabindex', '-1')
					.data('id', item.id)
					.child(
						item.icon && D.span().class('sidenav-icon').child(
							D.icon('fas ' + item.icon)
						),
						D.span().class('sidenav-label').text(item.label),
						item.badge !== undefined && D.span().class('sidenav-badge').child(
							D.span().class('visually-hidden').text('Count: '),
							D.text(String(item.badge))
						)
					);
			}
		});
	};

	/**
	 * Build flat list of selectable items for keyboard navigation
	 */
	SideNav.prototype._buildFlatItems = function() {
		this.flatItems = [];
		this._flatItemsById = {};
		var self = this;

		function traverse(items) {
			items.forEach(function(item) {
				if (item.children && item.children.length > 0) {
					traverse(item.children);
				} else {
					self.flatItems.push(item);
					if (item.id) {
						self._flatItemsById[item.id] = item;
					}
				}
			});
		}

		// Use sorted items so keyboard navigation matches visual order
		var sortedItems = this._getSortedItems(this.config.items);
		traverse(sortedItems);
	};
	
	/**
	 * Initialize SelectableList for keyboard navigation and focus management
	 * SelectableList manages state; we sync focus to visible DOM elements
	 */
	SideNav.prototype._initSelectableList = function() {
		var self = this;
		var SL = getSelectableList();

		if (!SL || typeof SL.init !== 'function') {
			console.warn('[SideNav] Funky.SelectableList not available or invalid, using legacy keyboard navigation');
			this._useFallbackKeyboard = true;
			return;
		}
		
		// Create hidden container for SelectableList (it manages state, not rendering)
		this._listContainer = document.createElement('div');
		this._listContainer.className = 'sidenav-list-state';
		this._listContainer.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
		this._listContainer.setAttribute('aria-hidden', 'true');
		// Prevent Tab from entering hidden container (SelectableList adds tabindex="0" to its wrapper)
		this._listContainer.setAttribute('inert', '');
		this.container.appendChild(this._listContainer);
		
		console.log('[SideNav] Initializing SelectableList with', this.flatItems.length, 'items');

		// Initialize SelectableList with flat items
		this._selectableList = SL.init(this._listContainer, {
			items: this.flatItems,
			selectable: 'single',
			keyboard: false,           // We forward keyboard events from search input
			typeAhead: false,          // Search is handled by our filter
			wrapAround: true,
			showInstructions: false,
			announceOnFocus: false,    // We handle our own ARIA
			ariaLabel: 'Navigation items',

			getItemKey: function(item) {
				return item.id;
			},

			// Minimal rendering since this is hidden
			renderItem: function(item) {
				return '<span>' + self._escapeHtml(item.label) + '</span>';
			},

			// When focus changes in SelectableList, update visible DOM
			onFocus: function(item, index) {
				console.log('[SideNav] SelectableList onFocus callback:', item, index);
				self._syncFocusToDOM(item);
			},

			// When item is activated (Enter/click in SelectableList)
			onActivate: function(item) {
				console.log('[SideNav] SelectableList onActivate callback:', item);
				self.select(item.id);
			}
		});

		console.log('[SideNav] SelectableList initialized:', !!this._selectableList);
	};
	
	/**
	 * Sync SelectableList focus state to visible DOM elements
	 */
	SideNav.prototype._syncFocusToDOM = function(item) {
		console.log('[SideNav] _syncFocusToDOM called with item:', item);
		if (!item) return;

		// Remove focused class from all items
		var focusedItems = this.elements.list.querySelectorAll('.sidenav-item.focused');
		focusedItems.forEach(function(el) {
			el.classList.remove('focused');
		});

		// Add focused class to matching item
		var targetItem = this.elements.list.querySelector('.sidenav-item[data-id="' + item.id + '"]');
		console.log('[SideNav] Found target item:', !!targetItem, 'for id:', item.id);
		if (targetItem) {
			targetItem.classList.add('focused');
			targetItem.scrollIntoView({ block: 'nearest', behavior: 'auto' });
		}
	};
	
	/**
	 * Update SelectableList items when filter changes
	 */
	SideNav.prototype._updateSelectableListItems = function(filteredItems) {
		if (this._selectableList) {
			this._selectableList.setItems(filteredItems || this.flatItems);
		}
	};

	/**
	 * Set up event listeners
	 */
	SideNav.prototype._setupEventListeners = function() {
		var self = this;

		// Item click
		this.elements.list.addEventListener('click', function(e) {
			var item = e.target.closest('.sidenav-item');
			if (item) {
				self.select(item.dataset.id);
				return;
			}

			var groupHeader = e.target.closest('.sidenav-group-header');
			if (groupHeader && self.config.collapsible) {
				var group = groupHeader.closest('.sidenav-group');
				self.toggleGroup(group.dataset.group);
			}
		});

		// Search input
		if (this.elements.search) {
			this.elements.search.addEventListener('input', function(e) {
				self.filter(e.target.value);
			});

			this.elements.search.addEventListener('keydown', function(e) {
				self._handleSearchKeydown(e);
			});
			
			// Recent searches event handlers
			if (this.config.recentSearches) {
				var recentTimer = null;
				
				// Show dropdown on focus when empty
				this.elements.search.addEventListener('focus', function() {
					if (!this.value.trim()) {
						self._showRecentDropdown();
					}
				});
				
				// Hide dropdown on blur (with delay for click)
				this.elements.search.addEventListener('blur', function() {
					setTimeout(function() {
						self._hideRecentDropdown();
					}, 200);
				});
				
				// Keyboard navigation for recent dropdown
				this.elements.search.addEventListener('keydown', function(e) {
					if (!self._recentDropdown || !self._recentDropdown.el) return;

					var items = self._recentDropdown.el.querySelectorAll('.sidenav-recent-item');
					var itemCount = items.length;
					
					if (e.key === 'ArrowDown') {
						e.preventDefault();
						self._recentSelectedIndex = Math.min(self._recentSelectedIndex + 1, itemCount - 1);
						self._updateRecentSelection();
					} else if (e.key === 'ArrowUp') {
						e.preventDefault();
						self._recentSelectedIndex = Math.max(self._recentSelectedIndex - 1, -1);
						self._updateRecentSelection();
					} else if (e.key === 'Enter' && self._recentSelectedIndex >= 0) {
						e.preventDefault();
						var query = items[self._recentSelectedIndex].getAttribute('data-recent-query');
						if (query) {
							self._applyRecentSearch(query);
						}
					} else if (e.key === 'Escape') {
						e.preventDefault();
						self._hideRecentDropdown();
						self.elements.search.focus();
					} else if (e.key === 'Tab') {
						self._hideRecentDropdown();
					}
				});
				
				// Add to recent after typing pause
				this.elements.search.addEventListener('input', function() {
					clearTimeout(recentTimer);
					var query = this.value.trim();
					
					if (query) {
						self._hideRecentDropdown();
						recentTimer = setTimeout(function() {
							self._addToRecentSearches(query);
						}, 1000); // Add after 1s pause
					} else {
						self._showRecentDropdown();
					}
				});
			}
		}

		// Sort toggle
		if (this.elements.sortToggle) {
			this.elements.sortToggle.addEventListener('click', function(e) {
				e.preventDefault();
				self.toggleSort();
			});
		}

		// Toggle button (for mobile/responsive)
		if (this.config.toggleSelector) {
			var toggleBtn = document.querySelector(this.config.toggleSelector);
			if (toggleBtn) {
				var toggleHandler = function(e) {
					e.preventDefault();
					self.toggle();
				};
				toggleBtn.addEventListener('click', toggleHandler);
				this._cleanups.push(function() {
					toggleBtn.removeEventListener('click', toggleHandler);
				});
			}
		}

		// Close on click outside
		if (this.config.closeOnClickOutside) {
			var outsideClickHandler = function(e) {
				if (self.isOpen && !self.container.contains(e.target)) {
					var toggleBtn = self.config.toggleSelector ?
						document.querySelector(self.config.toggleSelector) : null;
					if (!toggleBtn || !toggleBtn.contains(e.target)) {
						self.close();
					}
				}
			};
			document.addEventListener('click', outsideClickHandler);
			this._cleanups.push(function() {
				document.removeEventListener('click', outsideClickHandler);
			});
		}

		// Keyboard navigation and shortcuts - use Funky.Keyboard if available
		this._registerKeyboardShortcuts();

		if (this._useFallbackKeyboard) {
			this.container.addEventListener('keydown', function(e) {
				self._handleKeydown(e);
			});
		}
	};

	/**
	 * Set up PubSub listeners for external control
	 */
	SideNav.prototype._setupPubSubListeners = function() {
		var self = this;

		// Store unsubscribe functions for cleanup
		this._pubsubUnsubscribes = [];

		if (Funky.PubSub) {
			// Listen for navigation commands
			this._pubsubUnsubscribes.push(
				Funky.PubSub.on('funky:sidenav:navigate', function(data) {
					if (data && data.id) {
						self.select(data.id);
					}
				})
			);
		}
	};
	
	/**
	 * Register keyboard shortcuts with Funky.Keyboard
	 */
	SideNav.prototype._registerKeyboardShortcuts = function() {
		var self = this;
		var scope = this.container.id ? '#' + this.container.id : 'global';

		console.log('[SideNav] Registering keyboard shortcuts with scope:', scope);

		// Check if Funky.Keyboard is available
		if (typeof Funky === 'undefined' || !Funky.Keyboard) {
			console.warn('[SideNav] Funky.Keyboard not available, using fallback');
			this._useFallbackKeyboard = true;
			// Fallback: add document-level Escape handler for closing sidenav
			var escapeHandler = function(e) {
				if (e.key === 'Escape' && self.isOpen) {
					self.close();
				}
			};
			document.addEventListener('keydown', escapeHandler);
			this._cleanups.push(function() {
				document.removeEventListener('keydown', escapeHandler);
			});
			return;
		}

		this._keyboardUnregisters = [];

		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'down',
				scope: scope,
				allowInInput: true,
				handler: function() {
					if (self._selectableList) {
						self._selectableList.navigateBy(1);
					} else {
						var visibleItems = self._getVisibleItems();
						if (visibleItems.length === 0) return;
						self._moveFocus(1, visibleItems);
					}
				},
				description: 'Move focus down',
				group: 'Navigation'
			}),

			Funky.Keyboard.register({
				key: 'up',
				scope: scope,
				allowInInput: true,
				handler: function() {
					if (self._selectableList) {
						self._selectableList.navigateBy(-1);
					} else {
						var visibleItems = self._getVisibleItems();
						if (visibleItems.length === 0) return;
						self._moveFocus(-1, visibleItems);
					}
				},
				description: 'Move focus up',
				group: 'Navigation'
			}),

			Funky.Keyboard.register({
				key: 'enter',
				scope: scope,
				allowInInput: true,
				handler: function() {
					if (self._selectableList) {
						var focused = self._selectableList.getFocused();
						if (focused) {
							self.select(focused.id, false, true);  // keyboard=true
						}
					} else {
						var visibleItems = self._getVisibleItems();
						var focusedIndex = self._getLegacyFocusedIndex();
						if (focusedIndex >= 0 && visibleItems[focusedIndex]) {
							self.select(visibleItems[focusedIndex].dataset.id, false, true);  // keyboard=true
						}
					}
				},
				description: 'Select item',
				group: 'Navigation'
			}),

			Funky.Keyboard.register({
				key: 'escape',
				scope: scope,
				allowInInput: true,
				handler: function() {
					if (self.elements.search) {
						self.elements.search.focus();
					}
				},
				description: 'Focus search',
				group: 'Navigation'
			}),

			// Close sidenav on Escape when open (uses sidenav scope pushed in open())
			Funky.Keyboard.register({
				key: 'escape',
				scope: 'sidenav',
				allowInInput: true,
				priority: 10, // Higher than Morph.to() internal handler (0)
				handler: function() {
					if (self.isOpen) {
						self.close();
					}
				},
				description: 'Close sidebar',
				group: 'Navigation'
			})
		);
	};

	/**
	 * Handle keydown in search input
	 * Note: ArrowDown, ArrowUp, Enter are handled by Funky.Keyboard shortcuts with allowInInput: true
	 * This only handles Escape for clearing/dismissing the search
	 */
	SideNav.prototype._handleSearchKeydown = function(e) {
		// Only handle Escape here - arrow keys and Enter handled by Funky.Keyboard shortcuts
		if (e.key === 'Escape') {
			e.preventDefault();
			// Use FocusManager for escape with clearValue
			if (Funky.FocusManager && Funky.FocusManager.completeInput) {
				Funky.FocusManager.completeInput({
					element: this.elements.search,
					clearValue: true,
					returnFocus: true
				});
			} else {
				this.elements.search.value = '';
				this.filter('');
				this.elements.search.blur();
			}
		}
	};

	/**
	 * Handle keyboard navigation (fallback when Funky.Keyboard not available)
	 */
	SideNav.prototype._handleKeydown = function(e) {
		// Only use fallback if SelectableList and Funky.Keyboard both unavailable
		if (!this._useFallbackKeyboard) return;
		
		// Use SelectableList if available
		if (this._selectableList) {
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					this._selectableList.navigateBy(1);
					break;
				case 'ArrowUp':
					e.preventDefault();
					this._selectableList.navigateBy(-1);
					break;
				case 'Enter':
					e.preventDefault();
					var focused = this._selectableList.getFocused();
					if (focused) {
						this.select(focused.id);
					}
					break;
				case 'Escape':
					if (this.elements.search) {
						this.elements.search.focus();
					}
					break;
			}
			return;
		}
		
		// Legacy fallback
		var visibleItems = this._getVisibleItems();
		if (visibleItems.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				this._moveFocus(1, visibleItems);
				break;
			case 'ArrowUp':
				e.preventDefault();
				this._moveFocus(-1, visibleItems);
				break;
			case 'Enter':
				e.preventDefault();
				var focusedIndex = this._getLegacyFocusedIndex();
				if (focusedIndex >= 0 && visibleItems[focusedIndex]) {
					this.select(visibleItems[focusedIndex].dataset.id);
				}
				break;
			case 'Escape':
				if (this.elements.search) {
					this.elements.search.focus();
				}
				break;
		}
	};

	/**
	 * Get visible (not hidden by filter) items
	 */
	SideNav.prototype._getVisibleItems = function() {
		return Array.from(this.elements.list.querySelectorAll('.sidenav-item:not([style*="display: none"])'));
	};
	
	/**
	 * Get legacy focused index from DOM (for fallback mode)
	 */
	SideNav.prototype._getLegacyFocusedIndex = function() {
		var visibleItems = this._getVisibleItems();
		for (var i = 0; i < visibleItems.length; i++) {
			if (visibleItems[i].classList.contains('focused')) {
				return i;
			}
		}
		return -1;
	};

	/**
	 * Move focus up or down (legacy fallback)
	 */
	SideNav.prototype._moveFocus = function(direction, visibleItems) {
		var focusedIndex = this._getLegacyFocusedIndex();
		
		// Remove current focus
		visibleItems.forEach(function(item) {
			item.classList.remove('focused');
		});

		// Calculate new index
		focusedIndex += direction;
		if (focusedIndex < 0) focusedIndex = visibleItems.length - 1;
		if (focusedIndex >= visibleItems.length) focusedIndex = 0;

		// Apply focus
		if (visibleItems[focusedIndex]) {
			visibleItems[focusedIndex].classList.add('focused');
			visibleItems[focusedIndex].scrollIntoView({ block: 'nearest' });
		}
	};

	/**
	 * Focus first visible item (legacy fallback)
	 */
	SideNav.prototype._focusFirstItem = function() {
		// Remove any existing focus
		var existingFocused = this.elements.list.querySelectorAll('.sidenav-item.focused');
		existingFocused.forEach(function(item) {
			item.classList.remove('focused');
		});
		
		var visibleItems = this._getVisibleItems();
		if (visibleItems.length > 0) {
			visibleItems[0].classList.add('focused');
			visibleItems[0].scrollIntoView({ block: 'nearest' });
		}
	};

	/**
	 * Select an item by ID
	 * @param {string} id - Item ID to select
	 * @param {boolean} silent - Don't trigger onChange callback
	 * @param {boolean} keyboard - Selection was triggered by keyboard (Enter key)
	 */
	SideNav.prototype.select = function(id, silent, keyboard) {
		var self = this;

		// Remove previous selection and aria-current
		this.elements.list.querySelectorAll('.sidenav-item.active').forEach(function(item) {
			item.classList.remove('active');
			item.removeAttribute('aria-current');
		});

		// Remove any focused class to avoid dual highlighting
		this.elements.list.querySelectorAll('.sidenav-item.focused').forEach(function(item) {
			item.classList.remove('focused');
		});

		// Find and select new item
		var itemEl = this.elements.list.querySelector('.sidenav-item[data-id="' + id + '"]');
		if (itemEl) {
			itemEl.classList.add('active');
			itemEl.setAttribute('aria-current', 'page');
			this.selectedId = id;

			// Move browser focus to the selected item
			itemEl.focus();

			// Sync SelectableList focus to match selected item
			if (this._selectableList) {
				var items = this._selectableList.getItems();
				for (var i = 0; i < items.length; i++) {
					if (items[i].id === id) {
						this._selectableList.setFocusedIndex(i);
						break;
					}
				}
			}

			// Expand parent group if collapsed
			var parentGroup = itemEl.closest('.sidenav-group');
			if (parentGroup && parentGroup.classList.contains('collapsed')) {
				this.expand(parentGroup.dataset.group);
			}

			// Persist state
			if (this.config.rememberState) {
				this._saveState();
			}

			// Find item data and include keyboard flag
			var itemData = this._findItem(id);
			if (itemData) {
				itemData._keyboard = !!keyboard;
			}

			// Emit PubSub event
			if (!silent && Funky.PubSub) {
				Funky.PubSub.emit('funky:sidenav:select', {
					id: id,
					item: itemData,
					sidenav: this,
					keyboard: !!keyboard
				});
			}

			// Trigger callback
			if (!silent && this.config.onChange) {
				this.config.onChange(itemData);
			}

			// Close sidenav after selection if configured (useful for mobile)
			if (this.config.closeOnSelect && this.isOpen) {
				this.close();
			}
		}

		return this;
	};

	/**
	 * Get currently selected item
	 * @returns {Object|null} Selected item data
	 */
	SideNav.prototype.getSelected = function() {
		return this._findItem(this.selectedId);
	};

	/**
	 * Get item DOM element by ID
	 * @param {string} id - Item ID
	 * @returns {HTMLElement|null} Item element or null
	 */
	SideNav.prototype.getItem = function(id) {
		if (!this.elements.list) return null;
		return this.elements.list.querySelector('.sidenav-item[data-id="' + id + '"]');
	};

	/**
	 * Find item by ID in nested structure
	 */
	SideNav.prototype._findItem = function(id) {
		function search(items) {
			for (var i = 0; i < items.length; i++) {
				if (items[i].id === id) return items[i];
				if (items[i].children) {
					var found = search(items[i].children);
					if (found) return found;
				}
			}
			return null;
		}
		return search(this.config.items);
	};

	// ==========================================================================
	// RECENT SEARCHES
	// ==========================================================================

	/**
	 * Initialize recent searches history
	 * @private
	 */
	SideNav.prototype._initRecentSearches = function() {
		if (!this.config.recentSearches) return;

		var key = this.config.recentSearchesKey ||
					'sidenav_recent_' + (this.container.id || 'default');

		this.recentHistory = Funky.History.create({
			key: key,
			maxItems: this.config.maxRecentSearches || 5,
			persist: true
		});
	};

	/**
	 * Add current search query to recent
	 * @private
	 */
	SideNav.prototype._addToRecentSearches = function(query) {
		if (!this.recentHistory) return;
		if (!query || typeof query !== 'string') return;
		
		var trimmed = query.trim();
		if (trimmed.length < (this.config.minSearchLength || 2)) return;
		
		this.recentHistory.add(trimmed);
	};

	/**
	 * Get recent searches
	 * @returns {Array<string>}
	 */
	SideNav.prototype.getRecentSearches = function() {
		if (!this.recentHistory) return [];
		return this.recentHistory.getAll();
	};

	/**
	 * Clear recent searches
	 */
	SideNav.prototype.clearRecentSearches = function() {
		if (this.recentHistory) {
			this.recentHistory.clear();
			this._hideRecentDropdown();
		}
	};

	/**
	 * Show recent searches dropdown
	 * @private
	 */
	SideNav.prototype._showRecentDropdown = function() {
		if (!this.recentHistory || this.recentHistory.isEmpty()) return;
		
		var D = Funky.Dom;
		var self = this;
		var recent = this.recentHistory.getAll();
		
		// Remove existing dropdown
		this._hideRecentDropdown();
		
		// Reset selection
		this._recentSelectedIndex = -1;
		
		// Create dropdown with ARIA attributes
		var dropdownId = 'sidenav-recent-' + (this.container.id || 'default');
		var dropdown = D.create('div')
			.classAdd('sidenav-recent-dropdown')
			.attr('id', dropdownId)
			.attr('role', 'listbox')
			.aria('label', this.config.recentSearchesLabel || 'Recent searches');
		
		// Update search input ARIA to reference dropdown
		if (this.elements.search) {
			this.elements.search.setAttribute('aria-controls', dropdownId);
			this.elements.search.setAttribute('aria-expanded', 'true');
			this.elements.search.setAttribute('aria-haspopup', 'listbox');
		}
		
		// Header with clear button
		D.create('div')
			.classAdd('sidenav-recent-header')
			.child(
				D.create('span').attr('id', dropdownId + '-label').text(this.config.recentSearchesLabel || 'Recent'),
				D.create('button')
					.classAdd('sidenav-recent-clear')
					.attr('type', 'button')
					.aria('label', 'Clear all recent searches')
					.attr('title', 'Clear recent searches')
					.child(D.create('i').classAdd('fas', 'fa-times'))
					.on('click', function(e) {
						e.stopPropagation();
						self._announceToScreenReader('Recent searches cleared');
						self.clearRecentSearches();
					})
			)
			.appendTo(dropdown);
		
		// Recent items with ARIA roles
		recent.forEach(function(query, index) {
			var itemId = dropdownId + '-item-' + index;
			D.create('div')
				.classAdd('sidenav-recent-item')
				.attr('id', itemId)
				.attr('role', 'option')
				.attr('tabindex', '-1')
				.aria('selected', 'false')
				.data('recent-query', query)
				.data('index', index)
				.child(
					D.create('i').classAdd('fas', 'fa-history').aria('hidden', 'true'),
					D.create('span').text(query)
				)
				.on('click', function() {
					self._applyRecentSearch(query);
				})
				.appendTo(dropdown);
		});
		
		// Position and show - find search wrapper
		var searchWrapper = this.elements.search ? this.elements.search.closest('.sidenav-search-wrapper') : null;
		if (searchWrapper) {
			dropdown.appendTo(searchWrapper);
		} else if (this.elements.search) {
			dropdown.appendTo(this.elements.search.parentElement);
		}
		
		this._recentDropdown = dropdown;
	};

	/**
	 * Update visual selection in dropdown
	 * @private
	 */
	SideNav.prototype._updateRecentSelection = function() {
		if (!this._recentDropdown) return;
		
		var self = this;
		if (!this._recentDropdown || !this._recentDropdown.el) return;
		var items = this._recentDropdown.el.querySelectorAll('.sidenav-recent-item');
		var activeDescendant = null;
		
		items.forEach(function(item, index) {
			if (index === self._recentSelectedIndex) {
				item.classList.add('sidenav-recent-item--selected');
				item.setAttribute('aria-selected', 'true');
				activeDescendant = item.id;
				// Scroll into view if needed
				item.scrollIntoView({ block: 'nearest' });
			} else {
				item.classList.remove('sidenav-recent-item--selected');
				item.setAttribute('aria-selected', 'false');
			}
		});
		
		// Update activedescendant on search input
		if (this.elements.search && activeDescendant) {
			this.elements.search.setAttribute('aria-activedescendant', activeDescendant);
		}
	};

	/**
	 * Announce message to screen readers
	 * @private
	 */
	SideNav.prototype._announceToScreenReader = function(message) {
		var D = Funky.Dom;
		var announcer = D.one('#sidenav-sr-announcer');
		
		if (!announcer) {
			announcer = D.create('div')
				.attr('id', 'sidenav-sr-announcer')
				.classAdd('visually-hidden')
				.aria('live', 'polite')
				.aria('atomic', 'true')
				.appendTo(document.body);
		}
		
		announcer.text(message);
	};

	/**
	 * Hide recent searches dropdown
	 * @private
	 */
	SideNav.prototype._hideRecentDropdown = function() {
		if (this._recentDropdown) {
			this._recentDropdown.remove();
			this._recentDropdown = null;
			this._recentSelectedIndex = -1;
			
			// Update ARIA on search input
			if (this.elements.search) {
				this.elements.search.setAttribute('aria-expanded', 'false');
				this.elements.search.removeAttribute('aria-activedescendant');
			}
		}
	};

	/**
	 * Apply a recent search query
	 * @private
	 */
	SideNav.prototype._applyRecentSearch = function(query) {
		if (this.elements.search) {
			this.elements.search.value = query;
			this.filter(query);
		}
		this._hideRecentDropdown();
	};

	/**
	 * Filter items by search term
	 * @param {string} term - Search term
	 */
	SideNav.prototype.filter = function(term) {
		var self = this;
		var lowerTerm = (term || '').toLowerCase().trim();

		// Reset if empty
		if (!lowerTerm) {
			this.clearFilter();
			return this;
		}

		this.filterQuery = lowerTerm;
		this.filterResults.clear();
		this.filteredOrder = null;

		var useFuzzy = this.config.fuzzySearch && Funky.FuzzySearch;

		if (useFuzzy) {
			this._filterFuzzy(lowerTerm);
		} else {
			this._filterIndexOf(lowerTerm);
		}

		// Show/hide empty groups
		this.elements.list.querySelectorAll('.sidenav-group').forEach(function(group) {
			var hasVisibleItems = group.querySelectorAll('.sidenav-item:not([style*="display: none"])').length > 0;
			group.style.display = hasVisibleItems ? '' : 'none';
			
			// Expand groups when searching
			if (lowerTerm !== '' && hasVisibleItems) {
				group.classList.remove('collapsed');
			}
		});

		// Reset focus and sync SelectableList with visible items
		this.elements.list.querySelectorAll('.sidenav-item.focused').forEach(function(item) {
			item.classList.remove('focused');
		});

		// Update SelectableList with currently visible items in DOM order
		if (this._selectableList) {
			var flatItemsById = {};
			this.flatItems.forEach(function(item) {
				flatItemsById[item.id] = item;
			});
			
			// Build filtered items in DOM order (respects fuzzy score sorting)
			var filteredItems = [];
			this.elements.list.querySelectorAll('.sidenav-item:not([style*="display: none"])').forEach(function(el) {
				var id = el.dataset.id;
				if (flatItemsById[id]) {
					filteredItems.push(flatItemsById[id]);
				}
			});
			this._updateSelectableListItems(filteredItems);
		}

		// Trigger callback
		var visibleCount = this._getVisibleCount();
		if (this.config.onFilter) {
			this.config.onFilter(term, visibleCount);
		}

		return this;
	};

	/**
	 * Clear the filter
	 */
	SideNav.prototype.clearFilter = function() {
		if (!this.filterQuery && this.filterResults.size === 0) return this;

		var self = this;
		this.filterQuery = '';
		this.filterResults.clear();

		// Show all items and remove highlights
		this.elements.list.querySelectorAll('.sidenav-item').forEach(function(el) {
			el.style.display = '';
			
			// Remove highlights - restore original text using ID lookup
			var id = el.dataset.id;
			var labelEl = el.querySelector('.sidenav-label');
			var originalItem = self._flatItemsById[id];
			if (labelEl && originalItem) {
				labelEl.textContent = originalItem.label || '';
			}
		});

		// Show all groups
		this.elements.list.querySelectorAll('.sidenav-group').forEach(function(group) {
			group.style.display = '';
		});

		// Reset order if was sorted
		if (this.filteredOrder) {
			this._resetItemOrder();
			this.filteredOrder = null;
		}

		// Clear search input
		if (this.elements.search) {
			this.elements.search.value = '';
		}

		// Reset focus and restore SelectableList to full items
		this.elements.list.querySelectorAll('.sidenav-item.focused').forEach(function(item) {
			item.classList.remove('focused');
		});
		if (this._selectableList) {
			this._updateSelectableListItems(this.flatItems);
		}

		// Trigger callback
		if (this.config.onFilter) {
			this.config.onFilter('', this.flatItems.length);
		}

		return this;
	};

	/**
	 * Fuzzy filter using Funky.FuzzySearch
	 * @private
	 */
	SideNav.prototype._filterFuzzy = function(query) {
		var self = this;
		var config = this.config;
		var FuzzySearch = Funky.FuzzySearch;

		// Get all item elements
		var itemEls = this.elements.list.querySelectorAll('.sidenav-item');
		
		// Build searchable items array using ORIGINAL labels from flatItems
		var searchItems = [];
		itemEls.forEach(function(el, index) {
			var id = el.dataset.id;
			var originalItem = self._flatItemsById[id];
			var label = originalItem ? originalItem.label : '';
			searchItems.push({
				index: index,
				id: id,
				label: label,
				element: el
			});
		});

		// Perform fuzzy search
		var results = FuzzySearch.search(query, searchItems, {
			keys: ['label'],
			threshold: config.fuzzyThreshold,
			tokenize: config.fuzzyTokenize,
			limit: Infinity
		});

		// Build matched indices set
		var matchedIndices = new Set();
		var sortedIndices = [];

		results.forEach(function(result) {
			var index = result.item.index;
			var id = result.item.id;
			matchedIndices.add(index);
			sortedIndices.push(index);

			// Store result for highlighting by item ID
			self.filterResults.set(id, {
				score: result.score,
				matches: result.matches
			});
		});

		// Store sorted order if sorting enabled
		if (config.sortByScore) {
			this.filteredOrder = sortedIndices;
		}

		// Apply visibility and highlighting
		itemEls.forEach(function(el, index) {
			var matches = matchedIndices.has(index);
			el.style.display = matches ? '' : 'none';

			// Update highlight using item ID
			var id = el.dataset.id;
			if (matches && config.highlightMatches) {
				self._updateItemHighlight(el, id);
			} else {
				self._clearItemHighlight(el, id);
			}
		});

		// Reorder if sorting by score
		if (config.sortByScore && this.filteredOrder && this.filteredOrder.length > 0) {
			this._reorderItems();
		}
	};

	/**
	 * Legacy indexOf filter (backwards compatible)
	 * @private
	 */
	SideNav.prototype._filterIndexOf = function(query) {
		var self = this;
		var config = this.config;
		var itemEls = this.elements.list.querySelectorAll('.sidenav-item');

		itemEls.forEach(function(el, index) {
			var id = el.dataset.id;
			var originalItem = self._flatItemsById[id];
			var label = originalItem ? originalItem.label : '';
			var lowerLabel = label.toLowerCase();
			var matchIndex = lowerLabel.indexOf(query);
			var matches = matchIndex !== -1;

			if (matches) {
				// Store match position for highlighting by ID
				var positions = [[matchIndex, matchIndex + query.length - 1]];
				self.filterResults.set(id, {
					score: 1,
					matches: positions
				});

				if (config.highlightMatches) {
					self._updateItemHighlight(el, id);
				}
			}

			el.style.display = matches ? '' : 'none';
		});
	};

	/**
	 * Get count of visible items
	 * @private
	 */
	SideNav.prototype._getVisibleCount = function() {
		return this.elements.list.querySelectorAll('.sidenav-item:not([style*="display: none"])').length;
	};

	/**
	 * Update item label with highlight
	 * @param {Element} el - Item element
	 * @param {string} id - Item ID
	 * @private
	 */
	SideNav.prototype._updateItemHighlight = function(el, id) {
		var labelEl = el.querySelector('.sidenav-label');
		if (!labelEl) return;

		var result = this.filterResults.get(id);
		if (!result || !result.matches || result.matches.length === 0) {
			return;
		}

		// Use ORIGINAL label from flatItems, not current DOM text
		var originalItem = this._flatItemsById[id];
		var label = originalItem ? originalItem.label : labelEl.textContent;
		var highlighted = this._highlightMatches(label, result.matches);
		labelEl.innerHTML = highlighted;
	};

	/**
	 * Clear highlight from item label
	 * @param {Element} el - Item element
	 * @param {string} id - Item ID
	 * @private
	 */
	SideNav.prototype._clearItemHighlight = function(el, id) {
		var labelEl = el.querySelector('.sidenav-label');
		if (!labelEl) return;

		// Get original label from flatItemsById
		var originalItem = this._flatItemsById[id];
		if (originalItem) {
			labelEl.textContent = originalItem.label || '';
		}
	};

	/**
	 * Highlight matches in text
	 * @param {string} text - Original text
	 * @param {Array} matches - Array of [start, end] tuples
	 * @returns {string} HTML with highlights
	 * @private
	 */
	SideNav.prototype._highlightMatches = function(text, matches) {
		if (!text || !matches || !matches.length) {
			return this._escapeHtml(text);
		}

		// Use Funky.Highlight if available
		if (Funky.Highlight && Funky.Highlight.fromMatches) {
			return Funky.Highlight.fromMatches(text, matches, {
				className: 'sidenav__highlight'
			});
		}

		// Build set of highlighted indices
		var highlightSet = {};
		for (var i = 0; i < matches.length; i++) {
			var start = matches[i][0];
			var end = matches[i][1];
			for (var j = start; j <= end; j++) {
				highlightSet[j] = true;
			}
		}

		// Build output with highlights
		var result = '';
		var inHighlight = false;
		var self = this;

		for (var i = 0; i < text.length; i++) {
			var shouldHighlight = !!highlightSet[i];

			if (shouldHighlight && !inHighlight) {
				result += '<mark class="sidenav__highlight">';
				inHighlight = true;
			} else if (!shouldHighlight && inHighlight) {
				result += '</mark>';
				inHighlight = false;
			}

			result += self._escapeHtml(text.charAt(i));
		}

		if (inHighlight) {
			result += '</mark>';
		}

		return result;
	};

	/**
	 * Escape HTML characters
	 * @private
	 */
	SideNav.prototype._escapeHtml = function(text) {
		var div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	};

	/**
	 * Get highlighted label for an item
	 * @param {number} index - Item index
	 * @returns {string} HTML string
	 */
	SideNav.prototype.getHighlightedLabel = function(index) {
		var item = this.flatItems[index];
		var label = item ? (item.label || '') : '';

		if (!this.filterQuery || !this.config.highlightMatches) {
			return this._escapeHtml(label);
		}

		var result = this.filterResults.get(index);
		if (!result || !result.matches) {
			return this._escapeHtml(label);
		}

		return this._highlightMatches(label, result.matches);
	};

	/**
	 * Get filter score for an item
	 * @param {number} index - Item index
	 * @returns {number|null} Score 0-1 or null if not matched
	 */
	SideNav.prototype.getFilterScore = function(index) {
		var result = this.filterResults.get(index);
		return result ? result.score : null;
	};

	/**
	 * Reorder visible items by score
	 * @private
	 */
	SideNav.prototype._reorderItems = function() {
		if (!this.filteredOrder || !this.elements.list) return;

		var self = this;
		var itemEls = this.elements.list.querySelectorAll('.sidenav-item');

		// Create a fragment with items in sorted order
		this.filteredOrder.forEach(function(index) {
			var el = itemEls[index];
			if (el && el.style.display !== 'none') {
				el.parentNode.appendChild(el);
			}
		});
	};

	/**
	 * Reset item order to original
	 * @private
	 */
	SideNav.prototype._resetItemOrder = function() {
		// Re-render to restore original order
		this._rerenderItems();
	};

	/**
	 * Toggle group expand/collapse
	 */
	SideNav.prototype.toggleGroup = function(groupId) {
		var group = this.elements.list.querySelector('.sidenav-group[data-group="' + groupId + '"]');
		if (group) {
			if (group.classList.contains('collapsed')) {
				this.expand(groupId);
			} else {
				this.collapse(groupId);
			}
		}
		return this;
	};

	/**
	 * Expand a group
	 */
	SideNav.prototype.expand = function(groupId) {
		var group = this.elements.list.querySelector('.sidenav-group[data-group="' + groupId + '"]');
		if (group) {
			group.classList.remove('collapsed');
			this.collapsedGroups[groupId] = false;

			// Update aria-expanded
			var header = group.querySelector('.sidenav-group-header');
			if (header) {
				header.setAttribute('aria-expanded', 'true');
			}

			// Announce to screen readers
			if (Funky.Announce) {
				var label = group.querySelector('.sidenav-label');
				if (label) {
					Funky.Announce.polite(label.textContent + ' expanded');
				}
			}

			if (this.config.rememberState) {
				this._saveState();
			}

			if (this.config.onExpand) {
				this.config.onExpand(groupId);
			}
		}
		return this;
	};

	/**
	 * Collapse a group
	 */
	SideNav.prototype.collapse = function(groupId) {
		var group = this.elements.list.querySelector('.sidenav-group[data-group="' + groupId + '"]');
		if (group) {
			group.classList.add('collapsed');
			this.collapsedGroups[groupId] = true;

			// Update aria-expanded
			var header = group.querySelector('.sidenav-group-header');
			if (header) {
				header.setAttribute('aria-expanded', 'false');
			}

			// Announce to screen readers
			if (Funky.Announce) {
				var label = group.querySelector('.sidenav-label');
				if (label) {
					Funky.Announce.polite(label.textContent + ' collapsed');
				}
			}

			if (this.config.rememberState) {
				this._saveState();
			}

			if (this.config.onCollapse) {
				this.config.onCollapse(groupId);
			}
		}
		return this;
	};

	/**
	 * Expand all groups
	 */
	SideNav.prototype.expandAll = function() {
		var self = this;
		this.elements.list.querySelectorAll('.sidenav-group').forEach(function(group) {
			self.expand(group.dataset.group);
		});
		return this;
	};

	/**
	 * Collapse all groups
	 */
	SideNav.prototype.collapseAll = function() {
		var self = this;
		this.elements.list.querySelectorAll('.sidenav-group').forEach(function(group) {
			self.collapse(group.dataset.group);
		});
		return this;
	};

	/**
	 * Update items dynamically
	 */
	SideNav.prototype.setItems = function(items) {
		this.config.items = items;
		this._render();
		this._buildFlatItems();
		this._setupEventListeners();
		
		// Restore selection if still valid
		if (this.selectedId && this._findItem(this.selectedId)) {
			this.select(this.selectedId, true);
		}

		return this;
	};

	/**
	 * Load state from localStorage
	 */
	SideNav.prototype._loadState = function() {
		try {
			var state = localStorage.getItem(this.config.storageKey);
			if (state) {
				state = JSON.parse(state);
				this.collapsedGroups = state.collapsedGroups || {};
				if (state.selectedId && !this.config.selected) {
					this.config.selected = state.selectedId;
				}
			}
		} catch (e) {
			console.warn('[SideNav] Failed to load state:', e);
		}
	};

	/**
	 * Save state to localStorage
	 */
	SideNav.prototype._saveState = function() {
		try {
			localStorage.setItem(this.config.storageKey, JSON.stringify({
				selectedId: this.selectedId,
				collapsedGroups: this.collapsedGroups
			}));
		} catch (e) {
			console.warn('[SideNav] Failed to save state:', e);
		}
	};

	/**
	 * Open/show the sidenav (for mobile/toggle behavior)
	 */
	SideNav.prototype.open = function() {
		this.container.classList.add('open', 'show');
		this.isOpen = true;

		// Push sidenav scope for Escape handler
		if (Funky.Keyboard && Funky.Keyboard.pushScope) {
			Funky.Keyboard.pushScope('sidenav');
		}

		// Update toggle button if exists
		var toggle = this.config.toggleSelector ?
			document.querySelector(this.config.toggleSelector) : null;
		if (toggle) {
			toggle.setAttribute('aria-expanded', 'true');
		}

		// Emit event
		if (Funky.PubSub) {
			Funky.PubSub.emit('funky:sidenav:open', { sidenav: this });
		}

		return this;
	};

	/**
	 * Close/hide the sidenav (for mobile/toggle behavior)
	 */
	SideNav.prototype.close = function() {
		this.container.classList.remove('open', 'show');
		this.isOpen = false;

		// Pop sidenav scope
		if (Funky.Keyboard && Funky.Keyboard.popScope) {
			Funky.Keyboard.popScope();
		}

		// Update toggle button if exists
		var toggle = this.config.toggleSelector ?
			document.querySelector(this.config.toggleSelector) : null;
		if (toggle) {
			toggle.setAttribute('aria-expanded', 'false');
		}

		// Emit event
		if (Funky.PubSub) {
			Funky.PubSub.emit('funky:sidenav:close', { sidenav: this });
		}

		return this;
	};

	/**
	 * Toggle the sidenav open/closed
	 */
	SideNav.prototype.toggle = function() {
		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
		return this;
	};

	/**
	 * Get the current state of the sidenav
	 * @returns {Object} Current state
	 */
	SideNav.prototype.getState = function() {
		return {
			isOpen: !!this.isOpen,
			selectedId: this.selectedId,
			collapsedGroups: this.collapsedGroups
		};
	};

	/**
	 * Destroy the component
	 */
	SideNav.prototype.destroy = function() {
		// Execute all cleanup functions (document listeners, toggle button, etc.)
		if (this._cleanups && this._cleanups.length) {
			this._cleanups.forEach(function(fn) {
				try { fn(); } catch (e) { /* ignore */ }
			});
			this._cleanups = [];
		}

		// Unregister keyboard shortcuts
		if (this._keyboardUnregisters) {
			this._keyboardUnregisters.forEach(function(unregister) {
				if (typeof unregister === 'function') {
					unregister();
				}
			});
			this._keyboardUnregisters = null;
		}

		// Unsubscribe from PubSub events
		if (this._pubsubUnsubscribes) {
			this._pubsubUnsubscribes.forEach(function(unsubscribe) {
				if (typeof unsubscribe === 'function') {
					unsubscribe();
				}
			});
			this._pubsubUnsubscribes = null;
		}

		// Destroy SelectableList and remove hidden container
		if (this._selectableList) {
			this._selectableList.destroy();
			this._selectableList = null;
		}
		if (this._listContainer && this._listContainer.parentNode) {
			this._listContainer.parentNode.removeChild(this._listContainer);
			this._listContainer = null;
		}

		// Bindable Interface: Unregister from instances
		if (this._containerId && _instances.has(this._containerId)) {
			_instances.unregister(this._containerId);
		}

		this.container.innerHTML = '';
		this.container.classList.remove('funky-sidenav');
	};

	/**
	 * Bindable Interface: Set menu items data
	 * @param {Array} items - Array of menu item objects
	 */
	SideNav.prototype.setData = function(items) {
		if (!Array.isArray(items)) {
			console.warn('[SideNav] setData expects an array');
			return this;
		}
		return this.setItems(items);
	};

	/**
	 * Bindable Interface: Get current menu items and selection state
	 * @returns {Object} Current items and selected ID
	 */
	SideNav.prototype.getData = function() {
		return {
			items: this.config.items,
			selectedId: this.selectedId,
			selected: this.getSelected(),
			collapsedGroups: this.collapsedGroups
		};
	};

	// Static factory methods
	SideNav.init = function(selector, config) {
		return new SideNav(selector, config);
	};

	SideNav.create = function(selectorOrConfig, config) {
		// Support both: create('#nav', config) and create({ element: '#nav', ... })
		if (typeof selectorOrConfig === 'object' && selectorOrConfig !== null) {
			var opts = selectorOrConfig;
			var element = opts.element || opts.selector || opts.container;
			return new SideNav(element, opts);
		}
		return new SideNav(selectorOrConfig, config);
	};

	// Bindable Interface: Expose instance registry
	SideNav._instances = _instances;

	/**
	 * Bindable Interface: Get an instance by container ID
	 * @param {string} containerId - Container element ID
	 * @returns {SideNav|null} SideNav instance or null
	 */
	SideNav.getInstance = function(containerId) {
		return _instances.get(containerId);
	};

	/**
	 * Bindable Interface: Set data on a specific instance
	 * @param {string} containerId - Container element ID
	 * @param {Array} items - Array of menu item objects
	 */
	SideNav.setData = function(containerId, items) {
		var instance = _instances.get(containerId);
		if (!instance) {
			console.warn('[SideNav] setData: Instance not found:', containerId);
			return;
		}
		instance.setData(items);
	};

	/**
	 * Bindable Interface: Get data from a specific instance
	 * @param {string} containerId - Container element ID
	 * @returns {Object|null} Current state or null
	 */
	SideNav.getData = function(containerId) {
		var instance = _instances.get(containerId);
		if (!instance) {
			return null;
		}
		return instance.getData();
	};

	/**
	 * Destroy all SideNav instances
	 * Useful for cleanup in tests or when navigating away
	 */
	SideNav.destroyAll = function() {
		_instances.destroyAll();
	};

	// Register with Funky securely
	Funky.register('SideNav', SideNav);

})(window);
