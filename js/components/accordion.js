/**
 * Funky.Accordion - Accessible accordion component
 * @namespace Funky.Accordion
 * @requires Funky.Dom
 * @optional Funky.Announce
 */
(function(global) {
    'use strict';

    var Funky = global.Funky || {};
    var D = Funky.Dom;

    // =========================================================================
    // PRIVATE STATE
    // =========================================================================

    var _instances = Funky.Registry.createInstanceRegistry('Accordion');
    var _instanceCounter = 0;

    // =========================================================================
    // DEFAULT OPTIONS
    // =========================================================================

    var DEFAULTS = {
        items: [],
        allowMultiple: true,
        expandFirst: false,
        collapsible: true,
        animated: true,
        animationDuration: 300,
        keyboard: true,

        // Templates
        headerTemplate: null,        // function(item, isExpanded) => Element|string
        contentTemplate: null,       // function(item) => Element|string

        // Icons
        iconPosition: 'right',       // 'left' | 'right'
        expandIcon: 'fas fa-chevron-down',
        collapseIcon: null,          // null = rotate expandIcon

        // Truncation
        truncateHeader: null,        // number (max chars) or null

        // Nested
        nestedIndent: 16,            // px per nesting level
        maxNestingLevel: 5,          // Maximum nesting depth

        // Lazy loading
        onLazyLoad: null,            // function(item, done) for async content
        loadingIndicator: 'spinner', // 'spinner' | 'skeleton' | 'none'
        skeletonLines: 3,            // Lines for skeleton loader
        loadingText: 'Loading...',   // Text for spinner

        // Content truncation
        truncateContent: null,       // { lines: 3, moreText: '...', lessText: '...' } or null

        // Animation
        useMorph: true,              // Use Funky.Morph if available

        // Search
        searchable: false,           // Enable built-in search input
        searchInput: null,           // External search input selector
        searchPlaceholder: 'Search...',
        searchKeys: ['title'],       // Item properties to search
        searchThreshold: 0.3,        // Fuzzy match threshold (0-1)
        highlightMatches: true,      // Highlight matching text
        searchDebounce: 150,         // Debounce delay in ms

        // Empty state
        emptyStateMessage: 'No results found',
        emptyStateIcon: 'fas fa-search',
        emptyStateAction: null,      // { text: 'Clear', onClick: fn }

        // Hash navigation
        hashNavigation: false,       // Sync with URL hash
        hashPrefix: 'accordion-',    // Prefix for hash IDs

        // Focus management
        focusOnExpand: false,        // Move focus to panel on expand
        wrapNavigation: true         // Wrap keyboard nav at ends
    };

    // =========================================================================
    // ACCORDION INSTANCE
    // =========================================================================

    /**
     * Accordion instance constructor
     * @param {Element|string} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    function AccordionInstance(container, options) {
        this.id = 'accordion-' + (++_instanceCounter);
        this.container = typeof container === 'string' ? D.one(container) : container;
        this.options = Object.assign({}, DEFAULTS, options);
        this.items = [];
        this.expandedIds = new Set();
        this._itemElements = {};
        this._destroyed = false;

        console.log('[Accordion] Creating instance with iconPosition:', this.options.iconPosition, 'raw options:', options);

        this._init();
    }

    // -------------------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------------------

    AccordionInstance.prototype._init = function() {
        if (!this.container) {
            console.error('[Funky.Accordion] Container not found');
            return;
        }

        this._buildContainer();
        this.setItems(this.options.items);
        this._bindEvents();
        this._initHashNav();
        this._emit('init', { instance: this });
    };

    AccordionInstance.prototype._buildContainer = function() {
        // this.container may be a Funky.Dom wrapper or raw element
        var containerEl = this.container.el ? this.container : D.one(this.container);
        if (!containerEl) {
            console.error('[Funky.Accordion] Container element not found');
            return;
        }

        // Clear any existing content first to prevent duplicate accordions
        containerEl.html('');

        containerEl.classAdd('funky-accordion');
        
        if (this.options.animated) {
            containerEl.classAdd('funky-accordion--animated');
        }

        // Add search if enabled
        if (this.options.searchable) {
            containerEl.classAdd('funky-accordion--searchable');
            this._buildSearchInput(containerEl);
        } else if (this.options.searchInput) {
            // Connect to external search input
            this._connectExternalSearch();
        }

        // Items container
        this._itemsContainer = D.create('div')
            .classAdd('funky-accordion__items');
        containerEl.append(this._itemsContainer);

        // Empty state container (hidden by default)
        this._emptyStateEl = D.create('div')
            .classAdd('funky-accordion__empty')
            .style({ display: 'none' });
        containerEl.append(this._emptyStateEl);

        // Store reference
        this._containerEl = containerEl;
    };

    /**
     * Build search input
     * @private
     */
    AccordionInstance.prototype._buildSearchInput = function(containerEl) {
        var self = this;
        var opts = this.options;

        var searchWrapper = D.create('div')
            .classAdd('funky-accordion__search');

        var searchIcon = D.create('span')
            .classAdd('funky-accordion__search-icon')
            .attr('aria-hidden', 'true');

        if (D.icon) {
            searchIcon.append(D.icon('fas fa-search'));
        } else {
            searchIcon.html('<i class="fas fa-search"></i>');
        }

        var searchInput = D.create('input')
            .classAdd('funky-accordion__search-input')
            .attr('type', 'search')
            .attr('placeholder', opts.searchPlaceholder)
            .attr('aria-label', opts.searchPlaceholder);

        // Clear button
        var clearBtn = D.create('button')
            .classAdd('funky-accordion__search-clear')
            .attr('type', 'button')
            .attr('aria-label', 'Clear search')
            .style({ display: 'none' });

        if (D.icon) {
            clearBtn.append(D.icon('fas fa-times'));
        } else {
            clearBtn.html('<i class="fas fa-times"></i>');
        }

        searchWrapper
            .append(searchIcon)
            .append(searchInput)
            .append(clearBtn);

        containerEl.append(searchWrapper);

        // Store references
        this._searchInput = searchInput;
        this._searchClearBtn = clearBtn;

        // Bind search events
        this._bindSearchEvents(searchInput, clearBtn);
    };

    /**
     * Connect to external search input
     * @private
     */
    AccordionInstance.prototype._connectExternalSearch = function() {
        var searchInput = D.one(this.options.searchInput);
        if (!searchInput) {
            console.warn('[Funky.Accordion] External search input not found:', this.options.searchInput);
            return;
        }

        this._searchInput = searchInput;
        this._bindSearchEvents(searchInput, null);
    };

    /**
     * Bind search input events
     * @private
     */
    AccordionInstance.prototype._bindSearchEvents = function(searchInput, clearBtn) {
        var self = this;
        var opts = this.options;
        var debounceTimer = null;

        searchInput.on('input', function(e) {
            var query = e.target.value;

            // Show/hide clear button
            if (clearBtn) {
                clearBtn.style({ display: query.length > 0 ? '' : 'none' });
            }

            // Debounce search
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                self.search(query);
            }, opts.searchDebounce);
        });

        // Clear button handler
        if (clearBtn) {
            clearBtn.on('click', function() {
                searchInput.val('');
                clearBtn.style({ display: 'none' });
                self.clearSearch();
                searchInput.focus();
            });
        }

        // Escape to clear
        searchInput.on('keydown', function(e) {
            if (e.key === 'Escape' && searchInput.val()) {
                searchInput.val('');
                if (clearBtn) clearBtn.style({ display: 'none' });
                self.clearSearch();
            }
        });
    };

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    AccordionInstance.prototype._render = function() {
        var self = this;
        var containerEl = this._itemsContainer || this._containerEl;

        // Clear existing items
        containerEl.html('');
        this._itemElements = {};

        // Render each item
        this.items.forEach(function(item, index) {
            var itemEl = self._renderItem(item, index);
            containerEl.append(itemEl);
            self._itemElements[item.id] = itemEl;

            // Apply truncation to non-lazy items
            if (!item.lazyLoad && self.options.truncateContent) {
                var contentEl = itemEl._contentEl;
                if (contentEl) {
                    self._applyContentTruncation(contentEl, item);
                }
            }
        });
    };

    AccordionInstance.prototype._renderItem = function(item, index) {
        var self = this;
        var opts = this.options;
        var isExpanded = this.expandedIds.has(item.id);
        var isDisabled = item.disabled === true;
        var level = item._level || 0;

        var btnId = this.id + '-' + item.id + '-btn';
        var panelId = this.id + '-' + item.id + '-panel';

        // Item container
        var itemEl = D.create('div')
            .classAdd('funky-accordion__item')
            .classAdd(isExpanded ? 'funky-accordion__item--expanded' : 'funky-accordion__item--collapsed')
            .data('accordion-item-id', item.id)
            .data('accordion-level', level);

        if (isDisabled) {
            itemEl.classAdd('funky-accordion__item--disabled');
        }

        // Nesting classes
        if (level > 0) {
            itemEl.classAdd('funky-accordion__item--nested');
            itemEl.classAdd('funky-accordion__item--level-' + level);

            // Apply indent
            var indent = level * opts.nestedIndent;
            itemEl.style({ marginLeft: indent + 'px' });
        }

        // Has children indicator
        if (item._hasChildren) {
            itemEl.classAdd('funky-accordion__item--has-children');
        }

        // Lazy load indicator
        if (item.lazyLoad && !item._loaded) {
            itemEl.classAdd('funky-accordion__item--lazy');
        }

        // Header wrapper (h3 for accessibility)
        var headerWrapper = D.create('h3')
            .classAdd('funky-accordion__header-wrapper');

        // Header button
        var headerBtn = D.create('button')
            .classAdd('funky-accordion__header')
            .attr('type', 'button')
            .attr('id', btnId)
            .attr('aria-expanded', isExpanded ? 'true' : 'false')
            .attr('aria-controls', panelId);

        if (isDisabled) {
            headerBtn.attr('aria-disabled', 'true');
        }

        console.log('[Accordion] _renderItem iconPosition:', opts.iconPosition);

        // Icon position modifier
        if (opts.iconPosition === 'left') {
            console.log('[Accordion] Adding icon-left class to header button');
            headerBtn.classAdd('funky-accordion__header--icon-left');
        }

        // Build header content
        var headerContent = this._buildHeaderContent(item, isExpanded);

        // Build chevron
        var chevronEl = this._buildChevron(item, isExpanded);

        // Assemble header based on icon position
        if (opts.iconPosition === 'left') {
            console.log('[Accordion] Appending chevron BEFORE content (left position)');
            headerBtn.append(chevronEl).append(headerContent);
        } else {
            headerBtn.append(headerContent).append(chevronEl);
        }

        headerWrapper.append(headerBtn);

        // Panel
        var panelEl = D.create('div')
            .classAdd('funky-accordion__panel')
            .attr('id', panelId)
            .attr('role', 'region')
            .attr('aria-labelledby', btnId);

        if (!isExpanded) {
            panelEl.attr('hidden', '');
        }

        // Content (or loading placeholder for lazy items)
        var contentEl;
        if (item.lazyLoad && !item._loaded) {
            contentEl = this._buildLoadingPlaceholder(item);
        } else {
            contentEl = this._buildContent(item);
        }
        panelEl.append(contentEl);

        // Assemble
        itemEl.append(headerWrapper).append(panelEl);

        // Store references on element for easy access
        itemEl._headerBtn = headerBtn;
        itemEl._panelEl = panelEl;
        itemEl._chevronEl = chevronEl;
        itemEl._contentEl = contentEl;
        itemEl._item = item;

        return itemEl;
    };

    // -------------------------------------------------------------------------
    // Content Builders
    // -------------------------------------------------------------------------

    /**
     * Build header content (title, icon, badge)
     * @private
     */
    AccordionInstance.prototype._buildHeaderContent = function(item, isExpanded) {
        var opts = this.options;

        // Use custom template if provided
        if (typeof opts.headerTemplate === 'function') {
            var result = opts.headerTemplate(item, isExpanded);
            if (typeof result === 'string') {
                return D.create('div')
                    .classAdd('funky-accordion__header-content')
                    .html(result);
            }
            return result;
        }

        // Default header content
        var contentEl = D.create('div')
            .classAdd('funky-accordion__header-content');

        // Custom icon (from item)
        if (item.icon) {
            var iconEl = D.create('span')
                .classAdd('funky-accordion__icon');

            if (D.icon) {
                iconEl.append(D.icon(item.icon));
            } else {
                iconEl.html('<i class="' + item.icon + '"></i>');
            }
            contentEl.append(iconEl);
        }

        // Title
        var titleText = item.title || '';

        // Truncate if configured
        if (opts.truncateHeader && titleText.length > opts.truncateHeader) {
            if (Funky.Truncate && Funky.Truncate.text) {
                titleText = Funky.Truncate.text(titleText, opts.truncateHeader, '...');
            } else {
                titleText = titleText.substring(0, opts.truncateHeader) + '...';
            }
        }

        var titleEl = D.create('span')
            .classAdd('funky-accordion__title')
            .text(titleText);

        // Add tooltip for truncated titles
        if (opts.truncateHeader && item.title && item.title.length > opts.truncateHeader) {
            titleEl.attr('title', item.title);
        }

        contentEl.append(titleEl);

        // Badge
        if (item.badge !== undefined && item.badge !== null) {
            var badgeEl = D.create('span')
                .classAdd('funky-accordion__badge');

            if (typeof item.badge === 'object') {
                // Badge with options: { text: '5', variant: 'primary' }
                badgeEl.text(item.badge.text || item.badge.count || '');
                if (item.badge.variant) {
                    badgeEl.classAdd('funky-accordion__badge--' + item.badge.variant);
                }
            } else {
                badgeEl.text(String(item.badge));
            }

            contentEl.append(badgeEl);
        }

        return contentEl;
    };

    /**
     * Build chevron icon element
     * @private
     */
    AccordionInstance.prototype._buildChevron = function(item, isExpanded) {
        var opts = this.options;

        var chevronEl = D.create('span')
            .classAdd('funky-accordion__chevron')
            .attr('aria-hidden', 'true');

        if (isExpanded) {
            chevronEl.classAdd('funky-accordion__chevron--rotated');
        }

        // Determine which icon to use
        var iconClass;
        if (isExpanded && opts.collapseIcon) {
            iconClass = opts.collapseIcon;
        } else {
            iconClass = opts.expandIcon;
        }

        // Render icon
        if (D.icon) {
            chevronEl.append(D.icon(iconClass));
        } else {
            chevronEl.html('<i class="' + iconClass + '"></i>');
        }

        return chevronEl;
    };

    /**
     * Build panel content
     * @private
     */
    AccordionInstance.prototype._buildContent = function(item) {
        var opts = this.options;

        var contentEl = D.create('div')
            .classAdd('funky-accordion__content');

        // Use custom template if provided
        if (typeof opts.contentTemplate === 'function') {
            var result = opts.contentTemplate(item);
            if (typeof result === 'string') {
                contentEl.html(result);
            } else if (result && result.nodeType) {
                contentEl.append(result);
            } else if (result && result.appendTo) {
                // Funky.Dom element
                result.appendTo(contentEl);
            }
            return contentEl;
        }

        // Default: render item.content
        if (typeof item.content === 'string') {
            contentEl.html(item.content);
        } else if (item.content && item.content.nodeType) {
            contentEl.append(item.content);
        } else if (item.content && item.content.appendTo) {
            item.content.appendTo(contentEl);
        }

        return contentEl;
    };

    /**
     * Build loading placeholder for lazy content
     * @private
     */
    AccordionInstance.prototype._buildLoadingPlaceholder = function(item) {
        var opts = this.options;

        var placeholderEl = D.create('div')
            .classAdd('funky-accordion__loading');

        // Content will be loaded on expand
        // Show placeholder based on loadingIndicator option
        if (opts.loadingIndicator === 'skeleton' && Funky.Skeleton) {
            var skeleton = Funky.Skeleton.create({
                type: 'text',
                lines: opts.skeletonLines
            });
            placeholderEl.append(skeleton);
        } else if (opts.loadingIndicator === 'spinner' && Funky.Spinner) {
            var spinner = Funky.Spinner.create({
                size: 'sm',
                text: opts.loadingText
            });
            placeholderEl.append(spinner);
        } else if (opts.loadingIndicator !== 'none') {
            // Simple fallback spinner
            placeholderEl
                .classAdd('funky-accordion__loading-fallback')
                .html('<span class="spinner-border spinner-border-sm" role="status"></span> ' + opts.loadingText);
        }

        return placeholderEl;
    };

    /**
     * Update chevron icon (for icon swapping on expand/collapse)
     * @private
     */
    AccordionInstance.prototype._updateChevronIcon = function(chevronEl, iconClass) {
        chevronEl.innerHTML = '';
        if (D.icon) {
            D.icon(iconClass).appendTo(chevronEl);
        } else {
            chevronEl.innerHTML = '<i class="' + iconClass + '"></i>';
        }
    };

    // -------------------------------------------------------------------------
    // Event Binding
    // -------------------------------------------------------------------------

    AccordionInstance.prototype._bindEvents = function() {
        var self = this;

        // Click handler for headers
        this._containerEl.on('click', function(e) {
            var headerBtn = e.target.closest('.funky-accordion__header');
            if (!headerBtn) return;

            var itemEl = headerBtn.closest('.funky-accordion__item');
            if (!itemEl) return;

            var itemId = itemEl.dataset.accordionItemId;
            if (!itemId) return;

            // Check if disabled
            if (itemEl.classList.contains('funky-accordion__item--disabled')) {
                return;
            }

            self.toggle(itemId);
        });

        // Keyboard navigation (delegated) - use Funky.Keyboard for F1 help
        if (this.options.keyboard) {
            this._keyboardUnregisters = [];
            var containerId = this._containerEl.el.id || ('accordion-' + this.id);
            if (!this._containerEl.el.id) {
                this._containerEl.el.id = containerId;
            }

            if (Funky.Keyboard) {
                var navKeys = [
                    { key: 'enter', description: 'Toggle panel' },
                    { key: 'space', description: 'Toggle panel' },
                    { key: 'arrowdown', description: 'Next panel' },
                    { key: 'arrowup', description: 'Previous panel' },
                    { key: 'home', description: 'First panel' },
                    { key: 'end', description: 'Last panel' }
                ];

                navKeys.forEach(function(keyDef) {
                    self._keyboardUnregisters.push(Funky.Keyboard.register({
                        key: keyDef.key,
                        scope: '#' + containerId,
                        handler: function(e) {
                            self._handleKeydown(e);
                        },
                        description: keyDef.description,
                        group: 'Accordion',
                        preventDefault: true
                    }));
                });
            } else {
                // Fallback for environments without Funky.Keyboard
                this._keydownHandler = function(e) {
                    self._handleKeydown(e);
                };
                this._containerEl.on('keydown', this._keydownHandler);
            }
        }
    };

    AccordionInstance.prototype._handleKeydown = function(e) {
        var headerBtn = e.target.closest('.funky-accordion__header');
        if (!headerBtn) return;

        var headers = this._getVisibleHeaders();
        var currentIndex = -1;

        // Find current index using native element comparison
        for (var i = 0; i < headers.length; i++) {
            if (headers[i] === headerBtn || headers[i].node === headerBtn) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex === -1) return;

        var handled = false;
        var newIndex = currentIndex;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this._handleHeaderActivate(headerBtn);
                handled = true;
                break;

            case 'ArrowDown':
                e.preventDefault();
                newIndex = this._getNextIndex(currentIndex, headers.length, 1);
                handled = true;
                break;

            case 'ArrowUp':
                e.preventDefault();
                newIndex = this._getNextIndex(currentIndex, headers.length, -1);
                handled = true;
                break;

            case 'Home':
                e.preventDefault();
                newIndex = 0;
                handled = true;
                break;

            case 'End':
                e.preventDefault();
                newIndex = headers.length - 1;
                handled = true;
                break;
        }

        // Move focus if index changed
        if (handled && newIndex !== currentIndex) {
            this._focusHeader(headers, newIndex);
        }

        if (handled) {
            e.stopPropagation();
        }
    };

    /**
     * Get all visible (non-hidden) header buttons
     * @private
     */
    AccordionInstance.prototype._getVisibleHeaders = function() {
        var headers = [];
        var self = this;

        this.items.forEach(function(item) {
            var itemEl = self._itemElements[item.id];
            if (itemEl && !itemEl.classHas('funky-accordion__item--hidden')) {
                var headerBtn = itemEl._headerBtn;
                if (headerBtn) {
                    headers.push(headerBtn);
                }
            }
        });

        return headers;
    };

    /**
     * Get next index with wrap handling
     * @private
     */
    AccordionInstance.prototype._getNextIndex = function(current, total, direction) {
        var next = current + direction;

        if (this.options.wrapNavigation) {
            if (next < 0) next = total - 1;
            if (next >= total) next = 0;
        } else {
            if (next < 0) next = 0;
            if (next >= total) next = total - 1;
        }

        return next;
    };

    /**
     * Focus a header and update roving tabindex
     * @private
     */
    AccordionInstance.prototype._focusHeader = function(headers, index) {
        // Update tabindexes
        headers.forEach(function(header, i) {
            var el = header.node || header;
            el.setAttribute('tabindex', i === index ? '0' : '-1');
        });

        // Focus the header
        var targetHeader = headers[index].node || headers[index];
        targetHeader.focus();

        // Store focused index
        this._focusedHeaderIndex = index;
    };

    /**
     * Update tabindex for roving focus
     * @private
     */
    AccordionInstance.prototype._updateTabIndexes = function() {
        var headers = this._getVisibleHeaders();
        var focusedIndex = this._focusedHeaderIndex || 0;

        headers.forEach(function(header, index) {
            var el = header.node || header;
            if (index === focusedIndex) {
                el.setAttribute('tabindex', '0');
            } else {
                el.setAttribute('tabindex', '-1');
            }
        });
    };

    /**
     * Handle header activation (Enter/Space)
     * @private
     */
    AccordionInstance.prototype._handleHeaderActivate = function(headerBtn) {
        var itemEl = headerBtn.closest('.funky-accordion__item');
        if (!itemEl) return;

        var itemId = itemEl.dataset.accordionItemId;
        if (!itemId) return;

        // Check disabled
        if (itemEl.classList.contains('funky-accordion__item--disabled')) {
            return;
        }

        this.toggle(itemId);
    };

    // -------------------------------------------------------------------------
    // Nested Items
    // -------------------------------------------------------------------------

    /**
     * Flatten nested items with level tracking
     * @private
     */
    AccordionInstance.prototype._flattenItems = function(items, level, parentId) {
        var self = this;
        var flat = [];
        level = level || 0;
        parentId = parentId || null;

        items.forEach(function(item) {
            // Add level and parent info
            var flatItem = Object.assign({}, item, {
                _level: level,
                _parentId: parentId,
                _hasChildren: !!(item.children && item.children.length > 0)
            });

            flat.push(flatItem);

            // Recursively process children
            if (item.children && item.children.length > 0 && level < self.options.maxNestingLevel) {
                var childItems = self._flattenItems(item.children, level + 1, item.id);
                flat = flat.concat(childItems);
            }
        });

        return flat;
    };

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Set items and re-render
     * @param {Array} items - Array of item objects
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.setItems = function(items) {
        this._originalItems = items || [];
        this.items = this._flattenItems(this._originalItems, 0, null);
        this.expandedIds = new Set();

        // Process initial expanded states
        var self = this;
        this.items.forEach(function(item, index) {
            if (item.expanded) {
                self.expandedIds.add(item.id);
            }
        });

        // Handle expandFirst option
        if (this.options.expandFirst && this.items.length > 0 && this.expandedIds.size === 0) {
            this.expandedIds.add(this.items[0].id);
        }

        this._render();
        return this;
    };

    /**
     * Expand a panel by ID
     * @param {string} id - Item ID
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.expand = function(id) {
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl || !item || item.disabled) return this;

        // Check if already expanded
        if (this.expandedIds.has(id)) return this;

        // Emit beforeExpand (cancelable)
        var cancelled = false;
        this._emit('beforeExpand', {
            id: id,
            item: item,
            cancel: function() { cancelled = true; }
        });

        if (cancelled) return this;

        // If single-expand mode, collapse others
        if (!this.options.allowMultiple) {
            var self = this;
            this.expandedIds.forEach(function(expandedId) {
                if (expandedId !== id) {
                    self._collapseItem(expandedId);
                }
            });
        }

        this._expandItem(id);
        return this;
    };

    AccordionInstance.prototype._expandItem = function(id) {
        var self = this;
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl) return;

        // Check if lazy load needed
        if (item.lazyLoad && !item._loaded && typeof this.options.onLazyLoad === 'function') {
            this._loadLazyContent(id, function() {
                self._doExpandItem(id);
            });
            return;
        }

        this._doExpandItem(id);
    };

    /**
     * Actually expand the item (after content loaded)
     * @private
     */
    AccordionInstance.prototype._doExpandItem = function(id) {
        var self = this;
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl) return;

        this.expandedIds.add(id);

        // Update classes (use Funky.Dom methods)
        itemEl.classRemove('funky-accordion__item--collapsed');
        itemEl.classAdd('funky-accordion__item--expanded');
        itemEl.classRemove('funky-accordion__item--loading');

        // Update ARIA
        var headerBtn = itemEl._headerBtn;
        if (headerBtn) {
            headerBtn.attr('aria-expanded', 'true');
        }

        // Update chevron
        var chevronEl = itemEl._chevronEl;
        if (chevronEl) {
            chevronEl.classAdd('funky-accordion__chevron--rotated');

            // If using different icons, swap them
            if (this.options.collapseIcon) {
                this._updateChevronIcon(chevronEl, this.options.collapseIcon);
            }
        }

        // Show panel with animation
        var panelEl = itemEl._panelEl;
        if (panelEl) {
            // Get native element for DOM operations
            var panelNative = panelEl.el || panelEl;
            panelEl.attr('hidden', null); // Remove hidden attribute

            if (this._useMorph()) {
                // Use Funky.Morph for smooth animation
                Funky.Morph.height(panelNative, {
                    from: 0,
                    to: 'auto',
                    duration: this.options.animationDuration,
                    onComplete: function() {
                        panelNative.style.height = '';
                    }
                });
            } else if (this.options.animated) {
                // CSS animation fallback
                this._animateExpand(panelNative);
            }
        }

        // Update URL hash if enabled
        if (this.options.hashNavigation) {
            this._updateHash(id);
        }

        // Focus on panel if configured
        if (this.options.focusOnExpand && panelEl) {
            var panelNative = panelEl.el || panelEl;
            var duration = this.options.animationDuration;
            setTimeout(function() {
                // Find first focusable element in panel
                var focusable = panelNative.querySelector(
                    'a[href], button:not([disabled]), input:not([disabled]), ' +
                    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable) {
                    focusable.focus();
                } else {
                    // Make panel focusable temporarily
                    panelNative.setAttribute('tabindex', '-1');
                    panelNative.focus();
                    panelNative.removeAttribute('tabindex');
                }
            }, duration);
        }

        // Announce for screen readers
        if (Funky.Announce) {
            Funky.Announce.polite(item.title + ' expanded');
        }

        this._emit('expand', { id: id, item: item });
    };

    // -------------------------------------------------------------------------
    // Lazy Loading
    // -------------------------------------------------------------------------

    /**
     * Load lazy content for item
     * @private
     */
    AccordionInstance.prototype._loadLazyContent = function(id, callback) {
        var self = this;
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl || !item) return;

        // Mark as loading
        itemEl.classAdd('funky-accordion__item--loading');

        // Show loading indicator
        var panelEl = itemEl._panelEl;
        if (panelEl) {
            panelEl.attr('hidden', null); // Remove hidden attribute

            // Show loading state
            var loadingEl = this._buildLoadingPlaceholder(item);
            var contentEl = itemEl._contentEl;
            if (contentEl) {
                contentEl.html('');
                contentEl.append(loadingEl);
            }
        }

        // Emit loading event
        this._emit('lazyLoad', { id: id, item: item, status: 'loading' });

        // Call the lazy load handler
        this.options.onLazyLoad(item, function(content, error) {
            if (error) {
                self._handleLazyError(id, error);
                return;
            }

            self._handleLazySuccess(id, content, callback);
        });
    };

    /**
     * Handle successful lazy load
     * @private
     */
    AccordionInstance.prototype._handleLazySuccess = function(id, content, callback) {
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl || !item) return;

        // Update item with loaded content
        item.content = content;
        item._loaded = true;

        // Remove lazy class
        itemEl.classRemove('funky-accordion__item--lazy');

        // Replace loading placeholder with actual content
        var contentEl = this._buildContent(item);
        var panelEl = itemEl._panelEl;
        if (panelEl) {
            panelEl.html('');
            panelEl.append(contentEl);
            itemEl._contentEl = contentEl;
        }

        // Apply content truncation if configured
        if (this.options.truncateContent) {
            this._applyContentTruncation(contentEl, item);
        }

        // Emit success event
        this._emit('lazyLoad', { id: id, item: item, content: content, status: 'success' });

        // Continue with expand
        if (callback) {
            callback();
        }
    };

    /**
     * Handle lazy load error
     * @private
     */
    AccordionInstance.prototype._handleLazyError = function(id, error) {
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl || !item) return;

        // Remove loading state
        itemEl.classRemove('funky-accordion__item--loading');

        // Show error in panel
        var panelEl = itemEl._panelEl;
        if (panelEl) {
            var errorEl = D.create('div')
                .classAdd('funky-accordion__error')
                .html('<i class="fas fa-exclamation-circle"></i> Failed to load content');

            panelEl.html('');
            panelEl.append(errorEl);
        }

        // Emit error event
        this._emit('lazyError', { id: id, item: item, error: error });

        // Announce error
        if (Funky.Announce) {
            Funky.Announce.assertive('Failed to load ' + item.title);
        }
    };

    // -------------------------------------------------------------------------
    // Content Truncation
    // -------------------------------------------------------------------------

    /**
     * Apply content truncation
     * @private
     */
    AccordionInstance.prototype._applyContentTruncation = function(contentEl, item) {
        var opts = this.options.truncateContent;
        var self = this;
        if (!opts) return;

        // Use Funky.Truncate if available
        if (Funky.Truncate && typeof Funky.Truncate.apply === 'function') {
            Funky.Truncate.apply(contentEl, {
                lines: opts.lines,
                limit: opts.limit,
                moreText: opts.moreText || 'Show more',
                lessText: opts.lessText || 'Show less'
            });

            // Listen for truncate events
            contentEl.addEventListener('funky.truncate.expand', function() {
                self._emit('contentExpand', { id: item.id, item: item });
            });
            contentEl.addEventListener('funky.truncate.collapse', function() {
                self._emit('contentCollapse', { id: item.id, item: item });
            });
        }
    };

    /**
     * Collapse a panel by ID
     * @param {string} id - Item ID
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.collapse = function(id) {
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl || !item || item.disabled) return this;

        // Check if already collapsed
        if (!this.expandedIds.has(id)) return this;

        // Check if collapsible (if only one open and collapsible is false)
        if (!this.options.collapsible && this.expandedIds.size === 1) {
            return this;
        }

        // Emit beforeCollapse (cancelable)
        var cancelled = false;
        this._emit('beforeCollapse', {
            id: id,
            item: item,
            cancel: function() { cancelled = true; }
        });

        if (cancelled) return this;

        this._collapseItem(id);
        return this;
    };

    AccordionInstance.prototype._collapseItem = function(id) {
        var self = this;
        var itemEl = this._itemElements[id];
        var item = this._getItemById(id);
        if (!itemEl) return;

        this.expandedIds.delete(id);

        // Update classes (use Funky.Dom methods)
        itemEl.classRemove('funky-accordion__item--expanded');
        itemEl.classAdd('funky-accordion__item--collapsed');

        // Update ARIA
        var headerBtn = itemEl._headerBtn;
        if (headerBtn) {
            headerBtn.attr('aria-expanded', 'false');
        }

        // Update chevron
        var chevronEl = itemEl._chevronEl;
        if (chevronEl) {
            chevronEl.classRemove('funky-accordion__chevron--rotated');

            // If using different icons, swap them back
            if (this.options.collapseIcon) {
                this._updateChevronIcon(chevronEl, this.options.expandIcon);
            }
        }

        // Hide panel with animation
        var panelEl = itemEl._panelEl;
        if (panelEl) {
            // Get native element for DOM operations
            var panelNative = panelEl.el || panelEl;
            if (this._useMorph()) {
                // Use Funky.Morph for smooth animation
                Funky.Morph.height(panelNative, {
                    from: panelNative.offsetHeight,
                    to: 0,
                    duration: this.options.animationDuration,
                    onComplete: function() {
                        panelEl.attr('hidden', '');
                        panelNative.style.height = '';
                    }
                });
            } else if (this.options.animated) {
                // CSS animation fallback
                this._animateCollapse(panelNative, panelEl);
            } else {
                panelEl.attr('hidden', '');
            }
        }

        // Announce for screen readers
        if (Funky.Announce) {
            Funky.Announce.polite(item.title + ' collapsed');
        }

        this._emit('collapse', { id: id, item: item });
    };

    // -------------------------------------------------------------------------
    // Animation Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if Morph is available and should be used
     * @private
     */
    AccordionInstance.prototype._useMorph = function() {
        return this.options.useMorph &&
               this.options.animated &&
               Funky.Morph &&
               typeof Funky.Morph.height === 'function';
    };

    /**
     * CSS animation fallback for expand
     * @private
     */
    AccordionInstance.prototype._animateExpand = function(panelEl) {
        var self = this;
        var duration = this.options.animationDuration;

        // Get the natural height
        panelEl.style.height = 'auto';
        var targetHeight = panelEl.offsetHeight;

        // Start from 0
        panelEl.style.height = '0px';
        panelEl.style.overflow = 'hidden';
        panelEl.style.transition = 'height ' + duration + 'ms ease-in-out';

        // Force reflow
        panelEl.offsetHeight;

        // Animate to target
        panelEl.style.height = targetHeight + 'px';

        // Cleanup after animation
        setTimeout(function() {
            panelEl.style.height = '';
            panelEl.style.overflow = '';
            panelEl.style.transition = '';
        }, duration);
    };

    /**
     * CSS animation fallback for collapse
     * @private
     * @param {Element} panelNative - Native DOM element
     * @param {Object} panelEl - Funky.Dom wrapper for attr()
     */
    AccordionInstance.prototype._animateCollapse = function(panelNative, panelEl) {
        var self = this;
        var duration = this.options.animationDuration;

        // Start from current height
        var currentHeight = panelNative.offsetHeight;
        panelNative.style.height = currentHeight + 'px';
        panelNative.style.overflow = 'hidden';
        panelNative.style.transition = 'height ' + duration + 'ms ease-in-out';

        // Force reflow
        panelNative.offsetHeight;

        // Animate to 0
        panelNative.style.height = '0px';

        // Hide after animation
        setTimeout(function() {
            panelEl.attr('hidden', '');
            panelNative.style.height = '';
            panelNative.style.overflow = '';
            panelNative.style.transition = '';
        }, duration);
    };

    // -------------------------------------------------------------------------
    // Hash Navigation
    // -------------------------------------------------------------------------

    /**
     * Initialize hash navigation
     * @private
     */
    AccordionInstance.prototype._initHashNav = function() {
        if (!this.options.hashNavigation) return;

        var self = this;

        // Handle initial hash
        this._handleHashChange();

        // Listen for hash changes
        this._hashChangeHandler = function() {
            if (!self._skipHashChange) {
                self._handleHashChange();
            }
        };
        window.addEventListener('hashchange', this._hashChangeHandler);
    };

    /**
     * Handle hash change
     * @private
     */
    AccordionInstance.prototype._handleHashChange = function() {
        var hash = window.location.hash;
        if (!hash) return;

        // Remove # prefix
        var id = hash.substring(1);

        // Remove our prefix if present
        var prefix = this.options.hashPrefix;
        if (prefix && id.indexOf(prefix) === 0) {
            id = id.substring(prefix.length);
        }

        // Check if this ID belongs to our accordion
        var item = this._getItemById(id);
        if (!item) return;

        // Expand the item
        this.expand(id);

        // Scroll into view
        var self = this;
        var itemEl = this._itemElements[id];
        if (itemEl) {
            setTimeout(function() {
                itemEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, self.options.animationDuration);
        }
    };

    /**
     * Update hash when item expands
     * @private
     */
    AccordionInstance.prototype._updateHash = function(id) {
        if (!this.options.hashNavigation) return;

        var prefix = this.options.hashPrefix;
        var hash = '#' + (prefix || '') + id;

        // Update hash without triggering hashchange handler
        this._skipHashChange = true;
        history.replaceState(null, null, hash);

        var self = this;
        setTimeout(function() {
            self._skipHashChange = false;
        }, 0);
    };

    // -------------------------------------------------------------------------
    // Search Methods
    // -------------------------------------------------------------------------

    /**
     * Search/filter items
     * @param {string} query - Search query
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.search = function(query) {
        var self = this;
        var opts = this.options;

        this._currentQuery = query;

        // Empty query - show all
        if (!query || query.trim() === '') {
            this.clearSearch();
            return this;
        }

        var results;
        var matchData = {};

        // Use FuzzySearch if available
        if (Funky.FuzzySearch && typeof Funky.FuzzySearch.search === 'function') {
            var searchResults = Funky.FuzzySearch.search(query, this.items, {
                keys: opts.searchKeys,
                threshold: opts.searchThreshold,
                includeMatches: opts.highlightMatches
            });

            results = [];
            searchResults.forEach(function(result) {
                results.push(result.item.id);
                if (result.matches) {
                    matchData[result.item.id] = result.matches;
                }
            });
        } else {
            // Basic string matching fallback
            var lowerQuery = query.toLowerCase();
            results = [];

            this.items.forEach(function(item) {
                var matched = opts.searchKeys.some(function(key) {
                    var value = item[key];
                    return value && String(value).toLowerCase().indexOf(lowerQuery) !== -1;
                });
                if (matched) {
                    results.push(item.id);
                }
            });
        }

        // Update visibility
        this._applySearchResults(results, matchData, query);

        // Emit event
        this._emit('search', {
            query: query,
            results: results,
            count: results.length
        });

        // Announce
        if (Funky.Announce) {
            if (results.length === 0) {
                Funky.Announce.polite('No sections match your search');
            } else {
                Funky.Announce.polite(results.length + ' section' + (results.length === 1 ? '' : 's') + ' found');
            }
        }

        return this;
    };

    /**
     * Clear search and show all items
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.clearSearch = function() {
        var self = this;

        this._currentQuery = '';

        // Show all items
        Object.keys(this._itemElements).forEach(function(id) {
            var itemEl = self._itemElements[id];
            itemEl.classRemove('funky-accordion__item--hidden');
            itemEl.style({ display: '' });
            self._removeHighlight(itemEl);
        });

        // Hide empty state
        this._hideEmptyState();

        this._emit('search', {
            query: '',
            results: this.items.map(function(i) { return i.id; }),
            count: this.items.length
        });

        return this;
    };

    /**
     * Apply search results to UI
     * @private
     */
    AccordionInstance.prototype._applySearchResults = function(visibleIds, matchData, query) {
        var self = this;
        var opts = this.options;
        var hasResults = visibleIds.length > 0;

        // Update item visibility
        Object.keys(this._itemElements).forEach(function(id) {
            var itemEl = self._itemElements[id];
            var isVisible = visibleIds.indexOf(id) !== -1;

            if (isVisible) {
                itemEl.classRemove('funky-accordion__item--hidden');
                itemEl.style({ display: '' });

                // Apply highlighting
                if (opts.highlightMatches && query) {
                    self._highlightItem(itemEl, id, matchData[id], query);
                }
            } else {
                itemEl.classAdd('funky-accordion__item--hidden');
                itemEl.style({ display: 'none' });

                // Remove highlighting
                self._removeHighlight(itemEl);
            }
        });

        // Show/hide empty state
        if (hasResults) {
            this._hideEmptyState();
        } else {
            this._showEmptyState();
        }
    };

    /**
     * Highlight matching text in item
     * @private
     */
    AccordionInstance.prototype._highlightItem = function(itemEl, id, matches, query) {
        // Get native element for querySelector
        var nativeEl = itemEl.el || itemEl;
        var titleEl = nativeEl.querySelector('.funky-accordion__title');
        if (!titleEl) return;

        var item = this._getItemById(id);
        if (!item) return;

        // Use Funky.Highlight if available
        if (Funky.Highlight && typeof Funky.Highlight.html === 'function') {
            titleEl.innerHTML = Funky.Highlight.html(item.title, [query], {
                className: 'funky-accordion__highlight'
            });
        } else {
            // Basic highlight fallback
            var regex = new RegExp('(' + this._escapeRegex(query) + ')', 'gi');
            titleEl.innerHTML = item.title.replace(regex, '<mark class="funky-accordion__highlight">$1</mark>');
        }
    };

    /**
     * Remove highlighting from item
     * @private
     */
    AccordionInstance.prototype._removeHighlight = function(itemEl) {
        // Get native element for querySelector
        var nativeEl = itemEl.el || itemEl;
        var titleEl = nativeEl.querySelector('.funky-accordion__title');
        if (!titleEl) return;

        var item = itemEl._item;
        if (item) {
            titleEl.textContent = item.title;
        }
    };

    /**
     * Escape regex special characters
     * @private
     */
    AccordionInstance.prototype._escapeRegex = function(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // -------------------------------------------------------------------------
    // Empty State
    // -------------------------------------------------------------------------

    /**
     * Show empty state
     * @private
     */
    AccordionInstance.prototype._showEmptyState = function() {
        var opts = this.options;
        var emptyEl = this._emptyStateEl;

        if (!emptyEl) return;

        emptyEl.html('');

        // Use EmptyState if available
        if (Funky.EmptyState && typeof Funky.EmptyState.render === 'function') {
            var content = Funky.EmptyState.render({
                type: 'no-results',
                icon: opts.emptyStateIcon,
                title: opts.emptyStateMessage,
                action: opts.emptyStateAction
            });
            emptyEl.append(content);
        } else {
            // Simple fallback
            var wrapper = D.create('div')
                .classAdd('funky-accordion__empty-content');

            if (opts.emptyStateIcon) {
                var iconEl = D.create('div').classAdd('funky-accordion__empty-icon');
                if (D.icon) {
                    iconEl.append(D.icon(opts.emptyStateIcon));
                } else {
                    iconEl.html('<i class="' + opts.emptyStateIcon + '"></i>');
                }
                wrapper.append(iconEl);
            }

            wrapper.append(
                D.create('p')
                    .classAdd('funky-accordion__empty-message')
                    .text(opts.emptyStateMessage)
            );

            if (opts.emptyStateAction) {
                var actionBtn = D.create('button')
                    .classAdd('funky-accordion__empty-action', 'btn', 'btn-sm', 'btn-outline-primary')
                    .attr('type', 'button')
                    .text(opts.emptyStateAction.text)
                    .on('click', opts.emptyStateAction.onClick);
                wrapper.append(actionBtn);
            }

            emptyEl.append(wrapper);
        }

        emptyEl.style({ display: '' });
        if (this._itemsContainer) {
            this._itemsContainer.style({ display: 'none' });
        }
    };

    /**
     * Hide empty state
     * @private
     */
    AccordionInstance.prototype._hideEmptyState = function() {
        if (this._emptyStateEl) {
            this._emptyStateEl.style({ display: 'none' });
        }
        if (this._itemsContainer) {
            this._itemsContainer.style({ display: '' });
        }
    };

    /**
     * Toggle a panel by ID
     * @param {string} id - Item ID
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.toggle = function(id) {
        if (this.expandedIds.has(id)) {
            return this.collapse(id);
        } else {
            return this.expand(id);
        }
    };

    /**
     * Check if a panel is expanded
     * @param {string} id - Item ID
     * @returns {boolean}
     */
    AccordionInstance.prototype.isExpanded = function(id) {
        return this.expandedIds.has(id);
    };

    /**
     * Get array of expanded IDs
     * @returns {Array<string>}
     */
    AccordionInstance.prototype.getExpanded = function() {
        return Array.from(this.expandedIds);
    };

    /**
     * Expand all items
     * @param {Object} options - { skipDisabled: true, skipLazy: false }
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.expandAll = function(options) {
        var self = this;
        var opts = Object.assign({ skipDisabled: true, skipLazy: false }, options);

        this.items.forEach(function(item) {
            // Skip disabled items
            if (opts.skipDisabled && item.disabled) return;

            // Skip lazy items if configured
            if (opts.skipLazy && item.lazyLoad && !item._loaded) return;

            // Skip already expanded
            if (self.expandedIds.has(item.id)) return;

            self.expand(item.id);
        });

        // Announce
        if (Funky.Announce) {
            Funky.Announce.polite('All sections expanded');
        }

        this._emit('expandAll', {});

        return this;
    };

    /**
     * Collapse all items
     * @param {Object} options - { skipDisabled: true }
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.collapseAll = function(options) {
        var self = this;
        var opts = Object.assign({ skipDisabled: true }, options);

        // If collapsible is false, keep one open
        var keepOneOpen = !this.options.collapsible;
        var firstExpanded = null;

        this.items.forEach(function(item) {
            // Skip disabled items
            if (opts.skipDisabled && item.disabled) return;

            // Skip already collapsed
            if (!self.expandedIds.has(item.id)) return;

            // Track first expanded for keepOneOpen
            if (keepOneOpen && !firstExpanded) {
                firstExpanded = item.id;
                return;
            }

            self.collapse(item.id);
        });

        // Announce
        if (Funky.Announce) {
            Funky.Announce.polite('All sections collapsed');
        }

        this._emit('collapseAll', {});

        return this;
    };

    /**
     * Toggle all items
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.toggleAll = function() {
        // If any are expanded, collapse all; otherwise expand all
        if (this.expandedIds.size > 0) {
            return this.collapseAll();
        } else {
            return this.expandAll();
        }
    };

    /**
     * Disable an item
     * @param {string} id - Item ID
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.disable = function(id) {
        var item = this._getItemById(id);
        var itemEl = this._itemElements[id];
        if (!item || !itemEl) return this;

        item.disabled = true;
        itemEl.classAdd('funky-accordion__item--disabled');

        var headerBtn = itemEl._headerBtn;
        if (headerBtn) {
            // headerBtn may be Funky.Dom wrapper (.el) or raw element
            var el = headerBtn.el || headerBtn;
            el.setAttribute('aria-disabled', 'true');
        }

        return this;
    };

    /**
     * Enable an item
     * @param {string} id - Item ID
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.enable = function(id) {
        var item = this._getItemById(id);
        var itemEl = this._itemElements[id];
        if (!item || !itemEl) return this;

        item.disabled = false;
        itemEl.classRemove('funky-accordion__item--disabled');

        var headerBtn = itemEl._headerBtn;
        if (headerBtn) {
            // headerBtn may be Funky.Dom wrapper (.el) or raw element
            var el = headerBtn.el || headerBtn;
            el.removeAttribute('aria-disabled');
        }

        return this;
    };

    /**
     * Check if an item is disabled
     * @param {string} id - Item ID
     * @returns {boolean}
     */
    AccordionInstance.prototype.isDisabled = function(id) {
        var item = this._getItemById(id);
        return item ? item.disabled === true : false;
    };

    /**
     * Get item by ID
     * @param {string} id - Item ID
     * @returns {Object|null}
     */
    AccordionInstance.prototype.getItem = function(id) {
        return this._getItemById(id);
    };

    /**
     * Get all items
     * @returns {Array}
     */
    AccordionInstance.prototype.getItems = function() {
        return this.items.slice();
    };

    /**
     * Add an item
     * @param {Object} item - Item to add
     * @param {number} index - Position (optional, defaults to end)
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.addItem = function(item, index) {
        if (index === undefined) {
            this.items.push(item);
        } else {
            this.items.splice(index, 0, item);
        }

        this._render();
        return this;
    };

    /**
     * Remove an item
     * @param {string} id - Item ID
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.removeItem = function(id) {
        var index = -1;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            this.items.splice(index, 1);
            this.expandedIds.delete(id);
            this._render();
        }

        return this;
    };

    /**
     * Update an item
     * @param {string} id - Item ID
     * @param {Object} updates - Properties to update
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.updateItem = function(id, updates) {
        var item = this._getItemById(id);
        if (!item) return this;

        Object.assign(item, updates);
        this._render();

        return this;
    };

    /**
     * Scroll an item into view
     * @param {string} id - Item ID
     * @param {Object} options - scrollIntoView options
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.scrollTo = function(id, options) {
        var itemEl = this._itemElements[id];
        if (!itemEl) return this;

        var scrollOptions = Object.assign({
            behavior: 'smooth',
            block: 'start'
        }, options);

        // itemEl may be Funky.Dom wrapper (.el) or raw element
        var el = itemEl.el || itemEl;
        el.scrollIntoView(scrollOptions);

        return this;
    };

    /**
     * Refresh the accordion (re-render)
     * @returns {AccordionInstance}
     */
    AccordionInstance.prototype.refresh = function() {
        this._render();
        return this;
    };

    /**
     * Destroy the accordion instance
     */
    AccordionInstance.prototype.destroy = function() {
        if (this._destroyed) return;

        this._emit('destroy', { instance: this });

        // Cleanup keyboard handlers
        if (this._keyboardUnregisters && this._keyboardUnregisters.length) {
            this._keyboardUnregisters.forEach(function(unregister) {
                if (unregister) unregister();
            });
            this._keyboardUnregisters = [];
        }
        if (this._keydownHandler && this._containerEl) {
            this._containerEl.off('keydown', this._keydownHandler);
        }

        // Remove hash change listener
        if (this._hashChangeHandler) {
            window.removeEventListener('hashchange', this._hashChangeHandler);
        }

        // Remove from instances
        _instances.unregister(this.id);

        // Clear container
        if (this._containerEl) {
            this._containerEl.html('');
            this._containerEl.classRemove('funky-accordion', 'funky-accordion--animated');
        }

        this._destroyed = true;
    };

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    AccordionInstance.prototype._getItemById = function(id) {
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return null;
    };

    AccordionInstance.prototype._emit = function(eventName, detail) {
        var event = new CustomEvent('funky.accordion.' + eventName, {
            bubbles: true,
            detail: detail
        });
        // Get native DOM element (may be Funky.Dom wrapper)
        var el = this._containerEl && this._containerEl.el ? this._containerEl.el : this._containerEl;
        if (el && el.dispatchEvent) {
            el.dispatchEvent(event);
        }
    };

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    var Accordion = {
        /**
         * Initialize an accordion on container
         * @param {Element|string} container - Container element or selector
         * @param {Object} options - Configuration options
         * @returns {AccordionInstance}
         */
        init: function(container, options) {
            var instance = new AccordionInstance(container, options);
            _instances.register(instance.id, instance);
            return instance;
        },

        /**
         * @deprecated Use Accordion.init() instead
         */
        create: function(container, options) {
            if (Funky.debug) {
                console.warn('[Funky.Accordion] create() is deprecated. Use init() instead.');
            }
            return Accordion.init(container, options);
        },

        /**
         * Get an instance by ID
         * @param {string} id - Instance ID
         * @returns {AccordionInstance|null}
         */
        getInstance: function(id) {
            return _instances.get(id);
        },

        /**
         * Get all instances
         * @returns {Array}
         */
        getInstances: function() {
            return _instances.getAll();
        },

        /**
         * Destroy accordion by ID
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
    // REGISTER
    // =========================================================================

    if (Funky.register) {
        Funky.register('Accordion', Accordion);
    }

})(window);
