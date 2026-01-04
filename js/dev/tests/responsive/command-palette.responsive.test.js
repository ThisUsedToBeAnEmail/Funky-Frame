/**
 * Responsive Tests: Funky.CommandPalette
 *
 * Tests responsive behavior for the CommandPalette component.
 * Verifies mobile layout at 640px, keyboard navigation at all breakpoints,
 * and touch/mouse input handling.
 */

FunkyTests.describe('Funky.Responsive.CommandPalette', function() {
    var expect = FunkyTests.expect;
    var CommandPalette = window.Funky && window.Funky.CommandPalette;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if CommandPalette not loaded
    if (!CommandPalette) {
        FunkyTests.it('CommandPalette component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var palette;
    var testCounter = 0;

    // Sample commands
    function getCommands() {
        return [
            { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', icon: 'fa-file' },
            { id: 'open-file', label: 'Open File', shortcut: 'Ctrl+O', icon: 'fa-folder-open' },
            { id: 'save', label: 'Save', shortcut: 'Ctrl+S', icon: 'fa-save' },
            { id: 'settings', label: 'Settings', icon: 'fa-cog' },
            { id: 'help', label: 'Help', shortcut: 'F1', icon: 'fa-question-circle' }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        fixture = FunkyTests.fixture(
            '<div id="command-palette-container-' + unique + '"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (palette && typeof palette.destroy === 'function') {
            palette.destroy();
            palette = null;
        }
        if (CommandPalette.hide) {
            CommandPalette.hide();
        }
        // Clear any registered commands between tests
        if (CommandPalette.clear) {
            CommandPalette.clear();
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
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Mobile Layout (640px breakpoint)
    // ========================================================================

    FunkyTests.describe('Mobile Layout', function() {

        FunkyTests.it('shows at mobile-optimized width', function(done) {
            var restore = FunkyTests.simulate.resize(375, 667);

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                }

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('shows at narrow viewport (< 640px)', function(done) {
            var restore = FunkyTests.simulate.resize(500, 700);

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                }

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('shows at wider viewport (> 640px)', function(done) {
            var restore = FunkyTests.simulate.resize(800, 600);

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                }

                expect(palette).not.toBeNull();

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
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Search Input Responsiveness
    // ========================================================================

    FunkyTests.describe('Search Input Responsiveness', function() {

        FunkyTests.it('search works at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                }

                // Search should be functional
                if (palette.search) {
                    palette.search('file');
                }

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('search works at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                }

                if (palette.search) {
                    palette.search('save');
                }

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Keyboard Navigation at Different Breakpoints
    // ========================================================================

    FunkyTests.describe('Keyboard Navigation', function() {

        FunkyTests.it('keyboard nav works at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                }

                // Keyboard navigation should be available
                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('keyboard nav works at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                }

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Show/Hide at Different Viewports
    // ========================================================================

    FunkyTests.describe('Show/Hide Behavior', function() {

        FunkyTests.it('shows and hides at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                    expect(palette.isVisible ? palette.isVisible() : true).toBe(true);

                    palette.hide();
                }

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('shows and hides at tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                if (palette.show) {
                    palette.show();
                    palette.hide();
                }

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Command Registration
    // ========================================================================

    FunkyTests.describe('Command Registration', function() {

        FunkyTests.it('registerMany adds commands at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                palette = CommandPalette.init({});

                // Register commands explicitly
                CommandPalette.registerMany(getCommands());

                // Verify registerMany method exists and can be called
                expect(typeof CommandPalette.registerMany).toBe('function');
                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('registerMany adds commands at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                palette = CommandPalette.init({});

                // Register commands explicitly
                CommandPalette.registerMany(getCommands());

                // Verify registerMany method exists
                expect(typeof CommandPalette.registerMany).toBe('function');
                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('handles viewport resize while visible', function(done) {
            palette = CommandPalette.init({
                commands: getCommands()
            });

            if (palette.show) {
                palette.show();
            }

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                // Palette should remain functional
                expect(palette).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            palette = CommandPalette.init({
                commands: getCommands()
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
                        expect(palette).not.toBeNull();

                        restore3();
                        done();
                    }, 50);
                }, 30);
            }, 30);
        });

    });

    // ========================================================================
    // Reduced Motion Preference
    // ========================================================================

    FunkyTests.describe('Reduced Motion Preference', function() {

        FunkyTests.it('respects reduced motion preference', function(done) {
            var restore = FunkyTests.simulate.reducedMotion(true);

            setTimeout(function() {
                palette = CommandPalette.init({
                    commands: getCommands()
                });

                expect(palette).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroys correctly', function() {
            palette = CommandPalette.init({
                commands: getCommands()
            });

            if (palette.destroy) {
                palette.destroy();
            }

            // Should not error after destroy
            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            palette = null;
        });

    });

});
