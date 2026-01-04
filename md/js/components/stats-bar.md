# Funky.StatsBar - Statistics Display Cards

Dynamic statistics bar with computed values and real-time updates.

## Overview

`Funky.StatsBar` displays a horizontal row of statistic cards. Each card shows a value with an icon and label. Supports automatic computation from data arrays and animated value updates.

## Registration

**File:** `public/assets/js/components/stats-bar.js`

Registered as `Funky.StatsBar` via the component registry.

## API Reference

### Methods

#### `StatsBar.init(selector, config)`

Initialize a stats bar in a container.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| selector | string | CSS selector for container |
| config.id | string | Unique identifier for this stats bar |
| config.stats | Array | Stat card configurations |

**Stat Configuration:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | - | Stat identifier (used in update) |
| icon | string | 'fa-chart-bar' | FontAwesome icon class |
| label | string | id | Display label |
| variant | string | 'secondary' | Bootstrap color variant |

**Returns:** Stats bar instance

**Example:**
```javascript
Funky.StatsBar.init('#stats-container', {
    id: 'clientStats',
    stats: [
        { id: 'total', icon: 'fa-users', label: 'Total Clients', variant: 'primary' },
        { id: 'active', icon: 'fa-check-circle', label: 'Active', variant: 'success' },
        { id: 'inactive', icon: 'fa-times-circle', label: 'Inactive', variant: 'secondary' },
        { id: 'value', icon: 'fa-dollar-sign', label: 'Total Value', variant: 'info' }
    ]
});
```

---

#### `StatsBar.update(id, values)`

Update stat values.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Stats bar identifier |
| values | object | Object mapping stat id to value |

**Example:**
```javascript
Funky.StatsBar.update('clientStats', {
    total: 150,
    active: 142,
    inactive: 8,
    value: 1250000
});
```

**Note:** Values are automatically formatted with locale-aware number formatting.

---

#### `StatsBar.compute(id, data, computations)`

Compute stats from a data array.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Stats bar identifier |
| data | Array | Data array to compute from |
| computations | Array | Computation definitions |

**Computation Types:**
| Type | Description | Required Fields |
|------|-------------|-----------------|
| `count` | Count total items | - |
| `countWhere` | Count items matching condition | `field`, `value` |
| `sum` | Sum of field values | `field` |
| `avg` | Average of field values | `field` |
| `min` | Minimum field value | `field` |
| `max` | Maximum field value | `field` |
| `custom` | Custom function | `fn(data)` |

**Example:**
```javascript
// After loading data
var clients = [...]; // Array of client objects

Funky.StatsBar.compute('clientStats', clients, [
    { id: 'total', compute: 'count' },
    { id: 'active', compute: 'countWhere', field: 'is_active', value: true },
    { id: 'inactive', compute: 'countWhere', field: 'is_active', value: false },
    { id: 'value', compute: 'sum', field: 'total_value' }
]);

// Custom computation
Funky.StatsBar.compute('tradeStats', trades, [
    { id: 'total', compute: 'count' },
    { 
        id: 'avgSize', 
        compute: 'custom', 
        fn: function(data) {
            var sum = data.reduce(function(s, t) { return s + t.quantity; }, 0);
            return Math.round(sum / data.length);
        }
    }
]);
```

---

#### `StatsBar.get(id)`

Get stats bar instance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Stats bar identifier |

**Returns:** Instance object or null

---

#### `StatsBar.getInstance(id)`

Get stats bar instance by ID (alias for `get`). Provides consistent API across all components.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Stats bar identifier |

**Returns:** Instance object or null

**Example:**
```javascript
var stats = Funky.StatsBar.getInstance('clientStats');
if (stats) {
    stats.update({ total: 100 });
}
```

---

#### `StatsBar.destroy(id)`

Remove stats bar and clean up.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Stats bar identifier |

**Example:**
```javascript
Funky.StatsBar.destroy('clientStats');
```

## Usage Examples

### Basic Stats Bar

```html
<div id="stats-container" class="mb-4"></div>
```

```javascript
Funky.StatsBar.init('#stats-container', {
    id: 'pageStats',
    stats: [
        { id: 'total', icon: 'fa-database', label: 'Total Records', variant: 'primary' },
        { id: 'today', icon: 'fa-calendar-day', label: 'Today', variant: 'success' }
    ]
});

// Update manually
Funky.StatsBar.update('pageStats', { total: 1234, today: 56 });
```

### With Funky.Table Integration

```javascript
// In Funky.Table drawCallback
new Funky.Table('#tradesTable', {
    ajax: '/api/trades',
    drawCallback: function(settings) {
        var data = this.api().data().toArray();
        Funky.StatsBar.compute('tradeStats', data, [
            { id: 'total', compute: 'count' },
            { id: 'active', compute: 'countWhere', field: 'is_active', value: true },
            { id: 'totalValue', compute: 'sum', field: 'trade_value' }
        ]);
    }
});
```

### With CRUD Controller

```javascript
Funky.CRUD.init({
    entity: 'client',
    statsSelector: '#clientStats',
    stats: [
        { id: 'total', icon: 'fa-users', label: 'Total', variant: 'primary', compute: 'count' },
        { id: 'active', icon: 'fa-check', label: 'Active', variant: 'success', 
          compute: 'countWhere', field: 'is_active', value: true }
    ],
    // ... other config
});
```

## Animation

When values change, the stat card briefly highlights with a flash animation:

```css
.stats-value-changed {
    animation: statsFlash 0.5s ease-out;
}

@keyframes statsFlash {
    0% { background-color: rgba(var(--bs-primary-rgb), 0.3); }
    100% { background-color: transparent; }
}
```

## Styling

### Default Card Structure

```html
<div class="col-auto">
    <div class="card border-0 shadow-sm stats-card stats-card-primary">
        <div class="card-body py-2 px-3">
            <div class="d-flex align-items-center">
                <div class="stats-icon bg-primary text-white rounded-circle me-2">
                    <i class="fas fa-users"></i>
                </div>
                <div>
                    <div class="stats-value fs-4 fw-bold" data-stat-id="total">150</div>
                    <div class="stats-label text-muted small">Total Clients</div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### Recommended CSS

```css
.stats-card {
    min-width: 140px;
}

.stats-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Format` (optional, for number formatting)
- Bootstrap 5 (for card styling)

## See Also

- [crud.md](crud.md) - CRUD controller with stats integration
- [table.md](table.md) - Funky.Table component

## Bindable Interface (LiveBinding)

StatsBar supports the LiveBinding system for reactive data updates.

### Instance Registry

Instances are stored in the internal registry and can be accessed via:

```javascript
// Access instance by container ID
var instance = Funky.StatsBar._instances[containerId];
```

### Bindable Methods

#### `setData(stats)`

Update the stats bar with new data. Accepts an array of stat objects.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| stats | Array | Array of stat objects with label, value, and optional trend |

**Stat Object:**
| Property | Type | Description |
|----------|------|-------------|
| label | string | Display label for the stat |
| value | number\|string | The stat value |
| trend | string | Optional trend indicator: 'up', 'down', or null |

**Example:**
```javascript
// Direct method call
var instance = Funky.StatsBar._instances['myStats'];
instance.setData([
    { label: 'Total Users', value: 1250, trend: 'up' },
    { label: 'Active', value: 1100, trend: 'up' },
    { label: 'Inactive', value: 150, trend: 'down' }
]);
```

### LiveBinding Integration

```javascript
// Bind to a data source
Funky.LiveBinding.bind({
    source: { type: 'websocket', channel: 'dashboard-stats' },
    target: {
        type: 'component',
        component: 'StatsBar',
        container: '#dashboardStats',
        method: 'setData'
    },
    transform: function(data) {
        return data.stats.map(function(s) {
            return {
                label: s.name,
                value: s.current,
                trend: s.current > s.previous ? 'up' : 'down'
            };
        });
    }
});
```
