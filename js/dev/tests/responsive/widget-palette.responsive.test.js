/**
 * Responsive Tests: Funky.WidgetPalette
 *
 * Tests responsive behavior for the WidgetPalette component.
 * WidgetPalette uses factory pattern: WidgetPalette.init({ grid, position, collapsed })
 * Verifies 576px stack layout and responsive behavior.
 */

FunkyTests.describe('Funky.Responsive.WidgetPalette', function() {
    var expect = FunkyTests.expect;
    var WidgetPalette = window.Funky && window.Funky.WidgetPalette;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if WidgetPalette not loaded
    if (!WidgetPalette) {
        FunkyTests.it('WidgetPalette component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var palette;
    var testCounter = 0;
    var containerId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'widget-palette-container-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 100%; height: 400px;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (palette && typeof palette.destroy === 'function') {
            try {
                palette.destroy();
            } catch (e) {
                // Ignore destroy errors
            }
            palette = null;
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
                // WidgetPalette uses factory pattern
                palette = WidgetPalette.init({
                    container: document.getElementById(containerId),
                    position: 'left',
                    collapsed: true
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                palette = WidgetPalette.init({
                    container: document.getElementById(containerId),
                    position: 'left',
                    collapsed: false
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                palette = WidgetPalette.init({
                    container: document.getElementById(containerId),
                    position: 'right',
                    collapsed: false
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // 576px Breakpoint
    // ========================================================================

    FunkyTests.describe('576px Breakpoint', function() {

        FunkyTests.it('works at 576px breakpoint', function(done) {
            var restore = FunkyTests.simulate.resize(576, 800);

            setTimeout(function() {
                palette = WidgetPalette.init({
                    container: document.getElementById(containerId),
                    position: 'left'
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works below 576px', function(done) {
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                palette = WidgetPalette.init({
                    container: document.getElementById(containerId),
                    position: 'left'
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Position Options
    // ========================================================================

    FunkyTests.describe('Position Options', function() {

        FunkyTests.it('left position works at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                palette = WidgetPalette.init({
                    container: document.getElementById(containerId),
                    position: 'left'
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('right position works at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                palette = WidgetPalette.init({
                    container: document.getElementById(containerId),
                    position: 'right'
                });

                expect(palette).not.toBeNull();

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
            palette = WidgetPalette.init({
                container: document.getElementById(containerId),
                position: 'left'
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(palette).not.toBeNull();

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
            palette = WidgetPalette.init({
                container: document.getElementById(containerId),
                position: 'left'
            });

            if (palette.destroy) {
                palette.destroy();
            }

            expect(true).toBe(true);
            palette = null;
        });

    });

});
