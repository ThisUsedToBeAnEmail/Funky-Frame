# Funky.CommandPalette

Spotlight-style command search with Cmd+K / Ctrl+K interface for quick actions, navigation, and search.

## Overview

`Funky.CommandPalette` provides a powerful command interface with:
- Global hotkey activation (Cmd+K / Ctrl+K)
- Fuzzy search with highlighting
- Command categories and grouping
- Keyboard navigation
- Recent commands history
- Sub-palettes for hierarchical commands
- API search integration
- Context-aware commands
- Keyboard shortcut display
- ARIA accessibility

## Quick Start

```javascript
// Initialize the command palette
Funky.CommandPalette.init({
  hotkey: 'mod+k',
  placeholder: 'Type a command or search...'
});

// Register commands
Funky.CommandPalette.register([
  {
    id: 'new-document',
    title: 'New Document',
    shortcut: 'mod+n',
    category: 'File',
    action: function() {
      createNewDocument();
    }
  },
  {
    id: 'search-users',
    title: 'Search Users',
    icon: 'fa-users',
    category: 'Search',
    action: function() {
      navigateTo('/users');
    }
  }
]);
```

## API Reference

### Module Methods

#### `Funky.CommandPalette.init(options)`

Initialize the command palette.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | No | Configuration options |

**Returns:** `void`

---

#### `Funky.CommandPalette.register(commands)`

Register one or more commands.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| commands | object/array | Yes | Command definition or array of commands |

---

#### `Funky.CommandPalette.unregister(id)`

Remove a registered command.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID to remove |

---

#### `Funky.CommandPalette.open(options)`

Open the command palette.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | No | Open options (e.g., `{ query: 'initial search' }`) |

---

#### `Funky.CommandPalette.close()`

Close the command palette.

---

#### `Funky.CommandPalette.toggle()`

Toggle the command palette open/closed.

---

#### `Funky.CommandPalette.isOpen()`

**Returns:** `boolean` - Whether palette is currently open

---

#### `Funky.CommandPalette.setContext(context)`

Set the current context for context-aware commands.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| context | string | Yes | Context identifier |

---

#### `Funky.CommandPalette.getCommands()`

**Returns:** `array` - All registered commands

---

#### `Funky.CommandPalette.destroy()`

Destroy the command palette and clean up.

---

#### `Funky.CommandPalette.registerMany(commands)`

Register multiple commands at once.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| commands | array | Yes | Array of command definitions |

---

#### `Funky.CommandPalette.getCommand(id)`

Get a command by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID |

**Returns:** Command object or `null`

---

#### `Funky.CommandPalette.execute(id)`

Execute a command programmatically.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID to execute |

---

#### `Funky.CommandPalette.enable(id)`

Enable a disabled command.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID |

---

#### `Funky.CommandPalette.disable(id)`

Disable a command.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID |

---

#### `Funky.CommandPalette.show(id)`

Show a hidden command.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID |

---

#### `Funky.CommandPalette.hide(id)`

Hide a command.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID |

---

#### `Funky.CommandPalette.update(id, updates)`

Update command properties dynamically.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID |
| updates | object | Yes | Properties to update |

```javascript
Funky.CommandPalette.update('save', { disabled: true, title: 'Saving...' });
```

---

### Context Methods

#### `Funky.CommandPalette.registerContext(contextName, commands)`

Register commands for a specific context.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| contextName | string | Yes | Context identifier |
| commands | array | Yes | Commands for this context |

---

#### `Funky.CommandPalette.unregisterContext(contextName)`

Unregister all commands for a context.

---

#### `Funky.CommandPalette.clearContext()`

Clear the active context.

---

#### `Funky.CommandPalette.getContext()`

**Returns:** `string` - Current active context

---

### Recent Commands Methods

#### `Funky.CommandPalette.getRecent()`

**Returns:** `array` - Array of recent command IDs

---

#### `Funky.CommandPalette.getRecentCommands()`

**Returns:** `array` - Recent commands as full objects

---

#### `Funky.CommandPalette.removeFromRecent(id)`

Remove a command from recent history.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Command ID to remove |

---

### Navigation Methods

#### `Funky.CommandPalette.back()`

Navigate back from sub-palette.

---

#### `Funky.CommandPalette.getConfig()`

**Returns:** `object` - Copy of current configuration

---

#### `Funky.CommandPalette.getState()`

Get current palette state (useful for debugging).

**Returns:** `object` - Current state including query, results, selected index

---

### Configuration Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| hotkey | string | `'mod+k'` | Activation hotkey (`mod` = Cmd on Mac, Ctrl on Windows) |
| placeholder | string | `'Type a command or search...'` | Input placeholder text |
| maxResults | number | `10` | Maximum results to display |
| showRecent | boolean | `true` | Show recent commands section |
| maxRecent | number | `5` | Maximum recent commands to show |
| fuzzyThreshold | number | `0.4` | Fuzzy match threshold (0-1) |
| debounceMs | number | `150` | Search debounce delay (ms) |
| storageKey | string | `'palette_recent'` | Local storage key for recent commands |
| closeOnSelect | boolean | `true` | Close palette after command execution |
| showShortcuts | boolean | `true` | Display keyboard shortcuts |
| mobileButton | boolean | `false` | Show mobile activation button |
| showContextBadge | boolean | `false` | Show context badges on commands |

---

### Command Definition

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Unique command identifier |
| title | string | Yes | Command display title |
| action | function | Yes | Function to execute when selected |
| shortcut | string | No | Keyboard shortcut (e.g., `'mod+s'`) |
| icon | string | No | FontAwesome icon class (e.g., `'fa-save'`) |
| category | string | No | Category for grouping |
| hint | string | No | Subtitle/description |
| disabled | boolean | No | Whether command is disabled |
| context | string/array | No | Context(s) where command is available |
| children | array | No | Sub-commands (creates sub-palette) |
| keywords | array | No | Additional search keywords |
| hidden | boolean | No | Hide command from list |
| href | string | No | Navigation URL (instead of action) |
| priority | number | No | Sort priority (higher = first) |

---

## Events (PubSub)

### Core Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:palette:init` | `{}` | Palette initialized |
| `funky:palette:open` | `{}` | Palette opened |
| `funky:palette:close` | `{}` | Palette closed |
| `funky:palette:execute` | `{ command }` | Command executed |
| `funky:palette:navigate` | `{ index }` | Navigation changed |
| `funky:palette:search` | `{ query, results }` | Search performed |
| `funky:palette:destroy` | `{}` | Palette destroyed |

### Command Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:palette:register` | `{ command }` | Command registered |
| `funky:palette:unregister` | `{ id }` | Command unregistered |
| `funky:palette:clear` | `{}` | Commands cleared |

### Recent Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:palette:recent:add` | `{ id }` | Command added to recent |
| `funky:palette:recent:remove` | `{ id }` | Command removed from recent |
| `funky:palette:recent:clear` | `{}` | Recent cleared |

### Sub-palette Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:palette:subpalette:open` | `{ command }` | Sub-palette opened |
| `funky:palette:subpalette:close` | `{}` | Sub-palette closed |

### Context Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:palette:context:register` | `{ context }` | Context registered |
| `funky:palette:context:unregister` | `{ context }` | Context unregistered |
| `funky:palette:context:change` | `{ context }` | Active context changed |

### API Search Events
| Event | Payload | Description |
|-------|---------|-------------|
| `funky:palette:api:results` | `{ results }` | API search results received |
| `funky:palette:api:select` | `{ item }` | API result selected |

## Examples

### Basic Commands

```javascript
Funky.CommandPalette.init();

Funky.CommandPalette.register([
  {
    id: 'save',
    title: 'Save',
    shortcut: 'mod+s',
    icon: 'fa-save',
    category: 'File',
    action: function() {
      saveDocument();
    }
  },
  {
    id: 'settings',
    title: 'Open Settings',
    shortcut: 'mod+,',
    icon: 'fa-cog',
    category: 'Application',
    action: function() {
      openSettings();
    }
  }
]);
```

### Sub-Palettes (Hierarchical Commands)

```javascript
Funky.CommandPalette.register({
  id: 'theme',
  title: 'Change Theme',
  icon: 'fa-palette',
  category: 'Appearance',
  children: [
    {
      id: 'theme-light',
      title: 'Light Theme',
      action: function() { setTheme('light'); }
    },
    {
      id: 'theme-dark',
      title: 'Dark Theme',
      action: function() { setTheme('dark'); }
    },
    {
      id: 'theme-system',
      title: 'System Default',
      action: function() { setTheme('system'); }
    }
  ]
});
```

### Context-Aware Commands

```javascript
// Register context-specific commands
Funky.CommandPalette.register([
  {
    id: 'edit-user',
    title: 'Edit User',
    icon: 'fa-user-edit',
    context: 'users',
    action: function() { editCurrentUser(); }
  },
  {
    id: 'delete-trade',
    title: 'Delete Trade',
    icon: 'fa-trash',
    context: 'trades',
    action: function() { deleteCurrentTrade(); }
  }
]);

// Set context based on current page
Funky.CommandPalette.setContext('users');
```

### API Search Integration

```javascript
Funky.CommandPalette.register({
  id: 'search-api',
  title: 'Search Records...',
  icon: 'fa-search',
  category: 'Search',
  children: {
    type: 'api',
    url: '/api/search',
    placeholder: 'Search records...',
    transform: function(results) {
      return results.map(function(item) {
        return {
          id: item.id,
          title: item.name,
          hint: item.type,
          icon: 'fa-file'
        };
      });
    },
    onSelect: function(item) {
      navigateTo('/records/' + item.id);
    }
  }
});
```

### Programmatic Opening

```javascript
// Open with pre-filled query
Funky.CommandPalette.open({ query: 'save' });

// Listen for palette events
Funky.PubSub.on('funky:palette:execute', function(data) {
  console.log('Executed command:', data.command.id);
});
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Cmd/Ctrl+K` | Open palette |
| `Escape` | Close palette / Go back from sub-palette |
| `Up/Down` | Navigate results |
| `Enter` | Execute selected command |
| `Tab` | Enter sub-palette |
| `Backspace` (empty input) | Go back from sub-palette |

## Accessibility

- Dialog uses `role="dialog"` with `aria-modal="true"`
- Input uses `role="combobox"` with proper ARIA attributes
- Results use `role="listbox"` with `aria-activedescendant`
- Keyboard shortcuts displayed with `<kbd>` elements
- Focus trapped within palette when open
- Screen reader announcements for result count

## Dependencies

- **Required:** `Funky.Dom`, `Funky.PubSub`
- **Optional:** `Funky.Keyboard` (shortcuts), `Funky.FuzzySearch` (search), `Funky.SelectableList` (navigation), `Funky.History` (recent commands), `Funky.Timing` (debounce), `Funky.FocusManager` (focus trap)
