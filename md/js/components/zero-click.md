# Funky.ZeroClick

Event-to-component automation layer. Listens for events and automatically triggers component actions without writing event handler code.

## Quick Start

```html
<!-- Simple: When user logs in, show a toast -->
<div data-zero-click="user:logged-in -> Toast.success('Welcome back!')"></div>

<!-- DOM events work on the element itself -->
<button data-zero-click="click -> Toast.info('Button clicked!')">Click Me</button>
<div data-zero-click="mouseenter -> Toast.info('Hovered!')">Hover Me</div>
```

Or via JavaScript:

```javascript
Funky.ZeroClick.on('funky:user:logged-in', {
    component: 'Toast',
    method: 'success',
    args: ['Welcome back!']
});
```

## Concepts

### Trigger → Actions Pipeline

```
Event fires → ZeroClick intercepts → Executes component actions
```

One trigger can execute multiple actions in sequence, with optional conditions, delays, and priorities.

### DOM Events vs Custom Events

ZeroClick automatically detects standard DOM events and listens on the element itself:

| Event Type | Target | Examples |
|------------|--------|----------|
| DOM Events | Element | `click`, `mouseenter`, `focus`, `input`, `scroll` |
| Custom Events | Document | `user:logged-in`, `cart:updated`, `ws:message` |

## HTML Declaration

### Simple Attribute Syntax

For single actions:

```html
<!-- Basic custom event -->
<div data-zero-click="event-name -> Component.method('arg1', 'arg2')"></div>

<!-- Without arguments -->
<div data-zero-click="modal:closed -> Toast.info('Modal closed')"></div>

<!-- With placeholder -->
<div data-zero-click="user:logged-in -> Toast.show('Hello, {{user.name}}!')"></div>

<!-- DOM events (auto-targets element) -->
<button data-zero-click="click -> Toast.success('Clicked!')">Click</button>
<input data-zero-click="focus -> Toast.info('Focused!')">
<div data-zero-click="mouseenter -> Toast.info('Hovered!')">Hover</div>
```

### Supported DOM Events

The following events automatically listen on the element:

- **Mouse**: `click`, `dblclick`, `mousedown`, `mouseup`, `mouseenter`, `mouseleave`, `mouseover`, `mouseout`, `mousemove`, `contextmenu`
- **Keyboard**: `keydown`, `keyup`, `keypress`
- **Form**: `focus`, `blur`, `focusin`, `focusout`, `input`, `change`, `submit`, `reset`
- **Touch**: `touchstart`, `touchend`, `touchmove`, `touchcancel`
- **Drag**: `dragstart`, `drag`, `dragend`, `dragenter`, `dragleave`, `dragover`, `drop`
- **Other**: `scroll`, `resize`, `load`, `error`

### JSON Block Syntax

For multiple actions or complex configuration:

```html
<script type="application/json" data-zero-click>
{
    "trigger": "cart:item-added",
    "actions": [
        { "component": "Toast", "method": "info", "args": ["Item added to cart"] },
        { "component": "Skeleton", "method": "show", "target": "#cart-preview" }
    ]
}
</script>
```

With options:

```html
<script type="application/json" data-zero-click>
{
    "trigger": "search:input",
    "debounce": 300,
    "actions": [
        {
            "component": "Toast",
            "method": "info",
            "args": ["Searching: {{query}}"],
            "condition": "{{query}}.length >= 3"
        }
    ]
}
</script>
```

## JavaScript API

### on(eventName, actions, options)

Register a trigger:

```javascript
// Single action
var id = Funky.ZeroClick.on('funky:user:logged-in', {
    component: 'Toast',
    method: 'success',
    args: ['Welcome back!']
});

// Multiple actions with priority
Funky.ZeroClick.on('funky:order:completed', [
    { component: 'Toast', method: 'success', args: ['Order placed!'], priority: 1 },
    { component: 'Skeleton', method: 'hide', target: '#checkout', priority: 2, delay: 500 }
]);

// With debounce (wait for pause in events)
Funky.ZeroClick.on('funky:search:input', {
    component: 'Toast',
    method: 'info',
    args: ['Searching: {{query}}']
}, { debounce: 300 });

// With throttle (max once per interval)
Funky.ZeroClick.on('scroll', {
    component: 'Toast',
    method: 'info',
    args: ['Scrolling...']
}, { throttle: 1000 });

// Scoped to element
Funky.ZeroClick.on('click', {
    component: 'Toast',
    method: 'warning',
    args: ['Delete clicked!']
}, { target: '#delete-btn' });
```

**Parameters:**
- `eventName` (string) — Event to listen for
- `actions` (Object|Array) — Action(s) to execute
- `options.debounce` (number) — Debounce delay in ms
- `options.throttle` (number) — Throttle limit in ms
- `options.target` (string|Element) — Element to attach listener to (default: document)

**Returns:** Trigger ID (number)

### off(id)

Remove a specific trigger:

```javascript
var id = Funky.ZeroClick.on('funky:my:event', { ... });
Funky.ZeroClick.off(id); // Returns true if found
```

### offAll(eventName)

Remove all triggers for an event:

```javascript
Funky.ZeroClick.offAll('funky:user:logged-in');
// Returns count of removed triggers
```

### getTriggers()

Get all registered triggers:

```javascript
var triggers = Funky.ZeroClick.getTriggers();
// [{ id: 1, event: 'funky:user:logged-in', actionCount: 2 }, ...]
```

### pause() / resume()

Control all triggers:

```javascript
Funky.ZeroClick.pause();
// All triggers ignored until resumed

Funky.ZeroClick.resume();
// Triggers active again

Funky.ZeroClick.isPaused(); // true/false
```

### debug(enabled)

Enable debug logging:

```javascript
Funky.ZeroClick.debug(true);
// Logs all trigger/action activity to console
```

### fire(eventName, data)

Manually fire an event:

```javascript
Funky.ZeroClick.fire('funky:user:logged-in', { user: { name: 'John' } });
// Same as: Funky.Events.emit(document, 'funky:user:logged-in', { ... })
```

### init(scope)

Initialize triggers from HTML within a scope:

```javascript
// Initialize new elements added dynamically
Funky.ZeroClick.init('#new-content');
```

### configure(options)

Set global configuration:

```javascript
Funky.ZeroClick.configure({
    defaultDebounce: 100,
    defaultThrottle: 0
});
```

## Action Configuration

### Action Properties

| Property | Type | Description |
|----------|------|-------------|
| `component` | string | Funky component name (e.g., `'Toast'`) |
| `method` | string | Method to call on component |
| `args` | array | Arguments to pass to method |
| `target` | string | Element selector (prepended to args) |
| `condition` | string | JavaScript expression (must be truthy to execute) |
| `priority` | number | Execution order (lower = first) |
| `delay` | number | Delay before execution (ms) |

### Placeholders

Use `{{path.to.value}}` to interpolate event data:

```javascript
// Event payload: { user: { name: 'John', role: 'admin' }, count: 5 }

Funky.ZeroClick.on('funky:user:logged-in', {
    component: 'Toast',
    method: 'success',
    args: ['Hello {{user.name}}! You have {{count}} notifications.']
});
// → Toast.success('Hello John! You have 5 notifications.')
```

### Conditions

Execute action only if condition is true:

```javascript
Funky.ZeroClick.on('funky:notification:received', {
    component: 'Toast',
    method: 'warning',
    args: ['{{message}}'],
    condition: '"{{priority}}" === "high"'
});
// Only shows toast for high priority notifications
```

### Priority & Delay

Control execution order and timing:

```javascript
Funky.ZeroClick.on('funky:checkout:complete', [
    { component: 'Toast', method: 'info', args: ['Processing...'], priority: 1 },
    { component: 'Toast', method: 'success', args: ['Complete!'], priority: 2, delay: 500 },
    { component: 'Skeleton', method: 'hide', target: '#form', priority: 3, delay: 1000 }
]);
```

## Events

### Emitted Events

| Event | Target | Payload | Description |
|-------|--------|---------|-------------|
| `zeroclick:init` | document | `{ triggerCount }` | After initialization |
| `zeroclick:registered` | document | `{ id, event, actionCount }` | Trigger registered |
| `zeroclick:removed` | document | `{ id }` | Trigger removed |
| `zeroclick:triggered` | document | `{ id, event, data }` | Trigger fired |
| `zeroclick:action-executed` | document | `{ component, method, args, eventData }` | Action executed |
| `zeroclick:pause` | document | `{ triggerCount }` | Paused |
| `zeroclick:resume` | document | `{ triggerCount }` | Resumed |

### Listening to Events

```javascript
document.addEventListener('zeroclick:action-executed', function(e) {
    console.log('Action:', e.detail.component + '.' + e.detail.method);
    console.log('Args:', e.detail.args);
});
```

## Common Use Cases

### Welcome Flow

```javascript
Funky.ZeroClick.on('funky:user:logged-in', [
    { component: 'Toast', method: 'success', args: ['Welcome back, {{user.name}}!'] },
    { component: 'WIPOverlay', method: 'hide', delay: 500 }
]);
```

### Loading States

```javascript
// Show skeleton on load start
Funky.ZeroClick.on('funky:data:loading', {
    component: 'Skeleton',
    method: 'show',
    target: '#content'
});

// Hide skeleton and show success on complete
Funky.ZeroClick.on('funky:data:loaded', [
    { component: 'Skeleton', method: 'hide', target: '#content' },
    { component: 'Toast', method: 'success', args: ['Data loaded!'], delay: 200 }
]);
```

### Hover Tooltips/Feedback

```html
<button data-zero-click="mouseenter -> Toast.info('Click to save')">
    💾 Save
</button>

<div data-zero-click="mouseleave -> Toast.warning('Come back!')">
    Important Content
</div>
```

### Form Events

```html
<input data-zero-click="focus -> Toast.info('Enter your email')">
<input data-zero-click="blur -> Toast.info('Thanks!')">
<select data-zero-click="change -> Toast.success('Selection changed!')">
```

### Keyboard Shortcuts

```javascript
// Works with Funky.Keyboard
Funky.ZeroClick.on('keyboard:cmd+k', {
    component: 'Toast',
    method: 'info',
    args: ['Command palette would open here']
});

Funky.ZeroClick.on('funky:keyboard:escape', {
    component: 'Toast',
    method: 'info',
    args: ['Escape pressed']
});
```

### Scheduled Actions with Clock

```javascript
// Works with Funky.Clock
Funky.ZeroClick.on('funky:clock:tick', {
    component: 'Toast',
    method: 'info',
    args: ['Time update']
}, { throttle: 60000 }); // Once per minute
```

## LiveBinding Integration

Dynamic trigger configuration:

```javascript
var boundTrigger = Funky.ZeroClick.createBound({
    trigger: '{{eventName}}',
    actions: [{ 
        component: '{{component}}', 
        method: '{{method}}',
        args: ['{{message}}']
    }]
});

// Update when data changes
boundTrigger.update({
    eventName: 'funky:custom:event',
    component: 'Toast',
    method: 'info',
    message: 'Dynamic message!'
});

// Cleanup
boundTrigger.destroy();
```

## Best Practices

1. **Use specific event names**: `cart:item-added` not just `update`
2. **Set priorities**: For multi-action triggers, define execution order
3. **Add delays for UX**: Let animations complete before next action
4. **Use conditions wisely**: Keep conditions simple for performance
5. **Clean up**: Call `off()` or `offAll()` when component unmounts
6. **Debug first**: Enable debug mode during development
7. **Prefer HTML syntax for DOM events**: More declarative and scannable

## Performance

- Lightweight event delegation
- DOM events auto-target elements (no document bubbling)
- Debounce/throttle prevent excessive calls
- Paused triggers skip processing entirely
- No memory leaks with proper cleanup

## Browser Support

- ES5 compatible
- Works in all modern browsers
- No external dependencies (uses Funky.Events, Funky.Dom)
