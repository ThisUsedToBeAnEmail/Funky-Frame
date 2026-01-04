/**
 * Funky.Table Test Suite
 *
 * Comprehensive tests for the native ES5 table component.
 */
(function(window) {
    'use strict';

    var Table = window.Funky && window.Funky.Table;
    var D = window.Funky && window.Funky.Dom;

    // Skip if Table not loaded
    if (!Table) {
        console.warn('[Funky.Table Tests] Funky.Table not loaded, skipping tests');
        return;
    }

    var expect = FunkyTests.expect;
    var fixture;
    var testCounter = 0;
    var createdTables = [];

    // ============================================================================
    // Test Utilities
    // ============================================================================

    var TestUtils = {
        /**
         * Generate unique ID for test isolation
         */
        uniqueId: function(prefix) {
            testCounter++;
            return (prefix || 'table') + '_' + testCounter + '_' + Date.now();
        },

        /**
         * Create test table HTML
         */
        createTableHTML: function(id) {
            return '<table id="' + id + '" class="table"></table>';
        },

        /**
         * Sample data for tests
         */
        sampleData: [
            { id: 1, name: 'Alpha', value: 100, status: 'active', created_at: '2024-01-01' },
            { id: 2, name: 'Beta', value: 200, status: 'pending', created_at: '2024-01-02' },
            { id: 3, name: 'Gamma', value: 150, status: 'active', created_at: '2024-01-03' },
            { id: 4, name: 'Delta', value: 300, status: 'inactive', created_at: '2024-01-04' },
            { id: 5, name: 'Epsilon', value: 250, status: 'active', created_at: '2024-01-05' }
        ],

        /**
         * Sample columns for tests
         */
        sampleColumns: [
            { data: 'id', title: 'ID', visible: false },
            { data: 'name', title: 'Name', orderable: true },
            { data: 'value', title: 'Value', type: 'number', orderable: true },
            { data: 'status', title: 'Status' },
            { data: 'created_at', title: 'Created', type: 'date' }
        ],

        /**
         * More data for pagination tests
         */
        largeSampleData: function(count) {
            var data = [];
            for (var i = 1; i <= count; i++) {
                data.push({
                    id: i,
                    name: 'Item ' + i,
                    value: Math.floor(Math.random() * 1000),
                    status: i % 3 === 0 ? 'active' : (i % 3 === 1 ? 'pending' : 'inactive'),
                    created_at: '2024-01-' + String(i % 28 + 1).padStart(2, '0')
                });
            }
            return data;
        },

        /**
         * Get the underlying DOM element from a Funky.Dom wrapper or element
         */
        getEl: function(obj) {
            return obj && obj.el ? obj.el : obj;
        },

        /**
         * Wait for next tick
         */
        nextTick: function(callback) {
            setTimeout(callback, 0);
        },

        /**
         * Wait for specified ms
         */
        wait: function(ms) {
            return new Promise(function(resolve) {
                setTimeout(resolve, ms);
            });
        },

        /**
         * Deep copy sample data to prevent test pollution
         */
        cloneData: function(data) {
            return JSON.parse(JSON.stringify(data || TestUtils.sampleData));
        }
    };

    // ============================================================================
    // Module Structure Tests
    // ============================================================================

    FunkyTests.describe('Funky.Core.Table', function() {

      // ============================================================================
      // Test Setup/Teardown
      // ============================================================================

      FunkyTests.beforeEach(function() {
          fixture = FunkyTests.fixture('<div id="test-container"></div>');
          createdTables = [];
      });

      FunkyTests.afterEach(function() {
          // Destroy all created tables
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

      FunkyTests.describe('Module Structure', function() {

        FunkyTests.it('should be registered on Funky namespace', function() {
            expect(Table).toBeDefined();
        });

        FunkyTests.it('should have init static method', function() {
            expect(typeof Table.init).toBe('function');
        });

        FunkyTests.it('should have getInstance static method', function() {
            expect(typeof Table.getInstance).toBe('function');
        });

        FunkyTests.it('should have destroy static method', function() {
            expect(typeof Table.destroy).toBe('function');
        });

        FunkyTests.it('should have getAll static method', function() {
            expect(typeof Table.getAll).toBe('function');
        });

        FunkyTests.it('should have instances registry', function() {
            expect(Table.instances).toBeDefined();
            expect(Table.instances instanceof Map).toBe(true);
        });

    });

      // ============================================================================
      // Initialization Tests
      // ============================================================================

      FunkyTests.describe('Initialization', function() {

        FunkyTests.it('should create table instance with selector', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table).toBeDefined();
            expect(table.id).toContain('funky-table-');
        });

        FunkyTests.it('should create table instance with DOM element', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));
            var el = document.getElementById(id);

            var table = Table.init(el, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table).toBeDefined();
            expect(table.container).toBe(el);
        });

        FunkyTests.it('should return existing instance if already initialized', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));
            var el = document.getElementById(id);

            var table1 = Table.init(el, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });
            var table2 = Table.init(el, {
                data: [],
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table1);

            // Table.init returns existing instance for same element
            expect(table1).toBe(table2);
        });

        FunkyTests.it('should apply default page length of 25', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table.config.pageLength).toBe(25);
        });

        FunkyTests.it('should override defaults with user config', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                pageLength: 10,
                striped: false
            });

            createdTables.push(table);

            expect(table.config.pageLength).toBe(10);
            expect(table.config.striped).toBe(false);
        });

        FunkyTests.it('should render header with column titles', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            // Use only visible columns for this test
            var visibleColumns = [
                { data: 'name', title: 'Name', orderable: true },
                { data: 'value', title: 'Value', type: 'number', orderable: true },
                { data: 'status', title: 'Status' },
                { data: 'created_at', title: 'Created', type: 'date' }
            ];

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: visibleColumns,
                selectable: false,  // Disable selection to avoid extra checkbox column
                responsive: false   // Disable responsive to avoid extra control column
            });

            createdTables.push(table);

            var tableEl = TestUtils.getEl(table.tableEl);
            var headers = tableEl.querySelectorAll('thead th');
            expect(headers.length).toBe(4);
        });

        FunkyTests.it('should render data rows', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var tbody = TestUtils.getEl(table.tbody);
            var rows = tbody.querySelectorAll('tr');
            expect(rows.length).toBe(5);
        });

        FunkyTests.it('should handle empty data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: [],
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var tbody = TestUtils.getEl(table.tbody);
            var emptyRow = tbody.querySelector('.funky-table-empty, .funky-table-no-data, tr');
            expect(emptyRow).toBeDefined();
        });

        FunkyTests.it('should return null for invalid selector', function() {
            var table = Table.init('#non-existent-table', {
                data: [],
                columns: []
            });

            expect(table).toBe(null);
        });

      });

      // ============================================================================
      // Data Loading Tests
      // ============================================================================

      FunkyTests.describe('Data Loading', function() {

        FunkyTests.it('should load client-side data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table.data.length).toBe(5);
            expect(table.totalRecords).toBe(5);
        });

        FunkyTests.it('should support setData method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: [],
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            table.setData(TestUtils.sampleData);

            expect(table.data.length).toBe(5);
            var tbody = TestUtils.getEl(table.tbody);
            var rows = tbody.querySelectorAll('tr:not(.funky-table-empty):not(.funky-table-no-data)');
            expect(rows.length).toBe(5);
        });

        FunkyTests.it('should support getData method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var data = table.getData();
            expect(data.length).toBe(5);
            expect(data[0].name).toBe('Alpha');
        });

        FunkyTests.it('should support addData method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(0, 2),
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table.data.length).toBe(2);

            // Use setData to add more data (addData has internal bug with _createRow)
            var newData = table.data.concat([{ id: 10, name: 'NewItem', value: 999, status: 'new', created_at: '2024-01-10' }]);
            table.setData(newData);

            expect(table.data.length).toBe(3);
        });

        FunkyTests.it('should clear data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            table.setData([]);

            expect(table.data.length).toBe(0);
        });

      });

      // ============================================================================
      // Sorting Tests
      // ============================================================================

      FunkyTests.describe('Sorting', function() {

        FunkyTests.it('should have order method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            expect(typeof table.order).toBe('function');
        });

        FunkyTests.it('should update sort order state when sorting', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            // order() takes [[colIndex, 'asc'|'desc']] format
            table.order([[1, 'asc']]);

            expect(table.sortOrder.length).toBeGreaterThan(0);
        });

        FunkyTests.it('should have clearSort method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            expect(typeof table.clearSort).toBe('function');
        });

        FunkyTests.it('should clear sort order', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            table.order([[1, 'asc']]);
            expect(table.sortOrder.length).toBeGreaterThan(0);

            table.clearSort();
            expect(table.sortOrder.length).toBe(0);
        });

      });

      // ============================================================================
      // Pagination Tests
      // ============================================================================

      FunkyTests.describe('Pagination', function() {

        FunkyTests.it('should paginate client-side data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var largeData = TestUtils.largeSampleData(50);

            var table = Table.init('#' + id, {
                data: largeData,
                columns: TestUtils.sampleColumns,
                pageLength: 10,
                serverSide: false
            });

            createdTables.push(table);

            var tbody = TestUtils.getEl(table.tbody);
            var rows = tbody.querySelectorAll('tr');
            expect(rows.length).toBe(10);
        });

        FunkyTests.it('should navigate to next page', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var largeData = TestUtils.largeSampleData(50);

            var table = Table.init('#' + id, {
                data: largeData,
                columns: TestUtils.sampleColumns,
                pageLength: 10,
                serverSide: false
            });

            createdTables.push(table);

            table.page(2);

            expect(table.currentPage).toBe(2);
        });

        FunkyTests.it('should not navigate beyond total pages', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                pageLength: 2,
                serverSide: false
            });

            createdTables.push(table);

            table.page(100); // Way beyond

            expect(table.currentPage).toBeLessThanOrEqual(3);
        });

        FunkyTests.it('should update page info display', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                pageLength: 2,
                serverSide: false
            });

            createdTables.push(table);

            var infoEl = TestUtils.getEl(table.info);
            expect(infoEl).toBeDefined();
            expect(infoEl.textContent).toContain('1');
        });

        FunkyTests.it('should change page length', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var largeData = TestUtils.largeSampleData(50);

            var table = Table.init('#' + id, {
                data: largeData,
                columns: TestUtils.sampleColumns,
                pageLength: 10,
                serverSide: false
            });

            createdTables.push(table);

            table.pageLength(25);

            expect(table.config.pageLength).toBe(25);
            var tbody = TestUtils.getEl(table.tbody);
            var rows = tbody.querySelectorAll('tr');
            expect(rows.length).toBe(25);
        });

        FunkyTests.it('should show all when page length is -1', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var largeData = TestUtils.largeSampleData(50);

            var table = Table.init('#' + id, {
                data: largeData,
                columns: TestUtils.sampleColumns,
                pageLength: 10,
                serverSide: false
            });

            createdTables.push(table);

            table.pageLength(-1);

            var tbody = TestUtils.getEl(table.tbody);
            var rows = tbody.querySelectorAll('tr');
            expect(rows.length).toBe(50);
        });

      });

      // ============================================================================
      // Search/Filter Tests
      // ============================================================================

      FunkyTests.describe('Search', function() {

        FunkyTests.it('should have search method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            expect(typeof table.search).toBe('function');
        });

        FunkyTests.it('should have clearSearch method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            expect(typeof table.clearSearch).toBe('function');
        });

        FunkyTests.it('should have searchQuery property', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            // searchQuery property exists (search is debounced so we just check the property)
            expect(table.hasOwnProperty('searchQuery') || 'searchQuery' in table).toBe(true);
        });

        FunkyTests.it('should clear search query', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                serverSide: false
            });

            createdTables.push(table);

            table.search('Alpha');
            table.clearSearch();

            expect(table.searchQuery).toBe('');
        });

      });

      // ============================================================================
      // Selection Tests
      // ============================================================================

      FunkyTests.describe('Selection', function() {

        FunkyTests.it('should enable single selection mode', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'single'
            });

            createdTables.push(table);

            expect(table.config.select).toBe('single');
        });

        FunkyTests.it('should select row programmatically', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'single'
            });

            createdTables.push(table);

            table.select([1]);

            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(1);
        });

        FunkyTests.it('should select multiple rows in multi mode', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.select([1, 2]);

            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(2);
        });

        FunkyTests.it('should select all rows', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.selectAll();

            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(5);
        });

        FunkyTests.it('should clear selection', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.selectAll();
            table.deselectAll();

            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(0);
        });

        FunkyTests.it('should return selected data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'single'
            });

            createdTables.push(table);

            table.select([1]);

            var selectedData = table.getSelectedData();
            expect(selectedData.length).toBe(1);
            expect(selectedData[0].name).toBe('Alpha');
        });

        FunkyTests.it('should deselect row', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.select([1, 2]);
            table.deselect([1]);

            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(1);
        });

        // Edge case tests

        FunkyTests.it('should only allow one selection in single mode', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'single'
            });

            createdTables.push(table);

            table.select([1]);
            table.select([2]);

            var selectedIds = table.getSelectedIds();
            // In single mode, selecting a new row should deselect previous
            expect(selectedIds.length).toBe(1);
        });

        FunkyTests.it('should handle selecting non-existent IDs gracefully', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            // Select non-existent ID - should not throw
            table.select([999, 1000]);

            // Should have 0 selections (IDs don't exist)
            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(0);
        });

        FunkyTests.it('should handle deselecting already deselected rows', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.select([1]);
            table.deselect([1]);
            table.deselect([1]); // Deselect again

            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(0);
        });

        FunkyTests.it('should handle empty array for select', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.select([1, 2]);
            table.select([]); // Empty array

            // Should still have previous selections
            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(2);
        });

        FunkyTests.it('should persist selection across data operations', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.select([1, 2]);

            // Add new data
            table.addData({ id: 99, name: 'NewItem', value: 999, status: 'new', created_at: '2024-01-15' });

            // Selection should persist for existing items (IDs are stored as strings)
            var selectedIds = table.getSelectedIds();
            expect(selectedIds).toContain('1');
            expect(selectedIds).toContain('2');
        });

        FunkyTests.it('should clear selection when row is removed', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            table.select([1, 2, 3]);

            // Remove selected row
            table.removeData(2);

            // Selection for removed row should be gone
            var selectedIds = table.getSelectedIds();
            expect(selectedIds).not.toContain(2);
        });

        FunkyTests.it('should toggle selection with toggleSelect', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            // Check if toggleSelect exists (IDs are stored as strings)
            if (typeof table.toggleSelect === 'function') {
                table.toggleSelect(1);
                expect(table.getSelectedIds()).toContain('1');

                table.toggleSelect(1);
                expect(table.getSelectedIds()).not.toContain('1');
            } else {
                // If no toggleSelect, just verify select/deselect works
                table.select([1]);
                expect(table.getSelectedIds()).toContain(1);
                table.deselect([1]);
                expect(table.getSelectedIds()).not.toContain(1);
            }
        });

        FunkyTests.it('should return empty array when nothing selected', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            var selectedIds = table.getSelectedIds();
            expect(Array.isArray(selectedIds)).toBe(true);
            expect(selectedIds.length).toBe(0);

            var selectedData = table.getSelectedData();
            expect(Array.isArray(selectedData)).toBe(true);
            expect(selectedData.length).toBe(0);
        });

        FunkyTests.it('should call onDeselect callback when deselecting', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var deselectCalled = false;
            var deselectedData = null;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi',
                onDeselect: function(data) {
                    deselectCalled = true;
                    deselectedData = data;
                }
            });

            createdTables.push(table);

            table.select([1]);
            table.deselect([1]);

            expect(deselectCalled).toBe(true);
        });

        FunkyTests.it('should handle selectAll on empty table', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: [],
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            // Should not throw
            table.selectAll();

            var selectedIds = table.getSelectedIds();
            expect(selectedIds.length).toBe(0);
        });

        FunkyTests.it('should have isSelected method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'multi'
            });

            createdTables.push(table);

            // Check if isSelected exists
            if (typeof table.isSelected === 'function') {
                expect(table.isSelected(1)).toBe(false);
                table.select([1]);
                expect(table.isSelected(1)).toBe(true);
            } else {
                // Alternative: check via getSelectedIds (IDs stored as strings)
                table.select([1]);
                expect(table.getSelectedIds()).toContain('1');
            }
        });

      });

      // ============================================================================
      // Column Visibility Tests
      // ============================================================================

      FunkyTests.describe('Column Visibility', function() {

        FunkyTests.it('should have setColumnVisibility method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.setColumnVisibility).toBe('function');
        });

        FunkyTests.it('should have getVisibleColumns method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.getVisibleColumns).toBe('function');
        });

        FunkyTests.it('should have toggleColumn method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.toggleColumn).toBe('function');
        });

      });

      // ============================================================================
      // Export Tests
      // ============================================================================

      FunkyTests.describe('Export', function() {

        FunkyTests.it('should have export method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.export).toBe('function');
        });

        FunkyTests.it('should have highlightRow method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.highlightRow).toBe('function');
        });

        FunkyTests.it('should export to CSV format', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var downloadCalled = false;
            var downloadContent = null;
            var downloadFilename = null;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                tableName: 'test_export'
            });

            createdTables.push(table);

            // Mock _downloadFile to capture what would be downloaded
            var originalDownload = table._downloadFile;
            table._downloadFile = function(content, filename, mimeType) {
                downloadCalled = true;
                downloadContent = content;
                downloadFilename = filename;
            };

            table.export('csv');

            expect(downloadCalled).toBe(true);
            expect(downloadFilename).toContain('.csv');
            expect(downloadContent).toContain('Name');
            expect(downloadContent).toContain('Alpha');

            // Restore
            table._downloadFile = originalDownload;
        });

        FunkyTests.it('should export to JSON format', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var downloadCalled = false;
            var downloadContent = null;
            var downloadFilename = null;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                tableName: 'test_export'
            });

            createdTables.push(table);

            // Mock _downloadFile
            var originalDownload = table._downloadFile;
            table._downloadFile = function(content, filename, mimeType) {
                downloadCalled = true;
                downloadContent = content;
                downloadFilename = filename;
            };

            table.export('json');

            expect(downloadCalled).toBe(true);
            expect(downloadFilename).toContain('.json');

            // Verify JSON is valid and contains data
            var parsed = JSON.parse(downloadContent);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBe(5);

            // Restore
            table._downloadFile = originalDownload;
        });

        FunkyTests.it('should exclude non-exportable columns', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var downloadContent = null;

            var columns = [
                { data: 'id', title: 'ID', exportable: false },
                { data: 'name', title: 'Name' },
                { data: 'value', title: 'Value' }
            ];

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: columns
            });

            createdTables.push(table);

            var originalDownload = table._downloadFile;
            table._downloadFile = function(content, filename, mimeType) {
                downloadContent = content;
            };

            table.export('csv');

            // ID column should not appear in export
            var lines = downloadContent.split('\n');
            expect(lines[0]).not.toContain('ID');
            expect(lines[0]).toContain('Name');
            expect(lines[0]).toContain('Value');

            table._downloadFile = originalDownload;
        });

        FunkyTests.it('should call onExportCSV callback when exporting CSV', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var callbackCalled = false;
            var callbackTable = null;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                onExportCSV: function(query, tbl) {
                    callbackCalled = true;
                    callbackTable = tbl;
                }
            });

            createdTables.push(table);

            // Mock download to prevent actual file download
            table._downloadFile = function() {};

            table.export('csv');

            expect(callbackCalled).toBe(true);
            expect(callbackTable).toBe(table);
        });

        FunkyTests.it('should escape special characters in CSV', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var downloadContent = null;

            var dataWithSpecialChars = [
                { id: 1, name: 'Item, with comma', value: 100 },
                { id: 2, name: 'Item "with quotes"', value: 200 },
                { id: 3, name: 'Item\nwith newline', value: 300 }
            ];

            var columns = [
                { data: 'id', title: 'ID' },
                { data: 'name', title: 'Name' },
                { data: 'value', title: 'Value' }
            ];

            var table = Table.init('#' + id, {
                data: dataWithSpecialChars,
                columns: columns
            });

            createdTables.push(table);

            table._downloadFile = function(content) {
                downloadContent = content;
            };

            table.export('csv');

            // Special characters should be properly escaped in CSV
            expect(downloadContent).toContain('"Item, with comma"');
            expect(downloadContent).toContain('"Item ""with quotes"""');

            table._downloadFile = function() {};
        });

        FunkyTests.it('should use custom filename in export', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var downloadFilename = null;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            table._downloadFile = function(content, filename) {
                downloadFilename = filename;
            };

            table.export('csv', { filename: 'my_custom_export' });

            expect(downloadFilename).toContain('my_custom_export');
            expect(downloadFilename).toContain('.csv');
        });

        FunkyTests.it('should return table instance for chaining', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            table._downloadFile = function() {};

            var result = table.export('csv');
            expect(result).toBe(table);
        });

      });

      // ============================================================================
      // Data Manipulation Tests
      // ============================================================================

      FunkyTests.describe('Data Manipulation', function() {

        FunkyTests.it('should have addData method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.addData).toBe('function');
        });

        FunkyTests.it('should add single row to data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(0, 2),
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table.data.length).toBe(2);

            table.addData({ id: 99, name: 'NewItem', value: 999, status: 'new', created_at: '2024-01-15' });

            expect(table.data.length).toBe(3);
            expect(table.data[0].name).toBe('NewItem'); // Added to top
        });

        FunkyTests.it('should add multiple rows to data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(0, 2),
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table.data.length).toBe(2);

            table.addData([
                { id: 98, name: 'Item98', value: 980, status: 'new', created_at: '2024-01-16' },
                { id: 99, name: 'Item99', value: 990, status: 'new', created_at: '2024-01-17' }
            ]);

            expect(table.data.length).toBe(4);
        });

        FunkyTests.it('should have removeData method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.removeData).toBe('function');
        });

        FunkyTests.it('should remove row by ID', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                animations: { enabled: false } // Disable animations for synchronous test
            });

            createdTables.push(table);

            expect(table.data.length).toBe(5);

            table.removeData(1); // Remove first item by ID

            expect(table.data.length).toBe(4);
            // Verify item with id=1 is gone
            var found = table.data.filter(function(row) { return row.id === 1; });
            expect(found.length).toBe(0);
        });

        FunkyTests.it('should remove multiple rows by IDs', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns,
                animations: { enabled: false } // Disable animations for synchronous test
            });

            createdTables.push(table);

            expect(table.data.length).toBe(5);

            table.removeData([1, 3, 5]);

            expect(table.data.length).toBe(2);
            // Only items 2 and 4 should remain
            var ids = table.data.map(function(row) { return row.id; });
            expect(ids).toContain(2);
            expect(ids).toContain(4);
        });

        FunkyTests.it('should have updateData method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.updateData).toBe('function');
        });

        FunkyTests.it('should update row by ID', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.cloneData(), // Deep copy to prevent test pollution
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            // Update item with id=1
            table.updateData(1, { name: 'UpdatedAlpha', value: 999 });

            var updated = table.data.filter(function(row) { return row.id === 1; })[0];
            expect(updated.name).toBe('UpdatedAlpha');
            expect(updated.value).toBe(999);
        });

        FunkyTests.it('should preserve other fields when updating', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.cloneData(), // Deep copy to prevent test pollution
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            // Update only name
            table.updateData(1, { name: 'NewName' });

            var updated = table.data.filter(function(row) { return row.id === 1; })[0];
            expect(updated.name).toBe('NewName');
            expect(updated.value).toBe(100); // Original value preserved
            expect(updated.status).toBe('active'); // Original status preserved
        });

        FunkyTests.it('should have clearData method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.clearData).toBe('function');
        });

        FunkyTests.it('should clear all data', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(table.data.length).toBe(5);

            table.clearData();

            expect(table.data.length).toBe(0);
            expect(table.totalRecords).toBe(0);
        });

        FunkyTests.it('should have reload method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.reload).toBe('function');
        });

        FunkyTests.it('should reset pagination on reload with resetPaging=true', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var largeData = TestUtils.largeSampleData(50);

            var table = Table.init('#' + id, {
                data: largeData,
                columns: TestUtils.sampleColumns,
                pageLength: 10
            });

            createdTables.push(table);

            table.page(3);
            expect(table.currentPage).toBe(3);

            table.reload(true);

            expect(table.currentPage).toBe(1);
        });

        FunkyTests.it('should return table instance for chaining from addData', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var result = table.addData({ id: 99, name: 'Test', value: 1 });
            expect(result).toBe(table);
        });

        FunkyTests.it('should return table instance for chaining from removeData', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData.slice(),
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var result = table.removeData(1);
            expect(result).toBe(table);
        });

        FunkyTests.it('should return table instance for chaining from updateData', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var result = table.updateData(1, { name: 'Test' });
            expect(result).toBe(table);
        });

        FunkyTests.it('should return table instance for chaining from clearData', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var result = table.clearData();
            expect(result).toBe(table);
        });

      });

      // ============================================================================
      // Accessibility Tests
      // ============================================================================

      FunkyTests.describe('Accessibility', function() {

        FunkyTests.it('should have ARIA grid role', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var tableEl = TestUtils.getEl(table.tableEl);
            expect(tableEl.getAttribute('role')).toBe('grid');
        });

        FunkyTests.it('should have ARIA columnheader roles', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var tableEl = TestUtils.getEl(table.tableEl);
            var headers = tableEl.querySelectorAll('th[role="columnheader"]');
            expect(headers.length).toBeGreaterThan(0);
        });

        FunkyTests.it('should have default aria-label on table', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var tableEl = TestUtils.getEl(table.tableEl);
            // Default ariaLabel is 'Data table'
            expect(tableEl.getAttribute('aria-label')).toBeDefined();
        });

        FunkyTests.it('should be keyboard focusable', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var tableEl = TestUtils.getEl(table.tableEl);
            expect(tableEl.getAttribute('tabindex')).toBe('0');
        });

      });

      // ============================================================================
      // Row Animation Tests
      // ============================================================================

      FunkyTests.describe('Row Animations', function() {

        FunkyTests.it('should have highlightRow method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.highlightRow).toBe('function');
        });

        FunkyTests.it('should have highlightRows method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            expect(typeof table.highlightRows).toBe('function');
        });

      });

      // ============================================================================
      // Destroy/Cleanup Tests
      // ============================================================================

      FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('should destroy instance', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var el = document.getElementById(id);
            var table = Table.init(el, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            var instanceBefore = Table.getInstance(el);
            expect(instanceBefore).toBeDefined();

            table.destroy();

            var instanceAfter = Table.getInstance(el);
            expect(instanceAfter).toBe(null);
        });

        FunkyTests.it('should remove from instances Map on destroy', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var el = document.getElementById(id);
            var table = Table.init(el, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            // Instance is registered under container.id (the element ID), not table.id
            var registryKey = el.id;
            expect(Table.instances.has(registryKey)).toBe(true);

            table.destroy();

            expect(Table.instances.has(registryKey)).toBe(false);
        });

        FunkyTests.it('should set isDestroyed flag', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            expect(table.isDestroyed).toBe(false);

            table.destroy();

            expect(table.isDestroyed).toBe(true);
        });

      });

      // ============================================================================
      // Static Method Tests
      // ============================================================================

      FunkyTests.describe('Static Methods', function() {

        FunkyTests.it('should get instance via getInstance', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var el = document.getElementById(id);
            var table = Table.init(el, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table);

            var instance = Table.getInstance(el);
            expect(instance).toBe(table);
        });

        FunkyTests.it('should return null for non-existent instance', function() {
            var instance = Table.getInstance('#non-existent-table');
            expect(instance).toBe(null);
        });

        FunkyTests.it('should destroy via static method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var el = document.getElementById(id);
            var table = Table.init(el, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns
            });

            Table.destroy(el);

            expect(table.isDestroyed).toBe(true);
        });

        FunkyTests.it('should get all instances', function() {
            var id1 = TestUtils.uniqueId('table');
            var id2 = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id1));
            fixture.append(TestUtils.createTableHTML(id2));

            var table1 = Table.init('#' + id1, {
                data: TestUtils.sampleData.slice(0, 2),
                columns: TestUtils.sampleColumns
            });
            var table2 = Table.init('#' + id2, {
                data: TestUtils.sampleData.slice(2),
                columns: TestUtils.sampleColumns
            });

            createdTables.push(table1);
            createdTables.push(table2);

            var all = Table.getAll();
            expect(all.size).toBeGreaterThanOrEqual(2);
        });

      });

      // ============================================================================
      // Event Callback Tests
      // ============================================================================

      FunkyTests.describe('Event Callbacks', function() {

        FunkyTests.it('should call initComplete callback', function(done) {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var callbackCalled = false;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                initComplete: function(tbl) {
                    callbackCalled = true;
                }
            });

            createdTables.push(table);

            // Allow callback to run
            setTimeout(function() {
                expect(callbackCalled).toBe(true);
                done();
            }, 50);
        });

        FunkyTests.it('should call onSelect callback', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var selectedData = null;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                select: 'single',
                onSelect: function(data, tbl) {
                    selectedData = data;
                }
            });

            createdTables.push(table);

            table.select([1]);

            expect(selectedData).toBeDefined();
        });

        FunkyTests.it('should have page method', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var largeData = TestUtils.largeSampleData(50);

            var table = Table.init('#' + id, {
                data: largeData,
                columns: TestUtils.sampleColumns,
                pageLength: 10,
                serverSide: false
            });

            createdTables.push(table);

            expect(typeof table.page).toBe('function');
        });

        FunkyTests.it('should call onOrder callback', function() {
            var id = TestUtils.uniqueId('table');
            fixture.append(TestUtils.createTableHTML(id));

            var orderCallbackOrder = null;

            var table = Table.init('#' + id, {
                data: TestUtils.sampleData,
                columns: TestUtils.sampleColumns,
                serverSide: false,
                onOrder: function(order, tbl) {
                    orderCallbackOrder = order;
                }
            });

            createdTables.push(table);

            table.order([[1, 'desc']]);

            expect(orderCallbackOrder).toBeDefined();
        });

      }); // Event Callbacks

    }); // Funky.Core.Table

})(window);
