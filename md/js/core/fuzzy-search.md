# Funky.FuzzySearch

A lightweight fuzzy search library for approximate string matching with scoring and highlighting.

## Overview

`Funky.FuzzySearch` provides fuzzy matching capabilities for searching text with typo tolerance. It uses a character-by-character matching algorithm that scores results based on:

- Consecutive character matches (bonus points)
- Match position (earlier matches score higher)
- Case-sensitive exact matches (bonus points)

## Installation

FuzzySearch is part of the Funky core and is automatically available when you include `funky.js`:

```html
<script src="/assets/js/core/fuzzy-search.js"></script>
```

## Quick Start

```javascript
// Single match
var result = Funky.FuzzySearch.match('usr', 'Users');
// { score: 0.75, matches: [[0,0], [1,1], [2,2]] }

// Search array
var users = [
    { name: 'John Smith', email: 'john@example.com' },
    { name: 'Jane Doe', email: 'jane@example.com' }
];

var results = Funky.FuzzySearch.search('jhn', users, { keys: ['name', 'email'] });
// Returns matches sorted by score
```

## API Reference

### Core Methods

#### `match(query, text, options)`

Performs fuzzy matching between a query and target text.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `query` | string | - | The search query |
| `text` | string | - | The text to match against |
| `options.caseSensitive` | boolean | `false` | Enable case-sensitive matching |

**Returns:** `{ score: number, matches: Array } | null`

- `score`: Match quality from 0 to 1
- `matches`: Array of `[start, end]` position tuples

**Example:**
```javascript
var result = Funky.FuzzySearch.match('prj', 'Project');
// { score: 0.65, matches: [[0,0], [1,1], [2,2]] }

// Case sensitive
var result = Funky.FuzzySearch.match('Prj', 'Project', { caseSensitive: true });
// { score: 0.85, matches: [[0,0], [1,1], [2,2]] }
```

---

#### `search(query, items, options)`

Search an array of items and return matches sorted by score.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `query` | string | - | The search query |
| `items` | Array | - | Array of items to search |
| `options.keys` | Array | - | Property names to search (for objects) |
| `options.threshold` | number | `0.3` | Minimum score (0-1) to include |
| `options.limit` | number | `Infinity` | Maximum results to return |
| `options.tokenize` | boolean | `false` | Split query into word tokens |
| `options.caseSensitive` | boolean | `false` | Case-sensitive matching |

**Returns:** Array of result objects:
```javascript
{
    item: Object,      // Original item
    score: number,     // Match score (0-1)
    matches: Array,    // Position tuples
    key: string        // Which key matched (for objects)
}
```

**Example:**
```javascript
var items = [
    { title: 'Getting Started', category: 'intro' },
    { title: 'Advanced Topics', category: 'advanced' },
    { title: 'API Reference', category: 'reference' }
];

var results = Funky.FuzzySearch.search('gttng', items, {
    keys: ['title', 'category'],
    threshold: 0.3,
    limit: 10
});

results.forEach(function(r) {
    console.log(r.item.title + ': ' + Math.round(r.score * 100) + '%');
});
```

---

#### `substring(query, text)`

Simple substring match with position tracking (case-insensitive).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `query` | string | The search query |
| `text` | string | The text to search in |

**Returns:** `{ score: number, matches: Array } | null`

**Example:**
```javascript
var result = Funky.FuzzySearch.substring('set', 'Settings');
// { score: 1, matches: [[0,2]] }
```

---

#### `tokenMatch(query, text)`

Match multi-word queries where each token must match.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `query` | string | Space-separated tokens |
| `text` | string | The text to match against |

**Returns:** `{ score: number, matches: Array } | null`

**Example:**
```javascript
var result = Funky.FuzzySearch.tokenMatch('user admin', 'User Administration Panel');
// Returns match with all token positions
```

---

#### `create(options)`

Create a pre-configured search instance for repeated searches with optional recent search history.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options.keys` | Array | - | Property names to search |
| `options.threshold` | number | `0.3` | Minimum score |
| `options.tokenize` | boolean | `false` | Enable tokenization |
| `options.matchAllTokens` | boolean | `false` | Require all tokens to match (when tokenize=true) |
| `options.caseSensitive` | boolean | `false` | Enable case-sensitive matching |
| `options.recentKey` | string | `null` | Storage key for recent searches (enables feature) |
| `options.maxRecent` | number | `5` | Max recent searches to track |
| `options.showRecent` | boolean | `true` | Show recent when query is empty |
| `options.recentLabel` | string | `'Recent'` | Label for recent section |
| `options.onRecentSelect` | function | `null` | Callback when recent item selected |

**Returns:** Search instance with methods below

**Instance Methods:**
| Method | Description |
|--------|-------------|
| `search(query, items, opts)` | Search array of items |
| `match(query, text, opts)` | Match query against single text |
| `substring(query, text, opts)` | Simple substring match |
| `addToRecent(query)` | Add a search query to recent history |
| `getRecent()` | Get array of recent searches |
| `clearRecent()` | Clear recent searches |
| `searchWithRecent(query, items, opts)` | Get results with recent when query empty |
| `getOptions()` | Get current instance options |

**Example:**
```javascript
var searcher = Funky.FuzzySearch.create({
    keys: ['name', 'email'],
    threshold: 0.4,
    tokenize: true,
    recentKey: 'user_search_history',
    maxRecent: 10
});

// Search with results
var results = searcher.search('john', users);

// Remember successful searches
searcher.addToRecent('john');

// Get search with recent (useful for dropdowns)
var { results, recent, isRecent } = searcher.searchWithRecent(query, users);
if (isRecent) {
    renderRecentSearches(recent);
} else {
    renderResults(results);
}

// Reuse with different data
var results1 = searcher.search('john', users);
var results2 = searcher.search('jane', users);
```

## Scoring Algorithm

The fuzzy match score is calculated based on:

1. **Character Match Ratio**: Matched characters / query length
2. **Consecutive Bonus**: +0.2 for each consecutive match
3. **Start Bonus**: +0.15 for matches at the beginning
4. **Camel Case Bonus**: +0.1 for matching at camel case boundaries
5. **Exact Match Bonus**: +0.25 for case-sensitive exact matches

Final score is normalized to 0-1 range.

## Threshold Guidelines

| Threshold | Use Case |
|-----------|----------|
| `0.1` | Very lenient, catches most typos |
| `0.3` | Default, good balance |
| `0.5` | Stricter, fewer false positives |
| `0.7` | Very strict, near-exact matches only |

## Component Integration

Several Funky components support FuzzySearch:

### VirtualisedList

```javascript
new Funky.VirtualisedList('#list', {
    data: items,
    fuzzySearch: true,
    fuzzyThreshold: 0.3,
    highlightMatches: true
});
```

### TreeView

```javascript
new Funky.TreeView('#tree', {
    data: nodes,
    showSearch: true,
    fuzzySearch: true,
    autoExpandMatches: true
});
```

### SideNav

```javascript
new Funky.SideNav('#nav', {
    items: navItems,
    searchable: true,
    fuzzySearch: true
});
```

### Kanban

```javascript
new Funky.Kanban('#board', {
    fuzzySearch: true,
    searchableFields: ['title', 'description'],
    sortMatchesByScore: true
});
```

### Highlight

The `Funky.Highlight` component provides deep integration with FuzzySearch for highlighting matches in DOM content.

#### Basic Fuzzy Highlighting

```javascript
// Highlight text using fuzzy match positions
var html = Funky.Highlight.markWithPositions('User Settings', [[0,0], [5,7]]);
// '<mark class="highlight">U</mark>ser <mark class="highlight">Set</mark>tings'

// Alias for convenience
var html = Funky.Highlight.fromMatches('User Settings', [[0,0], [5,7]]);
```

#### With FuzzySearch Results

```javascript
// Use directly with FuzzySearch.match() result
var html = Funky.Highlight.fuzzyMark('Settings', 'set');
// '<mark class="highlight">Set</mark>tings'

// With custom options
var html = Funky.Highlight.fuzzyMark('Settings', 'SET', {
    className: 'search-match',
    caseSensitive: true
});
```

#### DOM-Based Fuzzy Highlighting

```javascript
// Apply fuzzy highlighting to a container
var instance = Funky.Highlight.fuzzyApply(element, 'usr stng', {
    threshold: 0.3,
    className: 'highlight',
    activeClassName: 'highlight-active'
});

// Navigation
instance.next();         // Jump to next match
instance.prev();         // Jump to previous match
instance.scrollToFirst(); // Scroll to first match
instance.goTo(3);        // Jump to specific index

// Info
instance.getCount();     // Total match count
instance.getCurrentIndex(); // Current position

// Cleanup
instance.clear();        // Remove all highlighting
```

#### Custom FuzzyHighlightInstance

```javascript
// Create with custom threshold
var instance = new Funky.Highlight.FuzzyHighlightInstance(
    element,   // Container element
    'search',  // Query string
    {          // Options
        className: 'highlight',
        activeClassName: 'highlight-active',
        maxMatches: 100
    },
    0.4        // Fuzzy threshold (0-1)
);

instance.highlight();  // Re-highlight (called automatically)
instance.getCount();   // Number of matches
```

## Best Practices

### 1. Choose Appropriate Threshold

```javascript
// For autocomplete - be lenient
Funky.FuzzySearch.search(query, items, { threshold: 0.2 });

// For filtering - be stricter
Funky.FuzzySearch.search(query, items, { threshold: 0.5 });
```

### 2. Limit Search Fields

```javascript
// Search only relevant fields
Funky.FuzzySearch.search(query, users, {
    keys: ['name', 'username'],  // Not 'id', 'createdAt', etc.
    threshold: 0.3
});
```

### 3. Use Tokenization for Phrases

```javascript
// "john smith" matches "John Smith" and "Smith, John"
Funky.FuzzySearch.search('john smith', users, {
    keys: ['fullName'],
    tokenize: true
});
```

### 4. Cache Search Instances

```javascript
// Create once, reuse
var userSearcher = Funky.FuzzySearch.create({
    keys: ['name', 'email'],
    threshold: 0.3
});

// Efficient repeated searches
input.addEventListener('input', function() {
    var results = userSearcher.search(this.value, users);
    renderResults(results);
});
```

## Performance

- **Small datasets (< 1000 items)**: Real-time search is fast
- **Medium datasets (1000-10000 items)**: Consider debouncing input
- **Large datasets (> 10000 items)**: Consider server-side search or Web Workers

## Browser Support

Works in all browsers that support ES5:
- Chrome 23+
- Firefox 21+
- Safari 6+
- Edge 12+
- IE 10+ (with polyfills)

## Related

- [Highlight](../components/highlight.md) - Text highlighting with fuzzy support
- [VirtualisedList](../components/virtualised-list.md) - Virtual scrolling with search
- [TreeView](../components/tree-view.md) - Tree navigation with filter
- [Kanban](../components/kanban.md) - Card-based workflow board
- [Funky.Keyboard](./keyboard.md) - Keyboard shortcut management
