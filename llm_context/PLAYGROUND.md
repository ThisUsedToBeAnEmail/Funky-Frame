# Funky Playground - Component Documentation Guide

## Overview

The Funky Playground is an interactive component testing environment that consists of:

1. **Main Controller** (`js/components/playground.js`) - Manages component registry, props editing, and iframe communication
2. **Canvas Iframe** (`playground/canvas/index.html`) - Isolated rendering environment with all CSS/JS loaded
3. **Component Demos** (`playground/components/{name}/index.html`) - Individual component demo pages

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  playground/index.html (Main UI)                                │
│  ┌──────────────┐  ┌────────────────────────────────────────┐   │
│  │  SideNav     │  │  Playground Container                  │   │
│  │  Component   │  │  ┌──────────────────────────────────┐  │   │
│  │  List        │  │  │  Canvas Iframe                   │  │   │
│  │              │  │  │  (playground/canvas/index.html)  │  │   │
│  │  - Toast     │  │  │                                  │  │   │
│  │  - Modal     │  │  │  Loads component demo:           │  │   │
│  │  - Charts    │  │  │  components/{name}/index.html    │  │   │
│  │  ...         │  │  └──────────────────────────────────┘  │   │
│  └──────────────┘  │  ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │
│                    │  │ Props   │ │ Code    │ │ Events   │  │   │
│                    │  │ Editor  │ │ Preview │ │ Log      │  │   │
│                    │  └─────────┘ └─────────┘ └──────────┘  │   │
│                    └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Creating a New Playground Component

### Step 1: Add Entry to COMPONENTS Registry

In `js/components/playground.js`, add to the `COMPONENTS` object:

```javascript
var COMPONENTS = {
    // ... existing components ...
    
    MyComponent: {
        name: 'MyComponent',                    // Display name
        icon: 'fa-icon-name',                   // FontAwesome icon (without 'fas')
        description: 'Brief description',       // Shows in playground header
        category: 'Data',                       // Optional: for grouping
        
        // Default prop values
        defaultProps: {
            title: 'Default Title',
            size: 'md',
            enabled: true,
            count: 5
        },
        
        // Props editor schema
        propsSchema: {
            title: { type: 'string', label: 'Title' },
            size: { 
                type: 'select', 
                label: 'Size', 
                options: ['sm', 'md', 'lg'] 
            },
            enabled: { type: 'boolean', label: 'Enabled' },
            count: { 
                type: 'number', 
                label: 'Count', 
                min: 0, 
                max: 100 
            }
        },
        
        // Generate code example based on current props
        initCode: function(props) {
            return "// Initialize MyComponent\n" +
                "Funky.MyComponent.init('#container', {\n" +
                "  title: '" + props.title + "',\n" +
                "  size: '" + props.size + "',\n" +
                "  enabled: " + props.enabled + "\n" +
                "});";
        }
    }
};
```

### Step 2: Create Demo HTML Page

Create `playground/components/my-component/index.html`:

```html
<div data-page="component-my-component" class="component-demo">
  <h2>My Component</h2>
  <p class="text-muted">Description of what this component does.</p>

  <section class="demo-section" aria-labelledby="basic-heading">
    <h3 id="basic-heading">Basic Usage</h3>
    <p class="text-muted small">Helper text explaining this demo.</p>
    <div class="demo-area">
      <!-- Interactive demo elements -->
      <div id="my-component-container"></div>
      <button class="btn btn-primary" id="demo-trigger">
        <i class="fas fa-play me-1" aria-hidden="true"></i> Run Demo
      </button>
    </div>
  </section>

  <section class="demo-section" aria-labelledby="events-heading">
    <h3 id="events-heading">Event Log</h3>
    <div class="demo-area">
      <pre id="event-log" class="demo-log" aria-live="polite">Events will appear here...</pre>
    </div>
  </section>
</div>

<script>
(function() {
  // Playground communication helpers
  var emit = window.PlaygroundCanvas ? window.PlaygroundCanvas.emit : function() {};
  var getProps = window.PlaygroundCanvas ? window.PlaygroundCanvas.getProps : function() { return {}; };
  
  var logs = [];
  
  function log(message) {
    logs.unshift(new Date().toLocaleTimeString() + ' - ' + message);
    if (logs.length > 10) logs.pop();
    var logEl = document.getElementById('event-log');
    if (logEl) logEl.textContent = logs.join('\n');
  }

  // Register with Funky.Pages for SPA integration
  Funky.Pages.register('component-my-component', {
    init: function(state) {
      var props = getProps();
      log('Initialized with props: ' + JSON.stringify(props));
      
      // Emit event back to playground
      emit('event', { 
        event: 'mycomponent:init', 
        payload: props 
      });

      // Demo button handler
      document.getElementById('demo-trigger').onclick = function() {
        var currentProps = getProps();
        
        // Initialize the actual component
        Funky.MyComponent.init('#my-component-container', {
          title: currentProps.title || 'Demo',
          size: currentProps.size || 'md'
        });
        
        log('Component created');
        emit('event', { 
          event: 'mycomponent:created', 
          payload: currentProps 
        });
      };
    },
    
    destroy: function() {
      // Cleanup when navigating away
      logs = [];
      // Destroy component instance if needed
      return {};
    }
  });
})();
</script>
```

### Step 3: Props Schema Types

Available schema types for `propsSchema`:

| Type | Input Element | Properties |
|------|---------------|------------|
| `string` / `text` | `<input type="text">` | - |
| `number` | `<input type="number">` | `min`, `max` |
| `boolean` / `checkbox` | `<input type="checkbox">` | - |
| `select` | `<select>` | `options: ['a', 'b']` or `options: [{value: 'a', label: 'A'}]` |
| `textarea` | `<textarea>` | - |
| `json` | `<textarea>` | Parsed as JSON |
| `color` / `colour` | `<input type="color">` | - |

### Conditional Visibility

Show/hide props based on other prop values:

```javascript
propsSchema: {
    mode: { 
        type: 'select', 
        label: 'Mode', 
        options: ['simple', 'advanced'] 
    },
    advancedOption: { 
        type: 'string', 
        label: 'Advanced Option',
        visibleWhen: { mode: ['advanced'] }  // Only show when mode is 'advanced'
    }
}
```

## Canvas Communication API

The demo pages communicate with the playground via `postMessage`:

### From Demo to Playground

```javascript
// Get current props from playground panel
var props = window.PlaygroundCanvas.getProps();

// Emit event to playground's event log
window.PlaygroundCanvas.emit('event', {
    event: 'component:action',
    payload: { key: 'value' }
});
```

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `ready` | Canvas → Playground | Canvas iframe loaded |
| `props` | Playground → Canvas | Updated props from editor |
| `event` | Canvas → Playground | Log component event |
| `theme` | Playground → Canvas | Theme change (dark/light) |
| `navigate` | Playground → Canvas | Load component demo |

## File Structure

```
playground/
├── index.html              # Main playground page (with sidenav, props panel)
├── canvas/
│   └── index.html          # Iframe canvas (loads all CSS/JS)
├── components/
│   ├── toast/
│   │   └── index.html      # Toast demo page
│   ├── modal/
│   │   └── index.html      # Modal demo page
│   ├── my-component/
│   │   └── index.html      # Your new component demo
│   └── ...
└── pages/
    └── ...                  # Additional non-component pages
```

## Demo Page Patterns

### Button Grid for Actions
```html
<div class="demo-area" role="group" aria-label="Action buttons">
  <button class="btn btn-primary" id="action-1">Action 1</button>
  <button class="btn btn-secondary" id="action-2">Action 2</button>
</div>
```

### State Display Panel
```html
<div class="demo-area">
  <div class="demo-state">
    <span class="demo-state__label">Current State:</span>
    <span class="demo-state__value" id="state-display">idle</span>
  </div>
</div>
```

### Live Preview Container
```html
<div class="demo-area">
  <div id="component-preview" style="min-height: 200px;">
    <!-- Component renders here -->
  </div>
</div>
```

## Best Practices

1. **Always use `getProps()`** - Get current props before each action, not just on init
2. **Emit meaningful events** - Use descriptive event names like `component:action`
3. **Include event log** - Add a log section to show component activity
4. **Clean up on destroy** - Return empty state or cleanup data
5. **Use semantic HTML** - Include `aria-*` attributes for accessibility
6. **Show multiple demos** - Include basic, advanced, and edge case sections
7. **Document in initCode** - The code example should be copy-pasteable

## Example: Complete Minimal Component

```javascript
// In playground.js COMPONENTS registry:
SimpleButton: {
    name: 'SimpleButton',
    icon: 'fa-square',
    description: 'A simple button component',
    defaultProps: {
        label: 'Click Me',
        variant: 'primary',
        disabled: false
    },
    propsSchema: {
        label: { type: 'string', label: 'Button Label' },
        variant: { 
            type: 'select', 
            label: 'Variant', 
            options: ['primary', 'secondary', 'danger'] 
        },
        disabled: { type: 'boolean', label: 'Disabled' }
    },
    initCode: function(props) {
        return "// Create a button\n" +
            "Funky.SimpleButton.create({\n" +
            "  label: '" + props.label + "',\n" +
            "  variant: '" + props.variant + "',\n" +
            "  disabled: " + props.disabled + ",\n" +
            "  onClick: function() { console.log('clicked'); }\n" +
            "});";
    }
}
```

```html
<!-- playground/components/simple-button/index.html -->
<div data-page="component-simple-button" class="component-demo">
  <h2>Simple Button</h2>
  <p class="text-muted">A simple button component.</p>

  <section class="demo-section">
    <h3>Preview</h3>
    <div class="demo-area">
      <div id="button-container"></div>
    </div>
  </section>
</div>

<script>
(function() {
  var getProps = window.PlaygroundCanvas ? window.PlaygroundCanvas.getProps : function() { return {}; };
  var emit = window.PlaygroundCanvas ? window.PlaygroundCanvas.emit : function() {};

  Funky.Pages.register('component-simple-button', {
    init: function() {
      var props = getProps();
      var container = document.getElementById('button-container');
      
      var btn = document.createElement('button');
      btn.className = 'btn btn-' + (props.variant || 'primary');
      btn.textContent = props.label || 'Click Me';
      btn.disabled = props.disabled || false;
      btn.onclick = function() {
        emit('event', { event: 'button:click', payload: { label: props.label } });
      };
      
      container.appendChild(btn);
    },
    destroy: function() {
      document.getElementById('button-container').innerHTML = '';
      return {};
    }
  });
})();
</script>
```
