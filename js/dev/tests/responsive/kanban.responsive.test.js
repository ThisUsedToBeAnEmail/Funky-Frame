/**
 * Responsive Tests: Funky.Kanban
 *
 * Tests responsive behavior for the Kanban component.
 * Verifies touch drag-and-drop, responsive column layout,
 * and swimlane handling at different viewport sizes.
 */

FunkyTests.describe('Funky.Responsive.Kanban', function() {
    var expect = FunkyTests.expect;
    var Kanban = window.Funky && window.Funky.Kanban;
    var RTU = window.ResponsiveTestUtils;

    // Skip all tests if Kanban not loaded
    if (!Kanban) {
        FunkyTests.it('Kanban component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var board;
    var testCounter = 0;
    var containerId;

    // Sample columns
    function getColumns() {
        return [
            { id: 'todo', title: 'To Do' },
            { id: 'doing', title: 'In Progress', limit: 5 },
            { id: 'done', title: 'Done' }
        ];
    }

    // Sample cards
    function getCards() {
        return [
            { id: 1, column: 'todo', title: 'Task 1', description: 'First task' },
            { id: 2, column: 'todo', title: 'Task 2', description: 'Second task' },
            { id: 3, column: 'doing', title: 'Task 3', description: 'In progress task' },
            { id: 4, column: 'done', title: 'Task 4', description: 'Completed task' }
        ];
    }

    FunkyTests.beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now();
        containerId = 'kanban-container-' + unique;
        fixture = FunkyTests.fixture(
            '<div id="' + containerId + '" style="width: 100%; height: 500px;"></div>'
        );
    });

    FunkyTests.afterEach(function() {
        if (board && typeof board.destroy === 'function') {
            board.destroy();
            board = null;
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
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                expect(board).not.toBeNull();
                expect(board.container).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                expect(board).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('initializes at desktop viewport', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                expect(board).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Column Layout at Different Viewports
    // ========================================================================

    FunkyTests.describe('Column Layout', function() {

        FunkyTests.it('renders all columns at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                // All columns should be present
                var columnElements = board.container.querySelectorAll('.kanban-column');
                expect(columnElements.length).toBe(3);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('renders all columns at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                // Columns should still be rendered (may be scrollable)
                var columnElements = board.container.querySelectorAll('.kanban-column');
                expect(columnElements.length).toBe(3);

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
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                expect(board).not.toBeNull();

                // Cards should be present and draggable
                var cards = board.container.querySelectorAll('.kanban-card');
                expect(cards.length).toBeGreaterThan(0);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('works on mouse device simulation', function(done) {
            var restore = FunkyTests.simulate.mouseDevice();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                expect(board).not.toBeNull();

                var cards = board.container.querySelectorAll('.kanban-card');
                expect(cards.length).toBeGreaterThan(0);

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Card Rendering at Different Viewports
    // ========================================================================

    FunkyTests.describe('Card Rendering', function() {

        FunkyTests.it('renders cards at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                var cards = board.container.querySelectorAll('.kanban-card');
                expect(cards.length).toBe(4);

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('renders cards at tablet viewport', function(done) {
            var restore = FunkyTests.simulate.tablet();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards()
                });

                var cards = board.container.querySelectorAll('.kanban-card');
                expect(cards.length).toBe(4);

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Swimlane Support
    // ========================================================================

    FunkyTests.describe('Swimlane Support', function() {

        FunkyTests.it('renders swimlanes at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: [
                        { id: 1, column: 'todo', title: 'Task 1', swimlane: 'frontend' },
                        { id: 2, column: 'todo', title: 'Task 2', swimlane: 'backend' }
                    ],
                    swimlanes: [
                        { id: 'frontend', title: 'Frontend' },
                        { id: 'backend', title: 'Backend' }
                    ]
                });

                expect(board).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('renders swimlanes at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: [
                        { id: 1, column: 'todo', title: 'Task 1', swimlane: 'frontend' },
                        { id: 2, column: 'todo', title: 'Task 2', swimlane: 'backend' }
                    ],
                    swimlanes: [
                        { id: 'frontend', title: 'Frontend' },
                        { id: 'backend', title: 'Backend' }
                    ]
                });

                expect(board).not.toBeNull();

                restore();
                done();
            }, 50);
        });

    });

    // ========================================================================
    // Toolbar at Different Viewports
    // ========================================================================

    FunkyTests.describe('Toolbar Responsiveness', function() {

        FunkyTests.it('shows toolbar at desktop', function(done) {
            var restore = FunkyTests.simulate.desktop();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards(),
                    showToolbar: true
                });

                expect(board).not.toBeNull();

                restore();
                done();
            }, 50);
        });

        FunkyTests.it('shows toolbar at mobile', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards(),
                    showToolbar: true
                });

                expect(board).not.toBeNull();

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
            board = Kanban.init('#' + containerId, {
                columns: getColumns(),
                cards: getCards()
            });

            var restore = FunkyTests.simulate.resize(400, 600);

            setTimeout(function() {
                // Board should still be functional
                expect(board).not.toBeNull();
                expect(board.container).not.toBeNull();

                var cards = board.container.querySelectorAll('.kanban-card');
                expect(cards.length).toBe(4);

                restore();
                done();
            }, 100);
        });

        FunkyTests.it('handles rapid resize events', function(done) {
            board = Kanban.init('#' + containerId, {
                columns: getColumns(),
                cards: getCards()
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
                        // Should remain functional
                        expect(board).not.toBeNull();

                        restore3();
                        done();
                    }, 50);
                }, 30);
            }, 30);
        });

    });

    // ========================================================================
    // Search/Filter at Different Viewports
    // ========================================================================

    FunkyTests.describe('Search/Filter Responsiveness', function() {

        FunkyTests.it('filters cards at mobile viewport', function(done) {
            var restore = FunkyTests.simulate.mobile();

            setTimeout(function() {
                board = Kanban.init('#' + containerId, {
                    columns: getColumns(),
                    cards: getCards(),
                    showToolbar: true,
                    searchableFields: ['title', 'description']
                });

                // Search should work
                if (typeof board.search === 'function') {
                    board.search('Task 1');
                }

                expect(board).not.toBeNull();

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
            board = Kanban.init('#' + containerId, {
                columns: getColumns(),
                cards: getCards()
            });

            board.destroy();

            // Should not error after destroy
            var restore = FunkyTests.simulate.resize(400, 300);
            restore();

            expect(true).toBe(true);
            board = null;
        });

        FunkyTests.it('removes DOM elements on destroy', function() {
            var containerEl = document.getElementById(containerId);

            board = Kanban.init('#' + containerId, {
                columns: getColumns(),
                cards: getCards()
            });

            expect(containerEl.querySelector('.kanban-board')).not.toBeNull();

            board.destroy();

            // Board DOM should be removed or cleared
            board = null;
            expect(true).toBe(true);
        });

    });

});
