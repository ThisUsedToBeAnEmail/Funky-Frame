# Funky.Diff

Visual diff viewer for comparing text, JSON, or audit trail changes.

## Overview

`Funky.Diff` provides a side-by-side or inline diff viewer with syntax highlighting for changes. Supports text comparison, JSON diffing, and integration with audit trails.

## Quick Start

```javascript
// Show text diff
var viewer = Funky.Diff.show('#container', {
  left: 'Original text here',
  right: 'Modified text here',
  mode: 'side-by-side'
});

// Compare JSON objects
Funky.Diff.json('#container', originalObj, modifiedObj);

// Show audit trail changes
Funky.Diff.audit('#container', auditChanges);
```

## API Reference

### Factory Methods

#### `Funky.Diff.show(container, options)`

Show a text diff in a container.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| container | string/Element | Container element or selector |
| options | object | Diff options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| left | string | `''` | Original text |
| right | string | `''` | Modified text |
| mode | string | `'side-by-side'` | `'side-by-side'`, `'inline'`, or `'split'` |
| lineNumbers | boolean | `true` | Show line numbers |
| wordDiff | boolean | `true` | Highlight word-level changes |
| collapseUnchanged | number | `0` | Lines of context before collapsing (0 = don't collapse) |
| headers | object | `{left: 'Original', right: 'Modified'}` | Column headers |
| onLineClick | function | `null` | Callback when line clicked |

**Returns:** Diff instance with `update()`, `getStats()`, `destroy()` methods

---

#### `Funky.Diff.json(container, left, right, options)`

Compare two JSON objects visually.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| collapsible | boolean | `true` | Allow collapsing nested objects |
| expandDepth | number | `2` | Initial expand depth |
| highlightChanges | boolean | `true` | Highlight changed values |
| showUnchanged | boolean | `true` | Show unchanged properties |
| keyOrder | string | `'original'` | Key ordering mode |
| headers | object | `{left: 'Before', right: 'After'}` | Column headers |

```javascript
Funky.Diff.json('#diff', { name: 'Old' }, { name: 'New' });
```

---

#### `Funky.Diff.audit(container, changes, options)`

Render audit trail changes.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| hideUnchanged | boolean | `false` | Hide unchanged fields |
| labels | object | `{}` | Field name labels |
| showMeta | boolean | `true` | Show metadata (user, timestamp) |
| headers | object | `{left: 'Before', right: 'After'}` | Column headers |
| renderers | object | `null` | Custom field renderers |

```javascript
Funky.Diff.audit('#diff', auditChanges);
```

---

#### `Funky.Diff.compute(left, right)`

Compute text diff without rendering.

**Returns:** `Array` of diff operations

---

#### `Funky.Diff.computeJson(left, right)`

Compute JSON diff without rendering.

**Returns:** `Array` of JSON diff operations

---

#### `Funky.Diff.getSummary(diff)`

Get change statistics from a diff result.

**Returns:** `{ additions, deletions, changes }`

---

### Instance Methods

After calling `show()`, `json()`, or `audit()`:

#### `update(left, right)`

Update diff content.

---

#### `getStats()`

Get diff statistics.

**Returns:** `{ additions, deletions, changes }`

---

#### `destroy()`

Clean up the viewer.

---

## Diff Types

The diff engine identifies four operation types:

| Type | Description |
|------|-------------|
| `equal` | Lines match in both versions |
| `add` | Line added in right version |
| `remove` | Line removed from left version |
| `change` | Line modified (includes word diff) |

## View Modes

### Split Mode

Shows left and right versions side-by-side:

```javascript
Funky.Diff.create('#diff', {
  mode: 'split',
  left: originalText,
  right: modifiedText
});
```

### Unified Mode

Shows changes inline with context:

```javascript
Funky.Diff.create('#diff', {
  mode: 'unified',
  left: originalText,
  right: modifiedText
});
```

## Word-Level Highlighting

When `wordDiff: true`, changed lines show word-level differences:

```javascript
// Original: "The quick brown fox"
// Modified: "The slow brown dog"
// Result: "quick" highlighted as removed, "slow" as added
//         "fox" highlighted as removed, "dog" as added
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.diff-viewer` | Main container |
| `.diff-viewer--split` | Split mode |
| `.diff-viewer--unified` | Unified mode |
| `.diff-line` | Single line |
| `.diff-line--equal` | Unchanged line |
| `.diff-line--add` | Added line |
| `.diff-line--remove` | Removed line |
| `.diff-line--change` | Changed line |
| `.diff-word--add` | Added word |
| `.diff-word--remove` | Removed word |
| `.diff-gutter` | Line number gutter |

## Usage Patterns

### File Comparison

```javascript
var viewer = Funky.Diff.create('#diff-container', {
  left: originalFileContent,
  right: modifiedFileContent,
  syntax: 'javascript',
  lineNumbers: true
});
```

### Configuration Comparison

```javascript
var oldConfig = { debug: false, maxItems: 100 };
var newConfig = { debug: true, maxItems: 150, newOption: 'value' };

Funky.Diff.json('#config-diff', oldConfig, newConfig);
```

### Audit Trail Display

```javascript
// From audit endpoint
var changes = [
  { field: 'name', old: 'John', new: 'Jonathan' },
  { field: 'status', old: 'active', new: 'inactive' }
];

Funky.Diff.audit('#audit-viewer', changes);
```

## Diff Engine

The diff engine uses LCS (Longest Common Subsequence) algorithm:

```javascript
// Direct access to diff engine
var result = Funky.Diff.engine.diff(leftLines, rightLines);
// Returns array of { type, left, right, leftLine, rightLine }
```

## File Location

`/public/assets/js/components/diff.js`

## See Also

- [Funky.Playground](playground.md) - Component testing with code display
