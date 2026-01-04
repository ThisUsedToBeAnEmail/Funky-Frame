/**
 * Funky.SideNav.History Tests
 *
 * Tests for the recent searches feature in SideNav component.
 * Validates History integration with accessibility support.
 */

describe('Funky.Component.SideNav.History', function() {

    var SideNav = Funky.SideNav;
    var History = Funky.History;
    var fixture;
    var testKey;
    var containerId;
    var testCounter = 0;

    beforeEach(function() {
        // Use counter + timestamp + random to ensure unique keys
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        testKey = 'test_sidenav_' + unique;
        containerId = 'sidenav-hist-' + unique;
        fixture = FunkyTests.fixture('<div id="' + containerId + '"></div>');
    });

    afterEach(function() {
        // Clean up SideNav instance
        var instance = SideNav.getInstance(containerId);
        if (instance) {
            instance.destroy();
        }

        // Clean up history
        History.destroy(testKey);

        // Clean up localStorage
        localStorage.removeItem('funky_' + testKey);

        // Clean up screen reader announcer
        var announcer = document.getElementById('sidenav-sr-announcer');
        if (announcer) announcer.remove();

        fixture.destroy();
    });

    var basicItems = [
        { id: 'home', label: 'Home', icon: 'fa-home' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' },
        { id: 'users', label: 'Users', icon: 'fa-users' }
    ];

    describe('Configuration', function() {

        it('has recentSearches default as false', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems
            });

            expect(nav.config.recentSearches).toBe(false);
        });

        it('has maxRecentSearches default as 5', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems
            });

            expect(nav.config.maxRecentSearches).toBe(5);
        });

        it('has minSearchLength default as 2', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems
            });

            expect(nav.config.minSearchLength).toBe(2);
        });

        it('does not initialize history when feature disabled', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: false
            });

            // recentHistory is null when feature is disabled
            expect(nav.recentHistory).toBe(null);
        });

        it('initializes history when feature enabled', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            expect(nav.recentHistory).toBeDefined();
            expect(nav.recentHistory).not.toBe(null);
        });

    });

    describe('getRecentSearches()', function() {

        it('returns empty array when feature disabled', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: false
            });

            expect(nav.getRecentSearches()).toEqual([]);
        });

        it('returns empty array when no searches', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            expect(nav.getRecentSearches()).toEqual([]);
        });

        it('returns array of recent searches', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('home');
            nav._addToRecentSearches('settings');

            var recent = nav.getRecentSearches();
            expect(recent.length).toBe(2);
            expect(recent).toContain('home');
            expect(recent).toContain('settings');
        });

    });

    describe('_addToRecentSearches()', function() {

        it('adds query to history', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test query');

            expect(nav.getRecentSearches()).toContain('test query');
        });

        it('ignores queries shorter than minSearchLength', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey,
                minSearchLength: 3
            });

            nav._addToRecentSearches('ab');

            expect(nav.getRecentSearches()).toEqual([]);
        });

        it('trims whitespace', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('  trimmed  ');

            expect(nav.getRecentSearches()[0]).toBe('trimmed');
        });

        it('respects maxRecentSearches limit', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey,
                maxRecentSearches: 3
            });

            nav._addToRecentSearches('one');
            nav._addToRecentSearches('two');
            nav._addToRecentSearches('three');
            nav._addToRecentSearches('four');

            expect(nav.getRecentSearches().length).toBe(3);
        });

    });

    describe('clearRecentSearches()', function() {

        it('clears all recent searches', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('one');
            nav._addToRecentSearches('two');

            nav.clearRecentSearches();

            expect(nav.getRecentSearches()).toEqual([]);
        });

        it('does not throw when feature disabled', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: false
            });

            expect(function() {
                nav.clearRecentSearches();
            }).not.toThrow();
        });

    });

    describe('_showRecentDropdown()', function() {

        it('creates dropdown element', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();

            expect(nav._recentDropdown).not.toBe(null);
        });

        it('does not show when history is empty', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._showRecentDropdown();

            expect(nav._recentDropdown).toBe(null);
        });

        it('creates items for each recent search', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('home');
            nav._addToRecentSearches('settings');
            nav._showRecentDropdown();

            var items = nav._recentDropdown.el.querySelectorAll('.sidenav-recent-item');
            expect(items.length).toBe(2);
        });

    });

    describe('_hideRecentDropdown()', function() {

        it('removes dropdown element', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();
            nav._hideRecentDropdown();

            expect(nav._recentDropdown).toBe(null);
        });

        it('resets selection index', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();
            nav._recentSelectedIndex = 1;
            nav._hideRecentDropdown();

            expect(nav._recentSelectedIndex).toBe(-1);
        });

    });

    describe('ARIA Accessibility', function() {

        it('dropdown has role="listbox"', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();

            expect(nav._recentDropdown.el.getAttribute('role')).toBe('listbox');
        });

        it('items have role="option"', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();

            var items = nav._recentDropdown.el.querySelectorAll('.sidenav-recent-item');
            items.forEach(function(item) {
                expect(item.getAttribute('role')).toBe('option');
            });
        });

        it('search input has aria-expanded when dropdown shown', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();

            expect(nav.elements.search.getAttribute('aria-expanded')).toBe('true');
        });

        it('search input has aria-expanded=false when dropdown hidden', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();
            nav._hideRecentDropdown();

            expect(nav.elements.search.getAttribute('aria-expanded')).toBe('false');
        });

        it('clear button has aria-label', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();

            var clearBtn = nav._recentDropdown.el.querySelector('.sidenav-recent-clear');
            expect(clearBtn.getAttribute('aria-label')).toBe('Clear all recent searches');
        });

    });

    describe('_updateRecentSelection()', function() {

        it('adds selected class to current item', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('one');
            nav._addToRecentSearches('two');
            nav._showRecentDropdown();

            nav._recentSelectedIndex = 0;
            nav._updateRecentSelection();

            var items = nav._recentDropdown.el.querySelectorAll('.sidenav-recent-item');
            expect(items[0].classList.contains('sidenav-recent-item--selected')).toBe(true);
        });

        it('sets aria-selected on current item', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                searchable: true,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('test');
            nav._showRecentDropdown();

            nav._recentSelectedIndex = 0;
            nav._updateRecentSelection();

            var item = nav._recentDropdown.el.querySelector('.sidenav-recent-item');
            expect(item.getAttribute('aria-selected')).toBe('true');
        });

    });

    describe('Persistence', function() {

        it('persists recent searches to localStorage', function() {
            var nav = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav._addToRecentSearches('persisted');

            // Storage uses 'funky_' prefix
            var stored = localStorage.getItem('funky_' + testKey);
            expect(stored).not.toBe(null);
        });

        it('loads persisted searches on new instance', function() {
            // First instance
            var nav1 = new SideNav('#' + containerId, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            nav1._addToRecentSearches('remembered');

            // Destroy SideNav and history instances but keep localStorage
            nav1.destroy();
            History.destroy(testKey);

            // Create new fixture with new ID
            var containerId2 = 'sidenav-hist-2-' + Date.now();
            fixture.el.innerHTML = '<div id="' + containerId2 + '"></div>';

            // New instance with same key
            var nav2 = new SideNav('#' + containerId2, {
                items: basicItems,
                recentSearches: true,
                recentSearchesKey: testKey
            });

            expect(nav2.getRecentSearches()).toContain('remembered');

            // Cleanup
            nav2.destroy();
        });

    });

});
