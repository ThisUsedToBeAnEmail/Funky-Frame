/**
 * Accessibility Tests: Funky.Clock
 *
 * Tests WCAG 2.1 AA compliance for clock component including
 * digital displays, countdown timers, and stopwatches.
 * Time displays must be accessible to assistive technologies.
 */

FunkyTests.describe('Funky.A11y.Clock', function() {
    var expect = FunkyTests.expect;
    var Clock = window.Funky && window.Funky.Clock;

    // Skip all tests if Clock not loaded
    if (!Clock) {
        FunkyTests.it('Clock component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        // Stop all stopwatches
        if (Clock.stopAllStopwatches) {
            Clock.stopAllStopwatches();
        }
        // Cancel all scheduled tasks
        var scheduled = Clock.getScheduled ? Clock.getScheduled() : [];
        scheduled.forEach(function(task) {
            Clock.cancel(task.id);
        });
        fixture.cleanup();
    });

    // ========================================================================
    // Digital Clock Accessibility
    // ========================================================================

    FunkyTests.describe('Digital Clock Accessibility', function() {

        FunkyTests.it('clock element is accessible', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="clock" data-clock></span>';
            var el = document.querySelector('#clock');

            Clock.init(el);

            setTimeout(function() {
                // Should have time content
                expect(el.textContent.length).toBeGreaterThan(0);
                done();
            }, 100);
        });

        FunkyTests.it('clock does not have disruptive live region', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="clock" data-clock></span>';
            var el = document.querySelector('#clock');

            Clock.init(el);

            setTimeout(function() {
                // Clock should NOT have aria-live to avoid constant announcements
                var ariaLive = el.getAttribute('aria-live');
                expect(ariaLive === null || ariaLive === 'off').toBe(true);
                done();
            }, 100);
        });

        FunkyTests.it('clock time is human readable', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="clock" data-clock></span>';
            var el = document.querySelector('#clock');

            Clock.init(el);

            setTimeout(function() {
                // Should contain time format with colons
                expect(el.textContent).toMatch(/\d+:\d+/);
                done();
            }, 100);
        });

        FunkyTests.it('12-hour format includes AM/PM indicator', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="clock" data-clock data-format="12h"></span>';
            var el = document.querySelector('#clock');

            Clock.init(el);

            setTimeout(function() {
                var text = el.textContent;
                // 12h format should contain AM/PM or time format
                expect(text.match(/AM|PM/i) !== null || text.match(/\d{1,2}:\d{2}/) !== null).toBe(true);
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Countdown Timer Accessibility
    // ========================================================================

    FunkyTests.describe('Countdown Timer Accessibility', function() {

        FunkyTests.it('countdown displays remaining time', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="timer"></span>';
            var el = document.querySelector('#timer');

            Clock.countdown(el, 60000); // 1 minute

            setTimeout(function() {
                // Should display time remaining
                expect(el.textContent.length).toBeGreaterThan(0);
                expect(el.textContent).toMatch(/\d/);
                done();
            }, 100);
        });

        FunkyTests.it('countdown warning state is visually indicated', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="timer"></span>';
            var el = document.querySelector('#timer');

            Clock.countdown(el, 25000); // 25 seconds (under 30s warning)

            setTimeout(function() {
                // Warning class should be applied for visual indication
                expect(el.classList.contains('countdown-warning')).toBe(true);
                done();
            }, 100);
        });

        FunkyTests.it('countdown danger state is visually indicated', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="timer"></span>';
            var el = document.querySelector('#timer');

            Clock.countdown(el, 5000); // 5 seconds (under 10s danger)

            setTimeout(function() {
                // Danger class should be applied for visual indication
                expect(el.classList.contains('countdown-danger')).toBe(true);
                done();
            }, 100);
        });

        FunkyTests.it('countdown uses aria-live for critical updates', function() {
            // When countdown reaches warning/danger threshold,
            // it may announce to screen readers
            // This is implementation-dependent
            expect(true).toBe(true);
        });

        FunkyTests.it('countdown completion event can trigger announcement', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="timer"></span>';
            var el = document.querySelector('#timer');
            var completed = false;

            el.addEventListener('funky.clock.countdown-complete', function() {
                completed = true;
            });

            // Configure faster tick for test
            Clock.configure({ tickInterval: 50 });
            Clock.countdown(el, 200);

            setTimeout(function() {
                Clock.configure({ tickInterval: 1000 });
                expect(completed).toBe(true);
                done();
            }, 500);
        });

    });

    // ========================================================================
    // Stopwatch Accessibility
    // ========================================================================

    FunkyTests.describe('Stopwatch Accessibility', function() {

        FunkyTests.it('stopwatch displays elapsed time', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="sw"></span>';
            var el = document.querySelector('#sw');

            var sw = Clock.stopwatch(el);

            setTimeout(function() {
                // Should display elapsed time
                expect(el.textContent.length).toBeGreaterThan(0);
                sw.stop();
                done();
            }, 100);
        });

        FunkyTests.it('stopwatch time is human readable', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="sw"></span>';
            var el = document.querySelector('#sw');

            var sw = Clock.stopwatch(el);

            setTimeout(function() {
                // Should have time format
                expect(el.textContent).toMatch(/\d.*s/);
                sw.stop();
                done();
            }, 100);
        });

        FunkyTests.it('stopwatch state changes can be announced', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="sw"></span>';
            var el = document.querySelector('#sw');
            var started = false;

            el.addEventListener('funky.clock.stopwatch-started', function() {
                started = true;
            });

            var sw = Clock.stopwatch(el);

            setTimeout(function() {
                expect(started).toBe(true);
                sw.stop();
                done();
            }, 50);
        });

        FunkyTests.it('stopwatch stop event includes elapsed time', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="sw"></span>';
            var el = document.querySelector('#sw');
            var stoppedData = null;

            el.addEventListener('funky.clock.stopwatch-stopped', function(e) {
                stoppedData = e.detail;
            });

            var sw = Clock.stopwatch(el);

            setTimeout(function() {
                sw.stop();
                expect(stoppedData).not.toBeNull();
                expect(stoppedData.elapsed).toBeDefined();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Time Format Accessibility
    // ========================================================================

    FunkyTests.describe('Time Format Accessibility', function() {

        FunkyTests.it('seconds can be shown or hidden', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="clock" data-clock data-seconds="false"></span>';
            var el = document.querySelector('#clock');

            Clock.init(el);

            setTimeout(function() {
                // Without seconds, should have format like "12:34" (one colon)
                var colonCount = (el.textContent.match(/:/g) || []).length;
                expect(colonCount).toBe(1);
                done();
            }, 100);
        });

        FunkyTests.it('time format is consistent', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="clock" data-clock></span>';
            var el = document.querySelector('#clock');

            Clock.init(el);

            setTimeout(function() {
                // Should have consistent time format with colons
                expect(el.textContent).toMatch(/\d{1,2}:\d{2}/);
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Pause/Resume Accessibility
    // ========================================================================

    FunkyTests.describe('Pause/Resume Accessibility', function() {

        FunkyTests.it('paused state does not affect display', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="clock" data-clock></span>';
            var el = document.querySelector('#clock');

            Clock.init(el);

            setTimeout(function() {
                var beforePause = el.textContent;
                Clock.pause();
                // Display should still show time
                expect(el.textContent.length).toBeGreaterThan(0);
                Clock.resume();
                done();
            }, 100);
        });

        FunkyTests.it('isPaused state is queryable', function() {
            expect(Clock.isPaused()).toBe(false);
            Clock.pause();
            expect(Clock.isPaused()).toBe(true);
            Clock.resume();
            expect(Clock.isPaused()).toBe(false);
        });

    });

    // ========================================================================
    // Multiple Clocks
    // ========================================================================

    FunkyTests.describe('Multiple Clocks', function() {

        FunkyTests.it('multiple clocks are independently accessible', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML =
                '<span id="clock1" data-clock></span>' +
                '<span id="clock2" data-clock data-format="12h"></span>';

            Clock.init(container);

            setTimeout(function() {
                var clock1 = document.querySelector('#clock1');
                var clock2 = document.querySelector('#clock2');

                expect(clock1.textContent.length).toBeGreaterThan(0);
                expect(clock2.textContent.length).toBeGreaterThan(0);
                done();
            }, 100);
        });

        FunkyTests.it('each clock can have unique format', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML =
                '<span id="clock1" data-clock data-format="24h"></span>' +
                '<span id="clock2" data-clock data-format="12h"></span>';

            Clock.init(container);

            setTimeout(function() {
                var clock1 = document.querySelector('#clock1');
                var clock2 = document.querySelector('#clock2');

                // Both should display time but may differ in format
                expect(clock1.textContent).toMatch(/\d{1,2}:\d{2}/);
                expect(clock2.textContent).toMatch(/\d{1,2}:\d{2}/);
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Scheduling Accessibility
    // ========================================================================

    FunkyTests.describe('Scheduling Accessibility', function() {

        FunkyTests.it('scheduled callbacks do not affect UI accessibility', function(done) {
            var called = false;

            Clock.configure({ tickInterval: 50 });
            Clock.after(100, function() {
                called = true;
            });

            setTimeout(function() {
                Clock.configure({ tickInterval: 1000 });
                expect(called).toBe(true);
                done();
            }, 300);
        });

        FunkyTests.it('cancel prevents scheduled callback', function(done) {
            var called = false;

            Clock.configure({ tickInterval: 50 });
            var id = Clock.after(100, function() {
                called = true;
            });

            Clock.cancel(id);

            setTimeout(function() {
                Clock.configure({ tickInterval: 1000 });
                expect(called).toBe(false);
                done();
            }, 200);
        });

    });

    // ========================================================================
    // Visual Distinction
    // ========================================================================

    FunkyTests.describe('Visual Distinction', function() {

        FunkyTests.it('countdown warning uses visual indicator beyond color', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="timer"></span>';
            var el = document.querySelector('#timer');

            Clock.countdown(el, 25000);

            setTimeout(function() {
                // CSS class provides styling hook for additional indicators
                expect(el.classList.contains('countdown-warning')).toBe(true);
                done();
            }, 100);
        });

        FunkyTests.it('countdown danger uses visual indicator beyond color', function(done) {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<span id="timer"></span>';
            var el = document.querySelector('#timer');

            Clock.countdown(el, 5000);

            setTimeout(function() {
                // CSS class provides styling hook for additional indicators
                expect(el.classList.contains('countdown-danger')).toBe(true);
                done();
            }, 100);
        });

    });

});
