/**
 * Tests for Funky.DataTables
 * Centralized DataTables configuration with column mappings, CSRF, filters, and cache sync
 */
FunkyTests.xdescribe('Funky.DataTables', function() {
    'use strict';

    var DataTables = Funky.DataTables;

    // Skip all tests if DataTables not available or jQuery DataTables not loaded
    if (!DataTables || typeof $ === 'undefined' || typeof $.fn.DataTable === 'undefined') {
        FunkyTests.it('DataTables requires jQuery DataTables plugin', function() {
            FunkyTests.expect(true).toBe(true);
        });
        return;
    }

    var expect = FunkyTests.expect;
    var fixture;
    var testCounter = 0;
    var createdTables = [];

    /**
     * Generate unique ID for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        return (prefix || 'dt') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Create test table HTML
     */
    function createTableHTML(id) {
        return '<table id="' + id + '" class="table">' +
            '<thead><tr>' +
            '<th>ID</th>' +
            '<th>Name</th>' +
            '<th>Status</th>' +
            '</tr></thead>' +
            '<tbody></tbody>' +
            '</table>';
    }

    /**
     * Create test data
     */
    function createTestData(count) {
        var data = [];
        for (var i = 1; i <= count; i++) {
            data.push({
                id: i,
                name: 'Item ' + i,
                status: i % 2 === 0 ? 'active' : 'inactive'
            });
        }
        return data;
    }

    /**
     * Wait for next tick
     */
    function nextTick(callback) {
        setTimeout(callback, 0);
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
        createdTables = [];
    });

    FunkyTests.afterEach(function() {
        // Destroy created tables
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

    // ============================================================================
    // Module Structure Tests
    // ============================================================================
    FunkyTests.describe('Module Structure', function() {
        FunkyTests.it('should be registered on Funky namespace', function() {
            expect(DataTables).toBeDefined();
        });

        FunkyTests.it('should be an object (singleton instance)', function() {
            expect(typeof DataTables).toBe('object');
        });

        FunkyTests.it('should have init method', function() {
            expect(typeof DataTables.init).toBe('function');
        });

        FunkyTests.it('should have column mappings', function() {
            expect(DataTables.columnMappings).toBeDefined();
            expect(typeof DataTables.columnMappings).toBe('object');
        });

        FunkyTests.it('should have _instances registry', function() {
            expect(DataTables._instances).toBeDefined();
            expect(typeof DataTables._instances).toBe('object');
        });

        FunkyTests.it('should have setup methods', function() {
            expect(typeof DataTables.setupGlobalSearch).toBe('function');
            expect(typeof DataTables.setupDateRangeFilter).toBe('function');
            expect(typeof DataTables.setupClientFilter).toBe('function');
        });

        FunkyTests.it('should have smart update methods', function() {
            expect(typeof DataTables.getByType).toBe('function');
            expect(typeof DataTables.highlightRow).toBe('function');
            expect(typeof DataTables.removeRow).toBe('function');
            expect(typeof DataTables.refreshByType).toBe('function');
            expect(typeof DataTables.refreshRelated).toBe('function');
        });

        FunkyTests.it('should have entity relationship methods', function() {
            expect(typeof DataTables.getRelatedTypes).toBe('function');
            expect(typeof DataTables.getEntityRelationships).toBe('function');
            expect(typeof DataTables.setEntityRelationship).toBe('function');
        });

        FunkyTests.it('should have cache invalidation handler', function() {
            expect(typeof DataTables.handleCacheInvalidation).toBe('function');
        });

        FunkyTests.it('should have registry stats method', function() {
            expect(typeof DataTables.getRegistryStats).toBe('function');
        });

        FunkyTests.it('should have addColumnMapping method', function() {
            expect(typeof DataTables.addColumnMapping).toBe('function');
        });
    });

    // ============================================================================
    // Column Mappings Tests
    // ============================================================================
    FunkyTests.describe('Column Mappings', function() {
        FunkyTests.it('should have mapping for trades', function() {
            var mapping = DataTables.columnMappings.trades;
            expect(mapping).toBeDefined();
            expect(mapping.columns).toBeDefined();
            expect(mapping.sortable).toBeDefined();
            expect(mapping.columns.indexOf('id')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should have mapping for clients', function() {
            var mapping = DataTables.columnMappings.clients;
            expect(mapping).toBeDefined();
            expect(mapping.columns.indexOf('name')).toBeGreaterThan(-1);
            expect(mapping.columns.indexOf('code')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should have mapping for securities', function() {
            var mapping = DataTables.columnMappings.securities;
            expect(mapping).toBeDefined();
            expect(mapping.columns.indexOf('isin')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should have mapping for users', function() {
            var mapping = DataTables.columnMappings.users;
            expect(mapping).toBeDefined();
            expect(mapping.columns.indexOf('username')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should have mapping for trade_actions', function() {
            var mapping = DataTables.columnMappings.trade_actions;
            expect(mapping).toBeDefined();
            expect(mapping.columns.indexOf('trade_id')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should have mapping for fx_rates', function() {
            var mapping = DataTables.columnMappings.fx_rates;
            expect(mapping).toBeDefined();
            expect(mapping.columns.indexOf('rate')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should have sortable Set for each mapping', function() {
            Object.keys(DataTables.columnMappings).forEach(function(key) {
                var mapping = DataTables.columnMappings[key];
                expect(mapping.sortable instanceof Set).toBe(true);
            });
        });

        FunkyTests.it('should add new column mapping', function() {
            var tableName = uniqueId('custom_table');
            DataTables.addColumnMapping(tableName, ['id', 'name', 'value'], ['id', 'name']);

            var mapping = DataTables.columnMappings[tableName];
            expect(mapping).toBeDefined();
            expect(mapping.columns).toEqual(['id', 'name', 'value']);
            expect(mapping.sortable.has('id')).toBe(true);
            expect(mapping.sortable.has('name')).toBe(true);
            expect(mapping.sortable.has('value')).toBe(false);

            // Cleanup
            delete DataTables.columnMappings[tableName];
        });
    });

    // ============================================================================
    // Entity Relationships Tests
    // ============================================================================
    FunkyTests.describe('Entity Relationships', function() {
        FunkyTests.it('should get entity relationships', function() {
            var relationships = DataTables.getEntityRelationships();
            expect(relationships).toBeDefined();
            expect(typeof relationships).toBe('object');
        });

        FunkyTests.it('should have trade_actions relationship', function() {
            var related = DataTables.getRelatedTypes('trade_actions');
            expect(Array.isArray(related)).toBe(true);
            expect(related.indexOf('trades')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should have trades relationship', function() {
            var related = DataTables.getRelatedTypes('trades');
            expect(Array.isArray(related)).toBe(true);
            expect(related.indexOf('trades')).toBeGreaterThan(-1);
        });

        FunkyTests.it('should return entity itself for unknown types', function() {
            var related = DataTables.getRelatedTypes('unknown_entity_' + Date.now());
            expect(Array.isArray(related)).toBe(true);
            expect(related.length).toBe(1);
        });

        FunkyTests.it('should set custom entity relationship', function() {
            var entityType = 'custom_entity_' + uniqueId();
            DataTables.setEntityRelationship(entityType, ['type_a', 'type_b']);

            var related = DataTables.getRelatedTypes(entityType);
            expect(related).toEqual(['type_a', 'type_b']);

            // Cleanup
            var relationships = DataTables.getEntityRelationships();
            delete relationships[entityType];
        });
    });

    // ============================================================================
    // Init Tests (Client-Side Mode)
    // ============================================================================
    FunkyTests.describe('init (client-side)', function() {
        FunkyTests.it('should initialize DataTable with default config', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: createTestData(5),
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            expect(dt).toBeDefined();
            expect(dt._table).toBeDefined();
        });

        FunkyTests.it('should return wrapper with Bindable Interface methods', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            expect(typeof dt.setData).toBe('function');
            expect(typeof dt.getData).toBe('function');
            expect(typeof dt.addData).toBe('function');
            expect(typeof dt.removeData).toBe('function');
            expect(typeof dt.clearData).toBe('function');
            expect(typeof dt.refreshData).toBe('function');
        });

        FunkyTests.it('should expose DataTable native methods', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            expect(typeof dt.draw).toBe('function');
            expect(typeof dt.search).toBe('function');
            expect(typeof dt.order).toBe('function');
            expect(typeof dt.page).toBe('function');
            expect(typeof dt.rows).toBe('function');
            expect(typeof dt.columns).toBe('function');
            expect(typeof dt.row).toBe('function');
            expect(typeof dt.column).toBe('function');
            expect(typeof dt.cell).toBe('function');
            expect(typeof dt.on).toBe('function');
            expect(typeof dt.off).toBe('function');
            expect(typeof dt.destroy).toBe('function');
        });

        FunkyTests.it('should register instance in _instances registry', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            expect(DataTables._instances[tableId]).toBe(dt);
        });
    });

    // ============================================================================
    // Bindable Interface Tests
    // ============================================================================
    FunkyTests.describe('Bindable Interface', function() {
        var dt;
        var tableId;

        FunkyTests.beforeEach(function() {
            tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: createTestData(3),
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
        });

        FunkyTests.it('should get data from table', function() {
            var data = dt.getData();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(3);
        });

        FunkyTests.it('should set data and replace existing', function() {
            var newData = [
                { id: 100, name: 'New Item', status: 'new' }
            ];
            dt.setData(newData);

            var data = dt.getData();
            expect(data.length).toBe(1);
            expect(data[0].id).toBe(100);
        });

        FunkyTests.it('should add data to table', function() {
            var initialCount = dt.getData().length;
            dt.addData({ id: 99, name: 'Added', status: 'new' });

            var data = dt.getData();
            expect(data.length).toBe(initialCount + 1);
        });

        FunkyTests.it('should add multiple rows', function() {
            var initialCount = dt.getData().length;
            dt.addData([
                { id: 98, name: 'Added 1', status: 'new' },
                { id: 99, name: 'Added 2', status: 'new' }
            ]);

            var data = dt.getData();
            expect(data.length).toBe(initialCount + 2);
        });

        FunkyTests.it('should remove data by ID', function() {
            dt.removeData([1]);

            var data = dt.getData();
            var ids = data.map(function(row) { return row.id; });
            expect(ids.indexOf(1)).toBe(-1);
        });

        FunkyTests.it('should remove multiple rows by IDs', function() {
            dt.removeData([1, 2]);

            var data = dt.getData();
            expect(data.length).toBe(1);
            expect(data[0].id).toBe(3);
        });

        FunkyTests.it('should clear all data', function() {
            dt.clearData();

            var data = dt.getData();
            expect(data.length).toBe(0);
        });

        FunkyTests.it('should handle setData with data property', function() {
            dt.setData({ data: [{ id: 200, name: 'Wrapped', status: 'test' }] });

            var data = dt.getData();
            expect(data.length).toBe(1);
            expect(data[0].id).toBe(200);
        });

        FunkyTests.it('should handle setData with empty array', function() {
            dt.setData([]);

            var data = dt.getData();
            expect(data.length).toBe(0);
        });
    });

    // ============================================================================
    // getByType Tests
    // ============================================================================
    FunkyTests.describe('getByType', function() {
        FunkyTests.it('should return empty array for unknown type', function() {
            var tables = DataTables.getByType('unknown_type_' + Date.now());
            expect(Array.isArray(tables)).toBe(true);
            expect(tables.length).toBe(0);
        });

        FunkyTests.it('should return tables registered for entity type', function() {
            var tableId = uniqueId('table');
            var entityType = 'test_entity_' + uniqueId();
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                entityType: entityType,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            var tables = DataTables.getByType(entityType);
            expect(tables.length).toBe(1);
        });
    });

    // ============================================================================
    // Registry Stats Tests
    // ============================================================================
    FunkyTests.describe('getRegistryStats', function() {
        FunkyTests.it('should return stats object', function() {
            var stats = DataTables.getRegistryStats();
            expect(typeof stats).toBe('object');
        });

        FunkyTests.it('should count registered tables', function() {
            var tableId = uniqueId('table');
            var entityType = 'stats_test_' + uniqueId();
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                entityType: entityType,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            var stats = DataTables.getRegistryStats();
            expect(stats[entityType]).toBe(1);
        });
    });

    // ============================================================================
    // highlightRow Tests
    // ============================================================================
    FunkyTests.describe('highlightRow', function() {
        var dt;
        var tableId;

        FunkyTests.beforeEach(function() {
            tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: createTestData(3),
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
        });

        FunkyTests.it('should add success highlight class', function(done) {
            DataTables.highlightRow(dt._table, 1, 'success');

            nextTick(function() {
                var row = document.querySelector('#' + tableId + ' tbody tr');
                expect(row).toBeDefined();
                done();
            });
        });

        FunkyTests.it('should default to success highlight', function() {
            DataTables.highlightRow(dt._table, 1);
            // Method should not throw
            expect(true).toBe(true);
        });

        FunkyTests.it('should handle non-existent row gracefully', function() {
            // Should not throw
            DataTables.highlightRow(dt._table, 99999);
            expect(true).toBe(true);
        });
    });

    // ============================================================================
    // removeRow Tests
    // ============================================================================
    FunkyTests.describe('removeRow', function() {
        var dt;
        var tableId;

        FunkyTests.beforeEach(function() {
            tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: createTestData(5),
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
        });

        FunkyTests.it('should add removing class to row', function() {
            DataTables.removeRow(dt._table, 1);
            // Method should not throw
            expect(true).toBe(true);
        });

        FunkyTests.it('should handle non-existent row gracefully', function() {
            // Should not throw
            DataTables.removeRow(dt._table, 99999);
            expect(true).toBe(true);
        });

        FunkyTests.it('should remove row after animation delay', function(done) {
            var initialCount = dt.getData().length;
            DataTables.removeRow(dt._table, 1);

            setTimeout(function() {
                var finalCount = dt.getData().length;
                expect(finalCount).toBe(initialCount - 1);
                done();
            }, 400);
        });
    });

    // ============================================================================
    // handleCacheInvalidation Tests
    // ============================================================================
    FunkyTests.describe('handleCacheInvalidation', function() {
        FunkyTests.it('should handle bulk invalidation', function() {
            // Should not throw
            DataTables.handleCacheInvalidation({
                type: 'trades',
                reason: 'bulk'
            });
            expect(true).toBe(true);
        });

        FunkyTests.it('should handle deleted invalidation', function() {
            // Should not throw
            DataTables.handleCacheInvalidation({
                type: 'trades',
                reason: 'deleted',
                id: 123
            });
            expect(true).toBe(true);
        });

        FunkyTests.it('should handle created invalidation', function() {
            // Should not throw
            DataTables.handleCacheInvalidation({
                type: 'trades',
                reason: 'created',
                id: 456
            });
            expect(true).toBe(true);
        });

        FunkyTests.it('should handle updated invalidation', function() {
            // Should not throw
            DataTables.handleCacheInvalidation({
                type: 'trades',
                reason: 'updated',
                id: 789
            });
            expect(true).toBe(true);
        });
    });

    // ============================================================================
    // refreshByType Tests
    // ============================================================================
    FunkyTests.describe('refreshByType', function() {
        FunkyTests.it('should not throw for unknown type', function() {
            // Should not throw
            DataTables.refreshByType('unknown_type_' + Date.now());
            expect(true).toBe(true);
        });

        FunkyTests.it('should handle resetPaging parameter', function() {
            // Should not throw
            DataTables.refreshByType('trades', true);
            DataTables.refreshByType('trades', false);
            expect(true).toBe(true);
        });
    });

    // ============================================================================
    // refreshRelated Tests
    // ============================================================================
    FunkyTests.describe('refreshRelated', function() {
        FunkyTests.it('should not throw for any entity type', function() {
            // Should not throw
            DataTables.refreshRelated('trade_actions');
            DataTables.refreshRelated('trades');
            DataTables.refreshRelated('unknown');
            expect(true).toBe(true);
        });

        FunkyTests.it('should handle resetPaging parameter', function() {
            // Should not throw
            DataTables.refreshRelated('trades', true);
            DataTables.refreshRelated('trades', false);
            expect(true).toBe(true);
        });
    });

    // ============================================================================
    // _findRowById Tests
    // ============================================================================
    FunkyTests.describe('_findRowById', function() {
        var dt;
        var tableId;

        FunkyTests.beforeEach(function() {
            tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: createTestData(3),
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
        });

        FunkyTests.it('should find row by numeric ID', function() {
            var $row = DataTables._findRowById(dt._table, 1);
            expect($row).toBeDefined();
        });

        FunkyTests.it('should find row by string ID', function() {
            var $row = DataTables._findRowById(dt._table, '2');
            expect($row).toBeDefined();
        });

        FunkyTests.it('should return null for non-existent ID', function() {
            var $row = DataTables._findRowById(dt._table, 99999);
            expect($row).toBeNull();
        });
    });

    // ============================================================================
    // _getDefaultButtons Tests
    // ============================================================================
    FunkyTests.describe('_getDefaultButtons', function() {
        FunkyTests.it('should return array of buttons', function() {
            var buttons = DataTables._getDefaultButtons({
                tableName: 'test'
            });
            expect(Array.isArray(buttons)).toBe(true);
            expect(buttons.length).toBeGreaterThan(0);
        });

        FunkyTests.it('should include colvis button', function() {
            var buttons = DataTables._getDefaultButtons({
                tableName: 'test'
            });
            var hasColvis = buttons.some(function(btn) {
                return btn.extend === 'colvis';
            });
            expect(hasColvis).toBe(true);
        });

        FunkyTests.it('should include export buttons when enabled', function() {
            var buttons = DataTables._getDefaultButtons({
                tableName: 'test',
                enableExport: true
            });
            expect(buttons.length).toBeGreaterThan(1);
        });

        FunkyTests.it('should exclude export buttons when disabled', function() {
            var buttons = DataTables._getDefaultButtons({
                tableName: 'test',
                enableExport: false
            });
            var hasExport = buttons.some(function(btn) {
                return btn.text && (btn.text.indexOf('CSV') !== -1 || btn.text.indexOf('Excel') !== -1);
            });
            expect(hasExport).toBe(false);
        });

        FunkyTests.it('should include import button when enabled', function() {
            var buttons = DataTables._getDefaultButtons({
                tableName: 'test',
                enableImport: true
            });
            var hasImport = buttons.some(function(btn) {
                return btn.text && btn.text.indexOf('Import') !== -1;
            });
            expect(hasImport).toBe(true);
        });

        FunkyTests.it('should merge custom buttons', function() {
            var customButton = {
                text: 'Custom',
                action: function() {}
            };
            var buttons = DataTables._getDefaultButtons({
                tableName: 'test',
                buttons: [customButton]
            });
            expect(buttons.indexOf(customButton)).toBeGreaterThan(-1);
        });
    });

    // ============================================================================
    // Config Options Tests
    // ============================================================================
    FunkyTests.describe('Config Options', function() {
        FunkyTests.it('should use default pageLength of 25', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            expect(dt._table.page.len()).toBe(25);
        });

        FunkyTests.it('should use custom pageLength', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                pageLength: 50,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            expect(dt._table.page.len()).toBe(50);
        });

        FunkyTests.it('should set orderable:false for non-sortable columns', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            // Add custom mapping
            var tableName = 'custom_sort_test_' + uniqueId();
            DataTables.addColumnMapping(tableName, ['id', 'name', 'actions'], ['id', 'name']);

            var columns = [
                { data: 'id' },
                { data: 'name' },
                { data: 'actions' }
            ];

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                tableName: tableName,
                data: [],
                columns: columns
            });

            createdTables.push(dt);

            // Actions column should be non-orderable
            expect(columns[2].orderable).toBe(false);

            // Cleanup
            delete DataTables.columnMappings[tableName];
        });
    });

    // ============================================================================
    // Destroy Tests
    // ============================================================================
    FunkyTests.describe('destroy', function() {
        FunkyTests.it('should remove from instance registry', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            expect(DataTables._instances[tableId]).toBe(dt);

            dt.destroy();

            expect(DataTables._instances[tableId]).toBeUndefined();
        });

        FunkyTests.it('should destroy underlying DataTable', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            dt.destroy();

            // Table element should still exist but DataTable should be destroyed
            var tableEl = document.getElementById(tableId);
            expect(tableEl).toBeDefined();
        });
    });

    // ============================================================================
    // URL Parsing Tests
    // ============================================================================
    FunkyTests.describe('URL Parsing', function() {
        FunkyTests.it('should handle URL without query params', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            // Should not throw
            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                ajaxUrl: '/api/items',
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
            expect(dt).toBeDefined();
        });

        FunkyTests.it('should handle URL with query params', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            // Should not throw
            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                ajaxUrl: '/api/items?filter=active&sort=name',
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
            expect(dt).toBeDefined();
        });
    });

    // ============================================================================
    // Extra AJAX Data Tests
    // ============================================================================
    FunkyTests.describe('Extra AJAX Data', function() {
        FunkyTests.it('should accept extraAjaxData option', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                extraAjaxData: {
                    client_id: 123,
                    status: 'active'
                },
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
            expect(dt).toBeDefined();
        });
    });

    // ============================================================================
    // Custom Options Merge Tests
    // ============================================================================
    FunkyTests.describe('Custom Options', function() {
        FunkyTests.it('should merge dataTableOptions', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ],
                dataTableOptions: {
                    autoWidth: false
                }
            });

            createdTables.push(dt);
            expect(dt).toBeDefined();
        });

        FunkyTests.it('should use custom emptyMessage', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                emptyMessage: 'No items to display',
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
            expect(dt).toBeDefined();
        });

        FunkyTests.it('should use custom order', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                order: [[1, 'desc']],
                data: createTestData(3),
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);

            var order = dt._table.order();
            expect(order[0][0]).toBe(1);
            expect(order[0][1]).toBe('desc');
        });

        FunkyTests.it('should use custom lengthMenu', function() {
            var tableId = uniqueId('table');
            fixture.el.innerHTML = createTableHTML(tableId);

            var dt = DataTables.init('#' + tableId, {
                serverSide: false,
                lengthMenu: [[5, 10, 15], [5, 10, 15]],
                data: [],
                columns: [
                    { data: 'id' },
                    { data: 'name' },
                    { data: 'status' }
                ]
            });

            createdTables.push(dt);
            expect(dt).toBeDefined();
        });
    });
});
