/**
 * Funky.Registry Tests
 * 
 * Tests for ConfigRegistry and InstanceRegistry
 */
describe('Funky.Registry', function() {
    var Registry;

    beforeAll(function() {
        Registry = Funky.Registry;
    });

    describe('Module Registration', function() {
        it('is registered on Funky namespace', function() {
            expect(Funky.Registry).toBeDefined();
        });

        it('has create method', function() {
            expect(typeof Funky.Registry.create).toBe('function');
        });

        it('has createInstanceRegistry method', function() {
            expect(typeof Funky.Registry.createInstanceRegistry).toBe('function');
        });

        it('has version', function() {
            expect(Funky.Registry.version).toBeDefined();
        });
    });

    // =========================================================================
    // CONFIG REGISTRY
    // =========================================================================

    describe('ConfigRegistry', function() {
        var registry;

        beforeEach(function() {
            registry = Registry.create('test');
        });

        describe('Basic Operations', function() {
            it('creates a registry instance', function() {
                expect(registry).toBeDefined();
                expect(typeof registry.register).toBe('function');
            });

            it('registers items with register()', function() {
                var result = registry.register('item1', { name: 'Test' });
                expect(result).toBe(true);
            });

            it('retrieves items with get()', function() {
                registry.register('item1', { name: 'Test' });
                var item = registry.get('item1');
                expect(item).toEqual({ name: 'Test' });
            });

            it('returns null for unknown keys', function() {
                var item = registry.get('nonexistent');
                expect(item).toBe(null);
            });

            it('checks existence with has()', function() {
                registry.register('item1', { name: 'Test' });
                expect(registry.has('item1')).toBe(true);
                expect(registry.has('nonexistent')).toBe(false);
            });

            it('lists all keys with list()', function() {
                registry.register('item1', { name: 'One' });
                registry.register('item2', { name: 'Two' });
                var keys = registry.list();
                expect(keys).toContain('item1');
                expect(keys).toContain('item2');
                expect(keys.length).toBe(2);
            });

            it('returns all items with all()', function() {
                registry.register('item1', { name: 'One' });
                registry.register('item2', { name: 'Two' });
                var items = registry.all();
                expect(items.item1).toEqual({ name: 'One' });
                expect(items.item2).toEqual({ name: 'Two' });
            });

            it('removes items with unregister()', function() {
                registry.register('item1', { name: 'Test' });
                expect(registry.has('item1')).toBe(true);
                
                var result = registry.unregister('item1');
                expect(result).toBe(true);
                expect(registry.has('item1')).toBe(false);
            });

            it('returns false when unregistering nonexistent key', function() {
                var result = registry.unregister('nonexistent');
                expect(result).toBe(false);
            });

            it('clears all items with clear()', function() {
                registry.register('item1', { name: 'One' });
                registry.register('item2', { name: 'Two' });
                expect(registry.count()).toBe(2);
                
                registry.clear();
                expect(registry.count()).toBe(0);
            });

            it('counts items with count()', function() {
                expect(registry.count()).toBe(0);
                registry.register('item1', { name: 'One' });
                expect(registry.count()).toBe(1);
                registry.register('item2', { name: 'Two' });
                expect(registry.count()).toBe(2);
            });

            it('iterates with forEach()', function() {
                registry.register('item1', { name: 'One' });
                registry.register('item2', { name: 'Two' });
                
                var collected = [];
                registry.forEach(function(item, key) {
                    collected.push({ key: key, item: item });
                });
                
                expect(collected.length).toBe(2);
            });

            it('supports non-object values', function() {
                registry.register('str', 'hello');
                registry.register('num', 42);
                registry.register('arr', [1, 2, 3]);
                
                expect(registry.get('str')).toBe('hello');
                expect(registry.get('num')).toBe(42);
                expect(registry.get('arr')).toEqual([1, 2, 3]);
            });

            it('rejects invalid keys', function() {
                var result1 = registry.register('', { name: 'Test' });
                var result2 = registry.register(null, { name: 'Test' });
                var result3 = registry.register(123, { name: 'Test' });
                
                expect(result1).toBe(false);
                expect(result2).toBe(false);
                expect(result3).toBe(false);
            });
        });

        describe('Defaults', function() {
            it('merges defaults with registered items', function() {
                var reg = Registry.create('test-defaults', {
                    defaults: { volume: 1.0, loop: false }
                });
                
                reg.register('sound1', { file: 'test.mp3' });
                var item = reg.get('sound1');
                
                expect(item.file).toBe('test.mp3');
                expect(item.volume).toBe(1.0);
                expect(item.loop).toBe(false);
            });

            it('item properties override defaults', function() {
                var reg = Registry.create('test-defaults', {
                    defaults: { volume: 1.0, loop: false }
                });
                
                reg.register('sound1', { file: 'test.mp3', volume: 0.5 });
                var item = reg.get('sound1');
                
                expect(item.volume).toBe(0.5);
                expect(item.loop).toBe(false);
            });

            it('does not merge defaults with non-object values', function() {
                var reg = Registry.create('test-defaults', {
                    defaults: { volume: 1.0 }
                });
                
                reg.register('str', 'hello');
                expect(reg.get('str')).toBe('hello');
            });
        });

        describe('Validation', function() {
            it('calls validate function on register', function() {
                var validateCalled = false;
                var reg = Registry.create('test-validate', {
                    validate: function(item) {
                        validateCalled = true;
                        return true;
                    }
                });
                
                reg.register('item1', { name: 'Test' });
                expect(validateCalled).toBe(true);
            });

            it('rejects invalid items', function() {
                var reg = Registry.create('test-validate', {
                    validate: function(item) {
                        return item && item.file; // Require file property
                    }
                });
                
                var result1 = reg.register('valid', { file: 'test.mp3' });
                var result2 = reg.register('invalid', { name: 'No file' });
                
                expect(result1).toBe(true);
                expect(result2).toBe(false);
                expect(reg.has('valid')).toBe(true);
                expect(reg.has('invalid')).toBe(false);
            });
        });

        describe('Callbacks', function() {
            it('calls onRegister when item added', function() {
                var callbackData = null;
                var reg = Registry.create('test-callback', {
                    onRegister: function(key, item) {
                        callbackData = { key: key, item: item };
                    }
                });
                
                reg.register('item1', { name: 'Test' });
                
                expect(callbackData).not.toBe(null);
                expect(callbackData.key).toBe('item1');
                expect(callbackData.item.name).toBe('Test');
            });

            it('calls onUnregister when item removed', function() {
                var unregisteredKey = null;
                var reg = Registry.create('test-callback', {
                    onUnregister: function(key) {
                        unregisteredKey = key;
                    }
                });
                
                reg.register('item1', { name: 'Test' });
                reg.unregister('item1');
                
                expect(unregisteredKey).toBe('item1');
            });

            it('calls onUnregister for each item during clear()', function() {
                var unregisteredKeys = [];
                var reg = Registry.create('test-callback', {
                    onUnregister: function(key) {
                        unregisteredKeys.push(key);
                    }
                });
                
                reg.register('item1', { name: 'One' });
                reg.register('item2', { name: 'Two' });
                reg.clear();
                
                expect(unregisteredKeys).toContain('item1');
                expect(unregisteredKeys).toContain('item2');
            });
        });
    });

    // =========================================================================
    // INSTANCE REGISTRY
    // =========================================================================

    describe('InstanceRegistry', function() {
        var instances;

        beforeEach(function() {
            instances = Registry.createInstanceRegistry('TestComponent');
        });

        describe('Basic Operations', function() {
            it('creates an instance registry', function() {
                expect(instances).toBeDefined();
                expect(typeof instances.register).toBe('function');
            });

            it('registers instances', function() {
                var obj = { id: '1', container: document.createElement('div') };
                var result = instances.register('inst-1', obj);
                expect(result).toBe(true);
            });

            it('retrieves by id with get()', function() {
                var obj = { id: '1', container: document.createElement('div') };
                instances.register('inst-1', obj);
                
                var retrieved = instances.get('inst-1');
                expect(retrieved).toBe(obj);
            });

            it('returns null for unknown id', function() {
                var retrieved = instances.get('nonexistent');
                expect(retrieved).toBe(null);
            });

            it('checks existence with has()', function() {
                var obj = { id: '1' };
                instances.register('inst-1', obj);
                
                expect(instances.has('inst-1')).toBe(true);
                expect(instances.has('nonexistent')).toBe(false);
            });

            it('unregisters instances', function() {
                var obj = { id: '1' };
                instances.register('inst-1', obj);
                expect(instances.has('inst-1')).toBe(true);
                
                var result = instances.unregister('inst-1');
                expect(result).toBe(true);
                expect(instances.has('inst-1')).toBe(false);
            });

            it('returns false when unregistering nonexistent id', function() {
                var result = instances.unregister('nonexistent');
                expect(result).toBe(false);
            });

            it('lists all ids with list()', function() {
                instances.register('inst-1', { id: '1' });
                instances.register('inst-2', { id: '2' });
                
                var ids = instances.list();
                expect(ids).toContain('inst-1');
                expect(ids).toContain('inst-2');
            });

            it('rejects invalid id', function() {
                var result1 = instances.register('', { id: '1' });
                var result2 = instances.register(null, { id: '1' });
                
                expect(result1).toBe(false);
                expect(result2).toBe(false);
            });

            it('rejects null instance', function() {
                var result = instances.register('inst-1', null);
                expect(result).toBe(false);
            });
        });

        describe('Element Lookup', function() {
            it('finds instance by container element', function() {
                var container = document.createElement('div');
                var obj = { id: '1', container: container };
                instances.register('inst-1', obj);
                
                var found = instances.getByElement(container);
                expect(found).toBe(obj);
            });

            it('finds instance by el property', function() {
                var el = document.createElement('div');
                var obj = { id: '1', el: el };
                instances.register('inst-1', obj);
                
                var found = instances.getByElement(el);
                expect(found).toBe(obj);
            });

            it('finds instance by element property', function() {
                var element = document.createElement('div');
                var obj = { id: '1', element: element };
                instances.register('inst-1', obj);
                
                var found = instances.getByElement(element);
                expect(found).toBe(obj);
            });

            it('unwraps Funky.Dom wrapper for search', function() {
                var rawEl = document.createElement('div');
                var wrapper = { el: rawEl }; // Simulate Funky.Dom wrapper
                var obj = { id: '1', container: rawEl };
                instances.register('inst-1', obj);
                
                var found = instances.getByElement(wrapper);
                expect(found).toBe(obj);
            });

            it('unwraps instance container if wrapped', function() {
                var rawEl = document.createElement('div');
                var containerWrapper = { el: rawEl }; // Simulate Funky.Dom wrapper
                var obj = { id: '1', container: containerWrapper };
                instances.register('inst-1', obj);
                
                var found = instances.getByElement(rawEl);
                expect(found).toBe(obj);
            });

            it('returns null if element not found', function() {
                var container = document.createElement('div');
                var otherEl = document.createElement('div');
                instances.register('inst-1', { container: container });
                
                var found = instances.getByElement(otherEl);
                expect(found).toBe(null);
            });

            it('returns null for null element', function() {
                var found = instances.getByElement(null);
                expect(found).toBe(null);
            });
        });

        describe('Bulk Operations', function() {
            it('returns all instances with getAll()', function() {
                var obj1 = { id: '1' };
                var obj2 = { id: '2' };
                instances.register('inst-1', obj1);
                instances.register('inst-2', obj2);
                
                var all = instances.getAll();
                expect(all.length).toBe(2);
                expect(all).toContain(obj1);
                expect(all).toContain(obj2);
            });

            it('counts instances with count()', function() {
                expect(instances.count()).toBe(0);
                instances.register('inst-1', { id: '1' });
                expect(instances.count()).toBe(1);
                instances.register('inst-2', { id: '2' });
                expect(instances.count()).toBe(2);
            });

            it('iterates with forEach()', function() {
                instances.register('inst-1', { id: '1' });
                instances.register('inst-2', { id: '2' });
                
                var collected = [];
                instances.forEach(function(instance, id) {
                    collected.push({ id: id, instance: instance });
                });
                
                expect(collected.length).toBe(2);
            });
        });

        describe('Lifecycle', function() {
            it('destroyAll calls destroy() on each instance', function() {
                var destroyCalls = [];
                var obj1 = { 
                    id: '1', 
                    destroy: function() { destroyCalls.push('1'); }
                };
                var obj2 = { 
                    id: '2', 
                    destroy: function() { destroyCalls.push('2'); }
                };
                
                instances.register('inst-1', obj1);
                instances.register('inst-2', obj2);
                instances.destroyAll();
                
                expect(destroyCalls).toContain('1');
                expect(destroyCalls).toContain('2');
            });

            it('destroyAll clears the registry', function() {
                instances.register('inst-1', { id: '1', destroy: function() {} });
                instances.register('inst-2', { id: '2', destroy: function() {} });
                
                expect(instances.count()).toBe(2);
                instances.destroyAll();
                expect(instances.count()).toBe(0);
            });

            it('handles instances without destroy method', function() {
                var obj1 = { id: '1' }; // No destroy method
                var obj2 = { 
                    id: '2', 
                    destroy: function() {}
                };
                
                instances.register('inst-1', obj1);
                instances.register('inst-2', obj2);
                
                // Should not throw
                expect(function() {
                    instances.destroyAll();
                }).not.toThrow();
                
                expect(instances.count()).toBe(0);
            });

            it('handles errors in destroy gracefully', function() {
                var obj1 = { 
                    id: '1', 
                    destroy: function() { throw new Error('Test error'); }
                };
                var obj2 = { 
                    id: '2', 
                    destroy: function() {}
                };
                
                instances.register('inst-1', obj1);
                instances.register('inst-2', obj2);
                
                // Should not throw, should continue to next instance
                expect(function() {
                    instances.destroyAll();
                }).not.toThrow();
                
                expect(instances.count()).toBe(0);
            });
        });
    });
});
