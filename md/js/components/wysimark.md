# Funky.Wysimark

WYSIWYG Markdown editor powered by Wysimark.

## Overview

Funky.Wysimark provides:
- **Visual Editing**: Rich text editing with toolbar
- **Markdown Output**: Clean Markdown format (not HTML)
- **Theme Integration**: Respects light/dark themes and density
- **Simple API**: `init()`, `getMarkdown()`, `setMarkdown()`
- **Data Attributes**: Declarative initialization

## Quick Start

### Basic Usage

```javascript
var editor = Funky.Wysimark.init('#container', {
  initialMarkdown: '# Hello World',
  onChange: function(markdown) {
    console.log('Content:', markdown);
  }
});
```

### Data Attribute Initialization

```html
<div data-wysimark
     data-wysimark-placeholder="Start writing..."
     data-wysimark-height="300">
</div>
```

Then initialize all:

```javascript
Funky.Wysimark.initAll();
```

## API Reference

### Factory Methods

#### `Funky.Wysimark.init(selector, options)`

Creates a new Wysimark editor instance.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `selector` | `string\|Element` | CSS selector or DOM element |
| `options` | `Object` | Configuration options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialMarkdown` | `string` | `''` | Initial Markdown content |
| `placeholder` | `string` | `''` | Placeholder text when empty |
| `height` | `number\|string` | `'auto'` | Fixed height or 'auto' |
| `minHeight` | `number` | `200` | Minimum height in pixels |
| `maxHeight` | `number` | `null` | Maximum height in pixels |
| `readOnly` | `boolean` | `false` | Disable editing |
| `onChange` | `function` | `null` | Called with Markdown on change |
| `onFocus` | `function` | `null` | Called when editor receives focus |
| `onBlur` | `function` | `null` | Called when editor loses focus |

**Returns:** Instance object with methods.

### Instance Methods

#### getMarkdown()

Get the current content as Markdown.

```javascript
var markdown = editor.getMarkdown();
console.log(markdown);
// Output: "# Hello World\n\nSome **bold** text."
```

#### setMarkdown(markdown)

Set the editor content from Markdown.

```javascript
editor.setMarkdown('# New Heading\n\nNew content here.');
```

#### isEmpty()

Check if the editor is empty.

```javascript
if (editor.isEmpty()) {
  alert('Please enter some content');
}
```

#### focus()

Focus the editor.

```javascript
editor.focus();
```

#### destroy()

Destroy the editor instance and clean up.

```javascript
editor.destroy();
```

#### `Funky.Wysimark.getInstance(selector)`

Get an existing instance for an element.

```javascript
var editor = Funky.Wysimark.getInstance('#my-editor');
if (editor) {
  console.log(editor.getMarkdown());
}
```

---

#### `Funky.Wysimark.destroy(selector)`

Destroy instance by selector.

```javascript
Funky.Wysimark.destroy('#my-editor');
```

---

#### `Funky.Wysimark.destroyAll()`

Destroy all editor instances.

---

#### `Funky.Wysimark.initAll()`

Initialize all elements with `data-wysimark` attribute.

```javascript
Funky.Wysimark.initAll();
```

## Events

Custom events are dispatched on the container element.

| Event | Detail | Description |
|-------|--------|-------------|
| `wysimark:ready` | `{ instance }` | Editor initialized |
| `wysimark:change` | `{ markdown }` | Content changed |
| `wysimark:focus` | `{}` | Editor focused |
| `wysimark:blur` | `{}` | Editor blurred |
| `wysimark:destroy` | `{}` | Editor destroyed |

### Event Example

```javascript
document.getElementById('editor').addEventListener('funky.wysimark.change', function(e) {
  console.log('Content:', e.detail.markdown);
  autoSave(e.detail.markdown);
});
```

## Styling

### CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-wysimark` | Container element |
| `.funky-wysimark--readonly` | Read-only mode |
| `.funky-wysimark--disabled` | Disabled state |
| `.funky-wysimark--fixed` | Fixed height mode |
| `.funky-wysimark--auto` | Auto height mode |

### Theme Integration

Wysimark uses CSS variables from themes.css:

```css
.funky-wysimark {
  --pro-bg: /* editor background */
  --pro-text: /* text color */
  --pro-border: /* border color */
  --pro-primary: /* accent/focus color */
}
```

### Density Support

The editor respects the `data-density` attribute:

- **compact**: Smaller padding, tighter toolbar
- **default**: Standard sizing
- **comfortable**: More spacious layout

### Custom Styling

```css
/* Custom border */
.funky-wysimark {
  border-radius: 8px;
  border-color: #ccc;
}

/* Custom focus ring */
.funky-wysimark:focus-within {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Custom toolbar background */
.funky-wysimark [data-wysimark-toolbar] {
  background: #f8f9fa;
}
```

## Examples

### Form Integration

```javascript
// Create editor in form
var editor = Funky.Wysimark.init('#notes-editor', {
  initialMarkdown: existingNotes,
  minHeight: 200,
  maxHeight: 400
});

// On form submit
document.getElementById('my-form').addEventListener('submit', function(e) {
  // Get Markdown content
  var notes = editor.getMarkdown();
  document.getElementById('notes-hidden').value = notes;
});
```

### Preview Mode

```javascript
// Toggle between edit and preview
function togglePreview() {
  var container = document.getElementById('editor-container');
  var preview = document.getElementById('preview');
  var editor = Funky.Wysimark.getInstance(container);
  
  if (preview.style.display === 'none') {
    // Show preview
    preview.innerHTML = marked.parse(editor.getMarkdown());
    preview.style.display = 'block';
    container.style.display = 'none';
  } else {
    // Show editor
    preview.style.display = 'none';
    container.style.display = 'block';
  }
}
```

### Auto-Save

```javascript
var editor = Funky.Wysimark.init('#document', {
  initialMarkdown: loadedContent,
  onChange: debounce(function(markdown) {
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: markdown })
    });
  }, 1000)
});
```

### Multiple Editors

```javascript
// Initialize all editors on page
var editors = Funky.Wysimark.initAll();

// Or create multiple manually
['#editor1', '#editor2', '#editor3'].forEach(function(selector) {
  Funky.Wysimark.init(selector, {
    placeholder: 'Enter content...'
  });
});
```

## Markdown Features

Wysimark supports full CommonMark and GFM Markdown:

- **Formatting**: Bold, italic, strikethrough
- **Headings**: H1-H6
- **Lists**: Ordered, unordered, task lists
- **Links**: Inline and reference links
- **Images**: Paste, drag-drop (requires upload handler)
- **Code**: Inline code, fenced code blocks with syntax highlighting
- **Tables**: GFM tables
- **Blockquotes**: Nested quotes
- **Horizontal Rules**: `---` or `***`

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## See Also

- [Highlight](highlight.md) - Syntax highlighting for code
- [Clipboard](clipboard.md) - Copy to clipboard functionality
- [Toast](toast.md) - Notifications
