/**
 * Funky.WidgetCatalog
 * Modal-based widget browser for DashboardGrid
 * 
 * @example
 * var catalog = new Funky.WidgetCatalog({
 *     grid: dashboardGridInstance,
 *     onAdd: function(type, config) { console.log('Added:', type); }
 * });
 * catalog.open();
 */
(function(global) {
    'use strict';
    
    // Ensure Funky namespace exists
    if (!global.Funky) {
        console.error('[Funky.WidgetCatalog] Funky namespace not found.');
        return;
    }
    
    var Funky = global.Funky;
    var D = Funky.Dom;
    var E = Funky.Events;
    
    /**
     * Get SelectableList at runtime to avoid load order issues
     */
    function getSelectableList() {
        return Funky.SelectableList || null;
    }
    
    var CLASSES = {
        modal: 'widget-catalog',
        overlay: 'widget-catalog__overlay',
        dialog: 'widget-catalog__dialog',
        header: 'widget-catalog__header',
        title: 'widget-catalog__title',
        close: 'widget-catalog__close',
        body: 'widget-catalog__body',
        sidebar: 'widget-catalog__sidebar',
        search: 'widget-catalog__search',
        searchInput: 'widget-catalog__search-input',
        categories: 'widget-catalog__categories',
        categoryBtn: 'widget-catalog__category',
        categoryActive: 'widget-catalog__category--active',
        content: 'widget-catalog__content',
        grid: 'widget-catalog__grid',
        card: 'widget-catalog__card',
        cardSelected: 'widget-catalog__card--selected',
        cardIcon: 'widget-catalog__card-icon',
        cardName: 'widget-catalog__card-name',
        cardDesc: 'widget-catalog__card-desc',
        preview: 'widget-catalog__preview',
        previewTitle: 'widget-catalog__preview-title',
        previewContent: 'widget-catalog__preview-content',
        previewMeta: 'widget-catalog__preview-meta',
        previewEmpty: 'widget-catalog__preview-empty',
        empty: 'widget-catalog__empty',
        footer: 'widget-catalog__footer',
        addBtn: 'widget-catalog__add-btn'
    };
    
    /**
     * @constructor
     * @param {Object} options
     * @param {DashboardGrid} options.grid - Target grid instance
     * @param {Function} [options.onAdd] - Callback when widget added
     * @param {Function} [options.onClose] - Callback when modal closed
     */
    function WidgetCatalog(options) {
        var defaults = {
            grid: null,
            onAdd: null,
            onClose: null
        };
        
        this.options = {};
        for (var key in defaults) {
            if (defaults.hasOwnProperty(key)) {
                this.options[key] = (options && options[key] !== undefined) ? options[key] : defaults[key];
            }
        }
        
        this._selectedType = null;
        this._currentCategory = null;
        this._searchQuery = '';
        this._modal = null;
        this._elements = {};
        this._escHandler = null;
        this._categoryList = null;  // SelectableList for categories
        this._widgetList = null;    // SelectableList for widgets
        this.isOpen = false;        // Track open state for toggle()
        
        this._init();
    }
    
    WidgetCatalog.prototype._init = function() {
        this._buildModal();
        this._bindEvents();
    };
    
    /**
     * Initialize SelectableList for category sidebar
     * Called after modal is added to DOM
     */
    WidgetCatalog.prototype._initCategoryList = function() {
        var self = this;
        var SL = getSelectableList();
        
        if (!SL || typeof SL.init !== 'function') {
            return; // Fall back to legacy rendering
        }
        
        var container = this._elements.categories.el;
        
        // Build category items
        var categoryItems = this._buildCategoryItems();
        
        this._categoryList = SL.init(container, {
            items: categoryItems,
            selectable: 'single',
            keyboard: true,
            wrapAround: true,
            ariaLabel: 'Widget categories',
            orientation: 'vertical',
            
            getItemKey: function(cat) {
                return cat.id;
            },
            
            renderItem: function(cat, index, state) {
                return self._renderCategoryItem(cat, state);
            },
            
            onSelect: function(selectedItems) {
                if (selectedItems.length > 0) {
                    var catId = selectedItems[0].id;
                    self._currentCategory = catId === 'all' ? null : catId;
                    self._renderWidgets();
                }
            }
        });
        
        // Select "All" by default
        this._categoryList.select('all');
    };
    
    /**
     * Build category items array
     */
    WidgetCatalog.prototype._buildCategoryItems = function() {
        var items = [{ id: 'all', name: 'All' }];
        var categories = Funky.DashboardGrid.getCategories();
        
        for (var i = 0; i < categories.length; i++) {
            items.push({
                id: categories[i],
                name: this._formatCategory(categories[i])
            });
        }
        
        return items;
    };
    
    /**
     * Render a single category item
     */
    WidgetCatalog.prototype._renderCategoryItem = function(cat, state) {
        return '<span class="widget-catalog__category-name">' + this._escapeHtml(cat.name) + '</span>';
    };
    
    /**
     * Set up keyboard navigation between category and widget lists
     * Uses Funky.Keyboard to register left/right in each list's scope
     */
    WidgetCatalog.prototype._setupCrossListNavigation = function() {
        var self = this;
        var Keyboard = global.Funky && global.Funky.Keyboard;
        
        if (!this._categoryList || !this._widgetList || !Keyboard) {
            console.warn('[WidgetCatalog] Cannot setup cross-nav:', {
                categoryList: !!this._categoryList,
                widgetList: !!this._widgetList,
                keyboard: !!Keyboard
            });
            return;
        }
        
        // Store unregister functions for cleanup
        this._crossNavUnregisters = [];
        
        var catScope = this._categoryList._keyboardScope;
        var widgetScope = this._widgetList._keyboardScope;
        
        console.log('[WidgetCatalog] Setting up cross-list navigation:', {
            categoryScope: catScope,
            widgetScope: widgetScope
        });
        
        // Arrow Right from categories → focus widgets
        var unregCatRight = Keyboard.register({
            key: 'right',
            scope: catScope,
            description: 'Move to widget grid',
            handler: function(e) {
                console.log('[WidgetCatalog] RIGHT key pressed in category list');
                e.preventDefault();
                self._widgetList.focus();
                if (self._widgetList.getFocusedIndex() < 0) {
                    self._widgetList.setFocusedIndex(0);
                }
            }
        });
        console.log('[WidgetCatalog] Registered RIGHT in scope:', catScope, 'unreg:', !!unregCatRight);
        if (unregCatRight) this._crossNavUnregisters.push(unregCatRight);
        
        // Arrow Left from widgets → focus categories (only from first column)
        var unregWidgetLeft = Keyboard.register({
            key: 'left',
            scope: widgetScope,
            description: 'Move to category list',
            handler: function(e) {
                console.log('[WidgetCatalog] LEFT key pressed in widget list');
                var focusedIndex = self._widgetList.getFocusedIndex();
                var columns = 3; // gridColumns
                console.log('[WidgetCatalog] Focused index:', focusedIndex, 'column:', focusedIndex % columns);
                if (focusedIndex % columns === 0) {
                    e.preventDefault();
                    self._categoryList.focus();
                }
            }
        });
        console.log('[WidgetCatalog] Registered LEFT in scope:', widgetScope, 'unreg:', !!unregWidgetLeft);
        if (unregWidgetLeft) this._crossNavUnregisters.push(unregWidgetLeft);
    };
    
    /**
     * Initialize SelectableList for widget grid
     * Called after modal is added to DOM
     */
    WidgetCatalog.prototype._initWidgetList = function() {
        var self = this;
        var SL = getSelectableList();
        
        if (!SL || typeof SL.init !== 'function') {
            console.warn('[WidgetCatalog] SelectableList not available, using legacy rendering');
            this._useLegacyRendering = true;
            return;
        }
        
        // Get grid container (already has role="listbox")
        var container = this._elements.grid.el;
        
        this._widgetList = SL.init(container, {
            items: [],
            selectable: false,   // No persistent selection, just focus + activate
            keyboard: true,
            wrapAround: true,
            ariaLabel: 'Available widgets',
            orientation: 'grid',
            gridColumns: 3,
            
            getItemKey: function(widget) {
                return widget.type;
            },
            
            renderItem: function(widget, index, state) {
                return self._renderWidgetCard(widget, state);
            },
            
            onFocus: function(widget) {
                // Update preview when focus changes
                self._selectedType = widget.type;
                self._renderPreview();
                self._elements.addBtn.el.disabled = false;
            },
            
            onActivate: function(widget) {
                self._selectedType = widget.type;
                self._addWidget(widget.type);
            }
        });
    };
    
    /**
     * Render a single widget card
     * Focus state is handled by SelectableList's .is-focused class on parent
     */
    WidgetCatalog.prototype._renderWidgetCard = function(widget) {
        return '<div class="' + CLASSES.card + '">' +
            '<div class="' + CLASSES.cardIcon + '">' +
                '<i class="fas ' + widget.icon + '"></i>' +
            '</div>' +
            '<div class="' + CLASSES.cardName + '">' + this._escapeHtml(widget.name) + '</div>' +
            '<div class="' + CLASSES.cardDesc + '">' + this._escapeHtml(widget.description) + '</div>' +
        '</div>';
    };
    
    /**
     * Escape HTML to prevent XSS
     */
    WidgetCatalog.prototype._escapeHtml = function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };
    
    WidgetCatalog.prototype._buildModal = function() {
        var self = this;
        
        // Overlay
        var overlay = D.create('div')
            .classAdd(CLASSES.overlay)
            .attr('role', 'dialog')
            .attr('aria-modal', 'true')
            .attr('aria-labelledby', 'widget-catalog-title');
        
        // Dialog container
        var dialog = D.create('div').classAdd(CLASSES.dialog);
        
        // Header
        var header = D.create('div').classAdd(CLASSES.header);
        D.create('h2')
            .classAdd(CLASSES.title)
            .attr('id', 'widget-catalog-title')
            .text('Add Widget')
            .appendTo(header);
        
        var closeBtn = D.create('button')
            .classAdd(CLASSES.close)
            .attr('type', 'button')
            .attr('aria-label', 'Close dialog')
            .html('<i class="fas fa-times"></i>');
        this._elements.closeBtn = closeBtn;
        header.append(closeBtn);
        
        // Body
        var body = D.create('div').classAdd(CLASSES.body);
        
        // Sidebar (search + categories)
        var sidebar = D.create('div').classAdd(CLASSES.sidebar);
        
        var searchWrap = D.create('div').classAdd(CLASSES.search);
        var searchInput = D.create('input')
            .classAdd(CLASSES.searchInput)
            .attr('type', 'search')
            .attr('placeholder', 'Search widgets...')
            .attr('aria-label', 'Search widgets');
        this._elements.searchInput = searchInput;
        searchWrap.append(searchInput);
        sidebar.append(searchWrap);
        
        var categories = D.create('div')
            .classAdd(CLASSES.categories)
            .attr('role', 'tablist')
            .attr('aria-label', 'Widget categories');
        this._elements.categories = categories;
        sidebar.append(categories);
        
        body.append(sidebar);
        
        // Content area
        var content = D.create('div').classAdd(CLASSES.content);
        
        var grid = D.create('div')
            .classAdd(CLASSES.grid)
            .attr('role', 'listbox')
            .attr('aria-label', 'Available widgets');
        this._elements.grid = grid;
        content.append(grid);
        
        var preview = D.create('div')
            .classAdd(CLASSES.preview)
            .attr('aria-live', 'polite');
        this._elements.preview = preview;
        content.append(preview);
        
        body.append(content);
        
        // Footer
        var footer = D.create('div').classAdd(CLASSES.footer);
        var addBtn = D.create('button')
            .classAdd(CLASSES.addBtn)
            .classAdd('btn')
            .classAdd('btn-primary')
            .attr('type', 'button')
            .attr('disabled', 'disabled')
            .text('Add Widget');
        this._elements.addBtn = addBtn;
        footer.append(addBtn);
        
        // Assemble
        dialog.append(header).append(body).append(footer);
        overlay.append(dialog);
        
        this._modal = overlay;
    };
    
    WidgetCatalog.prototype._bindEvents = function() {
        var self = this;
        
        // Close button
        this._elements.closeBtn.on('click', function() {
            self.close();
        });
        
        // Overlay click (outside dialog)
        this._modal.on('click', function(e) {
            if (e.target === self._modal.el) {
                self.close();
            }
        });
        
        // Escape key handler - prepared for use in open/close
        // Uses Funky.Keyboard if available
        this._escHandler = function(e) {
            if (e.key === 'Escape') {
                self.close();
            }
        };
        
        // Search input
        this._elements.searchInput.on('input', function() {
            self._searchQuery = this.value;
            self._renderWidgets();
        });
        
        // Add button
        this._elements.addBtn.on('click', function() {
            if (self._selectedType) {
                self._addWidget(self._selectedType);
            }
        });
        
        // Keyboard navigation for grid (legacy - only used when SelectableList not available)
        this._elements.grid.on('keydown', function(e) {
            if (!self._widgetList) {
                self._handleGridKeydown(e);
            }
        });
    };
    
    /**
     * Legacy keyboard handler (fallback when SelectableList not available)
     */
    WidgetCatalog.prototype._handleGridKeydown = function(e) {
        var cards = this._elements.grid.all('.' + CLASSES.card);
        if (!cards || cards.length === 0) return;
        
        var focusedEl = document.activeElement;
        var currentIndex = -1;
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].el === focusedEl) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex === -1) currentIndex = 0;
        
        var newIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowRight':
                newIndex = Math.min(currentIndex + 1, cards.length - 1);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                newIndex = Math.max(currentIndex - 1, 0);
                e.preventDefault();
                break;
            case 'ArrowDown':
                // Move down a row (estimate columns from grid)
                newIndex = Math.min(currentIndex + 3, cards.length - 1);
                e.preventDefault();
                break;
            case 'ArrowUp':
                newIndex = Math.max(currentIndex - 3, 0);
                e.preventDefault();
                break;
            case 'Home':
                newIndex = 0;
                e.preventDefault();
                break;
            case 'End':
                newIndex = cards.length - 1;
                e.preventDefault();
                break;
        }
        
        if (newIndex !== currentIndex && newIndex >= 0) {
            var targetCard = cards[newIndex];
            if (targetCard && targetCard.el) {
                targetCard.el.focus();
            }
        }
    };
    
    WidgetCatalog.prototype._renderCategories = function() {
        var self = this;
        
        // Use SelectableList if available
        if (this._categoryList) {
            var categoryItems = this._buildCategoryItems();
            this._categoryList.setItems(categoryItems);
            
            // Select current category
            var selectId = this._currentCategory || 'all';
            this._categoryList.select(selectId);
            return;
        }
        
        // Legacy rendering
        var container = this._elements.categories;
        container.html('');
        
        // All category button
        var allBtn = D.create('button')
            .classAdd(CLASSES.categoryBtn)
            .attr('type', 'button')
            .attr('role', 'tab')
            .attr('aria-selected', this._currentCategory === null ? 'true' : 'false')
            .attr('data-category', '')
            .text('All');
        
        if (this._currentCategory === null) {
            allBtn.classAdd(CLASSES.categoryActive);
        }
        
        allBtn.on('click', function() {
            self._selectCategory(null);
        });
        container.append(allBtn);
        
        // Get categories from DashboardGrid
        var categories = Funky.DashboardGrid.getCategories();
        for (var i = 0; i < categories.length; i++) {
            (function(cat) {
                var btn = D.create('button')
                    .classAdd(CLASSES.categoryBtn)
                    .attr('type', 'button')
                    .attr('role', 'tab')
                    .attr('aria-selected', self._currentCategory === cat ? 'true' : 'false')
                    .attr('data-category', cat)
                    .text(self._formatCategory(cat));
                
                if (self._currentCategory === cat) {
                    btn.classAdd(CLASSES.categoryActive);
                }
                
                btn.on('click', function() {
                    self._selectCategory(cat);
                });
                container.append(btn);
            })(categories[i]);
        }
    };
    
    WidgetCatalog.prototype._formatCategory = function(cat) {
        // Capitalize first letter
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    };
    
    WidgetCatalog.prototype._selectCategory = function(category) {
        this._currentCategory = category;
        
        // Update category list selection
        if (this._categoryList) {
            this._categoryList.select(category || 'all');
        } else {
            this._renderCategories();
        }
        this._renderWidgets();
    };
    
    WidgetCatalog.prototype._renderWidgets = function() {
        var self = this;
        
        // Get widgets (filtered by category and search)
        var widgets;
        if (this._searchQuery) {
            widgets = Funky.DashboardGrid.searchWidgets(this._searchQuery);
            if (this._currentCategory) {
                var filtered = [];
                for (var j = 0; j < widgets.length; j++) {
                    if (widgets[j].category === self._currentCategory) {
                        filtered.push(widgets[j]);
                    }
                }
                widgets = filtered;
            }
        } else {
            widgets = Funky.DashboardGrid.getWidgetTypes(this._currentCategory);
        }
        
        // Use SelectableList if available
        if (this._widgetList) {
            if (widgets.length === 0) {
                this._widgetList.setItems([]);
                this._elements.grid.html('<div class="' + CLASSES.empty + '">No widgets found</div>');
            } else {
                this._widgetList.setItems(widgets);
                
                // Restore selection if widget still exists
                if (this._selectedType) {
                    this._widgetList.select(this._selectedType);
                }
            }
            return;
        }
        
        // Legacy rendering (fallback)
        var container = this._elements.grid;
        container.html('');
        
        if (widgets.length === 0) {
            D.create('div')
                .classAdd(CLASSES.empty)
                .text('No widgets found')
                .appendTo(container);
            return;
        }
        
        for (var i = 0; i < widgets.length; i++) {
            (function(widget, index) {
                var isSelected = self._selectedType === widget.type;
                
                var card = D.create('div')
                    .classAdd(CLASSES.card)
                    .attr('role', 'option')
                    .attr('aria-selected', isSelected ? 'true' : 'false')
                    .attr('tabindex', index === 0 ? '0' : '-1')
                    .attr('data-type', widget.type)
                    .attr('data-index', index);
                
                if (isSelected) {
                    card.classAdd(CLASSES.cardSelected);
                }
                
                D.create('div')
                    .classAdd(CLASSES.cardIcon)
                    .html('<i class="fas ' + widget.icon + '"></i>')
                    .appendTo(card);
                
                D.create('div')
                    .classAdd(CLASSES.cardName)
                    .text(widget.name)
                    .appendTo(card);
                
                D.create('div')
                    .classAdd(CLASSES.cardDesc)
                    .text(widget.description)
                    .appendTo(card);
                
                card.on('click', function() {
                    self._selectWidget(widget.type);
                });
                
                card.on('dblclick', function() {
                    self._selectWidget(widget.type);
                    self._addWidget(widget.type);
                });
                
                card.on('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        self._selectWidget(widget.type);
                    }
                });
                
                container.append(card);
            })(widgets[i], i);
        }
    };
    
    WidgetCatalog.prototype._selectWidget = function(type) {
        this._selectedType = type;
        this._renderWidgets();
        this._renderPreview();
        this._elements.addBtn.el.disabled = false;
    };
    
    WidgetCatalog.prototype._renderPreview = function() {
        var container = this._elements.preview;
        container.html('');
        
        if (!this._selectedType) {
            D.create('div')
                .classAdd(CLASSES.previewEmpty)
                .text('Select a widget to preview')
                .appendTo(container);
            return;
        }
        
        var meta = Funky.DashboardGrid.getWidgetMeta(this._selectedType);
        if (!meta) return;
        
        D.create('div')
            .classAdd(CLASSES.previewTitle)
            .text(meta.name)
            .appendTo(container);
        
        var previewContent = D.create('div').classAdd(CLASSES.previewContent);
        if (meta.preview) {
            if (typeof meta.preview === 'function') {
                var result = meta.preview();
                if (typeof result === 'string') {
                    previewContent.html(result);
                } else if (result && result.el) {
                    previewContent.append(result);
                }
            } else {
                previewContent.html(meta.preview);
            }
        } else {
            previewContent.html('<i class="fas ' + meta.icon + '" style="font-size:3rem;opacity:0.3"></i>');
        }
        container.append(previewContent);
        
        var metaInfo = D.create('div').classAdd(CLASSES.previewMeta);
        metaInfo.html(
            '<div><strong>Type:</strong> ' + meta.type + '</div>' +
            '<div><strong>Category:</strong> ' + this._formatCategory(meta.category) + '</div>' +
            '<div><strong>Default size:</strong> ' + meta.defaults.width + ' × ' + meta.defaults.height + '</div>'
        );
        container.append(metaInfo);
    };
    
    WidgetCatalog.prototype._addWidget = function(type) {
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
        } else {
            // Ensure config.config exists even if no default
            config.config = {};
        }
        
        if (this.options.grid) {
            this.options.grid.addWidget(config);
        }
        
        if (typeof this.options.onAdd === 'function') {
            this.options.onAdd(type, config);
        }
        
        this.close();
        
        // Emit event
        Funky.PubSub.emit('funky:widget-catalog:add', { type: type, config: config });
    };
    
    /**
     * Open the catalog modal
     */
    WidgetCatalog.prototype.open = function() {
        var self = this;

        if (!this._modal || !this._elements.searchInput) {
            console.error('[WidgetCatalog] Modal not properly initialized');
            return this;
        }

        this._selectedType = null;
        this._currentCategory = null;
        this._searchQuery = '';
        this._elements.searchInput.el.value = '';
        this._elements.addBtn.el.disabled = true;

        D.one('body').append(this._modal);

        // Initialize SelectableLists after modal is in DOM
        if (!this._categoryList) {
            this._initCategoryList();
        }
        if (!this._widgetList) {
            this._initWidgetList();
        }
        
        // Set up cross-list navigation AFTER both lists exist
        this._setupCrossListNavigation();
        
        // Render categories (uses SelectableList if available)
        this._renderCategories();

        // Render widgets (uses SelectableList if available)
        this._renderWidgets();
        this._renderPreview();

        // Trigger reflow before adding open class for animation
        void this._modal.el.offsetWidth;

        this._modal.classAdd(CLASSES.modal + '--open');
        this.isOpen = true;

        // Setup Escape key handler with proper scope
        if (Funky.Keyboard) {
            // Push widget-catalog scope so Escape handler becomes active
            Funky.Keyboard.pushScope('widget-catalog');
            this._keyboardUnregister = Funky.Keyboard.register({
                key: 'escape',
                scope: 'widget-catalog',
                priority: 10, // Higher than Morph.to() internal handler (0)
                handler: function() {
                    if (self.isOpen) {
                        self.close();
                    }
                },
                description: 'Close widget catalog',
                group: 'Widget Catalog',
                preventDefault: true,
                allowInInput: true
            });
        } else {
            document.addEventListener('keydown', this._escHandler);
        }

        // Focus search input
        setTimeout(function() {
            if (self._elements && self._elements.searchInput && self._elements.searchInput.el) {
                self._elements.searchInput.el.focus();
            }
        }, 100);

        Funky.PubSub.emit('funky:widget-catalog:open');
        return this;
    };
    
    /**
     * Close the catalog modal
     */
    WidgetCatalog.prototype.close = function() {
        var self = this;

        if (!this._modal) return this;

        this.isOpen = false;

        this._modal.classRemove(CLASSES.modal + '--open');

        // Cleanup Escape key handler and pop scope
        if (this._keyboardUnregister) {
            this._keyboardUnregister();
            this._keyboardUnregister = null;
            // Pop the widget-catalog scope we pushed in open()
            if (Funky.Keyboard && Funky.Keyboard.popScope) {
                Funky.Keyboard.popScope();
            }
        } else {
            document.removeEventListener('keydown', this._escHandler);
        }

        // Remove from DOM after transition
        setTimeout(function() {
            if (self._modal && self._modal.el && self._modal.el.parentNode) {
                self._modal.el.parentNode.removeChild(self._modal.el);
            }
        }, 300);

        if (typeof this.options.onClose === 'function') {
            this.options.onClose();
        }

        Funky.PubSub.emit('funky:widget-catalog:close');
        return this;
    };

    /**
     * Toggle catalog visibility
     * @returns {WidgetCatalog} this for chaining
     */
    WidgetCatalog.prototype.toggle = function() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
        return this;
    };
    
    /**
     * Destroy the catalog instance
     */
    WidgetCatalog.prototype.destroy = function() {
        // Remove event listeners
        if (this._keyboardUnregister) {
            this._keyboardUnregister();
            this._keyboardUnregister = null;
        }
        document.removeEventListener('keydown', this._escHandler);

        // Unregister cross-list navigation keys
        if (this._crossNavUnregisters) {
            for (var i = 0; i < this._crossNavUnregisters.length; i++) {
                if (typeof this._crossNavUnregisters[i] === 'function') {
                    this._crossNavUnregisters[i]();
                }
            }
            this._crossNavUnregisters = null;
        }

        // Destroy SelectableLists
        if (this._categoryList) {
            this._categoryList.destroy();
            this._categoryList = null;
        }
        if (this._widgetList) {
            this._widgetList.destroy();
            this._widgetList = null;
        }

        // Remove modal from DOM immediately
        if (this._modal && this._modal.el && this._modal.el.parentNode) {
            this._modal.el.parentNode.removeChild(this._modal.el);
        }

        this._modal = null;
        this._elements = {};
    };

    // =========================================================================
    // FACTORY API
    // =========================================================================

    var _instances = Funky.Registry.createInstanceRegistry('WidgetCatalog');
    var _instanceCounter = 0;

    var WidgetCatalogFactory = {
        /**
         * Initialize a widget catalog
         * @param {Object} options - Configuration options
         * @returns {WidgetCatalog}
         */
        init: function(options) {
            var instance = new WidgetCatalog(options);
            instance.id = 'widget-catalog-' + (++_instanceCounter);
            _instances.register(instance.id, instance);
            return instance;
        },

        /**
         * Get instance by ID
         * @param {string} id - Instance ID
         * @returns {WidgetCatalog|null}
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

        /**
         * Static helper to open catalog quickly
         * @param {Object} options - Same as constructor options
         * @returns {WidgetCatalog}
         */
        open: function(options) {
            var catalog = WidgetCatalogFactory.init(options);
            catalog.open();
            return catalog;
        },

        constructor: WidgetCatalog
    };

    if (Funky.register) {
        Funky.register('WidgetCatalog', WidgetCatalogFactory);
    }

})(window);
