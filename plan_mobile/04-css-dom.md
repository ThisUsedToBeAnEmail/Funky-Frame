# Phase 4: CSS and DOM Rendering

Create styles and implement DOM rendering for the bottom navigation.

## Checklist

- [x] Create `css/mobile-core.css` file
- [x] Implement fixed bottom positioning with safe-area-inset
- [x] Add hide-on-scroll-down transition (slide down)
- [x] Style action buttons with icon + label layout
- [x] Ensure touch targets are minimum 48x48px
- [x] Add active/pressed states
- [x] Add badge styling
- [x] Implement `createDOM()` function
- [x] Implement `renderActions()` function
- [x] Implement action button click handlers
- [x] Add ARIA attributes for accessibility

## DOM Structure

```html
<nav class="mobile-core" role="navigation" aria-label="Mobile navigation">
  <div class="mobile-core__actions">
    <button class="mobile-core__action" data-action="sidenav-toggle" type="button">
      <span class="mobile-core__action-icon"><i class="fas fa-bars"></i></span>
      <span class="mobile-core__action-label">Menu</span>
    </button>
    <button class="mobile-core__action" data-action="command-palette" type="button">
      <span class="mobile-core__action-icon"><i class="fas fa-search"></i></span>
      <span class="mobile-core__action-label">Search</span>
    </button>
    <!-- More actions... -->
    <button class="mobile-core__action mobile-core__action--more" data-action="more" type="button">
      <span class="mobile-core__action-icon"><i class="fas fa-ellipsis-h"></i></span>
      <span class="mobile-core__action-label">More</span>
    </button>
  </div>
</nav>
```

## CSS Structure

```css
/* Base container */
.mobile-core {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--mobile-core-z-index, 1050);
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: var(--pro-bg-elevated, #fff);
  border-top: 1px solid var(--pro-border-color, #e0e0e0);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: none;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.mobile-core--active {
  display: block;
}

.mobile-core--visible {
  transform: translateY(0);
}

/* Hidden on scroll down */
.mobile-core--hidden {
  transform: translateY(100%);
}

/* Actions container */
.mobile-core__actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  padding: 0 8px;
}

/* Individual action button */
.mobile-core__action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  max-width: 96px;
  height: 100%;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: var(--pro-text-secondary, #666);
  cursor: pointer;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-core__action:active,
.mobile-core__action--active {
  color: var(--pro-accent-primary, #007bff);
}

.mobile-core__action:focus-visible {
  outline: 2px solid var(--focus-ring-color, #007bff);
  outline-offset: -2px;
  border-radius: 4px;
}

/* Icon */
.mobile-core__action-icon {
  font-size: 20px;
  line-height: 1;
  margin-bottom: 2px;
  position: relative;
}

/* Label */
.mobile-core__action-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Badge */
.mobile-core__badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background: var(--pro-danger, #dc3545);
  border-radius: 8px;
}

/* Hidden state */
.mobile-core__action--hidden {
  display: none;
}

/* Disabled state */
.mobile-core__action--disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

## DOM Rendering

```javascript
function createDOM() {
  state.element = D.nav()
    .class('mobile-core')
    .attr('role', 'navigation')
    .aria('label', config.ariaLabel)
    .child(
      state.actionsContainer = D.div().class('mobile-core__actions')
    )
    .appendTo(document.body);
}

function renderActions() {
  var actions = ActionRegistry.getSorted().filter(function(a) {
    return !a.hidden;
  });

  var visibleCount = Math.min(actions.length, config.maxVisibleActions);
  var hasOverflow = actions.length > config.maxVisibleActions;

  state.actionsContainer.empty();

  // Render visible actions (leave room for More if overflow)
  var primaryActions = hasOverflow ? actions.slice(0, visibleCount - 1) : actions;
  primaryActions.forEach(function(action) {
    state.actionsContainer.append(createActionButton(action));
  });

  // Render More button if needed
  if (hasOverflow) {
    state.actionsContainer.append(createMoreButton());
  }
}

function createActionButton(action) {
  var btn = D.button()
    .class('mobile-core__action')
    .classIf(action.disabled, 'mobile-core__action--disabled')
    .attr('type', 'button')
    .attr('data-action', action.id)
    .aria('label', action.label)
    .child(
      D.span().class('mobile-core__action-icon').child(
        D.icon(action.icon),
        action.badge != null && D.span().class('mobile-core__badge').text(action.badge)
      ),
      D.span().class('mobile-core__action-label').text(action.label)
    )
    .on('click', function() {
      handleActionClick(action);
    });

  return btn;
}
```
