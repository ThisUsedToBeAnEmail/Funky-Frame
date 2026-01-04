# Funky Framework Accessibility Standards

**Version:** 1.0.0
**Last Updated:** 2025-01-24
**WCAG Compliance Target:** Level AA (with AAA where feasible)

---

## Philosophy

> "From here on out we're all semantic if that is the best approach with WCAG"

The Funky Framework prioritizes **semantic HTML over ARIA** whenever possible. This document establishes the standards all developers must follow to ensure WCAG 2.1 Level AA compliance.

---

## The First Rule of ARIA

**If you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so.**

### Good: Semantic HTML
```html
<button type="button">Click me</button>
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>
```

### Bad: Unnecessary ARIA
```html
<div role="button" tabindex="0">Click me</div>
<div role="navigation">
  <div role="list">
    <div role="listitem"><span role="link">Home</span></div>
  </div>
</div>
```

---

## Content Standards

### 1. Images and Diagrams

#### ASCII Diagrams / Flow Charts

**NEVER use `role="img"` on elements containing text content.** This blocks screen readers from reading the content.

**❌ Wrong:**
```html
<div class="splash-diagram" role="img" aria-label="Diagram showing...">
  Step 1 → Step 2 → Step 3
</div>
```

**✅ Correct:**
```html
<figure class="splash-diagram">
  <figcaption class="visually-hidden">Diagram showing the process from Step 1 to Step 3</figcaption>
  <pre>Step 1 → Step 2 → Step 3</pre>
</figure>
```

**Why:**
- `<figure>` provides semantic grouping
- `<figcaption>` gives context (visually hidden if redundant)
- `<pre>` preserves ASCII formatting and is fully readable by screen readers
- No `role="img"` blocking content access

#### Images

**Always provide meaningful alt text:**

```html
<!-- Informative image -->
<img src="chart.png" alt="Sales revenue increased 40% in Q4 2024">

<!-- Decorative image -->
<img src="decoration.png" alt="">

<!-- Complex image -->
<figure>
  <img src="architecture.png" alt="System architecture diagram">
  <figcaption>
    The system consists of three layers: client (browser),
    API (REST + WebSocket), and database (PostgreSQL).
  </figcaption>
</figure>
```

---

### 2. Tables

**Always use semantic table structure with proper headers.**

**❌ Wrong:**
```html
<table>
  <tr>
    <td><strong>Name</strong></td>
    <td><strong>Status</strong></td>
  </tr>
  <tr>
    <td>Item 1</td>
    <td>Active</td>
  </tr>
</table>
```

**✅ Correct:**
```html
<table>
  <caption>User Status List</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Item 1</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>
```

**Complex tables with row headers:**
```html
<table>
  <caption>Feature Comparison</caption>
  <thead>
    <tr>
      <th scope="col">Feature</th>
      <th scope="col">PWA</th>
      <th scope="col">SPA</th>
      <th scope="col">PSPWA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Offline support</th>
      <td>✓</td>
      <td>✗</td>
      <td>✓</td>
    </tr>
  </tbody>
</table>
```

---

### 3. Forms

**Every form input must have an associated label.**

**❌ Wrong:**
```html
<input type="text" placeholder="Enter your name">
```

**✅ Correct:**
```html
<!-- Visible label -->
<label for="username">Username</label>
<input type="text" id="username" name="username">

<!-- Or with aria-label -->
<input type="search" aria-label="Search documentation" placeholder="Search...">
```

#### Form Validation Errors

**Link errors to fields using `aria-describedby` and `aria-invalid`.**

```html
<label for="email">Email address</label>
<input
  type="email"
  id="email"
  name="email"
  aria-invalid="true"
  aria-describedby="email-error"
>
<span id="email-error" class="error">Please enter a valid email address</span>
```

#### Required Fields

```html
<label for="username">
  Username
  <span aria-label="required">*</span>
</label>
<input
  type="text"
  id="username"
  name="username"
  required
  aria-required="true"
>
```

---

### 4. Buttons and Links

#### When to Use Each

- **Links (`<a>`)**: Navigate to a different page/location
- **Buttons (`<button>`)**: Trigger actions, submit forms, open modals

**❌ Wrong:**
```html
<!-- Link used as button -->
<a href="#" onclick="saveData()">Save</a>

<!-- Div used as button -->
<div class="button" onclick="saveData()">Save</div>
```

**✅ Correct:**
```html
<!-- Button for action -->
<button type="button" onclick="saveData()">Save</button>

<!-- Link for navigation -->
<a href="/settings">Settings</a>
```

#### Button States

```html
<!-- Loading state -->
<button type="button" aria-busy="true" disabled>
  <span class="spinner" aria-hidden="true"></span>
  Saving...
</button>

<!-- Toggle button -->
<button
  type="button"
  aria-pressed="false"
  onclick="toggleTheme()"
>
  Dark Mode
</button>
```

---

### 5. Headings

**Use proper heading hierarchy (h1-h6). Never skip levels.**

**❌ Wrong:**
```html
<h1>Page Title</h1>
<h4>Subsection</h4>  <!-- Skipped h2 and h3 -->
```

**✅ Correct:**
```html
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<h4>Detail</h4>
```

**Visually hide headings when needed for structure:**
```html
<h2 class="visually-hidden">Navigation Menu</h2>
<nav>
  <!-- menu items -->
</nav>
```

---

### 6. Landmarks and Page Structure

**Use HTML5 landmark elements to define page regions.**

```html
<header>
  <nav aria-label="Main navigation">
    <!-- primary navigation -->
  </nav>
</header>

<main id="main-content">
  <h1>Page Title</h1>

  <nav aria-label="Breadcrumb">
    <!-- breadcrumb trail -->
  </nav>

  <article>
    <!-- main content -->
  </article>

  <aside aria-label="Related links">
    <!-- sidebar -->
  </aside>
</main>

<footer>
  <!-- site footer -->
</footer>
```

**When multiple landmarks of the same type exist, use `aria-label`:**
```html
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Footer navigation">...</nav>
```

---

### 7. Lists

**Use semantic list elements for lists of items.**

**❌ Wrong:**
```html
<div class="list">
  <div class="item">Item 1</div>
  <div class="item">Item 2</div>
</div>
```

**✅ Correct:**
```html
<!-- Unordered list -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- Ordered list -->
<ol>
  <li>First step</li>
  <li>Second step</li>
</ol>

<!-- Definition list -->
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

---

## Interactive Component Standards

### 1. Modals / Dialogs

```html
<div
  class="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
>
  <div class="modal-content">
    <h2 id="modal-title">Confirm Action</h2>
    <p id="modal-desc">Are you sure you want to delete this item?</p>

    <div class="modal-actions">
      <button type="button" onclick="closeModal()">Cancel</button>
      <button type="button" onclick="confirmDelete()">Delete</button>
    </div>
  </div>
</div>
```

**Requirements:**
- Must trap focus within the modal
- Must restore focus to trigger element on close
- Must support Escape key to close
- Must have `aria-modal="true"` and `role="dialog"`

---

### 2. Tabs

```html
<div class="tabs">
  <div role="tablist" aria-label="Settings tabs">
    <button
      role="tab"
      id="tab-general"
      aria-controls="panel-general"
      aria-selected="true"
    >
      General
    </button>
    <button
      role="tab"
      id="tab-security"
      aria-controls="panel-security"
      aria-selected="false"
    >
      Security
    </button>
  </div>

  <div
    role="tabpanel"
    id="panel-general"
    aria-labelledby="tab-general"
  >
    <!-- General settings content -->
  </div>

  <div
    role="tabpanel"
    id="panel-security"
    aria-labelledby="tab-security"
    hidden
  >
    <!-- Security settings content -->
  </div>
</div>
```

**Requirements:**
- Arrow keys navigate between tabs
- Tab key moves to tab panel content
- Only one tab should have `tabindex="0"`, others `-1`

---

### 3. Dropdown Menus

```html
<nav>
  <button
    type="button"
    aria-expanded="false"
    aria-controls="user-menu"
    aria-haspopup="true"
  >
    User Menu
  </button>

  <ul id="user-menu" role="menu" hidden>
    <li role="none">
      <a href="/profile" role="menuitem">Profile</a>
    </li>
    <li role="none">
      <a href="/settings" role="menuitem">Settings</a>
    </li>
    <li role="none">
      <button type="button" role="menuitem">Logout</button>
    </li>
  </ul>
</nav>
```

**Requirements:**
- Toggle `aria-expanded` when opening/closing
- Support arrow key navigation
- Support Escape to close
- Close on click outside

---

## ARIA Live Regions

**Use live regions to announce dynamic content changes to screen readers.**

### Announcement Priority Levels

```html
<!-- Polite: Announce when convenient (default for most updates) -->
<div aria-live="polite" aria-atomic="true" class="visually-hidden" id="status-announcer"></div>

<!-- Assertive: Announce immediately (errors, urgent alerts) -->
<div aria-live="assertive" aria-atomic="true" class="visually-hidden" id="alert-announcer"></div>
```

### Usage Example

```javascript
// Announce success message
document.getElementById('status-announcer').textContent = 'Trade saved successfully';

// Clear after delay
setTimeout(function() {
  document.getElementById('status-announcer').textContent = '';
}, 1000);
```

**Funky Framework Pattern:**
```javascript
// Use the built-in announcer (via Funky.Announce)
Funky.Announce.polite('Page content updated');

// For errors and urgent alerts
Funky.Announce.assertive('Error: Form validation failed');

// Clear announcements
Funky.Announce.clear();
```

### Funky.Announce API

The `Funky.Announce` utility provides a clean API for screen reader announcements:

```javascript
// Polite announcement - won't interrupt screen reader
// Use for: updates, loading states, confirmations
Funky.Announce.polite('5 items loaded');

// Assertive announcement - interrupts immediately
// Use for: errors, urgent alerts, critical information
Funky.Announce.assertive('Error: Connection lost');

// Clear all live regions
Funky.Announce.clear();
```

**Implementation Details:**
- Auto-creates live regions if missing from DOM
- Uses `#spa-announcer` (polite) and `#alert-announcer` (assertive)
- Small delay (100ms) ensures screen readers notice changes
- Integrates with existing layout templates

---

## Color and Contrast

### Minimum Contrast Ratios (WCAG AA)

- **Normal text (< 18pt):** 4.5:1
- **Large text (≥ 18pt or 14pt bold):** 3:1
- **UI components and graphics:** 3:1

### Testing

Use browser DevTools or online tools:
- Chrome DevTools Accessibility panel
- https://webaim.org/resources/contrastchecker/
- https://contrast-ratio.com/

### Funky.Util.checkContrast API

The Funky Framework includes a built-in contrast checker that implements the WCAG formula:

```javascript
// Basic usage - check AA compliance
var result = Funky.Util.checkContrast('#333', '#fff');
// Returns: { ratio: 12.63, passAA: true, passAALarge: true, passAAA: true, passAAALarge: true }

// Check with large text option
var result = Funky.Util.checkContrast('#666', '#fff', { largeText: true });
// Uses 3:1 threshold instead of 4.5:1

// Supports multiple color formats
Funky.Util.checkContrast('rgb(51, 51, 51)', '#ffffff');
Funky.Util.checkContrast('#333', 'white');
Funky.Util.checkContrast('rgba(0,0,0,1)', 'rgb(255,255,255)');
```

**Return Object:**
```javascript
{
  ratio: 12.63,      // Contrast ratio (1-21)
  passAA: true,      // Meets AA for normal text (4.5:1)
  passAALarge: true, // Meets AA for large text (3:1)
  passAAA: true,     // Meets AAA for normal text (7:1)
  passAAALarge: true // Meets AAA for large text (4.5:1)
}
```

**Related Functions:**
```javascript
// Parse CSS color to RGB object
Funky.Util.parseColor('#ff6600');
// Returns: { r: 255, g: 102, b: 0 }

// Calculate relative luminance (0-1)
Funky.Util.relativeLuminance(255, 255, 255);
// Returns: 1

// Calculate contrast ratio between two colors
Funky.Util.contrastRatio('#000', '#fff');
// Returns: 21
```

### Never Rely on Color Alone

**❌ Wrong:**
```html
<span style="color: red;">Error</span>
<span style="color: green;">Success</span>
```

**✅ Correct:**
```html
<span class="error">
  <svg aria-hidden="true"><use href="#icon-error"></use></svg>
  Error: Invalid input
</span>
<span class="success">
  <svg aria-hidden="true"><use href="#icon-success"></use></svg>
  Success: Saved
</span>
```

---

## Keyboard Navigation

### All Interactive Elements Must Be Keyboard Accessible

**Requirements:**
- All clickable elements must be reachable via Tab key
- Logical tab order (matches visual layout)
- Visible focus indicators
- Support standard keyboard patterns (Enter/Space, Escape, Arrow keys)

### Focus Indicators

**Never remove outlines without replacement:**

**❌ Wrong:**
```css
button:focus {
  outline: none;  /* Breaks keyboard navigation */
}
```

**✅ Correct:**
```css
button:focus {
  outline: 2px solid var(--pro-accent-primary);
  outline-offset: 2px;
}

/* Or use focus-visible for better UX */
button:focus-visible {
  outline: 2px solid var(--pro-accent-primary);
  outline-offset: 2px;
}
```

### Skip Links

The Funky Framework automatically provides F-key skip links (F3-F12). Add skip targets to key sections:

```html
<nav
  id="main-nav"
  data-skip-target="navigation"
  data-skip-label="main navigation"
  data-skip-order="0"
>
  <!-- navigation -->
</nav>

<main
  id="main-content"
  data-skip-target="main"
  data-skip-label="main content"
  data-skip-order="1"
>
  <!-- main content -->
</main>
```

---

## Animation and Motion

### Respect User Preferences

**Always check `prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Funky Framework automatically handles this via `Funky.Animate.getDuration()`.**

### Animation Speed Control

Users can adjust animation speed globally:

```javascript
// Slower animations (0.5x speed)
Funky.Animate.speedMultiplier = 0.5;

// Faster animations (2x speed)
Funky.Animate.speedMultiplier = 2.0;

// Disable animations
document.documentElement.setAttribute('data-animations', 'off');
```

### Screen-Reader-Friendly Hiding

**CRITICAL: Not all hiding methods are created equal.**

#### ✅ Screen Reader Accessible (Content Remains Readable)

**1. `opacity: 0` - RECOMMENDED for animations**
```css
.element {
  opacity: 0; /* Visually hidden, but readable by screen readers */
}
```

**Why:** Content remains in accessibility tree. Screen readers can read it. Used by Funky's animation system.

**2. `.visually-hidden` / `.sr-only` - For labels and skip links**
```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Why:** Completely hidden visually, but fully accessible to screen readers. Use for descriptive labels.

**3. `transform: translateX(-100%)` or `off-canvas` positioning**
```css
.element {
  transform: translateX(-100%); /* Moved off-screen, still accessible */
}
```

#### ❌ Screen Reader BLOCKS Content (Avoid!)

**1. `display: none` - Completely hidden from accessibility tree**
```css
.element {
  display: none; /* Screen readers CANNOT read this */
}
```

**2. `visibility: hidden` - Hidden from accessibility tree**
```css
.element {
  visibility: hidden; /* Screen readers CANNOT read this */
}
```

**3. `aria-hidden="true"` - Explicitly hidden from assistive technology**
```html
<div aria-hidden="true">Screen readers CANNOT read this</div>
```

**When to use blocking methods:**
- Truly decorative content (icons, visual flourishes)
- Duplicate content already announced elsewhere
- Content in inactive states (closed modals, hidden tabs)

#### Funky Framework Implementation

The Funky animation system uses **`opacity: 0`** for scroll-triggered animations:

```css
/* In animate.css */
[data-animate-trigger="in-view"]:not(.animating):not(.animated) {
  opacity: 0; /* ✅ Screen reader friendly! */
}
```

**This means:**
- Content with `data-animate="fade-in"` starts invisible but is still readable by screen readers
- When IntersectionObserver detects element in viewport, animation triggers
- Screen readers can access content immediately, even before animation
- Complies with WCAG 2.1 Level A (1.3.1 Info and Relationships)

#### Screen Reader Behavior Notes

**Screen reader navigation modes may affect what content is announced:**

1. **Browse/Virtual Mode** (default): Reads all content including `opacity: 0`
2. **Focus/Forms Mode**: Only reads focusable elements
3. **"Read Visible Text" commands**: Behavior varies by screen reader (NVDA, JAWS, VoiceOver)

**Best practice:** Always use semantic HTML + `opacity: 0` for animations. This ensures maximum compatibility across all screen readers and navigation modes.

---

## Testing Checklist

### Automated Testing

- [ ] Run axe DevTools or WAVE browser extension
- [ ] Validate HTML (https://validator.w3.org/)
- [ ] Check color contrast ratios

### Manual Testing

- [ ] Navigate entire page using only keyboard (Tab, Enter, Escape, Arrows)
- [ ] Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Verify all images have meaningful alt text
- [ ] Confirm all form inputs have labels
- [ ] Check heading hierarchy is logical
- [ ] Ensure focus indicators are visible
- [ ] Test with browser zoom at 200%
- [ ] Verify responsive design works at 320px width

### Screen Reader Testing

**Windows:** NVDA (free) - https://www.nvaccess.org/
**Mac:** VoiceOver (built-in) - Cmd + F5
**Mobile:** TalkBack (Android), VoiceOver (iOS)

#### Common Screen Reader Commands

**NVDA:**
- `Ctrl` - Stop reading
- `Insert + Down Arrow` - Read next item
- `H` - Next heading
- `T` - Next table
- `B` - Next button
- `L` - Next list

**VoiceOver:**
- `Ctrl + Option + A` - Start reading
- `Ctrl + Option + Right Arrow` - Next item
- `Ctrl + Option + Cmd + H` - Next heading

---

## Common Mistakes to Avoid

### 1. Using `<div>` or `<span>` for Interactive Elements
- ❌ `<div onclick="...">`
- ✅ `<button type="button">`

### 2. Missing Alt Text
- ❌ `<img src="logo.png">`
- ✅ `<img src="logo.png" alt="Funky Framework">`

### 3. Placeholder as Label
- ❌ `<input placeholder="Email">`
- ✅ `<label for="email">Email</label><input id="email" placeholder="you@example.com">`

### 4. Empty Links
- ❌ `<a href="/"><img src="logo.png"></a>`
- ✅ `<a href="/"><img src="logo.png" alt="Funky Framework Home"></a>`

### 5. Auto-Playing Media
- ❌ `<video autoplay>`
- ✅ `<video controls>` (let user decide)

### 6. Time Limits Without Warning
- ❌ Session expires without notice
- ✅ Warn user 5 minutes before timeout, allow extension

### 7. Using `role="img"` on Text Content
- ❌ `<div role="img">Diagram content</div>`
- ✅ `<figure><pre>Diagram content</pre></figure>`

---

## Development Mode Accessibility Validator

The Funky Framework includes a built-in accessibility validator for development. It checks for common WCAG violations and reports them in the console.

### Activation

```javascript
// Option 1: URL parameter
// Add ?a11y=1 to any page URL
// https://yoursite.com/page?a11y=1

// Option 2: Storage flag
Funky.Storage.set('a11y_mode', true);

// Option 3: Manual validation
Funky.A11yValidator.validate();
```

### Validation Rules

The validator checks for 8 categories of issues:

| Rule | Severity | Description |
|------|----------|-------------|
| `missingAlt` | error | Images without alt attributes |
| `missingLabels` | error | Form inputs without associated labels |
| `emptyButtons` | warning | Buttons without accessible names |
| `lowContrast` | warning | Text with insufficient contrast ratio |
| `duplicateIds` | error | Multiple elements with the same ID |
| `invalidAria` | error | Invalid ARIA roles or missing required attributes |
| `brokenFocusOrder` | warning | Positive tabindex or focusable elements in aria-hidden |
| `missingLandmarks` | info | Missing main, nav, or header landmarks |

### Configuration

```javascript
// Change rule severity
Funky.A11yValidator.configure({
  lowContrast: { severity: 'error' },
  missingLandmarks: { severity: 'warning' }
});

// Disable specific rules
Funky.A11yValidator.disable('brokenFocusOrder');

// Enable a disabled rule
Funky.A11yValidator.enable('brokenFocusOrder');
```

### Excluding Elements

Third-party libraries are automatically excluded:
- `.je-object` (json-editor)
- `.wysimark` (wysimark editor)
- `.select2` (Select2)
- `.funky-table-wrapper` (Funky.Table internals)

Add custom exclusions with the `data-a11y-ignore` attribute:

```html
<div data-a11y-ignore>
  <!-- Content here will be excluded from validation -->
</div>
```

### Console Output

```
[A11yValidator] Found 3 accessibility issues (12.5ms):
  ERRORS (2)
    ERROR: <img> missing alt attribute at #product-image
    ERROR: Duplicate ID "submit-btn" found 2 times at #submit-btn
  WARNINGS (1)
    WARNING: Low contrast (3.2:1) - needs 4.5:1 at span.sidebar-text
```

### Programmatic Access

```javascript
// Run validation and get results
var results = Funky.A11yValidator.validate();
console.log(results);
// {
//   errors: 2,
//   warnings: 1,
//   info: 0,
//   total: 3,
//   issues: [...]
// }

// Listen for validation events
document.addEventListener('a11y:validation', function(e) {
  console.log('Validation complete:', e.detail);
});
```

### Validate Specific Section

```javascript
// Validate only a specific container
var modal = document.getElementById('myModal');
Funky.A11yValidator.validate(modal);
```

---

## Resources

### WCAG Guidelines
- **Official Spec:** https://www.w3.org/WAI/WCAG21/quickref/
- **Understanding WCAG:** https://www.w3.org/WAI/WCAG21/Understanding/

### Testing Tools
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **WAVE:** https://wave.webaim.org/
- **Lighthouse:** Built into Chrome DevTools
- **NVDA:** https://www.nvaccess.org/

### Patterns and Examples
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **WebAIM:** https://webaim.org/
- **Inclusive Components:** https://inclusive-components.design/

---

## Compliance Tracking

### Current Status (as of 2025-01-24)

**Completed:**
- ✅ ASCII diagrams converted to semantic HTML (about page)
- ✅ Skip links with F-key shortcuts
- ✅ Keyboard navigation system
- ✅ Animation speed controls
- ✅ `prefers-reduced-motion` support
- ✅ Focus management in modals
- ✅ ARIA live regions for announcements

**In Progress:**
- 🔄 Table accessibility audit
- 🔄 Form validation error linking
- 🔄 Contrast ratio validation

**Planned:**
- ⏳ Automated accessibility testing in CI/CD
- ⏳ Screen reader compatibility matrix
- ⏳ Developer training materials

---

## Questions?

For accessibility questions or clarifications, consult:
1. This document
2. WCAG 2.1 Quick Reference Guide
3. Project maintainers

**Remember:** When in doubt, use semantic HTML first, ARIA second.
