# Funky.FormatBuilder - Visual Report Format Builder

Visual configuration builder for report header, content, and footer sections.

## Overview

`Funky.FormatBuilder` provides a drag-and-drop interface for configuring report formats with dynamic placeholders, column selection, and preview functionality.

## API Reference

### Factory Methods

#### `Funky.FormatBuilder.init(containerId)`

Create a format builder instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| containerId | string | Yes | ID of the container element |

**Returns:** `FormatBuilder` instance

---

#### `Funky.FormatBuilder.getInstance(containerId)`

Get existing instance by container ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| containerId | string | Yes | ID of the container element |

**Returns:** `FormatBuilder` instance or `undefined`

---

#### `Funky.FormatBuilder.destroy(containerId)`

Destroy instance by container ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| containerId | string | Yes | ID of the container element |

---

#### `Funky.FormatBuilder.destroyAll()`

Destroy all format builder instances.

### Instance Methods

#### `builder.getConfig()`

Get current configuration.

**Returns:** `Object` - Format configuration
```javascript
{
  header: { enabled: true, lines: [...] },
  content: { columns: [...] },
  footer: { enabled: true, lines: [...] }
}
```

---

#### `builder.loadConfig(config)`

Load an existing configuration.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| config | object | Yes | Format configuration |

---

#### `builder.fetchAvailableColumns(entityType)`

Load available columns for an entity type.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| entityType | string | Yes | Entity type (e.g., 'trade') |

**Returns:** `Promise<void>`

---

#### `builder.reset()`

Reset to default empty configuration.

---

#### `builder.validate()`

Validate current configuration.

**Returns:** `{ valid: boolean, errors: string[] }`

### Configuration Structure

#### Header/Footer Lines
```javascript
{
  enabled: true,
  format: 'text', // 'text' or 'csv'
  lines: [
    { text: 'Report generated on {{current_date}}' },
    { text: 'Total records: {{total_rows}}' }
  ]
}
```

#### Content Columns
```javascript
{
  columns: [
    {
      field: 'trade_ref',
      label: 'Trade Reference',
      format: 'text',
      width: 100
    },
    {
      field: 'quantity',
      label: 'Qty',
      format: 'number',
      alignment: 'right'
    }
  ]
}
```

### Available Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{current_date}}` | Current date | 2025-12-13 |
| `{{current_time}}` | Current time | 14:30:00 |
| `{{current_datetime}}` | Date and time | 2025-12-13 14:30:00 |
| `{{total_rows}}` | Row count | 150 |
| `{{client_name}}` | Client name | Acme Corp |
| `{{client_code}}` | Client code | ACME |
| `{{user_name}}` | Current user | John Doe |
| `{{user_email}}` | User email | john@example.com |

## Dependencies

- jQuery (optional, for DOM manipulation)
- `Funky.Api` - For loading columns

## Examples

### Basic Setup

```javascript
var builder = Funky.FormatBuilder.init('formatBuilderContainer');

// Load available columns
await builder.fetchAvailableColumns('trade');

// Load existing config
if (existingFormat) {
  builder.loadConfig(existingFormat.config);
}
```

### Save Configuration

```javascript
$('#saveFormatBtn').on('click', async function() {
  var validation = builder.validate();
  if (!validation.valid) {
    Funky.Toast.error(validation.errors.join(', '));
    return;
  }
  
  var config = builder.getConfig();
  await Funky.Api.post('/api/report_formats', {
    name: $('#formatName').val(),
    config: config
  });
  
  Funky.Toast.success('Format saved');
});
```

### Preview

```javascript
$('#previewBtn').on('click', async function() {
  var config = builder.getConfig();
  var response = await Funky.Api.post('/api/report_formats/preview', {
    config: config,
    sample_data: true
  });
  
  $('#previewArea').html(response.data.preview);
});
```
