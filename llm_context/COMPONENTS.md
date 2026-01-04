# Funky Frame - Components

> 86+ UI components organized by category.

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

| Component | Purpose | Docs |
|-----------|---------|------|
| Accordion | Collapsible sections | [accordion.md](/md/js/components/accordion.md) |
| Breadcrumb | Navigation breadcrumbs | [breadcrumb.md](/md/js/components/breadcrumb.md) |
| Quick Nav | Quick navigation menu | [quick-nav.md](/md/js/components/quick-nav.md) |
| Sidenav | Sidebar navigation | [sidenav.md](/md/js/components/sidenav.md) |
| Sidenav Panel | Panel with sidenav | [sidenav-panel.md](/md/js/components/sidenav-panel.md) |
| Skip Link | Accessibility skip links | [skip-link.md](/md/js/components/skip-link.md) |
| Slide Panel | Slide-in panels | [slide-panel.md](/md/js/components/slide-panel.md) |
| Tabbed | Tabbed content | [tabbed.md](/md/js/components/tabbed.md) |
| Sticky Header | Fixed header on scroll | [sticky-header.md](/md/js/components/sticky-header.md) |

---

## Data Display

| Component | Purpose | Docs |
|-----------|---------|------|
| Table | Data tables with sorting/filtering | [table.md](/md/js/components/table.md) |
| Card Grid | Grid of cards | [card-grid.md](/md/js/components/card-grid.md) |
| Virtualised List | Virtual scrolling list | [virtualised-list.md](/md/js/components/virtualised-list.md) |
| Tree View | Hierarchical tree | [tree-view.md](/md/js/components/tree-view.md) |
| Timeline | Event timeline | [timeline.md](/md/js/components/timeline.md) |
| Kanban | Kanban board | [kanban.md](/md/js/components/kanban.md) |
| Calendar | Calendar view | [calendar.md](/md/js/components/calendar.md) |
| Stats Bar | Statistics display | [stats-bar.md](/md/js/components/stats-bar.md) |
| Badge | Status badges | [badge.md](/md/js/components/badge.md) |
| Diff | Text diff viewer | [diff.md](/md/js/components/diff.md) |
| Highlight | Text highlighting | [highlight.md](/md/js/components/highlight.md) |
| Truncate | Text truncation | [truncate.md](/md/js/components/truncate.md) |
| Relative Time | Relative timestamps | [relative-time.md](/md/js/components/relative-time.md) |
| Clock | Real-time clock | [clock.md](/md/js/components/clock.md) |

---

## Table Features

| Component | Purpose | Docs |
|-----------|---------|------|
| Aggregations | Column aggregations | [aggregations.md](/md/js/components/aggregations.md) |
| Bulk Actions | Multi-row actions | [bulk-actions.md](/md/js/components/bulk-actions.md) |
| Column Profiles | Column presets | [column-profiles.md](/md/js/components/column-profiles.md) |
| Column Renderers | Custom cell rendering | [column-renderers.md](/md/js/components/column-renderers.md) |
| Conditional Formatting | Cell styling rules | [conditional-formatting.md](/md/js/components/conditional-formatting.md) |
| Inline Edit | In-cell editing | [inline-edit.md](/md/js/components/inline-edit.md) |

---

## Forms & Input

| Component | Purpose | Docs |
|-----------|---------|------|
| Combobox | Autocomplete dropdown | [combobox.md](/md/js/components/combobox.md) |
| Date Picker | Date/time selection | [date-picker.md](/md/js/components/date-picker.md) |
| Slider | Range slider | [slider.md](/md/js/components/slider.md) |
| Mask | Input masking | [mask.md](/md/js/components/mask.md) |
| Signature | Signature capture | [signature.md](/md/js/components/signature.md) |
| Schema | Schema-driven forms | [schema.md](/md/js/components/schema.md) |
| Format Builder | Format string builder | [format-builder.md](/md/js/components/format-builder.md) |
| Formatting | Number/date formatting | [formatting.md](/md/js/components/formatting.md) |
| Preferences | User preferences | [preferences.md](/md/js/components/preferences.md) |

---

## Dialogs & Overlays

| Component | Purpose | Docs |
|-----------|---------|------|
| Form Modal | Modal with form | [form-modal.md](/md/js/components/form-modal.md) |
| View Modal | Read-only modal | [view-modal.md](/md/js/components/view-modal.md) |
| Context Menu | Right-click menu | [context-menu.md](/md/js/components/context-menu.md) |
| Command Palette | Cmd+K command palette | [command-palette.md](/md/js/components/command-palette.md) |
| Tour | Guided tour | [tour.md](/md/js/components/tour.md) |
| WIP Overlay | Work-in-progress overlay | [wip-overlay.md](/md/js/components/wip-overlay.md) |

---

## Feedback & Notifications

| Component | Purpose | Docs |
|-----------|---------|------|
| Toast | Toast notifications | [toast.md](/md/js/components/toast.md) |
| Notification Center | Notification inbox | [notification-center.md](/md/js/components/notification-center.md) |
| Push Notification | Browser push | [push-notification.md](/md/js/components/push-notification.md) |
| Spinner | Loading spinner | [spinner.md](/md/js/components/spinner.md) |
| Skeleton | Loading skeleton | [skeleton.md](/md/js/components/skeleton.md) |
| Empty State | No-data placeholder | [empty-state.md](/md/js/components/empty-state.md) |
| Queue Status | Offline queue status | [queue-status.md](/md/js/components/queue-status.md) |

---

## Filters & Search

| Component | Purpose | Docs |
|-----------|---------|------|
| Filter Toolbar | Filter bar | [filter-toolbar.md](/md/js/components/filter-toolbar.md) |
| Advanced Filter | Complex filter builder | [advanced-filter.md](/md/js/components/advanced-filter.md) |

---

## Media

| Component | Purpose | Docs |
|-----------|---------|------|
| Audio | Audio player | [audio.md](/md/js/components/audio.md) |
| Video | Video player | [video.md](/md/js/components/video.md) |
| Carousel | Image carousel | [carousel.md](/md/js/components/carousel.md) |
| IFrame | Sandboxed iframe | [iframe.md](/md/js/components/iframe.md) |

---

## Visualization

| Component | Purpose | Docs |
|-----------|---------|------|
| Charts | Chart wrapper | [charts.md](/md/js/components/charts.md) |
| Plotly Wrapper | Plotly.js integration | [plotly-wrapper.md](/md/js/components/plotly-wrapper.md) |
| Dashboard Grid | Dashboard layout | [dashboard-grid.md](/md/js/components/dashboard-grid.md) |
| Widget Catalog | Widget library | [widget-catalog.md](/md/js/components/widget-catalog.md) |
| Widget Palette | Widget picker | [widget-palette.md](/md/js/components/widget-palette.md) |

---

## Text & Content

| Component | Purpose | Docs |
|-----------|---------|------|
| Markdown | Markdown rendering | [markdown.md](/md/js/components/markdown.md) |
| Code Preview | Syntax highlighted code | [code-preview.md](/md/js/components/code-preview.md) |
| Typewriter | Typewriter effect | [typewriter.md](/md/js/components/typewriter.md) |
| Typing Indicator | Chat typing dots | [typing-indicator.md](/md/js/components/typing-indicator.md) |
| WYSIMARK | WYSIWYG editor | [wysimark.md](/md/js/components/wysimark.md) |

---

## Animation & Effects

| Component | Purpose | Docs |
|-----------|---------|------|
| Morph | Element morphing | [morph.md](/md/js/components/morph.md) |
| Morph Panel | Morphing panels | [morph-panel.md](/md/js/components/morph-panel.md) |
| Page Animate | Page transitions | [page-animate.md](/md/js/components/page-animate.md) |
| Scroll Tracker | Scroll position tracking | [scroll-tracker.md](/md/js/components/scroll-tracker.md) |
| Gesture Tracker | Touch gestures | [gesture-tracker.md](/md/js/components/gesture-tracker.md) |

---

## Data Management

| Component | Purpose | Docs |
|-----------|---------|------|
| CRUD | Create/Read/Update/Delete | [crud.md](/md/js/components/crud.md) |
| Import | Data import | [import.md](/md/js/components/import.md) |
| Clipboard | Copy/paste | [clipboard.md](/md/js/components/clipboard.md) |
| Audit Viewer | Audit log viewer | [audit-viewer.md](/md/js/components/audit-viewer.md) |
| File Manager | File browser | [file-manager.md](/md/js/components/file-manager.md) |

---

## Wizards

| Component | Purpose | Docs |
|-----------|---------|------|
| Wizard | Step wizard | [wizard.md](/md/js/components/wizard.md) |
| Trade Wizard | Trade-specific wizard | [trade-wizard.md](/md/js/components/trade-wizard.md) |

---

## Collaboration

| Component | Purpose | Docs |
|-----------|---------|------|
| Channel | Chat channels | [channel.md](/md/js/components/channel.md) |
| Presence | User presence indicator | [presence.md](/md/js/components/presence.md) |

---

## Development

| Component | Purpose | Docs |
|-----------|---------|------|
| Playground | Component demo system | [playground.md](/md/js/components/playground.md) |
| Action Bar | Toolbar actions | [action-bar.md](/md/js/components/action-bar.md) |
| Action Registry | Action management | [action-registry.md](/md/js/components/action-registry.md) |
| Zero Click | No-click actions | [zero-click.md](/md/js/components/zero-click.md) |

---

## Theme

| Component | Purpose | Docs |
|-----------|---------|------|
| Even Funkyer | Experimental theme | [even-funkyer.md](/md/js/components/even-funkyer.md) |
