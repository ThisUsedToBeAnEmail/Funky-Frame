# Funky.Iframe

A secure iframe component with three display modes: embed (inline), modal (popup dialog), and detached (new browser window). Includes postMessage bridge for bidirectional communication.

## Quick Start

```html
<div id="iframe-container"></div>

<script>
var iframe = Funky.Iframe.init('#iframe-container', {
    src: 'https://example.com',
    mode: 'embed',
    height: '400px',
    onMessage: function(data) {
        console.log('Received:', data);
    }
});
</script>
```

## Installation

Include the CSS and JavaScript files:

```html
<link rel="stylesheet" href="/assets/css/components/iframe.css">
<script src="/assets/js/components/iframe.js"></script>
```

---

## API Reference

### Funky.Iframe.init(container, options)

Create a new iframe instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | String/Element | CSS selector or DOM element |
| `options` | Object | Configuration options |

**Returns:** Iframe instance

### Funky.Iframe.getInstance(id)

Get an existing instance by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Instance identifier |

**Returns:** Iframe instance or `undefined`

### Funky.Iframe.initAll(container)

Auto-initialize iframes from `[data-funky="iframe"]` elements.

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | Element | Container to search in (default: document) |

**Returns:** Number of iframes initialized

### Funky.Iframe.observe(options)

Watch for new `[data-iframe]` elements added to the DOM.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | Object | Default options for observed instances |

### Funky.Iframe.destroyAll()

Destroy all iframe instances and clean up resources.

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | String | `''` | URL to load in iframe |
| `mode` | String | `'embed'` | Display mode: `'embed'`, `'modal'`, `'detached'` |
| `width` | String | `'100%'` | Iframe width (CSS value) |
| `height` | String | `'400px'` | Iframe height (CSS value) |
| `title` | String | `'Iframe'` | Title for modal/detached modes |
| `sandbox` | String | `'allow-scripts allow-same-origin allow-forms allow-popups'` | Sandbox attribute value |
| `allowFullscreen` | Boolean | `true` | Allow fullscreen API |
| `loading` | String | `'lazy'` | Loading strategy: `'lazy'`, `'eager'` |
| `referrerPolicy` | String | `'strict-origin-when-cross-origin'` | Referrer policy |
| `triggerText` | String | `'Open Window'` | Button text for detached mode |
| `triggerIcon` | String | `'fa-external-link-alt'` | Icon class for detached trigger |
| `showLoadingIndicator` | Boolean | `true` | Show loading spinner |
| `windowWidth` | Number | `800` | Width for detached window |
| `windowHeight` | Number | `600` | Height for detached window |

### Callback Options

| Option | Type | Description |
|--------|------|-------------|
| `onMessage` | Function | Called when postMessage received |
| `onLoad` | Function | Called when iframe loads |
| `onClose` | Function | Called when modal/detached closes |

---

## Display Modes

### Embed Mode

Renders an inline iframe directly in the container element.

```javascript
Funky.Iframe.init('#container', {
    src: '/embedded-content.html',
    mode: 'embed',
    width: '100%',
    height: '500px'
});
```

### Modal Mode

Opens the iframe in a Funky.Modal dialog.

```javascript
var iframe = Funky.Iframe.init('#trigger-container', {
    src: '/external-form.html',
    mode: 'modal',
    title: 'External Form',
    width: '800px',
    height: '600px',
    onClose: function() {
        console.log('Modal closed');
    }
});

// Show the modal
iframe.show();
```

### Detached Mode

Creates a trigger button that opens a new browser window.

```javascript
Funky.Iframe.init('#container', {
    src: '/external-app.html',
    mode: 'detached',
    triggerText: 'Open in New Window',
    triggerIcon: 'fa-external-link-alt',
    windowWidth: 1024,
    windowHeight: 768,
    onClose: function() {
        console.log('External window closed');
    }
});
```

---

## Instance Methods

### iframe.show()

Show the modal or trigger the detached window.

```javascript
iframe.show();
```

### iframe.hide()

Hide the modal or close the detached window.

```javascript
iframe.hide();
```

### iframe.setSrc(url)

Change the iframe source URL.

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | String | New URL to load |

```javascript
iframe.setSrc('/new-content.html');
```

### iframe.getIframe()

Get the underlying iframe element (embed mode only).

**Returns:** HTMLIFrameElement or `null`

```javascript
var iframeEl = iframe.getIframe();
if (iframeEl) {
    iframeEl.contentWindow.postMessage({ action: 'ping' }, '*');
}
```

### iframe.destroy()

Destroy the instance and clean up all resources.

```javascript
iframe.destroy();
```

---

## PostMessage Bridge

The iframe component includes a built-in postMessage bridge for secure communication with embedded content.

### Sending Messages TO the Iframe

```javascript
var iframeEl = iframe.getIframe();
iframeEl.contentWindow.postMessage({
    action: 'customAction',
    data: { key: 'value' }
}, '*');
```

### Receiving Messages FROM the Iframe

Messages sent from the embedded page are received via the `onMessage` callback:

```javascript
Funky.Iframe.init('#container', {
    src: '/embedded.html',
    onMessage: function(data) {
        console.log('Action:', data.action);
        console.log('Payload:', data);
    }
});
```

### Built-in Actions

The bridge handles these actions automatically:

| Action | Description | Payload |
|--------|-------------|---------|
| `resize` | Resize the iframe | `{ height: 600 }` |
| `close` | Close modal/detached window | - |
| `redirect` | Navigate parent to URL | `{ url: '/path' }` |

### From Embedded Page

```javascript
// Request resize
window.parent.postMessage({
    action: 'resize',
    height: document.body.scrollHeight
}, '*');

// Close the modal/window
window.parent.postMessage({
    action: 'close'
}, '*');

// Navigate parent page
window.parent.postMessage({
    action: 'redirect',
    url: '/success-page'
}, '*');

// Custom action
window.parent.postMessage({
    action: 'formSubmitted',
    data: { id: 123 }
}, '*');
```

---

## Data Attributes

Initialize iframes declaratively using data attributes:

```html
<div data-iframe
     data-src="/content.html"
     data-mode="embed"
     data-height="500px"
     data-title="My Iframe">
</div>
```

### Available Attributes

| Attribute | Option |
|-----------|--------|
| `data-src` | `src` |
| `data-mode` | `mode` |
| `data-width` | `width` |
| `data-height` | `height` |
| `data-title` | `title` |
| `data-trigger-text` | `triggerText` |
| `data-sandbox` | `sandbox` |
| `data-loading` | `loading` |

---

## Events

The component emits events via Funky.Events on the container element:

| Event | Description | Detail |
|-------|-------------|--------|
| `iframe:load` | Iframe finished loading | `{ src }` |
| `iframe:message` | PostMessage received | `{ action, ...data }` |
| `iframe:close` | Modal/window closed | - |
| `iframe:destroy` | Instance destroyed | - |

### Listening to Events

```javascript
Funky.Events.on(container, 'funky.iframe.message', function(e) {
    console.log('Message:', e.detail);
});

Funky.Events.on(container, 'funky.iframe.close', function() {
    console.log('Iframe closed');
});
```

---

## Theming

The component uses CSS variables for theming:

```css
:root {
    --iframe-border-radius: var(--pro-border-radius);
    --iframe-border-color: var(--pro-border-color);
    --iframe-bg: var(--pro-bg);
    --iframe-shadow: var(--pro-shadow);
    --iframe-overlay-bg: rgba(0, 0, 0, 0.5);
    --iframe-trigger-bg: var(--pro-primary);
    --iframe-trigger-color: #ffffff;
    --iframe-loading-color: var(--pro-primary);
    --iframe-loading-bg: var(--pro-bg-subtle);
}
```

### Density Modes

The component respects density settings:

| Mode | Trigger Padding | Font Size |
|------|-----------------|-----------|
| Compact | `0.375rem 0.75rem` | `0.8125rem` |
| Comfortable | `0.5rem 1rem` | `0.875rem` |
| Spacious | `0.75rem 1.5rem` | `1rem` |

---

## Accessibility

- Trigger buttons include proper ARIA labels
- Keyboard navigation support (Enter/Space to activate)
- Focus management for modal mode
- Respects `prefers-reduced-motion`

---

## Security

The component includes several security measures:

1. **Sandbox Attribute**: Default sandbox restricts embedded content
2. **Referrer Policy**: Strict origin policy by default
3. **Origin Validation**: PostMessage origin checking (when configured)
4. **URL Validation**: Blocks `javascript:` URLs in redirects

### Custom Sandbox

Adjust the sandbox for trusted content:

```javascript
Funky.Iframe.init('#container', {
    src: '/trusted-app.html',
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
});
```

---

## Examples

### Payment Form Integration

```javascript
Funky.Iframe.init('#payment-container', {
    src: 'https://payment-provider.com/checkout',
    mode: 'modal',
    title: 'Secure Payment',
    height: '500px',
    onMessage: function(data) {
        if (data.action === 'paymentComplete') {
            this.hide();
            showSuccessMessage(data.transactionId);
        }
    }
});
```

### External Documentation

```javascript
Funky.Iframe.init('#docs-trigger', {
    src: '/api/docs',
    mode: 'detached',
    triggerText: 'Open API Documentation',
    triggerIcon: 'fa-book',
    windowWidth: 1200,
    windowHeight: 800
});
```

### Responsive Embed

```javascript
Funky.Iframe.init('#responsive-embed', {
    src: '/video-embed.html',
    mode: 'embed',
    width: '100%',
    height: 'auto',
    onLoad: function() {
        // Request embedded page to send its height
        var iframeEl = this.getIframe();
        iframeEl.contentWindow.postMessage({ action: 'getHeight' }, '*');
    },
    onMessage: function(data) {
        if (data.action === 'setHeight') {
            var iframeEl = this.getIframe();
            iframeEl.style.height = data.height + 'px';
        }
    }
});
```

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

---

## See Also

- [Modal](modal.md) - Modal dialog component
- [Toast](toast.md) - Toast notifications
- [Funky.Events](../core/events.md) - Event system
