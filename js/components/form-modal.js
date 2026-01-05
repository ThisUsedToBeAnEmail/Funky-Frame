/**
 * Funky FormModal - Dynamic Create/Edit Form Modal
 *
 * Renders schema-driven forms using native Funky.Form in a modal.
 * Supports create and edit modes with API integration and cache support.
 *
 * Schemas can be provided directly or loaded from the OpenAPI spec via schemaPath.
 * Integrates with Funky.Cache for data fetching and invalidation.
 *
 * Usage with native schema:
 *   Funky.FormModal.init({
 *     modalId: 'clientModal',
 *     entity: 'client',
 *     entityLabel: 'Client',
 *     schema: {
 *       fields: {
 *         name: { type: 'text', label: 'Name', required: true }
 *       }
 *     },
 *     apiUrl: '/api/clients',
 *     onSave: function() { table.ajax.reload(); }
 *   });
 *
 * Usage with schemaPath (OpenAPI - auto-converted):
 *   Funky.FormModal.init({
 *     modalId: 'clientModal',
 *     entity: 'client',
 *     entityLabel: 'Client',
 *     schemaPath: 'CreateClient',  // Loaded from Funky.Schema
 *     apiUrl: '/api/clients',
 *     enhanceSchema: function(schema, data) {
 *       // Called before form creation - can be async (return Promise)
 *       return schema;
 *     },
 *     onChange: function(field, value, data) {
 *       // Called when any field changes
 *     },
 *     onSave: function() { table.ajax.reload(); }
 *   });
 *
 *   Funky.FormModal.create('clientModal');
 *   Funky.FormModal.edit('clientModal', 123);
 *
 * @version 1.0.2
 * @see Funky.Schema for schema management
 * @see Funky.Form for form rendering
 * @see Funky.Cache for data caching
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.FormModal] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('FormModal')) {
		return;
	}

	// Store modal configurations and editor instances
	var configs = {};
	var editors = {};
	var lastValues = {}; // Track last values for change detection

	/**
	 * Escape HTML to prevent XSS
	 */
	function escapeHtml(text) {
		if (text === null || text === undefined) return '';
		var div = document.createElement('div');
		div.textContent = String(text);
		return div.innerHTML;
	}

	/**
	 * Normalize date/datetime values in data to ISO 8601 format
	 * Handles cases where JSON Editor produces date-only strings but API expects date-time
	 * @param {Object} data - The form data object
	 * @param {Object} schema - The JSON schema
	 * @returns {Object} Data with normalized date fields
	 */
	function normalizeDateTimeFields(data, schema) {
		if (!data || !schema || !schema.properties) return data;
		
		var result = Object.assign({}, data);
		
		Object.keys(schema.properties).forEach(function(key) {
			var prop = schema.properties[key];
			var value = result[key];
			
			// Check if this is a date-time field
			if (prop.format === 'date-time') {
				// If null, undefined, or empty string - remove from payload
				// (APIs typically don't accept null for date-time fields)
				if (value === null || value === undefined || value === '') {
					delete result[key];
					console.log('[Funky.FormModal] Removed empty date-time field:', key);
					return;
				}
				
				// If already a valid ISO datetime with Z, keep as is
				if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
					return;
				}
				
				// If already a valid ISO datetime with timezone offset, keep as is
				if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?[+-]\d{2}:\d{2}$/.test(value)) {
					return;
				}
				
				// If value is a date-only string (YYYY-MM-DD), add time component
				if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
					result[key] = value + 'T00:00:00Z';
					console.log('[Funky.FormModal] Normalized date-only to datetime:', key, value, '->', result[key]);
					return;
				}
				
				// If value is datetime without seconds (YYYY-MM-DDTHH:MM), add seconds and Z
				if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
					result[key] = value + ':00Z';
					console.log('[Funky.FormModal] Normalized datetime (no seconds) to:', key, value, '->', result[key]);
					return;
				}
				
				// If value is datetime with seconds but no timezone (YYYY-MM-DDTHH:MM:SS), add Z
				if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
					result[key] = value + 'Z';
					console.log('[Funky.FormModal] Normalized datetime (no TZ) to:', key, value, '->', result[key]);
					return;
				}
				
				// If value is a Date object, convert to ISO string
				if (value instanceof Date) {
					result[key] = value.toISOString();
					console.log('[Funky.FormModal] Converted Date object to ISO:', key, '->', result[key]);
					return;
				}
				
				// Try to parse as date and convert
				try {
					var parsed = new Date(value);
					if (!isNaN(parsed.getTime())) {
						result[key] = parsed.toISOString();
						console.log('[Funky.FormModal] Parsed and converted to ISO:', key, value, '->', result[key]);
					} else {
						console.warn('[Funky.FormModal] Could not parse date-time value:', key, value);
					}
				} catch (e) {
					console.warn('[Funky.FormModal] Error parsing date-time:', key, value, e);
				}
			}
		});
		
		return result;
	}

	/**
	 * Create modal HTML if it doesn't exist
	 */
	function ensureModalExists(modalId, config) {
		if (document.getElementById(modalId)) return;

		var title = config.entityLabel || 'Form';
		var size = config.modalSize || 'modal-slide-panel-lg';
		var titleId = modalId + '-title';

		var html = '<div class="modal fade modal-slide-panel ' + size + '" id="' + modalId + '" tabindex="-1" data-backdrop="static" role="dialog" aria-labelledby="' + titleId + '" aria-modal="true">' +
			'<div class="modal-dialog">' +
			'<div class="modal-content">' +
			'<div class="modal-header">' +
			'<h5 class="modal-title" id="' + titleId + '"><i class="fas fa-edit me-2" aria-hidden="true"></i><span class="title-text"></span></h5>' +
			'<button type="button" class="btn-close" data-funky-modal-close aria-label="Close"></button>' +
			'</div>' +
			'<div class="modal-body">' +
			'<div class="form-modal-loading text-center py-4" style="display: none;" role="status" aria-live="polite">' +
			'<div class="spinner-border text-primary" aria-hidden="true"></div>' +
			'<div class="mt-2 text-muted">Loading...</div>' +
			'</div>' +
			'<div class="form-modal-editor"></div>' +
			'<div class="form-modal-error alert alert-danger" style="display: none;" role="alert"></div>' +
			'</div>' +
			'<div class="modal-footer">' +
			'<button type="button" class="btn-funky btn-funky-secondary" data-funky-modal-close><i class="fas fa-times me-1" aria-hidden="true"></i>Cancel</button>' +
			'<button type="button" class="btn-funky btn-funky-primary form-modal-save">' +
			'<span class="save-text"><i class="fas fa-save me-1" aria-hidden="true"></i>Save</span>' +
			'<span class="save-loading" style="display: none;" role="status">' +
			'<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Saving...' +
			'</span>' +
			'</button>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';

		document.body.insertAdjacentHTML('beforeend', html);

		// Bind save button
		var modal = document.getElementById(modalId);
		var saveBtn = modal.querySelector('.form-modal-save');
		saveBtn.addEventListener('click', function() {
			FormModal.save(modalId);
		});

		// Clean up editor on modal close
		modal.addEventListener('funky.modal.hidden', function() {
			cleanupEditor(modalId);
		});

		// Bind close buttons
		modal.querySelectorAll('[data-funky-modal-close]').forEach(function(btn) {
			btn.addEventListener('click', function() {
				Funky.Modal.hide('#' + modalId);
			});
		});
	}

	/**
	 * Initialize Funky.Form editor
	 */
	function initEditor(modalId, schema, data) {
		var config = configs[modalId];
		var modal = document.getElementById(modalId);
		var editorContainer = modal.querySelector('.form-modal-editor');

		// Check Funky.Form availability
		if (!Funky.Form) {
			console.error('[Funky.FormModal] Funky.Form not available. Load form.js first.');
			showError(modalId, 'Form component not available');
			return;
		}

		// Destroy existing editor
		cleanupEditor(modalId);

		// Apply schema enhancements if provided
		var schemaPromise = Promise.resolve(schema);
		if (typeof config.enhanceSchema === 'function') {
			var result = config.enhanceSchema(JSON.parse(JSON.stringify(schema)), data);
			// Handle both sync and async enhanceSchema
			schemaPromise = Promise.resolve(result);
		}

		schemaPromise.then(function(enhancedSchema) {
			// Convert JSONSchema/OpenAPI to native Funky.Form format if needed
			if (enhancedSchema && enhancedSchema.type === 'object' && enhancedSchema.properties && !enhancedSchema.fields) {
				if (Funky.SchemaAdapter) {
					enhancedSchema = Funky.SchemaAdapter.convert(enhancedSchema);
				} else {
					console.warn('[Funky.FormModal] SchemaAdapter not available for schema conversion');
				}
			}

			var startVal = data || {};

			// Create form instance
			var form = Funky.Form.create(editorContainer, {
				schema: enhancedSchema,
				data: startVal,
				mode: modal.dataset.mode === 'edit' ? 'edit' : 'create',
				validateOnChange: config.validateOnChange !== false,
				validateOnBlur: config.validateOnBlur !== false,
				disabled: config.disabled || false
			});

			editors[modalId] = form;

			// Store initial values for change detection
			lastValues[modalId] = JSON.parse(JSON.stringify(startVal));

			// Setup change listener for legacy onFormChange callback
			if (typeof config.onFormChange === 'function' || typeof config.onChange === 'function') {
				editorContainer.addEventListener('funky.form.change', function(e) {
					var currentValues = form.getData();
					var field = e.detail && e.detail.field;
					var newVal = e.detail && e.detail.value;
					var oldVal = lastValues[modalId] && lastValues[modalId][field];

					// Call onChange if provided (new API)
					if (typeof config.onChange === 'function') {
						config.onChange(field, newVal, currentValues);
					}

					// Call legacy onFormChange if provided
					if (typeof config.onFormChange === 'function') {
						config.onFormChange(form, 'root.' + field, newVal, oldVal);
					}

					lastValues[modalId] = JSON.parse(JSON.stringify(currentValues));
				});
			}

			// Setup validation listener for legacy onValidate callback
			if (typeof config.onValidate === 'function') {
				editorContainer.addEventListener('funky.form.validate', function(e) {
					var result = e.detail;
					// Convert to legacy format: [{path, message}]
					var errors = [];
					if (result && result.errors) {
						Object.keys(result.errors).forEach(function(field) {
							result.errors[field].forEach(function(msg) {
								errors.push({ path: 'root.' + field, message: msg });
							});
						});
					}
					config.onValidate(errors, form.getData());
				});
			}
		}).catch(function(err) {
			console.error('[Funky.FormModal] Error enhancing schema:', err);
			showError(modalId, 'Failed to load form: ' + (err.message || err));
		});
	}

	/**
	 * Cleanup editor instance
	 */
	function cleanupEditor(modalId) {
		if (editors[modalId]) {
			if (editors[modalId].destroy) {
				editors[modalId].destroy();
			}
			delete editors[modalId];
		}
		delete lastValues[modalId];
	}

	/**
	 * Destroy a form modal instance completely
	 */
	function destroyInstance(modalId) {
		cleanupEditor(modalId);
		delete configs[modalId];
		// Remove from _instances registry
		if (FormModal._instances[modalId]) {
			delete FormModal._instances[modalId];
		}
	}

	/**
	 * Set loading state
	 */
	function setLoading(modalId, loading) {
		var modal = document.getElementById(modalId);
		var loadingEl = modal.querySelector('.form-modal-loading');
		var editorEl = modal.querySelector('.form-modal-editor');
		var saveBtn = modal.querySelector('.form-modal-save');
		var saveText = saveBtn.querySelector('.save-text');
		var saveLoading = saveBtn.querySelector('.save-loading');

		if (loading) {
			loadingEl.style.display = 'block';
			editorEl.style.display = 'none';
			saveBtn.disabled = true;
		} else {
			loadingEl.style.display = 'none';
			editorEl.style.display = 'block';
			saveBtn.disabled = false;
		}
	}

	/**
	 * Set saving state
	 */
	function setSaving(modalId, saving) {
		var modal = document.getElementById(modalId);
		var saveBtn = modal.querySelector('.form-modal-save');
		var saveText = saveBtn.querySelector('.save-text');
		var saveLoading = saveBtn.querySelector('.save-loading');
		var cancelBtn = modal.querySelector('[data-funky-modal-close]');

		if (saving) {
			saveText.style.display = 'none';
			saveLoading.style.display = 'inline';
			saveBtn.disabled = true;
			cancelBtn.disabled = true;
		} else {
			saveText.style.display = 'inline';
			saveLoading.style.display = 'none';
			saveBtn.disabled = false;
			cancelBtn.disabled = false;
		}
	}

	/**
	 * Show error message
	 */
	function showError(modalId, message) {
		var modal = document.getElementById(modalId);
		var errorEl = modal.querySelector('.form-modal-error');
		errorEl.textContent = message;
		errorEl.style.display = 'block';
	}

	/**
	 * Hide error message
	 */
	function hideError(modalId) {
		var modal = document.getElementById(modalId);
		var errorEl = modal.querySelector('.form-modal-error');
		errorEl.style.display = 'none';
	}

	var FormModal = {
		/**
		 * Instance registry by modal ID for LiveBinding
		 */
		_instances: {},

		/**
		 * Native form instances registry
		 */
		_nativeFormInstances: {},

		/**
		 * Check if native Funky.Form should be used
		 * @private
		 * @deprecated Always returns true - JSONEditor has been removed
		 */
		_shouldUseNativeForm: function(config) {
			// Always use native Funky.Form - JSONEditor has been removed
			return true;
		},

		/**
		 * Initialize native Funky.Form in modal
		 * @private
		 */
		_initNativeForm: function(config) {
			var self = this;
			var NativeForm = window.Funky && window.Funky.Form;
			var Modal = window.Funky && window.Funky.Modal;

			if (!NativeForm) {
				console.error('[Funky.FormModal] Funky.Form not available');
				return Promise.reject(new Error('Funky.Form not available'));
			}

			var modalId = config.modalId || 'funky-form-modal-' + Date.now();
			config.modalId = modalId;

			// Destroy existing form instance if present (critical for re-opening)
			if (this._nativeFormInstances[modalId]) {
				var existingInstance = this._nativeFormInstances[modalId];
				if (existingInstance.form && existingInstance.form.destroy) {
					existingInstance.form.destroy();
				}
				delete this._nativeFormInstances[modalId];
			}

			// Create modal container (hidden initially)
			var modal = this._createNativeModalContainer(modalId, config);
			var formContainer = modal.querySelector('.form-modal-editor');

			// Build form options
			var formOptions = {
				schema: config.schema,
				fields: config.fields,
				data: config.data || {},
				mode: config.mode || 'create',

				onChange: function(detail) {
					if (typeof config.onChange === 'function') {
						config.onChange(detail.field, detail.value, detail.data);
					}
					// Also support legacy onFormChange
					if (typeof config.onFormChange === 'function') {
						config.onFormChange(null, 'root.' + detail.field, detail.value, detail.oldValue);
					}
				},

				onSubmit: function(data) {
					self._handleNativeSubmit(data, config, modalId);
				}
			};

			// Handle schema loading if schemaPath provided
			var schemaPromise = Promise.resolve(config.schema);
			var needsAsyncLoad = false;

			if (config.schemaPath && !config.schema) {
				needsAsyncLoad = true;
				// Load schema via Funky.Schema and convert using SchemaAdapter
				var Schema = window.Funky && window.Funky.Schema;
				var SchemaAdapter = window.Funky && window.Funky.SchemaAdapter;

				if (Schema && SchemaAdapter) {
					schemaPromise = Schema.ready().then(function() {
						var openApiSchema = Schema.getResolved(config.schemaPath);
						if (!openApiSchema) {
							throw new Error('Schema not found: ' + config.schemaPath);
						}
						// Convert OpenAPI schema to native format
						return SchemaAdapter.convert(openApiSchema, 'openapi');
					});
				} else {
					return Promise.reject(new Error('Funky.Schema or Funky.SchemaAdapter not available'));
				}
			}

			// If async loading needed, show modal with loading state first
			if (needsAsyncLoad) {
				Modal.show('#' + modalId);
				setLoading(modalId, true);
			}

			return schemaPromise.then(function(schema) {
				formOptions.schema = schema;

				// Apply schema enhancements if provided
				if (typeof config.enhanceSchema === 'function') {
					var enhanced = config.enhanceSchema(JSON.parse(JSON.stringify(schema)), config.data);
					if (enhanced && typeof enhanced.then === 'function') {
						return enhanced.then(function(s) {
							formOptions.schema = s;
							return formOptions;
						});
					}
					formOptions.schema = enhanced;
				}
				return formOptions;
			}).then(function(opts) {
				// Create native form BEFORE showing modal (prevents layout jolt)
				var form = NativeForm.create(formContainer, opts);

				if (!form) {
					throw new Error('Failed to create form');
				}

				// Store instance
				self._nativeFormInstances[modalId] = {
					form: form,
					modal: modal,
					config: config
				};

				// Setup buttons
				self._setupNativeFormButtons(modalId);

				// Register for LiveBinding
				self._instances[modalId] = {
					modalId: modalId,
					setData: function(data) { return form.setData(data); },
					getData: function() { return form.getData(); }
				};

				// Store config
				configs[modalId] = config;

				// Now show the modal with form already rendered
				if (!needsAsyncLoad) {
					Modal.show('#' + modalId);
				} else {
					// Form is ready, hide loading
					setLoading(modalId, false);
				}

				// Return instance interface
				return {
					form: form,
					modal: modal,
					modalId: modalId,
					show: function() { Modal.show('#' + modalId); },
					hide: function() { Modal.hide('#' + modalId); },
					getData: function() { return form.getData(); },
					setData: function(data) { form.setData(data); },
					validate: function() { return form.validate(); },
					destroy: function() {
						form.destroy();
						delete self._nativeFormInstances[modalId];
						delete self._instances[modalId];
						delete configs[modalId];
					}
				};
			}).catch(function(err) {
				console.error('[Funky.FormModal] Native form init error:', err);
				setLoading(modalId, false);
				showError(modalId, 'Failed to create form: ' + (err.message || err));
				return Promise.reject(err);
			});
		},

		/**
		 * Create modal container for native form
		 * @private
		 */
		_createNativeModalContainer: function(modalId, config) {
			var D = window.Funky && window.Funky.Dom;
			var existing = document.getElementById(modalId);

			if (existing) {
				// Clear existing form content
				var body = existing.querySelector('.form-modal-editor');
				if (body) body.innerHTML = '';
				return existing;
			}

			var title = config.title || config.entityLabel || 'Form';
			var size = config.size || config.modalSize || 'modal-slide-panel-lg';
			var titleId = modalId + '-title';

			var html = '<div class="modal fade modal-slide-panel ' + escapeHtml(size) + '" id="' + escapeHtml(modalId) + '" tabindex="-1" data-backdrop="static" role="dialog" aria-labelledby="' + titleId + '" aria-modal="true">' +
				'<div class="modal-dialog">' +
				'<div class="modal-content">' +
				'<div class="modal-header">' +
				'<h5 class="modal-title" id="' + titleId + '"><i class="fas fa-edit me-2" aria-hidden="true"></i><span class="title-text">' + escapeHtml(title) + '</span></h5>' +
				'<button type="button" class="btn-close" data-funky-modal-close aria-label="Close"></button>' +
				'</div>' +
				'<div class="modal-body">' +
				'<div class="form-modal-loading text-center py-4" style="display: none;" role="status" aria-live="polite">' +
				'<div class="spinner-border text-primary" aria-hidden="true"></div>' +
				'<div class="mt-2 text-muted">Loading...</div>' +
				'</div>' +
				'<div class="form-modal-editor"></div>' +
				'<div class="form-modal-error alert alert-danger" style="display: none;" role="alert"></div>' +
				'</div>' +
				'<div class="modal-footer">' +
				'<button type="button" class="btn-funky btn-funky-secondary" data-funky-modal-close><i class="fas fa-times me-1" aria-hidden="true"></i>' + escapeHtml(config.cancelText || 'Cancel') + '</button>' +
				'<button type="button" class="btn-funky btn-funky-primary form-modal-save" data-funky-form-submit>' +
				'<span class="save-text"><i class="fas fa-save me-1" aria-hidden="true"></i>' + escapeHtml(config.submitText || 'Save') + '</span>' +
				'<span class="save-loading" style="display: none;" role="status">' +
				'<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Saving...' +
				'</span>' +
				'</button>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'</div>';

			document.body.insertAdjacentHTML('beforeend', html);

			var modal = document.getElementById(modalId);

			// Bind close buttons
			modal.querySelectorAll('[data-funky-modal-close]').forEach(function(btn) {
				btn.addEventListener('click', function() {
					Funky.Modal.hide('#' + modalId);
				});
			});

			// Clean up on modal close
			modal.addEventListener('funky.modal.hidden', function() {
				var instance = FormModal._nativeFormInstances[modalId];
				if (instance && instance.form) {
					// Reset form state but don't destroy
					instance.form.reset();
				}
			});

			return modal;
		},

		/**
		 * Setup native form submit/cancel buttons
		 * @private
		 */
		_setupNativeFormButtons: function(modalId) {
			var self = this;
			var instance = this._nativeFormInstances[modalId];
			if (!instance) return;

			var modal = instance.modal;
			var form = instance.form;

			// Submit button
			var submitBtn = modal.querySelector('[data-funky-form-submit]');
			if (submitBtn && !submitBtn._nativeFormBound) {
				submitBtn._nativeFormBound = true;
				submitBtn.addEventListener('click', function() {
					form.submit();
				});
			}
		},

		/**
		 * Handle native form submission
		 * @private
		 */
		_handleNativeSubmit: function(data, config, modalId) {
			var self = this;
			var instance = this._nativeFormInstances[modalId];
			if (!instance) return;

			var form = instance.form;
			var modal = instance.modal;
			var Modal = window.Funky && window.Funky.Modal;

			// Validate first
			var validation = form.validate();
			if (!validation.valid) {
				// Errors already shown by form
				return;
			}

			// Show loading state
			setSaving(modalId, true);
			hideError(modalId);

			// Call user's onSubmit handler
			var result;
			if (typeof config.onSubmit === 'function') {
				result = config.onSubmit(data);
			} else if (config.apiUrl) {
				// Default API call behavior
				var mode = config.mode || modal.dataset.mode || 'create';
				var entityId = modal.dataset.entityId;
				var url = config.apiUrl;
				var method = 'POST';

				if (mode === 'edit' && entityId) {
					url = config.apiUrl + '/' + entityId;
					method = 'PUT';
				}

				if (Funky.Api) {
					result = method === 'POST' ?
						Funky.Api.post(url, data) :
						Funky.Api.put(url, data);
				} else {
					result = fetch(url, {
						method: method,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(data)
					}).then(function(r) {
						if (!r.ok) {
							return r.json().then(function(err) {
								throw { errors: err.errors || { _form: [err.message || 'Request failed'] } };
							});
						}
						return r.json();
					});
				}
			}

			// Handle result
			var handleResult = function(success, errors) {
				setSaving(modalId, false);

				if (success) {
					// Close modal
					Modal.hide('#' + modalId);

					// Invalidate cache
					if (Funky.Cache && config.entity) {
						var entityId = modal.dataset.entityId;
						if (entityId) {
							Funky.Cache.invalidate(config.entity, entityId);
						}
						Funky.Cache.clear(config.entity);
					}

					// Show success toast
					var action = (config.mode || modal.dataset.mode) === 'create' ? 'created' : 'updated';
					if (Funky.Toast) {
						Funky.Toast.success((config.entityLabel || 'Item') + ' ' + action + ' successfully');
					}

					// Call success callbacks
					if (typeof config.onSuccess === 'function') {
						config.onSuccess(data);
					}
					// Support legacy onSave callback
					if (typeof config.onSave === 'function') {
						config.onSave(data, config.mode || modal.dataset.mode);
					}
				} else if (errors) {
					form.setErrors(errors);
					showError(modalId, 'Please fix the errors and try again.');

					if (typeof config.onError === 'function') {
						config.onError(errors);
					}
				}
			};

			// Handle Promise or immediate result
			if (result && typeof result.then === 'function') {
				result
					.then(function(response) {
						handleResult(true);
					})
					.catch(function(error) {
						var errors = error.errors || { _form: [error.message || 'An error occurred'] };
						handleResult(false, errors);
					});
			} else if (result === false) {
				// Immediate failure (returned false)
				handleResult(false, { _form: ['Submission cancelled'] });
			} else {
				// Immediate success (returned anything else or undefined)
				handleResult(true);
			}
		},

		/**
		 * Initialize a form modal
		 * @param {object} config - Configuration
		 * @param {string} config.modalId - Modal element ID
		 * @param {string} config.entity - Entity type (for caching)
		 * @param {string} config.entityLabel - Display label
		 * @param {object} [config.schema] - Form schema (native format or OpenAPI)
		 * @param {string} [config.schemaPath] - Schema path in OpenAPI spec (e.g., 'CreateClient')
		 * @param {string} config.apiUrl - API endpoint base URL
		 * @param {function} [config.onSave] - Callback after successful save
		 * @param {function} [config.onSubmit] - Submit handler (return Promise)
		 * @param {function} [config.onSuccess] - Success callback
		 * @param {function} [config.onError] - Error callback
		 * @param {function} [config.onChange] - Field change handler
		 * @param {function} [config.enhanceSchema] - Function to enhance schema before form creation
		 *                                           Signature: enhanceSchema(schema, data) => schema
		 * @param {function} [config.onFormChange] - Legacy callback when any form field changes
		 *                                           Signature: onFormChange(form, fieldPath, newValue, oldValue)
		 */
		init: function(config) {
			if (!config || !config.modalId) {
				console.error('[Funky.FormModal] modalId is required');
				return;
			}

			// Always use native Funky.Form
			return this._initNativeForm(config);
		},

		/**
		 * Open modal in create mode
		 * @param {string} modalId - Modal ID
		 * @param {object} [defaultData] - Default values for new entity
		 */
		create: function(modalId, defaultData) {
			var config = configs[modalId];
			if (!config) {
				console.error('[Funky.FormModal] Config not found for:', modalId);
				return;
			}

			var modal = document.getElementById(modalId);
var titleEl = modal.querySelector('.modal-title .title-text');
		if (!titleEl) titleEl = modal.querySelector('.modal-title');
			titleEl.textContent = 'Create ' + (config.entityLabel || 'Item');

			// Store mode
			modal.dataset.mode = 'create';
			modal.dataset.entityId = '';

			hideError(modalId);

			// Resolve schema if using schemaPath and not yet loaded
			var schemaPromise = Promise.resolve(config.schema);
			if (config.schemaPath && !config.schema && Funky.Schema) {
				setLoading(modalId, true);
				Funky.Modal.show('#' + modalId);
				
				schemaPromise = Funky.Schema.ready().then(function() {
					config.schema = Funky.Schema.getResolved(config.schemaPath);
					return config.schema;
				});
			}

			schemaPromise.then(function(schema) {
				if (!schema) {
					showError(modalId, 'Failed to load form schema');
					setLoading(modalId, false);
					return;
				}
				initEditor(modalId, schema, defaultData || {});
				setLoading(modalId, false);
				
				// Show modal if not already shown
				Funky.Modal.show('#' + modalId);
			}).catch(function(err) {
				console.error('[Funky.FormModal] Schema load error:', err);
				showError(modalId, 'Failed to load form schema');
				setLoading(modalId, false);
			});
		},

		/**
		 * Open modal in edit mode
		 * @param {string} modalId - Modal ID
		 * @param {number|string} id - Entity ID to edit
		 */
		edit: function(modalId, id) {
			var config = configs[modalId];
			if (!config) {
				console.error('[Funky.FormModal] Config not found for:', modalId);
				return;
			}

			var modal = document.getElementById(modalId);
var titleEl = modal.querySelector('.modal-title .title-text');
		if (!titleEl) titleEl = modal.querySelector('.modal-title');
			titleEl.textContent = 'Edit ' + (config.entityLabel || 'Item');

			// Store mode
			modal.dataset.mode = 'edit';
			modal.dataset.entityId = id;

			hideError(modalId);
			setLoading(modalId, true);

			Funky.Modal.show('#' + modalId);

			// Resolve schema if using schemaPath and not yet loaded
			var schemaPromise = Promise.resolve(config.schema);
			if (config.schemaPath && !config.schema && Funky.Schema) {
				schemaPromise = Funky.Schema.ready().then(function() {
					config.schema = Funky.Schema.getResolved(config.schemaPath);
					return config.schema;
				});
			}

			schemaPromise.then(function(schema) {
				if (!schema) {
					showError(modalId, 'Failed to load form schema');
					setLoading(modalId, false);
					return;
				}

				// Check cache first
				if (Funky.Cache) {
					var cached = Funky.Cache.get(config.entity, id);
					if (cached) {
						console.log('[Funky.FormModal] Using cached data for', config.entity, id);
						initEditor(modalId, schema, cached);
						setLoading(modalId, false);
						return;
					}
				}

				// Fetch from API
				var url = config.apiUrl + '/' + id;
				
				var fetchFn = Funky.Api && Funky.Api.get ? 
					Funky.Api.get(url) : 
					fetch(url).then(function(r) { return r.json(); });

				fetchFn
					.then(function(data) {
						// Cache the data
						if (Funky.Cache) {
							Funky.Cache.set(config.entity, id, data);
						}
						initEditor(modalId, schema, data);
						setLoading(modalId, false);
					})
					.catch(function(error) {
						console.error('[Funky.FormModal] Fetch error:', error);
						setLoading(modalId, false);
						showError(modalId, 'Failed to load data: ' + (error.message || error));
					});
			}).catch(function(err) {
				console.error('[Funky.FormModal] Schema load error:', err);
				showError(modalId, 'Failed to load form schema');
				setLoading(modalId, false);
			});
		},

		/**
		 * Save the form
		 * @param {string} modalId - Modal ID
		 */
		save: function(modalId) {
			var config = configs[modalId];
			var editor = editors[modalId];
			var modal = document.getElementById(modalId);

			if (!config || !editor) {
				console.error('[Funky.FormModal] Editor not found for:', modalId);
				return;
			}

			// Validate using Funky.Form API
			var validation = editor.validate();
			if (!validation.valid) {
				showError(modalId, 'Please fix validation errors before saving.');
				return;
			}

			hideError(modalId);
			setSaving(modalId, true);

			var data = editor.getData();
			var mode = modal.dataset.mode;
			var entityId = modal.dataset.entityId;

			// Normalize date-time fields to ISO 8601 format
			var schema = editor.schema || config.schema;
			console.log('[Funky.FormModal] Pre-normalization data:', JSON.stringify(data));
			console.log('[Funky.FormModal] Schema available:', !!schema, schema ? Object.keys(schema.properties || {}) : 'no properties');
			if (schema) {
				data = normalizeDateTimeFields(data, schema);
			}
			console.log('[Funky.FormModal] Post-normalization data:', JSON.stringify(data));

			// Transform data if callback provided
			if (typeof config.transformData === 'function') {
				data = config.transformData(data, mode);
			}

			var url = config.apiUrl;
			var method = 'POST';

			if (mode === 'edit' && entityId) {
				url = config.apiUrl + '/' + entityId;
				method = 'PUT';
			}

			// Make API call
			var saveFn;
			if (Funky.Api) {
				saveFn = method === 'POST' ? 
					Funky.Api.post(url, data) : 
					Funky.Api.put(url, data);
			} else {
				saveFn = fetch(url, {
					method: method,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				}).then(function(r) { return r.json(); });
			}

			saveFn
				.then(function(result) {
					setSaving(modalId, false);

					// Invalidate cache
					if (Funky.Cache) {
						if (mode === 'edit' && entityId) {
							Funky.Cache.invalidate(config.entity, entityId);
						}
						Funky.Cache.clear(config.entity);
					}

					// Show success toast and announce
					var action = mode === 'create' ? 'created' : 'updated';
					if (Funky.Toast) {
						Funky.Toast.success((config.entityLabel || 'Item') + ' ' + action + ' successfully');
					}
					if (Funky.Announce) {
						Funky.Announce.polite((config.entityLabel || 'Item') + ' ' + action + ' successfully');
					}

					// Close modal
					Funky.Modal.hide('#' + modalId);

					// Call onSave callback
					if (typeof config.onSave === 'function') {
						config.onSave(result, mode);
					}
				})
				.catch(function(error) {
					console.error('[Funky.FormModal] Save error:', error);
					setSaving(modalId, false);

					var message = 'Failed to save';
					if (error.response && error.response.data && error.response.data.error) {
						message = error.response.data.error;
					} else if (error.message) {
						message = error.message;
					}
					showError(modalId, message);
					if (Funky.Announce) {
						Funky.Announce.assertive('Error: ' + message);
					}
				});
		},

		/**
		 * Hide modal
		 * @param {string} modalId - Modal ID
		 */
		hide: function(modalId) {
			Funky.Modal.hide('#' + modalId);
		},

		/**
		 * Get form instance
		 * @param {string} modalId - Modal ID
		 * @returns {Object|null} Funky.Form instance
		 */
		getEditor: function(modalId) {
			return editors[modalId] || null;
		},

		/**
		 * Get current form data (Bindable Interface)
		 * @param {string} modalId - Modal ID
		 * @returns {object|null} Form field values as object
		 */
		getData: function(modalId) {
			var editor = editors[modalId];
			return editor ? editor.getData() : null;
		},

		/**
		 * Set form data (Bindable Interface)
		 * Populates form fields with data object
		 * @param {string} modalId - Modal ID
		 * @param {object} data - Data object with field values
		 * @returns {boolean} True if data was set successfully
		 */
		setData: function(modalId, data) {
			var editor = editors[modalId];
			if (!editor) {
				console.warn('[Funky.FormModal] No editor found for:', modalId);
				return false;
			}
			if (!data || typeof data !== 'object') {
				console.warn('[Funky.FormModal] Invalid data provided to setData');
				return false;
			}
			try {
				editor.setData(data);
				// Update lastValues for change detection
				lastValues[modalId] = JSON.parse(JSON.stringify(data));
				return true;
			} catch (e) {
				console.error('[Funky.FormModal] Error setting data:', e);
				return false;
			}
		},

		/**
		 * Get config for a modal
		 * @param {string} modalId - Modal ID
		 * @returns {object|null}
		 */
		getConfig: function(modalId) {
			return configs[modalId] || null;
		},

		/**
		 * Rebuild editor with a new/modified schema while preserving current values
		 * Useful for dynamically updating dropdown options based on field changes
		 * @param {string} modalId - Modal ID
		 * @param {object} schema - New schema to use
		 * @param {object} [overrideValues] - Optional values to override current values
		 */
		rebuildEditor: function(modalId, schema, overrideValues) {
			var editor = editors[modalId];
			if (!editor) {
				console.warn('[Funky.FormModal] No editor to rebuild for:', modalId);
				return;
			}

			// Get current values before destroying
			var currentValues = editor.getData();

			// Merge with override values if provided
			if (overrideValues) {
				Object.assign(currentValues, overrideValues);
			}

			// Reinitialize with new schema
			initEditor(modalId, schema, currentValues);
		},

		/**
		 * Destroy a form modal instance
		 * Cleans up editor, config, and removes from instance registry
		 * @param {string} modalId - Modal ID
		 */
		destroy: function(modalId) {
			destroyInstance(modalId);
		},

		/**
		 * Update a specific field's editor options (for Select2/enum fields)
		 * @param {string} modalId - Modal ID
		 * @param {string} fieldPath - Path to field (e.g., 'root.client_id')
		 * @param {object} options - New options { enum: [...], enum_titles: [...] }
		 */
		updateFieldOptions: function(modalId, fieldPath, options) {
			var editor = editors[modalId];
			if (!editor) return;

			var fieldEditor = editor.getEditor(fieldPath);
			if (!fieldEditor) {
				console.warn('[Funky.FormModal] Field not found:', fieldPath);
				return;
			}

			// For select fields, update enum options
			if (options.enum) {
				var currentValue = fieldEditor.getValue();
				
				// Clear and rebuild options
				var select = fieldEditor.input || fieldEditor.control;
				if (select && select.tagName === 'SELECT') {
					// Store current value
					var wasValue = select.value;
					
					// Clear options
					select.replaceChildren();
					
					// Add new options
					options.enum.forEach(function(val, idx) {
						var opt = document.createElement('option');
						opt.value = val;
						opt.textContent = options.enum_titles ? options.enum_titles[idx] : val;
						select.appendChild(opt);
					});
					
					// Restore value if still valid
					if (options.enum.indexOf(currentValue) !== -1) {
						select.value = currentValue;
						fieldEditor.setValue(currentValue);
					} else if (options.enum.length > 0) {
						// Select first option if previous value is no longer valid
						select.value = options.enum[0];
						fieldEditor.setValue(options.enum[0]);
					}
					
					// Trigger Select2 refresh if present
					if (jQuery && jQuery(select).data('select2')) {
						jQuery(select).trigger('change.select2');
					}
				}
			}
		},

		/**
		 * Static method to show a form modal
		 * Creates and shows the modal in one call
		 * @param {object} config - Configuration (see init for options)
		 * @returns {Promise} Resolves with modal instance
		 */
		show: function(config) {
			var self = this;

			// Use native form if appropriate
			if (this._shouldUseNativeForm(config)) {
				return this._initNativeForm(config);
			}

			// For JSONEditor forms, init then show
			return new Promise(function(resolve, reject) {
				try {
					self.init(config);

					var modalId = config.modalId;
					var mode = config.mode || 'create';

					if (mode === 'edit' && config.entityId) {
						self.edit(modalId, config.entityId);
					} else {
						self.create(modalId, config.data);
					}

					// Return instance-like object
					resolve({
						modalId: modalId,
						show: function() { Funky.Modal.show('#' + modalId); },
						hide: function() { Funky.Modal.hide('#' + modalId); },
						getData: function() { return self.getData(modalId); },
						setData: function(data) { return self.setData(modalId, data); },
						getEditor: function() { return self.getEditor(modalId); },
						destroy: function() { self.destroy(modalId); }
					});
				} catch (err) {
					reject(err);
				}
			});
		},

		/**
		 * Get native form instance by modal ID
		 * @param {string} modalId - Modal ID
		 * @returns {object|null} Native Funky.Form instance or null
		 */
		getNativeForm: function(modalId) {
			if (this._nativeFormInstances && this._nativeFormInstances[modalId]) {
				return this._nativeFormInstances[modalId].form;
			}
			return null;
		},

		/**
		 * Check if a modal is using native form
		 * @param {string} modalId - Modal ID
		 * @returns {boolean}
		 */
		isNativeForm: function(modalId) {
			return !!(this._nativeFormInstances && this._nativeFormInstances[modalId]);
		},

		/**
		 * Get form modal instance by ID
		 * @param {string} modalId - Modal ID
		 * @returns {Object|null}
		 */
		getInstance: function(modalId) {
			return this._instances[modalId] || null;
		},

		/**
		 * Destroy all form modal instances
		 */
		destroyAll: function() {
			var self = this;
			Object.keys(this._instances).forEach(function(modalId) {
				self.destroy(modalId);
			});
		}
	};

	// Register with Funky namespace
	Funky.register('FormModal', FormModal);

	console.log('[Funky.FormModal] Initialized');

})(window);
