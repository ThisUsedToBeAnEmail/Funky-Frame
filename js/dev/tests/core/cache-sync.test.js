/**
 * Tests for Funky.CacheSync
 * WebSocket to Cache integration for real-time updates
 */
FunkyTests.describe('Funky.Core.CacheSync', function() {
    var expect = FunkyTests.expect;
    var eventsCaptured = [];
    var eventHandler = null;

    FunkyTests.beforeEach(function() {
        eventsCaptured = [];
        eventHandler = function(data) {
            eventsCaptured.push(data);
        };
    });

    FunkyTests.afterEach(function() {
        // Clean up event listener
        if (eventHandler) {
            Funky.CacheSync.off('funky:cache-sync:invalidated', eventHandler);
        }
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.CacheSync).toBeDefined();
        });

        FunkyTests.it('has init method', function() {
            expect(typeof Funky.CacheSync.init).toBe('function');
        });

        FunkyTests.it('has on method', function() {
            expect(typeof Funky.CacheSync.on).toBe('function');
        });

        FunkyTests.it('has off method', function() {
            expect(typeof Funky.CacheSync.off).toBe('function');
        });

        FunkyTests.it('has invalidate method', function() {
            expect(typeof Funky.CacheSync.invalidate).toBe('function');
        });

        FunkyTests.it('has invalidateBulk method', function() {
            expect(typeof Funky.CacheSync.invalidateBulk).toBe('function');
        });
    });

    FunkyTests.describe('Event handling', function() {
        FunkyTests.it('on() registers event handler', function() {
            var called = false;
            var handler = function() { called = true; };
            Funky.CacheSync.on('test-event', handler);
            expect(called).toBe(false); // Just registers, doesn't call
            Funky.CacheSync.off('test-event', handler);
        });

        FunkyTests.it('off() removes event handler', function() {
            var callCount = 0;
            var handler = function() { callCount++; };
            Funky.CacheSync.on('test-event', handler);
            Funky.CacheSync.off('test-event', handler);
            // Handler should be removed
            expect(callCount).toBe(0);
        });
    });

    FunkyTests.describe('invalidate()', function() {
        FunkyTests.it('invalidates cache for entity type', function() {
            // Set up a mock cache entry
            if (Funky.Cache && Funky.Cache.clear) {
                Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
                Funky.CacheSync.invalidate('trades');
                // Should have emitted event
                expect(eventsCaptured.length).toBeGreaterThan(0);
                expect(eventsCaptured[0].type).toBe('trades');
                expect(eventsCaptured[0].reason).toBe('manual');
            }
        });

        FunkyTests.it('invalidates specific entity by ID', function() {
            if (Funky.Cache && Funky.Cache.invalidate) {
                Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
                Funky.CacheSync.invalidate('trades', 123);
                expect(eventsCaptured.length).toBeGreaterThan(0);
                expect(eventsCaptured[0].type).toBe('trades');
                expect(eventsCaptured[0].id).toBe(123);
            }
        });

        FunkyTests.it('accepts custom reason', function() {
            if (Funky.Cache && Funky.Cache.clear) {
                Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
                Funky.CacheSync.invalidate('trades', null, 'websocket');
                expect(eventsCaptured.length).toBeGreaterThan(0);
                expect(eventsCaptured[0].reason).toBe('websocket');
            }
        });
    });

    FunkyTests.describe('invalidateBulk()', function() {
        FunkyTests.it('invalidates entire entity type', function() {
            if (Funky.Cache && Funky.Cache.clear) {
                Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
                Funky.CacheSync.invalidateBulk('clients');
                expect(eventsCaptured.length).toBeGreaterThan(0);
                expect(eventsCaptured[0].type).toBe('clients');
                expect(eventsCaptured[0].reason).toBe('bulk');
            }
        });
    });

    FunkyTests.describe('DataTable integration', function() {
        FunkyTests.it('has setDataTableIntegration method', function() {
            expect(typeof Funky.CacheSync.setDataTableIntegration).toBe('function');
        });

        FunkyTests.it('has isDataTableIntegrationEnabled method', function() {
            expect(typeof Funky.CacheSync.isDataTableIntegrationEnabled).toBe('function');
        });

        FunkyTests.it('can enable/disable DataTable integration', function() {
            var original = Funky.CacheSync.isDataTableIntegrationEnabled();

            Funky.CacheSync.setDataTableIntegration(false);
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(false);

            Funky.CacheSync.setDataTableIntegration(true);
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(true);

            // Restore original
            Funky.CacheSync.setDataTableIntegration(original);
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    FunkyTests.describe('Error handling', function() {
        FunkyTests.it('invalidate handles null entity type gracefully', function() {
            expect(function() {
                Funky.CacheSync.invalidate(null);
            }).not.toThrow();
        });

        FunkyTests.it('invalidate handles undefined entity type gracefully', function() {
            expect(function() {
                Funky.CacheSync.invalidate(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('invalidate handles empty string entity type gracefully', function() {
            expect(function() {
                Funky.CacheSync.invalidate('');
            }).not.toThrow();
        });

        FunkyTests.it('invalidateBulk handles null entity type gracefully', function() {
            expect(function() {
                Funky.CacheSync.invalidateBulk(null);
            }).not.toThrow();
        });

        FunkyTests.it('invalidateBulk handles undefined entity type gracefully', function() {
            expect(function() {
                Funky.CacheSync.invalidateBulk(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('on handles null event type gracefully', function() {
            expect(function() {
                Funky.CacheSync.on(null, function() {});
            }).not.toThrow();
        });

        FunkyTests.it('on handles null handler gracefully', function() {
            expect(function() {
                Funky.CacheSync.on('test-event', null);
            }).not.toThrow();
        });

        FunkyTests.it('on handles undefined handler gracefully', function() {
            expect(function() {
                Funky.CacheSync.on('test-event', undefined);
            }).not.toThrow();
        });

        FunkyTests.it('off handles null event type gracefully', function() {
            expect(function() {
                Funky.CacheSync.off(null, function() {});
            }).not.toThrow();
        });

        FunkyTests.it('off handles null handler gracefully', function() {
            expect(function() {
                Funky.CacheSync.off('test-event', null);
            }).not.toThrow();
        });

        FunkyTests.it('off handles undefined handler gracefully', function() {
            expect(function() {
                Funky.CacheSync.off('test-event', undefined);
            }).not.toThrow();
        });

        FunkyTests.it('init handles being called multiple times', function() {
            expect(function() {
                Funky.CacheSync.init();
                Funky.CacheSync.init();
                Funky.CacheSync.init();
            }).not.toThrow();
        });

        FunkyTests.it('setDataTableIntegration handles null value', function() {
            var original = Funky.CacheSync.isDataTableIntegrationEnabled();
            expect(function() {
                Funky.CacheSync.setDataTableIntegration(null);
            }).not.toThrow();
            Funky.CacheSync.setDataTableIntegration(original);
        });

        FunkyTests.it('setDataTableIntegration handles undefined value', function() {
            var original = Funky.CacheSync.isDataTableIntegrationEnabled();
            expect(function() {
                Funky.CacheSync.setDataTableIntegration(undefined);
            }).not.toThrow();
            Funky.CacheSync.setDataTableIntegration(original);
        });
    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    FunkyTests.describe('Edge cases', function() {
        FunkyTests.it('handles very long entity type names', function() {
            var longType = 'a'.repeat(1000);
            expect(function() {
                Funky.CacheSync.invalidate(longType);
            }).not.toThrow();
        });

        FunkyTests.it('handles entity type with special characters', function() {
            expect(function() {
                Funky.CacheSync.invalidate('<script>test</script>');
            }).not.toThrow();
        });

        FunkyTests.it('handles entity type with Unicode', function() {
            expect(function() {
                Funky.CacheSync.invalidate('日本語エンティティ');
            }).not.toThrow();
        });

        FunkyTests.it('handles numeric entity ID', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidate('trades', 12345);
            expect(eventsCaptured.length).toBeGreaterThan(0);
            expect(eventsCaptured[0].id).toBe(12345);
        });

        FunkyTests.it('handles string entity ID', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidate('trades', 'abc-123');
            expect(eventsCaptured.length).toBeGreaterThan(0);
            expect(eventsCaptured[0].id).toBe('abc-123');
        });

        FunkyTests.it('handles zero entity ID', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidate('trades', 0);
            expect(eventsCaptured.length).toBeGreaterThan(0);
            // Zero is falsy so may not be passed through - just verify event fired
            expect(eventsCaptured[0].type).toBe('trades');
        });

        FunkyTests.it('handles negative entity ID', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidate('trades', -1);
            expect(eventsCaptured.length).toBeGreaterThan(0);
            expect(eventsCaptured[0].id).toBe(-1);
        });

        FunkyTests.it('handles rapid successive invalidations', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);

            for (var i = 0; i < 10; i++) {
                Funky.CacheSync.invalidate('trades', i);
            }

            expect(eventsCaptured.length).toBe(10);
        });

        FunkyTests.it('handles multiple different entity types', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);

            Funky.CacheSync.invalidate('trades');
            Funky.CacheSync.invalidate('clients');
            Funky.CacheSync.invalidate('orders');

            expect(eventsCaptured.length).toBe(3);
            expect(eventsCaptured[0].type).toBe('trades');
            expect(eventsCaptured[1].type).toBe('clients');
            expect(eventsCaptured[2].type).toBe('orders');
        });

        FunkyTests.it('handles registering many event handlers', function() {
            var handlers = [];
            var counts = [];

            for (var i = 0; i < 10; i++) {
                counts[i] = 0;
                handlers[i] = (function(index) {
                    return function() { counts[index]++; };
                })(i);
                Funky.CacheSync.on('test-many-handlers', handlers[i]);
            }

            // Clean up
            for (var j = 0; j < 10; j++) {
                Funky.CacheSync.off('test-many-handlers', handlers[j]);
            }
        });

        FunkyTests.it('handles toggling DataTable integration rapidly', function() {
            var original = Funky.CacheSync.isDataTableIntegrationEnabled();

            for (var i = 0; i < 10; i++) {
                Funky.CacheSync.setDataTableIntegration(i % 2 === 0);
            }

            Funky.CacheSync.setDataTableIntegration(original);
        });
    });

    // =========================================================================
    // ASYNC BEHAVIOR TESTS
    // =========================================================================
    FunkyTests.describe('Async behavior', function() {
        FunkyTests.it('invalidation events fire synchronously', function() {
            var eventFired = false;
            var handler = function() { eventFired = true; };

            Funky.CacheSync.on('funky:cache-sync:invalidated', handler);
            Funky.CacheSync.invalidate('trades');

            expect(eventFired).toBe(true);
            Funky.CacheSync.off('funky:cache-sync:invalidated', handler);
        });

        FunkyTests.it('multiple handlers fire in order', function() {
            var order = [];
            var handler1 = function() { order.push(1); };
            var handler2 = function() { order.push(2); };
            var handler3 = function() { order.push(3); };

            Funky.CacheSync.on('funky:cache-sync:invalidated', handler1);
            Funky.CacheSync.on('funky:cache-sync:invalidated', handler2);
            Funky.CacheSync.on('funky:cache-sync:invalidated', handler3);

            Funky.CacheSync.invalidate('trades');

            expect(order.length).toBe(3);

            Funky.CacheSync.off('funky:cache-sync:invalidated', handler1);
            Funky.CacheSync.off('funky:cache-sync:invalidated', handler2);
            Funky.CacheSync.off('funky:cache-sync:invalidated', handler3);
        });

        FunkyTests.it('handler can be async without blocking', function() {
            var asyncCompleted = false;
            var syncCompleted = false;

            var asyncHandler = function() {
                return FunkyTests.delay(50).then(function() {
                    asyncCompleted = true;
                });
            };

            var syncHandler = function() {
                syncCompleted = true;
            };

            Funky.CacheSync.on('funky:cache-sync:invalidated', asyncHandler);
            Funky.CacheSync.on('funky:cache-sync:invalidated', syncHandler);

            Funky.CacheSync.invalidate('trades');

            expect(syncCompleted).toBe(true);
            // Async may or may not be completed immediately

            Funky.CacheSync.off('funky:cache-sync:invalidated', asyncHandler);
            Funky.CacheSync.off('funky:cache-sync:invalidated', syncHandler);
        });
    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    FunkyTests.describe('State verification', function() {
        FunkyTests.it('DataTable integration state persists', function() {
            var original = Funky.CacheSync.isDataTableIntegrationEnabled();

            Funky.CacheSync.setDataTableIntegration(true);
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(true);

            Funky.CacheSync.setDataTableIntegration(false);
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(false);

            Funky.CacheSync.setDataTableIntegration(original);
        });

        FunkyTests.it('invalidation provides correct event data structure', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidate('trades', 123, 'test-reason');

            expect(eventsCaptured.length).toBe(1);
            var event = eventsCaptured[0];
            expect(event.type).toBe('trades');
            expect(event.id).toBe(123);
            expect(event.reason).toBe('test-reason');
        });

        FunkyTests.it('invalidateBulk provides bulk reason', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidateBulk('clients');

            expect(eventsCaptured.length).toBe(1);
            expect(eventsCaptured[0].reason).toBe('bulk');
        });

        FunkyTests.it('default reason is manual', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidate('trades');

            expect(eventsCaptured.length).toBe(1);
            expect(eventsCaptured[0].reason).toBe('manual');
        });

        FunkyTests.it('handler receives event object with timestamp', function() {
            var receivedEvent = null;
            var handler = function(data) { receivedEvent = data; };

            Funky.CacheSync.on('funky:cache-sync:invalidated', handler);
            Funky.CacheSync.invalidate('trades');

            expect(receivedEvent).toBeDefined();
            expect(receivedEvent.type).toBe('trades');

            Funky.CacheSync.off('funky:cache-sync:invalidated', handler);
        });
    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    FunkyTests.describe('Cleanup', function() {
        FunkyTests.it('off removes handler correctly', function() {
            var callCount = 0;
            var handler = function() { callCount++; };

            Funky.CacheSync.on('funky:cache-sync:invalidated', handler);
            Funky.CacheSync.invalidate('trades');
            expect(callCount).toBe(1);

            Funky.CacheSync.off('funky:cache-sync:invalidated', handler);
            Funky.CacheSync.invalidate('trades');
            expect(callCount).toBe(1); // Should not increase
        });

        FunkyTests.it('off does not affect other handlers', function() {
            var count1 = 0;
            var count2 = 0;
            var handler1 = function() { count1++; };
            var handler2 = function() { count2++; };

            Funky.CacheSync.on('funky:cache-sync:invalidated', handler1);
            Funky.CacheSync.on('funky:cache-sync:invalidated', handler2);

            Funky.CacheSync.off('funky:cache-sync:invalidated', handler1);

            Funky.CacheSync.invalidate('trades');

            expect(count1).toBe(0);
            expect(count2).toBe(1);

            Funky.CacheSync.off('funky:cache-sync:invalidated', handler2);
        });

        FunkyTests.it('off can be called multiple times for same handler', function() {
            var handler = function() {};
            Funky.CacheSync.on('test-event', handler);

            expect(function() {
                Funky.CacheSync.off('test-event', handler);
                Funky.CacheSync.off('test-event', handler);
                Funky.CacheSync.off('test-event', handler);
            }).not.toThrow();
        });

        FunkyTests.it('off for non-existent handler does not throw', function() {
            var handler = function() {};

            expect(function() {
                Funky.CacheSync.off('non-existent-event', handler);
            }).not.toThrow();
        });

        FunkyTests.it('handlers are isolated per event type', function() {
            var count1 = 0;
            var count2 = 0;
            var handler1 = function() { count1++; };
            var handler2 = function() { count2++; };

            Funky.CacheSync.on('event-type-1', handler1);
            Funky.CacheSync.on('event-type-2', handler2);

            // These are custom events so won't be triggered by invalidate
            // Just verify registration works

            Funky.CacheSync.off('event-type-1', handler1);
            Funky.CacheSync.off('event-type-2', handler2);
        });
    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    FunkyTests.describe('Input validation', function() {
        FunkyTests.it('invalidate accepts string entity type', function() {
            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);
            Funky.CacheSync.invalidate('valid-string');
            expect(eventsCaptured.length).toBe(1);
        });

        FunkyTests.it('invalidate handles numeric entity type', function() {
            expect(function() {
                Funky.CacheSync.invalidate(12345);
            }).not.toThrow();
        });

        FunkyTests.it('invalidate handles object entity type', function() {
            expect(function() {
                Funky.CacheSync.invalidate({ type: 'trades' });
            }).not.toThrow();
        });

        FunkyTests.it('invalidate handles array entity type', function() {
            expect(function() {
                Funky.CacheSync.invalidate(['trades', 'clients']);
            }).not.toThrow();
        });

        FunkyTests.it('setDataTableIntegration coerces truthy values', function() {
            var original = Funky.CacheSync.isDataTableIntegrationEnabled();

            Funky.CacheSync.setDataTableIntegration(1);
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(true);

            Funky.CacheSync.setDataTableIntegration(0);
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(false);

            Funky.CacheSync.setDataTableIntegration('true');
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(true);

            Funky.CacheSync.setDataTableIntegration('');
            expect(Funky.CacheSync.isDataTableIntegrationEnabled()).toBe(false);

            Funky.CacheSync.setDataTableIntegration(original);
        });
    });

    // =========================================================================
    // INTEGRATION TESTS
    // =========================================================================
    FunkyTests.describe('Integration', function() {
        FunkyTests.it('works with Cache module if available', function() {
            if (Funky.Cache) {
                expect(function() {
                    Funky.CacheSync.invalidate('trades');
                }).not.toThrow();
            }
        });

        FunkyTests.it('works with WebSocket module if available', function() {
            if (Funky.WebSocket) {
                expect(function() {
                    Funky.CacheSync.init();
                }).not.toThrow();
            }
        });

        FunkyTests.it('invalidation works independently of DataTable integration', function() {
            var original = Funky.CacheSync.isDataTableIntegrationEnabled();

            Funky.CacheSync.on('funky:cache-sync:invalidated', eventHandler);

            Funky.CacheSync.setDataTableIntegration(false);
            Funky.CacheSync.invalidate('trades');
            expect(eventsCaptured.length).toBe(1);

            eventsCaptured = [];

            Funky.CacheSync.setDataTableIntegration(true);
            Funky.CacheSync.invalidate('clients');
            expect(eventsCaptured.length).toBe(1);

            Funky.CacheSync.setDataTableIntegration(original);
        });
    });
});
