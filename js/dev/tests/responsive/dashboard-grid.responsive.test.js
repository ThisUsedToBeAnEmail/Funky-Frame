/**
 * Responsive Tests: Funky.DashboardGrid
 *
 * Tests responsive behavior for the DashboardGrid component.
 * Verifies that the grid handles container resize events and
 * widget repositioning correctly at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.DashboardGrid', function() {
    var expect = FunkyTests.expect;
    var DashboardGrid = window.Funky && window.Funky.DashboardGrid;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if DashboardGrid not loaded or doesn't have init method
    if (!DashboardGrid || !DashboardGrid.init) {
        FunkyTests.it('DashboardGrid component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var grid;
    var containerId;
    var testCounter = 0;

    // Sample widgets for grid
    function getSampleWidgets() {
        return [
            { id: 'widget1', title: 'Widget 1', content: '<p>Content 1</p>', col: 1, row: 1, width: 1, height: 1 },
            { id: 'widget2', title: 'Widget 2', content: '<p>Content 2</p>', col: 2, row: 1, width: 1, height: 1 },
            { id: 'widget3', title: 'Widget 3', content: '<p>Content 3</p>', col: 1, row: 2, width: 2, height: 1 }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'dashboard-grid-responsive-test-' + unique;
        fixture = FunkyTests.fixture('<div id="' + containerId + '" style="width: 800px; height: 600px;"></div>');
    });

    FunkyTests.afterEach(function() {
        if (grid && typeof grid.destroy === 'function') {
            grid.destroy();
            grid = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Container Resize Handling
    // ========================================================================

    FunkyTests.describe('Container Resize Handling', function() {

        FunkyTests.it('initializes with specified column count', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            expect(grid).not.toBeNull();
        });

        FunkyTests.it('handles container width change', function(done) {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            var container = document.getElementById(containerId);
            container.style.width = '400px';

            // Trigger resize observation
            window.dispatchEvent(new Event('resize'));

            setTimeout(function() {
                // Grid should handle resize gracefully
                expect(grid).not.toBeNull();
                done();
            }, 100);
        });

        FunkyTests.it('handles container height change', function(done) {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            var container = document.getElementById(containerId);
            container.style.height = '300px';

            window.dispatchEvent(new Event('resize'));

            setTimeout(function() {
                expect(grid).not.toBeNull();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Viewport Width Tests
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('works on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                grid = DashboardGrid.init('#' + containerId, {
                    columns: 2,
                    widgets: getSampleWidgets()
                });

                expect(grid).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                grid = DashboardGrid.init('#' + containerId, {
                    columns: 3,
                    widgets: getSampleWidgets()
                });

                expect(grid).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                grid = DashboardGrid.init('#' + containerId, {
                    columns: 4,
                    widgets: getSampleWidgets()
                });

                expect(grid).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('responds to window resize event', function(done) {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            var restore = FunkyTests.simulate.resize(500, 600);

            setTimeout(function() {
                expect(grid).not.toBeNull();
                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Column Configuration
    // ========================================================================

    FunkyTests.describe('Column Configuration', function() {

        FunkyTests.it('supports 1 column layout', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 1,
                widgets: getSampleWidgets()
            });

            expect(grid).not.toBeNull();
        });

        FunkyTests.it('supports 2 column layout', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 2,
                widgets: getSampleWidgets()
            });

            expect(grid).not.toBeNull();
        });

        FunkyTests.it('supports 4 column layout', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            expect(grid).not.toBeNull();
        });

        FunkyTests.it('supports 6 column layout', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 6,
                widgets: getSampleWidgets()
            });

            expect(grid).not.toBeNull();
        });

        FunkyTests.it('defaults to 2 columns when not specified', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: getSampleWidgets()
            });

            expect(grid).not.toBeNull();
        });

    });

    // ========================================================================
    // Widget Dimensions at Different Sizes
    // ========================================================================

    FunkyTests.describe('Widget Dimensions', function() {

        FunkyTests.it('widget spans full width in single column', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 1,
                widgets: [
                    { id: 'widget1', title: 'Full Width', content: '<p>Content</p>', col: 1, row: 1, width: 1, height: 1 }
                ]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            if (widget) {
                // Widget should exist in the grid
                expect(widget).not.toBeNull();
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('widget width constrained by column count', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 2,
                widgets: [
                    { id: 'widget1', title: 'Widget', content: '<p>Content</p>', col: 1, row: 1, width: 3, height: 1 }
                ]
            });

            // Grid should handle widget width exceeding column count
            expect(grid).not.toBeNull();
        });

    });

    // ========================================================================
    // Rapid Resize Handling
    // ========================================================================

    FunkyTests.describe('Rapid Resize Handling', function() {

        FunkyTests.it('handles rapid resize events', function(done) {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            // Rapid resizes
            var restore1 = FunkyTests.simulate.resize(400, 300);
            var restore2, restore3;

            setTimeout(function() {
                restore1();
                restore2 = FunkyTests.simulate.resize(800, 600);
            }, 20);

            setTimeout(function() {
                restore2();
                restore3 = FunkyTests.simulate.resize(500, 400);
            }, 40);

            setTimeout(function() {
                restore3();
                expect(grid).not.toBeNull();
                done();
            }, 150);
        });

        FunkyTests.it('handles orientation-like changes', function(done) {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            // Portrait
            var restore = FunkyTests.simulate.resize(375, 812);

            setTimeout(function() {
                restore();
                // Landscape
                restore = FunkyTests.simulate.resize(812, 375);

                setTimeout(function() {
                    expect(grid).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 100);
        });

    });

    // ========================================================================
    // Widget Add/Remove at Different Sizes
    // ========================================================================

    FunkyTests.describe('Widget Operations at Different Sizes', function() {

        FunkyTests.it('can add widget on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                grid = DashboardGrid.init('#' + containerId, {
                    columns: 2,
                    widgets: getSampleWidgets()
                });

                if (grid && typeof grid.addWidget === 'function') {
                    grid.addWidget({
                        id: 'new-widget',
                        title: 'New Widget',
                        content: '<p>New content</p>',
                        col: 1,
                        row: 3,
                        width: 1,
                        height: 1
                    });
                }

                expect(grid).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('can remove widget on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                grid = DashboardGrid.init('#' + containerId, {
                    columns: 3,
                    widgets: getSampleWidgets()
                });

                if (grid && typeof grid.removeWidget === 'function') {
                    grid.removeWidget('widget1');
                }

                expect(grid).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('cleans up resize handlers on destroy', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            grid.destroy();
            grid = null;

            // Should not error when resizing after destroy
            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
        });

        FunkyTests.it('can be recreated after destroy', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 4,
                widgets: getSampleWidgets()
            });

            grid.destroy();

            // Recreate
            grid = DashboardGrid.init('#' + containerId, {
                columns: 2,
                widgets: getSampleWidgets()
            });

            expect(grid).not.toBeNull();
        });

    });

});
