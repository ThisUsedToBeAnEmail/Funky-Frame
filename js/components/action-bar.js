/**
 * Funky.ActionBar
 * 
 * Declarative action toolbar with automatic component integration.
 * Uses role="toolbar" for accessibility.
 * 
 * @example
 * <div class="action-bar" role="toolbar" aria-label="Page actions" data-entity="clients">
 *   <button data-action="create" data-modal="#clientModal">Add</button>
 * </div>
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.ActionBar] Registry not found. Load namespace.js first.');
        return;
    }

    var D = Funky.Dom;
    var E = Funky.Events;

    var SELECTOR = '[role="toolbar"].action-bar';
    var instances = [];

    /**
     * ActionBar instance
     * @param {HTMLElement} el - The toolbar element
     */
    function ActionBar(el) {
        this.el = el;
        this.entity = el.getAttribute('data-entity') || '';
        this.api = el.getAttribute('data-api') || '';
        this.tableId = el.getAttribute('data-table-id') || null;
        this.buttons = D.all('[data-action]', el);
        
        this._bindEvents();
        this._setupKeyboard();
        this._bindTableEvents();
    }

    ActionBar.prototype = {
        /**
         * Bind click events to action buttons
         */
        _bindEvents: function() {
            var self = this;
            
            this.buttons.each(function(wrapper) {
                var btn = wrapper.el;
                wrapper.on('click', function(e) {
                    self._handleAction(e, btn);
                });
            });
        },

        /**
         * Handle action button click
         * @param {Event} e - Click event
         * @param {HTMLElement} btn - Button element
         */
        _handleAction: function(e, btn) {
            var action = btn.getAttribute('data-action');
            
            // Dispatch to action handlers (implemented in phase 2)
            if (typeof this['_action_' + action] === 'function') {
                this['_action_' + action](btn, e);
            }
            
            // Emit generic event (no DOM elements - they can't be cloned for postMessage)
            E.emit(this.el, 'funky.action-bar.action', {
                action: action,
                entity: this.entity,
                api: this.api
            });
        },

        /**
         * Get button by action name
         * @param {string} action - Action name
         * @returns {HTMLElement|null}
         */
        getButton: function(action) {
            var wrapper = D.one('[data-action="' + action + '"]', this.el);
            return wrapper ? wrapper.el : null;
        },

        /**
         * Enable/disable a button
         * @param {string} action - Action name
         * @param {boolean} enabled - Enable or disable
         */
        setEnabled: function(action, enabled) {
            var btn = this.getButton(action);
            if (btn) {
                btn.disabled = !enabled;
            }
        },

        /**
         * Show loading state on button
         * @param {string} action - Action name
         * @param {boolean} loading - Loading state
         */
        setLoading: function(action, loading) {
            var btn = this.getButton(action);
            if (!btn) return;
            
            var wrapper = D.wrap(btn);
            if (loading) {
                wrapper.classAdd('is-loading');
                btn.disabled = true;
            } else {
                wrapper.classRemove('is-loading');
                btn.disabled = false;
            }
        },

        // ─────────────────────────────────────────────────────────────
        // Keyboard Navigation
        // ─────────────────────────────────────────────────────────────

        /**
         * Set up keyboard navigation
         * Arrow keys move focus between buttons (roving tabindex)
         */
        _setupKeyboard: function() {
            var self = this;
            
            D.wrap(this.el).on('keydown', function(e) {
                self._handleKeydown(e);
            });
            
            // Set tabindex on buttons - first is in tab order, rest are -1
            this.buttons.each(function(wrapper, index) {
                wrapper.el.setAttribute('tabindex', index === 0 ? '0' : '-1');
            });
        },

        /**
         * Handle keydown in toolbar
         * @param {KeyboardEvent} e
         */
        _handleKeydown: function(e) {
            var key = e.key;
            
            // Get array of visible, enabled button elements
            var buttons = [];
            this.buttons.each(function(wrapper) {
                var el = wrapper.el;
                if (!el.disabled && el.offsetParent !== null) {
                    buttons.push(el);
                }
            });
            
            if (buttons.length === 0) return;
            
            var currentIndex = buttons.indexOf(document.activeElement);
            var newIndex = -1;
            
            switch (key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    newIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
                    break;
                    
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    newIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    newIndex = 0;
                    break;
                    
                case 'End':
                    e.preventDefault();
                    newIndex = buttons.length - 1;
                    break;
            }
            
            if (newIndex >= 0) {
                this._focusButton(buttons, newIndex);
            }
        },

        /**
         * Focus a button and update roving tabindex
         * @param {HTMLElement[]} buttons - Visible buttons
         * @param {number} index - Index to focus
         */
        _focusButton: function(buttons, index) {
            // Update tabindex (roving tabindex pattern)
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].setAttribute('tabindex', i === index ? '0' : '-1');
            }
            
            buttons[index].focus();
        },

        /**
         * Destroy instance
         */
        destroy: function() {
            // Event cleanup handled by garbage collection
            if (this.el) {
                this.el._actionBar = null;
                this.el = null;
            }
            this.buttons = null;
        },

        // ─────────────────────────────────────────────────────────────
        // Action Handlers
        // ─────────────────────────────────────────────────────────────

        /**
         * Handle create action
         * Opens FormModal for entity creation
         * @param {HTMLElement} btn - Button element
         */
        _action_create: function(btn) {
            var modalId = btn.getAttribute('data-modal');
            
            E.emit(this.el, 'funky.action-bar.create', {
                entity: this.entity,
                api: this.api,
                modalId: modalId
            });
            
            // Auto-open FormModal if specified and method exists
            if (modalId && Funky.FormModal && typeof Funky.FormModal.show === 'function') {
                Funky.FormModal.show({
                    modalId: modalId.replace(/^#/, ''),
                    mode: 'create',
                    entity: this.entity,
                    api: this.api
                });
            }
        },

        /**
         * Handle export action
         * Triggers centralized export flow
         * @param {HTMLElement} btn - Button element
         */
        _action_export: function(btn) {
            var config = btn.getAttribute('data-export-config') || this.entity;
            
            E.emit(this.el, 'funky.action-bar.export', {
                entity: this.entity,
                config: config
            });
            
            // Auto-trigger Export if available and method exists
            if (Funky.Export && typeof Funky.Export.show === 'function') {
                Funky.Export.show({
                    config: config,
                    entity: this.entity,
                    api: this.api,
                    tableId: this.tableId
                });
            }
        },

        /**
         * Handle import action
         * Opens import wizard
         * @param {HTMLElement} btn - Button element
         */
        _action_import: function(btn) {
            var config = btn.getAttribute('data-import-config') || this.entity;
            
            E.emit(this.el, 'funky.action-bar.import', {
                entity: this.entity,
                config: config
            });
            
            // Auto-open Import wizard if available and method exists
            if (Funky.Import && typeof Funky.Import.show === 'function') {
                Funky.Import.show({
                    config: config,
                    entity: this.entity,
                    api: this.api
                });
            }
        },

        /**
         * Handle filter action
         * Toggles FilterToolbar visibility
         * @param {HTMLElement} btn - Button element
         */
        _action_filter: function(btn) {
            var targetId = btn.getAttribute('data-filter-target');
            var target = targetId ? D.one(targetId) : null;
            var expanded = btn.getAttribute('aria-expanded') === 'true';
            var newState = !expanded;
            
            // Update aria-expanded
            btn.setAttribute('aria-expanded', String(newState));
            
            // Toggle target visibility
            if (target) {
                if (newState) {
                    target.classRemove('d-none').classAdd('show');
                } else {
                    target.classAdd('d-none').classRemove('show');
                }
            }
            
            E.emit(this.el, 'funky.action-bar.filter-toggle', {
                entity: this.entity,
                visible: newState,
                targetSelector: target ? '#' + target.attr('id') : null
            });
            
            // Notify FilterToolbar if available
            if (Funky.FilterToolbar && target) {
                var filterInstance = Funky.FilterToolbar.getInstance(target);
                if (filterInstance) {
                    if (newState) {
                        filterInstance.show();
                    } else {
                        filterInstance.hide();
                    }
                }
            }
        },

        /**
         * Handle custom action
         * For extensibility - just emits event
         * @param {HTMLElement} btn - Button element
         */
        _action_custom: function(btn) {
            var customAction = btn.getAttribute('data-custom-action');
            
            E.emit(this.el, 'funky.action-bar.custom', {
                entity: this.entity,
                action: customAction,
                buttonId: btn.id || null,
                buttonClasses: btn.className || null
            });
        },

        // ─────────────────────────────────────────────────────────────
        // LiveBinding Integration
        // ─────────────────────────────────────────────────────────────

        /**
         * Bind ActionBar state to LiveBinding for reactive updates
         * @param {Object} options - LiveBinding options
         * @param {string} options.source - Data source type ('api', 'event', 'state')
         * @param {string} [options.url] - API URL for 'api' source
         * @param {string} [options.event] - Event name for 'event' source
         * @param {Object} [options.data] - Initial data for 'state' source
         * @returns {ActionBar} this for chaining
         * 
         * @example
         * // API-driven state
         * actionBar.bindState({
         *     source: 'api',
         *     url: '/api/permissions/clients'
         * });
         * 
         * // Event-driven state
         * actionBar.bindState({
         *     source: 'event',
         *     event: 'funky:permissions:loaded'
         * });
         * 
         * // Manual state object
         * actionBar.bindState({
         *     source: 'state',
         *     data: { create: { enabled: true }, filter: { badge: 3 } }
         * });
         */
        bindState: function(options) {
            var self = this;
            
            if (!Funky.LiveBinding) {
                console.warn('[ActionBar] LiveBinding not available');
                return this;
            }
            
            // Create a hidden container for LiveBinding to target
            var stateContainer = D.create('div')
                .classAdd('action-bar-state')
                .attr('data-action-bar-state', this.entity)
                .css({ display: 'none' })
                .appendTo(this.el)
                .el;
            
            // Bind with LiveBinding
            this._liveBinding = Funky.LiveBinding.bind(stateContainer, {
                source: options.source,
                url: options.url,
                event: options.event,
                data: options.data,
                transform: function(data) {
                    // Apply state to buttons
                    self._applyState(data);
                    return data;
                }
            });
            
            return this;
        },

        /**
         * Apply state object to buttons
         * State shape: { actionName: { enabled, visible, loading, badge } }
         * @param {Object} state - State object
         */
        _applyState: function(state) {
            var self = this;
            
            if (!state || typeof state !== 'object') return;
            
            Object.keys(state).forEach(function(action) {
                var actionState = state[action];
                if (!actionState || typeof actionState !== 'object') return;
                
                var btn = self.getButton(action);
                if (!btn) return;
                
                var wrapper = D.wrap(btn);
                
                // enabled: true/false
                if (typeof actionState.enabled === 'boolean') {
                    btn.disabled = !actionState.enabled;
                }
                
                // visible: true/false
                if (typeof actionState.visible === 'boolean') {
                    if (actionState.visible) {
                        wrapper.classRemove('d-none');
                    } else {
                        wrapper.classAdd('d-none');
                    }
                }
                
                // loading: true/false
                if (typeof actionState.loading === 'boolean') {
                    self.setLoading(action, actionState.loading);
                }
                
                // badge: number (for filter count, etc.)
                if (typeof actionState.badge === 'number') {
                    self.setFilterCount(actionState.badge);
                }
            });
        },

        /**
         * Update state programmatically (for 'state' source)
         * @param {Object} newState - State updates to merge
         */
        updateState: function(newState) {
            if (this._liveBinding && this._liveBinding.update) {
                this._liveBinding.update(newState);
            } else {
                // Direct apply if no LiveBinding
                this._applyState(newState);
            }
        },

        /**
         * Update filter badge count
         * @param {number} count - Number of active filters
         */
        setFilterCount: function(count) {
            var btn = this.getButton('filter');
            if (!btn) return;

            var badgeWrapper = D.one('.badge', btn);

            if (count > 0) {
                var badgeEl;
                if (!badgeWrapper || !badgeWrapper.exists()) {
                    badgeEl = D.create('span')
                        .classAdd('badge', 'badge-pill', 'badge-primary')
                        .appendTo(btn)
                        .el;
                } else {
                    badgeEl = badgeWrapper.el;
                }
                if (badgeEl) {
                    badgeEl.textContent = count;
                }
                D.wrap(btn).classAdd('has-active-filters');
            } else {
                if (badgeWrapper && badgeWrapper.exists()) {
                    badgeWrapper.el.remove();
                }
                D.wrap(btn).classRemove('has-active-filters');
            }
        },

        // ─────────────────────────────────────────────────────────────
        // Bulk Selection
        // ─────────────────────────────────────────────────────────────

        /**
         * Update bulk selection state
         * Shows/hides bulk actions based on selection
         * @param {number} selectedCount - Number of selected rows
         */
        setBulkSelection: function(selectedCount) {
            var bulkBtn = this.getButton('bulk');
            if (!bulkBtn) return;
            
            var wrapper = D.wrap(bulkBtn);
            if (selectedCount > 0) {
                wrapper.classRemove('d-none');
                // Update count in button if present
                var countEl = D.one('.selection-count', bulkBtn);
                if (countEl) {
                    countEl.textContent = selectedCount + ' selected';
                }
            } else {
                wrapper.classAdd('d-none');
            }
            
            E.emit(this.el, 'funky.action-bar.bulk-update', {
                entity: this.entity,
                count: selectedCount
            });
        },

        /**
         * Listen for table/list selection changes
         * Supports: DataTables, Funky.Table, and custom selection events
         */
        _bindTableEvents: function() {
            var self = this;

            // Legacy DataTables integration (jQuery DataTables)
            if (this.tableId) {
                document.addEventListener('funky.datatable.select', function(e) {
                    var data = e.detail || {};
                    if (data.tableId === self.tableId) {
                        self.setBulkSelection(data.selectedCount);
                    }
                });
            }

            // Funky.Table integration - listen on document for bubbled events
            // or directly if tableId matches the table's container id
            document.addEventListener('funky.table.select', function(e) {
                var data = e.detail || {};
                var selectedCount = data.ids ? data.ids.length : 0;

                // If we have a tableId, only respond to that table
                // Otherwise respond to any table selection (useful for single-table pages)
                if (self.tableId) {
                    var target = e.target;
                    if (target && target.id === self.tableId) {
                        self.setBulkSelection(selectedCount);
                    }
                } else if (!self.tableId && self.el) {
                    // No tableId - check if table is a sibling/nearby element
                    var parent = self.el.parentElement;
                    if (parent && parent.contains(e.target)) {
                        self.setBulkSelection(selectedCount);
                    }
                }
            });

            // Generic bulk selection event - for non-table selection sources
            // e.g., file manager, kanban, custom lists
            document.addEventListener('funky.bulk.select', function(e) {
                var data = e.detail || {};

                // Match by entity or explicit actionBarId
                if (data.entity === self.entity || data.actionBarId === self.el.id) {
                    var selectedCount = data.count !== undefined ? data.count :
                                       (data.ids ? data.ids.length : 0);
                    self.setBulkSelection(selectedCount);
                }
            });
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Factory: Create ActionBar from config
    // ─────────────────────────────────────────────────────────────────

    /**
     * Default button configurations by action type
     */
    var BUTTON_DEFAULTS = {
        create: {
            icon: 'fa-plus',
            label: 'Add',
            variant: 'primary',
            attrs: {}
        },
        edit: {
            icon: 'fa-pencil',
            label: 'Edit',
            variant: 'outline-secondary',
            attrs: {}
        },
        delete: {
            icon: 'fa-trash',
            label: 'Delete',
            variant: 'outline-danger',
            attrs: {}
        },
        export: {
            icon: 'fa-download',
            label: 'Export',
            variant: 'outline-secondary',
            attrs: {}
        },
        import: {
            icon: 'fa-upload',
            label: 'Import',
            variant: 'outline-secondary',
            attrs: {}
        },
        filter: {
            icon: 'fa-filter',
            label: 'Filter',
            variant: 'outline-secondary',
            attrs: { 'aria-expanded': 'false' }
        },
        bulk: {
            icon: 'fa-check-square',
            label: 'Bulk Actions',
            variant: 'outline-warning',
            attrs: {}
        },
        refresh: {
            icon: 'fa-sync',
            label: 'Refresh',
            variant: 'outline-secondary',
            attrs: {}
        },
        print: {
            icon: 'fa-print',
            label: 'Print',
            variant: 'outline-secondary',
            attrs: {}
        },
        settings: {
            icon: 'fa-cog',
            label: 'Settings',
            variant: 'outline-secondary',
            attrs: {}
        }
    };

    /**
     * Create a button element from config
     * @param {Object} config - Button configuration
     * @param {string} config.action - Action name (required)
     * @param {string} [config.label] - Button label
     * @param {string} [config.icon] - FontAwesome icon class (without 'fas ')
     * @param {string} [config.variant] - Button variant (primary, secondary, etc.)
     * @param {boolean} [config.iconOnly] - Show only icon
     * @param {Object} [config.attrs] - Additional attributes
     * @returns {HTMLElement}
     */
    function createButton(config) {
        var action = config.action;
        var defaults = BUTTON_DEFAULTS[action] || {};
        
        var label = config.label !== undefined ? config.label : defaults.label || action;
        var icon = config.icon !== undefined ? config.icon : defaults.icon;
        var variant = config.variant || defaults.variant || 'outline-secondary';
        var iconOnly = config.iconOnly || false;
        var attrs = Object.assign({}, defaults.attrs, config.attrs || {});

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-' + variant;
        btn.setAttribute('data-action', action);

        // Apply additional attributes
        Object.keys(attrs).forEach(function(key) {
            btn.setAttribute(key, attrs[key]);
        });

        // Build inner HTML
        var html = '';
        if (icon) {
            html += '<i class="fas ' + icon;
            if (!iconOnly && label) {
                html += ' me-1';
            }
            html += '"></i>';
        }
        if (!iconOnly && label) {
            html += '<span class="btn-label">' + label + '</span>';
        }
        if (iconOnly && label) {
            btn.setAttribute('title', label);
            btn.setAttribute('aria-label', label);
        }

        btn.innerHTML = html;
        return btn;
    }

    /**
     * Create an ActionBar from configuration object
     * 
     * @param {Object} config - ActionBar configuration
     * @param {string|HTMLElement} config.container - Container element or selector
     * @param {string} [config.entity] - Entity name (e.g., 'clients')
     * @param {string} [config.api] - API endpoint
     * @param {string} [config.tableId] - Associated DataTable ID
     * @param {string} [config.ariaLabel] - Toolbar aria-label
     * @param {Array} config.buttons - Array of button configs
     * @param {string} [config.position] - Prepend or append to container ('prepend'|'append')
     * 
     * @example
     * Funky.ActionBar.create({
     *   container: '#toolbar-container',
     *   entity: 'clients',
     *   buttons: [
     *     { action: 'create', label: 'Add Client' },
     *     { action: 'export' },
     *     { action: 'filter', attrs: { 'data-filter-target': '#filterPanel' } },
     *     { action: 'custom', label: 'Custom', icon: 'fa-star', variant: 'success' }
     *   ]
     * });
     * 
     * @returns {ActionBar} The ActionBar instance
     */
    function init(config) {
        if (!config || !config.container) {
            console.error('[ActionBar.init] container is required');
            return null;
        }

        var container = typeof config.container === 'string'
            ? document.querySelector(config.container)
            : config.container;

        if (!container) {
            console.error('[ActionBar.init] Container not found:', config.container);
            return null;
        }

        var buttons = config.buttons || [];
        if (buttons.length === 0) {
            console.warn('[ActionBar.init] No buttons specified');
        }

        // Create toolbar element
        var toolbar = document.createElement('div');
        toolbar.className = 'action-bar d-flex gap-2 flex-wrap';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', config.ariaLabel || 'Page actions');

        if (config.entity) {
            toolbar.setAttribute('data-entity', config.entity);
        }
        if (config.api) {
            toolbar.setAttribute('data-api', config.api);
        }
        if (config.tableId) {
            toolbar.setAttribute('data-table-id', config.tableId);
        }

        // Create buttons
        buttons.forEach(function(btnConfig) {
            if (!btnConfig.action) {
                console.warn('[ActionBar.init] Button missing action:', btnConfig);
                return;
            }
            var btn = createButton(btnConfig);
            toolbar.appendChild(btn);
        });

        // Insert into container
        if (config.position === 'prepend' && container.firstChild) {
            container.insertBefore(toolbar, container.firstChild);
        } else {
            container.appendChild(toolbar);
        }

        // Initialize the ActionBar
        var instance = new ActionBar(toolbar);
        toolbar._actionBar = instance;
        instances.push(instance);

        return instance;
    }

    /**
     * Initialize all action bars on page (data-attribute auto-init)
     */
    function initAll() {
        D.all(SELECTOR).each(function(wrapper) {
            var el = wrapper.el;
            // Skip if already initialized
            if (el._actionBar) return;

            var instance = new ActionBar(el);
            el._actionBar = instance;
            instances.push(instance);
        });
    }

    /**
     * Get ActionBar instance for element
     * @param {HTMLElement|string} el - Element or selector
     * @returns {ActionBar|null}
     */
    function getInstance(el) {
        if (typeof el === 'string') {
            el = D.one(el);
        }
        // D.one returns ElementWrapper, so access .el to get DOM element
        if (el && el.el) {
            el = el.el;
        }
        return el && el._actionBar ? el._actionBar : null;
    }

    /**
     * Destroy instance by element
     * @param {HTMLElement|string} el - Element or selector
     */
    function destroy(el) {
        var instance = getInstance(el);
        if (instance) {
            instance.destroy();
            var idx = instances.indexOf(instance);
            if (idx > -1) {
                instances.splice(idx, 1);
            }
        }
    }

    /**
     * Destroy all instances
     */
    function destroyAll() {
        instances.forEach(function(instance) {
            instance.destroy();
        });
        instances = [];
    }

    /**
     * @deprecated Use init() instead
     */
    function create(config) {
        return init(config);
    }

    // Auto-init on DOMContentLoaded and SPA navigation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
    document.addEventListener('funky.spa.pageload', initAll);

    // Register component
    Funky.register('ActionBar', {
        init: init,
        initAll: initAll,
        create: create,
        getInstance: getInstance,
        destroy: destroy,
        destroyAll: destroyAll
    });

})(window);
