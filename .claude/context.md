# Funky Framework Context

> Full documentation: [llm_context/README.md](../llm_context/README.md)

## Critical Guidelines

### Frontend
1. **ES5 Only** - No `const`, `let`, arrow functions, template literals
2. **Funky.Dom over jQuery** - Use `D.one()`, `D.create()` except for plugins
3. **Funky.Modal** - Never use Bootstrap Modal JS
4. **CSS Variables** - Use `--pro-*` variables, never hardcode colors

### Backend
1. **Mojolicious Conventions** - Follow controller/model separation
2. **DBIx::Class** - Use relationships, not raw SQL
3. **Audit Trail** - Set `$c->audit_context` before changes

---

## Frontend Documentation

| Document | Purpose |
|----------|---------|
| [Overview](../llm_context/frontend/README.md) | Funky.Dom/Events quick reference |
| [Core Modules](../llm_context/frontend/CORE.md) | Dom, Events, Modal, Animate, API |
| [Standards](../llm_context/frontend/STANDARDS.md) | ES5 requirements, module pattern |
| [Components](../llm_context/frontend/COMPONENTS.md) | All 49 UI components |
| [Theming](../llm_context/frontend/THEMING.md) | CSS variables, themes, density |
| [Checklist](../llm_context/frontend/CHECKLIST.md) | Workflow checklists |

---

## Backend Documentation

| Document | Purpose |
|----------|---------|
| [Overview](../llm_context/backend/README.md) | Mojolicious patterns |
| [Models](../llm_context/backend/MODELS.md) | DBIx::Class, relationships |
| [Controllers](../llm_context/backend/CONTROLLERS.md) | Route handlers, API patterns |
| [Helpers](../llm_context/backend/HELPERS.md) | Custom helpers |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Perl 5, Mojolicious |
| Database | PostgreSQL, DBIx::Class |
| Frontend | Vanilla JS (ES5), Bootstrap 5 |
| DOM | Funky.Dom (`D`) |
| Events | Funky.Events (`E`) |
| Templates | Mojolicious EP |
| Theming | CSS Custom Properties |

---

## Directory Structure

```
lib/Funky/
├── Controller/      # Route handlers (Web/, Api/)
├── Model/           # DBIx::Class result classes
├── Helper/          # Mojolicious helpers
├── Task/            # Minion background jobs
└── Util/            # Utility modules

public/assets/
├── js/
│   ├── core/        # Funky.Dom, Events, Modal, etc.
│   ├── components/  # UI components (49 files)
│   └── pages/       # Page modules
└── css/
    └── themes/      # Theme stylesheets

templates/           # Mojolicious .html.ep templates
```

---

## Common Pitfalls

### Frontend
| Mistake | Fix |
|---------|-----|
| Using `const`/`let` | Use `var` |
| Arrow functions | Use `function()` |
| Template literals | Use string concatenation |
| Bootstrap Modal | Use `Funky.Modal` |
| Hardcoded colors | Use `--pro-*` CSS variables |
| `D.one()` on missing element | Check element exists first |

