/**
 * Funky DataTables - Centralized DataTables Configuration
 * 
 * Provides unified configuration for all DataTables with:
 * - Column name mappings for server-side sorting
 * - CSRF token integration
 * - Global search, date range, and client filters
 * - Export and import buttons
 * - Responsive breakpoints
 * - Smart cache-aware updates with WebSocket integration
 * - Entity relationship cascading for cross-table updates
 * 
 * COMPATIBILITY LAYER (Phase 20):
 * This module can delegate to Funky.Table internally when USE_FUNKY_TABLE is enabled,
 * while maintaining backward compatibility with the existing FunkyDataTables API.
 * This allows gradual migration without template changes.
 * 
 * Usage:
 *   var dt = Funky.DataTables.init('#myTable', {
 *     tableName: 'trades',
 *     entityType: 'trade',  // For cache sync (defaults to tableName singular)
 *     ajaxUrl: '/api/trades',
 *     columns: [...],
 *     extraAjaxData: { client_id: 123 }
 *   });
 * 
 * Smart Update Methods:
 *   Funky.DataTables.getByType('trade')    // Get all tables for entity type
 *   Funky.DataTables.highlightRow(dt, id)  // Flash highlight a row
 *   Funky.DataTables.removeRow(dt, id)     // Animate and remove row
 *   Funky.DataTables.refreshByType('trade') // Refresh all tables for type
 * 
 * Migration Control:
 *   Funky.DataTables.enableFunkyTable()    // Use Funky.Table internally
 *   Funky.DataTables.disableFunkyTable()   // Use jQuery DataTables (default)
 *   Funky.DataTables.isFunkyTableEnabled() // Check current mode
 * 
 * @version 1.0.3
 */
(function(window) {
  'use strict';

  // ============================================
  // FEATURE FLAG - Controls Funky.Table delegation
  // Set to true to use Funky.Table, false for jQuery DataTables
  // ============================================
  var USE_FUNKY_TABLE = false;

  // Ensure Funky registry exists
  if (!window.Funky || !window.Funky.register) {
    console.error('[Funky.DataTables] Registry not found. Load namespace.js first.');
    return;
  }

  // Registry to track all DataTable instances by entity type
  var tableRegistry = {};

  // Instance registry by element ID for LiveBinding
  var instanceRegistry = {};

  // Entity relationship map - when one entity changes, which others should refresh
  // Uses plural forms to match WebSocket entity names
  var ENTITY_RELATIONSHIPS = {
    // Trade action changes cascade to trade tables too
    trade_actions: ['trades', 'trade_actions', 'trade_action_queue'],
    
    // Trade changes should also refresh action tables
    trades: ['trades', 'trade_actions', 'trade_action_queue'],
    
    // Trade allocation changes affect trades
    trade_allocations: ['trade_allocations', 'trades'],
    
    // Most entities only refresh themselves (default behavior)
    clients: ['clients'],
    securities: ['securities'],
    client_relationships: ['client_relationships'],
    fx_rates: ['fx_rates'],
    users: ['users'],
    trade_templates: ['trade_templates'],
    allocations: ['allocations'],
    report_formats: ['report_formats'],
    push_subscriptions: ['push_subscriptions'],
    push_notifications: ['push_notifications']
  };

  /**
   * FunkyDataTables Constructor
   */
  function FunkyDataTables() {
    // Column name mappings for each table type with sortable column information
    this.columnMappings = {
      allocations: {
        columns: ['id', 'client_name', 'fund_cd', 'description', 'created_at', 'actions'],
        sortable: new Set(['id', 'client_name', 'fund_cd', 'description', 'created_at'])
      },
      clients: {
        columns: ['id', 'code', 'name', 'description', 'is_active', 'created_at', 'actions'],
        sortable: new Set(['id', 'code', 'name', 'description', 'is_active', 'created_at'])
      },
      securities: {
        columns: ['id', 'isin', 'name', 'market_price', 'market_price_date', 'description', 'code', 'cuisip', 'sedol', 'country', 'type', 'market', 'currency', 'is_active', 'actions'],
        sortable: new Set(['id', 'code', 'name', 'type', 'market', 'isin', 'is_active', 'created_at'])
      },
      'fx_rates': {
        columns: ['id', 'base_currency', 'currency', 'rate', 'is_active', 'created_at', 'updated_at', 'updated_by', 'actions'],
        sortable: new Set(['id', 'base_currency', 'currency', 'rate', 'is_active', 'created_at', 'updated_at'])
      },
      trades: {
        columns: ['id', 'trade_ref', 'template', 'template_id', 'contract_id', 'description', 'client_id', 'client_name', 'client_code', 'client_relationship_id', 'security_id', 'security_name', 'security_code', 'quantity', 'intitial_quantity', 'trade_value', 'notional_value', 'loan_value', 'market_value', 'cash_value', 'collateral_value', 'notional_price', 'market_price', 'prepay_rate', 'rebate_rate', 'dividend_rate', 'fee_rate', 'exposure_margin', 'mark_margin', 'trade_date', 'term_date', 'term_date_hard', 'execution_time', 'cash_settlement_date', 'last_marked', 'last_priced', 'cash_ccy', 'notional_ccy', 'exposure_ccy', 'loan_ccy', 'borrow_loan_ind', 'loan_return_ind', 'closed_ind', 'settlement_ind', 'mark_ind', 'dni_ind', 'dvp_ind', 'collateral_upgrade_ind', 'sec_settlement_ind', 'cash_settlement_ind', 'trade_collateral_ind', 'collateral_type_ind', 'tracking_uti', 'trading_venue_cd', 'tpca_id', 'tpca_profile', 'trans_type', 'is_active', 'deleted', 'created_at', 'created_by', 'updated_at', 'updated_by', 'actions'],
        sortable: new Set(['id', 'trade_ref', 'template', 'template_id', 'contract_id', 'description', 'client_id', 'client_name', 'client_code', 'security_id', 'security_name', 'security_code', 'quantity', 'trade_value', 'notional_value', 'loan_value', 'market_value', 'trade_date', 'term_date', 'is_active', 'deleted', 'created_at', 'updated_at'])
      },
      'trade_actions': {
        columns: ['id', 'trade_id', 'trade_ref', 'trade_reference', 'trade_type', 'description', 'client_id', 'client_name', 'client_code', 'group_cd', 'group_descr', 'quantity', 'intitial_quantity', 'return_quantity', 'trade_value', 'notional_value', 'loan_value', 'market_value', 'cash_value', 'collateral_value', 'notional_price', 'market_price', 'prepay_rate', 'rebate_rate', 'dividend_rate', 'fee_rate', 'exposure_margin', 'mark_margin', 'trade_date', 'term_date', 'term_date_hard', 'execution_time', 'last_priced', 'cash_ccy', 'notional_ccy', 'exposure_ccy', 'loan_ccy', 'borrow_loan_ind', 'loan_return_ind', 'closed_ind', 'settlement_ind', 'mark_ind', 'dni_ind', 'dvp_ind', 'collateral_upgrade_ind', 'sec_settlement_ind', 'cash_settlement_ind', 'trade_collateral_ind', 'collateral_type_ind', 'tracking_uti', 'trading_venue_cd', 'tpca_id', 'tpca_profile', 'is_return', 'is_settled', 'status', 'is_automatic_settled', 'is_active', 'custom', 'created_at', 'updated_at', 'updated_by', 'actions'],
        sortable: new Set(['id', 'trade_id', 'trade_ref', 'trade_type', 'description', 'client_id', 'client_name', 'quantity', 'trade_value', 'trade_date', 'is_active', 'created_at', 'updated_at'])
      },
      'trade_allocations': {
        columns: ['id', 'trade_ref', 'trade_client', 'fund_cd', 'allocation_client', 'quantity', 'loan_value', 'actions'],
        sortable: new Set(['id', 'trade_id', 'allocation_fund', 'quantity', 'percentage', 'created_at'])
      },
      'client_relationships': {
        columns: ['id', 'client', 'related_client', 'cpty_cd', 'group_cd', 'fund_cd', 'trp_agent_ref', 'is_active', 'actions'],
        sortable: new Set(['id', 'parent_client', 'child_client', 'relationship_type', 'created_at'])
      },
      users: {
        columns: ['username', 'email', 'name', 'is_active', 'last_login_at', 'actions'],
        sortable: new Set(['id', 'email', 'name', 'is_active', 'created_at'])
      },
      templates: {
        columns: ['id', 'name', 'description', 'trade_id', 'is_active', 'actions'],
        sortable: new Set(['id', 'name', 'description', 'trade_id', 'is_active', 'created_at'])
      },
      // Playground demo tables
      products: {
        columns: ['_control', '_select', 'id', 'name', 'sku', 'category', 'price', 'quantity', 'status', 'actions'],
        sortable: new Set(['id', 'name', 'sku', 'price', 'quantity', 'status', 'created_at'])
      },
      playground: {
        columns: ['id', 'name', 'status', 'amount', 'currency', 'created_at', 'user.name'],
        sortable: new Set(['id', 'name', 'status', 'amount', 'currency', 'created_at'])
      }
    };
  }

  /**
   * Register a DataTable instance for an entity type (for cache sync)
   * @param {string} entityType - Entity type (e.g., 'trade', 'trade_action')
   * @param {DataTable} tableInstance - The DataTable instance
   */
  function registerTable(entityType, tableInstance) {
    if (!entityType) return;
    if (!tableRegistry[entityType]) {
      tableRegistry[entityType] = [];
    }
    // Avoid duplicates
    if (tableRegistry[entityType].indexOf(tableInstance) === -1) {
      tableRegistry[entityType].push(tableInstance);
    }
    console.log('[Funky.DataTables] Registered table for entity:', entityType);
  }

  /**
   * Unregister a DataTable instance
   * @param {string} entityType - Entity type
   * @param {DataTable} tableInstance - The DataTable instance
   */
  function unregisterTable(entityType, tableInstance) {
    if (!entityType || !tableRegistry[entityType]) return;
    tableRegistry[entityType] = tableRegistry[entityType].filter(function(t) {
      return t !== tableInstance;
    });
  }

  /**
   * Initialize DataTable with Funky configuration
   * @param {string} selector - jQuery selector for the table
   * @param {Object} options - Configuration options
   * @returns {DataTable|Object} Initialized DataTable instance or Funky.Table wrapper
   */
  FunkyDataTables.prototype.init = function(selector, options) {
    var self = this;
    options = options || {};
    
    // Check if we should use Funky.Table instead of jQuery DataTables
    if (USE_FUNKY_TABLE && window.Funky && window.Funky.Table) {
      return this._initFunkyTable(selector, options);
    }
    
    // Determine entity type for cache sync
    // Use explicit entityType, or use tableName directly (WebSocket sends plural form)
    var entityType = options.entityType || options.tableName || null;
    
    // Get column mapping for this table
    var tableMapping = this.columnMappings[options.tableName] || { columns: [], sortable: new Set() };
    var columnMapping = tableMapping.columns || [];
    var sortableColumns = tableMapping.sortable || new Set();
    
    // Automatically set orderable: false on columns that aren't sortable
    if (options.columns && options.columns.length > 0) {
      options.columns.forEach(function(col, index) {
        var columnName = col.name || columnMapping[index];
        if (col.orderable === undefined && columnName && !sortableColumns.has(columnName)) {
          col.orderable = false;
        }
      });
    }
    
    // Parse URL to extract base URL and existing query params
    var ajaxUrl = options.ajaxUrl;
    var baseUrl = ajaxUrl;
    var urlParams = {};
    if (ajaxUrl && typeof ajaxUrl === 'string' && ajaxUrl.indexOf('?') !== -1) {
      var parts = ajaxUrl.split('?');
      baseUrl = parts[0];
      var searchParams = new URLSearchParams(parts[1]);
      searchParams.forEach(function(value, key) {
        urlParams[key] = value;
      });
    }
    
    // Check if this is client-side mode (no AJAX)
    var isServerSide = options.serverSide !== false && ajaxUrl;
    
    // Default DataTable configuration
    var config = {
      processing: isServerSide,
      serverSide: isServerSide,
      columns: options.columns || [],
      pageLength: options.pageLength || 25,
      lengthMenu: options.lengthMenu || [[10, 25, 50, 100], [10, 25, 50, 100]],
      searching: true,
      order: options.order || [[0, 'asc']],
      language: {
        processing: '<div class="loading-spinner" role="status" aria-label="Loading data"></div> <span aria-live="polite">Loading data...</span>',
        emptyTable: options.emptyMessage || 'No data available',
        zeroRecords: 'No matching records found'
      },
      dom: '<"row"<"col-sm-12 col-md-6"B><"col-sm-12 col-md-6"l>>rt<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      buttons: this._getDefaultButtons(options),
      responsive: options.responsive !== false ? {
        details: {
          type: 'inline',
          target: 'td:first-child, th:first-child',
          renderer: function(api, rowIdx, columns) {
            var data = jQuery.map(columns, function(col, i) {
              if (col.hidden) {
                var title = col.title || '';
                var dataVal = col.data || '';
                if (dataVal === '' || dataVal === '-' || dataVal === null || dataVal === undefined) {
                  return '';
                }
                return '<li data-dtr-index="' + i + '">' +
                  '<span class="dtr-title">' + title + '</span>' +
                  '<span class="dtr-data">' + dataVal + '</span>' +
                  '</li>';
              }
              return '';
            }).join('');
            
            return data ? jQuery('<ul class="dtr-details"/>').append(data) : false;
          }
        },
        breakpoints: [
          { name: 'desktop', width: Infinity },
          { name: 'laptop', width: 1400 },
          { name: 'tablet-l', width: 1200 },
          { name: 'tablet', width: 992 },
          { name: 'mobile-l', width: 768 },
          { name: 'mobile', width: 576 }
        ]
      } : false,
      drawCallback: options.drawCallback || function() {
        var $table = typeof selector === 'string' ? jQuery(selector) : jQuery(selector);
        $table.find('tbody tr').each(function(index) {
          jQuery(this).css('animation-delay', (index * 0.05) + 's');
        });
      }
    };
    
    // Add AJAX config only for server-side mode
    if (isServerSide) {
      config.ajax = {
        url: baseUrl,
        type: 'GET',
        data: function(d) {
          // Start with URL query params
          var params = Object.assign({}, urlParams);
          
          // Add DataTables required params
          params.draw = d.draw;
          params.page = Math.floor(d.start / d.length) + 1;
          params.limit = d.length;
          
          if (d.search.value) {
            params.search = d.search.value;
          }
          
          // Add sorting parameters with column names (JSON stringified for server)
          if (d.order && d.order.length > 0) {
            var sortArray = [];
            d.order.forEach(function(orderItem) {
              var columnIndex = orderItem.column;
              var columnName = columnMapping[columnIndex];
              if (columnName && sortableColumns.has(columnName)) {
                sortArray.push({
                  column: columnName,
                  dir: orderItem.dir
                });
              }
            });
            if (sortArray.length > 0) {
              params.sort = JSON.stringify(sortArray);
            }
          }
          
          // Add extra AJAX data
          if (options.extraAjaxData) {
            Object.keys(options.extraAjaxData).forEach(function(key) {
              var value = options.extraAjaxData[key];
              if (value !== null && value !== undefined && value !== '' && 
                  !(Array.isArray(value) && value.length === 0)) {
                if (Array.isArray(value) && value.length === 1) {
                  params[key] = value[0];
                } else {
                  params[key] = value;
                }
              }
            });
          }
          
          return params;
        },
        dataSrc: options.dataSrc || function(json) {
          if (options.updateStats && typeof options.updateStats === 'function') {
            options.updateStats(json);
          }
          
          json.recordsTotal = json.total || 0;
          json.recordsFiltered = json.total || 0;
          
          var tableNameSnakeCase = options.tableName.replace(/-/g, '_');
          var irregularPlural = tableNameSnakeCase.replace(/ys$/, 'ies');
          var possibleKeys = [options.tableName, tableNameSnakeCase, irregularPlural, 'client_relationships', 'data'];
          
          for (var i = 0; i < possibleKeys.length; i++) {
            if (json[possibleKeys[i]]) {
              return json[possibleKeys[i]];
            }
          }
          
          return [];
        },
        error: function(xhr, error, thrown) {
          console.error('[Funky.DataTables] AJAX error:', error, thrown);
          if (Funky.Toast) {
            Funky.Toast.error('Error loading data. Please try again.');
          }
        }
      };
    } else {
      // Client-side mode: use provided data
      if (options.data) {
        config.data = options.data;
      }
    }
    
    if (options.dataTableOptions) {
      Object.assign(config, options.dataTableOptions);
    }
    
    var tableInstance = jQuery(selector).DataTable(config);

    // Add screen reader announcements for table state changes
    if (Funky.Announce) {
      // Announce sort changes
      tableInstance.on('order.dt', function() {
        var order = tableInstance.order();
        if (order && order.length > 0) {
          var columnIdx = order[0][0];
          var direction = order[0][1];
          var columnHeader = tableInstance.column(columnIdx).header();
          if (columnHeader) {
            var columnName = columnHeader.textContent || 'column';
            Funky.Announce.polite('Table sorted by ' + columnName + ' ' + direction + 'ending');
          }
        }
      });
    }

    // Get table ID for instance registry
    var tableElement = jQuery(selector);
    var tableId = tableElement.attr('id');
    
    // Register table for cache sync
    if (entityType) {
      registerTable(entityType, tableInstance);
      
      // Store entity type on the instance for later reference
      tableInstance._funkyEntityType = entityType;
      
      // Unregister when table is destroyed
      jQuery(selector).on('destroy.dt', function() {
        unregisterTable(entityType, tableInstance);
        if (tableId) {
          delete instanceRegistry[tableId];
        }
      });
    }
    
    // Create wrapper with Bindable Interface
    var wrapper = {
      _table: tableInstance,
      _entityType: entityType,
      _tableId: tableId,
      
      /**
       * Set table data (Bindable Interface)
       * Clears existing data and adds new rows
       * @param {Array} data - Array of row data objects
       */
      setData: function(data) {
        var rows = Array.isArray(data) ? data : (data && data.data) || [];
        tableInstance.clear();
        if (rows.length > 0) {
          tableInstance.rows.add(rows);
        }
        tableInstance.draw(false);
      },
      
      /**
       * Get table data (Bindable Interface)
       * @returns {Array} Current table data
       */
      getData: function() {
        return tableInstance.rows().data().toArray();
      },
      
      /**
       * Add rows to table (Bindable Interface)
       * @param {Array|Object} data - Row(s) to add
       */
      addData: function(data) {
        var rows = Array.isArray(data) ? data : [data];
        if (rows.length > 0) {
          tableInstance.rows.add(rows).draw(false);
        }
      },
      
      /**
       * Remove rows by ID (Bindable Interface)
       * @param {Array} ids - Array of IDs to remove
       */
      removeData: function(ids) {
        var idsSet = new Set(Array.isArray(ids) ? ids.map(String) : [String(ids)]);
        var rowsToRemove = [];
        
        tableInstance.rows().every(function(rowIdx) {
          var data = this.data();
          if (data && idsSet.has(String(data.id))) {
            rowsToRemove.push(this);
          }
        });
        
        rowsToRemove.forEach(function(row) {
          row.remove();
        });
        
        if (rowsToRemove.length > 0) {
          tableInstance.draw(false);
        }
      },
      
      /**
       * Clear all data (Bindable Interface)
       */
      clearData: function() {
        tableInstance.clear().draw(false);
      },
      
      /**
       * Refresh data from server
       */
      refreshData: function() {
        if (tableInstance.ajax) {
          tableInstance.ajax.reload(null, false);
        }
      },
      
      // Expose original DataTable methods
      ajax: tableInstance.ajax,
      draw: tableInstance.draw.bind(tableInstance),
      search: tableInstance.search.bind(tableInstance),
      order: tableInstance.order.bind(tableInstance),
      page: tableInstance.page.bind(tableInstance),
      rows: tableInstance.rows.bind(tableInstance),
      columns: tableInstance.columns.bind(tableInstance),
      row: tableInstance.row.bind(tableInstance),
      column: tableInstance.column.bind(tableInstance),
      cell: tableInstance.cell.bind(tableInstance),
      on: tableInstance.on.bind(tableInstance),
      off: tableInstance.off.bind(tableInstance),
      destroy: function() {
        tableInstance.destroy();
        if (tableId) {
          delete instanceRegistry[tableId];
        }
      }
    };
    
    // Register wrapper in instance registry for LiveBinding
    if (tableId) {
      instanceRegistry[tableId] = wrapper;
    }
    
    return wrapper;
  };

  /**
   * Get default button configuration
   */
  FunkyDataTables.prototype._getDefaultButtons = function(options) {
    var buttons = [
      {
        extend: 'colvis',
        text: '<i class="fas fa-columns" aria-hidden="true"></i> Columns',
        className: 'btn-funky btn-funky-secondary btn-sm'
      }
    ];

    if (options.enableExport !== false) {
      buttons.push({
        text: '<i class="fas fa-file-csv" aria-hidden="true"></i> CSV',
        className: 'btn-funky btn-funky-secondary btn-sm',
        action: function(e, dt, node, config) {
          var searchInput = jQuery('#globalSearch');
          var search = searchInput.length ? (searchInput.val() || '') : '';
          // Use callback if provided, otherwise redirect to export URL
          if (typeof options.onExportCSV === 'function') {
            options.onExportCSV(search, dt);
          } else {
            window.location.href = '/api/export/csv/' + options.tableName + '?search=' + encodeURIComponent(search);
          }
        }
      });

      buttons.push({
        text: '<i class="fas fa-file-excel" aria-hidden="true"></i> Excel',
        className: 'btn-funky btn-funky-secondary btn-sm',
        action: function(e, dt, node, config) {
          var searchInput = jQuery('#globalSearch');
          var search = searchInput.length ? (searchInput.val() || '') : '';
          // Use callback if provided, otherwise redirect to export URL
          if (typeof options.onExportExcel === 'function') {
            options.onExportExcel(search, dt);
          } else {
            window.location.href = '/api/export/excel/' + options.tableName + '?search=' + encodeURIComponent(search);
          }
        }
      });
    }

    if (options.enableImport) {
      buttons.push({
        text: '<i class="fas fa-file-upload" aria-hidden="true"></i> Import',
        className: 'btn-funky btn-funky-primary btn-sm',
        action: function(e, dt, node, config) {
          // Use callback if provided, otherwise try Funky.Import with entity name
          if (typeof options.onImport === 'function') {
            options.onImport();
          } else if (Funky.Import && options.tableName) {
            // Convert tableName (plural) to entity (singular) for import modal
            var entity = options.tableName.replace(/s$/, '');
            Funky.Import.show(entity + 'ImportModal');
          } else {
            Funky.Modal.show('#importModal');
          }
        }
      });
    }

    if (options.buttons && Array.isArray(options.buttons)) {
      buttons.push.apply(buttons, options.buttons);
    }

    return buttons;
  };

  /**
   * Setup global search for a DataTable
   */
  FunkyDataTables.prototype.setupGlobalSearch = function(searchInputSelector, dataTable) {
    jQuery(searchInputSelector).on('keyup', function() {
      dataTable.search(this.value).draw();
    });
  };

  /**
   * Setup date range filter
   */
  FunkyDataTables.prototype.setupDateRangeFilter = function(dateRangeSelector, columnSelectSelector, dataTable, extraAjaxData, dateColumns) {
    var self = this;

    // Initialize ComboBox for date column selector
    var columnSelect = typeof columnSelectSelector === 'string' 
      ? document.querySelector(columnSelectSelector) 
      : columnSelectSelector;
    
    if (columnSelect && Funky.ComboBox) {
      // Add options to select first
      dateColumns.forEach(function(col) {
        var option = document.createElement('option');
        option.value = col.value;
        option.text = col.label;
        if (col.selected) option.selected = true;
        columnSelect.appendChild(option);
      });

      Funky.ComboBox.init(columnSelect, {
        searchable: false,
        clearable: false,
        fixedWidth: true
      });
    }

    // Calculate default date range (last 7 days)
    var lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    var todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get the picker element
    var pickerEl = typeof dateRangeSelector === 'string'
      ? document.querySelector(dateRangeSelector)
      : dateRangeSelector;

    // Use Funky.DatePicker if available, otherwise fallback to jQuery daterangepicker
    if (pickerEl && Funky.DatePicker) {
      // Initialize Funky.DatePicker
      var picker = Funky.DatePicker.create(pickerEl, {
        mode: 'range',
        timePicker: true,
        timePicker24Hour: true,
        format: 'YYYY-MM-DD HH:mm',
        ranges: true, // Use default presets
        opens: 'left',
        autoApply: false
      });

      // Set initial range
      picker.setRange(lastWeekStart, todayEnd);

      // Store picker instance
      self._dateRangePicker = picker;

      // Set initial extraAjaxData
      var dateColumn = jQuery(columnSelectSelector).val() || 'updated_at';
      extraAjaxData.date_column = dateColumn;
      extraAjaxData.date_from = self._formatDateTime(lastWeekStart);
      extraAjaxData.date_to = self._formatDateTime(todayEnd);

      // Handle change event
      Funky.Events.on(pickerEl, 'funky.datepicker.change', function(e) {
        var value = e.detail.value;
        extraAjaxData.date_column = jQuery(columnSelectSelector).val() || 'updated_at';

        if (value && value.start && value.end) {
          extraAjaxData.date_from = self._formatDateTime(value.start);
          extraAjaxData.date_to = self._formatDateTime(value.end);
        }

        if (dataTable && dataTable.ajax) {
          dataTable.ajax.reload();
        }
      });
    } else {
      // Fallback to jQuery daterangepicker
      var lastWeekMoment = moment().subtract(6, 'days').startOf('day');
      var todayEndMoment = moment().endOf('day');

      jQuery(dateRangeSelector).daterangepicker({
        startDate: lastWeekMoment,
        endDate: todayEndMoment,
        timePicker: true,
        timePicker24Hour: true,
        timePickerSeconds: false,
        locale: { format: 'YYYY-MM-DD HH:mm' },
        ranges: {
          'Today': [moment().startOf('day'), moment().endOf('day')],
          'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
          'Last 7 Days': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
          'Last 30 Days': [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')],
          'This Month': [moment().startOf('month'), moment().endOf('month')],
          'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
          'All Time': [moment().subtract(10, 'years'), moment()]
        },
        alwaysShowCalendars: true,
        opens: 'left'
      });

      jQuery(dateRangeSelector).val('Last 7 Days');

      var dateColumn = jQuery(columnSelectSelector).val() || 'updated_at';
      extraAjaxData.date_column = dateColumn;
      extraAjaxData.date_from = lastWeekMoment.format('YYYY-MM-DD HH:mm:ss');
      extraAjaxData.date_to = todayEndMoment.format('YYYY-MM-DD HH:mm:ss');

      jQuery(dateRangeSelector).on('apply.daterangepicker', function(ev, picker) {
        extraAjaxData.date_column = jQuery(columnSelectSelector).val() || 'updated_at';
        extraAjaxData.date_from = picker.startDate.format('YYYY-MM-DD HH:mm:ss');
        extraAjaxData.date_to = picker.endDate.format('YYYY-MM-DD HH:mm:ss');

        if (picker.chosenLabel) {
          jQuery(dateRangeSelector).val(picker.chosenLabel);
        }

        if (dataTable && dataTable.ajax) {
          dataTable.ajax.reload();
        }
      });
    }

    jQuery(columnSelectSelector).on('change', function() {
      extraAjaxData.date_column = jQuery(this).val();
      if (dataTable && dataTable.ajax) {
        dataTable.ajax.reload();
      }
    });
  };

  /**
   * Format a Date object for filter submission (YYYY-MM-DD HH:mm:ss)
   * @private
   */
  FunkyDataTables.prototype._formatDateTime = function(date) {
    if (!date) return '';
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    var hours = String(date.getHours()).padStart(2, '0');
    var minutes = String(date.getMinutes()).padStart(2, '0');
    var seconds = String(date.getSeconds()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
  };

  /**
   * Setup client filter with ComboBox
   */
  FunkyDataTables.prototype.setupClientFilter = function(selectSelector, dataTable, extraAjaxData) {
    var selectEl = typeof selectSelector === 'string' 
      ? document.querySelector(selectSelector) 
      : selectSelector;

    if (!selectEl || !Funky.ComboBox) {
      console.warn('[FunkyDataTables] ComboBox not available for client filter');
      return;
    }

    Funky.ComboBox.init(selectEl, {
      mode: 'multi',
      placeholder: 'Filter by Client',
      clearable: true,
      scrollTags: true,
      remote: {
        url: '/api/clients',
        searchParam: 'search',
        pageParam: 'page',
        delay: 250,
        transform: function(client) {
          return { 
            id: client.id, 
            name: client.name + ' (' + client.code + ')' 
          };
        },
        processResponse: function(data) {
          return {
            items: data.clients,
            hasMore: data.page * data.limit < data.total
          };
        }
      }
    });

    selectEl.addEventListener('change', function() {
      var instance = Funky.ComboBox.getInstance(selectEl);
      var selected = instance ? instance.getValue() : [];
      delete extraAjaxData.client_id;
      delete extraAjaxData.filter_hash;
      
      if (selected && selected.length > 0) {
        var clientIds = selected.map(function(item) { 
          return typeof item === 'object' ? item.id : item; 
        });
        var filteredIds = clientIds.filter(function(id) { return id !== null && id !== '' && id !== undefined; });
        if (filteredIds.length > 0) {
          extraAjaxData.client_id = filteredIds;
        }
      }
      
      if (dataTable && dataTable.ajax) {
        dataTable.ajax.reload();
      }
    });
  };

  /**
   * Add or update column mapping
   */
  FunkyDataTables.prototype.addColumnMapping = function(tableName, columns, sortable) {
    this.columnMappings[tableName] = {
      columns: columns,
      sortable: new Set(sortable)
    };
  };

  // ============================================================================
  // Smart DataTable Methods (Phase 8)
  // ============================================================================

  /**
   * Get all DataTable instances registered for an entity type
   * @param {string} entityType - Entity type (e.g., 'trade', 'trade_action')
   * @returns {Array} Array of DataTable instances
   */
  FunkyDataTables.prototype.getByType = function(entityType) {
    return tableRegistry[entityType] || [];
  };

  /**
   * Get all entity types that should be refreshed when a given entity changes
   * @param {string} entityType - The entity that changed
   * @returns {Array} Array of entity types to refresh
   */
  FunkyDataTables.prototype.getRelatedTypes = function(entityType) {
    return ENTITY_RELATIONSHIPS[entityType] || [entityType];
  };

  /**
   * Highlight a row in the DataTable with animation
   * @param {DataTable} table - The DataTable instance
   * @param {string|number} id - The row ID to highlight
   * @param {string} type - Highlight type: 'success', 'warning', 'danger' (default: 'success')
   */
  FunkyDataTables.prototype.highlightRow = function(table, id, type) {
    type = type || 'success';
    var $row = this._findRowById(table, id);
    if ($row && $row.length) {
      $row.removeClass('dt-row-highlight-success dt-row-highlight-warning dt-row-highlight-danger');
      // Trigger reflow to restart animation
      void $row[0].offsetWidth;
      $row.addClass('dt-row-highlight-' + type);
      
      // Remove class after animation completes
      setTimeout(function() {
        $row.removeClass('dt-row-highlight-' + type);
      }, 1500);
    }
  };

  /**
   * Remove a row from the DataTable with animation
   * @param {DataTable} table - The DataTable instance
   * @param {string|number} id - The row ID to remove
   */
  FunkyDataTables.prototype.removeRow = function(table, id) {
    var self = this;
    var $row = this._findRowById(table, id);
    if ($row && $row.length) {
      $row.addClass('dt-row-removing');
      
      // Remove row after animation
      setTimeout(function() {
        var row = table.row($row);
        if (row.node()) {
          row.remove().draw(false);
        }
      }, 300);
    }
  };

  /**
   * Find a row element by ID
   * @param {DataTable} table - The DataTable instance
   * @param {string|number} id - The row ID
   * @returns {jQuery} The row element or null
   */
  FunkyDataTables.prototype._findRowById = function(table, id) {
    var $row = null;
    table.rows().every(function(rowIdx) {
      var data = this.data();
      if (data && (data.id == id || data.id === String(id))) {
        $row = jQuery(this.node());
        return false; // Break
      }
    });
    return $row;
  };

  /**
   * Refresh all DataTables for a given entity type
   * @param {string} entityType - Entity type to refresh
   * @param {boolean} resetPaging - Whether to reset paging (default: false)
   */
  FunkyDataTables.prototype.refreshByType = function(entityType, resetPaging) {
    var tables = this.getByType(entityType);
    tables.forEach(function(table) {
      if (table && table.ajax) {
        table.ajax.reload(null, resetPaging === true);
      }
    });
    console.log('[Funky.DataTables] Refreshed', tables.length, 'table(s) for entity:', entityType);
  };

  /**
   * Refresh all related DataTables when an entity changes
   * Includes cascading to related entity types
   * @param {string} entityType - The entity type that changed
   * @param {boolean} resetPaging - Whether to reset paging (default: false)
   */
  FunkyDataTables.prototype.refreshRelated = function(entityType, resetPaging) {
    var self = this;
    var relatedTypes = this.getRelatedTypes(entityType);
    var refreshedCount = 0;
    
    relatedTypes.forEach(function(type) {
      var tables = self.getByType(type);
      tables.forEach(function(table) {
        if (table && table.ajax) {
          table.ajax.reload(null, resetPaging === true);
          refreshedCount++;
        }
      });
    });
    
    console.log('[Funky.DataTables] Refreshed', refreshedCount, 'table(s) for entity change:', entityType, '(related:', relatedTypes.join(', ') + ')');
  };

  /**
   * Handle cache invalidation event (called by CacheSync)
   * @param {Object} event - Cache invalidation event { type, id, reason }
   */
  FunkyDataTables.prototype.handleCacheInvalidation = function(event) {
    var entityType = event.type;
    var reason = event.reason;
    var id = event.id;
    
    console.log('[Funky.DataTables] Handling cache invalidation:', entityType, reason, id || '');
    
    // Bulk actions always force full refresh of related tables
    if (reason === 'bulk') {
      this.refreshRelated(entityType, false);
      return;
    }
    
    // For deleted items, try to remove row without full reload
    if (reason === 'deleted' && id) {
      var tables = this.getByType(entityType);
      var self = this;
      tables.forEach(function(table) {
        self.removeRow(table, id);
      });
      // Still refresh related types (e.g., trade_action deletion should refresh trade)
      var relatedTypes = this.getRelatedTypes(entityType);
      relatedTypes.forEach(function(type) {
        if (type !== entityType) {
          self.refreshByType(type, false);
        }
      });
      return;
    }
    
    // For created/updated, refresh related tables
    this.refreshRelated(entityType, false);
    
    // If we have an ID, try to highlight the updated row after refresh
    if (id && (reason === 'updated' || reason === 'created')) {
      var self = this;
      // Wait a bit for table to refresh
      setTimeout(function() {
        var tables = self.getByType(entityType);
        tables.forEach(function(table) {
          self.highlightRow(table, id, reason === 'created' ? 'success' : 'warning');
        });
      }, 500);
    }
  };

  /**
   * Get entity relationships configuration
   * @returns {Object} The entity relationships map
   */
  FunkyDataTables.prototype.getEntityRelationships = function() {
    return ENTITY_RELATIONSHIPS;
  };

  /**
   * Add or update entity relationship
   * @param {string} entityType - The source entity type
   * @param {Array} relatedTypes - Array of entity types to refresh when this entity changes
   */
  FunkyDataTables.prototype.setEntityRelationship = function(entityType, relatedTypes) {
    ENTITY_RELATIONSHIPS[entityType] = relatedTypes;
  };

  /**
   * Get registry stats for debugging
   * @returns {Object} Stats about registered tables
   */
  FunkyDataTables.prototype.getRegistryStats = function() {
    var stats = {};
    Object.keys(tableRegistry).forEach(function(type) {
      stats[type] = tableRegistry[type].length;
    });
    return stats;
  };

  // ============================================================================
  // Funky.Table Compatibility Layer (Phase 20)
  // ============================================================================

  /**
   * Initialize using Funky.Table (when USE_FUNKY_TABLE is enabled)
   * Creates a compatibility wrapper that maintains the existing API
   * @param {string} selector - jQuery selector or element for the table
   * @param {Object} options - Configuration options
   * @returns {Object} Wrapper with DataTables-compatible API
   */
  FunkyDataTables.prototype._initFunkyTable = function(selector, options) {
    var self = this;
    var element = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;

    if (!element) {
      console.error('[Funky.DataTables] Element not found:', selector);
      return null;
    }

    var entityType = options.entityType || options.tableName || null;

    // Get column mapping for this table
    var tableMapping = this.columnMappings[options.tableName] || { columns: [], sortable: new Set() };

    // Convert columns to Funky.Table format
    var columns = options.columns ? this._convertColumnsToFunky(options.columns, tableMapping) : [];

    // Build Funky.Table config
    var config = {
      tableName: options.tableName,
      ajax: options.ajaxUrl,  // Funky.Table expects 'ajax', not 'ajaxUrl'
      ajaxUrl: options.ajaxUrl,  // Keep for backwards compatibility
      columns: columns,
      pageLength: options.pageLength || 25,
      serverSide: options.serverSide !== false && !!options.ajaxUrl,
      responsive: {
        enabled: options.responsive !== false
      },
      fixedHeader: options.fixedHeader !== false,  // Sticky table headers (default: true)
      searching: options.searching !== false,  // Built-in search toolbar
      select: options.selectable || false,  // Selection mode: false | 'single' | 'multi'
      extraAjaxData: options.extraAjaxData || {},
      data: options.data,
      // Map callbacks
      updateStats: options.updateStats,
      onRowClick: options.onRowClick,
      onSelect: options.onSelect || options.onSelectionChange,  // Selection callback
      initComplete: options.initComplete,
      createdRow: options.createdRow,
      rowCallback: options.rowCallback,
      drawCallback: options.drawCallback,
      // Buttons/export
      buttons: {
        enabled: options.enableExport !== false,
        export: options.enableExport !== false ? ['csv', 'xlsx'] : [],
        colvis: true
      },
      debug: options.debug
    };

    // Create Funky.Table instance
    var funkyTable = window.Funky.Table.init(element, config);

    if (!funkyTable) {
      console.error('[Funky.DataTables] Failed to create Funky.Table');
      return null;
    }

    // Store reference for compatibility checks
    element._funkyTable = funkyTable;
    element._funkyDataTablesWrapper = true;

    var tableId = element.id;

    // Register for entity cache sync
    if (entityType) {
      registerTable(entityType, funkyTable);
      funkyTable._funkyEntityType = entityType;
    }

    // Create compatibility wrapper with DataTables-like API
    var wrapper = {
      _table: funkyTable,
      _isFunkyTable: true,
      _entityType: entityType,
      _tableId: tableId,

      // Bindable Interface
      setData: function(data) {
        var rows = Array.isArray(data) ? data : (data && data.data) || [];
        funkyTable.setData(rows);
        return this;
      },

      getData: function() {
        return funkyTable.getData();
      },

      addData: function(data) {
        var rows = Array.isArray(data) ? data : [data];
        rows.forEach(function(row) {
          funkyTable.addRow(row);
        });
        return this;
      },

      removeData: function(ids) {
        var idArr = Array.isArray(ids) ? ids : [ids];
        idArr.forEach(function(id) {
          funkyTable.removeRow(id);
        });
        return this;
      },

      clearData: function() {
        funkyTable.setData([]);
        return this;
      },

      refreshData: function() {
        funkyTable.reload();
        return this;
      },

      // DataTables-compatible methods
      ajax: {
        reload: function(callback, resetPaging) {
          funkyTable.reload();
          if (typeof callback === 'function') {
            setTimeout(callback, 100);
          }
        },
        url: function(url) {
          funkyTable.setAjaxUrl(url);
          return this;
        }
      },

      draw: function(resetPaging) {
        funkyTable.reload();
        return this;
      },

      search: function(query) {
        if (query !== undefined) {
          funkyTable.search(query);
          return this;
        }
        return funkyTable.searchQuery || '';
      },

      order: function(order) {
        if (order !== undefined) {
          // Convert DataTables order format to Funky.Table
          if (Array.isArray(order) && order.length > 0) {
            var colIdx = order[0][0];
            var dir = order[0][1];
            funkyTable.sort(colIdx, dir);
          }
          return this;
        }
        return funkyTable.sortOrder || [];
      },

      page: function(page) {
        if (page !== undefined) {
          funkyTable.goToPage(page + 1); // DataTables is 0-indexed
          return this;
        }
        return funkyTable.currentPage - 1;
      },

      rows: function(selector) {
        var data = funkyTable.getData();
        return {
          data: function() {
            return {
              toArray: function() { return data; }
            };
          },
          every: function(callback) {
            data.forEach(function(row, idx) {
              callback.call({ data: function() { return row; }, index: function() { return idx; } }, idx);
            });
          }
        };
      },

      row: function(selector) {
        return {
          data: function() {
            return funkyTable.getRowData(selector);
          },
          remove: function() {
            funkyTable.removeRow(selector);
            return this;
          }
        };
      },

      columns: function() {
        return {
          visible: function() {
            return funkyTable.config.columns.map(function(c) { return c.visible !== false; });
          }
        };
      },

      on: function(event, callback) {
        // Map DataTables events to Funky.Table events
        if (window.Funky && window.Funky.Events) {
          window.Funky.Events.on('funky:table:' + event, callback);
        }
        return this;
      },

      off: function(event, callback) {
        if (window.Funky && window.Funky.Events) {
          window.Funky.Events.off('funky:table:' + event, callback);
        }
        return this;
      },

      destroy: function() {
        funkyTable.destroy();
        if (entityType) {
          unregisterTable(entityType, funkyTable);
        }
        if (tableId) {
          delete instanceRegistry[tableId];
        }
      },

      // Selection methods
      getSelectedIds: function() {
        return funkyTable.getSelectedIds ? funkyTable.getSelectedIds() : [];
      },

      selectAll: function() {
        if (funkyTable.selectAll) {
          funkyTable.selectAll();
        }
        return this;
      },

      deselectAll: function() {
        if (funkyTable.clearSelection) {
          funkyTable.clearSelection();
        }
        return this;
      },

      // Export methods
      exportCSV: function(filename) {
        if (funkyTable.export) {
          funkyTable.export('csv', { filename: filename });
        }
        return this;
      },

      exportExcel: function(filename) {
        if (funkyTable.export) {
          funkyTable.export('xlsx', { filename: filename });
        }
        return this;
      }
    };

    // Register wrapper in instance registry
    if (tableId) {
      instanceRegistry[tableId] = wrapper;
    }

    console.log('[Funky.DataTables] Initialized with Funky.Table:', options.tableName);

    return wrapper;
  };

  /**
   * Convert DataTables column format to Funky.Table format
   * @param {Array} columns - DataTables column definitions
   * @param {Object} tableMapping - Column mapping with sortable info
   * @returns {Array} Converted columns for Funky.Table
   */
  FunkyDataTables.prototype._convertColumnsToFunky = function(columns, tableMapping) {
    var sortableColumns = tableMapping.sortable || new Set();

    return columns.map(function(col, index) {
      var converted = {
        data: col.data || col.name,
        name: col.name || col.data,
        title: col.title || col.sTitle || '',
        visible: col.visible !== false,
        orderable: col.orderable !== false && sortableColumns.has(col.name || col.data),
        searchable: col.searchable !== false,
        className: col.className || col.class || '',
        width: col.width,
        defaultContent: col.defaultContent || '',
        responsivePriority: col.responsivePriority  // Preserve responsive priority
      };

      // Convert render function - pass through directly as Funky.Table
      // uses DataTables-compatible signature: (data, type, row, meta)
      if (typeof col.render === 'function') {
        converted.render = col.render;
      } else if (typeof col.render === 'string') {
        // Named renderer
        converted.render = col.render;
      }

      // createdCell callback
      if (typeof col.createdCell === 'function') {
        converted.createdCell = col.createdCell;
      }

      return converted;
    });
  };

  // ============================================================================
  // Feature Flag Control Methods
  // ============================================================================

  /**
   * Enable Funky.Table mode
   * New tables will use Funky.Table internally
   */
  FunkyDataTables.prototype.enableFunkyTable = function() {
    USE_FUNKY_TABLE = true;
    console.log('[Funky.DataTables] Funky.Table mode ENABLED');
  };

  /**
   * Disable Funky.Table mode (use legacy jQuery DataTables)
   */
  FunkyDataTables.prototype.disableFunkyTable = function() {
    USE_FUNKY_TABLE = false;
    console.log('[Funky.DataTables] Funky.Table mode DISABLED (using jQuery DataTables)');
  };

  /**
   * Check if Funky.Table mode is enabled
   * @returns {boolean}
   */
  FunkyDataTables.prototype.isFunkyTableEnabled = function() {
    return USE_FUNKY_TABLE;
  };

  // ============================================================================
  // Migration Helpers
  // ============================================================================

  /**
   * Check if element is using Funky.Table directly
   * @param {string|Element} element
   * @returns {boolean}
   */
  FunkyDataTables.prototype.isUsingFunkyTable = function(element) {
    var el = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;
    return !!(el && el._funkyTable && !el._funkyDataTablesWrapper);
  };

  /**
   * Check if element is using compatibility wrapper
   * @param {string|Element} element
   * @returns {boolean}
   */
  FunkyDataTables.prototype.isUsingCompatibility = function(element) {
    var el = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;
    return !!(el && el._funkyDataTablesWrapper);
  };

  /**
   * Log migration status for all tables on page
   * @returns {Object} Status counts
   */
  FunkyDataTables.prototype.logMigrationStatus = function() {
    var tables = document.querySelectorAll('[data-funky-table], .dataTable, table');
    var status = {
      funkyTable: 0,
      compatibility: 0,
      legacy: 0,
      total: 0
    };

    var self = this;
    tables.forEach(function(table) {
      if (table._funkyTable && !table._funkyDataTablesWrapper) {
        status.funkyTable++;
        console.log('[Migration] Direct Funky.Table:', table.id || 'unnamed');
      } else if (table._funkyDataTablesWrapper) {
        status.compatibility++;
        console.log('[Migration] Compatibility wrapper:', table.id || 'unnamed');
      } else if (table.classList && table.classList.contains('dataTable')) {
        status.legacy++;
        console.log('[Migration] Legacy jQuery DataTables:', table.id || 'unnamed');
      }
    });

    status.total = status.funkyTable + status.compatibility + status.legacy;
    console.log('[Migration] Status:', status);
    return status;
  };

  /**
   * Generate migration report
   * @returns {Object} Detailed migration report
   */
  FunkyDataTables.prototype.generateMigrationReport = function() {
    var report = {
      timestamp: new Date().toISOString(),
      funkyTableEnabled: USE_FUNKY_TABLE,
      tables: [],
      summary: {
        total: 0,
        migrated: 0,
        compatibility: 0,
        legacy: 0
      }
    };

    var tables = document.querySelectorAll('[data-funky-table], .dataTable, table');

    tables.forEach(function(table) {
      var tableInfo = {
        id: table.id || null,
        classes: table.className,
        status: 'unknown'
      };

      if (table._funkyTable && !table._funkyDataTablesWrapper) {
        tableInfo.status = 'migrated';
        report.summary.migrated++;
      } else if (table._funkyDataTablesWrapper) {
        tableInfo.status = 'compatibility';
        report.summary.compatibility++;
      } else if (table.classList && table.classList.contains('dataTable')) {
        tableInfo.status = 'legacy';
        report.summary.legacy++;
      }

      if (tableInfo.status !== 'unknown') {
        report.tables.push(tableInfo);
        report.summary.total++;
      }
    });

    return report;
  };

  // =========================================================================
  // PRESENCE INTEGRATION
  // =========================================================================

  var _presenceEnabled = false;
  var _presenceConfig = {
    showRowPresence: true,
    showCursorIndicators: true,
    warnOnEditConflict: true
  };
  var _tableChannels = {};    // { tableId: channel }
  var _rowChannels = {};      // { tableId:rowId: channel }
  var _cursorPositions = {};  // { tableId: { userId: { row, column, user } } }
  var _presenceHandlers = {}; // { tableId: { onCursor, onJoin, onLeave } }

  /**
   * Enable presence tracking for DataTables
   * @param {Object} options - Configuration options
   * @param {boolean} options.showRowPresence - Show presence on rows (default: true)
   * @param {boolean} options.showCursorIndicators - Show cursor positions (default: true)
   * @param {boolean} options.warnOnEditConflict - Warn before editing locked rows (default: true)
   */
  FunkyDataTables.prototype.enablePresence = function(options) {
    if (!Funky.Presence) {
      console.warn('[DataTables] Funky.Presence not available');
      return;
    }

    options = options || {};
    _presenceEnabled = true;
    _presenceConfig = {
      showRowPresence: options.showRowPresence !== false,
      showCursorIndicators: options.showCursorIndicators !== false,
      warnOnEditConflict: options.warnOnEditConflict !== false
    };

    console.log('[DataTables] Presence tracking enabled');
  };

  /**
   * Disable presence tracking for DataTables
   */
  FunkyDataTables.prototype.disablePresence = function() {
    // Leave all table channels
    var self = this;
    Object.keys(_tableChannels).forEach(function(tableId) {
      self.leaveTablePresence(tableId);
    });

    _presenceEnabled = false;
    _tableChannels = {};
    _rowChannels = {};
    _cursorPositions = {};

    console.log('[DataTables] Presence tracking disabled');
  };

  /**
   * Check if presence tracking is enabled
   * @returns {boolean}
   */
  FunkyDataTables.prototype.isPresenceEnabled = function() {
    return _presenceEnabled;
  };

  /**
   * Join table-level presence channel
   * @param {string} tableId - Table identifier
   * @param {Object} options - Optional configuration
   */
  FunkyDataTables.prototype.joinTablePresence = function(tableId, options) {
    if (!_presenceEnabled || !Funky.Presence) return;

    var channel = 'table:' + tableId;
    _tableChannels[tableId] = channel;
    _cursorPositions[tableId] = {};

    Funky.Presence.join(channel, {
      status: 'viewing',
      metadata: {
        tableId: tableId
      }
    });

    // Set up event listeners for this table
    this._setupTablePresenceListeners(tableId, channel);

    console.log('[DataTables] Joined presence channel:', channel);
  };

  /**
   * Leave table-level presence channel
   * @param {string} tableId - Table identifier
   */
  FunkyDataTables.prototype.leaveTablePresence = function(tableId) {
    if (!_presenceEnabled || !Funky.Presence) return;

    var channel = _tableChannels[tableId];
    if (!channel) return;

    // Leave table channel
    Funky.Presence.leave(channel);

    // Leave all row channels for this table
    var prefix = tableId + ':';
    Object.keys(_rowChannels).forEach(function(key) {
      if (key.indexOf(prefix) === 0) {
        Funky.Presence.leave(_rowChannels[key]);
        delete _rowChannels[key];
      }
    });

    // Clean up event listeners
    this._removeTablePresenceListeners(tableId);

    delete _tableChannels[tableId];
    delete _cursorPositions[tableId];

    console.log('[DataTables] Left presence channel:', channel);
  };

  /**
   * Set up presence event listeners for a table
   * @param {string} tableId - Table identifier
   * @param {string} channel - Presence channel
   * @private
   */
  FunkyDataTables.prototype._setupTablePresenceListeners = function(tableId, channel) {
    var self = this;

    var handlers = {
      onStatus: function(data) {
        if (data.channel !== channel) return;
        self._handleTablePresenceStatus(tableId, data);
      },
      onUserJoin: function(data) {
        if (data.channel !== channel) return;
        // Refresh presence indicators
        self.refreshRowPresenceIndicators(tableId);
      },
      onUserLeave: function(data) {
        if (data.channel !== channel) return;
        // Clean up cursor for this user
        if (data.user && _cursorPositions[tableId]) {
          delete _cursorPositions[tableId][data.user.id];
          self._updateCursorIndicators(tableId);
        }
        // Refresh presence indicators
        self.refreshRowPresenceIndicators(tableId);
      }
    };

    _presenceHandlers[tableId] = handlers;

    Funky.Presence.on('status', handlers.onStatus);
    Funky.Presence.on('user:join', handlers.onUserJoin);
    Funky.Presence.on('user:leave', handlers.onUserLeave);
  };

  /**
   * Remove presence event listeners for a table
   * @param {string} tableId - Table identifier
   * @private
   */
  FunkyDataTables.prototype._removeTablePresenceListeners = function(tableId) {
    var handlers = _presenceHandlers[tableId];
    if (!handlers || !Funky.Presence) return;

    Funky.Presence.off('status', handlers.onStatus);
    Funky.Presence.off('user:join', handlers.onUserJoin);
    Funky.Presence.off('user:leave', handlers.onUserLeave);

    delete _presenceHandlers[tableId];
  };

  /**
   * Handle presence status change for a table
   * @param {string} tableId - Table identifier
   * @param {Object} data - Status data
   * @private
   */
  FunkyDataTables.prototype._handleTablePresenceStatus = function(tableId, data) {
    var user = data.user;
    if (!user || user.id === Funky.Presence.getCurrentUser().id) return;

    // Track cursor position if metadata includes it
    if (user.metadata && user.metadata.focusedRow !== undefined) {
      _cursorPositions[tableId] = _cursorPositions[tableId] || {};
      _cursorPositions[tableId][user.id] = {
        row: user.metadata.focusedRow,
        column: user.metadata.focusedColumn,
        user: user
      };

      if (_presenceConfig.showCursorIndicators) {
        this._updateCursorIndicators(tableId);
      }
    }
  };

  /**
   * Broadcast cursor/focus position
   * @param {string} tableId - Table identifier
   * @param {string} rowId - Focused row ID
   * @param {string} columnId - Focused column ID (optional)
   */
  FunkyDataTables.prototype.broadcastFocus = function(tableId, rowId, columnId) {
    if (!_presenceEnabled || !Funky.Presence) return;

    var channel = _tableChannels[tableId];
    if (!channel) return;

    Funky.Presence.updateMetadata({
      focusedRow: rowId,
      focusedColumn: columnId || null
    });
  };

  /**
   * Focus on a specific row (join row presence channel)
   * @param {string} tableId - Table identifier
   * @param {string} rowId - Row ID
   */
  FunkyDataTables.prototype.focusRow = function(tableId, rowId) {
    if (!_presenceEnabled || !Funky.Presence) return;

    var key = tableId + ':' + rowId;
    var channel = 'table:row:' + key;

    // Leave previous row channels for this table
    this._leaveTableRowChannels(tableId);

    _rowChannels[key] = channel;

    Funky.Presence.join(channel, {
      status: 'viewing',
      metadata: {
        tableId: tableId,
        rowId: rowId
      }
    });

    // Broadcast focus position
    this.broadcastFocus(tableId, rowId);
  };

  /**
   * Edit a row (set editing status)
   * @param {string} tableId - Table identifier
   * @param {string} rowId - Row ID
   */
  FunkyDataTables.prototype.editRow = function(tableId, rowId) {
    if (!_presenceEnabled || !Funky.Presence) return;

    var key = tableId + ':' + rowId;
    var channel = _rowChannels[key];

    if (!channel) {
      // Join if not already joined
      this.focusRow(tableId, rowId);
      channel = _rowChannels[key];
    }

    if (channel) {
      Funky.Presence.setStatus('editing');
    }
  };

  /**
   * Stop editing a row
   * @param {string} tableId - Table identifier
   * @param {string} rowId - Row ID
   */
  FunkyDataTables.prototype.blurRow = function(tableId, rowId) {
    if (!_presenceEnabled || !Funky.Presence) return;

    var key = tableId + ':' + rowId;
    var channel = _rowChannels[key];

    if (channel) {
      Funky.Presence.leave(channel);
      delete _rowChannels[key];
    }

    // Reset status to viewing on table channel
    Funky.Presence.setStatus('viewing');
  };

  /**
   * Leave all row channels for a table
   * @param {string} tableId - Table identifier
   * @private
   */
  FunkyDataTables.prototype._leaveTableRowChannels = function(tableId) {
    var prefix = tableId + ':';
    var self = this;

    Object.keys(_rowChannels).forEach(function(key) {
      if (key.indexOf(prefix) === 0) {
        if (Funky.Presence) {
          Funky.Presence.leave(_rowChannels[key]);
        }
        delete _rowChannels[key];
      }
    });
  };

  /**
   * Get users viewing/editing a specific row
   * @param {string} tableId - Table identifier
   * @param {string} rowId - Row ID
   * @returns {Array} Array of user objects
   */
  FunkyDataTables.prototype.getRowPresence = function(tableId, rowId) {
    if (!_presenceEnabled || !Funky.Presence) return [];

    var channel = 'table:row:' + tableId + ':' + rowId;
    return Funky.Presence.getOtherUsers(channel);
  };

  /**
   * Check if row is being edited by another user
   * @param {string} tableId - Table identifier
   * @param {string} rowId - Row ID
   * @returns {Object|null} User editing or null
   */
  FunkyDataTables.prototype.getRowEditor = function(tableId, rowId) {
    var users = this.getRowPresence(tableId, rowId);
    for (var i = 0; i < users.length; i++) {
      if (users[i].status === 'editing') {
        return users[i];
      }
    }
    return null;
  };

  /**
   * Check for edit conflict before entering edit mode
   * @param {string} tableId - Table identifier
   * @param {string} rowId - Row ID
   * @returns {boolean} True if safe to edit
   */
  FunkyDataTables.prototype.checkRowEditConflict = function(tableId, rowId) {
    if (!_presenceEnabled || !Funky.Presence || !_presenceConfig.warnOnEditConflict) {
      return true;
    }

    var editor = this.getRowEditor(tableId, rowId);

    if (editor) {
      return confirm(
        editor.name + ' is currently editing this row. Continue anyway?'
      );
    }

    return true;
  };

  /**
   * Get users viewing the table
   * @param {string} tableId - Table identifier
   * @returns {Array} Array of user objects
   */
  FunkyDataTables.prototype.getTableUsers = function(tableId) {
    if (!_presenceEnabled || !Funky.Presence) return [];

    var channel = _tableChannels[tableId];
    if (!channel) return [];

    return Funky.Presence.getOtherUsers(channel);
  };

  /**
   * Update cursor indicators on rows
   * @param {string} tableId - Table identifier
   * @private
   */
  FunkyDataTables.prototype._updateCursorIndicators = function(tableId) {
    if (!_presenceConfig.showCursorIndicators) return;

    var positions = _cursorPositions[tableId] || {};

    // Clear existing indicators
    document.querySelectorAll('.datatable-row__cursor[data-table="' + tableId + '"]').forEach(function(el) {
      el.parentNode.removeChild(el);
    });

    // Add indicators for each user
    var self = this;
    Object.keys(positions).forEach(function(userId) {
      var pos = positions[userId];
      if (!pos.row || !pos.user) return;

      var row = document.querySelector('[data-row-id="' + pos.row + '"]');
      if (!row) return;

      // Ensure row has relative positioning
      if (window.getComputedStyle(row).position === 'static') {
        row.style.position = 'relative';
      }

      var indicator = document.createElement('div');
      indicator.className = 'datatable-row__cursor';
      indicator.setAttribute('data-table', tableId);
      indicator.setAttribute('data-user-id', userId);

      var avatarSrc = pos.user.avatar || '/assets/images/default-avatar.png';
      var userName = pos.user.name || 'Someone';

      indicator.innerHTML =
        '<img src="' + avatarSrc + '" alt="">' +
        '<span>' + userName + '</span>';

      row.appendChild(indicator);
    });
  };

  /**
   * Refresh presence indicators for all visible rows
   * @param {string} tableId - Table identifier
   */
  FunkyDataTables.prototype.refreshRowPresenceIndicators = function(tableId) {
    if (!_presenceEnabled || !_presenceConfig.showRowPresence) return;

    var self = this;

    // Find all rows in this table
    document.querySelectorAll('[data-table-id="' + tableId + '"] [data-row-id], #' + tableId + ' [data-row-id]').forEach(function(row) {
      var rowId = row.getAttribute('data-row-id');
      self._addRowPresenceIndicator(tableId, row, rowId);
    });
  };

  /**
   * Add presence indicator to a row
   * @param {string} tableId - Table identifier
   * @param {Element} rowEl - Row element
   * @param {string} rowId - Row ID
   * @private
   */
  FunkyDataTables.prototype._addRowPresenceIndicator = function(tableId, rowEl, rowId) {
    if (!_presenceEnabled || !Funky.Presence) return;

    var users = this.getRowPresence(tableId, rowId);

    // Remove existing indicator
    var existing = rowEl.querySelector('.datatable-row__presence');
    if (existing) {
      existing.parentNode.removeChild(existing);
    }

    if (users.length === 0) return;

    // Ensure row has relative positioning
    if (window.getComputedStyle(rowEl).position === 'static') {
      rowEl.style.position = 'relative';
    }

    var indicator = document.createElement('div');
    indicator.className = 'datatable-row__presence';
    indicator.setAttribute('aria-label', users.length + ' user(s) on this row');

    // Show avatars
    users.slice(0, 3).forEach(function(user) {
      var avatar = document.createElement('img');
      avatar.src = user.avatar || '/assets/images/default-avatar.png';
      avatar.alt = user.name || 'User';
      avatar.title = (user.name || 'User') + ' - ' + (user.status || 'viewing');
      avatar.className = 'datatable-row__presence-avatar';
      if (user.status === 'editing') {
        avatar.classList.add('datatable-row__presence-avatar--editing');
      }
      indicator.appendChild(avatar);
    });

    if (users.length > 3) {
      var overflow = document.createElement('span');
      overflow.className = 'datatable-row__presence-overflow';
      overflow.textContent = '+' + (users.length - 3);
      indicator.appendChild(overflow);
    }

    rowEl.appendChild(indicator);
  };

  /**
   * Get presence channel for a table
   * @param {string} tableId - Table identifier
   * @returns {string|null}
   */
  FunkyDataTables.prototype.getPresenceChannel = function(tableId) {
    return _tableChannels[tableId] || null;
  };

  // Create instance
  var dataTablesInstance = new FunkyDataTables();

  // Expose instance registry for LiveBinding
  dataTablesInstance._instances = instanceRegistry;

  // Register with Funky namespace
  Funky.register('DataTables', dataTablesInstance);

})(window);
