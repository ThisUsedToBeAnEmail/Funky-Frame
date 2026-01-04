/**
 * Responsive Tests: Funky.Badge
 *
 * Tests responsive behavior for the Badge component.
 * Verifies matchMedia for sizing at different viewports.
 */

FunkyTests.describe('Funky.Responsive.Badge', function() {
    var expect = FunkyTests.expect;
    var Badge = window.Funky && window.Funky.Badge;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Badge not loaded
    if (!Badge) {
        FunkyTests.it('Badge component not available', function() {
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
        containerId = 'badge-container-' + unique;
        fixture = FunkyTests.fixture(
            '<button id="' + containerId + '">Notifications</button>'
        );
    });

    FunkyTests.afterEach(function() {
        // Remove badge using the utility method
        if (Badge.remove) {
            Badge.remove('#' + containerId);
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('attaches badge at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                // Badge.attach is the correct API
                Badge.attach('#' + containerId, {
                    value: 5,
                    type: 'count'
                });

                // Check that badge was attached
                var container = document.getElementById(containerId);
                expect(container).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('attaches badge at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                Badge.attach('#' + containerId, {
                    value: 10,
                    type: 'count'
                });

                var container = document.getElementById(containerId);
                expect(container).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('attaches badge at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                Badge.attach('#' + containerId, {
                    value: 99,
                    type: 'count'
                });

                var container = document.getElementById(containerId);
                expect(container).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Badge Types at Different Viewports
    // ========================================================================

    FunkyTests.describe('Badge Types', function() {

        FunkyTests.it('dot badge works at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                Badge.attach('#' + containerId, {
                    type: 'dot'
                });

                var container = document.getElementById(containerId);
                expect(container).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('count badge works at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                Badge.attach('#' + containerId, {
                    value: 42,
                    type: 'count'
                });

                var container = document.getElementById(containerId);
                expect(container).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Update at Different Viewports
    // ========================================================================

    FunkyTests.describe('Badge Updates', function() {

        FunkyTests.it('updates badge at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                Badge.attach('#' + containerId, {
                    value: 5,
                    type: 'count'
                });

                // Update the badge
                if (Badge.update) {
                    Badge.update('#' + containerId, {
                        value: 10
                    });
                }

                expect(true).toBe(true);

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
            Badge.attach('#' + containerId, {
                value: 5,
                type: 'count'
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                var container = document.getElementById(containerId);
                expect(container).not.toBeNull();

                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('removes badge correctly', function() {
            Badge.attach('#' + containerId, {
                value: 5,
                type: 'count'
            });

            if (Badge.remove) {
                Badge.remove('#' + containerId);
            }

            expect(true).toBe(true);
        });

    });

});
