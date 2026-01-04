# Visibility Method Conventions

Funky components use consistent visibility methods based on component type.

## Quick Reference

| Component Type | Show | Hide | Toggle |
|---------------|------|------|--------|
| Overlays, Modals, Dialogs | `open()` | `close()` | `toggle()` |
| Dropdowns, Pickers, Menus | `open()` | `close()` | `toggle()` |
| Collapsible Content | `expand()` | `collapse()` | `toggle()` |
| Simple Visibility | `show()` | `hide()` | `toggle()` |
| Media Controls | `play()` | `pause()` | `toggle()` |

---

## `open()` / `close()`

Use for components that represent entering or exiting a view or interaction mode.

**Use Cases:**
- Modal dialogs
- Side drawers/panels
- Dropdown menus
- Date/time pickers
- ComboBox dropdowns
- Slide panels

**Components:**
- `Funky.Modal` - `open()`, `close()`
- `Funky.SideNav` - `open()`, `close()` (for drawer)
- `Funky.ComboBox` - `open()`, `close()`
- `Funky.DatePicker` - `open()`, `close()`
- `Funky.WidgetCatalog` - `open()`, `close()`
- `Funky.SlidePanel` - `open()`, `close()`

**Example:**
```javascript
var modal = Funky.Modal.init('#my-modal');
modal.open();

// Later
modal.close();

// Or toggle
modal.toggle();
```

---

## `expand()` / `collapse()`

Use for components that reveal or hide content by changing their spatial dimensions.

**Use Cases:**
- Accordion sections
- Tree view nodes
- Collapsible panels
- Truncated text
- Navigation groups

**Components:**
- `Funky.Accordion` - `expand(id)`, `collapse(id)`
- `Funky.TreeView` - `expand(nodeId)`, `collapse(nodeId)`
- `Funky.SideNav` - `expand(groupId)`, `collapse(groupId)` (for menu groups)
- `Funky.Truncate` - `expand()`, `collapse()`
- `Funky.WidgetPalette` - `expand()`, `collapse()`

**Example:**
```javascript
var accordion = Funky.Accordion.init('#my-accordion');

// Expand specific section
accordion.expand('section-1');

// Collapse it
accordion.collapse('section-1');

// Toggle
accordion.toggle('section-1');

// Expand all
accordion.expandAll();

// Collapse all
accordion.collapseAll();
```

---

## `show()` / `hide()`

Use for simple visibility toggling without implying spatial change or view transition.

**Use Cases:**
- Toast notifications
- Loading indicators
- Typing indicators
- Overlays
- Badges
- Tooltips

**Components:**
- `Funky.Toast` - `show()`
- `Funky.TypingIndicator` - `show()`, `hide()`
- `Funky.MorphPanel` - `show()`, `hide()`
- `Funky.Skeleton` - `show()`, `hide()`
- `Funky.WIPOverlay` - `show()`, `hide()`
- `Funky.Mask` (RedactInstance) - `reveal()`, `hide()`
- `Funky.NestedCRUD` - `show()`, `hide()`

**Example:**
```javascript
var indicator = Funky.TypingIndicator.init('#typing');

// Show indicator
indicator.show();

// Hide after delay
setTimeout(function() {
    indicator.hide();
}, 3000);
```

---

## `play()` / `pause()`

Use for media playback components.

**Components:**
- `Funky.Video` - `play()`, `pause()`, `toggle()`

**Example:**
```javascript
var video = Funky.Video.init('#my-video');
video.play();

// Later
video.pause();

// Toggle on click
video.toggle();
```

---

## `toggle()`

All components with visibility methods provide a `toggle()` convenience method.

**Behavior:**
- Calls `open()` if closed, `close()` if open
- Calls `expand()` if collapsed, `collapse()` if expanded
- Calls `show()` if hidden, `hide()` if visible
- Calls `play()` if paused, `pause()` if playing

**Returns:** `this` for chaining

**Example:**
```javascript
// Toggle on button click
D.one('#toggle-btn').on('click', function() {
    panel.toggle();
});
```

---

## Method Chaining

All visibility methods return `this` to enable method chaining:

```javascript
panel
    .show()
    .setData(data)
    .refresh();

accordion
    .expand('section-1')
    .scrollTo('section-1');

combobox
    .open()
    .focus();
```

---

## Visibility State Properties

Components typically expose state properties or methods:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `isOpen` | boolean | For open/close components |
| `isExpanded(id)` | function | For expand/collapse components |
| `isVisible` | boolean | For show/hide components |
| `isShown()` | function | Alternative visibility check |
| `isPlaying` | boolean | For media components |

**Example:**
```javascript
if (modal.isOpen) {
    console.log('Modal is currently open');
}

if (accordion.isExpanded('section-1')) {
    console.log('Section 1 is expanded');
}

if (indicator.isVisible()) {
    console.log('Typing indicator is showing');
}
```

---

## See Also

- [Component Base Interface](component-interface.md) - Standard API patterns
- [Event Conventions](event-conventions.md) - Visibility-related events
