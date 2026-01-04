/**
 * Funky.WIPOverlay Tests
 *
 * Tests for the Work In Progress overlay component.
 * Updated for v2.0 registry-based API with multiple instance support.
 */

describe('Funky.Component.WIPOverlay', function() {

    var WIPOverlay;
    var fixture;
    var TEST_ID = 'test-overlay';

    beforeEach(function() {
        // Get fresh reference - module may load after test file
        WIPOverlay = Funky.WIPOverlay;

        // Mock Storage to prevent affecting actual localStorage
        if (Funky.Storage) {
            FunkyTests.spyOn(Funky.Storage, 'getRaw').and.returnValue(null);
            FunkyTests.spyOn(Funky.Storage, 'setRaw');
            FunkyTests.spyOn(Funky.Storage, 'remove');
        }

        fixture = FunkyTests.fixture('<div id="wip-container"></div>');
    });

    afterEach(function() {
        // Destroy all overlay instances
        if (WIPOverlay && WIPOverlay.destroyAll) {
            WIPOverlay.destroyAll();
        }

        // Remove any remaining overlay elements
        var overlays = document.querySelectorAll('.funky-wip-overlay');
        overlays.forEach(function(el) { el.remove(); });

        // Remove styles
        var styles = document.getElementById('funky-wip-styles');
        if (styles) styles.remove();

        // Re-enable overlays for next test
        if (WIPOverlay && WIPOverlay.enable) {
            WIPOverlay.enable();
        }

        if (fixture) {
            fixture.destroy();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('WIPOverlay')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof WIPOverlay.init).toBe('function');
        });

        it('has show method', function() {
            expect(typeof WIPOverlay.show).toBe('function');
        });

        it('has hide method', function() {
            expect(typeof WIPOverlay.hide).toBe('function');
        });

        it('has toggle method', function() {
            expect(typeof WIPOverlay.toggle).toBe('function');
        });

        it('has isShown method', function() {
            expect(typeof WIPOverlay.isShown).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof WIPOverlay.getInstance).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof WIPOverlay.destroy).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof WIPOverlay.destroyAll).toBe('function');
        });

        it('has enable method', function() {
            expect(typeof WIPOverlay.enable).toBe('function');
        });

        it('has disableForSession method', function() {
            expect(typeof WIPOverlay.disableForSession).toBe('function');
        });

        it('has disablePermanently method', function() {
            expect(typeof WIPOverlay.disablePermanently).toBe('function');
        });

        it('has _instances registry', function() {
            expect(WIPOverlay._instances).toBeDefined();
            expect(typeof WIPOverlay._instances).toBe('object');
        });

    });

    describe('init()', function() {

        it('creates instance with provided ID', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                message: 'Test Message'
            });

            expect(instance).toBeDefined();
            expect(instance.id).toBe(TEST_ID);
        });

        it('stores instance in registry', function() {
            WIPOverlay.init({
                id: TEST_ID,
                message: 'Test Message'
            });

            var stored = WIPOverlay.getInstance(TEST_ID);
            expect(stored).toBeDefined();
            expect(stored.id).toBe(TEST_ID);
        });

        it('uses default ID when not provided', function() {
            WIPOverlay.init({
                message: 'Test Message'
            });

            // Should be stored under __default__
            var stored = WIPOverlay.getInstance();
            expect(stored).toBeDefined();
        });

        it('merges config options', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                message: 'Custom Message',
                animation: 'slide',
                progress: 75
            });

            expect(instance.config.message).toBe('Custom Message');
            expect(instance.config.animation).toBe('slide');
            expect(instance.config.progress).toBe(75);
        });

        it('destroys previous instance with same ID', function() {
            var instance1 = WIPOverlay.init({
                id: TEST_ID,
                message: 'First'
            });

            var instance2 = WIPOverlay.init({
                id: TEST_ID,
                message: 'Second'
            });

            expect(WIPOverlay.getInstance(TEST_ID)).toBe(instance2);
            expect(instance2.config.message).toBe('Second');
        });

    });

    describe('getInstance()', function() {

        it('returns null for non-existent instance', function() {
            var instance = WIPOverlay.getInstance('non-existent');
            expect(instance).toBeNull();
        });

        it('returns instance when exists', function() {
            WIPOverlay.init({
                id: TEST_ID
            });

            var instance = WIPOverlay.getInstance(TEST_ID);
            expect(instance).toBeDefined();
            expect(instance.id).toBe(TEST_ID);
        });

        it('returns default instance when no ID provided', function() {
            WIPOverlay.init({
                message: 'Default Test'
            });

            var instance = WIPOverlay.getInstance();
            expect(instance).toBeDefined();
        });

    });

    describe('Multiple instances', function() {

        it('supports multiple concurrent instances', function() {
            WIPOverlay.init({
                id: 'overlay-1',
                message: 'Overlay 1'
            });

            WIPOverlay.init({
                id: 'overlay-2',
                message: 'Overlay 2'
            });

            var instance1 = WIPOverlay.getInstance('overlay-1');
            var instance2 = WIPOverlay.getInstance('overlay-2');

            expect(instance1).toBeDefined();
            expect(instance2).toBeDefined();
            expect(instance1.config.message).toBe('Overlay 1');
            expect(instance2.config.message).toBe('Overlay 2');
        });

        it('instances are independent', function() {
            WIPOverlay.init({ id: 'a', animation: 'fade' });
            WIPOverlay.init({ id: 'b', animation: 'slide' });

            var a = WIPOverlay.getInstance('a');
            var b = WIPOverlay.getInstance('b');

            expect(a.config.animation).toBe('fade');
            expect(b.config.animation).toBe('slide');
        });

    });

    describe('show()', function() {

        it('returns WIPOverlay for chaining', function() {
            WIPOverlay.init({ id: TEST_ID });
            var result = WIPOverlay.show(TEST_ID);
            expect(result).toBe(WIPOverlay);
        });

        it('shows specified instance', function(done) {
            WIPOverlay.init({
                id: TEST_ID,
                message: 'Show Test'
            });
            WIPOverlay.show(TEST_ID);

            setTimeout(function() {
                expect(WIPOverlay.isShown(TEST_ID)).toBe(true);
                done();
            }, 200);
        });

        it('logs warning for non-existent instance', function() {
            FunkyTests.spyOn(console, 'warn');
            WIPOverlay.show('non-existent');
            expect(console.warn).toHaveBeenCalled();
        });

    });

    describe('hide()', function() {

        it('returns WIPOverlay for chaining', function() {
            WIPOverlay.init({ id: TEST_ID });
            var result = WIPOverlay.hide(TEST_ID);
            expect(result).toBe(WIPOverlay);
        });

        it('hides specified instance', function(done) {
            WIPOverlay.init({ id: TEST_ID });
            WIPOverlay.show(TEST_ID);

            setTimeout(function() {
                WIPOverlay.hide(TEST_ID);

                setTimeout(function() {
                    expect(WIPOverlay.isShown(TEST_ID)).toBe(false);
                    done();
                }, 600);
            }, 200);
        });

    });

    describe('toggle()', function() {

        it('returns WIPOverlay for chaining', function() {
            WIPOverlay.init({ id: TEST_ID });
            var result = WIPOverlay.toggle(TEST_ID);
            expect(result).toBe(WIPOverlay);
        });

        it('toggles visibility state', function(done) {
            WIPOverlay.init({ id: TEST_ID });

            // Toggle should show
            WIPOverlay.toggle(TEST_ID);

            setTimeout(function() {
                expect(WIPOverlay.isShown(TEST_ID)).toBe(true);
                done();
            }, 200);
        });

    });

    describe('isShown()', function() {

        it('returns false for non-existent instance', function() {
            expect(WIPOverlay.isShown('non-existent')).toBe(false);
        });

        it('returns false initially', function() {
            WIPOverlay.init({ id: TEST_ID });
            expect(WIPOverlay.isShown(TEST_ID)).toBe(false);
        });

        it('returns true when visible', function(done) {
            WIPOverlay.init({ id: TEST_ID });
            WIPOverlay.show(TEST_ID);

            setTimeout(function() {
                expect(WIPOverlay.isShown(TEST_ID)).toBe(true);
                done();
            }, 200);
        });

    });

    describe('destroy()', function() {

        it('returns WIPOverlay for chaining', function() {
            WIPOverlay.init({ id: TEST_ID });
            var result = WIPOverlay.destroy(TEST_ID);
            expect(result).toBe(WIPOverlay);
        });

        it('removes instance from registry', function() {
            WIPOverlay.init({ id: TEST_ID });
            WIPOverlay.destroy(TEST_ID);

            expect(WIPOverlay.getInstance(TEST_ID)).toBeNull();
        });

        it('removes overlay from DOM', function(done) {
            WIPOverlay.init({ id: TEST_ID });
            WIPOverlay.show(TEST_ID);

            setTimeout(function() {
                WIPOverlay.destroy(TEST_ID);

                var overlay = document.getElementById('funky-wip-overlay-' + TEST_ID);
                expect(overlay).toBeNull();
                done();
            }, 200);
        });

    });

    describe('destroyAll()', function() {

        it('returns WIPOverlay for chaining', function() {
            var result = WIPOverlay.destroyAll();
            expect(result).toBe(WIPOverlay);
        });

        it('destroys all instances', function() {
            WIPOverlay.init({ id: 'a' });
            WIPOverlay.init({ id: 'b' });
            WIPOverlay.init({ id: 'c' });

            WIPOverlay.destroyAll();

            expect(WIPOverlay.getInstance('a')).toBeNull();
            expect(WIPOverlay.getInstance('b')).toBeNull();
            expect(WIPOverlay.getInstance('c')).toBeNull();
        });

    });

    describe('Instance configuration', function() {

        it('has default message', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.message).toContain('Work In Progress');
        });

        it('default allows close', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.allowClose).toBe(true);
        });

        it('has default animation type', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.animation).toBe('fade');
        });

        it('has default background color', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.backgroundColor).toBeDefined();
        });

        it('has default text color', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.textColor).toBeDefined();
        });

        it('has default accent color', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.accentColor).toBeDefined();
        });

        it('has default z-index', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.zIndex).toBeDefined();
            expect(typeof instance.config.zIndex).toBe('number');
        });

        it('has default features array', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(Array.isArray(instance.config.features)).toBe(true);
        });

        it('estimatedCompletion defaults to null', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.estimatedCompletion).toBeNull();
        });

        it('contactEmail defaults to null', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.contactEmail).toBeNull();
        });

        it('showProgress defaults to true', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.showProgress).toBe(true);
        });

        it('showFeatures defaults to true', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.showFeatures).toBe(true);
        });

        it('scopeToContainer defaults to null', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(instance.config.scopeToContainer).toBeNull();
        });

    });

    describe('Instance methods', function() {

        it('instance has _calculateProgress method', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(typeof instance._calculateProgress).toBe('function');
        });

        it('_calculateProgress returns numeric value', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            var progress = instance._calculateProgress();

            expect(typeof progress).toBe('number');
        });

        it('_calculateProgress returns value between 0 and 100', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            var progress = instance._calculateProgress();

            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(100);
        });

        it('_calculateProgress uses explicit progress if provided', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                progress: 75
            });

            var progress = instance._calculateProgress();
            expect(progress).toBe(75);
        });

        it('_calculateProgress clamps progress to 0-100 range', function() {
            var instance1 = WIPOverlay.init({
                id: 'clamp-high',
                progress: 150
            });
            expect(instance1._calculateProgress()).toBe(100);

            var instance2 = WIPOverlay.init({
                id: 'clamp-low',
                progress: -50
            });
            expect(instance2._calculateProgress()).toBe(0);
        });

        it('instance has _isDevelopment method', function() {
            var instance = WIPOverlay.init({ id: TEST_ID });
            expect(typeof instance._isDevelopment).toBe('function');
        });

    });

    describe('Container scoping', function() {

        it('can scope to container via selector', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                scopeToContainer: '#wip-container'
            });

            expect(instance.config.scopeToContainer).toBe('#wip-container');
        });

        it('multiple instances can have different scopes', function() {
            WIPOverlay.init({
                id: 'global',
                scopeToContainer: null
            });

            WIPOverlay.init({
                id: 'scoped',
                scopeToContainer: '#wip-container'
            });

            var global = WIPOverlay.getInstance('global');
            var scoped = WIPOverlay.getInstance('scoped');

            expect(global.config.scopeToContainer).toBeNull();
            expect(scoped.config.scopeToContainer).toBe('#wip-container');
        });

    });

    describe('Animation options', function() {

        it('supports fade animation', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                animation: 'fade'
            });
            expect(instance.config.animation).toBe('fade');
        });

        it('supports slide animation', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                animation: 'slide'
            });
            expect(instance.config.animation).toBe('slide');
        });

        it('supports zoom animation', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                animation: 'zoom'
            });
            expect(instance.config.animation).toBe('zoom');
        });

        it('supports none animation', function() {
            var instance = WIPOverlay.init({
                id: TEST_ID,
                animation: 'none'
            });
            expect(instance.config.animation).toBe('none');
        });

    });

    describe('Backward compatibility', function() {

        it('works without providing ID (uses default)', function() {
            WIPOverlay.init({
                message: 'No ID Test'
            });

            var instance = WIPOverlay.getInstance();
            expect(instance).toBeDefined();
            expect(instance.config.message).toBe('No ID Test');
        });

        it('show() works without ID', function(done) {
            WIPOverlay.init({
                message: 'Show without ID'
            });
            WIPOverlay.show();

            setTimeout(function() {
                expect(WIPOverlay.isShown()).toBe(true);
                done();
            }, 200);
        });

        it('hide() works without ID', function() {
            WIPOverlay.init({});
            WIPOverlay.hide();
            // Should not throw
            expect(true).toBe(true);
        });

        it('toggle() works without ID', function() {
            WIPOverlay.init({});
            WIPOverlay.toggle();
            // Should not throw
            expect(true).toBe(true);
        });

    });

});
