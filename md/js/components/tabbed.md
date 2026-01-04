# Funky.Tabbed Component

**Version:** 1.0.0  
**Author:** Funky Team  
**Last Updated:** 2025-06-19

## Overview

`Funky.Tabbed` is a composable tab container component that allows multiple content types within a single tabbed interface. Each tab can independently contain a `Funky.CRUD` instance, a DataTable, a form, or custom content.

## Features

- **Composable Architecture**: Each tab is an independent container
- **Multiple Tab Types**: Support for 'crud', 'datatable', 'form', and 'custom' content
- **Lazy Loading**: Tabs initialize on first view for better performance
- **State Persistence**: Remember last active tab via localStorage
- **URL Hash Navigation**: Deep link to specific tabs via URL hash
- **WebSocket Integration**: Route entity updates to appropriate tabs
- **Lifecycle Hooks**: onInit, onShow, onHide, onDestroy for each tab
- **Bootstrap 5 Integration**: Uses native Bootstrap tab events

## Quick Start

### Basic Usage (HTML Structure)

```html
<!-- Tab Navigation -->
<ul class="nav nav-tabs" id="myTabs" role="tablist">
    <li class="nav-item" role="presentation">
        <button class="nav-link active" id="items-tab" data-bs-toggle="tab" 
                data-bs-target="#items" type="button" role="tab">
            <i class="fas fa-list me-1"></i> Items
        </button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="settings-tab" data-bs-toggle="tab" 
                data-bs-target="#settings" type="button" role="tab">
            <i class="fas fa-cog me-1"></i> Settings
        </button>
    </li>
</ul>

<!-- Tab Content -->
<div class="tab-content" id="myTabsContent">
    <div class="tab-pane fade show active" id="items" role="tabpanel">
        <!-- CRUD will be injected here -->
    </div>
    <div class="tab-pane fade" id="settings" role="tabpanel">
        <!-- Custom content -->
        <form id="settings-form">
            <div class="mb-3">
                <label class="form-label">Setting Name</label>
                <input type="text" class="form-control" name="name">
            </div>
            <button type="submit" class="btn btn-primary">Save</button>
        </form>
    </div>
</div>
```

### JavaScript Initialization

```javascript
Funky.Tabbed.init('myTabs', {
    persistState: true,
    defaultTab: 'items',
    tabs: {
        items: {
            type: 'crud',
            config: {
                entity: 'item',
                title: 'Items',
                endpoints: {
                    list: '/api/items',
                    get: '/api/items/:id',
                    create: '/api/items',
                    update: '/api/items/:id',
                    delete: '/api/items/:id'
                },
                columns: [
                    { data: 'id', title: 'ID' },
                    { data: 'name', title: 'Name' },
                    { data: 'status', title: 'Status' }
                ],
                schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', title: 'Name' },
                        status: { type: 'string', title: 'Status', enum: ['active', 'inactive'] }
                    }
                }
            }
        },
        settings: {
            type: 'custom',
            onInit: function(tabEl, ctx) {
                // Initialize custom tab content
                const form = tabEl.querySelector('#settings-form');
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    // Handle form submission
                });
            }
        }
    }
});
```

## API Reference

### Funky.Tabbed.init(containerId, options)

Initialize a tabbed container.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `containerId` | `string` | ID of the tab navigation element (the `<ul>` with nav-tabs) |
| `options` | `object` | Configuration options |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rememberTab` | `boolean` | `true` | Remember last active tab in localStorage |
| `defaultTab` | `string` | First tab | Default tab to show on initial load |
| `tabs` | `object\|array` | `{}` | Tab configurations keyed by tab ID, or array of tab objects |
| `updateStats` | `function` | `null` | Callback with tab stats data |

### Tab Configuration

Each tab in the `tabs` object has the following structure:

```javascript
{
    type: 'crud' | 'datatable' | 'form' | 'custom',
    config: { ... },  // Type-specific configuration
    onInit: function(tabEl, ctx) { },
    onShow: function(tabEl, ctx) { },
    onHide: function(tabEl, ctx) { },
    onDestroy: function(tabEl, ctx) { }
}
```

### Tab Types

#### CRUD Tab (`type: 'crud'`)

Initializes a full `Funky.CRUD` instance within the tab.

```javascript
{
    type: 'crud',
    config: {
        entity: 'subscription',
        title: 'Subscriptions',
        endpoints: { ... },
        columns: [ ... ],
        schema: { ... },
        // All Funky.CRUD options supported
    }
}
```

#### DataTable Tab (`type: 'datatable'`)

Initializes a standalone `Funky.DataTables` instance (read-only).

```javascript
{
    type: 'datatable',
    config: {
        tableId: 'logs-table',  // ID of existing table element
        endpoint: '/api/logs',
        columns: [ ... ],
        serverSide: true,
        // All Funky.DataTables options supported
    }
}
```

#### Form Tab (`type: 'form'`)

Initializes a settings-style form with JSONEditor.

```javascript
{
    type: 'form',
    config: {
        formId: 'settings-form',  // ID of form container
        schema: { ... },
        loadEndpoint: '/api/settings',
        saveEndpoint: '/api/settings',
        // Optional: transform data on load/save
        transformLoad: function(data) { return data; },
        transformSave: function(data) { return data; }
    }
}
```

#### Custom Tab (`type: 'custom'`)

Full control over tab initialization.

```javascript
{
    type: 'custom',
    onInit: function(tabEl, ctx) {
        // tabEl: The tab pane element
        // ctx: Context object with { tabbed, tabId, config }
        
        // Initialize your custom content
        ctx.myCustomData = {};
    },
    onShow: function(tabEl, ctx) {
        // Called each time tab becomes visible
    },
    onHide: function(tabEl, ctx) {
        // Called when tab is hidden
    }
}
```

### Instance Methods

After initialization, you can access the instance:

```javascript
var tabbed = Funky.Tabbed.getInstance('myTabs');

// Switch to a specific tab
tabbed.switchTab('settings');

// Get the active tab ID
var activeId = tabbed.getActiveTab();

// Get a tab's instance (CRUD, DataTable, etc.)
var crud = tabbed.getTabInstance('items');

// Refresh content in a specific tab (or all if no argument)
tabbed.refresh('items');

// Handle entity updates (for WebSocket integration)
tabbed.handleEntityUpdate('item', 123, { name: 'Updated' }, 'update');

// Destroy the tabbed container
tabbed.destroy();
```

#### Bindable Interface Methods

For integration with `Funky.LiveBinding`:

```javascript
// Set tab definitions dynamically (replaces existing tabs)
tabbed.setData([
  { id: 'tab1', type: 'custom', label: 'Tab 1' },
  { id: 'tab2', type: 'crud', config: { ... } }
]);

// Get current tab state
var state = tabbed.getData();
// Returns: { activeTabId, tabOrder, tabs, initializedTabs }
```

### Static Methods

```javascript
// Get an existing instance
var instance = Funky.Tabbed.getInstance('myTabs');

// Get all instances
var all = Funky.Tabbed.getAll();

// Destroy a specific instance
Funky.Tabbed.destroy('myTabs');

// Destroy all instances
Funky.Tabbed.destroyAll();

// Bindable Interface: Set data on a specific instance
Funky.Tabbed.setData('myTabs', tabDefinitions);

// Bindable Interface: Get data from a specific instance
var state = Funky.Tabbed.getData('myTabs');
```

## Lifecycle Hooks

Each tab can define lifecycle hooks:

| Hook | When Called |
|------|-------------|
| `onInit(tabEl, ctx)` | Once, when tab is first shown (lazy loading) |
| `onShow(tabEl, ctx)` | Every time tab becomes visible |
| `onHide(tabEl, ctx)` | Every time tab is hidden |
| `onDestroy(tabEl, ctx)` | When tabbed container is destroyed |

### Context Object

The `ctx` parameter passed to hooks contains:

```javascript
{
    tabbed: TabbedInstance,  // Reference to parent instance
    tabId: 'items',          // ID of this tab
    config: { ... },         // This tab's configuration
    instance: null,          // CRUD/DataTable/Form instance (if applicable)
    // Custom properties can be added
}
```

## URL Hash Navigation

With `useHashNavigation: true`, tabs can be deep-linked:

```
/page#items    → Opens items tab
/page#settings → Opens settings tab
```

The hash updates automatically when switching tabs.

Note: `useHashNavigation` is always enabled and cannot be disabled.

## State Persistence

With `rememberTab: true`, the last active tab is saved to localStorage:

- Key: `tabbed_${containerId}_activeTab`
- Value: Tab ID (e.g., 'items')

Priority order for initial tab:
1. URL hash (if present)
2. Saved state from localStorage
3. `defaultTab` option
4. First tab in DOM

## WebSocket Integration

For real-time updates, integrate with your WebSocket handler:

```javascript
// In your WebSocket message handler
Funky.ws.onMessage(function(message) {
    if (message.type === 'entity_update') {
        var tabbed = Funky.Tabbed.getInstance('myTabs');
        if (tabbed) {
            tabbed.handleEntityUpdate(
                message.entity,  // e.g., 'item'
                message.id,      // Entity ID
                message.data,    // Entity data
                message.action   // 'create', 'update', 'delete'
            );
        }
    }
});
```

The `handleEntityUpdate` method routes updates to the correct tab based on entity type and refreshes the DataTable if needed.

## Complete Example: Push Notifications Page

```html
<div class="container-fluid">
    <h4 class="mb-3"><i class="fas fa-bell me-2"></i>Push Notifications</h4>
    
    <ul class="nav nav-tabs" id="pushTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" id="subscriptions-tab" data-bs-toggle="tab" 
                    data-bs-target="#subscriptions" type="button" role="tab">
                <i class="fas fa-users me-1"></i> Subscriptions
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="notifications-tab" data-bs-toggle="tab" 
                    data-bs-target="#notifications" type="button" role="tab">
                <i class="fas fa-paper-plane me-1"></i> Notifications
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="settings-tab" data-bs-toggle="tab" 
                    data-bs-target="#settings" type="button" role="tab">
                <i class="fas fa-cog me-1"></i> Settings
            </button>
        </li>
    </ul>
    
    <div class="tab-content pt-3" id="pushTabsContent">
        <div class="tab-pane fade show active" id="subscriptions" role="tabpanel"></div>
        <div class="tab-pane fade" id="notifications" role="tabpanel"></div>
        <div class="tab-pane fade" id="settings" role="tabpanel">
            <div class="card">
                <div class="card-body">
                    <div id="vapid-editor"></div>
                    <button class="btn btn-primary mt-3" id="save-vapid">
                        <i class="fas fa-save me-1"></i> Save Settings
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    Funky.Tabbed.init('pushTabs', {
        persistState: true,
        tabs: {
            subscriptions: {
                type: 'crud',
                config: {
                    entity: 'push_subscription',
                    title: 'Push Subscriptions',
                    endpoints: {
                        list: '/api/push/subscriptions',
                        delete: '/api/push/subscriptions/:id'
                    },
                    permissions: { create: false, edit: false, delete: true },
                    columns: [
                        { data: 'id', title: 'ID' },
                        { data: 'user_id', title: 'User' },
                        { data: 'created_at', title: 'Created', render: Funky.Renderers.datetime }
                    ]
                }
            },
            notifications: {
                type: 'crud',
                config: {
                    entity: 'push_notification',
                    title: 'Notifications',
                    endpoints: {
                        list: '/api/push/notifications',
                        create: '/api/push/notifications/send'
                    },
                    permissions: { create: true, edit: false, delete: false },
                    columns: [
                        { data: 'id', title: 'ID' },
                        { data: 'title', title: 'Title' },
                        { data: 'sent_at', title: 'Sent', render: Funky.Renderers.datetime }
                    ],
                    schema: {
                        type: 'object',
                        required: ['title', 'body'],
                        properties: {
                            title: { type: 'string', title: 'Title' },
                            body: { type: 'string', title: 'Message', format: 'textarea' },
                            url: { type: 'string', title: 'URL', format: 'uri' }
                        }
                    }
                }
            },
            settings: {
                type: 'custom',
                onInit: function(tabEl, ctx) {
                    // Initialize VAPID settings editor
                    const container = tabEl.querySelector('#vapid-editor');
                    ctx.editor = new JSONEditor(container, {
                        schema: {
                            type: 'object',
                            properties: {
                                vapid_public_key: { type: 'string', title: 'VAPID Public Key' },
                                vapid_private_key: { type: 'string', title: 'VAPID Private Key' },
                                vapid_subject: { type: 'string', title: 'VAPID Subject', format: 'email' }
                            }
                        },
                        theme: 'bootstrap5'
                    });
                    
                    // Load current settings
                    fetch('/api/push/settings')
                        .then(r => r.json())
                        .then(data => ctx.editor.setValue(data.data || {}));
                    
                    // Save button handler
                    tabEl.querySelector('#save-vapid').addEventListener('click', function() {
                        fetch('/api/push/settings', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(ctx.editor.getValue())
                        }).then(r => r.json()).then(data => {
                            Funky.Toast.show(data.success ? 'success' : 'error', 
                                data.success ? 'Settings saved' : data.error);
                        });
                    });
                }
            }
        }
    });
});
</script>
```

## CSS Considerations

The component uses Bootstrap 5 tab classes. Custom styling can be added:

```css
/* Ensure tab content has proper spacing */
.tab-content > .tab-pane {
    padding-top: 1rem;
}

/* Optional: Add loading state to tabs */
.tab-pane.loading::before {
    content: '';
    display: block;
    height: 200px;
    background: url('/assets/images/spinner.gif') center no-repeat;
}
```

## Debugging

Enable debug mode to see detailed logs:

```javascript
Funky.Tabbed.debug = true;
```

Logs will show:
- Tab initialization events
- Show/hide transitions
- Entity update routing
- State persistence operations

## Migration from Manual Tabs

### Before (Manual Implementation)

```javascript
// 100+ lines of manual tab handling
const tab1 = new bootstrap.Tab(document.querySelector('#tab1-tab'));
const dt1 = $('#table1').DataTable({ ... });
document.querySelector('#tab1-tab').addEventListener('shown.bs.tab', function() {
    dt1.columns.adjust().draw();
});
// ... repeated for each tab
```

### After (Funky.Tabbed)

```javascript
Funky.Tabbed.init('myTabs', {
    tabs: {
        tab1: {
            type: 'datatable',
            config: { tableId: 'table1', ... }
        },
        tab2: {
            type: 'crud',
            config: { entity: 'item', ... }
        }
    }
});
```

## Related Components

- [Funky.CRUD](crud.md) - Full CRUD operations with DataTable
- [Funky.DataTables](datatables.md) - Enhanced DataTables wrapper
- [Funky.FormModal](form-modal.md) - Dynamic form modals with JSONEditor

## Changelog

### v1.0.0 (2025-06-19)
- Initial release
- Support for crud, datatable, form, and custom tab types
- Lazy loading for tabs
- URL hash navigation
- State persistence via localStorage
- WebSocket entity update routing
- Full lifecycle hooks (onInit, onShow, onHide, onDestroy)

---

## Bindable Interface (LiveBinding)

Tabbed supports the LiveBinding system for reactive data updates.

### Instance Registry

```javascript
// Access instances by container ID
const instance = Funky.Tabbed._instances['myTabs'];
```

### Bindable Methods

#### `setData(tabs)`

Update the tabs configuration dynamically.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| tabs | object | Tab configuration object |

**Example:**
```javascript
const tabbed = Funky.Tabbed._instances['myTabs'];
tabbed.setData({
  items: {
    type: 'crud',
    config: { entity: 'item', title: 'Items' }
  },
  reports: {
    type: 'custom',
    label: 'Reports',
    icon: 'fas fa-chart-bar'
  },
  settings: {
    type: 'form',
    config: { schema: settingsSchema }
  }
});
```

---

#### `getData()`

Get the current tabs configuration and state.

**Returns:** `Object` - Current tabs configuration with state information

**Example:**
```javascript
const tabbed = Funky.Tabbed._instances['myTabs'];
const tabsData = tabbed.getData();
console.log(Object.keys(tabsData));  // ['items', 'reports', 'settings']
console.log(tabsData.items.type);    // 'crud'
```

### LiveBinding Integration

```javascript
// Bind tabs to an API source (dynamic tab configuration)
Funky.LiveBinding.bind({
  source: { type: 'api', endpoint: '/api/user/dashboard_tabs' },
  target: {
    type: 'component',
    component: 'Tabbed',
    instance: 'myTabs'
  }
});

// Bind to state for local tab management
Funky.LiveBinding.bind({
  source: { type: 'state', key: 'dashboardTabs' },
  target: {
    type: 'component',
    component: 'Tabbed',
    instance: 'myTabs'
  }
});

// Update tabs reactively (e.g., based on user role)
Funky.LiveBinding.setState('dashboardTabs', {
  overview: { type: 'custom', label: 'Overview' },
  analytics: { type: 'custom', label: 'Analytics', icon: 'fas fa-chart-line' }
});
```
