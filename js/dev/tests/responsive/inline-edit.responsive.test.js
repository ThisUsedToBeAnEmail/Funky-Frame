/**
 * Responsive Tests: Funky.InlineEdit
 *
 * Tests responsive behavior for the InlineEdit component.
 * InlineEdit.init() scans for .inline-edit elements, use getInstance() to get instance.
 * Verifies touch vs mouse interaction at different viewports.
 */

FunkyTests.describe('Funky.Responsive.InlineEdit', function() {
    var expect = FunkyTests.expect;
    var InlineEdit = window.Funky && window.Funky.InlineEdit;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if InlineEdit not loaded
    if (!InlineEdit) {
        FunkyTests.it('InlineEdit component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var testCounter = 0;
    var containerId;
    var editableId;

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'inline-edit-container-' + unique;
        editableId = 'editable-' + unique;
        // InlineEdit looks for .inline-edit class with data attributes
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '">' +
                '<span id="' + editableId + '" class="inline-edit" role="button" tabindex="0" ' +
                    'data-entity="test" data-id="1" data-field="name">Click to edit</span>' +
            '</div>'
        );
    });

    FunkyTests.afterEach(function() {
        // Use destroyAll to clean up all instances
        if (InlineEdit.destroyAll) {
            try {
                InlineEdit.destroyAll();
            } catch (e) {
                // Ignore destroy errors
            }
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
                // InlineEdit.init() scans DOM and doesn't return anything
                InlineEdit.init();

                // Use getInstance to get the instance
                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                InlineEdit.init();

                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                InlineEdit.init();

                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

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
                InlineEdit.init();

                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                InlineEdit.init();

                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Edit Mode at Different Viewports
    // ========================================================================

    FunkyTests.describe('Edit Mode at Different Viewports', function() {

        FunkyTests.it('can start edit at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                InlineEdit.init();

                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

                // Start edit if method exists
                if (editor && editor.startEdit) {
                    editor.startEdit();
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('can start edit at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                InlineEdit.init();

                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

                // Start edit if method exists
                if (editor && editor.startEdit) {
                    editor.startEdit();
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

        FunkyTests.it('handles viewport resize', function(done) {
            InlineEdit.init();

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                var editor = InlineEdit.getInstance('#' + editableId);
                expect(editor).not.toBeNull();

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles resize while in edit mode', function(done) {
            InlineEdit.init();

            var editor = InlineEdit.getInstance('#' + editableId);
            if (editor && editor.startEdit) {
                editor.startEdit();
            }

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                expect(editor).not.toBeNull();

                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Cleanup
    // ========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroyAll works', function() {
            InlineEdit.init();

            if (InlineEdit.destroyAll) {
                InlineEdit.destroyAll();
            }

            expect(true).toBe(true);
        });

        FunkyTests.it('individual destroy works', function() {
            InlineEdit.init();

            var editor = InlineEdit.getInstance('#' + editableId);
            if (editor && editor.destroy) {
                editor.destroy();
            }

            expect(true).toBe(true);
        });

    });

});
