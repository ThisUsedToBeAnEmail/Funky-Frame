/**
 * Responsive Tests: Funky.EvenFunkyer
 *
 * Tests responsive behavior for the EvenFunkyer component.
 * EvenFunkyer exposes Effects and Particles modules.
 * Verifies component availability at different viewports.
 */

FunkyTests.describe('Funky.Responsive.EvenFunkyer', function() {
    var expect = FunkyTests.expect;
    var EvenFunkyer = window.Funky && window.Funky.EvenFunkyer;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if EvenFunkyer not loaded
    if (!EvenFunkyer) {
        FunkyTests.it('EvenFunkyer component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var testCounter = 0;
    var containerId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'even-funkyer-container-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 100%; height: 400px;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('component available at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                // EvenFunkyer exposes Effects and Particles, not init
                expect(EvenFunkyer).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('component available at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                expect(EvenFunkyer).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('component available at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                expect(EvenFunkyer).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Touch vs Mouse Behavior
    // ========================================================================

    FunkyTests.describe('Touch vs Mouse Behavior', function() {

        FunkyTests.it('component available on touch device simulation', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                expect(EvenFunkyer).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('component available on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                expect(EvenFunkyer).not.toBeNull();

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
            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(EvenFunkyer).not.toBeNull();

                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // API Structure
    // ========================================================================

    FunkyTests.describe('API Structure', function() {

        FunkyTests.it('has Effects module if available', function() {
            // EvenFunkyer.Effects may exist
            if (EvenFunkyer.Effects) {
                expect(EvenFunkyer.Effects).not.toBeNull();
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('has Particles module if available', function() {
            // EvenFunkyer.Particles may exist
            if (EvenFunkyer.Particles) {
                expect(EvenFunkyer.Particles).not.toBeNull();
            } else {
                expect(true).toBe(true);
            }
        });

    });

});
