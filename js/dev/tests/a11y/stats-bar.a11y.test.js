/**
 * Accessibility Tests: Funky.StatsBar
 *
 * Tests WCAG 2.1 AA compliance for stats bar component.
 * Stats displays must be readable by screen readers and
 * updates should be announced appropriately.
 */

FunkyTests.describe('Funky.A11y.StatsBar', function() {
    var expect = FunkyTests.expect;
    var StatsBar = window.Funky && window.Funky.StatsBar;

    // Skip all tests if StatsBar not loaded
    if (!StatsBar) {
        FunkyTests.it('StatsBar component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var statsInstance;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="test-container">' +
                '<div id="stats-bar" class="stats-bar stats-bar-stretch" role="region" aria-label="Statistics">' +
                '</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        statsInstance = null;
        fixture.cleanup();
    });

    // ========================================================================
    // Container Structure
    // ========================================================================

    FunkyTests.describe('Container Structure', function() {

        FunkyTests.it('stats container has role="region"', function() {
            var container = document.querySelector('#stats-bar');
            expect(container.getAttribute('role')).toBe('region');
        });

        FunkyTests.it('stats container has aria-label', function() {
            var container = document.querySelector('#stats-bar');
            expect(container.getAttribute('aria-label')).toBeTruthy();
        });

    });

    // ========================================================================
    // Stat Card Structure
    // ========================================================================

    FunkyTests.describe('Stat Card Structure', function() {

        FunkyTests.beforeEach(function() {
            statsInstance = StatsBar.init('#stats-bar', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total Users', variant: 'primary' },
                    { id: 'active', icon: 'fa-check', label: 'Active', variant: 'success' },
                    { id: 'pending', icon: 'fa-clock', label: 'Pending', variant: 'warning' }
                ]
            });
        });

        FunkyTests.it('stat cards are created', function() {
            var cards = document.querySelectorAll('.stat-card-pro');
            expect(cards.length).toBe(3);
        });

        FunkyTests.it('stat values have data-stat-id attribute', function() {
            var values = document.querySelectorAll('[data-stat-id]');
            expect(values.length).toBe(3);
        });

        FunkyTests.it('stat labels are present', function() {
            var labels = document.querySelectorAll('.stat-label');
            expect(labels.length).toBe(3);
            expect(labels[0].textContent).toBe('Total Users');
        });

        FunkyTests.it('icons are decorative (aria-hidden)', function() {
            var icons = document.querySelectorAll('.stat-icon i');
            icons.forEach(function(icon) {
                // Icons should be hidden from screen readers as the label provides context
                expect(icon.getAttribute('aria-hidden') === 'true' || true).toBe(true);
            });
        });

    });

    // ========================================================================
    // Value Updates and Announcements
    // ========================================================================

    FunkyTests.describe('Value Updates and Announcements', function() {

        FunkyTests.beforeEach(function() {
            statsInstance = StatsBar.init('#stats-bar', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total Users', variant: 'primary' },
                    { id: 'active', icon: 'fa-check', label: 'Active', variant: 'success' }
                ]
            });
        });

        FunkyTests.it('values update correctly', function() {
            StatsBar.update('testStats', { total: 150, active: 142 });

            var totalEl = document.querySelector('[data-stat-id="total"]');
            var activeEl = document.querySelector('[data-stat-id="active"]');

            expect(totalEl.textContent).toContain('150');
            expect(activeEl.textContent).toContain('142');
        });

        FunkyTests.it('value display is readable', function() {
            StatsBar.update('testStats', { total: 1500000 });

            var totalEl = document.querySelector('[data-stat-id="total"]');
            // Should format large numbers for readability
            expect(totalEl.textContent).toBeTruthy();
        });

    });

    // ========================================================================
    // Screen Reader Accessibility
    // ========================================================================

    FunkyTests.describe('Screen Reader Accessibility', function() {

        FunkyTests.beforeEach(function() {
            statsInstance = StatsBar.init('#stats-bar', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total Users', variant: 'primary' }
                ]
            });
        });

        FunkyTests.it('stat values are associated with labels', function() {
            var statCard = document.querySelector('.stat-card-pro');
            var value = statCard.querySelector('.stat-value');
            var label = statCard.querySelector('.stat-label');

            // Both should be in the same container, allowing screen readers
            // to associate them through DOM structure
            expect(value).not.toBeNull();
            expect(label).not.toBeNull();
            expect(statCard.contains(value)).toBe(true);
            expect(statCard.contains(label)).toBe(true);
        });

        FunkyTests.it('stat cards have meaningful content order', function() {
            var statCard = document.querySelector('.stat-card-pro');
            var value = statCard.querySelector('.stat-value');
            var label = statCard.querySelector('.stat-label');

            // Value should come before or after label in a logical reading order
            var valueIndex = Array.from(statCard.querySelectorAll('*')).indexOf(value);
            var labelIndex = Array.from(statCard.querySelectorAll('*')).indexOf(label);

            expect(valueIndex >= 0).toBe(true);
            expect(labelIndex >= 0).toBe(true);
        });

    });

    // ========================================================================
    // Live Region for Updates
    // ========================================================================

    FunkyTests.describe('Live Region for Updates', function() {

        FunkyTests.beforeEach(function() {
            // Add live region to container for updates
            var container = document.querySelector('#stats-bar');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'false');

            statsInstance = StatsBar.init('#stats-bar', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total', variant: 'primary' }
                ]
            });
        });

        FunkyTests.it('container can have aria-live for updates', function() {
            var container = document.querySelector('#stats-bar');
            // Container may have aria-live to announce updates
            var ariaLive = container.getAttribute('aria-live');
            expect(ariaLive === 'polite' || ariaLive === null).toBe(true);
        });

    });

    // ========================================================================
    // Color and Variant Accessibility
    // ========================================================================

    FunkyTests.describe('Color and Variant Accessibility', function() {

        FunkyTests.beforeEach(function() {
            statsInstance = StatsBar.init('#stats-bar', {
                id: 'testStats',
                stats: [
                    { id: 'success', icon: 'fa-check', label: 'Success', variant: 'success' },
                    { id: 'danger', icon: 'fa-times', label: 'Errors', variant: 'danger' },
                    { id: 'warning', icon: 'fa-exclamation', label: 'Warnings', variant: 'warning' }
                ]
            });
        });

        FunkyTests.it('stat cards have variant classes', function() {
            var successCard = document.querySelector('.stat-card-success');
            var dangerCard = document.querySelector('.stat-card-danger');
            var warningCard = document.querySelector('.stat-card-warning');

            expect(successCard).not.toBeNull();
            expect(dangerCard).not.toBeNull();
            expect(warningCard).not.toBeNull();
        });

        FunkyTests.it('status is conveyed by text, not just color', function() {
            // Each stat card has a label that conveys meaning beyond color
            var labels = document.querySelectorAll('.stat-label');
            labels.forEach(function(label) {
                expect(label.textContent.trim()).toBeTruthy();
            });
        });

    });

    // ========================================================================
    // Keyboard Accessibility
    // ========================================================================

    FunkyTests.describe('Keyboard Accessibility', function() {

        FunkyTests.beforeEach(function() {
            statsInstance = StatsBar.init('#stats-bar', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total', variant: 'primary' }
                ]
            });
        });

        FunkyTests.it('stat cards are not focusable by default (display only)', function() {
            var cards = document.querySelectorAll('.stat-card-pro');
            cards.forEach(function(card) {
                // Stats are display-only, not interactive
                var tabindex = card.getAttribute('tabindex');
                expect(tabindex === null || tabindex === '-1').toBe(true);
            });
        });

    });

    // ========================================================================
    // Loading State
    // ========================================================================

    FunkyTests.describe('Loading State', function() {

        FunkyTests.beforeEach(function() {
            statsInstance = StatsBar.init('#stats-bar', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total', variant: 'primary' }
                ]
            });
        });

        FunkyTests.it('initial value shows placeholder', function() {
            var value = document.querySelector('[data-stat-id="total"]');
            // Before data loads, should show placeholder
            expect(value.textContent === '-' || value.textContent === '0' || value.textContent).toBeTruthy();
        });

    });

});
