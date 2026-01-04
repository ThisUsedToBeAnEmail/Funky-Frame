/**
 * Funky.FocusManager Tests
 *
 * Tests for centralized focus history and navigation.
 */

describe('Funky.Core.FocusManager', function() {

	var FocusManager = Funky.FocusManager;
	var container;
	var buttons = [];

	beforeEach(function() {
		// Create test container with focusable elements
		container = document.createElement('div');
		container.id = 'focus-test-container';
		container.innerHTML = [
			'<div data-nav-region="sidebar" data-nav-order="1">',
			'  <button id="btn-sidebar-1">Sidebar 1</button>',
			'  <button id="btn-sidebar-2">Sidebar 2</button>',
			'</div>',
			'<div data-nav-region="main" data-nav-order="2">',
			'  <button id="btn-main-1">Main 1</button>',
			'  <input id="input-filter" type="search" data-filter-input>',
			'  <input id="input-normal" type="text">',
			'</div>',
			'<div data-nav-region="footer" data-nav-order="3">',
			'  <button id="btn-footer-1">Footer 1</button>',
			'</div>'
		].join('\n');
		document.body.appendChild(container);

		// Discover regions
		FocusManager.discoverRegions();

		// Clear history
		FocusManager.clearHistory();
	});

	afterEach(function() {
		// Clean up
		if (container && container.parentNode) {
			container.parentNode.removeChild(container);
		}
		FocusManager.clearHistory();
	});

	describe('Module availability', function() {

		it('is registered', function() {
			expect(Funky.isRegistered('FocusManager')).toBe(true);
		});

		it('has focusAndPush method', function() {
			expect(typeof FocusManager.focusAndPush).toBe('function');
		});

		it('has popFocus method', function() {
			expect(typeof FocusManager.popFocus).toBe('function');
		});

		it('has clearHistory method', function() {
			expect(typeof FocusManager.clearHistory).toBe('function');
		});

		it('has getHistoryLength method', function() {
			expect(typeof FocusManager.getHistoryLength).toBe('function');
		});

		it('has registerRegion method', function() {
			expect(typeof FocusManager.registerRegion).toBe('function');
		});

		it('has completeInput method', function() {
			expect(typeof FocusManager.completeInput).toBe('function');
		});

		it('exports FOCUSABLE_SELECTORS constant', function() {
			expect(typeof FocusManager.FOCUSABLE_SELECTORS).toBe('string');
		});

	});

	describe('Focus History', function() {

		it('starts with empty history', function() {
			expect(FocusManager.getHistoryLength()).toBe(0);
		});

		it('pushes focus to history', function() {
			var btn1 = document.getElementById('btn-sidebar-1');
			var btn2 = document.getElementById('btn-sidebar-2');

			btn1.focus();
			FocusManager.focusAndPush(btn2);

			expect(FocusManager.getHistoryLength()).toBe(1);
			expect(document.activeElement).toBe(btn2);
		});

		it('pops focus returns to previous element', function() {
			var btn1 = document.getElementById('btn-sidebar-1');
			var btn2 = document.getElementById('btn-sidebar-2');

			btn1.focus();
			FocusManager.focusAndPush(btn2);

			var result = FocusManager.popFocus();

			expect(result).toBe(true);
			expect(document.activeElement).toBe(btn1);
			expect(FocusManager.getHistoryLength()).toBe(0);
		});

		it('popFocus returns false when history empty', function() {
			var result = FocusManager.popFocus();
			expect(result).toBe(false);
		});

		it('skips elements no longer in DOM', function() {
			var btn1 = document.getElementById('btn-sidebar-1');
			var btn2 = document.getElementById('btn-sidebar-2');
			var tempBtn = document.createElement('button');
			tempBtn.textContent = 'Temp';
			container.appendChild(tempBtn);

			// Create history: btn1 -> tempBtn -> btn2
			btn1.focus();
			FocusManager.focusAndPush(tempBtn);
			FocusManager.focusAndPush(btn2);

			// Remove tempBtn from DOM
			tempBtn.parentNode.removeChild(tempBtn);

			// Pop should skip tempBtn and return to btn1
			FocusManager.popFocus(); // First pop gets tempBtn (removed), recurses
			expect(document.activeElement).toBe(btn1);
		});

		it('clearHistory removes all entries', function() {
			var btn1 = document.getElementById('btn-sidebar-1');
			var btn2 = document.getElementById('btn-sidebar-2');

			btn1.focus();
			FocusManager.focusAndPush(btn2);
			FocusManager.focusAndPush(btn1);

			FocusManager.clearHistory();
			expect(FocusManager.getHistoryLength()).toBe(0);
		});

		it('does not push body element to history', function() {
			var btn1 = document.getElementById('btn-sidebar-1');

			// Focus body (should not be pushed)
			document.body.focus();
			FocusManager.focusAndPush(btn1);

			expect(FocusManager.getHistoryLength()).toBe(0);
		});

	});

	describe('Region Navigation', function() {

		it('discovers regions from data attributes', function() {
			var regions = FocusManager.getRegions();
			expect(regions.length).toBe(3);
		});

		it('regions are sorted by order', function() {
			var regions = FocusManager.getRegions();
			expect(regions[0].name).toBe('sidebar');
			expect(regions[1].name).toBe('main');
			expect(regions[2].name).toBe('footer');
		});

		it('getCurrentRegion returns correct region', function() {
			var btn = document.getElementById('btn-main-1');
			btn.focus();

			var region = FocusManager.getCurrentRegion();
			expect(region).not.toBeNull();
			expect(region.name).toBe('main');
		});

		it('getCurrentRegion returns null when focus outside regions', function() {
			var externalBtn = document.createElement('button');
			document.body.appendChild(externalBtn);
			externalBtn.focus();

			var region = FocusManager.getCurrentRegion();
			expect(region).toBeNull();

			document.body.removeChild(externalBtn);
		});

		it('nextRegion cycles through regions', function() {
			var sidebarBtn = document.getElementById('btn-sidebar-1');
			sidebarBtn.focus();

			FocusManager.nextRegion();
			expect(FocusManager.getCurrentRegion().name).toBe('main');

			FocusManager.nextRegion();
			expect(FocusManager.getCurrentRegion().name).toBe('footer');

			FocusManager.nextRegion();
			expect(FocusManager.getCurrentRegion().name).toBe('sidebar');
		});

		it('prevRegion cycles backwards', function() {
			var sidebarBtn = document.getElementById('btn-sidebar-1');
			sidebarBtn.focus();

			FocusManager.prevRegion();
			expect(FocusManager.getCurrentRegion().name).toBe('footer');
		});

		it('focusRegion by name focuses first element in region', function() {
			var result = FocusManager.focusRegion('main');
			expect(result).toBe(true);
			expect(document.activeElement.id).toBe('btn-main-1');
		});

		it('focusRegion returns false for unknown region', function() {
			var result = FocusManager.focusRegion('unknown');
			expect(result).toBe(false);
		});

		it('registerRegion adds a new region', function() {
			var newRegion = document.createElement('div');
			newRegion.id = 'custom-region';
			var newBtn = document.createElement('button');
			newBtn.id = 'btn-custom';
			newRegion.appendChild(newBtn);
			container.appendChild(newRegion);

			FocusManager.registerRegion({
				name: 'custom',
				element: newRegion,
				order: 4
			});

			var regions = FocusManager.getRegions();
			expect(regions.length).toBe(4);
			expect(regions[3].name).toBe('custom');
		});

	});

	describe('Input Identification', function() {

		it('isFilterInput identifies filter inputs with data attribute', function() {
			var filterInput = document.getElementById('input-filter');
			expect(FocusManager.isFilterInput(filterInput)).toBe(true);
		});

		it('isFilterInput returns false for normal inputs', function() {
			var normalInput = document.getElementById('input-normal');
			expect(FocusManager.isFilterInput(normalInput)).toBe(false);
		});

		it('isFilterInput returns false for non-inputs', function() {
			var btn = document.getElementById('btn-main-1');
			expect(FocusManager.isFilterInput(btn)).toBe(false);
		});

		it('isFilterInput identifies search type inputs', function() {
			var searchInput = document.createElement('input');
			searchInput.type = 'search';
			container.appendChild(searchInput);

			expect(FocusManager.isFilterInput(searchInput)).toBe(true);
		});

	});

	describe('Input Completion', function() {

		it('completeInput blurs the element', function(done) {
			var filterInput = document.getElementById('input-filter');
			filterInput.focus();

			FocusManager.completeInput({
				element: filterInput,
				returnFocus: false
			});

			// Blur happens synchronously
			expect(document.activeElement).not.toBe(filterInput);
			done();
		});

		it('completeInput clears value when requested', function() {
			var filterInput = document.getElementById('input-filter');
			filterInput.value = 'test query';
			filterInput.focus();

			FocusManager.completeInput({
				element: filterInput,
				clearValue: true,
				returnFocus: false
			});

			expect(filterInput.value).toBe('');
		});

		it('completeInput returns focus after delay', function(done) {
			var btn = document.getElementById('btn-sidebar-1');
			var filterInput = document.getElementById('input-filter');

			btn.focus();
			FocusManager.focusAndPush(filterInput);

			FocusManager.completeInput({
				element: filterInput,
				returnFocus: true
			});

			// Wait for the delayed focus return
			setTimeout(function() {
				expect(document.activeElement).toBe(btn);
				done();
			}, 150);
		});

		it('completeInput uses focusTarget when provided', function(done) {
			var targetBtn = document.getElementById('btn-main-1');
			var filterInput = document.getElementById('input-filter');

			filterInput.focus();

			FocusManager.completeInput({
				element: filterInput,
				focusTarget: targetBtn,
				returnFocus: true
			});

			setTimeout(function() {
				expect(document.activeElement).toBe(targetBtn);
				done();
			}, 150);
		});

	});

	describe('Utility Functions', function() {

		it('getFocusableElements returns focusable elements', function() {
			var mainRegion = document.querySelector('[data-nav-region="main"]');
			var focusables = FocusManager.getFocusableElements(mainRegion);

			expect(focusables.length).toBe(3); // btn-main-1, input-filter, input-normal
		});

		it('isFocusable returns true for focusable elements', function() {
			var btn = document.getElementById('btn-main-1');
			expect(FocusManager.isFocusable(btn)).toBe(true);
		});

		it('isFocusable returns false for non-focusable elements', function() {
			var div = document.createElement('div');
			expect(FocusManager.isFocusable(div)).toBe(false);
		});

	});

});
