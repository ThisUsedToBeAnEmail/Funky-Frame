# Funky.EmptyState - Empty State Placeholder

Theme-aware, density-aware empty state placeholders with presets and optional actions.

## Overview

`Funky.EmptyState` displays "no data" placeholders when content is empty. Supports preset types, custom icons, size variants, and action buttons.

## API Reference

### Methods

#### `EmptyState.show(container, options)`

Show empty state in a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|Element | Yes | CSS selector or DOM element |
| options | object | No | Configuration options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | null | Preset type name |
| icon | string | 'fa-inbox' | FontAwesome class or image URL |
| title | string | 'No data' | Title text |
| message | string | '' | Description text |
| size | string | 'md' | Size: 'sm', 'md', 'lg' |
| variant | string | null | Color: 'primary', 'success', 'warning', 'danger', 'info' |
| animate | boolean | true | Enable fade-in animation |
| className | string | '' | Additional CSS classes |
| action | object | null | Primary action button config |
| secondaryAction | object | null | Secondary action link config |

**Action Object:**
| Name | Type | Description |
|------|------|-------------|
| text | string | Button text |
| icon | string | FontAwesome icon class |
| variant | string | Bootstrap button variant |
| onClick | function | Click handler |

**Secondary Action Object:**
| Name | Type | Description |
|------|------|-------------|
| text | string | Link text |
| href | string | URL (creates anchor) |
| onClick | function | Click handler (creates button) |

**Returns:** Instance object with `id`, `element`, `options`, `destroy()`.

---

#### `EmptyState.hide(container)`

Hide/remove empty state from container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|Element | Yes | CSS selector or DOM element |

---

#### `EmptyState.isShowing(container)`

Check if empty state is displayed in container.

**Returns:** `boolean`

---

#### `EmptyState.html(options)`

Generate empty state HTML string for manual insertion.

**Returns:** `string` - HTML markup

---

#### `EmptyState.registerPreset(name, config)`

Register a custom preset type.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Preset identifier |
| config | object | Yes | Preset configuration (icon, title, message, variant) |

---

#### `EmptyState.getPresets()`

Get all available preset definitions.

**Returns:** `object` - Preset configurations

---

#### `EmptyState.getPresetNames()`

Get array of preset type names.

**Returns:** `string[]` - Preset names

## Preset Types

| Type | Icon | Title | Variant |
|------|------|-------|---------|
| `no-results` | fa-search | No results found | - |
| `no-data` | fa-inbox | No data yet | - |
| `error` | fa-exclamation-triangle | Something went wrong | danger |
| `offline` | fa-wifi-slash | You're offline | warning |
| `empty-list` | fa-list | Nothing here yet | - |
| `empty-table` | fa-table | No records | - |
| `access-denied` | fa-lock | Access denied | danger |
| `coming-soon` | fa-rocket | Coming soon | info |

## Size Variants

| Size | Icon | Title | Padding | Use Case |
|------|------|-------|---------|----------|
| `sm` | 1.5rem | 0.875rem | 1rem | Inline, small containers |
| `md` | 2.5rem | 1.125rem | 2rem | Default, cards |
| `lg` | 4rem | 1.5rem | 3rem | Full page |

## Usage Examples

### Basic Preset

```javascript
// Show preset empty state
Funky.EmptyState.show('#results', { type: 'no-results' });

// Hide when data loads
Funky.EmptyState.hide('#results');
```

### Custom Empty State

```javascript
Funky.EmptyState.show('#container', {
  icon: 'fa-folder-open',
  title: 'No files',
  message: 'Upload files to get started',
  size: 'lg',
  variant: 'info'
});
```

### With Action Buttons

```javascript
Funky.EmptyState.show('#container', {
  type: 'empty-table',
  action: {
    text: 'Create Record',
    icon: 'fa-plus',
    variant: 'primary',
    onClick: function() {
      openCreateModal();
    }
  },
  secondaryAction: {
    text: 'Learn More',
    href: '/docs/records'
  }
});
```

### Custom Preset

```javascript
// Register once at app init
Funky.EmptyState.registerPreset('no-trades', {
  icon: 'fa-exchange-alt',
  title: 'No trades',
  message: 'Create a trade to get started',
  variant: 'primary'
});

// Use anywhere
Funky.EmptyState.show('#tradeList', { type: 'no-trades' });
```

### Funky.Table Integration

```javascript
var table = new Funky.Table('#myTable', {
  language: { emptyTable: '' }, // Disable default
  drawCallback: function(settings) {
    var info = this.api().page.info();
    var wrapper = $(this).closest('.dataTables_wrapper');
    var emptyRow = wrapper.find('.dataTables_empty').parent();
    
    if (info.recordsTotal === 0) {
      Funky.EmptyState.show(emptyRow[0], {
        type: 'empty-table',
        size: 'sm',
        action: {
          text: 'Add Record',
          onClick: function() { openCreateModal(); }
        }
      });
    } else {
      Funky.EmptyState.hide(emptyRow[0]);
    }
  }
});
```

### Search Results

```javascript
function handleSearch(query) {
  fetchResults(query).then(function(results) {
    if (results.length === 0) {
      Funky.EmptyState.show('#results', {
        type: 'no-results',
        message: 'Try different search terms',
        secondaryAction: {
          text: 'Clear Filters',
          onClick: clearFilters
        }
      });
    } else {
      Funky.EmptyState.hide('#results');
      renderResults(results);
    }
  });
}
```

### Error Handling

```javascript
function loadData() {
  fetchData()
    .then(renderData)
    .catch(function(error) {
      Funky.EmptyState.show('#content', {
        type: 'error',
        message: error.message || 'Please try again',
        action: {
          text: 'Retry',
          icon: 'fa-redo',
          onClick: loadData
        }
      });
    });
}
```

## Theme Support

- **Light/Dark themes**: Uses `--pro-text-*` and `--pro-accent-*` CSS variables
- **Density modes**: Adjusts padding for compact/comfortable/spacious
- **Even Funkyer**: Gradient text and icon glow effects
- **Reduced motion**: Respects `prefers-reduced-motion` preference

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-empty-state` | Base container |
| `.funky-empty-state-sm` | Small size |
| `.funky-empty-state-md` | Medium size (default) |
| `.funky-empty-state-lg` | Large size |
| `.funky-empty-state-variant-*` | Color variants |
| `.funky-empty-state-icon` | Icon container |
| `.funky-empty-state-title` | Title text |
| `.funky-empty-state-message` | Message text |
| `.funky-empty-state-actions` | Action buttons container |
| `.funky-empty-state-action` | Primary button |
| `.funky-empty-state-secondary` | Secondary link/button |
| `.animate-in` | Fade-in animation |

## Dependencies

None - standalone component.

## Files

- CSS: `public/assets/css/empty-state.css`
- JS: `public/assets/js/components/empty-state.js`

## Bindable Interface (LiveBinding)

EmptyState supports the LiveBinding system for reactive data updates.

### Instance Registry

Instances are stored in the internal registry and can be accessed via:

```javascript
// Access instance by container ID
var instance = Funky.EmptyState._instances[containerId];
```

### Bindable Methods

#### `setData(config)`

Update the empty state configuration and re-render.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| config | object | Empty state configuration (type, icon, title, message, etc.) |

**Example:**
```javascript
// Direct method call
var instance = Funky.EmptyState._instances['resultsContainer'];
instance.setData({
    type: 'no-results',
    title: 'No matches found',
    message: 'Try adjusting your search criteria'
});
```

---

#### `getData()`

Get the current empty state configuration.

**Returns:** `object` - Current configuration

**Example:**
```javascript
var instance = Funky.EmptyState._instances['resultsContainer'];
var config = instance.getData();
console.log(config.type); // 'no-results'
```

### LiveBinding Integration

```javascript
// Bind empty state to loading/error state
Funky.LiveBinding.bind({
    source: { type: 'state', key: 'search.status' },
    target: {
        type: 'component',
        component: 'EmptyState',
        container: '#searchResults',
        method: 'setData'
    },
    transform: function(status) {
        if (status === 'loading') {
            return { type: 'loading', title: 'Searching...', message: 'Please wait' };
        } else if (status === 'error') {
            return { type: 'error', title: 'Search failed', message: 'Please try again' };
        } else if (status === 'empty') {
            return { type: 'no-results', title: 'No results', message: 'Try different terms' };
        }
        return null; // Hide empty state
    }
});
```
