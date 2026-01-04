# Funky.MorphPanel

A smooth trigger-to-panel morphing component that animates buttons, cards, or icons into full panels/modals using FLIP animations. Supports all screen positions, SlidePanel-compatible API, and full Funky.Form integration.

## Quick Start

```javascript
// Register a panel
Funky.MorphPanel.register('details', {
    position: 'right',
    size: 'md'
});

// Show from trigger
Funky.MorphPanel.show('#open-btn', 'details');
Funky.MorphPanel.setData('details', {
    title: 'Item Details',
    content: '<p>Content here...</p>'
});

// Hide
Funky.MorphPanel.hide('details');
```

## Installation

Include the required files:

```html
<link rel="stylesheet" href="/assets/css/morph-panel.css">
<script src="/assets/js/funky/dom.js"></script>
<script src="/assets/js/funky/events.js"></script>
<script src="/assets/js/components/morph.js"></script>
<script src="/assets/js/components/morph-panel.js"></script>
```

Optional dependencies for enhanced features:

```html
<script src="/assets/js/components/form.js"></script>           <!-- Form mode -->
<script src="/assets/js/components/focus-manager.js"></script>  <!-- Focus trap -->
<script src="/assets/js/components/announce.js"></script>       <!-- Screen readers -->
<script src="/assets/js/components/toast.js"></script>          <!-- Success/error toasts -->
<script src="/assets/js/components/spinner.js"></script>        <!-- Loading indicator -->
```

## API

### Static Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `register()` | `panelId, options` | `this` | Register panel config |
| `show()` | `trigger, panelId` | `this` | Show panel (morphs from trigger) |
| `hide()` | `panelId` | `this` | Hide panel (morphs back to trigger) |
| `setData()` | `panelId, data` | `this` | Set title/content/footer |
| `create()` | `trigger, panelId, data?` | `this` | Open for create (form mode) |
| `edit()` | `trigger, panelId, data` | `this` | Open for edit (form mode) |
| `getInstance()` | `panelId` | `PanelInstance` | Get instance |
| `getForm()` | `panelId` | `Form` | Get form instance |
| `isVisible()` | `panelId` | `boolean` | Check visibility |
| `getActivePanel()` | - | `string|null` | Get active panel ID |
| `destroy()` | `panelId` | `this` | Destroy instance |
| `destroyAll()` | - | `this` | Destroy all |

### Instance Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `show()` | `trigger?` | - | Show the panel |
| `hide()` | - | - | Hide the panel |
| `toggle()` | `trigger?` | `this` | Toggle panel visibility |
| `create()` | `trigger?, initialData?` | - | Open in create mode |
| `edit()` | `trigger?, data` | - | Open in edit mode |
| `setData()` | `{ title, content, footer }` | `this` | Set panel content |
| `getHeader()` | - | `Element` | Get header element |
| `getBody()` | - | `Element` | Get body element |
| `getFooter()` | - | `Element` | Get footer element |
| `getForm()` | - | `Form|null` | Get form instance |
| `setLoading()` | `boolean` | `this` | Set loading state |
| `setFormMode()` | `boolean` | `this` | Toggle form mode |
| `destroy()` | - | - | Cleanup instance |

## Configuration Options

### Panel Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | String | `'center'` | `'left'`\|`'right'`\|`'top'`\|`'bottom'`\|`'center'` |
| `size` | String | `'md'` | `'sm'`\|`'md'`\|`'lg'`\|`'xl'`\|`'full'` |
| `preset` | String | `'expand'` | Morph preset (auto-selected by position) |
| `duration` | Number | `300` | Animation duration (ms) |
| `backdrop` | Boolean | `true` | Show backdrop overlay |
| `keyboard` | Boolean | `true` | Escape to close |
| `focusTrap` | Boolean | `true` | Trap focus inside |
| `scrollLock` | Boolean | `true` | Lock body scroll |
| `closeButton` | Boolean | `true` | Show close button |
| `closeOnBackdrop` | Boolean | `true` | Close on backdrop click |

### Callbacks

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onShow` | Function | `null` | Before show animation |
| `onShown` | Function | `null` | After show animation |
| `onHide` | Function | `null` | Before hide animation |
| `onHidden` | Function | `null` | After hide animation |

### Form Options (enables form mode)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schema` | Object | `null` | Form schema |
| `schemaPath` | String | `null` | OpenAPI schema path |
| `apiUrl` | String | `null` | API endpoint |
| `entity` | String | `null` | Entity name for cache |
| `entityLabel` | String | `null` | Human-readable label |
| `validateOnBlur` | Boolean | `true` | Validate on blur |
| `validateOnChange` | Boolean | `true` | Validate on change |
| `resetOnClose` | Boolean | `true` | Reset form on close |
| `submitText` | String | `'Save'` | Submit button text |
| `cancelText` | String | `'Cancel'` | Cancel button text |
| `createTitle` | String | `null` | Title for create mode |
| `editTitle` | String | `null` | Title for edit mode |
| `enhanceSchema` | Function | `null` | `(schema, data, mode) => schema` |
| `onChange` | Function | `null` | `(field, value, data)` |
| `onSubmit` | Function | `null` | `(data, mode) => Promise` |
| `onSave` | Function | `null` | `(data, mode)` |
| `onError` | Function | `null` | `(errors)` |

## Events

Listen on document:

```javascript
document.addEventListener('funky.morphpanel.show', function(e) {
    console.log('Opening:', e.detail.panelId);
});
```

Or use Funky.Events:

```javascript
E.on(document, 'funky.morphpanel.save', function(e) {
    console.log('Saved:', e.detail.data);
});
```

| Event | Payload | Description |
|-------|---------|-------------|
| `funky.morphpanel.show` | `{ panelId, trigger }` | Before show animation |
| `funky.morphpanel.shown` | `{ panelId }` | After show animation |
| `funky.morphpanel.hide` | `{ panelId }` | Before hide animation |
| `funky.morphpanel.hidden` | `{ panelId, trigger }` | After hide animation |
| `funky.morphpanel.submit` | `{ panelId, data, mode }` | Form submitted |
| `funky.morphpanel.save` | `{ panelId, data, mode }` | After successful save |
| `funky.morphpanel.error` | `{ panelId, errors }` | On save error |

## Position Variants

### Center (Modal)
```javascript
Funky.MorphPanel.register('modal', { 
    position: 'center', 
    size: 'md' 
});
// Uses 'expand' preset - scales up from trigger
```

### Right Panel (Sidebar)
```javascript
Funky.MorphPanel.register('sidebar', { 
    position: 'right', 
    size: 'lg' 
});
// Uses 'slide' preset - slides in from right
```

### Left Panel (Navigation)
```javascript
Funky.MorphPanel.register('nav', { 
    position: 'left', 
    size: 'sm' 
});
// Uses 'slide' preset - slides in from left
```

### Bottom Drawer
```javascript
Funky.MorphPanel.register('drawer', { 
    position: 'bottom', 
    size: 'md' 
});
// Uses 'slide' preset - slides up from bottom
// Mobile: swipe down to dismiss
```

### Top Notification
```javascript
Funky.MorphPanel.register('notification', { 
    position: 'top', 
    size: 'sm' 
});
// Uses 'slide' preset - slides down from top
```

## Form Mode Examples

### Basic Form with Schema

```javascript
Funky.MorphPanel.register('user-form', {
    position: 'right',
    size: 'md',
    schema: {
        fields: {
            name: { type: 'text', label: 'Name', required: true },
            email: { type: 'email', label: 'Email', required: true },
            role: { 
                type: 'select', 
                label: 'Role',
                options: [
                    { value: 'user', label: 'User' },
                    { value: 'admin', label: 'Admin' }
                ]
            }
        }
    },
    entityLabel: 'User',
    onSave: function(data, mode) {
        console.log(mode + ' user:', data);
        refreshUserList();
    }
});

// Create new user
document.querySelector('#add-user').onclick = function() {
    Funky.MorphPanel.create(this, 'user-form');
};

// Edit existing user
function editUser(userData) {
    Funky.MorphPanel.edit('#edit-btn', 'user-form', userData);
}
```

### With API Auto-Handling

```javascript
Funky.MorphPanel.register('product-form', {
    position: 'center',
    size: 'lg',
    schemaPath: 'CreateProduct',  // Loads from OpenAPI
    apiUrl: '/api/products',      // Auto POST/PUT
    entity: 'products',           // Cache invalidation
    entityLabel: 'Product'
});

// Create: Auto-POSTs to /api/products
Funky.MorphPanel.create('#add-btn', 'product-form');

// Edit: Auto-PUTs to /api/products/:id
Funky.MorphPanel.edit('#edit-btn', 'product-form', { 
    id: 123, 
    name: 'Widget' 
});
```

### Custom Submit Handler

```javascript
Funky.MorphPanel.register('settings-form', {
    position: 'right',
    size: 'md',
    schema: settingsSchema,
    onSubmit: function(data, mode) {
        // Return a promise
        return fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(function(res) {
            if (!res.ok) throw new Error('Save failed');
            return res.json();
        });
    },
    onSave: function(data) {
        Funky.Toast.success('Settings saved');
    },
    onError: function(errors) {
        Funky.Toast.error('Failed to save settings');
    }
});
```

### Dynamic Schema Enhancement

```javascript
Funky.MorphPanel.register('order-form', {
    position: 'center',
    schema: baseOrderSchema,
    enhanceSchema: function(schema, data, mode) {
        // Add fields based on mode or data
        if (mode === 'edit') {
            schema.fields.status = {
                type: 'select',
                label: 'Status',
                options: getStatusOptions()
            };
        }
        
        // Pre-select customer if creating from customer page
        if (data && data.customerId) {
            schema.fields.customer.defaultValue = data.customerId;
            schema.fields.customer.disabled = true;
        }
        
        return schema;
    }
});
```

## Mobile Features

### Swipe to Dismiss

Bottom and top positioned panels support swipe gestures on mobile:

```javascript
Funky.MorphPanel.register('mobile-drawer', {
    position: 'bottom',
    size: 'md'
});
// Users can swipe down to close
```

### Drag Handle

A visual drag handle appears on bottom/top panels for touch affordance.

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close panel |
| `Tab` | Navigate within panel (trapped) |
| `Shift+Tab` | Navigate backwards |

## CSS Customization

Override CSS variables for theming:

```css
.funky-morph-panel {
    /* Border radius */
    --morph-panel-border-radius: 12px;
    
    /* Shadow */
    --morph-panel-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    
    /* Sizes */
    --morph-panel-sm: 320px;
    --morph-panel-md: 520px;
    --morph-panel-lg: 720px;
    --morph-panel-xl: 960px;
    
    /* Animation */
    --morph-panel-duration: 350ms;
    --morph-panel-easing: cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Colors (inherits from --pro-* by default) */
    --morph-panel-bg: var(--pro-bg-primary);
    --morph-panel-header-bg: var(--pro-bg-secondary);
    --morph-panel-border: var(--pro-border-color);
}

/* Backdrop customization */
.funky-morph-panel__backdrop {
    --morph-panel-backdrop-color: rgba(0, 0, 0, 0.5);
}
```

## SlidePanel Migration

MorphPanel is a drop-in replacement for SlidePanel with enhanced animations:

```javascript
// Before (SlidePanel)
Funky.SlidePanel.register('details');
Funky.SlidePanel.show('details');
Funky.SlidePanel.setData('details', { title, content });

// After (MorphPanel) - same API + trigger element
Funky.MorphPanel.register('details', { position: 'right' });
Funky.MorphPanel.show('#trigger', 'details');  // Add trigger for FLIP
Funky.MorphPanel.setData('details', { title, content });
```

**Key Differences:**
- `show()` accepts a trigger element for morph animation
- Position must be specified (no automatic right-side default)
- FLIP animation instead of CSS slide
- Form mode integration built-in

## Accessibility

- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` points to panel title
- Focus trapped inside panel
- Focus restored to trigger on close
- Escape key closes panel
- Screen reader announcements via Funky.Announce

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- IE11 (degraded animation - CSS fallback)

## See Also

- [Funky.Morph](./morph.md) - FLIP animation engine
- [Funky.Form](./form.md) - Form component
- [Funky.SlidePanel](./slide-panel.md) - Simpler side panel
- [Funky.Modal](./modal.md) - Traditional modal
- [Funky.FocusManager](./focus-manager.md) - Focus trap
