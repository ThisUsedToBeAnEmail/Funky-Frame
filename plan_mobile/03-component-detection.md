# Phase 3: Component Detection and PubSub Integration

Enable any component to register mobile actions via PubSub or static property.
**Viewport-reactive:** Actions automatically show/hide based on component visibility.

## Checklist

- [x] Implement `detectComponents()` to scan for existing components
- [x] Register default actions only if their conditions are met
- [x] Listen for `funky:mobile:action:register` PubSub event
- [x] Listen for `funky:mobile:action:unregister` PubSub event
- [x] Listen for `funky:mobile:action:update` PubSub event
- [x] Scan registered Funky components for `mobileActions` static property
- [x] Listen for late component initialization events
- [x] Emit `funky:mobile-core:initialized` on init
- [x] Emit `funky:mobile-core:shown` / `funky:mobile-core:hidden`
- [x] **Implement IntersectionObserver for viewport-aware actions**
- [x] **Track observed elements and their associated actions**
- [x] **Show/hide actions based on element visibility**

## Component Detection

```javascript
function detectComponents() {
  if (!config.autoRegister) return;

  DEFAULT_ACTIONS.forEach(function(action) {
    var shouldRegister = config.defaultActions[action.id.replace('-', '')] !== false;
    if (shouldRegister && (!action.condition || action.condition())) {
      ActionRegistry.add(action);
    }
  });
}

function scanForMobileActions() {
  // Scan all registered Funky components for mobileActions property
  var components = Funky.list ? Funky.list() : [];
  components.forEach(function(name) {
    var component = Funky[name];
    if (component && component.mobileActions) {
      component.mobileActions.forEach(function(action) {
        ActionRegistry.add(action);
      });
    }
  });
}
```

## PubSub Listeners

```javascript
function setupPubSubListeners() {
  // External action registration
  PubSub.on('funky:mobile:action:register', function(actionConfig) {
    ActionRegistry.add(actionConfig);
  });

  PubSub.on('funky:mobile:action:unregister', function(data) {
    ActionRegistry.remove(data.id);
  });

  PubSub.on('funky:mobile:action:update', function(data) {
    ActionRegistry.update(data.id, data.updates);
  });

  // Listen for late component registration
  PubSub.on('funky:sidenav:initialized', function() {
    if (config.defaultActions.sidenavToggle && !ActionRegistry.has('sidenav-toggle')) {
      var action = DEFAULT_ACTIONS.find(function(a) { return a.id === 'sidenav-toggle'; });
      if (action && action.condition()) {
        ActionRegistry.add(action);
      }
    }
  });
}
```

## Component Author Pattern

Any component can register actions by adding a static property:

```javascript
// Example in another component file:
Funky.MyComponent.mobileActions = [{
  id: 'my-component-toggle',
  icon: 'fas fa-bolt',
  label: 'Toggle',
  order: 60,
  onClick: function() {
    Funky.MyComponent.toggle();
  }
}];
```

Or via PubSub at runtime:

```javascript
// In component init:
Funky.PubSub.emit('funky:mobile:action:register', {
  id: 'my-action',
  icon: 'fas fa-star',
  label: 'Action',
  order: 50,
  onClick: function() { /* ... */ }
});

// On component destroy:
Funky.PubSub.emit('funky:mobile:action:unregister', { id: 'my-action' });
```

---

## Viewport-Reactive Actions (IntersectionObserver)

Actions can be tied to specific DOM elements. When the element enters/exits the viewport, the action automatically shows/hides.

### Extended Action Schema

```javascript
{
  id: 'datatable-filter',
  icon: 'fas fa-filter',
  label: 'Filter',
  order: 25,
  onClick: function() { /* open filter panel */ },

  // NEW: Viewport binding
  element: '#my-datatable',      // Selector or element ref
  visibleInViewport: true,       // Show when element is visible (default)
  // OR
  visibleInViewport: false       // Show when element is NOT visible
}
```

### Implementation (using Funky.VisibilityObserver)

```javascript
// State additions
var state = {
  // ... existing state
  visibilityObserver: null,      // Funky.VisibilityObserver instance
  elementActions: new Map()       // element -> [actionIds]
};

// Config additions
var config = {
  // ... existing config
  viewportThreshold: 0.1         // 10% visible = "in viewport"
};

function setupViewportObserver() {
  if (!Funky.VisibilityObserver) return;

  state.visibilityObserver = Funky.VisibilityObserver.create({
    threshold: config.viewportThreshold,
    onVisible: function(element) {
      updateActionsForElement(element, true);
    },
    onHidden: function(element) {
      updateActionsForElement(element, false);
    }
  });
}

function updateActionsForElement(element, isVisible) {
  var actionIds = state.elementActions.get(element);
  if (!actionIds) return;

  actionIds.forEach(function(actionId) {
    var action = ActionRegistry.get(actionId);
    if (!action) return;

    // visibleInViewport: true (default) = show when visible
    // visibleInViewport: false = show when NOT visible
    var shouldShow = action.visibleInViewport !== false
      ? isVisible
      : !isVisible;

    ActionRegistry.update(actionId, { hidden: !shouldShow });
  });
}

function observeActionElement(action) {
  if (!action.element || !state.visibilityObserver) return;

  var el = typeof action.element === 'string'
    ? document.querySelector(action.element)
    : action.element;

  if (!el) return;

  // Track which actions are tied to this element
  var existing = state.elementActions.get(el) || [];
  existing.push(action.id);
  state.elementActions.set(el, existing);

  // Start observing
  state.visibilityObserver.observe(el);

  // Set initial hidden state (hidden until visible, unless inverted)
  if (action.visibleInViewport !== false) {
    ActionRegistry.update(action.id, { hidden: true });
  }
}

function unobserveActionElement(actionId) {
  state.elementActions.forEach(function(actionIds, element) {
    var index = actionIds.indexOf(actionId);
    if (index > -1) {
      actionIds.splice(index, 1);
      if (actionIds.length === 0) {
        state.visibilityObserver.unobserve(element);
        state.elementActions.delete(element);
      }
    }
  });
}
```

### Usage Examples

```javascript
// DataTable registers a filter action that only shows when table is visible
Funky.DataTable.mobileActions = [{
  id: 'datatable-filter',
  icon: 'fas fa-filter',
  label: 'Filter',
  order: 25,
  element: '.funky-datatable',   // Show when any datatable is in view
  onClick: function() {
    var table = Funky.DataTable.getVisibleInstance();
    if (table) table.openFilterPanel();
  }
}];

// Form actions that appear when a form is visible
Funky.PubSub.emit('funky:mobile:action:register', {
  id: 'form-submit',
  icon: 'fas fa-check',
  label: 'Submit',
  order: 15,
  element: '#checkout-form',
  onClick: function() {
    document.querySelector('#checkout-form').submit();
  }
});

// Sidenav toggle that hides when sidenav is already visible
Funky.PubSub.emit('funky:mobile:action:register', {
  id: 'sidenav-toggle',
  icon: 'fas fa-bars',
  label: 'Menu',
  order: 10,
  element: '.funky-sidenav',
  visibleInViewport: false,      // Show when sidenav is NOT visible
  onClick: function() {
    Funky.SideNav.toggle();
  }
});
```

### Global Actions (Always Visible)

Actions without an `element` property are always visible (global actions):

```javascript
// Command palette - always available
{
  id: 'command-palette',
  icon: 'fas fa-search',
  label: 'Search',
  order: 20,
  // No element = always visible
  onClick: function() { Funky.CommandPalette.open(); }
}
```

### Cleanup

```javascript
function destroy() {
  if (state.visibilityObserver) {
    state.visibilityObserver.destroy();
    state.visibilityObserver = null;
  }
  state.elementActions.clear();
  // ... rest of cleanup
}
```
