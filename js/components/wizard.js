/**
 * Funky Wizard - Multi-step Modal Wizard
 *
 * Provides a flexible wizard system for complex forms with:
 * - Multiple step types: Form, ACE Editor, Checkboxes, Custom
 * - Schema loading from OpenAPI spec via schemaPath
 * - Create/Edit modes
 * - Step validation
 * - State management
 *
 * Usage:
 *   var wizard = new Funky.Wizard.create({
 *     modalId: 'myWizardModal',
 *     title: 'Create Trade',
 *     steps: [
 *       { type: 'form', stateKey: 'details', schemaPath: 'CreateTrade' },
 *       { type: 'form', stateKey: 'options', schema: { fields: {...} } },
 *       { type: 'checkboxes', stateKey: 'flags', getOptions: fn }
 *     ],
 *     onSave: function(state, mode) { return Promise.resolve(); }
 *   });
 *
 *   wizard.create(); // Open in create mode
 *   wizard.edit(existingData); // Open in edit mode
 *
 * Step Types:
 *   - form: Native Funky.Form (getData/setData API) - recommended
 *   - ace: ACE code editor for JSON/code
 *   - checkboxes: Multi-select checkbox list
 *   - custom: User-defined via onInit callback
 *
 * @version 1.0.1
 * @see Funky.Schema for schema management
 * @see Funky.Form for native form rendering
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Wizard] Registry not found. Load namespace.js first.');
		return;
	}

	// Ensure Funky.Modal is available (required dependency)
	if (!Funky.Modal) {
		console.error('[Funky.Wizard] Funky.Modal is required. Load modal.js first.');
		return;
	}

	/**
	 * FunkyWizard Constructor
	 * @param {Object} config - Configuration object
	 */
	function FunkyWizard(config) {
		if (!config.modalId) {
			throw new Error('FunkyWizard requires modalId');
		}
		if (!config.steps || !Array.isArray(config.steps) || config.steps.length === 0) {
			throw new Error('FunkyWizard requires at least one step');
		}

		this.config = config;
		this.modalId = config.modalId;
		this.modal = null;
		this.steps = config.steps;
		this.currentStep = 1;
		this.mode = 'create';
		this.state = {};
		this.editors = {};
		this.onSave = config.onSave;
		this.onCancel = config.onCancel;
		this._fieldLinkState = {};

		this._init();
	}

	/**
	 * Initialize the wizard
	 */
	FunkyWizard.prototype._init = function() {
		var self = this;
		var modalElement = document.getElementById(this.modalId);
		if (!modalElement) {
			throw new Error('Modal element not found: ' + this.modalId);
		}

		this.modal = Funky.Modal.getOrCreateInstance(modalElement);

		// Register instance
		_instances.register(this.modalId, this);

		modalElement.addEventListener('funky.modal.hidden', function() {
			self.reset();
			if (self.onCancel && typeof self.onCancel === 'function') {
				self.onCancel();
			}
		});
	};

	/**
	 * Open the wizard in create mode
	 */
	FunkyWizard.prototype.create = function(initialData) {
		this.mode = 'create';
		this.state = initialData || {};
		this.reset();
		this._initializeStep(1);
		this.modal.show();
	};

	/**
	 * Open the wizard in edit mode
	 */
	FunkyWizard.prototype.edit = function(data) {
		this.mode = 'edit';
		this.state = JSON.parse(JSON.stringify(data));
		this.reset();
		this._initializeStep(1);
		this.modal.show();
	};

	/**
	 * Reset the wizard to initial state
	 */
	FunkyWizard.prototype.reset = function() {
		var self = this;
		this.currentStep = 1;

		Object.keys(this.editors).forEach(function(stepNum) {
			var editor = self.editors[stepNum];
			if (editor && editor.destroy) {
				editor.destroy();
			}
		});
		this.editors = {};

		this._showStep(1);
	};

	/**
	 * Go to next step
	 */
	FunkyWizard.prototype.next = function() {
		if (!this._validateCurrentStep()) {
			return;
		}

		this._saveCurrentStepData();

		if (this.currentStep < this.steps.length) {
			this.currentStep++;
			this._showStep(this.currentStep);

			if (!this.editors[this.currentStep]) {
				this._initializeStep(this.currentStep);
			}
		}
	};

	/**
	 * Go to previous step
	 */
	FunkyWizard.prototype.previous = function() {
		this._saveCurrentStepData(true);

		if (this.currentStep > 1) {
			this.currentStep--;
			this._showStep(this.currentStep);
		}
	};

	/**
	 * Save the wizard
	 */
	FunkyWizard.prototype.save = function() {
		var self = this;

		if (!this._validateCurrentStep()) {
			return;
		}

		this._saveCurrentStepData();
		this._setLoadingState(true);

		if (this.onSave && typeof this.onSave === 'function') {
			Promise.resolve(this.onSave(this.state, this.mode))
				.then(function() {
					self.modal.hide();
				})
				.catch(function(error) {
					console.error('[Funky.Wizard] Save error:', error);
					alert('Error saving: ' + error.message);
				})
				.finally(function() {
					self._setLoadingState(false);
				});
		}
	};

	/**
	 * Initialize a specific step
	 */
	FunkyWizard.prototype._initializeStep = function(stepNum) {
		var stepConfig = this.steps[stepNum - 1];
		if (!stepConfig) return;

		// Support legacy 'jsoneditor' type - treat as 'form'
		if (stepConfig.type === 'jsoneditor' || stepConfig.type === 'form') {
			this._initFormStep(stepNum, stepConfig);
		} else if (stepConfig.type === 'ace') {
			this._initACEEditor(stepNum, stepConfig);
		} else if (stepConfig.type === 'checkboxes') {
			this._initCheckboxes(stepNum, stepConfig);
		} else if (stepConfig.type === 'custom' && stepConfig.onInit) {
			stepConfig.onInit(this, stepNum);
		}
	};

	/**
	 * Initialize ACE Editor for a step
	 */
	FunkyWizard.prototype._initACEEditor = function(stepNum, stepConfig) {
		var containerId = stepConfig.containerId || 'wizard-step-' + stepNum + '-editor';

		if (this.editors[stepNum]) {
			this.editors[stepNum].destroy();
		}

		var editor = ace.edit(containerId);
		editor.session.setUseWorker(false);
		editor.setTheme(stepConfig.theme || "ace/theme/monokai");
		editor.session.setMode(stepConfig.mode || "ace/mode/json");
		editor.setOptions({
			fontSize: stepConfig.fontSize || "14px",
			showPrintMargin: false,
			enableBasicAutocompletion: true,
			enableLiveAutocompletion: true
		});

		var value = stepConfig.getStartValue ?
			stepConfig.getStartValue(this.state) :
			(this.state[stepConfig.stateKey] || stepConfig.defaultValue || {});

		if (typeof value === 'object') {
			value = JSON.stringify(value, null, 2);
		}

		editor.setValue(value, -1);
		editor.clearSelection();
		editor.moveCursorTo(0, 0);

		this.editors[stepNum] = editor;
	};

	/**
	 * Initialize checkboxes for a step
	 */
	FunkyWizard.prototype._initCheckboxes = function(stepNum, stepConfig) {
		var self = this;
		var containerId = stepConfig.containerId || 'wizard-step-' + stepNum + '-container';
		var container = document.getElementById(containerId);

		if (!container) {
			console.error('[Funky.Wizard] Container not found:', containerId);
			return;
		}

		container.innerHTML = '';
		var D = Funky.Dom;

		var options = stepConfig.getOptions ? stepConfig.getOptions(this.state) : [];

		if (options.length === 0) {
			// Use alertBox if available, otherwise div with role="alert"
			var emptyEl = D.div()
				.class('alert alert-info')
				.attr('role', 'status');
			emptyEl.get().appendChild(Funky.Util.toDom(stepConfig.emptyMessage || 'No options available'));
			container.appendChild(emptyEl.get());
			return;
		}

		var selectedValues = this.state[stepConfig.stateKey] || [];

		// Wrap checkbox group in fieldset with legend for accessibility
		var fieldset = D.create('fieldset')
			.class('wizard-checkbox-group border-0 p-0 m-0')
			.child(
				D.create('legend')
					.class('visually-hidden')
					.text(stepConfig.legend || stepConfig.label || 'Select options')
			);

		options.forEach(function(option) {
			var isChecked = selectedValues.includes(option.value);
			var checkboxId = 'wizard_' + stepNum + '_' + option.value;
			var descId = option.description ? checkboxId + '-desc' : null;

			var labelContent = D.label()
				.attr('for', checkboxId);
			labelContent.el.appendChild(Funky.Util.toDom(option.label));

			var checkboxEl = D.input()
				.attr('type', 'checkbox')
				.attr('id', checkboxId)
				.attr('value', option.value);
			if (isChecked) {
				checkboxEl.attr('checked', '');
			}
			if (descId) {
				checkboxEl.aria('describedby', descId);
			}

			var item = D.div()
				.class(D.classes('clear-field-item', isChecked && 'selected'))
				.child(
					checkboxEl,
					labelContent
				);

			// Add description if provided (outside label, linked via aria-describedby)
			if (option.description) {
				item.child(
					D.small()
						.id(descId)
						.class('text-muted d-block ms-4')
						.text(option.description)
				);
			}

			// Event listener for click on item container
			item.get().addEventListener('click', function(e) {
				if (e.target.type !== 'checkbox' && e.target.tagName !== 'LABEL') {
					var checkbox = this.querySelector('input[type="checkbox"]');
					checkbox.checked = !checkbox.checked;
					checkbox.dispatchEvent(new Event('change'));
				}
			});

			// Event listener for checkbox change
			checkboxEl.get().addEventListener('change', function() {
				var value = this.value;
				var checked = this.checked;
				self._handleCheckboxChange(stepNum, stepConfig.stateKey, value, checked);
				this.closest('.clear-field-item').classList.toggle('selected', checked);
			});

			fieldset.child(item);
		});

		container.appendChild(fieldset.get());
	};

	/**
	 * Handle checkbox state change
	 * @private
	 */
	FunkyWizard.prototype._handleCheckboxChange = function(stepNum, stateKey, value, checked) {
		if (!this.state[stateKey]) {
			this.state[stateKey] = [];
		}

		if (checked) {
			if (!this.state[stateKey].includes(value)) {
				this.state[stateKey].push(value);
			}
		} else {
			this.state[stateKey] = this.state[stateKey].filter(function(v) { return v !== value; });
		}
	};

	/**
	 * Initialize Funky.Form for a step
	 * Handles both 'form' and legacy 'jsoneditor' step types
	 * @param {number} stepNum - Step number (1-based)
	 * @param {Object} stepConfig - Step configuration
	 */
	FunkyWizard.prototype._initFormStep = function(stepNum, stepConfig) {
		var self = this;
		// Support both legacy '-editor' suffix (from jsoneditor) and new '-form' suffix
		var containerId = stepConfig.containerId || 'wizard-step-' + stepNum + '-form';
		var container = document.getElementById(containerId);

		// Fallback to legacy container ID if new one not found
		if (!container) {
			containerId = 'wizard-step-' + stepNum + '-editor';
			container = document.getElementById(containerId);
		}

		if (!container) {
			console.error('[Funky.Wizard] Form container not found:', containerId);
			return;
		}

		// Allow custom init to override
		if (stepConfig.onInit) {
			stepConfig.onInit(this, stepNum, stepConfig);
			return;
		}

		// Check Funky.Form availability
		if (!Funky.Form) {
			console.error('[Funky.Wizard] Funky.Form not available. Load form.js first.');
			return;
		}

		// Resolve schema via schemaPath if needed
		var schema = stepConfig.schema;
		if (stepConfig.schemaPath && !schema && Funky.Schema) {
			if (Funky.Schema.isReady()) {
				schema = Funky.Schema.getResolved(stepConfig.schemaPath);
			} else {
				// Wait for schema to be ready
				Funky.Schema.ready().then(function() {
					self._initFormStep(stepNum, stepConfig);
				});
				return;
			}
		}

		if (!schema) {
			console.error('[Funky.Wizard] No schema for form step:', stepNum);
			return;
		}

		// Convert JSONSchema to native format if needed
		if (schema.type === 'object' && schema.properties && !schema.fields) {
			if (Funky.SchemaAdapter) {
				schema = Funky.SchemaAdapter.convert(schema);
			}
		}

		// Apply schema enhancement if provided
		if (stepConfig.enhanceSchema && typeof stepConfig.enhanceSchema === 'function') {
			schema = stepConfig.enhanceSchema(JSON.parse(JSON.stringify(schema)), this.state);
		}

		// Get initial values
		var startval = stepConfig.getStartValue
			? stepConfig.getStartValue(this.state)
			: (this.state[stepConfig.stateKey] || stepConfig.defaultValue || {});

		// Create form instance
		var form = Funky.Form.create(container, {
			schema: schema,
			data: startval,
			mode: this.mode === 'edit' ? 'edit' : 'create',
			validateOnChange: stepConfig.validateOnChange !== false,
			validateOnBlur: stepConfig.validateOnBlur !== false,
			disabled: stepConfig.disabled || false
		});

		this.editors[stepNum] = form;
	};

	/**
	 * Validate current step
	 */
	FunkyWizard.prototype._validateCurrentStep = function() {
		var stepConfig = this.steps[this.currentStep - 1];
		var editor = this.editors[this.currentStep];

		// Funky.Form validation: returns {valid, errors: {field: []}}
		// Handles both 'form' and legacy 'jsoneditor' types (both now use Funky.Form)
		if ((stepConfig.type === 'form' || stepConfig.type === 'jsoneditor') && editor && editor.validate) {
			var result = editor.validate();
			if (!result.valid) {
				var messages = Object.keys(result.errors).map(function(field) {
					return field + ': ' + result.errors[field].join(', ');
				}).join('\n');
				alert('Please fix validation errors:\n\n' + messages);
				return false;
			}
		}

		if (stepConfig.type === 'ace' && editor && stepConfig.mode === 'ace/mode/json') {
			try {
				var value = editor.getValue().trim();
				if (value) {
					JSON.parse(value);
				}
			} catch (e) {
				alert('Invalid JSON: ' + e.message);
				return false;
			}
		}

		if (stepConfig.validate && typeof stepConfig.validate === 'function') {
			return stepConfig.validate(this.state, editor);
		}

		return true;
	};

	/**
	 * Save current step data to state
	 */
	FunkyWizard.prototype._saveCurrentStepData = function(skipValidation) {
		var stepConfig = this.steps[this.currentStep - 1];
		var editor = this.editors[this.currentStep];

		if (!stepConfig.stateKey) return;

		// Both 'form' and legacy 'jsoneditor' types now use Funky.Form with getData()
		if ((stepConfig.type === 'form' || stepConfig.type === 'jsoneditor') && editor && editor.getData) {
			this.state[stepConfig.stateKey] = editor.getData();
		} else if (stepConfig.type === 'ace' && editor && editor.getValue) {
			var value = editor.getValue().trim();
			if (stepConfig.mode === 'ace/mode/json') {
				try {
					this.state[stepConfig.stateKey] = value ? JSON.parse(value) : {};
				} catch (e) {
					if (!skipValidation) {
						console.error('[Funky.Wizard] Error parsing JSON:', e);
					}
				}
			} else {
				this.state[stepConfig.stateKey] = value;
			}
		}

		if (stepConfig.onSave && typeof stepConfig.onSave === 'function') {
			stepConfig.onSave(this.state, editor);
		}
	};

	/**
	 * Show a specific step
	 */
	FunkyWizard.prototype._showStep = function(stepNum) {
		var self = this;
		var modal = document.getElementById(this.modalId);
		var D = Funky.Dom;

		// Guard against calls during/after destruction
		if (!modal) {
			return;
		}

		for (var i = 1; i <= this.steps.length; i++) {
			var stepElement = modal.querySelector('#wizard-step-' + i);
			if (stepElement) {
				stepElement.style.display = 'none';
			}
			var stepIndicator = modal.querySelector('.wizard-step[data-step="' + i + '"]');
			if (stepIndicator) {
				stepIndicator.classList.remove('active', 'completed');
				// Remove aria-current from all steps
				stepIndicator.removeAttribute('aria-current');
			}
		}

		var currentStepElement = modal.querySelector('#wizard-step-' + stepNum);
		if (currentStepElement) {
			currentStepElement.style.display = 'block';
		}

		var currentIndicator = modal.querySelector('.wizard-step[data-step="' + stepNum + '"]');
		if (currentIndicator) {
			currentIndicator.classList.add('active');
			// Add aria-current="step" to active step indicator
			currentIndicator.setAttribute('aria-current', 'step');
		}

		for (var j = 1; j < stepNum; j++) {
			var indicator = modal.querySelector('.wizard-step[data-step="' + j + '"]');
			if (indicator) {
				indicator.classList.add('completed');
			}
		}

		var titleElement = modal.querySelector('.modal-title');
		if (titleElement) {
			var modeText = this.mode === 'edit' ? 'Edit' : 'Create';
			titleElement.textContent = modeText + ' ' + (this.config.title || 'Wizard') + ' - Step ' + stepNum + ' of ' + this.steps.length;
		}

		var prevBtn = modal.querySelector('#wizardPrevBtn');
		var nextBtn = modal.querySelector('#wizardNextBtn');
		var saveBtn = modal.querySelector('#wizardSaveBtn');

		if (prevBtn) prevBtn.style.display = stepNum > 1 ? 'inline-block' : 'none';
		if (nextBtn) nextBtn.style.display = stepNum < this.steps.length ? 'inline-block' : 'none';
		if (saveBtn) {
			saveBtn.style.display = stepNum === this.steps.length ? 'inline-block' : 'none';
			var saveText = saveBtn.querySelector('#wizardSaveText');
			if (saveText) {
				// Replace emoji with accessible icon
				saveText.innerHTML = '';
				saveText.appendChild(
					D.span().child(
						D.icon('fas fa-save me-1'),
						this.mode === 'edit' ? 'Update' : 'Create'
					).get()
				);
			}
		}

		this.currentStep = stepNum;

		// Announce step change to screen readers
		if (Funky.Announce) {
			var stepConfig = this.steps[stepNum - 1];
			var message = 'Step ' + stepNum + ' of ' + this.steps.length;
			if (stepConfig && stepConfig.title) {
				message += ': ' + stepConfig.title;
			}
			Funky.Announce.polite(message);
		}
	};

	/**
	 * Set loading state
	 */
	FunkyWizard.prototype._setLoadingState = function(loading) {
		var modal = document.getElementById(this.modalId);
		var D = Funky.Dom;
		var spinner = modal.querySelector('#wizardSaveSpinner');
		var saveBtn = modal.querySelector('#wizardSaveBtn');
		var saveText = modal.querySelector('#wizardSaveText');

		if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
		if (saveBtn) {
			saveBtn.disabled = loading;
			// Announce loading state to screen readers
			saveBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
		}
		if (saveText) {
			saveText.innerHTML = '';
			if (loading) {
				saveText.textContent = 'Saving...';
			} else {
				// Use accessible icon instead of emoji
				saveText.appendChild(
					D.span().child(
						D.icon('fas fa-save me-1'),
						this.mode === 'edit' ? 'Update' : 'Create'
					).get()
				);
			}
		}
	};

	/**
	 * Get current state
	 */
	FunkyWizard.prototype.getState = function() {
		return JSON.parse(JSON.stringify(this.state));
	};

	/**
	 * Destroy the wizard instance and clean up
	 * Bindable Interface
	 */
	FunkyWizard.prototype.destroy = function() {
		var self = this;

		// Destroy all editors
		Object.keys(this.editors).forEach(function(stepNum) {
			var editor = self.editors[stepNum];
			if (editor && editor.destroy) {
				editor.destroy();
			}
		});
		this.editors = {};

		// Dispose modal
		if (this.modal && this.modal.dispose) {
			this.modal.dispose();
		}
		this.modal = null;

		// Clear state
		this.state = {};
		this._fieldLinkState = {};

		// Unregister instance
		_instances.unregister(this.modalId);
	};

	/**
	 * Set wizard step data
	 * Bindable Interface
	 * @param {Object} data - Data object with stateKey properties to set
	 */
	FunkyWizard.prototype.setData = function(data) {
		var self = this;

		if (!data || typeof data !== 'object') {
			return;
		}

		// Merge data into state
		Object.keys(data).forEach(function(key) {
			self.state[key] = data[key];
		});

		// Update current step editor if it exists and has a stateKey
		var currentStepConfig = this.steps[this.currentStep - 1];
		var currentEditor = this.editors[this.currentStep];

		if (currentStepConfig && currentStepConfig.stateKey && data[currentStepConfig.stateKey] !== undefined) {
			// Both 'form' and legacy 'jsoneditor' types now use Funky.Form with setData()
			if ((currentStepConfig.type === 'form' || currentStepConfig.type === 'jsoneditor') && currentEditor && currentEditor.setData) {
				currentEditor.setData(data[currentStepConfig.stateKey]);
			} else if (currentStepConfig.type === 'ace' && currentEditor && currentEditor.setValue) {
				var value = data[currentStepConfig.stateKey];
				if (typeof value === 'object') {
					value = JSON.stringify(value, null, 2);
				}
				currentEditor.setValue(value, -1);
			}
		}
	};

	/**
	 * Get collected wizard data
	 * Bindable Interface
	 * @returns {Object} - All wizard step data
	 */
	FunkyWizard.prototype.getData = function() {
		// Save current step data first to ensure we have the latest
		this._saveCurrentStepData(true);
		return JSON.parse(JSON.stringify(this.state));
	};

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('Wizard');

	// Factory object
	var WizardFactory = {
		/**
		 * Initialize a wizard
		 * @param {Object} config - Wizard configuration
		 * @returns {FunkyWizard}
		 */
		init: function(config) {
			var instance = new FunkyWizard(config);
			if (instance.id) {
				_instances.register(instance.id, instance);
			}
			return instance;
		},

		/**
		 * @deprecated Use Wizard.init() instead
		 */
		create: function(config) {
			if (Funky.debug) {
				console.warn('[Funky.Wizard] create() is deprecated. Use init() instead.');
			}
			return WizardFactory.init(config);
		},

		/**
		 * Get wizard instance by modal ID
		 * @param {string} id - The modal ID
		 * @returns {FunkyWizard|null}
		 */
		getInstance: function(id) {
			return _instances.get(id);
		},

		/**
		 * Destroy wizard by ID
		 * @param {string} id - The modal ID
		 */
		destroy: function(id) {
			var instance = _instances.get(id);
			if (instance && instance.destroy) {
				instance.destroy();
			}
		},

		/**
		 * Destroy all wizard instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		/**
		 * Get all wizard instances
		 * @returns {Object}
		 */
		getAll: function() {
			return _instances.getAll();
		},

		constructor: FunkyWizard
	};

	// Register with Funky namespace
	Funky.register('Wizard', WizardFactory);

})(window);
