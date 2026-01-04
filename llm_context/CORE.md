# Funky Frame - Core Modules

> 49 core modules providing foundational functionality.

## Essential Modules

| Module | Purpose | Docs |
|--------|---------|------|
| **Dom** | jQuery-like DOM manipulation (`D`) | [dom.md](/md/js/core/dom.md) |
| **Events** | Global event bus (`E`) | [events.md](/md/js/core/events.md) |
| **PubSub** | Namespaced pub/sub channels | [pubsub.md](/md/js/core/pubsub.md) |
| **Storage** | localStorage/sessionStorage wrapper | [storage.md](/md/js/core/storage.md) |
| **Api** | HTTP requests with CSRF, retry | [api.md](/md/js/core/api.md) |

---

## All Core Modules

### Foundation

| Module | Purpose | Docs |
|--------|---------|------|
| Namespace | Global `Funky` namespace setup | [namespace.md](/md/js/core/namespace.md) |
| Registry | Component instance registry | [registry.md](/md/js/core/registry.md) |
| Util | Utility functions | [util.md](/md/js/core/util.md) |
| Component Interface | Standard component API | [component-interface.md](/md/js/core/component-interface.md) |

### DOM & Events

| Module | Purpose | Docs |
|--------|---------|------|
| Dom | DOM manipulation (D) | [dom.md](/md/js/core/dom.md) |
| Events | Event bus (E) | [events.md](/md/js/core/events.md) |
| PubSub | Namespaced channels | [pubsub.md](/md/js/core/pubsub.md) |
| Event Conventions | Standard event naming | [event-conventions.md](/md/js/core/event-conventions.md) |

### UI & Interaction

| Module | Purpose | Docs |
|--------|---------|------|
| Modal | Dialog/modal windows | [modal.md](/md/js/core/modal.md) |
| Popover | Positioned popups | [popover.md](/md/js/core/popover.md) |
| Tooltip | Hover tooltips | [tooltip.md](/md/js/core/tooltip.md) |
| Keyboard | Keyboard shortcuts | [keyboard.md](/md/js/core/keyboard.md) |
| Tabs | Tab panel management | [tabs.md](/md/js/core/tabs.md) |

### Navigation & Routing

| Module | Purpose | Docs |
|--------|---------|------|
| Navigation | SPA navigation | [navigation.md](/md/js/core/navigation.md) |
| Pages | Page lifecycle management | [pages.md](/md/js/core/pages.md) |
| SPA | Single-page app core | [spa.md](/md/js/core/spa.md) |
| History | Browser history wrapper | [history.md](/md/js/core/history.md) |
| Nav Position | Top/left/right/bottom nav | [nav-position.md](/md/js/core/nav-position.md) |

### Data & API

| Module | Purpose | Docs |
|--------|---------|------|
| Api | HTTP client | [api.md](/md/js/core/api.md) |
| CSRF | CSRF token handling | [csrf.md](/md/js/core/csrf.md) |
| WebSocket | WebSocket client | [websocket.md](/md/js/core/websocket.md) |
| Request Queue | Offline request queueing | [request-queue.md](/md/js/core/request-queue.md) |
| Cache | In-memory caching | [cache.md](/md/js/core/cache.md) |
| Cache Sync | Cross-tab cache sync | [cache-sync.md](/md/js/core/cache-sync.md) |

### State & Storage

| Module | Purpose | Docs |
|--------|---------|------|
| Storage | localStorage wrapper | [storage.md](/md/js/core/storage.md) |
| VDOM | Virtual DOM diffing | [vdom.md](/md/js/core/vdom.md) |
| Live Binding | Reactive data binding | [live-binding.md](/md/js/core/live-binding.md) |

### Forms

| Module | Purpose | Docs |
|--------|---------|------|
| Form | Form handling | [form.md](/md/js/core/form.md) |
| Forms | Form utilities | [forms.md](/md/js/core/forms.md) |
| Form Field Registry | Field type registry | [form-field-registry.md](/md/js/core/form-field-registry.md) |
| Validator | Form validation | [validator.md](/md/js/core/validator.md) |
| Schema Adapter | Schema-to-form conversion | [schema-adapter.md](/md/js/core/schema-adapter.md) |
| Form Migration | Migration helpers | [form-migration.md](/md/js/core/form-migration.md) |

### Animation & Effects

| Module | Purpose | Docs |
|--------|---------|------|
| Animate | Animation utilities | [animate.md](/md/js/core/animate.md) |
| Timing | Debounce, throttle, RAF | [timing.md](/md/js/core/timing.md) |

### Accessibility

| Module | Purpose | Docs |
|--------|---------|------|
| A11y Enhancer | Accessibility helpers | [a11y-enhancer.md](/md/js/core/a11y-enhancer.md) |
| Announce | Screen reader announcements | [announce.md](/md/js/core/announce.md) |
| Focus Manager | Focus trapping/restoration | [focus-manager.md](/md/js/core/focus-manager.md) |
| Visibility Conventions | Show/hide standards | [visibility-conventions.md](/md/js/core/visibility-conventions.md) |

### Utilities

| Module | Purpose | Docs |
|--------|---------|------|
| Date | Date formatting/parsing | [date.md](/md/js/core/date.md) |
| Timezone | Timezone handling | [timezone.md](/md/js/core/timezone.md) |
| Fuzzy Search | Fuzzy string matching | [fuzzy-search.md](/md/js/core/fuzzy-search.md) |
| Media Query | Responsive breakpoints | [media-query.md](/md/js/core/media-query.md) |
| Idle Detector | User idle detection | [idle-detector.md](/md/js/core/idle-detector.md) |
| Job Queue | Background job processing | [job-queue.md](/md/js/core/job-queue.md) |
| Pointer Tracker | Mouse/touch tracking | [pointer-tracker.md](/md/js/core/pointer-tracker.md) |
| Selectable List | Keyboard-navigable lists | [selectable-list.md](/md/js/core/selectable-list.md) |

### PWA & Service Worker

| Module | Purpose | Docs |
|--------|---------|------|
| Service Worker | SW registration/messaging | [service-worker.md](/md/js/core/service-worker.md) |
| Presence | User presence (online/typing) | [presence.md](/md/js/core/presence.md) |

---

## Quick Reference: Funky.Dom

```javascript
var D = Funky.Dom;

// Selection
D.one('#id');           // Single element
D.all('.class');        // Array of elements

// Creation
D.create('div');        // Create element

// Chaining
D.create('div')
    .classAdd('card')
    .attr('id', 'myCard')
    .style({ padding: '10px' })
    .text('Hello')
    .appendTo(document.body);
```

---

## Quick Reference: Funky.Events

```javascript
var E = Funky.Events;

// Subscribe
var unsub = E.on('eventName', function(data) {
    console.log(data);
});

// Publish
E.emit('eventName', { key: 'value' });

// Cleanup
unsub();
```

---

## Quick Reference: Funky.PubSub

```javascript
// Subscribe to channel topic
var unsub = Funky.PubSub.subscribe('orders', 'created', handler);

// Publish to channel topic
Funky.PubSub.publish('orders', 'created', orderData);

// Cleanup
unsub();
```

---

## Quick Reference: Funky.Api

```javascript
Funky.Api.get('/api/users')
    .then(function(response) {
        console.log(response.data);
    })
    .catch(function(error) {
        console.error(error);
    });

Funky.Api.post('/api/users', { name: 'John' })
    .then(handler);
```
