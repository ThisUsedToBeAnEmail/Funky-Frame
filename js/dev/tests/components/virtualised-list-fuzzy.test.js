/**
 * Funky.VirtualisedList Fuzzy Search Tests
 *
 * Tests for fuzzy search integration in the VirtualisedList component.
 * Tests the fuzzySearch, fuzzyThreshold, and fuzzyTokenize options.
 */

describe('Funky.Component.VirtualisedList.FuzzySearch', function() {

    var VirtualisedList = Funky.VirtualisedList;
    var FuzzySearch = Funky.FuzzySearch;
    var fixture;
    var list;

    // Sample data with varied names for fuzzy matching
    var sampleItems = [
        { id: 'item-1', name: 'User Settings', category: 'config' },
        { id: 'item-2', name: 'Dashboard', category: 'main' },
        { id: 'item-3', name: 'Profile Editor', category: 'user' },
        { id: 'item-4', name: 'System Configuration', category: 'config' },
        { id: 'item-5', name: 'Project Manager', category: 'tools' },
        { id: 'item-6', name: 'Settings Panel', category: 'config' },
        { id: 'item-7', name: 'User Preferences', category: 'user' },
        { id: 'item-8', name: 'Database Admin', category: 'admin' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="vlist-fuzzy" style="height: 300px; overflow: auto;"></div>'
        );
    });

    afterEach(function() {
        if (list && typeof list.destroy === 'function') {
            list.destroy();
            list = null;
        }
        VirtualisedList.destroyAll();
        fixture.destroy();
    });

    describe('FuzzySearch availability', function() {

        it('Funky.FuzzySearch is available', function() {
            expect(FuzzySearch).toBeDefined();
        });

        it('FuzzySearch.match is available', function() {
            expect(typeof FuzzySearch.match).toBe('function');
        });

        it('FuzzySearch.search is available', function() {
            expect(typeof FuzzySearch.search).toBe('function');
        });

    });

    describe('Configuration options', function() {

        it('accepts fuzzySearch option', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name']
            });

            expect(list).toBeDefined();
            expect(list.config.fuzzySearch).toBe(true);
        });

        it('accepts fuzzyThreshold option', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                fuzzyThreshold: 0.5,
                searchFields: ['name']
            });

            expect(list.config.fuzzyThreshold).toBe(0.5);
        });

        it('accepts fuzzyTokenize option', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                fuzzyTokenize: true,
                searchFields: ['name']
            });

            expect(list.config.fuzzyTokenize).toBe(true);
        });

        it('defaults fuzzySearch to false', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                searchFields: ['name']
            });

            expect(list.config.fuzzySearch).toBe(false);
        });

        it('defaults fuzzyThreshold to 0.3', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name']
            });

            expect(list.config.fuzzyThreshold).toBe(0.3);
        });

    });

    describe('Fuzzy search behavior', function() {

        it('matches partial/fuzzy queries', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name']
            });

            // 'usr' should fuzzy match 'User Settings'
            list.search('usr');

            expect(list.searchMatches.length).toBeGreaterThan(0);
        });

        it('matches misspelled queries', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                fuzzyThreshold: 0.2,
                searchFields: ['name']
            });

            // 'settngs' should fuzzy match 'Settings'
            list.search('settngs');

            expect(list.searchMatches.length).toBeGreaterThan(0);
        });

        it('populates searchResults with score data', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name']
            });

            list.search('user');

            expect(list.searchResults).toBeDefined();
            expect(list.searchResults.length).toBeGreaterThan(0);
            if (list.searchResults.length > 0) {
                expect(typeof list.searchResults[0].score).toBe('number');
            }
        });

        it('sorts results by score descending', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name']
            });

            list.search('user');

            if (list.searchResults.length >= 2) {
                for (var i = 1; i < list.searchResults.length; i++) {
                    expect(list.searchResults[i - 1].score >= list.searchResults[i].score).toBe(true);
                }
            }
        });

        it('respects fuzzyThreshold', function() {
            // High threshold should filter out weak matches
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                fuzzyThreshold: 0.9,
                searchFields: ['name']
            });

            // 'usr' won't score 0.9 against 'User Settings'
            list.search('usr');

            // With high threshold, should get fewer matches
            var highThresholdCount = list.searchMatches.length;

            list.destroy();

            // Low threshold
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                fuzzyThreshold: 0.1,
                searchFields: ['name']
            });

            list.search('usr');
            var lowThresholdCount = list.searchMatches.length;

            expect(lowThresholdCount >= highThresholdCount).toBe(true);
        });

    });

    describe('Tokenized fuzzy search', function() {

        it('matches multiple tokens', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                fuzzyTokenize: true,
                searchFields: ['name']
            });

            // 'user pref' should match 'User Preferences'
            list.search('user pref');

            expect(list.searchMatches.length).toBeGreaterThan(0);
        });

        it('matches tokens in any order', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                fuzzyTokenize: true,
                searchFields: ['name']
            });

            // 'manager project' should match 'Project Manager'
            list.search('manager project');

            expect(list.searchMatches.length).toBeGreaterThan(0);
        });

    });

    describe('Search events with fuzzy', function() {

        it('emits search event with match count', function() {
            var matchCount = null;
            var searchQuery = null;

            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name'],
                onSearch: function(matches, query) {
                    matchCount = matches;
                    searchQuery = query;
                }
            });

            list.search('user');

            // onSearch callback receives (matchCount, query) not an object
            expect(matchCount).toBeGreaterThan(0);
            expect(searchQuery).toBe('user');
        });

    });

    describe('Clear search', function() {

        it('clearSearch resets searchResults', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name']
            });

            list.search('user');
            expect(list.searchResults.length).toBeGreaterThan(0);

            list.clearSearch();
            expect(list.searchResults.length).toBe(0);
        });

        it('clearSearch resets searchMatches', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name']
            });

            list.search('user');
            expect(list.searchMatches.length).toBeGreaterThan(0);

            list.clearSearch();
            expect(list.searchMatches.length).toBe(0);
        });

    });

    describe('Fallback to indexOf', function() {

        it('uses indexOf when fuzzySearch is false', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: false,
                searchFields: ['name']
            });

            // 'usr' won't match with indexOf
            list.search('usr');

            expect(list.searchMatches.length).toBe(0);
        });

        it('indexOf matches exact substrings', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: false,
                searchFields: ['name']
            });

            // 'User' should match with indexOf
            list.search('User');

            expect(list.searchMatches.length).toBeGreaterThan(0);
        });

    });

    describe('Multi-field search', function() {

        it('searches across multiple fields', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name', 'category']
            });

            // 'config' is in category field
            list.search('config');

            expect(list.searchMatches.length).toBeGreaterThan(0);
        });

        it('includes match key in searchResults', function() {
            list = VirtualisedList.init('#vlist-fuzzy', {
                items: sampleItems,
                itemHeight: 40,
                fuzzySearch: true,
                searchFields: ['name', 'category']
            });

            list.search('admin');

            if (list.searchResults.length > 0) {
                expect(list.searchResults[0].key).toBeDefined();
            }
        });

    });

});
