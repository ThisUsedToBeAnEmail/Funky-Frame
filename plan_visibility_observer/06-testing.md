# Phase 6: Testing and Documentation

Add tests and documentation for the VisibilityObserver utility.

## Checklist

- [x] Add unit tests for VisibilityObserver
- [x] Test migration in page-animate
- [x] Test migration in sticky-header
- [x] Test migration in table
- [x] Test migration in card-grid
- [ ] Add to Makefile/build (if needed)
- [ ] Update component documentation (optional)

## Unit Tests

Create `js/dev/tests/core/visibility-observer.test.js`:

```javascript
describe('Funky.VisibilityObserver', function() {

  describe('create()', function() {
    it('should create an observer instance', function() {
      var observer = Funky.VisibilityObserver.create();
      expect(observer).toBeDefined();
      expect(observer.observe).toBeDefined();
      observer.destroy();
    });

    it('should accept threshold option', function() {
      var observer = Funky.VisibilityObserver.create({ threshold: 0.5 });
      expect(observer._config.threshold).toBe(0.5);
      observer.destroy();
    });

    it('should accept rootMargin option', function() {
      var observer = Funky.VisibilityObserver.create({ rootMargin: '100px' });
      expect(observer._config.rootMargin).toBe('100px');
      observer.destroy();
    });
  });

  describe('observe()', function() {
    var observer;
    var testElement;

    beforeEach(function() {
      testElement = document.createElement('div');
      testElement.id = 'test-element';
      document.body.appendChild(testElement);
      observer = Funky.VisibilityObserver.create();
    });

    afterEach(function() {
      observer.destroy();
      testElement.remove();
    });

    it('should observe an element by selector', function() {
      observer.observe('#test-element');
      expect(observer.count()).toBe(1);
    });

    it('should observe an element reference', function() {
      observer.observe(testElement);
      expect(observer.count()).toBe(1);
    });

    it('should not observe the same element twice', function() {
      observer.observe(testElement);
      observer.observe(testElement);
      expect(observer.count()).toBe(1);
    });

    it('should return self for chaining', function() {
      var result = observer.observe(testElement);
      expect(result).toBe(observer);
    });
  });

  describe('observeAll()', function() {
    var observer;

    beforeEach(function() {
      for (var i = 0; i < 3; i++) {
        var el = document.createElement('div');
        el.className = 'test-class';
        document.body.appendChild(el);
      }
      observer = Funky.VisibilityObserver.create();
    });

    afterEach(function() {
      observer.destroy();
      document.querySelectorAll('.test-class').forEach(function(el) {
        el.remove();
      });
    });

    it('should observe multiple elements', function() {
      observer.observeAll('.test-class');
      expect(observer.count()).toBe(3);
    });
  });

  describe('observeOnce()', function() {
    it('should set once option to true', function() {
      var observer = Funky.VisibilityObserver.create();
      var el = document.createElement('div');
      document.body.appendChild(el);

      observer.observeOnce(el);
      var opts = observer._elements.get(el);
      expect(opts.once).toBe(true);

      observer.destroy();
      el.remove();
    });
  });

  describe('unobserve()', function() {
    it('should stop observing an element', function() {
      var observer = Funky.VisibilityObserver.create();
      var el = document.createElement('div');
      document.body.appendChild(el);

      observer.observe(el);
      expect(observer.count()).toBe(1);

      observer.unobserve(el);
      expect(observer.count()).toBe(0);

      observer.destroy();
      el.remove();
    });
  });

  describe('isVisible()', function() {
    it('should return false for unobserved elements', function() {
      var observer = Funky.VisibilityObserver.create();
      var el = document.createElement('div');
      expect(observer.isVisible(el)).toBe(false);
      observer.destroy();
    });
  });

  describe('getVisible()', function() {
    it('should return empty array initially', function() {
      var observer = Funky.VisibilityObserver.create();
      expect(observer.getVisible()).toEqual([]);
      observer.destroy();
    });
  });

  describe('destroy()', function() {
    it('should clean up all state', function() {
      var observer = Funky.VisibilityObserver.create();
      var el = document.createElement('div');
      document.body.appendChild(el);

      observer.observe(el);
      observer.destroy();

      expect(observer._observer).toBeNull();
      expect(observer._elements.size).toBe(0);
      expect(observer._visibleSet.size).toBe(0);

      el.remove();
    });
  });

  describe('callbacks', function() {
    it('should call onVisible when element becomes visible', function(done) {
      var el = document.createElement('div');
      el.style.cssText = 'width: 100px; height: 100px;';
      document.body.appendChild(el);

      var observer = Funky.VisibilityObserver.create({
        onVisible: function(element) {
          expect(element).toBe(el);
          observer.destroy();
          el.remove();
          done();
        }
      });

      observer.observe(el);
    });
  });

});
```

## Integration Tests

### Test page-animate migration
```javascript
describe('PageAnimate with VisibilityObserver', function() {
  it('should animate elements on scroll into view', function() {
    // Create element with data-animate-trigger="in-view"
    // Scroll into view
    // Verify animation class applied
  });
});
```

### Test sticky-header migration
```javascript
describe('StickyHeader with VisibilityObserver', function() {
  it('should add is-sticky class when scrolled', function() {
    // Create sticky header
    // Scroll down
    // Verify is-sticky class added
  });
});
```

## Makefile Updates

```makefile
# Add to core JS bundle
JS_CORE += js/core/visibility-observer.js
```

## Documentation

Add to `md/js/core/visibility-observer.md`:

```markdown
# VisibilityObserver

A centralized utility for tracking element visibility using IntersectionObserver.

## Usage

\`\`\`javascript
// Create an observer
var observer = Funky.VisibilityObserver.create({
  threshold: 0.1,
  rootMargin: '0px',
  onVisible: function(element, entry) {
    console.log('Element visible:', element);
  },
  onHidden: function(element, entry) {
    console.log('Element hidden:', element);
  }
});

// Observe a single element
observer.observe('#my-element');

// Observe with one-shot (auto-unobserve after visible)
observer.observeOnce('.animate-on-scroll', function(el) {
  el.classList.add('animated');
});

// Observe multiple elements
observer.observeAll('.lazy-image');

// Query visibility
if (observer.isVisible(myElement)) {
  // Do something
}

// Get all visible elements
var visible = observer.getVisible();

// Cleanup
observer.destroy();
\`\`\`

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| threshold | number | 0.1 | Visibility threshold (0-1) |
| rootMargin | string | '0px' | Margin around viewport |
| root | Element | null | Scroll container (null = viewport) |
| onVisible | function | null | Called when element becomes visible |
| onHidden | function | null | Called when element becomes hidden |

## Methods

| Method | Description |
|--------|-------------|
| observe(selector, options) | Start observing an element |
| observeOnce(selector, callback) | Observe until visible once |
| observeAll(selector, options) | Observe multiple elements |
| unobserve(selector) | Stop observing |
| isVisible(element) | Check if element is visible |
| getVisible() | Get all visible elements |
| count() | Get number of observed elements |
| destroy() | Clean up and disconnect |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| funky:visibility:visible | { element, entry, observerId } | Element became visible |
| funky:visibility:hidden | { element, entry, observerId } | Element became hidden |
```
