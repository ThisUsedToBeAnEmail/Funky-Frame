/**
 * Funky.AdvancedFilter.History Integration Tests
 *
 * Tests for the Funky.History integration with AdvancedFilter component.
 * Validates recent filters functionality using Funky.History for LRU storage.
 */

describe('Funky.Component.AdvancedFilter.History', function() {

    var AdvancedFilter = Funky.AdvancedFilter;
    var fixture;
    var instance;
    var testContext;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
        testContext = 'test_history_' + Date.now();
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

    describe('History Integration', function() {

        it('initializes recentHistory on construction', function() {
            instance = new AdvancedFilter.constructor({
                context: testContext,
                optionsEndpoint: '/api/filter_options',
                dataTable: null
            });

            expect(instance.recentHistory).toBeDefined();
        });

        it('recentHistory has expected methods', function() {
            instance = new AdvancedFilter.constructor({
                context: testContext,
                optionsEndpoint: '/api/filter_options',
                dataTable: null
            });

            expect(typeof instance.recentHistory.add).toBe('function');
            expect(typeof instance.recentHistory.getAll).toBe('function');
            expect(typeof instance.recentHistory.clear).toBe('function');
            expect(typeof instance.recentHistory.size).toBe('function');
        });

        it('has limit of 10 for recent filters', function() {
            instance = new AdvancedFilter.constructor({
                context: testContext,
                optionsEndpoint: '/api/filter_options',
                dataTable: null
            });

            // Add 15 items
            for (var i = 0; i < 15; i++) {
                instance.recentHistory.add({ params: { id: i }, label: 'Filter ' + i, timestamp: Date.now() });
            }

            expect(instance.recentHistory.size()).toBe(10);
        });

    });

    describe('saveToRecent()', function() {

        beforeEach(function() {
            instance = new AdvancedFilter.constructor({
                context: testContext,
                optionsEndpoint: '/api/filter_options',
                dataTable: null,
                multiSelectFields: ['status'],
                rangeFields: []
            });
            // Clear any existing history
            instance.recentHistory.clear();
        });

        it('adds filter to history', function() {
            var params = { status: ['active'] };

            instance.saveToRecent(params, 'Active filters');

            expect(instance.recentHistory.size()).toBe(1);
        });

        it('stores params and label', function() {
            var params = { status: ['active'] };
            var label = 'Active filters';

            instance.saveToRecent(params, label);

            var recent = instance.recentHistory.getAll();
            expect(recent[0].params).toEqual(params);
            expect(recent[0].label).toBe(label);
        });

        it('most recent filter is at beginning of list', function() {
            instance.saveToRecent({ status: ['first'] }, 'First');
            instance.saveToRecent({ status: ['second'] }, 'Second');

            var recent = instance.recentHistory.getAll();
            expect(recent[0].label).toBe('Second');
            expect(recent[1].label).toBe('First');
        });

        it('handles duplicate params via comparator', function() {
            var params = { status: ['active'] };

            instance.saveToRecent(params, 'First time');
            instance.saveToRecent(params, 'Second time');

            // Should dedupe - only one entry with matching params
            expect(instance.recentHistory.size()).toBe(1);
        });

    });

    describe('clearRecentFilters()', function() {

        beforeEach(function() {
            instance = new AdvancedFilter.constructor({
                context: testContext,
                optionsEndpoint: '/api/filter_options',
                dataTable: null,
                multiSelectFields: ['status'],
                rangeFields: []
            });
            instance.recentHistory.clear();
        });

        it('clears all recent filters', function() {
            instance.saveToRecent({ status: ['active'] }, 'Active');
            instance.saveToRecent({ status: ['pending'] }, 'Pending');

            expect(instance.recentHistory.size()).toBe(2);

            instance.clearRecentFilters();

            expect(instance.recentHistory.size()).toBe(0);
        });

        it('returns empty array after clear', function() {
            instance.saveToRecent({ status: ['active'] }, 'Active');
            instance.clearRecentFilters();

            var recent = instance.recentHistory.getAll();
            expect(recent).toEqual([]);
        });

    });

});
