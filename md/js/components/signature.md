# Funky.Signature

Canvas-based signature capture with pressure sensitivity, touch support, typed signatures, and export capabilities.

> See [Component Base Interface](../core/component-interface.md) for standard API patterns.

## Overview

`Funky.Signature` provides a smooth signature drawing experience using HTML5 Canvas with velocity-based stroke width variation. It supports both drawn and typed signatures, form integration, accessibility features, and multiple export formats.

## Quick Start

```javascript
// Basic signature pad
var signature = Funky.Signature.init('#signature-container');

// With options
var signature = Funky.Signature.init('#signature-container', {
  width: 500,
  height: 200,
  penColour: '#000000',
  required: true
});

// Export signature
var dataURL = signature.toDataURL();

// Validate
var result = signature.validate();
if (!result.valid) {
  console.log(result.errors);
}

// Clean up when done
signature.destroy();
```

## API Reference

### Factory Methods

#### `Funky.Signature.init(element, options)`

Create a new signature pad instance.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| element | Element/string | Container element or CSS selector |
| options | Object | Configuration options |

**Returns:** `Signature` instance

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| width | number | `400` | Canvas width in pixels |
| height | number | `200` | Canvas height in pixels |
| penColour | string | `'#000000'` | Stroke colour (hex) |
| penWidth | number | `2` | Base stroke width |
| backgroundColour | string | `'#ffffff'` | Canvas background colour |
| minWidth | number | `0.5` | Minimum stroke width (velocity-based) |
| maxWidth | number | `2.5` | Maximum stroke width (velocity-based) |
| velocityFilter | number | `0.7` | Velocity smoothing (0-1) |
| smoothing | number | `0.4` | Path smoothing (0-1) |
| required | boolean | `false` | Whether signature is required for validation |
| minStrokes | number | `1` | Minimum strokes required |
| outputFormat | string | `'png'` | Default export format ('png' or 'jpeg') |
| outputQuality | number | `0.9` | JPEG export quality (0-1) |
| showTypedOption | boolean | `true` | Show draw/type toggle |
| typedFont | string | `'"Brush Script MT", cursive'` | Font for typed signatures |
| typedFontSize | number | `48` | Base font size for typed signatures |
| typedColour | string | `null` | Typed text colour (defaults to penColour) |
| mode | string | `'draw'` | Initial mode ('draw' or 'typed') |
| name | string | `null` | Form field name (creates hidden input) |
| validateOn | string | `'change'` | When to validate ('change' or 'submit') |
| throttle | number | `0` | Drawing throttle in ms |
| onBegin | function | `null` | Callback when stroke begins |
| onChange | function | `null` | Callback on change |
| onEnd | function | `null` | Callback when stroke ends |

### Instance Methods

#### `isEmpty()`

Check if the signature is empty.

**Returns:** `boolean`

```javascript
if (signature.isEmpty()) {
  alert('Please sign first');
}
```

---

#### `getStrokeCount()`

Get the number of strokes.

**Returns:** `number`

```javascript
console.log('Strokes:', signature.getStrokeCount());
```

---

#### `getMode()`

Get the current mode.

**Returns:** `string` - 'draw' or 'typed'

```javascript
var mode = signature.getMode();
```

---

#### `setMode(mode)`

Switch between draw and typed mode.

**Parameters:**
- `mode` - 'draw' or 'typed'

```javascript
signature.setMode('typed');
```

---

#### `clear()`

Clear the signature (removes all strokes or typed text).

```javascript
signature.clear();
```

---

#### `undo()`

Undo the last stroke.

```javascript
signature.undo();
```

---

#### `validate()`

Validate the signature.

**Returns:** `{ valid: boolean, errors: string[] }`

```javascript
var result = signature.validate();
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

---

#### `toDataURL(format, quality)`

Export signature as base64 data URL.

**Parameters:**
- `format` - MIME type ('image/png' or 'image/jpeg'), default: 'image/png'
- `quality` - JPEG quality (0-1), default: 0.9

**Returns:** `string` - Base64 data URL, or empty string if empty

```javascript
var png = signature.toDataURL();
var jpeg = signature.toDataURL('image/jpeg', 0.8);
```

---

#### `toBlob(callback, format, quality)`

Export signature as Blob (for file uploads).

**Parameters:**
- `callback` - Function called with Blob
- `format` - MIME type, default: 'image/png'
- `quality` - JPEG quality, default: 0.9

```javascript
signature.toBlob(function(blob) {
  if (blob) {
    var formData = new FormData();
    formData.append('signature', blob, 'signature.png');
  }
});
```

---

#### `toSVG()`

Export signature as SVG string.

**Returns:** `string` - SVG markup

```javascript
var svg = signature.toSVG();
document.getElementById('preview').innerHTML = svg;
```

---

#### `getData()`

Get raw stroke data for storage.

**Returns:** `Object` - Serializable data object

```javascript
var data = signature.getData();
localStorage.setItem('signature', JSON.stringify(data));
```

---

#### `fromData(data)`

Restore signature from saved data.

**Parameters:**
- `data` - Data object from `getData()`

```javascript
var data = JSON.parse(localStorage.getItem('signature'));
signature.fromData(data);
```

---

#### `toJSON()`

Get stroke data as JSON string.

**Returns:** `string` - JSON string

```javascript
var json = signature.toJSON();
```

---

#### `fromJSON(json)`

Load from JSON string.

**Parameters:**
- `json` - JSON string from `toJSON()`

```javascript
signature.fromJSON(storedJson);
```

---

#### `resize(width, height, preserveData)`

Resize the signature pad canvas.

**Parameters:**
- `width` - New width in pixels
- `height` - New height in pixels
- `preserveData` - Whether to preserve existing strokes (default: `true`)

When `preserveData` is `true`, existing strokes are scaled proportionally to fit the new dimensions.

```javascript
// Resize and scale existing signature
signature.resize(600, 300);

// Resize and clear existing data
signature.resize(600, 300, false);
```

---

#### `destroy()`

Destroy the signature pad and clean up all event listeners and DOM elements.

```javascript
signature.destroy();
```

## PubSub Events

Signature emits the following events via `Funky.PubSub`:

| Event | Data | Description |
|-------|------|-------------|
| `funky:signature:begin` | `{ signature }` | Stroke started |
| `funky:signature:end` | `{ signature, stroke }` | Stroke ended |
| `funky:signature:change` | `{ signature }` | Signature changed |
| `funky:signature:clear` | `{ signature }` | Signature cleared |
| `funky:signature:undo` | `{ signature }` | Stroke undone |
| `funky:signature:modechange` | `{ signature, mode }` | Mode switched |
| `funky:signature:validate` | `{ signature, valid, errors }` | Validation performed |
| `funky:signature:load` | `{ signature, strokeCount }` | Data loaded |

```javascript
Funky.PubSub.on('funky:signature:change', function(data) {
  console.log('Signature changed');
});
```

## Usage Patterns

### Form Integration

```javascript
// Create with form field name
var signature = Funky.Signature.init('#sig-container', {
  name: 'customer_signature',
  required: true,
  validateOn: 'submit'
});

// Hidden input is created automatically with the signature data
// Form validation happens on submit
```

### Save and Restore

```javascript
// Save
var json = signature.toJSON();
localStorage.setItem('draft_signature', json);

// Restore
var saved = localStorage.getItem('draft_signature');
if (saved) {
  signature.fromJSON(saved);
}
```

### Multiple Export Formats

```javascript
// PNG (default, best quality)
var png = signature.toDataURL('image/png');

// JPEG (smaller file size)
var jpeg = signature.toDataURL('image/jpeg', 0.7);

// SVG (vector, scalable)
var svg = signature.toSVG();

// Blob for upload
signature.toBlob(function(blob) {
  uploadToServer(blob);
}, 'image/png');
```

### Typed Signatures

```javascript
var signature = Funky.Signature.init('#container', {
  showTypedOption: true,
  typedFont: '"Brush Script MT", cursive',
  typedFontSize: 48
});

// Listen for mode changes
Funky.PubSub.on('funky:signature:modechange', function(data) {
  console.log('Mode:', data.mode);
});
```

### Custom Styling

```javascript
var signature = Funky.Signature.init('#container', {
  penColour: '#1a365d',
  penWidth: 2.5,
  backgroundColour: '#f8f9fa',
  minWidth: 0.5,
  maxWidth: 4
});
```

## Accessibility

Funky.Signature includes comprehensive accessibility support:

- **Keyboard navigation**: Arrow keys to move cursor, Space/Enter to draw
- **ARIA attributes**: Proper roles and labels
- **Focus indicators**: Visual keyboard cursor
- **Screen reader announcements**: Stroke count, mode changes
- **Reduced motion**: Respects `prefers-reduced-motion`

### Keyboard Controls

| Key | Action |
|-----|--------|
| Arrow keys | Move cursor |
| Shift + Arrow | Move faster |
| Space / Enter | Toggle drawing |
| Escape | Cancel current stroke |
| Delete / Backspace | Undo last stroke |
| C | Clear all |

## Data Format

The `getData()` method returns an object in this format:

```javascript
{
  version: 1,
  width: 400,
  height: 200,
  strokes: [
    {
      points: [
        { x: 50, y: 100, pressure: 0.5, time: 1234567890 },
        { x: 51, y: 101, pressure: 0.6, time: 1234567891 }
      ],
      colour: '#000000',
      width: 2
    }
  ],
  options: {
    penColour: '#000000',
    penWidth: 2,
    backgroundColour: '#ffffff'
  }
}
```

## Styling

Signature uses CSS custom properties for theming:

```css
.funky-signature-wrapper {
  --signature-border-color: var(--pro-border);
  --signature-background: var(--pro-card-bg);
  --signature-focus-color: var(--pro-primary);
  --signature-error-color: var(--pro-danger);
  --signature-success-color: var(--pro-success);
}
```

See [signature.css](/public/assets/css/signature.css) for full styling reference.

## File Location

- **JavaScript**: `/public/assets/js/components/signature.js`
- **CSS**: `/public/assets/css/signature.css`

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.PubSub` - Event emission
- `Funky.PointerTracker` - Pointer event handling
- `Funky.MediaQuery` - Reduced motion detection (optional)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Chrome for Android 60+

## See Also

- [Funky.PointerTracker](pointer-tracker.md) - Underlying pointer tracking
- [Funky.GestureTracker](gesture-tracker.md) - Touch gesture detection
- [Funky.Form](../core/form.md) - Form validation integration
