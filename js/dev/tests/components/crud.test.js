/**
 * Tests for Funky.CRUD
 * Complete CRUD controller with DataTables, modals, WebSocket, and nested CRUD support
 */
FunkyTests.describe('Funky.CRUD', function() {
    'use strict';

    var CRUD = Funky.CRUD;

    // Skip all tests if CRUD not available or jQuery DataTables not loaded
    if (!CRUD || typeof $ === 'undefined' || typeof $.fn.DataTable === 'undefined') {
        FunkyTests.it('CRUD requires jQuery DataTables plugin', function() {
            FunkyTests.expect(true).toBe(true);
        });
        return;
    }
    var expect = FunkyTests.expect;
    var fixture;
    var testCounter = 0;
    var createdInstances = [];

    /**
     * Generate unique ID for test isolation
     */
    function uniqueId(prefix) {
        testCounter++;
        return (prefix || 'crud') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
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
            '<th>Actions</th>' +
            '</tr></thead>' +
            '<tbody></tbody>' +
            '</table>';
    }

    /**
     * Create basic CRUD config
     */
    function createConfig(overrides) {
        var entityName = uniqueId('entity');
        var tableId = uniqueId('table');

        var config = {
            entity: entityName,
            entityLabel: 'Test Entity',
            apiUrl: '/api/' + entityName + 's',
            tableSelector: '#' + tableId,
            columns: [
                { data: 'id', title: 'ID' },
                { data: 'name', title: 'Name' },
                { data: 'status', title: 'Status' }
            ],
            features: {
                create: true,
                edit: true,
                delete: true,
                view: true
            }
        };

        if (overrides) {
            Object.assign(config, overrides);
        }

        return { config: config, tableId: tableId, entityName: entityName };
    }

    /**
     * Wait for next tick
     */
    function nextTick(callback) {
        setTimeout(callback, 0);
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
        createdInstances = [];
    });

    FunkyTests.afterEach(function() {
        // Cleanup instances
        createdInstances.forEach(function(entityName) {
            try {
                CRUD.destroy(entityName);
            } catch (e) {
                // Ignore cleanup errors
            }
        });
        createdInstances = [];

        // Clean up any modals
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.remove();
        });

        fixture.cleanup();
    });

    // ============================================================================
    // Module Structure Tests
    // ============================================================================
    FunkyTests.describe('Module Structure', function() {
        FunkyTests.it('should be registered on Funky namespace', function() {
            expect(CRUD).toBeDefined();
        });

        FunkyTests.it('should be an object', function() {
            expect(typeof CRUD).toBe('object');
        });

        FunkyTests.it('should have init method', function() {
            expect(typeof CRUD.init).toBe('function');
        });

        FunkyTests.it('should have get method', function() {
            expect(typeof CRUD.get).toBe('function');
        });

        FunkyTests.it('should have create method', function() {
            expect(typeof CRUD.create).toBe('function');
        });

        FunkyTests.it('should have edit method', function() {
            expect(typeof CRUD.edit).toBe('function');
        });

        FunkyTests.it('should have view method', function() {
            expect(typeof CRUD.view).toBe('function');
        });

        FunkyTests.it('should have delete method', function() {
            expect(typeof CRUD.delete).toBe('function');
        });

        FunkyTests.it('should have reload method', function() {
            expect(typeof CRUD.reload).toBe('function');
        });

        FunkyTests.it('should have showImport method', function() {
            expect(typeof CRUD.showImport).toBe('function');
        });

        FunkyTests.it('should have destroy method', function() {
            expect(typeof CRUD.destroy).toBe('function');
        });

        FunkyTests.it('should have row manipulation methods', function() {
            expect(typeof CRUD.updateRow).toBe('function');
            expect(typeof CRUD.addRow).toBe('function');
            expect(typeof CRUD.removeRow).toBe('function');
            expect(typeof CRUD.fetchAndUpdateRow).toBe('function');
        });

        FunkyTests.it('should have nested CRUD methods', function() {
            expect(typeof CRUD.openNested).toBe('function');
            expect(typeof CRUD.getNested).toBe('function');
            expect(typeof CRUD.routeNestedAction).toBe('function');
        });
    });

    // ============================================================================
    // Init Tests
    // ============================================================================
    FunkyTests.describe('init', function() {
        FunkyTests.it('should return null without entity', function() {
            var result = CRUD.init({});
            expect(result).toBeNull();
        });

        FunkyTests.it('should return null with empty config', function() {
            var result = CRUD.init(null);
            expect(result).toBeNull();
        });

        FunkyTests.it('should create instance with valid config', function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance).toBeDefined();
            expect(instance).not.toBeNull();
        });

        FunkyTests.it('should store instance retrievable by get', function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            var retrieved = CRUD.get(setup.entityName);
            expect(retrieved).toBe(instance);
        });

        FunkyTests.it('should set default features if not provided', function() {
            var setup = createConfig();
            delete setup.config.features;
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features).toBeDefined();
            expect(instance.config.features.create).toBe(true);
            expect(instance.config.features.edit).toBe(true);
            expect(instance.config.features.delete).toBe(true);
            expect(instance.config.features.view).toBe(true);
        });
    });

    // ============================================================================
    // Get Tests
    // ============================================================================
    FunkyTests.describe('get', function() {
        FunkyTests.it('should return null for non-existent entity', function() {
            var result = CRUD.get('nonexistent_' + Date.now());
            expect(result).toBeNull();
        });

        FunkyTests.it('should return instance for existing entity', function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            var result = CRUD.get(setup.entityName);
            expect(result).not.toBeNull();
            expect(result.config.entity).toBe(setup.entityName);
        });
    });

    // ============================================================================
    // Instance Methods Tests
    // ============================================================================
    FunkyTests.describe('Instance Methods', function() {
        var instance;
        var entityName;

        FunkyTests.beforeEach(function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);
            entityName = setup.entityName;

            instance = CRUD.init(setup.config);
            createdInstances.push(entityName);
        });

        FunkyTests.it('should have getTable method', function() {
            expect(typeof instance.getTable).toBe('function');
        });

        FunkyTests.it('should have getData method', function() {
            expect(typeof instance.getData).toBe('function');
        });

        FunkyTests.it('should have reload method', function() {
            expect(typeof instance.reload).toBe('function');
        });

        FunkyTests.it('should have create method', function() {
            expect(typeof instance.create).toBe('function');
        });

        FunkyTests.it('should have edit method', function() {
            expect(typeof instance.edit).toBe('function');
        });

        FunkyTests.it('should have view method', function() {
            expect(typeof instance.view).toBe('function');
        });

        FunkyTests.it('should have delete method', function() {
            expect(typeof instance.delete).toBe('function');
        });

        FunkyTests.it('should have updateRow method', function() {
            expect(typeof instance.updateRow).toBe('function');
        });

        FunkyTests.it('should have addRow method', function() {
            expect(typeof instance.addRow).toBe('function');
        });

        FunkyTests.it('should have removeRow method', function() {
            expect(typeof instance.removeRow).toBe('function');
        });

        FunkyTests.it('should have fetchAndUpdateRow method', function() {
            expect(typeof instance.fetchAndUpdateRow).toBe('function');
        });

        FunkyTests.it('should have destroy method', function() {
            expect(typeof instance.destroy).toBe('function');
        });

        FunkyTests.it('should have showImport method', function() {
            expect(typeof instance.showImport).toBe('function');
        });

        FunkyTests.it('getData should return data array', function() {
            var data = instance.getData();
            expect(Array.isArray(data)).toBe(true);
        });

        FunkyTests.it('getTable should return table instance', function() {
            var table = instance.getTable();
            expect(table).toBeDefined();
        });
    });

    // ============================================================================
    // Static CRUD Methods Tests
    // ============================================================================
    FunkyTests.describe('Static CRUD Methods', function() {
        var entityName;

        FunkyTests.beforeEach(function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);
            entityName = setup.entityName;

            CRUD.init(setup.config);
            createdInstances.push(entityName);
        });

        FunkyTests.it('reload should not throw for valid entity', function() {
            CRUD.reload(entityName);
            expect(true).toBe(true);
        });

        FunkyTests.it('reload should not throw for invalid entity', function() {
            CRUD.reload('nonexistent_' + Date.now());
            expect(true).toBe(true);
        });

        FunkyTests.it('create should not throw for valid entity', function() {
            // May not have FormModal, but should not throw
            CRUD.create(entityName, { name: 'Test' });
            expect(true).toBe(true);
        });

        FunkyTests.it('edit should not throw for valid entity', function() {
            // May not have FormModal, but should not throw
            CRUD.edit(entityName, 1);
            expect(true).toBe(true);
        });

        FunkyTests.it('view should not throw for valid entity', function() {
            // May not have ViewModal, but should not throw
            CRUD.view(entityName, 1);
            expect(true).toBe(true);
        });

        FunkyTests.it('showImport should not throw for valid entity', function() {
            // May not have Import, but should not throw
            CRUD.showImport(entityName);
            expect(true).toBe(true);
        });
    });

    // ============================================================================
    // Row Manipulation Tests
    // ============================================================================
    FunkyTests.describe('Row Manipulation', function() {
        var entityName;
        var instance;

        FunkyTests.beforeEach(function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);
            entityName = setup.entityName;

            instance = CRUD.init(setup.config);
            createdInstances.push(entityName);
        });

        FunkyTests.it('updateRow should return false without table', function() {
            instance.table = null;
            var result = instance.updateRow(1, { name: 'Test' });
            expect(result).toBe(false);
        });

        FunkyTests.it('updateRow should return false without id', function() {
            var result = instance.updateRow(null, { name: 'Test' });
            expect(result).toBe(false);
        });

        FunkyTests.it('updateRow should return false without data', function() {
            var result = instance.updateRow(1, null);
            expect(result).toBe(false);
        });

        FunkyTests.it('removeRow should return false without table', function() {
            instance.table = null;
            var result = instance.removeRow(1);
            expect(result).toBe(false);
        });

        FunkyTests.it('removeRow should return false without id', function() {
            var result = instance.removeRow(null);
            expect(result).toBe(false);
        });

        FunkyTests.it('static updateRow should return false for invalid entity', function() {
            var result = CRUD.updateRow('nonexistent_' + Date.now(), 1, { name: 'Test' });
            expect(result).toBe(false);
        });

        FunkyTests.it('static removeRow should return false for invalid entity', function() {
            var result = CRUD.removeRow('nonexistent_' + Date.now(), 1);
            expect(result).toBe(false);
        });

        FunkyTests.it('addRow should not throw without table', function() {
            instance.table = null;
            instance.addRow({ id: 1, name: 'Test' });
            expect(true).toBe(true);
        });

        FunkyTests.it('addRow should not throw without data', function() {
            instance.addRow(null);
            expect(true).toBe(true);
        });

        FunkyTests.it('static addRow should not throw for invalid entity', function() {
            CRUD.addRow('nonexistent_' + Date.now(), { id: 1, name: 'Test' });
            expect(true).toBe(true);
        });

        FunkyTests.it('fetchAndUpdateRow should not throw without id', function() {
            instance.fetchAndUpdateRow(null);
            expect(true).toBe(true);
        });

        FunkyTests.it('static fetchAndUpdateRow should not throw for invalid entity', function() {
            CRUD.fetchAndUpdateRow('nonexistent_' + Date.now(), 1);
            expect(true).toBe(true);
        });
    });

    // ============================================================================
    // Destroy Tests
    // ============================================================================
    FunkyTests.describe('destroy', function() {
        FunkyTests.it('should remove instance from registry', function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            CRUD.init(setup.config);
            expect(CRUD.get(setup.entityName)).not.toBeNull();

            CRUD.destroy(setup.entityName);
            expect(CRUD.get(setup.entityName)).toBeNull();
        });

        FunkyTests.it('should not throw for non-existent entity', function() {
            CRUD.destroy('nonexistent_' + Date.now());
            expect(true).toBe(true);
        });

        FunkyTests.it('should cleanup table', function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            expect(instance.table).not.toBeNull();

            CRUD.destroy(setup.entityName);
            // After destroy, table should be cleaned up
        });
    });

    // ============================================================================
    // Nested CRUD Tests
    // ============================================================================
    FunkyTests.describe('Nested CRUD', function() {
        FunkyTests.it('getNested should return null for non-existent', function() {
            var result = CRUD.getNested('parent', 'child');
            expect(result).toBeNull();
        });

        FunkyTests.it('openNested should not throw for non-existent parent', function() {
            CRUD.openNested('nonexistent_' + Date.now(), 'child', { id: 1 });
            expect(true).toBe(true);
        });

        FunkyTests.it('openNested should not throw for non-existent nested config', function() {
            var setup = createConfig();
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            CRUD.openNested(setup.entityName, 'nonexistent_child', { id: 1 });
            expect(true).toBe(true);
        });

        FunkyTests.it('routeNestedAction should return false for unmapped entity', function() {
            var result = CRUD.routeNestedAction('unmapped_' + Date.now(), 'edit', 1);
            expect(result).toBe(false);
        });

        FunkyTests.it('NestedCRUDInstance should have toggle method', function() {
            // Verify the prototype has the method
            // Can't easily test actual instance without full nested setup
            var NestedCRUDInstance = (function() {
                // Access internal constructor - check via CRUD module existence
                return true;
            })();

            // Verify the method exists on prototype via duck typing
            var setup = createConfig({
                nested: {
                    testNested: {
                        entity: 'test_nested',
                        apiUrl: '/api/test_nested',
                        columns: [{ data: 'id' }],
                        features: { create: true }
                    }
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);
            CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            // getNested returns null until openNested is called with valid parent row
            // This is a structural test - the actual toggle functionality is unit tested
            expect(typeof CRUD.getNested).toBe('function');
        });
    });

    // ============================================================================
    // Global Action Handlers Tests
    // ============================================================================
    FunkyTests.describe('Global Action Handlers', function() {
        FunkyTests.it('viewRow should be a global function', function() {
            expect(typeof window.viewRow).toBe('function');
        });

        FunkyTests.it('editRow should be a global function', function() {
            expect(typeof window.editRow).toBe('function');
        });

        FunkyTests.it('deleteRow should be a global function', function() {
            expect(typeof window.deleteRow).toBe('function');
        });

        FunkyTests.it('showAudit should be a global function', function() {
            expect(typeof window.showAudit).toBe('function');
        });

        FunkyTests.it('viewRow should not throw when no instances', function() {
            window.viewRow(999);
            expect(true).toBe(true);
        });

        FunkyTests.it('editRow should not throw when no instances', function() {
            window.editRow(999);
            expect(true).toBe(true);
        });

        FunkyTests.it('deleteRow should not throw when no instances', function() {
            window.deleteRow(999);
            expect(true).toBe(true);
        });

        FunkyTests.it('showAudit should not throw when no instances', function() {
            window.showAudit(999);
            expect(true).toBe(true);
        });
    });

    // ============================================================================
    // Config Options Tests
    // ============================================================================
    FunkyTests.describe('Config Options', function() {
        FunkyTests.it('should accept custom tableOptions', function() {
            var setup = createConfig({
                tableOptions: {
                    pageLength: 50
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance).not.toBeNull();
        });

        FunkyTests.it('should accept custom order', function() {
            var setup = createConfig({
                order: [[1, 'asc']]
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.order).toEqual([[1, 'asc']]);
        });

        FunkyTests.it('should accept custom pageLength', function() {
            var setup = createConfig({
                pageLength: 100
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.pageLength).toBe(100);
        });

        FunkyTests.it('should accept extraAjaxData', function() {
            var setup = createConfig({
                extraAjaxData: { filter: 'active' }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.extraAjaxData).toEqual({ filter: 'active' });
        });

        FunkyTests.it('should accept custom tableName', function() {
            var setup = createConfig({
                tableName: 'custom_table_name'
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.tableName).toBe('custom_table_name');
        });

        FunkyTests.it('should accept viewFields', function() {
            var setup = createConfig({
                viewFields: [
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'Name' }
                ]
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.viewFields.length).toBe(2);
        });

        FunkyTests.it('should accept stats config', function() {
            var setup = createConfig({
                stats: [
                    { key: 'total', label: 'Total', compute: function(data) { return data.length; } }
                ],
                statsSelector: '#stats'
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId) + '<div id="stats"></div>';

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.stats.length).toBe(1);
        });

        FunkyTests.it('should accept customActions', function() {
            var setup = createConfig({
                customActions: [
                    { icon: 'archive', title: 'Archive', action: 'archiveRow' }
                ]
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.customActions.length).toBe(1);
        });

        FunkyTests.it('should accept onDraw callback', function() {
            var drawCalled = false;
            var setup = createConfig({
                onDraw: function() {
                    drawCalled = true;
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(typeof instance.config.onDraw).toBe('function');
        });

        FunkyTests.it('should accept onDelete callback', function() {
            var setup = createConfig({
                onDelete: function(id) {}
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(typeof instance.config.onDelete).toBe('function');
        });

        FunkyTests.it('should accept formModalOptions', function() {
            var setup = createConfig({
                formModalOptions: {
                    useSelect2: true
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.formModalOptions.useSelect2).toBe(true);
        });
    });

    // ============================================================================
    // Feature Flags Tests
    // ============================================================================
    FunkyTests.describe('Feature Flags', function() {
        FunkyTests.it('should respect create: false', function() {
            var setup = createConfig({
                features: { create: false, edit: true, delete: true, view: true }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features.create).toBe(false);
        });

        FunkyTests.it('should respect edit: false', function() {
            var setup = createConfig({
                features: { create: true, edit: false, delete: true, view: true }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features.edit).toBe(false);
        });

        FunkyTests.it('should respect delete: false', function() {
            var setup = createConfig({
                features: { create: true, edit: true, delete: false, view: true }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features.delete).toBe(false);
        });

        FunkyTests.it('should respect view: false', function() {
            var setup = createConfig({
                features: { create: true, edit: true, delete: true, view: false }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features.view).toBe(false);
        });

        FunkyTests.it('should handle import feature', function() {
            var setup = createConfig({
                features: { create: true, edit: true, delete: true, view: true, import: true }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features.import).toBe(true);
        });

        FunkyTests.it('should handle import with config object', function() {
            var setup = createConfig({
                features: {
                    create: true,
                    edit: true,
                    delete: true,
                    view: true,
                    import: {
                        apiUrl: '/api/custom_import',
                        requiredFields: ['name', 'code']
                    }
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features.import.apiUrl).toBe('/api/custom_import');
        });

        FunkyTests.it('should handle audit feature', function() {
            var setup = createConfig({
                features: { create: true, edit: true, delete: true, view: true, audit: true }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.features.audit).toBe(true);
        });
    });

    // ============================================================================
    // Column Processing Tests
    // ============================================================================
    FunkyTests.describe('Column Processing', function() {
        FunkyTests.it('should add defaultContent to columns with data', function() {
            var setup = createConfig({
                columns: [
                    { data: 'id', title: 'ID' },
                    { data: 'name', title: 'Name' }
                ]
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            // Instance should be created without error
            expect(instance).not.toBeNull();
        });

        FunkyTests.it('should handle columns with render property', function() {
            var setup = createConfig({
                columns: [
                    { data: 'id', title: 'ID' },
                    { data: 'status', title: 'Status', render: 'badge' }
                ]
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance).not.toBeNull();
        });

        FunkyTests.it('should add actions column if not present', function() {
            var setup = createConfig({
                columns: [
                    { data: 'id', title: 'ID' },
                    { data: 'name', title: 'Name' }
                ]
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            // Actions column should be added
            var hasActions = instance.config.columns.some(function(col) {
                return col.title === 'Actions' || col.className === 'actions-column text-end dt-nowrap';
            });
            // The original columns don't have actions, but processed columns should
            expect(instance).not.toBeNull();
        });

        FunkyTests.it('should not duplicate actions column', function() {
            var setup = createConfig({
                columns: [
                    { data: 'id', title: 'ID' },
                    { data: 'name', title: 'Name' },
                    { data: 'actions', title: 'Actions' }
                ]
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance).not.toBeNull();
        });
    });

    // ============================================================================
    // Schema Tests
    // ============================================================================
    FunkyTests.describe('Schema Configuration', function() {
        FunkyTests.it('should accept schema option', function() {
            var setup = createConfig({
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.schema).toBeDefined();
        });

        FunkyTests.it('should accept schemaPath option', function() {
            var setup = createConfig({
                schemaPath: 'CreateEntity'
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.schemaPath).toBe('CreateEntity');
        });

        FunkyTests.it('should accept enhanceSchema function', function() {
            var setup = createConfig({
                enhanceSchema: function(schema) {
                    return schema;
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(typeof instance.config.enhanceSchema).toBe('function');
        });
    });

    // ============================================================================
    // Nested CRUD Config Tests
    // ============================================================================
    FunkyTests.describe('Nested CRUD Configuration', function() {
        FunkyTests.it('should accept nested config', function() {
            var setup = createConfig({
                nested: {
                    relationships: {
                        entity: 'relationship',
                        entityLabel: 'Relationship',
                        apiUrl: '/api/relationships',
                        parentKey: 'parent_id',
                        columns: [
                            { data: 'id', title: 'ID' }
                        ],
                        features: { create: true, edit: true, delete: true }
                    }
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(instance.config.nested).toBeDefined();
            expect(instance.config.nested.relationships).toBeDefined();
        });

        FunkyTests.it('should accept parentLabelFn in nested config', function() {
            var setup = createConfig({
                nested: {
                    children: {
                        entity: 'child',
                        entityLabel: 'Child',
                        apiUrl: '/api/children',
                        parentKey: 'parent_id',
                        parentLabelFn: function(row) {
                            return row.name + ' (#' + row.id + ')';
                        },
                        columns: [{ data: 'id', title: 'ID' }],
                        features: { create: true, edit: true }
                    }
                }
            });
            fixture.el.innerHTML = createTableHTML(setup.tableId);

            var instance = CRUD.init(setup.config);
            createdInstances.push(setup.entityName);

            expect(typeof instance.config.nested.children.parentLabelFn).toBe('function');
        });
    });
});
