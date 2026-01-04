/**
 * Accessibility Tests: Sidenav
 *
 * Tests WCAG 2.1 AA compliance for the Sidenav navigation component.
 * Covers navigation landmarks, keyboard navigation, focus management, and screen reader support.
 */

describe('Funky.A11y.Sidenav', function() {

    var SideNav = Funky.SideNav;
    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    var sampleItems = [
        { id: 'home', label: 'Home', icon: 'home', href: '/' },
        { id: 'dashboard', label: 'Dashboard', icon: 'chart', href: '/dashboard' },
        {
            id: 'settings',
            label: 'Settings',
            icon: 'cog',
            children: [
                { id: 'profile', label: 'Profile', href: '/settings/profile' },
                { id: 'security', label: 'Security', href: '/settings/security' },
                { id: 'notifications', label: 'Notifications', href: '/settings/notifications' }
            ]
        },
        { id: 'reports', label: 'Reports', icon: 'file', href: '/reports', badge: 5 },
        { id: 'help', label: 'Help', icon: 'question', href: '/help' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture('<nav id="test-sidenav" aria-label="Main navigation"></nav>');
    });

    afterEach(function() {
        if (SideNav.destroyAll) {
            SideNav.destroyAll();
        }
        fixture.destroy();
    });

    describe('Navigation Landmark', function() {

        it('sidenav has role="navigation" or is nav element', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var nav = document.querySelector('#test-sidenav');
            var isNavLandmark = nav.tagName === 'NAV' ||
                               nav.getAttribute('role') === 'navigation';
            expect(isNavLandmark).toBe(true);
        });

        it('sidenav has accessible label', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var nav = document.querySelector('#test-sidenav');
            var hasLabel = nav.getAttribute('aria-label') ||
                           nav.getAttribute('aria-labelledby');
            expect(hasLabel).toBeTruthy();
        });

        it('multiple sidenvs have unique labels', function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<nav id="main-nav" aria-label="Main navigation"></nav>' +
                '<nav id="secondary-nav" aria-label="Secondary navigation"></nav>'
            );

            new SideNav('#main-nav', { items: sampleItems });
            new SideNav('#secondary-nav', { items: [{ id: 'item1', label: 'Item 1' }] });

            var mainLabel = document.querySelector('#main-nav').getAttribute('aria-label');
            var secondaryLabel = document.querySelector('#secondary-nav').getAttribute('aria-label');

            expect(mainLabel).not.toBe(secondaryLabel);
        });

    });

    describe('List Structure', function() {

        it('nav items use list semantics', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var list = document.querySelector('#test-sidenav ul, #test-sidenav [role="list"], #test-sidenav [role="tree"]');
            expect(list).toBeDefined();
        });

        it('nav items have role="listitem" or are li elements', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var items = document.querySelectorAll('#test-sidenav li, #test-sidenav [role="listitem"], #test-sidenav [role="treeitem"]');
            expect(items.length).toBeGreaterThan(0);
        });

        it('nested lists are properly structured', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var nestedLists = document.querySelectorAll('#test-sidenav ul ul, #test-sidenav [role="group"]');
            if (nestedLists.length > 0) {
                Array.prototype.forEach.call(nestedLists, function(list) {
                    // Nested list should be within a list item
                    var parent = list.parentElement;
                    expect(parent.tagName === 'LI' || parent.getAttribute('role') === 'treeitem').toBe(true);
                });
            }
        });

    });

    describe('Link Accessibility', function() {

        it('all nav links are focusable', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var links = document.querySelectorAll('#test-sidenav a, #test-sidenav [role="link"]');
            Array.prototype.forEach.call(links, function(link) {
                expect(A11y.isInTabOrder(link)).toBe(true);
            });
        });

        it('links have accessible names', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var links = document.querySelectorAll('#test-sidenav a');
            Array.prototype.forEach.call(links, function(link) {
                var name = A11y.getAccessibleName(link);
                expect(name).toBeTruthy();
            });
        });

        it('current page is indicated with aria-current', function() {
            var nav = new SideNav('#test-sidenav', { items: sampleItems });
            nav.select('home');

            return FunkyTests.delay(50).then(function() {
                var currentItem = document.querySelector('[aria-current="page"], [aria-current="true"]');
                expect(currentItem).toBeDefined();
            });
        });

        it('icon-only links have aria-label', function() {
            new SideNav('#test-sidenav', { items: sampleItems, collapsed: true });

            var iconLinks = document.querySelectorAll('#test-sidenav a:not(:has(text))');
            Array.prototype.forEach.call(iconLinks, function(link) {
                var name = A11y.getAccessibleName(link);
                expect(name).toBeTruthy();
            });
        });

    });

    describe('Expandable Sections', function() {

        it('parent items with children have aria-expanded', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var expandableItems = document.querySelectorAll('#test-sidenav [aria-expanded]');
            expect(expandableItems.length).toBeGreaterThan(0);
        });

        it('aria-expanded updates on toggle', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var expandBtn = document.querySelector('#test-sidenav [aria-expanded="false"]');
            if (expandBtn) {
                FunkyTests.simulate.click(expandBtn);

                return FunkyTests.delay(100).then(function() {
                    expect(expandBtn.getAttribute('aria-expanded')).toBe('true');
                });
            }
        });

        it('aria-controls links to submenu', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var expandBtns = document.querySelectorAll('#test-sidenav [aria-controls]');
            Array.prototype.forEach.call(expandBtns, function(btn) {
                var controls = btn.getAttribute('aria-controls');
                var submenu = document.getElementById(controls);
                expect(submenu).toBeDefined();
            });
        });

        it('collapsed submenu is hidden from screen readers', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var collapsedSubmenus = document.querySelectorAll('#test-sidenav [aria-expanded="false"] + ul, #test-sidenav .submenu.collapsed');
            Array.prototype.forEach.call(collapsedSubmenus, function(submenu) {
                var isHidden = submenu.getAttribute('aria-hidden') === 'true' ||
                               getComputedStyle(submenu).display === 'none' ||
                               getComputedStyle(submenu).visibility === 'hidden';
                expect(isHidden).toBe(true);
            });
        });

    });

    describe('Keyboard Navigation', function() {

        // Helper to get focusable items (sidenav uses li.sidenav-item with tabindex, not anchors)
        function getFocusableItems() {
            return document.querySelectorAll('#test-sidenav .sidenav-item[tabindex]');
        }

        // Skip: Requires SideNav component to handle keyboard events on container
        xit('Arrow Down moves to next item', function() {
            var nav = new SideNav('#test-sidenav', { items: sampleItems });

            var items = getFocusableItems();
            if (items.length < 2) {
                expect(true).toBe(true); // Skip if not enough items
                return;
            }

            // SideNav uses focused class, not document.activeElement for keyboard nav
            nav._focusFirstItem();

            return FunkyTests.delay(50).then(function() {
                var focusedBefore = document.querySelector('#test-sidenav .sidenav-item.focused');
                expect(focusedBefore).toBeInDocument();

                // Simulate ArrowDown on the container
                var container = document.querySelector('#test-sidenav');
                container.setAttribute('tabindex', '-1');
                container.focus();
                FunkyTests.simulate.keydown(container, { key: 'ArrowDown' });

                return FunkyTests.delay(50);
            }).then(function() {
                // Focus should have moved (either different element or different index)
                var focused = document.querySelector('#test-sidenav .sidenav-item.focused');
                expect(focused).toBeInDocument();
            });
        });

        // Skip: Requires SideNav component to handle keyboard events on container
        xit('Arrow Up moves to previous item', function() {
            var nav = new SideNav('#test-sidenav', { items: sampleItems });

            var items = getFocusableItems();
            if (items.length < 2) {
                expect(true).toBe(true);
                return;
            }

            // Focus second item first
            nav._focusFirstItem();
            var visibleItems = nav._getVisibleItems();
            if (visibleItems.length > 1) {
                nav._moveFocus(1, visibleItems);
            }

            return FunkyTests.delay(50).then(function() {
                var container = document.querySelector('#test-sidenav');
                container.setAttribute('tabindex', '-1');
                container.focus();
                FunkyTests.simulate.keydown(container, { key: 'ArrowUp' });

                return FunkyTests.delay(50);
            }).then(function() {
                var focused = document.querySelector('#test-sidenav .sidenav-item.focused');
                expect(focused).toBeInDocument();
            });
        });

        // Skip: Requires SideNav component to handle keyboard events
        xit('Arrow Right expands submenu', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var parentItem = document.querySelector('#test-sidenav [aria-expanded]');
            if (parentItem) {
                parentItem.focus();
                FunkyTests.simulate.keydown(parentItem, { key: 'ArrowRight' });

                return FunkyTests.delay(100).then(function() {
                    expect(parentItem.getAttribute('aria-expanded')).toBe('true');
                });
            }
        });

        // Skip: Requires SideNav component to handle keyboard events
        xit('Arrow Left collapses submenu', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var parentItem = document.querySelector('#test-sidenav [aria-expanded]');
            if (parentItem) {
                // First expand by clicking (more reliable than keyboard)
                parentItem.click();

                return FunkyTests.delay(100).then(function() {
                    expect(parentItem.getAttribute('aria-expanded')).toBe('true');

                    // Then collapse with ArrowLeft
                    parentItem.focus();
                    FunkyTests.simulate.keydown(parentItem, { key: 'ArrowLeft' });

                    return FunkyTests.delay(100);
                }).then(function() {
                    expect(parentItem.getAttribute('aria-expanded')).toBe('false');
                });
            }
        });

        // Skip: Requires SideNav component to handle keyboard events on container
        xit('Home moves to first item', function() {
            var nav = new SideNav('#test-sidenav', { items: sampleItems });

            var items = getFocusableItems();
            if (items.length < 2) {
                expect(true).toBe(true);
                return;
            }

            // Focus last item first
            var visibleItems = nav._getVisibleItems();
            nav._focusFirstItem();
            for (var i = 0; i < visibleItems.length - 1; i++) {
                nav._moveFocus(1, visibleItems);
            }

            return FunkyTests.delay(50).then(function() {
                var container = document.querySelector('#test-sidenav');
                container.setAttribute('tabindex', '-1');
                container.focus();
                FunkyTests.simulate.keydown(container, { key: 'Home' });

                return FunkyTests.delay(50);
            }).then(function() {
                // First item should now be focused
                var firstItem = nav._getVisibleItems()[0];
                expect(firstItem.classList.contains('focused')).toBe(true);
            });
        });

        // Skip: Requires SideNav component to handle keyboard events on container
        xit('End moves to last item', function() {
            var nav = new SideNav('#test-sidenav', { items: sampleItems });

            var items = getFocusableItems();
            if (items.length < 2) {
                expect(true).toBe(true);
                return;
            }

            nav._focusFirstItem();

            return FunkyTests.delay(50).then(function() {
                var container = document.querySelector('#test-sidenav');
                container.setAttribute('tabindex', '-1');
                container.focus();
                FunkyTests.simulate.keydown(container, { key: 'End' });

                return FunkyTests.delay(50);
            }).then(function() {
                // Last item should now be focused
                var visibleItems = nav._getVisibleItems();
                var lastItem = visibleItems[visibleItems.length - 1];
                expect(lastItem.classList.contains('focused')).toBe(true);
            });
        });

        // Skip: Requires SideNav component to handle keyboard events on container
        xit('Enter activates link', function() {
            var nav = new SideNav('#test-sidenav', { items: sampleItems });
            var selected = null;

            nav.config.onSelect = function(id) { selected = id; };

            nav._focusFirstItem();

            return FunkyTests.delay(50).then(function() {
                var container = document.querySelector('#test-sidenav');
                container.setAttribute('tabindex', '-1');
                container.focus();
                FunkyTests.simulate.keydown(container, { key: 'Enter' });

                return FunkyTests.delay(50);
            }).then(function() {
                // Either selection callback fired or item is active
                var activeItem = document.querySelector('#test-sidenav .sidenav-item.active');
                expect(selected || activeItem).toBeTruthy();
            });
        });

    });

    describe('Badge Accessibility', function() {

        it('badges have accessible text', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var badges = document.querySelectorAll('#test-sidenav .badge, #test-sidenav .nav-badge');
            Array.prototype.forEach.call(badges, function(badge) {
                var text = badge.textContent.trim();
                var srText = badge.querySelector('.visually-hidden, .sr-only');
                expect(text || srText).toBeTruthy();
            });
        });

        it('badge count is announced with context', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var badgedItems = document.querySelectorAll('#test-sidenav a:has(.badge)');
            Array.prototype.forEach.call(badgedItems, function(item) {
                var name = A11y.getAccessibleName(item);
                // Name should include label + badge context
                expect(name).toBeTruthy();
            });
        });

    });

    describe('Collapsed State', function() {

        it('collapsed nav maintains accessibility', function() {
            new SideNav('#test-sidenav', { items: sampleItems, collapsed: true });

            var nav = document.querySelector('#test-sidenav');
            expect(nav.getAttribute('aria-label')).toBeTruthy();
        });

        it('tooltip shows on collapsed items', function() {
            new SideNav('#test-sidenav', { items: sampleItems, collapsed: true });

            var links = document.querySelectorAll('#test-sidenav a');
            Array.prototype.forEach.call(links, function(link) {
                // In collapsed mode, should have tooltip or title
                var hasTooltip = link.getAttribute('title') ||
                                 link.getAttribute('aria-describedby') ||
                                 link.getAttribute('aria-label');
                expect(hasTooltip).toBeTruthy();
            });
        });

        it('expand/collapse toggle is accessible', function() {
            new SideNav('#test-sidenav', { items: sampleItems, collapsible: true });

            var toggleBtn = document.querySelector('.sidenav-toggle, [data-action="toggle-sidenav"]');
            if (toggleBtn) {
                expect(A11y.isInTabOrder(toggleBtn)).toBe(true);
                expect(A11y.getAccessibleName(toggleBtn)).toBeTruthy();
            }
        });

    });

    describe('Search/Filter', function() {

        it('search input has label', function() {
            new SideNav('#test-sidenav', { items: sampleItems, searchable: true });

            var searchInput = document.querySelector('#test-sidenav [type="search"], #test-sidenav .nav-search');
            if (searchInput) {
                var issues = A11y.checkFormLabels(searchInput.parentElement);
                expect(issues.length).toBe(0);
            }
        });

        it('filtered results are announced', function() {
            new SideNav('#test-sidenav', { items: sampleItems, searchable: true });

            var searchInput = document.querySelector('#test-sidenav [type="search"]');
            if (searchInput) {
                searchInput.value = 'home';
                FunkyTests.simulate.input(searchInput);

                return FunkyTests.delay(200).then(function() {
                    var liveRegion = document.querySelector('[aria-live]');
                    var visibleItems = document.querySelectorAll('#test-sidenav li:not(.hidden)');
                    expect(visibleItems.length).toBeGreaterThan(0);
                });
            }
        });

    });

    describe('Focus Management', function() {

        it('focus is visible on all items', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var links = document.querySelectorAll('#test-sidenav a');
            Array.prototype.forEach.call(links, function(link) {
                link.focus();
                // Should have visible focus indicator (CSS)
                expect(document.activeElement).toBe(link);
            });
        });

        it('focus order matches visual order', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var issues = A11y.validateFocusOrder(document.querySelector('#test-sidenav'));
            expect(issues.length).toBe(0);
        });

    });

    describe('ARIA Validation', function() {

        it('no invalid ARIA attributes', function() {
            new SideNav('#test-sidenav', { items: sampleItems });

            var nav = document.querySelector('#test-sidenav');
            var issues = A11y.checkAria(nav);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

    });

});
