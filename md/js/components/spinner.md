# Funky.Spinner

Versatile loading spinners with multiple styles, sizes, and theming support.

## Overview

Funky.Spinner provides visual loading indicators with:

- **Multiple Styles**: border, grow, dots, pulse, ring
- **Sizes**: xs, sm, md, lg, xl
- **Color Variants**: primary, secondary, success, warning, danger, info
- **Overlay Mode**: Full-screen spinner with backdrop
- **Container Mode**: Spinner overlay within a container
- **Inline Mode**: Spinners next to text or in buttons
- **Accessibility**: ARIA attributes, reduced motion support

## Quick Start

### Container Spinner

```javascript
// Show spinner in container
Funky.Spinner.show('#content', {
  style: 'border',
  text: 'Loading...'
});

// Hide when done
Funky.Spinner.hide('#content');
```

### Full-Page Overlay

```javascript
const overlay = Funky.Spinner.overlay({
  text: 'Please wait...',
  style: 'dots'
});

// Later...
overlay.hide();
```

### Wrap Async Operation

```javascript
Funky.Spinner.wrap('#userList', function() {
  return fetch('/api/users').then(r => r.json());
}, { style: 'grow' })
.then(renderUsers);
```

## API Reference

### `Funky.Spinner.create(options)`

Create an inline spinner element.

**Parameters:**
- `options` (object) - Spinner configuration

**Returns:** HTMLElement

**Example:**
```javascript
const spinner = Funky.Spinner.create({
  style: 'border',
  size: 'sm',
  variant: 'primary',
  text: 'Loading'
});
button.appendChild(spinner);
```

### `Funky.Spinner.show(container, options)`

Show spinner overlay in a container.

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element
- `options` (object) - Spinner configuration

**Returns:** Controller object with `hide()` method

### `Funky.Spinner.hide(container)`

Hide spinner in a container.

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element

### `Funky.Spinner.overlay(options)`

Show full-page overlay spinner.

**Parameters:**
- `options` (object) - Spinner configuration

**Returns:** Controller object with `hide()` method

### `Funky.Spinner.hideOverlay()`

Hide the full-page overlay spinner.

### `Funky.Spinner.wrap(container, asyncFn, options)`

Wrap an async operation with automatic spinner.

**Parameters:**
- `container` (string|HTMLElement|null) - Container (null for overlay)
- `asyncFn` (Function) - Function returning a Promise
- `options` (object) - Spinner configuration

**Returns:** Promise

### `Funky.Spinner.isLoading(container)`

Check if a container has active spinner.

**Returns:** boolean

### `Funky.Spinner.hideAll()`

Hide all active spinners including overlay.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style` | string | `'border'` | Spinner style: border, grow, dots, pulse, ring |
| `size` | string | `'md'` | Size: xs, sm, md, lg, xl |
| `variant` | string | `'primary'` | Color variant |
| `text` | string | `''` | Optional loading text |
| `srText` | string | `'Loading...'` | Screen reader text |
| `fadeIn` | boolean | `true` | Animate appearance |
| `fadeDuration` | number | `200` | Fade duration in ms |

## Spinner Styles

### Border (default)
Classic rotating border spinner.
```javascript
Funky.Spinner.show('#el', { style: 'border' });
```

### Grow
Pulsing grow/shrink animation.
```javascript
Funky.Spinner.show('#el', { style: 'grow' });
```

### Dots
Three bouncing dots.
```javascript
Funky.Spinner.show('#el', { style: 'dots' });
```

### Pulse
Expanding pulse rings.
```javascript
Funky.Spinner.show('#el', { style: 'pulse' });
```

### Ring
Segmented rotating ring.
```javascript
Funky.Spinner.show('#el', { style: 'ring' });
```

## Sizes

```javascript
// Extra small (1rem)
Funky.Spinner.create({ size: 'xs' });

// Small (1.5rem)
Funky.Spinner.create({ size: 'sm' });

// Medium (2rem) - default
Funky.Spinner.create({ size: 'md' });

// Large (3rem)
Funky.Spinner.create({ size: 'lg' });

// Extra large (4rem)
Funky.Spinner.create({ size: 'xl' });
```

## Color Variants

```javascript
Funky.Spinner.create({ variant: 'primary' });   // Blue
Funky.Spinner.create({ variant: 'secondary' }); // Gray
Funky.Spinner.create({ variant: 'success' });   // Green
Funky.Spinner.create({ variant: 'warning' });   // Yellow
Funky.Spinner.create({ variant: 'danger' });    // Red
Funky.Spinner.create({ variant: 'info' });      // Cyan
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-spinner` | Base spinner element |
| `.funky-spinner-border` | Border style |
| `.funky-spinner-grow` | Grow style |
| `.funky-spinner-dots` | Dots style |
| `.funky-spinner-pulse` | Pulse style |
| `.funky-spinner-ring` | Ring style |
| `.funky-spinner-{size}` | Size variant (xs, sm, md, lg, xl) |
| `.funky-spinner-{variant}` | Color variant |
| `.funky-spinner-container` | Container with spinner |
| `.funky-spinner-overlay` | Full-page overlay |
| `.funky-spinner-inline` | Inline spinner wrapper |

## Styling

### Custom Colors

```css
:root {
  --spinner-color: #0d6efd;
}
```

### Custom Overlay Background

```css
:root {
  --spinner-overlay-bg: rgba(255, 255, 255, 0.9);
}

[data-theme="dark"] {
  --spinner-overlay-bg: rgba(0, 0, 0, 0.8);
}
```

### Custom Animation Speed

```css
:root {
  --spinner-duration: 1s;
}
```

## Button Integration

```html
<button class="btn btn-primary" disabled>
  <div class="funky-spinner funky-spinner-border funky-spinner-sm"></div>
  Saving...
</button>
```

Or programmatically:
```javascript
button.disabled = true;
const spinner = Funky.Spinner.create({ size: 'xs' });
button.prepend(spinner);

// Later
spinner.remove();
button.disabled = false;
```

## Accessibility

- All spinners have `role="status"` and `aria-live="polite"`
- Screen reader text included (visually hidden)
- Animation respects `prefers-reduced-motion`
- Overlay traps focus (full-page mode)

## Browser Support

- Modern browsers: Full support
- IE11: Basic support (no conic-gradient for ring style)
