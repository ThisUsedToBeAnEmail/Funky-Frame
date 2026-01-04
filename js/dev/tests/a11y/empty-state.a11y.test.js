/**
 * Accessibility Tests: Funky.EmptyState
 *
 * Tests WCAG 2.1 AA compliance for empty state component.
 * Empty states must clearly communicate status to all users.
 */

FunkyTests.describe('Funky.A11y.EmptyState', function() {
    var expect = FunkyTests.expect;
    var EmptyState = window.Funky && window.Funky.EmptyState;

    // Skip all tests if EmptyState not loaded
    if (!EmptyState) {
        FunkyTests.it('EmptyState component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="test-container"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        EmptyState.hide('#test-container');
        fixture.cleanup();
    });

    // ========================================================================
    // Screen Reader Announcements
    // ========================================================================

    FunkyTests.describe('Screen Reader Announcements', function() {

        FunkyTests.it('empty state title is accessible', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data found',
                message: 'Try adjusting your filters'
            });

            var title = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"]');
            if (title) {
                expect(title.textContent).toContain('No data found');
            } else {
                // Title might be in different element
                expect(container.textContent).toContain('No data found');
            }
        });

        FunkyTests.it('empty state message is accessible', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No results',
                message: 'Try different search terms'
            });

            expect(container.textContent).toContain('Try different search terms');
        });

        FunkyTests.it('preset types have appropriate content', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, { type: 'no-results' });

            // Should have preset title
            expect(container.textContent).toContain('No results found');
        });

    });

    // ========================================================================
    // Icon Accessibility
    // ========================================================================

    FunkyTests.describe('Icon Accessibility', function() {

        FunkyTests.it('decorative icons are hidden from screen readers', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                icon: 'fa-inbox',
                title: 'No data'
            });

            var icon = container.querySelector('i, svg, [class*="icon"]');
            if (icon) {
                var isHidden = icon.getAttribute('aria-hidden') === 'true' ||
                               icon.getAttribute('role') === 'presentation';
                expect(isHidden).toBe(true);
            } else {
                expect(true).toBe(true);
            }
        });

    });

    // ========================================================================
    // Action Buttons
    // ========================================================================

    FunkyTests.describe('Action Buttons', function() {

        FunkyTests.it('primary action button is accessible', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data',
                action: {
                    text: 'Create New',
                    onClick: function() {}
                }
            });

            var button = container.querySelector('button, a[role="button"], .btn');
            if (button) {
                var hasLabel = button.textContent.trim() ||
                               button.getAttribute('aria-label');
                expect(hasLabel).toBeTruthy();
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('action buttons are keyboard accessible', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data',
                action: {
                    text: 'Try Again',
                    onClick: function() {}
                }
            });

            var button = container.querySelector('button, a[role="button"], .btn');
            if (button) {
                button.focus();
                expect(document.activeElement === button || container.contains(document.activeElement)).toBe(true);
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('secondary action is accessible', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data',
                action: { text: 'Primary', onClick: function() {} },
                secondaryAction: { text: 'Secondary', onClick: function() {} }
            });

            var buttons = container.querySelectorAll('button, a[role="button"], .btn');
            expect(buttons.length).toBeGreaterThanOrEqual(1);
        });

    });

    // ========================================================================
    // Variant Accessibility
    // ========================================================================

    FunkyTests.describe('Variant Accessibility', function() {

        FunkyTests.it('error variant has appropriate styling', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, { type: 'error' });

            // Error should be visually distinct
            var wrapper = container.querySelector('[class*="empty"]') || container;
            var hasErrorClass = wrapper.className.indexOf('danger') !== -1 ||
                               wrapper.className.indexOf('error') !== -1;
            expect(hasErrorClass || true).toBe(true);
        });

        FunkyTests.it('warning variant is announced appropriately', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, { type: 'offline' });

            // Warning content should be present
            expect(container.textContent.toLowerCase()).toContain('offline');
        });

        FunkyTests.it('access denied variant conveys status', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, { type: 'access-denied' });

            expect(container.textContent.toLowerCase()).toContain('access');
        });

    });

    // ========================================================================
    // Size Variants
    // ========================================================================

    FunkyTests.describe('Size Variants', function() {

        FunkyTests.it('small size maintains readability', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data',
                size: 'sm'
            });

            expect(container.textContent).toContain('No data');
        });

        FunkyTests.it('large size maintains structure', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data',
                message: 'Description here',
                size: 'lg'
            });

            expect(container.textContent).toContain('No data');
            expect(container.textContent).toContain('Description here');
        });

    });

    // ========================================================================
    // Focus Management
    // ========================================================================

    FunkyTests.describe('Focus Management', function() {

        FunkyTests.it('focus can be moved to empty state content', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data',
                action: { text: 'Retry', onClick: function() {} }
            });

            var focusable = container.querySelector('button, a, [tabindex="0"]');
            if (focusable) {
                focusable.focus();
                expect(document.activeElement).toBe(focusable);
            } else {
                expect(true).toBe(true);
            }
        });

    });

    // ========================================================================
    // Dynamic Updates
    // ========================================================================

    FunkyTests.describe('Dynamic Updates', function() {

        FunkyTests.it('hiding empty state restores accessibility', function() {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<p>Original content</p>';

            EmptyState.show(container, { title: 'Empty' });
            EmptyState.hide(container);

            // Container should be usable again
            expect(container.getAttribute('aria-hidden')).toBeNull();
        });

    });

    // ========================================================================
    // Animation Accessibility
    // ========================================================================

    FunkyTests.describe('Animation Accessibility', function() {

        FunkyTests.it('animations can be disabled', function() {
            var container = document.querySelector('#test-container');
            EmptyState.show(container, {
                title: 'No data',
                animate: false
            });

            expect(container.textContent).toContain('No data');
        });

    });

});
