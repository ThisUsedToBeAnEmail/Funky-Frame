# Funky.ActionBar

Declarative page action toolbar with standardized buttons and automatic component integration.

## Quick Start (JavaScript API)

The preferred way to create an ActionBar is via JavaScript:

```javascript
Funky.ActionBar.init({
  container: '#toolbar-container',
  entity: 'clients',
  api: '/api/clients',
  buttons: [
    { action: 'create', label: 'Add Client' },
    { action: 'export' },
    { action: 'import' },
    { action: 'filter', attrs: { 'data-filter-target': '#clientFilters' } },
    { action: 'bulk' }
  ]
});
```

## Quick Start (HTML)

ActionBar also supports declarative HTML and auto-initializes on `role="toolbar"` elements with class `action-bar`:

```html
<div class="action-bar" role="toolbar" aria-label="Client actions" data-entity="clients">
  <button type="button" data-action="create" data-modal="#clientModal">
    <i class="fas fa-plus" aria-hidden="true"></i>
    <span>Add Client</span>
  </button>
  <button type="button" data-action="export" data-export-config="clients">
    <i class="fas fa-download" aria-hidden="true"></i>
    <span>Export</span>
  </button>
</div>
```

## Funky.ActionBar.init()

### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `container` | string/Element | Container element or selector (required) |
| `entity` | string | Entity name for events |
| `api` | string | API endpoint |
| `tableId` | string | Associated Funky.Table ID |
| `ariaLabel` | string | Toolbar aria-label (default: "Page actions") |
| `buttons` | Array | Button configurations |
| `position` | string | `'prepend'` or `'append'` (default) |

### Button Config Options

| Option | Type | Description |
|--------|------|-------------|
| `action` | string | Action name (required) |
| `label` | string | Button text |
| `icon` | string | FontAwesome icon class (e.g., `'fa-plus'`) |
| `variant` | string | Button variant: `primary`, `secondary`, `outline-secondary`, etc. |
| `iconOnly` | boolean | Show only icon with tooltip |
| `attrs` | Object | Additional HTML attributes |

### Built-in Action Defaults

These actions have pre-configured icons, labels, and variants:

| Action | Icon | Label | Variant |
|--------|------|-------|---------|
| `create` | fa-plus | Add | primary |
| `edit` | fa-pencil | Edit | outline-secondary |
| `delete` | fa-trash | Delete | outline-danger |
| `export` | fa-download | Export | outline-secondary |
| `import` | fa-upload | Import | outline-secondary |
| `filter` | fa-filter | Filter | outline-secondary |
| `bulk` | fa-check-square | Bulk Actions | outline-warning |
| `refresh` | fa-sync | Refresh | outline-secondary |
| `print` | fa-print | Print | outline-secondary |
| `settings` | fa-cog | Settings | outline-secondary |

### Examples

```javascript
// Basic usage with defaults
Funky.ActionBar.init({
  container: '#my-toolbar',
  entity: 'trades',
  buttons: [
    { action: 'create' },  // Uses defaults: fa-plus, "Add", primary
    { action: 'export' },  // Uses defaults: fa-download, "Export", outline-secondary
    { action: 'filter' }
  ]
});

// Custom labels and icons
Funky.ActionBar.init({
  container: '#my-toolbar',
  entity: 'clients',
  buttons: [
    { action: 'create', label: 'New Client' },
    { action: 'archive', label: 'Archive', icon: 'fa-box-archive', variant: 'outline-warning' },
    { action: 'export', iconOnly: true }  // Icon only with tooltip
  ]
});

// With Funky.Table integration
Funky.ActionBar.init({
  container: '#trade-actions',
  entity: 'trades',
  api: '/api/trades',
  tableId: 'tradesTable',
  buttons: [
    { action: 'create' },
    { action: 'bulk' },
    { action: 'filter', attrs: { 'data-filter-target': '#tradeFilters' } }
  ]
});
```

## HTML Attributes

### Container Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `role="toolbar"` | Yes | Required for accessibility |
| `class="action-bar"` | Yes | Required for styling and init |
| `aria-label` | Yes | Describes toolbar purpose |
| `data-entity` | No | Entity type for events |
| `data-api` | No | API base URL |
| `data-table-id` | No | Associated Funky.Table ID |

### Button Attributes

| Attribute | Description |
|-----------|-------------|
| `data-action` | Action type: `create`, `export`, `import`, `filter`, `custom` |
| `data-modal` | Modal ID for create action |
| `data-export-config` | Export config name |
| `data-import-config` | Import config name |
| `data-filter-target` | Filter panel ID |
| `data-custom-action` | Custom action name |

## Actions

### Create

Opens a FormModal for entity creation.

```html
<button data-action="create" data-modal="#clientModal">Add</button>
```

### Export

Triggers the centralized export flow.

```html
<button data-action="export" data-export-config="clients-full">Export</button>
```

### Import

Opens the import wizard.

```html
<button data-action="import" data-import-config="clients">Import</button>
```

### Filter

Toggles a FilterToolbar's visibility.

```html
<button data-action="filter" 
        data-filter-target="#clientFilters" 
        aria-expanded="false" 
        aria-controls="clientFilters">
  Filters
</button>
```

### Custom

For application-specific actions.

```html
<button data-action="custom" data-custom-action="archive">Archive</button>
```

## Events

### Emitted Events

| Event | Payload | When |
|-------|---------|------|
| `funky.action-bar.create` | `{ entity, api, modalId }` | Create clicked |
| `funky.action-bar.export` | `{ entity, config }` | Export clicked |
| `funky.action-bar.import` | `{ entity, config }` | Import clicked |
| `funky.action-bar.filter-toggle` | `{ entity, visible, target }` | Filter toggled |
| `funky.action-bar.custom` | `{ entity, action, button }` | Custom action clicked |
| `funky.action-bar.action` | `{ action, entity, api, button }` | Any action clicked |
| `funky.action-bar.bulk-update` | `{ entity, count }` | Bulk selection changed |

### Listening to Events

```javascript
Funky.Events.on('funky.action-bar.create', function(data) {
    console.log('Create clicked for:', data.entity);
});

Funky.Events.on('funky.action-bar.custom', function(data) {
    if (data.action === 'archive') {
        archiveSelected(data.entity);
    }
});
```

## JavaScript API

### Get Instance

```javascript
var actionBar = Funky.ActionBar.getInstance('#clientActions');
```

### Methods

```javascript
// Enable/disable a button
actionBar.setEnabled('export', false);

// Show loading state
actionBar.setLoading('export', true);

// Update filter badge count
actionBar.setFilterCount(3);

// Update bulk selection count
actionBar.setBulkSelection(5);

// Get button element
var btn = actionBar.getButton('create');
```

### LiveBinding Integration

ActionBar supports reactive state updates via LiveBinding:

```javascript
// API-driven state
actionBar.bindState({
    source: 'api',
    url: '/api/permissions/clients'
});

// Event-driven state
actionBar.bindState({
    source: 'event',
    event: 'funky:permissions:loaded'
});

// Manual state object
actionBar.bindState({
    source: 'state',
    data: { 
        create: { enabled: true }, 
        filter: { badge: 3 } 
    }
});

// Update state programmatically
actionBar.updateState({ export: { enabled: false } });
```

**State object shape:**

```javascript
{
    actionName: {
        enabled: true,   // Enable/disable button
        visible: true,   // Show/hide button
        loading: false,  // Loading spinner
        badge: 0         // Badge count (for filter)
    }
}
```

## Keyboard Navigation

ActionBar implements the WAI-ARIA toolbar pattern:

| Key | Action |
|-----|--------|
| `→` / `↓` | Move to next button |
| `←` / `↑` | Move to previous button |
| `Home` | Move to first button |
| `End` | Move to last button |
| `Enter` / `Space` | Activate button |

Disabled and hidden buttons are skipped during navigation.

## Styling

### CSS Classes

| Class | Description |
|-------|-------------|
| `.action-bar` | Container |
| `.action-bar-compact` | Smaller buttons |
| `.action-bar-comfortable` | Larger buttons |
| `.action-bar-end` | Right-aligned group |
| `.separator` | Visual divider |
| `.is-loading` | Loading state |
| `.has-active-filters` | Filter has active count |
| `.btn-group` | Grouped buttons |

### CSS Variables

ActionBar uses `--pro-*` variables for theming:

- `--pro-primary` - Primary button color
- `--pro-surface` - Default button background
- `--pro-border` - Button border color
- `--pro-spacing-sm` - Gap between buttons
- `--pro-spacing-xs` - Icon/text gap
- `--pro-focus-ring-width` - Focus outline width
- `--pro-focus-ring-color` - Focus outline color

### Density Modes

```html
<!-- Compact mode -->
<div class="action-bar action-bar-compact" role="toolbar">...</div>

<!-- Comfortable mode -->
<div class="action-bar action-bar-comfortable" role="toolbar">...</div>

<!-- Via data-density attribute on ancestor -->
<div data-density="compact">
  <div class="action-bar" role="toolbar">...</div>
</div>
```

## Complete Example

```html
<div class="action-bar" 
     role="toolbar" 
     aria-label="Trade management"
     data-entity="trades"
     data-api="/api/trades"
     data-table-id="tradesTable">
  
  <button type="button" data-action="create" data-modal="#tradeModal">
    <i class="fas fa-plus" aria-hidden="true"></i>
    <span>New Trade</span>
  </button>
  
  <button type="button" data-action="export" data-export-config="trades">
    <i class="fas fa-download" aria-hidden="true"></i>
    <span>Export</span>
  </button>
  
  <button type="button" data-action="import" data-import-config="trades">
    <i class="fas fa-upload" aria-hidden="true"></i>
    <span>Import</span>
  </button>
  
  <div class="separator" aria-hidden="true"></div>
  
  <div class="action-bar-end">
    <button type="button" 
            data-action="filter" 
            data-filter-target="#tradeFilters"
            aria-expanded="false"
            aria-controls="tradeFilters">
      <i class="fas fa-filter" aria-hidden="true"></i>
      <span>Filters</span>
    </button>
  </div>
</div>

<div id="tradeFilters" class="filter-toolbar d-none">
  <!-- FilterToolbar content -->
</div>
```

## Integration

ActionBar automatically integrates with:

- **Funky.FormModal** - Opens modal on create action
- **Funky.Export** - Triggers export on export action
- **Funky.Import** - Opens wizard on import action
- **Funky.FilterToolbar** - Toggles on filter action
- **Funky.BulkActions** - Shows when Funky.Table rows selected
- **Funky.LiveBinding** - Reactive state updates

## Related

- [FormModal](form-modal.md) - Modal forms for create/edit
- [Export](export.md) - Centralized export system
- [Import](import.md) - Import wizard
- [FilterToolbar](filter-toolbar.md) - Advanced filtering
- [BulkActions](bulk-actions.md) - Multi-row operations
- [LiveBinding](../core/live-binding.md) - Reactive data binding
