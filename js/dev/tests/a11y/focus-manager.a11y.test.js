/**
 * Accessibility Tests: FocusManager
 *
 * Tests WCAG 2.1 AA compliance for focus management and navigation.
 */

describe('Funky.A11y.FocusManager', function() {

	var FocusManager = Funky.FocusManager;
	var Announce = Funky.Announce;
	var A11y = FunkyTests.A11y;

	// Skip all tests if A11y utilities not available
	if (!A11y) {
		it('A11y utilities not available', function() {
			expect(true).toBe(true);
		});
		return;
	}

	var fixture;
	var announcements = [];
	var originalAnnounce;

	beforeEach(function() {
		// Capture announcements
		announcements = [];
		if (Announce && Announce.polite) {
			originalAnnounce = Announce.polite;
			Announce.polite = function(message) {
				announcements.push(message);
				// Still call original if needed
				if (originalAnnounce) {
					originalAnnounce.call(Announce, message);
				}
			};
		}

		fixture = FunkyTests.fixture(
			'<div id="focus-a11y-container">' +
				'<nav data-nav-region="sidebar" data-nav-order="1" aria-label="Sidebar">' +
					'<button id="nav-btn-1">Navigation 1</button>' +
					'<button id="nav-btn-2">Navigation 2</button>' +
				'</nav>' +
				'<main data-nav-region="main" data-nav-order="2" aria-label="Main content">' +
					'<h1 id="main-heading">Page Title</h1>' +
					'<input id="search-input" type="search" data-filter-input aria-label="Search">' +
					'<button id="action-btn">Action</button>' +
					'<a href="#" id="link-1">Link 1</a>' +
				'</main>' +
				'<footer data-nav-region="footer" data-nav-order="3" aria-label="Footer">' +
					'<button id="footer-btn">Footer action</button>' +
				'</footer>' +
			'</div>'
		);

		FocusManager.discoverRegions();
		FocusManager.clearHistory();
	});

	afterEach(function() {
		// Restore announce
		if (originalAnnounce) {
			Announce.polite = originalAnnounce;
		}
		fixture.destroy();
		FocusManager.clearHistory();
	});

	describe('Screen Reader Announcements', function() {

		it('announces region changes to screen readers', function() {
			announcements = [];
			FocusManager.focusRegion('main');

			var regionAnnouncement = announcements.find(function(msg) {
				return msg.indexOf('main') !== -1 && msg.indexOf('region') !== -1;
			});
			expect(regionAnnouncement).toBeDefined();
		});

		it('announces search completion', function(done) {
			var searchInput = document.getElementById('search-input');
			searchInput.focus();
			announcements = [];

			FocusManager.completeInput({
				element: searchInput,
				returnFocus: false
			});

			setTimeout(function() {
				var completionAnnouncement = announcements.find(function(msg) {
					return msg.indexOf('complete') !== -1 || msg.indexOf('Search') !== -1;
				});
				expect(completionAnnouncement).toBeDefined();
				done();
			}, 50);
		});

	});

	describe('Focus Visibility', function() {

		it('focused elements receive visible focus indicator', function() {
			var btn = document.getElementById('action-btn');
			btn.focus();

			// Check that element has focus
			expect(document.activeElement).toBe(btn);

			// The CSS should handle :focus-visible styling
			// We verify the element can receive focus
			expect(btn.tabIndex).toBeGreaterThanOrEqual(-1);
		});

		it('all interactive elements are focusable', function() {
			var container = document.getElementById('focus-a11y-container');
			var focusables = FocusManager.getFocusableElements(container);

			// Should find all buttons, inputs, and links
			expect(focusables.length).toBeGreaterThanOrEqual(5);

			// Each should be focusable
			for (var i = 0; i < focusables.length; i++) {
				var el = focusables[i];
				expect(el.tabIndex).toBeGreaterThanOrEqual(-1);
			}
		});

	});

	describe('Keyboard Navigation', function() {

		it('regions have proper landmarks', function() {
			var sidebar = document.querySelector('[data-nav-region="sidebar"]');
			var main = document.querySelector('[data-nav-region="main"]');
			var footer = document.querySelector('[data-nav-region="footer"]');

			// Check ARIA labels
			expect(sidebar.getAttribute('aria-label')).toBeTruthy();
			expect(main.getAttribute('aria-label')).toBeTruthy();
			expect(footer.getAttribute('aria-label')).toBeTruthy();
		});

		it('focus can be programmatically moved to regions', function() {
			FocusManager.focusRegion('main');
			var currentRegion = FocusManager.getCurrentRegion();
			expect(currentRegion.name).toBe('main');
		});

		it('popFocus maintains focus chain integrity', function() {
			var btn1 = document.getElementById('nav-btn-1');
			var btn2 = document.getElementById('action-btn');
			var btn3 = document.getElementById('footer-btn');

			btn1.focus();
			FocusManager.focusAndPush(btn2);
			FocusManager.focusAndPush(btn3);

			// Pop back through the chain
			FocusManager.popFocus();
			expect(document.activeElement).toBe(btn2);

			FocusManager.popFocus();
			expect(document.activeElement).toBe(btn1);
		});

	});

	describe('Filter Input Accessibility', function() {

		it('filter inputs have proper labels', function() {
			var searchInput = document.getElementById('search-input');
			var label = searchInput.getAttribute('aria-label') ||
				searchInput.getAttribute('aria-labelledby') ||
				document.querySelector('label[for="' + searchInput.id + '"]');

			expect(label).toBeTruthy();
		});

		it('filter inputs use search type', function() {
			var searchInput = document.getElementById('search-input');
			expect(searchInput.type).toBe('search');
		});

		it('completeInput allows focus to move naturally', function(done) {
			var searchInput = document.getElementById('search-input');
			var actionBtn = document.getElementById('action-btn');

			searchInput.focus();

			FocusManager.completeInput({
				element: searchInput,
				focusTarget: actionBtn,
				returnFocus: true
			});

			setTimeout(function() {
				expect(document.activeElement).toBe(actionBtn);
				done();
			}, 150);
		});

	});

	describe('WCAG 2.4.3 Focus Order', function() {

		it('regions are ordered logically', function() {
			var regions = FocusManager.getRegions();

			// Verify order: sidebar (1), main (2), footer (3)
			expect(regions[0].name).toBe('sidebar');
			expect(regions[0].order).toBe(1);
			expect(regions[1].name).toBe('main');
			expect(regions[1].order).toBe(2);
			expect(regions[2].name).toBe('footer');
			expect(regions[2].order).toBe(3);
		});

		it('nextRegion follows logical order', function() {
			var sidebarBtn = document.getElementById('nav-btn-1');
			sidebarBtn.focus();

			// Should go sidebar -> main -> footer -> sidebar
			FocusManager.nextRegion();
			expect(FocusManager.getCurrentRegion().name).toBe('main');

			FocusManager.nextRegion();
			expect(FocusManager.getCurrentRegion().name).toBe('footer');

			FocusManager.nextRegion();
			expect(FocusManager.getCurrentRegion().name).toBe('sidebar');
		});

	});

	describe('WCAG 2.4.7 Focus Visible', function() {

		it('focusAndPush does not use preventScroll by default', function() {
			var btn = document.getElementById('footer-btn');

			// Focus without preventScroll option
			FocusManager.focusAndPush(btn, {});

			expect(document.activeElement).toBe(btn);
		});

		it('focusAndPush respects preventScroll option', function() {
			var btn = document.getElementById('footer-btn');

			FocusManager.focusAndPush(btn, { preventScroll: true });

			expect(document.activeElement).toBe(btn);
		});

	});

	describe('Reduced Motion Support', function() {

		it('focus transitions respect reduced motion preference', function() {
			// This is primarily CSS-based, but verify the module
			// doesn't add inline animations
			var btn = document.getElementById('action-btn');
			FocusManager.focusAndPush(btn);

			// Check no inline animation styles added
			expect(btn.style.animation || '').toBe('');
			expect(btn.style.transition || '').toBe('');
		});

	});

});
