/**
 * Funky Table Aggregations - Footer Calculations for DataTables
 * 
 * Calculates and renders footer aggregations with:
 * - Sum, Average, Count, Min, Max calculations
 * - Multiple format options (currency, percentage, etc.)
 * - Auto-recalculation on filter/search/page
 * 
 * Usage:
 *   var agg = new Funky.Aggregations.create('myTable', [
 *     { column: 'quantity', type: 'sum', format: 'integer' },
 *     { column: 'price', type: 'avg', format: 'currency' },
 *     { column: 5, type: 'count', format: 'number' }
 *   ]);
 * 
 * @version 1.0.4
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Aggregations] Registry not found. Load namespace.js first.');
		return;
	}

	/**
	 * FunkyTableAggregations Constructor
	 * @param {string} tableId - ID of the table element
	 * @param {Array} config - Array of aggregation configurations
	 */
	function FunkyTableAggregations(tableId, config) {
		this.tableId = tableId;
		this.table = null;
		this.config = config || [];
		this.tfoot = null;

		this.init();
	}

	/**
	 * Initialize aggregations
	 */
	FunkyTableAggregations.prototype.init = function() {
		var self = this;
		var tableEl = document.getElementById(this.tableId);
		if (!tableEl) {
			console.warn('[Funky.Aggregations] Table not found:', this.tableId);
			return;
		}

		// Wait for DataTable to be initialized
		if (jQuery.fn.DataTable.isDataTable('#' + this.tableId)) {
			this.table = jQuery('#' + this.tableId).DataTable();
			this.createFooter();
			this.bindEvents();
			this.calculate();
		} else {
			// Wait and retry
			setTimeout(function() {
				if (jQuery.fn.DataTable.isDataTable('#' + self.tableId)) {
					self.table = jQuery('#' + self.tableId).DataTable();
					self.createFooter();
					self.bindEvents();
					self.calculate();
				}
			}, 500);
		}
	};

	/**
	 * Create footer element if needed
	 */
	FunkyTableAggregations.prototype.createFooter = function() {
		var tableEl = document.getElementById(this.tableId);
		if (!tableEl) return;

		this.tfoot = tableEl.querySelector('tfoot.dt-footer-aggregation');
		if (!this.tfoot) {
			this.tfoot = document.createElement('tfoot');
			this.tfoot.className = 'dt-footer-aggregation';
			tableEl.appendChild(this.tfoot);
		}
	};

	/**
	 * Bind DataTable events
	 */
	FunkyTableAggregations.prototype.bindEvents = function() {
		var self = this;
		if (!this.table) return;

		// Recalculate on draw (pagination, search, filter)
		this.table.on('draw.dt', function() {
			self.calculate();
		});
	};

	/**
	 * Calculate aggregations
	 */
	FunkyTableAggregations.prototype.calculate = function() {
		if (!this.table || !this.tfoot || this.config.length === 0) return;

		var self = this;
		var columnCount = this.table.columns().count();
		var results = {};

		// Get all visible data (filtered, not paginated for totals)
		var filteredData = this.table.rows({ search: 'applied' }).data();

		// Calculate for each configured column
		this.config.forEach(function(cfg) {
			var colIndex = self.getColumnIndex(cfg.column);
			if (colIndex === -1) return;

			var values = [];
			filteredData.each(function(row) {
				var val = self.extractNumericValue(row[colIndex]);
				if (val !== null) values.push(val);
			});

			var result = {
				type: cfg.type,
				format: cfg.format || 'number',
				value: 0,
				count: values.length
			};

			if (values.length > 0) {
				switch (cfg.type) {
					case 'sum':
						result.value = values.reduce(function(a, b) { return a + b; }, 0);
						break;
					case 'avg':
					case 'average':
						result.value = values.reduce(function(a, b) { return a + b; }, 0) / values.length;
						break;
					case 'count':
						result.value = values.length;
						break;
					case 'min':
						result.value = Math.min.apply(null, values);
						break;
					case 'max':
						result.value = Math.max.apply(null, values);
						break;
				}
			}

			results[colIndex] = result;
		});

		// Render footer row
		this.renderFooter(results, columnCount);
	};

	/**
	 * Get column index from name or number
	 */
	FunkyTableAggregations.prototype.getColumnIndex = function(column) {
		if (typeof column === 'number') return column;

		var idx = -1;
		var self = this;
		this.table.columns().every(function(i) {
			var col = this;
			if (col.dataSrc() === column || col.header().textContent.trim().toLowerCase() === column.toLowerCase()) {
				idx = i;
				return false;
			}
		});
		return idx;
	};

	/**
	 * Extract numeric value from cell data
	 */
	FunkyTableAggregations.prototype.extractNumericValue = function(cellData) {
		if (cellData === null || cellData === undefined || cellData === '') return null;

		// If it's already a number
		if (typeof cellData === 'number') return cellData;

		// Convert string to number, removing currency symbols, commas, etc.
		var str = String(cellData);

		// Check if it's HTML, extract text
		if (str.indexOf('<') !== -1) {
			var temp = document.createElement('div');
			temp.innerHTML = str;
			str = temp.textContent || temp.innerText || '';
		}

		// Remove currency symbols and formatting
		str = str.replace(/[$£€¥,\s]/g, '').replace(/\(([0-9.]+)\)/, '-$1');

		var num = parseFloat(str);
		return isNaN(num) ? null : num;
	};

	/**
	 * Format number for display
	 */
	FunkyTableAggregations.prototype.formatNumber = function(value, format) {
		if (value === null || value === undefined) return '-';

		switch (format) {
			case 'currency':
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				}).format(value);

			case 'currency-short':
				if (Math.abs(value) >= 1e9) {
					return '$' + (value / 1e9).toFixed(2) + 'B';
				} else if (Math.abs(value) >= 1e6) {
					return '$' + (value / 1e6).toFixed(2) + 'M';
				} else if (Math.abs(value) >= 1e3) {
					return '$' + (value / 1e3).toFixed(2) + 'K';
				}
				return '$' + value.toFixed(2);

			case 'percentage':
				return value.toFixed(2) + '%';

			case 'integer':
				return new Intl.NumberFormat('en-US', {
					maximumFractionDigits: 0
				}).format(Math.round(value));

			case 'decimal':
				return new Intl.NumberFormat('en-US', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 4
				}).format(value);

			default:
				return new Intl.NumberFormat('en-US', {
					minimumFractionDigits: 0,
					maximumFractionDigits: 2
				}).format(value);
		}
	};

	/**
	 * Get type label for display
	 */
	FunkyTableAggregations.prototype.getTypeLabel = function(type) {
		var labels = {
			sum: 'SUM',
			avg: 'AVG',
			average: 'AVG',
			count: 'COUNT',
			min: 'MIN',
			max: 'MAX'
		};
		return labels[type] || type.toUpperCase();
	};

	/**
	 * Render footer row
	 */
	FunkyTableAggregations.prototype.renderFooter = function(results, columnCount) {
		var self = this;
		var D = Funky.Dom;

		// Clear existing content
		this.tfoot.innerHTML = '';

		var row = D.create('tr').attr('role', 'row');

		for (var i = 0; i < columnCount; i++) {
			if (results[i]) {
				var res = results[i];
				var valueClass = res.value < 0 ? 'negative' : (res.value > 0 ? 'positive' : '');
				var formattedValue = self.formatNumber(res.value, res.format);
				var typeLabel = self.getTypeLabel(res.type);

				var cell = D.create('td')
					.attr('role', 'cell')
					.aria('label', typeLabel + ': ' + formattedValue)
					.child(
						D.span().class('agg-label').aria('hidden', 'true').text(typeLabel),
						D.span().class('agg-value ' + valueClass).text(formattedValue)
					);
				row.child(cell);
			} else {
				row.child(D.create('td').attr('role', 'cell'));
			}
		}

		this.tfoot.appendChild(row.get());
	};

	/**
	 * Update configuration
	 */
	FunkyTableAggregations.prototype.updateConfig = function(newConfig) {
		this.config = newConfig;
		this.calculate();
	};

	/**
	 * Destroy instance
	 */
	FunkyTableAggregations.prototype.destroy = function() {
		if (this.table) {
			this.table.off('draw.dt');
		}
		if (this.tfoot && this.tfoot.parentNode) {
			this.tfoot.parentNode.removeChild(this.tfoot);
		}
	};

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('Aggregations');

	// Factory object
	var AggregationsFactory = {
		/**
		 * Create a new aggregations instance (primary factory method)
		 * @param {string} tableId - ID of the table element
		 * @param {Array} config - Array of aggregation configurations
		 * @returns {FunkyTableAggregations}
		 */
		init: function(tableId, config) {
			var instance = new FunkyTableAggregations(tableId, config);
			_instances.register(tableId, instance);
			return instance;
		},

		/**
		 * @deprecated Use Aggregations.init() instead
		 */
		create: function(tableId, config) {
			if (Funky.debug) {
				console.warn('[Funky.Aggregations] create() is deprecated. Use init() instead.');
			}
			return AggregationsFactory.init(tableId, config);
		},

		/**
		 * Get existing instance by table ID
		 * @param {string} tableId - Table ID
		 * @returns {FunkyTableAggregations|undefined}
		 */
		getInstance: function(tableId) {
			return _instances.get(tableId);
		},

		/**
		 * Destroy instance by table ID
		 * @param {string} tableId - Table ID
		 */
		destroy: function(tableId) {
			var instance = _instances.get(tableId);
			if (instance) {
				instance.destroy();
				_instances.unregister(tableId);
			}
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		constructor: FunkyTableAggregations
	};

	// Register with Funky namespace
	Funky.register('Aggregations', AggregationsFactory);

})(window);
