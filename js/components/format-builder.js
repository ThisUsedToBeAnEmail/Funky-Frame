/**
 * Funky FormatBuilder - Visual report format configuration builder
 * Provides UI for configuring header, content, and footer sections of reports
 * 
 * Usage:
 *   var builder = new Funky.FormatBuilder.create('container-id');
 *   builder.loadConfig(existingConfig);
 *   builder.fetchAvailableColumns('trade');
 *   var config = builder.getConfig();
 * 
 * @version 1.0.1
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.FormatBuilder] Registry not found. Load namespace.js first.');
		return;
	}

	function FunkyFormatBuilder(containerId) {
		this.container = document.getElementById(containerId);
		this.config = {
			header: { enabled: false, lines: [] },
			content: { columns: [] },
			footer: { enabled: false, lines: [] }
		};

		this.availablePlaceholders = [
			{ value: '{{current_date}}', label: 'Current Date', example: '2025-12-13' },
			{ value: '{{current_time}}', label: 'Current Time', example: '14:30:00' },
			{ value: '{{current_datetime}}', label: 'Current Date & Time', example: '2025-12-13 14:30:00' },
			{ value: '{{total_rows}}', label: 'Total Rows', example: '150' },
			{ value: '{{client_name}}', label: 'Client Name', example: 'Acme Corp' },
			{ value: '{{client_code}}', label: 'Client Code', example: 'ACME' },
			{ value: '{{user_name}}', label: 'User Name', example: 'John Doe' },
			{ value: '{{user_email}}', label: 'User Email', example: 'john@example.com' }
		];

		this.availableColumns = { primary_table: '', tables: {} };

		this.render();
	}

	FunkyFormatBuilder.prototype.render = function() {
		var self = this;
		this.container.innerHTML =
			'<div class="format-builder">' +
			'<div class="format-builder-left">' +
			'<!-- Header Section -->' +
			'<div class="format-section">' +
			'<div class="section-header">' +
			'<h6>' +
			'<input type="checkbox" class="form-check-input me-2" id="header-enabled" aria-label="Enable header section" ' + (this.config.header.enabled ? 'checked' : '') + '>' +
			'Header Section' +
			'</h6>' +
			'<div class="section-controls" id="header-controls" style="' + (this.config.header.enabled ? '' : 'display:none') + '">' +
			'<label class="me-2">Format:</label>' +
			'<select class="form-select form-select-sm d-inline-block w-auto me-2" id="header-format">' +
			'<option value="csv" ' + (this.config.header.format === 'csv' ? 'selected' : '') + '>CSV</option>' +
			'<option value="tsv" ' + (this.config.header.format === 'tsv' ? 'selected' : '') + '>TSV</option>' +
			'<option value="custom" ' + (this.config.header.format === 'custom' ? 'selected' : '') + '>Custom</option>' +
			'</select>' +
			'<input type="text" class="form-control form-control-sm d-inline-block" id="header-delimiter" ' +
			'placeholder="Delimiter" value="' + (this.config.header.customDelimiter || '') + '" ' +
			'style="width: 80px; ' + (this.config.header.format === 'custom' ? '' : 'display:none') + '">' +
			'</div>' +
			'</div>' +
			'<div class="section-body" id="header-body" style="' + (this.config.header.enabled ? '' : 'display:none') + '">' +
			'<div id="header-lines"></div>' +
			'<button type="button" class="btn btn-sm btn-outline-primary mt-2" id="add-header-line-btn" aria-label="Add header line">' +
			'+ Add Line' +
			'</button>' +
			'</div>' +
			'</div>' +

			'<!-- Content Section -->' +
			'<div class="format-section">' +
			'<div class="section-header">' +
			'<h6>Content Section</h6>' +
			'<div class="section-controls">' +
			'<label class="me-2">Format:</label>' +
			'<select class="form-select form-select-sm d-inline-block w-auto me-3" id="content-format">' +
			'<option value="csv" ' + (this.config.content.format === 'csv' ? 'selected' : '') + '>CSV</option>' +
			'<option value="tsv" ' + (this.config.content.format === 'tsv' ? 'selected' : '') + '>TSV</option>' +
			'</select>' +
			'<label class="me-2">' +
			'<input type="checkbox" class="form-check-input" id="content-headers" aria-describedby="content-headers-desc" ' + (this.config.content.includeHeaders ? 'checked' : '') + '>' +
			'<span id="content-headers-desc">Include Headers</span>' +
			'</label>' +
			'</div>' +
			'</div>' +
			'<div class="section-body">' +
			'<div id="content-columns"></div>' +
			'<button type="button" class="btn btn-sm btn-outline-primary mt-2" id="add-column-btn" aria-label="Add content column">' +
			'+ Add Column' +
			'</button>' +
			'</div>' +
			'</div>' +

			'<!-- Footer Section -->' +
			'<div class="format-section">' +
			'<div class="section-header">' +
			'<h6>' +
			'<input type="checkbox" class="form-check-input me-2" id="footer-enabled" aria-label="Enable footer section" ' + (this.config.footer.enabled ? 'checked' : '') + '>' +
			'Footer Section' +
			'</h6>' +
			'<div class="section-controls" id="footer-controls" style="' + (this.config.footer.enabled ? '' : 'display:none') + '">' +
			'<label class="me-2">Format:</label>' +
			'<select class="form-select form-select-sm d-inline-block w-auto me-2" id="footer-format">' +
			'<option value="csv" ' + (this.config.footer.format === 'csv' ? 'selected' : '') + '>CSV</option>' +
			'<option value="tsv" ' + (this.config.footer.format === 'tsv' ? 'selected' : '') + '>TSV</option>' +
			'<option value="custom" ' + (this.config.footer.format === 'custom' ? 'selected' : '') + '>Custom</option>' +
			'</select>' +
			'<input type="text" class="form-control form-control-sm d-inline-block" id="footer-delimiter" ' +
			'placeholder="Delimiter" value="' + (this.config.footer.customDelimiter || '') + '" ' +
			'style="width: 80px; ' + (this.config.footer.format === 'custom' ? '' : 'display:none') + '">' +
			'</div>' +
			'</div>' +
			'<div class="section-body" id="footer-body" style="' + (this.config.footer.enabled ? '' : 'display:none') + '">' +
			'<div id="footer-lines"></div>' +
			'<button type="button" class="btn btn-sm btn-outline-primary mt-2" id="add-footer-line-btn" aria-label="Add footer line">' +
			'+ Add Line' +
			'</button>' +
			'</div>' +
			'</div>' +
			'</div>' +

			'<div class="format-builder-right">' +
			'<!-- Available Columns Panel -->' +
			'<div class="format-section sticky-panel">' +
			'<div class="section-header">' +
			'<h6>Available Columns</h6>' +
			'</div>' +
			'<div class="section-body">' +
			'<div id="available-columns-panel">' +
			'<p class="text-muted mb-0">Select a report type to see available columns.</p>' +
			'</div>' +
			'</div>' +
			'</div>' +

			'<!-- Placeholder Helper -->' +
			'<div class="format-section sticky-panel">' +
			'<div class="section-header">' +
			'<h6>Available Placeholders</h6>' +
			'</div>' +
			'<div class="section-body">' +
			'<div class="placeholder-grid">' +
			this.availablePlaceholders.map(function(p) {
				return '<div class="placeholder-item" data-placeholder="' + p.value + '">' +
					'<code>' + p.value + '</code>' +
					'<small>' + p.label + '</small>' +
					'<span class="text-muted">' + p.example + '</span>' +
					'</div>';
			}).join('') +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';

		this.attachEventListeners();
		this.renderHeaderLines();
		this.renderColumns();
		this.renderFooterLines();
		this.renderColumnsPanel();
	};

	FunkyFormatBuilder.prototype.attachEventListeners = function() {
		var self = this;

		// Header enabled toggle
		document.getElementById('header-enabled').addEventListener('change', function() {
			self.config.header.enabled = this.checked;
			document.getElementById('header-controls').style.display = this.checked ? '' : 'none';
			document.getElementById('header-body').style.display = this.checked ? '' : 'none';
			self.triggerChange();
		});

		// Header format change
		document.getElementById('header-format').addEventListener('change', function() {
			self.config.header.format = this.value;
			document.getElementById('header-delimiter').style.display = this.value === 'custom' ? '' : 'none';
			self.triggerChange();
		});

		document.getElementById('header-delimiter').addEventListener('input', function() {
			self.config.header.customDelimiter = this.value;
			self.triggerChange();
		});

		// Content format change
		document.getElementById('content-format').addEventListener('change', function() {
			self.config.content.format = this.value;
			self.triggerChange();
		});

		document.getElementById('content-headers').addEventListener('change', function() {
			self.config.content.includeHeaders = this.checked;
			self.triggerChange();
		});

		// Footer enabled toggle
		document.getElementById('footer-enabled').addEventListener('change', function() {
			self.config.footer.enabled = this.checked;
			document.getElementById('footer-controls').style.display = this.checked ? '' : 'none';
			document.getElementById('footer-body').style.display = this.checked ? '' : 'none';
			self.triggerChange();
		});

		// Footer format change
		document.getElementById('footer-format').addEventListener('change', function() {
			self.config.footer.format = this.value;
			document.getElementById('footer-delimiter').style.display = this.value === 'custom' ? '' : 'none';
			self.triggerChange();
		});

		document.getElementById('footer-delimiter').addEventListener('input', function() {
			self.config.footer.customDelimiter = this.value;
			self.triggerChange();
		});

		// Add button listeners
		document.getElementById('add-header-line-btn').addEventListener('click', function() {
			self.addHeaderLine();
		});

		document.getElementById('add-column-btn').addEventListener('click', function() {
			self.addColumn();
		});

		document.getElementById('add-footer-line-btn').addEventListener('click', function() {
			self.addFooterLine();
		});

		// Placeholder click handlers
		var placeholderItems = document.querySelectorAll('.placeholder-item');
		placeholderItems.forEach(function(item) {
			item.addEventListener('click', function() {
				self.copyPlaceholder(this.getAttribute('data-placeholder'));
			});
		});
	};

	FunkyFormatBuilder.prototype.renderHeaderLines = function() {
		var self = this;
		var container = document.getElementById('header-lines');
		if (!container) return;

		container.innerHTML = this.config.header.lines.map(function(line, lineIdx) {
			return '<div class="format-line" data-line-idx="' + lineIdx + '">' +
				'<div class="line-header">' +
				'<span>Line ' + (lineIdx + 1) + '</span>' +
				'<button type="button" class="btn btn-sm btn-outline-danger remove-header-line-btn" data-line-idx="' + lineIdx + '" aria-label="Remove header line ' + (lineIdx + 1) + '">✕</button>' +
				'</div>' +
				'<div class="line-fields">' +
				line.map(function(field, fieldIdx) {
					var fieldType = field.source ? 'source' : 'text';
					var fieldValue = field.source || field.value || '';
					var inputId = 'header-input-' + lineIdx + '-' + fieldIdx;
					return '<div class="field-input-group">' +
						'<select class="form-select form-select-sm field-type-select" ' +
						'id="header-type-' + lineIdx + '-' + fieldIdx + '" ' +
						'data-line-idx="' + lineIdx + '" data-field-idx="' + fieldIdx + '" data-section="header">' +
						'<option value="text" ' + (fieldType === 'text' ? 'selected' : '') + '>Text</option>' +
						'<option value="source" ' + (fieldType === 'source' ? 'selected' : '') + '>Source</option>' +
						'</select>' +
						'<select id="' + inputId + '" class="form-select form-select-sm" style="display: ' + (fieldType === 'source' ? 'block' : 'none') + '">' +
						'<option value="' + Funky.Util.escapeHtml(fieldValue) + '">' + Funky.Util.escapeHtml(fieldValue) + '</option>' +
						'</select>' +
						'<input type="text" id="' + inputId + '-text" class="form-control form-control-sm" ' +
						'style="display: ' + (fieldType === 'text' ? 'block' : 'none') + '" ' +
						'value="' + Funky.Util.escapeHtml(fieldValue) + '" ' +
						'data-line-idx="' + lineIdx + '" data-field-idx="' + fieldIdx + '" data-section="header" ' +
						'placeholder="Text value or placeholder">' +
						'<button type="button" class="btn btn-sm btn-outline-danger remove-header-field-btn" ' +
						'data-line-idx="' + lineIdx + '" data-field-idx="' + fieldIdx + '" aria-label="Remove field">✕</button>' +
						'</div>';
				}).join('') +
				'<button type="button" class="btn btn-sm btn-outline-secondary add-header-field-btn" data-line-idx="' + lineIdx + '" aria-label="Add field to line ' + (lineIdx + 1) + '">+ Field</button>' +
				'</div>' +
				'</div>';
		}).join('');

		// Attach event handlers for dynamically created elements
		this.attachDynamicHandlers('header');

		// Initialize ComboBox for source fields
		this.config.header.lines.forEach(function(line, lineIdx) {
			line.forEach(function(field, fieldIdx) {
				if (field.source) {
					self.initSourceComboBox('header-input-' + lineIdx + '-' + fieldIdx, lineIdx, fieldIdx, 'header', field.source);
				}
			});
		});
	};

	FunkyFormatBuilder.prototype.renderColumns = function() {
		var self = this;
		var container = document.getElementById('content-columns');
		if (!container) return;

		container.innerHTML = this.config.content.columns.map(function(col, idx) {
			var fieldType = col.source ? 'source' : 'text';
			var fieldValue = col.source || col.value || '';
			var inputId = 'content-input-' + idx;

			return '<div class="column-row" data-col-idx="' + idx + '">' +
				'<div class="drag-handle" aria-hidden="true">⋮⋮</div>' +
				'<div class="column-fields">' +
				'<div class="field-input-group">' +
				'<input type="text" class="form-control form-control-sm column-header-input" ' +
				'placeholder="Header" ' +
				'value="' + Funky.Util.escapeHtml(col.header || '') + '" ' +
				'data-col-idx="' + idx + '">' +
				'</div>' +
				'<div class="field-input-group">' +
				'<select class="form-select form-select-sm field-type-select" ' +
				'id="content-type-' + idx + '" ' +
				'data-col-idx="' + idx + '" data-section="content">' +
				'<option value="text" ' + (fieldType === 'text' ? 'selected' : '') + '>Text</option>' +
				'<option value="source" ' + (fieldType === 'source' ? 'selected' : '') + '>Source</option>' +
				'</select>' +
				'<select id="' + inputId + '" class="form-select form-select-sm" style="display: ' + (fieldType === 'source' ? 'block' : 'none') + '">' +
				'<option value="' + Funky.Util.escapeHtml(fieldValue) + '">' + Funky.Util.escapeHtml(fieldValue) + '</option>' +
				'</select>' +
				'<input type="text" id="' + inputId + '-text" class="form-control form-control-sm" ' +
				'style="display: ' + (fieldType === 'text' ? 'block' : 'none') + '" ' +
				'value="' + Funky.Util.escapeHtml(fieldValue) + '" ' +
				'data-col-idx="' + idx + '" ' +
				'placeholder="Text value">' +
				'</div>' +
				'</div>' +
				'<button type="button" class="btn btn-sm btn-outline-danger remove-column-btn" data-col-idx="' + idx + '" aria-label="Remove column">✕</button>' +
				'</div>';
		}).join('');

		// Attach event handlers
		this.attachColumnHandlers();

		// Initialize ComboBox for source fields
		this.config.content.columns.forEach(function(col, idx) {
			if (col.source) {
				self.initSourceComboBox('content-input-' + idx, idx, null, 'content', col.source);
			}
		});

		// Initialize drag-and-drop for column reordering
		this.initColumnDragDrop();
	};

	FunkyFormatBuilder.prototype.renderFooterLines = function() {
		var self = this;
		var container = document.getElementById('footer-lines');
		if (!container) return;

		container.innerHTML = this.config.footer.lines.map(function(line, lineIdx) {
			return '<div class="format-line" data-line-idx="' + lineIdx + '">' +
				'<div class="line-header">' +
				'<span>Line ' + (lineIdx + 1) + '</span>' +
				'<button type="button" class="btn btn-sm btn-outline-danger remove-footer-line-btn" data-line-idx="' + lineIdx + '" aria-label="Remove footer line ' + (lineIdx + 1) + '">✕</button>' +
				'</div>' +
				'<div class="line-fields">' +
				line.map(function(field, fieldIdx) {
					var fieldType = field.source ? 'source' : 'text';
					var fieldValue = field.source || field.value || '';
					var inputId = 'footer-input-' + lineIdx + '-' + fieldIdx;
					return '<div class="field-input-group">' +
						'<select class="form-select form-select-sm field-type-select" ' +
						'id="footer-type-' + lineIdx + '-' + fieldIdx + '" ' +
						'data-line-idx="' + lineIdx + '" data-field-idx="' + fieldIdx + '" data-section="footer">' +
						'<option value="text" ' + (fieldType === 'text' ? 'selected' : '') + '>Text</option>' +
						'<option value="source" ' + (fieldType === 'source' ? 'selected' : '') + '>Source</option>' +
						'</select>' +
						'<select id="' + inputId + '" class="form-select form-select-sm" style="display: ' + (fieldType === 'source' ? 'block' : 'none') + '">' +
						'<option value="' + Funky.Util.escapeHtml(fieldValue) + '">' + Funky.Util.escapeHtml(fieldValue) + '</option>' +
						'</select>' +
						'<input type="text" id="' + inputId + '-text" class="form-control form-control-sm" ' +
						'style="display: ' + (fieldType === 'text' ? 'block' : 'none') + '" ' +
						'value="' + Funky.Util.escapeHtml(fieldValue) + '" ' +
						'data-line-idx="' + lineIdx + '" data-field-idx="' + fieldIdx + '" data-section="footer" ' +
						'placeholder="Text value or placeholder">' +
						'<button type="button" class="btn btn-sm btn-outline-danger remove-footer-field-btn" ' +
						'data-line-idx="' + lineIdx + '" data-field-idx="' + fieldIdx + '" aria-label="Remove field">✕</button>' +
						'</div>';
				}).join('') +
				'<button type="button" class="btn btn-sm btn-outline-secondary add-footer-field-btn" data-line-idx="' + lineIdx + '" aria-label="Add field to line ' + (lineIdx + 1) + '">+ Field</button>' +
				'</div>' +
				'</div>';
		}).join('');

		// Attach event handlers
		this.attachDynamicHandlers('footer');

		// Initialize ComboBox for source fields
		this.config.footer.lines.forEach(function(line, lineIdx) {
			line.forEach(function(field, fieldIdx) {
				if (field.source) {
					self.initSourceComboBox('footer-input-' + lineIdx + '-' + fieldIdx, lineIdx, fieldIdx, 'footer', field.source);
				}
			});
		});
	};

	FunkyFormatBuilder.prototype.attachDynamicHandlers = function(section) {
		var self = this;
		var prefix = section;

		// Remove line buttons
		document.querySelectorAll('.remove-' + section + '-line-btn').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var lineIdx = parseInt(this.getAttribute('data-line-idx'));
				if (section === 'header') {
					self.removeHeaderLine(lineIdx);
				} else {
					self.removeFooterLine(lineIdx);
				}
			});
		});

		// Add field buttons
		document.querySelectorAll('.add-' + section + '-field-btn').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var lineIdx = parseInt(this.getAttribute('data-line-idx'));
				if (section === 'header') {
					self.addHeaderField(lineIdx);
				} else {
					self.addFooterField(lineIdx);
				}
			});
		});

		// Remove field buttons
		document.querySelectorAll('.remove-' + section + '-field-btn').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var lineIdx = parseInt(this.getAttribute('data-line-idx'));
				var fieldIdx = parseInt(this.getAttribute('data-field-idx'));
				if (section === 'header') {
					self.removeHeaderField(lineIdx, fieldIdx);
				} else {
					self.removeFooterField(lineIdx, fieldIdx);
				}
			});
		});

		// Field type selects
		document.querySelectorAll('#' + section + '-lines .field-type-select').forEach(function(select) {
			select.addEventListener('change', function() {
				var lineIdx = parseInt(this.getAttribute('data-line-idx'));
				var fieldIdx = parseInt(this.getAttribute('data-field-idx'));
				if (section === 'header') {
					self.changeHeaderFieldType(lineIdx, fieldIdx, this.value);
				} else {
					self.changeFooterFieldType(lineIdx, fieldIdx, this.value);
				}
			});
		});

		// Text inputs
		document.querySelectorAll('#' + section + '-lines input[type="text"]').forEach(function(input) {
			input.addEventListener('change', function() {
				var lineIdx = parseInt(this.getAttribute('data-line-idx'));
				var fieldIdx = parseInt(this.getAttribute('data-field-idx'));
				if (section === 'header') {
					self.updateHeaderField(lineIdx, fieldIdx, this.value, 'text');
				} else {
					self.updateFooterField(lineIdx, fieldIdx, this.value, 'text');
				}
			});
		});
	};

	FunkyFormatBuilder.prototype.attachColumnHandlers = function() {
		var self = this;

		// Remove column buttons
		document.querySelectorAll('.remove-column-btn').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var colIdx = parseInt(this.getAttribute('data-col-idx'));
				self.removeColumn(colIdx);
			});
		});

		// Header inputs
		document.querySelectorAll('.column-header-input').forEach(function(input) {
			input.addEventListener('change', function() {
				var colIdx = parseInt(this.getAttribute('data-col-idx'));
				self.updateColumn(colIdx, 'header', this.value);
			});
		});

		// Field type selects
		document.querySelectorAll('#content-columns .field-type-select').forEach(function(select) {
			select.addEventListener('change', function() {
				var colIdx = parseInt(this.getAttribute('data-col-idx'));
				self.changeColumnFieldType(colIdx, this.value);
			});
		});

		// Value text inputs
		document.querySelectorAll('#content-columns input[id$="-text"]').forEach(function(input) {
			input.addEventListener('change', function() {
				var colIdx = parseInt(this.getAttribute('data-col-idx'));
				self.updateColumn(colIdx, 'value', this.value);
			});
		});
	};

	// Header line methods
	FunkyFormatBuilder.prototype.addHeaderLine = function() {
		this.config.header.lines.push([{ value: '' }]);
		this.renderHeaderLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.removeHeaderLine = function(lineIdx) {
		this.config.header.lines.splice(lineIdx, 1);
		this.renderHeaderLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.addHeaderField = function(lineIdx) {
		this.config.header.lines[lineIdx].push({ value: '' });
		this.renderHeaderLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.removeHeaderField = function(lineIdx, fieldIdx) {
		this.config.header.lines[lineIdx].splice(fieldIdx, 1);
		if (this.config.header.lines[lineIdx].length === 0) {
			this.config.header.lines.splice(lineIdx, 1);
		}
		this.renderHeaderLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.updateHeaderField = function(lineIdx, fieldIdx, value, type) {
		var field = this.config.header.lines[lineIdx][fieldIdx];
		if (type === 'source') {
			field.source = value;
			delete field.value;
		} else {
			field.value = value;
			delete field.source;
		}
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.changeHeaderFieldType = function(lineIdx, fieldIdx, newType) {
		var field = this.config.header.lines[lineIdx][fieldIdx];
		var currentValue = field.source || field.value || '';

		if (newType === 'source') {
			field.source = currentValue;
			delete field.value;

			var textInput = document.getElementById('header-input-' + lineIdx + '-' + fieldIdx + '-text');
			var select = document.getElementById('header-input-' + lineIdx + '-' + fieldIdx);
			if (textInput) textInput.style.display = 'none';
			if (select) {
				select.style.display = 'block';
				this.initSourceComboBox('header-input-' + lineIdx + '-' + fieldIdx, lineIdx, fieldIdx, 'header', currentValue);
			}
		} else {
			field.value = currentValue;
			delete field.source;

			var textInput = document.getElementById('header-input-' + lineIdx + '-' + fieldIdx + '-text');
			var select = document.getElementById('header-input-' + lineIdx + '-' + fieldIdx);
			if (select) {
				var instance = Funky.ComboBox.getInstance(select);
				if (instance) instance.destroy();
				select.style.display = 'none';
			}
			if (textInput) {
				textInput.style.display = 'block';
				textInput.value = currentValue;
			}
		}

		this.triggerChange();
	};

	// Column methods
	FunkyFormatBuilder.prototype.addColumn = function() {
		this.config.content.columns.push({ header: '', source: '', format: '' });
		this.renderColumns();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.removeColumn = function(idx) {
		this.config.content.columns.splice(idx, 1);
		this.renderColumns();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.updateColumn = function(idx, field, value) {
		var col = this.config.content.columns[idx];
		if (field === 'source') {
			col.source = value;
			delete col.value;
		} else if (field === 'value') {
			col.value = value;
			delete col.source;
		} else {
			col[field] = value;
		}

		if (field === 'header') {
			var validation = this.validateUniqueHeaders();
			if (!validation.valid) {
				console.warn('Duplicate headers detected:', validation.duplicates);
				this.highlightDuplicateHeaders(validation.duplicates);
			} else {
				this.clearHeaderHighlights();
			}
		}

		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.changeColumnFieldType = function(idx, newType) {
		var col = this.config.content.columns[idx];
		var currentValue = col.source || col.value || '';

		if (newType === 'source') {
			col.source = currentValue;
			delete col.value;

			var textInput = document.getElementById('content-input-' + idx + '-text');
			var select = document.getElementById('content-input-' + idx);
			if (textInput) textInput.style.display = 'none';
			if (select) {
				select.style.display = 'block';
				this.initSourceComboBox('content-input-' + idx, idx, null, 'content', currentValue);
			}
		} else {
			col.value = currentValue;
			delete col.source;

			var textInput = document.getElementById('content-input-' + idx + '-text');
			var select = document.getElementById('content-input-' + idx);
			if (select) {
				var instance = Funky.ComboBox.getInstance(select);
				if (instance) instance.destroy();
				select.style.display = 'none';
			}
			if (textInput) {
				textInput.style.display = 'block';
				textInput.value = currentValue;
			}
		}

		this.triggerChange();
	};

	// Initialize drag-and-drop for column reordering
	FunkyFormatBuilder.prototype.initColumnDragDrop = function() {
		var self = this;
		var container = document.getElementById('content-columns');
		if (!container) return;

		var draggedElement = null;
		var draggedIndex = null;

		var rows = container.querySelectorAll('.column-row');
		rows.forEach(function(row, idx) {
			var handle = row.querySelector('.drag-handle');
			if (!handle) return;

			handle.setAttribute('draggable', 'true');

			handle.addEventListener('dragstart', function(e) {
				draggedElement = row;
				draggedIndex = idx;
				row.style.opacity = '0.5';
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/html', row.innerHTML);
			});

			row.addEventListener('dragover', function(e) {
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';

				if (draggedElement && draggedElement !== row) {
					var rect = row.getBoundingClientRect();
					var midpoint = rect.top + rect.height / 2;

					if (e.clientY < midpoint) {
						row.style.borderTop = '2px solid #ff6b00';
						row.style.borderBottom = '';
					} else {
						row.style.borderTop = '';
						row.style.borderBottom = '2px solid #ff6b00';
					}
				}
			});

			row.addEventListener('dragleave', function() {
				row.style.borderTop = '';
				row.style.borderBottom = '';
			});

			row.addEventListener('drop', function(e) {
				e.preventDefault();
				e.stopPropagation();

				row.style.borderTop = '';
				row.style.borderBottom = '';

				if (draggedElement && draggedElement !== row) {
					var currentIdx = parseInt(row.getAttribute('data-col-idx'));

					var rect = row.getBoundingClientRect();
					var midpoint = rect.top + rect.height / 2;
					var dropBefore = e.clientY < midpoint;

					var movedColumn = self.config.content.columns.splice(draggedIndex, 1)[0];
					var insertIndex = currentIdx;

					if (draggedIndex < currentIdx && !dropBefore) {
						insertIndex = currentIdx;
					} else if (draggedIndex < currentIdx && dropBefore) {
						insertIndex = currentIdx - 1;
					} else if (draggedIndex > currentIdx && dropBefore) {
						insertIndex = currentIdx;
					} else if (draggedIndex > currentIdx && !dropBefore) {
						insertIndex = currentIdx + 1;
					}

					self.config.content.columns.splice(insertIndex, 0, movedColumn);

					self.renderColumns();
					self.triggerChange();
				}
			});

			handle.addEventListener('dragend', function() {
				if (draggedElement) {
					draggedElement.style.opacity = '';
				}

				rows.forEach(function(r) {
					r.style.borderTop = '';
					r.style.borderBottom = '';
				});

				draggedElement = null;
				draggedIndex = null;
			});
		});
	};

	// Footer line methods
	FunkyFormatBuilder.prototype.addFooterLine = function() {
		this.config.footer.lines.push([{ value: '' }]);
		this.renderFooterLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.removeFooterLine = function(lineIdx) {
		this.config.footer.lines.splice(lineIdx, 1);
		this.renderFooterLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.addFooterField = function(lineIdx) {
		this.config.footer.lines[lineIdx].push({ value: '' });
		this.renderFooterLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.removeFooterField = function(lineIdx, fieldIdx) {
		this.config.footer.lines[lineIdx].splice(fieldIdx, 1);
		if (this.config.footer.lines[lineIdx].length === 0) {
			this.config.footer.lines.splice(lineIdx, 1);
		}
		this.renderFooterLines();
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.updateFooterField = function(lineIdx, fieldIdx, value, type) {
		var field = this.config.footer.lines[lineIdx][fieldIdx];
		if (type === 'source') {
			field.source = value;
			delete field.value;
		} else {
			field.value = value;
			delete field.source;
		}
		this.triggerChange();
	};

	FunkyFormatBuilder.prototype.changeFooterFieldType = function(lineIdx, fieldIdx, newType) {
		var field = this.config.footer.lines[lineIdx][fieldIdx];
		var currentValue = field.source || field.value || '';

		if (newType === 'source') {
			field.source = currentValue;
			delete field.value;

			var textInput = document.getElementById('footer-input-' + lineIdx + '-' + fieldIdx + '-text');
			var select = document.getElementById('footer-input-' + lineIdx + '-' + fieldIdx);
			if (textInput) textInput.style.display = 'none';
			if (select) {
				select.style.display = 'block';
				this.initSourceComboBox('footer-input-' + lineIdx + '-' + fieldIdx, lineIdx, fieldIdx, 'footer', currentValue);
			}
		} else {
			field.value = currentValue;
			delete field.source;

			var textInput = document.getElementById('footer-input-' + lineIdx + '-' + fieldIdx + '-text');
			var select = document.getElementById('footer-input-' + lineIdx + '-' + fieldIdx);
			if (select) {
				var instance = Funky.ComboBox.getInstance(select);
				if (instance) instance.destroy();
				select.style.display = 'none';
			}
			if (textInput) {
				textInput.style.display = 'block';
				textInput.value = currentValue;
			}
		}

		this.triggerChange();
	};

	// Initialize ComboBox for source column selection
	FunkyFormatBuilder.prototype.initSourceComboBox = function(selectId, lineIdx, fieldIdx, section, initialValue) {
		var self = this;
		var D = Funky.Dom;
		var ComboBox = Funky.ComboBox;
		var select = document.getElementById(selectId);

		if (!select) {
			console.error('Select element not found:', selectId);
			return;
		}

		if (select.style.display === 'none') {
			console.warn('Select element is hidden, showing it first:', selectId);
			select.style.display = 'block';
		}

		var items = [];

		Object.keys(this.availableColumns.tables || {}).forEach(function(tableName) {
			var columns = self.availableColumns.tables[tableName];
			columns.forEach(function(col) {
				var id = tableName + '.' + col.name;
				items.push({
					id: id,
					name: id,
					tableName: tableName,
					columnName: col.name,
					type: col.type,
					description: col.description,
					example: col.example
				});
			});
		});

		// Destroy existing instance if any
		var existingInstance = ComboBox.getInstance(select);
		if (existingInstance) {
			existingInstance.destroy();
		}

		var dropdownParent = document.querySelector('.format-builder') || document.body;

		ComboBox.init(select, {
			placeholder: 'Select column source...',
			clearable: true,
			searchable: true,
			items: items,
			dropdownParent: dropdownParent,
			templateResult: function(item) {
				if (!item.id || item.id === '') return item.name;
				if (!item.tableName) return item.name;

				var container = D.div().class('combobox-column-option');
				var main = D.div().class('combobox-column-main').child(
					D.create('strong').text(item.id),
					D.create('span').class('combobox-column-type').text(' (' + item.type + ')')
				);
				container.child(main);

				if (item.description) {
					container.child(D.div().class('combobox-column-desc').text(item.description));
				}

				if (item.example) {
					container.child(D.div().class('combobox-column-example').text('Example: ' + item.example));
				}

				return container;
			},
			templateSelection: function(item) {
				return item.name || item.id;
			}
		});

		select.addEventListener('change', function() {
			var value = select.value;
			if (section === 'header') {
				self.updateHeaderField(lineIdx, fieldIdx, value, 'source');
			} else if (section === 'footer') {
				self.updateFooterField(lineIdx, fieldIdx, value, 'source');
			} else if (section === 'content') {
				self.updateColumn(lineIdx, 'source', value);
			}
		});

		if (initialValue) {
			var instance = ComboBox.getInstance(select);
			if (instance) {
				instance.setValue(initialValue);
			}
		}
	};

	// Utility methods
	FunkyFormatBuilder.prototype.copyPlaceholder = function(placeholder) {
		navigator.clipboard.writeText(placeholder).then(function() {
			var notification = document.createElement('div');
			notification.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
			notification.style.zIndex = '9999';
			notification.textContent = 'Copied: ' + placeholder;
			document.body.appendChild(notification);
			setTimeout(function() {
				notification.remove();
			}, 2000);
			if (Funky.Announce) {
				Funky.Announce.polite('Copied ' + placeholder + ' to clipboard');
			}
		});
	};

	FunkyFormatBuilder.prototype.copyToClipboard = function(text, event) {
		if (event) event.stopPropagation();

		navigator.clipboard.writeText(text).then(function() {
			var target = event && event.currentTarget;
			if (target) {
				var originalBg = target.style.backgroundColor;
				target.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
				setTimeout(function() {
					target.style.backgroundColor = originalBg;
				}, 300);
			}

			var notification = document.createElement('div');
			notification.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
			notification.style.zIndex = '9999';
			notification.textContent = 'Copied: ' + text;
			document.body.appendChild(notification);
			setTimeout(function() {
				notification.remove();
			}, 2000);
			if (Funky.Announce) {
				Funky.Announce.polite('Copied ' + text + ' to clipboard');
			}
		}).catch(function(err) {
			console.error('Failed to copy:', err);
			alert('Failed to copy to clipboard');
		});
	};

	FunkyFormatBuilder.prototype.getConfig = function() {
		var config = JSON.parse(JSON.stringify(this.config));

		config.content.columns = config.content.columns.filter(function(col) {
			return col.header || col.source;
		});

		if (config.header.enabled) {
			config.header.lines = config.header.lines.filter(function(line) {
				return line.some(function(field) { return field.value; });
			});
		}

		if (config.footer.enabled) {
			config.footer.lines = config.footer.lines.filter(function(line) {
				return line.some(function(field) { return field.value; });
			});
		}

		return config;
	};

	FunkyFormatBuilder.prototype.loadConfig = function(config) {
		this.config = Object.assign({
			header: { enabled: false, lines: [] },
			content: { columns: [] },
			footer: { enabled: false, lines: [] }
		}, config);

		this.render();
	};

	FunkyFormatBuilder.prototype.reset = function() {
		this.config = {
			header: { enabled: false, lines: [] },
			content: { columns: [] },
			footer: { enabled: false, lines: [] }
		};
		this.availableColumns = { primary_table: '', tables: {} };
		this.render();
	};

	FunkyFormatBuilder.prototype.fetchAvailableColumns = function(reportType) {
		var self = this;

		var apiFetch = window.Funky && window.Funky.Api ?
			function(url) { return Funky.Api.get(url); } :
			function(url) { return fetch(url).then(function(r) { return r.json(); }); };

		apiFetch('/api/report_formats/columns?report_type=' + encodeURIComponent(reportType))
			.then(function(data) {
				self.availableColumns = data;
				self.renderColumnsPanel();
			})
			.catch(function(error) {
				console.error('Error fetching available columns:', error);
			});
	};

	FunkyFormatBuilder.prototype.renderColumnsPanel = function() {
		var self = this;
		var panel = document.getElementById('available-columns-panel');
		if (!panel) return;

		if (!this.availableColumns.tables || Object.keys(this.availableColumns.tables).length === 0) {
			panel.innerHTML = '<p class="text-muted mb-0">No columns available. Select a report type first.</p>';
			return;
		}

		var html = '<div class="mb-3"><small class="text-muted">Click column name to copy, or use H/C/F buttons to insert</small></div>';

		Object.keys(this.availableColumns.tables).forEach(function(tableName) {
			var columns = self.availableColumns.tables[tableName];
			html += '<div class="column-table-group mb-3">' +
				'<div class="d-flex justify-content-between align-items-center mb-2">' +
				'<h6 class="text-warning mb-0">' + tableName + '</h6>' +
				'<button type="button" class="btn btn-xs btn-outline-success add-all-btn" ' +
				'data-table="' + tableName + '" ' +
				'title="Add all ' + tableName + ' columns to content">' +
				'<i class="fas fa-plus"></i> Add All to Content' +
				'</button>' +
				'</div>' +
				'<div class="column-list">';

			columns.forEach(function(col) {
				var fullColumnName = tableName + '.' + col.name;
				html += '<div class="column-item" title="Click to copy: ' + fullColumnName + '">' +
					'<div class="column-info" data-column="' + fullColumnName + '">' +
					'<code>' + fullColumnName + '</code>' +
					'<small class="text-muted d-block">' + col.description + '</small>' +
					'</div>' +
					'<div class="column-item-actions">' +
					'<button type="button" class="btn btn-xs btn-outline-primary insert-header-btn" ' +
					'data-column="' + fullColumnName + '" ' +
					'title="Add to Header">H</button>' +
					'<button type="button" class="btn btn-xs btn-outline-success insert-content-btn" ' +
					'data-column="' + fullColumnName + '" ' +
					'title="Add to Content">C</button>' +
					'<button type="button" class="btn btn-xs btn-outline-warning insert-footer-btn" ' +
					'data-column="' + fullColumnName + '" ' +
					'title="Add to Footer">F</button>' +
					'</div>' +
					'</div>';
			});

			html += '</div></div>';
		});

		panel.innerHTML = html;

		// Attach event handlers
		panel.querySelectorAll('.column-info').forEach(function(el) {
			el.addEventListener('click', function(e) {
				self.copyToClipboard(this.getAttribute('data-column'), e);
			});
		});

		panel.querySelectorAll('.insert-header-btn').forEach(function(btn) {
			btn.addEventListener('click', function(e) {
				e.stopPropagation();
				self.insertIntoHeader(this.getAttribute('data-column'));
			});
		});

		panel.querySelectorAll('.insert-content-btn').forEach(function(btn) {
			btn.addEventListener('click', function(e) {
				e.stopPropagation();
				self.insertIntoContent(this.getAttribute('data-column'));
			});
		});

		panel.querySelectorAll('.insert-footer-btn').forEach(function(btn) {
			btn.addEventListener('click', function(e) {
				e.stopPropagation();
				self.insertIntoFooter(this.getAttribute('data-column'));
			});
		});

		panel.querySelectorAll('.add-all-btn').forEach(function(btn) {
			btn.addEventListener('click', function(e) {
				e.stopPropagation();
				self.addAllToContent(this.getAttribute('data-table'));
			});
		});
	};

	FunkyFormatBuilder.prototype.insertIntoHeader = function(columnName) {
		if (!this.config.header.enabled) {
			this.config.header.enabled = true;
			document.getElementById('header-enabled').checked = true;
			document.getElementById('header-controls').style.display = '';
			document.getElementById('header-body').style.display = '';
		}

		if (this.config.header.lines.length === 0) {
			this.config.header.lines.push([{ source: columnName }]);
		} else {
			this.config.header.lines[this.config.header.lines.length - 1].push({ source: columnName });
		}

		this.renderHeaderLines();
		this.triggerChange();

		var headerSection = document.querySelector('#header-body');
		if (headerSection) {
			headerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			headerSection.style.backgroundColor = 'rgba(255, 153, 0, 0.1)';
			setTimeout(function() { headerSection.style.backgroundColor = ''; }, 500);
		}
	};

	FunkyFormatBuilder.prototype.insertIntoContent = function(columnName) {
		var headerName = columnName.split('.').pop();

		this.config.content.columns.push({
			header: headerName,
			source: columnName,
			format: ''
		});

		this.renderColumns();
		this.triggerChange();

		setTimeout(function() {
			var columns = document.querySelectorAll('.column-row');
			if (columns.length > 0) {
				var lastColumn = columns[columns.length - 1];
				lastColumn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				lastColumn.style.backgroundColor = 'rgba(255, 153, 0, 0.1)';
				setTimeout(function() { lastColumn.style.backgroundColor = ''; }, 500);
			}
		}, 100);
	};

	FunkyFormatBuilder.prototype.addAllToContent = function(tableName) {
		var self = this;
		if (!this.availableColumns.tables || !this.availableColumns.tables[tableName]) {
			return;
		}

		var columns = this.availableColumns.tables[tableName];
		var addedCount = 0;

		columns.forEach(function(col) {
			var fullColumnName = tableName + '.' + col.name;
			var headerName = col.name;

			self.config.content.columns.push({
				header: headerName,
				source: fullColumnName,
				format: ''
			});
			addedCount++;
		});

		this.renderColumns();
		this.triggerChange();

		var contentSection = document.querySelector('#content-body');
		if (contentSection) {
			contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			contentSection.style.backgroundColor = 'rgba(255, 153, 0, 0.1)';
			setTimeout(function() { contentSection.style.backgroundColor = ''; }, 800);
		}

		console.log('Added ' + addedCount + ' columns from ' + tableName + ' to content');
	};

	FunkyFormatBuilder.prototype.validateUniqueHeaders = function() {
		var headers = this.config.content.columns.map(function(col) { return col.header; }).filter(function(h) { return h && h.trim(); });
		var headerCounts = {};
		var duplicates = [];

		headers.forEach(function(header) {
			headerCounts[header] = (headerCounts[header] || 0) + 1;
			if (headerCounts[header] === 2) {
				duplicates.push(header);
			}
		});

		if (duplicates.length > 0) {
			return {
				valid: false,
				message: 'Duplicate headers found: ' + duplicates.join(', ') + '. All content column headers must be unique.',
				duplicates: duplicates
			};
		}

		return { valid: true };
	};

	FunkyFormatBuilder.prototype.highlightDuplicateHeaders = function(duplicates) {
		var columnRows = document.querySelectorAll('.column-row');
		columnRows.forEach(function(row) {
			var headerInput = row.querySelector('.column-header-input');
			if (headerInput && duplicates.indexOf(headerInput.value) !== -1) {
				headerInput.style.borderColor = '#dc3545';
				headerInput.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
			}
		});
	};

	FunkyFormatBuilder.prototype.clearHeaderHighlights = function() {
		var columnRows = document.querySelectorAll('.column-row');
		columnRows.forEach(function(row) {
			var headerInput = row.querySelector('.column-header-input');
			if (headerInput) {
				headerInput.style.borderColor = '';
				headerInput.style.backgroundColor = '';
			}
		});
	};

	FunkyFormatBuilder.prototype.insertIntoFooter = function(columnName) {
		if (!this.config.footer.enabled) {
			this.config.footer.enabled = true;
			document.getElementById('footer-enabled').checked = true;
			document.getElementById('footer-controls').style.display = '';
			document.getElementById('footer-body').style.display = '';
		}

		if (this.config.footer.lines.length === 0) {
			this.config.footer.lines.push([{ source: columnName }]);
		} else {
			this.config.footer.lines[this.config.footer.lines.length - 1].push({ source: columnName });
		}

		this.renderFooterLines();
		this.triggerChange();

		var footerSection = document.querySelector('#footer-body');
		if (footerSection) {
			footerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			footerSection.style.backgroundColor = 'rgba(255, 153, 0, 0.1)';
			setTimeout(function() { footerSection.style.backgroundColor = ''; }, 500);
		}
	};

	FunkyFormatBuilder.prototype.insertColumn = function(source) {
		// Deprecated - kept for backwards compatibility
		this.insertIntoContent(source);
	};

	FunkyFormatBuilder.prototype.triggerChange = function() {
		var event = new CustomEvent('funky.format-builder.change', { detail: this.getConfig() });
		document.dispatchEvent(event);
	};

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('FormatBuilder');

	// Factory for creating FormatBuilder instances
	var FormatBuilderFactory = {
		/**
		 * Create a new FormatBuilder instance (primary factory method)
		 * @param {string} containerId - Container element ID
		 * @returns {FunkyFormatBuilder}
		 */
		init: function(containerId) {
			var instance = new FunkyFormatBuilder(containerId);
			_instances.register(containerId, instance);
			return instance;
		},

		/**
		 * @deprecated Use FormatBuilder.init() instead
		 */
		create: function(containerId) {
			if (Funky.debug) {
				console.warn('[Funky.FormatBuilder] create() is deprecated. Use init() instead.');
			}
			return FormatBuilderFactory.init(containerId);
		},

		/**
		 * Get existing instance by container ID
		 * @param {string} containerId - Container ID
		 * @returns {FunkyFormatBuilder|undefined}
		 */
		getInstance: function(containerId) {
			return _instances.get(containerId);
		},

		/**
		 * Destroy instance by container ID
		 * @param {string} containerId - Container ID
		 */
		destroy: function(containerId) {
			var instance = _instances.get(containerId);
			if (instance) {
				if (instance.container) {
					instance.container.innerHTML = '';
				}
				_instances.unregister(containerId);
			}
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		constructor: FunkyFormatBuilder
	};

	// Register with Funky namespace
	Funky.register('FormatBuilder', FormatBuilderFactory);

})(window);
