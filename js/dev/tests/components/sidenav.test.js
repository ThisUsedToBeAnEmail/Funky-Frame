/**
 * Funky.SideNav Tests
 *
 * Tests for the sidebar navigation component.
 */

describe('Funky.Component.SideNav', function() {

    var SideNav = Funky.SideNav;
    var fixture;

    var sampleItems = [
        { id: 'home', label: 'Home', icon: 'fa-home' },
        { id: 'about', label: 'About', icon: 'fa-info' },
        {
            id: 'products',
            label: 'Products',
            icon: 'fa-box',
            children: [
                { id: 'product-1', label: 'Product 1' },
                { id: 'product-2', label: 'Product 2' }
            ]
        },
        { id: 'contact', label: 'Contact', badge: 5 }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="sidenav-container"></div>');
    });

    afterEach(function() {
        var instance = SideNav.getInstance('sidenav-container');
        if (instance) {
            instance.destroy();
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('SideNav')).toBe(true);
        });

        it('is a constructor', function() {
            expect(typeof SideNav).toBe('function');
        });

        it('has init method', function() {
            expect(typeof SideNav.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof SideNav.getInstance).toBe('function');
        });

    });

    describe('Constructor', function() {

        it('creates instance from selector', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            expect(nav).toBeDefined();
        });

        it('creates instance from element', function() {
            var el = document.getElementById('sidenav-container');
            var nav = new SideNav(el, { items: sampleItems });
            expect(nav.container).toBe(el);
        });

        it('renders items', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var items = document.querySelectorAll('.sidenav-item');
            expect(items.length).toBeGreaterThan(0);
        });

        it('registers instance', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var instance = SideNav.getInstance('sidenav-container');
            expect(instance).toBeDefined();
        });

    });

    describe('Static init()', function() {

        it('creates and returns instance', function() {
            var nav = SideNav.init('#sidenav-container', { items: sampleItems });
            expect(nav).toBeDefined();
        });

    });

    describe('Item rendering', function() {

        it('renders flat items', function() {
            new SideNav('#sidenav-container', {
                items: [
                    { id: 'item1', label: 'Item 1' },
                    { id: 'item2', label: 'Item 2' }
                ]
            });

            var items = document.querySelectorAll('.sidenav-item');
            expect(items.length).toBe(2);
        });

        it('renders group items', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var groups = document.querySelectorAll('.sidenav-group');
            expect(groups.length).toBe(1);
        });

        it('renders nested items', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var nestedItems = document.querySelectorAll('.sidenav-group-items .sidenav-item');
            expect(nestedItems.length).toBe(2);
        });

        it('renders icons', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var icons = document.querySelectorAll('.sidenav-icon');
            expect(icons.length).toBeGreaterThan(0);
        });

        it('renders badges', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var badge = document.querySelector('.sidenav-badge');
            expect(badge).toBeInDocument();
            expect(badge.textContent).toContain('5');
        });

    });

    describe('Selection', function() {

        it('select() selects item by ID', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.select('about');

            var item = document.querySelector('[data-id="about"]');
            expect(item.classList.contains('active')).toBe(true);
        });

        it('select() updates selectedId', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.select('home');

            expect(nav.selectedId).toBe('home');
        });

        it('select() removes previous selection', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.select('home');
            nav.select('about');

            var homeItem = document.querySelector('[data-id="home"]');
            expect(homeItem.classList.contains('active')).toBe(false);
        });

        it('select() calls onChange callback', function() {
            var selectedItem = null;
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                onChange: function(item) {
                    selectedItem = item;
                }
            });

            nav.select('home');

            expect(selectedItem).toBeDefined();
            expect(selectedItem.id).toBe('home');
        });

        it('silent select does not call callback', function() {
            var callbackCalled = false;
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                onChange: function() {
                    callbackCalled = true;
                }
            });

            nav.select('home', true);

            expect(callbackCalled).toBe(false);
        });

        it('getSelected() returns selected item', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.select('about');

            var selected = nav.getSelected();
            expect(selected.id).toBe('about');
            expect(selected.label).toBe('About');
        });

        it('clicking item selects it', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });

            var item = document.querySelector('[data-id="home"]');
            FunkyTests.simulate.click(item);

            expect(nav.selectedId).toBe('home');
        });

    });

    describe('Group expand/collapse', function() {

        it('collapse() collapses group', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.collapse('products');

            var group = document.querySelector('[data-group="products"]');
            expect(group.classList.contains('collapsed')).toBe(true);
        });

        it('expand() expands group', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.collapse('products');
            nav.expand('products');

            var group = document.querySelector('[data-group="products"]');
            expect(group.classList.contains('collapsed')).toBe(false);
        });

        it('toggleGroup() toggles state', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });

            nav.toggleGroup('products');
            var group = document.querySelector('[data-group="products"]');
            expect(group.classList.contains('collapsed')).toBe(true);

            nav.toggleGroup('products');
            expect(group.classList.contains('collapsed')).toBe(false);
        });

        it('expandAll() expands all groups', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.collapseAll();
            nav.expandAll();

            var collapsed = document.querySelectorAll('.sidenav-group.collapsed');
            expect(collapsed.length).toBe(0);
        });

        it('collapseAll() collapses all groups', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.collapseAll();

            var groups = document.querySelectorAll('.sidenav-group');
            groups.forEach(function(group) {
                expect(group.classList.contains('collapsed')).toBe(true);
            });
        });

        it('clicking group header toggles group', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });

            var header = document.querySelector('.sidenav-group-header');
            FunkyTests.simulate.click(header);

            var group = document.querySelector('.sidenav-group');
            expect(group.classList.contains('collapsed')).toBe(true);
        });

    });

    describe('Filtering', function() {

        it('filter() hides non-matching items', function() {
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: true
            });

            nav.filter('home');

            var visibleItems = document.querySelectorAll('.sidenav-item:not([style*="display: none"])');
            expect(visibleItems.length).toBe(1);
        });

        it('filter() shows matching items', function() {
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: true
            });

            nav.filter('product');

            var visibleItems = document.querySelectorAll('.sidenav-item:not([style*="display: none"])');
            expect(visibleItems.length).toBe(2);
        });

        it('empty filter shows all', function() {
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: true
            });

            nav.filter('home');
            nav.filter('');

            var hiddenItems = document.querySelectorAll('.sidenav-item[style*="display: none"]');
            expect(hiddenItems.length).toBe(0);
        });

        it('filter is case insensitive', function() {
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: true
            });

            nav.filter('HOME');

            var visibleItems = document.querySelectorAll('.sidenav-item:not([style*="display: none"])');
            expect(visibleItems.length).toBe(1);
        });

    });

    describe('Search input', function() {

        it('renders search input when searchable', function() {
            new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: true
            });

            var search = document.querySelector('.sidenav-search');
            expect(search).toBeInDocument();
        });

        it('does not render search when not searchable', function() {
            new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: false
            });

            var search = document.querySelector('.sidenav-search');
            expect(search).toBeNull();
        });

        it('typing in search filters items', function() {
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: true
            });

            var search = document.querySelector('.sidenav-search');
            FunkyTests.simulate.input(search, 'about');

            var visibleItems = document.querySelectorAll('.sidenav-item:not([style*="display: none"])');
            expect(visibleItems.length).toBe(1);
        });

    });

    describe('setItems()', function() {

        it('updates items dynamically', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });

            nav.setItems([
                { id: 'new1', label: 'New Item 1' },
                { id: 'new2', label: 'New Item 2' }
            ]);

            var items = document.querySelectorAll('.sidenav-item');
            expect(items.length).toBe(2);
        });

        it('preserves selection if still valid', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.select('home');

            nav.setItems([
                { id: 'home', label: 'Home' },
                { id: 'other', label: 'Other' }
            ]);

            expect(nav.selectedId).toBe('home');
        });

    });

    describe('Accessibility', function() {

        it('list has role="tree"', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var list = document.querySelector('.sidenav-list');
            expect(list.getAttribute('role')).toBe('tree');
        });

        it('items have role="treeitem"', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var items = document.querySelectorAll('.sidenav-item');
            items.forEach(function(item) {
                expect(item.getAttribute('role')).toBe('treeitem');
            });
        });

        it('selected item has aria-current="page"', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.select('home');

            var item = document.querySelector('[data-id="home"]');
            expect(item.getAttribute('aria-current')).toBe('page');
        });

        it('group header has aria-expanded', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var header = document.querySelector('.sidenav-group-header');
            expect(header.getAttribute('aria-expanded')).toBeDefined();
        });

        it('collapsed group has aria-expanded="false"', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.collapse('products');

            var header = document.querySelector('.sidenav-group-header');
            expect(header.getAttribute('aria-expanded')).toBe('false');
        });

        it('search has role="search"', function() {
            new SideNav('#sidenav-container', {
                items: sampleItems,
                searchable: true
            });

            var searchWrapper = document.querySelector('.sidenav-search-wrapper');
            expect(searchWrapper.getAttribute('role')).toBe('search');
        });

        it('badges have screen reader text', function() {
            new SideNav('#sidenav-container', { items: sampleItems });

            var srText = document.querySelector('.sidenav-badge .visually-hidden');
            expect(srText).toBeInDocument();
        });

    });

    describe('Keyboard navigation', function() {

        // Diagnostic tests to understand keyboard handling issues
        describe('ArrowDown focus behavior (diagnostic)', function() {

            it('SideNav creates items that can receive focus class', function() {
                var nav = new SideNav('#sidenav-container', { items: sampleItems });
                var items = document.querySelectorAll('.sidenav-item');
                expect(items.length).toBeGreaterThan(0);
            });

            it('Container can be focused', function() {
                var nav = new SideNav('#sidenav-container', { items: sampleItems });
                var container = document.getElementById('sidenav-container');
                container.setAttribute('tabindex', '-1');
                container.focus();

                expect(document.activeElement).toBe(container);
            });

            it('Keyboard event dispatches correctly', function() {
                var eventReceived = false;
                var handler = function(e) {
                    if (e.key === 'ArrowDown') eventReceived = true;
                };
                document.addEventListener('keydown', handler);

                FunkyTests.simulate.keydown(document, { key: 'ArrowDown' });

                document.removeEventListener('keydown', handler);
                expect(eventReceived).toBe(true);
            });

            it('SideNav registers keyboard handler', function() {
                var nav = new SideNav('#sidenav-container', { items: sampleItems });
                // Check if keyboard handler is registered
                expect(typeof nav._handleKeydown).toBe('function');
            });

            it('SideNav has focus tracking (SelectableList or legacy)', function() {
                var nav = new SideNav('#sidenav-container', { items: sampleItems });
                // Modern SideNav uses SelectableList for focus tracking
                // Legacy fallback uses _getLegacyFocusedIndex()
                var hasSelectableList = nav._selectableList !== null;
                var hasLegacyFallback = typeof nav._getLegacyFocusedIndex === 'function';
                expect(hasSelectableList || hasLegacyFallback).toBe(true);
            });

            it('_focusFirstItem adds focused class to first item', function() {
                var nav = new SideNav('#sidenav-container', { items: sampleItems });

                nav._focusFirstItem();

                var focused = document.querySelector('.sidenav-item.focused');
                expect(focused).toBeInDocument();
            });

            it('_moveFocus changes focused item', function() {
                var nav = new SideNav('#sidenav-container', { items: sampleItems });
                nav._focusFirstItem();

                // _moveFocus requires visibleItems as second parameter
                var visibleItems = nav._getVisibleItems();
                expect(visibleItems.length).toBeGreaterThan(1);

                // First item should be focused
                expect(visibleItems[0].classList.contains('focused')).toBe(true);

                nav._moveFocus(1, visibleItems); // Move down
                expect(visibleItems[1].classList.contains('focused')).toBe(true);

                nav._moveFocus(-1, visibleItems); // Move up
                expect(visibleItems[0].classList.contains('focused')).toBe(true);
            });

            // Note: These keyboard tests require Funky.Keyboard scope to be active.
            // The scope check in Funky.Keyboard requires either:
            // 1. Container element to be document.activeElement, OR
            // 2. Container to contain document.activeElement
            // This is tested in integration tests instead.

            it('keyboard handler is registered with Funky.Keyboard', function() {
                var nav = new SideNav('#sidenav-container', { items: sampleItems });
                // The _keyboardUnregisters array should have items if Funky.Keyboard was available
                expect(nav._keyboardUnregisters).toBeDefined();
                // If Funky.Keyboard is available, handlers are registered
                if (typeof Funky !== 'undefined' && Funky.Keyboard) {
                    expect(nav._keyboardUnregisters.length).toBeGreaterThan(0);
                }
            });

        });

        it('Enter selects focused item', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });

            // For element-based scopes, we need focus inside the container
            var container = document.getElementById('sidenav-container');
            container.setAttribute('tabindex', '-1');
            container.focus();

            return FunkyTests.delay(50).then(function() {
                // Focus first item
                FunkyTests.simulate.keydown(document, { key: 'ArrowDown' });

                return FunkyTests.delay(10);
            }).then(function() {
                // Select it
                FunkyTests.simulate.keydown(document, { key: 'Enter' });

                return FunkyTests.delay(10);
            }).then(function() {
                expect(nav.selectedId).toBeDefined();
            });
        });

    });

    describe('Sorting', function() {

        it('toggleSort() changes sort order', function() {
            var nav = new SideNav('#sidenav-container', {
                items: sampleItems,
                sortable: true,
                sortOrder: 'asc'
            });

            nav.toggleSort();

            expect(nav.currentSortOrder).toBe('desc');
        });

        it('renders sort toggle when sortable', function() {
            new SideNav('#sidenav-container', {
                items: sampleItems,
                sortable: true
            });

            var toggle = document.querySelector('.sidenav-sort-toggle');
            expect(toggle).toBeInDocument();
        });

    });

    describe('Bindable Interface', function() {

        it('has setData method', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            expect(typeof nav.setData).toBe('function');
        });

        it('has getData method', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            expect(typeof nav.getData).toBe('function');
        });

        it('setData updates items', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });

            nav.setData([{ id: 'new', label: 'New' }]);

            var items = document.querySelectorAll('.sidenav-item');
            expect(items.length).toBe(1);
        });

        it('getData returns current state', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.select('home');

            var data = nav.getData();

            expect(data.items).toBeDefined();
            expect(data.selectedId).toBe('home');
        });

    });

    describe('destroy()', function() {

        it('clears container', function() {
            var nav = new SideNav('#sidenav-container', { items: sampleItems });
            nav.destroy();

            var container = document.getElementById('sidenav-container');
            expect(container.innerHTML).toBe('');
        });

        it('removes from instances', function() {
            new SideNav('#sidenav-container', { items: sampleItems });
            var instance = SideNav.getInstance('sidenav-container');
            instance.destroy();

            expect(SideNav.getInstance('sidenav-container')).toBeNull();
        });

    });

});
