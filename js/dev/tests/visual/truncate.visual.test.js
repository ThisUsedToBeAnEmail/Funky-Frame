/**
 * Visual Regression Tests: Truncate Component
 *
 * Tests visual appearance of text truncation with show more/less toggle.
 */

describe('Funky.Visual.Truncate', function() {

    var Visual = FunkyTests.Visual;
    var Truncate = Funky.Truncate;
    var fixture;

    var longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-truncate-container" style="width: 400px; background: #fff; padding: 10px;"><p id="truncate-target">' + longText + '</p></div>');

        // Pause CSS animations for visual testing
        var style = document.createElement('style');
        style.id = 'pause-animations';
        style.textContent = '*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; transition-duration: 0ms !important; }';
        document.head.appendChild(style);
    });

    afterEach(function() {
        Truncate.destroy('#truncate-target');
        fixture.destroy();

        // Remove animation pause style
        var pauseStyle = document.getElementById('pause-animations');
        if (pauseStyle) {
            pauseStyle.remove();
        }
    });

    describe('Character Limit Truncation', function() {

        it('adds truncate class', function() {
            Truncate.apply('#truncate-target', { limit: 100 });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('funky-truncate')).toBe(true);
            });
        });

        it('truncates text to limit', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('truncate-target');
                var visibleText = el.textContent.replace('Show more', '').replace('...', '').trim();
                expect(visibleText.length).toBeLessThan(longText.length);
            });
        });

        it('shows ellipsis', function() {
            Truncate.apply('#truncate-target', { limit: 50, ellipsis: '...' });

            return FunkyTests.delay(50).then(function() {
                var ellipsis = document.querySelector('.funky-truncate-ellipsis');
                expect(ellipsis).not.toBeNull();
                expect(ellipsis.textContent).toBe('...');
            });
        });

        it('shows toggle button', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                expect(toggle).not.toBeNull();
            });
        });

        it('toggle button has correct text', function() {
            Truncate.apply('#truncate-target', { limit: 50, moreText: 'Show more' });

            return FunkyTests.delay(50).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                expect(toggle.textContent).toBe('Show more');
            });
        });

        it('toggle button has aria-expanded', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                expect(toggle.getAttribute('aria-expanded')).toBe('false');
            });
        });

    });

    describe('Line Clamp Truncation', function() {

        beforeEach(function() {
            // Replace with multi-line content
            var container = document.getElementById('visual-truncate-container');
            container.innerHTML = '<p id="truncate-lines" style="width: 200px;">' + longText + '</p>';
        });

        afterEach(function() {
            Truncate.destroy('#truncate-lines');
        });

        it('adds line truncate class', function() {
            Truncate.apply('#truncate-lines', { lines: 3 });

            return FunkyTests.delay(100).then(function() {
                var el = document.getElementById('truncate-lines');
                expect(el.classList.contains('funky-truncate-lines')).toBe(true);
            });
        });

        it('adds specific line count class', function() {
            Truncate.apply('#truncate-lines', { lines: 2 });

            return FunkyTests.delay(100).then(function() {
                var el = document.getElementById('truncate-lines');
                expect(el.classList.contains('funky-truncate-lines-2')).toBe(true);
            });
        });

    });

    describe('Expand/Collapse', function() {

        it('expands on toggle click', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                toggle.click();

                return FunkyTests.delay(50);
            }).then(function() {
                expect(Truncate.isExpanded('#truncate-target')).toBe(true);
            });
        });

        it('adds expanded class when expanded', function() {
            Truncate.apply('#truncate-target', { limit: 50, expandedClass: 'expanded' });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('expanded')).toBe(true);
            });
        });

        it('toggle text changes to "Show less"', function() {
            Truncate.apply('#truncate-target', { limit: 50, lessText: 'Show less' });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                expect(toggle.textContent).toBe('Show less');
            });
        });

        it('aria-expanded changes to true when expanded', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                expect(toggle.getAttribute('aria-expanded')).toBe('true');
            });
        });

        it('shows full text when expanded', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.textContent).toContain(longText.substring(0, 100));
            });
        });

        it('collapses back to truncated state', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                Truncate.collapse('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                expect(Truncate.isExpanded('#truncate-target')).toBe(false);
            });
        });

        it('removes expanded class when collapsed', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                Truncate.collapse('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('expanded')).toBe(false);
            });
        });

    });

    describe('Events', function() {

        it('dispatches expand event', function() {
            var eventFired = false;
            var el = document.getElementById('truncate-target');

            el.addEventListener('funky.truncate.expand', function() {
                eventFired = true;
            });

            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                expect(eventFired).toBe(true);
            });
        });

        it('dispatches collapse event', function() {
            var eventFired = false;
            var el = document.getElementById('truncate-target');

            el.addEventListener('funky.truncate.collapse', function() {
                eventFired = true;
            });

            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.expand('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                Truncate.collapse('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                expect(eventFired).toBe(true);
            });
        });

    });

    describe('Inline Mode', function() {

        it('adds inline class', function() {
            Truncate.apply('#truncate-target', { limit: 50, inline: true });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('funky-truncate-inline')).toBe(true);
            });
        });

    });

    describe('Block Mode', function() {

        it('adds block class by default', function() {
            Truncate.apply('#truncate-target', { limit: 50, inline: false });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('funky-truncate-block')).toBe(true);
            });
        });

    });

    describe('Animation', function() {

        it('adds animate class when enabled', function() {
            Truncate.apply('#truncate-target', { limit: 50, animate: true });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('animate')).toBe(true);
            });
        });

        it('no animate class when disabled', function() {
            Truncate.apply('#truncate-target', { limit: 50, animate: false });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('animate')).toBe(false);
            });
        });

    });

    describe('Destroy', function() {

        it('removes truncate classes', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.destroy('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.classList.contains('funky-truncate')).toBe(false);
            });
        });

        it('restores original text', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                Truncate.destroy('#truncate-target');

                return FunkyTests.delay(50);
            }).then(function() {
                var el = document.getElementById('truncate-target');
                expect(el.textContent).toBe(longText);
            });
        });

    });

    describe('Utility Function', function() {

        it('Truncate.text truncates string', function() {
            var result = Truncate.text(longText, 50);
            expect(result.length).toBeLessThan(longText.length);
        });

        it('Truncate.text adds ellipsis', function() {
            var result = Truncate.text(longText, 50, '...');
            expect(result.endsWith('...')).toBe(true);
        });

        it('Truncate.text returns short text unchanged', function() {
            var shortText = 'Hello';
            var result = Truncate.text(shortText, 50);
            expect(result).toBe(shortText);
        });

    });

    describe('Short Text (No Truncation Needed)', function() {

        beforeEach(function() {
            var el = document.getElementById('truncate-target');
            el.textContent = 'Short text';
        });

        it('does not add toggle for short text', function() {
            Truncate.apply('#truncate-target', { limit: 100 });

            return FunkyTests.delay(50).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                expect(toggle).toBeNull();
            });
        });

    });

    describe('Style Consistency', function() {

        it('truncated element is visible', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                var el = document.getElementById('truncate-target');
                var styles = Visual.snapshotStyles(el);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('toggle button is visible', function() {
            Truncate.apply('#truncate-target', { limit: 50 });

            return FunkyTests.delay(50).then(function() {
                var toggle = document.querySelector('.funky-truncate-toggle');
                var styles = Visual.snapshotStyles(toggle);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

    });

});
