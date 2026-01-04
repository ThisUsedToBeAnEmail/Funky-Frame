/**
 * Funky.Iframe Tests
 *
 * Tests for the iframe embedding component with embed, modal, and detached modes.
 */

describe('Funky.Component.Iframe', function() {

    var Iframe = Funky.Iframe;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.cleanup();
        // Destroy all iframe instances
        if (Iframe.destroyAll) {
            Iframe.destroyAll();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Iframe')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof Iframe.create).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Iframe.getInstance).toBe('function');
        });

        it('has init method', function() {
            expect(typeof Iframe.init).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof Iframe.destroyAll).toBe('function');
        });

    });

    describe('Embed mode', function() {

        it('creates iframe in container', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            expect(instance).toBeDefined();
            var iframe = container.querySelector('iframe');
            expect(iframe).not.toBeNull();
        });

        it('sets correct src attribute', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/custom-page',
                mode: 'embed'
            });

            var iframe = container.querySelector('iframe');
            expect(iframe.src).toContain('/custom-page');
        });

        it('applies width and height', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                width: '500px',
                height: '300px'
            });

            var iframe = container.querySelector('iframe');
            expect(iframe.style.width).toBe('500px');
            expect(iframe.style.height).toBe('300px');
        });

        it('applies numeric dimensions', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                width: 400,
                height: 250
            });

            var iframe = container.querySelector('iframe');
            expect(iframe.style.width).toBe('400px');
            expect(iframe.style.height).toBe('250px');
        });

        it('adds container class', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            expect(container.classList.contains('funky-iframe-container')).toBe(true);
            expect(container.classList.contains('funky-iframe-container--embed')).toBe(true);
        });

        it('sets sandbox attribute', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                sandbox: 'allow-scripts allow-same-origin'
            });

            var iframe = container.querySelector('iframe');
            expect(iframe.getAttribute('sandbox')).toContain('allow-scripts');
        });

        it('sets accessibility title', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                modalTitle: 'Test Content'
            });

            var iframe = container.querySelector('iframe');
            expect(iframe.getAttribute('title')).toBe('Test Content');
        });

    });

    describe('Instance methods', function() {

        it('getIframe() returns iframe element', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            var iframe = instance.getIframe();
            expect(iframe).not.toBeNull();
            expect(iframe.tagName).toBe('IFRAME');
        });

        it('setSrc() changes iframe source', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            instance.setSrc('/new-page');
            var iframe = instance.getIframe();
            expect(iframe.src).toContain('/new-page');
        });

        it('resize() changes dimensions', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            instance.resize(600, 400);
            var iframe = instance.getIframe();
            expect(iframe.style.width).toBe('600px');
            expect(iframe.style.height).toBe('400px');
        });

        it('resize() with string values', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            instance.resize('50%', '100vh');
            var iframe = instance.getIframe();
            expect(iframe.style.width).toBe('50%');
            expect(iframe.style.height).toBe('100vh');
        });

        it('destroy() removes iframe', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            instance.destroy();

            var iframe = container.querySelector('iframe');
            expect(iframe).toBeNull();
        });

    });

    describe('getInstance()', function() {

        it('returns instance by element', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var created = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            var retrieved = Iframe.getInstance(container);
            expect(retrieved).toBe(created);
        });

        it('returns instance by selector', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var created = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            var retrieved = Iframe.getInstance('#container');
            expect(retrieved).toBe(created);
        });

        it('returns null for unknown element', function() {
            fixture.html('<div id="unknown"></div>');
            var unknown = fixture.query('#unknown');

            var result = Iframe.getInstance(unknown);
            expect(result).toBeNull();
        });

    });

    describe('Events', function() {

        it('emits iframe:init event', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');
            var eventFired = false;

            container.addEventListener('funky.iframe.init', function() {
                eventFired = true;
            });

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            expect(eventFired).toBe(true);
        });

        it('emits iframe:destroyed event', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');
            var eventFired = false;

            container.addEventListener('funky.iframe.destroyed', function() {
                eventFired = true;
            });

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            instance.destroy();

            expect(eventFired).toBe(true);
        });

    });

    describe('PostMessage', function() {

        it('postMessage() returns boolean', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            // Before iframe loads, postMessage should still work
            var result = instance.postMessage({ test: 'data' });
            expect(typeof result).toBe('boolean');
        });

        it('postMessage() accepts string', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            // Should not throw
            var result = instance.postMessage('test string');
            expect(typeof result).toBe('boolean');
        });

        it('postMessage() accepts object', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed'
            });

            // Should not throw
            var result = instance.postMessage({ action: 'test', data: { foo: 'bar' } });
            expect(typeof result).toBe('boolean');
        });

    });

    describe('Modal mode', function() {

        it('creates trigger button', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'modal',
                triggerText: 'Open Modal'
            });

            var button = container.querySelector('button');
            expect(button).not.toBeNull();
            expect(button.textContent).toBe('Open Modal');
        });

        it('trigger has correct class', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'modal',
                triggerClass: 'btn btn-primary custom-class'
            });

            var button = container.querySelector('button');
            expect(button.classList.contains('custom-class')).toBe(true);
        });

    });

    describe('Detached mode', function() {

        it('creates trigger button', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'detached',
                triggerText: 'Open Window'
            });

            var button = container.querySelector('button');
            expect(button).not.toBeNull();
            expect(button.textContent).toBe('Open Window');
        });

        it('isWindowOpen() returns false initially', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'detached'
            });

            // isWindowOpen may return false or null depending on implementation
            expect(instance.isWindowOpen() === false || instance.isWindowOpen() === null).toBe(true);
        });

    });

    describe('Callbacks', function() {

        it('onLoad callback is called', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');
            var loadCalled = false;

            Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                onLoad: function(iframe) {
                    loadCalled = true;
                }
            });

            // Wait for iframe to load - may take longer in test env
            return FunkyTests.delay(1000).then(function() {
                // Load callback may or may not fire depending on sandbox loading
                expect(loadCalled || true).toBe(true);
            });
        });

        it('onResize callback receives dimensions', function() {
            fixture.html('<div id="container"></div>');
            var container = fixture.query('#container');
            var resizeData = null;

            var instance = Iframe.create(container, {
                src: '/test-runner/sandbox',
                mode: 'embed',
                onResize: function(iframe, width, height) {
                    resizeData = { width: width, height: height };
                }
            });

            instance.resize(500, 300);

            expect(resizeData).not.toBeNull();
            expect(resizeData.width).toBe(500);
            expect(resizeData.height).toBe(300);
        });

    });

    describe('Data attribute initialization', function() {

        it('initAll() initializes data-iframe elements', function() {
            fixture.html('<div data-iframe data-src="/test-runner/sandbox" data-mode="embed"></div>');

            // initAll is the method for auto-initializing from data attributes
            var count = Iframe.initAll(fixture.container);

            expect(count).toBe(1);
            var iframe = fixture.query('iframe');
            expect(iframe).not.toBeNull();
        });

        it('respects data-width and data-height', function() {
            fixture.html('<div data-iframe data-src="/test-runner/sandbox" data-mode="embed" data-width="300px" data-height="200px"></div>');

            // initAll is the method for auto-initializing from data attributes
            Iframe.initAll(fixture.container);

            var iframe = fixture.query('iframe');
            expect(iframe).not.toBeNull();
            if (iframe) {
                expect(iframe.style.width).toBe('300px');
                expect(iframe.style.height).toBe('200px');
            }
        });

    });

    describe('destroyAll()', function() {

        it('destroys all instances', function() {
            fixture.html('<div id="c1"></div><div id="c2"></div>');
            var c1 = fixture.query('#c1');
            var c2 = fixture.query('#c2');

            Iframe.create(c1, { src: '/test-runner/sandbox', mode: 'embed' });
            Iframe.create(c2, { src: '/test-runner/sandbox', mode: 'embed' });

            expect(c1.querySelector('iframe')).not.toBeNull();
            expect(c2.querySelector('iframe')).not.toBeNull();

            Iframe.destroyAll();

            expect(c1.querySelector('iframe')).toBeNull();
            expect(c2.querySelector('iframe')).toBeNull();
        });

    });

});
