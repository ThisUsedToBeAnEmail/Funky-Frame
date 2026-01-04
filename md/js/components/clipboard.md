# Funky.Clipboard

Copy to clipboard utility with visual feedback and declarative usage.

## Overview

Funky.Clipboard provides a simple, consistent way to copy text to the clipboard with:
- Programmatic API for JavaScript control
- Declarative attributes for HTML-first approach
- Visual feedback with icon changes and tooltips
- Fallback support for older browsers
- Custom events for integration

## Quick Start

### Programmatic

```javascript
// Copy text
Funky.Clipboard.copy('Hello World!')
  .then(function() { console.log('Copied!'); })
  .catch(function(err) { console.error('Failed:', err); });

// Copy from element
Funky.Clipboard.copyFrom('#myCodeBlock');

// Attach to button
Funky.Clipboard.attach('#copyBtn', '#targetElement');
```

### Declarative

```html
<!-- Copy element content -->
<code id="apiKey">sk-12345-abcde</code>
<button data-clipboard="#apiKey">Copy API Key</button>

<!-- Copy static text -->
<button data-clipboard-text="secret-token-value">Copy Token</button>

<!-- Copy input value -->
<input id="shareUrl" value="https://example.com/share/abc">
<button data-clipboard="#shareUrl">Copy URL</button>
```

## API Reference

### `Funky.Clipboard.copy(text)`

Copy text to the clipboard.

**Parameters:**
- `text` (string) - Text to copy

**Returns:** Promise<boolean>

**Example:**
```javascript
Funky.Clipboard.copy('Text to copy')
  .then(function() {
    // Success
  })
  .catch(function(err) {
    // Error
  });
```

### `Funky.Clipboard.copyFrom(target)`

Copy text content from an element.

**Parameters:**
- `target` (string|HTMLElement) - Selector or element

**Returns:** Promise<boolean>

**Supported Elements:**
- `<input>`, `<textarea>` - Copies `value`
- `<select>` - Copies selected option text
- Other elements - Copies `textContent`
- Elements with `data-clipboard-value` - Copies that attribute

**Example:**
```javascript
Funky.Clipboard.copyFrom('#codeBlock');
Funky.Clipboard.copyFrom(document.getElementById('secretKey'));
```

### `Funky.Clipboard.attach(button, config)`

Attach copy functionality to a button element.

**Parameters:**
- `button` (string|HTMLElement) - Button selector or element
- `config` (object) - Configuration options

The text to copy is determined from data attributes on the button:
- `data-clipboard="#selector"` - Copy from target element
- `data-clipboard-text="static text"` - Copy static text
- `data-clipboard-value="#selector"` - Copy value from form element
- Or via `config.text` - Static text or function returning text

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tooltip` | string | `'Copied!'` | Tooltip text on success |
| `errorTooltip` | string | `'Failed!'` | Tooltip text on error |
| `iconSuccess` | string | `'fa-check'` | Icon class for success state |
| `iconCopy` | string | `'fa-copy'` | Original/copy icon class |
| `duration` | number | `2000` | Feedback duration in ms |
| `showTooltip` | boolean | `true` | Show tooltip feedback |
| `text` | string\|function | `null` | Text to copy (alternative to data attributes) |
| `onCopy` | function | `null` | Success callback |
| `onError` | function | `null` | Error callback |

**Returns:** Controller object with `destroy()` and `copy(text)` methods

**Example:**
```javascript
// Attach to copy from target element (set via data-clipboard attribute on button)
var ctrl = Funky.Clipboard.attach('#copyBtn', {
  tooltip: 'Copied to clipboard!',
  duration: 3000,
  onCopy: function(text) {
    console.log('Copied:', text);
  }
});

// Attach with text option
Funky.Clipboard.attach('#copyBtn', {
  text: 'Static text to copy'
});

// Destroy when done
ctrl.destroy();
```

### `Funky.Clipboard.init(container)`

Initialize declarative clipboard buttons in a container.

**Parameters:**
- `container` (string|HTMLElement) - Container selector or element (optional, defaults to document)

**Example:**
```javascript
// Initialize all clipboard buttons
Funky.Clipboard.init();

// Initialize within a specific container
Funky.Clipboard.init('#mySection');
```

### `Funky.Clipboard.createInline(text, options)`

Create an inline copy field with text and copy button.

**Parameters:**
- `text` (string) - Text to display and copy
- `options` (object) - Configuration options (same as attach)

**Returns:** HTMLElement - Created wrapper element (`.funky-clipboard-inline`)

**Example:**
```javascript
// Create inline copy element
var inlineEl = Funky.Clipboard.createInline('api-key-12345', {
  tooltip: 'API Key copied!'
});

// Append to container
document.getElementById('container').appendChild(inlineEl);
```

**Example:**
```javascript
Funky.Clipboard.createInline('#keyContainer', 'api-key-12345', {
  successText: 'API Key copied!'
});
```

### `Funky.Clipboard.isSupported()`

Check if clipboard functionality is supported.

**Returns:** boolean

**Example:**
```javascript
if (Funky.Clipboard.isSupported()) {
  // Show copy buttons
} else {
  // Hide or disable copy functionality
}
```

## Declarative Attributes

### `data-clipboard`

Copy content from the target element.

```html
<button data-clipboard="#targetId">Copy</button>
<button data-clipboard=".target-class">Copy</button>
```

### `data-clipboard-text`

Copy static text value.

```html
<button data-clipboard-text="Static text to copy">Copy</button>
```

### `data-clipboard-value`

Set custom copy value on target elements.

```html
<div id="display" data-clipboard-value="hidden-value">
  Visible text (different from copied value)
</div>
<button data-clipboard="#display">Copy</button>
```

## Events

### `clipboard:copy`

Fired when copy succeeds.

```javascript
document.addEventListener('funky.clipboard.copy', function(e) {
  console.log('Copied from button:', e.detail.button);
});
```

### `clipboard:error`

Fired when copy fails.

```javascript
document.addEventListener('funky.clipboard.error', function(e) {
  console.error('Copy failed for button:', e.detail.button);
});
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-clipboard-btn` | Base button class |
| `.copied` | Success state class |
| `.error` | Error state class |
| `.show-tooltip` | Shows feedback tooltip |
| `.funky-clipboard-inline` | Inline copy field wrapper |
| `.funky-clipboard-text` | Text element in inline field |
| `.funky-clipboard-code` | Code block with copy button |

## Styling

### Custom Colors

```css
/* Success color */
.funky-clipboard-btn.copied {
  color: var(--your-success-color);
}

/* Error color */
.funky-clipboard-btn.error {
  color: var(--your-error-color);
}
```

### Tooltip Styling

```css
.funky-clipboard-btn::after {
  background-color: var(--your-tooltip-bg);
  color: var(--your-tooltip-text);
}
```

## Examples

### Basic Copy Button

```html
<pre id="codeExample"><code>const api = new FunkyAPI();</code></pre>
<button class="btn btn-sm btn-outline-secondary" data-clipboard="#codeExample">
  <i class="fas fa-copy"></i> Copy Code
</button>
```

### Input with Copy Button

```html
<div class="input-group">
  <input type="text" id="apiKey" class="form-control" value="sk-..." readonly>
  <button class="btn btn-outline-secondary" data-clipboard="#apiKey">
    <i class="fas fa-clipboard"></i>
  </button>
</div>
```

### Inline Copy Field (Programmatic)

```javascript
Funky.Clipboard.createInline('#container', 'your-api-key-here', {
  successText: 'Key copied!',
  duration: 1500
});
```

### Code Block with Overlay Button

```html
<div class="funky-clipboard-code">
  <pre><code>npm install funky</code></pre>
  <button class="funky-clipboard-btn" data-clipboard-text="npm install funky">
    <i class="fas fa-copy"></i> Copy
  </button>
</div>
```

## Browser Support

- Modern browsers: Uses native Clipboard API
- Older browsers: Falls back to `document.execCommand('copy')`
- IE11: Supported via fallback

## Best Practices

1. **Provide feedback** - Always show visual confirmation
2. **Handle errors** - Clipboard access may be denied
3. **Accessible labels** - Use `aria-label` for icon-only buttons
4. **Secure context** - Clipboard API requires HTTPS in production
5. **User gesture** - Copy must be triggered by user action

## Troubleshooting

### Copy fails silently

Check browser console for permission errors. Clipboard API requires:
- Secure context (HTTPS or localhost)
- User gesture (click event)
- Document focus

### Icon doesn't change

Ensure FontAwesome is loaded and the button contains:
```html
<i class="fas fa-copy"></i><i class="fas fa-check"></i>
```

### Tooltip not showing

Check CSS is loaded and button has `position: relative`.
