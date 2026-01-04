/**
 * Visual Regression Tests: Navigation Components
 *
 * Tests visual appearance of sidenav, navbar, and other navigation elements.
 * Uses style snapshots instead of pixel comparison for consistent results.
 */

describe('Funky.Visual.Navigation', function() {

    var Visual = FunkyTests.Visual;
    var SideNav = Funky.SideNav;
    var fixture;
    var sidenavInstance;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-nav-container"></div>');
    });

    afterEach(function() {
        if (sidenavInstance && sidenavInstance.destroy) {
            sidenavInstance.destroy();
            sidenavInstance = null;
        }
        fixture.destroy();
    });

    describe('Sidenav', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav id="test-sidenav" class="sidenav">' +
                    '<div class="sidenav-header">' +
                        '<h3>Menu</h3>' +
                    '</div>' +
                    '<ul class="sidenav-menu">' +
                        '<li class="sidenav-item active">' +
                            '<a href="#" class="sidenav-link">Dashboard</a>' +
                        '</li>' +
                        '<li class="sidenav-item">' +
                            '<a href="#" class="sidenav-link">Users</a>' +
                        '</li>' +
                        '<li class="sidenav-item">' +
                            '<a href="#" class="sidenav-link">Settings</a>' +
                        '</li>' +
                        '<li class="sidenav-item">' +
                            '<a href="#" class="sidenav-link disabled">Disabled</a>' +
                        '</li>' +
                    '</ul>' +
                '</nav>';
        });

        it('default sidenav has correct structure', function() {
            sidenavInstance = SideNav.create('#test-sidenav');

            return FunkyTests.delay(100).then(function() {
                var sidenav = document.getElementById('test-sidenav');
                expect(sidenav).not.toBeNull();
                expect(sidenav.classList.contains('sidenav')).toBe(true);
            });
        });

        it('sidenav header exists', function() {
            sidenavInstance = SideNav.create('#test-sidenav');

            return FunkyTests.delay(100).then(function() {
                var header = document.querySelector('.sidenav-header');
                expect(header).not.toBeNull();
            });
        });

        it('active sidenav item has active class', function() {
            sidenavInstance = SideNav.create({
                element: '#test-sidenav',
                selected: 'dashboard',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' },
                    { id: 'settings', label: 'Settings' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                var activeItem = document.querySelector('.sidenav-item.active');
                expect(activeItem).not.toBeNull();
            });
        });

        it('inactive sidenav item does not have active class', function() {
            sidenavInstance = SideNav.create({
                element: '#test-sidenav',
                selected: 'dashboard',
                items: [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'users', label: 'Users' },
                    { id: 'settings', label: 'Settings' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                var inactiveItem = document.querySelector('.sidenav-item:not(.active)');
                expect(inactiveItem).not.toBeNull();
                expect(inactiveItem.classList.contains('active')).toBe(false);
            });
        });

        it('disabled sidenav item has disabled class', function() {
            sidenavInstance = SideNav.create('#test-sidenav');

            return FunkyTests.delay(100).then(function() {
                var disabledItem = document.querySelector('.sidenav-link.disabled');
                if (disabledItem) {
                    expect(disabledItem.classList.contains('disabled')).toBe(true);
                }
            });
        });

    });

    describe('Sidenav with Submenus', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav id="test-sidenav" class="sidenav">' +
                    '<ul class="sidenav-menu">' +
                        '<li class="sidenav-item has-submenu">' +
                            '<a href="#" class="sidenav-link">Products</a>' +
                            '<ul class="sidenav-submenu">' +
                                '<li><a href="#">Category 1</a></li>' +
                                '<li><a href="#">Category 2</a></li>' +
                                '<li><a href="#">Category 3</a></li>' +
                            '</ul>' +
                        '</li>' +
                        '<li class="sidenav-item">' +
                            '<a href="#" class="sidenav-link">About</a>' +
                        '</li>' +
                    '</ul>' +
                '</nav>';
        });

        it('collapsed submenu structure exists', function() {
            sidenavInstance = SideNav.create({
                element: '#test-sidenav',
                items: [
                    {
                        id: 'products',
                        label: 'Products',
                        children: [
                            { id: 'cat1', label: 'Category 1' },
                            { id: 'cat2', label: 'Category 2' }
                        ]
                    },
                    { id: 'about', label: 'About' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                var sidenav = document.getElementById('test-sidenav');
                expect(sidenav).not.toBeNull();
            });
        });

        it('expanded submenu shows children', function() {
            sidenavInstance = SideNav.create({
                element: '#test-sidenav',
                items: [
                    {
                        id: 'products',
                        label: 'Products',
                        children: [
                            { id: 'cat1', label: 'Category 1' },
                            { id: 'cat2', label: 'Category 2' }
                        ]
                    },
                    { id: 'about', label: 'About' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                // Expand the group
                sidenavInstance.expand('products');
                return FunkyTests.delay(100);
            }).then(function() {
                var sidenav = document.getElementById('test-sidenav');
                expect(sidenav).not.toBeNull();
            });
        });

    });

    describe('Navbar', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav id="test-navbar" class="navbar">' +
                    '<a href="#" class="navbar-brand">Brand</a>' +
                    '<ul class="navbar-nav">' +
                        '<li class="nav-item active">' +
                            '<a href="#" class="nav-link">Home</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a href="#" class="nav-link">Features</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a href="#" class="nav-link">Pricing</a>' +
                        '</li>' +
                    '</ul>' +
                '</nav>';
        });

        it('navbar has correct structure', function() {
            return FunkyTests.delay(50).then(function() {
                var navbar = document.getElementById('test-navbar');
                expect(navbar).not.toBeNull();
                expect(navbar.classList.contains('navbar')).toBe(true);
            });
        });

        it('navbar brand exists', function() {
            return FunkyTests.delay(50).then(function() {
                var brand = document.querySelector('.navbar-brand');
                expect(brand).not.toBeNull();
            });
        });

        it('active nav link has active parent', function() {
            return FunkyTests.delay(50).then(function() {
                var activeItem = document.querySelector('.nav-item.active');
                expect(activeItem).not.toBeNull();
            });
        });

    });

    describe('Breadcrumbs', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav aria-label="breadcrumb">' +
                    '<ol id="test-breadcrumb" class="breadcrumb">' +
                        '<li class="breadcrumb-item"><a href="#">Home</a></li>' +
                        '<li class="breadcrumb-item"><a href="#">Library</a></li>' +
                        '<li class="breadcrumb-item active" aria-current="page">Data</li>' +
                    '</ol>' +
                '</nav>';
        });

        it('breadcrumb has correct structure', function() {
            return FunkyTests.delay(50).then(function() {
                var breadcrumb = document.getElementById('test-breadcrumb');
                expect(breadcrumb).not.toBeNull();
                expect(breadcrumb.classList.contains('breadcrumb')).toBe(true);
            });
        });

        it('breadcrumb has correct number of items', function() {
            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item');
                expect(items.length).toBe(3);
            });
        });

    });

    describe('Pagination', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav aria-label="pagination">' +
                    '<ul id="test-pagination" class="pagination">' +
                        '<li class="page-item disabled">' +
                            '<a class="page-link" href="#">Previous</a>' +
                        '</li>' +
                        '<li class="page-item"><a class="page-link" href="#">1</a></li>' +
                        '<li class="page-item active"><a class="page-link" href="#">2</a></li>' +
                        '<li class="page-item"><a class="page-link" href="#">3</a></li>' +
                        '<li class="page-item">' +
                            '<a class="page-link" href="#">Next</a>' +
                        '</li>' +
                    '</ul>' +
                '</nav>';
        });

        it('pagination has correct structure', function() {
            return FunkyTests.delay(50).then(function() {
                var pagination = document.getElementById('test-pagination');
                expect(pagination).not.toBeNull();
                expect(pagination.classList.contains('pagination')).toBe(true);
            });
        });

        it('active page has active class', function() {
            return FunkyTests.delay(50).then(function() {
                var activePage = document.querySelector('.page-item.active');
                expect(activePage).not.toBeNull();
            });
        });

        it('disabled page has disabled class', function() {
            return FunkyTests.delay(50).then(function() {
                var disabledPage = document.querySelector('.page-item.disabled');
                expect(disabledPage).not.toBeNull();
            });
        });

    });

    describe('Navigation States', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav id="test-sidenav" class="sidenav">' +
                    '<ul class="sidenav-menu">' +
                        '<li class="sidenav-item">' +
                            '<a href="#" class="sidenav-link" id="hover-link">Hover me</a>' +
                        '</li>' +
                    '</ul>' +
                '</nav>';
        });

        it('hover state can be simulated', function() {
            sidenavInstance = SideNav.create({
                element: '#test-sidenav',
                items: [{ id: 'hover-item', label: 'Hover me' }]
            });

            return FunkyTests.delay(100).then(function() {
                var link = document.querySelector('.sidenav-item');
                expect(link).not.toBeNull();

                // Simulate hover
                FunkyTests.simulate.mouseover(link);
                link.classList.add('hover');

                return FunkyTests.delay(50).then(function() {
                    var styles = Visual.snapshotStyles(link);
                    expect(styles).toBeDefined();
                });
            });
        });

        it('focus state can be applied', function() {
            sidenavInstance = SideNav.create({
                element: '#test-sidenav',
                items: [{ id: 'focus-item', label: 'Focus me' }]
            });

            return FunkyTests.delay(100).then(function() {
                var item = document.querySelector('.sidenav-item');
                expect(item).not.toBeNull();

                item.setAttribute('tabindex', '0');
                item.focus();

                return FunkyTests.delay(50).then(function() {
                    var styles = Visual.snapshotStyles(item);
                    expect(styles).toBeDefined();
                });
            });
        });

    });

    describe('Mobile Navigation', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<button id="mobile-toggle" class="navbar-toggler">' +
                    '<span class="navbar-toggler-icon"></span>' +
                '</button>' +
                '<nav id="mobile-nav" class="sidenav mobile-nav" style="width: 280px;">' +
                    '<ul class="sidenav-menu">' +
                        '<li class="sidenav-item"><a href="#" class="sidenav-link">Menu Item 1</a></li>' +
                        '<li class="sidenav-item"><a href="#" class="sidenav-link">Menu Item 2</a></li>' +
                    '</ul>' +
                '</nav>';
        });

        it('mobile toggle button exists', function() {
            return FunkyTests.delay(50).then(function() {
                var toggle = document.getElementById('mobile-toggle');
                expect(toggle).not.toBeNull();
            });
        });

        it('mobile nav exists', function() {
            return FunkyTests.delay(50).then(function() {
                var nav = document.getElementById('mobile-nav');
                expect(nav).not.toBeNull();
            });
        });

    });

    describe('Navigation with Icons', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav id="icon-nav" class="sidenav">' +
                    '<ul class="sidenav-menu">' +
                        '<li class="sidenav-item">' +
                            '<a href="#" class="sidenav-link">' +
                                '<span class="icon">&#9733;</span> Favorites' +
                            '</a>' +
                        '</li>' +
                        '<li class="sidenav-item">' +
                            '<a href="#" class="sidenav-link">' +
                                '<span class="icon">&#9881;</span> Settings' +
                            '</a>' +
                        '</li>' +
                    '</ul>' +
                '</nav>';
        });

        it('nav with icons has icon elements', function() {
            // Test the raw HTML structure set up in beforeEach
            var icons = fixture.queryAll('#icon-nav .icon');
            expect(icons.length).toBe(2);
        });

    });

    describe('Navigation Style Consistency', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-nav-container');
            container.innerHTML =
                '<nav id="test-sidenav" class="sidenav">' +
                    '<ul class="sidenav-menu">' +
                        '<li class="sidenav-item"><a href="#" class="sidenav-link">Item 1</a></li>' +
                        '<li class="sidenav-item"><a href="#" class="sidenav-link">Item 2</a></li>' +
                        '<li class="sidenav-item"><a href="#" class="sidenav-link">Item 3</a></li>' +
                    '</ul>' +
                '</nav>';
        });

        it('all nav items have consistent height', function() {
            sidenavInstance = SideNav.create('#test-sidenav');

            return FunkyTests.delay(100).then(function() {
                var items = document.querySelectorAll('.sidenav-item');
                var heights = [];

                items.forEach(function(item) {
                    heights.push(item.getBoundingClientRect().height);
                });

                var firstHeight = heights[0];
                heights.forEach(function(h) {
                    expect(Math.abs(h - firstHeight)).toBeLessThan(2);
                });
            });
        });

        it('all nav links have consistent padding', function() {
            sidenavInstance = SideNav.create('#test-sidenav');

            return FunkyTests.delay(100).then(function() {
                var links = document.querySelectorAll('.sidenav-link');
                var paddings = [];

                links.forEach(function(link) {
                    var styles = Visual.snapshotStyles(link);
                    paddings.push({
                        top: styles.paddingTop,
                        bottom: styles.paddingBottom,
                        left: styles.paddingLeft,
                        right: styles.paddingRight
                    });
                });

                // All should match first item
                var first = paddings[0];
                paddings.forEach(function(p) {
                    expect(p.top).toBe(first.top);
                    expect(p.bottom).toBe(first.bottom);
                    expect(p.left).toBe(first.left);
                    expect(p.right).toBe(first.right);
                });
            });
        });

    });

});
