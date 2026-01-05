# Phase 2: Action Registry and Default Actions

Implement action management and register default actions.

## Checklist

- [x] Create ActionRegistry instance using `Funky.ActionRegistry.create()`
- [x] Define action schema (id, icon, label, order, onClick, emit, badge, visible)
- [x] Implement `registerAction(actionConfig)` public method
- [x] Implement `unregisterAction(id)` public method
- [x] Implement `updateAction(id, updates)` public method
- [x] Implement `hideAction(id)` / `showAction(id)` convenience methods
- [x] Register default sidenav toggle action (if sidenav exists)
- [x] Register default command palette action
- [x] Register default keyboard help action
- [x] Register default skip navigation action

## Action Schema

```javascript
var ActionRegistry = Funky.ActionRegistry.create({
  schema: {
    icon: 'fas fa-circle',
    label: '',
    order: 50,          // Lower = more prominent (left)
    hidden: false,
    disabled: false,
    onClick: null,      // Function callback
    emit: null,         // PubSub event to emit
    emitData: null,     // Data for PubSub event
    badge: null,        // Badge count/text
    className: ''
  },
  onAdd: function(action) {
    if (state.initialized) renderActions();
    PubSub.emit('funky:mobile-core:action:added', { id: action.id });
  },
  onRemove: function(id) {
    if (state.initialized) renderActions();
    PubSub.emit('funky:mobile-core:action:removed', { id: id });
  },
  onUpdate: function(id, updates) {
    if (state.initialized) renderActions();
  }
});
```

## Default Actions

```javascript
var DEFAULT_ACTIONS = [
  {
    id: 'sidenav-toggle',
    icon: 'fas fa-bars',
    label: 'Menu',
    order: 10,
    onClick: function() {
      var sidenav = document.querySelector('.funky-sidenav');
      if (sidenav && Funky.SideNav) {
        var instance = Funky.SideNav.getInstance(sidenav.id);
        if (instance) instance.toggle();
      }
    },
    condition: function() {
      return !!document.querySelector('.funky-sidenav');
    }
  },
  {
    id: 'command-palette',
    icon: 'fas fa-search',
    label: 'Search',
    order: 20,
    onClick: function() {
      if (Funky.CommandPalette) Funky.CommandPalette.open();
    },
    condition: function() {
      return !!Funky.CommandPalette;
    }
  },
  {
    id: 'keyboard-help',
    icon: 'fas fa-keyboard',
    label: 'Shortcuts',
    order: 30,
    onClick: function() {
      if (Funky.Keyboard) Funky.Keyboard.showHelp();
    },
    condition: function() {
      return !!(Funky.Keyboard && Funky.Keyboard.showHelp);
    }
  },
  {
    id: 'skip-navigation',
    icon: 'fas fa-forward',
    label: 'Skip',
    order: 40,
    onClick: function() {
      if (Funky.FocusManager) Funky.FocusManager.nextRegion();
    },
    condition: function() {
      return !!Funky.FocusManager;
    }
  }
];
```

## Public API

```javascript
// Exposed on Funky.MobileCore
registerAction: function(actionConfig) {
  return ActionRegistry.add(actionConfig);
},
unregisterAction: function(id) {
  return ActionRegistry.remove(id);
},
updateAction: function(id, updates) {
  return ActionRegistry.update(id, updates);
},
getActions: function() {
  return ActionRegistry.getSorted();
}
```
