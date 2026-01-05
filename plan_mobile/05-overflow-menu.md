# Phase 5: Overflow Menu Handling

Implement the "More" button and overflow panel for excess actions.

## Checklist

- [x] Add overflow panel DOM structure
- [x] Add overflow backdrop element
- [x] Implement `openOverflow()` function
- [x] Implement `closeOverflow()` function
- [x] Handle Escape key to close (via Keyboard scope)
- [x] Handle backdrop click to close
- [x] Render overflow actions in panel
- [x] Add slide-up animation for panel
- [x] Add ARIA attributes for overflow menu
- [x] Focus management when opening/closing

## DOM Structure (Extended)

```html
<nav class="mobile-core" role="navigation" aria-label="Mobile navigation">
  <div class="mobile-core__actions">
    <!-- Primary actions -->
    <button class="mobile-core__action mobile-core__action--more"
            data-action="more"
            type="button"
            aria-expanded="false"
            aria-controls="mobile-core-overflow">
      <span class="mobile-core__action-icon"><i class="fas fa-ellipsis-h"></i></span>
      <span class="mobile-core__action-label">More</span>
    </button>
  </div>

  <!-- Overflow panel -->
  <div class="mobile-core__overflow" id="mobile-core-overflow" aria-hidden="true">
    <div class="mobile-core__overflow-backdrop"></div>
    <div class="mobile-core__overflow-panel" role="menu">
      <div class="mobile-core__overflow-header">
        <span class="mobile-core__overflow-title">More Actions</span>
        <button class="mobile-core__overflow-close" type="button" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="mobile-core__overflow-actions">
        <!-- Overflow action buttons rendered here -->
      </div>
    </div>
  </div>
</nav>
```

## CSS for Overflow

```css
/* Overflow container */
.mobile-core__overflow {
  position: fixed;
  inset: 0;
  z-index: var(--mobile-core-z-index, 1050);
  display: none;
  pointer-events: none;
}

.mobile-core__overflow--open {
  display: block;
  pointer-events: auto;
}

/* Backdrop */
.mobile-core__overflow-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mobile-core__overflow--open .mobile-core__overflow-backdrop {
  opacity: 1;
}

/* Panel */
.mobile-core__overflow-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60vh;
  background: var(--pro-bg-elevated, #fff);
  border-radius: 16px 16px 0 0;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mobile-core__overflow--open .mobile-core__overflow-panel {
  transform: translateY(0);
}

/* Header */
.mobile-core__overflow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--pro-border-color, #e0e0e0);
}

.mobile-core__overflow-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--pro-text-primary, #333);
}

.mobile-core__overflow-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--pro-text-secondary, #666);
  cursor: pointer;
  border-radius: 50%;
}

.mobile-core__overflow-close:hover {
  background: var(--pro-bg-hover, #f0f0f0);
}

/* Actions list */
.mobile-core__overflow-actions {
  padding: 8px 0;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-core__overflow-action {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 12px 20px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--pro-text-primary, #333);
}

.mobile-core__overflow-action:active {
  background: var(--pro-bg-hover, #f0f0f0);
}

.mobile-core__overflow-action-icon {
  width: 24px;
  font-size: 18px;
  color: var(--pro-text-secondary, #666);
}

.mobile-core__overflow-action-label {
  font-size: 16px;
}
```

## JavaScript Implementation

```javascript
function createMoreButton() {
  return D.button()
    .class('mobile-core__action mobile-core__action--more')
    .attr('type', 'button')
    .attr('data-action', 'more')
    .aria('expanded', 'false')
    .aria('controls', 'mobile-core-overflow')
    .child(
      D.span().class('mobile-core__action-icon').child(
        D.icon(config.moreIcon)
      ),
      D.span().class('mobile-core__action-label').text(config.moreLabel)
    )
    .on('click', toggleOverflow);
}

function createOverflowPanel() {
  state.overflowPanel = D.div()
    .class('mobile-core__overflow')
    .attr('id', 'mobile-core-overflow')
    .aria('hidden', 'true')
    .child(
      D.div().class('mobile-core__overflow-backdrop').on('click', closeOverflow),
      D.div().class('mobile-core__overflow-panel').attr('role', 'menu').child(
        D.div().class('mobile-core__overflow-header').child(
          D.span().class('mobile-core__overflow-title').text('More Actions'),
          D.button()
            .class('mobile-core__overflow-close')
            .attr('type', 'button')
            .aria('label', 'Close')
            .child(D.icon('fas fa-times'))
            .on('click', closeOverflow)
        ),
        state.overflowActions = D.div().class('mobile-core__overflow-actions')
      )
    )
    .appendTo(state.element);
}

function openOverflow() {
  if (state.overflowOpen) return;

  state.overflowOpen = true;
  state.overflowPanel.classAdd('mobile-core__overflow--open');
  state.overflowPanel.aria('hidden', 'false');

  // Update More button state
  var moreBtn = state.actionsContainer.find('[data-action="more"]');
  if (moreBtn) moreBtn.aria('expanded', 'true');

  // Push keyboard scope for Escape
  if (Funky.Keyboard) {
    Funky.Keyboard.pushScope('mobile-core-overflow');
    Funky.Keyboard.register({
      key: 'escape',
      scope: 'mobile-core-overflow',
      handler: closeOverflow,
      description: 'Close menu'
    });
  }

  // Focus first action
  var firstAction = state.overflowActions.find('button');
  if (firstAction) firstAction.focus();

  PubSub.emit('funky:mobile-core:overflow:open');
}

function closeOverflow() {
  if (!state.overflowOpen) return;

  state.overflowOpen = false;
  state.overflowPanel.classRemove('mobile-core__overflow--open');
  state.overflowPanel.aria('hidden', 'true');

  // Update More button state
  var moreBtn = state.actionsContainer.find('[data-action="more"]');
  if (moreBtn) {
    moreBtn.aria('expanded', 'false');
    moreBtn.focus();
  }

  // Pop keyboard scope
  if (Funky.Keyboard) {
    Funky.Keyboard.popScope();
  }

  PubSub.emit('funky:mobile-core:overflow:close');
}

function toggleOverflow() {
  if (state.overflowOpen) {
    closeOverflow();
  } else {
    renderOverflowActions();
    openOverflow();
  }
}

function renderOverflowActions() {
  var actions = ActionRegistry.getSorted().filter(function(a) { return !a.hidden; });
  var overflow = actions.slice(config.maxVisibleActions - 1);

  state.overflowActions.empty();

  overflow.forEach(function(action) {
    state.overflowActions.append(
      D.button()
        .class('mobile-core__overflow-action')
        .attr('type', 'button')
        .attr('role', 'menuitem')
        .child(
          D.span().class('mobile-core__overflow-action-icon').child(D.icon(action.icon)),
          D.span().class('mobile-core__overflow-action-label').text(action.label)
        )
        .on('click', function() {
          handleActionClick(action);
          closeOverflow();
        })
    );
  });
}
```
