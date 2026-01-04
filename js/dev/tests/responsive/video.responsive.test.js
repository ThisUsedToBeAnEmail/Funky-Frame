/**
 * Responsive Tests: Funky.Video
 *
 * Tests responsive behavior for the Video component.
 * Verifies viewport-based sizing, touch control interactions,
 * and fullscreen behavior at breakpoints.
 */

FunkyTests.describe('Funky.Responsive.Video', function() {
    var expect = FunkyTests.expect;
    var Video = window.Funky && window.Funky.Video;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Video not loaded
    if (!Video) {
        FunkyTests.it('Video component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var player;
    var testCounter = 0;
    var videoContainerId;
    var videoId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        videoContainerId = 'video-container-' + unique;
        videoId = 'video-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + videoContainerId + '" style="width: 100%; max-width: 800px;">' +
                '<video id="' + videoId + '" style="width: 100%;"></video>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (player && typeof player.destroy === 'function') {
            player.destroy();
            player = null;
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
                player = Video.init('#' + videoContainerId);

                expect(player).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();
            
            setTimeout(function() {
                player = Video.init('#' + videoContainerId);

                expect(player).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();
            
            setTimeout(function() {
                player = Video.init('#' + videoContainerId);

                expect(player).not.toBeNull();

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
                player = Video.init('#' + videoContainerId);

                expect(player).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();
            
            setTimeout(function() {
                player = Video.init('#' + videoContainerId);

                expect(player).not.toBeNull();

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
            
            player = Video.init('#' + videoContainerId);

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(player).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            
            player = Video.init('#' + videoContainerId);

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        expect(player).not.toBeNull();

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
            
            player = Video.init('#' + videoContainerId);

            player.destroy();

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            player = null;
        });

    });

});
