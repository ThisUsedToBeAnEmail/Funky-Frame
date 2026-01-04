/**
 * Funky.IdleDetector Tests
 *
 * Tests for user activity and idle state detection.
 */
FunkyTests.describe('Funky.Core.IdleDetector', function() {
    var expect = FunkyTests.expect;
    // Use direct reference to avoid issues with mocked methods from other tests
    var IdleDetector;

    FunkyTests.beforeEach(function() {
        // Get fresh reference in case other tests have mocked methods
        IdleDetector = Funky.IdleDetector;
    });

    FunkyTests.afterEach(function() {
        // Clean up between tests
        if (IdleDetector && IdleDetector.isInitialized && IdleDetector.isInitialized()) {
            IdleDetector.destroy();
        }
    });

    // =========================================================================
    // MODULE AVAILABILITY
    // =========================================================================

    FunkyTests.describe('Module availability', function() {

        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.IdleDetector).toBeDefined();
        });

        FunkyTests.it('has init method', function() {
            expect(typeof IdleDetector.init).toBe('function');
        });

        FunkyTests.it('has destroy method', function() {
            expect(typeof IdleDetector.destroy).toBe('function');
        });

        FunkyTests.it('has isInitialized method', function() {
            expect(typeof IdleDetector.isInitialized).toBe('function');
        });

        FunkyTests.it('has isIdle method', function() {
            expect(typeof IdleDetector.isIdle).toBe('function');
        });

        FunkyTests.it('has isAway method', function() {
            expect(typeof IdleDetector.isAway).toBe('function');
        });

        FunkyTests.it('has isActive method', function() {
            expect(typeof IdleDetector.isActive).toBe('function');
        });

        FunkyTests.it('has getState method', function() {
            expect(typeof IdleDetector.getState).toBe('function');
        });

        FunkyTests.it('has getIdleTime method', function() {
            expect(typeof IdleDetector.getIdleTime).toBe('function');
        });

        FunkyTests.it('has getLastActivity method', function() {
            expect(typeof IdleDetector.getLastActivity).toBe('function');
        });

        FunkyTests.it('has isTabHidden method', function() {
            expect(typeof IdleDetector.isTabHidden).toBe('function');
        });

        FunkyTests.it('has isWindowFocused method', function() {
            expect(typeof IdleDetector.isWindowFocused).toBe('function');
        });

        FunkyTests.it('has getAwayDuration method', function() {
            expect(typeof IdleDetector.getAwayDuration).toBe('function');
        });

        FunkyTests.it('has getStateInfo method', function() {
            expect(typeof IdleDetector.getStateInfo).toBe('function');
        });

        FunkyTests.it('has triggerActivity method', function() {
            expect(typeof IdleDetector.triggerActivity).toBe('function');
        });

        FunkyTests.it('has pause method', function() {
            expect(typeof IdleDetector.pause).toBe('function');
        });

        FunkyTests.it('has resume method', function() {
            expect(typeof IdleDetector.resume).toBe('function');
        });

        FunkyTests.it('has isPaused method', function() {
            expect(typeof IdleDetector.isPaused).toBe('function');
        });

        FunkyTests.it('has on method', function() {
            expect(typeof IdleDetector.on).toBe('function');
        });

        FunkyTests.it('has off method', function() {
            expect(typeof IdleDetector.off).toBe('function');
        });

        FunkyTests.it('has configure method', function() {
            expect(typeof IdleDetector.configure).toBe('function');
        });

        FunkyTests.it('has getConfig method', function() {
            expect(typeof IdleDetector.getConfig).toBe('function');
        });

    });

    // =========================================================================
    // INITIALIZATION TESTS
    // =========================================================================

    FunkyTests.describe('Initialization', function() {

        FunkyTests.it('initializes with default options', function() {
            IdleDetector.init();
            expect(IdleDetector.isInitialized()).toBe(true);
        });

        FunkyTests.it('initializes with custom idle timeout', function() {
            IdleDetector.init({ idleTimeout: 60000 });
            var config = IdleDetector.getConfig();
            expect(config.idleTimeout).toBe(60000);
        });

        FunkyTests.it('initializes with custom away timeout', function() {
            IdleDetector.init({ awayTimeout: 30000 });
            var config = IdleDetector.getConfig();
            expect(config.awayTimeout).toBe(30000);
        });

        FunkyTests.it('starts in active state', function() {
            IdleDetector.init();
            expect(IdleDetector.isActive()).toBe(true);
            expect(IdleDetector.isIdle()).toBe(false);
            expect(IdleDetector.isAway()).toBe(false);
        });

        FunkyTests.it('does not double-initialize', function() {
            IdleDetector.init({ idleTimeout: 1000 });
            IdleDetector.init({ idleTimeout: 2000 });

            var config = IdleDetector.getConfig();
            expect(config.idleTimeout).toBe(1000);
        });

        FunkyTests.it('returns this for chaining', function() {
            var result = IdleDetector.init();
            expect(result).toBe(IdleDetector);
        });

        FunkyTests.it('accepts onIdle callback', function() {
            var called = false;
            IdleDetector.init({
                idleTimeout: 50,
                onIdle: function() { called = true; }
            });

            return FunkyTests.waitFor(function() {
                return called;
            }, { timeout: 500, interval: 10 }).then(function() {
                expect(called).toBe(true);
            });
        });

        FunkyTests.it('accepts onActive callback', function() {
            var activeCalled = false;
            IdleDetector.init({
                idleTimeout: 50,
                onActive: function() { activeCalled = true; }
            });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                IdleDetector.triggerActivity();
                expect(activeCalled).toBe(true);
            });
        });

    });

    // =========================================================================
    // STATE MANAGEMENT TESTS
    // =========================================================================

    FunkyTests.describe('State management', function() {

        FunkyTests.it('transitions to idle after timeout', function() {
            IdleDetector.init({ idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                expect(IdleDetector.isIdle()).toBe(true);
                expect(IdleDetector.isActive()).toBe(false);
                expect(IdleDetector.getState()).toBe('idle');
            });
        });

        FunkyTests.it('returns to active on triggerActivity', function() {
            IdleDetector.init({ idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                IdleDetector.triggerActivity();
                expect(IdleDetector.isActive()).toBe(true);
                expect(IdleDetector.isIdle()).toBe(false);
            });
        });

        FunkyTests.it('tracks idle time correctly', function() {
            IdleDetector.init({ idleTimeout: 1000 });

            return new Promise(function(resolve) {
                setTimeout(function() {
                    var idleTime = IdleDetector.getIdleTime();
                    // Check that idleTime is at least some positive value (allow for timer variance)
                    expect(idleTime).toBeGreaterThan(0);
                    resolve();
                }, 100);
            });
        });

        FunkyTests.it('tracks last activity timestamp', function() {
            var before = Date.now();
            IdleDetector.init();
            var after = Date.now();

            var lastActivity = IdleDetector.getLastActivity();
            expect(lastActivity).toBeGreaterThanOrEqual(before);
            expect(lastActivity).toBeLessThanOrEqual(after);
        });

        FunkyTests.it('updates last activity on triggerActivity', function() {
            IdleDetector.init();

            return new Promise(function(resolve) {
                setTimeout(function() {
                    var before = Date.now();
                    IdleDetector.triggerActivity();
                    var after = Date.now();

                    var lastActivity = IdleDetector.getLastActivity();
                    expect(lastActivity).toBeGreaterThanOrEqual(before);
                    expect(lastActivity).toBeLessThanOrEqual(after);
                    resolve();
                }, 50);
            });
        });

    });

    // =========================================================================
    // PAUSE/RESUME TESTS
    // =========================================================================

    FunkyTests.describe('Pause and resume', function() {

        FunkyTests.it('pauses detection', function() {
            IdleDetector.init();
            IdleDetector.pause();
            expect(IdleDetector.isPaused()).toBe(true);
        });

        FunkyTests.it('resumes detection', function() {
            IdleDetector.init();
            IdleDetector.pause();
            IdleDetector.resume();
            expect(IdleDetector.isPaused()).toBe(false);
        });

        FunkyTests.it('does not go idle while paused', function() {
            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.pause();

            return new Promise(function(resolve) {
                setTimeout(function() {
                    expect(IdleDetector.isIdle()).toBe(false);
                    resolve();
                }, 100);
            });
        });

        FunkyTests.it('pause returns this for chaining', function() {
            IdleDetector.init();
            var result = IdleDetector.pause();
            expect(result).toBe(IdleDetector);
        });

        FunkyTests.it('resume returns this for chaining', function() {
            IdleDetector.init();
            IdleDetector.pause();
            var result = IdleDetector.resume();
            expect(result).toBe(IdleDetector);
        });

        FunkyTests.it('resume resets last activity time', function() {
            IdleDetector.init();
            IdleDetector.pause();

            return new Promise(function(resolve) {
                setTimeout(function() {
                    var before = Date.now();
                    IdleDetector.resume();
                    var after = Date.now();

                    var lastActivity = IdleDetector.getLastActivity();
                    expect(lastActivity).toBeGreaterThanOrEqual(before);
                    expect(lastActivity).toBeLessThanOrEqual(after);
                    resolve();
                }, 50);
            });
        });

    });

    // =========================================================================
    // EVENT TESTS
    // =========================================================================

    FunkyTests.describe('Events', function() {

        FunkyTests.it('emits idle event', function() {
            var eventFired = false;
            var eventData = null;

            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.on('idle', function(data) {
                eventFired = true;
                eventData = data;
            });

            return FunkyTests.waitFor(function() {
                return eventFired;
            }, { timeout: 500, interval: 10 }).then(function() {
                expect(eventFired).toBe(true);
                expect(eventData.idleTime).toBeDefined();
                expect(eventData.lastActivity).toBeDefined();
                expect(eventData.timestamp).toBeDefined();
            });
        });

        FunkyTests.it('emits active event', function() {
            var activeFired = false;
            var eventData = null;

            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.on('active', function(data) {
                activeFired = true;
                eventData = data;
            });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                IdleDetector.triggerActivity();
                expect(activeFired).toBe(true);
                expect(eventData.idleDuration).toBeDefined();
                expect(eventData.timestamp).toBeDefined();
            });
        });

        FunkyTests.it('removes handler with off()', function() {
            var callCount = 0;
            var handler = function() { callCount++; };

            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.on('idle', handler);

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                expect(callCount).toBe(1);

                IdleDetector.off('idle', handler);
                IdleDetector.triggerActivity();

                return FunkyTests.waitFor(function() {
                    return IdleDetector.isIdle();
                }, { timeout: 500, interval: 10 });
            }).then(function() {
                expect(callCount).toBe(1);
            });
        });

        FunkyTests.it('off removes all handlers when no handler specified', function() {
            var count1 = 0;
            var count2 = 0;

            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.on('idle', function() { count1++; });
            IdleDetector.on('idle', function() { count2++; });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                expect(count1).toBe(1);
                expect(count2).toBe(1);

                IdleDetector.off('idle');
                IdleDetector.triggerActivity();

                return FunkyTests.waitFor(function() {
                    return IdleDetector.isIdle();
                }, { timeout: 500, interval: 10 });
            }).then(function() {
                expect(count1).toBe(1);
                expect(count2).toBe(1);
            });
        });

        FunkyTests.it('on returns this for chaining', function() {
            IdleDetector.init();
            var result = IdleDetector.on('idle', function() {});
            expect(result).toBe(IdleDetector);
        });

        FunkyTests.it('off returns this for chaining', function() {
            IdleDetector.init();
            var handler = function() {};
            IdleDetector.on('idle', handler);
            var result = IdleDetector.off('idle', handler);
            expect(result).toBe(IdleDetector);
        });

    });

    // =========================================================================
    // VISIBILITY TRACKING TESTS
    // =========================================================================

    FunkyTests.describe('Visibility tracking', function() {

        FunkyTests.it('isTabHidden returns document.hidden', function() {
            IdleDetector.init();
            expect(IdleDetector.isTabHidden()).toBe(document.hidden);
        });

        FunkyTests.it('isWindowFocused returns boolean', function() {
            IdleDetector.init();
            expect(typeof IdleDetector.isWindowFocused()).toBe('boolean');
        });

        FunkyTests.it('getAwayDuration returns null when not away', function() {
            IdleDetector.init();
            expect(IdleDetector.getAwayDuration()).toBeNull();
        });

        FunkyTests.it('trackVisibility: false disables visibility tracking', function() {
            IdleDetector.init({ trackVisibility: false });
            var config = IdleDetector.getConfig();
            expect(config.trackVisibility).toBe(false);
        });

    });

    // =========================================================================
    // STATE INFO TESTS
    // =========================================================================

    FunkyTests.describe('getStateInfo()', function() {

        FunkyTests.it('returns state object', function() {
            IdleDetector.init();
            var info = IdleDetector.getStateInfo();

            expect(info.state).toBeDefined();
            expect(typeof info.isIdle).toBe('boolean');
            expect(typeof info.isAway).toBe('boolean');
            expect(typeof info.isActive).toBe('boolean');
            expect(typeof info.isPaused).toBe('boolean');
            expect(typeof info.tabHidden).toBe('boolean');
            expect(typeof info.windowFocused).toBe('boolean');
            expect(typeof info.lastActivity).toBe('number');
            expect(typeof info.idleTime).toBe('number');
        });

        FunkyTests.it('reflects active state', function() {
            IdleDetector.init();
            var info = IdleDetector.getStateInfo();

            expect(info.state).toBe('active');
            expect(info.isActive).toBe(true);
            expect(info.isIdle).toBe(false);
            expect(info.isAway).toBe(false);
        });

        FunkyTests.it('reflects idle state', function() {
            IdleDetector.init({ idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                var info = IdleDetector.getStateInfo();
                expect(info.state).toBe('idle');
                expect(info.isIdle).toBe(true);
                expect(info.isActive).toBe(false);
            });
        });

        FunkyTests.it('reflects paused state', function() {
            IdleDetector.init();
            IdleDetector.pause();
            var info = IdleDetector.getStateInfo();

            expect(info.isPaused).toBe(true);
        });

        FunkyTests.it('returns idleDuration when idle', function() {
            IdleDetector.init({ idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        var info = IdleDetector.getStateInfo();
                        expect(info.idleDuration).toBeGreaterThan(0);
                        resolve();
                    }, 50);
                });
            });
        });

        FunkyTests.it('returns null idleDuration when active', function() {
            IdleDetector.init();
            var info = IdleDetector.getStateInfo();
            expect(info.idleDuration).toBeNull();
        });

    });

    // =========================================================================
    // CONFIGURATION TESTS
    // =========================================================================

    FunkyTests.describe('Configuration', function() {

        FunkyTests.it('configure updates options', function() {
            IdleDetector.init({ idleTimeout: 60000 });
            IdleDetector.configure({ idleTimeout: 30000 });

            var config = IdleDetector.getConfig();
            expect(config.idleTimeout).toBe(30000);
        });

        FunkyTests.it('configure returns this for chaining', function() {
            IdleDetector.init();
            var result = IdleDetector.configure({ debug: true });
            expect(result).toBe(IdleDetector);
        });

        FunkyTests.it('getConfig returns copy of config', function() {
            IdleDetector.init({ idleTimeout: 60000 });

            var config1 = IdleDetector.getConfig();
            config1.idleTimeout = 10000;

            var config2 = IdleDetector.getConfig();
            expect(config2.idleTimeout).toBe(60000);
        });

        FunkyTests.it('has default idleTimeout of 5 minutes', function() {
            IdleDetector.init();
            var config = IdleDetector.getConfig();
            expect(config.idleTimeout).toBe(300000);
        });

        FunkyTests.it('has default awayTimeout of 1 minute', function() {
            IdleDetector.init();
            var config = IdleDetector.getConfig();
            expect(config.awayTimeout).toBe(60000);
        });

        FunkyTests.it('has default throttle of 1 second', function() {
            IdleDetector.init();
            var config = IdleDetector.getConfig();
            expect(config.throttle).toBe(1000);
        });

        FunkyTests.it('has default checkInterval of 30 seconds', function() {
            IdleDetector.init();
            var config = IdleDetector.getConfig();
            expect(config.checkInterval).toBe(30000);
        });

        FunkyTests.it('has trackVisibility enabled by default', function() {
            IdleDetector.init();
            var config = IdleDetector.getConfig();
            expect(config.trackVisibility).toBe(true);
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroy clears initialized state', function() {
            IdleDetector.init();
            IdleDetector.destroy();

            expect(IdleDetector.isInitialized()).toBe(false);
        });

        FunkyTests.it('destroy resets to active state', function() {
            IdleDetector.init({ idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                IdleDetector.destroy();
                IdleDetector.init();

                expect(IdleDetector.isActive()).toBe(true);
            });
        });

        FunkyTests.it('destroy removes event handlers', function() {
            var callCount = 0;

            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.on('idle', function() { callCount++; });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                expect(callCount).toBe(1);

                IdleDetector.destroy();
                IdleDetector.init({ idleTimeout: 50 });

                return FunkyTests.waitFor(function() {
                    return IdleDetector.isIdle();
                }, { timeout: 500, interval: 10 });
            }).then(function() {
                expect(callCount).toBe(1);
            });
        });

        FunkyTests.it('can be reinitialized after destroy', function() {
            IdleDetector.init();
            IdleDetector.destroy();
            IdleDetector.init();

            expect(IdleDetector.isInitialized()).toBe(true);
        });

        FunkyTests.it('destroy handles not being initialized', function() {
            expect(function() {
                IdleDetector.destroy();
            }).not.toThrow();
        });

    });

    // =========================================================================
    // TRIGGER ACTIVITY TESTS
    // =========================================================================

    FunkyTests.describe('triggerActivity()', function() {

        FunkyTests.it('resets idle state to active', function() {
            IdleDetector.init({ idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                IdleDetector.triggerActivity();
                expect(IdleDetector.isActive()).toBe(true);
            });
        });

        FunkyTests.it('returns this for chaining', function() {
            IdleDetector.init();
            var result = IdleDetector.triggerActivity();
            expect(result).toBe(IdleDetector);
        });

        FunkyTests.it('bypasses throttle', function() {
            IdleDetector.init({ throttle: 5000, idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                var before = IdleDetector.getLastActivity();
                IdleDetector.triggerActivity();
                var after = IdleDetector.getLastActivity();

                expect(after).toBeGreaterThan(before);
            });
        });

    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    FunkyTests.describe('Edge cases', function() {

        FunkyTests.it('handles multiple event handlers', function() {
            var count = 0;

            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.on('idle', function() { count++; });
            IdleDetector.on('idle', function() { count++; });
            IdleDetector.on('idle', function() { count++; });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                expect(count).toBe(3);
            });
        });

        FunkyTests.it('continues after handler error', function() {
            var secondCalled = false;

            IdleDetector.init({ idleTimeout: 50 });
            IdleDetector.on('idle', function() {
                throw new Error('Handler error');
            });
            IdleDetector.on('idle', function() {
                secondCalled = true;
            });

            // Suppress console.error during test
            var originalError = console.error;
            console.error = function() {};

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                console.error = originalError;
                expect(secondCalled).toBe(true);
            });
        });

        FunkyTests.it('handles rapid state changes', function() {
            IdleDetector.init({ idleTimeout: 50 });

            return FunkyTests.waitFor(function() {
                return IdleDetector.isIdle();
            }, { timeout: 500, interval: 10 }).then(function() {
                // Rapid toggle
                IdleDetector.triggerActivity();
                expect(IdleDetector.isActive()).toBe(true);

                return FunkyTests.waitFor(function() {
                    return IdleDetector.isIdle();
                }, { timeout: 500, interval: 10 });
            }).then(function() {
                IdleDetector.triggerActivity();
                expect(IdleDetector.isActive()).toBe(true);
            });
        });

    });

});
