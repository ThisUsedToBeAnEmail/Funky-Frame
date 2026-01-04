/**
 * Funky.Form - Native form component
 *
 * Schema-agnostic form rendering with Bindable interface.
 * Supports native schema, OpenAPI adapters, and plain field arrays.
 *
 * @module Funky.Form
 * @version 1.0.1
 * @requires Funky.Dom
 */
(function(global) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('Form')) {
		return;
	}

	var D = global.Funky && global.Funky.Dom;
	var E = global.Funky && global.Funky.Events;
	var PubSub = global.Funky && global.Funky.PubSub;

	if (!D) {
		console.error('[Funky.Form] Funky.Dom is required');
		return;
	}

	// =========================================================================
	// DEFAULT CONFIGURATION
	// =========================================================================

	var DEFAULTS = {
		// Schema sources (use one)
		schema: null,           // Native schema definition
		schemaPath: null,       // Path to load from Funky.Schema
		fields: null,           // Simple field array

		// Initial data
		data: {},

		// Mode
		mode: 'create',         // 'create' | 'edit' | 'view'

		// Validation behavior
		validateOnChange: true,
		validateOnBlur: true,
		showErrorsInline: true,

		// Form behavior
		submitOnEnter: false,
		disabled: false,
		readonly: false,

		// Callbacks
		onChange: null,
		onSubmit: null,
		onError: null,
		onReset: null,
		onInit: null
	};

	// Instance registry
	var _instances = {};
	var _instanceCounter = 0;

	// =========================================================================
	// FORM INSTANCE
	// =========================================================================

	/**
	 * FormInstance constructor
	 * @param {HTMLElement} container - Container element
	 * @param {Object} options - Configuration options
	 */
	function FormInstance(container, options) {
		this.id = options.id || 'funky-form-' + (++_instanceCounter);
		// Ensure container is always a Funky.Dom wrapper
		if (typeof container === 'string') {
			this.container = D.one(container);
		} else if (container && container.el) {
			// Already wrapped
			this.container = container;
		} else {
			// Native DOM element - wrap it
			this.container = D.one(container);
		}
		this.options = Object.assign({}, DEFAULTS, options);

		// State
		this._schema = null;
		this._data = Object.assign({}, this.options.data || {});
		this._initialData = Object.assign({}, this._data);
		this._fields = {};
		this._errors = {};
		this._dirty = false;
		this._initialized = false;
		this._isSubmitting = false;

		// DOM refs
		this._formEl = null;
		this._bodyEl = null;
		this._footerEl = null;

		// Store instance in registry
		_instances[this.id] = this;
		if (this.container) {
			// Set on raw DOM element for getInstance() lookup
			var containerEl = this.container.el || this.container;
			containerEl._funkyFormInstance = this;
		}

		// Initialize
		this._init();
	}

	// =========================================================================
	// INITIALIZATION
	// =========================================================================

	FormInstance.prototype._init = function() {
		if (!this.container) {
			console.error('[Funky.Form] Container not found');
			return;
		}

		// Parse schema from various sources
		this._parseSchema();

		// Render form structure
		this._render();

		// Mark as initialized
		this._initialized = true;

		// Emit init event
		this._emit('init', { form: this });
	};

	/**
	 * Parse schema from options (schema, schemaPath, or fields)
	 */
	FormInstance.prototype._parseSchema = function() {
		var options = this.options;

		// Native schema provided directly
		if (options.schema) {
			this._schema = this._normalizeSchema(options.schema);
			return;
		}

		// Simple fields array
		if (options.fields) {
			this._schema = this._fieldsArrayToSchema(options.fields);
			return;
		}

		// schemaPath requires async loading - handled by Form.create()
		// If we get here without schema, use empty
		if (!options.schemaPath) {
			this._schema = { fields: {} };
		}
	};

	/**
	 * Normalize schema to standard format
	 */
	FormInstance.prototype._normalizeSchema = function(schema) {
		// If schema has fields property, it's already in native format
		if (schema.fields) {
			return schema;
		}

		// Try using SchemaAdapter if available
		var SchemaAdapter = global.Funky && global.Funky.SchemaAdapter;
		if (SchemaAdapter && SchemaAdapter.convert) {
			return SchemaAdapter.convert(schema);
		}

		// Assume it's a fields object directly
		return { fields: schema };
	};

	/**
	 * Convert simple fields array to schema
	 */
	FormInstance.prototype._fieldsArrayToSchema = function(fields) {
		var schema = { fields: {} };

		fields.forEach(function(field) {
			var name = field.name || field.id;
			if (!name) {
				console.warn('[Funky.Form] Field missing name:', field);
				return;
			}

			schema.fields[name] = Object.assign({}, field, {
				name: name,
				type: field.type || 'text'
			});
		});

		return schema;
	};

	// =========================================================================
	// RENDERING
	// =========================================================================

	/**
	 * Render form structure
	 */
	FormInstance.prototype._render = function() {
		// Create form element
		this._formEl = D.create('form', {
			className: 'funky-form',
			id: this.id,
			attrs: {
				'data-funky-form-id': this.id,
				novalidate: true // We handle validation
			}
		});

		// Prevent native form submission
		var self = this;
		this._formEl.on('submit', function(e) {
			e.preventDefault();
			self.submit();
		});

		// Initialize all field instances first (before layout)
		this._initializeFields();

		// Render layout (creates _bodyEl and arranges fields)
		this._bodyEl = this._renderLayout();
		this._formEl.append(this._bodyEl);

		// Append to container
		this.container.append(this._formEl);

		// Apply mode
		if (this.options.mode === 'view') {
			this._setReadonly(true);
			this._formEl.classAdd('funky-form--view-mode');
		}
		if (this.options.mode === 'edit') {
			this._formEl.classAdd('funky-form--edit-mode');
		}
		if (this.options.disabled) {
			this._setDisabled(true);
		}

		// Evaluate initial field dependencies
		this._evaluateDependencies();
	};

	/**
	 * Initialize all field instances (without appending to DOM)
	 */
	FormInstance.prototype._initializeFields = function() {
		var self = this;
		var schema = this._schema;

		if (!schema || !schema.fields) return;

		var fieldOrder = schema.fieldOrder || Object.keys(schema.fields);

		fieldOrder.forEach(function(fieldName) {
			var fieldDef = schema.fields[fieldName];
			if (!fieldDef) return;

			self._initializeField(fieldName, fieldDef);
		});
	};

	/**
	 * Initialize a single field instance
	 */
	FormInstance.prototype._initializeField = function(name, fieldDef) {
		var FieldRegistry = global.Funky && global.Funky.Form && global.Funky.Form.FieldRegistry;

		// Store field definition
		this._fields[name] = {
			name: name,
			config: Object.assign({ name: name }, fieldDef),
			element: null,
			instance: null,
			visible: fieldDef.visible !== false,
			enabled: fieldDef.disabled !== true
		};

		// If FieldRegistry available, use it
		if (FieldRegistry && FieldRegistry.has(fieldDef.type)) {
			console.log('[Form._initializeField] Creating field via FieldRegistry:', name, 'type:', fieldDef.type);
			var fieldInstance = FieldRegistry.create(fieldDef.type, this._fields[name].config, this);
			console.log('[Form._initializeField] Field instance:', fieldInstance);
			this._fields[name].instance = fieldInstance;
			this._fields[name].element = fieldInstance.render();
			console.log('[Form._initializeField] Field element:', this._fields[name].element);

			// Set initial value if present
			if (this._data[name] !== undefined) {
				fieldInstance.setValue(this._data[name], { silent: true });
			}
			return;
		}

		console.log('[Form._initializeField] Fallback for field:', name, 'type:', fieldDef.type);
		// Fallback: render basic input
		var fieldEl = this._renderBasicField(name, fieldDef);
		this._fields[name].element = fieldEl;
	};

	// =========================================================================
	// LAYOUT SYSTEM
	// =========================================================================

	/**
	 * Render form layout
	 * @returns {HTMLElement} Form body element
	 */
	FormInstance.prototype._renderLayout = function() {
		var layout = this._schema.layout;

		if (!layout) {
			return this._renderLinearLayout();
		}

		switch (layout.type) {
			case 'sections':
				return this._renderSectionsLayout(layout);
			case 'columns':
				return this._renderColumnsLayout(layout);
			case 'grid':
				return this._renderGridLayout(layout);
			case 'fieldsets':
				return this._renderFieldsetsLayout(layout);
			case 'tabs':
				return this._renderTabsLayout(layout);
			default:
				return this._renderLinearLayout();
		}
	};

	/**
	 * Linear layout - fields rendered in order (default)
	 */
	FormInstance.prototype._renderLinearLayout = function() {
		var container = D.create('div', { className: 'funky-form-body' });
		var fieldOrder = this._schema.fieldOrder || Object.keys(this._schema.fields);
		var self = this;

		fieldOrder.forEach(function(fieldName) {
			var fieldDef = self._fields[fieldName];
			if (fieldDef && fieldDef.element) {
				container.append(fieldDef.element);
			}
		});

		return container;
	};

	/**
	 * Sections layout - collapsible groups
	 */
	FormInstance.prototype._renderSectionsLayout = function(layout) {
		var container = D.create('div', { className: 'funky-form-body funky-form-sections' });
		var self = this;

		layout.sections.forEach(function(section, index) {
			var sectionId = section.id || 'section-' + index;

			var sectionEl = D.create('div', {
				className: 'funky-form-section',
				attrs: { 'data-section-id': sectionId }
			});

			// Section header
			var header = D.create('div', {
				className: 'funky-form-section-header',
				attrs: {
					'aria-expanded': section.collapsed ? 'false' : 'true',
					'aria-controls': sectionId + '-content'
				}
			});

			// Icon
			if (section.icon) {
				var icon = D.create('i', {
					className: 'funky-form-section-icon ' + section.icon
				});
				header.append(icon);
			}

			// Title
			var title = D.create('span', {
				className: 'funky-form-section-title'
			}).text(section.title);
			header.append(title);

			// Collapsible toggle
			if (section.collapsible !== false) {
				var toggle = D.create('i', {
					className: 'funky-form-section-toggle fas fa-chevron-down'
				});
				header.append(toggle);

				header.classAdd('funky-form-section-header--collapsible');
				header.attr('role', 'button');
				header.attr('tabindex', '0');

				header.on('click', function() {
					self._toggleSection(sectionEl);
				});

				header.on('keydown', function(e) {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						self._toggleSection(sectionEl);
					}
				});
			}

			sectionEl.append(header);

			// Section content
			var content = D.create('div', {
				className: 'funky-form-section-content',
				id: sectionId + '-content'
			});

			if (section.collapsed) {
				content.style('display', 'none');
				sectionEl.classAdd('funky-form-section--collapsed');
			}

			// Render fields in section (with optional nested layout)
			if (section.layout) {
				var nestedContainer = self._renderNestedLayout(section.layout, section.fields);
				content.append(nestedContainer);
			} else {
				section.fields.forEach(function(fieldName) {
					var fieldDef = self._fields[fieldName];
					if (fieldDef && fieldDef.element) {
						content.append(fieldDef.element);
					}
				});
			}

			sectionEl.append(content);
			container.append(sectionEl);
		});

		return container;
	};

	/**
	 * Toggle section collapse state
	 */
	FormInstance.prototype._toggleSection = function(sectionEl) {
		var content = sectionEl.one('.funky-form-section-content');
		var header = sectionEl.one('.funky-form-section-header');
		var isCollapsed = sectionEl.classHas('funky-form-section--collapsed');

		if (isCollapsed) {
			content.style('display', '');
			sectionEl.classRemove('funky-form-section--collapsed');
			header.attr('aria-expanded', 'true');
		} else {
			content.style('display', 'none');
			sectionEl.classAdd('funky-form-section--collapsed');
			header.attr('aria-expanded', 'false');
		}

		this._emit('section:toggle', {
			sectionId: sectionEl.attr('data-section-id'),
			collapsed: !isCollapsed
		});
	};

	/**
	 * Expand a section by ID
	 */
	FormInstance.prototype.expandSection = function(sectionId) {
		var sectionEl = this._formEl.one('[data-section-id="' + sectionId + '"]');
		if (sectionEl && sectionEl.classHas('funky-form-section--collapsed')) {
			this._toggleSection(sectionEl);
		}
	};

	/**
	 * Collapse a section by ID
	 */
	FormInstance.prototype.collapseSection = function(sectionId) {
		var sectionEl = this._formEl.one('[data-section-id="' + sectionId + '"]');
		if (sectionEl && !sectionEl.classHas('funky-form-section--collapsed')) {
			this._toggleSection(sectionEl);
		}
	};

	/**
	 * Columns layout - CSS grid multi-column
	 */
	FormInstance.prototype._renderColumnsLayout = function(layout) {
		var columns = layout.columns || 2;
		var container = D.create('div', {
			className: 'funky-form-body funky-form-columns funky-form-columns--' + columns
		});
		container.style({
			display: 'grid',
			gridTemplateColumns: 'repeat(' + columns + ', 1fr)',
			gap: 'var(--funky-form-gap, 1rem)'
		});

		// Use layout.fields, schema.fieldOrder, or schema.fields keys
		var fields = layout.fields || this._schema.fieldOrder || Object.keys(this._schema.fields);
		var self = this;

		fields.forEach(function(fieldName) {
			var fieldDef = self._fields[fieldName];
			if (fieldDef && fieldDef.element) {
				container.append(fieldDef.element);
			}
		});

		return container;
	};

	/**
	 * Grid layout - explicit rows with custom widths
	 */
	FormInstance.prototype._renderGridLayout = function(layout) {
		var container = D.create('div', { className: 'funky-form-body funky-form-grid' });
		var self = this;

		layout.rows.forEach(function(row) {
			var rowEl = D.create('div', { className: 'funky-form-row row' });

			row.fields.forEach(function(fieldName, index) {
				var fieldDef = self._fields[fieldName];
				if (!fieldDef || !fieldDef.element) return;

				// Calculate column width (Bootstrap grid: 12 columns)
				var width = Math.floor(12 / row.fields.length);
				if (row.widths && row.widths[index] !== undefined) {
					width = row.widths[index];
				}

				var col = D.create('div', {
					className: 'funky-form-col col-md-' + width
				});
				col.append(fieldDef.element);
				rowEl.append(col);
			});

			container.append(rowEl);
		});

		return container;
	};

	/**
	 * Fieldsets layout - HTML fieldset groups with legends
	 */
	FormInstance.prototype._renderFieldsetsLayout = function(layout) {
		var container = D.create('div', { className: 'funky-form-body funky-form-fieldsets' });
		var self = this;

		layout.fieldsets.forEach(function(fs) {
			var fieldset = D.create('fieldset', { className: 'funky-form-fieldset' });

			var legend = D.create('legend', { className: 'funky-form-legend' }).text(fs.legend);
			fieldset.append(legend);

			fs.fields.forEach(function(fieldName) {
				var fieldDef = self._fields[fieldName];
				if (fieldDef && fieldDef.element) {
					fieldset.append(fieldDef.element);
				}
			});

			container.append(fieldset);
		});

		return container;
	};

	/**
	 * Tabs layout - self-contained tab implementation
	 * Note: We don't use Funky.Tabbed here because it requires elements to be
	 * in the DOM before init, but form layout is built before DOM insertion.
	 */
	FormInstance.prototype._renderTabsLayout = function(layout) {
		var container = D.create('div', { className: 'funky-form-body funky-form-tabs' });
		var self = this;

		var tabsId = this.id + '-tabs';
		var contentId = this.id + '-tab-content';

		// Create tab list
		var tabsList = D.create('ul', {
			className: 'nav nav-tabs funky-form-tab-list',
			id: tabsId,
			attrs: { role: 'tablist' }
		});

		// Create content container
		var contentContainer = D.create('div', {
			className: 'tab-content funky-form-tab-content',
			id: contentId
		});

		container.append(tabsList);
		container.append(contentContainer);

		// Build tabs with our own implementation
		layout.tabs.forEach(function(tab, index) {
			var isActive = index === 0;

			// Tab button
			var li = D.create('li', { className: 'nav-item' });
			li.attr('role', 'presentation');

			var button = D.create('button', {
				className: 'nav-link' + (isActive ? ' active' : ''),
				id: tab.id + '-tab',
				attrs: {
					type: 'button',
					role: 'tab',
					'aria-controls': tab.id,
					'aria-selected': isActive ? 'true' : 'false',
					'data-bs-toggle': 'tab',
					'data-bs-target': '#' + tab.id
				}
			}).text(tab.label);

			button.on('click', function() {
				self._switchTab(tabsId, tab.id);
			});

			li.append(button);
			tabsList.append(li);

			// Tab pane
			var pane = D.create('div', {
				className: 'tab-pane fade' + (isActive ? ' show active' : ''),
				id: tab.id,
				attrs: {
					role: 'tabpanel',
					'aria-labelledby': tab.id + '-tab'
				}
			});

			tab.fields.forEach(function(fieldName) {
				var fieldDef = self._fields[fieldName];
				if (fieldDef && fieldDef.element) {
					pane.append(fieldDef.element);
				}
			});

			contentContainer.append(pane);
		});

		return container;
	};

	/**
	 * Switch to a tab (fallback mode without Bootstrap JS)
	 */
	FormInstance.prototype._switchTab = function(tabsId, tabId) {
		var tabsList = this._formEl.one('#' + tabsId);
		if (!tabsList) return;
		var contentContainer = D.one(tabsList.el.nextElementSibling);

		// Deactivate all tabs
		tabsList.find('.nav-link').each(function(link) {
			link.classRemove('active');
			link.attr('aria-selected', 'false');
		});

		// Deactivate all panes
		contentContainer.find('.tab-pane').each(function(pane) {
			pane.classRemove('show', 'active');
		});

		// Activate selected tab
		var selectedTab = tabsList.one('#' + tabId + '-tab');
		if (selectedTab) {
			selectedTab.classAdd('active');
			selectedTab.attr('aria-selected', 'true');
		}

		// Activate selected pane
		var selectedPane = contentContainer.one('#' + tabId);
		if (selectedPane) {
			selectedPane.classAdd('show', 'active');
		}

		this._emit('tab:change', { tabId: tabId });
	};

	/**
	 * Render nested layout (for sections with columns)
	 */
	FormInstance.prototype._renderNestedLayout = function(layout, fieldNames) {
		var container;

		switch (layout.type) {
			case 'columns':
				var columns = layout.columns || 2;
				container = D.create('div', {
					className: 'funky-form-columns funky-form-columns--' + columns
				});
				container.style({
					display: 'grid',
					gridTemplateColumns: 'repeat(' + columns + ', 1fr)',
					gap: 'var(--funky-form-gap, 1rem)'
				});
				break;

			case 'grid':
				container = D.create('div', { className: 'funky-form-grid' });
				var self = this;
				layout.rows.forEach(function(row) {
					var rowEl = D.create('div', { className: 'funky-form-row row' });
					row.fields.forEach(function(fieldName, index) {
						var fieldDef = self._fields[fieldName];
						if (!fieldDef || !fieldDef.element) return;
						var width = Math.floor(12 / row.fields.length);
						if (row.widths && row.widths[index] !== undefined) {
							width = row.widths[index];
						}
						var col = D.create('div', { className: 'funky-form-col col-md-' + width });
						col.append(fieldDef.element);
						rowEl.append(col);
					});
					container.append(rowEl);
				});
				return container;

			default:
				container = D.create('div', { className: 'funky-form-fields' });
		}

		// For columns layout, append fields
		if (layout.type === 'columns') {
			var self = this;
			fieldNames.forEach(function(fieldName) {
				var fieldDef = self._fields[fieldName];
				if (fieldDef && fieldDef.element) {
					container.append(fieldDef.element);
				}
			});
		}

		return container;
	};

	/**
	 * Render basic field (Phase 1 fallback before FieldRegistry)
	 */
	FormInstance.prototype._renderBasicField = function(name, fieldDef) {
		var self = this;
		var fieldId = this.id + '-' + name;

		// Field wrapper
		var wrapper = D.create('div', {
			className: 'funky-form-field funky-form-field--' + (fieldDef.type || 'text'),
			attrs: { 'data-field': name }
		});

		// Label
		if (fieldDef.label !== false) {
			var label = D.create('label', {
				className: 'funky-form-label',
				attrs: { for: fieldId }
			}).text(fieldDef.label || this._humanize(name));
			if (fieldDef.required) {
				var req = D.create('span', {
					className: 'funky-form-required',
					attrs: { 'aria-hidden': 'true' }
				}).text(' *');
				label.append(req);
			}
			wrapper.append(label);
		}

		// Input wrapper
		var inputWrapper = D.create('div', {
			className: 'funky-form-input-wrapper'
		});

		// Create input based on type
		var input = this._createBasicInput(name, fieldDef, fieldId);
		inputWrapper.append(input);
		wrapper.append(inputWrapper);

		// Help text
		if (fieldDef.help) {
			var help = D.create('div', {
				className: 'funky-form-help',
				id: fieldId + '-help'
			}).text(fieldDef.help);
			wrapper.append(help);
		}

		// Error container
		var errors = D.create('div', {
			className: 'funky-form-errors',
			id: fieldId + '-error',
			attrs: {
				role: 'alert',
				'aria-live': 'polite'
			}
		});
		errors.style('display', 'none');
		wrapper.append(errors);

		// Store refs
		this._fields[name].inputEl = input;
		this._fields[name].errorEl = errors;

		return wrapper;
	};

	/**
	 * Create basic input element
	 */
	FormInstance.prototype._createBasicInput = function(name, fieldDef, fieldId) {
		var self = this;
		var type = fieldDef.type || 'text';
		var input;

		// Map types to input types
		var inputTypeMap = {
			text: 'text',
			email: 'email',
			password: 'password',
			tel: 'tel',
			url: 'url',
			number: 'number',
			date: 'date',
			datetime: 'datetime-local',
			time: 'time',
			hidden: 'hidden'
		};

		if (type === 'textarea') {
			input = D.create('textarea', {
				className: 'funky-form-input funky-form-textarea form-control',
				id: fieldId,
				attrs: {
					name: name,
					rows: fieldDef.rows || 4,
					placeholder: fieldDef.placeholder || ''
				}
			});
		} else if (type === 'checkbox') {
			input = D.create('input', {
				className: 'funky-form-checkbox form-check-input',
				id: fieldId,
				attrs: {
					type: 'checkbox',
					name: name
				}
			});
		} else if (type === 'select') {
			input = D.create('select', {
				className: 'funky-form-input funky-form-select form-control form-select',
				id: fieldId,
				attrs: { name: name }
			});

			// Add options
			if (fieldDef.placeholder) {
				var placeholder = D.create('option', { attrs: { value: '' } }).text(fieldDef.placeholder);
				input.append(placeholder);
			}

			(fieldDef.options || []).forEach(function(opt) {
				var optValue = typeof opt === 'object' ? opt.value : opt;
				var optLabel = typeof opt === 'object' ? opt.label : opt;
				var option = D.create('option', { attrs: { value: optValue } }).text(optLabel);
				input.append(option);
			});
		} else {
			// Standard input
			input = D.create('input', {
				className: 'funky-form-input form-control',
				id: fieldId,
				attrs: {
					type: inputTypeMap[type] || 'text',
					name: name,
					placeholder: fieldDef.placeholder || ''
				}
			});

			// Number constraints - access raw DOM element via .el
			if (type === 'number') {
				if (fieldDef.min !== undefined) input.el.min = fieldDef.min;
				if (fieldDef.max !== undefined) input.el.max = fieldDef.max;
				if (fieldDef.step !== undefined) input.el.step = fieldDef.step;
			}

			// String constraints - access raw DOM element via .el
			if (fieldDef.minLength) input.el.minLength = fieldDef.minLength;
			if (fieldDef.maxLength) input.el.maxLength = fieldDef.maxLength;
			if (fieldDef.pattern) input.el.pattern = fieldDef.pattern;
		}

		// Common attributes - access raw DOM element via .el
		if (fieldDef.required) input.el.required = true;
		if (fieldDef.disabled || this.options.disabled) input.el.disabled = true;
		if (fieldDef.readonly || this.options.readonly) input.el.readOnly = true;

		// ARIA
		var ariaDescribedBy = [];
		if (fieldDef.help) ariaDescribedBy.push(fieldId + '-help');
		ariaDescribedBy.push(fieldId + '-error');
		input.attr('aria-describedby', ariaDescribedBy.join(' '));

		// Set initial value - access raw DOM element via .el
		if (this._data[name] !== undefined) {
			if (type === 'checkbox') {
				input.el.checked = !!this._data[name];
			} else {
				input.el.value = this._data[name];
			}
		}

		// Event listeners
		var eventType = (type === 'checkbox' || type === 'select') ? 'change' : 'input';
		input.on(eventType, function() {
			var value = type === 'checkbox' ? this.checked : this.value;
			if (type === 'number' && value !== '') {
				value = parseFloat(value);
			}
			self._onFieldChange(name, value);
		});

		if (this.options.validateOnBlur) {
			input.on('blur', function() {
				self._validateField(name);
			});
		}

		return input;
	};

	/**
	 * Convert field name to human label
	 */
	FormInstance.prototype._humanize = function(str) {
		return str
			.replace(/_/g, ' ')
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/^./, function(c) { return c.toUpperCase(); });
	};

	// =========================================================================
	// BINDABLE INTERFACE (LiveBinding Compatible)
	// =========================================================================

	/**
	 * Set multiple form values
	 * @param {Object} data - Key-value pairs
	 */
	FormInstance.prototype.setData = function(data) {
		if (!data || typeof data !== 'object') return;

		var self = this;
		Object.keys(data).forEach(function(key) {
			self._setFieldValue(key, data[key], { silent: true });
		});

		// Emit single change event
		this._emit('change', { data: this._data });
	};

	/**
	 * Get all form values
	 * @returns {Object}
	 */
	FormInstance.prototype.getData = function() {
		return Object.assign({}, this._data);
	};

	/**
	 * Add/set single value
	 * @param {string} key
	 * @param {*} value
	 */
	FormInstance.prototype.addData = function(key, value) {
		// Support both addData({ key: value }) and addData('key', value) signatures
		if (typeof key === 'object' && key !== null) {
			var data = key;
			for (var k in data) {
				if (data.hasOwnProperty(k)) {
					this._setFieldValue(k, data[k]);
				}
			}
		} else {
			this._setFieldValue(key, value);
		}
	};

	/**
	 * Remove value and clear field
	 * @param {string} key
	 */
	FormInstance.prototype.removeData = function(key) {
		// Delete the key so getData().key returns undefined
		delete this._data[key];
		// Clear the field UI
		var field = this._fields[key];
		if (field) {
			if (field.instance && field.instance.setValue) {
				field.instance.setValue(null, { silent: true });
			} else if (field.inputEl) {
				var inputElement = field.inputEl.el || field.inputEl;
				inputElement.value = '';
			}
		}
	};

	// =========================================================================
	// FIELD OPERATIONS
	// =========================================================================

	/**
	 * Set single field value
	 * @param {string} name
	 * @param {*} value
	 */
	FormInstance.prototype.setFieldValue = function(name, value) {
		this._setFieldValue(name, value);
	};

	/**
	 * Internal set field value
	 */
	FormInstance.prototype._setFieldValue = function(name, value, options) {
		options = options || {};

		// Update data
		this._data[name] = value;
		if (!options.silent) {
			this._dirty = true;
		}

		// Update field UI
		var field = this._fields[name];
		if (field) {
			if (field.instance && field.instance.setValue) {
				field.instance.setValue(value, { silent: true });
			} else if (field.inputEl) {
				var type = field.config.type;
				if (type === 'checkbox') {
					// inputEl may be Funky.Dom wrapper (.el) or raw element
					var inputElement = field.inputEl.el || field.inputEl;
					inputElement.checked = !!value;
				} else {
					var inputElement = field.inputEl.el || field.inputEl;
					inputElement.value = value !== null && value !== undefined ? value : '';
				}
			}
		}

		// Re-evaluate field dependencies
		this._evaluateDependencies();

		// Emit change unless silent
		if (!options.silent) {
			this._emit('change', {
				field: name,
				value: value,
				data: this._data
			});
		}
	};

	/**
	 * Get single field value
	 * @param {string} name
	 * @returns {*}
	 */
	FormInstance.prototype.getFieldValue = function(name) {
		return this._data[name];
	};

	/**
	 * Get field instance
	 * @param {string} name
	 * @returns {Object|null}
	 */
	FormInstance.prototype.getField = function(name) {
		var field = this._fields[name];
		return field ? field.instance || field : null;
	};

	/**
	 * Check if form is dirty (has unsaved changes)
	 * @returns {boolean}
	 */
	FormInstance.prototype.isDirty = function() {
		return this._dirty;
	};

	/**
	 * Check if form is pristine (no changes since last reset/setData)
	 * @returns {boolean}
	 */
	FormInstance.prototype.isPristine = function() {
		return !this._dirty;
	};

	/**
	 * Show field
	 * @param {string} name
	 */
	FormInstance.prototype.showField = function(name) {
		var field = this._fields[name];
		if (field) {
			field.visible = true;
			if (field.instance && field.instance.show) {
				field.instance.show();
			} else if (field.element) {
				// field.element may be Funky.Dom wrapper or raw DOM element
				if (field.element.style && typeof field.element.style === 'function') {
					// Funky.Dom wrapper
					field.element.style('display', '');
					field.element.classRemove('funky-form-field--hidden');
				} else if (field.element.el) {
					// Funky.Dom wrapper (use raw element)
					field.element.el.style.display = '';
					field.element.el.classList.remove('funky-form-field--hidden');
				} else {
					// Raw DOM element
					field.element.style.display = '';
					field.element.classList.remove('funky-form-field--hidden');
				}
			}
		}
	};

	/**
	 * Hide field
	 * @param {string} name
	 */
	FormInstance.prototype.hideField = function(name) {
		var field = this._fields[name];
		if (field) {
			field.visible = false;
			if (field.instance && field.instance.hide) {
				field.instance.hide();
			} else if (field.element) {
				// field.element may be Funky.Dom wrapper or raw DOM element
				if (field.element.style && typeof field.element.style === 'function') {
					// Funky.Dom wrapper
					field.element.style('display', 'none');
					field.element.classAdd('funky-form-field--hidden');
				} else if (field.element.el) {
					// Funky.Dom wrapper (use raw element)
					field.element.el.style.display = 'none';
					field.element.el.classList.add('funky-form-field--hidden');
				} else {
					// Raw DOM element
					field.element.style.display = 'none';
					field.element.classList.add('funky-form-field--hidden');
				}
			}
		}
	};

	/**
	 * Enable field
	 * @param {string} name
	 */
	FormInstance.prototype.enableField = function(name) {
		var field = this._fields[name];
		if (field) {
			field.enabled = true;
			if (field.instance && field.instance.enable) {
				field.instance.enable();
			} else if (field.inputEl) {
				// inputEl may be Funky.Dom wrapper
				var inputElement = field.inputEl.el || field.inputEl;
				inputElement.disabled = false;
			}
			if (field.element) {
				// field.element may be Funky.Dom wrapper or raw DOM element
				if (typeof field.element.classRemove === 'function') {
					field.element.classRemove('funky-form-field--disabled');
				} else if (field.element.el) {
					field.element.el.classList.remove('funky-form-field--disabled');
				} else {
					field.element.classList.remove('funky-form-field--disabled');
				}
			}
		}
	};

	/**
	 * Disable field
	 * @param {string} name
	 */
	FormInstance.prototype.disableField = function(name) {
		var field = this._fields[name];
		if (field) {
			field.enabled = false;
			if (field.instance && field.instance.disable) {
				field.instance.disable();
			} else if (field.inputEl) {
				// inputEl may be Funky.Dom wrapper
				var inputElement = field.inputEl.el || field.inputEl;
				inputElement.disabled = true;
			}
			if (field.element) {
				// field.element may be Funky.Dom wrapper or raw DOM element
				if (typeof field.element.classAdd === 'function') {
					field.element.classAdd('funky-form-field--disabled');
				} else if (field.element.el) {
					field.element.el.classList.add('funky-form-field--disabled');
				} else {
					field.element.classList.add('funky-form-field--disabled');
				}
			}
		}
	};

	// =========================================================================
	// VALIDATION (Phase 1: Basic, Phase 5: Full)
	// =========================================================================

	/**
	 * Validate all fields
	 * @returns {Object} { valid: boolean, errors: {} }
	 */
	FormInstance.prototype.validate = function() {
		var self = this;
		var errors = {};
		var valid = true;

		Object.keys(this._fields).forEach(function(name) {
			var result = self._validateField(name);
			if (!result.valid) {
				errors[name] = result.errors;
				valid = false;
			}
		});

		this._emit('validate', { valid: valid, errors: errors });

		return { valid: valid, errors: errors };
	};

	/**
	 * Validate single field
	 */
	FormInstance.prototype._validateField = function(name) {
		var field = this._fields[name];
		if (!field) return { valid: true, errors: [] };

		// Skip hidden fields from validation
		if (field.instance && !field.instance.isVisible()) {
			this._clearFieldError(name);
			delete this._errors[name];
			return { valid: true, errors: [] };
		}

		var Validator = global.Funky && global.Funky.Validator;
		var value = this._data[name];
		var errors = [];

		// Use Funky.Validator if available
		if (Validator && Validator.validate) {
			var rules = Validator.extractRules(field.config);
			var context = {
				field: field.config,
				data: this._data,
				form: this,
				messages: this.options.messages
			};
			var result = Validator.validate(value, rules, context);
			errors = result.errors;
		} else {
			// Fallback: basic required validation
			if (field.config.required && (value === null || value === undefined || value === '')) {
				errors.push((field.config.label || name) + ' is required');
			}
		}

		// Update UI (only show inline errors if enabled)
		if (errors.length > 0) {
			if (this.options.showErrorsInline) {
				this._showFieldError(name, errors);
			}
			this._errors[name] = errors;
		} else {
			this._clearFieldError(name);
			delete this._errors[name];
		}

		return { valid: errors.length === 0, errors: errors };
	};

	/**
	 * Validate single field (public method)
	 */
	FormInstance.prototype.validateField = function(name) {
		return this._validateField(name);
	};

	/**
	 * Validate single field asynchronously
	 * @param {string} name - Field name
	 * @returns {Promise<Object>} { valid: boolean, errors: string[] }
	 */
	FormInstance.prototype.validateFieldAsync = function(name) {
		var field = this._fields[name];
		if (!field) return Promise.resolve({ valid: true, errors: [] });

		// Skip hidden fields
		if (field.instance && !field.instance.isVisible()) {
			this._clearFieldError(name);
			delete this._errors[name];
			return Promise.resolve({ valid: true, errors: [] });
		}

		var Validator = global.Funky && global.Funky.Validator;
		var value = this._data[name];
		var self = this;

		if (Validator && Validator.validateAsync) {
			var rules = Validator.extractRules(field.config);
			var context = {
				field: field.config,
				data: this._data,
				form: this,
				messages: this.options.messages
			};

			return Validator.validateAsync(value, rules, context).then(function(result) {
				if (result.errors.length > 0) {
					self._showFieldError(name, result.errors);
					self._errors[name] = result.errors;
				} else {
					self._clearFieldError(name);
					delete self._errors[name];
				}
				return result;
			});
		}

		// Fallback to sync validation
		return Promise.resolve(this._validateField(name));
	};

	/**
	 * Validate all fields asynchronously
	 * @returns {Promise<Object>} { valid: boolean, errors: {} }
	 */
	FormInstance.prototype.validateAsync = function() {
		var self = this;
		var promises = [];

		Object.keys(this._fields).forEach(function(name) {
			promises.push(
				self.validateFieldAsync(name).then(function(result) {
					return { name: name, result: result };
				})
			);
		});

		return Promise.all(promises).then(function(results) {
			var errors = {};
			var valid = true;

			results.forEach(function(item) {
				if (!item.result.valid) {
					errors[item.name] = item.result.errors;
					valid = false;
				}
			});

			self._emit('validate', { valid: valid, errors: errors });

			return { valid: valid, errors: errors };
		});
	};

	/**
	 * Show error on field
	 */
	FormInstance.prototype._showFieldError = function(name, errors) {
		var field = this._fields[name];
		if (!field) return;

		if (field.instance && field.instance.showError) {
			field.instance.showError(errors);
		} else {
			if (field.element) {
				field.element.classList.add('funky-form-field--error');
			}
			if (field.errorEl) {
				field.errorEl.innerHTML = errors.map(function(e) {
					return '<div class="funky-form-error-message">' + e + '</div>';
				}).join('');
				field.errorEl.style.display = '';
			}
		}
	};

	/**
	 * Clear error on field
	 */
	FormInstance.prototype._clearFieldError = function(name) {
		var field = this._fields[name];
		if (!field) return;

		if (field.instance && field.instance.clearError) {
			field.instance.clearError();
		} else {
			if (field.element) {
				field.element.classList.remove('funky-form-field--error');
			}
			if (field.errorEl) {
				field.errorEl.innerHTML = '';
				field.errorEl.style.display = 'none';
			}
		}
	};

	/**
	 * Set server-side errors
	 */
	FormInstance.prototype.setErrors = function(errors) {
		var self = this;

		// Clear existing
		this.clearErrors();

		// Set new errors
		Object.keys(errors).forEach(function(name) {
			var fieldErrors = Array.isArray(errors[name]) ? errors[name] : [errors[name]];
			if (self.options.showErrorsInline) {
				self._showFieldError(name, fieldErrors);
			}
			self._errors[name] = fieldErrors;
		});

		this._emit('error', { errors: errors });
	};

	/**
	 * Set error on single field
	 */
	FormInstance.prototype.setFieldError = function(name, error) {
		var errors = Array.isArray(error) ? error : [error];
		if (this.options.showErrorsInline) {
			this._showFieldError(name, errors);
		}
		this._errors[name] = errors;
	};

	/**
	 * Clear error on single field
	 */
	FormInstance.prototype.clearFieldError = function(name) {
		this._clearFieldError(name);
		delete this._errors[name];
	};

	/**
	 * Clear all errors
	 */
	FormInstance.prototype.clearErrors = function() {
		var self = this;
		Object.keys(this._fields).forEach(function(name) {
			self._clearFieldError(name);
		});
		this._errors = {};
	};

	// =========================================================================
	// LIFECYCLE
	// =========================================================================

	/**
	 * Submit form
	 */
	FormInstance.prototype.submit = function() {
		if (this._isSubmitting) return;

		// Validate first
		var validation = this.validate();
		if (!validation.valid) {
			this._emit('error', { errors: validation.errors });
			return;
		}

		this._isSubmitting = true;
		var data = this.getData();

		// Emit submit event
		this._emit('submit', { data: data });

		// Call onSubmit callback
		if (typeof this.options.onSubmit === 'function') {
			var result = this.options.onSubmit.call(this, data);

			// Handle promise
			if (result && typeof result.then === 'function') {
				var self = this;
				result
					.then(function() {
						self._isSubmitting = false;
					})
					.catch(function(err) {
						self._isSubmitting = false;
						if (err && err.errors) {
							self.setErrors(err.errors);
						}
					});
			} else {
				this._isSubmitting = false;
			}
		} else {
			this._isSubmitting = false;
		}
	};

	/**
	 * Reset form to initial values
	 */
	FormInstance.prototype.reset = function() {
		this._data = Object.assign({}, this._initialData);
		this._dirty = false;

		// Update all field values
		var self = this;
		Object.keys(this._fields).forEach(function(name) {
			var value = self._initialData[name];
			self._setFieldValue(name, value !== undefined ? value : null, { silent: true });
		});

		// Clear errors
		this.clearErrors();

		this._emit('reset', { form: this });
	};

	/**
	 * Destroy form instance
	 */
	FormInstance.prototype.destroy = function() {
		// Emit destroy event
		this._emit('destroy', { form: this });

		// Destroy field instances
		var self = this;
		Object.keys(this._fields).forEach(function(name) {
			var field = self._fields[name];
			if (field.instance && field.instance.destroy) {
				field.instance.destroy();
			}
		});

		// Remove from DOM
		if (this._formEl) {
			this._formEl.remove();
		}

		// Clear references
		if (this.container) {
			var containerEl = this.container.el || this.container;
			delete containerEl._funkyFormInstance;
		}

		// Remove from registry
		delete _instances[this.id];

		// Clear state
		this._fields = {};
		this._data = {};
		this._errors = {};
		this._formEl = null;
		this._bodyEl = null;
		this.container = null;
	};

	// =========================================================================
	// INTERNAL HELPERS
	// =========================================================================

	/**
	 * Handle field change
	 */
	FormInstance.prototype._onFieldChange = function(name, value) {
		this._data[name] = value;
		this._dirty = true;

		// Re-evaluate field dependencies
		this._evaluateDependencies();

		// Validate on change if enabled
		if (this.options.validateOnChange) {
			this._validateField(name);
		}

		this._emit('change', {
			field: name,
			value: value,
			data: this._data
		});
	};

	/**
	 * Handle field error (called from field instances)
	 */
	FormInstance.prototype._onFieldError = function(name, message) {
		this._showFieldError(name, Array.isArray(message) ? message : [message]);
	};

	/**
	 * Evaluate field dependencies (dependsOn)
	 * Show/hide fields based on other field values
	 */
	FormInstance.prototype._evaluateDependencies = function() {
		var self = this;

		Object.keys(this._fields).forEach(function(fieldName) {
			var fieldDef = self._fields[fieldName];
			var config = fieldDef.config;

			if (!config.dependsOn) return;

			var dep = config.dependsOn;
			var depField = dep.field;
			var depValue = self._data[depField];
			var shouldShow = false;

			// Evaluate dependency condition
			if (dep.equals !== undefined) {
				shouldShow = depValue === dep.equals;
			} else if (dep.notEquals !== undefined) {
				shouldShow = depValue !== dep.notEquals;
			} else if (dep.in !== undefined && Array.isArray(dep.in)) {
				shouldShow = dep.in.indexOf(depValue) > -1;
			} else if (dep.notIn !== undefined && Array.isArray(dep.notIn)) {
				shouldShow = dep.notIn.indexOf(depValue) === -1;
			} else if (dep.truthy) {
				shouldShow = !!depValue;
			} else if (dep.falsy) {
				shouldShow = !depValue;
			} else if (dep.matches) {
				var regex = dep.matches instanceof RegExp ? dep.matches : new RegExp(dep.matches);
				shouldShow = regex.test(depValue);
			} else if (typeof dep.fn === 'function') {
				shouldShow = dep.fn(depValue, self._data);
			}

			// Apply visibility
			if (shouldShow) {
				self.showField(fieldName);
			} else {
				self.hideField(fieldName);
			}
		});
	};

	/**
	 * Set all fields readonly
	 */
	FormInstance.prototype._setReadonly = function(readonly) {
		var self = this;
		Object.keys(this._fields).forEach(function(name) {
			var field = self._fields[name];
			// Use field instance method if available
			if (field.instance && field.instance._setReadonly) {
				field.instance._setReadonly(readonly);
			} else if (field.inputEl) {
				field.inputEl.readOnly = readonly;
			}
		});
	};

	/**
	 * Set all fields disabled
	 */
	FormInstance.prototype._setDisabled = function(disabled) {
		var self = this;
		Object.keys(this._fields).forEach(function(name) {
			if (disabled) {
				self.disableField(name);
			} else {
				self.enableField(name);
			}
		});
	};

	/**
	 * Emit event
	 */
	FormInstance.prototype._emit = function(event, detail) {
		detail = detail || {};
		detail.formId = this.id;

		// Get native element for event dispatch
		var nativeEl = this.container && this.container.el ? this.container.el : this.container;

		// Funky.Events (requires target element)
		if (E && E.emit && nativeEl) {
			E.emit(nativeEl, 'form:' + event, detail);
		}

		// PubSub
		if (PubSub && PubSub.publish) {
			PubSub.publish('form:' + event, detail);
		}

		// DOM event on container
		if (nativeEl && nativeEl.dispatchEvent) {
			nativeEl.dispatchEvent(new CustomEvent('funky-form:' + event, {
				bubbles: true,
				detail: detail
			}));
		}

		// Callback
		var callbackName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
		var callback = this.options[callbackName];
		if (typeof callback === 'function') {
			callback.call(this, detail);
		}
	};

	// =========================================================================
	// STATIC API
	// =========================================================================

	var Form = {
		/**
		 * Create form instance
		 * @param {string|HTMLElement} container
		 * @param {Object} options
		 * @returns {FormInstance|Promise<FormInstance>}
		 */
		create: function(container, options) {
			options = options || {};

			var el = typeof container === 'string'
				? document.querySelector(container)
				: container;

			if (!el) {
				console.error('[Funky.Form] Container not found:', container);
				return null;
			}

			// Check if already initialized
			if (el._funkyFormInstance) {
				return el._funkyFormInstance;
			}

			// If schemaPath provided, load async
			if (options.schemaPath) {
				return Form._loadSchemaAndCreate(el, options);
			}

			// Sync creation
			return new FormInstance(el, options);
		},

		/**
		 * Load schema async and create form
		 */
		_loadSchemaAndCreate: function(el, options) {
			var FunkySchema = global.Funky && global.Funky.Schema;
			var SchemaAdapter = global.Funky && global.Funky.SchemaAdapter;

			if (!FunkySchema) {
				console.error('[Funky.Form] Funky.Schema required for schemaPath');
				return Promise.reject(new Error('Funky.Schema not available'));
			}

			return FunkySchema.getSchema(options.schemaPath).then(function(openApiSchema) {
				// Convert schema
				var nativeSchema = SchemaAdapter
					? SchemaAdapter.convert(openApiSchema)
					: { fields: openApiSchema.properties || {} };

				// Create with converted schema
				var opts = Object.assign({}, options, { schema: nativeSchema });
				delete opts.schemaPath;

				return new FormInstance(el, opts);
			});
		},

		/**
		 * Get instance by ID or element
		 * @param {string|HTMLElement} idOrElement
		 * @returns {FormInstance|null}
		 */
		getInstance: function(idOrElement) {
			if (typeof idOrElement === 'string') {
				// Direct ID lookup
				if (_instances[idOrElement]) {
					return _instances[idOrElement];
				}
				// Try as selector
				var el = document.querySelector(idOrElement);
				if (el && el._funkyFormInstance) {
					return el._funkyFormInstance;
				}
			} else if (idOrElement && idOrElement._funkyFormInstance) {
				return idOrElement._funkyFormInstance;
			}
			return null;
		},

		/**
		 * Alias for getInstance
		 */
		get: function(idOrElement) {
			return this.getInstance(idOrElement);
		},

		/**
		 * Set data on form instance
		 */
		setData: function(idOrElement, data) {
			var instance = this.getInstance(idOrElement);
			if (instance) {
				instance.setData(data);
				return true;
			}
			return false;
		},

		/**
		 * Get data from form instance
		 */
		getData: function(idOrElement) {
			var instance = this.getInstance(idOrElement);
			return instance ? instance.getData() : null;
		},

		/**
		 * Destroy form instance
		 */
		destroy: function(idOrElement) {
			var instance = this.getInstance(idOrElement);
			if (instance) {
				instance.destroy();
				return true;
			}
			return false;
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			Object.keys(_instances).forEach(function(id) {
				_instances[id].destroy();
			});
		}
	};

	// =========================================================================
	// LIVEBINDING INTEGRATION
	// =========================================================================

	if (global.Funky && global.Funky.LiveBinding) {
		if (global.Funky.LiveBinding.registerRegistry) {
			global.Funky.LiveBinding.registerRegistry('Form');
		}

		if (global.Funky.LiveBinding.registerComponent) {
			global.Funky.LiveBinding.registerComponent('form', {
				supports: function(element) {
					return element.hasAttribute('data-funky-form') ||
						element.classHas('funky-form') ||
						element._funkyFormInstance !== undefined;
				},

				bind: function(element, options) {
					var instance = Form.getInstance(element);

					return {
						update: function(data) {
							if (!instance) {
								instance = Form.getInstance(element);
							}
							if (instance) {
								instance.setData(data);
							}
						},

						getValue: function() {
							if (!instance) {
								instance = Form.getInstance(element);
							}
							return instance ? instance.getData() : null;
						}
					};
				}
			});
		}
	}

	// =========================================================================
	// EXPOSE
	// =========================================================================

	// Register component using Funky registry
	if (global.Funky && global.Funky.register) {
		global.Funky.register('Form', Form);

		// Attach FieldRegistry and BaseField from form-field-registry.js
		if (global._FunkyFormInternal) {
			global.Funky.Form.FieldRegistry = global._FunkyFormInternal.FieldRegistry;
			global.Funky.Form.BaseField = global._FunkyFormInternal.BaseField;
			// Clean up temporary namespace
			delete global._FunkyFormInternal;
		}
	}

})(typeof window !== 'undefined' ? window : this);
