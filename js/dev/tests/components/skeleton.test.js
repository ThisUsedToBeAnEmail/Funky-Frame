/**
 * Funky.Skeleton Tests
 *
 * Tests for the skeleton loading placeholder component.
 */

describe('Funky.Component.Skeleton', function() {

    var Skeleton = Funky.Skeleton;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.cleanup();
        // Hide all skeletons
        if (Skeleton.hideAll) {
            Skeleton.hideAll();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Skeleton')).toBe(true);
        });

        it('has show method', function() {
            expect(typeof Skeleton.show).toBe('function');
        });

        it('has hide method', function() {
            expect(typeof Skeleton.hide).toBe('function');
        });

        it('has wrap method', function() {
            expect(typeof Skeleton.wrap).toBe('function');
        });

        it('has init method', function() {
            expect(typeof Skeleton.init).toBe('function');
        });

        it('has isLoading method', function() {
            expect(typeof Skeleton.isLoading).toBe('function');
        });

        it('has hideAll method', function() {
            expect(typeof Skeleton.hideAll).toBe('function');
        });

    });

    describe('show()', function() {

        it('returns controller object', function() {
            fixture.html('<div id="container">Original content</div>');
            var container = fixture.query('#container');

            var controller = Skeleton.show(container);

            expect(controller).not.toBeNull();
            expect(typeof controller.hide).toBe('function');
        });

        it('adds loading class to container', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container);

            expect(container.classList.contains('funky-skeleton-loading')).toBe(true);
        });

        it('creates skeleton wrapper', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container);

            var wrapper = container.querySelector('.funky-skeleton-wrapper');
            expect(wrapper).not.toBeNull();
        });

        it('sets aria-busy attribute', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container);

            expect(container.getAttribute('aria-busy')).toBe('true');
        });

        it('wrapper is hidden from screen readers', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container);

            var wrapper = container.querySelector('.funky-skeleton-wrapper');
            expect(wrapper.getAttribute('aria-hidden')).toBe('true');
        });

        it('accepts selector string', function() {
            fixture.html('<div id="container">Content</div>');

            var controller = Skeleton.show('#container');

            expect(controller).not.toBeNull();
        });

        it('returns null for non-existent container', function() {
            var controller = Skeleton.show('#nonexistent');
            expect(controller).toBeNull();
        });

    });

    describe('hide()', function() {

        it('removes loading class', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container, { fadeOut: false });
            Skeleton.hide(container);

            expect(container.classList.contains('funky-skeleton-loading')).toBe(false);
        });

        it('removes aria-busy attribute', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container, { fadeOut: false });
            Skeleton.hide(container);

            expect(container.hasAttribute('aria-busy')).toBe(false);
        });

        it('restores original content', function() {
            fixture.html('<div id="container">Original content here</div>');
            var container = fixture.query('#container');

            Skeleton.show(container, { fadeOut: false });
            Skeleton.hide(container);

            expect(container.textContent).toContain('Original content here');
        });

        it('shows new content when provided', function() {
            fixture.html('<div id="container">Original</div>');
            var container = fixture.query('#container');

            Skeleton.show(container, { fadeOut: false });
            Skeleton.hide(container, '<p>New content</p>');

            expect(container.innerHTML).toBe('<p>New content</p>');
        });

        it('controller.hide() works', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            var controller = Skeleton.show(container, { fadeOut: false });
            controller.hide();

            expect(container.classList.contains('funky-skeleton-loading')).toBe(false);
        });

        it('fadeOut adds transition class', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container, { fadeOut: true, fadeDuration: 50 });
            Skeleton.hide(container);

            var wrapper = container.querySelector('.funky-skeleton-wrapper');
            expect(wrapper.classList.contains('funky-skeleton-fade-out')).toBe(true);
        });

    });

    describe('Skeleton types', function() {

        describe('text type', function() {

            it('generates text skeleton', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'text' });

                var textBlock = container.querySelector('.funky-skeleton-text-block');
                expect(textBlock).not.toBeNull();
            });

            it('respects lines option', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'text', lines: 5 });

                var lines = container.querySelectorAll('.funky-skeleton-text');
                expect(lines.length).toBe(5);
            });

        });

        describe('table type', function() {

            it('generates table skeleton', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'table' });

                var table = container.querySelector('.funky-skeleton-table');
                expect(table).not.toBeNull();
            });

            it('respects rows and columns', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'table', rows: 3, columns: 4 });

                var tbody = container.querySelector('tbody');
                var rows = tbody.querySelectorAll('tr');
                expect(rows.length).toBe(3);

                var cells = rows[0].querySelectorAll('td');
                expect(cells.length).toBe(4);
            });

            it('includes header by default', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'table' });

                var thead = container.querySelector('thead');
                expect(thead).not.toBeNull();
            });

            it('header can be disabled', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'table', header: false });

                var thead = container.querySelector('thead');
                expect(thead).toBeNull();
            });

        });

        describe('card type', function() {

            it('generates card skeletons', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'card' });

                var cards = container.querySelectorAll('.funky-skeleton-card');
                expect(cards.length).toBeGreaterThan(0);
            });

            it('respects count option', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'card', count: 4 });

                var cards = container.querySelectorAll('.funky-skeleton-card');
                expect(cards.length).toBe(4);
            });

            it('includes image by default', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'card' });

                var image = container.querySelector('.funky-skeleton-card-image');
                expect(image).not.toBeNull();
            });

            it('image can be disabled', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'card', image: false });

                var image = container.querySelector('.funky-skeleton-card-image');
                expect(image).toBeNull();
            });

        });

        describe('list type', function() {

            it('generates list skeleton', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'list' });

                var list = container.querySelector('.funky-skeleton-list');
                expect(list).not.toBeNull();
            });

            it('respects rows option', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'list', rows: 4 });

                var items = container.querySelectorAll('.funky-skeleton-list-item');
                expect(items.length).toBe(4);
            });

            it('avatar is hidden by default', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'list' });

                var avatar = container.querySelector('.funky-skeleton-avatar');
                expect(avatar).toBeNull();
            });

            it('shows avatar when enabled', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'list', avatar: true });

                var avatar = container.querySelector('.funky-skeleton-avatar');
                expect(avatar).not.toBeNull();
            });

        });

        describe('avatar type', function() {

            it('generates avatar skeleton', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'avatar' });

                var avatar = container.querySelector('.funky-skeleton-avatar');
                expect(avatar).not.toBeNull();
            });

            it('respects size option', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, { type: 'avatar', size: 'lg' });

                var avatar = container.querySelector('.funky-skeleton-avatar');
                expect(avatar.classList.contains('lg')).toBe(true);
            });

        });

        describe('custom type', function() {

            it('uses custom template', function() {
                fixture.html('<div id="container"></div>');
                var container = fixture.query('#container');

                Skeleton.show(container, {
                    type: 'custom',
                    template: '<div class="custom-skeleton">Custom</div>'
                });

                var custom = container.querySelector('.custom-skeleton');
                expect(custom).not.toBeNull();
            });

        });

    });

    describe('wrap()', function() {

        it('shows skeleton during async operation', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');
            var wasSkeleton = false;

            var promise = Skeleton.wrap(container, function() {
                wasSkeleton = Skeleton.isLoading(container);
                return Promise.resolve('done');
            }, { fadeOut: false });

            return promise.then(function() {
                expect(wasSkeleton).toBe(true);
            });
        });

        it('hides skeleton after resolve', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            return Skeleton.wrap(container, function() {
                return Promise.resolve('done');
            }, { fadeOut: false }).then(function() {
                expect(Skeleton.isLoading(container)).toBe(false);
            });
        });

        it('hides skeleton after reject', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            return Skeleton.wrap(container, function() {
                return Promise.reject(new Error('Failed'));
            }, { fadeOut: false }).catch(function() {
                expect(Skeleton.isLoading(container)).toBe(false);
            });
        });

        it('returns promise result', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            return Skeleton.wrap(container, function() {
                return Promise.resolve('result value');
            }, { fadeOut: false }).then(function(result) {
                expect(result).toBe('result value');
            });
        });

    });

    describe('isLoading()', function() {

        it('returns true when skeleton is active', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container);

            expect(Skeleton.isLoading(container)).toBe(true);
        });

        it('returns false when no skeleton', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            expect(Skeleton.isLoading(container)).toBe(false);
        });

        it('returns false after hide', function() {
            fixture.html('<div id="container">Content</div>');
            var container = fixture.query('#container');

            Skeleton.show(container, { fadeOut: false });
            Skeleton.hide(container);

            expect(Skeleton.isLoading(container)).toBe(false);
        });

    });

    describe('hideAll()', function() {

        it('hides all active skeletons', function() {
            fixture.html('<div id="c1">Content 1</div><div id="c2">Content 2</div>');
            var c1 = fixture.query('#c1');
            var c2 = fixture.query('#c2');

            Skeleton.show(c1, { fadeOut: false });
            Skeleton.show(c2, { fadeOut: false });

            expect(Skeleton.isLoading(c1)).toBe(true);
            expect(Skeleton.isLoading(c2)).toBe(true);

            Skeleton.hideAll();

            expect(Skeleton.isLoading(c1)).toBe(false);
            expect(Skeleton.isLoading(c2)).toBe(false);
        });

    });

    describe('init()', function() {

        it('initializes data-skeleton elements', function() {
            fixture.html('<div data-skeleton="text">Content</div>');

            Skeleton.init(fixture.container);

            var wrapper = fixture.query('.funky-skeleton-wrapper');
            expect(wrapper).not.toBeNull();
        });

        it('respects data attributes', function() {
            fixture.html('<div data-skeleton="list" data-skeleton-rows="3" data-skeleton-avatar>Content</div>');

            Skeleton.init(fixture.container);

            var items = fixture.container.querySelectorAll('.funky-skeleton-list-item');
            expect(items.length).toBe(3);

            var avatar = fixture.query('.funky-skeleton-avatar');
            expect(avatar).not.toBeNull();
        });

    });

    describe('Defaults', function() {

        it('has default type', function() {
            expect(Skeleton.defaults.type).toBe('text');
        });

        it('has default rows', function() {
            expect(Skeleton.defaults.rows).toBe(3);
        });

        it('has default fadeOut', function() {
            expect(Skeleton.defaults.fadeOut).toBe(true);
        });

    });

});
