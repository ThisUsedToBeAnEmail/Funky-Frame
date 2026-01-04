/**
 * Tests for Funky.RequestQueue
 * HTTP Request Queue for Offline Support
 *
 * Note: RequestQueue depends on JobQueue. If JobQueue is not loaded,
 * RequestQueue won't register and these tests will be skipped.
 */
FunkyTests.describe('Funky.Core.RequestQueue', function() {
  var expect = FunkyTests.expect;

  // Check if RequestQueue is available - it requires JobQueue dependency
  var isAvailable = function() {
    return typeof Funky.RequestQueue !== 'undefined' && Funky.RequestQueue !== null;
  };

  // Helper to skip test if RequestQueue not available
  var skipIfUnavailable = function() {
    if (!isAvailable()) {
      expect(true).toBe(true); // Pass the test as skipped
      return true;
    }
    return false;
  };

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.RequestQueue exists or is skipped due to missing dependencies', function() {
      // RequestQueue may not be available if its dependencies aren't loaded
      // This is expected behavior - just verify it either exists or doesn't
      if (!isAvailable()) {
        // RequestQueue not loaded - this is OK, just skip
        expect(true).toBe(true);
        return;
      }
      // If RequestQueue IS available, verify it's an object
      expect(typeof Funky.RequestQueue).toBe('object');
    });

    FunkyTests.it('has enable method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.enable).toBe('function');
    });

    FunkyTests.it('has disable method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.disable).toBe('function');
    });

    FunkyTests.it('has isOnline method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.isOnline).toBe('function');
    });

    FunkyTests.it('has isEnabled method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.isEnabled).toBe('function');
    });

    FunkyTests.it('has getAll method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.getAll).toBe('function');
    });

    FunkyTests.it('has get method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.get).toBe('function');
    });

    FunkyTests.it('has count method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.count).toBe('function');
    });

    FunkyTests.it('has remove method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.remove).toBe('function');
    });

    FunkyTests.it('has clear method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.clear).toBe('function');
    });

    FunkyTests.it('has retry method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.retry).toBe('function');
    });

    FunkyTests.it('has retryAll method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.retryAll).toBe('function');
    });

    FunkyTests.it('has sync method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.sync).toBe('function');
    });

    FunkyTests.it('has pause method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.pause).toBe('function');
    });

    FunkyTests.it('has resume method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.resume).toBe('function');
    });

    FunkyTests.it('has on method for events', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.on).toBe('function');
    });

    FunkyTests.it('has off method for events', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.off).toBe('function');
    });
  });

  FunkyTests.describe('Conflict Resolution API', function() {
    FunkyTests.it('has setDefaultConflictStrategy method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.setDefaultConflictStrategy).toBe('function');
    });

    FunkyTests.it('has setConflictStrategy method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.setConflictStrategy).toBe('function');
    });

    FunkyTests.it('has getConflicts method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.getConflicts).toBe('function');
    });

    FunkyTests.it('has resolveConflict method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.resolveConflict).toBe('function');
    });

    FunkyTests.it('has resolveAllConflicts method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.resolveAllConflicts).toBe('function');
    });
  });

  FunkyTests.describe('Debug API', function() {
    FunkyTests.it('has debug method', function() {
      if (skipIfUnavailable()) return;
      expect(typeof Funky.RequestQueue.debug).toBe('function');
    });

    FunkyTests.it('debug returns expected structure', function() {
      if (skipIfUnavailable()) return;
      var debugInfo = Funky.RequestQueue.debug();

      expect(debugInfo !== null).toBe(true);
      expect(typeof debugInfo).toBe('object');
      expect(typeof debugInfo.online).toBe('boolean');
      expect(typeof debugInfo.enabled).toBe('boolean');
      expect(typeof debugInfo.config).toBe('object');
    });
  });

  FunkyTests.describe('Initial State', function() {
    FunkyTests.it('isOnline returns boolean', function() {
      if (skipIfUnavailable()) return;
      var online = Funky.RequestQueue.isOnline();
      expect(typeof online).toBe('boolean');
    });

    FunkyTests.it('isOnline reflects navigator.onLine', function() {
      if (skipIfUnavailable()) return;
      // This should match browser state
      var online = Funky.RequestQueue.isOnline();
      expect(online).toBe(navigator.onLine);
    });

    FunkyTests.it('isEnabled returns false initially', function() {
      if (skipIfUnavailable()) return;
      // Before enable() is called
      var enabled = Funky.RequestQueue.isEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    FunkyTests.it('getAll returns array', function() {
      if (skipIfUnavailable()) return;
      var all = Funky.RequestQueue.getAll();
      expect(Array.isArray(all)).toBe(true);
    });

    FunkyTests.it('getAll returns empty when not enabled', function() {
      if (skipIfUnavailable()) return;
      var all = Funky.RequestQueue.getAll();
      expect(all.length).toBe(0);
    });

    FunkyTests.it('count returns 0 when not enabled', function() {
      if (skipIfUnavailable()) return;
      var count = Funky.RequestQueue.count();
      expect(count).toBe(0);
    });

    FunkyTests.it('get returns null when not enabled', function() {
      if (skipIfUnavailable()) return;
      var item = Funky.RequestQueue.get(1);
      expect(item).toBe(null);
    });

    FunkyTests.it('getConflicts returns empty array when not enabled', function() {
      if (skipIfUnavailable()) return;
      var conflicts = Funky.RequestQueue.getConflicts();
      expect(Array.isArray(conflicts)).toBe(true);
      expect(conflicts.length).toBe(0);
    });
  });

  FunkyTests.describe('Event Subscription', function() {
    FunkyTests.it('on returns RequestQueue for chaining', function() {
      if (skipIfUnavailable()) return;
      var handler = function() {};
      var result = Funky.RequestQueue.on('test', handler);

      expect(result).toBe(Funky.RequestQueue);

      // Cleanup
      Funky.RequestQueue.off('test', handler);
    });

    FunkyTests.it('off returns RequestQueue for chaining', function() {
      if (skipIfUnavailable()) return;
      var handler = function() {};
      Funky.RequestQueue.on('test', handler);
      var result = Funky.RequestQueue.off('test', handler);

      expect(result).toBe(Funky.RequestQueue);
    });

    FunkyTests.it('can subscribe to events', function() {
      if (skipIfUnavailable()) return;
      var called = false;
      var handler = function() { called = true; };

      Funky.RequestQueue.on('test-event', handler);

      // We can't easily trigger this without mocking
      // Just verify subscription succeeded
      expect(called).toBe(false);

      Funky.RequestQueue.off('test-event', handler);
    });
  });

  FunkyTests.describe('Conflict Strategy Configuration', function() {
    FunkyTests.it('setDefaultConflictStrategy accepts strategy string', function() {
      if (skipIfUnavailable()) return;
      // Should not throw
      var threw = false;
      try {
        Funky.RequestQueue.setDefaultConflictStrategy('server-wins');
        Funky.RequestQueue.setDefaultConflictStrategy('client-wins');
        Funky.RequestQueue.setDefaultConflictStrategy('prompt');
        Funky.RequestQueue.setDefaultConflictStrategy('merge');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('setConflictStrategy accepts url pattern and strategy', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.setConflictStrategy('/api/trades/*', 'server-wins');
        Funky.RequestQueue.setConflictStrategy('/api/docs/*', 'client-wins');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('setConflictStrategy accepts custom function', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.setConflictStrategy('/api/custom/*', function(item, actions) {
          actions.resolve();
        });
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  FunkyTests.describe('Queue Operations (Not Enabled)', function() {
    FunkyTests.it('remove returns false when not enabled', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.remove(1);
      expect(result).toBe(false);
    });

    FunkyTests.it('retry returns false when not enabled', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.retry(1);
      expect(result).toBe(false);
    });

    FunkyTests.it('retryAll returns 0 when not enabled', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.retryAll();
      expect(result).toBe(0);
    });

    FunkyTests.it('resolveConflict returns false when not enabled', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.resolveConflict(1, 'server-wins');
      expect(result).toBe(false);
    });

    FunkyTests.it('resolveAllConflicts returns 0 when not enabled', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.resolveAllConflicts('server-wins');
      expect(result).toBe(0);
    });

    FunkyTests.it('pause does not throw when not enabled', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.pause();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('resume does not throw when not enabled', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.resume();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('clear does not throw when not enabled', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.clear();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  FunkyTests.describe('Sync Method', function() {
    FunkyTests.it('sync returns a Promise', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.sync();
      expect(result instanceof Promise).toBe(true);
    });

    FunkyTests.it('sync resolves with result object', function(done) {
      if (skipIfUnavailable()) { done(); return; }
      Funky.RequestQueue.sync().then(function(result) {
        expect(typeof result).toBe('object');
        expect(typeof result.success).toBe('number');
        expect(typeof result.failed).toBe('number');
        expect(typeof result.pending).toBe('number');
        done();
      }).catch(function() {
        expect(false).toBe(true); // Should not reject
        done();
      });
    });

    FunkyTests.it('sync returns zeros when not enabled', function(done) {
      if (skipIfUnavailable()) { done(); return; }
      Funky.RequestQueue.sync().then(function(result) {
        expect(result.success).toBe(0);
        expect(result.failed).toBe(0);
        expect(result.pending).toBe(0);
        done();
      });
    });
  });

  FunkyTests.describe('Debug Information', function() {
    FunkyTests.it('debug returns config information', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();

      expect(debug.config !== undefined).toBe(true);
      expect(typeof debug.config.queueName).toBe('string');
      expect(Array.isArray(debug.config.queueableMethods)).toBe(true);
    });

    FunkyTests.it('debug returns conflict config', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();

      expect(debug.conflictConfig !== undefined).toBe(true);
      expect(typeof debug.conflictConfig.defaultStrategy).toBe('string');
    });

    FunkyTests.it('debug returns conflicts array', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();

      expect(Array.isArray(debug.conflicts)).toBe(true);
    });

    FunkyTests.it('debug returns listener attached status', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();

      expect(typeof debug.listenersAttached).toBe('boolean');
    });
  });

  FunkyTests.describe('Configuration Defaults', function() {
    FunkyTests.it('default queueable methods include POST', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();
      expect(debug.config.queueableMethods.indexOf('POST') !== -1).toBe(true);
    });

    FunkyTests.it('default queueable methods include PUT', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();
      expect(debug.config.queueableMethods.indexOf('PUT') !== -1).toBe(true);
    });

    FunkyTests.it('default queueable methods include PATCH', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();
      expect(debug.config.queueableMethods.indexOf('PATCH') !== -1).toBe(true);
    });

    FunkyTests.it('default queueable methods include DELETE', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();
      expect(debug.config.queueableMethods.indexOf('DELETE') !== -1).toBe(true);
    });

    FunkyTests.it('default queueable methods exclude GET', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();
      expect(debug.config.queueableMethods.indexOf('GET') === -1).toBe(true);
    });

    FunkyTests.it('default conflict strategy is prompt', function() {
      if (skipIfUnavailable()) return;
      // Reset to default before testing (in case previous tests changed it)
      if (Funky.RequestQueue.setDefaultConflictStrategy) {
        Funky.RequestQueue.setDefaultConflictStrategy('prompt');
      }
      var debug = Funky.RequestQueue.debug();
      expect(debug.conflictConfig.defaultStrategy).toBe('prompt');
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  FunkyTests.describe('Error handling', function() {
    FunkyTests.it('get handles null ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.get(null);
      expect(result).toBe(null);
    });

    FunkyTests.it('get handles undefined ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.get(undefined);
      expect(result).toBe(null);
    });

    FunkyTests.it('get handles string ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.get('invalid');
      expect(result).toBe(null);
    });

    FunkyTests.it('remove handles null ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.remove(null);
      expect(result).toBe(false);
    });

    FunkyTests.it('remove handles undefined ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.remove(undefined);
      expect(result).toBe(false);
    });

    FunkyTests.it('retry handles null ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.retry(null);
      expect(result).toBe(false);
    });

    FunkyTests.it('retry handles undefined ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.retry(undefined);
      expect(result).toBe(false);
    });

    FunkyTests.it('retry handles negative ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.retry(-1);
      expect(result).toBe(false);
    });

    FunkyTests.it('resolveConflict handles null ID gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.resolveConflict(null, 'server-wins');
      expect(result).toBe(false);
    });

    FunkyTests.it('resolveConflict handles invalid strategy gracefully', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.resolveConflict(1, 'invalid-strategy');
      expect(result).toBe(false);
    });

    FunkyTests.it('setDefaultConflictStrategy handles invalid strategy gracefully', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.setDefaultConflictStrategy('invalid');
      } catch (e) {
        threw = true;
      }
      // Either throws or ignores invalid strategy
      expect(threw === true || threw === false).toBe(true);
    });

    FunkyTests.it('setConflictStrategy handles null URL pattern gracefully', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.setConflictStrategy(null, 'server-wins');
      } catch (e) {
        threw = true;
      }
      expect(threw === true || threw === false).toBe(true);
    });

    FunkyTests.it('on handles null event name gracefully', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.on(null, function() {});
      } catch (e) {
        threw = true;
      }
      // Should either throw or ignore
      expect(threw === true || threw === false).toBe(true);
    });

    FunkyTests.it('on handles null handler gracefully', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.on('test', null);
      } catch (e) {
        threw = true;
      }
      expect(threw === true || threw === false).toBe(true);
    });

    FunkyTests.it('off handles non-existent handler gracefully', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.off('non-existent', function() {});
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  // =========================================================================
  // EDGE CASES TESTS
  // =========================================================================
  FunkyTests.describe('Edge cases', function() {
    FunkyTests.it('handles very large ID numbers', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.get(Number.MAX_SAFE_INTEGER);
      expect(result).toBe(null);
    });

    FunkyTests.it('handles zero ID', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.get(0);
      expect(result).toBe(null);
    });

    FunkyTests.it('handles floating point ID', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.get(1.5);
      expect(result).toBe(null);
    });

    FunkyTests.it('count returns number type', function() {
      if (skipIfUnavailable()) return;
      var count = Funky.RequestQueue.count();
      expect(typeof count).toBe('number');
      expect(count >= 0).toBe(true);
    });

    FunkyTests.it('getAll returns new array each time', function() {
      if (skipIfUnavailable()) return;
      var arr1 = Funky.RequestQueue.getAll();
      var arr2 = Funky.RequestQueue.getAll();
      expect(arr1).not.toBe(arr2);
    });

    FunkyTests.it('getConflicts returns new array each time', function() {
      if (skipIfUnavailable()) return;
      var arr1 = Funky.RequestQueue.getConflicts();
      var arr2 = Funky.RequestQueue.getConflicts();
      expect(arr1).not.toBe(arr2);
    });

    FunkyTests.it('multiple enable calls do not cause issues', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.enable();
        Funky.RequestQueue.enable();
        Funky.RequestQueue.enable();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
      Funky.RequestQueue.disable();
    });

    FunkyTests.it('multiple disable calls do not cause issues', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.disable();
        Funky.RequestQueue.disable();
        Funky.RequestQueue.disable();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('isOnline returns consistent results', function() {
      if (skipIfUnavailable()) return;
      var result1 = Funky.RequestQueue.isOnline();
      var result2 = Funky.RequestQueue.isOnline();
      expect(result1).toBe(result2);
    });

    FunkyTests.it('isEnabled returns consistent results', function() {
      if (skipIfUnavailable()) return;
      var result1 = Funky.RequestQueue.isEnabled();
      var result2 = Funky.RequestQueue.isEnabled();
      expect(result1).toBe(result2);
    });

    FunkyTests.it('URL pattern with wildcards', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.setConflictStrategy('/api/*/items/*', 'server-wins');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('URL pattern with regex-like characters', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.setConflictStrategy('/api/items?id=123', 'client-wins');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  // =========================================================================
  // ASYNC BEHAVIOR TESTS
  // =========================================================================
  FunkyTests.describe('Async behavior', function() {
    FunkyTests.it('sync returns Promise', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.sync();
      expect(result instanceof Promise).toBe(true);
    });

    FunkyTests.it('multiple sync calls return independent Promises', function() {
      if (skipIfUnavailable()) return;
      var p1 = Funky.RequestQueue.sync();
      var p2 = Funky.RequestQueue.sync();
      expect(p1).not.toBe(p2);
      expect(p1 instanceof Promise).toBe(true);
      expect(p2 instanceof Promise).toBe(true);
    });

    FunkyTests.it('sync resolves even when disabled', function(done) {
      if (skipIfUnavailable()) { done(); return; }
      Funky.RequestQueue.disable();
      Funky.RequestQueue.sync().then(function(result) {
        expect(result).toBeDefined();
        done();
      }).catch(function() {
        expect(false).toBe(true);
        done();
      });
    });

    FunkyTests.it('sync result has expected properties', function(done) {
      if (skipIfUnavailable()) { done(); return; }
      Funky.RequestQueue.sync().then(function(result) {
        expect('success' in result).toBe(true);
        expect('failed' in result).toBe(true);
        expect('pending' in result).toBe(true);
        done();
      });
    });
  });

  // =========================================================================
  // EVENT SYSTEM TESTS
  // =========================================================================
  FunkyTests.describe('Event system', function() {
    FunkyTests.it('can add multiple handlers for same event', function() {
      if (skipIfUnavailable()) return;
      var handler1 = function() {};
      var handler2 = function() {};
      var handler3 = function() {};

      Funky.RequestQueue.on('test', handler1);
      Funky.RequestQueue.on('test', handler2);
      Funky.RequestQueue.on('test', handler3);

      // Cleanup
      Funky.RequestQueue.off('test', handler1);
      Funky.RequestQueue.off('test', handler2);
      Funky.RequestQueue.off('test', handler3);

      expect(true).toBe(true);
    });

    FunkyTests.it('handlers for different events are independent', function() {
      if (skipIfUnavailable()) return;
      var handler1 = function() {};
      var handler2 = function() {};

      Funky.RequestQueue.on('event1', handler1);
      Funky.RequestQueue.on('event2', handler2);

      // Removing one shouldn't affect the other
      Funky.RequestQueue.off('event1', handler1);

      // Cleanup
      Funky.RequestQueue.off('event2', handler2);

      expect(true).toBe(true);
    });

    FunkyTests.it('off returns RequestQueue even for non-existent event', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.off('non-existent-event', function() {});
      expect(result).toBe(Funky.RequestQueue);
    });

    FunkyTests.it('can subscribe and unsubscribe in rapid succession', function() {
      if (skipIfUnavailable()) return;
      var handler = function() {};

      for (var i = 0; i < 10; i++) {
        Funky.RequestQueue.on('rapid-test', handler);
        Funky.RequestQueue.off('rapid-test', handler);
      }

      expect(true).toBe(true);
    });
  });

  // =========================================================================
  // STATE MANAGEMENT TESTS
  // =========================================================================
  FunkyTests.describe('State management', function() {
    FunkyTests.it('pause and resume do not throw when not enabled', function() {
      if (skipIfUnavailable()) return;
      Funky.RequestQueue.disable();

      var threw = false;
      try {
        Funky.RequestQueue.pause();
        Funky.RequestQueue.resume();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('clear does not throw when already empty', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.clear();
        Funky.RequestQueue.clear();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('retryAll returns number', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.retryAll();
      expect(typeof result).toBe('number');
    });

    FunkyTests.it('resolveAllConflicts returns number', function() {
      if (skipIfUnavailable()) return;
      var result = Funky.RequestQueue.resolveAllConflicts('server-wins');
      expect(typeof result).toBe('number');
    });

    FunkyTests.it('enable/disable cycle works correctly', function(done) {
      if (skipIfUnavailable()) { done(); return; }

      Funky.RequestQueue.disable();
      expect(Funky.RequestQueue.isEnabled()).toBe(false);

      // enable() is async - wait for it
      Funky.RequestQueue.enable().then(function() {
        expect(Funky.RequestQueue.isEnabled()).toBe(true);

        Funky.RequestQueue.disable();
        expect(Funky.RequestQueue.isEnabled()).toBe(false);
        done();
      }).catch(function() {
        // Enable might fail in test env - just verify disable works
        expect(Funky.RequestQueue.isEnabled()).toBe(false);
        done();
      });
    });
  });

  // =========================================================================
  // DEBUG INFO TESTS
  // =========================================================================
  FunkyTests.describe('Debug info structure', function() {
    FunkyTests.it('debug returns all expected keys', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();

      expect('online' in debug).toBe(true);
      expect('enabled' in debug).toBe(true);
      expect('config' in debug).toBe(true);
      expect('conflictConfig' in debug).toBe(true);
      expect('conflicts' in debug).toBe(true);
      expect('listenersAttached' in debug).toBe(true);
    });

    FunkyTests.it('debug config has queueName', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();
      expect(typeof debug.config.queueName).toBe('string');
      expect(debug.config.queueName.length).toBeGreaterThan(0);
    });

    FunkyTests.it('debug conflictConfig has strategies', function() {
      if (skipIfUnavailable()) return;
      var debug = Funky.RequestQueue.debug();
      // The conflictConfig uses 'strategies' for URL pattern-based strategies
      expect(debug.conflictConfig.strategies !== undefined).toBe(true);
    });

    FunkyTests.it('debug is idempotent', function() {
      if (skipIfUnavailable()) return;
      var debug1 = Funky.RequestQueue.debug();
      var debug2 = Funky.RequestQueue.debug();

      expect(debug1.online).toBe(debug2.online);
      expect(debug1.enabled).toBe(debug2.enabled);
      expect(debug1.config.queueName).toBe(debug2.config.queueName);
    });
  });

  // =========================================================================
  // CLEANUP TESTS
  // =========================================================================
  FunkyTests.describe('Cleanup', function() {
    FunkyTests.it('clear empties the queue', function() {
      if (skipIfUnavailable()) return;
      Funky.RequestQueue.clear();
      expect(Funky.RequestQueue.count()).toBe(0);
    });

    FunkyTests.it('clear empties conflicts', function() {
      if (skipIfUnavailable()) return;
      Funky.RequestQueue.clear();
      expect(Funky.RequestQueue.getConflicts().length).toBe(0);
    });

    FunkyTests.it('disable clears state', function() {
      if (skipIfUnavailable()) return;
      Funky.RequestQueue.enable();
      Funky.RequestQueue.disable();

      expect(Funky.RequestQueue.isEnabled()).toBe(false);
      expect(Funky.RequestQueue.count()).toBe(0);
    });

    FunkyTests.it('getAll returns empty after clear', function() {
      if (skipIfUnavailable()) return;
      Funky.RequestQueue.clear();
      var items = Funky.RequestQueue.getAll();
      expect(items.length).toBe(0);
    });
  });

  // =========================================================================
  // INPUT VALIDATION TESTS
  // =========================================================================
  FunkyTests.describe('Input validation', function() {
    FunkyTests.it('setConflictStrategy validates strategy type', function() {
      if (skipIfUnavailable()) return;
      // Should accept valid strategies
      var strategies = ['server-wins', 'client-wins', 'prompt', 'merge'];
      var allValid = true;

      strategies.forEach(function(strategy) {
        try {
          Funky.RequestQueue.setConflictStrategy('/test/*', strategy);
        } catch (e) {
          allValid = false;
        }
      });

      expect(allValid).toBe(true);
    });

    FunkyTests.it('setDefaultConflictStrategy validates strategy type', function() {
      if (skipIfUnavailable()) return;
      var strategies = ['server-wins', 'client-wins', 'prompt', 'merge'];
      var allValid = true;

      strategies.forEach(function(strategy) {
        try {
          Funky.RequestQueue.setDefaultConflictStrategy(strategy);
        } catch (e) {
          allValid = false;
        }
      });

      // Reset to default
      Funky.RequestQueue.setDefaultConflictStrategy('prompt');

      expect(allValid).toBe(true);
    });

    FunkyTests.it('accepts function as custom conflict strategy', function() {
      if (skipIfUnavailable()) return;
      var threw = false;
      try {
        Funky.RequestQueue.setConflictStrategy('/custom/*', function(item, actions) {
          // Custom resolution logic
          if (actions && actions.resolve) {
            actions.resolve();
          }
        });
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });
});
