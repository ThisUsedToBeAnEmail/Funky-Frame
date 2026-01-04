# Keyboard Manager

Centralized keyboard shortcut management with scoping, conflict resolution, and discoverability.

## Features

- **Central Registry** - All shortcuts in one place
- **Scope System** - Shortcuts activate based on context
- **Conflict Resolution** - Priority-based, first match wins
- **Help Overlay** - Press F1 to see all shortcuts
- **Platform Aware** - `mod` maps to ⌘ on Mac, Ctrl elsewhere
- **No jQuery** - Pure vanilla JavaScript

---

## Quick Start

### Register a Shortcut

```javascript
Funky.Keyboard.register({
  key: 's',
  mod: true,
  handler: function() {
    saveDocument();
  },
  description: 'Save document',
  group: 'Editor'
});
```

### Component-Scoped Shortcut

```javascript
Funky.Keyboard.register({
  key: 'space',
  scope: '#video-player',
  handler: function() {
    togglePlayPause();
  },
  description: 'Play / Pause',
  group: 'Video'
});
```

---

## Configuration

### Shortcut Object

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | string | required | Key name (see Key Names below) |
| `mod` | boolean | `false` | Platform modifier (⌘ on Mac, Ctrl elsewhere) |
| `ctrl` | boolean | `false` | Ctrl key (explicit, not platform-aware) |
| `alt` | boolean | `false` | Alt/Option key |
| `shift` | boolean | `false` | Shift key |
| `meta` | boolean | `false` | Meta key (⌘ on Mac, Win elsewhere) |
| `handler` | function | required | Callback function |
| `scope` | string | `'global'` | Scope name or element selector |
| `context` | object | `null` | `this` binding for handler |
| `description` | string | `''` | Help text shown in F1 overlay |
| `group` | string | `'General'` | Grouping in help overlay |
| `preventDefault` | boolean | `true` | Call preventDefault on event |
| `stopPropagation` | boolean | `false` | Stop event bubbling |
| `allowInInput` | boolean | `false` | Fire when in input fields |
| `priority` | number | `0` | Higher priority = checked first |

### Key Names

| Category | Keys |
|----------|------|
| Letters | `a` - `z` |
| Numbers | `0` - `9` |
| Function | `f1` - `f12` |
| Navigation | `up`, `down`, `left`, `right`, `home`, `end`, `pageup`, `pagedown` |
| Editing | `backspace`, `delete`, `enter`, `tab`, `space` |
| Special | `escape`, `;`, `=`, `,`, `-`, `.`, `/`, `` ` ``, `[`, `\`, `]`, `'` |

---

## Methods

### register(options)

Register a keyboard shortcut. Returns an unregister function.

```javascript
var unregister = Funky.Keyboard.register({
  key: 'k',
  mod: true,
  handler: openSearch,
  description: 'Open search'
});

// Later, to remove:
unregister();
```

### pushScope(scope, context?)

Push a scope onto the stack. Shortcuts in this scope become active.

```javascript
// When modal opens
Funky.Keyboard.pushScope('modal');

// With context for `this` binding
Funky.Keyboard.pushScope('editor', editorInstance);
```

### popScope()

Pop the current scope from the stack.

```javascript
// When modal closes
Funky.Keyboard.popScope();
```

### replaceScope(scope, context?)

Replace the current scope (pop then push).

```javascript
Funky.Keyboard.replaceScope('new-modal');
```

### clearScopes()

Clear all scopes except global.

```javascript
Funky.Keyboard.clearScopes();
```

### getCurrentScope()

Get the current active scope name.

```javascript
var scope = Funky.Keyboard.getCurrentScope();
// Returns: 'modal' or 'global'
```

### getActiveScopes()

Get all scopes currently in the stack.

```javascript
var scopes = Funky.Keyboard.getActiveScopes();
// Returns: ['global', 'editor', 'modal']
```

### hasScope(scope)

Check if a scope is in the stack.

```javascript
if (Funky.Keyboard.hasScope('modal')) {
  // Modal scope is active
}
```

### showHelp() / hideHelp() / toggleHelp()

Control the help overlay.

```javascript
Funky.Keyboard.showHelp();
Funky.Keyboard.hideHelp();
Funky.Keyboard.toggleHelp();
```

### getShortcuts(filter?)

Get registered shortcuts, optionally filtered.

```javascript
// All shortcuts
var all = Funky.Keyboard.getShortcuts();

// Filter by scope
var modal = Funky.Keyboard.getShortcuts({ scope: 'modal' });

// Filter by group
var editor = Funky.Keyboard.getShortcuts({ group: 'Editor' });

// Only active scopes
var active = Funky.Keyboard.getShortcuts({ activeOnly: true });
```

### formatShortcut(shortcut)

Format a shortcut object for display.

```javascript
var formatted = Funky.Keyboard.formatShortcut({
  key: 's',
  mod: true,
  shift: true
});
// Mac: '⌘⇧S'
// Windows: 'Ctrl+Shift+S'
```

### unregisterScope(scope)

Remove all shortcuts registered to a scope.

```javascript
Funky.Keyboard.unregisterScope('editor');
```

### unregisterGroup(group)

Remove all shortcuts in a group.

```javascript
Funky.Keyboard.unregisterGroup('Calendar');
```

---

## Scopes

### Global Scope

Always active, lowest priority. Default for all shortcuts.

```javascript
Funky.Keyboard.register({
  key: 'k',
  mod: true,
  scope: 'global',  // default
  handler: openSearch
});
```

### Element Scope

Active when the element (or any child) has focus. Use CSS selector starting with `#`.

```javascript
Funky.Keyboard.register({
  key: 'space',
  scope: '#my-video',  // CSS selector
  handler: togglePlay
});
```

### Named Scope

Active when pushed onto the scope stack.

```javascript
// Push when modal opens
Funky.Keyboard.pushScope('modal');

// This shortcut is now active
Funky.Keyboard.register({
  key: 'escape',
  scope: 'modal',
  handler: closeModal
});

// Pop when modal closes
Funky.Keyboard.popScope();
```

### Scope Priority

Scopes are checked from top to bottom of the stack. The first matching shortcut wins.

```
┌─────────────────────────────────────┐
│ Scope Stack                         │
├─────────────────────────────────────┤
│ [3] confirm-dialog (top)            │  ← Checked first
│ [2] modal                           │
│ [1] global (default)                │  ← Checked last
└─────────────────────────────────────┘
```

---

## Events

The keyboard manager emits events on the document:

```javascript
// Scope pushed
document.addEventListener('funky.keyboard.scope-push', function(e) {
  console.log('Scope pushed:', e.detail.scope);
  console.log('Stack:', e.detail.stack);
});

// Scope popped
document.addEventListener('funky.keyboard.scope-pop', function(e) {
  console.log('Scope popped:', e.detail.scope);
});

// Help shown
document.addEventListener('funky.keyboard.help-show', function() {
  console.log('Help overlay opened');
});

// Help hidden
document.addEventListener('funky.keyboard.help-hide', function() {
  console.log('Help overlay closed');
});

// Global shortcuts emit these (for app-level handling)
document.addEventListener('funky.keyboard.search', function() {
  openSearchModal();
});

document.addEventListener('funky.keyboard.settings', function() {
  openSettingsModal();
});
```

---

## Reserved Keys

| Key | Purpose |
|-----|---------|
| `F1` | Help overlay |
| `F2` | Toggle active-only filter (in help overlay) |
| `Escape` | Close help overlay (when open) |
| `⌘/Ctrl+K` | Quick search (emits event) |
| `⌘/Ctrl+,` | Settings (emits event) |
| `⌘/Ctrl+/` | Help overlay (alias for F1) |

---

## Platform Detection

```javascript
if (Funky.Keyboard.isMac) {
  // Show ⌘ symbol
} else {
  // Show Ctrl
}
```

---

## Examples

### Component Integration

```javascript
function MyComponent(elementId) {
  this.elementId = elementId;
  this._registerShortcuts();
}

MyComponent.prototype._registerShortcuts = function() {
  var self = this;
  var scope = '#' + this.elementId;
  
  this._unregisters = [
    Funky.Keyboard.register({
      key: 'n',
      scope: scope,
      handler: function() { self.newItem(); },
      description: 'New item',
      group: 'My Component'
    }),
    Funky.Keyboard.register({
      key: 'delete',
      scope: scope,
      handler: function() { self.deleteItem(); },
      description: 'Delete item',
      group: 'My Component'
    })
  ];
};

MyComponent.prototype.destroy = function() {
  // Clean up shortcuts
  this._unregisters.forEach(function(fn) { fn(); });
};
```

### Modal Pattern

```javascript
var escapeUnregister;

function openModal() {
  showModalDOM();
  
  // Push modal scope
  Funky.Keyboard.pushScope('modal');
  
  // Register escape to close
  escapeUnregister = Funky.Keyboard.register({
    key: 'escape',
    scope: 'modal',
    handler: closeModal,
    description: 'Close',
    group: 'Modal'
  });
}

function closeModal() {
  hideModalDOM();
  
  // Clean up
  escapeUnregister();
  Funky.Keyboard.popScope();
}
```

### Nested Modals

```javascript
function openConfirmDialog() {
  // Push another scope on top of existing modal
  Funky.Keyboard.pushScope('confirm');
  
  // This escape takes priority over the modal's escape
  var unregister = Funky.Keyboard.register({
    key: 'escape',
    scope: 'confirm',
    handler: function() {
      closeConfirmDialog();
      unregister();
      Funky.Keyboard.popScope();
    },
    description: 'Cancel',
    group: 'Confirm'
  });
}
```

---

## Help Overlay

Press `F1` anywhere to see all registered shortcuts.

### Features

- **Search** - Filter shortcuts by typing
- **Groups** - Shortcuts organized by component/feature
- **Active Indicator** - Shows which groups are currently active
- **F2 Toggle** - Show only shortcuts in active scopes

### Styling

The help overlay uses these CSS variables:

```css
--modal-bg
--border-color
--text-primary
--text-secondary
--primary
--hover-bg
--card-bg
```

---

## FocusManager Integration

When `Funky.FocusManager` is available, the keyboard manager integrates with it for enhanced navigation:

### Global Escape Handler

The escape key follows a priority hierarchy:

1. **Help overlay** - If open, closes it
2. **FocusManager history** - If there's focus history, pops it (returns focus to previous element)
3. **Scope handlers** - Runs any registered escape handlers in current scope
4. **Global handlers** - Falls back to global escape shortcuts

```javascript
// Escape key behavior when FocusManager available:
// 1. Close help overlay (if open)
// 2. Pop focus history (e.g., return from modal to trigger button)
// 3. Run scope-specific escape handler
// 4. Run global escape handler
```

### Tab Region Navigation

Navigate between page regions using Tab. Requires `Funky.FocusManager` and the `keyboard.regionTabNavigation` preference to be enabled.

When active:
- **Tab** on last element in region → Jump to next region
- **Shift+Tab** on first element in region → Jump to previous region

```javascript
// Enable via Preferences
Funky.Preferences.set('keyboard.regionTabNavigation', true);

// Also available via dedicated shortcuts
// Tab+Space or Ctrl+] → Next region
// Shift+Tab+Space or Ctrl+[ → Previous region
```

---

## Best Practices

1. **Always provide descriptions** - Makes shortcuts discoverable in help overlay
2. **Use meaningful groups** - Group by component or feature
3. **Clean up on destroy** - Always call the unregister function when component is destroyed
4. **Use element scopes for focus-based shortcuts** - e.g., `#my-component`
5. **Use named scopes for modals/overlays** - Push when open, pop when close
6. **Avoid conflicts** - Check existing shortcuts before registering common keys
7. **Use `mod` for cross-platform** - Instead of explicit `ctrl` or `meta`

---

## Dependencies

- **Required:** None
- **Funky.FocusManager** (optional) - Tab region navigation and escape history
- **Funky.Preferences** (optional) - User preference for `keyboard.regionTabNavigation`
- **Funky.Dom** (optional) - VDom-based help overlay rendering

---

## See Also

- [FocusManager](focus-manager.md) - Focus management and region navigation
- [Preferences](../components/preferences.md) - User preferences system
- [Events](events.md) - Event system
