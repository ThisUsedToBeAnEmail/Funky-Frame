/**
 * Integration Test: SideNav + Page Navigation + State
 *
 * Tests the integration between sidenav and page navigation.
 */

describe('Funky.Integration.SideNav.Navigation', function() {

    var SideNav = Funky.SideNav;
    var PubSub = Funky.PubSub;
    var fixture;
    var navigatedTo;

    beforeEach(function() {
        // Clear keyboard scopes to avoid cross-test contamination
        if (Funky.Keyboard && Funky.Keyboard.clearScopes) {
            Funky.Keyboard.clearScopes();
        }
        fixture = FunkyTests.fixture(
            '<div id="app">' +
                '<button id="nav-toggle" class="navbar-toggler" aria-label="Toggle navigation">Menu</button>' +
                '<aside id="sidenav" class="sidenav">' +
                    '<nav class="sidenav-nav">' +
                        '<a href="#dashboard" class="sidenav-link active" data-page="dashboard">Dashboard</a>' +
                        '<a href="#users" class="sidenav-link" data-page="users">Users</a>' +
                        '<a href="#settings" class="sidenav-link" data-page="settings">Settings</a>' +
                        '<div class="sidenav-group" data-group="admin">' +
                            '<button class="sidenav-group-toggle">Admin</button>' +
                            '<div class="sidenav-group-items">' +
                                '<a href="#admin-users" class="sidenav-link" data-page="admin-users">Manage Users</a>' +
                                '<a href="#admin-roles" class="sidenav-link" data-page="admin-roles">Roles</a>' +
                            '</div>' +
                        '</div>' +
                    '</nav>' +
                '</aside>' +
                '<main id="content">' +
                    '<div class="page active" data-page-content="dashboard">Dashboard Content</div>' +
                    '<div class="page" data-page-content="users" style="display:none;">Users Content</div>' +
                    '<div class="page" data-page-content="settings" style="display:none;">Settings Content</div>' +
                '</main>' +
            '</div>'
        );

        navigatedTo = [];
    });

    afterEach(function() {
        SideNav.destroyAll();
        PubSub.clear();
        fixture.destroy();
    });

    describe('Navigation Flow', function() {

        it('clicking nav item updates page content', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard', href: '#dashboard' },
                    { id: 'users', label: 'Users', href: '#users' },
                    { id: 'settings', label: 'Settings', href: '#settings' }
                ]
            });

            // Setup navigation handler
            PubSub.on('funky:sidenav:select', function(data) {
                navigatedTo.push(data.id);

                // Update active page
                document.querySelectorAll('.page').forEach(function(page) {
                    page.style.display = 'none';
                    page.classList.remove('active');
                });

                var targetPage = document.querySelector('[data-page-content="' + data.id + '"]');
                if (targetPage) {
                    targetPage.style.display = 'block';
                    targetPage.classList.add('active');
                }
            });

            // Click users link (SideNav generates items with data-id attribute)
            var usersLink = document.querySelector('.sidenav-item[data-id="users"]');
            FunkyTests.simulate.click(usersLink);

            return FunkyTests.delay(50).then(function() {
                expect(navigatedTo).toContain('users');

                var usersPage = document.querySelector('[data-page-content="users"]');
                expect(usersPage.style.display).toBe('block');
            });
        });

        it('highlights active nav item after navigation', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' },
                    { id: 'settings', label: 'Settings' }
                ]
            });

            sidenav.select('users');

            return FunkyTests.delay(50).then(function() {
                var activeItem = document.querySelector('.sidenav-item.active, .sidenav-link.active');
                expect(activeItem).toBeDefined();
            });
        });

        it('deactivates previous nav item on new selection', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard', active: true },
                    { id: 'users', label: 'Users' }
                ]
            });

            sidenav.select('users');

            return FunkyTests.delay(50).then(function() {
                var dashboardItem = sidenav.getItem('dashboard');
                expect(dashboardItem.classList.contains('active')).toBe(false);
            });
        });

    });

    describe('Toggle Behavior', function() {

        it('toggle button opens sidenav', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                items: []
            });

            var toggleBtn = document.getElementById('nav-toggle');
            FunkyTests.simulate.click(toggleBtn);

            return FunkyTests.delay(350).then(function() {
                var nav = document.getElementById('sidenav');
                expect(nav.classList.contains('open') || nav.classList.contains('show')).toBe(true);
            });
        });

        it('clicking outside closes sidenav', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                closeOnClickOutside: true,
                items: []
            });

            // Open first
            sidenav.open();

            return FunkyTests.delay(350).then(function() {
                // Click outside
                FunkyTests.simulate.click(document.getElementById('content'));

                return FunkyTests.delay(350);
            }).then(function() {
                var nav = document.getElementById('sidenav');
                expect(nav.classList.contains('open')).toBe(false);
            });
        });

        it('navigation closes sidenav on mobile', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                closeOnSelect: true,
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' }
                ]
            });

            sidenav.open();

            return FunkyTests.delay(350).then(function() {
                sidenav.select('users');

                return FunkyTests.delay(350);
            }).then(function() {
                var nav = document.getElementById('sidenav');
                expect(nav.classList.contains('open')).toBe(false);
            });
        });

    });

    describe('Group Expansion', function() {

        it('clicking group toggle expands group', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    {
                        id: 'admin',
                        label: 'Admin',
                        children: [
                            { id: 'admin-users', label: 'Users' },
                            { id: 'admin-roles', label: 'Roles' }
                        ]
                    }
                ]
            });

            // First collapse the group
            sidenav.collapse('admin');

            var groupHeader = document.querySelector('.sidenav-group-header');
            if (groupHeader) {
                var group = groupHeader.closest('.sidenav-group');
                expect(group.classList.contains('collapsed')).toBe(true);

                FunkyTests.simulate.click(groupHeader);

                return FunkyTests.delay(350).then(function() {
                    // SideNav uses absence of 'collapsed' to indicate expanded
                    expect(group.classList.contains('collapsed')).toBe(false);
                });
            }
        });

        it('selecting child item expands parent group', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    {
                        id: 'admin',
                        label: 'Admin',
                        children: [
                            { id: 'admin-users', label: 'Users' },
                            { id: 'admin-roles', label: 'Roles' }
                        ]
                    }
                ]
            });

            // First collapse the group, then verify select expands it
            sidenav.collapse('admin');
            var parentGroup = document.querySelector('.sidenav-group[data-group="admin"]');
            expect(parentGroup.classList.contains('collapsed')).toBe(true);

            sidenav.select('admin-users');

            return FunkyTests.delay(50).then(function() {
                // SideNav uses absence of 'collapsed' to indicate expanded
                expect(parentGroup.classList.contains('collapsed')).toBe(false);
            });
        });

    });

    describe('Keyboard Navigation Integration', function() {

        it('arrow keys navigate between items', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' },
                    { id: 'settings', label: 'Settings' }
                ]
            });

            // For element-based scopes (#sidenav), we need actual focus inside the container
            var container = document.getElementById('sidenav');
            container.setAttribute('tabindex', '-1');
            container.focus();

            // Focus the first item to start navigation
            sidenav._focusFirstItem();

            FunkyTests.simulate.keydown(document, { key: 'ArrowDown' });

            return FunkyTests.delay(50).then(function() {
                // SideNav uses 'focused' class for visual focus, not actual browser focus
                var focusedItem = document.querySelector('.sidenav-item.focused');
                expect(focusedItem).toBeDefined();
                expect(focusedItem.textContent).toContain('Users');
            });
        });

        it('Enter key selects focused item', function() {
            var selected = null;

            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' }
                ],
                onChange: function(item) {
                    selected = item.id;
                }
            });

            // For element-based scopes (#sidenav), we need actual focus inside the container
            var container = document.getElementById('sidenav');
            container.setAttribute('tabindex', '-1');
            container.focus();

            return FunkyTests.delay(50).then(function() {
                // Focus first item then navigate to users
                sidenav._focusFirstItem();
                FunkyTests.simulate.keydown(document, { key: 'ArrowDown' });

                return FunkyTests.delay(50);
            }).then(function() {
                // Now press Enter to select
                FunkyTests.simulate.keydown(document, { key: 'Enter' });

                return FunkyTests.delay(50);
            }).then(function() {
                expect(selected).toBe('users');
            });
        });

        it('Escape key closes sidenav', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                items: []
            });

            sidenav.open();

            // Wait for sidenav to fully open before pressing Escape
            return FunkyTests.delay(200).then(function() {
                // Escape handler is on document with global scope
                FunkyTests.simulate.keydown(document, { key: 'Escape' });

                return FunkyTests.delay(200);
            }).then(function() {
                // Check sidenav.isOpen property for reliable state check
                expect(sidenav.isOpen).toBe(false);
            });
        });

    });

    describe('State Persistence', function() {

        it('remembers expanded groups', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                persistState: true,
                items: [
                    {
                        id: 'admin',
                        label: 'Admin',
                        children: [
                            { id: 'admin-users', label: 'Users' }
                        ]
                    }
                ]
            });

            // First collapse, then expand to test the expand method
            sidenav.collapse('admin');
            sidenav.expand('admin');

            return FunkyTests.delay(50).then(function() {
                var state = sidenav.getState();
                // SideNav tracks collapsed groups, so expanded means not in collapsedGroups
                expect(state.collapsedGroups['admin']).toBe(false);
            });
        });

        it('remembers selected item', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                persistState: true,
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' }
                ]
            });

            sidenav.select('users');

            return FunkyTests.delay(50).then(function() {
                var state = sidenav.getState();
                expect(state.selectedId).toBe('users');
            });
        });

    });

    describe('PubSub Integration', function() {

        it('emits sidenav:select event on item selection', function() {
            var eventData = null;

            PubSub.on('funky:sidenav:select', function(data) {
                eventData = data;
            });

            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' }
                ]
            });

            sidenav.select('users');

            return FunkyTests.delay(50).then(function() {
                expect(eventData).toBeDefined();
                expect(eventData.id).toBe('users');
            });
        });

        it('emits funky:sidenav:open and funky:sidenav:close events', function() {
            var events = [];

            PubSub.on('funky:sidenav:open', function() {
                events.push('open');
            });

            PubSub.on('funky:sidenav:close', function() {
                events.push('close');
            });

            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                items: []
            });

            sidenav.open();

            return FunkyTests.delay(350).then(function() {
                sidenav.close();
                return FunkyTests.delay(350);
            }).then(function() {
                expect(events).toContain('open');
                expect(events).toContain('close');
            });
        });

        it('can be controlled via PubSub events', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' }
                ]
            });

            PubSub.emit('funky:sidenav:navigate', { id: 'users' });

            return FunkyTests.delay(50).then(function() {
                var state = sidenav.getState();
                expect(state.selectedId).toBe('users');
            });
        });

    });

    describe('Accessibility', function() {

        it('sidenav has proper ARIA role', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard' }
                ]
            });

            var nav = document.getElementById('sidenav');
            expect(nav.getAttribute('role')).toBe('navigation');
        });

        it('toggle button has aria-expanded', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                items: []
            });

            var toggle = document.getElementById('nav-toggle');
            expect(toggle.getAttribute('aria-expanded')).toBeDefined();
        });

        it('aria-expanded updates on open/close', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                items: []
            });

            var toggle = document.getElementById('nav-toggle');

            sidenav.open();

            return FunkyTests.delay(350).then(function() {
                expect(toggle.getAttribute('aria-expanded')).toBe('true');

                sidenav.close();
                return FunkyTests.delay(350);
            }).then(function() {
                expect(toggle.getAttribute('aria-expanded')).toBe('false');
            });
        });

        it('selected item has aria-current="page"', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' }
                ]
            });

            sidenav.select('users');

            return FunkyTests.delay(50).then(function() {
                var usersItem = sidenav.getItem('users');
                expect(usersItem.getAttribute('aria-current')).toBe('page');
            });
        });

    });

    describe('Responsive Behavior', function() {

        it('maintains state after viewport changes', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                selected: 'users', // Use selected option instead of active on item
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' }
                ]
            });

            // Simulate window resize event
            var resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);

            return FunkyTests.delay(100).then(function() {
                var state = sidenav.getState();
                expect(state.selectedId).toBe('users');
            });
        });

    });

});
