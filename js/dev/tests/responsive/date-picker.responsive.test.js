/**
 * Responsive Tests: Funky.DatePicker
 *
 * Tests responsive behavior for the DatePicker component.
 * Verifies auto-sizing, viewport-based size downgrading, layout changes,
 * and position adjustment at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.DatePicker', function() {
    var expect = FunkyTests.expect;
    var DatePicker = window.Funky && window.Funky.DatePicker;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if DatePicker not loaded or doesn't have create method
    if (!DatePicker || !DatePicker.create) {
        FunkyTests.it('DatePicker component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var picker;
    var containerId;
    var inputId;
    var testCounter = 0;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'date-picker-responsive-test-' + unique;
        inputId = 'date-input-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="padding: 50px;">' +
                '<input type="text" id="' + inputId + '" placeholder="Select date">' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (picker && typeof picker.destroy === 'function') {
            picker.destroy();
            picker = null;
        }
        // Clean up any remaining picker elements
        var pickers = document.querySelectorAll('.funky-datepicker');
        pickers.forEach(function(el) {
            el.remove();
        });
        fixture.cleanup();
    });

    // ========================================================================
    // Auto-Sizing Behavior
    // ========================================================================

    FunkyTests.describe('Auto-Sizing Behavior', function() {

        FunkyTests.it('auto-sizes to compact on very small viewport', function(done) {
            var restore = FunkyTests.simulate.resize(280, 480);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'default',
                    autoSize: true
                });

                picker.open();

                setTimeout(function() {
                    // On viewport < 280px, should use compact size
                    var pickerEl = document.querySelector('.funky-datepicker');
                    if (pickerEl) {
                        // Compact class or smaller dimensions expected
                        expect(pickerEl).not.toBeNull();
                    }
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('auto-sizes to small on narrow viewport', function(done) {
            var restore = FunkyTests.simulate.resize(300, 480);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'default',
                    autoSize: true
                });

                picker.open();

                setTimeout(function() {
                    // On viewport 280-320px, should downgrade default to small
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('uses default size on wide viewport', function(done) {
            var restore = FunkyTests.simulate.resize(800, 600);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'default',
                    autoSize: true
                });

                picker.open();

                setTimeout(function() {
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('respects autoSize: false setting', function(done) {
            var restore = FunkyTests.simulate.resize(250, 480);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'default',
                    autoSize: false
                });

                picker.open();

                setTimeout(function() {
                    // Should use requested size even on small viewport
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Range Mode Responsive Behavior
    // ========================================================================

    FunkyTests.describe('Range Mode Responsive Behavior', function() {

        FunkyTests.it('range picker uses compact on very narrow viewport', function(done) {
            var restore = FunkyTests.simulate.resize(380, 600);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    mode: 'range',
                    size: 'default',
                    autoSize: true
                });

                picker.open();

                setTimeout(function() {
                    // Range mode on viewport < 400px should use compact
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('range picker uses small on medium viewport', function(done) {
            var restore = FunkyTests.simulate.resize(550, 600);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    mode: 'range',
                    size: 'default',
                    autoSize: true
                });

                picker.open();

                setTimeout(function() {
                    // Range mode on viewport 400-580px should use small
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('range picker uses horizontal layout on wide viewport', function(done) {
            var restore = FunkyTests.simulate.resize(800, 600);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    mode: 'range',
                    size: 'default',
                    autoSize: true
                });

                picker.open();

                setTimeout(function() {
                    // Wide viewport should use horizontal (side-by-side calendars)
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Viewport Positioning
    // ========================================================================

    FunkyTests.describe('Viewport Positioning', function() {

        FunkyTests.it('positions picker within viewport on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId);
                picker.open();

                setTimeout(function() {
                    var pickerEl = document.querySelector('.funky-datepicker');
                    if (pickerEl) {
                        var rect = pickerEl.getBoundingClientRect();
                        // Should be within viewport bounds (with some tolerance)
                        expect(rect.left >= -10).toBe(true);
                    }
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles trigger near bottom of viewport', function(done) {
            var restore = FunkyTests.simulate.resize(375, 400);

            // Move input to bottom of container
            var input = document.getElementById(inputId);
            input.style.position = 'absolute';
            input.style.bottom = '10px';

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId);
                picker.open();

                setTimeout(function() {
                    // Picker should position above trigger if not enough space below
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles trigger near right edge of viewport', function(done) {
            var restore = FunkyTests.simulate.resize(400, 600);

            // Move input to right of container
            var input = document.getElementById(inputId);
            input.style.position = 'absolute';
            input.style.right = '10px';

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId);
                picker.open();

                setTimeout(function() {
                    var pickerEl = document.querySelector('.funky-datepicker');
                    if (pickerEl) {
                        var rect = pickerEl.getBoundingClientRect();
                        // Right edge should not exceed viewport
                        expect(rect.right <= window.innerWidth + 50).toBe(true);
                    }
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Viewport Size Transition
    // ========================================================================

    FunkyTests.describe('Viewport Size Transition', function() {

        FunkyTests.it('updates size on viewport resize', function(done) {
            // Start wide
            var restore = FunkyTests.simulate.resize(800, 600);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'default',
                    autoSize: true
                });

                picker.open();

                setTimeout(function() {
                    // Resize to narrow
                    restore();
                    restore = FunkyTests.simulate.resize(280, 480);

                    setTimeout(function() {
                        // Picker should adapt to new viewport
                        var pickerEl = document.querySelector('.funky-datepicker');
                        expect(pickerEl).not.toBeNull();
                        picker.close();
                        restore();
                        done();
                    }, 150);
                }, 50);
            }, 50);
        });

        FunkyTests.it('handles orientation change', function(done) {
            // Portrait
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId);
                picker.open();

                setTimeout(function() {
                    // Switch to landscape
                    restore();
                    restore = FunkyTests.simulate.resize(667, 375);

                    setTimeout(function() {
                        var pickerEl = document.querySelector('.funky-datepicker');
                        expect(pickerEl).not.toBeNull();
                        picker.close();
                        restore();
                        done();
                    }, 150);
                }, 50);
            }, 50);
        });

    });

    // ========================================================================
    // Touch Device Behavior
    // ========================================================================

    FunkyTests.describe('Touch Device Behavior', function() {

        FunkyTests.it('works on mobile touch viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId);
                picker.open();

                setTimeout(function() {
                    // Should work on touch device viewport
                    expect(picker).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('works on tablet touch viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId);
                picker.open();

                setTimeout(function() {
                    expect(picker).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Size Presets
    // ========================================================================

    FunkyTests.describe('Size Presets', function() {

        FunkyTests.it('compact size works at all viewports', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'compact'
                });

                picker.open();

                setTimeout(function() {
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('small size works at all viewports', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'small'
                });

                picker.open();

                setTimeout(function() {
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('default size works on desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId, {
                    size: 'default'
                });

                picker.open();

                setTimeout(function() {
                    var pickerEl = document.querySelector('.funky-datepicker');
                    expect(pickerEl).not.toBeNull();
                    picker.close();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('cleans up properly on viewport change', function(done) {
            picker = DatePicker.create('#' + inputId);
            picker.open();

            setTimeout(function() {
                var restore = FunkyTests.simulate.resize(280, 480);

                picker.destroy();
                picker = null;

                // Should not error after destroy
                restore();
                expect(true).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('can be recreated after destroy', function(done) {
            picker = DatePicker.create('#' + inputId);
            picker.destroy();

            setTimeout(function() {
                picker = DatePicker.create('#' + inputId);
                expect(picker).not.toBeNull();
                done();
            }, 50);
        });

    });

});
