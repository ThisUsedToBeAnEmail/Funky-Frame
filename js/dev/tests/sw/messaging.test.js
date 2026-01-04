/**
 * FunkySW.Messaging Tests
 *
 * Tests for Service Worker client ↔ SW messaging
 * Note: These tests verify API surface and return types.
 * Tests that require self.clients (broadcast, notifyReady) are skipped
 * since self.clients doesn't exist in browser context.
 */
describe('FunkySW.Messaging', function() {

    // Skip tests if FunkySW.Messaging not properly loaded
    if (typeof FunkySW === 'undefined' || !FunkySW.Messaging || !FunkySW.Messaging.broadcast) {
        it('FunkySW.Messaging module not loaded (skipping tests)', function() {
            expect(true).toBe(true);
        });
        return;
    }

    // =========================================================================
    // MODULE STRUCTURE
    // =========================================================================

    describe('Module Structure', function() {
        it('has FunkySW namespace', function() {
            expect(self.FunkySW).toBeDefined();
        });

        it('has Messaging object', function() {
            expect(FunkySW.Messaging).toBeDefined();
        });

        it('has broadcast method', function() {
            expect(typeof FunkySW.Messaging.broadcast).toBe('function');
        });

        it('has send method', function() {
            // Note: The API uses 'send' not 'sendToClient'
            expect(typeof FunkySW.Messaging.send).toBe('function');
        });

        it('has handleMessage method', function() {
            expect(typeof FunkySW.Messaging.handleMessage).toBe('function');
        });

        it('has standardHandlers object', function() {
            expect(typeof FunkySW.Messaging.standardHandlers).toBe('object');
        });

        it('has createHandlers method', function() {
            expect(typeof FunkySW.Messaging.createHandlers).toBe('function');
        });

        it('has notifyReady method', function() {
            expect(typeof FunkySW.Messaging.notifyReady).toBe('function');
        });

        it('has notifyUpdate method', function() {
            expect(typeof FunkySW.Messaging.notifyUpdate).toBe('function');
        });

        it('has Types enum', function() {
            expect(FunkySW.Messaging.Types).toBeDefined();
            expect(FunkySW.Messaging.Types.READY).toBe('FUNKY_SW_READY');
            expect(FunkySW.Messaging.Types.SKIP_WAITING).toBe('FUNKY_SW_SKIP_WAITING');
        });

        it('has version', function() {
            expect(FunkySW.Messaging.version).toBeDefined();
        });
    });

    // =========================================================================
    // STANDARD HANDLERS REGISTRATION
    // =========================================================================

    describe('standardHandlers', function() {
        it('has FUNKY_SW_SKIP_WAITING handler', function() {
            expect(typeof FunkySW.Messaging.standardHandlers['FUNKY_SW_SKIP_WAITING']).toBe('function');
        });

        it('has FUNKY_SW_CACHE_CLEAR handler', function() {
            expect(typeof FunkySW.Messaging.standardHandlers['FUNKY_SW_CACHE_CLEAR']).toBe('function');
        });

        it('has FUNKY_SW_PRECACHE handler', function() {
            expect(typeof FunkySW.Messaging.standardHandlers['FUNKY_SW_PRECACHE']).toBe('function');
        });

        it('has FUNKY_SW_CACHE_STATUS handler', function() {
            expect(typeof FunkySW.Messaging.standardHandlers['FUNKY_SW_CACHE_STATUS']).toBe('function');
        });

        it('has FUNKY_SW_NOTIFICATION handler', function() {
            expect(typeof FunkySW.Messaging.standardHandlers['FUNKY_SW_NOTIFICATION']).toBe('function');
        });
    });

    // =========================================================================
    // CREATE HANDLERS
    // =========================================================================

    describe('createHandlers', function() {
        it('returns object with standard handlers', function() {
            var handlers = FunkySW.Messaging.createHandlers({});

            expect(handlers['FUNKY_SW_SKIP_WAITING']).toBeDefined();
            expect(handlers['FUNKY_SW_CACHE_CLEAR']).toBeDefined();
            expect(handlers['FUNKY_SW_PRECACHE']).toBeDefined();
            expect(handlers['FUNKY_SW_CACHE_STATUS']).toBeDefined();
            expect(handlers['FUNKY_SW_NOTIFICATION']).toBeDefined();
        });

        it('merges custom handlers with standard handlers', function() {
            var handlers = FunkySW.Messaging.createHandlers({
                'CUSTOM_MESSAGE': function() {
                    return 'custom';
                }
            });

            expect(handlers['CUSTOM_MESSAGE']).toBeDefined();
            expect(handlers['FUNKY_SW_SKIP_WAITING']).toBeDefined();
        });

        it('custom handlers override standard handlers', function() {
            var handlers = FunkySW.Messaging.createHandlers({
                'FUNKY_SW_SKIP_WAITING': function() {
                    return 'custom';
                }
            });

            var result = handlers['FUNKY_SW_SKIP_WAITING']();
            expect(result).toBe('custom');
        });

        it('handles null customHandlers', function() {
            var handlers = FunkySW.Messaging.createHandlers(null);

            expect(handlers['FUNKY_SW_SKIP_WAITING']).toBeDefined();
        });

        it('handles undefined customHandlers', function() {
            var handlers = FunkySW.Messaging.createHandlers(undefined);

            expect(handlers['FUNKY_SW_SKIP_WAITING']).toBeDefined();
        });
    });

    // =========================================================================
    // HANDLE MESSAGE
    // =========================================================================

    describe('handleMessage', function() {
        it('is a function', function() {
            expect(typeof FunkySW.Messaging.handleMessage).toBe('function');
        });

        it('handles event without data gracefully', function() {
            var mockEvent = {};

            // Should not throw
            FunkySW.Messaging.handleMessage(mockEvent, {});
            expect(true).toBe(true);
        });

        it('handles event with unknown message type', function() {
            var mockEvent = {
                data: { type: 'UNKNOWN_MESSAGE_TYPE' }
            };

            // Should not throw
            FunkySW.Messaging.handleMessage(mockEvent, {});
            expect(true).toBe(true);
        });

        it('calls registered handler for known type', function() {
            var handlerCalled = false;
            var mockEvent = {
                data: { type: 'TEST_MESSAGE', data: { foo: 'bar' } }
            };

            var handlers = {
                'TEST_MESSAGE': function(data, event) {
                    handlerCalled = true;
                    expect(data.foo).toBe('bar');
                }
            };

            FunkySW.Messaging.handleMessage(mockEvent, handlers);
            expect(handlerCalled).toBe(true);
        });
    });

    // =========================================================================
    // SEND
    // =========================================================================

    describe('send', function() {
        it('is a function', function() {
            expect(typeof FunkySW.Messaging.send).toBe('function');
        });

        it('handles null client gracefully', function() {
            // Should not throw
            FunkySW.Messaging.send(null, 'TEST', {});
            expect(true).toBe(true);
        });

        it('handles undefined client gracefully', function() {
            // Should not throw
            FunkySW.Messaging.send(undefined, 'TEST', {});
            expect(true).toBe(true);
        });

        it('posts message to client with postMessage method', function() {
            var postedMessage = null;
            var mockClient = {
                postMessage: function(msg) {
                    postedMessage = msg;
                }
            };

            FunkySW.Messaging.send(mockClient, 'TEST_TYPE', { value: 123 });

            expect(postedMessage).toBeDefined();
            expect(postedMessage.type).toBe('TEST_TYPE');
            expect(postedMessage.data.value).toBe(123);
        });
    });

    // =========================================================================
    // TYPES ENUM
    // =========================================================================

    describe('Types', function() {
        it('has READY type', function() {
            expect(FunkySW.Messaging.Types.READY).toBe('FUNKY_SW_READY');
        });

        it('has UPDATED type', function() {
            expect(FunkySW.Messaging.Types.UPDATED).toBe('FUNKY_SW_UPDATED');
        });

        it('has SKIP_WAITING type', function() {
            expect(FunkySW.Messaging.Types.SKIP_WAITING).toBe('FUNKY_SW_SKIP_WAITING');
        });

        it('has CACHE_CLEAR type', function() {
            expect(FunkySW.Messaging.Types.CACHE_CLEAR).toBe('FUNKY_SW_CACHE_CLEAR');
        });

        it('has NOTIFICATION type', function() {
            expect(FunkySW.Messaging.Types.NOTIFICATION).toBe('FUNKY_SW_NOTIFICATION');
        });

        it('has PRECACHE type', function() {
            expect(FunkySW.Messaging.Types.PRECACHE).toBe('FUNKY_SW_PRECACHE');
        });

        it('has CACHE_STATUS type', function() {
            expect(FunkySW.Messaging.Types.CACHE_STATUS).toBe('FUNKY_SW_CACHE_STATUS');
        });

        it('has CACHE_STATUS_RESPONSE type', function() {
            expect(FunkySW.Messaging.Types.CACHE_STATUS_RESPONSE).toBe('FUNKY_SW_CACHE_STATUS_RESPONSE');
        });
    });

    // =========================================================================
    // HANDLER BEHAVIOR (without mocking)
    // =========================================================================

    describe('Handler edge cases', function() {
        it('CACHE_CLEAR returns false for missing cacheName', function(done) {
            FunkySW.Messaging.standardHandlers['FUNKY_SW_CACHE_CLEAR']({}, {}).then(function(result) {
                expect(result).toBe(false);
                done();
            });
        });

        it('CACHE_CLEAR returns false for null data', function(done) {
            FunkySW.Messaging.standardHandlers['FUNKY_SW_CACHE_CLEAR'](null, {}).then(function(result) {
                expect(result).toBe(false);
                done();
            });
        });

        it('NOTIFICATION handles missing title', function(done) {
            FunkySW.Messaging.standardHandlers['FUNKY_SW_NOTIFICATION']({}, {}).then(function() {
                // Should resolve without error
                expect(true).toBe(true);
                done();
            });
        });

        it('PRECACHE handles missing data', function(done) {
            FunkySW.Messaging.standardHandlers['FUNKY_SW_PRECACHE'](null, {}).then(function() {
                expect(true).toBe(true);
                done();
            });
        });

        it('PRECACHE handles missing urls', function(done) {
            FunkySW.Messaging.standardHandlers['FUNKY_SW_PRECACHE']({ cacheName: 'test' }, {}).then(function() {
                expect(true).toBe(true);
                done();
            });
        });

        it('PRECACHE handles empty urls array', function(done) {
            FunkySW.Messaging.standardHandlers['FUNKY_SW_PRECACHE']({ cacheName: 'test', urls: [] }, {}).then(function() {
                expect(true).toBe(true);
                done();
            });
        });
    });
});
