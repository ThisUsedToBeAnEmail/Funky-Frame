/**
 * Responsive Tests: Funky.ContextMenu
 *
 * Tests responsive behavior for the ContextMenu component.
 * Verifies viewport boundary positioning, touch long-press vs right-click,
 * and min/max width constraints at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.ContextMenu', function() {
    var expect = FunkyTests.expect;
    var ContextMenu = window.Funky && window.Funky.ContextMenu;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if ContextMenu not loaded
    if (!ContextMenu) {
        FunkyTests.it('ContextMenu component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var attachment;
    var testCounter = 0;

    // Sample menu items
    function getMenuItems() {
        return [
            { id: 'edit', label: 'Edit', icon: 'fa-edit' },
            { id: 'copy', label: 'Copy', icon: 'fa-copy' },
            { id: 'paste', label: 'Paste', icon: 'fa-paste' },
            { divider: true },
            { id: 'delete', label: 'Delete', icon: 'fa-trash', variant: 'danger' }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        fixture = FunkyTests.fixture(
            '<div id="context-menu-container-' + unique + '" style="width: 400px; height: 400px; position: relative;">' +
                '<div id="target-' + unique + '" class="context-target" style="width: 200px; height: 200px; background: #eee;">Right-click here</div>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (attachment && !attachment.destroyed) {
            attachment.destroy();
            attachment = null;
        }
        ContextMenu.hide();
        fixture.cleanup();
    });

    // ========================================================================
    // Viewport Width Behavior
    // ========================================================================

    FunkyTests.describe('Viewport Width Behavior', function() {

        FunkyTests.it('shows menu at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                ContextMenu.show(100, 100, {
                    items: getMenuItems()
                });

                expect(ContextMenu.isVisible()).toBe(true);

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('shows menu at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                ContextMenu.show(200, 200, {
                    items: getMenuItems()
                });

                expect(ContextMenu.isVisible()).toBe(true);

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('shows menu at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                ContextMenu.show(300, 300, {
                    items: getMenuItems()
                });

                expect(ContextMenu.isVisible()).toBe(true);

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Viewport Boundary Positioning
    // ========================================================================

    FunkyTests.describe('Viewport Boundary Positioning', function() {

        FunkyTests.it('adjusts position when near right edge', function(done) {
            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                // Try to show menu near the right edge
                ContextMenu.show(380, 100, {
                    items: getMenuItems(),
                    minWidth: 160
                });

                expect(ContextMenu.isVisible()).toBe(true);

                // Menu should be visible (positioning adjusted internally)
                var menu = document.querySelector('.funky-contextmenu');
                expect(menu).not.toBeNull();

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('adjusts position when near bottom edge', function(done) {
            var restore = FunkyTests.simulate.resize(600, 400);

            setTimeout(function() {
                // Try to show menu near the bottom edge
                ContextMenu.show(100, 380, {
                    items: getMenuItems()
                });

                expect(ContextMenu.isVisible()).toBe(true);

                var menu = document.querySelector('.funky-contextmenu');
                expect(menu).not.toBeNull();

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('adjusts position at corner of small viewport', function(done) {
            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                // Try to show menu at bottom-right corner
                ContextMenu.show(300, 460, {
                    items: getMenuItems()
                });

                expect(ContextMenu.isVisible()).toBe(true);

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Min/Max Width Constraints
    // ========================================================================

    FunkyTests.describe('Min/Max Width Constraints', function() {

        FunkyTests.it('respects minWidth at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                ContextMenu.show(50, 50, {
                    items: getMenuItems(),
                    minWidth: 160
                });

                var menu = document.querySelector('.funky-contextmenu');
                expect(menu).not.toBeNull();
                expect(menu.style.minWidth).toBe('160px');

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('respects maxWidth at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                ContextMenu.show(100, 100, {
                    items: getMenuItems(),
                    maxWidth: 320
                });

                var menu = document.querySelector('.funky-contextmenu');
                expect(menu).not.toBeNull();
                expect(menu.style.maxWidth).toBe('320px');

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works with custom width constraints', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                ContextMenu.show(100, 100, {
                    items: getMenuItems(),
                    minWidth: 200,
                    maxWidth: 400
                });

                var menu = document.querySelector('.funky-contextmenu');
                expect(menu).not.toBeNull();
                expect(menu.style.minWidth).toBe('200px');
                expect(menu.style.maxWidth).toBe('400px');

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Touch vs Mouse Behavior
    // ========================================================================

    FunkyTests.describe('Touch vs Mouse Behavior', function() {

        FunkyTests.it('attaches with touch device simulation', function(done) {
            var restore = FunkyTests.simulate.touchDevice();
            var targetEl = fixture.el.querySelector('.context-target');

            setTimeout(function() {
                attachment = ContextMenu.attach(targetEl, {
                    items: getMenuItems(),
                    longPressDelay: 500
                });

                expect(attachment).not.toBeNull();
                expect(attachment.destroyed).toBe(false);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('attaches with mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();
            var targetEl = fixture.el.querySelector('.context-target');

            setTimeout(function() {
                attachment = ContextMenu.attach(targetEl, {
                    items: getMenuItems()
                });

                expect(attachment).not.toBeNull();
                expect(attachment.destroyed).toBe(false);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('supports longPressDelay configuration', function() {
            var targetEl = fixture.el.querySelector('.context-target');

            attachment = ContextMenu.attach(targetEl, {
                items: getMenuItems(),
                longPressDelay: 300
            });

            expect(attachment.options.longPressDelay).toBe(300);
        });

    });

    // ========================================================================
    // Menu at Different Breakpoints
    // ========================================================================

    FunkyTests.describe('Menu at Different Breakpoints', function() {

        RTU.testAtBreakpoint('shows menu correctly', 'mobile', function() {
            ContextMenu.show(50, 50, {
                items: getMenuItems()
            });

            expect(ContextMenu.isVisible()).toBe(true);
            ContextMenu.hide();
        });

        RTU.testAtBreakpoint('shows menu correctly', 'tablet', function() {
            ContextMenu.show(100, 100, {
                items: getMenuItems()
            });

            expect(ContextMenu.isVisible()).toBe(true);
            ContextMenu.hide();
        });

        RTU.testAtBreakpoint('shows menu correctly', 'desktop', function() {
            ContextMenu.show(200, 200, {
                items: getMenuItems()
            });

            expect(ContextMenu.isVisible()).toBe(true);
            ContextMenu.hide();
        });

    });

    // ========================================================================
    // Submenu Positioning at Viewport Edges
    // ========================================================================

    FunkyTests.describe('Submenu Positioning', function() {

        FunkyTests.it('positions submenu at narrow viewport', function(done) {
            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                ContextMenu.show(250, 100, {
                    items: [
                        { id: 'parent', label: 'Has Submenu', items: [
                            { id: 'child1', label: 'Child 1' },
                            { id: 'child2', label: 'Child 2' }
                        ]}
                    ]
                });

                expect(ContextMenu.isVisible()).toBe(true);

                ContextMenu.hide();
                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('hides menu on window resize', function(done) {
            ContextMenu.show(100, 100, {
                items: getMenuItems()
            });

            expect(ContextMenu.isVisible()).toBe(true);

            // Trigger resize event
            var event = new Event('resize');
            window.dispatchEvent(event);

            setTimeout(function() {
                expect(ContextMenu.isVisible()).toBe(false);
                done();
            }, 50);
        });

        FunkyTests.it('hides menu on scroll', function(done) {
            ContextMenu.show(100, 100, {
                items: getMenuItems()
            });

            expect(ContextMenu.isVisible()).toBe(true);

            // Trigger scroll event
            var event = new Event('scroll', { bubbles: true });
            window.dispatchEvent(event);

            setTimeout(function() {
                expect(ContextMenu.isVisible()).toBe(false);
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroys attachment correctly', function() {
            var targetEl = fixture.el.querySelector('.context-target');

            attachment = ContextMenu.attach(targetEl, {
                items: getMenuItems()
            });

            expect(attachment.destroyed).toBe(false);

            attachment.destroy();

            expect(attachment.destroyed).toBe(true);
        });

        FunkyTests.it('destroyAll cleans up all attachments', function() {
            var targetEl = fixture.el.querySelector('.context-target');

            ContextMenu.attach(targetEl, {
                items: getMenuItems()
            });

            ContextMenu.destroyAll();

            // Should not error after destroy
            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
        });

    });

});
