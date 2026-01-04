/**
 * Funky Conditional Formatting - DataTable Cell Formatting Rules
 * 
 * Applies conditional formatting rules to DataTable cells with:
 * - Multiple condition types (equals, contains, numeric comparisons)
 * - Various style presets (colors, backgrounds, icons)
 * - Rule persistence via localStorage and API
 * - Modal UI for rule management
 * 
 * Usage:
 *   var formatting = Funky.ConditionalFormatting.init('myTable', [
 *     { data: 'status', title: 'Status' },
 *     { data: 'amount', title: 'Amount' }
 *   ]);
 *   
 *   formatting.addRule({
 *     column: 'status',
 *     condition: 'equals',
 *     value: 'Closed',
 *     style: 'positive'
 *   });
 * 
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.ConditionalFormatting] Registry not found. Load namespace.js first.');
		return;
	}

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('ConditionalFormatting');

	var STORAGE_KEY = 'conditional_formatting';

	// Condition types
	var CONDITIONS = {
		equals: { label: 'Equals', needsValue: true },
		notEquals: { label: 'Not Equals', needsValue: true },
		contains: { label: 'Contains', needsValue: true },
		notContains: { label: 'Not Contains', needsValue: true },
		greaterThan: { label: 'Greater Than', needsValue: true, numeric: true },
		lessThan: { label: 'Less Than', needsValue: true, numeric: true },
		greaterOrEqual: { label: 'Greater or Equal', needsValue: true, numeric: true },
		lessOrEqual: { label: 'Less or Equal', needsValue: true, numeric: true },
		between: { label: 'Between', needsValue: true, needsValue2: true, numeric: true },
		isEmpty: { label: 'Is Empty', needsValue: false },
		isNotEmpty: { label: 'Is Not Empty', needsValue: false }
	};

	// Style types
	var STYLES = {
		positive: { label: 'Positive (Green)', class: 'cf-positive' },
		positiveBg: { label: 'Positive Background', class: 'cf-positive-bg' },
		negative: { label: 'Negative (Red)', class: 'cf-negative' },
		negativeBg: { label: 'Negative Background', class: 'cf-negative-bg' },
		warning: { label: 'Warning (Orange)', class: 'cf-warning' },
		warningBg: { label: 'Warning Background', class: 'cf-warning-bg' },
		neutral: { label: 'Neutral (Gray)', class: 'cf-neutral' },
		highlight: { label: 'Highlight (Blue)', class: 'cf-highlight' },
		highlightBg: { label: 'Highlight Background', class: 'cf-highlight-bg' },
		bold: { label: 'Bold', class: 'cf-bold' },
		muted: { label: 'Muted', class: 'cf-muted' },
		italic: { label: 'Italic', class: 'cf-italic' },
		strikethrough: { label: 'Strikethrough', class: 'cf-strikethrough' },
		iconUp: { label: 'Icon ▲ Up', class: 'cf-icon-up' },
		iconDown: { label: 'Icon ▼ Down', class: 'cf-icon-down' },
		iconCheck: { label: 'Icon ✓ Check', class: 'cf-icon-check' },
		iconX: { label: 'Icon ✗ X', class: 'cf-icon-x' }
	};

	/**
	 * FunkyConditionalFormatting Constructor
	 * @param {string} tableId - ID of the table element
	 * @param {Array} columns - Array of { data: 'columnName', title: 'Column Title' }
	 */
	function FunkyConditionalFormatting(tableId, columns) {
		this.tableId = tableId;
		this.table = null;
		this.columns = columns || [];
		this.rules = [];
		this.modalId = 'formatRulesModal-' + tableId;

		// Register instance
		_instances.register(tableId, this);

		this._initFormatting();
	}

	/**
	 * Initialize conditional formatting
	 */
	FunkyConditionalFormatting.prototype._initFormatting = function() {
		var self = this;

		this.loadRules();

		// Wait for DataTable
		if (jQuery.fn.DataTable.isDataTable('#' + this.tableId)) {
			this.table = jQuery('#' + this.tableId).DataTable();
			this.applyFormattingToAll();
			this.bindEvents();
		} else {
			setTimeout(function() {
				if (jQuery.fn.DataTable.isDataTable('#' + self.tableId)) {
					self.table = jQuery('#' + self.tableId).DataTable();
					self.applyFormattingToAll();
					self.bindEvents();
				}
			}, 500);
		}
	};

	/**
	 * Bind DataTable events
	 */
	FunkyConditionalFormatting.prototype.bindEvents = function() {
		var self = this;
		if (!this.table) return;

		// Apply formatting on draw
		this.table.on('draw.dt', function() {
			self.applyFormattingToAll();
		});
	};

	/**
	 * Load rules from user preferences API with localStorage fallback
	 */
	FunkyConditionalFormatting.prototype.loadRules = function() {
		var self = this;

		// First load from localStorage for immediate display
		try {
			var allRules = Funky.Storage.get(STORAGE_KEY, {});
			this.rules = allRules[this.tableId] || [];
		} catch (e) {
			console.warn('[Funky.ConditionalFormatting] Error loading from localStorage', e);
			this.rules = [];
		}

		// Then sync from user preferences API
		if (Funky.Preferences && Funky.Preferences.loaded) {
			this.syncFromPreferences();
		} else {
			var checkPrefs = setInterval(function() {
				if (Funky.Preferences && Funky.Preferences.loaded) {
					clearInterval(checkPrefs);
					self.syncFromPreferences();
				}
			}, 100);
			setTimeout(function() { clearInterval(checkPrefs); }, 5000);
		}
	};

	/**
	 * Sync rules from user preferences to localStorage
	 */
	FunkyConditionalFormatting.prototype.syncFromPreferences = function() {
		var self = this;
		try {
			var tables = Funky.Preferences.get('tables') || {};
			var formattingRules = tables.conditional_formatting || {};

			if (formattingRules[this.tableId] && Array.isArray(formattingRules[this.tableId])) {
				var allRules = Funky.Storage.get(STORAGE_KEY, {});
				allRules[this.tableId] = formattingRules[this.tableId];
				Funky.Storage.set(STORAGE_KEY, allRules);

				if (JSON.stringify(this.rules) !== JSON.stringify(formattingRules[this.tableId])) {
					this.rules = formattingRules[this.tableId];
					this.applyFormattingToAll();
				}
			}
		} catch (e) {
			console.warn('[Funky.ConditionalFormatting] Error syncing from preferences', e);
		}
	};

	/**
	 * Save rules to both localStorage and user preferences API
	 */
	FunkyConditionalFormatting.prototype.saveRules = function() {
		try {
			var allRules = Funky.Storage.get(STORAGE_KEY, {});
			allRules[this.tableId] = this.rules;
			Funky.Storage.set(STORAGE_KEY, allRules);
		} catch (e) {
			console.warn('[Funky.ConditionalFormatting] Error saving to localStorage', e);
		}

		this.saveToPreferences();
	};

	/**
	 * Save rules to user preferences API
	 */
	FunkyConditionalFormatting.prototype.saveToPreferences = function() {
		if (!Funky.Preferences) {
			console.warn('[Funky.ConditionalFormatting] Funky.Preferences not available');
			return;
		}

		try {
			var tables = Funky.Preferences.get('tables') || {};
			if (!tables.conditional_formatting) {
				tables.conditional_formatting = {};
			}
			tables.conditional_formatting[this.tableId] = this.rules;

			Funky.Preferences.save('tables', tables).catch(function(error) {
				console.warn('[Funky.ConditionalFormatting] Error saving to preferences API', error);
			});
		} catch (e) {
			console.warn('[Funky.ConditionalFormatting] Error preparing preferences save', e);
		}
	};

	/**
	 * Get all formatting rules across all tables (static method)
	 */
	FunkyConditionalFormatting.getAllRules = function() {
		try {
			return Funky.Storage.get(STORAGE_KEY, {});
		} catch (e) {
			console.warn('[Funky.ConditionalFormatting] Error getting all rules', e);
			return {};
		}
	};

	/**
	 * Set all formatting rules (static method for settings page)
	 */
	FunkyConditionalFormatting.setAllRules = function(allRules) {
		try {
			Funky.Storage.set(STORAGE_KEY, allRules);

			if (Funky.Preferences) {
				var tables = Funky.Preferences.get('tables') || {};
				tables.conditional_formatting = allRules;
				Funky.Preferences.save('tables', tables);
			}
		} catch (e) {
			console.warn('[Funky.ConditionalFormatting] Error setting all rules', e);
		}
	};

	/**
	 * Get available conditions (static method)
	 */
	FunkyConditionalFormatting.getConditions = function() {
		return CONDITIONS;
	};

	/**
	 * Get available styles (static method)
	 */
	FunkyConditionalFormatting.getStyles = function() {
		return STYLES;
	};

	/**
	 * Add a new rule
	 */
	FunkyConditionalFormatting.prototype.addRule = function(rule) {
		rule.id = 'rule-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
		rule.enabled = rule.enabled !== false;
		this.rules.push(rule);
		this.saveRules();
		this.applyFormattingToAll();
		if (Funky.Announce) {
			Funky.Announce.polite('Formatting rule added');
		}
		return rule;
	};

	/**
	 * Update a rule
	 */
	FunkyConditionalFormatting.prototype.updateRule = function(ruleId, updates) {
		var rule = this.rules.find(function(r) { return r.id === ruleId; });
		if (rule) {
			Object.assign(rule, updates);
			this.saveRules();
			this.applyFormattingToAll();
		}
	};

	/**
	 * Delete a rule
	 */
	FunkyConditionalFormatting.prototype.deleteRule = function(ruleId) {
		this.rules = this.rules.filter(function(r) { return r.id !== ruleId; });
		this.saveRules();
		this.applyFormattingToAll();
		if (Funky.Announce) {
			Funky.Announce.polite('Formatting rule deleted');
		}
	};

	/**
	 * Toggle a rule's enabled state
	 */
	FunkyConditionalFormatting.prototype.toggleRule = function(ruleId) {
		var rule = this.rules.find(function(r) { return r.id === ruleId; });
		if (rule) {
			rule.enabled = !rule.enabled;
			this.saveRules();
			this.applyFormattingToAll();
			if (Funky.Announce) {
				Funky.Announce.polite('Rule ' + (rule.enabled ? 'enabled' : 'disabled'));
			}
		}
	};

	/**
	 * Evaluate a rule against a cell value
	 */
	FunkyConditionalFormatting.prototype.evaluateRule = function(rule, cellValue, rowData) {
		if (!rule.enabled) return false;

		var value = cellValue;
		var compareValue = rule.value;
		var compareValue2 = rule.value2;

		// Extract text if HTML
		if (typeof value === 'string' && value.indexOf('<') !== -1) {
			var temp = document.createElement('div');
			temp.innerHTML = value;
			value = temp.textContent || temp.innerText || '';
		}

		// Handle numeric comparisons
		var condition = CONDITIONS[rule.condition];
		if (condition && condition.numeric) {
			value = parseFloat(String(value).replace(/[$£€¥,\s]/g, ''));
			compareValue = parseFloat(compareValue);
			if (rule.condition === 'between') {
				compareValue2 = parseFloat(compareValue2);
			}
		}

		switch (rule.condition) {
			case 'equals':
				return String(value).toLowerCase() === String(compareValue).toLowerCase();
			case 'notEquals':
				return String(value).toLowerCase() !== String(compareValue).toLowerCase();
			case 'contains':
				return String(value).toLowerCase().indexOf(String(compareValue).toLowerCase()) !== -1;
			case 'notContains':
				return String(value).toLowerCase().indexOf(String(compareValue).toLowerCase()) === -1;
			case 'greaterThan':
				return !isNaN(value) && value > compareValue;
			case 'lessThan':
				return !isNaN(value) && value < compareValue;
			case 'greaterOrEqual':
				return !isNaN(value) && value >= compareValue;
			case 'lessOrEqual':
				return !isNaN(value) && value <= compareValue;
			case 'between':
				return !isNaN(value) && value >= compareValue && value <= compareValue2;
			case 'isEmpty':
				return value === null || value === undefined || String(value).trim() === '';
			case 'isNotEmpty':
				return value !== null && value !== undefined && String(value).trim() !== '';
			default:
				return false;
		}
	};

	/**
	 * Get column index from column name
	 */
	FunkyConditionalFormatting.prototype.getColumnIndex = function(columnName) {
		if (typeof columnName === 'number') return columnName;

		var idx = -1;
		var self = this;
		this.table.columns().every(function(i) {
			var col = this;
			var header = col.header().textContent.trim();
			if (col.dataSrc() === columnName || header.toLowerCase() === columnName.toLowerCase()) {
				idx = i;
				return false;
			}
		});
		return idx;
	};

	/**
	 * Clear formatting from a cell
	 */
	FunkyConditionalFormatting.prototype.clearFormatting = function(cell) {
		var classes = cell.className.split(' ').filter(function(c) {
			return !c.startsWith('cf-');
		});
		cell.className = classes.join(' ');
		cell.removeAttribute('data-bar-width');
	};

	/**
	 * Apply formatting styles to a cell
	 */
	FunkyConditionalFormatting.prototype.applyFormatting = function(cell, styles) {
		styles.forEach(function(styleName) {
			var style = STYLES[styleName];
			if (style) {
				cell.classList.add(style.class);
			}
		});
	};

	/**
	 * Apply formatting to all visible rows
	 */
	FunkyConditionalFormatting.prototype.applyFormattingToAll = function() {
		if (!this.table) return;

		var self = this;
		var enabledRules = this.rules.filter(function(r) { return r.enabled; });

		if (enabledRules.length === 0) return;

		// Build column info mapping
		var columnInfo = {};
		enabledRules.forEach(function(rule) {
			var colIdx = self.getColumnIndex(rule.column);
			if (colIdx !== -1) {
				var colSettings = self.table.settings()[0].aoColumns[colIdx];
				var dataSrc = colSettings.mData || colSettings.data || rule.column;
				columnInfo[rule.column] = { idx: colIdx, dataSrc: dataSrc };
			}
		});

		// Process each visible row
		this.table.rows({ page: 'current' }).every(function(rowIdx) {
			var row = this;
			var rowData = row.data();

			enabledRules.forEach(function(rule) {
				var info = columnInfo[rule.column];
				if (!info) return;

				var cellValue;
				if (typeof rowData === 'object' && !Array.isArray(rowData)) {
					cellValue = rowData[info.dataSrc];
				} else {
					cellValue = rowData[info.idx];
				}

				var cellNode = self.table.cell(rowIdx, info.idx).node();

				if (!cellNode) return;

				self.clearFormatting(cellNode);

				if (self.evaluateRule(rule, cellValue, rowData)) {
					self.applyFormatting(cellNode, [rule.style]);
				}
			});
		});
	};

	/**
	 * Show the rules modal
	 */
	FunkyConditionalFormatting.prototype.showModal = function() {
		var self = this;
		var existingModal = document.getElementById(this.modalId);
		if (existingModal) existingModal.remove();

		var rulesHtml = '';

		if (this.rules.length === 0) {
			rulesHtml = '<div class="format-rules-empty" role="status">' +
				'<div class="format-rules-empty-icon" aria-hidden="true">🎨</div>' +
				'<h4>No formatting rules yet</h4>' +
				'<p>Create rules to automatically highlight cells based on their values.</p>' +
				'</div>';
		} else {
			rulesHtml = '<div class="format-rules-list" role="list" aria-label="Formatting rules">';
			this.rules.forEach(function(rule) {
				rulesHtml += self.renderRuleItem(rule);
			});
			rulesHtml += '</div>';
		}

		var modalTitleId = 'formatRulesModalTitle-' + this.tableId;
		var modalHtml = '<div class="modal fade modal-slide-panel modal-slide-panel-lg format-rules-modal" id="' + this.modalId + '" tabindex="-1" role="dialog" aria-labelledby="' + modalTitleId + '">' +
			'<div class="modal-dialog">' +
			'<div class="modal-content">' +
			'<div class="modal-header">' +
			'<h5 class="modal-title" id="' + modalTitleId + '"><span aria-hidden="true">🎨</span> Format Rules</h5>' +
			'<button type="button" class="btn-close" data-funky-modal-close aria-label="Close"></button>' +
			'</div>' +
			'<div class="modal-body">' +
			rulesHtml +
			'<button type="button" class="add-rule-btn" id="addRuleBtn-' + this.tableId + '">' +
			'<span aria-hidden="true">➕</span> Add New Rule' +
			'</button>' +
			'</div>' +
			'<div class="modal-footer">' +
			'<button type="button" class="btn btn-secondary" data-funky-modal-close>Close</button>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';

		document.body.insertAdjacentHTML('beforeend', modalHtml);

		var modalEl = document.getElementById(this.modalId);
		var modal = Funky.Modal.getOrCreateInstance(modalEl);

		// Bind close buttons
		modalEl.querySelectorAll('[data-funky-modal-close]').forEach(function(btn) {
			btn.addEventListener('click', function() {
				modal.hide();
			});
		});

		this.bindModalEvents(modal);
		modal.show();
	};

	/**
	 * Render a rule item for the modal
	 */
	FunkyConditionalFormatting.prototype.renderRuleItem = function(rule) {
		var conditionDef = CONDITIONS[rule.condition] || {};
		var styleDef = STYLES[rule.style] || {};
		var ruleNum = this.rules.indexOf(rule) + 1;
		var toggleId = 'rule-toggle-' + rule.id;
		var columnId = 'rule-column-' + rule.id;
		var conditionId = 'rule-condition-' + rule.id;
		var valueId = 'rule-value-' + rule.id;
		var styleId = 'rule-style-' + rule.id;

		var html = '<div class="format-rule-item' + (rule.enabled ? '' : ' disabled') + '" data-rule-id="' + rule.id + '" role="listitem" aria-label="Formatting rule ' + ruleNum + '">' +
			'<div class="format-rule-header">' +
			'<div class="format-rule-toggle">' +
			'<input type="checkbox" class="form-check-input rule-enabled-toggle" id="' + toggleId + '" ' + (rule.enabled ? 'checked' : '') + '>' +
			'<label for="' + toggleId + '">' + (rule.enabled ? 'Enabled' : 'Disabled') + '</label>' +
			'</div>' +
			'<div class="format-rule-actions">' +
			'<button class="delete-rule" title="Delete" aria-label="Delete rule ' + ruleNum + '"><span aria-hidden="true">🗑️</span></button>' +
			'</div>' +
			'</div>' +
			'<div class="format-rule-builder">' +
			'<div class="format-rule-field">' +
			'<label for="' + columnId + '">Column</label>' +
			'<select class="rule-column" id="' + columnId + '">' + this.getColumnOptions(rule.column) + '</select>' +
			'</div>' +
			'<div class="format-rule-field">' +
			'<label for="' + conditionId + '">Condition</label>' +
			'<select class="rule-condition" id="' + conditionId + '">' + this.getConditionOptions(rule.condition) + '</select>' +
			'</div>' +
			'<div class="format-rule-field rule-value-field' + (conditionDef.needsValue === false ? ' d-none' : '') + '">' +
			'<label for="' + valueId + '">Value</label>' +
			'<input type="text" class="rule-value" id="' + valueId + '" value="' + Funky.Util.escapeHtml(rule.value || '') + '">' +
			'</div>' +
			'<div class="format-rule-field">' +
			'<label for="' + styleId + '">Style</label>' +
			'<select class="rule-style" id="' + styleId + '">' + this.getStyleOptions(rule.style) + '</select>' +
			'</div>' +
			'</div>' +
			'<div class="format-rule-preview">' +
			'<span class="format-rule-preview-label">Preview:</span>' +
			'<span class="format-rule-preview-sample ' + (styleDef.class || '') + '">Sample Value</span>' +
			'</div>' +
			'</div>';

		return html;
	};

	/**
	 * Get column options for select
	 */
	FunkyConditionalFormatting.prototype.getColumnOptions = function(selected) {
		var self = this;
		var html = '<option value="">Select column...</option>';

		if (this.table) {
			this.table.columns().every(function(idx) {
				var header = this.header().textContent.trim();
				var colSettings = self.table.settings()[0].aoColumns[idx];
				var dataSrc = colSettings.mData || colSettings.data || idx;
				if (header && header !== '' && dataSrc) {
					var isSelected = selected === dataSrc || selected === header || selected === idx;
					html += '<option value="' + dataSrc + '"' + (isSelected ? ' selected' : '') + '>' + Funky.Util.escapeHtml(header) + '</option>';
				}
			});
		}

		return html;
	};

	/**
	 * Get condition options for select
	 */
	FunkyConditionalFormatting.prototype.getConditionOptions = function(selected) {
		var html = '';
		Object.keys(CONDITIONS).forEach(function(key) {
			html += '<option value="' + key + '"' + (selected === key ? ' selected' : '') + '>' + CONDITIONS[key].label + '</option>';
		});
		return html;
	};

	/**
	 * Get style options for select
	 */
	FunkyConditionalFormatting.prototype.getStyleOptions = function(selected) {
		var html = '';
		Object.keys(STYLES).forEach(function(key) {
			html += '<option value="' + key + '"' + (selected === key ? ' selected' : '') + '>' + STYLES[key].label + '</option>';
		});
		return html;
	};

	/**
	 * Bind modal events
	 */
	FunkyConditionalFormatting.prototype.bindModalEvents = function(modal) {
		var self = this;
		var modalEl = document.getElementById(this.modalId);

		// Add new rule
		document.getElementById('addRuleBtn-' + this.tableId).addEventListener('click', function() {
			self.addRule({
				column: '',
				condition: 'equals',
				value: '',
				style: 'highlight',
				enabled: true
			});

			modal.hide();
			self.showModal();
		});

		// Delegate events
		modalEl.addEventListener('change', function(e) {
			var ruleItem = e.target.closest('.format-rule-item');
			if (!ruleItem) return;

			var ruleId = ruleItem.dataset.ruleId;

			if (e.target.classList.contains('rule-enabled-toggle')) {
				self.toggleRule(ruleId);
				ruleItem.classList.toggle('disabled');
				ruleItem.querySelector('.format-rule-toggle label').textContent = e.target.checked ? 'Enabled' : 'Disabled';
			} else if (e.target.classList.contains('rule-column') ||
				e.target.classList.contains('rule-condition') ||
				e.target.classList.contains('rule-style')) {
				self.updateRuleFromUI(ruleItem, ruleId);
			}

			if (e.target.classList.contains('rule-style')) {
				var styleDef = STYLES[e.target.value] || {};
				var preview = ruleItem.querySelector('.format-rule-preview-sample');
				preview.className = 'format-rule-preview-sample ' + (styleDef.class || '');
			}

			if (e.target.classList.contains('rule-condition')) {
				var condDef = CONDITIONS[e.target.value] || {};
				var valueField = ruleItem.querySelector('.rule-value-field');
				if (condDef.needsValue === false) {
					valueField.classList.add('d-none');
				} else {
					valueField.classList.remove('d-none');
				}
			}
		});

		modalEl.addEventListener('input', function(e) {
			if (e.target.classList.contains('rule-value')) {
				var ruleItem = e.target.closest('.format-rule-item');
				if (ruleItem) {
					self.updateRuleFromUI(ruleItem, ruleItem.dataset.ruleId);
				}
			}
		});

		modalEl.addEventListener('click', function(e) {
			if (e.target.classList.contains('delete-rule') || e.target.closest('.delete-rule')) {
				var ruleItem = e.target.closest('.format-rule-item');
				if (ruleItem && confirm('Delete this rule?')) {
					self.deleteRule(ruleItem.dataset.ruleId);
					ruleItem.remove();

					if (self.rules.length === 0) {
						var list = modalEl.querySelector('.format-rules-list');
						if (list) {
							list.outerHTML = '<div class="format-rules-empty" role="status">' +
								'<div class="format-rules-empty-icon" aria-hidden="true">🎨</div>' +
								'<h4>No formatting rules yet</h4>' +
								'<p>Create rules to automatically highlight cells based on their values.</p>' +
								'</div>';
						}
					}
				}
			}
		});
	};

	/**
	 * Update rule from UI elements
	 */
	FunkyConditionalFormatting.prototype.updateRuleFromUI = function(ruleItem, ruleId) {
		var column = ruleItem.querySelector('.rule-column').value;
		var condition = ruleItem.querySelector('.rule-condition').value;
		var value = ruleItem.querySelector('.rule-value').value;
		var style = ruleItem.querySelector('.rule-style').value;

		this.updateRule(ruleId, {
			column: column,
			condition: condition,
			value: value,
			style: style
		});
	};

	/**
	 * Create a button to open the rules modal
	 */
	FunkyConditionalFormatting.prototype.createButton = function() {
		var self = this;
		var D = Funky.Dom;
		var btn = document.createElement('button');
		btn.className = 'btn-format-rules';
		var iconSpan = document.createElement('span');
		iconSpan.setAttribute('aria-hidden', 'true');
		iconSpan.textContent = '🎨 ';
		btn.append(iconSpan, D.span().text('Format').el);
		if (this.rules.length > 0) {
			btn.classList.add('has-rules');
			var countSpan = D.span().class('rule-count').text(this.rules.length).el;
			countSpan.setAttribute('aria-hidden', 'true');
			btn.append(' ', countSpan);
			btn.setAttribute('aria-label', 'Conditional Formatting Rules (' + this.rules.length + ' active)');
		} else {
			btn.setAttribute('aria-label', 'Conditional Formatting Rules');
		}
		btn.title = 'Conditional Formatting Rules';
		btn.addEventListener('click', function() {
			self.showModal();
		});
		return btn;
	};

	/**
	 * Get enabled rule count
	 */
	FunkyConditionalFormatting.prototype.getRuleCount = function() {
		return this.rules.filter(function(r) { return r.enabled; }).length;
	};

	/**
	 * Destroy this instance
	 */
	FunkyConditionalFormatting.prototype.destroy = function() {
		// Remove modal if exists
		var modal = document.getElementById(this.modalId);
		if (modal) {
			modal.remove();
		}

		// Clear rules from table
		if (this.table) {
			var self = this;
			this.table.rows().every(function() {
				var row = this.node();
				if (row) {
					var cells = row.querySelectorAll('td');
					cells.forEach(function(cell) {
						self.clearFormatting(cell);
					});
				}
			});
		}

		// Unregister
		_instances.unregister(this.tableId);
	};

	// ============================================
	// Factory Methods (Static API)
	// ============================================

	/**
	 * Create a new ConditionalFormatting instance (primary factory method)
	 * @param {string} tableId - ID of the table element
	 * @param {Array} columns - Array of column configs
	 * @returns {FunkyConditionalFormatting}
	 */
	FunkyConditionalFormatting.init = function(tableId, columns) {
		return new FunkyConditionalFormatting(tableId, columns);
	};

	/**
	 * @deprecated Use ConditionalFormatting.init() instead
	 */
	FunkyConditionalFormatting.create = function(tableId, columns) {
		if (Funky.debug) {
			console.warn('[Funky.ConditionalFormatting] create() is deprecated. Use init() instead.');
		}
		return FunkyConditionalFormatting.init(tableId, columns);
	};

	/**
	 * Get existing instance by table ID
	 * @param {string} tableId - Table ID
	 * @returns {FunkyConditionalFormatting|undefined}
	 */
	FunkyConditionalFormatting.getInstance = function(tableId) {
		return _instances.get(tableId);
	};

	/**
	 * Destroy instance by table ID
	 * @param {string} tableId - Table ID
	 */
	FunkyConditionalFormatting.destroy = function(tableId) {
		var instance = _instances.get(tableId);
		if (instance) {
			instance.destroy();
		}
	};

	/**
	 * Destroy all instances
	 */
	FunkyConditionalFormatting.destroyAll = function() {
		_instances.destroyAll();
	};

	// Register constructor directly with Funky namespace (allows `new Funky.ConditionalFormatting()`)
	Funky.register('ConditionalFormatting', FunkyConditionalFormatting);

})(window);
