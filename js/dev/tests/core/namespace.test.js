/**
 * Funky.Namespace Tests
 *
 * Tests for the namespace system that creates window.Funky.
 */

describe('Funky.Core.Namespace', function() {

    describe('Namespace basics', function() {

        it('Funky global exists', function() {
            expect(window.Funky).toBeDefined();
            expect(typeof Funky).toBe('object');
        });

        it('has version property', function() {
            expect(Funky.version).toBeDefined();
            expect(typeof Funky.version).toBe('string');
        });

        it('has register function', function() {
            expect(typeof Funky.register).toBe('function');
        });

        it('has isRegistered function', function() {
            expect(typeof Funky.isRegistered).toBe('function');
        });

        it('has list function', function() {
            expect(typeof Funky.list).toBe('function');
        });

    });

    describe('Module registration', function() {

        it('can register a new module', function() {
            var testModule = { foo: 'bar' };
            Funky.register('TestModule1', testModule);

            expect(Funky.TestModule1).toBeDefined();
            expect(Funky.TestModule1.foo).toBe('bar');
        });

        it('isRegistered returns true for registered modules', function() {
            Funky.register('TestModule2', { test: true });

            expect(Funky.isRegistered('TestModule2')).toBe(true);
        });

        it('isRegistered returns false for unregistered modules', function() {
            expect(Funky.isRegistered('NonExistentModule')).toBe(false);
        });

        it('list returns array of registered module names', function() {
            var modules = Funky.list();

            expect(Array.isArray(modules)).toBe(true);
            expect(modules.length).toBeGreaterThan(0);
        });

        it('registered modules appear in list', function() {
            Funky.register('TestModule3', {});
            var modules = Funky.list();

            expect(modules).toContain('TestModule3');
        });

    });

    describe('Core modules registered', function() {

        it('Dom module is registered', function() {
            expect(Funky.isRegistered('Dom')).toBe(true);
            expect(Funky.Dom).toBeDefined();
        });

        it('Events module is registered', function() {
            expect(Funky.isRegistered('Events')).toBe(true);
            expect(Funky.Events).toBeDefined();
        });

        it('Util module is registered', function() {
            expect(Funky.isRegistered('Util')).toBe(true);
            expect(Funky.Util).toBeDefined();
        });

        it('PubSub module is registered', function() {
            expect(Funky.isRegistered('PubSub')).toBe(true);
            expect(Funky.PubSub).toBeDefined();
        });

        it('VDom module is registered', function() {
            expect(Funky.isRegistered('VDom')).toBe(true);
            expect(Funky.VDom).toBeDefined();
        });

    });

    describe('Double registration prevention', function() {

        it('prevents double registration of same module', function() {
            var original = { value: 'original' };
            var replacement = { value: 'replacement' };

            Funky.register('DoubleRegTest', original);
            Funky.register('DoubleRegTest', replacement);

            // Should keep original, not replacement
            expect(Funky.DoubleRegTest.value).toBe('original');
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('handles null name gracefully', function() {
            var result = Funky.register(null, { test: true });
            expect(result).toBe(false);
        });

        it('handles undefined name gracefully', function() {
            var result = Funky.register(undefined, { test: true });
            expect(result).toBe(false);
        });

        it('handles empty string name gracefully', function() {
            var result = Funky.register('', { test: true });
            expect(result).toBe(false);
        });

        it('handles non-string name gracefully', function() {
            var result = Funky.register(123, { test: true });
            expect(result).toBe(false);
        });

        it('handles object as name gracefully', function() {
            var result = Funky.register({ name: 'test' }, { test: true });
            expect(result).toBe(false);
        });

        it('prevents overriding register function', function() {
            var result = Funky.register('register', function() {});
            expect(result).toBe(false);
            expect(typeof Funky.register).toBe('function');
        });

        it('returns false when re-registering same module', function() {
            Funky.register('ReRegTest', { v: 1 });
            var result = Funky.register('ReRegTest', { v: 2 });
            expect(result).toBe(false);
        });

        it('isRegistered handles null input', function() {
            expect(Funky.isRegistered(null)).toBe(false);
        });

        it('isRegistered handles undefined input', function() {
            expect(Funky.isRegistered(undefined)).toBe(false);
        });

        it('isRegistered handles non-string input', function() {
            expect(Funky.isRegistered(123)).toBe(false);
        });

    });

    // =========================================================================
    // EDGE CASE TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('registers module with special characters in name', function() {
            var result = Funky.register('Test_Module-1', { test: true });
            expect(result).toBe(true);
            expect(Funky.isRegistered('Test_Module-1')).toBe(true);
        });

        it('registers module with very long name', function() {
            var longName = 'TestModuleWithVeryLongNameThatIsUnusuallyLong';
            var result = Funky.register(longName, { test: true });
            expect(result).toBe(true);
            expect(Funky.isRegistered(longName)).toBe(true);
        });

        it('registers module with single character name', function() {
            var result = Funky.register('X', { test: true });
            expect(result).toBe(true);
            expect(Funky.isRegistered('X')).toBe(true);
        });

        it('registered module cannot be overwritten directly', function() {
            Funky.register('ImmutableTest', { original: true });

            // Attempt to overwrite should silently fail or throw
            try {
                Funky.ImmutableTest = { replaced: true };
            } catch (e) {
                // Expected in strict mode
            }

            expect(Funky.ImmutableTest.original).toBe(true);
        });

        it('registered module cannot be deleted', function() {
            Funky.register('DeleteTest', { value: 'test' });

            // Attempt to delete should silently fail or throw
            try {
                delete Funky.DeleteTest;
            } catch (e) {
                // Expected in strict mode
            }

            expect(Funky.isRegistered('DeleteTest')).toBe(true);
        });

        it('list() excludes internal methods', function() {
            var modules = Funky.list();
            expect(modules).not.toContain('register');
            expect(modules).not.toContain('has');
            expect(modules).not.toContain('list');
            expect(modules).not.toContain('version');
            expect(modules).not.toContain('isRegistered');
        });

        it('can register null as a component value', function() {
            var result = Funky.register('NullComponent', null);
            expect(result).toBe(true);
            expect(Funky.NullComponent).toBe(null);
        });

        it('can register undefined as a component value', function() {
            var result = Funky.register('UndefinedComponent', undefined);
            expect(result).toBe(true);
            expect(Funky.UndefinedComponent).toBe(undefined);
        });

        it('can register function as a component', function() {
            var fn = function() { return 'test'; };
            var result = Funky.register('FunctionComponent', fn);
            expect(result).toBe(true);
            expect(Funky.FunctionComponent).toBe(fn);
            expect(Funky.FunctionComponent()).toBe('test');
        });

        it('can register class as a component', function() {
            function TestClass() {
                this.value = 42;
            }
            var result = Funky.register('ClassComponent', TestClass);
            expect(result).toBe(true);
            var instance = new Funky.ClassComponent();
            expect(instance.value).toBe(42);
        });

        it('can register primitive as a component', function() {
            var result = Funky.register('PrimitiveComponent', 42);
            expect(result).toBe(true);
            expect(Funky.PrimitiveComponent).toBe(42);
        });

        it('can register array as a component', function() {
            var arr = [1, 2, 3];
            var result = Funky.register('ArrayComponent', arr);
            expect(result).toBe(true);
            expect(Funky.ArrayComponent).toEqual([1, 2, 3]);
        });

    });

    // =========================================================================
    // SECURITY TESTS
    // =========================================================================
    describe('Security', function() {

        it('version property is immutable', function() {
            var originalVersion = Funky.version;

            try {
                Funky.version = 'hacked';
            } catch (e) {
                // Expected in strict mode
            }

            expect(Funky.version).toBe(originalVersion);
        });

        it('register function is immutable', function() {
            var originalRegister = Funky.register;

            try {
                Funky.register = function() { return 'hacked'; };
            } catch (e) {
                // Expected in strict mode
            }

            expect(Funky.register).toBe(originalRegister);
        });

        it('list function is immutable', function() {
            var originalList = Funky.list;

            try {
                Funky.list = function() { return ['hacked']; };
            } catch (e) {
                // Expected in strict mode
            }

            expect(Funky.list).toBe(originalList);
        });

        it('has function is immutable', function() {
            var originalHas = Funky.has;

            try {
                Funky.has = function() { return false; };
            } catch (e) {
                // Expected in strict mode
            }

            expect(Funky.has).toBe(originalHas);
        });

        it('Funky namespace on window is immutable', function() {
            var originalFunky = window.Funky;

            try {
                window.Funky = { hacked: true };
            } catch (e) {
                // Expected in strict mode
            }

            expect(window.Funky).toBe(originalFunky);
        });

    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    describe('State verification', function() {

        it('has() is alias for isRegistered()', function() {
            Funky.register('AliasTest', { test: true });
            expect(Funky.has('AliasTest')).toBe(Funky.isRegistered('AliasTest'));
        });

        it('list() returns new array each time', function() {
            var list1 = Funky.list();
            var list2 = Funky.list();
            expect(list1).not.toBe(list2);
            expect(list1).toEqual(list2);
        });

        it('list() reflects newly registered modules', function() {
            var beforeList = Funky.list();
            var beforeCount = beforeList.length;

            Funky.register('NewModuleForList', { test: true });

            var afterList = Funky.list();
            expect(afterList.length).toBe(beforeCount + 1);
            expect(afterList).toContain('NewModuleForList');
        });

        it('register returns true for successful registration', function() {
            var result = Funky.register('SuccessfulReg', { test: true });
            expect(result).toBe(true);
        });

    });

});
