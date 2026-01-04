# Funky Framework Architecture

Funky is a modern JavaScript framework for building rich, interactive web applications. It provides a comprehensive set of UI components, utilities, and patterns that work together seamlessly.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                              │
├─────────────────────────────────────────────────────────────────┤
│  Pages (SPA Modules)  │  Components  │  Custom Code             │
├─────────────────────────────────────────────────────────────────┤
│                    Funky Framework                               │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Funky.Dom  │ Funky.Events │  Funky.Api   │ Funky.Modal  │  │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤  │
│  │  Funky.SPA   │Funky.Storage │Funky.WebSocket│ Funky.Toast │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Browser APIs / DOM                            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Modules

### DOM Manipulation - `Funky.Dom`
Chainable DOM manipulation library that replaces jQuery for most operations.

```javascript
var D = Funky.Dom;
D.create('div')
  .classAdd('card', 'shadow')
  .attr('id', 'myCard')
  .text('Hello World')
  .appendTo(document.body);
```

See: [js/core/dom.md](js/core/dom.md)

### Event System - `Funky.Events`
DOM event handling with delegation and cleanup.

```javascript
var E = Funky.Events;
E.on(document, 'click', '.btn', function(e) {
  console.log('Button clicked:', this);
});
```

See: [js/core/events.md](js/core/events.md)

### Pub/Sub - `Funky.PubSub`
Application-wide event bus for decoupled communication.

```javascript
Funky.PubSub.on('trade:created', function(data) {
  console.log('New trade:', data);
});

Funky.PubSub.emit('trade:created', { id: 123 });
```

See: [js/core/pubsub.md](js/core/pubsub.md)

### API Client - `Funky.Api`
HTTP client with automatic CSRF handling, deduplication, and error handling.

```javascript
Funky.Api.get('/api/clients').then(function(data) {
  console.log('Clients:', data);
});
```

See: [js/core/api.md](js/core/api.md)

### Single Page Application - `Funky.SPA`
Client-side routing and page management.

```javascript
Funky.SPA.registerPage('trades', function() {
  console.log('Trades page loaded');
});
```

See: [js/core/spa.md](js/core/spa.md)

## Component Architecture

All Funky components follow a consistent pattern:

### Factory Pattern

```javascript
// Create component instance
var table = Funky.Table.init('#myTable', {
  ajax: '/api/data',
  columns: [...]
});

// Access methods
table.reload();
table.destroy();
```

### Instance Registry

Components register themselves for access from anywhere:

```javascript
// Get existing instance
var table = Funky.Table._instances['myTable'];
```

### Bindable Interface

Components implement `setData()` and `getData()` for LiveBinding integration:

```javascript
var kanban = Funky.Kanban.init('#board', config);

// Update data reactively
kanban.setData({ columns: [...], cards: [...] });

// Read current state
var state = kanban.getData();
```

### Destroy Pattern

All components support cleanup:

```javascript
table.destroy();
Funky.Table.destroyAll();
```

## File Organization

```
public/assets/js/
├── core/                    # Core framework modules
│   ├── dom.js              # DOM manipulation (Funky.Dom)
│   ├── events.js           # Event handling (Funky.Events)
│   ├── pubsub.js           # Pub/Sub system
│   ├── api.js              # API client
│   ├── spa.js              # SPA router
│   ├── modal.js            # Modal dialogs
│   ├── websocket.js        # WebSocket client
│   └── ...
├── components/              # UI components
│   ├── table.js            # Data tables
│   ├── kanban.js           # Kanban boards
│   ├── accordion.js        # Accordions
│   ├── combobox.js         # Combo boxes
│   └── ...
├── pages/                   # Page-specific modules
│   ├── trades.js
│   ├── clients.js
│   └── ...
└── funky/                   # Framework initialization
    └── funky.js            # Registry & bootstrap
```

## CSS Theming

Funky uses CSS custom properties for theming:

```css
:root {
  --pro-primary: #0d6efd;
  --pro-surface: #ffffff;
  --pro-text: #212529;
}

[data-theme="dark"] {
  --pro-primary: #6ea8fe;
  --pro-surface: #1e1e1e;
  --pro-text: #e0e0e0;
}
```

See: [THEMING.md](THEMING.md)

## ES5 Compatibility

All Funky code follows ES5 standards for maximum browser compatibility:

```javascript
// ✅ Use var, not const/let
var items = [];

// ✅ Use function(), not arrows
items.forEach(function(item) {
  console.log(item);
});

// ✅ Use .then(), not async/await
Funky.Api.get('/api/data').then(function(data) {
  console.log(data);
});
```

## Backend Integration

Funky is backend-agnostic. It communicates via standard REST APIs:

- **GET** - Fetch data
- **POST** - Create resources
- **PUT** - Update resources
- **DELETE** - Remove resources

CSRF protection is handled automatically by `Funky.CSRF` when making requests.

See: [js/core/csrf.md](js/core/csrf.md)

## Related Documentation

- [Components Reference](COMPONENTS.md)
- [Data Tables](FUNKY_TABLE.md)
- [SPA Architecture](SPA_ARCHITECTURE.md)
- [Theming](THEMING.md)
- [Accessibility](accessibility-standards.md)
- [PWA Support](PWA.md)
