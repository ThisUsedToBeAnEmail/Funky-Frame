/**
 * Funky.Form.FieldRegistry - Field type registration system
 *
 * Provides extensible, pluggable field types for Funky.Form.
 * Includes BaseField class that all field types extend.
 *
 * @module Funky.Form.FieldRegistry
 * @version 1.0.3
 * @requires Funky.Dom
 */
(function(global) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.Form && Funky.Form.FieldRegistry) {
		return;
	}

	var D = global.Funky && global.Funky.Dom;

	// =========================================================================
	// BASE FIELD CLASS
	// =========================================================================

	/**
	 * BaseField - Abstract base class for all field types
	 * @param {Object} config - Field configuration
	 * @param {Form} form - Parent form instance
	 */
	function BaseField(config, form) {
		this.form = form;
		this.name = config.name;
		this.config = config;

		// DOM element wrappers (internal - use getters for raw elements)
		this._element = null;
		this._inputElement = null;
		this._errorElement = null;
		this._labelElement = null;
		this._inputWrapper = null;

		// State
		this._value = config.defaultValue !== undefined ? config.defaultValue : null;
		this._pristine = true;
		this._valid = true;
		this._visible = config.visible !== false;
		this._enabled = config.disabled !== true;
		this._readonly = config.readonly === true;
	}

	// Helper to unwrap Funky.Dom wrapper to raw DOM element
	function unwrapEl(el) {
		return el && el.el ? el.el : el;
	}

	// Define getters that return raw DOM elements for external access
	Object.defineProperty(BaseField.prototype, 'element', {
		get: function() { return unwrapEl(this._element); },
		set: function(v) { this._element = v; }
	});
	Object.defineProperty(BaseField.prototype, 'inputElement', {
		get: function() { return unwrapEl(this._inputElement); },
		set: function(v) { this._inputElement = v; }
	});
	Object.defineProperty(BaseField.prototype, 'errorElement', {
		get: function() { return unwrapEl(this._errorElement); },
		set: function(v) { this._errorElement = v; }
	});
	Object.defineProperty(BaseField.prototype, 'labelElement', {
		get: function() { return unwrapEl(this._labelElement); },
		set: function(v) { this._labelElement = v; }
	});
	Object.defineProperty(BaseField.prototype, 'inputWrapper', {
		get: function() { return unwrapEl(this._inputWrapper); },
		set: function(v) { this._inputWrapper = v; }
	});

	// -------------------------------------------------------------------------
	// DOM ELEMENT ACCESSORS (unwrap Funky.Dom wrappers for external access)
	// -------------------------------------------------------------------------

	/**
	 * Get the raw DOM element (unwraps Funky.Dom wrapper if present)
	 * @returns {HTMLElement}
	 */
	BaseField.prototype.getElement = function() {
		return this.element && this.element.el ? this.element.el : this.element;
	};

	/**
	 * Get the raw input DOM element
	 * @returns {HTMLElement}
	 */
	BaseField.prototype.getInputElement = function() {
		return this.inputElement && this.inputElement.el ? this.inputElement.el : this.inputElement;
	};

	/**
	 * Get the raw error DOM element
	 * @returns {HTMLElement}
	 */
	BaseField.prototype.getErrorElement = function() {
		return this.errorElement && this.errorElement.el ? this.errorElement.el : this.errorElement;
	};

	/**
	 * Get the raw label DOM element
	 * @returns {HTMLElement}
	 */
	BaseField.prototype.getLabelElement = function() {
		return this.labelElement && this.labelElement.el ? this.labelElement.el : this.labelElement;
	};

	// -------------------------------------------------------------------------
	// RENDERING
	// -------------------------------------------------------------------------

	/**
	 * Render the complete field structure
	 * @returns {HTMLElement} The field wrapper element
	 */
	BaseField.prototype.render = function() {
		var parts = this._createWrapper();

		// Render the specific input for this field type
		var input = this._renderInput();
		if (input) {
			parts.inputWrapper.append(input);
			// Only set inputElement if not already set by _renderInput (e.g., CheckboxField sets it internally)
			if (!this.inputElement) {
				this.inputElement = input;
			}
		}

		// Apply initial state
		if (!this._visible) {
			this.hide();
		}
		if (!this._enabled) {
			this.disable();
		}
		if (this._readonly) {
			this._setReadonly(true);
		}

		// Set initial value
		if (this._value !== null && this._value !== undefined) {
			this._updateInput();
		}

		return this.element;  // Property getter returns raw DOM element
	};

	/**
	 * Render the input element (override in subclasses)
	 * @returns {HTMLElement}
	 */
	BaseField.prototype._renderInput = function() {
		// Default: basic text input
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		var input = this._createElement('input', {
			type: this._getInputType(),
			id: fieldId,
			name: this.name,
			className: 'funky-form-input form-control'
		});

		// Apply attributes
		if (config.placeholder) {
			input.el.placeholder = config.placeholder;
		}
		if (config.maxLength) {
			input.el.maxLength = config.maxLength;
		}
		if (config.minLength) {
			input.el.minLength = config.minLength;
		}
		if (config.pattern) {
			input.el.pattern = config.pattern;
		}
		if (config.autocomplete) {
			input.el.autocomplete = config.autocomplete;
		}
		if (config.required) {
			input.el.required = true;
		}

		// ARIA
		var ariaDescribedBy = [];
		if (config.help) {
			ariaDescribedBy.push(fieldId + '-help');
		}
		ariaDescribedBy.push(fieldId + '-error');
		input.attr('aria-describedby', ariaDescribedBy.join(' '));

		// Event listeners
		this._bindInputEvents(input);

		return input;
	};

	/**
	 * Get the input type for this field
	 * @returns {string}
	 */
	BaseField.prototype._getInputType = function() {
		return 'text';
	};

	/**
	 * Create the field wrapper structure
	 * @returns {Object} { wrapper, inputWrapper }
	 */
	BaseField.prototype._createWrapper = function() {
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Main wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-field funky-form-field--' + (config.type || 'text')
		});
		wrapper.attr('data-field', this.name);

		// Label
		if (config.label !== false && config.type !== 'hidden') {
			var label = this._createElement('label', {
				className: 'funky-form-label'
			});
			label.attr('for', fieldId);
			label.text(config.label || this.name);

			if (config.required) {
				var requiredSpan = this._createElement('span', {
					className: 'funky-form-required'
				});
				requiredSpan.attr('aria-hidden', 'true');
				requiredSpan.text(' *');
				label.append(requiredSpan);
			}

			wrapper.append(label);
			this.labelElement = label;
		}

		// Input wrapper (for addons, icons, etc.)
		var inputWrapper = this._createElement('div', {
			className: 'funky-form-input-wrapper'
		});
		wrapper.append(inputWrapper);
		this.inputWrapper = inputWrapper;

		// Help text
		if (config.help) {
			var help = this._createElement('div', {
				className: 'funky-form-help'
			});
			help.attr('id', fieldId + '-help');
			help.text(config.help);
			wrapper.append(help);
		}

		// Error container
		var errors = this._createElement('div', {
			className: 'funky-form-errors'
		});
		errors.attr('id', fieldId + '-error');
		errors.attr('role', 'alert');
		errors.attr('aria-live', 'polite');
		errors.style('display', 'none');
		wrapper.append(errors);

		this.element = wrapper;
		this.errorElement = errors;
		this.inputWrapper = inputWrapper;

		return { wrapper: wrapper, inputWrapper: inputWrapper };
	};

	// -------------------------------------------------------------------------
	// VALUE MANAGEMENT
	// -------------------------------------------------------------------------

	/**
	 * Get field value
	 * @returns {*}
	 */
	BaseField.prototype.getValue = function() {
		return this._value;
	};

	/**
	 * Set field value
	 * @param {*} value
	 * @param {Object} options - { silent: boolean }
	 */
	BaseField.prototype.setValue = function(value, options) {
		var oldValue = this._value;
		this._value = value;
		this._pristine = false;
		this._updateInput();

		if ((!options || !options.silent) && value !== oldValue) {
			this._emitChange();
		}
	};

	/**
	 * Update the DOM input to reflect current value
	 */
	BaseField.prototype._updateInput = function() {
		if (this.inputElement) {
			this.inputElement.value = this._value !== null && this._value !== undefined ? this._value : '';
		}
	};

	/**
	 * Read value from DOM input
	 * @returns {*}
	 */
	BaseField.prototype._readInput = function() {
		if (this.inputElement) {
			return this.inputElement.value;
		}
		return null;
	};

	/**
	 * Parse value from input (override for type coercion)
	 * @param {*} rawValue
	 * @returns {*}
	 */
	BaseField.prototype._parseValue = function(rawValue) {
		return rawValue;
	};

	// -------------------------------------------------------------------------
	// VISIBILITY & STATE
	// -------------------------------------------------------------------------

	/**
	 * Show field
	 */
	BaseField.prototype.show = function() {
		this._visible = true;
		if (this._element) {
			this._element.style('display', '');
			this._element.classRemove('funky-form-field--hidden');
		}
	};

	/**
	 * Hide field
	 */
	BaseField.prototype.hide = function() {
		this._visible = false;
		if (this._element) {
			this._element.style('display', 'none');
			this._element.classAdd('funky-form-field--hidden');
		}
	};

	/**
	 * Check if field is visible
	 * @returns {boolean}
	 */
	BaseField.prototype.isVisible = function() {
		return this._visible;
	};

	/**
	 * Enable field
	 */
	BaseField.prototype.enable = function() {
		this._enabled = true;
		if (this._inputElement) {
			this._inputElement.el.disabled = false;
		}
		if (this._element) {
			this._element.classRemove('funky-form-field--disabled');
		}
	};

	/**
	 * Disable field
	 */
	BaseField.prototype.disable = function() {
		this._enabled = false;
		if (this._inputElement) {
			this._inputElement.el.disabled = true;
		}
		if (this._element) {
			this._element.classAdd('funky-form-field--disabled');
		}
	};

	/**
	 * Check if field is enabled
	 * @returns {boolean}
	 */
	BaseField.prototype.isEnabled = function() {
		return this._enabled;
	};

	/**
	 * Set readonly state
	 * @param {boolean} readonly
	 */
	BaseField.prototype._setReadonly = function(readonly) {
		this._readonly = readonly;
		if (this._inputElement) {
			this._inputElement.el.readOnly = readonly;
		}
		if (this._element) {
			this._element.classToggle('funky-form-field--readonly', readonly);
		}
	};

	/**
	 * Check if field is pristine (unchanged)
	 * @returns {boolean}
	 */
	BaseField.prototype.isPristine = function() {
		return this._pristine;
	};

	/**
	 * Check if field is dirty (changed)
	 * @returns {boolean}
	 */
	BaseField.prototype.isDirty = function() {
		return !this._pristine;
	};

	/**
	 * Mark field as pristine
	 */
	BaseField.prototype.markPristine = function() {
		this._pristine = true;
	};

	// -------------------------------------------------------------------------
	// VALIDATION & ERRORS
	// -------------------------------------------------------------------------

	/**
	 * Validate field
	 * @returns {Object} { valid: boolean, errors: string[] }
	 */
	BaseField.prototype.validate = function() {
		if (this.form) {
			return this.form.validateField(this.name);
		}
		return { valid: true, errors: [] };
	};

	/**
	 * Show error message(s)
	 * @param {string|string[]} errors
	 */
	BaseField.prototype.showError = function(errors) {
		var errorList = Array.isArray(errors) ? errors : [errors];
		this._valid = false;

		if (this._element) {
			this._element.classAdd('funky-form-field--error');
		}

		if (this._inputElement) {
			this._inputElement.attr('aria-invalid', 'true');
		}

		if (this._errorElement) {
			this._errorElement.html(errorList.map(function(e) {
				return '<div class="funky-form-error-message">' + this._escapeHtml(e) + '</div>';
			}, this).join(''));
			this._errorElement.style('display', '');
		}
	};

	/**
	 * Clear error message
	 */
	BaseField.prototype.clearError = function() {
		this._valid = true;

		if (this._element) {
			this._element.classRemove('funky-form-field--error');
		}

		if (this._inputElement) {
			this._inputElement.attr('aria-invalid', null);
		}

		if (this._errorElement) {
			this._errorElement.html('');
			this._errorElement.style('display', 'none');
		}
	};

	/**
	 * Check if field is valid
	 * @returns {boolean}
	 */
	BaseField.prototype.isValid = function() {
		return this._valid;
	};

	// -------------------------------------------------------------------------
	// FOCUS MANAGEMENT
	// -------------------------------------------------------------------------

	/**
	 * Focus the field
	 */
	BaseField.prototype.focus = function() {
		if (this.inputElement && typeof this.inputElement.focus === 'function') {
			this.inputElement.focus();
		}
	};

	/**
	 * Blur the field
	 */
	BaseField.prototype.blur = function() {
		if (this.inputElement && typeof this.inputElement.blur === 'function') {
			this.inputElement.blur();
		}
	};

	// -------------------------------------------------------------------------
	// EVENT HANDLING
	// -------------------------------------------------------------------------

	/**
	 * Bind input event listeners
	 * @param {HTMLElement} input
	 */
	BaseField.prototype._bindInputEvents = function(input) {
		var self = this;

		// Input/change event
		input.on('input', function(e) {
			var rawValue = self._readInput();
			var parsedValue = self._parseValue(rawValue);
			self._value = parsedValue;
			self._pristine = false;
			self._emitChange();
		});

		// Blur event (validate on blur)
		input.on('blur', function(e) {
			if (self.form && self.form.options.validateOnBlur) {
				self.validate();
			}
			self._emitEvent('blur');
		});

		// Focus event
		input.on('focus', function(e) {
			self._emitEvent('focus');
		});
	};

	/**
	 * Emit change event to form
	 */
	BaseField.prototype._emitChange = function() {
		if (this.form && this.form._onFieldChange) {
			this.form._onFieldChange(this.name, this._value);
		}
	};

	/**
	 * Emit custom event
	 * @param {string} eventName
	 * @param {Object} detail
	 */
	BaseField.prototype._emitEvent = function(eventName, detail) {
		if (this.form && this.form._emit) {
			this.form._emit('field:' + eventName, Object.assign({
				field: this.name,
				value: this._value
			}, detail || {}));
		}
	};

	// -------------------------------------------------------------------------
	// LIFECYCLE
	// -------------------------------------------------------------------------

	/**
	 * Destroy field and cleanup
	 */
	BaseField.prototype.destroy = function() {
		if (this.element) {
			this.element.remove();
		}

		this.element = null;
		this.inputElement = null;
		this.errorElement = null;
		this.labelElement = null;
		this.inputWrapper = null;
		this.form = null;
	};

	/**
	 * Reset field to initial state
	 */
	BaseField.prototype.reset = function() {
		this._value = this.config.defaultValue !== undefined ? this.config.defaultValue : null;
		this._pristine = true;
		this._updateInput();
		this.clearError();
	};

	// -------------------------------------------------------------------------
	// UTILITIES
	// -------------------------------------------------------------------------

	/**
	 * Create DOM element (uses Funky.Dom if available)
	 * @param {string} tag
	 * @param {Object} options
	 * @returns {HTMLElement}
	 */
	BaseField.prototype._createElement = function(tag, options) {
		options = options || {};

		if (D && D.create) {
			// D.create now supports options with className, id, attrs
			var attrs = {
				type: options.type,
				name: options.name
			};
			// Forward additional HTML attributes
			if (options.inputmode) attrs.inputmode = options.inputmode;
			if (options.placeholder) attrs.placeholder = options.placeholder;
			if (options.min !== undefined) attrs.min = options.min;
			if (options.max !== undefined) attrs.max = options.max;
			if (options.step !== undefined) attrs.step = options.step;
			if (options.pattern) attrs.pattern = options.pattern;
			if (options.autocomplete) attrs.autocomplete = options.autocomplete;

			var el = D.create(tag, {
				className: options.className,
				id: options.id,
				attrs: attrs
			});
			return el;
		}

		// Fallback for environments without Funky.Dom
		var nativeEl = document.createElement(tag);
		if (options.className) {
			nativeEl.className = options.className;
		}
		if (options.id) {
			nativeEl.id = options.id;
		}
		if (options.type) {
			nativeEl.type = options.type;
		}
		if (options.name) {
			nativeEl.name = options.name;
		}
		if (options.inputmode) {
			nativeEl.inputMode = options.inputmode;
		}
		return nativeEl;
	};

	/**
	 * Escape HTML entities
	 * @param {string} str
	 * @returns {string}
	 */
	BaseField.prototype._escapeHtml = function(str) {
		if (!str) return '';
		var div = D.create('div');
		div.text(str);
		return div.html();
	};

	// =========================================================================
	// FIELD REGISTRY
	// =========================================================================

	var _fieldTypes = {};

	var FieldRegistry = {
		/**
		 * Register a field type
		 * @param {string} type - Field type name
		 * @param {Object} definition - Field definition with class, defaults, etc.
		 */
		register: function(type, definition) {
			if (_fieldTypes[type]) {
				console.warn('[Funky.Form.FieldRegistry] Overwriting field type "' + type + '"');
			}

			// Normalize definition
			if (typeof definition === 'function') {
				definition = { class: definition };
			}

			_fieldTypes[type] = definition;
		},

		/**
		 * Get field type definition
		 * @param {string} type - Field type name
		 * @returns {Object|null}
		 */
		get: function(type) {
			return _fieldTypes[type] || null;
		},

		/**
		 * Check if field type exists
		 * @param {string} type - Field type name
		 * @returns {boolean}
		 */
		has: function(type) {
			return type in _fieldTypes;
		},

		/**
		 * Create field instance
		 * @param {string} type - Field type name
		 * @param {Object} config - Field configuration
		 * @param {Form} form - Parent form instance
		 * @returns {BaseField} Field instance
		 */
		create: function(type, config, form) {
			var definition = this.get(type);

			if (!definition) {
				console.warn('[Funky.Form.FieldRegistry] Unknown field type "' + type + '", falling back to text');
				definition = this.get('text');
			}

			// Still no definition? Use BaseField
			if (!definition) {
				return new BaseField(config, form);
			}

			// Apply defaults
			if (definition.defaults) {
				config = Object.assign({}, definition.defaults, config);
			}

			// Create instance
			var FieldClass = definition.class || BaseField;
			return new FieldClass(config, form);
		},

		/**
		 * List all registered type names
		 * @returns {string[]}
		 */
		types: function() {
			return Object.keys(_fieldTypes);
		},

		/**
		 * Unregister a field type
		 * @param {string} type - Field type name
		 */
		unregister: function(type) {
			delete _fieldTypes[type];
		},

		/**
		 * Clear all registered types
		 */
		clear: function() {
			_fieldTypes = {};
		},

		/**
		 * Get BaseField class for extension
		 * @returns {Function}
		 */
		BaseField: BaseField
	};

	// =========================================================================
	// BUILT-IN FIELD TYPES
	// =========================================================================

	// Text field (base type)
	function TextField(config, form) {
		BaseField.call(this, config, form);
	}
	TextField.prototype = Object.create(BaseField.prototype);
	TextField.prototype.constructor = TextField;
	TextField.prototype._getInputType = function() {
		return 'text';
	};

	// Email field
	function EmailField(config, form) {
		BaseField.call(this, config, form);
	}
	EmailField.prototype = Object.create(BaseField.prototype);
	EmailField.prototype.constructor = EmailField;
	EmailField.prototype._getInputType = function() {
		return 'email';
	};

	// Password field
	function PasswordField(config, form) {
		BaseField.call(this, config, form);
	}
	PasswordField.prototype = Object.create(BaseField.prototype);
	PasswordField.prototype.constructor = PasswordField;
	PasswordField.prototype._getInputType = function() {
		return 'password';
	};

	// Tel field
	function TelField(config, form) {
		BaseField.call(this, config, form);
	}
	TelField.prototype = Object.create(BaseField.prototype);
	TelField.prototype.constructor = TelField;
	TelField.prototype._getInputType = function() {
		return 'tel';
	};

	// Url field
	function UrlField(config, form) {
		BaseField.call(this, config, form);
	}
	UrlField.prototype = Object.create(BaseField.prototype);
	UrlField.prototype.constructor = UrlField;
	UrlField.prototype._getInputType = function() {
		return 'url';
	};

	// Number field
	function NumberField(config, form) {
		BaseField.call(this, config, form);
	}
	NumberField.prototype = Object.create(BaseField.prototype);
	NumberField.prototype.constructor = NumberField;
	NumberField.prototype._getInputType = function() {
		return 'number';
	};
	NumberField.prototype._renderInput = function() {
		var input = BaseField.prototype._renderInput.call(this);

		// Number-specific attributes
		if (this.config.min !== undefined) {
			input.el.min = this.config.min;
		}
		if (this.config.max !== undefined) {
			input.el.max = this.config.max;
		}
		if (this.config.step !== undefined) {
			input.el.step = this.config.step;
		}

		return input;
	};
	NumberField.prototype._parseValue = function(rawValue) {
		if (rawValue === '' || rawValue === null || rawValue === undefined) {
			return null;
		}
		var num = parseFloat(rawValue);
		return isNaN(num) ? null : num;
	};
	NumberField.prototype.getValue = function() {
		return this._parseValue(this._value);
	};

	// Textarea field
	function TextareaField(config, form) {
		BaseField.call(this, config, form);
	}
	TextareaField.prototype = Object.create(BaseField.prototype);
	TextareaField.prototype.constructor = TextareaField;
	TextareaField.prototype._renderInput = function() {
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		var textarea = this._createElement('textarea', {
			id: fieldId,
			name: this.name,
			className: 'funky-form-input funky-form-textarea form-control'
		});

		if (config.placeholder) {
			textarea.el.placeholder = config.placeholder;
		}
		if (config.maxLength) {
			textarea.el.maxLength = config.maxLength;
		}
		if (config.rows) {
			textarea.el.rows = config.rows;
		}
		if (config.required) {
			textarea.el.required = true;
		}
		if (config.minLength) {
			textarea.el.minLength = config.minLength;
		}

		// Auto-resize feature
		if (config.autoResize) {
			textarea.classAdd('funky-form-textarea--autoresize');
			textarea.style('overflow', 'hidden');
			textarea.style('resize', 'none');

			var autoResize = function() {
				textarea.style('height', 'auto');
				textarea.style('height', textarea.el.scrollHeight + 'px');
			};

			textarea.on('input', autoResize);

			// Initial resize after render
			setTimeout(autoResize, 0);
		}

		// ARIA
		var ariaDescribedBy = [];
		if (config.help) {
			ariaDescribedBy.push(fieldId + '-help');
		}
		ariaDescribedBy.push(fieldId + '-error');
		textarea.attr('aria-describedby', ariaDescribedBy.join(' '));

		this._bindInputEvents(textarea);

		return textarea;
	};

	// Checkbox field
	function CheckboxField(config, form) {
		BaseField.call(this, config, form);
		// Default to false for checkboxes
		if (this._value === null) {
			this._value = false;
		}
	}
	CheckboxField.prototype = Object.create(BaseField.prototype);
	CheckboxField.prototype.constructor = CheckboxField;
	CheckboxField.prototype._renderInput = function() {
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Checkbox wrapper for styling
		var wrapper = this._createElement('div', {
			className: 'funky-form-checkbox-wrapper form-check'
		});

		var checkbox = this._createElement('input', {
			type: 'checkbox',
			id: fieldId,
			name: this.name,
			className: 'funky-form-checkbox form-check-input'
		});

		if (config.required) {
			checkbox.el.required = true;
		}

		// Inline label for checkbox
		var label = this._createElement('label', {
			className: 'funky-form-checkbox-label form-check-label'
		});
		label.attr('for', fieldId);
		label.text(config.checkboxLabel || config.label || '');

		wrapper.append(checkbox);
		wrapper.append(label);

		// Bind events
		var self = this;
		checkbox.on('change', function() {
			self._value = checkbox.el.checked;
			self._pristine = false;
			self._emitChange();
		});

		this.inputElement = checkbox;

		return wrapper;
	};
	CheckboxField.prototype._updateInput = function() {
		if (this.inputElement) {
			this.inputElement.checked = Boolean(this._value);
		}
	};
	CheckboxField.prototype._parseValue = function(rawValue) {
		return Boolean(rawValue);
	};
	CheckboxField.prototype._createWrapper = function() {
		var result = BaseField.prototype._createWrapper.call(this);

		// Remove the main label for checkboxes (it's inline with the input)
		if (this._labelElement && this.config.label !== false) {
			// Keep the label but make it a fieldset legend style
			this._labelElement.classAdd('funky-form-label--checkbox-group');
		}

		return result;
	};

	// Switch field - toggle switch UI
	function SwitchField(config, form) {
		BaseField.call(this, config, form);
		// Default to false for switches
		if (this._value === null) {
			this._value = false;
		}
	}
	SwitchField.prototype = Object.create(BaseField.prototype);
	SwitchField.prototype.constructor = SwitchField;
	SwitchField.prototype._renderInput = function() {
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Switch wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-switch-wrapper form-check form-switch'
		});

		var input = this._createElement('input', {
			type: 'checkbox',
			id: fieldId,
			name: this.name,
			className: 'funky-form-switch form-check-input'
		});
		input.attr('role', 'switch');

		if (config.required) {
			input.el.required = true;
		}

		// Inline label for switch
		var label = this._createElement('label', {
			className: 'funky-form-switch-label form-check-label'
		});
		label.attr('for', fieldId);
		label.text(config.switchLabel || config.label || '');

		wrapper.append(input);
		wrapper.append(label);

		// On/Off text indicators (optional)
		if (config.onText || config.offText) {
			var stateText = this._createElement('span', {
				className: 'funky-form-switch-state'
			});
			stateText.text(this._value ? (config.onText || 'On') : (config.offText || 'Off'));
			wrapper.append(stateText);
			this._stateText = stateText;
		}

		// Bind events
		var self = this;
		input.on('change', function() {
			self._value = input.el.checked;
			self._pristine = false;
			if (self._stateText) {
				self._stateText.text(self._value ? (config.onText || 'On') : (config.offText || 'Off'));
			}
			self._emitChange();
		});

		this.inputElement = input;

		return wrapper;
	};
	SwitchField.prototype._updateInput = function() {
		if (this.inputElement) {
			this.inputElement.checked = Boolean(this._value);
		}
		if (this._stateText && this.config) {
			this._stateText.text(this._value ? (this.config.onText || 'On') : (this.config.offText || 'Off'));
		}
	};
	SwitchField.prototype._parseValue = function(rawValue) {
		return Boolean(rawValue);
	};
	SwitchField.prototype._createWrapper = function() {
		var result = BaseField.prototype._createWrapper.call(this);

		// Remove the main label for switches (it's inline with the input)
		if (this._labelElement && this.config.label !== false) {
			this._labelElement.classAdd('funky-form-label--switch-group');
		}

		return result;
	};

	// Select field
	function SelectField(config, form) {
		BaseField.call(this, config, form);
	}
	SelectField.prototype = Object.create(BaseField.prototype);
	SelectField.prototype.constructor = SelectField;
	SelectField.prototype._renderInput = function() {
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		var select = this._createElement('select', {
			id: fieldId,
			name: this.name,
			className: 'funky-form-input funky-form-select form-control form-select'
		});

		if (config.required) {
			select.el.required = true;
		}
		if (config.multiple) {
			select.el.multiple = true;
		}

		// ARIA
		var ariaDescribedBy = [];
		if (config.help) {
			ariaDescribedBy.push(fieldId + '-help');
		}
		ariaDescribedBy.push(fieldId + '-error');
		select.attr('aria-describedby', ariaDescribedBy.join(' '));

		// Add placeholder option
		if (config.placeholder) {
			var placeholder = D.create('option');
			placeholder.attr('value', '');
			placeholder.text(config.placeholder);
			placeholder.el.disabled = true;
			placeholder.el.selected = true;
			select.append(placeholder);
		}

		// Add options
		var options = config.options || [];
		options.forEach(function(opt) {
			var option = D.create('option');
			if (typeof opt === 'object') {
				option.attr('value', opt.value !== undefined ? opt.value : opt.label);
				option.text(opt.label || opt.value);
				if (opt.disabled) {
					option.el.disabled = true;
				}
			} else {
				option.attr('value', opt);
				option.text(opt);
			}
			select.append(option);
		});

		// Bind events
		var self = this;
		select.on('change', function() {
			if (config.multiple) {
				var selected = [];
				for (var i = 0; i < select.el.options.length; i++) {
					if (select.el.options[i].selected) {
						selected.push(select.el.options[i].value);
					}
				}
				self._value = selected;
			} else {
				self._value = select.el.value;
			}
			self._pristine = false;
			self._emitChange();
		});

		return select;
	};
	SelectField.prototype._updateInput = function() {
		if (!this.inputElement) return;

		if (this.config.multiple && Array.isArray(this._value)) {
			for (var i = 0; i < this.inputElement.options.length; i++) {
				var opt = this.inputElement.options[i];
				opt.selected = this._value.indexOf(opt.value) !== -1;
			}
		} else {
			this.inputElement.value = this._value !== null && this._value !== undefined ? this._value : '';
		}
	};

	// Hidden field
	function HiddenField(config, form) {
		BaseField.call(this, config, form);
	}
	HiddenField.prototype = Object.create(BaseField.prototype);
	HiddenField.prototype.constructor = HiddenField;
	HiddenField.prototype._getInputType = function() {
		return 'hidden';
	};
	HiddenField.prototype._createWrapper = function() {
		// Hidden fields don't need wrapper structure
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		var input = this._createElement('input', {
			type: 'hidden',
			id: fieldId,
			name: this.name
		});

		this.element = input;
		this.inputElement = input;

		return { wrapper: input, inputWrapper: input };
	};
	HiddenField.prototype.render = function() {
		this._createWrapper();

		if (this._value !== null && this._value !== undefined) {
			this._updateInput();
		}

		return this.element;  // Property getter returns raw DOM element
	};

	// Radio field
	function RadioField(config, form) {
		BaseField.call(this, config, form);
	}
	RadioField.prototype = Object.create(BaseField.prototype);
	RadioField.prototype.constructor = RadioField;
	RadioField.prototype._renderInput = function() {
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;
		var self = this;

		var container = this._createElement('div', {
			className: 'funky-form-radio-group'
		});
		container.attr('role', 'radiogroup');
		container.attr('aria-labelledby', fieldId + '-label');

		var options = config.options || [];
		options.forEach(function(opt, index) {
			var optValue = typeof opt === 'object' ? opt.value : opt;
			var optLabel = typeof opt === 'object' ? opt.label : opt;
			var optId = fieldId + '-' + index;

			var wrapper = self._createElement('div', {
				className: 'funky-form-radio-wrapper form-check'
			});

			var radio = self._createElement('input', {
				type: 'radio',
				id: optId,
				name: self.name,
				className: 'funky-form-radio form-check-input'
			});
			radio.el.value = optValue;

			var label = self._createElement('label', {
				className: 'funky-form-radio-label form-check-label'
			});
			label.attr('for', optId);
			label.text(optLabel);

			radio.on('change', function() {
				if (radio.el.checked) {
					self._value = optValue;
					self._pristine = false;
					self._emitChange();
				}
			});

			wrapper.append(radio);
			wrapper.append(label);
			container.append(wrapper);
		});

		// Store reference for value updates
		this._radioContainer = container;

		return container;
	};
	RadioField.prototype._updateInput = function() {
		if (!this._radioContainer) return;

		var radios = this._radioContainer.find('input[type="radio"]');
		var value = this._value;

		for (var i = 0; i < radios.length; i++) {
			// radios.elements[i] is a raw DOM element
			var radio = radios.elements[i];
			if (radio) {
				radio.checked = radio.value === value;
			}
		}
	};

	// =========================================================================
	// REGISTER BUILT-IN TYPES
	// =========================================================================

	FieldRegistry.register('text', {
		class: TextField,
		label: 'Text Input',
		category: 'basic',
		defaults: {
			maxLength: null,
			minLength: null,
			pattern: null,
			placeholder: ''
		}
	});

	FieldRegistry.register('email', {
		class: EmailField,
		label: 'Email',
		category: 'basic',
		defaults: {
			placeholder: ''
		}
	});

	FieldRegistry.register('password', {
		class: PasswordField,
		label: 'Password',
		category: 'basic',
		defaults: {
			placeholder: ''
		}
	});

	FieldRegistry.register('tel', {
		class: TelField,
		label: 'Telephone',
		category: 'basic',
		defaults: {
			placeholder: ''
		}
	});

	FieldRegistry.register('url', {
		class: UrlField,
		label: 'URL',
		category: 'basic',
		defaults: {
			placeholder: ''
		}
	});

	FieldRegistry.register('number', {
		class: NumberField,
		label: 'Number',
		category: 'basic',
		defaults: {
			min: null,
			max: null,
			step: null
		}
	});

	FieldRegistry.register('integer', {
		class: NumberField,
		label: 'Integer',
		category: 'basic',
		defaults: {
			min: null,
			max: null,
			step: 1
		}
	});

	FieldRegistry.register('textarea', {
		class: TextareaField,
		label: 'Text Area',
		category: 'basic',
		defaults: {
			rows: 3,
			maxLength: null
		}
	});

	FieldRegistry.register('checkbox', {
		class: CheckboxField,
		label: 'Checkbox',
		category: 'basic',
		defaults: {}
	});

	FieldRegistry.register('boolean', {
		class: CheckboxField,
		label: 'Boolean',
		category: 'basic',
		defaults: {}
	});

	FieldRegistry.register('switch', {
		class: SwitchField,
		label: 'Switch',
		category: 'basic',
		defaults: {
			onText: null,
			offText: null
		}
	});

	FieldRegistry.register('toggle', {
		class: SwitchField,
		label: 'Toggle',
		category: 'basic',
		defaults: {
			onText: null,
			offText: null
		}
	});

	FieldRegistry.register('select', {
		class: SelectField,
		label: 'Select',
		category: 'basic',
		defaults: {
			options: [],
			multiple: false
		}
	});

	FieldRegistry.register('hidden', {
		class: HiddenField,
		label: 'Hidden',
		category: 'special',
		defaults: {}
	});

	FieldRegistry.register('radio', {
		class: RadioField,
		label: 'Radio Group',
		category: 'basic',
		defaults: {
			options: []
		}
	});

	// =========================================================================
	// ADVANCED FIELD TYPES
	// =========================================================================

	/**
	 * ComboBoxField - Enhanced select with Funky.ComboBox integration
	 * Falls back to native SelectField if ComboBox not available.
	 */
	function ComboBoxField(config, form) {
		BaseField.call(this, config, form);
		this.options = config.options || [];
		this.comboboxInstance = null;
		this._nativeInstance = null;
	}
	ComboBoxField.prototype = Object.create(BaseField.prototype);
	ComboBoxField.prototype.constructor = ComboBoxField;

	ComboBoxField.prototype._hasComboBox = function() {
		return !!(global.Funky && global.Funky.ComboBox && typeof global.Funky.ComboBox.create === 'function');
	};

	ComboBoxField.prototype.render = function() {
		// Fall back to native select if ComboBox not available (check at render time)
		if (!this._hasComboBox()) {
			return this._renderNativeSelect();
		}

		var parts = this._createWrapper();
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Container for ComboBox
		var container = this._createElement('div', {
			className: 'funky-form-combobox-container',
			id: fieldId + '-container'
		});

		parts.inputWrapper.append(container);

		// Build ComboBox options
		var comboboxOpts = {
			placeholder: config.placeholder || '',
			multiple: config.multiple || false,
			disabled: config.disabled || (this.form && this.form.options.disabled),
			clearable: config.clearable !== false,
			searchable: config.searchable !== false,
			size: config.size || null,  // 'sm' | 'lg' | null (default)
			maxSelection: config.maxSelection || null,
			tags: config.tags || false
		};

		// Static options
		if (this.options.length > 0) {
			comboboxOpts.options = this.options.map(function(opt) {
				if (typeof opt === 'object') {
					return { value: opt.value, label: opt.label, disabled: opt.disabled };
				}
				return { value: opt, label: opt };
			});
		}

		// Remote data source
		if (config.remote) {
			comboboxOpts.remote = {
				url: config.remote.url,
				searchParam: config.remote.searchParam || 'q',
				valueField: config.remote.valueField || 'id',
				labelField: config.remote.labelField || 'name',
				minChars: config.remote.minChars || 1,
				debounce: config.remote.debounce || 300
			};

			if (config.remote.pagination) {
				comboboxOpts.remote.pagination = config.remote.pagination;
			}
		}

		// Event callbacks
		var self = this;
		comboboxOpts.onChange = function(value) {
			self._value = value;
			self._pristine = false;
			self._emitChange();
		};

		// Create ComboBox instance
		this.comboboxInstance = global.Funky.ComboBox.create(container, comboboxOpts);

		// Set initial value
		if (this._value !== null && this._value !== undefined) {
			this.comboboxInstance.setData(
				config.multiple ? { values: this._value } : { value: this._value }
			);
		}

		// Store reference for form accessibility
		this.inputElement = container.one('input') || container;

		// Apply initial state
		if (!this._visible) {
			this.hide();
		}
		if (!this._enabled) {
			this.disable();
		}

		return this.element;
	};

	ComboBoxField.prototype._renderNativeSelect = function() {
		// Create SelectField instance and delegate
		var selectConfig = Object.assign({}, this.config, { type: 'select' });
		var selectInstance = new SelectField(selectConfig, this.form);
		var element = selectInstance.render();

		// Copy references
		this.element = selectInstance.element;
		this.inputElement = selectInstance.inputElement;
		this.errorElement = selectInstance.errorElement;
		this.labelElement = selectInstance.labelElement;
		this.inputWrapper = selectInstance.inputWrapper;
		this._nativeInstance = selectInstance;

		return element;
	};

	ComboBoxField.prototype.getValue = function() {
		if (this._nativeInstance) {
			return this._nativeInstance.getValue();
		}
		return this._value;
	};

	ComboBoxField.prototype.setValue = function(value, options) {
		this._value = value;
		this._pristine = false;

		if (this._nativeInstance) {
			this._nativeInstance.setValue(value, options);
		} else if (this.comboboxInstance) {
			this.comboboxInstance.setData(
				this.config.multiple ? { values: value } : { value: value }
			);
		}

		if (!options || !options.silent) {
			this._emitChange();
		}
	};

	ComboBoxField.prototype._updateInput = function() {
		if (this._nativeInstance) {
			this._nativeInstance._updateInput();
		} else if (this.comboboxInstance) {
			this.comboboxInstance.setData(
				this.config.multiple ? { values: this._value } : { value: this._value }
			);
		}
	};

	ComboBoxField.prototype.enable = function() {
		BaseField.prototype.enable.call(this);
		if (this.comboboxInstance && this.comboboxInstance.enable) {
			this.comboboxInstance.enable();
		}
		if (this._nativeInstance) {
			this._nativeInstance.enable();
		}
	};

	ComboBoxField.prototype.disable = function() {
		BaseField.prototype.disable.call(this);
		if (this.comboboxInstance && this.comboboxInstance.disable) {
			this.comboboxInstance.disable();
		}
		if (this._nativeInstance) {
			this._nativeInstance.disable();
		}
	};

	ComboBoxField.prototype.destroy = function() {
		if (this.comboboxInstance && this.comboboxInstance.destroy) {
			this.comboboxInstance.destroy();
		}
		this.comboboxInstance = null;
		if (this._nativeInstance) {
			this._nativeInstance.destroy();
		}
		this._nativeInstance = null;
		BaseField.prototype.destroy.call(this);
	};

	/**
	 * DateField - Date input with Funky.DatePicker integration
	 * Falls back to native date input if DatePicker not available.
	 */
	function DateField(config, form) {
		BaseField.call(this, config, form);
		this.datePickerInstance = null;
		this.includeTime = config.type === 'datetime' || config.includeTime;
	}
	DateField.prototype = Object.create(BaseField.prototype);
	DateField.prototype.constructor = DateField;

	DateField.prototype._hasDatePicker = function() {
		return !!(global.Funky && global.Funky.DatePicker && typeof global.Funky.DatePicker.create === 'function');
	};

	DateField.prototype.render = function() {
		// Fall back to native input if DatePicker not available (check at render time)
		console.log('[DateField.render] hasDatePicker:', this._hasDatePicker());
		if (!this._hasDatePicker()) {
			console.log('[DateField.render] Using native input fallback');
			return this._renderNativeInput();
		}

		console.log('[DateField.render] Using DatePicker');
		var parts = this._createWrapper();
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create input element for DatePicker (DatePicker expects an input, not a container)
		var input = this._createElement('input', {
			type: 'text',
			id: fieldId,
			name: this.name,
			className: 'funky-form-input form-control funky-datepicker-input'
		});

		if (config.placeholder) {
			input.el.placeholder = config.placeholder;
		}

		parts.inputWrapper.append(input);

		// Build DatePicker options
		var datePickerOpts = {
			format: config.format || (this.includeTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'),
			timePicker: this.includeTime,
			placeholder: config.placeholder || '',
			disabled: config.disabled || (this.form && this.form.options.disabled),
			size: config.size || 'default'  // 'default' | 'small' | 'compact'
		};

		// Date constraints
		if (config.minDate) {
			datePickerOpts.minDate = config.minDate === 'today' ? new Date() : new Date(config.minDate);
		}
		if (config.maxDate) {
			datePickerOpts.maxDate = config.maxDate === 'today' ? new Date() : new Date(config.maxDate);
		}

		// Disabled dates
		if (config.disabledDates) {
			datePickerOpts.disabledDates = config.disabledDates;
		}
		if (config.disabledDays) {
			datePickerOpts.disabledDays = config.disabledDays;
		}

		// Range mode
		if (config.range) {
			datePickerOpts.mode = 'range';
		}

		// Additional DatePicker options
		if (config.weekStarts !== undefined) {
			datePickerOpts.weekStarts = config.weekStarts;  // 0=Sun, 1=Mon
		}
		if (config.showWeekNumbers) {
			datePickerOpts.showWeekNumbers = true;
		}
		if (config.autoApply !== undefined) {
			datePickerOpts.autoApply = config.autoApply;
		}
		if (config.clearable !== undefined) {
			datePickerOpts.clearable = config.clearable;
		}

		// Event callbacks
		var self = this;
		datePickerOpts.onChange = function(date) {
			self._value = date;
			self._pristine = false;
			self._emitChange();
		};

		// Create DatePicker instance on the input element
		console.log('[DateField.render] Creating DatePicker with input:', input.el, 'opts:', datePickerOpts);
		this.datePickerInstance = global.Funky.DatePicker.create(input.el, datePickerOpts);
		console.log('[DateField.render] DatePicker instance:', this.datePickerInstance);

		// Set initial value
		if (this._value) {
			this.datePickerInstance.setValue(this._value);
		}

		// Store reference to the input element
		this.inputElement = input;

		// Apply initial state
		if (!this._visible) {
			this.hide();
		}
		if (!this._enabled) {
			this.disable();
		}

		return this.element;
	};

	DateField.prototype._renderNativeInput = function() {
		var parts = this._createWrapper();
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		var inputType = this.includeTime ? 'datetime-local' : 'date';

		var input = this._createElement('input', {
			type: inputType,
			id: fieldId,
			name: this.name,
			className: 'funky-form-input form-control'
		});

		if (config.placeholder) {
			input.el.placeholder = config.placeholder;
		}
		if (config.required) {
			input.el.required = true;
		}

		// Date constraints
		if (config.minDate) {
			var minDate = config.minDate === 'today'
				? new Date().toISOString().split('T')[0]
				: config.minDate;
			input.el.min = minDate;
		}
		if (config.maxDate) {
			var maxDate = config.maxDate === 'today'
				? new Date().toISOString().split('T')[0]
				: config.maxDate;
			input.el.max = maxDate;
		}

		// ARIA
		var ariaDescribedBy = [];
		if (config.help) {
			ariaDescribedBy.push(fieldId + '-help');
		}
		ariaDescribedBy.push(fieldId + '-error');
		input.attr('aria-describedby', ariaDescribedBy.join(' '));

		var self = this;
		input.on('change', function() {
			self._value = this.value || null;
			self._pristine = false;
			self._emitChange();
		});

		input.on('blur', function() {
			if (self.form && self.form.options.validateOnBlur) {
				self.validate();
			}
			self._emitEvent('blur');
		});

		parts.inputWrapper.append(input);
		this.inputElement = input;

		// Set initial value
		if (this._value) {
			input.el.value = this._value;
		}

		// Apply initial state
		if (!this._visible) {
			this.hide();
		}
		if (!this._enabled) {
			this.disable();
		}
		if (this._readonly) {
			this._setReadonly(true);
		}

		return this.element;
	};

	DateField.prototype.setValue = function(value, options) {
		this._value = value;
		this._pristine = false;

		if (this.datePickerInstance) {
			this.datePickerInstance.setValue(value);
		} else if (this.inputElement) {
			this.inputElement.value = value || '';
		}

		if (!options || !options.silent) {
			this._emitChange();
		}
	};

	DateField.prototype._updateInput = function() {
		if (this.datePickerInstance) {
			this.datePickerInstance.setValue(this._value);
		} else if (this.inputElement) {
			this.inputElement.value = this._value || '';
		}
	};

	DateField.prototype.enable = function() {
		BaseField.prototype.enable.call(this);
		if (this.datePickerInstance && this.datePickerInstance.enable) {
			this.datePickerInstance.enable();
		}
	};

	DateField.prototype.disable = function() {
		BaseField.prototype.disable.call(this);
		if (this.datePickerInstance && this.datePickerInstance.disable) {
			this.datePickerInstance.disable();
		}
	};

	DateField.prototype.destroy = function() {
		if (this.datePickerInstance && this.datePickerInstance.destroy) {
			this.datePickerInstance.destroy();
		}
		this.datePickerInstance = null;
		BaseField.prototype.destroy.call(this);
	};

	/**
	 * FileField - File upload with drag-and-drop
	 */
	function FileField(config, form) {
		BaseField.call(this, config, form);
		this._files = [];
		this._dropZone = null;
		this._fileList = null;
	}
	FileField.prototype = Object.create(BaseField.prototype);
	FileField.prototype.constructor = FileField;

	FileField.prototype.render = function() {
		var parts = this._createWrapper();
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// File input (visually hidden but accessible)
		var input = this._createElement('input', {
			type: 'file',
			id: fieldId,
			name: this.name,
			className: 'funky-form-file-input'
		});

		if (config.accept) {
			input.el.accept = config.accept;
		}
		if (config.multiple) {
			input.el.multiple = true;
		}
		if (config.required) {
			input.el.required = true;
		}

		// ARIA
		var ariaDescribedBy = [];
		if (config.help) {
			ariaDescribedBy.push(fieldId + '-help');
		}
		ariaDescribedBy.push(fieldId + '-error');
		input.attr('aria-describedby', ariaDescribedBy.join(' '));

		// Styled drop zone
		var dropZone = this._createElement('div', {
			className: 'funky-form-file-dropzone'
		});

		var dropIcon = this._createElement('div', {
			className: 'funky-form-file-icon'
		});
		dropIcon.html('<i class="fas fa-cloud-upload-alt"></i>');

		var dropText = this._createElement('div', {
			className: 'funky-form-file-text'
		});
		dropText.text(config.dropText || 'Drop files here or click to upload');

		var dropHint = this._createElement('div', {
			className: 'funky-form-file-hint'
		});
		dropHint.text(config.hint || '');

		dropZone.append(dropIcon);
		dropZone.append(dropText);
		if (config.hint) {
			dropZone.append(dropHint);
		}

		// File list preview
		var fileList = this._createElement('div', {
			className: 'funky-form-file-list'
		});

		var self = this;

		// Click to trigger file input
		dropZone.on('click', function() {
			if (!self._enabled) return;
			input.el.click();
		});

		// Keyboard accessibility
		dropZone.attr('tabindex', '0');
		dropZone.attr('role', 'button');
		dropZone.attr('aria-label', config.dropText || 'Click or drag to upload files');
		dropZone.on('keydown', function(e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (self._enabled) {
					input.el.click();
				}
			}
		});

		// Drag and drop
		dropZone.on('dragover', function(e) {
			e.preventDefault();
			if (!self._enabled) return;
			dropZone.classAdd('funky-form-file-dropzone--dragover');
		});

		dropZone.on('dragleave', function() {
			dropZone.classRemove('funky-form-file-dropzone--dragover');
		});

		dropZone.on('drop', function(e) {
			e.preventDefault();
			dropZone.classRemove('funky-form-file-dropzone--dragover');
			if (!self._enabled) return;
			self._handleFiles(e.dataTransfer.files);
		});

		// File selection
		input.on('change', function() {
			self._handleFiles(this.files);
		});

		parts.inputWrapper.append(input);
		parts.inputWrapper.append(dropZone);
		parts.inputWrapper.append(fileList);

		this.inputElement = input;
		this._dropZone = dropZone;
		this._fileList = fileList;

		// Apply initial state
		if (!this._visible) {
			this.hide();
		}
		if (!this._enabled) {
			this.disable();
		}

		return this.element;
	};

	FileField.prototype._handleFiles = function(fileList) {
		var config = this.config;
		var maxSize = config.maxSize || Infinity;
		var maxFiles = config.maxFiles || Infinity;

		if (!config.multiple) {
			this._files = [];
		}

		var errors = [];

		for (var i = 0; i < fileList.length && this._files.length < maxFiles; i++) {
			var file = fileList[i];

			// Size validation
			if (file.size > maxSize) {
				errors.push('File "' + file.name + '" exceeds maximum size of ' + this._formatSize(maxSize));
				continue;
			}

			this._files.push(file);
		}

		// Show errors if any
		if (errors.length > 0 && this.form && this.form._onFieldError) {
			this.form._onFieldError(this.name, errors.join(', '));
		}

		this._value = config.multiple ? this._files.slice() : (this._files[0] || null);
		this._pristine = false;
		this._updateFileList();
		this._emitChange();
	};

	FileField.prototype._updateFileList = function() {
		if (!this._fileList) return;

		var self = this;
		this._fileList.html('');

		this._files.forEach(function(file, index) {
			var item = self._createElement('div', {
				className: 'funky-form-file-item'
			});

			var nameSpan = self._createElement('span', {
				className: 'funky-form-file-name'
			});
			nameSpan.text(file.name);

			var sizeSpan = self._createElement('span', {
				className: 'funky-form-file-size'
			});
			sizeSpan.text(self._formatSize(file.size));

			var removeBtn = self._createElement('button', {
				type: 'button',
				className: 'funky-form-file-remove'
			});
			removeBtn.attr('type', 'button');
			removeBtn.attr('aria-label', 'Remove ' + file.name);
			removeBtn.html('&times;');
			removeBtn.on('click', function(e) {
				e.stopPropagation();
				self._removeFile(index);
			});

			item.append(nameSpan);
			item.append(sizeSpan);
			item.append(removeBtn);
			self._fileList.append(item);
		});
	};

	FileField.prototype._removeFile = function(index) {
		this._files.splice(index, 1);
		this._value = this.config.multiple ? this._files.slice() : (this._files[0] || null);
		this._pristine = false;
		this._updateFileList();
		this._emitChange();
	};

	FileField.prototype._formatSize = function(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	FileField.prototype.getValue = function() {
		return this._value;
	};

	FileField.prototype.getFiles = function() {
		return this._files.slice();
	};

	FileField.prototype.reset = function() {
		this._files = [];
		this._value = null;
		this._pristine = true;
		if (this.inputElement) {
			this.inputElement.value = '';
		}
		this._updateFileList();
		this.clearError();
	};

	FileField.prototype.disable = function() {
		BaseField.prototype.disable.call(this);
		if (this._dropZone) {
			this._dropZone.classAdd('funky-form-file-dropzone--disabled');
		}
	};

	FileField.prototype.enable = function() {
		BaseField.prototype.enable.call(this);
		if (this._dropZone) {
			this._dropZone.classRemove('funky-form-file-dropzone--disabled');
		}
	};

	// Register advanced field types
	FieldRegistry.register('combobox', {
		class: ComboBoxField,
		label: 'ComboBox',
		category: 'advanced',
		defaults: {
			options: [],
			searchable: true,
			clearable: true
		}
	});

	FieldRegistry.register('date', {
		class: DateField,
		label: 'Date',
		category: 'advanced',
		defaults: {
			format: 'YYYY-MM-DD'
		}
	});

	FieldRegistry.register('datetime', {
		class: DateField,
		label: 'Date & Time',
		category: 'advanced',
		defaults: {
			format: 'YYYY-MM-DD HH:mm',
			includeTime: true
		}
	});

	FieldRegistry.register('file', {
		class: FileField,
		label: 'File Upload',
		category: 'advanced',
		defaults: {
			accept: '*/*',
			multiple: false
		}
	});

	// =========================================================================
	// TIME FIELD
	// =========================================================================

	/**
	 * TimeField - Time-only input field
	 */
	function TimeField(config, form) {
		BaseField.call(this, config, form);
		this._step = config.step || 60; // Step in seconds (default 1 minute)
	}

	TimeField.prototype = Object.create(BaseField.prototype);
	TimeField.prototype.constructor = TimeField;

	TimeField.prototype._getInputType = function() {
		return 'time';
	};

	TimeField.prototype._renderInput = function() {
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		var input = this._createElement('input', {
			type: 'time',
			id: fieldId,
			name: this.name,
			className: 'funky-form-input funky-form-time form-control'
		});

		if (config.min) {
			input.attr('min', config.min);
		}
		if (config.max) {
			input.attr('max', config.max);
		}
		if (this._step) {
			input.attr('step', this._step);
		}
		if (config.required) {
			input.el.required = true;
		}

		this._bindInputEvents(input);
		return input;
	};

	TimeField.prototype.validate = function() {
		var value = this.getValue();
		var config = this.config;

		if (config.required && !value) {
			return { valid: false, message: config.requiredMessage || 'This field is required' };
		}

		if (value && config.min && value < config.min) {
			return { valid: false, message: config.minMessage || 'Time must be ' + config.min + ' or later' };
		}

		if (value && config.max && value > config.max) {
			return { valid: false, message: config.maxMessage || 'Time must be ' + config.max + ' or earlier' };
		}

		return { valid: true };
	};

	// =========================================================================
	// RANGE/SLIDER FIELD
	// =========================================================================

	/**
	 * RangeField - Range slider input
	 */
	function RangeField(config, form) {
		BaseField.call(this, config, form);
		this._min = config.min !== undefined ? config.min : 0;
		this._max = config.max !== undefined ? config.max : 100;
		this._step = config.step !== undefined ? config.step : 1;
		this._valueDisplay = null;
	}

	RangeField.prototype = Object.create(BaseField.prototype);
	RangeField.prototype.constructor = RangeField;

	RangeField.prototype._getInputType = function() {
		return 'range';
	};

	RangeField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper for slider + value display
		var wrapper = this._createElement('div', {
			className: 'funky-form-range-wrapper'
		});

		// Min label
		if (config.showMinMax !== false) {
			var minLabel = this._createElement('span', {
				className: 'funky-form-range-min'
			});
			minLabel.text(this._formatValue(this._min));
			wrapper.append(minLabel);
		}

		// Slider input
		var input = this._createElement('input', {
			type: 'range',
			id: fieldId,
			name: this.name,
			className: 'funky-form-range form-range'
		});

		input.attr('min', this._min);
		input.attr('max', this._max);
		input.attr('step', this._step);

		wrapper.append(input);

		// Max label
		if (config.showMinMax !== false) {
			var maxLabel = this._createElement('span', {
				className: 'funky-form-range-max'
			});
			maxLabel.text(this._formatValue(this._max));
			wrapper.append(maxLabel);
		}

		// Value display
		if (config.showValue !== false) {
			this._valueDisplay = this._createElement('span', {
				className: 'funky-form-range-value'
			});
			wrapper.append(this._valueDisplay);
		}

		this._inputElement = input;

		// Bind events
		input.on('input', function(e) {
			self._value = parseFloat(e.target.value);
			self._pristine = false;
			self._updateValueDisplay();
			self._emitChange();
		});

		return wrapper;
	};

	RangeField.prototype._formatValue = function(val) {
		var config = this.config;
		if (config.formatValue && typeof config.formatValue === 'function') {
			return config.formatValue(val);
		}
		if (config.suffix) {
			return val + config.suffix;
		}
		if (config.prefix) {
			return config.prefix + val;
		}
		return String(val);
	};

	RangeField.prototype._updateValueDisplay = function() {
		if (this._valueDisplay) {
			this._valueDisplay.text(this._formatValue(this._value));
		}
	};

	RangeField.prototype._updateInput = function() {
		if (this._inputElement && this._inputElement.el) {
			this._inputElement.el.value = this._value;
		}
		this._updateValueDisplay();
	};

	RangeField.prototype.getValue = function() {
		return this._value;
	};

	RangeField.prototype.setValue = function(value, options) {
		this._value = parseFloat(value) || this._min;
		if (!options || !options.silent) {
			this._updateInput();
		}
		return this;
	};

	// =========================================================================
	// COLOR FIELD
	// =========================================================================

	/**
	 * ColorField - Color picker input
	 */
	function ColorField(config, form) {
		BaseField.call(this, config, form);
		this._value = config.defaultValue || '#000000';
		this._previewEl = null;
	}

	ColorField.prototype = Object.create(BaseField.prototype);
	ColorField.prototype.constructor = ColorField;

	ColorField.prototype._getInputType = function() {
		return 'color';
	};

	ColorField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-color-wrapper'
		});

		// Color input
		var input = this._createElement('input', {
			type: 'color',
			id: fieldId,
			name: this.name,
			className: 'funky-form-color form-control form-control-color'
		});

		wrapper.append(input);

		// Color preview with hex value
		if (config.showHex !== false) {
			this._previewEl = this._createElement('span', {
				className: 'funky-form-color-hex'
			});
			this._previewEl.text(this._value);
			wrapper.append(this._previewEl);
		}

		// Preset swatches
		if (config.swatches && Array.isArray(config.swatches)) {
			var swatchContainer = this._createElement('div', {
				className: 'funky-form-color-swatches'
			});
			config.swatches.forEach(function(color) {
				var swatch = self._createElement('button', {
					type: 'button',
					className: 'funky-form-color-swatch'
				});
				swatch.style({ backgroundColor: color });
				swatch.attr('data-color', color);
				swatch.attr('aria-label', 'Select color ' + color);
				swatch.on('click', function() {
					self.setValue(color);
				});
				swatchContainer.append(swatch);
			});
			wrapper.append(swatchContainer);
		}

		this._inputElement = input;

		// Bind events
		input.on('input', function(e) {
			self._value = e.target.value;
			self._pristine = false;
			self._updatePreview();
			self._emitChange();
		});

		return wrapper;
	};

	ColorField.prototype._updatePreview = function() {
		if (this._previewEl) {
			this._previewEl.text(this._value.toUpperCase());
		}
	};

	ColorField.prototype._updateInput = function() {
		if (this._inputElement && this._inputElement.el) {
			this._inputElement.el.value = this._value;
		}
		this._updatePreview();
	};

	ColorField.prototype.validate = function() {
		var value = this.getValue();
		var config = this.config;

		if (config.required && !value) {
			return { valid: false, message: config.requiredMessage || 'This field is required' };
		}

		// Validate hex format
		if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
			return { valid: false, message: 'Please enter a valid hex color' };
		}

		return { valid: true };
	};

	// =========================================================================
	// SEARCH FIELD
	// =========================================================================

	/**
	 * SearchField - Search input with clear button
	 */
	function SearchField(config, form) {
		BaseField.call(this, config, form);
		this._clearBtn = null;
	}

	SearchField.prototype = Object.create(BaseField.prototype);
	SearchField.prototype.constructor = SearchField;

	SearchField.prototype._getInputType = function() {
		return 'search';
	};

	SearchField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-search-wrapper input-group'
		});

		// Search icon
		var iconWrapper = this._createElement('span', {
			className: 'funky-form-search-icon input-group-text'
		});
		iconWrapper.html('<i class="fas fa-search" aria-hidden="true"></i>');
		wrapper.append(iconWrapper);

		// Search input
		var input = this._createElement('input', {
			type: 'search',
			id: fieldId,
			name: this.name,
			className: 'funky-form-search form-control'
		});

		if (config.placeholder) {
			input.el.placeholder = config.placeholder;
		} else {
			input.el.placeholder = 'Search...';
		}

		wrapper.append(input);

		// Clear button
		this._clearBtn = this._createElement('button', {
			type: 'button',
			className: 'funky-form-search-clear btn btn-outline-secondary'
		});
		this._clearBtn.html('<i class="fas fa-times" aria-hidden="true"></i>');
		this._clearBtn.attr('aria-label', 'Clear search');
		this._clearBtn.style({ display: 'none' });

		this._clearBtn.on('click', function() {
			self.setValue('');
			self._inputElement.el.focus();
		});

		wrapper.append(this._clearBtn);

		this._inputElement = input;

		// Bind events
		input.on('input', function(e) {
			self._value = e.target.value;
			self._pristine = false;
			self._toggleClearBtn();
			self._emitChange();

			// Emit search-specific event
			if (self.form && self.form._emit) {
				self.form._emit('search', { field: self.name, query: self._value });
			}
		});

		// Search on Enter
		input.on('keydown', function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				if (self.form && self.form._emit) {
					self.form._emit('search:submit', { field: self.name, query: self._value });
				}
			}
		});

		return wrapper;
	};

	SearchField.prototype._toggleClearBtn = function() {
		if (this._clearBtn) {
			this._clearBtn.style({ display: this._value ? 'block' : 'none' });
		}
	};

	SearchField.prototype._updateInput = function() {
		BaseField.prototype._updateInput.call(this);
		this._toggleClearBtn();
	};

	// =========================================================================
	// CURRENCY/MONEY FIELD
	// =========================================================================

	/**
	 * CurrencyField - Formatted currency/money input
	 */
	function CurrencyField(config, form) {
		BaseField.call(this, config, form);
		this._currency = config.currency || 'USD';
		this._locale = config.locale || 'en-US';
		this._symbol = config.symbol || this._getCurrencySymbol();
		this._decimals = config.decimals !== undefined ? config.decimals : 2;
	}

	CurrencyField.prototype = Object.create(BaseField.prototype);
	CurrencyField.prototype.constructor = CurrencyField;

	CurrencyField.prototype._getCurrencySymbol = function() {
		var symbols = {
			USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
			INR: '₹', KRW: '₩', RUB: '₽', BRL: 'R$', AUD: 'A$'
		};
		return symbols[this._currency] || this._currency;
	};

	CurrencyField.prototype._getInputType = function() {
		return 'text';
	};

	CurrencyField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-currency-wrapper input-group'
		});

		// Currency symbol prefix
		var prefix = this._createElement('span', {
			className: 'funky-form-currency-symbol input-group-text'
		});
		prefix.text(this._symbol);
		wrapper.append(prefix);

		// Currency input
		var input = this._createElement('input', {
			type: 'text',
			inputmode: 'decimal',
			id: fieldId,
			name: this.name,
			className: 'funky-form-currency form-control'
		});

		if (config.placeholder) {
			input.el.placeholder = config.placeholder;
		} else {
			input.el.placeholder = '0.00';
		}

		wrapper.append(input);

		// Currency code suffix (optional)
		if (config.showCurrencyCode !== false) {
			var suffix = this._createElement('span', {
				className: 'funky-form-currency-code input-group-text'
			});
			suffix.text(this._currency);
			wrapper.append(suffix);
		}

		this._inputElement = input;

		// Bind events with formatting
		input.on('input', function(e) {
			var rawValue = self._parseValue(e.target.value);
			self._value = rawValue;
			self._pristine = false;
			self._emitChange();
		});

		input.on('blur', function() {
			// Format on blur
			if (self._value !== null && self._value !== undefined) {
				self._inputElement.el.value = self._formatValue(self._value);
			}
		});

		input.on('focus', function() {
			// Show raw value on focus for easier editing
			if (self._value !== null && self._value !== undefined) {
				self._inputElement.el.value = self._value.toString();
			}
		});

		return wrapper;
	};

	CurrencyField.prototype._parseValue = function(str) {
		if (!str) return null;
		// Remove all non-numeric except decimal point
		var cleaned = str.replace(/[^\d.-]/g, '');
		var parsed = parseFloat(cleaned);
		return isNaN(parsed) ? null : parsed;
	};

	CurrencyField.prototype._formatValue = function(val) {
		if (val === null || val === undefined) return '';
		return val.toFixed(this._decimals);
	};

	CurrencyField.prototype._updateInput = function() {
		if (this._inputElement && this._inputElement.el) {
			this._inputElement.el.value = this._formatValue(this._value);
		}
	};

	CurrencyField.prototype.validate = function() {
		var value = this.getValue();
		var config = this.config;

		if (config.required && (value === null || value === undefined)) {
			return { valid: false, message: config.requiredMessage || 'This field is required' };
		}

		if (value !== null) {
			if (config.min !== undefined && value < config.min) {
				return { valid: false, message: config.minMessage || 'Minimum value is ' + this._symbol + config.min.toFixed(this._decimals) };
			}
			if (config.max !== undefined && value > config.max) {
				return { valid: false, message: config.maxMessage || 'Maximum value is ' + this._symbol + config.max.toFixed(this._decimals) };
			}
		}

		return { valid: true };
	};

	// =========================================================================
	// PHONE FIELD
	// =========================================================================

	/**
	 * PhoneField - Phone number input with country code
	 */
	function PhoneField(config, form) {
		BaseField.call(this, config, form);
		this._countryCode = config.defaultCountryCode || '+1';
		this._countrySelect = null;
	}

	PhoneField.prototype = Object.create(BaseField.prototype);
	PhoneField.prototype.constructor = PhoneField;

	PhoneField.prototype._getInputType = function() {
		return 'tel';
	};

	PhoneField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-phone-wrapper input-group'
		});

		// Country code dropdown (optional)
		if (config.showCountryCode !== false) {
			var countries = config.countries || [
				{ code: '+1', name: 'US/Canada', flag: '🇺🇸' },
				{ code: '+44', name: 'UK', flag: '🇬🇧' },
				{ code: '+61', name: 'Australia', flag: '🇦🇺' },
				{ code: '+49', name: 'Germany', flag: '🇩🇪' },
				{ code: '+33', name: 'France', flag: '🇫🇷' },
				{ code: '+81', name: 'Japan', flag: '🇯🇵' },
				{ code: '+86', name: 'China', flag: '🇨🇳' },
				{ code: '+91', name: 'India', flag: '🇮🇳' }
			];

			this._countrySelect = this._createElement('select', {
				className: 'funky-form-phone-country form-select',
				'aria-label': 'Country code'
			});

			countries.forEach(function(country) {
				var option = self._createElement('option', {
					value: country.code
				});
				option.text(country.flag + ' ' + country.code);
				if (country.code === self._countryCode) {
					option.attr('selected', 'selected');
				}
				self._countrySelect.append(option);
			});

			this._countrySelect.on('change', function(e) {
				self._countryCode = e.target.value;
				self._emitChange();
			});

			wrapper.append(this._countrySelect);
		}

		// Phone number input
		var input = this._createElement('input', {
			type: 'tel',
			id: fieldId,
			name: this.name,
			className: 'funky-form-phone form-control',
			autocomplete: 'tel-national'
		});

		if (config.placeholder) {
			input.el.placeholder = config.placeholder;
		} else {
			input.el.placeholder = '(555) 123-4567';
		}

		wrapper.append(input);
		this._inputElement = input;

		// Bind events with formatting
		input.on('input', function(e) {
			var formatted = self._formatPhoneNumber(e.target.value);
			e.target.value = formatted;
			self._value = formatted;
			self._pristine = false;
			self._emitChange();
		});

		return wrapper;
	};

	PhoneField.prototype._formatPhoneNumber = function(value) {
		if (!value) return '';
		// Strip non-digits
		var digits = value.replace(/\D/g, '');

		// Format as (XXX) XXX-XXXX for US numbers
		if (digits.length <= 3) {
			return digits;
		} else if (digits.length <= 6) {
			return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
		} else {
			return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
		}
	};

	PhoneField.prototype.getValue = function() {
		if (this._countryCode && this._value) {
			return this._countryCode + ' ' + this._value;
		}
		return this._value;
	};

	PhoneField.prototype.validate = function() {
		var value = this._value;
		var config = this.config;

		if (config.required && !value) {
			return { valid: false, message: config.requiredMessage || 'This field is required' };
		}

		if (value) {
			var digits = value.replace(/\D/g, '');
			if (digits.length < 7) {
				return { valid: false, message: 'Please enter a valid phone number' };
			}
		}

		return { valid: true };
	};

	// =========================================================================
	// TAGS FIELD
	// =========================================================================

	/**
	 * TagsField - Multi-value tag input
	 */
	function TagsField(config, form) {
		BaseField.call(this, config, form);
		this._value = config.defaultValue || [];
		this._tagsContainer = null;
		this._tagInput = null;
		this._maxTags = config.maxTags || Infinity;
	}

	TagsField.prototype = Object.create(BaseField.prototype);
	TagsField.prototype.constructor = TagsField;

	TagsField.prototype._getInputType = function() {
		return 'text';
	};

	TagsField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-tags-wrapper'
		});

		// Tags container
		this._tagsContainer = this._createElement('div', {
			className: 'funky-form-tags-container'
		});
		wrapper.append(this._tagsContainer);

		// Input for new tags
		this._tagInput = this._createElement('input', {
			type: 'text',
			id: fieldId,
			className: 'funky-form-tags-input form-control',
			placeholder: config.placeholder || 'Type and press Enter to add'
		});

		wrapper.append(this._tagInput);

		this._inputElement = this._tagInput;

		// Bind events
		this._tagInput.on('keydown', function(e) {
			if (e.key === 'Enter' || e.key === ',') {
				e.preventDefault();
				var value = e.target.value.trim();
				if (value) {
					self._addTag(value);
					e.target.value = '';
				}
			} else if (e.key === 'Backspace' && !e.target.value && self._value.length > 0) {
				self._removeTag(self._value.length - 1);
			}
		});

		// Suggestions (optional)
		if (config.suggestions && Array.isArray(config.suggestions)) {
			this._tagInput.attr('list', fieldId + '-suggestions');
			var datalist = this._createElement('datalist', { id: fieldId + '-suggestions' });
			config.suggestions.forEach(function(suggestion) {
				var option = self._createElement('option', { value: suggestion });
				datalist.append(option);
			});
			wrapper.append(datalist);
		}

		// Render existing tags
		this._renderTags();

		return wrapper;
	};

	TagsField.prototype._renderTags = function() {
		var self = this;
		this._tagsContainer.empty();

		this._value.forEach(function(tag, index) {
			var tagEl = self._createElement('span', {
				className: 'funky-form-tag badge bg-primary'
			});
			tagEl.html(self._escapeHtml(tag) + ' <button type="button" class="funky-form-tag-remove" aria-label="Remove ' + tag + '">&times;</button>');

			var removeBtn = tagEl.find('.funky-form-tag-remove');
			if (removeBtn) {
				removeBtn.on('click', function() {
					self._removeTag(index);
				});
			}

			self._tagsContainer.append(tagEl);
		});
	};

	TagsField.prototype._escapeHtml = function(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	};

	TagsField.prototype._addTag = function(tag) {
		tag = tag.trim();
		if (!tag) return;
		if (this._value.length >= this._maxTags) return;
		if (this._value.indexOf(tag) !== -1) return; // No duplicates

		this._value.push(tag);
		this._pristine = false;
		this._renderTags();
		this._emitChange();
	};

	TagsField.prototype._removeTag = function(index) {
		this._value.splice(index, 1);
		this._pristine = false;
		this._renderTags();
		this._emitChange();
	};

	TagsField.prototype.getValue = function() {
		return this._value.slice(); // Return copy
	};

	TagsField.prototype.setValue = function(value, options) {
		if (Array.isArray(value)) {
			this._value = value.slice();
		} else if (typeof value === 'string') {
			this._value = value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
		} else {
			this._value = [];
		}
		this._renderTags();
		return this;
	};

	TagsField.prototype._updateInput = function() {
		this._renderTags();
	};

	TagsField.prototype.validate = function() {
		var value = this.getValue();
		var config = this.config;

		if (config.required && value.length === 0) {
			return { valid: false, message: config.requiredMessage || 'At least one tag is required' };
		}

		if (config.minTags && value.length < config.minTags) {
			return { valid: false, message: 'At least ' + config.minTags + ' tags required' };
		}

		if (config.maxTags && value.length > config.maxTags) {
			return { valid: false, message: 'Maximum ' + config.maxTags + ' tags allowed' };
		}

		return { valid: true };
	};

	// =========================================================================
	// RATING FIELD
	// =========================================================================

	/**
	 * RatingField - Star rating input
	 */
	function RatingField(config, form) {
		BaseField.call(this, config, form);
		this._value = config.defaultValue || 0;
		this._maxRating = config.max || 5;
		this._allowHalf = config.allowHalf || false;
		this._stars = [];
	}

	RatingField.prototype = Object.create(BaseField.prototype);
	RatingField.prototype.constructor = RatingField;

	RatingField.prototype._getInputType = function() {
		return 'hidden';
	};

	RatingField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-rating-wrapper',
			role: 'radiogroup',
			'aria-label': config.label || 'Rating'
		});

		// Stars container
		var starsContainer = this._createElement('div', {
			className: 'funky-form-rating-stars'
		});

		for (var i = 1; i <= this._maxRating; i++) {
			var star = this._createStar(i);
			this._stars.push(star);
			starsContainer.append(star);
		}

		wrapper.append(starsContainer);

		// Value label (optional)
		if (config.showValue !== false) {
			this._valueLabel = this._createElement('span', {
				className: 'funky-form-rating-value'
			});
			wrapper.append(this._valueLabel);
		}

		// Hidden input for form submission
		this._inputElement = this._createElement('input', {
			type: 'hidden',
			id: fieldId,
			name: this.name
		});
		wrapper.append(this._inputElement);

		this._updateStars();

		return wrapper;
	};

	RatingField.prototype._createStar = function(value) {
		var self = this;
		var star = this._createElement('button', {
			type: 'button',
			className: 'funky-form-rating-star',
			'data-value': value,
			role: 'radio',
			'aria-label': value + ' star' + (value !== 1 ? 's' : '')
		});
		star.html('<i class="far fa-star" aria-hidden="true"></i>');

		star.on('click', function() {
			if (!self._enabled) return;
			self._value = value;
			self._pristine = false;
			self._updateStars();
			self._emitChange();
		});

		star.on('mouseenter', function() {
			if (!self._enabled) return;
			self._highlightStars(value);
		});

		star.on('mouseleave', function() {
			if (!self._enabled) return;
			self._updateStars();
		});

		// Keyboard navigation
		star.on('keydown', function(e) {
			if (e.key === 'ArrowRight' && value < self._maxRating) {
				self._stars[value].el.focus();
			} else if (e.key === 'ArrowLeft' && value > 1) {
				self._stars[value - 2].el.focus();
			}
		});

		return star;
	};

	RatingField.prototype._highlightStars = function(upTo) {
		this._stars.forEach(function(star, index) {
			var icon = star.find('i');
			if (index < upTo) {
				icon.classRemove('far').classAdd('fas');
				star.classAdd('highlighted');
			} else {
				icon.classRemove('fas').classAdd('far');
				star.classRemove('highlighted');
			}
		});
	};

	RatingField.prototype._updateStars = function() {
		var self = this;
		this._stars.forEach(function(star, index) {
			var icon = star.find('i');
			if (index < self._value) {
				icon.classRemove('far').classAdd('fas');
				star.classAdd('selected');
				star.attr('aria-checked', 'true');
			} else {
				icon.classRemove('fas').classAdd('far');
				star.classRemove('selected');
				star.attr('aria-checked', 'false');
			}
		});

		if (this._inputElement && this._inputElement.el) {
			this._inputElement.el.value = this._value;
		}

		if (this._valueLabel) {
			this._valueLabel.text(this._value + '/' + this._maxRating);
		}
	};

	RatingField.prototype._updateInput = function() {
		this._updateStars();
	};

	RatingField.prototype.getValue = function() {
		return this._value;
	};

	RatingField.prototype.setValue = function(value, options) {
		this._value = Math.max(0, Math.min(this._maxRating, parseFloat(value) || 0));
		if (!options || !options.silent) {
			this._updateStars();
		}
		return this;
	};

	RatingField.prototype.validate = function() {
		var value = this.getValue();
		var config = this.config;

		if (config.required && !value) {
			return { valid: false, message: config.requiredMessage || 'Please provide a rating' };
		}

		if (config.min && value < config.min) {
			return { valid: false, message: 'Minimum rating is ' + config.min };
		}

		return { valid: true };
	};

	// =========================================================================
	// SIGNATURE FIELD
	// =========================================================================

	/**
	 * SignatureField - Signature capture using Funky.Signature
	 */
	function SignatureField(config, form) {
		BaseField.call(this, config, form);
		this._signatureInstance = null;
		this._signatureContainer = null;
	}

	SignatureField.prototype = Object.create(BaseField.prototype);
	SignatureField.prototype.constructor = SignatureField;

	SignatureField.prototype._getInputType = function() {
		return 'hidden';
	};

	SignatureField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-signature-wrapper'
		});

		// Signature container
		this._signatureContainer = this._createElement('div', {
			className: 'funky-form-signature-container',
			id: fieldId + '-pad'
		});
		wrapper.append(this._signatureContainer);

		// Toolbar
		var toolbar = this._createElement('div', {
			className: 'funky-form-signature-toolbar'
		});

		var clearBtn = this._createElement('button', {
			type: 'button',
			className: 'funky-form-signature-clear btn btn-sm btn-outline-secondary'
		});
		clearBtn.html('<i class="fas fa-eraser me-1" aria-hidden="true"></i>Clear');
		clearBtn.on('click', function() {
			if (self._signatureInstance) {
				self._signatureInstance.clear();
				self._value = null;
				self._emitChange();
			}
		});
		toolbar.append(clearBtn);

		wrapper.append(toolbar);

		// Hidden input for form submission
		this._inputElement = this._createElement('input', {
			type: 'hidden',
			id: fieldId,
			name: this.name
		});
		wrapper.append(this._inputElement);

		// Initialize Funky.Signature after DOM is ready
		setTimeout(function() {
			self._initSignature(config);
		}, 0);

		return wrapper;
	};

	SignatureField.prototype._initSignature = function(config) {
		var self = this;

		if (!Funky.Signature) {
			console.warn('[SignatureField] Funky.Signature not available');
			return;
		}

		this._signatureInstance = Funky.Signature.init(this._signatureContainer.el, {
			width: config.width || 400,
			height: config.height || 150,
			penColour: config.penColor || '#000000',
			penWidth: config.penWidth || 2,
			backgroundColour: config.backgroundColor || '#ffffff',
			required: config.required || false,
			showTypedOption: config.showTypedOption !== false,
			name: this.name,
			onChange: function() {
				self._value = self._signatureInstance.isEmpty() ? null : self._signatureInstance.toDataURL();
				if (self._inputElement && self._inputElement.el) {
					self._inputElement.el.value = self._value || '';
				}
				self._pristine = false;
				self._emitChange();
			}
		});

		// Set initial value if provided
		if (this._value && typeof this._value === 'string' && this._value.startsWith('data:')) {
			// Load from data URL - would need to draw on canvas
		}
	};

	SignatureField.prototype.getValue = function() {
		if (this._signatureInstance && !this._signatureInstance.isEmpty()) {
			return this._signatureInstance.toDataURL();
		}
		return this._value;
	};

	SignatureField.prototype.setValue = function(value, options) {
		this._value = value;
		// Cannot easily set signature from data URL, so just store the value
		return this;
	};

	SignatureField.prototype.reset = function() {
		if (this._signatureInstance) {
			this._signatureInstance.clear();
		}
		this._value = null;
		this._pristine = true;
		this.clearError();
	};

	SignatureField.prototype.validate = function() {
		var config = this.config;

		if (config.required && this._signatureInstance && this._signatureInstance.isEmpty()) {
			return { valid: false, message: config.requiredMessage || 'Signature is required' };
		}

		return { valid: true };
	};

	SignatureField.prototype.destroy = function() {
		if (this._signatureInstance) {
			this._signatureInstance.destroy();
			this._signatureInstance = null;
		}
		BaseField.prototype.destroy.call(this);
	};

	// =========================================================================
	// CODE FIELD
	// =========================================================================

	/**
	 * CodeField - Code editor using Funky.CodePreview
	 */
	function CodeField(config, form) {
		BaseField.call(this, config, form);
		this._codeInstance = null;
		this._codeContainer = null;
		this._value = config.defaultValue || '';
	}

	CodeField.prototype = Object.create(BaseField.prototype);
	CodeField.prototype.constructor = CodeField;

	CodeField.prototype._getInputType = function() {
		return 'hidden';
	};

	CodeField.prototype._renderInput = function() {
		var self = this;
		var config = this.config;
		var formId = this.form ? this.form.id : 'form';
		var fieldId = formId + '-' + this.name;

		// Create wrapper
		var wrapper = this._createElement('div', {
			className: 'funky-form-code-wrapper'
		});

		// Code container
		this._codeContainer = this._createElement('div', {
			className: 'funky-form-code-container',
			id: fieldId + '-editor'
		});
		wrapper.append(this._codeContainer);

		// Hidden input for form submission
		this._inputElement = this._createElement('input', {
			type: 'hidden',
			id: fieldId,
			name: this.name
		});
		wrapper.append(this._inputElement);

		// Initialize Funky.CodePreview after DOM is ready
		setTimeout(function() {
			self._initCodeEditor(config);
		}, 0);

		return wrapper;
	};

	CodeField.prototype._initCodeEditor = function(config) {
		var self = this;

		if (!Funky.CodePreview) {
			console.warn('[CodeField] Funky.CodePreview not available');
			return;
		}

		this._codeInstance = Funky.CodePreview.init(this._codeContainer.el, {
			language: config.language || 'javascript',
			lineNumbers: config.lineNumbers !== false,
			showCopy: config.showCopy !== false,
			showLanguage: config.showLanguage !== false,
			editable: true,
			maxHeight: config.maxHeight || 300,
			wrapLines: config.wrapLines || false,
			tabSize: config.tabSize || 2,
			onChange: function(code) {
				self._value = code;
				if (self._inputElement && self._inputElement.el) {
					self._inputElement.el.value = code;
				}
				self._pristine = false;
				self._emitChange();
			}
		});

		// Set initial value
		if (this._value) {
			this._codeInstance.setCode(this._value);
		}
	};

	CodeField.prototype.getValue = function() {
		if (this._codeInstance) {
			return this._codeInstance.getCode();
		}
		return this._value;
	};

	CodeField.prototype.setValue = function(value, options) {
		this._value = value || '';
		if (this._codeInstance) {
			this._codeInstance.setCode(this._value);
		}
		if (this._inputElement && this._inputElement.el) {
			this._inputElement.el.value = this._value;
		}
		return this;
	};

	CodeField.prototype._updateInput = function() {
		if (this._codeInstance && this._value) {
			this._codeInstance.setCode(this._value);
		}
	};

	CodeField.prototype.validate = function() {
		var value = this.getValue();
		var config = this.config;

		if (config.required && !value) {
			return { valid: false, message: config.requiredMessage || 'This field is required' };
		}

		if (config.minLength && value.length < config.minLength) {
			return { valid: false, message: 'Code must be at least ' + config.minLength + ' characters' };
		}

		return { valid: true };
	};

	CodeField.prototype.destroy = function() {
		if (this._codeInstance) {
			this._codeInstance.destroy();
			this._codeInstance = null;
		}
		BaseField.prototype.destroy.call(this);
	};

	// =========================================================================
	// REGISTER NEW FIELD TYPES
	// =========================================================================

	FieldRegistry.register('time', {
		class: TimeField,
		label: 'Time',
		category: 'advanced',
		defaults: {
			step: 60
		}
	});

	FieldRegistry.register('range', {
		class: RangeField,
		label: 'Range/Slider',
		category: 'advanced',
		defaults: {
			min: 0,
			max: 100,
			step: 1,
			showValue: true,
			showMinMax: true
		}
	});

	FieldRegistry.register('slider', {
		class: RangeField,
		label: 'Slider',
		category: 'advanced',
		defaults: {
			min: 0,
			max: 100,
			step: 1,
			showValue: true,
			showMinMax: true
		}
	});

	FieldRegistry.register('color', {
		class: ColorField,
		label: 'Color Picker',
		category: 'advanced',
		defaults: {
			showHex: true
		}
	});

	FieldRegistry.register('search', {
		class: SearchField,
		label: 'Search',
		category: 'basic',
		defaults: {
			placeholder: 'Search...'
		}
	});

	FieldRegistry.register('currency', {
		class: CurrencyField,
		label: 'Currency',
		category: 'advanced',
		defaults: {
			currency: 'USD',
			decimals: 2,
			showCurrencyCode: true
		}
	});

	FieldRegistry.register('money', {
		class: CurrencyField,
		label: 'Money',
		category: 'advanced',
		defaults: {
			currency: 'USD',
			decimals: 2,
			showCurrencyCode: true
		}
	});

	FieldRegistry.register('phone', {
		class: PhoneField,
		label: 'Phone',
		category: 'advanced',
		defaults: {
			defaultCountryCode: '+1',
			showCountryCode: true
		}
	});

	FieldRegistry.register('tel', {
		class: PhoneField,
		label: 'Telephone',
		category: 'advanced',
		defaults: {
			defaultCountryCode: '+1',
			showCountryCode: true
		}
	});

	FieldRegistry.register('tags', {
		class: TagsField,
		label: 'Tags',
		category: 'advanced',
		defaults: {
			maxTags: 10
		}
	});

	FieldRegistry.register('rating', {
		class: RatingField,
		label: 'Rating',
		category: 'advanced',
		defaults: {
			max: 5,
			allowHalf: false,
			showValue: true
		}
	});

	FieldRegistry.register('signature', {
		class: SignatureField,
		label: 'Signature',
		category: 'advanced',
		defaults: {
			width: 400,
			height: 150,
			showTypedOption: true
		}
	});

	FieldRegistry.register('code', {
		class: CodeField,
		label: 'Code Editor',
		category: 'advanced',
		defaults: {
			language: 'javascript',
			lineNumbers: true,
			maxHeight: 300
		}
	});

	// =========================================================================
	// EXPOSE API
	// =========================================================================

	// Expose on temporary namespace - form.js will attach to Funky.Form after registration
	global._FunkyFormInternal = global._FunkyFormInternal || {};
	global._FunkyFormInternal.FieldRegistry = FieldRegistry;
	global._FunkyFormInternal.BaseField = BaseField;

})(typeof window !== 'undefined' ? window : this);
