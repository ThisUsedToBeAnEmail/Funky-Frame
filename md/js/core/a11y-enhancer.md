# Funky.A11yEnhancer - Automatic Screen Reader Enhancement

Automatically enhances tables and lists within scoped containers with visually-hidden text alternatives for screen readers that don't render visual table/list structures.

## Overview

Some screen readers (particularly in certain browsers) don't properly parse HTML tables and lists. `Funky.A11yEnhancer` solves this by:

1. Generating visually-hidden text summaries of table/list content
2. Inserting these summaries before the visual elements as supplementary context
3. Using `aria-live` regions for dynamic Funky.Table content

**Note:** The original tables/lists are NOT hidden from screen readers. This means capable screen readers will read both the summary and the original content (slightly redundant but ensures accessibility), while limited screen readers at least get the text summary.

**Key Features:**
- Scoped to `[data-a11y-scope]` containers only (opt-in)
- Automatic enhancement on page load and SPA navigation
- MutationObserver for dynamically added content
- Funky.Table integration with `draw.dt` event handling
- Full nested list support with proper indentation
- Preserves `<ol>` numbering and `<ul>` bullet hierarchy

## Registration

**File:** `public/assets/js/core/a11y-enhancer.js`

Registered as `Funky.A11yEnhancer` via the component registry.

## Quick Start

### 1. Add scope attribute to container

```html
<main data-a11y-scope>
  <!-- Tables and lists here will be enhanced -->
  <table>
    <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>John</td><td>john@example.com</td><td>Active</td></tr>
    </tbody>
  </table>
  
  <ul>
    <li>Dashboard</li>
    <li>Clients
      <ul>
        <li>Active</li>
        <li>Archived</li>
      </ul>
    </li>
  </ul>
</main>
```

### 2. Include the script

```html
<script src="/assets/js/core/a11y-enhancer.js"></script>
```

That's it! The enhancer auto-initializes on DOM ready.

## API Reference

### Methods

#### `A11yEnhancer.init([scope])`

Initialize enhancement for all scoped containers.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| scope | HTMLElement\|string | null | Optional specific container to initialize |

**Example:**
```javascript
// Initialize all [data-a11y-scope] containers
Funky.A11yEnhancer.init();

// Initialize specific container
Funky.A11yEnhancer.init('#main-content');
Funky.A11yEnhancer.init(document.getElementById('main-content'));
```

---

#### `A11yEnhancer.observe()`

Start observing scoped containers for dynamically added content.

**Example:**
```javascript
Funky.A11yEnhancer.observe();
```

---

#### `A11yEnhancer.disconnect()`

Stop all MutationObservers.

**Example:**
```javascript
Funky.A11yEnhancer.disconnect();
```

---

#### `A11yEnhancer.enhance(element)`

Manually enhance a specific table or list element.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| element | HTMLElement | Table, ul, or ol element to enhance |

**Example:**
```javascript
var table = document.getElementById('myTable');
Funky.A11yEnhancer.enhance(table);
```

---

#### `A11yEnhancer.configure(options)`

Configure the enhancer.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| scopeSelector | string | '[data-a11y-scope]' | CSS selector for scope containers |
| skipAttribute | string | 'data-a11y-skip' | Attribute to skip enhancement |
| enhancedAttribute | string | 'data-a11y-enhanced' | Marker for enhanced elements |
| tableMaxHeaders | number | 10 | Maximum headers to include in summary |
| enabled | boolean | true | Enable/disable enhancement |

**Example:**
```javascript
Funky.A11yEnhancer.configure({
    tableMaxHeaders: 5,
    scopeSelector: '[data-accessible]'
});
```

---

#### `A11yEnhancer.setEnabled(enabled)`

Enable or disable enhancement globally.

**Example:**
```javascript
// Disable for users with capable screen readers
Funky.A11yEnhancer.setEnabled(false);
```

---

#### `A11yEnhancer.isEnabled()`

Check if enhancement is enabled.

**Returns:** `boolean`

## Output Examples

### Table Summary

For a table like:
```html
<table>
  <caption>Client List</caption>
  <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>John</td><td>john@example.com</td><td>Active</td></tr>
    <tr><td>Jane</td><td>jane@example.com</td><td>Pending</td></tr>
  </tbody>
</table>
```

Generated screen reader text:
```
Table: Client List. 3 columns, 2 rows. Columns: Name, Email, Status.
```

### Funky.Table Summary

For a Funky.Table showing page 1 of 5:
```
Showing 1 to 10 of 45 entries. Row 1: Name: John, Email: john@example.com, Status: Active. Row 2: Name: Jane, Email: jane@example.com, Status: Pending. ...
```

### Nested List Summary

For a list like:
```html
<ul>
  <li>Dashboard</li>
  <li>Clients
    <ul>
      <li>Active Clients</li>
      <li>Archived Clients</li>
    </ul>
  </li>
  <li>Settings</li>
</ul>
```

Generated screen reader text:
```
List with 3 items:
• Dashboard
• Clients
  ◦ Active Clients
  ◦ Archived Clients
• Settings
```

### Ordered List Summary

For an ordered list:
```html
<ol>
  <li>First step</li>
  <li>Second step
    <ol>
      <li>Sub-step A</li>
      <li>Sub-step B</li>
    </ol>
  </li>
</ol>
```

Generated screen reader text:
```
Ordered list with 2 items:
1. First step
2. Second step
  1. Sub-step A
  2. Sub-step B
```

## Excluding Elements

Use `data-a11y-skip` to exclude specific elements:

```html
<main data-a11y-scope>
  <!-- This table will be enhanced -->
  <table>...</table>
  
  <!-- This table will NOT be enhanced -->
  <table data-a11y-skip>...</table>
</main>
```

## Funky.Table Integration

The enhancer automatically listens for Funky.Table `draw.dt` events when jQuery is available. Each time the table redraws (pagination, filtering, sorting), the screen reader live region updates with the visible row content.

```javascript
// Tables are enhanced automatically
new Funky.Table('#myTable', {
    serverSide: true,
    // ... options
});

// The enhancer hooks into draw.dt events automatically
```

## CSS Requirements

The enhancer uses the `.visually-hidden` class. Ensure your CSS includes:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

This class is already included in `themes.css`.

## Events

The enhancer listens for:

| Event | Source | Action |
|-------|--------|--------|
| `DOMContentLoaded` | Document | Initial enhancement |
| `spa:pageload` | Funky SPA | Re-enhance after navigation |
| `draw.dt` | Funky.Table | Update table live region |

## Best Practices

1. **Place `data-a11y-scope` on `<main>`** - Covers main content area without affecting header/footer navigation
2. **Use `data-a11y-skip` sparingly** - Only for decorative or redundant tables/lists
3. **Test with actual screen readers** - Verify output is useful and not too verbose
4. **Consider user preferences** - Offer a toggle for users with capable screen readers

## Browser Support

- All modern browsers
- Requires `MutationObserver` (IE11+)
- jQuery required for Funky.Table integration only
