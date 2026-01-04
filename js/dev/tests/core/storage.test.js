/**
 * Funky.Storage Tests
 *
 * Tests for localStorage management utilities.
 */

describe('Funky.Core.Storage', function() {

    var Storage = Funky.Storage;

    afterEach(function() {
        // Clear all funky_ prefixed items
        Storage.clear();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Storage')).toBe(true);
        });

        it('has get method', function() {
            expect(typeof Storage.get).toBe('function');
        });

        it('has set method', function() {
            expect(typeof Storage.set).toBe('function');
        });

        it('has remove method', function() {
            expect(typeof Storage.remove).toBe('function');
        });

    });

    describe('set() and get()', function() {

        it('stores and retrieves string', function() {
            Storage.set('testString', 'hello');
            expect(Storage.get('testString')).toBe('hello');
        });

        it('stores and retrieves number', function() {
            Storage.set('testNumber', 42);
            expect(Storage.get('testNumber')).toBe(42);
        });

        it('stores and retrieves boolean', function() {
            Storage.set('testBool', true);
            expect(Storage.get('testBool')).toBe(true);
        });

        it('stores and retrieves object', function() {
            Storage.set('testObject', { name: 'test', value: 123 });
            expect(Storage.get('testObject')).toEqual({ name: 'test', value: 123 });
        });

        it('stores and retrieves array', function() {
            Storage.set('testArray', [1, 2, 3]);
            expect(Storage.get('testArray')).toEqual([1, 2, 3]);
        });

        it('stores and retrieves null', function() {
            Storage.set('testNull', null);
            expect(Storage.get('testNull')).toBeNull();
        });

        it('returns defaultValue for non-existent key', function() {
            expect(Storage.get('nonExistent', 'default')).toBe('default');
        });

        it('returns undefined default for non-existent key', function() {
            expect(Storage.get('nonExistent')).toBeUndefined();
        });

    });

    describe('setRaw() and getRaw()', function() {

        it('stores raw string without JSON encoding', function() {
            Storage.setRaw('rawTest', 'hello world');

            // Should be stored as-is, not JSON encoded
            var rawValue = localStorage.getItem('funky_rawTest');
            expect(rawValue).toBe('hello world');
        });

        it('retrieves raw string without JSON parsing', function() {
            localStorage.setItem('funky_rawTest2', 'raw string');
            expect(Storage.getRaw('rawTest2')).toBe('raw string');
        });

        it('returns defaultValue for non-existent raw key', function() {
            expect(Storage.getRaw('nonExistent', 'default')).toBe('default');
        });

    });

    describe('remove()', function() {

        it('removes existing key', function() {
            Storage.set('toRemove', 'value');
            expect(Storage.get('toRemove')).toBe('value');

            Storage.remove('toRemove');
            expect(Storage.get('toRemove')).toBeUndefined();
        });

        it('does not throw for non-existent key', function() {
            expect(function() {
                Storage.remove('nonExistent');
            }).not.toThrow();
        });

    });

    describe('has()', function() {

        it('returns true for existing key', function() {
            Storage.set('exists', 'value');
            expect(Storage.has('exists')).toBe(true);
        });

        it('returns false for non-existent key', function() {
            expect(Storage.has('doesNotExist')).toBe(false);
        });

    });

    describe('keys()', function() {

        it('returns array of keys', function() {
            Storage.set('key1', 'value1');
            Storage.set('key2', 'value2');

            var keys = Storage.keys();
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
        });

        it('filters by sub-prefix', function() {
            Storage.set('prefs_theme', 'dark');
            Storage.set('prefs_font', 'large');
            Storage.set('other_key', 'value');

            var prefsKeys = Storage.keys('prefs_');
            expect(prefsKeys).toContain('prefs_theme');
            expect(prefsKeys).toContain('prefs_font');
            expect(prefsKeys).not.toContain('other_key');
        });

        it('returns empty array when no keys', function() {
            var keys = Storage.keys();
            expect(Array.isArray(keys)).toBe(true);
        });

    });

    describe('clear()', function() {

        it('clears all storage keys', function() {
            Storage.set('clear1', 'value1');
            Storage.set('clear2', 'value2');

            Storage.clear();

            expect(Storage.get('clear1')).toBeUndefined();
            expect(Storage.get('clear2')).toBeUndefined();
        });

        it('clears only keys with sub-prefix', function() {
            Storage.set('prefs_keep', 'keep');
            Storage.set('other_remove', 'remove');

            Storage.clear('other_');

            expect(Storage.get('prefs_keep')).toBe('keep');
            expect(Storage.get('other_remove')).toBeUndefined();
        });

        it('does not affect non-funky keys', function() {
            localStorage.setItem('external_key', 'external');
            Storage.set('internal', 'internal');

            Storage.clear();

            expect(localStorage.getItem('external_key')).toBe('external');
            localStorage.removeItem('external_key');
        });

    });

    describe('Namespace prefix', function() {

        it('uses funky_ prefix for all keys', function() {
            Storage.set('prefixTest', 'value');

            expect(localStorage.getItem('funky_prefixTest')).toBeDefined();
            expect(localStorage.getItem('prefixTest')).toBeNull();
        });

    });

    describe('Error handling', function() {

        it('handles JSON parse errors gracefully', function() {
            localStorage.setItem('funky_badJson', '{invalid json}');

            // Should return default instead of throwing
            expect(Storage.get('badJson', 'default')).toBe('default');
        });

    });

    describe('Complex data types', function() {

        it('handles nested objects', function() {
            var complex = {
                level1: {
                    level2: {
                        level3: 'deep value'
                    }
                }
            };

            Storage.set('nested', complex);
            var retrieved = Storage.get('nested');

            expect(retrieved.level1.level2.level3).toBe('deep value');
        });

        it('handles arrays of objects', function() {
            var items = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];

            Storage.set('items', items);
            var retrieved = Storage.get('items');

            expect(retrieved.length).toBe(2);
            expect(retrieved[0].name).toBe('Item 1');
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('set handles null key gracefully', function() {
            expect(function() {
                Storage.set(null, 'value');
            }).not.toThrow();
        });

        it('set handles undefined key gracefully', function() {
            expect(function() {
                Storage.set(undefined, 'value');
            }).not.toThrow();
        });

        it('get handles null key gracefully', function() {
            var result = Storage.get(null, 'default');
            expect(result).toBe('default');
        });

        it('get handles undefined key gracefully', function() {
            var result = Storage.get(undefined, 'default');
            expect(result).toBe('default');
        });

        it('remove handles null key gracefully', function() {
            expect(function() {
                Storage.remove(null);
            }).not.toThrow();
        });

        it('has handles null key gracefully', function() {
            expect(Storage.has(null)).toBe(false);
        });

        it('handles circular reference in object gracefully', function() {
            var circular = { name: 'test' };
            circular.self = circular;

            // Should either throw or handle gracefully
            var threw = false;
            try {
                Storage.set('circular', circular);
            } catch (e) {
                threw = true;
            }
            // Either behavior is acceptable
            expect(threw || !Storage.has('circular')).toBe(true);
        });

        it('handles corrupted localStorage value gracefully', function() {
            localStorage.setItem('funky_corrupted', '{{invalid');

            // Should return default without throwing
            expect(Storage.get('corrupted', 'fallback')).toBe('fallback');
        });

        it('handles undefined value gracefully', function() {
            Storage.set('undefinedVal', undefined);
            // undefined is not JSON serializable, behavior may vary
            var result = Storage.get('undefinedVal', 'default');
            expect(result === null || result === undefined || result === 'default').toBe(true);
        });

    });

    // =========================================================================
    // EDGE CASE TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('handles empty string key', function() {
            Storage.set('', 'empty key value');
            expect(Storage.get('')).toBe('empty key value');
        });

        it('handles very long key names', function() {
            var longKey = 'a'.repeat(200);
            Storage.set(longKey, 'long key value');
            expect(Storage.get(longKey)).toBe('long key value');
        });

        it('handles special characters in key', function() {
            Storage.set('key-with_special.chars:123', 'special');
            expect(Storage.get('key-with_special.chars:123')).toBe('special');
        });

        it('handles very long string values', function() {
            var longValue = 'x'.repeat(10000);
            Storage.set('longValue', longValue);
            expect(Storage.get('longValue')).toBe(longValue);
        });

        it('handles empty string value', function() {
            Storage.set('emptyString', '');
            expect(Storage.get('emptyString')).toBe('');
        });

        it('handles zero value', function() {
            Storage.set('zero', 0);
            expect(Storage.get('zero')).toBe(0);
        });

        it('handles false value', function() {
            Storage.set('falseBool', false);
            expect(Storage.get('falseBool')).toBe(false);
        });

        it('handles empty object', function() {
            Storage.set('emptyObj', {});
            expect(Storage.get('emptyObj')).toEqual({});
        });

        it('handles empty array', function() {
            Storage.set('emptyArr', []);
            expect(Storage.get('emptyArr')).toEqual([]);
        });

        it('handles Date objects (serialized as strings)', function() {
            var date = new Date('2024-01-15T12:00:00Z');
            Storage.set('date', date);
            // Dates serialize to strings
            var retrieved = Storage.get('date');
            expect(typeof retrieved).toBe('string');
        });

        it('handles Unicode strings', function() {
            var unicode = '日本語テスト 🎉 émoji';
            Storage.set('unicode', unicode);
            expect(Storage.get('unicode')).toBe(unicode);
        });

        it('handles keys with funky_ in name', function() {
            Storage.set('funky_prefix_test', 'value');
            expect(Storage.get('funky_prefix_test')).toBe('value');
        });

        it('overwrites existing value', function() {
            Storage.set('overwrite', 'original');
            Storage.set('overwrite', 'updated');
            expect(Storage.get('overwrite')).toBe('updated');
        });

        it('keys() returns empty array after clear', function() {
            Storage.set('temp1', 'val1');
            Storage.set('temp2', 'val2');
            Storage.clear();
            expect(Storage.keys()).toEqual([]);
        });

    });

    // =========================================================================
    // TYPE PRESERVATION TESTS
    // =========================================================================
    describe('Type preservation', function() {

        it('preserves number type', function() {
            Storage.set('num', 42.5);
            var result = Storage.get('num');
            expect(typeof result).toBe('number');
            expect(result).toBe(42.5);
        });

        it('preserves negative number', function() {
            Storage.set('negative', -123);
            expect(Storage.get('negative')).toBe(-123);
        });

        it('preserves boolean true', function() {
            Storage.set('boolTrue', true);
            expect(Storage.get('boolTrue')).toBe(true);
        });

        it('preserves boolean false', function() {
            Storage.set('boolFalse', false);
            expect(Storage.get('boolFalse')).toBe(false);
        });

        it('preserves null', function() {
            Storage.set('nullVal', null);
            expect(Storage.get('nullVal')).toBeNull();
        });

        it('preserves array structure', function() {
            var arr = [1, 'two', { three: 3 }, [4, 5]];
            Storage.set('array', arr);
            expect(Storage.get('array')).toEqual(arr);
        });

        it('preserves nested object structure', function() {
            var obj = {
                a: { b: { c: { d: 'deep' } } },
                arr: [1, 2, 3],
                num: 42
            };
            Storage.set('nested', obj);
            expect(Storage.get('nested')).toEqual(obj);
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    describe('Cleanup', function() {

        it('clear removes only funky-prefixed keys', function() {
            localStorage.setItem('external_test', 'external');
            Storage.set('internal', 'internal');

            Storage.clear();

            expect(localStorage.getItem('external_test')).toBe('external');
            expect(Storage.has('internal')).toBe(false);

            localStorage.removeItem('external_test');
        });

        it('clear with prefix removes only matching keys', function() {
            Storage.set('user_name', 'John');
            Storage.set('user_email', 'john@test.com');
            Storage.set('settings_theme', 'dark');

            Storage.clear('user_');

            expect(Storage.has('user_name')).toBe(false);
            expect(Storage.has('user_email')).toBe(false);
            expect(Storage.has('settings_theme')).toBe(true);
        });

        it('remove cleans up single key', function() {
            Storage.set('toRemove1', 'val1');
            Storage.set('toRemove2', 'val2');

            Storage.remove('toRemove1');

            expect(Storage.has('toRemove1')).toBe(false);
            expect(Storage.has('toRemove2')).toBe(true);
        });

    });

    // =========================================================================
    // BOUNDARY TESTS
    // =========================================================================
    describe('Boundary conditions', function() {

        it('handles large number', function() {
            var large = Number.MAX_SAFE_INTEGER;
            Storage.set('largeNum', large);
            expect(Storage.get('largeNum')).toBe(large);
        });

        it('handles small number', function() {
            var small = Number.MIN_SAFE_INTEGER;
            Storage.set('smallNum', small);
            expect(Storage.get('smallNum')).toBe(small);
        });

        it('handles floating point precision', function() {
            var float = 0.1 + 0.2; // 0.30000000000000004
            Storage.set('float', float);
            expect(Storage.get('float')).toBe(float);
        });

        it('handles large array', function() {
            var arr = [];
            for (var i = 0; i < 1000; i++) {
                arr.push({ id: i, name: 'Item ' + i });
            }
            Storage.set('largeArray', arr);
            var retrieved = Storage.get('largeArray');
            expect(retrieved.length).toBe(1000);
            expect(retrieved[500].name).toBe('Item 500');
        });

    });

});
