# Theming System

Funky uses a comprehensive CSS custom properties (variables) based theming system that supports multiple color themes, density modes, and user customizations.

## Overview

The theming system consists of:

- **Color Themes** - Dark (default), Light, Even Funkier
- **Density Modes** - Compact, Comfortable (default), Spacious
- **User Customizations** - Accent colors, font scale, custom colors
- **CSS Variables** - `--pro-*` prefixed design tokens

## Quick Start

### Setting Theme

```html
<body data-theme="dark" data-density="comfortable">
```

Or via JavaScript:
```javascript
document.body.setAttribute('data-theme', 'light');
document.body.setAttribute('data-density', 'compact');
```

### Using Theme Variables

```css
.my-component {
  background: var(--pro-bg-secondary);
  color: var(--pro-text-primary);
  border: 1px solid var(--pro-border-color);
  border-radius: var(--pro-border-radius);
}
```

## Color Themes

### Dark Theme (Default)

Bloomberg/GitHub Dark inspired professional theme.

```css
[data-theme="dark"] {
  --pro-bg-primary: #0d1117;
  --pro-bg-secondary: #161b22;
  --pro-bg-tertiary: #21262d;
  --pro-text-primary: #e6edf3;
  --pro-accent-primary: #2f81f7;
}
```

**When to use:** Default for all users, reduces eye strain, modern professional look.

### Light Theme

Clean, accessible light theme for bright environments.

```css
[data-theme="light"] {
  --pro-bg-primary: #ffffff;
  --pro-bg-secondary: #f6f8fa;
  --pro-bg-tertiary: #eaeef2;
  --pro-text-primary: #1f2328;
  --pro-accent-primary: #0969da;
}
```

**When to use:** Bright environments, user preference, print-friendly.

### Even Funkier Theme

Cyberpunk-inspired neon theme with pink/cyan accents and glow effects.

```css
[data-theme="even-funkyer"] {
  --pro-bg-primary: #0a0015;
  --pro-accent-primary: #ff00ff;
  --pro-accent-secondary: #00ffff;
}
```

**When to use:** Fun mode, special occasions, users who want maximum visual impact.

## CSS Variables Reference

### Background Colors

| Variable | Dark | Light | Purpose |
|----------|------|-------|---------|
| `--pro-bg-primary` | `#0d1117` | `#ffffff` | Main page background |
| `--pro-bg-secondary` | `#161b22` | `#f6f8fa` | Cards, sidebar |
| `--pro-bg-tertiary` | `#21262d` | `#eaeef2` | Headers, elevated elements |
| `--pro-bg-elevated` | `#2d333b` | `#ffffff` | Dropdowns, popovers |
| `--pro-bg-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.3)` | Modal overlays |

### Text Colors

| Variable | Dark | Light | Purpose |
|----------|------|-------|---------|
| `--pro-text-primary` | `#e6edf3` | `#1f2328` | Main text |
| `--pro-text-secondary` | `#8b949e` | `#656d76` | Labels, hints |
| `--pro-text-muted` | `#6e7681` | `#8c959f` | Disabled, placeholders |
| `--pro-text-link` | `#58a6ff` | `#0969da` | Links |
| `--pro-text-link-hover` | `#79b8ff` | `#0550ae` | Link hover state |
| `--pro-text-inverse` | `#0d1117` | `#ffffff` | Text on accent backgrounds |

### Border Colors

| Variable | Dark | Light | Purpose |
|----------|------|-------|---------|
| `--pro-border-color` | `#30363d` | `#d0d7de` | Default borders |
| `--pro-border-muted` | `#21262d` | `#e6e8eb` | Subtle borders |
| `--pro-border-emphasis` | `#484f58` | `#8c959f` | Strong borders |

### Accent Colors

| Variable | Dark | Light | Purpose |
|----------|------|-------|---------|
| `--pro-accent-primary` | `#2f81f7` | `#0969da` | Primary actions, links |
| `--pro-accent-primary-hover` | `#388bfd` | `#0550ae` | Hover state |
| `--pro-accent-primary-muted` | `rgba(47,129,247,0.15)` | `rgba(9,105,218,0.1)` | Backgrounds |

### Semantic Colors

| Variable | Purpose | Dark Value |
|----------|---------|------------|
| `--pro-accent-success` | Positive actions | `#3fb950` |
| `--pro-accent-warning` | Caution, attention | `#d29922` |
| `--pro-accent-danger` | Errors, destructive | `#f85149` |
| `--pro-accent-info` | Informational | `#58a6ff` |
| `--pro-accent-purple` | Special accent | `#a78bfa` |

Each semantic color has `-muted`, `-bg`, and `-text` variants:
```css
--pro-accent-success-muted: rgba(63, 185, 80, 0.15);
--pro-accent-success-bg: #1e4d2b;
--pro-accent-success-text: #d4edda;
```

### Shadows

| Variable | Purpose |
|----------|---------|
| `--pro-shadow-sm` | Subtle elevation |
| `--pro-shadow-md` | Cards, dropdowns |
| `--pro-shadow-lg` | Modals, popovers |
| `--pro-shadow-xl` | Maximum elevation |

### Typography

```css
/* Font Families */
--pro-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--pro-font-mono: 'JetBrains Mono', 'SF Mono', monospace;

/* Font Sizes */
--pro-font-size-xs: 0.75rem;   /* 12px */
--pro-font-size-sm: 0.875rem;  /* 14px */
--pro-font-size-base: 1rem;    /* 16px */
--pro-font-size-lg: 1.125rem;  /* 18px */
--pro-font-size-xl: 1.25rem;   /* 20px */
--pro-font-size-2xl: 1.5rem;   /* 24px */
--pro-font-size-3xl: 1.875rem; /* 30px */
--pro-font-size-4xl: 2.25rem;  /* 36px */

/* Font Weights */
--pro-font-weight-light: 300;
--pro-font-weight-normal: 400;
--pro-font-weight-medium: 500;
--pro-font-weight-semibold: 600;
--pro-font-weight-bold: 700;
```

## Density Modes

Density controls spacing throughout the UI.

### Compact

Tighter spacing for data-heavy views and power users.

```css
[data-density="compact"] {
  --pro-spacing-xs: 4px;
  --pro-spacing-sm: 8px;
  --form-control-height: 30px;
  --table-cell-padding: 6px 8px;
}
```

### Comfortable (Default)

Balanced spacing for general use.

```css
[data-density="comfortable"] {
  --pro-spacing-xs: 6px;
  --pro-spacing-sm: 12px;
  --form-control-height: 38px;
  --table-cell-padding: 10px 12px;
}
```

### Spacious

More room for accessibility and touch interfaces.

```css
[data-density="spacious"] {
  --pro-spacing-xs: 8px;
  --pro-spacing-sm: 16px;
  --form-control-height: 46px;
  --table-cell-padding: 14px 16px;
}
```

### Density Variables

| Variable | Compact | Comfortable | Spacious |
|----------|---------|-------------|----------|
| `--pro-spacing-xs` | 4px | 6px | 8px |
| `--pro-spacing-sm` | 8px | 12px | 16px |
| `--pro-spacing-md` | 12px | 16px | 24px |
| `--pro-spacing-lg` | 16px | 24px | 32px |
| `--form-control-height` | 30px | 38px | 46px |
| `--table-cell-padding` | 6px 8px | 10px 12px | 14px 16px |
| `--card-padding` | 12px | 16px | 24px |

## User Customizations

Users can override theme colors via `--user-*` variables:

```css
:root {
  /* User accent color */
  --user-accent: #ff6600;
  --user-accent-hover: #ff8533;
  
  /* User background overrides */
  --user-bg-primary: #1a1a2e;
  --user-bg-secondary: #16213e;
  
  /* Font scale (1 = 100%) */
  --user-font-scale: 1.1;
}
```

These are set via the Preferences system and stored per-user.

## Using Themes in Components

### Basic Component

```css
.my-card {
  background: var(--pro-bg-secondary);
  border: 1px solid var(--pro-border-color);
  border-radius: 8px;
  padding: var(--card-padding, 16px);
}

.my-card-title {
  color: var(--pro-text-primary);
  font-weight: var(--pro-font-weight-semibold);
}

.my-card-description {
  color: var(--pro-text-secondary);
}
```

### Interactive States

```css
.my-button {
  background: var(--pro-accent-primary);
  color: var(--pro-text-inverse);
}

.my-button:hover {
  background: var(--pro-accent-primary-hover);
}

.my-button:focus {
  box-shadow: var(--pro-focus-ring);
}
```

### Semantic States

```css
.alert-success {
  background: var(--pro-accent-success-bg);
  color: var(--pro-accent-success-text);
  border-color: var(--pro-accent-success);
}

.alert-danger {
  background: var(--pro-accent-danger-bg);
  color: var(--pro-accent-danger-text);
  border-color: var(--pro-accent-danger);
}
```

## Theme-Specific Overrides

When you need different styles per theme:

```css
/* Dark theme specific */
[data-theme="dark"] .my-component {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Light theme specific */
[data-theme="light"] .my-component {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Even Funkier specific */
[data-theme="even-funkyer"] .my-component {
  box-shadow: 0 0 20px var(--pro-accent-primary);
}
```

## JavaScript API

### Getting Current Theme

```javascript
const theme = document.body.getAttribute('data-theme');
const density = document.body.getAttribute('data-density');
```

### Setting Theme

```javascript
Funky.Preferences.save({
  theme: {
    theme: 'light',
    density: 'compact',
    accent_color: '#ff6600'
  }
});
```

### Listening for Changes

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-theme') {
      console.log('Theme changed to:', document.body.dataset.theme);
    }
  });
});

observer.observe(document.body, { attributes: true });
```

## Files

| File | Purpose |
|------|---------|
| `public/assets/css/themes.css` | Main theme definitions |
| `public/assets/css/even-funkyer.css` | Even Funkier theme extras |
| `public/assets/js/components/preferences.js` | Theme preference management |
| `public/assets/js/components/even-funkyer.js` | Even Funkier effects (disco mode, etc.) |

## Best Practices

1. **Always use variables** - Never hardcode colors
2. **Use semantic colors** - `--pro-accent-success` not `#3fb950`
3. **Test all themes** - Check dark, light, and even-funkier
4. **Test all densities** - Compact, comfortable, spacious
5. **Use density variables for spacing** - Components scale automatically
6. **Provide fallbacks** - `var(--card-padding, 16px)` for older browsers
