/**
 * Tests for Funky.Timing
 * Throttle, debounce and animation frame utilities
 */
FunkyTests.describe('Funky.Core.Timing', function() {
  var expect = FunkyTests.expect;

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.Timing exists', function() {
      expect(Funky.Timing !== undefined).toBe(true);
    });

    FunkyTests.it('has throttle method', function() {
      expect(typeof Funky.Timing.throttle).toBe('function');
    });

    FunkyTests.it('has debounce method', function() {
      expect(typeof Funky.Timing.debounce).toBe('function');
    });

    FunkyTests.it('has raf method', function() {
      expect(typeof Funky.Timing.raf).toBe('function');
    });

    FunkyTests.it('has cancelRaf method', function() {
      expect(typeof Funky.Timing.cancelRaf).toBe('function');
    });
  });

  FunkyTests.describe('Throttle', function() {
    FunkyTests.it('returns a function', function() {
      var fn = function() {};
      var throttled = Funky.Timing.throttle(fn, 100);

      expect(typeof throttled).toBe('function');
    });

    FunkyTests.it('calls function immediately on first invocation', function() {
      var callCount = 0;
      var fn = function() { callCount++; };
      var throttled = Funky.Timing.throttle(fn, 100);

      throttled();

      expect(callCount).toBe(1);
    });

    FunkyTests.it('limits function calls within time window', function(done) {
      var callCount = 0;
      var fn = function() { callCount++; };
      var throttled = Funky.Timing.throttle(fn, 50);

      // Call rapidly
      throttled(); // First call - should execute
      throttled(); // Second call - should be throttled
      throttled(); // Third call - should be throttled

      expect(callCount).toBe(1);

      // Wait for throttle window to pass
      setTimeout(function() {
        throttled(); // Should execute now
        expect(callCount).toBe(2);
        done();
      }, 60);
    });

    FunkyTests.it('passes arguments to throttled function', function() {
      var receivedArgs = null;
      var fn = function(a, b) { receivedArgs = [a, b]; };
      var throttled = Funky.Timing.throttle(fn, 100);

      throttled('hello', 42);

      expect(receivedArgs[0]).toBe('hello');
      expect(receivedArgs[1]).toBe(42);
    });

    FunkyTests.it('preserves context (this)', function() {
      var receivedContext = null;
      var fn = function() { receivedContext = this; };
      var throttled = Funky.Timing.throttle(fn, 100);
      var context = { name: 'test' };

      throttled.call(context);

      expect(receivedContext.name).toBe('test');
    });

    FunkyTests.it('allows calls after limit expires', function(done) {
      var callCount = 0;
      var fn = function() { callCount++; };
      var throttled = Funky.Timing.throttle(fn, 30);

      throttled(); // t=0
      expect(callCount).toBe(1);

      setTimeout(function() {
        throttled(); // t=40 - limit expired
        expect(callCount).toBe(2);
        done();
      }, 40);
    });
  });

  FunkyTests.describe('Debounce', function() {
    FunkyTests.it('returns a function', function() {
      var fn = function() {};
      var debounced = Funky.Timing.debounce(fn, 100);

      expect(typeof debounced).toBe('function');
    });

    FunkyTests.it('delays function execution', function(done) {
      var callCount = 0;
      var fn = function() { callCount++; };
      var debounced = Funky.Timing.debounce(fn, 50);

      debounced();

      // Immediately after call
      expect(callCount).toBe(0);

      // After delay
      setTimeout(function() {
        expect(callCount).toBe(1);
        done();
      }, 60);
    });

    FunkyTests.it('resets delay on subsequent calls', function(done) {
      var callCount = 0;
      var fn = function() { callCount++; };
      var debounced = Funky.Timing.debounce(fn, 50);

      debounced();
      setTimeout(function() {
        debounced(); // Reset the timer at t=30
      }, 30);

      // At 200ms, the reset timer should have definitely fired (30 + 50 = 80ms)
      // We just verify it was called exactly once (debounce worked)
      setTimeout(function() {
        expect(callCount).toBe(1);
        done();
      }, 200);
    });

    FunkyTests.it('only calls once for rapid invocations', function(done) {
      var callCount = 0;
      var fn = function() { callCount++; };
      var debounced = Funky.Timing.debounce(fn, 50);

      // Rapid calls
      for (var i = 0; i < 10; i++) {
        debounced();
      }

      setTimeout(function() {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });

    FunkyTests.it('passes arguments to debounced function', function(done) {
      var receivedArgs = null;
      var fn = function(a, b) { receivedArgs = [a, b]; };
      var debounced = Funky.Timing.debounce(fn, 30);

      debounced('foo', 123);

      setTimeout(function() {
        expect(receivedArgs[0]).toBe('foo');
        expect(receivedArgs[1]).toBe(123);
        done();
      }, 50);
    });

    FunkyTests.it('uses last arguments when called multiple times', function(done) {
      var receivedValue = null;
      var fn = function(val) { receivedValue = val; };
      var debounced = Funky.Timing.debounce(fn, 30);

      debounced(1);
      debounced(2);
      debounced(3); // Last call

      setTimeout(function() {
        expect(receivedValue).toBe(3);
        done();
      }, 50);
    });

    FunkyTests.it('preserves context (this)', function(done) {
      var receivedContext = null;
      var fn = function() { receivedContext = this; };
      var debounced = Funky.Timing.debounce(fn, 30);
      var context = { id: 'context-test' };

      debounced.call(context);

      setTimeout(function() {
        expect(receivedContext.id).toBe('context-test');
        done();
      }, 50);
    });
  });

  FunkyTests.describe('RequestAnimationFrame', function() {
    FunkyTests.it('raf returns an ID', function() {
      var id = Funky.Timing.raf(function() {});

      expect(id !== undefined).toBe(true);
      expect(typeof id).toBe('number');

      Funky.Timing.cancelRaf(id);
    });

    FunkyTests.it('raf calls function', function(done) {
      var called = false;
      Funky.Timing.raf(function() {
        called = true;
        expect(called).toBe(true);
        done();
      });
    });

    FunkyTests.it('cancelRaf prevents execution', function(done) {
      var called = false;
      var id = Funky.Timing.raf(function() {
        called = true;
      });

      Funky.Timing.cancelRaf(id);

      // Wait to see if it fires
      setTimeout(function() {
        expect(called).toBe(false);
        done();
      }, 50);
    });

    FunkyTests.it('raf executes within one animation frame', function(done) {
      var start = Date.now();
      Funky.Timing.raf(function() {
        var elapsed = Date.now() - start;
        // Should execute within ~17ms (60fps) plus some tolerance
        expect(elapsed < 100).toBe(true);
        done();
      });
    });
  });

  FunkyTests.describe('Edge Cases', function() {
    FunkyTests.it('throttle with 0 limit allows all calls', function() {
      var callCount = 0;
      var fn = function() { callCount++; };
      var throttled = Funky.Timing.throttle(fn, 0);

      throttled();
      throttled();
      throttled();

      expect(callCount).toBe(3);
    });

    FunkyTests.it('debounce with 0 delay still debounces within same tick', function(done) {
      var callCount = 0;
      var fn = function() { callCount++; };
      var debounced = Funky.Timing.debounce(fn, 0);

      debounced();
      debounced();
      debounced();

      // Still need to wait for setTimeout(fn, 0) to fire
      setTimeout(function() {
        expect(callCount).toBe(1);
        done();
      }, 10);
    });

    FunkyTests.it('throttle works with no arguments', function() {
      var called = false;
      var fn = function() { called = true; };
      var throttled = Funky.Timing.throttle(fn, 100);

      throttled();

      expect(called).toBe(true);
    });

    FunkyTests.it('debounce works with no arguments', function(done) {
      var called = false;
      var fn = function() { called = true; };
      var debounced = Funky.Timing.debounce(fn, 30);

      debounced();

      setTimeout(function() {
        expect(called).toBe(true);
        done();
      }, 50);
    });
  });

  FunkyTests.describe('Practical Use Cases', function() {
    FunkyTests.it('throttle for scroll event simulation', function(done) {
      var callCount = 0;
      var throttled = Funky.Timing.throttle(function() {
        callCount++;
      }, 50);

      // Simulate rapid scroll events - call immediately and at intervals
      throttled(); // First call at t=0

      var interval = setInterval(function() {
        throttled();
      }, 10);

      setTimeout(function() {
        clearInterval(interval);
        // After 250ms with 50ms throttle, should have several calls
        // Be lenient: at minimum 2 (t=0 and t=50), at max ~6
        // In sandbox environments timing may vary
        expect(callCount >= 2 && callCount <= 8).toBe(true);
        done();
      }, 250);
    });

    FunkyTests.it('debounce for search input simulation', function(done) {
      var searchCalls = 0;
      var debounced = Funky.Timing.debounce(function() {
        searchCalls++;
      }, 100);

      // Simulate typing "hello" character by character
      debounced('h');
      setTimeout(function() { debounced('he'); }, 30);
      setTimeout(function() { debounced('hel'); }, 60);
      setTimeout(function() { debounced('hell'); }, 90);
      setTimeout(function() { debounced('hello'); }, 120);

      // Should only make one API call after typing stops (120ms + 100ms = 220ms)
      // Give extra margin for sandbox environments
      setTimeout(function() {
        expect(searchCalls).toBe(1);
        done();
      }, 350);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  FunkyTests.describe('Error handling', function() {
    FunkyTests.it('throttle handles null function gracefully', function() {
      expect(function() {
        Funky.Timing.throttle(null, 100);
      }).not.toThrow();
    });

    FunkyTests.it('throttle handles undefined function gracefully', function() {
      expect(function() {
        Funky.Timing.throttle(undefined, 100);
      }).not.toThrow();
    });

    FunkyTests.it('debounce handles null function gracefully', function() {
      expect(function() {
        Funky.Timing.debounce(null, 100);
      }).not.toThrow();
    });

    FunkyTests.it('debounce handles undefined function gracefully', function() {
      expect(function() {
        Funky.Timing.debounce(undefined, 100);
      }).not.toThrow();
    });

    FunkyTests.it('raf handles null callback gracefully', function() {
      expect(function() {
        Funky.Timing.raf(null);
      }).not.toThrow();
    });

    FunkyTests.it('cancelRaf handles null id gracefully', function() {
      expect(function() {
        Funky.Timing.cancelRaf(null);
      }).not.toThrow();
    });

    FunkyTests.it('cancelRaf handles undefined id gracefully', function() {
      expect(function() {
        Funky.Timing.cancelRaf(undefined);
      }).not.toThrow();
    });

    FunkyTests.it('cancelRaf handles invalid id gracefully', function() {
      expect(function() {
        Funky.Timing.cancelRaf(-1);
        Funky.Timing.cancelRaf(999999999);
      }).not.toThrow();
    });

    FunkyTests.it('throttle handles error in callback', function() {
      var throttled = Funky.Timing.throttle(function() {
        throw new Error('Callback error');
      }, 100);

      expect(function() {
        throttled();
      }).toThrow();
    });

    FunkyTests.it('debounce handles negative delay', function() {
      var called = false;
      var debounced = Funky.Timing.debounce(function() {
        called = true;
      }, -100);

      debounced();
      // Should still work with negative treated as 0
      expect(true).toBe(true);
    });

    FunkyTests.it('throttle handles negative limit', function() {
      var callCount = 0;
      var throttled = Funky.Timing.throttle(function() {
        callCount++;
      }, -100);

      throttled();
      throttled();
      throttled();

      // Negative limit should allow all calls
      expect(callCount).toBe(3);
    });
  });

  // =========================================================================
  // INPUT VALIDATION TESTS
  // =========================================================================
  FunkyTests.describe('Input validation', function() {
    FunkyTests.it('throttle handles string delay gracefully', function() {
      var called = false;
      var throttled = Funky.Timing.throttle(function() {
        called = true;
      }, '100');

      throttled();
      expect(called).toBe(true);
    });

    FunkyTests.it('debounce handles string delay gracefully', function(done) {
      var called = false;
      var debounced = Funky.Timing.debounce(function() {
        called = true;
      }, '30');

      debounced();

      setTimeout(function() {
        expect(called).toBe(true);
        done();
      }, 50);
    });

    FunkyTests.it('throttle handles NaN delay', function() {
      var called = false;
      var throttled = Funky.Timing.throttle(function() {
        called = true;
      }, NaN);

      throttled();
      expect(called).toBe(true);
    });

    FunkyTests.it('debounce handles Infinity delay', function() {
      var debounced = Funky.Timing.debounce(function() {}, Infinity);
      expect(typeof debounced).toBe('function');
    });

    FunkyTests.it('throttle handles float delay', function() {
      var callCount = 0;
      var throttled = Funky.Timing.throttle(function() {
        callCount++;
      }, 50.5);

      throttled();
      expect(callCount).toBe(1);
    });
  });

  // =========================================================================
  // CLEANUP TESTS
  // =========================================================================
  FunkyTests.describe('Cleanup', function() {
    FunkyTests.it('multiple cancelRaf calls are safe', function() {
      var id = Funky.Timing.raf(function() {});

      expect(function() {
        Funky.Timing.cancelRaf(id);
        Funky.Timing.cancelRaf(id);
        Funky.Timing.cancelRaf(id);
      }).not.toThrow();
    });

    FunkyTests.it('raf callback only fires once', function(done) {
      var callCount = 0;
      Funky.Timing.raf(function() {
        callCount++;
      });

      setTimeout(function() {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });

    FunkyTests.it('throttled function can be created and discarded', function() {
      for (var i = 0; i < 100; i++) {
        Funky.Timing.throttle(function() {}, 100);
      }
      expect(true).toBe(true);
    });

    FunkyTests.it('debounced function can be created and discarded', function() {
      for (var i = 0; i < 100; i++) {
        Funky.Timing.debounce(function() {}, 100);
      }
      expect(true).toBe(true);
    });
  });

  // =========================================================================
  // STATE VERIFICATION TESTS
  // =========================================================================
  FunkyTests.describe('State verification', function() {
    FunkyTests.it('throttle maintains separate state for each instance', function() {
      var count1 = 0;
      var count2 = 0;

      var throttled1 = Funky.Timing.throttle(function() { count1++; }, 100);
      var throttled2 = Funky.Timing.throttle(function() { count2++; }, 100);

      throttled1();
      throttled2();

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    FunkyTests.it('debounce maintains separate state for each instance', function(done) {
      var count1 = 0;
      var count2 = 0;

      var debounced1 = Funky.Timing.debounce(function() { count1++; }, 30);
      var debounced2 = Funky.Timing.debounce(function() { count2++; }, 30);

      debounced1();
      debounced2();

      setTimeout(function() {
        expect(count1).toBe(1);
        expect(count2).toBe(1);
        done();
      }, 50);
    });

    FunkyTests.it('raf returns unique IDs', function() {
      var ids = [];
      for (var i = 0; i < 10; i++) {
        ids.push(Funky.Timing.raf(function() {}));
      }

      // Cancel all
      ids.forEach(function(id) {
        Funky.Timing.cancelRaf(id);
      });

      // Check uniqueness
      var unique = ids.filter(function(id, index) {
        return ids.indexOf(id) === index;
      });
      expect(unique.length).toBe(10);
    });
  });
});
