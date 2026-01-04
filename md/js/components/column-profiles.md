# Funky.ColumnProfiles - Column Visibility Profiles

Save and load column visibility configurations for Funky.Table.

> See [Component Base Interface](../core/component-interface.md) for standard API patterns.

## Overview

`Funky.ColumnProfiles` allows users to save custom column visibility configurations as named profiles for Funky.Table, enabling quick switching between different views.

## API Reference

### Factory Methods

#### `Funky.ColumnProfiles.init(tableId)`

Create a column profiles manager.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableId | string | Yes | ID of the Funky.Table element |

### Instance Methods

#### `profiles.saveProfile(name)`

Save current column visibility as a profile.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Profile name |

**Example:**
```javascript
profiles.saveProfile('Minimal View');
```

---

#### `profiles.loadProfile(name)`

Load a saved profile.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Profile name |

---

#### `profiles.deleteProfile(name)`

Delete a saved profile.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Profile name |

---

#### `profiles.getAllProfiles()`

Get all saved profiles.

**Returns:** `Object` - Profile name → column config mapping

---

#### `profiles.showModal()`

Show the profiles management modal.

---

#### `profiles.resetToDefault()`

Reset columns to default visibility.

### Storage

Profiles are stored in localStorage with key `column_profiles`:
```javascript
{
  "tradesTable": {
    "Minimal View": [true, true, false, false, true, ...],
    "Full Details": [true, true, true, true, true, ...]
  }
}
```

## Dependencies

- jQuery
- Funky.Table
- `Funky.Storage`
- Bootstrap 5 (for modal)

## Examples

### Basic Setup

```javascript
var profiles = Funky.ColumnProfiles.init('tradesTable');

// Add profile button to table controls
$('#profilesBtn').on('click', function() {
  profiles.showModal();
});
```

### Quick Profile Switcher

```javascript
// Dropdown for quick switching
$('#profileSelect').on('change', function() {
  var profileName = $(this).val();
  if (profileName) {
    profiles.loadProfile(profileName);
  } else {
    profiles.resetToDefault();
  }
});
```

### Auto-Load Last Profile

```javascript
// Load last used profile on page load
var lastProfile = Funky.Storage.get('last_column_profile_' + tableId);
if (lastProfile) {
  profiles.loadProfile(lastProfile);
}

// Save on profile change
profiles.onProfileLoad = function(name) {
  Funky.Storage.set('last_column_profile_' + tableId, name);
};
```

---

## Bindable Interface (LiveBinding)

ColumnProfiles supports the LiveBinding system for reactive data updates.

### Instance Registry

```javascript
// Access instances by table ID
const instance = Funky.ColumnProfiles._instances['tradesTable'];
```

### Bindable Methods

#### `setData(profiles)`

Update the available profiles.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| profiles | object | Profile name → column visibility mapping |

**Example:**
```javascript
const profiles = Funky.ColumnProfiles._instances['tradesTable'];
profiles.setData({
  'Minimal View': [true, true, false, false, true],
  'Full Details': [true, true, true, true, true],
  'Export View': [true, false, true, true, false]
});
```

---

#### `getData()`

Get all saved profiles.

**Returns:** `Object` - Profile name → column visibility mapping

**Example:**
```javascript
const profiles = Funky.ColumnProfiles._instances['tradesTable'];
const allProfiles = profiles.getData();
console.log(Object.keys(allProfiles)); // ['Minimal View', 'Full Details', ...]
```

### LiveBinding Integration

```javascript
// Bind profiles to a data source
Funky.LiveBinding.bind({
  source: { type: 'api', endpoint: '/api/user/column_profiles' },
  target: {
    type: 'component',
    component: 'ColumnProfiles',
    instance: 'tradesTable'
  }
});

// Or bind to state for local management
Funky.LiveBinding.bind({
  source: { type: 'state', key: 'columnProfiles' },
  target: {
    type: 'component',
    component: 'ColumnProfiles',
    instance: 'tradesTable'
  }
});
```
