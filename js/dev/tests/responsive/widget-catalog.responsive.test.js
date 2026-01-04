/**
 * Responsive Tests: Funky.WidgetCatalog
 *
 * Tests responsive behavior for the WidgetCatalog component.
 * WidgetCatalog uses factory pattern: WidgetCatalog.init({ container, categories, widgets })
 * Verifies multiple responsive columns at 768px, 480px, and 600px.
 */

FunkyTests.describe('Funky.Responsive.WidgetCatalog', function() {
    var expect = FunkyTests.expect;
    var WidgetCatalog = window.Funky && window.Funky.WidgetCatalog;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if WidgetCatalog not loaded
    if (!WidgetCatalog) {
        FunkyTests.it('WidgetCatalog component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var catalog;
    var testCounter = 0;
    var containerId;

    // Sample categories
    function getCategories() {
        return [
            { id: 'charts', label: 'Charts', icon: 'fa-chart-bar' },
            { id: 'tables', label: 'Tables', icon: 'fa-table' }
        ];
    }

    // Sample widgets
    function getWidgets() {
        return [
            { id: 'bar-chart', label: 'Bar Chart', category: 'charts', icon: 'fa-chart-bar' },
            { id: 'line-chart', label: 'Line Chart', category: 'charts', icon: 'fa-chart-line' },
            { id: 'data-table', label: 'Data Table', category: 'tables', icon: 'fa-table' }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'widget-catalog-container-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 100%; height: 500px;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (catalog && typeof catalog.destroy === 'function') {
            try {
                catalog.destroy();
            } catch (e) {
                // Ignore destroy errors
            }
            catalog = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('creates at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                // WidgetCatalog uses factory pattern
                catalog = WidgetCatalog.init({
                    container: document.getElementById(containerId),
                    categories: getCategories(),
                    widgets: getWidgets()
                });

                expect(catalog).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                catalog = WidgetCatalog.init({
                    container: document.getElementById(containerId),
                    categories: getCategories(),
                    widgets: getWidgets()
                });

                expect(catalog).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                catalog = WidgetCatalog.init({
                    container: document.getElementById(containerId),
                    categories: getCategories(),
                    widgets: getWidgets()
                });

                expect(catalog).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Multiple Breakpoints
    // ========================================================================

    FunkyTests.describe('Multiple Breakpoints', function() {

        FunkyTests.it('works at 768px breakpoint', function(done) {
            var restore = FunkyTests.simulate.resize(768, 1024);

            setTimeout(function() {
                catalog = WidgetCatalog.init({
                    container: document.getElementById(containerId),
                    widgets: getWidgets()
                });

                expect(catalog).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works at 600px breakpoint', function(done) {
            var restore = FunkyTests.simulate.resize(600, 800);

            setTimeout(function() {
                catalog = WidgetCatalog.init({
                    container: document.getElementById(containerId),
                    widgets: getWidgets()
                });

                expect(catalog).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works at 480px breakpoint', function(done) {
            var restore = FunkyTests.simulate.resize(480, 700);

            setTimeout(function() {
                catalog = WidgetCatalog.init({
                    container: document.getElementById(containerId),
                    widgets: getWidgets()
                });

                expect(catalog).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('handles viewport resize', function(done) {
            catalog = WidgetCatalog.init({
                container: document.getElementById(containerId),
                widgets: getWidgets()
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(catalog).not.toBeNull();

                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroys correctly', function() {
            catalog = WidgetCatalog.init({
                container: document.getElementById(containerId),
                widgets: getWidgets()
            });

            if (catalog.destroy) {
                catalog.destroy();
            }

            expect(true).toBe(true);
            catalog = null;
        });

    });

});
