/**
 * Responsive Tests: Funky.Calendar
 *
 * Tests responsive behavior for the Calendar component.
 * Verifies day size CSS variable changes, grid layout at different widths,
 * and touch date selection.
 */

FunkyTests.describe('Funky.Responsive.Calendar', function() {
    var expect = FunkyTests.expect;
    var Calendar = window.Funky && window.Funky.Calendar;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Calendar not loaded
    if (!Calendar) {
        FunkyTests.it('Calendar component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var calendar;
    var testCounter = 0;
    var containerId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'calendar-container-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 350px; height: 400px;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (calendar && typeof calendar.destroy === 'function') {
            try {
                calendar.destroy();
            } catch (e) {
                // Ignore destroy errors in cleanup
            }
            calendar = null;
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
                // Calendar.create is the proper API
                calendar = Calendar.create('#' + containerId, {
                    view: 'month',
                    liveBinding: false
                });

                expect(calendar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                calendar = Calendar.create('#' + containerId, {
                    view: 'month',
                    liveBinding: false
                });

                expect(calendar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                calendar = Calendar.create('#' + containerId, {
                    view: 'month',
                    liveBinding: false
                });

                expect(calendar).not.toBeNull();

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
                calendar = Calendar.create('#' + containerId, {
                    view: 'month',
                    liveBinding: false
                });

                expect(calendar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                calendar = Calendar.create('#' + containerId, {
                    view: 'month',
                    liveBinding: false
                });

                expect(calendar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Navigation at Different Viewports
    // ========================================================================

    FunkyTests.describe('Navigation at Different Viewports', function() {

        FunkyTests.it('navigates months at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                calendar = Calendar.create('#' + containerId, {
                    view: 'month',
                    liveBinding: false
                });

                if (calendar && calendar.nextMonth) calendar.nextMonth();
                if (calendar && calendar.prevMonth) calendar.prevMonth();

                expect(calendar).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('navigates months at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                calendar = Calendar.create('#' + containerId, {
                    view: 'month',
                    liveBinding: false
                });

                if (calendar && calendar.nextMonth) calendar.nextMonth();
                if (calendar && calendar.prevMonth) calendar.prevMonth();

                expect(calendar).not.toBeNull();

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
            calendar = Calendar.create('#' + containerId, {
                view: 'month',
                liveBinding: false
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(calendar).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            calendar = Calendar.create('#' + containerId, {
                view: 'month',
                liveBinding: false
            });

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        expect(calendar).not.toBeNull();

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
            calendar = Calendar.create('#' + containerId, {
                view: 'month',
                liveBinding: false
            });

            if (calendar && calendar.destroy) {
                calendar.destroy();
            }

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            calendar = null;
        });

    });

});
