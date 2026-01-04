/**
 * Funky.DashboardGrid - Flexible Dashboard Grid Layout System
 * 
 * A CSS Grid-based layout component for building dashboards with:
 * - Drag-and-drop widget repositioning
 * - Drag-to-resize widgets (8 directions)
 * - Multiple widget types (html, dom, vdom, component, livebinding, grid)
 * - Nested grids
 * - Persistent layouts (localStorage or API)
 * - Full accessibility support
 * 
 * Usage:
 *   var grid = Funky.DashboardGrid.init('#dashboard', {
 *       columns: 12,
 *       rowHeight: 80,
 *       editable: true,
 *       widgets: [
 *           { id: 'stats', type: 'html', html: '<p>Stats</p>', col: 1, row: 1, width: 4, height: 2 }
 *       ]
 *   });
 * 
 * @version 1.0.0
 * @requires Funky.Dom (D)
 * @requires Funky.Events (E)
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.DashboardGrid] Registry not found. Load namespace.js first.');
        return;
    }

    // Prevent double registration
    if (Funky.isRegistered && Funky.isRegistered('DashboardGrid')) {
        return;
    }

    // Shortcuts
    var D = window.D || (window.Funky && Funky.Dom);
    var E = window.E || (window.Funky && Funky.Events);

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    var CLASSES = {
        grid: 'dashboard-grid',
        gridEditMode: 'dashboard-grid--edit-mode',
        gridNested: 'dashboard-grid--nested',
        widget: 'dashboard-widget',
        widgetDragging: 'dashboard-widget--dragging',
        widgetResizing: 'dashboard-widget--resizing',
        widgetHeader: 'dashboard-widget__header',
        widgetTitle: 'dashboard-widget__title',
        widgetControls: 'dashboard-widget__controls',
        widgetContent: 'dashboard-widget__content',
        widgetBtn: 'dashboard-widget__btn',
        widgetBtnRemove: 'dashboard-widget__btn--remove',
        resizeHandle: 'dashboard-widget__resize-handle',
        placeholder: 'dashboard-grid__placeholder'
    };

    var SELECTORS = {
        grid: '[data-dashboard-grid]',
        widget: '[data-widget]'
    };

    var RESIZE_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

    var EVENTS = {
        INIT: 'funky.dashboard-grid.initialized',
        DESTROY: 'funky.dashboard-grid.destroyed',
        LAYOUT_CHANGE: 'funky.dashboard-grid.layout-change',
        WIDGET_ADD: 'funky.dashboard-grid.widget-add',
        WIDGET_REMOVE: 'funky.dashboard-grid.widget-remove',
        WIDGET_MOVE: 'funky.dashboard-grid.widget-move',
        WIDGET_RESIZE: 'funky.dashboard-grid.widget-resize',
        WIDGET_UPDATE: 'funky.dashboard-grid.widget-update',
        EDIT_MODE: 'funky.dashboard-grid.edit-mode',
        SAVE: 'funky.dashboard-grid.save',
        LOAD: 'funky.dashboard-grid.load'
    };

    // =========================================================================
    // INSTANCE REGISTRY
    // =========================================================================

    var _instances = Funky.Registry.createInstanceRegistry('DashboardGrid');
    var _instanceCounter = 0;

    // =========================================================================
    // WIDGET TYPE REGISTRY
    // =========================================================================

    var _widgetTypes = Funky.Registry.create('dashboardWidgetTypes');
    
    // Widget UI metadata for catalog/palette display
    var _widgetMeta = Funky.Registry.create('dashboardWidgetMeta');

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    /**
     * Generate unique ID
     */
    function generateId(prefix) {
        return (prefix || 'dg') + '-' + (++_instanceCounter) + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Deep merge objects (with circular reference protection)
     */
    function deepMerge(target, source, seen) {
        var result = {};
        var key;
        
        // Initialize seen set to track circular references
        if (!seen) {
            seen = [];
        }
        
        // Copy target properties
        for (key in target) {
            if (target.hasOwnProperty(key)) {
                result[key] = target[key];
            }
        }
        
        // Merge source properties
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                var val = source[key];
                // Skip DOM elements, functions, and circular references
                if (val && typeof val === 'object' && !Array.isArray(val)) {
                    // Check if it's a DOM element
                    if (val.nodeType || val.el || val instanceof Element) {
                        result[key] = val;
                    } else if (seen.indexOf(val) !== -1) {
                        // Circular reference, skip deep merge
                        result[key] = val;
                    } else {
                        seen.push(val);
                        result[key] = deepMerge(result[key] || {}, val, seen);
                    }
                } else {
                    result[key] = val;
                }
            }
        }
        
        return result;
    }

    /**
     * Parse data attributes from grid element
     */
    function parseGridDataAttributes(el) {
        var opts = {};
        var dataset = el.dataset;

        if (dataset.columns) opts.columns = parseInt(dataset.columns, 10);
        if (dataset.rowHeight) opts.rowHeight = dataset.rowHeight === 'auto' ? 'auto' : parseInt(dataset.rowHeight, 10);
        if (dataset.gap) opts.gap = parseInt(dataset.gap, 10);
        if (dataset.editable) opts.editable = dataset.editable !== 'false';
        if (dataset.editMode) opts.editMode = dataset.editMode === 'true';
        if (dataset.animate) opts.animate = dataset.animate !== 'false';
        if (dataset.persist) opts.persist = dataset.persist;
        if (dataset.storageKey) opts.storageKey = dataset.storageKey;
        if (dataset.apiEndpoint) opts.apiEndpoint = dataset.apiEndpoint;

        return opts;
    }

    /**
     * Parse data attributes from widget element
     */
    function parseWidgetDataAttributes(el) {
        var opts = {};
        var dataset = el.dataset;

        if (dataset.widgetId) opts.id = dataset.widgetId;
        if (dataset.type) opts.type = dataset.type;
        if (dataset.col) opts.col = parseInt(dataset.col, 10);
        if (dataset.row) opts.row = parseInt(dataset.row, 10);
        if (dataset.width) opts.width = parseInt(dataset.width, 10);
        if (dataset.height) opts.height = parseInt(dataset.height, 10);
        if (dataset.title) opts.title = dataset.title;
        if (dataset.component) opts.component = dataset.component;
        if (dataset.minWidth) opts.minWidth = parseInt(dataset.minWidth, 10);
        if (dataset.minHeight) opts.minHeight = parseInt(dataset.minHeight, 10);
        if (dataset.maxWidth) opts.maxWidth = parseInt(dataset.maxWidth, 10);
        if (dataset.maxHeight) opts.maxHeight = parseInt(dataset.maxHeight, 10);
        if (dataset.resizable) opts.resizable = dataset.resizable !== 'false';
        if (dataset.draggable) opts.draggable = dataset.draggable !== 'false';

        // Parse JSON config if present
        if (dataset.config) {
            try {
                opts.config = JSON.parse(dataset.config);
            } catch (e) {
                console.warn('[DashboardGrid] Failed to parse widget config:', e);
            }
        }

        return opts;
    }

    /**
     * Clamp value between min and max
     */
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // =========================================================================
    // WIDGET CLASS
    // =========================================================================

    /**
     * Widget - Individual dashboard cell
     * @param {DashboardGrid} grid - Parent grid instance
     * @param {Object} config - Widget configuration
     */
    function Widget(grid, config) {
        this.grid = grid;
        this.id = config.id || generateId('widget');
        this.type = config.type || 'html';
        this.config = config;

        // Position (1-based)
        this.col = config.col || 1;
        this.row = config.row || 1;
        this.width = config.width || 2;
        this.height = config.height || 2;

        // Constraints
        this.minWidth = config.minWidth || grid.options.minWidgetWidth;
        this.minHeight = config.minHeight || grid.options.minWidgetHeight;
        this.maxWidth = config.maxWidth || grid.options.columns;
        this.maxHeight = config.maxHeight || Infinity;

        // Behavior
        this.resizable = config.resizable !== false;
        this.draggable = config.draggable !== false;
        this.title = config.title || '';

        // State
        this.element = null;
        this.headerEl = null;
        this.contentEl = null;
        this.data = config.data || null;
        this._destroyed = false;
        this._pendingMount = [];  // Callbacks to run after mount

        this._init();
    }

    /**
     * Initialize widget
     */
    Widget.prototype._init = function() {
        this._createElement();
        this._renderContent();
        this._updatePosition();
    };

    /**
     * Create widget DOM structure
     */
    Widget.prototype._createElement = function() {
        var self = this;
        var opts = this.grid.options;

        // Create widget container
        this.element = D.create('div')
            .classAdd(CLASSES.widget)
            .attr('data-widget-id', this.id)
            .attr('data-widget-type', this.type)
            .attr('role', 'article')
            .attr('aria-label', this.title || 'Dashboard widget')
            .attr('tabindex', '0')
            .el;

        // Make draggable if in edit mode
        if (opts.editable && this.draggable && this.grid._editMode) {
            this.element.setAttribute('draggable', 'true');
        }

        // Header (if title or editable)
        if (this.title || opts.editable) {
            this.headerEl = D.create('div')
                .classAdd(CLASSES.widgetHeader)
                .el;

            // Title
            var titleEl = D.create('span')
                .classAdd(CLASSES.widgetTitle)
                .text(this.title || '')
                .el;
            this.headerEl.appendChild(titleEl);

            // Controls (visible in edit mode)
            if (opts.editable) {
                var controlsEl = D.create('div')
                    .classAdd(CLASSES.widgetControls)
                    .el;

                // Refresh button
                var refreshBtn = D.create('button')
                    .classAdd(CLASSES.widgetBtn, 'dashboard-widget__btn--refresh')
                    .attr('type', 'button')
                    .attr('aria-label', 'Refresh widget')
                    .attr('title', 'Refresh widget')
                    .html('<i class="fas fa-sync-alt"></i>')
                    .on('click', function(e) {
                        e.stopPropagation();
                        self.refresh();
                    })
                    .el;
                controlsEl.appendChild(refreshBtn);

                // Remove button
                var removeBtn = D.create('button')
                    .classAdd(CLASSES.widgetBtn, CLASSES.widgetBtnRemove)
                    .attr('type', 'button')
                    .attr('aria-label', 'Remove widget')
                    .attr('title', 'Remove widget')
                    .html('<i class="fas fa-times"></i>')
                    .on('click', function(e) {
                        e.stopPropagation();
                        self.remove();
                    })
                    .el;
                controlsEl.appendChild(removeBtn);

                this.headerEl.appendChild(controlsEl);
            }

            this.element.appendChild(this.headerEl);
        }

        // Content area
        this.contentEl = D.create('div')
            .classAdd(CLASSES.widgetContent)
            .el;
        this.element.appendChild(this.contentEl);

        // Resize handles (if editable and resizable)
        if (opts.editable && this.resizable) {
            this._createResizeHandles();
        }
    };

    /**
     * Create resize handles for all 8 directions
     */
    Widget.prototype._createResizeHandles = function() {
        var self = this;

        RESIZE_DIRECTIONS.forEach(function(dir) {
            var handle = D.create('div')
                .classAdd(CLASSES.resizeHandle + ' ' + CLASSES.resizeHandle + '--' + dir)
                .attr('data-resize-dir', dir)
                .attr('draggable', 'false')
                .attr('role', 'separator')
                .attr('aria-orientation', (dir === 'e' || dir === 'w') ? 'vertical' : 'horizontal')
                .attr('aria-label', 'Resize ' + dir)
                .attr('tabindex', '0')
                .el;

            self.element.appendChild(handle);
        });
    };

    /**
     * Render widget content based on type
     */
    Widget.prototype._renderContent = function() {
        var self = this;
        var content = null;

        // Check for registered widget type
        var typeHandler = _widgetTypes.get(this.type);
        if (typeHandler && typeHandler.render) {
            content = typeHandler.render(this, this.config.config || this.config);
        } else {
            // Built-in types
            switch (this.type) {
                case 'html':
                    content = this.config.html || '';
                    break;

                case 'dom':
                    if (typeof this.config.render === 'function') {
                        content = this.config.render(this);
                    } else if (this.config.dom && this.config.dom.nodeType) {
                        // Support direct DOM element via config.dom
                        content = this.config.dom;
                    }
                    break;

                case 'vdom':
                    if (typeof this.config.render === 'function' && window.Funky && Funky.VDom) {
                        var vnode = this.config.render(this, this.data);
                        content = Funky.VDom.render(vnode);
                    }
                    break;

                case 'component':
                    this._initComponent();
                    return;

                case 'livebinding':
                    this._initLiveBinding();
                    return;

                case 'grid':
                    this._initNestedGrid();
                    return;

                default:
                    content = '<p class="text-muted">Unknown widget type: ' + this.type + '</p>';
            }
        }

        // Apply content
        if (content) {
            if (typeof content === 'string') {
                this.contentEl.innerHTML = content;
            } else if (content.el) {
                // Funky.Dom element
                this.contentEl.appendChild(content.el);
            } else if (content.nodeType) {
                // DOM element
                this.contentEl.appendChild(content);
            }
        }
        
        // Call mounted hook from widget type if defined
        if (typeHandler && typeHandler.mounted) {
            this._pendingMount.push(function() {
                typeHandler.mounted(self, self.config.config || self.config);
            });
        }
    };

    /**
     * Called after widget element is appended to the DOM
     * Executes all pending mount callbacks
     */
    Widget.prototype._onMounted = function() {
        var self = this;
        
        // Execute all pending mount callbacks
        for (var i = 0; i < this._pendingMount.length; i++) {
            try {
                this._pendingMount[i].call(this);
            } catch (e) {
                console.error('[Widget] Error in mounted callback:', e);
            }
        }
        this._pendingMount = [];
        
        // Emit mounted event on widget element
        if (this.element && window.Funky && Funky.Events) {
            Funky.Events.emit(this.element, 'funky.dashboard-grid.widget-mounted', { widget: this });
        }
    };
    
    /**
     * Register a callback to run after widget is mounted in DOM
     * @param {Function} callback - Function to call after mount
     */
    Widget.prototype.onMount = function(callback) {
        if (typeof callback !== 'function') return;
        
        // If already mounted (has parent), call immediately
        if (this.element && this.element.parentNode) {
            callback.call(this);
        } else {
            this._pendingMount.push(callback);
        }
    };

    /**
     * Initialize component widget type
     */
    Widget.prototype._initComponent = function() {
        var self = this;
        var componentName = this.config.component;
        var componentConfig = this.config.config || {};

        // Check if component exists
        if (!window.Funky || !Funky[componentName]) {
            this.setError(
                'Component not found',
                'The component "' + componentName + '" is not registered'
            );
            return;
        }

        // Check if component has init method
        if (!Funky[componentName].init) {
            this.setError(
                'Invalid component',
                'The component "' + componentName + '" does not have an init method'
            );
            return;
        }

        // Show loading while initializing
        this.setLoading('Initializing ' + componentName + '...');

        var wrapper = D.create('div')
            .classAdd('dashboard-widget__component-wrapper')
            .el;
        this.contentEl.appendChild(wrapper);

        // Use try-catch for error boundary
        try {
            this._componentInstance = Funky[componentName].init(wrapper, componentConfig);
            this._clearState();

            // If component is async, handle promise
            if (this._componentInstance && typeof this._componentInstance.then === 'function') {
                this._componentInstance
                    .then(function(instance) {
                        self._componentInstance = instance;
                        self._clearState();
                    })
                    .catch(function(error) {
                        self.setError(
                            'Component initialization failed',
                            error && error.message ? error.message : 'Unknown error',
                            function() { self.refresh(); }
                        );
                    });
            }
        } catch (error) {
            this.setError(
                'Component error',
                error && error.message ? error.message : 'Failed to initialize component',
                function() { self.refresh(); }
            );
        }
    };

    /**
     * Initialize livebinding widget type
     */
    Widget.prototype._initLiveBinding = function() {
        var self = this;

        if (!window.Funky || !Funky.LiveBinding) {
            this.setError('LiveBinding not available', 'The LiveBinding module is not loaded');
            return;
        }

        // Show loading state initially
        this.setLoading(this.config.loadingText || 'Loading...');

        // Create container for binding content
        var bindingContainer = D.create('div')
            .classAdd('dashboard-widget__binding-container')
            .el;
        this.contentEl.appendChild(bindingContainer);

        // Track previous VDom for diffing
        this._vdomPrev = null;

        this._binding = new Funky.LiveBinding.Binding(bindingContainer, {
            source: 'api',
            api: this.config.api,
            interval: this.config.interval || 0,
            method: this.config.method || 'GET',
            params: this.config.params || {},
            render: function(data) {
                // Clear loading state on first successful load
                self._clearState();
                self.data = data;

                // Check for empty data
                if (!data || (Array.isArray(data) && data.length === 0)) {
                    self.setEmpty(self.config.emptyText || 'No data available', self.config.emptyIcon);
                    return '';
                }

                if (typeof self.config.render === 'function') {
                    var result = self.config.render(data, self);

                    // Check if result is a VDom node
                    if (result && result.type && window.Funky && Funky.VDom) {
                        // Use VDom diffing for efficient updates
                        if (self._vdomPrev) {
                            Funky.VDom.patch(bindingContainer, self._vdomPrev, result);
                        } else {
                            bindingContainer.innerHTML = '';
                            bindingContainer.appendChild(Funky.VDom.render(result));
                        }
                        self._vdomPrev = result;
                        return null; // Already rendered
                    }

                    return result;
                }
                return JSON.stringify(data, null, 2);
            },
            onError: function(error) {
                self.setError(
                    'Failed to load data',
                    error && error.message ? error.message : 'Unknown error',
                    function() { self._binding && self._binding.fetch(); }
                );
            }
        });
    };

    /**
     * Initialize nested grid widget type
     */
    Widget.prototype._initNestedGrid = function() {
        var gridConfig = this.config.gridConfig || {};

        var nestedContainer = D.create('div')
            .classAdd(CLASSES.gridNested)
            .el;
        this.contentEl.appendChild(nestedContainer);

        this._nestedGrid = new DashboardGrid(nestedContainer, deepMerge(gridConfig, {
            parentWidget: this
        }));
    };

    /**
     * Update widget position in CSS Grid
     */
    Widget.prototype._updatePosition = function() {
        this.element.style.gridColumn = this.col + ' / span ' + this.width;
        this.element.style.gridRow = this.row + ' / span ' + this.height;
    };

    /**
     * Move widget to new position
     * @param {number} col - Target column (1-based)
     * @param {number} row - Target row (1-based)
     */
    Widget.prototype.moveTo = function(col, row) {
        var oldCol = this.col;
        var oldRow = this.row;

        this.col = clamp(col, 1, this.grid.options.columns - this.width + 1);
        this.row = Math.max(1, row);

        this._updatePosition();

        if (this.col !== oldCol || this.row !== oldRow) {
            this.grid._emitEvent(EVENTS.WIDGET_MOVE, {
                widgetId: this.id,
                from: { col: oldCol, row: oldRow },
                to: { col: this.col, row: this.row }
            });
            this.grid._onLayoutChange();
            
            // Announce to screen readers
            this.grid.announce('Widget moved to column ' + this.col + ', row ' + this.row);
        }
    };

    /**
     * Resize widget
     * @param {number} width - New width in columns
     * @param {number} height - New height in rows
     */
    Widget.prototype.resize = function(width, height) {
        var oldWidth = this.width;
        var oldHeight = this.height;

        this.width = clamp(width, this.minWidth, Math.min(this.maxWidth, this.grid.options.columns - this.col + 1));
        this.height = clamp(height, this.minHeight, this.maxHeight);

        this._updatePosition();

        // Notify component of resize if applicable
        var typeHandler = _widgetTypes.get(this.type);
        if (typeHandler && typeHandler.resize) {
            typeHandler.resize(this);
        }

        if (this._componentInstance && this._componentInstance.resize) {
            this._componentInstance.resize();
        }

        if (this.width !== oldWidth || this.height !== oldHeight) {
            this.grid._emitEvent(EVENTS.WIDGET_RESIZE, {
                widgetId: this.id,
                from: { width: oldWidth, height: oldHeight },
                to: { width: this.width, height: this.height }
            });
            this.grid._onLayoutChange();
            
            // Announce to screen readers
            this.grid.announce('Widget resized to ' + this.width + ' columns by ' + this.height + ' rows');
        }
    };

    /**
     * Set widget data and refresh
     * @param {*} data - New data
     */
    Widget.prototype.setData = function(data) {
        this.data = data;
        this.refresh();
    };

    /**
     * Update widget configuration
     * @param {Object} config - Configuration updates
     */
    Widget.prototype.update = function(config) {
        var key;
        for (key in config) {
            if (config.hasOwnProperty(key)) {
                this.config[key] = config[key];
            }
        }
        
        if (config.title !== undefined) {
            this.title = config.title;
            if (this.headerEl) {
                var titleEl = this.headerEl.querySelector('.' + CLASSES.widgetTitle);
                if (titleEl) titleEl.textContent = this.title;
            }
        }
        this.refresh();
    };

    /**
     * Refresh widget content
     */
    Widget.prototype.refresh = function() {
        this._clearState();
        this.contentEl.innerHTML = '';
        this._renderContent();
        this.grid._emitEvent(EVENTS.WIDGET_UPDATE, { widgetId: this.id });
    };

    /**
     * Clear any widget state (loading, error, empty)
     */
    Widget.prototype._clearState = function() {
        D.one(this.element)
            .classRemove('dashboard-widget--loading')
            .classRemove('dashboard-widget--error')
            .classRemove('dashboard-widget--empty');
        
        var stateEl = this.contentEl.querySelector('.dashboard-widget__state');
        if (stateEl) {
            stateEl.parentNode.removeChild(stateEl);
        }
    };

    /**
     * Show loading state
     * @param {string} [message] - Optional loading message
     */
    Widget.prototype.setLoading = function(message) {
        this._clearState();
        D.one(this.element).classAdd('dashboard-widget--loading');

        var loadingEl = D.create('div')
            .classAdd('dashboard-widget__state', 'dashboard-widget__loading')
            .el;

        var spinner = D.create('div')
            .classAdd('dashboard-widget__spinner')
            .el;
        loadingEl.appendChild(spinner);

        if (message) {
            var text = D.create('span')
                .classAdd('dashboard-widget__loading-text')
                .text(message)
                .el;
            loadingEl.appendChild(text);
        }

        this.contentEl.appendChild(loadingEl);
    };

    /**
     * Show error state
     * @param {string} [errorText] - Error title text
     * @param {string} [errorMessage] - Detailed error message
     * @param {Function} [onRetry] - Retry callback
     */
    Widget.prototype.setError = function(errorText, errorMessage, onRetry) {
        var self = this;
        this._clearState();
        D.one(this.element).classAdd('dashboard-widget--error');

        var errorEl = D.create('div')
            .classAdd('dashboard-widget__state', 'dashboard-widget__error')
            .el;

        var icon = D.create('i')
            .classAdd('dashboard-widget__error-icon', 'fas', 'fa-exclamation-circle')
            .el;
        errorEl.appendChild(icon);

        var text = D.create('span')
            .classAdd('dashboard-widget__error-text')
            .text(errorText || 'Error loading widget')
            .el;
        errorEl.appendChild(text);

        if (errorMessage) {
            var msg = D.create('span')
                .classAdd('dashboard-widget__error-message')
                .text(errorMessage)
                .el;
            errorEl.appendChild(msg);
        }

        if (onRetry || this.config.api) {
            var retryBtn = D.create('button')
                .classAdd('dashboard-widget__retry-btn')
                .attr('type', 'button')
                .text('Retry')
                .on('click', function() {
                    if (typeof onRetry === 'function') {
                        onRetry();
                    } else {
                        self.refresh();
                    }
                })
                .el;
            errorEl.appendChild(retryBtn);
        }

        this.contentEl.appendChild(errorEl);
    };

    /**
     * Show empty state
     * @param {string} [message] - Empty state message
     * @param {string} [icon] - FontAwesome icon class (default: fa-inbox)
     */
    Widget.prototype.setEmpty = function(message, icon) {
        this._clearState();
        D.one(this.element).classAdd('dashboard-widget--empty');

        var emptyEl = D.create('div')
            .classAdd('dashboard-widget__state', 'dashboard-widget__empty')
            .el;

        var iconEl = D.create('i')
            .classAdd('dashboard-widget__empty-icon', 'fas', icon || 'fa-inbox')
            .el;
        emptyEl.appendChild(iconEl);

        var text = D.create('span')
            .classAdd('dashboard-widget__empty-text')
            .text(message || 'No data available')
            .el;
        emptyEl.appendChild(text);

        this.contentEl.appendChild(emptyEl);
    };

    /**
     * Fetch data for livebinding widget (manual trigger)
     * @returns {Widget} this for chaining
     */
    Widget.prototype.fetch = function() {
        if (this._binding && this._binding.fetch) {
            this.setLoading(this.config.loadingText || 'Loading...');
            this._binding.fetch();
        }
        return this;
    };

    /**
     * Pause livebinding polling
     * @returns {Widget} this for chaining
     */
    Widget.prototype.pausePolling = function() {
        if (this._binding && this._binding.pause) {
            this._binding.pause();
            this._pollingPaused = true;
        }
        return this;
    };

    /**
     * Resume livebinding polling
     * @returns {Widget} this for chaining
     */
    Widget.prototype.resumePolling = function() {
        if (this._binding && this._binding.resume) {
            this._binding.resume();
            this._pollingPaused = false;
        }
        return this;
    };

    /**
     * Check if livebinding polling is paused
     * @returns {boolean}
     */
    Widget.prototype.isPollingPaused = function() {
        return !!this._pollingPaused;
    };

    /**
     * Set polling interval for livebinding widget
     * @param {number} interval - Interval in milliseconds (0 = disable)
     * @returns {Widget} this for chaining
     */
    Widget.prototype.setPollingInterval = function(interval) {
        if (this._binding && this._binding.setInterval) {
            this._binding.setInterval(interval);
        }
        this.config.interval = interval;
        return this;
    };

    /**
     * Remove widget from grid
     */
    Widget.prototype.remove = function() {
        this.grid.removeWidget(this.id);
    };

    /**
     * Destroy widget and cleanup
     */
    Widget.prototype.destroy = function() {
        if (this._destroyed) return;
        this._destroyed = true;

        // Destroy nested grid
        if (this._nestedGrid) {
            this._nestedGrid.destroy();
            this._nestedGrid = null;
        }

        // Destroy component instance
        if (this._componentInstance && this._componentInstance.destroy) {
            this._componentInstance.destroy();
        }
        this._componentInstance = null;

        // Destroy binding
        if (this._binding && this._binding.destroy) {
            this._binding.destroy();
        }
        this._binding = null;
        this._vdomPrev = null;

        // Call type handler destroy
        var typeHandler = _widgetTypes.get(this.type);
        if (typeHandler && typeHandler.destroy) {
            typeHandler.destroy(this);
        }

        // Remove element
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.headerEl = null;
        this.contentEl = null;
    };

    /**
     * Serialize widget to JSON
     * @returns {Object}
     */
    Widget.prototype.toJSON = function() {
        var json = {
            id: this.id,
            type: this.type,
            col: this.col,
            row: this.row,
            width: this.width,
            height: this.height,
            title: this.title,
            resizable: this.resizable,
            draggable: this.draggable
        };

        // Add type-specific properties
        if (this.config.html) json.html = this.config.html;
        if (this.config.component) json.component = this.config.component;
        if (this.config.config) json.config = this.config.config;
        if (this.config.api) json.api = this.config.api;
        if (this.config.interval) json.interval = this.config.interval;
        
        // Serialize nested grid with current state (recursive)
        if (this.type === 'grid' && this._nestedGrid) {
            json.gridConfig = {
                columns: this._nestedGrid.options.columns,
                rowHeight: this._nestedGrid.options.rowHeight,
                gap: this._nestedGrid.options.gap,
                editable: this._nestedGrid.options.editable,
                widgets: this._nestedGrid.toJSON().widgets
            };
        } else if (this.config.gridConfig) {
            json.gridConfig = this.config.gridConfig;
        }

        // Add constraints if non-default
        if (this.minWidth !== this.grid.options.minWidgetWidth) json.minWidth = this.minWidth;
        if (this.minHeight !== this.grid.options.minWidgetHeight) json.minHeight = this.minHeight;
        if (this.maxWidth !== this.grid.options.columns) json.maxWidth = this.maxWidth;
        if (this.maxHeight !== Infinity) json.maxHeight = this.maxHeight;

        return json;
    };

    // =========================================================================
    // DASHBOARD GRID CLASS
    // =========================================================================

    /**
     * DashboardGrid - Main grid container
     * @param {Element|string} container - Container element or selector
     * @param {Object} options - Grid options
     */
    function DashboardGrid(container, options) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!this.container) {
            console.error('[DashboardGrid] Container not found:', container);
            return;
        }

        this.id = this.container.id || (options && options.id) || generateId('grid');
        this.options = deepMerge(DashboardGrid.defaults, options || {});

        // Merge data attributes
        var dataOpts = parseGridDataAttributes(this.container);
        this.options = deepMerge(this.options, dataOpts);

        // Widget registry
        this.widgets = {};
        this._widgetCount = 0;

        // State
        this._editMode = this.options.editMode;
        this._dragState = null;
        this._resizeState = null;
        this._boundHandlers = {};
        this._destroyed = false;

        // Parent widget (for nested grids)
        this._parentWidget = options && options.parentWidget || null;

        // Initialize
        this._init();

        // Register instance
        _instances.register(this.id, this);
    }

    /**
     * Default options
     */
    DashboardGrid.defaults = {
        columns: 12,
        rowHeight: 80,
        gap: 16,
        minWidgetWidth: 1,
        minWidgetHeight: 1,
        maxRows: 0,            // 0 = unlimited, positive number limits rows
        constrainToContainer: false, // Prevent dragging outside visible container
        editable: true,
        editMode: false,
        animate: true,
        persist: 'none',       // 'local' | 'api' | 'none'
        storageKey: 'dashboard_layout',
        apiEndpoint: '/api/dashboard/layout',
        widgets: [],
        onLayoutChange: null,
        onWidgetAdd: null,
        onWidgetRemove: null
    };

    /**
     * Initialize grid
     */
    DashboardGrid.prototype._init = function() {
        this._setupContainer();
        this._bindEvents();
        this._loadLayout();
        this._emitEvent(EVENTS.INIT, { gridId: this.id });
    };

    /**
     * Setup container element
     */
    DashboardGrid.prototype._setupContainer = function() {
        var opts = this.options;

        // Add grid class
        D.one(this.container).classAdd(CLASSES.grid);

        // Set CSS custom properties
        this.container.style.setProperty('--grid-columns', opts.columns);
        this.container.style.setProperty('--grid-row-height', typeof opts.rowHeight === 'number' ? opts.rowHeight + 'px' : opts.rowHeight);
        this.container.style.setProperty('--grid-gap', opts.gap + 'px');

        // Set data attributes
        this.container.setAttribute('data-dashboard-grid', '');
        this.container.setAttribute('data-grid-id', this.id);
        this.container.setAttribute('data-editable', opts.editable);
        this.container.setAttribute('data-animate', opts.animate);

        // Edit mode
        if (this._editMode) {
            D.one(this.container).classAdd(CLASSES.gridEditMode);
            this.container.setAttribute('data-edit-mode', 'true');
        }

        // ARIA
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Dashboard grid');

        // Create live region for announcements
        this._createLiveRegion();
    };

    /**
     * Create ARIA live region for screen reader announcements
     */
    DashboardGrid.prototype._createLiveRegion = function() {
        this._liveRegion = D.create('div')
            .classAdd('dashboard-grid__live-region', 'visually-hidden')
            .attr('role', 'status')
            .attr('aria-live', 'polite')
            .attr('aria-atomic', 'true')
            .el;
        this.container.appendChild(this._liveRegion);
    };

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    DashboardGrid.prototype.announce = function(message) {
        if (!this._liveRegion) return;
        
        // Clear and set new message (triggers announcement)
        this._liveRegion.textContent = '';
        var self = this;
        setTimeout(function() {
            self._liveRegion.textContent = message;
        }, 50);
    };

    /**
     * Bind event handlers
     */
    DashboardGrid.prototype._bindEvents = function() {
        var self = this;

        // Drag events
        this._boundHandlers.dragstart = function(e) { self._onDragStart(e); };
        this._boundHandlers.dragover = function(e) { self._onDragOver(e); };
        this._boundHandlers.dragend = function(e) { self._onDragEnd(e); };
        this._boundHandlers.drop = function(e) { self._onDrop(e); };

        this.container.addEventListener('dragstart', this._boundHandlers.dragstart);
        this.container.addEventListener('dragover', this._boundHandlers.dragover);
        this.container.addEventListener('dragend', this._boundHandlers.dragend);
        this.container.addEventListener('drop', this._boundHandlers.drop);

        // Resize events (mousedown on handles)
        this._boundHandlers.mousedown = function(e) { self._onResizeStart(e); };
        this.container.addEventListener('mousedown', this._boundHandlers.mousedown);

        // Touch support
        this._boundHandlers.touchstart = function(e) { self._onTouchStart(e); };
        this.container.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: false });

        // Keyboard support
        this._boundHandlers.keydown = function(e) { self._onKeyDown(e); };
        this.container.addEventListener('keydown', this._boundHandlers.keydown);

        // ResizeObserver for container
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(function() {
                self._onContainerResize();
            });
            this._resizeObserver.observe(this.container);
        }
    };

    /**
     * Load layout from persistence or config
     */
    DashboardGrid.prototype._loadLayout = function() {
        var self = this;
        var layout = null;

        // Try to load from localStorage
        if (this.options.persist === 'local' && window.Funky && Funky.Storage) {
            layout = Funky.Storage.get(this.options.storageKey);
            this._applyLayout(layout);
        }
        // Try to load from API
        else if (this.options.persist === 'api' && window.Funky && Funky.Api) {
            Funky.Api.get(this.options.apiEndpoint)
                .then(function(data) {
                    var apiLayout = data && data.layout ? data.layout : data;
                    self._applyLayout(apiLayout);
                })
                .catch(function(err) {
                    console.warn('[DashboardGrid] Failed to load from API:', err);
                    self._applyLayout(null);
                });
            return; // Async - layout will be applied later
        }
        else {
            this._applyLayout(layout);
        }
    };

    /**
     * Apply layout (from storage or fallback to config)
     */
    DashboardGrid.prototype._applyLayout = function(layout) {
        // Fall back to options
        if (!layout && this.options.widgets && this.options.widgets.length > 0) {
            layout = { widgets: this.options.widgets };
        }

        // Parse declarative widgets from HTML
        var declarativeWidgets = this._parseDeclarativeWidgets();
        if (declarativeWidgets.length > 0) {
            layout = layout || { widgets: [] };
            layout.widgets = layout.widgets.concat(declarativeWidgets);
        }

        if (layout && layout.widgets) {
            this.setLayout(layout);
        }

        this._emitEvent(EVENTS.LOAD, { gridId: this.id, layout: layout });
    };

    /**
     * Parse widgets declared in HTML
     */
    DashboardGrid.prototype._parseDeclarativeWidgets = function() {
        var widgets = [];
        var widgetEls = this.container.querySelectorAll(':scope > ' + SELECTORS.widget);

        for (var i = 0; i < widgetEls.length; i++) {
            var el = widgetEls[i];
            var config = parseWidgetDataAttributes(el);

            // Capture inner HTML as content
            if (!config.type || config.type === 'html') {
                config.type = 'html';
                config.html = el.innerHTML;
            }

            widgets.push(config);

            // Remove the original element (we'll recreate it)
            el.parentNode.removeChild(el);
        }

        return widgets;
    };

    // =========================================================================
    // DRAG & DROP
    // =========================================================================

    DashboardGrid.prototype._onDragStart = function(e) {
        if (!this._editMode) return;

        // Don't start drag if clicking on a resize handle
        if (e.target.closest('.' + CLASSES.resizeHandle)) {
            e.preventDefault();
            return;
        }

        var widgetEl = e.target.closest('.' + CLASSES.widget);
        if (!widgetEl) return;

        var widgetId = widgetEl.getAttribute('data-widget-id');
        var widget = this.widgets[widgetId];
        if (!widget || !widget.draggable) return;

        this._dragState = {
            widgetId: widgetId,
            widget: widget,
            startCol: widget.col,
            startRow: widget.row
        };

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', widgetId);

        // Create custom drag ghost image
        this._createDragGhost(widgetEl, e);

        // Add dragging class after brief delay (for ghost image)
        var self = this;
        setTimeout(function() {
            D.one(widgetEl).classAdd(CLASSES.widgetDragging);
        }, 0);

        // Create placeholder
        this._createDragPlaceholder(widget);

        // Emit dragstart event
        this._emitEvent(EVENTS.WIDGET_MOVE + ':start', {
            widgetId: widgetId,
            col: widget.col,
            row: widget.row
        });
    };

    /**
     * Create custom drag ghost image
     */
    DashboardGrid.prototype._createDragGhost = function(widgetEl, e) {
        // Create a scaled clone for the ghost
        var ghost = widgetEl.cloneNode(true);
        ghost.style.width = widgetEl.offsetWidth + 'px';
        ghost.style.height = widgetEl.offsetHeight + 'px';
        ghost.style.transform = 'scale(0.8)';
        ghost.style.opacity = '0.9';
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        ghost.style.left = '-9999px';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '9999';
        ghost.classList.add('dashboard-widget--drag-ghost');

        document.body.appendChild(ghost);

        // Set the ghost as drag image
        var rect = widgetEl.getBoundingClientRect();
        var offsetX = e.clientX - rect.left;
        var offsetY = e.clientY - rect.top;
        e.dataTransfer.setDragImage(ghost, offsetX * 0.8, offsetY * 0.8);

        // Store reference for cleanup
        this._dragGhost = ghost;

        // Remove ghost after drag starts
        var self = this;
        setTimeout(function() {
            if (self._dragGhost && self._dragGhost.parentNode) {
                self._dragGhost.parentNode.removeChild(self._dragGhost);
            }
            self._dragGhost = null;
        }, 0);
    };

    DashboardGrid.prototype._onDragOver = function(e) {
        if (!this._dragState) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Calculate drop position
        var pos = this._getGridPosition(e.clientX, e.clientY);
        this._updateDragPlaceholder(pos.col, pos.row);

        // Emit dragover event (throttled)
        if (!this._dragOverThrottle) {
            var self = this;
            this._dragOverThrottle = setTimeout(function() {
                self._emitEvent(EVENTS.WIDGET_MOVE + ':over', {
                    widgetId: self._dragState.widgetId,
                    col: pos.col,
                    row: pos.row
                });
                self._dragOverThrottle = null;
            }, 50);
        }
    };

    DashboardGrid.prototype._onDragEnd = function(e) {
        if (!this._dragState) return;

        // Remove dragging class
        var widgetEl = this.container.querySelector('[data-widget-id="' + this._dragState.widgetId + '"]');
        if (widgetEl) {
            D.one(widgetEl).classRemove(CLASSES.widgetDragging);
        }

        // Remove placeholder
        this._removeDragPlaceholder();

        // Cleanup ghost if still present
        if (this._dragGhost && this._dragGhost.parentNode) {
            this._dragGhost.parentNode.removeChild(this._dragGhost);
        }
        this._dragGhost = null;

        // Clear throttle timer
        if (this._dragOverThrottle) {
            clearTimeout(this._dragOverThrottle);
            this._dragOverThrottle = null;
        }

        this._dragState = null;
    };

    DashboardGrid.prototype._onDrop = function(e) {
        if (!this._dragState) return;

        e.preventDefault();

        var pos = this._getGridPosition(e.clientX, e.clientY);
        var widget = this._dragState.widget;

        // Move widget to new position
        widget.moveTo(pos.col, pos.row);

        this._onDragEnd(e);
    };

    DashboardGrid.prototype._createDragPlaceholder = function(widget) {
        this._dragPlaceholder = D.create('div')
            .classAdd(CLASSES.placeholder)
            .el;

        this._dragPlaceholder.style.gridColumn = widget.col + ' / span ' + widget.width;
        this._dragPlaceholder.style.gridRow = widget.row + ' / span ' + widget.height;

        this.container.appendChild(this._dragPlaceholder);
    };

    DashboardGrid.prototype._updateDragPlaceholder = function(col, row) {
        if (!this._dragPlaceholder || !this._dragState) return;

        var widget = this._dragState.widget;
        col = clamp(col, 1, this.options.columns - widget.width + 1);
        row = Math.max(1, row);

        this._dragPlaceholder.style.gridColumn = col + ' / span ' + widget.width;
        this._dragPlaceholder.style.gridRow = row + ' / span ' + widget.height;
    };

    DashboardGrid.prototype._removeDragPlaceholder = function() {
        if (this._dragPlaceholder && this._dragPlaceholder.parentNode) {
            this._dragPlaceholder.parentNode.removeChild(this._dragPlaceholder);
        }
        this._dragPlaceholder = null;
    };

    DashboardGrid.prototype._getGridPosition = function(clientX, clientY) {
        var opts = this.options;
        var rect = this.container.getBoundingClientRect();
        var x = clientX - rect.left;
        var y = clientY - rect.top;

        // Constrain to container bounds if enabled
        if (opts.constrainToContainer) {
            x = clamp(x, 0, rect.width);
            y = clamp(y, 0, rect.height);
        }

        var colWidth = (rect.width - (opts.columns - 1) * opts.gap) / opts.columns;
        var rowHeight = typeof opts.rowHeight === 'number' ? opts.rowHeight : 80;

        var col = Math.floor(x / (colWidth + opts.gap)) + 1;
        var row = Math.floor(y / (rowHeight + opts.gap)) + 1;

        // Apply column constraints
        col = clamp(col, 1, opts.columns);
        
        // Apply row constraints
        row = Math.max(1, row);
        if (opts.maxRows > 0) {
            row = Math.min(row, opts.maxRows);
        }

        // Account for widget size when dragging (prevent overflow)
        if (this._dragState && this._dragState.widget) {
            var widget = this._dragState.widget;
            col = clamp(col, 1, opts.columns - widget.width + 1);
            if (opts.maxRows > 0) {
                row = Math.min(row, opts.maxRows - widget.height + 1);
            }
        }

        return { col: col, row: row };
    };

    // =========================================================================
    // RESIZE
    // =========================================================================

    DashboardGrid.prototype._onResizeStart = function(e) {
        if (!this._editMode) return;

        var handle = e.target.closest('.' + CLASSES.resizeHandle);
        if (!handle) return;

        e.preventDefault();

        var widgetEl = handle.closest('.' + CLASSES.widget);
        var widgetId = widgetEl.getAttribute('data-widget-id');
        var widget = this.widgets[widgetId];

        if (!widget || !widget.resizable) return;

        var direction = handle.getAttribute('data-resize-dir');

        this._resizeState = {
            widgetId: widgetId,
            widget: widget,
            direction: direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: widget.width,
            startHeight: widget.height,
            startCol: widget.col,
            startRow: widget.row
        };

        D.one(widgetEl).classAdd(CLASSES.widgetResizing);

        // Emit resize start event
        this._emitEvent(EVENTS.WIDGET_RESIZE + ':start', {
            widgetId: widgetId,
            direction: direction,
            width: widget.width,
            height: widget.height,
            col: widget.col,
            row: widget.row
        });

        // Add document listeners
        var self = this;
        this._resizeMoveHandler = function(e) { self._onResizeMove(e); };
        this._resizeEndHandler = function(e) { self._onResizeEnd(e); };

        document.addEventListener('mousemove', this._resizeMoveHandler);
        document.addEventListener('mouseup', this._resizeEndHandler);
    };

    DashboardGrid.prototype._onResizeMove = function(e) {
        if (!this._resizeState) return;

        var state = this._resizeState;
        var widget = state.widget;
        var dir = state.direction;

        var deltaX = e.clientX - state.startX;
        var deltaY = e.clientY - state.startY;

        var rect = this.container.getBoundingClientRect();
        var colWidth = (rect.width - (this.options.columns - 1) * this.options.gap) / this.options.columns;
        var rowHeight = typeof this.options.rowHeight === 'number' ? this.options.rowHeight : 80;

        var deltaColsX = Math.round(deltaX / (colWidth + this.options.gap));
        var deltaRowsY = Math.round(deltaY / (rowHeight + this.options.gap));

        var newWidth = state.startWidth;
        var newHeight = state.startHeight;
        var newCol = state.startCol;
        var newRow = state.startRow;

        // Handle resize direction
        if (dir.indexOf('e') !== -1) {
            newWidth = state.startWidth + deltaColsX;
        }
        if (dir.indexOf('w') !== -1) {
            newWidth = state.startWidth - deltaColsX;
            newCol = state.startCol + deltaColsX;
        }
        if (dir.indexOf('s') !== -1) {
            newHeight = state.startHeight + deltaRowsY;
        }
        if (dir.indexOf('n') !== -1) {
            newHeight = state.startHeight - deltaRowsY;
            newRow = state.startRow + deltaRowsY;
        }

        // Apply constraints
        newWidth = clamp(newWidth, widget.minWidth, Math.min(widget.maxWidth, this.options.columns));
        newHeight = clamp(newHeight, widget.minHeight, widget.maxHeight);
        newCol = clamp(newCol, 1, this.options.columns - newWidth + 1);
        newRow = Math.max(1, newRow);

        // Update position and size
        widget.col = newCol;
        widget.row = newRow;
        widget.width = newWidth;
        widget.height = newHeight;
        widget._updatePosition();
    };

    DashboardGrid.prototype._onResizeEnd = function(e) {
        if (!this._resizeState) return;

        var widgetEl = this.container.querySelector('[data-widget-id="' + this._resizeState.widgetId + '"]');
        if (widgetEl) {
            D.one(widgetEl).classRemove(CLASSES.widgetResizing);
        }

        var widget = this._resizeState.widget;
        var state = this._resizeState;

        // Emit resize end event
        this._emitEvent(EVENTS.WIDGET_RESIZE + ':end', {
            widgetId: widget.id,
            direction: state.direction,
            from: { width: state.startWidth, height: state.startHeight, col: state.startCol, row: state.startRow },
            to: { width: widget.width, height: widget.height, col: widget.col, row: widget.row },
            changed: widget.width !== state.startWidth || widget.height !== state.startHeight || 
                     widget.col !== state.startCol || widget.row !== state.startRow
        });

        // Emit events if changed
        if (widget.width !== state.startWidth || widget.height !== state.startHeight) {
            this._emitEvent(EVENTS.WIDGET_RESIZE, {
                widgetId: widget.id,
                from: { width: state.startWidth, height: state.startHeight },
                to: { width: widget.width, height: widget.height }
            });
            this._onLayoutChange();
        }

        if (widget.col !== state.startCol || widget.row !== state.startRow) {
            this._emitEvent(EVENTS.WIDGET_MOVE, {
                widgetId: widget.id,
                from: { col: state.startCol, row: state.startRow },
                to: { col: widget.col, row: widget.row }
            });
        }

        // Cleanup
        document.removeEventListener('mousemove', this._resizeMoveHandler);
        document.removeEventListener('mouseup', this._resizeEndHandler);
        this._resizeMoveHandler = null;
        this._resizeEndHandler = null;
        this._resizeState = null;
    };

    /**
     * Unified touch start handler - routes to drag or resize
     */
    DashboardGrid.prototype._onTouchStart = function(e) {
        if (!this._editMode) return;

        var handle = e.target.closest('.' + CLASSES.resizeHandle);
        var header = e.target.closest('.' + CLASSES.widgetHeader);
        var widgetEl = e.target.closest('.' + CLASSES.widget);

        if (handle) {
            // Route to resize touch handler
            this._onResizeTouchStart(e);
        } else if (header && widgetEl) {
            // Route to drag touch handler
            this._onDragTouchStart(e, widgetEl);
        }
    };

    /**
     * Touch drag start handler
     */
    DashboardGrid.prototype._onDragTouchStart = function(e, widgetEl) {
        var widgetId = widgetEl.getAttribute('data-widget-id');
        var widget = this.widgets[widgetId];
        if (!widget || !widget.draggable) return;

        e.preventDefault();

        var touch = e.touches[0];

        this._dragState = {
            widgetId: widgetId,
            widget: widget,
            startCol: widget.col,
            startRow: widget.row,
            startX: touch.clientX,
            startY: touch.clientY,
            isTouch: true
        };

        D.one(widgetEl).classAdd(CLASSES.widgetDragging);
        this._createDragPlaceholder(widget);

        // Emit dragstart event
        this._emitEvent(EVENTS.WIDGET_MOVE + ':start', {
            widgetId: widgetId,
            col: widget.col,
            row: widget.row
        });

        // Touch move/end handlers
        var self = this;
        var touchMoveHandler = function(e) {
            if (!self._dragState || !self._dragState.isTouch) return;
            e.preventDefault();
            var touch = e.touches[0];
            var pos = self._getGridPosition(touch.clientX, touch.clientY);
            self._updateDragPlaceholder(pos.col, pos.row);
        };

        var touchEndHandler = function(e) {
            if (self._dragState && self._dragState.isTouch) {
                // Calculate final position from last touch position
                var placeholder = self._dragPlaceholder;
                if (placeholder) {
                    var col = parseInt(placeholder.style.gridColumn, 10);
                    var row = parseInt(placeholder.style.gridRow, 10);
                    self._dragState.widget.moveTo(col, row);
                }
                self._onDragEnd(e);
            }
            document.removeEventListener('touchmove', touchMoveHandler);
            document.removeEventListener('touchend', touchEndHandler);
        };

        document.addEventListener('touchmove', touchMoveHandler, { passive: false });
        document.addEventListener('touchend', touchEndHandler);
    };

    DashboardGrid.prototype._onResizeTouchStart = function(e) {
        var handle = e.target.closest('.' + CLASSES.resizeHandle);
        if (!handle || !this._editMode) return;

        e.preventDefault();

        var touch = e.touches[0];
        var fakeEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: e.target,
            preventDefault: function() {}
        };

        this._onResizeStart(fakeEvent);

        // Touch move/end handlers
        var self = this;
        var touchMoveHandler = function(e) {
            var touch = e.touches[0];
            self._onResizeMove({ clientX: touch.clientX, clientY: touch.clientY });
        };
        var touchEndHandler = function(e) {
            self._onResizeEnd(e);
            document.removeEventListener('touchmove', touchMoveHandler);
            document.removeEventListener('touchend', touchEndHandler);
        };

        document.addEventListener('touchmove', touchMoveHandler, { passive: true });
        document.addEventListener('touchend', touchEndHandler);
    };

    // =========================================================================
    // KEYBOARD
    // =========================================================================

    DashboardGrid.prototype._onKeyDown = function(e) {
        if (!this._editMode) return;

        var handle = e.target.closest('.' + CLASSES.resizeHandle);
        var widgetEl = e.target.closest('.' + CLASSES.widget);

        if (!widgetEl) return;

        var widgetId = widgetEl.getAttribute('data-widget-id');
        var widget = this.widgets[widgetId];
        if (!widget) return;

        var step = e.shiftKey ? 2 : 1;

        if (handle) {
            // Resize with arrow keys
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    widget.resize(widget.width + step, widget.height);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    widget.resize(widget.width - step, widget.height);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    widget.resize(widget.width, widget.height + step);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    widget.resize(widget.width, widget.height - step);
                    break;
            }
        } else {
            // Move with arrow keys
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    widget.moveTo(widget.col + step, widget.row);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    widget.moveTo(widget.col - step, widget.row);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    widget.moveTo(widget.col, widget.row + step);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    widget.moveTo(widget.col, widget.row - step);
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    widget.remove();
                    break;
            }
        }
    };

    // =========================================================================
    // CONTAINER RESIZE
    // =========================================================================

    DashboardGrid.prototype._onContainerResize = function() {
        var self = this;
        var widgetId;
        
        for (widgetId in this.widgets) {
            if (this.widgets.hasOwnProperty(widgetId)) {
                var widget = this.widgets[widgetId];
                var typeHandler = _widgetTypes.get(widget.type);
                if (typeHandler && typeHandler.resize) {
                    typeHandler.resize(widget);
                }
                if (widget._componentInstance && widget._componentInstance.resize) {
                    widget._componentInstance.resize();
                }
            }
        }
    };

    // =========================================================================
    // PUBLIC API - WIDGETS
    // =========================================================================

    /**
     * Add a widget to the grid
     * @param {Object} config - Widget configuration
     * @returns {Widget}
     */
    DashboardGrid.prototype.addWidget = function(config) {
        if (!config.id) {
            config.id = generateId('widget');
        }

        // Check for duplicate
        if (this.widgets[config.id]) {
            console.warn('[DashboardGrid] Widget already exists:', config.id);
            return this.widgets[config.id];
        }

        var widget = new Widget(this, config);
        this.widgets[widget.id] = widget;
        this._widgetCount++;
        this.container.appendChild(widget.element);
        
        // Trigger mounted lifecycle hook now that widget is in DOM
        widget._onMounted();

        this._emitEvent(EVENTS.WIDGET_ADD, { widgetId: widget.id, widget: widget.toJSON() });
        this._onLayoutChange();

        // Announce to screen readers
        this.announce('Widget ' + (widget.title || widget.id) + ' added at column ' + widget.col + ', row ' + widget.row);

        if (typeof this.options.onWidgetAdd === 'function') {
            this.options.onWidgetAdd(widget);
        }

        return widget;
    };

    /**
     * Remove a widget from the grid
     * @param {string} id - Widget ID
     * @returns {boolean}
     */
    DashboardGrid.prototype.removeWidget = function(id) {
        var widget = this.widgets[id];
        if (!widget) return false;

        var title = widget.title || id;
        
        widget.destroy();
        delete this.widgets[id];
        this._widgetCount--;

        this._emitEvent(EVENTS.WIDGET_REMOVE, { widgetId: id });
        this._onLayoutChange();

        // Announce to screen readers
        this.announce('Widget ' + title + ' removed');

        if (typeof this.options.onWidgetRemove === 'function') {
            this.options.onWidgetRemove(id);
        }

        return true;
    };

    /**
     * Get widget by ID
     * @param {string} id - Widget ID
     * @returns {Widget|null}
     */
    DashboardGrid.prototype.getWidget = function(id) {
        return this.widgets[id] || null;
    };

    /**
     * Get all widgets
     * @returns {Widget[]}
     */
    DashboardGrid.prototype.getAllWidgets = function() {
        var result = [];
        var id;
        for (id in this.widgets) {
            if (this.widgets.hasOwnProperty(id)) {
                result.push(this.widgets[id]);
            }
        }
        return result;
    };

    // =========================================================================
    // PUBLIC API - EDIT MODE
    // =========================================================================

    /**
     * Enable edit mode
     */
    DashboardGrid.prototype.enableEditMode = function() {
        if (this._editMode) return;
        this._editMode = true;

        D.one(this.container).classAdd(CLASSES.gridEditMode);
        this.container.setAttribute('data-edit-mode', 'true');

        // Enable draggable on widgets
        var id;
        for (id in this.widgets) {
            if (this.widgets.hasOwnProperty(id)) {
                var widget = this.widgets[id];
                if (widget.draggable && widget.element) {
                    widget.element.setAttribute('draggable', 'true');
                }
            }
        }

        this._emitEvent(EVENTS.EDIT_MODE, { enabled: true });
        
        // Announce to screen readers
        this.announce('Edit mode enabled. Use arrow keys to move widgets, Tab to navigate between widgets.');
    };

    /**
     * Disable edit mode
     */
    DashboardGrid.prototype.disableEditMode = function() {
        if (!this._editMode) return;
        this._editMode = false;

        D.one(this.container).classRemove(CLASSES.gridEditMode);
        this.container.setAttribute('data-edit-mode', 'false');

        // Disable draggable on widgets
        var id;
        for (id in this.widgets) {
            if (this.widgets.hasOwnProperty(id)) {
                var widget = this.widgets[id];
                if (widget.element) {
                    widget.element.removeAttribute('draggable');
                }
            }
        }

        this._emitEvent(EVENTS.EDIT_MODE, { enabled: false });
        
        // Announce to screen readers
        this.announce('Edit mode disabled');
    };

    /**
     * Toggle edit mode
     * @returns {boolean} New edit mode state
     */
    DashboardGrid.prototype.toggleEditMode = function() {
        if (this._editMode) {
            this.disableEditMode();
        } else {
            this.enableEditMode();
        }
        return this._editMode;
    };

    /**
     * Check if in edit mode
     * @returns {boolean}
     */
    DashboardGrid.prototype.isEditMode = function() {
        return this._editMode;
    };

    // =========================================================================
    // PUBLIC API - LAYOUT
    // =========================================================================

    /**
     * Get current layout
     * @returns {Object}
     */
    DashboardGrid.prototype.getLayout = function() {
        var widgets = [];
        var id;
        for (id in this.widgets) {
            if (this.widgets.hasOwnProperty(id)) {
                widgets.push(this.widgets[id].toJSON());
            }
        }

        return {
            gridId: this.id,
            columns: this.options.columns,
            rowHeight: this.options.rowHeight,
            gap: this.options.gap,
            widgets: widgets
        };
    };

    /**
     * Serialize grid to JSON (alias for getLayout)
     * @returns {Object}
     */
    DashboardGrid.prototype.toJSON = function() {
        return this.getLayout();
    };

    /**
     * Set layout (clears and rebuilds)
     * @param {Object} layout - Layout object
     */
    DashboardGrid.prototype.setLayout = function(layout) {
        // Clear existing widgets
        this.clearAll();

        // Add widgets from layout
        var self = this;
        if (layout.widgets && Array.isArray(layout.widgets)) {
            for (var i = 0; i < layout.widgets.length; i++) {
                self.addWidget(layout.widgets[i]);
            }
        }
    };

    /**
     * Reset to initial layout
     */
    DashboardGrid.prototype.resetLayout = function() {
        this.setLayout({ widgets: this.options.widgets });
    };

    /**
     * Clear all widgets
     */
    DashboardGrid.prototype.clearAll = function() {
        var ids = [];
        var id;
        for (id in this.widgets) {
            if (this.widgets.hasOwnProperty(id)) {
                ids.push(id);
            }
        }
        
        for (var i = 0; i < ids.length; i++) {
            this.removeWidget(ids[i]);
        }
    };

    // =========================================================================
    // PUBLIC API - PERSISTENCE
    // =========================================================================

    /**
     * Save layout to storage
     * @returns {Object} The saved layout
     */
    DashboardGrid.prototype.save = function() {
        var layout = this.getLayout();

        if (this.options.persist === 'local' && window.Funky && Funky.Storage) {
            Funky.Storage.set(this.options.storageKey, layout);
            this._emitEvent(EVENTS.SAVE, { gridId: this.id, storage: 'local' });
        } else if (this.options.persist === 'api' && window.Funky && Funky.Api) {
            var self = this;
            Funky.Api.post(this.options.apiEndpoint, { layout: layout })
                .then(function() {
                    self._emitEvent(EVENTS.SAVE, { gridId: self.id, storage: 'api' });
                })
                .catch(function(err) {
                    console.error('[DashboardGrid] Failed to save to API:', err);
                    self._emitEvent(EVENTS.SAVE + ':error', { 
                        gridId: self.id, 
                        storage: 'api', 
                        error: err 
                    });
                });
        }

        return layout;
    };

    /**
     * Clear stored layout from persistence
     */
    DashboardGrid.prototype.clearStorage = function() {
        if (this.options.persist === 'local' && window.Funky && Funky.Storage) {
            Funky.Storage.remove(this.options.storageKey);
        } else if (this.options.persist === 'api' && window.Funky && Funky.Api) {
            Funky.Api.delete(this.options.apiEndpoint);
        }
    };

    /**
     * Load layout from storage
     */
    DashboardGrid.prototype.load = function() {
        this._loadLayout();
    };

    /**
     * Export layout as JSON string
     * @returns {string}
     */
    DashboardGrid.prototype.export = function() {
        return JSON.stringify(this.getLayout(), null, 2);
    };

    /**
     * Import layout from JSON
     * @param {string|Object} json - JSON string or object
     * @returns {boolean}
     */
    DashboardGrid.prototype.import = function(json) {
        var layout;
        if (typeof json === 'string') {
            try {
                layout = JSON.parse(json);
            } catch (e) {
                console.error('[DashboardGrid] Invalid JSON:', e);
                return false;
            }
        } else {
            layout = json;
        }

        this.setLayout(layout);
        return true;
    };

    // =========================================================================
    // INTERNAL
    // =========================================================================

    DashboardGrid.prototype._onLayoutChange = function() {
        var self = this;
        var layout = this.getLayout();

        this._emitEvent(EVENTS.LAYOUT_CHANGE, { gridId: this.id, layout: layout });

        if (typeof this.options.onLayoutChange === 'function') {
            this.options.onLayoutChange(layout);
        }

        // Auto-save if enabled (debounced to prevent excessive saves)
        if (this.options.persist !== 'none') {
            if (this._saveDebounce) {
                clearTimeout(this._saveDebounce);
            }
            this._saveDebounce = setTimeout(function() {
                self.save();
                self._saveDebounce = null;
            }, 500);
        }
    };

    DashboardGrid.prototype._emitEvent = function(eventName, data) {
        // Add grid context to event data
        var eventData = deepMerge({
            gridId: this.id,
            isNested: !!this._parentWidget,
            depth: this._getDepth()
        }, data || {});

        // Add parent context if nested
        if (this._parentWidget) {
            eventData.parentWidgetId = this._parentWidget.id;
            eventData.parentGridId = this._parentWidget.grid.id;
        }

        // Emit via Funky.PubSub
        if (window.Funky && Funky.PubSub) {
            Funky.PubSub.emit(eventName, eventData);
        }

        // Also emit via E (DOM events)
        if (E && E.emit) {
            E.emit(this.container, eventName, eventData);
        }

        // Bubble to parent grid if nested
        if (this._parentWidget && this._parentWidget.grid) {
            this._parentWidget.grid._emitEvent(eventName + '.nested', eventData);
        }
    };

    /**
     * Get depth level of this grid (0 = root)
     */
    DashboardGrid.prototype._getDepth = function() {
        var depth = 0;
        var parent = this._parentWidget;
        while (parent) {
            depth++;
            parent = parent.grid._parentWidget;
        }
        return depth;
    };

    /**
     * Get root grid
     */
    DashboardGrid.prototype.getRootGrid = function() {
        var grid = this;
        while (grid._parentWidget) {
            grid = grid._parentWidget.grid;
        }
        return grid;
    };

    // =========================================================================
    // DESTROY
    // =========================================================================

    /**
     * Destroy grid and cleanup
     */
    DashboardGrid.prototype.destroy = function() {
        if (this._destroyed) return;
        this._destroyed = true;

        // Destroy all widgets
        var id;
        for (id in this.widgets) {
            if (this.widgets.hasOwnProperty(id)) {
                this.widgets[id].destroy();
            }
        }
        this.widgets = {};
        this._widgetCount = 0;

        // Remove event listeners
        this.container.removeEventListener('dragstart', this._boundHandlers.dragstart);
        this.container.removeEventListener('dragover', this._boundHandlers.dragover);
        this.container.removeEventListener('dragend', this._boundHandlers.dragend);
        this.container.removeEventListener('drop', this._boundHandlers.drop);
        this.container.removeEventListener('mousedown', this._boundHandlers.mousedown);
        this.container.removeEventListener('touchstart', this._boundHandlers.touchstart);
        this.container.removeEventListener('keydown', this._boundHandlers.keydown);

        // Disconnect resize observer
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // Remove placeholder
        this._removeDragPlaceholder();

        // Clean up container
        D.one(this.container).classRemove(CLASSES.grid, CLASSES.gridEditMode);
        this.container.removeAttribute('data-dashboard-grid');
        this.container.removeAttribute('data-grid-id');
        this.container.removeAttribute('data-edit-mode');

        // Unregister instance
        _instances.unregister(this.id);

        this._emitEvent(EVENTS.DESTROY, { gridId: this.id });
    };

    // =========================================================================
    // STATIC API
    // =========================================================================

    var DashboardGridAPI = {
        /**
         * Initialize a new dashboard grid
         * @param {Element|string} container - Container element or selector
         * @param {Object} options - Grid options
         * @returns {DashboardGrid}
         */
        init: function(container, options) {
            return new DashboardGrid(container, options);
        },

        /**
         * Get instance by ID
         * @param {string} id - Grid ID
         * @returns {DashboardGrid|null}
         */
        getInstance: function(id) {
            return _instances.get(id);
        },

        /**
         * Get all instances
         * @returns {DashboardGrid[]}
         */
        getAllInstances: function() {
            return _instances.getAll();
        },

        /**
         * Destroy all instances
         */
        destroyAll: function() {
            _instances.destroyAll();
        },

        /**
         * Register a custom widget type with optional UI metadata
         * @param {string} name - Type name
         * @param {Object} definition - Type definition with render, resize, destroy methods
         * @param {Object} [meta] - Optional UI metadata for catalog/palette display
         * @param {string} [meta.name] - Display name
         * @param {string} [meta.icon] - FontAwesome icon class (e.g., 'fa-chart-line')
         * @param {string} [meta.category] - Category for filtering (e.g., 'data', 'content', 'utility')
         * @param {string} [meta.description] - Short description
         * @param {string|Function} [meta.preview] - Preview HTML or function returning element
         * @param {Object} [meta.defaults] - Default widget dimensions
         */
        registerWidgetType: function(name, definition, meta) {
            if (_widgetTypes.has(name)) {
                console.warn('[DashboardGrid] Widget type already registered:', name);
            }
            _widgetTypes.register(name, definition);
            
            // Store metadata if provided
            if (meta) {
                _widgetMeta.register(name, {
                    type: name,
                    name: meta.name || name,
                    icon: meta.icon || 'fa-puzzle-piece',
                    category: meta.category || 'general',
                    description: meta.description || '',
                    preview: meta.preview || null,
                    defaults: deepMerge({
                        width: 2,
                        height: 2,
                        minWidth: 1,
                        minHeight: 1
                    }, meta.defaults || {})
                });
            }
        },

        /**
         * Get registered widget type names (simple array)
         * @returns {string[]}
         */
        getWidgetTypeNames: function() {
            return _widgetTypes.list();
        },
        
        /**
         * Get widget types with metadata for catalog display
         * @param {string} [category] - Optional category filter
         * @returns {Object[]} Array of metadata objects
         */
        getWidgetTypes: function(category) {
            var result = [];
            _widgetMeta.forEach(function(meta, name) {
                if (!category || meta.category === category) {
                    result.push(meta);
                }
            });
            return result;
        },
        
        /**
         * Get metadata for a specific widget type
         * @param {string} type - Widget type name
         * @returns {Object|null} Metadata object or null
         */
        getWidgetMeta: function(type) {
            return _widgetMeta.get(type);
        },
        
        /**
         * Get widget type handler (render, destroy, mounted functions)
         * @param {string} type - Widget type name
         * @returns {Object|null} Handler object or null
         */
        getWidgetType: function(type) {
            return _widgetTypes.get(type);
        },
        
        /**
         * Get available widget categories
         * @returns {string[]} Unique category names
         */
        getCategories: function() {
            var categories = {};
            _widgetMeta.forEach(function(meta, name) {
                categories[meta.category] = true;
            });
            return Object.keys(categories).sort();
        },
        
        /**
         * Search widgets by query string (name, type, description)
         * @param {string} query - Search query
         * @returns {Object[]} Matching metadata objects
         */
        searchWidgets: function(query) {
            var results = [];
            var q = (query || '').toLowerCase();
            
            if (!q) {
                return this.getWidgetTypes();
            }
            
            _widgetMeta.forEach(function(meta, name) {
                if (meta.name.toLowerCase().indexOf(q) !== -1 ||
                    meta.type.toLowerCase().indexOf(q) !== -1 ||
                    meta.description.toLowerCase().indexOf(q) !== -1 ||
                    meta.category.toLowerCase().indexOf(q) !== -1) {
                    results.push(meta);
                }
            });
            return results;
        },

        /**
         * Auto-initialize grids from HTML
         * @param {Element} container - Container to search in
         * @returns {DashboardGrid[]}
         */
        initAll: function(container) {
            container = container || document;
            var grids = container.querySelectorAll(SELECTORS.grid);
            var instances = [];

            for (var i = 0; i < grids.length; i++) {
                var el = grids[i];
                // Skip if already initialized
                if (el.getAttribute('data-grid-id')) continue;
                instances.push(new DashboardGrid(el));
            }

            return instances;
        },

        // Expose constants
        EVENTS: EVENTS,
        CLASSES: CLASSES,

        // Expose defaults
        defaults: DashboardGrid.defaults
    };

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    Funky.register('DashboardGrid', DashboardGridAPI);
    
    // =========================================================================
    // REGISTER BUILT-IN WIDGET TYPE METADATA
    // =========================================================================
    
    // Add metadata for built-in types (handled via switch/case in _renderContent)
    // These don't need render handlers as they're built-in, just catalog metadata
    
    _widgetMeta['html'] = {
        type: 'html',
        name: 'HTML Content',
        icon: 'fa-code',
        category: 'content',
        description: 'Render raw HTML content',
        preview: '<div style="font-family:monospace;font-size:0.8em;opacity:0.7">&lt;html&gt;</div>',
        defaults: { width: 2, height: 2, minWidth: 1, minHeight: 1 }
    };
    
    _widgetMeta['dom'] = {
        type: 'dom',
        name: 'DOM Element',
        icon: 'fa-cube',
        category: 'advanced',
        description: 'Render a Funky.Dom element via render function',
        preview: '<div style="text-align:center"><i class="fas fa-cube" style="font-size:1.5rem;opacity:0.5"></i></div>',
        defaults: { width: 2, height: 2, minWidth: 1, minHeight: 1 }
    };
    
    _widgetMeta['vdom'] = {
        type: 'vdom',
        name: 'Virtual DOM',
        icon: 'fa-project-diagram',
        category: 'advanced',
        description: 'Render using Funky.VDom virtual DOM',
        preview: '<div style="text-align:center"><i class="fas fa-project-diagram" style="font-size:1.5rem;opacity:0.5"></i></div>',
        defaults: { width: 2, height: 2, minWidth: 1, minHeight: 1 }
    };
    
    _widgetMeta['component'] = {
        type: 'component',
        name: 'Component',
        icon: 'fa-puzzle-piece',
        category: 'advanced',
        description: 'Embed a registered Funky component',
        preview: '<div style="text-align:center"><i class="fas fa-puzzle-piece" style="font-size:1.5rem;opacity:0.5"></i></div>',
        defaults: { width: 3, height: 2, minWidth: 2, minHeight: 2 }
    };
    
    _widgetMeta['livebinding'] = {
        type: 'livebinding',
        name: 'Live Binding',
        icon: 'fa-link',
        category: 'advanced',
        description: 'Reactive data binding with auto-updates',
        preview: '<div style="text-align:center"><i class="fas fa-link" style="font-size:1.5rem;opacity:0.5"></i></div>',
        defaults: { width: 3, height: 2, minWidth: 2, minHeight: 2 }
    };
    
    _widgetMeta['grid'] = {
        type: 'grid',
        name: 'Nested Grid',
        icon: 'fa-th',
        category: 'layout',
        description: 'Nested dashboard grid for complex layouts',
        preview: '<div style="text-align:center"><i class="fas fa-th" style="font-size:1.5rem;opacity:0.5"></i></div>',
        defaults: { width: 6, height: 4, minWidth: 3, minHeight: 2 }
    };
    
    // =========================================================================
    // REGISTER BUILT-IN WIDGET TEMPLATES
    // =========================================================================
    
    // Stats Card - display a key metric with optional trend
    DashboardGridAPI.registerWidgetType('stats', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div')
                .classAdd('widget-stats')
                .style({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '1rem',
                    textAlign: 'center'
                });
            
            // Icon (optional)
            if (config.icon) {
                D.create('div')
                    .classAdd('widget-stats__icon')
                    .style({ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: '0.7' })
                    .html('<i class="fas ' + config.icon + '"></i>')
                    .appendTo(container);
            }
            
            var value = D.create('div')
                .classAdd('widget-stats__value')
                .style({ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' })
                .text(config.value !== undefined ? config.value : '—');
            
            var label = D.create('div')
                .classAdd('widget-stats__label')
                .style({ fontSize: '0.875rem', opacity: '0.7', marginTop: '0.25rem' })
                .text(config.label || 'Metric');
            
            container.append(value).append(label);
            
            if (config.trend !== undefined && config.trend !== null) {
                var isPositive = config.trend > 0;
                var trend = D.create('div')
                    .classAdd('widget-stats__trend')
                    .style({
                        marginTop: '0.5rem',
                        fontSize: '0.875rem',
                        color: isPositive ? 'var(--pro-success, #28a745)' : 'var(--pro-danger, #dc3545)'
                    })
                    .html('<i class="fas ' + (isPositive ? 'fa-arrow-up' : 'fa-arrow-down') + '"></i> ' + 
                          Math.abs(config.trend) + '%');
                container.append(trend);
            }
            
            return container;
        },
        // Default config when added from catalog
        getDefaultConfig: function() {
            var samples = [
                { value: '1,234', label: 'Total Users', icon: 'fa-users', trend: 12.5 },
                { value: '$45.2K', label: 'Revenue', icon: 'fa-dollar-sign', trend: 8.3 },
                { value: '89%', label: 'Uptime', icon: 'fa-server', trend: 2.1 },
                { value: '156', label: 'Active Sessions', icon: 'fa-signal', trend: -3.2 },
                { value: '4.8', label: 'Avg Rating', icon: 'fa-star', trend: 0.5 }
            ];
            return samples[Math.floor(Math.random() * samples.length)];
        }
    }, {
        name: 'Stats Card',
        icon: 'fa-chart-line',
        category: 'data',
        description: 'Display a key metric with optional trend indicator',
        preview: '<div style="text-align:center"><div style="font-size:2rem;font-weight:bold">1,234</div><div style="opacity:0.7">Users</div><div style="color:#28a745;font-size:0.8em">↑ 12%</div></div>',
        defaults: { width: 2, height: 2, minWidth: 1, minHeight: 1 }
    });
    
    // Info Card - display information with icon and text
    DashboardGridAPI.registerWidgetType('info', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div')
                .classAdd('widget-info')
                .style({
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: '1rem'
                });
            
            // Header with icon
            if (config.icon || config.title) {
                var header = D.create('div')
                    .classAdd('widget-info__header')
                    .style({ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '0.75rem',
                        gap: '0.5rem'
                    });
                
                if (config.icon) {
                    D.create('div')
                        .classAdd('widget-info__icon')
                        .style({ 
                            fontSize: '1.25rem', 
                            color: config.iconColor || 'var(--pro-primary, #007bff)'
                        })
                        .html('<i class="fas ' + config.icon + '"></i>')
                        .appendTo(header);
                }
                
                if (config.title) {
                    D.create('div')
                        .classAdd('widget-info__title')
                        .style({ fontWeight: '600', fontSize: '1rem' })
                        .text(config.title)
                        .appendTo(header);
                }
                
                container.append(header);
            }
            
            if (config.content) {
                D.create('div')
                    .classAdd('widget-info__content')
                    .style({ fontSize: '0.875rem', lineHeight: '1.5', opacity: '0.85' })
                    .html(config.content)
                    .appendTo(container);
            }
            
            return container;
        },
        getDefaultConfig: function() {
            var samples = [
                { 
                    icon: 'fa-lightbulb', 
                    title: 'Quick Tip', 
                    iconColor: 'var(--pro-warning, #ffc107)',
                    content: 'Drag widgets to rearrange. Use corner handles to resize. Toggle edit mode to lock the layout.'
                },
                { 
                    icon: 'fa-bell', 
                    title: 'Notifications', 
                    iconColor: 'var(--pro-info, #17a2b8)',
                    content: 'You have <strong>3 new messages</strong> and <strong>5 pending tasks</strong> requiring your attention.'
                },
                { 
                    icon: 'fa-calendar-check', 
                    title: 'Upcoming', 
                    iconColor: 'var(--pro-success, #28a745)',
                    content: 'Team standup in <strong>30 minutes</strong><br>Project deadline: <strong>Dec 31</strong>'
                }
            ];
            return samples[Math.floor(Math.random() * samples.length)];
        }
    }, {
        name: 'Info Card',
        icon: 'fa-info-circle',
        category: 'content',
        description: 'Display information with icon and text',
        preview: '<div style="text-align:center"><i class="fas fa-lightbulb" style="font-size:1.5rem;color:#ffc107"></i><div style="font-size:0.9em;margin-top:4px">Quick Tip</div></div>',
        defaults: { width: 3, height: 2, minWidth: 2, minHeight: 1 }
    });
    
    // Activity List - display a list of items or activities
    DashboardGridAPI.registerWidgetType('list', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div')
                .classAdd('widget-list')
                .style({
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: '0.75rem'
                });
            
            if (config.title) {
                D.create('div')
                    .classAdd('widget-list__title')
                    .style({ 
                        fontWeight: '600', 
                        marginBottom: '0.75rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid var(--pro-border, #dee2e6)'
                    })
                    .text(config.title)
                    .appendTo(container);
            }
            
            var list = D.create('ul')
                .classAdd('widget-list__items')
                .style({
                    listStyle: 'none',
                    margin: '0',
                    padding: '0',
                    overflow: 'auto',
                    flex: '1'
                });
            
            var items = config.items || [];
            
            // Show empty state if no items
            if (items.length === 0) {
                D.create('div')
                    .style({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        opacity: '0.5',
                        textAlign: 'center'
                    })
                    .html('<i class="fas fa-list" style="font-size:2rem;margin-bottom:0.5rem"></i><div>No items</div>')
                    .appendTo(container);
                return container;
            }
            
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (!item) continue;  // Skip undefined/null items
                
                var li = D.create('li')
                    .classAdd('widget-list__item')
                    .style({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0',
                        borderBottom: i < items.length - 1 ? '1px solid var(--pro-border-light, #f0f0f0)' : 'none',
                        fontSize: '0.875rem'
                    });
                
                if (typeof item === 'string') {
                    li.text(item);
                } else {
                    if (item.icon) {
                        D.create('i')
                            .classAdd('fas ' + item.icon)
                            .style({ 
                                width: '1.25rem', 
                                textAlign: 'center',
                                color: item.iconColor || 'var(--pro-text-muted, #6c757d)'
                            })
                            .appendTo(li);
                    }
                    var textSpan = D.create('span')
                        .style({ flex: '1' })
                        .text(item.text || item.label || '');
                    li.append(textSpan);
                    
                    if (item.badge) {
                        D.create('span')
                            .style({
                                fontSize: '0.75rem',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '1rem',
                                background: item.badgeColor || 'var(--pro-primary, #007bff)',
                                color: '#fff'
                            })
                            .text(item.badge)
                            .appendTo(li);
                    }
                    
                    if (item.time) {
                        D.create('span')
                            .style({ fontSize: '0.75rem', opacity: '0.6' })
                            .text(item.time)
                            .appendTo(li);
                    }
                }
                
                list.append(li);
            }
            
            container.append(list);
            return container;
        },
        getDefaultConfig: function() {
            return {
                title: 'Recent Activity',
                items: [
                    { icon: 'fa-user-plus', iconColor: 'var(--pro-success, #28a745)', text: 'New user registered', time: '2m ago' },
                    { icon: 'fa-shopping-cart', iconColor: 'var(--pro-primary, #007bff)', text: 'Order #1234 placed', badge: '$299', time: '5m ago' },
                    { icon: 'fa-comment', iconColor: 'var(--pro-info, #17a2b8)', text: 'New comment on post', time: '12m ago' },
                    { icon: 'fa-check-circle', iconColor: 'var(--pro-success, #28a745)', text: 'Task completed', time: '1h ago' },
                    { icon: 'fa-exclamation-triangle', iconColor: 'var(--pro-warning, #ffc107)', text: 'Server CPU spike', badge: '85%', badgeColor: 'var(--pro-warning, #ffc107)', time: '2h ago' }
                ]
            };
        }
    }, {
        name: 'Activity List',
        icon: 'fa-list',
        category: 'content',
        description: 'Display a list of items or activities',
        preview: '<div><div style="font-weight:bold;margin-bottom:4px">Recent Activity</div><div style="opacity:0.7;font-size:0.85em">• New user registered<br>• Order placed</div></div>',
        defaults: { width: 3, height: 3, minWidth: 2, minHeight: 2 }
    });
    
    // Clock - display current time
    DashboardGridAPI.registerWidgetType('clock', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div').classAdd('widget-clock');
            
            // Use Funky.Clock.init if available (it's an object with methods, not a constructor)
            if (typeof Funky !== 'undefined' && Funky.Clock && typeof Funky.Clock.init === 'function') {
                var clockEl = D.create('div');
                clockEl.attr('data-clock', '');
                if (config.format) {
                    clockEl.attr('data-format', config.format);
                }
                if (config.timezone) {
                    clockEl.attr('data-timezone', config.timezone);
                }
                container.append(clockEl);
                
                // Store reference for mounted hook
                widget._clockEl = clockEl.el;
            } else {
                // Fallback: simple time display with styling
                var timeEl = D.create('div')
                    .classAdd('widget-clock__time')
                    .style({
                        fontSize: '1.5rem',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        padding: '0.5rem'
                    });
                container.append(timeEl);
                
                var updateTime = function() {
                    var now = new Date();
                    timeEl.text(now.toLocaleTimeString());
                };
                
                updateTime();
                widget._clockInterval = setInterval(updateTime, 1000);
            }
            
            return container;
        },
        mounted: function(widget, config) {
            // Initialize Funky.Clock now that element is in DOM
            // Pass the clock element directly (Clock.init now accepts this)
            if (widget._clockEl && Funky.Clock && typeof Funky.Clock.init === 'function') {
                Funky.Clock.init(widget._clockEl);
            }
        },
        destroy: function(widget) {
            if (widget._clockEl && Funky.Clock && typeof Funky.Clock.destroyAll === 'function') {
                // Clock component doesn't have individual destroy, just clear the element
                widget._clockEl.innerHTML = '';
            }
            if (widget._clockInterval) {
                clearInterval(widget._clockInterval);
            }
        }
    }, {
        name: 'Clock',
        icon: 'fa-clock',
        category: 'utility',
        description: 'Display current time with optional timezone',
        preview: '<div style="text-align:center;font-size:1.5rem;font-family:monospace">12:34:56</div>',
        defaults: { width: 2, height: 1, minWidth: 2, minHeight: 1 }
    });
    
    // Chart - display charts using Plotly or Chart.js
    DashboardGridAPI.registerWidgetType('chart', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div')
                .classAdd('widget-chart')
                .style({
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                });
            
            // Check for charting library
            if (typeof Plotly !== 'undefined' && config.plotly) {
                var chartEl = D.create('div')
                    .classAdd('widget-chart__canvas')
                    .style({ flex: '1', minHeight: '0' });
                container.append(chartEl);
                widget._plotlyEl = chartEl.el;
            } else if (typeof Chart !== 'undefined' && config.chartjs) {
                var canvasWrapper = D.create('div')
                    .style({ flex: '1', minHeight: '0', position: 'relative' });
                var canvas = D.create('canvas').classAdd('widget-chart__canvas');
                canvasWrapper.append(canvas);
                container.append(canvasWrapper);
                widget._chartCanvas = canvas.el;
                widget._chartConfig = config.chartjs;
            } else {
                // Placeholder with nice styling
                container
                    .classAdd('widget-chart--placeholder')
                    .style({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--pro-bg-secondary, #f8f9fa) 0%, var(--pro-bg-tertiary, #e9ecef) 100%)',
                        borderRadius: 'var(--pro-radius-sm, 0.25rem)'
                    });
                D.create('i')
                    .classAdd('fas fa-chart-area')
                    .style({ fontSize: '3rem', opacity: '0.3', marginBottom: '0.75rem' })
                    .appendTo(container);
                D.create('div')
                    .style({ fontSize: '0.875rem', opacity: '0.6' })
                    .text(config.placeholder || 'Chart requires Plotly or Chart.js')
                    .appendTo(container);
                D.create('div')
                    .style({ fontSize: '0.75rem', opacity: '0.5', marginTop: '0.25rem' })
                    .text('Configure plotly or chartjs in widget config')
                    .appendTo(container);
            }
            
            return container;
        },
        mounted: function(widget, config) {
            // Initialize chart after mount for proper sizing
            if (widget._plotlyEl && typeof Plotly !== 'undefined' && config.plotly) {
                Plotly.newPlot(widget._plotlyEl, config.plotly.data || [], config.plotly.layout || {}, { responsive: true });
            }
            if (widget._chartCanvas && widget._chartConfig && typeof Chart !== 'undefined') {
                widget._chartInstance = new Chart(widget._chartCanvas, widget._chartConfig);
            }
        },
        resize: function(widget, config) {
            if (widget._plotlyEl && typeof Plotly !== 'undefined') {
                Plotly.Plots.resize(widget._plotlyEl);
            }
            if (widget._chartInstance) {
                widget._chartInstance.resize();
            }
        },
        destroy: function(widget) {
            if (widget._plotlyEl && typeof Plotly !== 'undefined') {
                Plotly.purge(widget._plotlyEl);
            }
            if (widget._chartInstance) {
                widget._chartInstance.destroy();
            }
        }
    }, {
        name: 'Chart',
        icon: 'fa-chart-bar',
        category: 'data',
        description: 'Display charts using Plotly or Chart.js',
        preview: '<div style="text-align:center;padding:0.5rem"><i class="fas fa-chart-area" style="font-size:2rem;opacity:0.4"></i><div style="font-size:0.8em;opacity:0.6;margin-top:4px">Requires Plotly/Chart.js</div></div>',
        defaults: { width: 4, height: 3, minWidth: 2, minHeight: 2 }
    });
    
    // Iframe Embed - embed external content
    DashboardGridAPI.registerWidgetType('iframe', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div')
                .classAdd('widget-iframe')
                .style({ height: '100%' });
            
            if (config.src) {
                var iframe = D.create('iframe')
                    .classAdd('widget-iframe__frame')
                    .style({ width: '100%', height: '100%', border: 'none' })
                    .attr('src', config.src)
                    .attr('frameborder', '0')
                    .attr('allowfullscreen', 'true');
                
                if (config.sandbox !== false) {
                    iframe.attr('sandbox', config.sandbox || 'allow-scripts allow-same-origin');
                }
                
                container.append(iframe);
            } else {
                container
                    .classAdd('widget-iframe--empty')
                    .style({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--pro-bg-secondary, #f8f9fa) 0%, var(--pro-bg-tertiary, #e9ecef) 100%)',
                        borderRadius: 'var(--pro-radius-sm, 0.25rem)'
                    });
                D.create('i')
                    .classAdd('fas fa-globe')
                    .style({ fontSize: '3rem', opacity: '0.3', marginBottom: '0.75rem' })
                    .appendTo(container);
                D.create('div')
                    .style({ fontSize: '0.875rem', opacity: '0.6' })
                    .text('No URL configured')
                    .appendTo(container);
                D.create('div')
                    .style({ fontSize: '0.75rem', opacity: '0.5', marginTop: '0.25rem' })
                    .text('Set src in widget config')
                    .appendTo(container);
            }
            
            return container;
        }
    }, {
        name: 'Embed',
        icon: 'fa-globe',
        category: 'content',
        description: 'Embed external content via iframe',
        preview: '<div style="text-align:center"><i class="fas fa-globe" style="font-size:1.5rem;opacity:0.5"></i><div style="font-size:0.9em">Embed</div></div>',
        defaults: { width: 4, height: 3, minWidth: 2, minHeight: 2 }
    });
    
    // Progress Widget - display progress towards a goal
    DashboardGridAPI.registerWidgetType('progress', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div')
                .classAdd('widget-progress')
                .style({
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: '1rem',
                    justifyContent: 'center'
                });
            
            // Title
            if (config.title) {
                D.create('div')
                    .classAdd('widget-progress__title')
                    .style({ fontWeight: '600', marginBottom: '0.75rem' })
                    .text(config.title)
                    .appendTo(container);
            }
            
            var percent = Math.min(100, Math.max(0, config.value || 0));
            var color = config.color || 'var(--pro-primary, #007bff)';
            
            // Progress bar container
            var barContainer = D.create('div')
                .classAdd('widget-progress__bar-container')
                .style({
                    height: '0.75rem',
                    background: 'var(--pro-bg-secondary, #e9ecef)',
                    borderRadius: '0.5rem',
                    overflow: 'hidden'
                });
            
            // Progress bar fill
            D.create('div')
                .classAdd('widget-progress__bar-fill')
                .style({
                    width: percent + '%',
                    height: '100%',
                    background: color,
                    borderRadius: '0.5rem',
                    transition: 'width 0.3s ease'
                })
                .appendTo(barContainer);
            
            container.append(barContainer);
            
            // Stats row
            var statsRow = D.create('div')
                .classAdd('widget-progress__stats')
                .style({
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    fontSize: '0.875rem'
                });
            
            D.create('span')
                .style({ fontWeight: '600' })
                .text(percent + '%')
                .appendTo(statsRow);
            
            if (config.goal) {
                D.create('span')
                    .style({ opacity: '0.6' })
                    .text(config.current + ' / ' + config.goal + (config.unit ? ' ' + config.unit : ''))
                    .appendTo(statsRow);
            }
            
            container.append(statsRow);
            
            return container;
        },
        getDefaultConfig: function() {
            var samples = [
                { title: 'Monthly Goal', value: 73, current: 7300, goal: 10000, unit: 'users', color: 'var(--pro-success, #28a745)' },
                { title: 'Storage Used', value: 45, current: 45, goal: 100, unit: 'GB', color: 'var(--pro-primary, #007bff)' },
                { title: 'Tasks Complete', value: 82, current: 41, goal: 50, unit: 'tasks', color: 'var(--pro-info, #17a2b8)' },
                { title: 'Budget Spent', value: 68, current: 68000, goal: 100000, unit: '$', color: 'var(--pro-warning, #ffc107)' }
            ];
            return samples[Math.floor(Math.random() * samples.length)];
        }
    }, {
        name: 'Progress',
        icon: 'fa-tasks',
        category: 'data',
        description: 'Display progress towards a goal',
        preview: '<div style="padding:0.5rem"><div style="font-size:0.9em;margin-bottom:4px">Goal Progress</div><div style="height:8px;background:#e9ecef;border-radius:4px;overflow:hidden"><div style="width:73%;height:100%;background:#28a745"></div></div><div style="font-size:0.8em;opacity:0.7;margin-top:2px">73%</div></div>',
        defaults: { width: 3, height: 2, minWidth: 2, minHeight: 1 }
    });
    
    // Quick Actions Widget - buttons/links grid
    DashboardGridAPI.registerWidgetType('actions', {
        render: function(widget, config) {
            config = config || {};
            
            var container = D.create('div')
                .classAdd('widget-actions')
                .style({
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: '0.75rem'
                });
            
            if (config.title) {
                D.create('div')
                    .classAdd('widget-actions__title')
                    .style({ 
                        fontWeight: '600', 
                        marginBottom: '0.75rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid var(--pro-border, #dee2e6)'
                    })
                    .text(config.title)
                    .appendTo(container);
            }
            
            var grid = D.create('div')
                .classAdd('widget-actions__grid')
                .style({
                    display: 'grid',
                    gridTemplateColumns: 'repeat(' + (config.columns || 2) + ', 1fr)',
                    gap: '0.5rem',
                    flex: '1'
                });
            
            var actions = config.actions || [];
            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                var btn = D.create('button')
                    .classAdd('widget-actions__btn')
                    .style({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.75rem 0.5rem',
                        border: '1px solid var(--pro-border, #dee2e6)',
                        borderRadius: 'var(--pro-radius-sm, 0.25rem)',
                        background: action.color || 'var(--pro-surface, #fff)',
                        color: action.textColor || 'inherit',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontSize: '0.75rem'
                    })
                    .attr('type', 'button')
                    .attr('title', action.label);
                
                if (action.icon) {
                    D.create('i')
                        .classAdd('fas ' + action.icon)
                        .style({ fontSize: '1.25rem', marginBottom: '0.25rem' })
                        .appendTo(btn);
                }
                
                D.create('span')
                    .text(action.label)
                    .appendTo(btn);
                
                // Hover effect
                (function(b) {
                    b.on('mouseenter', function() {
                        b.style({ transform: 'translateY(-2px)', boxShadow: 'var(--pro-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))' });
                    });
                    b.on('mouseleave', function() {
                        b.style({ transform: 'none', boxShadow: 'none' });
                    });
                })(btn);
                
                grid.append(btn);
            }
            
            container.append(grid);
            return container;
        },
        getDefaultConfig: function() {
            return {
                title: 'Quick Actions',
                columns: 2,
                actions: [
                    { icon: 'fa-plus', label: 'New', color: 'var(--pro-primary-bg, rgba(0,123,255,0.1))' },
                    { icon: 'fa-upload', label: 'Upload' },
                    { icon: 'fa-download', label: 'Export' },
                    { icon: 'fa-cog', label: 'Settings' },
                    { icon: 'fa-share', label: 'Share' },
                    { icon: 'fa-question-circle', label: 'Help' }
                ]
            };
        }
    }, {
        name: 'Quick Actions',
        icon: 'fa-th-large',
        category: 'utility',
        description: 'Grid of action buttons',
        preview: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px"><div style="padding:8px;background:#f0f0f0;border-radius:4px;text-align:center;font-size:0.75em">+</div><div style="padding:8px;background:#f0f0f0;border-radius:4px;text-align:center;font-size:0.75em">↑</div></div>',
        defaults: { width: 2, height: 3, minWidth: 2, minHeight: 2 }
    });

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DashboardGridAPI.initAll();
        });
    } else {
        DashboardGridAPI.initAll();
    }

})(window);
