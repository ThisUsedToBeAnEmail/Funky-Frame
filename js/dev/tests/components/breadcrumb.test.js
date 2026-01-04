/**
 * Funky.Breadcrumb Tests
 *
 * Tests for the breadcrumb navigation component.
 */

describe('Funky.Component.Breadcrumb', function() {

    var Breadcrumb;
    var fixture;

    beforeEach(function() {
        // Get fresh reference - module may load after test file
        Breadcrumb = Funky.Breadcrumb;

        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        // Clear instances using registry API
        if (Breadcrumb && Breadcrumb._instances) {
            Breadcrumb._instances.list().forEach(function(id) {
                Breadcrumb._instances.unregister(id);
            });
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Breadcrumb')).toBe(true);
        });

        it('has generate method', function() {
            expect(typeof Breadcrumb.generate).toBe('function');
        });

        it('has render method', function() {
            expect(typeof Breadcrumb.render).toBe('function');
        });

        it('has addLabels method', function() {
            expect(typeof Breadcrumb.addLabels).toBe('function');
        });

        it('has formatLabel method', function() {
            expect(typeof Breadcrumb.formatLabel).toBe('function');
        });

        it('has autoInit method', function() {
            expect(typeof Breadcrumb.autoInit).toBe('function');
        });

        it('has setData method', function() {
            expect(typeof Breadcrumb.setData).toBe('function');
        });

    });

    describe('generate()', function() {

        it('returns array of breadcrumb items', function() {
            var crumbs = Breadcrumb.generate('/');

            expect(Array.isArray(crumbs)).toBe(true);
        });

        it('includes Home as first item', function() {
            var crumbs = Breadcrumb.generate('/some/path');

            expect(crumbs[0].label).toBe('Home');
            expect(crumbs[0].url).toBe('/');
            expect(crumbs[0].icon).toBe('fa-home');
        });

        it('parses path segments', function() {
            var crumbs = Breadcrumb.generate('/trades/list');

            expect(crumbs.length).toBeGreaterThan(1);
        });

        it('marks last item as active', function() {
            var crumbs = Breadcrumb.generate('/trades/list');

            var lastCrumb = crumbs[crumbs.length - 1];
            expect(lastCrumb.active).toBe(true);
        });

        it('last item has no URL', function() {
            var crumbs = Breadcrumb.generate('/trades/list');

            var lastCrumb = crumbs[crumbs.length - 1];
            expect(lastCrumb.url).toBeNull();
        });

        it('skips numeric IDs', function() {
            var crumbs = Breadcrumb.generate('/trades/123/edit');

            // Should not have a "123" label
            var labels = crumbs.map(function(c) { return c.label; });
            expect(labels).not.toContain('123');
        });

        it('uses label mappings', function() {
            var crumbs = Breadcrumb.generate('/trades');

            var tradesCrumb = crumbs.find(function(c) { return c.label === 'Trades'; });
            expect(tradesCrumb).toBeDefined();
        });

        it('formats unmapped segments', function() {
            var crumbs = Breadcrumb.generate('/custom_route');

            var customCrumb = crumbs.find(function(c) { return c.label === 'Custom Route'; });
            expect(customCrumb).toBeDefined();
        });

    });

    describe('formatLabel()', function() {

        it('replaces underscores with spaces', function() {
            var result = Breadcrumb.formatLabel('my_route');
            expect(result).toBe('My Route');
        });

        it('replaces hyphens with spaces', function() {
            var result = Breadcrumb.formatLabel('my-route');
            expect(result).toBe('My Route');
        });

        it('capitalizes words', function() {
            var result = Breadcrumb.formatLabel('hello world');
            expect(result).toBe('Hello World');
        });

        it('handles single word', function() {
            var result = Breadcrumb.formatLabel('trades');
            expect(result).toBe('Trades');
        });

    });

    describe('addLabels()', function() {

        it('adds new label mappings', function() {
            Breadcrumb.addLabels({
                'custom_page': 'My Custom Page'
            });

            expect(Breadcrumb.labels['custom_page']).toBe('My Custom Page');
        });

        it('overrides existing labels', function() {
            var original = Breadcrumb.labels['trades'];

            Breadcrumb.addLabels({
                'trades': 'All Trades'
            });

            expect(Breadcrumb.labels['trades']).toBe('All Trades');

            // Restore
            Breadcrumb.labels['trades'] = original;
        });

    });

    describe('render()', function() {

        it('renders breadcrumbs to container', function() {
            fixture.html('<nav id="breadcrumb"></nav>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var ol = container.querySelector('.breadcrumb-pro');
            expect(ol).not.toBeNull();
        });

        it('creates list items', function() {
            fixture.html('<nav id="breadcrumb"></nav>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var items = container.querySelectorAll('.breadcrumb-item');
            expect(items.length).toBeGreaterThan(0);
        });

        it('accepts selector string', function() {
            fixture.html('<nav id="breadcrumb"></nav>');

            Breadcrumb.render('#breadcrumb');

            var ol = fixture.query('.breadcrumb-pro');
            expect(ol).not.toBeNull();
        });

        it('Home link has icon', function() {
            fixture.html('<nav id="breadcrumb"></nav>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var homeLink = container.querySelector('.breadcrumb-home');
            expect(homeLink).not.toBeNull();

            var icon = homeLink.querySelector('.fa-home');
            expect(icon).not.toBeNull();
        });

        it('Home link has aria-label', function() {
            fixture.html('<nav id="breadcrumb"></nav>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var homeLink = container.querySelector('.breadcrumb-home');
            expect(homeLink.getAttribute('aria-label')).toBe('Home');
        });

        it('wraps in nav when container is not nav', function() {
            fixture.html('<div id="breadcrumb"></div>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var nav = container.querySelector('nav');
            expect(nav).not.toBeNull();
        });

        it('uses container directly when it is nav', function() {
            fixture.html('<nav id="breadcrumb"></nav>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var innerNav = container.querySelector('nav');
            expect(innerNav).toBeNull();
        });

    });

    describe('Accessibility', function() {

        it('nav has aria-label', function() {
            fixture.html('<div id="breadcrumb"></div>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var nav = container.querySelector('nav');
            expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
        });

        it('active item has aria-current', function() {
            fixture.html('<nav id="breadcrumb"></nav>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var activeItem = container.querySelector('.breadcrumb-item.active');
            expect(activeItem.getAttribute('aria-current')).toBe('page');
        });

        it('icon is hidden from screen readers', function() {
            fixture.html('<nav id="breadcrumb"></nav>');
            var container = fixture.query('#breadcrumb');

            Breadcrumb.render(container);

            var icon = container.querySelector('.fa-home');
            if (icon) {
                expect(icon.getAttribute('aria-hidden')).toBe('true');
            }
        });

    });

    describe('setData() Bindable Interface', function() {

        it('updates breadcrumbs with custom data', function() {
            fixture.html('<nav id="testBreadcrumb"></nav>');
            var container = fixture.query('#testBreadcrumb');

            // First render to register the instance
            Breadcrumb.render(container);

            Breadcrumb.setData([
                { label: 'Dashboard', url: '/' },
                { label: 'Settings', url: '/settings' },
                { label: 'Profile' }
            ]);

            var items = container.querySelectorAll('.breadcrumb-item');
            expect(items.length).toBe(3);
        });

        it('marks last item as active', function() {
            fixture.html('<nav id="testBreadcrumb"></nav>');
            var container = fixture.query('#testBreadcrumb');

            Breadcrumb.render(container);

            Breadcrumb.setData([
                { label: 'Home', url: '/' },
                { label: 'Current Page' }
            ]);

            var lastItem = container.querySelector('.breadcrumb-item:last-child');
            expect(lastItem.classList.contains('active')).toBe(true);
        });

    });

    describe('autoInit()', function() {

        it('initializes #pageBreadcrumb if exists', function() {
            fixture.html('<nav id="pageBreadcrumb"></nav>');

            Breadcrumb.autoInit();

            var ol = fixture.query('#pageBreadcrumb .breadcrumb-pro');
            expect(ol).not.toBeNull();
        });

        it('initializes data-breadcrumb-auto elements', function() {
            fixture.html('<div data-breadcrumb-auto></div>');

            Breadcrumb.autoInit();

            var nav = fixture.query('[data-breadcrumb-auto] nav');
            expect(nav).not.toBeNull();
        });

    });

    describe('labels object', function() {

        it('has common route labels', function() {
            expect(Breadcrumb.labels['trades']).toBeDefined();
            expect(Breadcrumb.labels['clients']).toBeDefined();
            expect(Breadcrumb.labels['edit']).toBeDefined();
            expect(Breadcrumb.labels['new']).toBeDefined();
        });

        it('can be extended', function() {
            Breadcrumb.labels['custom'] = 'Custom Label';
            expect(Breadcrumb.labels['custom']).toBe('Custom Label');

            // Cleanup
            delete Breadcrumb.labels['custom'];
        });

    });

});
