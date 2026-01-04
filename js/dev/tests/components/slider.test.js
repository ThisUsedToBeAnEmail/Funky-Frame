/**
 * Funky.Slider Tests
 *
 * Tests for the dual-handle range slider component.
 */

describe('Funky.Component.Slider', function() {

    var Slider = Funky.Slider;
    var fixture;
    var container;
    var slider;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="slider-container" style="width: 300px; height: 50px;"></div>'
        );
        container = document.getElementById('slider-container');
    });

    afterEach(function() {
        if (slider) {
            slider.destroy();
            slider = null;
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Slider')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof Slider.create).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Slider.getInstance).toBe('function');
        });

        it('has setData method', function() {
            expect(typeof Slider.setData).toBe('function');
        });

        it('has getData method', function() {
            expect(typeof Slider.getData).toBe('function');
        });

    });

    describe('create()', function() {

        it('creates slider instance', function() {
            slider = Slider.create(container, {});

            expect(slider).toBeDefined();
            expect(typeof slider.getValues).toBe('function');
        });

        it('creates slider DOM elements', function() {
            slider = Slider.create(container, {});

            expect(container.querySelector('.funky-slider')).toBeInDocument();
            expect(container.querySelector('.funky-slider-track')).toBeInDocument();
            expect(container.querySelector('.funky-slider-range')).toBeInDocument();
            expect(container.querySelector('.funky-slider-handle-min')).toBeInDocument();
            expect(container.querySelector('.funky-slider-handle-max')).toBeInDocument();
        });

        it('creates tooltips for handles', function() {
            slider = Slider.create(container, {});

            var minTooltip = container.querySelector('.funky-slider-handle-min .funky-slider-tooltip');
            var maxTooltip = container.querySelector('.funky-slider-handle-max .funky-slider-tooltip');

            expect(minTooltip).toBeInDocument();
            expect(maxTooltip).toBeInDocument();
        });

        it('uses default values when not specified', function() {
            slider = Slider.create(container, {});
            var values = slider.getValues();

            expect(values.min).toBe(0);
            expect(values.max).toBe(1000000);
        });

        it('uses custom min and max range', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100
            });
            var values = slider.getValues();

            expect(values.min).toBe(0);
            expect(values.max).toBe(100);
        });

        it('uses custom initial values', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 25,
                maxValue: 75
            });
            var values = slider.getValues();

            expect(values.min).toBe(25);
            expect(values.max).toBe(75);
        });

    });

    describe('getValues()', function() {

        it('returns object with min and max', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 20,
                maxValue: 80
            });
            var values = slider.getValues();

            expect(typeof values).toBe('object');
            expect(values.min).toBe(20);
            expect(values.max).toBe(80);
        });

    });

    describe('setValues()', function() {

        it('sets min value', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            slider.setValues(30, null);
            var values = slider.getValues();

            expect(values.min).toBe(30);
            expect(values.max).toBe(100);
        });

        it('sets max value', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            slider.setValues(null, 70);
            var values = slider.getValues();

            expect(values.min).toBe(0);
            expect(values.max).toBe(70);
        });

        it('sets both values', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            slider.setValues(25, 75);
            var values = slider.getValues();

            expect(values.min).toBe(25);
            expect(values.max).toBe(75);
        });

        it('clamps values to range', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 50,
                maxValue: 50
            });

            slider.setValues(-50, 200);
            var values = slider.getValues();

            expect(values.min).toBe(0);
            expect(values.max).toBe(100);
        });

        it('respects step option', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                step: 10,
                minValue: 0,
                maxValue: 100
            });

            slider.setValues(23, 77);
            var values = slider.getValues();

            expect(values.min).toBe(20);
            expect(values.max).toBe(80);
        });

    });

    describe('Bindable Interface', function() {

        it('registers instance by container ID', function() {
            slider = Slider.create(container, {});

            var instance = Slider.getInstance('slider-container');
            expect(instance).toBe(slider);
        });

        it('setData sets values via factory', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            Slider.setData('slider-container', { min: 25, max: 75 });
            var values = slider.getValues();

            expect(values.min).toBe(25);
            expect(values.max).toBe(75);
        });

        it('getData gets values via factory', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 30,
                maxValue: 70
            });

            var values = Slider.getData('slider-container');

            expect(values.min).toBe(30);
            expect(values.max).toBe(70);
        });

        it('setData with single number sets min value', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            Slider.setData('slider-container', 50);
            var values = slider.getValues();

            expect(values.min).toBe(50);
        });

        it('returns false for unknown instance', function() {
            var result = Slider.setData('non-existent', { min: 10, max: 90 });
            expect(result).toBe(false);
        });

        it('returns null for unknown instance getData', function() {
            var result = Slider.getData('non-existent');
            expect(result).toBeNull();
        });

    });

    describe('onUpdate callback', function() {

        it('calls onUpdate when values change', function(done) {
            var updateCalled = false;
            var updateData = null;

            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100,
                onUpdate: function(values) {
                    updateCalled = true;
                    updateData = values;
                }
            });

            slider.setValues(25, 75);
            slider.triggerChange();

            setTimeout(function() {
                expect(updateCalled).toBe(true);
                expect(updateData.min).toBe(25);
                expect(updateData.max).toBe(75);
                done();
            }, 50);
        });

    });

    describe('formatValue option', function() {

        it('uses custom format function in tooltips', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 1000,
                minValue: 100,
                maxValue: 500,
                formatValue: function(val) {
                    return '$' + val;
                }
            });

            var minTooltip = container.querySelector('.funky-slider-handle-min .funky-slider-tooltip');
            var maxTooltip = container.querySelector('.funky-slider-handle-max .funky-slider-tooltip');

            expect(minTooltip.textContent).toBe('$100');
            expect(maxTooltip.textContent).toBe('$500');
        });

    });

    describe('Accessibility', function() {

        it('handles have role="slider"', function() {
            slider = Slider.create(container, {});

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var maxHandle = container.querySelector('.funky-slider-handle-max');

            expect(minHandle.getAttribute('role')).toBe('slider');
            expect(maxHandle.getAttribute('role')).toBe('slider');
        });

        it('handles have tabindex for keyboard access', function() {
            slider = Slider.create(container, {});

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var maxHandle = container.querySelector('.funky-slider-handle-max');

            expect(minHandle.getAttribute('tabindex')).toBe('0');
            expect(maxHandle.getAttribute('tabindex')).toBe('0');
        });

        it('handles have aria-valuemin', function() {
            slider = Slider.create(container, {
                min: 10,
                max: 200
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');

            expect(minHandle.getAttribute('aria-valuemin')).toBe('10');
        });

        it('handles have aria-valuemax', function() {
            slider = Slider.create(container, {
                min: 10,
                max: 200
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');

            expect(minHandle.getAttribute('aria-valuemax')).toBe('200');
        });

        it('handles have aria-valuenow', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 25,
                maxValue: 75
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var maxHandle = container.querySelector('.funky-slider-handle-max');

            expect(minHandle.getAttribute('aria-valuenow')).toBe('25');
            expect(maxHandle.getAttribute('aria-valuenow')).toBe('75');
        });

        it('updates aria-valuenow when values change', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 100
            });

            slider.setValues(40, 60);

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var maxHandle = container.querySelector('.funky-slider-handle-max');

            expect(minHandle.getAttribute('aria-valuenow')).toBe('40');
            expect(maxHandle.getAttribute('aria-valuenow')).toBe('60');
        });

        it('handles have aria-label', function() {
            slider = Slider.create(container, {});

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var maxHandle = container.querySelector('.funky-slider-handle-max');

            expect(minHandle.getAttribute('aria-label')).toBe('Minimum value');
            expect(maxHandle.getAttribute('aria-label')).toBe('Maximum value');
        });

        it('uses custom aria labels', function() {
            slider = Slider.create(container, {
                minLabel: 'Start price',
                maxLabel: 'End price'
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var maxHandle = container.querySelector('.funky-slider-handle-max');

            expect(minHandle.getAttribute('aria-label')).toBe('Start price');
            expect(maxHandle.getAttribute('aria-label')).toBe('End price');
        });

    });

    describe('Keyboard navigation', function() {

        it('ArrowRight increases min handle value', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                step: 1,
                minValue: 50,
                maxValue: 100
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            minHandle.dispatchEvent(event);

            expect(slider.getValues().min).toBe(51);
        });

        it('ArrowLeft decreases min handle value', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                step: 1,
                minValue: 50,
                maxValue: 100
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            minHandle.dispatchEvent(event);

            expect(slider.getValues().min).toBe(49);
        });

        it('ArrowUp increases max handle value', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                step: 1,
                minValue: 0,
                maxValue: 50
            });

            var maxHandle = container.querySelector('.funky-slider-handle-max');
            var event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            maxHandle.dispatchEvent(event);

            expect(slider.getValues().max).toBe(51);
        });

        it('ArrowDown decreases max handle value', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                step: 1,
                minValue: 0,
                maxValue: 50
            });

            var maxHandle = container.querySelector('.funky-slider-handle-max');
            var event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            maxHandle.dispatchEvent(event);

            expect(slider.getValues().max).toBe(49);
        });

        it('Home sets handle to minimum', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 50,
                maxValue: 100
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var event = new KeyboardEvent('keydown', { key: 'Home' });
            minHandle.dispatchEvent(event);

            expect(slider.getValues().min).toBe(0);
        });

        it('End sets max handle to maximum', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 50
            });

            var maxHandle = container.querySelector('.funky-slider-handle-max');
            var event = new KeyboardEvent('keydown', { key: 'End' });
            maxHandle.dispatchEvent(event);

            expect(slider.getValues().max).toBe(100);
        });

        it('PageUp makes large increase', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 0,
                maxValue: 50
            });

            var maxHandle = container.querySelector('.funky-slider-handle-max');
            var event = new KeyboardEvent('keydown', { key: 'PageUp' });
            maxHandle.dispatchEvent(event);

            // Large step is (max - min) / 10 = 10
            expect(slider.getValues().max).toBe(60);
        });

        it('PageDown makes large decrease', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                minValue: 50,
                maxValue: 100
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var event = new KeyboardEvent('keydown', { key: 'PageDown' });
            minHandle.dispatchEvent(event);

            // Large step is (max - min) / 10 = 10
            expect(slider.getValues().min).toBe(40);
        });

        it('min handle cannot exceed max handle', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                step: 1,
                minValue: 49,
                maxValue: 50
            });

            var minHandle = container.querySelector('.funky-slider-handle-min');
            var event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            minHandle.dispatchEvent(event);
            minHandle.dispatchEvent(event);

            // Min should stop at max value
            expect(slider.getValues().min).toBe(50);
        });

        it('max handle cannot go below min handle', function() {
            slider = Slider.create(container, {
                min: 0,
                max: 100,
                step: 1,
                minValue: 50,
                maxValue: 51
            });

            var maxHandle = container.querySelector('.funky-slider-handle-max');
            var event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            maxHandle.dispatchEvent(event);
            maxHandle.dispatchEvent(event);

            // Max should stop at min value
            expect(slider.getValues().max).toBe(50);
        });

    });

    describe('destroy()', function() {

        it('clears container content', function() {
            slider = Slider.create(container, {});
            slider.destroy();
            slider = null;

            expect(container.innerHTML).toBe('');
        });

        it('removes instance from registry', function() {
            slider = Slider.create(container, {});
            slider.destroy();
            slider = null;

            // getInstance returns null for non-existent instances (via Registry)
            var instance = Slider.getInstance('slider-container');
            expect(instance).toBeNull();
        });

    });

});
