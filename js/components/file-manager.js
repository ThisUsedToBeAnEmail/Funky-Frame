/**
 * Funky File Manager
 * Professional file management UI with grid/list views, preview, and batch operations
 * @module Funky.FileManager
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Funky.Dom shorthand
	var D = Funky.Dom;

	// Registry guard - prevent double registration
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('FileManager')) {
		return;
	}

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('FileManager');

	// ============================================================================
	// MIME Type Configuration
	// ============================================================================
	const MIME_CONFIG = {
		'application/pdf': { icon: '📄', label: 'PDF', color: '#dc3545', previewable: false },
		'text/csv': { icon: '📊', label: 'CSV', color: '#28a745', previewable: true },
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📈', label: 'Excel', color: '#217346', previewable: false },
		'application/vnd.ms-excel': { icon: '📈', label: 'Excel', color: '#217346', previewable: false },
		'application/json': { icon: '📋', label: 'JSON', color: '#ffc107', previewable: true },
		'text/xml': { icon: '📃', label: 'XML', color: '#17a2b8', previewable: true },
		'application/xml': { icon: '📃', label: 'XML', color: '#17a2b8', previewable: true },
		'text/plain': { icon: '📝', label: 'Text', color: '#6c757d', previewable: true },
		'image/png': { icon: '🖼️', label: 'PNG', color: '#e83e8c', previewable: true },
		'image/jpeg': { icon: '🖼️', label: 'JPEG', color: '#e83e8c', previewable: true },
		'application/zip': { icon: '📦', label: 'ZIP', color: '#795548', previewable: false },
		'default': { icon: '📁', label: 'File', color: '#6c757d', previewable: false }
	};

	const STATUS_CONFIG = {
		'pending': { badge: 'bg-warning', icon: '⏳', label: 'Pending' },
		'processing': { badge: 'bg-info', icon: '⚙️', label: 'Processing' },
		'completed': { badge: 'bg-success', icon: '✅', label: 'Completed' },
		'failed': { badge: 'bg-danger', icon: '❌', label: 'Failed' }
	};

	// ============================================================================
	// FileManager Constructor
	// ============================================================================
	function FileManager(config) {
		this.config = Object.assign({
			containerSelector: '#fileManagerContainer',
			gridSelector: '#filesGridView',
			listSelector: '#filesListView',
			statsSelector: '.stats-row',
			searchSelector: '#globalSearch',
			clientFilterSelector: '#clientFilter',
			statusFilterSelector: '#statusFilter',
			mimeFilterSelector: '#mimeFilter',
			dateRangeSelector: '#dateRangeFilter',
			viewToggleSelector: '[data-view]',
			apiBaseUrl: '/api/generated_files',
			pageLength: 24,
			enableSelection: true,
			enablePreview: true,
			enableBulkActions: true,
			demoMode: false,           // Skip API calls, use setData/setStats/setFilterOptions
			demoData: null,            // Initial demo files array
			demoStats: null,           // Initial demo stats object
			demoFilterOptions: null    // Initial demo filter options
		}, config);

		this.currentView = 'grid';
		this.selectedFiles = new Set();
		this.files = [];
		this.stats = {};
		this.filterOptions = {};
		this.currentPage = 1;
		this.totalPages = 1;
		this.total = 0;
		this.dataTable = null;
		this.extraAjaxData = {};
		this.isLoading = false;
		this.lastShiftClickIndex = -1;

		this.init();

		// Register instance
		var containerEl = Funky.Dom.one(this.config.containerSelector);
		var containerId = containerEl ? containerEl.attr('id') : null;
		if (containerId) {
			_instances.register(containerId, this);
		}
	}

	// ============================================================================
	// Utility Functions
	// ============================================================================
	FileManager.prototype.formatDate = function(dateStr) {
		if (!dateStr) return '-';
		if (Funky.Timezone) {
			return window.Funky.Timezone.renderDate(dateStr);
		}
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	FileManager.prototype.formatRelativeTime = function(dateStr) {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now - date;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 7) return this.formatDate(dateStr);
		if (days > 0) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
		if (hours > 0) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
		if (minutes > 0) return minutes + ' min' + (minutes > 1 ? 's' : '') + ' ago';
		return 'Just now';
	};

	FileManager.prototype.getMimeConfig = function(mimeType) {
		return MIME_CONFIG[mimeType] || MIME_CONFIG['default'];
	};

	FileManager.prototype.getStatusConfig = function(status) {
		return STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
	};

	// ============================================================================
	// Initialization
	// ============================================================================
	FileManager.prototype.init = function() {
		const self = this;

		// Demo mode - skip API calls, use provided data
		if (this.config.demoMode) {
			if (this.config.demoStats) {
				this.stats = this.config.demoStats;
				this.renderStats();
			}
			if (this.config.demoFilterOptions) {
				this.filterOptions = this.config.demoFilterOptions;
				this.populateFilterDropdowns();
			}
			if (this.config.demoData) {
				this.files = this.config.demoData;
				this.total = this.files.length;
				this.totalPages = Math.ceil(this.total / this.config.pageLength);
			}
		} else {
			// Load initial data from API
			this.loadStats();
			this.loadFilterOptions();
		}

		// Bind events
		this.bindViewToggle();
		this.bindSearch();
		this.bindFilters();
		this.bindKeyboardShortcuts();

		// Initialize based on current view
		if (this.config.demoMode) {
			// In demo mode, render directly without API call
			if (this.currentView === 'grid') {
				this.renderGridView();
			} else {
				this.initDataTable();
			}
		} else {
			if (this.currentView === 'grid') {
				this.loadGridView();
			} else {
				this.initDataTable();
			}
		}

		console.log('[FileManager] Initialized' + (this.config.demoMode ? ' (demo mode)' : ''));
	};

	// ============================================================================
	// View Toggle
	// ============================================================================
	FileManager.prototype.bindViewToggle = function() {
		const self = this;
		const D = Funky.Dom;

		D.all(this.config.viewToggleSelector).on('click', function() {
			const view = this.dataset.view;
			if (view === self.currentView) return;

			D.all(self.config.viewToggleSelector).classRemove('active');
			D.wrap(this).classAdd('active');

			self.currentView = view;
			self.selectedFiles.clear();
			self.updateBulkActionsBar();

			if (view === 'grid') {
				D.one(self.config.listSelector).classAdd('d-none');
				D.one(self.config.gridSelector).classRemove('d-none');
				if (self.config.demoMode) {
					self.renderGridView();
				} else {
					self.loadGridView();
				}
			} else {
				D.one(self.config.gridSelector).classAdd('d-none');
				D.one(self.config.listSelector).classRemove('d-none');
				self.initDataTable();
			}
		});
	};

	// ============================================================================
	// Stats Loading
	// ============================================================================
	FileManager.prototype.loadStats = function() {
		const self = this;
		const fetchFn = Funky.Api ? Funky.Api.fetch.bind(Funky.Api) : window.fetch;

		fetchFn(this.config.apiBaseUrl + '/stats')
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				self.stats = data;
				self.renderStats();
			})
			.catch(function(error) {
				console.error('[FileManager] Failed to load stats:', error);
			});
	};

	FileManager.prototype.renderStats = function() {
		var D = Funky.Dom;
		var totalFilesEl = D.one('#total-files');
		var totalSizeEl = D.one('#total-size');
		var filesTodayEl = D.one('#files-today');
		var downloadsEl = D.one('#downloads');

		if (totalFilesEl) totalFilesEl.text(this.stats.total_files || 0);
		if (totalSizeEl) totalSizeEl.text(Funky.Util.formatFileSize(this.stats.total_size));
		if (filesTodayEl) filesTodayEl.text(this.stats.files_today || 0);
		if (downloadsEl) downloadsEl.text(this.stats.total_downloads || 0);

		// Update status breakdown if container exists
		var statusContainer = document.getElementById('status-breakdown');
		if (statusContainer) {
			statusContainer.replaceChildren();
			Object.entries(this.stats.by_status || {}).forEach(function([status, count]) {
				const config = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
				statusContainer.appendChild(
					D.span().class('badge', config.badge, 'me-1')
						.child(D.raw(config.icon), ' ' + count + ' ' + config.label)
						.get()
				);
			});
		}
	};

	// Helper to recalculate stats from current files array (demo mode)
	FileManager.prototype.updateDemoStats = function() {
		var self = this;
		var totalSize = 0;
		var byStatus = {};

		this.files.forEach(function(file) {
			totalSize += file.file_size || 0;
			var status = file.status || 'available';
			byStatus[status] = (byStatus[status] || 0) + 1;
		});

		this.stats = {
			total_files: this.files.length,
			total_size: totalSize,
			files_today: this.files.filter(function(f) {
				var created = new Date(f.created_at);
				var today = new Date();
				return created.toDateString() === today.toDateString();
			}).length,
			total_downloads: this.stats.total_downloads || 0,
			by_status: byStatus
		};

		this.renderStats();
	};

	// ============================================================================
	// Filter Options Loading
	// ============================================================================
	FileManager.prototype.loadFilterOptions = function() {
		const self = this;
		const fetchFn = Funky.Api ? Funky.Api.fetch.bind(Funky.Api) : window.fetch;

		fetchFn(this.config.apiBaseUrl + '/filter_options')
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				self.filterOptions = data;
				self.populateFilterDropdowns();
			})
			.catch(function(error) {
				console.error('[FileManager] Failed to load filter options:', error);
			});
	};

	FileManager.prototype.populateFilterDropdowns = function() {
		var self = this;
		var ComboBox = Funky.ComboBox;

		// Populate and initialize mime type filter with ComboBox
		var mimeEl = document.querySelector(this.config.mimeFilterSelector);
		if (mimeEl && this.filterOptions.mime_types) {
			// Remove existing options except first
			while (mimeEl.options.length > 1) {
				mimeEl.remove(1);
			}
			
			this.filterOptions.mime_types.forEach(function(item) {
				var config = self.getMimeConfig(item.mime_type);
				var option = document.createElement('option');
				option.value = item.mime_type;
				option.textContent = config.icon + ' ' + config.label + ' (' + item.count + ')';
				mimeEl.appendChild(option);
			});

			// Initialize ComboBox if not already done
			if (ComboBox && !mimeEl.hasAttribute('data-combobox-initialized')) {
				ComboBox.init(mimeEl, {
					placeholder: 'All Types',
					clearable: true,
					searchable: true
				});
				mimeEl.setAttribute('data-combobox-initialized', 'true');
			}
		}

		// Populate and initialize status filter with ComboBox
		var statusEl = document.querySelector(this.config.statusFilterSelector);
		if (statusEl && this.filterOptions.statuses) {
			// Remove existing options except first
			while (statusEl.options.length > 1) {
				statusEl.remove(1);
			}
			
			this.filterOptions.statuses.forEach(function(item) {
				var config = self.getStatusConfig(item.generation_status);
				var option = document.createElement('option');
				option.value = item.generation_status;
				option.textContent = config.icon + ' ' + config.label + ' (' + item.count + ')';
				statusEl.appendChild(option);
			});

			// Initialize ComboBox if not already done
			if (ComboBox && !statusEl.hasAttribute('data-combobox-initialized')) {
				ComboBox.init(statusEl, {
					placeholder: 'All Statuses',
					clearable: true,
					searchable: true
				});
				statusEl.setAttribute('data-combobox-initialized', 'true');
			}
		}
	};

	// ============================================================================
	// Search Binding
	// ============================================================================
	FileManager.prototype.bindSearch = function() {
		const self = this;
		const D = Funky.Dom;
		let searchTimeout;

		D.one(this.config.searchSelector).on('input', function() {
			clearTimeout(searchTimeout);
			const value = this.value;

			searchTimeout = setTimeout(function() {
				self.extraAjaxData.search = value || undefined;
				self.refresh();
			}, 300);
		});
	};

	// ============================================================================
	// Filter Binding
	// ============================================================================
	FileManager.prototype.bindFilters = function() {
		const self = this;
		const D = Funky.Dom;

		// Client filter (using FunkyDataTables helper if available)
		var clientFilterEl = D.one(this.config.clientFilterSelector);
		if (Funky.DataTables && clientFilterEl) {
			Funky.DataTables.setupClientFilter(this.config.clientFilterSelector, null, this.extraAjaxData);
			D.one(this.config.clientFilterSelector).on('change', function() {
				self.refresh();
			});
		}

		// Status filter - ComboBox is initialized in populateFilterDropdowns
		var statusFilterEl = D.one(this.config.statusFilterSelector);
		if (statusFilterEl) {
			statusFilterEl.on('change', function() {
				const value = this.value;
				self.extraAjaxData.generation_status = value || undefined;
				self.refresh();
			});
		}

		// Mime type filter - ComboBox is initialized in populateFilterDropdowns
		var mimeFilterEl = D.one(this.config.mimeFilterSelector);
		if (mimeFilterEl) {
			mimeFilterEl.on('change', function() {
				const value = this.value;
				self.extraAjaxData.mime_type = value || undefined;
				self.refresh();
			});
		}

		// Date range filter - use Funky.DatePicker
		var dateRangeEl = D.one(this.config.dateRangeSelector);
		if (dateRangeEl && dateRangeEl.el && Funky.DatePicker) {
			var datePickerEl = dateRangeEl.el;
			this._dateRangePicker = Funky.DatePicker.create(datePickerEl, {
				mode: 'range',
				autoUpdateInput: false,
				showDropdowns: true,
				ranges: true,
				format: 'YYYY-MM-DD'
			});

			// Listen for date range selection
			if (datePickerEl) {
				Funky.Events.on(datePickerEl, 'funky.datepicker.change', function(e) {
					var detail = e.detail;
					if (detail && detail.value && detail.value.start && detail.value.end) {
						var start = detail.value.start;
						var end = detail.value.end;
						// Format dates
						var formatDate = function(d) {
							return d.getFullYear() + '-' +
								String(d.getMonth() + 1).padStart(2, '0') + '-' +
								String(d.getDate()).padStart(2, '0');
						};
						datePickerEl.value = formatDate(start) + ' - ' + formatDate(end);
						self.extraAjaxData.date_from = formatDate(start) + ' 00:00:00';
						self.extraAjaxData.date_to = formatDate(end) + ' 23:59:59';
						self.refresh();
					}
				});

				// Listen for clear/cancel
				Funky.Events.on(datePickerEl, 'funky.datepicker.clear', function() {
					datePickerEl.value = '';
					delete self.extraAjaxData.date_from;
					delete self.extraAjaxData.date_to;
					self.refresh();
				});
			}
		}
	};

	// ============================================================================
	// Keyboard Shortcuts
	// ============================================================================
	FileManager.prototype.bindKeyboardShortcuts = function() {
		const self = this;

		// Check if Funky.Keyboard is available
		if (typeof Funky !== 'undefined' && Funky.Keyboard) {
			this._registerKeyboardShortcuts();
			return;
		}
		
		// Fallback to native keydown
		this._useFallbackKeyboard = true;
		const D = Funky.Dom;

		this._keydownHandler = function(e) {
			const isInput = e.target.matches('input, textarea');
			// Ctrl/Cmd + A - Select all
			if ((e.ctrlKey || e.metaKey) && e.key === 'a' && self.currentView === 'grid') {
				if (!isInput) {
					e.preventDefault();
					self.selectAll();
				}
			}

			// Escape - Clear selection
			if (e.key === 'Escape') {
				self.clearSelection();
			}

			// Delete - Delete selected
			if (e.key === 'Delete' && self.selectedFiles.size > 0) {
				if (!isInput) {
					e.preventDefault();
					self.confirmBulkDelete();
				}
			}

			// G - Toggle grid view
			if (e.key === 'g' && !isInput) {
				var gridBtn = D.one('[data-view="grid"]');
				if (gridBtn) gridBtn.el.click();
			}

			// L - Toggle list view
			if (e.key === 'l' && !isInput) {
				var listBtn = D.one('[data-view="list"]');
				if (listBtn) listBtn.el.click();
			}
		};
		document.addEventListener('keydown', this._keydownHandler);
	};
	
	/**
	 * Register keyboard shortcuts with Funky.Keyboard
	 */
	FileManager.prototype._registerKeyboardShortcuts = function() {
		const self = this;
		
		this._keyboardUnregisters = [];
		
		// Ctrl/Cmd + A - Select all (grid view only)
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'a',
				mod: true,
				scope: 'global',
				handler: function() {
					if (self.currentView === 'grid') {
						self.selectAll();
					}
				},
				description: 'Select all files',
				group: 'File Manager'
			})
		);
		
		// Escape - Clear selection
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'escape',
				scope: 'global',
				handler: function() {
					self.clearSelection();
				},
				description: 'Clear selection',
				group: 'File Manager'
			})
		);
		
		// Delete - Delete selected
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'delete',
				scope: 'global',
				handler: function() {
					if (self.selectedFiles.size > 0) {
						self.confirmBulkDelete();
					}
				},
				description: 'Delete selected files',
				group: 'File Manager'
			})
		);
		
		// G - Grid view
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'g',
				scope: 'global',
				handler: function() {
					var gridBtn = Funky.Dom.one('[data-view="grid"]');
					if (gridBtn) gridBtn.el.click();
				},
				description: 'Switch to grid view',
				group: 'File Manager'
			})
		);
		
		// L - List view
		this._keyboardUnregisters.push(
			Funky.Keyboard.register({
				key: 'l',
				scope: 'global',
				handler: function() {
					var listBtn = Funky.Dom.one('[data-view="list"]');
					if (listBtn) listBtn.el.click();
				},
				description: 'Switch to list view',
				group: 'File Manager'
			})
		);
	};

	// ============================================================================
	// Grid View
	// ============================================================================
	FileManager.prototype.loadGridView = function() {
		const self = this;
		const D = Funky.Dom;

		if (this.isLoading) return;
		this.isLoading = true;

		const gridContainer = document.querySelector(this.config.gridSelector);
		gridContainer.replaceChildren(
			D.div().class('text-center', 'p-5').attr('role', 'status').attr('aria-live', 'polite').child(
				D.div().class('spinner-border', 'text-primary').aria('hidden', 'true'),
				D.p().class('mt-2').text('Loading files...')
			).get()
		);

		const params = Object.assign({
			page: this.currentPage,
			limit: this.config.pageLength
		}, this.extraAjaxData);

		// Clean undefined values
		Object.keys(params).forEach(function(key) {
			if (params[key] === undefined || params[key] === '') {
				delete params[key];
			}
		});

		const queryString = new URLSearchParams(params).toString();
		const fetchFn = Funky.Api ? Funky.Api.fetch.bind(Funky.Api) : window.fetch;

		fetchFn(this.config.apiBaseUrl + '?' + queryString)
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				self.files = data.generated_files || [];
				self.total = data.total || 0;
				self.totalPages = Math.ceil(self.total / self.config.pageLength);
				self.renderGridView();
				self.isLoading = false;
			})
			.catch(function(error) {
				console.error('[FileManager] Failed to load files:', error);
				gridContainer.replaceChildren(
					D.div().class('alert', 'alert-danger').attr('role', 'alert').child(
						D.icon('exclamation-triangle').aria('hidden', 'true'),
						' Failed to load files'
					).get()
				);
				self.isLoading = false;
			});
	};

	FileManager.prototype.renderGridView = function() {
		const self = this;
		const D = Funky.Dom;
		const containerEl = D.one(this.config.gridSelector);

		if (this.files.length === 0) {
			containerEl.el.replaceChildren(
				D.div().class('empty-state', 'text-center', 'p-5').attr('role', 'status').child(
					D.div().class('empty-icon', 'display-1', 'mb-3').aria('hidden', 'true').text('📂'),
					D.h4().text('No files found'),
					D.p().class('text-muted').text('Try adjusting your filters or generate some reports')
				).get()
			);
			return;
		}

		const gridContainer = D.div().class('file-grid').attr('role', 'list').aria('label', 'Files');

		this.files.forEach(function(file, index) {
			const mimeConfig = self.getMimeConfig(file.mime_type);
			const statusConfig = self.getStatusConfig(file.generation_status);
			const isSelected = self.selectedFiles.has(file.id);

			// Build file actions
			const actionsDiv = D.div().class('file-actions').attr('role', 'group').aria('label', 'Actions for ' + file.filename);
			if (file.generation_status === 'completed') {
				D.create('button')
					.classAdd('btn', 'btn-sm', 'btn-outline-primary', 'btn-download')
					.attr('data-file-id', file.id)
					.attr('title', 'Download')
					.aria('label', 'Download ' + file.filename)
					.child(D.create('i').classAdd('fas', 'fa-download').aria('hidden', 'true'))
					.appendTo(actionsDiv);
				if (mimeConfig.previewable && self.config.enablePreview) {
					D.create('button')
						.classAdd('btn', 'btn-sm', 'btn-outline-secondary', 'btn-preview')
						.attr('data-file-id', file.id)
						.attr('title', 'Preview')
						.aria('label', 'Preview ' + file.filename)
						.child(D.create('i').classAdd('fas', 'fa-eye').aria('hidden', 'true'))
						.appendTo(actionsDiv);
				}
			}
			D.create('button')
				.classAdd('btn', 'btn-sm', 'btn-outline-danger', 'btn-delete')
				.attr('data-file-id', file.id)
				.attr('title', 'Delete')
				.aria('label', 'Delete ' + file.filename)
				.child(D.create('i').classAdd('fas', 'fa-trash').aria('hidden', 'true'))
				.appendTo(actionsDiv);

			// Build file card
			const card = D.div().class('file-card').attr('role', 'listitem');
			if (isSelected) card.class('selected');
			card.attr('data-file-id', file.id)
				.attr('data-index', index)
				.attr('tabindex', '0')
				.aria('label', file.filename + ', ' + mimeConfig.label + ', ' + Funky.Util.formatFileSize(file.file_size));

			// Checkbox (only if selection is enabled)
			if (self.config.enableSelection) {
				const checkboxId = 'file-select-' + file.id;
				const checkbox = D.create('input')
					.classAdd('form-check-input')
					.attr('type', 'checkbox')
					.attr('id', checkboxId)
					.aria('label', 'Select ' + file.filename);
				if (isSelected) checkbox.el.checked = true;
				D.div().class('file-checkbox').child(checkbox).appendTo(card);
			}

			// Icon section (decorative)
			D.div().class('file-icon').style('color', mimeConfig.color).aria('hidden', 'true').child(
				D.create('span').classAdd('file-icon-emoji').text(mimeConfig.icon),
				D.create('span').classAdd('file-type-badge').text(mimeConfig.label)
			).appendTo(card);

			// Info section
			const infoDiv = D.div().class('file-info');
			D.div().class('file-name').attr('title', file.filename).text(file.filename).appendTo(infoDiv);
			D.div().class('file-meta').child(
				D.create('span').classAdd('file-size').text(Funky.Util.formatFileSize(file.file_size)),
				D.create('span').classAdd('file-date').text(self.formatRelativeTime(file.created_at))
			).appendTo(infoDiv);

			const statusDiv = D.div().class('file-status');
			D.create('span').classAdd('badge', statusConfig.badge).text(statusConfig.icon + ' ' + statusConfig.label).appendTo(statusDiv);
			if (file.download_count > 0) {
				const dlCount = D.create('span').classAdd('download-count').attr('title', 'Downloads');
				D.create('i').classAdd('fas', 'fa-download').aria('hidden', 'true').appendTo(dlCount);
				dlCount.el.appendChild(document.createTextNode(' ' + file.download_count));
				D.create('span').classAdd('visually-hidden').text(' downloads').appendTo(dlCount);
				dlCount.appendTo(statusDiv);
			}
			statusDiv.appendTo(infoDiv);
			infoDiv.appendTo(card);

			// Actions
			actionsDiv.appendTo(card);

			gridContainer.child(card);
		});

		// Clear and append grid
		containerEl.empty();
		containerEl.el.appendChild(gridContainer.el);

		// Add pagination
		if (this.totalPages > 1) {
			this.renderPaginationTo(containerEl);
		}

		// Bind click events using D.select
		D.all(containerEl.el.querySelectorAll('.file-card')).on('click', function(e) {
			if (e.target.matches('button, input, .btn, .btn *, .file-checkbox input')) return;

			const fileId = parseInt(this.dataset.fileId);
			const index = parseInt(this.dataset.index);

			if (e.shiftKey && self.lastShiftClickIndex >= 0) {
				// Shift+click: range select
				self.rangeSelect(self.lastShiftClickIndex, index);
			} else if (e.ctrlKey || e.metaKey) {
				// Ctrl/Cmd+click: toggle selection
				self.toggleSelection(fileId);
			} else {
				// Regular click: preview or select
				if (self.config.enablePreview) {
					const file = self.files.find(f => f.id === fileId);
					if (file && file.generation_status === 'completed') {
						self.previewFile(fileId);
					}
				}
			}

			self.lastShiftClickIndex = index;
		});

		// Checkbox click
		D.all(containerEl.el.querySelectorAll('.file-checkbox input')).on('click', function(e) {
			e.stopPropagation();
			const fileId = parseInt(this.closest('.file-card').dataset.fileId);
			self.toggleSelection(fileId);
		});

		// Action button clicks
		D.all(containerEl.el.querySelectorAll('.btn-download')).on('click', function(e) {
			e.stopPropagation();
			const fileId = parseInt(this.dataset.fileId);
			self.downloadFile(fileId);
		});

		D.all(containerEl.el.querySelectorAll('.btn-preview')).on('click', function(e) {
			e.stopPropagation();
			const fileId = parseInt(this.dataset.fileId);
			self.previewFile(fileId);
		});

		D.all(containerEl.el.querySelectorAll('.btn-delete')).on('click', function(e) {
			e.stopPropagation();
			const fileId = parseInt(this.dataset.fileId);
			self.confirmDeleteFile(fileId);
		});
	};

	FileManager.prototype.renderPagination = function() {
		const D = Funky.Dom;
		const nav = D.create('nav').classAdd('file-pagination', 'mt-4');
		const ul = D.create('ul').classAdd('pagination', 'justify-content-center');

		// Previous button
		const prevLi = D.create('li').classAdd('page-item');
		if (this.currentPage === 1) prevLi.classAdd('disabled');
		D.create('a').classAdd('page-link').attr('href', '#').attr('data-page', this.currentPage - 1).text('«').appendTo(prevLi);
		prevLi.appendTo(ul);

		// Page numbers
		const startPage = Math.max(1, this.currentPage - 2);
		const endPage = Math.min(this.totalPages, this.currentPage + 2);

		if (startPage > 1) {
			const firstLi = D.create('li').classAdd('page-item');
			D.create('a').classAdd('page-link').attr('href', '#').attr('data-page', '1').text('1').appendTo(firstLi);
			firstLi.appendTo(ul);
			if (startPage > 2) {
				const ellipsis = D.create('li').classAdd('page-item', 'disabled');
				D.create('span').classAdd('page-link').text('...').appendTo(ellipsis);
				ellipsis.appendTo(ul);
			}
		}

		for (let i = startPage; i <= endPage; i++) {
			const pageLi = D.create('li').classAdd('page-item');
			if (i === this.currentPage) pageLi.classAdd('active');
			D.create('a').classAdd('page-link').attr('href', '#').attr('data-page', i).text(String(i)).appendTo(pageLi);
			pageLi.appendTo(ul);
		}

		if (endPage < this.totalPages) {
			if (endPage < this.totalPages - 1) {
				const ellipsis = D.create('li').classAdd('page-item', 'disabled');
				D.create('span').classAdd('page-link').text('...').appendTo(ellipsis);
				ellipsis.appendTo(ul);
			}
			const lastLi = D.create('li').classAdd('page-item');
			D.create('a').classAdd('page-link').attr('href', '#').attr('data-page', this.totalPages).text(String(this.totalPages)).appendTo(lastLi);
			lastLi.appendTo(ul);
		}

		// Next button
		const nextLi = D.create('li').classAdd('page-item');
		if (this.currentPage === this.totalPages) nextLi.classAdd('disabled');
		D.create('a').classAdd('page-link').attr('href', '#').attr('data-page', this.currentPage + 1).text('»').appendTo(nextLi);
		nextLi.appendTo(ul);

		ul.appendTo(nav);

		// Add info text
		const start = (this.currentPage - 1) * this.config.pageLength + 1;
		const end = Math.min(this.currentPage * this.config.pageLength, this.total);
		const info = D.div().class('text-center', 'text-muted', 'small').text('Showing ' + start + '-' + end + ' of ' + this.total + ' files');

		// Return a document fragment with both elements
		const fragment = document.createDocumentFragment();
		fragment.appendChild(nav.el);
		fragment.appendChild(info.el);
		return fragment;
	};

	FileManager.prototype.renderPaginationTo = function(containerEl) {
		const self = this;
		const D = Funky.Dom;
		const paginationFragment = this.renderPagination();
		containerEl.el.appendChild(paginationFragment);

		// Bind pagination click events
		D.all(containerEl.el.querySelectorAll('.page-link[data-page]')).on('click', function(e) {
			e.preventDefault();
			const page = parseInt(this.dataset.page, 10);
			if (page >= 1 && page <= self.totalPages && page !== self.currentPage) {
				self.currentPage = page;
				self.loadFiles();
			}
		});
	};

	// ============================================================================
	// Selection Management
	// ============================================================================
	FileManager.prototype.toggleSelection = function(fileId) {
		if (this.selectedFiles.has(fileId)) {
			this.selectedFiles.delete(fileId);
		} else {
			this.selectedFiles.add(fileId);
		}
		this.updateSelectionUI();
		this.updateBulkActionsBar();
	};

	FileManager.prototype.selectAll = function() {
		const self = this;
		this.files.forEach(function(file) {
			self.selectedFiles.add(file.id);
		});
		this.updateSelectionUI();
		this.updateBulkActionsBar();
		if (Funky.Announce) Funky.Announce.polite('Selected ' + this.files.length + ' files');
	};

	FileManager.prototype.clearSelection = function() {
		this.selectedFiles.clear();
		this.updateSelectionUI();
		this.updateBulkActionsBar();
		if (Funky.Announce) Funky.Announce.polite('Selection cleared');
	};

	FileManager.prototype.rangeSelect = function(startIndex, endIndex) {
		const self = this;
		const minIndex = Math.min(startIndex, endIndex);
		const maxIndex = Math.max(startIndex, endIndex);

		for (let i = minIndex; i <= maxIndex; i++) {
			if (this.files[i]) {
				this.selectedFiles.add(this.files[i].id);
			}
		}

		this.updateSelectionUI();
		this.updateBulkActionsBar();
	};

	FileManager.prototype.updateSelectionUI = function() {
		const self = this;
		const D = Funky.Dom;
		D.one(this.config.gridSelector).find('.file-card').each(function() {
			const fileId = parseInt(this.dataset.fileId);
			const isSelected = self.selectedFiles.has(fileId);
			D.wrap(this).toggleClass('selected', isSelected);
			const checkbox = this.querySelector('.file-checkbox input');
			if (checkbox) checkbox.checked = isSelected;
		});
	};

	FileManager.prototype.updateBulkActionsBar = function() {
		const count = this.selectedFiles.size;
		const D = Funky.Dom;
		const bar = D.one('#bulkActionsBar');

		if (!bar) return;

		// Only show bulk actions bar if bulk actions are enabled and there are selections
		if (count > 0 && this.config.enableBulkActions) {
			var countEl = bar.find('.selected-count');
			if (countEl) countEl.text(count + ' file' + (count > 1 ? 's' : '') + ' selected');
			bar.classRemove('d-none');
			// Use simple display for slideDown effect
			bar.el.style.display = '';
		} else {
			bar.classAdd('d-none');
		}
	};

	// ============================================================================
	// DataTable (List View) - Using Funky.Table (jQuery-free)
	// ============================================================================
	FileManager.prototype.initDataTable = function() {
		var self = this;

		if (this.dataTable) {
			if (this.config.demoMode) {
				// In demo mode, just re-render with existing data
				this.dataTable.clear();
				this.dataTable.rows.add(this.files);
				this.dataTable.draw();
			} else {
				this.dataTable.reload();
			}
			return;
		}

		// Build column definitions (shared between demo and API modes)
		var columns = [];

		// Only add checkbox column if selection is enabled
		if (this.config.enableSelection) {
			columns.push({
				data: null,
				orderable: false,
				className: 'select-checkbox',
				render: function(data) {
					return '<input type="checkbox" class="form-check-input file-select" data-id="' + data.id + '">';
				}
			});
		}

		columns.push(
			{
				data: 'filename',
				render: function(data, type, row) {
					var config = self.getMimeConfig(row.mime_type);
					return '<span class="file-icon-small" style="color: ' + config.color + '">' + config.icon + '</span> ' +
						'<span class="fw-bold">' + Funky.Util.escapeHtml(data) + '</span>';
				}
			},
			{
				data: 'mime_type',
				render: function(data) {
					var config = self.getMimeConfig(data);
					return '<span class="badge bg-secondary">' + config.label + '</span>';
				}
			},
			{
				data: 'file_size',
				render: function(data) {
					return Funky.Util.formatFileSize(data);
				}
			},
			{
				data: 'generation_status',
				render: function(data) {
					var config = self.getStatusConfig(data);
					return '<span class="badge ' + config.badge + '">' + config.icon + ' ' + config.label + '</span>';
				}
			},
			{
				data: 'download_count',
				render: function(data) {
					return data > 0 ? '<i class="fas fa-download text-muted"></i> ' + data : '-';
				}
			},
			{
				data: 'created_at',
				render: function(data) {
					return self.formatRelativeTime(data);
				}
			},
			{
				data: null,
				orderable: false,
				render: function(data) {
					var mimeConfig = self.getMimeConfig(data.mime_type);
					var actions = '';

					if (data.generation_status === 'completed') {
						actions += '<button class="btn btn-sm btn-outline-primary me-1" onclick="fileManager.downloadFile(' + data.id + ')" title="Download"><i class="fas fa-download"></i></button>';
						if (mimeConfig.previewable && self.config.enablePreview) {
							actions += '<button class="btn btn-sm btn-outline-secondary me-1" onclick="fileManager.previewFile(' + data.id + ')" title="Preview"><i class="fas fa-eye"></i></button>';
						}
					}
					actions += '<button class="btn btn-sm btn-outline-danger" onclick="fileManager.confirmDeleteFile(' + data.id + ')" title="Delete"><i class="fas fa-trash"></i></button>';

					return '<div class="btn-group">' + actions + '</div>';
				}
			}
		);

		// Build table config - demo mode uses client-side data, API mode uses server-side
		// Date column index varies based on whether checkbox column is present
		var dateColumnIndex = this.config.enableSelection ? 6 : 5;
		var tableConfig = {
			processing: true,
			columns: columns,
			pageLength: 25,
			lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
			order: [[dateColumnIndex, 'desc']],
			emptyMessage: '📂 No files found',
			noMatchMessage: '🔍 No matching files'
		};

		if (this.config.demoMode) {
			// Demo mode - use client-side data
			tableConfig.serverSide = false;
			tableConfig.data = this.files;
		} else {
			// API mode - use server-side processing
			tableConfig.serverSide = true;
			tableConfig.ajax = {
				url: this.config.apiBaseUrl,
				method: 'GET'
			};
			tableConfig.extraAjaxData = this.extraAjaxData;
			tableConfig.dataSrc = function(json) {
				return json.generated_files || [];
			};
			tableConfig.updateStats = function(json) {
				return {
					recordsTotal: json.total || 0,
					recordsFiltered: json.total || 0
				};
			};
		}

		this.dataTable = Funky.Table.init(this.config.listSelector + ' table', tableConfig);

		// Bind checkbox selection in list view
		D.one(this.config.listSelector).on('change', '.file-select', function() {
			var fileId = parseInt(this.dataset.id);
			self.toggleSelection(fileId);
		});
	};

	// ============================================================================
	// File Actions
	// ============================================================================
	FileManager.prototype.downloadFile = function(fileId) {
		// Demo mode: show info toast instead of actual download
		if (this.config.demoMode) {
			const file = this.files.find(function(f) { return f.id === fileId; });
			if (Funky.Toast) {
				Funky.Toast.info('Demo mode: Download triggered for ' + (file ? file.filename : 'file #' + fileId));
			}
			return;
		}
		window.location.href = this.config.apiBaseUrl + '/' + fileId + '/download';
	};

	FileManager.prototype.previewFile = function(fileId) {
		const self = this;

		// Show loading modal
		const modal = this.getPreviewModal();
		modal.find('.modal-title').text('Loading preview...');
		modal.find('.preview-content').html('<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>');
		modal.find('.preview-metadata').html('');
		Funky.Modal.show('#filePreviewModal');

		// Demo mode: generate mock preview content
		if (this.config.demoMode) {
			const file = this.files.find(function(f) { return f.id === fileId; });
			if (file) {
				const previewData = this.generateDemoPreview(file);
				setTimeout(function() {
					self.renderPreview(previewData);
				}, 300); // Simulate network delay
			} else {
				modal.find('.modal-title').text('Preview unavailable');
				modal.find('.preview-content').html(
					'<div class="alert alert-warning">' +
					'<i class="fas fa-exclamation-triangle"></i> File not found in demo data' +
					'</div>'
				);
			}
			return;
		}

		const fetchFn = Funky.Api ? Funky.Api.fetch.bind(Funky.Api) : window.fetch;

		fetchFn(this.config.apiBaseUrl + '/' + fileId + '/preview')
			.then(function(response) {
				if (!response.ok) {
					return response.json().then(function(err) {
						throw err;
					});
				}
				return response.json();
			})
			.then(function(data) {
				self.renderPreview(data);
			})
			.catch(function(error) {
				const errorMsg = error.error || 'Failed to load preview';
				modal.find('.modal-title').text('Preview unavailable');
				modal.find('.preview-content').html(
					'<div class="alert alert-warning">' +
					'<i class="fas fa-exclamation-triangle"></i> ' + Funky.Util.escapeHtml(errorMsg) +
					(error.download_url ? '<br><a href="' + error.download_url + '" class="btn btn-primary mt-2"><i class="fas fa-download"></i> Download instead</a>' : '') +
					'</div>'
				);
			});
	};

	FileManager.prototype.generateDemoPreview = function(file) {
		const demoContents = {
			'application/json': JSON.stringify({
				"report_id": file.id,
				"generated_at": file.created_at,
				"data": {
					"summary": "This is demo preview content for " + file.filename,
					"records": 1250,
					"status": "complete"
				},
				"metadata": {
					"version": "1.0",
					"format": "json"
				}
			}, null, 2),
			'text/csv': 'id,name,value,date\n1,Item A,100.50,2024-01-15\n2,Item B,250.75,2024-01-16\n3,Item C,175.25,2024-01-17\n4,Item D,320.00,2024-01-18\n5,Item E,89.99,2024-01-19',
			'text/plain': 'Demo preview content for ' + file.filename + '\n\nThis is a sample text file preview.\nGenerated for demonstration purposes.\n\nLine 4 of content\nLine 5 of content',
			'application/pdf': '[PDF Preview - Binary content cannot be displayed as text]\n\nFile: ' + file.filename + '\nSize: ' + Funky.Util.formatFileSize(file.file_size),
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '[Excel Preview - Binary content cannot be displayed as text]\n\nFile: ' + file.filename + '\nSize: ' + Funky.Util.formatFileSize(file.file_size)
		};

		const content = demoContents[file.mime_type] || 'Preview content for: ' + file.filename + '\n\nMIME Type: ' + file.mime_type;

		return {
			id: file.id,
			filename: file.filename,
			mime_type: file.mime_type,
			file_size: file.file_size,
			content: content,
			truncated: file.file_size > 100000,
			metadata: {
				created_at: file.created_at,
				download_count: Math.floor(Math.random() * 50),
				last_downloaded_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
				parameters: {
					format: file.mime_type.split('/')[1],
					source: 'demo_data'
				}
			}
		};
	};

	FileManager.prototype.getPreviewModal = function() {
		let modal = document.getElementById('filePreviewModal');

		if (!modal) {
			modal = document.createElement('div');
			modal.className = 'modal fade';
			modal.id = 'filePreviewModal';
			modal.tabIndex = -1;
			modal.setAttribute('role', 'dialog');
			modal.setAttribute('aria-labelledby', 'filePreviewModalTitle');
			modal.setAttribute('aria-modal', 'true');

			// Build modal structure with Funky.Dom
			var modalDialog = D.div().classAdd('modal-dialog', 'modal-xl', 'modal-dialog-scrollable')
				.child(
					D.div().classAdd('modal-content')
						.child(
							D.div().classAdd('modal-header')
								.child(
									D.create('h5').classAdd('modal-title').attr('id', 'filePreviewModalTitle').text('File Preview'),
									D.button().classAdd('btn-close').attr('type', 'button').data('funky-modal-close', '').aria('label', 'Close')
								),
							D.div().classAdd('modal-body')
								.child(
									D.div().classAdd('row')
										.child(
											D.div().classAdd('col-md-9').child(D.div().classAdd('preview-content')),
											D.div().classAdd('col-md-3').child(D.div().classAdd('preview-metadata'))
										)
								),
							D.div().classAdd('modal-footer')
								.child(
									D.button().classAdd('btn', 'btn-secondary').attr('type', 'button').data('funky-modal-close', '').text('Close'),
									D.create('a').attr('href', '#').classAdd('btn', 'btn-primary', 'preview-download-btn')
										.child(D.icon('fas fa-download'), D.text(' Download'))
								)
						)
				);
			modal.appendChild(modalDialog.el);
			document.body.appendChild(modal);
		}

		// Return a jQuery-like wrapper for compatibility with modal.find() calls
		return {
			find: function(selector) {
				var el = modal.querySelector(selector);
				return {
					text: function(txt) { if (el) el.textContent = txt; return this; },
					html: function(h) { if (el) el.innerHTML = h; return this; },
					attr: function(name, value) { if (el) el.setAttribute(name, value); return this; }
				};
			}
		};
	};

	FileManager.prototype.renderPreview = function(data) {
		const modal = this.getPreviewModal();
		const mimeConfig = this.getMimeConfig(data.mime_type);

		// Update modal title
		var titleEl = document.getElementById('filePreviewModal').querySelector('.modal-title');
		D.wrap(titleEl).empty().child(D.text(mimeConfig.icon + ' ' + data.filename));

		modal.find('.preview-download-btn').attr('href', this.config.apiBaseUrl + '/' + data.id + '/download');

		// Get content container
		var contentContainer = document.getElementById('filePreviewModal').querySelector('.preview-content');
		D.wrap(contentContainer).empty();

		// Render content based on mime type
		if (data.mime_type === 'application/json') {
			try {
				const json = JSON.parse(data.content);
				// syntaxHighlight returns pre-escaped HTML with spans for syntax coloring
				var wrapper = D.div().classAdd('preview-content-wrapper')
					.child(D.create('pre').classAdd('preview-json'));
				wrapper.el.querySelector('pre').innerHTML = this.syntaxHighlight(JSON.stringify(json, null, 2));
				contentContainer.appendChild(wrapper.el);
			} catch (e) {
				contentContainer.appendChild(
					D.div().classAdd('preview-content-wrapper')
						.child(D.create('pre').classAdd('preview-text').text(data.content)).el
				);
			}
		} else if (data.mime_type === 'text/csv') {
			contentContainer.appendChild(this.renderCsvPreview(data.content));
		} else {
			contentContainer.appendChild(
				D.div().classAdd('preview-content-wrapper')
					.child(D.create('pre').classAdd('preview-text').text(data.content)).el
			);
		}

		if (data.truncated) {
			contentContainer.appendChild(
				D.div().classAdd('alert', 'alert-info', 'mt-2')
					.child(D.icon('fas fa-info-circle'), D.text(' Preview truncated. Download for full content.')).el
			);
		}

		// Render metadata
		const meta = data.metadata || {};
		modal.find('.preview-metadata').html(`
      <h6 class="text-muted mb-3">File Details</h6>
      <dl class="row small">
        <dt class="col-6">Size</dt>
        <dd class="col-6">${Funky.Util.formatFileSize(data.file_size)}</dd>
        <dt class="col-6">Type</dt>
        <dd class="col-6">${mimeConfig.label}</dd>
        <dt class="col-6">Created</dt>
        <dd class="col-6">${this.formatDate(meta.created_at)}</dd>
        <dt class="col-6">Downloads</dt>
        <dd class="col-6">${meta.download_count || 0}</dd>
        ${meta.last_downloaded_at ? `<dt class="col-6">Last Download</dt><dd class="col-6">${this.formatRelativeTime(meta.last_downloaded_at)}</dd>` : ''}
      </dl>
      ${meta.parameters && Object.keys(meta.parameters).length > 0 ? `
        <h6 class="text-muted mb-2 mt-3">Parameters</h6>
        <pre class="small bg-light p-2 rounded">${JSON.stringify(meta.parameters, null, 2)}</pre>
      ` : ''}
    `);
	};

	FileManager.prototype.renderCsvPreview = function(content) {
		const lines = content.split('\n').filter(l => l.trim());
		if (lines.length === 0) {
			return D.create('p').classAdd('text-muted').text('Empty file').el;
		}

		// Parse CSV properly handling quoted fields with commas
		const parseCsvLine = function(line) {
			const result = [];
			let current = '';
			let inQuotes = false;

			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				const nextChar = line[i + 1];

				if (char === '"') {
					if (inQuotes && nextChar === '"') {
						// Escaped quote
						current += '"';
						i++; // Skip next quote
					} else {
						// Toggle quote state
						inQuotes = !inQuotes;
					}
				} else if (char === ',' && !inQuotes) {
					// End of field
					result.push(current.trim());
					current = '';
				} else {
					current += char;
				}
			}
			// Don't forget the last field
			result.push(current.trim());

			return result;
		};

		const headers = parseCsvLine(lines[0]);
		const rows = lines.slice(1, 51).map(line => parseCsvLine(line));

		// Build header row
		const thead = D.create('thead').classAdd('table-dark', 'sticky-top');
		const headerRow = D.create('tr');
		headers.forEach(h => {
			headerRow.child(D.create('th').text(h));
		});
		thead.child(headerRow);

		// Build body rows
		const tbody = D.create('tbody');
		rows.forEach(row => {
			const tr = D.create('tr');
			row.forEach(cell => {
				tr.child(D.create('td').text(cell));
			});
			tbody.child(tr);
		});

		// Build table
		const table = D.create('table').classAdd('table', 'table-sm', 'table-striped', 'preview-csv-table')
			.child(thead, tbody);
		const wrapper = D.div().classAdd('preview-table-wrapper').child(table);

		if (lines.length > 51) {
			wrapper.child(
				D.div().classAdd('text-muted', 'small', 'mt-2')
					.text('Showing first 50 rows of ' + (lines.length - 1))
			);
		}

		return wrapper.el;
	};

	FileManager.prototype.syntaxHighlight = function(json) {
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
			let cls = 'text-warning'; // number
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'text-info'; // key
				} else {
					cls = 'text-success'; // string
				}
			} else if (/true|false/.test(match)) {
				cls = 'text-primary'; // boolean
			} else if (/null/.test(match)) {
				cls = 'text-danger'; // null
			}
			return '<span class="' + cls + '">' + match + '</span>';
		});
	};

	FileManager.prototype.confirmDeleteFile = function(fileId) {
		const self = this;

		if (confirm('Are you sure you want to delete this file?')) {
			this.deleteFile(fileId);
		}
	};

	FileManager.prototype.deleteFile = function(fileId) {
		const self = this;

		// Demo mode: remove from local data
		if (this.config.demoMode) {
			this.files = this.files.filter(function(f) { return f.id !== fileId; });
			this.total = this.files.length;
			this.totalPages = Math.ceil(this.total / this.config.pageLength);
			if (Funky.Toast) Funky.Toast.success('File deleted successfully');
			if (Funky.Announce) Funky.Announce.polite('File deleted');
			this.refresh();
			this.updateDemoStats();
			return;
		}

		const fetchFn = Funky.Api ? Funky.Api.fetch.bind(Funky.Api) : window.fetch;

		fetchFn(this.config.apiBaseUrl + '/' + fileId, { method: 'DELETE' })
			.then(function(response) {
				if (!response.ok) {
					return response.json().then(function(err) { throw err; });
				}
				if (Funky.Toast) Funky.Toast.success('File deleted successfully');
				if (Funky.Announce) Funky.Announce.polite('File deleted');
				self.refresh();
				self.loadStats();
			})
			.catch(function(error) {
				const errorMsg = error.error || 'Failed to delete file';
				if (Funky.Toast) Funky.Toast.error(errorMsg);
				if (Funky.Announce) Funky.Announce.assertive('Failed to delete file');
			});
	};

	FileManager.prototype.confirmBulkDelete = function() {
		const self = this;
		const count = this.selectedFiles.size;

		if (count === 0) return;

		if (confirm('Are you sure you want to delete ' + count + ' file' + (count > 1 ? 's' : '') + '?')) {
			this.bulkDelete();
		}
	};

	FileManager.prototype.bulkDelete = function() {
		const self = this;
		const ids = Array.from(this.selectedFiles);

		// Demo mode: remove from local data
		if (this.config.demoMode) {
			const idsSet = new Set(ids);
			const deletedCount = this.files.filter(function(f) { return idsSet.has(f.id); }).length;
			this.files = this.files.filter(function(f) { return !idsSet.has(f.id); });
			this.total = this.files.length;
			this.totalPages = Math.ceil(this.total / this.config.pageLength);
			var message = 'Deleted ' + deletedCount + ' file' + (deletedCount !== 1 ? 's' : '');
			if (Funky.Toast) Funky.Toast.success(message);
			if (Funky.Announce) Funky.Announce.polite(message);
			this.clearSelection();
			this.refresh();
			this.updateDemoStats();
			return;
		}

		const fetchFn = Funky.Api ? Funky.Api.fetch.bind(Funky.Api) : window.fetch;

		fetchFn(this.config.apiBaseUrl + '/bulk_delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids: ids })
		})
			.then(function(response) {
				if (!response.ok) {
					return response.json().then(function(err) { throw err; });
				}
				return response.json();
			})
			.then(function(result) {
				var message = 'Deleted ' + result.deleted + ' file' + (result.deleted !== 1 ? 's' : '') +
					(result.skipped > 0 ? ', ' + result.skipped + ' skipped' : '');
				if (Funky.Toast) {
					Funky.Toast.success(message);
				}
				if (Funky.Announce) Funky.Announce.polite(message);
				self.clearSelection();
				self.refresh();
				self.loadStats();
			})
			.catch(function(error) {
				const errorMsg = error.error || 'Failed to delete files';
				if (Funky.Toast) Funky.Toast.error(errorMsg);
				if (Funky.Announce) Funky.Announce.assertive('Failed to delete files');
			});
	};

	FileManager.prototype.downloadSelected = function() {
		const self = this;
		const ids = Array.from(this.selectedFiles);

		if (ids.length === 1) {
			this.downloadFile(ids[0]);
		} else {
			// Demo mode: just show toast for bulk download
			if (this.config.demoMode) {
				if (Funky.Toast) Funky.Toast.info('Demo mode: Download triggered for ' + ids.length + ' files');
				return;
			}
			// For multiple files, download one by one (ZIP would require server-side implementation)
			if (Funky.Toast) Funky.Toast.info('Downloading ' + ids.length + ' files...');
			ids.forEach(id => {
				const iframe = document.createElement('iframe');
				iframe.style.display = 'none';
				iframe.src = self.config.apiBaseUrl + '/' + id + '/download';
				document.body.appendChild(iframe);
				setTimeout(() => iframe.remove(), 5000);
			});
		}
	};

	// ============================================================================
	// Refresh
	// ============================================================================
	FileManager.prototype.refresh = function() {
		if (this.config.demoMode) {
			// In demo mode, just re-render with existing data (apply client-side filtering if needed)
			this.currentPage = 1;
			if (this.currentView === 'grid') {
				this.renderGridView();
			}
			// DataTable in demo mode will filter client-side
		} else {
			if (this.currentView === 'grid') {
				this.currentPage = 1;
				this.loadGridView();
			} else if (this.dataTable) {
				this.dataTable.ajax.reload();
			}
		}

		if (Funky.Audio && typeof Funky.Audio.playRefresh === 'function') Funky.Audio.playRefresh();
	};

	// ============================================================================
	// Bindable Interface
	// ============================================================================

	/**
	 * Set data - Replace files/folders
	 * @param {Array} data - Array of file objects to display
	 */
	FileManager.prototype.setData = function(data) {
		this.files = Array.isArray(data) ? data : [];
		this.total = this.files.length;
		this.totalPages = Math.ceil(this.total / this.config.pageLength);
		this.currentPage = 1;
		this.selectedFiles.clear();

		if (this.currentView === 'grid') {
			this.renderGridView();
		} else if (this.dataTable) {
			// Clear and reload DataTable with new data
			this.dataTable.clear();
			this.dataTable.rows.add(this.files);
			this.dataTable.draw();
		}

		this.updateBulkActionsBar();
	};

	/**
	 * Get data - Return current files data
	 * @returns {Array} Current array of file objects
	 */
	FileManager.prototype.getData = function() {
		return this.files;
	};

	/**
	 * Destroy the FileManager instance and clean up
	 */
	FileManager.prototype.destroy = function() {
		// Unregister keyboard shortcuts
		if (this._keyboardUnregisters) {
			this._keyboardUnregisters.forEach(function(unregister) {
				if (typeof unregister === 'function') {
					unregister();
				}
			});
			this._keyboardUnregisters = null;
		}
		
		// Fallback cleanup - remove native keydown handler
		if (this._keydownHandler) {
			document.removeEventListener('keydown', this._keydownHandler);
			this._keydownHandler = null;
		}
		
		// Remove from registry
		const D = Funky.Dom;
		var containerEl = D.one(this.config.containerSelector);
		var containerId = containerEl ? containerEl.attr('id') : null;
		if (containerId) {
			_instances.unregister(containerId);
		}

		// Destroy DataTable if exists
		if (this.dataTable) {
			this.dataTable.destroy();
			this.dataTable = null;
		}

		// Remove event handlers using Funky.Dom (with null checks)
		var viewToggles = D.all(this.config.viewToggleSelector);
		if (viewToggles && viewToggles.off) viewToggles.off('click');

		var searchEl = D.one(this.config.searchSelector);
		if (searchEl && searchEl.off) searchEl.off('input');

		var statusFilterEl = D.one(this.config.statusFilterSelector);
		if (statusFilterEl && statusFilterEl.off) statusFilterEl.off('change');

		var mimeFilterEl = D.one(this.config.mimeFilterSelector);
		if (mimeFilterEl && mimeFilterEl.off) mimeFilterEl.off('change');

		var dateRangeEl = D.one(this.config.dateRangeSelector);
		if (dateRangeEl && dateRangeEl.off) dateRangeEl.off('funky.datepicker.change funky.datepicker.clear');

		var gridEl = D.one(this.config.gridSelector);
		if (gridEl && gridEl.off) gridEl.off('click');

		var listEl = D.one(this.config.listSelector);
		if (listEl && listEl.off) listEl.off('change');

		// Destroy DatePicker instance
		if (this._dateRangePicker && this._dateRangePicker.destroy) {
			this._dateRangePicker.destroy();
			this._dateRangePicker = null;
		}

		// Destroy ComboBox instances
		var ComboBox = Funky.ComboBox;
		if (ComboBox) {
			var mimeEl = document.querySelector(this.config.mimeFilterSelector);
			var statusEl = document.querySelector(this.config.statusFilterSelector);
			
			if (mimeEl) {
				var mimeInstance = ComboBox.getInstance(mimeEl);
				if (mimeInstance) mimeInstance.destroy();
				mimeEl.removeAttribute('data-combobox-initialized');
			}
			if (statusEl) {
				var statusInstance = ComboBox.getInstance(statusEl);
				if (statusInstance) statusInstance.destroy();
				statusEl.removeAttribute('data-combobox-initialized');
			}
		}

		// Clear containers
		var gridEl = D.one(this.config.gridSelector);
		if (gridEl) gridEl.empty();
		var listBodyEl = D.one(this.config.listSelector + ' table tbody');
		if (listBodyEl) listBodyEl.empty();

		// Clear state
		this.files = [];
		this.selectedFiles.clear();
		this.stats = {};
		this.filterOptions = {};

		console.log('[FileManager] Destroyed');
	};

	// ============================================================================
	// Factory API
	// ============================================================================

	var _instanceCounter = 0;

	var FileManagerFactory = {
		/**
		 * Initialize a file manager
		 * @param {Object} config - Configuration options
		 * @returns {FileManager}
		 */
		init: function(config) {
			var instance = new FileManager(config);
			if (!instance.id) {
				instance.id = 'file-manager-' + (++_instanceCounter);
			}
			return instance;
		},

		/**
		 * @deprecated Use init() instead
		 */
		create: function(config) {
			return this.init(config);
		},

		/**
		 * Get instance by ID
		 * @param {string} id - Instance ID
		 * @returns {FileManager|null}
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
			}
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		/**
		 * Access to constructor for advanced use
		 */
		constructor: FileManager
	};

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('FileManager', FileManagerFactory);
	}

})(window);
