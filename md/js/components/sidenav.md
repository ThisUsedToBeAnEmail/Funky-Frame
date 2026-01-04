# Funky.SideNav - Searchable Sidebar Navigation

Searchable sidebar navigation component with flat or grouped items, selection, filtering, and keyboard navigation.

## Overview

`Funky.SideNav` provides a configurable sidebar navigation with:
- Flat list or grouped (collapsible) items
- Real-time search filtering
- Keyboard navigation (arrow keys, Enter, Escape)
- Selection state with persistence option
- Icons and badges support
- Theme integration via `--pro-*` CSS variables

## Quick Start

```javascript
// Basic initialization
Funky.SideNav.init('#mySidebar', {
  items: [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ],
  onChange: function(item) {
    console.log('Selected:', item.id);
  }
});
```

## API Reference

### Factory Methods

#### `SideNav.init(selector, config)`

Create and initialize a new SideNav instance.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `string \| Element` | CSS selector or DOM element for the container |
| `config` | `Object` | Configuration options |

**Returns:** `SideNav` instance

---

#### `SideNav.create(selector, config)` / `SideNav.create(config)`

Alternative factory method with flexible argument handling. Supports both separate arguments and a single config object.

**Parameters (two arguments):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `string \| Element` | CSS selector or DOM element for the container |
| `config` | `Object` | Configuration options |

**Parameters (single object):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `config.element` | `string \| Element` | CSS selector or DOM element (also accepts `selector` or `container`) |
| `config.*` | `*` | All other configuration options |

**Examples:**
```javascript
// Two arguments
var sidenav = Funky.SideNav.create('#mySidebar', {
  items: [...],
  onChange: function(item) { ... }
});

// Single config object
var sidenav = Funky.SideNav.create({
  element: '#mySidebar',
  items: [...],
  toggleSelector: '#nav-toggle',
  onChange: function(item) { ... }
});
```

**Returns:** `SideNav` instance

---

### Configuration Options

#### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `Array` | `[]` | Navigation items (see Item Schema below) |
| `searchable` | `boolean` | `true` | Show search input |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder text |
| `collapsible` | `boolean` | `true` | Allow groups to be collapsed |
| `rememberState` | `boolean` | `false` | Persist selection/collapse state to localStorage |
| `storageKey` | `string` | `'funky_sidenav_state'` | Key for localStorage persistence |
| `selected` | `string` | `null` | Initial selected item ID |

#### Sorting Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sortable` | `boolean` | `false` | Show sort toggle button in header |
| `sortOrder` | `string` | `'asc'` | Default sort order: `'asc'`, `'desc'`, or `'none'` |
| `sortKey` | `string` | `'label'` | Property to sort by: `'label'` or `'id'` |

#### Mobile / Toggle Behavior

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `toggleSelector` | `string` | `null` | CSS selector for toggle button (mobile/responsive) |
| `closeOnClickOutside` | `boolean` | `false` | Close sidenav when clicking outside |
| `closeOnSelect` | `boolean` | `false` | Close sidenav after selecting an item (useful for mobile) |

#### Fuzzy Search Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fuzzySearch` | `boolean` | `false` | Enable fuzzy matching |
| `fuzzyThreshold` | `number` | `0.3` | Minimum score (0-1) |
| `fuzzyTokenize` | `boolean` | `false` | Split query into tokens |
| `highlightMatches` | `boolean` | `true` | Highlight matched text |
| `sortByScore` | `boolean` | `true` | Sort results by match score |

#### Recent Searches Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `recentSearches` | `boolean` | `false` | Enable recent searches feature |
| `recentSearchesKey` | `string` | `null` | Storage key (auto-generated if not provided) |
| `maxRecentSearches` | `number` | `5` | Max recent searches to show |
| `recentSearchesLabel` | `string` | `'Recent'` | Label for recent section |
| `minSearchLength` | `number` | `2` | Min chars before adding to recent |

### Item Schema

```javascript
{
  id: 'unique-id',        // Required: unique identifier
  label: 'Display Name',  // Required: display text
  icon: 'fas fa-icon',    // Optional: FontAwesome class
  badge: '5',             // Optional: badge text/count
  badgeClass: 'danger',   // Optional: badge color variant
  disabled: false,        // Optional: disable item
  children: []            // Optional: nested items (creates group)
}
```

### Grouped Items Example

```javascript
{
  id: 'settings',
  label: 'Settings',
  icon: 'fas fa-cog',
  children: [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' }
  ]
}
```

---

### Instance Methods

#### `select(id, silent)`

Programmatically select an item.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Item ID to select |
| `silent` | `boolean` | If true, don't fire onChange callback |

**Example:**
```javascript
sidenav.select('dashboard');
sidenav.select('settings', true); // Silent, no callback
```

---

#### `getSelected()`

Get the currently selected item.

**Returns:** `Object | null` - The selected item or null

---

#### `filter(term)`

Filter items by search term.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `term` | `string` | Search term |

---

#### `expand(groupId)`

Expand a collapsed group.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | ID of the group to expand |

---

#### `collapse(groupId)`

Collapse an expanded group.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | ID of the group to collapse |

---

#### `expandAll()`

Expand all groups.

---

#### `collapseAll()`

Collapse all groups.

---

#### `toggleSort()`

Toggle between sort orders (asc → desc → none → asc).

**Example:**
```javascript
sidenav.toggleSort(); // Cycles through sort orders
```

---

#### `setItems(items)`

Replace all items dynamically.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `items` | `Array` | New items array |

---

#### `destroy()`

Clean up and remove the component.

---

#### `open()`

Open/show the sidenav (for mobile/toggle behavior). Adds `open` and `show` classes, updates `aria-expanded` on toggle button.

**Example:**
```javascript
sidenav.open();
```

**Events emitted:** `funky:sidenav:open` via PubSub

---

#### `close()`

Close/hide the sidenav (for mobile/toggle behavior). Removes `open` and `show` classes, updates `aria-expanded` on toggle button.

**Example:**
```javascript
sidenav.close();
```

**Events emitted:** `funky:sidenav:close` via PubSub

---

#### `toggle()`

Toggle the sidenav open/closed state.

**Example:**
```javascript
sidenav.toggle();
```

---

#### `getState()`

Get the current state of the sidenav.

**Returns:** `Object` - `{ isOpen, selectedId, collapsedGroups }`

**Example:**
```javascript
var state = sidenav.getState();
console.log(state.isOpen);        // true/false
console.log(state.selectedId);    // 'dashboard'
console.log(state.collapsedGroups); // ['admin', 'settings']
```

---

#### `getItem(id)`

Get a navigation item's DOM element by its ID.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Item ID |

**Returns:** `HTMLElement | null` - The item's DOM element or null if not found

**Example:**
```javascript
var itemEl = sidenav.getItem('dashboard');
if (itemEl) {
  itemEl.classList.add('highlight');
}
```

---

### Callbacks

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onChange` | `(item)` | Fired when selection changes |
| `onFilter` | `(term, visibleCount)` | Fired when search filter applied |
| `onExpand` | `(groupId)` | Fired when group is expanded |
| `onCollapse` | `(groupId)` | Fired when group is collapsed |
| `onSort` | `(order)` | Fired when sort order changes |

---

### PubSub Events

SideNav emits events via `Funky.PubSub` for global event handling:

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:sidenav:select` | `{ id, item, sidenav }` | Fired when an item is selected |
| `funky:sidenav:open` | `{ sidenav }` | Fired when sidenav is opened |
| `funky:sidenav:close` | `{ sidenav }` | Fired when sidenav is closed |

**Example:**
```javascript
Funky.PubSub.on('funky:sidenav:select', function(data) {
  console.log('Selected:', data.id);
  console.log('Item data:', data.item);
});

Funky.PubSub.on('funky:sidenav:open', function(data) {
  console.log('Sidenav opened');
});

Funky.PubSub.on('funky:sidenav:close', function(data) {
  console.log('Sidenav closed');
});
```

---

## Examples

### Basic Flat List

```javascript
Funky.SideNav.init('#nav', {
  items: [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'users', label: 'Users', icon: 'fas fa-users', badge: '12' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' }
  ],
  searchable: true,
  onChange: function(item) {
    loadPage(item.id);
  }
});
```

### With Groups

```javascript
Funky.SideNav.init('#nav', {
  items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { 
      id: 'admin', 
      label: 'Administration', 
      icon: 'fas fa-shield-alt',
      children: [
        { id: 'users', label: 'User Management' },
        { id: 'roles', label: 'Roles & Permissions' },
        { id: 'audit', label: 'Audit Log' }
      ]
    },
    { id: 'help', label: 'Help', icon: 'fas fa-question-circle' }
  ],
  collapsible: true
});
```

### Persistent State

```javascript
Funky.SideNav.init('#nav', {
  items: myItems,
  rememberState: true,
  storageKey: 'app_sidenav_state'
});
```

### With Sorting

```javascript
Funky.SideNav.init('#nav', {
  items: [
    { id: 'users', label: 'Users', icon: 'fas fa-users' },
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' }
  ],
  sortable: true,
  sortOrder: 'asc',  // Items will be sorted A-Z by label
  onSort: function(order) {
    console.log('Sort order changed:', order);
  }
});
```

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move focus between items |
| `Enter` | Select focused item |
| `←` | Collapse current group |
| `→` | Expand current group |
| `Escape` | Clear search, blur input |

---

## Styling

The component uses `--pro-*` CSS variables from the theme system:

```css
.funky-sidenav {
  --pro-bg-primary: /* container background */
  --pro-bg-secondary: /* search input background */
  --pro-bg-hover: /* item hover background */
  --pro-border-color: /* borders */
  --pro-text-primary: /* primary text */
  --pro-text-secondary: /* secondary text */
  --pro-text-muted: /* muted text/icons */
  --pro-accent-primary: /* selection highlight */
  --pro-accent-muted: /* selection background */
}
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-sidenav` | Container class (added automatically) |
| `.sidenav-item` | Individual navigation item |
| `.sidenav-item.active` | Selected item |
| `.sidenav-group` | Group container |
| `.sidenav-group.collapsed` | Collapsed group |
| `.sidenav-search` | Search input |

---

## Responsive Behavior

The component includes responsive styles:
- **Desktop**: Full width with all features
- **Mobile (< 768px)**: Larger touch targets, stacked layout
- **Touch devices**: Increased padding for better tap targets

---

## Dependencies

- FontAwesome 5+ (for icons)
- themes.css (for `--pro-*` CSS variables)

---

## Bindable Interface (LiveBinding)

SideNav supports the LiveBinding system for reactive data updates.

### Instance Registry

```javascript
// Access instances by container ID
var instance = Funky.Sidenav._instances['mySidebar'];
```

### Bindable Methods

#### `setData(items)`

Update the navigation items.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| items | array | Array of navigation item objects |

**Example:**
```javascript
var sidenav = Funky.Sidenav._instances['mySidebar'];
sidenav.setData([
  { id: 'home', label: 'Home', icon: 'fas fa-home' },
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', badge: '3' },
  { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar', children: [
    { id: 'sales', label: 'Sales Report' },
    { id: 'inventory', label: 'Inventory Report' }
  ]}
]);
```

---

#### `getData()`

Get the current navigation items.

**Returns:** `Array` - Current navigation item structure

**Example:**
```javascript
var sidenav = Funky.Sidenav._instances['mySidebar'];
var items = sidenav.getData();
console.log(items.length);           // Number of top-level items
console.log(items[0].label);         // 'Home'
```

### LiveBinding Integration

```javascript
// Bind navigation to an API source
Funky.LiveBinding.bind({
  source: { type: 'api', endpoint: '/api/navigation/menu' },
  target: {
    type: 'component',
    component: 'Sidenav',
    instance: 'mySidebar'
  }
});

// Bind to state for dynamic menu management
Funky.LiveBinding.bind({
  source: { type: 'state', key: 'navigationItems' },
  target: {
    type: 'component',
    component: 'Sidenav',
    instance: 'mySidebar'
  }
});

// Update navigation reactively (e.g., based on user permissions)
Funky.LiveBinding.setState('navigationItems', [
  { id: 'home', label: 'Home', icon: 'fas fa-home' },
  { id: 'admin', label: 'Admin', icon: 'fas fa-cog', badge: 'New' }
]);
```
