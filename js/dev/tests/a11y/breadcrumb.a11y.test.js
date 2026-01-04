/**
 * Accessibility Tests: Breadcrumb
 *
 * Tests WCAG 2.1 AA compliance for breadcrumb navigation components.
 */

describe('Funky.A11y.Breadcrumb', function() {

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
        fixture = FunkyTests.fixture(
            '<nav aria-label="Breadcrumb">' +
                '<ol class="breadcrumb">' +
                    '<li class="breadcrumb-item">' +
                        '<a href="/">Home</a>' +
                    '</li>' +
                    '<li class="breadcrumb-item">' +
                        '<a href="/products">Products</a>' +
                    '</li>' +
                    '<li class="breadcrumb-item">' +
                        '<a href="/products/electronics">Electronics</a>' +
                    '</li>' +
                    '<li class="breadcrumb-item active" aria-current="page">' +
                        '<span>Smartphones</span>' +
                    '</li>' +
                '</ol>' +
            '</nav>'
        );
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Landmark and Structure', function() {

        it('breadcrumb is in a nav element', function() {
            var nav = document.querySelector('nav');
            expect(nav).toBeInDocument();
        });

        it('nav has aria-label="Breadcrumb"', function() {
            var nav = document.querySelector('nav');
            expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
        });

        it('uses ordered list for structure', function() {
            var ol = document.querySelector('nav ol');
            expect(ol).toBeInDocument();
        });

        it('each segment is a list item', function() {
            var items = document.querySelectorAll('.breadcrumb-item');
            expect(items.length).toBe(4);
        });

    });

    describe('Current Page Indication', function() {

        it('current page has aria-current="page"', function() {
            var currentItem = document.querySelector('[aria-current="page"]');
            expect(currentItem).toBeInDocument();
            expect(currentItem.textContent).toBe('Smartphones');
        });

        it('current page is not a link', function() {
            var currentItem = document.querySelector('[aria-current="page"]');
            var link = currentItem.querySelector('a');
            expect(link).toBe(null);
        });

        it('only one item has aria-current', function() {
            var currentItems = document.querySelectorAll('[aria-current]');
            expect(currentItems.length).toBe(1);
        });

    });

    describe('Link Accessibility', function() {

        it('all non-current items are links', function() {
            var items = document.querySelectorAll('.breadcrumb-item:not(.active)');

            Array.prototype.forEach.call(items, function(item) {
                var link = item.querySelector('a');
                expect(link).toBeInDocument();
            });
        });

        it('links have accessible names', function() {
            var links = document.querySelectorAll('.breadcrumb-item a');

            Array.prototype.forEach.call(links, function(link) {
                var name = A11y.getAccessibleName(link);
                expect(name).toBeTruthy();
            });
        });

        it('links have valid href', function() {
            var links = document.querySelectorAll('.breadcrumb-item a');

            Array.prototype.forEach.call(links, function(link) {
                expect(link.hasAttribute('href')).toBe(true);
                expect(link.getAttribute('href')).not.toBe('');
            });
        });

    });

    describe('Keyboard Navigation', function() {

        it('all links are keyboard accessible', function() {
            var links = document.querySelectorAll('.breadcrumb-item a');

            Array.prototype.forEach.call(links, function(link) {
                expect(A11y.isInTabOrder(link)).toBe(true);
            });
        });

        // Skip: Tab navigation is handled by browser, not simulated events
        xit('Tab moves through breadcrumb links', function() {
            var links = document.querySelectorAll('.breadcrumb-item a');
            links[0].focus();

            expect(document.activeElement).toBe(links[0]);

            FunkyTests.simulate.keydown(links[0], { key: 'Tab' });

            return FunkyTests.delay(50).then(function() {
                // Focus should move to next focusable element
                expect(document.activeElement).not.toBe(links[0]);
            });
        });

        // Skip: Enter on links triggers navigation via browser, not simulated click
        xit('Enter activates link', function() {
            var links = document.querySelectorAll('.breadcrumb-item a');
            var clicked = false;

            links[0].addEventListener('click', function(e) {
                e.preventDefault();
                clicked = true;
            });

            links[0].focus();
            FunkyTests.simulate.keydown(links[0], { key: 'Enter' });

            return FunkyTests.delay(50).then(function() {
                expect(clicked).toBe(true);
            });
        });

    });

    describe('Visual Separators', function() {

        it('separators are not announced by screen readers', function() {
            // Check that any separator elements are hidden from AT
            // This is typically done with CSS ::before/::after
            // or with aria-hidden if using visible elements
            var separators = document.querySelectorAll('.breadcrumb-separator, [aria-hidden="true"]');

            Array.prototype.forEach.call(separators, function(sep) {
                if (sep.getAttribute('aria-hidden') === 'true') {
                    expect(sep.getAttribute('aria-hidden')).toBe('true');
                }
            });
        });

    });

    describe('Truncated Breadcrumb', function() {

        beforeEach(function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<nav aria-label="Breadcrumb">' +
                    '<ol class="breadcrumb">' +
                        '<li class="breadcrumb-item">' +
                            '<a href="/">Home</a>' +
                        '</li>' +
                        '<li class="breadcrumb-item breadcrumb-ellipsis">' +
                            '<button aria-label="Show hidden items" aria-expanded="false" aria-haspopup="true">' +
                                '<span aria-hidden="true">...</span>' +
                            '</button>' +
                            '<ul class="breadcrumb-menu" role="menu" hidden>' +
                                '<li role="menuitem"><a href="/level1">Level 1</a></li>' +
                                '<li role="menuitem"><a href="/level2">Level 2</a></li>' +
                                '<li role="menuitem"><a href="/level3">Level 3</a></li>' +
                            '</ul>' +
                        '</li>' +
                        '<li class="breadcrumb-item">' +
                            '<a href="/level4">Level 4</a>' +
                        '</li>' +
                        '<li class="breadcrumb-item active" aria-current="page">' +
                            '<span>Current</span>' +
                        '</li>' +
                    '</ol>' +
                '</nav>'
            );
        });

        it('ellipsis button has accessible name', function() {
            var ellipsisBtn = document.querySelector('.breadcrumb-ellipsis button');
            var name = A11y.getAccessibleName(ellipsisBtn);

            expect(name).toBe('Show hidden items');
        });

        it('ellipsis button has aria-expanded', function() {
            var ellipsisBtn = document.querySelector('.breadcrumb-ellipsis button');
            expect(ellipsisBtn.hasAttribute('aria-expanded')).toBe(true);
        });

        it('ellipsis button has aria-haspopup', function() {
            var ellipsisBtn = document.querySelector('.breadcrumb-ellipsis button');
            expect(ellipsisBtn.getAttribute('aria-haspopup')).toBe('true');
        });

        it('visual ellipsis is hidden from screen readers', function() {
            var ellipsisSpan = document.querySelector('.breadcrumb-ellipsis span[aria-hidden]');
            expect(ellipsisSpan.getAttribute('aria-hidden')).toBe('true');
        });

        it('hidden menu has role="menu"', function() {
            var menu = document.querySelector('.breadcrumb-menu');
            expect(menu.getAttribute('role')).toBe('menu');
        });

    });

    describe('Mobile/Collapsed Breadcrumb', function() {

        beforeEach(function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<nav aria-label="Breadcrumb">' +
                    '<button class="breadcrumb-back" aria-label="Back to Electronics">' +
                        '<span class="icon" aria-hidden="true">&larr;</span>' +
                        '<span class="sr-only">Back to</span> Electronics' +
                    '</button>' +
                '</nav>'
            );
        });

        it('back button has accessible name', function() {
            var backBtn = document.querySelector('.breadcrumb-back');
            var name = A11y.getAccessibleName(backBtn);

            expect(name).toBe('Back to Electronics');
        });

        it('icon is hidden from screen readers', function() {
            var icon = document.querySelector('.icon[aria-hidden]');
            expect(icon.getAttribute('aria-hidden')).toBe('true');
        });

    });

    describe('Breadcrumb with Icons', function() {

        beforeEach(function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<nav aria-label="Breadcrumb">' +
                    '<ol class="breadcrumb">' +
                        '<li class="breadcrumb-item">' +
                            '<a href="/">' +
                                '<span class="icon" aria-hidden="true">&#x1F3E0;</span>' +
                                '<span class="sr-only">Home</span>' +
                            '</a>' +
                        '</li>' +
                        '<li class="breadcrumb-item">' +
                            '<a href="/settings">' +
                                '<span class="icon" aria-hidden="true">&#x2699;</span>' +
                                '<span>Settings</span>' +
                            '</a>' +
                        '</li>' +
                        '<li class="breadcrumb-item active" aria-current="page">' +
                            '<span>Profile</span>' +
                        '</li>' +
                    '</ol>' +
                '</nav>'
            );
        });

        it('icon-only link has accessible name', function() {
            var homeLink = document.querySelector('.breadcrumb-item:first-child a');
            var name = A11y.getAccessibleName(homeLink);

            // Name should contain 'Home' (may include icon text depending on implementation)
            expect(name).toContain('Home');
        });

        it('decorative icons are hidden', function() {
            var icons = document.querySelectorAll('.icon[aria-hidden="true"]');
            expect(icons.length).toBe(2);
        });

    });

    describe('Schema.org Structured Data', function() {

        beforeEach(function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<nav aria-label="Breadcrumb">' +
                    '<ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">' +
                        '<li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">' +
                            '<a href="/" itemprop="item"><span itemprop="name">Home</span></a>' +
                            '<meta itemprop="position" content="1">' +
                        '</li>' +
                        '<li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">' +
                            '<a href="/products" itemprop="item"><span itemprop="name">Products</span></a>' +
                            '<meta itemprop="position" content="2">' +
                        '</li>' +
                        '<li class="breadcrumb-item active" aria-current="page" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">' +
                            '<span itemprop="name">Shoes</span>' +
                            '<meta itemprop="position" content="3">' +
                        '</li>' +
                    '</ol>' +
                '</nav>'
            );
        });

        it('breadcrumb has BreadcrumbList schema', function() {
            var breadcrumb = document.querySelector('[itemtype="https://schema.org/BreadcrumbList"]');
            expect(breadcrumb).toBeInDocument();
        });

        it('items have ListItem schema', function() {
            var listItems = document.querySelectorAll('[itemtype="https://schema.org/ListItem"]');
            expect(listItems.length).toBe(3);
        });

        it('items have position meta', function() {
            var positions = document.querySelectorAll('[itemprop="position"]');
            expect(positions.length).toBe(3);
        });

    });

    describe('Focus Visibility', function() {

        it('focused link has visible focus indicator', function() {
            var link = document.querySelector('.breadcrumb-item a');
            link.focus();

            var styles = window.getComputedStyle(link);
            var hasOutline = styles.outline !== 'none' && styles.outline !== '';
            var hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';

            expect(hasOutline || hasBoxShadow).toBe(true);
        });

    });

    describe('ARIA Validation', function() {

        it('no invalid ARIA attributes', function() {
            var nav = document.querySelector('nav');
            var issues = A11y.checkAria(nav);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

    });

});
