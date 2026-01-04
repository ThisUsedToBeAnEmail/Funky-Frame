# Funky.SkipLink

**File:** `public/assets/js/components/skip-link.js`

Accessible Skip Link Component using keyboard shortcuts for quick navigation.

---

## Overview

Funky.SkipLink provides F-key shortcuts to quickly navigate to key sections of the page. It auto-discovers skip targets and registers them as keyboard shortcuts, integrating seamlessly with SPA navigation and the Funky.Keyboard system.

### Why Use Funky.SkipLink?

- **Accessibility** - Enables keyboard users to quickly navigate to key sections (WCAG 2.1 Level A criterion 2.4.1)
- **Auto-Discovery** - Automatically finds skip targets via `data-skip-target` attributes
- **F-Key Shortcuts** - Maps targets to F3-F12 keys for instant access
- **Keyboard Integration** - Uses Funky.Keyboard for centralized shortcut management
- **SPA-Aware** - Reinitializes on page transitions to handle dynamic content
- **Zero Configuration** - Works automatically with sensible defaults
- **ARIA Integration** - Uses existing `#spa-announcer` for screen reader feedback

---

## Features

- Auto-discovery via `data-skip-target` attributes
- F-key shortcuts (F3-F12) for quick navigation
- **First Tab** automatically shows help menu for discovery (WCAG compliant)
- F1 key opens help menu showing all available shortcuts
- F2 toggles "Active only" filter in help modal
- SPA-aware (reinitializes on page transitions)
- ARIA announcements via live region
- Smooth focus and scroll management
- Manual registration API for dynamic targets
- Automatic ordering via `data-skip-order` attribute

---

## Quick Start

### HTML

Add `data-skip-target` attributes to key landmarks:

```html
<!-- Define skip targets (F-keys auto-assigned) -->
<nav id="sidebarNav" data-skip-target="navigation" data-skip-label="primary navigation" data-skip-order="0">
  <!-- navigation content -->
  <!-- Automatically mapped to F3 -->
</nav>

<main id="spaContent" data-skip-target="main" data-skip-label="main content" data-skip-order="1">
  <!-- main content -->
  <!-- Automatically mapped to F4 -->
</main>
```

### JavaScript

The component auto-initializes on page load. Optionally initialize manually:

```javascript
// Auto-initialization (done automatically)
Funky.SkipLink.init();

// Manual registration
Funky.SkipLink.register({
  label: 'search results',
  target: '#searchBox',
  order: 5
});

// Programmatic skip
Funky.SkipLink.skipTo('#spaContent');
```

### Keyboard Usage

- **Tab** (first time) - Automatically opens help modal showing all keyboard shortcuts
- **F1** - Open help modal anytime
- **F2** - Toggle "Active only" filter in help modal (reserved)
- **F3-F12** - Jump directly to page sections (auto-assigned in order)
- The help modal displays which F-key maps to which page section

The first Tab press provides automatic discovery - the help modal opens immediately to teach users about available shortcuts.

---

## API Reference

### Methods

#### init(options)

Initialize skip link component.

**Parameters:**
- `options` (Object) - Configuration options (optional)
  - `containerSelector` (string) - Container for skip links (default: `'#skip-links'`)
  - `targetAttribute` (string) - Attribute to detect targets (default: `'data-skip-target'`)
  - `labelAttribute` (string) - Attribute for labels (default: `'data-skip-label'`)
  - `orderAttribute` (string) - Attribute for ordering (default: `'data-skip-order'`)
  - `announcerSelector` (string) - ARIA live region (default: `'#spa-announcer'`)
  - `skipLinkClass` (string) - CSS class for links (default: `'skip-link'`)
  - `focusScrollBehavior` (string) - Scroll behavior (default: `'smooth'`)

**Example:**
```javascript
Funky.SkipLink.init({
  containerSelector: '#my-skip-links',
  focusScrollBehavior: 'auto'
});
```

---

#### refresh()

Refresh skip links (rescan targets and regenerate links).

Called automatically on SPA navigation.

**Example:**
```javascript
// After dynamically adding content
Funky.SkipLink.refresh();
```

---

#### register(config)

Manually register a skip link.

**Parameters:**
- `config` (Object)
  - `label` (string) - Link label (required)
  - `target` (string) - Target selector (required)
  - `order` (number) - Sort order (optional, default: 999)

**Example:**
```javascript
// Register a dynamic skip target
Funky.SkipLink.register({
  label: 'search results',
  target: '#searchResults',
  order: 3
});
```

---

#### skipTo(targetSelector)

Programmatically skip to a target element.

**Parameters:**
- `targetSelector` (string) - CSS selector for target

**Example:**
```javascript
// Skip to main content programmatically
Funky.SkipLink.skipTo('#spaContent');
```

---

#### destroy()

Destroy skip links and clear state.

**Example:**
```javascript
Funky.SkipLink.destroy();
```

---

## HTML Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-skip-target` | Identifier | Marks element as a skip target |
| `data-skip-label` | Text | Label for the skip link |
| `data-skip-order` | Number | Sort order (0 = first, higher = later) |

### Examples

**Navigation (First Skip Link):**
```html
<nav id="sidebarNav"
     data-skip-target="navigation"
     data-skip-label="primary navigation"
     data-skip-order="0">
  <!-- nav items -->
</nav>
```

**Main Content (Second Skip Link):**
```html
<main id="spaContent"
      data-skip-target="main"
      data-skip-label="main content"
      data-skip-order="1">
  <%= content %>
</main>
```

**Breadcrumb (Optional):**
```html
<nav id="pageBreadcrumb"
     data-skip-target="breadcrumb"
     data-skip-label="breadcrumb navigation"
     data-skip-order="1">
  <!-- breadcrumb items -->
</nav>
```

**Page Section (Multi-Section Pages):**
```html
<article id="section-intro"
         data-skip-target="intro"
         data-skip-label="Introduction"
         data-skip-order="10">
  <!-- section content -->
</article>

<article id="section-examples"
         data-skip-target="examples"
         data-skip-label="Examples"
         data-skip-order="20">
  <!-- section content -->
</article>
```

---

## SPA Integration

### Auto-Refresh on Navigation

Skip links automatically refresh on SPA page transitions:

```javascript
// In skip-link.js
document.addEventListener('funky.spa.pageload', function(event) {
  setTimeout(function() {
    SkipLink.refresh();
  }, 50);
});
```

### Pages Integration

The `Funky.Pages` module automatically calls `SkipLink.refresh()` when mounting pages:

```javascript
// In pages.js mount() function
if (window.Funky && window.Funky.SkipLink) {
  Funky.SkipLink.refresh();
}
```

This ensures skip links update when:
- User navigates to a new page
- Page content changes dynamically
- New skip targets are added to the DOM

---

## Accessibility

### Keyboard Navigation

1. **Tab** - Reveals skip links at top of page
2. **Enter/Space** - Activates focused skip link
3. **Tab** again - Move to next skip link or continue to page content

### ARIA Announcements

When a skip link is activated:
1. Focus moves to target element
2. Screen reader announces: "Skipped to [label]"
3. Target scrolls into view smoothly

### Focus Management

The component ensures target elements are focusable:
- Adds `tabindex="-1"` if element lacks a tabindex
- Focuses the element
- Scrolls smoothly into view
- Announces the action to screen readers

---

## CSS Styling

### Default Behavior

Skip links are hidden by default and appear on keyboard focus:

```css
.skip-link {
  position: absolute;
  top: -100vh; /* Hidden off-screen */
}

.skip-link:focus {
  position: static; /* Visible when focused */
  top: 0.5rem;
}
```

### Theme Support

The component supports all Funky themes:
- **Light** - Blue background with white text
- **Dark** - Blue background with white text (adjusted contrast)
- **Even Funkyer** - Green background with black text and glow effect

### Customization

Override CSS variables or classes as needed:

```css
/* Custom skip link styling */
.skip-link {
  background-color: #your-color;
  color: #your-text-color;
}
```

---

## Complete Examples

### Example 1: Standard App Layout

**HTML (app.html.ep):**
```html
<body>
  <!-- Skip link container -->
  <div id="skip-links" class="skip-links" role="navigation" aria-label="Skip links"></div>

  <!-- Sidebar navigation -->
  <nav id="sidebarNav"
       data-skip-target="navigation"
       data-skip-label="primary navigation"
       data-skip-order="0">
    <!-- nav items -->
  </nav>

  <!-- Breadcrumb -->
  <nav id="pageBreadcrumb"
       data-skip-target="breadcrumb"
       data-skip-label="breadcrumb navigation"
       data-skip-order="1">
    <!-- breadcrumb -->
  </nav>

  <!-- Main content -->
  <main id="spaContent"
        data-skip-target="main"
        data-skip-label="main content"
        data-skip-order="2">
    <%= content %>
  </main>
</body>
```

**Result:**
- Three skip links generated automatically
- Order: Navigation → Breadcrumb → Main Content
- Updates on SPA navigation

---

### Example 2: Long Page with Multiple Sections

**HTML:**
```html
<main id="spaContent" data-skip-target="main" data-skip-label="main content" data-skip-order="0">
  <article id="intro"
           data-skip-target="intro"
           data-skip-label="Introduction"
           data-skip-order="1">
    <h2>Introduction</h2>
    <!-- long content -->
  </article>

  <article id="features"
           data-skip-target="features"
           data-skip-label="Features"
           data-skip-order="2">
    <h2>Features</h2>
    <!-- long content -->
  </article>

  <article id="examples"
           data-skip-target="examples"
           data-skip-label="Examples"
           data-skip-order="3">
    <h2>Examples</h2>
    <!-- long content -->
  </article>
</main>
```

**Result:**
- Four skip links: Main → Intro → Features → Examples
- Useful for documentation or long-form content

---

### Example 3: Manual Registration

**JavaScript:**
```javascript
// On page init
Funky.Pages.register({
  id: 'search',

  init: function() {
    // Setup search functionality
    this.renderResults();

    // Register skip link for results
    if (Funky.SkipLink) {
      Funky.SkipLink.register({
        label: 'search results',
        target: '#searchResults',
        order: 10
      });
    }
  },

  renderResults: function() {
    // Render search results
    var container = document.querySelector('#searchResults');
    container.innerHTML = '<div>Results...</div>';
  }
});
```

**Result:**
- Skip link created dynamically when results render
- Allows users to skip directly to results

---

## Browser Support

- **Modern Browsers** - Full support (Chrome, Firefox, Safari, Edge)
- **IntersectionObserver** - Required (polyfill not needed for skip links)
- **CSS Focus-Visible** - Uses standard `:focus` as fallback

---

## Performance

### Optimization Strategies

1. **Auto-Discovery** - Only scans DOM on init and SPA navigation
2. **Event Delegation** - Uses `Funky.Events.on()` for efficient event handling
3. **Minimal DOM** - Skip links only rendered when targets exist
4. **Smooth Scroll** - Native `scrollIntoView()` API (hardware accelerated)

### Benchmarks

- **Scan Targets**: < 1ms for typical page
- **Generate Links**: < 1ms for 3-5 skip links
- **Focus + Scroll**: < 16ms (single animation frame)

---

## Troubleshooting

### Skip links not appearing

**Issue**: No skip links visible on Tab press

**Solutions**:
1. Check container exists: `document.querySelector('#skip-links')`
2. Verify targets have `data-skip-target` attribute
3. Check initialization: `Funky.SkipLink.initialized`
4. Inspect CSS: Ensure `.skip-link:focus` has `position: static`

---

### Skip link goes to wrong place

**Issue**: Clicking skip link doesn't scroll to correct location

**Solutions**:
1. Verify target has unique `id` attribute
2. Check target exists in DOM
3. Ensure target is visible (not `display: none`)
4. Test `skipTo()` manually: `Funky.SkipLink.skipTo('#target')`

---

### ARIA announcements not working

**Issue**: Screen reader doesn't announce skip action

**Solutions**:
1. Verify `#spa-announcer` exists in layout
2. Check announcer has `aria-live="polite"` attribute
3. Ensure announcer is not hidden with `display: none` (use `.visually-hidden` instead)
4. Test with screen reader in use (announcements are silent to visual users)

---

## Dependencies

- **Funky.Dom** - DOM manipulation utilities
- **Funky.Events** - Event handling utilities
- **Funky.Registry** - Component registration

---

## See Also

- [Funky.Pages](../core/pages.md) - Page lifecycle management
- [Funky.SPA](../core/spa.md) - Single Page Application
- [Funky.Keyboard](../core/keyboard.md) - Keyboard shortcuts
- [WCAG 2.1 - Skip Links](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html) - Accessibility guidelines

---

## Version History

### v1.0.0 (2025-01-24)
- Initial release
- Auto-discovery via `data-skip-target`
- SPA integration
- ARIA announcements
- Theme support
- Manual registration API
