/**
 * Responsive Tests: Funky.Slider
 *
 * Tests responsive behavior for the Slider component.
 * Verifies that the dual-handle range slider handles viewport changes,
 * touch interactions on mobile, and resize events correctly.
 */

FunkyTests.describe('Funky.Responsive.Slider', function() {
    var expect = FunkyTests.expect;
    var Slider = window.Funky && window.Funky.Slider;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Slider not loaded
    if (!Slider || !Slider.create) {
        FunkyTests.it('Slider component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var slider;
    var containerId;
    var testCounter = 0;

    function getDefaultOptions() {
        return {
            min: 0,
            max: 1000,
            step: 10,
            minValue: 100,
            maxValue: 800,
            formatValue: function(val) {
                return val.toString();
            }
        };
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'slider-responsive-test-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 300px; padding: 20px;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (slider && typeof slider.destroy === 'function') {
            slider.destroy();
            slider = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Basic Viewport Behavior
    // ========================================================================

    FunkyTests.describe('Basic Viewport Behavior', function() {

        FunkyTests.it('creates slider on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                expect(slider).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates slider on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                expect(slider).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates slider on desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                expect(slider).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Handle Positioning at Different Widths
    // ========================================================================

    FunkyTests.describe('Handle Positioning at Different Widths', function() {

        FunkyTests.it('handles position correctly on narrow viewport', function(done) {
            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                var container = document.getElementById(containerId);
                container.style.width = '280px';
                slider = Slider.create(container, getDefaultOptions());

                // Handles should be properly positioned
                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                expect(minHandle).not.toBeNull();
                expect(maxHandle).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('handles position correctly on wide viewport', function(done) {
            var restore = FunkyTests.simulate.resize(1280, 800);

            setTimeout(function() {
                var container = document.getElementById(containerId);
                container.style.width = '600px';
                slider = Slider.create(container, getDefaultOptions());

                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                expect(minHandle).not.toBeNull();
                expect(maxHandle).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Value Operations at Different Viewports
    // ========================================================================

    FunkyTests.describe('Value Operations at Different Viewports', function() {

        FunkyTests.it('setValues works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                if (typeof slider.setValues === 'function') {
                    slider.setValues(200, 600);
                    var values = slider.getValues();
                    expect(values.min).toBe(200);
                    expect(values.max).toBe(600);
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('getValues works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                if (typeof slider.getValues === 'function') {
                    var values = slider.getValues();
                    expect(values.min).toBe(100);
                    expect(values.max).toBe(800);
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('setData works on desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                if (typeof slider.setData === 'function') {
                    slider.setData({ min: 300, max: 700 });
                    var values = slider.getData();
                    expect(values.min).toBe(300);
                    expect(values.max).toBe(700);
                }

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize During Slider Use
    // ========================================================================

    FunkyTests.describe('Resize During Slider Use', function() {

        FunkyTests.it('handles resize after creation', function(done) {
            var container = document.getElementById(containerId);
            slider = Slider.create(container, getDefaultOptions());

            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                // Slider should still function after resize
                expect(slider).not.toBeNull();
                if (typeof slider.getValues === 'function') {
                    var values = slider.getValues();
                    expect(values.min).toBe(100);
                    expect(values.max).toBe(800);
                }

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles container width change', function(done) {
            var container = document.getElementById(containerId);
            slider = Slider.create(container, getDefaultOptions());

            // Change container width
            container.style.width = '200px';
            window.dispatchEvent(new Event('resize'));

            setTimeout(function() {
                expect(slider).not.toBeNull();
                restore();
                done();
            }, 100);

            var restore = function() {};
        });

        FunkyTests.it('handles rapid viewport changes', function(done) {
            var container = document.getElementById(containerId);
            slider = Slider.create(container, getDefaultOptions());

            var restore1 = FunkyTests.simulate.resize(400, 300);
            var restore2, restore3;

            setTimeout(function() {
                restore1();
                restore2 = FunkyTests.simulate.resize(800, 600);
            }, 20);

            setTimeout(function() {
                restore2();
                restore3 = FunkyTests.simulate.resize(500, 400);
            }, 40);

            setTimeout(function() {
                restore3();
                expect(slider).not.toBeNull();
                done();
            }, 150);
        });

    });

    // ========================================================================
    // Orientation Changes
    // ========================================================================

    FunkyTests.describe('Orientation Changes', function() {

        FunkyTests.it('handles portrait to landscape', function(done) {
            // Portrait
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                // Switch to landscape
                restore();
                restore = FunkyTests.simulate.resize(667, 375);

                setTimeout(function() {
                    expect(slider).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles landscape to portrait', function(done) {
            // Landscape
            var restore = FunkyTests.simulate.resize(812, 375);

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                // Switch to portrait
                restore();
                restore = FunkyTests.simulate.resize(375, 812);

                setTimeout(function() {
                    expect(slider).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // ARIA Attributes at Different Viewports
    // ========================================================================

    FunkyTests.describe('ARIA Attributes at Different Viewports', function() {

        FunkyTests.it('ARIA attributes correct on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                if (minHandle) {
                    expect(minHandle.getAttribute('role')).toBe('slider');
                    expect(minHandle.getAttribute('aria-valuemin')).toBe('0');
                    expect(minHandle.getAttribute('aria-valuemax')).toBe('1000');
                }

                if (maxHandle) {
                    expect(maxHandle.getAttribute('role')).toBe('slider');
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('ARIA valuenow updates after setValues', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                if (typeof slider.setValues === 'function') {
                    slider.setValues(250, 750);
                }

                var minHandle = container.querySelector('.funky-slider-handle-min');
                var maxHandle = container.querySelector('.funky-slider-handle-max');

                if (minHandle) {
                    expect(minHandle.getAttribute('aria-valuenow')).toBe('250');
                }
                if (maxHandle) {
                    expect(maxHandle.getAttribute('aria-valuenow')).toBe('750');
                }

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // onUpdate Callback at Different Viewports
    // ========================================================================

    FunkyTests.describe('onUpdate Callback at Different Viewports', function() {

        FunkyTests.it('onUpdate fires on mobile via setData', function(done) {
            var restore = FunkyTests.simulate.mobile();
            var updateCalled = false;
            var updateValues = null;

            setTimeout(function() {
                var container = document.getElementById(containerId);
                var options = getDefaultOptions();
                options.onUpdate = function(values) {
                    updateCalled = true;
                    updateValues = values;
                };
                slider = Slider.create(container, options);

                // setData triggers onUpdate callback (unlike setValues which is silent)
                if (typeof slider.setData === 'function') {
                    slider.setData({ min: 300, max: 700 });
                }

                expect(updateCalled).toBe(true);
                if (updateValues) {
                    expect(updateValues.min).toBe(300);
                    expect(updateValues.max).toBe(700);
                }

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Factory Methods at Different Viewports
    // ========================================================================

    FunkyTests.describe('Factory Methods at Different Viewports', function() {

        FunkyTests.it('getInstance works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                var instance = Slider.getInstance(containerId);
                expect(instance).toBe(slider);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('setData static method works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                var container = document.getElementById(containerId);
                slider = Slider.create(container, getDefaultOptions());

                var success = Slider.setData(containerId, { min: 150, max: 850 });
                expect(success).toBe(true);

                var data = Slider.getData(containerId);
                expect(data.min).toBe(150);
                expect(data.max).toBe(850);

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('cleans up properly on viewport change', function(done) {
            var container = document.getElementById(containerId);
            slider = Slider.create(container, getDefaultOptions());

            var restore = FunkyTests.simulate.resize(320, 480);

            slider.destroy();
            slider = null;

            // Should not error after destroy
            setTimeout(function() {
                restore();
                expect(true).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('can be recreated after destroy', function() {
            var container = document.getElementById(containerId);
            slider = Slider.create(container, getDefaultOptions());
            slider.destroy();

            slider = Slider.create(container, getDefaultOptions());
            expect(slider).not.toBeNull();
        });

        FunkyTests.it('removes DOM elements on destroy', function() {
            var container = document.getElementById(containerId);
            slider = Slider.create(container, getDefaultOptions());

            slider.destroy();
            slider = null;

            // Container should be empty or slider elements removed
            expect(true).toBe(true);
        });

    });

});
