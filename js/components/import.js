/**
 * Funky Import - CSV/Excel Import Component
 * 
 * Provides file upload with drag-and-drop, progress tracking,
 * and results display for bulk data imports.
 * 
 * Usage:
 *   Funky.Import.init({
 *     entity: 'clients',
 *     modalId: 'importClientsModal',
 *     apiUrl: '/api/clients/import',
 *     requiredFields: ['code', 'name'],
 *     onComplete: function(results) { table.ajax.reload(); }
 *   });
 *   
 *   Funky.Import.show('importClientsModal');
 * 
 * @version 1.0.4
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Import] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('Import')) {
		return;
	}

	// Store configurations
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

		var entityLabel = config.entityLabel || config.entity || 'Items';
		var requiredFields = config.requiredFields || [];
		var instructions = config.instructions || [
			'Upload a CSV or Excel (.xlsx) file',
			'First row must contain column headers',
			'Required fields: ' + (requiredFields.join(', ') || 'None')
		];

		var instructionsHtml = instructions.map(function(inst) {
			return '<li>' + escapeHtml(inst) + '</li>';
		}).join('');

		var titleId = modalId + '-title';
		var html = '<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog" aria-labelledby="' + titleId + '" aria-modal="true">' +
			'<div class="modal-dialog modal-lg">' +
			'<div class="modal-content">' +
			'<div class="modal-header">' +
			'<h5 class="modal-title" id="' + titleId + '">Import ' + escapeHtml(entityLabel) + '</h5>' +
			'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
			'</div>' +
			'<div class="modal-body">' +
			// Instructions
			'<div class="import-instructions mb-4">' +
			'<h6>Instructions</h6>' +
			'<ul class="small text-muted">' + instructionsHtml + '</ul>' +
			'</div>' +
			// Drop zone
			'<div class="import-dropzone border rounded-3 p-5 text-center mb-3" id="dropzone-' + modalId + '">' +
			'<i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3" aria-hidden="true"></i>' +
			'<p class="mb-2">Drag and drop file here, or</p>' +
			'<input type="file" class="import-file-input d-none" accept=".csv,.xlsx,.xls" aria-label="Select file to import">' +
			'<button type="button" class="btn-funky btn-funky-secondary import-browse-btn"><i class="fas fa-folder-open me-1" aria-hidden="true"></i>Browse Files</button>' +
			'<p class="small text-muted mt-2 mb-0">Supports CSV, Excel (.xlsx, .xls)</p>' +
			'</div>' +
			// Selected file info
			'<div class="import-file-info d-none mb-3">' +
			'<div class="d-flex align-items-center">' +
			'<i class="fas fa-file-alt fa-2x text-primary me-3" aria-hidden="true"></i>' +
			'<div class="flex-grow-1">' +
			'<div class="import-file-name fw-bold"></div>' +
			'<div class="import-file-size small text-muted"></div>' +
			'</div>' +
			'<button type="button" class="btn-funky btn-funky-danger btn-sm import-remove-file" aria-label="Remove selected file">' +
			'<i class="fas fa-times" aria-hidden="true"></i>' +
			'</button>' +
			'</div>' +
			'</div>' +
			// Progress
			'<div class="import-progress d-none mb-3" role="status" aria-live="polite">' +
			'<div class="d-flex justify-content-between mb-1">' +
			'<span>Uploading...</span>' +
			'<span class="import-progress-percent">0%</span>' +
			'</div>' +
			'<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
			'<div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>' +
			'</div>' +
			'</div>' +
			// Results
			'<div class="import-results d-none" role="status" aria-live="polite">' +
			'<div class="import-results-summary alert mb-3" role="alert"></div>' +
			'<div class="import-results-errors d-none">' +
			'<h6>Errors</h6>' +
			'<div class="import-errors-list" style="max-height: 200px; overflow-y: auto;"></div>' +
			'</div>' +
			'</div>' +
			// Error
			'<div class="import-error alert alert-danger d-none" role="alert"></div>' +
			'</div>' +
			'<div class="modal-footer">' +
			'<button type="button" class="btn-funky btn-funky-secondary" data-bs-dismiss="modal"><i class="fas fa-times me-1" aria-hidden="true"></i>Close</button>' +
			'<button type="button" class="btn-funky btn-funky-primary import-upload-btn" disabled>' +
			'<i class="fas fa-upload me-1" aria-hidden="true"></i>Upload' +
			'</button>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>';

		document.body.insertAdjacentHTML('beforeend', html);

		// Bind events
		bindEvents(modalId, config);
	}

	/**
	 * Bind modal events
	 */
	function bindEvents(modalId, config) {
		var modal = document.getElementById(modalId);
		var dropzone = modal.querySelector('.import-dropzone');
		var fileInput = modal.querySelector('.import-file-input');
		var browseBtn = modal.querySelector('.import-browse-btn');
		var removeBtn = modal.querySelector('.import-remove-file');
		var uploadBtn = modal.querySelector('.import-upload-btn');

		// Store selected file
		var selectedFile = null;

		// Browse button
		browseBtn.addEventListener('click', function() {
			fileInput.click();
		});

		// File input change
		fileInput.addEventListener('change', function() {
			if (fileInput.files.length > 0) {
				selectedFile = fileInput.files[0];
				showFileInfo(modalId, selectedFile);
			}
		});

		// Drag and drop
		dropzone.addEventListener('dragover', function(e) {
			e.preventDefault();
			dropzone.classList.add('dragover');
		});

		dropzone.addEventListener('dragleave', function(e) {
			e.preventDefault();
			dropzone.classList.remove('dragover');
		});

		dropzone.addEventListener('drop', function(e) {
			e.preventDefault();
			dropzone.classList.remove('dragover');

			if (e.dataTransfer.files.length > 0) {
				selectedFile = e.dataTransfer.files[0];
				showFileInfo(modalId, selectedFile);
			}
		});

		// Remove file
		removeBtn.addEventListener('click', function() {
			selectedFile = null;
			fileInput.value = '';
			resetState(modalId);
		});

		// Upload button
		uploadBtn.addEventListener('click', function() {
			if (selectedFile) {
				uploadFile(modalId, config, selectedFile);
			}
		});

		// Reset on modal close
		modal.addEventListener('funky.modal.hidden', function() {
			selectedFile = null;
			fileInput.value = '';
			resetState(modalId);
		});

		// Store reference to get selected file
		modal._getSelectedFile = function() { return selectedFile; };
	}

	/**
	 * Show selected file info
	 */
	function showFileInfo(modalId, file) {
		var modal = document.getElementById(modalId);
		var dropzone = modal.querySelector('.import-dropzone');
		var fileInfo = modal.querySelector('.import-file-info');
		var fileName = modal.querySelector('.import-file-name');
		var fileSize = modal.querySelector('.import-file-size');
		var uploadBtn = modal.querySelector('.import-upload-btn');

		dropzone.classList.add('d-none');
		fileInfo.classList.remove('d-none');

		fileName.textContent = file.name;
		fileSize.textContent = formatFileSize(file.size);

		uploadBtn.disabled = false;
	}

	/**
	 * Reset modal state
	 */
	function resetState(modalId) {
		var modal = document.getElementById(modalId);
		var dropzone = modal.querySelector('.import-dropzone');
		var fileInfo = modal.querySelector('.import-file-info');
		var progressEl = modal.querySelector('.import-progress');
		var resultsEl = modal.querySelector('.import-results');
		var errorEl = modal.querySelector('.import-error');
		var uploadBtn = modal.querySelector('.import-upload-btn');

		dropzone.classList.remove('d-none');
		fileInfo.classList.add('d-none');
		progressEl.classList.add('d-none');
		resultsEl.classList.add('d-none');
		errorEl.classList.add('d-none');

		uploadBtn.disabled = true;
		uploadBtn.replaceChildren(
			Funky.Dom.icon('upload', { class: 'me-1' }),
			'Upload'
		);
	}

	/**
	 * Format file size
	 */
	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		var k = 1024;
		var sizes = ['Bytes', 'KB', 'MB', 'GB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * Upload file
	 */
	function uploadFile(modalId, config, file) {
		var modal = document.getElementById(modalId);
		var progressEl = modal.querySelector('.import-progress');
		var progressBar = progressEl.querySelector('.progress-bar');
		var progressPercent = progressEl.querySelector('.import-progress-percent');
		var uploadBtn = modal.querySelector('.import-upload-btn');
		var errorEl = modal.querySelector('.import-error');

		// Show progress
		progressEl.classList.remove('d-none');
		errorEl.classList.add('d-none');
		uploadBtn.disabled = true;
		uploadBtn.replaceChildren(
			Funky.Dom.el('span', { class: 'spinner-border spinner-border-sm me-1' }),
			'Uploading...'
		);

		// Prepare form data
		var formData = new FormData();
		formData.append('file', file);

		// Add any extra data
		if (config.extraData) {
			Object.keys(config.extraData).forEach(function(key) {
				formData.append(key, config.extraData[key]);
			});
		}

		// Create XHR for progress tracking
		var xhr = new XMLHttpRequest();

		xhr.upload.addEventListener('progress', function(e) {
			if (e.lengthComputable) {
				var percent = Math.round((e.loaded / e.total) * 100);
				progressBar.style.width = percent + '%';
				progressPercent.textContent = percent + '%';
				// Update progressbar ARIA
				var progressBarContainer = progressEl.querySelector('.progress');
				if (progressBarContainer) {
					progressBarContainer.setAttribute('aria-valuenow', percent);
				}
			}
		});

		xhr.addEventListener('load', function() {
			progressEl.classList.add('d-none');

			if (xhr.status >= 200 && xhr.status < 300) {
				var result;
				try {
					result = JSON.parse(xhr.responseText);
				} catch (e) {
					result = { success: true, message: 'Import completed' };
				}
				showResults(modalId, config, result);
			} else {
				var errorMsg = 'Upload failed';
				try {
					var errResult = JSON.parse(xhr.responseText);
					errorMsg = errResult.error || errResult.message || errorMsg;
				} catch (e) {}
				showError(modalId, errorMsg);
			}
		});

		xhr.addEventListener('error', function() {
			progressEl.classList.add('d-none');
			showError(modalId, 'Network error during upload');
		});

		// Send request
		var url = config.apiUrl || '/api/' + config.entity + '/import';
		xhr.open('POST', url, true);

		// Add CSRF token if available
		if (Funky.CSRF && Funky.CSRF.getToken) {
			xhr.setRequestHeader('X-CSRF-Token', Funky.CSRF.getToken());
		}

		xhr.send(formData);
	}

	/**
	 * Show import results
	 */
	function showResults(modalId, config, result) {
		var modal = document.getElementById(modalId);
		var resultsEl = modal.querySelector('.import-results');
		var summaryEl = modal.querySelector('.import-results-summary');
		var errorsEl = modal.querySelector('.import-results-errors');
		var errorsListEl = modal.querySelector('.import-errors-list');
		var uploadBtn = modal.querySelector('.import-upload-btn');

		resultsEl.classList.remove('d-none');

		// Build summary
		var imported = result.imported || result.created || 0;
		var updated = result.updated || 0;
		var skipped = result.skipped || 0;
		var failed = result.failed || (result.errors ? result.errors.length : 0);
		var total = result.total || (imported + updated + skipped + failed);

		var isSuccess = failed === 0;
		summaryEl.className = 'import-results-summary alert ' + 
			(isSuccess ? 'alert-success' : 'alert-warning');

		var summaryHtml = '<strong>' + (isSuccess ? 'Import Successful!' : 'Import Completed with Errors') + '</strong><br>';
		summaryHtml += '<span class="badge bg-success me-2">' + imported + ' imported</span>';
		if (updated > 0) {
			summaryHtml += '<span class="badge bg-info me-2">' + updated + ' updated</span>';
		}
		if (skipped > 0) {
			summaryHtml += '<span class="badge bg-secondary me-2">' + skipped + ' skipped</span>';
		}
		if (failed > 0) {
			summaryHtml += '<span class="badge bg-danger me-2">' + failed + ' failed</span>';
		}
		summaryEl.innerHTML = summaryHtml;

		// Show errors if any
		if (result.errors && result.errors.length > 0) {
			errorsEl.classList.remove('d-none');
			var errorsHtml = '<table class="table table-sm table-bordered">' +
				'<thead><tr><th>Row</th><th>Error</th></tr></thead><tbody>';
			result.errors.forEach(function(err) {
				var row = err.row || err.line || '?';
				var message = err.error || err.message || JSON.stringify(err);
				errorsHtml += '<tr><td>' + escapeHtml(row) + '</td><td>' + escapeHtml(message) + '</td></tr>';
			});
			errorsHtml += '</tbody></table>';
			errorsListEl.innerHTML = errorsHtml;
		} else {
			errorsEl.classList.add('d-none');
		}

		// Update button
		uploadBtn.replaceChildren(
			Funky.Dom.icon('check', { class: 'me-1' }),
			'Done'
		);
		uploadBtn.disabled = true;

		// Invalidate cache
		if (Funky.Cache && config.entity) {
			Funky.Cache.clear(config.entity);
		}

		// Call onComplete callback
		if (typeof config.onComplete === 'function') {
			config.onComplete(result);
		}

		// Show toast and announce
		if (Funky.Toast) {
			if (isSuccess) {
				Funky.Toast.success(imported + ' records imported successfully');
			} else {
				Funky.Toast.warning(imported + ' imported, ' + failed + ' failed');
			}
		}
		if (Funky.Announce) {
			if (isSuccess) {
				Funky.Announce.polite('Import complete. ' + imported + ' records imported successfully');
			} else {
				Funky.Announce.assertive('Import completed with errors. ' + imported + ' imported, ' + failed + ' failed');
			}
		}
	}

	/**
	 * Show error
	 */
	function showError(modalId, message) {
		var modal = document.getElementById(modalId);
		var errorEl = modal.querySelector('.import-error');
		var uploadBtn = modal.querySelector('.import-upload-btn');

		errorEl.textContent = message;
		errorEl.classList.remove('d-none');

		if (Funky.Announce) {
			Funky.Announce.assertive('Error: ' + message);
		}

		uploadBtn.replaceChildren(
			Funky.Dom.icon('upload', { class: 'me-1' }),
			'Retry'
		);
		uploadBtn.disabled = false;
	}

	var Import = {
		/**
		 * Instance registry for Bindable Interface
		 * Allows external access via Funky.Import._instances[modalId]
		 */
		_instances: {},

		/**
		 * Initialize import modal
		 * @param {object} config - Configuration
		 * @param {string} config.entity - Entity type
		 * @param {string} config.modalId - Modal element ID
		 * @param {string} [config.apiUrl] - API endpoint for import
		 * @param {Array} [config.requiredFields] - Required fields list
		 * @param {function} [config.onComplete] - Callback after import
		 */
		init: function(config) {
			if (!config || !config.modalId) {
				console.error('[Funky.Import] modalId is required');
				return;
			}

			configs[config.modalId] = config;
			ensureModalExists(config.modalId, config);

			// Register instance by modal ID for Bindable Interface
			var self = this;
			this._instances[config.modalId] = {
				modalId: config.modalId,
				config: config,
				show: function() { self.show(config.modalId); },
				hide: function() { self.hide(config.modalId); },
				setData: function(data) { self.setData(config.modalId, data); }
			};
		},

		/**
		 * Set import preview data (Bindable Interface)
		 * @param {string} modalId - Modal ID
		 * @param {object} data - Preview data to display
		 * @param {Array} [data.headers] - Column headers
		 * @param {Array} [data.rows] - Preview rows
		 * @param {string} [data.fileName] - File name to display
		 * @param {number} [data.fileSize] - File size in bytes
		 * @param {object} [data.validation] - Validation results
		 */
		setData: function(modalId, data) {
			var config = configs[modalId];
			if (!config) {
				console.error('[Funky.Import] Config not found for:', modalId);
				return;
			}

			var modal = document.getElementById(modalId);
			if (!modal) {
				console.error('[Funky.Import] Modal not found:', modalId);
				return;
			}

			// If fileName provided, show file info section
			if (data.fileName) {
				var dropzone = modal.querySelector('.import-dropzone');
				var fileInfo = modal.querySelector('.import-file-info');
				var fileName = modal.querySelector('.import-file-name');
				var fileSize = modal.querySelector('.import-file-size');
				var uploadBtn = modal.querySelector('.import-upload-btn');

				if (dropzone) dropzone.classList.add('d-none');
				if (fileInfo) fileInfo.classList.remove('d-none');
				if (fileName) fileName.textContent = data.fileName;
				if (fileSize && data.fileSize) fileSize.textContent = formatFileSize(data.fileSize);
				if (uploadBtn) uploadBtn.disabled = false;
			}

			// If validation results provided, show them
			if (data.validation) {
				showResults(modalId, config, data.validation);
			}

			// Store data on modal for reference
			modal._importData = data;

			// Emit event for listeners
			modal.dispatchEvent(new CustomEvent('funky.import.data-set', { detail: data }));
		},

		/**
		 * Show import modal
		 * @param {string} modalId - Modal ID
		 */
		show: function(modalId) {
			var config = configs[modalId];
			if (!config) {
				console.error('[Funky.Import] Config not found for:', modalId);
				return;
			}

			resetState(modalId);
			Funky.Modal.show('#' + modalId);
		},

		/**
		 * Hide import modal
		 * @param {string} modalId - Modal ID
		 */
		hide: function(modalId) {
			Funky.Modal.hide('#' + modalId);
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
		 * Get instance by modal ID (Bindable Interface)
		 * @param {string} modalId - Modal ID
		 * @returns {object|null} Instance object with show/hide/setData methods
		 */
		getInstance: function(modalId) {
			return this._instances[modalId] || null;
		},

		/**
		 * Destroy import wizard instance
		 * @param {string} modalId - Modal ID
		 */
		destroy: function(modalId) {
			if (this._instances[modalId]) {
				this._instances[modalId].hide();
				delete this._instances[modalId];
			}
			if (configs[modalId]) {
				delete configs[modalId];
			}
		},

		/**
		 * Destroy all import wizard instances
		 */
		destroyAll: function() {
			var self = this;
			Object.keys(this._instances).forEach(function(modalId) {
				self.destroy(modalId);
			});
		}
	};

	// Register with Funky namespace
	Funky.register('Import', Import);

	console.log('[Funky.Import] Initialized');

})(window);
