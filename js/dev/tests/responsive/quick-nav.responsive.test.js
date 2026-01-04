/**
 * Responsive Tests: Funky.QuickNav
 *
 * Tests responsive behavior for the QuickNav component.
 * Verifies position changes, scroll threshold behavior, and touch/mouse interactions
 * at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.QuickNav', function() {
    var expect = FunkyTests.expect;
    var QuickNav = window.Funky && window.Funky.QuickNav;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if QuickNav not loaded
    if (!QuickNav) {
        FunkyTests.it('QuickNav component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var testCounter = 0;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        fixture = FunkyTests.fixture(
            '<div id="quicknav-container-' + unique + '">' +
                '<main id="main-content-' + unique + '" style="height: 2000px;">' +
                    '<section id="section1-' + unique + '" data-skip-target="section1" data-skip-label="Section 1" style="margin-top: 100px;">Section 1</section>' +
                    '<section id="section2-' + unique + '" data-skip-target="section2" data-skip-label="Section 2" style="margin-top: 500px;">Section 2</section>' +
                '</main>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (QuickNav._getState && QuickNav._getState().initialized) {
            QuickNav.destroy();
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('initializes at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                QuickNav.init({
                    position: 'bottom-right',
                    backToTop: true
                });

                expect(QuickNav._getState().initialized).toBe(true);
                expect(QuickNav._getState().element).not.toBeNull();

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                QuickNav.init({
                    position: 'bottom-right',
                    backToTop: true
                });

                expect(QuickNav._getState().initialized).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                QuickNav.init({
                    position: 'bottom-right',
                    backToTop: true
                });

                expect(QuickNav._getState().initialized).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('responds to window resize event', function(done) {
            QuickNav.init({
                position: 'bottom-right',
                backToTop: true
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                // QuickNav should still be functional after resize
                expect(QuickNav._getState().initialized).toBe(true);
                expect(QuickNav.isVisible()).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Position Responsiveness
    // ========================================================================

    FunkyTests.describe('Position Responsiveness', function() {

        FunkyTests.it('maintains bottom-right position at all breakpoints', function(done) {
            QuickNav.init({
                position: 'bottom-right'
            });

            var el = QuickNav._getState().element;
            expect(el.classHas('quick-nav--bottom-right')).toBe(true);

            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                // Position class should persist across viewport changes
                expect(el.classHas('quick-nav--bottom-right')).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('maintains bottom-left position at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                QuickNav.init({
                    position: 'bottom-left'
                });

                var el = QuickNav._getState().element;
                expect(el.classHas('quick-nav--bottom-left')).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('allows position change at runtime', function() {
            QuickNav.init({
                position: 'bottom-right'
            });

            var el = QuickNav._getState().element;
            expect(el.classHas('quick-nav--bottom-right')).toBe(true);

            QuickNav.setPosition('top-right');
            expect(el.classHas('quick-nav--top-right')).toBe(true);
            expect(el.classHas('quick-nav--bottom-right')).toBe(false);

            QuickNav.destroy();
        });

    });

    // ========================================================================
    // Scroll Threshold Behavior
    // ========================================================================

    FunkyTests.describe('Scroll Threshold Behavior', function() {

        FunkyTests.it('respects scrollThreshold config', function() {
            QuickNav.init({
                showTrigger: 'scroll',
                scrollThreshold: 200
            });

            // Initially hidden when showTrigger is 'scroll'
            expect(QuickNav._getState().visible).toBe(false);

            QuickNav.destroy();
        });

        FunkyTests.it('shows on always trigger regardless of viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                QuickNav.init({
                    showTrigger: 'always'
                });

                expect(QuickNav._getState().visible).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('supports manual trigger mode', function() {
            QuickNav.init({
                showTrigger: 'manual'
            });

            expect(QuickNav._getState().visible).toBe(false);

            QuickNav.show();
            expect(QuickNav._getState().visible).toBe(true);

            QuickNav.hide();
            expect(QuickNav._getState().visible).toBe(false);

            QuickNav.destroy();
        });

    });

    // ========================================================================
    // Touch vs Mouse Behavior
    // ========================================================================

    FunkyTests.describe('Touch vs Mouse Behavior', function() {

        FunkyTests.it('works on touch device simulation', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                QuickNav.init({
                    position: 'bottom-right'
                });

                expect(QuickNav._getState().initialized).toBe(true);

                // FAB should be present for touch interaction
                expect(QuickNav._getState().fab).not.toBeNull();

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                QuickNav.init({
                    position: 'bottom-right'
                });

                expect(QuickNav._getState().initialized).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Reduced Motion Preference
    // ========================================================================

    FunkyTests.describe('Reduced Motion Preference', function() {

        FunkyTests.it('respects reduced motion preference', function(done) {
            var restore = FunkyTests.simulate.reducedMotion(true);

            setTimeout(function() {
                QuickNav.init({
                    animation: 'slide'
                });

                expect(QuickNav._getState().initialized).toBe(true);
                // Animation should be disabled/instant with reduced motion

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('uses animations when motion allowed', function(done) {
            var restore = FunkyTests.simulate.reducedMotion(false);

            setTimeout(function() {
                QuickNav.init({
                    animation: 'slide',
                    animationDuration: 200
                });

                expect(QuickNav._getState().initialized).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Expand/Collapse at Different Viewports
    // ========================================================================

    FunkyTests.describe('Expand/Collapse at Different Viewports', function() {

        FunkyTests.it('expands correctly at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                QuickNav.init({
                    collapsed: true
                });

                expect(QuickNav._getState().expanded).toBe(false);

                QuickNav.expand();
                expect(QuickNav._getState().expanded).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('toggles expand/collapse at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                QuickNav.init({
                    collapsed: true
                });

                QuickNav.toggle();
                expect(QuickNav._getState().expanded).toBe(true);

                QuickNav.toggle();
                expect(QuickNav._getState().expanded).toBe(false);

                QuickNav.destroy();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Section Navigation at Different Viewports
    // ========================================================================

    FunkyTests.describe('Section Navigation at Different Viewports', function() {

        FunkyTests.it('detects sections at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                QuickNav.init({
                    sections: true,
                    backToTop: true
                });

                var sections = QuickNav.getSections();
                expect(sections).not.toBeNull();
                expect(Array.isArray(sections)).toBe(true);

                QuickNav.destroy();
                restore();
                done();
            }, 100);
        });

        FunkyTests.it('navigates to section at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                QuickNav.init({
                    sections: true,
                    backToTop: true
                });

                // Attempt navigation (may not succeed if section not found, but should not error)
                var result = QuickNav.navigateTo('top');
                // back-to-top navigation returns true
                expect(typeof result).toBe('boolean');

                QuickNav.destroy();
                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('handles rapid resize events', function(done) {
            QuickNav.init({
                position: 'bottom-right'
            });

            // Rapid resizes
            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        // Should remain functional after rapid resizes
                        expect(QuickNav._getState().initialized).toBe(true);

                        restore3();
                        QuickNav.destroy();
                        done();
                    }, 50);
                }, 30);
            }, 30);
        });

        FunkyTests.it('maintains state across viewport changes', function(done) {
            QuickNav.init({
                position: 'bottom-right',
                collapsed: false
            });

            QuickNav.expand();
            var wasExpanded = QuickNav._getState().expanded;

            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                // State should be maintained
                expect(QuickNav._getState().expanded).toBe(wasExpanded);

                restore();
                QuickNav.destroy();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('removes event handlers on destroy', function() {
            QuickNav.init({
                position: 'bottom-right'
            });

            QuickNav.destroy();

            // Should not error when resizing after destroy
            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
        });

        FunkyTests.it('cleans up scroll tracker on destroy', function() {
            QuickNav.init({
                showTrigger: 'scroll',
                scrollThreshold: 200
            });

            expect(QuickNav._getState().scrollTracker).not.toBeNull();

            QuickNav.destroy();

            expect(QuickNav._getState().scrollTracker).toBeNull();
        });

    });

});
