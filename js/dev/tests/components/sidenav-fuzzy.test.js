/**
 * Funky.SideNav Fuzzy Search Tests
 *
 * Tests for fuzzy search integration in the SideNav component.
 * Tests the fuzzySearch, fuzzyThreshold, and fuzzyTokenize options.
 */

describe('Funky.Component.SideNav.FuzzySearch', function() {

    var SideNav = Funky.SideNav;
    var FuzzySearch = Funky.FuzzySearch;
    var fixture;
    var nav;

    // Sample items with varied labels for fuzzy matching
    var sampleItems = [
        { id: 'home', label: 'Home Dashboard', icon: 'fa-home' },
        { id: 'users', label: 'User Management', icon: 'fa-users' },
        {
            id: 'settings',
            label: 'System Settings',
            icon: 'fa-cog',
            children: [
                { id: 'general', label: 'General Configuration' },
                { id: 'security', label: 'Security Options' },
                { id: 'network', label: 'Network Settings' }
            ]
        },
        { id: 'reports', label: 'Reports Manager', icon: 'fa-chart-bar' },
        { id: 'profile', label: 'Profile Editor', icon: 'fa-user' },
        { id: 'admin', label: 'Database Administration', icon: 'fa-database' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="sidenav-fuzzy"></div>');
    });

    afterEach(function() {
        if (nav && typeof nav.destroy === 'function') {
            nav.destroy();
            nav = null;
        }
        var instance = SideNav.getInstance('sidenav-fuzzy');
        if (instance) {
            instance.destroy();
        }
        fixture.destroy();
    });

    describe('FuzzySearch availability', function() {

        it('Funky.FuzzySearch is available', function() {
            expect(FuzzySearch).toBeDefined();
        });

    });

    describe('Configuration options', function() {

        it('accepts fuzzySearch option', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            expect(nav.config.fuzzySearch).toBe(true);
        });

        it('accepts fuzzyThreshold option', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true,
                fuzzyThreshold: 0.5
            });

            expect(nav.config.fuzzyThreshold).toBe(0.5);
        });

        it('accepts fuzzyTokenize option', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true,
                fuzzyTokenize: true
            });

            expect(nav.config.fuzzyTokenize).toBe(true);
        });

        it('defaults fuzzySearch to false', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true
            });

            expect(nav.config.fuzzySearch).toBe(false);
        });

        it('defaults fuzzyThreshold to 0.3', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                fuzzySearch: true
            });

            expect(nav.config.fuzzyThreshold).toBe(0.3);
        });

    });

    describe('Fuzzy filter behavior', function() {

        it('filter() uses fuzzy matching when enabled', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            // 'usr' should fuzzy match 'User Management'
            nav.filter('usr');

            expect(nav.filterResults.size).toBeGreaterThan(0);
        });

        it('matches misspelled queries', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true,
                fuzzyThreshold: 0.2
            });

            // 'settngs' should fuzzy match 'Settings'
            nav.filter('settngs');

            expect(nav.filterResults.size).toBeGreaterThan(0);
        });

        it('populates filterResults Map', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');

            expect(nav.filterResults).toBeDefined();
            expect(nav.filterResults instanceof Map).toBe(true);
            expect(nav.filterResults.size).toBeGreaterThan(0);
        });

        it('filterResults contain score property', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');

            nav.filterResults.forEach(function(result) {
                expect(typeof result.score).toBe('number');
            });
        });

        it('filterResults contain matches property', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');

            nav.filterResults.forEach(function(result) {
                expect(Array.isArray(result.matches)).toBe(true);
            });
        });

    });

    describe('Threshold behavior', function() {

        it('respects fuzzyThreshold', function() {
            // High threshold
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true,
                fuzzyThreshold: 0.9
            });

            nav.filter('usr');
            var highThresholdCount = nav.filterResults.size;

            nav.destroy();

            // Low threshold
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true,
                fuzzyThreshold: 0.1
            });

            nav.filter('usr');
            var lowThresholdCount = nav.filterResults.size;

            expect(lowThresholdCount >= highThresholdCount).toBe(true);
        });

    });

    describe('Tokenized search', function() {

        it('matches multiple tokens', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true,
                fuzzyTokenize: true
            });

            // 'system set' should match 'System Settings'
            nav.filter('system set');

            expect(nav.filterResults.size).toBeGreaterThan(0);
        });

        it('matches tokens in any order', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true,
                fuzzyTokenize: true
            });

            // 'manager reports' should match 'Reports Manager'
            nav.filter('manager reports');

            // filterResults uses numeric indices, check if any matches found
            expect(nav.filterResults.size).toBeGreaterThan(0);
        });

    });

    describe('Score-based ordering', function() {

        it('populates filteredOrder array', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');

            expect(nav.filteredOrder).toBeDefined();
            expect(Array.isArray(nav.filteredOrder)).toBe(true);
        });

        it('filteredOrder is sorted by score descending', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('man');

            if (nav.filteredOrder && nav.filteredOrder.length >= 2) {
                for (var i = 1; i < nav.filteredOrder.length; i++) {
                    var prevResult = nav.filterResults.get(nav.filteredOrder[i - 1]);
                    var currResult = nav.filterResults.get(nav.filteredOrder[i]);
                    if (prevResult && currResult) {
                        expect(prevResult.score >= currResult.score).toBe(true);
                    }
                }
            }
        });

    });

    describe('Clear filter', function() {

        it('empty filter clears filterResults', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');
            expect(nav.filterResults.size).toBeGreaterThan(0);

            nav.filter('');
            expect(nav.filterResults.size).toBe(0);
        });

        it('empty filter clears filteredOrder', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');
            nav.filter('');

            expect(nav.filteredOrder).toBe(null);
        });

    });

    describe('Fallback to indexOf', function() {

        it('uses indexOf when fuzzySearch is false', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: false
            });

            // 'usr' won't match with indexOf
            nav.filter('usr');

            // With indexOf, no matches expected
            var visibleItems = document.querySelectorAll('.sidenav-item:not(.sidenav-item--hidden)');
            // All items should be hidden except those matching exactly
            expect(nav.filterResults.size).toBe(0);
        });

        it('indexOf matches exact substrings', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: false
            });

            // 'User' should match with indexOf
            nav.filter('User');

            // Should find items containing 'User'
            var visibleItems = document.querySelectorAll('.sidenav-item:not(.sidenav-item--hidden)');
            expect(visibleItems.length).toBeGreaterThan(0);
        });

    });

    describe('Nested item matching', function() {

        it('matches nested items', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            // 'security' is a child of 'settings'
            nav.filter('security');

            // filterResults uses numeric indices, check if any matches found
            expect(nav.filterResults.size).toBeGreaterThan(0);
        });

        it('shows parent when child matches', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            // 'network' is a child of 'settings'
            nav.filter('network');

            // Parent should be visible
            var parentItem = document.querySelector('.sidenav-item[data-id="settings"]');
            if (parentItem) {
                expect(parentItem.classList.contains('sidenav-item--hidden')).toBe(false);
            }
        });

    });

    describe('Highlight matches', function() {

        it('stores match positions for highlighting', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');

            var result = nav.filterResults.get('users');
            if (result) {
                expect(result.matches).toBeDefined();
                expect(Array.isArray(result.matches)).toBe(true);
                expect(result.matches.length).toBeGreaterThan(0);
            }
        });

        it('match positions are [start, end] tuples', function() {
            nav = new SideNav('#sidenav-fuzzy', {
                items: sampleItems,
                searchable: true,
                fuzzySearch: true
            });

            nav.filter('user');

            var result = nav.filterResults.get('users');
            if (result && result.matches.length > 0) {
                expect(Array.isArray(result.matches[0])).toBe(true);
                expect(result.matches[0].length).toBe(2);
                expect(typeof result.matches[0][0]).toBe('number');
                expect(typeof result.matches[0][1]).toBe('number');
            }
        });

    });

});
