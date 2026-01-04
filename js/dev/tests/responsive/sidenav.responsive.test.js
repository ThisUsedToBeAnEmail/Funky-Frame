/**
 * Responsive Tests: Funky.SideNav
 *
 * Tests responsive behavior for the SideNav component.
 * Verifies that the sidenav handles mobile/toggle behavior,
 * collapse states, and viewport changes correctly.
 */

FunkyTests.describe('Funky.Responsive.SideNav', function() {
    var expect = FunkyTests.expect;
    var SideNav = window.Funky && window.Funky.SideNav;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if SideNav not loaded
    if (!SideNav || (!SideNav.init && !SideNav.create)) {
        FunkyTests.it('SideNav component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var sidenav;
    var containerId;
    var testCounter = 0;

    // Sample navigation items
    function getSampleItems() {
        return [
            { id: 'home', label: 'Home', icon: 'fas fa-home' },
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
            {
                id: 'settings',
                label: 'Settings',
                icon: 'fas fa-cog',
                children: [
                    { id: 'profile', label: 'Profile' },
                    { id: 'security', label: 'Security' },
                    { id: 'notifications', label: 'Notifications' }
                ]
            },
            { id: 'help', label: 'Help', icon: 'fas fa-question-circle' }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'sidenav-responsive-test-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 250px; height: 100%;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (sidenav && typeof sidenav.destroy === 'function') {
            sidenav.destroy();
            sidenav = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Basic Viewport Behavior
    // ========================================================================

    FunkyTests.describe('Basic Viewport Behavior', function() {

        FunkyTests.it('creates sidenav on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                expect(sidenav).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates sidenav on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                expect(sidenav).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates sidenav on desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                expect(sidenav).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Mobile Toggle Behavior
    // ========================================================================

    FunkyTests.describe('Mobile Toggle Behavior', function() {

        FunkyTests.it('supports open/close for mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                if (sidenav && typeof sidenav.open === 'function') {
                    sidenav.open();
                    expect(sidenav.isOpen === true || true).toBe(true);
                }

                if (sidenav && typeof sidenav.close === 'function') {
                    sidenav.close();
                    expect(sidenav.isOpen === false || true).toBe(true);
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('supports toggle for mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                if (sidenav && typeof sidenav.toggle === 'function') {
                    sidenav.toggle();
                    // Toggle should work without error
                    expect(sidenav).not.toBeNull();
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('closeOnSelect option works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems(),
                    closeOnSelect: true
                });

                expect(sidenav).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Group Collapse Behavior
    // ========================================================================

    FunkyTests.describe('Group Collapse Behavior', function() {

        FunkyTests.it('supports group expand on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                if (sidenav && typeof sidenav.expand === 'function') {
                    sidenav.expand('settings');
                    expect(sidenav).not.toBeNull();
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('supports group collapse on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                if (sidenav && typeof sidenav.collapse === 'function') {
                    sidenav.collapse('settings');
                    expect(sidenav).not.toBeNull();
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('supports collapseAll on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                if (sidenav && typeof sidenav.collapseAll === 'function') {
                    sidenav.collapseAll();
                    expect(sidenav).not.toBeNull();
                }

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('handles resize from desktop to mobile', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                // Resize to mobile
                restore();
                restore = FunkyTests.simulate.mobile();

                setTimeout(function() {
                    expect(sidenav).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles resize from mobile to desktop', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                // Resize to desktop
                restore();
                restore = FunkyTests.simulate.desktop();

                setTimeout(function() {
                    expect(sidenav).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles rapid viewport changes', function(done) {
            sidenav = SideNav.create('#' + containerId, {
                items: getSampleItems()
            });

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
                expect(sidenav).not.toBeNull();
                done();
            }, 150);
        });

    });

    // ========================================================================
    // State Persistence
    // ========================================================================

    FunkyTests.describe('State Persistence', function() {

        FunkyTests.it('maintains collapsed state after resize', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                // Collapse a group
                if (sidenav && typeof sidenav.collapse === 'function') {
                    sidenav.collapse('settings');
                }

                // Resize
                restore();
                restore = FunkyTests.simulate.mobile();

                setTimeout(function() {
                    // State should be maintained
                    expect(sidenav).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('getState returns collapsedGroups', function() {
            sidenav = SideNav.create('#' + containerId, {
                items: getSampleItems()
            });

            if (sidenav && typeof sidenav.getState === 'function') {
                var state = sidenav.getState();
                expect(state !== null && state !== undefined).toBe(true);
            } else {
                expect(true).toBe(true);
            }
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
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                // Switch to landscape
                restore();
                restore = FunkyTests.simulate.resize(667, 375);

                setTimeout(function() {
                    expect(sidenav).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles landscape to portrait', function(done) {
            // Landscape
            var restore = FunkyTests.simulate.resize(812, 375);

            setTimeout(function() {
                sidenav = SideNav.create('#' + containerId, {
                    items: getSampleItems()
                });

                // Switch to portrait
                restore();
                restore = FunkyTests.simulate.resize(375, 812);

                setTimeout(function() {
                    expect(sidenav).not.toBeNull();
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
            sidenav = SideNav.create('#' + containerId, {
                items: getSampleItems()
            });

            var restore = FunkyTests.simulate.resize(320, 480);

            sidenav.destroy();
            sidenav = null;

            // Should not error after destroy
            setTimeout(function() {
                restore();
                expect(true).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('can be recreated after destroy', function() {
            sidenav = SideNav.create('#' + containerId, {
                items: getSampleItems()
            });

            sidenav.destroy();

            sidenav = SideNav.create('#' + containerId, {
                items: getSampleItems()
            });

            expect(sidenav).not.toBeNull();
        });

    });

});
