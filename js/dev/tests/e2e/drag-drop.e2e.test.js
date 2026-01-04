/**
 * E2E Tests: Drag and Drop Flow
 *
 * Tests drag and drop interactions for sortable lists and kanban boards.
 */

describe('Funky.E2E.DragDrop', function() {

    var E2E = FunkyTests.E2E;
    var Toast = Funky.Toast;

    // Skip all tests if E2E utilities not available
    if (!E2E) {
        it('E2E utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    // Shared helper functions available to all nested describes
    function createKanbanBoard(options) {
        options = options || {};

        var columns = options.columns || [
            { id: 'todo', title: 'To Do' },
            { id: 'doing', title: 'In Progress' },
            { id: 'done', title: 'Done' }
        ];

        var cards = options.cards || [
            { id: 1, title: 'Task 1', column: 'todo', priority: 'high' },
            { id: 2, title: 'Task 2', column: 'todo', priority: 'medium' },
            { id: 3, title: 'Task 3', column: 'doing', priority: 'low' },
            { id: 4, title: 'Task 4', column: 'done', priority: 'medium' }
        ];

        var container = document.getElementById('drag-drop-container');
        container.innerHTML = '<div id="kanban-board" class="kanban-board"></div>';

        var board = document.getElementById('kanban-board');

        columns.forEach(function(column) {
            var columnEl = document.createElement('div');
            columnEl.className = 'kanban-column';
            columnEl.setAttribute('data-column', column.id);
            columnEl.innerHTML =
                '<div class="column-header">' +
                    '<h3>' + column.title + '</h3>' +
                    '<span class="card-count">0</span>' +
                '</div>' +
                '<div class="kanban-cards" data-column="' + column.id + '"></div>';
            board.appendChild(columnEl);
        });

        function renderCards() {
            document.querySelectorAll('.kanban-cards').forEach(function(container) {
                container.innerHTML = '';
            });

            cards.forEach(function(card) {
                var cardEl = document.createElement('div');
                cardEl.className = 'kanban-card priority-' + card.priority;
                cardEl.setAttribute('data-card-id', card.id);
                cardEl.setAttribute('draggable', 'true');
                cardEl.setAttribute('tabindex', '0');
                cardEl.innerHTML =
                    '<div class="card-title">' + card.title + '</div>' +
                    '<div class="card-priority">' + card.priority + '</div>';

                var targetColumn = document.querySelector('.kanban-cards[data-column="' + card.column + '"]');
                if (targetColumn) {
                    targetColumn.appendChild(cardEl);
                }

                cardEl.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', card.id);
                    e.dataTransfer.effectAllowed = 'move';
                    cardEl.classList.add('dragging');
                });

                cardEl.addEventListener('dragend', function() {
                    cardEl.classList.remove('dragging');
                });
            });

            columns.forEach(function(column) {
                var count = document.querySelectorAll('.kanban-cards[data-column="' + column.id + '"] .kanban-card').length;
                var countEl = document.querySelector('[data-column="' + column.id + '"] .card-count');
                if (countEl) countEl.textContent = count;
            });
        }

        document.querySelectorAll('.kanban-cards').forEach(function(dropZone) {
            dropZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', function() {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', function(e) {
                e.preventDefault();
                dropZone.classList.remove('drag-over');

                var cardId = parseInt(e.dataTransfer.getData('text/plain'));
                var newColumn = dropZone.getAttribute('data-column');

                var card = cards.find(function(c) { return c.id === cardId; });
                if (card) {
                    var oldColumn = card.column;
                    card.column = newColumn;

                    if (options.onMove) {
                        options.onMove(card, oldColumn, newColumn);
                    }

                    Toast.info('Moved "' + card.title + '" to ' + newColumn);
                    renderCards();
                }
            });
        });

        renderCards();

        return {
            cards: cards,
            getCardColumn: function(cardId) {
                var card = cards.find(function(c) { return c.id === cardId; });
                return card ? card.column : null;
            },
            moveCard: function(cardId, newColumn) {
                var card = cards.find(function(c) { return c.id === cardId; });
                if (card) {
                    card.column = newColumn;
                    renderCards();
                }
            }
        };
    }

    function createSortableList(options) {
        options = options || {};

        var items = options.items || [
            { id: 1, text: 'Item 1', order: 1 },
            { id: 2, text: 'Item 2', order: 2 },
            { id: 3, text: 'Item 3', order: 3 },
            { id: 4, text: 'Item 4', order: 4 },
            { id: 5, text: 'Item 5', order: 5 }
        ];

        var container = document.getElementById('drag-drop-container');
        container.innerHTML =
            '<div id="sortable-list" class="sortable-list">' +
                '<h3>Sortable List</h3>' +
                '<ul id="items-list"></ul>' +
            '</div>';

        var list = document.getElementById('items-list');

        function renderItems() {
            list.innerHTML = '';

            items.sort(function(a, b) { return a.order - b.order; });

            items.forEach(function(item, index) {
                var li = document.createElement('li');
                li.className = 'sortable-item';
                li.setAttribute('data-item-id', item.id);
                li.setAttribute('draggable', 'true');
                li.innerHTML =
                    '<span class="drag-handle">☰</span>' +
                    '<span class="item-text">' + item.text + '</span>' +
                    '<span class="item-order">#' + (index + 1) + '</span>';
                list.appendChild(li);

                li.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', item.id);
                    li.classList.add('dragging');
                });

                li.addEventListener('dragend', function() {
                    li.classList.remove('dragging');
                });

                li.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    var draggingItem = document.querySelector('.dragging');
                    if (draggingItem && draggingItem !== li) {
                        li.classList.add('drag-target');
                    }
                });

                li.addEventListener('dragleave', function() {
                    li.classList.remove('drag-target');
                });

                li.addEventListener('drop', function(e) {
                    e.preventDefault();
                    li.classList.remove('drag-target');

                    var draggedId = parseInt(e.dataTransfer.getData('text/plain'));
                    var targetId = item.id;

                    if (draggedId !== targetId) {
                        reorderItems(draggedId, targetId);
                    }
                });
            });
        }

        function reorderItems(draggedId, targetId) {
            var draggedItem = items.find(function(i) { return i.id === draggedId; });
            var targetItem = items.find(function(i) { return i.id === targetId; });

            if (draggedItem && targetItem) {
                var draggedOrder = draggedItem.order;
                var targetOrder = targetItem.order;

                draggedItem.order = targetOrder;
                targetItem.order = draggedOrder;

                if (options.onReorder) {
                    options.onReorder(items);
                }

                Toast.info('Reordered items');
                renderItems();
            }
        }

        renderItems();

        return {
            items: items,
            getOrder: function() {
                return items.sort(function(a, b) { return a.order - b.order; })
                    .map(function(i) { return i.id; });
            }
        };
    }

    describe('Kanban Board', function() {

        var fixture;

        beforeEach(function() {
            fixture = FunkyTests.fixture('<div id="drag-drop-container"></div>');
        });

        afterEach(function() {
            E2E.cleanup();
            if (fixture) fixture.destroy();
        });

        it('User can drag card between columns', function() {
            var moveHistory = [];
            var kanban;

            return E2E.scenario('Kanban Card Move')
                .given('I have a kanban board', function() {
                    kanban = createKanbanBoard({
                        onMove: function(card, from, to) {
                            moveHistory.push({ card: card.id, from: from, to: to });
                        }
                    });
                    return E2E.waitFor('.kanban-card');
                })
                .then('Task 1 should be in To Do column', function() {
                    expect(kanban.getCardColumn(1)).toBe('todo');
                })
                .when('I drag Task 1 to In Progress', function() {
                    var card = document.querySelector('[data-card-id="1"]');
                    var doingColumn = document.querySelector('.kanban-cards[data-column="doing"]');

                    return E2E.dragAndDrop(card, doingColumn);
                })
                .then('Task 1 should be in In Progress column', function() {
                    return E2E.wait(100).then(function() {
                        expect(kanban.getCardColumn(1)).toBe('doing');
                    });
                })
                .and('I should see a move notification', function() {
                    return E2E.waitForText('Moved');
                })
                .and('The move should be recorded', function() {
                    expect(moveHistory.length).toBe(1);
                    expect(moveHistory[0].from).toBe('todo');
                    expect(moveHistory[0].to).toBe('doing');
                })
                .run();
        });

        it('Card counts update after move', function() {
            var kanban;

            return E2E.scenario('Card Count Update')
                .given('I have a kanban board', function() {
                    kanban = createKanbanBoard();
                    return E2E.waitFor('.kanban-card');
                })
                .then('To Do should have 2 cards', function() {
                    var count = document.querySelector('[data-column="todo"] .card-count').textContent;
                    expect(count).toBe('2');
                })
                .and('In Progress should have 1 card', function() {
                    var count = document.querySelector('[data-column="doing"] .card-count').textContent;
                    expect(count).toBe('1');
                })
                .when('I move a card from To Do to In Progress', function() {
                    var card = document.querySelector('[data-card-id="1"]');
                    var doingColumn = document.querySelector('.kanban-cards[data-column="doing"]');

                    return E2E.dragAndDrop(card, doingColumn);
                })
                .then('To Do should have 1 card', function() {
                    return E2E.wait(100).then(function() {
                        var count = document.querySelector('[data-column="todo"] .card-count').textContent;
                        expect(count).toBe('1');
                    });
                })
                .and('In Progress should have 2 cards', function() {
                    var count = document.querySelector('[data-column="doing"] .card-count').textContent;
                    expect(count).toBe('2');
                })
                .run();
        });

        it('Cards have dragging visual feedback', function() {
            return E2E.scenario('Drag Visual Feedback')
                .given('I have a kanban board', function() {
                    createKanbanBoard();
                    return E2E.waitFor('.kanban-card');
                })
                .when('I start dragging a card', function() {
                    var card = document.querySelector('[data-card-id="1"]');

                    card.dispatchEvent(new DragEvent('dragstart', {
                        bubbles: true,
                        dataTransfer: new DataTransfer()
                    }));

                    return E2E.wait(50);
                })
                .then('The card should have dragging class', function() {
                    var card = document.querySelector('[data-card-id="1"]');
                    expect(card.classList.contains('dragging')).toBe(true);
                })
                .when('I end the drag', function() {
                    var card = document.querySelector('[data-card-id="1"]');
                    card.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
                    return E2E.wait(50);
                })
                .then('The dragging class should be removed', function() {
                    var card = document.querySelector('[data-card-id="1"]');
                    expect(card.classList.contains('dragging')).toBe(false);
                })
                .run();
        });

        it('Drop zone highlights on drag over', function() {
            return E2E.scenario('Drop Zone Highlight')
                .given('I have a kanban board', function() {
                    createKanbanBoard();
                    return E2E.waitFor('.kanban-card');
                })
                .when('I drag over the Done column', function() {
                    var doneColumn = document.querySelector('.kanban-cards[data-column="done"]');

                    doneColumn.dispatchEvent(new DragEvent('dragover', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer: new DataTransfer()
                    }));

                    return E2E.wait(50);
                })
                .then('The Done column should be highlighted', function() {
                    var doneColumn = document.querySelector('.kanban-cards[data-column="done"]');
                    expect(doneColumn.classList.contains('drag-over')).toBe(true);
                })
                .when('I drag away', function() {
                    var doneColumn = document.querySelector('.kanban-cards[data-column="done"]');
                    doneColumn.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
                    return E2E.wait(50);
                })
                .then('The highlight should be removed', function() {
                    var doneColumn = document.querySelector('.kanban-cards[data-column="done"]');
                    expect(doneColumn.classList.contains('drag-over')).toBe(false);
                })
                .run();
        });

    });

    describe('Sortable List', function() {

        var fixture;

        beforeEach(function() {
            fixture = FunkyTests.fixture('<div id="drag-drop-container"></div>');
        });

        afterEach(function() {
            E2E.cleanup();
            if (fixture) fixture.destroy();
        });

        it('User can reorder items by dragging', function() {
            var sortable;

            return E2E.scenario('List Reorder')
                .given('I have a sortable list', function() {
                    sortable = createSortableList();
                    return E2E.waitFor('.sortable-item');
                })
                .then('Items should be in original order', function() {
                    var order = sortable.getOrder();
                    expect(order).toEqual([1, 2, 3, 4, 5]);
                })
                .when('I drag Item 1 to Item 3 position', function() {
                    var item1 = document.querySelector('[data-item-id="1"]');
                    var item3 = document.querySelector('[data-item-id="3"]');

                    return E2E.dragAndDrop(item1, item3);
                })
                .then('The order should be updated', function() {
                    return E2E.wait(100).then(function() {
                        var order = sortable.getOrder();
                        expect(order[0]).not.toBe(1);
                    });
                })
                .and('I should see a reorder notification', function() {
                    return E2E.waitForText('Reordered');
                })
                .run();
        });

        it('Dragged item shows visual feedback', function() {
            return E2E.scenario('Sortable Visual Feedback')
                .given('I have a sortable list', function() {
                    createSortableList();
                    return E2E.waitFor('.sortable-item');
                })
                .when('I start dragging an item', function() {
                    var item = document.querySelector('[data-item-id="2"]');

                    item.dispatchEvent(new DragEvent('dragstart', {
                        bubbles: true,
                        dataTransfer: new DataTransfer()
                    }));

                    return E2E.wait(50);
                })
                .then('The item should have dragging class', function() {
                    var item = document.querySelector('[data-item-id="2"]');
                    expect(item.classList.contains('dragging')).toBe(true);
                })
                .run();
        });

        it('Drop target shows visual indicator', function() {
            return E2E.scenario('Drop Target Indicator')
                .given('I have a sortable list', function() {
                    createSortableList();
                    return E2E.waitFor('.sortable-item');
                })
                .when('I drag over another item', function() {
                    var item2 = document.querySelector('[data-item-id="2"]');
                    var item4 = document.querySelector('[data-item-id="4"]');

                    item2.dispatchEvent(new DragEvent('dragstart', {
                        bubbles: true,
                        dataTransfer: new DataTransfer()
                    }));

                    item4.dispatchEvent(new DragEvent('dragover', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer: new DataTransfer()
                    }));

                    return E2E.wait(50);
                })
                .then('The target should be highlighted', function() {
                    var item4 = document.querySelector('[data-item-id="4"]');
                    expect(item4.classList.contains('drag-target')).toBe(true);
                })
                .run();
        });

    });

    describe('Drag and Drop Accessibility', function() {

        var fixture;

        beforeEach(function() {
            fixture = FunkyTests.fixture('<div id="drag-drop-container"></div>');
        });

        afterEach(function() {
            E2E.cleanup();
            if (fixture) fixture.destroy();
        });

        it('Cards are keyboard accessible', function() {
            return E2E.scenario('Keyboard Accessibility')
                .given('I have a kanban board', function() {
                    createKanbanBoard();
                    return E2E.waitFor('.kanban-card');
                })
                .then('Cards should be focusable', function() {
                    var card = document.querySelector('.kanban-card');
                    card.focus();
                    expect(document.activeElement).toBe(card);
                })
                .and('Cards should have draggable attribute', function() {
                    var cards = document.querySelectorAll('.kanban-card');
                    cards.forEach(function(card) {
                        expect(card.getAttribute('draggable')).toBe('true');
                    });
                })
                .run();
        });

    });

    describe('Multiple Drag Operations', function() {

        var fixture;

        beforeEach(function() {
            fixture = FunkyTests.fixture('<div id="drag-drop-container"></div>');
        });

        afterEach(function() {
            E2E.cleanup();
            if (fixture) fixture.destroy();
        });

        it('User can move multiple cards in sequence', function() {
            var kanban;

            return E2E.scenario('Sequential Moves')
                .given('I have a kanban board', function() {
                    kanban = createKanbanBoard();
                    return E2E.waitFor('.kanban-card');
                })
                .when('I move Task 1 to Done', function() {
                    var card = document.querySelector('[data-card-id="1"]');
                    var doneColumn = document.querySelector('.kanban-cards[data-column="done"]');
                    return E2E.dragAndDrop(card, doneColumn);
                })
                .then('Task 1 should be in Done', function() {
                    return E2E.wait(100).then(function() {
                        expect(kanban.getCardColumn(1)).toBe('done');
                    });
                })
                .when('I move Task 2 to In Progress', function() {
                    var card = document.querySelector('[data-card-id="2"]');
                    var doingColumn = document.querySelector('.kanban-cards[data-column="doing"]');
                    return E2E.dragAndDrop(card, doingColumn);
                })
                .then('Task 2 should be in In Progress', function() {
                    return E2E.wait(100).then(function() {
                        expect(kanban.getCardColumn(2)).toBe('doing');
                    });
                })
                .and('Both moves should be reflected', function() {
                    expect(kanban.getCardColumn(1)).toBe('done');
                    expect(kanban.getCardColumn(2)).toBe('doing');
                })
                .run();
        });

    });

});
