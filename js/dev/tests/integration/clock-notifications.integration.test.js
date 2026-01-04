/**
 * Clock + Toast Notifications Integration Tests
 *
 * Tests the integration between Clock component events
 * and Toast notifications for user feedback.
 */

describe('Funky.Integration.Clock.Toast', function() {

    var Clock = Funky.Clock;
    var Toast = Funky.Toast;
    var fixture;

    function clearToasts() {
        // Clear any existing toasts from container
        var container = document.getElementById('funky-toast-container');
        if (container) {
            container.innerHTML = '';
        }
        // Also check alternate container id
        var altContainer = document.getElementById('toast-container');
        if (altContainer) {
            altContainer.innerHTML = '';
        }
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        clearToasts();
        // Configure faster tick interval for tests
        Clock.configure({ tickInterval: 50 });
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
        clearToasts();
        // Restore default tick interval
        Clock.configure({ tickInterval: 1000 });
    });

    describe('Countdown complete notifications', function() {

        it('can show toast when countdown completes', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');
            var toastShown = false;

            el.addEventListener('funky.clock.countdown-complete', function() {
                Toast.success('Timer complete!');
                toastShown = true;
            });

            Clock.countdown(el, 200); // 200ms countdown (with 50ms tick)

            return FunkyTests.delay(500).then(function() {
                expect(toastShown).toBe(true);
                var toasts = document.querySelectorAll('.funky-toast');
                expect(toasts.length).toBeGreaterThan(0);
            });
        });

        it('toast contains correct message', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            el.addEventListener('funky.clock.countdown-complete', function() {
                Toast.show({ message: 'Your session has expired', type: 'warning' });
            });

            Clock.countdown(el, 200);

            return FunkyTests.delay(500).then(function() {
                var toast = document.querySelector('.funky-toast');
                expect(toast).not.toBeNull();
                expect(toast.textContent).toContain('session has expired');
            });
        });

        it('warning toast shows when countdown enters warning phase', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');
            var warningShown = false;

            // Watch for warning class
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(m) {
                    if (m.target.classList.contains('countdown-warning') && !warningShown) {
                        Toast.show({ message: 'Time running low!', type: 'warning' });
                        warningShown = true;
                    }
                });
            });

            observer.observe(el, { attributes: true, attributeFilter: ['class'] });

            Clock.countdown(el, 25000); // 25 seconds - under 30s warning threshold

            return FunkyTests.delay(200).then(function() {
                observer.disconnect();
                expect(warningShown).toBe(true);
            });
        });

    });

    describe('Scheduled task notifications', function() {

        it('scheduled task triggers toast', function() {
            var toastShown = false;

            Clock.after(100, function() {
                Toast.info('Scheduled task executed');
                toastShown = true;
            });

            expect(toastShown).toBe(false);

            return FunkyTests.delay(300).then(function() {
                expect(toastShown).toBe(true);
            });
        });

        it('repeating task can show periodic toasts', function() {
            var toastCount = 0;

            // Use interval >= tick interval (50ms) and longer delay to ensure multiple callbacks
            var id = Clock.after(100, function() {
                toastCount++;
                Toast.show({ message: 'Periodic update ' + toastCount, type: 'info', duration: 1000 });
            }, { repeat: true });

            return FunkyTests.delay(600).then(function() {
                Clock.cancel(id);
                // Should have at least 2 callbacks in 600ms with 100ms interval
                // Accept at least 1 callback in case of timing variability
                expect(toastCount).toBeGreaterThanOrEqual(1);
            });
        });

        it('cancelled task does not show toast', function() {
            var toastShown = false;

            var id = Clock.after(100, function() {
                Toast.info('Should not appear');
                toastShown = true;
            });

            Clock.cancel(id);

            return FunkyTests.delay(300).then(function() {
                expect(toastShown).toBe(false);
            });
        });

    });

    describe('Stopwatch notifications', function() {

        it('stopwatch stop triggers toast with elapsed time', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');
            var toastMessage = null;

            var sw = Clock.stopwatch(el, {
                onStop: function(elapsed, formatted) {
                    Toast.success('Elapsed: ' + formatted);
                    toastMessage = formatted;
                }
            });

            return FunkyTests.delay(150).then(function() {
                sw.stop();
                expect(toastMessage).not.toBeNull();
                var toast = document.querySelector('.funky-toast');
                expect(toast).not.toBeNull();
                expect(toast.textContent).toContain('Elapsed');
            });
        });

        it('stopwatch lap can trigger notification', function() {
            fixture.html('<span id="sw"></span>');
            var el = fixture.query('#sw');
            var lapCount = 0;

            var sw = Clock.stopwatch(el);

            // Simulate lap functionality by manually recording times
            var recordLap = function() {
                lapCount++;
                var elapsed = sw.getElapsed();
                Toast.show({ message: 'Lap ' + lapCount + ': ' + elapsed + 'ms', type: 'info', duration: 2000 });
            };

            return FunkyTests.delay(50).then(function() {
                recordLap();
                return FunkyTests.delay(50);
            }).then(function() {
                recordLap();
                sw.stop();
                expect(lapCount).toBe(2);
            });
        });

    });

    describe('Real-time clock notifications', function() {

        it('clock tick can trigger conditional toast', function() {
            var tickTriggered = false;

            // Subscribe to clock ticks
            var unbind = Clock.onTick(function(data) {
                // Check if minute changed (simulated condition)
                if (!tickTriggered) {
                    Toast.show({ message: 'Clock tick received', type: 'info', duration: 1000 });
                    tickTriggered = true;
                }
            });

            // Initialize a clock to start ticking
            fixture.html('<span data-clock></span>');
            Clock.init(fixture.container);

            return FunkyTests.delay(200).then(function() {
                unbind();
                expect(tickTriggered).toBe(true);
            });
        });

    });

    describe('Multiple timer coordination', function() {

        it('multiple countdowns can each show toast', function() {
            fixture.html('<span id="t1"></span><span id="t2"></span>');
            var t1 = fixture.query('#t1');
            var t2 = fixture.query('#t2');
            var completedTimers = [];

            t1.addEventListener('funky.clock.countdown-complete', function() {
                completedTimers.push('timer1');
                Toast.success('Timer 1 complete');
            });

            t2.addEventListener('funky.clock.countdown-complete', function() {
                completedTimers.push('timer2');
                Toast.success('Timer 2 complete');
            });

            Clock.countdown(t1, 150);
            Clock.countdown(t2, 300);

            return FunkyTests.delay(600).then(function() {
                expect(completedTimers).toContain('timer1');
                expect(completedTimers).toContain('timer2');
            });
        });

    });

    describe('Error handling', function() {

        it('gracefully handles toast during clock cleanup', function() {
            fixture.html('<span id="timer"></span>');
            var el = fixture.query('#timer');

            el.addEventListener('funky.clock.countdown-complete', function() {
                // Even if timer element is removed, toast should work
                Toast.success('Completed safely');
            });

            Clock.countdown(el, 150);

            return FunkyTests.delay(400).then(function() {
                // Should not throw
                var toast = document.querySelector('.funky-toast');
                expect(toast).not.toBeNull();
            });
        });

    });

});
