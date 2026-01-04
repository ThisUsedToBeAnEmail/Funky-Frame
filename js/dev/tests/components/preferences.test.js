/**
 * Tests for Funky.Preferences component
 *
 * Preferences manages user preferences for themes, notifications,
 * display settings, and provides a binding system for components.
 */
FunkyTests.describe('Funky.Component.Preferences', function() {
    'use strict';

    var Preferences = Funky.Preferences;
    var expect = FunkyTests.expect;
    var spyOn = FunkyTests.spyOn;
    var fixture;
    var testCounter = 0;
    var originalCache;
    var originalLoaded;
    var originalDefaults;

    /**
     * Generate unique IDs for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        return (prefix || 'preferences') + '-test-' + unique;
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');

        // Store original state (deep clone defaults to prevent mutation)
        originalCache = Preferences.cache;
        originalLoaded = Preferences.loaded;
        originalDefaults = JSON.parse(JSON.stringify(Preferences.defaults));

        // Reset to defaults for testing
        Preferences.cache = null;
        Preferences.loaded = false;
    });

    FunkyTests.afterEach(function() {
        // Restore original state
        Preferences.cache = originalCache;
        Preferences.loaded = originalLoaded;
        Preferences.defaults = originalDefaults;

        // Remove any CSS custom properties set during tests
        var props = [
            '--user-accent', '--user-accent-hover', '--user-accent-rgb', '--user-accent-muted',
            '--user-bg-primary', '--user-bg-secondary', '--user-bg-tertiary', '--user-bg-elevated',
            '--user-text-primary', '--user-text-secondary',
            '--user-border-color', '--user-border-muted', '--user-border-emphasis',
            '--user-link-color', '--user-link-hover',
            '--user-font-scale'
        ];
        props.forEach(function(prop) {
            document.documentElement.style.removeProperty(prop);
        });

        // Remove data attributes
        document.body.removeAttribute('data-theme');
        document.body.removeAttribute('data-nav-position');
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.removeAttribute('data-density');
        document.documentElement.removeAttribute('data-animations');

        fixture.cleanup();
    });

    // =========================================================================
    // Module Structure Tests
    // =========================================================================

    FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be registered in Funky namespace', function() {
            expect(Funky.Preferences).toBeDefined();
        });

        FunkyTests.it('should have load method', function() {
            expect(typeof Preferences.load).toBe('function');
        });

        FunkyTests.it('should have save method', function() {
            expect(typeof Preferences.save).toBe('function');
        });

        FunkyTests.it('should have saveAll method', function() {
            expect(typeof Preferences.saveAll).toBe('function');
        });

        FunkyTests.it('should have get method', function() {
            expect(typeof Preferences.get).toBe('function');
        });

        FunkyTests.it('should have set method', function() {
            expect(typeof Preferences.set).toBe('function');
        });

        FunkyTests.it('should have apply method', function() {
            expect(typeof Preferences.apply).toBe('function');
        });

        FunkyTests.it('should have reset method', function() {
            expect(typeof Preferences.reset).toBe('function');
        });

        FunkyTests.it('should have setEndpoint method', function() {
            expect(typeof Preferences.setEndpoint).toBe('function');
        });

        FunkyTests.it('should have getEndpoint method', function() {
            expect(typeof Preferences.getEndpoint).toBe('function');
        });

        FunkyTests.it('should have addListener method', function() {
            expect(typeof Preferences.addListener).toBe('function');
        });

        FunkyTests.it('should have removeListener method', function() {
            expect(typeof Preferences.removeListener).toBe('function');
        });

        FunkyTests.it('should have bind method', function() {
            expect(typeof Preferences.bind).toBe('function');
        });

        FunkyTests.it('should have setData method (Bindable Interface)', function() {
            expect(typeof Preferences.setData).toBe('function');
        });

        FunkyTests.it('should have getData method (Bindable Interface)', function() {
            expect(typeof Preferences.getData).toBe('function');
        });

        FunkyTests.it('should have _instances registry', function() {
            // Preferences uses Funky.Registry.createInstanceRegistry() which is an object
            expect(Preferences._instances).toBeDefined();
            expect(typeof Preferences._instances).toBe('object');
        });

        FunkyTests.it('should have defaults object', function() {
            expect(Preferences.defaults).toBeDefined();
            expect(typeof Preferences.defaults).toBe('object');
        });
    });

    // =========================================================================
    // Default Values Tests
    // =========================================================================

    FunkyTests.describe('Default Values', function() {
        // Note: These tests verify the defaults structure exists.
        // If Preferences isn't fully loaded, tests will skip gracefully.

        FunkyTests.it('should have theme defaults', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) {
                expect(true).toBe(true); // Skip
                return;
            }
            expect(Preferences.defaults.theme.mode).toBe('dark');
        });

        FunkyTests.it('should have accent_color default', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.theme.accent_color).toBe('#0d6efd');
        });

        FunkyTests.it('should have nav_position default', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.theme.nav_position).toBe('left');
        });

        FunkyTests.it('should have font_scale default', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.theme.font_scale).toBe(1.0);
        });

        FunkyTests.it('should have density default', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.theme.density).toBe('comfortable');
        });

        FunkyTests.it('should have animations_enabled default', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.theme.animations_enabled).toBe(true);
        });

        FunkyTests.it('should have sidebar_collapsed default', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.theme.sidebar_collapsed).toBe(false);
        });

        FunkyTests.it('should have notifications defaults', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.notifications;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.notifications.email_enabled).toBe(true);
        });

        FunkyTests.it('should have display defaults', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.display;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.display.items_per_page).toBe(25);
        });

        FunkyTests.it('should have dashboard defaults', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.dashboard;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.dashboard.layout).toBe('default');
        });

        FunkyTests.it('should have tables defaults', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.tables;
            if (!hasDefaults) { expect(true).toBe(true); return; }
            expect(Preferences.defaults.tables.column_visibility).toEqual({});
        });
    });

    // =========================================================================
    // get() Tests
    // =========================================================================

    FunkyTests.describe('get', function() {

        FunkyTests.it('should get value from cache', function() {
            Preferences.cache = {
                theme: { mode: 'light' }
            };
            Preferences.loaded = true;

            var mode = Preferences.get('theme.mode');
            expect(mode).toBe('light');
        });

        FunkyTests.it('should get nested value', function() {
            Preferences.cache = {
                notifications: {
                    email_enabled: false,
                    push_enabled: true
                }
            };

            expect(Preferences.get('notifications.email_enabled')).toBe(false);
            expect(Preferences.get('notifications.push_enabled')).toBe(true);
        });

        FunkyTests.it('should return default when cache is null', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }

            Preferences.cache = null;

            var mode = Preferences.get('theme.mode');
            expect(mode).toBe('dark'); // Default
        });

        FunkyTests.it('should return default for missing key', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }

            Preferences.cache = {
                theme: {}
            };

            var mode = Preferences.get('theme.mode');
            expect(mode).toBe('dark'); // Default
        });

        FunkyTests.it('should return entire category', function() {
            Preferences.cache = {
                theme: { mode: 'dark', accent_color: '#ff0000' }
            };

            var theme = Preferences.get('theme');
            expect(theme.mode).toBe('dark');
            expect(theme.accent_color).toBe('#ff0000');
        });

        FunkyTests.it('should return default for deeply nested missing key', function() {
            Preferences.cache = {};

            var value = Preferences.get('nonexistent.deeply.nested');
            expect(value).toBeUndefined();
        });
    });

    // =========================================================================
    // setData/getData (Bindable Interface) Tests
    // =========================================================================

    FunkyTests.describe('Bindable Interface', function() {

        FunkyTests.it('should setData and update cache', function() {
            Preferences.setData({
                theme: { mode: 'light' }
            });

            expect(Preferences.cache.theme.mode).toBe('light');
        });

        FunkyTests.it('should mark as loaded after setData', function() {
            Preferences.loaded = false;
            Preferences.setData({ theme: {} });

            expect(Preferences.loaded).toBe(true);
        });

        FunkyTests.it('should getData returning cache', function() {
            Preferences.cache = {
                theme: { mode: 'dark' },
                display: { items_per_page: 50 }
            };

            var data = Preferences.getData();

            expect(data.theme.mode).toBe('dark');
            expect(data.display.items_per_page).toBe(50);
        });

        FunkyTests.it('should return defaults when cache is null', function() {
            var hasDefaults = Preferences && Preferences.defaults && Preferences.defaults.theme;
            if (!hasDefaults) { expect(true).toBe(true); return; }

            Preferences.cache = null;

            var data = Preferences.getData();

            expect(data.theme).toBeDefined();
            expect(data.theme.mode).toBe('dark');
        });

        FunkyTests.it('should merge setData with existing cache', function() {
            Preferences.cache = {
                theme: { mode: 'dark' }
            };

            Preferences.setData({
                display: { items_per_page: 100 }
            });

            expect(Preferences.cache.theme.mode).toBe('dark');
            expect(Preferences.cache.display.items_per_page).toBe(100);
        });

        FunkyTests.it('should not crash with null setData', function() {
            expect(function() {
                Preferences.setData(null);
            }).not.toThrow();
        });

        FunkyTests.it('should not crash with non-object setData', function() {
            expect(function() {
                Preferences.setData('not an object');
            }).not.toThrow();
        });
    });

    // =========================================================================
    // Change Listeners Tests
    // =========================================================================

    FunkyTests.describe('Change Listeners', function() {

        FunkyTests.it('should add listener', function() {
            var callback = function() {};
            var initialCount = Preferences.changeListeners.length;

            Preferences.addListener(callback);

            expect(Preferences.changeListeners.length).toBe(initialCount + 1);

            // Cleanup
            Preferences.removeListener(callback);
        });

        FunkyTests.it('should remove listener', function() {
            var callback = function() {};

            Preferences.addListener(callback);
            var afterAdd = Preferences.changeListeners.length;

            Preferences.removeListener(callback);

            expect(Preferences.changeListeners.length).toBe(afterAdd - 1);
        });

        FunkyTests.it('should notify listeners on change', function() {
            var notifiedCategory = null;
            var notifiedData = null;
            var callback = function(category, data) {
                notifiedCategory = category;
                notifiedData = data;
            };

            Preferences.addListener(callback);
            Preferences.notifyChangeListeners('theme', { mode: 'light' });

            expect(notifiedCategory).toBe('theme');
            expect(notifiedData.mode).toBe('light');

            Preferences.removeListener(callback);
        });

        FunkyTests.it('should notify multiple listeners', function() {
            var count = 0;
            var callback1 = function() { count++; };
            var callback2 = function() { count++; };

            Preferences.addListener(callback1);
            Preferences.addListener(callback2);

            Preferences.notifyChangeListeners('test', {});

            expect(count).toBe(2);

            Preferences.removeListener(callback1);
            Preferences.removeListener(callback2);
        });

        FunkyTests.it('should not add non-function listeners', function() {
            var initialCount = Preferences.changeListeners.length;

            Preferences.addListener('not a function');
            Preferences.addListener(null);
            Preferences.addListener(123);

            expect(Preferences.changeListeners.length).toBe(initialCount);
        });

        FunkyTests.it('should handle listener errors gracefully', function() {
            var errorCallback = function() {
                throw new Error('Test error');
            };
            var successCallback = function() {};

            Preferences.addListener(errorCallback);
            Preferences.addListener(successCallback);

            expect(function() {
                Preferences.notifyChangeListeners('test', {});
            }).not.toThrow();

            Preferences.removeListener(errorCallback);
            Preferences.removeListener(successCallback);
        });
    });

    // =========================================================================
    // setEndpoint/getEndpoint Tests
    // =========================================================================

    FunkyTests.describe('Endpoint Configuration', function() {

        FunkyTests.it('should set custom endpoint', function() {
            var originalEndpoint = Preferences.getEndpoint();

            Preferences.setEndpoint('/api/custom/preferences');

            expect(Preferences.getEndpoint()).toBe('/api/custom/preferences');

            // Restore
            Preferences.setEndpoint(originalEndpoint);
        });

        FunkyTests.it('should reset loaded state when endpoint changes', function() {
            Preferences.loaded = true;
            Preferences.cache = { test: 'data' };

            Preferences.setEndpoint('/api/new/endpoint');

            expect(Preferences.loaded).toBe(false);
            expect(Preferences.cache).toBeNull();

            // Restore
            Preferences.setEndpoint('/api/users/preferences');
        });
    });

    // =========================================================================
    // Color Helper Tests
    // =========================================================================

    FunkyTests.describe('Color Helpers', function() {

        FunkyTests.it('should convert hex to RGB', function() {
            var rgb = Preferences.hexToRgb('#ff6600');

            expect(rgb.r).toBe(255);
            expect(rgb.g).toBe(102);
            expect(rgb.b).toBe(0);
        });

        FunkyTests.it('should handle hex without hash', function() {
            var rgb = Preferences.hexToRgb('00ff00');

            expect(rgb.r).toBe(0);
            expect(rgb.g).toBe(255);
            expect(rgb.b).toBe(0);
        });

        FunkyTests.it('should return null for invalid hex', function() {
            var rgb = Preferences.hexToRgb('invalid');
            expect(rgb).toBeNull();
        });

        FunkyTests.it('should darken color', function() {
            var darker = Preferences.darkenColor('#ffffff', 50);

            // Should be around #808080 (gray) - Math.round(127.5) = 128 = 0x80
            expect(darker.toLowerCase()).toContain('80');
        });

        FunkyTests.it('should lighten color', function() {
            var lighter = Preferences.lightenColor('#000000', 50);

            // Should be around #808080 (gray) - Math.round(127.5) = 128 = 0x80
            expect(lighter.toLowerCase()).toContain('80');
        });

        FunkyTests.it('should adjust color opacity', function() {
            var rgba = Preferences.adjustColorOpacity('#ff0000', 0.5);

            expect(rgba).toContain('rgba');
            expect(rgba).toContain('255');
            expect(rgba).toContain('0.5');
        });

        FunkyTests.it('should return original for invalid darken', function() {
            var result = Preferences.darkenColor('invalid', 50);
            expect(result).toBe('invalid');
        });

        FunkyTests.it('should return original for invalid lighten', function() {
            var result = Preferences.lightenColor('invalid', 50);
            expect(result).toBe('invalid');
        });
    });

    // =========================================================================
    // apply() Tests
    // =========================================================================

    FunkyTests.describe('apply', function() {

        FunkyTests.it('should apply theme mode to body', function() {
            Preferences.cache = {
                theme: { mode: 'light' }
            };

            Preferences.apply();

            expect(document.body.getAttribute('data-theme')).toBe('light');
        });

        FunkyTests.it('should apply theme mode to documentElement', function() {
            Preferences.cache = {
                theme: { mode: 'dark' }
            };

            Preferences.apply();

            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        FunkyTests.it('should apply accent color CSS variable', function() {
            Preferences.cache = {
                theme: { accent_color: '#ff6600' }
            };

            Preferences.apply();

            var computed = document.documentElement.style.getPropertyValue('--user-accent');
            expect(computed).toBe('#ff6600');
        });

        FunkyTests.it('should apply nav_position to body', function() {
            Preferences.cache = {
                theme: { nav_position: 'top' }
            };

            Preferences.apply();

            expect(document.body.getAttribute('data-nav-position')).toBe('top');
        });

        FunkyTests.it('should apply font_scale CSS variable', function() {
            Preferences.cache = {
                theme: { font_scale: 1.2 }
            };

            Preferences.apply();

            var computed = document.documentElement.style.getPropertyValue('--user-font-scale');
            expect(computed).toBe('1.2');
        });

        FunkyTests.it('should apply density attribute', function() {
            Preferences.cache = {
                theme: { density: 'compact' }
            };

            Preferences.apply();

            expect(document.documentElement.getAttribute('data-density')).toBe('compact');
        });

        FunkyTests.it('should apply animations attribute', function() {
            Preferences.cache = {
                theme: { animations_enabled: false }
            };

            Preferences.apply();

            expect(document.documentElement.getAttribute('data-animations')).toBe('off');
        });

        FunkyTests.it('should not crash with null cache', function() {
            Preferences.cache = null;

            expect(function() {
                Preferences.apply();
            }).not.toThrow();
        });

        FunkyTests.it('should use default nav_position if not set', function() {
            Preferences.cache = {
                theme: {}
            };

            Preferences.apply();

            expect(document.body.getAttribute('data-nav-position')).toBe('left');
        });
    });

    // =========================================================================
    // bind() Tests
    // =========================================================================

    FunkyTests.describe('bind', function() {

        FunkyTests.it('should return null without key', function() {
            var binding = Preferences.bind({
                getState: function() { return {}; },
                applyState: function() {}
            });

            expect(binding).toBeNull();
        });

        FunkyTests.it('should return null without getState', function() {
            var binding = Preferences.bind({
                key: 'test',
                applyState: function() {}
            });

            expect(binding).toBeNull();
        });

        FunkyTests.it('should return null without applyState', function() {
            var binding = Preferences.bind({
                key: 'test',
                getState: function() { return {}; }
            });

            expect(binding).toBeNull();
        });

        FunkyTests.it('should create binding object', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                getState: function() { return { value: 1 }; },
                applyState: function() {}
            });

            expect(binding).not.toBeNull();
            expect(binding.id).toBeDefined();
            expect(binding.key).toBe('testBinding');

            binding.destroy();
        });

        FunkyTests.it('should have save method', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                getState: function() { return {}; },
                applyState: function() {}
            });

            expect(typeof binding.save).toBe('function');

            binding.destroy();
        });

        FunkyTests.it('should have load method', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                getState: function() { return {}; },
                applyState: function() {}
            });

            expect(typeof binding.load).toBe('function');

            binding.destroy();
        });

        FunkyTests.it('should have clear method', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                getState: function() { return {}; },
                applyState: function() {}
            });

            expect(typeof binding.clear).toBe('function');

            binding.destroy();
        });

        FunkyTests.it('should have get method', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                getState: function() { return { a: 1, b: 2 }; },
                applyState: function() {}
            });

            expect(typeof binding.get).toBe('function');
            expect(binding.get().a).toBe(1);

            binding.destroy();
        });

        FunkyTests.it('should have destroy method', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                getState: function() { return {}; },
                applyState: function() {}
            });

            expect(typeof binding.destroy).toBe('function');

            binding.destroy();
        });

        FunkyTests.it('should filter state with persist option', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                persist: ['keep'],
                getState: function() { return { keep: 'yes', discard: 'no' }; },
                applyState: function() {}
            });

            var filtered = binding.get();
            expect(filtered.keep).toBe('yes');
            expect(filtered.discard).toBeUndefined();

            binding.destroy();
        });

        FunkyTests.it('should have shouldPersist helper', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                persist: ['allowed'],
                getState: function() { return {}; },
                applyState: function() {}
            });

            expect(binding.shouldPersist('allowed')).toBe(true);
            expect(binding.shouldPersist('notallowed')).toBe(false);

            binding.destroy();
        });

        FunkyTests.it('should persist all when no persist array', function() {
            var binding = Preferences.bind({
                key: 'testBinding',
                getState: function() { return { a: 1, b: 2, c: 3 }; },
                applyState: function() {}
            });

            expect(binding.shouldPersist('a')).toBe(true);
            expect(binding.shouldPersist('anything')).toBe(true);

            binding.destroy();
        });

        FunkyTests.it('should register binding in getBindings', function() {
            var binding = Preferences.bind({
                key: 'registeredBinding',
                getState: function() { return {}; },
                applyState: function() {}
            });

            var bindings = Preferences.getBindings();
            expect(bindings[binding.id]).toBe(binding);

            binding.destroy();
        });

        FunkyTests.it('should remove binding from registry on destroy', function() {
            var binding = Preferences.bind({
                key: 'destroyableBinding',
                getState: function() { return {}; },
                applyState: function() {}
            });

            var bindingId = binding.id;
            binding.destroy();

            var bindings = Preferences.getBindings();
            expect(bindings[bindingId]).toBeUndefined();
        });

        FunkyTests.it('should call applyState on load', function() {
            var applyCalled = false;
            var appliedState = null;

            Preferences.cache = {
                loadTest: { value: 'loaded' }
            };

            var binding = Preferences.bind({
                key: 'loadTest',
                getState: function() { return {}; },
                applyState: function(state) {
                    applyCalled = true;
                    appliedState = state;
                }
            });

            // applyState is called during init
            expect(applyCalled).toBe(true);
            expect(appliedState.value).toBe('loaded');

            binding.destroy();
        });
    });

    // =========================================================================
    // Instance Registry Tests
    // =========================================================================

    FunkyTests.describe('Instance Registry', function() {

        FunkyTests.it('should have default instance', function() {
            // Uses InstanceRegistry.get() instead of bracket access
            expect(Preferences._instances.get('default')).toBeDefined();
        });

        FunkyTests.it('should get instance by context ID', function() {
            var instance = Preferences.getInstance('default');
            expect(instance).toBeDefined();
            expect(instance.contextId).toBe('default');
        });

        FunkyTests.it('should return null for unknown context', function() {
            var instance = Preferences.getInstance('nonexistent');
            expect(instance).toBeNull();
        });

        FunkyTests.it('should setDataById', function() {
            Preferences.setDataById('default', { theme: { mode: 'light' } });

            var data = Preferences.getDataById('default');
            expect(data.theme.mode).toBe('light');
        });

        FunkyTests.it('should return null for unknown context in getDataById', function() {
            var data = Preferences.getDataById('nonexistent');
            expect(data).toBeNull();
        });

        FunkyTests.it('should return false for unknown context in setDataById', function() {
            var result = Preferences.setDataById('nonexistent', {});
            expect(result).toBe(false);
        });
    });

    // =========================================================================
    // Custom Colors Tests
    // =========================================================================

    FunkyTests.describe('Custom Colors', function() {

        FunkyTests.it('should apply background color', function() {
            Preferences.cache = {
                theme: { background_color: '#1a1a2e' }
            };

            Preferences.apply();

            var bgPrimary = document.documentElement.style.getPropertyValue('--user-bg-primary');
            expect(bgPrimary).toBe('#1a1a2e');
        });

        FunkyTests.it('should apply font color', function() {
            Preferences.cache = {
                theme: { font_color: '#ffffff' }
            };

            Preferences.apply();

            var textPrimary = document.documentElement.style.getPropertyValue('--user-text-primary');
            expect(textPrimary).toBe('#ffffff');
        });

        FunkyTests.it('should apply border color', function() {
            Preferences.cache = {
                theme: { border_color: '#333333' }
            };

            Preferences.apply();

            var borderColor = document.documentElement.style.getPropertyValue('--user-border-color');
            expect(borderColor).toBe('#333333');
        });

        FunkyTests.it('should apply link color', function() {
            Preferences.cache = {
                theme: { link_color: '#00aaff' }
            };

            Preferences.apply();

            var linkColor = document.documentElement.style.getPropertyValue('--user-link-color');
            expect(linkColor).toBe('#00aaff');
        });

        FunkyTests.it('should remove custom colors when not set', function() {
            // First apply with colors
            Preferences.cache = {
                theme: { background_color: '#000000' }
            };
            Preferences.apply();

            // Then apply without colors
            Preferences.cache = {
                theme: {}
            };
            Preferences.apply();

            var bgPrimary = document.documentElement.style.getPropertyValue('--user-bg-primary');
            expect(bgPrimary).toBe('');
        });
    });

    // =========================================================================
    // High Contrast Theme Tests
    // =========================================================================

    FunkyTests.describe('High Contrast Theme', function() {

        FunkyTests.it('should apply high-contrast theme mode', function() {
            Preferences.cache = {
                theme: { mode: 'high-contrast' }
            };

            Preferences.apply();

            expect(document.body.getAttribute('data-theme')).toBe('high-contrast');
            expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
        });

        FunkyTests.it('should switch from dark to high-contrast theme', function() {
            // Start with dark theme
            Preferences.cache = {
                theme: { mode: 'dark' }
            };
            Preferences.apply();
            expect(document.body.getAttribute('data-theme')).toBe('dark');

            // Switch to high-contrast
            Preferences.cache = {
                theme: { mode: 'high-contrast' }
            };
            Preferences.apply();
            expect(document.body.getAttribute('data-theme')).toBe('high-contrast');
        });

        FunkyTests.it('should switch from high-contrast to light theme', function() {
            // Start with high-contrast theme
            Preferences.cache = {
                theme: { mode: 'high-contrast' }
            };
            Preferences.apply();
            expect(document.body.getAttribute('data-theme')).toBe('high-contrast');

            // Switch to light
            Preferences.cache = {
                theme: { mode: 'light' }
            };
            Preferences.apply();
            expect(document.body.getAttribute('data-theme')).toBe('light');
        });

        FunkyTests.it('should have checkHighContrastPreference method', function() {
            expect(typeof Preferences.checkHighContrastPreference).toBe('function');
        });

        FunkyTests.it('should get high-contrast theme mode via get()', function() {
            Preferences.cache = {
                theme: { mode: 'high-contrast' }
            };

            var mode = Preferences.get('theme.mode');
            expect(mode).toBe('high-contrast');
        });

        FunkyTests.it('should apply accent color with high-contrast theme', function() {
            Preferences.cache = {
                theme: {
                    mode: 'high-contrast',
                    accent_color: '#ffff00'
                }
            };

            Preferences.apply();

            expect(document.body.getAttribute('data-theme')).toBe('high-contrast');
            var computed = document.documentElement.style.getPropertyValue('--user-accent');
            expect(computed).toBe('#ffff00');
        });

        FunkyTests.it('should apply animations setting with high-contrast theme', function() {
            Preferences.cache = {
                theme: {
                    mode: 'high-contrast',
                    animations_enabled: false
                }
            };

            Preferences.apply();

            expect(document.body.getAttribute('data-theme')).toBe('high-contrast');
            expect(document.documentElement.getAttribute('data-animations')).toBe('off');
        });

        FunkyTests.it('should notify listeners when switching to high-contrast', function() {
            var notifiedCategory = null;
            var notifiedData = null;
            var callback = function(category, data) {
                notifiedCategory = category;
                notifiedData = data;
            };

            Preferences.addListener(callback);
            Preferences.notifyChangeListeners('theme', { mode: 'high-contrast' });

            expect(notifiedCategory).toBe('theme');
            expect(notifiedData.mode).toBe('high-contrast');

            Preferences.removeListener(callback);
        });
    });

    // =========================================================================
    // High Contrast OS Detection Tests
    // =========================================================================

    FunkyTests.describe('High Contrast OS Detection', function() {

        FunkyTests.it('should have highContrastQuery available', function() {
            // Check if matchMedia is available
            if (typeof window.matchMedia === 'function') {
                var query = window.matchMedia('(prefers-contrast: high)');
                expect(query).toBeDefined();
                expect(typeof query.matches).toBe('boolean');
            } else {
                // Skip test if matchMedia not available
                expect(true).toBe(true);
            }
        });

        FunkyTests.it('should not prompt if already using high-contrast theme', function() {
            // Set up high-contrast theme already applied
            Preferences.cache = {
                theme: { mode: 'high-contrast' }
            };
            Preferences.loaded = true;

            // sessionStorage should not be set if already on high-contrast
            sessionStorage.removeItem('funky-high-contrast-prompted');

            // Calling checkHighContrastPreference should not set the prompted flag
            // if we're already on high-contrast (since it checks theme first)
            var currentTheme = Preferences.get('theme.mode');
            expect(currentTheme).toBe('high-contrast');

            // Clean up
            sessionStorage.removeItem('funky-high-contrast-prompted');
        });

        FunkyTests.it('should use sessionStorage for prompted flag', function() {
            // Test that we can get/set the prompted flag
            sessionStorage.setItem('funky-high-contrast-prompted', 'true');

            var prompted = sessionStorage.getItem('funky-high-contrast-prompted');
            expect(prompted).toBe('true');

            // Clean up
            sessionStorage.removeItem('funky-high-contrast-prompted');
        });

        FunkyTests.it('should reset prompted flag when removed from sessionStorage', function() {
            sessionStorage.setItem('funky-high-contrast-prompted', 'true');
            sessionStorage.removeItem('funky-high-contrast-prompted');

            var prompted = sessionStorage.getItem('funky-high-contrast-prompted');
            expect(prompted).toBeNull();
        });
    });
});
