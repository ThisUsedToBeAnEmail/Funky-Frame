# Funky.Markdown

A standalone Markdown renderer with syntax highlighting, GFM extensions, table of contents generation, and async file loading. Designed for rendering JavaScript documentation in the Funky framework.

## Quick Start

```javascript
// Render to container
Funky.Markdown.renderTo('# Hello World', '#content');

// Get HTML string
var html = Funky.Markdown.render('**Bold** and *italic*');

// Load from file
Funky.Markdown.renderFile('/docs/api.md', '#docs');
```

## Installation

Include the required files:

```html
<link rel="stylesheet" href="/assets/css/markdown.css">
<script src="/assets/js/funky/dom.js"></script>
<script src="/assets/js/components/markdown.js"></script>
```

Optional dependencies for enhanced features:

```html
<!-- Rendering -->
<script src="/assets/js/components/code-preview.js"></script>  <!-- Syntax highlighting -->
<script src="/assets/js/components/clipboard.js"></script>      <!-- Copy buttons -->
<script src="/assets/js/components/table.js"></script>          <!-- Interactive tables -->

<!-- Navigation -->
<script src="/assets/js/components/quick-nav.js"></script>      <!-- Floating nav -->
<script src="/assets/js/components/scroll-tracker.js"></script> <!-- TOC highlighting -->
<script src="/assets/js/components/keyboard.js"></script>       <!-- Keyboard shortcuts -->
<script src="/assets/js/components/tree-view.js"></script>      <!-- TOC panel TreeView -->

<!-- Loading & Utilities -->
<script src="/assets/js/components/spinner.js"></script>        <!-- Loading indicator -->
<script src="/assets/js/components/skeleton.js"></script>       <!-- Loading placeholder -->
<script src="/assets/js/components/empty-state.js"></script>    <!-- Error display -->
<script src="/assets/js/components/announce.js"></script>       <!-- Screen reader -->
<script src="/assets/js/components/truncate.js"></script>       <!-- Code collapse -->
```

## API

### `Funky.Markdown.render(markdown, options)`

Converts markdown string to HTML.

**Parameters:**
- `markdown` (string): Markdown source text
- `options` (Object): Rendering options

**Returns:** string (HTML)

### `Funky.Markdown.renderTo(markdown, container, options)`

Renders markdown into a DOM container.

**Parameters:**
- `markdown` (string): Markdown source text
- `container` (string|Element): Selector or element
- `options` (Object): Rendering options

**Returns:** Element (the container)

### `Funky.Markdown.renderFile(url, container, options)`

Fetches and renders a markdown file.

**Parameters:**
- `url` (string): URL to markdown file
- `container` (string|Element): Selector or element
- `options` (Object): Rendering options

**Returns:** Promise

### `Funky.Markdown.extractHeadings(markdown)`

Extracts heading data for table of contents.

**Parameters:**
- `markdown` (string): Markdown source text

**Returns:** Array of `{ level, text, id }`

### `Funky.Markdown.renderToc(headings, options)`

Generates table of contents HTML.

**Parameters:**
- `headings` (Array): From `extractHeadings()`
- `options` (Object): TOC options

**Returns:** string (HTML)

### `Funky.Markdown.prefetch(url)`

Preloads a markdown file into cache.

**Parameters:**
- `url` (string): URL to markdown file

**Returns:** Promise

### `Funky.Markdown.clearCache()`

Clears the file cache.

### `Funky.Markdown.getCached(url)`

Gets a cached markdown file content.

**Parameters:**
- `url` (string): URL to check

**Returns:** string|null (cached content or null)

### `Funky.Markdown.highlightCode(code, language)`

Highlights code using CodePreview integration.

**Parameters:**
- `code` (string): Code to highlight
- `language` (string): Language identifier

**Returns:** string (highlighted HTML)

### `Funky.Markdown.getTocPanel(container)`

Gets the TOC panel instance for a container (when `tocPanel: true`).

**Parameters:**
- `container` (string|Element): Selector or element

**Returns:** Object|null - Panel instance with methods:
- `open()` - Open the TOC panel
- `close()` - Close the TOC panel
- `isOpen()` - Returns boolean
- `destroy()` - Clean up the panel

## Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sanitize` | boolean | `true` | Escape raw HTML |
| `highlightCode` | boolean | `true` | Enable code syntax highlighting |
| `languages` | array | `['javascript', 'js', ...]` | Supported highlight languages |
| `lineNumbers` | boolean | `false` | Show line numbers in code |
| `copyButton` | boolean | `true` | Show copy button on code blocks |
| `linkTarget` | string | `null` | Target for external links |
| `linkClass` | string | `null` | CSS class for links |
| `headingIds` | boolean | `true` | Add IDs to headings |
| `headingPrefix` | string | `''` | Prefix for heading IDs |
| `headingAnchors` | boolean | `true` | Add anchor links to headings |
| `tables` | boolean | `true` | Enable tables (uses Funky.Table) |
| `baseUrl` | string | `''` | Base URL for relative links |
| `abbreviations` | object | `{}` | Abbreviation definitions (text → expanded) |

### Table of Contents Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `toc` | boolean | `false` | Generate table of contents (flat list) |
| `tocContainer` | string | `null` | TOC container selector |
| `tocMaxLevel` | number | `3` | Max heading level for TOC |
| `tocHighlight` | boolean | `true` | Sync TOC with scroll position |
| `tocPanel` | boolean | `false` | Enable slide-out TOC panel with TreeView |
| `tocPanelStartOpen` | boolean | `false` | Start with TOC panel open |
| `tocPanelPosition` | string | `'top-left'` | Toggle button position: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'` |
| `tocPanelSticky` | boolean | `false` | Fixed position: button stays visible on screen while container is in view (uses ScrollTracker) |

### Navigation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quickNav` | boolean | `false` | Enable floating navigation widget |
| `scrollTracking` | boolean | `true` | Highlight current section in TOC |
| `keyboard` | boolean | `true` | Enable keyboard shortcuts |

### Code Block Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `codeMaxHeight` | number | `null` | Max height before collapse (null = no limit) |

### File Loading Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cache` | boolean | `true` | Cache file contents |
| `loadingIndicator` | string | `'skeleton'` | `'spinner'`, `'skeleton'`, `'none'` |
| `onLoad` | function | `null` | Callback after file loads |
| `onRetry` | function | `null` | Callback for retry action |
| `onRender` | function | `null` | Callback after rendering |
| `onError` | function | `null` | Callback on error |

### Accessibility Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `announcements` | boolean | `true` | Screen reader announcements |

### Funky.Table Options

The `funkyTableOptions` object configures markdown tables:

```javascript
funkyTableOptions: {
    paging: 'auto',
    pageLength: 25,
    searching: true,
    ordering: true,
    info: 'auto',
    buttons: {
        enabled: true,
        export: ['csv', 'xlsx']
    },
    density: 'compact',
    striped: true,
    hover: true,
    bordered: true
}
```

## Supported Syntax

### Headings

```markdown
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

### Text Formatting

```markdown
**bold** or __bold__
*italic* or _italic_
***bold italic***
~~strikethrough~~
`inline code`
```

### Links & Images

```markdown
[Link text](url)
[Link with title](url "Title")
![Alt text](image.png)
https://auto.link.com
email@example.com
```

### Code Blocks

    ```javascript
    var x = 1;
    ```

Supported languages: `javascript`, `json`, `html`, `css`, `bash`, `sql`, `perl`, `python`, `ruby`, `java`, `c`, `cpp`, `csharp`, `go`, `rust`, `php`, `swift`, `kotlin`, `typescript`, `yaml`, `xml`, `markdown`

### Lists

```markdown
- Unordered item
* Also unordered
+ Also works

1. Ordered item
2. Second item

- [ ] Unchecked task
- [x] Checked task
```

### Blockquotes

```markdown
> Quote text
>
> Multi-paragraph
>
>> Nested quote
```

### Tables

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L    | C      | R     |
```

### Horizontal Rules

```markdown
---
***
___
```

### Abbreviations

```markdown
The HTML specification is maintained by the W3C.

*[HTML]: HyperText Markup Language
*[W3C]: World Wide Web Consortium
```

## Keyboard Shortcuts

When `keyboard: true` is enabled:

| Key | Action |
|-----|--------|
| `j` | Next heading |
| `k` | Previous heading |
| `g g` | Go to top |
| `G` | Go to bottom |
| `/` | Focus search (if TOC search enabled) |
| `c` | Copy current code block |
| `?` | Show keyboard help |

## Events

Listen on the container element:

```javascript
container.addEventListener('funky.markdown.render', function(e) {
    console.log('Rendered:', e.detail);
});
```

| Event | Payload | Description |
|-------|---------|-------------|
| `funky.markdown.render` | `{ html, headings }` | Content rendered |
| `funky.markdown.copy` | `{ code, success }` | Code copied |
| `funky.markdown.error` | `{ url, error }` | File load failed |
| `funky.markdown.navigate` | `{ headingId, direction }` | Keyboard navigation |
| `funky.markdown.scroll` | `{ activeHeading }` | Scroll position changed |

## CSS Customization

Override CSS variables:

```css
.funky-markdown {
    --markdown-font-family: var(--pro-font-family);
    --markdown-font-mono: var(--pro-font-mono);
    --markdown-line-height: 1.7;
    --markdown-link-color: var(--pro-accent-primary);
    --markdown-code-bg: var(--pro-bg-tertiary);
    --markdown-blockquote-border: var(--pro-accent-primary);
    --markdown-heading-color: var(--pro-text-primary);
    --markdown-table-border-color: var(--pro-border-color);
    --markdown-hr-color: var(--pro-border-color);
}
```

### Density Modes

```css
/* Compact mode */
.funky-markdown--compact {
    --markdown-spacing-base: 0.5rem;
    --markdown-line-height: 1.5;
}

/* Comfortable mode */
.funky-markdown--comfortable {
    --markdown-spacing-base: 1.5rem;
    --markdown-line-height: 1.9;
}
```

## Examples

### Render Documentation

```javascript
Funky.Markdown.renderFile('/docs/API.md', '#api-docs', {
    syntaxHighlight: true,
    lineNumbers: true,
    linkTarget: '_blank'
});
```

### With Table of Contents

```javascript
var md = document.querySelector('#source').textContent;
var container = document.querySelector('#content');

Funky.Markdown.renderTo(md, container);

var headings = Funky.Markdown.extractHeadings(md);
var toc = Funky.Markdown.renderToc(headings, { maxLevel: 3 });

document.querySelector('#toc').innerHTML = toc;
```

### With TOC Panel (Slide-out TreeView)

```javascript
// Render with slide-out TOC panel
Funky.Markdown.renderTo(container, markdownSource, {
    tocPanel: true,
    tocMaxLevel: 3,
    tocPanelPosition: 'top-right',  // Position toggle button
    tocPanelSticky: true            // Button stays fixed on screen while scrolling
});

// Programmatically control the panel
var panel = Funky.Markdown.getTocPanel(container);
if (panel) {
    panel.open();   // Open panel
    panel.close();  // Close panel
    panel.isOpen(); // Check state
}

// Clean up when done
panel.destroy();
```

The TOC panel:
- Slides out from the left side of the container (relative positioning)
- Uses TreeView for nested, collapsible navigation
- Automatically closes after selecting a heading
- Supports keyboard navigation (Escape to close)
- Falls back to simple list if TreeView is not available
- Toggle button can be positioned at any corner (`top-left`, `top-right`, `bottom-left`, `bottom-right`)
- With `tocPanelSticky`, the toggle button stays fixed on screen while you scroll, remaining visible as long as the container is in view (uses ScrollTracker)

### Custom Error Handling

```javascript
Funky.Markdown.renderFile('/docs/missing.md', '#content', {
    errorTitle: 'Document Not Found',
    errorMessage: 'The requested documentation could not be loaded.',
    retryText: 'Reload'
}).catch(function(err) {
    console.error('Failed to load:', err);
});
```

### Prefetch for Performance

```javascript
// Prefetch on page load
Funky.Markdown.prefetch('/docs/getting-started.md');
Funky.Markdown.prefetch('/docs/api-reference.md');

// Later, render from cache (instant)
Funky.Markdown.renderFile('/docs/getting-started.md', '#content');
```

### With Keyboard Navigation

```javascript
Funky.Markdown.renderFile('/docs/guide.md', '#docs', {
    keyboard: true,
    quickNav: true,
    scrollTracking: true
});

// Listen for navigation events
document.querySelector('#docs').addEventListener('funky.markdown.navigate', function(e) {
    console.log('Navigated to:', e.detail.headingId);
});
```

### Compact Mode for Sidebars

```javascript
Funky.Markdown.renderTo(sidebarContent, '#sidebar-docs', {
    density: 'compact',
    headingAnchors: false,
    copyButton: false
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- IE11 (with polyfills for Promise, fetch)

## See Also

- [Funky.CodePreview](./code-preview.md) - Syntax highlighting
- [Funky.Clipboard](./clipboard.md) - Copy functionality
- [Funky.Table](./table.md) - Interactive tables
- [Funky.TreeView](./tree-view.md) - TOC panel navigation
- [Funky.QuickNav](./quick-nav.md) - Floating navigation
- [Funky.ScrollTracker](./scroll-tracker.md) - Scroll position tracking
- [Funky.Accordion](./accordion.md) - For collapsible sections
