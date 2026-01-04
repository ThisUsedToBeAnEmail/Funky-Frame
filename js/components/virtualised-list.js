/**
 * Funky VirtualisedList - Efficient rendering for large datasets
 * 
 * Renders only visible items using DOM recycling, enabling smooth
 * 60fps scrolling through 100K+ items with minimal memory usage.
 * 
 * @module Funky.VirtualisedList
 */
(function(window, document) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('VirtualisedList')) {
		return;
	}

	// ============================================
	// VIRTUALISED LIST MODULE
	// ============================================

	var _instances = Funky.Registry.createInstanceRegistry('VirtualisedList');

	var VirtualisedList = {
		instanceCounter: 0
	};

	// ============================================
	// DEFAULT CONFIGURATION
	// ============================================

	var DEFAULTS = {
		items: [],
		itemHeight: 48,              // Fixed height per item, or 'auto' for variable
		estimatedItemHeight: 48,     // Used for variable height estimation
		overscan: 5,                 // Extra items to render above/below viewport
		containerHeight: null,       // Auto-detect if not specified
		
		// Rendering
		renderItem: null,            // function(item, index, highlighter) => HTML string
		getItemKey: null,            // function(item) => unique key
		
		// Selection
		selectable: 'none',          // 'none' | 'single' | 'multi'
		selectedIds: [],             // Initial selected item IDs
		selectOnFocus: false,        // Auto-select when focusing (single mode)
		
		// Infinite scroll
		hasMore: false,              // Whether more data is available
		loadMoreThreshold: 200,      // px from bottom to trigger load
		onLoadMore: null,            // function(done) - done(items, hasMore)
		loadingTemplate: null,       // Custom loading indicator HTML
		endOfListTemplate: null,     // Custom "no more items" HTML
		
		// Pull to refresh
		pullToRefresh: false,        // Enable pull-to-refresh on touch devices
		pullThreshold: 80,           // px to pull before triggering refresh
		onRefresh: null,             // function(done) - called on pull refresh
		
		// Scroll persistence
		persistScroll: false,        // Save/restore scroll position
		persistKey: null,            // sessionStorage key for scroll position
		
		// Data management
		searchFields: null,          // Array of field names to search, or function(item, query)
		fuzzySearch: false,          // Enable fuzzy matching (requires Funky.FuzzySearch)
		fuzzyThreshold: 0.3,         // Minimum fuzzy score (0-1) to be considered a match
		fuzzyTokenize: false,        // Split query into space-separated tokens
		
		// WebSocket integration
		wsEntity: null,              // Entity name for WebSocket updates (e.g., 'trades')
		wsChannel: null,             // Channel to subscribe to (defaults to 'entity:{wsEntity}')
		onEntityChange: null,        // function(action, id, data) - custom handler
		
		// Events
		onClick: null,               // function(item, index, event)
		onScroll: null,              // function(scrollTop, scrollHeight)
		onSelect: null,              // function(selectedItems, selectedIds)
		onActivate: null,            // function(item, index)
		onFocus: null,               // function(item, index)
		onFilter: null,              // function(filteredCount, totalCount)
		onSearch: null,              // function(matches, query)
		onSort: null,                // function(comparator)
		
		// Empty state
		emptyMessage: 'No items to display',
		emptyTemplate: null,         // Custom empty state HTML
		
		// Accessibility
		ariaLabel: 'Virtual list',
		
		// Debug
		debug: false
	};

	// ============================================
	// VIRTUALISED LIST INSTANCE
	// ============================================

	/**
	 * VirtualisedList instance constructor
	 * @param {HTMLElement} container - The container element
	 * @param {Object} options - Configuration options
	 */
	function VirtualisedListInstance(container, options) {
		this.id = 'vlist-' + (++VirtualisedList.instanceCounter);
		this.container = container;
		this.config = Object.assign({}, DEFAULTS, options);
		
		// Validate configuration
		this._validateConfig();
		
		// State
		this.items = this.config.items || [];
		this.scrollTop = 0;
		this.containerHeight = 0;
		this.isDestroyed = false;
		
		// Height mode detection
		this.variableHeight = this.config.itemHeight === 'auto';
		this.fixedItemHeight = this.variableHeight ? null : this.config.itemHeight;
		
		// Variable height state
		this.heightCache = new Map();        // itemKey -> measured height
		this.positionCache = [];             // [{ top, height }] indexed by item index
		this.totalHeight = 0;
		this.measuringElement = null;        // Off-screen element for measuring
		
		// Selection state
		this.selectedIds = new Set(this.config.selectedIds || []);
		this.focusedIndex = -1;
		this.lastSelectedIndex = -1;         // For Shift+click range selection
		
		// Viewport state
		this.firstVisibleIndex = 0;
		this.lastVisibleIndex = 0;
		this.visibleCount = 0;
		
		// DOM recycling pool
		this.elementPool = [];
		this.activeElements = new Map();  // index -> element
		
		// DOM references
		this.wrapper = null;
		this.spacerTop = null;
		this.spacerBottom = null;
		this.itemsContainer = null;
		
		// Scroll handling
		this._scrollTracker = null;  // Funky.ScrollTracker instance
		this.lastScrollTime = 0;
		this.scrollDirection = 0;  // -1 = up, 0 = none, 1 = down
		
		// Infinite scroll state
		this.isLoading = false;
		this.hasMore = this.config.hasMore;
		this.loadMoreDebounce = null;
		this.loadingElement = null;
		this.endElement = null;
		
		// Pull to refresh state
		this.pullStartY = 0;
		this.pullDistance = 0;
		this.isPulling = false;
		this.isRefreshing = false;
		this.pullIndicator = null;
		
		// Data management state
		this.originalItems = null;       // Backup for filter/sort
		this.filterPredicate = null;     // Current filter function
		this.sortComparator = null;      // Current sort function
		this.searchQuery = '';           // Current search query
		this.searchMatches = [];         // Indices of matching items
		this.searchResults = [];         // Full result objects with scores/positions (for fuzzy)
		this.currentMatchIndex = -1;     // Current search match position
		this.isBatching = false;         // Batch mode flag
		this.batchOperations = [];       // Queued batch operations
		
		// WebSocket state
		this._wsHandler = null;          // Bound WebSocket handler
		
		// Bound handlers
		this._onResize = this._handleResize.bind(this);
		this._onClick = this._handleClick.bind(this);
		this._onKeyDown = this._handleKeyDown.bind(this);
		
		// Pull to refresh gesture tracker
		this._pullGesture = null;
		
		// Initialize
		this._init();
	}

	// ============================================
	// INITIALIZATION
	// ============================================

	/**
	 * Validate configuration and warn about issues
	 * @private
	 */
	VirtualisedListInstance.prototype._validateConfig = function() {
		var config = this.config;
		var warnings = [];
		
		// Check container
		if (!this.container) {
			console.error('[VirtualisedList] Container element is required');
			return;
		}
		
		// Check items is array
		if (config.items && !Array.isArray(config.items)) {
			console.error('[VirtualisedList] items must be an array');
			config.items = [];
		}
		
		// Warn if no renderItem
		if (!config.renderItem) {
			warnings.push('No renderItem function provided. Using default JSON stringify.');
		}
		
		// Warn if large list without getItemKey
		if (config.items && config.items.length > 1000 && !config.getItemKey) {
			warnings.push('Large list without getItemKey. Recommend providing getItemKey for stable item identity.');
		}
		
		// Check itemHeight
		if (config.itemHeight !== 'auto' && (typeof config.itemHeight !== 'number' || config.itemHeight <= 0)) {
			warnings.push('itemHeight should be a positive number or "auto". Using default: 48');
			config.itemHeight = 48;
		}
		
		// Check overscan
		if (typeof config.overscan !== 'number' || config.overscan < 0) {
			warnings.push('overscan should be a non-negative number. Using default: 5');
			config.overscan = 5;
		}
		
		// Check loadMoreThreshold
		if (config.onLoadMore && (typeof config.loadMoreThreshold !== 'number' || config.loadMoreThreshold < 0)) {
			warnings.push('loadMoreThreshold should be a positive number. Using default: 200');
			config.loadMoreThreshold = 200;
		}
		
		// Check selectable value
		var validSelectable = ['none', 'single', 'multi'];
		if (config.selectable && validSelectable.indexOf(config.selectable) === -1) {
			warnings.push('selectable should be "none", "single", or "multi". Using: none');
			config.selectable = 'none';
		}
		
		// Log warnings
		if (warnings.length > 0 && (config.debug || console.warn)) {
			warnings.forEach(function(w) {
				console.warn('[VirtualisedList] ' + w);
			});
		}
	};

	VirtualisedListInstance.prototype._init = function() {
		this._createDOM();
		this._createLoadingElements();
		this._bindEvents();
		this._registerKeyboardShortcuts();
		this._bindWebSocket();
		this._calculateViewport();
		this._render();
		this._restoreScrollPosition();
		
		// Register in instance registry - always register by instance id
		_instances.register(this.id, this);
		// Also register by container id if available (for lookup by container)
		var containerId = this.container && this.container.id;
		if (containerId && containerId !== this.id) {
			_instances.register(containerId, this);
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Initialized:', this.id, {
				items: this.items.length,
				itemHeight: this.config.itemHeight,
				containerHeight: this.containerHeight,
				hasMore: this.hasMore,
				wsEntity: this.config.wsEntity
			});
		}
	};

	/**
	 * Create the DOM structure
	 */
	VirtualisedListInstance.prototype._createDOM = function() {
		// Clear container
		this.container.replaceChildren();
		
		// Create wrapper with scrolling
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'virtual-list';
		this.wrapper.setAttribute('role', 'listbox');
		this.wrapper.setAttribute('aria-label', this.config.ariaLabel);
		this.wrapper.setAttribute('tabindex', '0');
		this.wrapper.setAttribute('aria-busy', 'false');
		this.wrapper.id = this.id;
		
		// Set multiselectable if not single selection
		if (!this.config.singleSelection) {
			this.wrapper.setAttribute('aria-multiselectable', 'true');
		}
		
		// Top spacer
		this.spacerTop = document.createElement('div');
		this.spacerTop.className = 'virtual-list-spacer virtual-list-spacer-top';
		this.spacerTop.style.height = '0px';
		
		// Items container
		this.itemsContainer = document.createElement('div');
		this.itemsContainer.className = 'virtual-list-items';
		
		// Bottom spacer
		this.spacerBottom = document.createElement('div');
		this.spacerBottom.className = 'virtual-list-spacer virtual-list-spacer-bottom';
		this.spacerBottom.style.height = '0px';
		
		// Live region for screen reader announcements
		this.liveRegion = document.createElement('div');
		this.liveRegion.className = 'virtual-list-sr-only';
		this.liveRegion.setAttribute('role', 'status');
		this.liveRegion.setAttribute('aria-live', 'polite');
		this.liveRegion.setAttribute('aria-atomic', 'true');
		
		// Empty state element
		var D = Funky.Dom;
		this.emptyElement = document.createElement('div');
		this.emptyElement.className = 'virtual-list-empty';
		this.emptyElement.style.display = 'none';
		if (this.config.emptyTemplate) {
			this.emptyElement.appendChild(Funky.Util.toDom(this.config.emptyTemplate));
		} else {
			this.emptyElement.appendChild(
				D.fragment(
					D.div().class('virtual-list-empty-icon').child(D.icon('inbox')),
					D.div().class('virtual-list-empty-message').text(this.config.emptyMessage || 'No items to display')
				)
			);
		}
		
		// Detect RTL mode
		this.isRTL = getComputedStyle(this.container).direction === 'rtl';
		if (this.isRTL) {
			this.wrapper.setAttribute('dir', 'rtl');
		}
		
		// Detect touch capability
		this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		if (this.isTouch) {
			this.wrapper.classList.add('virtual-list-touch');
		}
		
		// Assemble
		this.wrapper.appendChild(this.spacerTop);
		this.wrapper.appendChild(this.itemsContainer);
		this.wrapper.appendChild(this.spacerBottom);
		this.wrapper.appendChild(this.emptyElement);
		this.container.appendChild(this.wrapper);
		this.container.appendChild(this.liveRegion);
		
		// Get container height
		this.containerHeight = this.config.containerHeight || this.wrapper.clientHeight;
		
		// Ensure we have a height
		if (this.containerHeight === 0) {
			// Default fallback
			this.containerHeight = 400;
			this.wrapper.style.height = this.containerHeight + 'px';
		}
	};

	/**
	 * Create loading indicator and end-of-list elements
	 */
	VirtualisedListInstance.prototype._createLoadingElements = function() {
		var D = Funky.Dom;
		
		// Loading indicator
		this.loadingElement = document.createElement('div');
		this.loadingElement.className = 'virtual-list-loading';
		this.loadingElement.style.display = 'none';
		
		if (this.config.loadingTemplate) {
			this.loadingElement.appendChild(Funky.Util.toDom(this.config.loadingTemplate));
		} else {
			this.loadingElement.appendChild(
				D.fragment(
					D.div().class('virtual-list-loading-spinner'),
					D.span().text('Loading more...')
				)
			);
		}
		
		// End of list indicator
		this.endElement = document.createElement('div');
		this.endElement.className = 'virtual-list-end';
		this.endElement.style.display = 'none';
		
		if (this.config.endOfListTemplate) {
			this.endElement.appendChild(Funky.Util.toDom(this.config.endOfListTemplate));
		} else {
			this.endElement.appendChild(D.span().text('No more items').get());
		}
		
		// Pull to refresh indicator (positioned at top)
		if (this.config.pullToRefresh) {
			this.pullIndicator = D.div().class('virtual-list-pull-indicator').child(
				D.div().class('virtual-list-pull-icon').text('↓'),
				D.span().text('Pull to refresh')
			).get();
			this.wrapper.insertBefore(this.pullIndicator, this.spacerTop);
		}
		
		// Append loading and end elements after spacerBottom
		this.wrapper.appendChild(this.loadingElement);
		this.wrapper.appendChild(this.endElement);
	};

	// ============================================
	// EVENT BINDING
	// ============================================

	VirtualisedListInstance.prototype._bindEvents = function() {
		var self = this;
		
		// Create scroll tracker for container
		this._scrollTracker = Funky.ScrollTracker.create({
			target: this.wrapper,
			namespace: 'vlist-' + this.id,
			trackDirection: true,
			onScroll: function(data) {
				self._processScroll(data);
			}
		});
		
		// Resize observer
		if (typeof ResizeObserver !== 'undefined') {
			this.resizeObserver = new ResizeObserver(this._onResize);
			this.resizeObserver.observe(this.wrapper);
		} else {
			window.addEventListener('resize', this._onResize);
		}
		
		// Click handler
		this.itemsContainer.addEventListener('click', this._onClick);
		
		// Keyboard handler (on wrapper for focus management)
		this.wrapper.addEventListener('keydown', this._onKeyDown);
		
		// Pull to refresh via GestureTracker
		if (this.config.pullToRefresh) {
			var self = this;
			
			this._pullGesture = Funky.GestureTracker.create({
				target: this.wrapper,
				namespace: 'vlist-pull-' + this.id,
				gestures: ['drag'],
				preventDefault: true,
				passive: false,
				
				onDragStart: function(data) {
					if (self.isRefreshing) return;
					// Only enable when scrolled to top
					if (self.wrapper.scrollTop <= 0) {
						self.pullStartY = data.y;
						self.isPulling = true;
					}
				},
				
				onDragMove: function(data) {
					if (!self.isPulling || self.isRefreshing) return;
					
					self.pullDistance = data.deltaY;
					
					// Only handle pull down
					if (self.pullDistance > 0) {
						// Apply resistance to pull
						var resistance = 0.4;
						var displayDistance = self.pullDistance * resistance;
						self._updatePullIndicator(displayDistance);
					} else {
						self.isPulling = false;
						self.pullDistance = 0;
					}
				},
				
				onDragEnd: function() {
					if (!self.isPulling) return;
					
					var threshold = self.config.pullThreshold;
					var displayDistance = self.pullDistance * 0.4;
					
					if (displayDistance >= threshold && self.config.onRefresh) {
						self._triggerRefresh();
					} else {
						self._resetPullIndicator();
					}
					
					self.isPulling = false;
					self.pullDistance = 0;
				}
			});
		}
	};

	VirtualisedListInstance.prototype._unbindEvents = function() {
		// Destroy scroll tracker
		if (this._scrollTracker) {
			this._scrollTracker.destroy();
			this._scrollTracker = null;
		}
		
		this.itemsContainer.removeEventListener('click', this._onClick);
		this.wrapper.removeEventListener('keydown', this._onKeyDown);
		
		// Destroy pull-to-refresh gesture tracker
		if (this._pullGesture) {
			this._pullGesture.destroy();
			this._pullGesture = null;
		}
		
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		} else {
			window.removeEventListener('resize', this._onResize);
		}
	};

	// ============================================
	// SCROLL HANDLING
	// ============================================

	VirtualisedListInstance.prototype._processScroll = function(data) {
		if (this.isDestroyed) return;
		
		// Update state from tracker data
		this.scrollTop = data.scrollY;
		this.scrollDirection = data.direction === 'down' ? 1 : (data.direction === 'up' ? -1 : 0);
		this.lastScrollTime = data.timestamp;
		
		// Recalculate visible items
		var oldFirst = this.firstVisibleIndex;
		var oldLast = this.lastVisibleIndex;
		
		this._calculateViewport();
		
		// Only re-render if visible range changed
		if (this.firstVisibleIndex !== oldFirst || this.lastVisibleIndex !== oldLast) {
			this._render();
		}
		
		// Check for infinite scroll load more
		this._checkLoadMore();
		
		// Save scroll position if persistence enabled
		this._saveScrollPosition();
		
		// Emit scroll event
		if (this.config.onScroll) {
			this.config.onScroll(this.scrollTop, this._getTotalHeight());
		}
		
		// EventBus integration
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:scroll', {
				id: this.id,
				scrollTop: this.scrollTop,
				scrollHeight: this._getTotalHeight()
			});
		}
	};

	// ============================================
	// RESIZE HANDLING
	// ============================================

	VirtualisedListInstance.prototype._handleResize = function() {
		if (this.isDestroyed) return;
		
		var newHeight = this.wrapper.clientHeight;
		if (newHeight !== this.containerHeight) {
			this.containerHeight = newHeight;
			this._calculateViewport();
			this._render();
		}
	};

	// ============================================
	// INFINITE SCROLL
	// ============================================

	/**
	 * Check if we should trigger load more
	 */
	VirtualisedListInstance.prototype._checkLoadMore = function() {
		// Skip if not configured or already loading
		if (!this.config.onLoadMore || this.isLoading || !this.hasMore) return;
		
		var totalHeight = this._getTotalHeight();
		var scrollBottom = this.scrollTop + this.containerHeight;
		var distanceFromEnd = totalHeight - scrollBottom;
		
		if (distanceFromEnd < this.config.loadMoreThreshold) {
			this._triggerLoadMore();
		}
	};

	/**
	 * Trigger the load more callback
	 */
	VirtualisedListInstance.prototype._triggerLoadMore = function() {
		if (this.isLoading || !this.hasMore) return;
		
		var self = this;
		this.isLoading = true;
		this._showLoadingIndicator();
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Loading more...', {
				currentCount: this.items.length
			});
		}
		
		// EventBus notification
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:loadmore', {
				id: this.id,
				offset: this.items.length
			});
		}
		
		// Timeout for load more (30 seconds)
		var loadTimeout = setTimeout(function() {
			if (self.isLoading) {
				console.warn('[VirtualisedList] Load more timed out after 30 seconds');
				self.isLoading = false;
				self._hideLoadingIndicator();
				
				if (typeof Funky !== 'undefined' && Funky.PubSub) {
					Funky.PubSub.emit('funky:virtual-list:loaderror', { 
						id: self.id, 
						error: 'timeout' 
					});
				}
			}
		}, 30000);
		
		// Call the onLoadMore callback with done function
		try {
			this.config.onLoadMore(function(newItems, moreAvailable) {
				clearTimeout(loadTimeout);
				self.isLoading = false;
				self._hideLoadingIndicator();
				
				if (newItems && newItems.length > 0) {
					self.addItems(newItems);
				}
				
				self.hasMore = moreAvailable !== false;
				
				if (!self.hasMore) {
					self._showEndOfList();
					
					if (typeof Funky !== 'undefined' && Funky.PubSub) {
						Funky.PubSub.emit('funky:virtual-list:endreached', { id: self.id });
					}
				}
				
				if (self.config.debug) {
					console.log('[VirtualisedList] Load complete:', {
						added: newItems ? newItems.length : 0,
						total: self.items.length,
						hasMore: self.hasMore
					});
				}
			});
		} catch (err) {
			clearTimeout(loadTimeout);
			self.isLoading = false;
			self._hideLoadingIndicator();
			console.error('[VirtualisedList] onLoadMore error:', err);
			
			if (typeof Funky !== 'undefined' && Funky.PubSub) {
				Funky.PubSub.emit('funky:virtual-list:loaderror', { 
					id: self.id, 
					error: err.message 
				});
			}
		}
	};

	/**
	 * Show loading indicator
	 */
	VirtualisedListInstance.prototype._showLoadingIndicator = function() {
		if (this.loadingElement) {
			this.loadingElement.style.display = 'flex';
		}
		if (this.endElement) {
			this.endElement.style.display = 'none';
		}
		// Set aria-busy for screen readers
		this.wrapper.setAttribute('aria-busy', 'true');
	};

	/**
	 * Hide loading indicator
	 */
	VirtualisedListInstance.prototype._hideLoadingIndicator = function() {
		if (this.loadingElement) {
			this.loadingElement.style.display = 'none';
		}
		// Clear aria-busy
		this.wrapper.setAttribute('aria-busy', 'false');
	};

	/**
	 * Announce message to screen readers via live region
	 * @param {string} message - Message to announce
	 */
	VirtualisedListInstance.prototype.announce = function(message) {
		if (this.liveRegion) {
			// Clear first to ensure announcement even if same message
			this.liveRegion.textContent = '';
			var self = this;
			setTimeout(function() {
				self.liveRegion.textContent = message;
			}, 50);
		}
	};

	/**
	 * Show end of list indicator
	 */
	VirtualisedListInstance.prototype._showEndOfList = function() {
		if (this.endElement) {
			this.endElement.style.display = 'flex';
		}
	};

	/**
	 * Hide end of list indicator
	 */
	VirtualisedListInstance.prototype._hideEndOfList = function() {
		if (this.endElement) {
			this.endElement.style.display = 'none';
		}
	};

	/**
	 * Show empty state
	 */
	VirtualisedListInstance.prototype._showEmptyState = function() {
		if (this.emptyElement) {
			this.emptyElement.style.display = 'flex';
		}
		// Hide spacers
		if (this.spacerTop) this.spacerTop.style.display = 'none';
		if (this.spacerBottom) this.spacerBottom.style.display = 'none';
		if (this.itemsContainer) this.itemsContainer.style.display = 'none';
	};

	/**
	 * Hide empty state
	 */
	VirtualisedListInstance.prototype._hideEmptyState = function() {
		if (this.emptyElement) {
			this.emptyElement.style.display = 'none';
		}
		// Show spacers
		if (this.spacerTop) this.spacerTop.style.display = '';
		if (this.spacerBottom) this.spacerBottom.style.display = '';
		if (this.itemsContainer) this.itemsContainer.style.display = '';
	};

	/**
	 * Check if list is currently empty
	 * @returns {boolean}
	 */
	VirtualisedListInstance.prototype.isEmpty = function() {
		return this.items.length === 0;
	};

	// ============================================
	// PULL TO REFRESH
	// ============================================

	/**
	 * Update pull indicator position and text
	 */
	VirtualisedListInstance.prototype._updatePullIndicator = function(distance) {
		if (!this.pullIndicator) return;
		
		var threshold = this.config.pullThreshold;
		var progress = Math.min(distance / threshold, 1);
		
		this.pullIndicator.style.height = distance + 'px';
		this.pullIndicator.style.opacity = progress;
		
		// Update text based on threshold
		var icon = this.pullIndicator.querySelector('.virtual-list-pull-icon');
		var text = this.pullIndicator.querySelector('span');
		
		if (distance >= threshold) {
			if (icon) icon.textContent = '↑';
			if (text) text.textContent = 'Release to refresh';
			this.pullIndicator.classList.add('ready');
		} else {
			if (icon) icon.textContent = '↓';
			if (text) text.textContent = 'Pull to refresh';
			this.pullIndicator.classList.remove('ready');
		}
	};

	/**
	 * Reset pull indicator to hidden state
	 */
	VirtualisedListInstance.prototype._resetPullIndicator = function() {
		if (!this.pullIndicator) return;
		
		this.pullIndicator.style.height = '0px';
		this.pullIndicator.style.opacity = '0';
		this.pullIndicator.classList.remove('ready', 'refreshing');
	};

	/**
	 * Trigger the refresh callback
	 */
	VirtualisedListInstance.prototype._triggerRefresh = function() {
		if (this.isRefreshing) return;
		
		var self = this;
		this.isRefreshing = true;
		
		// Show refreshing state
		if (this.pullIndicator) {
			this.pullIndicator.classList.add('refreshing');
			var text = this.pullIndicator.querySelector('span');
			if (text) text.textContent = 'Refreshing...';
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Refreshing...');
		}
		
		// EventBus notification
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:refresh', { id: this.id });
		}
		
		// Call refresh callback
		this.config.onRefresh(function() {
			self.isRefreshing = false;
			self._resetPullIndicator();
			
			if (self.config.debug) {
				console.log('[VirtualisedList] Refresh complete');
			}
		});
	};

	// ============================================
	// SCROLL PERSISTENCE
	// ============================================

	/**
	 * Get the storage key for scroll position
	 */
	VirtualisedListInstance.prototype._getScrollStorageKey = function() {
		return this.config.persistKey || ('vlist-scroll-' + this.id);
	};

	/**
	 * Save current scroll position
	 */
	VirtualisedListInstance.prototype._saveScrollPosition = function() {
		if (!this.config.persistScroll) return;
		
		try {
			var key = this._getScrollStorageKey();
			sessionStorage.setItem(key, this.scrollTop.toString());
		} catch (e) {
			// sessionStorage not available
		}
	};

	/**
	 * Restore scroll position from storage
	 */
	VirtualisedListInstance.prototype._restoreScrollPosition = function() {
		if (!this.config.persistScroll) return;
		
		try {
			var key = this._getScrollStorageKey();
			var saved = sessionStorage.getItem(key);
			
			if (saved !== null) {
				var scrollTop = parseInt(saved, 10);
				if (!isNaN(scrollTop) && scrollTop > 0) {
					this.wrapper.scrollTop = scrollTop;
					this.scrollTop = scrollTop;
					
					if (this.config.debug) {
						console.log('[VirtualisedList] Restored scroll position:', scrollTop);
					}
				}
			}
		} catch (e) {
			// sessionStorage not available
		}
	};

	/**
	 * Clear saved scroll position
	 */
	VirtualisedListInstance.prototype._clearScrollPosition = function() {
		if (!this.config.persistScroll) return;
		
		try {
			var key = this._getScrollStorageKey();
			sessionStorage.removeItem(key);
		} catch (e) {
			// sessionStorage not available
		}
	};

	// ============================================
	// CLICK HANDLING
	// ============================================

	VirtualisedListInstance.prototype._handleClick = function(event) {
		var itemElement = event.target.closest('.virtual-list-item');
		if (!itemElement) return;
		
		var index = parseInt(itemElement.getAttribute('data-index'), 10);
		if (isNaN(index) || index < 0 || index >= this.items.length) return;
		
		var item = this.items[index];
		var key = this._getItemKey(item, index);
		
		// Focus wrapper for keyboard navigation
		this.wrapper.focus();
		
		// Set focus to clicked item
		this._setFocusedIndex(index);
		
		// Handle selection based on mode
		if (this.config.selectable !== 'none') {
			if (this.config.selectable === 'multi') {
				if (event.shiftKey && this.lastSelectedIndex >= 0) {
					// Shift+click: range selection
					this._selectRange(this.lastSelectedIndex, index);
				} else if (event.ctrlKey || event.metaKey) {
					// Ctrl/Cmd+click: toggle selection
					this._toggleSelection(key, index);
				} else {
					// Plain click: select single item, clear others
					this._selectSingle(key, index);
				}
			} else {
				// Single selection mode
				this._selectSingle(key, index);
			}
		}
		
		if (this.config.onClick) {
			this.config.onClick(item, index, event);
		}
		
		// EventBus integration
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:click', {
				id: this.id,
				item: item,
				index: index
			});
		}
	};

	// ============================================
	// KEYBOARD HANDLING
	// ============================================

	/**
	 * Register keyboard shortcuts with Funky.Keyboard
	 */
	VirtualisedListInstance.prototype._registerKeyboardShortcuts = function() {
		var self = this;
		var scope = this.wrapper.id ? '#' + this.wrapper.id : 'global';
		
		// Store unregister functions for cleanup
		this._keyboardUnregisters = [];
		
		// Check if Funky.Keyboard is available
		if (typeof Funky === 'undefined' || !Funky.Keyboard) {
			if (this.config.debug) {
				console.warn('[VirtualisedList] Funky.Keyboard not available, using fallback keydown handler');
			}
			this._useFallbackKeyboard = true;
			return;
		}
		
		// Navigation shortcuts
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'down',
				scope: scope,
				handler: function(e) {
					if (self.isDestroyed || self.items.length === 0) return;
					self._moveFocus(1);
					if (e.shiftKey && self.config.selectable === 'multi') {
						self._extendSelection(self.focusedIndex);
					}
				},
				description: 'Move focus down',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'up',
				scope: scope,
				handler: function(e) {
					if (self.isDestroyed || self.items.length === 0) return;
					self._moveFocus(-1);
					if (e.shiftKey && self.config.selectable === 'multi') {
						self._extendSelection(self.focusedIndex);
					}
				},
				description: 'Move focus up',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'pagedown',
				scope: scope,
				handler: function() {
					if (self.isDestroyed || self.items.length === 0) return;
					self._moveFocus(self._getPageSize());
				},
				description: 'Page down',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'pageup',
				scope: scope,
				handler: function() {
					if (self.isDestroyed || self.items.length === 0) return;
					self._moveFocus(-self._getPageSize());
				},
				description: 'Page up',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'home',
				scope: scope,
				handler: function() {
					if (self.isDestroyed || self.items.length === 0) return;
					self._setFocusedIndex(0);
				},
				description: 'Go to first item',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'end',
				scope: scope,
				handler: function() {
					if (self.isDestroyed || self.items.length === 0) return;
					self._setFocusedIndex(self.items.length - 1);
				},
				description: 'Go to last item',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'space',
				scope: scope,
				handler: function() {
					if (self.isDestroyed || self.items.length === 0) return;
					if (self.config.selectable !== 'none' && self.focusedIndex >= 0) {
						var item = self.items[self.focusedIndex];
						var key = self._getItemKey(item, self.focusedIndex);
						if (self.config.selectable === 'multi') {
							self._toggleSelection(key, self.focusedIndex);
						} else {
							self._selectSingle(key, self.focusedIndex);
						}
					}
				},
				description: 'Toggle selection',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'enter',
				scope: scope,
				handler: function() {
					if (self.isDestroyed || self.items.length === 0) return;
					if (self.focusedIndex >= 0) {
						self._activateItem(self.focusedIndex);
					}
				},
				description: 'Activate item',
				group: 'Virtual List'
			}),
			
			Funky.Keyboard.register({
				key: 'escape',
				scope: scope,
				handler: function() {
					if (self.isDestroyed) return;
					if (self.config.selectable !== 'none') {
						self.deselectAll();
					}
				},
				description: 'Clear selection',
				group: 'Virtual List'
			})
		);
		
		// Ctrl+A for select all (multi mode only)
		if (this.config.selectable === 'multi') {
			this._keyboardUnregisters.push(
				Funky.Keyboard.register({
					key: 'a',
					mod: true,
					scope: scope,
					handler: function() {
						if (self.isDestroyed) return;
						self.selectAll();
					},
					description: 'Select all items',
					group: 'Virtual List'
				})
			);
		}
	};

	/**
	 * Handle keyboard events (fallback when Funky.Keyboard not available)
	 */
	VirtualisedListInstance.prototype._handleKeyDown = function(event) {
		// Only use fallback if Funky.Keyboard was not available
		if (!this._useFallbackKeyboard) return;
		
		if (this.isDestroyed || this.items.length === 0) return;
		
		var handled = true;
		
		switch (event.key) {
			case 'ArrowDown':
				this._moveFocus(1);
				if (event.shiftKey && this.config.selectable === 'multi') {
					this._extendSelection(this.focusedIndex);
				}
				break;
				
			case 'ArrowUp':
				this._moveFocus(-1);
				if (event.shiftKey && this.config.selectable === 'multi') {
					this._extendSelection(this.focusedIndex);
				}
				break;
				
			case 'PageDown':
				this._moveFocus(this._getPageSize());
				break;
				
			case 'PageUp':
				this._moveFocus(-this._getPageSize());
				break;
				
			case 'Home':
				this._setFocusedIndex(0);
				break;
				
			case 'End':
				this._setFocusedIndex(this.items.length - 1);
				break;
				
			case ' ':
				// Space: toggle selection on focused item
				if (this.config.selectable !== 'none' && this.focusedIndex >= 0) {
					var item = this.items[this.focusedIndex];
					var key = this._getItemKey(item, this.focusedIndex);
					if (this.config.selectable === 'multi') {
						this._toggleSelection(key, this.focusedIndex);
					} else {
						this._selectSingle(key, this.focusedIndex);
					}
				}
				break;
				
			case 'Enter':
				// Enter: activate focused item
				if (this.focusedIndex >= 0) {
					this._activateItem(this.focusedIndex);
				}
				break;
				
			case 'a':
			case 'A':
				// Ctrl+A: select all (multi mode only)
				if ((event.ctrlKey || event.metaKey) && this.config.selectable === 'multi') {
					this.selectAll();
				} else {
					handled = false;
				}
				break;
				
			case 'Escape':
				// Escape: clear selection
				if (this.config.selectable !== 'none') {
					this.deselectAll();
				}
				break;
				
			default:
				handled = false;
		}
		
		if (handled) {
			event.preventDefault();
		}
	};

	/**
	 * Move focus by delta items
	 */
	VirtualisedListInstance.prototype._moveFocus = function(delta) {
		var newIndex = this.focusedIndex + delta;
		newIndex = Math.max(0, Math.min(newIndex, this.items.length - 1));
		this._setFocusedIndex(newIndex);
		
		// Auto-select on focus if enabled (single mode)
		if (this.config.selectOnFocus && this.config.selectable === 'single') {
			var item = this.items[newIndex];
			var key = this._getItemKey(item, newIndex);
			this._selectSingle(key, newIndex);
		}
	};

	/**
	 * Get number of items visible in one page
	 */
	VirtualisedListInstance.prototype._getPageSize = function() {
		if (this.variableHeight) {
			// Estimate based on average visible item height
			var avgHeight = this.containerHeight / Math.max(1, this.visibleCount);
			return Math.max(1, Math.floor(this.containerHeight / avgHeight));
		}
		return Math.max(1, Math.floor(this.containerHeight / this.fixedItemHeight));
	};

	/**
	 * Set focused item index
	 */
	VirtualisedListInstance.prototype._setFocusedIndex = function(index) {
		if (index < 0 || index >= this.items.length) return;
		
		var oldIndex = this.focusedIndex;
		this.focusedIndex = index;
		
		// Update DOM classes
		this._updateFocusedElement(oldIndex, index);
		
		// Scroll focused item into view
		this.scrollToIndex(index, 'auto');
		
		// Update ARIA
		var focusedElement = this.activeElements.get(index);
		if (focusedElement) {
			this.wrapper.setAttribute('aria-activedescendant', focusedElement.id || '');
		}
		
		// Emit focus event
		var item = this.items[index];
		if (this.config.onFocus) {
			this.config.onFocus(item, index);
		}
		
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:focus', {
				id: this.id,
				item: item,
				index: index
			});
		}
	};

	/**
	 * Update focused element styling
	 */
	VirtualisedListInstance.prototype._updateFocusedElement = function(oldIndex, newIndex) {
		// Remove old focus
		if (oldIndex >= 0 && this.activeElements.has(oldIndex)) {
			var oldElement = this.activeElements.get(oldIndex);
			oldElement.classList.remove('focused');
		}
		
		// Add new focus
		if (newIndex >= 0 && this.activeElements.has(newIndex)) {
			var newElement = this.activeElements.get(newIndex);
			newElement.classList.add('focused');
			
			// Set ID for aria-activedescendant
			if (!newElement.id) {
				newElement.id = this.id + '-item-' + newIndex;
			}
		}
	};

	/**
	 * Activate an item (Enter key)
	 */
	VirtualisedListInstance.prototype._activateItem = function(index) {
		var item = this.items[index];
		
		if (this.config.onActivate) {
			this.config.onActivate(item, index);
		}
		
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:activate', {
				id: this.id,
				item: item,
				index: index
			});
		}
	};

	// ============================================
	// SELECTION HANDLING
	// ============================================

	/**
	 * Select single item, clearing others
	 */
	VirtualisedListInstance.prototype._selectSingle = function(key, index) {
		var changed = this.selectedIds.size !== 1 || !this.selectedIds.has(key);
		
		this.selectedIds.clear();
		this.selectedIds.add(key);
		this.lastSelectedIndex = index;
		
		this._updateSelectedElements();
		
		if (changed) {
			this._emitSelectEvent();
		}
	};

	/**
	 * Toggle selection on an item
	 */
	VirtualisedListInstance.prototype._toggleSelection = function(key, index) {
		if (this.selectedIds.has(key)) {
			this.selectedIds.delete(key);
		} else {
			this.selectedIds.add(key);
			this.lastSelectedIndex = index;
		}
		
		this._updateSelectedElements();
		this._emitSelectEvent();
	};

	/**
	 * Select a range of items
	 */
	VirtualisedListInstance.prototype._selectRange = function(fromIndex, toIndex) {
		var start = Math.min(fromIndex, toIndex);
		var end = Math.max(fromIndex, toIndex);
		
		for (var i = start; i <= end; i++) {
			var item = this.items[i];
			var key = this._getItemKey(item, i);
			this.selectedIds.add(key);
		}
		
		this._updateSelectedElements();
		this._emitSelectEvent();
	};

	/**
	 * Extend selection to include index (for Shift+Arrow)
	 */
	VirtualisedListInstance.prototype._extendSelection = function(toIndex) {
		if (this.lastSelectedIndex < 0) {
			this.lastSelectedIndex = toIndex;
		}
		this._selectRange(this.lastSelectedIndex, toIndex);
	};

	/**
	 * Update selected class on visible elements
	 */
	VirtualisedListInstance.prototype._updateSelectedElements = function() {
		var self = this;
		this.activeElements.forEach(function(element, index) {
			var item = self.items[index];
			var key = self._getItemKey(item, index);
			
			if (self.selectedIds.has(key)) {
				element.classList.add('selected');
				element.setAttribute('aria-selected', 'true');
			} else {
				element.classList.remove('selected');
				element.setAttribute('aria-selected', 'false');
			}
		});
	};

	/**
	 * Emit selection change event
	 */
	VirtualisedListInstance.prototype._emitSelectEvent = function() {
		var selectedItems = this.getSelected();
		var selectedIds = this.getSelectedIds();
		
		// Announce to screen readers
		var count = selectedIds.length;
		if (count === 0) {
			this.announce('No items selected');
		} else if (count === 1) {
			this.announce('1 item selected');
		} else {
			this.announce(count + ' items selected');
		}
		
		if (this.config.onSelect) {
			this.config.onSelect(selectedItems, selectedIds);
		}
		
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:select', {
				id: this.id,
				items: selectedItems,
				ids: selectedIds
			});
		}
	};

	// ============================================
	// VIEWPORT CALCULATION
	// ============================================

	VirtualisedListInstance.prototype._calculateViewport = function() {
		var overscan = this.config.overscan;
		var totalItems = this.items.length;
		
		if (totalItems === 0) {
			this.firstVisibleIndex = 0;
			this.lastVisibleIndex = -1;
			this.visibleCount = 0;
			return;
		}
		
		if (this.variableHeight) {
			// Variable height mode - use position cache
			this._ensurePositionCache();
			this._calculateViewportVariable(overscan, totalItems);
		} else {
			// Fixed height mode - simple calculation
			this._calculateViewportFixed(overscan, totalItems);
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Viewport:', {
				scrollTop: this.scrollTop,
				first: this.firstVisibleIndex,
				last: this.lastVisibleIndex,
				visible: this.lastVisibleIndex - this.firstVisibleIndex + 1,
				variableHeight: this.variableHeight
			});
		}
	};

	/**
	 * Fixed height viewport calculation
	 */
	VirtualisedListInstance.prototype._calculateViewportFixed = function(overscan, totalItems) {
		var itemHeight = this.fixedItemHeight;
		
		// Calculate first visible item (with overscan)
		var firstVisible = Math.floor(this.scrollTop / itemHeight);
		this.firstVisibleIndex = Math.max(0, firstVisible - overscan);
		
		// Calculate visible count
		this.visibleCount = Math.ceil(this.containerHeight / itemHeight) + (overscan * 2);
		
		// Calculate last visible item (with overscan)
		this.lastVisibleIndex = Math.min(
			totalItems - 1,
			this.firstVisibleIndex + this.visibleCount - 1
		);
	};

	/**
	 * Variable height viewport calculation using binary search
	 */
	VirtualisedListInstance.prototype._calculateViewportVariable = function(overscan, totalItems) {
		// Binary search to find first visible item
		var firstVisible = this._findItemAtPosition(this.scrollTop);
		this.firstVisibleIndex = Math.max(0, firstVisible - overscan);
		
		// Find last visible by iterating from first
		var viewportBottom = this.scrollTop + this.containerHeight;
		var lastVisible = firstVisible;
		
		while (lastVisible < totalItems - 1) {
			var pos = this._getItemPosition(lastVisible);
			if (pos.top >= viewportBottom) {
				break;
			}
			lastVisible++;
		}
		
		this.lastVisibleIndex = Math.min(totalItems - 1, lastVisible + overscan);
		this.visibleCount = this.lastVisibleIndex - this.firstVisibleIndex + 1;
	};

	/**
	 * Binary search to find item at scroll position
	 */
	VirtualisedListInstance.prototype._findItemAtPosition = function(scrollTop) {
		var items = this.items;
		var low = 0;
		var high = items.length - 1;
		
		while (low <= high) {
			var mid = Math.floor((low + high) / 2);
			var pos = this._getItemPosition(mid);
			
			if (pos.top + pos.height <= scrollTop) {
				low = mid + 1;
			} else if (pos.top > scrollTop) {
				high = mid - 1;
			} else {
				return mid;
			}
		}
		
		return Math.max(0, low);
	};

	// ============================================
	// HEIGHT CACHE & MEASUREMENT
	// ============================================

	/**
	 * Ensure position cache is built
	 */
	VirtualisedListInstance.prototype._ensurePositionCache = function() {
		if (this.positionCache.length === this.items.length) {
			return;
		}
		
		this._rebuildPositionCache();
	};

	/**
	 * Rebuild the entire position cache
	 */
	VirtualisedListInstance.prototype._rebuildPositionCache = function() {
		var estimatedHeight = this.config.estimatedItemHeight;
		var runningTop = 0;
		
		this.positionCache = [];
		
		for (var i = 0; i < this.items.length; i++) {
			var height = this._getItemHeight(i);
			this.positionCache.push({
				top: runningTop,
				height: height
			});
			runningTop += height;
		}
		
		this.totalHeight = runningTop;
	};

	/**
	 * Get item height (from cache or estimated)
	 */
	VirtualisedListInstance.prototype._getItemHeight = function(index) {
		if (!this.variableHeight) {
			return this.fixedItemHeight;
		}
		
		var item = this.items[index];
		var key = this._getItemKey(item, index);
		
		if (this.heightCache.has(key)) {
			return this.heightCache.get(key);
		}
		
		// Return estimated height if not measured
		return this.config.estimatedItemHeight;
	};

	/**
	 * Get item position from cache
	 */
	VirtualisedListInstance.prototype._getItemPosition = function(index) {
		if (!this.variableHeight) {
			return {
				top: index * this.fixedItemHeight,
				height: this.fixedItemHeight
			};
		}
		
		this._ensurePositionCache();
		
		if (index >= 0 && index < this.positionCache.length) {
			return this.positionCache[index];
		}
		
		// Fallback
		return {
			top: index * this.config.estimatedItemHeight,
			height: this.config.estimatedItemHeight
		};
	};

	/**
	 * Measure an item's actual height after rendering
	 */
	VirtualisedListInstance.prototype._measureItemHeight = function(index, element) {
		if (!this.variableHeight) return;
		
		var item = this.items[index];
		var key = this._getItemKey(item, index);
		var measuredHeight = element.getBoundingClientRect().height;
		
		// Only update if different from cached
		var cachedHeight = this.heightCache.get(key);
		if (cachedHeight !== measuredHeight) {
			var oldHeight = cachedHeight || this.config.estimatedItemHeight;
			var heightDelta = measuredHeight - oldHeight;
			this.heightCache.set(key, measuredHeight);
			
			// Scroll position correction: if item is above viewport, adjust scroll
			// to prevent content jumping when height changes
			var itemPosition = this._getItemPosition(index);
			if (itemPosition.top < this.scrollTop && heightDelta !== 0) {
				this._scrollCorrection = (this._scrollCorrection || 0) + heightDelta;
			}
			
			// Update position cache from this index forward
			this._updatePositionCacheFrom(index, heightDelta);
			
			if (this.config.debug) {
				console.log('[VirtualisedList] Height measured:', {
					index: index,
					key: key,
					height: measuredHeight,
					delta: heightDelta
				});
			}
		}
	};

	/**
	 * Update position cache from a given index when a height changes
	 */
	VirtualisedListInstance.prototype._updatePositionCacheFrom = function(fromIndex, heightDelta) {
		if (heightDelta === 0) return;
		
		// Update height at fromIndex
		if (this.positionCache[fromIndex]) {
			this.positionCache[fromIndex].height += heightDelta;
		}
		
		// Update top positions for all subsequent items
		for (var i = fromIndex + 1; i < this.positionCache.length; i++) {
			this.positionCache[i].top += heightDelta;
		}
		
		this.totalHeight += heightDelta;
	};

	// ============================================
	// DOM RECYCLING POOL
	// ============================================

	/**
	 * Get an element from the pool or create a new one
	 */
	VirtualisedListInstance.prototype._getElement = function() {
		if (this.elementPool.length > 0) {
			return this.elementPool.pop();
		}
		
		// Create new element
		var element = document.createElement('div');
		element.className = 'virtual-list-item';
		element.setAttribute('role', 'option');
		return element;
	};

	/**
	 * Return an element to the pool
	 */
	VirtualisedListInstance.prototype._releaseElement = function(element) {
		element.replaceChildren();
		element.removeAttribute('data-index');
		element.removeAttribute('data-key');
		element.removeAttribute('aria-selected');
		element.style.transform = '';
		this.elementPool.push(element);
	};

	// ============================================
	// RENDERING
	// ============================================

	VirtualisedListInstance.prototype._render = function() {
		var totalItems = this.items.length;
		
		// Handle empty state
		if (totalItems === 0) {
			this._showEmptyState();
			return;
		}
		this._hideEmptyState();
		
		// Update spacers based on height mode
		if (this.variableHeight) {
			this._updateSpacersVariable();
		} else {
			this._updateSpacersFixed(totalItems);
		}
		
		// Track which indices we need
		var neededIndices = new Set();
		for (var i = this.firstVisibleIndex; i <= this.lastVisibleIndex; i++) {
			neededIndices.add(i);
		}
		
		// Release elements no longer visible
		var toRelease = [];
		this.activeElements.forEach(function(element, index) {
			if (!neededIndices.has(index)) {
				toRelease.push(index);
			}
		}, this);
		
		for (var j = 0; j < toRelease.length; j++) {
			var idx = toRelease[j];
			var element = this.activeElements.get(idx);
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
			this.activeElements.delete(idx);
		}
		
		// Add/update visible elements
		for (var k = this.firstVisibleIndex; k <= this.lastVisibleIndex; k++) {
			if (!this.activeElements.has(k)) {
				// Get element from pool
				var el = this._getElement();
				this._renderItemToElement(k, el);
				this.itemsContainer.appendChild(el);
				this.activeElements.set(k, el);
				
				// Measure height after rendering (variable height mode)
				if (this.variableHeight) {
					this._measureItemHeight(k, el);
				}
			}
		}
		
		// Apply scroll correction to prevent content jumping
		// when items above viewport change height
		if (this._scrollCorrection && this._scrollCorrection !== 0) {
			this.wrapper.scrollTop += this._scrollCorrection;
			this.scrollTop = this.wrapper.scrollTop;
			this._scrollCorrection = 0;
			
			if (this.config.debug) {
				console.log('[VirtualisedList] Applied scroll correction');
			}
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Rendered:', {
				activeElements: this.activeElements.size,
				poolSize: this.elementPool.length,
				totalHeight: this._getTotalHeight()
			});
		}
	};

	/**
	 * Update spacers for fixed height mode
	 */
	VirtualisedListInstance.prototype._updateSpacersFixed = function(totalItems) {
		var itemHeight = this.fixedItemHeight;
		this.spacerTop.style.height = (this.firstVisibleIndex * itemHeight) + 'px';
		this.spacerBottom.style.height = ((totalItems - this.lastVisibleIndex - 1) * itemHeight) + 'px';
	};

	/**
	 * Update spacers for variable height mode
	 */
	VirtualisedListInstance.prototype._updateSpacersVariable = function() {
		var topHeight = 0;
		var bottomHeight = 0;
		
		// Calculate top spacer height
		if (this.firstVisibleIndex > 0) {
			var firstPos = this._getItemPosition(this.firstVisibleIndex);
			topHeight = firstPos.top;
		}
		
		// Calculate bottom spacer height
		if (this.lastVisibleIndex < this.items.length - 1) {
			var lastPos = this._getItemPosition(this.lastVisibleIndex);
			var lastBottom = lastPos.top + lastPos.height;
			bottomHeight = this.totalHeight - lastBottom;
		}
		
		this.spacerTop.style.height = topHeight + 'px';
		this.spacerBottom.style.height = Math.max(0, bottomHeight) + 'px';
	};

	/**
	 * Render item content to an element
	 */
	VirtualisedListInstance.prototype._renderItemToElement = function(index, element) {
		var item = this.items[index];
		var key = this._getItemKey(item, index);
		
		// Set attributes
		element.setAttribute('data-index', index);
		element.setAttribute('role', 'option');
		
		// Set ID for aria-activedescendant
		element.id = this.id + '-item-' + index;
		
		// Set height based on mode
		if (this.variableHeight) {
			// Variable height - let content determine, or use cached height
			var cachedHeight = this._getItemHeight(index);
			element.style.height = '';  // Clear fixed height
			element.style.minHeight = cachedHeight + 'px';  // Minimum to prevent jumps
		} else {
			element.style.height = this.fixedItemHeight + 'px';
			element.style.minHeight = '';
		}
		
		// Set key if available
		if (this.config.getItemKey) {
			element.setAttribute('data-key', key);
		}
		
		// Selection state
		if (this.selectedIds.has(key)) {
			element.classList.add('selected');
			element.setAttribute('aria-selected', 'true');
		} else {
			element.classList.remove('selected');
			element.setAttribute('aria-selected', 'false');
		}
		
		// Focus state
		if (this.focusedIndex === index) {
			element.classList.add('focused');
		} else {
			element.classList.remove('focused');
		}
		
		// Render content
		if (this.config.renderItem) {
			var content = this.config.renderItem(item, index);
			element.replaceChildren();
			element.appendChild(Funky.Util.toDom(content));
		} else {
			// Default render - just stringify
			element.textContent = typeof item === 'object' ? JSON.stringify(item) : String(item);
		}
		
		// ARIA
		element.setAttribute('aria-posinset', index + 1);
		element.setAttribute('aria-setsize', this.items.length);
	};

	// ============================================
	// HELPERS
	// ============================================

	VirtualisedListInstance.prototype._getTotalHeight = function() {
		if (this.variableHeight) {
			this._ensurePositionCache();
			return this.totalHeight;
		}
		return this.items.length * this.fixedItemHeight;
	};

	VirtualisedListInstance.prototype._getItemKey = function(item, index) {
		if (this.config.getItemKey) {
			return this.config.getItemKey(item);
		}
		return 'item-' + index;
	};

	// ============================================
	// PUBLIC METHODS
	// ============================================

	/**
	 * Get the number of items
	 */
	VirtualisedListInstance.prototype.getItemCount = function() {
		return this.items.length;
	};

	/**
	 * Set new items array
	 */
	VirtualisedListInstance.prototype.setItems = function(items) {
		this.items = items || [];
		this.scrollTop = 0;
		this.wrapper.scrollTop = 0;
		
		// Clear caches for variable height mode
		if (this.variableHeight) {
			this.heightCache.clear();
			this.positionCache = [];
			this.totalHeight = 0;
		}
		
		// Clear selection and focus state
		this.selectedIds.clear();
		this.focusedIndex = -1;
		this.lastSelectedIndex = -1;
		
		this._calculateViewport();
		
		// Clear all active elements
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		this._render();
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Items set:', this.items.length);
		}
	};

	/**
	 * Add items to the end
	 */
	VirtualisedListInstance.prototype.addItems = function(items) {
		if (!items || !items.length) return;
		
		this.items = this.items.concat(items);
		
		// Invalidate position cache to include new items
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		this._calculateViewport();
		this._render();
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Items added:', items.length, 'Total:', this.items.length);
		}
	};

	/**
	 * Add items to the beginning
	 */
	VirtualisedListInstance.prototype.prependItems = function(items) {
		if (!items || !items.length) return;
		
		// Store current scroll info to maintain position
		var oldHeight = this._getTotalHeight();
		
		this.items = items.concat(this.items);
		
		// Invalidate caches
		if (this.variableHeight) {
			this.heightCache.clear();
			this._rebuildPositionCache();
		}
		
		// Clear all active elements (indices changed)
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		// Adjust selection indices
		if (this.focusedIndex >= 0) {
			this.focusedIndex += items.length;
		}
		if (this.lastSelectedIndex >= 0) {
			this.lastSelectedIndex += items.length;
		}
		
		this._calculateViewport();
		this._render();
		
		// Adjust scroll position to maintain view
		var newHeight = this._getTotalHeight();
		var heightDelta = newHeight - oldHeight;
		this.wrapper.scrollTop = this.scrollTop + heightDelta;
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Items prepended:', items.length, 'Total:', this.items.length);
		}
	};

	/**
	 * Scroll to a specific index
	 */
	VirtualisedListInstance.prototype.scrollToIndex = function(index, align) {
		if (index < 0 || index >= this.items.length) return;
		
		align = align || 'start';  // 'start', 'center', 'end'
		
		// Get item position (works for both fixed and variable height)
		var pos = this._getItemPosition(index);
		var itemTop = pos.top;
		var itemHeight = pos.height;
		var targetScrollTop;
		
		switch (align) {
			case 'center':
				targetScrollTop = itemTop - (this.containerHeight / 2) + (itemHeight / 2);
				break;
			case 'end':
				targetScrollTop = itemTop - this.containerHeight + itemHeight;
				break;
			default: // 'start'
				targetScrollTop = itemTop;
		}
		
		this.wrapper.scrollTop = Math.max(0, targetScrollTop);
	};

	/**
	 * Refresh the list (re-render)
	 */
	VirtualisedListInstance.prototype.refresh = function() {
		this._calculateViewport();
		
		// Re-render all active elements
		this.activeElements.forEach(function(element, index) {
			this._renderItemToElement(index, element);
		}, this);
		
		this._render();
	};

	/**
	 * Get visible range
	 */
	VirtualisedListInstance.prototype.getVisibleRange = function() {
		return {
			first: this.firstVisibleIndex,
			last: this.lastVisibleIndex,
			count: this.lastVisibleIndex - this.firstVisibleIndex + 1
		};
	};

	// ============================================
	// INFINITE SCROLL API
	// ============================================

	/**
	 * Scroll to the top of the list
	 */
	VirtualisedListInstance.prototype.scrollToTop = function() {
		this.wrapper.scrollTop = 0;
		this._clearScrollPosition();
	};

	/**
	 * Set whether more items are available
	 * @param {boolean} hasMore
	 */
	VirtualisedListInstance.prototype.setHasMore = function(hasMore) {
		this.hasMore = hasMore;
		
		if (hasMore) {
			this._hideEndOfList();
		} else {
			this._showEndOfList();
		}
	};

	/**
	 * Check if the list is currently loading
	 * @returns {boolean}
	 */
	VirtualisedListInstance.prototype.getIsLoading = function() {
		return this.isLoading;
	};

	/**
	 * Manually trigger a refresh (for pull-to-refresh)
	 */
	VirtualisedListInstance.prototype.triggerRefresh = function() {
		if (this.config.onRefresh && !this.isRefreshing) {
			this._triggerRefresh();
		}
	};

	/**
	 * Reset the list to initial state (clear items and scroll)
	 */
	VirtualisedListInstance.prototype.reset = function() {
		this.items = [];
		this.scrollTop = 0;
		this.wrapper.scrollTop = 0;
		this.hasMore = this.config.hasMore;
		this.isLoading = false;
		
		// Clear caches
		if (this.variableHeight) {
			this.heightCache.clear();
			this.positionCache = [];
			this.totalHeight = 0;
		}
		
		// Clear selection
		this.selectedIds.clear();
		this.focusedIndex = -1;
		this.lastSelectedIndex = -1;
		
		// Clear elements
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		// Hide indicators
		this._hideLoadingIndicator();
		this._hideEndOfList();
		
		// Clear scroll persistence
		this._clearScrollPosition();
		
		this._calculateViewport();
		this._render();
	};

	// ============================================
	// SELECTION API
	// ============================================

	/**
	 * Select a single item by ID
	 * @param {*} id - Item ID
	 */
	VirtualisedListInstance.prototype.select = function(id) {
		if (this.config.selectable === 'none') return;
		
		// Find index for this ID
		var index = this._findIndexById(id);
		if (index >= 0) {
			this._selectSingle(id, index);
		}
	};

	/**
	 * Select all items (multi mode only)
	 */
	VirtualisedListInstance.prototype.selectAll = function() {
		if (this.config.selectable !== 'multi') return;
		
		for (var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			var key = this._getItemKey(item, i);
			this.selectedIds.add(key);
		}
		
		this._updateSelectedElements();
		this._emitSelectEvent();
	};

	/**
	 * Clear all selections
	 */
	VirtualisedListInstance.prototype.deselectAll = function() {
		if (this.selectedIds.size === 0) return;
		
		this.selectedIds.clear();
		this.lastSelectedIndex = -1;
		
		this._updateSelectedElements();
		this._emitSelectEvent();
	};

	/**
	 * Toggle selection on an item
	 * @param {*} id - Item ID
	 */
	VirtualisedListInstance.prototype.toggleSelect = function(id) {
		if (this.config.selectable === 'none') return;
		
		var index = this._findIndexById(id);
		if (index >= 0) {
			this._toggleSelection(id, index);
		}
	};

	/**
	 * Get all selected items
	 * @returns {Array} Selected items
	 */
	VirtualisedListInstance.prototype.getSelected = function() {
		var self = this;
		var selected = [];
		
		this.items.forEach(function(item, index) {
			var key = self._getItemKey(item, index);
			if (self.selectedIds.has(key)) {
				selected.push(item);
			}
		});
		
		return selected;
	};

	/**
	 * Get all selected item IDs
	 * @returns {Array} Selected IDs
	 */
	VirtualisedListInstance.prototype.getSelectedIds = function() {
		return Array.from(this.selectedIds);
	};

	/**
	 * Check if an item is selected
	 * @param {*} id - Item ID
	 * @returns {boolean}
	 */
	VirtualisedListInstance.prototype.isSelected = function(id) {
		return this.selectedIds.has(id);
	};

	/**
	 * Find item index by ID
	 * @private
	 */
	VirtualisedListInstance.prototype._findIndexById = function(id) {
		for (var i = 0; i < this.items.length; i++) {
			var key = this._getItemKey(this.items[i], i);
			if (key === id) {
				return i;
			}
		}
		return -1;
	};

	// ============================================
	// FOCUS API
	// ============================================

	/**
	 * Set focus to a specific index
	 * @param {number} index - Item index
	 */
	VirtualisedListInstance.prototype.setFocus = function(index) {
		if (index >= 0 && index < this.items.length) {
			this._setFocusedIndex(index);
		}
	};

	/**
	 * Get the currently focused index
	 * @returns {number} Focused index (-1 if none)
	 */
	VirtualisedListInstance.prototype.getFocusedIndex = function() {
		return this.focusedIndex;
	};

	/**
	 * Get the currently focused item
	 * @returns {*} Focused item or null
	 */
	VirtualisedListInstance.prototype.getFocusedItem = function() {
		if (this.focusedIndex >= 0 && this.focusedIndex < this.items.length) {
			return this.items[this.focusedIndex];
		}
		return null;
	};

	// ============================================
	// VARIABLE HEIGHT API
	// ============================================

	/**
	 * Get the height of an item by index
	 * @param {number} index - Item index
	 * @returns {number} - Item height (measured or estimated)
	 */
	VirtualisedListInstance.prototype.getItemHeight = function(index) {
		if (index < 0 || index >= this.items.length) {
			return 0;
		}
		
		if (!this.variableHeight) {
			return this.fixedItemHeight;
		}
		
		return this._getItemHeight(index);
	};

	/**
	 * Invalidate the cached height for an item
	 * Use when item content changes and needs re-measurement
	 * @param {*} id - Item ID (value returned by itemKey)
	 */
	VirtualisedListInstance.prototype.invalidateHeight = function(id) {
		if (!this.variableHeight) return;
		
		this.heightCache.delete(id);
		
		// Find the index for this item
		var index = -1;
		for (var i = 0; i < this.items.length; i++) {
			var key = this._getItemKey(this.items[i], i);
			if (key === id) {
				index = i;
				break;
			}
		}
		
		if (index >= 0) {
			// Rebuild position cache from this item
			this._rebuildPositionCache();
			
			// Re-measure if currently visible
			if (this.activeElements.has(index)) {
				var element = this.activeElements.get(index);
				this._measureItemHeight(index, element);
			}
			
			this._render();
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Height invalidated:', id);
		}
	};

	/**
	 * Invalidate all cached heights
	 * Use when all items need re-measurement (e.g., after resize)
	 */
	VirtualisedListInstance.prototype.invalidateAllHeights = function() {
		if (!this.variableHeight) return;
		
		this.heightCache.clear();
		this._rebuildPositionCache();
		
		// Re-measure all visible elements
		this.activeElements.forEach(function(element, index) {
			this._measureItemHeight(index, element);
		}, this);
		
		this._render();
		
		if (this.config.debug) {
			console.log('[VirtualisedList] All heights invalidated');
		}
	};

	// ============================================
	// DATA MANAGEMENT API
	// ============================================

	/**
	 * Update a single item by ID
	 * @param {*} id - Item ID
	 * @param {Object} newData - Data to merge
	 * @returns {boolean} - Whether update succeeded
	 */
	VirtualisedListInstance.prototype.updateItem = function(id, newData) {
		var index = this._findIndexById(id);
		if (index === -1) return false;
		
		// Merge data
		var item = this.items[index];
		this.items[index] = Object.assign({}, item, newData);
		
		// Also update in originalItems if filtering
		if (this.originalItems) {
			var origIndex = this._findIndexInArray(this.originalItems, id);
			if (origIndex >= 0) {
				this.originalItems[origIndex] = Object.assign({}, this.originalItems[origIndex], newData);
			}
		}
		
		// Invalidate height if variable height mode
		if (this.variableHeight) {
			this.heightCache.delete(id);
			this._rebuildPositionCache();
		}
		
		// Update DOM if visible
		if (this.activeElements.has(index)) {
			var element = this.activeElements.get(index);
			this._renderItemToElement(index, element);
			
			// Re-measure if variable height
			if (this.variableHeight) {
				this._measureItemHeight(index, element);
			}
		}
		
		// Emit event
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:itemupdated', {
				id: this.id,
				itemId: id,
				item: this.items[index],
				index: index
			});
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Item updated:', id);
		}
		
		return true;
	};

	/**
	 * Remove a single item by ID
	 * @param {*} id - Item ID
	 * @returns {boolean} - Whether removal succeeded
	 */
	VirtualisedListInstance.prototype.removeItem = function(id) {
		return this.removeItems([id]) > 0;
	};

	/**
	 * Remove multiple items by ID
	 * @param {Array} ids - Array of item IDs
	 * @returns {number} - Number of items removed
	 */
	VirtualisedListInstance.prototype.removeItems = function(ids) {
		if (!ids || !ids.length) return 0;
		
		var idSet = new Set(ids);
		var removedCount = 0;
		var self = this;
		
		// Track if focused/selected items are removed
		var focusedRemoved = false;
		var selectionChanged = false;
		
		// Remove from items array
		this.items = this.items.filter(function(item, index) {
			var key = self._getItemKey(item, index);
			if (idSet.has(key)) {
				removedCount++;
				
				// Check if focused
				if (index === self.focusedIndex) {
					focusedRemoved = true;
				}
				
				// Remove from selection
				if (self.selectedIds.has(key)) {
					self.selectedIds.delete(key);
					selectionChanged = true;
				}
				
				// Remove from height cache
				if (self.variableHeight) {
					self.heightCache.delete(key);
				}
				
				return false;
			}
			return true;
		});
		
		// Also remove from originalItems if filtering
		if (this.originalItems) {
			this.originalItems = this.originalItems.filter(function(item, index) {
				var key = self._getItemKey(item, index);
				return !idSet.has(key);
			});
		}
		
		if (removedCount > 0) {
			// Adjust focus
			if (focusedRemoved) {
				this.focusedIndex = Math.min(this.focusedIndex, this.items.length - 1);
			}
			
			// Rebuild caches and re-render
			if (this.variableHeight) {
				this._rebuildPositionCache();
			}
			
			// Clear active elements (indices changed)
			this.activeElements.forEach(function(element) {
				this.itemsContainer.removeChild(element);
				this._releaseElement(element);
			}, this);
			this.activeElements.clear();
			
			this._calculateViewport();
			this._render();
			
			// Emit selection change if needed
			if (selectionChanged) {
				this._emitSelectEvent();
			}
			
			// Emit event
			if (typeof Funky !== 'undefined' && Funky.PubSub) {
				Funky.PubSub.emit('funky:virtual-list:itemsremoved', {
					id: this.id,
					ids: ids,
					count: removedCount
				});
			}
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Items removed:', removedCount);
		}
		
		return removedCount;
	};

	/**
	 * Insert a single item at a specific index
	 * @param {*} item - Item to insert
	 * @param {number} index - Index to insert at (default: 0)
	 * @returns {boolean} - Whether insertion succeeded
	 */
	VirtualisedListInstance.prototype.insertItem = function(item, index) {
		return this.insertItems([item], index) === 1;
	};

	/**
	 * Insert multiple items at a specific index
	 * @param {Array} items - Items to insert
	 * @param {number} index - Index to insert at (default: 0)
	 * @returns {number} - Number of items inserted
	 */
	VirtualisedListInstance.prototype.insertItems = function(items, index) {
		if (!items || !items.length) return 0;
		
		index = typeof index === 'number' ? index : 0;
		index = Math.max(0, Math.min(index, this.items.length));
		
		// Store current scroll info
		var oldHeight = this._getTotalHeight();
		var insertAboveViewport = index <= this.firstVisibleIndex;
		
		// Insert items
		var args = [index, 0].concat(items);
		Array.prototype.splice.apply(this.items, args);
		
		// Also insert into originalItems if filtering
		if (this.originalItems) {
			var origArgs = [index, 0].concat(items);
			Array.prototype.splice.apply(this.originalItems, origArgs);
		}
		
		// Adjust focus and selection indices
		if (this.focusedIndex >= index) {
			this.focusedIndex += items.length;
		}
		if (this.lastSelectedIndex >= index) {
			this.lastSelectedIndex += items.length;
		}
		
		// Rebuild caches
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		// Clear active elements (indices changed)
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		this._calculateViewport();
		this._render();
		
		// Adjust scroll position if inserted above viewport
		if (insertAboveViewport) {
			var newHeight = this._getTotalHeight();
			var heightDelta = newHeight - oldHeight;
			this.wrapper.scrollTop += heightDelta;
		}
		
		// Emit event
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:itemsinserted', {
				id: this.id,
				count: items.length,
				index: index
			});
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Items inserted:', items.length, 'at index', index);
		}
		
		return items.length;
	};

	/**
	 * Find item index by ID in the main items array
	 * @private
	 */
	VirtualisedListInstance.prototype._findIndexInArray = function(arr, id) {
		for (var i = 0; i < arr.length; i++) {
			var key = this._getItemKey(arr[i], i);
			if (key === id) return i;
		}
		return -1;
	};

	// ============================================
	// FILTERING API
	// ============================================

	/**
	 * Filter items by predicate
	 * @param {Function} predicate - function(item, index) => boolean
	 */
	VirtualisedListInstance.prototype.filter = function(predicate) {
		if (typeof predicate !== 'function') return;
		
		// Backup original items if not already
		if (!this.originalItems) {
			this.originalItems = this.items.slice();
		}
		
		this.filterPredicate = predicate;
		this.items = this.originalItems.filter(predicate);
		
		// Clear caches
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		// Clear active elements
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		// Reset scroll and focus
		this.scrollTop = 0;
		this.wrapper.scrollTop = 0;
		this.focusedIndex = -1;
		
		this._calculateViewport();
		this._render();
		
		// Emit event
		if (this.config.onFilter) {
			this.config.onFilter(this.items.length, this.originalItems.length);
		}
		
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:filter', {
				id: this.id,
				count: this.items.length,
				total: this.originalItems.length
			});
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Filtered:', this.items.length, 'of', this.originalItems.length);
		}
	};

	/**
	 * Clear filter and restore all items
	 */
	VirtualisedListInstance.prototype.clearFilter = function() {
		if (!this.originalItems) return;
		
		this.items = this.originalItems;
		this.originalItems = null;
		this.filterPredicate = null;
		
		// Rebuild caches
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		// Clear active elements
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		this._calculateViewport();
		this._render();
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Filter cleared, showing all', this.items.length, 'items');
		}
	};

	/**
	 * Get filtered count vs total count
	 * @returns {Object} { filtered, total }
	 */
	VirtualisedListInstance.prototype.getFilteredCount = function() {
		return {
			filtered: this.items.length,
			total: this.originalItems ? this.originalItems.length : this.items.length
		};
	};

	/**
	 * Check if a filter is active
	 * @returns {boolean}
	 */
	VirtualisedListInstance.prototype.isFiltered = function() {
		return this.originalItems !== null;
	};

	// ============================================
	// SEARCH API
	// ============================================

	/**
	 * Search items and highlight matches
	 * @param {string} query - Search query
	 * @returns {number} - Number of matches
	 */
	VirtualisedListInstance.prototype.search = function(query) {
		this.searchQuery = (query || '').trim();
		this.searchMatches = [];
		this.searchResults = [];
		this.currentMatchIndex = -1;
		
		if (!this.searchQuery) {
			this._clearSearchHighlights();
			return 0;
		}
		
		var config = this.config;
		var useFuzzy = config.fuzzySearch && Funky.FuzzySearch;
		
		if (useFuzzy) {
			this._searchWithFuzzy();
		} else {
			this._searchWithIndexOf();
		}
		
		// Re-render visible items to show highlights
		this._render();
		
		// Go to first match
		if (this.searchMatches.length > 0) {
			this.goToMatch(0);
		}
		
		// Announce to screen readers
		if (this.searchMatches.length === 0) {
			this.announce('No results found for ' + query);
		} else if (this.searchMatches.length === 1) {
			this.announce('1 result found');
		} else {
			this.announce(this.searchMatches.length + ' results found');
		}
		
		// Emit event
		if (this.config.onSearch) {
			this.config.onSearch(this.searchMatches.length, query);
		}
		
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:search', {
				id: this.id,
				query: query,
				matches: this.searchMatches.length,
				fuzzy: useFuzzy
			});
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Search:', query, 'found', this.searchMatches.length, 'matches', useFuzzy ? '(fuzzy)' : '(indexOf)');
		}
		
		return this.searchMatches.length;
	};

	/**
	 * Fuzzy search using Funky.FuzzySearch
	 * @private
	 */
	VirtualisedListInstance.prototype._searchWithFuzzy = function() {
		var self = this;
		var config = this.config;
		var FuzzySearch = Funky.FuzzySearch;
		var searchFn = config.searchFields;
		
		// If custom function provided, use fuzzy matching per item
		if (typeof searchFn === 'function') {
			this._searchWithFuzzyCustom();
			return;
		}
		
		// Determine keys to search
		var keys = [];
		if (Array.isArray(searchFn)) {
			keys = searchFn;
		} else if (this.items.length > 0 && typeof this.items[0] === 'object') {
			// Auto-detect string fields from first item
			keys = Object.keys(this.items[0]).filter(function(key) {
				return typeof self.items[0][key] === 'string';
			});
		}
		
		// Perform fuzzy search
		var results = FuzzySearch.search(this.searchQuery, this.items, {
			keys: keys,
			threshold: config.fuzzyThreshold,
			tokenize: config.fuzzyTokenize,
			limit: Infinity
		});
		
		// Store results with positions for highlighting
		this.searchResults = results;
		
		// Extract match indices (sorted by score already)
		this.searchMatches = results.map(function(r) {
			return r.index;
		});
	};

	/**
	 * Fuzzy search with custom search function
	 * @private
	 */
	VirtualisedListInstance.prototype._searchWithFuzzyCustom = function() {
		var self = this;
		var config = this.config;
		var searchFn = config.searchFields;
		var FuzzySearch = Funky.FuzzySearch;
		var query = this.searchQuery;
		
		var results = [];
		
		this.items.forEach(function(item, index) {
			// Get text via custom function
			var text = searchFn(item, query);
			
			if (typeof text === 'string') {
				// Fuzzy match against returned text
				var match = FuzzySearch.match(query, text, {
					threshold: config.fuzzyThreshold,
					caseSensitive: false
				});
				
				if (match) {
					results.push({
						item: item,
						index: index,
						score: match.score,
						matches: match.matches,
						key: null
					});
				}
			} else if (text === true) {
				// Custom function returned true (legacy behavior)
				results.push({
					item: item,
					index: index,
					score: 1,
					matches: [],
					key: null
				});
			}
		});
		
		// Sort by score descending
		results.sort(function(a, b) {
			return b.score - a.score;
		});
		
		this.searchResults = results;
		this.searchMatches = results.map(function(r) {
			return r.index;
		});
	};

	/**
	 * Legacy indexOf search (backwards compatible)
	 * @private
	 */
	VirtualisedListInstance.prototype._searchWithIndexOf = function() {
		var self = this;
		var searchFn = this.config.searchFields;
		var query = this.searchQuery.toLowerCase();
		
		this.items.forEach(function(item, index) {
			var matches = false;
			
			if (typeof searchFn === 'function') {
				// Custom search function
				matches = searchFn(item, query);
			} else if (Array.isArray(searchFn)) {
				// Search specified fields
				matches = searchFn.some(function(field) {
					var value = item[field];
					return value && String(value).toLowerCase().indexOf(query) !== -1;
				});
			} else {
				// Default: search all string values
				matches = Object.keys(item).some(function(key) {
					var value = item[key];
					return typeof value === 'string' && 
						value.toLowerCase().indexOf(query) !== -1;
				});
			}
			
			if (matches) {
				self.searchMatches.push(index);
				// Store basic result for compatibility
				self.searchResults.push({
					item: item,
					index: index,
					score: 1,
					matches: [],
					key: null
				});
			}
		});
	};

	/**
	 * Go to a specific match index
	 * @param {number} matchIndex - Index in searchMatches array
	 */
	VirtualisedListInstance.prototype.goToMatch = function(matchIndex) {
		if (this.searchMatches.length === 0) return;
		
		matchIndex = Math.max(0, Math.min(matchIndex, this.searchMatches.length - 1));
		this.currentMatchIndex = matchIndex;
		
		var itemIndex = this.searchMatches[matchIndex];
		this.scrollToIndex(itemIndex, 'center');
		this._setFocusedIndex(itemIndex);
	};

	/**
	 * Go to next search match
	 */
	VirtualisedListInstance.prototype.nextMatch = function() {
		if (this.searchMatches.length === 0) return;
		
		var nextIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
		this.goToMatch(nextIndex);
	};

	/**
	 * Go to previous search match
	 */
	VirtualisedListInstance.prototype.previousMatch = function() {
		if (this.searchMatches.length === 0) return;
		
		var prevIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
		this.goToMatch(prevIndex);
	};

	/**
	 * Clear search
	 */
	VirtualisedListInstance.prototype.clearSearch = function() {
		this.searchQuery = '';
		this.searchMatches = [];
		this.searchResults = [];
		this.currentMatchIndex = -1;
		this._clearSearchHighlights();
	};

	/**
	 * Check if an item index is a search match
	 * @param {number} index - Item index
	 * @returns {boolean}
	 */
	VirtualisedListInstance.prototype.isSearchMatch = function(index) {
		return this.searchMatches.indexOf(index) !== -1;
	};

	/**
	 * Get search result for item index
	 * @param {number} index - Item index
	 * @returns {Object|null} { item, index, score, matches, key }
	 */
	VirtualisedListInstance.prototype.getSearchResult = function(index) {
		for (var i = 0; i < this.searchResults.length; i++) {
			if (this.searchResults[i].index === index) {
				return this.searchResults[i];
			}
		}
		return null;
	};

	/**
	 * Get current match info
	 * @returns {Object|null} { index, item, matchNumber, totalMatches }
	 */
	VirtualisedListInstance.prototype.getCurrentMatch = function() {
		if (this.currentMatchIndex < 0 || this.searchMatches.length === 0) {
			return null;
		}
		
		var itemIndex = this.searchMatches[this.currentMatchIndex];
		return {
			index: itemIndex,
			item: this.items[itemIndex],
			matchNumber: this.currentMatchIndex + 1,
			totalMatches: this.searchMatches.length
		};
	};

	/**
	 * Create a text highlighter function for search results
	 * @param {number} [itemIndex] - Item index for fuzzy match positions
	 * @param {string} [field] - Field name for fuzzy match positions
	 * @returns {Function} highlighter(text, [itemIndex], [field]) => HTML string
	 */
	VirtualisedListInstance.prototype.getHighlighter = function(itemIndex, field) {
		var self = this;
		var query = this.searchQuery;
		
		if (!query) {
			return function(text) { return text; };
		}
		
		// If fuzzy search with positions available
		if (this.config.fuzzySearch && Funky.FuzzySearch && Funky.Highlight) {
			return function(text, idx, fld) {
				if (!text) return text;
				var str = String(text);
				
				// Use provided args or outer closure args
				var itemIdx = idx !== undefined ? idx : itemIndex;
				var fieldName = fld !== undefined ? fld : field;
				
				if (itemIdx !== undefined) {
					var result = self.getSearchResult(itemIdx);
					if (result && result.matches && result.matches.length > 0) {
						// Check if this field matches the result key
						if (!fieldName || result.key === fieldName || result.key === null) {
							// Use Funky.Highlight.fromMatches if available
							if (Funky.Highlight.fromMatches) {
								return Funky.Highlight.fromMatches(str, result.matches);
							}
						}
					}
				}
				
				// Fallback: simple substring highlight
				var lowerStr = str.toLowerCase();
				var lowerQuery = query.toLowerCase();
				var idx = lowerStr.indexOf(lowerQuery);
				
				if (idx === -1) return str;
				
				return str.substring(0, idx) + 
					'<mark class="virtual-list-highlight">' + 
					str.substring(idx, idx + query.length) + 
					'</mark>' + 
					str.substring(idx + query.length);
			};
		}
		
		// Legacy indexOf highlighter
		var lowerQuery = query.toLowerCase();
		return function(text) {
			if (!text) return text;
			var str = String(text);
			var lowerStr = str.toLowerCase();
			var idx = lowerStr.indexOf(lowerQuery);
			
			if (idx === -1) return str;
			
			return str.substring(0, idx) + 
				'<mark class="virtual-list-highlight">' + 
				str.substring(idx, idx + query.length) + 
				'</mark>' + 
				str.substring(idx + query.length);
		};
	};

	/**
	 * Clear search highlights from visible elements
	 * @private
	 */
	VirtualisedListInstance.prototype._clearSearchHighlights = function() {
		// Re-render visible items without highlights
		this.activeElements.forEach(function(element, index) {
			this._renderItemToElement(index, element);
		}, this);
	};

	// ============================================
	// SORTING API
	// ============================================

	/**
	 * Sort items by comparator
	 * @param {Function} comparator - function(a, b) => number
	 */
	VirtualisedListInstance.prototype.sort = function(comparator) {
		if (typeof comparator !== 'function') return;
		
		// Backup original order if not already (for unsort)
		if (!this.originalItems && !this.sortComparator) {
			this.originalItems = this.items.slice();
		}
		
		this.sortComparator = comparator;
		this.items.sort(comparator);
		
		// Rebuild caches
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		// Clear active elements
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		// Reset focus (but maintain selection by ID)
		this.focusedIndex = -1;
		
		this._calculateViewport();
		this._render();
		
		// Emit event
		if (this.config.onSort) {
			this.config.onSort(comparator);
		}
		
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:sort', { id: this.id });
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Sorted');
		}
	};

	/**
	 * Reverse the current sort order
	 */
	VirtualisedListInstance.prototype.reverseSort = function() {
		this.items.reverse();
		
		// Clear and re-render
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		this._calculateViewport();
		this._render();
	};

	/**
	 * Clear sort and restore original order
	 */
	VirtualisedListInstance.prototype.clearSort = function() {
		if (!this.originalItems) return;
		
		// Only clear if we're not also filtering
		if (!this.filterPredicate) {
			this.items = this.originalItems;
			this.originalItems = null;
		} else {
			// Re-apply filter to original order
			this.items = this.originalItems.filter(this.filterPredicate);
		}
		
		this.sortComparator = null;
		
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		this._calculateViewport();
		this._render();
	};

	// ============================================
	// BATCH OPERATIONS
	// ============================================

	/**
	 * Start a batch of operations (defer re-rendering)
	 */
	VirtualisedListInstance.prototype.beginBatch = function() {
		this.isBatching = true;
	};

	/**
	 * End batch and apply all changes
	 */
	VirtualisedListInstance.prototype.endBatch = function() {
		if (!this.isBatching) return;
		
		this.isBatching = false;
		
		// Rebuild everything once
		if (this.variableHeight) {
			this._rebuildPositionCache();
		}
		
		this.activeElements.forEach(function(element) {
			this.itemsContainer.removeChild(element);
			this._releaseElement(element);
		}, this);
		this.activeElements.clear();
		
		this._calculateViewport();
		this._render();
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Batch complete');
		}
	};

	/**
	 * Execute a batch of operations
	 * @param {Function} callback - Function containing operations
	 */
	VirtualisedListInstance.prototype.batch = function(callback) {
		this.beginBatch();
		try {
			callback.call(this, this);
		} finally {
			this.endBatch();
		}
	};

	// ============================================
	// WEBSOCKET INTEGRATION
	// ============================================

	/**
	 * Bind to WebSocket entity_change events
	 * @private
	 */
	VirtualisedListInstance.prototype._bindWebSocket = function() {
		if (!this.config.wsEntity) return;
		
		var self = this;
		var entity = this.config.wsEntity;
		
		// Create bound handler
		this._wsHandler = function(data) {
			self._handleEntityChange(data);
		};
		
		// Listen for entity_change events via EventBus
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.on('funky:ws:entity-change', this._wsHandler);
		}
		
		// Also listen via DOM event
		document.addEventListener('funky.ws.entity-change', function(e) {
			if (e.detail && e.detail.entity === entity) {
				self._handleEntityChange(e.detail);
			}
		});
		
		// Subscribe to WebSocket channel if available
		if (typeof Funky !== 'undefined' && Funky.WebSocket && Funky.WebSocket.subscribe) {
			var channel = this.config.wsChannel || ('entity:' + entity);
			Funky.WebSocket.subscribe(channel);
			
			if (this.config.debug) {
				console.log('[VirtualisedList] Subscribed to WebSocket channel:', channel);
			}
		}
	};

	/**
	 * Handle WebSocket entity_change event
	 * @param {Object} data - { entity, id, action, ... }
	 * @private
	 */
	VirtualisedListInstance.prototype._handleEntityChange = function(data) {
		if (data.entity !== this.config.wsEntity) return;
		
		var action = data.action;
		var id = data.id;
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Entity change:', action, id);
		}
		
		// Allow custom handler to override
		if (this.config.onEntityChange) {
			var handled = this.config.onEntityChange(action, id, data);
			if (handled === false) return; // Custom handler says skip default
		}
		
		switch (action) {
			case 'created':
				// For created, we typically need to fetch the new item
				// Emit event so parent can handle fetching
				if (typeof Funky !== 'undefined' && Funky.PubSub) {
					Funky.PubSub.emit('funky:virtual-list:entitycreated', {
						id: this.id,
						entityId: id,
						entity: data.entity
					});
				}
				break;
				
			case 'updated':
				// For updated, emit event so parent can fetch and update
				if (typeof Funky !== 'undefined' && Funky.PubSub) {
					Funky.PubSub.emit('funky:virtual-list:entityupdated', {
						id: this.id,
						entityId: id,
						entity: data.entity
					});
				}
				break;
				
			case 'deleted':
				// For deleted, we can remove directly
				this.removeItem(id);
				break;
		}
	};

	/**
	 * Unbind WebSocket handlers
	 * @private
	 */
	VirtualisedListInstance.prototype._unbindWebSocket = function() {
		if (this._wsHandler && typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.off('funky:ws:entity-change', this._wsHandler);
		}
		this._wsHandler = null;
	};

	// ============================================
	// CLEANUP
	// ============================================

	/**
	 * Destroy the instance
	 */
	VirtualisedListInstance.prototype.destroy = function() {
		if (this.isDestroyed) return;
		
		this.isDestroyed = true;
		
		// Unregister keyboard shortcuts
		if (this._keyboardUnregisters) {
			this._keyboardUnregisters.forEach(function(unregister) {
				if (typeof unregister === 'function') {
					unregister();
				}
			});
			this._keyboardUnregisters = null;
		}
		
		this._unbindEvents();
		this._unbindWebSocket();
		
		// Clear DOM
		this.container.replaceChildren();
		
		// Clear references
		this.items = [];
		this.originalItems = null;
		this.activeElements.clear();
		this.elementPool = [];
		
		// Clear variable height caches
		if (this.heightCache) {
			this.heightCache.clear();
		}
		this.positionCache = [];
		this.totalHeight = 0;
		
		// Clear data management state
		this.filterPredicate = null;
		this.sortComparator = null;
		this.searchQuery = '';
		this.searchMatches = [];
		
		// Remove from registry - unregister both instance id and container id
		_instances.unregister(this.id);
		var containerId = this.container && this.container.id;
		if (containerId && containerId !== this.id) {
			_instances.unregister(containerId);
		}
		
		if (this.config.debug) {
			console.log('[VirtualisedList] Destroyed:', this.id);
		}
		
		// EventBus notification
		if (typeof Funky !== 'undefined' && Funky.PubSub) {
			Funky.PubSub.emit('funky:virtual-list:destroyed', { id: this.id });
		}
	};

	// =========================================
	// Bindable Interface (LiveBinding)
	// =========================================

	/**
	 * Set all items data (Bindable Interface)
	 * Clears existing items and renders new ones
	 * @param {Array} data - Items array
	 */
	VirtualisedListInstance.prototype.setData = function(data) {
		this.setItems(Array.isArray(data) ? data : []);
	};

	/**
	 * Get all items data (Bindable Interface)
	 * @returns {Array} Array of item data objects
	 */
	VirtualisedListInstance.prototype.getData = function() {
		return this.items.slice();
	};

	/**
	 * Add items data (Bindable Interface)
	 * @param {Array|Object} data - Item(s) to add
	 */
	VirtualisedListInstance.prototype.addData = function(data) {
		var items = Array.isArray(data) ? data : [data];
		this.addItems(items);
	};

	/**
	 * Remove items by ID (Bindable Interface)
	 * @param {Array|string|number} ids - Item ID(s) to remove
	 */
	VirtualisedListInstance.prototype.removeData = function(ids) {
		var idArray = Array.isArray(ids) ? ids : [ids];
		this.removeItems(idArray);
	};

	/**
	 * Clear all items (Bindable Interface)
	 */
	VirtualisedListInstance.prototype.clearData = function() {
		this.setItems([]);
	};

	// ============================================
	// STATIC METHODS
	// ============================================

	/**
	 * Initialize a virtualized list
	 * @param {string|HTMLElement} selector - Container selector or element
	 * @param {Object} options - Configuration options
	 * @returns {VirtualisedListInstance}
	 */
	VirtualisedList.init = function(selector, options) {
		var container;
		
		if (typeof selector === 'string') {
			container = document.querySelector(selector);
		} else {
			container = selector;
		}
		
		if (!container) {
			console.error('[VirtualisedList] Container not found:', selector);
			return null;
		}
		
		// Check for existing instance
		var existingInstance = _instances.getByElement(container);
		if (existingInstance) {
			return existingInstance;
		}
		
		var instance = new VirtualisedListInstance(container, options);
		return instance;
	};

	/**
	 * Get instance by ID or element
	 * @param {string|HTMLElement} idOrElement
	 * @returns {VirtualisedListInstance|null}
	 */
	VirtualisedList.getInstance = function(idOrElement) {
		if (typeof idOrElement === 'string') {
			var byId = _instances.get(idOrElement);
			if (byId) return byId;
			var element = document.querySelector(idOrElement);
			return element ? _instances.getByElement(element) : null;
		}
		return idOrElement ? _instances.getByElement(idOrElement) : null;
	};

	/**
	 * Destroy all instances
	 */
	VirtualisedList.destroyAll = function() {
		_instances.destroyAll();
	};

	/**
	 * Get all instances
	 * @returns {Object}
	 */
	VirtualisedList.getAll = function() {
		return _instances.getAll();
	};

	/**
	 * Alias for init (for API consistency)
	 */
	VirtualisedList.create = VirtualisedList.init;

	/**
	 * Get instances Map (for bindable interface)
	 */
	Object.defineProperty(VirtualisedList, 'instances', {
		get: function() {
			return _instances.getMap ? _instances.getMap() : new Map();
		},
		enumerable: true,
		configurable: true
	});

	// ============================================
	// REGISTER MODULE
	// ============================================

	// Ensure Funky namespace exists
	// Register with Funky securely
	Funky.register('VirtualisedList', VirtualisedList);

	console.log('[Funky] VirtualisedList component loaded');

})(window, document);
