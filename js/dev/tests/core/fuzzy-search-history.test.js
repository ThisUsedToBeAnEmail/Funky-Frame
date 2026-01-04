/**
 * Funky.FuzzySearch.History Tests
 *
 * Tests for the optional recent searches feature in FuzzySearch.
 * Validates History integration for tracking search queries.
 */

describe('Funky.Core.FuzzySearch.History', function() {

    var FuzzySearch = Funky.FuzzySearch;
    var History = Funky.History;
    var testKey;
    var testCounter = 0;

    beforeEach(function() {
        // Use counter + timestamp + random to ensure unique keys
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        testKey = 'test_fuzzy_' + unique;
    });

    afterEach(function() {
        // Clean up history instance
        History.destroy(testKey);
        // Clean up localStorage - Storage uses 'funky_' prefix
        localStorage.removeItem('funky_' + testKey);
    });

    describe('DEFAULTS', function() {

        it('has recentKey default as null', function() {
            expect(FuzzySearch.DEFAULTS.recentKey).toBe(null);
        });

        it('has maxRecent default as 5', function() {
            expect(FuzzySearch.DEFAULTS.maxRecent).toBe(5);
        });

        it('has showRecent default as true', function() {
            expect(FuzzySearch.DEFAULTS.showRecent).toBe(true);
        });

        it('has recentLabel default as "Recent"', function() {
            expect(FuzzySearch.DEFAULTS.recentLabel).toBe('Recent');
        });

        it('has onRecentSelect default as null', function() {
            expect(FuzzySearch.DEFAULTS.onRecentSelect).toBe(null);
        });

    });

    describe('Feature disabled (no recentKey)', function() {

        it('addToRecent does nothing without recentKey', function() {
            var fuzzy = FuzzySearch.create({});

            fuzzy.addToRecent('test query');

            expect(fuzzy.getRecent()).toEqual([]);
        });

        it('getRecent returns empty array without recentKey', function() {
            var fuzzy = FuzzySearch.create({});

            expect(fuzzy.getRecent()).toEqual([]);
        });

        it('clearRecent does not throw without recentKey', function() {
            var fuzzy = FuzzySearch.create({});

            expect(function() {
                fuzzy.clearRecent();
            }).not.toThrow();
        });

        it('searchWithRecent returns empty when no recentKey', function() {
            var fuzzy = FuzzySearch.create({});
            var items = [{ name: 'apple' }, { name: 'banana' }];

            var result = fuzzy.searchWithRecent('', items);

            expect(result.results).toEqual([]);
            expect(result.recent).toEqual([]);
            expect(result.isRecent).toBe(false);
        });

    });

    describe('addToRecent()', function() {

        it('adds query to history', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('test query');

            expect(fuzzy.getRecent().length).toBe(1);
            expect(fuzzy.getRecent()[0]).toBe('test query');
        });

        it('trims whitespace from query', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('  trimmed  ');

            expect(fuzzy.getRecent()[0]).toBe('trimmed');
        });

        it('ignores queries shorter than 2 characters', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('a');
            fuzzy.addToRecent('');
            fuzzy.addToRecent(' ');

            expect(fuzzy.getRecent()).toEqual([]);
        });

        it('ignores null query', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent(null);

            expect(fuzzy.getRecent()).toEqual([]);
        });

        it('ignores non-string query', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent(123);
            fuzzy.addToRecent({ query: 'test' });

            expect(fuzzy.getRecent()).toEqual([]);
        });

        it('most recent query appears first', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('first');
            fuzzy.addToRecent('second');
            fuzzy.addToRecent('third');

            var recent = fuzzy.getRecent();
            expect(recent[0]).toBe('third');
            expect(recent[1]).toBe('second');
            expect(recent[2]).toBe('first');
        });

        it('duplicate queries move to front', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('apple');
            fuzzy.addToRecent('banana');
            fuzzy.addToRecent('apple');

            var recent = fuzzy.getRecent();
            expect(recent[0]).toBe('apple');
            expect(recent.length).toBe(2);
        });

    });

    describe('maxRecent limit', function() {

        it('respects maxRecent option', function() {
            var fuzzy = FuzzySearch.create({
                recentKey: testKey,
                maxRecent: 3
            });

            fuzzy.addToRecent('one');
            fuzzy.addToRecent('two');
            fuzzy.addToRecent('three');
            fuzzy.addToRecent('four');
            fuzzy.addToRecent('five');

            expect(fuzzy.getRecent().length).toBe(3);
        });

        it('keeps most recent when limit exceeded', function() {
            var fuzzy = FuzzySearch.create({
                recentKey: testKey,
                maxRecent: 2
            });

            fuzzy.addToRecent('old');
            fuzzy.addToRecent('newer');
            fuzzy.addToRecent('newest');

            var recent = fuzzy.getRecent();
            expect(recent).toContain('newest');
            expect(recent).toContain('newer');
            expect(recent).not.toContain('old');
        });

        it('uses default maxRecent of 5', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            for (var i = 0; i < 10; i++) {
                fuzzy.addToRecent('query' + i);
            }

            expect(fuzzy.getRecent().length).toBe(5);
        });

    });

    describe('getRecent()', function() {

        it('returns empty array when no history', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            expect(fuzzy.getRecent()).toEqual([]);
        });

        it('returns array of queries', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('query one');
            fuzzy.addToRecent('query two');

            var recent = fuzzy.getRecent();
            expect(Array.isArray(recent)).toBe(true);
            expect(recent.length).toBe(2);
        });

    });

    describe('clearRecent()', function() {

        it('clears all recent queries', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('one');
            fuzzy.addToRecent('two');
            fuzzy.addToRecent('three');

            fuzzy.clearRecent();

            expect(fuzzy.getRecent()).toEqual([]);
        });

        it('allows adding new queries after clear', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('before');
            fuzzy.clearRecent();
            fuzzy.addToRecent('after');

            expect(fuzzy.getRecent()).toEqual(['after']);
        });

    });

    describe('searchWithRecent()', function() {

        var items;

        beforeEach(function() {
            items = [
                { name: 'apple', id: 1 },
                { name: 'banana', id: 2 },
                { name: 'cherry', id: 3 }
            ];
        });

        it('returns search results when query provided', function() {
            var fuzzy = FuzzySearch.create({
                recentKey: testKey,
                keys: ['name']
            });

            var result = fuzzy.searchWithRecent('app', items);

            expect(result.isRecent).toBe(false);
            expect(result.recent).toEqual([]);
            expect(result.results.length).toBeGreaterThan(0);
        });

        it('returns recent when query is empty', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('previous search');

            var result = fuzzy.searchWithRecent('', items);

            expect(result.isRecent).toBe(true);
            expect(result.recent).toContain('previous search');
            expect(result.results).toEqual([]);
        });

        it('returns recent when query is whitespace', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('test');

            var result = fuzzy.searchWithRecent('   ', items);

            expect(result.isRecent).toBe(true);
        });

        it('returns empty when showRecent is false', function() {
            var fuzzy = FuzzySearch.create({
                recentKey: testKey,
                showRecent: false
            });

            fuzzy.addToRecent('test query');

            var result = fuzzy.searchWithRecent('', items);

            expect(result.isRecent).toBe(false);
            expect(result.recent).toEqual([]);
        });

        it('returns structure with results, recent, isRecent', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            var result = fuzzy.searchWithRecent('test', items);

            expect(result).toHaveProperty('results');
            expect(result).toHaveProperty('recent');
            expect(result).toHaveProperty('isRecent');
        });

    });

    describe('Persistence', function() {

        it('persists recent to localStorage', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            fuzzy.addToRecent('persisted query');

            // Storage uses 'funky_' prefix
            var stored = localStorage.getItem('funky_' + testKey);
            expect(stored).not.toBe(null);
        });

        it('loads recent from localStorage on new instance', function() {
            // First instance
            var fuzzy1 = FuzzySearch.create({ recentKey: testKey });
            fuzzy1.addToRecent('remembered');

            // Destroy history but keep localStorage
            History.destroy(testKey);

            // New instance
            var fuzzy2 = FuzzySearch.create({ recentKey: testKey });

            expect(fuzzy2.getRecent()).toContain('remembered');

            // Cleanup
            History.destroy(testKey);
        });

    });

    describe('getOptions()', function() {

        it('returns instance options', function() {
            var fuzzy = FuzzySearch.create({
                recentKey: testKey,
                maxRecent: 8,
                threshold: 0.5
            });

            var opts = fuzzy.getOptions();

            expect(opts.recentKey).toBe(testKey);
            expect(opts.maxRecent).toBe(8);
            expect(opts.threshold).toBe(0.5);
        });

        it('returns copy not reference', function() {
            var fuzzy = FuzzySearch.create({ recentKey: testKey });

            var opts = fuzzy.getOptions();
            opts.recentKey = 'modified';

            expect(fuzzy.getOptions().recentKey).toBe(testKey);
        });

    });

});
