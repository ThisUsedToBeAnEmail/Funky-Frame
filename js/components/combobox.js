/**
 * Funky.ComboBox - Select2 replacement with native ES5
 * 
 * A full-featured combobox with search, keyboard navigation,
 * single/multi-select modes, and remote data support.
 * 
 * Reuses: Funky.SelectableList, Funky.FuzzySearch
 * 
 * @module Funky.ComboBox
 * @version 1.0.3
 * @requires Funky.Dom
 */
(function(global) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('ComboBox')) {
		return;
	}

	var D = global.Funky && global.Funky.Dom;
	var E = global.Funky && global.Funky.Events;
	var PubSub = global.Funky && global.Funky.PubSub;

	if (!D) {
		console.error('[Funky.ComboBox] Funky.Dom is required');
		return;
	}

	// =========================================================================
	// DEFAULT CONFIGURATION
	// =========================================================================

	var DEFAULTS = {
		// Data
		items: [],
		valueKey: 'id',
		textKey: 'name',
		
		// Behavior
		mode: 'single',                   // 'single' | 'multi'
		searchable: true,
		clearable: true,
		disabled: false,
		placeholder: 'Select...',
		
		// Dropdown
		dropdownParent: null,
		maxHeight: 300,
		minWidth: null,
		dropdownFitContent: false,    // If true, dropdown width fits content instead of trigger width
		
		// Search
		searchPlaceholder: 'Search...',
		minSearchLength: 0,
		fuzzyThreshold: 0.3,
		
		// Remote Data
		remote: null,  // Object: { url, method, dataKey, searchParam, delay, ... }
		
		// Multi-select (Phase 6)
		maxSelection: null,
		maxTags: 5,
		showSelectAll: false,
		tags: false,
		createTag: null,
		scrollTags: false,           // Horizontal scroll for many tags
		
		// Sizing
		size: null,                  // Size variant: 'sm' | 'lg' (null = default/md)
		fixedWidth: null,            // Fixed width (e.g., '300px', 300)
		
		// Rendering / Templates
		renderItem: null,            // Deprecated: use templateResult
		renderSelected: null,        // Deprecated: use templateSelection
		templateResult: null,        // function(item, state) - dropdown item template
		templateSelection: null,     // function(item) - selected value display (single mode)
		templateTag: null,           // function(item) - tag content (multi mode)
		groupBy: null,
		
		// Accessibility
		ariaLabel: null,
		
		// Callbacks
		onChange: null,
		onOpen: null,
		onClose: null,
		onSearch: null,
		onClear: null
	};

	var instanceCounter = 0;
	var _instances = Funky.Registry.createInstanceRegistry('ComboBox');

	// =========================================================================
	// COMBOBOX INSTANCE
	// =========================================================================

	/**
	 * ComboBoxInstance constructor
	 * @param {HTMLElement} element - Original select or input element
	 * @param {Object} options
	 */
	function ComboBoxInstance(element, options) {
		this.id = 'combobox-' + (++instanceCounter);
		this.element = element;
		this.options = Object.assign({}, DEFAULTS, options);
		
		// State
		this._isOpen = false;
		this._isDisabled = this.options.disabled;
		this._value = null;
		this._selectedItems = [];
		this._items = [];
		this._filteredItems = [];
		this._searchQuery = '';
		
		// DOM refs
		this._wrapper = null;
		this._trigger = null;
		this._valueDisplay = null;
		this._clearBtn = null;
		this._arrow = null;
		this._dropdown = null;
		this._searchWrapper = null;
		this._searchInput = null;
		this._listContainer = null;
		this._status = null;
		this._liveRegion = null;
		
		// Components (Phase 2+)
		this._selectableList = null;
		this._fuzzySearch = null;
		
		// Remote state (Phase 5)
		this._remoteState = null;
		
		// Cleanup handlers
		this._cleanups = [];
		
		// Initialize
		this._init();
	}

	// =========================================================================
	// INITIALIZATION
	// =========================================================================

	ComboBoxInstance.prototype._init = function() {
		// Parse options from data attributes
		this._parseDataAttributes();
		
		// Extract items from select options if applicable
		this._extractSelectOptions();
		
		// Set items from options if provided
		if (this.options.items && this.options.items.length > 0) {
			this._items = this.options.items.slice();
			this._filteredItems = this._items.slice();
		}
		
		// Build the DOM
		this._buildDOM();
		
		// Initialize FuzzySearch for filtering (if searchable)
		if (this.options.searchable) {
			this._initFuzzySearch();
		}
		
		// Initialize SelectableList for dropdown items
		this._initSelectableList();
		
		// Bind events
		this._bindEvents();
		
		// Bind scroll pagination for remote data
		this._bindScrollPagination();
		
		// Set initial value from element
		this._syncFromElement();
		
		// Sync initial selection to list
		this._syncSelectionToList();
		
		// Store reference on element
		D.one(this.element).data('combobox-instance', this.id);
		
		console.log('[Funky.ComboBox] Initialized:', this.id);
	};

	// =========================================================================
	// SELECTABLE LIST INTEGRATION
	// =========================================================================

	/**
	 * Initialize SelectableList within the dropdown
	 * Provides keyboard navigation, selection, and consistent item rendering
	 */
	ComboBoxInstance.prototype._initSelectableList = function() {
		var self = this;
		var SelectableList = global.Funky && global.Funky.SelectableList;
		
		if (!SelectableList) {
			console.warn('[Funky.ComboBox] Funky.SelectableList not available, using basic rendering');
			return;
		}
		
		// Transform items for SelectableList format
		var listItems = this._transformItemsForList(this._filteredItems);
		
		// Get initial selection IDs
		var initialSelection = this._selectedItems.map(function(item) {
			return String(item[self.options.valueKey]);
		});
		
		this._selectableList = SelectableList.init(this._listContainer.el, {
			items: listItems,
			selectable: this.options.mode === 'multi' ? 'multi' : 'single',
			selectedIds: initialSelection,
			allowDeselect: true,
			selectOnFocus: false,
			wrapAround: true,
			keyboard: true,
			useKeyboardModule: false, // We handle keyboard ourselves
			typeAhead: true,
			typeAheadTimeout: 500,
			density: 'default',
			ariaLabel: this.options.ariaLabel || 'Options',
			announceOnFocus: true,
			announceOnSelect: true,
			showInstructions: false,
			itemClass: 'combobox__item',
			
			// Item identification
			getItemKey: function(item) {
				return String(item[self.options.valueKey]);
			},
			
			// Check if item is disabled
			isItemDisabled: function(item) {
				return item.disabled === true;
			},
			
			// Custom item rendering
			renderItem: function(item, index, state) {
				return self._renderListItem(item, index, state);
			},
			
			// Selection callbacks
			onSelect: function(selectedItems, selectedIds) {
				self._handleListSelectionChange(selectedItems, selectedIds);
			},
			
			// Activation callback (Enter key)
			onActivate: function(item, index) {
				self._handleListItemActivate(item, index);
			},
			
			// Cancel callback (Escape)
			onCancel: function() {
				self.close();
				self._trigger.el.focus();
			}
		});
		
		console.log('[Funky.ComboBox] SelectableList initialized');
	};

	/**
	 * Transform ComboBox items to SelectableList format
	 */
	ComboBoxInstance.prototype._transformItemsForList = function(items) {
		var self = this;
		return items.map(function(item) {
			// Ensure items have the expected keys
			var transformed = {};
			for (var key in item) {
				if (item.hasOwnProperty(key)) {
					transformed[key] = item[key];
				}
			}
			// Ensure id/name for SelectableList defaults
			if (transformed.id === undefined) {
				transformed.id = item[self.options.valueKey];
			}
			if (transformed.name === undefined) {
				transformed.name = item[self.options.textKey];
			}
			return transformed;
		});
	};

	/**
	 * Render a single item for SelectableList
	 * Returns HTML string
	 */
	ComboBoxInstance.prototype._renderListItem = function(item, index, state) {
		var textKey = this.options.textKey;
		var text = item[textKey] || item.name || item.label || String(item);
		
		// Use highlighted text if available from fuzzy search
		var displayText;
		if (this._searchQuery && item._matches && item._matches.length > 0) {
			displayText = this._highlightMatches(text, item._matches);
		} else {
			displayText = this._escapeHtml(text);
		}
		
		var html = '<div class="combobox__item-inner">';
		
		// Checkbox for multi-select
		if (this.options.mode === 'multi') {
			html += '<span class="combobox__item-check" aria-hidden="true">&#10003;</span>';
		}
		
		// Build state object for template functions
		var templateState = {
			isSelected: state.isSelected,
			isDisabled: item.disabled,
			isHighlighted: state.isFocused,
			index: index,
			displayText: displayText
		};
		
		// Custom render: templateResult > renderItem (deprecated) > default
		var templateFn = this.options.templateResult || this.options.renderItem;
		if (templateFn) {
			var customContent = templateFn(item, templateState);
			if (typeof customContent === 'string') {
				html += customContent;
			} else if (customContent && customContent.el && customContent.el.outerHTML) {
				// Funky.Dom element
				html += customContent.el.outerHTML;
			} else if (customContent instanceof HTMLElement) {
				// Native DOM element
				html += customContent.outerHTML;
			} else if (customContent && customContent.jquery && customContent[0]) {
				// jQuery object
				html += customContent[0].outerHTML;
			} else {
				// Fallback to text
				html += '<span class="combobox__item-text">' + displayText + '</span>';
			}
		} else {
			html += '<span class="combobox__item-text">' + displayText + '</span>';
		}
		
		html += '</div>';
		
		return html;
	};

	/**
	 * Handle selection changes from SelectableList
	 */
	ComboBoxInstance.prototype._handleListSelectionChange = function(selectedItems, selectedIds) {
		var self = this;
		var valueKey = this.options.valueKey;
		var max = this.options.maxSelection;
		
		// Check max selection limit
		if (this.options.mode === 'multi' && max && selectedItems.length > max) {
			// Limit to max, keep existing selections
			selectedItems = selectedItems.slice(0, max);
			this._emitEvent('maxreached', { max: max });
			
			// Re-sync list to remove excess selections
			this._syncSelectionToList();
			return;
		}
		
		// Update internal state
		this._selectedItems = selectedItems.slice();
		
		if (this.options.mode === 'multi') {
			this._value = selectedItems.map(function(item) {
				return item[valueKey];
			});
		} else {
			this._value = selectedItems.length > 0 ? selectedItems[0][valueKey] : null;
		}
		
		// Update UI
		this._updateValueDisplay();
		this._syncToElement();
		
		// Callbacks and events
		if (this.options.onChange) {
			this.options.onChange.call(this, this._value, this._selectedItems);
		}
		this._emitEvent('change', { value: this._value, items: this._selectedItems });
	};

	/**
	 * Handle item activation (Enter key or click)
	 */
	ComboBoxInstance.prototype._handleListItemActivate = function(item, index) {
		if (item.disabled) return;
		
		// For single mode, close after selection
		if (this.options.mode === 'single') {
			// Small delay to let selection complete
			var self = this;
			setTimeout(function() {
				self.close();
				self._trigger.el.focus();
			}, 50);
		}
	};

	/**
	 * Sync current selection to SelectableList
	 */
	ComboBoxInstance.prototype._syncSelectionToList = function() {
		if (!this._selectableList) return;
		
		var self = this;
		var selectedIds = this._selectedItems.map(function(item) {
			return String(item[self.options.valueKey]);
		});
		
		this._selectableList.setSelection(selectedIds, { silent: true });
	};

	/**
	 * Update SelectableList items when items change
	 */
	ComboBoxInstance.prototype._updateSelectableListItems = function() {
		if (!this._selectableList) return;
		
		// Sync selection state BEFORE updating items
		// so the render has the correct isSelected state
		this._syncSelectionToList();
		
		var listItems = this._transformItemsForList(this._filteredItems);
		this._selectableList.setItems(listItems);
	};

	/**
	 * Destroy SelectableList
	 */
	ComboBoxInstance.prototype._destroySelectableList = function() {
		if (this._selectableList) {
			this._selectableList.destroy();
			this._selectableList = null;
		}
	};

	/**
	 * Escape HTML special characters
	 */
	ComboBoxInstance.prototype._escapeHtml = function(str) {
		if (!str) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	};

	// =========================================================================
	// FUZZY SEARCH INTEGRATION
	// =========================================================================

	/**
	 * Initialize FuzzySearch for client-side filtering
	 */
	ComboBoxInstance.prototype._initFuzzySearch = function() {
		var FuzzySearch = global.Funky && global.Funky.FuzzySearch;
		
		if (!FuzzySearch) {
			console.warn('[Funky.ComboBox] Funky.FuzzySearch not available, using simple filter');
			return;
		}
		
		// Build search keys - primary text key plus common alternatives
		var searchKeys = [this.options.textKey];
		if (this.options.textKey !== 'name') searchKeys.push('name');
		if (this.options.textKey !== 'label') searchKeys.push('label');
		if (this.options.textKey !== 'description') searchKeys.push('description');
		
		this._fuzzySearch = FuzzySearch.create({
			threshold: this.options.fuzzyThreshold,
			caseSensitive: false,
			keys: searchKeys
		});
		
		console.log('[Funky.ComboBox] FuzzySearch initialized');
	};

	/**
	 * Highlight matching text in a string
	 * @param {string} text - Original text
	 * @param {Array} matches - Match positions from FuzzySearch
	 * @returns {string} HTML with <mark> tags
	 */
	ComboBoxInstance.prototype._highlightMatches = function(text, matches) {
		if (!text || !matches || matches.length === 0) {
			return this._escapeHtml(text);
		}
		
		// Sort matches by position
		var sorted = matches.slice().sort(function(a, b) {
			return a[0] - b[0];
		});
		
		var result = '';
		var lastIndex = 0;
		
		for (var i = 0; i < sorted.length; i++) {
			var start = sorted[i][0];
			var end = sorted[i][1];
			
			// Add text before match
			if (start > lastIndex) {
				result += this._escapeHtml(text.substring(lastIndex, start));
			}
			
			// Add highlighted match
			result += '<mark>' + this._escapeHtml(text.substring(start, end + 1)) + '</mark>';
			lastIndex = end + 1;
		}
		
		// Add remaining text
		if (lastIndex < text.length) {
			result += this._escapeHtml(text.substring(lastIndex));
		}
		
		return result;
	};

	ComboBoxInstance.prototype._parseDataAttributes = function() {
		var el = this.element;
		var dataset = el.dataset || {};
		
		if (dataset.comboboxPlaceholder) {
			this.options.placeholder = dataset.comboboxPlaceholder;
		}
		if (dataset.comboboxSearchable !== undefined) {
			this.options.searchable = dataset.comboboxSearchable !== 'false';
		}
		if (dataset.comboboxClearable !== undefined) {
			this.options.clearable = dataset.comboboxClearable !== 'false';
		}
		if (dataset.comboboxMode) {
			this.options.mode = dataset.comboboxMode;
		}
		if (dataset.comboboxValueKey) {
			this.options.valueKey = dataset.comboboxValueKey;
		}
		if (dataset.comboboxTextKey) {
			this.options.textKey = dataset.comboboxTextKey;
		}
		if (dataset.comboboxRemoteUrl) {
			this.options.remote = this.options.remote || {};
			this.options.remote.url = dataset.comboboxRemoteUrl;
		}
		if (dataset.comboboxSearchPlaceholder) {
			this.options.searchPlaceholder = dataset.comboboxSearchPlaceholder;
		}
		if (dataset.dropdownFitContent !== undefined) {
			this.options.dropdownFitContent = dataset.dropdownFitContent === 'true';
		}
		if (dataset.comboboxSize) {
			this.options.size = dataset.comboboxSize;
		}
	};

	ComboBoxInstance.prototype._extractSelectOptions = function() {
		if (this.element.tagName !== 'SELECT') return;
		if (this._items.length > 0) return; // Already has items from options
		
		var items = [];
		var options = this.element.options;
		var valueKey = this.options.valueKey;
		var textKey = this.options.textKey;
		
		for (var i = 0; i < options.length; i++) {
			var opt = options[i];
			if (opt.value === '' && i === 0) {
				// First empty option is placeholder
				if (!this.options.placeholder || this.options.placeholder === DEFAULTS.placeholder) {
					this.options.placeholder = opt.text;
				}
				continue;
			}
			var item = {};
			item[valueKey] = opt.value;
			item[textKey] = opt.text;
			item.disabled = opt.disabled;
			item.selected = opt.selected;
			items.push(item);
		}
		
		this._items = items;
		this._filteredItems = items.slice();
	};

	// =========================================================================
	// DOM BUILDING
	// =========================================================================

	ComboBoxInstance.prototype._buildDOM = function() {
		var self = this;
		var el = this.element;
		
		// Hide original element
		el.style.display = 'none';
		el.setAttribute('aria-hidden', 'true');
		el.setAttribute('tabindex', '-1');
		
		// Create wrapper
		this._wrapper = D.create('div')
			.classAdd('combobox')
			.attr('id', this.id)
			.attr('data-mode', this.options.mode);
		
		// Apply fixedWidth if set
		if (this.options.fixedWidth) {
			var width = typeof this.options.fixedWidth === 'number' 
				? this.options.fixedWidth + 'px' 
				: this.options.fixedWidth;
			this._wrapper.style({ width: width });
			this._wrapper.classAdd('combobox--fixed-width');
		}
		
		// Apply scrollTags mode
		if (this.options.scrollTags) {
			this._wrapper.classAdd('combobox--scroll-tags');
		}

		// Apply size variant
		if (this.options.size === 'sm') {
			this._wrapper.classAdd('combobox--sm');
		} else if (this.options.size === 'lg') {
			this._wrapper.classAdd('combobox--lg');
		}

		// Apply dropdown fit content class
		if (this.options.dropdownFitContent) {
			this._wrapper.classAdd('combobox--fit-content');
		}

		// Create trigger
		this._trigger = D.create('div')
			.classAdd('combobox__trigger')
			.attr('role', 'combobox')
			.attr('aria-haspopup', 'listbox')
			.attr('aria-expanded', 'false')
			.attr('aria-owns', this.id + '-listbox')
			.attr('aria-controls', this.id + '-listbox')
			.attr('aria-label', this.options.ariaLabel || this.options.placeholder)
			.attr('tabindex', '0');
		
		if (this.options.searchable) {
			this._trigger.attr('aria-autocomplete', 'list');
		}
		
		// Value display
		this._valueDisplay = D.create('span')
			.classAdd('combobox__value')
			.classAdd('combobox__placeholder')
			.text(this.options.placeholder);
		
		// Clear button
		this._clearBtn = D.create('button')
			.classAdd('combobox__clear')
			.attr('type', 'button')
			.attr('aria-label', 'Clear selection')
			.attr('tabindex', '-1')
			.html('&times;')
			.style({ display: 'none' });
		
		// Arrow
		this._arrow = D.create('span')
			.classAdd('combobox__arrow')
			.attr('aria-hidden', 'true')
			.html('&#9662;');
		
		this._trigger
			.append(this._valueDisplay)
			.append(this._clearBtn)
			.append(this._arrow);
		
		// Create dropdown
		this._dropdown = D.create('div')
			.classAdd('combobox__dropdown')
			.attr('id', this.id + '-listbox')
			.attr('role', 'listbox')
			.attr('hidden', '');
		
		if (this.options.mode === 'multi') {
			this._dropdown.attr('aria-multiselectable', 'true');
		}
		
		// Search input (if searchable)
		if (this.options.searchable) {
			this._searchWrapper = D.create('div')
				.classAdd('combobox__search');
			
			this._searchInput = D.create('input')
				.classAdd('combobox__search-input')
				.attr('type', 'text')
				.attr('role', 'searchbox')
				.attr('placeholder', this.options.searchPlaceholder)
				.attr('aria-label', 'Search options')
				.attr('aria-controls', this.id + '-listbox')
				.attr('autocomplete', 'off')
				.attr('autocorrect', 'off')
				.attr('spellcheck', 'false');
			
			this._searchWrapper.append(this._searchInput);
			this._dropdown.append(this._searchWrapper);
		}
		
		// List container (SelectableList will render here in Phase 2)
		this._listContainer = D.create('div')
			.classAdd('combobox__list')
			.style({ maxHeight: this.options.maxHeight + 'px' });
		this._dropdown.append(this._listContainer);
		
		// Status area (must be created before _renderItems which may call _hideStatus)
		this._status = D.create('div')
			.classAdd('combobox__status')
			.style({ display: 'none' });
		this._dropdown.append(this._status);
		
		// Build dropdown header (Select All / Clear All) for multi-select
		this._buildDropdownHeader();
		
		// Render items (basic render until Phase 2)
		this._renderItems();
		
		// Create live region for a11y announcements
		this._createLiveRegion();
		
		// Assemble
		this._wrapper.append(this._trigger);
		
		// Append dropdown to parent or wrapper
		var dropdownParent = this.options.dropdownParent;
		if (dropdownParent) {
			var parent = typeof dropdownParent === 'string' 
				? D.one(dropdownParent) 
				: D.one(dropdownParent);
			if (parent) {
				parent.append(this._dropdown);
			} else {
				this._wrapper.append(this._dropdown);
			}
		} else {
			this._wrapper.append(this._dropdown);
		}
		
		// Insert after original element
		el.parentNode.insertBefore(this._wrapper.el, el.nextSibling);
		
		// Apply disabled state
		if (this._isDisabled) {
			this._applyDisabled(true);
		}

		// Calculate and apply fixed trigger width if dropdownFitContent is enabled
		if (this.options.dropdownFitContent) {
			this._applyFitContentWidth();
		}
	};

	/**
	 * Calculate the width needed to fit the longest option text and apply to trigger.
	 * This prevents the trigger from changing width when different options are selected.
	 */
	ComboBoxInstance.prototype._applyFitContentWidth = function() {
		var self = this;
		var items = this._items;
		var textKey = this.options.textKey;

		if (!items || items.length === 0) return;

		// Create a hidden measurement element with same styling as trigger
		var measureEl = D.create('span')
			.style({
				position: 'absolute',
				visibility: 'hidden',
				whiteSpace: 'nowrap',
				font: 'inherit',
				padding: '0',
				border: '0'
			});

		// Temporarily append to trigger to inherit font styles
		this._trigger.append(measureEl);

		// Measure each option text
		var maxWidth = 0;
		items.forEach(function(item) {
			var text = item[textKey] || item.name || item.label || String(item.id || '');
			measureEl.text(text);
			var width = measureEl.el.offsetWidth;
			if (width > maxWidth) {
				maxWidth = width;
			}
		});

		// Remove measurement element
		measureEl.remove();

		// Add padding for arrow, clear button, and internal padding
		// Get computed styles to calculate extra space needed
		var triggerEl = this._trigger.el;
		var computedStyle = window.getComputedStyle(triggerEl);
		var paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
		var paddingRight = parseFloat(computedStyle.paddingRight) || 0;

		// Account for arrow (~12px) and potential clear button (~20px) and gap (~8px)
		var extraSpace = 40;
		if (this.options.clearable) {
			extraSpace += 24;
		}

		var totalWidth = maxWidth + paddingLeft + paddingRight + extraSpace;

		// Apply min-width to trigger so it doesn't shrink below widest option
		this._trigger.style({ minWidth: totalWidth + 'px' });
	};

	ComboBoxInstance.prototype._createLiveRegion = function() {
		this._liveRegion = D.create('div')
			.classAdd('combobox__live-region')
			.classAdd('sr-only')
			.attr('role', 'status')
			.attr('aria-live', 'polite')
			.attr('aria-atomic', 'true');
		
		this._wrapper.append(this._liveRegion);
	};

	ComboBoxInstance.prototype._announce = function(message) {
		if (!this._liveRegion) return;
		var self = this;
		
		// Clear and re-set to trigger announcement
		this._liveRegion.text('');
		setTimeout(function() {
			self._liveRegion.text(message);
		}, 50);
	};

	/**
	 * Build dropdown header with Select All / Clear All
	 */
	ComboBoxInstance.prototype._buildDropdownHeader = function() {
		if (this.options.mode !== 'multi') return;
		if (!this.options.showSelectAll) return;
		
		var self = this;
		
		this._dropdownHeader = D.create('div').classAdd('combobox__header');
		
		var selectAllBtn = D.create('button')
			.classAdd('combobox__select-all')
			.attr('type', 'button')
			.attr('tabindex', '-1')
			.text('Select All');
		
		selectAllBtn.on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.selectAll();
		});
		
		var clearAllBtn = D.create('button')
			.classAdd('combobox__clear-all')
			.attr('type', 'button')
			.attr('tabindex', '-1')
			.text('Clear All');
		
		clearAllBtn.on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.clear();
		});
		
		this._dropdownHeader.append(selectAllBtn).append(clearAllBtn);
		
		// Insert before list container
		this._dropdown.el.insertBefore(this._dropdownHeader.el, this._listContainer.el);
	};

	/**
	 * Select all visible items
	 */
	ComboBoxInstance.prototype.selectAll = function() {
		var self = this;
		var valueKey = this.options.valueKey;
		
		var selectableItems = this._filteredItems.filter(function(item) {
			return !item.disabled;
		});
		
		// Check max limit
		var max = this.options.maxSelection;
		if (max && selectableItems.length > max) {
			selectableItems = selectableItems.slice(0, max);
			this._emitEvent('maxreached', { max: max });
		}
		
		this._selectedItems = selectableItems.slice();
		this._value = selectableItems.map(function(item) {
			return item[valueKey];
		});
		
		this._updateValueDisplay();
		this._syncSelectionToList();
		this._syncToElement();
		
		if (this.options.onChange) {
			this.options.onChange.call(this, this._value, this._selectedItems);
		}
		this._emitEvent('change', { value: this._value, items: this._selectedItems });
		
		return this;
	};

	// =========================================================================
	// BASIC ITEM RENDERING (Fallback when SelectableList not available)
	// =========================================================================

	ComboBoxInstance.prototype._renderItems = function() {
		var self = this;
		
		// If SelectableList is active, update its items instead
		if (this._selectableList) {
			this._updateSelectableListItems();
			
			if (this._filteredItems.length === 0) {
				var statusMsg = this._searchQuery ? 'No results found' : 'No items available';
				this._showStatus(statusMsg);
			} else {
				this._hideStatus();
			}
			return;
		}
		
		// Fallback: basic rendering
		var container = this._listContainer;
		container.html('');
		
		if (this._filteredItems.length === 0) {
			var statusMsg = this._searchQuery ? 'No results found' : 'No items available';
			this._showStatus(statusMsg);
			return;
		}
		
		this._hideStatus();
		
		this._filteredItems.forEach(function(item, index) {
			var itemEl = self._renderItem(item, index);
			container.append(itemEl);
		});
	};

	ComboBoxInstance.prototype._renderItem = function(item, index) {
		var self = this;
		var valueKey = this.options.valueKey;
		var textKey = this.options.textKey;
		
		var value = item[valueKey];
		var text = item[textKey] || String(item);
		var isSelected = this._isItemSelected(item);
		var isDisabled = item.disabled;
		
		var itemEl = D.create('div')
			.classAdd('combobox__item')
			.attr('role', 'option')
			.attr('data-value', value)
			.attr('data-index', index)
			.attr('aria-selected', isSelected ? 'true' : 'false')
			.attr('id', this.id + '-item-' + index);
		
		if (isSelected) {
			itemEl.classAdd('is-selected');
		}
		if (isDisabled) {
			itemEl.classAdd('is-disabled');
			itemEl.attr('aria-disabled', 'true');
		}
		
		// Build state object for template functions
		var state = {
			isSelected: isSelected,
			isDisabled: isDisabled,
			isHighlighted: false,
			index: index
		};
		
		// Custom render: templateResult > renderItem (deprecated) > default
		var templateFn = this.options.templateResult || this.options.renderItem;
		if (templateFn) {
			var result = templateFn(item, state);
			this._applyTemplateResult(result, itemEl);
		} else {
			this._defaultRenderItem(item, itemEl);
		}
		
		// Click handler
		if (!isDisabled) {
			itemEl.on('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				self._handleItemClick(item, index);
			});
		}
		
		return itemEl;
	};

	/**
	 * Apply template result to element - handles string, DOM, jQuery, Funky.Dom
	 * @param {string|HTMLElement|Object} result - Template return value
	 * @param {Object} element - Funky.Dom element
	 */
	ComboBoxInstance.prototype._applyTemplateResult = function(result, element) {
		if (result === null || result === undefined) {
			return;
		}
		
		if (typeof result === 'string') {
			// HTML string - use html() for rich content
			element.html(result);
		} else if (result instanceof HTMLElement) {
			// Native DOM element
			element.el.appendChild(result);
		} else if (result && result.el && result.el instanceof HTMLElement) {
			// Funky.Dom wrapped element
			element.el.appendChild(result.el);
		} else if (result && result.jquery && result[0]) {
			// jQuery object
			element.el.appendChild(result[0]);
		} else if (typeof result === 'object' && result.nodeType === 1) {
			// DOM element check fallback
			element.el.appendChild(result);
		}
	};

	ComboBoxInstance.prototype._defaultRenderItem = function(item, element) {
		var textKey = this.options.textKey;
		var text = item[textKey] || String(item);
		
		// Checkbox for multi-select
		if (this.options.mode === 'multi') {
			var checkbox = D.create('span')
				.classAdd('combobox__item-check')
				.html('&#10003;');
			element.append(checkbox);
		}
		
		var label = D.create('span')
			.classAdd('combobox__item-text')
			.text(text);
		element.append(label);
	};

	ComboBoxInstance.prototype._isItemSelected = function(item) {
		var valueKey = this.options.valueKey;
		var itemValue = item[valueKey];
		
		if (this.options.mode === 'multi') {
			return this._selectedItems.some(function(selected) {
				return selected[valueKey] === itemValue;
			});
		} else {
			return this._value === itemValue || String(this._value) === String(itemValue);
		}
	};

	ComboBoxInstance.prototype._handleItemClick = function(item, index) {
		if (item.disabled) return;
		
		if (this.options.mode === 'single') {
			this._selectSingle(item);
		} else {
			this._toggleMulti(item);
		}
	};

	ComboBoxInstance.prototype._selectSingle = function(item) {
		var valueKey = this.options.valueKey;
		var textKey = this.options.textKey;
		
		this._value = item[valueKey];
		this._selectedItems = [item];
		
		this._updateValueDisplay();
		this._renderItems(); // Re-render to update selection state
		this._syncToElement();
		this.close();
		this._trigger.el.focus();
		
		// Announce
		this._announce(item[textKey] + ' selected');
		
		// Callbacks and events
		if (this.options.onChange) {
			this.options.onChange.call(this, this._value, this._selectedItems);
		}
		this._emitEvent('change', { value: this._value, items: this._selectedItems });
	};

	ComboBoxInstance.prototype._toggleMulti = function(item) {
		var self = this;
		var valueKey = this.options.valueKey;
		var textKey = this.options.textKey;
		var itemValue = item[valueKey];
		
		var isSelected = this._selectedItems.some(function(s) {
			return s[valueKey] === itemValue;
		});
		
		if (isSelected) {
			// Deselect
			this._selectedItems = this._selectedItems.filter(function(s) {
				return s[valueKey] !== itemValue;
			});
			this._announce(item[textKey] + ' deselected');
		} else {
			// Check max selection
			if (this.options.maxSelection && this._selectedItems.length >= this.options.maxSelection) {
				this._announce('Maximum selection reached');
				this._emitEvent('maxreached', { max: this.options.maxSelection });
				return;
			}
			// Select
			this._selectedItems.push(item);
			this._announce(item[textKey] + ' selected');
		}
		
		// Update value array
		this._value = this._selectedItems.map(function(s) {
			return s[valueKey];
		});
		
		this._updateValueDisplay();
		this._renderItems();
		this._syncToElement();
		
		// Callbacks and events
		if (this.options.onChange) {
			this.options.onChange.call(this, this._value, this._selectedItems);
		}
		this._emitEvent('change', { value: this._value, items: this._selectedItems });
	};

	// =========================================================================
	// STATUS DISPLAY
	// =========================================================================

	ComboBoxInstance.prototype._showStatus = function(message, isLoading) {
		this._status.text(message).style({ display: 'block' });
		this._listContainer.style({ display: 'none' });
		if (isLoading) {
			this._status.classAdd('is-loading');
		} else {
			this._status.classRemove('is-loading');
		}
	};

	ComboBoxInstance.prototype._hideStatus = function() {
		this._status.style({ display: 'none' });
		this._listContainer.style({ display: 'block' });
	};

	// =========================================================================
	// EVENT BINDING
	// =========================================================================

	ComboBoxInstance.prototype._bindEvents = function() {
		var self = this;
		
		// Trigger click
		this._trigger.on('click', function(e) {
			if (self._isDisabled) return;
			self.toggle();
		});
		
		// Trigger keyboard
		this._trigger.on('keydown', function(e) {
			if (self._isDisabled) return;
			self._handleTriggerKeydown(e);
		});
		
		// Focus tracking
		this._trigger.on('focus', function() {
			self._wrapper.classAdd('is-focused');
			self._emitEvent('focus');
		});
		
		this._trigger.on('blur', function() {
			setTimeout(function() {
				if (!self._isOpen) {
					self._wrapper.classRemove('is-focused');
					self._emitEvent('blur');
				}
			}, 100);
		});
		
		// Clear button
		this._clearBtn.on('click', function(e) {
			e.stopPropagation();
			self.clear();
		});
		
		// Search input
		if (this._searchInput) {
			this._searchInput.on('input', function(e) {
				self._handleSearch(e.target.value);
			});
			
			this._searchInput.on('keydown', function(e) {
				self._handleSearchKeydown(e);
			});
			
			this._searchInput.on('blur', function() {
				setTimeout(function() {
					if (!self._isOpen) {
						self._wrapper.classRemove('is-focused');
					}
				}, 100);
			});
		}
		
		// Click outside to close
		var outsideHandler = function(e) {
			if (!self._isOpen) return;
			// Skip if open() was just called on this tick (allows programmatic open from external buttons)
			if (self._justOpened) return;
			var target = e.target;
			if (!self._wrapper.el.contains(target) &&
				!self._dropdown.el.contains(target)) {
				self.close();
			}
		};
		document.addEventListener('click', outsideHandler);
		this._cleanups.push(function() {
			document.removeEventListener('click', outsideHandler);
		});
		
		// Escape to close - use Funky.Keyboard with scoped handler
		if (Funky.Keyboard) {
			var escapeUnregister = Funky.Keyboard.register({
				key: 'escape',
				scope: 'combobox',
				handler: function() {
					self.close();
					self._trigger.el.focus();
				},
				description: 'Close dropdown',
				group: 'ComboBox'
			});
			this._cleanups.push(escapeUnregister);
		} else {
			// Fallback for environments without Funky.Keyboard
			var escapeHandler = function(e) {
				if (e.key === 'Escape' && self._isOpen) {
					self.close();
					self._trigger.el.focus();
				}
			};
			document.addEventListener('keydown', escapeHandler);
			this._cleanups.push(function() {
				document.removeEventListener('keydown', escapeHandler);
			});
		}

		// Focus trap within dropdown
		this._bindFocusTrap();
	};

	/**
	 * Bind focus trap to keep Tab navigation within dropdown when open
	 * Uses Funky.FocusManager.trapFocus() if available
	 */
	ComboBoxInstance.prototype._bindFocusTrap = function() {
		var self = this;

		// Note: Focus trap is activated/deactivated in open/close methods
		// We set up the handler here but the actual trap uses FocusManager when available

		// For environments without FocusManager, use manual trap
		if (!Funky.FocusManager || !Funky.FocusManager.trapFocus) {
			var trapHandler = function(e) {
				if (e.key !== 'Tab') return;
				if (!self._isOpen) return;

				// Get all focusable elements within dropdown
				var focusableSelectors = [
					'input:not([disabled])',
					'button:not([disabled])',
					'[tabindex]:not([tabindex="-1"])'
				].join(', ');

				var focusable = self._dropdown.el.querySelectorAll(focusableSelectors);
				if (focusable.length === 0) return;

				var first = focusable[0];
				var last = focusable[focusable.length - 1];

				if (e.shiftKey) {
					// Shift+Tab: if on first element, wrap to last
					if (document.activeElement === first) {
						e.preventDefault();
						last.focus();
					}
				} else {
					// Tab: if on last element, wrap to first
					if (document.activeElement === last) {
						e.preventDefault();
						first.focus();
					}
				}
			};

			document.addEventListener('keydown', trapHandler);
			this._cleanups.push(function() {
				document.removeEventListener('keydown', trapHandler);
			});
		}
	};

	ComboBoxInstance.prototype._handleTriggerKeydown = function(e) {
		switch (e.key) {
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (!this._isOpen) {
					this.open();
				} else if (this._selectableList) {
					// Activate highlighted item
					var focusedItem = this._selectableList.getFocused();
					if (focusedItem) {
						this._selectableList.toggleSelection(
							String(focusedItem[this.options.valueKey])
						);
						if (this.options.mode === 'single') {
							this.close();
							this._trigger.el.focus();
						}
					}
				}
				break;
				
			case 'ArrowDown':
				e.preventDefault();
				if (!this._isOpen) {
					this.open();
				} else if (this._selectableList) {
					this._selectableList.setFocusedIndex(
						Math.min(this._selectableList.focusedIndex + 1, this._selectableList.items.length - 1)
					);
				} else {
					this._navigateItems('down');
				}
				break;
				
			case 'ArrowUp':
				e.preventDefault();
				if (!this._isOpen) {
					this.open();
				} else if (this._selectableList) {
					this._selectableList.setFocusedIndex(
						Math.max(this._selectableList.focusedIndex - 1, 0)
					);
				} else {
					this._navigateItems('up');
				}
				break;
				
			case 'Escape':
				if (this._isOpen) {
					this.close();
				}
				break;
				
			case 'Home':
				if (this._isOpen) {
					e.preventDefault();
					if (this._selectableList) {
						this._selectableList.setFocusedIndex(0);
					} else {
						this._navigateItems('first');
					}
				}
				break;
				
			case 'End':
				if (this._isOpen) {
					e.preventDefault();
					if (this._selectableList) {
						this._selectableList.setFocusedIndex(this._selectableList.items.length - 1);
					} else {
						this._navigateItems('last');
					}
				}
				break;
		}
	};

	ComboBoxInstance.prototype._handleSearchKeydown = function(e) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (this._selectableList) {
					this._selectableList.setFocusedIndex(
						Math.min(this._selectableList.focusedIndex + 1, this._selectableList.items.length - 1)
					);
				} else {
					this._navigateItems('down');
				}
				break;
				
			case 'ArrowUp':
				e.preventDefault();
				if (this._selectableList) {
					this._selectableList.setFocusedIndex(
						Math.max(this._selectableList.focusedIndex - 1, 0)
					);
				} else {
					this._navigateItems('up');
				}
				break;
				
			case 'Enter':
				e.preventDefault();
				// Tag creation mode - create new tag if no results
				if (this.options.tags && this._searchQuery.trim() && this._filteredItems.length === 0) {
					this._createNewTag(this._searchQuery.trim());
					return;
				}
				
				if (this._selectableList) {
					var focusedItem = this._selectableList.getFocused();
					if (focusedItem && !focusedItem.disabled) {
						this._selectableList.toggleSelection(
							String(focusedItem[this.options.valueKey])
						);
						if (this.options.mode === 'single') {
							this.close();
							this._trigger.el.focus();
						}
					}
				} else {
					this._selectHighlighted();
				}
				break;
				
			case 'Home':
				e.preventDefault();
				if (this._selectableList) {
					this._selectableList.setFocusedIndex(0);
				} else {
					this._navigateItems('first');
				}
				break;
				
			case 'End':
				e.preventDefault();
				if (this._selectableList) {
					this._selectableList.setFocusedIndex(this._selectableList.items.length - 1);
				} else {
					this._navigateItems('last');
				}
				break;
				
			case 'Escape':
				this.close();
				this._trigger.el.focus();
				break;
				
			case 'Tab':
				this.close();
				break;
				
			case 'Backspace':
				// In multi mode, remove last tag when search is empty
				if (this.options.mode === 'multi' && this._searchQuery === '') {
					this._removeLastSelected();
				}
				break;
		}
	};

	// =========================================================================
	// KEYBOARD NAVIGATION
	// =========================================================================

	ComboBoxInstance.prototype._navigateItems = function(direction) {
		var items = this._listContainer.el.querySelectorAll('.combobox__item:not(.is-disabled)');
		if (items.length === 0) return;
		
		var current = this._listContainer.el.querySelector('.combobox__item.is-highlighted');
		var currentIndex = current ? Array.prototype.indexOf.call(items, current) : -1;
		var nextIndex;
		
		switch (direction) {
			case 'down':
				nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'up':
				nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
				break;
			case 'first':
				nextIndex = 0;
				break;
			case 'last':
				nextIndex = items.length - 1;
				break;
			default:
				return;
		}
		
		// Remove highlight from current
		if (current) {
			D.one(current).classRemove('is-highlighted');
		}
		
		// Add highlight to next
		var nextItem = items[nextIndex];
		if (nextItem) {
			D.one(nextItem).classAdd('is-highlighted');
			this._scrollItemIntoView(nextItem);
			
			// Update active descendant
			var itemId = nextItem.getAttribute('id');
			if (this._searchInput) {
				this._searchInput.attr('aria-activedescendant', itemId);
			} else {
				this._trigger.attr('aria-activedescendant', itemId);
			}
		}
	};

	ComboBoxInstance.prototype._scrollItemIntoView = function(itemEl) {
		var container = this._listContainer.el;
		var itemTop = itemEl.offsetTop;
		var itemBottom = itemTop + itemEl.offsetHeight;
		var containerTop = container.scrollTop;
		var containerBottom = containerTop + container.clientHeight;
		
		if (itemTop < containerTop) {
			container.scrollTop = itemTop;
		} else if (itemBottom > containerBottom) {
			container.scrollTop = itemBottom - container.clientHeight;
		}
	};

	ComboBoxInstance.prototype._selectHighlighted = function() {
		var highlighted = this._listContainer.el.querySelector('.combobox__item.is-highlighted');
		if (!highlighted) return;
		
		var index = parseInt(highlighted.getAttribute('data-index'), 10);
		var item = this._filteredItems[index];
		if (item && !item.disabled) {
			this._handleItemClick(item, index);
		}
	};

	ComboBoxInstance.prototype._removeLastSelected = function() {
		if (this._selectedItems.length === 0) return;
		
		var lastItem = this._selectedItems[this._selectedItems.length - 1];
		this._toggleMulti(lastItem);
	};

	// =========================================================================
	// SEARCH & FILTERING
	// =========================================================================

	ComboBoxInstance.prototype._handleSearch = function(query) {
		this._searchQuery = query.trim();
		
		// Check minimum length
		if (this.options.minSearchLength > 0 && 
			this._searchQuery.length > 0 &&
			this._searchQuery.length < this.options.minSearchLength) {
			this._updateListWithStatus('Type at least ' + this.options.minSearchLength + ' characters');
			this._emitEvent('search', { query: this._searchQuery, minLength: true });
			return;
		}
		
		// Callback
		if (this.options.onSearch) {
			this.options.onSearch.call(this, this._searchQuery);
		}
		
		// Emit search event
		this._emitEvent('search', { query: this._searchQuery });
		
		// Remote search (Phase 5)
		if (this.options.remote && this._searchQuery) {
			this._handleRemoteSearch(this._searchQuery);
			return;
		}
		
		// Client-side filter
		this._performLocalSearch(this._searchQuery);
	};

	ComboBoxInstance.prototype._performLocalSearch = function(query) {
		var self = this;
		var textKey = this.options.textKey;
		
		// No query: show all items
		if (!query) {
			this._filteredItems = this._items.slice();
			this._renderItems();
			return;
		}
		
		// FuzzySearch available: use fuzzy matching
		if (this._fuzzySearch) {
			var results = this._fuzzySearch.search(query, this._items);
			
			this._filteredItems = results.map(function(r) {
				// Create a copy with match metadata for highlighting
				var item = {};
				for (var key in r.item) {
					if (r.item.hasOwnProperty(key)) {
						item[key] = r.item[key];
					}
				}
				item._matches = r.matches;
				item._score = r.score;
				item._matchKey = r.key;
				return item;
			});
		} else {
			// Fallback: simple substring filter
			var lowerQuery = query.toLowerCase();
			this._filteredItems = this._items.filter(function(item) {
				var text = item[textKey] || '';
				return text.toLowerCase().indexOf(lowerQuery) !== -1;
			});
		}
		
		this._renderItems();
		
		// Announce result count
		var count = this._filteredItems.length;
		this._announce(count + ' result' + (count !== 1 ? 's' : '') + ' for ' + query);
	};

	/**
	 * Show a status message (no results, loading, etc.)
	 */
	ComboBoxInstance.prototype._updateListWithStatus = function(message) {
		this._status.text(message).style({ display: 'block' });
		this._listContainer.style({ display: 'none' });
		this._filteredItems = [];
		
		// Also update SelectableList if available
		if (this._selectableList) {
			this._selectableList.setItems([]);
		}
	};

	// =========================================================================
	// REMOTE DATA FETCHING
	// =========================================================================

	/**
	 * Default remote configuration
	 */
	var REMOTE_DEFAULTS = {
		url: null,                    // Required: API endpoint
		method: 'GET',                // GET or POST
		dataKey: 'data',              // Key in response containing items
		totalKey: 'total',            // Key for total count
		searchParam: 'q',             // Query param name for search
		pageParam: 'page',            // Query param for pagination
		limitParam: 'limit',          // Query param for page size
		idParam: 'id',                // Query param for initial value loading
		limit: 20,                    // Items per request
		delay: 300,                   // Debounce delay ms
		minLength: 1,                 // Min chars before search
		cache: true,                  // Cache results
		headers: {},                  // Additional headers
		params: {},                   // Static params
		transformRequest: null,       // function(params) => params
		transformResponse: null       // function(response) => { items, total }
	};

	/**
	 * Initialize remote state
	 */
	ComboBoxInstance.prototype._initRemoteState = function() {
		this._remoteState = {
			loading: false,
			page: 1,
			hasMore: false,
			total: 0,
			cache: {},
			abortController: null,
			debounceTimer: null
		};
	};

	/**
	 * Handle remote search with debouncing
	 */
	ComboBoxInstance.prototype._handleRemoteSearch = function(query) {
		var self = this;
		var remote = this._getRemoteConfig();
		
		// Initialize remote state if needed
		if (!this._remoteState) {
			this._initRemoteState();
		}
		
		// Clear previous debounce
		if (this._remoteState.debounceTimer) {
			clearTimeout(this._remoteState.debounceTimer);
		}
		
		// Check minimum length
		var minLength = remote.minLength || 1;
		if (query.length < minLength) {
			this._filteredItems = [];
			if (query.length > 0) {
				this._updateListWithStatus('Type at least ' + minLength + ' character' + (minLength > 1 ? 's' : ''));
			} else {
				this._updateListWithStatus('Start typing to search');
			}
			return;
		}
		
		// Check cache
		var cacheKey = query.toLowerCase();
		if (remote.cache && this._remoteState.cache[cacheKey]) {
			this._handleRemoteResponse(this._remoteState.cache[cacheKey], query, 1);
			return;
		}
		
		// Debounce the request
		this._remoteState.debounceTimer = setTimeout(function() {
			self._fetchRemoteData(query, 1);
		}, remote.delay || 300);
	};

	/**
	 * Get merged remote configuration
	 */
	ComboBoxInstance.prototype._getRemoteConfig = function() {
		var remote = this.options.remote;
		if (typeof remote === 'string') {
			// Just a URL
			return Object.assign({}, REMOTE_DEFAULTS, { url: remote });
		}
		return Object.assign({}, REMOTE_DEFAULTS, remote);
	};

	/**
	 * Fetch data from remote endpoint
	 */
	ComboBoxInstance.prototype._fetchRemoteData = function(query, page) {
		var self = this;
		var remote = this._getRemoteConfig();
		page = page || 1;
		
		if (!remote.url) {
			console.error('[Funky.ComboBox] Remote URL is required');
			return;
		}
		
		// Abort previous request
		if (this._remoteState.abortController) {
			this._remoteState.abortController.abort();
		}
		
		// Show loading
		this._setLoading(true);
		
		// Build params
		var params = Object.assign({}, remote.params || {});
		params[remote.searchParam || 'q'] = query;
		params[remote.pageParam || 'page'] = page;
		params[remote.limitParam || 'limit'] = remote.limit || 20;
		
		// Transform request if provided
		if (remote.transformRequest) {
			params = remote.transformRequest(params);
		}
		
		// Build URL
		var url = remote.url;
		var method = (remote.method || 'GET').toUpperCase();
		
		// Use Funky.Api if available
		if (Funky.Api && Funky.Api.request) {
			this._fetchWithFunkyApi(url, method, params, remote, query, page);
		} else {
			this._fetchWithNativeFetch(url, method, params, remote, query, page);
		}
	};

	/**
	 * Fetch using Funky.Api (includes CSRF, error handling, etc.)
	 */
	ComboBoxInstance.prototype._fetchWithFunkyApi = function(url, method, params, remote, query, page) {
		var self = this;
		
		// Create abort controller for cancellation
		this._remoteState.abortController = new AbortController();
		
		// Build options for Funky.Api
		var options = {
			method: method,
			headers: remote.headers || {},
			signal: this._remoteState.abortController.signal
		};
		
		if (method === 'GET') {
			// Append params to URL for GET
			var queryString = Object.keys(params).map(function(key) {
				return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
			}).join('&');
			url = url + (url.indexOf('?') === -1 ? '?' : '&') + queryString;
		} else {
			// Body for POST/PUT
			options.body = params;
		}
		
		Funky.Api.request(url, options)
			.then(function(data) {
				self._handleRemoteResponse(data, query, page);
			})
			.catch(function(error) {
				if (error.name === 'AbortError') {
					return; // Request was cancelled
				}
				self._handleRemoteError(error);
			})
			.finally(function() {
				self._setLoading(false);
			});
	};

	/**
	 * Fetch using native fetch API (fallback)
	 */
	ComboBoxInstance.prototype._fetchWithNativeFetch = function(url, method, params, remote, query, page) {
		var self = this;
		
		if (method === 'GET') {
			var queryString = Object.keys(params).map(function(key) {
				return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
			}).join('&');
			url = url + (url.indexOf('?') === -1 ? '?' : '&') + queryString;
		}
		
		// Create abort controller
		this._remoteState.abortController = new AbortController();
		
		// Fetch options
		var fetchOptions = {
			method: method,
			headers: Object.assign({
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}, remote.headers || {}),
			signal: this._remoteState.abortController.signal
		};
		
		if (method === 'POST') {
			fetchOptions.body = JSON.stringify(params);
		}
		
		// Make request
		fetch(url, fetchOptions)
			.then(function(response) {
				if (!response.ok) {
					throw new Error('HTTP ' + response.status);
				}
				return response.json();
			})
			.then(function(data) {
				self._handleRemoteResponse(data, query, page);
			})
			.catch(function(error) {
				if (error.name === 'AbortError') {
					return; // Request was cancelled
				}
				self._handleRemoteError(error);
			})
			.finally(function() {
				self._setLoading(false);
			});
	};

	/**
	 * Handle successful remote response
	 */
	ComboBoxInstance.prototype._handleRemoteResponse = function(response, query, page) {
		var remote = this._getRemoteConfig();
		page = page || 1;
		
		// Transform response if provided
		var items, total;
		if (remote.transformResponse) {
			var transformed = remote.transformResponse(response);
			items = transformed.items || transformed;
			total = transformed.total || items.length;
		} else {
			// Extract items from response
			items = response[remote.dataKey || 'data'];
			if (items === undefined) {
				items = response;
			}
			total = response[remote.totalKey || 'total'] || items.length;
		}
		
		// Ensure array
		if (!Array.isArray(items)) {
			console.warn('[Funky.ComboBox] Remote response is not an array');
			items = [];
		}
		
		// Cache results
		if (remote.cache) {
			this._remoteState.cache[query.toLowerCase()] = response;
		}
		
		// Update state
		this._remoteState.page = page;
		this._remoteState.total = total;
		this._remoteState.hasMore = (page * (remote.limit || 20)) < total;
		
		// Set items
		if (page === 1) {
			this._filteredItems = items;
		} else {
			// Append for pagination (load more)
			this._filteredItems = this._filteredItems.concat(items);
		}
		
		// Update the list
		this._renderItems();
		
		// Announce results
		this._announce(items.length + ' result' + (items.length !== 1 ? 's' : '') + ' found');
		
		// Emit event
		this._emitEvent('load', { items: items, total: total, page: page, query: query });
	};

	/**
	 * Handle remote fetch error
	 */
	ComboBoxInstance.prototype._handleRemoteError = function(error) {
		console.error('[Funky.ComboBox] Remote error:', error);
		this._updateListWithStatus('Error loading data');
		this._emitEvent('error', { error: error });
	};

	/**
	 * Set loading state
	 */
	ComboBoxInstance.prototype._setLoading = function(loading) {
		if (!this._remoteState) {
			this._initRemoteState();
		}
		
		this._remoteState.loading = loading;
		
		if (loading) {
			this._wrapper.classAdd('is-loading');
			this._showStatus('Loading...');
			this._status.classAdd('is-loading');
		} else {
			this._wrapper.classRemove('is-loading');
			this._status.classRemove('is-loading');
		}
	};

	/**
	 * Check if currently loading
	 */
	ComboBoxInstance.prototype.isLoading = function() {
		return this._remoteState ? this._remoteState.loading : false;
	};

	/**
	 * Clear remote cache
	 */
	ComboBoxInstance.prototype.clearCache = function() {
		if (this._remoteState) {
			this._remoteState.cache = {};
		}
		return this;
	};

	/**
	 * Load initial value from remote (when item not in local list)
	 */
	ComboBoxInstance.prototype._loadInitialValue = function(value, options) {
		var self = this;
		var remote = this._getRemoteConfig();
		
		if (!remote.url) return;
		
		// Build URL for fetching specific item(s)
		var idParam = remote.idParam || 'id';
		var values = Array.isArray(value) ? value : [value];
		
		var params = Object.assign({}, remote.params || {});
		params[idParam] = values.join(',');
		
		var url = remote.url;
		var queryString = Object.keys(params).map(function(key) {
			return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
		}).join('&');
		url = url + (url.indexOf('?') === -1 ? '?' : '&') + queryString;
		
		// Use Funky.Api if available
		var fetchPromise;
		if (Funky.Api && Funky.Api.request) {
			fetchPromise = Funky.Api.request(url, { method: 'GET', headers: remote.headers || {} });
		} else {
			fetchPromise = fetch(url, {
				headers: Object.assign({
					'Accept': 'application/json'
				}, remote.headers || {})
			}).then(function(r) { return r.json(); });
		}
		
		fetchPromise
			.then(function(response) {
				var items = remote.transformResponse
					? remote.transformResponse(response).items
					: (response[remote.dataKey || 'data'] || response);
				
				// Ensure array
				if (!Array.isArray(items)) {
					items = [items];
				}
				
				// Add to local items (if not already present)
				items.forEach(function(item) {
					if (!self._findItemByValue(item[self.options.valueKey])) {
						self._items.push(item);
					}
				});
				
				// Now set value with items available (skipRemote to prevent loop)
				self.setValue(value, Object.assign({}, options, { skipRemote: true }));
			})
			.catch(function(error) {
				console.warn('[Funky.ComboBox] Failed to load initial value:', error);
			});
	};

	/**
	 * Load more results (for pagination)
	 */
	ComboBoxInstance.prototype.loadMore = function() {
		if (!this._remoteState || !this._remoteState.hasMore || this._remoteState.loading) {
			return this;
		}
		
		this._fetchRemoteData(this._searchQuery, this._remoteState.page + 1);
		return this;
	};

	/**
	 * Bind scroll pagination (infinite scroll)
	 */
	ComboBoxInstance.prototype._bindScrollPagination = function() {
		if (!this.options.remote) return;
		
		var self = this;
		var listEl = this._listContainer.el;
		
		var scrollHandler = function() {
			// Skip if loading or no more data
			if (!self._remoteState) return;
			if (self._remoteState.loading) return;
			if (!self._remoteState.hasMore) return;
			
			var scrollTop = listEl.scrollTop;
			var scrollHeight = listEl.scrollHeight;
			var clientHeight = listEl.clientHeight;
			
			// Load more when 80% scrolled
			if (scrollTop + clientHeight >= scrollHeight * 0.8) {
				self.loadMore();
			}
		};
		
		listEl.addEventListener('scroll', scrollHandler);
		this._cleanups.push(function() {
			listEl.removeEventListener('scroll', scrollHandler);
		});
	};

	/**
	 * Render load more button (optional alternative to infinite scroll)
	 */
	ComboBoxInstance.prototype._renderLoadMoreButton = function() {
		if (!this._remoteState || !this._remoteState.hasMore) return;
		
		var self = this;
		
		// Remove existing button if present
		var existing = this._listContainer.one('.combobox__load-more');
		if (existing) {
			existing.remove();
		}
		
		var btn = D.create('button')
			.classAdd('combobox__load-more')
			.attr('type', 'button')
			.text('Load more...');
		
		btn.on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.loadMore();
		});
		
		this._listContainer.append(btn);
	};

	/**
	 * Refresh data (clear cache and reload)
	 */
	ComboBoxInstance.prototype.refresh = function() {
		this.clearCache();
		if (this._isOpen && this.options.remote) {
			this._handleRemoteSearch(this._searchQuery || '');
		}
		return this;
	};

	// =========================================================================
	// OPEN / CLOSE
	// =========================================================================

	ComboBoxInstance.prototype.open = function() {
		if (this._isOpen || this._isDisabled) return this;

		// Store trigger for focus restoration
		this._previousFocus = document.activeElement;

		// Set flag to prevent immediate close from document click handler
		// This allows programmatic open() from external buttons to work
		this._justOpened = true;
		var self = this;
		setTimeout(function() { self._justOpened = false; }, 0);

		this._isOpen = true;
		this._dropdown.attr('hidden', null);
		this._trigger.attr('aria-expanded', 'true');
		this._wrapper.classAdd('is-open');

		// Position dropdown
		this._positionDropdown();

		// Focus search input if searchable, using FocusManager if available
		if (this._searchInput) {
			if (Funky.FocusManager && Funky.FocusManager.focusAndPush) {
				Funky.FocusManager.focusAndPush(this._searchInput.el, {
					label: 'ComboBox search'
				});
			} else {
				this._searchInput.el.focus();
			}
		}
		
		// Set initial focus in list
		if (this._selectableList) {
			// Focus first item or selected item
			var selectedIndex = -1;
			if (this._selectedItems.length > 0) {
				var selectedValue = String(this._selectedItems[0][this.options.valueKey]);
				for (var i = 0; i < this._selectableList.items.length; i++) {
					var itemValue = String(this._selectableList.items[i][this.options.valueKey]);
					if (itemValue === selectedValue) {
						selectedIndex = i;
						break;
					}
				}
			}
			this._selectableList.setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
		} else if (!this._searchInput) {
			// Fallback: highlight first item
			this._navigateItems('first');
		}
		
		// Announce
		this._announce(this._filteredItems.length + ' options available');
		
		// Callback
		if (this.options.onOpen) {
			this.options.onOpen.call(this);
		}
		
		// Activate focus trap using FocusManager if available
		if (Funky.FocusManager && Funky.FocusManager.trapFocus) {
			this._focusTrapCleanup = Funky.FocusManager.trapFocus(this._dropdown.el, {
				autoFocus: false // We handle focus ourselves above
			});
		}

		// Push keyboard scope for Escape handling
		if (Funky.Keyboard && Funky.Keyboard.pushScope) {
			Funky.Keyboard.pushScope('combobox');
		}

		// Emit events
		this._emitEvent('open');
		return this;
	};

	ComboBoxInstance.prototype.close = function() {
		if (!this._isOpen) return this;

		// Release focus trap
		if (this._focusTrapCleanup) {
			this._focusTrapCleanup();
			this._focusTrapCleanup = null;
		}

		this._isOpen = false;
		this._dropdown.attr('hidden', '');
		this._trigger.attr('aria-expanded', 'false');
		this._wrapper.classRemove('is-open');

		// Clear search and reset filter
		if (this._searchInput) {
			this._searchInput.val('');
		}
		this._searchQuery = '';
		this._filteredItems = this._items.slice();
		this._renderItems();

		// Clear highlight
		var highlighted = this._listContainer.el.querySelector('.combobox__item.is-highlighted');
		if (highlighted) {
			D.one(highlighted).classRemove('is-highlighted');
		}

		// Clear active descendant
		if (this._searchInput) {
			this._searchInput.attr('aria-activedescendant', null);
		}
		this._trigger.attr('aria-activedescendant', null);

		// Pop keyboard scope
		if (Funky.Keyboard && Funky.Keyboard.popScope) {
			Funky.Keyboard.popScope();
		}

		// Restore focus via FocusManager or fallback
		if (Funky.FocusManager && Funky.FocusManager.popFocus) {
			var restored = Funky.FocusManager.popFocus();
			if (!restored && this._previousFocus && document.body.contains(this._previousFocus)) {
				try {
					this._previousFocus.focus();
				} catch (e) {
					// Element may not be focusable
				}
			}
		} else if (this._previousFocus && document.body.contains(this._previousFocus)) {
			try {
				this._previousFocus.focus();
			} catch (e) {
				// Element may not be focusable
			}
		}
		this._previousFocus = null;

		// Callback
		if (this.options.onClose) {
			this.options.onClose.call(this);
		}

		// Emit events
		this._emitEvent('close');
		return this;
	};

	ComboBoxInstance.prototype.toggle = function() {
		if (this._isOpen) {
			this.close();
		} else {
			this.open();
		}
		return this;
	};

	ComboBoxInstance.prototype.isOpen = function() {
		return this._isOpen;
	};

	ComboBoxInstance.prototype._positionDropdown = function() {
		var triggerRect = this._trigger.el.getBoundingClientRect();
		var dropdown = this._dropdown.el;
		var fitContent = this.options.dropdownFitContent;

		// Set width behavior based on dropdownFitContent option
		if (fitContent) {
			// Fit content: set min-width to trigger width, let width be auto
			dropdown.style.minWidth = triggerRect.width + 'px';
			dropdown.style.width = 'auto';
			dropdown.style.whiteSpace = 'nowrap';
		} else {
			// Default: match trigger width
			dropdown.style.minWidth = triggerRect.width + 'px';
		}

		// If dropdown is in a different parent (e.g., modal), position absolutely
		if (this.options.dropdownParent) {
			var parent = typeof this.options.dropdownParent === 'string'
				? document.querySelector(this.options.dropdownParent)
				: this.options.dropdownParent;

			if (parent) {
				var parentRect = parent.getBoundingClientRect();
				var scrollTop = parent.scrollTop || 0;
				var scrollLeft = parent.scrollLeft || 0;

				// Calculate position relative to parent
				var top = triggerRect.bottom - parentRect.top + scrollTop;
				var left = triggerRect.left - parentRect.left + scrollLeft;

				dropdown.style.position = 'absolute';
				dropdown.style.top = top + 'px';
				dropdown.style.left = left + 'px';
				dropdown.style.right = 'auto'; // Override CSS right: 0
				if (!fitContent) {
					dropdown.style.width = triggerRect.width + 'px';
				}
				dropdown.style.zIndex = '9999';

				// Check if dropdown would go below viewport and flip if needed
				var viewportHeight = window.innerHeight;
				var dropdownHeight = dropdown.offsetHeight || 300; // estimate if not yet rendered

				if (triggerRect.bottom + dropdownHeight > viewportHeight) {
					// Flip to open upward
					top = triggerRect.top - parentRect.top + scrollTop - dropdownHeight;
					if (top > 0) {
						dropdown.style.top = top + 'px';
					}
				}
			}
		}
	};

	// =========================================================================
	// VALUE MANAGEMENT
	// =========================================================================

	ComboBoxInstance.prototype.getValue = function() {
		return this._value;
	};

	ComboBoxInstance.prototype.getSelectedItems = function() {
		return this._selectedItems.slice();
	};

	ComboBoxInstance.prototype.getText = function() {
		if (this._selectedItems.length === 0) return '';
		
		var textKey = this.options.textKey;
		return this._selectedItems.map(function(item) {
			return item[textKey] || '';
		}).join(', ');
	};

	ComboBoxInstance.prototype.getFilteredItems = function() {
		return this._filteredItems.slice();
	};

	ComboBoxInstance.prototype.setValue = function(value, options) {
		options = options || {};
		var self = this;
		var valueKey = this.options.valueKey;
		
		// Handle null/undefined - clear
		if (value === null || value === undefined) {
			this._clearSelection(options.silent);
			return this;
		}
		
		// Handle array for multi-select
		var values = Array.isArray(value) ? value : [value];
		
		// Find matching items
		var selectedItems = [];
		values.forEach(function(v) {
			var item = self._findItemByValue(v);
			if (item) {
				selectedItems.push(item);
			}
		});
		
		// If no items found and remote is configured, try to load from server
		if (selectedItems.length === 0 && this.options.remote && !options.skipRemote) {
			this._loadInitialValue(value, options);
			return this;
		}
		
		if (selectedItems.length === 0) {
			console.warn('[Funky.ComboBox] No items found for value:', value);
			return this;
		}
		
		// Update state
		if (this.options.mode === 'multi') {
			// Enforce maxSelection limit
			if (this.options.maxSelection && selectedItems.length > this.options.maxSelection) {
				selectedItems = selectedItems.slice(0, this.options.maxSelection);
			}
			this._selectedItems = selectedItems;
			this._value = selectedItems.map(function(item) {
				return item[valueKey];
			});
		} else {
			this._selectedItems = [selectedItems[0]];
			this._value = selectedItems[0][valueKey];
		}
		
		// Update UI
		this._updateValueDisplay();
		this._renderItems();
		this._syncToElement();
		
		// Fire events unless silent
		if (!options.silent) {
			if (this.options.onChange) {
				this.options.onChange.call(this, this._value, this._selectedItems);
			}
			this._emitEvent('change', { value: this._value, items: this._selectedItems });
		}
		
		return this;
	};

	ComboBoxInstance.prototype._findItemByValue = function(value) {
		var valueKey = this.options.valueKey;
		for (var i = 0; i < this._items.length; i++) {
			if (String(this._items[i][valueKey]) === String(value)) {
				return this._items[i];
			}
		}
		return null;
	};

	ComboBoxInstance.prototype.clear = function() {
		this._clearSelection(false);
		return this;
	};

	ComboBoxInstance.prototype._clearSelection = function(silent) {
		var hadValue = this._value !== null && 
			(Array.isArray(this._value) ? this._value.length > 0 : true);
		
		this._value = this.options.mode === 'multi' ? [] : null;
		this._selectedItems = [];
		
		this._updateValueDisplay();
		this._renderItems();
		this._syncToElement();
		
		// Announce
		if (hadValue) {
			this._announce('Selection cleared');
		}
		
		if (!silent && hadValue) {
			if (this.options.onClear) {
				this.options.onClear.call(this);
			}
			if (this.options.onChange) {
				this.options.onChange.call(this, this._value, this._selectedItems);
			}
			this._emitEvent('clear');
			this._emitEvent('change', { value: this._value, items: this._selectedItems });
		}
	};

	ComboBoxInstance.prototype._updateValueDisplay = function() {
		if (this._selectedItems.length === 0) {
			this._valueDisplay
				.html('')
				.text(this.options.placeholder)
				.classAdd('combobox__placeholder');
			this._clearBtn.style({ display: 'none' });
			return;
		}
		
		this._valueDisplay.classRemove('combobox__placeholder');
		
		if (this.options.mode === 'single') {
			var item = this._selectedItems[0];
			// Use templateSelection > renderSelected (deprecated) > default
			var templateFn = this.options.templateSelection || this.options.renderSelected;
			
			if (templateFn) {
				this._valueDisplay.html('');
				var result = templateFn(item);
				this._applyTemplateResult(result, this._valueDisplay);
			} else {
				var text = item[this.options.textKey] || String(item);
				this._valueDisplay.text(text);
			}
		} else {
			// Multi mode - render tags
			this._renderTags();
		}
		
		if (this.options.clearable) {
			this._clearBtn.style({ display: 'flex' });
		}
	};

	/**
	 * Render tags for multi-select
	 */
	ComboBoxInstance.prototype._renderTags = function() {
		var self = this;
		
		this._valueDisplay.html('');
		
		var items = this._selectedItems;
		var displayItems;
		var remaining = 0;
		
		// If scrollTags is enabled, show all tags (scrollable)
		if (this.options.scrollTags) {
			displayItems = items;
		} else {
			var maxTags = this.options.maxTags || 5;
			displayItems = items.slice(0, maxTags);
			remaining = items.length - maxTags;
		}
		
		displayItems.forEach(function(item, index) {
			var tag = self._createTag(item, index);
			self._valueDisplay.append(tag);
		});
		
		// Show "+N more" if truncated (only when not scrolling)
		if (remaining > 0) {
			var more = D.create('span')
				.classAdd('combobox__tag-more')
				.text('+' + remaining + ' more');
			this._valueDisplay.append(more);
		}
	};

	/**
	 * Create a tag element
	 */
	ComboBoxInstance.prototype._createTag = function(item, index) {
		var self = this;
		
		var text = item[this.options.textKey] || String(item);
		var value = item[this.options.valueKey];
		
		var tag = D.create('span')
			.classAdd('combobox__tag')
			.attr('data-value', value)
			.attr('data-index', index);
		
		// Tag content container (for custom template or default)
		var tagContent = D.create('span')
			.classAdd('combobox__tag-content');
		
		// Use templateTag for custom tag content, else default text
		if (this.options.templateTag) {
			var result = this.options.templateTag(item, { index: index });
			this._applyTemplateResult(result, tagContent);
		} else {
			var label = D.create('span')
				.classAdd('combobox__tag-text')
				.text(text);
			tagContent.append(label);
		}
		
		tag.append(tagContent);
		
		// Remove button (always added after content)
		var removeBtn = D.create('button')
			.classAdd('combobox__tag-remove')
			.attr('type', 'button')
			.attr('aria-label', 'Remove ' + text)
			.attr('tabindex', '-1')
			.html('&times;');
		
		removeBtn.on('click', function(e) {
			e.stopPropagation();
			self._removeTag(value);
		});
		
		tag.append(removeBtn);
		
		return tag;
	};

	/**
	 * Remove a tag by value
	 */
	ComboBoxInstance.prototype._removeTag = function(value) {
		var self = this;
		var valueKey = this.options.valueKey;
		
		// Find and remove item from selection
		this._selectedItems = this._selectedItems.filter(function(item) {
			return String(item[valueKey]) !== String(value);
		});
		
		// Update value array
		this._value = this._selectedItems.map(function(item) {
			return item[valueKey];
		});
		
		// Update UI
		this._updateValueDisplay();
		this._syncSelectionToList();
		this._syncToElement();
		
		// Callbacks and events
		if (this.options.onChange) {
			this.options.onChange.call(this, this._value, this._selectedItems);
		}
		this._emitEvent('change', { value: this._value, items: this._selectedItems });
		this._emitEvent('tagremove', { value: value });
	};

	/**
	 * Create a new tag from search text (tags mode)
	 */
	ComboBoxInstance.prototype._createNewTag = function(text) {
		var self = this;
		var valueKey = this.options.valueKey;
		var textKey = this.options.textKey;
		var newItem;
		
		if (this.options.createTag) {
			newItem = this.options.createTag(text);
		} else {
			newItem = {};
			newItem[valueKey] = text;
			newItem[textKey] = text;
			newItem._isNew = true;
		}
		
		// Check if already exists
		var existingItem = this._findItemByValue(newItem[valueKey]);
		if (existingItem) {
			// Select existing item instead
			if (this.options.mode === 'multi') {
				if (this._selectedItems.indexOf(existingItem) === -1) {
					this._selectedItems.push(existingItem);
					this._value.push(existingItem[valueKey]);
				}
			} else {
				this._selectedItems = [existingItem];
				this._value = existingItem[valueKey];
			}
		} else {
			// Add to items
			this._items.push(newItem);
			
			// Select it
			if (this.options.mode === 'multi') {
				this._selectedItems.push(newItem);
				this._value = this._selectedItems.map(function(item) {
					return item[valueKey];
				});
			} else {
				this._selectedItems = [newItem];
				this._value = newItem[valueKey];
			}
		}
		
		// Update UI
		this._updateValueDisplay();
		this._syncSelectionToList();
		this._syncToElement();
		
		// Clear search
		if (this._searchInput) {
			this._searchInput.val('');
			this._handleSearch('');
		}
		
		// Callbacks and events
		if (this.options.onChange) {
			this.options.onChange.call(this, this._value, this._selectedItems);
		}
		this._emitEvent('change', { value: this._value, items: this._selectedItems });
		this._emitEvent('tagcreate', { item: newItem, text: text });
	};

	// =========================================================================
	// ELEMENT SYNC
	// =========================================================================

	ComboBoxInstance.prototype._syncFromElement = function() {
		if (this.element.tagName === 'SELECT') {
			// Check for selected options
			var selectedOptions = this.element.selectedOptions || 
				Array.prototype.filter.call(this.element.options, function(o) { return o.selected; });
			
			if (selectedOptions.length > 0 && selectedOptions[0].value) {
				if (this.options.mode === 'multi') {
					var values = Array.prototype.map.call(selectedOptions, function(o) { return o.value; });
					this.setValue(values, { silent: true });
				} else {
					this.setValue(selectedOptions[0].value, { silent: true });
				}
			}
		} else if (this.element.tagName === 'INPUT') {
			var value = this.element.value;
			if (value) {
				this.setValue(value, { silent: true });
			}
		}
	};

	ComboBoxInstance.prototype._syncToElement = function() {
		if (this.element.tagName === 'SELECT') {
			if (this.options.mode === 'multi') {
				var values = Array.isArray(this._value) ? this._value : [];
				var options = this.element.options;
				for (var i = 0; i < options.length; i++) {
					options[i].selected = values.indexOf(options[i].value) !== -1 ||
						values.indexOf(String(options[i].value)) !== -1;
				}
			} else {
				this.element.value = this._value || '';
			}
		} else if (this.element.tagName === 'INPUT') {
			if (this.options.mode === 'multi') {
				this.element.value = Array.isArray(this._value) ? this._value.join(',') : '';
			} else {
				this.element.value = this._value || '';
			}
		}
		
		// Trigger native events for form validation
		var changeEvent = new Event('change', { bubbles: true });
		this.element.dispatchEvent(changeEvent);
		
		var inputEvent = new Event('input', { bubbles: true });
		this.element.dispatchEvent(inputEvent);
	};

	// =========================================================================
	// ITEMS MANAGEMENT
	// =========================================================================

	ComboBoxInstance.prototype.getItems = function() {
		return this._items.slice();
	};

	ComboBoxInstance.prototype.setItems = function(items) {
		this._items = items.slice();
		this._filteredItems = items.slice();

		// Clear selection since items changed
		this._value = this.options.mode === 'multi' ? [] : null;
		this._selectedItems = [];

		// Clear search query
		this._searchQuery = '';
		if (this._searchInput) {
			this._searchInput.el.value = '';
		}

		// Update display
		this._updateValueDisplay();
		this._renderItems();

		// Sync to form element
		this._syncToElement();

		return this;
	};

	// =========================================================================
	// DISABLED STATE
	// =========================================================================

	ComboBoxInstance.prototype._applyDisabled = function(disabled) {
		this._isDisabled = disabled;
		if (disabled) {
			this._wrapper.classAdd('is-disabled');
			this._trigger.attr('aria-disabled', 'true');
			this._trigger.attr('tabindex', '-1');
		} else {
			this._wrapper.classRemove('is-disabled');
			this._trigger.attr('aria-disabled', null);
			this._trigger.attr('tabindex', '0');
		}
	};

	ComboBoxInstance.prototype.enable = function() {
		this._applyDisabled(false);
		return this;
	};

	ComboBoxInstance.prototype.disable = function() {
		this.close();
		this._applyDisabled(true);
		return this;
	};

	ComboBoxInstance.prototype.isDisabled = function() {
		return this._isDisabled;
	};

	// =========================================================================
	// VALIDATION
	// =========================================================================

	ComboBoxInstance.prototype.validate = function() {
		var isRequired = this.element.hasAttribute('required');
		if (!isRequired) return true;
		
		var hasValue = this.options.mode === 'multi'
			? this._selectedItems.length > 0
			: this._value !== null && this._value !== '';
		
		if (!hasValue) {
			this._wrapper.classAdd('is-invalid');
			return false;
		}
		
		this._wrapper.classRemove('is-invalid');
		return true;
	};

	// =========================================================================
	// FOCUS
	// =========================================================================

	ComboBoxInstance.prototype.focus = function() {
		this._trigger.el.focus();
		return this;
	};

	// =========================================================================
	// EVENT EMISSION
	// =========================================================================

	ComboBoxInstance.prototype._emitEvent = function(eventName, detail) {
		detail = detail || {};
		detail.instance = this;

		// Fire on original element (DOM events use dot notation)
		var event = new CustomEvent('funky.combobox.' + eventName, {
			bubbles: true,
			cancelable: true,
			detail: detail
		});
		this.element.dispatchEvent(event);

		// Fire on wrapper (DOM events use dot notation)
		var wrapperEvent = new CustomEvent('funky.combobox.' + eventName, {
			bubbles: true,
			cancelable: true,
			detail: detail
		});
		this._wrapper.el.dispatchEvent(wrapperEvent);

		// PubSub (uses colon notation)
		if (PubSub) {
			PubSub.emit('funky:combobox:' + eventName, detail);
		}
	};

	// Event listener methods (DOM events use dot notation)
	ComboBoxInstance.prototype.on = function(eventName, handler) {
		this.element.addEventListener('funky.combobox.' + eventName, handler);
		return this;
	};

	ComboBoxInstance.prototype.off = function(eventName, handler) {
		this.element.removeEventListener('funky.combobox.' + eventName, handler);
		return this;
	};

	ComboBoxInstance.prototype.once = function(eventName, handler) {
		var self = this;
		var wrapped = function(e) {
			self.off(eventName, wrapped);
			handler.call(self, e);
		};
		return this.on(eventName, wrapped);
	};

	// =========================================================================
	// DESTROY
	// =========================================================================

	ComboBoxInstance.prototype.destroy = function() {
		// Close if open
		this.close();
		
		// Run cleanups
		this._cleanups.forEach(function(fn) { fn(); });
		this._cleanups = [];
		
		// Abort pending remote requests
		if (this._remoteState) {
			if (this._remoteState.abortController) {
				this._remoteState.abortController.abort();
			}
			if (this._remoteState.debounceTimer) {
				clearTimeout(this._remoteState.debounceTimer);
			}
			this._remoteState = null;
		}
		
		// Destroy SelectableList if exists
		if (this._selectableList) {
			this._selectableList.destroy();
			this._selectableList = null;
		}
		
		// Remove dropdown if moved to different parent
		if (this._dropdown.el.parentNode !== this._wrapper.el) {
			this._dropdown.remove();
		}
		
		// Remove wrapper
		this._wrapper.remove();
		
		// Show original element
		this.element.style.display = '';
		this.element.removeAttribute('aria-hidden');
		this.element.removeAttribute('tabindex');
		D.one(this.element).data('combobox-instance', null);
		
		// Remove from registry
		_instances.unregister(this.id);
		
		console.log('[Funky.ComboBox] Destroyed:', this.id);
	};

	// =========================================================================
	// PUBLIC API
	// =========================================================================

	var ComboBox = {
		/**
		 * Initialize a new ComboBox
		 * @param {string|HTMLElement} selector
		 * @param {Object} options
		 * @returns {ComboBoxInstance}
		 */
		init: function(selector, options) {
			var element = typeof selector === 'string' 
				? document.querySelector(selector) 
				: selector;
			
			if (!element) {
				console.error('[Funky.ComboBox] Element not found:', selector);
				return null;
			}
			
			// Check if already initialized
			var existingId = D.one(element).data('combobox-instance');
			if (existingId && _instances.get(existingId)) {
				return _instances.get(existingId);
			}
			
			var instance = new ComboBoxInstance(element, options);
			_instances.register(instance.id, instance);
			return instance;
		},
		
		/**
		 * Get instance by ID or element
		 * @param {string|HTMLElement} idOrElement
		 * @returns {ComboBoxInstance|null}
		 */
		getInstance: function(idOrElement) {
			if (typeof idOrElement === 'string') {
				// Check if it's an ID
				var byId = _instances.get(idOrElement);
				if (byId) return byId;
				// Try as selector
				var el = document.querySelector(idOrElement);
				if (el) {
					var id = D.one(el).data('combobox-instance');
					return _instances.get(id);
				}
			} else if (idOrElement && idOrElement.nodeType) {
				var id = D.one(idOrElement).data('combobox-instance');
				return _instances.get(id);
			}
			return null;
		},
		
		/**
		 * Alias for getInstance (short form)
		 * @param {string|HTMLElement} idOrElement
		 * @returns {ComboBoxInstance|null}
		 */
		get: function(idOrElement) {
			return this.getInstance(idOrElement);
		},
		
		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},
		
		/**
		 * Get all instances
		 * @returns {Object}
		 */
		getAll: function() {
			return _instances.getAll();
		},
		
		/**
		 * Auto-initialize all [data-combobox] elements
		 * @param {HTMLElement} container
		 * @returns {ComboBoxInstance[]}
		 */
		initAll: function(container) {
			var root = container || document;
			var elements = root.querySelectorAll('[data-combobox]');
			var results = [];
			
			for (var i = 0; i < elements.length; i++) {
				var el = elements[i];
				if (!D.one(el).data('combobox-instance')) {
					var instance = ComboBox.init(el);
					if (instance) {
						results.push(instance);
					}
				}
			}
			
			return results;
		}
	};

	// =========================================================================
	// LIVEBINDING INTEGRATION
	// =========================================================================

	if (Funky.LiveBinding) {
		// Register ComboBox in the component registries for instance lookup
		if (Funky.LiveBinding.registerRegistry) {
			Funky.LiveBinding.registerRegistry('ComboBox');
		}

		// Register component adapter
		if (Funky.LiveBinding.registerComponent) {
			Funky.LiveBinding.registerComponent('combobox', {
				/**
				 * Check if element is a ComboBox
				 * @param {HTMLElement} element
				 * @returns {boolean}
				 */
				supports: function(element) {
					return element.hasAttribute('data-combobox') ||
						element.classList.contains('combobox') ||
						_instances.get(element.id) !== undefined;
				},

				/**
				 * Bind ComboBox to data source
				 * @param {HTMLElement} element
				 * @param {Object} options
				 * @returns {Object} Binding adapter
				 */
				bind: function(element, options) {
					var instance = ComboBox.getInstance(element);

					return {
						/**
						 * Update ComboBox from source data
						 * @param {Object} data - Can contain items, value, or both
						 */
						update: function(data) {
							if (!instance) {
								instance = ComboBox.getInstance(element);
							}
							if (!instance) return;

							// Handle items update
							if (data && Array.isArray(data.items)) {
								instance.setItems(data.items);
							} else if (Array.isArray(data)) {
								// Direct array = items
								instance.setItems(data);
							}

							// Handle value update
							if (data && data.value !== undefined) {
								instance.setValue(data.value);
							}
						},

						/**
						 * Get current ComboBox value
						 * @returns {*|Array}
						 */
						getData: function() {
							if (!instance) {
								instance = ComboBox.getInstance(element);
							}
							return instance ? instance.getValue() : null;
						},

						/**
						 * Get selected items (full objects)
						 * @returns {Array}
						 */
						getItems: function() {
							if (!instance) {
								instance = ComboBox.getInstance(element);
							}
							return instance ? instance.getSelectedItems() : [];
						},

						/**
						 * Cleanup binding
						 */
						destroy: function() {
							instance = null;
						}
					};
				}
			});
		}
	}

	// =========================================================================
	// REGISTRATION
	// =========================================================================

	Funky.register('ComboBox', ComboBox);
	console.log('[Funky] ComboBox component loaded');

	// Auto-init on DOMContentLoaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			ComboBox.initAll();
		});
	} else {
		ComboBox.initAll();
	}

	// Auto-init on SPA navigation
	// SPA uses DOM events (funky.spa.pageload), not PubSub
	document.addEventListener('funky.spa.pageload', function() {
		ComboBox.initAll();
	});

})(window);
