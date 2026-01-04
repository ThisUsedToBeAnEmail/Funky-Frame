# Funky.TradeWizard

Multi-step wizard for creating trades with client relationships, templates, and related trade support.

## Overview

`Funky.TradeWizard` provides a specialized 4-step wizard for trade creation with:
- Client and relationship selection
- Trade template configuration
- Related/counterparty trade creation
- Dynamic template-specific fields
- Side-by-side summary comparison
- Screen reader announcements
- Bindable interface for LiveBinding

## Quick Start

```javascript
// Create instance and open wizard
var wizard = Funky.TradeWizard.init();
wizard.create();

// Or via global instance
window.tradeWizard.create();
```

## API Reference

### Factory Methods

#### `Funky.TradeWizard.init(modalId)`

Create a new TradeWizard instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| modalId | string | No | Modal ID for instance registration (default: `'tradeWizardModal'`) |

**Returns:** `TradeWizard` instance

---

#### `Funky.TradeWizard.getInstance(id)`

Get wizard instance by modal ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | The modal ID |

**Returns:** `TradeWizard` or `undefined`

---

#### `Funky.TradeWizard.destroy(id)`

Destroy instance by modal ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | The modal ID |

---

#### `Funky.TradeWizard.destroyAll()`

Destroy all wizard instances.

---

### Instance Methods

#### `create()`

Open the wizard to create a new trade. Loads clients, templates, and securities data before showing.

```javascript
wizard.create();
```

---

#### `destroy()`

Destroy the wizard instance and clean up.

```javascript
wizard.destroy();
```

---

#### `setData(data)`

Set wizard data / populate fields (Bindable Interface).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| data | object | Yes | Data object with trade wizard field values |

```javascript
wizard.setData({
  client_id: 1,
  template_id: 5,
  trade_name: 'Sample Trade'
});
```

---

#### `getData()`

Get collected trade wizard data (Bindable Interface).

**Returns:** `object` - All collected trade data including:
- All state values
- `_selectedTemplate` - Selected template info
- `_selectedRelatedTemplate` - Related template info
- `_client` - Selected client info
- `_security` - Selected security info

```javascript
var data = wizard.getData();
// {
//   client_id: 1,
//   template_id: 5,
//   trade_name: 'My Trade',
//   _client: { id: 1, name: 'Acme Corp', code: 'ACME' },
//   ...
// }
```

---

### Wizard Steps

| Step | Name | Description |
|------|------|-------------|
| 1 | Basic Options | Select client, template, security, and relationships |
| 2 | Trade Details | Enter contract ID, trade name, dates, and template fields |
| 3 | Related Trade Details | Configure counterparty trade (if relationship selected) |
| 4 | Summary | Review all trades before submission |

---

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| client_id | number | Selected client ID |
| template_id | number | Selected trade template ID |
| security_id | number | Selected security ID |
| client_relationship_id | number | Selected relationship ID (optional) |
| related_client_id | number | Related client ID from relationship |
| counterparty_client_relationship_id | number | Counterparty relationship ID |
| counterparty_related_client_id | number | Counterparty's related client ID |
| related_template_id | number | Template for related trade |
| contract_id | string | Trade contract identifier |
| trade_name | string | Trade name |
| trade_description | string | Trade description |
| trade_start_date | string | Trade start date (YYYY-MM-DD) |
| trade_end_date | string | Trade end date (YYYY-MM-DD) |
| trade_fields | object | Template-specific field values |
| related_contract_id | string | Related trade contract ID |
| related_trade_name | string | Related trade name |
| related_trade_description | string | Related trade description |
| related_trade_start_date | string | Related trade start date |
| related_trade_end_date | string | Related trade end date |
| related_trade_fields | object | Related trade template fields |

---

## Events

### DOM Events

| Event | Target | Description |
|-------|--------|-------------|
| `funky.modal.hidden` | Modal element | Wizard closed, state reset |
| `funky.spa.pageload` | document | SPA navigation, reinitialize if on trades page |

### PubSub Events

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:trade:created` | `{ trade }` | Trade created successfully |
| `funky:trade:updated` | `{ trade }` | Trade updated successfully |

---

## Examples

### Basic Trade Creation

```javascript
// Initialize instance and open wizard
var wizard = Funky.TradeWizard.init();
wizard.create();

// Or use the auto-initialized global instance
window.tradeWizard.create();
```

### Button Click Handler

```html
<button onclick="window.tradeWizard.create()">New Trade</button>
```

### Listen for Trade Creation

```javascript
Funky.PubSub.on('funky:trade:created', function(data) {
  Funky.Toast.success('Trade created: ' + data.trade.trade_ref);
  tradesTable.ajax.reload();
});
```

### Pre-populate Wizard Data

```javascript
var wizard = Funky.TradeWizard.init();
wizard.setData({
  client_id: 123,
  template_id: 5,
  trade_name: 'Pre-filled Trade'
});
wizard.create();
```

### Get Current State

```javascript
var data = window.tradeWizard.getData();
console.log('Current client:', data._client);
console.log('Trade details:', data.trade_name, data.trade_fields);
```

---

## Bindable Interface (LiveBinding)

`Funky.TradeWizard` implements the bindable interface for use with LiveBinding.

### Instance Registry

Instances are registered in `Funky.TradeWizard._instances[modalId]` upon initialization.

### Usage with LiveBinding

```javascript
// Bind to a WebSocket data source for collaborative editing
Funky.LiveBinding.bind({
  source: {
    type: 'websocket',
    channel: 'trade:draft:789'
  },
  target: {
    type: 'component',
    component: 'TradeWizard',
    instance: 'tradeWizardModal'
  },
  transform: function(data) {
    return {
      client_id: data.selectedClient,
      template_id: data.templateId,
      trade_name: data.tradeName
    };
  }
});

// Manual instance access
var instance = Funky.TradeWizard.getInstance('tradeWizardModal');
instance.setData({
  client_id: 1,
  trade_name: 'Updated Trade'
});
```

---

## Accessibility

- Steps use `aria-current="step"` for current step
- Step changes announced via `Funky.Announce.polite()`
- Validation errors announced via `Funky.Announce.assertive()`
- Form fields have proper labels and required indicators
- Keyboard navigation through wizard buttons

---

## Required HTML Structure

The wizard expects a modal with ID `tradeWizardModal`:

```html
<div class="modal" id="tradeWizardModal">
  <div class="wizard-steps">
    <div class="wizard-step">1</div>
    <div class="wizard-step">2</div>
    <div class="wizard-step">3</div>
    <div class="wizard-step">4</div>
  </div>
  <div id="wizardStepContent"></div>
  <div class="wizard-buttons">
    <button class="wizard-btn-prev">Previous</button>
    <button class="wizard-btn-next">Next</button>
    <button class="wizard-btn-save">Create Trade</button>
  </div>
</div>
```

---

## API Endpoints

The wizard communicates with these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clients` | GET | Load available clients |
| `/api/trade_templates` | GET | Load trade templates |
| `/api/securities` | GET | Load securities |
| `/api/client_relationships` | GET | Load client relationships |
| `/api/trade_templates/:id/fields` | GET | Load template clear_fields |
| `/api/trades/wizard` | POST | Submit trade creation |

---

## Dependencies

- **Required:** `Funky.Dom`, `Funky.Modal`, `Funky.Api`, `Funky.CSRF`
- **Optional:** `Funky.Toast` (notifications), `Funky.Announce` (accessibility), `Funky.PubSub` (events)

---

## File Location

`/public/assets/js/components/trade-wizard.js`
