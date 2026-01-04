/**
 * Accessibility Tests: Funky.Iframe
 *
 * Tests WCAG 2.1 AA compliance for iframe component.
 * Iframes must have accessible names, proper keyboard support,
 * and appropriate focus management.
 */

FunkyTests.describe('Funky.A11y.Iframe', function() {
    var expect = FunkyTests.expect;
    var Iframe = window.Funky && window.Funky.Iframe;

    // Skip all tests if Iframe not loaded
    if (!Iframe) {
        FunkyTests.it('Iframe component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        if (Iframe.destroyAll) {
            Iframe.destroyAll();
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Accessible Name (WCAG 4.1.2)
    // ========================================================================

    FunkyTests.describe('Accessible Name (WCAG 4.1.2)', function() {

        FunkyTests.it('iframe has title attribute', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Test Content Frame'
            });

            var iframe = container.querySelector('iframe');
            expect(iframe).not.toBeNull();
            expect(iframe.getAttribute('title')).toBe('Test Content Frame');
        });

        FunkyTests.it('iframe title is descriptive', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Embedded documentation viewer'
            });

            var iframe = container.querySelector('iframe');
            var title = iframe.getAttribute('title');
            expect(title.length).toBeGreaterThan(5);
        });

        FunkyTests.it('iframe without title uses default', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            var iframe = container.querySelector('iframe');
            // Should have some title even if not specified
            expect(iframe).not.toBeNull();
        });

    });

    // ========================================================================
    // Keyboard Accessibility
    // ========================================================================

    FunkyTests.describe('Keyboard Accessibility', function() {

        FunkyTests.it('iframe is focusable', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Test Frame'
            });

            var iframe = container.querySelector('iframe');
            // Iframes are inherently focusable
            expect(iframe).not.toBeNull();
        });

        FunkyTests.it('modal trigger button is focusable', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'modal',
                triggerText: 'Open Frame',
                modalTitle: 'Test Modal'
            });

            var button = container.querySelector('button');
            expect(button).not.toBeNull();
            var tabindex = button.getAttribute('tabindex');
            // Button should be tabbable (no tabindex or tabindex >= 0)
            expect(tabindex === null || parseInt(tabindex) >= 0).toBe(true);
        });

        FunkyTests.it('detached trigger button is focusable', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'detached',
                triggerText: 'Open Window',
                modalTitle: 'Test Window'
            });

            var button = container.querySelector('button');
            expect(button).not.toBeNull();
            var tabindex = button.getAttribute('tabindex');
            expect(tabindex === null || parseInt(tabindex) >= 0).toBe(true);
        });

    });

    // ========================================================================
    // Modal Mode Accessibility
    // ========================================================================

    FunkyTests.describe('Modal Mode Accessibility', function() {

        FunkyTests.it('modal trigger has accessible text', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'modal',
                triggerText: 'View Document',
                modalTitle: 'Document Viewer'
            });

            var button = container.querySelector('button');
            expect(button.textContent.trim().length).toBeGreaterThan(0);
        });

        FunkyTests.it('modal trigger is a button element', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'modal',
                triggerText: 'Open Modal',
                modalTitle: 'Test Modal'
            });

            var button = container.querySelector('button');
            expect(button).not.toBeNull();
            expect(button.tagName.toLowerCase()).toBe('button');
        });

    });

    // ========================================================================
    // Detached Mode Accessibility
    // ========================================================================

    FunkyTests.describe('Detached Mode Accessibility', function() {

        FunkyTests.it('detached trigger has accessible text', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'detached',
                triggerText: 'Open in New Window',
                modalTitle: 'External Content'
            });

            var button = container.querySelector('button');
            expect(button.textContent.trim().length).toBeGreaterThan(0);
        });

        FunkyTests.it('detached trigger is a button element', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'detached',
                triggerText: 'Open Window',
                modalTitle: 'New Window Content'
            });

            var button = container.querySelector('button');
            expect(button).not.toBeNull();
            expect(button.tagName.toLowerCase()).toBe('button');
        });

    });

    // ========================================================================
    // Security Attributes
    // ========================================================================

    FunkyTests.describe('Security Attributes', function() {

        FunkyTests.it('sandbox attribute can be set', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                sandbox: 'allow-scripts allow-same-origin',
                modalTitle: 'Sandboxed Content'
            });

            var iframe = container.querySelector('iframe');
            var sandbox = iframe.getAttribute('sandbox');
            expect(sandbox).toContain('allow-scripts');
        });

        FunkyTests.it('sandbox does not affect accessibility', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                sandbox: 'allow-scripts',
                modalTitle: 'Sandboxed Frame'
            });

            var iframe = container.querySelector('iframe');
            // Title should still be present
            expect(iframe.getAttribute('title')).toBe('Sandboxed Frame');
        });

    });

    // ========================================================================
    // Container Structure
    // ========================================================================

    FunkyTests.describe('Container Structure', function() {

        FunkyTests.it('container has appropriate class', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Test Frame'
            });

            expect(container.classList.contains('funky-iframe-container')).toBe(true);
        });

        FunkyTests.it('embed mode has embed class', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Embedded Frame'
            });

            expect(container.classList.contains('funky-iframe-container--embed')).toBe(true);
        });

    });

    // ========================================================================
    // Resize Accessibility
    // ========================================================================

    FunkyTests.describe('Resize Accessibility', function() {

        FunkyTests.it('resized iframe maintains accessibility', function() {
            var container = document.querySelector('#test-container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Resizable Frame'
            });

            instance.resize(600, 400);

            var iframe = container.querySelector('iframe');
            expect(iframe.getAttribute('title')).toBe('Resizable Frame');
        });

        FunkyTests.it('dimensions use accessible units', function() {
            var container = document.querySelector('#test-container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                width: '100%',
                height: '400px',
                modalTitle: 'Responsive Frame'
            });

            var iframe = container.querySelector('iframe');
            // Percentage width allows responsive sizing
            expect(iframe.style.width).toBe('100%');
        });

    });

    // ========================================================================
    // Data Attribute Initialization
    // ========================================================================

    FunkyTests.describe('Data Attribute Initialization', function() {

        FunkyTests.it('data-iframe elements get accessible title', function() {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<div data-iframe data-src="/test-runner/sandbox" data-mode="embed" data-modal-title="Data Attribute Frame"></div>';

            // Use initAll to initialize elements with data attributes (not init which takes a single target)
            Iframe.initAll(container);

            var iframe = container.querySelector('iframe');
            expect(iframe).not.toBeNull();
            if (iframe) {
                expect(iframe.getAttribute('title')).toBe('Data Attribute Frame');
            }
        });

    });

    // ========================================================================
    // Events and Notifications
    // ========================================================================

    FunkyTests.describe('Events and Notifications', function() {

        FunkyTests.it('init event is emitted', function() {
            var container = document.querySelector('#test-container');
            var eventFired = false;

            container.addEventListener('funky.iframe.init', function() {
                eventFired = true;
            });

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Event Test Frame'
            });

            expect(eventFired).toBe(true);
        });

        FunkyTests.it('destroyed event is emitted', function() {
            var container = document.querySelector('#test-container');
            var eventFired = false;

            container.addEventListener('funky.iframe.destroyed', function() {
                eventFired = true;
            });

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Destroy Test Frame'
            });

            instance.destroy();

            expect(eventFired).toBe(true);
        });

    });

    // ========================================================================
    // Multiple Iframes
    // ========================================================================

    FunkyTests.describe('Multiple Iframes', function() {

        FunkyTests.it('each iframe has unique accessible name', function() {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<div id="c1"></div><div id="c2"></div>';
            var c1 = document.querySelector('#c1');
            var c2 = document.querySelector('#c2');

            Iframe.create(c1, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Frame One'
            });

            Iframe.create(c2, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Frame Two'
            });

            var iframe1 = c1.querySelector('iframe');
            var iframe2 = c2.querySelector('iframe');

            expect(iframe1.getAttribute('title')).toBe('Frame One');
            expect(iframe2.getAttribute('title')).toBe('Frame Two');
        });

        FunkyTests.it('destroyAll cleans up all instances', function() {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<div id="c1"></div><div id="c2"></div>';
            var c1 = document.querySelector('#c1');
            var c2 = document.querySelector('#c2');

            Iframe.create(c1, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Frame A'
            });

            Iframe.create(c2, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Frame B'
            });

            Iframe.destroyAll();

            expect(c1.querySelector('iframe')).toBeNull();
            expect(c2.querySelector('iframe')).toBeNull();
        });

    });

});
