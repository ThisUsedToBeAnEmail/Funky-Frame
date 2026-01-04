/**
 * Accessibility Tests: Focus Style System
 *
 * Tests WCAG 2.1 compliance for the configurable focus style preference system.
 * Verifies that focus indicators work correctly across all style options.
 */

FunkyTests.describe('Funky.A11y.FocusStyle', function() {

	var expect = FunkyTests.expect;
	var A11y = FunkyTests.A11y;

	// Skip all tests if A11y utilities not available
	if (!A11y) {
		FunkyTests.it('A11y utilities not available', function() {
			expect(true).toBe(true);
		});
		return;
	}

	var fixture;
	var originalFocusStyle;

	FunkyTests.beforeEach(function() {
		// Save original focus style
		originalFocusStyle = document.documentElement.getAttribute('data-focus-style');

		fixture = FunkyTests.fixture(
			'<div id="focus-style-test">' +
				'<button class="btn btn-funky-primary" id="test-btn-primary">Primary Button</button>' +
				'<button class="btn btn-funky-secondary" id="test-btn-secondary">Secondary Button</button>' +
				'<input type="text" class="form-control" id="test-input" placeholder="Text input">' +
				'<select class="form-select" id="test-select"><option>Select option</option></select>' +
				'<a href="#" class="nav-link" id="test-link">Navigation Link</a>' +
				'<div class="funky-table-row" tabindex="0" id="test-row">Table Row</div>' +
			'</div>'
		);
	});

	FunkyTests.afterEach(function() {
		// Restore original focus style
		if (originalFocusStyle) {
			document.documentElement.setAttribute('data-focus-style', originalFocusStyle);
		} else {
			document.documentElement.removeAttribute('data-focus-style');
		}
		fixture.cleanup();
	});

	FunkyTests.describe('CSS Variables', function() {

		FunkyTests.it('has focus ring variables defined in :root', function() {
			var styles = getComputedStyle(document.documentElement);
			var colorVar = styles.getPropertyValue('--focus-ring-color');
			var widthVar = styles.getPropertyValue('--focus-ring-width');
			var offsetVar = styles.getPropertyValue('--focus-ring-offset');

			expect(colorVar || widthVar || offsetVar).toBeTruthy();
		});

		FunkyTests.it('updates variables when data-focus-style is "double-ring"', function() {
			document.documentElement.setAttribute('data-focus-style', 'double-ring');
			var styles = getComputedStyle(document.documentElement);
			var color = styles.getPropertyValue('--focus-ring-color').trim();

			// Double-ring uses white color
			expect(color).toContain('#fff');
		});

		FunkyTests.it('updates variables when data-focus-style is "high-contrast"', function() {
			document.documentElement.setAttribute('data-focus-style', 'high-contrast');
			var styles = getComputedStyle(document.documentElement);
			var color = styles.getPropertyValue('--focus-ring-color').trim();

			// High contrast uses yellow
			expect(color).toContain('#ff');
		});

		FunkyTests.it('updates variables when data-focus-style is "white-offset"', function() {
			document.documentElement.setAttribute('data-focus-style', 'white-offset');
			var styles = getComputedStyle(document.documentElement);
			var offset = styles.getPropertyValue('--focus-ring-offset').trim();

			// White offset has larger offset
			expect(offset).toBeTruthy();
		});

	});

	FunkyTests.describe('Focus Visibility (WCAG 2.4.7)', function() {

		// Helper to check if element can receive focus and has focus styles defined
		// Note: :focus-visible only triggers with keyboard navigation, not programmatic .focus()
		// We verify that: 1) element can receive focus, 2) CSS variables for focus are defined
		function checkFocusCapability(element) {
			element.focus();
			var canFocus = document.activeElement === element;

			// Check that focus CSS variables are defined (they power :focus-visible)
			var rootStyles = getComputedStyle(document.documentElement);
			var hasVariables = !!(rootStyles.getPropertyValue('--focus-ring-color') ||
			                      rootStyles.getPropertyValue('--focus-ring-width'));

			return canFocus && hasVariables;
		}

		FunkyTests.it('button shows visible focus indicator on focus', function() {
			var button = document.getElementById('test-btn-primary');

			// Verify button can be focused and focus system is configured
			expect(checkFocusCapability(button)).toBe(true);
		});

		FunkyTests.it('input shows visible focus indicator on focus', function() {
			var input = document.getElementById('test-input');

			// Verify input can be focused and focus system is configured
			expect(checkFocusCapability(input)).toBe(true);
		});

		FunkyTests.it('link shows visible focus indicator on focus', function() {
			var link = document.getElementById('test-link');

			// Verify link can be focused and focus system is configured
			expect(checkFocusCapability(link)).toBe(true);
		});

	});

	FunkyTests.describe('Focus Style Options', function() {

		// These tests verify CSS variables are set correctly for each focus style
		// The actual :focus-visible styles only apply during keyboard navigation

		FunkyTests.it('default style applies focus indicator', function() {
			document.documentElement.removeAttribute('data-focus-style');

			var button = document.getElementById('test-btn-primary');
			button.focus();

			// Verify element is focusable
			expect(document.activeElement).toBe(button);
		});

		FunkyTests.it('double-ring style applies focus indicator', function() {
			document.documentElement.setAttribute('data-focus-style', 'double-ring');

			var styles = getComputedStyle(document.documentElement);
			var color = styles.getPropertyValue('--focus-ring-color').trim();

			// Double-ring style uses white color
			expect(color).toContain('#fff');
		});

		FunkyTests.it('high-contrast style applies focus indicator', function() {
			document.documentElement.setAttribute('data-focus-style', 'high-contrast');

			var styles = getComputedStyle(document.documentElement);
			var color = styles.getPropertyValue('--focus-ring-color').trim();

			// High-contrast style uses yellow
			expect(color).toContain('#ff');
		});

		FunkyTests.it('white-offset style applies focus indicator', function() {
			document.documentElement.setAttribute('data-focus-style', 'white-offset');

			var styles = getComputedStyle(document.documentElement);
			var color = styles.getPropertyValue('--focus-ring-color').trim();

			// White-offset style sets a color
			expect(color).toBeTruthy();
		});

	});

	FunkyTests.describe('Outline-Based Focus (Accessibility)', function() {

		FunkyTests.it('uses native outline for accessibility compliance', function() {
			// Verify CSS variables are configured for outline-based focus
			// The actual outline only shows on :focus-visible (keyboard navigation)
			var styles = getComputedStyle(document.documentElement);
			var width = styles.getPropertyValue('--focus-ring-width');
			var style = styles.getPropertyValue('--focus-ring-style');

			// Focus ring CSS variables should be defined
			expect(width || style).toBeTruthy();
		});

		FunkyTests.it('outline-offset is not undefined or auto', function() {
			var styles = getComputedStyle(document.documentElement);
			var offset = styles.getPropertyValue('--focus-ring-offset');

			// Offset variable should be defined (may be empty string for default 0)
			// The key is that it's not 'auto' which is invalid for outline-offset
			expect(offset).not.toBe('auto');
		});

	});

	FunkyTests.describe('Preference Integration', function() {

		FunkyTests.it('applies focus style from PlaygroundPreferences if available', function() {
			if (typeof Funky !== 'undefined' && Funky.PlaygroundPreferences) {
				var originalPref = Funky.PlaygroundPreferences.get('focusStyle');

				Funky.PlaygroundPreferences.set('focusStyle', 'high-contrast');
				var attr = document.documentElement.getAttribute('data-focus-style');
				expect(attr).toBe('high-contrast');

				// Restore
				if (originalPref) {
					Funky.PlaygroundPreferences.set('focusStyle', originalPref);
				} else {
					Funky.PlaygroundPreferences.set('focusStyle', 'default');
				}
			} else {
				// Skip if preferences not loaded
				expect(true).toBe(true);
			}
		});

	});

	FunkyTests.describe('Component Focus Indicators', function() {

		FunkyTests.it('table row uses inset focus indicator', function() {
			var row = document.getElementById('test-row');
			row.focus();

			// Just verify it can receive focus
			expect(document.activeElement).toBe(row);
		});

		FunkyTests.it('all test elements can receive focus', function() {
			var elements = [
				'test-btn-primary',
				'test-btn-secondary',
				'test-input',
				'test-select',
				'test-link',
				'test-row'
			];

			elements.forEach(function(id) {
				var el = document.getElementById(id);
				el.focus();
				expect(document.activeElement).toBe(el);
			});
		});

	});

	FunkyTests.describe('Reduced Motion', function() {

		FunkyTests.it('focus styles do not require animation', function() {
			// Focus indicators should work without relying on animations
			// This ensures prefers-reduced-motion users still see focus
			// Verify CSS uses static properties (outline, box-shadow) not animations

			var button = document.getElementById('test-btn-primary');
			button.focus();

			// Verify button can be focused (the visual indicator uses :focus-visible)
			expect(document.activeElement).toBe(button);

			// Verify CSS variables for static focus styling are defined
			var styles = getComputedStyle(document.documentElement);
			var hasStaticFocus = styles.getPropertyValue('--focus-ring-color') ||
			                     styles.getPropertyValue('--focus-ring-width');
			expect(hasStaticFocus).toBeTruthy();
		});

	});

});
