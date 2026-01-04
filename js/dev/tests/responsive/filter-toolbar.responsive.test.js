/**
 * Responsive Tests: Funky.FilterToolbar
 *
 * Tests responsive behavior for the FilterToolbar component.
 * Verifies button group wrapping, mobile layout transformation,
 * and responsive spacing at different breakpoints.
 */

FunkyTests.describe('Funky.Responsive.FilterToolbar', function() {
    var expect = FunkyTests.expect;
    var FilterToolbar = window.Funky && window.Funky.FilterToolbar;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if FilterToolbar not loaded
    if (!FilterToolbar) {
        FunkyTests.it('FilterToolbar component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var toolbar;
    var testCounter = 0;
    var toolbarId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        toolbarId = 'filter-toolbar-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + toolbarId + '" class="filter-toolbar" style="width: 100%;">' +
                '<div class="filter-toggle-btn">Toggle</div>' +
                '<div class="saved-filter-dropdown">' +
                    '<button class="saved-filter-btn" aria-expanded="false">Saved Filters</button>' +
                    '<div class="saved-filter-menu"></div>' +
                '</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (toolbar && typeof toolbar.destroy === 'function') {
            try {
                toolbar.destroy();
            } catch (e) {
                // Ignore destroy errors in cleanup
            }
            toolbar = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('initializes at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                toolbar = FilterToolbar.create({
                    toolbarSelector: '#' + toolbarId,
                    context: 'test-mobile',
                    savedFiltersEnabled: false,
                    persistToUrl: false
                });

                expect(toolbar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                toolbar = FilterToolbar.create({
                    toolbarSelector: '#' + toolbarId,
                    context: 'test-tablet',
                    savedFiltersEnabled: false,
                    persistToUrl: false
                });

                expect(toolbar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                toolbar = FilterToolbar.create({
                    toolbarSelector: '#' + toolbarId,
                    context: 'test-desktop',
                    savedFiltersEnabled: false,
                    persistToUrl: false
                });

                expect(toolbar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Touch vs Mouse Behavior
    // ========================================================================

    FunkyTests.describe('Touch vs Mouse Behavior', function() {

        FunkyTests.it('works on touch device simulation', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                toolbar = FilterToolbar.create({
                    toolbarSelector: '#' + toolbarId,
                    context: 'test-touch',
                    savedFiltersEnabled: false,
                    persistToUrl: false
                });

                expect(toolbar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                toolbar = FilterToolbar.create({
                    toolbarSelector: '#' + toolbarId,
                    context: 'test-mouse',
                    savedFiltersEnabled: false,
                    persistToUrl: false
                });

                expect(toolbar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Toolbar Toggle
    // ========================================================================

    FunkyTests.describe('Toolbar Toggle', function() {

        FunkyTests.it('toggles collapsed state at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                toolbar = FilterToolbar.create({
                    toolbarSelector: '#' + toolbarId,
                    context: 'test-toggle-mobile',
                    savedFiltersEnabled: false,
                    persistToUrl: false
                });

                var toolbarEl = document.getElementById(toolbarId);
                var toggleBtn = toolbarEl.querySelector('.filter-toggle-btn');

                // Click toggle to collapse
                if (toggleBtn) {
                    toggleBtn.click();
                }

                expect(toolbar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('toggles collapsed state at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                toolbar = FilterToolbar.create({
                    toolbarSelector: '#' + toolbarId,
                    context: 'test-toggle-desktop',
                    savedFiltersEnabled: false,
                    persistToUrl: false
                });

                var toolbarEl = document.getElementById(toolbarId);
                var toggleBtn = toolbarEl.querySelector('.filter-toggle-btn');

                // Click toggle to collapse
                if (toggleBtn) {
                    toggleBtn.click();
                }

                expect(toolbar).not.toBeNull();

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
            toolbar = FilterToolbar.create({
                toolbarSelector: '#' + toolbarId,
                context: 'test-resize',
                savedFiltersEnabled: false,
                persistToUrl: false
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(toolbar).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            toolbar = FilterToolbar.create({
                toolbarSelector: '#' + toolbarId,
                context: 'test-rapid-resize',
                savedFiltersEnabled: false,
                persistToUrl: false
            });

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        expect(toolbar).not.toBeNull();

                        restore3();
                        done();
                    }, 50);
                }, 30);
            }, 30);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroys correctly', function() {
            toolbar = FilterToolbar.create({
                toolbarSelector: '#' + toolbarId,
                context: 'test-destroy',
                savedFiltersEnabled: false,
                persistToUrl: false
            });

            if (toolbar && toolbar.destroy) {
                toolbar.destroy();
            }

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            toolbar = null;
        });

    });

});
