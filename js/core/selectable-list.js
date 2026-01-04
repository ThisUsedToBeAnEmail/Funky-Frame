/**
 * Funky.SelectableList - Core accessible list with keyboard navigation
 * 
 * A foundational module for building list-based UIs with consistent
 * keyboard navigation, selection, and ARIA accessibility.
 * 
 * Used by: CommandPalette, SideNav, WidgetCatalog
 * 
 * @module Funky.SelectableList
 * @version 1.0.1
 * @requires Funky.Dom
 */
(function(global) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('SelectableList')) {
		return;
	}

	var D = global.Funky && global.Funky.Dom;
	var PubSub = global.Funky && global.Funky.PubSub;

	if (!D) {
		console.error('[Funky.SelectableList] Funky.Dom is required');
		return;
	}

	// =========================================================================
	// DEFAULT CONFIGURATION
	// =========================================================================

	var DEFAULTS = {
		// Data
		items: [],
		getItemKey: function(item, index) {
			return item && item.id !== undefined ? item.id : index;
		},
		
		// Rendering
		renderItem: null,           // function(item, index, state) => HTML string
		itemClass: '',              // Additional CSS class for items
		
		// Selection
		selectable: 'single',       // 'none' | 'single' | 'multi'
		selectedIds: [],            // Initial selection
		allowDeselect: true,        // In single mode, can click again to deselect
		selectOnFocus: false,       // Auto-select when navigating with keyboard
		
		// Grouping
		groupBy: null,              // function(item) => group key
		renderGroupHeader: null,    // function(groupKey, items) => HTML string
		
		// Empty state
		emptyMessage: 'No items to display',
		emptyTemplate: null,
		emptyIcon: null,            // Font Awesome class or null
		
		// Disabled items
		isItemDisabled: null,       // function(item) => boolean
		
		// Accessibility (Phase 4)
		ariaLabel: 'List',
		ariaDescription: null,      // Additional description for screen readers
		announceOnFocus: true,      // Announce item when focused
		announceOnSelect: true,     // Announce selection changes
		showInstructions: true,     // Add screen reader instructions
		
		// Behavior
		wrapAround: true,           // Wrap navigation at list ends
		scrollBehavior: 'smooth',   // 'smooth' | 'auto' | 'instant'
		
		// Theming (Phase 5)
		density: 'default',         // 'compact' | 'default' | 'comfortable'
		variant: null,              // null | 'bordered' | 'cards' | 'striped' | 'checkboxes'
		
		// Keyboard (Phase 3)
		keyboard: true,             // Enable keyboard navigation
		useKeyboardModule: true,    // Use Funky.Keyboard (fallback to native if unavailable)
		keyboardScope: null,        // Custom scope name (default: 'list-{id}')
		pageSize: 10,               // Items to skip for PageUp/Down
		typeAhead: true,            // Enable type-ahead search
		typeAheadTimeout: 500,      // ms to reset type buffer
		vimKeys: false,             // Enable j/k navigation
		handleDefaultActions: true, // Register default event handlers
		
		// Touch gestures
		gestures: false,            // Enable touch gesture support (requires GestureTracker)
		swipeSelectAction: 'toggle', // 'toggle' | 'select' | 'deselect'
		
		// Callbacks
		onSelect: null,             // function(selectedItems, selectedIds)
		onBeforeSelect: null,       // function(item, action) => boolean (can cancel)
		onActivate: null,
		onFocus: null,
		onNavigate: null,           // function(direction, newIndex, oldIndex)
		onCancel: null,             // function() - called on Escape
		onChange: null
	};

	// =========================================================================
	// INSTANCE CONSTRUCTOR
	// =========================================================================

	var instanceCounter = 0;

	/**
	 * SelectableList instance
	 * @param {HTMLElement} container
	 * @param {Object} options
	 */
	function SelectableListInstance(container, options) {
		this.id = 'slist-' + (++instanceCounter);
		this.container = container;
		this.config = Object.assign({}, DEFAULTS, options);
		
		// State
		this.items = this.config.items.slice(); // Clone to avoid mutation
		this.selectedIds = new Set(this.config.selectedIds || []);
		this.focusedIndex = -1;
		this._lastSelectedIndex = -1; // Track last selected for Shift+Click range
		this.isDestroyed = false;
		
		// Keyboard state (Phase 3)
		this._typeBuffer = '';
		this._typeTimer = null;
		this._keyboardScope = null;
		this._keyboardRegistrations = [];
		this._eventSubscriptions = [];
		
		// Accessibility state (Phase 4)
		this._liveRegion = null;
		
		// Gesture state
		this._gestureTracker = null;
		this._gestureStartIndex = -1;
		this._gestureSelectedKeys = new Set();
		
		// DOM references
		this.wrapper = null;
		this.itemElements = [];
		
		// Initialize
		this._init();
	}

	// =========================================================================
	// INITIALIZATION
	// =========================================================================

	SelectableListInstance.prototype._init = function() {
		this._createDOM();
		this._render();
		this._bindEvents();
		this._initKeyboard();
		this._initGestures();
		
		// Set initial focus to first item if items exist
		if (this.items.length > 0) {
			this.focusedIndex = 0;
		}
	};

	SelectableListInstance.prototype._createDOM = function() {
		// Clear container
		this.container.innerHTML = '';
		
		var describedBy = [];
		
		// Create wrapper with ARIA attributes
		this.wrapper = D.create('div')
			.classAdd('selectable-list')
			.attr({
				'role': 'listbox',
				'aria-label': this.config.ariaLabel,
				'tabindex': '0'
			});
		
		// Apply density modifier
		if (this.config.density && this.config.density !== 'default') {
			this.wrapper.classAdd('selectable-list--' + this.config.density);
		}
		
		// Apply variant modifier
		if (this.config.variant) {
			this.wrapper.classAdd('selectable-list--' + this.config.variant);
		}
		
		// Set multiselectable if applicable
		if (this.config.selectable === 'multi') {
			this.wrapper.attr('aria-multiselectable', 'true');
		}
		
		// Optional description for screen readers
		if (this.config.ariaDescription) {
			var descId = 'desc-' + this.id;
			var desc = D.create('div')
				.attr('id', descId)
				.classAdd('sr-only')
				.text(this.config.ariaDescription);
			D.one(this.container).append(desc);
			describedBy.push(descId);
		}
		
		// Screen reader instructions
		if (this.config.showInstructions) {
			var instrId = 'instr-' + this.id;
			var instructions = 'Use arrow keys to navigate. ';
			if (this.config.selectable === 'single') {
				instructions += 'Press Enter or Space to select an item.';
			} else if (this.config.selectable === 'multi') {
				instructions += 'Press Space to toggle selection, Ctrl+A to select all.';
			}
			if (this.config.typeAhead) {
				instructions += ' Type to search.';
			}
			
			var instrEl = D.create('div')
				.attr('id', instrId)
				.classAdd('sr-only')
				.text(instructions);
			D.one(this.container).append(instrEl);
			describedBy.push(instrId);
		}
		
		// Set aria-describedby if we have descriptions
		if (describedBy.length > 0) {
			this.wrapper.attr('aria-describedby', describedBy.join(' '));
		}
		
		// Append wrapper to container
		D.one(this.container).append(this.wrapper);
		
		// Create live region for announcements
		this._createLiveRegion();
	};

	// =========================================================================
	// LIVE REGION (SCREEN READER ANNOUNCEMENTS)
	// =========================================================================

	SelectableListInstance.prototype._createLiveRegion = function() {
		// Create hidden live region for screen reader announcements
		this._liveRegion = D.create('div')
			.attr({
				'role': 'status',
				'aria-live': 'polite',
				'aria-atomic': 'true'
			})
			.classAdd('sr-only selectable-list__live-region');
		
		// Append after wrapper
		D.one(this.container).append(this._liveRegion);
	};

	/**
	 * Announce message to screen readers
	 * @param {string} message
	 * @param {string} priority - 'polite' or 'assertive'
	 */
	SelectableListInstance.prototype.announce = function(message, priority) {
		if (!this._liveRegion) return;
		
		priority = priority || 'polite';
		this._liveRegion.attr('aria-live', priority);
		
		// Clear and set to trigger announcement
		this._liveRegion.text('');
		
		var self = this;
		setTimeout(function() {
			self._liveRegion.text(message);
		}, 50);
	};

	// =========================================================================
	// RENDERING
	// =========================================================================

	SelectableListInstance.prototype._render = function() {
		var self = this;
		
		// Clear existing content
		this.wrapper.html('');
		this.itemElements = [];
		
		// Handle empty state
		if (this.items.length === 0) {
			this._renderEmpty();
			return;
		}
		
		// Check if grouping is enabled
		if (this.config.groupBy) {
			// Pre-size array for indexed assignment
			this.itemElements = new Array(this.items.length);
			this._renderGrouped();
		} else {
			this._renderFlat();
		}
		
		// Update focus indicator
		this._updateFocusIndicator();
	};

	SelectableListInstance.prototype._renderFlat = function() {
		var self = this;
		
		this.items.forEach(function(item, index) {
			var itemEl = self._createItemElement(item, index);
			self.wrapper.append(itemEl);
			self.itemElements.push(itemEl);
		});
	};

	SelectableListInstance.prototype._renderGrouped = function() {
		var self = this;
		var groups = this._groupItems();
		
		Object.keys(groups).forEach(function(groupKey) {
			var groupItems = groups[groupKey];
			
			// Create group container
			var groupId = 'group-' + self.id + '-' + groupKey.toLowerCase().replace(/\s+/g, '-');
			var group = D.create('div')
				.classAdd('selectable-list__group')
				.attr({
					'role': 'group',
					'aria-labelledby': groupId
				});
			
			// Create group header
			var headerHtml = self.config.renderGroupHeader 
				? self.config.renderGroupHeader(groupKey, groupItems.map(function(g) { return g.item; }))
				: groupKey;
			
			var header = D.create('div')
				.classAdd('selectable-list__group-header')
				.attr('id', groupId)
				.html(headerHtml);
			
			group.append(header);
			
			// Create items using original index
			groupItems.forEach(function(groupItem) {
				var itemEl = self._createItemElement(groupItem.item, groupItem.originalIndex);
				group.append(itemEl);
				self.itemElements[groupItem.originalIndex] = itemEl;
			});
			
			self.wrapper.append(group);
		});
	};

	SelectableListInstance.prototype._groupItems = function() {
		var self = this;
		var groups = {};
		
		this.items.forEach(function(item, originalIndex) {
			var key = self.config.groupBy(item) || 'Other';
			if (!groups[key]) {
				groups[key] = [];
			}
			// Store original index with the item
			groups[key].push({ item: item, originalIndex: originalIndex });
		});
		
		return groups;
	};

	SelectableListInstance.prototype._createItemElement = function(item, index) {
		var self = this;
		var key = this.config.getItemKey(item, index);
		var isSelected = this.selectedIds.has(key);
		var isFocused = index === this.focusedIndex;
		var isDisabled = this.config.isItemDisabled ? this.config.isItemDisabled(item) : false;
		
		// Build state object for renderer
		var state = {
			index: index,
			isSelected: isSelected,
			isFocused: isFocused,
			isDisabled: isDisabled
		};
		
		// Get item content
		var content;
		if (this.config.renderItem) {
			content = this.config.renderItem(item, index, state);
		} else {
			content = this._defaultRenderItem(item, state);
		}
		
		// Create element
		var itemEl = D.create('div')
			.classAdd('selectable-list__item')
			.attr({
				'role': 'option',
				'id': 'item-' + this.id + '-' + index,
				'data-index': index,
				'data-key': key,
				'aria-selected': isSelected ? 'true' : 'false',
				'aria-posinset': index + 1,
				'aria-setsize': this.items.length,
				'tabindex': '-1'
			})
			.html(content);
		
		// Add state classes
		if (isSelected) itemEl.classAdd('is-selected');
		if (isFocused) itemEl.classAdd('is-focused');
		if (isDisabled) {
			itemEl.classAdd('is-disabled');
			itemEl.attr('aria-disabled', 'true');
		}
		
		// Add custom class if specified
		if (this.config.itemClass) {
			itemEl.classAdd(this.config.itemClass);
		}
		
		return itemEl;
	};

	SelectableListInstance.prototype._defaultRenderItem = function(item, state) {
		// Default: render item.label or item.title or item.name or String(item)
		var text = item.label || item.title || item.name || String(item);
		return '<span class="selectable-list__item-text">' + this._escapeHtml(text) + '</span>';
	};

	SelectableListInstance.prototype._renderEmpty = function() {
		var iconHtml = '';
		if (this.config.emptyIcon) {
			// Use aria-hidden for decorative icon
			iconHtml = '<div class="selectable-list__empty-icon" aria-hidden="true"><i class="' + this.config.emptyIcon + '"></i></div>';
		}
		
		var content = this.config.emptyTemplate 
			? this.config.emptyTemplate
			: iconHtml + '<p class="selectable-list__empty-text">' + this.config.emptyMessage + '</p>';
		
		var empty = D.create('div')
			.classAdd('selectable-list__empty')
			.attr({
				'role': 'status',
				'aria-live': 'polite'
			})
			.html(content);
		
		this.wrapper.append(empty);
		
		// Announce empty state
		this.announce(this.config.emptyMessage);
	};

	// =========================================================================
	// EVENT BINDING
	// =========================================================================

	SelectableListInstance.prototype._bindEvents = function() {
		var self = this;
		
		// Click on items
		this.wrapper.on('click', function(e) {
			var itemEl = self._findItemElement(e.target);
			if (itemEl) {
				var index = parseInt(itemEl.attr('data-index'), 10);
				self._handleItemClick(index, e);
			}
		});
		
		// Focus/blur for scope management
		this.wrapper.on('focus', function() {
			self._onFocus();
		});
		
		this.wrapper.on('blur', function() {
			self._onBlur();
		});
	};

	SelectableListInstance.prototype._findItemElement = function(target) {
		var el = target;
		while (el && el !== this.wrapper.el) {
			if (el.classList && el.classList.contains('selectable-list__item')) {
				return D.one(el);
			}
			el = el.parentElement;
		}
		return null;
	};

	SelectableListInstance.prototype._handleItemClick = function(index, event) {
		var item = this.items[index];
		if (!item) return;
		
		var key = String(this.config.getItemKey(item, index));
		var isDisabled = this.config.isItemDisabled ? this.config.isItemDisabled(item) : false;
		
		if (isDisabled) return;
		
		// Focus the wrapper so keyboard events work
		// This moves native browser focus from the clicked item to the listbox
		if (this.wrapper && this.wrapper.el) {
			this.wrapper.el.focus();
		}
		
		// Set logical focus index
		this.setFocusedIndex(index);
		
		// Handle selection based on mode and modifiers
		if (this.config.selectable !== 'none') {
			if (this.config.selectable === 'multi') {
				if (event.shiftKey && this._lastSelectedIndex >= 0) {
					// Shift+Click: range select
					this.selectRange(this._lastSelectedIndex, index);
				} else {
					// Regular click or Ctrl/Cmd+Click: toggle selection
					this.toggleSelection(key);
				}
				this._lastSelectedIndex = index;
			} else {
				// Single mode
				this.toggleSelection(key);
				this._lastSelectedIndex = index;
			}
		}
		
		// Trigger activate callback
		if (this.config.onActivate) {
			this.config.onActivate(item, index);
		}
		
		// Emit event
		this._emit('funky:list:activate', { item: item, index: index });
	};

	SelectableListInstance.prototype._handleKeydown = function(e) {
		// Skip if already handled (e.g., by Funky.Keyboard)
		if (e.defaultPrevented) return;
		
		var action = this._getActionFromKey(e);
		if (!action) return;
		
		e.preventDefault();
		e.stopPropagation();
		
		var eventData = this._emitKeyboardEvent(action, e);
		
		// If consumer prevented default, don't run built-in handlers
		if (eventData._defaultPrevented) return;
		
		// Execute default action
		this._executeKeyboardAction(action, e);
	};

	SelectableListInstance.prototype._getActionFromKey = function(e) {
		var key = e.key;
		
		// Navigation
		if (key === 'ArrowDown' || key === 'Down') return 'navigate-down';
		if (key === 'ArrowUp' || key === 'Up') return 'navigate-up';
		if (key === 'Home') return 'navigate-first';
		if (key === 'End') return 'navigate-last';
		if (key === 'PageUp') return 'navigate-page-up';
		if (key === 'PageDown') return 'navigate-page-down';
		
		// Actions
		if (key === 'Enter') return 'activate';
		if (key === ' ') return 'toggle';
		if (key === 'Escape') return 'cancel';
		
		// Select all
		if ((key === 'a' || key === 'A') && (e.ctrlKey || e.metaKey)) {
			if (this.config.selectable === 'multi') return 'select-all';
		}
		
		// Vim keys
		if (this.config.vimKeys && !e.ctrlKey && !e.metaKey && !e.altKey) {
			if (key === 'j') return 'navigate-down';
			if (key === 'k') return 'navigate-up';
			if (key === 'g') return 'navigate-first';
			if (key === 'G') return 'navigate-last';
		}
		
		// Type-ahead
		if (this.config.typeAhead && this._isPrintableKey(e)) {
			this._handleTypeAhead(e.key);
			return null; // Handled separately
		}
		
		return null;
	};

	SelectableListInstance.prototype._executeKeyboardAction = function(action, e) {
		switch (action) {
			case 'navigate-down':
				this._navigateDown(e);
				break;
			case 'navigate-up':
				this._navigateUp(e);
				break;
			case 'navigate-first':
				this._navigateToFirst();
				break;
			case 'navigate-last':
				this._navigateToLast();
				break;
			case 'navigate-page-up':
				this._navigateByPage(-1);
				break;
			case 'navigate-page-down':
				this._navigateByPage(1);
				break;
			case 'activate':
				this._activateFocused(e);
				break;
			case 'toggle':
				this._toggleFocused();
				break;
			case 'cancel':
				this._handleEscape();
				break;
			case 'select-all':
				if (this.config.selectable === 'multi') {
					this.selectAll();
				}
				break;
		}
	};

	SelectableListInstance.prototype._emitKeyboardEvent = function(action, originalEvent) {
		var eventData = {
			id: this.id,
			action: action,
			focusedIndex: this.focusedIndex,
			focusedItem: this.getFocused(),
			shiftKey: originalEvent.shiftKey,
			ctrlKey: originalEvent.ctrlKey,
			metaKey: originalEvent.metaKey,
			originalEvent: originalEvent,
			preventDefault: function() { this._defaultPrevented = true; },
			_defaultPrevented: false
		};
		
		// Emit specific event via PubSub
		this._emit('funky:list:keyboard:' + action, eventData);
		
		return eventData;
	};

	// =========================================================================
	// KEYBOARD INITIALIZATION
	// =========================================================================

	SelectableListInstance.prototype._initKeyboard = function() {
		if (!this.config.keyboard) return;
		
		this._keyboardScope = this.config.keyboardScope || ('list-' + this.id);
		
		// Check for Funky.Keyboard module
		var Keyboard = global.Funky && global.Funky.Keyboard;
		
		if (this.config.useKeyboardModule && Keyboard) {
			this._registerKeyboardShortcuts(Keyboard);
		}
		
		// Always bind native keydown as primary/fallback handler
		// This ensures keyboard works when wrapper is focused, even if
		// Funky.Keyboard scope isn't active
		this._bindNativeKeydown();
	};

	// =========================================================================
	// GESTURE SUPPORT
	// =========================================================================

	SelectableListInstance.prototype._initGestures = function() {
		if (!this.config.gestures) return;
		if (this.config.selectable === 'none') return;
		
		var GestureTracker = global.Funky && global.Funky.GestureTracker;
		if (!GestureTracker || !GestureTracker.create) {
			console.warn('[SelectableList] GestureTracker not available, gestures disabled');
			return;
		}
		
		var self = this;
		this._gestureActive = false;
		
		this._gestureTracker = GestureTracker.create({
			target: this.wrapper.el,
			gestures: ['longpress', 'drag'],
			autoStart: true,
			preventDefault: false,
			longPressDelay: 300, // Shorter delay for responsiveness
			
			onLongPress: function(data) {
				// Long press activates gesture selection mode
				self._gestureActive = true;
				self._onGestureDragStart(data);
			},
			onDragStart: function(data) {
				// Only start drag selection if long press activated it
				// or if we're in multi-select mode (allow immediate drag)
				if (self._gestureActive || self.config.selectable === 'multi') {
					self._onGestureDragStart(data);
				}
			},
			onDragMove: function(data) {
				self._onGestureDragMove(data);
			},
			onDragEnd: function(data) {
				self._onGestureDragEnd(data);
			}
		});
	};

	SelectableListInstance.prototype._onGestureDragStart = function(data) {
		// Find the item at the start position
		var itemEl = this._getItemAtPoint(data.startX, data.startY);
		if (!itemEl) return;
		
		var index = parseInt(itemEl.attr('data-index'), 10);
		if (isNaN(index)) return;
		
		this._gestureStartIndex = index;
		this._gestureSelectedKeys = new Set();
		
		// Apply action to starting item
		this._applyGestureAction(index);
	};

	SelectableListInstance.prototype._onGestureDragMove = function(data) {
		if (this._gestureStartIndex < 0) return;
		
		// Find item at current position
		var itemEl = this._getItemAtPoint(data.x, data.y);
		if (!itemEl) return;
		
		var index = parseInt(itemEl.attr('data-index'), 10);
		if (isNaN(index)) return;
		
		// Apply action to this item if not already processed
		var item = this.items[index];
		if (!item) return;
		
		var key = String(this.config.getItemKey(item, index));
		if (!this._gestureSelectedKeys.has(key)) {
			this._applyGestureAction(index);
		}
	};

	SelectableListInstance.prototype._onGestureDragEnd = function(data) {
		this._gestureStartIndex = -1;
		this._gestureSelectedKeys = new Set();
		this._gestureActive = false;
	};

	SelectableListInstance.prototype._getItemAtPoint = function(x, y) {
		var el = document.elementFromPoint(x, y);
		if (!el) return null;
		
		// Walk up to find item element
		while (el && el !== this.wrapper.el) {
			if (el.classList && el.classList.contains('selectable-list__item')) {
				return D.one(el);
			}
			el = el.parentElement;
		}
		return null;
	};

	SelectableListInstance.prototype._applyGestureAction = function(index) {
		var item = this.items[index];
		if (!item) return;
		
		var key = String(this.config.getItemKey(item, index));
		
		// Check if disabled
		if (this.config.isItemDisabled && this.config.isItemDisabled(item)) return;
		
		// Mark as processed
		this._gestureSelectedKeys.add(key);
		
		// Apply action based on config
		var action = this.config.swipeSelectAction;
		
		if (action === 'toggle') {
			this.toggleSelection(key);
		} else if (action === 'select') {
			if (!this.isSelected(key)) {
				if (this.config.selectable === 'single') {
					this.setSelection([key]);
				} else {
					this.addSelection(key);
				}
			}
		} else if (action === 'deselect') {
			if (this.isSelected(key)) {
				this.removeSelection(key);
			}
		}
		
		// Update focus to current item
		this.setFocusedIndex(index);
	};

	SelectableListInstance.prototype._registerKeyboardShortcuts = function(Keyboard) {
		var self = this;
		var scope = this._keyboardScope;
		
		// Helper to register and track
		function reg(key, action, description, options) {
			var config = {
				key: key,
				scope: scope,
				description: description,
				handler: function(e) {
					e.preventDefault();
					var eventData = self._emitKeyboardEvent(action, e);
					if (!eventData._defaultPrevented) {
						self._executeKeyboardAction(action, e);
					}
				}
			};
			// Merge additional options (mod, shift, etc.)
			if (options) {
				for (var prop in options) {
					if (options.hasOwnProperty(prop)) {
						config[prop] = options[prop];
					}
				}
			}
			var unreg = Keyboard.register(config);
			if (unreg) {
				self._keyboardRegistrations.push(unreg);
			}
		}
		
		// Navigation
		reg('down', 'navigate-down', 'Move to next item');
		reg('up', 'navigate-up', 'Move to previous item');
		reg('home', 'navigate-first', 'Move to first item');
		reg('end', 'navigate-last', 'Move to last item');
		reg('pagedown', 'navigate-page-down', 'Move down by page');
		reg('pageup', 'navigate-page-up', 'Move up by page');
		
		// Actions
		reg('enter', 'activate', 'Activate item');
		reg('space', 'toggle', 'Toggle selection');
		reg('escape', 'cancel', 'Cancel/clear');
		
		// Multi-select
		if (this.config.selectable === 'multi') {
			reg('a', 'select-all', 'Select all items', { mod: true });
		}
		
		// Vim keys (optional)
		if (this.config.vimKeys) {
			reg('j', 'navigate-down', 'Move down (vim)');
			reg('k', 'navigate-up', 'Move up (vim)');
			reg('g', 'navigate-first', 'Move to first (vim)');
			reg('g', 'navigate-last', 'Move to last (vim)', { shift: true });
		}
	};

	SelectableListInstance.prototype._bindNativeKeydown = function() {
		var self = this;
		
		this.wrapper.on('keydown', function(e) {
			self._handleKeydown(e);
		});
	};

	// =========================================================================
	// SCOPE MANAGEMENT
	// =========================================================================

	SelectableListInstance.prototype._onFocus = function() {
		var Keyboard = global.Funky && global.Funky.Keyboard;
		
		if (Keyboard && this.config.useKeyboardModule && this._keyboardScope) {
			Keyboard.pushScope(this._keyboardScope);
		}
		
		// Set initial focus if needed
		if (this.focusedIndex < 0 && this.items.length > 0) {
			this.setFocusedIndex(0);
		}
	};

	SelectableListInstance.prototype._onBlur = function() {
		var Keyboard = global.Funky && global.Funky.Keyboard;
		
		if (Keyboard && this.config.useKeyboardModule && this._keyboardScope) {
			Keyboard.popScope();
		}
	};

	// =========================================================================
	// NAVIGATION METHODS
	// =========================================================================

	SelectableListInstance.prototype._navigateDown = function(e) {
		if (this.items.length === 0) {
			return;
		}

		var oldIndex = this.focusedIndex;
		var newIndex = this.focusedIndex + 1;
		
		// Skip disabled items
		while (newIndex < this.items.length && this._isItemAtIndexDisabled(newIndex)) {
			newIndex++;
		}
		
		if (newIndex >= this.items.length) {
			if (this.config.wrapAround) {
				newIndex = this._findFirstEnabledIndex();
			} else {
				return; // At end, no wrap
			}
		}
		
		if (newIndex >= 0) {
			this.setFocusedIndex(newIndex);
			
			// Handle selection with modifiers
			if (this.config.selectable === 'multi' && e && e.shiftKey) {
				this._extendSelectionTo(newIndex);
			} else if (this.config.selectOnFocus) {
				this._selectFocused();
			}
			
			// Callback
			if (this.config.onNavigate) {
				this.config.onNavigate('down', newIndex, oldIndex);
			}
		}
	};

	SelectableListInstance.prototype._navigateUp = function(e) {
		if (this.items.length === 0) return;
		
		var oldIndex = this.focusedIndex;
		var newIndex = this.focusedIndex - 1;
		
		// Skip disabled items
		while (newIndex >= 0 && this._isItemAtIndexDisabled(newIndex)) {
			newIndex--;
		}
		
		if (newIndex < 0) {
			if (this.config.wrapAround) {
				newIndex = this._findLastEnabledIndex();
			} else {
				return;
			}
		}
		
		if (newIndex >= 0) {
			this.setFocusedIndex(newIndex);
			
			if (this.config.selectable === 'multi' && e && e.shiftKey) {
				this._extendSelectionTo(newIndex);
			} else if (this.config.selectOnFocus) {
				this._selectFocused();
			}
			
			if (this.config.onNavigate) {
				this.config.onNavigate('up', newIndex, oldIndex);
			}
		}
	};

	SelectableListInstance.prototype._navigateToFirst = function() {
		var oldIndex = this.focusedIndex;
		var index = this._findFirstEnabledIndex();
		
		if (index >= 0) {
			this.setFocusedIndex(index);
			
			if (this.config.onNavigate) {
				this.config.onNavigate('first', index, oldIndex);
			}
		}
	};

	SelectableListInstance.prototype._navigateToLast = function() {
		var oldIndex = this.focusedIndex;
		var index = this._findLastEnabledIndex();
		
		if (index >= 0) {
			this.setFocusedIndex(index);
			
			if (this.config.onNavigate) {
				this.config.onNavigate('last', index, oldIndex);
			}
		}
	};

	SelectableListInstance.prototype._navigateByPage = function(direction) {
		if (this.items.length === 0) return;
		
		var oldIndex = this.focusedIndex;
		var newIndex = this.focusedIndex + (direction * this.config.pageSize);
		newIndex = Math.max(0, Math.min(this.items.length - 1, newIndex));
		
		// Find nearest enabled item
		if (this._isItemAtIndexDisabled(newIndex)) {
			newIndex = direction > 0 
				? this._findNextEnabledIndex(newIndex)
				: this._findPrevEnabledIndex(newIndex);
		}
		
		if (newIndex >= 0 && newIndex < this.items.length) {
			this.setFocusedIndex(newIndex);
			
			if (this.config.onNavigate) {
				this.config.onNavigate(direction > 0 ? 'page-down' : 'page-up', newIndex, oldIndex);
			}
		}
	};

	// =========================================================================
	// DISABLED ITEM HELPERS
	// =========================================================================

	SelectableListInstance.prototype._isItemAtIndexDisabled = function(index) {
		if (!this.config.isItemDisabled) return false;
		var item = this.items[index];
		return item ? this.config.isItemDisabled(item) : true;
	};

	SelectableListInstance.prototype._findFirstEnabledIndex = function() {
		for (var i = 0; i < this.items.length; i++) {
			if (!this._isItemAtIndexDisabled(i)) return i;
		}
		return -1;
	};

	SelectableListInstance.prototype._findLastEnabledIndex = function() {
		for (var i = this.items.length - 1; i >= 0; i--) {
			if (!this._isItemAtIndexDisabled(i)) return i;
		}
		return -1;
	};

	SelectableListInstance.prototype._findNextEnabledIndex = function(from) {
		for (var i = from; i < this.items.length; i++) {
			if (!this._isItemAtIndexDisabled(i)) return i;
		}
		return this._findLastEnabledIndex(); // Fall back
	};

	SelectableListInstance.prototype._findPrevEnabledIndex = function(from) {
		for (var i = from; i >= 0; i--) {
			if (!this._isItemAtIndexDisabled(i)) return i;
		}
		return this._findFirstEnabledIndex();
	};

	// =========================================================================
	// ACTIVATION & SELECTION HELPERS
	// =========================================================================

	SelectableListInstance.prototype._activateFocused = function(e) {
		if (this.focusedIndex < 0) return;
		this._handleItemClick(this.focusedIndex, e || {});
	};

	SelectableListInstance.prototype._toggleFocused = function() {
		if (this.focusedIndex < 0) return;
		
		var item = this.items[this.focusedIndex];
		if (!item) return;
		
		var key = this.config.getItemKey(item, this.focusedIndex);
		this.toggleSelection(key);
	};

	SelectableListInstance.prototype._handleEscape = function() {
		var hadSelection = this.selectedIds.size > 0;
		
		if (hadSelection && this.config.selectable !== 'none') {
			this.clearSelection();
			// Announce for screen readers
			if (this.config.announceOnSelect) {
				this.announce('Selection cleared');
			}
		}
		
		if (this.config.onCancel) {
			this.config.onCancel();
		}
		
		this._emit('funky:list:cancel', {});
	};

	SelectableListInstance.prototype._extendSelectionTo = function(toIndex) {
		if (this._lastSelectedIndex < 0) {
			this._lastSelectedIndex = this.focusedIndex;
		}
		
		var start = Math.min(this._lastSelectedIndex, toIndex);
		var end = Math.max(this._lastSelectedIndex, toIndex);
		
		// Clear and reselect range
		this.selectedIds.clear();
		this.selectRange(start, end);
	};

	// =========================================================================
	// TYPE-AHEAD SEARCH
	// =========================================================================

	SelectableListInstance.prototype._isPrintableKey = function(e) {
		// Single character, no modifier (except shift)
		return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
	};

	SelectableListInstance.prototype._handleTypeAhead = function(char) {
		var self = this;
		
		// Add to buffer
		this._typeBuffer += char.toLowerCase();
		
		// Clear timer and set new one
		if (this._typeTimer) {
			clearTimeout(this._typeTimer);
		}
		this._typeTimer = setTimeout(function() {
			self._typeBuffer = '';
		}, this.config.typeAheadTimeout);
		
		// Find matching item
		var startIndex = (this.focusedIndex + 1) % this.items.length;
		var matchIndex = this._findTypeAheadMatch(this._typeBuffer, startIndex);
		
		if (matchIndex >= 0) {
			this.setFocusedIndex(matchIndex);
		}
	};

	SelectableListInstance.prototype._findTypeAheadMatch = function(query, startIndex) {
		var len = this.items.length;
		
		for (var i = 0; i < len; i++) {
			var index = (startIndex + i) % len;
			var item = this.items[index];
			
			if (this._isItemAtIndexDisabled(index)) continue;
			
			var text = this._getItemText(item).toLowerCase();
			
			if (text.indexOf(query) === 0) {
				return index;
			}
		}
		
		return -1;
	};

	SelectableListInstance.prototype._getItemText = function(item) {
		if (typeof item === 'string') return item;
		return item.label || item.title || item.name || item.text || '';
	};

	// =========================================================================
	// FOCUS MANAGEMENT
	// =========================================================================

	SelectableListInstance.prototype._moveFocus = function(delta) {
		if (this.items.length === 0) return;
		
		var newIndex = this.focusedIndex + delta;
		
		if (this.config.wrapAround) {
			if (newIndex < 0) newIndex = this.items.length - 1;
			if (newIndex >= this.items.length) newIndex = 0;
		} else {
			newIndex = Math.max(0, Math.min(this.items.length - 1, newIndex));
		}
		
		this.setFocusedIndex(newIndex);
	};

	SelectableListInstance.prototype.setFocusedIndex = function(index) {
		if (index < 0 || index >= this.items.length) {
			return;
		}

		var oldIndex = this.focusedIndex;
		this.focusedIndex = index;
		
		this._updateFocusIndicator();
		this._scrollToFocused();
		
		// Announce for screen readers
		if (oldIndex !== index && this.config.announceOnFocus) {
			var item = this.items[index];
			var text = this._getItemText(item);
			var position = (index + 1) + ' of ' + this.items.length;
			var key = this.config.getItemKey(item, index);
			var selected = this.isSelected(key) ? ', selected' : '';
			var disabled = (this.config.isItemDisabled && this.config.isItemDisabled(item)) ? ', disabled' : '';
			
			this.announce(text + ', ' + position + selected + disabled);
		}
		
		// Callback
		if (this.config.onFocus && oldIndex !== index) {
			this.config.onFocus(this.items[index], index);
		}
		
		// Emit event
		if (oldIndex !== index) {
			this._emit('funky:list:focus', { item: this.items[index], index: index });
		}
	};

	SelectableListInstance.prototype._updateFocusIndicator = function() {
		var self = this;
		
		this.itemElements.forEach(function(el, index) {
			if (index === self.focusedIndex) {
				el.classAdd('is-focused');
				// Update ARIA
				self.wrapper.attr('aria-activedescendant', 'item-' + self.id + '-' + index);
			} else {
				el.classRemove('is-focused');
			}
		});
	};

	SelectableListInstance.prototype._scrollToFocused = function() {
		if (this.focusedIndex < 0 || !this.itemElements[this.focusedIndex]) return;
		
		var itemEl = this.itemElements[this.focusedIndex].el;
		if (itemEl && itemEl.scrollIntoView) {
			itemEl.scrollIntoView({
				block: 'nearest',
				behavior: this.config.scrollBehavior
			});
		}
	};

	// =========================================================================
	// SELECTION STATE
	// =========================================================================

	SelectableListInstance.prototype._updateSelectionState = function() {
		var self = this;
		
		this.itemElements.forEach(function(el, index) {
			var key = el.attr('data-key');
			var isSelected = self.selectedIds.has(key);
			
			if (isSelected) {
				el.classAdd('is-selected');
				el.attr('aria-selected', 'true');
			} else {
				el.classRemove('is-selected');
				el.attr('aria-selected', 'false');
			}
		});
	};

	SelectableListInstance.prototype._notifySelectionChange = function() {
		var self = this;
		var selectedItems = this.items.filter(function(item, index) {
			var key = self.config.getItemKey(item, index);
			return self.selectedIds.has(key);
		});
		var selectedIds = Array.from(this.selectedIds);
		
		// Announce selection change for screen readers
		if (this.config.announceOnSelect) {
			if (this.config.selectable === 'multi') {
				var count = selectedIds.length;
				var message = count === 0 
					? 'No items selected'
					: count === 1 
						? '1 item selected'
						: count + ' items selected';
				this.announce(message);
			} else if (selectedItems.length > 0) {
				var itemText = this._getItemText(selectedItems[0]);
				this.announce(itemText + ' selected');
			}
		}
		
		if (this.config.onSelect) {
			this.config.onSelect(selectedItems, selectedIds);
		}
		
		this._emit('funky:list:select', {
			selectedItems: selectedItems,
			selectedIds: selectedIds
		});
	};

	// =========================================================================
	// SELECTION API
	// =========================================================================

	/**
	 * Select item(s) by ID
	 * @param {string|string[]} ids - Single ID or array of IDs
	 * @param {Object} options - { silent: boolean, append: boolean }
	 */
	SelectableListInstance.prototype.select = function(ids, options) {
		var self = this;
		options = options || {};
		
		// Normalize to array
		var idArray = Array.isArray(ids) ? ids : [ids];
		
		// Handle single selection mode
		if (this.config.selectable === 'single') {
			if (idArray.length > 0) {
				var id = idArray[0];
				if (!this._canSelect(id, 'select')) return;
				this.selectedIds.clear();
				this.selectedIds.add(String(id));
			}
		} else if (this.config.selectable === 'multi') {
			// Multi mode
			if (!options.append) {
				this.selectedIds.clear();
			}
			idArray.forEach(function(id) {
				if (self._canSelect(id, 'select')) {
					self.selectedIds.add(String(id));
				}
			});
		}
		
		this._updateSelectionState();
		
		if (!options.silent) {
			this._notifySelectionChange();
		}
	};

	/**
	 * Deselect item(s) by ID
	 * @param {string|string[]} ids - Single ID or array of IDs
	 * @param {Object} options - { silent: boolean }
	 */
	SelectableListInstance.prototype.deselect = function(ids, options) {
		var self = this;
		options = options || {};
		
		var idArray = Array.isArray(ids) ? ids : [ids];
		
		idArray.forEach(function(id) {
			if (self._canSelect(id, 'deselect')) {
				self.selectedIds.delete(String(id));
			}
		});
		
		this._updateSelectionState();
		
		if (!options.silent) {
			this._notifySelectionChange();
		}
	};

	/**
	 * Toggle selection of item(s)
	 * @param {string|string[]} ids
	 * @param {Object} options - { silent: boolean }
	 */
	SelectableListInstance.prototype.toggleSelection = function(ids, options) {
		var self = this;
		options = options || {};
		
		var idArray = Array.isArray(ids) ? ids : [ids];
		
		if (this.config.selectable === 'single') {
			var id = String(idArray[0]);
			if (this.selectedIds.has(id)) {
				if (this.config.allowDeselect && this._canSelect(id, 'deselect')) {
					this.selectedIds.delete(id);
				}
			} else {
				if (this._canSelect(id, 'select')) {
					this.selectedIds.clear();
					this.selectedIds.add(id);
				}
			}
		} else if (this.config.selectable === 'multi') {
			idArray.forEach(function(id) {
				var strId = String(id);
				if (self.selectedIds.has(strId)) {
					if (self._canSelect(strId, 'deselect')) {
						self.selectedIds.delete(strId);
					}
				} else {
					if (self._canSelect(strId, 'select')) {
						self.selectedIds.add(strId);
					}
				}
			});
		}
		
		this._updateSelectionState();
		
		if (!options.silent) {
			this._notifySelectionChange();
		}
	};

	/**
	 * Select all items (multi mode only)
	 * @param {Object} options - { silent: boolean }
	 */
	SelectableListInstance.prototype.selectAll = function(options) {
		var self = this;
		options = options || {};
		
		if (this.config.selectable !== 'multi') {
			console.warn('[SelectableList] selectAll only works in multi mode');
			return;
		}
		
		this.items.forEach(function(item, index) {
			var key = self.config.getItemKey(item, index);
			var isDisabled = self.config.isItemDisabled ? self.config.isItemDisabled(item) : false;
			
			if (!isDisabled && self._canSelect(key, 'select')) {
				self.selectedIds.add(String(key));
			}
		});
		
		this._updateSelectionState();
		
		if (!options.silent) {
			this._notifySelectionChange();
		}
	};

	/**
	 * Clear all selections
	 * @param {Object} options - { silent: boolean }
	 */
	SelectableListInstance.prototype.clearSelection = function(options) {
		options = options || {};
		
		this.selectedIds.clear();
		this._updateSelectionState();
		
		if (!options.silent) {
			this._notifySelectionChange();
		}
	};

	/**
	 * Select range of items (for Shift+Click)
	 * @param {number} fromIndex
	 * @param {number} toIndex
	 * @param {Object} options
	 */
	SelectableListInstance.prototype.selectRange = function(fromIndex, toIndex, options) {
		var self = this;
		options = options || {};
		
		if (this.config.selectable !== 'multi') return;
		
		var start = Math.min(fromIndex, toIndex);
		var end = Math.max(fromIndex, toIndex);
		
		for (var i = start; i <= end; i++) {
			var item = this.items[i];
			if (!item) continue;
			
			var key = this.config.getItemKey(item, i);
			var isDisabled = this.config.isItemDisabled ? this.config.isItemDisabled(item) : false;
			
			if (!isDisabled && this._canSelect(key, 'select')) {
				this.selectedIds.add(String(key));
			}
		}
		
		this._updateSelectionState();
		
		if (!options.silent) {
			this._notifySelectionChange();
		}
	};

	/**
	 * Set selection (replace current)
	 * @param {string[]} ids
	 * @param {Object} options
	 */
	SelectableListInstance.prototype.setSelection = function(ids, options) {
		options = options || {};
		this.selectedIds.clear();
		this.select(ids, { silent: true });
		
		if (!options.silent) {
			this._notifySelectionChange();
		}
	};

	/**
	 * Check if item is selected
	 * @param {string} id
	 * @returns {boolean}
	 */
	SelectableListInstance.prototype.isSelected = function(id) {
		return this.selectedIds.has(String(id));
	};

	/**
	 * Check if selection can proceed (via onBeforeSelect)
	 * @private
	 */
	SelectableListInstance.prototype._canSelect = function(id, action) {
		if (!this.config.onBeforeSelect) return true;
		
		var item = this._findItemById(id);
		return this.config.onBeforeSelect(item, action) !== false;
	};

	/**
	 * Find item by ID
	 * @private
	 */
	SelectableListInstance.prototype._findItemById = function(id) {
		var self = this;
		var strId = String(id);
		
		for (var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			var key = String(this.config.getItemKey(item, i));
			if (key === strId) return item;
		}
		
		return null;
	};

	/**
	 * Select the currently focused item
	 * @private
	 */
	SelectableListInstance.prototype._selectFocused = function() {
		if (this.focusedIndex < 0) return;
		
		var item = this.items[this.focusedIndex];
		if (!item) return;
		
		var key = this.config.getItemKey(item, this.focusedIndex);
		this.select(key);
	};

	// =========================================================================
	// PUBLIC API
	// =========================================================================

	/**
	 * Set new items and re-render
	 * @param {Array} items
	 */
	SelectableListInstance.prototype.setItems = function(items) {
		this.items = items.slice();
		this.focusedIndex = this.items.length > 0 ? 0 : -1;
		this._render();
		
		if (this.config.onChange) {
			this.config.onChange(this.items);
		}
	};

	/**
	 * Get current items
	 * @returns {Array}
	 */
	SelectableListInstance.prototype.getItems = function() {
		return this.items.slice();
	};

	/**
	 * Get selected items
	 * @returns {Array}
	 */
	SelectableListInstance.prototype.getSelected = function() {
		var self = this;
		return this.items.filter(function(item, index) {
			var key = self.config.getItemKey(item, index);
			return self.selectedIds.has(key);
		});
	};

	/**
	 * Get selected IDs
	 * @returns {Array}
	 */
	SelectableListInstance.prototype.getSelectedIds = function() {
		return Array.from(this.selectedIds);
	};

	// =========================================================================
	// THEMING METHODS (Phase 5)
	// =========================================================================

	/**
	 * Set density mode
	 * @param {string} density - 'compact' | 'default' | 'comfortable'
	 */
	SelectableListInstance.prototype.setDensity = function(density) {
		var validDensities = ['compact', 'default', 'comfortable'];
		if (validDensities.indexOf(density) === -1) {
			console.warn('SelectableList: Invalid density "' + density + '". Using "default".');
			density = 'default';
		}
		
		// Remove existing density class
		this.wrapper
			.classRemove('selectable-list--compact')
			.classRemove('selectable-list--comfortable');
		
		// Apply new density if not default
		if (density !== 'default') {
			this.wrapper.classAdd('selectable-list--' + density);
		}
		
		// Update config
		this.config.density = density;
		
		return this;
	};

	/**
	 * Set variant style
	 * @param {string|null} variant - null | 'bordered' | 'cards' | 'striped' | 'checkboxes'
	 */
	SelectableListInstance.prototype.setVariant = function(variant) {
		var validVariants = [null, '', 'bordered', 'cards', 'striped', 'checkboxes'];
		if (validVariants.indexOf(variant) === -1) {
			console.warn('SelectableList: Invalid variant "' + variant + '". Removing variant.');
			variant = null;
		}
		
		// Remove existing variant classes
		this.wrapper
			.classRemove('selectable-list--bordered')
			.classRemove('selectable-list--cards')
			.classRemove('selectable-list--striped')
			.classRemove('selectable-list--checkboxes');
		
		// Apply new variant if specified
		if (variant && variant !== '') {
			this.wrapper.classAdd('selectable-list--' + variant);
		}
		
		// Update config
		this.config.variant = variant || null;
		
		return this;
	};

	/**
	 * Get current density
	 * @returns {string}
	 */
	SelectableListInstance.prototype.getDensity = function() {
		return this.config.density || 'default';
	};

	/**
	 * Get current variant
	 * @returns {string|null}
	 */
	SelectableListInstance.prototype.getVariant = function() {
		return this.config.variant || null;
	};

	/**
	 * Get focused item
	 * @returns {Object|null}
	 */
	SelectableListInstance.prototype.getFocused = function() {
		return this.focusedIndex >= 0 ? this.items[this.focusedIndex] : null;
	};

	/**
	 * Get focused index
	 * @returns {number}
	 */
	SelectableListInstance.prototype.getFocusedIndex = function() {
		return this.focusedIndex;
	};

	/**
	 * Focus the list container
	 */
	SelectableListInstance.prototype.focus = function() {
		if (this.wrapper && this.wrapper.el) {
			this.wrapper.el.focus();
		}
	};

	/**
	 * Refresh rendering
	 */
	SelectableListInstance.prototype.refresh = function() {
		this._render();
	};

	/**
	 * Destroy the instance
	 */
	SelectableListInstance.prototype.destroy = function() {
		if (this.isDestroyed) return;
		
		// Unregister keyboard shortcuts
		if (this._keyboardRegistrations) {
			this._keyboardRegistrations.forEach(function(unreg) {
				if (typeof unreg === 'function') unreg();
			});
			this._keyboardRegistrations = [];
		}
		
		// Stop and clean up gesture tracker
		if (this._gestureTracker) {
			this._gestureTracker.stop();
			this._gestureTracker.destroy();
			this._gestureTracker = null;
		}
		
		// Clear type-ahead timer
		if (this._typeTimer) {
			clearTimeout(this._typeTimer);
			this._typeTimer = null;
		}
		
		// Remove event listeners
		if (this.wrapper) {
			this.wrapper.off('click');
			this.wrapper.off('keydown');
			this.wrapper.off('focus');
			this.wrapper.off('blur');
		}
		
		// Clear DOM
		this.container.innerHTML = '';
		
		// Clear references
		this.items = [];
		this.itemElements = [];
		this.selectedIds.clear();
		this.wrapper = null;
		this.isDestroyed = true;
		
		// Remove from registry
		SelectableList.instances.delete(this.id);
	};

	/**
	 * Navigate to specific item by ID
	 * @param {string} id
	 * @returns {boolean} - true if item was found and focused
	 */
	SelectableListInstance.prototype.focusItem = function(id) {
		var strId = String(id);
		
		for (var i = 0; i < this.items.length; i++) {
			var key = String(this.config.getItemKey(this.items[i], i));
			if (key === strId) {
				this.setFocusedIndex(i);
				return true;
			}
		}
		
		return false;
	};

	/**
	 * Navigate by delta (positive = down, negative = up)
	 * @param {number} delta
	 */
	SelectableListInstance.prototype.navigateBy = function(delta) {
		if (delta > 0) {
			for (var i = 0; i < delta; i++) {
				this._navigateDown({ shiftKey: false });
			}
		} else {
			for (var j = 0; j < Math.abs(delta); j++) {
				this._navigateUp({ shiftKey: false });
			}
		}
	};

	// =========================================================================
	// UTILITIES
	// =========================================================================

	SelectableListInstance.prototype._escapeHtml = function(str) {
		if (typeof str !== 'string') return str;
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	};

	SelectableListInstance.prototype._emit = function(eventName, data) {
		if (PubSub) {
			PubSub.emit(eventName, Object.assign({ id: this.id }, data));
		}
	};

	// =========================================================================
	// MODULE API
	// =========================================================================

	var SelectableList = {
		instances: new Map(),
		
		/**
		 * Initialize a new SelectableList
		 * @param {string|HTMLElement} container
		 * @param {Object} options
		 * @returns {SelectableListInstance}
		 */
		init: function(container, options) {
			var el;
			
			if (typeof container === 'string') {
				el = document.querySelector(container);
			} else {
				el = container;
			}
			
			if (!el) {
				console.error('[SelectableList] Container not found:', container);
				return null;
			}
			
			var instance = new SelectableListInstance(el, options);
			SelectableList.instances.set(instance.id, instance);
			
			return instance;
		},
		
		/**
		 * Get instance by ID
		 * @param {string} id
		 * @returns {SelectableListInstance|undefined}
		 */
		getInstance: function(id) {
			return SelectableList.instances.get(id);
		},
		
		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			SelectableList.instances.forEach(function(instance) {
				instance.destroy();
			});
		}
	};

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	Funky.register('SelectableList', SelectableList);
	console.log('[Funky] SelectableList core module loaded');

})(window);
