/**
 * Visual Regression Tests: Breadcrumb Component
 *
 * Tests visual appearance of breadcrumb navigation.
 */

describe('Funky.Visual.Breadcrumb', function() {

    var Visual = FunkyTests.Visual;
    var Breadcrumb = Funky.Breadcrumb;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<nav id="visual-breadcrumb-container" aria-label="Breadcrumb"></nav>');
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Breadcrumb Structure', function() {

        it('renders ordered list structure', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var ol = document.querySelector('#visual-breadcrumb-container ol');
                expect(ol).not.toBeNull();
                expect(ol.classList.contains('breadcrumb-pro')).toBe(true);
            });
        });

        it('renders breadcrumb items', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item');
                expect(items.length).toBeGreaterThan(0);
            });
        });

        it('first item is home with icon', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var firstItem = document.querySelector('.breadcrumb-item');
                expect(firstItem).not.toBeNull();

                var homeLink = firstItem.querySelector('.breadcrumb-home');
                expect(homeLink).not.toBeNull();

                var icon = homeLink.querySelector('i, svg, [class*="fa-"]');
                expect(icon).not.toBeNull();
            });
        });

    });

    describe('Active State', function() {

        it('last item has active class', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item');
                var lastItem = items[items.length - 1];

                expect(lastItem.classList.contains('active')).toBe(true);
            });
        });

        it('active item has aria-current', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var activeItem = document.querySelector('.breadcrumb-item.active');
                if (activeItem) {
                    expect(activeItem.getAttribute('aria-current')).toBe('page');
                }
            });
        });

        it('active item contains span not link', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var activeItem = document.querySelector('.breadcrumb-item.active');
                if (activeItem) {
                    var span = activeItem.querySelector('span');
                    var link = activeItem.querySelector('a:not(.breadcrumb-home)');

                    // Active item should have span for text (not clickable)
                    expect(span !== null || link === null).toBe(true);
                }
            });
        });

    });

    describe('Link Items', function() {

        it('non-active items contain links', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item:not(.active)');

                items.forEach(function(item) {
                    var link = item.querySelector('a');
                    expect(link).not.toBeNull();
                });
            });
        });

        it('home link has href', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var homeLink = document.querySelector('.breadcrumb-home');
                expect(homeLink).not.toBeNull();
                expect(homeLink.getAttribute('href')).toBe('/');
            });
        });

        it('home link has accessible label', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var homeLink = document.querySelector('.breadcrumb-home');
                expect(homeLink).not.toBeNull();

                var hasLabel = homeLink.getAttribute('aria-label') ||
                               homeLink.getAttribute('title') ||
                               homeLink.textContent.trim();
                expect(hasLabel).toBeTruthy();
            });
        });

    });

    describe('Style Consistency', function() {

        it('breadcrumb list has correct display', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var ol = document.querySelector('.breadcrumb-pro');
                var styles = Visual.snapshotStyles(ol);

                expect(styles.display).toBe('flex');
            });
        });

        it('items are visible', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item');

                items.forEach(function(item) {
                    var styles = Visual.snapshotStyles(item);
                    expect(styles.display).not.toBe('none');
                    expect(styles.visibility).not.toBe('hidden');
                });
            });
        });

        it('items align horizontally', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item');
                if (items.length >= 2) {
                    var rect1 = items[0].getBoundingClientRect();
                    var rect2 = items[1].getBoundingClientRect();

                    // Items should be roughly on the same vertical line (allow variance for wrapping/font)
                    expect(Math.abs(rect1.top - rect2.top)).toBeLessThan(30);
                }
            });
        });

    });

    describe('setData Method', function() {

        it('renders custom breadcrumb data', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                Breadcrumb.setData([
                    { label: 'Home', url: '/' },
                    { label: 'Products', url: '/products' },
                    { label: 'Widget' }
                ]);

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item');
                expect(items.length).toBe(3);
            });
        });

        it('last item from setData is active', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                Breadcrumb.setData([
                    { label: 'Home', url: '/' },
                    { label: 'Current Page' }
                ]);

                return FunkyTests.delay(50);
            }).then(function() {
                var items = document.querySelectorAll('.breadcrumb-item');
                var lastItem = items[items.length - 1];

                expect(lastItem.classList.contains('active')).toBe(true);
            });
        });

    });

    describe('Accessibility', function() {

        it('container has nav role', function() {
            var container = document.getElementById('visual-breadcrumb-container');
            expect(container.tagName).toBe('NAV');
        });

        it('container has aria-label', function() {
            var container = document.getElementById('visual-breadcrumb-container');
            expect(container.getAttribute('aria-label')).toBe('Breadcrumb');
        });

        it('home icon is aria-hidden', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var homeLink = document.querySelector('.breadcrumb-home');
                var icon = homeLink.querySelector('i, svg, [class*="fa-"]');

                if (icon) {
                    expect(icon.getAttribute('aria-hidden')).toBe('true');
                }
            });
        });

    });

    describe('Non-Nav Container', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-breadcrumb-container');
            container.outerHTML = '<div id="visual-breadcrumb-container"></div>';
        });

        it('wraps content in nav when container is not nav', function() {
            Breadcrumb.render('#visual-breadcrumb-container');

            return FunkyTests.delay(50).then(function() {
                var container = document.getElementById('visual-breadcrumb-container');
                var nav = container.querySelector('nav');

                expect(nav).not.toBeNull();
                expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
            });
        });

    });

    describe('Multiple Containers', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-breadcrumb-container');
            container.innerHTML = '';
            container.insertAdjacentHTML('afterend', '<nav id="breadcrumb-2" aria-label="Secondary Breadcrumb"></nav>');
        });

        afterEach(function() {
            var secondNav = document.getElementById('breadcrumb-2');
            if (secondNav) {
                secondNav.remove();
            }
        });

        it('can render to multiple containers', function() {
            Breadcrumb.render('#visual-breadcrumb-container');
            Breadcrumb.render('#breadcrumb-2');

            return FunkyTests.delay(50).then(function() {
                var ol1 = document.querySelector('#visual-breadcrumb-container .breadcrumb-pro');
                var ol2 = document.querySelector('#breadcrumb-2 .breadcrumb-pro');

                expect(ol1).not.toBeNull();
                expect(ol2).not.toBeNull();
            });
        });

    });

});
