/**
 * Tests for Funky.FilterToolbar component
 *
 * FilterToolbar manages saved filters dropdown, URL persistence,
 * and filter state management for data tables.
 */
FunkyTests.describe('Funky.Component.FilterToolbar', function() {
    'use strict';

    var FilterToolbar = Funky.FilterToolbar;
    var expect = FunkyTests.expect;
    var spyOn = FunkyTests.spyOn;
    var fixture;
    var testCounter = 0;

    /**
     * Generate unique IDs for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        return (prefix || 'filter-toolbar') + '-test-' + unique;
    }

    FunkyTests.beforeEach(function() {
        var containerId = uniqueId('toolbar');
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '">' +
            '  <div class="saved-filter-dropdown"></div>' +
            '  <button class="filter-toggle-btn">Toggle</button>' +
            '</div>'
        );
        fixture.containerId = containerId;
    });

    FunkyTests.afterEach(function() {
        // Clean up instances (FilterToolbar uses plain object)
        if (FilterToolbar._instances) {
            Object.keys(FilterToolbar._instances).forEach(function(key) {
                var instance = FilterToolbar._instances[key];
                if (instance && typeof instance.destroy === 'function') {
                    try {
                        instance.destroy();
                    } catch (e) {
                        // May already be destroyed
                    }
                }
            });
        }

        // Clear URL params
        var url = new URL(window.location);
        var keysToDelete = [];
        url.searchParams.forEach(function(value, key) {
            if (key.startsWith('filter_')) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(function(key) {
            url.searchParams.delete(key);
        });
        window.history.replaceState({}, '', url);

        fixture.cleanup();
    });

    // =========================================================================
    // Module Structure Tests
    // =========================================================================

    FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be registered in Funky namespace', function() {
            expect(Funky.FilterToolbar).toBeDefined();
        });

        FunkyTests.it('should have create factory method', function() {
            expect(typeof FilterToolbar.create).toBe('function');
        });

        FunkyTests.it('should have getInstance method', function() {
            expect(typeof FilterToolbar.getInstance).toBe('function');
        });

        FunkyTests.it('should have setData method (Bindable Interface)', function() {
            expect(typeof FilterToolbar.setData).toBe('function');
        });

        FunkyTests.it('should have getData method (Bindable Interface)', function() {
            expect(typeof FilterToolbar.getData).toBe('function');
        });

        FunkyTests.it('should have _instances registry', function() {
            expect(typeof FilterToolbar._instances).toBe('object');
        });

        FunkyTests.it('should have constructor property', function() {
            expect(typeof FilterToolbar.constructor).toBe('function');
        });
    });

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    FunkyTests.describe('Constructor', function() {

        FunkyTests.it('should create instance with default config', function() {
            var toolbar = FilterToolbar.create({});
            expect(toolbar).toBeDefined();
            expect(toolbar.config.context).toBe('default');
        });

        FunkyTests.it('should accept custom context', function() {
            var toolbar = FilterToolbar.create({
                context: 'trades',
                toolbarSelector: '#' + fixture.containerId
            });
            expect(toolbar.config.context).toBe('trades');
        });

        FunkyTests.it('should accept toolbar selector', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId
            });
            expect(toolbar.config.toolbarSelector).toBe('#' + fixture.containerId);
        });

        FunkyTests.it('should accept onFilterChange callback', function() {
            var callback = function() {};
            var toolbar = FilterToolbar.create({
                onFilterChange: callback
            });
            expect(toolbar.config.onFilterChange).toBe(callback);
        });

        FunkyTests.it('should default savedFiltersEnabled to true', function() {
            var toolbar = FilterToolbar.create({});
            expect(toolbar.config.savedFiltersEnabled).toBe(true);
        });

        FunkyTests.it('should default quickFiltersEnabled to true', function() {
            var toolbar = FilterToolbar.create({});
            expect(toolbar.config.quickFiltersEnabled).toBe(true);
        });

        FunkyTests.it('should default persistToUrl to true', function() {
            var toolbar = FilterToolbar.create({});
            expect(toolbar.config.persistToUrl).toBe(true);
        });

        FunkyTests.it('should initialize savedFilters as empty array', function() {
            var toolbar = FilterToolbar.create({});
            expect(toolbar.savedFilters).toEqual([]);
        });

        FunkyTests.it('should initialize activeFilterId as null', function() {
            var toolbar = FilterToolbar.create({});
            expect(toolbar.activeFilterId).toBeNull();
        });

        FunkyTests.it('should initialize currentFilters as empty object', function() {
            var toolbar = FilterToolbar.create({});
            expect(toolbar.currentFilters).toEqual({});
        });
    });

    // =========================================================================
    // Instance Registry Tests
    // =========================================================================

    FunkyTests.describe('Instance Registry', function() {

        FunkyTests.it('should register instance by container ID', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId
            });

            expect(FilterToolbar._instances[fixture.containerId]).toBe(toolbar);
        });

        FunkyTests.it('should get instance by ID', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId
            });

            var retrieved = FilterToolbar.getInstance(fixture.containerId);
            expect(retrieved).toBe(toolbar);
        });

        FunkyTests.it('should return undefined for unknown ID', function() {
            var retrieved = FilterToolbar.getInstance('nonexistent-id');
            expect(retrieved).toBeUndefined();
        });

        FunkyTests.it('should remove instance on destroy', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId
            });

            toolbar.destroy();

            expect(FilterToolbar._instances[fixture.containerId]).toBeUndefined();
        });
    });

    // =========================================================================
    // setFilters Tests
    // =========================================================================

    FunkyTests.describe('setFilters', function() {

        FunkyTests.it('should set current filters', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.setFilters({ status: 'active', type: 'trade' });

            expect(toolbar.currentFilters.status).toBe('active');
            expect(toolbar.currentFilters.type).toBe('trade');
        });

        FunkyTests.it('should clear activeFilterId when filters modified', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.activeFilterId = 123;
            toolbar.setFilters({ status: 'pending' });

            expect(toolbar.activeFilterId).toBeNull();
        });

        FunkyTests.it('should replace existing filters', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.setFilters({ first: 'value1' });
            toolbar.setFilters({ second: 'value2' });

            expect(toolbar.currentFilters.first).toBeUndefined();
            expect(toolbar.currentFilters.second).toBe('value2');
        });
    });

    // =========================================================================
    // URL Persistence Tests
    // =========================================================================

    FunkyTests.describe('URL Persistence', function() {

        FunkyTests.it('should persist filters to URL', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            toolbar.currentFilters = { status: 'active', type: 'order' };
            toolbar.persistToUrl();

            var url = new URL(window.location);
            expect(url.searchParams.get('filter_status')).toBe('active');
            expect(url.searchParams.get('filter_type')).toBe('order');
        });

        FunkyTests.it('should clear existing filter params before persisting', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            // Set initial filter
            toolbar.currentFilters = { old: 'value' };
            toolbar.persistToUrl();

            // Set new filter
            toolbar.currentFilters = { new: 'value' };
            toolbar.persistToUrl();

            var url = new URL(window.location);
            expect(url.searchParams.get('filter_old')).toBeNull();
            expect(url.searchParams.get('filter_new')).toBe('value');
        });

        FunkyTests.it('should not persist empty values', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            toolbar.currentFilters = { filled: 'value', empty: '', nil: null };
            toolbar.persistToUrl();

            var url = new URL(window.location);
            expect(url.searchParams.get('filter_filled')).toBe('value');
            expect(url.searchParams.get('filter_empty')).toBeNull();
            expect(url.searchParams.get('filter_nil')).toBeNull();
        });

        FunkyTests.it('should restore filters from URL', function() {
            // Set URL params first
            var url = new URL(window.location);
            url.searchParams.set('filter_restored', 'yes');
            url.searchParams.set('filter_value', '42');
            window.history.replaceState({}, '', url);

            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            toolbar.restoreFromUrl();

            expect(toolbar.currentFilters.restored).toBe('yes');
            expect(toolbar.currentFilters.value).toBe('42');
        });

        FunkyTests.it('should call onFilterChange when restoring from URL', function() {
            var callbackFilters = null;
            var callback = function(filters) { callbackFilters = filters; };

            // Set URL params
            var url = new URL(window.location);
            url.searchParams.set('filter_test', 'callback');
            window.history.replaceState({}, '', url);

            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true,
                onFilterChange: callback
            });

            toolbar.restoreFromUrl();

            expect(callbackFilters).not.toBeNull();
            expect(callbackFilters.test).toBe('callback');
        });

        FunkyTests.it('should not restore if no filter params in URL', function() {
            // Clear URL
            var url = new URL(window.location);
            url.search = '';
            window.history.replaceState({}, '', url);

            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            toolbar.currentFilters = { existing: 'value' };
            toolbar.restoreFromUrl();

            // Should keep existing filters (not replaced with empty)
            expect(toolbar.currentFilters.existing).toBe('value');
        });
    });

    // =========================================================================
    // getFilterLink Tests
    // =========================================================================

    FunkyTests.describe('getFilterLink', function() {

        FunkyTests.it('should return current URL with filters', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            toolbar.currentFilters = { share: 'this' };
            var link = toolbar.getFilterLink();

            expect(link).toContain('filter_share=this');
        });

        FunkyTests.it('should return full URL', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            toolbar.currentFilters = { id: '123' };
            var link = toolbar.getFilterLink();

            expect(link).toContain(window.location.origin);
        });
    });

    // =========================================================================
    // Bindable Interface Tests
    // =========================================================================

    FunkyTests.describe('Bindable Interface', function() {

        FunkyTests.it('should setData by container ID', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            FilterToolbar.setData(fixture.containerId, { bound: 'data' });

            expect(toolbar.currentFilters.bound).toBe('data');
        });

        FunkyTests.it('should getData by container ID', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.currentFilters = { get: 'this' };
            toolbar.activeFilterId = 456;
            toolbar.savedFilters = [{ id: 1 }];

            var data = FilterToolbar.getData(fixture.containerId);

            expect(data.filters.get).toBe('this');
            expect(data.activeFilterId).toBe(456);
            expect(data.savedFilters.length).toBe(1);
        });

        FunkyTests.it('should return empty data for unknown container', function() {
            var data = FilterToolbar.getData('unknown-container');

            expect(data.filters).toEqual({});
            expect(data.activeFilterId).toBeNull();
            expect(data.savedFilters).toEqual([]);
        });

        FunkyTests.it('should trigger onFilterChange via setData', function() {
            var callbackCalled = false;
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false,
                onFilterChange: function() { callbackCalled = true; }
            });

            FilterToolbar.setData(fixture.containerId, { trigger: 'callback' });

            expect(callbackCalled).toBe(true);
        });
    });

    // =========================================================================
    // loadFilter Tests
    // =========================================================================

    FunkyTests.describe('loadFilter', function() {

        FunkyTests.it('should set activeFilterId', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.savedFilters = [
                { id: 1, name: 'Test Filter', filter_config: { status: 'active' } }
            ];

            toolbar.loadFilter(1);

            expect(toolbar.activeFilterId).toBe(1);
        });

        FunkyTests.it('should set currentFilters from saved filter', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.savedFilters = [
                { id: 2, name: 'My Filter', filter_config: { type: 'order', status: 'pending' } }
            ];

            toolbar.loadFilter(2);

            expect(toolbar.currentFilters.type).toBe('order');
            expect(toolbar.currentFilters.status).toBe('pending');
        });

        FunkyTests.it('should call onFilterChange callback', function() {
            var callbackFilters = null;
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false,
                onFilterChange: function(filters) { callbackFilters = filters; }
            });

            toolbar.savedFilters = [
                { id: 3, name: 'Callback Filter', filter_config: { loaded: 'yes' } }
            ];

            toolbar.loadFilter(3);

            expect(callbackFilters).not.toBeNull();
            expect(callbackFilters.loaded).toBe('yes');
        });

        FunkyTests.it('should not crash for unknown filter ID', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.savedFilters = [];

            expect(function() {
                toolbar.loadFilter(999);
            }).not.toThrow();
        });

        FunkyTests.it('should handle empty filter_config', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.savedFilters = [
                { id: 4, name: 'Empty Filter', filter_config: null }
            ];

            toolbar.loadFilter(4);

            expect(toolbar.currentFilters).toEqual({});
        });
    });

    // =========================================================================
    // destroy Tests
    // =========================================================================

    FunkyTests.describe('destroy', function() {

        FunkyTests.it('should clear savedFilters', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId
            });

            toolbar.savedFilters = [{ id: 1 }, { id: 2 }];
            toolbar.destroy();

            expect(toolbar.savedFilters).toEqual([]);
        });

        FunkyTests.it('should clear currentFilters', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId
            });

            toolbar.currentFilters = { clear: 'me' };
            toolbar.destroy();

            expect(toolbar.currentFilters).toEqual({});
        });

        FunkyTests.it('should unregister from _instances', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId
            });

            expect(FilterToolbar._instances[fixture.containerId]).toBe(toolbar);

            toolbar.destroy();

            expect(FilterToolbar._instances[fixture.containerId]).toBeUndefined();
        });
    });

    // =========================================================================
    // Edge Cases Tests
    // =========================================================================

    FunkyTests.describe('Edge Cases', function() {

        FunkyTests.it('should handle filter values with special characters', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: true
            });

            toolbar.currentFilters = { query: 'hello world & more' };
            toolbar.persistToUrl();

            var url = new URL(window.location);
            var value = url.searchParams.get('filter_query');
            expect(value).toBe('hello world & more');
        });

        FunkyTests.it('should handle numeric filter values', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.setFilters({ count: 42, price: 99.99 });

            expect(toolbar.currentFilters.count).toBe(42);
            expect(toolbar.currentFilters.price).toBe(99.99);
        });

        FunkyTests.it('should handle boolean filter values', function() {
            var toolbar = FilterToolbar.create({
                toolbarSelector: '#' + fixture.containerId,
                persistToUrl: false
            });

            toolbar.setFilters({ active: true, deleted: false });

            expect(toolbar.currentFilters.active).toBe(true);
            expect(toolbar.currentFilters.deleted).toBe(false);
        });

        FunkyTests.it('should handle multiple instances', function() {
            var id1 = uniqueId('toolbar1');
            var id2 = uniqueId('toolbar2');

            fixture.el.innerHTML +=
                '<div id="' + id1 + '"><div class="saved-filter-dropdown"></div></div>' +
                '<div id="' + id2 + '"><div class="saved-filter-dropdown"></div></div>';

            var toolbar1 = FilterToolbar.create({
                toolbarSelector: '#' + id1,
                context: 'context1',
                persistToUrl: false
            });

            var toolbar2 = FilterToolbar.create({
                toolbarSelector: '#' + id2,
                context: 'context2',
                persistToUrl: false
            });

            toolbar1.setFilters({ instance: 'one' });
            toolbar2.setFilters({ instance: 'two' });

            expect(toolbar1.currentFilters.instance).toBe('one');
            expect(toolbar2.currentFilters.instance).toBe('two');

            toolbar1.destroy();
            toolbar2.destroy();
        });
    });
});
