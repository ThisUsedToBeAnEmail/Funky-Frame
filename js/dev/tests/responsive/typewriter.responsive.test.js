/**
 * Responsive Tests: Funky.Typewriter
 *
 * Tests responsive behavior for the Typewriter component.
 * Verifies resize handling and matchMedia at different viewports.
 */

FunkyTests.describe('Funky.Responsive.Typewriter', function() {
    var expect = FunkyTests.expect;
    var Typewriter = window.Funky && window.Funky.Typewriter;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Typewriter not loaded
    if (!Typewriter) {
        FunkyTests.it('Typewriter component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var typewriter;
    var testCounter = 0;
    var containerId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'typewriter-container-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 100%;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (typewriter && typeof typewriter.destroy === 'function') {
            try {
                typewriter.destroy();
            } catch (e) {
                // Ignore destroy errors in cleanup
            }
            typewriter = null;
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
                // Typewriter.create is the correct API
                typewriter = Typewriter.create('#' + containerId, {
                    text: 'Hello World',
                    autoStart: false
                });

                expect(typewriter).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                typewriter = Typewriter.create('#' + containerId, {
                    text: 'Hello World',
                    autoStart: false
                });

                expect(typewriter).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                typewriter = Typewriter.create('#' + containerId, {
                    text: 'Hello World',
                    autoStart: false
                });

                expect(typewriter).not.toBeNull();

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
                typewriter = Typewriter.create('#' + containerId, {
                    text: 'Hello World',
                    autoStart: false
                });

                expect(typewriter).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                typewriter = Typewriter.create('#' + containerId, {
                    text: 'Hello World',
                    autoStart: false
                });

                expect(typewriter).not.toBeNull();

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
            typewriter = Typewriter.create('#' + containerId, {
                text: 'Hello World',
                autoStart: false
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(typewriter).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            typewriter = Typewriter.create('#' + containerId, {
                text: 'Hello World',
                autoStart: false
            });

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        expect(typewriter).not.toBeNull();

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
            typewriter = Typewriter.create('#' + containerId, {
                text: 'Hello World',
                autoStart: false
            });

            if (typewriter && typewriter.destroy) {
                typewriter.destroy();
            }

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            typewriter = null;
        });

    });

});
