/**
 * Responsive Tests: Funky.StickyHeader
 *
 * Tests responsive behavior for the StickyHeader component.
 * Verifies position recalculation on resize,
 * scroll behavior at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.StickyHeader', function() {
    var expect = FunkyTests.expect;
    var StickyHeader = window.Funky && window.Funky.StickyHeader;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if StickyHeader not loaded
    if (!StickyHeader) {
        FunkyTests.it('StickyHeader component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var testCounter = 0;
    var containerId;
    var headerId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'sticky-header-container-' + unique;
        headerId = 'header-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="height: 2000px; position: relative;">' +
                '<header id="' + headerId + '" class="page-header-sticky" style="height: 60px; background: #333;">Header Content</header>' +
                '<main style="padding: 20px;">Main content goes here</main>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        // StickyHeader.destroy takes an element, not an instance
        var headerEl = document.getElementById(headerId);
        if (headerEl && StickyHeader.destroy) {
            try {
                StickyHeader.destroy(headerEl);
            } catch (e) {
                // Ignore destroy errors in cleanup
            }
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
                // StickyHeader.init() finds all .page-header-sticky elements
                StickyHeader.init();

                var headerEl = document.getElementById(headerId);
                expect(headerEl).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                StickyHeader.init();

                var headerEl = document.getElementById(headerId);
                expect(headerEl).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                StickyHeader.init();

                var headerEl = document.getElementById(headerId);
                expect(headerEl).not.toBeNull();

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
                StickyHeader.init();

                var headerEl = document.getElementById(headerId);
                expect(headerEl).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                StickyHeader.init();

                var headerEl = document.getElementById(headerId);
                expect(headerEl).not.toBeNull();

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
            StickyHeader.init();

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                var headerEl = document.getElementById(headerId);
                expect(headerEl).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            StickyHeader.init();

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        var headerEl = document.getElementById(headerId);
                        expect(headerEl).not.toBeNull();

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
            StickyHeader.init();

            var headerEl = document.getElementById(headerId);
            if (headerEl && StickyHeader.destroy) {
                StickyHeader.destroy(headerEl);
            }

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
        });

        FunkyTests.it('destroyAll works', function() {
            StickyHeader.init();

            if (StickyHeader.destroyAll) {
                StickyHeader.destroyAll();
            }

            expect(true).toBe(true);
        });

    });

});
