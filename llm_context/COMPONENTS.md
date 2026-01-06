# Funky Frame - Components

> 86+ UI components organized by category.
> 
> **Dependencies Legend**: Core modules in regular text, other components in *italics*, optional deps in (parentheses).
> 
> See [DEPENDENCIES.md](DEPENDENCIES.md) for loading order and dependency graph.

## Component Initialization Pattern

```javascript
// Standard initialization
var instance = Funky.ComponentName.init('#container', {
    option1: 'value',
    option2: true,
    onEvent: function(data) {
        console.log('Event:', data);
    }
});

// Get existing instance
var existing = Funky.ComponentName.getInstance('container-id');

// Cleanup
instance.destroy();
```

---

## Navigation & Layout

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Accordion | Collapsible sections | Dom, Registry, (Announce) | [accordion.md](/md/js/components/accordion.md) |
| Breadcrumb | Navigation breadcrumbs | Registry | [breadcrumb.md](/md/js/components/breadcrumb.md) |
| Quick Nav | Quick navigation menu | Dom, Events, PubSub, Registry, (*Preferences*, *ScrollTracker*) | [quick-nav.md](/md/js/components/quick-nav.md) |
| Sidenav | Sidebar navigation | Registry, *SelectableList*, *History*, *FuzzySearch* | [sidenav.md](/md/js/components/sidenav.md) |
| Sidenav Panel | Panel with sidenav | Registry, *SideNav* | [sidenav-panel.md](/md/js/components/sidenav-panel.md) |
| Skip Link | Accessibility skip links | Dom, Events, Registry, (Keyboard) | [skip-link.md](/md/js/components/skip-link.md) |
| Slide Panel | Slide-in panels | Registry, (Keyboard) | [slide-panel.md](/md/js/components/slide-panel.md) |
| Tabbed | Tabbed content | Registry, *CRUD*, *DataTables*, Tabs | [tabbed.md](/md/js/components/tabbed.md) |
| Sticky Header | Fixed header on scroll | Registry, (VisibilityObserver) | [sticky-header.md](/md/js/components/sticky-header.md) |

---

## Data Display

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Table | Data tables with sorting/filtering | Dom, PubSub, Registry, (VisibilityObserver) | [table.md](/md/js/components/table.md) |
| Card Grid | Grid of cards | Dom, Registry, (Animate, LiveBinding, VisibilityObserver) | [card-grid.md](/md/js/components/card-grid.md) |
| Virtualised List | Virtual scrolling list | Registry, (FuzzySearch, WebSocket) | [virtualised-list.md](/md/js/components/virtualised-list.md) |
| Tree View | Hierarchical tree | Registry, (*Morph*, FuzzySearch) | [tree-view.md](/md/js/components/tree-view.md) |
| Timeline | Event timeline | Dom, Events, Registry, (*RelativeTime*) | [timeline.md](/md/js/components/timeline.md) |
| Kanban | Kanban board | Dom, Registry, (FuzzySearch) | [kanban.md](/md/js/components/kanban.md) |
| Calendar | Calendar view | Dom, Events, Date, Registry | [calendar.md](/md/js/components/calendar.md) |
| Stats Bar | Statistics display | Dom, Registry, *Format* | [stats-bar.md](/md/js/components/stats-bar.md) |
| Badge | Status badges | Dom, PubSub, MediaQuery | [badge.md](/md/js/components/badge.md) |
| Diff | Text diff viewer | Registry | [diff.md](/md/js/components/diff.md) |
| Highlight | Text highlighting | Registry, Util | [highlight.md](/md/js/components/highlight.md) |
| Truncate | Text truncation | Registry | [truncate.md](/md/js/components/truncate.md) |
| Relative Time | Relative timestamps | Dom, Events | [relative-time.md](/md/js/components/relative-time.md) |
| Clock | Real-time clock | Dom, Events | [clock.md](/md/js/components/clock.md) |

---

## Table Features

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Aggregations | Column aggregations | Registry | jQuery.fn.DataTable | [aggregations.md](/md/js/components/aggregations.md) |
| Bulk Actions | Multi-row actions | Registry, *ActionRegistry* | [bulk-actions.md](/md/js/components/bulk-actions.md) |
| Column Profiles | Column presets | Registry, *Table* | [column-profiles.md](/md/js/components/column-profiles.md) |
| Column Renderers | Custom cell rendering | Registry | [column-renderers.md](/md/js/components/column-renderers.md) |
| Conditional Formatting | Cell styling rules | Registry | [conditional-formatting.md](/md/js/components/conditional-formatting.md) |
| Inline Edit | In-cell editing | Dom, Events, *Presence* | [inline-edit.md](/md/js/components/inline-edit.md) |

---

## Forms & Input

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Toggle Group | Segmented control | Dom, Events, Registry, (PubSub, Announce, Tooltip) | [toggle-group.md](/md/js/components/toggle-group.md) |
| Combobox | Autocomplete dropdown | Dom, Events, PubSub, Registry, *SelectableList*, FuzzySearch | [combobox.md](/md/js/components/combobox.md) |
| Date Picker | Date/time selection | Dom, PubSub, Date, Registry, (Keyboard, Animate) | [date-picker.md](/md/js/components/date-picker.md) |
| Slider | Range slider | Dom, Registry, *GestureTracker* | [slider.md](/md/js/components/slider.md) |
| Mask | Input masking | Dom, PubSub | [mask.md](/md/js/components/mask.md) |
| Signature | Signature capture | Dom, PubSub, PointerTracker | [signature.md](/md/js/components/signature.md) |
| Schema | Schema-driven forms | Registry | [schema.md](/md/js/components/schema.md) |
| Format Builder | Format string builder | Registry | [format-builder.md](/md/js/components/format-builder.md) |
| Formatting | Number/date formatting | Registry | [formatting.md](/md/js/components/formatting.md) |
| Preferences | User preferences | Registry | [preferences.md](/md/js/components/preferences.md) |

---

## Dialogs & Overlays

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Form Modal | Modal with form | Registry, *Schema*, Form, Cache | [form-modal.md](/md/js/components/form-modal.md) |
| View Modal | Read-only modal | Dom, Registry, Modal, Cache | [view-modal.md](/md/js/components/view-modal.md) |
| Context Menu | Right-click menu | Dom, Registry, *ActionRegistry*, *GestureTracker*, FocusManager | [context-menu.md](/md/js/components/context-menu.md) |
| Command Palette | Cmd+K command palette | Dom, PubSub, Timing, History, FuzzySearch, *SelectableList*, Keyboard | [command-palette.md](/md/js/components/command-palette.md) |
| Tour | Guided tour | Dom, Events, PubSub, Storage, *Morph* | [tour.md](/md/js/components/tour.md) |
| WIP Overlay | Work-in-progress overlay | Storage, Registry | [wip-overlay.md](/md/js/components/wip-overlay.md) |

---

## Feedback & Notifications

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Toast | Toast notifications | Dom, Animate, Registry | [toast.md](/md/js/components/toast.md) |
| Notification Center | Notification inbox | Dom, Events, PubSub, Registry | [notification-center.md](/md/js/components/notification-center.md) |
| Push Notification | Browser push | PubSub, Events | Service Worker | [push-notification.md](/md/js/components/push-notification.md) |
| Spinner | Loading spinner | Registry | [spinner.md](/md/js/components/spinner.md) |
| Skeleton | Loading skeleton | Registry, (Announce) | [skeleton.md](/md/js/components/skeleton.md) |
| Empty State | No-data placeholder | Registry | [empty-state.md](/md/js/components/empty-state.md) |
| Queue Status | Offline queue status | Dom, Events, Registry, RequestQueue, JobQueue | [queue-status.md](/md/js/components/queue-status.md) |

---

## Filters & Search

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Filter Toolbar | Filter bar | Storage, (Api) | [filter-toolbar.md](/md/js/components/filter-toolbar.md) |
| Advanced Filter | Complex filter builder | History | [advanced-filter.md](/md/js/components/advanced-filter.md) |

---

## Media

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Audio | Audio player | Registry, Storage | [audio.md](/md/js/components/audio.md) |
| Video | Video player | Registry | [video.md](/md/js/components/video.md) |
| Carousel | Image carousel | Dom, PubSub | [carousel.md](/md/js/components/carousel.md) |
| IFrame | Sandboxed iframe | Dom, Events, Registry | [iframe.md](/md/js/components/iframe.md) |

---

## Visualization

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Charts | Chart wrapper | Registry | [charts.md](/md/js/components/charts.md) |
| Plotly Wrapper | Plotly.js integration | Dom, Events, Registry, *Preferences*, Storage | Plotly.js | [plotly-wrapper.md](/md/js/components/plotly-wrapper.md) |
| Dashboard Grid | Dashboard layout | Dom, Events, Registry | [dashboard-grid.md](/md/js/components/dashboard-grid.md) |
| Widget Catalog | Widget library | Dom, Events, *SelectableList*, *DashboardGrid* | [widget-catalog.md](/md/js/components/widget-catalog.md) |
| Widget Palette | Widget picker | Dom, Events, *DashboardGrid* | [widget-palette.md](/md/js/components/widget-palette.md) |

---

## Text & Content

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Markdown | Markdown rendering | Dom, Util, (*CodePreview*, *Clipboard*, Tooltip) | [markdown.md](/md/js/components/markdown.md) |
| Code Preview | Syntax highlighted code | Dom, Util, (*Highlight*) | [code-preview.md](/md/js/components/code-preview.md) |
| Typewriter | Typewriter effect | Registry | [typewriter.md](/md/js/components/typewriter.md) |
| Typing Indicator | Chat typing dots | Registry, *Channel*, *Presence* | [typing-indicator.md](/md/js/components/typing-indicator.md) |
| WYSIMARK | WYSIWYG editor | — | Wysimark | [wysimark.md](/md/js/components/wysimark.md) |

---

## Animation & Effects

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Morph | Element morphing | Dom, Events, (Keyboard, *GestureTracker*, Animate, PubSub) | [morph.md](/md/js/components/morph.md) |
| Morph Panel | Morphing panels | Dom, Events, Registry, *Morph*, (FocusManager, Announce) | [morph-panel.md](/md/js/components/morph-panel.md) |
| Page Animate | Page transitions | Dom, Registry, Animate, VisibilityObserver | [page-animate.md](/md/js/components/page-animate.md) |
| Scroll Tracker | Scroll position tracking | Events, Registry | [scroll-tracker.md](/md/js/components/scroll-tracker.md) |
| Gesture Tracker | Touch gestures | Events, PubSub, Registry | [gesture-tracker.md](/md/js/components/gesture-tracker.md) |

---

## Data Management

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| CRUD | Create/Read/Update/Delete | Registry, *Renderers*, *FormModal*, *ViewModal*, *Import*, *StatsBar*, *DataTables*, (Cache, WebSocket, *Schema*) | [crud.md](/md/js/components/crud.md) |
| DataTables | jQuery DataTables wrapper | Registry, *Table* | jQuery, jQuery.fn.DataTable | [datatables.md](/md/js/components/datatables.md) |
| Import | Data import | Registry | [import.md](/md/js/components/import.md) |
| Clipboard | Copy/paste | Registry | [clipboard.md](/md/js/components/clipboard.md) |
| Audit Viewer | Audit log viewer | Dom, Util | [audit-viewer.md](/md/js/components/audit-viewer.md) |
| File Manager | File browser | Dom, Registry, Timezone | [file-manager.md](/md/js/components/file-manager.md) |

---

## Wizards

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Wizard | Step wizard | Registry, Modal, Form, *Schema* | [wizard.md](/md/js/components/wizard.md) |
| Trade Wizard | Trade-specific wizard | Dom, Registry, *Wizard* | [trade-wizard.md](/md/js/components/trade-wizard.md) |

---

## Collaboration

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Channel | Chat channels | WebSocket | [channel.md](/md/js/components/channel.md) |
| Presence | User presence indicator | Registry, IdleDetector, *Channel*, *TypingIndicator*, (*AvatarStack*, SPA) | [presence.md](/md/js/components/presence.md) |

---

## Development

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Playground | Component demo system | Dom, Registry | [playground.md](/md/js/components/playground.md) |
| Action Bar | Toolbar actions | Dom, Events | [action-bar.md](/md/js/components/action-bar.md) |
| Action Registry | Action management | Registry | [action-registry.md](/md/js/components/action-registry.md) |
| Zero Click | No-click actions | Events, Dom | [zero-click.md](/md/js/components/zero-click.md) |

---

## Theme

| Component | Purpose | Requires | Docs |
|-----------|---------|----------|------|
| Even Funkyer | Experimental theme | Registry | [even-funkyer.md](/md/js/components/even-funkyer.md) |
