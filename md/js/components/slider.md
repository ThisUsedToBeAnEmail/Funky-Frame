# Funky.Slider - Dual-Handle Range Slider

Custom dual-handle range slider for numeric range filtering.

## Overview

`Funky.Slider` creates a dual-handle range slider component used primarily in `Funky.AdvancedFilter` for numeric range inputs.

## API Reference

### Factory Methods

#### `Funky.Slider.init(container, options)`

Initialize a range slider.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | Element | Yes | Container element |
| options | object | No | Configuration options |

**Returns:** `FunkySlider` instance

---

#### `Funky.Slider.getInstance(idOrElement)`

Get slider instance by ID or element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| idOrElement | string/Element | Yes | Container ID or element |

**Returns:** `FunkySlider` or `null`

---

#### `Funky.Slider.destroy(idOrElement)`

Destroy slider by ID or element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| idOrElement | string/Element | Yes | Container ID or element |

---

#### `Funky.Slider.destroyAll()`

Destroy all slider instances.

---

#### `Funky.Slider.getAll()`

Get all slider instances.

**Returns:** `Object` - Map of all instances keyed by container ID

---

#### `Funky.Slider.create(container, options)`

**Deprecated** - Use `init()` instead.

---

#### `Funky.Slider.setData(containerId, value)`

Set slider data by container ID (Bindable Interface).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| containerId | string | Yes | Container element ID |
| value | object/number | Yes | Value object {min, max} or single number |

**Returns:** `boolean` - True if successful

---

#### `Funky.Slider.getData(containerId)`

Get slider data by container ID (Bindable Interface).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| containerId | string | Yes | Container element ID |

**Returns:** `Object|null` - Current slider values or null

---

### Configuration Options

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| min | number | `0` | Minimum value |
| max | number | `1000000` | Maximum value |
| step | number | `1` | Step increment |
| minValue | number | `null` | Initial min handle position (defaults to `min`) |
| maxValue | number | `null` | Initial max handle position (defaults to `max`) |
| minLabel | string | `'Minimum value'` | ARIA label for min handle |
| maxLabel | string | `'Maximum value'` | ARIA label for max handle |
| formatValue | function | `toLocaleString` | Value formatter |
| onUpdate | function | `null` | Callback on value change |

### Instance Methods

#### `slider.getValues()`

Get current values.

**Returns:** `{ min: number, max: number }`

---

#### `slider.setValues(min, max)`

Set handle positions.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| min | number | Yes | Minimum value |
| max | number | Yes | Maximum value |

---

#### `slider.setData(value)`

Set slider data (Bindable Interface).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | object\|number | Yes | Value object {min, max} or single number |

---

#### `slider.getData()`

Get slider data (Bindable Interface).

**Returns:** `{ min: number, max: number }`

---

#### `slider.update()`

Refresh the slider display. Call after programmatically changing values.

---

#### `slider.destroy()`

Remove slider and cleanup.

## Callback

The `onUpdate` callback receives:
```javascript
function onUpdate(values) {
  // values.min - Current minimum
  // values.max - Current maximum
}
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-slider` | Container |
| `.funky-slider-track` | Track background |
| `.funky-slider-range` | Selected range highlight |
| `.funky-slider-handle` | Draggable handles |
| `.funky-slider-handle-min` | Minimum handle |
| `.funky-slider-handle-max` | Maximum handle |
| `.funky-slider-labels` | Value labels |

## Dependencies

None - pure JavaScript with touch support.

## Examples

### Basic Range Slider

```javascript
var slider = Funky.Slider.init(document.getElementById('priceRange'), {
  min: 0,
  max: 1000000,
  step: 1000,
  formatValue: function(val) {
    return '$' + val.toLocaleString();
  },
  onUpdate: function(values) {
    console.log('Range:', values.min, '-', values.max);
  }
});
```

### With Initial Values

```javascript
var slider = Funky.Slider.init(container, {
  min: 0,
  max: 100,
  minValue: 25,
  maxValue: 75,
  onUpdate: updateFilter
});
```

### Get Values for Filter

```javascript
$('#applyFilter').on('click', function() {
  var range = slider.getValues();
  
  filterParams.quantity_min = range.min;
  filterParams.quantity_max = range.max;
  
  dataTable.ajax.reload();
});
```

### Percentage Formatting

```javascript
var slider = Funky.Slider.init(container, {
  min: 0,
  max: 100,
  step: 1,
  formatValue: function(val) {
    return val + '%';
  }
});
```

## Bindable Interface (LiveBinding)

Slider supports the LiveBinding system for reactive data updates.

### Instance Registry

Instances are stored in the internal registry and can be accessed via:

```javascript
// Access instance by container ID
var instance = Funky.Slider._instances[containerId];
```

### Bindable Methods

#### `setData(value)`

Set the slider value(s). For dual-handle sliders, pass an object with min/max.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| value | number\|object | Single value or { min, max } for range sliders |

**Example:**
```javascript
// Direct method call - single value
var instance = Funky.Slider._instances['volumeSlider'];
instance.setData(75);

// Range slider
var rangeInstance = Funky.Slider._instances['priceRange'];
rangeInstance.setData({ min: 1000, max: 5000 });
```

---

#### `getData()`

Get the current slider value(s).

**Returns:** `number | { min: number, max: number }`

**Example:**
```javascript
var instance = Funky.Slider._instances['priceRange'];
var range = instance.getData();
console.log('Min:', range.min, 'Max:', range.max);
```

### LiveBinding Integration

```javascript
// Bind slider to state
Funky.LiveBinding.bind({
    source: { type: 'state', key: 'filters.priceRange' },
    target: {
        type: 'component',
        component: 'Slider',
        container: '#priceRangeSlider',
        method: 'setData'
    }
});

// Two-way binding with filter state
Funky.LiveBinding.bind({
    source: { type: 'state', key: 'filters.quantity' },
    target: {
        type: 'component',
        component: 'Slider',
        container: '#quantitySlider',
        method: 'setData'
    },
    twoWay: true,
    events: ['change']
});
```

### Syncing Multiple Sliders

```javascript
// Sync slider with external data source
Funky.LiveBinding.bind({
    source: { type: 'websocket', channel: 'market-data' },
    target: {
        type: 'component',
        component: 'Slider',
        container: '#priceRangeSlider',
        method: 'setData'
    },
    transform: function(data) {
        return {
            min: data.lowPrice,
            max: data.highPrice
        };
    }
});
```
