# Funky Frame - Testing

> FunkyTests framework for browser-based testing.

## Running Tests

Open in browser:
```
/test-runner/
```

This loads the test runner UI where you can:
- Run all tests
- Filter by test file or description
- View pass/fail results
- See error details and stack traces

---

## Test File Structure

```javascript
/**
 * ComponentName Tests
 */
(function() {
    'use strict';

    var describe = FunkyTests.describe;
    var it = FunkyTests.it;
    var expect = FunkyTests.expect;
    var beforeEach = FunkyTests.beforeEach;
    var afterEach = FunkyTests.afterEach;

    describe('Funky.ComponentName', function() {
        var container;
        var instance;

        beforeEach(function() {
            // Setup before each test
            container = document.createElement('div');
            container.id = 'test-container';
            document.body.appendChild(container);
        });

        afterEach(function() {
            // Cleanup after each test
            if (instance && instance.destroy) {
                instance.destroy();
            }
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        describe('initialization', function() {
            it('should create instance', function() {
                instance = Funky.ComponentName.init('#test-container', {});
                expect(instance).toBeTruthy();
            });

            it('should apply config options', function() {
                instance = Funky.ComponentName.init('#test-container', {
                    option: 'value'
                });
                expect(instance.config.option).toBe('value');
            });
        });

        describe('methods', function() {
            beforeEach(function() {
                instance = Funky.ComponentName.init('#test-container', {});
            });

            it('should have required methods', function() {
                expect(typeof instance.destroy).toBe('function');
            });
        });
    });
})();
```

---

## Test File Location

```
public/assets/js/dev/tests/
├── core/                    # Core module tests
│   ├── dom.test.js
│   ├── events.test.js
│   └── ...
├── components/              # Component tests
│   ├── toast.test.js
│   ├── table.test.js
│   └── ...
└── integration/             # Integration tests
    └── ...
```

---

## FunkyTests API

### describe(name, fn)
Groups related tests.

```javascript
describe('Feature', function() {
    describe('sub-feature', function() {
        // nested group
    });
});
```

### it(name, fn)
Defines a single test.

```javascript
it('should do something', function() {
    // test code
});
```

### beforeEach(fn) / afterEach(fn)
Run before/after each test in the current describe block.

```javascript
beforeEach(function() {
    // setup
});

afterEach(function() {
    // teardown
});
```

### beforeAll(fn) / afterAll(fn)
Run once before/after all tests in the current describe block.

---

## Expect API

### Equality
```javascript
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).not.toBe(expected);       // Negation
```

### Truthiness
```javascript
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();
```

### Numbers
```javascript
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeLessThanOrEqual(5);
expect(value).toBeCloseTo(0.3, 2);      // 2 decimal precision
```

### Strings
```javascript
expect(string).toContain('substring');
expect(string).toMatch(/regex/);
```

### Arrays
```javascript
expect(array).toContain(item);
expect(array).toHaveLength(3);
```

### Types
```javascript
expect(typeof value).toBe('function');
expect(value instanceof ClassName).toBe(true);
```

### Exceptions
```javascript
expect(function() {
    throw new Error('oops');
}).toThrow();

expect(function() {
    throw new Error('oops');
}).toThrowError('oops');
```

---

## Testing Components

### DOM Testing
```javascript
it('should render element', function() {
    instance = Funky.Component.init('#container', {});
    
    var element = container.querySelector('.component-class');
    expect(element).toBeTruthy();
    expect(element.textContent).toContain('expected text');
});
```

### Event Testing
```javascript
it('should trigger callback on click', function() {
    var clicked = false;
    instance = Funky.Component.init('#container', {
        onClick: function() {
            clicked = true;
        }
    });
    
    var button = container.querySelector('button');
    button.click();
    
    expect(clicked).toBe(true);
});
```

### Async Testing
```javascript
it('should load data', function(done) {
    instance = Funky.Component.init('#container', {
        onLoad: function(data) {
            expect(data).toBeTruthy();
            done();  // Signal test complete
        }
    });
});

// Or with timeout
it('should update after delay', function(done) {
    instance.startAnimation();
    
    setTimeout(function() {
        expect(instance.isAnimating).toBe(false);
        done();
    }, 500);
});
```

---

## Test Fixtures

Create reusable test data:

```javascript
var fixtures = {
    sampleData: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
    ],
    
    createContainer: function() {
        var div = document.createElement('div');
        div.id = 'test-' + Date.now();
        document.body.appendChild(div);
        return div;
    }
};
```

---

## Common Test Patterns

### Testing Static Methods
```javascript
it('should have getInstance', function() {
    instance = Funky.Component.init('#container', { id: 'test-id' });
    
    var retrieved = Funky.Component.getInstance('test-id');
    expect(retrieved).toBe(instance);
});
```

### Testing Cleanup
```javascript
it('should cleanup on destroy', function() {
    instance = Funky.Component.init('#container', {});
    var id = instance.id;
    
    instance.destroy();
    
    expect(Funky.Component.getInstance(id)).toBeNull();
    expect(container.children.length).toBe(0);
});
```

### Testing CSS Classes
```javascript
it('should add active class', function() {
    instance = Funky.Component.init('#container', {});
    
    instance.activate();
    
    expect(container.classList.contains('active')).toBe(true);
});
```
