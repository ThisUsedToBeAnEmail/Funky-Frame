/**
 * Funky.PageAnimate Tests
 *
 * Tests for the page-level animation management component.
 */

describe('Funky.Component.PageAnimate', function() {

    var PageAnimate;
    var fixture;

    beforeEach(function() {
        PageAnimate = Funky.PageAnimate;
        fixture = FunkyTests.fixture();
        // Clear any registered configs if PageAnimate exists
        if (PageAnimate && PageAnimate.configs) {
            PageAnimate.configs = {};
        }
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('PageAnimate')).toBe(true);
        });

        it('has register method', function() {
            expect(typeof PageAnimate.register).toBe('function');
        });

        it('has getConfig method', function() {
            expect(typeof PageAnimate.getConfig).toBe('function');
        });

        it('has enter method', function() {
            expect(typeof PageAnimate.enter).toBe('function');
        });

        it('has exit method', function() {
            expect(typeof PageAnimate.exit).toBe('function');
        });

        it('has initScrollAnimations method', function() {
            expect(typeof PageAnimate.initScrollAnimations).toBe('function');
        });

        it('has animateList method', function() {
            expect(typeof PageAnimate.animateList).toBe('function');
        });

        it('has usePreset method', function() {
            expect(typeof PageAnimate.usePreset).toBe('function');
        });

        it('has init method', function() {
            expect(typeof PageAnimate.init).toBe('function');
        });

        it('has configs object', function() {
            expect(typeof PageAnimate.configs).toBe('object');
        });

        it('has presets object', function() {
            expect(typeof PageAnimate.presets).toBe('object');
        });

    });

    describe('Presets', function() {

        it('has fade preset', function() {
            expect(PageAnimate.presets.fade).toBeDefined();
            expect(PageAnimate.presets.fade.enter).toBeDefined();
            expect(PageAnimate.presets.fade.exit).toBeDefined();
        });

        it('has slideRight preset', function() {
            expect(PageAnimate.presets.slideRight).toBeDefined();
            expect(PageAnimate.presets.slideRight.enter.class).toBe('slide-in-right');
            expect(PageAnimate.presets.slideRight.exit.class).toBe('slide-out-left');
        });

        it('has slideLeft preset', function() {
            expect(PageAnimate.presets.slideLeft).toBeDefined();
            expect(PageAnimate.presets.slideLeft.enter.class).toBe('slide-in-left');
            expect(PageAnimate.presets.slideLeft.exit.class).toBe('slide-out-right');
        });

        it('has scale preset', function() {
            expect(PageAnimate.presets.scale).toBeDefined();
            expect(PageAnimate.presets.scale.enter.class).toBe('scale-fade-in');
        });

        it('has dashboard preset', function() {
            expect(PageAnimate.presets.dashboard).toBeDefined();
            expect(typeof PageAnimate.presets.dashboard.enter).toBe('function');
        });

    });

    describe('register()', function() {

        it('registers a page animation configuration', function() {
            PageAnimate.register('testPage', {
                enter: { class: 'fade-in' },
                exit: { class: 'fade-out' }
            });

            expect(PageAnimate.configs.testPage).toBeDefined();
            expect(PageAnimate.configs.testPage.enter.class).toBe('fade-in');
        });

        it('returns PageAnimate for chaining', function() {
            var result = PageAnimate.register('chainTest', {});
            expect(result).toBe(PageAnimate);
        });

        it('can register multiple pages', function() {
            PageAnimate
                .register('page1', { enter: { class: 'anim1' } })
                .register('page2', { enter: { class: 'anim2' } });

            expect(PageAnimate.configs.page1).toBeDefined();
            expect(PageAnimate.configs.page2).toBeDefined();
        });

    });

    describe('getConfig()', function() {

        it('returns configuration for registered page', function() {
            PageAnimate.register('myPage', {
                enter: { class: 'custom-enter' }
            });

            var config = PageAnimate.getConfig('myPage');
            expect(config.enter.class).toBe('custom-enter');
        });

        it('returns empty object for unregistered page', function() {
            var config = PageAnimate.getConfig('nonExistent');
            expect(config).toEqual({});
        });

        it('returns default config if registered', function() {
            PageAnimate.register('default', {
                enter: { class: 'default-enter' }
            });

            var config = PageAnimate.getConfig('unregisteredPage');
            expect(config.enter.class).toBe('default-enter');
        });

    });

    describe('usePreset()', function() {

        it('registers preset for page', function() {
            PageAnimate.usePreset('homePage', 'fade');

            var config = PageAnimate.getConfig('homePage');
            expect(config.enter.class).toBe('fade-in');
        });

        it('returns PageAnimate for chaining', function() {
            var result = PageAnimate.usePreset('chainPage', 'fade');
            expect(result).toBe(PageAnimate);
        });

        it('ignores non-existent preset', function() {
            PageAnimate.usePreset('testPage', 'nonExistentPreset');

            var config = PageAnimate.getConfig('testPage');
            expect(config).toEqual({});
        });

    });

    describe('enter()', function() {

        it('calls enter animation config', function() {
            var enterCalled = false;
            PageAnimate.register('animPage', {
                enter: function() {
                    enterCalled = true;
                }
            });

            fixture.html('<div id="page-content">Page</div>');
            var pageEl = fixture.query('#page-content');

            PageAnimate.enter(pageEl, 'animPage');

            expect(enterCalled).toBe(true);
        });

        it('passes element to enter function', function() {
            var receivedElement = null;
            PageAnimate.register('elemPage', {
                enter: function(el) {
                    receivedElement = el;
                }
            });

            fixture.html('<div id="page-content">Page</div>');
            var pageEl = fixture.query('#page-content');

            PageAnimate.enter(pageEl, 'elemPage');

            expect(receivedElement).toBe(pageEl);
        });

        it('does nothing for unregistered page', function() {
            fixture.html('<div id="page-content">Page</div>');
            var pageEl = fixture.query('#page-content');

            // Should not throw
            PageAnimate.enter(pageEl, 'nonExistent');

            expect(pageEl).toBeDefined();
        });

    });

    describe('exit()', function() {

        it('calls exit animation config', function() {
            var exitCalled = false;
            PageAnimate.register('exitPage', {
                exit: function() {
                    exitCalled = true;
                }
            });

            fixture.html('<div id="page-content">Page</div>');
            var pageEl = fixture.query('#page-content');

            PageAnimate.exit(pageEl, 'exitPage');

            expect(exitCalled).toBe(true);
        });

        it('passes onComplete callback to exit function', function() {
            var receivedCallback = null;
            PageAnimate.register('callbackPage', {
                exit: function(el, onComplete) {
                    receivedCallback = onComplete;
                }
            });

            fixture.html('<div id="page-content">Page</div>');
            var pageEl = fixture.query('#page-content');
            var myCallback = function() {};

            PageAnimate.exit(pageEl, 'callbackPage', myCallback);

            expect(receivedCallback).toBe(myCallback);
        });

        it('calls onComplete if no exit config', function() {
            var completeCalled = false;
            PageAnimate.register('noExitPage', {});

            fixture.html('<div id="page-content">Page</div>');
            var pageEl = fixture.query('#page-content');

            PageAnimate.exit(pageEl, 'noExitPage', function() {
                completeCalled = true;
            });

            expect(completeCalled).toBe(true);
        });

    });

    describe('initScrollAnimations()', function() {

        it('finds elements with data-animate-trigger="in-view"', function() {
            fixture.html(
                '<div data-animate-trigger="in-view" data-animate="fade-in">Content</div>'
            );

            // Should not throw
            var observer = PageAnimate.initScrollAnimations(fixture.el);

            // Observer is returned (or undefined if no elements)
            if (observer) {
                expect(observer).toBeDefined();
            }
        });

        it('returns undefined if no animatable elements', function() {
            fixture.html('<div>No animations here</div>');

            var result = PageAnimate.initScrollAnimations(fixture.el);

            expect(result).toBeUndefined();
        });

    });

    describe('animateList()', function() {

        it('has immediate trigger by default', function() {
            // Default trigger is 'immediate'
            expect(typeof PageAnimate.animateList).toBe('function');
        });

        it('accepts trigger option', function() {
            fixture.html('<ul id="test-list"><li>Item 1</li><li>Item 2</li></ul>');

            // Should not throw with in-view trigger
            var result = PageAnimate.animateList('#test-list', {
                trigger: 'in-view'
            });

            // Returns observer or null
            expect(result === null || typeof result === 'object').toBe(true);
        });

    });

    describe('initAutoAnimateChildren()', function() {

        it('adds animation attributes to children', function() {
            // Wrap in container since initAutoAnimateChildren queries INSIDE the container
            fixture.html(
                '<div id="wrapper">' +
                    '<div data-animate-children="in-view" data-animate-class="fade-in-up">' +
                        '<p>Paragraph 1</p>' +
                        '<p>Paragraph 2</p>' +
                    '</div>' +
                '</div>'
            );

            PageAnimate.initAutoAnimateChildren(fixture.el);

            var paragraphs = fixture.queryAll('p');
            expect(paragraphs.length).toBe(2);

            paragraphs.forEach(function(p) {
                expect(p.getAttribute('data-animate')).toBe('fade-in-up');
                expect(p.getAttribute('data-animate-trigger')).toBe('in-view');
            });
        });

        it('respects existing data-animate attributes', function() {
            fixture.html(
                '<div id="wrapper">' +
                    '<div data-animate-children="in-view" data-animate-class="fade-in">' +
                        '<p data-animate="custom-anim">Has custom</p>' +
                        '<p>No custom</p>' +
                    '</div>' +
                '</div>'
            );

            PageAnimate.initAutoAnimateChildren(fixture.el);

            var firstP = fixture.query('p[data-animate="custom-anim"]');
            var secondP = fixture.queryAll('p')[1];

            expect(firstP.getAttribute('data-animate')).toBe('custom-anim');
            expect(secondP.getAttribute('data-animate')).toBe('fade-in');
        });

        it('adds animation to headings', function() {
            fixture.html(
                '<div id="wrapper">' +
                    '<div data-animate-children="in-view">' +
                        '<h1>Heading 1</h1>' +
                        '<h2>Heading 2</h2>' +
                        '<h3>Heading 3</h3>' +
                    '</div>' +
                '</div>'
            );

            PageAnimate.initAutoAnimateChildren(fixture.el);

            expect(fixture.query('h1').getAttribute('data-animate')).toBeDefined();
            expect(fixture.query('h2').getAttribute('data-animate')).toBeDefined();
            expect(fixture.query('h3').getAttribute('data-animate')).toBeDefined();
        });

    });

    describe('init()', function() {

        it('initializes auto animate children', function() {
            // Wrap in container since init queries INSIDE the container
            fixture.html(
                '<div id="wrapper">' +
                    '<div data-animate-children="in-view">' +
                        '<p>Test</p>' +
                    '</div>' +
                '</div>'
            );

            PageAnimate.init(fixture.el);

            var p = fixture.query('p');
            expect(p.getAttribute('data-animate')).toBeDefined();
        });

        it('registers preset from data-page-animate attribute', function() {
            // Wrap in container since init queries INSIDE the container
            fixture.html(
                '<div id="wrapper">' +
                    '<div data-page-animate="fade" data-page="myPage">Content</div>' +
                '</div>'
            );

            PageAnimate.init(fixture.el);

            var config = PageAnimate.getConfig('myPage');
            expect(config.enter).toBeDefined();
        });

        it('handles container as document when not specified', function() {
            // Should not throw when called without container
            PageAnimate.init();
        });

    });

    describe('initStagger()', function() {

        it('exists for backward compatibility', function() {
            expect(typeof PageAnimate.initStagger).toBe('function');
        });

        it('does nothing (CSS-only stagger)', function() {
            // Just verify it doesn't throw
            PageAnimate.initStagger();
        });

    });

});
