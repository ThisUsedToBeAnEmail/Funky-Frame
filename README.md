# Funky Frame

[![npm version](https://img.shields.io/npm/v/funky-frame.svg)](https://www.npmjs.com/package/funky-frame)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, no-build JavaScript UI framework with 86+ components, PWA support, and zero dependencies.

## ✨ Features

- **No Build Step** - Pure ES5 JavaScript, works directly in the browser
- **86+ UI Components** - Tables, modals, forms, charts, and more
- **45+ Core Modules** - DOM manipulation, routing, state management, API handling
- **PWA Ready** - Service workers, offline support, push notifications
- **SPA Routing** - Client-side navigation with history API
- **Theming** - Bootstrap 5 compatible with CSS custom properties (`--pro-*`)
- **Accessibility** - WCAG compliant components with focus management
- **jQuery-like API** - Chainable DOM manipulation via `Funky.Dom`
- **Interactive Playground** - Try components live in the browser

## 📦 Installation

```bash
npm install funky-frame
```

Or clone from GitHub:

```bash
git clone https://github.com/ThisUsedToBeAnEmail/Funky-Frame.git
```

**Live Demo & Documentation:** [https://funkyfra.me](https://funkyfra.me)

## 🚀 Quick Start

Include the core library and any components you need:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Bootstrap 5 (required) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  
  <!-- Funky Frame Styles -->
  <link rel="stylesheet" href="node_modules/funky-frame/css/themes.css">
  <link rel="stylesheet" href="node_modules/funky-frame/css/custom.css">
  <link rel="stylesheet" href="node_modules/funky-frame/css/toasts.css">
</head>
<body>
  <button id="notify" class="btn btn-primary">Show Toast</button>

  <!-- Core (namespace must be loaded first) -->
  <script src="node_modules/funky-frame/js/core/namespace.js"></script>
  <script src="node_modules/funky-frame/js/core/dom.js"></script>
  
  <!-- Components -->
  <script src="node_modules/funky-frame/js/components/toast.js"></script>
  
  <script>
    Funky.Dom('#notify').on('click', function() {
      Funky.Toast.show({
        title: 'Hello!',
        message: 'Welcome to Funky Frame',
        type: 'success'
      });
    });
  </script>
</body>
</html>
```

## 🎮 Interactive Playground

Try components in the browser without any setup:

```bash
npm start
# Opens playground at http://localhost:3000/playground/
```

Or open `playground/index.html` directly in your browser.

## 📚 Documentation

Full API documentation is available in the `docs/` directory:

- **[Architecture](md/ARCHITECTURE.md)** - System design and patterns
- **[Components](md/COMPONENTS.md)** - UI component reference
- **[SPA Routing](md/SPA_ARCHITECTURE.md)** - Client-side navigation
- **[PWA Guide](md/PWA.md)** - Service workers and offline support
- **[Theming](md/THEMING.md)** - CSS custom properties and themes
- **[Accessibility](md/accessibility-standards.md)** - WCAG compliance

## 🧩 Core Modules

| Module | Description |
|--------|-------------|
| `Funky.Dom` | jQuery-like chainable DOM manipulation |
| `Funky.Api` | HTTP requests with CSRF, retry, caching |
| `Funky.SPA` | Single-page app routing |
| `Funky.Pages` | Page lifecycle management |
| `Funky.Navigation` | History API navigation |
| `Funky.LiveBinding` | Reactive data binding |
| `Funky.Events` | Event bus / pub-sub |
| `Funky.Channel` | Cross-tab communication |
| `Funky.Storage` | localStorage/sessionStorage wrapper |
| `Funky.Keyboard` | Keyboard shortcuts |
| `Funky.FocusManager` | Accessibility focus trapping |
| `Funky.ServiceWorker` | PWA service worker registration |

## 🎨 UI Components

### Data Display
- `Funky.Table` - Data tables with sorting, filtering, pagination
- `Funky.TreeView` - Hierarchical tree navigation
- `Funky.Kanban` - Drag-and-drop kanban boards
- `Funky.Calendar` - Event calendars
- `Funky.Timeline` - Vertical/horizontal timelines
- `Funky.VirtualisedList` - Efficiently render large lists

### Forms & Input
- `Funky.Combobox` - Searchable dropdowns with autocomplete
- `Funky.DatePicker` - Date/time picker
- `Funky.Mask` - Input masking
- `Funky.Signature` - Signature capture pad
- `Funky.InlineEdit` - Click-to-edit fields
- `Funky.FormSchema` - Schema-driven form generation

### Dialogs & Overlays
- `Funky.Modal` - Modal dialogs
- `Funky.Popover` - Popovers and tooltips
- `Funky.ContextMenu` - Right-click context menus
- `Funky.CommandPalette` - Cmd+K spotlight search
- `Funky.SlidePanel` - Slide-out panels
- `Funky.Tour` - Guided tours

### Notifications
- `Funky.Toast` - Toast notifications
- `Funky.NotificationCenter` - Notification inbox
- `Funky.PushNotification` - Browser push notifications

### Media
- `Funky.Audio` - Audio player controls
- `Funky.Video` - Video player with custom controls
- `Funky.Carousel` - Image/content carousels
- `Funky.CodePreview` - Syntax-highlighted code blocks

### Visualization
- `Funky.Charts` - Chart.js wrapper
- `Funky.Plotly` - Plotly.js integration
- `Funky.DashboardGrid` - Draggable dashboard widgets

### Animation
- `Funky.Morph` - DOM morphing transitions
- `Funky.PageAnimate` - Page transition effects
- `Funky.GestureTracker` - Touch gesture recognition
- `Funky.Typewriter` - Typewriter text effect

## 🖥️ Development Server

Start the framework using your favorite language! We support **27 languages** via Make:

```bash
make help                # Show all available commands
```

### Popular Options

| Command | Language | Port |
|---------|----------|------|
| `make start-js` | Node.js/serve | 3000 |
| `make start-python` | Python 3 | 8000 |
| `make start-perl` | Perl/Mojolicious | 8000 |
| `make start-ruby` | Ruby/WEBrick | 8000 |
| `make start-php` | PHP built-in | 8000 |
| `make start-go` | Go | 8000 |
| `make start-deno` | Deno | 8000 |
| `make start-bun` | Bun | 8000 |

### The Fun Ones 🎉

| Command | Language | Notes |
|---------|----------|-------|
| `make start-scala` | Scala | Requires scala-cli |
| `make start-raku` | Raku | Perl's fancy sibling |
| `make start-elixir` | Elixir | Erlang VM |
| `make start-rust` | Rust | Via miniserve |
| `make start-swift` | Swift | macOS native |
| `make start-crystal` | Crystal | Ruby-like compiled |
| `make start-nim` | Nim | Python-like compiled |
| `make start-haskell` | Haskell | Functional purity |

### The Boring Enterprise Ones 🏢

| Command | Language |
|---------|----------|
| `make start-java` | Java |
| `make start-kotlin` | Kotlin |
| `make start-groovy` | Groovy |
| `make start-csharp` | C# / .NET |
| `make start-fsharp` | F# / .NET |
| `make start-powershell` | PowerShell |

### The Absurd Ones 🤪

| Command | Language | Warning |
|---------|----------|---------|
| `make start-bash` | Bash + netcat | Very basic |
| `make start-awk` | AWK | Single request only |
| `make start-tcl` | Tcl | For nostalgia |
| `make start-lua` | Lua | Gaming heritage |

Override the default port:
```bash
make start-python PORT=9000
```

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT © Funky Frame Contributors
