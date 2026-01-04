# VirtualisedList Component

High-performance virtual scrolling for lists with 100,000+ items. Uses DOM recycling and viewport-based rendering to maintain 60fps performance regardless of data size.

## Quick Start

```javascript
// Initialize with minimal config
var list = Funky.VirtualisedList.init('#container', {
  items: myDataArray,
  itemHeight: 40,
  getItemKey: function(item) { return item.id; },
  renderItem: function(item, index) {
    return '<div class="list-item">' + item.name + '</div>';
  }
});
```

## Features

- **Virtual Scrolling**: Only renders visible items plus a small buffer
- **DOM Recycling**: Reuses DOM elements for optimal memory usage
- **Fixed & Variable Heights**: Support for uniform or dynamic item heights
- **Selection**: Single and multi-select with keyboard support
- **Keyboard Navigation**: Full arrow key, Page Up/Down, Home/End support
- **Infinite Scroll**: Load more data as user scrolls
- **Pull to Refresh**: Touch-enabled refresh gesture
- **Search & Filter**: Built-in search with highlighting
- **Sorting**: Client-side sorting with comparator functions
- **WebSocket Integration**: Real-time updates via entity_change events
- **Accessibility**: Full ARIA support, screen reader compatible

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | Array | `[]` | Array of data items to display |
| `itemHeight` | Number/String | `48` | Fixed height in px, or `'auto'` for variable |
| `estimatedItemHeight` | Number | `48` | Initial height estimate for variable height mode |
| `overscan` | Number | `5` | Extra items to render above/below viewport |
| `containerHeight` | Number | `null` | Container height in px (auto-detected if null) |
| `renderItem` | Function | `null` | `function(item, index) => HTML string` |
| `getItemKey` | Function | `null` | `function(item) => unique key` (recommended for large lists) |
| `selectable` | String | `'none'` | `'none'`, `'single'`, or `'multi'` |
| `selectedIds` | Array | `[]` | Initial selected item IDs |
| `selectOnFocus` | Boolean | `false` | Auto-select when focusing (single mode) |
| `hasMore` | Boolean | `false` | Whether more data is available |
| `loadMoreThreshold` | Number | `200` | Pixels from bottom to trigger load |
| `onLoadMore` | Function | `null` | `function(done)` - done(items, hasMore) |
| `loadingTemplate` | String | `null` | Custom loading indicator HTML |
| `endOfListTemplate` | String | `null` | Custom "no more items" HTML |
| `pullToRefresh` | Boolean | `false` | Enable pull-to-refresh on touch |
| `pullThreshold` | Number | `80` | Pixels to pull before triggering refresh |
| `onRefresh` | Function | `null` | `function(done)` - called on pull refresh |
| `persistScroll` | Boolean | `false` | Save/restore scroll position |
| `persistKey` | String | `null` | sessionStorage key for scroll position |
| `searchFields` | Array/Function | `null` | Fields to search, or custom search function |
| `fuzzySearch` | Boolean | `false` | Enable fuzzy matching (requires Funky.FuzzySearch) |
| `fuzzyThreshold` | Number | `0.3` | Minimum fuzzy score (0-1) to be considered a match |
| `fuzzyTokenize` | Boolean | `false` | Split query into space-separated tokens |
| `wsEntity` | String | `null` | Entity name for WebSocket updates |
| `wsChannel` | String | `null` | WebSocket channel to subscribe |
| `emptyMessage` | String | `'No items to display'` | Message shown when list is empty |
| `emptyTemplate` | String | `null` | Custom empty state HTML |
| `ariaLabel` | String | `'Virtual list'` | Accessibility label |
| `debug` | Boolean | `false` | Enable debug logging |

## Event Callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| `onClick` | `(item, index, event)` | Item was clicked |
| `onScroll` | `(scrollTop, scrollHeight)` | List was scrolled |
| `onSelect` | `(selectedItems, selectedIds)` | Selection changed |
| `onActivate` | `(item, index)` | Item was activated (Enter/double-click) |
| `onFocus` | `(item, index)` | Focus moved to item |
| `onFilter` | `(filteredCount, totalCount)` | Filter applied |
| `onSearch` | `(matchCount, query)` | Search performed |
| `onSort` | `(comparator)` | Sort applied |
| `onEntityChange` | `(action, id, data)` | WebSocket entity changed |

## Methods

### Data Management

```javascript
// Update a single item
list.updateItem(itemId, { status: 'completed' });

// Remove items
list.removeItem(itemId);
list.removeItems([id1, id2, id3]);

// Insert items
list.insertItem(newItem, 0);       // Insert at index 0
list.insertItems([items], 5);      // Insert at index 5

// Batch operations (single re-render)
list.batch(function() {
  list.removeItem('old-1');
  list.insertItem(newItem, 0);
  list.updateItem('item-5', { name: 'Updated' });
});

// Replace all items
list.setItems(newItemsArray);

// Add items to end
list.addItems(moreItems);

// Prepend items to beginning
list.prependItems(newItems);
```

### Selection

```javascript
// Get selected items/IDs
var items = list.getSelected();
var ids = list.getSelectedIds();

// Programmatic selection
list.select(itemId);
list.selectAll();
list.deselectAll();
list.toggleSelect(itemId);

// Check selection
var isSelected = list.isSelected(itemId);
```

### Navigation

```javascript
// Scroll to item
list.scrollToIndex(500);                    // Default: nearest
list.scrollToIndex(500, 'start');           // Align to top
list.scrollToIndex(500, 'center');          // Center in viewport
list.scrollToIndex(500, 'end');             // Align to bottom

// Scroll to ID
list.scrollToItem(itemId);

// Get scroll position
var pos = list.getScrollPosition();         // { top, height, percentage }
```

### Search

```javascript
// Search items
var matchCount = list.search('query');

// Navigate matches
list.nextMatch();
list.previousMatch();
list.goToMatch(5);

// Get current match info
var match = list.getCurrentMatch();
// { index, item, matchNumber, totalMatches }

// Clear search
list.clearSearch();

// Get highlighter for custom rendering
var highlighter = list.getHighlighter();
var highlighted = highlighter('Some text');
// Returns: 'Some <mark class="virtual-list-highlight">text</mark>'
```

### Filter & Sort

```javascript
// Filter items
list.filter(function(item) {
  return item.status === 'active';
});

// Clear filter
list.clearFilter();

// Get filtered stats
var stats = list.getFilteredCount();
// { filtered: 50, total: 1000 }

// Check if filtered
var isFiltered = list.isFiltered();

// Sort items
list.sort(function(a, b) {
  return a.name.localeCompare(b.name);
});

// Reverse sort
list.reverseSort();

// Clear sort (restore original order)
list.clearSort();
```

### Variable Height

```javascript
// Get item height
var height = list.getItemHeight(index);

// Invalidate height (force re-measure)
list.invalidateHeight(itemId);
list.invalidateAllHeights();
```

### Lifecycle

```javascript
// Refresh/re-render
list.refresh();

// Destroy
list.destroy();

// Check if empty
var empty = list.isEmpty();

// Screen reader announcements
list.announce('5 items selected');
```

## PubSub Events

```javascript
// Listen to global events
Funky.PubSub.on('funky:virtual-list:select', function(data) {
  console.log('Selected:', data.ids);
});

Funky.PubSub.on('funky:virtual-list:loadmore', function(data) {
  console.log('Loading more from offset:', data.offset);
});
```

| Event | Data | Description |
|-------|------|-------------|
| `funky:virtual-list:init` | `{id, itemCount}` | List initialized |
| `funky:virtual-list:select` | `{id, items, ids}` | Selection changed |
| `funky:virtual-list:scroll` | `{id, scrollTop, scrollHeight}` | List scrolled |
| `funky:virtual-list:loadmore` | `{id, offset}` | Load more triggered |
| `funky:virtual-list:endreached` | `{id}` | End of list reached |
| `funky:virtual-list:loaderror` | `{id, error}` | Load more failed |
| `funky:virtual-list:filter` | `{id, count, total}` | Filter applied |
| `funky:virtual-list:search` | `{id, query, matches}` | Search performed |
| `funky:virtual-list:sort` | `{id}` | Sort applied |
| `funky:virtual-list:itemupdated` | `{id, itemId, item}` | Item updated |
| `funky:virtual-list:itemsremoved` | `{id, ids, count}` | Items removed |
| `funky:virtual-list:itemsinserted` | `{id, count, index}` | Items inserted |
| `funky:virtual-list:destroyed` | `{id}` | List destroyed |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move focus up/down |
| `Page Up` / `Page Down` | Move focus by page |
| `Home` / `End` | Move to first/last item |
| `Space` | Toggle selection of focused item |
| `Enter` | Activate focused item |
| `Ctrl+A` | Select all items (multi-select mode) |
| `Escape` | Clear selection |
| `Shift+Click` | Range select |
| `Ctrl+Click` | Toggle individual selection |

## Examples

### Basic List

```javascript
Funky.VirtualisedList.init('#contacts', {
  items: contacts,
  itemHeight: 48,
  getItemKey: function(item) { return item.id; },
  renderItem: function(item) {
    return '<div class="contact">' +
      '<span class="name">' + item.name + '</span>' +
      '<span class="email">' + item.email + '</span>' +
    '</div>';
  }
});
```

### Variable Height Items

```javascript
Funky.VirtualisedList.init('#messages', {
  items: messages,
  variableHeight: true,           // Or itemHeight: 'auto'
  estimatedItemHeight: 80,
  getItemKey: function(item) { return item.id; },
  renderItem: function(item) {
    return '<div class="message">' +
      '<div class="sender">' + item.sender + '</div>' +
      '<div class="content">' + item.content + '</div>' +
    '</div>';
  }
});
```

### Infinite Scroll

```javascript
var list = Funky.VirtualisedList.init('#feed', {
  items: initialItems,
  itemHeight: 100,
  hasMore: true,
  loadMoreThreshold: 300,
  
  onLoadMore: function(done) {
    fetch('/api/feed?offset=' + list.items.length)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        done(data.items, data.hasMore);
      })
      .catch(function(err) {
        done([], true);  // Keep hasMore true to allow retry
      });
  },
  
  getItemKey: function(item) { return item.id; },
  renderItem: function(item) {
    return '<article>' + item.title + '</article>';
  }
});
```

### Multi-Select with Actions

```javascript
var list = Funky.VirtualisedList.init('#tasks', {
  items: tasks,
  itemHeight: 40,
  selectable: 'multi',
  
  getItemKey: function(item) { return item.id; },
  renderItem: function(item) {
    return '<div class="task">' +
      '<i class="fa fa-check-circle"></i> ' +
      item.title +
    '</div>';
  },
  
  onSelect: function(items, ids) {
    document.getElementById('selectedCount').textContent = ids.length;
    document.getElementById('bulkActions').style.display = 
      ids.length > 0 ? 'block' : 'none';
  }
});

// Bulk delete action
document.getElementById('deleteBtn').onclick = function() {
  var ids = list.getSelectedIds();
  list.removeItems(ids);
};
```

### WebSocket Real-Time Updates

```javascript
Funky.VirtualisedList.init('#trades', {
  items: initialTrades,
  itemHeight: 36,
  
  // WebSocket integration
  wsEntity: 'trade',
  
  // Custom handler for entity changes
  onEntityChange: function(action, id, data) {
    if (action === 'created') {
      // Fetch and insert new trade
      fetch('/api/trades/' + id)
        .then(function(r) { return r.json(); })
        .then(function(trade) {
          this.insertItem(trade, 0);
        }.bind(this));
      return false;  // We handled it
    }
    // Return true to use default handling
    return true;
  },
  
  getItemKey: function(item) { return item.id; },
  renderItem: function(item) {
    return '<div class="trade">' + item.reference + '</div>';
  }
});
```

## Performance Tips

1. **Always provide `getItemKey`** for lists over 1000 items - enables stable identity
2. **Use fixed heights when possible** - `itemHeight: 40` is faster than `variableHeight: true`
3. **Keep `renderItem` simple** - avoid complex DOM creation or API calls
4. **Use batch operations** - wrap multiple updates in `list.batch()`
5. **Debounce search input** - avoid searching on every keystroke
6. **Set appropriate `overscan`** - default 5 is good, increase for fast scrolling
7. **Use `loadMoreThreshold`** - preload data before user reaches bottom

## Accessibility

The component is fully accessible with:

- `role="listbox"` on container
- `role="option"` on items
- `aria-selected` for selection state
- `aria-setsize` and `aria-posinset` for item position
- `aria-activedescendant` for focus tracking
- `aria-busy` during loading
- Live region for screen reader announcements
- Full keyboard navigation support
- High contrast mode support
- Respects `prefers-reduced-motion`

## CSS Classes

| Class | Description |
|-------|-------------|
| `.virtual-list` | Main container |
| `.virtual-list-items` | Items container |
| `.virtual-list-item` | Individual item |
| `.virtual-list-item.selected` | Selected item |
| `.virtual-list-item.focused` | Keyboard-focused item |
| `.virtual-list-loading` | Loading indicator |
| `.virtual-list-end` | End of list message |
| `.virtual-list-empty` | Empty state container |
| `.virtual-list-pull-indicator` | Pull-to-refresh indicator |
| `.virtual-list-highlight` | Search match highlight |

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- iOS Safari 13+
- Chrome Android 80+

## Related Components

- [Funky.Table](table.md) - Full-featured data tables
- [SideNav](sidenav.md) - Navigation lists
- [Slider](slider.md) - Range input

---

## Bindable Interface (LiveBinding)

VirtualisedList implements the **Bindable Interface** for integration with `Funky.LiveBinding`.

### Implemented Methods

| Method | Description |
|--------|-------------|
| `setData(data)` | Replace all items in the list with the provided data array |
| `getData()` | Retrieve the current items array from the list |
| `addData(items)` | Append new items to the end of the list |
| `removeData(ids)` | Remove items matching the provided ID(s) from the list |
| `clearData()` | Remove all items from the list |

### Instance Registration

Instances are registered in `Funky.VirtualisedList._instances[containerId]`.

### Usage with LiveBinding

```javascript
// Bind virtualised list to a WebSocket source
Funky.LiveBinding.bindComponent('#listContainer', {
  source: 'websocket',
  channel: 'list-updates'
});

// Bind to API polling
Funky.LiveBinding.bindComponent('#listContainer', {
  source: 'api',
  endpoint: '/api/items',
  interval: 5000
});
```
