# Funky Frame - Theming

> CSS variables, themes, and density modes.

Full docs: [/md/THEMING.md](/md/THEMING.md)

## 🚨 Critical Rule

```css
/* ❌ NEVER hardcode colors */
color: #007bff;
background: #1a1a1a;

/* ✅ ALWAYS use CSS variables */
color: var(--pro-primary);
background: var(--pro-bg-primary);
```

---

## Theme Switching

```javascript
// Set theme
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.setAttribute('data-theme', 'light');

// Set density
document.documentElement.setAttribute('data-density', 'comfortable');
document.documentElement.setAttribute('data-density', 'compact');
document.documentElement.setAttribute('data-density', 'spacious');
```

---

## Core Color Variables

### Brand Colors
| Variable | Purpose |
|----------|---------|
| `--pro-primary` | Primary brand color |
| `--pro-primary-hover` | Primary hover state |
| `--pro-secondary` | Secondary color |
| `--pro-accent` | Accent color |

### Background Colors
| Variable | Purpose |
|----------|---------|
| `--pro-bg-primary` | Main background |
| `--pro-bg-secondary` | Card/section background |
| `--pro-bg-tertiary` | Nested/hover background |
| `--pro-bg-elevated` | Modal/popup background |

### Text Colors
| Variable | Purpose |
|----------|---------|
| `--pro-text-primary` | Main text |
| `--pro-text-secondary` | Muted text |
| `--pro-text-tertiary` | Disabled/hint text |
| `--pro-text-inverse` | Text on dark backgrounds |

### Border Colors
| Variable | Purpose |
|----------|---------|
| `--pro-border-color` | Default border |
| `--pro-border-light` | Subtle border |
| `--pro-border-focus` | Focus ring |

### Status Colors
| Variable | Purpose |
|----------|---------|
| `--pro-accent-success` | Success/green |
| `--pro-accent-warning` | Warning/yellow |
| `--pro-accent-danger` | Error/red |
| `--pro-accent-info` | Info/blue |

---

## Spacing Variables

| Variable | Default (Comfortable) |
|----------|----------------------|
| `--pro-spacing-xs` | 4px |
| `--pro-spacing-sm` | 8px |
| `--pro-spacing-md` | 16px |
| `--pro-spacing-lg` | 24px |
| `--pro-spacing-xl` | 32px |

---

## Typography Variables

| Variable | Purpose |
|----------|---------|
| `--pro-font-family` | Font stack |
| `--pro-font-size-xs` | Extra small text |
| `--pro-font-size-sm` | Small text |
| `--pro-font-size-md` | Base text |
| `--pro-font-size-lg` | Large text |
| `--pro-font-size-xl` | Heading text |
| `--pro-line-height` | Base line height |
| `--pro-font-weight-normal` | Normal weight |
| `--pro-font-weight-medium` | Medium weight |
| `--pro-font-weight-bold` | Bold weight |

---

## Shadow Variables

| Variable | Purpose |
|----------|---------|
| `--pro-shadow-sm` | Subtle shadow |
| `--pro-shadow-md` | Card shadow |
| `--pro-shadow-lg` | Modal/dropdown shadow |
| `--pro-shadow-focus` | Focus ring shadow |

---

## Radius Variables

| Variable | Purpose |
|----------|---------|
| `--pro-radius-sm` | Small radius (4px) |
| `--pro-radius-md` | Default radius (8px) |
| `--pro-radius-lg` | Large radius (12px) |
| `--pro-radius-full` | Pill shape (9999px) |

---

## Transition Variables

| Variable | Purpose |
|----------|---------|
| `--pro-transition-fast` | Quick transitions (150ms) |
| `--pro-transition-normal` | Default transitions (250ms) |
| `--pro-transition-slow` | Slow transitions (400ms) |

---

## Available Themes

| Theme | Attribute |
|-------|-----------|
| Dark | `data-theme="dark"` |
| Light | `data-theme="light"` |
| System | `data-theme="system"` |

---

## Density Modes

| Density | Attribute | Use Case |
|---------|-----------|----------|
| Compact | `data-density="compact"` | Dense data tables |
| Comfortable | `data-density="comfortable"` | Default |
| Spacious | `data-density="spacious"` | Touch/mobile |

---

## Example: Using Variables in CSS

```css
.my-component {
    background: var(--pro-bg-secondary);
    color: var(--pro-text-primary);
    border: 1px solid var(--pro-border-color);
    border-radius: var(--pro-radius-md);
    padding: var(--pro-spacing-md);
    box-shadow: var(--pro-shadow-sm);
    transition: background var(--pro-transition-fast);
}

.my-component:hover {
    background: var(--pro-bg-tertiary);
}

.my-component.success {
    border-color: var(--pro-accent-success);
}
```

---

## Example: Using Variables in JavaScript

```javascript
// Set inline style with variable
D.create('div').style({
    background: 'var(--pro-bg-secondary)',
    padding: 'var(--pro-spacing-md)',
    borderRadius: 'var(--pro-radius-md)'
});

// Get computed variable value
var primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--pro-primary');
```
