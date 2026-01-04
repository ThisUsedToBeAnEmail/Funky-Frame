# Funky.VDom - Virtual DOM Module

A lightweight virtual DOM implementation providing chainable builder and object configuration APIs for clean, declarative DOM creation.

> **Note:** For simple DOM manipulation, use `Funky.Dom` instead.
> Use `Funky.VDom` when you need efficient updates to reactive data-bound UIs.

## Why Funky.VDom?

| Benefit | Description |
|---------|-------------|
| **Cleaner Code** | Declarative API that mirrors HTML structure (4 LOC vs 9+) |
| **XSS Safety** | Automatic escaping with `.text()`, explicit trust with `.html()` |
| **Efficient Updates** | diff/patch only touches changed nodes |
| **State Preservation** | Keyed reconciliation preserves focus, input values, scroll position |

### When to Use VDom vs Dom

| Scenario | Module | Why |
|----------|--------|-----|
| Toggle class, show/hide | **Funky.Dom** | Direct, zero overhead |
| One-time render | **Funky.Dom** | No VNode overhead needed |
| List with updates | **Funky.VDom** | Efficient diff/patch |
| Reactive data UI | **Funky.VDom** | Only changed nodes update |

### Performance Considerations

> **Honest assessment:** Funky.VDom is not always faster than direct DOM.

| Scenario | Winner | Notes |
|----------|--------|-------|
| Initial render | Funky.Dom | VNode allocation has overhead |
| Bulk create | Funky.Dom | Direct DOM is faster for simple cases |
| List reorder | Funky.Dom | For simple lists without state |
| **Partial updates** | **Funky.VDom** | Only changed nodes are touched |
| **Complex UI updates** | **Funky.VDom** | Avoids full re-render |

The primary value of Funky.VDom is **efficient updates for reactive UIs**.

## Quick Start

```javascript
var V = Funky.VDom;

// Chainable builder API
var card = V.div().class('card').child(
    V.h2().text('Hello'),
    V.p().text('World')
).build();

// Object config API
var card = V.create({
    tag: 'div',
    class: 'card',
    children: [
        { tag: 'h2', text: 'Hello' },
        { tag: 'p', text: 'World' }
    ]
});

// Render to real DOM
document.body.appendChild(V.render(card));
```

## Core API

### h(tag, attrs, children)

Creates an element VNode (hyperscript function).

```javascript
V.h('div', { class: 'container', id: 'main' }, [
    V.h('p', null, 'Hello World')
]);
```

### text(value)

Creates a text VNode with automatic HTML escaping.

```javascript
V.text('<script>alert("xss")</script>');
// Safely escaped - no XSS vulnerability
```

### fragment(children)

Creates a fragment VNode for multiple root nodes.

```javascript
V.fragment([
    V.div().text('First'),
    V.div().text('Second')
]);
```

### html(trustedHtml)

Creates a VNode containing trusted HTML. **Use sparingly** - only for pre-sanitized content.

```javascript
V.html('<strong>Bold</strong> text from server');
```

### render(vnode)

Converts a VNode tree to real DOM elements.

```javascript
var element = V.render(V.div().text('Hello'));
container.appendChild(element);
```

### diff(oldVNode, newVNode)

Computes the difference between two VNode trees.

```javascript
var patches = V.diff(oldTree, newTree);
```

### patch(element, patches)

Applies patches to update real DOM efficiently.

```javascript
V.patch(containerElement, patches);
```

### isVNode(value)

Checks if a value is a VNode.

```javascript
V.isVNode({ tag: 'div', _isVNode: true }); // true
V.isVNode('<div></div>'); // false
```

---

## Builder API

The chainable builder API provides a fluent interface for creating VNodes.

### Tag Methods

All common HTML tags have shorthand methods:

```javascript
// Structure
V.div()     V.span()    V.section()   V.article()   V.header()
V.footer()  V.main()    V.nav()       V.aside()

// Text
V.h1()      V.h2()      V.h3()        V.h4()        V.h5()      V.h6()
V.p()       V.a()       V.strong()    V.em()        V.small()
V.code()    V.pre()     V.blockquote()

// Lists
V.ul()      V.ol()      V.li()        V.dl()        V.dt()      V.dd()

// Tables
V.table()   V.thead()   V.tbody()     V.tfoot()
V.tr()      V.td()      V.th()        V.caption()

// Forms
V.form()    V.input()   V.button()    V.select()    V.option()
V.textarea() V.label()  V.fieldset()  V.legend()

// Media
V.img()     V.video()   V.audio()     V.source()    V.picture()
V.canvas()  V.svg()     V.iframe()

// Icons
V.i()       V.icon('fas fa-check')
```

### Chainable Methods

#### .class(className)

Set CSS classes:

```javascript
V.div().class('card active')
V.div().class('btn btn-primary')
```

#### .classAdd(className)

Add classes to existing:

```javascript
V.div().class('card').classAdd('highlighted')
```

#### .classRemove(className)

Remove classes:

```javascript
V.div().class('card active').classRemove('active')
```

#### .classToggle(className, condition)

Toggle class based on condition:

```javascript
V.div().classToggle('active', isSelected)
```

#### .id(id)

Set element ID:

```javascript
V.div().id('my-element')
```

#### .attr(name, value)

Set any attribute:

```javascript
V.input().attr('type', 'email').attr('required', true)
V.a().attr('href', '/page').attr('target', '_blank')
```

#### .attrRemove(name)

Remove an attribute:

```javascript
V.input().attr('disabled', true).attrRemove('disabled')
```

#### .attrToggle(name, value, condition)

Toggle attribute based on condition:

```javascript
V.button().attrToggle('disabled', true, isSubmitting)
```

#### .data(name, value)

Set data-* attributes:

```javascript
V.div().data('id', '123').data('action', 'edit')
// → data-id="123" data-action="edit"
```

#### .aria(name, value)

Set aria-* attributes:

```javascript
V.button().aria('label', 'Close').aria('expanded', false)
// → aria-label="Close" aria-expanded="false"
```

#### .style(styleObject)

Set inline styles:

```javascript
V.div().style({ backgroundColor: 'red', fontSize: '14px' })
V.div().style({ display: 'flex', gap: '1rem' })
```

#### .on(event, handler)

Add event listeners:

```javascript
V.button().on('click', handleClick).on('keydown', handleKey)
```

#### .key(uniqueKey)

Set unique key for efficient list diffing:

```javascript
items.map(function(item) {
    return V.li().key(item.id).text(item.name);
});
```

#### .child(...children)

Add child nodes (accepts VNodes, Builders, arrays, strings):

```javascript
V.ul().child(
    V.li().text('First'),
    V.li().text('Second'),
    items.map(function(item) {
        return V.li().text(item.name);
    })
)
```

#### .text(content)

Set text content (auto-escaped):

```javascript
V.p().text('Safe <text> content')
```

#### .html(trustedHtml)

Set HTML content (use sparingly):

```javascript
V.div().html(sanitizedFromServer)
```

#### .hide()

Add `funky-hidden` class for fade-out:

```javascript
V.div().hide()
```

#### .show()

Remove `funky-hidden` class for fade-in:

```javascript
V.div().show()
```

#### .build()

Finalize the builder to a VNode:

```javascript
var vnode = V.div().class('card').build();
```

**Note:** `.build()` is optional when passing to `.child()`, `V.render()`, or `V.each()` as they auto-build.

---

## Object Config API

### create(config)

Create VNodes from plain object configuration:

```javascript
V.create({
    tag: 'div',
    class: 'card',
    id: 'my-card',
    style: { padding: '1rem' },
    data: { id: '123' },
    aria: { label: 'Card' },
    attrs: { tabindex: '0' },
    on: { click: handleClick },
    key: 'card-123',
    children: [
        { tag: 'h2', text: 'Title' },
        { tag: 'p', text: 'Description' }
    ]
});
```

### Config Properties

| Property | Type | Description |
|----------|------|-------------|
| `tag` | string | HTML tag name (required) |
| `class` | string | CSS class names |
| `id` | string | Element ID |
| `style` | object | Inline styles |
| `data` | object | data-* attributes |
| `aria` | object | aria-* attributes |
| `attrs` | object | Additional attributes |
| `on` | object | Event handlers |
| `key` | string/number | Unique key for diffing |
| `text` | string | Text content |
| `html` | string | Trusted HTML content |
| `children` | array | Child configs/vnodes |

### Attribute Shorthands

Common attributes can be set directly on the config:

```javascript
V.create({
    tag: 'input',
    type: 'email',
    name: 'email',
    placeholder: 'Enter email',
    value: currentValue,
    disabled: isDisabled
});
```

---

## Convenience Helpers

### icon(iconClass, options)

Create FontAwesome icons with `aria-hidden`:

```javascript
V.icon('fas fa-check')
// → <i class="fas fa-check" aria-hidden="true"></i>

V.icon('fas fa-spinner', 'fa-spin')
// → <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>

V.icon('fas fa-warning', { class: 'text-danger', title: 'Error' })
// → <i class="fas fa-warning text-danger" aria-hidden="true" title="Error"></i>
```

### when(condition, thenFn, elseFn)

Conditional rendering:

```javascript
V.when(user.isAdmin,
    function() { return V.button().text('Admin Panel'); },
    function() { return V.span().text('Not authorized'); }
)
```

### unless(condition, thenFn, elseFn)

Inverted conditional:

```javascript
V.unless(isLoading, function() {
    return V.div().text('Content loaded');
})
```

### each(items, renderFn, keyProp)

List rendering with automatic keys:

```javascript
// Auto-key from item.id
V.each(users, function(user) {
    return V.li().text(user.name);
})

// Specify key property
V.each(users, function(user) {
    return V.li().text(user.name);
}, 'id')

// Custom key function
V.each(users, function(user) {
    return V.li().text(user.name);
}, function(user) { return user.uuid; })
```

### classes(...args)

Dynamic class builder:

```javascript
V.classes('btn', isPrimary && 'btn-primary', { disabled: isDisabled })
// → 'btn btn-primary disabled' (depending on conditions)

V.div().class(V.classes('card', isActive && 'active'))
```

### styles(...args)

Dynamic style merger:

```javascript
V.styles(baseStyles, isHighlighted && { backgroundColor: 'yellow' })

V.div().style(V.styles(
    { color: 'blue' },
    isHidden && { display: 'none' }
))
```

---

## LiveBinding Integration

Funky.Dom integrates seamlessly with LiveBinding for reactive updates:

```javascript
Funky.LiveBinding.create('#user-card', {
    template: function(data) {
        var V = Funky.VDom;
        return V.div().class('user-card').child(
            V.h3().text(data.name),
            V.p().text(data.email),
            data.avatar && V.img().attr('src', data.avatar).class('avatar')
        ).build();
    }
});
```

**Benefits over string templates:**
- Partial updates via diff/patch (only changed nodes touched)
- Cleaner, more maintainable code
- Automatic XSS protection
- Better debugging with VNode inspection
- State preservation (focus, input values)

> Note: Initial render may be slower than innerHTML due to VNode overhead.
> The benefit comes from efficient subsequent updates.

---

## Best Practices

### 1. Use Keys for Lists

Keys enable efficient list reconciliation:

```javascript
items.map(function(item) {
    return V.li().key(item.id).text(item.name);
});
```

### 2. Extract Reusable Components

```javascript
function UserAvatar(user) {
    var V = Funky.VDom;
    return V.img()
        .class('avatar')
        .attr('src', user.avatar || '/default-avatar.png')
        .attr('alt', user.name);
}

// Usage
V.div().child(UserAvatar(user), V.span().text(user.name))
```

### 3. Conditional Rendering

```javascript
// Use && for simple conditionals
V.div().child(
    showHeader && V.header().text('Header'),
    V.main().text('Content')
)

// Use when() for if/else
V.div().child(
    V.when(isLoading,
        function() { return V.div().class('spinner'); },
        function() { return V.div().text('Loaded'); }
    )
)
```

### 4. Avoid html() Unless Necessary

```javascript
// ❌ Avoid - XSS risk
V.div().html(userInput)

// ✅ Prefer - auto-escaped
V.div().text(userInput)

// ✅ OK for sanitized server content
V.div().html(sanitizedServerContent)
```

### 5. Prefer Builder API for Complex UI

```javascript
// ❌ String concatenation
var html = '<div class="card">';
html += '<h2>' + escapeHtml(title) + '</h2>';
html += '</div>';

// ✅ Builder API
V.div().class('card').child(
    V.h2().text(title)
)
```

---

## VNode Types

Internal VNode types (for advanced usage):

| Type | Description |
|------|-------------|
| `element` | HTML element node |
| `text` | Text content node |
| `fragment` | Multiple root nodes |
| `html` | Trusted HTML content |

Access via `Funky.Dom.TYPES`:

```javascript
var TYPES = Funky.Dom.TYPES;
// TYPES.ELEMENT, TYPES.TEXT, TYPES.FRAGMENT, TYPES.HTML
```

---

## Migration Guide

### From innerHTML

```javascript
// Before
element.innerHTML = '<div class="card"><h2>' + title + '</h2></div>';

// After
var V = Funky.VDom;
element.appendChild(V.render(
    V.div().class('card').child(V.h2().text(title))
));
```

### From jQuery

```javascript
// Before
$('<div>').addClass('card').append($('<h2>').text(title));

// After
V.div().class('card').child(V.h2().text(title))
```

### From document.createElement

```javascript
// Before
var div = document.createElement('div');
div.className = 'card';
var h2 = document.createElement('h2');
h2.textContent = title;
div.appendChild(h2);

// After
V.render(V.div().class('card').child(V.h2().text(title)))
```

---

## Accessibility Helpers

VDom provides helpers that produce accessible HTML out of the box.

### icon(iconClass, options)

Create icons with automatic ARIA handling:

```javascript
// Decorative icon (default) - hidden from screen readers
V.icon('fas fa-check')
// → <i class="fas fa-check" aria-hidden="true"></i>

// Semantic icon - readable by screen readers
V.icon('fas fa-check', { 'aria-label': 'Completed' })
// → <i class="fas fa-check" role="img" aria-label="Completed"></i>

// Backwards compatible - additional class as string
V.icon('fas fa-spinner', 'fa-spin')
// → <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
```

### srOnly(textContent)

Create visually hidden text for screen readers:

```javascript
V.srOnly('Opens in new window')
// → <span class="visually-hidden">Opens in new window</span>

// Common use: add context to links
V.a().attr('href', '/').child(
    'Home',
    V.srOnly(' - return to homepage')
)
```

### liveRegion(mode, initialContent)

Create ARIA live regions for dynamic announcements:

```javascript
// Polite (non-interrupting) - for status updates
V.liveRegion('polite')
// → <div class="visually-hidden" aria-live="polite" aria-atomic="true" role="status"></div>

// Assertive (interrupting) - for errors/alerts
V.liveRegion('assertive', 'Error occurred')
// → <div class="visually-hidden" aria-live="assertive" aria-atomic="true" role="alert">Error occurred</div>
```

### label(forId, labelText, options)

Create accessible form labels:

```javascript
V.label('email', 'Email Address')
// → <label for="email">Email Address</label>

V.label('email', 'Email', { required: true })
// → <label for="email">Email <span class="text-danger" aria-hidden="true">*</span><span class="visually-hidden"> (required)</span></label>

V.label('search', 'Search', { hidden: true })
// → <label for="search" class="visually-hidden">Search</label>
```

### formField(config)

Create a complete accessible form field with label, input, description, and error handling:

```javascript
V.formField({
    id: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    placeholder: 'you@example.com',
    description: 'We will never share your email',
    error: null
})

// With validation error:
V.formField({
    id: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    error: 'Password must be at least 8 characters'
})
// Input gets: aria-invalid="true", aria-describedby="password-error"
```

### actionButton(buttonText, options)

Create action buttons with `type="button"` (prevents accidental form submission):

```javascript
V.actionButton('Save', {
    icon: 'fas fa-save',
    class: 'btn btn-primary'
})

// Loading state:
V.actionButton('Save', {
    loading: true,
    loadingText: 'Saving...',
    class: 'btn btn-primary'
})
// → aria-busy="true", aria-disabled="true"
```

### submitButton(buttonText, options)

Create submit buttons with `type="submit"`:

```javascript
V.submitButton('Submit', {
    icon: 'fas fa-paper-plane',
    class: 'btn btn-success'
})

// Loading state:
V.submitButton('Submit', { loading: true })
// Default loading text: "Submitting..."
```

### iconButton(iconClass, options)

Create icon-only buttons (requires `aria-label` for accessibility):

```javascript
V.iconButton('fas fa-trash', {
    'aria-label': 'Delete item',
    class: 'btn btn-danger btn-sm',
    title: 'Delete'
})

// Disabled state:
V.iconButton('fas fa-edit', {
    'aria-label': 'Edit item',
    class: 'btn btn-outline-primary',
    disabled: true
})
```

### skipTarget(targetName, label, options)

Create skip navigation targets for integration with `Funky.SkipLink`:

```javascript
// Create a skip target for the main content
V.skipTarget('main-content', 'Main Content', { order: 1 })
// → <div id="skip-main-content" data-skip-target="main-content" data-skip-label="Main Content" data-skip-order="1"></div>

// As a semantic section
V.skipTarget('sidebar', 'Sidebar Navigation', { tag: 'aside', order: 2 })
// → <aside id="skip-sidebar" data-skip-target="sidebar" data-skip-label="Sidebar Navigation" data-skip-order="2"></aside>
```

### Automatic Button Type

All `V.button()` elements automatically get `type="button"` to prevent accidental form submissions:

```javascript
V.button().text('Click me')
// → <button type="button">Click me</button>

// Override for submit buttons:
V.button().attr('type', 'submit').text('Submit')
// Or use V.submitButton()
```

### Search, Progress, and Alerts

#### searchBox(config)

Create an accessible search form with `role="search"` and associated label:

```javascript
V.searchBox({ id: 'site-search', placeholder: 'Search...' })
// → <form role="search" class="search-form">
//     <label for="site-search" class="visually-hidden">Search</label>
//     <div class="search-input-wrapper">
//       <input type="search" id="site-search" role="searchbox" ...>
//       <button type="submit" aria-label="Search">...</button>
//     </div>
//   </form>

V.searchBox({
    id: 'product-search',
    label: 'Search products',
    placeholder: 'Find a product...',
    buttonText: 'Search',
    hideLabel: false
})
```

#### progressBar(config)

Create an accessible progress bar with ARIA attributes:

```javascript
V.progressBar({ value: 75, label: 'Upload progress' })
// → <div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"
//        aria-label="Upload progress" class="progress">
//     <div class="progress-bar" style="width: 75%"></div>
//   </div>

V.progressBar({
    value: 3,
    min: 0,
    max: 10,
    label: 'Step 3 of 10',
    showValue: true
})
```

#### loadingIndicator(config)

Create an accessible loading spinner with `role="status"` and `aria-busy`:

```javascript
V.loadingIndicator({ label: 'Loading results' })
// → <div role="status" aria-busy="true" aria-label="Loading results" class="loading-indicator">
//     <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
//     <span class="visually-hidden">Loading results</span>
//   </div>

V.loadingIndicator({
    label: 'Processing...',
    size: 'lg',      // 'sm', 'lg', or 'xl'
    inline: true
})
```

#### alertBox(message, config)

Create an accessible alert with `role="alert"`:

```javascript
V.alertBox('Form submitted successfully', { type: 'success' })
// → <div role="alert" class="alert alert-success">
//     <i class="fas fa-check-circle" aria-hidden="true"></i>
//     Form submitted successfully
//   </div>

V.alertBox('Please check your input', {
    type: 'error',       // 'info', 'success', 'warning', 'error'
    dismissible: true,
    icon: 'fas fa-times'
})
```

#### dialog(config)

Create an accessible modal dialog with proper ARIA attributes:

```javascript
V.dialog({
    id: 'confirm-dialog',
    title: 'Confirm Action',
    content: 'Are you sure you want to proceed?',
    buttons: [
        { text: 'Cancel', class: 'btn btn-secondary', dismiss: true },
        { text: 'Confirm', class: 'btn btn-primary', id: 'confirm-btn' }
    ]
})

V.dialog({
    id: 'settings-modal',
    title: 'Settings',
    content: V.div().child(...).build(),  // Can be VNode
    size: 'lg',                             // 'sm', 'lg', 'xl', 'fullscreen'
    centered: true,
    buttons: [
        { text: 'Save', class: 'btn btn-primary', icon: 'fas fa-save' }
    ]
})
```

---

## API Summary

| Method | Description |
|--------|-------------|
| `V.h(tag, attrs, children)` | Create element VNode (hyperscript) |
| `V.text(value)` | Create text VNode (auto-escaped) |
| `V.fragment(children)` | Create fragment for multiple roots |
| `V.html(trustedHtml)` | Create trusted HTML VNode |
| `V.create(config)` | Create VNode from object config |
| `V.render(vnode)` | Convert VNode to real DOM |
| `V.diff(old, new)` | Compute difference between VNodes |
| `V.patch(element, patches)` | Apply patches to DOM |
| `V.isVNode(value)` | Check if value is a VNode |
| **Convenience** | |
| `V.icon(class, options)` | FontAwesome icon with auto ARIA |
| `V.when(cond, then, else)` | Conditional rendering |
| `V.unless(cond, then, else)` | Inverted conditional |
| `V.each(items, fn, keyProp)` | List rendering with auto-keys |
| `V.classes(...)` | Dynamic class builder |
| `V.styles(...)` | Dynamic style merger |
| **Accessibility** | |
| `V.srOnly(text)` | Screen reader only text |
| `V.liveRegion(mode, content)` | ARIA live region |
| `V.label(forId, text, opts)` | Accessible form label |
| `V.formField(config)` | Complete accessible form field |
| `V.actionButton(text, opts)` | Button with type="button" |
| `V.submitButton(text, opts)` | Button with type="submit" |
| `V.iconButton(icon, opts)` | Icon-only button (aria-label required) |
| `V.skipTarget(name, label, opts)` | Skip link target |
| `V.searchBox(config)` | Search form with role="search" |
| `V.progressBar(config)` | Accessible progress bar |
| `V.loadingIndicator(config)` | Loading spinner with aria-busy |
| `V.alertBox(msg, config)` | Alert with role="alert" |
| `V.dialog(config)` | Accessible modal dialog |
| **Tag Methods** | |
| `V.div()`, `V.span()`, etc. | All HTML5 tags as Builder factories |

---

## See Also

- [Funky.Registry](registry.md) - Module registration
- [Funky.Keyboard](keyboard.md) - Uses Funky.Dom for help overlay
- [LiveBinding](live-binding.md) - Reactive data binding with VNode support
- [Funky.Announce](announce.md) - Screen reader announcements

---

## VDom vs Dom - Understanding the Difference

### Key Distinction

| Aspect | Funky.Dom (`D`) | Funky.VDom (`V`) |
|--------|-----------------|------------------|
| **Purpose** | Query and manipulate real DOM | Build virtual nodes for diffing |
| **Selection** | `D.one()`, `D.all()` query existing DOM | No selection - builds VNodes |
| **Output** | `ElementWrapper` around real elements | VNode objects or Builder |
| **When to render** | Immediate DOM changes | Call `V.render()` to convert to DOM |

### Post-Render Workflow

After rendering a VNode to real DOM, use `D.wrap()` to manipulate it:

```javascript
var V = Funky.VDom;
var D = Funky.Dom;

// 1. Build VNode tree
var card = V.div().class('card').child(
    V.h2().text('Title'),
    V.p().text('Content')
).build();

// 2. Render to real DOM
var realElement = V.render(card);
document.body.appendChild(realElement);

// 3. For DOM manipulation after render, wrap with D
var wrapper = D.wrap(realElement);
wrapper.classAdd('active');
```

---

## Builder API Parity with Dom

The VDom Builder provides the same method names as Dom for consistency. Builders now track parent relationships, enabling traversal during construction.

### Fully Matched Methods

| Method | Dom (`D`) | VDom Builder (`V`) | Notes |
|--------|-----------|-------------------|-------|
| `classAdd()` | ✅ | ✅ | Add CSS classes |
| `classRemove()` | ✅ | ✅ | Remove CSS classes |
| `classToggle()` | ✅ | ✅ | Toggle CSS classes |
| `hasClass()` | ✅ | ✅ | Check for class |
| `classHas()` | ✅ | ✅ | Alias for hasClass |
| `attr()` | ✅ | ✅ | Set attribute |
| `attrRemove()` | ✅ | ✅ | Remove attribute |
| `attrToggle()` | ✅ | ✅ | Toggle attribute |
| `data()` | ✅ | ✅ | Set data-* attribute |
| `aria()` | ✅ | ✅ | Set aria-* attribute |
| `id()` | ✅ | ✅ | Set element ID |
| `class()` | ✅ | ✅ | Set class (replaces) |
| `style()` | ✅ | ✅ | Set inline styles |
| `hide()` | ✅ | ✅ | Hide element |
| `show()` | ✅ | ✅ | Show element |
| `toggle()` | ✅ | ✅ | Toggle visibility |
| `text()` | ✅ | ✅ | Set text content |
| `html()` | ✅ | ✅ | Set HTML content |
| `val()` | ✅ | ✅ | Set value attribute |
| `append()` | ✅ | ✅ | Append child |
| `prepend()` | ✅ | ✅ | Prepend child |
| `child()` | ✅ | ✅ | Add children |
| `on()` | ✅ | ✅ | Add event handler |
| `key()` | ✅ | ✅ | Set key for diffing |
| `isEmpty()` | ✅ | ✅ | Check if empty |
| `empty()` | ✅ | ✅ | Clear children |

### Traversal Methods (Now in Both!)

VDom Builder now supports tree traversal during construction:

| Method | Dom (`D`) | VDom Builder (`V`) | Notes |
|--------|-----------|-------------------|-------|
| `parent()` | ✅ | ✅ | Get parent element/builder |
| `closest(selector)` | ✅ | ✅ | Find ancestor matching selector |
| `siblings(selector?)` | ✅ | ✅ | Get sibling elements/builders |
| `next(selector?)` | ✅ | ✅ | Get next sibling |
| `prev(selector?)` | ✅ | ✅ | Get previous sibling |
| `index()` | ✅ | ✅ | Position among siblings |
| `find(selector)` | ✅ | ✅ | Find all descendants |
| `findOne(selector)` | ✅ | ✅ | Find first descendant |
| `one(selector)` | ✅ | ✅ | Alias for findOne |

### Manipulation Methods (Now in Both!)

| Method | Dom (`D`) | VDom Builder (`V`) | Notes |
|--------|-----------|-------------------|-------|
| `clone(deep?)` | ✅ | ✅ | Clone element/builder |
| `replaceWith(content)` | ✅ | ✅ | Replace with new content |
| `remove()` | ✅ | ✅ | Remove from parent |
| `appendTo(parent)` | ✅ | ✅ | Append to parent |
| `css(prop)` | ✅ | ✅ | Get style (computed vs attrs) |
| `exists()` | ✅ | ✅ | Check if valid |
| `raw()` | ✅ | ✅ | Get underlying element/builder |

### Dom-Only Methods (Post-Render)

These methods only work on real DOM elements:

| Method | Reason |
|--------|--------|
| `wrapWith()` | DOM wrapping operation |
| `unwrap()` | DOM unwrapping operation |
| `trigger()` | Dispatches DOM events |
| `off()` | Removes DOM event listeners |

---

## VDom Builder Traversal Examples

```javascript
var V = Funky.VDom;

// Build a tree with parent tracking
var list = V.ul().class('menu').child(
    V.li().class('item').id('first').text('Home'),
    V.li().class('item active').text('About'),
    V.li().class('item').id('last').text('Contact')
);

// Find elements in the tree
var active = list.findOne('.active');
console.log(active.text());  // 'About' in the children

// Navigate siblings
var prev = active.prev();    // First item
var next = active.next();    // Last item

// Get parent
var parent = active.parent();  // The ul.menu

// Find closest ancestor
var menu = active.closest('.menu');  // The ul.menu

// Clone a branch
var cloned = active.clone();
cloned.classRemove('active');

// Move elements
active.remove();
active.appendTo(list);  // Now at the end
```

---

## See Also

- [Funky.Dom](dom.md) - Standard DOM manipulation
- [Funky.Events](events.md) - Event handling and pub/sub
- [Component Interface](component-interface.md) - Standard component patterns
