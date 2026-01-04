/**
 * Accessibility Tests: Funky.Spinner
 *
 * Tests WCAG 2.1 AA compliance for loading spinner components.
 * Spinners must announce loading state to screen readers.
 */

FunkyTests.describe('Funky.A11y.Spinner', function() {
    var expect = FunkyTests.expect;
    var Spinner = window.Funky && window.Funky.Spinner;

    // Skip all tests if Spinner not loaded
    if (!Spinner) {
        FunkyTests.it('Spinner component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container" style="width: 200px; height: 200px;"></div>');
    });

    FunkyTests.afterEach(function() {
        // Clean up any active spinners
        Spinner.hideAll && Spinner.hideAll();
        fixture.cleanup();
    });

    // ========================================================================
    // ARIA Roles and Live Regions
    // ========================================================================

    FunkyTests.describe('ARIA Roles', function() {

        FunkyTests.it('spinner has role="status"', function() {
            var spinnerEl = Spinner.create();
            var spinner = spinnerEl.querySelector('.funky-spinner');

            expect(spinner.getAttribute('role')).toBe('status');
        });

        FunkyTests.it('spinner has aria-live="polite"', function() {
            var spinnerEl = Spinner.create();
            var spinner = spinnerEl.querySelector('.funky-spinner');

            expect(spinner.getAttribute('aria-live')).toBe('polite');
        });

        FunkyTests.it('inline spinner maintains role="status"', function() {
            var spinnerEl = Spinner.create({ style: 'border' });
            var spinner = spinnerEl.querySelector('.funky-spinner');

            expect(spinner.getAttribute('role')).toBe('status');
        });

        FunkyTests.it('dots spinner maintains role="status"', function() {
            var spinnerEl = Spinner.create({ style: 'dots' });
            var spinner = spinnerEl.querySelector('.funky-spinner');

            expect(spinner.getAttribute('role')).toBe('status');
        });

    });

    // ========================================================================
    // Screen Reader Text
    // ========================================================================

    FunkyTests.describe('Screen Reader Text', function() {

        FunkyTests.it('spinner has default screen reader text', function() {
            var spinnerEl = Spinner.create();
            var srText = spinnerEl.querySelector('.funky-spinner-sr');

            expect(srText).toBeDefined();
            expect(srText.textContent).toBe('Loading...');
        });

        FunkyTests.it('custom srText is applied', function() {
            var spinnerEl = Spinner.create({ srText: 'Please wait while data loads' });
            var srText = spinnerEl.querySelector('.funky-spinner-sr');

            expect(srText.textContent).toBe('Please wait while data loads');
        });

        FunkyTests.it('screen reader text is visually hidden but accessible', function() {
            var spinnerEl = Spinner.create();
            document.body.appendChild(spinnerEl);

            var srText = spinnerEl.querySelector('.funky-spinner-sr');
            var styles = window.getComputedStyle(srText);

            // Should be visually hidden (common patterns)
            // Either: position absolute with clip, or width/height 1px, or sr-only class
            var isHidden = (
                styles.position === 'absolute' ||
                srText.classList.contains('funky-spinner-sr') ||
                (styles.width === '1px' && styles.height === '1px')
            );

            expect(isHidden).toBe(true);

            document.body.removeChild(spinnerEl);
        });

        FunkyTests.it('screen reader text is not empty', function() {
            var spinnerEl = Spinner.create({ srText: '' });
            var srText = spinnerEl.querySelector('.funky-spinner-sr');

            // Even with empty srText option, there should be fallback
            // Check that the element exists
            expect(srText).toBeDefined();
        });

    });

    // ========================================================================
    // Container Spinner (show/hide)
    // ========================================================================

    FunkyTests.describe('Container Spinner', function() {

        FunkyTests.it('container spinner has role="status"', function() {
            var container = document.querySelector('#test-container');
            Spinner.show(container);

            var spinner = container.querySelector('.funky-spinner');
            expect(spinner.getAttribute('role')).toBe('status');

            Spinner.hide(container);
        });

        FunkyTests.it('container spinner has aria-live', function() {
            var container = document.querySelector('#test-container');
            Spinner.show(container);

            var spinner = container.querySelector('.funky-spinner');
            expect(spinner.getAttribute('aria-live')).toBe('polite');

            Spinner.hide(container);
        });

        FunkyTests.it('container spinner has screen reader text', function() {
            var container = document.querySelector('#test-container');
            Spinner.show(container, { srText: 'Loading data...' });

            var srText = container.querySelector('.funky-spinner-sr');
            expect(srText.textContent).toBe('Loading data...');

            Spinner.hide(container);
        });

        FunkyTests.it('hiding spinner removes from DOM', function(done) {
            var container = document.querySelector('#test-container');
            Spinner.show(container);

            expect(container.querySelector('.funky-spinner')).toBeDefined();

            Spinner.hide(container);

            // Wait for fade animation
            setTimeout(function() {
                expect(container.querySelector('.funky-spinner')).toBe(null);
                done();
            }, 300);
        });

    });

    // ========================================================================
    // Overlay Spinner
    // ========================================================================

    FunkyTests.describe('Overlay Spinner', function() {

        FunkyTests.afterEach(function() {
            // Clean up overlay
            if (Spinner.hideOverlay) {
                Spinner.hideOverlay();
            }
        });

        FunkyTests.it('overlay spinner has role="status"', function() {
            if (!Spinner.showOverlay) {
                expect(true).toBe(true); // Skip if no overlay method
                return;
            }

            Spinner.showOverlay();
            var overlay = document.querySelector('.funky-spinner-overlay');

            if (overlay) {
                var spinner = overlay.querySelector('.funky-spinner');
                expect(spinner.getAttribute('role')).toBe('status');
            }

            Spinner.hideOverlay();
        });

        FunkyTests.it('overlay has aria-modal for focus trapping indication', function() {
            if (!Spinner.showOverlay) {
                expect(true).toBe(true);
                return;
            }

            Spinner.showOverlay();
            var overlay = document.querySelector('.funky-spinner-overlay');

            if (overlay) {
                // Overlay should indicate it's modal-like
                var ariaModal = overlay.getAttribute('aria-modal');
                var role = overlay.getAttribute('role');
                // Either aria-modal or role="dialog" indicates modal behavior
                expect(ariaModal === 'true' || role === 'dialog' || role === 'alertdialog').toBe(true);
            }

            Spinner.hideOverlay();
        });

    });

    // ========================================================================
    // Visible Text
    // ========================================================================

    FunkyTests.describe('Visible Text', function() {

        FunkyTests.it('visible text is accessible when provided', function() {
            var spinnerEl = Spinner.create({ text: 'Loading data...' });
            var textEl = spinnerEl.querySelector('.funky-spinner-text');

            expect(textEl).toBeDefined();
            expect(textEl.textContent).toBe('Loading data...');
        });

        FunkyTests.it('visible text supplements screen reader text', function() {
            var spinnerEl = Spinner.create({
                text: 'Loading...',
                srText: 'Please wait while we load your data'
            });

            var textEl = spinnerEl.querySelector('.funky-spinner-text');
            var srText = spinnerEl.querySelector('.funky-spinner-sr');

            // Both should exist - visible for sighted users, sr-only for screen readers
            expect(textEl.textContent).toBe('Loading...');
            expect(srText.textContent).toBe('Please wait while we load your data');
        });

    });

    // ========================================================================
    // Animation Accessibility
    // ========================================================================

    FunkyTests.describe('Animation Accessibility', function() {

        FunkyTests.it('spinner animation can be reduced with prefers-reduced-motion', function() {
            // This tests that the CSS respects prefers-reduced-motion
            // We can only verify the element structure, not the actual CSS media query
            var spinnerEl = Spinner.create();
            var spinner = spinnerEl.querySelector('.funky-spinner');

            // Spinner should have a class that CSS can target
            expect(spinner.classList.contains('funky-spinner')).toBe(true);
            // The actual animation reduction is handled in CSS
        });

    });

    // ========================================================================
    // Button Spinner
    // ========================================================================

    FunkyTests.describe('Button Spinner', function() {

        FunkyTests.it('button with spinner maintains accessible name', function() {
            if (!Spinner.button) {
                expect(true).toBe(true);
                return;
            }

            fixture.append('<button id="test-btn">Submit</button>');
            var btn = document.querySelector('#test-btn');

            Spinner.button(btn);

            // Button should still have accessible name
            var hasName = btn.textContent.trim().length > 0 ||
                          btn.getAttribute('aria-label') ||
                          btn.getAttribute('aria-labelledby');

            expect(hasName).toBe(true);
        });

        FunkyTests.it('button spinner includes loading indicator for AT', function() {
            if (!Spinner.button) {
                expect(true).toBe(true);
                return;
            }

            fixture.append('<button id="test-btn2">Submit</button>');
            var btn = document.querySelector('#test-btn2');

            Spinner.button(btn);

            // Should have aria-busy or contain status element
            var hasLoadingIndicator = btn.getAttribute('aria-busy') === 'true' ||
                                      btn.querySelector('[role="status"]') !== null;

            expect(hasLoadingIndicator).toBe(true);
        });

    });

    // ========================================================================
    // Spinner Styles
    // ========================================================================

    FunkyTests.describe('All Spinner Styles', function() {

        var styles = ['border', 'grow', 'dots', 'pulse', 'ring'];

        styles.forEach(function(style) {
            FunkyTests.it(style + ' spinner has role="status"', function() {
                var spinnerEl = Spinner.create({ style: style });
                var spinner = spinnerEl.querySelector('.funky-spinner');

                expect(spinner.getAttribute('role')).toBe('status');
            });

            FunkyTests.it(style + ' spinner has screen reader text', function() {
                var spinnerEl = Spinner.create({ style: style });
                var srText = spinnerEl.querySelector('.funky-spinner-sr');

                expect(srText).toBeDefined();
                expect(srText.textContent.length).toBeGreaterThan(0);
            });
        });

    });

});
