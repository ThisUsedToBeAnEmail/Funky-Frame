# FunkyTests - Test Framework

A minimal, dependency-free browser-based testing framework for Funky components.

## Overview

FunkyTests provides a Jasmine-like API for writing and running tests directly in the browser. It includes assertions, spies, fake timers, DOM utilities, and async support.

## Quick Start

```javascript
describe('Calculator', function() {
    it('adds numbers', function() {
        expect(1 + 1).toBe(2);
    });

    it('subtracts numbers', function() {
        expect(5 - 3).toBe(2);
    });
});
```

Run tests by navigating to `/test-runner` or adding `?test=1` to any page URL.

---

## Suite Definition

### describe(name, fn)

Creates a test suite. Suites can be nested.

```javascript
describe('MyComponent', function() {
    describe('initialization', function() {
        it('sets defaults', function() {
            // ...
        });
    });

    describe('methods', function() {
        it('does something', function() {
            // ...
        });
    });
});
```

### it(name, fn) / test(name, fn)

Defines a test case.

```javascript
it('should return true', function() {
    expect(myFunction()).toBe(true);
});
```

### xit(name, fn) / skip(name, fn)

Skips a test (will be reported as skipped).

```javascript
xit('not implemented yet', function() {
    // This test will be skipped
});
```

---

## Lifecycle Hooks

### beforeEach(fn)

Runs before each test in the current suite and nested suites.

```javascript
describe('Suite', function() {
    var counter;

    beforeEach(function() {
        counter = 0;
    });

    it('starts at zero', function() {
        expect(counter).toBe(0);
    });
});
```

### afterEach(fn)

Runs after each test. Use for cleanup.

```javascript
afterEach(function() {
    fixture.cleanup();
    Toast.hideAll();
});
```

### beforeAll(fn)

Runs once before all tests in the suite.

```javascript
beforeAll(function() {
    // Expensive setup that can be shared
});
```

### afterAll(fn)

Runs once after all tests in the suite complete.

```javascript
afterAll(function() {
    // Final cleanup
});
```

---

## Assertions

All assertions use the `expect(actual)` pattern with matchers.

### Basic Matchers

| Matcher | Description |
|---------|-------------|
| `.toBe(expected)` | Strict equality (`===`) |
| `.toEqual(expected)` | Deep equality for objects/arrays |
| `.toBeTruthy()` | Value is truthy |
| `.toBeFalsy()` | Value is falsy |
| `.toBeDefined()` | Value is not `undefined` |
| `.toBeUndefined()` | Value is `undefined` |
| `.toBeNull()` | Value is `null` |

```javascript
expect(1 + 1).toBe(2);
expect({ a: 1 }).toEqual({ a: 1 });
expect('hello').toBeTruthy();
expect(null).toBeNull();
```

### Numeric Matchers

| Matcher | Description |
|---------|-------------|
| `.toBeGreaterThan(n)` | Value > n |
| `.toBeLessThan(n)` | Value < n |
| `.toBeGreaterThanOrEqual(n)` | Value >= n |
| `.toBeLessThanOrEqual(n)` | Value <= n |
| `.toBeCloseTo(n, precision)` | Floating point comparison |

```javascript
expect(10).toBeGreaterThan(5);
expect(3.14159).toBeCloseTo(3.14, 2);
```

### String/Array Matchers

| Matcher | Description |
|---------|-------------|
| `.toContain(item)` | String contains substring or array contains item |
| `.toHaveLength(n)` | Length equals n |
| `.toBeEmpty()` | Length is 0 |
| `.toMatch(regex)` | Matches regular expression |
| `.toStartWith(str)` | Starts with string |
| `.toEndWith(str)` | Ends with string |

```javascript
expect('hello world').toContain('world');
expect([1, 2, 3]).toHaveLength(3);
expect('test@email.com').toMatch(/^\S+@\S+$/);
```

### Object Matchers

| Matcher | Description |
|---------|-------------|
| `.toHaveProperty(key)` | Has own property |
| `.toHaveProperty(key, value)` | Has property with value |

```javascript
expect({ name: 'John' }).toHaveProperty('name');
expect({ age: 30 }).toHaveProperty('age', 30);
```

### Error Matchers

| Matcher | Description |
|---------|-------------|
| `.toThrow()` | Function throws any error |
| `.toThrow(message)` | Error message contains string |
| `.toThrow(regex)` | Error message matches regex |
| `.toThrowError(ErrorType)` | Throws specific error type |

```javascript
expect(function() { throw new Error('fail'); }).toThrow();
expect(function() { throw new Error('invalid input'); }).toThrow('invalid');
expect(function() { throw new TypeError(); }).toThrowError(TypeError);
```

### DOM Matchers

| Matcher | Description |
|---------|-------------|
| `.toBeInDocument()` | Element is in the DOM |
| `.toHaveClass(name)` | Element has CSS class |
| `.toHaveAttribute(name)` | Element has attribute |
| `.toHaveAttribute(name, value)` | Attribute equals value |
| `.toHaveText(text)` | Element contains text |
| `.toBeVisible()` | Element is visible |
| `.toBeHidden()` | Element is hidden |
| `.toBeFocused()` | Element has focus |

```javascript
expect(document.body).toBeInDocument();
expect(button).toHaveClass('btn-primary');
expect(input).toHaveAttribute('type', 'text');
expect(heading).toHaveText('Welcome');
expect(modal).toBeHidden();
```

### Spy Matchers

| Matcher | Description |
|---------|-------------|
| `.toHaveBeenCalled()` | Spy was called at least once |
| `.toHaveBeenCalledTimes(n)` | Spy was called exactly n times |
| `.toHaveBeenCalledWith(args...)` | Spy was called with arguments |

```javascript
var callback = FunkyTests.spy();
doSomething(callback);
expect(callback).toHaveBeenCalled();
expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
```

### Negation

Use `.not` to negate any matcher:

```javascript
expect(5).not.toBe(10);
expect([]).not.toContain('x');
expect(element).not.toBeVisible();
```

---

## Spies

Spies track function calls and can stub return values.

### Creating Spies

```javascript
// Standalone spy
var callback = FunkyTests.spy();

// Spy with implementation
var mockFn = FunkyTests.spy(function(x) {
    return x * 2;
});

// Spy on object method
var spy = FunkyTests.spyOn(myObject, 'methodName');
```

### Spy Configuration

```javascript
var spy = FunkyTests.spy();

// Return a fixed value
spy.and.returnValue(42);

// Use a fake implementation
spy.and.callFake(function(x) {
    return x + 1;
});

// Call original (for spyOn)
spy.and.callThrough();
```

### Inspecting Calls

```javascript
var spy = FunkyTests.spy();
spy('a', 'b');
spy('c');

spy.calls.count();        // 2
spy.calls.argsFor(0);     // ['a', 'b']
spy.calls.first();        // ['a', 'b']
spy.calls.mostRecent();   // ['c']
spy.calls.all();          // [['a', 'b'], ['c']]
spy.calls.reset();        // Clear call history
```

### Restoring Spies

Spies are automatically restored after each test. To restore manually:

```javascript
FunkyTests.restoreAllSpies();
```

---

## Fake Timers

Control `setTimeout`, `setInterval`, and time-based code.

### Usage

```javascript
it('fires after delay', function() {
    FunkyTests.useFakeTimers();

    var fired = false;
    setTimeout(function() { fired = true; }, 1000);

    expect(fired).toBe(false);

    FunkyTests.advanceTimersByTime(1000);

    expect(fired).toBe(true);

    FunkyTests.useRealTimers();
});
```

### API

| Method | Description |
|--------|-------------|
| `useFakeTimers()` | Replace timer functions with fakes |
| `useRealTimers()` | Restore original timer functions |
| `advanceTimersByTime(ms)` | Move time forward by ms |
| `runAllTimers()` | Execute all pending timers |

Fake timers are automatically restored after each test.

---

## Test Fixtures

Fixtures manage DOM elements for testing.

### Pattern 1: Inline HTML

```javascript
var fixture;

beforeEach(function() {
    fixture = FunkyTests.fixture('<div id="container"></div>');
});

afterEach(function() {
    fixture.destroy();
});

it('finds element', function() {
    expect(fixture.query('#container')).not.toBeNull();
});
```

### Pattern 2: Dynamic HTML

For tests needing different HTML:

```javascript
var fixture;

beforeEach(function() {
    fixture = FunkyTests.fixture();  // No HTML
});

afterEach(function() {
    fixture.cleanup();  // Alias for destroy()
});

it('renders clock', function() {
    fixture.html('<span id="clock" data-clock></span>');
    Clock.init(fixture.query('#clock'));
    expect(fixture.query('#clock').textContent).not.toBe('');
});

it('renders timer', function() {
    fixture.html('<span id="timer"></span>');
    Clock.countdown(fixture.query('#timer'), 5000);
});
```

### Fixture API

| Property/Method | Description |
|-----------------|-------------|
| `fixture.el` | First child element (or container) |
| `fixture.container` | The fixture container element |
| `fixture.html(string)` | Set HTML content, returns fixture |
| `fixture.query(selector)` | Query single element |
| `fixture.queryAll(selector)` | Query all elements (returns Array) |
| `fixture.destroy()` | Remove fixture from DOM |
| `fixture.cleanup()` | Alias for destroy() |

---

## Event Simulation

Simulate user interactions with `FunkyTests.simulate`.

### Mouse Events

```javascript
FunkyTests.simulate.click(element);
FunkyTests.simulate.dblclick(element);
FunkyTests.simulate.mousedown(element);
FunkyTests.simulate.mouseup(element);
FunkyTests.simulate.mouseover(element);
FunkyTests.simulate.mouseout(element);
```

### Keyboard Events

```javascript
FunkyTests.simulate.keydown(element, { key: 'Enter' });
FunkyTests.simulate.keyup(element, { key: 'Escape' });
FunkyTests.simulate.keypress(element, { key: 'a' });

// With modifiers
FunkyTests.simulate.keydown(element, {
    key: 's',
    ctrlKey: true
});
```

### Form Events

```javascript
FunkyTests.simulate.input(input, 'new value');
FunkyTests.simulate.change(select);
FunkyTests.simulate.focus(input);
FunkyTests.simulate.blur(input);
FunkyTests.simulate.submit(form);
```

All methods accept either an element or a CSS selector string.

---

## Async Testing

### Promises

Return a Promise from your test:

```javascript
it('fetches data', function() {
    return fetchData().then(function(data) {
        expect(data).toBeDefined();
    });
});
```

### delay()

Wait for a specified time:

```javascript
it('shows after animation', function() {
    triggerAnimation();

    return FunkyTests.delay(300).then(function() {
        expect(element).toBeVisible();
    });
});
```

### waitFor()

Wait for a condition or element:

```javascript
it('waits for element', function() {
    triggerLoad();

    return FunkyTests.waitFor('.loaded-content').then(function(el) {
        expect(el).toBeInDocument();
    });
});

it('waits for condition', function() {
    return FunkyTests.waitFor(function() {
        return document.querySelectorAll('.item').length >= 5;
    }).then(function() {
        expect(true).toBe(true);
    });
});
```

Options:
```javascript
FunkyTests.waitFor(condition, {
    timeout: 5000,   // Max wait time (default: 5000ms)
    interval: 50     // Check interval (default: 50ms)
});
```

### waitForEvent()

Wait for a DOM event:

```javascript
it('waits for custom event', function() {
    setTimeout(function() {
        element.dispatchEvent(new CustomEvent('loaded'));
    }, 100);

    return FunkyTests.waitForEvent(element, 'loaded').then(function(event) {
        expect(event.type).toBe('loaded');
    });
});
```

### Done Callback

For callback-style async:

```javascript
it('calls back', function(done) {
    fetchData(function(error, result) {
        expect(error).toBeNull();
        expect(result).toBeDefined();
        done();
    });
});

// With error
it('handles error', function(done) {
    fetchData(function(error) {
        expect(error).toBeDefined();
        done();
    });
});
```

---

## Configuration

### configure(options)

```javascript
FunkyTests.configure({
    timeout: 10000,      // Async timeout (default: 5000)
    stopOnFail: true,    // Stop on first failure
    verbose: true,       // Show all assertions
    filter: /Cache/      // Only run matching tests
});
```

### Custom Reporter

```javascript
FunkyTests.setReporter({
    start: function() {},
    suiteStart: function(suite, indent) {},
    suiteEnd: function(suite, indent) {},
    testStart: function(test, suite, indent) {},
    testPass: function(test, duration, indent) {},
    testFail: function(test, error, duration, indent) {},
    testSkip: function(test, indent) {},
    end: function(results) {}
});
```

---

## Running Tests

### In Test Runner UI

Navigate to `/test-runner` for the visual test runner.

### Programmatically

```javascript
// Run all tests
FunkyTests.runAll().then(function(results) {
    console.log(results.passed, 'passed');
    console.log(results.failed, 'failed');
});

// Run specific suite
FunkyTests.run('Cache');

// Run with filter
FunkyTests.runAll({ filter: /API/ });
```

### Auto-run

Add `?test=1` to any page URL to automatically run tests on load.

---

## API Reference

### Suite Definition
- `describe(name, fn)` - Create test suite
- `it(name, fn)` / `test(name, fn)` - Define test
- `xit(name, fn)` / `skip(name, fn)` - Skip test

### Hooks
- `beforeEach(fn)` - Before each test
- `afterEach(fn)` - After each test
- `beforeAll(fn)` - Before all tests
- `afterAll(fn)` - After all tests

### Assertions
- `expect(actual)` - Create expectation

### Spies
- `spy(implementation?)` - Create spy function
- `spyOn(object, method)` - Spy on method
- `restoreAllSpies()` - Restore all spies

### Fake Timers
- `useFakeTimers()` - Enable fake timers
- `useRealTimers()` - Restore real timers
- `advanceTimersByTime(ms)` - Advance time
- `runAllTimers()` - Run all pending timers

### Utilities
- `fixture(html?)` - Create test fixture
- `simulate.*` - Event simulation
- `delay(ms)` - Promise-based delay
- `waitFor(condition, opts)` - Wait for condition
- `waitForEvent(el, type, opts)` - Wait for event

### Running
- `runAll(options)` - Run all tests
- `run(name)` - Run matching suites
- `reset()` - Clear all suites
- `configure(options)` - Set options
- `setReporter(reporter)` - Custom reporter

### Info
- `getSuites()` - Get registered suites
- `getTestCount(filter?)` - Count tests
- `version` - Framework version

---

## Specialized Test Utilities

FunkyTests includes specialized utilities for different testing scenarios. These are loaded from separate utility files.

### E2E Utilities (`FunkyTests.E2E`)

End-to-end testing helpers for simulating user interactions.

#### Selectors

```javascript
// Find by test ID
var el = FunkyTests.E2E.getByTestId('submit-btn');

// Find by ARIA role
var dialog = FunkyTests.E2E.getByRole('dialog');
var btn = FunkyTests.E2E.getByRole('button', { name: 'Save' });

// Find by label text
var input = FunkyTests.E2E.getByLabelText('Email');

// Find by placeholder
var search = FunkyTests.E2E.getByPlaceholder('Search...');

// Find by text content
var heading = FunkyTests.E2E.getByText('Welcome');
var exact = FunkyTests.E2E.getByText('Submit', { exact: true });

// Find button/link by text
var saveBtn = FunkyTests.E2E.getButton('Save');
var link = FunkyTests.E2E.getLink('Learn more');
```

#### Interactions

```javascript
// Type into input
FunkyTests.E2E.type('#email', 'user@example.com');
FunkyTests.E2E.type('#password', 'secret', { delay: 50 }); // Character by character

// Clear input
FunkyTests.E2E.clear('#search');

// Click element
FunkyTests.E2E.click('#submit-btn');
FunkyTests.E2E.click(element);

// Select option
FunkyTests.E2E.select('#country', 'US');

// Check/uncheck
FunkyTests.E2E.check('#terms');
FunkyTests.E2E.uncheck('#newsletter');
```

#### Waiting

```javascript
// Wait for element to appear
FunkyTests.E2E.waitForElement('.success-message').then(function(el) {
    expect(el).toHaveText('Saved!');
});

// Wait for element to disappear
FunkyTests.E2E.waitForElementToDisappear('.loading');

// Wait for URL change
FunkyTests.E2E.waitForUrl('/dashboard');
```

---

### Performance Utilities (`FunkyTests.Perf`)

Performance measurement and benchmarking tools.

#### Timing

```javascript
// Measure sync operation
var result = FunkyTests.Perf.measure(function() {
    // Code to measure
}, 100); // iterations
// result: { total, average, iterations }

// Measure async operation
FunkyTests.Perf.measureAsync(function() {
    return fetchData();
}).then(function(result) {
    console.log('Duration:', result.duration);
});

// Benchmark with warmup and statistics
var stats = FunkyTests.Perf.benchmark('DOM creation', function() {
    document.createElement('div');
}, { warmup: 10, iterations: 1000 });
// stats: { min, max, mean, median, p95, p99 }
```

#### Assertions

```javascript
// Assert operation completes within time limit
FunkyTests.Perf.assertFasterThan(function() {
    renderComponent();
}, 16); // milliseconds
```

#### Frame Rate

```javascript
// Measure frame rate during animation
FunkyTests.Perf.measureFrameRate(function() {
    startAnimation();
}, 1000).then(function(result) {
    expect(result.fps).toBeGreaterThan(55);
    // result: { frames, duration, fps, smooth }
});

// Detect frame drops
FunkyTests.Perf.detectFrameDrops(function() {
    heavyAnimation();
}, 1000).then(function(result) {
    expect(result.dropRate).toBeLessThan(0.1);
    // result: { totalFrames, droppedFrames, dropRate }
});
```

#### Memory

```javascript
// Check for memory leaks
var leak = FunkyTests.Perf.checkForLeaks(function() {
    createWidget();
}, 100);

if (leak) {
    expect(leak.delta).toBeLessThan(1024 * 1024); // 1MB
}
```

---

### Visual Utilities (`FunkyTests.Visual`)

Visual regression testing with canvas-based screenshot comparison.

#### Capture

```javascript
// Capture element screenshot
FunkyTests.Visual.capture(element).then(function(result) {
    // result: { canvas, imageData, dataUrl, width, height }
});

// Capture with options
FunkyTests.Visual.capture(element, {
    width: 300,
    height: 200,
    scale: 2  // Retina
});
```

#### Baseline Comparison

```javascript
// Compare against stored baseline
FunkyTests.Visual.assertMatchesBaseline(element, 'button-primary', {
    threshold: 0.01  // 1% difference allowed
}).then(function(result) {
    expect(result.match).toBe(true);
});

// Update baseline (run once to save)
FunkyTests.Visual.saveBaseline(element, 'button-primary');
```

#### Direct Comparison

```javascript
// Compare two image data objects
var result = FunkyTests.Visual.compare(imageData1, imageData2, {
    threshold: 0.01
});
// result: { match, diffPercent, diffPixels, diffCanvas }
```

---

### Accessibility Utilities (`FunkyTests.A11y`)

WCAG 2.1 AA compliance checking utilities.

#### Color Contrast

```javascript
// Check contrast ratio
var result = FunkyTests.A11y.checkContrast('#333333', '#ffffff');
// result: { ratio, aa, aaLarge, aaa, aaaLarge }

expect(result.aa).toBe(true);      // 4.5:1 for normal text
expect(result.aaLarge).toBe(true); // 3:1 for large text
```

#### Focus Management

```javascript
// Get all focusable elements
var focusable = FunkyTests.A11y.getFocusableElements(container);

// Check if element is in tab order
expect(FunkyTests.A11y.isInTabOrder(button)).toBe(true);

// Validate focus order (check for positive tabindex)
var issues = FunkyTests.A11y.validateFocusOrder(container);
expect(issues).toHaveLength(0);
```

#### ARIA Validation

```javascript
// Check images for alt text
var imageIssues = FunkyTests.A11y.checkImages(container);
expect(imageIssues).toHaveLength(0);

// Check form labels
var labelIssues = FunkyTests.A11y.checkFormLabels(container);
expect(labelIssues).toHaveLength(0);

// Check heading hierarchy
var headingIssues = FunkyTests.A11y.checkHeadings(container);
expect(headingIssues).toHaveLength(0);

// Check ARIA attributes
var ariaIssues = FunkyTests.A11y.checkAriaAttributes(container);
expect(ariaIssues).toHaveLength(0);
```

#### Keyboard Navigation

```javascript
// Test focus trap
FunkyTests.A11y.assertFocusTrapped(modal);

// Test arrow key navigation
FunkyTests.A11y.assertArrowNavigation(menu, {
    orientation: 'vertical'
});
```

---

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Use fixtures** - Put DOM in fixtures for automatic cleanup
3. **Clean up** - Always clean up in `afterEach`
4. **Descriptive names** - Write clear test descriptions
5. **Single assertion** - Prefer one logical assertion per test
6. **Avoid timeouts** - Use `waitFor` instead of `delay` when possible

---

## See Also

- [Test Runner](./test-runner.md) - Visual test runner UI
