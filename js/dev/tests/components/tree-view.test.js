/**
 * Funky.TreeView Tests
 *
 * Tests for the hierarchical data display component with expand/collapse,
 * selection, filtering, and drag-and-drop support.
 */

describe('Funky.Component.TreeView', function() {

    var TreeView = Funky.TreeView;
    var fixture;
    var treeView;

    // Sample nested data
    var sampleNestedData = [
        {
            id: 'root1',
            label: 'Root 1',
            children: [
                { id: 'child1-1', label: 'Child 1.1' },
                {
                    id: 'child1-2',
                    label: 'Child 1.2',
                    children: [
                        { id: 'grandchild1-2-1', label: 'Grandchild 1.2.1' }
                    ]
                }
            ]
        },
        {
            id: 'root2',
            label: 'Root 2',
            children: [
                { id: 'child2-1', label: 'Child 2.1' }
            ]
        }
    ];

    // Sample flat data
    var sampleFlatData = [
        { id: 'flat-root', label: 'Flat Root', parentId: null },
        { id: 'flat-child1', label: 'Flat Child 1', parentId: 'flat-root' },
        { id: 'flat-child2', label: 'Flat Child 2', parentId: 'flat-root' },
        { id: 'flat-grandchild', label: 'Flat Grandchild', parentId: 'flat-child1' }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="tree-container"></div>'
        );
    });

    afterEach(function() {
        if (treeView) {
            // Only destroy if the instance was fully initialized
            if (typeof treeView.destroy === 'function') {
                treeView.destroy();
            }
            treeView = null;
        }
        fixture.destroy();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('TreeView')).toBe(true);
        });

        it('has init factory method', function() {
            expect(typeof TreeView.init).toBe('function');
        });

        it('has getInstance method for registry access', function() {
            // TreeView uses internal registry, exposed via getInstance
            expect(typeof TreeView.getInstance).toBe('function');
        });

    });

    describe('Constructor', function() {

        it('creates instance with element selector', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView).toBeDefined();
            expect(treeView.element).toBe(document.getElementById('tree-container'));
        });

        it('creates instance with element reference', function() {
            var container = document.getElementById('tree-container');
            treeView = TreeView.init(container, {
                data: sampleNestedData
            });

            expect(treeView.element).toBe(container);
        });

        it('handles missing container gracefully', function() {
            var instance = TreeView.init('#non-existent', {
                data: sampleNestedData
            });

            expect(instance.element).toBeNull();
            // Note: instance is not fully initialized, don't assign to treeView
        });

        it('initializes with empty data', function() {
            treeView = TreeView.init('#tree-container', {
                data: []
            });

            expect(treeView.nodes).toEqual([]);
        });

        it('calls onInit callback', function() {
            var initCalled = false;

            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                onInit: function() {
                    initCalled = true;
                }
            });

            expect(initCalled).toBe(true);
        });

        it('stores instance reference on element', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.element._funkyTreeView).toBe(treeView);
        });

    });

    describe('Data Handling', function() {

        it('normalizes nested data', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                dataFormat: 'nested'
            });

            expect(treeView.nodes.length).toBe(2);
            expect(treeView.nodes[0].id).toBe('root1');
            expect(treeView.nodes[0].children.length).toBe(2);
        });

        it('converts flat data to nested', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleFlatData,
                dataFormat: 'flat'
            });

            expect(treeView.nodes.length).toBe(1);
            expect(treeView.nodes[0].id).toBe('flat-root');
            expect(treeView.nodes[0].children.length).toBe(2);
        });

        it('builds node lookup map', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.nodeMap.get('root1')).toBeDefined();
            expect(treeView.nodeMap.get('child1-1')).toBeDefined();
            expect(treeView.nodeMap.get('grandchild1-2-1')).toBeDefined();
        });

        it('sets correct depth for nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.nodeMap.get('root1')._depth).toBe(0);
            expect(treeView.nodeMap.get('child1-1')._depth).toBe(1);
            expect(treeView.nodeMap.get('grandchild1-2-1')._depth).toBe(2);
        });

        it('sets parent references', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.nodeMap.get('root1')._parent).toBeNull();
            expect(treeView.nodeMap.get('child1-1')._parent.id).toBe('root1');
        });

    });

    describe('DOM Rendering', function() {

        it('adds tree-view class to element', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.element.classList.contains('funky-tree-view')).toBe(true);
        });

        it('creates container with role="tree"', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.container.getAttribute('role')).toBe('tree');
        });

        it('creates live region for announcements', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.liveRegion).toBeDefined();
            expect(treeView.liveRegion.getAttribute('role')).toBe('status');
            expect(treeView.liveRegion.getAttribute('aria-live')).toBe('polite');
        });

        it('renders tree nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var rows = treeView.container.querySelectorAll('.tree-view-row');
            expect(rows.length).toBeGreaterThan(0);
        });

        it('renders with guide lines when showGuides is true', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                showGuides: true
            });

            expect(treeView.container.classList.contains('tree-view-guides')).toBe(true);
        });

        it('shows search input when showSearch is true', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                showSearch: true
            });

            expect(treeView.searchInput).toBeDefined();
            expect(treeView.searchWrapper).toBeDefined();
        });

    });

    describe('Expand/Collapse', function() {

        it('expands a node', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            treeView.expand('root1');

            expect(treeView.expandedIds.has('root1')).toBe(true);
        });

        it('collapses a node', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                expandedIds: ['root1']
            });

            treeView.collapse('root1');

            expect(treeView.expandedIds.has('root1')).toBe(false);
        });

        it('toggles a node', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            treeView.toggle('root1');
            expect(treeView.expandedIds.has('root1')).toBe(true);

            treeView.toggle('root1');
            expect(treeView.expandedIds.has('root1')).toBe(false);
        });

        it('expands all nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            treeView.expandAll();

            expect(treeView.expandedIds.has('root1')).toBe(true);
            expect(treeView.expandedIds.has('root2')).toBe(true);
            expect(treeView.expandedIds.has('child1-2')).toBe(true);
        });

        it('collapses all nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                expandedIds: ['root1', 'root2', 'child1-2']
            });

            treeView.collapseAll();

            expect(treeView.expandedIds.size).toBe(0);
        });

        it('calls onExpand callback', function() {
            var expandedNode = null;

            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                onExpand: function(node) {
                    expandedNode = node;
                }
            });

            treeView.expand('root1');

            expect(expandedNode).not.toBeNull();
            expect(expandedNode.id).toBe('root1');
        });

        it('calls onCollapse callback', function() {
            var collapsedNode = null;

            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                expandedIds: ['root1'],
                onCollapse: function(node) {
                    collapsedNode = node;
                }
            });

            treeView.collapse('root1');

            expect(collapsedNode).not.toBeNull();
            expect(collapsedNode.id).toBe('root1');
        });

    });

    describe('Selection', function() {

        it('selects a node in single mode', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'single'
            });

            treeView.selectNode('child1-1');

            expect(treeView.isSelected('child1-1')).toBe(true);
        });

        it('deselects previous node in single mode', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'single'
            });

            treeView.selectNode('child1-1');
            treeView.selectNode('child1-2');

            expect(treeView.isSelected('child1-1')).toBe(false);
            expect(treeView.isSelected('child1-2')).toBe(true);
        });

        it('allows multiple selection in multi mode', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi'
            });

            treeView.selectNode('child1-1');
            treeView.selectNode('child1-2');

            expect(treeView.isSelected('child1-1')).toBe(true);
            expect(treeView.isSelected('child1-2')).toBe(true);
        });

        it('deselects a node', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi'
            });

            treeView.selectNode('child1-1');
            treeView.deselectNode('child1-1');

            expect(treeView.isSelected('child1-1')).toBe(false);
        });

        it('selects all nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi'
            });

            treeView.selectAll();

            expect(treeView.getSelectedIds().length).toBeGreaterThan(0);
        });

        it('deselects all nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi',
                selectedIds: ['root1', 'child1-1']
            });

            treeView.deselectAll();

            expect(treeView.getSelectedIds().length).toBe(0);
        });

        it('returns selected nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi',
                selectedIds: ['child1-1', 'child2-1']
            });

            var selected = treeView.getSelected();

            expect(selected.length).toBe(2);
            expect(selected.map(function(n) { return n.id; })).toContain('child1-1');
            expect(selected.map(function(n) { return n.id; })).toContain('child2-1');
        });

        it('returns selected IDs', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi',
                selectedIds: ['child1-1', 'child2-1']
            });

            var selectedIds = treeView.getSelectedIds();

            expect(selectedIds).toContain('child1-1');
            expect(selectedIds).toContain('child2-1');
        });

        it('calls onSelect callback', function() {
            var selectData = null;

            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'single',
                onSelect: function(data) {
                    selectData = data;
                }
            });

            treeView.selectNode('child1-1');

            expect(selectData).not.toBeNull();
        });

    });

    describe('Filtering', function() {

        it('filters nodes by query', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                showSearch: true
            });

            treeView.filter('Grandchild');

            expect(treeView.isFiltered()).toBe(true);
            expect(treeView.filteredIds).toBeDefined();
        });

        it('clears filter', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                showSearch: true
            });

            treeView.filter('Grandchild');
            treeView.clearFilter();

            expect(treeView.isFiltered()).toBe(false);
            expect(treeView.filterQuery).toBe('');
        });

        it('returns filtered nodes', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            treeView.filter('Child 1');
            var filtered = treeView.getFilteredNodes();

            expect(filtered.length).toBeGreaterThan(0);
        });

        it('calls onFilter callback', function() {
            var filterData = null;

            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                onFilter: function(data) {
                    filterData = data;
                }
            });

            treeView.filter('Root');

            expect(filterData).not.toBeNull();
        });

    });

    describe('Node Lookup', function() {

        it('gets node by ID', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var node = treeView.getNode('child1-2');

            expect(node).toBeDefined();
            expect(node.id).toBe('child1-2');
            expect(node.label).toBe('Child 1.2');
        });

        it('returns null for non-existent node', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var node = treeView.getNode('non-existent');

            expect(node).toBeNull();
        });

        it('gets all nodes as flat array', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var allNodes = treeView.getAllNodes();

            expect(Array.isArray(allNodes)).toBe(true);
            expect(allNodes.length).toBe(6); // 2 roots + 3 children + 1 grandchild
        });

    });

    describe('Data Updates', function() {

        it('sets new data', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var newData = [{ id: 'new-root', label: 'New Root' }];
            treeView.setData(newData);

            expect(treeView.nodes.length).toBe(1);
            expect(treeView.nodes[0].id).toBe('new-root');
        });

        it('gets current data', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var data = treeView.getData();

            expect(data).toEqual(treeView.nodes);
        });

        it('refreshes with new data', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var newData = [{ id: 'refreshed-root', label: 'Refreshed Root' }];
            treeView.refresh(newData);

            expect(treeView.nodes[0].id).toBe('refreshed-root');
        });

    });

    describe('Drag and Drop', function() {

        it('enables drag mode', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                draggable: false
            });

            treeView.enableDrag(true);

            expect(treeView.dragEnabled).toBe(true);
        });

        it('disables drag mode', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                draggable: true
            });

            treeView.enableDrag(false);

            expect(treeView.dragEnabled).toBe(false);
        });

        it('tracks move history', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                draggable: true
            });

            expect(treeView.moveHistory).toBeDefined();
            expect(Array.isArray(treeView.moveHistory)).toBe(true);
        });

        it('checks canUndo', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                draggable: true
            });

            expect(treeView.canUndo()).toBe(false);
        });

        it('clears history', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                draggable: true
            });

            treeView.clearHistory();

            expect(treeView.moveHistory.length).toBe(0);
        });

    });

    describe('Accessibility', function() {

        it('container is focusable', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.container.getAttribute('tabindex')).toBe('0');
        });

        it('has aria-label on container', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.container.getAttribute('aria-label')).toBe('Tree view');
        });

        it('nodes have treeitem role', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            var items = treeView.container.querySelectorAll('[role="treeitem"]');
            expect(items.length).toBeGreaterThan(0);
        });

        it('has live region for announcements', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.liveRegion).toBeDefined();
            expect(treeView.liveRegion.getAttribute('aria-atomic')).toBe('true');
        });

    });

    describe('Keyboard Navigation', function() {

        it('tracks focused node', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.focusedNodeId).toBeDefined();
        });

        it('has type-ahead buffer', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            expect(treeView.typeAheadBuffer).toBe('');
        });

    });

    describe('destroy()', function() {

        it('cleans up DOM', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            treeView.destroy();

            // The class is removed from the element itself
            expect(treeView.element.classList.contains('funky-tree-view')).toBe(false);
            // Element children are cleared
            expect(treeView.element.children.length).toBe(0);
        });

        it('removes instance from registry', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            // TreeView generates its own instance ID (e.g., 'tree-view-1')
            var instanceId = treeView.id;
            expect(TreeView.getInstance(instanceId)).toBe(treeView);

            treeView.destroy();

            expect(TreeView.getInstance(instanceId)).toBeNull();
            treeView = null; // Prevent double destroy in afterEach
        });

        it('clears internal state', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi',
                selectedIds: ['child1-1']
            });

            treeView.destroy();

            expect(treeView.nodes.length).toBe(0);
            expect(treeView.nodeMap.size).toBe(0);
            treeView = null;
        });

    });

    describe('Events', function() {

        it('emits funky.tree-view.select on selection', function(done) {
            var eventFired = false;

            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'single'
            });

            treeView.element.addEventListener('funky.tree-view.select', function() {
                eventFired = true;
            });

            treeView.selectNode('child1-1');

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 50);
        });

        it('emits funky.tree-view.filter on filter', function(done) {
            var eventFired = false;

            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData
            });

            treeView.element.addEventListener('funky.tree-view.filter', function() {
                eventFired = true;
            });

            treeView.filter('Root');

            setTimeout(function() {
                expect(eventFired).toBe(true);
                done();
            }, 50);
        });

    });

    describe('Initial State', function() {

        it('respects initial expandedIds', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                expandedIds: ['root1', 'child1-2']
            });

            expect(treeView.expandedIds.has('root1')).toBe(true);
            expect(treeView.expandedIds.has('child1-2')).toBe(true);
        });

        it('respects initial selectedIds', function() {
            treeView = TreeView.init('#tree-container', {
                data: sampleNestedData,
                selectable: 'multi',
                selectedIds: ['child1-1', 'child2-1']
            });

            expect(treeView.selectedIds.has('child1-1')).toBe(true);
            expect(treeView.selectedIds.has('child2-1')).toBe(true);
        });

    });

});
