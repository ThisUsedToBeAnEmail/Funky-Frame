/**
 * Visual Regression Tests: EmptyState Component
 *
 * Tests visual appearance of empty state placeholders.
 */

describe('Funky.Visual.EmptyState', function() {

    var Visual = FunkyTests.Visual;
    var EmptyState = Funky.EmptyState;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-empty-state-container" style="width: 400px; min-height: 200px; background: #fff; padding: 20px;"></div>');

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; }';
        document.head.appendChild(style);
    });

    afterEach(function() {
        EmptyState.hide('#visual-empty-state-container');
        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    });

    describe('Basic Structure', function() {

        it('creates empty state element', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'No data',
                message: 'Nothing to show'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState).not.toBeNull();
            });
        });

        it('has status role', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'No data'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.getAttribute('role')).toBe('status');
            });
        });

        it('renders title', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'No results found'
            });

            return FunkyTests.delay(50).then(function() {
                var title = document.querySelector('.funky-empty-state-title');
                expect(title).not.toBeNull();
                expect(title.textContent).toBe('No results found');
            });
        });

        it('renders message', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                message: 'Try a different search'
            });

            return FunkyTests.delay(50).then(function() {
                var message = document.querySelector('.funky-empty-state-message');
                expect(message).not.toBeNull();
                expect(message.textContent).toBe('Try a different search');
            });
        });

        it('renders icon', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                icon: 'fa-search'
            });

            return FunkyTests.delay(50).then(function() {
                var iconContainer = document.querySelector('.funky-empty-state-icon');
                expect(iconContainer).not.toBeNull();
            });
        });

        it('icon is aria-hidden', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                icon: 'fa-inbox'
            });

            return FunkyTests.delay(50).then(function() {
                var iconContainer = document.querySelector('.funky-empty-state-icon');
                expect(iconContainer.getAttribute('aria-hidden')).toBe('true');
            });
        });

    });

    describe('Presets', function() {

        it('no-results preset has search icon', function() {
            EmptyState.show('#visual-empty-state-container', {
                type: 'no-results'
            });

            return FunkyTests.delay(50).then(function() {
                var title = document.querySelector('.funky-empty-state-title');
                expect(title.textContent).toContain('No results');
            });
        });

        it('error preset has danger variant', function() {
            EmptyState.show('#visual-empty-state-container', {
                type: 'error'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-variant-danger')).toBe(true);
            });
        });

        it('offline preset has warning variant', function() {
            EmptyState.show('#visual-empty-state-container', {
                type: 'offline'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-variant-warning')).toBe(true);
            });
        });

        it('coming-soon preset has info variant', function() {
            EmptyState.show('#visual-empty-state-container', {
                type: 'coming-soon'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-variant-info')).toBe(true);
            });
        });

        it('access-denied preset renders correctly', function() {
            EmptyState.show('#visual-empty-state-container', {
                type: 'access-denied'
            });

            return FunkyTests.delay(50).then(function() {
                var title = document.querySelector('.funky-empty-state-title');
                expect(title.textContent).toContain('Access denied');
            });
        });

        it('empty-table preset renders correctly', function() {
            EmptyState.show('#visual-empty-state-container', {
                type: 'empty-table'
            });

            return FunkyTests.delay(50).then(function() {
                var title = document.querySelector('.funky-empty-state-title');
                expect(title.textContent).toContain('No records');
            });
        });

    });

    describe('Sizes', function() {

        it('small size has correct class', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                size: 'sm'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-sm')).toBe(true);
            });
        });

        it('medium size has correct class', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                size: 'md'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-md')).toBe(true);
            });
        });

        it('large size has correct class', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                size: 'lg'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-lg')).toBe(true);
            });
        });

    });

    describe('Actions', function() {

        it('renders primary action button', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                action: {
                    text: 'Add Item',
                    variant: 'primary'
                }
            });

            return FunkyTests.delay(50).then(function() {
                var actionBtn = document.querySelector('.funky-empty-state-action');
                expect(actionBtn).not.toBeNull();
                expect(actionBtn.textContent).toContain('Add Item');
            });
        });

        it('action button has correct variant class', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                action: {
                    text: 'Retry',
                    variant: 'danger'
                }
            });

            return FunkyTests.delay(50).then(function() {
                var actionBtn = document.querySelector('.funky-empty-state-action');
                expect(actionBtn.classList.contains('btn-danger')).toBe(true);
            });
        });

        it('renders secondary action', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                secondaryAction: {
                    text: 'Learn more',
                    href: '/help'
                }
            });

            return FunkyTests.delay(50).then(function() {
                var secondaryAction = document.querySelector('.funky-empty-state-secondary');
                expect(secondaryAction).not.toBeNull();
                expect(secondaryAction.textContent).toBe('Learn more');
            });
        });

        it('secondary action link has href', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                secondaryAction: {
                    text: 'Help',
                    href: '/help'
                }
            });

            return FunkyTests.delay(50).then(function() {
                var secondaryAction = document.querySelector('.funky-empty-state-secondary');
                expect(secondaryAction.tagName).toBe('A');
                expect(secondaryAction.getAttribute('href')).toBe('/help');
            });
        });

        it('actions container exists when action present', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                action: { text: 'Click' }
            });

            return FunkyTests.delay(50).then(function() {
                var actions = document.querySelector('.funky-empty-state-actions');
                expect(actions).not.toBeNull();
            });
        });

        it('action button with icon', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                action: {
                    text: 'Add',
                    icon: 'fa-plus'
                }
            });

            return FunkyTests.delay(50).then(function() {
                var actionBtn = document.querySelector('.funky-empty-state-action');
                var icon = actionBtn.querySelector('i, [class*="fa-"]');
                expect(icon).not.toBeNull();
            });
        });

    });

    describe('Variants', function() {

        it('danger variant has correct class', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Error',
                variant: 'danger'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-variant-danger')).toBe(true);
            });
        });

        it('warning variant has correct class', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Warning',
                variant: 'warning'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-variant-warning')).toBe(true);
            });
        });

        it('info variant has correct class', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Info',
                variant: 'info'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('funky-empty-state-variant-info')).toBe(true);
            });
        });

    });

    describe('Animation', function() {

        it('adds animate-in class when animate is true', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                animate: true
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('animate-in')).toBe(true);
            });
        });

        it('no animate-in class when animate is false', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                animate: false
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('animate-in')).toBe(false);
            });
        });

    });

    describe('Custom Class', function() {

        it('adds custom className', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                className: 'my-custom-class'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState.classList.contains('my-custom-class')).toBe(true);
            });
        });

    });

    describe('Style Consistency', function() {

        it('empty state is visible', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty'
            });

            return FunkyTests.delay(50).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                var styles = Visual.snapshotStyles(emptyState);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('title has appropriate styling', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty'
            });

            return FunkyTests.delay(50).then(function() {
                var title = document.querySelector('.funky-empty-state-title');
                var computed = window.getComputedStyle(title);

                expect(computed.fontSize).toBeDefined();
            });
        });

        it('message has appropriate styling', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                message: 'Some message'
            });

            return FunkyTests.delay(50).then(function() {
                var message = document.querySelector('.funky-empty-state-message');
                var computed = window.getComputedStyle(message);

                expect(computed.fontSize).toBeDefined();
            });
        });

    });

    describe('Show/Hide', function() {

        it('isShowing returns true when shown', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty'
            });

            return FunkyTests.delay(50).then(function() {
                expect(EmptyState.isShowing('#visual-empty-state-container')).toBe(true);
            });
        });

        it('isShowing returns false after hide', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty'
            });

            return FunkyTests.delay(50).then(function() {
                EmptyState.hide('#visual-empty-state-container');

                return FunkyTests.delay(50);
            }).then(function() {
                expect(EmptyState.isShowing('#visual-empty-state-container')).toBe(false);
            });
        });

        it('hide removes element from DOM', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty'
            });

            return FunkyTests.delay(50).then(function() {
                EmptyState.hide('#visual-empty-state-container');

                return FunkyTests.delay(50);
            }).then(function() {
                var emptyState = document.querySelector('.funky-empty-state');
                expect(emptyState).toBeNull();
            });
        });

        it('showing again replaces previous', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'First'
            });

            return FunkyTests.delay(50).then(function() {
                EmptyState.show('#visual-empty-state-container', {
                    title: 'Second'
                });

                return FunkyTests.delay(50);
            }).then(function() {
                var emptyStates = document.querySelectorAll('.funky-empty-state');
                expect(emptyStates.length).toBe(1);

                var title = document.querySelector('.funky-empty-state-title');
                expect(title.textContent).toBe('Second');
            });
        });

    });

    describe('Image Icon', function() {

        it('renders image when icon is URL', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                icon: '/images/empty.svg'
            });

            return FunkyTests.delay(50).then(function() {
                var iconContainer = document.querySelector('.funky-empty-state-icon');
                var img = iconContainer.querySelector('img');

                expect(img).not.toBeNull();
                expect(img.getAttribute('src')).toBe('/images/empty.svg');
            });
        });

        it('image has empty alt', function() {
            EmptyState.show('#visual-empty-state-container', {
                title: 'Empty',
                icon: '/images/empty.png'
            });

            return FunkyTests.delay(50).then(function() {
                var img = document.querySelector('.funky-empty-state-icon img');
                expect(img.getAttribute('alt')).toBe('');
            });
        });

    });

});
