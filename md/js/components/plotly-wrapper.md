# Funky.Plotly

Simple Plotly.js wrapper with automatic theming and one-liner chart creation.

## Overview

`Funky.Plotly` provides a simplified API for creating charts with Plotly.js. Automatically applies Funky theme colors and handles responsive sizing.

## Quick Start

```javascript
// Bar chart
Funky.Plotly.bar('#chart', [
  { x: 'Jan', y: 100 },
  { x: 'Feb', y: 200 },
  { x: 'Mar', y: 150 }
]);

// Line chart with options
Funky.Plotly.line('#chart', data, { title: 'Trend Analysis' });
```

## API Reference

### Chart Methods

#### `Funky.Plotly.bar(container, data, options)`

Create a bar chart.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string/Element | Yes | Container element |
| data | Array | Yes | Chart data |
| options | Object | No | Chart options |

**Example:**
```javascript
Funky.Plotly.bar('#chart', [
  { x: 'A', y: 10 },
  { x: 'B', y: 25 },
  { x: 'C', y: 15 }
], { title: 'Categories' });
```

---

#### `Funky.Plotly.line(container, data, options)`

Create a line chart.

```javascript
Funky.Plotly.line('#chart', [
  { x: 1, y: 10 },
  { x: 2, y: 25 },
  { x: 3, y: 15 }
]);
```

---

#### `Funky.Plotly.pie(container, data, options)`

Create a pie chart.

```javascript
Funky.Plotly.pie('#chart', [
  { label: 'A', value: 30 },
  { label: 'B', value: 50 },
  { label: 'C', value: 20 }
]);
```

---

#### `Funky.Plotly.scatter(container, data, options)`

Create a scatter plot.

---

#### `Funky.Plotly.area(container, data, options)`

Create an area chart.

---

#### `Funky.Plotly.heatmap(container, data, options)`

Create a heatmap.

---

#### `Funky.Plotly.gauge(container, value, options)`

Create a gauge chart for displaying a single metric.

```javascript
Funky.Plotly.gauge('#chart', 72, {
  gaugeTitle: 'Performance',
  suffix: '%',
  min: 0,
  max: 100,
  target: 80
});
```

---

#### `Funky.Plotly.donut(container, data, options)`

Create a donut chart (pie chart with hole).

```javascript
Funky.Plotly.donut('#chart', [
  { label: 'Category A', value: 40 },
  { label: 'Category B', value: 35 },
  { label: 'Category C', value: 25 }
]);
```

---

#### `Funky.Plotly.barh(container, data, options)`

Create a horizontal bar chart.

```javascript
Funky.Plotly.barh('#chart', [
  { x: 'Product A', y: 100 },
  { x: 'Product B', y: 85 },
  { x: 'Product C', y: 65 }
]);
```

---

#### `Funky.Plotly.combo(container, data, options)`

Create a combo chart with bars and lines.

```javascript
Funky.Plotly.combo('#chart', {
  categories: ['Jan', 'Feb', 'Mar', 'Apr'],
  bars: { name: 'Revenue', data: [100, 150, 120, 180] },
  line: { name: 'Growth %', data: [5, 8, 6, 12] }
});
```

---

### Instance Management

#### `Funky.Plotly.get(id)`

Get a chart instance by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Chart container ID |

**Returns:** Instance object or `null`

---

#### `Funky.Plotly.getInstance(id)`

Get a chart instance by ID (alias for `get`). Provides consistent API across all components.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Chart container ID |

**Returns:** Instance object or `null`

**Example:**
```javascript
var chart = Funky.Plotly.getInstance('salesChart');
if (chart) {
    Funky.Plotly.update('salesChart', newData);
}
```

---

#### `Funky.Plotly.update(id, data, options)`

Update an existing chart.

---

#### `Funky.Plotly.destroy(id)`

Remove a chart and clean up.

---

#### `Funky.Plotly.resize(id)`

Trigger resize for a chart.

---

#### `Funky.Plotly.resizeAll()`

Resize all charts (useful after layout changes).

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| title | string | `null` | Chart title |
| xTitle | string | `null` | X-axis title |
| yTitle | string | `null` | Y-axis title |
| margin | Object | Auto | Chart margins |
| responsive | boolean | `true` | Responsive sizing |
| modeBar | boolean | `'hover'` | Show mode bar |
| animate | boolean | `false` | Animate updates |

## Data Formats

### Simple Array

```javascript
// For single series
Funky.Plotly.line('#chart', [10, 20, 15, 30, 25]);
```

### X/Y Objects

```javascript
// For labeled data
Funky.Plotly.bar('#chart', [
  { x: 'Jan', y: 100 },
  { x: 'Feb', y: 200 }
]);
```

### Plotly Native

```javascript
// Full Plotly trace format
Funky.Plotly.line('#chart', [{
  x: [1, 2, 3],
  y: [10, 20, 15],
  name: 'Series A'
}]);
```

## Theming

Colors are automatically pulled from CSS variables:

| Variable | Usage |
|----------|-------|
| `--pro-primary` | Primary color |
| `--pro-success` | Success color |
| `--pro-warning` | Warning color |
| `--pro-danger` | Danger color |
| `--pro-text-primary` | Text color |
| `--pro-bg-primary` | Background |
| `--pro-border-color` | Grid lines |

### User Preferences

If `Funky.Preferences` is available, accent color preference is applied:

```javascript
// User sets accent color in preferences
Funky.Preferences.set('theme.accent_color', '#9b59b6');
// Charts will use this as primary color
```

## Multi-Series Charts

```javascript
Funky.Plotly.line('#chart', [
  { name: 'Sales', data: [100, 150, 200, 175] },
  { name: 'Costs', data: [80, 90, 110, 95] }
], { title: 'Comparison' });
```

## Event Handling

```javascript
var chart = Funky.Plotly.line('#chart', data);

// Listen for clicks
document.getElementById('chart').on('plotly_click', function(data) {
  console.log('Clicked:', data.points[0]);
});
```

## Responsive Behavior

Charts automatically resize with their container. For manual resize:

```javascript
// Resize specific chart
Funky.Plotly.resize('chart-id');

// Resize all charts (e.g., after sidebar toggle)
Funky.Plotly.resizeAll();
```

## Dependencies

- **Plotly.js** - Must be loaded before Funky.Plotly
- `Funky.Dom` - DOM manipulation
- `Funky.Preferences` - Optional, for accent color

## File Location

`/public/assets/js/components/plotly-wrapper.js`

## See Also

- [Plotly.js Documentation](https://plotly.com/javascript/)
- [Funky.DashboardGrid](dashboard-grid.md) - Use charts in widgets
