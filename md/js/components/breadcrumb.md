# Funky.Breadcrumb - Dynamic Breadcrumb Generation

Auto-generates breadcrumbs from URL paths with route label mappings and custom page title support.

## Overview

`Funky.Breadcrumb` automatically generates navigation breadcrumbs based on the current URL path. It uses configurable label mappings and supports custom page titles via data attributes.

## API Reference

### Methods

#### `Breadcrumb.render(container)`

Render breadcrumbs into a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | HTMLElement\|string | Yes | Container element or CSS selector |

**Example:**
```javascript
Funky.Breadcrumb.render('#breadcrumbContainer');
```

---

#### `Breadcrumb.generate(path)`

Generate breadcrumb items from a URL path.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| path | string | No | URL path (defaults to current location) |

**Returns:** `Array<{ label: string, url: string|null, active: boolean, icon?: string }>`

**Example:**
```javascript
var crumbs = Funky.Breadcrumb.generate('/web/trades/123/edit');
// [
//   { label: 'Home', url: '/', icon: 'fa-home' },
//   { label: 'Trades', url: '/trades' },
//   { label: 'Edit', url: null, active: true }
// ]
// Note: Numeric IDs (123) are automatically skipped in breadcrumbs
```

---

#### `Breadcrumb.addLabels(mappings)`

Add or update label mappings.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| mappings | object | Yes | Route → Label mappings |

**Example:**
```javascript
Funky.Breadcrumb.addLabels({
  'custom_page': 'My Custom Page',
  'settings': 'Settings'
});
```

---

#### `Breadcrumb.formatLabel(segment)`

Format a URL segment as a human-readable label.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| segment | string | Yes | URL path segment |

**Returns:** `string` - Formatted label with underscores/dashes replaced and words capitalized

**Example:**
```javascript
Funky.Breadcrumb.formatLabel('trade_action');
// Returns: 'Trade Action'
```

---

#### `Breadcrumb.autoInit()`

Auto-initialize breadcrumbs in containers with `data-breadcrumb-auto` and `#pageBreadcrumb`.

**Example:**
```javascript
// Manually trigger auto-initialization
Funky.Breadcrumb.autoInit();
```

---

#### `Breadcrumb.getInstance(id)`

Get a breadcrumb instance by container ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Container element ID |

**Returns:** `Object|null` - Instance with `container` and `crumbs` properties

**Example:**
```javascript
var instance = Funky.Breadcrumb.getInstance('pageBreadcrumb');
if (instance) {
  console.log('Current crumbs:', instance.crumbs);
}
```

---

#### `Breadcrumb.destroy(id)`

Destroy a breadcrumb instance by container ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Container element ID |

**Example:**
```javascript
Funky.Breadcrumb.destroy('pageBreadcrumb');
```

---

#### `Breadcrumb.destroyAll()`

Destroy all breadcrumb instances.

**Example:**
```javascript
Funky.Breadcrumb.destroyAll();
```

---

### Default Labels

| Route | Label |
|-------|-------|
| home | Dashboard |
| trades / trade | Trades |
| clients / client | Clients |
| securities / security | Securities |
| allocations / allocation | Allocations |
| fx_rates / fx_rate | FX Rates |
| templates / template | Templates |
| users / user | Users |
| audit_log / audit_logs | Audit Log |
| report_format | Report Formats |
| realtime | Real-Time Files |
| profile | Profile |
| new / create | New |
| edit | Edit |
| view | View |
| list | List |

## Auto-Initialization

Breadcrumbs are automatically rendered on:
- DOM ready
- SPA navigation (`spa:loaded` event)

### Auto-Init Targets

```html
<!-- These elements will auto-initialize -->
<nav id="pageBreadcrumb"></nav>
<div data-breadcrumb-auto></div>
```

### Custom Page Title

Use data attribute for custom breadcrumb labels:

```html
<body data-page-title="Trade #12345">
  <!-- Breadcrumb will use "Trade #12345" for current page -->
</body>
```

## Dependencies

None - this is a standalone component.

## Examples

### Manual Breadcrumb Update

```javascript
// After programmatic navigation
history.pushState({}, '', '/web/trades/new');
Funky.Breadcrumb.render('#breadcrumbNav');
```

### Custom Breadcrumb Structure

```javascript
// Generate and customize
var crumbs = Funky.Breadcrumb.generate();

// Add custom item
crumbs.splice(crumbs.length - 1, 0, {
  label: 'Custom Step',
  url: '#',
  active: false
});

// Render custom HTML
var html = crumbs.map(function(c) {
  return '<li class="breadcrumb-item' + (c.active ? ' active' : '') + '">' +
    (c.active ? c.label : '<a href="' + c.url + '">' + c.label + '</a>') +
    '</li>';
}).join('');

$('#breadcrumb').html(html);
```

## Bindable Interface (LiveBinding)

Breadcrumb supports the LiveBinding system for reactive data updates.

### Bindable Methods

#### `Breadcrumb.setData(crumbs)`

Update all registered breadcrumb instances with new navigation items. This is a static method on the Breadcrumb object.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| crumbs | Array | Yes | Array of breadcrumb objects |

**Crumb Object:**
| Property | Type | Description |
|----------|------|-------------|
| label | string | Display text for the crumb |
| url | string | Navigation URL (null for active item) |
| icon | string | Optional FontAwesome icon class |

**Example:**
```javascript
// Update breadcrumbs across all registered containers
Funky.Breadcrumb.setData([
  { label: 'Dashboard', url: '/', icon: 'fa-home' },
  { label: 'Trades', url: '/trades' },
  { label: 'Trade #12345', url: null }
]);
```

### LiveBinding Integration

```javascript
// Bind breadcrumb to SPA navigation state
Funky.LiveBinding.bind({
    source: { type: 'state', key: 'navigation.breadcrumbs' },
    target: {
        type: 'component',
        component: 'Breadcrumb',
        container: '#pageBreadcrumb',
        method: 'setData'
    }
});

// Update breadcrumbs when route changes
Funky.State.set('navigation.breadcrumbs', [
    { label: 'Dashboard', url: '/web/home', icon: 'fa-home' },
    { label: 'Reports', url: '/web/reports' },
    { label: 'Monthly Summary', url: '/web/reports/monthly' }
]);
```
