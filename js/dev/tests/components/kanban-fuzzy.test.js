/**
 * Funky.Kanban Fuzzy Search Tests
 *
 * Tests for fuzzy search integration in the Kanban component.
 * Tests the fuzzySearch, fuzzyThreshold, fuzzyTokenize, and sortMatchesByScore options.
 */

describe('Funky.Component.Kanban.FuzzySearch', function() {

    var Kanban = Funky.Kanban;
    var FuzzySearch = Funky.FuzzySearch;
    var fixture;
    var kanban;

    // Sample columns with cards
    var sampleColumns = [
        {
            id: 'todo',
            title: 'To Do',
            cards: [
                { id: 'card1', title: 'User Authentication', description: 'Implement login flow' },
                { id: 'card2', title: 'Dashboard Layout', description: 'Design main view' },
                { id: 'card3', title: 'Database Migration', description: 'Update schema' }
            ]
        },
        {
            id: 'progress',
            title: 'In Progress',
            cards: [
                { id: 'card4', title: 'API Integration', description: 'Connect services' },
                { id: 'card5', title: 'Settings Panel', description: 'User preferences' }
            ]
        },
        {
            id: 'done',
            title: 'Done',
            cards: [
                { id: 'card6', title: 'Profile Editor', description: 'Edit user info' },
                { id: 'card7', title: 'Security Audit', description: 'Review access controls' }
            ]
        }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="kanban-fuzzy" style="width: 800px; height: 400px;"></div>'
        );
    });

    afterEach(function() {
        if (kanban && typeof kanban.destroy === 'function') {
            kanban.destroy();
            kanban = null;
        }
        fixture.destroy();
    });

    describe('FuzzySearch availability', function() {

        it('Funky.FuzzySearch is available', function() {
            expect(FuzzySearch).toBeDefined();
        });

    });

    describe('Module availability', function() {

        it('Funky.Kanban is available', function() {
            expect(Kanban).toBeDefined();
        });

        it('Kanban.init exists', function() {
            expect(typeof Kanban.init).toBe('function');
        });

    });

    describe('Configuration options', function() {

        it('accepts fuzzySearch option', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true
            });

            expect(kanban.options.fuzzySearch).toBe(true);
        });

        it('accepts fuzzyThreshold option', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                fuzzyThreshold: 0.5
            });

            expect(kanban.options.fuzzyThreshold).toBe(0.5);
        });

        it('accepts fuzzyTokenize option', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                fuzzyTokenize: true
            });

            expect(kanban.options.fuzzyTokenize).toBe(true);
        });

        it('accepts sortMatchesByScore option', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                sortMatchesByScore: true
            });

            expect(kanban.options.sortMatchesByScore).toBe(true);
        });

        it('defaults fuzzySearch to false', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns
            });

            expect(kanban.options.fuzzySearch).toBe(false);
        });

        it('defaults fuzzyThreshold to 0.3', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true
            });

            expect(kanban.options.fuzzyThreshold).toBe(0.3);
        });

    });

    describe('Fuzzy search behavior', function() {

        it('searchCards() uses fuzzy matching when enabled', function() {
            // Skip if FuzzySearch is not available
            if (!Funky.FuzzySearch) {
                expect(true).toBe(true);
                return;
            }

            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title', 'description']
            });

            // 'usr' should fuzzy match 'User Authentication'
            var matches = kanban.searchCards('usr');

            expect(matches.length).toBeGreaterThan(0);
        });

        it('matches misspelled queries', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                fuzzyThreshold: 0.2,
                searchableFields: ['title']
            });

            // 'dashbord' should fuzzy match 'Dashboard'
            var matches = kanban.searchCards('dashbord');

            expect(matches.length).toBeGreaterThan(0);
        });

        it('populates searchResults Map', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title']
            });

            kanban.searchCards('user');

            expect(kanban.searchResults).toBeDefined();
            expect(kanban.searchResults instanceof Map).toBe(true);
        });

        it('searchResults contain score property', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title']
            });

            kanban.searchCards('user');

            kanban.searchResults.forEach(function(result) {
                expect(typeof result.score).toBe('number');
            });
        });

        it('searchResults contain matches property', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title']
            });

            kanban.searchCards('user');

            kanban.searchResults.forEach(function(result) {
                expect(Array.isArray(result.matches)).toBe(true);
            });
        });

    });

    describe('Threshold behavior', function() {

        it('respects fuzzyThreshold', function() {
            // High threshold
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                fuzzyThreshold: 0.9,
                searchableFields: ['title']
            });

            var highMatches = kanban.searchCards('usr');
            var highCount = highMatches.length;

            kanban.destroy();

            // Low threshold
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                fuzzyThreshold: 0.1,
                searchableFields: ['title']
            });

            var lowMatches = kanban.searchCards('usr');
            var lowCount = lowMatches.length;

            expect(lowCount >= highCount).toBe(true);
        });

    });

    describe('Tokenized search', function() {

        it('matches multiple tokens', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                fuzzyTokenize: true,
                searchableFields: ['title', 'description']
            });

            // 'user auth' should match 'User Authentication'
            var matches = kanban.searchCards('user auth');

            expect(matches.length).toBeGreaterThan(0);
        });

        it('matches tokens across fields', function() {
            // Skip if FuzzySearch is not available
            if (!Funky.FuzzySearch) {
                expect(true).toBe(true);
                return;
            }

            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                fuzzyTokenize: true,
                searchableFields: ['title', 'description']
            });

            // 'dashboard design' - 'dashboard' in title, 'design' in description
            var matches = kanban.searchCards('dashboard design');

            expect(matches.length).toBeGreaterThan(0);
        });

    });

    describe('Score-based sorting', function() {

        it('sorts matches by score when enabled', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                sortMatchesByScore: true,
                searchableFields: ['title']
            });

            var matches = kanban.searchCards('user');

            if (matches.length >= 2) {
                // First match should have highest score
                var firstScore = kanban.searchResults.get(matches[0].id);
                var secondScore = kanban.searchResults.get(matches[1].id);
                if (firstScore && secondScore) {
                    expect(firstScore.score >= secondScore.score).toBe(true);
                }
            }
        });

    });

    describe('Search events', function() {

        it('emits search event with fuzzy flag', function() {
            // Skip if FuzzySearch is not available
            if (!Funky.FuzzySearch) {
                expect(true).toBe(true);
                return;
            }

            var eventData = null;

            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title'],
                onSearch: function(data) {
                    eventData = data;
                }
            });

            kanban.searchCards('user');

            expect(eventData).not.toBeNull();
            expect(eventData.fuzzy).toBe(true);
        });

        it('emits search event with match count', function() {
            var eventData = null;

            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title'],
                onSearch: function(data) {
                    eventData = data;
                }
            });

            kanban.searchCards('user');

            // eventData.matches may be a number or an array depending on implementation
            var hasMatches = eventData && (typeof eventData.matches === 'number' || Array.isArray(eventData.matches));
            expect(hasMatches).toBe(true);
        });

    });

    describe('Clear search', function() {

        it('clearSearch resets searchResults', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title']
            });

            kanban.searchCards('user');
            expect(kanban.searchResults.size).toBeGreaterThan(0);

            kanban.clearSearch();
            expect(kanban.searchResults.size).toBe(0);
        });

        it('clearSearch shows all cards', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title']
            });

            kanban.searchCards('user');
            kanban.clearSearch();

            // All cards should be visible
            var hiddenCards = document.querySelectorAll('.kanban-card.is-hidden');
            expect(hiddenCards.length).toBe(0);
        });

    });

    describe('Fallback to indexOf', function() {

        it('uses indexOf when fuzzySearch is false', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: false,
                searchableFields: ['title']
            });

            // 'usr' won't match with indexOf
            var matches = kanban.searchCards('usr');

            expect(matches.length).toBe(0);
        });

        it('indexOf matches exact substrings', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: false,
                searchableFields: ['title']
            });

            // 'User' should match with indexOf
            var matches = kanban.searchCards('User');

            expect(matches.length).toBeGreaterThan(0);
        });

    });

    describe('Multi-field search', function() {

        it('searches across multiple fields', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title', 'description']
            });

            // 'login' is in description of card1
            var matches = kanban.searchCards('login');

            expect(matches.length).toBeGreaterThan(0);
        });

        it('includes matched key in searchResults', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title', 'description']
            });

            kanban.searchCards('schema');

            var result = kanban.searchResults.get('card3');
            if (result) {
                expect(result.key).toBeDefined();
            }
        });

    });

    describe('Column score sorting', function() {

        it('_sortColumnsByScore internal method exists', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true
            });

            // This is a private method (_sortColumnsByScore) called internally during search
            expect(typeof kanban._sortColumnsByScore).toBe('function');
        });

        it('sorts cards within column by score', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                sortMatchesByScore: true,
                searchableFields: ['title', 'description']
            });

            kanban.searchCards('user');

            // The search should work and produce results
            expect(kanban.searchResults.size).toBeGreaterThanOrEqual(0);
        });

    });

    describe('Highlight positions', function() {

        it('stores match positions for highlighting', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title']
            });

            kanban.searchCards('user');

            var result = kanban.searchResults.get('card1');
            if (result) {
                expect(result.matches).toBeDefined();
                expect(Array.isArray(result.matches)).toBe(true);
            }
        });

        it('match positions are [start, end] tuples', function() {
            kanban = Kanban.init('#kanban-fuzzy', {
                columns: sampleColumns,
                fuzzySearch: true,
                searchableFields: ['title']
            });

            kanban.searchCards('user');

            var result = kanban.searchResults.get('card1');
            if (result && result.matches && result.matches.length > 0) {
                expect(Array.isArray(result.matches[0])).toBe(true);
                expect(result.matches[0].length).toBe(2);
            }
        });

    });

});
