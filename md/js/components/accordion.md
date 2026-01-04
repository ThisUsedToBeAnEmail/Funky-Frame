# Funky.Accordion - Collapsible Panel System

Accessible accordion component with data-driven rendering, fuzzy search filtering, lazy loading, keyboard navigation, and full CSS theming.

## Overview

`Funky.Accordion` provides collapsible panel sections for FAQs, settings, documentation, and hierarchical content. Supports single/multi-expand modes, nested items, lazy loading, and search filtering.

## API Reference

### Factory Methods

#### `Accordion.init(container, options)`

Initialize a new accordion instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|Element | Yes | CSS selector or DOM element |
| options | object | No | Configuration options |

**Returns:** AccordionInstance

**Example:**
```javascript
var accordion = Funky.Accordion.init('#container', {
    items: [
        { id: 'section-1', title: 'Getting Started', content: '<p>Welcome!</p>' },
        { id: 'section-2', title: 'Configuration', content: '<p>Options...</p>' }
    ]
});
```

---

#### `Accordion.getInstance(id)`

Get an accordion instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Instance ID |

**Returns:** AccordionInstance or null

---

#### `Accordion.destroy(id)`

Destroy an accordion instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Instance ID |

---

#### `Accordion.getInstances()`

Get all accordion instances.

**Returns:** Object with instance IDs as keys

---

#### `Accordion.destroyAll()`

Destroy all accordion instances.

---

### Instance Methods

#### `expand(id)`

Expand a panel by item ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to expand |

**Returns:** `this` (chainable)

---

#### `collapse(id)`

Collapse a panel by item ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to collapse |

**Returns:** `this` (chainable)

---

#### `toggle(id)`

Toggle a panel's expanded/collapsed state.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to toggle |

**Returns:** `this` (chainable)

---

#### `isExpanded(id)`

Check if a panel is expanded.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to check |

**Returns:** `boolean`

---

#### `getExpanded()`

Get array of expanded item IDs.

**Returns:** `string[]`

---

#### `expandAll(options)`

Expand all panels.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| skipDisabled | boolean | true | Skip disabled items |
| skipLazy | boolean | false | Skip lazy-load items |

**Returns:** `this` (chainable)

---

#### `collapseAll(options)`

Collapse all panels.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| skipDisabled | boolean | true | Skip disabled items |

**Returns:** `this` (chainable)

---

#### `toggleAll()`

Toggle all panels (expand if any collapsed, collapse if all expanded).

**Returns:** `this` (chainable)

---

#### `setItems(items)`

Replace all items and re-render.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| items | array | Yes | Array of item objects |

**Returns:** `this` (chainable)

---

#### `addItem(item, index)`

Add a new item.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| item | object | Yes | Item to add |
| index | number | No | Position (default: end) |

**Returns:** `this` (chainable)

---

#### `removeItem(id)`

Remove an item by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to remove |

**Returns:** `this` (chainable)

---

#### `updateItem(id, updates)`

Update an item's properties.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to update |
| updates | object | Yes | Properties to update |

**Returns:** `this` (chainable)

---

#### `getItem(id)`

Get an item by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID |

**Returns:** Item object or null

---

#### `getItems()`

Get all items.

**Returns:** `array`

---

#### `disable(id)`

Disable an item (prevent expand/collapse).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to disable |

**Returns:** `this` (chainable)

---

#### `enable(id)`

Enable a disabled item.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to enable |

**Returns:** `this` (chainable)

---

#### `isDisabled(id)`

Check if an item is disabled.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID to check |

**Returns:** `boolean`

---

#### `search(query)`

Filter items by search query.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Search query |

**Returns:** `this` (chainable)

---

#### `clearSearch()`

Clear search and show all items.

**Returns:** `this` (chainable)

---

#### `scrollTo(id, options)`

Scroll an item into view.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Item ID |
| options | object | No | scrollIntoView options |

**Returns:** `this` (chainable)

---

#### `refresh()`

Re-render the accordion.

**Returns:** `this` (chainable)

---

#### `destroy()`

Destroy the instance and clean up.

---

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| items | array | `[]` | Array of item objects |
| allowMultiple | boolean | `true` | Allow multiple panels open |
| expandFirst | boolean | `false` | Expand first item on init |
| collapsible | boolean | `true` | Allow all panels collapsed |
| animated | boolean | `true` | Enable animations |
| animationDuration | number | `300` | Animation duration (ms) |
| useMorph | boolean | `true` | Use Funky.Morph if available |
| keyboard | boolean | `true` | Enable keyboard navigation |
| wrapNavigation | boolean | `true` | Wrap at ends with arrow keys |
| focusOnExpand | boolean | `false` | Focus panel content on expand |
| hashNavigation | boolean | `false` | Sync with URL hash |
| hashPrefix | string | `'accordion-'` | URL hash prefix |
| iconPosition | string | `'right'` | Chevron position: 'left' or 'right' |
| expandIcon | string | `'fas fa-chevron-down'` | Expand icon class |
| collapseIcon | string | `null` | Collapse icon (null = rotate expandIcon) |
| headerTemplate | function | `null` | Custom header renderer |
| contentTemplate | function | `null` | Custom content renderer |
| truncateHeader | number | `null` | Max header characters |
| searchable | boolean | `false` | Show built-in search input |
| searchInput | string | `null` | External search input selector |
| searchPlaceholder | string | `'Search...'` | Search input placeholder |
| searchKeys | array | `['title']` | Item properties to search |
| searchThreshold | number | `0.3` | Fuzzy match threshold (0-1) |
| highlightMatches | boolean | `true` | Highlight search matches |
| searchDebounce | number | `150` | Search debounce delay (ms) |
| emptyStateMessage | string | `'No results found'` | Empty state message |
| emptyStateIcon | string | `'fas fa-search'` | Empty state icon |
| emptyStateAction | object | `null` | Empty state action button |
| nestedIndent | number | `16` | Indent per nesting level (px) |
| maxNestingLevel | number | `5` | Maximum nesting depth |
| onLazyLoad | function | `null` | Async content loader |
| loadingIndicator | string | `'spinner'` | 'spinner', 'skeleton', or 'none' |
| skeletonLines | number | `3` | Skeleton loader lines |
| loadingText | string | `'Loading...'` | Loading indicator text |
| truncateContent | object | `null` | Content truncation options |

### Item Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| title | string | Yes | Header text |
| content | string\|Element | No | Panel content |
| expanded | boolean | No | Initial expanded state |
| disabled | boolean | No | Prevent interaction |
| icon | string | No | Header icon class |
| badge | string\|object | No | Header badge |
| lazyLoad | boolean | No | Load content on first expand |
| children | array | No | Nested accordion items |

**Badge Object:**
| Property | Type | Description |
|----------|------|-------------|
| text | string | Badge text |
| variant | string | 'primary', 'success', 'warning', 'danger' |

---

## Events

Listen on the container element:

```javascript
var container = document.querySelector('#my-accordion');

container.addEventListener('funky.accordion.expand', function(e) {
    console.log('Expanded:', e.detail.id, e.detail.item);
});
```

| Event | Payload | Description |
|-------|---------|-------------|
| `funky.accordion.init` | `{ instance }` | Accordion initialized |
| `funky.accordion.beforeExpand` | `{ id, item, cancel() }` | Before expand (cancelable) |
| `funky.accordion.expand` | `{ id, item }` | Panel expanded |
| `funky.accordion.beforeCollapse` | `{ id, item, cancel() }` | Before collapse (cancelable) |
| `funky.accordion.collapse` | `{ id, item }` | Panel collapsed |
| `funky.accordion.expandAll` | `{}` | All panels expanded |
| `funky.accordion.collapseAll` | `{}` | All panels collapsed |
| `funky.accordion.search` | `{ query, results, count }` | Search performed |
| `funky.accordion.lazyLoad` | `{ id, item, content, status }` | Lazy content loaded |
| `funky.accordion.lazyError` | `{ id, item, error }` | Lazy load failed |
| `funky.accordion.destroy` | `{ instance }` | Accordion destroyed |

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Toggle focused panel |
| `Arrow Down` | Focus next header |
| `Arrow Up` | Focus previous header |
| `Home` | Focus first header |
| `End` | Focus last header |

---

## CSS Customization

Override CSS variables for theming:

```css
.funky-accordion {
    --accordion-bg: var(--pro-bg-secondary);
    --accordion-header-bg: var(--pro-bg-tertiary);
    --accordion-header-hover-bg: var(--pro-bg-hover);
    --accordion-border-color: var(--pro-border-color);
    --accordion-border-radius: var(--pro-border-radius);
    --accordion-spacing: var(--pro-spacing-md);
    --accordion-text-color: var(--pro-text-primary);
    --accordion-text-muted: var(--pro-text-secondary);
    --accordion-focus-ring: var(--pro-focus-ring);
    --accordion-disabled-opacity: 0.5;
    --accordion-transition-duration: 300ms;
    --accordion-transition-timing: ease-in-out;
}
```

---

## Usage Examples

### Basic FAQ

```javascript
var faq = Funky.Accordion.init('#faq', {
    items: [
        { id: 'q1', title: 'What is this?', content: '<p>An accordion component.</p>' },
        { id: 'q2', title: 'How do I use it?', content: '<p>Call create() with items.</p>' },
        { id: 'q3', title: 'Is it accessible?', content: '<p>Yes, fully WCAG 2.1 AA.</p>' }
    ],
    expandFirst: true
});
```

### Single Expand Mode

```javascript
var settings = Funky.Accordion.init('#settings', {
    items: settingsSections,
    allowMultiple: false,  // Only one section open at a time
    collapsible: false     // At least one must stay open
});
```

### With Search

```javascript
var docs = Funky.Accordion.init('#docs', {
    items: docSections,
    searchable: true,
    searchPlaceholder: 'Search documentation...',
    searchKeys: ['title', 'content'],
    highlightMatches: true,
    emptyStateMessage: 'No matching documentation',
    emptyStateAction: {
        text: 'Clear Search',
        onClick: function() { docs.clearSearch(); }
    }
});
```

### External Search Input

```javascript
var accordion = Funky.Accordion.init('#content', {
    items: contentItems,
    searchInput: '#my-search-field',  // Connect external input
    searchKeys: ['title', 'keywords']
});
```

### Lazy Loading

```javascript
var reports = Funky.Accordion.init('#reports', {
    items: [
        { id: 'sales', title: 'Sales Report', lazyLoad: true },
        { id: 'inventory', title: 'Inventory Report', lazyLoad: true }
    ],
    loadingIndicator: 'skeleton',
    skeletonLines: 5,
    onLazyLoad: function(item, done) {
        fetch('/api/reports/' + item.id)
            .then(function(res) { return res.text(); })
            .then(function(html) { done(html); })
            .catch(function(err) { done(null, err); });
    }
});
```

### Nested Items

```javascript
var menu = Funky.Accordion.init('#menu', {
    items: [
        {
            id: 'products',
            title: 'Products',
            children: [
                { id: 'software', title: 'Software', content: '...' },
                { id: 'hardware', title: 'Hardware', content: '...' }
            ]
        },
        {
            id: 'services',
            title: 'Services',
            children: [
                { id: 'consulting', title: 'Consulting', content: '...' },
                { id: 'support', title: 'Support', content: '...' }
            ]
        }
    ],
    nestedIndent: 24
});
```

### Custom Templates

```javascript
var users = Funky.Accordion.init('#users', {
    items: userData,
    headerTemplate: function(item, isExpanded) {
        return '<img src="' + item.avatar + '" class="avatar"> ' +
               '<span>' + item.name + '</span>' +
               (item.online ? '<span class="status-dot online"></span>' : '');
    },
    contentTemplate: function(item) {
        return '<p>Email: ' + item.email + '</p>' +
               '<p>Role: ' + item.role + '</p>';
    }
});
```

### With Badges

```javascript
var inbox = Funky.Accordion.init('#inbox', {
    items: [
        { id: 'unread', title: 'Unread', badge: 5, content: '...' },
        { id: 'flagged', title: 'Flagged', badge: { text: '3', variant: 'warning' }, content: '...' },
        { id: 'archive', title: 'Archive', badge: { text: 'Empty', variant: 'success' }, content: '...' }
    ]
});
```

### URL Hash Navigation

```javascript
var docs = Funky.Accordion.init('#documentation', {
    items: docSections,
    hashNavigation: true,
    hashPrefix: 'doc-'
});

// URL: /docs#doc-getting-started
// Opens the "getting-started" section automatically
```

### Control Buttons

```javascript
var accordion = Funky.Accordion.init('#content', { items: items });

// Expand/Collapse All buttons
document.getElementById('expand-all').onclick = function() {
    accordion.expandAll();
};

document.getElementById('collapse-all').onclick = function() {
    accordion.collapseAll();
};
```

### Event Handling

```javascript
var container = document.querySelector('#accordion');

// Prevent expansion (e.g., premium content)
container.addEventListener('funky.accordion.beforeExpand', function(e) {
    if (e.detail.item.premium && !userHasPremium) {
        e.detail.cancel();
        showUpgradeModal();
    }
});

// Track analytics
container.addEventListener('funky.accordion.expand', function(e) {
    analytics.track('accordion_expand', { section: e.detail.id });
});
```

---

## Accessibility

- Uses `<button>` elements for headers
- `aria-expanded` reflects panel state
- `aria-controls` links button to panel
- `role="region"` on panels
- `aria-labelledby` for panel labeling
- `hidden` attribute on collapsed panels
- `aria-disabled` for disabled items
- Full keyboard navigation
- Screen reader announcements via Funky.Announce

---

## Optional Dependencies

| Component | Feature | Fallback |
|-----------|---------|----------|
| Funky.Morph | Smooth animations | CSS transitions |
| Funky.FuzzySearch | Fuzzy matching | Basic string search |
| Funky.Highlight | Match highlighting | Plain text |
| Funky.EmptyState | Empty state UI | Simple message |
| Funky.Spinner | Loading indicator | Bootstrap spinner |
| Funky.Skeleton | Loading placeholder | Use Spinner |
| Funky.Truncate | Content truncation | Full content |
| Funky.Announce | Screen reader | Silent |

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- IE11 (with polyfills for CustomEvent, Object.assign)

---

## See Also

- [Funky.Dom](../funky/dom.md) - DOM manipulation
- [Funky.FuzzySearch](./fuzzy-search.md) - Search integration
- [Funky.Truncate](./truncate.md) - Content truncation
- [Funky.EmptyState](./empty-state.md) - Empty state placeholders
