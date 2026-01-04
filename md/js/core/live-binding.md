# Funky.LiveBinding

Reactive data binding component that automatically updates DOM elements and Funky components when data changes from various sources.

## Overview

LiveBinding provides automatic synchronisation between data sources and the UI:

- **Multiple Data Sources**: Cache, WebSocket, Events, API, Computed
- **Element Binding**: Bind data to any DOM element with templates
- **Component Binding**: Bind directly to Funky.Table, Forms, Charts, and more
- **Mustache Templates**: With conditionals, loops, and formatters
- **Declarative API**: Use data attributes for simple bindings
- **Streaming Support**: Append/prepend with max items limit
- **Smart Updates**: Diff-based updates for Funky.Table
- **Two-way Binding**: Forms can sync changes back to source
- **Loading States**: Integration with Skeleton and Spinner
- **SPA Ready**: Auto-cleanup on navigation

## Quick Start

### Element Binding

```javascript
// Bind to an event stream
Funky.LiveBinding.bind('#notifications', {
  source: 'event',
  event: 'funky:notification:new',
  append: true,
  max: 10,
  template: '<div class="alert">{{message}}</div>'
});

// Emit an event to trigger update
Funky.PubSub.emit('funky:notification:new', {
  message: 'New trade executed!'
});
```

### Declarative Binding

```html
<!-- Simple value binding -->
<span data-live-bind="event:status" 
      data-live-template="Status: {{status}}">
</span>

<!-- Streaming list with max items -->
<ul data-live-bind="event:activity" 
    data-live-append
    data-live-max="10"
    data-live-template="<li>{{user}}: {{action}}</li>">
</ul>
```

### Component Binding

```javascript
// Bind a Funky.Table to real-time events
Funky.LiveBinding.bindComponent('#trade-table', {
  source: 'event',
  event: 'funky:trades:update'
});

// Form with two-way binding
Funky.LiveBinding.bindComponent('#settings-form', {
  source: 'cache',
  entity: 'userSettings',
  twoWay: true,
  onInput: function(field, value) {
    var settings = Funky.Cache.get('userSettings') || {};
    settings[field] = value;
    Funky.Cache.set('userSettings', settings);
  }
});
```

---

## API Reference

### `Funky.LiveBinding.bind(selector, options)`

Create a binding between a data source and DOM element.

**Parameters:**
- `selector` (string|HTMLElement) - Target element or CSS selector
- `options` (Object) - Binding configuration

**Returns:** Binding instance or null

**Example:**
```javascript
var binding = Funky.LiveBinding.bind('#price-display', {
  source: 'event',
  event: 'funky:price:update',
  template: 'Price: {{value|currency}}'
});
```

---

### `Funky.LiveBinding.bindComponent(selector, options)`

Bind a data source directly to a Funky component.

**Parameters:**
- `selector` (string|HTMLElement) - Component element or selector
- `options` (Object) - Binding options (same as `bind()` plus component-specific)

**Supported Components:**
- Any component implementing the Bindable Interface (`setData()`, `getData()`, etc.)
- Funky.Table (with smart update support)
- Forms (with two-way binding)

**Example:**
```javascript
var binding = Funky.LiveBinding.bindComponent('#my-table', {
  source: 'event',
  event: 'funky:data:update',
  smartUpdate: true,
  keyField: 'id'
});
```

---

### `Funky.LiveBinding.init([scope])`

Initialise all declarative bindings in a container.

**Parameters:**
- `scope` (string|HTMLElement) - Optional container scope (default: document)

**Example:**
```javascript
// Initialise all bindings on page
Funky.LiveBinding.init();

// Initialise within specific container
Funky.LiveBinding.init('#my-section');
```

---

### `Funky.LiveBinding.destroyAll(container)`

Destroy all bindings within a container.

**Parameters:**
- `container` (string|HTMLElement) - Container element

**Example:**
```javascript
Funky.LiveBinding.destroyAll('#my-section');
```

---

### `Funky.LiveBinding.pause()`

Pause all bindings globally.

```javascript
Funky.LiveBinding.pause();
```

---

### `Funky.LiveBinding.resume()`

Resume all bindings globally.

```javascript
Funky.LiveBinding.resume();
```

---

## Binding Options

### General Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | string | `'cache'` | Data source: `cache`, `websocket`, `event`, `api`, `computed` |
| `template` | string | null | Mustache-style template |
| `transform` | function | null | Transform data before rendering |
| `render` | function | null | Custom render function |
| `debounce` | number | 0 | Debounce updates (ms) |
| `append` | boolean | false | Append new data instead of replace |
| `prepend` | boolean | false | Prepend when appending |
| `max` | number | 0 | Max items when appending (0 = unlimited) |
| `showLoading` | boolean | true | Show loading state |
| `loadingContent` | string | null | Custom loading HTML |
| `loadingSkeleton` | object | null | Skeleton options |
| `fallback` | string | `''` | Fallback content when no data |
| `errorContent` | string | null | Error state HTML |
| `onUpdate` | function | null | Callback on update |
| `onError` | function | null | Callback on error |
| `announce` | boolean | false | Announce updates to screen readers |
| `announceMessage` | string/function | null | Custom announcement message or function(data) |

---

### Source-Specific Options

#### Cache Source

| Option | Type | Description |
|--------|------|-------------|
| `entity` | string | Cache key name |
| `property` | string | Nested property path |
| `interval` | number | Polling interval (ms) |

```javascript
Funky.LiveBinding.bind('#user-name', {
  source: 'cache',
  entity: 'user',
  property: 'name',
  template: 'Hello, {{.}}!'
});
```

#### WebSocket Source

| Option | Type | Description |
|--------|------|-------------|
| `channel` | string | Channel to subscribe |
| `key` | string | Filter by key in messages |
| `buffer` | number | Buffer rapid updates (ms) |

```javascript
Funky.LiveBinding.bind('#price', {
  source: 'websocket',
  channel: 'prices',
  key: 'GBPUSD',
  template: '{{pair}}: {{price|currency}}'
});
```

#### Event Source

| Option | Type | Description |
|--------|------|-------------|
| `event` | string | Event name to listen |
| `initial` | any | Initial value before first event |

```javascript
Funky.LiveBinding.bind('#status', {
  source: 'event',
  event: 'funky:status:change',
  initial: { status: 'Loading...' },
  template: 'Status: {{status}}'
});
```

#### API Source

| Option | Type | Description |
|--------|------|-------------|
| `url` | string | API endpoint |
| `method` | string | HTTP method (default: GET) |
| `headers` | object | Request headers |
| `query` | object | Query parameters |
| `body` | any | Request body |
| `interval` | number | Polling interval (ms) |
| `maxRetries` | number | Max retry attempts (default: 3) |

```javascript
Funky.LiveBinding.bind('#data', {
  source: 'api',
  url: '/api/stats',
  interval: 30000,
  template: 'Users: {{users}}, Trades: {{trades}}'
});
```

#### Computed Source

| Option | Type | Description |
|--------|------|-------------|
| `sources` | array | Array of source configs with `as` key |
| `compute` | function | Function to combine values |

```javascript
Funky.LiveBinding.bind('#summary', {
  source: 'computed',
  sources: [
    { source: 'cache', entity: 'trades', as: 'trades' },
    { source: 'cache', entity: 'users', as: 'users' }
  ],
  compute: function(values) {
    return {
      total: values.trades.length,
      average: values.trades.length / values.users.length
    };
  },
  template: 'Total: {{total}}, Avg per user: {{average|number:2}}'
});
```

---

## Binding Instance Methods

```javascript
var binding = Funky.LiveBinding.bind('#element', options);

// Manual refresh
binding.refresh();

// Pause updates
binding.pause();

// Resume updates
binding.resume();

// Destroy binding
binding.destroy();

// Access current data
console.log(binding.data);
```

---

## Template Syntax

LiveBinding uses a Mustache-style template engine with enhanced features.

### Variables

```handlebars
{{name}}           <!-- Escaped output -->
{{{rawHtml}}}      <!-- Unescaped HTML -->
{{&rawHtml}}       <!-- Unescaped HTML (alternative) -->
{{user.email}}     <!-- Nested property -->
{{.}}              <!-- Current value (for simple values) -->
```

### Sections (Loops & Conditionals)

```handlebars
<!-- Loop over array -->
{{#items}}
  <li>{{name}} - £{{price|number:2}}</li>
{{/items}}

<!-- Conditional (truthy) -->
{{#isActive}}
  <span class="badge bg-success">Active</span>
{{/isActive}}

<!-- Inverted (falsy or empty) -->
{{^items}}
  <p>No items found</p>
{{/items}}
```

### Loop Context

```handlebars
{{#items}}
  {{@index}}  <!-- 0-based index -->
  {{@first}}  <!-- true if first item -->
  {{@last}}   <!-- true if last item -->
  {{@odd}}    <!-- true if odd index -->
  {{@even}}   <!-- true if even index -->
{{/items}}
```

### Built-in Formatters

#### String Formatters

| Formatter | Example | Output |
|-----------|---------|--------|
| `upper` | `{{name\|upper}}` | `JOHN` |
| `lower` | `{{name\|lower}}` | `john` |
| `capitalize` | `{{name\|capitalize}}` | `John` |
| `trim` | `{{text\|trim}}` | Trimmed string |
| `truncate:n` | `{{text\|truncate:50}}` | `Lorem ipsum...` |

#### Number Formatters

| Formatter | Example | Output |
|-----------|---------|--------|
| `number` | `{{amount\|number}}` | `1,234` |
| `number:n` | `{{price\|number:2}}` | `1234.56` |
| `currency` | `{{price\|currency}}` | `£1,234.56` |
| `currency:$` | `{{price\|currency:$}}` | `$1,234.56` |
| `percent` | `{{ratio\|percent}}` | `45%` |
| `round` | `{{value\|round}}` | `1235` |

#### Date Formatters

| Formatter | Example | Output |
|-----------|---------|--------|
| `date` | `{{created\|date}}` | `14/01/2025` |
| `time` | `{{created\|time}}` | `14:30:00` |
| `relative` | `{{updated\|relative}}` | `5m ago` |

#### Utility Formatters

| Formatter | Example | Output |
|-----------|---------|--------|
| `default:val` | `{{value\|default:N/A}}` | `N/A` if empty |
| `join:sep` | `{{tags\|join:, }}` | `tag1, tag2, tag3` |
| `pluralize:word` | `{{count\|pluralize:item}}` | `items` or `item` |
| `json` | `{{obj\|json}}` | JSON string |
| `ifTruthy:yes:no` | `{{active\|ifTruthy:Yes:No}}` | `Yes` or `No` |

### Chaining Formatters

```handlebars
{{name|trim|upper}}
{{price|number:2|currency:€}}
```

### Partials

```javascript
// Register a partial
Funky.LiveBinding.Template.registerPartial('userCard', `
  <div class="card">
    <h5>{{name}}</h5>
    <p>{{email}}</p>
  </div>
`);
```

```handlebars
<!-- Use partial -->
{{>userCard}}
```

### Custom Formatters

```javascript
Funky.LiveBinding.Template.registerFormatter('reverse', function(value) {
  return String(value).split('').reverse().join('');
});

// Usage: {{text|reverse}}
```

---

## Data Attributes (Declarative)

| Attribute | Description |
|-----------|-------------|
| `data-live-bind` | Binding spec: `source:param1:param2` |
| `data-live-template` | Template string |
| `data-live-query` | JSON query params |
| `data-live-interval` | Polling interval (ms) |
| `data-live-debounce` | Debounce (ms) |
| `data-live-append` | Enable append mode |
| `data-live-prepend` | Prepend new items |
| `data-live-max` | Max items |
| `data-live-fallback` | Fallback content |

**Example:**
```html
<div data-live-bind="event:notifications"
     data-live-template="<div class='alert'>{{message}}</div>"
     data-live-append
     data-live-prepend
     data-live-max="5"
     data-live-fallback="No notifications">
</div>
```

---

## CSS Classes

| Class | Description |
|-------|-------------|
| `.live-binding-loading` | Applied during loading |
| `.live-binding-error` | Applied on error |
| `.live-binding-updated` | Applied briefly on update (for animations) |
| `.live-row-updated` | Table row was updated |
| `.live-row-added` | Table row was added |
| `.live-row-removing` | Table row being removed |
| `.live-value-up` | Value increased |
| `.live-value-down` | Value decreased |
| `.badge-pulse` | Badge update animation |

---

## Creating Custom Components with LiveBinding

This section explains how to create your own component that works seamlessly with LiveBinding.

### The Bindable Interface

For a component to work with `Funky.LiveBinding.bindComponent()`, it must implement the **Bindable Interface**:

| Method | Required | Description |
|--------|----------|-------------|
| `setData(data)` | ✅ Yes | Set/replace all data |
| `getData()` | Recommended | Get current data |
| `addData(data)` | Optional | Append data (for streaming) |
| `removeData(keys)` | Optional | Remove data by keys |
| `clearData()` | Optional | Clear all data |

### Step 1: Create the Component Structure

```javascript
(function(window) {
  'use strict';
  
  var Funky = window.Funky;
  
  // Guard against missing registry
  if (!Funky || !Funky.register) {
    console.error('[Funky.MyComponent] Registry not found');
    return;
  }

  /**
   * MyComponent - A simple list component
   */
  function MyComponent(container, options) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    this.options = Object.assign({}, MyComponent.defaults, options);
    this.data = [];
    
    // Register instance for LiveBinding discovery
    var id = this.container.id;
    if (id) {
      MyComponent._instances[id] = this;
    }
    
    this._init();
  }

  // Default options
  MyComponent.defaults = {
    itemTemplate: '<li>{{name}}</li>',
    emptyMessage: 'No items'
  };

  // Instance registry (required for LiveBinding)
  MyComponent._instances = {};

  /**
   * Initialize the component
   */
  MyComponent.prototype._init = function() {
    this._render();
  };

  /**
   * Render the component
   */
  MyComponent.prototype._render = function() {
    if (this.data.length === 0) {
      this.container.innerHTML = '<p class="text-muted">' + 
        this.options.emptyMessage + '</p>';
      return;
    }
    
    var html = '<ul class="list-group">';
    var template = this.options.itemTemplate;
    
    this.data.forEach(function(item) {
      // Simple template replacement
      var itemHtml = template.replace(/\{\{(\w+)\}\}/g, function(match, key) {
        return item[key] !== undefined ? item[key] : '';
      });
      html += itemHtml;
    });
    
    html += '</ul>';
    this.container.innerHTML = html;
  };

  // =========================================================================
  // BINDABLE INTERFACE IMPLEMENTATION
  // =========================================================================

  /**
   * Set/replace all data (REQUIRED)
   * @param {Array} data - New data array
   */
  MyComponent.prototype.setData = function(data) {
    this.data = Array.isArray(data) ? data : [];
    this._render();
  };

  /**
   * Get current data (RECOMMENDED)
   * @returns {Array}
   */
  MyComponent.prototype.getData = function() {
    return this.data;
  };

  /**
   * Add/append data (OPTIONAL - for streaming)
   * @param {Array|Object} newData - Data to add
   */
  MyComponent.prototype.addData = function(newData) {
    var items = Array.isArray(newData) ? newData : [newData];
    this.data = this.data.concat(items);
    this._render();
  };

  /**
   * Remove data by keys (OPTIONAL)
   * @param {Array} keys - Keys to remove
   */
  MyComponent.prototype.removeData = function(keys) {
    var keySet = new Set(Array.isArray(keys) ? keys : [keys]);
    this.data = this.data.filter(function(item) {
      return !keySet.has(item.id);
    });
    this._render();
  };

  /**
   * Clear all data (OPTIONAL)
   */
  MyComponent.prototype.clearData = function() {
    this.data = [];
    this._render();
  };

  /**
   * Destroy the component
   */
  MyComponent.prototype.destroy = function() {
    var id = this.container.id;
    if (id && MyComponent._instances[id]) {
      delete MyComponent._instances[id];
    }
    this.container.innerHTML = '';
  };

  // Register with Funky
  Funky.register('MyComponent', MyComponent);

})(window);
```

### Step 2: Register with LiveBinding (Optional)

If your component name isn't in the default registry list, register it:

```javascript
// Register a single component registry
Funky.LiveBinding.registerRegistry('MyComponent');

// Or register multiple at once
Funky.LiveBinding.registerRegistries(['MyComponent', 'MyOtherComponent']);
```

### Step 3: Use with LiveBinding

Now your component works with LiveBinding:

```html
<div id="my-list"></div>

<script>
// Create the component
var myList = new Funky.MyComponent('#my-list', {
  itemTemplate: '<li class="list-group-item">{{name}} - {{status}}</li>'
});

// Bind to event source
Funky.LiveBinding.bindComponent('#my-list', {
  source: 'event',
  event: 'funky:items:update'
});

// Emit data to update the component
Funky.PubSub.emit('funky:items:update', [
  { id: 1, name: 'Item 1', status: 'Active' },
  { id: 2, name: 'Item 2', status: 'Pending' }
]);

// Append new items
Funky.PubSub.emit('funky:items:update', { id: 3, name: 'Item 3', status: 'New' });
</script>
```

### Built-in Component Adapters

LiveBinding includes specialized adapters for common components:

| Adapter | Description |
|---------|-------------|
| `table-smart` | Diff-based row updates for Funky.Table |
| `form-twoway` | Two-way binding for forms with input change tracking |

Use with the `adapter` option:
```javascript
Funky.LiveBinding.bindComponent('#my-table', {
  source: 'event',
  event: 'funky:data:update',
  adapter: 'table-smart',
  smartUpdate: true,
  keyField: 'id'
});
```

### Step 4: Register a Custom Component Adapter (Advanced)

For specialised binding behaviour, register a custom adapter:

```javascript
Funky.LiveBinding.registerComponent('mycomponent-smart', {
  // Check if this adapter supports the element
  supports: function(element) {
    return element.id && Funky.MyComponent._instances[element.id];
  },
  
  // Create the binding adapter
  bind: function(element, options) {
    var instance = Funky.MyComponent._instances[element.id];
    var keyField = options.keyField || 'id';
    
    return {
      // Called when new data arrives
      update: function(data) {
        if (options.smartUpdate) {
          // Implement smart/diff update logic
          instance.setData(data);
        } else {
          instance.setData(data);
        }
      },
      
      // Called in append mode
      append: function(data) {
        instance.addData(data);
      },
      
      // Get current data
      getData: function() {
        return instance.getData();
      },
      
      // Get component instance
      getInstance: function() {
        return instance;
      },
      
      // Cleanup
      destroy: function() {
        // Custom cleanup if needed
      }
    };
  }
});

// Use with explicit adapter
Funky.LiveBinding.bindComponent('#my-list', {
  source: 'event',
  event: 'funky:items:update',
  adapter: 'mycomponent-smart',
  smartUpdate: true
});
```

---

## Registering Custom Source Adapters

Create custom data sources:

```javascript
Funky.LiveBinding.registerAdapter('localStorage', function(options, onData, onError) {
  var key = options.key;
  
  function getValue() {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {
      return null;
    }
  }
  
  // Listen for storage events (cross-tab sync)
  function handleStorage(e) {
    if (e.key === key) {
      onData(getValue());
    }
  }
  window.addEventListener('storage', handleStorage);
  
  return {
    fetch: function() { 
      onData(getValue()); 
    },
    pause: function() {
      // Optional: pause logic
    },
    resume: function() {
      // Optional: resume logic
    },
    destroy: function() { 
      window.removeEventListener('storage', handleStorage); 
    }
  };
});

// Use custom source
Funky.LiveBinding.bind('#settings', {
  source: 'localStorage',
  key: 'userPrefs',
  template: 'Theme: {{theme}}'
});
```

---

## Best Practices

### 1. Clean Up Bindings

```javascript
// Store reference for cleanup
var binding = Funky.LiveBinding.bind('#element', options);

// Later: destroy when no longer needed
binding.destroy();

// Or destroy all in a container
Funky.LiveBinding.destroyAll('#my-section');
```

### 2. Use Debounce for High-Frequency Updates

```javascript
Funky.LiveBinding.bind('#ticker', {
  source: 'websocket',
  channel: 'prices',
  debounce: 100  // Max 10 updates/second
});
```

### 3. Transform Data at Source

```javascript
Funky.LiveBinding.bind('#display', {
  source: 'api',
  url: '/api/data',
  transform: function(response) {
    return response.data.items.filter(function(item) {
      return item.active;
    });
  }
});
```

### 4. Use Smart Updates for Tables

```javascript
Funky.LiveBinding.bindComponent('#table', {
  source: 'websocket',
  channel: 'data',
  keyField: 'id',      // Required for smart updates
  smartUpdate: true    // Only update changed rows
});
```

### 5. Handle Loading States

```javascript
Funky.LiveBinding.bind('#content', {
  source: 'api',
  url: '/api/slow-data',
  showLoading: true,
  loadingSkeleton: { type: 'card', lines: 3 }
});
```

---

## Troubleshooting

### Binding Not Updating

1. Check source is configured correctly
2. Verify event/channel names match exactly
3. Check for errors in browser console
4. Ensure element exists in DOM before binding

### Memory Leaks

1. Always call `destroy()` when removing bound elements
2. Use `destroyAll()` on SPA navigation
3. LiveBinding auto-cleans on `funky:spa:before-navigate` PubSub events

### Template Not Rendering

1. Check template syntax (matching `{{#...}}{{/...}}`)
2. Verify data structure matches template paths
3. Check formatter names for typos

### Component Not Found

1. Ensure component has an `id` attribute
2. Verify component registers in `_instances` object
3. Check registry is added via `registerRegistry()`

---

## SPA Integration

LiveBinding automatically cleans up on SPA navigation:

```javascript
// Auto-cleanup on navigation (built-in)
Funky.PubSub.on('funky:spa:before-navigate', function() {
  Funky.LiveBinding.destroyAll(document.getElementById('content'));
});
```

Bindings are also paused when the page is hidden and resumed when visible.

---

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>LiveBinding Demo</title>
  <link href="/assets/css/app.min.css" rel="stylesheet">
</head>
<body>
  <div class="container mt-4">
    <h1>Live Activity Feed</h1>
    
    <!-- Declarative binding -->
    <div id="activity-feed"
         data-live-bind="event:funky:activity:new"
         data-live-template="<div class='alert alert-info'>{{user}} {{action}} at {{time|relative}}</div>"
         data-live-append
         data-live-prepend
         data-live-max="10"
         data-live-fallback="<p class='text-muted'>No activity yet...</p>">
    </div>
    
    <!-- Controls -->
    <div class="mt-3">
      <button class="btn btn-primary" id="emit-btn">Simulate Activity</button>
      <button class="btn btn-secondary" id="pause-btn">Pause</button>
    </div>
  </div>
  
  <script src="/assets/js/app.min.js"></script>
  <script>
    // Initialise declarative bindings
    Funky.LiveBinding.init();
    
    // Get binding instance for control
    var feedEl = document.getElementById('activity-feed');
    var bindingId = feedEl.getAttribute('data-live-binding-id');
    
    // Simulate activity
    var users = ['Alice', 'Bob', 'Charlie', 'Diana'];
    var actions = ['logged in', 'created a trade', 'updated settings', 'viewed report'];
    
    document.getElementById('emit-btn').onclick = function() {
      Funky.PubSub.emit('funky:activity:new', {
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        time: new Date().toISOString()
      });
    };
    
    // Pause/resume toggle
    var paused = false;
    document.getElementById('pause-btn').onclick = function() {
      paused = !paused;
      if (paused) {
        Funky.LiveBinding.pause();
        this.textContent = 'Resume';
      } else {
        Funky.LiveBinding.resume();
        this.textContent = 'Pause';
      }
    };
  </script>
</body>
</html>
```
