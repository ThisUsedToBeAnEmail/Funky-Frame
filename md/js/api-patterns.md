# Funky.JS API Patterns

This document describes the standard API patterns used across Funky components. Understanding these patterns helps you use components correctly and consistently.

## Overview

Funky components follow a standardized API pattern:

| Method | Purpose |
|--------|---------|
| `init(target, options)` | Create a new instance |
| `getInstance(id)` | Get existing instance |
| `destroy(id)` | Destroy instance by ID |
| `destroyAll()` | Destroy all instances |

---

## Standard API

All instance-based Funky components use this standard factory pattern:

### Usage

```javascript
// Create a new instance
var carousel = Funky.Carousel.init('#my-container', {
    slidesToShow: 3,
    autoplay: true
});

// Retrieve an existing instance by ID
var existing = Funky.Carousel.getInstance('my-container');

// Destroy by ID
Funky.Carousel.destroy('my-container');

// Or destroy via instance
carousel.destroy();
```

### Components Using Standard API

**UI Components:**
- **Accordion** - `Funky.Accordion.init()` / `getInstance()` / `destroy()`
- **Carousel** - `Funky.Carousel.init()` / `getInstance()` / `destroy()`
- **Slider** - `Funky.Slider.init()` / `getInstance()` / `destroy()`
- **Calendar** - `Funky.Calendar.init()` / `getInstance()` / `destroy()`
- **CardGrid** - `Funky.CardGrid.init()` / `getInstance()` / `destroy()`
- **CodePreview** - `Funky.CodePreview.init()` / `getInstance()` / `destroy()`
- **ComboBox** - `Funky.ComboBox.init()` / `getInstance()` / `destroy()`
- **Tabbed** - `Funky.Tabbed.init()` / `getInstance()` / `destroy()`
- **Tour** - `Funky.Tour.init()` / `getInstance()` / `destroy()`
- **Tooltip** - `Funky.Tooltip.init()` / `getInstance()` / `destroy()`
- **SideNavPanel** - `Funky.SideNavPanel.init()` / `getInstance()` / `destroy()`
- **WidgetCatalog** - `Funky.WidgetCatalog.init()` / `getInstance()` / `destroy()`
- **WidgetPalette** - `Funky.WidgetPalette.init()` / `getInstance()` / `destroy()`

**Form Components:**
- **Wizard** - `Funky.Wizard.init()` / `getInstance()` / `destroy()`
- **Advanced Filter** - `Funky.AdvancedFilter.init()` / `getInstance()` / `destroy()`
- **Format Builder** - `Funky.FormatBuilder.init()` / `getInstance()` / `destroy()`

**Data Components:**
- **Table** - `Funky.Table.init()` / `getInstance()` / `destroy()`
- **Dashboard Grid** - `Funky.DashboardGrid.init()` / `getInstance()` / `destroy()`
- **Kanban** - `Funky.Kanban.init()` / `getInstance()` / `destroy()`

### Factory Structure

```javascript
var _instances = Funky.Registry.createInstanceRegistry('Component');

var Component = {
    init: function(target, options) {
        var instance = new ComponentInstance(target, options);
        _instances.register(instance.id, instance);
        return instance;
    },

    getInstance: function(id) {
        return _instances.get(id);
    },

    destroy: function(id) {
        var instance = _instances.get(id);
        if (instance) instance.destroy();
    },

    destroyAll: function() {
        _instances.destroyAll();
    }
};
```

---

## Batch Initialization

Some components support initializing multiple instances from DOM:

```javascript
// Initialize all calendars in document
Funky.Calendar.initAll();

// Initialize tooltips in a container
Funky.Tooltip.initAll('#my-section');
```

Components with `initAll()`:
- **Calendar** - `Funky.Calendar.initAll(container)`
- **Tooltip** - `Funky.Tooltip.initAll(container)`

---

## Singletons & Utilities

Some components don't create instances - they provide utility methods directly.

### Usage

```javascript
// Direct method calls - no instances to manage
Funky.Toast.success('Operation completed!');
Funky.Toast.error('Something went wrong');

Funky.Badge.attach('#notification-btn', { value: 5 });
Funky.Badge.update('#notification-btn', 10);

Funky.Clipboard.copy('Text to copy');

Funky.Spinner.show('#container');
Funky.Spinner.hide('#container');
```

### Components Using Utility Pattern

**Notifications & Feedback:**
- **Toast** - `success()`, `error()`, `warning()`, `info()`
- **Spinner** - `show()`, `hide()`
- **Skeleton** - `render()`, `remove()`
- **Empty State** - `render()`, `clear()`

**UI Utilities:**
- **Badge** - `attach()`, `update()`, `remove()`, `get()`
- **Breadcrumb** - `render()`, `generate()`, `autoInit()`
- **Clipboard** - `copy()`, `init()`, `attach()`
- **Context Menu** - `attach()`, `show()`, `hide()`
- **Highlight** - `highlight()`, `remove()`

**Media:**
- **Audio** - `play()`, `stop()`, `mute()`, `toggleMute()`

---

## Common Instance Methods

Most instance-based components share these methods:

| Method | Description |
|--------|-------------|
| `destroy()` | Clean up and remove the instance |
| `refresh()` | Re-render/update the component |
| `enable()` | Enable user interaction |
| `disable()` | Disable user interaction |

---

## Memory Management

All instance-based components should properly clean up when destroyed. The recommended pattern uses a `_cleanups` array:

```javascript
function Component(el, options) {
    this._cleanups = [];
    // ... setup

    // When adding event listeners:
    window.addEventListener('resize', this._resizeHandler);
    this._cleanups.push(function() {
        window.removeEventListener('resize', this._resizeHandler);
    }.bind(this));
}

Component.prototype.destroy = function() {
    // Run all cleanup functions
    this._cleanups.forEach(function(fn) { fn(); });
    this._cleanups = [];

    // ... other cleanup
};
```

---

## Quick Reference

```javascript
// Standard pattern - init()
Funky.Carousel.init('#el', opts)
Funky.Slider.init('#el', opts)
Funky.Wizard.init(opts)
Funky.Accordion.init('#el', opts)
Funky.Calendar.init('#el', opts)
Funky.Tour.init('tour-id', opts)
Funky.Tooltip.init('#el', opts)

// Utility pattern - Direct calls
Funky.Toast.success('msg')
Funky.Badge.attach('#el', opts)
Funky.Clipboard.copy('text')
```
