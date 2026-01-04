# Funky.Playground

Interactive component testing environment with props editing and event logging.

## Overview

`Funky.Playground` provides an isolated environment for testing and documenting Funky components. Features include live props editing, event logging, and code generation.

## Quick Start

```javascript
Funky.Playground.init('#playground', {
  component: 'Toast',
  showCode: true,
  showEvents: true
});
```

## API Reference

### Initialization

#### `Funky.Playground.init(container, options)`

Initialize the playground.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| container | string/Element | - | Container element |
| component | string | `null` | Initial component to show |
| showCode | boolean | `true` | Show code panel |
| showEvents | boolean | `true` | Show event log |
| showProps | boolean | `true` | Show props editor |

**Returns:** `Playground` instance

---

### Instance Methods

#### `setComponent(name)`

Switch to a different component.

---

#### `updateProps(props)`

Update component props.

---

#### `execute()`

Re-run the component with current props.

---

#### `clearLog()`

Clear the event log.

---

#### `destroy()`

Clean up the playground.

---

## Built-in Components

The playground includes demos for these components:

| Component | Description |
|-----------|-------------|
| Toast | Toast notifications |
| Charts | Sparkline charts |
| Format | Number formatting |
| StatsBar | Statistics display |
| Modal | Modal dialogs |
| Typewriter | Typewriter effect |
| Clock | Live clock display |

## Props Schema

Each component defines a schema for its props:

```javascript
{
  message: { type: 'string', label: 'Message' },
  type: { type: 'select', label: 'Type', options: ['info', 'success', 'warning', 'error'] },
  duration: { type: 'number', label: 'Duration (ms)', min: 1000, max: 30000 }
}
```

### Schema Types

| Type | Description |
|------|-------------|
| `string` | Text input |
| `number` | Number input with min/max |
| `boolean` | Checkbox |
| `select` | Dropdown with options |
| `json` | JSON editor |
| `color` | Color picker |

## Event Logging

The playground captures and displays:
- PubSub events
- DOM events
- Console output
- Component lifecycle events

```javascript
// Events are displayed in the log panel
[12:34:56] funky:toast:shown { message: "Hello" }
[12:34:58] funky:toast:hidden { id: 1 }
```

## Code Generation

Components generate initialization code:

```javascript
// Generated for Toast component
Funky.Toast.info('This is a toast message');

// Other methods:
// Funky.Toast.success('Operation completed!');
// Funky.Toast.error('Something went wrong');
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.playground` | Main container |
| `.playground__sidebar` | Component selector |
| `.playground__preview` | Component preview area |
| `.playground__props` | Props editor panel |
| `.playground__code` | Code display panel |
| `.playground__events` | Event log panel |

## Adding Custom Components

Register components with the playground:

```javascript
Funky.Playground.register('MyComponent', {
  name: 'MyComponent',
  icon: 'fa-star',
  description: 'My custom component',
  defaultProps: {
    text: 'Hello'
  },
  propsSchema: {
    text: { type: 'string', label: 'Text' }
  },
  initCode: function(props) {
    return 'Funky.MyComponent.init({ text: "' + props.text + '" });';
  },
  render: function(container, props) {
    Funky.MyComponent.init(container, props);
  }
});
```

## File Location

`/public/assets/js/components/playground.js`

## See Also

- [Funky.Diff](diff.md) - Code diff display
- [Component Documentation](../../../COMPONENTS.md) - All components
