# Funky.ToggleGroup

Segmented control / button group that acts as a single form control.

## Overview

ToggleGroup provides a set of buttons where one (single mode) or many (multiple mode) can be selected. It integrates with forms via hidden inputs and supports full keyboard navigation.

## Registration

Registered as `Funky.ToggleGroup` via the component registry.

**File:** `js/components/toggle-group.js`

## Quick Start

### Declarative

```html
<div data-toggle-group
     data-name="view_mode"
     data-value="list"
     data-options='[{"value":"list","label":"List","icon":"fa-list"},{"value":"grid","label":"Grid","icon":"fa-th"}]'>
</div>
```

```javascript
Funky.ToggleGroup.initAll();
```

### Programmatic

```javascript
var toggle = Funky.ToggleGroup.init('#container', {
    mode: 'single',
    options: [
        { value: 'list', label: 'List', icon: 'fa-list' },
        { value: 'grid', label: 'Grid', icon: 'fa-th' },
        { value: 'table', label: 'Table', icon: 'fa-table' }
    ],
    value: 'list',
    name: 'view_mode',
    onChange: function(value, option) {
        console.log('Selected:', value);
    }
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | string | `'single'` | `'single'` or `'multiple'` |
| `options` | array | `[]` | Array of option objects |
| `value` | string\|array | `null` | Initial value |
| `allowEmpty` | boolean | `false` | Allow no selection in single mode |
| `required` | boolean | `false` | Required for form validation |
| `disabled` | boolean | `false` | Disable entire group |
| `name` | string | `null` | Form input name |
| `label` | string | `null` | Accessible label for the group |
| `size` | string | `'md'` | `'sm'`, `'md'`, or `'lg'` |
| `variant` | string | `'default'` | `'default'`, `'outline'`, or `'pills'` |
| `orientation` | string | `'horizontal'` | `'horizontal'` or `'vertical'` |
| `equalWidth` | boolean | `false` | Equal width buttons |
| `iconOnly` | boolean | `false` | Show icons only |
| `responsive` | boolean | `false` | Enable responsive stacking on mobile |
| `breakpoints` | object | `null` | MediaQuery config for orientation/size |
| `groupBehavior` | string | `null` | `'single'` - only one per group in multiple mode |
| `loading` | boolean | `false` | Show loading state initially |
| `loadingSkeletons` | number | `3` | Number of skeleton placeholders |
| `loadingText` | string | `'Loading...'` | Screen reader text while loading |
| `showTooltips` | boolean | `true` | Show tooltips for icon-only mode |
| `tooltipPlacement` | string | `'bottom'` | `'top'`, `'bottom'`, `'left'`, `'right'` |
| `renderOption` | function | `null` | Custom render function |
| `onChange` | function | `null` | Change callback |
| `channel` | string | `null` | PubSub channel name for broadcasting |
| `announceChanges` | boolean | `true` | Announce changes to screen readers |

### Option Object

```javascript
{
    value: 'list',        // Required: unique value
    label: 'List View',   // Button text
    icon: 'fa-list',      // FontAwesome icon class
    disabled: false,      // Disable this option
    badge: 5,             // Badge count/text
    badgeVariant: 'success', // Badge style: success, warning, danger, info
    group: 'view'         // Group name for exclusive selection
}
```

### Separator

```javascript
{ type: 'separator' }  // Visual separator between options
```

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` | string\|array | Get current value |
| `setValue(value)` | this | Set value |
| `getOptions()` | array | Get all options |
| `setOptions(options)` | this | Replace options |
| `disable()` | this | Disable entire group |
| `enable()` | this | Enable entire group |
| `disableOption(value)` | this | Disable single option |
| `enableOption(value)` | this | Enable single option |
| `setSize(size)` | this | Change size at runtime |
| `setVariant(variant)` | this | Change variant at runtime |
| `setOrientation(orientation)` | this | Change orientation at runtime |
| `setLoading(loading)` | this | Set loading state |
| `isLoading()` | boolean | Check if in loading state |
| `updateBadge(value, badge, opts)` | this | Update badge for an option |
| `setData(data)` | this | Set options from data (LiveBinding) |
| `getData()` | array | Get current options data (LiveBinding) |
| `bindTo(config)` | this | Bind to external data source |
| `unbind()` | this | Remove data binding |
| `destroy()` | void | Clean up |

## Static Methods

| Method | Description |
|--------|-------------|
| `ToggleGroup.init(container, config)` | Create instance |
| `ToggleGroup.getInstance(id)` | Get instance by ID or element |
| `ToggleGroup.initAll(selector)` | Auto-init from DOM |
| `ToggleGroup.destroyAll()` | Destroy all instances |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `togglegroup:change` | `{ value, option, previous, instanceId }` | Selection changed |

```javascript
container.addEventListener('togglegroup:change', function(e) {
    console.log('New value:', e.detail.value);
    console.log('Previous:', e.detail.previous);
});
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Left/Up | Previous option |
| Arrow Right/Down | Next option |
| Home | First option |
| End | Last option |
| Space/Enter | Select focused option |

## Accessibility

- `role="radiogroup"` (single mode) or `role="group"` (multiple mode) on container
- `role="radio"` or `role="checkbox"` on buttons
- `aria-checked` reflects selection state
- `aria-disabled` for disabled options
- Roving tabindex for keyboard navigation
- Screen reader announcements via `Funky.Announce` (optional)

## Visual Options

### Size Variants

```javascript
// Small
Funky.ToggleGroup.init('#container', {
    options: options,
    size: 'sm'
});

// Large
Funky.ToggleGroup.init('#container', {
    options: options,
    size: 'lg'
});
```

### Style Variants

```javascript
// Outline (separated buttons with borders)
Funky.ToggleGroup.init('#container', {
    options: options,
    variant: 'outline'
});

// Pills (rounded pill-shaped buttons)
Funky.ToggleGroup.init('#container', {
    options: options,
    variant: 'pills'
});
```

### Icon-Only Mode

```javascript
Funky.ToggleGroup.init('#container', {
    options: [
        { value: 'list', label: 'List View', icon: 'fa-list' },
        { value: 'grid', label: 'Grid View', icon: 'fa-th' }
    ],
    iconOnly: true
});
```

Note: `label` is still required for accessibility (used in `aria-label` and `title`).

### Vertical Orientation

```javascript
Funky.ToggleGroup.init('#container', {
    options: options,
    orientation: 'vertical'
});
```

### Equal Width Buttons

```javascript
Funky.ToggleGroup.init('#container', {
    options: options,
    equalWidth: true
});
```

### Runtime Customization

```javascript
var toggle = Funky.ToggleGroup.init('#container', { options: options });

// Change appearance at runtime
toggle.setSize('lg');
toggle.setVariant('pills');
toggle.setOrientation('vertical');

// Loading state
toggle.setLoading(true);
// ... async operation ...
toggle.setLoading(false);
```

### Responsive Behavior

Use `responsive: true` for CSS-based mobile stacking:

```javascript
Funky.ToggleGroup.init('#container', {
    options: options,
    responsive: true  // Stacks vertically on mobile (<640px)
});
```

For programmatic responsive behavior via `Funky.MediaQuery`:

```javascript
Funky.ToggleGroup.init('#container', {
    options: options,
    breakpoints: {
        orientation: {
            sm: 'vertical',   // Stack on mobile
            md: 'horizontal', // Side-by-side on tablet+
            lg: 'horizontal'
        },
        size: {
            sm: 'md',  // Regular size on mobile (more tap area)
            md: 'sm',  // Compact on tablet
            lg: 'sm'   // Compact on desktop
        }
    }
});
```

## CSS Customization

```css
:root {
    --toggle-group-bg: var(--pro-bg-secondary);
    --toggle-group-border: var(--pro-border-color);
    --toggle-group-radius: var(--pro-radius);
    --toggle-btn-bg-active: var(--pro-primary);
    --toggle-btn-color-active: white;
    --toggle-transition-duration: 150ms;
    --toggle-transition-easing: ease;
}
```

## Dependencies

- **Required:** `Funky.Dom`, `Funky.Registry`, `Funky.Events`
- **Optional:** `Funky.PubSub` (namespaced channels), `Funky.Announce` (screen reader), `Funky.MediaQuery` (responsive breakpoints), `Funky.Tooltip` (icon-only hints)

## Cross-Component Integration

### Listening to Toggle Changes

```javascript
// Via global Events
Funky.Events.on('togglegroup:change', function(detail) {
    console.log('Any toggle changed:', detail.value);
});

// Via named event
Funky.Events.on('togglegroup:view_mode:change', function(detail) {
    console.log('View mode changed:', detail.value);
});

// Via PubSub channel
Funky.PubSub.subscribe('togglegroup', 'filters', function(detail) {
    console.log('Filter toggle changed:', detail.value);
});
```

### Table View Mode Example

```javascript
// ToggleGroup for view mode
Funky.ToggleGroup.init('#view-toggle', {
    name: 'view_mode',
    channel: 'table-view',
    options: [
        { value: 'list', label: 'List', icon: 'fa-list' },
        { value: 'grid', label: 'Grid', icon: 'fa-th' }
    ]
});

// Table listens for changes
Funky.Events.on('togglegroup:view_mode:change', function(detail) {
    myTable.setViewMode(detail.value);
});
```

## Data Attributes

| Attribute | Description |
|-----------|-------------|
| `data-toggle-group` | Marks element for auto-initialization |
| `data-options` | JSON array of options |
| `data-name` | Form field name |
| `data-value` | Initial value |
| `data-mode` | `'single'` or `'multiple'` |
| `data-size` | `'sm'`, `'md'`, or `'lg'` |
| `data-variant` | `'default'`, `'outline'`, or `'pills'` |
| `data-orientation` | `'horizontal'` or `'vertical'` |
| `data-allow-empty` | `'true'` or `'false'` |
| `data-disabled` | `'true'` or `'false'` |
| `data-required` | `'true'` or `'false'` |
| `data-equal-width` | `'true'` or `'false'` |
| `data-icon-only` | `'true'` or `'false'` |
| `data-label` | Accessible label |
| `data-channel` | PubSub channel name |
| `data-loading` | `'true'` or `'false'` |

## Advanced Features

### Loading State

Show skeleton placeholders while loading options asynchronously:

```javascript
// Start in loading state
var toggle = Funky.ToggleGroup.init('#container', {
    loading: true,
    loadingSkeletons: 3,
    loadingText: 'Loading options...'
});

// Fetch options and update
fetchOptions().then(function(options) {
    toggle.setOptions(options);
    toggle.setLoading(false);
});
```

```javascript
// Toggle loading state at runtime
toggle.setLoading(true);
// ... async operation ...
toggle.setLoading(false);

// Check loading state
if (toggle.isLoading()) {
    console.log('Still loading...');
}
```

### Badges

Display counts or status indicators on options:

```javascript
Funky.ToggleGroup.init('#container', {
    options: [
        { value: 'inbox', label: 'Inbox', badge: 12 },
        { value: 'spam', label: 'Spam', badge: 3, badgeVariant: 'danger' },
        { value: 'sent', label: 'Sent', badge: 0 }
    ]
});
```

Badge variants: `success`, `warning`, `danger`, `info`

```javascript
// Update badge at runtime
toggle.updateBadge('inbox', 15);
toggle.updateBadge('spam', 5, { variant: 'warning' });

// Hide badge by setting to null or 0
toggle.updateBadge('sent', null);
```

### Separators

Add visual separators between option groups:

```javascript
Funky.ToggleGroup.init('#container', {
    mode: 'multiple',
    options: [
        { value: 'bold', label: 'Bold', icon: 'fa-bold' },
        { value: 'italic', label: 'Italic', icon: 'fa-italic' },
        { type: 'separator' },
        { value: 'left', label: 'Left', icon: 'fa-align-left' },
        { value: 'center', label: 'Center', icon: 'fa-align-center' },
        { value: 'right', label: 'Right', icon: 'fa-align-right' }
    ]
});
```

### Grouped Options

In multiple mode, use `groupBehavior: 'single'` to allow only one selection per group:

```javascript
Funky.ToggleGroup.init('#container', {
    mode: 'multiple',
    groupBehavior: 'single',
    options: [
        { value: 'bold', label: 'Bold', icon: 'fa-bold', group: 'format' },
        { value: 'italic', label: 'Italic', icon: 'fa-italic', group: 'format' },
        { type: 'separator' },
        { value: 'left', label: 'Left', icon: 'fa-align-left', group: 'align' },
        { value: 'center', label: 'Center', icon: 'fa-align-center', group: 'align' },
        { value: 'right', label: 'Right', icon: 'fa-align-right', group: 'align' }
    ]
});
// Selecting 'center' will deselect 'left' or 'right' (same group)
// But 'bold' can be selected independently (different group)
```

### Custom Rendering

Use `renderOption` for complete control over button content:

```javascript
Funky.ToggleGroup.init('#container', {
    options: [
        { value: 'user1', label: 'Alice', avatar: '/avatars/alice.jpg' },
        { value: 'user2', label: 'Bob', avatar: '/avatars/bob.jpg' }
    ],
    renderOption: function(option, isActive, button) {
        return '<img src="' + option.avatar + '" class="avatar">' +
               '<span>' + option.label + '</span>' +
               (isActive ? '<i class="fa fa-check"></i>' : '');
    }
});
```

The `renderOption` function receives:
- `option` - The option object
- `isActive` - Boolean indicating selection state
- `button` - The button element (for advanced manipulation)

### Tooltips

In icon-only mode, tooltips show the label on hover:

```javascript
Funky.ToggleGroup.init('#container', {
    iconOnly: true,
    showTooltips: true,
    tooltipPlacement: 'bottom', // 'top', 'bottom', 'left', 'right'
    options: [
        { value: 'list', label: 'List View', icon: 'fa-list' },
        { value: 'grid', label: 'Grid View', icon: 'fa-th' }
    ]
});
```

Uses `Funky.Tooltip` if available, falls back to native `title` attribute.

### LiveBinding Interface

Bind to external data sources for dynamic updates:

```javascript
var toggle = Funky.ToggleGroup.init('#container', {
    options: initialOptions
});

// Set options from data
toggle.setData([
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' }
]);

// Get current options data
var data = toggle.getData();

// Bind to a data source
toggle.bindTo({
    source: myDataStore,
    event: 'options:updated',
    transform: function(data) {
        return data.map(function(item) {
            return { value: item.id, label: item.name };
        });
    }
});

// Remove binding
toggle.unbind();
```
