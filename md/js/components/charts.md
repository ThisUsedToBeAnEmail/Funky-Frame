# Funky.Charts - Sparkline Charts

Lightweight SVG sparkline charts for inline data visualization and trend indicators.

## Overview

`Funky.Charts` creates mini sparkline charts using pure SVG. Perfect for stat cards, dashboard widgets, and inline trend indicators.

## API Reference

### Methods

#### `Charts.line(container, data, options)`

Create a line sparkline with optional fill.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | Element | Yes | Container element |
| data | number[] | Yes | Array of numeric values (min 2) |
| options | object | No | Sparkline options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| width | number | 80 | Chart width in pixels |
| height | number | 30 | Chart height in pixels |
| strokeWidth | number | 2 | Line stroke width |
| color | string | (auto) | Color class: 'positive', 'negative', 'neutral' |

**Example:**
```javascript
Funky.Charts.line(
  document.getElementById('trend'), 
  [10, 15, 12, 18, 22, 19, 25],
  { width: 100, height: 40 }
);
```

---

#### `Charts.bar(container, data, options)`

Create a bar sparkline.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | Element | Yes | Container element |
| data | number[] | Yes | Array of numeric values |
| options | object | No | Sparkline options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| width | number | 80 | Chart width |
| height | number | 30 | Chart height |
| gap | number | 2 | Gap between bars |
| color | string | (auto) | Color class |

**Example:**
```javascript
Funky.Charts.bar(
  document.getElementById('volume'),
  [5, 8, 3, 12, 7, 9, 4],
  { color: 'positive' }
);
```

---

#### `Charts.getTrend(data)`

Determine trend direction from data.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| data | number[] | Yes | Array of numeric values |

**Returns:** `string` - 'positive', 'negative', or 'neutral'

**Example:**
```javascript
Funky.Charts.getTrend([1, 2, 3, 4, 5]); // 'positive'
Funky.Charts.getTrend([5, 4, 3, 2, 1]); // 'negative'
Funky.Charts.getTrend([3, 3, 3, 3, 3]); // 'neutral'
```

## Auto-Initialization

Use data attributes for declarative sparklines:

```html
<!-- Line sparkline -->
<span data-sparkline="line" data-values="1,2,3,4,5"></span>

<!-- Bar sparkline with explicit color -->
<span data-sparkline="bar" data-values="5,4,3,2,1" data-color="negative"></span>

<!-- Custom size -->
<span data-sparkline="line" 
      data-values="10,15,12,18" 
      data-width="120" 
      data-height="40"></span>
```

## Color Classes

| Class | Use Case | Default Color |
|-------|----------|---------------|
| positive | Upward trend | Green |
| negative | Downward trend | Red |
| neutral | Flat trend | Gray |

Auto-detection compares first and last values:
- Last > First × 1.02 → positive
- Last < First × 0.98 → negative
- Otherwise → neutral

## Dependencies

None - uses pure SVG.

## Examples

### Dashboard Stat Card

```html
<div class="stat-card">
  <div class="stat-value">$1.2M</div>
  <div class="stat-label">Total Value</div>
  <div id="valueTrend" class="stat-sparkline"></div>
</div>

<script>
Funky.Charts.line(
  document.getElementById('valueTrend'),
  [980000, 1050000, 1100000, 1150000, 1200000],
  { width: 100, height: 25 }
);
</script>
```

### Dynamic Updates

```javascript
function updateTrendChart(elementId, endpoint) {
  Funky.Api.get(endpoint).then(function(response) {
    var data = response.data.map(function(d) { return d.value; });
    
    Funky.Charts.line(
      document.getElementById(elementId),
      data,
      { width: 80, height: 30 }
    );
  });
}
```

---

## Note: Bindable Interface

Charts is a **utility component** for rendering sparklines, not a stateful component. It doesn't implement the Bindable Interface because:

- It renders SVG directly into containers (no instance tracking)
- Each call to `line()` or `bar()` is independent
- For live-updating charts, simply re-call the render method

For reactive sparkline updates, use LiveBinding on the parent element:

```javascript
Funky.LiveBinding.bind('#stats-container', {
  source: 'websocket',
  channel: 'funky:stats:updates',
  render: function(data) {
    Funky.Charts.line(
      document.getElementById('trend'),
      data.values,
      { color: data.trend }
    );
  }
});
```
