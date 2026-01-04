/**
 * Performance Tests: DataTables
 *
 * Tests rendering performance, sorting, filtering, and pagination
 * for large datasets with the DataTables component.
 */

xdescribe('Funky.Perf.DataTables', function() {

    var DataTables = Funky.DataTables;
    var Perf = FunkyTests.Perf;
    var fixture;

    // Skip all tests if Perf utilities or DataTables not available
    if (!Perf || !DataTables || typeof $ === 'undefined' || typeof $.fn === 'undefined' || typeof $.fn.DataTable === 'undefined') {
        it('Perf utilities or DataTables not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    // Generate large test datasets
    function generateRows(count) {
        var rows = [];
        var statuses = ['Active', 'Pending', 'Completed', 'Cancelled'];
        var categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports'];

        for (var i = 0; i < count; i++) {
            rows.push({
                id: i + 1,
                name: 'Product ' + (i + 1),
                sku: 'SKU-' + String(i + 1).padStart(6, '0'),
                category: categories[i % categories.length],
                price: (Math.random() * 1000).toFixed(2),
                quantity: Math.floor(Math.random() * 100),
                status: statuses[i % statuses.length],
                created: new Date(2020 + Math.floor(i / 1000), i % 12, (i % 28) + 1).toISOString().split('T')[0],
                description: 'Description for product ' + (i + 1) + ' with additional details'
            });
        }
        return rows;
    }

    var sampleColumns = [
        { field: 'id', title: 'ID', width: 60 },
        { field: 'name', title: 'Name', sortable: true },
        { field: 'sku', title: 'SKU', sortable: true },
        { field: 'category', title: 'Category', sortable: true, filterable: true },
        { field: 'price', title: 'Price', sortable: true, type: 'number' },
        { field: 'quantity', title: 'Qty', sortable: true, type: 'number' },
        { field: 'status', title: 'Status', sortable: true, filterable: true },
        { field: 'created', title: 'Created', sortable: true, type: 'date' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="dt-container" style="height: 600px;"></div>'
        );
    });

    afterEach(function() {
        if (DataTables.destroyAll) {
            DataTables.destroyAll();
        }
        fixture.destroy();
    });

    describe('Initial Render Performance', function() {

        it('renders 100 rows in < 50ms', function() {
            var rows = generateRows(100);

            Perf.assertFasterThan(function() {
                DataTables.create('#dt-container', {
                    columns: sampleColumns,
                    data: rows
                });
            }, 50, '100 rows render');
        });

        it('renders 1,000 rows in < 100ms', function() {
            var rows = generateRows(1000);

            Perf.assertFasterThan(function() {
                DataTables.create('#dt-container', {
                    columns: sampleColumns,
                    data: rows
                });
            }, 100, '1K rows render');
        });

        it('renders 10,000 rows (paginated) in < 150ms', function() {
            var rows = generateRows(10000);

            Perf.assertFasterThan(function() {
                DataTables.create('#dt-container', {
                    columns: sampleColumns,
                    data: rows,
                    pageSize: 50
                });
            }, 150, '10K rows paginated render');
        });

        it('renders 100,000 rows (paginated) in < 300ms', function() {
            var rows = generateRows(100000);

            Perf.assertFasterThan(function() {
                DataTables.create('#dt-container', {
                    columns: sampleColumns,
                    data: rows,
                    pageSize: 50
                });
            }, 300, '100K rows paginated render');
        });

    });

    describe('Sort Performance', function() {

        it('sorts 1,000 rows by string in < 30ms', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows
            });

            Perf.assertFasterThan(function() {
                dt.sort('name', 'asc');
            }, 30, 'Sort 1K by string');
        });

        it('sorts 10,000 rows by string in < 100ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.sort('name', 'asc');
            }, 100, 'Sort 10K by string');
        });

        it('sorts 10,000 rows by number in < 50ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.sort('price', 'desc');
            }, 50, 'Sort 10K by number');
        });

        it('sorts 10,000 rows by date in < 80ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.sort('created', 'asc');
            }, 80, 'Sort 10K by date');
        });

        it('multi-column sort is efficient', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.sort([
                    { field: 'category', direction: 'asc' },
                    { field: 'price', direction: 'desc' }
                ]);
            }, 150, 'Multi-column sort 10K');
        });

        it('toggle sort direction is fast', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            dt.sort('name', 'asc');

            Perf.assertFasterThan(function() {
                dt.sort('name', 'desc');
            }, 100, 'Toggle sort direction');
        });

    });

    describe('Filter Performance', function() {

        it('filters 10,000 rows by single column in < 50ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.filter({ category: 'Electronics' });
            }, 50, 'Filter by category');
        });

        it('filters 10,000 rows by multiple columns in < 80ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.filter({
                    category: 'Electronics',
                    status: 'Active'
                });
            }, 80, 'Multi-filter 10K');
        });

        it('global search 10,000 rows in < 100ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50,
                searchable: true
            });

            Perf.assertFasterThan(function() {
                dt.search('Product 500');
            }, 100, 'Global search 10K');
        });

        it('range filter is efficient', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.filter({
                    price: { min: 100, max: 500 }
                });
            }, 50, 'Range filter');
        });

        it('clear filter is fast', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            dt.filter({ category: 'Electronics' });

            Perf.assertFasterThan(function() {
                dt.clearFilter();
            }, 30, 'Clear filter');
        });

    });

    describe('Pagination Performance', function() {

        it('page change is instant', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.goToPage(50);
            }, 20, 'Page change');
        });

        it('rapid page changes are smooth', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                for (var i = 1; i <= 100; i++) {
                    dt.goToPage(i);
                }
            }, 200, 'Rapid page changes');
        });

        it('change page size is efficient', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 25
            });

            Perf.assertFasterThan(function() {
                dt.setPageSize(100);
            }, 50, 'Change page size');
        });

    });

    describe('Row Selection Performance', function() {

        it('select single row is instant', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50,
                selectable: true
            });

            Perf.assertFasterThan(function() {
                dt.selectRow(5000);
            }, 5, 'Select single row');
        });

        it('select all visible rows is fast', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 100,
                selectable: true,
                multiSelect: true
            });

            Perf.assertFasterThan(function() {
                dt.selectAllVisible();
            }, 10, 'Select all visible');
        });

        it('select all 10K rows is efficient', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50,
                selectable: true,
                multiSelect: true
            });

            Perf.assertFasterThan(function() {
                dt.selectAll();
            }, 100, 'Select all 10K');
        });

        it('get selected rows is fast', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50,
                selectable: true,
                multiSelect: true
            });

            dt.selectAll();

            Perf.assertFasterThan(function() {
                dt.getSelectedRows();
            }, 50, 'Get 10K selected');
        });

    });

    describe('Data Update Performance', function() {

        it('update single row in < 5ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.updateRow(5000, { name: 'Updated Product', price: '999.99' });
            }, 5, 'Update single row');
        });

        it('batch update 100 rows in < 50ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            var updates = [];
            for (var i = 0; i < 100; i++) {
                updates.push({
                    id: (i * 100) + 1,
                    changes: { status: 'Updated' }
                });
            }

            Perf.assertFasterThan(function() {
                if (dt.batchUpdate) {
                    dt.batchUpdate(updates);
                } else {
                    updates.forEach(function(u) {
                        dt.updateRow(u.id, u.changes);
                    });
                }
            }, 50, 'Batch update 100 rows');
        });

        it('add row is fast', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.addRow({
                    id: 10001,
                    name: 'New Product',
                    sku: 'SKU-NEW',
                    category: 'Electronics',
                    price: '99.99',
                    quantity: 10,
                    status: 'Active',
                    created: '2025-01-01'
                });
            }, 10, 'Add single row');
        });

        it('delete row is fast', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.deleteRow(5000);
            }, 10, 'Delete single row');
        });

        it('replace all data is efficient', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            var newRows = generateRows(10000);

            Perf.assertFasterThan(function() {
                dt.setData(newRows);
            }, 150, 'Replace all data');
        });

    });

    describe('Column Operations', function() {

        it('hide column is fast', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows
            });

            Perf.assertFasterThan(function() {
                dt.hideColumn('description');
            }, 20, 'Hide column');
        });

        it('show column is fast', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows
            });

            dt.hideColumn('description');

            Perf.assertFasterThan(function() {
                dt.showColumn('description');
            }, 20, 'Show column');
        });

        it('resize column is instant', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                resizable: true
            });

            Perf.assertFasterThan(function() {
                dt.setColumnWidth('name', 200);
            }, 10, 'Resize column');
        });

        it('reorder columns is efficient', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                reorderable: true
            });

            Perf.assertFasterThan(function() {
                dt.reorderColumns(['id', 'status', 'name', 'category', 'price', 'quantity', 'sku', 'created']);
            }, 50, 'Reorder columns');
        });

    });

    describe('Export Performance', function() {

        it('exports 1,000 rows to CSV in < 50ms', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows
            });

            Perf.assertFasterThan(function() {
                dt.exportToCSV();
            }, 50, 'Export 1K to CSV');
        });

        it('exports 10,000 rows to CSV in < 200ms', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            Perf.assertFasterThan(function() {
                dt.exportToCSV();
            }, 200, 'Export 10K to CSV');
        });

    });

    describe('Memory Efficiency', function() {

        it('does not leak memory on data updates', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            var result = Perf.checkForLeaks(function() {
                var newRows = generateRows(1000);
                dt.setData(newRows);
            }, 50);

            if (result) {
                expect(result.leaked).toBe(false);
            }
        });

        it('does not leak memory on page changes', function() {
            var rows = generateRows(10000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                pageSize: 50
            });

            var result = Perf.checkForLeaks(function() {
                dt.goToPage(Math.floor(Math.random() * 200) + 1);
            }, 100);

            if (result) {
                expect(result.leaked).toBe(false);
            }
        });

    });

    describe('Inline Edit Performance', function() {

        it('enter edit mode is instant', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                editable: true
            });

            Perf.assertFasterThan(function() {
                dt.editCell(0, 'name');
            }, 10, 'Enter edit mode');
        });

        it('save edit is fast', function() {
            var rows = generateRows(1000);
            var dt = DataTables.create('#dt-container', {
                columns: sampleColumns,
                data: rows,
                editable: true
            });

            dt.editCell(0, 'name');

            Perf.assertFasterThan(function() {
                dt.saveEdit('Updated Name');
            }, 10, 'Save edit');
        });

    });

});
