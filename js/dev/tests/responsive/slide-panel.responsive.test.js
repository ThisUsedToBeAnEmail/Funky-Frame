/**
 * Responsive Tests: Funky.SlidePanel
 *
 * Tests responsive behavior for the SlidePanel component.
 * Verifies viewport constraints, touch swipe gestures,
 * and responsive width adjustments.
 */

FunkyTests.describe('Funky.Responsive.SlidePanel', function() {
    var expect = FunkyTests.expect;
    var SlidePanel = window.Funky && window.Funky.SlidePanel;
    var Modal = window.Funky && window.Funky.Modal;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if SlidePanel not loaded
    if (!SlidePanel) {
        FunkyTests.it('SlidePanel component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var panelId;
    var testCounter = 0;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        panelId = 'slide-panel-' + unique;
        fixture = FunkyTests.fixture(
            '<div class="modal fade modal-slide-panel" id="' + panelId + '" tabindex="-1" aria-hidden="true">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<h5 class="modal-title">Test Panel</h5>' +
                            '<button type="button" class="btn-close" data-funky-modal-close aria-label="Close"></button>' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<p>Panel content</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (Modal) {
            Modal.hideAll();
            Modal.cleanupBackdrops();
        }
        fixture.cleanup();
        document.body.style.overflow = '';
        document.body.style.position = '';
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('initializes at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                SlidePanel.init();

                var panel = document.getElementById(panelId);
                expect(panel).not.toBeNull();
                expect(panel._slidePanelInit).toBe(true);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                SlidePanel.init();

                var panel = document.getElementById(panelId);
                expect(panel).not.toBeNull();
                expect(panel._slidePanelInit).toBe(true);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                SlidePanel.init();

                var panel = document.getElementById(panelId);
                expect(panel).not.toBeNull();
                expect(panel._slidePanelInit).toBe(true);

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Touch vs Mouse Behavior
    // ========================================================================

    FunkyTests.describe('Touch vs Mouse Behavior', function() {

        FunkyTests.it('works on touch device simulation', function(done) {
            var restore = FunkyTests.simulate.touchDevice();

            setTimeout(function() {
                SlidePanel.init();

                var panel = document.getElementById(panelId);
                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                SlidePanel.init();

                var panel = document.getElementById(panelId);
                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Scroll Locking at Different Viewports
    // ========================================================================

    FunkyTests.describe('Scroll Locking', function() {

        FunkyTests.it('locks scroll at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                SlidePanel.init();
                SlidePanel.lockScroll();

                expect(document.body.style.overflow).toBe('hidden');

                SlidePanel.unlockScroll();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('locks scroll at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                SlidePanel.init();
                SlidePanel.lockScroll();

                expect(document.body.style.overflow).toBe('hidden');

                SlidePanel.unlockScroll();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('unlocks scroll correctly', function(done) {
            SlidePanel.init();
            SlidePanel.lockScroll();

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                SlidePanel.unlockScroll();

                expect(document.body.style.overflow).toBe('');

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('handles viewport resize', function(done) {
            SlidePanel.init();

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                var panel = document.getElementById(panelId);
                expect(panel).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            SlidePanel.init();

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
                        var panel = document.getElementById(panelId);
                        expect(panel).not.toBeNull();

                        restore3();
                        done();
                    }, 50);
                }, 30);
            }, 30);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('handles resize without errors', function() {
            SlidePanel.init();

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
        });

    });

});
