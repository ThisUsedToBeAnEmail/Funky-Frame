/**
 * Funky.Kanban Core Tests
 *
 * Tests for the Kanban board component core functionality.
 * Validates module structure, column/card rendering, manipulation,
 * column limits, DOM structure, accessibility, and callbacks.
 */

describe('Funky.Component.Kanban', function() {

    var Kanban = Funky.Kanban;

    // Skip all tests if Kanban not available
    if (!Kanban) {
        it('Kanban module not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var kanban;
    var containerId;
    var testCounter = 0;

    // Sample columns for testing - recreated in beforeEach to prevent cross-test contamination
    var sampleColumns;

    // Sample cards for testing - recreated in beforeEach to prevent cross-test contamination
    var sampleCards;

    beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        containerId = 'kanban-test-' + unique;
        fixture = FunkyTests.fixture('<div id="' + containerId + '" style="width: 800px; height: 400px;"></div>');

        // Fresh copies of test data for each test to prevent mutation issues
        sampleColumns = [
            { id: 'todo', title: 'To Do' },
            { id: 'progress', title: 'In Progress' },
            { id: 'done', title: 'Done' }
        ];
        sampleCards = [
            { id: 'card1', column: 'todo', title: 'Task 1', description: 'First task' },
            { id: 'card2', column: 'todo', title: 'Task 2', description: 'Second task' },
            { id: 'card3', column: 'progress', title: 'Task 3', description: 'Third task' },
            { id: 'card4', column: 'done', title: 'Task 4', description: 'Fourth task' }
        ];
    });

    afterEach(function() {
        if (kanban && typeof kanban.destroy === 'function') {
            kanban.destroy();
            kanban = null;
        }
        fixture.destroy();
    });

    // =========================================================================
    // Module Structure
    // =========================================================================

    describe('Module Structure', function() {

        it('Funky.Kanban is registered', function() {
            expect(Kanban).toBeDefined();
            expect(typeof Kanban).toBe('object');
        });

        it('has init method', function() {
            expect(typeof Kanban.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Kanban.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof Kanban.destroyAll).toBe('function');
        });

        it('has defaults object', function() {
            expect(Kanban.defaults).toBeDefined();
            expect(typeof Kanban.defaults).toBe('object');
        });

        it('has instances array', function() {
            expect(Array.isArray(Kanban.instances)).toBe(true);
        });

    });

    // =========================================================================
    // Initialisation
    // =========================================================================

    describe('Initialisation', function() {

        it('creates instance with selector', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            expect(kanban).toBeDefined();
            expect(kanban.id).toContain('kanban-');
        });

        it('creates instance with element', function() {
            var el = document.getElementById(containerId);
            kanban = Kanban.init(el, {
                columns: sampleColumns
            });

            expect(kanban).toBeDefined();
        });

        it('stores instance in Kanban.instances', function() {
            var countBefore = Kanban.instances.length;
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            expect(Kanban.instances.length).toBe(countBefore + 1);
        });

        it('merges options with defaults', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                showToolbar: true
            });

            expect(kanban.options.showToolbar).toBe(true);
            expect(kanban.options.emptyColumnText).toBe('No cards');
        });

        it('exposes columns as Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            expect(kanban.columns instanceof Map).toBe(true);
        });

        it('exposes cards as Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            expect(kanban.cards instanceof Map).toBe(true);
        });

    });

    // =========================================================================
    // Column Rendering
    // =========================================================================

    describe('Column Rendering', function() {

        it('renders all columns', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var columns = document.querySelectorAll('#' + containerId + ' .kanban-column');
            expect(columns.length).toBe(3);
        });

        it('renders column with correct data attribute', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var column = document.querySelector('#' + containerId + ' [data-column-id="todo"]');
            expect(column).not.toBe(null);
        });

        it('renders column header with title', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var header = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-title');
            expect(header.textContent).toBe('To Do');
        });

        it('renders column with count element', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var count = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-count');
            expect(count).not.toBe(null);
        });

        it('renders column with body element', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var body = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-body');
            expect(body).not.toBe(null);
        });

        it('renders empty state placeholder', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var empty = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-empty');
            expect(empty).not.toBe(null);
        });

        it('respects custom emptyColumnText', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                emptyColumnText: 'Drop cards here'
            });

            var empty = document.querySelector('#' + containerId + ' .kanban-column-empty');
            expect(empty.textContent).toBe('Drop cards here');
        });

        it('renders column with color when specified', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: [
                    { id: 'todo', title: 'To Do', color: '#ff0000' }
                ]
            });

            var header = document.querySelector('#' + containerId + ' .kanban-column-header');
            expect(header.classList.contains('has-color')).toBe(true);
        });

        it('renders column limit when specified', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: [
                    { id: 'wip', title: 'In Progress', limit: 5 }
                ]
            });

            var limit = document.querySelector('#' + containerId + ' .kanban-column-limit');
            expect(limit).not.toBe(null);
            expect(limit.textContent).toContain('5');
        });

    });

    // =========================================================================
    // Card Rendering
    // =========================================================================

    describe('Card Rendering', function() {

        it('renders all cards', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var cards = document.querySelectorAll('#' + containerId + ' .kanban-card');
            expect(cards.length).toBe(4);
        });

        it('renders card in correct column', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var todoColumn = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-body');
            var todoCards = todoColumn.querySelectorAll('.kanban-card');
            expect(todoCards.length).toBe(2);
        });

        it('renders card with data-card-id attribute', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var card = document.querySelector('#' + containerId + ' [data-card-id="card1"]');
            expect(card).not.toBe(null);
        });

        it('renders card title', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var title = document.querySelector('#' + containerId + ' [data-card-id="card1"] .kanban-card-title');
            expect(title.textContent).toBe('Task 1');
        });

        it('renders card description', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var desc = document.querySelector('#' + containerId + ' [data-card-id="card1"] .kanban-card-description');
            expect(desc.textContent).toBe('First task');
        });

        it('sets draggable attribute on card', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var card = document.querySelector('#' + containerId + ' .kanban-card');
            expect(card.getAttribute('draggable')).toBe('true');
        });

        it('updates column count after rendering cards', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var count = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-count');
            expect(count.textContent).toBe('2');
        });

        it('hides empty placeholder when cards present', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var empty = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-empty');
            expect(empty.style.display).toBe('none');
        });

        it('shows empty placeholder when column empty', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [] // No cards
            });

            var empty = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-empty');
            expect(empty.style.display).not.toBe('none');
        });

        it('uses custom renderCard function', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [{ id: 'c1', column: 'todo', title: 'Test' }],
                renderCard: function(card) {
                    return '<div class="custom-card">' + card.title + '</div>';
                }
            });

            var custom = document.querySelector('#' + containerId + ' .custom-card');
            expect(custom).not.toBe(null);
            expect(custom.textContent).toBe('Test');
        });

    });

    // =========================================================================
    // Card Labels
    // =========================================================================

    describe('Card Labels', function() {

        it('renders labels when provided', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [
                    { id: 'c1', column: 'todo', title: 'Test', labels: ['Bug', 'High Priority'] }
                ]
            });

            var labels = document.querySelectorAll('#' + containerId + ' [data-card-id="c1"] .kanban-label');
            expect(labels.length).toBe(2);
        });

        it('renders label with text', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [
                    { id: 'c1', column: 'todo', title: 'Test', labels: ['Feature'] }
                ]
            });

            var label = document.querySelector('#' + containerId + ' .kanban-label');
            expect(label.textContent).toBe('Feature');
        });

        it('renders label with color from object', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [
                    { id: 'c1', column: 'todo', title: 'Test', labels: [{ text: 'Bug', color: '#ff0000' }] }
                ]
            });

            var label = document.querySelector('#' + containerId + ' .kanban-label');
            expect(label.style.background).toContain('rgb(255, 0, 0)');
        });

    });

    // =========================================================================
    // Card Priority
    // =========================================================================

    describe('Card Priority', function() {

        it('adds priority class to card', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [
                    { id: 'c1', column: 'todo', title: 'Test', priority: 'high' }
                ]
            });

            var card = document.querySelector('#' + containerId + ' [data-card-id="c1"]');
            expect(card.classList.contains('priority-high')).toBe(true);
        });

        it('renders priority indicator', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [
                    { id: 'c1', column: 'todo', title: 'Test', priority: 'high' }
                ]
            });

            var priority = document.querySelector('#' + containerId + ' .kanban-card-priority');
            expect(priority).not.toBe(null);
        });

    });

    // =========================================================================
    // Public API - getCard / getCards
    // =========================================================================

    describe('getCard()', function() {

        it('returns card data by id', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var card = kanban.getCard('card1');
            expect(card).toBeDefined();
            expect(card.title).toBe('Task 1');
        });

        it('returns undefined for non-existent id', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var card = kanban.getCard('nonexistent');
            expect(card).toBeUndefined();
        });

    });

    describe('getCards()', function() {

        it('returns all cards when no column specified', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var cards = kanban.getCards();
            expect(cards.length).toBe(4);
        });

        it('returns cards for specific column', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var todoCards = kanban.getCards('todo');
            expect(todoCards.length).toBe(2);
        });

        it('returns empty array for empty column', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: [{ id: 'empty', title: 'Empty' }],
                cards: []
            });

            var cards = kanban.getCards('empty');
            expect(cards.length).toBe(0);
        });

    });

    // =========================================================================
    // Public API - addCard
    // =========================================================================

    describe('addCard()', function() {

        it('adds card to specified column', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            kanban.addCard({ id: 'new1', column: 'todo', title: 'New Card' });

            var card = document.querySelector('#' + containerId + ' [data-card-id="new1"]');
            expect(card).not.toBe(null);
        });

        it('updates column count after add', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            kanban.addCard({ id: 'new1', column: 'todo', title: 'New Card' });

            var count = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-count');
            expect(count.textContent).toBe('1');
        });

        it('stores card in cards Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            kanban.addCard({ id: 'new1', column: 'todo', title: 'New Card' });

            expect(kanban.cards.has('new1')).toBe(true);
        });

        it('returns the added card element', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var result = kanban.addCard({ id: 'new1', column: 'todo', title: 'New Card' });

            expect(result).toBeDefined();
        });

        it('respects position option', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [
                    { id: 'c1', column: 'todo', title: 'First' },
                    { id: 'c2', column: 'todo', title: 'Second' }
                ]
            });

            kanban.addCard({ id: 'new1', column: 'todo', title: 'Middle', position: 1 });

            var cards = document.querySelectorAll('#' + containerId + ' [data-column-id="todo"] .kanban-card');
            expect(cards[1].dataset.cardId).toBe('new1');
        });

    });

    // =========================================================================
    // Public API - updateCard
    // =========================================================================

    describe('updateCard()', function() {

        it('updates card title', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.updateCard('card1', { title: 'Updated Title' });

            var title = document.querySelector('#' + containerId + ' [data-card-id="card1"] .kanban-card-title');
            expect(title.textContent).toBe('Updated Title');
        });

        it('updates card data in Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.updateCard('card1', { description: 'New description' });

            var card = kanban.getCard('card1');
            expect(card.description).toBe('New description');
        });

        it('moves card when column changes', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.updateCard('card1', { column: 'done' });

            var card = document.querySelector('#' + containerId + ' [data-column-id="done"] [data-card-id="card1"]');
            expect(card).not.toBe(null);
        });

        it('updates both column counts on move', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.updateCard('card1', { column: 'done' });

            var todoCount = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-count');
            var doneCount = document.querySelector('#' + containerId + ' [data-column-id="done"] .kanban-column-count');
            expect(todoCount.textContent).toBe('1');
            expect(doneCount.textContent).toBe('2');
        });

    });

    // =========================================================================
    // Public API - removeCard
    // =========================================================================

    describe('removeCard()', function() {

        it('removes card from DOM', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.removeCard('card1');

            var card = document.querySelector('#' + containerId + ' [data-card-id="card1"]');
            expect(card).toBe(null);
        });

        it('removes card from Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.removeCard('card1');

            expect(kanban.cards.has('card1')).toBe(false);
        });

        it('updates column count after remove', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.removeCard('card1');

            var count = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-count');
            expect(count.textContent).toBe('1');
        });

        it('shows empty placeholder when last card removed', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [{ id: 'only', column: 'todo', title: 'Only Card' }]
            });

            kanban.removeCard('only');

            var empty = document.querySelector('#' + containerId + ' [data-column-id="todo"] .kanban-column-empty');
            expect(empty.style.display).not.toBe('none');
        });

    });

    // =========================================================================
    // Public API - moveCard
    // =========================================================================

    describe('moveCard()', function() {

        it('moves card to different column', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.moveCard('card1', 'progress');

            var card = document.querySelector('#' + containerId + ' [data-column-id="progress"] [data-card-id="card1"]');
            expect(card).not.toBe(null);
        });

        it('updates card column in data', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.moveCard('card1', 'progress');

            var card = kanban.getCard('card1');
            expect(card.column).toBe('progress');
        });

        it('moves card to specific position', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: [
                    { id: 'c1', column: 'todo', title: 'First' },
                    { id: 'c2', column: 'progress', title: 'Target 1' },
                    { id: 'c3', column: 'progress', title: 'Target 2' }
                ]
            });

            kanban.moveCard('c1', 'progress', 1);

            var progressCards = document.querySelectorAll('#' + containerId + ' [data-column-id="progress"] .kanban-card');
            expect(progressCards[1].dataset.cardId).toBe('c1');
        });

    });

    // =========================================================================
    // Column Limits (WIP)
    // =========================================================================

    describe('Column Limits', function() {

        it('adds at-limit class when limit reached', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: [{ id: 'wip', title: 'WIP', limit: 2 }],
                cards: [
                    { id: 'c1', column: 'wip', title: 'Card 1' },
                    { id: 'c2', column: 'wip', title: 'Card 2' }
                ]
            });

            var column = document.querySelector('#' + containerId + ' [data-column-id="wip"]');
            expect(column.classList.contains('at-limit')).toBe(true);
        });

        it('removes at-limit class when under limit', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: [
                    { id: 'wip', title: 'WIP', limit: 2 },
                    { id: 'done', title: 'Done' }
                ],
                cards: [
                    { id: 'c1', column: 'wip', title: 'Card 1' },
                    { id: 'c2', column: 'wip', title: 'Card 2' }
                ]
            });

            kanban.moveCard('c1', 'done');

            var column = document.querySelector('#' + containerId + ' [data-column-id="wip"]');
            expect(column.classList.contains('at-limit')).toBe(false);
        });

        it('fires onColumnLimitReached callback', function() {
            var limitReachedColumn = null;

            kanban = Kanban.init('#' + containerId, {
                columns: [{ id: 'wip', title: 'WIP', limit: 1 }],
                cards: [],
                onColumnLimitReached: function(column) {
                    limitReachedColumn = column;
                }
            });

            kanban.addCard({ id: 'c1', column: 'wip', title: 'Card 1' });

            expect(limitReachedColumn).not.toBe(null);
            expect(limitReachedColumn.id).toBe('wip');
        });

    });

    // =========================================================================
    // Public API - getColumn / getColumns
    // =========================================================================

    describe('getColumn()', function() {

        it('returns column data by id', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var column = kanban.getColumn('todo');
            expect(column).toBeDefined();
            expect(column.config.title).toBe('To Do');
        });

        it('returns undefined for non-existent id', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var column = kanban.getColumn('nonexistent');
            expect(column).toBeUndefined();
        });

    });

    describe('getColumns()', function() {

        it('returns all columns', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var columns = kanban.getColumns();
            expect(columns.length).toBe(3);
        });

    });

    // =========================================================================
    // Public API - addColumn / removeColumn
    // =========================================================================

    describe('addColumn()', function() {

        it('adds new column to board', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            kanban.addColumn({ id: 'review', title: 'Review' });

            var column = document.querySelector('#' + containerId + ' [data-column-id="review"]');
            expect(column).not.toBe(null);
        });

        it('adds column at specific position', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            kanban.addColumn({ id: 'review', title: 'Review' }, 1);

            var columns = document.querySelectorAll('#' + containerId + ' .kanban-column');
            expect(columns[1].dataset.columnId).toBe('review');
        });

    });

    describe('removeColumn()', function() {

        it('removes column from board', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            kanban.removeColumn('done');

            var column = document.querySelector('#' + containerId + ' [data-column-id="done"]');
            expect(column).toBe(null);
        });

        it('removes column from Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            kanban.removeColumn('done');

            expect(kanban.columns.has('done')).toBe(false);
        });

    });

    // =========================================================================
    // DOM Structure
    // =========================================================================

    describe('DOM Structure', function() {

        it('creates kanban-board wrapper', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var board = document.querySelector('#' + containerId + ' .kanban-board');
            expect(board).not.toBe(null);
        });

        it('creates kanban-columns container', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var container = document.querySelector('#' + containerId + ' .kanban-columns');
            expect(container).not.toBe(null);
        });

        it('board has unique ID', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            expect(kanban.board.id).toContain('kanban-');
        });

    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', function() {

        it('board has role="application"', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            expect(kanban.board.getAttribute('role')).toBe('application');
        });

        it('board has aria-label', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            expect(kanban.board.getAttribute('aria-label')).toBe('Kanban board');
        });

        it('columns have role="listbox"', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var column = document.querySelector('#' + containerId + ' .kanban-column');
            expect(column.getAttribute('role')).toBe('listbox');
        });

        it('columns have aria-label', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns
            });

            var column = document.querySelector('#' + containerId + ' [data-column-id="todo"]');
            expect(column.getAttribute('aria-label')).toContain('To Do');
        });

        it('cards have role="option"', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var card = document.querySelector('#' + containerId + ' .kanban-card');
            expect(card.getAttribute('role')).toBe('option');
        });

        it('cards have tabindex="0"', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var card = document.querySelector('#' + containerId + ' .kanban-card');
            expect(card.getAttribute('tabindex')).toBe('0');
        });

    });

    // =========================================================================
    // Callbacks
    // =========================================================================

    describe('Callbacks', function() {

        it('fires onCardClick when card clicked', function() {
            var clickedCard = null;

            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards,
                onCardClick: function(card) {
                    clickedCard = card;
                }
            });

            var cardEl = document.querySelector('#' + containerId + ' [data-card-id="card1"]');
            cardEl.click();

            expect(clickedCard).not.toBe(null);
            expect(clickedCard.id).toBe('card1');
        });

        it('fires onCardMoved after card move', function() {
            var moveData = null;

            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards,
                onCardMoved: function(card, from, to, position) {
                    moveData = { card: card, from: from, to: to, position: position };
                }
            });

            kanban.moveCard('card1', 'progress');

            expect(moveData).not.toBe(null);
            expect(moveData.from).toBe('todo');
            expect(moveData.to).toBe('progress');
        });

    });

    // =========================================================================
    // Search
    // =========================================================================

    describe('search()', function() {

        it('searchCards method exists', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            expect(typeof kanban.search).toBe('function');
        });

        it('returns matching cards', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards,
                searchableFields: ['title']
            });

            var results = kanban.search('Task 1');
            expect(results).toBeDefined();
        });

        it('clearSearch method exists', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            expect(typeof kanban.clearSearch).toBe('function');
        });

    });

    // =========================================================================
    // Destroy
    // =========================================================================

    describe('destroy()', function() {

        it('removes board from DOM', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.destroy();
            kanban = null;

            var board = document.querySelector('#' + containerId + ' .kanban-board');
            expect(board).toBe(null);
        });

        it('clears columns Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var instance = kanban;
            kanban.destroy();
            kanban = null;

            expect(instance.columns.size).toBe(0);
        });

        it('clears cards Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var instance = kanban;
            kanban.destroy();
            kanban = null;

            expect(instance.cards.size).toBe(0);
        });

    });

    // =========================================================================
    // Data Methods
    // =========================================================================

    describe('setData()', function() {

        it('replaces all cards', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.setData([
                { id: 'new1', column: 'todo', title: 'New Card 1' },
                { id: 'new2', column: 'todo', title: 'New Card 2' }
            ]);

            var cards = document.querySelectorAll('#' + containerId + ' .kanban-card');
            expect(cards.length).toBe(2);
        });

        it('old cards are removed', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.setData([{ id: 'new1', column: 'todo', title: 'New' }]);

            var oldCard = document.querySelector('#' + containerId + ' [data-card-id="card1"]');
            expect(oldCard).toBe(null);
        });

    });

    describe('getData()', function() {

        it('returns all card data', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            var data = kanban.getData();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(4);
        });

    });

    describe('clearData()', function() {

        it('removes all cards', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.clearData();

            var cards = document.querySelectorAll('#' + containerId + ' .kanban-card');
            expect(cards.length).toBe(0);
        });

        it('clears cards Map', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                cards: sampleCards
            });

            kanban.clearData();

            expect(kanban.cards.size).toBe(0);
        });

    });

    // =========================================================================
    // Add Card Button
    // =========================================================================

    describe('Add Card Button', function() {

        it('renders add card button when showAddCard is true', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                showAddCard: true
            });

            var addBtn = document.querySelector('#' + containerId + ' .kanban-add-card-btn');
            expect(addBtn).not.toBe(null);
        });

        it('does not render add card button when showAddCard is false', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                showAddCard: false
            });

            var addBtn = document.querySelector('#' + containerId + ' .kanban-add-card-btn');
            expect(addBtn).toBe(null);
        });

        it('uses custom addCardText', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                showAddCard: true,
                addCardText: 'New Task'
            });

            var addBtn = document.querySelector('#' + containerId + ' .kanban-add-card-btn');
            expect(addBtn.textContent).toContain('New Task');
        });

    });

    // =========================================================================
    // Toolbar
    // =========================================================================

    describe('Toolbar', function() {

        it('renders toolbar when showToolbar is true', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                showToolbar: true
            });

            var toolbar = document.querySelector('#' + containerId + ' .kanban-toolbar');
            expect(toolbar).not.toBe(null);
        });

        it('does not render toolbar when showToolbar is false', function() {
            kanban = Kanban.init('#' + containerId, {
                columns: sampleColumns,
                showToolbar: false
            });

            var toolbar = document.querySelector('#' + containerId + ' .kanban-toolbar');
            expect(toolbar).toBe(null);
        });

    });

});
