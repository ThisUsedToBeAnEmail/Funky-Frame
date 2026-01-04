# Component Base Interface

All Funky components follow a consistent API pattern for predictable usage.

## Standard Static Methods

### `Component.init(selector, options)`

Primary factory method to create component instances.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string\|Element | Yes | CSS selector or DOM element |
| options | object | No | Configuration options |

**Returns:** Component instance

**Example:**
```javascript
var carousel = Funky.Carousel.init('#my-carousel', {
    autoplay: true,
    interval: 5000
});
```

---

### `Component.getInstance(idOrElement)`

Retrieve an existing component instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| idOrElement | string\|Element | Yes | Element ID or DOM element |

**Returns:** Component instance or `null`

**Example:**
```javascript
var carousel = Funky.Carousel.getInstance('my-carousel');
if (carousel) {
    carousel.next();
}
```

---

### `Component.destroy(idOrElement)`

Destroy a component instance by ID or element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| idOrElement | string\|Element | Yes | Element ID or DOM element |

**Example:**
```javascript
Funky.Carousel.destroy('my-carousel');
```

---

### `Component.destroyAll()`

Destroy all instances of a component type. Useful for SPA cleanup.

**Example:**
```javascript
Funky.Carousel.destroyAll();
```

---

## Standard Instance Methods

### `instance.destroy()`

Clean up the component, remove event listeners, and free resources.

**Returns:** `void`

**Example:**
```javascript
carousel.destroy();
```

---

### `instance.refresh()` (if applicable)

Re-render or update the component based on current state/data.

**Returns:** `this` for chaining

**Example:**
```javascript
carousel.refresh();
```

---

### `instance.enable()` / `instance.disable()` (if applicable)

Enable or disable user interaction with the component.

**Returns:** `this` for chaining

**Example:**
```javascript
slider.disable();
// ... later
slider.enable();
```

---

## Visibility Methods

Components use different visibility methods based on their type:

| Component Type | Methods | Example Components |
|---------------|---------|-------------------|
| Overlays/Modals | `open()` / `close()` | WidgetCatalog, ComboBox, SideNav |
| Collapsible Content | `expand()` / `collapse()` | Accordion, TreeView, WidgetPalette |
| Simple Visibility | `show()` / `hide()` | MorphPanel, TypingIndicator, WIPOverlay |
| Media Controls | `play()` / `pause()` | Video |

All visibility methods:
- Return `this` for chaining
- Typically have a `toggle()` convenience method
- Track state via boolean property (`isOpen`, `isVisible`, `isExpanded`)

See [Visibility Conventions](visibility-conventions.md) for details.

---

## Properties

### `instance.id`

Unique identifier for the component instance.

### `instance.options`

Configuration options passed during initialization.

### `instance.element` or `instance.container`

Reference to the root DOM element.

---

## Example Implementation

```javascript
// Creating a component
var table = Funky.Table.init('#my-table', {
    api: '/api/users',
    columns: [...]
});

// Getting instance later
var existingTable = Funky.Table.getInstance('my-table');

// Using instance methods
existingTable.refresh();

// Chaining visibility methods
panel.show().setData(data).refresh();

// Destroying
Funky.Table.destroy('my-table');
// or
table.destroy();

// SPA cleanup
Funky.Table.destroyAll();
```

---

## Deprecated Patterns

The following patterns are deprecated and will be removed in a future version:

```javascript
// ❌ Deprecated: new Constructor()
var carousel = new Funky.Carousel('#selector', options);

// ❌ Deprecated: Component.create()
var carousel = Funky.Carousel.create('#selector', options);

// ✅ Correct: Component.init()
var carousel = Funky.Carousel.init('#selector', options);
```

---

## See Also

- [Visibility Conventions](visibility-conventions.md) - Visibility method patterns
- [Event Conventions](event-conventions.md) - Event naming and handling
- [Registry](registry.md) - Instance management utilities
