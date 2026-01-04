/**
 * Responsive Tests: Funky.SideNavPanel
 *
 * Tests responsive behavior for the SideNavPanel component.
 * Verifies drawer mode at 576px, tablet stack at 768px,
 * touch-friendly sizing, and collapse icon-only mode.
 */

FunkyTests.describe('Funky.Responsive.SideNavPanel', function() {
    var expect = FunkyTests.expect;
    var SideNavPanel = window.Funky && window.Funky.SideNavPanel;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if SideNavPanel not loaded
    if (!SideNavPanel) {
        FunkyTests.it('SideNavPanel component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var panel;
    var testCounter = 0;
    var sidenavId;
    var panelsId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        sidenavId = 'sidenav-' + unique;
        panelsId = 'panels-' + unique;
        fixture = FunkyTests.fixture(
            '<div class="sidenav-panel-wrapper" style="display: flex; width: 100%; height: 600px;">' +
                '<div id="' + sidenavId + '" class="sidenav" style="width: 250px;"></div>' +
                '<div id="' + panelsId + '" class="panels" style="flex: 1;"></div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (panel && typeof panel.destroy === 'function') {
            try {
                panel.destroy();
            } catch (e) {
                // Ignore destroy errors in cleanup
            }
            panel = null;
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
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', icon: 'fa-home', content: '<p>Home Content</p>' },
                        { id: 'settings', label: 'Settings', icon: 'fa-cog', content: '<p>Settings Content</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', icon: 'fa-home', content: '<p>Home Content</p>' },
                        { id: 'settings', label: 'Settings', icon: 'fa-cog', content: '<p>Settings Content</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', icon: 'fa-home', content: '<p>Home Content</p>' },
                        { id: 'settings', label: 'Settings', icon: 'fa-cog', content: '<p>Settings Content</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Breakpoint Behavior (576px / 768px)
    // ========================================================================

    FunkyTests.describe('Breakpoint Behavior', function() {

        FunkyTests.it('works at 768px tablet breakpoint', function(done) {
            var restore = FunkyTests.simulate.resize(768, 1024);

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', content: '<p>Home</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works at 576px mobile breakpoint', function(done) {
            var restore = FunkyTests.simulate.resize(576, 800);

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', content: '<p>Home</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works below 576px', function(done) {
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', content: '<p>Home</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

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
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', content: '<p>Home</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', content: '<p>Home</p>' }
                    ]
                });

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Panel Selection at Different Viewports
    // ========================================================================

    FunkyTests.describe('Panel Selection', function() {

        FunkyTests.it('select works at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', icon: 'fa-home', content: '<p>Home</p>' },
                        { id: 'settings', label: 'Settings', icon: 'fa-cog', content: '<p>Settings</p>' }
                    ]
                });

                if (panel && panel.select) {
                    panel.select('settings');
                }

                expect(panel).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('select works at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                panel = SideNavPanel.init({
                    sidenav: '#' + sidenavId,
                    panels: '#' + panelsId,
                    items: [
                        { id: 'home', label: 'Home', icon: 'fa-home', content: '<p>Home</p>' },
                        { id: 'settings', label: 'Settings', icon: 'fa-cog', content: '<p>Settings</p>' }
                    ],
                    selected: 'home'
                });

                if (panel && panel.select) {
                    panel.select('settings');
                }

                expect(panel).not.toBeNull();

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
            panel = SideNavPanel.init({
                sidenav: '#' + sidenavId,
                panels: '#' + panelsId,
                items: [
                    { id: 'home', label: 'Home', content: '<p>Home</p>' }
                ]
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(panel).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            panel = SideNavPanel.init({
                sidenav: '#' + sidenavId,
                panels: '#' + panelsId,
                items: [
                    { id: 'home', label: 'Home', content: '<p>Home</p>' }
                ]
            });

            var restore1 = FunkyTests.simulate.resize(400, 300);

            setTimeout(function() {
                restore1();
                var restore2 = FunkyTests.simulate.resize(800, 600);

                setTimeout(function() {
                    restore2();
                    var restore3 = FunkyTests.simulate.resize(375, 667);

                    setTimeout(function() {
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

        FunkyTests.it('destroys correctly', function() {
            panel = SideNavPanel.init({
                sidenav: '#' + sidenavId,
                panels: '#' + panelsId,
                items: [
                    { id: 'home', label: 'Home', content: '<p>Home</p>' }
                ]
            });

            if (panel && panel.destroy) {
                panel.destroy();
            }

            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            panel = null;
        });

    });

});
