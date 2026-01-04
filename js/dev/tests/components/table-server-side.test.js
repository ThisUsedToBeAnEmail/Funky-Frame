/**
 * Funky.Table Server-Side Tests
 *
 * Tests for AJAX/server-side data loading, pagination, sorting, and searching.
 * Uses FUNKY_TEST_MOCKS for API mocking as per TESTING.md conventions.
 */
(function(window) {
    'use strict';

    var Table = window.Funky && window.Funky.Table;
    var D = window.Funky && window.Funky.Dom;

    // Skip if Table not loaded
    if (!Table) {
        console.warn('[Funky.Table Server-Side Tests] Funky.Table not loaded, skipping tests');
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
            return (prefix || 'table') + '_ss_' + testCounter + '_' + Date.now();
        },

        /**
         * Create test table HTML
         */
        createTableHTML: function(id) {
            return '<table id="' + id + '" class="table"></table>';
        },

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
         * Generate mock server response in DataTables format
         */
        createServerResponse: function(options) {
            options = options || {};
            var data = options.data || [];
            var recordsTotal = options.recordsTotal !== undefined ? options.recordsTotal : data.length;
            var recordsFiltered = options.recordsFiltered !== undefined ? options.recordsFiltered : recordsTotal;
            var draw = options.draw || 1;

            return {
                draw: draw,
                recordsTotal: recordsTotal,
                recordsFiltered: recordsFiltered,
                data: data
            };
        },

        /**
         * Generate sample data items
         */
        generateData: function(count, startId) {
            startId = startId || 1;
            var data = [];
            for (var i = 0; i < count; i++) {
                var id = startId + i;
                data.push({
                    id: id,
                    name: 'Item ' + id,
                    value: Math.floor(Math.random() * 1000),
                    status: id % 3 === 0 ? 'active' : (id % 3 === 1 ? 'pending' : 'inactive'),
                    created_at: '2024-01-' + String((id % 28) + 1).padStart(2, '0')
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
         * Wait for specified ms
         */
        wait: function(ms) {
            return new Promise(function(resolve) {
                setTimeout(resolve, ms);
            });
        }
    };

    // ============================================================================
    // Server-Side Tests
    // ============================================================================

    FunkyTests.describe('Funky.Component.Table.ServerSide', function() {

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

            // Reset mocks
            if (typeof FUNKY_TEST_MOCKS !== 'undefined' && FUNKY_TEST_MOCKS.clearResponses) {
                FUNKY_TEST_MOCKS.clearResponses();
            }

            fixture.cleanup();
        });

        // ============================================================================
        // Basic AJAX Loading
        // ============================================================================

        FunkyTests.describe('AJAX Data Loading', function() {

            FunkyTests.it('should load data from ajaxUrl', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                var mockData = TestUtils.generateData(10);

                // Mock the API response
                FUNKY_TEST_MOCKS.addResponse('/api/test-data', TestUtils.createServerResponse({
                    data: mockData,
                    recordsTotal: 100,
                    recordsFiltered: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/test-data',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    pageLength: 10
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(table.data.length).toBe(10);
                    expect(table.totalRecords).toBe(100);
                });
            });

            FunkyTests.it('should load data from ajax object with url', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                var mockData = TestUtils.generateData(5);

                FUNKY_TEST_MOCKS.addResponse('/api/ajax-object', TestUtils.createServerResponse({
                    data: mockData,
                    recordsTotal: 50
                }));

                var table = Table.init('#' + id, {
                    ajax: {
                        url: '/api/ajax-object'
                    },
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(table.data.length).toBe(5);
                });
            });

            FunkyTests.it('should handle empty response', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/empty', TestUtils.createServerResponse({
                    data: [],
                    recordsTotal: 0
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/empty',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(table.data.length).toBe(0);
                    expect(table.totalRecords).toBe(0);
                });
            });

        });

        // ============================================================================
        // Server-Side Pagination
        // ============================================================================

        FunkyTests.describe('Server-Side Pagination', function() {

            FunkyTests.it('should start on page 1', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/paginated', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/paginated',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    pageLength: 10
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(table.currentPage).toBe(1);
                });
            });

            FunkyTests.it('should update totalRecords from server response', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/with-total', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 500,
                    recordsFiltered: 500
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/with-total',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    pageLength: 10
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(table.totalRecords).toBe(500);
                    expect(table.filteredRecords).toBe(500);
                });
            });

            FunkyTests.it('should have page method', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/page-method', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/page-method',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    pageLength: 10
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.page).toBe('function');
                });
            });

            FunkyTests.it('should have pageLength method', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/pagelength', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/pagelength',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    pageLength: 10
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.pageLength).toBe('function');
                });
            });

        });

        // ============================================================================
        // Server-Side Sorting
        // ============================================================================

        FunkyTests.describe('Server-Side Sorting', function() {

            FunkyTests.it('should have order method', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/sort', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/sort',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    pageLength: 10
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.order).toBe('function');
                });
            });

            FunkyTests.it('should update sortOrder when order is called', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/sort-state', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/sort-state',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    table.order([[1, 'asc']]);
                    expect(table.sortOrder.length).toBe(1);
                    // sortOrder stores objects with column and dir properties
                    expect(table.sortOrder[0]).toEqual({ column: 1, dir: 'asc' });
                });
            });

            FunkyTests.it('should have clearSort method', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/clear-sort', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/clear-sort',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.clearSort).toBe('function');
                });
            });

            FunkyTests.it('should clear sortOrder when clearSort is called', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/clear-sort-state', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/clear-sort-state',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    table.order([[1, 'asc']]);
                    expect(table.sortOrder.length).toBe(1);
                    table.clearSort();
                    expect(table.sortOrder.length).toBe(0);
                });
            });

        });

        // ============================================================================
        // Server-Side Search
        // ============================================================================

        FunkyTests.describe('Server-Side Search', function() {

            FunkyTests.it('should have search method', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/search', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/search',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.search).toBe('function');
                });
            });

            FunkyTests.it('should update searchQuery when search is called', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/search-query', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/search-query',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    searchDelay: 0  // Disable debounce for testing
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    table.search('test query');
                    // Wait for the (now 0ms) debounce timeout to execute
                    return TestUtils.wait(10);
                }).then(function() {
                    expect(table.searchQuery).toBe('test query');
                });
            });

            FunkyTests.it('should have clearSearch method', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/clear-search', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/clear-search',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.clearSearch).toBe('function');
                });
            });

            FunkyTests.it('should clear searchQuery when clearSearch is called', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/clear-search-query', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/clear-search-query',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    searchDelay: 0  // Disable debounce for testing
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    table.search('query');
                    // Wait for debounce
                    return TestUtils.wait(10);
                }).then(function() {
                    expect(table.searchQuery).toBe('query');
                    table.clearSearch();
                    // Wait for debounce
                    return TestUtils.wait(10);
                }).then(function() {
                    expect(table.searchQuery).toBe('');
                });
            });

        });

        // ============================================================================
        // Error Handling
        // ============================================================================

        FunkyTests.describe('Error Handling', function() {

            FunkyTests.it('should not crash on error response', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                // Mock an error-like response
                FUNKY_TEST_MOCKS.addResponse('/api/error', {
                    error: 'Internal Server Error',
                    success: false
                });

                var table = Table.init('#' + id, {
                    ajax: '/api/error',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(200).then(function() {
                    // Table should still exist and not crash
                    expect(table).toBeDefined();
                    expect(table.isDestroyed).toBe(false);
                });
            });

            FunkyTests.it('should handle malformed response gracefully', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                // This returns something that's not proper table data
                FUNKY_TEST_MOCKS.addResponse('/api/malformed', {
                    unexpected: 'format'
                });

                var table = Table.init('#' + id, {
                    ajax: '/api/malformed',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(200).then(function() {
                    // Table should handle gracefully
                    expect(table).toBeDefined();
                    expect(table.isDestroyed).toBe(false);
                });
            });

        });

        // ============================================================================
        // Reload Method
        // ============================================================================

        FunkyTests.describe('Reload', function() {

            FunkyTests.it('should have reload method', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/reload', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/reload',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.reload).toBe('function');
                });
            });

        });

        // ============================================================================
        // Extra AJAX Data Configuration
        // ============================================================================

        FunkyTests.describe('Extra AJAX Data', function() {

            FunkyTests.it('should support extraAjaxData config as object', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/extra-data', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/extra-data',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    extraAjaxData: {
                        customFilter: 'active',
                        userId: 123
                    }
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(table.config.extraAjaxData).toBeDefined();
                    expect(table.config.extraAjaxData.customFilter).toBe('active');
                    expect(table.config.extraAjaxData.userId).toBe(123);
                });
            });

            FunkyTests.it('should support extraAjaxData config as function', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/extra-fn', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/extra-fn',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    extraAjaxData: function() {
                        return { dynamic: 'value' };
                    }
                });

                createdTables.push(table);

                return TestUtils.wait(150).then(function() {
                    expect(typeof table.config.extraAjaxData).toBe('function');
                });
            });

        });

        // ============================================================================
        // Processing Indicator
        // ============================================================================

        FunkyTests.describe('Processing Indicator', function() {

            FunkyTests.it('should support processing config option', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/processing', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/processing',
                    columns: TestUtils.sampleColumns,
                    serverSide: true,
                    processing: true
                });

                createdTables.push(table);

                expect(table.config.processing).toBe(true);
            });

        });

        // ============================================================================
        // serverSide Flag
        // ============================================================================

        FunkyTests.describe('serverSide Configuration', function() {

            FunkyTests.it('should set serverSide flag in config', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                FUNKY_TEST_MOCKS.addResponse('/api/ss-flag', TestUtils.createServerResponse({
                    data: TestUtils.generateData(10),
                    recordsTotal: 100
                }));

                var table = Table.init('#' + id, {
                    ajax: '/api/ss-flag',
                    columns: TestUtils.sampleColumns,
                    serverSide: true
                });

                createdTables.push(table);

                expect(table.config.serverSide).toBe(true);
            });

            FunkyTests.it('should default serverSide to false when not specified', function() {
                var id = TestUtils.uniqueId('table');
                fixture.append(TestUtils.createTableHTML(id));

                var table = Table.init('#' + id, {
                    data: TestUtils.generateData(5),
                    columns: TestUtils.sampleColumns
                });

                createdTables.push(table);

                expect(table.config.serverSide).toBe(false);
            });

        });

    }); // Funky.Component.Table.ServerSide

})(window);
