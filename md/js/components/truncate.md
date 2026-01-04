# Funky.Truncate

Smart text truncation component with show more/less toggle functionality.

## Overview

`Funky.Truncate` provides elegant text truncation with two modes:
- **Character-based**: Truncates after a specified number of characters
- **Line-based**: Uses CSS line-clamp to limit visible lines

## Quick Start

```javascript
// Character-based truncation
Funky.Truncate.apply('#my-text', {
  limit: 100,
  moreText: 'Show more',
  lessText: 'Show less'
});

// Line-clamp truncation
Funky.Truncate.apply('#my-paragraph', {
  lines: 3
});
```

## Data Attribute Initialization

```html
<!-- Character-based -->
<p data-truncate="100">
  Long text that will be truncated after 100 characters...
</p>

<!-- Line-based -->
<p data-truncate-lines="3">
  Multi-line text that will be clamped to 3 lines...
</p>
```

```javascript
// Auto-initialize all data attribute elements
Funky.Truncate.initAll();

// Or within a specific container
Funky.Truncate.initAll(document.getElementById('my-container'));
```

## API Reference

### Funky.Truncate.apply(selector, options)

Apply truncation to an element.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `selector` | `string\|Element` | CSS selector or DOM element |
| `options` | `Object` | Configuration options |

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | `number` | `100` | Character limit (character mode) |
| `lines` | `number` | `null` | Line limit 1-5 (line mode, overrides limit) |
| `moreText` | `string` | `'Show more'` | Toggle button text when collapsed |
| `lessText` | `string` | `'Show less'` | Toggle button text when expanded |
| `ellipsis` | `string` | `'...'` | Ellipsis string (character mode) |
| `animate` | `boolean` | `true` | Enable smooth transitions |
| `inline` | `boolean` | `false` | Inline mode for character truncation |
| `expandedClass` | `string` | `'expanded'` | Class added when expanded |

**Returns:** `TruncateInstance` - The truncate instance

**Example:**
```javascript
const instance = Funky.Truncate.apply('#description', {
  limit: 150,
  moreText: 'Read more →',
  lessText: '← Show less',
  ellipsis: '…'
});
```

### Funky.Truncate.expand(selector)

Expand truncated text to show full content.

```javascript
Funky.Truncate.expand('#my-text');
```

### Funky.Truncate.collapse(selector)

Collapse text back to truncated state.

```javascript
Funky.Truncate.collapse('#my-text');
```

### Funky.Truncate.toggle(selector)

Toggle between expanded and collapsed states.

```javascript
Funky.Truncate.toggle('#my-text');
```

### Funky.Truncate.destroy(selector)

Remove truncation and restore original text.

```javascript
Funky.Truncate.destroy('#my-text');
```

### Funky.Truncate.isExpanded(selector)

Check if text is currently expanded.

```javascript
if (Funky.Truncate.isExpanded('#my-text')) {
  console.log('Text is fully visible');
}
```

### Funky.Truncate.text(text, limit, ellipsis)

Utility function to truncate a string without DOM manipulation.

```javascript
const short = Funky.Truncate.text(
  'This is a very long text that needs truncating',
  20,
  '...'
);
// Returns: "This is a very long..."
```

### Funky.Truncate.initAll(container)

Auto-initialize all elements with `data-truncate` or `data-truncate-lines` attributes.

```javascript
// Initialize entire document
Funky.Truncate.initAll();

// Initialize specific container
Funky.Truncate.initAll(document.getElementById('content'));
```

## Events

The component dispatches custom events on the truncated element:

| Event | Description |
|-------|-------------|
| `truncate:expand` | Fired when text is expanded |
| `truncate:collapse` | Fired when text is collapsed |

```javascript
element.addEventListener('funky.truncate.expand', function(e) {
  console.log('Text expanded');
});

element.addEventListener('funky.truncate.collapse', function(e) {
  console.log('Text collapsed');
});
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-truncate` | Base class applied to truncated elements |
| `.funky-truncate-lines` | Applied for line-clamp mode |
| `.funky-truncate-lines-{1-5}` | Specific line limit class |
| `.funky-truncate-block` | Block display for character mode |
| `.funky-truncate-inline` | Inline display for character mode |
| `.funky-truncate-toggle` | Toggle button styling |
| `.funky-truncate-ellipsis` | Ellipsis styling |
| `.expanded` | Added when text is fully expanded |
| `.animate` | Enables smooth transitions |

## Theming

The component respects the application's theme variables:

```css
/* Toggle button uses accent color */
.funky-truncate-toggle {
  color: var(--pro-accent-primary);
}

/* Hover state */
.funky-truncate-toggle:hover {
  color: var(--pro-accent-primary-dark);
}
```

### Density Support

The component responds to density settings:

```css
[data-density="compact"] .funky-truncate-toggle {
  font-size: 0.75rem;
  padding: 0.125rem 0;
}

[data-density="spacious"] .funky-truncate-toggle {
  font-size: 0.9375rem;
  padding: 0.375rem 0;
}
```

### Even Funkyer Theme

In Even Funkyer mode, the toggle button gets a gradient effect:

```css
.even-funkyer .funky-truncate-toggle {
  background: linear-gradient(135deg, var(--funky-primary), var(--funky-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Examples

### Basic Character Truncation

```html
<p id="description">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
</p>

<script>
Funky.Truncate.apply('#description', { limit: 80 });
</script>
```

### Multi-line Truncation

```html
<div id="article-preview" class="article-card">
  <p>
    Long article content that should be clamped to exactly 
    three lines with a show more button appearing below...
  </p>
</div>

<script>
Funky.Truncate.apply('#article-preview p', { lines: 3 });
</script>
```

### Inline Truncation

```html
<span id="inline-text">This is inline text that gets truncated</span>

<script>
Funky.Truncate.apply('#inline-text', { 
  limit: 30, 
  inline: true 
});
</script>
```

### Card Grid with Truncated Descriptions

```javascript
document.querySelectorAll('.card-description').forEach(function(el) {
  Funky.Truncate.apply(el, {
    lines: 2,
    moreText: 'More',
    lessText: 'Less'
  });
});
```

### Dynamic Content

```javascript
// Apply truncation after loading content
fetch('/api/article')
  .then(response => response.json())
  .then(article => {
    document.getElementById('content').textContent = article.body;
    Funky.Truncate.apply('#content', { limit: 200 });
  });

// Destroy and re-apply on update
function updateContent(newText) {
  Funky.Truncate.destroy('#content');
  document.getElementById('content').textContent = newText;
  Funky.Truncate.apply('#content', { limit: 200 });
}
```

## Best Practices

1. **Choose the right mode**: Use line-clamp for consistent visual layouts, character limit for precise text length control.

2. **Consider mobile**: Line-clamp works better on responsive layouts as it adapts to container width.

3. **Meaningful toggle text**: Use contextual text like "Read more" or "Show details" rather than generic "More".

4. **Clean up**: Call `destroy()` before removing elements or re-applying truncation.

5. **XSS Safety**: The component escapes HTML in text content to prevent XSS attacks.

## Browser Support

- Modern browsers with CSS line-clamp support
- Fallback for older browsers using max-height approximation
- IE11 falls back to character-based truncation for line mode
