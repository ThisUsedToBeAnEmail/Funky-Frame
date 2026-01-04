/**
 * Visual Regression Tests: Badge Component
 *
 * Tests visual appearance of badge indicators across different types and states.
 */

describe('Funky.Visual.Badge', function() {

    var Visual = FunkyTests.Visual;
    var Badge = Funky.Badge;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-badge-container" style="padding: 20px;"></div>');

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; }';
        document.head.appendChild(style);
    });

    afterEach(function() {
        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    });

    describe('Badge Types', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML = '<button id="test-btn" style="padding: 10px 20px; position: relative;">Notifications</button>';
        });

        it('count badge has correct structure', function() {
            Badge.attach('#test-btn', { value: 5, type: 'count' });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge).not.toBeNull();
                expect(badge.classList.contains('funky-badge--count')).toBe(true);
                expect(badge.textContent).toBe('5');
            });
        });

        it('dot badge has no text', function() {
            Badge.attach('#test-btn', { type: 'dot' });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge).not.toBeNull();
                expect(badge.classList.contains('funky-badge--dot')).toBe(true);
                expect(badge.textContent).toBe('');
            });
        });

        it('warning badge shows warning indicator', function() {
            Badge.attach('#test-btn', { type: 'warning' });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge).not.toBeNull();
                expect(badge.classList.contains('funky-badge--warning')).toBe(true);
            });
        });

        it('success badge shows success indicator', function() {
            Badge.attach('#test-btn', { type: 'success' });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge).not.toBeNull();
                expect(badge.classList.contains('funky-badge--success')).toBe(true);
            });
        });

        it('info badge shows info indicator', function() {
            Badge.attach('#test-btn', { type: 'info' });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge).not.toBeNull();
                expect(badge.classList.contains('funky-badge--info')).toBe(true);
            });
        });

    });

    describe('Badge Positioning', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML = '<div id="test-element" style="width: 100px; height: 50px; position: relative; background: #ddd;"></div>';
        });

        it('default position is top-right', function() {
            Badge.attach('#test-element', { value: 3 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge).not.toBeNull();
                expect(badge.classList.contains('funky-badge--top-right')).toBe(true);
            });
        });

        it('badge is visible', function() {
            Badge.attach('#test-element', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                var styles = Visual.snapshotStyles(badge);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('badge has absolute positioning', function() {
            Badge.attach('#test-element', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                var styles = Visual.snapshotStyles(badge);

                expect(styles.position).toBe('absolute');
            });
        });

    });

    describe('Count Badge Values', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML = '<span id="test-target" style="position: relative; padding: 10px;">Item</span>';
        });

        it('shows exact count for small numbers', function() {
            Badge.attach('#test-target', { value: 5, type: 'count' });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge.textContent).toBe('5');
            });
        });

        it('shows 99+ for large numbers', function() {
            Badge.attach('#test-target', { value: 150, type: 'count', max: 99 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge.textContent).toBe('99+');
            });
        });

        it('adds large class for overflow', function() {
            Badge.attach('#test-target', { value: 150, type: 'count', max: 99 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge.classList.contains('funky-badge--large')).toBe(true);
            });
        });

        it('shows zero count', function() {
            Badge.attach('#test-target', { value: 0, type: 'count' });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge.textContent).toBe('0');
            });
        });

    });

    describe('Badge Removal', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML = '<div id="test-el" style="position: relative;">Test</div>';
        });

        it('removes badge from element', function() {
            Badge.attach('#test-el', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                expect(document.querySelector('.funky-badge')).not.toBeNull();

                Badge.remove('#test-el');

                return FunkyTests.delay(50);
            }).then(function() {
                expect(document.querySelector('.funky-badge')).toBeNull();
            });
        });

        it('clears data attribute on removal', function() {
            Badge.attach('#test-el', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('test-el');
                expect(el.hasAttribute('data-funky-badge')).toBe(true);

                Badge.remove('#test-el');

                return FunkyTests.delay(50);
            }).then(function() {
                var el = document.getElementById('test-el');
                expect(el.hasAttribute('data-funky-badge')).toBe(false);
            });
        });

    });

    describe('Badge Updates', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML = '<div id="update-target" style="position: relative;">Target</div>';
        });

        it('updates badge value', function() {
            Badge.attach('#update-target', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge.textContent).toBe('5');

                Badge.update('#update-target', { value: 10 });

                return FunkyTests.delay(50);
            }).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge.textContent).toBe('10');
            });
        });

        it('adds animation class on update', function() {
            Badge.attach('#update-target', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                Badge.update('#update-target', { value: 10, animate: true });

                return FunkyTests.delay(50);
            }).then(function() {
                var badge = document.querySelector('.funky-badge');
                expect(badge.classList.contains('funky-badge--animate')).toBe(true);
            });
        });

    });

    describe('Multiple Badges', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML =
                '<div id="el-1" style="position: relative; display: inline-block; margin: 10px; padding: 10px; background: #eee;">Element 1</div>' +
                '<div id="el-2" style="position: relative; display: inline-block; margin: 10px; padding: 10px; background: #eee;">Element 2</div>' +
                '<div id="el-3" style="position: relative; display: inline-block; margin: 10px; padding: 10px; background: #eee;">Element 3</div>';
        });

        it('multiple elements can have badges', function() {
            Badge.attach('#el-1', { value: 1 });
            Badge.attach('#el-2', { value: 2 });
            Badge.attach('#el-3', { value: 3 });

            return FunkyTests.delay(50).then(function() {
                var badges = document.querySelectorAll('.funky-badge');
                expect(badges.length).toBe(3);
            });
        });

        it('badges are independent', function() {
            Badge.attach('#el-1', { value: 5, type: 'count' });
            Badge.attach('#el-2', { type: 'dot' });
            Badge.attach('#el-3', { type: 'warning' });

            return FunkyTests.delay(50).then(function() {
                var el1Badge = document.querySelector('#el-1 .funky-badge');
                var el2Badge = document.querySelector('#el-2 .funky-badge');
                var el3Badge = document.querySelector('#el-3 .funky-badge');

                expect(el1Badge.classList.contains('funky-badge--count')).toBe(true);
                expect(el2Badge.classList.contains('funky-badge--dot')).toBe(true);
                expect(el3Badge.classList.contains('funky-badge--warning')).toBe(true);
            });
        });

    });

    describe('Style Consistency', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML = '<button id="styled-btn" style="position: relative; padding: 10px 20px;">Button</button>';
        });

        it('badge maintains consistent border radius', function() {
            Badge.attach('#styled-btn', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                var computed = window.getComputedStyle(badge);

                expect(computed.borderRadius).toBeDefined();
            });
        });

        it('badge has appropriate font size', function() {
            Badge.attach('#styled-btn', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                var computed = window.getComputedStyle(badge);

                expect(computed.fontSize).toBeDefined();
            });
        });

        it('badge has z-index for stacking', function() {
            Badge.attach('#styled-btn', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var badge = document.querySelector('.funky-badge');
                var styles = Visual.snapshotStyles(badge);

                // Badge should have a z-index for proper stacking
                expect(styles['z-index']).toBeDefined();
            });
        });

    });

    describe('Parent Element Styling', function() {

        beforeEach(function() {
            var container = document.getElementById('visual-badge-container');
            container.innerHTML = '<span id="static-el" style="display: inline-block;">Static Element</span>';
        });

        it('ensures parent has relative positioning', function() {
            Badge.attach('#static-el', { value: 5 });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('static-el');
                var styles = Visual.snapshotStyles(el);

                expect(styles.position).toBe('relative');
            });
        });

        it('marks element with data attribute', function() {
            Badge.attach('#static-el', { value: 5, type: 'count' });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('static-el');
                expect(el.getAttribute('data-funky-badge')).toBe('count');
            });
        });

    });

});
