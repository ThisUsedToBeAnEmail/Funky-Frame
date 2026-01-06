/**
 * Funky.TreeView - Hierarchical data display component
 * 
 * Features:
 * - Recursive node rendering from nested or flat data
 * - Expand/collapse with smooth animations
 * - Visual indentation with guide lines
 * - Icon support per node
 * - Theme and density aware
 * 
 * @version 1.0.3
 */
(function(Funky) {
	'use strict';

	// =========================================================================
	// Dependencies
	// =========================================================================

	// Check if Morph is available with required flip method
	var Morph = Funky && Funky.Morph;
	var hasMorph = !!(Morph && typeof Morph.flip === 'function');

	// Check for reduced motion preference
	function prefersReducedMotion() {
		if (Morph && typeof Morph.prefersReducedMotion === 'function') {
			return Morph.prefersReducedMotion();
		}
		return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('TreeView');

	// =========================================================================
	// Default Options
	// =========================================================================
	
	var DEFAULTS = {
		// Data
		data: [],
		dataFormat: 'nested',     // 'nested' or 'flat'
		
		// Initial state
		expandedIds: [],
		selectedIds: [],
		
		// Selection
		selectable: 'none',       // 'none', 'single', 'multi'
		cascadeSelect: true,      // Multi-select: parent selection cascades to children
		
		// Icons
		iconMap: {
			folder: 'fa-folder',
			folderOpen: 'fa-folder-open',
			file: 'fa-file',
			loading: 'fa-spinner fa-spin'
		},
		defaultIcon: 'file',
		
		// Display
		showGuides: true,         // Show indentation guide lines
		indentSize: 20,           // Pixels per indent level
		animationDuration: 200,   // Collapse/expand animation (ms)
		
		// Morph integration (requires Funky.Morph)
		useMorph: true,           // Use Morph for expand/collapse animations when available
		staggerChildren: true,    // Stagger child node appearance
		staggerDelay: 30,         // Delay between children (ms)
		morphDragDrop: true,      // Animate nodes during drag-and-drop
		morphEasing: 'easeOutCubic', // Easing for morph animations
		
		// Search & Filter
		showSearch: false,         // Show search input above tree
		searchPlaceholder: 'Search...', // Search input placeholder
		searchFields: ['label', 'name'], // Fields to search in
		searchDebounce: 300,       // Debounce delay in ms
		autoExpandMatches: true,   // Auto-expand to show matches
		noResultsText: 'No matching items found', // Empty search (string|Node|Dom|VDom|HTML)
		fuzzySearch: false,        // Enable fuzzy matching (requires Funky.FuzzySearch)
		fuzzyThreshold: 0.3,       // Minimum fuzzy score (0-1)
		fuzzyTokenize: false,      // Split query into space-separated tokens
		highlightMatches: true,    // Highlight matched text in labels
		
		// Lazy Loading
		onLoadChildren: null,      // Callback: function(node, done, fail) or returns Promise
		onLoadError: null,         // Callback: function(node, error)
		cacheChildren: true,       // Cache loaded children
		loadingText: 'Loading...',  // Loading indicator (string|Node|Dom|VDom|HTML)
		errorText: 'Failed to load', // Error state (string|Node|Dom|VDom|HTML)
		retryText: 'Retry',         // Retry button content (string|Node|Dom|VDom|HTML)
		
		// Drag and Drop
		draggable: false,          // Enable drag-and-drop
		dragHandle: null,          // Selector for drag handle (null = whole row)
		canDrag: null,             // Callback: function(node) => boolean
		canDrop: null,             // Callback: function(dragged, target, position) => boolean
		onMove: null,              // Callback: function(node, newParent, index)
		
		// Callbacks
		onExpand: null,
		onCollapse: null,
		onSelect: null,
		onFilter: null,
		onInit: null
	};

	// =========================================================================
	// Constructor
	// =========================================================================
	
	function TreeView(element, options) {
		this.element = typeof element === 'string' 
			? document.querySelector(element) 
			: element;
		
		if (!this.element) {
			console.error('[TreeView] Container element not found');
			return;
		}
		
		// Merge options
		this.options = Object.assign({}, DEFAULTS, options || {});
		
		// Internal state
		this.nodes = [];                    // Normalised nested data
		this.nodeMap = new Map();           // ID -> node lookup
		this.expandedIds = new Set(this.options.expandedIds);
		this.selectedIds = new Set(this.options.selectedIds);
		this.indeterminateIds = new Set();  // For cascade selection partial states
		this.lastSelectedId = null;         // For shift+click range selection
		this.focusedNodeId = null;          // Currently focused node
		this.typeAheadBuffer = '';          // For type-ahead search
		this.typeAheadTimeout = null;       // Clear buffer timer
		this.instanceId = 'treeview-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
		
		// Filter state
		this.filterQuery = '';              // Current filter query
		this.filteredIds = null;            // Set of matching node IDs (null = no filter)
		this.preFilterExpandedIds = null;   // Expanded state before filter
		this.searchDebounceTimer = null;    // Debounce timer for search input
		this.searchResults = new Map();     // nodeId -> { score, matches, key } for fuzzy
		
		// Lazy loading state
		this.loadingIds = new Set();        // Nodes currently loading
		this.errorIds = new Set();          // Nodes that failed to load
		this.loadedIds = new Set();         // Nodes that have loaded children (cache tracking)
		
		// Drag and drop state
		this.dragEnabled = this.options.draggable;
		this.draggedNode = null;            // Node being dragged
		this.dragTarget = null;             // Current drop target node
		this.dropPosition = null;           // 'before', 'inside', 'after'
		this.dragGhost = null;              // Ghost element
		
		// Move history for undo
		this.moveHistory = [];
		this.maxHistorySize = 50;           // Limit history size
		
		// DOM references
		this.container = null;
		this.liveRegion = null;             // For screen reader announcements
		
		// Bound event handlers (for cleanup)
		this._boundHandlers = {};
		
		// Initialize
		this._init();
	}

	// =========================================================================
	// Initialization
	// =========================================================================
	
	TreeView.prototype._init = function() {
		// Normalise data
		this._normaliseData(this.options.data);
		
		// Build DOM
		this._buildContainer();
		this._render();
		
		// Bind events
		this._bindEvents();
		
		// Register keyboard shortcuts
		this._registerKeyboardShortcuts();
		
		// Store instance reference
		this.element._funkyTreeView = this;

		// Register in instance registry
		var containerId = this.element.id;
		if (containerId) {
			_instances.register(containerId, this);
		}
		
		// Callback
		if (typeof this.options.onInit === 'function') {
			this.options.onInit.call(this);
		}
		
		console.log('[TreeView] Initialized with', this.nodes.length, 'root nodes');
	};

	// =========================================================================
	// Data Normalisation
	// =========================================================================
	
	/**
	 * Normalise data to nested format and build lookup map
	 */
	TreeView.prototype._normaliseData = function(data) {
		this.nodeMap.clear();
		
		if (!data || !Array.isArray(data) || data.length === 0) {
			this.nodes = [];
			return;
		}
		
		if (this.options.dataFormat === 'flat') {
			this.nodes = this._flatToNested(data);
		} else {
			this.nodes = this._cloneAndIndex(data);
		}
	};
	
	/**
	 * Clone nested data and build index
	 */
	TreeView.prototype._cloneAndIndex = function(nodes, parent) {
		var self = this;
		var result = [];
		
		nodes.forEach(function(node) {
			var cloned = Object.assign({}, node);
			cloned._parent = parent || null;
			cloned._depth = parent ? parent._depth + 1 : 0;
			
			self.nodeMap.set(cloned.id, cloned);
			
			if (node.children && node.children.length > 0) {
				cloned.children = self._cloneAndIndex(node.children, cloned);
			} else {
				cloned.children = [];
			}
			
			result.push(cloned);
		});
		
		return result;
	};
	
	/**
	 * Convert flat data with parentId to nested structure
	 */
	TreeView.prototype._flatToNested = function(flatData) {
		var self = this;
		var nodeMap = new Map();
		var rootNodes = [];
		
		// First pass: create all nodes and index them
		flatData.forEach(function(item) {
			var node = Object.assign({}, item);
			node.children = [];
			nodeMap.set(node.id, node);
			self.nodeMap.set(node.id, node);
		});
		
		// Second pass: build tree structure
		flatData.forEach(function(item) {
			var node = nodeMap.get(item.id);
			
			if (item.parentId === null || item.parentId === undefined) {
				// Root node
				node._parent = null;
				node._depth = 0;
				rootNodes.push(node);
			} else {
				// Child node
				var parent = nodeMap.get(item.parentId);
				if (parent) {
					node._parent = parent;
					node._depth = parent._depth + 1;
					parent.children.push(node);
				} else {
					// Parent not found - treat as root
					console.warn('[TreeView] Parent not found for node', item.id, '- treating as root');
					node._parent = null;
					node._depth = 0;
					rootNodes.push(node);
				}
			}
		});
		
		return rootNodes;
	};

	/**
	 * Get array of visible node IDs in DOM order
	 */
	TreeView.prototype._getVisibleNodeIds = function() {
		var ids = [];
		var self = this;
		
		function collectVisible(nodes) {
			nodes.forEach(function(node) {
				ids.push(node.id);
				
				if (node.children && node.children.length > 0 && self.expandedIds.has(node.id)) {
					collectVisible(node.children);
				}
			});
		}
		
		collectVisible(this.nodes);
		return ids;
	};

	// =========================================================================
	// DOM Building
	// =========================================================================
	
	/**
	 * Build the main container
	 */
	TreeView.prototype._buildContainer = function() {
		this.element.replaceChildren();
		this.element.classList.add('funky-tree-view');
		
		// Search input (optional)
		if (this.options.showSearch) {
			this._buildSearchInput();
		}
		
		this.container = document.createElement('div');
		this.container.className = 'tree-view-container';
		this.container.setAttribute('role', 'tree');
		this.container.setAttribute('aria-label', 'Tree view');
		this.container.setAttribute('tabindex', '0');
		
		if (this.options.showGuides) {
			this.container.classList.add('tree-view-guides');
		}
		
		this.element.appendChild(this.container);
		
		// Create live region for screen reader announcements
		this.liveRegion = document.createElement('div');
		this.liveRegion.className = 'tree-view-live-region';
		this.liveRegion.setAttribute('role', 'status');
		this.liveRegion.setAttribute('aria-live', 'polite');
		this.liveRegion.setAttribute('aria-atomic', 'true');
		this.element.appendChild(this.liveRegion);
	};
	
	/**
	 * Build search input UI
	 */
	TreeView.prototype._buildSearchInput = function() {
		var self = this;
		var D = Funky.Dom;
		
		// Search wrapper
		this.searchWrapper = D.div().class('tree-view-search').get();
		
		// Search icon
		var searchIcon = D.span().class('tree-view-search-icon').child(
			D.icon('fas fa-search')
		).get();
		this.searchWrapper.appendChild(searchIcon);
		
		// Search input
		this.searchInput = D.create('input')
			.attr('type', 'text')
			.class('tree-view-search-input')
			.attr('placeholder', this.options.searchPlaceholder)
			.aria('label', 'Search tree')
			.get();
		this.searchWrapper.appendChild(this.searchInput);
		
		// Clear button
		this.searchClearBtn = D.button()
			.attr('type', 'button')
			.class('tree-view-search-clear')
			.aria('label', 'Clear search')
			.style({ display: 'none' })
			.child(D.icon('fas fa-times'))
			.get();
		this.searchWrapper.appendChild(this.searchClearBtn);
		
		// Bind search events
		this.searchInput.addEventListener('input', function(e) {
			self._handleSearchInput(e.target.value);
		});
		
		this.searchClearBtn.addEventListener('click', function() {
			self.clearFilter();
			self.searchInput.focus();
		});
		
		// Allow Escape to clear
		this.searchInput.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && self.filterQuery) {
				e.preventDefault();
				self.clearFilter();
			}
		});
		
		this.element.appendChild(this.searchWrapper);
	};
	
	/**
	 * Handle search input with debounce
	 */
	TreeView.prototype._handleSearchInput = function(value) {
		var self = this;
		
		// Update clear button visibility
		if (this.searchClearBtn) {
			this.searchClearBtn.style.display = value ? 'flex' : 'none';
		}
		
		// Clear existing timer
		if (this.searchDebounceTimer) {
			clearTimeout(this.searchDebounceTimer);
		}
		
		// Debounce
		this.searchDebounceTimer = setTimeout(function() {
			if (value) {
				self.filter(value);
			} else {
				self.clearFilter();
			}
		}, this.options.searchDebounce);
	};

	/**
	 * Render the entire tree
	 */
	TreeView.prototype._render = function() {
		this.container.replaceChildren();
		
		if (this.nodes.length === 0) {
			this._renderEmpty();
			return;
		}
		
		// Check if filter returns no results
		if (this.filteredIds !== null && this.filteredIds.size === 0) {
			this._renderNoResults();
			return;
		}
		
		var fragment = document.createDocumentFragment();
		this._renderChildren(this.nodes, 0, fragment);
		this.container.appendChild(fragment);
	};
	
	/**
	 * Render empty state
	 */
	TreeView.prototype._renderEmpty = function() {
		var D = Funky.Dom;
		var emptyEl = D.div().class('tree-view-empty').child(
			D.icon('fas fa-folder-open me-2'),
			D.text('No items')
		).get();
		this.container.appendChild(emptyEl);
	};
	
	/**
	 * Render no results state
	 */
	TreeView.prototype._renderNoResults = function() {
		var self = this;
		var D = Funky.Dom;
		
		var noResultsEl = D.div().class('tree-view-no-results').child(
			D.icon('fas fa-search me-2'),
			Funky.Util.toDom(this.options.noResultsText),
			D.button()
				.attr('type', 'button')
				.class('tree-view-no-results-clear')
				.text('Clear filter')
		).get();
		
		noResultsEl.querySelector('.tree-view-no-results-clear').addEventListener('click', function() {
			self.clearFilter();
		});
		
		this.container.appendChild(noResultsEl);
	};
	
	/**
	 * Render array of child nodes
	 */
	TreeView.prototype._renderChildren = function(children, depth, parentEl) {
		var self = this;
		
		// Filter children if filter is active
		var visibleChildren = children;
		if (this.filteredIds !== null) {
			visibleChildren = children.filter(function(node) {
				return self.filteredIds.has(node.id);
			});
			
			// Sort by score when fuzzy search is enabled
			if (this.options.fuzzySearch && this.searchResults.size > 0) {
				visibleChildren = visibleChildren.slice().sort(function(a, b) {
					var scoreA = self.getSearchScore(a);
					var scoreB = self.getSearchScore(b);
					// Higher score first, nulls (ancestors) last
					if (scoreA === null && scoreB === null) return 0;
					if (scoreA === null) return 1;
					if (scoreB === null) return -1;
					return scoreB - scoreA;
				});
			}
		}
		
		var setSize = visibleChildren.length;
		
		visibleChildren.forEach(function(node, index) {
			var isLast = index === visibleChildren.length - 1;
			var nodeEl = self._renderNode(node, depth, isLast, index + 1, setSize);
			parentEl.appendChild(nodeEl);
		});
	};
	
	/**
	 * Render a single node
	 * @param {Object} node - The node data
	 * @param {number} depth - Current depth level
	 * @param {boolean} isLast - Whether this is the last sibling
	 * @param {number} posInSet - 1-based position within siblings
	 * @param {number} setSize - Total number of siblings
	 */
	TreeView.prototype._renderNode = function(node, depth, isLast, posInSet, setSize) {
		var self = this;
		var D = Funky.Dom;
		var hasLoadedChildren = node.children && node.children.length > 0;
		var hasChildren = hasLoadedChildren || node.hasChildren; // Support lazy nodes
		var isExpanded = this.expandedIds.has(node.id);
		var isSelected = this.selectedIds.has(node.id);
		var isIndeterminate = this.indeterminateIds.has(node.id);
		var isLoading = this.loadingIds.has(node.id);
		var hasError = this.errorIds.has(node.id);
		var labelText = node.label || node.name || 'Unnamed';
		var iconClass = this._getIconClass(node, hasChildren, isExpanded);
		
		// Build chevron
		var chevronClasses = D.classes(
			'tree-view-chevron',
			!hasChildren && 'tree-view-chevron-empty',
			hasChildren && isExpanded && 'tree-view-chevron-expanded'
		);
		var chevronIcon = hasChildren 
			? (isLoading ? this.options.iconMap.loading : 'fa-chevron-right')
			: null;
		
		// Build checkbox (multi-select only)
		var checkboxEl = null;
		if (this.options.selectable === 'multi') {
			var checkboxClasses = D.classes(
				'tree-view-checkbox',
				isSelected && 'tree-view-checkbox-checked',
				isIndeterminate && 'tree-view-checkbox-indeterminate'
			);
			var checkboxIcon = isSelected ? 'fas fa-check-square' 
				: isIndeterminate ? 'fas fa-minus-square' 
				: 'far fa-square';
			checkboxEl = D.span().class(checkboxClasses).child(D.icon(checkboxIcon));
		}
		
		// Build label (with optional search highlighting)
		var labelEl;
		if (this.filterQuery && this.filteredIds && this.filteredIds.has(node.id)) {
			// Use fuzzy highlighting when fuzzy search enabled, otherwise fallback to simple highlight
			if (this.options.fuzzySearch && this.searchResults.has(node.id)) {
				labelEl = D.span().class('tree-view-label').html(this.getHighlightedLabel(node));
			} else {
				labelEl = D.span().class('tree-view-label').html(this._highlightText(labelText, this.filterQuery));
			}
		} else {
			labelEl = D.span().class('tree-view-label').text(labelText);
		}
		
		// Build row
		var rowWrapper = D.div()
			.class(D.classes('tree-view-row', isSelected && 'tree-view-selected'))
			.attr('role', 'treeitem')
			.aria('level', depth + 1)
			.aria('setsize', setSize)
			.aria('posinset', posInSet)
			.aria('selected', isSelected ? 'true' : 'false')
			.attr('tabindex', '-1')
			.style({ paddingLeft: (depth * this.options.indentSize) + 'px' });
		
		// Drag attributes
		if (this.dragEnabled) {
			var canDrag = !this.options.canDrag || this.options.canDrag.call(this, node);
			if (canDrag) {
				rowWrapper.attr('draggable', 'true').classAdd('tree-view-draggable');
			}
		}
		
		if (hasChildren) {
			rowWrapper.aria('expanded', isExpanded ? 'true' : 'false');
			if (isLoading) {
				rowWrapper.aria('busy', 'true');
			}
		}
		
		// Add row children
		rowWrapper.child(
			D.span().class(chevronClasses).child(chevronIcon && D.icon('fas ' + chevronIcon)),
			checkboxEl,
			D.span().class('tree-view-icon').child(D.icon('fas ' + iconClass)),
			labelEl
		);
		
		// Build children container if has children
		var childrenEl = null;
		if (hasChildren) {
			var childrenClasses = D.classes(
				'tree-view-children',
				!isExpanded && !isLoading && !hasError && 'tree-view-children-collapsed'
			);
			
			var childrenWrapper = D.div().class(childrenClasses).attr('role', 'group');
			
			if (isLoading) {
				childrenWrapper.child(
					D.div().class('tree-view-loading-placeholder').child(
						D.icon('fas fa-spinner fa-spin me-2'),
						Funky.Util.toDom(this.options.loadingText)
					)
				);
			} else if (hasError) {
				var retryBtn = D.button().attr('type', 'button').class('tree-view-retry-btn').get();
				retryBtn.appendChild(Funky.Util.toDom(this.options.retryText));
				childrenWrapper.child(
					D.div().class('tree-view-error-placeholder').child(
						D.icon('fas fa-exclamation-triangle me-2'),
						Funky.Util.toDom(this.options.errorText),
						retryBtn
					)
				);
			} else if (hasLoadedChildren) {
				// Render children directly into the wrapper element
				var childrenContainer = childrenWrapper.get();
				this._renderChildren(node.children, depth + 1, childrenContainer);
				childrenEl = childrenContainer;
			}
			
			if (!childrenEl) {
				childrenEl = childrenWrapper.get();
			}
		}
		
		// Build node wrapper
		var nodeEl = D.div()
			.class(D.classes(
				'tree-view-node',
				isLast && 'tree-view-node-last',
				isLoading && 'tree-view-loading',
				hasError && 'tree-view-error'
			))
			.data('node-id', node.id)
			.data('depth', depth)
			.child(rowWrapper, childrenEl)
			.get();
		
		return nodeEl;
	};
	
	/**
	 * Get icon class for a node
	 */
	TreeView.prototype._getIconClass = function(node, hasChildren, isExpanded) {
		// Custom icon on node
		if (node.icon) {
			// If it's a full class, use it; otherwise prefix with fa-
			if (node.icon.startsWith('fa-')) {
				return node.icon;
			}
			return this.options.iconMap[node.icon] || node.icon;
		}
		
		// Default based on node type
		if (hasChildren) {
			return isExpanded 
				? this.options.iconMap.folderOpen 
				: this.options.iconMap.folder;
		}
		
		return this.options.iconMap.file;
	};

	/**
	 * Highlight matching text in a string
	 * @param {string} text - The text to search in
	 * @param {string} query - The search query (lowercase)
	 * @returns {string} HTML with <mark> tags around matches
	 */
	TreeView.prototype._highlightText = function(text, query) {
		if (!query) return this._escapeHtml(text);
		
		var lowerText = text.toLowerCase();
		var index = lowerText.indexOf(query);
		
		if (index === -1) {
			return this._escapeHtml(text);
		}
		
		var before = text.substring(0, index);
		var match = text.substring(index, index + query.length);
		var after = text.substring(index + query.length);
		
		return this._escapeHtml(before) + 
			'<mark class="tree-view-highlight">' + this._escapeHtml(match) + '</mark>' + 
			this._highlightText(after, query);
	};

	/**
	 * Escape HTML entities
	 * @private
	 */
	TreeView.prototype._escapeHtml = function(text) {
		var div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	};

	// =========================================================================
	// Event Handling
	// =========================================================================
	
	TreeView.prototype._bindEvents = function() {
		var self = this;
		
		// Click handler for expand/collapse and row selection
		this._boundHandlers.click = function(e) {
			self._handleClick(e);
		};
		this.container.addEventListener('click', this._boundHandlers.click);
		
		// Keyboard handler
		this._boundHandlers.keydown = function(e) {
			self._handleKeydown(e);
		};
		this.container.addEventListener('keydown', this._boundHandlers.keydown);
		
		// Focus handler - set initial focus
		this._boundHandlers.focus = function(e) {
			if (!self.focusedNodeId && self.nodes.length > 0) {
				// Focus first selected or first node
				var firstSelected = self.selectedIds.size > 0 
					? Array.from(self.selectedIds)[0] 
					: self.nodes[0].id;
				self._focusNode(firstSelected);
			}
		};
		this.container.addEventListener('focus', this._boundHandlers.focus);
		
		// Drag and drop handlers
		if (this.dragEnabled) {
			this._bindDragEvents();
		}
	};
	
	/**
	 * Bind drag and drop event handlers
	 */
	TreeView.prototype._bindDragEvents = function() {
		var self = this;
		
		this._boundHandlers.dragstart = function(e) {
			self._handleDragStart(e);
		};
		this.container.addEventListener('dragstart', this._boundHandlers.dragstart);
		
		this._boundHandlers.dragend = function(e) {
			self._handleDragEnd(e);
		};
		this.container.addEventListener('dragend', this._boundHandlers.dragend);
		
		this._boundHandlers.dragover = function(e) {
			self._handleDragOver(e);
		};
		this.container.addEventListener('dragover', this._boundHandlers.dragover);
		
		this._boundHandlers.dragleave = function(e) {
			self._handleDragLeave(e);
		};
		this.container.addEventListener('dragleave', this._boundHandlers.dragleave);
		
		this._boundHandlers.drop = function(e) {
			self._handleDrop(e);
		};
		this.container.addEventListener('drop', this._boundHandlers.drop);
		
		// Touch events for mobile
		this._bindTouchDragEvents();
	};
	
	/**
	 * Bind touch drag events for mobile support
	 */
	TreeView.prototype._bindTouchDragEvents = function() {
		var self = this;
		
		// Touch state
		this.touchState = {
			startX: 0,
			startY: 0,
			longPressTimer: null,
			isDragging: false,
			scrollInterval: null
		};
		
		this._boundHandlers.touchstart = function(e) {
			self._handleTouchStart(e);
		};
		this.container.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: false });
		
		this._boundHandlers.touchmove = function(e) {
			self._handleTouchMove(e);
		};
		this.container.addEventListener('touchmove', this._boundHandlers.touchmove, { passive: false });
		
		this._boundHandlers.touchend = function(e) {
			self._handleTouchEnd(e);
		};
		this.container.addEventListener('touchend', this._boundHandlers.touchend);
		
		this._boundHandlers.touchcancel = function(e) {
			self._handleTouchEnd(e);
		};
		this.container.addEventListener('touchcancel', this._boundHandlers.touchcancel);
	};
	
	/**
	 * Handle touch start - initiate long-press timer
	 */
	TreeView.prototype._handleTouchStart = function(e) {
		var row = e.target.closest('.tree-view-row');
		if (!row || !row.hasAttribute('draggable')) return;
		
		var touch = e.touches[0];
		var self = this;
		
		this.touchState.startX = touch.clientX;
		this.touchState.startY = touch.clientY;
		this.touchState.row = row;
		
		// Long-press timer (500ms)
		this.touchState.longPressTimer = setTimeout(function() {
			self._initiateTouchDrag(row, touch);
		}, 500);
	};
	
	/**
	 * Initiate touch drag after long-press
	 */
	TreeView.prototype._initiateTouchDrag = function(row, touch) {
		var nodeEl = row.closest('.tree-view-node');
		var nodeId = this._parseNodeId(nodeEl.dataset.nodeId);
		var node = this.nodeMap.get(nodeId);
		
		if (!node) return;
		
		// Check canDrag
		if (this.options.canDrag && !this.options.canDrag.call(this, node)) {
			return;
		}
		
		this.touchState.isDragging = true;
		this.draggedNode = node;
		
		// Create ghost at touch position
		this._createDragGhost(row, node);
		this._updateGhostPosition(touch.clientX, touch.clientY);
		
		// Add visual feedback
		row.classList.add('tree-view-dragging');
		this.container.classList.add('tree-view-drag-active');
		
		// Vibration feedback if available
		if (navigator.vibrate) {
			navigator.vibrate(50);
		}
		
		// Emit event
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.dragStart', {
			detail: { node: node },
			bubbles: true
		}));
	};
	
	/**
	 * Handle touch move - update drag position
	 */
	TreeView.prototype._handleTouchMove = function(e) {
		var touch = e.touches[0];
		
		// Check if moved too much before long-press completed
		if (this.touchState.longPressTimer) {
			var dx = Math.abs(touch.clientX - this.touchState.startX);
			var dy = Math.abs(touch.clientY - this.touchState.startY);
			if (dx > 10 || dy > 10) {
				clearTimeout(this.touchState.longPressTimer);
				this.touchState.longPressTimer = null;
			}
		}
		
		if (!this.touchState.isDragging) return;
		
		e.preventDefault();
		
		// Update ghost position
		this._updateGhostPosition(touch.clientX, touch.clientY);
		
		// Find drop target
		var elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
		if (elemBelow) {
			var row = elemBelow.closest('.tree-view-row');
			if (row && this.container.contains(row)) {
				this._updateTouchDropTarget(row, touch.clientY);
			}
		}
		
		// Auto-scroll near edges
		this._handleEdgeScroll(touch.clientY);
	};
	
	/**
	 * Update ghost element position
	 */
	TreeView.prototype._updateGhostPosition = function(x, y) {
		if (this.dragGhost) {
			this.dragGhost.style.position = 'fixed';
			this.dragGhost.style.left = (x + 15) + 'px';
			this.dragGhost.style.top = (y + 15) + 'px';
		}
	};
	
	/**
	 * Update drop target during touch drag
	 */
	TreeView.prototype._updateTouchDropTarget = function(row, clientY) {
		var nodeEl = row.closest('.tree-view-node');
		var nodeId = this._parseNodeId(nodeEl.dataset.nodeId);
		var node = this.nodeMap.get(nodeId);
		
		if (!node || nodeId === this.draggedNode.id) {
			this._clearDropIndicators();
			return;
		}
		
		if (this._isDescendant(this.draggedNode, node)) {
			this._clearDropIndicators();
			return;
		}
		
		// Determine position
		var rect = row.getBoundingClientRect();
		var y = clientY - rect.top;
		var height = rect.height;
		var position;
		
		if (y < height * 0.25) {
			position = 'before';
		} else if (y > height * 0.75) {
			position = 'after';
		} else {
			position = 'inside';
		}
		
		// Check canDrop
		if (this.options.canDrop && !this.options.canDrop.call(this, this.draggedNode, node, position)) {
			this._clearDropIndicators();
			return;
		}
		
		this.dragTarget = node;
		this.dropPosition = position;
		this._updateDropIndicators(row, position);
	};
	
	/**
	 * Handle edge scroll during drag
	 */
	TreeView.prototype._handleEdgeScroll = function(clientY) {
		var self = this;
		var rect = this.container.getBoundingClientRect();
		var scrollZone = 50; // Pixels from edge to trigger scroll
		var scrollSpeed = 5;
		
		// Clear existing interval
		if (this.touchState.scrollInterval) {
			clearInterval(this.touchState.scrollInterval);
			this.touchState.scrollInterval = null;
		}
		
		// Near top edge
		if (clientY < rect.top + scrollZone) {
			this.touchState.scrollInterval = setInterval(function() {
				self.container.scrollTop -= scrollSpeed;
			}, 16);
		}
		// Near bottom edge
		else if (clientY > rect.bottom - scrollZone) {
			this.touchState.scrollInterval = setInterval(function() {
				self.container.scrollTop += scrollSpeed;
			}, 16);
		}
	};
	
	/**
	 * Handle touch end - execute drop
	 */
	TreeView.prototype._handleTouchEnd = function(e) {
		// Clear long-press timer
		if (this.touchState.longPressTimer) {
			clearTimeout(this.touchState.longPressTimer);
			this.touchState.longPressTimer = null;
		}
		
		// Clear scroll interval
		if (this.touchState.scrollInterval) {
			clearInterval(this.touchState.scrollInterval);
			this.touchState.scrollInterval = null;
		}
		
		if (!this.touchState.isDragging) return;
		
		// Execute drop if we have a valid target
		if (this.draggedNode && this.dragTarget && this.dropPosition) {
			var node = this.draggedNode;
			var target = this.dragTarget;
			var position = this.dropPosition;
			
			var newParent, index;
			
			if (position === 'inside') {
				newParent = target;
				index = 0;
			} else {
				newParent = target._parent;
				var siblings = newParent ? newParent.children : this.nodes;
				var targetIndex = siblings.indexOf(target);
				index = position === 'before' ? targetIndex : targetIndex + 1;
			}
			
			this._moveNode(node, newParent, index);
		}
		
		// Cleanup
		this._handleDragEnd(e);
		this.touchState.isDragging = false;
	};
	
	TreeView.prototype._handleClick = function(e) {
		// Handle retry button click
		var retryBtn = e.target.closest('.tree-view-retry-btn');
		if (retryBtn) {
			var nodeEl = retryBtn.closest('.tree-view-node');
			if (nodeEl) {
				var nodeId = nodeEl.dataset.nodeId;
				var id = isNaN(nodeId) ? nodeId : parseInt(nodeId, 10);
				this.refreshNode(id);
			}
			return;
		}
		
		var chevron = e.target.closest('.tree-view-chevron');
		var checkbox = e.target.closest('.tree-view-checkbox');
		var row = e.target.closest('.tree-view-row');
		
		if (!row) return;
		
		var nodeEl = row.closest('.tree-view-node');
		var nodeId = nodeEl ? nodeEl.dataset.nodeId : null;
		
		if (!nodeId) return;
		
		// Parse ID (could be numeric or string)
		var id = isNaN(nodeId) ? nodeId : parseInt(nodeId, 10);
		
		// Don't allow interaction while loading
		if (this.loadingIds.has(id)) return;
		
		// Focus the clicked node
		this._focusNode(id);
		
		// Mark as mouse interaction (for focus-visible)
		this.container.classList.add('tree-view-mouse-focus');
		
		// If clicked on chevron, toggle expand/collapse
		if (chevron && !chevron.classList.contains('tree-view-chevron-empty')) {
			this.toggle(id);
			return;
		}
		
		// Handle selection
		if (this.options.selectable !== 'none') {
			this._handleSelection(id, e);
		}
	};

	// =========================================================================
	// Drag and Drop Handlers
	// =========================================================================
	
	/**
	 * Handle drag start
	 */
	TreeView.prototype._handleDragStart = function(e) {
		var row = e.target.closest('.tree-view-row');
		if (!row) return;
		
		// Check if drag handle is required
		if (this.options.dragHandle) {
			var handle = e.target.closest(this.options.dragHandle);
			if (!handle) {
				e.preventDefault();
				return;
			}
		}
		
		var nodeEl = row.closest('.tree-view-node');
		var nodeId = this._parseNodeId(nodeEl.dataset.nodeId);
		var node = this.nodeMap.get(nodeId);
		
		if (!node) return;
		
		// Check canDrag
		if (this.options.canDrag && !this.options.canDrag.call(this, node)) {
			e.preventDefault();
			return;
		}
		
		this.draggedNode = node;
		
		// Create ghost element
		this._createDragGhost(row, node);
		
		// Set drag data
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', nodeId);
		
		// Use custom ghost if available
		if (this.dragGhost) {
			e.dataTransfer.setDragImage(this.dragGhost, 20, 20);
		}
		
		// Add dragging class
		row.classList.add('tree-view-dragging');
		this.container.classList.add('tree-view-drag-active');
		
		// Emit event
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.dragStart', {
			detail: { node: node },
			bubbles: true
		}));
	};
	
	/**
	 * Handle drag end
	 */
	TreeView.prototype._handleDragEnd = function(e) {
		// Clean up
		this._clearDropIndicators();
		this._removeDragGhost();
		
		// Remove classes
		var dragging = this.container.querySelector('.tree-view-dragging');
		if (dragging) {
			dragging.classList.remove('tree-view-dragging');
		}
		this.container.classList.remove('tree-view-drag-active');
		
		// Reset state
		this.draggedNode = null;
		this.dragTarget = null;
		this.dropPosition = null;
	};
	
	/**
	 * Handle drag over
	 */
	TreeView.prototype._handleDragOver = function(e) {
		if (!this.draggedNode) return;
		
		var row = e.target.closest('.tree-view-row');
		if (!row) return;
		
		var nodeEl = row.closest('.tree-view-node');
		var nodeId = this._parseNodeId(nodeEl.dataset.nodeId);
		var node = this.nodeMap.get(nodeId);
		
		if (!node) return;
		
		// Prevent dropping on self
		if (nodeId === this.draggedNode.id) {
			e.dataTransfer.dropEffect = 'none';
			return;
		}
		
		// Prevent dropping parent into own descendant
		if (this._isDescendant(this.draggedNode, node)) {
			e.dataTransfer.dropEffect = 'none';
			return;
		}
		
		e.preventDefault();
		
		// Determine drop position based on mouse Y within row
		var rect = row.getBoundingClientRect();
		var y = e.clientY - rect.top;
		var height = rect.height;
		var position;
		
		if (y < height * 0.25) {
			position = 'before';
		} else if (y > height * 0.75) {
			position = 'after';
		} else {
			position = 'inside';
		}
		
		// Check canDrop
		if (this.options.canDrop) {
			var canDrop = this.options.canDrop.call(this, this.draggedNode, node, position);
			if (!canDrop) {
				e.dataTransfer.dropEffect = 'none';
				this._clearDropIndicators();
				return;
			}
		}
		
		e.dataTransfer.dropEffect = 'move';
		
		// Update drop indicators if target/position changed
		if (this.dragTarget !== node || this.dropPosition !== position) {
			this.dragTarget = node;
			this.dropPosition = position;
			this._updateDropIndicators(row, position);
			
			// Emit event
			this.element.dispatchEvent(new CustomEvent('funky.tree-view.dragOver', {
				detail: { 
					dragged: this.draggedNode, 
					target: node, 
					position: position 
				},
				bubbles: true
			}));
		}
	};
	
	/**
	 * Handle drag leave
	 */
	TreeView.prototype._handleDragLeave = function(e) {
		// Only clear if leaving the container
		if (!this.container.contains(e.relatedTarget)) {
			this._clearDropIndicators();
			this.dragTarget = null;
			this.dropPosition = null;
		}
	};
	
	/**
	 * Handle drop
	 */
	TreeView.prototype._handleDrop = function(e) {
		e.preventDefault();
		
		if (!this.draggedNode || !this.dragTarget || !this.dropPosition) {
			return;
		}
		
		var node = this.draggedNode;
		var target = this.dragTarget;
		var position = this.dropPosition;
		
		// Calculate new parent and index
		var newParent, index;
		
		if (position === 'inside') {
			newParent = target;
			index = 0; // Insert at beginning of children
		} else {
			newParent = target._parent;
			var siblings = newParent ? newParent.children : this.nodes;
			var targetIndex = siblings.indexOf(target);
			index = position === 'before' ? targetIndex : targetIndex + 1;
		}
		
		// Execute the move
		this._moveNode(node, newParent, index);
		
		// Cleanup
		this._handleDragEnd(e);
	};
	
	/**
	 * Create drag ghost element
	 */
	TreeView.prototype._createDragGhost = function(row, node) {
		var D = Funky.Dom;
		this.dragGhost = D.div().class('tree-view-drag-ghost').child(
			D.icon('fas fa-grip-vertical me-2'),
			D.text(node.label || node.name || 'Item')
		).get();
		document.body.appendChild(this.dragGhost);
	};
	
	/**
	 * Remove drag ghost
	 */
	TreeView.prototype._removeDragGhost = function() {
		if (this.dragGhost && this.dragGhost.parentNode) {
			this.dragGhost.parentNode.removeChild(this.dragGhost);
		}
		this.dragGhost = null;
	};
	
	/**
	 * Update drop indicators
	 */
	TreeView.prototype._updateDropIndicators = function(row, position) {
		this._clearDropIndicators();
		
		row.classList.add('tree-view-drop-target');
		row.classList.add('tree-view-drop-' + position);
	};
	
	/**
	 * Clear all drop indicators
	 */
	TreeView.prototype._clearDropIndicators = function() {
		var targets = this.container.querySelectorAll('.tree-view-drop-target');
		targets.forEach(function(el) {
			el.classList.remove('tree-view-drop-target');
			el.classList.remove('tree-view-drop-before');
			el.classList.remove('tree-view-drop-inside');
			el.classList.remove('tree-view-drop-after');
		});
	};
	
	/**
	 * Check if node is a descendant of another
	 */
	TreeView.prototype._isDescendant = function(parent, child) {
		var current = child._parent;
		while (current) {
			if (current.id === parent.id) {
				return true;
			}
			current = current._parent;
		}
		return false;
	};
	
	/**
	 * Parse node ID (handles numeric vs string)
	 */
	TreeView.prototype._parseNodeId = function(nodeId) {
		return isNaN(nodeId) ? nodeId : parseInt(nodeId, 10);
	};
	
	/**
	 * Move a node to a new position
	 * @private
	 */
	TreeView.prototype._moveNode = function(node, newParent, index, skipHistory) {
		var oldParent = node._parent;
		
		// Remove from old position
		var oldSiblings = oldParent ? oldParent.children : this.nodes;
		var oldIndex = oldSiblings.indexOf(node);
		
		// Record history for undo (unless this is an undo operation)
		if (!skipHistory) {
			this.moveHistory.push({
				node: node,
				oldParent: oldParent,
				oldIndex: oldIndex
			});
			// Limit history size
			if (this.moveHistory.length > this.maxHistorySize) {
				this.moveHistory.shift();
			}
		}
		
		if (oldIndex !== -1) {
			oldSiblings.splice(oldIndex, 1);
		}
		
		// If moving within same parent and after original position, adjust index
		if (oldParent === newParent && oldIndex < index) {
			index--;
		}
		
		// Add to new position
		node._parent = newParent;
		node._depth = newParent ? newParent._depth + 1 : 0;
		
		var newSiblings = newParent ? newParent.children : this.nodes;
		newSiblings.splice(index, 0, node);
		
		// Update depths of all descendants
		this._updateDescendantDepths(node);
		
		// Emit move event
		var payload = {
			node: node,
			oldParent: oldParent,
			newParent: newParent,
			index: index
		};
		
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.move', {
			detail: payload,
			bubbles: true
		}));
		
		// Call onMove callback
		if (typeof this.options.onMove === 'function') {
			this.options.onMove.call(this, node, newParent, index);
		}
		
		// Re-render
		this._render();
		
		// Announce
		this._announce('Moved ' + (node.label || node.name) + ' to ' + 
			(newParent ? (newParent.label || newParent.name) : 'root'));
	};
	
	/**
	 * Undo the last move operation
	 * @returns {boolean} True if undo was performed
	 */
	TreeView.prototype.undo = function() {
		if (this.moveHistory.length === 0) {
			this._announce('Nothing to undo');
			return false;
		}
		
		var lastMove = this.moveHistory.pop();
		var node = lastMove.node;
		var oldParent = lastMove.oldParent;
		var oldIndex = lastMove.oldIndex;
		
		// Move back without recording history
		this._moveNode(node, oldParent, oldIndex, true);
		
		this._announce('Undo: restored ' + (node.label || node.name));
		
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.undo', {
			detail: { node: node },
			bubbles: true
		}));
		
		return true;
	};
	
	/**
	 * Check if undo is available
	 * @returns {boolean}
	 */
	TreeView.prototype.canUndo = function() {
		return this.moveHistory.length > 0;
	};
	
	/**
	 * Clear move history
	 */
	TreeView.prototype.clearHistory = function() {
		this.moveHistory = [];
	};
	
	/**
	 * Update depths for all descendants
	 */
	TreeView.prototype._updateDescendantDepths = function(node) {
		var self = this;
		if (node.children) {
			node.children.forEach(function(child) {
				child._depth = node._depth + 1;
				self._updateDescendantDepths(child);
			});
		}
	};

	// =========================================================================
	// Selection Logic
	// =========================================================================
	
	/**
	 * Handle selection logic based on mode and modifiers
	 */
	TreeView.prototype._handleSelection = function(nodeId, e) {
		var node = this.nodeMap.get(nodeId);
		if (!node) return;
		
		var prevSelected = new Set(this.selectedIds);
		
		if (this.options.selectable === 'single') {
			// Single select - replace selection
			this.selectedIds.clear();
			this.selectedIds.add(nodeId);
			this.lastSelectedId = nodeId;
			
		} else if (this.options.selectable === 'multi') {
			var isCtrl = e.ctrlKey || e.metaKey;
			var isShift = e.shiftKey;
			
			if (isShift && this.lastSelectedId !== null) {
				// Range select
				this._selectRange(this.lastSelectedId, nodeId);
			} else if (isCtrl) {
				// Toggle single item
				if (this.selectedIds.has(nodeId)) {
					this._deselectWithCascade(nodeId);
				} else {
					this._selectWithCascade(nodeId);
				}
				this.lastSelectedId = nodeId;
			} else {
				// Regular click - toggle or replace based on cascade
				if (this.selectedIds.has(nodeId)) {
					this._deselectWithCascade(nodeId);
				} else {
					this._selectWithCascade(nodeId);
				}
				this.lastSelectedId = nodeId;
			}
		}
		
		// Update UI and fire events
		this._updateSelectionUI(prevSelected);
		this._emitSelectionChange(prevSelected);
	};
	
	/**
	 * Select a node with cascade if enabled
	 */
	TreeView.prototype._selectWithCascade = function(nodeId) {
		var node = this.nodeMap.get(nodeId);
		if (!node) return;
		
		this.selectedIds.add(nodeId);
		
		// Cascade to children if enabled
		if (this.options.cascadeSelect && node.children) {
			this._selectDescendants(node);
		}
		
		// Update ancestor states
		this._updateAncestorState(node);
	};
	
	/**
	 * Deselect a node with cascade if enabled
	 */
	TreeView.prototype._deselectWithCascade = function(nodeId) {
		var node = this.nodeMap.get(nodeId);
		if (!node) return;
		
		this.selectedIds.delete(nodeId);
		this.indeterminateIds.delete(nodeId);
		
		// Cascade to children if enabled
		if (this.options.cascadeSelect && node.children) {
			this._deselectDescendants(node);
		}
		
		// Update ancestor states
		this._updateAncestorState(node);
	};
	
	/**
	 * Select all descendants of a node
	 */
	TreeView.prototype._selectDescendants = function(node) {
		var self = this;
		if (!node.children) return;
		
		node.children.forEach(function(child) {
			self.selectedIds.add(child.id);
			self.indeterminateIds.delete(child.id);
			if (child.children && child.children.length > 0) {
				self._selectDescendants(child);
			}
		});
	};
	
	/**
	 * Deselect all descendants of a node
	 */
	TreeView.prototype._deselectDescendants = function(node) {
		var self = this;
		if (!node.children) return;
		
		node.children.forEach(function(child) {
			self.selectedIds.delete(child.id);
			self.indeterminateIds.delete(child.id);
			if (child.children && child.children.length > 0) {
				self._deselectDescendants(child);
			}
		});
	};
	
	/**
	 * Update ancestor indeterminate states
	 */
	TreeView.prototype._updateAncestorState = function(node) {
		if (!this.options.cascadeSelect) return;
		
		var parent = node._parent;
		while (parent) {
			this._updateNodeSelectionState(parent);
			parent = parent._parent;
		}
	};
	
	/**
	 * Update a parent node's selection state based on children
	 */
	TreeView.prototype._updateNodeSelectionState = function(node) {
		if (!node.children || node.children.length === 0) return;
		
		var self = this;
		var allSelected = true;
		var someSelected = false;
		
		node.children.forEach(function(child) {
			if (self.selectedIds.has(child.id)) {
				someSelected = true;
			} else {
				allSelected = false;
			}
			// Check for indeterminate children
			if (self.indeterminateIds.has(child.id)) {
				someSelected = true;
				allSelected = false;
			}
		});
		
		if (allSelected) {
			this.selectedIds.add(node.id);
			this.indeterminateIds.delete(node.id);
		} else if (someSelected) {
			this.selectedIds.delete(node.id);
			this.indeterminateIds.add(node.id);
		} else {
			this.selectedIds.delete(node.id);
			this.indeterminateIds.delete(node.id);
		}
	};
	
	/**
	 * Select a range of nodes between two IDs
	 */
	TreeView.prototype._selectRange = function(fromId, toId) {
		var self = this;
		var visibleNodes = this._getVisibleNodeIds();
		var fromIndex = visibleNodes.indexOf(fromId);
		var toIndex = visibleNodes.indexOf(toId);
		
		if (fromIndex === -1 || toIndex === -1) return;
		
		var start = Math.min(fromIndex, toIndex);
		var end = Math.max(fromIndex, toIndex);
		
		for (var i = start; i <= end; i++) {
			var nodeId = visibleNodes[i];
			this.selectedIds.add(nodeId);
			
			// If cascade, also select children of each
			if (this.options.cascadeSelect) {
				var node = this.nodeMap.get(nodeId);
				if (node) {
					this._selectDescendants(node);
				}
			}
		}
	};
	
	/**
	 * Get array of visible (expanded) node IDs in order
	 */
	TreeView.prototype._getVisibleNodeIds = function() {
		var self = this;
		var result = [];
		
		function traverse(nodes) {
			nodes.forEach(function(node) {
				result.push(node.id);
				if (node.children && node.children.length > 0 && self.expandedIds.has(node.id)) {
					traverse(node.children);
				}
			});
		}
		
		traverse(this.nodes);
		return result;
	};
	
	/**
	 * Update selection UI for changed nodes
	 */
	TreeView.prototype._updateSelectionUI = function(prevSelected) {
		var self = this;
		
		// Find nodes that changed
		var allIds = new Set([...prevSelected, ...this.selectedIds, ...this.indeterminateIds]);
		
		allIds.forEach(function(nodeId) {
			self._updateNodeSelectionUI(nodeId);
		});
	};
	
	/**
	 * Update a single node's selection UI
	 */
	TreeView.prototype._updateNodeSelectionUI = function(nodeId) {
		var nodeEl = this.container.querySelector('[data-node-id="' + nodeId + '"]');
		if (!nodeEl) return;
		
		var row = nodeEl.querySelector('.tree-view-row');
		var checkbox = nodeEl.querySelector('.tree-view-checkbox');
		var isSelected = this.selectedIds.has(nodeId);
		var isIndeterminate = this.indeterminateIds.has(nodeId);
		
		if (row) {
			row.classList.toggle('tree-view-selected', isSelected);
			row.setAttribute('aria-selected', isSelected ? 'true' : 'false');
		}
		
		if (checkbox) {
			var D = Funky.Dom;
			checkbox.classList.remove('tree-view-checkbox-checked', 'tree-view-checkbox-indeterminate');
			checkbox.replaceChildren();
			if (isSelected) {
				checkbox.classList.add('tree-view-checkbox-checked');
				checkbox.appendChild(D.icon('fas fa-check-square').el);
			} else if (isIndeterminate) {
				checkbox.classList.add('tree-view-checkbox-indeterminate');
				checkbox.appendChild(D.icon('fas fa-minus-square').el);
			} else {
				checkbox.appendChild(D.icon('far fa-square').el);
			}
		}
	};
	
	/**
	 * Emit selection change event
	 */
	TreeView.prototype._emitSelectionChange = function(prevSelected) {
		var self = this;
		var currentIds = Array.from(this.selectedIds);
		var prevIds = Array.from(prevSelected);
		
		var added = currentIds.filter(function(id) { return !prevSelected.has(id); });
		var removed = prevIds.filter(function(id) { return !self.selectedIds.has(id); });
		
		var nodes = currentIds.map(function(id) { return self.nodeMap.get(id); }).filter(Boolean);
		
		var payload = {
			nodes: nodes,
			ids: currentIds,
			added: added,
			removed: removed
		};
		
		// Callback
		if (typeof this.options.onSelect === 'function') {
			this.options.onSelect.call(this, payload);
		}
		
		// Custom event
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.select', { 
			detail: payload,
			bubbles: true 
		}));
	};

	// =========================================================================
	// Keyboard Navigation
	// =========================================================================
	
	/**
	 * Register keyboard shortcuts with Funky.Keyboard
	 */
	TreeView.prototype._registerKeyboardShortcuts = function() {
		var self = this;
		var scope = this.element.id ? '#' + this.element.id : 'global';
		
		// Store unregister functions for cleanup
		this._keyboardUnregisters = [];
		
		// Check if Funky.Keyboard is available
		if (typeof Funky === 'undefined' || !Funky.Keyboard) {
			console.warn('[TreeView] Funky.Keyboard not available, using fallback keydown handler');
			this._useFallbackKeyboard = true;
			return;
		}
		
		// Helper to remove mouse focus class
		var removeMouseFocus = function() {
			self.container.classList.remove('tree-view-mouse-focus');
		};
		
		// Navigation shortcuts
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'down',
				scope: scope,
				handler: function() { removeMouseFocus(); self._moveFocus(1); },
				description: 'Move focus down',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: 'up',
				scope: scope,
				handler: function() { removeMouseFocus(); self._moveFocus(-1); },
				description: 'Move focus up',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: 'right',
				scope: scope,
				handler: function() { removeMouseFocus(); self._handleRightArrow(); },
				description: 'Expand node / Move to child',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: 'left',
				scope: scope,
				handler: function() { removeMouseFocus(); self._handleLeftArrow(); },
				description: 'Collapse node / Move to parent',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: 'home',
				scope: scope,
				handler: function() { removeMouseFocus(); self._focusFirst(); },
				description: 'Focus first node',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: 'end',
				scope: scope,
				handler: function() { removeMouseFocus(); self._focusLast(); },
				description: 'Focus last node',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: 'enter',
				scope: scope,
				handler: function(e) { removeMouseFocus(); self._selectFocused(e); },
				description: 'Select focused node',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: 'space',
				scope: scope,
				handler: function(e) { removeMouseFocus(); self._toggleFocusedCheckbox(e); },
				description: 'Toggle checkbox',
				group: 'Tree View'
			}),
			
			Funky.Keyboard.register({
				key: '*',
				scope: scope,
				handler: function() { removeMouseFocus(); self._expandSiblings(); },
				description: 'Expand all siblings',
				group: 'Tree View'
			}),

			// Escape: clear filter if active, otherwise let global handler pop focus
			Funky.Keyboard.register({
				key: 'escape',
				scope: scope,
				handler: function(e) {
					removeMouseFocus();
					// If filter has value, clear it
					if (self.filterQuery && self.searchInput) {
						e.preventDefault();
						self.clearFilter();
						self.searchInput.focus();
						return;
					}
					// Otherwise, don't prevent default - let global Escape handler pop focus
				},
				description: 'Clear filter / Exit tree',
				group: 'Tree View',
				priority: 50  // Higher than global escape (-100) but lower than modal/palette
			})
		);

		// Undo shortcut (only if draggable)
		if (this.options.draggable) {
			this._keyboardUnregisters.push(
				Funky.Keyboard.register({
					key: 'z',
					mod: true,
					scope: scope,
					handler: function() {
						removeMouseFocus();
						if (self.canUndo()) {
							self.undo();
						}
					},
					description: 'Undo drag operation',
					group: 'Tree View'
				})
			);
		}
	};
	
	/**
	 * Handle keyboard events (fallback when Funky.Keyboard not available)
	 */
	TreeView.prototype._handleKeydown = function(e) {
		// Always handle keydown directly when focus is in the tree
		// This ensures keyboard nav works even if Funky.Keyboard scope check fails
		// (e.g., during rapid DOM updates or test runs)
		
		var key = e.key;
		
		// Remove mouse focus class on keyboard interaction
		this.container.classList.remove('tree-view-mouse-focus');
		
		// Handle Ctrl+Z / Cmd+Z for undo
		if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'z' && !e.shiftKey) {
			if (this.options.draggable && this.canUndo()) {
				e.preventDefault();
				this.undo();
				return;
			}
		}
		
		switch (key) {
			case 'ArrowDown':
				e.preventDefault();
				this._moveFocus(1);
				break;
				
			case 'ArrowUp':
				e.preventDefault();
				this._moveFocus(-1);
				break;
				
			case 'ArrowRight':
				e.preventDefault();
				this._handleRightArrow();
				break;
				
			case 'ArrowLeft':
				e.preventDefault();
				this._handleLeftArrow();
				break;
				
			case 'Home':
				e.preventDefault();
				this._focusFirst();
				break;
				
			case 'End':
				e.preventDefault();
				this._focusLast();
				break;
				
			case 'Enter':
				e.preventDefault();
				this._selectFocused(e);
				break;
				
			case ' ':
				e.preventDefault();
				this._toggleFocusedCheckbox(e);
				break;
				
			case '*':
				e.preventDefault();
				this._expandSiblings();
				break;

			case 'Escape':
				// If filter has value, clear it
				if (this.filterQuery && this.searchInput) {
					e.preventDefault();
					this.clearFilter();
					this.searchInput.focus();
					return;
				}
				// Otherwise, let global Escape handler pop focus (don't preventDefault)
				break;

			default:
				// Type-ahead search for printable characters
				if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
					this._typeAhead(key);
				}
		}
	};
	
	/**
	 * Move focus by delta (+1 or -1)
	 */
	TreeView.prototype._moveFocus = function(delta) {
		var visibleIds = this._getVisibleNodeIds();
		if (visibleIds.length === 0) return;
		
		var currentIndex = this.focusedNodeId !== null 
			? visibleIds.indexOf(this.focusedNodeId) 
			: -1;
		
		var newIndex;
		if (currentIndex === -1) {
			newIndex = delta > 0 ? 0 : visibleIds.length - 1;
		} else {
			newIndex = currentIndex + delta;
			if (newIndex < 0) newIndex = 0;
			if (newIndex >= visibleIds.length) newIndex = visibleIds.length - 1;
		}
		
		this._focusNode(visibleIds[newIndex]);
	};
	
	/**
	 * Handle right arrow - expand or move to first child
	 */
	TreeView.prototype._handleRightArrow = function() {
		if (this.focusedNodeId === null) return;
		
		var node = this.nodeMap.get(this.focusedNodeId);
		if (!node) return;
		
		var hasChildren = node.children && node.children.length > 0;
		
		if (hasChildren) {
			if (!this.expandedIds.has(this.focusedNodeId)) {
				// Expand
				this.expand(this.focusedNodeId);
				this._announce('Expanded');
			} else {
				// Move to first child
				this._focusNode(node.children[0].id);
			}
		}
	};
	
	/**
	 * Handle left arrow - collapse or move to parent
	 */
	TreeView.prototype._handleLeftArrow = function() {
		if (this.focusedNodeId === null) return;
		
		var node = this.nodeMap.get(this.focusedNodeId);
		if (!node) return;
		
		var hasChildren = node.children && node.children.length > 0;
		
		if (hasChildren && this.expandedIds.has(this.focusedNodeId)) {
			// Collapse
			this.collapse(this.focusedNodeId);
			this._announce('Collapsed');
		} else if (node._parent) {
			// Move to parent
			this._focusNode(node._parent.id);
		}
	};
	
	/**
	 * Focus first node
	 */
	TreeView.prototype._focusFirst = function() {
		if (this.nodes.length > 0) {
			this._focusNode(this.nodes[0].id);
		}
	};
	
	/**
	 * Focus last visible node
	 */
	TreeView.prototype._focusLast = function() {
		var visibleIds = this._getVisibleNodeIds();
		if (visibleIds.length > 0) {
			this._focusNode(visibleIds[visibleIds.length - 1]);
		}
	};
	
	/**
	 * Select the focused node
	 */
	TreeView.prototype._selectFocused = function(e) {
		if (this.focusedNodeId === null) return;
		if (this.options.selectable === 'none') return;
		
		this._handleSelection(this.focusedNodeId, e);
	};
	
	/**
	 * Toggle checkbox for focused node (multi-select)
	 */
	TreeView.prototype._toggleFocusedCheckbox = function(e) {
		if (this.focusedNodeId === null) return;
		if (this.options.selectable !== 'multi') return;
		
		this._handleSelection(this.focusedNodeId, e);
	};
	
	/**
	 * Expand all siblings of focused node
	 */
	TreeView.prototype._expandSiblings = function() {
		if (this.focusedNodeId === null) return;
		
		var node = this.nodeMap.get(this.focusedNodeId);
		if (!node) return;
		
		var siblings = node._parent ? node._parent.children : this.nodes;
		var self = this;
		
		siblings.forEach(function(sibling) {
			if (sibling.children && sibling.children.length > 0) {
				self.expand(sibling.id);
			}
		});
		
		this._announce('Expanded all siblings');
	};
	
	/**
	 * Type-ahead search
	 */
	TreeView.prototype._typeAhead = function(char) {
		var self = this;
		
		// Clear timeout
		if (this.typeAheadTimeout) {
			clearTimeout(this.typeAheadTimeout);
		}
		
		// Append character
		this.typeAheadBuffer += char.toLowerCase();
		
		// Set timeout to clear buffer
		this.typeAheadTimeout = setTimeout(function() {
			self.typeAheadBuffer = '';
		}, 500);
		
		// Find matching node
		var visibleIds = this._getVisibleNodeIds();
		var startIndex = this.focusedNodeId !== null 
			? visibleIds.indexOf(this.focusedNodeId) + 1 
			: 0;
		
		// Search from current position to end, then wrap to start
		for (var i = 0; i < visibleIds.length; i++) {
			var index = (startIndex + i) % visibleIds.length;
			var node = this.nodeMap.get(visibleIds[index]);
			var label = (node.label || node.name || '').toLowerCase();
			
			if (label.startsWith(this.typeAheadBuffer)) {
				this._focusNode(visibleIds[index]);
				return;
			}
		}
	};
	
	/**
	 * Focus a specific node
	 */
	TreeView.prototype._focusNode = function(nodeId) {
		var prevFocused = this.focusedNodeId;
		this.focusedNodeId = nodeId;
		
		// Update DOM
		if (prevFocused !== null) {
			var prevRow = this.container.querySelector('[data-node-id="' + prevFocused + '"] .tree-view-row');
			if (prevRow) {
				prevRow.classList.remove('tree-view-focused');
				prevRow.setAttribute('tabindex', '-1');
			}
		}
		
		var row = this.container.querySelector('[data-node-id="' + nodeId + '"] .tree-view-row');
		if (row) {
			row.classList.add('tree-view-focused');
			row.setAttribute('tabindex', '0');
			row.focus();
			
			// Scroll into view if needed
			row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	};
	
	/**
	 * Announce message to screen readers
	 */
	TreeView.prototype._announce = function(message) {
		if (this.liveRegion) {
			this.liveRegion.textContent = message;
			
			// Clear after announcement
			var self = this;
			setTimeout(function() {
				self.liveRegion.textContent = '';
			}, 1000);
		}
	};

	// =========================================================================
	// Public API: Search & Filter
	// =========================================================================
	
	/**
	 * Filter nodes by search query
	 * @param {string} query - The search query
	 */
	TreeView.prototype.filter = function(query) {
		if (!query || typeof query !== 'string') {
			this.clearFilter();
			return;
		}
		
		query = query.trim().toLowerCase();
		if (query === this.filterQuery) return;
		
		// Store pre-filter state on first filter
		if (this.preFilterExpandedIds === null) {
			this.preFilterExpandedIds = new Set(this.expandedIds);
		}
		
		this.filterQuery = query;
		
		// Find matching nodes
		var matches = this._findMatches(query);
		this.filteredIds = new Set(matches.map(function(n) { return n.id; }));
		
		// Add all ancestors of matches (to keep path visible)
		var ancestorIds = new Set();
		var self = this;
		matches.forEach(function(node) {
			self._collectAncestorIds(node, ancestorIds);
		});
		
		// Merge ancestors into filtered set
		ancestorIds.forEach(function(id) {
			self.filteredIds.add(id);
		});
		
		// Auto-expand ancestors
		if (this.options.autoExpandMatches) {
			ancestorIds.forEach(function(id) {
				self.expandedIds.add(id);
			});
		}
		
		// Update input if needed
		if (this.searchInput && this.searchInput.value !== query) {
			this.searchInput.value = query;
			if (this.searchClearBtn) {
				this.searchClearBtn.style.display = 'flex';
			}
		}
		
		// Re-render
		this._render();
		
		// Emit event
		this._emitFilterEvent(query, matches);
		
		// Announce
		this._announce(matches.length + ' results found');
	};
	
	/**
	 * Clear the filter
	 */
	TreeView.prototype.clearFilter = function() {
		if (!this.filterQuery && this.filteredIds === null) return;
		
		var prevQuery = this.filterQuery;
		
		this.filterQuery = '';
		this.filteredIds = null;
		this.searchResults.clear();
		
		// Restore pre-filter expanded state
		if (this.preFilterExpandedIds !== null) {
			this.expandedIds = new Set(this.preFilterExpandedIds);
			this.preFilterExpandedIds = null;
		}
		
		// Clear input
		if (this.searchInput) {
			this.searchInput.value = '';
			if (this.searchClearBtn) {
				this.searchClearBtn.style.display = 'none';
			}
		}
		
		// Re-render
		this._render();
		
		// Emit event
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.filterClear', {
			detail: { previousQuery: prevQuery },
			bubbles: true
		}));
		
		this._announce('Filter cleared');
	};
	
	/**
	 * Get filtered nodes (visible after filter)
	 * @returns {Array} Array of node objects
	 */
	TreeView.prototype.getFilteredNodes = function() {
		if (this.filteredIds === null) {
			return this._getAllNodes();
		}
		
		var self = this;
		var nodes = [];
		this.filteredIds.forEach(function(id) {
			var node = self.nodeMap.get(id);
			if (node) nodes.push(node);
		});
		return nodes;
	};
	
	/**
	 * Check if a filter is active
	 * @returns {boolean}
	 */
	TreeView.prototype.isFiltered = function() {
		return this.filteredIds !== null && this.filterQuery !== '';
	};
	
	/**
	 * Find nodes matching the query
	 * @private
	 */
	TreeView.prototype._findMatches = function(query) {
		var options = this.options;
		var useFuzzy = options.fuzzySearch && Funky.FuzzySearch;
		
		// Clear previous results
		this.searchResults.clear();
		
		if (useFuzzy) {
			return this._findMatchesFuzzy(query);
		} else {
			return this._findMatchesIndexOf(query);
		}
	};

	/**
	 * Fuzzy search using Funky.FuzzySearch
	 * @private
	 */
	TreeView.prototype._findMatchesFuzzy = function(query) {
		var self = this;
		var options = this.options;
		var FuzzySearch = Funky.FuzzySearch;
		var fields = options.searchFields;
		
		// Collect all nodes as array for FuzzySearch
		var nodes = this._getAllNodes();
		
		// Perform fuzzy search
		var searchResults = FuzzySearch.search(query, nodes, {
			keys: fields,
			threshold: options.fuzzyThreshold,
			tokenize: options.fuzzyTokenize,
			limit: Infinity
		});
		
		var matches = [];
		
		// Store results for highlighting and populate matches
		searchResults.forEach(function(result) {
			var node = result.item;
			matches.push(node);
			
			// Store for later highlighting
			self.searchResults.set(node.id, {
				score: result.score,
				matches: result.matches,
				key: result.key
			});
		});
		
		return matches;
	};

	/**
	 * Legacy indexOf search (backwards compatible)
	 * @private
	 */
	TreeView.prototype._findMatchesIndexOf = function(query) {
		var self = this;
		var matches = [];
		var fields = this.options.searchFields;
		var lowerQuery = query.toLowerCase();
		
		this.nodeMap.forEach(function(node) {
			for (var i = 0; i < fields.length; i++) {
				var value = node[fields[i]];
				if (value && typeof value === 'string') {
					var lowerValue = value.toLowerCase();
					var index = lowerValue.indexOf(lowerQuery);
					
					if (index !== -1) {
						matches.push(node);
						
						// Store simple match positions for highlighting
						var positions = [];
						for (var j = 0; j < lowerQuery.length; j++) {
							positions.push([index + j, index + j]);
						}
						self.searchResults.set(node.id, {
							score: 1,
							matches: positions,
							key: fields[i]
						});
						break;
					}
				}
			}
		});
		
		return matches;
	};
	
	/**
	 * Collect all ancestor IDs for a node
	 * @private
	 */
	TreeView.prototype._collectAncestorIds = function(node, ancestorIds) {
		var current = node._parent;
		while (current) {
			ancestorIds.add(current.id);
			current = current._parent;
		}
	};
	
	/**
	 * Get all nodes as array
	 * @private
	 */
	TreeView.prototype._getAllNodes = function() {
		var nodes = [];
		this.nodeMap.forEach(function(node) {
			nodes.push(node);
		});
		return nodes;
	};

	/**
	 * Get highlighted label for a node
	 * @param {Object} node
	 * @returns {string} HTML with highlights or escaped plain text
	 */
	TreeView.prototype.getHighlightedLabel = function(node) {
		var label = node.label || node.name || '';
		
		if (!this.filterQuery || !this.options.highlightMatches) {
			return Funky.Util && Funky.Util.escapeHtml ? Funky.Util.escapeHtml(label) : label;
		}
		
		var result = this.searchResults.get(node.id);
		
		if (!result || !result.matches || result.matches.length === 0) {
			return Funky.Util && Funky.Util.escapeHtml ? Funky.Util.escapeHtml(label) : label;
		}
		
		// Only highlight if the match was on label or name field
		var matchField = result.key;
		if (matchField && matchField !== 'label' && matchField !== 'name') {
			return Funky.Util && Funky.Util.escapeHtml ? Funky.Util.escapeHtml(label) : label;
		}
		
		// Use Funky.Highlight if available
		if (Funky.Highlight && Funky.Highlight.fromMatches) {
			return Funky.Highlight.fromMatches(label, result.matches);
		}
		
		// Fallback: manual highlight
		return this._highlightMatches(label, result.matches);
	};

	/**
	 * Manual highlight fallback when Funky.Highlight not available
	 * @private
	 */
	TreeView.prototype._highlightMatches = function(text, matches) {
		if (!text || !matches || !matches.length) {
			return Funky.Util && Funky.Util.escapeHtml ? Funky.Util.escapeHtml(text) : text;
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
		var escapeHtml = Funky.Util && Funky.Util.escapeHtml ? Funky.Util.escapeHtml : function(s) { return s; };
		
		for (var i = 0; i < text.length; i++) {
			var shouldHighlight = !!highlightSet[i];
			
			if (shouldHighlight && !inHighlight) {
				result += '<mark class="tree-view__highlight">';
				inHighlight = true;
			} else if (!shouldHighlight && inHighlight) {
				result += '</mark>';
				inHighlight = false;
			}
			
			result += escapeHtml(text.charAt(i));
		}
		
		if (inHighlight) {
			result += '</mark>';
		}
		
		return result;
	};

	/**
	 * Get search score for a node
	 * @param {string|Object} nodeOrId
	 * @returns {number|null} Score 0-1 or null if not matched
	 */
	TreeView.prototype.getSearchScore = function(nodeOrId) {
		var id = typeof nodeOrId === 'object' ? nodeOrId.id : nodeOrId;
		var result = this.searchResults.get(id);
		return result ? result.score : null;
	};

	/**
	 * Get search result for a node
	 * @param {string|Object} nodeOrId
	 * @returns {Object|null} { score, matches, key } or null
	 */
	TreeView.prototype.getSearchResult = function(nodeOrId) {
		var id = typeof nodeOrId === 'object' ? nodeOrId.id : nodeOrId;
		return this.searchResults.get(id) || null;
	};
	
	/**
	 * Emit filter event
	 * @private
	 */
	TreeView.prototype._emitFilterEvent = function(query, matches) {
		var payload = {
			query: query,
			matches: matches,
			count: matches.length
		};
		
		if (typeof this.options.onFilter === 'function') {
			this.options.onFilter.call(this, payload);
		}
		
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.filter', {
			detail: payload,
			bubbles: true
		}));
	};

	// =========================================================================
	// Public API: Expand/Collapse
	// =========================================================================
	
	/**
	 * Expand a node by ID
	 */
	TreeView.prototype.expand = function(nodeId) {
		var self = this;
		var node = this.nodeMap.get(nodeId);
		if (!node) return this;
		if (this.expandedIds.has(nodeId)) return this;
		
		// Check if this is a lazy node that needs loading
		var hasChildren = node.children && node.children.length > 0;
		var isLazy = node.hasChildren && !hasChildren && !this.loadedIds.has(nodeId);
		
		if (isLazy && this.options.onLoadChildren) {
			// Load children first
			this._loadChildren(nodeId);
			return this;
		}
		
		// Regular expand (has children already)
		if (!hasChildren && !node.hasChildren) return this;
		
		this.expandedIds.add(nodeId);
		this._updateNodeExpanded(nodeId, true);
		
		// Apply Morph animation if available
		if (this._shouldUseMorph()) {
			var nodeEl = this.container.querySelector('[data-node-id="' + nodeId + '"]');
			if (nodeEl) {
				var childrenEl = nodeEl.querySelector('.tree-view-children');
				var row = nodeEl.querySelector('.tree-view-row');
				if (childrenEl && row) {
					this._morphExpand(nodeId, nodeEl, childrenEl, row);
				}
			}
		}
		
		if (typeof this.options.onExpand === 'function') {
			this.options.onExpand.call(this, node);
		}
		return this;
	};
	
	/**
	 * Collapse a node by ID
	 */
	TreeView.prototype.collapse = function(nodeId) {
		var self = this;
		var node = this.nodeMap.get(nodeId);
		if (!node) return this;
		if (!this.expandedIds.has(nodeId)) return this;
		
		// Check if we should use Morph animation
		if (this._shouldUseMorph()) {
			var nodeEl = this.container.querySelector('[data-node-id="' + nodeId + '"]');
			if (nodeEl) {
				var childrenEl = nodeEl.querySelector('.tree-view-children');
				var row = nodeEl.querySelector('.tree-view-row');
				if (childrenEl && row) {
					// Animate first, then update state
					this._morphCollapse(nodeId, nodeEl, childrenEl, row, function() {
						self.expandedIds.delete(nodeId);
						self._updateNodeExpanded(nodeId, false);
						
						if (typeof self.options.onCollapse === 'function') {
							self.options.onCollapse.call(self, node);
						}
					});
					return this;
				}
			}
		}
		
		// No Morph - immediate collapse
		this.expandedIds.delete(nodeId);
		this._updateNodeExpanded(nodeId, false);
		
		if (typeof this.options.onCollapse === 'function') {
			this.options.onCollapse.call(this, node);
		}
		return this;
	};
	
	/**
	 * Toggle expand/collapse for a node
	 */
	TreeView.prototype.toggle = function(nodeId) {
		if (this.expandedIds.has(nodeId)) {
			this.collapse(nodeId);
		} else {
			this.expand(nodeId);
		}
		return this;
	};
	
	/**
	 * Expand all nodes
	 */
	TreeView.prototype.expandAll = function() {
		var self = this;
		this.nodeMap.forEach(function(node, id) {
			if (node.children && node.children.length > 0) {
				self.expandedIds.add(id);
			}
		});
		this._render();
	};
	
	/**
	 * Collapse all nodes
	 */
	TreeView.prototype.collapseAll = function() {
		this.expandedIds.clear();
		this._render();
	};
	
	/**
	 * Update DOM for a single node's expanded state
	 */
	TreeView.prototype._updateNodeExpanded = function(nodeId, isExpanded) {
		var nodeEl = this.container.querySelector('[data-node-id="' + nodeId + '"]');
		if (!nodeEl) return;
		
		var row = nodeEl.querySelector('.tree-view-row');
		var chevron = nodeEl.querySelector('.tree-view-chevron');
		var childrenEl = nodeEl.querySelector('.tree-view-children');
		var iconEl = nodeEl.querySelector('.tree-view-icon i');
		
		if (row) {
			row.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
		}
		
		if (chevron) {
			chevron.classList.toggle('tree-view-chevron-expanded', isExpanded);
		}
		
		if (childrenEl) {
			if (isExpanded) {
				childrenEl.classList.remove('tree-view-children-collapsed');
			} else {
				childrenEl.classList.add('tree-view-children-collapsed');
			}
		}
		
		// Update icon
		if (iconEl) {
			var node = this.nodeMap.get(nodeId);
			if (node && !node.icon) {
				// Only update if using default icons
				var iconClass = isExpanded 
					? this.options.iconMap.folderOpen 
					: this.options.iconMap.folder;
				iconEl.className = 'fas ' + iconClass;
			}
		}
	};

	/**
	 * Check if Morph should be used for this tree
	 * @returns {boolean}
	 */
	TreeView.prototype._shouldUseMorph = function() {
		return hasMorph && 
		       this.options.useMorph && 
		       this.options.animationDuration > 0 &&
		       !prefersReducedMotion();
	};

	/**
	 * Animate expand using Morph FLIP
	 * Children slide down from parent row position with stagger
	 * @param {string|number} nodeId - Node being expanded
	 * @param {Element} nodeEl - Node DOM element
	 * @param {Element} childrenEl - Children container element
	 * @param {Element} row - Parent row element
	 */
	TreeView.prototype._morphExpand = function(nodeId, nodeEl, childrenEl, row) {
		var self = this;
		var duration = this.options.animationDuration;
		var stagger = this.options.staggerChildren ? this.options.staggerDelay : 0;
		var easing = this.options.morphEasing;

		// Get child nodes (direct children only)
		var childNodes = childrenEl.querySelectorAll(':scope > .tree-view-node');
		if (childNodes.length === 0) return;

		// Get parent row position as starting point
		var parentRect = row.getBoundingClientRect();

		// Prepare each child for animation
		for (var i = 0; i < childNodes.length; i++) {
			var childNode = childNodes[i];
			var childRow = childNode.querySelector('.tree-view-row');
			if (!childRow) continue;

			// Set initial state: positioned at parent row, invisible
			childRow.style.opacity = '0';
			childRow.style.transform = 'translateY(-' + (childRow.offsetTop - row.offsetTop + 10) + 'px)';
		}

		// Force reflow
		childrenEl.offsetHeight;

		// Animate each child with stagger
		for (var j = 0; j < childNodes.length; j++) {
			(function(index) {
				var childNode = childNodes[index];
				var childRow = childNode.querySelector('.tree-view-row');
				if (!childRow) return;

				var delay = stagger * index;

				setTimeout(function() {
					// Apply transition
					childRow.style.transition = 'opacity ' + duration + 'ms ' + Morph.resolveEasing(easing) + ', ' +
					                             'transform ' + duration + 'ms ' + Morph.resolveEasing(easing);
					childRow.style.opacity = '1';
					childRow.style.transform = 'translateY(0)';

					// Cleanup after animation
					setTimeout(function() {
						childRow.style.transition = '';
						childRow.style.opacity = '';
						childRow.style.transform = '';
					}, duration);
				}, delay);
			})(j);
		}
	};

	/**
	 * Animate collapse using Morph FLIP
	 * Children slide up toward parent row position with reverse stagger
	 * @param {string|number} nodeId - Node being collapsed
	 * @param {Element} nodeEl - Node DOM element
	 * @param {Element} childrenEl - Children container element
	 * @param {Element} row - Parent row element
	 * @param {Function} onComplete - Called when animation completes
	 */
	TreeView.prototype._morphCollapse = function(nodeId, nodeEl, childrenEl, row, onComplete) {
		var self = this;
		var duration = this.options.animationDuration;
		var stagger = this.options.staggerChildren ? this.options.staggerDelay : 0;
		var easing = this.options.morphEasing;

		// Get child nodes (direct children only)
		var childNodes = childrenEl.querySelectorAll(':scope > .tree-view-node');
		if (childNodes.length === 0) {
			onComplete();
			return;
		}

		// Get parent row position as target
		var parentRect = row.getBoundingClientRect();
		var animationsRemaining = childNodes.length;

		// Animate each child with reverse stagger (last child first)
		for (var i = childNodes.length - 1; i >= 0; i--) {
			(function(index, reverseIndex) {
				var childNode = childNodes[index];
				var childRow = childNode.querySelector('.tree-view-row');
				if (!childRow) {
					animationsRemaining--;
					if (animationsRemaining === 0) onComplete();
					return;
				}

				var delay = stagger * reverseIndex;
				var translateY = -(childRow.offsetTop - row.offsetTop + 10);

				setTimeout(function() {
					// Apply transition
					childRow.style.transition = 'opacity ' + duration + 'ms ' + Morph.resolveEasing(easing) + ', ' +
					                             'transform ' + duration + 'ms ' + Morph.resolveEasing(easing);
					childRow.style.opacity = '0';
					childRow.style.transform = 'translateY(' + translateY + 'px)';

					// Complete after animation
					setTimeout(function() {
						childRow.style.transition = '';
						childRow.style.opacity = '';
						childRow.style.transform = '';
						animationsRemaining--;
						if (animationsRemaining === 0) {
							onComplete();
						}
					}, duration);
				}, delay);
			})(i, childNodes.length - 1 - i);
		}
	};

	// =========================================================================
	// Public API: Drag and Drop
	// =========================================================================
	
	/**
	 * Enable or disable drag mode
	 * @param {boolean} enabled - Whether drag is enabled
	 */
	TreeView.prototype.enableDrag = function(enabled) {
		this.dragEnabled = enabled;
		
		if (enabled && !this._boundHandlers.dragstart) {
			this._bindDragEvents();
		}
		
		// Re-render to update draggable attributes
		this._render();
	};
	
	/**
	 * Programmatically move a node
	 * @param {string|number} nodeId - Node to move
	 * @param {string|number|null} newParentId - New parent (null for root)
	 * @param {number} index - Position in new parent's children
	 */
	TreeView.prototype.moveNode = function(nodeId, newParentId, index) {
		var node = this.nodeMap.get(nodeId);
		if (!node) return;
		
		var newParent = newParentId ? this.nodeMap.get(newParentId) : null;
		
		this._moveNode(node, newParent, index || 0);
	};

	// =========================================================================
	// Public API: Lazy Loading
	// =========================================================================
	
	/**
	 * Load children for a lazy node
	 * @param {string|number} nodeId - Node ID to load children for
	 */
	TreeView.prototype.loadChildren = function(nodeId) {
		this._loadChildren(nodeId);
	};
	
	/**
	 * Refresh a node (clear cache and reload children)
	 * @param {string|number} nodeId - Node ID to refresh
	 */
	TreeView.prototype.refreshNode = function(nodeId) {
		var node = this.nodeMap.get(nodeId);
		if (!node) return;
		
		// Clear cached children
		this.loadedIds.delete(nodeId);
		this.errorIds.delete(nodeId);
		
		// Clear existing children
		node.children = [];
		
		// Collapse and re-expand to trigger load
		if (this.expandedIds.has(nodeId)) {
			this.expandedIds.delete(nodeId);
		}
		
		// Trigger load
		this._loadChildren(nodeId);
	};
	
	/**
	 * Clear all cached children
	 */
	TreeView.prototype.clearCache = function() {
		var self = this;
		
		this.loadedIds.forEach(function(nodeId) {
			var node = self.nodeMap.get(nodeId);
			if (node && node.hasChildren) {
				node.children = [];
			}
		});
		
		this.loadedIds.clear();
		this.errorIds.clear();
	};
	
	/**
	 * Internal: Load children for a node
	 * @private
	 */
	TreeView.prototype._loadChildren = function(nodeId) {
		var self = this;
		var node = this.nodeMap.get(nodeId);
		
		if (!node || !this.options.onLoadChildren) return;
		if (this.loadingIds.has(nodeId)) return; // Already loading
		
		// Set loading state
		this.loadingIds.add(nodeId);
		this.errorIds.delete(nodeId);
		this._updateNodeLoadingState(nodeId);
		
		// Emit event
		this.element.dispatchEvent(new CustomEvent('funky.tree-view.loadStart', {
			detail: { node: node },
			bubbles: true
		}));
		
		// Done callback
		function done(children) {
			self.loadingIds.delete(nodeId);
			
			if (self.options.cacheChildren) {
				self.loadedIds.add(nodeId);
			}
			
			// Add children to node
			self._addLoadedChildren(node, children);
			
			// Expand the node
			self.expandedIds.add(nodeId);
			
			// Re-render the node
			self._render();
			
			// Emit event
			self.element.dispatchEvent(new CustomEvent('funky.tree-view.load', {
				detail: { node: node, children: children, count: children.length },
				bubbles: true
			}));
			
			if (typeof self.options.onExpand === 'function') {
				self.options.onExpand.call(self, node);
			}
		}
		
		// Fail callback
		function fail(error) {
			self.loadingIds.delete(nodeId);
			self.errorIds.add(nodeId);
			self._updateNodeLoadingState(nodeId);
			
			// Emit event
			self.element.dispatchEvent(new CustomEvent('funky.tree-view.loadError', {
				detail: { node: node, error: error },
				bubbles: true
			}));
			
			if (typeof self.options.onLoadError === 'function') {
				self.options.onLoadError.call(self, node, error);
			}
		}
		
		// Call the load callback
		try {
			var result = this.options.onLoadChildren.call(this, node, done, fail);
			
			// Support Promise return
			if (result && typeof result.then === 'function') {
				result.then(done).catch(fail);
			}
		} catch (error) {
			fail(error);
		}
	};
	
	/**
	 * Add loaded children to a node
	 * @private
	 */
	TreeView.prototype._addLoadedChildren = function(parentNode, children) {
		var self = this;
		
		if (!Array.isArray(children)) {
			children = [];
		}
		
		parentNode.children = children.map(function(child) {
			// Clone and normalize
			var node = Object.assign({}, child);
			node._parent = parentNode;
			node._depth = parentNode._depth + 1;
			node.children = node.children || [];
			
			// Add to nodeMap
			self.nodeMap.set(node.id, node);
			
			return node;
		});
	};
	
	/**
	 * Update DOM for loading/error state
	 * @private
	 */
	TreeView.prototype._updateNodeLoadingState = function(nodeId) {
		var nodeEl = this.container.querySelector('[data-node-id="' + nodeId + '"]');
		if (!nodeEl) return;
		
		var isLoading = this.loadingIds.has(nodeId);
		var hasError = this.errorIds.has(nodeId);
		
		// Toggle loading class
		nodeEl.classList.toggle('tree-view-loading', isLoading);
		nodeEl.classList.toggle('tree-view-error', hasError);
		
		// Update chevron to spinner while loading
		var chevron = nodeEl.querySelector('.tree-view-chevron i');
		if (chevron) {
			if (isLoading) {
				chevron.className = 'fas ' + this.options.iconMap.loading;
			} else {
				chevron.className = 'fas fa-chevron-right';
			}
		}
		
		// Handle loading/error placeholder
		var childrenEl = nodeEl.querySelector('.tree-view-children');
		if (!childrenEl) {
			// Create children container for loading/error states
			childrenEl = document.createElement('div');
			childrenEl.className = 'tree-view-children';
			childrenEl.setAttribute('role', 'group');
			nodeEl.appendChild(childrenEl);
		}
		
		// Remove any existing loading/error placeholders
		var existing = childrenEl.querySelector('.tree-view-loading-placeholder, .tree-view-error-placeholder');
		if (existing) {
			existing.remove();
		}
		
		if (isLoading) {
			var D = Funky.Dom;
			childrenEl.classList.remove('tree-view-children-collapsed');
			var loadingEl = D.div().class('tree-view-loading-placeholder').child(
				D.icon('fas fa-spinner fa-spin me-2'),
				Funky.Util.toDom(this.options.loadingText)
			).get();
			childrenEl.appendChild(loadingEl);
		} else if (hasError) {
			var self = this;
			var D = Funky.Dom;
			childrenEl.classList.remove('tree-view-children-collapsed');
			var retryBtn = D.button().attr('type', 'button').class('tree-view-retry-btn').get();
			retryBtn.appendChild(Funky.Util.toDom(this.options.retryText));
			var errorEl = D.div().class('tree-view-error-placeholder').child(
				D.icon('fas fa-exclamation-triangle me-2'),
				Funky.Util.toDom(this.options.errorText),
				retryBtn
			).get();
			
			errorEl.querySelector('.tree-view-retry-btn').addEventListener('click', function(e) {
				e.stopPropagation();
				self.refreshNode(nodeId);
			});
			
			childrenEl.appendChild(errorEl);
		}
	};

	// =========================================================================
	// Public API: Data
	// =========================================================================
	
	/**
	 * Refresh tree with new data
	 */
	TreeView.prototype.refresh = function(newData) {
		if (newData !== undefined) {
			this._normaliseData(newData);
		}
		this._render();
	};
	
	/**
	 * Get a node by ID
	 */
	TreeView.prototype.getNode = function(nodeId) {
		return this.nodeMap.get(nodeId) || null;
	};
	
	/**
	 * Get all nodes as flat array
	 */
	TreeView.prototype.getAllNodes = function() {
		return Array.from(this.nodeMap.values());
	};

	// =========================================================================
	// Public API: Selection
	// =========================================================================
	
	/**
	 * Get selected nodes
	 */
	TreeView.prototype.getSelected = function() {
		var self = this;
		return Array.from(this.selectedIds).map(function(id) {
			return self.nodeMap.get(id);
		}).filter(Boolean);
	};
	
	/**
	 * Get selected node IDs
	 */
	TreeView.prototype.getSelectedIds = function() {
		return Array.from(this.selectedIds);
	};
	
	/**
	 * Select a node by ID
	 */
	TreeView.prototype.selectNode = function(nodeId) {
		if (this.options.selectable === 'none') return;
		
		var prevSelected = new Set(this.selectedIds);
		
		if (this.options.selectable === 'single') {
			this.selectedIds.clear();
			this.selectedIds.add(nodeId);
		} else {
			this._selectWithCascade(nodeId);
		}
		
		this.lastSelectedId = nodeId;
		this._updateSelectionUI(prevSelected);
		this._emitSelectionChange(prevSelected);
	};
	
	/**
	 * Deselect a node by ID
	 */
	TreeView.prototype.deselectNode = function(nodeId) {
		if (this.options.selectable === 'none') return;
		if (!this.selectedIds.has(nodeId)) return;
		
		var prevSelected = new Set(this.selectedIds);
		
		if (this.options.selectable === 'single') {
			this.selectedIds.delete(nodeId);
		} else {
			this._deselectWithCascade(nodeId);
		}
		
		this._updateSelectionUI(prevSelected);
		this._emitSelectionChange(prevSelected);
	};
	
	/**
	 * Select all nodes
	 */
	TreeView.prototype.selectAll = function() {
		if (this.options.selectable !== 'multi') return;
		
		var self = this;
		var prevSelected = new Set(this.selectedIds);
		
		this.nodeMap.forEach(function(node, id) {
			self.selectedIds.add(id);
		});
		this.indeterminateIds.clear();
		
		this._updateSelectionUI(prevSelected);
		this._emitSelectionChange(prevSelected);
	};
	
	/**
	 * Deselect all nodes
	 */
	TreeView.prototype.deselectAll = function() {
		if (this.options.selectable === 'none') return;
		
		var prevSelected = new Set(this.selectedIds);
		
		this.selectedIds.clear();
		this.indeterminateIds.clear();
		
		this._updateSelectionUI(prevSelected);
		this._emitSelectionChange(prevSelected);
	};
	
	/**
	 * Check if a node is selected
	 */
	TreeView.prototype.isSelected = function(nodeId) {
		return this.selectedIds.has(nodeId);
	};

	// =========================================================================
	// Cleanup
	// =========================================================================
	
	/**
	 * Destroy the tree view instance
	 */
	TreeView.prototype.destroy = function() {
		// Unregister keyboard shortcuts
		if (this._keyboardUnregisters) {
			this._keyboardUnregisters.forEach(function(unregister) {
				if (typeof unregister === 'function') {
					unregister();
				}
			});
			this._keyboardUnregisters = null;
		}

		// Remove all bound event listeners from container
		if (this._boundHandlers) {
			if (this._boundHandlers.click) {
				this.container.removeEventListener('click', this._boundHandlers.click);
			}
			if (this._boundHandlers.keydown) {
				this.container.removeEventListener('keydown', this._boundHandlers.keydown);
			}
			if (this._boundHandlers.focus) {
				this.container.removeEventListener('focus', this._boundHandlers.focus);
			}
			// Drag and drop handlers
			if (this._boundHandlers.dragstart) {
				this.container.removeEventListener('dragstart', this._boundHandlers.dragstart);
			}
			if (this._boundHandlers.dragend) {
				this.container.removeEventListener('dragend', this._boundHandlers.dragend);
			}
			if (this._boundHandlers.dragover) {
				this.container.removeEventListener('dragover', this._boundHandlers.dragover);
			}
			if (this._boundHandlers.dragleave) {
				this.container.removeEventListener('dragleave', this._boundHandlers.dragleave);
			}
			if (this._boundHandlers.drop) {
				this.container.removeEventListener('drop', this._boundHandlers.drop);
			}
			// Touch handlers
			if (this._boundHandlers.touchstart) {
				this.container.removeEventListener('touchstart', this._boundHandlers.touchstart);
			}
			if (this._boundHandlers.touchmove) {
				this.container.removeEventListener('touchmove', this._boundHandlers.touchmove);
			}
			if (this._boundHandlers.touchend) {
				this.container.removeEventListener('touchend', this._boundHandlers.touchend);
			}
			if (this._boundHandlers.touchcancel) {
				this.container.removeEventListener('touchcancel', this._boundHandlers.touchcancel);
			}
			this._boundHandlers = {};
		}

		// Remove search input event listeners
		if (this.searchInput) {
			// Note: These are anonymous functions, so we recreate the element approach
			// The element will be removed with the DOM, so this is for safety
			this.searchInput = null;
		}
		if (this.searchClearBtn) {
			this.searchClearBtn = null;
		}

		// Clear search debounce timer
		if (this.searchDebounceTimer) {
			clearTimeout(this.searchDebounceTimer);
			this.searchDebounceTimer = null;
		}

		// Clear DOM
		this.element.replaceChildren();
		this.element.classList.remove('funky-tree-view');

		// Remove from instance registry using the instance's id
		if (this.id) {
			_instances.unregister(this.id);
		}

		// Clear references
		delete this.element._funkyTreeView;
		this.nodeMap.clear();
		this.expandedIds.clear();
		this.selectedIds.clear();
		this.indeterminateIds.clear();
		this.nodes = [];

		console.log('[TreeView] Destroyed');
	};

	// =========================================================================
	// Bindable Interface (LiveBinding)
	// =========================================================================

	/**
	 * Set all tree data (Bindable Interface)
	 * Clears existing nodes and renders new ones
	 * @param {Array} data - Tree nodes array
	 */
	TreeView.prototype.setData = function(data) {
		this._normaliseData(data || []);
		this.expandedIds.clear();
		this.selectedIds.clear();
		this.indeterminateIds.clear();
		this._render();
	};

	/**
	 * Get all tree data (Bindable Interface)
	 * @returns {Array} Array of root nodes (nested structure)
	 */
	TreeView.prototype.getData = function() {
		return this.nodes;
	};

	/**
	 * Add nodes to the tree (Bindable Interface)
	 * @param {Array|Object} nodes - Node(s) to add at root level
	 */
	TreeView.prototype.addData = function(nodes) {
		var self = this;
		var nodesToAdd = Array.isArray(nodes) ? nodes : [nodes];
		
		nodesToAdd.forEach(function(nodeData) {
			var cloned = Object.assign({}, nodeData);
			cloned._parent = null;
			cloned._depth = 0;
			
			self.nodeMap.set(cloned.id, cloned);
			
			if (nodeData.children && nodeData.children.length > 0) {
				cloned.children = self._cloneAndIndex(nodeData.children, cloned);
			} else {
				cloned.children = [];
			}
			
			self.nodes.push(cloned);
		});
		
		this._render();
	};

	// =========================================================================
	// Static Factory
	// =========================================================================
	
	/**
	 * Initialize a new TreeView instance
	 */
	TreeView.init = function(selector, options) {
		return new TreeView(selector, options);
	};
	
	/**
	 * Get existing instance from element or ID
	 * @param {string|HTMLElement} idOrElement
	 * @returns {TreeView|null}
	 */
	TreeView.getInstance = function(idOrElement) {
		if (typeof idOrElement === 'string') {
			// Try as ID first
			var byId = _instances.get(idOrElement);
			if (byId) return byId;
			// Try as selector
			var el = document.querySelector(idOrElement);
			return el ? _instances.getByElement(el) : null;
		}
		return idOrElement ? _instances.getByElement(idOrElement) : null;
	};

	/**
	 * Destroy all TreeView instances
	 */
	TreeView.destroyAll = function() {
		_instances.destroyAll();
	};

	/**
	 * Get all TreeView instances
	 * @returns {Object}
	 */
	TreeView.getAll = function() {
		return _instances.getAll();
	};

	// =========================================================================
	// Factory API
	// =========================================================================

	var _instanceCounter = 0;

	var TreeViewFactory = {
		/**
		 * Initialize a tree view
		 * @param {HTMLElement|string} target - Container element or selector
		 * @param {Object} options - Configuration options
		 * @returns {TreeView}
		 */
		init: function(target, options) {
			var instance = new TreeView(target, options);
			instance.id = 'tree-view-' + (++_instanceCounter);
			_instances.register(instance.id, instance);
			return instance;
		},

		/**
		 * @deprecated Use init() instead
		 */
		create: function(target, options) {
			return this.init(target, options);
		},

		/**
		 * Get instance by ID
		 * @param {string} id - Instance ID
		 * @returns {TreeView|null}
		 */
		getInstance: function(id) {
			return _instances.get(id);
		},

		/**
		 * Destroy instance by ID
		 * @param {string} id - Instance ID
		 */
		destroy: function(id) {
			var instance = _instances.get(id);
			if (instance) {
				instance.destroy();
				_instances.unregister(id);
			}
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		/**
		 * Access to constructor for advanced use
		 */
		constructor: TreeView
	};

	Funky.register('TreeView', TreeViewFactory);

})(window.Funky = window.Funky || {});
