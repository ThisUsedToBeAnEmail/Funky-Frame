/**
 * Funky.Spinner Tests
 *
 * Tests for the loading spinner component.
 */

describe('Funky.Component.Spinner', function() {

    var Spinner = Funky.Spinner;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="spinner-container" style="width: 200px; height: 200px; position: relative;">' +
                '<p>Content here</p>' +
            '</div>'
        );
    });

    afterEach(function() {
        Spinner.hideAll();
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Spinner')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof Spinner.create).toBe('function');
        });

        it('has show method', function() {
            expect(typeof Spinner.show).toBe('function');
        });

        it('has hide method', function() {
            expect(typeof Spinner.hide).toBe('function');
        });

        it('has overlay method', function() {
            expect(typeof Spinner.overlay).toBe('function');
        });

        it('has wrap method', function() {
            expect(typeof Spinner.wrap).toBe('function');
        });

    });

    describe('defaults', function() {

        it('has default configuration', function() {
            expect(Spinner.defaults).toBeDefined();
            expect(Spinner.defaults.style).toBe('border');
            expect(Spinner.defaults.size).toBe('md');
        });

    });

    describe('create()', function() {

        it('creates spinner element', function() {
            var spinner = Spinner.create();

            expect(spinner).toBeDefined();
            expect(spinner.tagName).toBe('DIV');
        });

        it('creates with custom style', function() {
            var spinner = Spinner.create({ style: 'dots' });

            expect(spinner.querySelector('.funky-spinner-dots')).toBeDefined();
        });

        it('creates with custom size', function() {
            var spinner = Spinner.create({ size: 'lg' });

            expect(spinner.querySelector('.funky-spinner-lg')).toBeDefined();
        });

        it('creates with loading text', function() {
            var spinner = Spinner.create({ text: 'Loading data...' });

            expect(spinner.querySelector('.funky-spinner-text').textContent).toBe('Loading data...');
        });

    });

    describe('show()', function() {

        it('shows spinner in container', function() {
            Spinner.show('#spinner-container');

            var wrapper = document.querySelector('#spinner-container .funky-spinner-wrapper');
            expect(wrapper).toBeInDocument();
        });

        it('returns controller with hide method', function() {
            var controller = Spinner.show('#spinner-container');

            expect(controller).toBeDefined();
            expect(typeof controller.hide).toBe('function');
        });

        it('adds loading class to container', function() {
            Spinner.show('#spinner-container');

            var container = document.getElementById('spinner-container');
            expect(container.classList.contains('loading')).toBe(true);
        });

        it('shows spinner with text', function() {
            Spinner.show('#spinner-container', { text: 'Please wait...' });

            var text = document.querySelector('#spinner-container .funky-spinner-text');
            expect(text.textContent).toBe('Please wait...');
        });

        it('hides existing spinner before showing new', function() {
            Spinner.show('#spinner-container');
            Spinner.show('#spinner-container');

            var spinners = document.querySelectorAll('#spinner-container .funky-spinner-wrapper');
            expect(spinners.length).toBe(1);
        });

    });

    describe('hide()', function() {

        it('hides spinner in container', function() {
            Spinner.show('#spinner-container');
            Spinner.hide('#spinner-container');

            return FunkyTests.delay(250).then(function() {
                var wrapper = document.querySelector('#spinner-container .funky-spinner-wrapper');
                expect(wrapper).toBeNull();
            });
        });

        it('removes loading class', function() {
            Spinner.show('#spinner-container');
            Spinner.hide('#spinner-container');

            var container = document.getElementById('spinner-container');
            expect(container.classList.contains('loading')).toBe(false);
        });

        it('controller.hide() works', function() {
            var controller = Spinner.show('#spinner-container');
            controller.hide();

            return FunkyTests.delay(250).then(function() {
                var wrapper = document.querySelector('#spinner-container .funky-spinner-wrapper');
                expect(wrapper).toBeNull();
            });
        });

    });

    describe('overlay()', function() {

        afterEach(function() {
            Spinner.hideOverlay();
        });

        it('shows full-page overlay', function() {
            Spinner.overlay();

            var overlay = document.querySelector('.funky-spinner-overlay');
            expect(overlay).toBeInDocument();
        });

        it('returns controller with hide method', function() {
            var controller = Spinner.overlay();

            expect(controller).toBeDefined();
            expect(typeof controller.hide).toBe('function');
        });

        it('shows overlay with text', function() {
            Spinner.overlay({ text: 'Processing...' });

            var text = document.querySelector('.funky-spinner-overlay .funky-spinner-text');
            expect(text.textContent).toBe('Processing...');
        });

    });

    describe('hideOverlay()', function() {

        it('hides overlay spinner', function() {
            Spinner.overlay();
            Spinner.hideOverlay();

            return FunkyTests.delay(250).then(function() {
                var overlay = document.querySelector('.funky-spinner-overlay');
                expect(overlay).toBeNull();
            });
        });

    });

    describe('wrap()', function() {

        it('shows spinner during async operation', function() {
            var promise = Spinner.wrap('#spinner-container', function() {
                return new Promise(function(resolve) {
                    setTimeout(resolve, 50);
                });
            });

            // Spinner should be visible during operation
            var wrapper = document.querySelector('#spinner-container .funky-spinner-wrapper');
            expect(wrapper).toBeInDocument();

            return promise;
        });

        it('hides spinner after async completes', function() {
            return Spinner.wrap('#spinner-container', function() {
                return Promise.resolve();
            }).then(function() {
                return FunkyTests.delay(250);
            }).then(function() {
                var wrapper = document.querySelector('#spinner-container .funky-spinner-wrapper');
                expect(wrapper).toBeNull();
            });
        });

        it('hides spinner on error', function() {
            return Spinner.wrap('#spinner-container', function() {
                return Promise.reject(new Error('Test error'));
            }).catch(function() {
                return FunkyTests.delay(250);
            }).then(function() {
                var wrapper = document.querySelector('#spinner-container .funky-spinner-wrapper');
                expect(wrapper).toBeNull();
            });
        });

        it('returns async result', function() {
            return Spinner.wrap('#spinner-container', function() {
                return Promise.resolve(42);
            }).then(function(result) {
                expect(result).toBe(42);
            });
        });

    });

    describe('isLoading()', function() {

        it('returns true when spinner is active', function() {
            Spinner.show('#spinner-container');
            expect(Spinner.isLoading('#spinner-container')).toBe(true);
        });

        it('returns false when no spinner', function() {
            expect(Spinner.isLoading('#spinner-container')).toBe(false);
        });

        it('returns false after hide', function() {
            Spinner.show('#spinner-container');
            Spinner.hide('#spinner-container');

            expect(Spinner.isLoading('#spinner-container')).toBe(false);
        });

    });

    describe('hideAll()', function() {

        it('hides all active spinners', function() {
            // Create second container
            var container2 = document.createElement('div');
            container2.id = 'spinner-container-2';
            document.body.appendChild(container2);

            Spinner.show('#spinner-container');
            Spinner.show('#spinner-container-2');

            Spinner.hideAll();

            expect(Spinner.isLoading('#spinner-container')).toBe(false);
            expect(Spinner.isLoading('#spinner-container-2')).toBe(false);

            document.body.removeChild(container2);
        });

    });

    describe('Accessibility', function() {

        it('spinner has role="status"', function() {
            Spinner.show('#spinner-container');

            var spinner = document.querySelector('#spinner-container .funky-spinner');
            expect(spinner.getAttribute('role')).toBe('status');
        });

        it('spinner has aria-live="polite"', function() {
            Spinner.show('#spinner-container');

            var spinner = document.querySelector('#spinner-container .funky-spinner');
            expect(spinner.getAttribute('aria-live')).toBe('polite');
        });

        it('has screen reader text', function() {
            Spinner.show('#spinner-container');

            var srText = document.querySelector('#spinner-container .funky-spinner-sr');
            expect(srText).not.toBeNull();
            expect(srText.textContent).toBe('Loading...');
        });

        it('uses custom screen reader text', function() {
            Spinner.show('#spinner-container', { srText: 'Please wait' });

            var srText = document.querySelector('#spinner-container .funky-spinner-sr');
            expect(srText).not.toBeNull();
            expect(srText.textContent).toBe('Please wait');
        });

    });

});
