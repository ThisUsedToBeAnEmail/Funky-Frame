# Funky Frame - Dependencies

> Module dependency graph, loading order, and common patterns.

---

## Loading Order

Modules must be loaded in dependency order. Here's the recommended sequence:

### Phase 1: Foundation (No Dependencies)
```html
<!-- These have zero Funky dependencies -->
<script src="js/core/namespace.js"></script>
<script src="js/core/dom.js"></script>
<script src="js/core/events.js"></script>
<script src="js/core/pubsub.js"></script>
<script src="js/core/registry.js"></script>
<script src="js/core/util.js"></script>
<script src="js/core/storage.js"></script>
<script src="js/core/cache.js"></script>
<script src="js/core/timing.js"></script>
<script src="js/core/date.js"></script>
<script src="js/core/timezone.js"></script>
<script src="js/core/validator.js"></script>
<script src="js/core/vdom.js"></script>
<script src="js/core/keyboard.js"></script>
<script src="js/core/fuzzy-search.js"></script>
<script src="js/core/idle-detector.js"></script>
<script src="js/core/pointer-tracker.js"></script>
<script src="js/core/live-binding.js"></script>
<script src="js/core/announce.js"></script>
<script src="js/core/api.js"></script>
<script src="js/core/csrf.js"></script>
<script src="js/core/websocket.js"></script>
<script src="js/core/navigation.js"></script>
<script src="js/core/nav-position.js"></script>
<script src="js/core/pages.js"></script>
<script src="js/core/spa.js"></script>
<script src="js/core/job-queue.js"></script>
<script src="js/core/schema-adapter.js"></script>
```

### Phase 2: Light Dependencies (1-2 modules)
```html
<!-- Depends on: Dom -->
<script src="js/core/a11y-enhancer.js"></script>
<script src="js/core/tooltip.js"></script>
<script src="js/core/popover.js"></script>
<script src="js/core/form-field-registry.js"></script>

<!-- Depends on: Dom, PubSub -->
<script src="js/core/animate.js"></script>
<script src="js/core/modal.js"></script>
<script src="js/core/tabs.js"></script>
<script src="js/core/selectable-list.js"></script>

<!-- Depends on: Cache -->
<script src="js/core/cache-sync.js"></script>

<!-- Depends on: PubSub (optional) -->
<script src="js/core/media-query.js"></script>
<script src="js/core/history.js"></script>
<script src="js/core/service-worker.js"></script>
<script src="js/core/visibility-observer.js"></script>
```

### Phase 3: Medium Dependencies (3+ modules)
```html
<!-- Depends on: Dom, Events, PubSub -->
<script src="js/core/form.js"></script>

<!-- Depends on: History, Announce, PubSub -->
<script src="js/core/focus-manager.js"></script>

<!-- Depends on: Events, PubSub, JobQueue -->
<script src="js/core/request-queue.js"></script>

<!-- Depends on: ComboBox (component!) -->
<script src="js/core/forms.js"></script>
```

---

## Dependency Graph (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOUNDATION LAYER                                   │
│  ┌───────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Namespace │ │  Dom   │ │ Events │ │ PubSub  │ │ Registry │ │  Storage  │ │
│  └─────┬─────┘ └────┬───┘ └────┬───┘ └────┬────┘ └────┬─────┘ └─────┬─────┘ │
│        │            │          │          │           │             │        │
└────────┼────────────┼──────────┼──────────┼───────────┼─────────────┼────────┘
         │            │          │          │           │             │
         ▼            ▼          ▼          ▼           ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORE UTILITIES                                     │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Tooltip   │    │   Popover   │    │    Modal    │    │    Tabs     │   │
│  │ (Dom)       │    │ (Dom)       │    │ (Dom,PubSub)│    │(Dom,PubSub) │   │
│  └─────────────┘    └─────────────┘    └──────┬──────┘    └─────────────┘   │
│                                               │                              │
│  ┌─────────────┐    ┌─────────────┐    ┌──────┴──────┐    ┌─────────────┐   │
│  │   Animate   │    │   History   │    │FocusManager │    │   Keyboard  │   │
│  │ (Dom,PubSub)│    │ (PubSub)    │    │(Hist,Anncne)│    │   (none)    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │    Form     │    │ SelectList  │    │ FuzzySearch │    │    Date     │   │
│  │(D,E,PubSub) │    │ (Dom,PubSub)│    │   (none)    │    │   (none)    │   │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────────────┘   │
│         │                  │                  │                              │
└─────────┼──────────────────┼──────────────────┼──────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENTS                                         │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │  ComboBox   │───▶│   SideNav   │    │   Command   │◀───│  Quick Nav  │   │
│  │(D,E,PubSub, │    │ (Registry,  │    │   Palette   │    │ (D,E,PubSub)│   │
│  │ SelectList, │    │ SelectList, │    │(D,PubSub,   │    │             │   │
│  │ FuzzySearch)│    │ FuzzySearch)│    │FuzzySearch) │    │             │   │
│  └──────┬──────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │    Forms    │    │  FormModal  │───▶│   Schema    │    │    Toast    │   │
│  │ (ComboBox)  │    │ (Schema,    │    │ (Registry)  │    │ (Dom,Animate│   │
│  │             │    │  Form,Cache)│    │             │    │  Registry)  │   │
│  └─────────────┘    └──────┬──────┘    └─────────────┘    └─────────────┘   │
│                            │                                                 │
│                            ▼                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Wizard    │───▶│    CRUD     │───▶│  DataTables │    │   Tabbed    │   │
│  │(Modal,Form, │    │(FormModal,  │    │ (Registry,  │    │(CRUD,Tables,│   │
│  │ Schema)     │    │ ViewModal,  │    │  Table)     │    │ Tabs)       │   │
│  └─────────────┘    │ Import,etc) │    └─────────────┘    └─────────────┘   │
│                     └─────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Module Dependencies

### No Dependencies (Foundation)
| Module | External |
|--------|----------|
| Namespace | - |
| Dom | - |
| Events | - |
| PubSub | - |
| Registry | - |
| Storage | localStorage |
| Cache | - |
| Util | - |
| Date | - |
| Timezone | - |
| Timing | - |
| Validator | - |
| VDom | - |
| Keyboard | - |
| FuzzySearch | - |
| IdleDetector | - |
| PointerTracker | - |
| LiveBinding | - |
| Announce | - |
| Api | - |
| CSRF | - |
| WebSocket | WebSocket API |
| Navigation | - |
| NavPosition | - |
| Pages | - |
| SPA | - |
| JobQueue | IndexedDB |
| SchemaAdapter | - |

### Light Dependencies (1-2 Funky modules)
| Module | Requires | External |
|--------|----------|----------|
| A11yEnhancer | Dom | - |
| Tooltip | Dom | Bootstrap CSS |
| Popover | Dom | Bootstrap CSS |
| Form.FieldRegistry | Dom | - |
| Animate | Dom, PubSub | - |
| Modal | Dom, PubSub | Bootstrap CSS |
| Tabs | Dom, PubSub | Bootstrap CSS |
| SelectableList | Dom, PubSub (opt) | - |
| CacheSync | Cache | - |
| MediaQuery | PubSub (opt) | - |
| History | PubSub (opt), Storage (opt) | - |
| ServiceWorker | PubSub (opt) | Service Worker |
| VisibilityObserver | Registry, PubSub (opt) | IntersectionObserver |

### Medium Dependencies (3+ modules)
| Module | Requires | External |
|--------|----------|----------|
| Form | Dom, Events, PubSub | - |
| FocusManager | History, Announce, PubSub | - |
| RequestQueue | Events, PubSub, JobQueue | - |
| Forms | ComboBox (component) | - |

---

## Component Dependencies

### Minimal Dependencies (Registry + Dom only)
| Component | Core | Components | External |
|-----------|------|------------|----------|
| Accordion | Dom, Registry | - | Announce (opt) |
| Badge | Dom, PubSub, MediaQuery | - | - |
| Breadcrumb | Registry | - | - |
| Calendar | Dom, Events, Date, Registry | - | - |
| Card Grid | Dom, Registry | - | Animate, LiveBinding, VisibilityObserver (opt) |
| Charts | Registry | - | - |
| Clipboard | Registry | - | - |
| Diff | Registry | - | - |
| Empty State | Registry | - | - |
| Formatting | Registry | - | - |
| Highlight | Registry, Util | - | - |
| Preferences | Registry | - | - |
| Schema | Registry | - | - |
| Skeleton | Registry | - | Announce (opt) |
| Spinner | Registry | - | - |
| Sticky Header | Registry | - | VisibilityObserver (opt) |
| Truncate | Registry | - | - |
| Typewriter | Registry | - | - |
| Video | Registry | - | - |
| Virtualised List | Registry | - | FuzzySearch, WebSocket (opt) |

### Standard Dependencies
| Component | Core | Components | External |
|-----------|------|------------|----------|
| Action Bar | Dom, Events | - | - |
| Action Registry | Registry | - | - |
| Audio | Registry, Storage | - | - |
| Audit Viewer | Dom, Util | - | - |
| Carousel | Dom, PubSub | - | - |
| Clock | Dom, Events | - | - |
| Code Preview | Dom, Util | - | Highlight (opt) |
| Dashboard Grid | Dom, Events, Registry | - | - |
| Gesture Tracker | Events, PubSub, Registry | - | - |
| IFrame | Dom, Events, Registry | - | - |
| Inline Edit | Dom, Events | Presence | - |
| Kanban | Dom, Registry | - | FuzzySearch (opt) |
| Mask | Dom, PubSub | - | - |
| Morph | Dom, Events | - | Keyboard, GestureTracker, Animate, PubSub (opt) |
| Notification Center | Dom, Events, PubSub, Registry | - | - |
| Playground | Dom, Registry | - | - |
| Push Notification | PubSub, Events | - | Service Worker |
| Queue Status | Dom, Events, Registry | RequestQueue, JobQueue | - |
| Quick Nav | Dom, Events, PubSub, Registry | - | Preferences, ScrollTracker (opt) |
| Relative Time | Dom, Events | - | - |
| Scroll Tracker | Events, Registry | - | - |
| Signature | Dom, PubSub | PointerTracker | - |
| Skip Link | Dom, Events, Registry | - | Keyboard (opt) |
| Slide Panel | Registry | - | Keyboard (opt) |
| Table | Dom, PubSub, Registry | - | VisibilityObserver (opt) |
| Timeline | Dom, Events, Registry | - | RelativeTime (opt) |
| Toast | Dom, Animate, Registry | - | - |
| Tree View | Registry | - | Morph, FuzzySearch (opt) |
| WIP Overlay | Storage, Registry | - | - |
| Zero Click | Events, Dom | - | - |

### Complex Dependencies (multiple components)
| Component | Core | Components | External |
|-----------|------|------------|----------|
| Advanced Filter | History | - | - |
| Aggregations | Registry | - | jQuery.fn.DataTable |
| Bulk Actions | Registry | ActionRegistry | - |
| Channel | WebSocket | - | - |
| Column Profiles | Registry | Table | - |
| ComboBox | Dom, Events, PubSub, Registry | SelectableList, FuzzySearch | - |
| Command Palette | Dom, PubSub, Timing, History | FuzzySearch, SelectableList, Keyboard | - |
| Context Menu | Dom, Registry | ActionRegistry, GestureTracker, FocusManager | - |
| Date Picker | Dom, PubSub, Date, Registry | - | Keyboard, Animate (opt) |
| File Manager | Dom, Registry | Timezone | - |
| Filter Toolbar | Storage | - | Api (opt) |
| Form Modal | Registry | Schema, Form, Cache | - |
| Markdown | Dom, Util | - | CodePreview, Clipboard, Tooltip (opt) |
| Morph Panel | Dom, Events, Registry | Morph | FocusManager, Announce (opt) |
| Page Animate | Dom, Registry, VisibilityObserver | Animate | - |
| Plotly Wrapper | Dom, Events, Registry | Preferences, Storage | Plotly.js |
| Presence | Registry | IdleDetector, Channel, TypingIndicator | AvatarStack, SPA (opt) |
| SideNav | Registry | SelectableList, History, FuzzySearch | - |
| SideNav Panel | Registry | SideNav | - |
| Slider | Dom, Registry | GestureTracker | - |
| Stats Bar | Dom, Registry | Format | - |
| Tour | Dom, Events, PubSub, Storage | Morph | - |
| Trade Wizard | Dom, Registry | Wizard | - |
| Typing Indicator | Registry | Channel, Presence | - |
| View Modal | Dom, Registry | Modal, Cache | - |
| Widget Catalog | Dom, Events | SelectableList, DashboardGrid | - |
| Widget Palette | Dom, Events | DashboardGrid | - |
| Wizard | Registry | Modal, Form, Schema | - |
| WYSIMARK | - | - | Wysimark |

### High Dependency Components
| Component | Core | Components | External |
|-----------|------|------------|----------|
| CRUD | Registry | Renderers, FormModal, ViewModal, Import, StatsBar, DataTables | Cache, WebSocket, Schema (opt) |
| DataTables | Registry | Table | jQuery, jQuery.fn.DataTable |
| Tabbed | Registry | CRUD, DataTables, Tabs | - |

---

## Common Dependency Patterns

### Pattern 1: Minimal Component
```javascript
// Only needs Registry for standard interface
(function(global) {
    'use strict';
    var Funky = global.Funky = global.Funky || {};
    
    Funky.MyComponent = {
        init: function(container, options) { ... },
        destroy: function() { ... }
    };
    
    // Register with global registry
    if (Funky.Registry) {
        Funky.Registry.register('MyComponent', Funky.MyComponent);
    }
})(window);
```

### Pattern 2: Standard DOM Component
```javascript
// Needs Dom for element manipulation
(function(global) {
    'use strict';
    var Funky = global.Funky = global.Funky || {};
    var D = Funky.Dom;
    
    Funky.MyComponent = {
        init: function(container, options) {
            var el = D.one(container);
            D.create('div').classAdd('my-component').appendTo(el);
        }
    };
})(window);
```

### Pattern 3: Interactive Component
```javascript
// Needs Dom, Events, and PubSub for full interactivity
(function(global) {
    'use strict';
    var Funky = global.Funky = global.Funky || {};
    var D = Funky.Dom;
    var E = Funky.Events;
    
    Funky.MyComponent = {
        init: function(container, options) {
            var el = D.one(container);
            
            // Local events via PubSub
            var channel = Funky.PubSub.channel('mycomponent');
            
            // Global events via Events
            E.emit('mycomponent:init', { container: container });
        }
    };
})(window);
```

### Pattern 4: Modal-based Component
```javascript
// Extends Modal for dialog functionality
(function(global) {
    'use strict';
    var Funky = global.Funky = global.Funky || {};
    
    Funky.MyModal = {
        show: function(options) {
            return Funky.Modal.show({
                title: options.title,
                content: this._buildContent(options),
                onConfirm: options.onConfirm
            });
        }
    };
})(window);
```

---

## External Dependencies

| Dependency | Required By | Notes |
|------------|-------------|-------|
| **Bootstrap 5 CSS** | Modal, Popover, Tooltip, Tabs | Required for styling |
| **jQuery** | DataTables, Aggregations | Legacy, avoid if possible |
| **jQuery.fn.DataTable** | DataTables, Aggregations | Legacy table component |
| **Plotly.js** | Plotly Wrapper | Charting library |
| **Wysimark** | WYSIMARK | WYSIWYG editor |
| **Service Worker** | Push Notification, ServiceWorker | PWA features |
| **IntersectionObserver** | VisibilityObserver | Native API, polyfill for old browsers |
| **IndexedDB** | JobQueue | Offline storage, falls back to localStorage |

---

## Quick Reference: What Do I Need?

| If you need... | Load these modules |
|----------------|-------------------|
| Basic DOM manipulation | namespace, dom |
| Event handling | namespace, dom, events |
| Pub/Sub channels | namespace, pubsub |
| Form handling | namespace, dom, events, pubsub, form |
| Modals/dialogs | namespace, dom, pubsub, modal |
| Data tables | namespace, dom, pubsub, registry, table |
| Full CRUD operations | All core + formmodal, viewmodal, import, statsbar, datatables, crud |
| SPA navigation | namespace, navigation, pages, spa, history |
| Toast notifications | namespace, dom, animate, registry, toast |
| Command palette | namespace, dom, pubsub, timing, history, keyboard, fuzzy-search, selectable-list, command-palette |
