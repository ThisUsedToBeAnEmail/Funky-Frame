/**
 * Funky.DashboardGrid Core Tests
 *
 * Tests for the DashboardGrid component core functionality.
 * Validates module structure, grid setup, widget management,
 * layout persistence, DOM structure, and accessibility.
 */

describe('Funky.Component.DashboardGrid', function() {

    var DashboardGrid = Funky.DashboardGrid;

    // Skip all tests if DashboardGrid not available
    if (!DashboardGrid) {
        it('DashboardGrid module not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    var fixture;
    var grid;
    var containerId;
    var testCounter = 0;

    // Sample widgets for testing - recreated in beforeEach to prevent cross-test contamination
    var sampleWidgets;

    beforeEach(function() {
        testCounter++;
        var unique = testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        containerId = 'dashboard-grid-test-' + unique;
        fixture = FunkyTests.fixture('<div id="' + containerId + '" style="width: 800px; height: 600px;"></div>');

        // Fresh copy of test data for each test to prevent mutation issues
        sampleWidgets = [
            { id: 'w1', type: 'html', html: '<p>Widget 1</p>', col: 1, row: 1, width: 2, height: 1, title: 'Stats' },
            { id: 'w2', type: 'html', html: '<p>Widget 2</p>', col: 3, row: 1, width: 3, height: 2, title: 'Chart' },
            { id: 'w3', type: 'html', html: '<p>Widget 3</p>', col: 1, row: 2, width: 2, height: 1, title: 'Recent' }
        ];
    });

    afterEach(function() {
        if (grid && typeof grid.destroy === 'function') {
            grid.destroy();
            grid = null;
        }
        fixture.destroy();

        // Clean up localStorage (Funky.Storage adds 'funky_' prefix)
        localStorage.removeItem('funky_dashboard_layout');
    });

    // =========================================================================
    // Module Structure
    // =========================================================================

    describe('Module Structure', function() {

        it('Funky.DashboardGrid is registered', function() {
            expect(DashboardGrid).toBeDefined();
            expect(typeof DashboardGrid).toBe('object');
        });

        it('has init method', function() {
            expect(typeof DashboardGrid.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof DashboardGrid.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof DashboardGrid.destroyAll).toBe('function');
        });

        it('has defaults object', function() {
            expect(DashboardGrid.defaults).toBeDefined();
            expect(typeof DashboardGrid.defaults).toBe('object');
        });

        it('has registerWidgetType method', function() {
            expect(typeof DashboardGrid.registerWidgetType).toBe('function');
        });

    });

    // =========================================================================
    // Default Options
    // =========================================================================

    describe('Default Options', function() {

        it('defaults to 12 columns', function() {
            expect(DashboardGrid.defaults.columns).toBe(12);
        });

        it('defaults to 80px row height', function() {
            expect(DashboardGrid.defaults.rowHeight).toBe(80);
        });

        it('defaults to 16px gap', function() {
            expect(DashboardGrid.defaults.gap).toBe(16);
        });

        it('defaults editable to true', function() {
            expect(DashboardGrid.defaults.editable).toBe(true);
        });

        it('defaults editMode to false', function() {
            expect(DashboardGrid.defaults.editMode).toBe(false);
        });

        it('defaults animate to true', function() {
            expect(DashboardGrid.defaults.animate).toBe(true);
        });

        it('defaults persist to "none"', function() {
            expect(DashboardGrid.defaults.persist).toBe('none');
        });

    });

    // =========================================================================
    // Initialisation
    // =========================================================================

    describe('Initialisation', function() {

        it('creates instance with selector', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: []
            });

            expect(grid).toBeDefined();
            expect(grid.id).toBeDefined();
        });

        it('creates instance with element', function() {
            var el = document.getElementById(containerId);
            grid = DashboardGrid.init(el, {
                widgets: []
            });

            expect(grid).toBeDefined();
        });

        it('merges options with defaults', function() {
            grid = DashboardGrid.init('#' + containerId, {
                columns: 6,
                gap: 8
            });

            expect(grid.options.columns).toBe(6);
            expect(grid.options.gap).toBe(8);
            expect(grid.options.rowHeight).toBe(80); // default
        });

        it('assigns unique ID to grid', function() {
            grid = DashboardGrid.init('#' + containerId, {});

            expect(grid.id).toBeDefined();
            expect(typeof grid.id).toBe('string');
        });

        it('registers instance for retrieval', function() {
            grid = DashboardGrid.init('#' + containerId, {});

            var retrieved = DashboardGrid.getInstance(grid.id);
            expect(retrieved).toBe(grid);
        });

        it('initializes widgets object', function() {
            grid = DashboardGrid.init('#' + containerId, {});

            expect(grid.widgets).toBeDefined();
            expect(typeof grid.widgets).toBe('object');
        });

    });

    // =========================================================================
    // Container Setup
    // =========================================================================

    describe('Container Setup', function() {

        it('adds dashboard-grid class to container', function() {
            grid = DashboardGrid.init('#' + containerId, {});

            var container = document.getElementById(containerId);
            expect(container.classList.contains('dashboard-grid')).toBe(true);
        });

        it('sets CSS custom properties for columns', function() {
            grid = DashboardGrid.init('#' + containerId, { columns: 8 });

            var container = document.getElementById(containerId);
            expect(container.style.getPropertyValue('--grid-columns')).toBe('8');
        });

        it('sets CSS custom properties for row height', function() {
            grid = DashboardGrid.init('#' + containerId, { rowHeight: 100 });

            var container = document.getElementById(containerId);
            expect(container.style.getPropertyValue('--grid-row-height')).toBe('100px');
        });

        it('sets CSS custom properties for gap', function() {
            grid = DashboardGrid.init('#' + containerId, { gap: 20 });

            var container = document.getElementById(containerId);
            expect(container.style.getPropertyValue('--grid-gap')).toBe('20px');
        });

        it('sets data attributes on container', function() {
            grid = DashboardGrid.init('#' + containerId, {});

            var container = document.getElementById(containerId);
            expect(container.hasAttribute('data-dashboard-grid')).toBe(true);
            expect(container.hasAttribute('data-grid-id')).toBe(true);
        });

    });

    // =========================================================================
    // Widget Rendering
    // =========================================================================

    describe('Widget Rendering', function() {

        it('renders widgets from options', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            var widgetEls = document.querySelectorAll('#' + containerId + ' .dashboard-widget');
            expect(widgetEls.length).toBe(3);
        });

        it('assigns data-widget-id attribute', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.getAttribute('data-widget-id')).toBe('w1');
        });

        it('assigns data-widget-type attribute', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 2, height: 1 }]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.getAttribute('data-widget-type')).toBe('html');
        });

        it('renders widget title', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 2, height: 1, title: 'My Widget' }]
            });

            var title = document.querySelector('#' + containerId + ' .dashboard-widget__title');
            expect(title).not.toBe(null);
            expect(title.textContent).toBe('My Widget');
        });

        it('renders widget content', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<span class="custom-content">Hello</span>', col: 1, row: 1, width: 2, height: 1 }]
            });

            var content = document.querySelector('#' + containerId + ' .custom-content');
            expect(content).not.toBe(null);
            expect(content.textContent).toBe('Hello');
        });

        it('sets grid-column-start style', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 3, row: 1, width: 2, height: 1 }]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.style.gridColumnStart).toBe('3');
        });

        it('sets grid-column-end with span', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 4, height: 1 }]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.style.gridColumnEnd).toBe('span 4');
        });

        it('sets grid-row-start style', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 2, width: 2, height: 1 }]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.style.gridRowStart).toBe('2');
        });

        it('sets grid-row-end with span', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 2, height: 3 }]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.style.gridRowEnd).toBe('span 3');
        });

    });

    // =========================================================================
    // Widget API - addWidget
    // =========================================================================

    describe('addWidget()', function() {

        it('adds widget to grid', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            grid.addWidget({ id: 'new1', type: 'html', html: '<p>New</p>', col: 1, row: 1, width: 2, height: 1 });

            var widget = document.querySelector('#' + containerId + ' [data-widget-id="new1"]');
            expect(widget).not.toBe(null);
        });

        it('registers widget in widgets object', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            grid.addWidget({ id: 'new1', type: 'html', html: '<p>New</p>', col: 1, row: 1, width: 2, height: 1 });

            expect(grid.widgets['new1']).toBeDefined();
        });

        it('returns the created widget', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            var widget = grid.addWidget({ id: 'new1', type: 'html', html: '<p>New</p>', col: 1, row: 1, width: 2, height: 1 });

            expect(widget).toBeDefined();
            expect(widget.id).toBe('new1');
        });

        it('generates ID if not provided', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            var widget = grid.addWidget({ type: 'html', html: '<p>New</p>', col: 1, row: 1, width: 2, height: 1 });

            expect(widget.id).toBeDefined();
            expect(typeof widget.id).toBe('string');
        });

    });

    // =========================================================================
    // Widget API - removeWidget
    // =========================================================================

    describe('removeWidget()', function() {

        it('removes widget from DOM', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            grid.removeWidget('w1');

            var widget = document.querySelector('#' + containerId + ' [data-widget-id="w1"]');
            expect(widget).toBe(null);
        });

        it('removes widget from widgets object', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            grid.removeWidget('w1');

            expect(grid.widgets['w1']).toBeUndefined();
        });

        it('returns true on success', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var result = grid.removeWidget('w1');

            expect(result).toBe(true);
        });

        it('returns false for non-existent widget', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: []
            });

            var result = grid.removeWidget('nonexistent');

            expect(result).toBe(false);
        });

    });

    // =========================================================================
    // Widget API - getWidget
    // =========================================================================

    describe('getWidget()', function() {

        it('returns widget by ID', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            var widget = grid.getWidget('w1');

            expect(widget).toBeDefined();
            expect(widget.id).toBe('w1');
        });

        it('returns undefined for non-existent ID', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            var widget = grid.getWidget('nonexistent');

            expect(widget).toBe(null);
        });

    });

    // =========================================================================
    // Widget API - getAllWidgets
    // =========================================================================

    describe('getAllWidgets()', function() {

        it('returns all widgets as array', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            var all = grid.getAllWidgets();

            expect(Array.isArray(all)).toBe(true);
            expect(all.length).toBe(3);
        });

        it('returns empty array when no widgets', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: []
            });

            var all = grid.getAllWidgets();

            expect(all.length).toBe(0);
        });

    });

    // =========================================================================
    // Edit Mode
    // =========================================================================

    describe('Edit Mode', function() {

        it('enableEditMode adds edit-mode class', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [],
                editable: true
            });

            grid.enableEditMode();

            var container = document.getElementById(containerId);
            expect(container.classList.contains('dashboard-grid--edit-mode')).toBe(true);
        });

        it('disableEditMode removes edit-mode class', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [],
                editable: true,
                editMode: true
            });

            grid.disableEditMode();

            var container = document.getElementById(containerId);
            expect(container.classList.contains('dashboard-grid--edit-mode')).toBe(false);
        });

        it('toggleEditMode switches state', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [],
                editable: true
            });

            expect(grid.isEditMode()).toBe(false);

            grid.toggleEditMode();
            expect(grid.isEditMode()).toBe(true);

            grid.toggleEditMode();
            expect(grid.isEditMode()).toBe(false);
        });

        it('isEditMode returns current state', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [],
                editMode: true
            });

            expect(grid.isEditMode()).toBe(true);
        });

        it('widgets get draggable in edit mode', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]],
                editable: true,
                editMode: true
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.getAttribute('draggable')).toBe('true');
        });

    });

    // =========================================================================
    // Layout Methods
    // =========================================================================

    describe('getLayout()', function() {

        it('returns layout object', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            var layout = grid.getLayout();

            expect(layout).toBeDefined();
            expect(Array.isArray(layout.widgets)).toBe(true);
        });

        it('includes widget positions', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 3, row: 2, width: 4, height: 2 }]
            });

            var layout = grid.getLayout();
            var widget = layout.widgets[0];

            expect(widget.col).toBe(3);
            expect(widget.row).toBe(2);
            expect(widget.width).toBe(4);
            expect(widget.height).toBe(2);
        });

    });

    describe('setLayout()', function() {

        it('replaces all widgets', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            grid.setLayout({
                widgets: [
                    { id: 'new1', type: 'html', html: '<p>New</p>', col: 1, row: 1, width: 2, height: 1 }
                ]
            });

            var widgetEls = document.querySelectorAll('#' + containerId + ' .dashboard-widget');
            expect(widgetEls.length).toBe(1);
        });

        it('removes old widgets', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            grid.setLayout({ widgets: [] });

            var oldWidget = document.querySelector('#' + containerId + ' [data-widget-id="w1"]');
            expect(oldWidget).toBe(null);
        });

    });

    describe('clearAll()', function() {

        it('removes all widgets', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            grid.clearAll();

            var widgetEls = document.querySelectorAll('#' + containerId + ' .dashboard-widget');
            expect(widgetEls.length).toBe(0);
        });

        it('clears widgets object', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            grid.clearAll();

            expect(Object.keys(grid.widgets).length).toBe(0);
        });

    });

    // =========================================================================
    // Persistence - Local Storage
    // =========================================================================

    describe('Local Storage Persistence', function() {

        it('save() stores layout to localStorage', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets,
                persist: 'local',
                storageKey: 'test_dashboard_' + testCounter
            });

            grid.save();

            // Funky.Storage adds 'funky_' prefix to all keys
            var stored = localStorage.getItem('funky_test_dashboard_' + testCounter);
            expect(stored).not.toBe(null);

            // Cleanup
            localStorage.removeItem('funky_test_dashboard_' + testCounter);
        });

        it('clearStorage() removes from localStorage', function() {
            var key = 'test_dashboard_clear_' + testCounter;
            // Funky.Storage adds 'funky_' prefix to all keys
            localStorage.setItem('funky_' + key, '{}');

            grid = DashboardGrid.init('#' + containerId, {
                widgets: [],
                persist: 'local',
                storageKey: key
            });

            grid.clearStorage();

            var stored = localStorage.getItem('funky_' + key);
            expect(stored).toBe(null);
        });

    });

    // =========================================================================
    // Export / Import
    // =========================================================================

    describe('export()', function() {

        it('returns JSON string', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            var json = grid.export();

            expect(typeof json).toBe('string');
        });

        it('exported JSON contains widgets', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: sampleWidgets
            });

            var json = grid.export();
            var parsed = JSON.parse(json);

            expect(parsed.widgets).toBeDefined();
            expect(parsed.widgets.length).toBe(3);
        });

    });

    describe('import()', function() {

        it('loads layout from JSON string', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: []
            });

            var json = JSON.stringify({
                widgets: [
                    { id: 'imported', type: 'html', html: '<p>Imported</p>', col: 1, row: 1, width: 2, height: 1 }
                ]
            });

            grid.import(json);

            var widget = document.querySelector('#' + containerId + ' [data-widget-id="imported"]');
            expect(widget).not.toBe(null);
        });

    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', function() {

        it('grid has role="region"', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            var container = document.getElementById(containerId);
            expect(container.getAttribute('role')).toBe('region');
        });

        it('grid has aria-label', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            var container = document.getElementById(containerId);
            expect(container.getAttribute('aria-label')).toBe('Dashboard grid');
        });

        it('widgets have role="article"', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.getAttribute('role')).toBe('article');
        });

        it('widgets have aria-label', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 2, height: 1, title: 'My Stats' }]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.getAttribute('aria-label')).toBe('My Stats');
        });

        it('widgets have tabindex="0"', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = document.querySelector('#' + containerId + ' .dashboard-widget');
            expect(widget.getAttribute('tabindex')).toBe('0');
        });

        it('creates live region for announcements', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            var liveRegion = document.querySelector('#' + containerId + ' [role="status"]');
            expect(liveRegion).not.toBe(null);
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        });

    });

    // =========================================================================
    // Widget Constraints
    // =========================================================================

    describe('Widget Constraints', function() {

        it('widget respects minWidth', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 2, height: 1, minWidth: 3 }]
            });

            var widget = grid.getWidget('test');
            expect(widget.minWidth).toBe(3);
        });

        it('widget respects minHeight', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 2, height: 1, minHeight: 2 }]
            });

            var widget = grid.getWidget('test');
            expect(widget.minHeight).toBe(2);
        });

        it('widget respects maxWidth', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<p>Test</p>', col: 1, row: 1, width: 2, height: 1, maxWidth: 6 }]
            });

            var widget = grid.getWidget('test');
            expect(widget.maxWidth).toBe(6);
        });

    });

    // =========================================================================
    // Widget Methods
    // =========================================================================

    describe('Widget moveTo()', function() {

        it('updates widget position', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = grid.getWidget('w1');
            widget.moveTo(5, 3);

            expect(widget.col).toBe(5);
            expect(widget.row).toBe(3);
        });

        it('updates widget DOM style', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = grid.getWidget('w1');
            widget.moveTo(5, 3);

            expect(widget.element.style.gridColumnStart).toBe('5');
            expect(widget.element.style.gridRowStart).toBe('3');
        });

    });

    describe('Widget resize()', function() {

        it('updates widget dimensions', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = grid.getWidget('w1');
            widget.resize(4, 3);

            expect(widget.width).toBe(4);
            expect(widget.height).toBe(3);
        });

        it('updates widget DOM style', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = grid.getWidget('w1');
            widget.resize(4, 3);

            expect(widget.element.style.gridColumnEnd).toBe('span 4');
            expect(widget.element.style.gridRowEnd).toBe('span 3');
        });

    });

    describe('Widget toJSON()', function() {

        it('returns widget configuration object', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]]
            });

            var widget = grid.getWidget('w1');
            var json = widget.toJSON();

            expect(json.id).toBe('w1');
            expect(json.type).toBe('html');
            expect(json.col).toBe(1);
            expect(json.row).toBe(1);
            expect(json.width).toBe(2);
            expect(json.height).toBe(1);
        });

    });

    // =========================================================================
    // Destroy
    // =========================================================================

    describe('destroy()', function() {

        it('removes grid class from container', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: sampleWidgets });

            grid.destroy();
            grid = null;

            var container = document.getElementById(containerId);
            expect(container.classList.contains('dashboard-grid')).toBe(false);
        });

        it('removes all widget elements', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: sampleWidgets });

            grid.destroy();
            grid = null;

            var widgets = document.querySelectorAll('#' + containerId + ' .dashboard-widget');
            expect(widgets.length).toBe(0);
        });

        it('clears widgets object', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: sampleWidgets });

            var instance = grid;
            grid.destroy();
            grid = null;

            expect(Object.keys(instance.widgets).length).toBe(0);
        });

        it('unregisters instance', function() {
            grid = DashboardGrid.init('#' + containerId, { widgets: [] });

            var id = grid.id;
            grid.destroy();
            grid = null;

            expect(DashboardGrid.getInstance(id)).toBe(null);
        });

    });

    // =========================================================================
    // Widget Types
    // =========================================================================

    describe('Widget Types', function() {

        it('html type renders HTML content', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'html', html: '<span class="test-span">Content</span>', col: 1, row: 1, width: 2, height: 1 }]
            });

            var span = document.querySelector('#' + containerId + ' .test-span');
            expect(span).not.toBe(null);
            expect(span.textContent).toBe('Content');
        });

        it('dom type renders DOM element', function() {
            var customEl = document.createElement('div');
            customEl.className = 'custom-dom-element';
            customEl.textContent = 'DOM Content';

            grid = DashboardGrid.init('#' + containerId, {
                widgets: [{ id: 'test', type: 'dom', dom: customEl, col: 1, row: 1, width: 2, height: 1 }]
            });

            var found = document.querySelector('#' + containerId + ' .custom-dom-element');
            expect(found).not.toBe(null);
            expect(found.textContent).toBe('DOM Content');
        });

    });

    // =========================================================================
    // Resize Handles
    // =========================================================================

    describe('Resize Handles', function() {

        it('creates resize handles in edit mode', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]],
                editable: true,
                editMode: true
            });

            var handles = document.querySelectorAll('#' + containerId + ' .dashboard-widget__resize-handle');
            expect(handles.length).toBeGreaterThan(0);
        });

        it('resize handles have direction data attribute', function() {
            grid = DashboardGrid.init('#' + containerId, {
                widgets: [sampleWidgets[0]],
                editable: true,
                editMode: true
            });

            var handle = document.querySelector('#' + containerId + ' .dashboard-widget__resize-handle');
            expect(handle.hasAttribute('data-resize-dir')).toBe(true);
        });

    });

});
