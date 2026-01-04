# Funky.CodePreview

Syntax-highlighted code display component with line numbers, copy, and collapsible sections.

## Overview

Funky.CodePreview provides a consistent way to display source code with:
- Lightweight syntax highlighting (JavaScript, JSON, HTML, CSS)
- Optional line numbers
- Copy to clipboard integration
- Collapsible code blocks
- Editable mode for live coding
- LiveBinding support for reactive updates
- Theme support via CSS variables

## Quick Start

### Basic Usage

```javascript
// Render code into an element
Funky.CodePreview.render('#container', 'var x = 1;', {
    language: 'javascript'
});

// With line numbers
Funky.CodePreview.render('#container', code, {
    language: 'javascript',
    lineNumbers: true,
    showCopy: true
});
```

### Static HTML Generation

```javascript
// Generate HTML string for templates
var html = Funky.CodePreview.toHTML(code, {
    language: 'json',
    showLanguage: true
});
```

### Highlight Only

```javascript
// Get syntax-highlighted HTML string
var highlighted = Funky.CodePreview.highlight('function test() {}', 'javascript');
```

## API Reference

### Factory Methods

#### `Funky.CodePreview.init(element, options)`

Initialize a CodePreview instance.

**Parameters:**
- `element` (string|HTMLElement) - Target container selector or element
- `options` (object) - Configuration options

**Returns:** CodePreviewInstance

**Example:**
```javascript
var preview = Funky.CodePreview.init('#container', {
    language: 'javascript',
    lineNumbers: true
});
preview.setCode('var x = 1;');
```

---

#### `Funky.CodePreview.getInstance(id)`

Get a CodePreview instance by ID.

**Parameters:**
- `id` (string) - Instance ID

**Returns:** CodePreviewInstance or null

---

#### `Funky.CodePreview.destroy(id)`

Destroy a CodePreview instance by ID.

**Parameters:**
- `id` (string) - Instance ID

---

#### `Funky.CodePreview.destroyAll()`

Destroy all CodePreview instances.

---

### Convenience Methods

#### `Funky.CodePreview.render(element, code, options)`

Render code into an element with syntax highlighting.

**Parameters:**
- `element` (string|HTMLElement) - Target container selector or element
- `code` (string) - Source code to display
- `options` (object) - Configuration options

**Returns:** CodePreviewInstance

**Example:**
```javascript
var preview = Funky.CodePreview.render('#code-container', sourceCode, {
    language: 'javascript',
    lineNumbers: true,
    showCopy: true,
    collapsible: true,
    maxHeight: 300
});
```

---

#### `Funky.CodePreview.toHTML(code, options)`

Generate static HTML string for server-side rendering or templates.

**Parameters:**
- `code` (string) - Source code to highlight
- `options` (object) - Configuration options

**Returns:** string - HTML string

**Example:**
```javascript
var html = Funky.CodePreview.toHTML('{"key": "value"}', {
    language: 'json',
    showLanguage: true
});
```

### `Funky.CodePreview.highlight(code, language)`

Apply syntax highlighting to code and return HTML string.

**Parameters:**
- `code` (string) - Source code to highlight
- `language` (string) - Language identifier

**Returns:** string - HTML with syntax highlighting spans

**Example:**
```javascript
var html = Funky.CodePreview.highlight('function test() { return true; }', 'javascript');
// Returns: '<span class="syntax-keyword">function</span> <span class="syntax-function">test</span>...'
```

### `Funky.CodePreview.formatSource(source)`

Clean up function source code by removing wrappers and normalizing indentation.

**Parameters:**
- `source` (string) - Raw function source (from `fn.toString()`)

**Returns:** string - Cleaned source code

**Example:**
```javascript
var fn = function() {
    var x = 1;
    return x;
};
var formatted = Funky.CodePreview.formatSource(fn.toString());
// Returns: 'var x = 1;\nreturn x;'
```

### `Funky.CodePreview.createWithBinding(element, template, options, bindingOptions)`

Create a CodePreview with LiveBinding for reactive updates.

**Parameters:**
- `element` (string|HTMLElement) - Target container
- `template` (string) - Code template with `{{placeholders}}`
- `options` (object) - CodePreview options
- `bindingOptions` (object) - LiveBinding configuration

**Returns:** CodePreviewInstance

**Example:**
```javascript
var preview = Funky.CodePreview.createWithBinding('#code',
    'function {{name}}({{params}}) { return {{value}}; }',
    { language: 'javascript', lineNumbers: true },
    { source: 'memory', key: 'fn-data' }
);

// Update via LiveBinding
Funky.LiveBinding.setMemory('fn-data', {
    name: 'greet',
    params: 'name',
    value: '"Hello, " + name'
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `language` | string | `'javascript'` | Language for syntax highlighting |
| `lineNumbers` | boolean | `false` | Show line numbers |
| `showCopy` | boolean | `true` | Show copy to clipboard button |
| `showLanguage` | boolean | `true` | Show language label in header |
| `collapsible` | boolean | `false` | Allow collapse/expand |
| `collapsed` | boolean | `false` | Start in collapsed state |
| `maxHeight` | number | `null` | Max height in pixels (scrollable) |
| `wrapLines` | boolean | `false` | Wrap long lines |
| `highlight` | array | `null` | Terms to highlight (uses Funky.Highlight) |
| `tabSize` | number | `2` | Tab display width |
| `className` | string | `''` | Additional CSS class |
| `editable` | boolean | `false` | Make code editable |
| `showRun` | boolean | `false` | Show run button |
| `onRun` | function | `null` | Callback when run clicked |
| `onChange` | function | `null` | Callback when code changes |
| `autoRun` | boolean | `false` | Auto-run on code change |
| `autoRunDelay` | number | `500` | Debounce delay for auto-run (ms) |
| `showOutput` | boolean | `false` | Show output panel |
| `showErrors` | boolean | `true` | Show error panel on failure |

## Supported Languages

| Language | Identifier | Highlights |
|----------|------------|------------|
| JavaScript | `javascript`, `js` | Keywords, strings, numbers, comments, functions, built-ins |
| JSON | `json` | Property names, strings, numbers, booleans, null |
| HTML | `html` | Tags, attributes, strings, comments |
| CSS | `css` | Selectors, properties, values, comments |
| Plain Text | `text` | No highlighting (HTML escaped) |

## Instance Methods

### `setCode(code)`

Update the displayed code.

```javascript
preview.setCode('var y = 2;');
```

### `getCode()`

Get the current code content.

```javascript
var code = preview.getCode();
```

### `setHighlight(terms)`

Set search terms to highlight within the code.

```javascript
preview.setHighlight(['expect', 'toBe']);
preview.setHighlight(null); // Clear highlights
```

### `toggleCollapse()`

Toggle the collapsed state.

```javascript
preview.toggleCollapse();
```

### `copy()`

Copy the code to clipboard.

```javascript
preview.copy();
```

### `run()`

Execute the code (for editable mode).

```javascript
preview.run();
```

### `enableEdit()`

Enable editable mode after creation.

```javascript
preview.enableEdit();
```

### `setTemplate(template)`

Set the code template for LiveBinding interpolation.

```javascript
preview.setTemplate('function {{name}}() {}');
```

### `updateData(data)`

Update bound data (for LiveBinding).

```javascript
preview.updateData({ name: 'myFunction' });
```

### `bindTo(bindingOptions)`

Bind to a LiveBinding data source.

```javascript
preview.bindTo({
    source: 'memory',
    key: 'code-data'
});
```

### `setOptions(options)`

Update options and re-render.

```javascript
preview.setOptions({ lineNumbers: true });
```

### `destroy()`

Clean up the instance and remove DOM elements.

```javascript
preview.destroy();
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.code-preview` | Container element |
| `.code-preview--collapsed` | Collapsed state |
| `.code-preview--wrapped` | Line wrapping enabled |
| `.code-preview__header` | Header with language and actions |
| `.code-preview__language` | Language label |
| `.code-preview__actions` | Action buttons container |
| `.code-preview__copy` | Copy button |
| `.code-preview__collapse` | Collapse/expand button |
| `.code-preview__run` | Run button (editable mode) |
| `.code-preview__body` | Code container |
| `.code-preview__pre` | Pre element |
| `.code-preview__code` | Code element |
| `.code-preview__code--editable` | Editable code element |
| `.code-preview__line-numbers` | Line numbers container |
| `.code-preview__line-number` | Individual line number |
| `.code-preview__lines` | Code lines container |
| `.code-preview__line` | Individual code line |
| `.code-preview__output` | Output panel |
| `.code-preview__error` | Error panel |

## Syntax Highlighting Classes

| Class | Applies To |
|-------|------------|
| `.syntax-keyword` | Keywords (var, function, if, return, etc.) |
| `.syntax-string` | String literals |
| `.syntax-number` | Numeric values |
| `.syntax-comment` | Comments |
| `.syntax-builtin` | Built-in values (true, false, null, undefined) |
| `.syntax-function` | Function names |
| `.syntax-tag` | HTML tags |
| `.syntax-attribute` | HTML/CSS attributes |
| `.syntax-selector` | CSS selectors |
| `.syntax-property` | CSS/JSON property names |

## LiveBinding Integration

CodePreview supports template interpolation with `{{placeholders}}`.

### Template Syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `{{key}}` | Simple value | `{{name}}` |
| `{{nested.path}}` | Nested value | `{{user.name}}` |
| Objects | JSON stringified | `{{config}}` |

### Memory Source

```javascript
var preview = Funky.CodePreview.createWithBinding('#code',
    'var user = {{userData}};',
    { language: 'javascript' },
    { source: 'memory', key: 'user-code' }
);

Funky.LiveBinding.setMemory('user-code', {
    userData: { name: 'John', age: 30 }
});
```

### PubSub Source

```javascript
var preview = Funky.CodePreview.createWithBinding('#code',
    '{{code}}',
    { language: 'javascript' },
    { source: 'pubsub', channel: 'code:update' }
);

Funky.PubSub.publish('code:update', { code: 'var x = 1;' });
```

## Examples

### Basic Code Display

```javascript
Funky.CodePreview.render('#example', `
function greet(name) {
    return 'Hello, ' + name + '!';
}
`, {
    language: 'javascript',
    lineNumbers: true,
    showCopy: true
});
```

### Collapsible Code Block

```javascript
Funky.CodePreview.render('#config', jsonConfig, {
    language: 'json',
    collapsible: true,
    collapsed: true,
    maxHeight: 200
});
```

### Editable Playground

```javascript
Funky.CodePreview.render('#playground', initialCode, {
    language: 'javascript',
    editable: true,
    showRun: true,
    showOutput: true,
    onRun: function(code) {
        // Execute in sandbox
        return sandboxEval(code);
    },
    onChange: function(code) {
        console.log('Code changed:', code.length, 'chars');
    }
});
```

### Test Source Display

```javascript
// Display test function source code
var testFn = function() {
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
};

var formatted = Funky.CodePreview.formatSource(testFn.toString());
Funky.CodePreview.render('#test-source', formatted, {
    language: 'javascript',
    lineNumbers: true,
    highlight: ['expect', 'toBe', 'toHaveLength']
});
```

### With Search Highlighting

```javascript
var preview = Funky.CodePreview.render('#code', sourceCode, {
    language: 'javascript',
    lineNumbers: true
});

// Highlight search matches
preview.setHighlight(['function', 'return']);
```

## Integration

### With Funky.Clipboard

The copy button automatically uses Funky.Clipboard when available, falling back to native clipboard API.

### With Funky.Highlight

Pass the `highlight` option or use `setHighlight()` to highlight search terms within code. Uses Funky.Highlight for consistent styling.

### With Funky.LiveBinding

Use `createWithBinding()` or `bindTo()` for reactive code updates from memory, pubsub, or API sources.

## Theming

CodePreview uses CSS variables for consistent theming:

```css
/* Override syntax colors */
.code-preview {
    --syntax-function: #dcdcaa; /* Function names */
}

/* Light theme */
[data-theme="light"] .syntax-function {
    --syntax-function: #795e26;
}
```

All colors inherit from Funky theme variables:
- `--pro-bg-primary`, `--pro-bg-secondary`, `--pro-bg-tertiary`
- `--pro-border-color`, `--pro-border-muted`
- `--pro-text-primary`, `--pro-text-secondary`, `--pro-text-muted`
- `--pro-accent-primary`, `--pro-accent-success`, etc.

## Best Practices

1. **Choose the right language** - Use `text` for unknown/mixed content
2. **Use line numbers for long code** - Helps with reference and debugging
3. **Set maxHeight for large blocks** - Prevents layout issues
4. **Use formatSource for functions** - Cleans up `fn.toString()` output
5. **Prefer collapsible for optional content** - Keeps UI clean
6. **Use highlight for search results** - Makes matches visible

## Accessibility

- Keyboard navigation with Tab focus
- ARIA labels on buttons
- Focus indicators on all interactive elements
- Reduced motion support
- Proper semantic markup with `<pre>` and `<code>`

## Browser Support

- Modern browsers with ES5+ support
- Falls back gracefully when optional dependencies unavailable
- Uses native clipboard API with fallback
