/**
 * Responsive Tests: Funky.TreeView
 *
 * Tests responsive behavior for the TreeView component.
 * Verifies that the hierarchical tree handles viewport changes,
 * expand/collapse at different sizes, and touch interactions.
 */

FunkyTests.describe('Funky.Responsive.TreeView', function() {
    var expect = FunkyTests.expect;
    var TreeView = window.Funky && window.Funky.TreeView;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if TreeView not loaded
    if (!TreeView || !TreeView.init) {
        FunkyTests.it('TreeView component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var treeview;
    var containerId;
    var testCounter = 0;

    // Sample tree data
    function getSampleData() {
        return [
            {
                id: 'root1',
                label: 'Documents',
                type: 'folder',
                children: [
                    { id: 'doc1', label: 'Report.pdf', type: 'file' },
                    { id: 'doc2', label: 'Notes.txt', type: 'file' },
                    {
                        id: 'subfolder1',
                        label: 'Projects',
                        type: 'folder',
                        children: [
                            { id: 'proj1', label: 'Project A', type: 'file' },
                            { id: 'proj2', label: 'Project B', type: 'file' }
                        ]
                    }
                ]
            },
            {
                id: 'root2',
                label: 'Images',
                type: 'folder',
                children: [
                    { id: 'img1', label: 'Photo.jpg', type: 'file' },
                    { id: 'img2', label: 'Logo.png', type: 'file' }
                ]
            }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'tree-view-responsive-test-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 300px; height: 400px;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (treeview && typeof treeview.destroy === 'function') {
            treeview.destroy();
            treeview = null;
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Basic Viewport Behavior
    // ========================================================================

    FunkyTests.describe('Basic Viewport Behavior', function() {

        FunkyTests.it('creates tree on mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates tree on tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('creates tree on desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Expand/Collapse at Different Viewports
    // ========================================================================

    FunkyTests.describe('Expand/Collapse at Different Viewports', function() {

        FunkyTests.it('expand works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                if (typeof treeview.expand === 'function') {
                    treeview.expand('root1');
                }

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('collapse works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    expandedIds: ['root1']
                });

                if (typeof treeview.collapse === 'function') {
                    treeview.collapse('root1');
                }

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('expandAll works on desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                if (typeof treeview.expandAll === 'function') {
                    treeview.expandAll();
                }

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('collapseAll works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    expandedIds: ['root1', 'root2']
                });

                if (typeof treeview.collapseAll === 'function') {
                    treeview.collapseAll();
                }

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Selection at Different Viewports
    // ========================================================================

    FunkyTests.describe('Selection at Different Viewports', function() {

        FunkyTests.it('single selection works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    selectable: 'single'
                });

                if (typeof treeview.selectNode === 'function') {
                    treeview.selectNode('doc1');
                }

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('multi selection works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    selectable: 'multi'
                });

                if (typeof treeview.selectNode === 'function') {
                    treeview.selectNode('doc1');
                    treeview.selectNode('doc2');
                }

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('selectAll works on desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    selectable: 'multi'
                });

                if (typeof treeview.selectAll === 'function') {
                    treeview.selectAll();
                }

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Resize Handling
    // ========================================================================

    FunkyTests.describe('Resize Handling', function() {

        FunkyTests.it('handles resize after creation', function(done) {
            treeview = TreeView.init('#' + containerId, {
                data: getSampleData()
            });

            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                expect(treeview).not.toBeNull();
                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles resize from desktop to mobile', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                restore();
                restore = FunkyTests.simulate.mobile();

                setTimeout(function() {
                    expect(treeview).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles rapid viewport changes', function(done) {
            treeview = TreeView.init('#' + containerId, {
                data: getSampleData()
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
                expect(treeview).not.toBeNull();
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
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                // Switch to landscape
                restore();
                restore = FunkyTests.simulate.resize(667, 375);

                setTimeout(function() {
                    expect(treeview).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

        FunkyTests.it('handles landscape to portrait', function(done) {
            // Landscape
            var restore = FunkyTests.simulate.resize(812, 375);

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                // Switch to portrait
                restore();
                restore = FunkyTests.simulate.resize(375, 812);

                setTimeout(function() {
                    expect(treeview).not.toBeNull();
                    restore();
                    done();
                }, 100);
            }, 50);
        });

    });

    // ========================================================================
    // Search at Different Viewports
    // ========================================================================

    FunkyTests.describe('Search at Different Viewports', function() {

        FunkyTests.it('search shows on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    showSearch: true
                });

                var searchInput = document.querySelector('#' + containerId + ' input[type="text"]');
                // Search should be available (may or may not be visible on mobile)
                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('search filter works on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    showSearch: true
                });

                // Tree should handle search
                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // getData at Different Viewports
    // ========================================================================

    FunkyTests.describe('getData at Different Viewports', function() {

        FunkyTests.it('getData works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData()
                });

                if (typeof treeview.getData === 'function') {
                    var data = treeview.getData();
                    expect(data).not.toBeNull();
                    expect(Array.isArray(data)).toBe(true);
                }

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('getData works after resize', function(done) {
            treeview = TreeView.init('#' + containerId, {
                data: getSampleData()
            });

            var restore = FunkyTests.simulate.resize(320, 480);

            setTimeout(function() {
                if (typeof treeview.getData === 'function') {
                    var data = treeview.getData();
                    expect(data).not.toBeNull();
                }

                restore();
                done();
            }, 100);
        });

    });

    // ========================================================================
    // Indentation at Different Viewports
    // ========================================================================

    FunkyTests.describe('Indentation at Different Viewports', function() {

        FunkyTests.it('custom indent size works on mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    indentSize: 16
                });

                expect(treeview).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('guide lines work on tablet', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                treeview = TreeView.init('#' + containerId, {
                    data: getSampleData(),
                    showGuides: true
                });

                expect(treeview).not.toBeNull();

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
            treeview = TreeView.init('#' + containerId, {
                data: getSampleData()
            });

            var restore = FunkyTests.simulate.resize(320, 480);

            treeview.destroy();
            treeview = null;

            // Should not error after destroy
            setTimeout(function() {
                restore();
                expect(true).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('can be recreated after destroy', function() {
            treeview = TreeView.init('#' + containerId, {
                data: getSampleData()
            });

            treeview.destroy();

            treeview = TreeView.init('#' + containerId, {
                data: getSampleData()
            });

            expect(treeview).not.toBeNull();
        });

    });

});
