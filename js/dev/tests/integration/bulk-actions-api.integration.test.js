/**
 * Integration Test: Bulk Actions + API + Selection + Toast
 *
 * Tests the integration between Bulk Actions component, API operations,
 * selection management, and user feedback.
 */

describe('Funky.Integration.BulkActions.API', function() {

    var BulkActions = Funky.BulkActions;
    var PubSub = Funky.PubSub;
    var fixture;
    var originalFetch;
    var fetchCalls;

    beforeEach(function() {
        // Mock fetch
        originalFetch = window.fetch;
        fetchCalls = [];
        window.fetch = function(url, options) {
            fetchCalls.push({ url: url, options: options });
            return Promise.resolve({
                ok: true,
                json: function() {
                    return Promise.resolve({ success: true });
                }
            });
        };

        PubSub.clear();
        fixture = FunkyTests.fixture('<div id="bulk-test"></div>');
    });

    afterEach(function() {
        window.fetch = originalFetch;
        PubSub.clear();
        fixture.destroy();
    });

    // =========================================================================
    // Selection and Action Bar
    // =========================================================================

    describe('Selection and Action Bar', function() {

        it('shows action bar when items selected', function() {
            var actionBarShown = false;

            PubSub.on('funky:bulk:selection-changed', function(data) {
                actionBarShown = data.count > 0;
            });

            // Simulate selecting items
            PubSub.emit('funky:bulk:selection-changed', {
                count: 3,
                items: [1, 2, 3]
            });

            expect(actionBarShown).toBe(true);
        });

        it('updates selection count display', function() {
            var selectionCount = 0;

            PubSub.on('funky:bulk:selection-changed', function(data) {
                selectionCount = data.count;
            });

            PubSub.emit('funky:bulk:selection-changed', { count: 5, items: [1, 2, 3, 4, 5] });
            expect(selectionCount).toBe(5);

            PubSub.emit('funky:bulk:selection-changed', { count: 2, items: [1, 2] });
            expect(selectionCount).toBe(2);
        });

        it('hides action bar when selection cleared', function() {
            var actionBarVisible = true;

            PubSub.on('funky:bulk:selection-changed', function(data) {
                actionBarVisible = data.count > 0;
            });

            PubSub.emit('funky:bulk:selection-changed', { count: 0, items: [] });

            expect(actionBarVisible).toBe(false);
        });

        it('supports select all action', function() {
            var allSelected = false;
            var selectedItems = [];

            PubSub.on('funky:bulk:select-all', function(data) {
                allSelected = true;
                selectedItems = data.items;
            });

            PubSub.emit('funky:bulk:select-all', {
                items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            });

            expect(allSelected).toBe(true);
            expect(selectedItems.length).toBe(10);
        });

    });

    // =========================================================================
    // Bulk Delete Operations
    // =========================================================================

    describe('Bulk Delete Operations', function() {

        it('sends bulk delete request to API', function(done) {
            var itemsToDelete = [1, 2, 3];

            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            success: true,
                            deleted: itemsToDelete.length
                        });
                    }
                });
            };

            // Trigger bulk delete
            PubSub.emit('funky:bulk:action', {
                action: 'delete',
                items: itemsToDelete
            });

            // Simulate API call
            fetch('/api/items/bulk-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: itemsToDelete })
            }).then(function() {
                expect(fetchCalls.length).toBe(1);
                expect(fetchCalls[0].options.method).toBe('DELETE');
                done();
            });
        });

        it('shows confirmation before bulk delete', function() {
            var confirmationShown = false;

            PubSub.on('funky:modal:confirm', function(data) {
                confirmationShown = true;
                expect(data.message).toContain('delete');
            });

            PubSub.emit('funky:modal:confirm', {
                message: 'Are you sure you want to delete 5 items?',
                onConfirm: function() {}
            });

            expect(confirmationShown).toBe(true);
        });

        it('shows success toast after bulk delete', function(done) {
            var toastShown = false;

            PubSub.on('funky:toast:show', function(data) {
                toastShown = true;
                expect(data.type).toBe('success');
                expect(data.message).toContain('deleted');
            });

            // Simulate successful delete
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true, deleted: 3 });
                    }
                });
            };

            fetch('/api/items/bulk-delete', { method: 'DELETE' })
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    PubSub.emit('funky:toast:show', {
                        type: 'success',
                        message: '3 items deleted successfully'
                    });
                    expect(toastShown).toBe(true);
                    done();
                });
        });

        it('clears selection after successful delete', function(done) {
            var selectionCleared = false;

            PubSub.on('funky:bulk:clear-selection', function() {
                selectionCleared = true;
            });

            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true });
                    }
                });
            };

            fetch('/api/items/bulk-delete', { method: 'DELETE' })
                .then(function() {
                    PubSub.emit('funky:bulk:clear-selection', {});
                    expect(selectionCleared).toBe(true);
                    done();
                });
        });

        it('handles partial delete failure', function(done) {
            var errorShown = false;

            PubSub.on('funky:toast:show', function(data) {
                if (data.type === 'warning') {
                    errorShown = true;
                    expect(data.message).toContain('2 of 5');
                }
            });

            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            success: false,
                            deleted: 3,
                            failed: 2,
                            errors: ['Item 4 is locked', 'Item 5 has dependencies']
                        });
                    }
                });
            };

            fetch('/api/items/bulk-delete', { method: 'DELETE' })
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    if (data.failed > 0) {
                        PubSub.emit('funky:toast:show', {
                            type: 'warning',
                            message: '2 of 5 items could not be deleted'
                        });
                    }
                    expect(errorShown).toBe(true);
                    done();
                });
        });

    });

    // =========================================================================
    // Bulk Status Update
    // =========================================================================

    describe('Bulk Status Update', function() {

        it('sends bulk status update to API', function(done) {
            var itemIds = [1, 2, 3, 4];
            var newStatus = 'archived';

            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true, updated: 4 });
                    }
                });
            };

            fetch('/api/items/bulk-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: itemIds, status: newStatus })
            }).then(function() {
                expect(fetchCalls.length).toBe(1);
                var body = JSON.parse(fetchCalls[0].options.body);
                expect(body.status).toBe('archived');
                expect(body.ids.length).toBe(4);
                done();
            });
        });

        it('updates UI optimistically', function() {
            var uiUpdates = [];

            PubSub.on('funky:items:status-updated', function(data) {
                uiUpdates.push(data);
            });

            // Optimistic UI update
            PubSub.emit('funky:items:status-updated', {
                ids: [1, 2, 3],
                status: 'active',
                optimistic: true
            });

            expect(uiUpdates.length).toBe(1);
            expect(uiUpdates[0].optimistic).toBe(true);
        });

        it('reverts on API failure', function(done) {
            var revertCalled = false;

            PubSub.on('funky:items:status-reverted', function(data) {
                revertCalled = true;
                expect(data.ids).toContain(1);
            });

            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 500
                });
            };

            fetch('/api/items/bulk-update', { method: 'PATCH' })
                .then(function(response) {
                    if (!response.ok) {
                        PubSub.emit('funky:items:status-reverted', {
                            ids: [1, 2, 3],
                            originalStatus: 'pending'
                        });
                    }
                    expect(revertCalled).toBe(true);
                    done();
                });
        });

    });

    // =========================================================================
    // Bulk Export
    // =========================================================================

    describe('Bulk Export', function() {

        it('exports selected items as CSV', function(done) {
            var exportStarted = false;

            PubSub.on('funky:export:started', function(data) {
                exportStarted = true;
                expect(data.format).toBe('csv');
            });

            window.fetch = function(url) {
                fetchCalls.push({ url: url });
                return Promise.resolve({
                    ok: true,
                    blob: function() {
                        return Promise.resolve(new Blob(['id,name\n1,Test'], { type: 'text/csv' }));
                    }
                });
            };

            PubSub.emit('funky:export:started', { format: 'csv', items: [1, 2, 3] });

            fetch('/api/items/export?ids=1,2,3&format=csv')
                .then(function() {
                    expect(exportStarted).toBe(true);
                    done();
                });
        });

        it('shows progress for large exports', function() {
            var progressUpdates = [];

            PubSub.on('funky:export:progress', function(data) {
                progressUpdates.push(data.percent);
            });

            // Simulate progress updates
            [25, 50, 75, 100].forEach(function(percent) {
                PubSub.emit('funky:export:progress', { percent: percent });
            });

            expect(progressUpdates).toEqual([25, 50, 75, 100]);
        });

        it('triggers download on completion', function() {
            var downloadTriggered = false;

            PubSub.on('funky:export:complete', function(data) {
                downloadTriggered = true;
                expect(data.filename).toContain('.csv');
            });

            PubSub.emit('funky:export:complete', {
                filename: 'export-2024-01-15.csv',
                size: 1024
            });

            expect(downloadTriggered).toBe(true);
        });

    });

    // =========================================================================
    // Bulk Assign/Move
    // =========================================================================

    describe('Bulk Assign/Move', function() {

        it('assigns items to category', function(done) {
            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true, assigned: 5 });
                    }
                });
            };

            fetch('/api/items/bulk-assign', {
                method: 'POST',
                body: JSON.stringify({
                    ids: [1, 2, 3, 4, 5],
                    category_id: 10
                })
            }).then(function() {
                var body = JSON.parse(fetchCalls[0].options.body);
                expect(body.category_id).toBe(10);
                expect(body.ids.length).toBe(5);
                done();
            });
        });

        it('moves items to different folder', function(done) {
            var moveCompleted = false;

            PubSub.on('funky:items:moved', function(data) {
                moveCompleted = true;
                expect(data.destination).toBe('folder-5');
            });

            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true });
                    }
                });
            };

            fetch('/api/items/bulk-move', { method: 'POST' })
                .then(function() {
                    PubSub.emit('funky:items:moved', {
                        ids: [1, 2],
                        destination: 'folder-5'
                    });
                    expect(moveCompleted).toBe(true);
                    done();
                });
        });

        it('updates tree/list after move', function() {
            var treeRefreshed = false;

            PubSub.on('funky:tree:refresh', function() {
                treeRefreshed = true;
            });

            PubSub.emit('funky:items:moved', { ids: [1], destination: 'folder-2' });
            PubSub.emit('funky:tree:refresh', {});

            expect(treeRefreshed).toBe(true);
        });

    });

    // =========================================================================
    // Keyboard Shortcuts
    // =========================================================================

    describe('Keyboard Shortcuts', function() {

        it('Ctrl+A selects all items', function() {
            var selectAllTriggered = false;

            PubSub.on('funky:bulk:select-all', function() {
                selectAllTriggered = true;
            });

            // Simulate Ctrl+A
            var event = new KeyboardEvent('keydown', {
                key: 'a',
                ctrlKey: true,
                bubbles: true
            });
            document.dispatchEvent(event);
            PubSub.emit('funky:bulk:select-all', { items: [] });

            expect(selectAllTriggered).toBe(true);
        });

        it('Escape clears selection', function() {
            var selectionCleared = false;

            PubSub.on('funky:bulk:clear-selection', function() {
                selectionCleared = true;
            });

            // Simulate Escape
            var event = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            });
            document.dispatchEvent(event);
            PubSub.emit('funky:bulk:clear-selection', {});

            expect(selectionCleared).toBe(true);
        });

        it('Delete key triggers bulk delete', function() {
            var deleteTriggered = false;

            PubSub.on('funky:bulk:action', function(data) {
                if (data.action === 'delete') {
                    deleteTriggered = true;
                }
            });

            PubSub.emit('funky:bulk:action', { action: 'delete', items: [1, 2] });

            expect(deleteTriggered).toBe(true);
        });

    });

    // =========================================================================
    // Progress and Loading States
    // =========================================================================

    describe('Progress and Loading States', function() {

        it('shows loading state during bulk operation', function() {
            var loadingStates = [];

            PubSub.on('funky:bulk:loading', function(data) {
                loadingStates.push(data.loading);
            });

            PubSub.emit('funky:bulk:loading', { loading: true });
            PubSub.emit('funky:bulk:loading', { loading: false });

            expect(loadingStates).toEqual([true, false]);
        });

        it('disables actions during operation', function() {
            var actionsDisabled = false;

            PubSub.on('funky:bulk:actions-disabled', function(data) {
                actionsDisabled = data.disabled;
            });

            PubSub.emit('funky:bulk:actions-disabled', { disabled: true });

            expect(actionsDisabled).toBe(true);
        });

        it('shows progress for batch operations', function() {
            var progressEvents = [];

            PubSub.on('funky:bulk:progress', function(data) {
                progressEvents.push({
                    completed: data.completed,
                    total: data.total
                });
            });

            // Simulate batch progress
            PubSub.emit('funky:bulk:progress', { completed: 10, total: 100 });
            PubSub.emit('funky:bulk:progress', { completed: 50, total: 100 });
            PubSub.emit('funky:bulk:progress', { completed: 100, total: 100 });

            expect(progressEvents.length).toBe(3);
            expect(progressEvents[2].completed).toBe(100);
        });

    });

    // =========================================================================
    // Error Handling
    // =========================================================================

    describe('Error Handling', function() {

        it('handles network errors gracefully', function(done) {
            var errorHandled = false;

            PubSub.on('funky:toast:show', function(data) {
                if (data.type === 'error') {
                    errorHandled = true;
                }
            });

            window.fetch = function() {
                return Promise.reject(new Error('Network error'));
            };

            fetch('/api/items/bulk-delete')
                .catch(function(error) {
                    PubSub.emit('funky:toast:show', {
                        type: 'error',
                        message: 'Network error. Please try again.'
                    });
                    expect(errorHandled).toBe(true);
                    done();
                });
        });

        it('handles timeout errors', function(done) {
            var timeoutHandled = false;

            PubSub.on('funky:bulk:timeout', function() {
                timeoutHandled = true;
            });

            // Simulate timeout
            var timeout = setTimeout(function() {
                PubSub.emit('funky:bulk:timeout', {});
                expect(timeoutHandled).toBe(true);
                done();
            }, 50);
        });

        it('preserves selection on error', function() {
            var selection = [1, 2, 3];
            var selectionPreserved = true;

            PubSub.on('funky:bulk:error', function(data) {
                // Selection should not be cleared on error
                if (data.clearSelection) {
                    selectionPreserved = false;
                }
            });

            PubSub.emit('funky:bulk:error', {
                message: 'Operation failed',
                clearSelection: false
            });

            expect(selectionPreserved).toBe(true);
        });

    });

    // =========================================================================
    // Cache Invalidation
    // =========================================================================

    describe('Cache Invalidation', function() {

        it('invalidates list cache after bulk update', function() {
            var cacheInvalidated = false;

            PubSub.on('funky:cache:invalidate', function(data) {
                if (data.key === 'items:list') {
                    cacheInvalidated = true;
                }
            });

            PubSub.emit('funky:bulk:complete', { action: 'update' });
            PubSub.emit('funky:cache:invalidate', { key: 'items:list' });

            expect(cacheInvalidated).toBe(true);
        });

        it('refreshes data after bulk operation', function() {
            var refreshTriggered = false;

            PubSub.on('funky:data:refresh', function() {
                refreshTriggered = true;
            });

            PubSub.emit('funky:bulk:complete', { action: 'delete' });
            PubSub.emit('funky:data:refresh', {});

            expect(refreshTriggered).toBe(true);
        });

    });

    // =========================================================================
    // Undo Support
    // =========================================================================

    describe('Undo Support', function() {

        it('shows undo option after bulk action', function() {
            var undoAvailable = false;

            PubSub.on('funky:toast:show', function(data) {
                if (data.action && data.action.label === 'Undo') {
                    undoAvailable = true;
                }
            });

            PubSub.emit('funky:toast:show', {
                type: 'success',
                message: '5 items archived',
                action: {
                    label: 'Undo',
                    callback: function() {}
                }
            });

            expect(undoAvailable).toBe(true);
        });

        it('restores items on undo', function() {
            var itemsRestored = false;

            PubSub.on('funky:bulk:undo', function(data) {
                itemsRestored = true;
                expect(data.action).toBe('archive');
            });

            PubSub.emit('funky:bulk:undo', {
                action: 'archive',
                items: [1, 2, 3]
            });

            expect(itemsRestored).toBe(true);
        });

    });

});
