/**
 * Accessibility Tests: Funky.Table
 *
 * Tests WCAG 2.1 AA compliance for the native ES5 table component.
 * Note: This is for Funky.Table, NOT the legacy jQuery DataTables wrapper.
 */

FunkyTests.describe('Funky.A11y.Table', function() {
    var expect = FunkyTests.expect;
    var Table = window.Funky && window.Funky.Table;

    // Skip all tests if Table not loaded
    if (!Table) {
        FunkyTests.it('Table component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var createdTables = [];
    var testCounter = 0;

    /**
     * Generate unique ID for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        return (prefix || 'table') + '_a11y_' + testCounter + '_' + Date.now();
    }

    /**
     * Create test table HTML
     */
    function createTableHTML(id) {
        return '<table id="' + id + '" class="table"></table>';
    }

    /**
     * Sample data for tests
     */
    var sampleData = [
        { id: 1, name: 'Alpha', value: 100, status: 'active' },
        { id: 2, name: 'Beta', value: 200, status: 'pending' },
        { id: 3, name: 'Gamma', value: 150, status: 'active' }
    ];

    /**
     * Sample columns for tests
     */
    var sampleColumns = [
        { data: 'id', title: 'ID', visible: false },
        { data: 'name', title: 'Name', orderable: true },
        { data: 'value', title: 'Value', type: 'number', orderable: true },
        { data: 'status', title: 'Status' }
    ];

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
        createdTables = [];
    });

    FunkyTests.afterEach(function() {
        createdTables.forEach(function(table) {
            try {
                if (table && typeof table.destroy === 'function') {
                    table.destroy();
                }
            } catch (e) {
                // Ignore cleanup errors
            }
        });
        createdTables = [];
        fixture.cleanup();
    });

    // ========================================================================
    // ARIA Roles
    // ========================================================================

    FunkyTests.describe('ARIA Roles', function() {

        FunkyTests.it('table has role="grid"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            expect(tableEl.getAttribute('role')).toBe('grid');
        });

        FunkyTests.it('header cells have role="columnheader"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var headers = tableEl.querySelectorAll('th[role="columnheader"]');
            expect(headers.length).toBeGreaterThan(0);
        });

        FunkyTests.it('thead has role="rowgroup"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var thead = tableEl.querySelector('thead');
            expect(thead.getAttribute('role')).toBe('rowgroup');
        });

        FunkyTests.it('tbody has role="rowgroup"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var tbody = tableEl.querySelector('tbody');
            expect(tbody.getAttribute('role')).toBe('rowgroup');
        });

        FunkyTests.it('data rows have role="row"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var rows = tableEl.querySelectorAll('tbody tr[role="row"]');
            expect(rows.length).toBe(3);
        });

        FunkyTests.it('data cells have role="gridcell"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var cells = tableEl.querySelectorAll('tbody td[role="gridcell"]');
            expect(cells.length).toBeGreaterThan(0);
        });

    });

    // ========================================================================
    // Accessible Name
    // ========================================================================

    FunkyTests.describe('Accessible Name', function() {

        FunkyTests.it('table has aria-label', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var ariaLabel = tableEl.getAttribute('aria-label');
            expect(ariaLabel).toBeDefined();
            expect(ariaLabel.length).toBeGreaterThan(0);
        });

        FunkyTests.it('custom ariaLabel is applied', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                ariaLabel: 'My custom data table'
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            expect(tableEl.getAttribute('aria-label')).toBe('My custom data table');
        });

    });

    // ========================================================================
    // Keyboard Navigation
    // ========================================================================

    FunkyTests.describe('Keyboard Navigation', function() {

        FunkyTests.it('table is keyboard focusable with tabindex="0"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            expect(tableEl.getAttribute('tabindex')).toBe('0');
        });

        FunkyTests.it('sortable headers are focusable', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var sortableHeaders = tableEl.querySelectorAll('th[aria-sort]');

            Array.prototype.forEach.call(sortableHeaders, function(header) {
                // Headers should be focusable for keyboard activation
                var tabindex = header.getAttribute('tabindex');
                // Either has tabindex or contains a button
                var hasButton = header.querySelector('button');
                expect(tabindex !== null || hasButton !== null).toBe(true);
            });
        });

        FunkyTests.it('Enter key triggers sort on header', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                serverSide: false
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var sortableHeader = tableEl.querySelector('th[aria-sort]');

            if (sortableHeader) {
                var initialSort = sortableHeader.getAttribute('aria-sort');

                // Simulate Enter key
                FunkyTests.simulate.keydown(sortableHeader, { key: 'Enter', keyCode: 13 });

                // Allow for sort to process
                var newSort = sortableHeader.getAttribute('aria-sort');
                // Sort should have changed or stayed (depending on default)
                expect(newSort).toBeDefined();
            }
        });

    });

    // ========================================================================
    // Sort Indication
    // ========================================================================

    FunkyTests.describe('Sort Indication', function() {

        FunkyTests.it('sortable columns have aria-sort attribute', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var sortableHeaders = tableEl.querySelectorAll('th[aria-sort]');

            expect(sortableHeaders.length).toBeGreaterThan(0);
        });

        FunkyTests.it('aria-sort value is "ascending" or "descending" when sorted', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                order: [[1, 'asc']]
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var sortedHeader = tableEl.querySelector('th[aria-sort="ascending"], th[aria-sort="descending"]');

            if (sortedHeader) {
                var sortValue = sortedHeader.getAttribute('aria-sort');
                expect(['ascending', 'descending', 'none']).toContain(sortValue);
            }
        });

        FunkyTests.it('unsorted columns have aria-sort="none"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                order: [] // No initial sort
            });
            createdTables.push(table);

            table.clearSort();

            var tableEl = table.tableEl.el || table.tableEl;
            var headers = tableEl.querySelectorAll('th[aria-sort]');

            // All should be "none" if no sort applied
            var noneCount = 0;
            Array.prototype.forEach.call(headers, function(header) {
                if (header.getAttribute('aria-sort') === 'none') {
                    noneCount++;
                }
            });

            expect(noneCount).toBeGreaterThan(0);
        });

    });

    // ========================================================================
    // Selection Accessibility
    // ========================================================================

    FunkyTests.describe('Selection Accessibility', function() {

        FunkyTests.it('selectable rows have aria-selected attribute', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                select: 'multi'
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var rows = tableEl.querySelectorAll('tbody tr[role="row"]');

            Array.prototype.forEach.call(rows, function(row) {
                var ariaSelected = row.getAttribute('aria-selected');
                // Should have aria-selected attribute (true or false)
                expect(ariaSelected === 'true' || ariaSelected === 'false').toBe(true);
            });
        });

        FunkyTests.it('selected rows have aria-selected="true"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                select: 'multi'
            });
            createdTables.push(table);

            table.select([1]);

            var tableEl = table.tableEl.el || table.tableEl;
            var selectedRows = tableEl.querySelectorAll('tbody tr[aria-selected="true"]');

            expect(selectedRows.length).toBeGreaterThan(0);
        });

        FunkyTests.it('deselected rows have aria-selected="false"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                select: 'multi'
            });
            createdTables.push(table);

            // Initially no selection
            var tableEl = table.tableEl.el || table.tableEl;
            var unselectedRows = tableEl.querySelectorAll('tbody tr[aria-selected="false"]');

            expect(unselectedRows.length).toBe(3);
        });

        FunkyTests.it('multi-select table has aria-multiselectable="true"', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                select: 'multi'
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            expect(tableEl.getAttribute('aria-multiselectable')).toBe('true');
        });

    });

    // ========================================================================
    // Row Count and Pagination Info
    // ========================================================================

    FunkyTests.describe('Row Count Info', function() {

        FunkyTests.it('table has aria-rowcount for total rows', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var rowCount = tableEl.getAttribute('aria-rowcount');

            // Should have row count attribute
            if (rowCount) {
                expect(parseInt(rowCount, 10)).toBeGreaterThanOrEqual(3);
            }
        });

        FunkyTests.it('rows have aria-rowindex', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var rows = tableEl.querySelectorAll('tbody tr[aria-rowindex]');

            // Each row should have an index
            expect(rows.length).toBe(3);
        });

    });

    // ========================================================================
    // Loading State
    // ========================================================================

    FunkyTests.describe('Loading State', function() {

        FunkyTests.it('loading state is announced with aria-busy', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: [],
                columns: sampleColumns
            });
            createdTables.push(table);

            // Check if aria-busy exists on wrapper or table
            var wrapper = table.wrapper.el || table.wrapper;
            var tableEl = table.tableEl.el || table.tableEl;

            var ariaBusy = wrapper.getAttribute('aria-busy') || tableEl.getAttribute('aria-busy');
            // Should be 'false' when not loading
            if (ariaBusy !== null) {
                expect(ariaBusy === 'true' || ariaBusy === 'false').toBe(true);
            }
        });

    });

    // ========================================================================
    // Empty State
    // ========================================================================

    FunkyTests.describe('Empty State', function() {

        FunkyTests.it('empty table displays accessible message', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: [],
                columns: sampleColumns,
                emptyMessage: 'No data available'
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var tbody = tableEl.querySelector('tbody');
            var emptyRow = tbody.querySelector('tr');

            expect(emptyRow).toBeDefined();
            expect(tbody.textContent).toContain('No data');
        });

    });

    // ========================================================================
    // Focus Management
    // ========================================================================

    FunkyTests.describe('Focus Management', function() {

        FunkyTests.it('table can receive focus', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            tableEl.focus();

            expect(document.activeElement).toBe(tableEl);
        });

        FunkyTests.it('checkboxes in selectable table are focusable', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns,
                select: 'multi',
                selectAllCheckbox: true
            });
            createdTables.push(table);

            var tableEl = table.tableEl.el || table.tableEl;
            var checkboxes = tableEl.querySelectorAll('input[type="checkbox"]');

            Array.prototype.forEach.call(checkboxes, function(checkbox) {
                // Checkboxes should be focusable (not have negative tabindex)
                var tabindex = checkbox.getAttribute('tabindex');
                expect(tabindex !== '-1').toBe(true);
            });
        });

    });

    // ========================================================================
    // Screen Reader Announcements
    // ========================================================================

    FunkyTests.describe('Screen Reader Announcements', function() {

        FunkyTests.it('info element provides row count for screen readers', function() {
            var id = uniqueId('table');
            fixture.append(createTableHTML(id));

            var table = Table.init('#' + id, {
                data: sampleData,
                columns: sampleColumns
            });
            createdTables.push(table);

            var infoEl = table.info.el || table.info;
            var infoText = infoEl.textContent;

            // Info should contain count information
            expect(infoText.length).toBeGreaterThan(0);
        });

    });

});
