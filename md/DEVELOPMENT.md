# Funky Development Guide

This guide covers setting up and developing with the Funky JavaScript framework.

## Quick Start

### Include Core Files

```html
<!-- Core Funky modules -->
<script src="/assets/js/core/dom.js"></script>
<script src="/assets/js/core/events.js"></script>
<script src="/assets/js/core/pubsub.js"></script>
<script src="/assets/js/core/api.js"></script>
<script src="/assets/js/core/csrf.js"></script>

<!-- Components as needed -->
<script src="/assets/js/components/table.js"></script>
<script src="/assets/js/components/modal.js"></script>
```

### Basic Usage

```javascript
// DOM manipulation
var D = Funky.Dom;
var container = D.one('#app');

D.create('div')
  .classAdd('card')
  .text('Hello Funky!')
  .appendTo(container);

// Event handling
var E = Funky.Events;
E.on(document, 'click', '.btn', function(e) {
  Funky.Toast.success('Button clicked!');
});

// API calls
Funky.Api.get('/api/data').then(function(response) {
  console.log('Data:', response.data);
});
```

## Code Standards

### ES5 Only

Funky follows ES5 standards for browser compatibility:

```javascript
// ❌ DON'T use ES6+
const x = 1;
let y = 2;
const fn = () => {};
const str = `template ${literal}`;
async function load() { await fetch(); }

// ✅ DO use ES5
var x = 1;
var y = 2;
var fn = function() {};
var str = 'template ' + literal;
function load() { return fetch().then(function() {}); }
```

### IIFE Module Pattern

All components use Immediately Invoked Function Expressions:

```javascript
(function(global) {
  'use strict';

  // Private variables
  var _instances = {};

  // Constructor
  function MyComponent(element, options) {
    this.element = element;
    this.options = options;
  }

  // Prototype methods
  MyComponent.prototype.doSomething = function() {
    // ...
  };

  // Factory
  var Factory = {
    init: function(selector, options) {
      return new MyComponent(selector, options);
    }
  };

  // Register
  if (typeof Funky !== 'undefined' && Funky.register) {
    Funky.register('MyComponent', Factory);
  }

})(window);
```

### DOM Manipulation

Use `Funky.Dom` instead of jQuery:

```javascript
var D = Funky.Dom;

// ❌ jQuery
$('#el').addClass('active').text('Hi');

// ✅ Funky.Dom
D.one('#el').classAdd('active').text('Hi');

// Creating elements
D.create('div')
  .classAdd('card', 'shadow')
  .attr('id', 'myCard')
  .style({ color: 'red', padding: '10px' })
  .appendTo(container);
```

### CSS Theming

Use CSS variables with `--pro-` prefix:

```css
/* ❌ Don't hardcode colors */
.button { background: #007bff; }

/* ✅ Use CSS variables */
.button { background: var(--pro-primary); }
```

## Testing

### Running Tests

```bash
# Open test runner in browser
open public/assets/js/dev/tests/test-runner.html
```

### Writing Tests

```javascript
FunkyTests.describe('MyComponent', function() {
  FunkyTests.it('should initialize correctly', function() {
    var component = Funky.MyComponent.init('#test');
    FunkyTests.assert(component !== null, 'Component should exist');
  });

  FunkyTests.it('should handle data', function() {
    var component = Funky.MyComponent.init('#test');
    component.setData({ items: [1, 2, 3] });
    var data = component.getData();
    FunkyTests.assertEqual(data.items.length, 3);
  });
});
```

## Debugging

### Debug Mode

Enable verbose logging:

```javascript
Funky.debug = true;
```

### Browser DevTools

Components expose instances for inspection:

```javascript
// In console
Funky.Table._instances     // All table instances
Funky.Modal._instances     // All modal instances
Funky.Kanban._instances    // All kanban instances
```

## File Structure

```
public/assets/
├── js/
│   ├── core/           # Core modules
│   ├── components/     # UI components
│   ├── pages/          # Page modules
│   └── dev/            # Development tools
│       └── tests/      # Test files
└── css/
    └── themes/         # Theme stylesheets
```

## Creating New Components

1. **Create the file**: `public/assets/js/components/my-component.js`

2. **Use the template**:
```javascript
(function(global) {
  'use strict';

  if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('MyComponent')) {
    return;
  }

  var _instances = Funky.Registry.createInstanceRegistry('MyComponent');
  var D = Funky.Dom;

  var DEFAULTS = {
    option1: true,
    option2: 'default'
  };

  function MyComponent(element, options) {
    this.element = typeof element === 'string' ? D.one(element).el : element;
    this.options = Object.assign({}, DEFAULTS, options);
    this.id = this.element.id || 'mycomponent-' + Date.now();
    _instances.register(this.id, this);
    this._init();
  }

  MyComponent.prototype._init = function() {
    // Initialize component
  };

  MyComponent.prototype.destroy = function() {
    _instances.unregister(this.id);
  };

  // Bindable interface
  MyComponent.prototype.setData = function(data) {};
  MyComponent.prototype.getData = function() { return {}; };

  var Factory = {
    init: function(element, options) {
      return new MyComponent(element, options);
    },
    getInstance: function(id) {
      return _instances.get(id);
    },
    destroyAll: function() {
      _instances.destroyAll();
    },
    _instances: _instances,
    DEFAULTS: DEFAULTS
  };

  if (typeof Funky !== 'undefined' && Funky.register) {
    Funky.register('MyComponent', Factory);
  }

})(window);
```

3. **Create documentation**: `docs/js/components/my-component.md`

4. **Add tests**: `public/assets/js/dev/tests/components/my-component.test.js`

## Related Documentation

- [Architecture](ARCHITECTURE.md)
- [Components](COMPONENTS.md)
- [Theming](THEMING.md)
- [Accessibility](accessibility-standards.md)
