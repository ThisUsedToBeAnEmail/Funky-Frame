# Funky.Stepper - Visual Step Progress Indicator

Visual step indicator showing progress through a multi-step process.

## Overview

`Funky.Stepper` provides a configurable step progress indicator for multi-step workflows. Supports horizontal and vertical orientations, clickable navigation, validation callbacks, and various step states.

**Key Features:**
- Horizontal and vertical orientations
- Step states: completed, current, upcoming, error
- Linear and non-linear navigation
- Keyboard navigation support
- Wizard integration
- URL hash synchronization
- Progress bar display
- Sub-steps support
- LiveBinding compatible

## Registration

**File:** `js/components/stepper.js`

Registered as `Funky.Stepper` via the component registry. Uses Pattern B (Registry) for multiple instances with lifecycle management.

## API Reference

### Factory Methods

#### `Funky.Stepper.init(container, config)`

Initialize a new stepper instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|Element | Yes | CSS selector or DOM element |
| config | object | Yes | Configuration options |

**Config Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| steps | array | [] | Array of step objects |
| current | number | 0 | Initial current step index |
| completed | array | [] | Array of completed step indices or IDs |
| orientation | string | 'horizontal' | 'horizontal' or 'vertical' |
| size | string | 'md' | 'sm', 'md', or 'lg' |
| showLabels | boolean | true | Show step labels |
| showNumbers | boolean | true | Show step numbers |
| showIcons | boolean | true | Show custom icons |
| showDescription | boolean | true | Show step descriptions |
| showProgress | boolean | false | Show progress bar |
| clickable | boolean | true | Allow clicking steps to navigate |
| linear | boolean | true | Require sequential completion |
| animated | boolean | true | Enable step animations |
| hashSync | boolean | false | Sync with URL hash |
| onBeforeChange | function | null | Validation callback before navigation |
| onChange | function | null | Callback when step changes |

**Step Object:**
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | string | No | Unique step identifier |
| label | string | Yes | Step label text |
| icon | string | No | FontAwesome class (e.g., 'fas fa-user') |
| description | string | No | Step description/subtitle |
| substeps | array | No | Array of sub-step objects |

**Returns:** `Stepper` instance

**Example:**
```javascript
var stepper = Funky.Stepper.init('#progress', {
    steps: [
        { id: 'info', label: 'Basic Info', icon: 'fas fa-user' },
        { id: 'details', label: 'Details', icon: 'fas fa-list' },
        { id: 'review', label: 'Review', icon: 'fas fa-check' }
    ],
    current: 0,
    clickable: true,
    linear: true,
    onChange: function(step, index) {
        console.log('Changed to:', step.label);
    }
});
```

---

#### `Funky.Stepper.getInstance(id)`

Get stepper instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Instance ID |

**Returns:** `Stepper` instance or null

---

#### `Funky.Stepper.destroyAll()`

Destroy all stepper instances.

---

#### `Funky.Stepper.autoInit(scope)`

Auto-initialize steppers from declarative HTML.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| scope | Element | No | Container to search within (default: document) |

**Declarative Example:**
```html
<div data-stepper
     data-steps='[{"id":"s1","label":"Step 1"},{"id":"s2","label":"Step 2"}]'
     data-current="0"
     data-orientation="horizontal"
     data-clickable="true">
</div>
```

---

### Instance Methods

#### `stepper.getCurrent()`

Get the current step index.

**Returns:** `number` - Current step index (0-based)

**Example:**
```javascript
var currentIndex = stepper.getCurrent(); // 0
```

---

#### `stepper.setCurrent(index)`

Navigate to a specific step.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| index | number | Yes | Step index to navigate to |

**Returns:** `Stepper` instance (chainable)

**Example:**
```javascript
stepper.setCurrent(2);
```

---

#### `stepper.next()`

Navigate to the next step.

**Returns:** `Stepper` instance (chainable)

**Example:**
```javascript
stepper.next();
```

---

#### `stepper.prev()`

Navigate to the previous step.

**Returns:** `Stepper` instance (chainable)

**Example:**
```javascript
stepper.prev();
```

---

#### `stepper.complete(indexOrId)`

Mark a step as completed.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| indexOrId | number\|string | Yes | Step index or step ID |

**Returns:** `Stepper` instance (chainable)

**Example:**
```javascript
stepper.complete(0);      // By index
stepper.complete('info'); // By ID
```

---

#### `stepper.setError(indexOrId, message)`

Set an error state on a step.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| indexOrId | number\|string | Yes | Step index or step ID |
| message | string | No | Error message to display |

**Returns:** `Stepper` instance (chainable)

**Example:**
```javascript
stepper.setError(1, 'Validation failed');
```

---

#### `stepper.clearError(indexOrId)`

Clear error state from a step.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| indexOrId | number\|string | Yes | Step index or step ID |

**Returns:** `Stepper` instance (chainable)

**Example:**
```javascript
stepper.clearError(1);
```

---

#### `stepper.getProgress()`

Get the completion percentage.

**Returns:** `number` - Percentage (0-100)

**Example:**
```javascript
var progress = stepper.getProgress(); // 67
```

---

#### `stepper.reset()`

Reset stepper to initial state. Clears current position, completed steps, and errors.

**Returns:** `Stepper` instance (chainable)

**Example:**
```javascript
stepper.reset();
```

---

#### `stepper.destroy()`

Destroy the stepper instance and clean up DOM/events.

**Example:**
```javascript
stepper.destroy();
```

---

### Callbacks

#### `onBeforeChange(fromIndex, toIndex)`

Called before navigation. Return `false` to prevent navigation, or return a `Promise` that resolves to `false`.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| fromIndex | number | Current step index |
| toIndex | number | Target step index |

**Returns:** `boolean` or `Promise<boolean>`

**Example:**
```javascript
var stepper = Funky.Stepper.init('#progress', {
    steps: mySteps,
    clickable: true,
    onBeforeChange: function(from, to) {
        // Validate current step before allowing navigation
        if (from === 0 && !validateBasicInfo()) {
            Funky.Toast.error('Please complete all required fields');
            return false;
        }
        return true;
    }
});

// With Promise (async validation)
onBeforeChange: function(from, to) {
    return Funky.Api.post('/api/validate-step', { step: from })
        .then(function(response) {
            return response.valid;
        });
}
```

---

#### `onChange(step, index)`

Called after step changes.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| step | object | The new step object |
| index | number | The new step index |

**Example:**
```javascript
onChange: function(step, index) {
    console.log('Now on step:', step.label);
    loadStepContent(index);
}
```

---

## Events

Custom events emitted on the container element via `Funky.Events`:

| Event | Detail | Description |
|-------|--------|-------------|
| `funky.stepper.change` | `{ step, index, previous }` | Step changed |

**Example:**
```javascript
document.querySelector('#progress').addEventListener('funky.stepper.change', function(e) {
    console.log('Changed to step', e.detail.index);
    console.log('Previous step was', e.detail.previous);
});
```

---

## Step States

| State | Class | Description |
|-------|-------|-------------|
| Upcoming | `funky-stepper__step--upcoming` | Not yet reached |
| Current | `funky-stepper__step--current` | Active step |
| Completed | `funky-stepper__step--completed` | Successfully done |
| Error | `funky-stepper__step--error` | Has validation errors |
| Disabled | `funky-stepper__step--disabled` | Cannot navigate |

---

## Keyboard Navigation

When `clickable: true`, the stepper supports keyboard navigation:

| Key | Action |
|-----|--------|
| `ArrowRight` / `ArrowDown` | Focus next step |
| `ArrowLeft` / `ArrowUp` | Focus previous step |
| `Home` | Focus first step |
| `End` | Focus last step |
| `Enter` / `Space` | Activate focused step |
| `Tab` | Move focus to stepper / out of stepper |

---

## CSS Variables

```css
:root {
    /* Indicator (circle) */
    --stepper-indicator-size: 32px;
    --stepper-indicator-size-sm: 24px;
    --stepper-indicator-size-lg: 40px;
    --stepper-indicator-bg: var(--pro-bg-tertiary);
    --stepper-indicator-bg-completed: var(--pro-accent-success);
    --stepper-indicator-bg-current: var(--pro-accent-primary);
    --stepper-indicator-bg-error: var(--pro-accent-danger);
    --stepper-indicator-color: var(--pro-text-secondary);
    --stepper-indicator-color-active: #ffffff;

    /* Connector (line) */
    --stepper-connector-width: 2px;
    --stepper-connector-color: var(--pro-border-color);
    --stepper-connector-color-completed: var(--pro-accent-success);

    /* Label */
    --stepper-label-color: var(--pro-text-secondary);
    --stepper-label-color-current: var(--pro-text-primary);
    --stepper-label-size: var(--pro-font-size-sm);

    /* Spacing */
    --stepper-gap: 16px;
}
```

---

## Accessibility

- `role="navigation"` with `aria-label="Progress"`
- `<ol>` for semantic step list
- `aria-current="step"` on current step
- `disabled` attribute on disabled steps
- Screen reader announces step position and status
- Full keyboard navigation support
- Focus visible indicators
- Respects `prefers-reduced-motion`

---

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Dom` (dom.js)
- `Funky.Registry` (registry.js)
- `Funky.Events` (events.js)

**Optional:**
- `Funky.Wizard` (wizard.js) - for wizard integration
- `Funky.LiveBinding` (live-binding.js) - for reactive data binding

---

## LiveBinding Interface

`Funky.Stepper` implements the bindable interface for use with `Funky.LiveBinding`.

### Methods

#### `stepper.setData(data)`

Set stepper state from a data object.

**Data Object:**
| Property | Type | Description |
|----------|------|-------------|
| current | number | Current step index |
| completed | array | Array of completed step indices or IDs |
| errors | object | Error map with step indices/IDs as keys |

**Example:**
```javascript
stepper.setData({
    current: 2,
    completed: [0, 1],
    errors: { 2: 'Validation failed' }
});
```

---

#### `stepper.getData()`

Get current stepper state as a data object.

**Returns:**
```javascript
{
    current: 1,
    completed: [0],
    errors: {},
    progress: 33
}
```

---

### Usage with LiveBinding

```javascript
// Bind stepper to WebSocket for real-time progress updates
Funky.LiveBinding.bindComponent('#job-progress', {
    source: 'websocket',
    channel: 'job:123:progress',
    transform: function(data) {
        return {
            current: data.currentStep,
            completed: data.completedSteps
        };
    }
});

// Bind to API polling for background job status
Funky.LiveBinding.bindComponent('#upload-progress', {
    source: 'api',
    url: '/api/uploads/456/status',
    interval: 2000,
    transform: function(data) {
        return {
            current: data.step,
            completed: data.completed,
            errors: data.errors || {}
        };
    }
});
```

---

## Examples

### Basic Stepper

```javascript
var stepper = Funky.Stepper.init('#checkout-progress', {
    steps: [
        { id: 'cart', label: 'Cart' },
        { id: 'shipping', label: 'Shipping' },
        { id: 'payment', label: 'Payment' },
        { id: 'confirm', label: 'Confirm' }
    ],
    current: 0,
    showLabels: true,
    showNumbers: true
});
```

### Clickable with Validation

```javascript
var stepper = Funky.Stepper.init('#form-progress', {
    steps: [
        { id: 'account', label: 'Account' },
        { id: 'profile', label: 'Profile' },
        { id: 'preferences', label: 'Preferences' }
    ],
    clickable: true,
    linear: true,
    onBeforeChange: function(from, to) {
        // Only validate when moving forward
        if (to > from) {
            return validateStep(from);
        }
        return true;
    },
    onChange: function(step, index) {
        showStepContent(step.id);
    }
});

// Mark steps complete as user progresses
document.querySelector('#next-btn').addEventListener('click', function() {
    stepper.complete(stepper.getCurrent());
    stepper.next();
});
```

### Vertical with Progress Bar

```javascript
var stepper = Funky.Stepper.init('#sidebar-progress', {
    steps: [
        { id: 'upload', label: 'Upload Files', icon: 'fas fa-upload' },
        { id: 'process', label: 'Processing', icon: 'fas fa-cog' },
        { id: 'review', label: 'Review', icon: 'fas fa-eye' },
        { id: 'complete', label: 'Complete', icon: 'fas fa-check' }
    ],
    orientation: 'vertical',
    showProgress: true,
    showIcons: true
});
```

### With Funky.Form Integration

Complete multi-step form wizard with validation:

```javascript
// Step schemas for Funky.Form
var accountSchema = {
    fields: {
        email: { type: 'email', label: 'Email', required: true },
        password: { type: 'password', label: 'Password', required: true, minLength: 8 },
        confirm_password: { type: 'password', label: 'Confirm Password', required: true }
    }
};

var profileSchema = {
    fields: {
        first_name: { type: 'text', label: 'First Name', required: true },
        last_name: { type: 'text', label: 'Last Name', required: true },
        phone: { type: 'tel', label: 'Phone Number' },
        company: { type: 'text', label: 'Company' }
    }
};

var preferencesSchema = {
    fields: {
        newsletter: { type: 'checkbox', label: 'Subscribe to newsletter' },
        notifications: {
            type: 'select',
            label: 'Notification Preference',
            options: [
                { value: 'all', label: 'All notifications' },
                { value: 'important', label: 'Important only' },
                { value: 'none', label: 'None' }
            ]
        },
        theme: {
            type: 'radio',
            label: 'Theme',
            options: [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' }
            ]
        }
    }
};

// Form instances for each step
var forms = {};
var stepData = {};

// Initialize stepper
var stepper = Funky.Stepper.init('#registration-stepper', {
    steps: [
        { id: 'account', label: 'Account', icon: 'fas fa-user' },
        { id: 'profile', label: 'Profile', icon: 'fas fa-id-card' },
        { id: 'preferences', label: 'Preferences', icon: 'fas fa-cog' },
        { id: 'review', label: 'Review', icon: 'fas fa-check' }
    ],
    clickable: true,
    linear: true,
    onBeforeChange: function(from, to) {
        // Validate current form before moving forward
        if (to > from && forms[from]) {
            var validation = forms[from].validate();
            if (!validation.valid) {
                stepper.setError(from, 'Please fix validation errors');
                return false;
            }
            // Store form data
            stepData[stepper.config.steps[from].id] = forms[from].getData();
            stepper.clearError(from);
            stepper.complete(from);
        }
        return true;
    },
    onChange: function(step, index) {
        showStep(step.id, index);
    }
});

// Show step content and initialize forms
function showStep(stepId, index) {
    // Hide all step containers
    document.querySelectorAll('.step-content').forEach(function(el) {
        el.style.display = 'none';
    });

    // Show current step
    var container = document.getElementById('step-' + stepId);
    if (container) {
        container.style.display = 'block';
    }

    // Initialize form if needed
    if (stepId === 'account' && !forms[0]) {
        forms[0] = Funky.Form.init('#form-account', {
            schema: accountSchema,
            onChange: function() {
                stepper.clearError(0);
            }
        });
    } else if (stepId === 'profile' && !forms[1]) {
        forms[1] = Funky.Form.init('#form-profile', {
            schema: profileSchema,
            onChange: function() {
                stepper.clearError(1);
            }
        });
    } else if (stepId === 'preferences' && !forms[2]) {
        forms[2] = Funky.Form.init('#form-preferences', {
            schema: preferencesSchema,
            onChange: function() {
                stepper.clearError(2);
            }
        });
    } else if (stepId === 'review') {
        renderReview();
    }
}

// Render review step
function renderReview() {
    var reviewContainer = document.getElementById('step-review');
    var html = '<div class="review-summary">';

    if (stepData.account) {
        html += '<h4>Account</h4>';
        html += '<p>Email: ' + stepData.account.email + '</p>';
    }

    if (stepData.profile) {
        html += '<h4>Profile</h4>';
        html += '<p>Name: ' + stepData.profile.first_name + ' ' + stepData.profile.last_name + '</p>';
        if (stepData.profile.company) {
            html += '<p>Company: ' + stepData.profile.company + '</p>';
        }
    }

    if (stepData.preferences) {
        html += '<h4>Preferences</h4>';
        html += '<p>Newsletter: ' + (stepData.preferences.newsletter ? 'Yes' : 'No') + '</p>';
        html += '<p>Notifications: ' + stepData.preferences.notifications + '</p>';
        html += '<p>Theme: ' + stepData.preferences.theme + '</p>';
    }

    html += '</div>';
    reviewContainer.innerHTML = html;
}

// Navigation buttons
document.getElementById('btn-prev').addEventListener('click', function() {
    stepper.prev();
});

document.getElementById('btn-next').addEventListener('click', function() {
    var current = stepper.getCurrent();
    var steps = stepper.config.steps;

    if (current < steps.length - 1) {
        stepper.next();
    } else {
        // Final submit
        submitRegistration();
    }
});

function submitRegistration() {
    // Collect all data
    var allData = Object.assign({}, stepData.account, stepData.profile, stepData.preferences);

    Funky.Api.post('/api/register', allData)
        .then(function(response) {
            stepper.complete(3);
            Funky.Toast.success('Registration complete!');
        })
        .catch(function(error) {
            stepper.setError(3, 'Registration failed');
            Funky.Toast.error(error.message);
        });
}

// Initialize first step
showStep('account', 0);
```

### Wizard Integration

```javascript
// Create stepper
var stepper = Funky.Stepper.init('#wizard-progress', {
    steps: [
        { label: 'Details' },
        { label: 'Options' },
        { label: 'Review' }
    ]
});

// Create wizard linked to stepper
var wizard = Funky.Wizard.create({
    modalId: 'myWizardModal',
    title: 'Create Item',
    steps: [
        {
            type: 'form',
            stateKey: 'details',
            schema: {
                fields: {
                    name: { type: 'text', label: 'Name', required: true },
                    description: { type: 'textarea', label: 'Description' }
                }
            }
        },
        {
            type: 'form',
            stateKey: 'options',
            schema: {
                fields: {
                    priority: {
                        type: 'select',
                        label: 'Priority',
                        options: [
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' }
                        ]
                    },
                    active: { type: 'checkbox', label: 'Active' }
                }
            }
        },
        {
            type: 'custom',
            stateKey: 'review',
            onInit: function(wizard, stepNum) {
                // Render review content
                var container = document.getElementById('wizard-step-3-container');
                var state = wizard.getState();
                container.innerHTML = '<pre>' + JSON.stringify(state, null, 2) + '</pre>';
            }
        }
    ],
    onSave: function(state, mode) {
        return Funky.Api.post('/api/items', state);
    }
});

// Sync stepper with wizard navigation
wizard.on('stepChange', function(step) {
    stepper.setCurrent(step - 1);
    if (step > 1) {
        stepper.complete(step - 2);
    }
});

// Open wizard
document.getElementById('btn-create').addEventListener('click', function() {
    wizard.create();
});
```

### URL Hash Sync

```javascript
var stepper = Funky.Stepper.init('#multi-page-form', {
    steps: [
        { id: 'step1', label: 'Step 1' },
        { id: 'step2', label: 'Step 2' },
        { id: 'step3', label: 'Step 3' }
    ],
    hashSync: true,
    clickable: true,
    linear: false
});

// URL will update to #step-step1, #step-step2, etc.
// Navigating to URL with hash will auto-select step
```

---

## See Also

- [wizard.md](wizard.md) - Multi-step wizard component
- [form.md](form.md) - Form component
- [breadcrumb.md](breadcrumb.md) - Breadcrumb navigation
- [live-binding.md](../core/live-binding.md) - Reactive data binding
