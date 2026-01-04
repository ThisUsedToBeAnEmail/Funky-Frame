# UI Components

Funky provides a rich set of JavaScript UI components built on top of Bootstrap 5. All components are registered in the `Funky` namespace and use a consistent API pattern.

## Overview

Components are organized under `public/assets/js/components/` and registered via `Funky.register()`.

```javascript
// All components accessible via Funky namespace
Funky.Toast.success('Saved!');
Funky.Modal.open({ ... });
new Funky.SideNav('#container', { ... });
```

## Toast Notifications

Bootstrap 5 toast notification system with multiple types and confirmation dialogs.

### Basic Usage

```javascript
// Success notification
Funky.Toast.success('Record saved successfully');

// Error notification
Funky.Toast.error('Something went wrong', 'Error Title');

// Warning notification  
Funky.Toast.warning('Please check your input');

// Info notification
Funky.Toast.info('FYI: System maintenance tonight');
```

### Custom Options

```javascript
Funky.Toast.show({
  message: 'Custom message',
  type: 'success',     // success, error, warning, info
  title: 'Custom Title',
  duration: 5000       // ms (default: 5000)
});
```

### Confirmation Dialog

```javascript
Funky.Toast.confirm({
  message: 'Are you sure you want to delete this?',
  title: 'Confirm Delete',
  confirmText: 'Yes, Delete',
  cancelText: 'Cancel',
  onConfirm: function() {
    // Handle confirmation
  },
  onCancel: function() {
    // Handle cancellation (optional)
  }
});
```

## SideNav

Searchable sidebar navigation with groups, selection, and keyboard navigation.

### Basic Usage

```javascript
const nav = new Funky.SideNav('#sidenav-container', {
  items: [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ],
  onSelect: function(id, item) {
    console.log('Selected:', id);
  }
});
```

### Grouped Items

```javascript
const nav = new Funky.SideNav('#container', {
  items: [
    { 
      group: 'Reports',
      items: [
        { id: 'daily', label: 'Daily Report' },
        { id: 'monthly', label: 'Monthly Report' }
      ]
    },
    {
      group: 'Settings',
      items: [
        { id: 'profile', label: 'Profile' },
        { id: 'preferences', label: 'Preferences' }
      ]
    }
  ],
  collapsible: true  // Groups can collapse/expand
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | Array | `[]` | Navigation items |
| `searchable` | Boolean | `true` | Enable search filter |
| `searchPlaceholder` | String | `'Search...'` | Search input placeholder |
| `collapsible` | Boolean | `true` | Allow group collapse |
| `rememberState` | Boolean | `false` | Persist collapse state |
| `selected` | String | `null` | Initially selected ID |
| `sortable` | Boolean | `false` | Enable sorting |
| `sortOrder` | String | `'asc'` | Sort order: asc, desc, none |
| `onSelect` | Function | `null` | Selection callback |

### Methods

```javascript
// Select an item
nav.select('item-id');

// Get selected item
const selected = nav.getSelected();

// Update items
nav.setItems(newItems);

// Refresh the display
nav.refresh();

// Destroy the component
nav.destroy();
```

## SideNavPanel

Full-featured slide-out panel with SideNav, content area, and resizing.

### Basic Usage

```javascript
const panel = new Funky.SideNavPanel({
  title: 'Report Formats',
  items: [
    { id: '1', label: 'Format A' },
    { id: '2', label: 'Format B' }
  ],
  onSelect: function(id, item) {
    // Load content for selected item
    panel.setContent('<div>Content for ' + item.label + '</div>');
  },
  actions: [
    { 
      id: 'add', 
      icon: 'fas fa-plus', 
      title: 'Add New',
      onClick: function() { ... }
    }
  ]
});
```

### Panel Methods

```javascript
// Open the panel
panel.open();

// Close the panel
panel.close();

// Toggle open/close
panel.toggle();

// Set main content
panel.setContent('<div>New content</div>');

// Update nav items
panel.setItems(newItems);

// Select nav item
panel.select('item-id');
```

## Wizard

Multi-step form wizard with validation, progress indicator, and step navigation.

### Basic Usage

```javascript
const wizard = new Funky.Wizard({
  container: '#wizard-container',
  steps: [
    {
      id: 'basic',
      title: 'Basic Info',
      content: '<form>...</form>',
      validate: function() {
        return $('#name').val().length > 0;
      }
    },
    {
      id: 'details',
      title: 'Details',
      content: '<form>...</form>'
    },
    {
      id: 'confirm',
      title: 'Confirm',
      content: '<div>Review your entries</div>'
    }
  ],
  onComplete: function(data) {
    console.log('Wizard completed:', data);
  }
});
```

### Configuration

| Option | Type | Description |
|--------|------|-------------|
| `container` | String/Element | Container for wizard |
| `steps` | Array | Step definitions |
| `showProgress` | Boolean | Show progress bar |
| `showStepNumbers` | Boolean | Show step numbers |
| `allowSkip` | Boolean | Allow skipping steps |
| `onComplete` | Function | Completion callback |
| `onStepChange` | Function | Step change callback |

### Step Definition

```javascript
{
  id: 'step-1',           // Unique ID
  title: 'Step Title',    // Display title
  content: '...',         // HTML content or function
  validate: function() {  // Optional validation
    return true;
  },
  onEnter: function() {   // Called when entering step
    // Initialize step
  },
  onLeave: function() {   // Called when leaving step
    // Cleanup
  }
}
```

### Methods

```javascript
wizard.next();           // Go to next step
wizard.prev();           // Go to previous step
wizard.goTo('step-id');  // Go to specific step
wizard.getData();        // Get collected form data
wizard.reset();          // Reset to first step
```

## Modal System

Enhanced Bootstrap modal with form support, CRUD operations, and slide animations.

### Form Modal

```javascript
Funky.FormModal.open({
  title: 'Create Record',
  action: '/api/records',
  method: 'POST',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]}
  ],
  onSuccess: function(response) {
    Funky.Toast.success('Record created');
    table.ajax.reload();
  }
});
```

### View Modal

Read-only modal for displaying record details.

```javascript
Funky.ViewModal.open({
  title: 'Record Details',
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    created: '2024-01-15'
  },
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'created', label: 'Created', format: 'date' }
  ]
});
```

### Modal Slide Directions

Modals can slide in from different directions based on nav position:

```html
<body data-modal-slide="right">
```

Options: `left`, `right`, `top`, `bottom`, `auto` (opposite of nav)

## Funky.Table

Native ES5 table component built entirely with Funky.Dom for zero jQuery dependency.

### Basic Usage

```javascript
var table = new Funky.Table('#my-table', {
  columns: [
    { data: 'id', title: 'ID', width: 80 },
    { data: 'name', title: 'Name', sortable: true },
    { data: 'status', title: 'Status', render: function(value, row) {
      return '<span class="badge bg-' + (value === 'active' ? 'success' : 'secondary') + '">' + value + '</span>';
    }}
  ],
  data: [
    { id: 1, name: 'John Doe', status: 'active' },
    { id: 2, name: 'Jane Smith', status: 'inactive' }
  ]
});
```

### Server-Side Data

```javascript
var table = new Funky.Table('#my-table', {
  serverSide: true,
  ajax: {
    url: '/api/records',
    method: 'GET'
  },
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' }
  ]
});
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Sorting** | Multi-column sort with server-side support |
| **Pagination** | Configurable page sizes, jump-to-page |
| **Search** | Global and per-column filtering |
| **Selection** | Single/multi-select with shift-click |
| **Column Profiles** | Save/restore column configurations |
| **Aggregations** | Sum, avg, count, min/max in footers |
| **Export** | CSV/Excel export with button toolbar |
| **Context Menu** | Right-click menus on rows |
| **LiveBinding** | WebSocket real-time updates |
| **Accessibility** | Full WCAG 2.1 AA keyboard navigation |

### Full Documentation

- **API Reference**: [docs/FUNKY_TABLE.md](FUNKY_TABLE.md)

## Advanced Filter

Complex filter builder with AND/OR groups and field-specific operators.

### Basic Usage

```javascript
const filter = new Funky.AdvancedFilter({
  container: '#filter-container',
  fields: [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: [...] }
  ],
  onApply: function(filters) {
    // Apply filters to table
    table.reload();
  }
});
```

### Filter Operators

| Type | Operators |
|------|-----------|
| text | equals, contains, starts_with, ends_with, is_empty |
| number | equals, not_equals, greater, less, between |
| date | equals, before, after, between, last_n_days |
| select | equals, not_equals, in, not_in |

## Preferences

User preference management with server persistence.

### Loading Preferences

```javascript
Funky.Preferences.load().then(function(prefs) {
  console.log('Theme:', prefs.theme);
  console.log('Density:', prefs.density);
});
```

### Saving Preferences

```javascript
Funky.Preferences.save({
  theme: {
    theme: 'dark',
    density: 'comfortable',
    accent_color: '#ff6600'
  }
}).then(function() {
  Funky.Toast.success('Preferences saved');
});
```

### Getting Single Value

```javascript
const theme = Funky.Preferences.get('theme.theme', 'dark');
const fontSize = Funky.Preferences.get('theme.font_scale', 1);
```

## Breadcrumb

Dynamic breadcrumb navigation with SPA support.

### Auto-initialization

Breadcrumbs auto-update from `data-breadcrumb-title` attributes:

```html
<main id="spaContent" data-breadcrumb-title="Trade Details">
  ...
</main>
```

### Manual Update

```javascript
Funky.Breadcrumb.update([
  { label: 'Home', url: '/' },
  { label: 'Trades', url: '/trades' },
  { label: 'Trade #123' }  // Current page (no url)
]);
```

## Charts

Plotly-based chart components.

```javascript
Funky.Charts.render('#chart-container', {
  type: 'line',
  data: {
    x: ['Jan', 'Feb', 'Mar'],
    y: [10, 20, 30]
  },
  options: {
    title: 'Monthly Trend'
  }
});
```

## Audio

Sound effects for UI feedback.

```javascript
// Play notification sound
Funky.Audio.play('notification');

// Play theme music (Even Funkier mode)
Funky.Audio.playTheme();
```

## LiveBinding

Reactive data binding component for real-time updates.

### Element Binding

```javascript
Funky.LiveBinding.bind('#notifications', {
  source: 'event',
  event: 'notification:new',
  append: true,
  max: 10,
  template: '<div class="alert">{{message}}</div>'
});
```

### Component Binding

```javascript
Funky.LiveBinding.bindComponent('#trade-table', {
  source: 'event',
  event: 'trades:update',
  smartUpdate: true,
  keyField: 'id'
});
```

### Declarative Binding

```html
<div data-live-bind="event:status"
     data-live-template="Status: {{status}}">
</div>
```

**Features:**
- **Sources**: cache, websocket, event, api, computed
- **Templates**: Mustache-style with formatters
- **Streaming**: Append/prepend with max limit
- **Smart Updates**: Diff-based table updates
- **Two-way**: Form field sync

[Full Documentation](js/core/live-binding.md)

## Event System

Components use Funky.PubSub for communication.

```javascript
// Listen for events
Funky.PubSub.on('funky:record:created', function(data) {
  console.log('New record:', data);
});

// Emit events
Funky.PubSub.emit('funky:record:created', { id: 123, name: 'Test' });

// One-time listener
Funky.PubSub.once('funky:modal:closed', function() {
  // Cleanup
});
```

## MediaQuery

Centralized media query manager with shared listeners and named breakpoints.

### Purpose

- Share matchMedia listeners across components
- Provide consistent named breakpoints
- Emit PubSub events on media query changes
- Reduce duplicate media query code

### Basic Usage

```javascript
// Subscribe to a breakpoint
Funky.MediaQuery.subscribe({
  breakpoint: 'mobile',
  namespace: 'my-component',
  onChange: function(matches) {
    console.log('Mobile:', matches);
  }
});

// Check current state without subscribing
if (Funky.MediaQuery.matches('mobile')) {
  // Mobile layout
}

// Unsubscribe
Funky.MediaQuery.unsubscribe('my-component');
```

### Custom Query

```javascript
Funky.MediaQuery.subscribe({
  query: '(min-width: 500px)',
  namespace: 'custom-check',
  onChange: function(matches) {
    console.log('Custom matches:', matches);
  }
});
```

### Predefined Breakpoints

| Name | Query |
|------|-------|
| `mobile` | `(max-width: 767px)` |
| `tablet` | `(max-width: 1023px)` |
| `tablet-only` | `(min-width: 768px) and (max-width: 1023px)` |
| `desktop` | `(min-width: 1024px)` |
| `large` | `(min-width: 1200px)` |
| `xlarge` | `(min-width: 1440px)` |
| `portrait` | `(orientation: portrait)` |
| `landscape` | `(orientation: landscape)` |
| `touch` | `(pointer: coarse)` |
| `mouse` | `(pointer: fine)` |
| `hover` | `(hover: hover)` |
| `reduced-motion` | `(prefers-reduced-motion: reduce)` |
| `dark-mode` | `(prefers-color-scheme: dark)` |
| `light-mode` | `(prefers-color-scheme: light)` |
| `high-contrast` | `(prefers-contrast: more)` |

### PubSub Events

```javascript
// Listen via PubSub
Funky.PubSub.on('funky:mediaquery:mobile', function(data) {
  console.log('Mobile mode:', data.matches);
});

// General change event
Funky.PubSub.on('funky:mediaquery:change', function(data) {
  console.log('Query:', data.query, 'Matches:', data.matches);
});
```

### Accessibility Patterns

```javascript
// Respect reduced motion preference
if (Funky.MediaQuery.matches('reduced-motion')) {
  element.style.transition = 'none';
}

// Theme detection
Funky.MediaQuery.subscribe({
  breakpoint: 'dark-mode',
  namespace: 'theme-auto',
  onChange: function(matches) {
    applyTheme(matches ? 'dark' : 'light');
  }
});
```

### API Reference

| Method | Description |
|--------|-------------|
| `subscribe(options)` | Subscribe to breakpoint/query with namespace |
| `unsubscribe(namespace)` | Remove subscription by namespace |
| `matches(name)` | Check if breakpoint/query currently matches |
| `getBreakpoints()` | Get all predefined breakpoints |
| `addBreakpoint(name, query)` | Add custom named breakpoint |
| `isSubscribed(namespace)` | Check if namespace is subscribed |

## Component Registration

All components follow the same registration pattern:

```javascript
(function(window) {
  'use strict';
  
  // Guard against double registration
  if (Funky.isRegistered('MyComponent')) return;
  
  function MyComponent(config) {
    // Constructor
  }
  
  MyComponent.prototype.method = function() {
    // Method
  };
  
  // Register
  Funky.register('MyComponent', new MyComponent());
  
})(window);
```

## Files Reference

| Component | File |
|-----------|------|
| Toast | `components/toast.js` |
| SideNav | `components/sidenav.js` |
| SideNavPanel | `components/sidenav-panel.js` |
| Wizard | `components/wizard.js` |
| FormModal | `components/form-modal.js` |
| ViewModal | `components/view-modal.js` |
| Table | `components/table.js` |
| BulkActions | `components/bulk-actions.js` |
| AdvancedFilter | `components/advanced-filter.js` |
| Preferences | `components/preferences.js` |
| Breadcrumb | `components/breadcrumb.js` |
| Charts | `components/charts.js` |
| Audio | `components/audio.js` |
| LiveBinding | `core/live-binding.js` |
| Events | `core/events.js` |
| Registry | `core/registry.js` |
| MediaQuery | `core/media-query.js` |
