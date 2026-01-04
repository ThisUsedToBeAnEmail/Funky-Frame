/**
 * Trade Creation Wizard
 * Multi-step wizard for creating new trades using FunkyWizard
 * @module Funky.TradeWizard
 */
(function(window) {
	'use strict';

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('TradeWizard')) {
		return;
	}

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('TradeWizard');

	// DOM helper reference
	var D = Funky.Dom;

	/**
	 * TradeWizard Constructor
	 * @param {string} [modalId] - Optional modal ID for instance registration (defaults to 'tradeWizardModal')
	 */
	function TradeWizard(modalId) {
		this.modalId = modalId || 'tradeWizardModal';
		this.wizard = null;
		this.clients = [];
		this.templates = [];
		this.relationships = [];
		this.counterpartyRelationships = [];
		this.securities = [];
		this.selectedTemplate = null;
		this.selectedRelatedTemplate = null;
		this.templateFields = [];
		this.relatedTemplateFields = [];

		// Register instance in registry
		_instances.register(this.modalId, this);

		this._init();
	}

	/**
	 * Initialize the wizard
	 */
	TradeWizard.prototype._init = function() {
		// Wizard will be set up when opened
		this.currentStep = 1;
		this.state = {};

		// Bind event listeners to wizard buttons
		this._setupWizardButtons();
	};

	/**
	 * Setup wizard button event listeners
	 */
	TradeWizard.prototype._setupWizardButtons = function() {
		var self = this;
		var modal = document.getElementById('tradeWizardModal');

		if (!modal) return;

		// Next button
		var nextBtn = modal.querySelector('.wizard-btn-next');
		if (nextBtn) {
			nextBtn.addEventListener('click', function() {
				self._handleNext();
			});
		}

		// Previous button
		var prevBtn = modal.querySelector('.wizard-btn-prev');
		if (prevBtn) {
			prevBtn.addEventListener('click', function() {
				self._handlePrevious();
			});
		}

		// Save button
		var saveBtn = modal.querySelector('.wizard-btn-save');
		if (saveBtn) {
			saveBtn.addEventListener('click', function() {
				self._handleSave(self.state);
			});
		}

		// Reset when modal closes
		modal.addEventListener('funky.modal.hidden', function() {
			self._reset();
		});
	};

	/**
	 * Open the wizard to create a new trade
	 */
	TradeWizard.prototype.create = function() {
		var self = this;

		// Load initial data
		Promise.all([
			self._loadClients(),
			self._loadTemplates(),
			self._loadSecurities()
		]).then(function() {
			self.currentStep = 1;
			self.state = {};
			self._showStep(1);

			// Open modal using Funky.Modal
			Funky.Modal.show('#tradeWizardModal');
		}).catch(function(error) {
			console.error('Failed to load wizard data:', error);
			alert('Failed to load wizard data. Please try again.');
		});
	};

	/**
	 * Reset wizard state
	 */
	TradeWizard.prototype._reset = function() {
		this.selectedTemplate = null;
		this.selectedRelatedTemplate = null;
		this.templateFields = [];
		this.relatedTemplateFields = [];
		this.relationships = [];
		this.counterpartyRelationships = [];
		this.state = {};
	};

	/**
	 * Destroy the wizard instance and clean up
	 * Bindable Interface
	 */
	TradeWizard.prototype.destroy = function() {
		// Reset state
		this._reset();

		// Clear cached data
		this.clients = [];
		this.templates = [];
		this.securities = [];

		// Remove from instance registry
		_instances.unregister(this.modalId);

		// Clear global reference
		if (window.tradeWizard === this) {
			window.tradeWizard = null;
		}
	};

	/**
	 * Set wizard data / populate fields
	 * Bindable Interface
	 * @param {Object} data - Data object with trade wizard field values
	 */
	TradeWizard.prototype.setData = function(data) {
		var self = this;

		if (!data || typeof data !== 'object') {
			return;
		}

		// Merge data into state
		Object.keys(data).forEach(function(key) {
			self.state[key] = data[key];
		});

		// If we're on a visible step, update the UI
		if (this.currentStep) {
			var container = document.getElementById('wizardStepContent');
			if (container) {
				this._showStep(this.currentStep);
			}
		}
	};

	/**
	 * Get collected trade wizard data
	 * Bindable Interface
	 * @returns {Object} - All collected trade data including state and lookups
	 */
	TradeWizard.prototype.getData = function() {
		// Collect current step data first to ensure we have the latest
		if (this.currentStep) {
			this._collectStepData();
		}

		// Build a comprehensive data object
		var data = JSON.parse(JSON.stringify(this.state));

		// Add selected entity references for convenience
		if (this.selectedTemplate) {
			data._selectedTemplate = {
				id: this.selectedTemplate.id,
				name: this.selectedTemplate.name
			};
		}

		if (this.selectedRelatedTemplate) {
			data._selectedRelatedTemplate = {
				id: this.selectedRelatedTemplate.id,
				name: this.selectedRelatedTemplate.name
			};
		}

		// Add client info if available
		if (data.client_id && this.clients.length > 0) {
			var client = this.clients.find(function(c) { return c.id == data.client_id; });
			if (client) {
				data._client = {
					id: client.id,
					name: client.name,
					code: client.code
				};
			}
		}

		// Add security info if available
		if (data.security_id && this.securities.length > 0) {
			var security = this.securities.find(function(s) { return s.id == data.security_id; });
			if (security) {
				data._security = {
					id: security.id,
					name: security.name,
					code: security.code
				};
			}
		}

		return data;
	};

	/**
	 * Load clients from API using polling
	 */
	TradeWizard.prototype._loadClients = function() {
		var self = this;
		return Funky.Api.fetchAllClients()
			.then(function(clients) {
				self.clients = clients || [];
				console.log('[Trade Wizard] Loaded clients:', self.clients.length);
			})
			.catch(function(error) {
				console.error('[Trade Wizard] Error loading clients:', error);
				throw error;
			});
	};

	/**
	 * Load templates from API using polling
	 */
	TradeWizard.prototype._loadTemplates = function() {
		var self = this;
		return Funky.Api.fetchAll('/api/trade_templates', { is_active: 1 })
			.then(function(templates) {
				self.templates = templates || [];
				console.log('[Trade Wizard] Loaded templates:', self.templates.length);
			})
			.catch(function(error) {
				console.error('[Trade Wizard] Error loading templates:', error);
				throw error;
			});
	};

	/**
	 * Load securities from API using polling
	 */
	TradeWizard.prototype._loadSecurities = function() {
		var self = this;
		return Funky.Api.fetchAllSecurities()
			.then(function(securities) {
				self.securities = securities || [];
				console.log('[Trade Wizard] Loaded securities:', self.securities.length);
			})
			.catch(function(error) {
				console.error('[Trade Wizard] Error loading securities:', error);
				throw error;
			});
	};

	/**
	 * Load relationships for a specific client using polling
	 * Filters to only show 'counterparty' relationship types
	 */
	TradeWizard.prototype._loadRelationships = function(clientId) {
		var self = this;
		return Funky.Api.fetchAllClientRelationships({ params: { client_id: clientId } })
			.then(function(relationships) {
				console.log(relationships, clientId, 'Loaded relationships for client ' + clientId);
				// Filter to only show counterparty relationships
				self.relationships = (relationships || []).filter(function(r) {
					return r.client_id == clientId; // do not add the counterparty check
				});
				console.log('[Trade Wizard] Loaded counterparty relationships for client ' + clientId + ':', self.relationships.length);
			})
			.catch(function(error) {
				console.error('[Trade Wizard] Error loading relationships:', error);
				throw error;
			});
	};

	/**
	 * Load counterparty relationships for the related client
	 */
	TradeWizard.prototype._loadCounterpartyRelationships = function(relatedClientId, clientId) {
		var self = this;
		return Funky.Api.fetchAllClientRelationships({ params: { client_id: relatedClientId } })
			.then(function(relationships) {
				console.log(relationships, relatedClientId, 'Loaded counterparty relationships for related client ' + relatedClientId);
				// Filter to only show relationships that point back to the original client
				self.counterpartyRelationships = (relationships || []).filter(function(r) {
					return r.client_id == relatedClientId && r.related_client_id == clientId;
				});
				console.log('[Trade Wizard] Loaded counterparty relationships for related client ' + relatedClientId + ':', self.counterpartyRelationships.length);
			})
			.catch(function(error) {
				console.error('[Trade Wizard] Error loading counterparty relationships:', error);
				throw error;
			});
	};

	/**
	 * Load template fields (clear_fields)
	 */
	TradeWizard.prototype._loadTemplateFields = function(templateId) {
		return Funky.CSRF.secureFetch('/api/trade_templates/' + templateId + '/fields')
			.then(function(response) { return response.json(); })
			.then(function(data) {
				return data.clear_fields || [];
			});
	};

	/**
	 * Show a specific step
	 */
	TradeWizard.prototype._showStep = function(stepNum) {
		this.currentStep = stepNum;
		var container = document.getElementById('wizardStepContent');

		if (!container) return;

		// Render the appropriate step
		switch (stepNum) {
			case 1:
				this._renderBasicStep(container, this.state);
				break;
			case 2:
				this._renderTradeDetailsStep(container, this.state);
				break;
			case 3:
				if (this.state.counterparty_related_client_id) {
					this._renderRelatedTradeStep(container, this.state);
				} else {
					// Skip to summary
					this._showStep(4);
					return;
				}
				break;
			case 4:
				this._renderSummaryStep(container, this.state);
				break;
		}

		// Update wizard progress indicators
		this._updateWizardProgress(stepNum);

		// Update button visibility
		this._updateButtons(stepNum);
	};

	/**
	 * Update wizard progress indicators
	 */
	TradeWizard.prototype._updateWizardProgress = function(stepNum) {
		var self = this;
		var steps = document.querySelectorAll('.wizard-step');
		steps.forEach(function(step, index) {
			var num = index + 1;
			step.classList.remove('active', 'completed');
			// Remove aria-current from all steps
			step.removeAttribute('aria-current');

			if (num < stepNum) {
				step.classList.add('completed');
			} else if (num === stepNum) {
				step.classList.add('active');
				// Add aria-current="step" to active step
				step.setAttribute('aria-current', 'step');
			}
		});

		// Announce step change to screen readers
		if (Funky.Announce) {
			var totalSteps = self.state.counterparty_related_client_id ? 4 : 3;
			var stepName = '';
			switch (stepNum) {
				case 1: stepName = 'Basic Options'; break;
				case 2: stepName = 'Trade Details'; break;
				case 3: stepName = 'Related Trade Details'; break;
				case 4: stepName = 'Summary'; break;
			}
			Funky.Announce.polite('Step ' + stepNum + ' of ' + totalSteps + ': ' + stepName);
		}
	};

	/**
	 * Update button visibility
	 */
	TradeWizard.prototype._updateButtons = function(stepNum) {
		var modal = document.getElementById('tradeWizardModal');
		var prevBtn = modal.querySelector('.wizard-btn-prev');
		var nextBtn = modal.querySelector('.wizard-btn-next');
		var saveBtn = modal.querySelector('.wizard-btn-save');

		// Determine if we should skip step 3 - only show step 3 if counterparty has a related_client_id
		var shouldSkipRelated = !this.state.counterparty_related_client_id;
		var maxStep = shouldSkipRelated ? 3 : 4; // If skipping step 3, step 2 goes to 4
		var isLastStep = (shouldSkipRelated && stepNum === 2) || stepNum === 4;

		prevBtn.style.display = stepNum > 1 ? 'inline-block' : 'none';
		nextBtn.style.display = !isLastStep ? 'inline-block' : 'none';
		saveBtn.style.display = isLastStep ? 'inline-block' : 'none';
	};

	/**
	 * Handle next button click
	 */
	TradeWizard.prototype._handleNext = function() {
		// Collect and validate current step
		if (!this._collectAndValidateStep()) {
			return;
		}

		// Handle step-specific logic
		if (this.currentStep === 1) {
			var self = this;
			this._onBasicStepNext(this.state).then(function() {
				self._showStep(self.currentStep + 1);
			}).catch(function(error) {
				console.error('Error loading template data:', error);
				alert('Failed to load template data. Please try again.');
			});
		} else {
			// Check if we should skip step 3 - only show if counterparty has related_client_id
			if (this.currentStep === 2 && !this.state.counterparty_related_client_id) {
				this._showStep(4); // Skip to summary
			} else {
				this._showStep(this.currentStep + 1);
			}
		}
	};

	/**
	 * Handle previous button click
	 */
	TradeWizard.prototype._handlePrevious = function() {
		// Save current step data (without validation)
		this._collectStepData();

		// Go back, skipping step 3 if needed
		if (this.currentStep === 4 && !this.state.counterparty_related_client_id) {
			this._showStep(2); // Skip back over step 3
		} else {
			this._showStep(this.currentStep - 1);
		}
	};

	/**
	 * Collect and validate current step data
	 */
	TradeWizard.prototype._collectAndValidateStep = function() {
		this._collectStepData();

		switch (this.currentStep) {
			case 1:
				return this._validateBasicStep(this.state);
			case 2:
				return this._validateTradeDetailsStep(this.state);
			case 3:
				return this._validateRelatedTradeStep(this.state);
			default:
				return true;
		}
	};

	/**
	 * Collect data from current step
	 */
	TradeWizard.prototype._collectStepData = function() {
		switch (this.currentStep) {
			case 1:
				Object.assign(this.state, this._collectBasicStepData());
				break;
			case 2:
				Object.assign(this.state, this._collectTradeDetailsData());
				break;
			case 3:
				Object.assign(this.state, this._collectRelatedTradeData());
				break;
		}
	};

	/**
	 * Create a select field with options
	 * @private
	 */
	TradeWizard.prototype._createSelectField = function(options) {
		var col = D.div().classAdd('col-md-' + (options.colSize || 6), 'mb-3');
		var label = D.create('label')
			.classAdd('form-label')
			.attr('for', options.id)
			.text(options.label);

		if (options.required) {
			label.child(D.span().classAdd('text-danger').text(' *'));
		}

		var select = D.create('select')
			.classAdd('form-select')
			.attr('id', options.id);

		if (options.required) {
			select.attr('required', 'required');
		}

		// Add placeholder option
		select.child(
			D.create('option').attr('value', '').text(options.placeholder || 'Select...')
		);

		// Add items
		if (options.items && options.items.length > 0) {
			options.items.forEach(function(item) {
				var opt = D.create('option')
					.attr('value', item.value)
					.text(item.text);

				if (item.selected) {
					opt.attr('selected', 'selected');
				}
				if (item.dataRelatedClientId !== undefined) {
					opt.data('related-client-id', item.dataRelatedClientId);
				}

				select.child(opt);
			});
		}

		return col.child(label, select);
	};

	/**
	 * Build relationship display text
	 * @private
	 */
	TradeWizard.prototype._buildRelationshipDisplayText = function(r) {
		var relatedClientName = r.related_client_name || 'Unknown';
		var relatedClientCode = r.related_client_code || '';
		var cptyCode = r.cpty_cd ? ' | Cpty: ' + r.cpty_cd : '';
		var groupCode = r.group_cd ? ' | Group: ' + r.group_cd : '';
		var fundCode = r.fund_cd ? ' | Fund: ' + r.fund_cd : '';
		return relatedClientName + (relatedClientCode ? ' (' + relatedClientCode + ')' : '') + cptyCode + groupCode + fundCode;
	};

	/**
	 * Render Step 1: Basic Trade Options
	 */
	TradeWizard.prototype._renderBasicStep = function(container, state) {
		var self = this;
		var elements = [];

		// Row 1: Client and Template
		elements.push(
			D.div().classAdd('row').child(
				self._createSelectField({
					id: 'client_id',
					label: 'Client',
					placeholder: 'Select Client',
					required: true,
					items: self.clients.map(function(c) {
						return {
							value: c.id,
							text: c.name + ' (' + c.code + ')',
							selected: state.client_id == c.id
						};
					})
				}),
				self._createSelectField({
					id: 'template_id',
					label: 'Trade Template',
					placeholder: 'Select Template',
					required: true,
					items: self.templates.map(function(t) {
						return {
							value: t.id,
							text: t.name,
							selected: state.template_id == t.id
						};
					})
				})
			)
		);

		// Row 2: Security and Client Relationship
		elements.push(
			D.div().classAdd('row').child(
				self._createSelectField({
					id: 'security_id',
					label: 'Security',
					placeholder: 'Select Security',
					required: true,
					items: self.securities.map(function(s) {
						return {
							value: s.id,
							text: s.name + ' (' + s.code + ')',
							selected: state.security_id == s.id
						};
					})
				}),
				self._createSelectField({
					id: 'client_relationship_id',
					label: 'Related Client Relationship (Optional)',
					placeholder: 'No Related Trade',
					items: self.relationships.map(function(r) {
						return {
							value: r.id,
							text: self._buildRelationshipDisplayText(r),
							selected: state.client_relationship_id == r.id,
							dataRelatedClientId: r.related_client_id
						};
					})
				})
			)
		);

		// Counterparty Relationship container (hidden by default)
		elements.push(
			D.div().classAdd('row').attr('id', 'counterparty_relationship_container').style('display', 'none').child(
				self._createSelectField({
					id: 'counterparty_client_relationship_id',
					label: 'Counterparty Related Client Relationship (Optional)',
					placeholder: 'No Counterparty Relationship',
					colSize: 12,
					items: self.counterpartyRelationships.map(function(r) {
						return {
							value: r.id,
							text: self._buildRelationshipDisplayText(r),
							selected: state.counterparty_client_relationship_id == r.id,
							dataRelatedClientId: r.related_client_id
						};
					})
				})
			)
		);

		// Related Template container (hidden by default)
		elements.push(
			D.div().classAdd('row').attr('id', 'related_template_container').style('display', 'none').child(
				self._createSelectField({
					id: 'related_template_id',
					label: 'Related Trade Template',
					placeholder: 'Select Template',
					required: true,
					colSize: 12,
					items: self.templates.map(function(t) {
						return {
							value: t.id,
							text: t.name,
							selected: state.related_template_id == t.id
						};
					})
				})
			)
		);

		D.wrap(container).empty();
		var wrapper = D.fragment.apply(null, elements);
		container.appendChild(wrapper);

		// Set up event listeners
		document.getElementById('client_id').addEventListener('change', function() {
			var clientId = this.value;
			if (clientId) {
				self._loadRelationships(clientId).then(function() {
					self._renderBasicStep(container, self._collectBasicStepData());
				});
			} else {
				self.relationships = [];
				self.counterpartyRelationships = [];
				// Reset select to default option
				var relationshipSelect = D.one('#client_relationship_id');
				D.wrap(relationshipSelect).empty();
				D.create('option').attr('value', '').text('No Related Trade').appendTo(relationshipSelect);
			}
		});

		document.getElementById('client_relationship_id').addEventListener('change', function() {
			var relationshipSelect = this;
			var selectedOption = relationshipSelect.options[relationshipSelect.selectedIndex];
			var relatedClientId = selectedOption ? selectedOption.getAttribute('data-related-client-id') : null;
			var hasRelationship = this.value !== '';
			var clientId = document.getElementById('client_id').value;

			// Show counterparty container if relationship selected
			document.getElementById('counterparty_relationship_container').style.display = hasRelationship ? 'block' : 'none';

			// Load counterparty relationships if related client exists
			if (hasRelationship && relatedClientId && clientId) {
				self._loadCounterpartyRelationships(relatedClientId, clientId).then(function() {
					self._renderBasicStep(container, self._collectBasicStepData());
				});
			} else {
				self.counterpartyRelationships = [];
				document.getElementById('related_template_container').style.display = 'none';
			}
		});

		document.getElementById('counterparty_client_relationship_id').addEventListener('change', function() {
			var counterpartySelect = this;
			var selectedOption = counterpartySelect.options[counterpartySelect.selectedIndex];
			var relatedClientId = selectedOption ? selectedOption.getAttribute('data-related-client-id') : null;

			// Only show related template if counterparty relationship has a related_client_id
			document.getElementById('related_template_container').style.display = relatedClientId ? 'block' : 'none';
		});

		// Trigger visibility based on current state
		if (state.client_relationship_id) {
			var relationshipSelect = document.getElementById('client_relationship_id');
			var selectedOption = relationshipSelect.options[relationshipSelect.selectedIndex];
			var relatedClientId = selectedOption ? selectedOption.getAttribute('data-related-client-id') : null;

			document.getElementById('counterparty_relationship_container').style.display = 'block';

			if (state.counterparty_client_relationship_id) {
				var counterpartySelect = document.getElementById('counterparty_client_relationship_id');
				var counterpartyOption = counterpartySelect.options[counterpartySelect.selectedIndex];
				var counterpartyRelatedClientId = counterpartyOption ? counterpartyOption.getAttribute('data-related-client-id') : null;

				document.getElementById('related_template_container').style.display = counterpartyRelatedClientId ? 'block' : 'none';
			}
		}
	};

	/**
	 * Validate Step 1
	 */
	TradeWizard.prototype._validateBasicStep = function(state) {
		var errorMessage = null;

		if (!state.client_id) {
			errorMessage = 'Please select a client';
		} else if (!state.template_id) {
			errorMessage = 'Please select a trade template';
		} else if (!state.security_id) {
			errorMessage = 'Please select a security';
		} else if (state.counterparty_related_client_id && !state.related_template_id) {
			// If counterparty relationship has a related_client_id, related template is required
			errorMessage = 'Please select a template for the related trade';
		}

		if (errorMessage) {
			alert(errorMessage);
			// Announce error to screen readers
			if (Funky.Announce) {
				Funky.Announce.assertive('Validation error: ' + errorMessage);
			}
			return false;
		}

		return true;
	};

	/**
	 * Collect data from Step 1
	 */
	TradeWizard.prototype._collectBasicStepData = function() {
		// Helper to safely get element value
		function getElementValue(id) {
			var el = document.getElementById(id);
			return el ? el.value : null;
		}

		var relationshipSelect = document.getElementById('client_relationship_id');
		var selectedOption = relationshipSelect && relationshipSelect.options ?
			relationshipSelect.options[relationshipSelect.selectedIndex] : null;
		var relatedClientId = selectedOption ? selectedOption.getAttribute('data-related-client-id') : null;

		var counterpartySelect = document.getElementById('counterparty_client_relationship_id');
		var counterpartyOption = counterpartySelect && counterpartySelect.options ?
			counterpartySelect.options[counterpartySelect.selectedIndex] : null;
		var counterpartyRelatedClientId = counterpartyOption ? counterpartyOption.getAttribute('data-related-client-id') : null;

		return {
			client_id: getElementValue('client_id'),
			template_id: getElementValue('template_id'),
			security_id: getElementValue('security_id'),
			client_relationship_id: relationshipSelect ? relationshipSelect.value : null,
			related_client_id: relatedClientId,
			counterparty_client_relationship_id: counterpartySelect ? counterpartySelect.value : null,
			counterparty_related_client_id: counterpartyRelatedClientId,
			related_template_id: getElementValue('related_template_id')
		};
	};

	/**
	 * Handle moving to next step from Basic Options
	 */
	TradeWizard.prototype._onBasicStepNext = function(state) {
		var self = this;

		// Load template fields for the selected template
		return self._loadTemplateFields(state.template_id).then(function(fields) {
			self.templateFields = fields;
			self.selectedTemplate = self.templates.find(function(t) { return t.id == state.template_id; });

			// If related template selected, load its fields too
			if (state.related_template_id) {
				return self._loadTemplateFields(state.related_template_id).then(function(relatedFields) {
					self.relatedTemplateFields = relatedFields;
					self.selectedRelatedTemplate = self.templates.find(function(t) { return t.id == state.related_template_id; });
				});
			}
		});
	};

	/**
	 * Create a form field wrapper with label and input
	 * @private
	 */
	TradeWizard.prototype._createFormField = function(options) {
		var col = D.div().classAdd('col-md-' + (options.colSize || 6), 'mb-3');
		var label = D.create('label')
			.classAdd('form-label')
			.attr('for', options.id)
			.text(options.label);

		if (options.required) {
			label.child(D.span().classAdd('text-danger').text(' *'));
		}

		var input;
		if (options.type === 'textarea') {
			input = D.create('textarea')
				.classAdd('form-control')
				.attr('id', options.id)
				.attr('rows', options.rows || 2);
			if (options.value) {
				input.text(options.value);
			}
		} else {
			input = D.create('input')
				.classAdd('form-control')
				.attr('type', options.type || 'text')
				.attr('id', options.id)
				.attr('value', options.value || '');

			if (options.required) {
				input.attr('required', 'required');
			}
			if (options.placeholder) {
				input.attr('placeholder', options.placeholder);
			}
			if (options.dataField) {
				input.data('field', options.dataField);
			}
			if (options.className) {
				input.classAdd(options.className);
			}
		}

		return col.child(label, input);
	};

	/**
	 * Render Step 2: Trade Details
	 */
	TradeWizard.prototype._renderTradeDetailsStep = function(container, state) {
		var self = this;
		var elements = [];

		// Row 1: Contract ID and Trade Name
		elements.push(
			D.div().classAdd('row').child(
				self._createFormField({
					id: 'contract_id',
					label: 'Contract ID',
					value: state.contract_id || '',
					required: true
				}),
				self._createFormField({
					id: 'trade_name',
					label: 'Trade Name',
					value: state.trade_name || '',
					required: true
				})
			)
		);

		// Row 2: Trade Description
		elements.push(
			D.div().classAdd('row').child(
				self._createFormField({
					id: 'trade_description',
					label: 'Trade Description',
					type: 'textarea',
					value: state.trade_description || '',
					colSize: 12
				})
			)
		);

		// Row 3: Trade Start/End Dates
		elements.push(
			D.div().classAdd('row').child(
				self._createFormField({
					id: 'trade_start_date',
					label: 'Trade Start Date',
					type: 'date',
					value: state.trade_start_date || '',
					required: true
				}),
				self._createFormField({
					id: 'trade_end_date',
					label: 'Trade End Date',
					type: 'date',
					value: state.trade_end_date || '',
					required: true
				})
			)
		);

		// Add dynamic fields based on template's clear_fields
		if (self.templateFields.length > 0) {
			elements.push(
				D.create('h6').classAdd('mt-3', 'mb-3').text('Template-Specific Fields')
			);

			var fieldsRow = D.div().classAdd('row');
			self.templateFields.forEach(function(field) {
				var fieldValue = state.trade_fields && state.trade_fields[field] ? state.trade_fields[field] : '';
				fieldsRow.child(
					self._createFormField({
						id: 'trade_field_' + field,
						label: self._formatFieldName(field),
						value: fieldValue,
						dataField: field,
						className: 'trade-field'
					})
				);
			});
			elements.push(fieldsRow);
		}

		D.wrap(container).empty();
		var wrapper = D.fragment.apply(null, elements);
		container.appendChild(wrapper);
	};

	/**
	 * Validate Step 2
	 */
	TradeWizard.prototype._validateTradeDetailsStep = function(state) {
		var errorMessage = null;

		if (!state.contract_id) {
			errorMessage = 'Please enter a contract ID';
		} else if (!state.trade_name) {
			errorMessage = 'Please enter a trade name';
		} else if (!state.trade_start_date) {
			errorMessage = 'Please select a trade start date';
		} else if (!state.trade_end_date) {
			errorMessage = 'Please select a trade end date';
		}

		if (errorMessage) {
			alert(errorMessage);
			// Announce error to screen readers
			if (Funky.Announce) {
				Funky.Announce.assertive('Validation error: ' + errorMessage);
			}
			return false;
		}

		return true;
	};

	/**
	 * Collect data from Step 2
	 */
	TradeWizard.prototype._collectTradeDetailsData = function() {
		var tradeFields = {};
		var fieldInputs = document.querySelectorAll('.trade-field');
		fieldInputs.forEach(function(input) {
			var fieldName = input.getAttribute('data-field');
			if (input.value) {
				tradeFields[fieldName] = input.value;
			}
		});

		return {
			contract_id: document.getElementById('contract_id').value,
			trade_name: document.getElementById('trade_name').value,
			trade_description: document.getElementById('trade_description').value,
			trade_start_date: document.getElementById('trade_start_date').value,
			trade_end_date: document.getElementById('trade_end_date').value,
			trade_fields: tradeFields
		};
	};

	/**
	 * Render Step 3: Related Trade Details
	 */
	TradeWizard.prototype._renderRelatedTradeStep = function(container, state) {
		var self = this;
		var elements = [];

		// Info alert
		elements.push(
			D.div().classAdd('alert', 'alert-info').child(
				D.icon('bi bi-info-circle'),
				D.text(' You are creating a related trade for the selected client relationship.')
			)
		);

		// Row 1: Contract ID and Trade Name
		elements.push(
			D.div().classAdd('row').child(
				self._createFormField({
					id: 'related_contract_id',
					label: 'Contract ID',
					value: state.related_contract_id || state.contract_id || '',
					placeholder: 'Leave blank to use same as primary trade'
				}),
				self._createFormField({
					id: 'related_trade_name',
					label: 'Trade Name',
					value: state.related_trade_name || '',
					required: true
				})
			)
		);

		// Row 2: Trade Description
		elements.push(
			D.div().classAdd('row').child(
				self._createFormField({
					id: 'related_trade_description',
					label: 'Trade Description',
					type: 'textarea',
					value: state.related_trade_description || '',
					colSize: 12
				})
			)
		);

		// Row 3: Trade Start/End Dates
		elements.push(
			D.div().classAdd('row').child(
				self._createFormField({
					id: 'related_trade_start_date',
					label: 'Trade Start Date',
					type: 'date',
					value: state.related_trade_start_date || state.trade_start_date || '',
					placeholder: 'Leave blank to use same as primary trade'
				}),
				self._createFormField({
					id: 'related_trade_end_date',
					label: 'Trade End Date',
					type: 'date',
					value: state.related_trade_end_date || state.trade_end_date || '',
					placeholder: 'Leave blank to use same as primary trade'
				})
			)
		);

		// Add dynamic fields based on related template's clear_fields
		if (self.relatedTemplateFields.length > 0) {
			elements.push(
				D.create('h6').classAdd('mt-3', 'mb-3').text('Template-Specific Fields')
			);

			var fieldsRow = D.div().classAdd('row');
			self.relatedTemplateFields.forEach(function(field) {
				var fieldValue = state.related_trade_fields && state.related_trade_fields[field] ? state.related_trade_fields[field] : '';
				fieldsRow.child(
					self._createFormField({
						id: 'related_trade_field_' + field,
						label: self._formatFieldName(field),
						value: fieldValue,
						dataField: field,
						className: 'related-trade-field'
					})
				);
			});
			elements.push(fieldsRow);
		}

		D.wrap(container).empty();
		var wrapper = D.fragment.apply(null, elements);
		container.appendChild(wrapper);
	};

	/**
	 * Validate Step 3
	 */
	TradeWizard.prototype._validateRelatedTradeStep = function(state) {
		if (!state.related_trade_name) {
			var errorMessage = 'Please enter a trade name for the related trade';
			alert(errorMessage);
			// Announce error to screen readers
			if (Funky.Announce) {
				Funky.Announce.assertive('Validation error: ' + errorMessage);
			}
			return false;
		}

		return true;
	};

	/**
	 * Collect data from Step 3
	 */
	TradeWizard.prototype._collectRelatedTradeData = function() {
		var relatedTradeFields = {};
		var fieldInputs = document.querySelectorAll('.related-trade-field');
		fieldInputs.forEach(function(input) {
			var fieldName = input.getAttribute('data-field');
			if (input.value) {
				relatedTradeFields[fieldName] = input.value;
			}
		});

		return {
			related_contract_id: document.getElementById('related_contract_id').value,
			related_trade_name: document.getElementById('related_trade_name').value,
			related_trade_description: document.getElementById('related_trade_description').value,
			related_trade_start_date: document.getElementById('related_trade_start_date').value,
			related_trade_end_date: document.getElementById('related_trade_end_date').value,
			related_trade_fields: relatedTradeFields
		};
	};

	/**
	 * Render Step 4: Summary
	 */
	TradeWizard.prototype._renderSummaryStep = function(container, state) {
		var self = this;

		var hasRelatedTrade = state.counterparty_related_client_id;
		var client = self.clients.find(function(c) { return c.id == state.client_id; });

		// For related client, try to get from relationship data first, then fall back to clients array
		var relatedClient = null;
		if (hasRelatedTrade) {
			var relationship = self.relationships.find(function(r) { return r.id == state.client_relationship_id; });
			if (relationship) {
				relatedClient = {
					id: relationship.related_client_id,
					name: relationship.related_client_name,
					code: relationship.related_client_code
				};
			} else {
				relatedClient = self.clients.find(function(c) { return c.id == state.related_client_id; });
			}
		}

		var template = self.selectedTemplate;
		var relatedTemplate = self.selectedRelatedTemplate;
		var security = self.securities.find(function(s) { return s.id == state.security_id; });

		var summaryContainer = D.div().classAdd('trade-summary-container');

		if (hasRelatedTrade) {
			// Side-by-side layout for two trades
			var row = D.div().classAdd('row');

			// Primary trade card
			row.child(
				D.div().classAdd('col-md-6', 'mb-3').child(
					D.div().classAdd('card').child(
						D.div().classAdd('card-header', 'bg-primary', 'text-white').child(
							D.create('h6').classAdd('mb-0').text('Primary Trade')
						),
						D.div().classAdd('card-body').child(
							self._renderTradeSummaryContent(state, client, template, security, false)
						)
					)
				)
			);

			// Related trade card
			row.child(
				D.div().classAdd('col-md-6', 'mb-3').child(
					D.div().classAdd('card').child(
						D.div().classAdd('card-header', 'bg-success', 'text-white').child(
							D.create('h6').classAdd('mb-0').text('Related Trade')
						),
						D.div().classAdd('card-body').child(
							self._renderTradeSummaryContent(state, relatedClient, relatedTemplate, security, true)
						)
					)
				)
			);

			summaryContainer.child(row);
		} else {
			// Single trade layout
			summaryContainer.child(
				D.div().classAdd('card').child(
					D.div().classAdd('card-header', 'bg-primary', 'text-white').child(
						D.create('h6').classAdd('mb-0').text('Trade Summary')
					),
					D.div().classAdd('card-body').child(
						self._renderTradeSummaryContent(state, client, template, security, false)
					)
				)
			);
		}

		D.wrap(container).empty();
		summaryContainer.appendTo(container);
	};

	/**
	 * Render trade summary content
	 * @returns {Funky.Dom}
	 */
	TradeWizard.prototype._renderTradeSummaryContent = function(state, client, template, security, isRelated) {
		var self = this;
		var prefix = isRelated ? 'related_' : '';

		var tbody = D.create('tbody');

		// Helper to create a summary row
		function addRow(label, value, isStrong) {
			var td2 = D.td();
			if (isStrong) {
				td2.child(D.create('strong').text(value));
			} else {
				td2.text(value);
			}
			tbody.child(
				D.tr().child(
					D.td().classAdd('text-muted').text(label),
					td2
				)
			);
		}

		addRow('Client:', client ? client.name : 'N/A', true);
		addRow('Template:', template ? template.name : 'N/A', true);
		addRow('Security:', security ? security.name : 'N/A', true);
		addRow('Contract ID:', state[prefix + 'contract_id'] || state.contract_id || 'N/A', false);
		addRow('Trade Name:', state[prefix + 'trade_name'] || 'N/A', false);

		if (state[prefix + 'trade_description']) {
			addRow('Description:', state[prefix + 'trade_description'], false);
		}

		addRow('Start Date:', state[prefix + 'trade_start_date'] || state.trade_start_date || 'N/A', false);
		addRow('End Date:', state[prefix + 'trade_end_date'] || state.trade_end_date || 'N/A', false);

		// Show template fields if any
		var fields = isRelated ? state.related_trade_fields : state.trade_fields;
		if (fields && Object.keys(fields).length > 0) {
			tbody.child(
				D.tr().child(
					D.td().attr('colspan', '2').classAdd('pt-3').child(
						D.create('strong').text('Template Fields:')
					)
				)
			);
			Object.keys(fields).forEach(function(key) {
				if (fields[key]) {
					tbody.child(
						D.tr().child(
							D.td().classAdd('text-muted', 'ps-3').text(self._formatFieldName(key) + ':'),
							D.td().text(fields[key])
						)
					);
				}
			});
		}

		return D.table().classAdd('table', 'table-sm', 'table-borderless').child(tbody);
	};

	/**
	 * Handle save - submit to API
	 */
	TradeWizard.prototype._handleSave = function(state) {
		var self = this;

		// Prepare the payload
		var payload = {
			client_id: parseInt(state.client_id),
			template_id: parseInt(state.template_id),
			security_id: parseInt(state.security_id),
			contract_id: state.contract_id,
			trade_name: state.trade_name,
			trade_description: state.trade_description,
			trade_start_date: state.trade_start_date,
			trade_end_date: state.trade_end_date,
			trade_fields: state.trade_fields || {}
		};

		// Add relationship if selected
		if (state.client_relationship_id) {
			payload.client_relationship_id = parseInt(state.client_relationship_id);
			payload.related_client_id = parseInt(state.related_client_id);
			payload.related_template_id = parseInt(state.related_template_id);
			payload.related_trade = true;

			payload.related_contract_id = state.related_contract_id;
			payload.related_trade_name = state.related_trade_name;
			payload.related_trade_description = state.related_trade_description;
			payload.related_trade_start_date = state.related_trade_start_date;
			payload.related_trade_end_date = state.related_trade_end_date;
			payload.related_trade_fields = state.related_trade_fields || {};
		}

		// Submit to API using secureFetch (handles CSRF automatically)
		return Funky.CSRF.secureFetch('/api/trades/wizard', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			})
			.then(function(response) {
				if (!response.ok) {
					return response.json().then(function(err) {
						throw new Error(err.error || 'Failed to create trade');
					});
				}
				return response.json();
			})
			.then(function(result) {
				if (Funky.Toast) {
					window.Funky.Toast.success(result.message || 'Trade(s) created successfully!', 'Trade Created');
				} else {
					alert(result.message || 'Trade(s) created successfully!');
				}
				self._reset();

				// Close the modal
				Funky.Modal.hide('#tradeWizardModal');

				// Refresh the DataTable instead of full page reload
				if (window.location.pathname.includes('/trades') && window.tradesTable) {
					window.tradesTable.ajax.reload(null, false);
				} else if (window.location.pathname.includes('/trades')) {
					// Fallback: try to find the table by ID
					var table = $('#tradesTable').DataTable();
					if (table) {
						table.ajax.reload(null, false);
					}
				} else {
					// Navigate to trades page via SPA if not on trades page
					if (window.SPA && typeof window.SPA.navigate === 'function') {
						window.SPA.navigate('/trades');
					} else {
						window.location.href = '/trades';
					}
				}
			})
			.catch(function(error) {
				console.error('Failed to create trade:', error);
				alert('Failed to create trade: ' + error.message);
				throw error; // Re-throw to prevent wizard from closing
			});
	};

	/**
	 * Format field name for display
	 */
	TradeWizard.prototype._formatFieldName = function(field) {
		return field
			.replace(/_/g, ' ')
			.replace(/\b\w/g, function(l) { return l.toUpperCase(); });
	};

	// Factory object for Bindable Interface compatibility
	var TradeWizardFactory = {
		/**
		 * Create a new TradeWizard instance (primary factory method)
		 * @param {string} [modalId] - Optional modal ID for instance registration
		 * @returns {TradeWizard}
		 */
		init: function(modalId) {
			return new TradeWizard(modalId);
		},

		/**
		 * @deprecated Use TradeWizard.init() instead
		 */
		create: function(modalId) {
			if (Funky.debug) {
				console.warn('[Funky.TradeWizard] create() is deprecated. Use init() instead.');
			}
			return TradeWizardFactory.init(modalId);
		},

		/**
		 * Get wizard instance by modal ID
		 * @param {string} id - The modal ID
		 * @returns {TradeWizard|null}
		 */
		getInstance: function(id) {
			return _instances.get(id);
		},

		/**
		 * Destroy instance by ID
		 * @param {string} id - Instance ID
		 */
		destroy: function(id) {
			var instance = _instances.get(id);
			if (instance) {
				instance.destroy();
				_instances.unregister(id);
			}
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		/**
		 * Get all instances
		 * @returns {Object}
		 */
		getAll: function() {
			return _instances.getAll();
		},

		// Expose constructor for instanceof checks
		constructor: TradeWizard,

		// Expose _instances registry for consistency and testing
		_instances: _instances
	};

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('TradeWizard', TradeWizardFactory);
	}

	// Store instance reference in closure
	var tradeWizardInstance = null;
	var spaListenerRegistered = false;

	/**
	 * Initialize or re-initialize the trade wizard
	 * Safe to call multiple times (for SPA navigation)
	 */
	function initTradeWizard() {
		// Only initialize if we're on a page that needs it
		var tradeWizardModal = document.getElementById('tradeWizardModal');
		if (tradeWizardModal) {
			tradeWizardInstance = new TradeWizard();
			// Expose instance for onclick handlers
			window.tradeWizard = tradeWizardInstance;
			console.log('[TradeWizard] Initialized');
		}
	}

	// Initialize trade wizard when DOM is ready or immediately if already loaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			initTradeWizard();
		});
	} else {
		// DOM already loaded (SPA navigation case)
		initTradeWizard();
	}

	// Also listen for SPA page loads (only register once)
	if (!spaListenerRegistered) {
		spaListenerRegistered = true;
		document.addEventListener('funky.spa.pageload', function(e) {
			if (e.detail && e.detail.page === 'trades') {
				// Small delay to ensure DOM is updated
				setTimeout(function() {
					initTradeWizard();
				}, 50);
			}
		});
	}

})(window);
