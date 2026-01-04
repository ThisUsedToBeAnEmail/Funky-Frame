/**
 * Funky.CardGrid - Responsive grid of data cards
 * 
 * Provides a flexible grid layout for displaying data as cards with:
 * - Custom card templates via renderCard function
 * - Multiple layout modes (grid/list)
 * - Sorting and filtering
 * - Selection (single/multi/none)
 * - Pagination and infinite scroll
 * 
 * @namespace Funky.CardGrid
 * @version 1.0.1
 */
(function(window) {
    'use strict';

    // Guard against double registration
    if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('CardGrid')) {
        return;
    }

    // Registry dependency check
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.CardGrid] Registry not found. Load namespace.js first.');
        return;
    }

    var D = Funky.Dom;

    // =========================================================================
    // DEFAULTS
    // =========================================================================

    var DEFAULTS = {
        // Data
        items: [],
        url: null,
        idField: 'id',
        
        // Layout
        columns: 'auto',
        gap: 'md',
        layout: 'grid',
        cardMinWidth: '280px',
        
        // Pagination
        pagination: false,
        pageSize: 12,
        
        // Features
        searchable: false,
        sortable: false,
        viewToggle: false,
        selectable: false,
        checkboxPosition: 'top-left',  // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        
        // Search
        searchFields: ['title', 'name', 'description'],
        
        // Sort
        sortFields: [],
        defaultSort: null,
        defaultSortDirection: 'asc',
        
        // Entity identifier (for ActionBar events)
        entity: null,
        
        // Virtualization (Phase 6)
        virtualize: 'auto',         // 'auto' | true | false
        virtualizeThreshold: 100,   // Enable virtualization when items > this
        rowHeight: 'auto',          // Number or 'auto' (measure first row)
        overscan: 3,                // Number of extra rows to render above/below viewport
        containerHeight: '600px',   // Height of virtualized container
        
        // Animation (Funky.Animate integration)
        animate: {
            cards: true,
            addRemove: true,
            stagger: 50
        },
        
        // Accessibility (Funky.Announce integration)
        announce: true,
        
        // LiveBinding (Funky.LiveBinding integration)
        liveBinding: null,
        
        // Render
        renderCard: null,
        
        // Callbacks
        onCardClick: null,
        onSelect: null,
        onSearch: null,
        onSort: null,
        onViewChange: null,
        onLoad: null,
        onLoadError: null
    };

    // =========================================================================
    // CARDGRID NAMESPACE
    // =========================================================================

    var _instances = Funky.Registry.createInstanceRegistry('CardGrid');

    var CardGrid = {
        instanceCounter: 0,
        
        defaults: DEFAULTS,
        
        /**
         * Initialize a CardGrid on container
         * @param {string|HTMLElement} container - Container selector or element
         * @param {Object} options - Configuration options
         * @returns {CardGridInstance}
         */
        init: function(container, options) {
            var instance = new CardGridInstance(container, options);
            _instances.register(instance.id, instance);
            return instance;
        },

        /**
         * @deprecated Use CardGrid.init() instead
         */
        create: function(container, options) {
            if (Funky.debug) {
                console.warn('[Funky.CardGrid] create() is deprecated. Use init() instead.');
            }
            return CardGrid.init(container, options);
        },
        
        /**
         * Get an instance by ID
         * @param {string} id - Instance ID
         * @returns {CardGridInstance|null}
         */
        getInstance: function(id) {
            return _instances.get(id);
        },
        
        /**
         * Get instance by container element
         * @param {HTMLElement} element - Container element
         * @returns {CardGridInstance|null}
         */
        getInstanceByElement: function(element) {
            return _instances.getByElement(element);
        },

        /**
         * Destroy CardGrid by ID
         * @param {string} id - Instance ID
         */
        destroy: function(id) {
            var instance = _instances.get(id);
            if (instance) {
                instance.destroy();
            }
        },
        
        /**
         * Destroy all instances
         */
        destroyAll: function() {
            _instances.destroyAll();
        }
    };

    // =========================================================================
    // CARDGRIDINSTANCE CONSTRUCTOR
    // =========================================================================

    /**
     * CardGrid Instance
     * @constructor
     * @param {string|HTMLElement} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    function CardGridInstance(container, options) {
        this.id = 'card-grid-' + (++CardGrid.instanceCounter);
        this.options = Object.assign({}, DEFAULTS, options);
        
        // Resolve container
        if (typeof container === 'string') {
            this.container = D.one(container);
        } else if (container && container.el) {
            this.container = container;
        } else {
            this.container = D.wrap(container);
        }
        
        if (!this.container || !this.container.el) {
            console.error('[Funky.CardGrid] Container not found:', container);
            return;
        }
        
        // State
        this.items = [];
        this.filteredItems = [];
        this.selectedIds = new Set();
        this.currentView = this.options.layout;
        this.currentSort = this.options.defaultSort;
        this.currentSortDirection = this.options.defaultSortDirection;
        this.currentSearch = '';
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMorePages = true;
        this.totalItems = 0;
        
        // Virtualization state
        this.isVirtualized = false;
        this._gridVirtualizer = null;
        this._rowHeight = null;
        this._cardWidth = null;
        
        // DOM references
        this.els = {
            wrapper: null,
            toolbar: null,
            grid: null,
            cards: new Map(),
            pagination: null,
            emptyState: null,
            loadingOverlay: null,
            virtualContainer: null
        };
        
        // Event cleanup
        this._cleanupFns = [];
        
        // Initialize
        this._init();
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    CardGridInstance.prototype._init = function() {
        this._buildDOM();
        this._applyLayoutOptions();
        this._buildPagination();
        this._initSelection();
        this._bindActionBar();
        this._bindEvents();
        this._initLiveBinding();
        
        // Load initial data
        if (this.options.items && this.options.items.length > 0) {
            this.setItems(this.options.items);
        } else if (this.options.url) {
            this._loadFromUrl();
        } else {
            this._renderEmpty();
        }
        
        // Update count after initial load
        this._updateCountDisplay();
        
        // Mark as initialized
        this.container.attr('data-card-grid-id', this.id);
        this.container.classAdd('funky-card-grid-container');
    };

    CardGridInstance.prototype._applyLayoutOptions = function() {
        // Apply gap
        if (this.options.gap) {
            this.setGap(this.options.gap);
        }
        
        // Apply card min width
        if (this.options.cardMinWidth) {
            this.setCardMinWidth(this.options.cardMinWidth);
        }
        
        // Apply column config
        this._applyColumnConfig();
    };

    CardGridInstance.prototype._buildDOM = function() {
        // Create wrapper with explicit full width
        this.els.wrapper = D.div()
            .classAdd('funky-card-grid')
            .attr('role', 'grid')
            .attr('aria-label', 'Card grid')
            .style({ width: '100%' });
        
        // Create grid container with explicit full width
        this.els.grid = D.div()
            .classAdd('funky-card-grid__grid')
            .classAdd('funky-card-grid__grid--' + this.currentView)
            .style({ width: '100%' });
        
        // Append to wrapper
        this.els.wrapper.append(this.els.grid);
        
        // Ensure container has full width
        this.container.style({ width: '100%' });
        
        // Append wrapper to container
        this.container.empty().append(this.els.wrapper);
    };

    CardGridInstance.prototype._bindEvents = function() {
        var self = this;
        
        // Grid click delegation for card clicks
        var gridClickHandler = function(e) {
            var cardEl = e.target.closest('.funky-card-grid__card');
            if (!cardEl) return;
            
            var itemId = cardEl.getAttribute('data-item-id');
            var item = self._getItemById(itemId);
            
            if (item) {
                self._handleCardClick(item, cardEl, e);
            }
        };
        
        this.els.grid.on('click', gridClickHandler);
        this._cleanupFns.push(function() {
            self.els.grid.off('click', gridClickHandler);
        });
    };

    CardGridInstance.prototype._handleCardClick = function(item, element, event) {
        // Handle selection if enabled
        if (this.options.selectable) {
            this._toggleSelection(item.id || item[this.options.idField]);
        }
        
        // Emit event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:card:click', {
                item: item,
                element: element,
                event: event,
                gridId: this.id
            });
        }
        
        // Callback
        if (typeof this.options.onCardClick === 'function') {
            this.options.onCardClick(item, element, event);
        }
    };

    // =========================================================================
    // CARD RENDERING
    // =========================================================================

    CardGridInstance.prototype._renderCards = function() {
        var self = this;
        
        // Get items to render
        var itemsToRender = this.filteredItems.length > 0 ? 
            this.filteredItems : this.items;
        
        if (itemsToRender.length === 0) {
            // Destroy virtualizer if active
            if (this.isVirtualized) {
                this._destroyVirtualizer();
            }
            this.els.grid.empty();
            this.els.cards.clear();
            this._renderEmpty();
            return;
        }
        
        // Hide empty state if showing
        if (this.els.emptyState) {
            if (this.els.emptyState.hide) {
                this.els.emptyState.hide();
            } else if (this.els.emptyState.el) {
                this.els.emptyState.classAdd('d-none');
            }
        }
        
        // Check if we should virtualize
        if (this._shouldVirtualize()) {
            // Initialize virtualization if needed
            if (!this.isVirtualized) {
                this._initVirtualization();
            }
            
            // Use virtualizer
            if (this._gridVirtualizer) {
                this._gridVirtualizer.setItems(itemsToRender);
            } else {
                this._gridVirtualizer = this._createGridVirtualizer();
            }
            
            return;
        }
        
        // Standard rendering for small datasets
        if (this.isVirtualized) {
            this._destroyVirtualizer();
        }
        
        // Clear existing cards
        this.els.grid.empty();
        this.els.cards.clear();
        
        // Render each card
        itemsToRender.forEach(function(item, index) {
            var card = self._renderCard(item, index);
            self.els.grid.append(card);
            
            var itemId = item.id || item[self.options.idField] || index;
            self.els.cards.set(String(itemId), card);
        });
        
        // Animate cards if enabled and Funky.Animate available
        if (this.options.animate && this.options.animate.cards && Funky.Animate) {
            var cardEls = this.els.grid.el.querySelectorAll('.funky-card-grid__card');
            if (cardEls.length > 0) {
                Funky.Animate.stagger(cardEls, {
                    class: 'fade-in-up',
                    stagger: this.options.animate.stagger || 50
                });
            }
        }
    };

    CardGridInstance.prototype._renderCard = function(item, index) {
        var self = this;
        var itemId = item.id || item[this.options.idField] || index;
        var itemIdStr = String(itemId);
        
        // Create card wrapper
        var card = D.div()
            .classAdd('funky-card-grid__card')
            .attr('role', 'gridcell')
            .attr('tabindex', '0')
            .attr('data-item-id', itemIdStr);
        
        // Check if selected
        if (this.selectedIds.has(itemIdStr)) {
            card.classAdd('funky-card-grid__card--selected');
            card.attr('aria-selected', 'true');
        }
        
        // Add checkbox for multi-select
        if (this.options.selectable === 'multi') {
            var checkboxPosition = this.options.checkboxPosition || 'top-left';
            var checkbox = D.div()
                .classAdd('funky-card-grid__card-checkbox')
                .classAdd('funky-card-grid__card-checkbox--' + checkboxPosition)
                .attr('role', 'checkbox')
                .attr('aria-checked', this.selectedIds.has(itemIdStr) ? 'true' : 'false');

            var checkIcon = D.span()
                .classAdd('funky-card-grid__card-checkbox-icon')
                .html('<i class="fas fa-check"></i>');

            checkbox.append(checkIcon);
            card.append(checkbox);
            
            // Checkbox click should toggle selection without triggering card click
            var checkboxHandler = function(e) {
                e.stopPropagation();
                self._toggleSelection(itemId, e);
            };
            checkbox.on('click', checkboxHandler);
        }
        
        // Custom render function
        if (typeof this.options.renderCard === 'function') {
            var content = this.options.renderCard(item, this.currentView);
            
            // Handle different return types
            if (content) {
                if (content.el) {
                    // Funky.Dom element
                    card.append(content);
                } else if (content instanceof HTMLElement) {
                    // Native DOM element
                    card.el.appendChild(content);
                } else if (typeof content === 'string') {
                    // HTML string - append to existing HTML (preserves checkbox)
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;
                    while (tempDiv.firstChild) {
                        card.el.appendChild(tempDiv.firstChild);
                    }
                }
            }
        } else {
            // Default card rendering
            card.append(this._renderDefaultCard(item));
        }
        
        return card;
    };

    CardGridInstance.prototype._renderDefaultCard = function(item) {
        var content = D.div().classAdd('funky-card-grid__card-content');
        
        // Try to display something useful
        if (item.title || item.name) {
            content.append(
                D.div()
                    .classAdd('funky-card-grid__card-title')
                    .text(item.title || item.name)
            );
        }
        
        if (item.description || item.subtitle) {
            content.append(
                D.div()
                    .classAdd('funky-card-grid__card-description')
                    .text(item.description || item.subtitle)
            );
        }
        
        if (item.image || item.thumbnail) {
            content.prepend(
                D.div()
                    .classAdd('funky-card-grid__card-image')
                    .style({
                        backgroundImage: 'url(' + (item.image || item.thumbnail) + ')'
                    })
            );
        }
        
        return content;
    };

    CardGridInstance.prototype._renderEmpty = function() {
        // Clear grid
        this.els.grid.empty();
        
        // Use Funky.EmptyState if available
        if (typeof Funky.EmptyState !== 'undefined' && Funky.EmptyState.create) {
            this.els.emptyState = Funky.EmptyState.create(this.els.grid.el, {
                preset: 'no-data',
                title: 'No items',
                message: 'There are no items to display.'
            });
        } else {
            this.els.emptyState = D.div()
                .classAdd('funky-card-grid__empty')
                .html('<p>No items to display</p>');
            this.els.grid.append(this.els.emptyState);
        }
    };

    // =========================================================================
    // VIRTUALIZATION (Phase 6)
    // =========================================================================

    /**
     * Check if virtualization should be enabled
     * @returns {boolean}
     */
    CardGridInstance.prototype._shouldVirtualize = function() {
        if (this.options.virtualize === false) return false;
        if (this.options.virtualize === true) return true;
        
        // 'auto' - virtualize if items exceed threshold
        var items = this.filteredItems.length > 0 ? this.filteredItems : this.items;
        return items.length > this.options.virtualizeThreshold;
    };

    /**
     * Initialize virtualization
     */
    CardGridInstance.prototype._initVirtualization = function() {
        if (!this._shouldVirtualize()) {
            // If was virtualized, clean up
            if (this.isVirtualized) {
                this._destroyVirtualizer();
            }
            return false;
        }
        
        this.isVirtualized = true;
        this.els.wrapper.classAdd('funky-card-grid--virtualized');
        
        // Build virtualized container
        this._buildVirtualContainer();
        
        return true;
    };

    /**
     * Build virtualized container structure
     */
    CardGridInstance.prototype._buildVirtualContainer = function() {
        var self = this;
        
        // Force full width on grid when virtualizing
        this.els.grid.style({
            display: 'block',
            width: '100%'
        });
        
        // Create container with fixed height and full width
        this.els.virtualContainer = D.div()
            .classAdd('funky-card-grid__virtual-container')
            .style({ 
                height: this.options.containerHeight,
                width: '100%'
            });
        
        // Replace grid content with virtual container
        this.els.grid.empty();
        this.els.grid.append(this.els.virtualContainer);
        
        // Measure row dimensions
        this._measureRowDimensions();
    };

    /**
     * Measure row dimensions for virtualization
     */
    CardGridInstance.prototype._measureRowDimensions = function() {
        if (typeof this.options.rowHeight === 'number') {
            this._rowHeight = this.options.rowHeight;
            return;
        }
        
        var items = this.filteredItems.length > 0 ? this.filteredItems : this.items;
        if (items.length === 0) {
            this._rowHeight = 200; // Default fallback
            return;
        }
        
        // Create temporary card to measure
        var tempCard = this._renderCard(items[0], 0);
        tempCard.style({ 
            position: 'absolute',
            visibility: 'hidden',
            width: this.options.cardMinWidth
        });
        
        this.els.grid.append(tempCard);
        
        // Measure height including gap
        var cardRect = tempCard.el.getBoundingClientRect();
        var computedStyle = getComputedStyle(this.els.grid.el);
        var gap = parseInt(computedStyle.gap) || parseInt(computedStyle.gridGap) || 16;
        
        this._rowHeight = cardRect.height + gap;
        this._cardWidth = cardRect.width + gap;
        
        tempCard.remove();
    };

    /**
     * Get current column count based on container width
     * @returns {number}
     */
    CardGridInstance.prototype._getColumnCount = function() {
        if (!this.els.grid || !this.els.grid.el) return 1;
        
        var containerWidth = this.els.grid.el.clientWidth;
        var cardMinWidth = parseInt(this.options.cardMinWidth) || 280;
        var gap = this._getGapValue();
        
        // Calculate how many cards fit
        var cols = Math.floor((containerWidth + gap) / (cardMinWidth + gap));
        return Math.max(1, cols);
    };

    /**
     * Get gap value in pixels
     * @returns {number}
     */
    CardGridInstance.prototype._getGapValue = function() {
        var gap = this.options.gap;
        if (typeof gap === 'number') return gap;
        
        // Map gap names to values
        var gapMap = {
            'xs': 4,
            'sm': 8,
            'md': 16,
            'lg': 24,
            'xl': 32
        };
        
        return gapMap[gap] || 16;
    };

    /**
     * Get gap as CSS value string
     * Uses pixel values for reliable inline style setting
     * @returns {string}
     */
    CardGridInstance.prototype._getGapCSSValue = function() {
        var gap = this.options.gap;
        if (typeof gap === 'number') return gap + 'px';

        // Map gap names to pixel values for inline styles
        // These match the --pro-space-* CSS variable defaults
        var gapMap = {
            'xs': '0.25rem',
            'sm': '0.5rem',
            'md': '1rem',
            'lg': '1.5rem',
            'xl': '2rem'
        };

        return gapMap[gap] || '1rem';
    };

    /**
     * Create grid virtualizer for DOM recycling
     * Renders only visible rows of cards
     */
    CardGridInstance.prototype._createGridVirtualizer = function() {
        var self = this;
        var container = this.els.virtualContainer.el;
        var items = this.filteredItems.length > 0 ? this.filteredItems : this.items;
        
        // State
        var scrollTop = 0;
        var viewportHeight = container.clientHeight;
        var columns = this._getColumnCount();
        var rowHeight = this._rowHeight;
        var overscan = this.options.overscan;
        
        // Calculate dimensions
        var totalRows = Math.ceil(items.length / columns);
        var totalHeight = totalRows * rowHeight;
        
        // Create spacer for scroll height
        var spacer = D.div()
            .classAdd('funky-card-grid__virtual-spacer')
            .style({ height: totalHeight + 'px' });
        
        // Create viewport for visible items
        var viewport = D.div()
            .classAdd('funky-card-grid__virtual-viewport');
        
        // Copy CSS variables to viewport for grid layout
        var minWidth = this.options.cardMinWidth;
        if (typeof minWidth === 'number') {
            minWidth = minWidth + 'px';
        }
        viewport.el.style.setProperty('--card-grid-min-width', minWidth || '280px');
        viewport.el.style.setProperty('--card-grid-gap', this._getGapCSSValue());
        
        spacer.append(viewport);
        container.innerHTML = '';
        container.appendChild(spacer.el);
        
        // Visible range tracking
        var renderedRange = { start: -1, end: -1 };
        
        // Recalculate columns dynamically in render
        function getColumns() {
            var containerWidth = container.clientWidth;
            var cardMinWidth = parseInt(self.options.cardMinWidth) || 280;
            var gapValue = self._getGapValue();
            var cols = Math.floor((containerWidth + gapValue) / (cardMinWidth + gapValue));
            return Math.max(1, cols);
        }
        
        // Render visible rows
        function render() {
            // Recalculate columns each render for accuracy
            columns = getColumns();
            totalRows = Math.ceil(items.length / columns);
            
            var firstVisibleRow = Math.floor(scrollTop / rowHeight);
            var lastVisibleRow = Math.ceil((scrollTop + viewportHeight) / rowHeight);
            
            // Add overscan
            firstVisibleRow = Math.max(0, firstVisibleRow - overscan);
            lastVisibleRow = Math.min(totalRows - 1, lastVisibleRow + overscan);
            
            // Calculate item indices
            var startIndex = firstVisibleRow * columns;
            var endIndex = Math.min(items.length, (lastVisibleRow + 1) * columns);
            
            // Check if range changed
            if (startIndex === renderedRange.start && endIndex === renderedRange.end) {
                return;
            }
            renderedRange = { start: startIndex, end: endIndex };
            
            // Position viewport
            viewport.style({
                transform: 'translateY(' + (firstVisibleRow * rowHeight) + 'px)'
            });
            
            // Clear card references
            self.els.cards.clear();
            
            // Clear and render visible items
            viewport.empty();
            
            for (var i = startIndex; i < endIndex; i++) {
                var card = self._renderCard(items[i], i);
                viewport.append(card);
                
                var itemId = String(items[i].id || items[i][self.options.idField] || i);
                self.els.cards.set(itemId, card);
            }
        }
        
        // Scroll handler with RAF
        var scrollRAF = null;
        var isScrolling = false;
        var scrollEndTimer = null;
        
        function onScroll() {
            scrollTop = container.scrollTop;
            
            // Mark as scrolling for CSS
            if (!isScrolling) {
                isScrolling = true;
                self.els.wrapper.classAdd('is-scrolling');
            }
            
            // Clear scroll end timer
            clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(function() {
                isScrolling = false;
                self.els.wrapper.classRemove('is-scrolling');
                self.els.wrapper.classRemove('is-fast-scrolling');
            }, 150);
            
            // Detect fast scrolling
            if (Math.abs(container.scrollTop - scrollTop) > 100) {
                self.els.wrapper.classAdd('is-fast-scrolling');
            }
            
            if (!scrollRAF) {
                scrollRAF = requestAnimationFrame(function() {
                    scrollRAF = null;
                    render();
                });
            }
        }
        
        container.addEventListener('scroll', onScroll, { passive: true });
        
        // Resize handler
        var resizeRAF = null;
        function onResize() {
            if (!resizeRAF) {
                resizeRAF = requestAnimationFrame(function() {
                    resizeRAF = null;
                    
                    var newColumns = self._getColumnCount();
                    if (newColumns !== columns) {
                        columns = newColumns;
                        totalRows = Math.ceil(items.length / columns);
                        totalHeight = totalRows * rowHeight;
                        spacer.style({ height: totalHeight + 'px' });
                        renderedRange = { start: -1, end: -1 };
                        render();
                    }
                    
                    viewportHeight = container.clientHeight;
                });
            }
        }
        
        window.addEventListener('resize', onResize);
        
        // Cleanup registration
        self._cleanupFns.push(function() {
            container.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            clearTimeout(scrollEndTimer);
            if (scrollRAF) cancelAnimationFrame(scrollRAF);
            if (resizeRAF) cancelAnimationFrame(resizeRAF);
        });
        
        // Initial render
        render();
        
        // Return controller
        return {
            refresh: function() {
                items = self.filteredItems.length > 0 ? self.filteredItems : self.items;
                columns = self._getColumnCount();
                totalRows = Math.ceil(items.length / columns);
                totalHeight = totalRows * rowHeight;
                spacer.style({ height: totalHeight + 'px' });
                renderedRange = { start: -1, end: -1 };
                render();
            },
            
            setItems: function(newItems) {
                items = newItems;
                this.refresh();
            },
            
            setColumns: function(newColumns) {
                columns = newColumns;
                this.refresh();
            },
            
            scrollToIndex: function(index) {
                var row = Math.floor(index / columns);
                container.scrollTop = row * rowHeight;
            },
            
            getContainer: function() {
                return container;
            },
            
            destroy: function() {
                container.innerHTML = '';
            }
        };
    };

    /**
     * Destroy virtualizer and cleanup
     */
    CardGridInstance.prototype._destroyVirtualizer = function() {
        if (this._gridVirtualizer) {
            this._gridVirtualizer.destroy();
            this._gridVirtualizer = null;
        }
        
        if (this.els.virtualContainer) {
            this.els.virtualContainer.remove();
            this.els.virtualContainer = null;
        }
        
        this.isVirtualized = false;
        this.els.wrapper.classRemove('funky-card-grid--virtualized');
    };

    /**
     * Scroll to item by ID
     * @param {string|number} id - Item ID
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.scrollToItem = function(id) {
        var idStr = String(id);
        var idField = this.options.idField;
        
        // Find item index
        var items = this.filteredItems.length > 0 ? this.filteredItems : this.items;
        var index = -1;
        
        for (var i = 0; i < items.length; i++) {
            var itemId = String(items[i].id || items[i][idField] || i);
            if (itemId === idStr) {
                index = i;
                break;
            }
        }
        
        if (index === -1) return this;
        
        if (this._gridVirtualizer) {
            // Virtualized - scroll to index
            this._gridVirtualizer.scrollToIndex(index);
        } else {
            // Standard - scroll card into view
            var card = this.els.cards.get(idStr);
            if (card && card.el) {
                card.el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
        
        return this;
    };

    // =========================================================================
    // DATA MANAGEMENT
    // =========================================================================

    /**
     * Set items (replaces all)
     * @param {Array} items - Array of item objects
     */
    CardGridInstance.prototype.setItems = function(items) {
        this.items = items || [];
        this.filteredItems = [];
        this.currentPage = 1;
        
        // Apply current filters/sort if any
        if (this.currentSearch) {
            this._applySearch();
        } else if (this.currentSort) {
            this._applySort();
        }
        
        this._renderCards();
        
        // Emit load event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:load', {
                items: this.items,
                page: 1,
                gridId: this.id
            });
        }
        
        if (typeof this.options.onLoad === 'function') {
            this.options.onLoad(this.items, 1);
        }
        
        return this;
    };

    /**
     * Add items (appends)
     * @param {Array} items - Array of item objects
     */
    CardGridInstance.prototype.addItems = function(items) {
        if (!items || !items.length) return this;
        
        this.items = this.items.concat(items);
        
        // Re-apply filters
        if (this.currentSearch) {
            this._applySearch();
        } else if (this.currentSort) {
            this._applySort();
        }
        
        this._renderCards();
        return this;
    };

    /**
     * Remove item by ID
     * @param {string|number} id - Item ID
     */
    CardGridInstance.prototype.removeItem = function(id) {
        var idStr = String(id);
        var idField = this.options.idField;
        
        this.items = this.items.filter(function(item) {
            var itemId = item.id || item[idField];
            return String(itemId) !== idStr;
        });
        
        this.filteredItems = this.filteredItems.filter(function(item) {
            var itemId = item.id || item[idField];
            return String(itemId) !== idStr;
        });
        
        // Remove from selection
        this.selectedIds.delete(idStr);
        
        this._renderCards();
        return this;
    };

    /**
     * Get all items
     * @returns {Array}
     */
    CardGridInstance.prototype.getItems = function() {
        return this.items.slice();
    };

    /**
     * Get item by ID (internal)
     * @param {string|number} id
     * @returns {Object|null}
     */
    CardGridInstance.prototype._getItemById = function(id) {
        var idStr = String(id);
        var idField = this.options.idField;

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            var itemId = item.id || item[idField];
            if (String(itemId) === idStr) {
                return item;
            }
        }
        return null;
    };

    /**
     * Get item by ID (public)
     * @param {string|number} id
     * @returns {Object|null}
     */
    CardGridInstance.prototype.getItem = function(id) {
        return this._getItemById(id);
    };

    /**
     * Update an item by ID
     * @param {string|number} id - Item ID
     * @param {Object} updates - Properties to update
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.updateItem = function(id, updates) {
        var idStr = String(id);
        var idField = this.options.idField;

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            var itemId = item.id || item[idField];
            if (String(itemId) === idStr) {
                // Merge updates into item
                Object.assign(this.items[i], updates);
                // Re-render the card
                this._renderCards();
                break;
            }
        }

        return this;
    };

    // =========================================================================
    // LAYOUT METHODS (Phase 2)
    // =========================================================================

    /**
     * Set the view mode
     * @param {string} view - 'grid' or 'list'
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.setView = function(view) {
        if (view !== 'grid' && view !== 'list') {
            console.warn('[Funky.CardGrid] Invalid view:', view);
            return this;
        }
        
        var oldView = this.currentView;
        this.currentView = view;
        
        // Update grid class
        this.els.grid
            .classRemove('funky-card-grid__grid--' + oldView)
            .classAdd('funky-card-grid__grid--' + view);
        
        // Re-render cards if renderCard is view-aware
        if (typeof this.options.renderCard === 'function') {
            this._renderCards();
        }
        
        // Emit event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:view:change', {
                view: view,
                previousView: oldView,
                gridId: this.id
            });
        }
        
        // Callback
        if (typeof this.options.onViewChange === 'function') {
            this.options.onViewChange(view);
        }
        
        return this;
    };

    /**
     * Get current view mode
     * @returns {string}
     */
    CardGridInstance.prototype.getView = function() {
        return this.currentView;
    };

    /**
     * Set responsive column configuration
     * @param {number|string|Object} columns - Column config
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.setColumns = function(columns) {
        this.options.columns = columns;
        this._applyColumnConfig();
        return this;
    };

    /**
     * Apply column configuration to CSS
     */
    CardGridInstance.prototype._applyColumnConfig = function() {
        var columns = this.options.columns;
        var gridEl = this.els.grid.el;
        
        // Always ensure grid display and width are set
        this.els.grid.style({
            display: 'grid',
            width: '100%'
        });
        
        // Set min-width variable on grid element
        var minWidth = this.options.cardMinWidth;
        if (typeof minWidth === 'number') {
            minWidth = minWidth + 'px';
        }
        gridEl.style.setProperty('--card-grid-min-width', minWidth || '280px');
        
        if (typeof columns === 'number') {
            // Fixed number of columns
            gridEl.style.setProperty('--card-grid-columns', columns);
            this.els.grid.style({
                gridTemplateColumns: 'repeat(' + columns + ', 1fr)'
            });
        } else if (columns === 'auto') {
            // Auto-fill based on min-width
            gridEl.style.setProperty('--card-grid-columns', 'auto-fill');
            this.els.grid.style({
                gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-grid-min-width), 1fr))'
            });
        } else if (typeof columns === 'object' && columns !== null) {
            // Responsive breakpoints - apply via data attributes
            this._applyResponsiveColumns(columns);
        }
    };

    /**
     * Apply responsive column configuration
     * @param {Object} breakpoints - { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }
     */
    CardGridInstance.prototype._applyResponsiveColumns = function(breakpoints) {
        var gridEl = this.els.grid.el;
        var self = this;
        
        // Store breakpoints as data attributes
        Object.keys(breakpoints).forEach(function(bp) {
            gridEl.setAttribute('data-columns-' + bp, breakpoints[bp]);
        });
        
        // Apply current breakpoint
        this._updateColumnsForBreakpoint();
        
        // Listen for resize if not already
        if (!this._resizeHandler) {
            this._resizeHandler = function() {
                self._updateColumnsForBreakpoint();
            };
            window.addEventListener('resize', this._resizeHandler);
            this._cleanupFns.push(function() {
                window.removeEventListener('resize', self._resizeHandler);
            });
        }
    };

    /**
     * Update columns based on current viewport width
     */
    CardGridInstance.prototype._updateColumnsForBreakpoint = function() {
        var width = window.innerWidth;
        var breakpoints = this.options.columns;
        var columns;
        
        // Determine breakpoint (Bootstrap-style breakpoints)
        if (width < 576 && breakpoints.xs !== undefined) {
            columns = breakpoints.xs;
        } else if (width < 768 && breakpoints.sm !== undefined) {
            columns = breakpoints.sm;
        } else if (width < 992 && breakpoints.md !== undefined) {
            columns = breakpoints.md;
        } else if (width < 1200 && breakpoints.lg !== undefined) {
            columns = breakpoints.lg;
        } else if (breakpoints.xl !== undefined) {
            columns = breakpoints.xl;
        } else {
            // Fallback to largest defined
            columns = breakpoints.xl || breakpoints.lg || breakpoints.md || 
                      breakpoints.sm || breakpoints.xs || 4;
        }
        
        this.els.grid.style({
            gridTemplateColumns: 'repeat(' + columns + ', 1fr)'
        });
    };

    /**
     * Set gap size
     * @param {string|number} gap - 'xs', 'sm', 'md', 'lg', 'xl', or pixel value
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.setGap = function(gap) {
        this.options.gap = gap;

        // Use the centralized gap CSS value method
        var gapValue = this._getGapCSSValue();

        // Set on wrapper for CSS variable inheritance
        this.els.wrapper.el.style.setProperty('--card-grid-gap', gapValue);
        // Also set directly on grid for immediate effect
        this.els.grid.el.style.setProperty('--card-grid-gap', gapValue);
        return this;
    };

    /**
     * Set minimum card width
     * @param {string|number} minWidth - CSS value or pixel number
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.setCardMinWidth = function(minWidth) {
        this.options.cardMinWidth = minWidth;
        
        var value = typeof minWidth === 'number' ? minWidth + 'px' : minWidth;
        this.els.wrapper.el.style.setProperty('--card-grid-min-width', value);
        
        // Re-apply column config
        this._applyColumnConfig();
        return this;
    };

    // =========================================================================
    // SELECTION & INTERACTION (Phase 5)
    // =========================================================================

    /**
     * Initialize selection functionality
     */
    CardGridInstance.prototype._initSelection = function() {
        if (!this.options.selectable) return;
        
        // Add selectable class
        this.els.wrapper.classAdd('funky-card-grid--selectable');
        
        // Build selection bar for multi-select
        if (this.options.selectable === 'multi') {
            this._buildSelectionBar();
        }
        
        // Bind keyboard events
        this._bindKeyboardNavigation();
    };

    /**
     * Build selection bar (for multi-select)
     */
    CardGridInstance.prototype._buildSelectionBar = function() {
        var self = this;
        
        this.els.selectionBar = D.div()
            .classAdd('funky-card-grid__selection-bar')
            .attr('role', 'status')
            .attr('aria-live', 'polite');
        
        this.els.selectionCount = D.span()
            .classAdd('funky-card-grid__selection-count');
        
        var actionsWrapper = D.div()
            .classAdd('funky-card-grid__selection-actions');
        
        // Select all button
        var selectAllBtn = D.button()
            .classAdd('funky-card-grid__selection-btn')
            .attr('type', 'button')
            .text('Select All');
        
        var selectAllHandler = function() {
            self.selectAll();
        };
        selectAllBtn.on('click', selectAllHandler);
        
        // Clear selection button
        var clearBtn = D.button()
            .classAdd('funky-card-grid__selection-btn')
            .attr('type', 'button')
            .text('Clear');
        
        var clearHandler = function() {
            self.clearSelection();
        };
        clearBtn.on('click', clearHandler);
        
        actionsWrapper.append(selectAllBtn, clearBtn);
        this.els.selectionBar.append(this.els.selectionCount, actionsWrapper);
        
        // Insert at top of wrapper
        this.els.wrapper.prepend(this.els.selectionBar);
        
        this._cleanupFns.push(function() {
            selectAllBtn.off('click', selectAllHandler);
            clearBtn.off('click', clearHandler);
        });
    };

    /**
     * Update selection bar
     */
    CardGridInstance.prototype._updateSelectionBar = function() {
        if (!this.els.selectionBar) return;
        
        var count = this.selectedIds.size;
        
        if (count > 0) {
            this.els.wrapper.classAdd('funky-card-grid--has-selection');
            this.els.selectionCount.text(count + ' selected');
        } else {
            this.els.wrapper.classRemove('funky-card-grid--has-selection');
        }
    };

    /**
     * Toggle selection for an item
     * @param {string|number} id - Item ID
     * @param {Event} event - Original event (for shift-click detection)
     */
    CardGridInstance.prototype._toggleSelection = function(id, event) {
        var idStr = String(id);
        
        if (this.options.selectable === 'single') {
            // Single select - clear others first
            if (this.selectedIds.has(idStr)) {
                this.selectedIds.delete(idStr);
            } else {
                this.selectedIds.clear();
                this.selectedIds.add(idStr);
            }
        } else if (this.options.selectable === 'multi') {
            // Multi select
            if (event && event.shiftKey && this._lastSelectedId) {
                // Range select
                this._selectRange(this._lastSelectedId, idStr);
            } else if (this.selectedIds.has(idStr)) {
                this.selectedIds.delete(idStr);
            } else {
                this.selectedIds.add(idStr);
            }
            
            this._lastSelectedId = idStr;
        }
        
        this._updateCardSelection();
        this._updateSelectionBar();
        this._emitSelectionChange();
    };

    /**
     * Select range of items (shift+click)
     */
    CardGridInstance.prototype._selectRange = function(fromId, toId) {
        var items = this.filteredItems.length > 0 ? this.filteredItems : this.items;
        var idField = this.options.idField;
        
        var fromIndex = -1;
        var toIndex = -1;
        
        for (var i = 0; i < items.length; i++) {
            var itemId = String(items[i].id || items[i][idField]);
            if (itemId === fromId) fromIndex = i;
            if (itemId === toId) toIndex = i;
        }
        
        if (fromIndex === -1 || toIndex === -1) return;
        
        var start = Math.min(fromIndex, toIndex);
        var end = Math.max(fromIndex, toIndex);
        
        for (var j = start; j <= end; j++) {
            var rangeItemId = String(items[j].id || items[j][idField]);
            this.selectedIds.add(rangeItemId);
        }
    };

    /**
     * Update card DOM elements to reflect selection state
     */
    CardGridInstance.prototype._updateCardSelection = function() {
        var self = this;
        
        this.els.cards.forEach(function(cardEl, id) {
            var isSelected = self.selectedIds.has(id);
            
            cardEl.classToggle('funky-card-grid__card--selected', isSelected);
            cardEl.attr('aria-selected', isSelected ? 'true' : 'false');
            
            // Update checkbox if present
            var checkbox = cardEl.el.querySelector('.funky-card-grid__card-checkbox');
            if (checkbox) {
                checkbox.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            }
        });
    };

    /**
     * Emit selection change event
     */
    CardGridInstance.prototype._emitSelectionChange = function() {
        var selectedItems = this.getSelected();
        var count = selectedItems.length;
        
        // Screen reader announcement
        if (this.options.announce !== false && typeof Funky.Announce !== 'undefined') {
            if (count === 0) {
                Funky.Announce.polite('Selection cleared');
            } else if (count === 1) {
                var item = selectedItems[0];
                var name = item.name || item.title || 'Item';
                Funky.Announce.polite(name + ' selected');
            } else {
                Funky.Announce.polite(count + ' items selected');
            }
        }
        
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:select', {
                items: selectedItems,
                ids: Array.from(this.selectedIds),
                gridId: this.id
            });
        }
        
        if (typeof this.options.onSelect === 'function') {
            this.options.onSelect(selectedItems);
        }
    };

    /**
     * Select item by ID
     * @param {string|number} id - Item ID
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.select = function(id) {
        var idStr = String(id);
        
        if (this.options.selectable === 'single') {
            this.selectedIds.clear();
        }
        
        this.selectedIds.add(idStr);
        this._updateCardSelection();
        this._updateSelectionBar();
        this._emitSelectionChange();
        
        return this;
    };

    /**
     * Select all items
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.selectAll = function() {
        if (this.options.selectable !== 'multi') return this;
        
        var self = this;
        var items = this.filteredItems.length > 0 ? this.filteredItems : this.items;
        var idField = this.options.idField;
        
        items.forEach(function(item) {
            var id = String(item.id || item[idField]);
            self.selectedIds.add(id);
        });
        
        this._updateCardSelection();
        this._updateSelectionBar();
        this._emitSelectionChange();
        
        return this;
    };

    /**
     * Deselect item by ID
     * @param {string|number} id - Item ID
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.deselect = function(id) {
        this.selectedIds.delete(String(id));
        this._updateCardSelection();
        this._updateSelectionBar();
        this._emitSelectionChange();
        
        return this;
    };

    /**
     * Clear all selections
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.clearSelection = function() {
        this.selectedIds.clear();
        this._updateCardSelection();
        this._updateSelectionBar();
        this._emitSelectionChange();
        
        return this;
    };

    /**
     * Get selected items
     * @returns {Array}
     */
    CardGridInstance.prototype.getSelected = function() {
        var self = this;
        var selected = [];
        var idField = this.options.idField;
        
        this.items.forEach(function(item) {
            var id = String(item.id || item[idField]);
            if (self.selectedIds.has(id)) {
                selected.push(item);
            }
        });
        
        return selected;
    };

    // =========================================================================
    // KEYBOARD NAVIGATION (Phase 5)
    // =========================================================================

    /**
     * Bind keyboard navigation
     */
    CardGridInstance.prototype._bindKeyboardNavigation = function() {
        var self = this;

        // Guard against null grid element
        if (!this.els.grid || !this.els.grid.el) {
            return;
        }

        var keyHandler = function(e) {
            // Only handle if focus is within grid
            if (!self.els.grid || !self.els.grid.el || !self.els.grid.el.contains(document.activeElement)) return;
            
            var handled = false;
            
            switch (e.key) {
                case 'ArrowRight':
                    self._moveFocus(1, 0);
                    handled = true;
                    break;
                case 'ArrowLeft':
                    self._moveFocus(-1, 0);
                    handled = true;
                    break;
                case 'ArrowDown':
                    self._moveFocus(0, 1);
                    handled = true;
                    break;
                case 'ArrowUp':
                    self._moveFocus(0, -1);
                    handled = true;
                    break;
                case 'Home':
                    self._focusFirst();
                    handled = true;
                    break;
                case 'End':
                    self._focusLast();
                    handled = true;
                    break;
                case 'Enter':
                case ' ':
                    self._activateFocused(e);
                    handled = true;
                    break;
                case 'Escape':
                    if (self.selectedIds.size > 0) {
                        self.clearSelection();
                        handled = true;
                    }
                    break;
                case 'a':
                    if ((e.ctrlKey || e.metaKey) && self.options.selectable === 'multi') {
                        e.preventDefault();
                        self.selectAll();
                        handled = true;
                    }
                    break;
            }
            
            if (handled) {
                e.preventDefault();
            }
        };
        
        this.els.grid.on('keydown', keyHandler);
        this._cleanupFns.push(function() {
            self.els.grid.off('keydown', keyHandler);
        });
    };

    /**
     * Get current focused card index
     */
    CardGridInstance.prototype._getFocusedIndex = function() {
        var focused = document.activeElement;
        if (!focused || !focused.classList.contains('funky-card-grid__card')) {
            return -1;
        }

        // Guard against null grid element
        if (!this.els.grid || !this.els.grid.el) {
            return -1;
        }

        var cards = this.els.grid.el.querySelectorAll('.funky-card-grid__card');
        for (var i = 0; i < cards.length; i++) {
            if (cards[i] === focused) return i;
        }

        return -1;
    };

    /**
     * Get number of columns in current layout
     */
    CardGridInstance.prototype._getColumnCount = function() {
        // Guard against null grid element
        if (!this.els.grid || !this.els.grid.el) {
            return 1;
        }

        var grid = this.els.grid.el;
        var cards = grid.querySelectorAll('.funky-card-grid__card');

        if (cards.length === 0) return 1;
        if (this.currentView === 'list') return 1;
        
        // Calculate from first row
        var firstRowTop = cards[0].offsetTop;
        var columnsInFirstRow = 0;
        
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].offsetTop === firstRowTop) {
                columnsInFirstRow++;
            } else {
                break;
            }
        }
        
        return columnsInFirstRow || 1;
    };

    /**
     * Move focus in grid
     * @param {number} dx - Horizontal direction (-1, 0, 1)
     * @param {number} dy - Vertical direction (-1, 0, 1)
     */
    CardGridInstance.prototype._moveFocus = function(dx, dy) {
        // Guard against null grid element
        if (!this.els.grid || !this.els.grid.el) {
            return;
        }

        var currentIndex = this._getFocusedIndex();
        var cards = this.els.grid.el.querySelectorAll('.funky-card-grid__card');
        var total = cards.length;

        if (total === 0) return;
        
        // If no card focused, focus first
        if (currentIndex === -1) {
            this._focusCard(0);
            return;
        }
        
        var columns = this._getColumnCount();
        var newIndex;
        
        if (dx !== 0) {
            // Horizontal movement
            newIndex = currentIndex + dx;
        } else if (dy !== 0) {
            // Vertical movement
            newIndex = currentIndex + (dy * columns);
        }
        
        // Clamp to valid range
        if (newIndex >= 0 && newIndex < total) {
            this._focusCard(newIndex);
        }
    };

    /**
     * Focus card at index
     */
    CardGridInstance.prototype._focusCard = function(index) {
        // Guard against null grid element
        if (!this.els.grid || !this.els.grid.el) {
            return;
        }

        var cards = this.els.grid.el.querySelectorAll('.funky-card-grid__card');

        if (index >= 0 && index < cards.length) {
            cards[index].focus();
            
            // Scroll into view if needed
            cards[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    };

    /**
     * Focus first card
     */
    CardGridInstance.prototype._focusFirst = function() {
        this._focusCard(0);
    };

    /**
     * Focus last card
     */
    CardGridInstance.prototype._focusLast = function() {
        var cards = this.els.grid.el.querySelectorAll('.funky-card-grid__card');
        this._focusCard(cards.length - 1);
    };

    /**
     * Activate (click/select) the focused card
     */
    CardGridInstance.prototype._activateFocused = function(event) {
        var focused = document.activeElement;
        if (!focused || !focused.classList.contains('funky-card-grid__card')) return;
        
        var itemId = focused.getAttribute('data-item-id');
        var item = this._getItemById(itemId);
        
        if (item) {
            this._handleCardClick(item, focused, event);
        }
    };

    // =========================================================================
    // ACTIONBAR INTEGRATION (Phase 3)
    // =========================================================================

    /**
     * Bind to ActionBar
     */
    CardGridInstance.prototype._bindActionBar = function() {
        var self = this;
        
        // Find ActionBar that targets this CardGrid
        var containerId = this.container.attr('id');
        var actionBarEl = null;
        
        console.log('[CardGrid._bindActionBar] containerId:', containerId);
        
        if (containerId) {
            actionBarEl = D.one('[data-card-grid-id="' + containerId + '"]');
            console.log('[CardGrid._bindActionBar] Found by containerId:', !!actionBarEl);
        }
        if (!actionBarEl) {
            actionBarEl = D.one('[data-card-grid-id="' + this.id + '"]');
            console.log('[CardGrid._bindActionBar] Found by id:', !!actionBarEl);
        }
        
        if (!actionBarEl || !actionBarEl.el) {
            // No ActionBar connected - that's fine, it's optional
            console.log('[CardGrid._bindActionBar] No ActionBar found');
            return;
        }

        this.els.actionBar = actionBarEl;

        // Get count display element
        var countEl = actionBarEl.el.querySelector('[data-role="count"]');
        this.els.countDisplay = countEl ? D.wrap(countEl) : null;
        
        // Bind search input
        var searchEl = actionBarEl.el.querySelector('[data-action="search"]');
        console.log('[CardGrid._bindActionBar] searchEl:', !!searchEl);
        if (searchEl) {
            this._bindSearchInput(D.wrap(searchEl));
        }
        
        // Bind sort select
        var sortEl = actionBarEl.el.querySelector('[data-action="sort"]');
        if (sortEl) {
            this._bindSortSelect(D.wrap(sortEl));
        }
        
        // Bind sort direction
        var sortDirEl = actionBarEl.el.querySelector('[data-action="sort-direction"]');
        if (sortDirEl) {
            this._bindSortDirection(D.wrap(sortDirEl));
            this.els.sortDirection = D.wrap(sortDirEl);
        }
        
        // Bind view toggle buttons
        var viewBtns = actionBarEl.el.querySelectorAll('[data-action="view"]');
        if (viewBtns.length > 0) {
            this._bindViewToggle(viewBtns);
        }
        
        // Listen for ActionBar events
        this._bindActionBarEvents();
    };

    /**
     * Bind search input
     */
    CardGridInstance.prototype._bindSearchInput = function(input) {
        var self = this;
        var searchTimeout;
        
        var inputHandler = function(e) {
            console.log('[CardGrid._bindSearchInput] input event, value:', e.target.value);
            clearTimeout(searchTimeout);
            var query = e.target.value;
            
            searchTimeout = setTimeout(function() {
                console.log('[CardGrid._bindSearchInput] calling search:', query);
                self.search(query);
            }, 300);
        };
        
        var keydownHandler = function(e) {
            if (e.key === 'Escape') {
                input.el.value = '';
                self.search('');
            }
        };
        
        input.on('input', inputHandler);
        input.on('keydown', keydownHandler);
        
        this.els.searchInput = input;
        
        this._cleanupFns.push(function() {
            clearTimeout(searchTimeout);
            input.off('input', inputHandler);
            input.off('keydown', keydownHandler);
        });
    };

    /**
     * Bind sort select
     */
    CardGridInstance.prototype._bindSortSelect = function(select) {
        var self = this;
        
        var changeHandler = function(e) {
            self.sort(e.target.value, self.currentSortDirection);
        };
        
        select.on('change', changeHandler);
        this.els.sortSelect = select;
        
        this._cleanupFns.push(function() {
            select.off('change', changeHandler);
        });
    };

    /**
     * Bind sort direction toggle
     */
    CardGridInstance.prototype._bindSortDirection = function(btn) {
        var self = this;
        
        var clickHandler = function() {
            var newDirection = self.currentSortDirection === 'asc' ? 'desc' : 'asc';
            self.sort(self.currentSort || self._getFirstSortField(), newDirection);
        };
        
        btn.on('click', clickHandler);
        
        this._cleanupFns.push(function() {
            btn.off('click', clickHandler);
        });
    };

    /**
     * Get first sort field from select
     */
    CardGridInstance.prototype._getFirstSortField = function() {
        if (this.els.sortSelect) {
            return this.els.sortSelect.el.value;
        }
        return null;
    };

    /**
     * Bind view toggle buttons
     */
    CardGridInstance.prototype._bindViewToggle = function(btns) {
        var self = this;
        var btnArray = Array.prototype.slice.call(btns);
        this.els.viewBtns = btnArray;
        
        btnArray.forEach(function(btnEl) {
            var btn = D.wrap(btnEl);
            var clickHandler = function() {
                var view = btn.attr('data-view');
                self.setView(view);
                self._updateViewToggleUI();
            };
            
            btn.on('click', clickHandler);
            
            self._cleanupFns.push(function() {
                btn.off('click', clickHandler);
            });
        });
    };

    /**
     * Update view toggle button states
     */
    CardGridInstance.prototype._updateViewToggleUI = function() {
        if (!this.els.viewBtns) return;
        
        var self = this;
        this.els.viewBtns.forEach(function(btnEl) {
            var btn = D.wrap(btnEl);
            var isActive = btn.attr('data-view') === self.currentView;
            btn.classToggle('funky-card-grid__view-btn--active', isActive)
               .classToggle('active', isActive)
               .attr('aria-checked', isActive ? 'true' : 'false');
        });
    };

    /**
     * Listen for ActionBar events
     */
    CardGridInstance.prototype._bindActionBarEvents = function() {
        var self = this;
        
        // Listen for filter toggle from ActionBar
        var filterHandler = function(e) {
            if (!self.els.actionBar) return;
            
            // Check if this event is for our ActionBar
            var detail = e.detail || {};
            if (detail.entity && detail.entity !== self.options.entity) return;
            
            // Filter panel toggled - could integrate with FilterToolbar
            self._onFilterToggle(detail.visible);
        };
        
        document.addEventListener('funky.action-bar.filter-toggle', filterHandler);
        
        this._cleanupFns.push(function() {
            document.removeEventListener('funky.action-bar.filter-toggle', filterHandler);
        });
    };

    /**
     * Handle filter panel toggle
     */
    CardGridInstance.prototype._onFilterToggle = function(visible) {
        // Placeholder for FilterToolbar integration
        // Could show/hide advanced filters panel
    };

    /**
     * Update sort direction icon
     */
    CardGridInstance.prototype._updateSortDirectionIcon = function() {
        if (!this.els.sortDirection) return;
        
        var icon = this.currentSortDirection === 'asc' 
            ? 'fa-arrow-up-short-wide' 
            : 'fa-arrow-down-short-wide';
        
        this.els.sortDirection.html('<i class="fas ' + icon + '"></i>');
        this.els.sortDirection.attr('aria-label', 
            'Sort ' + (this.currentSortDirection === 'asc' ? 'ascending' : 'descending') + 
            ', click to reverse');
    };

    /**
     * Update item count display (with screen reader announcement)
     */
    CardGridInstance.prototype._updateCountDisplay = function() {
        if (!this.els.countDisplay) return;
        
        var showing = this.filteredItems.length > 0 ? 
            this.filteredItems.length : this.items.length;
        var total = this.items.length;
        var message;
        
        if (this.currentSearch && showing !== total) {
            message = 'Showing ' + showing + ' of ' + total;
            this.els.countDisplay.text(message);
            
            // Screen reader announcement for search results
            if (this.options.announce !== false && typeof Funky.Announce !== 'undefined') {
                if (showing === 0) {
                    Funky.Announce.polite('No results found for "' + this.currentSearch + '"');
                } else {
                    Funky.Announce.polite(showing + ' result' + (showing !== 1 ? 's' : '') + ' found');
                }
            }
        } else {
            message = total + ' item' + (total !== 1 ? 's' : '');
            this.els.countDisplay.text(message);
        }
    };

    // =========================================================================
    // SEARCH & FILTER METHODS (Phase 3)
    // =========================================================================

    /**
     * Search/filter items
     * @param {string} query - Search query
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.search = function(query) {
        console.log('[CardGrid.search] query:', query, 'items:', this.items.length);
        this.currentSearch = query;
        
        if (!query || query.trim() === '') {
            this.filteredItems = [];
            this._renderCards();
            this._updateCountDisplay();
            
            // Emit event
            if (typeof Funky.PubSub !== 'undefined') {
                Funky.PubSub.emit('funky:card-grid:search', {
                    query: '',
                    results: this.items,
                    gridId: this.id
                });
            }
            
            if (typeof this.options.onSearch === 'function') {
                this.options.onSearch('', this.items);
            }
            
            return this;
        }
        
        this._applySearch();
        console.log('[CardGrid.search] after _applySearch, filteredItems:', this.filteredItems.length);
        this._renderCards();
        this._updateCountDisplay();
        
        // Emit event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:search', {
                query: query,
                results: this.filteredItems,
                gridId: this.id
            });
        }
        
        if (typeof this.options.onSearch === 'function') {
            this.options.onSearch(query, this.filteredItems);
        }
        
        return this;
    };

    /**
     * Apply search filter to items
     */
    CardGridInstance.prototype._applySearch = function() {
        var self = this;
        var query = this.currentSearch.toLowerCase().trim();
        
        if (!query) {
            this.filteredItems = [];
            return;
        }
        
        var searchFields = this.options.searchFields || ['title', 'name', 'description'];
        console.log('[CardGrid._applySearch] searchFields:', searchFields, 'items[0]:', this.items[0]);
        
        // Use FuzzySearch if available
        if (typeof Funky.FuzzySearch !== 'undefined') {
            console.log('[CardGrid._applySearch] Using FuzzySearch');
            // Note: FuzzySearch API is search(query, items, opts)
            var fuzzyResults = Funky.FuzzySearch.search(query, this.items, {
                keys: searchFields,
                threshold: 0.3
            });
            console.log('[CardGrid._applySearch] FuzzySearch results:', fuzzyResults.length);
            
            this.filteredItems = fuzzyResults.map(function(result) {
                return result.item;
            });
        } else {
            console.log('[CardGrid._applySearch] Using fallback search');
            // Fallback to basic includes search
            this.filteredItems = this.items.filter(function(item) {
                for (var i = 0; i < searchFields.length; i++) {
                    var field = searchFields[i];
                    var value = item[field];
                    
                    if (value && String(value).toLowerCase().indexOf(query) !== -1) {
                        return true;
                    }
                }
                return false;
            });
        }
    };

    /**
     * Apply custom filter function
     * @param {Function} fn - Filter function (item) => boolean
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.filter = function(fn) {
        if (typeof fn !== 'function') {
            console.warn('[Funky.CardGrid] filter() requires a function');
            return this;
        }
        
        this.filteredItems = this.items.filter(fn);
        this._renderCards();
        this._updateCountDisplay();
        
        return this;
    };

    /**
     * Clear all filters and search
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.clearFilters = function() {
        this.currentSearch = '';
        this.filteredItems = [];
        
        if (this.els.searchInput) {
            this.els.searchInput.el.value = '';
        }
        
        this._renderCards();
        this._updateCountDisplay();
        
        return this;
    };

    // =========================================================================
    // SORT METHODS (Phase 3)
    // =========================================================================

    /**
     * Sort items
     * @param {string} field - Field to sort by
     * @param {string} direction - 'asc' or 'desc'
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.sort = function(field, direction) {
        if (!field) return this;
        
        this.currentSort = field;
        this.currentSortDirection = direction || 'asc';
        
        this._applySort();
        this._updateSortDirectionIcon();
        this._renderCards();
        
        // Emit event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:sort', {
                field: field,
                direction: this.currentSortDirection,
                gridId: this.id
            });
        }
        
        if (typeof this.options.onSort === 'function') {
            this.options.onSort(field, this.currentSortDirection);
        }
        
        return this;
    };

    /**
     * Apply sort to items
     */
    CardGridInstance.prototype._applySort = function() {
        if (!this.currentSort) return;
        
        var field = this.currentSort;
        var direction = this.currentSortDirection;
        var multiplier = direction === 'asc' ? 1 : -1;
        
        // Sort the appropriate array
        var arrayToSort = this.filteredItems.length > 0 ? this.filteredItems : this.items;
        
        arrayToSort.sort(function(a, b) {
            var aVal = a[field];
            var bVal = b[field];
            
            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1 * multiplier;
            if (bVal == null) return -1 * multiplier;
            
            // Numeric comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return (aVal - bVal) * multiplier;
            }
            
            // Date comparison
            if (aVal instanceof Date && bVal instanceof Date) {
                return (aVal.getTime() - bVal.getTime()) * multiplier;
            }
            
            // String comparison (case-insensitive)
            var aStr = String(aVal).toLowerCase();
            var bStr = String(bVal).toLowerCase();
            
            if (aStr < bStr) return -1 * multiplier;
            if (aStr > bStr) return 1 * multiplier;
            return 0;
        });
    };

    // =========================================================================
    // DATA LOADING (Phase 4)
    // =========================================================================

    /**
     * Load data from URL
     * @param {number} page - Page number (default: 1)
     */
    CardGridInstance.prototype._loadFromUrl = function(page) {
        var self = this;
        page = page || 1;
        
        if (this.isLoading) return;
        this.isLoading = true;
        
        // Show loading state
        this._showLoading();
        
        // Build URL with pagination params
        var url = this.options.url;
        var separator = url.indexOf('?') === -1 ? '?' : '&';
        url += separator + 'page=' + page + '&limit=' + this.options.pageSize;
        
        // Add search param if searching
        if (this.currentSearch) {
            url += '&search=' + encodeURIComponent(this.currentSearch);
        }
        
        // Add sort params if sorting
        if (this.currentSort) {
            url += '&sort=' + encodeURIComponent(this.currentSort);
            url += '&order=' + this.currentSortDirection;
        }
        
        // Fetch data
        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            self.isLoading = false;
            self._hideLoading();
            self._handleLoadSuccess(data, page);
        })
        .catch(function(error) {
            self.isLoading = false;
            self._hideLoading();
            self._handleLoadError(error);
        });
    };

    /**
     * Handle successful data load
     */
    CardGridInstance.prototype._handleLoadSuccess = function(data, page) {
        // Support different response formats
        var items = Array.isArray(data) ? data : (data.items || data.data || data.results || []);
        var total = data.total || data.totalCount || items.length;
        var hasMore = data.hasMore !== undefined ? data.hasMore : 
            (page * this.options.pageSize < total);
        
        this.currentPage = page;
        this.hasMorePages = hasMore;
        this.totalItems = total;
        
        if (page === 1) {
            // First page - replace items
            this.items = items;
        } else {
            // Subsequent pages - append items
            this.items = this.items.concat(items);
        }
        
        this._renderCards();
        this._updateCountDisplay();
        this._updatePagination();
        
        // Emit event
        var eventName = page === 1 ? 'funky:card-grid:load' : 'funky:card-grid:load:more';
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit(eventName, {
                items: items,
                page: page,
                total: total,
                hasMore: hasMore,
                gridId: this.id
            });
        }
        
        if (typeof this.options.onLoad === 'function') {
            this.options.onLoad(items, page);
        }
    };

    /**
     * Handle load error
     */
    CardGridInstance.prototype._handleLoadError = function(error) {
        console.error('[Funky.CardGrid] Load error:', error);
        
        // Emit event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:error', {
                error: error,
                gridId: this.id
            });
        }
        
        if (typeof this.options.onLoadError === 'function') {
            this.options.onLoadError(error);
        }
        
        // Show error toast if available
        if (typeof Funky.Toast !== 'undefined') {
            Funky.Toast.error('Failed to load data: ' + error.message);
        }
        
        // Render empty state
        this._renderEmpty();
    };

    /**
     * Load more items (next page)
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.loadMore = function() {
        if (!this.hasMorePages || this.isLoading) return this;
        
        if (this.options.url) {
            this._loadFromUrl(this.currentPage + 1);
        }
        
        return this;
    };

    /**
     * Reload data from URL
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.reload = function() {
        this.currentPage = 1;
        this.items = [];
        this.filteredItems = [];
        
        if (this.options.url) {
            this._loadFromUrl(1);
        }
        
        return this;
    };

    /**
     * Go to specific page
     * @param {number} page - Page number
     * @returns {CardGridInstance}
     */
    CardGridInstance.prototype.goToPage = function(page) {
        if (page < 1) return this;
        if (this.isLoading) return this;
        
        if (this.options.url) {
            this.items = []; // Clear for page navigation
            this._loadFromUrl(page);
        } else {
            // Client-side pagination
            this.currentPage = page;
            this._renderCards();
            this._updatePagination();
        }
        
        return this;
    };

    // =========================================================================
    // LOADING STATE METHODS (Phase 4)
    // =========================================================================

    /**
     * Show loading state
     */
    CardGridInstance.prototype._showLoading = function() {
        this.els.wrapper.classAdd('funky-card-grid--loading');
        
        // Show skeleton cards for initial load
        if (this.items.length === 0) {
            this._renderSkeletons();
        } else if (this.options.pagination === 'infinite' || this.options.pagination === 'loadmore') {
            // Show loading spinner at bottom for load more
            this._showScrollLoading();
        } else {
            // Show overlay for page navigation
            this._showLoadingOverlay();
        }
    };

    /**
     * Hide loading state
     */
    CardGridInstance.prototype._hideLoading = function() {
        this.els.wrapper.classRemove('funky-card-grid--loading');
        
        // Remove skeleton cards
        var skeletons = this.els.grid.el.querySelectorAll('.funky-card-grid__card--skeleton');
        for (var i = 0; i < skeletons.length; i++) {
            skeletons[i].remove();
        }
        
        // Remove loading overlay
        if (this.els.loadingOverlay) {
            this.els.loadingOverlay.el.remove();
            this.els.loadingOverlay = null;
        }
        
        // Remove scroll loading
        if (this.els.scrollLoading) {
            this.els.scrollLoading.el.remove();
            this.els.scrollLoading = null;
        }
    };

    /**
     * Render skeleton cards
     */
    CardGridInstance.prototype._renderSkeletons = function() {
        var count = this.options.pageSize || 12;
        
        for (var i = 0; i < count; i++) {
            var skeleton = D.div()
                .classAdd('funky-card-grid__card')
                .classAdd('funky-card-grid__card--skeleton');
            
            // Use Funky.Skeleton if available
            if (typeof Funky.Skeleton !== 'undefined' && Funky.Skeleton.create) {
                skeleton.append(
                    Funky.Skeleton.create({ type: 'image', height: '160px' }),
                    Funky.Skeleton.create({ type: 'text', width: '60%' }),
                    Funky.Skeleton.create({ type: 'text', width: '80%', height: '0.75rem' })
                );
            } else {
                // Fallback skeleton structure
                skeleton.append(
                    D.div().classAdd('funky-card-grid__card-image'),
                    D.div().classAdd('funky-card-grid__card-content').append(
                        D.div().classAdd('funky-card-grid__card-title'),
                        D.div().classAdd('funky-card-grid__card-description')
                    )
                );
            }
            
            this.els.grid.append(skeleton);
        }
    };

    /**
     * Show loading overlay (for page navigation)
     */
    CardGridInstance.prototype._showLoadingOverlay = function() {
        this.els.loadingOverlay = D.div()
            .classAdd('funky-card-grid__loading-overlay');
        
        // Use Funky.Spinner if available
        if (typeof Funky.Spinner !== 'undefined' && Funky.Spinner.create) {
            this.els.loadingOverlay.append(
                Funky.Spinner.create({ size: 'lg' })
            );
        } else {
            this.els.loadingOverlay.html(
                '<div class="funky-card-grid__load-more-spinner" style="width: 2rem; height: 2rem;"></div>'
            );
        }
        
        this.els.wrapper.append(this.els.loadingOverlay);
    };

    /**
     * Show scroll loading indicator (for infinite scroll / load more)
     */
    CardGridInstance.prototype._showScrollLoading = function() {
        this.els.scrollLoading = D.div()
            .classAdd('funky-card-grid__scroll-loading');
        
        if (typeof Funky.Spinner !== 'undefined' && Funky.Spinner.create) {
            this.els.scrollLoading.append(
                Funky.Spinner.create({ size: 'md' })
            );
        } else {
            this.els.scrollLoading.html(
                '<div class="funky-card-grid__load-more-spinner"></div>'
            );
        }
        
        this.els.wrapper.append(this.els.scrollLoading);
    };

    // =========================================================================
    // PAGINATION (Phase 4)
    // =========================================================================

    /**
     * Build pagination controls
     */
    CardGridInstance.prototype._buildPagination = function() {
        if (!this.options.pagination) return;
        
        this.els.pagination = D.div().classAdd('funky-card-grid__pagination');
        
        if (this.options.pagination === 'loadmore') {
            this._buildLoadMoreButton();
        } else if (this.options.pagination === 'pages') {
            this._buildPageNavigation();
        } else if (this.options.pagination === 'infinite') {
            this._setupInfiniteScroll();
        }
        
        this.els.wrapper.append(this.els.pagination);
    };

    /**
     * Build load more button
     */
    CardGridInstance.prototype._buildLoadMoreButton = function() {
        var self = this;
        
        this.els.loadMoreBtn = D.button()
            .classAdd('funky-card-grid__load-more')
            .attr('type', 'button')
            .text('Load More');
        
        var clickHandler = function() {
            self.loadMore();
        };
        
        this.els.loadMoreBtn.on('click', clickHandler);
        this.els.pagination.append(this.els.loadMoreBtn);
        
        this._cleanupFns.push(function() {
            self.els.loadMoreBtn.off('click', clickHandler);
        });
    };

    /**
     * Build page navigation
     */
    CardGridInstance.prototype._buildPageNavigation = function() {
        var self = this;
        
        this.els.pageNav = D.div().classAdd('funky-card-grid__page-nav');
        
        // Previous button
        this.els.prevBtn = D.button()
            .classAdd('funky-card-grid__page-btn')
            .attr('type', 'button')
            .attr('aria-label', 'Previous page')
            .html('<i class="fas fa-chevron-left"></i>');
        
        var prevHandler = function() {
            if (self.currentPage > 1) {
                self.goToPage(self.currentPage - 1);
            }
        };
        this.els.prevBtn.on('click', prevHandler);
        
        // Page buttons container
        this.els.pageButtons = D.div().classAdd('funky-card-grid__page-buttons');
        
        // Next button
        this.els.nextBtn = D.button()
            .classAdd('funky-card-grid__page-btn')
            .attr('type', 'button')
            .attr('aria-label', 'Next page')
            .html('<i class="fas fa-chevron-right"></i>');
        
        var nextHandler = function() {
            if (self.hasMorePages) {
                self.goToPage(self.currentPage + 1);
            }
        };
        this.els.nextBtn.on('click', nextHandler);
        
        // Page info
        this.els.pageInfo = D.span().classAdd('funky-card-grid__page-info');
        
        this.els.pageNav.append(
            this.els.prevBtn,
            this.els.pageButtons,
            this.els.nextBtn,
            this.els.pageInfo
        );
        
        this.els.pagination.append(this.els.pageNav);
        
        this._cleanupFns.push(function() {
            self.els.prevBtn.off('click', prevHandler);
            self.els.nextBtn.off('click', nextHandler);
        });
    };

    /**
     * Setup infinite scroll
     */
    CardGridInstance.prototype._setupInfiniteScroll = function() {
        var self = this;
        
        // Create scroll trigger element
        this.els.scrollTrigger = D.div()
            .classAdd('funky-card-grid__scroll-trigger');
        
        this.els.pagination.append(this.els.scrollTrigger);
        
        // Use ScrollTracker if available
        if (typeof Funky.ScrollTracker !== 'undefined' && Funky.ScrollTracker.create) {
            this._scrollTracker = Funky.ScrollTracker.create({
                target: this.els.scrollTrigger.el,
                threshold: 0.1,
                onEnter: function() {
                    if (!self.isLoading && self.hasMorePages) {
                        self.loadMore();
                    }
                }
            });
            
            this._cleanupFns.push(function() {
                if (self._scrollTracker && self._scrollTracker.destroy) {
                    self._scrollTracker.destroy();
                }
            });
        } else if ('IntersectionObserver' in window) {
            // Fallback: Intersection Observer
            this._scrollObserver = new IntersectionObserver(function(entries) {
                if (entries[0].isIntersecting && !self.isLoading && self.hasMorePages) {
                    self.loadMore();
                }
            }, {
                rootMargin: '100px'
            });
            
            this._scrollObserver.observe(this.els.scrollTrigger.el);
            
            this._cleanupFns.push(function() {
                if (self._scrollObserver) {
                    self._scrollObserver.disconnect();
                }
            });
        } else {
            // Fallback: scroll event
            var scrollHandler = function() {
                var triggerRect = self.els.scrollTrigger.el.getBoundingClientRect();
                var inView = triggerRect.top < window.innerHeight + 100;
                
                if (inView && !self.isLoading && self.hasMorePages) {
                    self.loadMore();
                }
            };
            
            window.addEventListener('scroll', scrollHandler);
            this._cleanupFns.push(function() {
                window.removeEventListener('scroll', scrollHandler);
            });
        }
    };

    /**
     * Update pagination controls
     */
    CardGridInstance.prototype._updatePagination = function() {
        if (!this.options.pagination) return;
        
        if (this.options.pagination === 'loadmore') {
            this._updateLoadMoreButton();
        } else if (this.options.pagination === 'pages') {
            this._updatePageNavigation();
        } else if (this.options.pagination === 'infinite') {
            this._updateInfiniteScroll();
        }
    };

    /**
     * Update load more button state
     */
    CardGridInstance.prototype._updateLoadMoreButton = function() {
        if (!this.els.loadMoreBtn) return;
        
        if (this.isLoading) {
            this.els.loadMoreBtn
                .classAdd('funky-card-grid__load-more--loading')
                .attr('disabled', 'disabled')
                .html('<span class="funky-card-grid__load-more-spinner"></span> Loading...');
        } else if (!this.hasMorePages) {
            this.els.loadMoreBtn.style({ display: 'none' });
            
            // Show end message
            if (!this.els.endMessage) {
                this.els.endMessage = D.div()
                    .classAdd('funky-card-grid__end-message')
                    .text('All items loaded');
                this.els.pagination.append(this.els.endMessage);
            }
        } else {
            this.els.loadMoreBtn
                .classRemove('funky-card-grid__load-more--loading')
                .attrRemove('disabled')
                .text('Load More')
                .style({ display: '' });
        }
    };

    /**
     * Update page navigation
     */
    CardGridInstance.prototype._updatePageNavigation = function() {
        if (!this.els.pageNav) return;
        
        var totalPages = Math.ceil((this.totalItems || this.items.length) / this.options.pageSize) || 1;
        
        // Update prev/next buttons
        if (this.currentPage <= 1) {
            this.els.prevBtn.attr('disabled', 'disabled');
        } else {
            this.els.prevBtn.attrRemove('disabled');
        }
        
        if (this.currentPage >= totalPages) {
            this.els.nextBtn.attr('disabled', 'disabled');
        } else {
            this.els.nextBtn.attrRemove('disabled');
        }
        
        // Update page info
        this.els.pageInfo.text('Page ' + this.currentPage + ' of ' + totalPages);
        
        // Update page buttons
        this._renderPageButtons(totalPages);
    };

    /**
     * Render page number buttons
     */
    CardGridInstance.prototype._renderPageButtons = function(totalPages) {
        var self = this;
        
        this.els.pageButtons.empty();
        
        // Determine which pages to show
        var pages = this._getVisiblePages(this.currentPage, totalPages);
        
        pages.forEach(function(page) {
            if (page === '...') {
                self.els.pageButtons.append(
                    D.span().classAdd('funky-card-grid__page-ellipsis').text('...')
                );
            } else {
                var btn = D.button()
                    .classAdd('funky-card-grid__page-btn')
                    .classToggle('funky-card-grid__page-btn--active', page === self.currentPage)
                    .attr('type', 'button')
                    .attr('aria-label', 'Page ' + page)
                    .text(String(page));
                
                if (page === self.currentPage) {
                    btn.attr('aria-current', 'page');
                }
                
                btn.on('click', function() {
                    self.goToPage(page);
                });
                
                self.els.pageButtons.append(btn);
            }
        });
    };

    /**
     * Get visible page numbers with ellipsis
     */
    CardGridInstance.prototype._getVisiblePages = function(current, total) {
        var pages = [];
        var i;
        
        if (total <= 7) {
            // Show all pages
            for (i = 1; i <= total; i++) {
                pages.push(i);
            }
            return pages;
        }
        
        // Show first, last, and pages around current
        pages.push(1);
        
        if (current > 3) {
            pages.push('...');
        }
        
        for (i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
            if (pages.indexOf(i) === -1) {
                pages.push(i);
            }
        }
        
        if (current < total - 2) {
            pages.push('...');
        }
        
        if (pages.indexOf(total) === -1) {
            pages.push(total);
        }
        
        return pages;
    };

    /**
     * Update infinite scroll state
     */
    CardGridInstance.prototype._updateInfiniteScroll = function() {
        if (!this.hasMorePages && !this.els.endMessage) {
            this.els.endMessage = D.div()
                .classAdd('funky-card-grid__end-message')
                .text('All items loaded');
            this.els.pagination.append(this.els.endMessage);
        }
    };

    // =========================================================================
    // LIVEBINDING INTEGRATION (Phase 4)
    // =========================================================================

    /**
     * Initialize LiveBinding if configured
     */
    CardGridInstance.prototype._initLiveBinding = function() {
        var lbConfig = this.options.liveBinding;
        if (!lbConfig) return;
        
        var self = this;
        
        // Check if Funky.LiveBinding is available
        if (typeof Funky.LiveBinding !== 'undefined' && Funky.LiveBinding.bind) {
            // Use LiveBinding adapter pattern
            this._liveBindingInstance = Funky.LiveBinding.bind(this.container.el, {
                source: lbConfig.source || 'api',
                url: this.options.url,
                refresh: lbConfig.refresh,
                channel: lbConfig.channel,
                debounce: lbConfig.debounce || 500,
                transform: function(data) {
                    // Extract items from response
                    return self._extractItems(data);
                },
                render: function(items) {
                    self._onLiveBindingUpdate(items);
                }
            });
            
            this._cleanupFns.push(function() {
                if (self._liveBindingInstance && self._liveBindingInstance.unbind) {
                    self._liveBindingInstance.unbind();
                }
            });
        } else {
            // Fallback: Manual polling for 'api' source
            if (lbConfig.source === 'api' && lbConfig.refresh > 0) {
                this._liveBindingInterval = setInterval(function() {
                    self.reload();
                }, lbConfig.refresh);
                
                this._cleanupFns.push(function() {
                    clearInterval(self._liveBindingInterval);
                });
            }
            
            // Fallback: PubSub for 'event' source
            if (lbConfig.source === 'event' && lbConfig.event && typeof Funky.PubSub !== 'undefined') {
                var unsub = Funky.PubSub.on(lbConfig.event, function(data) {
                    self._onLiveBindingUpdate(data.items || data);
                });
                
                this._cleanupFns.push(unsub);
            }
        }
    };

    /**
     * Extract items from response data
     */
    CardGridInstance.prototype._extractItems = function(data) {
        if (Array.isArray(data)) {
            return data;
        }
        return data.items || data.data || data.results || [];
    };

    /**
     * Handle LiveBinding data update
     */
    CardGridInstance.prototype._onLiveBindingUpdate = function(items) {
        var self = this;
        var lbConfig = this.options.liveBinding || {};
        
        // Preserve selection if configured
        var selectedIds = [];
        if (lbConfig.preserveSelection !== false) {
            this.selectedIds.forEach(function(id) {
                selectedIds.push(id);
            });
        }
        
        // Find new items for animation
        var currentIds = {};
        this.items.forEach(function(item) {
            var id = item[self.options.idField] || item.id;
            currentIds[id] = true;
        });
        
        var newItems = items.filter(function(item) {
            var id = item[self.options.idField] || item.id;
            return !currentIds[id];
        });
        
        // Update items
        this.items = items;
        this._renderCards();
        this._updateCountDisplay();
        
        // Re-apply selection
        if (selectedIds.length > 0) {
            var idField = this.options.idField;
            this.selectedIds.clear();
            selectedIds.forEach(function(id) {
                // Check if item still exists
                var exists = items.some(function(item) {
                    return String(item[idField] || item.id) === String(id);
                });
                if (exists) {
                    self.selectedIds.add(id);
                }
            });
            // Update selection UI
            this._renderCards();
        }
        
        // Animate new items if Funky.Animate available
        if (newItems.length > 0 && typeof Funky.Animate !== 'undefined' && this.options.animate !== false) {
            var newElements = [];
            newItems.forEach(function(item) {
                var id = item[self.options.idField] || item.id;
                var el = self.container.el.querySelector('[data-item-id="' + id + '"]');
                if (el) {
                    newElements.push(el);
                }
            });
            
            if (newElements.length > 0 && Funky.Animate.stagger) {
                Funky.Animate.stagger(newElements, {
                    class: 'fade-in-up',
                    stagger: (this.options.animate && this.options.animate.stagger) || 50
                });
            }
        }
        
        // Emit event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:live:update', {
                items: items,
                newCount: newItems.length,
                gridId: this.id
            });
        }
    };

    // =========================================================================
    // DESTROY
    // =========================================================================

    /**
     * Destroy instance and cleanup
     */
    CardGridInstance.prototype.destroy = function() {
        // Destroy virtualizer first
        this._destroyVirtualizer();
        
        // Run cleanup functions
        this._cleanupFns.forEach(function(fn) {
            fn();
        });
        this._cleanupFns = [];
        
        // Clear DOM
        if (this.container) {
            this.container.empty();
            this.container.classRemove('funky-card-grid-container');
            this.container.attrRemove('data-card-grid-id');
        }
        
        // Clear state
        this.items = [];
        this.filteredItems = [];
        this.selectedIds.clear();
        this.els.cards.clear();

        // Null out DOM references to prevent access after destroy
        this.els.wrapper = null;
        this.els.grid = null;
        this.els.toolbar = null;
        this.els.pagination = null;
        this.els.emptyState = null;
        this.els.loadingOverlay = null;
        this.els.virtualContainer = null;

        // Remove from registry
        _instances.unregister(this.id);
        
        // Emit destroy event
        if (typeof Funky.PubSub !== 'undefined') {
            Funky.PubSub.emit('funky:card-grid:destroy', {
                gridId: this.id
            });
        }
    };

    // =========================================================================
    // REGISTER
    // =========================================================================

    // Add instances property as a getter
    Object.defineProperty(CardGrid, 'instances', {
        get: function() {
            return _instances.getMap ? _instances.getMap() : new Map();
        },
        enumerable: true,
        configurable: true
    });

    Funky.register('CardGrid', CardGrid);

    console.log('[Funky.CardGrid] v1.0.0 initialized');

})(window);
