# Funky.SideNavPanel - SideNav with Content Panels

Companion component that pairs SideNav with content panels, supporting lazy loading, animations, and lifecycle hooks.

## Overview

`Funky.SideNavPanel` combines a SideNav sidebar with a content panel area:
- Automatic panel switching on navigation
- Lazy loading of panel content
- Fade/slide animations
- Lifecycle hooks (onInit, onActivate, onDeactivate)
- Static content or dynamic render functions

## Quick Start

```javascript
Funky.SideNavPanel.init({
  sidenav: '#sidebarNav',
  panels: '#panelContent',
  items: [
    { id: 'general', label: 'General', icon: 'fas fa-cog', 
      content: '<h3>General Settings</h3><p>Configure options here.</p>' },
    { id: 'appearance', label: 'Appearance', icon: 'fas fa-palette',
      render: function(panel) {
        panel.innerHTML = '<h3>Appearance</h3>';
        // Dynamic content loading
      }
    }
  ]
});
```

## API Reference

### Factory Method

#### `SideNavPanel.init(config)`

Create and initialize a new SideNavPanel instance.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `Object` | Configuration options |

**Returns:** `SideNavPanel` instance

---

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sidenav` | `string \| Element` | Required | Container for SideNav |
| `panels` | `string \| Element` | Required | Container for content panels |
| `items` | `Array` | `[]` | Items with content (see Item Schema) |
| `lazyLoad` | `boolean` | `true` | Only render panels when first activated |
| `animation` | `string` | `'fade'` | Animation type: `'none'`, `'fade'`, `'slide'` |
| `sidenavConfig` | `Object` | `{}` | Additional config passed to SideNav |

### Item Schema

Items extend the standard SideNav item schema with content properties:

```javascript
{
  id: 'unique-id',        // Required: unique identifier
  label: 'Display Name',  // Required: display text
  icon: 'fas fa-icon',    // Optional: FontAwesome class
  
  // Content (one of these):
  content: '<html>...',   // Static HTML string
  render: function(panel) { ... }  // Dynamic render function
}
```

### Content Types

**Static Content:**
```javascript
{
  id: 'about',
  label: 'About',
  content: '<div class="p-3"><h4>About</h4><p>Static content.</p></div>'
}
```

**Dynamic Render Function:**
```javascript
{
  id: 'users',
  label: 'Users',
  render: function(panel) {
    panel.innerHTML = '<div class="loading">Loading...</div>';
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        panel.innerHTML = renderUserList(data);
      });
  }
}
```

---

### Instance Methods

#### `getPanel(id)`

Get a panel element by ID.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Panel ID |

**Returns:** `Element | null`

---

#### `getActive()`

Get the currently active panel ID.

**Returns:** `string | null`

---

#### `refreshPanel(id)`

Re-render a panel's content.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Panel ID to refresh |

**Example:**
```javascript
// Force re-render after data change
sideNavPanel.refreshPanel('users');
```

---

#### `select(id)`

Programmatically select a panel.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Panel ID to activate |

---

#### `setItems(items)`

Replace all items and panels.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `items` | `Array` | New items array |

---

#### `destroy()`

Clean up and remove the component.

---

### Callbacks

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onInit` | `(id, panel)` | Fired when panel is first initialized |
| `onActivate` | `(id, panel)` | Fired when panel becomes active |
| `onDeactivate` | `(id)` | Fired when panel is deactivated |

---

## Examples

### Settings Page

```javascript
Funky.SideNavPanel.init({
  sidenav: '#settingsNav',
  panels: '#settingsContent',
  animation: 'fade',
  lazyLoad: true,
  items: [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: 'fas fa-user',
      render: function(panel) {
        loadProfileForm(panel);
      }
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: 'fas fa-shield-alt',
      content: securitySettingsHTML 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: 'fas fa-bell',
      render: function(panel) {
        loadNotificationPrefs(panel);
      }
    }
  ],
  sidenavConfig: {
    searchable: true,
    searchPlaceholder: 'Search settings...'
  },
  onActivate: function(id, panel) {
    console.log('Activated panel:', id);
    trackAnalytics('settings_panel_view', { panel: id });
  }
});
```

### With Slide Animation

```javascript
Funky.SideNavPanel.init({
  sidenav: '#nav',
  panels: '#content',
  animation: 'slide',  // Slide in from right
  items: myItems
});
```

### Lazy Loading

```javascript
Funky.SideNavPanel.init({
  sidenav: '#nav',
  panels: '#content',
  lazyLoad: true,  // Panels only render when first visited
  items: [
    {
      id: 'heavy-content',
      label: 'Reports',
      render: function(panel) {
        // This only runs when user clicks "Reports"
        loadHeavyReportsModule(panel);
      }
    }
  ]
});
```

---

## Animations

| Value | Description |
|-------|-------------|
| `'none'` | No animation, instant switch |
| `'fade'` | Fade out old panel, fade in new |
| `'slide'` | Slide panels horizontally |

Animation duration is controlled via CSS:
```css
.sidenav-panel {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
```

---

## Layout

The component creates this structure:

```html
<div class="sidenav-panel-layout">
  <!-- SideNav container -->
  <div class="funky-sidenav">...</div>
  
  <!-- Panels container -->
  <div class="sidenav-panels">
    <div class="sidenav-panel active" data-panel="general">...</div>
    <div class="sidenav-panel" data-panel="appearance">...</div>
  </div>
</div>
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.sidenav-panel-layout` | Flex container for layout |
| `.sidenav-panels` | Panels container |
| `.sidenav-panel` | Individual panel |
| `.sidenav-panel.active` | Currently visible panel |
| `.sidenav-panel.fade-in` | Panel fading in |
| `.sidenav-panel.fade-out` | Panel fading out |

---

## Responsive Behavior

- **Desktop (> 768px)**: Side-by-side layout
- **Tablet (< 768px)**: Stacked layout, panels below nav
- **Mobile (< 576px)**: Drawer mode with slide-in panels

---

## Dependencies

- `Funky.SideNav` (core navigation component)
- FontAwesome 5+ (for icons)
- themes.css (for `--pro-*` CSS variables)
