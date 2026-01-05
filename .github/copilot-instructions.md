# Funky Framework - Copilot Instructions

> For detailed documentation, read `llm_context/README.md`

## 🚨 Critical Rules

### for any multi phase change use the manage_todo_list tool.

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

## Tech Stack
- **Frontend**: Vanilla JS (ES5), Bootstrap 5 CSS, Funky.Dom (`D`), Funky.Events (`E`)
- **Templates**: .html

## Key Patterns
- IIFE modules: `(function(global) { ... })(window);`
- Funky.Dom for DOM: `D.one()`, `D.all()`, `D.create()`
- Funky.Events for pub/sub: `E.on()`, `E.emit()`
- CSS variables: `--pro-*` prefix

## Before Editing
1. Check existing patterns in similar files
2. Run `get_errors` after edits
3. Use `--pro-*` CSS variables for colors/spacing

## NO jQuery 
