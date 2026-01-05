# Phase 6: Testing and Build Integration

Add tests and integrate into the build system.

## Checklist

- [ ] Add component to Makefile JS bundle
- [ ] Add CSS to Makefile CSS bundle
- [ ] Create responsive test file `js/dev/tests/responsive/mobile-core.test.js`
- [ ] Create accessibility test file `js/dev/tests/a11y/mobile-core.test.js`
- [ ] Test MediaQuery breakpoint transitions
- [ ] Test action registration/unregistration
- [ ] Test overflow menu open/close
- [ ] Test keyboard navigation in overflow
- [ ] Test with sidenav component present
- [ ] Test with command palette present
- [ ] Test safe-area-inset on iOS

## Makefile Updates

```makefile
# Add to JS bundle
JS_COMPONENTS += js/components/mobile-core.js

# Add to CSS bundle
CSS_COMPONENTS += css/mobile-core.css
```

## Responsive Tests

```javascript
// js/dev/tests/responsive/mobile-core.test.js
describe('Funky.MobileCore Responsive', function() {

  beforeEach(function() {
    Funky.MobileCore.destroy();
  });

  describe('breakpoint behavior', function() {
    it('should be hidden on desktop (> 767px)', function() {
      setViewport(1024);
      Funky.MobileCore.init();
      expect(Funky.MobileCore.isVisible()).toBe(false);
    });

    it('should be visible on mobile (<= 767px)', function() {
      setViewport(375);
      Funky.MobileCore.init();
      expect(Funky.MobileCore.isVisible()).toBe(true);
    });

    it('should show/hide on viewport resize', function() {
      setViewport(1024);
      Funky.MobileCore.init();
      expect(Funky.MobileCore.isVisible()).toBe(false);

      setViewport(375);
      expect(Funky.MobileCore.isVisible()).toBe(true);

      setViewport(1024);
      expect(Funky.MobileCore.isVisible()).toBe(false);
    });
  });

  describe('action overflow', function() {
    it('should show More button when actions exceed max', function() {
      Funky.MobileCore.init({ maxVisibleActions: 3 });

      for (var i = 0; i < 5; i++) {
        Funky.MobileCore.registerAction({
          id: 'action-' + i,
          icon: 'fas fa-star',
          label: 'Action ' + i
        });
      }

      var moreBtn = document.querySelector('[data-action="more"]');
      expect(moreBtn).toBeTruthy();
    });
  });
});
```

## Accessibility Tests

```javascript
// js/dev/tests/a11y/mobile-core.test.js
describe('Funky.MobileCore Accessibility', function() {

  beforeEach(function() {
    setViewport(375);
    Funky.MobileCore.init();
  });

  describe('ARIA attributes', function() {
    it('should have role="navigation"', function() {
      var nav = document.querySelector('.mobile-core');
      expect(nav.getAttribute('role')).toBe('navigation');
    });

    it('should have aria-label', function() {
      var nav = document.querySelector('.mobile-core');
      expect(nav.getAttribute('aria-label')).toBe('Mobile navigation');
    });

    it('should have aria-expanded on More button', function() {
      // Register enough actions to show More
      for (var i = 0; i < 10; i++) {
        Funky.MobileCore.registerAction({ id: 'a' + i, icon: 'fas fa-star', label: 'A' + i });
      }

      var moreBtn = document.querySelector('[data-action="more"]');
      expect(moreBtn.getAttribute('aria-expanded')).toBe('false');

      moreBtn.click();
      expect(moreBtn.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('keyboard navigation', function() {
    it('should close overflow on Escape', function() {
      // Register enough actions to show More
      for (var i = 0; i < 10; i++) {
        Funky.MobileCore.registerAction({ id: 'a' + i, icon: 'fas fa-star', label: 'A' + i });
      }

      var moreBtn = document.querySelector('[data-action="more"]');
      moreBtn.click();

      var overflow = document.querySelector('.mobile-core__overflow');
      expect(overflow.classList.contains('mobile-core__overflow--open')).toBe(true);

      simulateKeydown('Escape');
      expect(overflow.classList.contains('mobile-core__overflow--open')).toBe(false);
    });

    it('should focus first overflow action when opening', function() {
      // Register enough actions
      for (var i = 0; i < 10; i++) {
        Funky.MobileCore.registerAction({ id: 'a' + i, icon: 'fas fa-star', label: 'A' + i });
      }

      document.querySelector('[data-action="more"]').click();

      var firstAction = document.querySelector('.mobile-core__overflow-action');
      expect(document.activeElement).toBe(firstAction);
    });
  });

  describe('touch targets', function() {
    it('should have minimum 48px touch targets', function() {
      var actions = document.querySelectorAll('.mobile-core__action');
      actions.forEach(function(action) {
        var rect = action.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(48);
      });
    });
  });
});
```

## Integration Tests

```javascript
// Test with SideNav
describe('MobileCore + SideNav Integration', function() {
  it('should auto-register sidenav toggle when sidenav exists', function() {
    // Create sidenav element
    var sidenav = document.createElement('aside');
    sidenav.className = 'funky-sidenav';
    sidenav.id = 'test-sidenav';
    document.body.appendChild(sidenav);

    Funky.SideNav.init({ container: '#test-sidenav' });
    Funky.MobileCore.init();

    var toggleBtn = document.querySelector('[data-action="sidenav-toggle"]');
    expect(toggleBtn).toBeTruthy();
  });
});
```

## Manual Test Checklist

- [ ] Test on iOS Safari (safe-area-inset)
- [ ] Test on Android Chrome
- [ ] Test with screen reader (VoiceOver/TalkBack)
- [ ] Test touch interactions
- [ ] Test overflow menu gestures
- [ ] Test with various numbers of actions (1, 5, 10, 20)
- [ ] Test landscape orientation
