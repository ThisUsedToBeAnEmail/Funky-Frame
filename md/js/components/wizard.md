# Funky.Wizard - Multi-step Modal Wizard

Flexible wizard system for complex multi-step forms with various editor types and state management.

## Overview

`Funky.Wizard` provides a configurable multi-step wizard for complex form workflows. Supports Funky.Form, ACE code editors, checkbox lists, and custom step types.

**Key Features:**
- Multiple step types: Form, ACE Editor, Checkboxes, Custom
- Schema loading from OpenAPI spec via `schemaPath` or direct `schema`
- Dynamic schema enhancement with `enhanceSchema` callback
- Create/Edit modes with state management

## Registration

**File:** `public/assets/js/components/wizard.js`

Registered as `Funky.Wizard` via the component registry.

## API Reference

### Factory Methods

#### `Funky.Wizard.init(config)`

Initialize a new wizard instance.

**Config Options:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| modalId | string | Yes | ID of the modal element |
| title | string | No | Wizard title |
| steps | array | Yes | Array of step configurations |
| onSave | function | Yes | Callback when wizard completes |
| onCancel | function | No | Callback when wizard is cancelled |

**Returns:** `FunkyWizard` - Wizard instance

---

#### `Funky.Wizard.getInstance(id)`

Get wizard instance by modal ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Modal ID |

**Returns:** `FunkyWizard` or null

---

#### `Funky.Wizard.destroy(id)`

Destroy wizard by modal ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Modal ID |

---

#### `Funky.Wizard.destroyAll()`

Destroy all wizard instances.

---

#### `Funky.Wizard.getAll()`

Get all wizard instances.

**Returns:** Object with instance IDs as keys

---

### Step Types

#### Form Step (Native Funky.Form)

Use `type: 'form'` for native Funky.Form rendering. Provides better accessibility and consistent Funky ecosystem styling.

**With native schema (recommended):**
```javascript
{
  type: 'form',
  stateKey: 'details',
  title: 'Trade Details',
  schema: {
    fields: {
      trade_ref: { type: 'text', label: 'Trade Reference', required: true },
      quantity: { type: 'number', label: 'Quantity', min: 0 },
      trade_type: {
        type: 'select',
        label: 'Trade Type',
        options: [
          { value: 'buy', label: 'Buy' },
          { value: 'sell', label: 'Sell' }
        ]
      }
    },
    layout: {
      type: 'columns',
      columns: 2
    }
  }
}
```

**With schemaPath (OpenAPI auto-conversion):**
```javascript
{
  type: 'form',
  stateKey: 'options',
  title: 'Trade Options',
  schemaPath: 'TradeOptions',  // Auto-converts via Funky.SchemaAdapter
  enhanceSchema: function(schema, state) {
    // Add conditional fields based on previous step
    if (state.details && state.details.trade_type === 'sell') {
      schema.fields.sellReason = { type: 'text', label: 'Reason for Sale' };
    }
    return schema;
  }
}
```

**Form Step Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | - | Must be `'form'` |
| stateKey | string | - | Key to store data in wizard state |
| schema | object | - | Native Funky.Form schema |
| schemaPath | string | - | Load schema from Funky.Schema |
| enhanceSchema | function | - | Transform schema before rendering |
| getStartValue | function | - | Get initial values from state |
| defaultValue | object | {} | Default initial values |
| validateOnChange | boolean | true | Validate fields on change |
| validateOnBlur | boolean | true | Validate fields on blur |
| disabled | boolean | false | Disable all form fields |
| containerId | string | auto | Custom container element ID |

**Form Step Features:**
- Layout support (sections, columns, grid, tabs)
- Field dependencies via `dependsOn`
- Better accessibility with native ARIA
- Consistent theming via CSS variables
- LiveBinding ready

#### ACE Editor Step

```javascript
{
  type: 'ace',
  stateKey: 'query',
  title: 'SQL Query',
  mode: 'sql',
  defaultValue: 'SELECT * FROM trades'
}
```

#### Checkboxes Step

```javascript
{
  type: 'checkboxes',
  stateKey: 'selectedClients',
  title: 'Select Clients',
  getOptions: function(callback) {
    Funky.Api.get('/api/clients').then(function(response) {
      var options = [];
      for (var i = 0; i < response.data.length; i++) {
        var c = response.data[i];
        options.push({ id: c.id, label: c.name });
      }
      callback(options);
    });
  }
}
```

#### Custom Step

```javascript
{
  type: 'custom',
  stateKey: 'review',
  title: 'Review',
  render: function(container, state) {
    container.innerHTML = '<pre>' + JSON.stringify(state, null, 2) + '</pre>';
  },
  validate: function(state) {
    return { valid: true };
  }
}
```

### Instance Methods

#### `wizard.create()`

Open wizard in create mode.

**Example:**
```javascript
wizard.create();
```

---

#### `wizard.edit(data)`

Open wizard in edit mode with existing data.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| data | object | Yes | Existing data to populate |

**Example:**
```javascript
Funky.Api.get('/api/trades/' + id).then(function(trade) {
  wizard.edit(trade.data);
});
```

---

#### `wizard.getState()`

Get current wizard state.

**Returns:** `Object` - Current state across all steps

---


#### `wizard.reset()`

Reset wizard to initial state.

---

#### `wizard.destroy()`

Destroy the wizard instance and clean up resources (editors, modal, state).

---

#### `wizard.next()`

Navigate to the next step. Validates current step before proceeding.

**Example:**
```javascript
wizard.next(); // Validates current step, then moves forward
```

---

#### `wizard.previous()`

Navigate to the previous step.

**Example:**
```javascript
wizard.previous();
```

---

#### `wizard.save()`

Save the wizard. Validates all steps, saves state, and calls the `onSave` callback.

**Returns:** `Promise`

**Example:**
```javascript
wizard.save().then(function() {
  console.log('Wizard completed');
});
```

---

#### `wizard.destroy()`

Destroy the wizard instance and unregister from the instance registry.

**Example:**
```javascript
wizard.destroy();
```

---

### Static Methods

#### `Funky.Wizard.getInstance(modalId)`

Get a wizard instance by its modal ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| modalId | string | Yes | The modal element ID |

**Returns:** `FunkyWizard|undefined`

**Example:**
```javascript
var wizard = Funky.Wizard.getInstance('tradeWizardModal');
if (wizard) {
  wizard.destroy();
}
```

---

## Per-Step Callbacks

Each step can define lifecycle callbacks:

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onInit` | `(wizard, stepNum, stepConfig)` | Called when step initializes |
| `onSave` | `(state, editor)` | Called when saving step data |
| `validate` | `(state, editor)` | Custom validation, return `{ valid, errors }` |
| `getStartValue` | `(state)` | Get initial values from wizard state |

**Example:**
```javascript
{
  type: 'custom',
  stateKey: 'review',
  title: 'Review',
  onInit: function(wizard, stepNum, config) {
    console.log('Initializing step', stepNum);
  },
  onSave: function(state, editor) {
    // Transform data before saving
    return { confirmed: true, timestamp: Date.now() };
  },
  validate: function(state, editor) {
    if (!state.confirmed) {
      return { valid: false, errors: ['Please confirm the details'] };
    }
    return { valid: true };
  }
}
```

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Modal` (modal.js) - required
- `Funky.Schema` (schema.js) - for schemaPath loading (optional)
- `Funky.Form` (form.js) - for form steps (required)
- `Funky.SchemaAdapter` (schema-adapter.js) - for OpenAPI conversion (optional)
- Bootstrap 5 (for modal)
- ACE Editor (for ace steps)

## See Also

- [form.md](form.md) - Native Funky.Form component
- [schema.md](schema.md) - Schema management and enhancement
- [form-modal.md](form-modal.md) - Form modal component

## Examples

### Trade Creation Wizard

```javascript
var tradeWizard = Funky.Wizard.create({
  modalId: 'tradeWizardModal',
  title: 'Create Trade',
  steps: [
    {
      type: 'form',
      stateKey: 'trade',
      title: 'Trade Details',
      schemaPath: 'CreateTrade'
    },
    {
      type: 'checkboxes',
      stateKey: 'allocations',
      title: 'Select Allocations',
      getOptions: fetchAllocations
    },
    {
      type: 'custom',
      stateKey: 'review',
      title: 'Review & Confirm',
      render: renderReviewStep
    }
  ],
  onSave: function(state, mode) {
    var endpoint = mode === 'create' ? '/api/trades' : '/api/trades/' + state.id;
    var method = mode === 'create' ? 'post' : 'put';

    return Funky.Api[method](endpoint, state.trade).then(function() {
      Funky.Toast.success('Trade ' + (mode === 'create' ? 'created' : 'updated'));
    });
  }
});

// Open in create mode
$('#newTradeBtn').on('click', function() { tradeWizard.create(); });

// Open in edit mode
$('#editTradeBtn').on('click', function() {
  Funky.Api.get('/api/trades/' + tradeId).then(function(trade) {
    tradeWizard.edit(trade.data);
  });
});
```

### Wizard with Form Steps

```javascript
var wizard = Funky.Wizard.create({
  modalId: 'clientWizardModal',
  title: 'Client Onboarding',
  steps: [
    // Step 1: Form step with native schema
    {
      type: 'form',
      stateKey: 'basic',
      title: 'Basic Information',
      schema: {
        fields: {
          name: { type: 'text', label: 'Client Name', required: true },
          email: { type: 'email', label: 'Email Address', required: true },
          phone: { type: 'tel', label: 'Phone Number' },
          type: {
            type: 'select',
            label: 'Client Type',
            options: [
              { value: 'corporate', label: 'Corporate' },
              { value: 'individual', label: 'Individual' }
            ],
            required: true
          }
        },
        layout: { type: 'columns', columns: 2 }
      }
    },
    // Step 2: Form step with conditional fields
    {
      type: 'form',
      stateKey: 'details',
      title: 'Additional Details',
      schema: {
        fields: {
          address: { type: 'textarea', label: 'Address', rows: 3 },
          notes: { type: 'textarea', label: 'Notes' }
        }
      },
      enhanceSchema: function(schema, state) {
        // Add corporate-specific fields
        if (state.basic && state.basic.type === 'corporate') {
          schema.fields.company_reg = { type: 'text', label: 'Company Registration' };
          schema.fields.vat_number = { type: 'text', label: 'VAT Number' };
        }
        return schema;
      }
    },
    // Step 3: Traditional checkboxes
    {
      type: 'checkboxes',
      stateKey: 'services',
      title: 'Select Services',
      getOptions: function(state) {
        return [
          { value: 'trading', label: 'Trading Services' },
          { value: 'advisory', label: 'Advisory Services' },
          { value: 'custody', label: 'Custody Services' }
        ];
      }
    }
  ],
  onSave: function(state, mode) {
    return Funky.Api.post('/api/clients', state);
  }
});
```

---

## Bindable Interface (LiveBinding)

`Funky.Wizard` implements the bindable interface, allowing it to be used as a target for LiveBinding data sources. This enables automatic wizard state population from WebSocket updates, API responses, or other reactive data sources.

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setData(data)` | `data: Object` | Sets the wizard state across all steps. The data object keys should match the `stateKey` values defined in each step configuration. |
| `getData()` | - | Returns the complete wizard state as an object, with keys matching each step's `stateKey`. |

### Instance Registry

Wizard instances are registered in `Funky.Wizard._instances[modalId]` upon creation. This allows LiveBinding adapters to locate and bind to specific wizard instances.

### Usage with LiveBinding

```javascript
// Create the wizard
var tradeWizard = Funky.Wizard.create({
    modalId: 'tradeWizardModal',
    title: 'Create Trade',
    steps: [
        { type: 'form', stateKey: 'details', title: 'Trade Details', schemaPath: 'CreateTrade' },
        { type: 'checkboxes', stateKey: 'allocations', title: 'Allocations' }
    ],
    onSave: handleSave
});

// Bind to a WebSocket data source
Funky.LiveBinding.bind({
    source: {
        type: 'websocket',
        channel: 'trade:draft:456'
    },
    target: {
        type: 'component',
        component: 'Wizard',
        instance: 'tradeWizardModal'
    },
    transform: function(data) {
        return {
            details: data.tradeDetails,
            allocations: data.selectedAllocations
        };
    }
});

// Manual instance access
var instance = Funky.Wizard._instances['tradeWizardModal'];
instance.setData({ details: { trade_ref: 'TR-001' }, allocations: [1, 2, 3] });
var currentState = instance.getData();
```
