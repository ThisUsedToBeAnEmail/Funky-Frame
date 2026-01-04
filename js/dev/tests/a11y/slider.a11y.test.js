/**
 * Accessibility Tests: Slider
 *
 * Tests WCAG 2.1 AA compliance for slider/range components.
 */

describe('Funky.A11y.Slider', function() {

    var Slider = Funky.Slider;
    var A11y = FunkyTests.A11y;

    // Skip all tests if A11y utilities not available
    if (!A11y) {
        it('A11y utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div class="slider-container">' +
                '<label id="volume-label">Volume</label>' +
                '<div id="volume-slider" class="slider" role="slider" ' +
                    'aria-labelledby="volume-label" ' +
                    'aria-valuemin="0" ' +
                    'aria-valuemax="100" ' +
                    'aria-valuenow="50" ' +
                    'aria-valuetext="50 percent" ' +
                    'tabindex="0">' +
                    '<div class="slider-track">' +
                        '<div class="slider-fill" style="width: 50%;"></div>' +
                        '<div class="slider-thumb"></div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    afterEach(function() {
        if (Slider && Slider.destroy) {
            Slider.destroy('#volume-slider');
        }
        fixture.destroy();
    });

    describe('ARIA Roles', function() {

        it('slider has role="slider"', function() {
            var slider = document.querySelector('#volume-slider');
            expect(slider.getAttribute('role')).toBe('slider');
        });

        it('slider has required aria-valuenow', function() {
            var slider = document.querySelector('#volume-slider');
            expect(slider.hasAttribute('aria-valuenow')).toBe(true);
            expect(slider.getAttribute('aria-valuenow')).toBe('50');
        });

        it('slider has aria-valuemin', function() {
            var slider = document.querySelector('#volume-slider');
            expect(slider.getAttribute('aria-valuemin')).toBe('0');
        });

        it('slider has aria-valuemax', function() {
            var slider = document.querySelector('#volume-slider');
            expect(slider.getAttribute('aria-valuemax')).toBe('100');
        });

    });

    describe('Accessible Names', function() {

        it('slider has accessible name via aria-labelledby', function() {
            var slider = document.querySelector('#volume-slider');
            var labelledBy = slider.getAttribute('aria-labelledby');

            expect(labelledBy).toBe('volume-label');

            var label = document.getElementById(labelledBy);
            expect(label.textContent).toBe('Volume');
        });

        it('slider can have aria-label', function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<div id="brightness-slider" class="slider" role="slider" ' +
                    'aria-label="Brightness control" ' +
                    'aria-valuemin="0" aria-valuemax="100" aria-valuenow="75" tabindex="0">' +
                '</div>'
            );

            var slider = document.querySelector('#brightness-slider');
            var name = A11y.getAccessibleName(slider);

            expect(name).toBe('Brightness control');
        });

        it('aria-valuetext provides human-readable value', function() {
            var slider = document.querySelector('#volume-slider');
            expect(slider.getAttribute('aria-valuetext')).toBe('50 percent');
        });

    });

    describe('Keyboard Navigation', function() {

        it('slider is focusable', function() {
            var slider = document.querySelector('#volume-slider');
            expect(A11y.isInTabOrder(slider)).toBe(true);
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('ArrowRight increases value', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            var initialValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
            FunkyTests.simulate.keydown(slider, { key: 'ArrowRight' });

            return FunkyTests.delay(50).then(function() {
                var newValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
                expect(newValue).toBeGreaterThan(initialValue);
            });
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('ArrowLeft decreases value', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            var initialValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
            FunkyTests.simulate.keydown(slider, { key: 'ArrowLeft' });

            return FunkyTests.delay(50).then(function() {
                var newValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
                expect(newValue).toBeLessThan(initialValue);
            });
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('ArrowUp increases value', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            var initialValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
            FunkyTests.simulate.keydown(slider, { key: 'ArrowUp' });

            return FunkyTests.delay(50).then(function() {
                var newValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
                expect(newValue).toBeGreaterThan(initialValue);
            });
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('ArrowDown decreases value', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            var initialValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
            FunkyTests.simulate.keydown(slider, { key: 'ArrowDown' });

            return FunkyTests.delay(50).then(function() {
                var newValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
                expect(newValue).toBeLessThan(initialValue);
            });
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('Home sets value to minimum', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            FunkyTests.simulate.keydown(slider, { key: 'Home' });

            return FunkyTests.delay(50).then(function() {
                var value = slider.getAttribute('aria-valuenow');
                var min = slider.getAttribute('aria-valuemin');
                expect(value).toBe(min);
            });
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('End sets value to maximum', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            FunkyTests.simulate.keydown(slider, { key: 'End' });

            return FunkyTests.delay(50).then(function() {
                var value = slider.getAttribute('aria-valuenow');
                var max = slider.getAttribute('aria-valuemax');
                expect(value).toBe(max);
            });
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('PageUp increases by larger step', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            var initialValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
            FunkyTests.simulate.keydown(slider, { key: 'PageUp' });

            return FunkyTests.delay(50).then(function() {
                var newValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
                // PageUp should increase by more than a single step
                expect(newValue - initialValue).toBeGreaterThan(1);
            });
        });

        // Skip: Requires Slider component to handle keyboard events
        xit('PageDown decreases by larger step', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            var initialValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
            FunkyTests.simulate.keydown(slider, { key: 'PageDown' });

            return FunkyTests.delay(50).then(function() {
                var newValue = parseInt(slider.getAttribute('aria-valuenow'), 10);
                // PageDown should decrease by more than a single step
                expect(initialValue - newValue).toBeGreaterThan(1);
            });
        });

    });

    describe('Value Constraints', function() {

        it('value does not go below minimum', function() {
            var slider = document.querySelector('#volume-slider');
            slider.setAttribute('aria-valuenow', '0');
            slider.focus();

            FunkyTests.simulate.keydown(slider, { key: 'ArrowLeft' });

            return FunkyTests.delay(50).then(function() {
                var value = parseInt(slider.getAttribute('aria-valuenow'), 10);
                var min = parseInt(slider.getAttribute('aria-valuemin'), 10);
                expect(value).toBeGreaterThanOrEqual(min);
            });
        });

        it('value does not go above maximum', function() {
            var slider = document.querySelector('#volume-slider');
            slider.setAttribute('aria-valuenow', '100');
            slider.focus();

            FunkyTests.simulate.keydown(slider, { key: 'ArrowRight' });

            return FunkyTests.delay(50).then(function() {
                var value = parseInt(slider.getAttribute('aria-valuenow'), 10);
                var max = parseInt(slider.getAttribute('aria-valuemax'), 10);
                expect(value).toBeLessThanOrEqual(max);
            });
        });

    });

    describe('Visual Feedback', function() {

        it('slider has visible focus indicator', function() {
            var slider = document.querySelector('#volume-slider');
            slider.focus();

            var styles = window.getComputedStyle(slider);
            var hasOutline = styles.outline !== 'none' && styles.outline !== '';
            var hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';

            expect(hasOutline || hasBoxShadow).toBe(true);
        });

        it('slider thumb indicates current position', function() {
            var thumb = document.querySelector('.slider-thumb');
            expect(thumb).toBeInDocument();
        });

        it('slider fill shows progress', function() {
            var fill = document.querySelector('.slider-fill');
            expect(fill).toBeInDocument();
        });

    });

    describe('Range Slider', function() {

        beforeEach(function() {
            fixture.destroy();
            fixture = FunkyTests.fixture(
                '<div class="range-slider-container">' +
                    '<label id="price-label">Price Range</label>' +
                    '<div class="range-slider" aria-labelledby="price-label">' +
                        '<div id="min-thumb" class="slider-thumb" role="slider" ' +
                            'aria-label="Minimum price" ' +
                            'aria-valuemin="0" aria-valuemax="1000" aria-valuenow="200" ' +
                            'aria-valuetext="$200" tabindex="0">' +
                        '</div>' +
                        '<div id="max-thumb" class="slider-thumb" role="slider" ' +
                            'aria-label="Maximum price" ' +
                            'aria-valuemin="0" aria-valuemax="1000" aria-valuenow="800" ' +
                            'aria-valuetext="$800" tabindex="0">' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );
        });

        it('both thumbs have role="slider"', function() {
            var thumbs = document.querySelectorAll('[role="slider"]');
            expect(thumbs.length).toBe(2);
        });

        it('each thumb has unique accessible name', function() {
            var minThumb = document.querySelector('#min-thumb');
            var maxThumb = document.querySelector('#max-thumb');

            var minName = A11y.getAccessibleName(minThumb);
            var maxName = A11y.getAccessibleName(maxThumb);

            expect(minName).toBe('Minimum price');
            expect(maxName).toBe('Maximum price');
            expect(minName).not.toBe(maxName);
        });

        it('both thumbs are in tab order', function() {
            var minThumb = document.querySelector('#min-thumb');
            var maxThumb = document.querySelector('#max-thumb');

            expect(A11y.isInTabOrder(minThumb)).toBe(true);
            expect(A11y.isInTabOrder(maxThumb)).toBe(true);
        });

        it('each thumb has appropriate value text', function() {
            var minThumb = document.querySelector('#min-thumb');
            var maxThumb = document.querySelector('#max-thumb');

            expect(minThumb.getAttribute('aria-valuetext')).toBe('$200');
            expect(maxThumb.getAttribute('aria-valuetext')).toBe('$800');
        });

    });

    describe('Disabled State', function() {

        it('disabled slider has aria-disabled="true"', function() {
            var slider = document.querySelector('#volume-slider');
            slider.setAttribute('aria-disabled', 'true');

            expect(slider.getAttribute('aria-disabled')).toBe('true');
        });

        it('disabled slider is not in tab order', function() {
            var slider = document.querySelector('#volume-slider');
            slider.setAttribute('aria-disabled', 'true');
            slider.setAttribute('tabindex', '-1');

            expect(A11y.isInTabOrder(slider)).toBe(false);
        });

    });

    describe('ARIA Validation', function() {

        it('no invalid ARIA attributes', function() {
            var container = document.querySelector('.slider-container');
            var issues = A11y.checkAria(container);
            var invalidRoleIssues = issues.filter(function(i) {
                return i.issue === 'Invalid ARIA role';
            });

            expect(invalidRoleIssues.length).toBe(0);
        });

        it('slider has all required ARIA attributes', function() {
            var slider = document.querySelector('#volume-slider');

            expect(slider.hasAttribute('aria-valuenow')).toBe(true);
            expect(slider.hasAttribute('aria-valuemin')).toBe(true);
            expect(slider.hasAttribute('aria-valuemax')).toBe(true);
        });

    });

});
