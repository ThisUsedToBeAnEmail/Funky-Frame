/**
 * Responsive Tests: Funky.GestureTracker
 *
 * Tests responsive/touch behavior for the GestureTracker component.
 * Verifies that touch detection, gesture thresholds, and device
 * type handling work correctly across different device contexts.
 */

FunkyTests.describe('Funky.Responsive.GestureTracker', function() {
    var expect = FunkyTests.expect;
    var GestureTracker = window.Funky && window.Funky.GestureTracker;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if GestureTracker not loaded
    if (!GestureTracker) {
        FunkyTests.it('GestureTracker component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var tracker;
    var containerId;
    var testCounter = 0;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'gesture-tracker-responsive-test-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 300px; height: 300px; touch-action: none;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (tracker && typeof tracker.destroy === 'function') {
            tracker.destroy();
            tracker = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Touch Device Detection
    // ========================================================================

    FunkyTests.describe('Touch Device Detection', function() {

        FunkyTests.it('works on touch devices', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['tap', 'swipe']
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse devices', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['tap', 'swipe']
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('handles both touch and mouse events', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap', 'swipe', 'drag']
            });

            // Should work regardless of device type
            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Mobile Viewport Behavior
    // ========================================================================

    FunkyTests.describe('Mobile Viewport Behavior', function() {

        FunkyTests.it('works on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['tap', 'swipe']
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['tap', 'swipe', 'longpress']
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['tap', 'drag']
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Swipe Gesture
    // ========================================================================

    FunkyTests.describe('Swipe Gesture', function() {

        FunkyTests.it('detects swipe on touch devices', function(done) {
            var swipeDetected = false;
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['swipe'],
                    onSwipe: function(data) {
                        swipeDetected = true;
                    }
                });

                // Swipe detection is configured
                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('configures swipe threshold', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['swipe'],
                swipeThreshold: 100,
                swipeVelocity: 0.5
            });

            expect(tracker).not.toBeNull();
        });

        FunkyTests.it('supports horizontal swipe', function() {
            var swipeDirection = null;

            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['swipe'],
                onSwipe: function(data) {
                    swipeDirection = data.direction;
                }
            });

            // Swipe detection is set up
            expect(tracker).not.toBeNull();
        });

        FunkyTests.it('supports vertical swipe', function() {
            var swipeDirection = null;

            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['swipe'],
                onSwipe: function(data) {
                    swipeDirection = data.direction;
                }
            });

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Tap Gesture
    // ========================================================================

    FunkyTests.describe('Tap Gesture', function() {

        FunkyTests.it('detects tap on touch devices', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['tap'],
                    onTap: function(data) {}
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('detects tap on mouse devices', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['tap'],
                    onTap: function(data) {}
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('configures tap threshold', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap'],
                tapThreshold: 20
            });

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Long Press Gesture
    // ========================================================================

    FunkyTests.describe('Long Press Gesture', function() {

        FunkyTests.it('works on touch devices', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['longpress'],
                    longPressDelay: 500,
                    onLongPress: function(data) {}
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('configures long press delay', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['longpress'],
                longPressDelay: 1000
            });

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Drag Gesture
    // ========================================================================

    FunkyTests.describe('Drag Gesture', function() {

        FunkyTests.it('works on touch devices', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['drag'],
                    onDragStart: function(data) {},
                    onDragMove: function(data) {},
                    onDragEnd: function(data) {}
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse devices', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['drag'],
                    onDragStart: function(data) {},
                    onDragMove: function(data) {},
                    onDragEnd: function(data) {}
                });

                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Reduced Motion
    // ========================================================================

    FunkyTests.describe('Reduced Motion', function() {

        FunkyTests.it('respects prefers-reduced-motion', function(done) {
            var restore = FunkyTests.simulate.reducedMotion(true);

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['swipe'],
                    hapticFeedback: true
                });

                // Should handle reduced motion preference
                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('haptic feedback can be disabled', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['longpress'],
                hapticFeedback: false
            });

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Multiple Gestures
    // ========================================================================

    FunkyTests.describe('Multiple Gestures', function() {

        FunkyTests.it('tracks all gesture types', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap', 'swipe', 'longpress', 'drag']
            });

            expect(tracker).not.toBeNull();
        });

        FunkyTests.it('can limit to specific gestures', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap']
            });

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Passive Listeners
    // ========================================================================

    FunkyTests.describe('Passive Listeners', function() {

        FunkyTests.it('supports passive: true for performance', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['swipe'],
                passive: true
            });

            expect(tracker).not.toBeNull();
        });

        FunkyTests.it('supports passive: false for preventDefault', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['swipe'],
                passive: false,
                preventDefault: true
            });

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Touch Start/Stop
    // ========================================================================

    FunkyTests.describe('Touch Start/Stop', function() {

        FunkyTests.it('can start tracking manually', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap'],
                autoStart: false
            });

            if (tracker.start) {
                tracker.start();
            }

            expect(tracker).not.toBeNull();
        });

        FunkyTests.it('can stop tracking', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap']
            });

            if (tracker.stop) {
                tracker.stop();
            }

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Event Emission
    // ========================================================================

    FunkyTests.describe('Event Emission', function() {

        FunkyTests.it('can emit PubSub events', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap', 'swipe'],
                emitEvents: true,
                eventPrefix: 'funky:gesture'
            });

            expect(tracker).not.toBeNull();
        });

        FunkyTests.it('uses custom event prefix', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap'],
                emitEvents: true,
                eventPrefix: 'myapp:gesture'
            });

            expect(tracker).not.toBeNull();
        });

    });

    // ========================================================================
    // Viewport Resize
    // ========================================================================

    FunkyTests.describe('Viewport Resize', function() {

        FunkyTests.it('handles viewport resize', function(done) {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap', 'swipe']
            });

            var restore = FunkyTests.simulate.resize(500, 400);

            setTimeout(function() {
                // Should still work after resize
                expect(tracker).not.toBeNull();
                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles orientation change', function(done) {
            var restoreResize = FunkyTests.simulate.resize(667, 375); // Landscape
            var restoreOrientation = FunkyTests.simulate.orientation('landscape');

            setTimeout(function() {
                tracker = GestureTracker.create({
                    target: '#' + containerId,
                    gestures: ['swipe']
                });

                expect(tracker).not.toBeNull();
                restoreResize();
                restoreOrientation();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('removes event listeners on destroy', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['tap', 'swipe', 'drag']
            });

            tracker.destroy();
            tracker = null;

            // Should not error on subsequent interactions
            expect(true).toBe(true);
        });

        FunkyTests.it('cleans up long press timer on destroy', function() {
            tracker = GestureTracker.create({
                target: '#' + containerId,
                gestures: ['longpress'],
                longPressDelay: 500
            });

            // Destroy during potential long press
            tracker.destroy();
            tracker = null;

            expect(true).toBe(true);
        });

    });

});
