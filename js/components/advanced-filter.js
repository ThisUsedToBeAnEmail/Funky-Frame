/**
 * ============================================================================
 * Funky AdvancedFilter - Comprehensive filtering system
 * ============================================================================
 * Provides comprehensive filtering capabilities with:
 * - URL-based filter persistence
 * - Saved filter templates
 * - Session storage caching
 * - Keyboard shortcuts
 * - Mobile responsive UI
 * - Visual filter chips
 * 
 * Usage:
 *   var filter = Funky.AdvancedFilter.create(config);
 *   Funky.AdvancedFilter.init('#filterBtn', { entityType: 'trade', dataTable: dt });
 * 
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.AdvancedFilter] Registry not found. Load namespace.js first.');
		return;
	}

	/**
	 * AdvancedFilter Constructor
	 * @param {Object} config - Configuration object
	 * @param {string} config.context - Filter context (trade_filters, trade_action_filters)
	 * @param {string} config.optionsEndpoint - API endpoint for filter options
	 * @param {DataTable} config.dataTable - DataTables instance
	 * @param {Object} config.extraAjaxData - Reference to DataTable ajax data object
	 * @param {Array<string>} config.multiSelectFields - List of multi-select field names
	 * @param {Array<string>} config.rangeFields - List of range field names
	 * @param {Array<string>} config.dateFields - List of date field names
	 */

	/**
	 * Format a Date object for filter submission (YYYY-MM-DD HH:mm:ss)
	 * @param {Date} date
	 * @returns {string}
	 */
	function formatDateTimeForFilter(date) {
		if (!date) return '';
		var year = date.getFullYear();
		var month = String(date.getMonth() + 1).padStart(2, '0');
		var day = String(date.getDate()).padStart(2, '0');
		var hours = String(date.getHours()).padStart(2, '0');
		var minutes = String(date.getMinutes()).padStart(2, '0');
		var seconds = String(date.getSeconds()).padStart(2, '0');
		return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
	}

	function AdvancedFilter(config) {
		this.config = config;
		this.filterParams = {};
		this.dataTable = config.dataTable;
		this.existingFilters = config.existingFilters || {};
		this.filterOptionsCache = null;
		this.cacheTimestamp = null;
		this.cacheDuration = 5 * 60 * 1000; // 5 minutes
		
		// Set default savedFiltersEndpoint if not provided
		if (!this.config.savedFiltersEndpoint) {
			this.config.savedFiltersEndpoint = '/api/saved_filters';
		}

		// Initialize recent filters history using Funky.History
		var self = this;
		this.recentHistory = Funky.History.create({
			namespace: 'recent_filters_' + this.config.context,
			limit: 10,
			persist: true,
			comparator: function(a, b) {
				return JSON.stringify(a.params) === JSON.stringify(b.params);
			}
		});

		this.init();
	}
	
	/**
	 * Get the saved filters API endpoint URL
	 * @param {number} [id] - Optional filter ID for specific filter operations
	 * @returns {string} The full URL for the saved filters endpoint
	 */
	AdvancedFilter.prototype.getSavedFiltersUrl = function(id) {
		var baseUrl = this.config.savedFiltersEndpoint;
		
		// If using custom endpoint (like playground), don't add context param
		if (baseUrl !== '/api/saved_filters') {
			return id ? baseUrl + '/' + id : baseUrl;
		}
		
		// Default endpoint uses context as query param
		var url = baseUrl;
		if (id) {
			url += '/' + id;
		} else {
			url += '?context=' + this.config.context;
		}
		return url;
	};

	/**
	 * Initialize the advanced filter system
	 */
	AdvancedFilter.prototype.init = function() {
		var self = this;

		this.createFilterForm();
		this.bindKeyboardShortcuts();
		this.checkUrlHash();
		this.loadSavedFilters();
		this.loadRecentFilters();

		// Listen for hash changes (back/forward buttons, manual URL edits)
		window.addEventListener('hashchange', function() {
			self.handleHashChange();
		});

		// Listen for browser back/forward with pushState
		window.addEventListener('popstate', function(event) {
			if (event.state && event.state.filterHash) {
				self.loadFromHash(event.state.filterHash, false);
			}
		});
	};

	/**
	 * Create the filter form modal
	 */
	AdvancedFilter.prototype.createFilterForm = function() {
		var self = this;
		var D = Funky.Dom;

		// Check if modal already exists
		if (D.one('#advancedFilterModal').exists()) {
			return;
		}

		// Build modal using Funky.Dom
		
		var modal = D.div()
			.class('modal fade modal-slide-panel modal-slide-panel-lg')
			.id('advancedFilterModal')
			.attr('tabindex', '-1')
			.aria('labelledby', 'advancedFilterModalLabel')
			.aria('hidden', 'true')
			.child(
				D.div().class('modal-dialog modal-dialog-scrollable').child(
					D.div().class('modal-content').child(
						// Modal Header
						D.div().class('modal-header').child(
							D.create('h5').class('modal-title').id('advancedFilterModalLabel').child(
								D.icon('fas fa-filter'),
								D.text(' Advanced Filters')
							),
							D.button().attr('type', 'button').class('btn-close').data('funky-modal-close', '').aria('label', 'Close')
						),
						// Modal Body
						D.div().class('modal-body').child(
							// Loading State
							D.div().id('filterLoadingState').class('text-center py-5').child(
								D.div().class('spinner-border text-primary').attr('role', 'status').child(
									D.span().class('visually-hidden').text('Loading filter options...')
								),
								D.create('p').class('mt-3 text-muted').text('Loading filter options...')
							),
							// Filter Form Container
							D.div().id('filterFormContainer').style('display', 'none').child(
								// Saved Filters Section
								D.div().class('mb-4 border-bottom pb-3').attr('role', 'region').aria('labelledby', 'savedFiltersHeading').child(
									D.div().class('d-flex justify-content-between align-items-center mb-3').child(
										D.create('h6').class('mb-0').id('savedFiltersHeading').child(D.icon('fas fa-bookmark').aria('hidden', 'true'), D.text(' Saved Filters')),
										D.div().child(
											D.button().attr('type', 'button').class('btn btn-sm btn-outline-secondary').id('manageFiltersBtn').child(
												D.icon('fas fa-cog').aria('hidden', 'true'),
												D.text(' Manage')
											)
										)
									),
									D.div().id('savedFiltersList').class('d-flex flex-wrap gap-2').attr('role', 'list').aria('label', 'Saved filter templates')
								),
								// Active Filters Badge
								D.div().id('activeFiltersBadge').class('alert alert-info d-none mb-3').child(
									D.icon('fas fa-info-circle'),
									D.text(' '),
									D.create('strong').id('activeFiltersCount').text('0'),
									D.text(' filters applied'),
									D.button().attr('type', 'button').class('btn btn-sm btn-link float-end').id('viewActiveFiltersBtn').text('View')
								),
								// Search Box
								D.div().class('mb-3').child(
									D.div().class('field-input-group').child(
										D.span().class('field-input-group-text').aria('hidden', 'true').child(D.icon('fas fa-search')),
										D.input().attr('type', 'text').class('form-control').id('filterFieldSearch').attr('placeholder', 'Search filter fields...').aria('label', 'Search filter fields')
									)
								),
								// Filter Form
								D.create('form').id('advancedFilterForm').attr('role', 'search').aria('label', 'Filter options').child(
									// Multi-select Fields
									D.div().id('multiSelectContainer').class('row').attr('role', 'group').aria('labelledby', 'multiSelectHeading').child(
										D.div().class('col-12').child(
											D.create('h6').class('mb-3').id('multiSelectHeading').child(D.icon('fas fa-list').aria('hidden', 'true'), D.text(' Multi-Select Filters')),
											D.div().id('multiSelectFields').class('row')
										)
									),
									// Range Fields
									D.div().id('rangeContainer').class('row mt-3').attr('role', 'group').aria('labelledby', 'rangeHeading').child(
										D.div().class('col-12').child(
											D.create('h6').class('mb-3').id('rangeHeading').child(D.icon('fas fa-sliders-h').aria('hidden', 'true'), D.text(' Range Filters')),
											D.div().id('rangeFields').class('row')
										)
									),
									// Date Range Fields
									D.div().id('dateRangeContainer').class('row mt-3').attr('role', 'group').aria('labelledby', 'dateRangeHeading').child(
										D.div().class('col-12').child(
											D.create('h6').class('mb-3').id('dateRangeHeading').child(D.icon('fas fa-calendar').aria('hidden', 'true'), D.text(' Date Range Filters')),
											D.div().id('dateFields')
										)
									)
								)
							)
						),
						// Modal Footer
						D.div().class('modal-footer').child(
							D.div().class('flex-grow-1').child(
								D.button().attr('type', 'button').class('btn btn-outline-secondary').id('saveFilterBtn').child(
									D.icon('fas fa-save'),
									D.text(' Save Filter')
								)
							),
							D.button().attr('type', 'button').class('btn btn-secondary').id('clearFiltersBtn').child(
								D.icon('fas fa-times'),
								D.text(' Clear All')
							),
							D.button().attr('type', 'button').class('btn btn-primary').id('applyFiltersBtn').child(
								D.icon('fas fa-check'),
								D.text(' Apply Filters')
							)
						)
					)
				)
			).get();

		// Append to body
		document.body.appendChild(modal);

		// Bind events
		D.one('#applyFiltersBtn').on('click', function() {
			self.submitFilters();
		});

		D.one('#clearFiltersBtn').on('click', function() {
			self.resetFilters();
		});

		D.one('#saveFilterBtn').on('click', function() {
			self.openSaveFilterDialog();
		});

		D.one('#manageFiltersBtn').on('click', function() {
			Funky.CSRF.secureFetch(self.getSavedFiltersUrl())
				.then(function(response) { return response.json(); })
				.then(function(data) {
					self.openManageFiltersModal(data.filters || []);
				})
				.catch(function(error) {
					console.error('Failed to load saved filters:', error);
					if (Funky.Toast) {
						window.Funky.Toast.error('Failed to load saved filters', 'Error');
					}
				});
		});

		// Load filter options when modal is shown
		var modalEl = document.getElementById('advancedFilterModal');
		if (modalEl) {
			modalEl.addEventListener('funky.modal.shown', function() {
				self.loadFilterOptions();

				// Reset search field and show all filter fields when modal opens
				var searchField = D.one('#filterFieldSearch');
				if (searchField) searchField.el.value = '';
				D.all('#multiSelectFields .col-md-6, #rangeFields .col-md-6, #dateFields .col-md-6').show();
				D.all('#multiSelectContainer, #rangeContainer, #dateRangeContainer').show();

				// Fix z-index: ensure backdrop is below modal
				// Bootstrap creates backdrop dynamically and may have wrong z-index
				fixModalZIndex();
			});

			// Also fix on modal:show (before fully shown)
			modalEl.addEventListener('funky.modal.show', function() {
				// Use MutationObserver to catch when backdrop is added
				var observer = new MutationObserver(function(mutations) {
					mutations.forEach(function(mutation) {
						mutation.addedNodes.forEach(function(node) {
							if (node.classList && node.classList.contains('modal-backdrop')) {
								node.style.zIndex = '1040';
							}
						});
					});
				});

				observer.observe(document.body, { childList: true });

				// Disconnect after modal is shown
				setTimeout(function() {
					observer.disconnect();
					fixModalZIndex();
				}, 500);
			});
		}

		// Helper function to fix z-index
		function fixModalZIndex() {
			// Force z-index on all backdrops and modals
			document.querySelectorAll('.modal-backdrop').forEach(function(el) {
				el.style.setProperty('z-index', '1040', 'important');
			});
			var modal = document.getElementById('advancedFilterModal');
			if (modal) {
				modal.style.setProperty('z-index', '1050', 'important');
			}
		}

		// Field search functionality
		D.one('#filterFieldSearch').on('input', function() {
			const searchTerm = this.value.toLowerCase().trim();

			// If search is empty, show all fields
			if (!searchTerm) {
				D.all('#multiSelectFields .col-md-6, #rangeFields .col-md-6, #dateFields .col-md-6').show();
				D.all('#multiSelectContainer, #rangeContainer, #dateRangeContainer').show();
				return;
			}

			// Search through all field containers
			D.all('#multiSelectFields .col-md-6, #rangeFields .col-md-6, #dateFields .col-md-6').each(function() {
				var field = D.wrap(this);
				var labelEl = this.querySelector('label');
				var fieldLabel = labelEl ? labelEl.textContent.toLowerCase() : '';

				if (fieldLabel.includes(searchTerm)) {
					field.show();
				} else {
					field.hide();
				}
			});

			// Show/hide section headers if all fields are hidden
			var multiSelectVisible = document.querySelectorAll('#multiSelectFields .col-md-6:not([style*="display: none"])').length > 0;
			var rangeVisible = document.querySelectorAll('#rangeFields .col-md-6:not([style*="display: none"])').length > 0;
			var dateVisible = document.querySelectorAll('#dateFields .col-md-6:not([style*="display: none"])').length > 0;

			D.one('#multiSelectContainer').toggle(multiSelectVisible);
			D.one('#rangeContainer').toggle(rangeVisible);
			D.one('#dateRangeContainer').toggle(dateVisible);
		});

		// Detect form changes and clear hash to force new URL shortcut creation
		var modal = document.getElementById('advancedFilterModal');
		if (modal) {
			this._formChangeHandler = function(e) {
				if (e.target.matches('input, select, textarea')) {
					self.filterModified = true;
					self.currentSavedFilterId = null; // Clear saved filter ID when modified
					self.currentSavedFilterHash = null; // Clear saved filter hash when modified
					self.currentUrlShortcutId = null; // Clear URL shortcut ID when modified

					// Clear the URL hash since the form has been modified
					if (window.location.hash) {
						if (window.history && window.history.replaceState) {
							window.history.replaceState(null, '', window.location.pathname + window.location.search);
						} else {
							window.location.hash = '';
						}
					}
				}
			};
			modal.addEventListener('change', this._formChangeHandler);
		}
	};

	/**
	 * Bind keyboard shortcuts
	 */
	AdvancedFilter.prototype.bindKeyboardShortcuts = function() {
		var self = this;
		
		// Check if Funky.Keyboard is available
		if (typeof Funky !== 'undefined' && Funky.Keyboard) {
			this._registerKeyboardShortcuts();
			return;
		}
		
		// Fallback to native keydown
		this._useFallbackKeyboard = true;
		var D = Funky.Dom;

		// Document-level keyboard handler
		this._documentKeydownHandler = function(e) {
			// Ctrl/Cmd + F - Open advanced filters
			if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
				var modal = document.getElementById('advancedFilterModal');
				if (modal && !modal.classList.contains('show')) {
					e.preventDefault();
					Funky.Modal.show('#advancedFilterModal');
				}
			}

			// Ctrl/Cmd + Shift + C - Clear all filters
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
				e.preventDefault();
				self.resetFilters();
			}
		};
		document.addEventListener('keydown', this._documentKeydownHandler);

		// Modal-level keyboard and focus handlers
		var modal = document.getElementById('advancedFilterModal');
		if (modal) {
			this._modalKeydownHandler = function(e) {
				if (e.key === 'Enter' && !e.target.matches('textarea')) {
					e.preventDefault();
					self.submitFilters();
				}
			};
			modal.addEventListener('keydown', this._modalKeydownHandler);

			// Funky modal events (these are jQuery events dispatched by Funky.Modal)
			this._modalHiddenHandler = function() {
				var filterBtn = document.getElementById('advancedFilterBtn');
				if (filterBtn) filterBtn.focus();
			};
			modal.addEventListener('funky.modal.hidden', this._modalHiddenHandler);
		}
	};
	
	/**
	 * Register keyboard shortcuts with Funky.Keyboard
	 */
	AdvancedFilter.prototype._registerKeyboardShortcuts = function() {
		const self = this;
		
		this._keyboardUnregisters = [];
		
		// Ctrl/Cmd + F - Open advanced filters (global scope)
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'f',
				mod: true,
				scope: 'global',
				handler: function() {
					var modal = document.getElementById('advancedFilterModal');
					if (modal && !modal.classList.contains('show')) {
						Funky.Modal.show('#advancedFilterModal');
					}
				},
				description: 'Open advanced filters',
				group: 'Filters'
			})
		);
		
		// Ctrl/Cmd + Shift + C - Clear all filters (global scope)
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'c',
				mod: true,
				shift: true,
				scope: 'global',
				handler: function() {
					self.resetFilters();
				},
				description: 'Clear all filters',
				group: 'Filters'
			})
		);
		
		// Modal shown/hidden handlers for scope and Enter key
		var modalEl = document.getElementById('advancedFilterModal');
		if (modalEl) {
			modalEl.addEventListener('funky.modal.shown', function() {
				// Push modal scope
				Funky.Keyboard.pushScope('advanced-filter-modal');

				// Register Enter to apply (modal scope)
				self._enterUnregister = Funky.Keyboard.register({
					key: 'enter',
					scope: 'advanced-filter-modal',
					handler: function(e) {
						// Don't submit if in textarea
						if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
							return false; // Don't prevent default
						}
						self.submitFilters();
					},
					description: 'Apply filters',
					group: 'Filters'
				});
			});

			modalEl.addEventListener('funky.modal.hidden', function() {
				// Unregister Enter
				if (self._enterUnregister) {
					self._enterUnregister();
					self._enterUnregister = null;
				}

					// Pop modal scope
				Funky.Keyboard.popScope();

				// Return focus
				var filterBtn = document.getElementById('advancedFilterBtn');
				if (filterBtn) filterBtn.focus();
			});
		}
	};

	/**
	 * Load filter options from API with caching
	 */
	AdvancedFilter.prototype.loadFilterOptions = function(callback) {
		const self = this;

		// Check sessionStorage cache first
		const cacheKey = this.getCacheKey();
		const cached = sessionStorage.getItem(cacheKey);

		if (cached) {
			try {
				const data = JSON.parse(cached);
				if (Date.now() - data.timestamp < this.cacheDuration) {
					console.log('Using cached filter options');
					this.filterOptionsCache = data.options;
					this.cacheTimestamp = data.timestamp;
					this.populateFilterOptions(data.options);
					if (callback) callback(data.options);
					return;
				}
			} catch (e) {
				console.warn('Failed to parse cached filter options:', e);
				sessionStorage.removeItem(cacheKey);
			}
		}

		// Build URL with additional params for scoping
		var url = this.config.optionsEndpoint;

		// Add additional params if provided (date filters, etc.)
		if (this.config.additional_params && typeof this.config.additional_params === 'function') {
			var params = this.config.additional_params();
			var paramString = Object.keys(params)
				.map(function(key) { return key + '=' + encodeURIComponent(params[key]); })
				.join('&');
			if (paramString) {
				// Use & since optionsEndpoint already has ?entity=...
				url += '&' + paramString;
			}
		}

		Funky.CSRF.secureFetch(url)
			.then(function(response) { return response.json(); })
			.then(function(data) {
				console.log('Filter options response:', data);

				// Handle both direct response and wrapped response
				var filterData = data.data || data;

				// Cache the result in sessionStorage
				var cacheData = {
					options: filterData,
					timestamp: Date.now()
				};
				sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

				self.filterOptionsCache = filterData;
				self.cacheTimestamp = Date.now();
				self.populateFilterOptions(filterData);

				if (callback) callback(filterData);
			})
			.catch(function(error) {
				console.error('Failed to load filter options:', error);
				showErrorMessage('Failed to load filter options');
			});
	};

	/**
	 * Get cache key for sessionStorage
	 */
	AdvancedFilter.prototype.getCacheKey = function() {
		let cacheKeyBase = this.config.context;

		// Include additional params in cache key
		if (this.config.additional_params && typeof this.config.additional_params === 'function') {
			const params = this.config.additional_params();
			const paramStr = JSON.stringify(params);
			const paramHash = btoa(paramStr).substring(0, 20);
			cacheKeyBase += '_' + paramHash;
		}

		return `filter_options_${cacheKeyBase}`;
	};

	/**
	 * Invalidate the cache (call when data changes)
	 */
	AdvancedFilter.prototype.invalidateCache = function() {
		const cacheKey = this.getCacheKey();
		sessionStorage.removeItem(cacheKey);
		this.filterOptionsCache = null;
		this.cacheTimestamp = null;
	};

	/**
	 * Populate filter option dropdowns
	 */
	AdvancedFilter.prototype.populateFilterOptions = function(options) {
		const self = this;
		const D = Funky.Dom;

		// Hide loading, show form
		var loadingState = D.one('#filterLoadingState');
		var formContainer = D.one('#filterFormContainer');
		if (loadingState) {
			loadingState.el.style.display = 'none';
		}
		if (formContainer) {
			formContainer.el.style.display = '';
		}

		// Store options for later use
		this.filterOptions = options;

		// Store slider instances
		this.sliderInstances = {};

		// Update config with field arrays from API response
		this.config.multiSelectFields = options.multi_select_fields ? options.multi_select_fields.map(function(f) { return f.name; }) : [];
		this.config.rangeFields = options.range_fields ? options.range_fields.map(function(f) { return f.name; }) : [];
		this.config.dateFields = options.date_fields ? options.date_fields.map(function(f) { return f.name; }) : [];

		// Render multi-select fields
		var multiSelectContainer = D.one('#multiSelectFields');
		if (multiSelectContainer) multiSelectContainer.empty();

		if (options.multi_select_fields && options.multi_select_fields.length > 0) {
			options.multi_select_fields.forEach(function(field) {
				// Build options using Funky.Dom
				var selectEl = D.create('select')
					.class('form-select')
					.id('filter_' + field.name)
					.attr('name', field.name)
					.attr('multiple', 'multiple');
				
				field.options.forEach(function(opt) {
					var optText = opt.label + (opt.count != null ? ' (' + opt.count + ')' : '');
					selectEl.child(D.create('option').attr('value', opt.value).text(optText));
				});
				
				var fieldEl = D.div().class('col-md-6 mb-4').child(
					D.create('label')
						.class('form-label fw-semibold')
						.attr('for', 'filter_' + field.name)
						.child(
							D.text(self.getFieldLabel(field.name) + ' '),
							D.create('small').class('text-muted').text('(' + field.options.length + ' options)')
						),
					selectEl
				).get();
				
				if (multiSelectContainer) multiSelectContainer.el.appendChild(fieldEl);

				// Initialize ComboBox with multi-select mode
				var ComboBox = Funky.ComboBox;
				if (ComboBox) {
					var selectElement = document.getElementById('filter_' + field.name);
					ComboBox.init(selectElement, {
						mode: 'multi',
						placeholder: 'Select ' + self.getFieldLabel(field.name),
						clearable: true,
						dropdownParent: document.getElementById('advancedFilterModal'),
						scrollTags: true
					});
				}
			});
		} else {
			if (multiSelectContainer) multiSelectContainer.el.appendChild(D.create('p').class('text-muted fst-italic').text('No multi-select filters available').get());
		}

		// Render range fields with FunkySlider
		var rangeContainer = D.one('#rangeFields');
		if (rangeContainer) rangeContainer.empty();

		if (options.range_fields && options.range_fields.length > 0) {
			options.range_fields.forEach(function(field) {
				var fieldEl = D.div().class('col-md-6 mb-4').child(
					D.create('label').class('form-label fw-semibold').text(self.getFieldLabel(field.name)),
					D.div().class('range-filter-group').child(
						D.div().class('row g-2 mb-3').child(
							D.div().class('col-6').child(
								D.create('label').class('form-label small text-muted mb-1').text('Min'),
								D.input()
									.attr('type', 'number')
									.class('form-control form-control-sm range-input')
									.id('filter_' + field.name + '_min')
									.attr('name', field.name + '_min')
									.attr('placeholder', 'Minimum')
									.attr('step', 'any')
							),
							D.div().class('col-6').child(
								D.create('label').class('form-label small text-muted mb-1').text('Max'),
								D.input()
									.attr('type', 'number')
									.class('form-control form-control-sm range-input')
									.id('filter_' + field.name + '_max')
									.attr('name', field.name + '_max')
									.attr('placeholder', 'Maximum')
									.attr('step', 'any')
							)
						),
						D.div().class('funky-slider-container').id('slider_' + field.name)
					)
				).get();
				
				if (rangeContainer) rangeContainer.el.appendChild(fieldEl);

				// Initialize FunkySlider
				const sliderContainer = document.getElementById(`slider_${field.name}`);
				const minInput = document.getElementById(`filter_${field.name}_min`);
				const maxInput = document.getElementById(`filter_${field.name}_max`);

				const slider = Funky.Slider.create(sliderContainer, {
					min: 0,
					max: 1000000,
					step: 0.01,
					onUpdate: function(values) {
						minInput.value = values.min > 0 ? values.min : '';
						maxInput.value = values.max < 1000000 ? values.max : '';
					},
					formatValue: function(val) {
						if (val === 0 || val === 1000000) return '';
						return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
					}
				});

				// Store slider instance for later access
				self.sliderInstances[field.name] = slider;

				// Link inputs to slider
				minInput.addEventListener('input', function() {
					const val = parseFloat(this.value) || 0;
					slider.setValues(val, null);
				});

				maxInput.addEventListener('input', function() {
					const val = parseFloat(this.value) || 1000000;
					slider.setValues(null, val);
				});
			});
		} else {
			if (rangeContainer) rangeContainer.el.appendChild(D.create('p').class('text-muted fst-italic').text('No range filters available').get());
		}

		// Render date fields with Funky.DatePicker
		var dateContainer = D.one('#dateFields');
		if (dateContainer) dateContainer.empty();

		if (options.date_fields && options.date_fields.length > 0) {
			var rowEl = D.div().class('row');

			options.date_fields.forEach(function(field) {
				rowEl.child(
					D.div().class('col-md-6 mb-4').child(
						D.create('label').class('form-label fw-semibold').text(self.getFieldLabel(field.name)),
						D.div().class('date-range-group').child(
							D.input()
								.attr('type', 'text')
								.class('form-control funky-datepicker-filter')
								.id('filter_' + field.name + '_range')
								.attr('name', field.name + '_range')
								.attr('placeholder', 'Select date range')
								.attr('data-funky-datepicker', '')
								.attr('data-mode', 'range')
								.attr('data-time-picker', 'true')
								.attr('data-time-picker-24-hour', 'true')
								.attr('data-format', 'YYYY-MM-DD HH:mm')
								.attr('data-auto-apply', 'false'),
							D.input().attr('type', 'hidden').id('filter_' + field.name + '_from').attr('name', field.name + '_from'),
							D.input().attr('type', 'hidden').id('filter_' + field.name + '_to').attr('name', field.name + '_to')
						)
					)
				);
			});

			if (dateContainer) dateContainer.el.appendChild(rowEl.get());

			// Initialize Funky.DatePicker for each field
			options.date_fields.forEach(function(field) {
				var pickerEl = document.getElementById('filter_' + field.name + '_range');
				if (!pickerEl || !Funky.DatePicker) return;

				var picker = Funky.DatePicker.create(pickerEl, {
					mode: 'range',
					timePicker: true,
					timePicker24Hour: true,
					format: 'YYYY-MM-DD HH:mm',
					autoApply: false
				});

				// Store picker instance for later access
				if (!self._datePickerInstances) self._datePickerInstances = {};
				self._datePickerInstances[field.name] = picker;

				// Handle change event
				Funky.Events.on(pickerEl, 'funky.datepicker.change', function(e) {
					var value = e.detail.value;
					var fromEl = document.getElementById('filter_' + field.name + '_from');
					var toEl = document.getElementById('filter_' + field.name + '_to');

					if (value && value.start && value.end) {
						if (fromEl) fromEl.value = formatDateTimeForFilter(value.start);
						if (toEl) toEl.value = formatDateTimeForFilter(value.end);
					} else {
						if (fromEl) fromEl.value = '';
						if (toEl) toEl.value = '';
					}
				});

				// Handle clear via close without value
				Funky.Events.on(pickerEl, 'funky.datepicker.close', function(e) {
					var instance = Funky.DatePicker.getInstance(pickerEl);
					if (instance) {
						var value = instance.getValue();
						if (!value || !value.start) {
							var fromEl = document.getElementById('filter_' + field.name + '_from');
							var toEl = document.getElementById('filter_' + field.name + '_to');
							if (fromEl) fromEl.value = '';
							if (toEl) toEl.value = '';
						}
					}
				});
			});
		} else {
			if (dateContainer) dateContainer.el.appendChild(D.create('p').class('text-muted fst-italic').text('No date filters available').get());
		}

		// Apply any existing filter values
		self.applyExistingFilters();
	};

	/**
	 * Apply existing filter values to form fields
	 */
	AdvancedFilter.prototype.applyExistingFilters = function() {
		const self = this;

		// Get current filters from stored params
		const currentFilters = this.filterParams || {};

		// If we have stored params, use populateForm to properly set all fields
		if (Object.keys(currentFilters).length > 0) {
			this.populateForm(currentFilters);
		}
	};

	/**
	 * Open save filter dialog
	 */
	AdvancedFilter.prototype.openSaveFilterDialog = function() {
		const self = this;
		const formEl = document.getElementById('advancedFilterForm');
		const formData = new FormData(formEl);
		const params = this.serializeFilters(formData);

		// Check if any filters are set
		if (Object.keys(params).length === 0) {
			if (Funky.Toast) {
				window.Funky.Toast.warning('Please set at least one filter before saving', 'Validation');
			}
			return;
		}

		// If we already have a URL shortcut ID (from apply), use it
		if (self.currentUrlShortcutId && !self.filterModified) {
			self.showSaveFilterDialog(params, self.currentUrlShortcutId);
			return;
		}

		// Otherwise, create URL shortcut first, then save filter with the shortcut ID
		Funky.CSRF.secureFetch('/api/url_shortcuts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					context: self.config.context,
					params: params
				})
			})
			.then(response => response.json())
			.then(hashData => {
				// Track the new URL shortcut ID
				self.currentUrlShortcutId = hashData.id;
				self.currentUrlShortcutHash = hashData.hash;
				// Now show save dialog with the shortcut ID ready
				self.showSaveFilterDialog(params, hashData.id);
			})
			.catch(error => {
				console.error('Failed to create URL shortcut:', error);
				if (Funky.Toast) {
					window.Funky.Toast.error('Failed to prepare filter for saving', 'Error');
				}
			});
	};

	/**
	 * Show save filter dialog (after URL shortcut created)
	 */
	AdvancedFilter.prototype.showSaveFilterDialog = function(params, urlShortcutId) {
		const self = this;
		const D = Funky.Dom;

		const modalId = 'saveFilterModal';
		let modalEl = D.one('#' + modalId);

		if (!modalEl) {
			var modalDom = D.div()
				.class('modal fade modal-slide-panel')
				.id(modalId)
				.attr('tabindex', '-1')
				.aria('labelledby', modalId + 'Label')
				.aria('hidden', 'true')
				.child(
					D.div().class('modal-dialog').child(
						D.div().class('modal-content').child(
							D.div().class('modal-header').child(
								D.create('h5').class('modal-title').id(modalId + 'Label').child(
									D.icon('fas fa-save'),
									D.text(' Save Filter')
								),
								D.button().attr('type', 'button').class('btn-close').data('funky-modal-close', '').aria('label', 'Close')
							),
							D.div().class('modal-body').child(
								D.div().class('mb-3').child(
									D.create('label').class('form-label').attr('for', 'saveFilterName').text('Filter Name *'),
									D.input().attr('type', 'text').class('form-control').id('saveFilterName').attr('required', 'required').attr('placeholder', 'e.g., High Value Trades')
								),
								D.div().class('mb-3').child(
									D.create('label').class('form-label').attr('for', 'saveFilterDescription').text('Description (optional)'),
									D.create('textarea').class('form-control').id('saveFilterDescription').attr('rows', '2').attr('placeholder', 'Brief description of what this filter does')
								),
								D.div().class('form-check').child(
									D.input().class('form-check-input').attr('type', 'checkbox').id('saveFilterSetDefault'),
									D.create('label').class('form-check-label').attr('for', 'saveFilterSetDefault').text('Set as default filter')
								)
							),
							D.div().class('modal-footer').child(
								D.button().attr('type', 'button').class('btn btn-secondary').data('funky-modal-close', '').text('Cancel'),
								D.button().attr('type', 'button').class('btn btn-primary').id('confirmSaveFilterBtn').text('Save Filter')
							)
						)
					)
				).get();
			
			document.body.appendChild(modalDom);
			modalEl = D.one('#' + modalId);
		}

		// Reset form
		var nameEl = document.getElementById('saveFilterName');
		var descEl = document.getElementById('saveFilterDescription');
		var defaultEl = document.getElementById('saveFilterSetDefault');
		if (nameEl) nameEl.value = '';
		if (descEl) descEl.value = '';
		if (defaultEl) defaultEl.checked = false;

		// Show modal
		var modal = Funky.Modal.getOrCreateInstance(modalEl.el);
		modal.show();

		// Bind save button
		D.one('#confirmSaveFilterBtn').off('click').on('click', function() {
			const name = nameEl ? nameEl.value.trim() : '';
			const description = descEl ? descEl.value.trim() : '';
			const isDefault = defaultEl ? defaultEl.checked : false;

			if (!name) {
				if (Funky.Toast) {
					window.Funky.Toast.warning('Please enter a filter name', 'Validation');
				}
				if (nameEl) nameEl.focus();
				return;
			}

			// Save the filter (hash will be created on-demand when loaded)
			Funky.CSRF.secureFetch(self.getSavedFiltersUrl(), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: name,
						description: description,
						context: self.config.context,
						is_default: isDefault,
						params: params
					})
				})
				.then(response => response.json())
				.then(data => {
					modal.hide();
					if (Funky.Toast) {
						window.Funky.Toast.success('Filter saved successfully', 'Filter');
					}
					// Reload saved filters list
					self.loadSavedFilters();
					// Call onSave callback if provided
					if (typeof self.config.onSave === 'function') {
						self.config.onSave(data.filter || data);
					}
				})
				.catch(error => {
					console.error('Failed to save filter:', error);
					if (Funky.Toast) {
						window.Funky.Toast.error('Failed to save filter', 'Error');
					}
				});
		});
	};

	/**
	 * Load saved filters list
	 */
	AdvancedFilter.prototype.loadSavedFilters = function() {
		const self = this;

		Funky.CSRF.secureFetch(this.getSavedFiltersUrl())
			.then(response => response.json())
			.then(data => {
				self.populateSavedFiltersList(data.filters);

				// Auto-apply default filter if exists and no hash in URL
				const defaultFilter = data.filters.find(f => f.is_default);
				if (defaultFilter && !window.location.hash) {
					self.loadSavedFilter(defaultFilter.id, true); // true = auto-load, show notification
				}
			})
			.catch(error => {
				console.error('Failed to load saved filters:', error);
			});
	};

	/**
	 * Populate saved filters dropdown
	 */
	AdvancedFilter.prototype.populateSavedFiltersList = function(filters) {
		const D = Funky.Dom;
		const container = D.one('#savedFiltersList');
		if (!container) return;

		container.empty();

		if (!filters || filters.length === 0) {
			D.create('p').class('text-muted small').text('No saved filters yet').appendTo(container);
			return;
		}

		const self = this;
		
		filters.forEach(function(filter) {
			const badgeClass = filter.is_default ? 'bg-warning text-dark' : 'bg-secondary';
			
			var badgeEl = D.button()
				.class('badge ' + badgeClass + ' saved-filter-badge')
				.data('filter-id', filter.id)
				.attr('title', filter.description || 'Click to apply this filter');
			
			if (filter.is_default) {
				badgeEl.child(D.icon('fas fa-star me-1'));
			}
			badgeEl.child(D.text(filter.name));
			
			badgeEl.on('click', function() {
				const filterId = parseInt(this.dataset.filterId);
				self.loadSavedFilter(filterId, false);
			});

			container.el.appendChild(badgeEl.get());
		});
	};

	/**
	 * Open manage filters modal
	 */
	AdvancedFilter.prototype.openManageFiltersModal = function(filters) {
		const self = this;
		const D = Funky.Dom;

		// Create modal using Funky.Dom
		const modalId = 'manageFiltersModal';
		let modalWrapper = D.one('#' + modalId);

		if (!modalWrapper) {
			var modalEl = D.div()
				.class('modal fade modal-slide-panel')
				.id(modalId)
				.attr('tabindex', '-1')
				.aria('labelledby', modalId + 'Label')
				.aria('hidden', 'true')
				.child(
					D.div().class('modal-dialog').child(
						D.div().class('modal-content').child(
							D.div().class('modal-header').child(
								D.create('h5').class('modal-title').id(modalId + 'Label').child(
									D.icon('fas fa-cog'),
									D.text(' Manage Saved Filters')
								),
								D.button().attr('type', 'button').class('btn-close').data('funky-modal-close', '').aria('label', 'Close')
							),
							D.div().class('modal-body').child(
								D.div().id('manageFiltersContent')
							),
							D.div().class('modal-footer').child(
								D.button().attr('type', 'button').class('btn btn-secondary').data('funky-modal-close', '').text('Close')
							)
						)
					)
				).get();
			
			document.body.appendChild(modalEl);
			modalWrapper = D.one('#' + modalId);
		}

		// Show modal first, then populate content after it's visible
		var modal = Funky.Modal.getOrCreateInstance(modalWrapper.el);
		
		// Listen for modal shown event to render table when visible
		modalWrapper.el.addEventListener('funky.modal.shown', function onShown() {
			modalWrapper.el.removeEventListener('funky.modal.shown', onShown);
			self.renderManageFiltersList(filters);
		});
		
		modal.show();
	};

	/**
	 * Render the manage filters list
	 */
	AdvancedFilter.prototype.renderManageFiltersList = function(filters) {
		var self = this;
		var D = Funky.Dom;
		var content = D.one('#manageFiltersContent');

		if (!content) return;

		// Destroy existing table instance if any
		if (this._manageFiltersTable) {
			this._manageFiltersTable.destroy();
			this._manageFiltersTable = null;
		}

		if (!filters || filters.length === 0) {
			var emptyEl = D.div().class('text-center py-5').child(
				D.icon('fas fa-filter fa-3x text-muted mb-3'),
				D.create('p').class('text-muted').text('No saved filters yet. Create one by applying filters and clicking "Save as Template".')
			);
			content.empty();
			emptyEl.appendTo(content);
			return;
		}

		// Create container for Funky.Table
		content.empty();
		var tableContainer = D.div().id('manageFiltersTableContainer').appendTo(content);

		// Transform filters data for table
		var tableData = filters.map(function(filter) {
			var dateStr = Funky.Timezone ?
				window.Funky.Timezone.renderDate(filter.created_at, { dateOnly: true, showTZ: false }) :
				new Date(filter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
			
			return {
				id: filter.id,
				name: filter.name,
				description: filter.description || '',
				created_at: dateStr,
				is_default: filter.is_default
			};
		});

		// Create Funky.Table with responsive columns
		this._manageFiltersTable = Funky.Table.init(tableContainer.el, {
			data: tableData,
			idField: 'id',
			responsive: true,
			searching: false,
			paging: filters.length > 10,
			pageLength: 10,
			ordering: true,
			order: [[0, 'desc']],  // Default filters first
			striped: true,
			hover: true,
			compact: true,
			columns: [
				{
					data: 'is_default',
					title: 'Default',
					width: '70px',
					className: 'text-center',
					responsivePriority: 1,
					orderable: true,
					render: function(value, row) {
						var checked = value ? 'checked' : '';
						return '<div class="form-check d-flex justify-content-center m-0">' +
							'<input type="checkbox" class="form-check-input toggle-default-checkbox" ' +
							'data-filter-id="' + row.id + '" ' + checked + ' ' +
							'title="' + (value ? 'Remove as default' : 'Set as default') + '">' +
							'</div>';
					}
				},
				{
					data: 'name',
					title: 'Name',
					responsivePriority: 1,
					render: function(value, row) {
						var html = '<strong class="text-primary">' + self._escapeHtml(value) + '</strong>';
						if (row.is_default) {
							html += ' <span class="badge bg-warning text-dark"><i class="fas fa-star"></i></span>';
						}
						return html;
					}
				},
				{
					data: 'description',
					title: 'Description',
					responsivePriority: 4,
					render: function(value) {
						if (value) {
							return '<span class="text-muted">' + self._escapeHtml(value) + '</span>';
						}
						return '<em class="text-muted">No description</em>';
					}
				},
				{
					data: 'created_at',
					title: 'Created',
					responsivePriority: 3,
					render: function(value) {
						return '<small class="text-muted"><i class="far fa-calendar"></i> ' + value + '</small>';
					}
				}
			],
			contextMenu: {
				enabled: true,
				items: [
					{
						label: 'Edit',
						icon: 'fas fa-edit',
						action: function(row) {
							self.editSavedFilter(row.id, row.name, row.description);
						}
					},
					{
						label: row => row.is_default ? 'Remove as Default' : 'Set as Default',
						icon: 'fas fa-star',
						action: function(row) {
							self.toggleDefaultFilter(row.id, !row.is_default);
						}
					},
					{ type: 'divider' },
					{
						label: 'Delete',
						icon: 'fas fa-trash',
						className: 'text-danger',
						action: function(row) {
							self.deleteSavedFilter(row.id, row.name);
						}
					}
				]
			},
			buttons: {
				enabled: false
			}
		});

		// Bind checkbox change events using native event delegation
		tableContainer.el.addEventListener('change', function(e) {
			if (e.target.classList.contains('toggle-default-checkbox')) {
				var filterId = parseInt(e.target.dataset.filterId);
				var isChecked = e.target.checked;
				self.toggleDefaultFilter(filterId, isChecked);
			}
		});
	};

	/**
	 * Escape HTML for safe rendering
	 */
	AdvancedFilter.prototype._escapeHtml = function(text) {
		if (!text) return '';
		var div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	};

	/**
	 * Toggle default filter
	 */
	AdvancedFilter.prototype.toggleDefaultFilter = function(filterId, setAsDefault) {
		const self = this;

		Funky.CSRF.secureFetch(this.getSavedFiltersUrl(filterId), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_default: setAsDefault })
			})
			.then(response => response.json())
			.then(data => {
				if (Funky.Toast) {
					window.Funky.Toast.success(setAsDefault ? 'Set as default filter' : 'Removed as default filter');
				}
				// Reload the filters list
				self.loadSavedFilters();
				// Re-fetch and re-render the manage modal
				Funky.CSRF.secureFetch(self.getSavedFiltersUrl())
					.then(r => r.json())
					.then(d => self.renderManageFiltersList(d.filters));
			})
			.catch(error => {
				console.error('Failed to toggle default filter:', error);
				if (Funky.Toast) {
					window.Funky.Toast.error('Failed to update default filter');
				}
			});
	};

	/**
	 * Edit saved filter
	 */
	AdvancedFilter.prototype.editSavedFilter = function(filterId, currentName, currentDescription) {
		const self = this;
		const D = Funky.Dom;

		// Create edit modal
		const editModalId = 'editFilterModal';
		let editModalWrapper = D.one('#' + editModalId);

		if (!editModalWrapper) {
			var modalEl = D.div()
				.class('modal fade modal-slide-panel')
				.id(editModalId)
				.attr('tabindex', '-1')
				.aria('labelledby', editModalId + 'Label')
				.aria('hidden', 'true')
				.child(
					D.div().class('modal-dialog').child(
						D.div().class('modal-content').child(
							D.div().class('modal-header').child(
								D.create('h5').class('modal-title').id(editModalId + 'Label').child(
									D.icon('fas fa-edit'),
									D.text(' Edit Filter')
								),
								D.button().attr('type', 'button').class('btn-close').data('funky-modal-close', '').aria('label', 'Close')
							),
							D.div().class('modal-body').child(
								D.div().class('mb-3').child(
									D.create('label').class('form-label').attr('for', 'editFilterName').text('Filter Name'),
									D.input().attr('type', 'text').class('form-control').id('editFilterName').attr('required', 'required')
								),
								D.div().class('mb-3').child(
									D.create('label').class('form-label').attr('for', 'editFilterDescription').text('Description (optional)'),
									D.create('textarea').class('form-control').id('editFilterDescription').attr('rows', '2')
								)
							),
							D.div().class('modal-footer').child(
								D.button().attr('type', 'button').class('btn btn-secondary').data('funky-modal-close', '').text('Cancel'),
								D.button().attr('type', 'button').class('btn btn-primary').id('saveFilterEditBtn').text('Save Changes')
							)
						)
					)
				).get();
			
			document.body.appendChild(modalEl);
			editModalWrapper = D.one('#' + editModalId);
		}

		// Populate and show
		var nameInput = document.getElementById('editFilterName');
		var descInput = document.getElementById('editFilterDescription');
		if (nameInput) nameInput.value = currentName;
		if (descInput) descInput.value = currentDescription;

		var editModal = Funky.Modal.getOrCreateInstance(editModalWrapper.el);
		editModal.show();

		// Bind save button (remove old handlers first)
		D.one('#saveFilterEditBtn').off('click').on('click', function() {
			const newName = nameInput ? nameInput.value.trim() : '';
			const newDescription = descInput ? descInput.value.trim() : '';

			if (!newName) {
				if (Funky.Toast) {
					window.Funky.Toast.error('Filter name is required');
				}
				return;
			}

			Funky.CSRF.secureFetch(self.getSavedFiltersUrl(filterId), {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: newName,
						description: newDescription
					})
				})
				.then(response => response.json())
				.then(data => {
					if (Funky.Toast) {
						window.Funky.Toast.success('Filter updated successfully');
					}
					editModal.hide();
					// Reload the filters list
					self.loadSavedFilters();
					// Re-fetch and re-render the manage modal
					Funky.CSRF.secureFetch(self.getSavedFiltersUrl())
						.then(r => r.json())
						.then(d => self.renderManageFiltersList(d.filters));
				})
				.catch(error => {
					console.error('Failed to update filter:', error);
					if (Funky.Toast) {
						window.Funky.Toast.error('Failed to update filter');
					}
				});
		});
	};

	/**
	 * Delete saved filter
	 */
	AdvancedFilter.prototype.deleteSavedFilter = function(filterId, filterName) {
		const self = this;

		if (!confirm(`Are you sure you want to delete the filter "${filterName}"? This cannot be undone.`)) {
			return;
		}

		Funky.CSRF.secureFetch(self.getSavedFiltersUrl(filterId), {
				method: 'DELETE'
			})
			.then(response => response.json())
			.then(data => {
				if (Funky.Toast) {
					window.Funky.Toast.success('Filter deleted successfully');
				}
				// Reload the filters list
				self.loadSavedFilters();
				// Re-fetch and re-render the manage modal
				Funky.CSRF.secureFetch(self.getSavedFiltersUrl())
					.then(r => r.json())
					.then(d => {
						if (d.filters.length === 0) {
							// Close manage modal if no filters left
							Funky.Modal.hide('#manageFiltersModal');
						} else {
							self.renderManageFiltersList(d.filters);
						}
					});
			})
			.catch(error => {
				console.error('Failed to delete filter:', error);
				if (Funky.Toast) {
					window.Funky.Toast.error('Failed to delete filter');
				}
			});
	};

	/**
	 * Load a saved filter
	 */
	AdvancedFilter.prototype.loadSavedFilter = function(filterId, isAutoLoad) {
		const self = this;

		Funky.CSRF.secureFetch(this.getSavedFiltersUrl(filterId))
			.then(response => response.json())
			.then(data => {
				// Backend returns filter_hash (converted from url_shortcut_id via Bijection::XS)
				const filterHash = data.filter_hash;

				if (!filterHash) {
					throw new Error('No filter hash available');
				}

				// Populate the form
				self.populateForm(data.params);

				// Track that we've loaded a saved filter (to prevent creating new hash on apply)
				self.currentSavedFilterId = data.id;
				self.currentSavedFilterHash = filterHash;
				self.currentUrlShortcutId = data.url_shortcut_id; // Track the URL shortcut ID
				self.filterModified = false; // Reset modified flag

				// Apply filters using the hash
				self.applyFilters(data.params, filterHash);
				self.syncToPageFilters(data.params);

				// Update URL with the hash
				if (window.history && window.history.pushState) {
					const newUrl = window.location.pathname + window.location.search + '#' + filterHash;
					window.history.pushState({ filterHash: filterHash, context: self.config.context },
						'',
						newUrl
					);
				} else {
					window.location.hash = filterHash;
				}

				// Notify filter state change
				if (self.config.onFilterStateChange) {
					self.config.onFilterStateChange(self.hasActiveFilters());
				}

				return data;
			})
			.then(data => {

				if (isAutoLoad) {
					// Show info message for auto-loaded default filter
					if (Funky.Toast) {
						window.Funky.Toast.info(`Default filter '${data.name}' applied`, 'Auto-loaded');
					} else {
						console.info(`Default filter '${data.name}' applied`);
					}
				} else {
					// Show success message for manually loaded filter
					if (Funky.Toast) {
						window.Funky.Toast.success(`Loaded filter: ${data.name}`);
					} else if (typeof showSuccessMessage === 'function') {
						showSuccessMessage(`Loaded filter: ${data.name}`);
					}
				}
			})
			.catch(error => {
				console.error('Failed to load saved filter:', error);
				if (Funky.Toast) {
					window.Funky.Toast.error('Failed to load saved filter');
				} else if (typeof showErrorMessage === 'function') {
					showErrorMessage('Failed to load saved filter');
				}
			});
	};

	/**
	 * Save current filters as template
	 */
	AdvancedFilter.prototype.saveAsTemplate = function() {
		const self = this;
		var D = Funky.Dom;

		// Create save modal
		const saveModalId = 'saveFilterModal';
		var saveModalEl = document.getElementById(saveModalId);

		if (!saveModalEl) {
			var modalEl = D.div()
				.class('modal fade modal-slide-panel')
				.id(saveModalId)
				.attr('tabindex', '-1')
				.aria('labelledby', saveModalId + 'Label')
				.aria('hidden', 'true')
				.child(
					D.div().class('modal-dialog').child(
						D.div().class('modal-content').child(
							D.div().class('modal-header').child(
								D.create('h5').class('modal-title').id(saveModalId + 'Label').child(
									D.icon('fas fa-save'),
									D.text(' Save Filter')
								),
								D.button().attr('type', 'button').class('btn-close').data('funky-modal-close', '').aria('label', 'Close')
							),
							D.div().class('modal-body').child(
								D.div().class('mb-3').child(
									D.create('label').class('form-label').attr('for', 'saveFilterName').child(
										D.text('Filter Name '),
										D.span().class('text-danger').text('*')
									),
									D.input().attr('type', 'text').class('form-control').id('saveFilterName').attr('required', 'required').attr('placeholder', 'e.g., Active Repos')
								),
								D.div().class('mb-3').child(
									D.create('label').class('form-label').attr('for', 'saveFilterDescription').text('Description (optional)'),
									D.create('textarea').class('form-control').id('saveFilterDescription').attr('rows', '2').attr('placeholder', 'What does this filter show?')
								),
								D.div().class('form-check').child(
									D.input().class('form-check-input').attr('type', 'checkbox').id('saveFilterIsDefault'),
									D.create('label').class('form-check-label').attr('for', 'saveFilterIsDefault').text('Set as default filter'),
									D.create('small').class('form-text text-muted d-block').text('This filter will be automatically applied when you load the page')
								)
							),
							D.div().class('modal-footer').child(
								D.button().attr('type', 'button').class('btn btn-secondary').data('funky-modal-close', '').text('Cancel'),
								D.button().attr('type', 'button').class('btn btn-primary').id('confirmSaveFilterBtn').child(
									D.icon('fas fa-save'),
									D.text(' Save Filter')
								)
							)
						)
					)
				).get();
			
			document.body.appendChild(modalEl);
			$saveModal = document.getElementById(saveModalId);
		}

		// Reset form
		var nameInput = document.getElementById('saveFilterName');
		var descInput = document.getElementById('saveFilterDescription');
		var defaultCheckbox = document.getElementById('saveFilterIsDefault');
		if (nameInput) nameInput.value = '';
		if (descInput) descInput.value = '';
		if (defaultCheckbox) defaultCheckbox.checked = false;

		// Show modal
		var modalEl = $saveModal.nodeType ? $saveModal : $saveModal[0];
		var saveModal = Funky.Modal.getOrCreateInstance(modalEl);
		saveModal.show();

		// Focus name input after modal is shown
		modalEl.addEventListener('funky.modal.shown', function onShown() {
			var nameField = document.getElementById('saveFilterName');
			if (nameField) nameField.focus();
			modalEl.removeEventListener('funky.modal.shown', onShown);
		});

		// Bind save button (remove old handlers first)
		var confirmBtn = D.one('#confirmSaveFilterBtn');
		if (confirmBtn) {
			confirmBtn.off('click').on('click', function() {
				var nameEl = document.getElementById('saveFilterName');
				var descEl = document.getElementById('saveFilterDescription');
				var defaultEl = document.getElementById('saveFilterIsDefault');
				const name = nameEl ? nameEl.value.trim() : '';
				const description = descEl ? descEl.value.trim() : '';
				const isDefault = defaultEl ? defaultEl.checked : false;

				if (!name) {
					if (Funky.Toast) {
						window.Funky.Toast.error('Filter name is required');
					}
					if (nameEl) nameEl.focus();
					return;
				}

				const formData = new FormData(document.getElementById('advancedFilterForm'));
			const params = self.serializeFilters(formData);

			Funky.CSRF.secureFetch(self.getSavedFiltersUrl(), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						context: self.config.context,
						name: name,
						description: description,
						params: params,
						is_default: isDefault
					})
				})
				.then(response => response.json())
				.then(data => {
					if (Funky.Toast) {
						window.Funky.Toast.success('Filter saved successfully!');
					} else if (typeof showSuccessMessage === 'function') {
						showSuccessMessage('Filter saved successfully!');
					}
					saveModal.hide();
					self.loadSavedFilters(); // Reload list
					// Call onSave callback if provided
					if (typeof self.config.onSave === 'function') {
						self.config.onSave(data.filter || data);
					}
				})
				.catch(error => {
					console.error('Failed to save filter:', error);
					if (Funky.Toast) {
						window.Funky.Toast.error('Failed to save filter');
					} else if (typeof showErrorMessage === 'function') {
						showErrorMessage('Failed to save filter: ' + (error.message || 'Unknown error'));
					}
				});
			});
		}

		// Allow Enter key to submit
		var filterNameInput = D.one('#saveFilterName');
		if (filterNameInput) {
			filterNameInput.off('keypress').on('keypress', function(e) {
				if (e.which === 13) {
					e.preventDefault();
					var confirmBtnEl = document.getElementById('confirmSaveFilterBtn');
					if (confirmBtnEl) confirmBtnEl.click();
				}
			});
		}
	};

	/**
	 * Load recent filters from history
	 */
	AdvancedFilter.prototype.loadRecentFilters = function() {
		var recent = this.recentHistory.getAll();

		if (!recent || recent.length === 0) return;

		try {
			this.populateRecentFiltersList(recent);
		} catch (e) {
			console.warn('Failed to parse recent filters:', e);
		}
	};

	/**
	 * Populate recent filters dropdown
	 */
	AdvancedFilter.prototype.populateRecentFiltersList = function(recent) {
		const D = Funky.Dom;
		const dropdown = D.one('#recentFiltersDropdown');
		if (!dropdown) return;

		dropdown.empty();

		if (recent.length === 0) {
			D.create('li').child(
				D.span().class('dropdown-item text-muted').text('No recent filters')
			).appendTo(dropdown);
			return;
		}

		const self = this;
		recent.forEach(function(filter, index) {
			const timeAgo = moment(filter.timestamp).fromNow();
			D.create('li').child(
				D.a()
					.class('dropdown-item')
					.attr('href', '#')
					.data('recent-index', index)
					.child(
						D.text(filter.label),
						D.create('br'),
						D.create('small').class('text-muted').text(timeAgo)
					)
			).appendTo(dropdown);
		});

		// Bind click events
		D.all('#recentFiltersDropdown [data-recent-index]').on('click', function(e) {
			e.preventDefault();
			const index = parseInt(this.dataset.recentIndex, 10);
			self.applyRecentFilter(recent[index]);
		});
	};

	/**
	 * Apply a recent filter
	 */
	AdvancedFilter.prototype.applyRecentFilter = function(filter) {
		const self = this;

		// Populate form first
		this.populateForm(filter.params);

		// Create URL shortcut for the recent filter params
		Funky.CSRF.secureFetch('/api/url_shortcuts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					context: this.config.context,
					params: filter.params
				})
			})
			.then(response => response.json())
			.then(data => {
				// Update URL hash
				const newUrl = window.location.pathname + window.location.search + '#' + data.hash;
				if (window.history && window.history.pushState) {
					window.history.pushState({ filterHash: data.hash, context: self.config.context },
						'',
						newUrl
					);
				} else {
					window.location.hash = data.hash;
				}

				// Apply with hash
				self.applyFilters(filter.params, data.hash);
				self.syncToPageFilters(filter.params);
			})
			.catch(error => {
				console.error('Failed to create hash for recent filter:', error);
			});
	};

	/**
	 * Save to recent filters using Funky.History
	 */
	AdvancedFilter.prototype.saveToRecent = function(params, label) {
		var entry = {
			params: params,
			label: label || this.generateFilterLabel(params),
			timestamp: Date.now()
		};

		// History.add handles deduplication via comparator and LRU limit
		this.recentHistory.add(entry);
	};

	/**
	 * Clear all recent filters from history
	 */
	AdvancedFilter.prototype.clearRecentFilters = function() {
		this.recentHistory.clear();
		this.populateRecentFiltersList([]);
	};

	/**
	 * Generate a human-readable label for filters
	 */
	AdvancedFilter.prototype.generateFilterLabel = function(params) {
		const parts = [];
		const self = this;

		// Get first 2 significant filters for label
		this.config.multiSelectFields.forEach(field => {
			if (params[field] && params[field].length > 0 && parts.length < 2) {
				const label = self.getFieldLabel(field);
				const value = params[field].length === 1 ? params[field][0] : `${params[field].length} values`;
				parts.push(`${label}: ${value}`);
			}
		});

		this.config.rangeFields.forEach(field => {
			if ((params[field + '_min'] || params[field + '_max']) && parts.length < 2) {
				const label = self.getFieldLabel(field);
				const min = params[field + '_min'];
				const max = params[field + '_max'];
				const rangeText = min && max ? `${min}-${max}` : min ? `≥${min}` : `≤${max}`;
				parts.push(`${label}: ${rangeText}`);
			}
		});

		// Count total filters
		let count = 0;
		this.config.multiSelectFields.forEach(field => {
			if (params[field] && params[field].length > 0) count++;
		});
		this.config.rangeFields.forEach(field => {
			if (params[field + '_min'] || params[field + '_max']) count++;
		});

		if (count === 0) return 'All filters cleared';
		if (parts.length === 0) return `${count} filter${count > 1 ? 's' : ''} active`;

		const label = parts.join(', ');
		const more = count > parts.length ? ` +${count - parts.length} more` : '';
		return label + more;
	};

	/**
	 * Check URL hash on page load
	 */
	AdvancedFilter.prototype.checkUrlHash = function() {
		const hash = window.location.hash.substring(1);
		if (hash) {
			this.loadFromHash(hash, true);
		}
	};

	/**
	 * Load filters from URL hash
	 */
	AdvancedFilter.prototype.loadFromHash = function(hash, isInitialLoad) {
		const self = this;

		Funky.CSRF.secureFetch('/api/url_shortcuts/' + hash)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				return response.json();
			})
			.then(data => {
				// Validate context matches
				if (data.context !== self.config.context) {
					throw new Error(`Filter context mismatch: expected ${self.config.context}, got ${data.context}`);
				}

				// Store params to populate form when modal opens
				self.filterParams = data.params;

				// Clear the modified flag since we just loaded a saved filter
				self.filterModified = false;

				// Apply filters to DataTable
				self.applyFilters(data.params, hash);
				self.syncToPageFilters(data.params);

				// Notify filter state change
				if (self.config.onFilterStateChange) {
					self.config.onFilterStateChange(self.hasActiveFilters());
				}

				// Show notification based on load type
				if (isInitialLoad) {
					if (Funky.Toast) {
						window.Funky.Toast.info('Shared filter loaded from URL', 'Filter Applied');
					}
				} else {
					// Browser back/forward navigation
					if (Funky.Toast) {
						window.Funky.Toast.success('Filter restored from browser history');
					}
				}

				// Save to recent filters
				self.saveToRecent(data.params);
			})
			.catch(error => {
				console.error('Failed to load filter from hash:', error);
				self.handleInvalidHash(hash, error);
			});
	};

	/**
	 * Handle invalid or missing hash
	 */
	AdvancedFilter.prototype.handleInvalidHash = function(hash, error) {
		const self = this;

		// Remove invalid hash from URL
		if (window.history && window.history.replaceState) {
			window.history.replaceState(null, '', window.location.pathname + window.location.search);
		} else {
			window.location.hash = '';
		}

		// Show friendly error message
		const errorMsg = error.message.includes('404') ?
			'This shared filter link is invalid or has been deleted.' :
			'Unable to load the shared filter. Please try again.';

		if (Funky.Toast) {
			window.Funky.Toast.error(errorMsg, 'Invalid Filter Link', {
				timeout: 6000,
				buttons: [{
					text: 'Load Default Filter',
					onClick: function() {
						self.loadDefaultFilter();
					}
				}]
			});
		} else if (typeof showErrorMessage === 'function') {
			showErrorMessage(errorMsg);
		}

		console.warn(`Invalid hash: ${hash}`, error);
	};

	/**
	 * Load default filter if exists
	 */
	AdvancedFilter.prototype.loadDefaultFilter = function() {
		const self = this;

		Funky.CSRF.secureFetch(this.getSavedFiltersUrl())
			.then(response => response.json())
			.then(data => {
				const defaultFilter = data.filters.find(f => f.is_default);
				if (defaultFilter) {
					self.loadSavedFilter(defaultFilter.id);
				} else {
					// No default filter, clear all
					self.clearAllFilters();
				}
			})
			.catch(error => {
				console.error('Failed to load default filter:', error);
				self.clearAllFilters();
			});
	};

	/**
	 * Copy current filter URL to clipboard for sharing
	 */
	AdvancedFilter.prototype.copyFilterUrl = function() {
		const hash = window.location.hash.substring(1);

		if (!hash) {
			if (Funky.Toast) {
				window.Funky.Toast.warning('Please apply filters first to generate a shareable link');
			}
			return;
		}

		const fullUrl = window.location.origin + window.location.pathname + window.location.search + '#' + hash;

		// Modern clipboard API
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(fullUrl)
				.then(() => {
					if (Funky.Toast) {
						window.Funky.Toast.success('Filter URL copied to clipboard!', 'Ready to Share', {
							timeout: 3000
						});
					}
				})
				.catch(err => {
					console.error('Failed to copy URL:', err);
					this.fallbackCopyUrl(fullUrl);
				});
		} else {
			// Fallback for older browsers
			this.fallbackCopyUrl(fullUrl);
		}
	};

	/**
	 * Fallback copy method for older browsers
	 */
	AdvancedFilter.prototype.fallbackCopyUrl = function(url) {
		const temp = document.createElement('input');
		document.body.appendChild(temp);
		temp.value = url;
		temp.select();

		try {
			document.execCommand('copy');
			if (Funky.Toast) {
				window.Funky.Toast.success('Filter URL copied to clipboard!');
			}
		} catch (err) {
			console.error('Fallback copy failed:', err);
			// Show URL in prompt as last resort
			prompt('Copy this URL to share your filter:', url);
		}

		temp.remove();
	};

	/**
	 * Submit filters
	 */
	AdvancedFilter.prototype.submitFilters = function() {
		const self = this;
		const formData = new FormData(document.getElementById('advancedFilterForm'));
		const params = this.serializeFilters(formData);

		// Check if we're reapplying a saved filter that hasn't been modified
		if (self.currentSavedFilterId && self.currentSavedFilterHash && !self.filterModified) {
			// Reuse the saved filter's hash
			self.applyFilters(params, self.currentSavedFilterHash);
			self.syncToPageFilters(params);
			self.saveToRecent(params);

			// Notify filter state change
			if (self.config.onFilterStateChange) {
				self.config.onFilterStateChange(self.hasActiveFilters());
			}

			// Close modal
			Funky.Modal.hide('#advancedFilterModal');

			if (Funky.Toast) {
				window.Funky.Toast.success('Filters applied', 'Success');
			}

			return;
		}

		// Check if we're reapplying an existing hash filter (and form hasn't been modified)
		const currentHash = window.location.hash.substring(1);

		if (currentHash && !currentHash.startsWith('saved_') && !self.filterModified) {
			// Reuse existing hash instead of creating a new one
			self.applyFilters(params, currentHash);
			self.syncToPageFilters(params);
			self.saveToRecent(params);

			// Notify filter state change
			if (self.config.onFilterStateChange) {
				self.config.onFilterStateChange(self.hasActiveFilters());
			}

			// Close modal
			Funky.Modal.hide('#advancedFilterModal');

			if (Funky.Toast) {
				window.Funky.Toast.success('Filters applied', 'Success');
			}

			return;
		}

		// Clear the saved filter tracking and modified flag since we're creating a new hash
		self.currentSavedFilterId = null;
		self.currentSavedFilterHash = null;
		self.filterModified = false;

		// Save to URL shortcut API (create new hash for modified filters or new filters)
		Funky.CSRF.secureFetch('/api/url_shortcuts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					context: this.config.context,
					params: params
				})
			})
			.then(response => response.json())
			.then(data => {
				// Track the URL shortcut ID for potential saving
				self.currentUrlShortcutId = data.id;
				self.currentUrlShortcutHash = data.hash;

				// Update URL hash using pushState for better history management
				const newUrl = window.location.pathname + window.location.search + '#' + data.hash;

				if (window.history && window.history.pushState) {
					// Use pushState to add to browser history
					window.history.pushState({ filterHash: data.hash, context: self.config.context },
						'',
						newUrl
					);
				} else {
					// Fallback for older browsers
					window.location.hash = data.hash;
				}

				// Apply filters to DataTable using the hash
				self.applyFilters(params, data.hash);

				// Sync with existing page filters
				self.syncToPageFilters(params);

				// Save to recent filters
				self.saveToRecent(params);

				// Notify filter state change
				if (self.config.onFilterStateChange) {
					self.config.onFilterStateChange(self.hasActiveFilters());
				}

				// Close modal
				Funky.Modal.hide('#advancedFilterModal');

				if (Funky.Toast) {
					window.Funky.Toast.success('Filters applied and saved to URL', 'Success');
				} else if (typeof showSuccessMessage === 'function') {
					showSuccessMessage('Filters applied');
				}
			})
			.catch(error => {
				console.error('Failed to save filter shortcut:', error);
				// Cannot apply filters without hash - show error
				if (Funky.Toast) {
					window.Funky.Toast.error('Failed to apply filters. Please try again.', 'Error');
				} else if (typeof showErrorMessage === 'function') {
					showErrorMessage('Failed to apply filters');
				}
				Funky.Modal.hide('#advancedFilterModal');
			});
	};

	/**
	 * Check if there are active filters (via filter_hash)
	 */
	AdvancedFilter.prototype.hasActiveFilters = function() {
		return !!(this.config.extraAjaxData && this.config.extraAjaxData.filter_hash);
	};

	/**
	 * Apply filters to DataTable
	 */
	AdvancedFilter.prototype.applyFilters = function(params, filterHash) {
		console.log('applyFilters called with hash:', filterHash);

		// Store current filter params for form repopulation on reopen
		this.filterParams = params || {};

		// Clear previous filter params except page, limit, and sort
		for (let key in this.config.extraAjaxData) {
			if (key !== 'page' && key !== 'limit' && !key.startsWith('sort[')) {
				delete this.config.extraAjaxData[key];
			}
		}

		// Use filter hash for backend (hash-based parameter passing)
		if (filterHash) {
			this.config.extraAjaxData.filter_hash = filterHash;
			console.log('Set filter_hash in extraAjaxData:', this.config.extraAjaxData.filter_hash);
		}

		console.log('extraAjaxData:', this.config.extraAjaxData);

		// Reload DataTable if available
		if (this.dataTable && this.dataTable.ajax) {
			this.dataTable.ajax.reload(null, false); // false = don't reset pagination
		}

		// Update filter button highlight state
		this.updateFilterButtonState(params);

		// Update visual filter summary chips
		this.updateFilterChips(params);

		// Invalidate cache when new filters applied
		this.invalidateCache();

		// Announce filter application to screen readers
		var filterCount = this.countActiveFilters(params);
		if (filterCount > 0 && Funky.Announce) {
			Funky.Announce.polite(filterCount + ' filter' + (filterCount > 1 ? 's' : '') + ' applied. Table is updating.');
		}

		// Call onApply callback if provided
		if (typeof this.config.onApply === 'function') {
			this.config.onApply(params, filterHash);
		}
	};

	/**
	 * Update visual filter summary chips above table
	 */
	AdvancedFilter.prototype.updateFilterChips = function(params) {
		const D = Funky.Dom;
		const container = D.one('#filterChipsContainer');
		if (!container) return;

		container.empty();

		if (!this.hasActiveFilterFields(params)) {
			container.hide();
			return;
		}

		container.show();

		const self = this;

		// Add chip for each active filter
		this.config.multiSelectFields.forEach(function(field) {
			if (params[field] && params[field].length > 0) {
				const label = self.getFieldLabel(field);
				const values = params[field].slice(0, 3).join(', ');
				const moreText = params[field].length > 3 ? ` +${params[field].length - 3} more` : '';
				self.addFilterChip(field, `${label}: ${values}${moreText}`);
			}
		});

		this.config.rangeFields.forEach(function(field) {
			const min = params[field + '_min'];
			const max = params[field + '_max'];
			if (min || max) {
				const label = self.getFieldLabel(field);
				const rangeText = min && max ? `${min} - ${max}` : min ? `≥ ${min}` : `≤ ${max}`;
				self.addFilterChip(field, `${label}: ${rangeText}`);
			}
		});

		// Date filters
		if (this.config.dateFields) {
			this.config.dateFields.forEach(function(field) {
				const from = params[field + '_from'];
				const to = params[field + '_to'];
				if (from && to) {
					const label = self.getFieldLabel(field);
					const fromShort = moment(from).format('MMM D');
					const toShort = moment(to).format('MMM D');
					self.addFilterChip(field, `${label}: ${fromShort} to ${toShort}`);
				}
			});
		}
	};

	/**
	 * Add individual filter chip
	 */
	AdvancedFilter.prototype.addFilterChip = function(field, text) {
		const D = Funky.Dom;
		const self = this;

		// Create full text for tooltip (if truncated)
		const fullText = text.length > 40 ? text : '';
		const displayText = text.length > 40 ? text.substring(0, 37) + '...' : text;

		const chip = D.create('div')
			.classAdd('filter-chip')
			.attr('data-field', field)
			.attr('tabindex', '0')
			.attr('role', 'button')
			.attr('aria-label', text);
		
		if (fullText) chip.attr('title', fullText);
		
		// Build chip content with D.create()
		D.create('span').text(displayText).appendTo(chip);
		const removeBtn = D.create('button')
			.attr('type', 'button')
			.classAdd('filter-chip-remove')
			.attr('aria-label', 'Remove ' + self.getFieldLabel(field) + ' filter')
			.attr('tabindex', '0');
		D.create('i').classAdd('fas', 'fa-times').appendTo(removeBtn);
		removeBtn.appendTo(chip);

		// Click chip body to open advanced filter modal with focus on that field
		chip.on('click', function(e) {
			if (!e.target.closest('.filter-chip-remove')) {
				Funky.Modal.show('#advancedFilterModal');
				// Focus on the relevant field after modal opens
				setTimeout(function() {
					const fieldEl = document.querySelector(`select[name="${field}"], input[name="${field}_min"], input[name="${field}_range"]`);
					if (fieldEl) {
						fieldEl.focus();
						// Scroll field into view
						fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}, 300);
			}
		});

		// Keyboard support for chip click
		chip.on('keydown', function(e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (!e.target.closest('.filter-chip-remove')) {
					chip.el.click();
				}
			}
		});

		// Remove button click handler - use the removeBtn we already created
		removeBtn.on('click', function(e) {
			e.stopPropagation();
			self.removeFilter(field);
		});

		// Keyboard support for remove button
		removeBtn.on('keydown', function(e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				e.stopPropagation();
				self.removeFilter(field);
			}
		});

		var container = D.one('#filterChipsContainer');
		if (container) container.el.appendChild(chip.el);
	};

	/**
	 * Remove individual filter
	 */
	AdvancedFilter.prototype.removeFilter = function(field) {
		const self = this;
		const fieldLabel = this.getFieldLabel(field);

		// Remove from params
		const params = Object.assign({}, this.config.extraAjaxData);

		if (params[field]) {
			delete params[field];
		}
		if (params[field + '_min']) {
			delete params[field + '_min'];
		}
		if (params[field + '_max']) {
			delete params[field + '_max'];
		}
		if (params[field + '_from']) {
			delete params[field + '_from'];
		}
		if (params[field + '_to']) {
			delete params[field + '_to'];
		}

		// Remove filter_hash since params have changed
		delete params.filter_hash;

		// Check if any filters remain
		if (this.hasActiveFilterFields(params)) {
			// Create new URL shortcut for modified params
			Funky.CSRF.secureFetch('/api/url_shortcuts', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						context: this.config.context,
						params: params
					})
				})
				.then(response => response.json())
				.then(data => {
					// Update URL hash
					const newUrl = window.location.pathname + window.location.search + '#' + data.hash;
					if (window.history && window.history.pushState) {
						window.history.pushState({ filterHash: data.hash, context: self.config.context },
							'',
							newUrl
						);
					} else {
						window.location.hash = data.hash;
					}

					// Apply with new hash
					self.applyFilters(params, data.hash);
					self.populateForm(params);

					// Announce filter removal to screen readers
					if (Funky.Announce) {
						Funky.Announce.polite(fieldLabel + ' filter removed.');
					}
				})
				.catch(error => {
					console.error('Failed to create hash for modified filter:', error);
				});
		} else {
			// No filters left - clear everything
			self.clearAllFilters();

			// Announce to screen readers
			if (Funky.Announce) {
				Funky.Announce.polite(fieldLabel + ' filter removed. All filters cleared.');
			}
		}
	};

	/**
	 * Get human-readable field label
	 */
	AdvancedFilter.prototype.getFieldLabel = function(field) {
		const labels = {
			'trade_type': 'Trade Type',
			'is_active': 'Status',
			'status': 'Status',
			'quantity': 'Quantity',
			'trade_value': 'Trade Value',
			'updated_at': 'Updated',
			'created_at': 'Created',
			'trade_date': 'Trade Date',
			'closed_ind': 'Closed',
			'settlement_ind': 'Settlement',
			'is_settled': 'Settled'
		};

		return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	};

	/**
	 * Update advanced filter button visual state
	 */
	AdvancedFilter.prototype.updateFilterButtonState = function(params) {
		const D = Funky.Dom;
		const filterBtn = D.one('#advancedFilterBtn');
		if (!filterBtn || !filterBtn.el) return;

		// Check if any advanced filters are active
		const hasActiveFilters = this.hasActiveFilterFields(params);

		if (hasActiveFilters) {
			// Highlight button when filters active
			filterBtn.classAdd('active-filters')
				.attr('title', 'Advanced filters active - click to edit');

			// Add badge with filter count
			const filterCount = this.countActiveFilters(params);
			var badge = filterBtn.el.querySelector('.filter-count-badge');
			if (!badge) {
				const badgeEl = document.createElement('span');
				badgeEl.className = 'filter-count-badge';
				badgeEl.textContent = filterCount;
				filterBtn.el.appendChild(badgeEl);
			} else {
				badge.textContent = filterCount;
			}
		} else {
			// Remove highlight when no filters
			filterBtn.classRemove('active-filters')
				.attr('title', 'Advanced filters');
			var existingBadge = filterBtn.el.querySelector('.filter-count-badge');
			if (existingBadge) existingBadge.remove();
		}
	};

	/**
	 * Check if any advanced filters are active in params object
	 */
	AdvancedFilter.prototype.hasActiveFilterFields = function(params) {
		const self = this;

		// Check multi-select fields
		for (let i = 0; i < this.config.multiSelectFields.length; i++) {
			const field = this.config.multiSelectFields[i];
			if (params[field] && params[field].length > 0) return true;
		}

		// Check range fields
		for (let i = 0; i < this.config.rangeFields.length; i++) {
			const field = this.config.rangeFields[i];
			if (params[field + '_min'] || params[field + '_max']) return true;
		}

		// Check if multiple date columns are filtered
		if (this.config.dateFields) {
			let dateFilterCount = 0;
			for (let i = 0; i < this.config.dateFields.length; i++) {
				const field = this.config.dateFields[i];
				if (params[field + '_from'] && params[field + '_to']) {
					dateFilterCount++;
				}
			}
			if (dateFilterCount > 1) return true;
		}

		return false;
	};

	/**
	 * Count number of active filters
	 */
	AdvancedFilter.prototype.countActiveFilters = function(params) {
		let count = 0;

		// Count multi-select filters
		this.config.multiSelectFields.forEach(field => {
			if (params[field] && params[field].length > 0) count++;
		});

		// Count range filters
		this.config.rangeFields.forEach(field => {
			if (params[field + '_min'] || params[field + '_max']) count++;
		});

		// Count date filters (only if multiple columns)
		if (this.config.dateFields) {
			let dateFilterCount = 0;
			this.config.dateFields.forEach(field => {
				if (params[field + '_from'] && params[field + '_to']) {
					dateFilterCount++;
				}
			});
			if (dateFilterCount > 1) count += dateFilterCount;
		}

		return count;
	};

	/**
	 * Sync advanced filters to page-level filters
	 */
	AdvancedFilter.prototype.syncToPageFilters = function(params) {
		const D = Funky.Dom;
		
		// Check if multiple date columns are being filtered
		const hasMultipleDateFilters = this.hasMultipleDateFilters(params);

		if (hasMultipleDateFilters) {
			// Hide page-level date range picker when advanced filters have multiple date columns
			D.all('.funky-date-filter, .funky-date-range').hide();
		} else {
			// Show page-level date range picker
			D.all('.funky-date-filter, .funky-date-range').show();

			// Update date range picker (Funky.DatePicker or legacy daterangepicker)
			if (params.date_from && params.date_to) {
				var pickerEl = document.getElementById('dateRangeFilter');
				if (pickerEl && Funky.DatePicker) {
					var picker = Funky.DatePicker.getInstance(pickerEl);
					if (picker) {
						picker.setRange(new Date(params.date_from), new Date(params.date_to));
					}
				}
			}

			// Update date column selector
			if (params.date_column) {
				var dateColEl = document.getElementById('dateColumnFilter');
				if (dateColEl) {
					dateColEl.value = params.date_column;
					dateColEl.dispatchEvent(new Event('change', { bubbles: true }));
				}
			}
		}

		// Update client filter (if multi-select) - triggers change event on external client filter
		var clientIds = Array.isArray(params.client_id) ? params.client_id : (params.client_id ? [params.client_id] : []);
		if (clientIds && clientIds.length > 0) {
			var globalClientEl = document.getElementById('globalClientFilter');
			if (globalClientEl) {
				// For multi-select, need to set selected options
				this._setSelectValues(globalClientEl, clientIds);
			}
			var clientEl = document.getElementById('clientFilter');
			if (clientEl) {
				this._setSelectValues(clientEl, clientIds);
			}
		}
	};

	/**
	 * Helper to set select values and dispatch change event
	 * @private
	 */
	AdvancedFilter.prototype._setSelectValues = function(selectEl, values) {
		if (!selectEl) return;

		// Handle ComboBox instances
		var combo = Funky.ComboBox && Funky.ComboBox.getInstance(selectEl.id || selectEl);
		if (combo) {
			combo.setValue(values);
			return;
		}

		// Handle native select
		if (selectEl.multiple) {
			Array.from(selectEl.options).forEach(function(opt) {
				opt.selected = values.indexOf(opt.value) !== -1;
			});
		} else {
			selectEl.value = values[0] || '';
		}
		selectEl.dispatchEvent(new Event('change', { bubbles: true }));
	};

	/**
	 * Check if filtering on multiple date columns
	 */
	AdvancedFilter.prototype.hasMultipleDateFilters = function(params) {
		if (!this.config.dateFields) return false;

		let activeDateFilters = 0;
		this.config.dateFields.forEach(field => {
			const fromField = field + '_from';
			const toField = field + '_to';
			if (params[fromField] && params[toField]) {
				activeDateFilters++;
			}
		});

		return activeDateFilters > 1;
	};

	/**
	 * Serialize form to params object
	 */
	AdvancedFilter.prototype.serializeFilters = function(formData) {
		const params = {};

		// Multi-select fields
		this.config.multiSelectFields.forEach(field => {
			const values = formData.getAll(field);
			if (values.length > 0) {
				params[field] = values;
			}
		});

		// Range fields
		this.config.rangeFields.forEach(field => {
			const min = formData.get(field + '_min');
			const max = formData.get(field + '_max');
			if (min) params[field + '_min'] = parseFloat(min);
			if (max) params[field + '_max'] = parseFloat(max);
		});

		// Date fields - support multiple date columns with individual ranges
		if (this.config.dateFields) {
			this.config.dateFields.forEach(field => {
				const from = formData.get(field + '_from');
				const to = formData.get(field + '_to');
				if (from) params[field + '_from'] = from;
				if (to) params[field + '_to'] = to;
			});
		}

		return params;
	};

	/**
	 * Populate form from params
	 */
	AdvancedFilter.prototype.populateForm = function(params) {
		var self = this;
		var ComboBox = Funky.ComboBox;
		
		// Set ComboBox values for multi-select fields
		this.config.multiSelectFields.forEach(function(field) {
			var select = document.querySelector('select[name="' + field + '"]');
			if (select && params[field]) {
				var instance = ComboBox && ComboBox.getInstance(select);
				if (instance) {
					instance.setValue(params[field]);
				} else {
					// Fallback for elements not converted to ComboBox
					self._setSelectValues(select, Array.isArray(params[field]) ? params[field] : [params[field]]);
				}
			}
		});

		// Set range inputs and update sliders
		this.config.rangeFields.forEach(field => {
			const minVal = params[field + '_min'];
			const maxVal = params[field + '_max'];

			// Update inputs
			var minInput = document.querySelector(`input[name="${field}_min"]`);
			var maxInput = document.querySelector(`input[name="${field}_max"]`);
			if (minInput) minInput.value = minVal || '';
			if (maxInput) maxInput.value = maxVal || '';

			// Update slider instance directly
			if (this.sliderInstances && this.sliderInstances[field]) {
				const min = minVal ? parseFloat(minVal) : 0;
				const max = maxVal ? parseFloat(maxVal) : 1000000;
				this.sliderInstances[field].setValues(min, max);
			}
		});

		// Set date pickers (Funky.DatePicker or legacy daterangepicker)
		if (this.config.dateFields) {
			var self = this;
			this.config.dateFields.forEach(function(field) {
				var inputEl = document.querySelector('input[name="' + field + '_range"]');
				if (inputEl && params[field + '_from'] && params[field + '_to']) {
					var fromDate = params[field + '_from'];
					var toDate = params[field + '_to'];

					// Update hidden inputs
					var fromInput = document.querySelector('input[name="' + field + '_from"]');
					var toInput = document.querySelector('input[name="' + field + '_to"]');
					if (fromInput) fromInput.value = fromDate;
					if (toInput) toInput.value = toDate;

					// Update Funky.DatePicker if initialized
					if (Funky.DatePicker) {
						var picker = self._datePickerInstances && self._datePickerInstances[field];
						if (!picker) {
							picker = Funky.DatePicker.getInstance(inputEl);
						}
						if (picker) {
							picker.setRange(new Date(fromDate), new Date(toDate));
						}
					} else {
						// Fallback - just set input value
						inputEl.value = fromDate + ' - ' + toDate;
					}
				}
			});
		}
	};

	/**
	 * Reset all filters
	 */
	AdvancedFilter.prototype.resetFilters = function() {
		const D = Funky.Dom;
		
			// Clear all form fields
		var formEl = document.getElementById('advancedFilterForm');
		if (formEl) formEl.reset();
		
		// Clear ComboBox multi-select fields
		var ComboBox = Funky.ComboBox;
		if (ComboBox) {
			document.querySelectorAll('#advancedFilterForm select[multiple]').forEach(function(select) {
				var instance = ComboBox.getInstance(select);
				if (instance) {
					instance.clear();
				}
			});
		}

		// Clear the search box and show all filter fields
		var searchField = D.one('#filterFieldSearch');
		if (searchField) searchField.el.value = '';
		D.all('#multiSelectFields .col-md-6, #rangeFields .col-md-6, #dateFields .col-md-6').show();
		D.all('#multiSelectContainer, #rangeContainer, #dateRangeContainer').show();

		// Reset page-level filters
		this.resetPageFilters();

		// Remove URL hash
		window.location.hash = '';

		// Reset DataTable to defaults
		this.filterParams = {};

		// Show date range picker again
		D.all('.funky-date-filter, .funky-date-range').show();

		// Remove filter button highlight
		var filterBtn = D.one('#advancedFilterBtn');
		if (filterBtn && filterBtn.el) {
			filterBtn.classRemove('active-filters');
			var badge = filterBtn.el.querySelector('.filter-count-badge');
			if (badge) badge.remove();
		}

		// Clear URL hash
		if (window.history && window.history.replaceState) {
			window.history.replaceState(null, '', window.location.pathname + window.location.search);
		} else {
			window.location.hash = '';
		}

		// Apply empty filters (reload with defaults)
		this.applyFilters({});

		// Notify filter state change
		if (this.config.onFilterStateChange) {
			this.config.onFilterStateChange(this.hasActiveFilters());
		}

		// Call onReset callback if provided
		if (typeof this.config.onReset === 'function') {
			this.config.onReset();
		}

		// Announce to screen readers
		if (Funky.Announce) {
			Funky.Announce.polite('All filters cleared. Showing all results.');
		}

		if (Funky.Toast) {
			window.Funky.Toast.success('All filters cleared');
		} else if (typeof showSuccessMessage === 'function') {
			showSuccessMessage('All filters cleared');
		}
	};

	/**
	 * Reset all page-level filters to defaults
	 */
	AdvancedFilter.prototype.resetPageFilters = function() {
		// Call custom reset callback if provided
		if (this.config.onResetPageFilters && typeof this.config.onResetPageFilters === 'function') {
			this.config.onResetPageFilters();
			return;
		}

		// Default reset behavior - Today
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		var todayEnd = new Date();
		todayEnd.setHours(23, 59, 59, 999);

		// Update date range picker (Funky.DatePicker)
		var pickerEl = document.getElementById('dateRangeFilter');
		if (pickerEl && Funky.DatePicker) {
			var picker = Funky.DatePicker.getInstance(pickerEl);
			if (picker) {
				picker.setRange(today, todayEnd);
			}
		}

		// Reset date column
		var dateColEl = document.getElementById('dateColumnFilter');
		if (dateColEl) {
			dateColEl.value = 'updated_at';
			dateColEl.dispatchEvent(new Event('change', { bubbles: true }));
		}

		// Clear client filter (triggers change event on external client filter)
		var globalClientEl = document.getElementById('globalClientFilter');
		if (globalClientEl) {
			this._setSelectValues(globalClientEl, []);
		}

		// Clear search
		var globalSearch = document.getElementById('globalSearch');
		if (globalSearch) globalSearch.value = '';

		// Update extraAjaxData
		if (this.config.extraAjaxData) {
			this.config.extraAjaxData.date_column = 'updated_at';
			this.config.extraAjaxData.date_from = formatDateTimeForFilter(today);
			this.config.extraAjaxData.date_to = formatDateTimeForFilter(todayEnd);
			delete this.config.extraAjaxData.client_id;
			this.config.extraAjaxData.search = '';
		}
	};

	/**
	 * Cleanup and unbind events
	 */
	AdvancedFilter.prototype.destroy = function() {
		// Unregister Funky.Keyboard shortcuts
		if (this._keyboardUnregisters) {
			this._keyboardUnregisters.forEach(function(unregister) {
				if (typeof unregister === 'function') {
					unregister();
				}
			});
			this._keyboardUnregisters = null;
		}
		
		if (this._enterUnregister) {
			this._enterUnregister();
			this._enterUnregister = null;
		}
		
		// Fallback cleanup - remove native event listeners
		if (this._documentKeydownHandler) {
			document.removeEventListener('keydown', this._documentKeydownHandler);
			this._documentKeydownHandler = null;
		}

		var modal = document.getElementById('advancedFilterModal');
		if (modal) {
			if (this._modalKeydownHandler) {
				modal.removeEventListener('keydown', this._modalKeydownHandler);
				this._modalKeydownHandler = null;
			}
			if (this._modalHiddenHandler) {
				modal.removeEventListener('funky.modal.hidden', this._modalHiddenHandler);
				this._modalHiddenHandler = null;
			}
			if (this._modalShownHandler) {
				modal.removeEventListener('funky.modal.shown', this._modalShownHandler);
				this._modalShownHandler = null;
			}
			if (this._formChangeHandler) {
				modal.removeEventListener('change', this._formChangeHandler);
				this._formChangeHandler = null;
			}
		}

		// Remove hash change listener
		// Note: Can't remove specific listener without reference, but good to document
		// window.removeEventListener('hashchange', handlerRef);
		// window.removeEventListener('popstate', handlerRef);
	};

	/**
	 * Get human-readable label for field
	 */
	AdvancedFilter.prototype.getFieldLabel = function(field) {
		// Convert snake_case to Title Case
		return field
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	/**
	 * Set filter configuration (Bindable Interface)
	 * @param {Object} config - Filter configuration
	 * @param {Object} [config.filters] - Filter parameters to apply
	 * @param {boolean} [config.apply=false] - Whether to apply filters immediately
	 */
	AdvancedFilter.prototype.setData = function(config) {
		if (!config || typeof config !== 'object') {
			return;
		}

		// If filters are provided, set them
		if (config.filters && typeof config.filters === 'object') {
			var self = this;
			Object.keys(config.filters).forEach(function(key) {
				self.filterParams[key] = config.filters[key];
			});
		}

		// If apply flag is set, apply filters immediately
		if (config.apply) {
			this.submitFilters();
		}
	};

	/**
	 * Get current filter state (Bindable Interface)
	 * @returns {Object} - Current filter state
	 */
	AdvancedFilter.prototype.getData = function() {
		return {
			context: this.config.context,
			filters: JSON.parse(JSON.stringify(this.filterParams)),
			hasActiveFilters: Object.keys(this.filterParams).length > 0
		};
	};

	// Factory object for creating AdvancedFilter instances
	var AdvancedFilterFactory = {
		// Bindable Interface: Instance registry
		_instances: {},

		/**
		 * Create a new AdvancedFilter instance
		 * @param {Object} config - Configuration object
		 * @returns {AdvancedFilter}
		 */
		create: function(config) {
			var instance = new AdvancedFilter(config);
			// Register instance by context
			if (config.context) {
				AdvancedFilterFactory._instances[config.context] = instance;
			}
			return instance;
		},

		/**
		 * Initialize AdvancedFilter with a button trigger
		 * @param {string} buttonSelector - jQuery selector for trigger button
		 * @param {Object} config - Simplified configuration
		 * @param {string} config.entityType - Entity type ('trade', 'trade_action', or custom)
		 * @param {string} [config.optionsEndpoint] - Custom API endpoint for filter options (optional, defaults to /api/filter_options?entity=entityType)
		 * @param {string} [config.savedFiltersEndpoint] - Custom API endpoint for saved filters (optional, defaults to /api/saved_filters)
		 * @param {string} [config.context] - Filter context name for storage (optional, derived from entityType)
		 * @param {DataTable} [config.dataTable] - DataTables instance to filter
		 * @param {Function} [config.onApply] - Callback when filters are applied
		 * @param {Function} [config.onClear] - Callback when filters are cleared
		 * @returns {AdvancedFilter}
		 */
		init: function(buttonSelector, config) {
			// Determine context from entityType if not provided
			var context = config.context;
			if (!context) {
				if (config.entityType === 'trade') {
					context = 'trade_filters';
				} else if (config.entityType === 'trade_action') {
					context = 'trade_action_filters';
				} else {
					context = (config.entityType || 'default') + '_filters';
				}
			}
			
			// Allow custom optionsEndpoint or derive from entityType
			var optionsEndpoint = config.optionsEndpoint;
			if (!optionsEndpoint && config.entityType) {
				optionsEndpoint = '/api/filter_options?entity=' + config.entityType;
			}
			
			// Allow custom savedFiltersEndpoint or use default
			var savedFiltersEndpoint = config.savedFiltersEndpoint || '/api/saved_filters';
			
			// Convert from simple config to full AdvancedFilter config
			var fullConfig = {
				context: context,
				optionsEndpoint: optionsEndpoint,
				savedFiltersEndpoint: savedFiltersEndpoint,
				dataTable: config.dataTable || null,
				extraAjaxData: config.extraAjaxData || {},
				multiSelectFields: config.multiSelectFields || [],
				rangeFields: config.rangeFields || [],
				dateFields: config.dateFields || [],
				additional_params: config.additional_params || {},
				onApply: config.onApply,
				onClear: config.onClear,
				onFilterStateChange: config.onFilterStateChange
			};

			var instance = new AdvancedFilter(fullConfig);

			// Register instance by context for Bindable Interface
			if (context) {
				AdvancedFilterFactory._instances[context] = instance;
			}

			// Bind the button to open the modal
			// Use setTimeout(0) to ensure DOM is fully parsed after innerHTML
			setTimeout(function() {
				var D = Funky.Dom;
				var elements = D.all(buttonSelector);
				var count = elements && elements.elements ? elements.elements.length : 0;
				if (count > 0) {
					elements.on('click', function() {
						Funky.Modal.show('#advancedFilterModal');
					});
				} else {
					// Fallback: use event delegation on document
					document.addEventListener('click', function(e) {
						var target = e.target.closest(buttonSelector);
						if (target) {
							Funky.Modal.show('#advancedFilterModal');
						}
					});
				}
			}, 0);

			return instance;
		},

		/**
		 * Get filter instance by context (Bindable Interface)
		 * @param {string} context - Filter context
		 * @returns {AdvancedFilter|undefined}
		 */
		getInstance: function(context) {
			return this._instances[context];
		},

		/**
		 * Set filter configuration (Bindable Interface)
		 * @param {string} context - Filter context
		 * @param {Object} config - Filter configuration
		 * @param {Object} [config.filters] - Filter parameters to apply
		 * @param {boolean} [config.apply=false] - Whether to apply filters immediately
		 * @returns {boolean} - True if successful
		 */
		setData: function(context, config) {
			var instance = this._instances[context];
			if (!instance) {
				console.warn('[Funky.AdvancedFilter] setData: Instance not found:', context);
				return false;
			}
			instance.setData(config);
			return true;
		},

		/**
		 * Get current filter state (Bindable Interface)
		 * @param {string} context - Filter context
		 * @returns {Object|null} - Current filter state or null
		 */
		getData: function(context) {
			var instance = this._instances[context];
			if (!instance) {
				return null;
			}
			return instance.getData();
		},

		/**
		 * Destroy instance by context
		 * @param {string} context - Filter context
		 */
		destroy: function(context) {
			var instance = this._instances[context];
			if (instance) {
				instance.destroy();
				delete this._instances[context];
			}
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			var self = this;
			Object.keys(this._instances).forEach(function(context) {
				self.destroy(context);
			});
		},

		// Expose constructor for instanceof checks
		constructor: AdvancedFilter
	};

	// Register with Funky namespace
	Funky.register('AdvancedFilter', AdvancedFilterFactory);

})(window);
