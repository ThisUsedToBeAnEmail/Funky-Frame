# Funky.Dom

> Lightweight DOM manipulation library - jQuery-like API without the overhead.

## Overview

Funky.Dom (`D`) provides a chainable API for DOM manipulation using ES5-compatible JavaScript. It wraps native DOM elements in a fluent interface.

## Quick Start

```javascript
// Select elements
var el = D.one('#my-element');      // Single element
var items = D.all('.list-item');    // Multiple elements

// Create elements
var div = D.create('div')
    .classAdd('card')
    .attr('data-id', '123')
    .text('Hello World')
    .appendTo(D.one('#container'));

// Event handling
D.one('#btn').on('click', function(e) {
    console.log('Clicked!');
});
```

---

## API Reference

### Static Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `D.one(selector)` | Select single element | `D` instance |
| `D.all(selector)` | Select all matching elements | `D` instance |
| `D.create(tag)` | Create new element | `D` instance |
| `D.ready(fn)` | Execute when DOM ready | - |

### Instance Methods

#### Core

| Method | Description | Returns |
|--------|-------------|---------|
| `.raw()` | Get underlying DOM element | `Element` |
| `.length` | Number of elements in collection | `number` |

#### Classes

| Method | Description | Returns |
|--------|-------------|---------|
| `.classAdd(name)` | Add CSS class | `this` |
| `.classRemove(name)` | Remove CSS class | `this` |
| `.classToggle(name)` | Toggle CSS class | `this` |
| `.hasClass(name)` | Check for class | `boolean` |

#### Attributes & Data

| Method | Description | Returns |
|--------|-------------|---------|
| `.attr(name, value?)` | Get/set attribute | `this` or value |
| `.data(name, value?)` | Get/set data attribute | `this` or value |
| `.val(value?)` | Get/set form value | `this` or value |

#### Content

| Method | Description | Returns |
|--------|-------------|---------|
| `.text(content?)` | Get/set text content | `this` or text |
| `.html(content?)` | Get/set innerHTML | `this` or html |

#### Styling

| Method | Description | Returns |
|--------|-------------|---------|
| `.style(props)` | Set inline styles (object) | `this` |
| `.css(prop)` | Get computed style (getter only) | `string` |
| `.show()` | Show element | `this` |
| `.hide()` | Hide element | `this` |

#### DOM Manipulation

| Method | Description | Returns |
|--------|-------------|---------|
| `.append(child)` | Append child element | `this` |
| `.prepend(child)` | Prepend child element | `this` |
| `.appendTo(parent)` | Append to parent | `this` |
| `.remove()` | Remove from DOM | `this` |

#### Traversal

| Method | Description | Returns |
|--------|-------------|---------|
| `.parent()` | Get parent element | `D` instance |
| `.one(selector)` | Find one descendant | `D` instance |
| `.all(selector)` | Find all descendants | `D` instance |
| `.next()` | Get next sibling | `D` instance |
| `.prev()` | Get previous sibling | `D` instance |
| `.closest(selector)` | Find closest ancestor matching selector | `D` instance |
| `.siblings(selector?)` | Get sibling elements, optionally filtered | `D` instance |
| `.index()` | Get index among siblings | `number` |

#### Cloning & Replacement

| Method | Description | Returns |
|--------|-------------|---------|
| `.clone(deep?)` | Clone element (deep by default) | `D` instance |
| `.replaceWith(content)` | Replace element with new content | `D` instance |

#### Wrapping

| Method | Description | Returns |
|--------|-------------|---------|
| `.wrap(wrapper)` | Wrap element in another element | `this` |
| `.unwrap()` | Remove parent, keeping element | `this` |

#### Utilities

| Method | Description | Returns |
|--------|-------------|---------|
| `.isEmpty()` | Check if element has no children/text | `boolean` |
| `.each(fn)` | Iterate over elements | `this` |

#### Events

| Method | Description | Returns |
|--------|-------------|---------|
| `.on(event, fn)` | Add event listener | `this` |
| `.off(event, fn)` | Remove event listener | `this` |

---

## Usage Examples

### Selection & Creation

```javascript
// Select existing elements
var header = D.one('#header');
var buttons = D.all('.btn');

// Create new elements
var card = D.create('div')
    .classAdd('card', 'shadow')
    .attr('id', 'my-card');
```

### Chaining

```javascript
D.create('button')
    .classAdd('btn', 'btn-primary')
    .attr('type', 'submit')
    .text('Save')
    .on('click', handleSave)
    .appendTo(D.one('#form-actions'));
```

### Traversal

```javascript
// Find ancestor
var row = D.one('.cell').closest('.table-row');
var modal = D.one('.btn-close').closest('.modal');

// Get siblings
var allSiblings = D.one('.tab-active').siblings();
var siblingTabs = D.one('.tab-active').siblings('.tab');

// Get position
var position = D.one('.list-item.selected').index();
```

### Cloning

```javascript
// Deep clone (includes children)
var deepCopy = D.one('.template').clone();

// Shallow clone (no children)
var shallowCopy = D.one('.template').clone(false);
```

### Replacing Elements

```javascript
// Replace with D instance
D.one('.placeholder').replaceWith(D.create('div').text('Loaded'));

// Replace with HTML string
D.one('.old').replaceWith('<span class="new">Updated</span>');

// Replace with raw element
var newEl = document.createElement('div');
D.one('.target').replaceWith(newEl);
```

### Wrapping & Unwrapping

```javascript
// Wrap element in a container
D.one('.content').wrap(D.create('div').classAdd('wrapper'));

// Wrap with tag string shorthand
D.one('.item').wrap('section');

// Remove parent wrapper
D.one('.inner').unwrap();
```

### Checking Empty State

```javascript
if (D.one('.container').isEmpty()) {
    D.one('.container').text('No content available');
}
```

### Styling

```javascript
// ✅ CORRECT - Use .style() for setting styles
D.one('#box').style({
    backgroundColor: 'var(--pro-primary)',
    padding: '1rem',
    borderRadius: 'var(--pro-radius-md)'
});

// .css() is for READING computed styles only
var color = D.one('#box').css('background-color');
```

### Events

```javascript
D.one('#btn').on('click', function(e) {
    e.preventDefault();
    console.log('Button clicked');
});

// Remove listener
D.one('#btn').off('click', handler);
```

---

## Best Practices

1. **Always check element existence** before manipulation:
   ```javascript
   var el = D.one('#maybe-exists');
   if (el.raw()) {
       el.classAdd('active');
   }
   ```

2. **Use `.style()` for setting, `.css()` for getting**:
   ```javascript
   // Setting - use style()
   el.style({ color: 'red' });
   
   // Getting - use css()
   var color = el.css('color');
   ```

3. **Chain methods** for cleaner code:
   ```javascript
   D.create('div')
       .classAdd('alert')
       .text('Success!')
       .appendTo(container);
   ```

4. **Use CSS variables** for theming:
   ```javascript
   el.style({
       color: 'var(--pro-text-primary)',
       background: 'var(--pro-bg-secondary)'
   });
   ```

---

## See Also

- [Funky.Events](events.md) - Event handling and pub/sub
- [Funky.VDom](vdom.md) - Virtual DOM with same API
- [Component Interface](component-interface.md) - Standard component patterns
