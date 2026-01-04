# Funky.TypingIndicator

Real-time typing status display component for chat, comments, and collaborative editing.

## Overview

TypingIndicator shows when users are typing in real-time scenarios:

- Chat messages
- Comment systems
- Collaborative editing
- Live forms
- Customer support interfaces

## Quick Start

```javascript
// Create indicator with container
var indicator = Funky.TypingIndicator.create({
    container: '#typing-indicator',
    channel: 'chat:room-1'
});

// Bind to input for automatic typing detection
indicator.bindInput('#message-input');
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string/Element | null | Container for UI rendering |
| `channel` | string | null | Channel name for broadcasting |
| `timeout` | number | 3000 | Auto-stop timeout in ms |
| `debounce` | number | 300 | Input debounce delay in ms |
| `maxTypers` | number | 5 | Max names before showing count |
| `showDots` | boolean | true | Show animated dots |
| `excludeSelf` | boolean | true | Exclude current user from display |
| `format` | function | null | Custom text format function |
| `onStart` | function | null | Callback when local typing starts |
| `onStop` | function | null | Callback when local typing stops |
| `onChange` | function | null | Callback when typers list changes |

## Local Typing Control

```javascript
// Start/stop typing manually
indicator.startTyping();
indicator.stopTyping();

// Check if currently typing
indicator.isLocalTyping();  // true/false
```

## Remote Typers

```javascript
// Add remote typer (from another user)
indicator.addTyper({ id: 'user-1', name: 'John', avatar: '/avatars/john.png' });

// Remove typer
indicator.removeTyper('user-1');

// Clear all typers
indicator.clearTypers();

// Query typers
indicator.getTypers();      // Array of typer objects
indicator.getTyperCount();  // Number
indicator.hasTypers();      // Boolean
```

## Input Binding

Automatically detect typing based on input events:

```javascript
// Bind to input element
indicator.bindInput('#message-input');
indicator.bindInput(document.getElementById('input'));

// Unbind
indicator.unbindInput(inputElement);
indicator.unbindAllInputs();
```

Input binding handles:
- Debounced input events to reduce noise
- Blur event to stop typing
- Enter key to stop typing (message sent)
- Empty input detection to stop typing

## Text Formatting

```javascript
// Instance method - returns formatted text for current typers
var text = indicator.getText();

// Static helper
Funky.TypingIndicator.formatText([{ name: 'John' }]);
// "John is typing..."

Funky.TypingIndicator.formatText([{ name: 'John' }, { name: 'Jane' }]);
// "John and Jane are typing..."

Funky.TypingIndicator.formatText([{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }]);
// "John, Jane, and Bob are typing..."

// When exceeding maxTypers (default 5)
Funky.TypingIndicator.formatText(manyUsers, 5);
// "10 people are typing..."
```

Custom format function:

```javascript
var indicator = Funky.TypingIndicator.create({
    format: function(typers) {
        if (typers.length === 1) {
            return typers[0].name + ' is writing...';
        }
        return typers.length + ' people are writing...';
    }
});
```

## Events

```javascript
// Local typing events
indicator.on('start', function(data) {
    // data.user - current user info
});

indicator.on('stop', function(data) {
    // data.user - current user info
});

// Remote typer events
indicator.on('remote:start', function(data) {
    // data.user - remote user who started typing
});

indicator.on('remote:stop', function(data) {
    // data.user - remote user who stopped typing
});

// Typers list changed
indicator.on('change', function(data) {
    // data.typers - array of current typers
    // data.text - formatted text string
});

// One-time event
indicator.once('start', function() { });

// Remove handler
indicator.off('start', handler);
indicator.off('start');  // Remove all handlers for event
```

## UI Control

```javascript
// Manual show/hide/toggle
indicator.show();
indicator.hide();
indicator.toggle();

// Check visibility
indicator.isVisible();  // Boolean

// Set custom text
indicator.setText('Someone is typing a long message...');

// Get DOM element
var el = indicator.getElement();
```

## HTML Data Attributes

Auto-initialize from HTML:

```html
<!-- Typing indicator container -->
<div data-typing-indicator
     data-typing-channel="chat:room-1"
     data-typing-timeout="5000"
     data-typing-dots="true">
</div>

<!-- Input that triggers typing -->
<input data-typing-input
       data-typing-channel="chat:room-1"
       placeholder="Type a message...">
```

Auto-initialization runs on DOM ready. Manually trigger with:

```javascript
Funky.TypingIndicator.autoInit();
```

## Channel Integration

When a channel is specified, typing status is broadcast via Funky.Channel:

```javascript
var indicator = Funky.TypingIndicator.create({
    channel: 'chat:room-123'
});

// Typing events are automatically published to the channel
// and remote typing events from others are received
```

## Current User

```javascript
// Set current user (for excludeSelf)
indicator.setCurrentUser({ id: 'me', name: 'My Name' });

// Get current user
var user = indicator.getCurrentUser();
```

## Static API

```javascript
// Get instance by channel
var indicator = Funky.TypingIndicator.getByChannel('chat:room-1');

// Destroy all instances
Funky.TypingIndicator.destroyAll();

// Access defaults
Funky.TypingIndicator.DEFAULTS;
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.typing-indicator` | Root container |
| `.typing-indicator--active` | When visible/typing |
| `.typing-indicator--sm` | Small size variant |
| `.typing-indicator--lg` | Large size variant |
| `.typing-indicator--inline` | Inline display |
| `.typing-indicator--bubble` | Chat bubble style |
| `.typing-indicator--dots-only` | Hide text, show only dots |
| `.typing-indicator--animated` | Enable fade transitions |
| `.typing-indicator__dots` | Animated dots container |
| `.typing-indicator__text` | Text content |

## CSS Customization

```css
/* Override CSS variables */
.my-indicator {
    --typing-dot-size: 8px;
    --typing-dot-color: #007bff;
    --typing-dot-spacing: 4px;
    --typing-animation-speed: 1.2s;
    --typing-text-color: #666;
    --typing-font-size: 0.875rem;
}
```

## Semantic HTML Example

```html
<div class="typing-indicator"
     data-typing-indicator
     data-typing-channel="chat:room-123"
     aria-live="polite"
     hidden>
    <span class="typing-indicator__dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
    </span>
    <span class="typing-indicator__text">John is typing...</span>
</div>
```

## Cleanup

```javascript
// Destroy single instance
indicator.destroy();

// Destroy all instances
Funky.TypingIndicator.destroyAll();
```

## LiveBinding Integration

```html
<div data-live-bind="typing-indicator"
     data-typing-channel="chat:room-1">
</div>
```

```javascript
// Manual LiveBinding
Funky.LiveBinding.register('typing-indicator', Funky.TypingIndicator.liveBindingHandler);
```

## Complete Example

```javascript
// Create indicator
var indicator = Funky.TypingIndicator.create({
    container: '#typing-status',
    channel: 'chat:room-123',
    timeout: 3000,
    showDots: true
});

// Bind to message input
indicator.bindInput('#message-input');

// Set current user
indicator.setCurrentUser({
    id: 'user-123',
    name: 'John Doe'
});

// Listen for changes
indicator.on('change', function(data) {
    console.log('Typing:', data.text);
    console.log('Count:', data.typers.length);
});

// Clean up when done
indicator.destroy();
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES5 compatible (no transpilation required)
- Works without Funky.Dom (vanilla JS fallback)
