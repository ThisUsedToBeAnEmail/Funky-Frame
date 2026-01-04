# Funky.Tour - Interactive Product Tours

Guided tours and onboarding flows with spotlight effects, smart positioning, and full accessibility support.

## Overview

`Funky.Tour` provides step-by-step guided tours for user onboarding, feature discovery, and interactive tutorials. Tours highlight target elements with a spotlight effect and display contextual tooltips.

**Key Features:**

- ✨ **Step-by-step guidance** - Sequential walkthrough of UI elements
- 🔦 **Spotlight effect** - Highlights target elements with customizable overlay
- 📍 **Smart positioning** - Auto-positions tooltips based on viewport space
- ⌨️ **Keyboard navigation** - Full keyboard support with focus management
- 🔗 **SPA integration** - Works with `Funky.Pages` for cross-page tours
- 💾 **Persistence** - Remembers completed tours and progress
- 🔄 **LiveBinding** - Dynamic content with template syntax
- ♿ **Accessibility** - WCAG 2.1 compliant with ARIA and screen reader support
- 🎨 **Theming** - Full CSS variable customization

## Registration

**Files:**
- `public/assets/js/components/tour.js`
- `public/assets/css/components/tour.css`

Registered as `Funky.Tour` via the component registry.

## Installation

Include the required files:

```html
<!-- CSS -->
<link rel="stylesheet" href="/assets/css/components/tour.css">

<!-- JavaScript (after Funky core) -->
<script src="/assets/js/components/tour.js"></script>
```

## Quick Start

### Basic Tour

```javascript
var tour = Funky.Tour.init('welcome-tour', {
  steps: [
    {
      target: '#dashboard-btn',
      title: 'Dashboard',
      content: 'View your main dashboard with key metrics.'
    },
    {
      target: '#settings-btn',
      title: 'Settings',
      content: 'Configure your preferences here.'
    },
    {
      target: '#help-btn',
      title: 'Need Help?',
      content: 'Click here for documentation and support.',
      position: 'left'
    }
  ]
});

// Start the tour
tour.start();
```

### Using TourManager

```javascript
// Create and register a tour
Funky.Tour.init('feature-tour', {
  autoStart: true,
  showOnce: true,
  steps: [...]
});

// Start a tour by ID
Funky.Tour.start('feature-tour');

// Check if tour was completed
if (!Funky.Tour.isCompleted('feature-tour')) {
  Funky.Tour.start('feature-tour');
}

// Get a tour instance
var tour = Funky.Tour.getInstance('feature-tour');

// Reset completion state
Funky.Tour.reset('feature-tour');
```

---

## Tour Options

Full configuration options passed to `Funky.Tour.init()`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | string | `null` | **Required.** Unique tour identifier |
| `steps` | array | `[]` | **Required.** Array of step configurations |
| `autoStart` | boolean | `false` | Start tour automatically on creation |
| `persist` | boolean | `true` | Remember completion state in Storage |
| `showOnce` | boolean | `true` | Only show tour once per user |
| `scrollBehavior` | string | `'smooth'` | `'smooth'`, `'instant'`, or `'none'` |
| `scrollPadding` | number | `100` | Pixels above element when scrolling |
| `showDontShowAgain` | boolean | `false` | Show "don't show again" checkbox |
| `resumable` | boolean | `false` | Save progress and resume on reload |
| `progressMaxAge` | number | `86400000` | Max age for saved progress (ms, default 24h) |
| `syncToServer` | boolean | `true` | Sync completion to `Funky.Preferences` |
| `showProgress` | boolean | `true` | Show step counter (e.g., "2 of 5") |
| `showSkip` | boolean | `true` | Show "Skip" button |
| `showPrevious` | boolean | `true` | Show "Previous" button |
| `showClose` | boolean | `true` | Show close (×) button |
| `closeOnOverlay` | boolean | `true` | Click overlay to close tour |
| `closeOnEscape` | boolean | `true` | Escape key closes tour |
| `overlayEnabled` | boolean | `true` | Show backdrop overlay |
| `overlayOpacity` | number | `0.5` | Overlay opacity (0-1) |
| `highlightPadding` | number | `8` | Padding around highlighted element (px) |
| `highlightRadius` | number | `4` | Border radius of spotlight (px) |
| `persistOverlay` | boolean | `false` | Keep overlay visible during SPA navigation |
| `animate` | boolean | `true` | Enable animations |
| `animationDuration` | number | `200` | Transition duration in ms |

### Morph Integration Options

These options require `Funky.Morph` to be available:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useMorph` | boolean | `true` | Use Morph for spotlight transitions |
| `spotlightMorph` | boolean | `true` | Morph spotlight between targets |
| `tooltipMorph` | boolean | `false` | Morph tooltip between positions (experimental) |
| `morphEasing` | string | `'easeOutCubic'` | Easing for morph animations |
| `morphStagger` | number | `50` | Delay between spotlight and tooltip morph (ms) |

### Callback Options

| Option | Type | Description |
|--------|------|-------------|
| `onStart` | function | Called when tour starts. Args: `(tour)` |
| `onEnd` | function | Called when tour ends. Args: `(tour, { completed, skipped })` |
| `onComplete` | function | Called when tour completes all steps. Args: `(tour)` |
| `onSkip` | function | Called when tour is skipped. Args: `(tour)` |
| `onStepShow` | function | Called when step shows. Args: `(step, index, tour)` |
| `onStepHide` | function | Called when step hides. Args: `(step, index, tour)` |

### Label Options

Customize button and UI text:

| Option | Type | Default |
|--------|------|---------|
| `labels.next` | string | `'Next'` |
| `labels.previous` | string | `'Previous'` |
| `labels.skip` | string | `'Skip'` |
| `labels.finish` | string | `'Finish'` |
| `labels.close` | string | `'Close'` |
| `labels.of` | string | `'of'` |
| `labels.stepCounter` | string | `'Step {current} of {total}'` |
| `labels.dontShowAgain` | string | `'Don\'t show this again'` |

---

## Step Configuration

Each step in the `steps` array can have these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | string\|Element\|function | `null` | **Required.** CSS selector, element, or function returning element |
| `title` | string | `''` | Step title |
| `content` | string | `''` | Step description (HTML supported) |
| `position` | string | `'auto'` | `'top'`, `'bottom'`, `'left'`, `'right'`, or `'auto'` |
| `showIf` | function | `null` | Conditional display: `() => boolean` |
| `skipIf` | function | `null` | Skip with data: `(data) => boolean` |
| `scrollBehavior` | string | `null` | Override tour scroll behavior |
| `highlightPadding` | number | `null` | Override tour highlight padding |

### Step Callbacks

| Option | Type | Description |
|--------|------|-------------|
| `beforeShow` | function | Called before step shows. Args: `(step, tour)` |
| `afterShow` | function | Called after step shows. Args: `(step, tour)` |
| `beforeHide` | function | Called before step hides. Args: `(step, tour)` |
| `afterHide` | function | Called after step hides. Args: `(step, tour)` |

### Action Buttons

Add a custom action button to a step:

```javascript
{
  target: '#export-btn',
  title: 'Export Data',
  content: 'Click to export your data to CSV.',
  action: {
    text: 'Try Export',
    onClick: function(step, tour) {
      document.querySelector('#export-btn').click();
      tour.next();
    }
  }
}
```

### Dynamic Targets

Target can be a function for dynamic element discovery:

```javascript
{
  target: function() {
    return document.querySelector('.dynamic-element:first-child');
  },
  title: 'Dynamic Element',
  content: 'This element may not exist at tour creation time.'
}
```

---

## LiveBinding Integration

Tour supports LiveBinding for dynamic content updates.

### Template Syntax

Use `{{variable}}` syntax in title or content:

```javascript
Funky.Tour.init('user-tour', {
  steps: [
    {
      target: '#profile',
      title: 'Welcome, {{userName}}!',
      content: 'You have {{messageCount}} unread messages.',
      livebinding: {
        key: 'userProfile',
        path: 'data'
      }
    }
  ]
});

// Update data - tour content updates automatically
Funky.LiveBinding.set('userProfile', {
  data: {
    userName: 'John',
    messageCount: 5
  }
});
```

### Nested Paths

Access nested data with dot notation:

```javascript
{
  target: '#stats',
  content: 'Total: {{stats.total}}, Active: {{stats.active}}',
  livebinding: {
    key: 'dashboard',
    path: 'metrics'
  }
}
```

### Function Content

Use a function for complex dynamic content:

```javascript
{
  target: '#chart',
  title: 'Analytics',
  content: function(data) {
    return 'Showing data for <strong>' + data.period + '</strong>: ' +
           data.values.length + ' data points.';
  },
  livebinding: {
    key: 'analytics'
  }
}
```

### Conditional Skipping with skipIf

Skip steps based on LiveBinding data:

```javascript
{
  target: '#premium-features',
  title: 'Premium Features',
  content: 'Unlock advanced capabilities.',
  livebinding: {
    key: 'userProfile'
  },
  skipIf: function(data) {
    // Skip this step for premium users
    return data && data.isPremium === true;
  }
}
```

### LiveBinding Options

| Option | Type | Description |
|--------|------|-------------|
| `livebinding.key` | string | LiveBinding key to subscribe to |
| `livebinding.path` | string | Dot-path to data within the key |
| `context` | object | Additional static context for templates |
| `autoUpdate` | boolean | Auto-update when data changes (default: `true`) |

---

## API Methods

### TourManager (Static Methods)

The `Funky.Tour` namespace provides these static methods:

#### Tour Creation & Management

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `init(id, options)` | id: string, options: object | Tour | Create and register a new tour |
| `getInstance(tourId)` | tourId: string | Tour\|null | Get registered tour by ID |
| `has(tourId)` | tourId: string | boolean | Check if a tour exists |
| `list()` | - | string[] | List all registered tour IDs |
| `destroy(tourId)` | tourId: string | void | Destroy a tour instance |
| `destroyAll()` | - | void | Destroy all tours |

#### Tour Control

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `start(tourId)` | tourId: string | Tour\|null | Start a tour by ID |
| `endActive()` | - | void | End the currently active tour |
| `getActive()` | - | Tour\|null | Get currently active tour |

#### Completion & Progress

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `isCompleted(tourId)` | tourId: string | boolean | Check if tour was completed |
| `reset(tourId)` | tourId: string | void | Reset completion state for a tour |
| `resetAll()` | - | void | Reset all tour completion states |
| `getStats(tourId)` | tourId: string | Object\|null | Get tour statistics |

#### Dismiss Controls

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `dismissAll()` | - | void | Dismiss all tours permanently |
| `enableAll()` | - | void | Re-enable all dismissed tours |

#### DOM & SPA Integration

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `createFromDOM(tourId, options?)` | tourId: string, options: object | Tour\|null | Create tour from data attributes |
| `discoverSteps(tourId, container?)` | tourId: string, container: Element | Object[] | Discover steps from DOM |
| `initStartButtons(container?)` | container: Element | void | Initialize tour start buttons |
| `triggerPageTour(pageId?)` | pageId: string | Tour\|null | Trigger page tour manually |

#### Server Tours

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `getServerDefinedTours(context?)` | context: string | Array | Get server-defined tours |
| `loadServerTours(context?)` | context: string | void | Load and register server tours |

---

### Tour Instance Methods

Methods available on tour instances returned by `Funky.Tour.init()`:

#### Navigation

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `start()` | - | Tour | Start the tour |
| `end(reason?)` | reason: { completed, skipped } | Tour | End the tour |
| `next()` | - | Tour | Go to next step |
| `prev()` | - | Tour | Go to previous step |
| `goTo(index)` | index: number | Tour | Go to specific step (0-indexed) |
| `skip()` | - | Tour | Skip and end the tour |

#### SPA / Pause Control

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `pause()` | - | Tour | Pause the tour (for SPA transitions) |
| `resume(options?)` | options: object | Tour | Resume a paused tour |
| `isPaused()` | - | boolean | Check if tour is paused |

#### State Queries

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `isActive()` | - | boolean | Check if tour is active |
| `shouldShow()` | - | boolean | Check if tour should display |
| `getCurrentStep()` | - | Object | Get current step configuration |
| `getVisibleSteps()` | - | Object[] | Get steps respecting showIf |
| `getTotalSteps()` | - | number | Get total visible step count |
| `getCurrentStepNumber()` | - | number | Get current step (1-indexed) |
| `isFirstStep()` | - | boolean | Check if at first step |
| `isLastStep()` | - | boolean | Check if at last step |

#### LiveBinding

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `updateData(data)` | data: object | Tour | Update LiveBinding data dynamically |

#### Lifecycle

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `destroy()` | - | void | Destroy the tour instance |

---

## Events

### PubSub Events

Tour emits events via `Funky.PubSub`:

| Event | Data | Description |
|-------|------|-------------|
| `funky:tour:registered` | `{ tourId }` | Tour instance registered |
| `funky:tour:start` | `{ tourId }` | Tour started |
| `funky:tour:end` | `{ tourId, completed, skipped }` | Tour ended |
| `funky:tour:complete` | `{ tourId }` | Tour completed all steps |
| `funky:tour:skip` | `{ tourId, stepIndex }` | Tour was skipped |
| `funky:tour:step:show` | `{ tourId, stepIndex, step }` | Step shown |
| `funky:tour:step:hide` | `{ tourId, stepIndex, step }` | Step hidden |
| `funky:tour:dismissed:all` | - | All tours dismissed |

**Example:**

```javascript
Funky.PubSub.on('funky:tour:complete', function(data) {
  console.log('Tour completed:', data.tourId);
  // Track analytics, show celebration, etc.
});

Funky.PubSub.on('funky:tour:step:show', function(data) {
  console.log('Step ' + data.stepIndex + ' shown');
});
```

---

## Accessibility

Funky.Tour is fully accessible and WCAG 2.1 compliant.

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next focusable element |
| `Shift + Tab` | Move focus to previous focusable element |
| `Enter` / `Space` | Activate focused button |
| `Escape` | Close tour (if enabled) |
| `→` / `ArrowRight` | Go to next step |
| `←` / `ArrowLeft` | Go to previous step |

### Screen Reader Support

- Tooltip has `role="dialog"` with `aria-modal="true"`
- Title linked via `aria-labelledby`
- Content linked via `aria-describedby`
- Live region announces step changes with `aria-live="polite"`
- Focus trapped within tooltip during tour
- Step counter announces "Step X of Y"

### Focus Management

- Focus moves to tooltip when step shows
- Focus returns to trigger element when tour ends
- Focus trap prevents tabbing outside tooltip
- Skip links available for keyboard users

### Reduced Motion

Tour respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .tour-overlay,
  .tour-tooltip,
  .tour-spotlight {
    transition: none !important;
    animation: none !important;
  }
}
```

---

## Theming

Tour uses CSS variables for full customization. Override in your theme or component styles.

### Overlay Variables

```css
:root {
  --pro-tour-overlay-bg: rgba(0, 0, 0, 0.5);
  --pro-tour-overlay-z-index: 9998;
}
```

### Spotlight Variables

```css
:root {
  --pro-tour-spotlight-border-width: 2px;
  --pro-tour-spotlight-border-color: var(--pro-primary);
  --pro-tour-spotlight-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  --pro-tour-spotlight-border-radius: 4px;
}
```

### Tooltip Variables

```css
:root {
  --pro-tour-tooltip-bg: var(--pro-bg-primary);
  --pro-tour-tooltip-border: 1px solid var(--pro-border-color);
  --pro-tour-tooltip-shadow: var(--pro-shadow-lg);
  --pro-tour-tooltip-border-radius: 8px;
  --pro-tour-tooltip-padding: 1rem;
  --pro-tour-tooltip-max-width: 400px;
  --pro-tour-tooltip-min-width: 280px;
  --pro-tour-tooltip-z-index: 9999;
}
```

### Title & Content Variables

```css
:root {
  --pro-tour-title-font-size: 1.125rem;
  --pro-tour-title-font-weight: 600;
  --pro-tour-title-color: var(--pro-text-primary);
  --pro-tour-title-margin-bottom: 0.5rem;
  
  --pro-tour-content-font-size: 0.9375rem;
  --pro-tour-content-line-height: 1.5;
  --pro-tour-content-color: var(--pro-text-secondary);
}
```

### Button Variables

```css
:root {
  --pro-tour-btn-padding: 0.375rem 0.75rem;
  --pro-tour-btn-font-size: 0.875rem;
  --pro-tour-btn-border-radius: 4px;
}
```

### Progress Indicator Variables

```css
:root {
  /* Progress bar */
  --pro-tour-progress-height: 4px;
  --pro-tour-progress-bg: var(--pro-bg-tertiary);
  --pro-tour-progress-fill: var(--pro-primary);
  --pro-tour-progress-radius: 2px;
  
  /* Progress dots */
  --pro-tour-dot-size: 8px;
  --pro-tour-dot-gap: 6px;
  --pro-tour-dot-bg: var(--pro-bg-tertiary);
  --pro-tour-dot-active-bg: var(--pro-primary);
  --pro-tour-dot-completed-bg: var(--pro-success);
}
```

### Z-Index Layers

```css
:root {
  --pro-tour-z-overlay: 9998;
  --pro-tour-z-spotlight: 9999;
  --pro-tour-z-tooltip: 10000;
}
```

---

## SPA Integration

Tour integrates with `Funky.Pages` for single-page applications.

### Page Tour Auto-Start

```javascript
// In page module
Funky.Pages.register('dashboard', {
  init: function() {
    // Tour auto-starts if configured
    Funky.Tour.triggerPageTour('dashboard');
  }
});

// Define page tour
Funky.Tour.init('dashboard-tour', {
  pageId: 'dashboard',  // Links to page
  autoStart: false,     // triggerPageTour handles start
  steps: [...]
});
```

### DOM-Based Step Discovery

Define steps in HTML with data attributes:

```html
<div id="feature-panel" 
     data-tour="dashboard-tour"
     data-tour-step="1"
     data-tour-title="Feature Panel"
     data-tour-content="This panel shows key features."
     data-tour-position="bottom">
</div>

<button id="action-btn"
        data-tour="dashboard-tour"
        data-tour-step="2"
        data-tour-title="Actions"
        data-tour-content="Click here to perform actions.">
</button>
```

```javascript
// Discover and create tour from DOM
var steps = Funky.Tour.discoverSteps('dashboard-tour');
Funky.Tour.init('dashboard-tour', { steps: steps });
```

### Cross-Page Tours

```javascript
Funky.Tour.init('onboarding', {
  steps: [
    {
      target: '#dashboard-link',
      title: 'Go to Dashboard',
      content: 'Click to navigate to the dashboard.',
      action: {
        text: 'Go to Dashboard',
        onClick: function(step, tour) {
          // Tour pauses, resumes on new page
          Funky.SPA.navigate('/dashboard');
        }
      },
      pageId: 'home'
    },
    {
      target: '#widgets',
      title: 'Dashboard Widgets',
      content: 'Here are your widgets.',
      pageId: 'dashboard'  // This step shows on dashboard page
    }
  ]
});
```

### Start Buttons

Add start buttons that trigger tours:

```html
<button data-tour-start="welcome-tour">
  Start Tour
</button>
```

```javascript
// Initialize all start buttons
Funky.Tour.initStartButtons();
```

---

## Examples

### Feature Announcement Tour

```javascript
Funky.Tour.init('new-export-feature', {
  showOnce: true,
  autoStart: true,
  steps: [
    {
      target: '#export-menu',
      title: '🎉 New Export Options!',
      content: 'We\'ve added new export formats including PDF and Excel.',
      position: 'bottom'
    },
    {
      target: '#export-pdf',
      title: 'PDF Export',
      content: 'Export your reports as beautifully formatted PDFs.'
    },
    {
      target: '#export-excel',
      title: 'Excel Export',
      content: 'Full Excel support with formulas preserved.'
    }
  ],
  onComplete: function(tour) {
    Funky.Toast.success('Enjoy the new features!');
  }
});
```

### Interactive Tutorial

```javascript
Funky.Tour.init('create-trade-tutorial', {
  showProgress: true,
  steps: [
    {
      target: '#new-trade-btn',
      title: 'Step 1: Start New Trade',
      content: 'Click this button to begin creating a trade.',
      action: {
        text: 'Click to Start',
        onClick: function(step, tour) {
          document.querySelector('#new-trade-btn').click();
          // Wait for modal, then advance
          setTimeout(function() { tour.next(); }, 300);
        }
      }
    },
    {
      target: '#trade-form',
      title: 'Step 2: Fill Details',
      content: 'Enter the trade details in this form.',
      beforeShow: function(step, tour) {
        // Ensure form is visible
        return document.querySelector('#trade-form') !== null;
      }
    },
    {
      target: '#client-select',
      title: 'Step 3: Select Client',
      content: 'Choose the client for this trade.'
    },
    {
      target: '#submit-trade',
      title: 'Step 4: Submit',
      content: 'Review and submit your trade.',
      action: {
        text: 'Complete Tutorial',
        onClick: function(step, tour) {
          tour.end({ completed: true });
          Funky.Toast.success('Tutorial complete! You\'re ready to trade.');
        }
      }
    }
  ]
});
```

### Conditional Tour with User Data

```javascript
Funky.Tour.init('personalized-tour', {
  steps: [
    {
      target: '#profile',
      title: 'Welcome, {{user.name}}!',
      content: 'Let\'s personalize your experience.',
      livebinding: { key: 'currentUser', path: 'data' }
    },
    {
      target: '#admin-panel',
      title: 'Admin Panel',
      content: 'Manage users and settings here.',
      showIf: function() {
        return Funky.LiveBinding.get('currentUser').data.role === 'admin';
      }
    },
    {
      target: '#upgrade-btn',
      title: 'Upgrade to Pro',
      content: 'Unlock advanced features.',
      livebinding: { key: 'currentUser', path: 'data' },
      skipIf: function(data) {
        return data && data.plan === 'pro';
      }
    },
    {
      target: '#help-center',
      title: 'Need Help?',
      content: 'Access documentation and support anytime.'
    }
  ]
});
```

---

## CSS Classes

Reference for styling and customization:

| Class | Element |
|-------|---------|
| `.tour-overlay` | Backdrop overlay container |
| `.tour-spotlight` | Highlight around target element |
| `.tour-tooltip` | Main tooltip container |
| `.tour-tooltip--top` | Tooltip positioned above target |
| `.tour-tooltip--bottom` | Tooltip positioned below target |
| `.tour-tooltip--left` | Tooltip positioned left of target |
| `.tour-tooltip--right` | Tooltip positioned right of target |
| `.tour-tooltip__header` | Tooltip header section |
| `.tour-tooltip__title` | Title text |
| `.tour-tooltip__close` | Close button |
| `.tour-tooltip__body` | Content section |
| `.tour-tooltip__content` | Content text |
| `.tour-tooltip__footer` | Footer with buttons |
| `.tour-tooltip__progress` | Progress indicator |
| `.tour-tooltip__nav` | Navigation button group |
| `.tour-tooltip__arrow` | Arrow pointer |
| `.tour-tooltip__btn-prev` | Previous button |
| `.tour-tooltip__btn-next` | Next button |
| `.tour-tooltip__btn-skip` | Skip button |
| `.tour-tooltip__btn-action` | Custom action button |
| `.tour-tooltip__dismiss` | Don't show again checkbox |
| `.tour-active` | Added to body when tour active |
| `.tour--animating` | During animations |

---

## See Also

- [Funky.LiveBinding](../core/livebinding.md) - Data binding for dynamic content
- [Funky.Preferences](./preferences.md) - User preference syncing
- [Funky.Pages](../core/pages.md) - SPA page lifecycle
- [Accessibility Standards](../../accessibility-standards.md) - WCAG compliance
- [Theming Guide](../../THEMING.md) - CSS variable system
