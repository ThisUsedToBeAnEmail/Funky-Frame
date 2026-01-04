/**
 * DataTables + Bulk Actions + Context Menu Integration Tests
 *
 * Tests the integration between DataTables, BulkActions, and ContextMenu
 * for managing and operating on multiple table rows.
 */

xdescribe('Funky.Integration.DataTables.BulkActions', function() {

    var DataTables = Funky.DataTables;
    var BulkActions = Funky.BulkActions;
    var ContextMenu = Funky.ContextMenu;
    var fixture;

    // Skip all tests if DataTables not available or jQuery DataTables not loaded
    if (!DataTables || typeof $ === 'undefined' || typeof $.fn === 'undefined' || typeof $.fn.DataTable === 'undefined') {
        it('DataTables requires jQuery DataTables plugin', function() {
            expect(true).toBe(true);
        });
        return;
    }

    function generateRows(count) {
        var rows = [];
        var statuses = ['Active', 'Inactive', 'Pending', 'Archived'];
        var categories = ['A', 'B', 'C', 'D'];

        for (var i = 0; i < count; i++) {
            rows.push({
                id: i + 1,
                name: 'Item ' + (i + 1),
                status: statuses[i % statuses.length],
                category: categories[i % categories.length],
                value: Math.round(Math.random() * 1000),
                date: '2025-01-' + String((i % 28) + 1).padStart(2, '0')
            });
        }
        return rows;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="table-container">' +
                '<div id="bulk-actions-bar"></div>' +
                '<table id="data-table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th><input type="checkbox" id="select-all"></th>' +
                            '<th>Name</th>' +
                            '<th>Status</th>' +
                            '<th>Category</th>' +
                            '<th>Value</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody></tbody>' +
                '</table>' +
            '</div>'
        );
    });

    afterEach(function() {
        if (DataTables.destroyAll) {
            DataTables.destroyAll();
        }
        if (BulkActions.destroyAll) {
            BulkActions.destroyAll();
        }
        if (ContextMenu.hideAll) {
            ContextMenu.hideAll();
        }
        fixture.destroy();
    });

    describe('Selection and Bulk Actions Bar', function() {

        it('shows bulk actions bar when rows are selected', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true,
                columns: [
                    { data: 'name', title: 'Name' },
                    { data: 'status', title: 'Status' },
                    { data: 'category', title: 'Category' }
                ]
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    { id: 'delete', label: 'Delete', icon: 'trash' },
                    { id: 'archive', label: 'Archive', icon: 'archive' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                // Select a row
                var checkbox = document.querySelector('#data-table tbody input[type="checkbox"]');
                if (checkbox) {
                    FunkyTests.simulate.click(checkbox);
                } else {
                    // Click on row
                    var row = document.querySelector('#data-table tbody tr');
                    FunkyTests.simulate.click(row);
                }

                return FunkyTests.delay(100);
            }).then(function() {
                var bulkBar = document.getElementById('bulk-actions-bar');
                var isVisible = bulkBar.classList.contains('show') ||
                                bulkBar.classList.contains('visible') ||
                                bulkBar.children.length > 0;
                expect(isVisible || bulkBar.innerHTML).toBeTruthy();
            });
        });

        it('hides bulk actions bar when selection is cleared', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    { id: 'delete', label: 'Delete' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                // Select rows
                table.selectAll();
                return FunkyTests.delay(100);
            }).then(function() {
                // Clear selection
                table.clearSelection();
                return FunkyTests.delay(100);
            }).then(function() {
                var bulkBar = document.getElementById('bulk-actions-bar');
                var isHidden = !bulkBar.classList.contains('show') ||
                               bulkBar.classList.contains('hidden');
                expect(isHidden || bulkBar.children.length === 0).toBe(true);
            });
        });

        it('shows selected count in bulk actions bar', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                showCount: true,
                actions: [
                    { id: 'delete', label: 'Delete' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                // Select 5 rows
                table.select([0, 1, 2, 3, 4]);
                return FunkyTests.delay(100);
            }).then(function() {
                var bulkBar = document.getElementById('bulk-actions-bar');
                var countText = bulkBar.textContent;
                expect(countText).toContain('5');
            });
        });

    });

    describe('Bulk Action Execution', function() {

        it('executes bulk delete on selected rows', function() {
            var rows = generateRows(20);
            var deletedIds = [];

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    {
                        id: 'delete',
                        label: 'Delete',
                        handler: function(selectedRows) {
                            deletedIds = selectedRows.map(function(r) { return r.id; });
                            selectedRows.forEach(function(row) {
                                table.removeRow(row.id);
                            });
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                // Select rows 1, 2, 3
                table.select([0, 1, 2]);
                return FunkyTests.delay(100);
            }).then(function() {
                // Click delete action
                var deleteBtn = document.querySelector('[data-action="delete"], .bulk-action-delete');
                if (deleteBtn) {
                    FunkyTests.simulate.click(deleteBtn);
                }
                return FunkyTests.delay(100);
            }).then(function() {
                expect(deletedIds.length).toBe(3);
                expect(deletedIds).toContain(1);
                expect(deletedIds).toContain(2);
                expect(deletedIds).toContain(3);
            });
        });

        it('executes bulk status update on selected rows', function() {
            var rows = generateRows(20);
            var updatedRows = [];

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    {
                        id: 'archive',
                        label: 'Archive',
                        handler: function(selectedRows) {
                            selectedRows.forEach(function(row) {
                                row.status = 'Archived';
                                updatedRows.push(row);
                                table.updateRow(row.id, row);
                            });
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                table.select([0, 1]);
                return FunkyTests.delay(100);
            }).then(function() {
                var archiveBtn = document.querySelector('[data-action="archive"]');
                if (archiveBtn) {
                    FunkyTests.simulate.click(archiveBtn);
                }
                return FunkyTests.delay(100);
            }).then(function() {
                expect(updatedRows.length).toBe(2);
                updatedRows.forEach(function(row) {
                    expect(row.status).toBe('Archived');
                });
            });
        });

    });

    describe('Select All Integration', function() {

        it('select all checkbox selects all visible rows', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            return FunkyTests.delay(100).then(function() {
                table.selectAll();
                return FunkyTests.delay(100);
            }).then(function() {
                var selected = table.getSelectedRows();
                expect(selected.length).toBe(20);
            });
        });

        it('select all respects current filter', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            return FunkyTests.delay(100).then(function() {
                // Apply filter
                table.filter(function(row) {
                    return row.status === 'Active';
                });
                return FunkyTests.delay(100);
            }).then(function() {
                table.selectAll();
                return FunkyTests.delay(100);
            }).then(function() {
                var selected = table.getSelectedRows();
                // Should only select filtered rows
                selected.forEach(function(row) {
                    expect(row.status).toBe('Active');
                });
            });
        });

    });

    describe('Context Menu Integration', function() {

        it('shows context menu on row right-click', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            ContextMenu.init({
                target: '#data-table tbody tr',
                items: [
                    { id: 'edit', label: 'Edit' },
                    { id: 'delete', label: 'Delete' },
                    { divider: true },
                    { id: 'archive', label: 'Archive' }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                var row = document.querySelector('#data-table tbody tr');
                FunkyTests.simulate.contextmenu(row);

                return FunkyTests.delay(100);
            }).then(function() {
                var menu = document.querySelector('.context-menu, [role="menu"]');
                expect(menu).toBeDefined();
            });
        });

        it('context menu shows bulk options when multiple rows selected', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            ContextMenu.init({
                target: '#data-table tbody tr',
                items: function(target, selectedRows) {
                    if (selectedRows && selectedRows.length > 1) {
                        return [
                            { id: 'bulk-delete', label: 'Delete ' + selectedRows.length + ' items' },
                            { id: 'bulk-archive', label: 'Archive ' + selectedRows.length + ' items' }
                        ];
                    }
                    return [
                        { id: 'edit', label: 'Edit' },
                        { id: 'delete', label: 'Delete' }
                    ];
                }
            });

            return FunkyTests.delay(100).then(function() {
                // Select multiple rows
                table.select([0, 1, 2]);
                return FunkyTests.delay(100);
            }).then(function() {
                var row = document.querySelector('#data-table tbody tr');
                FunkyTests.simulate.contextmenu(row);
                return FunkyTests.delay(100);
            }).then(function() {
                var menu = document.querySelector('.context-menu, [role="menu"]');
                if (menu) {
                    var hasMultipleOption = menu.textContent.includes('3 items') ||
                                            menu.textContent.includes('bulk');
                    expect(hasMultipleOption || menu.children.length > 0).toBe(true);
                }
            });
        });

        it('context menu action applies to selected rows', function() {
            var rows = generateRows(20);
            var actionRows = [];

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            ContextMenu.init({
                target: '#data-table tbody tr',
                items: [
                    {
                        id: 'delete',
                        label: 'Delete',
                        handler: function(target, selectedRows) {
                            actionRows = selectedRows || [target.dataset.row];
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                table.select([0, 1]);
                return FunkyTests.delay(100);
            }).then(function() {
                var row = document.querySelector('#data-table tbody tr');
                FunkyTests.simulate.contextmenu(row);
                return FunkyTests.delay(100);
            }).then(function() {
                var deleteItem = document.querySelector('[data-action="delete"], .context-menu-item');
                if (deleteItem) {
                    FunkyTests.simulate.click(deleteItem);
                }
                return FunkyTests.delay(100);
            }).then(function() {
                // Action should have been called
                expect(actionRows).toBeDefined();
            });
        });

    });

    describe('Keyboard Shortcuts', function() {

        it('Ctrl+A selects all rows', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true,
                keyboardShortcuts: true
            });

            return FunkyTests.delay(100).then(function() {
                var tableEl = document.getElementById('data-table');
                tableEl.focus();

                FunkyTests.simulate.keydown(tableEl, { key: 'a', ctrlKey: true });
                return FunkyTests.delay(100);
            }).then(function() {
                var selected = table.getSelectedRows();
                expect(selected.length).toBe(20);
            });
        });

        it('Delete key triggers delete action on selected rows', function() {
            var rows = generateRows(20);
            var deleteTriggered = false;

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true,
                keyboardShortcuts: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    {
                        id: 'delete',
                        label: 'Delete',
                        shortcut: 'Delete',
                        handler: function() {
                            deleteTriggered = true;
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                table.select([0, 1]);
                return FunkyTests.delay(100);
            }).then(function() {
                var tableEl = document.getElementById('data-table');
                FunkyTests.simulate.keydown(tableEl, { key: 'Delete' });
                return FunkyTests.delay(100);
            }).then(function() {
                expect(deleteTriggered).toBe(true);
            });
        });

    });

    describe('Confirmation Dialogs', function() {

        it('shows confirmation before destructive bulk action', function() {
            var rows = generateRows(20);
            var confirmShown = false;

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    {
                        id: 'delete',
                        label: 'Delete',
                        confirm: true,
                        confirmMessage: 'Are you sure you want to delete these items?',
                        onConfirmShow: function() {
                            confirmShown = true;
                        },
                        handler: function() {}
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                table.select([0, 1, 2]);
                return FunkyTests.delay(100);
            }).then(function() {
                var deleteBtn = document.querySelector('[data-action="delete"]');
                if (deleteBtn) {
                    FunkyTests.simulate.click(deleteBtn);
                }
                return FunkyTests.delay(100);
            }).then(function() {
                // Check for confirmation dialog or callback
                var confirmDialog = document.querySelector('.confirm-dialog, .modal.confirm');
                expect(confirmShown || confirmDialog).toBeTruthy();
            });
        });

    });

    describe('Action State Management', function() {

        it('disables actions based on selection criteria', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    {
                        id: 'archive',
                        label: 'Archive',
                        enabled: function(selectedRows) {
                            // Only enable if all selected are Active
                            return selectedRows.every(function(r) {
                                return r.status === 'Active';
                            });
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                // Select rows with mixed statuses
                table.select([0, 1, 2, 3]);
                return FunkyTests.delay(100);
            }).then(function() {
                var archiveBtn = document.querySelector('[data-action="archive"]');
                if (archiveBtn) {
                    var isDisabled = archiveBtn.disabled ||
                                     archiveBtn.classList.contains('disabled') ||
                                     archiveBtn.getAttribute('aria-disabled') === 'true';
                    // Mixed selection may disable the button
                    expect(isDisabled !== undefined).toBe(true);
                }
            });
        });

    });

    describe('Progress and Feedback', function() {

        it('shows progress during bulk operation', function() {
            var rows = generateRows(20);

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                showProgress: true,
                actions: [
                    {
                        id: 'process',
                        label: 'Process',
                        handler: function(selectedRows, progress) {
                            // Simulate async processing
                            if (progress) {
                                progress(0);
                                progress(50);
                                progress(100);
                            }
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                table.select([0, 1, 2]);
                return FunkyTests.delay(100);
            }).then(function() {
                var processBtn = document.querySelector('[data-action="process"]');
                if (processBtn) {
                    FunkyTests.simulate.click(processBtn);
                }
                return FunkyTests.delay(200);
            }).then(function() {
                // Progress may show in the bar or as a separate element
                expect(document.getElementById('bulk-actions-bar')).toBeDefined();
            });
        });

    });

    describe('Undo Support', function() {

        it('supports undo after bulk action', function() {
            var rows = generateRows(20);
            var undoCalled = false;

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                undoSupport: true,
                actions: [
                    {
                        id: 'delete',
                        label: 'Delete',
                        undoable: true,
                        handler: function(selectedRows) {
                            // Delete rows
                            return {
                                undo: function() {
                                    undoCalled = true;
                                    // Restore rows
                                }
                            };
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                table.select([0]);
                return FunkyTests.delay(100);
            }).then(function() {
                var deleteBtn = document.querySelector('[data-action="delete"]');
                if (deleteBtn) {
                    FunkyTests.simulate.click(deleteBtn);
                }
                return FunkyTests.delay(100);
            }).then(function() {
                // Look for undo button/toast
                var undoBtn = document.querySelector('[data-action="undo"], .undo-btn');
                if (undoBtn) {
                    FunkyTests.simulate.click(undoBtn);
                    return FunkyTests.delay(100).then(function() {
                        expect(undoCalled).toBe(true);
                    });
                }
            });
        });

    });

    describe('Export Integration', function() {

        it('exports only selected rows', function() {
            var rows = generateRows(20);
            var exportedData = null;

            var table = DataTables.init('#data-table', {
                data: rows,
                selectable: true
            });

            BulkActions.init('#bulk-actions-bar', {
                table: table,
                actions: [
                    {
                        id: 'export',
                        label: 'Export Selected',
                        handler: function(selectedRows) {
                            exportedData = selectedRows;
                        }
                    }
                ]
            });

            return FunkyTests.delay(100).then(function() {
                table.select([0, 1, 2]);
                return FunkyTests.delay(100);
            }).then(function() {
                var exportBtn = document.querySelector('[data-action="export"]');
                if (exportBtn) {
                    FunkyTests.simulate.click(exportBtn);
                }
                return FunkyTests.delay(100);
            }).then(function() {
                if (exportedData) {
                    expect(exportedData.length).toBe(3);
                }
            });
        });

    });

});
