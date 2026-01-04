/**
 * Funky.BulkActions Tests
 *
 * Tests for the bulk actions component that manages action toolbars
 * for Funky.Table with selection integration.
 */

describe('Funky.Component.BulkActions', function() {

    var BulkActions;
    var Table;
    var fixture;
    var bulkActions;
    var tableInstance;

    // Sample data for testing
    var sampleData = [
        { id: 1, name: 'Item 1', status: 'active' },
        { id: 2, name: 'Item 2', status: 'inactive' },
        { id: 3, name: 'Item 3', status: 'active' },
        { id: 4, name: 'Item 4', status: 'pending' }
    ];

    beforeEach(function() {
        // Get fresh references
        BulkActions = Funky.BulkActions;
        Table = Funky.Table;

        // Create container for table
        fixture = FunkyTests.fixture('<div id="test-table-container"></div>');

        // Create Funky.Table with selection
        if (Table && Table.init) {
            tableInstance = Table.init('#test-table-container', {
                data: sampleData,
                selectable: 'multi',
                columns: [
                    { data: 'id', title: 'ID' },
                    { data: 'name', title: 'Name' },
                    { data: 'status', title: 'Status' }
                ]
            });
        }
    });

    afterEach(function() {
        if (bulkActions) {
            bulkActions.destroy();
            bulkActions = null;
        }
        if (tableInstance) {
            tableInstance.destroy();
            tableInstance = null;
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('BulkActions')).toBe(true);
        });

        it('has create method', function() {
            expect(typeof BulkActions.create).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof BulkActions.getInstance).toBe('function');
        });

        it('has setData method for Bindable Interface', function() {
            expect(typeof BulkActions.setData).toBe('function');
        });

        it('has getData method for Bindable Interface', function() {
            expect(typeof BulkActions.getData).toBe('function');
        });

        it('exposes constructor for instanceof checks', function() {
            expect(BulkActions.constructor).toBeDefined();
        });

    });

    describe('Instance Creation', function() {

        it('creates instance with Funky.Table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });

            expect(bulkActions).toBeDefined();
        });

        it('creates action bar element', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });

            var actionBar = document.querySelector('.bulk-action-bar');
            expect(actionBar).not.toBeNull();
        });

        it('action bar starts hidden', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });

            var actionBar = document.querySelector('.bulk-action-bar');
            expect(actionBar.style.display).toBe('none');
        });

        it('respects showCount option', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                showCount: false,
                actions: []
            });

            var countBadge = document.querySelector('.selected-count');
            expect(countBadge).toBeNull();
        });

        it('respects showClear option', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                showClear: false,
                actions: []
            });

            var clearBtn = document.querySelector('.btn-clear-selection');
            expect(clearBtn).toBeNull();
        });

        it('getTable() returns table instance', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });

            expect(bulkActions.getTable()).toBe(tableInstance);
        });

    });

    describe('Action Buttons', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: [
                    { id: 'delete', label: 'Delete', icon: 'fa-trash', variant: 'danger' },
                    { id: 'export', label: 'Export', icon: 'fa-download', variant: 'secondary' }
                ]
            });
        });

        it('renders action buttons from config', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var buttons = document.querySelectorAll('.bulk-actions-buttons button');
            expect(buttons.length).toBe(2);
        });

        it('renders button with label', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var button = document.querySelector('[data-action="delete"]');
            expect(button.textContent).toContain('Delete');
        });

        it('renders button with icon', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var button = document.querySelector('[data-action="delete"]');
            var icon = button.querySelector('.fa-trash');
            expect(icon).not.toBeNull();
        });

        it('renders button with variant', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var button = document.querySelector('[data-action="delete"]');
            expect(button.classList.contains('btn-danger')).toBe(true);
        });

        it('hidden action is not rendered', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.addAction({ id: 'hidden-action', label: 'Hidden', hidden: true });

            var button = document.querySelector('[data-action="hidden-action"]');
            expect(button).toBeNull();
        });

        it('disabled action has disabled attribute', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.addAction({ id: 'disabled-action', label: 'Disabled', disabled: true });

            var button = document.querySelector('[data-action="disabled-action"]');
            expect(button.disabled).toBe(true);
        });

    });

    describe('Selection Integration', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });
        });

        it('getSelectedItems() returns selected data from table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1, 2]);

            var items = bulkActions.getSelectedItems();
            expect(items.length).toBe(2);
        });

        it('getSelectedIds() returns selected IDs from table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1, 3]);

            var ids = bulkActions.getSelectedIds();
            expect(ids).toContain('1');
            expect(ids).toContain('3');
        });

        it('getSelectionCount() returns count', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            expect(bulkActions.getSelectionCount()).toBe(0);

            tableInstance.select([1]);
            expect(bulkActions.getSelectionCount()).toBe(1);

            tableInstance.select([2]);
            expect(bulkActions.getSelectionCount()).toBe(2);
        });

        it('selectAll() selects all rows via table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.selectAll();

            expect(bulkActions.getSelectionCount()).toBe(4);
        });

        it('clearSelection() clears via table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1, 2]);
            bulkActions.clearSelection();

            expect(bulkActions.getSelectionCount()).toBe(0);
        });

        it('select() selects specific IDs via table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.select([1, 3]);

            var ids = bulkActions.getSelectedIds();
            expect(ids).toContain('1');
            expect(ids).toContain('3');
        });

        it('deselect() deselects specific IDs via table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1, 2, 3]);
            bulkActions.deselect([2]);

            expect(bulkActions.getSelectionCount()).toBe(2);
        });

    });

    describe('UI Updates', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                animation: false,  // Disable animation for tests
                actions: [
                    { id: 'test', label: 'Test' }
                ]
            });
        });

        it('shows action bar when items selected', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1]);
            bulkActions.refresh();

            var actionBar = document.querySelector('.bulk-action-bar');
            expect(actionBar.style.display).not.toBe('none');
        });

        it('updates count badge', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1, 2]);
            bulkActions.refresh();

            var count = document.querySelector('.selected-count');
            expect(count.textContent).toBe('2 selected');
        });

        it('hides action bar when selection cleared', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1]);
            bulkActions.refresh();

            tableInstance.deselectAll();
            bulkActions.refresh();

            var actionBar = document.querySelector('.bulk-action-bar');
            expect(actionBar.style.display).toBe('none');
        });

    });

    describe('Action Registry', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: [
                    { id: 'initial', label: 'Initial' }
                ]
            });
        });

        it('addAction() adds new action', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.addAction({ id: 'new', label: 'New Action' });

            var button = document.querySelector('[data-action="new"]');
            expect(button).not.toBeNull();
        });

        it('addAction() returns instance for chaining', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var result = bulkActions.addAction({ id: 'chain', label: 'Chain' });
            expect(result).toBe(bulkActions);
        });

        it('removeAction() removes action', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.removeAction('initial');

            var button = document.querySelector('[data-action="initial"]');
            expect(button).toBeNull();
        });

        it('removeAction() returns instance for chaining', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var result = bulkActions.removeAction('initial');
            expect(result).toBe(bulkActions);
        });

        it('setActionEnabled() disables action', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.setActionEnabled('initial', false);

            var button = document.querySelector('[data-action="initial"]');
            expect(button.disabled).toBe(true);
        });

        it('setActionEnabled() enables action', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.setActionEnabled('initial', false);
            bulkActions.setActionEnabled('initial', true);

            var button = document.querySelector('[data-action="initial"]');
            expect(button.disabled).toBe(false);
        });

        it('setActionVisible() hides action', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.setActionVisible('initial', false);

            var button = document.querySelector('[data-action="initial"]');
            expect(button).toBeNull();
        });

        it('setActionVisible() shows action', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions.setActionVisible('initial', false);
            bulkActions.setActionVisible('initial', true);

            var button = document.querySelector('[data-action="initial"]');
            expect(button).not.toBeNull();
        });

        it('getAction() returns action config', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var action = bulkActions.getAction('initial');

            expect(action).not.toBeNull();
            expect(action.id).toBe('initial');
        });

        it('getAction() returns null for non-existent', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var action = bulkActions.getAction('non-existent');
            expect(action).toBeNull();
        });

    });

    describe('Bindable Interface', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });
        });

        it('setData() sets selected items', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var tableId = tableInstance.id;
            BulkActions.setData(tableId, [1, 3]);

            expect(bulkActions.getSelectionCount()).toBe(2);
        });

        it('getData() returns selected items', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1, 2]);

            var tableId = tableInstance.id;
            var items = BulkActions.getData(tableId);

            expect(items.length).toBe(2);
        });

        it('setData() with empty array clears selection', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1]);

            var tableId = tableInstance.id;
            BulkActions.setData(tableId, []);

            expect(bulkActions.getSelectionCount()).toBe(0);
        });

    });

    describe('onAction Callback', function() {

        it('calls onAction with action id, selected items, and table', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var actionCalled = null;
            var itemsCalled = null;
            var tableCalled = null;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: [
                    { id: 'callback-test', label: 'Test' }
                ],
                onAction: function(actionId, items, table) {
                    actionCalled = actionId;
                    itemsCalled = items;
                    tableCalled = table;
                }
            });

            tableInstance.select([1]);

            var button = document.querySelector('[data-action="callback-test"]');
            button.click();

            expect(actionCalled).toBe('callback-test');
            expect(itemsCalled.length).toBe(1);
            expect(tableCalled).toBe(tableInstance);
        });

    });

    describe('Clear Selection Button', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });
        });

        it('renders clear selection button by default', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var clearBtn = document.querySelector('.btn-clear-selection');
            expect(clearBtn).not.toBeNull();
        });

        it('clicking clear button clears selection', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            tableInstance.select([1, 2]);

            var clearBtn = document.querySelector('.btn-clear-selection');
            clearBtn.click();

            expect(bulkActions.getSelectionCount()).toBe(0);
        });

    });

    describe('destroy()', function() {

        it('removes action bar from DOM', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });

            bulkActions.destroy();

            var actionBar = document.querySelector('.bulk-action-bar');
            expect(actionBar).toBeNull();
        });

        it('removes from instance registry', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });

            var tableId = tableInstance.id;
            bulkActions.destroy();

            // getInstance returns undefined for non-existent instances (plain object)
            var instance = BulkActions.getInstance(tableId);
            expect(instance).toBeUndefined();
        });

    });

    describe('Accessibility', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: [
                    { id: 'test', label: 'Test Action' }
                ]
            });
        });

        it('action bar has toolbar role', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var actionBar = document.querySelector('.bulk-action-bar');
            expect(actionBar.getAttribute('role')).toBe('toolbar');
        });

        it('action bar has aria-label', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var actionBar = document.querySelector('.bulk-action-bar');
            expect(actionBar.getAttribute('aria-label')).toBe('Bulk actions');
        });

        it('selected count has aria-live', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var count = document.querySelector('.selected-count');
            expect(count.getAttribute('aria-live')).toBe('polite');
        });

        it('buttons container has group role', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var buttonsContainer = document.querySelector('.bulk-actions-buttons');
            expect(buttonsContainer.getAttribute('role')).toBe('group');
        });

        it('action buttons have aria-label', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var button = document.querySelector('[data-action="test"]');
            expect(button.getAttribute('aria-label')).toBe('Test Action');
        });

    });

    describe('PubSub Events', function() {

        beforeEach(function() {
            if (!tableInstance) return;

            bulkActions = BulkActions.create({
                table: tableInstance,
                actions: []
            });
        });

        it('emits funky:bulk-actions:selection-changed on refresh', function(done) {
            if (!tableInstance) {
                pending('Funky.Table not available');
                done();
                return;
            }

            var eventData = null;

            if (Funky.PubSub) {
                var unsub = Funky.PubSub.on('funky:bulk-actions:selection-changed', function(data) {
                    eventData = data;
                    unsub();
                });
            }

            tableInstance.select([1]);
            bulkActions.refresh();

            setTimeout(function() {
                expect(eventData).not.toBeNull();
                expect(eventData.count).toBe(1);
                done();
            }, 50);
        });

        it('emits funky:bulk-actions:action on action click', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            var eventData = null;

            bulkActions.addAction({ id: 'event-test', label: 'Event Test' });

            if (Funky.PubSub) {
                var unsub = Funky.PubSub.on('funky:bulk-actions:action', function(data) {
                    eventData = data;
                    unsub();
                });
            }

            tableInstance.select([1]);

            var button = document.querySelector('[data-action="event-test"]');
            button.click();

            expect(eventData).not.toBeNull();
            expect(eventData.actionId).toBe('event-test');
        });

    });

    describe('Bar Position', function() {

        it('places bar at top of container by default', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                barPosition: 'top',
                actions: []
            });

            // tableInstance.container is a DOM element directly
            var container = tableInstance.container;
            var actionBar = document.querySelector('.bulk-action-bar');

            expect(container.firstElementChild).toBe(actionBar);
        });

        it('places bar at bottom when specified', function() {
            if (!tableInstance) {
                pending('Funky.Table not available');
                return;
            }

            bulkActions = BulkActions.create({
                table: tableInstance,
                barPosition: 'bottom',
                actions: []
            });

            // tableInstance.container is a DOM element directly
            var container = tableInstance.container;
            var actionBar = document.querySelector('.bulk-action-bar');

            expect(container.lastElementChild).toBe(actionBar);
        });

    });

});
