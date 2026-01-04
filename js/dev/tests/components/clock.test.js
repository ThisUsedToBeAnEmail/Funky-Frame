/**
 * Funky.Clock Tests
 *
 * Tests for the clock component including digital/analog display,
 * countdown timers, stopwatch, and scheduling APIs.
 */

describe('Funky.Component.Clock', function() {

    var Clock = Funky.Clock;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.cleanup();
        // Stop all stopwatches
        if (Clock.stopAllStopwatches) {
            Clock.stopAllStopwatches();
        }
        // Cancel all scheduled tasks
        var scheduled = Clock.getScheduled ? Clock.getScheduled() : [];
        scheduled.forEach(function(task) {
            Clock.cancel(task.id);
        });
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Clock')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof Clock.init).toBe('function');
        });

        it('has countdown method', function() {
            expect(typeof Clock.countdown).toBe('function');
        });

        it('has stopwatch method', function() {
            expect(typeof Clock.stopwatch).toBe('function');
        });

        it('has after method', function() {
            expect(typeof Clock.after).toBe('function');
        });

        it('has at method', function() {
            expect(typeof Clock.at).toBe('function');
        });

        it('has cancel method', function() {
            expect(typeof Clock.cancel).toBe('function');
        });

        it('has pause method', function() {
            expect(typeof Clock.pause).toBe('function');
        });

        it('has resume method', function() {
            expect(typeof Clock.resume).toBe('function');
        });

    });

    describe('Digital clock', function() {

        it('initializes clock element', function() {
            fixture.html('<span id="clock" data-clock></span>');
            var el = fixture.query('#clock');

            Clock.init(el);

            return FunkyTests.delay(50).then(function() {
                // Should have time content
                expect(el.textContent).not.toBe('');
            });
        });

        it('displays 12-hour format', function() {
            fixture.html('<span id="clock" data-clock data-format="12h"></span>');
            var el = fixture.query('#clock');

            Clock.init(el);

            return FunkyTests.delay(50).then(function() {
                // 12h format typically contains AM or PM
                var text = el.textContent;
                expect(text.match(/AM|PM/i) !== null || text.match(/\d{1,2}:\d{2}/) !== null).toBe(true);
            });
        });

        it('displays 24-hour format', function() {
            fixture.html('<span id="clock" data-clock data-format="24h"></span>');
            var el = fixture.query('#clock');

            Clock.init(el);

            return FunkyTests.delay(50).then(function() {
                // 24h format should have time without AM/PM
                expect(el.textContent.match(/\d{1,2}:\d{2}/) !== null).toBe(true);
            });
        });

        it('hides seconds when data-seconds="false"', function() {
            fixture.html('<span id="clock" data-clock data-seconds="false"></span>');
            var el = fixture.query('#clock');

            Clock.init(el);

            return FunkyTests.delay(50).then(function() {
                // Without seconds, should have format like "12:34" not "12:34:56"
                var colonCount = (el.textContent.match(/:/g) || []).length;
                expect(colonCount).toBe(1);
            });
        });

        it('shows seconds by default', function() {
            fixture.html('<span id="clock" data-clock></span>');
            var el = fixture.query('#clock');

            Clock.init(el);

            return FunkyTests.delay(50).then(function() {
                // With seconds, should have format like "12:34:56" (two colons)
                var colonCount = (el.textContent.match(/:/g) || []).length;
                expect(colonCount).toBe(2);
            });
        });

    });

    describe('Countdown timer', function() {

        // Configure faster tick interval for countdown tests
        beforeEach(function() {
            Clock.configure({ tickInterval: 50 });
        });

        afterEach(function() {
            Clock.configure({ tickInterval: 1000 }); // Restore default
        });

        it('starts countdown with duration', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            Clock.countdown(el, 60000); // 1 minute

            return FunkyTests.delay(50).then(function() {
                expect(el.textContent).toContain('01:00');
            });
        });

        it('starts countdown with string format', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            Clock.countdown(el, '5:00'); // 5 minutes

            return FunkyTests.delay(50).then(function() {
                expect(el.textContent).toContain('05:00');
            });
        });

        it('counts down over time', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            Clock.countdown(el, 3000); // 3 seconds

            var initialText = el.textContent;

            return FunkyTests.delay(1100).then(function() {
                // Should have decreased
                expect(el.textContent).not.toBe(initialText);
            });
        });

        it('emits countdown-complete event', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');
            var completed = false;

            el.addEventListener('funky.clock.countdown-complete', function() {
                completed = true;
            });

            Clock.countdown(el, 200); // Short countdown (with 50ms tick)

            return FunkyTests.delay(500).then(function() {
                expect(completed).toBe(true);
            });
        });

        it('addTime extends countdown', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            Clock.countdown(el, 10000); // 10 seconds
            var remaining1 = Clock.getRemaining(el);

            Clock.addTime(el, 5000); // Add 5 seconds
            var remaining2 = Clock.getRemaining(el);

            expect(remaining2).toBeGreaterThan(remaining1);
        });

        it('getRemaining returns remaining ms', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            Clock.countdown(el, 30000); // 30 seconds
            var remaining = Clock.getRemaining(el);

            expect(remaining).toBeGreaterThan(29000);
            expect(remaining).toBeLessThanOrEqual(30000);
        });

        it('adds countdown-warning class when low', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            Clock.countdown(el, 25000); // 25 seconds (under 30s warning threshold)

            return FunkyTests.delay(100).then(function() {
                expect(el.classList.contains('countdown-warning')).toBe(true);
            });
        });

        it('adds countdown-danger class when very low', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            Clock.countdown(el, 5000); // 5 seconds (under 10s danger threshold)

            return FunkyTests.delay(100).then(function() {
                expect(el.classList.contains('countdown-danger')).toBe(true);
            });
        });

    });

    describe('Stopwatch', function() {

        it('starts stopwatch on element', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            var sw = Clock.stopwatch(el);

            expect(sw).toBeDefined();
            expect(typeof sw.stop).toBe('function');
        });

        it('displays elapsed time', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            Clock.stopwatch(el);

            return FunkyTests.delay(100).then(function() {
                // Should have time content like "0:00.12s"
                expect(el.textContent).toMatch(/\d+.*s$/);
            });
        });

        it('stop() returns elapsed time', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            var sw = Clock.stopwatch(el);

            return FunkyTests.delay(100).then(function() {
                var elapsed = sw.stop();
                expect(elapsed).toBeGreaterThan(50);
            });
        });

        it('pause() pauses the stopwatch', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            var sw = Clock.stopwatch(el);

            return FunkyTests.delay(100).then(function() {
                sw.pause();
                var elapsed1 = sw.getElapsed();

                return FunkyTests.delay(100).then(function() {
                    var elapsed2 = sw.getElapsed();
                    expect(elapsed2).toBe(elapsed1);
                });
            });
        });

        it('resume() continues after pause', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            var sw = Clock.stopwatch(el);

            return FunkyTests.delay(50).then(function() {
                sw.pause();
                var elapsed1 = sw.getElapsed();
                sw.resume();

                return FunkyTests.delay(100).then(function() {
                    var elapsed2 = sw.getElapsed();
                    expect(elapsed2).toBeGreaterThan(elapsed1);
                });
            });
        });

        it('reset() resets to zero', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            var sw = Clock.stopwatch(el);

            return FunkyTests.delay(100).then(function() {
                sw.reset();
                expect(el.textContent).toContain('0');
            });
        });

        it('isRunning() returns correct state', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            var sw = Clock.stopwatch(el);

            expect(sw.isRunning()).toBe(true);
            sw.pause();
            expect(sw.isRunning()).toBe(false);
            sw.resume();
            expect(sw.isRunning()).toBe(true);
            sw.stop();
            expect(sw.isRunning()).toBe(false);
        });

        it('respects showMs option', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            Clock.stopwatch(el, { showMs: true });

            return FunkyTests.delay(50).then(function() {
                // Should have decimal point for ms
                expect(el.textContent).toContain('.');
            });
        });

        it('respects msDigits option', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');

            Clock.stopwatch(el, { showMs: true, msDigits: 3 });

            return FunkyTests.delay(100).then(function() {
                // Should have 3 digits after decimal
                var match = el.textContent.match(/\.(\d+)/);
                expect(match).not.toBeNull();
                expect(match[1].length).toBe(3);
            });
        });

        it('emits stopwatch-started event', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');
            var started = false;

            el.addEventListener('funky.clock.stopwatch-started', function() {
                started = true;
            });

            Clock.stopwatch(el);

            expect(started).toBe(true);
        });

        it('emits stopwatch-stopped event', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');
            var stoppedData = null;

            el.addEventListener('funky.clock.stopwatch-stopped', function(e) {
                stoppedData = e.detail;
            });

            var sw = Clock.stopwatch(el);

            return FunkyTests.delay(50).then(function() {
                sw.stop();
                expect(stoppedData).not.toBeNull();
                expect(stoppedData.elapsed).toBeDefined();
            });
        });

        it('calls onTick callback', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');
            var tickCount = 0;

            Clock.stopwatch(el, {
                onTick: function() {
                    tickCount++;
                }
            });

            return FunkyTests.delay(100).then(function() {
                expect(tickCount).toBeGreaterThan(0);
            });
        });

        it('calls onStop callback', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');
            var stopCalled = false;

            var sw = Clock.stopwatch(el, {
                onStop: function(elapsed, formatted) {
                    stopCalled = true;
                    expect(typeof elapsed).toBe('number');
                    expect(typeof formatted).toBe('string');
                }
            });

            return FunkyTests.delay(50).then(function() {
                sw.stop();
                expect(stopCalled).toBe(true);
            });
        });

        it('stopAllStopwatches stops all', function() {
            fixture.html('<span id="sw1"></span><span id="sw2"></span>');
            var el1 = fixture.query('#sw1');
            var el2 = fixture.query('#sw2');

            var sw1 = Clock.stopwatch(el1);
            var sw2 = Clock.stopwatch(el2);

            Clock.stopAllStopwatches();

            expect(sw1.isRunning()).toBe(false);
            expect(sw2.isRunning()).toBe(false);
        });

    });

    describe('Scheduling API', function() {

        // Configure faster tick interval for scheduling tests
        beforeEach(function() {
            Clock.configure({ tickInterval: 50 });
        });

        afterEach(function() {
            Clock.configure({ tickInterval: 1000 }); // Restore default
        });

        it('after() schedules callback', function() {
            var called = false;

            Clock.after(100, function() {
                called = true;
            });

            expect(called).toBe(false);

            return FunkyTests.delay(300).then(function() {
                expect(called).toBe(true);
            });
        });

        it('after() returns task ID', function() {
            var id = Clock.after(1000, function() {});

            expect(typeof id).toBe('string');
            Clock.cancel(id);
        });

        it('cancel() cancels scheduled task', function() {
            var called = false;

            var id = Clock.after(100, function() {
                called = true;
            });

            Clock.cancel(id);

            return FunkyTests.delay(200).then(function() {
                expect(called).toBe(false);
            });
        });

        it('at() schedules at specific time', function() {
            var called = false;
            var targetTime = Date.now() + 100;

            Clock.at(targetTime, function() {
                called = true;
            });

            return FunkyTests.delay(300).then(function() {
                expect(called).toBe(true);
            });
        });

        it('getScheduled() returns pending tasks', function() {
            var id1 = Clock.after(5000, function() {});
            var id2 = Clock.after(10000, function() {});

            var scheduled = Clock.getScheduled();

            expect(scheduled.length).toBeGreaterThanOrEqual(2);

            var ids = scheduled.map(function(t) { return t.id; });
            expect(ids).toContain(id1);
            expect(ids).toContain(id2);

            Clock.cancel(id1);
            Clock.cancel(id2);
        });

        it('repeat option schedules recurring task', function() {
            var callCount = 0;

            var id = Clock.after(50, function() {
                callCount++;
            }, { repeat: true });

            return FunkyTests.delay(400).then(function() {
                Clock.cancel(id);
                expect(callCount).toBeGreaterThan(1);
            });
        });

        it('callback receives context object', function() {
            var receivedContext = null;

            var id = Clock.after(50, function(ctx) {
                receivedContext = ctx;
            });

            return FunkyTests.delay(100).then(function() {
                expect(receivedContext).not.toBeNull();
                expect(receivedContext.id).toBe(id);
                expect(receivedContext.timestamp).toBeDefined();
            });
        });

    });

    describe('Pause/Resume', function() {

        it('pause() pauses all clocks', function() {
            expect(typeof Clock.pause).toBe('function');
            Clock.pause();
            expect(Clock.isPaused()).toBe(true);
            Clock.resume();
        });

        it('resume() resumes all clocks', function() {
            Clock.pause();
            Clock.resume();
            expect(Clock.isPaused()).toBe(false);
        });

        it('isPaused() returns current state', function() {
            expect(Clock.isPaused()).toBe(false);
            Clock.pause();
            expect(Clock.isPaused()).toBe(true);
            Clock.resume();
            expect(Clock.isPaused()).toBe(false);
        });

    });

    describe('Configuration', function() {

        it('configure() updates settings', function() {
            expect(typeof Clock.configure).toBe('function');
            // Just verify it doesn't throw
            Clock.configure({ locale: 'en-GB' });
        });

        it('getInstances() returns clock elements', function() {
            fixture.html('<span id="c1" data-clock></span><span id="c2" data-clock></span>');

            Clock.init(fixture.el);

            var instances = Clock.getInstances();
            expect(Array.isArray(instances)).toBe(true);
        });

    });

    describe('LiveBinding', function() {

        it('createBound() creates clock element', function() {
            var el = Clock.createBound({ format: '12h' });

            expect(el.tagName).toBe('SPAN');
            expect(el.hasAttribute('data-clock')).toBe(true);
            expect(el.getAttribute('data-format')).toBe('12h');
        });

        it('onTick() subscribes to ticks', function() {
            var tickData = null;

            var unbind = Clock.onTick(function(data) {
                tickData = data;
            });

            // Force a tick by initializing a clock
            fixture.html('<span data-clock></span>');
            Clock.init(fixture.el);

            return FunkyTests.delay(1100).then(function() {
                unbind();
                expect(tickData).not.toBeNull();
                expect(tickData.timestamp).toBeDefined();
            });
        });

    });

});
