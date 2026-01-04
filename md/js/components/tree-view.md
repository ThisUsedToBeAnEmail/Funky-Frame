# TreeView Component

Hierarchical tree display with expand/collapse, selection, checkboxes, search/filter, lazy loading, and drag-and-drop support.

> See [Component Base Interface](../core/component-interface.md) for standard API patterns.

## Quick Start

```javascript
var tree = Funky.TreeView.init('#container', {
  data: [
    {
      id: 1,
      label: 'Documents',
      icon: 'fa-folder',
      children: [
        { id: 11, label: 'Work', icon: 'fa-folder' },
        { id: 12, label: 'Personal', icon: 'fa-folder' }
      ]
    },
    { id: 2, label: 'Settings', icon: 'fa-cog' }
  ],
  selectable: 'single',
  onSelect: function(payload) {
    // payload = { nodes: [], ids: [], added: [], removed: [] }
    console.log('Selected:', payload.nodes[0]?.label);
  }
});
```

## Configuration

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | Array | `[]` | Tree node data |
| `dataFormat` | String | `'nested'` | `'nested'` or `'flat'` data format |
| `selectable` | String | `'none'` | `'none'`, `'single'`, or `'multi'` |
| `cascadeSelect` | Boolean | `true` | Multi-select: parent selection cascades to children |
| `expandedIds` | Array | `[]` | Initially expanded node IDs |
| `selectedIds` | Array | `[]` | Initially selected node IDs |
| `draggable` | Boolean | `false` | Enable drag-and-drop |
| `showSearch` | Boolean | `false` | Show search input |

### Node Data

```javascript
{
  id: 1,                    // Unique node identifier (required)
  label: 'Node Label',      // Display text (or use 'name')
  icon: 'fa-folder',        // FontAwesome icon class (optional)
  children: [],             // Child nodes array (optional)
  disabled: false,          // Disable selection/interaction (optional)
  hasChildren: true,        // Indicates lazy-loadable children (optional)
  data: { ... }             // Custom data payload (optional)
}
```

### Icon Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `iconMap` | Object | `{folder, folderOpen, file, loading}` | Icon class mapping |
| `defaultIcon` | String | `'file'` | Default icon key for nodes without icon |

Default `iconMap`:
```javascript
{
  folder: 'fa-folder',
  folderOpen: 'fa-folder-open',
  file: 'fa-file',
  loading: 'fa-spinner fa-spin'
}
```

### Display Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showGuides` | Boolean | `true` | Show indentation guide lines |
| `indentSize` | Number | `20` | Pixels per indent level |
| `animationDuration` | Number | `200` | Collapse/expand animation (ms) |

### Morph Animation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useMorph` | Boolean | `true` | Use Funky.Morph for animations when available |
| `staggerChildren` | Boolean | `true` | Stagger child node appearance |
| `staggerDelay` | Number | `30` | Delay between children (ms) |
| `morphDragDrop` | Boolean | `true` | Animate nodes during drag-and-drop |
| `morphEasing` | String | `'easeOutCubic'` | Easing for morph animations |

### Search/Filter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showSearch` | Boolean | `false` | Show search input above tree |
| `searchPlaceholder` | String | `'Search...'` | Search input placeholder |
| `searchFields` | Array | `['label', 'name']` | Fields to search in |
| `searchDebounce` | Number | `300` | Debounce delay (ms) |
| `autoExpandMatches` | Boolean | `true` | Auto-expand to show matches |
| `noResultsText` | String | `'No matching items found'` | Empty search message |
| `fuzzySearch` | Boolean | `false` | Enable fuzzy matching (requires Funky.FuzzySearch) |
| `fuzzyThreshold` | Number | `0.3` | Minimum fuzzy score (0-1) |
| `fuzzyTokenize` | Boolean | `false` | Split query into space-separated tokens |
| `highlightMatches` | Boolean | `true` | Highlight matched text in labels |

### Drag-and-Drop Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `draggable` | Boolean | `false` | Enable drag-and-drop |
| `dragHandle` | String | `null` | Selector for drag handle (null = whole row) |
| `canDrag` | Function | `null` | Validate if node can be dragged |
| `canDrop` | Function | `null` | Validate drop target/position |
| `onMove` | Function | `null` | Callback after move |

```javascript
{
  draggable: true,
  
  canDrag: function(node) {
    // Return false to prevent dragging
    return !node.disabled;
  },
  
  canDrop: function(dragged, target, position) {
    // position: 'before', 'inside', 'after'
    // Return false to prevent dropping
    return target.id !== 'root';
  },
  
  onMove: function(node, newParent, index) {
    console.log('Moved', node.label, 'to', newParent?.label || 'root');
  }
}
```

### Lazy Loading Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onLoadChildren` | Function | `null` | Callback: `function(node, done, fail)` or returns Promise |
| `onLoadError` | Function | `null` | Callback: `function(node, error)` |
| `cacheChildren` | Boolean | `true` | Cache loaded children |
| `loadingText` | String | `'Loading...'` | Loading indicator text |
| `errorText` | String | `'Failed to load'` | Error state text |
| `retryText` | String | `'Retry'` | Retry button text |

```javascript
{
  onLoadChildren: function(node, done, fail) {
    // Fetch children asynchronously
    fetch('/api/tree/' + node.id + '/children')
      .then(function(res) { return res.json(); })
      .then(function(children) { done(children); })
      .catch(function(err) { fail(err); });
  }
}
```

With Promises:

```javascript
{
  onLoadChildren: function(node) {
    return fetch('/api/tree/' + node.id + '/children')
      .then(function(res) { return res.json(); });
  }
}
```

### Callback Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onExpand` | Function | `null` | Called when node expanded |
| `onCollapse` | Function | `null` | Called when node collapsed |
| `onSelect` | Function | `null` | Called on selection change |
| `onFilter` | Function | `null` | Called when filter applied |
| `onInit` | Function | `null` | Called after initialization |

## Callbacks

Selection callback receives a payload object with consistent structure:

| Callback | Description |
|----------|-------------|
| `onSelect` | Node(s) selected - receives `{ nodes, ids, added, removed }` |
| `onExpand` | Node expanded - receives `(nodeId)` |
| `onCollapse` | Node collapsed - receives `(nodeId)` |
| `onFilter` | Filter applied - receives `{ query, matchedIds }` |
| `onLoadChildren` | Lazy children loaded - callback in signature |
| `onLoadError` | Lazy load failed - receives `(node, error)` |
| `onInit` | Initialization complete - receives `(instance)` |

### Selection Payload

```javascript
{
  nodes: [],    // Array of selected node objects
  ids: [],      // Array of selected node IDs
  added: [],    // IDs added in this change
  removed: []   // IDs removed in this change
}
```

### Example Usage

```javascript
{
  onSelect: function(payload) {
    console.log('Selected nodes:', payload.nodes);
    console.log('Selected IDs:', payload.ids);
    console.log('Newly added:', payload.added);
    console.log('Removed:', payload.removed);
  },
  
  onExpand: function(nodeId) {
    console.log('Expanded:', nodeId);
  }
}
```

## Events

Listen using standard event listeners on the tree element:

```javascript
tree.element.addEventListener('funky.tree-view.select', function(e) {
  console.log('Selected:', e.detail);
});
```

| Event | Detail | Description |
|-------|--------|-------------|
| `funky.tree-view.select` | `{ nodes, ids, added, removed }` | Selection changed |
| `funky.tree-view.filter` | `{ query, matchedIds, matchCount }` | Filter applied |
| `funky.tree-view.filterClear` | `{}` | Filter cleared |
| `funky.tree-view.dragStart` | `{ node }` | Drag started |
| `funky.tree-view.dragOver` | `{ node, target, position }` | Dragging over target |
| `funky.tree-view.move` | `{ node, oldParent, newParent, index }` | Node moved |
| `funky.tree-view.undo` | `{ node }` | Move undone |
| `funky.tree-view.loadStart` | `{ node }` | Lazy load started |
| `funky.tree-view.load` | `{ node, children }` | Lazy children loaded |
| `funky.tree-view.loadError` | `{ node, error }` | Lazy load failed |

## API Methods

### Selection

##### `selectNode(nodeId)`
Select a node by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.selectNode(5);
```

---

##### `deselectNode(nodeId)`
Deselect a node by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.deselectNode(5);
```

---

##### `selectAll()`
Select all nodes.

```javascript
tree.selectAll();
```

---

##### `deselectAll()`
Deselect all nodes. Alias: `clearSelection()`

```javascript
tree.deselectAll();
tree.clearSelection();
```

---

##### `getSelected()`
**Returns:** Array of selected node objects.

```javascript
var selected = tree.getSelected();
```

---

##### `getSelectedIds()`
**Returns:** Array of selected node IDs.

```javascript
var ids = tree.getSelectedIds();
```

---

##### `isSelected(nodeId)`
Check if a node is selected.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

**Returns:** Boolean.

```javascript
if (tree.isSelected(5)) {
  console.log('Node 5 is selected');
}
```

---

### Checkboxes

##### `check(nodeId, checked)`
Check or uncheck node(s).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number/array | Node ID(s) |
| checked | boolean | Check state (default: true) |

```javascript
tree.check(5);                    // Check node
tree.check(5, false);             // Uncheck node
tree.check([1, 2, 3]);            // Check multiple
```

---

##### `getChecked()`
**Returns:** Array of checked node objects.

```javascript
var checked = tree.getChecked();
```

---

##### `clearChecked()`
Uncheck all nodes.

```javascript
tree.clearChecked();
```

---

### Expand/Collapse

##### `expand(nodeId)`
Expand a node.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.expand(5);
```

---

##### `collapse(nodeId)`
Collapse a node.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.collapse(5);
```

---

##### `toggle(nodeId)`
Toggle expand/collapse state.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.toggle(5);
```

---

##### `expandAll()`
Expand all nodes.

```javascript
tree.expandAll();
```

---

##### `collapseAll()`
Collapse all nodes.

```javascript
tree.collapseAll();
```

---

##### `expandToNode(nodeId)`
Expand all ancestors to reveal a specific node.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID to reveal |

```javascript
tree.expandToNode(25);  // Expands parent chain
```

---

### Search/Filter

##### `filter(query)`
Filter or highlight nodes matching query.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| query | string | Search query |

```javascript
tree.filter('documents');
```

---

##### `clearFilter()`
Clear the current filter.

```javascript
tree.clearFilter();
```

---

##### `isFiltered()`
**Returns:** Boolean indicating if filter is active.

```javascript
if (tree.isFiltered()) {
  console.log('Filter is active');
}
```

---

##### `getFilteredNodes()`
**Returns:** Array of nodes matching the current filter.

```javascript
var matches = tree.getFilteredNodes();
```

---

##### `getSearchScore(nodeOrId)`
Get the fuzzy search score for a node.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeOrId | object/string/number | Node or node ID |

**Returns:** Number (0-1, higher is better match).

```javascript
var score = tree.getSearchScore(5);
```

---

##### `getSearchResult(nodeOrId)`
Get detailed search result for a node.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeOrId | object/string/number | Node or node ID |

**Returns:** Object with match details.

```javascript
var result = tree.getSearchResult(5);
```

---

##### `getHighlightedLabel(node)`
Get node label with search highlights applied.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| node | object | Node object |

**Returns:** HTML string with highlights.

```javascript
var html = tree.getHighlightedLabel(node);
```

---

### Data Manipulation

##### `addNode(parentId, node)`
Add a node to the tree.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| parentId | string/number/null | Parent ID (null for root) |
| node | object | Node data |

```javascript
tree.addNode(5, { id: 100, label: 'New Node' });
tree.addNode(null, node);  // Add to root
```

---

##### `removeNode(nodeId)`
Remove a node from the tree.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.removeNode(100);
```

---

##### `updateNode(nodeId, updates)`
Update a node's properties.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |
| updates | object | Properties to update |

```javascript
tree.updateNode(5, { label: 'Updated Label', icon: 'fa-star' });
```

---

##### `getNode(nodeId)`
Get a node by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

**Returns:** Node object or null.

```javascript
var node = tree.getNode(5);
```

---

##### `getAllNodes()`
**Returns:** Flat array of all nodes.

```javascript
var allNodes = tree.getAllNodes();
```

---

##### `setData(data)`
Replace the entire tree data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| data | array | New tree data |

```javascript
tree.setData(newTreeData);
```

---

##### `getData()`
**Returns:** Current tree data structure.

```javascript
var data = tree.getData();
```

---

##### `addData(nodes)`
Add nodes to the tree (at root level).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodes | array/object | Node(s) to add |

```javascript
tree.addData([{ id: 101, label: 'New 1' }, { id: 102, label: 'New 2' }]);
```

---

##### `refresh(newData)`
Re-render the tree. Optionally with new data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| newData | array | (Optional) New data to use |

```javascript
tree.refresh();           // Re-render current data
tree.refresh(newData);    // Replace and re-render
```

---

##### `refreshNode(nodeId)`
Re-render a specific node (useful after lazy load or update).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.refreshNode(5);
```

---

### Drag and Drop

##### `enableDrag(enabled)`
Enable or disable drag-and-drop.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| enabled | boolean | Enable state |

```javascript
tree.enableDrag(true);
tree.enableDrag(false);
```

---

##### `moveNode(nodeId, newParentId, index)`
Programmatically move a node.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node to move |
| newParentId | string/number/null | New parent ID (null for root) |
| index | number | Position in parent's children |

```javascript
tree.moveNode(5, 10, 0);   // Move node 5 to be first child of node 10
tree.moveNode(5, null, 2); // Move node 5 to root at position 2
```

---

### Lazy Loading

##### `loadChildren(nodeId)`
Trigger lazy loading for a node.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| nodeId | string/number | Node ID |

```javascript
tree.loadChildren(5);
```

---

##### `clearCache()`
Clear the lazy-loaded children cache.

```javascript
tree.clearCache();
```

---

### Undo

##### `undo()`
Undo the last move operation.

```javascript
tree.undo();
```

---

##### `canUndo()`
**Returns:** Boolean indicating if undo is available.

```javascript
if (tree.canUndo()) {
  tree.undo();
}
```

---

##### `clearHistory()`
Clear the undo history.

```javascript
tree.clearHistory();
```

---

### Lifecycle

##### `destroy()`
Destroy the TreeView instance and clean up.

```javascript
tree.destroy();
```

---

## Static Methods

##### `Funky.TreeView.init(selector, options)`
Initialize a new TreeView.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| selector | string/HTMLElement | Container selector or element |
| options | object | Configuration options |

**Returns:** TreeView instance.

```javascript
var tree = Funky.TreeView.init('#container', { ... });
```

---

##### `Funky.TreeView.getInstance(idOrElement)`
Get an existing TreeView instance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| idOrElement | string/HTMLElement | ID, selector, or element |

**Returns:** TreeView instance or null.

```javascript
var tree = Funky.TreeView.getInstance('#container');
```

---

##### `Funky.TreeView.destroyAll()`
Destroy all TreeView instances.

```javascript
Funky.TreeView.destroyAll();
```

---

##### `Funky.TreeView.getAll()`
**Returns:** Object with all instances.

```javascript
var all = Funky.TreeView.getAll();
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move focus up/down |
| `←` | Collapse node or move to parent |
| `→` | Expand node or move to first child |
| `Home` | Focus first node |
| `End` | Focus last visible node |
| `Enter` | Select focused node |
| `Space` | Toggle checkbox (if checkable) |
| `*` | Expand all siblings |
| `Ctrl+Z` | Undo last move (if draggable) |
| Type characters | Type-ahead search |

## Touch Support

The TreeView supports touch devices with:

- **Long-press to drag**: Press and hold for 500ms to initiate drag
- **Touch move**: Drag to desired position
- **Auto-scroll**: Scrolls when near container edges
- **Haptic feedback**: Vibration on drag start (if supported)

## ARIA Accessibility

The TreeView implements full ARIA support:

- `role="tree"` on container
- `role="treeitem"` on nodes
- `aria-expanded` for expand state
- `aria-selected` for selection
- `aria-checked` for checkboxes
- `aria-level` for depth
- Live region announcements for screen readers

## Theming

The TreeView uses Funky CSS variables:

```css
/* Container */
--tree-view-bg: var(--pro-bg-secondary);
--tree-view-border: var(--pro-border-color);
--tree-view-radius: 6px;

/* Nodes */
--tree-view-row-height: 36px;
--tree-view-row-hover: var(--pro-bg-hover);
--tree-view-row-selected: var(--pro-accent-primary);

/* Icons */
--tree-view-icon-color: var(--pro-text-secondary);
--tree-view-toggle-color: var(--pro-text-muted);

/* Connectors */
--tree-view-connector-color: var(--pro-border-color);
```

Responds to `data-theme` and `data-density` attributes.

## Examples

### File Browser

```javascript
var fileBrowser = Funky.TreeView.init(container, {
  data: fileSystemData,
  selectable: true,
  draggable: true,
  showSearch: true,
  lazy: true,
  loadChildren: function(node) {
    return fetch('/api/files/' + node.path)
      .then(res => res.json());
  },
  canDrop: function(node, target, position) {
    // Only allow dropping into folders
    return target.type === 'folder' && position === 'inside';
  }
});
```

### Organisation Chart

```javascript
var orgChart = Funky.TreeView.init(container, {
  data: organisationData,
  selectable: true,
  showIcons: true,
  expandedByDefault: true,
  renderNode: function(node) {
    return '<div class="org-node">' +
           '<img src="' + node.avatar + '" class="avatar">' +
           '<div class="info">' +
           '<strong>' + node.name + '</strong>' +
           '<small>' + node.title + '</small>' +
           '</div></div>';
  }
});
```

### Checkbox Selection

```javascript
var tree = Funky.TreeView.init(container, {
  data: categoryData,
  checkable: true,
  cascadeCheck: true,
  showIndeterminate: true,
  onCheck: function(payload) {
    console.log('Checked IDs:', payload.ids);
    console.log('Checked nodes:', payload.nodes);
  }
});

// Get checked items
var selected = tree.getChecked();
```

### Navigation Menu

```javascript
var navTree = Funky.TreeView.init(container, {
  data: menuItems,
  selectable: true,
  expandable: true,
  onSelect: function(payload) {
    var node = payload.nodes[0];
    if (node && node.url) {
      window.location.href = node.url;
    }
  }
});
```

## See Also

- [SideNav](sidenav.md) - Single-level navigation panel
- [Kanban](kanban.md) - Drag-and-drop card board
- [VirtualisedList](virtualised-list.md) - Efficient list rendering

---

## Bindable Interface (LiveBinding)

TreeView implements the **Bindable Interface** for integration with `Funky.LiveBinding`.

### Implemented Methods

| Method | Description |
|--------|-------------|
| `setData(data)` | Replace the entire tree structure with the provided data |
| `getData()` | Retrieve the current tree data structure |
| `addData(nodes)` | Add new nodes to the tree (at root level or with parent specification) |

### Instance Registration

Instances are registered in `Funky.TreeView._instances[containerId]`.

### Usage with LiveBinding

```javascript
// Bind tree view to a WebSocket source
Funky.LiveBinding.bindComponent('#treeContainer', {
  source: 'websocket',
  channel: 'tree-updates'
});

// Bind to API polling
Funky.LiveBinding.bindComponent('#treeContainer', {
  source: 'api',
  endpoint: '/api/tree',
  interval: 10000
});
```
