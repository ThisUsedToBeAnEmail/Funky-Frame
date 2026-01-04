# Funky Test Runner

A modern UI for running FunkyTests in the browser with isolated execution via iframe sandbox.

## Overview

The Funky Test Runner provides a visual interface for executing JavaScript tests written with the FunkyTests framework. Tests run in an isolated iframe sandbox to prevent side effects from affecting the UI or other tests.

## Quick Start

Navigate to `/test-runner` in your browser to access the test runner UI.

```
http://localhost:3000/test-runner
```

## Features

- **Isolated Execution**: Tests run in a sandboxed iframe using `Funky.Iframe`
- **Real-time Results**: Watch tests pass/fail as they execute
- **Suite Tree**: Hierarchical view of all test suites
- **Filter Tests**: Search tests by name
- **Error Details**: Slide-out panel with error messages and stack traces
- **Run Failed**: Re-run only failed tests
- **Progress Bar**: Visual progress with pass/fail coloring
- **Keyboard Shortcuts**: Quick access to common actions
- **Toast Notifications**: Summary notification on completion

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Test Runner UI                        │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │  Suite Tree  │  │  Stats Bar (pass/fail/skip/duration) │ │
│  │  (sidebar)   │  ├──────────────────────────────────────┤ │
│  │              │  │  Current Test Panel                  │ │
│  │  - Suite A   │  ├──────────────────────────────────────┤ │
│  │    - Suite B │  │  Test Results                        │ │
│  │  - Suite C   │  │    ├─ Suite A                        │ │
│  │              │  │    │   ├─ ✓ test 1                   │ │
│  │              │  │    │   └─ ✗ test 2  [Error]          │ │
│  │              │  │    └─ Suite C                        │ │
│  │              │  │        └─ ✓ test 3                   │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Sandbox Iframe (hidden, off-screen)                   │ │
│  │  - Loads Funky modules                                 │ │
│  │  - Loads test files                                    │ │
│  │  - Executes tests                                      │ │
│  │  - Reports results via postMessage                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Iframe Sandbox

Tests execute in an isolated iframe (`/test-runner/sandbox`) to:

1. **Prevent Side Effects**: DOM modifications, event handlers, and state changes don't affect the UI
2. **Clean Environment**: Each test run starts fresh
3. **Security**: Sandbox restrictions limit what test code can do

The sandbox uses `Funky.Iframe` with restricted permissions:

```javascript
Funky.Iframe.create(container, {
    src: '/test-runner/sandbox',
    mode: 'embed',
    sandbox: 'allow-scripts allow-same-origin',
    // ...
});
```

### PostMessage Communication

The UI and sandbox communicate via `postMessage`:

| Direction | Message | Description |
|-----------|---------|-------------|
| Sandbox → UI | `sandboxReady` | Sandbox loaded, ready for commands |
| UI → Sandbox | `loadTests` | Load specified test files |
| Sandbox → UI | `loadProgress` | File loading progress |
| Sandbox → UI | `ready` | All tests loaded, suites available |
| UI → Sandbox | `runTests` | Execute tests (optional filter) |
| Sandbox → UI | `testsStart` | Test run beginning |
| Sandbox → UI | `suiteStart` | Suite beginning |
| Sandbox → UI | `testStart` | Individual test starting |
| Sandbox → UI | `testPass` | Test passed |
| Sandbox → UI | `testFail` | Test failed (with error) |
| Sandbox → UI | `testSkip` | Test skipped |
| Sandbox → UI | `suiteEnd` | Suite complete |
| Sandbox → UI | `testsEnd` | All tests complete |

---

## UI Components

### Stats Bar

Displays real-time test statistics:

| Stat | Description |
|------|-------------|
| Total | Total number of tests |
| Passed | Tests that passed (green) |
| Failed | Tests that failed (red) |
| Skipped | Skipped tests (yellow) |
| Duration | Total execution time |
| Progress | Visual progress bar |

### Suite Tree (Sidebar)

- Hierarchical view of all `describe()` blocks
- Click to scroll to suite in results
- Visual status indicators:
  - Gray: Pending
  - Blue (pulsing): Running
  - Green: All passed
  - Red: Has failures

### Current Test Panel

Shows the currently executing test:

- Suite path (e.g., "Cache > API > get")
- Test name
- Spinning indicator

### Test Results

- Grouped by suite with collapsible sections
- Status icons:
  - ✓ Green check: Passed
  - ✗ Red X: Failed
  - ⊘ Yellow circle: Skipped
- Duration in milliseconds
- "Error" button for failed tests

### Error Panel

Slide-out panel showing:

- Test name
- Error message
- Stack trace

Close with the X button or Escape key.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Run all tests |
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Run failed tests |
| `Escape` | Close error panel |

---

## Adding Test Files

Test files are registered in the template at `templates/web/test_runner/index.html.ep`:

```html
<script>
  window.TEST_FILES = [
    // Core tests
    '/assets/js/dev/tests/core/framework.test.js',
    '/assets/js/dev/tests/core/registry.test.js',
    // Add new test files here
    '/assets/js/dev/tests/your-new.test.js',
  ];
</script>
```

Test files use the global API (exposed by FunkyTests):

```javascript
describe('MyComponent', function() {
    beforeEach(function() {
        // Setup
    });

    afterEach(function() {
        // Cleanup
    });

    it('should do something', function() {
        expect(true).toBe(true);
    });

    it('should equal value', function() {
        expect(1 + 1).toBe(2);
    });
});
```

---

## File Structure

```
lib/
└── Funky/
    └── Controller/
        └── Web/
            └── TestRunner.pm      # Controller

templates/
├── layouts/
│   └── minimal.html.ep            # Minimal layout (no sidebar)
└── web/
    └── test_runner/
        ├── index.html.ep          # Main UI template
        └── sandbox.html.ep        # Sandbox iframe page

public/assets/
├── css/
│   └── test-runner.css            # UI styles
└── js/
    └── dev/
        ├── test-framework.js      # FunkyTests framework
        ├── test-runner-ui.js      # UI controller
        └── tests/                 # Test files
            ├── core/
            ├── components/
            ├── integration/
            ├── a11y/
            ├── performance/
            ├── visual/
            └── e2e/
```

---

## Configuration

### Feature Flag

The test runner can be disabled via configuration:

```perl
# config/funky.conf
{
    features => {
        test_runner_enabled => 0,  # Disable test runner
    }
}
```

When disabled, `/test-runner` returns a 404 response.

### Route Security

The test runner route is public (no authentication required) but uses custom CSP headers to allow iframe embedding:

- `frame-ancestors 'self'` - Allows the sandbox iframe to load
- `X-Frame-Options: SAMEORIGIN` - Fallback for older browsers

These headers are set in `TestRunner.pm` for both the main page and sandbox routes.

---

## API Reference

### FunkyTestRunner (Global)

The test runner UI exposes a global `FunkyTestRunner` object for debugging:

```javascript
// Check if tests are running
FunkyTestRunner.isRunning;  // boolean

// Current stats
FunkyTestRunner.stats;
// { passed: 10, failed: 2, skipped: 1, total: 13, duration: 1.234 }

// All test results
FunkyTestRunner.testResults;  // Array

// Failed tests only
FunkyTestRunner.failedTests;  // Array

// Manually run all tests
FunkyTestRunner.runAllTests();

// Manually run failed tests
FunkyTestRunner.runFailedTests();
```

### Test Fixtures

The framework provides a `fixture()` helper for managing test DOM elements.

#### Pattern 1: Inline HTML (Original)

```javascript
var fixture;

beforeEach(function() {
    fixture = FunkyTests.fixture('<div id="my-container"></div>');
});

afterEach(function() {
    fixture.destroy();
});

it('should find element', function() {
    var el = fixture.query('#my-container');
    expect(el).not.toBeNull();
});
```

#### Pattern 2: Dynamic HTML (New)

For tests that need different HTML in each test:

```javascript
var fixture;

beforeEach(function() {
    fixture = FunkyTests.fixture();  // No HTML argument
});

afterEach(function() {
    fixture.cleanup();  // Alias for destroy()
});

it('should render clock', function() {
    fixture.html('<span id="clock" data-clock></span>');
    var el = fixture.query('#clock');
    Clock.init(el);
    expect(el.textContent).not.toBe('');
});

it('should render timer', function() {
    fixture.html('<span id="timer"></span>');
    Clock.countdown(fixture.query('#timer'), 5000);
    expect(fixture.query('#timer').textContent).toContain(':');
});
```

#### Fixture API

| Method | Description |
|--------|-------------|
| `fixture.html(htmlString)` | Set fixture HTML content, returns fixture for chaining |
| `fixture.query(selector)` | Query single element within fixture |
| `fixture.queryAll(selector)` | Query all elements (returns Array) |
| `fixture.el` | First child element (or container if empty) |
| `fixture.container` | The fixture container element |
| `fixture.destroy()` | Remove fixture from DOM |
| `fixture.cleanup()` | Alias for destroy() |

---

## Styling

The test runner uses Funky CSS variables for theming:

```css
.test-runner {
    background: var(--pro-bg-primary);
    color: var(--pro-text-primary);
}

.stat-passed .stat-value { color: var(--pro-accent-success); }
.stat-failed .stat-value { color: var(--pro-accent-danger); }
.stat-skipped .stat-value { color: var(--pro-accent-warning); }
```

See `public/assets/css/test-runner.css` for full styling.

---

## Extending

### Custom Reporter

The sandbox sets up a custom reporter to forward events. You can modify `sandbox.html.ep` to add additional reporting:

```javascript
FunkyTests.setReporter({
    testPass: function(test, duration, indent) {
        sendToParent('testPass', {
            name: test.name,
            duration: duration,
            // Add custom data
            customField: 'value'
        });
    },
    // ... other callbacks
});
```

### Test Framework Extensions

Add new assertions or utilities in `test-framework.js`:

```javascript
FunkyTests.assertContains = function(arr, item, msg) {
    var found = arr.indexOf(item) !== -1;
    FunkyTests.assert(found, msg || 'Expected array to contain item');
};
```

---

## Best Practices

1. **Isolate Tests**: Use `beforeEach`/`afterEach` to set up and tear down state
2. **Use the Fixture**: Place DOM elements in `#test-fixture` for automatic cleanup
3. **Async Tests**: Return a Promise for async tests; the framework will wait
4. **Descriptive Names**: Use clear, descriptive test names for better debugging
5. **Group Logically**: Organize tests into suites by feature or component

---

## Troubleshooting

### Tests not loading

1. Check browser console for script load errors
2. Verify file paths in `window.TEST_FILES`
3. Ensure test files have no syntax errors

### Sandbox errors

1. Check that all Funky modules are loaded in `sandbox.html.ep`
2. Verify postMessage origin validation

### Tests affecting each other

1. Add proper cleanup in `afterEach`
2. Clear `#test-fixture` between tests
3. Reset any global state

### Progress stuck

1. Check for infinite loops in tests
2. Look for unresolved Promises
3. Check browser console for errors

---

## Dependencies

- `Funky.Iframe` - Sandbox iframe management
- `Funky.Toast` - Completion notifications
- `FunkyTests` - Test framework
- Funky CSS theme system

---

---

## Command-Line Test Runner

Run FunkyTests from the command line using headless Chrome for CI/CD integration. Tests run inside a Docker container with Chrome pre-installed.

### Quick Start

```bash
# Build the test image (first time only)
make build-test

# Run all JavaScript tests
make test-js

# Verbose output (see each test)
make test-js-verbose

# Filter to specific suite
make test-js-filter FILTER=Modal
```

### Docker-Based Testing

Tests run inside a dedicated Docker container (`funky-test`) that includes:

- Chromium browser for headless testing
- `WWW::Mechanize::Chrome` Perl module
- `Imager` for visual regression testing

This keeps the main app image lean and fast to build (~15s vs ~67s with Chrome).

### Docker Images

| Image | Contents | Build Time |
|-------|----------|------------|
| `funky` | App only (Mojolicious, Mojo::Pg) | ~15 seconds |
| `funky-test` | App + Chrome + Imager | ~60 seconds |

The test image is a standalone build (not extending the app image) to avoid Docker naming issues.

### Usage

#### Using Make (Recommended)

```bash
make build-test                   # Build test image (first time)
make test-js                      # Run all tests
make test-js-verbose              # Show each test name
make test-js-filter FILTER=Toast  # Filter by suite
```

#### Using docker compose directly

```bash
# Build test image
docker compose --profile test build test

# Run tests
docker compose --profile test run --rm test prove -l t/js-tests.t

# Run with filter
docker compose --profile test run --rm test prove -l t/js-tests.t :: --filter=Modal
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_BASE_URL` | `http://funky:3000` | Application URL (Docker network) |
| `JS_TEST_TIMEOUT` | `300` | Seconds before timeout (default 5 minutes) |

### Output

The test runner outputs TAP (Test Anything Protocol):

```
1..47
ok 1 - Funky.Modal > init() > creates backdrop
ok 2 - Funky.Modal > show() > displays modal
not ok 3 - Funky.Modal > close() > removes element
#   Error: Expected element to be null
ok 4 - Funky.Toast > show() > displays message
...
```

### Architecture

```
make test-js
  └── docker compose --profile test run --rm test
        └── funky-test container (with Chrome)
              └── prove -l t/js-tests.t
                    └── Funky::Test::JSRunner
                          └── WWW::Mechanize::Chrome (headless)
                                └── http://funky:3000/test-runner/sandbox?autorun=1
                                      └── FunkyTests (in-browser)
```

### Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│  funky-network                                              │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ postgres │◄───│  funky   │◄───│   test   │              │
│  │  :5432   │    │  :3000   │    │ (Chrome) │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                             │
│  TEST_BASE_URL=http://funky:3000                           │
└─────────────────────────────────────────────────────────────┘
```

The test container connects to the `funky` app via Docker's internal network.

### CI/CD Integration

#### GitHub Actions

```yaml
- name: Build test image
  run: make build-test

- name: Start services
  run: docker compose up -d

- name: Run JS tests
  run: make test-js
```

#### GitLab CI

```yaml
js-tests:
  services:
    - postgres:15-alpine
  script:
    - docker compose up -d funky
    - make build-test
    - make test-js
```

### Visual Regression Testing

The test image also supports screenshot-based visual regression testing:

```bash
# Capture baseline screenshots
make test-visual-baseline

# Run visual comparison tests
make test-visual
```

See [Phase 8: Visual Regression](../../../plan_cmd_js/phase8-visual-regression.md) for details.

### Troubleshooting

#### Test image not built

```bash
# Build the test image first
make build-test
```

#### Funky app not running

```bash
# Start the app before running tests
docker compose up -d
make test-js
```

#### Timeout errors

The test container sets `TEST_BASE_URL=http://funky:3000` automatically. If tests timeout, ensure the funky service is healthy:

```bash
docker compose ps
docker compose logs funky
```

#### Rebuild after changes

If you modify test dependencies or Dockerfile.test:

```bash
make build-test
```

---

## See Also

- [Test Framework](./test-framework.md) - FunkyTests API reference
- [Iframe Component](../components/iframe.md) - Funky.Iframe documentation
- [A11y Validator](./a11y-validator.md) - Accessibility validation tool
