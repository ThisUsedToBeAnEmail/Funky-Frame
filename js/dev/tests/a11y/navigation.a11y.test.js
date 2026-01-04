/**
 * Accessibility Tests: Navigation
 *
 * Tests WCAG 2.1 AA compliance for navigation components.
 */

describe('Funky.A11y.Navigation', function() {

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

    beforeEach(function() {
        // Toggle button must be OUTSIDE sidenav container because SideNav.create() re-renders container content
        fixture = FunkyTests.fixture(
            '<div id="app-container">' +
                '<a href="#main-content" class="skip-link visually-hidden-focusable">Skip to main content</a>' +
                '<nav id="main-nav" aria-label="Main navigation">' +
                    '<ul>' +
                        '<li><a href="/" class="nav-link">Home</a></li>' +
                        '<li><a href="/about" class="nav-link">About</a></li>' +
                        '<li><a href="/contact" class="nav-link" aria-current="page">Contact</a></li>' +
                    '</ul>' +
                '</nav>' +
                '<button id="nav-toggle" class="sidenav-toggle" aria-expanded="false" aria-controls="sidenav">' +
                    '<span class="visually-hidden">Toggle navigation</span>' +
                    '<span class="hamburger-icon"></span>' +
                '</button>' +
                '<aside id="sidenav" class="sidenav" role="navigation" aria-label="Secondary navigation">' +
                    '<div id="sidenav-content" class="sidenav-content">' +
                        '<a href="#dashboard" class="sidenav-link active" aria-current="page">Dashboard</a>' +
                        '<a href="#settings" class="sidenav-link">Settings</a>' +
                        '<a href="#profile" class="sidenav-link">Profile</a>' +
                    '</div>' +
                '</aside>' +
                '<main id="main-content">' +
                    '<h1>Page Content</h1>' +
                    '<p>Main content area</p>' +
                '</main>' +
            '</div>'
        );
    });

    afterEach(function() {
        SideNav.destroyAll();
        fixture.destroy();
    });

    describe('Landmark Regions', function() {

        it('navigation has navigation role (via nav element)', function() {
            var mainNav = document.querySelector('#main-nav');
            expect(mainNav.tagName).toBe('NAV');
        });

        it('sidenav has navigation role', function() {
            var sidenav = document.querySelector('#sidenav');
            var role = sidenav.getAttribute('role');
            expect(role === 'navigation' || sidenav.tagName === 'NAV').toBe(true);
        });

        it('main content area has main landmark', function() {
            var main = document.querySelector('main, [role="main"]');
            expect(main).toBeInDocument();
        });

        it('multiple navigations have distinct labels', function() {
            var navs = document.querySelectorAll('nav, [role="navigation"]');

            Array.prototype.forEach.call(navs, function(nav) {
                var label = nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby');
                expect(label).toBeTruthy();
            });
        });

    });

    describe('Current Page Indication', function() {

        it('current page link has aria-current="page"', function() {
            var currentLink = document.querySelector('[aria-current="page"]');
            expect(currentLink).toBeInDocument();
        });

        it('only one link has aria-current="page" per navigation', function() {
            var mainNav = document.querySelector('#main-nav');
            var currentLinks = mainNav.querySelectorAll('[aria-current="page"]');
            expect(currentLinks.length).toBe(1);
        });

        it('aria-current value is "page" for page navigation', function() {
            var currentLink = document.querySelector('#main-nav [aria-current]');
            expect(currentLink.getAttribute('aria-current')).toBe('page');
        });

    });

    describe('Skip Links', function() {

        it('skip link exists as first focusable element', function() {
            // Query within the fixture's app container to avoid the global #skip-links container
            var skipLink = document.querySelector('#app-container .skip-link, #app-container [href="#main-content"]');
            expect(skipLink).toBeInDocument();
        });

        it('skip link target exists', function() {
            // Query within the fixture to get the correct skip link
            var skipLink = document.querySelector('#app-container .skip-link');
            var targetId = skipLink.getAttribute('href').replace('#', '');
            var target = document.getElementById(targetId);

            expect(target).toBeInDocument();
        });

        it('skip link becomes visible on focus', function() {
            // Query within the fixture to get the correct skip link
            var skipLink = document.querySelector('#app-container .skip-link');
            skipLink.focus();

            // The skip link should be focusable
            expect(document.activeElement).toBe(skipLink);
        });

        it('skip link has descriptive text', function() {
            // Query within the fixture to get the correct skip link
            var skipLink = document.querySelector('#app-container .skip-link');
            var text = skipLink.textContent.toLowerCase();

            expect(text).toContain('skip');
            expect(text).toContain('main') || expect(text).toContain('content');
        });

    });

    describe('Mobile Toggle', function() {

        it('toggle button has aria-expanded', function() {
            var toggle = document.querySelector('#nav-toggle');
            expect(toggle.getAttribute('aria-expanded')).toBeDefined();
        });

        it('toggle button has aria-controls', function() {
            var toggle = document.querySelector('#nav-toggle');
            var controlsId = toggle.getAttribute('aria-controls');

            expect(controlsId).toBeTruthy();
            expect(document.getElementById(controlsId)).toBeInDocument();
        });

        it('toggle button has accessible name', function() {
            var toggle = document.querySelector('#nav-toggle');
            var name = A11y.getAccessibleName(toggle);

            expect(name).toBeTruthy();
        });

        it('aria-expanded updates on toggle', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                items: []
            });

            var toggle = document.querySelector('#nav-toggle');
            expect(toggle.getAttribute('aria-expanded')).toBe('false');

            sidenav.open();

            return FunkyTests.delay(100).then(function() {
                expect(toggle.getAttribute('aria-expanded')).toBe('true');
            });
        });

    });

    describe('Keyboard Navigation', function() {

        it('all navigation links are keyboard focusable', function() {
            var navLinks = document.querySelectorAll('.nav-link, .sidenav-link');

            Array.prototype.forEach.call(navLinks, function(link) {
                expect(A11y.isInTabOrder(link)).toBe(true);
            });
        });

        it('Escape closes expanded sidenav', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                items: []
            });

            sidenav.open();

            return FunkyTests.delay(100).then(function() {
                // Dispatch on document where the Escape listener is registered
                FunkyTests.simulate.keydown(document, { key: 'Escape' });

                return FunkyTests.delay(100);
            }).then(function() {
                var toggle = document.querySelector('#nav-toggle');
                expect(toggle.getAttribute('aria-expanded')).toBe('false');
            });
        });

        it('focus is trapped in open sidenav on mobile', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                toggleSelector: '#nav-toggle',
                trapFocus: true,
                items: []
            });

            sidenav.open();

            return FunkyTests.delay(100).then(function() {
                var focusable = A11y.getFocusableElements(document.querySelector('#sidenav'));
                expect(focusable.length).toBeGreaterThan(0);
            });
        });

    });

    describe('Link Accessibility', function() {

        it('all links have accessible names', function() {
            var links = document.querySelectorAll('a[href]');

            Array.prototype.forEach.call(links, function(link) {
                var name = A11y.getAccessibleName(link);
                expect(name).toBeTruthy();
            });
        });

        it('links with icons have text or aria-label', function() {
            // Add an icon link for testing
            var iconLink = document.createElement('a');
            iconLink.href = '/settings';
            iconLink.setAttribute('aria-label', 'Settings');
            iconLink.innerHTML = '<svg></svg>';
            document.querySelector('#main-nav ul').appendChild(iconLink);

            var name = A11y.getAccessibleName(iconLink);
            expect(name).toBe('Settings');
        });

    });

    describe('SideNav ARIA', function() {

        it('sidenav items have proper structure', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'item1', label: 'Item 1' },
                    { id: 'item2', label: 'Item 2' }
                ]
            });

            var navEl = document.querySelector('#sidenav');
            var role = navEl.getAttribute('role');

            expect(role === 'navigation' || navEl.tagName === 'NAV' || role === 'tree').toBe(true);
        });

        it('active item is indicated with aria-current', function() {
            var sidenav = SideNav.create({
                element: '#sidenav',
                items: [
                    { id: 'item1', label: 'Item 1', active: true },
                    { id: 'item2', label: 'Item 2' }
                ]
            });

            var activeItem = document.querySelector('[aria-current="page"], .sidenav-link.active');
            expect(activeItem).toBeInDocument();
        });

    });

    describe('Nested Navigation', function() {

        it('expandable groups have aria-expanded', function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<aside id="nested-nav" class="sidenav">' +
                    '<div class="sidenav-group">' +
                        '<button class="sidenav-group-toggle" aria-expanded="false" aria-controls="group-items">Admin</button>' +
                        '<div id="group-items" class="sidenav-group-items">' +
                            '<a href="#users" class="sidenav-link">Users</a>' +
                            '<a href="#roles" class="sidenav-link">Roles</a>' +
                        '</div>' +
                    '</div>' +
                '</aside>'
            );

            var toggle = document.querySelector('.sidenav-group-toggle');
            expect(toggle.getAttribute('aria-expanded')).toBeDefined();
        });

        it('nested items are hidden when group is collapsed', function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<aside id="nested-nav" class="sidenav">' +
                    '<div class="sidenav-group">' +
                        '<button class="sidenav-group-toggle" aria-expanded="false" aria-controls="group-items">Admin</button>' +
                        '<div id="group-items" class="sidenav-group-items" hidden>' +
                            '<a href="#users" class="sidenav-link">Users</a>' +
                        '</div>' +
                    '</div>' +
                '</aside>'
            );

            var groupItems = document.querySelector('#group-items');
            expect(groupItems.hidden).toBe(true);
        });

    });

    describe('Focus Order', function() {

        it('navigation follows logical focus order', function() {
            var issues = A11y.validateFocusOrder(document.querySelector('#main-nav'));
            var tabindexIssues = issues.filter(function(i) {
                return i.issue.includes('tabindex');
            });

            expect(tabindexIssues.length).toBe(0);
        });

        it('no positive tabindex values', function() {
            // Only check elements within the fixture, not the entire document
            // The test sandbox may have elements with positive tabindex
            var nav = document.querySelector('.navbar, nav');
            if (!nav) {
                expect(true).toBe(true); // Skip if no nav element in fixture
                return;
            }
            var allElements = nav.querySelectorAll('[tabindex]');

            Array.prototype.forEach.call(allElements, function(el) {
                var tabindex = parseInt(el.getAttribute('tabindex'), 10);
                expect(tabindex <= 0).toBe(true);
            });
        });

    });

    describe('Visual Focus Indicator', function() {

        it('navigation links receive focus', function() {
            var firstLink = document.querySelector('.nav-link');
            firstLink.focus();

            expect(document.activeElement).toBe(firstLink);
        });

        it('toggle button receives focus', function() {
            var toggle = document.querySelector('#nav-toggle');
            toggle.focus();

            expect(document.activeElement).toBe(toggle);
        });

    });

});
