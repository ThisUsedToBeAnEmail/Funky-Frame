/**
 * FunkyTests - Browser-Based Test Framework
 *
 * Minimal, dependency-free testing for Funky components.
 * Run with: FunkyTests.runAll() or ?test=1 in URL
 *
 * @version 1.0.3
 */
(function(window) {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════

    var config = {
        timeout: 5000,          // Default async timeout
        stopOnFail: false,      // Stop suite on first failure
        verbose: false,         // Show all assertions
        filter: null,           // Regex to filter tests
        reporter: 'console',    // Output target
        collectAllAssertions: true  // Collect all assertions, don't stop on first failure
    };

    // ═══════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════

    var suites = [];            // All registered suites
    var currentSuite = null;    // Suite being defined
    var spies = [];             // Active spies for cleanup
    var stopped = false;        // Flag to stop test run early
    var runComplete = false;    // Flag for CLI: true when test run finished
    var allTests = [];          // Array of per-test results for CLI
    var currentSuitePath = '';  // Full path of current suite for reporting
    var results = {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        failures: [],
        startTime: 0,
        endTime: 0
    };

    // ═══════════════════════════════════════════════════════════
    // REDIRECT BLOCKER - Prevent tests from navigating away
    // ═══════════════════════════════════════════════════════════

    var RedirectBlocker = {
        enabled: false,
        blockedCount: 0,
        originalLocation: null,
        originalReload: null,
        originalAssign: null,
        originalReplace: null,

        enable: function() {
            if (this.enabled) return;
            this.enabled = true;
            this.blockedCount = 0;

            var self = this;

            // Store original methods
            this.originalReload = window.location.reload;
            this.originalAssign = window.location.assign;
            this.originalReplace = window.location.replace;

            // Block location.reload() - wrap in try/catch for sandboxed iframes
            try {
                window.location.reload = function() {
                    self.blockedCount++;
                    console.warn('[FunkyTests] Blocked redirect: location.reload()');
                };
            } catch (e) {
                // location.reload may not be configurable in sandboxed iframes
            }

            // Block location.assign() - wrap in try/catch for sandboxed iframes
            try {
                window.location.assign = function(url) {
                    self.blockedCount++;
                    console.warn('[FunkyTests] Blocked redirect: location.assign(' + url + ')');
                };
            } catch (e) {
                // location.assign may not be configurable in sandboxed iframes
            }

            // Block location.replace() - wrap in try/catch for sandboxed iframes
            try {
                window.location.replace = function(url) {
                    self.blockedCount++;
                    console.warn('[FunkyTests] Blocked redirect: location.replace(' + url + ')');
                };
            } catch (e) {
                // location.replace may not be configurable in sandboxed iframes
            }

            // Block href assignment by intercepting the property
            // Note: This may not work in all browsers, but provides defense in depth
            try {
                var currentHref = window.location.href;
                Object.defineProperty(window.location, 'href', {
                    get: function() { return currentHref; },
                    set: function(val) {
                        self.blockedCount++;
                        console.warn('[FunkyTests] Blocked redirect: location.href = ' + val);
                    },
                    configurable: true
                });
            } catch (e) {
                // location.href may not be configurable in some browsers
            }
        },

        disable: function() {
            if (!this.enabled) return;
            this.enabled = false;

            // Restore original methods
            if (this.originalReload) {
                window.location.reload = this.originalReload;
            }
            if (this.originalAssign) {
                window.location.assign = this.originalAssign;
            }
            if (this.originalReplace) {
                window.location.replace = this.originalReplace;
            }

            // Can't easily restore href property, but that's OK
        },

        getBlockedCount: function() {
            return this.blockedCount;
        }
    };

    // Enable redirect blocker immediately when test framework loads
    RedirectBlocker.enable();

    // ═══════════════════════════════════════════════════════════
    // ASSERTION COLLECTOR
    // ═══════════════════════════════════════════════════════════

    var AssertionCollector = {
        active: false,
        assertions: [],
        firstFailure: null,  // Track first failure for throwing after test

        start: function() {
            this.active = true;
            this.assertions = [];
            this.firstFailure = null;
        },

        add: function(result) {
            if (this.active) {
                this.assertions.push(result);
                if (!result.passed && !this.firstFailure) {
                    this.firstFailure = result;
                }
            }
        },

        stop: function() {
            this.active = false;
            var collected = {
                assertions: this.assertions.slice(),
                firstFailure: this.firstFailure
            };
            this.assertions = [];
            this.firstFailure = null;
            return collected;
        },

        getResults: function() {
            return this.assertions.slice();
        }
    };

    // ═══════════════════════════════════════════════════════════
    // SUITE & TEST DEFINITION
    // ═══════════════════════════════════════════════════════════

    function describe(name, fn) {
        var suite = {
            name: name,
            tests: [],
            beforeEach: [],
            afterEach: [],
            beforeAll: [],
            afterAll: [],
            context: {},
            parent: null,  // Reference to parent suite for hook inheritance
            skip: false    // Flag to skip all tests in this suite
        };

        var parentSuite = currentSuite;
        currentSuite = suite;

        // Store parent reference for hook inheritance
        if (parentSuite) {
            suite.parent = parentSuite;
        }

        try {
            fn.call(suite.context);
        } finally {
            currentSuite = parentSuite;
        }

        if (parentSuite) {
            parentSuite.tests.push({ type: 'suite', suite: suite });
        } else {
            suites.push(suite);
        }

        return suite;
    }

    /**
     * Skip an entire suite (xdescribe or describe.skip)
     */
    function xdescribe(name, fn) {
        var suite = {
            name: name,
            tests: [],
            beforeEach: [],
            afterEach: [],
            beforeAll: [],
            afterAll: [],
            context: {},
            parent: null,
            skip: true  // Mark entire suite as skipped
        };

        var parentSuite = currentSuite;
        currentSuite = suite;

        if (parentSuite) {
            suite.parent = parentSuite;
        }

        try {
            fn.call(suite.context);
        } finally {
            currentSuite = parentSuite;
        }

        if (parentSuite) {
            parentSuite.tests.push({ type: 'suite', suite: suite });
        } else {
            suites.push(suite);
        }

        return suite;
    }

    // Add skip as a property of describe for describe.skip() syntax
    describe.skip = xdescribe;

    function it(name, fn) {
        if (!currentSuite) {
            throw new Error('it() must be called inside describe()');
        }

        currentSuite.tests.push({
            type: 'test',
            name: name,
            fn: fn,
            skip: false
        });
    }

    function xit(name, fn) {
        if (!currentSuite) {
            throw new Error('xit() must be called inside describe()');
        }

        currentSuite.tests.push({
            type: 'test',
            name: name,
            fn: fn,
            skip: true
        });
    }

    function beforeEach(fn) {
        if (!currentSuite) throw new Error('beforeEach() must be inside describe()');
        currentSuite.beforeEach.push(fn);
    }

    function afterEach(fn) {
        if (!currentSuite) throw new Error('afterEach() must be inside describe()');
        currentSuite.afterEach.push(fn);
    }

    function beforeAll(fn) {
        if (!currentSuite) throw new Error('beforeAll() must be inside describe()');
        currentSuite.beforeAll.push(fn);
    }

    function afterAll(fn) {
        if (!currentSuite) throw new Error('afterAll() must be inside describe()');
        currentSuite.afterAll.push(fn);
    }

    // ═══════════════════════════════════════════════════════════
    // ASSERTIONS
    // ═══════════════════════════════════════════════════════════

    function expect(actual) {
        return new Expectation(actual, false);
    }

    function Expectation(actual, negated) {
        this.actual = actual;
        this.negated = negated;
        this._currentMatcher = null;  // Track which matcher is being used
    }

    Object.defineProperty(Expectation.prototype, 'not', {
        get: function() {
            var negated = new Expectation(this.actual, !this.negated);
            negated._currentMatcher = this._currentMatcher;
            return negated;
        }
    });

    Expectation.prototype._assert = function(pass, message, expected) {
        var result = this.negated ? !pass : pass;
        var self = this;

        // Collect assertion result if collector is active
        if (AssertionCollector.active) {
            AssertionCollector.add({
                type: this._currentMatcher || 'unknown',
                passed: result,
                actual: this.actual,
                expected: expected,
                message: message,
                negated: this.negated
            });

            // In collectAllAssertions mode, don't throw - just record
            if (config.collectAllAssertions && !result) {
                return; // Don't throw, let test continue
            }
        }

        if (!result) {
            var error = new Error(message);
            error.expected = expected;
            error.actual = this.actual;
            error.negated = this.negated;
            throw error;
        }
    };

    Expectation.prototype.toBe = function(expected) {
        this._currentMatcher = 'toBe';
        var pass = this.actual === expected;
        var msg = this.negated
            ? 'Expected ' + format(this.actual) + ' not to be ' + format(expected)
            : 'Expected ' + format(this.actual) + ' to be ' + format(expected);
        this._assert(pass, msg, expected);
    };

    Expectation.prototype.toEqual = function(expected) {
        this._currentMatcher = 'toEqual';
        var pass = deepEqual(this.actual, expected);
        var msg = this.negated
            ? 'Expected values not to be deeply equal'
            : 'Expected values to be deeply equal\n  Expected: ' + format(expected) + '\n  Actual: ' + format(this.actual);
        this._assert(pass, msg, expected);
    };

    Expectation.prototype.toBeTruthy = function() {
        this._currentMatcher = 'toBeTruthy';
        this._assert(!!this.actual, 'Expected ' + format(this.actual) + ' to be truthy', true);
    };

    Expectation.prototype.toBeFalsy = function() {
        this._currentMatcher = 'toBeFalsy';
        this._assert(!this.actual, 'Expected ' + format(this.actual) + ' to be falsy', false);
    };

    Expectation.prototype.toBeDefined = function() {
        this._currentMatcher = 'toBeDefined';
        this._assert(this.actual !== undefined, 'Expected value to be defined', 'defined');
    };

    Expectation.prototype.toBeUndefined = function() {
        this._currentMatcher = 'toBeUndefined';
        this._assert(this.actual === undefined, 'Expected value to be undefined', undefined);
    };

    Expectation.prototype.toBeNull = function() {
        this._currentMatcher = 'toBeNull';
        var pass = this.actual === null;
        var msg = this.negated
            ? 'Expected value not to be null'
            : 'Expected value to be null, got ' + format(this.actual);
        this._assert(pass, msg, null);
    };

    Expectation.prototype.toBeGreaterThan = function(expected) {
        this._currentMatcher = 'toBeGreaterThan';
        this._assert(this.actual > expected,
            'Expected ' + this.actual + ' to be greater than ' + expected, expected);
    };

    Expectation.prototype.toBeLessThan = function(expected) {
        this._currentMatcher = 'toBeLessThan';
        this._assert(this.actual < expected,
            'Expected ' + this.actual + ' to be less than ' + expected, expected);
    };

    Expectation.prototype.toBeGreaterThanOrEqual = function(expected) {
        this._currentMatcher = 'toBeGreaterThanOrEqual';
        this._assert(this.actual >= expected,
            'Expected ' + this.actual + ' to be >= ' + expected, expected);
    };

    Expectation.prototype.toBeLessThanOrEqual = function(expected) {
        this._currentMatcher = 'toBeLessThanOrEqual';
        this._assert(this.actual <= expected,
            'Expected ' + this.actual + ' to be <= ' + expected, expected);
    };

    Expectation.prototype.toBeCloseTo = function(expected, precision) {
        this._currentMatcher = 'toBeCloseTo';
        precision = precision !== undefined ? precision : 2;
        var multiplier = Math.pow(10, precision);
        var actualRounded = Math.round(this.actual * multiplier);
        var expectedRounded = Math.round(expected * multiplier);
        this._assert(actualRounded === expectedRounded,
            'Expected ' + this.actual + ' to be close to ' + expected + ' (precision: ' + precision + ')', expected);
    };

    Expectation.prototype.toContain = function(expected) {
        this._currentMatcher = 'toContain';
        var pass = false;
        if (typeof this.actual === 'string') {
            pass = this.actual.indexOf(expected) !== -1;
        } else if (Array.isArray(this.actual)) {
            pass = this.actual.indexOf(expected) !== -1;
        }
        this._assert(pass, 'Expected ' + format(this.actual) + ' to contain ' + format(expected), expected);
    };

    Expectation.prototype.toHaveLength = function(expected) {
        this._currentMatcher = 'toHaveLength';
        var actual = this.actual && this.actual.length;
        this._assert(actual === expected,
            'Expected length ' + actual + ' to be ' + expected, expected);
    };

    Expectation.prototype.toBeEmpty = function() {
        this._currentMatcher = 'toBeEmpty';
        var empty = this.actual != null && this.actual.length === 0;
        this._assert(empty, 'Expected ' + format(this.actual) + ' to be empty', 0);
    };

    Expectation.prototype.toMatch = function(regex) {
        this._currentMatcher = 'toMatch';
        this._assert(regex.test(this.actual),
            'Expected ' + format(this.actual) + ' to match ' + regex, regex);
    };

    Expectation.prototype.toStartWith = function(expected) {
        this._currentMatcher = 'toStartWith';
        var pass = typeof this.actual === 'string' && this.actual.indexOf(expected) === 0;
        this._assert(pass, 'Expected ' + format(this.actual) + ' to start with ' + format(expected), expected);
    };

    Expectation.prototype.toEndWith = function(expected) {
        this._currentMatcher = 'toEndWith';
        var pass = typeof this.actual === 'string' &&
                   this.actual.indexOf(expected) === this.actual.length - expected.length;
        this._assert(pass, 'Expected ' + format(this.actual) + ' to end with ' + format(expected), expected);
    };

    Expectation.prototype.toHaveProperty = function(key, value) {
        this._currentMatcher = 'toHaveProperty';
        var has = this.actual && Object.prototype.hasOwnProperty.call(this.actual, key);
        if (value !== undefined) {
            has = has && this.actual[key] === value;
        }
        var msg = value !== undefined
            ? 'Expected object to have property "' + key + '" with value ' + format(value)
            : 'Expected object to have property "' + key + '"';
        this._assert(has, msg, value !== undefined ? value : key);
    };

    Expectation.prototype.toThrow = function(expected) {
        this._currentMatcher = 'toThrow';
        var threw = false;
        var error = null;

        try {
            this.actual();
        } catch (e) {
            threw = true;
            error = e;
        }

        var pass = threw;
        if (pass && expected) {
            if (typeof expected === 'string') {
                pass = error.message.indexOf(expected) !== -1;
            } else if (expected instanceof RegExp) {
                pass = expected.test(error.message);
            } else if (typeof expected === 'function') {
                pass = error instanceof expected;
            }
        }

        this._assert(pass, 'Expected function to throw' + (expected ? ' ' + expected : ''), expected);
    };

    Expectation.prototype.toThrowError = function(errorType) {
        this._currentMatcher = 'toThrowError';
        var threw = false;
        var error = null;

        try {
            this.actual();
        } catch (e) {
            threw = true;
            error = e;
        }

        var pass = threw && error instanceof errorType;
        this._assert(pass, 'Expected function to throw ' + (errorType.name || errorType), errorType);
    };

    // DOM assertions
    Expectation.prototype.toBeInDocument = function() {
        this._currentMatcher = 'toBeInDocument';
        this._assert(this.actual && document.contains(this.actual), 'Expected element to be in document', 'in document');
    };

    Expectation.prototype.toHaveClass = function(className) {
        this._currentMatcher = 'toHaveClass';
        this._assert(this.actual && this.actual.classList && this.actual.classList.contains(className),
            'Expected element to have class "' + className + '"', className);
    };

    Expectation.prototype.toHaveAttribute = function(name, value) {
        this._currentMatcher = 'toHaveAttribute';
        var has = this.actual && this.actual.hasAttribute && this.actual.hasAttribute(name);
        if (value !== undefined) {
            has = has && this.actual.getAttribute(name) === value;
        }
        this._assert(has, 'Expected element to have attribute "' + name + '"' +
            (value !== undefined ? ' with value "' + value + '"' : ''), value !== undefined ? value : name);
    };

    Expectation.prototype.toHaveText = function(expected) {
        this._currentMatcher = 'toHaveText';
        var actual = this.actual && this.actual.textContent;
        this._assert(actual === expected || (actual && actual.indexOf(expected) !== -1),
            'Expected element to have text "' + expected + '", got "' + actual + '"', expected);
    };

    Expectation.prototype.toBeVisible = function() {
        this._currentMatcher = 'toBeVisible';
        var el = this.actual;
        var visible = el && el.offsetParent !== null &&
            getComputedStyle(el).visibility !== 'hidden' &&
            getComputedStyle(el).display !== 'none';
        this._assert(visible, 'Expected element to be visible', 'visible');
    };

    Expectation.prototype.toBeHidden = function() {
        this._currentMatcher = 'toBeHidden';
        var el = this.actual;
        var hidden = !el || el.offsetParent === null ||
            getComputedStyle(el).visibility === 'hidden' ||
            getComputedStyle(el).display === 'none';
        this._assert(hidden, 'Expected element to be hidden', 'hidden');
    };

    Expectation.prototype.toBeFocused = function() {
        this._currentMatcher = 'toBeFocused';
        this._assert(document.activeElement === this.actual, 'Expected element to be focused', 'focused');
    };

    // Type assertion
    Expectation.prototype.toBeInstanceOf = function(expected) {
        this._currentMatcher = 'toBeInstanceOf';
        var pass = this.actual instanceof expected;
        var actualType = this.actual && this.actual.constructor ? this.actual.constructor.name : typeof this.actual;
        var expectedName = expected.name || expected;
        this._assert(pass,
            'Expected ' + format(this.actual) + ' to be instance of ' + expectedName + ', got ' + actualType, expectedName);
    };

    // Spy assertions
    Expectation.prototype.toHaveBeenCalled = function() {
        this._currentMatcher = 'toHaveBeenCalled';
        this._assert(this.actual && this.actual._calls && this.actual._calls.length > 0,
            'Expected spy to have been called', 'called');
    };

    Expectation.prototype.toHaveBeenCalledTimes = function(expected) {
        this._currentMatcher = 'toHaveBeenCalledTimes';
        var times = this.actual && this.actual._calls ? this.actual._calls.length : 0;
        this._assert(times === expected,
            'Expected spy to have been called ' + expected + ' times, but was called ' + times + ' times', expected);
    };

    Expectation.prototype.toHaveBeenCalledWith = function() {
        this._currentMatcher = 'toHaveBeenCalledWith';
        var expectedArgs = Array.prototype.slice.call(arguments);
        var calls = this.actual && this.actual._calls || [];
        var found = calls.some(function(call) {
            return deepEqual(call, expectedArgs);
        });
        this._assert(found, 'Expected spy to have been called with ' + format(expectedArgs), expectedArgs);
    };

    // ═══════════════════════════════════════════════════════════
    // SPIES
    // ═══════════════════════════════════════════════════════════

    function spy(implementation) {
        var fn = function() {
            var args = Array.prototype.slice.call(arguments);
            fn._calls.push(args);
            fn._lastCall = args;
            if (fn._implementation) {
                return fn._implementation.apply(this, args);
            }
            return fn._returnValue;
        };

        fn._calls = [];
        fn._lastCall = null;
        fn._implementation = implementation || null;
        fn._returnValue = undefined;
        fn._isSpy = true;

        fn.and = {
            returnValue: function(val) {
                fn._returnValue = val;
                fn._implementation = null;
                return fn;
            },
            callFake: function(fake) {
                fn._implementation = fake;
                return fn;
            },
            callThrough: function() {
                // Only works with spyOn
                if (fn._original) {
                    fn._implementation = fn._original;
                }
                return fn;
            }
        };

        fn.calls = {
            count: function() { return fn._calls.length; },
            argsFor: function(i) { return fn._calls[i]; },
            first: function() { return fn._calls[0]; },
            mostRecent: function() { return fn._lastCall; },
            all: function() { return fn._calls.slice(); },
            reset: function() { fn._calls = []; fn._lastCall = null; }
        };

        return fn;
    }

    function spyOn(obj, method) {
        var original = obj[method];
        var spyFn = spy();

        spyFn._original = original;
        spyFn._object = obj;
        spyFn._method = method;

        obj[method] = spyFn;
        spies.push(spyFn);

        return spyFn;
    }

    function restoreAllSpies() {
        spies.forEach(function(spyFn) {
            if (spyFn._object && spyFn._method) {
                spyFn._object[spyFn._method] = spyFn._original;
            }
        });
        spies = [];
    }

    // ═══════════════════════════════════════════════════════════
    // FAKE TIMERS
    // ═══════════════════════════════════════════════════════════

    var fakeTimers = {
        enabled: false,
        time: 0,
        timers: [],
        originalSetTimeout: window.setTimeout,
        originalClearTimeout: window.clearTimeout,
        originalSetInterval: window.setInterval,
        originalClearInterval: window.clearInterval,
        nextId: 1
    };

    function useFakeTimers() {
        if (fakeTimers.enabled) return;

        fakeTimers.enabled = true;
        fakeTimers.time = 0;
        fakeTimers.timers = [];

        window.setTimeout = function(fn, delay) {
            var id = fakeTimers.nextId++;
            fakeTimers.timers.push({
                id: id,
                fn: fn,
                time: fakeTimers.time + (delay || 0),
                type: 'timeout'
            });
            return id;
        };

        window.clearTimeout = function(id) {
            fakeTimers.timers = fakeTimers.timers.filter(function(t) {
                return t.id !== id;
            });
        };

        window.setInterval = function(fn, delay) {
            var id = fakeTimers.nextId++;
            fakeTimers.timers.push({
                id: id,
                fn: fn,
                time: fakeTimers.time + (delay || 0),
                interval: delay,
                type: 'interval'
            });
            return id;
        };

        window.clearInterval = function(id) {
            fakeTimers.timers = fakeTimers.timers.filter(function(t) {
                return t.id !== id;
            });
        };
    }

    function useRealTimers() {
        if (!fakeTimers.enabled) return;

        fakeTimers.enabled = false;
        window.setTimeout = fakeTimers.originalSetTimeout;
        window.clearTimeout = fakeTimers.originalClearTimeout;
        window.setInterval = fakeTimers.originalSetInterval;
        window.clearInterval = fakeTimers.originalClearInterval;
        fakeTimers.timers = [];
    }

    function advanceTimersByTime(ms) {
        if (!fakeTimers.enabled) {
            throw new Error('Fake timers not enabled. Call useFakeTimers() first.');
        }

        var targetTime = fakeTimers.time + ms;

        while (fakeTimers.timers.length > 0) {
            // Sort by time
            fakeTimers.timers.sort(function(a, b) { return a.time - b.time; });

            var next = fakeTimers.timers[0];
            if (next.time > targetTime) break;

            fakeTimers.time = next.time;

            if (next.type === 'timeout') {
                fakeTimers.timers.shift();
                next.fn();
            } else if (next.type === 'interval') {
                next.fn();
                next.time += next.interval;
            }
        }

        fakeTimers.time = targetTime;
    }

    function runAllTimers() {
        if (!fakeTimers.enabled) {
            throw new Error('Fake timers not enabled');
        }

        var maxIterations = 1000;
        var iterations = 0;

        while (fakeTimers.timers.length > 0 && iterations < maxIterations) {
            advanceTimersByTime(1);
            iterations++;
        }

        if (iterations >= maxIterations) {
            throw new Error('runAllTimers: too many iterations (possible infinite loop)');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // TEST RUNNER
    // ═══════════════════════════════════════════════════════════

    function runAll(options) {
        options = options || {};

        // Always reset filter - if not provided, clear it
        config.filter = options.filter || null;

        // Reset stop flag
        stopped = false;

        // Reset CLI flags
        runComplete = false;
        allTests = [];
        currentSuitePath = '';

        Object.keys(options).forEach(function(key) {
            config[key] = options[key];
        });

        results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            failures: [],
            startTime: Date.now(),
            endTime: 0,
            stopped: false
        };

        reporter.start();

        return runSuites(suites).then(function() {
            results.endTime = Date.now();
            results.stopped = stopped;
            runComplete = true;  // Mark run as complete for CLI polling
            reporter.end(results);
            return results;
        });
    }

    /**
     * Stop the current test run
     * Results up to this point will be reported
     */
    function stop() {
        if (!stopped) {
            stopped = true;
            console.log('%c[FunkyTests] Test run stopped by user', 'color: #fdcb6e; font-weight: bold');
        }
    }

    function run(name) {
        var filtered = suites.filter(function(s) {
            return s.name === name || s.name.indexOf(name) !== -1;
        });

        if (filtered.length === 0) {
            console.warn('No suite found matching: ' + name);
            return Promise.resolve();
        }

        results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            failures: [],
            startTime: Date.now(),
            endTime: 0
        };

        reporter.start();

        return runSuites(filtered).then(function() {
            results.endTime = Date.now();
            results.stopped = stopped;
            reporter.end(results);
            return results;
        });
    }

    function runSuites(suitesToRun) {
        return suitesToRun.reduce(function(promise, suite) {
            return promise.then(function() {
                // Check if stopped before running next suite
                if (stopped) {
                    return Promise.resolve();
                }
                return runSuite(suite);
            });
        }, Promise.resolve());
    }

    function runSuite(suite, indent, parentMatches, parentSkipped) {
        indent = indent || 0;
        parentMatches = parentMatches || false;
        parentSkipped = parentSkipped || false;

        // Check if stopped before starting suite
        if (stopped) {
            return Promise.resolve();
        }

        // Determine if this suite should be skipped (either explicitly or inherited)
        var suiteSkipped = parentSkipped || suite.skip;

        // Check if this suite name matches the filter
        var suiteMatches = parentMatches;
        if (config.filter && !parentMatches) {
            suiteMatches = config.filter.test(suite.name);
        }

        // Track suite path for CLI results
        var previousSuitePath = currentSuitePath;
        currentSuitePath = currentSuitePath
            ? currentSuitePath + ' > ' + suite.name
            : suite.name;

        reporter.suiteStart(suite, indent);

        // If suite is skipped, skip all tests without running hooks
        if (suiteSkipped) {
            return skipAllTestsInSuite(suite, indent, suiteMatches).then(function() {
                reporter.suiteEnd(suite, indent);
                currentSuitePath = previousSuitePath;
            });
        }

        // Run beforeAll
        return runHooks(suite.beforeAll, suite.context).then(function() {
            // Run tests
            return suite.tests.reduce(function(promise, item) {
                return promise.then(function() {
                    // Check if stopped before each test/suite
                    if (stopped) {
                        return Promise.resolve();
                    }
                    if (item.type === 'suite') {
                        return runSuite(item.suite, indent + 1, suiteMatches, suiteSkipped);
                    } else {
                        return runTest(item, suite, indent, suiteMatches);
                    }
                });
            }, Promise.resolve());
        }).then(function() {
            // Run afterAll
            return runHooks(suite.afterAll, suite.context);
        }).then(function() {
            reporter.suiteEnd(suite, indent);
            // Restore previous suite path
            currentSuitePath = previousSuitePath;
        });
    }

    /**
     * Skip all tests in a suite (used when suite.skip is true)
     * When filter is active, skip silently without reporting
     */
    function skipAllTestsInSuite(suite, indent, suiteMatches) {
        return suite.tests.reduce(function(promise, item) {
            return promise.then(function() {
                if (item.type === 'suite') {
                    return skipAllTestsInSuite(item.suite, indent + 1, suiteMatches);
                } else {
                    // When filter is active, skip silently unless suite/test matches
                    if (config.filter) {
                        var testMatches = suiteMatches || config.filter.test(item.name);
                        if (!testMatches) {
                            return; // Skip silently
                        }
                    }
                    // Mark test as skipped
                    results.total++;
                    results.skipped++;
                    allTests.push({
                        name: item.name,
                        suite: currentSuitePath,
                        status: 'skipped',
                        error: null,
                        stack: null,
                        duration: 0
                    });
                    reporter.testSkip(item, indent);
                }
            });
        }, Promise.resolve());
    }

    function runTest(test, suite, indent, suiteMatches) {
        // Check if stopped
        if (stopped) {
            return Promise.resolve();
        }

        // Skip silently if filter is set and neither suite nor test name matches
        // Don't count or report filtered-out tests
        if (config.filter && !suiteMatches && !config.filter.test(test.name)) {
            return Promise.resolve();
        }

        // When running with a filter, also skip xit tests silently
        // This prevents showing unrelated skipped tests during filtered runs
        if (config.filter && test.skip) {
            return Promise.resolve();
        }

        results.total++;

        // Handle explicitly skipped tests (xit) - only report when running without filter
        if (test.skip) {
            results.skipped++;
            allTests.push({
                name: test.name,
                suite: currentSuitePath,
                status: 'skipped',
                error: null,
                stack: null,
                duration: 0
            });
            reporter.testSkip(test, indent);
            return Promise.resolve();
        }

        var startTime = Date.now();
        var context = Object.create(suite.context);
        var collectedAssertions = null;
        var testSource = null;

        // Capture test source for display
        try {
            testSource = test.fn.toString();
        } catch (e) {
            testSource = null;
        }

        // Notify reporter that test is starting
        reporter.testStart(test, suite, indent);

        // Collect all beforeEach hooks from parent suites (outermost first)
        function collectBeforeEachHooks(s) {
            var hooks = [];
            if (s.parent) {
                hooks = collectBeforeEachHooks(s.parent);
            }
            return hooks.concat(s.beforeEach);
        }

        // Collect all afterEach hooks from parent suites (innermost first)
        function collectAfterEachHooks(s) {
            var hooks = s.afterEach.slice();
            if (s.parent) {
                hooks = hooks.concat(collectAfterEachHooks(s.parent));
            }
            return hooks;
        }

        var allBeforeEach = collectBeforeEachHooks(suite);
        var allAfterEach = collectAfterEachHooks(suite);

        // Run all beforeEach hooks (parent first)
        return runHooks(allBeforeEach, context).catch(function(err) {
            // Skip test if beforeEach was aborted
            if (err && err.message && err.message.indexOf('aborted by user') !== -1) {
                return Promise.reject(err);  // Pass abort to catch handler
            }
            throw err;
        }).then(function() {
            // Check if stopped before running test
            if (stopped) {
                return Promise.reject(new Error('Test aborted by user'));
            }
            // Start assertion collector before running test
            if (config.collectAllAssertions) {
                AssertionCollector.start();
            }
            // Run test
            return runTestFn(test.fn, context);
        }).then(function() {
            // Stop collector and get results
            if (config.collectAllAssertions) {
                collectedAssertions = AssertionCollector.stop();
            }

            var duration = Date.now() - startTime;

            // Check if any assertions failed (in collectAllAssertions mode)
            if (collectedAssertions && collectedAssertions.firstFailure) {
                // Test had failures - report as failed
                var firstFailure = collectedAssertions.firstFailure;
                var error = new Error(firstFailure.message);
                error.expected = firstFailure.expected;
                error.actual = firstFailure.actual;

                results.failed++;
                results.failures.push({ test: test, suite: suite, error: error });
                allTests.push({
                    name: test.name,
                    suite: currentSuitePath,
                    status: 'failed',
                    error: error.message || String(error),
                    stack: error.stack || null,
                    duration: duration
                });
                reporter.testFail(test, error, duration, indent);

                // Call testComplete with all assertion details
                reporter.testComplete(test, {
                    passed: false,
                    duration: duration,
                    assertions: collectedAssertions.assertions,
                    source: testSource,
                    error: error
                }, indent);

                if (config.stopOnFail) {
                    throw error;
                }
            } else {
                // All assertions passed
                results.passed++;
                allTests.push({
                    name: test.name,
                    suite: currentSuitePath,
                    status: 'passed',
                    error: null,
                    stack: null,
                    duration: duration
                });
                reporter.testPass(test, duration, indent);

                // Call testComplete with all assertion details
                reporter.testComplete(test, {
                    passed: true,
                    duration: duration,
                    assertions: collectedAssertions ? collectedAssertions.assertions : [],
                    source: testSource,
                    error: null
                }, indent);
            }
        }).catch(function(error) {
            // Stop collector if still active (e.g., timeout or other runtime error)
            if (config.collectAllAssertions && AssertionCollector.active) {
                collectedAssertions = AssertionCollector.stop();
            }

            var duration = Date.now() - startTime;
            results.failed++;
            results.failures.push({ test: test, suite: suite, error: error });
            allTests.push({
                name: test.name,
                suite: currentSuitePath,
                status: 'failed',
                error: error.message || String(error),
                stack: error.stack || null,
                duration: duration
            });
            reporter.testFail(test, error, duration, indent);

            // Call testComplete with assertion details
            reporter.testComplete(test, {
                passed: false,
                duration: duration,
                assertions: collectedAssertions ? collectedAssertions.assertions : [],
                source: testSource,
                error: { message: error.message, stack: error.stack }
            }, indent);

            if (config.stopOnFail) {
                throw error;
            }
        }).then(function() {
            // Run all afterEach hooks (child first) - skip if stopped
            if (stopped) {
                return Promise.resolve();
            }
            return runHooks(allAfterEach, context);
        }).catch(function(err) {
            // Ignore abort errors in afterEach hooks
            if (err && err.message && err.message.indexOf('aborted by user') !== -1) {
                return Promise.resolve();
            }
            throw err;
        }).then(function() {
            restoreAllSpies();
            if (fakeTimers.enabled) {
                useRealTimers();
            }
        });
    }

    function runTestFn(fn, context) {
        return new Promise(function(resolve, reject) {
            // Check if already stopped before starting
            if (stopped) {
                reject(new Error('Test aborted by user'));
                return;
            }

            var timeoutId = setTimeout(function() {
                clearInterval(abortCheckId);
                reject(new Error('Test timed out after ' + config.timeout + 'ms'));
            }, config.timeout);

            // Periodic abort check every 50ms for responsive stopping
            var abortCheckId = setInterval(function() {
                if (stopped) {
                    clearInterval(abortCheckId);
                    clearTimeout(timeoutId);
                    reject(new Error('Test aborted by user'));
                }
            }, 50);

            function cleanup() {
                clearInterval(abortCheckId);
                clearTimeout(timeoutId);
            }

            try {
                // Check if async (done callback or returns promise)
                if (fn.length > 0) {
                    // Has done callback
                    fn.call(context, function done(err) {
                        cleanup();
                        if (err) reject(err);
                        else resolve();
                    });
                } else {
                    var result = fn.call(context);
                    if (result && typeof result.then === 'function') {
                        // Returns promise
                        result.then(function() {
                            cleanup();
                            resolve();
                        }).catch(function(err) {
                            cleanup();
                            reject(err);
                        });
                    } else {
                        cleanup();
                        resolve();
                    }
                }
            } catch (err) {
                cleanup();
                reject(err);
            }
        });
    }

    function runHooks(hooks, context) {
        return hooks.reduce(function(promise, hook) {
            return promise.then(function() {
                // Skip hooks if stopped
                if (stopped) {
                    return Promise.resolve();
                }
                return runTestFn(hook, context).catch(function(err) {
                    // Silently ignore abort errors in hooks
                    if (err && err.message && err.message.indexOf('aborted by user') !== -1) {
                        return Promise.resolve();
                    }
                    throw err;
                });
            });
        }, Promise.resolve());
    }

    // ═══════════════════════════════════════════════════════════
    // REPORTER
    // ═══════════════════════════════════════════════════════════

    var customReporter = null;  // Allow external reporter

    var reporter = {
        start: function() {
            console.log('%c╔══════════════════════════════════════════════════════════════╗', 'color: #6c5ce7');
            console.log('%c║                    FunkyTests v1.0.0                         ║', 'color: #6c5ce7; font-weight: bold');
            console.log('%c╚══════════════════════════════════════════════════════════════╝', 'color: #6c5ce7');
            console.log('');
            if (customReporter && customReporter.start) customReporter.start();
        },

        suiteStart: function(suite, indent) {
            var padding = '  '.repeat(indent);
            console.log('%c' + padding + '▶ ' + suite.name, 'color: #0984e3; font-weight: bold');
            if (customReporter && customReporter.suiteStart) customReporter.suiteStart(suite, indent);
        },

        suiteEnd: function(suite, indent) {
            if (customReporter && customReporter.suiteEnd) customReporter.suiteEnd(suite, indent);
        },

        testStart: function(test, suite, indent) {
            if (customReporter && customReporter.testStart) customReporter.testStart(test, suite, indent);
        },

        testPass: function(test, duration, indent) {
            var padding = '  '.repeat(indent + 1);
            console.log('%c' + padding + '✓ ' + test.name + ' %c(' + duration + 'ms)', 'color: #00b894', 'color: #636e72');
            if (customReporter && customReporter.testPass) customReporter.testPass(test, duration, indent);
        },

        testFail: function(test, error, duration, indent) {
            var padding = '  '.repeat(indent + 1);
            console.log('%c' + padding + '✗ ' + test.name, 'color: #d63031; font-weight: bold');
            console.log('%c' + padding + '  ' + error.message, 'color: #d63031');
            if (error.stack) {
                var stack = error.stack.split('\n').slice(1, 4).join('\n');
                console.log('%c' + padding + '  ' + stack, 'color: #636e72; font-size: 0.9em');
            }
            if (customReporter && customReporter.testFail) customReporter.testFail(test, error, duration, indent);
        },

        testSkip: function(test, indent) {
            var padding = '  '.repeat(indent + 1);
            console.log('%c' + padding + '○ skipped: ' + test.name, 'color: #fdcb6e');
            if (customReporter && customReporter.testSkip) customReporter.testSkip(test, indent);
        },

        testComplete: function(test, result, indent) {
            // Log assertion summary in verbose mode
            if (config.verbose && result.assertions && result.assertions.length > 0) {
                var padding = '  '.repeat(indent + 2);
                var passed = result.assertions.filter(function(a) { return a.passed; }).length;
                var total = result.assertions.length;
                console.log('%c' + padding + 'Assertions: ' + passed + '/' + total, 'color: #636e72');
            }
            if (customReporter && customReporter.testComplete) {
                customReporter.testComplete(test, result, indent);
            }
        },

        end: function(results) {
            var duration = ((results.endTime - results.startTime) / 1000).toFixed(3);
            console.log('');
            console.log('────────────────────────────────────────────────────────────────');

            if (results.failed === 0) {
                console.log('%c✓ All tests passed!', 'color: #00b894; font-weight: bold');
            } else {
                console.log('%c✗ Some tests failed', 'color: #d63031; font-weight: bold');
            }

            console.log('');
            console.log('Tests:  %c' + results.passed + ' passed%c, %c' + results.failed + ' failed%c, %c' + results.skipped + ' skipped',
                'color: #00b894', 'color: inherit',
                'color: #d63031', 'color: inherit',
                'color: #fdcb6e');
            console.log('Time:   ' + duration + 's');
            console.log('────────────────────────────────────────────────────────────────');

            // Show failure details
            if (results.failures.length > 0) {
                console.log('');
                console.log('%cFailure Details:', 'font-weight: bold');
                results.failures.forEach(function(f, i) {
                    console.log('%c' + (i + 1) + ') ' + f.suite.name + ' > ' + f.test.name, 'color: #d63031');
                    console.log('   ' + f.error.message);
                });
            }
            if (customReporter && customReporter.end) customReporter.end(results);
        }
    };

    function setReporter(rep) {
        customReporter = rep;
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════

    function format(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return '"' + value + '"';
        if (typeof value === 'function') return '[Function' + (value.name ? ': ' + value.name : '') + ']';
        if (value instanceof Element) return '<' + value.tagName.toLowerCase() + '>';
        if (Array.isArray(value)) {
            if (value.length > 5) {
                return '[' + value.slice(0, 5).map(format).join(', ') + ', ...]';
            }
            return '[' + value.map(format).join(', ') + ']';
        }
        if (typeof value === 'object') {
            try {
                var str = JSON.stringify(value);
                if (str.length > 100) {
                    return str.substring(0, 100) + '...';
                }
                return str;
            } catch (e) {
                return '[Object]';
            }
        }
        return String(value);
    }

    function deepEqual(a, b) {
        if (a === b) return true;
        if (a === null || b === null) return false;
        if (typeof a !== typeof b) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (var i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }

        if (typeof a === 'object') {
            var keysA = Object.keys(a);
            var keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            for (var j = 0; j < keysA.length; j++) {
                var key = keysA[j];
                if (!deepEqual(a[key], b[key])) return false;
            }
            return true;
        }

        return false;
    }

    // ═══════════════════════════════════════════════════════════
    // TEST HELPERS
    // ═══════════════════════════════════════════════════════════

    var simulate = {
        click: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        },
        dblclick: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
        },
        mousedown: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        },
        mouseup: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        },
        mouseover: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        },
        mouseout: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        },
        contextmenu: function(el, opts) {
            if (typeof el === 'string') el = document.querySelector(el);
            opts = opts || {};
            el.dispatchEvent(new MouseEvent('contextmenu', Object.assign({ bubbles: true, cancelable: true }, opts)));
        },
        keydown: function(el, opts) {
            if (typeof el === 'string') el = document.querySelector(el);
            opts = opts || {};
            // Add keyCode for common keys if not provided
            if (opts.key && !opts.keyCode) {
                opts.keyCode = simulate._getKeyCode(opts.key);
            }
            // Use bubbles and cancelable for proper event propagation
            el.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ bubbles: true, cancelable: true }, opts)));
        },
        keyup: function(el, opts) {
            if (typeof el === 'string') el = document.querySelector(el);
            opts = opts || {};
            if (opts.key && !opts.keyCode) {
                opts.keyCode = simulate._getKeyCode(opts.key);
            }
            el.dispatchEvent(new KeyboardEvent('keyup', Object.assign({ bubbles: true }, opts)));
        },
        keypress: function(el, opts) {
            if (typeof el === 'string') el = document.querySelector(el);
            opts = opts || {};
            if (opts.key && !opts.keyCode) {
                opts.keyCode = simulate._getKeyCode(opts.key);
            }
            el.dispatchEvent(new KeyboardEvent('keypress', Object.assign({ bubbles: true }, opts)));
        },
        _getKeyCode: function(key) {
            var keyCodes = {
                'Backspace': 8, 'Tab': 9, 'Enter': 13, 'Escape': 27, ' ': 32,
                'PageUp': 33, 'PageDown': 34, 'End': 35, 'Home': 36,
                'ArrowLeft': 37, 'ArrowUp': 38, 'ArrowRight': 39, 'ArrowDown': 40,
                'Delete': 46,
                // Function keys
                'F1': 112, 'F2': 113, 'F3': 114, 'F4': 115, 'F5': 116, 'F6': 117,
                'F7': 118, 'F8': 119, 'F9': 120, 'F10': 121, 'F11': 122, 'F12': 123
            };
            return keyCodes[key] || 0;
        },
        input: function(el, value) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        },
        change: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.dispatchEvent(new Event('change', { bubbles: true }));
        },
        focus: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.focus();
            el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        },
        blur: function(el) {
            if (typeof el === 'string') el = document.querySelector(el);
            el.blur();
            el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
        },
        submit: function(form) {
            if (typeof form === 'string') form = document.querySelector(form);
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        },

        // ═══════════════════════════════════════════════════════════
        // RESPONSIVE / VIEWPORT SIMULATION
        // ═══════════════════════════════════════════════════════════

        /**
         * Simulate window resize by mocking innerWidth/innerHeight
         * @param {number} width - Viewport width in pixels
         * @param {number} height - Viewport height in pixels
         * @returns {Function} Restore function to reset viewport
         */
        resize: function(width, height) {
            var originalInnerWidth = window.innerWidth;
            var originalInnerHeight = window.innerHeight;

            // Mock window dimensions using Object.defineProperty
            try {
                Object.defineProperty(window, 'innerWidth', {
                    value: width,
                    writable: true,
                    configurable: true
                });
                Object.defineProperty(window, 'innerHeight', {
                    value: height,
                    writable: true,
                    configurable: true
                });
            } catch (e) {
                // Some browsers may not allow this
                console.warn('[FunkyTests] Could not mock window dimensions');
            }

            // Trigger resize event
            window.dispatchEvent(new Event('resize'));

            // Return restore function
            return function restore() {
                try {
                    Object.defineProperty(window, 'innerWidth', {
                        value: originalInnerWidth,
                        writable: true,
                        configurable: true
                    });
                    Object.defineProperty(window, 'innerHeight', {
                        value: originalInnerHeight,
                        writable: true,
                        configurable: true
                    });
                } catch (e) {
                    // Restore failed
                }
                window.dispatchEvent(new Event('resize'));
            };
        },

        /**
         * Simulate matchMedia result for a specific query
         * @param {string} query - Media query string (e.g., '(max-width: 768px)')
         * @param {boolean} matches - Whether the query should match
         * @returns {Function} Restore function to reset matchMedia
         */
        matchMedia: function(query, matches) {
            var originalMatchMedia = window.matchMedia;

            window.matchMedia = function(q) {
                // Match exact query or partial match
                if (q === query || q.indexOf(query) !== -1) {
                    return {
                        matches: matches,
                        media: q,
                        onchange: null,
                        addEventListener: function(type, listener) {
                            // Store for potential manual triggering
                        },
                        removeEventListener: function(type, listener) {},
                        addListener: function(listener) {},
                        removeListener: function(listener) {},
                        dispatchEvent: function(event) { return true; }
                    };
                }
                // Fall back to original for other queries
                return originalMatchMedia ? originalMatchMedia(q) : {
                    matches: false,
                    media: q,
                    onchange: null,
                    addEventListener: function() {},
                    removeEventListener: function() {},
                    addListener: function() {},
                    removeListener: function() {},
                    dispatchEvent: function() { return true; }
                };
            };

            return function restore() {
                window.matchMedia = originalMatchMedia;
            };
        },

        // Preset breakpoint helpers for common viewport sizes
        mobile: function() {
            return simulate.resize(375, 667);
        },
        tablet: function() {
            return simulate.resize(768, 1024);
        },
        desktop: function() {
            return simulate.resize(1280, 800);
        },
        large: function() {
            return simulate.resize(1920, 1080);
        },

        /**
         * Simulate touch device by mocking matchMedia for pointer queries
         * @returns {Function} Restore function
         */
        touchDevice: function() {
            return simulate.matchMedia('(pointer: coarse)', true);
        },

        /**
         * Simulate mouse device by mocking matchMedia for pointer queries
         * @returns {Function} Restore function
         */
        mouseDevice: function() {
            return simulate.matchMedia('(pointer: fine)', true);
        },

        /**
         * Simulate reduced motion preference
         * @param {boolean} enabled - Whether reduced motion is preferred
         * @returns {Function} Restore function
         */
        reducedMotion: function(enabled) {
            return simulate.matchMedia('(prefers-reduced-motion: reduce)', enabled !== false);
        },

        /**
         * Simulate dark mode preference
         * @param {boolean} enabled - Whether dark mode is preferred
         * @returns {Function} Restore function
         */
        darkMode: function(enabled) {
            return simulate.matchMedia('(prefers-color-scheme: dark)', enabled !== false);
        },

        /**
         * Simulate orientation
         * @param {string} orientation - 'portrait' or 'landscape'
         * @returns {Function} Restore function
         */
        orientation: function(orientation) {
            var isPortrait = orientation === 'portrait';
            return simulate.matchMedia('(orientation: ' + orientation + ')', true);
        }
    };

    function fixture(html) {
        var container = document.createElement('div');
        container.className = 'test-fixture';
        document.body.appendChild(container);

        // If html is provided, set it immediately
        if (html) {
            container.innerHTML = html;
        }

        var fixtureApi = {
            el: container,
            container: container,
            // Set HTML content (for no-argument fixture usage)
            html: function(htmlContent) {
                container.innerHTML = htmlContent;
                fixtureApi.el = container.firstElementChild || container;
                return fixtureApi;
            },
            // Append HTML content to the fixture
            append: function(htmlContent) {
                var temp = document.createElement('div');
                temp.innerHTML = htmlContent;
                while (temp.firstChild) {
                    container.appendChild(temp.firstChild);
                }
                return fixtureApi;
            },
            query: function(selector) {
                return container.querySelector(selector);
            },
            queryAll: function(selector) {
                return Array.prototype.slice.call(container.querySelectorAll(selector));
            },
            destroy: function() {
                if (container.parentNode) {
                    container.remove();
                }
            },
            // Alias for destroy (cleanup pattern)
            cleanup: function() {
                fixtureApi.destroy();
            }
        };

        // Set el to first child if html was provided
        if (html) {
            fixtureApi.el = container.firstElementChild || container;
        }

        return fixtureApi;
    }

    function waitFor(condition, options) {
        options = options || {};
        var timeout = options.timeout || 5000;
        var interval = options.interval || 50;

        return new Promise(function(resolve, reject) {
            var elapsed = 0;
            var check = function() {
                // Check if stopped before each check
                if (stopped) {
                    reject(new Error('waitFor aborted by user'));
                    return;
                }

                var result;
                try {
                    result = typeof condition === 'function' ? condition() : document.querySelector(condition);
                } catch (e) {
                    result = false;
                }

                if (result) {
                    resolve(result);
                } else if (elapsed >= timeout) {
                    reject(new Error('waitFor timed out after ' + timeout + 'ms'));
                } else {
                    elapsed += interval;
                    setTimeout(check, interval);
                }
            };
            check();
        });
    }

    function waitForEvent(element, eventType, options) {
        options = options || {};
        var timeout = options.timeout || 5000;
        if (typeof element === 'string') element = document.querySelector(element);

        return new Promise(function(resolve, reject) {
            // Check if already stopped
            if (stopped) {
                reject(new Error('waitForEvent aborted by user'));
                return;
            }

            var timer = setTimeout(function() {
                clearInterval(abortCheckId);
                element.removeEventListener(eventType, handler);
                reject(new Error('waitForEvent timed out waiting for ' + eventType));
            }, timeout);

            // Periodic abort check
            var abortCheckId = setInterval(function() {
                if (stopped) {
                    clearInterval(abortCheckId);
                    clearTimeout(timer);
                    element.removeEventListener(eventType, handler);
                    reject(new Error('waitForEvent aborted by user'));
                }
            }, 50);

            function handler(event) {
                clearInterval(abortCheckId);
                clearTimeout(timer);
                element.removeEventListener(eventType, handler);
                resolve(event);
            }

            element.addEventListener(eventType, handler);
        });
    }

    function delay(ms) {
        return new Promise(function(resolve, reject) {
            // Check if already stopped
            if (stopped) {
                reject(new Error('delay aborted by user'));
                return;
            }

            var timer = setTimeout(function() {
                clearInterval(abortCheckId);
                resolve();
            }, ms);

            // Periodic abort check
            var abortCheckId = setInterval(function() {
                if (stopped) {
                    clearInterval(abortCheckId);
                    clearTimeout(timer);
                    reject(new Error('delay aborted by user'));
                }
            }, 50);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════

    function reset() {
        suites = [];
        currentSuite = null;
        restoreAllSpies();
        if (fakeTimers.enabled) {
            useRealTimers();
        }
        results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            failures: [],
            startTime: 0,
            endTime: 0
        };
    }

    // ═══════════════════════════════════════════════════════════
    // AUTO-RUN
    // ═══════════════════════════════════════════════════════════

    // Run tests if ?test=1 in URL
    if (window.location.search.indexOf('test=1') !== -1) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                runAll();
            }, 100);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════

    window.FunkyTests = {
        // Suite definition
        describe: describe,
        xdescribe: xdescribe,
        it: it,
        xit: xit,
        test: it,          // Alias
        skip: xit,         // Alias

        // Hooks
        beforeEach: beforeEach,
        afterEach: afterEach,
        beforeAll: beforeAll,
        afterAll: afterAll,

        // Assertions
        expect: expect,

        // Spies
        spy: spy,
        spyOn: spyOn,
        restoreAllSpies: restoreAllSpies,

        // Fake timers
        useFakeTimers: useFakeTimers,
        useRealTimers: useRealTimers,
        advanceTimersByTime: advanceTimersByTime,
        runAllTimers: runAllTimers,

        // Redirect blocking (for tests that need to check)
        RedirectBlocker: RedirectBlocker,

        // Running
        runAll: runAll,
        run: run,
        stop: stop,
        reset: reset,
        setReporter: setReporter,

        // Utilities
        simulate: simulate,
        fixture: fixture,
        waitFor: waitFor,
        waitForEvent: waitForEvent,
        delay: delay,

        // Configuration
        configure: function(opts) {
            Object.keys(opts).forEach(function(key) {
                config[key] = opts[key];
            });
        },

        // Get total test count
        getTestCount: function(filter) {
            function countTests(suite) {
                var count = 0;
                suite.tests.forEach(function(item) {
                    if (item.type === 'suite') {
                        count += countTests(item.suite);
                    } else {
                        if (!filter || filter.test(item.name)) {
                            count++;
                        }
                    }
                });
                return count;
            }
            return suites.reduce(function(total, suite) {
                return total + countTests(suite);
            }, 0);
        },

        // Get all registered suites (for UI rendering)
        getSuites: function() {
            return suites.slice();
        },

        // CLI support: check if test run is complete
        isComplete: function() {
            return runComplete === true;
        },

        // CLI support: get structured results for external tools
        getResults: function() {
            return {
                passed: results.passed,
                failed: results.failed,
                skipped: results.skipped,
                total: results.total,
                duration: results.endTime - results.startTime,
                failures: results.failures.map(function(f) {
                    return {
                        suite: f.suite.name,
                        test: f.test.name,
                        error: f.error.message || String(f.error),
                        stack: f.error.stack || null
                    };
                }),
                tests: allTests.slice()
            };
        },

        // Version
        version: '1.0.0'
    };

    // Also expose globally for convenience
    window.describe = describe;
    window.xdescribe = xdescribe;
    window.it = it;
    window.xit = xit;
    window.beforeEach = beforeEach;
    window.afterEach = afterEach;
    window.beforeAll = beforeAll;
    window.afterAll = afterAll;
    window.expect = expect;
    window.spyOn = spyOn;

    // Jasmine compatibility layer
    window.jasmine = {
        createSpy: function(name) {
            var s = spy();
            s._name = name || 'unknown';
            return s;
        },
        createSpyObj: function(name, methods) {
            var obj = {};
            methods.forEach(function(method) {
                obj[method] = spy();
                obj[method]._name = name + '.' + method;
            });
            return obj;
        }
    };

})(window);
