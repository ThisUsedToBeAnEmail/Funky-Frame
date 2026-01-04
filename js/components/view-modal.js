/**
 * Funky ViewModal - Dynamic View/Detail Modal
 * 
 * Displays entity details in a modal with configurable fields.
 * Integrates with Cache layer for data fetching.
 * 
 * Usage:
 *   Funky.ViewModal.init({
 *     modalId: 'viewClientModal',
 *     entity: 'client',
 *     apiUrl: '/api/clients',
 *     fields: [
 *       { key: 'code', label: 'Code' },
 *       { key: 'name', label: 'Name' },
 *       { key: 'is_active', label: 'Status', render: 'activeStatus' }
 *     ]
 *   });
 *   
 *   Funky.ViewModal.show('viewClientModal', 123);
 * 
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.ViewModal] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('ViewModal')) {
		return;
	}

	// Store modal configurations
	var configs = {};

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
	 * Create modal HTML if it doesn't exist
	 */
	function ensureModalExists(modalId, config) {
		if (document.getElementById(modalId)) return;

		var title = config.title || config.entityLabel || 'View Details';
		var titleId = modalId + '-title';
		var D = Funky.Dom;

		// Build modal using Funky.Dom for better accessibility
		var modal = D.div()
			.id(modalId)
			.class('modal fade')
			.attr('tabindex', '-1')
			.attr('role', 'dialog')
			.aria('labelledby', titleId)
			.aria('modal', 'true')
			.child(
				D.div().class('modal-dialog modal-lg').attr('role', 'document').child(
					D.div().class('modal-content').child(
						// Header
						D.div().class('modal-header').child(
							D.create('h5').id(titleId).class('modal-title').child(
								D.icon('fas fa-eye me-2'),
								escapeHtml(title)
							),
							D.button()
								.attr('type', 'button')
								.class('btn-close')
								.attr('data-funky-modal-close', '')
								.aria('label', 'Close')
						),
						// Body
						D.div().class('modal-body').child(
							// Loading state
							D.div().class('view-modal-loading text-center py-4').child(
								D.div()
									.class('spinner-border text-primary')
									.attr('role', 'status')
									.aria('label', 'Loading'),
								D.div().class('mt-2 text-muted').aria('hidden', 'true').text('Loading...')
							),
							// Content
							D.div().class('view-modal-content').style('display', 'none'),
							// Error
							D.div()
								.class('view-modal-error alert alert-danger')
								.style('display', 'none')
								.attr('role', 'alert')
						),
						// Footer
						D.div().class('modal-footer').child(
							D.button()
								.attr('type', 'button')
								.class('btn-funky btn-funky-secondary')
								.attr('data-funky-modal-close', '')
								.child(
									D.icon('fas fa-times me-1'),
									'Close'
								)
						)
					)
				)
			);

		document.body.appendChild(modal.get());
	}

	/**
	 * Build field display element using Funky.Dom
	 */
	function buildFieldElement(field, value, row) {
		var D = Funky.Dom;
		var label = field.label || field.key;
		var displayValue = value;

		// Apply renderer if specified
		if (field.render) {
			if (typeof field.render === 'function') {
				displayValue = field.render(value, row);
			} else if (typeof field.render === 'string') {
				// Use Funky.Renderers string shortcut
				var renderer = Funky.Renderers && Funky.Renderers.get ?
					Funky.Renderers.get(field.render) : null;
				if (renderer) {
					displayValue = renderer(value, 'display', row);
				}
			}
		}

		var colClass = field.colClass || 'col-md-6';
		var valueEl = D.div().class('fs-6');

		// Handle null/undefined
		if (displayValue === null || displayValue === undefined) {
			valueEl.child(D.span().class('text-muted').text('-'));
		} else if (typeof displayValue === 'boolean') {
			valueEl.text(displayValue ? 'Yes' : 'No');
		} else if (typeof displayValue === 'string' && displayValue.includes('<')) {
			// HTML content - use innerHTML but be cautious
			valueEl.get().innerHTML = displayValue;
		} else {
			valueEl.text(String(displayValue));
		}

		return D.div().class(colClass + ' mb-3').child(
			D.label().class('form-label text-muted small mb-0').text(label),
			valueEl
		).get();
	}

	/**
	 * Render content in modal
	 */
	function renderContent(modal, config, data) {
		var D = Funky.Dom;
		var loadingEl = modal.querySelector('.view-modal-loading');
		var contentEl = modal.querySelector('.view-modal-content');
		var errorEl = modal.querySelector('.view-modal-error');

		loadingEl.style.display = 'none';
		errorEl.style.display = 'none';
		contentEl.style.display = 'block';

		// Clear previous content
		contentEl.innerHTML = '';

		// Build content using Funky.Dom
		var rowEl = D.div().class('row');

		config.fields.forEach(function(field) {
			var value = data[field.key];
			rowEl.get().appendChild(buildFieldElement(field, value, data));
		});

		contentEl.appendChild(rowEl.get());

		// Add custom sections if defined
		if (config.sections && Array.isArray(config.sections)) {
			config.sections.forEach(function(section) {
				contentEl.appendChild(D.create('hr').class('my-3').get());
				contentEl.appendChild(D.create('h6').text(section.title).get());

				var sectionRow = D.div().class('row');
				section.fields.forEach(function(field) {
					var value = data[field.key];
					sectionRow.get().appendChild(buildFieldElement(field, value, data));
				});
				contentEl.appendChild(sectionRow.get());
			});
		}

		// Announce content loaded to screen readers
		if (Funky.Announce) {
			Funky.Announce.polite('Details loaded');
		}

		// Call onRender callback if defined
		if (typeof config.onRender === 'function') {
			config.onRender(data, contentEl);
		}
	}

	/**
	 * Show error in modal
	 */
	function showError(modal, message) {
		var loadingEl = modal.querySelector('.view-modal-loading');
		var contentEl = modal.querySelector('.view-modal-content');
		var errorEl = modal.querySelector('.view-modal-error');

		loadingEl.style.display = 'none';
		contentEl.style.display = 'none';
		errorEl.style.display = 'block';
		errorEl.textContent = message;

		// Announce error to screen readers
		if (Funky.Announce) {
			Funky.Announce.assertive('Error: ' + message);
		}
	}

	/**
	 * Fetch data and display
	 */
	function fetchAndShow(modalId, id) {
		var config = configs[modalId];
		if (!config) {
			console.error('[Funky.ViewModal] Config not found for:', modalId);
			return;
		}

		var modal = document.getElementById(modalId);
		var loadingEl = modal.querySelector('.view-modal-loading');
		var contentEl = modal.querySelector('.view-modal-content');
		var errorEl = modal.querySelector('.view-modal-error');

		// Show loading state
		loadingEl.style.display = 'block';
		contentEl.style.display = 'none';
		errorEl.style.display = 'none';

		// Announce loading to screen readers
		if (Funky.Announce) {
			Funky.Announce.polite('Loading details');
		}

		// Show modal
		Funky.Modal.show('#' + modalId);

		// Bind close buttons (only once)
		if (!modal._funkyClosesBound) {
			modal._funkyClosesBound = true;
			modal.querySelectorAll('[data-funky-modal-close]').forEach(function(btn) {
				btn.addEventListener('click', function() {
					Funky.Modal.hide('#' + modalId);
				});
			});
		}

		// Check cache first
		if (Funky.Cache) {
			var cached = Funky.Cache.get(config.entity, id);
			if (cached) {
				console.log('[Funky.ViewModal] Using cached data for', config.entity, id);
				renderContent(modal, config, cached);
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
				renderContent(modal, config, data);
			})
			.catch(function(error) {
				console.error('[Funky.ViewModal] Fetch error:', error);
				showError(modal, 'Failed to load data: ' + (error.message || error));
			});
	}

	var ViewModal = {
		/**
		 * Instance registry for Bindable Interface
		 */
		_instances: {},

		/**
		 * Initialize a view modal
		 * @param {object} config - Configuration
		 * @param {string} config.modalId - Modal element ID
		 * @param {string} config.entity - Entity type (for caching)
		 * @param {string} config.apiUrl - API endpoint base URL
		 * @param {Array} config.fields - Field definitions
		 */
		init: function(config) {
			if (!config || !config.modalId) {
				console.error('[Funky.ViewModal] modalId is required');
				return;
			}

			configs[config.modalId] = config;
			ensureModalExists(config.modalId, config);

			// Register instance for Bindable Interface
			this._instances[config.modalId] = {
				modalId: config.modalId,
				config: config,
				data: null
			};
		},

		/**
		 * Show modal with data for given ID
		 * @param {string} modalId - Modal ID
		 * @param {number|string} id - Entity ID to display
		 */
		show: function(modalId, id) {
			fetchAndShow(modalId, id);
		},

		/**
		 * Show modal with provided data (no fetch)
		 * @param {string} modalId - Modal ID
		 * @param {object} data - Data to display
		 */
		showWithData: function(modalId, data) {
			var config = configs[modalId];
			if (!config) {
				console.error('[Funky.ViewModal] Config not found for:', modalId);
				return;
			}

			var modal = document.getElementById(modalId);
			renderContent(modal, config, data);

			Funky.Modal.show('#' + modalId);
		},

		/**
		 * Hide modal
		 * @param {string} modalId - Modal ID
		 */
		hide: function(modalId) {
			Funky.Modal.hide('#' + modalId);
		},

		/**
		 * Destroy a view modal instance and clean up
		 * @param {string} modalId - Modal ID
		 */
		destroy: function(modalId) {
			// Remove from instances registry
			if (this._instances[modalId]) {
				delete this._instances[modalId];
			}

			// Remove from configs
			if (configs[modalId]) {
				delete configs[modalId];
			}

			// Remove modal element from DOM
			var modal = document.getElementById(modalId);
			if (modal) {
				// Dispose Funky modal instance if exists
				var funkyModal = Funky.Modal.getInstance('#' + modalId);
				if (funkyModal) {
					funkyModal.dispose();
				}
				modal.remove();
			}

			console.log('[Funky.ViewModal] Destroyed:', modalId);
		},

		/**
		 * Set data for Bindable Interface - displays data in the view modal
		 * @param {string} modalId - Modal ID
		 * @param {object} data - Data to display
		 */
		setData: function(modalId, data) {
			var config = configs[modalId];
			if (!config) {
				console.error('[Funky.ViewModal] Config not found for:', modalId);
				return;
			}

			var modal = document.getElementById(modalId);
			if (!modal) {
				console.error('[Funky.ViewModal] Modal element not found:', modalId);
				return;
			}

			// Update stored data in instance
			if (this._instances[modalId]) {
				this._instances[modalId].data = data;
			}

			// Render the content with new data
			renderContent(modal, config, data);

			console.log('[Funky.ViewModal] setData:', modalId, data);
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
		 * Get instance by modal ID
		 * @param {string} modalId - Modal ID
		 * @returns {object|null}
		 */
		getInstance: function(modalId) {
			return this._instances[modalId] || null;
		},

		/**
		 * Destroy all view modal instances
		 */
		destroyAll: function() {
			var self = this;
			Object.keys(this._instances).forEach(function(modalId) {
				self.destroy(modalId);
			});
		}
	};

	// Register with Funky namespace
	Funky.register('ViewModal', ViewModal);

	console.log('[Funky.ViewModal] Initialized');

})(window);
