# Event Naming Conventions

Funky uses two event systems with distinct naming conventions.

## Quick Reference

| System | Separator | Scope | Example |
|--------|-----------|-------|---------|
| PubSub | Colons `:` | Application-wide | `funky:table:init` |
| DOM Events | Dots `.` | Element-scoped | `funky.calendar.event-click` |

---

## PubSub Events (Colons)

Use `Funky.PubSub` for application-level messaging between unrelated components.

**Pattern:** `funky:component:action`

**When to Use:**
- Cross-component communication
- Global state changes
- Events that multiple listeners may care about
- Decoupled messaging

**Emitting:**
```javascript
Funky.PubSub.emit('funky:table:init', {
    table: this,
    id: this.id
});
```

**Listening:**
```javascript
Funky.PubSub.on('funky:table:init', function(data) {
    console.log('Table initialized:', data.id);
});

// With namespace for cleanup
Funky.PubSub.on('funky:table:init.myFeature', handler);
Funky.PubSub.off('.myFeature'); // Remove all .myFeature listeners
```

**Examples:**
```javascript
// Component lifecycle
Funky.PubSub.emit('funky:carousel:init', { carousel: this });
Funky.PubSub.emit('funky:carousel:destroy', { carousel: this });

// State changes
Funky.PubSub.emit('funky:sidenav:select', { item: item });
Funky.PubSub.emit('funky:widget-palette:add', { type: type });

// Inter-component messaging
Funky.PubSub.emit('funky:bulk-actions:action', { action: 'delete', ids: ids });
```

---

## DOM Events (Dots)

Use `Funky.Events.emit()` or native `dispatchEvent` for element-scoped events.

**Pattern:** `funky.component.action`

**When to Use:**
- Events specific to a DOM element
- Events that should bubble through DOM
- Integration with DOM event listeners
- Events where element context matters

**Emitting:**
```javascript
// Using Funky.Events
E.emit(this.element, 'funky.calendar.event-click', {
    event: eventData,
    date: clickedDate
});

// Or native
this.element.dispatchEvent(new CustomEvent('funky.calendar.event-click', {
    bubbles: true,
    detail: { event: eventData }
}));
```

**Listening:**
```javascript
// On specific element
E.on(calendarEl, 'funky.calendar.event-click', function(e) {
    console.log('Event clicked:', e.detail.event);
});

// Using delegation
E.on(document, 'funky.calendar.event-click', function(e) {
    var calendar = e.target.closest('.funky-calendar');
    console.log('Calendar event clicked');
});
```

**Examples:**
```javascript
// User interactions
E.emit(el, 'funky.calendar.date-select', { date: date });
E.emit(el, 'funky.inline-edit.save', { value: newValue });

// Component state
E.emit(el, 'funky.clock.countdown-complete', { id: timerId });
E.emit(el, 'funky.timeline.item-click', { item: item });
```

---

## Choosing the Right System

| Scenario | Use | Reason |
|----------|-----|--------|
| Table initialized, other components need to know | PubSub | Cross-component |
| Calendar event clicked, form needs to populate | PubSub | Cross-component |
| Clock countdown finished on specific element | DOM | Element-scoped |
| Inline edit saved on specific field | DOM | Element-scoped |
| Navigation item selected | PubSub | App-wide routing |
| Accordion section expanded | DOM | Element-scoped |

---

## Event Naming Guidelines

### Do's

```javascript
// ✅ Use funky: prefix for PubSub
Funky.PubSub.emit('funky:component:action');

// ✅ Use funky. prefix for DOM events
E.emit(el, 'funky.component.action');

// ✅ Use past tense or present participle for completed actions
'funky:table:initialized'
'funky.calendar.event-clicked'

// ✅ Use descriptive action names
'funky:sidenav:item-selected'
'funky.form.field-validated'
```

### Don'ts

```javascript
// ❌ Don't mix separators
Funky.PubSub.emit('funky.table.init');  // Should use colons
E.emit(el, 'funky:calendar:click');      // Should use dots

// ❌ Don't emit PubSub without element context when element matters
Funky.PubSub.emit('funky:inline-edit:save');  // Use DOM event instead

// ❌ Don't use vague action names
'funky:table:event'  // What event?
'funky.form.update'  // What updated?
```

---

## Visibility Events

Components emit events during visibility transitions:

### PubSub Events
```javascript
// Lifecycle events
Funky.PubSub.emit('funky:modal:open', { modal: this });
Funky.PubSub.emit('funky:modal:close', { modal: this });
Funky.PubSub.emit('funky:sidenav:toggle', { isOpen: this.isOpen });
```

### DOM Events
```javascript
// Element-scoped transitions
E.emit(el, 'funky.accordion.expand', { id: id });
E.emit(el, 'funky.accordion.collapse', { id: id });
```

---

## Migration from Incorrect Patterns

If you find code using wrong separators:

```javascript
// ❌ Before: PubSub-style but using E.emit without element
E.emit('funky:table:init', data);

// ✅ After: Proper PubSub
Funky.PubSub.emit('funky:table:init', data);
```

```javascript
// ❌ Before: DOM event with colons
E.emit(el, 'funky:calendar:click', data);

// ✅ After: DOM event with dots
E.emit(el, 'funky.calendar.click', data);
```

---

## See Also

- [Component Base Interface](component-interface.md) - Standard API patterns
- [Visibility Conventions](visibility-conventions.md) - Visibility methods
- [PubSub](pubsub.md) - PubSub API reference
- [Events](events.md) - Funky.Events API reference
