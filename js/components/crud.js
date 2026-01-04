/**
 * Funky CRUD - Complete CRUD Controller
 * 
 * Orchestrates all CRUD components for a complete entity management page:
 * - DataTable with configurable columns and renderers
 * - Stats bar with computed statistics
 * - View modal for entity details
 * - Form modal for create/edit (supports schemaPath for OpenAPI integration)
 * - Import modal for bulk import
 * - WebSocket integration for real-time updates
 * - Cache integration for optimized data access
 * - Nested CRUD support for parent-child relationships
 * - Smart row updates for edits (in-memory updates without page reload)
 * 
 * Smart Update Behavior:
 *   - Edits: Updates row in-memory (no reload, row is already visible)
 *   - Creates: Reloads table (server-side pagination/sorting determines position)
 *   - Deletes: Reloads table (server needs to provide next row for pagination)
 * 
 * Manual Row Methods (for advanced use cases):
 *   Funky.CRUD.updateRow('client', 123, data)   - Update specific row in-memory
 *   Funky.CRUD.fetchAndUpdateRow('client', 123) - Fetch from API and update row
 *   Funky.CRUD.reload('client')                 - Full table reload
 * 
 * Usage with schemaPath (recommended):
 *   Funky.CRUD.init({
 *     entity: 'client',
 *     entityLabel: 'Client',
 *     apiUrl: '/api/clients',
 *     tableSelector: '#clientsTable',
 *     schemaPath: 'CreateClient',  // Loaded from Funky.Schema
 *     columns: [...],
 *     features: { create: true, edit: true, delete: true },
 *     
 *     // Nested CRUD for child entities
 *     nested: {
 *       relationships: {
 *         entity: 'client_relationship',
 *         entityLabel: 'Relationship',
 *         apiUrl: '/api/client_relationships',
 *         parentKey: 'client_id',
 *         parentLabelFn: (row) => `${row.name} (${row.code})`,
 *         schemaPath: 'NewClientRelationship',
 *         columns: [...],
 *         features: { create: true, edit: true, delete: true, import: true }
 *       }
 *     }
 *   });
 * 
 * @version 1.0.0
 * @see Funky.Schema for schema management
 * @see Funky.FormModal for form handling
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.CRUD] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('CRUD')) {
		return;
	}

	// Store CRUD instances by entity name
	var _instances = Funky.Registry.createInstanceRegistry('CRUD');

	// Store nested CRUD instances
	var _nestedInstances = Funky.Registry.createInstanceRegistry('CRUD.nested');

	// Track parent entity for nested CRUD routing
	var nestedParentMap = {};

	/**
	 * Process column render shortcuts and add defaults
	 */
	function processColumns(columns) {
		return columns.map(function(col) {
			var processed = Object.assign({}, col);

			// Add defaultContent for columns with data property (prevents missing field errors)
			if (col.data && col.data !== null && processed.defaultContent === undefined) {
				processed.defaultContent = '-';
			}

			// Handle string render shortcuts
			if (typeof col.render === 'string' && Funky.Renderers) {
				var renderer = Funky.Renderers.get(col.render);
				if (renderer) {
					processed.render = renderer;
				}
			}

			return processed;
		});
	}

	/**
	 * Add actions column if needed
	 */
	function addActionsColumn(columns, features, config) {
		// Check if actions column already exists
		var hasActions = columns.some(function(col) {
			return col.data === 'actions' || 
				   col.name === 'actions' ||
				   (col.className && col.className.indexOf('actions-column') !== -1) ||
				   (col.title && col.title.toLowerCase() === 'actions');
		});

		if (hasActions) return columns;

		// Build actions config
		var actionsConfig = {
			view: features.view !== false,
			edit: features.edit !== false,
			delete: features.delete !== false,
			audit: features.audit !== false
		};

		// Add custom actions if defined
		if (config.customActions) {
			actionsConfig.custom = config.customActions;
		}

		// Add actions column
		columns.push({
			data: null,
			title: 'Actions',
			orderable: false,
			responsivePriority: 1,  // Always visible - never collapse into responsive details
			className: 'actions-column text-end dt-nowrap',
			render: Funky.Renderers ? Funky.Renderers.actions(actionsConfig) : function() { return ''; }
		});

		return columns;
	}

	/**
	 * Find instance that might contain a given ID
	 */
	function findInstanceForId(id) {
		// Return the first instance for now
		// In a more complex app, you might track which instance owns which IDs
		var keys = Object.keys(instances);
		return keys.length > 0 ? _instances.get(keys[0]) : null;
	}

	/**
	 * Create nested CRUD modal container
	 */
	function createNestedModal(parentEntity, nestedName, config) {
		var modalId = parentEntity + '_' + nestedName + '_modal';
		var modalTitleId = modalId + '_title';
		var searchId = modalId + '_search';

		// Remove existing modal if it exists (may be stale after SPA navigation)
		var existingModal = document.getElementById(modalId);
		if (existingModal) {
			// Dispose Funky modal instance if exists
			var funkyModal = Funky.Modal.getInstance('#' + modalId);
			if (funkyModal) {
				funkyModal.dispose();
			}
			existingModal.remove();
		}

		var size = config.modalSize || 'modal-slide-panel-xl';
		var entityLabel = config.entityLabel || nestedName;
		var html =
			'<div class="modal fade modal-slide-panel ' + size + '" id="' + modalId + '" tabindex="-1" role="dialog" aria-labelledby="' + modalTitleId + '">' +
			'<div class="modal-dialog">' +
			'<div class="modal-content">' +
			'<div class="modal-header">' +
			'<h5 class="modal-title" id="' + modalTitleId + '">' +
			'<span class="nested-parent-label"></span> ' + entityLabel + 's' +
			'</h5>' +
			'<button type="button" class="btn-close" data-funky-modal-close aria-label="Close"></button>' +
			'</div>' +
			'<div class="modal-body">' +
			'<div class="mb-3 d-flex gap-2 align-items-center">' +
			'<div class="funky-search-box flex-grow-1">' +
			'<label for="' + searchId + '" class="visually-hidden">Search ' + entityLabel.toLowerCase() + 's</label>' +
			'<input type="text" class="nested-search" id="' + searchId + '" placeholder="Search ' + entityLabel.toLowerCase() + 's...">' +
			'</div>' +
			'<button class="btn-funky btn-funky-primary nested-add-btn">' +
			'<i class="fas fa-plus" aria-hidden="true"></i> Add ' + entityLabel +
			'</button>' +
			'</div>' +
			'<table class="table table-hover nested-table" style="width:100%">' +
			'<thead><tr></tr></thead>' +
			'</table>' +
			'</div>' +
			'<div class="modal-footer">' +
			'<button type="button" class="btn-funky btn-funky-secondary" data-funky-modal-close>Close</button>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';

		document.body.insertAdjacentHTML('beforeend', html);
		return modalId;
	}

	/**
	 * NestedCRUD Instance class
	 */
	function NestedCRUDInstance(parentEntity, nestedName, nestedConfig, parentRow) {
		this.parentEntity = parentEntity;
		this.nestedName = nestedName;
		this.config = nestedConfig;
		this.parentRow = parentRow;
		this.parentId = parentRow.id;
		this.table = null;
		this.modal = null;
		this.modalId = null;
		this.data = [];
		this.visible = false;

		this.init();
	}

	NestedCRUDInstance.prototype.init = function() {
		var self = this;
		var config = this.config;

		// Create modal if needed
		this.modalId = createNestedModal(this.parentEntity, this.nestedName, config);
		var modalEl = document.getElementById(this.modalId);
		this.modal = Funky.Modal.getOrCreateInstance(modalEl);

		// Bind close buttons
		modalEl.querySelectorAll('[data-funky-modal-close]').forEach(function(btn) {
			btn.addEventListener('click', function() {
				Funky.Modal.hide('#' + self.modalId);
			});
		});

		// Set parent label
		var parentLabel = '';
		if (typeof config.parentLabelFn === 'function') {
			parentLabel = config.parentLabelFn(this.parentRow);
		} else {
			parentLabel = this.parentRow.name || this.parentRow.code || '#' + this.parentRow.id;
		}
		modalEl.querySelector('.nested-parent-label').textContent = parentLabel;

		// Initialize Form Modal for nested entity
		var nestedFormModalId = this.parentEntity + '_' + this.nestedName + '_form';
		if ((config.features.create || config.features.edit) && Funky.FormModal) {
			var formModalConfig = {
				modalId: nestedFormModalId,
				entity: config.entity,
				entityLabel: config.entityLabel,
				schema: config.schema,
				schemaPath: config.schemaPath,
				apiUrl: config.apiUrl,
				enhanceSchema: config.enhanceSchema,
				onSave: function(result, mode) {
					// For edits, update row in-memory (row is already visible)
					// For creates, reload to handle server-side pagination/sorting
					var data = result[config.entity] || result;
					if (mode === 'edit' && data && data.id) {
						self.updateRow(data.id, data);
					} else {
						self.reload();
					}
				}
			};

			// Merge formModalOptions if provided
			if (config.formModalOptions) {
				Object.assign(formModalConfig, config.formModalOptions);
				if (config.formModalOptions.onSave) {
					var originalOnSave = config.formModalOptions.onSave;
					formModalConfig.onSave = function(result, mode) {
						// For edits, update row in-memory; for creates, reload
						var data = result[config.entity] || result;
						if (mode === 'edit' && data && data.id) {
							self.updateRow(data.id, data);
						} else {
							self.reload();
						}
						originalOnSave(result, mode);
					};
				}
			}

			Funky.FormModal.init(formModalConfig);
		}

		// Initialize Import Modal for nested entity
		if (config.features.import && Funky.Import) {
			var importConfig = typeof config.features.import === 'object' ? config.features.import : {};
			var tableName = config.tableName || (config.entity + 's');
			var importUrl = importConfig.apiUrl || '/api/import/csv/' + tableName;
			Funky.Import.init({
				modalId: this.parentEntity + '_' + this.nestedName + '_import',
				entity: config.entity,
				entityLabel: config.entityLabel,
				apiUrl: importUrl,
				extraData: function() {
					var data = {};
					data[config.parentKey] = self.parentId;
					return data;
				},
				requiredFields: importConfig.requiredFields || [],
				instructions: importConfig.instructions,
				onComplete: function() {
					self.reload();
				}
			});
		}

		// Wire up Add button
		var addBtn = modalEl.querySelector('.nested-add-btn');
		if (addBtn) {
			addBtn.onclick = function() {
				self.create();
			};
		}

		// Initialize DataTable
		this.initTable();

		// Wire up search
		var searchInput = modalEl.querySelector('.nested-search');
		if (searchInput && this.table) {
			Funky.DataTables.setupGlobalSearch(searchInput, this.table);
		}
	};

	NestedCRUDInstance.prototype.initTable = function() {
		var self = this;
		var config = this.config;
		var modalEl = document.getElementById(this.modalId);
		var tableEl = modalEl.querySelector('.nested-table');

		// Process columns
		var columns = processColumns(config.columns);
		
		// Add actions column if not present
		var hasActions = columns.some(function(col) {
			return col.data === 'actions' || col.className === 'actions-column' || col.name === 'actions';
		});

		if (!hasActions && config.features) {
			var actionsConfig = {
				view: config.features.view === true,
				edit: config.features.edit !== false,
				delete: config.features.delete !== false,
				audit: config.features.audit !== false
			};
			columns.push({
				data: null,
				title: 'Actions',
				orderable: false,
				className: 'actions-column text-end',
				render: Funky.Renderers ? Funky.Renderers.actions(actionsConfig) : function() { return ''; }
			});
		}

		// Build table headers
		var thead = tableEl.querySelector('thead tr');
		thead.replaceChildren();
		columns.forEach(function(col) {
			var th = document.createElement('th');
			th.textContent = col.title || col.data || '';
			thead.appendChild(th);
		});

		// Determine table name
		var tableName = config.tableName || (config.entity + 's');

		// DataTable options with parent filter
		var extraAjaxData = {};
		extraAjaxData[config.parentKey] = this.parentId;

		var dtOptions = {
			tableName: tableName,
			ajaxUrl: config.apiUrl,
			columns: columns,
			extraAjaxData: extraAjaxData,
			order: config.order || [[0, 'desc']],
			pageLength: config.pageLength || 10,
			enableImport: !!(config.features && config.features.import),
			enableExport: config.features.export !== false,
			emptyMessage: 'No ' + (config.entityLabel || config.entity).toLowerCase() + 's found'
		};

		// Store nested instance reference for action handlers
		var nestedKey = this.parentEntity + '_' + this.nestedName;
		_nestedInstances.register(nestedKey, this);
		nestedParentMap[config.entity] = nestedKey;

		// Initialize table
		if (Funky.DataTables) {
			this.table = Funky.DataTables.init(tableEl, dtOptions);
		}
	};

	NestedCRUDInstance.prototype.show = function() {
		this.modal.show();
		this.visible = true;
		return this;
	};

	NestedCRUDInstance.prototype.hide = function() {
		this.modal.hide();
		this.visible = false;
		return this;
	};

	/**
	 * Toggle visibility
	 * @returns {NestedCRUDInstance} this for chaining
	 */
	NestedCRUDInstance.prototype.toggle = function() {
		if (this.visible) {
			return this.hide();
		}
		return this.show();
	};

	NestedCRUDInstance.prototype.reload = function() {
		if (this.table) {
			this.table.ajax.reload(null, false);
		}
	};

	/**
	 * Update a single row in-memory without full table reload
	 */
	NestedCRUDInstance.prototype.updateRow = function(id, data) {
		if (!this.table || !id || !data) {
			return false;
		}

		var found = false;
		this.table.rows().every(function(rowIdx) {
			var rowData = this.data();
			if (rowData && String(rowData.id) === String(id)) {
				var mergedData = Object.assign({}, rowData, data);
				this.data(mergedData);
				found = true;
				return false;
			}
		});

		if (found) {
			this.table.draw(false);
		}
		return found;
	};

	/**
	 * Add a new row to the table without full reload
	 */
	NestedCRUDInstance.prototype.addRow = function(data) {
		if (!this.table || !data) {
			return;
		}
		this.table.row.add(data);
		this.table.draw(false);
	};

	/**
	 * Remove a row from the table without full reload
	 */
	NestedCRUDInstance.prototype.removeRow = function(id) {
		if (!this.table || !id) {
			return false;
		}

		var found = false;
		this.table.rows().every(function(rowIdx) {
			var rowData = this.data();
			if (rowData && String(rowData.id) === String(id)) {
				this.remove();
				found = true;
				return false;
			}
		});

		if (found) {
			this.table.draw(false);
		}
		return found;
	};

	NestedCRUDInstance.prototype.create = function() {
		var self = this;
		var config = this.config;
		var nestedFormModalId = this.parentEntity + '_' + this.nestedName + '_form';
		
		// Default data includes parent key
		var defaultData = {};
		defaultData[config.parentKey] = this.parentId;

		if (Funky.FormModal) {
			Funky.FormModal.create(nestedFormModalId, defaultData);
		}
	};

	NestedCRUDInstance.prototype.edit = function(id) {
		var nestedFormModalId = this.parentEntity + '_' + this.nestedName + '_form';
		if (Funky.FormModal) {
			Funky.FormModal.edit(nestedFormModalId, id);
		}
	};

	NestedCRUDInstance.prototype.delete = function(id) {
		var self = this;
		var config = this.config;
		var entityLabel = config.entityLabel || config.entity;

		if (!confirm('Are you sure you want to delete this ' + entityLabel + '?')) {
			return;
		}

		var url = config.apiUrl + '/' + id;

		var deleteFn = Funky.Api && Funky.Api.delete ? 
			Funky.Api.delete(url) : 
			fetch(url, { method: 'DELETE' }).then(function(r) { return r.json(); });

		deleteFn
			.then(function() {
				if (Funky.Toast) {
					Funky.Toast.success(entityLabel + ' deleted successfully');
				}
				if (Funky.Announce) {
					Funky.Announce.polite(entityLabel + ' deleted');
				}
				// Reload to handle server-side pagination
				self.reload();
			})
			.catch(function(error) {
				console.error('[Funky.CRUD] Nested delete error:', error);
				if (Funky.Toast) {
					Funky.Toast.error('Failed to delete ' + entityLabel);
				}
				if (Funky.Announce) {
					Funky.Announce.assertive('Failed to delete ' + entityLabel);
				}
			});
	};

	NestedCRUDInstance.prototype.showImport = function() {
		var importModalId = this.parentEntity + '_' + this.nestedName + '_import';
		if (Funky.Import) {
			Funky.Import.show(importModalId);
		}
	};

	NestedCRUDInstance.prototype.destroy = function() {
		if (this.table) {
			this.table.destroy();
			this.table = null;
		}
		var nestedKey = this.parentEntity + '_' + this.nestedName;
		_nestedInstances.unregister(nestedKey);
	};

	/**
	 * CRUD Instance class
	 */
	function CRUDInstance(config) {
		this.config = config;
		this.table = null;
		this.data = [];

		this.init();
	}

	CRUDInstance.prototype.init = function() {
		var self = this;
		var config = this.config;

		// Initialize Stats Bar
		if (config.stats && config.statsSelector && Funky.StatsBar) {
			Funky.StatsBar.init(config.statsSelector, {
				id: config.entity + 'Stats',
				stats: config.stats
			});
		}

		// Initialize View Modal
		if (config.features.view !== false && Funky.ViewModal) {
			Funky.ViewModal.init({
				modalId: config.entity + 'ViewModal',
				entity: config.entity,
				entityLabel: config.entityLabel,
				apiUrl: config.apiUrl,
				fields: config.viewFields || config.columns.filter(function(c) { return c.data; })
					.map(function(c) {
						return { key: c.data, label: c.title || c.data, render: c.render };
					})
			});
		}

		// Initialize Form Modal
		if ((config.features.create || config.features.edit) && Funky.FormModal && (config.schema || config.schemaPath)) {
			var formModalConfig = {
				modalId: config.entity + 'Modal',
				entity: config.entity,
				entityLabel: config.entityLabel,
				schema: config.schema,
				schemaPath: config.schemaPath,
				apiUrl: config.apiUrl,
				enhanceSchema: config.enhanceSchema,
				onSave: function(result, mode) {
					// For edits, update row in-memory (row is already visible)
					// For creates, reload to handle server-side pagination/sorting
					var data = result[config.entity] || result;
					if (mode === 'edit' && data && data.id) {
						self.updateRow(data.id, data);
					} else {
						self.reload();
					}
				}
			};

			// Merge formModalOptions if provided (for enhanceSchema, onFormChange, useSelect2, etc.)
			if (config.formModalOptions) {
				Object.assign(formModalConfig, config.formModalOptions);
				// Wrap onSave to still use smart update and call original callback
				if (config.formModalOptions.onSave) {
					var originalOnSave = config.formModalOptions.onSave;
					formModalConfig.onSave = function(result, mode) {
						// For edits, update row in-memory; for creates, reload
						var data = result[config.entity] || result;
						if (mode === 'edit' && data && data.id) {
							self.updateRow(data.id, data);
						} else {
							self.reload();
						}
						// Then call original callback
						originalOnSave(result, mode);
					};
				}
			}

			Funky.FormModal.init(formModalConfig);
		}

		// Initialize Import Modal
		if (config.features.import && Funky.Import) {
			var importConfig = typeof config.features.import === 'object' ? config.features.import : {};
			// Use custom importUrl, or default to centralized import endpoint pattern
			var importUrl = importConfig.apiUrl || '/api/import/csv/' + config.entity + 's';
			Funky.Import.init({
				modalId: config.entity + 'ImportModal',
				entity: config.entity,
				entityLabel: config.entityLabel,
				apiUrl: importUrl,
				requiredFields: importConfig.requiredFields || [],
				instructions: importConfig.instructions,
				onComplete: function() {
					self.reload();
				}
			});
		}

		// Initialize DataTable
		this.initTable();

		// Setup WebSocket integration
		this.setupWebSocket();
	};

	CRUDInstance.prototype.initTable = function() {
		var self = this;
		var config = this.config;

		// Process columns
		var columns = processColumns(config.columns);
		columns = addActionsColumn(columns, config.features, config);

		// Determine table name for export URLs (defaults to entity + 's' for plural)
		var tableName = config.tableName || (config.entity + 's');

		// DataTable options
		var dtOptions = {
			tableName: tableName,
			ajaxUrl: config.apiUrl,
			columns: columns,
			order: config.order || [[0, 'desc']],
			pageLength: config.pageLength || 25,
			enableImport: !!(config.features && config.features.import),
			drawCallback: function(settings) {
				// Update stats after data load
				if (config.stats && Funky.StatsBar) {
					var data = this.api().data().toArray();
					self.data = data;
					Funky.StatsBar.compute(config.entity + 'Stats', data, config.stats);
				}

				// Call custom callback
				if (typeof config.onDraw === 'function') {
					config.onDraw.call(this, settings);
				}
			}
		};

		// Add custom updateStats callback
		if (typeof config.updateStats === 'function') {
			dtOptions.updateStats = config.updateStats;
		}

		// Merge extra options
		if (config.tableOptions) {
			Object.assign(dtOptions, config.tableOptions);
		}

		// Add extra ajax data
		if (config.extraAjaxData) {
			dtOptions.extraAjaxData = config.extraAjaxData;
		}

		// Initialize table
		if (Funky.DataTables) {
			this.table = Funky.DataTables.init(config.tableSelector, dtOptions);
		} else {
			console.warn('[Funky.CRUD] DataTables not available, using basic init');
			this.table = $(config.tableSelector).DataTable(dtOptions);
		}
	};

	CRUDInstance.prototype.setupWebSocket = function() {
		var self = this;
		var config = this.config;

		// Smart update handler - updates specific rows instead of full reload
		function handleEntityChange(action, id) {
			console.log('[Funky.CRUD] Entity change:', action, 'id:', id);

			switch (action) {
				case 'created':
					// For new records, we need to fetch and add (unless table is filtered/sorted in a way that might not include it)
					// For simplicity, just do a reload for creates as the new row needs proper positioning
					self.reload();
					break;

				case 'updated':
					// Fetch just the updated row and update in-memory
					if (id) {
						self.fetchAndUpdateRow(id);
					} else {
						self.reload();
					}
					break;

				case 'deleted':
					// Remove the row from memory if we have the ID
					if (id) {
						var removed = self.removeRow(id);
						if (!removed) {
							// Row wasn't in our table (maybe filtered out), no action needed
							console.log('[Funky.CRUD] Deleted row not in current view:', id);
						}
					} else {
						self.reload();
					}
					break;

				default:
					// Unknown action, full reload
					self.reload();
			}
		}

		// Subscribe to cache invalidation events (for CacheSync-mediated updates)
		if (Funky.CacheSync) {
			Funky.CacheSync.on('funky:cache:invalidated', function(data) {
				if (data.type === config.entity) {
					// Use smart update if we have action and id
					if (data.reason && data.id) {
						handleEntityChange(data.reason, data.id);
					} else {
						// Fallback to debounced reload for bulk invalidations
						if (self._reloadTimeout) {
							clearTimeout(self._reloadTimeout);
						}
						self._reloadTimeout = setTimeout(function() {
							self.reload();
						}, 500);
					}
				}
			});
		}

		// Direct WebSocket listener (when CacheSync is not handling it)
		if (Funky.WebSocket) {
			Funky.WebSocket.on('entity_change', function(data) {
				if (data.entity === config.entity) {
					// Use smart update with action and id from WebSocket message
					handleEntityChange(data.action, data.id);
				}
			});
		}
	};

	CRUDInstance.prototype.reload = function() {
		if (this.table) {
			this.table.ajax.reload(null, false);
		}
	};

	/**
	 * Update a single row in-memory without full table reload
	 * @param {number|string} id - The row ID
	 * @param {object} data - The updated row data
	 * @returns {boolean} Whether the row was found and updated
	 */
	CRUDInstance.prototype.updateRow = function(id, data) {
		if (!this.table || !id || !data) {
			return false;
		}

		var self = this;
		var found = false;

		// Find and update the row by ID
		this.table.rows().every(function(rowIdx) {
			var rowData = this.data();
			if (rowData && String(rowData.id) === String(id)) {
				// Merge updated data with existing row data to preserve any local-only fields
				var mergedData = Object.assign({}, rowData, data);
				this.data(mergedData);
				found = true;
				console.log('[Funky.CRUD] Row updated in-memory:', id);
				return false; // Stop iteration
			}
		});

		if (found) {
			// Redraw the table without resetting pagination
			this.table.draw(false);

			// Update stats if configured
			if (this.config.stats && Funky.StatsBar) {
				var allData = this.table.data().toArray();
				this.data = allData;
				Funky.StatsBar.compute(this.config.entity + 'Stats', allData, this.config.stats);
			}
		}

		return found;
	};

	/**
	 * Add a new row to the table without full reload
	 * @param {object} data - The new row data
	 */
	CRUDInstance.prototype.addRow = function(data) {
		if (!this.table || !data) {
			return;
		}

		// Add the new row
		this.table.row.add(data);
		this.table.draw(false);

		console.log('[Funky.CRUD] Row added in-memory:', data.id);

		// Update stats if configured
		if (this.config.stats && Funky.StatsBar) {
			var allData = this.table.data().toArray();
			this.data = allData;
			Funky.StatsBar.compute(this.config.entity + 'Stats', allData, this.config.stats);
		}
	};

	/**
	 * Remove a row from the table without full reload
	 * @param {number|string} id - The row ID to remove
	 * @returns {boolean} Whether the row was found and removed
	 */
	CRUDInstance.prototype.removeRow = function(id) {
		if (!this.table || !id) {
			return false;
		}

		var found = false;

		this.table.rows().every(function(rowIdx) {
			var rowData = this.data();
			if (rowData && String(rowData.id) === String(id)) {
				this.remove();
				found = true;
				console.log('[Funky.CRUD] Row removed in-memory:', id);
				return false;
			}
		});

		if (found) {
			this.table.draw(false);

			// Update stats if configured
			if (this.config.stats && Funky.StatsBar) {
				var allData = this.table.data().toArray();
				this.data = allData;
				Funky.StatsBar.compute(this.config.entity + 'Stats', allData, this.config.stats);
			}
		}

		return found;
	};

	/**
	 * Fetch a single row by ID and update it in the table
	 * @param {number|string} id - The row ID
	 */
	CRUDInstance.prototype.fetchAndUpdateRow = function(id) {
		var self = this;
		var config = this.config;

		if (!id) {
			return;
		}

		var url = config.apiUrl + '/' + id;

		var fetchFn = Funky.Api && Funky.Api.get ? 
			Funky.Api.get(url) : 
			fetch(url).then(function(r) { return r.json(); });

		fetchFn
			.then(function(result) {
				// API returns the entity data (might be wrapped in entity name or direct)
				var data = result[config.entity] || result;
				if (data && data.id) {
					self.updateRow(id, data);
				}
			})
			.catch(function(error) {
				console.warn('[Funky.CRUD] Failed to fetch row', id, ':', error);
				// Fallback to full reload on fetch error
				self.reload();
			});
	};

	CRUDInstance.prototype.create = function(defaultData) {
		if (Funky.FormModal) {
			Funky.FormModal.create(this.config.entity + 'Modal', defaultData);
		}
	};

	CRUDInstance.prototype.edit = function(id) {
		if (Funky.FormModal) {
			Funky.FormModal.edit(this.config.entity + 'Modal', id);
		}
	};

	CRUDInstance.prototype.view = function(id) {
		if (Funky.ViewModal) {
			Funky.ViewModal.show(this.config.entity + 'ViewModal', id);
		}
	};

	CRUDInstance.prototype.delete = function(id) {
		var self = this;
		var config = this.config;
		var entityLabel = config.entityLabel || config.entity;

		// Confirm deletion
		if (!confirm('Are you sure you want to delete this ' + entityLabel + '?')) {
			return;
		}

		var url = config.apiUrl + '/' + id;

		var deleteFn = Funky.Api && Funky.Api.delete ? 
			Funky.Api.delete(url) : 
			fetch(url, { method: 'DELETE' }).then(function(r) { return r.json(); });

		deleteFn
			.then(function() {
				// Invalidate cache
				if (Funky.Cache) {
					Funky.Cache.invalidate(config.entity, id);
					Funky.Cache.clear(config.entity);
				}

				// Show toast
				if (Funky.Toast) {
					Funky.Toast.success(entityLabel + ' deleted successfully');
				}

				// Announce for screen readers
				if (Funky.Announce) {
					Funky.Announce.polite(entityLabel + ' deleted');
				}

				// Reload to handle server-side pagination (fetch next row to fill page)
				self.reload();

				// Call callback
				if (typeof config.onDelete === 'function') {
					config.onDelete(id);
				}
			})
			.catch(function(error) {
				console.error('[Funky.CRUD] Delete error:', error);
				if (Funky.Toast) {
					Funky.Toast.error('Failed to delete ' + entityLabel);
				}
				if (Funky.Announce) {
					Funky.Announce.assertive('Failed to delete ' + entityLabel);
				}
			});
	};

	CRUDInstance.prototype.showImport = function() {
		if (Funky.Import) {
			Funky.Import.show(this.config.entity + 'ImportModal');
		}
	};

	CRUDInstance.prototype.getData = function() {
		return this.data;
	};

	CRUDInstance.prototype.getTable = function() {
		return this.table;
	};

	CRUDInstance.prototype.destroy = function() {
		// Cleanup
		if (this.table) {
			this.table.destroy();
		}

		if (Funky.StatsBar) {
			Funky.StatsBar.destroy(this.config.entity + 'Stats');
		}

		_instances.unregister(this.config.entity);
	};

	var CRUD = {
		/**
		 * Initialize a CRUD controller
		 * @param {object} config - Configuration
		 * @param {string} config.entity - Entity type name
		 * @param {string} config.entityLabel - Display label
		 * @param {string} config.apiUrl - API endpoint base URL
		 * @param {string} config.tableSelector - DataTable selector
		 * @param {object} [config.schema] - JSON Schema for forms (direct)
		 * @param {string} [config.schemaPath] - Schema path in OpenAPI spec (e.g., 'CreateClient')
		 * @param {function} [config.enhanceSchema] - Function to enhance schema dynamically
		 * @param {Array} config.columns - DataTable column definitions
		 * @param {object} config.features - Feature flags (create, edit, delete, view, import, audit)
		 * @param {Array} [config.stats] - Stats bar configuration
		 * @param {string} [config.statsSelector] - Stats container selector
		 * @returns {CRUDInstance}
		 */
		init: function(config) {
			if (!config || !config.entity) {
				console.error('[Funky.CRUD] entity is required');
				return null;
			}

			// Set defaults
			config.features = config.features || { create: true, edit: true, delete: true, view: true };

			// Create instance
			var instance = new CRUDInstance(config);
			_instances.register(config.entity, instance);

			return instance;
		},

		/**
		 * Get a CRUD instance by entity name
		 * @param {string} entity - Entity name
		 * @returns {CRUDInstance|null}
		 */
		get: function(entity) {
			return _instances.get(entity);
		},

		/**
		 * Get instance by entity name (alias for get)
		 * @param {string} entity - Entity name
		 * @returns {CRUDInstance|null}
		 */
		getInstance: function(entity) {
			return _instances.get(entity);
		},

		/**
		 * Create new entity
		 * @param {string} entity - Entity name
		 * @param {object} [defaultData] - Default values
		 */
		create: function(entity, defaultData) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.create(defaultData);
			}
		},

		/**
		 * Edit entity
		 * @param {string} entity - Entity name
		 * @param {number|string} id - Entity ID
		 */
		edit: function(entity, id) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.edit(id);
			}
		},

		/**
		 * View entity
		 * @param {string} entity - Entity name
		 * @param {number|string} id - Entity ID
		 */
		view: function(entity, id) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.view(id);
			}
		},

		/**
		 * Delete entity
		 * @param {string} entity - Entity name
		 * @param {number|string} id - Entity ID
		 */
		delete: function(entity, id) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.delete(id);
			}
		},

		/**
		 * Show import modal
		 * @param {string} entity - Entity name
		 */
		showImport: function(entity) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.showImport();
			}
		},

		/**
		 * Reload table data (full server fetch)
		 * @param {string} entity - Entity name
		 */
		reload: function(entity) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.reload();
			}
		},

		/**
		 * Update a single row in-memory (no server fetch)
		 * @param {string} entity - Entity name
		 * @param {number|string} id - Row ID
		 * @param {object} data - Updated row data
		 * @returns {boolean} Whether the row was found and updated
		 */
		updateRow: function(entity, id, data) {
			var instance = _instances.get(entity);
			if (instance) {
				return instance.updateRow(id, data);
			}
			return false;
		},

		/**
		 * Add a new row in-memory (no server fetch)
		 * @param {string} entity - Entity name
		 * @param {object} data - New row data
		 */
		addRow: function(entity, data) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.addRow(data);
			}
		},

		/**
		 * Remove a row in-memory (no server fetch)
		 * @param {string} entity - Entity name
		 * @param {number|string} id - Row ID
		 * @returns {boolean} Whether the row was found and removed
		 */
		removeRow: function(entity, id) {
			var instance = _instances.get(entity);
			if (instance) {
				return instance.removeRow(id);
			}
			return false;
		},

		/**
		 * Fetch a single row from server and update in table
		 * @param {string} entity - Entity name
		 * @param {number|string} id - Row ID
		 */
		fetchAndUpdateRow: function(entity, id) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.fetchAndUpdateRow(id);
			}
		},

		/**
		 * Destroy instance
		 * @param {string} entity - Entity name
		 */
		destroy: function(entity) {
			var instance = _instances.get(entity);
			if (instance) {
				instance.destroy();
			}
		},

		/**
		 * Destroy all CRUD instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
			_nestedInstances.destroyAll();
		},

		/**
		 * Open a nested CRUD modal
		 * @param {string} parentEntity - Parent entity name
		 * @param {string} nestedName - Nested CRUD name (key in nested config)
		 * @param {object} parentRow - Parent row data
		 */
		openNested: function(parentEntity, nestedName, parentRow) {
			var parentInstance = _instances.get(parentEntity);
			if (!parentInstance) {
				console.error('[Funky.CRUD] Parent instance not found:', parentEntity);
				return;
			}

			var nestedConfig = parentInstance.config.nested && parentInstance.config.nested[nestedName];
			if (!nestedConfig) {
				console.error('[Funky.CRUD] Nested config not found:', nestedName);
				return;
			}

			// Destroy existing nested instance if any
			var nestedKey = parentEntity + '_' + nestedName;
			if (_nestedInstances.get(nestedKey)) {
				_nestedInstances.get(nestedKey).destroy();
			}

			// Create new nested instance
			var nestedInstance = new NestedCRUDInstance(parentEntity, nestedName, nestedConfig, parentRow);
			nestedInstance.show();
		},

		/**
		 * Get nested instance
		 * @param {string} parentEntity - Parent entity name
		 * @param {string} nestedName - Nested CRUD name
		 * @returns {NestedCRUDInstance|null}
		 */
		getNested: function(parentEntity, nestedName) {
			var nestedKey = parentEntity + '_' + nestedName;
			return _nestedInstances.get(nestedKey) || null;
		},

		/**
		 * Route action to nested instance if applicable
		 * Used by global action handlers
		 * @param {string} entity - Entity type
		 * @param {string} action - Action name (edit, delete, view)
		 * @param {number|string} id - Entity ID
		 */
		routeNestedAction: function(entity, action, id) {
			var nestedKey = nestedParentMap[entity];
			if (nestedKey && _nestedInstances.get(nestedKey)) {
				var inst = _nestedInstances.get(nestedKey);
				if (typeof inst[action] === 'function') {
					inst[action](id);
					return true;
				}
			}
			return false;
		}
	};

	// Setup global action handlers that route to correct instance
	window.viewRow = function(id) {
		// Check nested instances first
		for (var key in nestedInstances) {
			if (_nestedInstances.get(key).table) {
				var data = _nestedInstances.get(key).table.data().toArray();
				var found = data.find(function(row) { return row.id === id; });
				if (found) {
					// View in nested context - use parent's ViewModal for now
					// TODO: Could add nested-specific view modal
					return;
				}
			}
		}
		// Fall back to main instance
		var inst = findInstanceForId(id);
		if (inst && Funky.ViewModal) {
			Funky.ViewModal.show(inst.config.entity + 'ViewModal', id);
		}
	};

	window.editRow = function(id) {
		// Check nested instances first
		for (var key in nestedInstances) {
			if (_nestedInstances.get(key).table) {
				var data = _nestedInstances.get(key).table.data().toArray();
				var found = data.find(function(row) { return row.id === id; });
				if (found) {
					_nestedInstances.get(key).edit(id);
					return;
				}
			}
		}
		// Fall back to main instance
		var inst = findInstanceForId(id);
		if (inst && Funky.FormModal) {
			Funky.FormModal.edit(inst.config.entity + 'Modal', id);
		}
	};

	window.deleteRow = function(id) {
		// Check nested instances first
		for (var key in nestedInstances) {
			if (_nestedInstances.get(key).table) {
				var data = _nestedInstances.get(key).table.data().toArray();
				var found = data.find(function(row) { return row.id === id; });
				if (found) {
					_nestedInstances.get(key).delete(id);
					return;
				}
			}
		}
		// Fall back to main instance
		var inst = findInstanceForId(id);
		if (inst) {
			inst.delete(id);
		}
	};

	window.showAudit = function(id) {
		var inst = findInstanceForId(id);
		if (inst) {
			// Navigate to audit entity page using tableName (plural) or entity + 's'
			var tableName = inst.config.tableName || (inst.config.entity + 's');
			var url = '/audit_logs/entity/' + tableName + '/' + id;
			// Use SPA navigation if available
			if (Funky.SPA && Funky.SPA.navigate) {
				Funky.SPA.navigate(url);
			} else {
				window.location.href = url;
			}
		}
	};

	// Register with Funky namespace
	Funky.register('CRUD', CRUD);

	console.log('[Funky.CRUD] Initialized v1.3.0 with nested CRUD support');

})(window);
