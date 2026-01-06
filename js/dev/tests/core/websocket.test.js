/**
 * Tests for Funky.WebSocket
 * Real-time WebSocket Connection Manager
 * @version 2.0.0
 */
FunkyTests.describe('Funky.Core.WebSocket', function() {
  var expect = FunkyTests.expect;

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.WebSocket exists', function() {
      expect(Funky.WebSocket !== undefined).toBe(true);
    });

    FunkyTests.it('has init method', function() {
      expect(typeof Funky.WebSocket.init).toBe('function');
    });

    FunkyTests.it('has isInitialized method', function() {
      expect(typeof Funky.WebSocket.isInitialized).toBe('function');
    });

    FunkyTests.it('has configure method', function() {
      expect(typeof Funky.WebSocket.configure).toBe('function');
    });

    FunkyTests.it('has destroy method', function() {
      expect(typeof Funky.WebSocket.destroy).toBe('function');
    });

    FunkyTests.it('has connect method', function() {
      expect(typeof Funky.WebSocket.connect).toBe('function');
    });

    FunkyTests.it('has disconnect method', function() {
      expect(typeof Funky.WebSocket.disconnect).toBe('function');
    });

    FunkyTests.it('has subscribe method', function() {
      expect(typeof Funky.WebSocket.subscribe).toBe('function');
    });

    FunkyTests.it('has unsubscribe method', function() {
      expect(typeof Funky.WebSocket.unsubscribe).toBe('function');
    });

    FunkyTests.it('has getSubscriptions method', function() {
      expect(typeof Funky.WebSocket.getSubscriptions).toBe('function');
    });

    FunkyTests.it('has send method', function() {
      expect(typeof Funky.WebSocket.send).toBe('function');
    });

    FunkyTests.it('has on method for events', function() {
      expect(typeof Funky.WebSocket.on).toBe('function');
    });

    FunkyTests.it('has off method for events', function() {
      expect(typeof Funky.WebSocket.off).toBe('function');
    });

    FunkyTests.it('has isConnected method', function() {
      expect(typeof Funky.WebSocket.isConnected).toBe('function');
    });

    FunkyTests.it('has getState method', function() {
      expect(typeof Funky.WebSocket.getState).toBe('function');
    });

    FunkyTests.it('has getConnectionId method', function() {
      expect(typeof Funky.WebSocket.getConnectionId).toBe('function');
    });

    FunkyTests.it('has getDebugState method', function() {
      expect(typeof Funky.WebSocket.getDebugState).toBe('function');
    });
  });

  FunkyTests.describe('Initialization (v2.0.0)', function() {
    FunkyTests.it('isInitialized returns boolean', function() {
      var initialized = Funky.WebSocket.isInitialized();
      expect(typeof initialized).toBe('boolean');
    });

    FunkyTests.it('init can be called without options', function() {
      expect(function() {
        Funky.WebSocket.init();
      }).not.toThrow();
    });

    FunkyTests.it('init can be called with options', function() {
      expect(function() {
        Funky.WebSocket.init({ debug: false });
      }).not.toThrow();
    });

    FunkyTests.it('init is idempotent (safe to call multiple times)', function() {
      expect(function() {
        Funky.WebSocket.init();
        Funky.WebSocket.init();
        Funky.WebSocket.init({ debug: false });
      }).not.toThrow();
    });

    FunkyTests.it('isInitialized returns true after init', function() {
      Funky.WebSocket.init();
      expect(Funky.WebSocket.isInitialized()).toBe(true);
    });

    FunkyTests.it('destroy resets initialized state', function() {
      Funky.WebSocket.init();
      Funky.WebSocket.destroy();
      expect(Funky.WebSocket.isInitialized()).toBe(false);
    });

    FunkyTests.it('can re-initialize after destroy', function() {
      Funky.WebSocket.destroy();
      Funky.WebSocket.init();
      expect(Funky.WebSocket.isInitialized()).toBe(true);
    });
  });

  FunkyTests.describe('Initial State', function() {
    FunkyTests.it('isConnected returns boolean', function() {
      var connected = Funky.WebSocket.isConnected();
      expect(typeof connected).toBe('boolean');
    });

    FunkyTests.it('isConnected returns false initially (no auth)', function() {
      // Without user authentication, should not auto-connect
      var connected = Funky.WebSocket.isConnected();
      expect(connected).toBe(false);
    });

    FunkyTests.it('getState returns string', function() {
      var state = Funky.WebSocket.getState();
      expect(typeof state).toBe('string');
    });

    FunkyTests.it('getState returns valid status', function() {
      var state = Funky.WebSocket.getState();
      var validStates = ['disconnected', 'connecting', 'connected', 'reconnecting'];
      expect(validStates.indexOf(state) !== -1).toBe(true);
    });

    FunkyTests.it('getSubscriptions returns array', function() {
      var subs = Funky.WebSocket.getSubscriptions();
      expect(Array.isArray(subs)).toBe(true);
    });

    FunkyTests.it('getConnectionId returns null when not connected', function() {
      var id = Funky.WebSocket.getConnectionId();
      expect(id).toBe(null);
    });
  });

  FunkyTests.describe('Debug State', function() {
    FunkyTests.it('getDebugState returns object', function() {
      var debug = Funky.WebSocket.getDebugState();
      expect(typeof debug).toBe('object');
      expect(debug !== null).toBe(true);
    });

    FunkyTests.it('debug state has status', function() {
      var debug = Funky.WebSocket.getDebugState();
      expect(typeof debug.status).toBe('string');
    });

    FunkyTests.it('debug state has reconnectAttempts', function() {
      var debug = Funky.WebSocket.getDebugState();
      expect(typeof debug.reconnectAttempts).toBe('number');
    });

    FunkyTests.it('debug state has channels array', function() {
      var debug = Funky.WebSocket.getDebugState();
      expect(Array.isArray(debug.channels)).toBe(true);
    });

    FunkyTests.it('debug state has handlerTypes array', function() {
      var debug = Funky.WebSocket.getDebugState();
      expect(Array.isArray(debug.handlerTypes)).toBe(true);
    });
  });

  FunkyTests.describe('Channel Subscription (Offline)', function() {
    var testChannel = 'test-channel-' + Date.now();

    FunkyTests.afterEach(function() {
      // Cleanup any subscriptions
      Funky.WebSocket.unsubscribe(testChannel);
    });

    FunkyTests.it('subscribe queues subscription when not connected', function() {
      Funky.WebSocket.subscribe(testChannel);

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.indexOf(testChannel) !== -1).toBe(true);
    });

    FunkyTests.it('subscribe with handler returns unsubscribe function', function() {
      var handler = function() {};
      var unsubscribe = Funky.WebSocket.subscribe(testChannel, handler);

      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    FunkyTests.it('subscribe without handler returns undefined', function() {
      var result = Funky.WebSocket.subscribe(testChannel);

      expect(result).toBe(undefined);
    });

    FunkyTests.it('unsubscribe function removes handler', function() {
      var handler = function() {};
      var unsubscribe = Funky.WebSocket.subscribe(testChannel, handler);

      // Unsubscribe using returned function
      unsubscribe();

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.indexOf(testChannel) === -1).toBe(true);
    });

    FunkyTests.it('unsubscribe removes from queue', function() {
      Funky.WebSocket.subscribe(testChannel);
      Funky.WebSocket.unsubscribe(testChannel);

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.indexOf(testChannel) === -1).toBe(true);
    });

    FunkyTests.it('unsubscribe with specific handler keeps channel if other handlers exist', function() {
      var handler1 = function() {};
      var handler2 = function() {};
      var channel = 'multi-handler-' + Date.now();

      Funky.WebSocket.subscribe(channel, handler1);
      Funky.WebSocket.subscribe(channel, handler2);

      // Remove only handler1
      Funky.WebSocket.unsubscribe(channel, handler1);

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.indexOf(channel) !== -1).toBe(true);

      // Cleanup
      Funky.WebSocket.unsubscribe(channel);
    });

    FunkyTests.it('subscribe handles empty channel gracefully', function() {
      var threw = false;
      try {
        Funky.WebSocket.subscribe('');
        Funky.WebSocket.subscribe(null);
        Funky.WebSocket.subscribe(undefined);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('unsubscribe handles empty channel gracefully', function() {
      var threw = false;
      try {
        Funky.WebSocket.unsubscribe('');
        Funky.WebSocket.unsubscribe(null);
        Funky.WebSocket.unsubscribe(undefined);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('multiple subscriptions are tracked', function() {
      Funky.WebSocket.subscribe(testChannel + '-1');
      Funky.WebSocket.subscribe(testChannel + '-2');
      Funky.WebSocket.subscribe(testChannel + '-3');

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.indexOf(testChannel + '-1') !== -1).toBe(true);
      expect(subs.indexOf(testChannel + '-2') !== -1).toBe(true);
      expect(subs.indexOf(testChannel + '-3') !== -1).toBe(true);

      // Cleanup
      Funky.WebSocket.unsubscribe(testChannel + '-1');
      Funky.WebSocket.unsubscribe(testChannel + '-2');
      Funky.WebSocket.unsubscribe(testChannel + '-3');
    });
  });

  FunkyTests.describe('Event Handlers', function() {
    FunkyTests.it('on registers handler without error', function() {
      var threw = false;
      var handler = function() {};
      try {
        Funky.WebSocket.on('test_event', handler);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);

      // Cleanup
      Funky.WebSocket.off('test_event', handler);
    });

    FunkyTests.it('off removes specific handler', function() {
      var threw = false;
      var handler = function() {};
      Funky.WebSocket.on('test_event', handler);

      try {
        Funky.WebSocket.off('test_event', handler);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('off without handler removes all for event type', function() {
      var threw = false;
      var handler1 = function() {};
      var handler2 = function() {};

      Funky.WebSocket.on('test_event', handler1);
      Funky.WebSocket.on('test_event', handler2);

      try {
        Funky.WebSocket.off('test_event');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('handler is tracked in debug state', function() {
      var handler = function() {};
      Funky.WebSocket.on('custom_event', handler);

      var debug = Funky.WebSocket.getDebugState();
      expect(debug.handlerTypes.indexOf('custom_event') !== -1).toBe(true);

      // Cleanup
      Funky.WebSocket.off('custom_event', handler);
    });
  });

  FunkyTests.describe('Configuration', function() {
    FunkyTests.it('configure accepts options object', function() {
      var threw = false;
      try {
        Funky.WebSocket.configure({
          debug: false
        });
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);

      // Restore
      Funky.WebSocket.configure({
        debug: true
      });
    });

    FunkyTests.it('configure accepts empty object', function() {
      var threw = false;
      try {
        Funky.WebSocket.configure({});
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  FunkyTests.describe('Send Method (Offline)', function() {
    FunkyTests.it('send returns false when not connected', function() {
      var result = Funky.WebSocket.send('test', { data: 'value' });
      expect(result).toBe(false);
    });

    FunkyTests.it('send handles missing data', function() {
      var threw = false;
      try {
        Funky.WebSocket.send('test');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  FunkyTests.describe('Disconnect Method', function() {
    FunkyTests.it('disconnect does not throw when already disconnected', function() {
      var threw = false;
      try {
        Funky.WebSocket.disconnect();
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('disconnect accepts code and reason', function() {
      var threw = false;
      try {
        Funky.WebSocket.disconnect(1000, 'Test disconnect');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('state is disconnected after disconnect', function() {
      Funky.WebSocket.disconnect();
      var state = Funky.WebSocket.getState();
      expect(state).toBe('disconnected');
    });
  });

  FunkyTests.describe('DOM Events', function() {
    FunkyTests.it('dispatches status change DOM event', function(done) {
      var received = false;

      var handler = function(e) {
        if (e.detail && e.detail.status === 'disconnected') {
          received = true;
        }
      };

      document.addEventListener('funky.ws.status', handler);

      // Trigger disconnect which should dispatch event
      Funky.WebSocket.disconnect();

      setTimeout(function() {
        document.removeEventListener('funky.ws.status', handler);
        expect(received).toBe(true);
        done();
      }, 50);
    });
  });

  FunkyTests.describe('Reconnection State', function() {
    FunkyTests.it('reconnectAttempts starts at 0', function() {
      var debug = Funky.WebSocket.getDebugState();
      expect(debug.reconnectAttempts).toBe(0);
    });

    FunkyTests.it('disconnect resets reconnect attempts', function() {
      Funky.WebSocket.disconnect();
      var debug = Funky.WebSocket.getDebugState();
      expect(debug.reconnectAttempts).toBe(0);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  FunkyTests.describe('Error handling', function() {
    FunkyTests.it('on handles null event type gracefully', function() {
      expect(function() {
        Funky.WebSocket.on(null, function() {});
      }).not.toThrow();
    });

    FunkyTests.it('on handles undefined event type gracefully', function() {
      expect(function() {
        Funky.WebSocket.on(undefined, function() {});
      }).not.toThrow();
    });

    FunkyTests.it('on handles null handler gracefully', function() {
      expect(function() {
        Funky.WebSocket.on('test', null);
      }).not.toThrow();
    });

    FunkyTests.it('off handles null event type gracefully', function() {
      expect(function() {
        Funky.WebSocket.off(null);
      }).not.toThrow();
    });

    FunkyTests.it('off handles non-existent handler gracefully', function() {
      expect(function() {
        Funky.WebSocket.off('non_existent_event', function() {});
      }).not.toThrow();
    });

    FunkyTests.it('send handles null type gracefully', function() {
      expect(function() {
        Funky.WebSocket.send(null, {});
      }).not.toThrow();
    });

    FunkyTests.it('send handles undefined data gracefully', function() {
      expect(function() {
        Funky.WebSocket.send('test', undefined);
      }).not.toThrow();
    });

    FunkyTests.it('configure handles null gracefully', function() {
      expect(function() {
        Funky.WebSocket.configure(null);
      }).not.toThrow();
    });

    FunkyTests.it('configure handles undefined gracefully', function() {
      expect(function() {
        Funky.WebSocket.configure(undefined);
      }).not.toThrow();
    });

    FunkyTests.it('connect handles errors gracefully', function() {
      expect(function() {
        Funky.WebSocket.connect();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // EDGE CASES TESTS
  // =========================================================================
  FunkyTests.describe('Edge cases', function() {
    FunkyTests.it('handles many channel subscriptions', function() {
      var channels = [];
      for (var i = 0; i < 50; i++) {
        var channel = 'test-channel-' + i + '-' + Date.now();
        channels.push(channel);
        Funky.WebSocket.subscribe(channel);
      }

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.length >= 50).toBe(true);

      // Cleanup
      channels.forEach(function(ch) {
        Funky.WebSocket.unsubscribe(ch);
      });
    });

    FunkyTests.it('handles special characters in channel name', function() {
      var channel = 'test-channel-日本語-' + Date.now();
      Funky.WebSocket.subscribe(channel);

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.indexOf(channel) !== -1).toBe(true);

      Funky.WebSocket.unsubscribe(channel);
    });

    FunkyTests.it('handles duplicate subscription silently', function() {
      var channel = 'duplicate-channel-' + Date.now();

      Funky.WebSocket.subscribe(channel);
      Funky.WebSocket.subscribe(channel);
      Funky.WebSocket.subscribe(channel);

      var subs = Funky.WebSocket.getSubscriptions();
      var count = subs.filter(function(s) { return s === channel; }).length;
      // Should only have one entry
      expect(count).toBe(1);

      Funky.WebSocket.unsubscribe(channel);
    });

    FunkyTests.it('handles many event handlers', function() {
      var handlers = [];
      for (var i = 0; i < 50; i++) {
        var handler = function() {};
        handlers.push(handler);
        Funky.WebSocket.on('mass_event', handler);
      }

      var debug = Funky.WebSocket.getDebugState();
      expect(debug.handlerTypes.indexOf('mass_event') !== -1).toBe(true);

      // Cleanup
      handlers.forEach(function(h) {
        Funky.WebSocket.off('mass_event', h);
      });
    });

    FunkyTests.it('handles very long channel name', function() {
      var channel = 'channel-' + 'a'.repeat(500);
      expect(function() {
        Funky.WebSocket.subscribe(channel);
        Funky.WebSocket.unsubscribe(channel);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // CLEANUP TESTS
  // =========================================================================
  FunkyTests.describe('Cleanup', function() {
    FunkyTests.it('disconnect can be called multiple times', function() {
      expect(function() {
        Funky.WebSocket.disconnect();
        Funky.WebSocket.disconnect();
        Funky.WebSocket.disconnect();
      }).not.toThrow();
    });

    FunkyTests.it('unsubscribe all clears all channels', function() {
      var channel1 = 'cleanup-channel-1-' + Date.now();
      var channel2 = 'cleanup-channel-2-' + Date.now();

      Funky.WebSocket.subscribe(channel1);
      Funky.WebSocket.subscribe(channel2);

      Funky.WebSocket.unsubscribe(channel1);
      Funky.WebSocket.unsubscribe(channel2);

      var subs = Funky.WebSocket.getSubscriptions();
      expect(subs.indexOf(channel1) === -1).toBe(true);
      expect(subs.indexOf(channel2) === -1).toBe(true);
    });

    FunkyTests.it('off removes all handlers for event type', function() {
      var handler1 = function() {};
      var handler2 = function() {};

      Funky.WebSocket.on('cleanup_event', handler1);
      Funky.WebSocket.on('cleanup_event', handler2);

      Funky.WebSocket.off('cleanup_event');

      var debug = Funky.WebSocket.getDebugState();
      expect(debug.handlerTypes.indexOf('cleanup_event') === -1).toBe(true);
    });
  });

  // =========================================================================
  // STATE VERIFICATION TESTS
  // =========================================================================
  FunkyTests.describe('State verification', function() {
    FunkyTests.it('getState returns valid state string', function() {
      var state = Funky.WebSocket.getState();
      var validStates = ['disconnected', 'connecting', 'connected', 'reconnecting'];
      expect(validStates.indexOf(state) !== -1).toBe(true);
    });

    FunkyTests.it('isConnected returns consistent boolean', function() {
      var connected1 = Funky.WebSocket.isConnected();
      var connected2 = Funky.WebSocket.isConnected();
      expect(connected1).toBe(connected2);
    });

    FunkyTests.it('debug state structure is consistent', function() {
      var debug = Funky.WebSocket.getDebugState();

      expect(typeof debug.status).toBe('string');
      expect(typeof debug.reconnectAttempts).toBe('number');
      expect(Array.isArray(debug.channels)).toBe(true);
      expect(Array.isArray(debug.handlerTypes)).toBe(true);
    });

    FunkyTests.it('subscription list is accurate', function() {
      var testChannel = 'state-verify-' + Date.now();

      Funky.WebSocket.subscribe(testChannel);
      var subs1 = Funky.WebSocket.getSubscriptions();
      expect(subs1.indexOf(testChannel) !== -1).toBe(true);

      Funky.WebSocket.unsubscribe(testChannel);
      var subs2 = Funky.WebSocket.getSubscriptions();
      expect(subs2.indexOf(testChannel) === -1).toBe(true);
    });
  });

  // =========================================================================
  // INPUT VALIDATION TESTS
  // =========================================================================
  FunkyTests.describe('Input validation', function() {
    FunkyTests.it('subscribe handles number as channel', function() {
      expect(function() {
        Funky.WebSocket.subscribe(12345);
      }).not.toThrow();
    });

    FunkyTests.it('subscribe handles object as channel gracefully', function() {
      expect(function() {
        Funky.WebSocket.subscribe({ name: 'test' });
      }).not.toThrow();
    });

    FunkyTests.it('configure handles invalid options gracefully', function() {
      expect(function() {
        Funky.WebSocket.configure({
          unknownOption: true,
          anotherUnknown: 'value'
        });
      }).not.toThrow();
    });

    FunkyTests.it('send handles complex data object', function() {
      var result = Funky.WebSocket.send('test', {
        nested: {
          deep: {
            value: [1, 2, 3]
          }
        }
      });
      expect(result).toBe(false); // Not connected
    });

    FunkyTests.it('disconnect handles invalid code gracefully', function() {
      expect(function() {
        Funky.WebSocket.disconnect('not-a-number', 'reason');
      }).not.toThrow();
    });
  });
});
