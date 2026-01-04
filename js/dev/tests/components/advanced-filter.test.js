/**
 * Funky.AdvancedFilter Tests
 *
 * Tests for the comprehensive filtering system with URL persistence,
 * saved filter templates, and responsive UI.
 */

describe('Funky.Component.AdvancedFilter', function() {

    var AdvancedFilter = Funky.AdvancedFilter;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        // Clean up modals
        var modal = document.getElementById('advancedFilterModal');
        if (modal) {
            modal.remove();
        }
        // Clean up backdrops
        var backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(function(b) { b.remove(); });

        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('AdvancedFilter')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof AdvancedFilter.create).toBe('function');
        });

        it('has init method', function() {
            expect(typeof AdvancedFilter.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof AdvancedFilter.getInstance).toBe('function');
        });

        it('has setData method', function() {
            expect(typeof AdvancedFilter.setData).toBe('function');
        });

        it('has getData method', function() {
            expect(typeof AdvancedFilter.getData).toBe('function');
        });

        it('has constructor exposed', function() {
            expect(typeof AdvancedFilter.constructor).toBe('function');
        });

        it('has _instances registry', function() {
            expect(typeof AdvancedFilter._instances).toBe('object');
        });

    });

    describe('Instance creation', function() {

        it('creates instance with config', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters',
                optionsEndpoint: '/api/filter_options',
                dataTable: null
            });

            expect(instance).toBeDefined();
            expect(instance.config.context).toBe('test_filters');
        });

        it('stores dataTable reference', function() {
            var mockDataTable = { draw: function() {} };
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters',
                dataTable: mockDataTable
            });

            expect(instance.dataTable).toBe(mockDataTable);
        });

        it('initializes filterParams as empty object', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters'
            });

            expect(instance.filterParams).toBeDefined();
            expect(typeof instance.filterParams).toBe('object');
        });

        it('sets default savedFiltersEndpoint', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters'
            });

            expect(instance.config.savedFiltersEndpoint).toBe('/api/saved_filters');
        });

        it('uses custom savedFiltersEndpoint', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters',
                savedFiltersEndpoint: '/custom/filters'
            });

            expect(instance.config.savedFiltersEndpoint).toBe('/custom/filters');
        });

    });

    describe('create() factory', function() {

        it('creates new instance', function() {
            var instance = AdvancedFilter.create({
                context: 'factory_test'
            });

            expect(instance).toBeDefined();
            expect(instance instanceof AdvancedFilter.constructor).toBe(true);
        });

        it('registers instance in _instances', function() {
            var context = 'registry_test_' + Date.now();
            var instance = AdvancedFilter.create({
                context: context
            });

            expect(AdvancedFilter._instances[context]).toBe(instance);
        });

    });

    describe('getInstance()', function() {

        it('returns registered instance', function() {
            var context = 'get_instance_test_' + Date.now();
            var instance = AdvancedFilter.create({
                context: context
            });

            var retrieved = AdvancedFilter.getInstance(context);
            expect(retrieved).toBe(instance);
        });

        it('returns undefined for non-existent context', function() {
            var result = AdvancedFilter.getInstance('non_existent_' + Date.now());
            expect(result).toBeUndefined();
        });

    });

    describe('getSavedFiltersUrl()', function() {

        it('returns base URL without ID', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters'
            });

            var url = instance.getSavedFiltersUrl();
            expect(url).toContain('/api/saved_filters');
            expect(url).toContain('context=test_filters');
        });

        it('includes ID in URL when provided', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters'
            });

            var url = instance.getSavedFiltersUrl(123);
            expect(url).toContain('/api/saved_filters/123');
        });

        it('uses custom endpoint without context param', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'test_filters',
                savedFiltersEndpoint: '/custom/filters'
            });

            var url = instance.getSavedFiltersUrl();
            expect(url).toBe('/custom/filters');
            expect(url).not.toContain('context=');
        });

    });

    describe('setData()', function() {

        it('returns false for non-existent context', function() {
            var result = AdvancedFilter.setData('non_existent_context', {});
            expect(result).toBe(false);
        });

        it('returns true for existing instance', function() {
            var context = 'setdata_test_' + Date.now();
            AdvancedFilter.create({ context: context });

            var result = AdvancedFilter.setData(context, { filters: {} });
            expect(result).toBe(true);
        });

    });

    describe('getData()', function() {

        it('returns null for non-existent context', function() {
            var result = AdvancedFilter.getData('non_existent_' + Date.now());
            expect(result).toBeNull();
        });

        it('returns data for existing instance', function() {
            var context = 'getdata_test_' + Date.now();
            AdvancedFilter.create({ context: context });

            var data = AdvancedFilter.getData(context);
            expect(data).not.toBeNull();
            expect(data.context).toBe(context);
        });

        it('includes filters in returned data', function() {
            var context = 'getdata_filters_test_' + Date.now();
            AdvancedFilter.create({ context: context });

            var data = AdvancedFilter.getData(context);
            expect(data.filters).toBeDefined();
        });

        it('includes hasActiveFilters flag', function() {
            var context = 'getdata_active_test_' + Date.now();
            AdvancedFilter.create({ context: context });

            var data = AdvancedFilter.getData(context);
            expect(typeof data.hasActiveFilters).toBe('boolean');
        });

    });

    describe('Instance getData()', function() {

        it('returns context', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'instance_getdata_test'
            });

            var data = instance.getData();
            expect(data.context).toBe('instance_getdata_test');
        });

        it('returns filters object', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'instance_filters_test'
            });

            var data = instance.getData();
            expect(data.filters).toBeDefined();
            expect(typeof data.filters).toBe('object');
        });

        it('returns cloned filters (not reference)', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'clone_test'
            });

            instance.filterParams = { status: ['active'] };

            var data = instance.getData();
            data.filters.status = ['modified'];

            expect(instance.filterParams.status).toEqual(['active']);
        });

        it('returns hasActiveFilters based on filterParams', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'has_active_test'
            });

            var dataEmpty = instance.getData();
            expect(dataEmpty.hasActiveFilters).toBe(false);

            instance.filterParams = { status: ['active'] };
            var dataWithFilters = instance.getData();
            expect(dataWithFilters.hasActiveFilters).toBe(true);
        });

    });

    describe('Instance setData()', function() {

        it('sets filter parameters', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'instance_setdata_test'
            });

            instance.setData({
                filters: {
                    status: ['active', 'pending'],
                    type: ['trade']
                }
            });

            expect(instance.filterParams.status).toEqual(['active', 'pending']);
            expect(instance.filterParams.type).toEqual(['trade']);
        });

    });

    describe('Configuration options', function() {

        it('stores existingFilters', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'existing_filters_test',
                existingFilters: { status: ['active'] }
            });

            expect(instance.existingFilters).toEqual({ status: ['active'] });
        });

        it('defaults existingFilters to empty object', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'no_existing_test'
            });

            expect(instance.existingFilters).toEqual({});
        });

        it('stores optionsEndpoint', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'options_endpoint_test',
                optionsEndpoint: '/api/my_options'
            });

            expect(instance.config.optionsEndpoint).toBe('/api/my_options');
        });

        it('has cache duration of 5 minutes', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'cache_test'
            });

            expect(instance.cacheDuration).toBe(5 * 60 * 1000);
        });

    });

    describe('init() with button', function() {

        it('derives context from entityType', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'trade'
            });

            var data = instance.getData();
            expect(data.context).toBe('trade_filters');
        });

        it('derives context from trade_action entityType', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'trade_action'
            });

            var data = instance.getData();
            expect(data.context).toBe('trade_action_filters');
        });

        it('derives context from custom entityType', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'custom_entity'
            });

            var data = instance.getData();
            expect(data.context).toBe('custom_entity_filters');
        });

        it('uses explicit context over entityType', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'trade',
                context: 'explicit_context'
            });

            var data = instance.getData();
            expect(data.context).toBe('explicit_context');
        });

        it('derives optionsEndpoint from entityType', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'trade'
            });

            expect(instance.config.optionsEndpoint).toBe('/api/filter_options?entity=trade');
        });

        it('uses explicit optionsEndpoint', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'trade',
                optionsEndpoint: '/custom/options'
            });

            expect(instance.config.optionsEndpoint).toBe('/custom/options');
        });

        it('stores onApply callback', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var applyFn = function() {};
            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'trade',
                onApply: applyFn
            });

            expect(instance.config.onApply).toBe(applyFn);
        });

        it('stores onClear callback', function() {
            fixture.html('<button id="filterBtn">Filter</button>');

            var clearFn = function() {};
            var instance = AdvancedFilter.init('#filterBtn', {
                entityType: 'trade',
                onClear: clearFn
            });

            expect(instance.config.onClear).toBe(clearFn);
        });

    });

    describe('Modal creation', function() {

        it('creates modal in DOM', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'modal_test_' + Date.now()
            });

            var modal = document.getElementById('advancedFilterModal');
            expect(modal).not.toBeNull();
        });

        it('modal has correct aria attributes', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'modal_aria_test_' + Date.now()
            });

            var modal = document.getElementById('advancedFilterModal');
            expect(modal.getAttribute('aria-labelledby')).toBe('advancedFilterModalLabel');
            expect(modal.getAttribute('aria-hidden')).toBe('true');
        });

        it('modal has apply button', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'apply_btn_test_' + Date.now()
            });

            var applyBtn = document.getElementById('applyFiltersBtn');
            expect(applyBtn).not.toBeNull();
        });

        it('modal has clear button', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'clear_btn_test_' + Date.now()
            });

            var clearBtn = document.getElementById('clearFiltersBtn');
            expect(clearBtn).not.toBeNull();
        });

        it('modal has save button', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'save_btn_test_' + Date.now()
            });

            var saveBtn = document.getElementById('saveFilterBtn');
            expect(saveBtn).not.toBeNull();
        });

        it('modal has search field', function() {
            var instance = new AdvancedFilter.constructor({
                context: 'search_field_test_' + Date.now()
            });

            var searchField = document.getElementById('filterFieldSearch');
            expect(searchField).not.toBeNull();
        });

        it('does not create duplicate modals', function() {
            new AdvancedFilter.constructor({ context: 'dup_test_1' });
            new AdvancedFilter.constructor({ context: 'dup_test_2' });

            var modals = document.querySelectorAll('#advancedFilterModal');
            expect(modals.length).toBe(1);
        });

    });

    describe('Accessibility', function() {

        it('modal has tabindex=-1', function() {
            new AdvancedFilter.constructor({
                context: 'tabindex_test_' + Date.now()
            });

            var modal = document.getElementById('advancedFilterModal');
            expect(modal.getAttribute('tabindex')).toBe('-1');
        });

        it('filter form has role=search', function() {
            new AdvancedFilter.constructor({
                context: 'form_role_test_' + Date.now()
            });

            var form = document.getElementById('advancedFilterForm');
            expect(form.getAttribute('role')).toBe('search');
        });

        it('search field has aria-label', function() {
            new AdvancedFilter.constructor({
                context: 'search_aria_test_' + Date.now()
            });

            var searchField = document.getElementById('filterFieldSearch');
            expect(searchField.getAttribute('aria-label')).toBe('Search filter fields');
        });

        it('saved filters list has role=list', function() {
            new AdvancedFilter.constructor({
                context: 'list_role_test_' + Date.now()
            });

            var list = document.getElementById('savedFiltersList');
            expect(list.getAttribute('role')).toBe('list');
        });

    });

});
