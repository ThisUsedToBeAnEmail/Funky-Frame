# Funky Frame - LLM Context Guide

> **Purpose**: Help LLMs quickly understand and work effectively with the Funky Frame frontend framework.
> **Server-agnostic**: Works with any backend or as a standalone frontend.

## Quick Navigation

| Document | Purpose |
|----------|---------|
| [STANDARDS.md](STANDARDS.md) | ES5 requirements, module patterns, DOM patterns |
| [CORE.md](CORE.md) | 49 core modules reference with docs links |
| [COMPONENTS.md](COMPONENTS.md) | 86+ UI components reference with docs links |
| [THEMING.md](THEMING.md) | CSS variables, themes, density modes |
| [TESTING.md](TESTING.md) | FunkyTests framework, running tests |
| [ARCHITECTURE.md](ARCHITECTURE.md) | SPA, PWA, service workers |

---

## 🚨 Critical Rules

### JavaScript (ES5 Only)
```javascript
// ❌ NEVER
const x = 1; let y = 2; () => {}; `template ${lit}`;

// ✅ ALWAYS
var x = 1; var y = 2; function() {}; 'string ' + var;
```

### DOM Manipulation
```javascript
// ❌ jQuery (avoid)
$('#el').addClass('active');

// ✅ Funky.Dom
D.one('#el').classAdd('active');
D.create('div').classAdd('item').appendTo(container);
```

### Funky.Dom Styling - IMPORTANT!
```javascript
// ❌ WRONG - .css() is GETTER only, breaks chaining!
D.create('div').css({ color: 'red' });  // Returns string, NOT element!

// ✅ CORRECT - .style() for setting styles
D.create('div').style({ color: 'red' }).text('Hi');
```

### CSS Theming
```css
/* ❌ Never hardcode */
color: #007bff;

/* ✅ Use variables */
color: var(--pro-primary);
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Core** | Vanilla JavaScript (ES5 strict) |
| **DOM** | Funky.Dom (`D`) - jQuery-like chainable API |
| **Events** | Funky.Events (`E`) - pub/sub event bus |
| **Styling** | Bootstrap 5 + CSS Custom Properties |
| **Theming** | `--pro-*` CSS variables |

---

## Directory Structure

```
funky-frame/
├── core/          → ../public/assets/js/core (49 modules)
├── components/    → ../public/assets/js/components (86+ components)
├── css/           → ../public/assets/css (themes, layout)
├── md/            → ../docs (markdown documentation)
├── playground/    → Interactive component demos
├── test-runner/   → FunkyTests browser-based test runner
└── llm_context/   → This directory
```

---

## Common Pitfalls

| Mistake | Fix |
|---------|-----|
| Using `const`/`let` | Use `var` |
| Arrow functions `() => {}` | Use `function() {}` |
| Template literals | Use string concatenation |
| `.css({ prop: val })` for setting | Use `.style({ prop: val })` |
| Hardcoded colors | Use `--pro-*` CSS variables |
| Missing `destroy()` call | Always cleanup components |

---

## Before Making Changes

1. **Check existing patterns** - Look at similar code in the codebase
2. **Use ES5 only** - No modern JS features
3. **Use Funky.Dom** - Not jQuery or vanilla querySelector
4. **Use CSS variables** - Never hardcode colors
5. **Run tests** - Open `/test-runner/` in browser

---

## Key Documentation Links

| Topic | Docs Path |
|-------|-----------|
| DOM manipulation | [/md/js/core/dom.md](/md/js/core/dom.md) |
| Event handling | [/md/js/core/events.md](/md/js/core/events.md) |
| Component interface | [/md/js/core/component-interface.md](/md/js/core/component-interface.md) |
| SPA architecture | [/md/SPA_ARCHITECTURE.md](/md/SPA_ARCHITECTURE.md) |
| Theming guide | [/md/THEMING.md](/md/THEMING.md) |
| Accessibility | [/md/accessibility-standards.md](/md/accessibility-standards.md) |
