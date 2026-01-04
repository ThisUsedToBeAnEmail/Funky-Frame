# Funky.Skeleton

Animated skeleton placeholders for perceived performance during content loading.

## Overview

Skeleton screens show layout structure immediately while content loads, making wait times feel faster than spinners. Funky.Skeleton provides:

- **Preset Types**: table, card, list, text, avatar
- **Custom Templates**: Define your own skeleton HTML
- **Promise Wrapper**: Auto-show/hide around async operations
- **Smooth Transitions**: Fade out skeleton, fade in content
- **Shimmer Animation**: Subtle wave animation for visual feedback
- **Accessibility**: Respects `prefers-reduced-motion`

## Quick Start

### Programmatic

```javascript
// Show skeleton
Funky.Skeleton.show('#content', {
  type: 'table',
  rows: 5,
  columns: 4
});

// Hide when content ready
Funky.Skeleton.hide('#content');
```

### With Async Operations

```javascript
// Automatically show/hide skeleton during fetch
Funky.Skeleton.wrap('#userCard', function() {
  return fetch('/api/user/123').then(r => r.json());
}, { type: 'card' }).then(function(data) {
  renderUserCard(data);
});
```

### Declarative

```html
<div data-skeleton="table" data-skeleton-rows="5" data-skeleton-cols="4">
  <!-- Content loads here -->
</div>

<script>
  Funky.Skeleton.init();
</script>
```

## API Reference

### `Funky.Skeleton.show(container, options)`

Show skeleton in a container.

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element
- `options` (object) - Configuration options

**Returns:** Controller object with `hide()` method

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | `'text'` | Skeleton type: table, card, list, text, avatar, custom |
| `rows` | number | `3` | Number of rows (table, list, text) |
| `columns` | number | `4` | Number of columns (table only) |
| `count` | number | `3` | Number of items (cards only) |
| `avatar` | boolean | `false` | Show avatar in list items |
| `header` | boolean | `true` | Show header row in table |
| `image` | boolean | `true` | Show image placeholder in cards |
| `lines` | number | `3` | Lines of text |
| `size` | string | `'md'` | Avatar size: sm, md, lg |
| `template` | string | `null` | Custom HTML template |
| `fadeOut` | boolean | `true` | Animate skeleton removal |
| `fadeDuration` | number | `200` | Fade duration in ms |

**Example:**
```javascript
const controller = Funky.Skeleton.show('#table', {
  type: 'table',
  rows: 10,
  columns: 5,
  header: true
});

// Later...
controller.hide();
```

### `Funky.Skeleton.hide(container, newContent)`

Hide skeleton and optionally show new content.

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element
- `newContent` (string) - Optional HTML to replace skeleton

**Example:**
```javascript
// Hide and restore original content
Funky.Skeleton.hide('#content');

// Hide and show new content
Funky.Skeleton.hide('#content', '<p>Data loaded!</p>');
```

### `Funky.Skeleton.wrap(container, asyncFn, options)`

Wrap an async operation with automatic skeleton.

**Parameters:**
- `container` (string|HTMLElement) - Container
- `asyncFn` (Function) - Function returning a Promise
- `options` (object) - Skeleton options

**Returns:** Promise that resolves with the async function's result

**Example:**
```javascript
Funky.Skeleton.wrap('#users', function() {
  return fetch('/api/users').then(r => r.json());
}, { type: 'list', avatar: true })
.then(function(users) {
  renderUserList(users);
})
.catch(function(err) {
  showError(err);
});
```

### `Funky.Skeleton.init(scope)`

Initialize declarative skeletons.

**Parameters:**
- `scope` (string|HTMLElement) - Optional container to scope initialization

**Example:**
```javascript
// Initialize all skeletons
Funky.Skeleton.init();

// Initialize within specific container
Funky.Skeleton.init('#mySection');
```

### `Funky.Skeleton.isLoading(container)`

Check if a container has active skeleton.

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element

**Returns:** `boolean` - True if skeleton is active

---

### `Funky.Skeleton.hideAll()`

Hide all active skeletons.

---

### `Funky.Skeleton.getInstance(container)`

Get the controller object for an active skeleton.

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element

**Returns:** `Object|null` - Controller object with `hide()` method, or null if no active skeleton

**Example:**
```javascript
var controller = Funky.Skeleton.getInstance('#content');
if (controller) {
  console.log('Skeleton is active');
  controller.hide();
}
```

---

### `Funky.Skeleton.destroy(container)`

Destroy skeleton (alias for `hide()`).

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element

---

### `Funky.Skeleton.destroyAll()`

Destroy all active skeletons (alias for `hideAll()`).

---

### `Funky.Skeleton.defaults`

Default configuration object. Can be modified to change defaults globally.

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| type | string | 'text' | Default skeleton type |
| rows | number | 3 | Default row count |
| columns | number | 4 | Default column count |
| count | number | 3 | Default item count |
| avatar | boolean | false | Show avatars by default |
| header | boolean | true | Show table headers |
| image | boolean | true | Show card images |
| lines | number | 3 | Default text lines |
| size | string | 'md' | Default avatar size |
| fadeOut | boolean | true | Animate removal |
| fadeDuration | number | 200 | Fade duration in ms |

**Example:**
```javascript
// Change defaults globally
Funky.Skeleton.defaults.fadeDuration = 300;
Funky.Skeleton.defaults.rows = 5;
```

## Skeleton Types

### Table

```javascript
Funky.Skeleton.show('#table', {
  type: 'table',
  rows: 10,
  columns: 5,
  header: true
});
```

### Cards

```javascript
Funky.Skeleton.show('#cards', {
  type: 'card',
  count: 6,
  image: true
});
```

### List

```javascript
Funky.Skeleton.show('#list', {
  type: 'list',
  rows: 8,
  avatar: true
});
```

### Text

```javascript
Funky.Skeleton.show('#article', {
  type: 'text',
  lines: 5
});
```

### Avatar

```javascript
Funky.Skeleton.show('#profile', {
  type: 'avatar',
  size: 'lg'  // sm, md, lg
});
```

### Custom Template

```javascript
Funky.Skeleton.show('#custom', {
  type: 'custom',
  template: `
    <div class="funky-skeleton" style="height: 200px; margin-bottom: 1rem;"></div>
    <div class="funky-skeleton funky-skeleton-text long"></div>
    <div class="funky-skeleton funky-skeleton-text medium"></div>
  `
});
```

## Declarative Attributes

| Attribute | Description |
|-----------|-------------|
| `data-skeleton` | Skeleton type (table, card, list, text, avatar) |
| `data-skeleton-rows` | Number of rows |
| `data-skeleton-cols` | Number of columns |
| `data-skeleton-count` | Number of items |
| `data-skeleton-avatar` | Show avatars (presence attribute) |
| `data-skeleton-header` | Show table header (default: true) |
| `data-skeleton-image` | Show card images (default: true) |
| `data-skeleton-lines` | Lines of text |

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-skeleton` | Base skeleton element with shimmer |
| `.funky-skeleton-text` | Text line skeleton |
| `.funky-skeleton-avatar` | Circle avatar skeleton |
| `.funky-skeleton-table` | Table skeleton wrapper |
| `.funky-skeleton-card` | Card skeleton |
| `.funky-skeleton-list-item` | List item skeleton |
| `.funky-skeleton-loading` | Applied to container while loading |

## Styling

### Custom Colors

```css
:root {
  --skeleton-base: #e9ecef;
  --skeleton-highlight: #f8f9fa;
}

[data-theme="dark"] {
  --skeleton-base: #2d3238;
  --skeleton-highlight: #3d4248;
}
```

### Custom Animation Speed

```css
:root {
  --skeleton-duration: 2s;  /* Slower shimmer */
}
```

## Best Practices

1. **Match Layout**: Skeleton should approximate the real content layout
2. **Use Appropriate Type**: Choose the type that best matches your content
3. **Quick Operations**: For operations < 300ms, consider skipping skeleton
4. **Progressive Loading**: Show skeleton for main content, load details after
5. **Error Handling**: Always hide skeleton on error, show error state

## Accessibility

- Shimmer animation automatically disabled for `prefers-reduced-motion`
- Screen readers ignore skeleton content (decorative)
- Focus management preserved when transitioning

## Browser Support

- Modern browsers: Full support
- IE11: Static skeleton (no animation)
