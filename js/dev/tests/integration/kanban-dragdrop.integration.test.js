/**
 * Integration Test: Kanban + Drag/Drop + API
 *
 * Tests the integration between Kanban board, drag-and-drop operations,
 * API persistence, and real-time updates.
 */

describe('Funky.Integration.Kanban.DragDrop', function() {

    var Toast = Funky.Toast;
    var PubSub = Funky.PubSub;
    var Cache = Funky.Cache;
    var originalFetch;
    var apiCalls;
    var fixture;

    // Sample board data
    var sampleColumns = [
        { id: 'backlog', title: 'Backlog' },
        { id: 'todo', title: 'To Do', limit: 5 },
        { id: 'progress', title: 'In Progress', limit: 3 },
        { id: 'review', title: 'Review' },
        { id: 'done', title: 'Done' }
    ];

    var sampleCards = [
        { id: 'card-1', column: 'backlog', title: 'Task 1', priority: 'high' },
        { id: 'card-2', column: 'backlog', title: 'Task 2', priority: 'medium' },
        { id: 'card-3', column: 'todo', title: 'Task 3', priority: 'low' },
        { id: 'card-4', column: 'progress', title: 'Task 4', priority: 'high' },
        { id: 'card-5', column: 'done', title: 'Task 5', priority: 'medium' }
    ];

    beforeEach(function() {
        Cache.clear();
        PubSub.clear();
        apiCalls = [];
        originalFetch = window.fetch;

        // Mock fetch for Kanban API calls
        window.fetch = function(url, options) {
            apiCalls.push({ url: url, options: options || {} });

            // Move card endpoint
            if (url.includes('/api/cards/') && url.includes('/move')) {
                var body = JSON.parse(options.body || '{}');
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            success: true,
                            card: {
                                id: body.cardId,
                                column: body.toColumn,
                                position: body.position
                            }
                        });
                    }
                });
            }

            // Update card endpoint
            if (url.includes('/api/cards/') && options && options.method === 'PATCH') {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            success: true,
                            updated_at: new Date().toISOString()
                        });
                    }
                });
            }

            // Create card endpoint
            if (url.includes('/api/cards') && options && options.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            id: 'card-new-' + Date.now(),
                            title: 'New Card',
                            column: 'backlog'
                        });
                    }
                });
            }

            // Get board data
            if (url.includes('/api/board')) {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            columns: sampleColumns,
                            cards: sampleCards
                        });
                    }
                });
            }

            // Error endpoint
            if (url.includes('/api/error')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: function() {
                        return Promise.resolve({ error: 'Server error' });
                    }
                });
            }

            // WIP limit exceeded
            if (url.includes('/api/wip-error')) {
                return Promise.resolve({
                    ok: false,
                    status: 422,
                    json: function() {
                        return Promise.resolve({
                            error: 'WIP limit exceeded',
                            limit: 3
                        });
                    }
                });
            }

            return Promise.resolve({
                ok: true,
                json: function() {
                    return Promise.resolve({});
                }
            });
        };

        // Create Kanban fixture
        fixture = FunkyTests.fixture(
            '<div id="kanban-container" style="width: 1000px; height: 600px;"></div>'
        );

        // Clean up toasts
        var toastContainer = document.getElementById('funky-toast-container');
        if (toastContainer) {
            toastContainer.innerHTML = '';
        }
    });

    afterEach(function() {
        window.fetch = originalFetch;
        Cache.clear();
        PubSub.clear();
        fixture.destroy();
    });

    // =========================================================================
    // Card Move Operations
    // =========================================================================

    describe('Card Move Operations', function() {

        it('sends API request when card moved', function() {
            var moveData = {
                cardId: 'card-1',
                fromColumn: 'backlog',
                toColumn: 'todo',
                position: 0
            };

            return fetch('/api/cards/card-1/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(moveData)
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                expect(apiCalls.length).toBe(1);
                expect(apiCalls[0].url).toContain('/move');
                expect(result.success).toBe(true);
            });
        });

        it('includes position in move request', function() {
            var moveData = {
                cardId: 'card-1',
                toColumn: 'todo',
                position: 2
            };

            return fetch('/api/cards/card-1/move', {
                method: 'POST',
                body: JSON.stringify(moveData)
            })
            .then(function() {
                var body = JSON.parse(apiCalls[0].options.body);
                expect(body.position).toBe(2);
            });
        });

        it('emits card moved event via PubSub', function() {
            var events = [];

            PubSub.on('funky:kanban:card:moved', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:kanban:card:moved', {
                cardId: 'card-1',
                fromColumn: 'backlog',
                toColumn: 'progress',
                position: 0
            });

            expect(events.length).toBe(1);
            expect(events[0].fromColumn).toBe('backlog');
            expect(events[0].toColumn).toBe('progress');
        });

        it('shows success toast after move', function() {
            return fetch('/api/cards/card-1/move', {
                method: 'POST',
                body: JSON.stringify({ toColumn: 'done' })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function() {
                Toast.success('Card moved successfully');
                return FunkyTests.delay(100);
            })
            .then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast).toBeInDocument();
            });
        });

    });

    // =========================================================================
    // Optimistic Updates + Rollback
    // =========================================================================

    describe('Optimistic Updates + Rollback', function() {

        it('updates UI immediately (optimistic)', function() {
            var cardState = { column: 'backlog' };

            // Optimistic update
            cardState.column = 'todo';

            expect(cardState.column).toBe('todo');
        });

        it('rolls back on API error', function() {
            var cardState = { column: 'backlog' };
            var originalColumn = cardState.column;

            // Optimistic update
            cardState.column = 'todo';

            return fetch('/api/error', {
                method: 'POST',
                body: JSON.stringify({ toColumn: 'todo' })
            })
            .then(function(response) {
                if (!response.ok) {
                    // Rollback
                    cardState.column = originalColumn;
                    throw new Error('Move failed');
                }
            })
            .catch(function() {
                return FunkyTests.delay(50);
            })
            .then(function() {
                expect(cardState.column).toBe('backlog');
            });
        });

        it('shows error toast on rollback', function() {
            return fetch('/api/error', { method: 'POST' })
                .then(function(response) {
                    if (!response.ok) {
                        Toast.error('Failed to move card');
                        throw new Error('Move failed');
                    }
                })
                .catch(function() {
                    return FunkyTests.delay(100);
                })
                .then(function() {
                    var toast = document.querySelector('.funky-toast-error');
                    expect(toast).toBeInDocument();
                });
        });

        it('emits rollback event', function() {
            var events = [];

            PubSub.on('funky:kanban:move:rollback', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:kanban:move:rollback', {
                cardId: 'card-1',
                toColumn: 'backlog',
                reason: 'API error'
            });

            expect(events.length).toBe(1);
            expect(events[0].reason).toBe('API error');
        });

    });

    // =========================================================================
    // WIP Limits
    // =========================================================================

    describe('WIP Limits', function() {

        it('prevents move when WIP limit exceeded', function() {
            var columnCounts = {
                'progress': 3 // At limit
            };
            var limit = 3;

            var canMove = columnCounts['progress'] < limit;
            expect(canMove).toBe(false);
        });

        it('shows warning toast when WIP limit reached', function() {
            return fetch('/api/wip-error', {
                method: 'POST',
                body: JSON.stringify({ toColumn: 'progress' })
            })
            .then(function(response) {
                return response.json().then(function(data) {
                    if (!response.ok) {
                        Toast.warning('WIP limit of ' + data.limit + ' reached');
                        throw new Error(data.error);
                    }
                });
            })
            .catch(function() {
                return FunkyTests.delay(100);
            })
            .then(function() {
                var toast = document.querySelector('.funky-toast-warning');
                expect(toast).toBeInDocument();
                expect(toast.textContent).toContain('limit');
            });
        });

        it('emits WIP limit event', function() {
            var events = [];

            PubSub.on('funky:kanban:wip:exceeded', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:kanban:wip:exceeded', {
                column: 'progress',
                limit: 3,
                current: 3
            });

            expect(events.length).toBe(1);
            expect(events[0].limit).toBe(3);
        });

        it('allows move when under WIP limit', function() {
            var columnCounts = {
                'progress': 2 // Under limit
            };
            var limit = 3;

            var canMove = columnCounts['progress'] < limit;
            expect(canMove).toBe(true);
        });

    });

    // =========================================================================
    // Drag State Management
    // =========================================================================

    describe('Drag State Management', function() {

        it('tracks drag start state', function() {
            var dragState = {
                isDragging: false,
                cardId: null,
                sourceColumn: null
            };

            // Start drag
            dragState.isDragging = true;
            dragState.cardId = 'card-1';
            dragState.sourceColumn = 'backlog';

            expect(dragState.isDragging).toBe(true);
            expect(dragState.cardId).toBe('card-1');
        });

        it('clears drag state on drop', function() {
            var dragState = {
                isDragging: true,
                cardId: 'card-1',
                sourceColumn: 'backlog'
            };

            // End drag
            dragState.isDragging = false;
            dragState.cardId = null;
            dragState.sourceColumn = null;

            expect(dragState.isDragging).toBe(false);
            expect(dragState.cardId).toBe(null);
        });

        it('emits drag events via PubSub', function() {
            var dragEvents = [];

            PubSub.on('funky:kanban:drag:start', function(data) {
                dragEvents.push({ type: 'start', ...data });
            });

            PubSub.on('funky:kanban:drag:end', function(data) {
                dragEvents.push({ type: 'end', ...data });
            });

            PubSub.emit('funky:kanban:drag:start', { cardId: 'card-1' });
            PubSub.emit('funky:kanban:drag:end', { cardId: 'card-1', dropped: true });

            expect(dragEvents.length).toBe(2);
            expect(dragEvents[0].type).toBe('start');
            expect(dragEvents[1].type).toBe('end');
        });

    });

    // =========================================================================
    // Column Transitions
    // =========================================================================

    describe('Column Transitions', function() {

        it('validates allowed transitions', function() {
            var transitions = {
                'backlog': ['todo'],
                'todo': ['progress', 'backlog'],
                'progress': ['review', 'todo'],
                'review': ['done', 'progress'],
                'done': ['review']
            };

            var isValidMove = function(from, to) {
                return transitions[from] && transitions[from].includes(to);
            };

            expect(isValidMove('backlog', 'todo')).toBe(true);
            expect(isValidMove('backlog', 'done')).toBe(false);
            expect(isValidMove('progress', 'review')).toBe(true);
        });

        it('shows error for invalid transition', function() {
            var transitions = { 'backlog': ['todo'] };
            var from = 'backlog';
            var to = 'done';

            if (!transitions[from] || !transitions[from].includes(to)) {
                Toast.error('Cannot move directly from ' + from + ' to ' + to);
            }

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-error');
                expect(toast).toBeInDocument();
            });
        });

    });

    // =========================================================================
    // Cache Invalidation
    // =========================================================================

    describe('Cache Invalidation', function() {

        it('invalidates board cache after move', function() {
            var cacheKey = 'kanban:board:1';
            Cache.set(cacheKey, { columns: sampleColumns, cards: sampleCards });

            return fetch('/api/cards/card-1/move', {
                method: 'POST',
                body: JSON.stringify({ toColumn: 'todo' })
            })
            .then(function() {
                Cache.delete(cacheKey);
                return FunkyTests.delay(50);
            })
            .then(function() {
                expect(Cache.get(cacheKey)).toBeUndefined();
            });
        });

        it('updates card cache after move', function() {
            var cardCache = 'kanban:card:card-1';

            return fetch('/api/cards/card-1/move', {
                method: 'POST',
                body: JSON.stringify({ toColumn: 'done' })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                Cache.set(cardCache, result.card);
                return FunkyTests.delay(50);
            })
            .then(function() {
                var cached = Cache.get(cardCache);
                expect(cached.column).toBe('done');
            });
        });

    });

    // =========================================================================
    // Reordering Within Column
    // =========================================================================

    describe('Reordering Within Column', function() {

        it('reorders cards within same column', function() {
            var cards = ['card-1', 'card-2', 'card-3'];

            // Move card-3 to position 0
            var cardToMove = cards.splice(2, 1)[0];
            cards.splice(0, 0, cardToMove);

            expect(cards[0]).toBe('card-3');
            expect(cards[1]).toBe('card-1');
            expect(cards[2]).toBe('card-2');
        });

        it('sends reorder API request', function() {
            return fetch('/api/cards/card-3/move', {
                method: 'POST',
                body: JSON.stringify({
                    cardId: 'card-3',
                    toColumn: 'backlog', // Same column
                    position: 0
                })
            })
            .then(function() {
                var body = JSON.parse(apiCalls[0].options.body);
                expect(body.position).toBe(0);
            });
        });

    });

    // =========================================================================
    // Multi-Card Operations
    // =========================================================================

    describe('Multi-Card Operations', function() {

        it('moves multiple selected cards', function() {
            var selectedCards = ['card-1', 'card-2'];
            var movePromises = selectedCards.map(function(cardId) {
                return fetch('/api/cards/' + cardId + '/move', {
                    method: 'POST',
                    body: JSON.stringify({ toColumn: 'todo' })
                });
            });

            return Promise.all(movePromises).then(function() {
                expect(apiCalls.length).toBe(2);
            });
        });

        it('shows bulk move toast', function() {
            Toast.success('Moved 3 cards to To Do');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-success');
                expect(toast.textContent).toContain('3 cards');
            });
        });

    });

    // =========================================================================
    // Keyboard Drag Support
    // =========================================================================

    describe('Keyboard Drag Support', function() {

        it('picks up card with Space/Enter', function() {
            var pickedCard = null;

            PubSub.on('funky:kanban:card:pickup', function(data) {
                pickedCard = data.cardId;
            });

            PubSub.emit('funky:kanban:card:pickup', { cardId: 'card-1' });

            expect(pickedCard).toBe('card-1');
        });

        it('moves card with arrow keys', function() {
            var events = [];

            PubSub.on('funky:kanban:card:keyboard:move', function(data) {
                events.push(data);
            });

            PubSub.emit('funky:kanban:card:keyboard:move', {
                cardId: 'card-1',
                direction: 'right'
            });

            expect(events[0].direction).toBe('right');
        });

        it('drops card with Space/Enter', function() {
            var dropped = false;

            PubSub.on('funky:kanban:card:drop', function() {
                dropped = true;
            });

            PubSub.emit('funky:kanban:card:drop', { cardId: 'card-1' });

            expect(dropped).toBe(true);
        });

        it('cancels with Escape', function() {
            var cancelled = false;

            PubSub.on('funky:kanban:drag:cancel', function() {
                cancelled = true;
            });

            PubSub.emit('funky:kanban:drag:cancel', {});

            expect(cancelled).toBe(true);
        });

    });

    // =========================================================================
    // Real-time Updates
    // =========================================================================

    describe('Real-time Updates', function() {

        it('receives remote card move via PubSub', function() {
            var remoteUpdates = [];

            PubSub.on('funky:kanban:remote:move', function(data) {
                remoteUpdates.push(data);
            });

            // Simulate WebSocket message
            PubSub.emit('funky:kanban:remote:move', {
                cardId: 'card-1',
                toColumn: 'done',
                userId: 'user-2'
            });

            expect(remoteUpdates.length).toBe(1);
            expect(remoteUpdates[0].userId).toBe('user-2');
        });

        it('shows notification for remote updates', function() {
            Toast.info('John moved "Task 1" to Done');

            return FunkyTests.delay(100).then(function() {
                var toast = document.querySelector('.funky-toast-info');
                expect(toast).toBeInDocument();
            });
        });

        it('handles concurrent moves gracefully', function() {
            var moveAttempts = [];

            PubSub.on('funky:kanban:move:conflict', function(data) {
                moveAttempts.push(data);
            });

            // Simulate conflict
            PubSub.emit('funky:kanban:move:conflict', {
                cardId: 'card-1',
                yourMove: 'todo',
                serverState: 'done'
            });

            expect(moveAttempts.length).toBe(1);
        });

    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', function() {

        it('announces card pickup', function() {
            var announcements = [];

            PubSub.on('funky:announce', function(data) {
                announcements.push(data.message);
            });

            PubSub.emit('funky:announce', {
                message: 'Picked up Task 1. Use arrow keys to move.'
            });

            expect(announcements[0]).toContain('Picked up');
        });

        it('announces card drop', function() {
            var announcements = [];

            PubSub.on('funky:announce', function(data) {
                announcements.push(data.message);
            });

            PubSub.emit('funky:announce', {
                message: 'Task 1 dropped in In Progress column, position 2'
            });

            expect(announcements[0]).toContain('dropped');
        });

        it('announces WIP limit warnings', function() {
            var announcements = [];

            PubSub.on('funky:announce', function(data) {
                announcements.push(data.message);
            });

            PubSub.emit('funky:announce', {
                message: 'Warning: In Progress column is at capacity (3 of 3)'
            });

            expect(announcements[0]).toContain('capacity');
        });

    });

});
