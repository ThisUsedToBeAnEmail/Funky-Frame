/**
 * Funky.Import - CSV/Excel Import Component Tests
 *
 * Tests for the file upload with drag-and-drop, progress tracking,
 * and results display for bulk data imports.
 */
FunkyTests.describe('Funky.Import', function() {
	'use strict';

	var Import = Funky.Import;
	var expect = FunkyTests.expect;
	var spyOn = FunkyTests.spyOn;
	var fixture;
	var testCounter = 0;

	/**
	 * Generate unique ID for test isolation
	 */
	function uniqueId(prefix) {
		testCounter++;
		return (prefix || 'import') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
	}

	/**
	 * Create mock file for testing
	 */
	function createMockFile(name, size, type) {
		var content = new Array(size + 1).join('x');
		return new File([content], name || 'test.csv', { type: type || 'text/csv' });
	}

	FunkyTests.beforeEach(function() {
		var containerId = uniqueId('import-container');
		fixture = FunkyTests.fixture(
			'<div id="' + containerId + '"></div>'
		);
	});

	FunkyTests.afterEach(function() {
		// Clean up any created modals
		var modals = document.querySelectorAll('.modal');
		modals.forEach(function(modal) {
			if (modal.id && modal.id.indexOf('importTest') === 0) {
				modal.remove();
			}
		});

		// Clean up instances (Import uses plain object)
		if (Import && Import._instances) {
			Object.keys(Import._instances).forEach(function(key) {
				if (key.indexOf('importTest') === 0) {
					delete Import._instances[key];
				}
			});
		}

		fixture.cleanup();
	});

	// =========================================================================
	// Module Structure
	// =========================================================================
	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('should be registered with Funky namespace', function() {
			expect(Import).toBeDefined();
			expect(Funky.isRegistered('Import')).toBe(true);
		});

		FunkyTests.it('should expose init method', function() {
			expect(typeof Import.init).toBe('function');
		});

		FunkyTests.it('should expose show method', function() {
			expect(typeof Import.show).toBe('function');
		});

		FunkyTests.it('should expose hide method', function() {
			expect(typeof Import.hide).toBe('function');
		});

		FunkyTests.it('should expose getConfig method', function() {
			expect(typeof Import.getConfig).toBe('function');
		});

		FunkyTests.it('should expose getInstance method', function() {
			expect(typeof Import.getInstance).toBe('function');
		});

		FunkyTests.it('should expose setData method', function() {
			expect(typeof Import.setData).toBe('function');
		});

		FunkyTests.it('should have _instances registry', function() {
			expect(Import._instances).toBeDefined();
			expect(typeof Import._instances).toBe('object');
		});
	});

	// =========================================================================
	// init Method
	// =========================================================================
	FunkyTests.describe('init', function() {
		FunkyTests.it('should require modalId in config', function() {
			var consoleSpy = spyOn(console, 'error');

			Import.init({});

			expect(consoleSpy).toHaveBeenCalled();
		});

		FunkyTests.it('should create modal element if it does not exist', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			var modal = document.getElementById(modalId);
			expect(modal).toBeDefined();
			expect(modal).not.toBe(null);
		});

		FunkyTests.it('should register instance in _instances', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			expect(Import._instances[modalId]).toBeDefined();
		});

		FunkyTests.it('should store config via getConfig', function() {
			var modalId = uniqueId('importTest');
			var config = {
				modalId: modalId,
				entity: 'clients',
				apiUrl: '/api/clients/import'
			};

			Import.init(config);

			var storedConfig = Import.getConfig(modalId);
			expect(storedConfig).toBeDefined();
			expect(storedConfig.entity).toBe('clients');
			expect(storedConfig.apiUrl).toBe('/api/clients/import');
		});

		FunkyTests.it('should use entity label in modal title', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients',
				entityLabel: 'Client Records'
			});

			var modal = document.getElementById(modalId);
			var title = modal.querySelector('.modal-title');
			expect(title.textContent).toContain('Client Records');
		});

		FunkyTests.it('should include required fields in instructions', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients',
				requiredFields: ['code', 'name', 'email']
			});

			var modal = document.getElementById(modalId);
			var instructions = modal.querySelector('.import-instructions');
			expect(instructions.textContent).toContain('code');
			expect(instructions.textContent).toContain('name');
			expect(instructions.textContent).toContain('email');
		});

		FunkyTests.it('should include custom instructions', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients',
				instructions: [
					'Custom instruction 1',
					'Custom instruction 2'
				]
			});

			var modal = document.getElementById(modalId);
			var instructions = modal.querySelector('.import-instructions');
			expect(instructions.textContent).toContain('Custom instruction 1');
			expect(instructions.textContent).toContain('Custom instruction 2');
		});
	});

	// =========================================================================
	// Modal Structure
	// =========================================================================
	FunkyTests.describe('Modal Structure', function() {
		var modalId;

		FunkyTests.beforeEach(function() {
			modalId = uniqueId('importTest');
			Import.init({
				modalId: modalId,
				entity: 'clients'
			});
		});

		FunkyTests.it('should have dropzone area', function() {
			var modal = document.getElementById(modalId);
			var dropzone = modal.querySelector('.import-dropzone');
			expect(dropzone).not.toBe(null);
		});

		FunkyTests.it('should have file input', function() {
			var modal = document.getElementById(modalId);
			var fileInput = modal.querySelector('.import-file-input');
			expect(fileInput).not.toBe(null);
			expect(fileInput.getAttribute('type')).toBe('file');
		});

		FunkyTests.it('should accept correct file types', function() {
			var modal = document.getElementById(modalId);
			var fileInput = modal.querySelector('.import-file-input');
			var accept = fileInput.getAttribute('accept');
			expect(accept).toContain('.csv');
			expect(accept).toContain('.xlsx');
		});

		FunkyTests.it('should have browse button', function() {
			var modal = document.getElementById(modalId);
			var browseBtn = modal.querySelector('.import-browse-btn');
			expect(browseBtn).not.toBe(null);
		});

		FunkyTests.it('should have upload button', function() {
			var modal = document.getElementById(modalId);
			var uploadBtn = modal.querySelector('.import-upload-btn');
			expect(uploadBtn).not.toBe(null);
		});

		FunkyTests.it('should have upload button initially disabled', function() {
			var modal = document.getElementById(modalId);
			var uploadBtn = modal.querySelector('.import-upload-btn');
			expect(uploadBtn.disabled).toBe(true);
		});

		FunkyTests.it('should have file info section hidden initially', function() {
			var modal = document.getElementById(modalId);
			var fileInfo = modal.querySelector('.import-file-info');
			expect(fileInfo.classList.contains('d-none')).toBe(true);
		});

		FunkyTests.it('should have progress section hidden initially', function() {
			var modal = document.getElementById(modalId);
			var progress = modal.querySelector('.import-progress');
			expect(progress.classList.contains('d-none')).toBe(true);
		});

		FunkyTests.it('should have results section hidden initially', function() {
			var modal = document.getElementById(modalId);
			var results = modal.querySelector('.import-results');
			expect(results.classList.contains('d-none')).toBe(true);
		});

		FunkyTests.it('should have error section hidden initially', function() {
			var modal = document.getElementById(modalId);
			var error = modal.querySelector('.import-error');
			expect(error.classList.contains('d-none')).toBe(true);
		});

		FunkyTests.it('should have proper ARIA attributes', function() {
			var modal = document.getElementById(modalId);
			expect(modal.getAttribute('role')).toBe('dialog');
			expect(modal.getAttribute('aria-modal')).toBe('true');
			expect(modal.hasAttribute('aria-labelledby')).toBe(true);
		});
	});

	// =========================================================================
	// getInstance Method
	// =========================================================================
	FunkyTests.describe('getInstance', function() {
		FunkyTests.it('should return instance for registered modal', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			var instance = Import.getInstance(modalId);
			expect(instance).toBeDefined();
			expect(instance.modalId).toBe(modalId);
		});

		FunkyTests.it('should return null for unregistered modal', function() {
			var instance = Import.getInstance('nonexistent');
			expect(instance).toBe(null);
		});

		FunkyTests.it('should have show method on instance', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			var instance = Import.getInstance(modalId);
			expect(typeof instance.show).toBe('function');
		});

		FunkyTests.it('should have hide method on instance', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			var instance = Import.getInstance(modalId);
			expect(typeof instance.hide).toBe('function');
		});

		FunkyTests.it('should have setData method on instance', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			var instance = Import.getInstance(modalId);
			expect(typeof instance.setData).toBe('function');
		});
	});

	// =========================================================================
	// getConfig Method
	// =========================================================================
	FunkyTests.describe('getConfig', function() {
		FunkyTests.it('should return config for registered modal', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients',
				apiUrl: '/api/import'
			});

			var config = Import.getConfig(modalId);
			expect(config.entity).toBe('clients');
			expect(config.apiUrl).toBe('/api/import');
		});

		FunkyTests.it('should return null for unregistered modal', function() {
			var config = Import.getConfig('nonexistent');
			expect(config).toBe(null);
		});
	});

	// =========================================================================
	// setData Method
	// =========================================================================
	FunkyTests.describe('setData', function() {
		var modalId;

		FunkyTests.beforeEach(function() {
			modalId = uniqueId('importTest');
			Import.init({
				modalId: modalId,
				entity: 'clients'
			});
		});

		FunkyTests.it('should show file info when fileName provided', function() {
			Import.setData(modalId, {
				fileName: 'test.csv',
				fileSize: 1024
			});

			var modal = document.getElementById(modalId);
			var fileInfo = modal.querySelector('.import-file-info');
			expect(fileInfo.classList.contains('d-none')).toBe(false);
		});

		FunkyTests.it('should display file name', function() {
			Import.setData(modalId, {
				fileName: 'clients_import.csv',
				fileSize: 2048
			});

			var modal = document.getElementById(modalId);
			var fileName = modal.querySelector('.import-file-name');
			expect(fileName.textContent).toBe('clients_import.csv');
		});

		FunkyTests.it('should enable upload button when file set', function() {
			Import.setData(modalId, {
				fileName: 'test.csv'
			});

			var modal = document.getElementById(modalId);
			var uploadBtn = modal.querySelector('.import-upload-btn');
			expect(uploadBtn.disabled).toBe(false);
		});

		FunkyTests.it('should store data on modal element', function() {
			var data = {
				fileName: 'test.csv',
				headers: ['col1', 'col2']
			};

			Import.setData(modalId, data);

			var modal = document.getElementById(modalId);
			expect(modal._importData).toBeDefined();
			expect(modal._importData.fileName).toBe('test.csv');
		});

		FunkyTests.it('should emit funky.import.data-set event', function() {
			var modal = document.getElementById(modalId);
			var eventFired = false;
			var eventData = null;

			modal.addEventListener('funky.import.data-set', function(e) {
				eventFired = true;
				eventData = e.detail;
			});

			Import.setData(modalId, { fileName: 'test.csv' });

			expect(eventFired).toBe(true);
			expect(eventData.fileName).toBe('test.csv');
		});

		FunkyTests.it('should log warning for unknown modalId', function() {
			var consoleSpy = spyOn(console, 'error');

			Import.setData('nonexistent', { fileName: 'test.csv' });

			expect(consoleSpy).toHaveBeenCalled();
		});
	});

	// =========================================================================
	// File Selection
	// =========================================================================
	FunkyTests.describe('File Selection', function() {
		var modalId;

		FunkyTests.beforeEach(function() {
			modalId = uniqueId('importTest');
			Import.init({
				modalId: modalId,
				entity: 'clients'
			});
		});

		FunkyTests.it('should have remove file button', function() {
			var modal = document.getElementById(modalId);
			var removeBtn = modal.querySelector('.import-remove-file');
			expect(removeBtn).not.toBe(null);
		});

		FunkyTests.it('should have accessible file input label', function() {
			var modal = document.getElementById(modalId);
			var fileInput = modal.querySelector('.import-file-input');
			expect(fileInput.hasAttribute('aria-label')).toBe(true);
		});
	});

	// =========================================================================
	// Drag and Drop
	// =========================================================================
	FunkyTests.describe('Drag and Drop', function() {
		var modalId;

		FunkyTests.beforeEach(function() {
			modalId = uniqueId('importTest');
			Import.init({
				modalId: modalId,
				entity: 'clients'
			});
		});

		FunkyTests.it('should add dragover class on dragover', function() {
			var modal = document.getElementById(modalId);
			var dropzone = modal.querySelector('.import-dropzone');

			var dragEvent = new Event('dragover', { bubbles: true, cancelable: true });
			dragEvent.preventDefault = function() {};
			dropzone.dispatchEvent(dragEvent);

			expect(dropzone.classList.contains('dragover')).toBe(true);
		});

		FunkyTests.it('should remove dragover class on dragleave', function() {
			var modal = document.getElementById(modalId);
			var dropzone = modal.querySelector('.import-dropzone');

			// First add the class
			dropzone.classList.add('dragover');

			var leaveEvent = new Event('dragleave', { bubbles: true, cancelable: true });
			leaveEvent.preventDefault = function() {};
			dropzone.dispatchEvent(leaveEvent);

			expect(dropzone.classList.contains('dragover')).toBe(false);
		});
	});

	// =========================================================================
	// Progress Tracking
	// =========================================================================
	FunkyTests.describe('Progress Tracking', function() {
		var modalId;

		FunkyTests.beforeEach(function() {
			modalId = uniqueId('importTest');
			Import.init({
				modalId: modalId,
				entity: 'clients'
			});
		});

		FunkyTests.it('should have progress bar element', function() {
			var modal = document.getElementById(modalId);
			var progressBar = modal.querySelector('.progress-bar');
			expect(progressBar).not.toBe(null);
		});

		FunkyTests.it('should have progress percentage element', function() {
			var modal = document.getElementById(modalId);
			var progressPercent = modal.querySelector('.import-progress-percent');
			expect(progressPercent).not.toBe(null);
		});

		FunkyTests.it('should have accessible progress bar', function() {
			var modal = document.getElementById(modalId);
			var progress = modal.querySelector('.progress[role="progressbar"]');
			expect(progress).not.toBe(null);
			expect(progress.hasAttribute('aria-valuemin')).toBe(true);
			expect(progress.hasAttribute('aria-valuemax')).toBe(true);
		});
	});

	// =========================================================================
	// Results Display
	// =========================================================================
	FunkyTests.describe('Results Display', function() {
		var modalId;

		FunkyTests.beforeEach(function() {
			modalId = uniqueId('importTest');
			Import.init({
				modalId: modalId,
				entity: 'clients'
			});
		});

		FunkyTests.it('should have results summary element', function() {
			var modal = document.getElementById(modalId);
			var summary = modal.querySelector('.import-results-summary');
			expect(summary).not.toBe(null);
		});

		FunkyTests.it('should have errors list element', function() {
			var modal = document.getElementById(modalId);
			var errorsList = modal.querySelector('.import-errors-list');
			expect(errorsList).not.toBe(null);
		});

		FunkyTests.it('should show results when setData includes validation', function() {
			Import.setData(modalId, {
				validation: {
					imported: 10,
					failed: 2,
					errors: [
						{ row: 1, error: 'Invalid code' },
						{ row: 5, error: 'Missing name' }
					]
				}
			});

			var modal = document.getElementById(modalId);
			var results = modal.querySelector('.import-results');
			expect(results.classList.contains('d-none')).toBe(false);
		});
	});

	// =========================================================================
	// Accessibility
	// =========================================================================
	FunkyTests.describe('Accessibility', function() {
		var modalId;

		FunkyTests.beforeEach(function() {
			modalId = uniqueId('importTest');
			Import.init({
				modalId: modalId,
				entity: 'clients',
				entityLabel: 'Clients'
			});
		});

		FunkyTests.it('should have modal title with ID for aria-labelledby', function() {
			var modal = document.getElementById(modalId);
			var titleId = modal.getAttribute('aria-labelledby');
			var title = document.getElementById(titleId);
			expect(title).not.toBe(null);
		});

		FunkyTests.it('should have close button with aria-label', function() {
			var modal = document.getElementById(modalId);
			var closeBtn = modal.querySelector('.btn-close');
			expect(closeBtn.hasAttribute('aria-label')).toBe(true);
		});

		FunkyTests.it('should have remove file button with aria-label', function() {
			var modal = document.getElementById(modalId);
			var removeBtn = modal.querySelector('.import-remove-file');
			expect(removeBtn.hasAttribute('aria-label')).toBe(true);
		});

		FunkyTests.it('should have live region for progress', function() {
			var modal = document.getElementById(modalId);
			var progress = modal.querySelector('.import-progress');
			expect(progress.getAttribute('aria-live')).toBe('polite');
		});

		FunkyTests.it('should have live region for results', function() {
			var modal = document.getElementById(modalId);
			var results = modal.querySelector('.import-results');
			expect(results.getAttribute('aria-live')).toBe('polite');
		});
	});

	// =========================================================================
	// Modal Not Found Edge Cases
	// =========================================================================
	FunkyTests.describe('Edge Cases', function() {
		FunkyTests.it('should not recreate modal if already exists', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			var modal1 = document.getElementById(modalId);
			var originalContent = modal1.innerHTML;

			// Init again
			Import.init({
				modalId: modalId,
				entity: 'clients'
			});

			var modal2 = document.getElementById(modalId);
			expect(modal2.innerHTML).toBe(originalContent);
		});

		FunkyTests.it('should handle show with unregistered modalId', function() {
			var consoleSpy = spyOn(console, 'error');

			Import.show('nonexistent');

			expect(consoleSpy).toHaveBeenCalled();
		});

		FunkyTests.it('should default API URL from entity', function() {
			var modalId = uniqueId('importTest');

			Import.init({
				modalId: modalId,
				entity: 'trades'
			});

			var config = Import.getConfig(modalId);
			// apiUrl not specified, should derive from entity
			expect(config.entity).toBe('trades');
		});
	});

});
