/**
 * Visual Regression Tests: Slider Component
 *
 * Tests visual appearance of dual-handle range slider.
 */

describe('Funky.Visual.Slider', function() {

    var Visual = FunkyTests.Visual;
    var Slider = Funky.Slider;
    var fixture;
    var sliderInstance;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-slider-container" style="width: 400px; padding: 40px 20px; background: #fff;"></div>');
    });

    afterEach(function() {
        if (sliderInstance && sliderInstance.destroy) {
            sliderInstance.destroy();
            sliderInstance = null;
        }
        fixture.destroy();
    });

    describe('Slider Structure', function() {

        it('creates slider elements', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var slider = container.querySelector('.funky-slider');
                expect(slider).not.toBeNull();
            });
        });

        it('creates track element', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var track = container.querySelector('.funky-slider-track');
                expect(track).not.toBeNull();
            });
        });

        it('creates range highlight', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var range = container.querySelector('.funky-slider-range');
                expect(range).not.toBeNull();
            });
        });

        it('creates two handles', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var handles = container.querySelectorAll('.funky-slider-handle');
                expect(handles.length).toBe(2);
            });
        });

        it('creates min and max handle classes', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                expect(minHandle).not.toBeNull();
                expect(maxHandle).not.toBeNull();
            });
        });

    });

    describe('Handle Positioning', function() {

        it('min handle at correct position for initial value', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 25,
                maxValue: 75
            });

            return FunkyTests.delay(50).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');

                // Handle should be positioned at 25%
                expect(minHandle.style.left).toBe('25%');
            });
        });

        it('max handle at correct position for initial value', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 25,
                maxValue: 75
            });

            return FunkyTests.delay(50).then(function() {
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                // Handle should be positioned at 75%
                expect(maxHandle.style.left).toBe('75%');
            });
        });

        it('range element spans between handles', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 20,
                maxValue: 80
            });

            return FunkyTests.delay(50).then(function() {
                var range = container.querySelector('.funky-slider-range');

                expect(range.style.left).toBe('20%');
                expect(range.style.width).toBe('60%');
            });
        });

    });

    describe('Tooltips', function() {

        it('creates tooltips for handles', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var tooltips = container.querySelectorAll('.funky-slider-tooltip');
                expect(tooltips.length).toBe(2);
            });
        });

        it('tooltip shows formatted value', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 50,
                formatValue: function(val) { return val + ' units'; }
            });

            return FunkyTests.delay(50).then(function() {
                var minTooltip = container.querySelector('.funky-slider-handle-min .funky-slider-tooltip');
                expect(minTooltip.textContent).toBe('50 units');
            });
        });

        it('updates tooltip on value change', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 10
            });

            return FunkyTests.delay(50).then(function() {
                sliderInstance.setValues(30, null);

                return FunkyTests.delay(50);
            }).then(function() {
                var minTooltip = container.querySelector('.funky-slider-handle-min .funky-slider-tooltip');
                expect(minTooltip.textContent).toContain('30');
            });
        });

    });

    describe('ARIA Attributes', function() {

        it('handles have slider role', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var handles = container.querySelectorAll('.funky-slider-handle');

                handles.forEach(function(handle) {
                    expect(handle.getAttribute('role')).toBe('slider');
                });
            });
        });

        it('handles are focusable', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var handles = container.querySelectorAll('.funky-slider-handle');

                handles.forEach(function(handle) {
                    expect(handle.getAttribute('tabindex')).toBe('0');
                });
            });
        });

        it('handles have aria-valuemin', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 10,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var handles = container.querySelectorAll('.funky-slider-handle');

                handles.forEach(function(handle) {
                    expect(handle.getAttribute('aria-valuemin')).toBe('10');
                });
            });
        });

        it('handles have aria-valuemax', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 500
            });

            return FunkyTests.delay(50).then(function() {
                var handles = container.querySelectorAll('.funky-slider-handle');

                handles.forEach(function(handle) {
                    expect(handle.getAttribute('aria-valuemax')).toBe('500');
                });
            });
        });

        it('handles have aria-valuenow', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 25,
                maxValue: 75
            });

            return FunkyTests.delay(50).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                expect(minHandle.getAttribute('aria-valuenow')).toBe('25');
                expect(maxHandle.getAttribute('aria-valuenow')).toBe('75');
            });
        });

        it('handles have aria-label', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                expect(minHandle.getAttribute('aria-label')).toBeTruthy();
                expect(maxHandle.getAttribute('aria-label')).toBeTruthy();
            });
        });

    });

    describe('Style Consistency', function() {

        it('track has correct styles', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var track = container.querySelector('.funky-slider-track');
                var styles = Visual.snapshotStyles(track);

                // Track may have relative or absolute positioning depending on implementation
                expect(styles.position === 'relative' || styles.position === 'absolute').toBe(true);
            });
        });

        it('handles are visible', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var handles = container.querySelectorAll('.funky-slider-handle');

                handles.forEach(function(handle) {
                    var styles = Visual.snapshotStyles(handle);
                    expect(styles.display).not.toBe('none');
                    expect(styles.visibility).not.toBe('hidden');
                });
            });
        });

        it('handles have absolute positioning', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var handles = container.querySelectorAll('.funky-slider-handle');

                handles.forEach(function(handle) {
                    var styles = Visual.snapshotStyles(handle);
                    expect(styles.position).toBe('absolute');
                });
            });
        });

        it('range has absolute positioning', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100
            });

            return FunkyTests.delay(50).then(function() {
                var range = container.querySelector('.funky-slider-range');
                var styles = Visual.snapshotStyles(range);

                expect(styles.position).toBe('absolute');
            });
        });

    });

    describe('Value Updates', function() {

        it('updates handle positions on setValues', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            return FunkyTests.delay(50).then(function() {
                sliderInstance.setValues(40, 60);

                return FunkyTests.delay(50);
            }).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                expect(minHandle.style.left).toBe('40%');
                expect(maxHandle.style.left).toBe('60%');
            });
        });

        it('updates range on setValues', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            return FunkyTests.delay(50).then(function() {
                sliderInstance.setValues(10, 90);

                return FunkyTests.delay(50);
            }).then(function() {
                var range = container.querySelector('.funky-slider-range');

                expect(range.style.left).toBe('10%');
                expect(range.style.width).toBe('80%');
            });
        });

        it('updates aria-valuenow on value change', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0
            });

            return FunkyTests.delay(50).then(function() {
                sliderInstance.setValues(55, null);

                return FunkyTests.delay(50);
            }).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');
                expect(minHandle.getAttribute('aria-valuenow')).toBe('55');
            });
        });

    });

    describe('Edge Cases', function() {

        it('handles at min position', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 50
            });

            return FunkyTests.delay(50).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');
                expect(minHandle.style.left).toBe('0%');
            });
        });

        it('handles at max position', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 50,
                maxValue: 100
            });

            return FunkyTests.delay(50).then(function() {
                var maxHandle = container.querySelector('.funky-slider-handle-max');
                expect(maxHandle.style.left).toBe('100%');
            });
        });

        it('handles at same position', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 50,
                maxValue: 50
            });

            return FunkyTests.delay(50).then(function() {
                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                expect(minHandle.style.left).toBe('50%');
                expect(maxHandle.style.left).toBe('50%');
            });
        });

    });

    describe('Custom Formatting', function() {

        it('formats currency values', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 1000,
                minValue: 250,
                formatValue: function(val) { return '$' + val.toLocaleString(); }
            });

            return FunkyTests.delay(50).then(function() {
                var minTooltip = container.querySelector('.funky-slider-handle-min .funky-slider-tooltip');
                expect(minTooltip.textContent).toBe('$250');
            });
        });

        it('formats percentage values', function() {
            var container = document.getElementById('visual-slider-container');
            sliderInstance = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 75,
                formatValue: function(val) { return val + '%'; }
            });

            return FunkyTests.delay(50).then(function() {
                var minTooltip = container.querySelector('.funky-slider-handle-min .funky-slider-tooltip');
                expect(minTooltip.textContent).toBe('75%');
            });
        });

    });

});
