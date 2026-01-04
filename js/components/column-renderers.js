/**
 * Funky Renderers - DataTable Column Render Functions
 * 
 * Provides reusable render functions for DataTables columns.
 * Each renderer returns a function that can be used as the `render` option.
 * 
 * Usage:
 *   columns: [
 *     { data: 'id', render: Funky.Renderers.id() },
 *     { data: 'amount', render: Funky.Renderers.currency('USD') },
 *     { data: 'is_active', render: Funky.Renderers.activeStatus() },
 *     { data: null, render: Funky.Renderers.actions({ view: true, edit: true }) }
 *   ]
 * 
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Renderers] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('Renderers')) {
		return;
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	function escapeHtml(text) {
		if (text === null || text === undefined) return '';
		var div = document.createElement('div');
		div.textContent = String(text);
		return div.innerHTML;
	}

	var Renderers = {
		/**
		 * Render plain text with optional styling
		 * @param {object} [options] - Options
		 * @param {boolean} [options.bold] - Make text bold
		 * @param {string} [options.className] - Additional CSS class
		 * @param {string} [options.prefix] - Prefix to add before text
		 * @param {string} [options.suffix] - Suffix to add after text
		 * @param {string} [options.emptyValue='-'] - Value to show for null/empty
		 * @returns {function} DataTables render function
		 */
		text: function(options) {
			options = options || {};
			var emptyValue = options.emptyValue !== undefined ? options.emptyValue : '-';
			return function(data, type) {
				if (type === 'display') {
					if (data == null || data === '') return emptyValue;
					var text = (options.prefix || '') + escapeHtml(data) + (options.suffix || '');
					if (options.bold) text = '<span class="fw-bold">' + text + '</span>';
					if (options.className) text = '<span class="' + options.className + '">' + text + '</span>';
					return text;
				}
				return data;
			};
		},

		/**
		 * Render number with locale formatting
		 * @param {object} [options] - Options
		 * @param {number} [options.decimals=0] - Decimal places
		 * @param {string} [options.emptyValue='-'] - Value to show for null
		 * @returns {function} DataTables render function
		 */
		number: function(options) {
			options = options || {};
			var decimals = options.decimals !== undefined ? options.decimals : 0;
			var emptyValue = options.emptyValue !== undefined ? options.emptyValue : '-';
			return function(data, type) {
				if (data == null || data === '') return emptyValue;
				if (type === 'display') {
					return Number(data).toLocaleString('en-US', {
						minimumFractionDigits: decimals,
						maximumFractionDigits: decimals
					});
				}
				return data;
			};
		},

		/**
		 * Render boolean as Active/Inactive badge
		 * @param {object} [options] - Options
		 * @param {string} [options.activeLabel='Active'] - Label for true
		 * @param {string} [options.inactiveLabel='Inactive'] - Label for false
		 * @returns {function} DataTables render function
		 */
		boolean: function(options) {
			options = options || {};
			var activeLabel = options.activeLabel || 'Active';
			var inactiveLabel = options.inactiveLabel || 'Inactive';
			return function(data, type) {
				if (type === 'display') {
					return data 
						? '<span class="badge-funky badge-active">' + activeLabel + '</span>'
						: '<span class="badge-funky badge-inactive">' + inactiveLabel + '</span>';
				}
				return data;
			};
		},

		/**
		 * Render ID with # prefix
		 * @returns {function} DataTables render function
		 */
		id: function() {
			return function(data, type) {
				if (type === 'display') {
					return data ? '<span class="text-muted">#' + escapeHtml(data) + '</span>' : '';
				}
				return data;
			};
		},

		/**
		 * Render text as bold
		 * @returns {function} DataTables render function
		 */
		bold: function() {
			return function(data, type) {
				if (type === 'display') {
					return '<span class="fw-bold">' + escapeHtml(data) + '</span>';
				}
				return data;
			};
		},

		/**
		 * Render currency with locale formatting
		 * @param {string|object} [currencyOrOptions='USD'] - Currency code or options object
		 * @param {number} [decimals=2] - Decimal places (if first arg is string)
		 * @returns {function} DataTables render function
		 */
		currency: function(currencyOrOptions, decimals) {
			var currency, opts;
			if (typeof currencyOrOptions === 'object' && currencyOrOptions !== null) {
				opts = currencyOrOptions;
				currency = opts.currency || 'USD';
				decimals = opts.decimals !== undefined ? opts.decimals : 2;
			} else {
				currency = currencyOrOptions || 'USD';
				decimals = decimals !== undefined ? decimals : 2;
			}

			return function(data, type) {
				if (data === null || data === undefined || data === '') return '-';
				
				var num = parseFloat(data);
				if (isNaN(num)) return data;

				if (type === 'display') {
					// Use Funky.Format if available
					if (Funky.Format && Funky.Format.currency) {
						return Funky.Format.currency(num, currency, decimals);
					}
					// Fallback
					return num.toLocaleString('en-US', {
						style: 'currency',
						currency: currency,
						minimumFractionDigits: decimals,
						maximumFractionDigits: decimals
					});
				}
				return num;
			};
		},

		/**
		 * Render percentage with % suffix
		 * @param {number|object} [decimalsOrOptions=2] - Decimal places or options object
		 * @param {boolean} [multiply=false] - Multiply by 100 (if first arg is number)
		 * @returns {function} DataTables render function
		 */
		percent: function(decimalsOrOptions, multiply) {
			var decimals;
			if (typeof decimalsOrOptions === 'object' && decimalsOrOptions !== null) {
				decimals = decimalsOrOptions.decimals !== undefined ? decimalsOrOptions.decimals : 2;
				multiply = decimalsOrOptions.multiply !== undefined ? decimalsOrOptions.multiply : false;
			} else {
				decimals = decimalsOrOptions !== undefined ? decimalsOrOptions : 2;
				multiply = multiply !== undefined ? multiply : false;
			}

			return function(data, type) {
				if (data === null || data === undefined || data === '') return '-';
				
				var num = parseFloat(data);
				if (isNaN(num)) return data;

				if (multiply) {
					num = num * 100;
				}

				if (type === 'display') {
					return num.toFixed(decimals) + '%';
				}
				return num;
			};
		},

		/**
		 * Render date (timezone-aware)
		 * @param {string|object} [formatOrOptions='YYYY-MM-DD'] - Date format or options object
		 * @returns {function} DataTables render function
		 */
		date: function(formatOrOptions) {
			var format, dateOnly;
			if (typeof formatOrOptions === 'object' && formatOrOptions !== null) {
				format = formatOrOptions.format || 'YYYY-MM-DD';
				dateOnly = formatOrOptions.dateOnly || false;
			} else {
				format = formatOrOptions || 'YYYY-MM-DD';
				dateOnly = false;
			}

			return function(data, type) {
				if (!data) return '-';

				if (type === 'display') {
					// Use Funky.Timezone if available
					if (Funky.Timezone && Funky.Timezone.renderDate) {
						return Funky.Timezone.renderDate(data, { dateOnly: dateOnly });
					}
					if (Funky.Timezone && Funky.Timezone.formatDate) {
						return Funky.Timezone.formatDate(data, format);
					}
					// Fallback: use moment if available
					if (window.moment) {
						return moment(data).format(format);
					}
					// Basic fallback
					var d = new Date(data);
					return dateOnly ? d.toLocaleDateString() : d.toLocaleString();
				}
				return data;
			};
		},

		/**
		 * Render date only (no time, timezone-aware)
		 * Uses Funky.Timezone.renderDate with dateOnly option
		 * @returns {function} DataTables render function
		 */
		dateOnly: function() {
			return function(data, type) {
				if (!data) return '';

				if (type === 'display') {
					// Use Funky.Timezone if available
					if (Funky.Timezone && Funky.Timezone.renderDate) {
						return Funky.Timezone.renderDate(data, { dateOnly: true });
					}
					// Fallback
					var d = new Date(data);
					return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
				}
				return data;
			};
		},

		/**
		 * Render datetime (timezone-aware)
		 * @param {string} [format='YYYY-MM-DD HH:mm'] - DateTime format
		 * @returns {function} DataTables render function
		 */
		datetime: function(format) {
			format = format || 'YYYY-MM-DD HH:mm';

			return function(data, type) {
				if (!data) return '';

				if (type === 'display') {
					// Use Funky.Timezone if available
					if (Funky.Timezone && Funky.Timezone.format) {
						return Funky.Timezone.format(data, format);
					}
					// Fallback: use moment if available
					if (window.moment) {
						return moment(data).format(format);
					}
					// Basic fallback
					var d = new Date(data);
					return d.toLocaleString();
				}
				return data;
			};
		},

		/**
		 * Render active/inactive status badge
		 * @param {object} [options] - Configuration options
		 * @param {string} [options.activeText='Active'] - Text for active state
		 * @param {string} [options.inactiveText='Inactive'] - Text for inactive state
		 * @returns {function} DataTables render function
		 */
		activeStatus: function(options) {
			options = options || {};
			var activeText = options.activeText || 'Active';
			var inactiveText = options.inactiveText || 'Inactive';

			return function(data, type) {
				if (type === 'display') {
					var isActive = data === true || data === 1 || data === '1' || data === 'true';
					if (isActive) {
						return '<span class="badge-funky badge-active">' + activeText + '</span>';
					}
					return '<span class="badge-funky badge-inactive">' + inactiveText + '</span>';
				}
				return data;
			};
		},

		/**
		 * Render yes/no badge
		 * @param {object} [options] - Configuration options
		 * @param {string} [options.yesText='Yes'] - Text for yes state
		 * @param {string} [options.noText='No'] - Text for no state
		 * @returns {function} DataTables render function
		 */
		yesNo: function(options) {
			options = options || {};
			var yesText = options.yesText || 'Yes';
			var noText = options.noText || 'No';

			return function(data, type) {
				if (type === 'display') {
					var isYes = data === true || data === 1 || data === '1' || data === 'true';
					if (isYes) {
						return '<span class="badge-funky badge-active">' + yesText + '</span>';
					}
					return '<span class="badge-funky badge-inactive">' + noText + '</span>';
				}
				return data;
			};
		},

		/**
		 * Render status badge using a mapping object
		 * @param {object} badgeMap - Map of value -> {text, class} or value -> class (text defaults to value)
		 * @param {object} [options] - Configuration options
		 * @param {string} [options.defaultClass='badge-inactive'] - Default badge class
		 * @param {string} [options.defaultText='-'] - Default text for unknown values
		 * @returns {function} DataTables render function
		 * 
		 * @example
		 * // Simple: value -> class
		 * Funky.Renderers.badgeMap({
		 *   'pending': 'badge-warning',
		 *   'sent': 'badge-active',
		 *   'rejected': 'badge-inactive'
		 * })
		 * 
		 * @example
		 * // Full control: value -> {text, class}
		 * Funky.Renderers.badgeMap({
		 *   'pending': { text: 'Pending', class: 'badge-warning' },
		 *   'sent': { text: 'Sent', class: 'badge-active' },
		 *   'rejected': { text: 'Rejected', class: 'badge-inactive' }
		 * })
		 */
		badgeMap: function(badgeMap, options) {
			options = options || {};
			var defaultClass = options.defaultClass || 'badge-inactive';
			var defaultText = options.defaultText || '-';

			return function(data, type) {
				if (type === 'display') {
					var mapping = badgeMap[data];
					var badgeClass, badgeText;

					if (mapping) {
						if (typeof mapping === 'string') {
							// Simple: value -> class
							badgeClass = mapping;
							badgeText = data.charAt(0).toUpperCase() + data.slice(1); // Capitalize
						} else {
							// Full: value -> {text, class}
							badgeClass = mapping.class || defaultClass;
							badgeText = mapping.text || data;
						}
					} else {
						badgeClass = defaultClass;
						badgeText = data || defaultText;
					}

					return '<span class="badge-funky ' + badgeClass + '">' + escapeHtml(badgeText) + '</span>';
				}
				return data;
			};
		},

		/**
		 * Render text with ellipsis truncation
		 * @param {number} [maxLength=50] - Maximum character length
		 * @returns {function} DataTables render function
		 */
		truncate: function(maxLength) {
			maxLength = maxLength || 50;

			return function(data, type) {
				if (!data) return '';

				var text = String(data);
				if (type === 'display' && text.length > maxLength) {
					var truncated = text.substring(0, maxLength) + '...';
					return '<span title="' + escapeHtml(text) + '">' + escapeHtml(truncated) + '</span>';
				}
				return data;
			};
		},

		/**
		 * Render link
		 * @param {string|function} urlTemplate - URL template with {field} placeholders or function
		 * @param {object} [options] - Configuration options
		 * @param {boolean} [options.newTab=false] - Open in new tab
		 * @returns {function} DataTables render function
		 */
		link: function(urlTemplate, options) {
			options = options || {};

			return function(data, type, row) {
				if (!data) return '';

				if (type === 'display') {
					var url;
					if (typeof urlTemplate === 'function') {
						url = urlTemplate(row);
					} else {
						url = urlTemplate.replace(/\{(\w+)\}/g, function(match, field) {
							return encodeURIComponent(row[field] || '');
						});
					}
					var target = options.newTab ? ' target="_blank"' : '';
					return '<a href="' + escapeHtml(url) + '"' + target + '>' + escapeHtml(data) + '</a>';
				}
				return data;
			};
		},

		/**
		 * Render action buttons (View/Edit/Delete/Audit/Nested)
		 * @param {object} config - Button configuration
		 * @param {boolean|object} [config.view] - Show view button
		 * @param {boolean|object} [config.edit] - Show edit button
		 * @param {boolean|object} [config.delete] - Show delete button
		 * @param {boolean|object} [config.audit] - Show audit button
		 * @param {Array} [config.nested] - Nested CRUD buttons [{name, icon, title, btnClass}]
		 * @param {Array} [config.custom] - Custom action buttons
		 * @param {string} [config.entity] - Parent entity name (required for nested)
		 * @returns {function} DataTables render function
		 */
		actions: function(config) {
			config = config || {};

			return function(data, type, row) {
				if (type !== 'display') return '';

				var buttons = [];
				var id = row.id;

				// Nested CRUD buttons (placed first for prominence)
				if (config.nested && Array.isArray(config.nested)) {
					config.nested.forEach(function(nested) {
						var icon = nested.icon || 'fa-list';
						var title = nested.title || 'Manage';
						var btnClass = nested.btnClass || 'btn-primary';
						var nestedName = nested.name;
						var parentEntity = config.entity;

						if (!parentEntity) {
							console.warn('[Funky.Renderers] entity required for nested actions');
							return;
						}

						// Store row data for retrieval by openNested
						var rowDataId = 'nestedRow_' + id + '_' + Math.random().toString(36).substr(2, 9);
						window[rowDataId] = row;

						buttons.push(
							'<button type="button" class="btn-icon ' + btnClass + '" ' +
							'onclick="Funky.CRUD.openNested(\'' + parentEntity + '\', \'' + nestedName + '\', window.' + rowDataId + ')" ' +
							'title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + ' for row ' + id + '">' +
							'<i class="fas ' + icon + '" aria-hidden="true"></i></button>'
						);
					});
				}

				// View button
				if (config.view) {
					var viewOpts = typeof config.view === 'object' ? config.view : {};
					var viewIcon = viewOpts.icon || 'fa-eye';
					var viewTitle = viewOpts.title || 'View';
					var viewHandler = viewOpts.handler || 'viewRow';
					buttons.push(
						'<button type="button" class="btn-icon btn-view" ' +
						'onclick="' + viewHandler + '(' + id + ')" title="' + viewTitle + '" aria-label="' + viewTitle + ' row ' + id + '">' +
						'<i class="fas ' + viewIcon + '" aria-hidden="true"></i></button>'
					);
				}

				// Edit button
				if (config.edit) {
					var editOpts = typeof config.edit === 'object' ? config.edit : {};
					var editIcon = editOpts.icon || 'fa-edit';
					var editTitle = editOpts.title || 'Edit';
					var editHandler = editOpts.handler || 'editRow';
					buttons.push(
						'<button type="button" class="btn-icon btn-edit" ' +
						'onclick="' + editHandler + '(' + id + ')" title="' + editTitle + '" aria-label="' + editTitle + ' row ' + id + '">' +
						'<i class="fas ' + editIcon + '" aria-hidden="true"></i></button>'
					);
				}

				// Delete button
				if (config.delete) {
					var deleteOpts = typeof config.delete === 'object' ? config.delete : {};
					var deleteIcon = deleteOpts.icon || 'fa-trash';
					var deleteTitle = deleteOpts.title || 'Delete';
					var deleteHandler = deleteOpts.handler || 'deleteRow';
					buttons.push(
						'<button type="button" class="btn-icon btn-delete" ' +
						'onclick="' + deleteHandler + '(' + id + ')" title="' + deleteTitle + '" aria-label="' + deleteTitle + ' row ' + id + '">' +
						'<i class="fas ' + deleteIcon + '" aria-hidden="true"></i></button>'
					);
				}

				// Audit button
				if (config.audit) {
					var auditOpts = typeof config.audit === 'object' ? config.audit : {};
					var auditIcon = auditOpts.icon || 'fa-history';
					var auditTitle = auditOpts.title || 'Audit History';
					var auditHandler = auditOpts.handler || 'showAudit';
					buttons.push(
						'<button type="button" class="btn-icon btn-history" ' +
						'onclick="' + auditHandler + '(' + id + ')" title="' + auditTitle + '" aria-label="' + auditTitle + ' for row ' + id + '">' +
						'<i class="fas ' + auditIcon + '" aria-hidden="true"></i></button>'
					);
				}

				// Custom actions
				if (config.custom && Array.isArray(config.custom)) {
					config.custom.forEach(function(action) {
						var icon = action.icon || 'fa-cog';
						var title = action.title || 'Action';
						var btnClass = action.btnClass || 'btn-secondary';
						var handler = action.handler;

						if (typeof handler === 'function') {
							// Store handler reference for later lookup
							var handlerId = 'customAction_' + id + '_' + Math.random().toString(36).substr(2, 9);
							window[handlerId] = function() { handler(row); };
							buttons.push(
								'<button type="button" class="btn-icon ' + btnClass + '" ' +
								'onclick="' + handlerId + '()" title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + ' for row ' + id + '">' +
								'<i class="fas ' + icon + '" aria-hidden="true"></i></button>'
							);
						} else if (typeof handler === 'string') {
							buttons.push(
								'<button type="button" class="btn-icon ' + btnClass + '" ' +
								'onclick="' + handler + '(' + id + ')" title="' + escapeHtml(title) + '" aria-label="' + escapeHtml(title) + ' for row ' + id + '">' +
								'<i class="fas ' + icon + '" aria-hidden="true"></i></button>'
							);
						}
					});
				}

				return '<div class="action-buttons" role="group" aria-label="Actions for row ' + id + '">' + buttons.join('') + '</div>';
			};
		},

		/**
		 * Get a renderer by name (for string shortcuts)
		 * @param {string} name - Renderer name (e.g., 'id', 'bold', 'currency:USD')
		 * @returns {function|null} Renderer function or null
		 */
		get: function(name) {
			if (typeof name !== 'string') return null;

			// Parse name:arg1:arg2 format
			var parts = name.split(':');
			var rendererName = parts[0];
			var args = parts.slice(1);

			if (typeof Renderers[rendererName] === 'function') {
				return Renderers[rendererName].apply(null, args);
			}

			return null;
		},

		/**
		 * Escape HTML to prevent XSS - exposed for use in custom render functions
		 * @param {string} text - Text to escape
		 * @returns {string} Escaped HTML
		 */
		escapeHtml: escapeHtml
	};

	// Register with Funky namespace
	Funky.register('Renderers', Renderers);

	console.log('[Funky.Renderers] Initialized');

})(window);
