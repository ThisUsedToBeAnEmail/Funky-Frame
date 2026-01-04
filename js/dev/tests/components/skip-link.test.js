/**
 * Funky.SkipLink Tests
 *
 * Tests for the accessible skip link component.
 */

describe('Funky.Component.SkipLink', function() {

    var SkipLink = Funky.SkipLink;
    var fixture;

    beforeEach(function() {
        // Reset SkipLink state before each test
        if (SkipLink.initialized) {
            SkipLink.destroy();
        }

        // Reset config to defaults
        SkipLink.config.containerSelector = '#test-skip-links';
        SkipLink.config.announcerSelector = '#test-spa-announcer';

        fixture = FunkyTests.fixture(
            '<div id="test-skip-links"></div>' +
            '<div id="test-spa-announcer" role="status" aria-live="polite" aria-atomic="true"></div>' +
            '<nav id="main-nav" data-skip-target="navigation" data-skip-label="Main navigation" data-skip-order="1">' +
                '<a href="#">Link 1</a>' +
                '<a href="#">Link 2</a>' +
            '</nav>' +
            '<main id="main-content" data-skip-target="main" data-skip-label="Main content" data-skip-order="2">' +
                '<h1>Main Content</h1>' +
                '<p>Content here</p>' +
            '</main>' +
            '<aside id="sidebar" data-skip-target="sidebar" data-skip-label="Sidebar" data-skip-order="3">' +
                '<p>Sidebar content</p>' +
            '</aside>'
        );
    });

    afterEach(function() {
        if (SkipLink.initialized) {
            SkipLink.destroy();
        }
        // Restore default config
        SkipLink.config.containerSelector = '#skip-links';
        SkipLink.config.announcerSelector = '#spa-announcer';
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('SkipLink')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof SkipLink.init).toBe('function');
        });

        it('has refresh method', function() {
            expect(typeof SkipLink.refresh).toBe('function');
        });

        it('has skipTo method', function() {
            expect(typeof SkipLink.skipTo).toBe('function');
        });

        it('has register method', function() {
            expect(typeof SkipLink.register).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof SkipLink.destroy).toBe('function');
        });

    });

    describe('Configuration', function() {

        it('has default config values', function() {
            // Note: beforeEach sets test-specific selectors, so we check those
            // The original defaults are '#skip-links' and '#spa-announcer'
            expect(SkipLink.config).toBeDefined();
            expect(SkipLink.config.containerSelector).toBe('#test-skip-links');
            expect(SkipLink.config.targetAttribute).toBe('data-skip-target');
            expect(SkipLink.config.labelAttribute).toBe('data-skip-label');
            expect(SkipLink.config.orderAttribute).toBe('data-skip-order');
        });

    });

    describe('init()', function() {

        it('initializes the component', function() {
            expect(SkipLink.initialized).toBe(false);

            SkipLink.init();

            expect(SkipLink.initialized).toBe(true);
        });

        it('finds skip link container', function() {
            SkipLink.init();

            expect(SkipLink.container).toBeDefined();
        });

        it('scans for skip targets', function() {
            SkipLink.init();

            expect(SkipLink.skipLinks.length).toBe(3);
        });

        it('accepts custom options', function() {
            SkipLink.init({
                fKeyStart: 5
            });

            expect(SkipLink.config.fKeyStart).toBe(5);
        });

        it('warns if already initialized', function() {
            SkipLink.init();

            // Should not throw
            SkipLink.init();

            expect(SkipLink.initialized).toBe(true);
        });

        it('warns if container not found', function() {
            // Remove container
            var container = document.getElementById('test-skip-links');
            container.parentNode.removeChild(container);

            // Should not throw
            SkipLink.init();

            expect(SkipLink.initialized).toBe(false);
        });

    });

    describe('scanTargets()', function() {

        it('finds elements with data-skip-target', function() {
            SkipLink.init();

            expect(SkipLink.skipLinks.length).toBe(3);
        });

        it('extracts label from data-skip-label', function() {
            SkipLink.init();

            var mainLink = SkipLink.skipLinks.find(function(l) {
                return l.id === 'main-content';
            });

            expect(mainLink).toBeDefined();
            expect(mainLink.label).toBe('Main content');
        });

        it('extracts order from data-skip-order', function() {
            SkipLink.init();

            var navLink = SkipLink.skipLinks.find(function(l) {
                return l.id === 'main-nav';
            });

            expect(navLink).toBeDefined();
            expect(navLink.order).toBe(1);
        });

        it('sorts skip links by order', function() {
            SkipLink.init();

            expect(SkipLink.skipLinks[0].id).toBe('main-nav');
            expect(SkipLink.skipLinks[1].id).toBe('main-content');
            expect(SkipLink.skipLinks[2].id).toBe('sidebar');
        });

        it('generates ID for elements without one', function() {
            // Add element without ID
            var noIdEl = document.createElement('section');
            noIdEl.setAttribute('data-skip-target', 'footer');
            noIdEl.setAttribute('data-skip-label', 'Footer');
            fixture.container.appendChild(noIdEl);

            SkipLink.init();

            var footerLink = SkipLink.skipLinks.find(function(l) {
                return l.label === 'Footer';
            });

            expect(footerLink).toBeDefined();
            expect(footerLink.id).toContain('skip-');
        });

        it('uses ID as fallback label', function() {
            // Add element without label
            var noLabelEl = document.createElement('section');
            noLabelEl.id = 'footer-section';
            noLabelEl.setAttribute('data-skip-target', 'footer');
            fixture.container.appendChild(noLabelEl);

            SkipLink.init();

            var footerLink = SkipLink.skipLinks.find(function(l) {
                return l.id === 'footer-section';
            });

            expect(footerLink).toBeDefined();
            expect(footerLink.label).toBe('footer section');
        });

    });

    describe('generateLinks()', function() {

        it('creates skip link element in container', function() {
            SkipLink.init();

            var container = document.getElementById('test-skip-links');
            var link = container.querySelector('a.skip-link');

            expect(link).toBeInDocument();
        });

        it('skip link has correct class', function() {
            SkipLink.init();

            var link = document.querySelector('#test-skip-links .skip-link');

            expect(link.classList.contains('skip-link')).toBe(true);
        });

        it('skip link has role="button"', function() {
            SkipLink.init();

            var link = document.querySelector('#test-skip-links .skip-link');

            expect(link.getAttribute('role')).toBe('button');
        });

        it('skip link has aria-label', function() {
            SkipLink.init();

            var link = document.querySelector('#test-skip-links .skip-link');

            expect(link.getAttribute('aria-label')).toBe('Show keyboard shortcuts');
        });

    });

    describe('skipTo()', function() {

        it('focuses target element', function() {
            SkipLink.init();

            SkipLink.skipTo('#main-content');

            expect(document.activeElement.id).toBe('main-content');
        });

        it('adds tabindex to target if needed', function() {
            SkipLink.init();

            var mainContent = document.getElementById('main-content');
            expect(mainContent.hasAttribute('tabindex')).toBe(false);

            SkipLink.skipTo('#main-content');

            expect(mainContent.getAttribute('tabindex')).toBe('-1');
        });

        it('announces skip action', function() {
            SkipLink.init();

            SkipLink.skipTo('#main-content');

            var announcer = document.getElementById('test-spa-announcer');
            expect(announcer.textContent).toContain('Skipped to');
        });

        it('handles missing target gracefully', function() {
            SkipLink.init();

            // Should not throw
            SkipLink.skipTo('#non-existent');

            // No focus change
            expect(document.activeElement.id).not.toBe('non-existent');
        });

    });

    describe('register()', function() {

        it('adds custom skip link', function() {
            SkipLink.init();

            var initialCount = SkipLink.skipLinks.length;

            // Add custom element
            var customEl = document.createElement('footer');
            customEl.id = 'custom-footer';
            fixture.container.appendChild(customEl);

            SkipLink.register({
                label: 'Custom Footer',
                target: '#custom-footer',
                order: 10
            });

            expect(SkipLink.skipLinks.length).toBe(initialCount + 1);
        });

        it('assigns ID if target has none', function() {
            SkipLink.init();

            // Add custom element without ID
            var customEl = document.createElement('footer');
            fixture.container.appendChild(customEl);

            SkipLink.register({
                label: 'Anonymous Footer',
                target: customEl
            });

            expect(customEl.id).toContain('skip-manual-');
        });

        it('sorts after adding', function() {
            SkipLink.init();

            // Add custom element with negative order to ensure it's first
            var customEl = document.createElement('footer');
            customEl.id = 'priority-footer';
            fixture.container.appendChild(customEl);

            SkipLink.register({
                label: 'Priority Footer',
                target: '#priority-footer',
                order: -10 // Negative order to be first
            });

            // Find the priority-footer in the array
            var priorityLink = SkipLink.skipLinks.find(function(l) {
                return l.id === 'priority-footer';
            });
            expect(priorityLink).toBeDefined();
            expect(priorityLink.order).toBe(-10);

            // It should be first in the sorted array
            expect(SkipLink.skipLinks[0].id).toBe('priority-footer');
        });

        it('validates config', function() {
            SkipLink.init();

            var initialCount = SkipLink.skipLinks.length;

            // Should not add without label
            SkipLink.register({
                target: '#main-content'
            });

            // Should not add without target
            SkipLink.register({
                label: 'Test'
            });

            expect(SkipLink.skipLinks.length).toBe(initialCount);
        });

        it('handles missing target element', function() {
            SkipLink.init();

            // Should not throw when registering with missing target
            expect(function() {
                SkipLink.register({
                    label: 'Missing',
                    target: '#does-not-exist'
                });
            }).not.toThrow();
        });

    });

    describe('refresh()', function() {

        it('rescans for skip targets', function() {
            SkipLink.init();

            var initialCount = SkipLink.skipLinks.length;

            // Add new skip target
            var newEl = document.createElement('footer');
            newEl.id = 'footer';
            newEl.setAttribute('data-skip-target', 'footer');
            newEl.setAttribute('data-skip-label', 'Footer');
            fixture.container.appendChild(newEl);

            SkipLink.refresh();

            expect(SkipLink.skipLinks.length).toBe(initialCount + 1);
        });

        it('regenerates skip links', function() {
            SkipLink.init();

            var container = document.getElementById('test-skip-links');
            var originalLink = container.querySelector('.skip-link');

            SkipLink.refresh();

            var newLink = container.querySelector('.skip-link');
            expect(newLink).toBeInDocument();
        });

    });

    describe('destroy()', function() {

        it('resets initialized state', function() {
            SkipLink.init();
            expect(SkipLink.initialized).toBe(true);

            SkipLink.destroy();
            expect(SkipLink.initialized).toBe(false);
        });

        it('clears skip links array', function() {
            SkipLink.init();
            expect(SkipLink.skipLinks.length).toBeGreaterThan(0);

            SkipLink.destroy();
            expect(SkipLink.skipLinks.length).toBe(0);
        });

        it('unregisters keyboard shortcuts', function() {
            SkipLink.init();
            expect(SkipLink.registeredShortcuts.length).toBeGreaterThan(0);

            SkipLink.destroy();
            expect(SkipLink.registeredShortcuts.length).toBe(0);
        });

        it('handles destroy when not initialized', function() {
            expect(SkipLink.initialized).toBe(false);

            // Should not throw
            SkipLink.destroy();

            expect(SkipLink.initialized).toBe(false);
        });

    });

    describe('Accessibility', function() {

        it('targets become focusable with tabindex', function() {
            SkipLink.init();

            SkipLink.skipTo('#main-content');

            var mainContent = document.getElementById('main-content');
            expect(mainContent.getAttribute('tabindex')).toBe('-1');
        });

        it('announcer receives skip messages', function() {
            SkipLink.init();

            SkipLink.skipTo('#main-content');

            var announcer = document.getElementById('test-spa-announcer');
            expect(announcer.textContent).toContain('Main content');
        });

        it('announcer clears after delay', function(done) {
            SkipLink.init();

            SkipLink.skipTo('#main-content');

            var announcer = document.getElementById('test-spa-announcer');
            expect(announcer.textContent.length).toBeGreaterThan(0);

            setTimeout(function() {
                expect(announcer.textContent).toBe('');
                done();
            }, 1100);
        });

    });

});
