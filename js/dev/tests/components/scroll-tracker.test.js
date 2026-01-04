/**
 * Funky.ScrollTracker Tests
 *
 * Tests for the scroll tracking component with direction detection,
 * velocity calculation, and threshold callbacks.
 */

describe('Funky.Component.ScrollTracker', function() {

    var ScrollTracker = Funky.ScrollTracker;
    var fixture;
    var scrollContainer;
    var tracker;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="scroll-container" style="width: 200px; height: 200px; overflow: auto;">' +
                '<div id="scroll-content" style="width: 100%; height: 1000px;">Content</div>' +
            '</div>'
        );
        scrollContainer = document.getElementById('scroll-container');
    });

    afterEach(function() {
        if (tracker) {
            tracker.destroy();
            tracker = null;
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('ScrollTracker')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof ScrollTracker.create).toBe('function');
        });

    });

    describe('Factory', function() {

        it('creates an instance with create()', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            expect(tracker).toBeDefined();
            expect(typeof tracker.start).toBe('function');
            expect(typeof tracker.stop).toBe('function');
            expect(typeof tracker.destroy).toBe('function');
        });

        it('generates unique IDs for each instance', function() {
            var tracker1 = ScrollTracker.create({ target: scrollContainer, autoStart: false });
            var tracker2 = ScrollTracker.create({ target: scrollContainer, autoStart: false });

            expect(tracker1.getId()).not.toBe(tracker2.getId());
            expect(tracker1.getId()).toContain('scroll-tracker-');
            expect(tracker2.getId()).toContain('scroll-tracker-');

            tracker1.destroy();
            tracker2.destroy();
        });

    });

    describe('Target Resolution', function() {

        it('accepts a DOM element as target', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            expect(tracker.isActive()).toBe(false);
            tracker.start();
            expect(tracker.isActive()).toBe(true);
        });

        it('accepts a CSS selector as target', function() {
            tracker = ScrollTracker.create({
                target: '#scroll-container',
                autoStart: false
            });

            tracker.start();
            expect(tracker.isActive()).toBe(true);
        });

        it('accepts window as target', function() {
            tracker = ScrollTracker.create({
                target: window,
                autoStart: false
            });

            tracker.start();
            expect(tracker.isActive()).toBe(true);
        });

        it('handles missing target gracefully', function() {
            tracker = ScrollTracker.create({
                target: '#non-existent-element',
                autoStart: false
            });

            // Should not throw
            tracker.start();
            expect(tracker.isActive()).toBe(false);
        });

    });

    describe('Lifecycle', function() {

        it('auto-starts when autoStart is true (default)', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer
            });

            expect(tracker.isActive()).toBe(true);
        });

        it('does not auto-start when autoStart is false', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            expect(tracker.isActive()).toBe(false);
        });

        it('starts tracking with start()', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            expect(tracker.isActive()).toBe(false);
            tracker.start();
            expect(tracker.isActive()).toBe(true);
        });

        it('stops tracking with stop()', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer
            });

            expect(tracker.isActive()).toBe(true);
            tracker.stop();
            expect(tracker.isActive()).toBe(false);
        });

        it('allows restart after stop', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer
            });

            tracker.stop();
            expect(tracker.isActive()).toBe(false);

            tracker.start();
            expect(tracker.isActive()).toBe(true);
        });

        it('chains start() and stop()', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            var result = tracker.start().stop().start();
            expect(result).toBe(tracker);
            expect(tracker.isActive()).toBe(true);
        });

        it('cleans up on destroy()', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer
            });

            tracker.destroy();
            expect(tracker.isActive()).toBe(false);
            tracker = null; // Prevent double destroy in afterEach
        });

        it('handles multiple start() calls', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            tracker.start();
            tracker.start(); // Should not throw or duplicate listeners
            expect(tracker.isActive()).toBe(true);
        });

        it('handles multiple stop() calls', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer
            });

            tracker.stop();
            tracker.stop(); // Should not throw
            expect(tracker.isActive()).toBe(false);
        });

    });

    describe('Configuration', function() {

        it('accepts custom namespace', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                namespace: 'mytracker',
                autoStart: false
            });

            expect(tracker).toBeDefined();
        });

        it('accepts throttle mode as raf', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: 'raf',
                autoStart: false
            });

            expect(tracker).toBeDefined();
        });

        it('accepts throttle mode as number (ms)', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: 100,
                autoStart: false
            });

            expect(tracker).toBeDefined();
        });

        it('accepts thresholds array', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                thresholds: [100, 200, 300],
                autoStart: false
            });

            expect(tracker).toBeDefined();
        });

        it('accepts trackDirection option', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                trackDirection: true,
                autoStart: false
            });

            expect(tracker).toBeDefined();
        });

        it('accepts trackVelocity option', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                trackVelocity: true,
                autoStart: false
            });

            expect(tracker).toBeDefined();
        });

        it('accepts trackHorizontal option', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                trackHorizontal: true,
                autoStart: false
            });

            expect(tracker).toBeDefined();
        });

    });

    describe('getState()', function() {

        it('returns current scroll state', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            var state = tracker.getState();

            expect(state).toBeDefined();
            expect(typeof state.scrollY).toBe('number');
            expect(typeof state.scrollX).toBe('number');
            expect(typeof state.isActive).toBe('boolean');
        });

        it('includes crossedThresholds', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                thresholds: [100, 200],
                autoStart: false
            });

            var state = tracker.getState();

            expect(state.crossedThresholds).toBeDefined();
            expect(typeof state.crossedThresholds).toBe('object');
        });

        it('returns null after destroy', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            tracker.destroy();
            var state = tracker.getState();

            expect(state).toBeNull();
            tracker = null;
        });

    });

    describe('Scroll Callbacks', function() {

        it('fires onScroll callback on scroll event', function(done) {
            var scrollData = null;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null, // No throttling for immediate callback
                onScroll: function(data) {
                    scrollData = data;
                }
            });

            // Trigger scroll
            scrollContainer.scrollTop = 50;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(scrollData).not.toBeNull();
                expect(scrollData.scrollY).toBe(50);
                done();
            }, 50);
        });

        it('includes direction in scroll data when trackDirection is true', function(done) {
            var scrollData = null;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                trackDirection: true,
                onScroll: function(data) {
                    scrollData = data;
                }
            });

            // Trigger scroll down
            scrollContainer.scrollTop = 100;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(scrollData).not.toBeNull();
                expect(scrollData.direction).toBe('down');
                done();
            }, 50);
        });

        it('detects scroll up direction', function(done) {
            var scrollData = null;

            // Start at scroll position 100
            scrollContainer.scrollTop = 100;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                trackDirection: true,
                onScroll: function(data) {
                    scrollData = data;
                }
            });

            // Trigger scroll up
            scrollContainer.scrollTop = 50;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(scrollData).not.toBeNull();
                expect(scrollData.direction).toBe('up');
                done();
            }, 50);
        });

        it('includes velocity in scroll data when trackVelocity is true', function(done) {
            var scrollData = null;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                trackVelocity: true,
                onScroll: function(data) {
                    scrollData = data;
                }
            });

            // Trigger scroll
            scrollContainer.scrollTop = 100;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(scrollData).not.toBeNull();
                expect(typeof scrollData.velocity).toBe('number');
                done();
            }, 50);
        });

        it('includes deltaY in scroll data', function(done) {
            var scrollData = null;
            var captured = false;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                onScroll: function(data) {
                    // Only capture the first scroll event (setting scrollTop may fire one automatically)
                    if (!captured) {
                        scrollData = data;
                        captured = true;
                    }
                }
            });

            // Trigger scroll - setting scrollTop fires a scroll event
            scrollContainer.scrollTop = 75;

            setTimeout(function() {
                expect(scrollData).not.toBeNull();
                // Allow 1 decimal place precision (within ±5) due to browser subpixel rendering
                expect(scrollData.deltaY).toBeCloseTo(75, -1);
                done();
            }, 50);
        });

        it('includes timestamp in scroll data', function(done) {
            var scrollData = null;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                onScroll: function(data) {
                    scrollData = data;
                }
            });

            // Trigger scroll
            scrollContainer.scrollTop = 50;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(scrollData).not.toBeNull();
                expect(typeof scrollData.timestamp).toBe('number');
                expect(scrollData.timestamp).toBeGreaterThan(0);
                done();
            }, 50);
        });

    });

    describe('Threshold Callbacks', function() {

        it('fires onThreshold when crossing threshold downward', function(done) {
            var thresholdData = null;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                thresholds: [50],
                onThreshold: function(data) {
                    thresholdData = data;
                }
            });

            // Scroll past threshold
            scrollContainer.scrollTop = 100;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(thresholdData).not.toBeNull();
                expect(thresholdData.threshold).toBe(50);
                expect(thresholdData.crossed).toBe('above');
                done();
            }, 50);
        });

        it('fires onThreshold when crossing threshold upward', function(done) {
            var thresholdData = null;

            // Start below threshold
            scrollContainer.scrollTop = 100;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                thresholds: [50],
                onThreshold: function(data) {
                    thresholdData = data;
                }
            });

            // Scroll above threshold
            scrollContainer.scrollTop = 25;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(thresholdData).not.toBeNull();
                expect(thresholdData.threshold).toBe(50);
                expect(thresholdData.crossed).toBe('below');
                done();
            }, 50);
        });

        it('tracks multiple thresholds', function(done) {
            var thresholdsCrossed = [];

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                thresholds: [50, 100, 150],
                onThreshold: function(data) {
                    thresholdsCrossed.push(data.threshold);
                }
            });

            // Scroll past all thresholds
            scrollContainer.scrollTop = 200;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(thresholdsCrossed).toContain(50);
                expect(thresholdsCrossed).toContain(100);
                expect(thresholdsCrossed).toContain(150);
                done();
            }, 50);
        });

        it('includes direction in threshold data', function(done) {
            var thresholdData = null;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                trackDirection: true,
                thresholds: [50],
                onThreshold: function(data) {
                    thresholdData = data;
                }
            });

            // Scroll past threshold
            scrollContainer.scrollTop = 100;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(thresholdData).not.toBeNull();
                expect(thresholdData.direction).toBe('down');
                done();
            }, 50);
        });

        it('includes scrollY in threshold data', function(done) {
            var thresholdData = null;

            tracker = ScrollTracker.create({
                target: scrollContainer,
                throttle: null,
                thresholds: [50],
                onThreshold: function(data) {
                    thresholdData = data;
                }
            });

            // Scroll past threshold
            scrollContainer.scrollTop = 75;
            scrollContainer.dispatchEvent(new Event('scroll'));

            setTimeout(function() {
                expect(thresholdData).not.toBeNull();
                // Allow ±5 precision due to browser subpixel rendering
                expect(thresholdData.scrollY).toBeCloseTo(75, -1);
                done();
            }, 50);
        });

    });

    describe('getId()', function() {

        it('returns unique tracker ID', function() {
            tracker = ScrollTracker.create({
                target: scrollContainer,
                autoStart: false
            });

            var id = tracker.getId();

            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
            expect(id).toContain('scroll-tracker-');
        });

    });

});
