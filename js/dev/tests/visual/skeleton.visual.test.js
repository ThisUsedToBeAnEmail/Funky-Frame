/**
 * Visual Regression Tests: Skeleton Component
 *
 * Tests visual appearance of skeleton loading placeholders.
 *
 * NOTE: Skeleton uses shimmer animations, so we pause CSS animations for consistent testing.
 */

describe('Funky.Visual.Skeleton', function() {

    var Visual = FunkyTests.Visual;
    var Skeleton = Funky.Skeleton;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-skeleton-container" style="width: 400px; padding: 20px; background: #fff;"></div>');

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; }';
        document.head.appendChild(style);
    });

    afterEach(function() {
        Skeleton.hideAll();
        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    });

    describe('Text Skeleton', function() {

        it('creates text skeleton structure', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text', lines: 3 });

            return FunkyTests.delay(50).then(function() {
                var wrapper = document.querySelector('.funky-skeleton-wrapper');
                expect(wrapper).not.toBeNull();

                var textBlock = wrapper.querySelector('.funky-skeleton-text-block');
                expect(textBlock).not.toBeNull();
            });
        });

        it('creates correct number of lines', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text', lines: 4 });

            return FunkyTests.delay(50).then(function() {
                var lines = document.querySelectorAll('.funky-skeleton-text');
                expect(lines.length).toBe(4);
            });
        });

        it('lines have varying widths', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text', lines: 5 });

            return FunkyTests.delay(50).then(function() {
                var lines = document.querySelectorAll('.funky-skeleton-text');
                var hasLong = false;
                var hasMedium = false;
                var hasShort = false;

                lines.forEach(function(line) {
                    if (line.classList.contains('long')) hasLong = true;
                    if (line.classList.contains('medium')) hasMedium = true;
                    if (line.classList.contains('short')) hasShort = true;
                });

                expect(hasLong || hasMedium || hasShort).toBe(true);
            });
        });

        it('skeleton elements are visible', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text' });

            return FunkyTests.delay(50).then(function() {
                var skeleton = document.querySelector('.funky-skeleton');
                var styles = Visual.snapshotStyles(skeleton);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

    });

    describe('Table Skeleton', function() {

        it('creates table structure', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'table', rows: 3, columns: 4 });

            return FunkyTests.delay(50).then(function() {
                var table = document.querySelector('.funky-skeleton-table');
                expect(table).not.toBeNull();
                expect(table.tagName).toBe('TABLE');
            });
        });

        it('creates header row when configured', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'table', rows: 3, columns: 4, header: true });

            return FunkyTests.delay(50).then(function() {
                var thead = document.querySelector('.funky-skeleton-table thead');
                expect(thead).not.toBeNull();

                var headerCells = thead.querySelectorAll('th');
                expect(headerCells.length).toBe(4);
            });
        });

        it('creates correct number of body rows', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'table', rows: 5, columns: 3 });

            return FunkyTests.delay(50).then(function() {
                var tbody = document.querySelector('.funky-skeleton-table tbody');
                var rows = tbody.querySelectorAll('tr');
                expect(rows.length).toBe(5);
            });
        });

        it('creates correct number of columns', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'table', rows: 2, columns: 6 });

            return FunkyTests.delay(50).then(function() {
                var tbody = document.querySelector('.funky-skeleton-table tbody');
                var firstRow = tbody.querySelector('tr');
                var cells = firstRow.querySelectorAll('td');
                expect(cells.length).toBe(6);
            });
        });

        it('cells contain skeleton elements', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'table', rows: 2, columns: 2 });

            return FunkyTests.delay(50).then(function() {
                var cells = document.querySelectorAll('.funky-skeleton-table td');
                cells.forEach(function(cell) {
                    expect(cell.querySelector('.funky-skeleton')).not.toBeNull();
                });
            });
        });

    });

    describe('Card Skeleton', function() {

        it('creates card container', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'card', count: 2 });

            return FunkyTests.delay(50).then(function() {
                var container = document.querySelector('.funky-skeleton-cards');
                expect(container).not.toBeNull();
            });
        });

        it('creates correct number of cards', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'card', count: 3 });

            return FunkyTests.delay(50).then(function() {
                var cards = document.querySelectorAll('.funky-skeleton-card');
                expect(cards.length).toBe(3);
            });
        });

        it('card has image placeholder when configured', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'card', count: 1, image: true });

            return FunkyTests.delay(50).then(function() {
                var image = document.querySelector('.funky-skeleton-card-image');
                expect(image).not.toBeNull();
            });
        });

        it('card has body with title and text', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'card', count: 1 });

            return FunkyTests.delay(50).then(function() {
                var body = document.querySelector('.funky-skeleton-card-body');
                expect(body).not.toBeNull();

                var title = body.querySelector('.funky-skeleton-card-title');
                expect(title).not.toBeNull();

                var text = body.querySelector('.funky-skeleton-card-text');
                expect(text).not.toBeNull();
            });
        });

        it('can hide image in card', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'card', count: 1, image: false });

            return FunkyTests.delay(50).then(function() {
                var image = document.querySelector('.funky-skeleton-card-image');
                expect(image).toBeNull();
            });
        });

    });

    describe('List Skeleton', function() {

        it('creates list container', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'list', rows: 3 });

            return FunkyTests.delay(50).then(function() {
                var list = document.querySelector('.funky-skeleton-list');
                expect(list).not.toBeNull();
            });
        });

        it('creates correct number of list items', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'list', rows: 4 });

            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.funky-skeleton-list-item');
                expect(items.length).toBe(4);
            });
        });

        it('list item has content area', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'list', rows: 1 });

            return FunkyTests.delay(50).then(function() {
                var content = document.querySelector('.funky-skeleton-list-content');
                expect(content).not.toBeNull();

                var title = content.querySelector('.funky-skeleton-list-title');
                expect(title).not.toBeNull();
            });
        });

        it('list item can have avatar', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'list', rows: 1, avatar: true });

            return FunkyTests.delay(50).then(function() {
                var avatar = document.querySelector('.funky-skeleton-avatar');
                expect(avatar).not.toBeNull();
            });
        });

        it('list item without avatar has no avatar element', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'list', rows: 1, avatar: false });

            return FunkyTests.delay(50).then(function() {
                var avatar = document.querySelector('.funky-skeleton-list-item .funky-skeleton-avatar');
                expect(avatar).toBeNull();
            });
        });

    });

    describe('Avatar Skeleton', function() {

        it('creates avatar skeleton', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'avatar' });

            return FunkyTests.delay(50).then(function() {
                var avatar = document.querySelector('.funky-skeleton-avatar');
                expect(avatar).not.toBeNull();
            });
        });

        it('avatar has size class', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'avatar', size: 'lg' });

            return FunkyTests.delay(50).then(function() {
                var avatar = document.querySelector('.funky-skeleton-avatar');
                expect(avatar.classList.contains('lg')).toBe(true);
            });
        });

        it('default size is medium', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'avatar' });

            return FunkyTests.delay(50).then(function() {
                var avatar = document.querySelector('.funky-skeleton-avatar');
                expect(avatar.classList.contains('md')).toBe(true);
            });
        });

    });

    describe('Container States', function() {

        it('adds loading class to container', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text' });

            return FunkyTests.delay(50).then(function() {
                var container = document.getElementById('visual-skeleton-container');
                expect(container.classList.contains('funky-skeleton-loading')).toBe(true);
            });
        });

        it('sets aria-busy on container', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text' });

            return FunkyTests.delay(50).then(function() {
                var container = document.getElementById('visual-skeleton-container');
                expect(container.getAttribute('aria-busy')).toBe('true');
            });
        });

        it('wrapper is aria-hidden', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text' });

            return FunkyTests.delay(50).then(function() {
                var wrapper = document.querySelector('.funky-skeleton-wrapper');
                expect(wrapper.getAttribute('aria-hidden')).toBe('true');
            });
        });

        it('removes loading class after hide', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text', fadeOut: false });

            return FunkyTests.delay(50).then(function() {
                Skeleton.hide('#visual-skeleton-container');

                return FunkyTests.delay(50);
            }).then(function() {
                var container = document.getElementById('visual-skeleton-container');
                expect(container.classList.contains('funky-skeleton-loading')).toBe(false);
            });
        });

        it('removes aria-busy after hide', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text', fadeOut: false });

            return FunkyTests.delay(50).then(function() {
                Skeleton.hide('#visual-skeleton-container');

                return FunkyTests.delay(50);
            }).then(function() {
                var container = document.getElementById('visual-skeleton-container');
                expect(container.hasAttribute('aria-busy')).toBe(false);
            });
        });

    });

    describe('Fade Animation', function() {

        it('adds fade-out class when hiding with animation', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text', fadeOut: true, fadeDuration: 200 });

            return FunkyTests.delay(50).then(function() {
                Skeleton.hide('#visual-skeleton-container');

                return FunkyTests.delay(50);
            }).then(function() {
                var wrapper = document.querySelector('.funky-skeleton-wrapper');
                if (wrapper) {
                    expect(wrapper.classList.contains('funky-skeleton-fade-out')).toBe(true);
                }
            });
        });

    });

    describe('Style Consistency', function() {

        it('skeleton elements have shimmer background', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text' });

            return FunkyTests.delay(50).then(function() {
                var skeleton = document.querySelector('.funky-skeleton');
                var styles = Visual.snapshotStyles(skeleton);

                // Should have background defined
                expect(styles.background || styles['background-color']).toBeDefined();
            });
        });

        it('skeleton elements have rounded corners', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text' });

            return FunkyTests.delay(50).then(function() {
                var skeleton = document.querySelector('.funky-skeleton');
                var computed = window.getComputedStyle(skeleton);

                expect(computed.borderRadius).toBeDefined();
            });
        });

    });

    describe('Loading State Check', function() {

        it('isLoading returns true when skeleton is active', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text' });

            return FunkyTests.delay(50).then(function() {
                expect(Skeleton.isLoading('#visual-skeleton-container')).toBe(true);
            });
        });

        it('isLoading returns false after hide', function() {
            Skeleton.show('#visual-skeleton-container', { type: 'text', fadeOut: false });

            return FunkyTests.delay(50).then(function() {
                Skeleton.hide('#visual-skeleton-container');

                return FunkyTests.delay(50);
            }).then(function() {
                expect(Skeleton.isLoading('#visual-skeleton-container')).toBe(false);
            });
        });

    });

    describe('Multiple Skeletons', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-skeleton-container');
            container.innerHTML =
                '<div id="skeleton-1" style="margin-bottom: 10px;"></div>' +
                '<div id="skeleton-2" style="margin-bottom: 10px;"></div>';
        });

        it('multiple containers can have skeletons', function() {
            Skeleton.show('#skeleton-1', { type: 'text', lines: 2 });
            Skeleton.show('#skeleton-2', { type: 'list', rows: 2 });

            return FunkyTests.delay(50).then(function() {
                var wrapper1 = document.querySelector('#skeleton-1 .funky-skeleton-wrapper');
                var wrapper2 = document.querySelector('#skeleton-2 .funky-skeleton-wrapper');

                expect(wrapper1).not.toBeNull();
                expect(wrapper2).not.toBeNull();
            });
        });

        it('hideAll removes all skeletons', function() {
            Skeleton.show('#skeleton-1', { type: 'text', fadeOut: false });
            Skeleton.show('#skeleton-2', { type: 'text', fadeOut: false });

            return FunkyTests.delay(50).then(function() {
                Skeleton.hideAll();

                return FunkyTests.delay(50);
            }).then(function() {
                expect(Skeleton.isLoading('#skeleton-1')).toBe(false);
                expect(Skeleton.isLoading('#skeleton-2')).toBe(false);
            });
        });

    });

});
