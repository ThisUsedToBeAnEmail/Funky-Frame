/**
 * Funky.ActionRegistry Tests
 *
 * Tests for the action registry factory used by QuickNav,
 * BulkActions, ContextMenu, and other components.
 */

describe('Funky.Component.ActionRegistry', function() {

    var ActionRegistry = Funky.ActionRegistry;
    var registry;

    afterEach(function() {
        if (registry) {
            registry.clear();
            registry = null;
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('ActionRegistry')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof ActionRegistry.create).toBe('function');
        });

        it('exposes Registry constructor', function() {
            expect(ActionRegistry.Registry).toBeDefined();
            expect(typeof ActionRegistry.Registry).toBe('function');
        });

    });

    describe('Factory', function() {

        it('creates a registry instance', function() {
            registry = ActionRegistry.create();

            expect(registry).toBeDefined();
        });

        it('creates instance with default options', function() {
            registry = ActionRegistry.create();

            // Uses Funky.Registry internally, verify no actions registered
            expect(registry.getAll()).toEqual([]);
        });

        it('creates instance with custom schema', function() {
            registry = ActionRegistry.create({
                schema: { icon: 'fas fa-star', order: 10 }
            });

            expect(registry._schema.icon).toBe('fas fa-star');
            expect(registry._schema.order).toBe(10);
        });

        it('creates instance with callbacks', function() {
            var addCalled = false;

            registry = ActionRegistry.create({
                onAdd: function() { addCalled = true; }
            });

            registry.add({ id: 'test' });

            expect(addCalled).toBe(true);
        });

    });

    describe('add()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
        });

        it('adds an action', function() {
            var result = registry.add({ id: 'action1', label: 'Action 1' });

            expect(result).toBe(true);
            expect(registry.has('action1')).toBe(true);
        });

        it('returns false without id', function() {
            var result = registry.add({ label: 'No ID' });

            expect(result).toBe(false);
        });

        it('returns false for null action', function() {
            var result = registry.add(null);

            expect(result).toBe(false);
        });

        it('merges with schema defaults', function() {
            registry = ActionRegistry.create({
                schema: { icon: 'fas fa-default', order: 25 }
            });

            registry.add({ id: 'test' });

            var action = registry.get('test');
            expect(action.icon).toBe('fas fa-default');
            expect(action.order).toBe(25);
        });

        it('overrides schema with action values', function() {
            registry = ActionRegistry.create({
                schema: { icon: 'fas fa-default' }
            });

            registry.add({ id: 'test', icon: 'fas fa-custom' });

            var action = registry.get('test');
            expect(action.icon).toBe('fas fa-custom');
        });

        it('uses id as label if not provided', function() {
            registry.add({ id: 'my-action' });

            var action = registry.get('my-action');
            expect(action.label).toBe('my-action');
        });

        it('calls onAdd callback', function() {
            var addedAction = null;

            registry = ActionRegistry.create({
                onAdd: function(action) { addedAction = action; }
            });

            registry.add({ id: 'callback-test', label: 'Test' });

            expect(addedAction).not.toBeNull();
            expect(addedAction.id).toBe('callback-test');
        });

    });

    describe('remove()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'to-remove', label: 'To Remove' });
        });

        it('removes an action', function() {
            var result = registry.remove('to-remove');

            expect(result).toBe(true);
            expect(registry.has('to-remove')).toBe(false);
        });

        it('returns false for non-existent action', function() {
            var result = registry.remove('non-existent');

            expect(result).toBe(false);
        });

        it('calls onRemove callback', function() {
            var removedId = null;

            registry = ActionRegistry.create({
                onRemove: function(id) { removedId = id; }
            });

            registry.add({ id: 'test' });
            registry.remove('test');

            expect(removedId).toBe('test');
        });

    });

    describe('update()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'to-update', label: 'Original', order: 10 });
        });

        it('updates an action', function() {
            var result = registry.update('to-update', { label: 'Updated' });

            expect(result).toBe(true);
            expect(registry.get('to-update').label).toBe('Updated');
        });

        it('updates multiple properties', function() {
            registry.update('to-update', { label: 'New Label', order: 99 });

            var action = registry.get('to-update');
            expect(action.label).toBe('New Label');
            expect(action.order).toBe(99);
        });

        it('returns false for non-existent action', function() {
            var result = registry.update('non-existent', { label: 'Test' });

            expect(result).toBe(false);
        });

        it('calls onUpdate callback', function() {
            var updateData = null;

            registry = ActionRegistry.create({
                onUpdate: function(id, updates) { updateData = { id: id, updates: updates }; }
            });

            registry.add({ id: 'test', label: 'Test' });
            registry.update('test', { label: 'Updated' });

            expect(updateData.id).toBe('test');
            expect(updateData.updates.label).toBe('Updated');
        });

    });

    describe('get()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'get-test', label: 'Get Test', icon: 'fas fa-test' });
        });

        it('returns action by ID', function() {
            var action = registry.get('get-test');

            expect(action).not.toBeNull();
            expect(action.id).toBe('get-test');
            expect(action.label).toBe('Get Test');
        });

        it('returns null for non-existent ID', function() {
            var action = registry.get('non-existent');

            expect(action).toBeNull();
        });

    });

    describe('getAll()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'action1', label: 'Action 1' });
            registry.add({ id: 'action2', label: 'Action 2' });
            registry.add({ id: 'action3', label: 'Action 3' });
        });

        it('returns all actions as array', function() {
            var all = registry.getAll();

            expect(Array.isArray(all)).toBe(true);
            expect(all.length).toBe(3);
        });

        it('includes action properties', function() {
            var all = registry.getAll();
            var ids = all.map(function(a) { return a.id; });

            expect(ids).toContain('action1');
            expect(ids).toContain('action2');
            expect(ids).toContain('action3');
        });

        it('returns empty array when no actions', function() {
            registry.clear();
            var all = registry.getAll();

            expect(all).toEqual([]);
        });

    });

    describe('getSorted()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'z-action', label: 'Z', order: 100 });
            registry.add({ id: 'a-action', label: 'A', order: 1 });
            registry.add({ id: 'm-action', label: 'M', order: 50 });
            registry.add({ id: 'hidden', label: 'Hidden', order: 25, hidden: true });
        });

        it('returns sorted by order', function() {
            var sorted = registry.getSorted();

            expect(sorted[0].id).toBe('a-action');
            expect(sorted[1].id).toBe('m-action');
            expect(sorted[2].id).toBe('z-action');
        });

        it('excludes hidden actions', function() {
            var sorted = registry.getSorted();
            var ids = sorted.map(function(a) { return a.id; });

            expect(ids).not.toContain('hidden');
            expect(sorted.length).toBe(3);
        });

    });

    describe('hide() and show()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'toggle-action', label: 'Toggle' });
        });

        it('hide() sets hidden to true', function() {
            registry.hide('toggle-action');

            expect(registry.get('toggle-action').hidden).toBe(true);
        });

        it('show() sets hidden to false', function() {
            registry.hide('toggle-action');
            registry.show('toggle-action');

            expect(registry.get('toggle-action').hidden).toBe(false);
        });

        it('hide() returns false for non-existent', function() {
            var result = registry.hide('non-existent');

            expect(result).toBe(false);
        });

        it('show() returns false for non-existent', function() {
            var result = registry.show('non-existent');

            expect(result).toBe(false);
        });

    });

    describe('clear()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'action1' });
            registry.add({ id: 'action2' });
            registry.add({ id: 'action3' });
        });

        it('removes all actions', function() {
            registry.clear();

            expect(registry.count()).toBe(0);
            expect(registry.getAll()).toEqual([]);
        });

        it('calls onClear callback', function() {
            var clearCalled = false;

            registry = ActionRegistry.create({
                onClear: function() { clearCalled = true; }
            });

            registry.add({ id: 'test' });
            registry.clear();

            expect(clearCalled).toBe(true);
        });

    });

    describe('has()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'exists' });
        });

        it('returns true for existing action', function() {
            expect(registry.has('exists')).toBe(true);
        });

        it('returns false for non-existent action', function() {
            expect(registry.has('non-existent')).toBe(false);
        });

    });

    describe('count()', function() {

        beforeEach(function() {
            registry = ActionRegistry.create();
        });

        it('returns 0 for empty registry', function() {
            expect(registry.count()).toBe(0);
        });

        it('returns correct count after adding', function() {
            registry.add({ id: 'action1' });
            registry.add({ id: 'action2' });

            expect(registry.count()).toBe(2);
        });

        it('updates after remove', function() {
            registry.add({ id: 'action1' });
            registry.add({ id: 'action2' });
            registry.remove('action1');

            expect(registry.count()).toBe(1);
        });

    });

    describe('Default Schema', function() {

        it('includes icon default', function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'test' });

            expect(registry.get('test').icon).toBe('fas fa-circle');
        });

        it('includes order default', function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'test' });

            expect(registry.get('test').order).toBe(50);
        });

        it('includes hidden default', function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'test' });

            expect(registry.get('test').hidden).toBe(false);
        });

        it('includes disabled default', function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'test' });

            expect(registry.get('test').disabled).toBe(false);
        });

        it('includes className default', function() {
            registry = ActionRegistry.create();
            registry.add({ id: 'test' });

            expect(registry.get('test').className).toBe('');
        });

    });

    describe('Multiple Instances', function() {

        it('creates independent registries', function() {
            var registry1 = ActionRegistry.create();
            var registry2 = ActionRegistry.create();

            registry1.add({ id: 'only-in-1' });
            registry2.add({ id: 'only-in-2' });

            expect(registry1.has('only-in-1')).toBe(true);
            expect(registry1.has('only-in-2')).toBe(false);

            expect(registry2.has('only-in-2')).toBe(true);
            expect(registry2.has('only-in-1')).toBe(false);

            registry1.clear();
            registry2.clear();
        });

        it('has independent schemas', function() {
            var registry1 = ActionRegistry.create({ schema: { icon: 'fas fa-one' } });
            var registry2 = ActionRegistry.create({ schema: { icon: 'fas fa-two' } });

            registry1.add({ id: 'test1' });
            registry2.add({ id: 'test2' });

            expect(registry1.get('test1').icon).toBe('fas fa-one');
            expect(registry2.get('test2').icon).toBe('fas fa-two');

            registry1.clear();
            registry2.clear();
        });

    });

    describe('Action Handler', function() {

        it('stores handler function', function() {
            registry = ActionRegistry.create();

            var handler = function() { return 'executed'; };
            registry.add({ id: 'with-handler', handler: handler });

            var action = registry.get('with-handler');
            expect(typeof action.handler).toBe('function');
            expect(action.handler()).toBe('executed');
        });

    });

});
