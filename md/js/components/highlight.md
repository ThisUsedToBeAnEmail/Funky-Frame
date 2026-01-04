# Funky.Highlight

Text highlighting component for search terms and keywords within content.

## Overview

`Funky.Highlight` provides efficient text highlighting with support for:
- Single or multiple search terms
- Case sensitive/insensitive matching
- Whole word or partial matching
- Navigation between matches
- HTML-safe operation (preserves existing markup)
- Performance optimized using TreeWalker

## Quick Start

```javascript
// Highlight single term
Funky.Highlight.apply('#content', 'search term');

// Highlight multiple terms (different colors each)
Funky.Highlight.apply('#content', ['term1', 'term2', 'term3']);

// Clear highlights
Funky.Highlight.clear('#content');
```

## API Reference

### Funky.Highlight.apply(selector, terms, options)

Apply highlighting to an element.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `selector` | `string\|Element` | CSS selector or DOM element |
| `terms` | `string\|string[]` | Term(s) to highlight |
| `options` | `Object` | Configuration options |

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `className` | `string` | `'funky-highlight'` | Base CSS class for highlights |
| `currentClass` | `string` | `'funky-highlight-current'` | Class for current/focused match |
| `caseSensitive` | `boolean` | `false` | Case sensitive matching |
| `wholeWord` | `boolean` | `false` | Match whole words only |
| `maxMatches` | `number` | `1000` | Maximum matches (performance limit) |
| `animate` | `boolean` | `true` | Enable fade-in animation |

**Returns:** `HighlightInstance` - The highlight instance

**Example:**
```javascript
const instance = Funky.Highlight.apply('#article', ['javascript', 'typescript'], {
  caseSensitive: false,
  wholeWord: true,
  animate: true
});

console.log('Found', instance.getCount(), 'matches');
```

### Funky.Highlight.clear(selector)

Remove all highlights and restore original content.

```javascript
Funky.Highlight.clear('#content');
```

### Funky.Highlight.next(selector)

Navigate to the next match and scroll it into view.

```javascript
const match = Funky.Highlight.next('#content');
```

**Returns:** `Element|null` - The current match element

### Funky.Highlight.prev(selector)

Navigate to the previous match and scroll it into view.

```javascript
const match = Funky.Highlight.prev('#content');
```

**Returns:** `Element|null` - The current match element

### Funky.Highlight.scrollToFirst(selector)

Scroll to and highlight the first match.

```javascript
Funky.Highlight.scrollToFirst('#content');
```

### Funky.Highlight.goTo(selector, index)

Navigate to a specific match by index.

```javascript
Funky.Highlight.goTo('#content', 5); // Go to 6th match (0-indexed)
```

### Funky.Highlight.count(selector, terms, options)

Count matches in element.

```javascript
// Count with existing highlights
const count = Funky.Highlight.count('#content');

// Count for specific terms (without highlighting)
const count = Funky.Highlight.count('#content', 'search term');
```

### Funky.Highlight.getCurrentIndex(selector)

Get the current match index.

```javascript
const index = Funky.Highlight.getCurrentIndex('#content');
// Returns -1 if no match is currently selected
```

### Funky.Highlight.hasHighlights(selector)

Check if element has active highlights.

```javascript
if (Funky.Highlight.hasHighlights('#content')) {
  // Show navigation UI
}
```

### Funky.Highlight.mark(text, terms, options)

Utility function to mark a plain text string (returns HTML).

```javascript
const html = Funky.Highlight.mark('Some text here', 'text');
// Returns: 'Some <mark class="funky-highlight" data-term-index="0">text</mark> here'

// Safe - automatically escapes HTML
const html = Funky.Highlight.mark('<script>alert(1)</script>', 'script');
// Returns escaped, safe HTML
```

## Events

The component dispatches custom events on the highlighted element:

| Event | Description | Detail |
|-------|-------------|--------|
| `highlight:applied` | Highlights were applied | `{ count, terms }` |
| `highlight:cleared` | Highlights were removed | - |
| `highlight:navigate` | Navigation occurred | `{ index, total, element }` |

```javascript
element.addEventListener('funky.highlight.navigate', function(e) {
  console.log('Match', e.detail.index + 1, 'of', e.detail.total);
});

element.addEventListener('funky.highlight.applied', function(e) {
  console.log('Found', e.detail.count, 'matches for', e.detail.terms);
});
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-highlight` | Base highlight styling |
| `.funky-highlight-current` | Currently focused match |
| `.funky-highlight[data-term-index="N"]` | Nth term color (0-4) |
| `.funky-highlight.animate` | With fade-in animation |
| `.funky-highlight-counter` | Match counter UI element |
| `.funky-highlight-nav` | Navigation buttons container |

## Multiple Term Colors

Each search term gets a different highlight color:

| Term Index | Color |
|------------|-------|
| 0 | Warning (yellow) |
| 1 | Info (cyan) |
| 2 | Success (green) |
| 3 | Primary (blue) |
| 4 | Danger (red) |

```javascript
// Each term gets different color
Funky.Highlight.apply('#content', ['error', 'warning', 'info', 'debug', 'trace']);
```

## Theming

The component respects theme variables:

```css
/* Base highlight uses warning background */
.funky-highlight {
  background-color: var(--pro-accent-warning-bg);
}

/* Current match uses solid color */
.funky-highlight-current {
  background-color: var(--pro-accent-warning);
  outline: 2px solid var(--pro-accent-warning-dark);
}
```

### Dark Theme

In dark theme, highlight backgrounds are slightly more opaque for visibility.

### Even Funkyer Theme

In Even Funkyer mode, highlights get a gradient effect:

```css
.even-funkyer .funky-highlight {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 193, 7, 0.3));
}
```

### Density Support

The component responds to density settings:

```css
[data-density="compact"] .funky-highlight {
  padding: 0 0.0625rem;
}

[data-density="spacious"] .funky-highlight {
  padding: 0.0625rem 0.1875rem;
}
```

## Examples

### Search Results Highlighting

```javascript
const searchInput = document.getElementById('search');
const results = document.getElementById('results');

searchInput.addEventListener('input', function() {
  const term = this.value.trim();
  
  if (term.length >= 2) {
    Funky.Highlight.apply(results, term);
    Funky.Highlight.scrollToFirst(results);
  } else {
    Funky.Highlight.clear(results);
  }
});
```

### Navigation UI

```html
<div class="search-bar">
  <input type="text" id="search">
  <div class="funky-highlight-nav">
    <button id="prev-match"><i class="fas fa-chevron-up"></i></button>
    <button id="next-match"><i class="fas fa-chevron-down"></i></button>
  </div>
  <span class="funky-highlight-counter">
    <span class="current" id="match-current">0</span> / 
    <span id="match-total">0</span>
  </span>
</div>

<script>
const content = document.getElementById('content');

function updateCounter() {
  const instance = Funky.Highlight.apply(content, searchInput.value);
  document.getElementById('match-total').textContent = instance.getCount();
  document.getElementById('match-current').textContent = 
    Math.max(0, instance.getCurrentIndex() + 1);
}

document.getElementById('prev-match').onclick = function() {
  Funky.Highlight.prev(content);
  updateCounter();
};

document.getElementById('next-match').onclick = function() {
  Funky.Highlight.next(content);
  updateCounter();
};
</script>
```

### DataTable Integration

```javascript
// Highlight filter matches in table cells
$('#myTable').on('search.dt', function() {
  const searchTerm = $('#myTable_filter input').val();
  
  $('#myTable tbody td').each(function() {
    if (searchTerm) {
      Funky.Highlight.apply(this, searchTerm);
    } else {
      Funky.Highlight.clear(this);
    }
  });
});
```

### Keyboard Navigation

```javascript
document.addEventListener('keydown', function(e) {
  // Ctrl+G or F3 for next match
  if ((e.ctrlKey && e.key === 'g') || e.key === 'F3') {
    e.preventDefault();
    Funky.Highlight.next('#content');
  }
  
  // Ctrl+Shift+G or Shift+F3 for previous match
  if ((e.ctrlKey && e.shiftKey && e.key === 'G') || (e.shiftKey && e.key === 'F3')) {
    e.preventDefault();
    Funky.Highlight.prev('#content');
  }
  
  // Escape to clear
  if (e.key === 'Escape') {
    Funky.Highlight.clear('#content');
  }
});
```

## Best Practices

1. **Performance**: Set `maxMatches` for large documents to prevent UI freezing.

2. **Clear on change**: Always clear highlights before applying new ones (done automatically by `apply()`).

3. **Minimum length**: Require at least 2-3 characters before highlighting to avoid too many matches.

4. **Debounce input**: Debounce search input to avoid excessive re-highlighting.

5. **HTML preservation**: The component preserves existing HTML structure - it only operates on text nodes.

## Browser Support

- All modern browsers
- Uses TreeWalker for efficient DOM traversal
- No external dependencies
