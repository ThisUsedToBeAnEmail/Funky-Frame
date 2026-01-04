# Kanban Component

Drag-and-drop workflow board for visualising card-based processes.

## Quick Start

```javascript
var board = Funky.Kanban.init('#container', {
  columns: [
    { id: 'todo', title: 'To Do' },
    { id: 'doing', title: 'In Progress', limit: 3 },
    { id: 'done', title: 'Done' }
  ],
  cards: [
    { id: 1, column: 'todo', title: 'First Task', priority: 'high' },
    { id: 2, column: 'todo', title: 'Second Task' },
    { id: 3, column: 'doing', title: 'Working on it' }
  ],
  onCardMoved: function(card, from, to, position) {
    console.log('Card moved:', card.title, 'from', from, 'to', to);
  }
});
```

## Configuration

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columns` | Array | `[]` | Column definitions |
| `cards` | Array | `[]` | Initial card data |
| `dataSource` | String | `null` | URL to load cards from |
| `swimlanes` | Object | `null` | Swimlane configuration |
| `transitions` | Object | `null` | Allowed column transitions |

### Column Definition

```javascript
{
  id: 'doing',           // Unique column identifier
  title: 'In Progress',  // Display title
  limit: 3,              // WIP limit (optional)
  color: '#2196f3'       // Header colour (optional)
}
```

### Card Data

```javascript
{
  id: 1,                  // Unique card ID
  column: 'todo',         // Column ID
  title: 'Task Title',    // Card title
  description: '...',     // Description (optional)
  priority: 'high',       // 'high', 'medium', 'low' (optional)
  labels: ['Bug', 'UI'],  // Labels array (optional)
  dueDate: '2025-01-15',  // Due date ISO string (optional)
  assignee: 'John Doe',   // Assignee name (optional)
  assigneeAvatar: '/img/avatar.jpg',  // Avatar URL (optional)
  position: 0             // Position in column (optional)
}
```

### Display Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `emptyColumnText` | String | `'No cards'` | Empty column placeholder |
| `addCardText` | String | `'Add Card'` | Add button text |
| `showAddCard` | Boolean | `false` | Show add card button |
| `inlineAddCard` | Boolean | `true` | Use inline form for quick add |
| `showToolbar` | Boolean | `false` | Show search/filter toolbar |
| `dimFiltered` | Boolean | `false` | Dim instead of hide filtered cards |
| `showPresence` | Boolean | `false` | Show active users |
| `autoLoad` | Boolean | `true` | Auto-load from dataSource on init |

### Search Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `searchableFields` | Array | `['title','description']` | Fields to include in search |
| `fuzzySearch` | Boolean | `false` | Enable fuzzy matching |
| `fuzzyThreshold` | Number | `0.3` | Fuzzy match min score (0-1) |
| `fuzzyTokenize` | Boolean | `false` | Split query into tokens |
| `highlightMatches` | Boolean | `true` | Highlight matched text |
| `sortMatchesByScore` | Boolean | `false` | Reorder cards by match score |
| `showMatchScore` | Boolean | `false` | Show score badge on cards |

### Custom Rendering

```javascript
{
  renderCard: function(card) {
    // Return HTML string or HTMLElement
    return '<div class="my-card">' + card.title + '</div>';
  },
  
  renderColumnHeader: function(column) {
    return '<h3>' + column.title + ' (' + column.count + ')</h3>';
  }
}
```

### Transitions (Workflow Constraints)

Restrict which columns cards can move between:

```javascript
{
  transitions: {
    'todo': ['doing'],           // todo → doing only
    'doing': ['todo', 'review'], // doing → todo or review
    'review': ['doing', 'done'], // review → doing or done
    'done': []                   // done → nowhere (locked)
  }
}
```

### Swimlanes

Group cards by a field:

```javascript
{
  swimlanes: {
    field: 'priority',           // Card field to group by
    values: ['high', 'medium', 'low'],  // Explicit order
    labels: {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    },
    collapsible: true            // Allow collapse (default: true)
  }
}
```

### Quick Filters

```javascript
{
  showToolbar: true,
  quickFilters: [
    { id: 'mine', label: 'My Cards', filter: { assignee: '$currentUser' } },
    { id: 'overdue', label: 'Overdue', icon: 'fas fa-clock', filter: { dueDate: { lt: '$today' } } },
    { id: 'high', label: 'High Priority', filter: { priority: 'high' } }
  ],
  currentUser: 'John Doe'  // For $currentUser variable
}
```

### API Integration

```javascript
{
  dataSource: '/api/kanban/cards',  // GET to load cards
  
  api: {
    create: 'POST /api/kanban/cards',
    update: 'PATCH /api/kanban/cards/:id',
    delete: 'DELETE /api/kanban/cards/:id',
    move: 'PATCH /api/kanban/cards/:id/move'
  },
  
  // Or use custom handler
  onSave: function(action, card, changes) {
    // action: 'create', 'update', 'delete', 'move'
    return fetch('/api/kanban/' + action, {
      method: 'POST',
      body: JSON.stringify({ card: card, changes: changes })
    });
  },
  
  retryAttempts: 3,  // Retry failed requests
  retryDelay: 1000   // Delay between retries (ms)
}
```

### WebSocket (Real-time Updates)

```javascript
{
  enableWebSocket: true,
  boardId: 'my-board',
  userId: 'current-user-id'
}
```

The component subscribes to `ws:kanban:{boardId}` via `Funky.PubSub` and handles:
- `card:move` - Remote card moves
- `card:update` - Remote card updates
- `card:create` - New cards from other users
- `card:delete` - Deleted cards
- `user:join` / `user:leave` - Presence updates

## Callbacks

| Callback | Arguments | Description |
|----------|-----------|-------------|
| `onCardMove` | `(card, from, to, pos)` | Before move (return `false` to cancel) |
| `onCardMoved` | `(card, from, to, pos)` | After move complete |
| `onCardClick` | `(card, el, event)` | Card clicked |
| `onCardCreate` | `(cardData, column)` | Card created via inline form |
| `onColumnLimitReached` | `(column)` | WIP limit reached |
| `onSwimlaneChange` | `(card, from, to)` | Card moved between swimlanes |
| `onFilter` | `(visibleCount, totalCount)` | Filter applied |
| `onRemoteUpdate` | `(action, data)` | WebSocket update received |
| `onLoadStart` | `()` | Data loading started |
| `onLoadComplete` | `(cards)` | Data loaded successfully |
| `onLoadError` | `(error)` | Data loading failed |
| `onSaveError` | `(action, error, card)` | API save failed |

## API Methods

### Card Management

```javascript
// Add a card
board.addCard({ id: 4, column: 'todo', title: 'New Card' });

// Update a card
board.updateCard(4, { title: 'Updated Title', priority: 'high' });

// Remove a card
board.removeCard(4);

// Move a card
board.moveCard(4, 'doing', 0);

// Get card data
var card = board.getCard(4);

// Get all cards (optionally by column)
var allCards = board.getCards();
var todoCards = board.getCards('todo');
```

### Column Management

```javascript
// Get column
var column = board.getColumn('todo');

// Get all columns
var columns = board.getColumns();
```

### Filtering & Search

```javascript
// Text search
board.search('bug fix');

// Advanced search with options
board.searchCards('bug', {
  fields: ['title', 'description'],
  fuzzy: true
});

// Field filter
board.filter({ priority: 'high' });
board.filter({ assignee: 'John', priority: { in: ['high', 'medium'] } });

// Quick filter
board.applyQuickFilter('overdue');

// Clear
board.clearFilter('priority');
board.clearQuickFilter('overdue');
board.clearAllFilters();

// Get highlighted field (after search)
var highlighted = board.getHighlightedField(cardId, 'title');

// Get search score (for match ranking)
var score = board.getSearchScore(cardId);
```

### Swimlanes

```javascript
// Toggle swimlane collapsed state
board.toggleSwimlane('high');

// Get collapsed state
var isCollapsed = board.isSwimlaneCollapsed('high');

// Expand/collapse all swimlanes
board.expandAllSwimlanes();
board.collapseAllSwimlanes();

// Add swimlane at runtime
board.addSwimlane('urgent', 'Urgent Items', 0); // position optional

// Remove swimlane
board.removeSwimlane('urgent');
```

### Column Management

```javascript
// Add column at runtime
board.addColumn({ id: 'review', title: 'Review', limit: 2 }, 2); // position optional

// Remove column
board.removeColumn('review');
```

### Data & State

```javascript
// Reload from dataSource
board.reload();

// Check loading state
var isLoading = board.isLoading();

// Refresh counts
board.refresh();

// Get active users (presence)
var users = board.getActiveUsers();

// Open card detail modal
board.openCardDetail(4);

// Destroy instance
board.destroy();
```

### Presence & Multi-user

```javascript
// Enable presence tracking
board.enablePresence({
  preventRemoteDrag: true,      // Prevent dragging cards others are editing
  showDragIndicators: true,     // Show who's dragging a card
  showViewerIndicators: true    // Show who's viewing each card
});

// Disable presence
board.disablePresence();

// Check if presence enabled
var enabled = board.isPresenceEnabled();

// Get users currently viewing the board
var users = board.getBoardUsers();

// Get users viewing a specific card
var viewers = board.getCardViewers(cardId);

// Check if card can be dragged (not locked by another user)
var canDrag = board.canDragCard(cardId);

// Get presence channel identifier
var channel = board.getPresenceChannel();

// Focus/blur card (for presence tracking)
board.focusCard(cardId);
board.blurCard(cardId);
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between cards |
| `Space` | Pick up / drop card |
| `Arrow Up/Down` | Move picked card within column |
| `Arrow Left/Right` | Move picked card between columns |
| `Enter` | Open card (triggers onCardClick) |
| `Escape` | Cancel move, restore original position |
| `Shift+Delete` | Remove card (with confirmation) |

## Accessibility

The Kanban component includes full accessibility support:

- **ARIA Roles**: Board uses `role="application"`, columns use `role="listbox"`, cards use `role="option"`
- **Keyboard Navigation**: Full keyboard support for card movement
- **Screen Reader**: Live region announces card movements
- **Focus Management**: Focus preserved during drag operations
- **High Contrast**: Enhanced borders in high contrast mode
- **Reduced Motion**: Animations disabled when preferred

## Styling

### Theme Variables Used

```css
--pro-bg-primary        /* Card and board background */
--pro-bg-secondary      /* Column background */
--pro-bg-tertiary       /* Hover states */
--pro-text-primary      /* Card title */
--pro-text-secondary    /* Card description */
--pro-text-muted        /* Metadata */
--pro-border-color      /* Card borders */
--pro-primary           /* Focus, picked state */
--pro-danger            /* High priority, overdue */
--pro-warning           /* Medium priority */
--pro-success           /* Done, low priority */
--pro-shadow-sm         /* Card shadow */
--pro-shadow-lg         /* Dragging shadow */
--pro-spacing-sm        /* Card padding */
--pro-spacing-md        /* Column gaps */
--pro-border-radius     /* Card corners */
--pro-border-radius-sm  /* Button corners */
```

### Density Modes

The component respects the `[data-density]` attribute:

| Density | Card Padding | Gap |
|---------|-------------|-----|
| `compact` | 0.5rem | 0.5rem |
| `comfortable` (default) | 0.75rem | 1rem |
| `spacious` | 1rem | 1.5rem |

### Responsive Breakpoints

| Breakpoint | Behaviour |
|------------|-----------|
| `< 576px` | Columns stack vertically with scroll-snap |
| `< 768px` | Reduced column width (280px) |
| `< 992px` | Toolbar wraps, smaller cards |
| `< 1200px` | Standard column width (300px) |

## Examples

### Trade Pipeline

```javascript
Funky.Kanban.init('#trades', {
  columns: [
    { id: 'pending', title: 'Pending', color: '#ffc107' },
    { id: 'processing', title: 'Processing', limit: 5 },
    { id: 'settled', title: 'Settled', color: '#28a745' },
    { id: 'failed', title: 'Failed', color: '#dc3545' }
  ],
  dataSource: '/api/trades/kanban',
  showToolbar: true,
  quickFilters: [
    { id: 'mine', label: 'My Trades', filter: { trader: '$currentUser' } },
    { id: 'urgent', label: 'Urgent', filter: { priority: 'high' } }
  ]
});
```

### Sprint Board with Swimlanes

```javascript
Funky.Kanban.init('#sprint', {
  columns: [
    { id: 'backlog', title: 'Backlog' },
    { id: 'todo', title: 'To Do' },
    { id: 'doing', title: 'In Progress', limit: 3 },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
  ],
  swimlanes: {
    field: 'type',
    values: ['bug', 'feature', 'chore'],
    labels: {
      bug: '🐛 Bugs',
      feature: '✨ Features',
      chore: '🔧 Chores'
    }
  },
  showAddCard: true,
  inlineAddCard: true
});
```

### Approval Workflow

```javascript
Funky.Kanban.init('#approvals', {
  columns: [
    { id: 'submitted', title: 'Submitted' },
    { id: 'review', title: 'Under Review' },
    { id: 'approved', title: 'Approved' },
    { id: 'rejected', title: 'Rejected' }
  ],
  transitions: {
    submitted: ['review'],
    review: ['approved', 'rejected', 'submitted'],
    approved: [],
    rejected: ['submitted']
  },
  onCardMoved: function(card, from, to) {
    if (to === 'approved' || to === 'rejected') {
      // Log approval decision
      console.log(card.title, to === 'approved' ? 'approved' : 'rejected');
    }
  }
});
```

---

## Bindable Interface (LiveBinding)

Kanban implements the **Bindable Interface** for integration with `Funky.LiveBinding`, enabling reactive data binding from various sources.

### Implemented Methods

| Method | Description |
|--------|-------------|
| `setData(data)` | Replace all cards with new data. Accepts array or `{ cards, columns }` object |
| `getData()` | Return all card data as array |
| `addData(cards)` | Append cards to the board |
| `removeData(ids)` | Remove cards by ID |
| `clearData()` | Remove all cards |

### Instance Registration

Kanban automatically registers instances in `Funky.Kanban._instances[containerId]` for LiveBinding discovery.

### Usage with LiveBinding

```javascript
// Bind Kanban board to WebSocket channel
Funky.LiveBinding.bindComponent('#task-board', {
  source: 'websocket',
  channel: 'funky:board:updates'
});

// Bind to API with polling
Funky.LiveBinding.bindComponent('#sprint-board', {
  source: 'api',
  url: '/api/boards/sprint-1/cards',
  pollInterval: 30000
});

// Streaming card updates
Funky.LiveBinding.bindComponent('#live-board', {
  source: 'websocket',
  channel: 'funky:cards:new',
  append: true
});
```

### Direct API Usage

```javascript
var board = Funky.Kanban._instances['task-board'];

// Replace all cards
board.setData([
  { id: 1, column: 'todo', title: 'Task 1' },
  { id: 2, column: 'doing', title: 'Task 2' }
]);

// Get current data
var cards = board.getData();

// Add new cards
board.addData([{ id: 3, column: 'todo', title: 'New Task' }]);

// Remove cards
board.removeData([1, 2]);

// Clear all
board.clearData();
```
