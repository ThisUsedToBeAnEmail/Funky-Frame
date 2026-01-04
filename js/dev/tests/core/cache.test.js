/**
 * Funky.Cache Tests
 *
 * Tests for the in-memory data cache.
 */

describe('Funky.Core.Cache', function() {

    var Cache = Funky.Cache;

    afterEach(function() {
        Cache.clearAll();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Cache')).toBe(true);
        });

        it('has get method', function() {
            expect(typeof Cache.get).toBe('function');
        });

        it('has set method', function() {
            expect(typeof Cache.set).toBe('function');
        });

        it('has getList method', function() {
            expect(typeof Cache.getList).toBe('function');
        });

        it('has setList method', function() {
            expect(typeof Cache.setList).toBe('function');
        });

    });

    describe('set() and get()', function() {

        it('stores and retrieves item', function() {
            Cache.set('trades', 123, { id: 123, name: 'Trade 1' });

            var result = Cache.get('trades', 123);
            expect(result).toEqual({ id: 123, name: 'Trade 1' });
        });

        it('returns null for non-existent item', function() {
            var result = Cache.get('trades', 999);
            expect(result).toBeNull();
        });

        it('returns null for non-existent type', function() {
            var result = Cache.get('nonexistent', 123);
            expect(result).toBeNull();
        });

        it('overwrites existing item', function() {
            Cache.set('trades', 123, { id: 123, version: 1 });
            Cache.set('trades', 123, { id: 123, version: 2 });

            var result = Cache.get('trades', 123);
            expect(result.version).toBe(2);
        });

    });

    describe('setList() and getList()', function() {

        it('stores and retrieves list', function() {
            var items = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];

            Cache.setList('clients', items);

            var result = Cache.getList('clients');
            expect(result).toEqual(items);
        });

        it('returns null for non-existent list', function() {
            var result = Cache.getList('nonexistent');
            expect(result).toBeNull();
        });

        it('populates byId cache from list', function() {
            var items = [
                { id: 1, name: 'Client 1' },
                { id: 2, name: 'Client 2' }
            ];

            Cache.setList('clients', items);

            expect(Cache.get('clients', 1)).toEqual({ id: 1, name: 'Client 1' });
            expect(Cache.get('clients', 2)).toEqual({ id: 2, name: 'Client 2' });
        });

    });

    describe('has() and hasList()', function() {

        it('has returns true for existing item', function() {
            Cache.set('trades', 123, { id: 123 });
            expect(Cache.has('trades', 123)).toBe(true);
        });

        it('has returns false for non-existent item', function() {
            expect(Cache.has('trades', 999)).toBe(false);
        });

        it('hasList returns true for existing list', function() {
            Cache.setList('clients', []);
            expect(Cache.hasList('clients')).toBe(true);
        });

        it('hasList returns false for non-existent list', function() {
            expect(Cache.hasList('nonexistent')).toBe(false);
        });

    });

    describe('invalidate()', function() {

        it('removes single item', function() {
            Cache.set('trades', 123, { id: 123 });
            Cache.invalidate('trades', 123);

            expect(Cache.get('trades', 123)).toBeNull();
        });

        it('removes item from list', function() {
            Cache.setList('trades', [
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ]);

            Cache.invalidate('trades', 2);

            var list = Cache.getList('trades');
            expect(list.length).toBe(2);
            expect(list.find(function(item) { return item.id === 2; })).toBeUndefined();
        });

    });

    describe('clear() and clearAll()', function() {

        it('clear removes all items for type', function() {
            Cache.set('trades', 1, { id: 1 });
            Cache.set('trades', 2, { id: 2 });
            Cache.setList('trades', [{ id: 1 }, { id: 2 }]);

            Cache.clear('trades');

            expect(Cache.get('trades', 1)).toBeNull();
            expect(Cache.get('trades', 2)).toBeNull();
            expect(Cache.getList('trades')).toBeNull();
        });

        it('clearAll removes everything', function() {
            Cache.set('trades', 1, { id: 1 });
            Cache.set('clients', 1, { id: 1 });
            Cache.setList('users', [{ id: 1 }]);

            Cache.clearAll();

            expect(Cache.get('trades', 1)).toBeNull();
            expect(Cache.get('clients', 1)).toBeNull();
            expect(Cache.getList('users')).toBeNull();
        });

    });

    describe('configure()', function() {

        it('sets custom TTL for type', function() {
            Cache.configure('shortLived', { ttl: 100 });

            var stats = Cache.stats();
            // Configure creates type store on first set
            Cache.set('shortLived', 1, { id: 1 });
            stats = Cache.stats();

            expect(stats.shortLived.ttl).toBe(100);
        });

        it('sets custom maxEntries for type', function() {
            Cache.configure('limited', { maxEntries: 10 });
            Cache.set('limited', 1, { id: 1 });

            var stats = Cache.stats();
            expect(stats.limited.maxEntries).toBe(10);
        });

    });

    describe('stats()', function() {

        it('returns cache statistics', function() {
            Cache.set('trades', 1, { id: 1 });
            Cache.set('trades', 2, { id: 2 });
            Cache.setList('clients', [{ id: 1 }]);

            var stats = Cache.stats();

            expect(stats.trades).toBeDefined();
            expect(stats.trades.itemCount).toBe(2);
            expect(stats.clients.hasList).toBe(true);
        });

    });

    describe('Event listeners', function() {

        it('emits updated event on set', function() {
            var receivedEvent = null;

            Cache.on('updated', function(data) {
                receivedEvent = data;
            });

            Cache.set('trades', 123, { id: 123 });

            expect(receivedEvent).toBeDefined();
            expect(receivedEvent.type).toBe('trades');
            expect(receivedEvent.id).toBe(123);
        });

        it('emits invalidated event on invalidate', function() {
            var receivedEvent = null;

            Cache.on('invalidated', function(data) {
                receivedEvent = data;
            });

            Cache.set('trades', 123, { id: 123 });
            Cache.invalidate('trades', 123);

            expect(receivedEvent).toBeDefined();
            expect(receivedEvent.type).toBe('trades');
            expect(receivedEvent.id).toBe(123);
        });

        it('emits cleared event on clear', function() {
            var receivedEvent = null;

            Cache.on('cleared', function(data) {
                receivedEvent = data;
            });

            Cache.set('trades', 1, { id: 1 });
            Cache.clear('trades');

            expect(receivedEvent).toBeDefined();
            expect(receivedEvent.type).toBe('trades');
        });

    });

    describe('TTL expiration', function() {

        it('returns null for expired items', function() {
            Cache.configure('expiring', { ttl: 50 });
            Cache.set('expiring', 1, { id: 1 });

            // Verify item exists initially
            expect(Cache.get('expiring', 1)).toBeDefined();

            // Wait for expiration
            return FunkyTests.delay(100).then(function() {
                expect(Cache.get('expiring', 1)).toBeNull();
            });
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('get handles null type gracefully', function() {
            expect(Cache.get(null, 1)).toBeNull();
        });

        it('get handles undefined type gracefully', function() {
            expect(Cache.get(undefined, 1)).toBeNull();
        });

        it('get handles null id gracefully', function() {
            Cache.set('test', 1, { id: 1 });
            expect(Cache.get('test', null)).toBeNull();
        });

        it('set handles null type gracefully', function() {
            expect(function() {
                Cache.set(null, 1, { id: 1 });
            }).not.toThrow();
        });

        it('set handles null id gracefully', function() {
            expect(function() {
                Cache.set('test', null, { id: 1 });
            }).not.toThrow();
        });

        it('set handles undefined data gracefully', function() {
            Cache.set('test', 1, undefined);
            var result = Cache.get('test', 1);
            expect(result === undefined || result === null).toBe(true);
        });

        it('setList handles null type gracefully', function() {
            expect(function() {
                Cache.setList(null, [{ id: 1 }]);
            }).not.toThrow();
        });

        it('setList handles empty array', function() {
            Cache.setList('empty', []);
            expect(Cache.getList('empty')).toEqual([]);
        });

        it('setList handles null items gracefully', function() {
            expect(function() {
                Cache.setList('test', null);
            }).not.toThrow();
        });

        it('invalidate handles non-existent type gracefully', function() {
            expect(function() {
                Cache.invalidate('nonexistent', 1);
            }).not.toThrow();
        });

        it('invalidate handles non-existent id gracefully', function() {
            Cache.set('test', 1, { id: 1 });
            expect(function() {
                Cache.invalidate('test', 999);
            }).not.toThrow();
        });

        it('clear handles non-existent type gracefully', function() {
            expect(function() {
                Cache.clear('nonexistent');
            }).not.toThrow();
        });

        it('configure handles invalid options gracefully', function() {
            expect(function() {
                Cache.configure('test', null);
            }).not.toThrow();
        });

    });

    // =========================================================================
    // EDGE CASE TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('stores and retrieves item with string id', function() {
            Cache.set('trades', 'abc123', { id: 'abc123', name: 'Trade ABC' });
            var result = Cache.get('trades', 'abc123');
            expect(result.name).toBe('Trade ABC');
        });

        it('handles items without id property in list', function() {
            var items = [
                { name: 'Item 1' },
                { name: 'Item 2' }
            ];
            Cache.setList('noIds', items);
            expect(Cache.getList('noIds')).toEqual(items);
        });

        it('handles items with numeric string ids', function() {
            Cache.set('test', '123', { id: '123' });
            expect(Cache.get('test', '123')).toEqual({ id: '123' });
            // Note: JS object keys coerce numbers to strings, so 123 and '123' access the same key
            expect(Cache.get('test', 123)).toEqual({ id: '123' });
        });

        it('handles complex nested objects', function() {
            var complex = {
                nested: {
                    deep: {
                        value: 42,
                        array: [1, 2, 3]
                    }
                }
            };
            Cache.set('test', 1, complex);
            var result = Cache.get('test', 1);
            expect(result.nested.deep.value).toBe(42);
            expect(result.nested.deep.array).toEqual([1, 2, 3]);
        });

        it('handles arrays as data', function() {
            var arr = [1, 2, 3, 4, 5];
            Cache.set('test', 1, arr);
            expect(Cache.get('test', 1)).toEqual(arr);
        });

        it('handles large lists', function() {
            var items = [];
            for (var i = 0; i < 1000; i++) {
                items.push({ id: i, name: 'Item ' + i });
            }
            Cache.setList('large', items);
            expect(Cache.getList('large').length).toBe(1000);
            expect(Cache.get('large', 500).name).toBe('Item 500');
        });

        it('handles rapid consecutive sets', function() {
            for (var i = 0; i < 100; i++) {
                Cache.set('rapid', i, { id: i, value: i * 2 });
            }
            expect(Cache.get('rapid', 50).value).toBe(100);
            expect(Cache.get('rapid', 99).value).toBe(198);
        });

        it('handles multiple types simultaneously', function() {
            Cache.set('trades', 1, { id: 1, type: 'trade' });
            Cache.set('clients', 1, { id: 1, type: 'client' });
            Cache.set('users', 1, { id: 1, type: 'user' });

            expect(Cache.get('trades', 1).type).toBe('trade');
            expect(Cache.get('clients', 1).type).toBe('client');
            expect(Cache.get('users', 1).type).toBe('user');
        });

        it('setList populates byId cache using standard id field', function() {
            var items = [
                { id: 'a', name: 'Item A' },
                { id: 'b', name: 'Item B' }
            ];
            Cache.setList('custom', items);
            expect(Cache.get('custom', 'a').name).toBe('Item A');
            expect(Cache.get('custom', 'b').name).toBe('Item B');
        });

        it('preserves data types through cache', function() {
            var data = {
                num: 42,
                str: 'hello',
                bool: true,
                nil: null,
                arr: [1, 2, 3],
                obj: { key: 'value' }
            };
            Cache.set('types', 1, data);
            var result = Cache.get('types', 1);

            expect(typeof result.num).toBe('number');
            expect(typeof result.str).toBe('string');
            expect(typeof result.bool).toBe('boolean');
            expect(result.nil).toBeNull();
            expect(Array.isArray(result.arr)).toBe(true);
            expect(typeof result.obj).toBe('object');
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    describe('Cleanup', function() {

        it('clearAll removes all types', function() {
            Cache.set('type1', 1, { id: 1 });
            Cache.set('type2', 1, { id: 1 });
            Cache.set('type3', 1, { id: 1 });
            Cache.setList('type4', [{ id: 1 }]);

            Cache.clearAll();

            expect(Cache.get('type1', 1)).toBeNull();
            expect(Cache.get('type2', 1)).toBeNull();
            expect(Cache.get('type3', 1)).toBeNull();
            expect(Cache.getList('type4')).toBeNull();
        });

        it('invalidate removes from both byId and list', function() {
            Cache.setList('test', [{ id: 1 }, { id: 2 }, { id: 3 }]);

            Cache.invalidate('test', 2);

            expect(Cache.get('test', 2)).toBeNull();
            var list = Cache.getList('test');
            expect(list.length).toBe(2);
            expect(list.find(function(i) { return i.id === 2; })).toBeUndefined();
        });

        it('clear preserves other types', function() {
            Cache.set('keep', 1, { id: 1 });
            Cache.set('remove', 1, { id: 1 });

            Cache.clear('remove');

            expect(Cache.get('keep', 1)).toEqual({ id: 1 });
            expect(Cache.get('remove', 1)).toBeNull();
        });

        it('off removes event listener', function() {
            var count = 0;
            var handler = function() { count++; };

            Cache.on('updated', handler);
            Cache.set('test', 1, { id: 1 });
            expect(count).toBe(1);

            Cache.off('updated', handler);
            Cache.set('test', 2, { id: 2 });
            expect(count).toBe(1);
        });

    });

    // =========================================================================
    // CONCURRENT ACCESS TESTS
    // =========================================================================
    describe('Concurrent access', function() {

        it('handles simultaneous reads and writes', function() {
            // Write
            for (var i = 0; i < 50; i++) {
                Cache.set('concurrent', i, { id: i });
            }

            // Read while writing more
            var readResults = [];
            for (var j = 0; j < 50; j++) {
                Cache.set('concurrent', j + 50, { id: j + 50 });
                readResults.push(Cache.get('concurrent', j));
            }

            // All reads should succeed
            readResults.forEach(function(result, index) {
                expect(result).toEqual({ id: index });
            });
        });

        it('handles invalidation during iteration', function() {
            Cache.setList('iter', [
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ]);

            var list = Cache.getList('iter');
            Cache.invalidate('iter', 2);

            // Original list reference still valid
            expect(list.length).toBe(3);
            // But updated list reflects change
            expect(Cache.getList('iter').length).toBe(2);
        });

    });

    // =========================================================================
    // MAX ENTRIES TESTS
    // =========================================================================
    describe('Max entries limit', function() {

        it('evicts oldest items when limit reached', function() {
            Cache.configure('limited', { maxEntries: 5 });

            for (var i = 1; i <= 10; i++) {
                Cache.set('limited', i, { id: i });
            }

            // First 5 items should be evicted
            expect(Cache.get('limited', 1)).toBeNull();
            expect(Cache.get('limited', 5)).toBeNull();

            // Last 5 items should remain
            expect(Cache.get('limited', 6)).toEqual({ id: 6 });
            expect(Cache.get('limited', 10)).toEqual({ id: 10 });
        });

    });

});
