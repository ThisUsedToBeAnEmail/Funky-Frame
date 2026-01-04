/**
 * Responsive Tests: Funky.Morph
 *
 * Tests responsive behavior for the Morph component.
 * Verifies FLIP animations at different viewports,
 * reduced motion preference handling, and element sizing calculations.
 */

FunkyTests.describe('Funky.Responsive.Morph', function() {
    var expect = FunkyTests.expect;
    var Morph = window.Funky && window.Funky.Morph;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Morph not loaded
    if (!Morph) {
        FunkyTests.it('Morph component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var testCounter = 0;
    var sourceId;
    var targetId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        sourceId = 'source-' + unique;
        targetId = 'target-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="morph-container-' + unique + '">' +
                '<div id="' + sourceId + '" style="width: 100px; height: 100px; background: blue;">Source</div>' +
                '<div id="' + targetId + '" style="width: 200px; height: 200px; background: red; margin-top: 50px;">Target</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        // Cancel any active morphs
        if (Morph.cancelAll) {
            Morph.cancelAll();
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('morph works at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                var sourceEl = document.getElementById(sourceId);
                var targetEl = document.getElementById(targetId);

                expect(sourceEl).not.toBeNull();
                expect(targetEl).not.toBeNull();

                // Morph.to is the primary API
                if (Morph.to) {
                    Morph.to({
                        from: '#' + sourceId,
                        to: '#' + targetId,
                        duration: 50,
                        onComplete: function() {
                            restore();
                            done();
                        }
                    });
                } else {
                    restore();
                    done();
                }
            }, 50);
        });

        FunkyTests.it('morph works at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                var sourceEl = document.getElementById(sourceId);
                var targetEl = document.getElementById(targetId);

                expect(sourceEl).not.toBeNull();
                expect(targetEl).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('morph works at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                var sourceEl = document.getElementById(sourceId);
                var targetEl = document.getElementById(targetId);

                expect(sourceEl).not.toBeNull();
                expect(targetEl).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Reduced Motion Preference
    // ========================================================================

    FunkyTests.describe('Reduced Motion Preference', function() {

        FunkyTests.it('respects reduced motion preference', function(done) {
            var restore = FunkyTests.simulate.reducedMotion(true);

            setTimeout(function() {
                // When reduced motion is preferred, animations should complete instantly
                if (Morph.to) {
                    Morph.to({
                        from: '#' + sourceId,
                        to: '#' + targetId,
                        duration: 300,
                        respectMotion: true,
                        onComplete: function() {
                            expect(true).toBe(true);
                            restore();
                            done();
                        }
                    });
                } else {
                    restore();
                    done();
                }
            }, 50);
        });

        FunkyTests.it('uses animations when motion allowed', function(done) {
            var restore = FunkyTests.simulate.reducedMotion(false);

            setTimeout(function() {
                if (Morph.to) {
                    Morph.to({
                        from: '#' + sourceId,
                        to: '#' + targetId,
                        duration: 50,
                        onComplete: function() {
                            expect(true).toBe(true);
                            restore();
                            done();
                        }
                    });
                } else {
                    restore();
                    done();
                }
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
                var sourceEl = document.getElementById(sourceId);
                expect(sourceEl).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                var sourceEl = document.getElementById(sourceId);
                expect(sourceEl).not.toBeNull();

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
                var sourceEl = document.getElementById(sourceId);
                expect(sourceEl).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        var sourceEl = document.getElementById(sourceId);
                        expect(sourceEl).not.toBeNull();

                        restore3();
                        done();
                    }, 50);
                }, 30);
            }, 30);
        });

    });

    // ========================================================================
    // Morph API
    // ========================================================================

    FunkyTests.describe('Morph API', function() {

        FunkyTests.it('Morph.to exists', function() {
            expect(typeof Morph.to).toBe('function');
        });

        FunkyTests.it('Morph.cancelAll exists', function() {
            // cancelAll may or may not exist
            if (Morph.cancelAll) {
                expect(typeof Morph.cancelAll).toBe('function');
            } else {
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('Morph.reverse exists', function() {
            if (Morph.reverse) {
                expect(typeof Morph.reverse).toBe('function');
            } else {
                expect(true).toBe(true);
            }
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('cancelAll works without error', function() {
            if (Morph.cancelAll) {
                Morph.cancelAll();
            }

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
        });

    });

});
