/**
 * Funky.WidgetPalette
 * Collapsible sidebar with draggable widget cards
 * 
 * @example
 * var palette = new Funky.WidgetPalette({
 *     grid: dashboardGridInstance,
 *     position: 'left',   // 'left' or 'right'
 *     collapsed: false
 * });
 */
(function(global) {
    'use strict';
    
    // Ensure Funky namespace exists
    if (!global.Funky) {
        console.error('[Funky.WidgetPalette] Funky namespace not found.');
        return;
    }
    
    var Funky = global.Funky;
    var D = Funky.Dom;
    var E = Funky.Events;
    
    var CLASSES = {
        palette: 'widget-palette',
        collapsed: 'widget-palette--collapsed',
        left: 'widget-palette--left',
        right: 'widget-palette--right',
        toggle: 'widget-palette__toggle',
        panel: 'widget-palette__panel',
        header: 'widget-palette__header',
        title: 'widget-palette__title',
        close: 'widget-palette__close',
        search: 'widget-palette__search',
        searchInput: 'widget-palette__search-input',
        content: 'widget-palette__content',
        empty: 'widget-palette__empty',
        category: 'widget-palette__category',
        categoryHeader: 'widget-palette__category-header',
        categoryTitle: 'widget-palette__category-title',
        categoryToggle: 'widget-palette__category-toggle',
        categoryContent: 'widget-palette__category-content',
        categoryCollapsed: 'widget-palette__category--collapsed',
        card: 'widget-palette__card',
        cardDragging: 'widget-palette__card--dragging',
        cardIcon: 'widget-palette__card-icon',
        cardInfo: 'widget-palette__card-info',
        cardName: 'widget-palette__card-name',
        cardDesc: 'widget-palette__card-desc',
        dragProxy: 'widget-palette__drag-proxy',
        dropZoneActive: 'widget-palette__drop-zone--active'
    };
    
    /**
     * @constructor
     * @param {Object} options
     * @param {DashboardGrid} options.grid - Target grid instance
     * @param {string} [options.position='left'] - 'left' or 'right'
     * @param {boolean} [options.collapsed=true] - Start collapsed
     * @param {HTMLElement} [options.container] - Container element (default: body)
     */
    function WidgetPalette(options) {
        var defaults = {
            grid: null,
            position: 'left',
            collapsed: true,
            container: null
        };
        
        this.options = {};
        for (var key in defaults) {
            if (defaults.hasOwnProperty(key)) {
                this.options[key] = (options && options[key] !== undefined) ? options[key] : defaults[key];
            }
        }
        
        this._isCollapsed = this.options.collapsed;
        this._searchQuery = '';
        this._collapsedCategories = {};
        this._elements = {};
        this._dragState = null;
        this._dropTarget = null;
        this._palette = null;
        
        this._init();
    }
    
    WidgetPalette.prototype._init = function() {
        this._buildPalette();
        this._bindEvents();
        this._render();
    };
    
    WidgetPalette.prototype._buildPalette = function() {
        var positionClass = this.options.position === 'right' ? CLASSES.right : CLASSES.left;
        
        // Main container
        var palette = D.create('div')
            .classAdd(CLASSES.palette)
            .classAdd(positionClass);
        
        if (this._isCollapsed) {
            palette.classAdd(CLASSES.collapsed);
        }
        
        // Toggle button (visible when collapsed)
        var toggle = D.create('button')
            .classAdd(CLASSES.toggle)
            .attr('type', 'button')
            .attr('aria-label', 'Open widget palette')
            .attr('title', 'Add Widget')
            .html('<i class="fas fa-plus"></i>');
        this._elements.toggle = toggle;
        palette.append(toggle);
        
        // Panel
        var panel = D.create('div')
            .classAdd(CLASSES.panel)
            .attr('role', 'complementary')
            .attr('aria-label', 'Widget palette');
        
        // Header
        var header = D.create('div').classAdd(CLASSES.header);
        D.create('span')
            .classAdd(CLASSES.title)
            .text('Widgets')
            .appendTo(header);
        
        var closeBtn = D.create('button')
            .classAdd(CLASSES.close)
            .attr('type', 'button')
            .attr('aria-label', 'Close palette')
            .html('<i class="fas fa-times"></i>');
        this._elements.closeBtn = closeBtn;
        header.append(closeBtn);
        panel.append(header);
        
        // Search
        var search = D.create('div').classAdd(CLASSES.search);
        var searchInput = D.create('input')
            .classAdd(CLASSES.searchInput)
            .attr('type', 'search')
            .attr('placeholder', 'Search...')
            .attr('aria-label', 'Search widgets');
        this._elements.searchInput = searchInput;
        search.append(searchInput);
        panel.append(search);
        
        // Content (categories and cards)
        var content = D.create('div').classAdd(CLASSES.content);
        this._elements.content = content;
        panel.append(content);
        
        palette.append(panel);
        
        this._palette = palette;
        
        // Append to container
        var container = this.options.container ? D.one(this.options.container) : D.one('body');
        container.append(palette);
    };
    
    WidgetPalette.prototype._bindEvents = function() {
        var self = this;
        
        // Toggle button
        this._elements.toggle.on('click', function() {
            self.expand();
        });
        
        // Close button
        this._elements.closeBtn.on('click', function() {
            self.collapse();
        });
        
        // Search input
        this._elements.searchInput.on('input', function() {
            self._searchQuery = this.value;
            self._renderWidgets();
        });
        
        // Drag events (delegated)
        this._elements.content.on('mousedown', function(e) {
            var target = e.target;
            var card = null;
            
            // Find the card element
            while (target && target !== self._elements.content.el) {
                if (target.classList && target.classList.contains(CLASSES.card)) {
                    card = target;
                    break;
                }
                target = target.parentNode;
            }
            
            if (card) {
                self._startDrag(e, card);
            }
        });
        
        // Keyboard support for cards
        this._elements.content.on('keydown', function(e) {
            var target = e.target;
            if (target.classList && target.classList.contains(CLASSES.card)) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var type = target.getAttribute('data-type');
                    if (type) {
                        self._addWidgetFromCard(type);
                    }
                }
            }
        });
        
        // Global drag handlers
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    };
    
    WidgetPalette.prototype._render = function() {
        this._renderWidgets();
    };
    
    WidgetPalette.prototype._renderWidgets = function() {
        var self = this;
        var container = this._elements.content;
        container.html('');
        
        // Get widgets grouped by category
        var widgets;
        if (this._searchQuery) {
            widgets = Funky.DashboardGrid.searchWidgets(this._searchQuery);
        } else {
            widgets = Funky.DashboardGrid.getWidgetTypes();
        }
        
        if (widgets.length === 0) {
            D.create('div')
                .classAdd(CLASSES.empty)
                .text('No widgets found')
                .appendTo(container);
            return;
        }
        
        // Group by category
        var byCategory = {};
        for (var i = 0; i < widgets.length; i++) {
            var cat = widgets[i].category;
            if (!byCategory[cat]) {
                byCategory[cat] = [];
            }
            byCategory[cat].push(widgets[i]);
        }
        
        // Render categories
        var categories = Object.keys(byCategory).sort();
        for (var j = 0; j < categories.length; j++) {
            var category = categories[j];
            var categoryWidgets = byCategory[category];
            
            this._renderCategory(container, category, categoryWidgets);
        }
    };
    
    WidgetPalette.prototype._renderCategory = function(container, category, widgets) {
        var self = this;
        var isCollapsed = this._collapsedCategories[category];
        
        var section = D.create('div')
            .classAdd(CLASSES.category);
        
        if (isCollapsed) {
            section.classAdd(CLASSES.categoryCollapsed);
        }
        
        // Header
        var header = D.create('div')
            .classAdd(CLASSES.categoryHeader)
            .attr('role', 'button')
            .attr('aria-expanded', isCollapsed ? 'false' : 'true')
            .attr('tabindex', '0');
        
        D.create('span')
            .classAdd(CLASSES.categoryTitle)
            .text(this._formatCategory(category) + ' (' + widgets.length + ')')
            .appendTo(header);
        
        D.create('i')
            .classAdd(CLASSES.categoryToggle)
            .classAdd('fas')
            .classAdd('fa-chevron-down')
            .appendTo(header);
        
        header.on('click', function() {
            self._toggleCategory(category, section);
        });
        
        header.on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                self._toggleCategory(category, section);
            }
        });
        
        section.append(header);
        
        // Content
        var content = D.create('div').classAdd(CLASSES.categoryContent);
        
        for (var i = 0; i < widgets.length; i++) {
            var widget = widgets[i];
            var card = this._createCard(widget);
            content.append(card);
        }
        
        section.append(content);
        container.append(section);
    };
    
    WidgetPalette.prototype._createCard = function(widget) {
        var card = D.create('div')
            .classAdd(CLASSES.card)
            .attr('draggable', 'true')
            .attr('data-type', widget.type)
            .attr('role', 'listitem')
            .attr('tabindex', '0')
            .attr('title', widget.description || widget.name);
        
        D.create('div')
            .classAdd(CLASSES.cardIcon)
            .html('<i class="fas ' + widget.icon + '"></i>')
            .appendTo(card);
        
        var info = D.create('div').classAdd(CLASSES.cardInfo);
        
        D.create('div')
            .classAdd(CLASSES.cardName)
            .text(widget.name)
            .appendTo(info);
        
        if (widget.description) {
            D.create('div')
                .classAdd(CLASSES.cardDesc)
                .text(widget.description)
                .appendTo(info);
        }
        
        card.append(info);
        
        return card;
    };
    
    WidgetPalette.prototype._formatCategory = function(cat) {
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    };
    
    WidgetPalette.prototype._toggleCategory = function(category, section) {
        this._collapsedCategories[category] = !this._collapsedCategories[category];
        section.classToggle(CLASSES.categoryCollapsed);
        
        var header = section.one('.' + CLASSES.categoryHeader);
        if (header) {
            header.attr('aria-expanded', this._collapsedCategories[category] ? 'false' : 'true');
        }
    };
    
    // Add widget via keyboard
    WidgetPalette.prototype._addWidgetFromCard = function(type) {
        var meta = Funky.DashboardGrid.getWidgetMeta(type);
        var typeHandler = Funky.DashboardGrid.getWidgetType ? Funky.DashboardGrid.getWidgetType(type) : null;
        
        var config = {
            type: type,
            width: meta ? meta.defaults.width : 2,
            height: meta ? meta.defaults.height : 2
        };
        
        // Get default config from widget type handler if available
        if (typeHandler && typeof typeHandler.getDefaultConfig === 'function') {
            config.config = typeHandler.getDefaultConfig();
        }
        
        if (this.options.grid) {
            this.options.grid.addWidget(config);
        }
        
        Funky.PubSub.emit('funky:widget-palette:add', { type: type, config: config });
    };
    
    // Drag and Drop
    WidgetPalette.prototype._startDrag = function(e, cardEl) {
        var type = cardEl.getAttribute('data-type');
        var meta = Funky.DashboardGrid.getWidgetMeta(type);
        if (!meta) return;
        
        e.preventDefault();
        
        // Create drag proxy
        var proxy = D.create('div')
            .classAdd(CLASSES.dragProxy)
            .html('<i class="fas ' + meta.icon + '"></i> ' + meta.name);
        
        D.one('body').append(proxy);
        
        this._dragState = {
            type: type,
            meta: meta,
            proxy: proxy,
            startX: e.clientX,
            startY: e.clientY,
            card: cardEl
        };
        
        D.one(cardEl).classAdd(CLASSES.cardDragging);
        
        // Position proxy
        this._positionProxy(e.clientX, e.clientY);
        
        // Add listeners
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        
        // Show drop zones on grid
        if (this.options.grid) {
            this._showDropZones();
        }
        
        Funky.PubSub.emit('funky:widget-palette:dragStart', { type: type });
    };
    
    WidgetPalette.prototype._onMouseMove = function(e) {
        if (!this._dragState) return;
        
        this._positionProxy(e.clientX, e.clientY);
        
        // Check for drop zone hover
        if (this.options.grid) {
            this._updateDropZones(e);
        }
    };
    
    WidgetPalette.prototype._onMouseUp = function(e) {
        if (!this._dragState) return;
        
        var state = this._dragState;
        
        // Check if dropped on grid
        if (this.options.grid && this._dropTarget) {
            this._dropWidget(state.type, this._dropTarget);
        }
        
        // Cleanup
        D.one(state.card).classRemove(CLASSES.cardDragging);
        if (state.proxy.el && state.proxy.el.parentNode) {
            state.proxy.el.parentNode.removeChild(state.proxy.el);
        }
        
        this._hideDropZones();
        
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        
        this._dragState = null;
        this._dropTarget = null;
        
        Funky.PubSub.emit('funky:widget-palette:dragEnd', { type: state.type });
    };
    
    WidgetPalette.prototype._positionProxy = function(x, y) {
        if (!this._dragState || !this._dragState.proxy) return;
        
        this._dragState.proxy.el.style.left = (x + 10) + 'px';
        this._dragState.proxy.el.style.top = (y + 10) + 'px';
    };
    
    WidgetPalette.prototype._showDropZones = function() {
        // Emit event for grid to show drop zones
        Funky.PubSub.emit('funky:widget-palette:showDropZones', { grid: this.options.grid });
        
        // Add class to grid
        var gridEl = this.options.grid.container;
        if (gridEl) {
            D.one(gridEl).classAdd(CLASSES.dropZoneActive);
        }
    };
    
    WidgetPalette.prototype._hideDropZones = function() {
        Funky.PubSub.emit('funky:widget-palette:hideDropZones');
        
        var gridEl = this.options.grid && this.options.grid.container;
        if (gridEl) {
            D.one(gridEl).classRemove(CLASSES.dropZoneActive);
        }
    };
    
    WidgetPalette.prototype._updateDropZones = function(e) {
        if (!this.options.grid || !this.options.grid.container) return;
        
        var gridEl = this.options.grid.container;
        var rect = gridEl.getBoundingClientRect();
        
        // Check if mouse is over grid
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            
            // Calculate grid position
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            
            this._dropTarget = { x: x, y: y, gridRect: rect };
        } else {
            this._dropTarget = null;
        }
    };
    
    WidgetPalette.prototype._dropWidget = function(type, target) {
        var meta = Funky.DashboardGrid.getWidgetMeta(type);
        var typeHandler = Funky.DashboardGrid.getWidgetType ? Funky.DashboardGrid.getWidgetType(type) : null;
        var grid = this.options.grid;
        
        // Get widget dimensions
        var widgetWidth = meta ? meta.defaults.width : 2;
        var widgetHeight = meta ? meta.defaults.height : 2;
        
        // Calculate grid column/row from pixel position
        var col = 1;
        var row = 1;
        
        if (target && grid && grid.options) {
            var columns = grid.options.columns || 12;
            var rowHeight = grid.options.rowHeight || 80;
            var gap = grid.options.gap || 16;
            
            // Calculate cell dimensions (approximate, accounting for gaps)
            var gridWidth = target.gridRect.width;
            var cellWidth = (gridWidth - (gap * (columns - 1))) / columns;
            var cellHeight = rowHeight;
            
            // Calculate column (1-indexed, clamped to valid range)
            col = Math.floor(target.x / (cellWidth + gap)) + 1;
            col = Math.max(1, Math.min(col, columns - widgetWidth + 1));
            
            // Calculate row (1-indexed)
            row = Math.floor(target.y / (cellHeight + gap)) + 1;
            row = Math.max(1, row);
        }
        
        var config = {
            type: type,
            col: col,
            row: row,
            width: widgetWidth,
            height: widgetHeight
        };
        
        // Get default config from widget type handler if available
        if (typeHandler && typeof typeHandler.getDefaultConfig === 'function') {
            config.config = typeHandler.getDefaultConfig();
        }
        
        if (grid) {
            grid.addWidget(config);
        }
        
        Funky.PubSub.emit('funky:widget-palette:drop', { type: type, config: config });
    };
    
    /**
     * Expand the palette
     */
    WidgetPalette.prototype.expand = function() {
        this._isCollapsed = false;
        this._palette.classRemove(CLASSES.collapsed);
        this._elements.toggle.attr('aria-label', 'Close widget palette');
        
        // Focus search input after expansion
        var self = this;
        setTimeout(function() {
            self._elements.searchInput.el.focus();
        }, 300);
        
        Funky.PubSub.emit('funky:widget-palette:expand');
        return this;
    };
    
    /**
     * Collapse the palette
     */
    WidgetPalette.prototype.collapse = function() {
        this._isCollapsed = true;
        this._palette.classAdd(CLASSES.collapsed);
        this._elements.toggle.attr('aria-label', 'Open widget palette');
        Funky.PubSub.emit('funky:widget-palette:collapse');
        return this;
    };
    
    /**
     * Toggle collapsed state
     */
    WidgetPalette.prototype.toggle = function() {
        if (this._isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
        return this;
    };
    
    /**
     * Check if collapsed
     * @returns {boolean}
     */
    WidgetPalette.prototype.isCollapsed = function() {
        return this._isCollapsed;
    };
    
    /**
     * Refresh widget list
     */
    WidgetPalette.prototype.refresh = function() {
        this._renderWidgets();
    };
    
    /**
     * Destroy the palette
     */
    WidgetPalette.prototype.destroy = function() {
        if (this._palette && this._palette.el && this._palette.el.parentNode) {
            this._palette.el.parentNode.removeChild(this._palette.el);
        }
        
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        
        this._palette = null;
        this._elements = {};
        this._dragState = null;
    };

    // =========================================================================
    // FACTORY API
    // =========================================================================

    var _instances = Funky.Registry.createInstanceRegistry('WidgetPalette');
    var _instanceCounter = 0;

    var WidgetPaletteFactory = {
        /**
         * Initialize a widget palette
         * @param {Object} options - Configuration options
         * @returns {WidgetPalette}
         */
        init: function(options) {
            var instance = new WidgetPalette(options);
            instance.id = 'widget-palette-' + (++_instanceCounter);
            _instances.register(instance.id, instance);
            return instance;
        },

        /**
         * Get instance by ID
         * @param {string} id - Instance ID
         * @returns {WidgetPalette|null}
         */
        getInstance: function(id) {
            return _instances.get(id);
        },

        /**
         * Destroy by ID
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
        },

        constructor: WidgetPalette
    };

    if (Funky.register) {
        Funky.register('WidgetPalette', WidgetPaletteFactory);
    }

})(window);
