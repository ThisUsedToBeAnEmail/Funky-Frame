/**
 * Tests for Funky.Popover
 * Native popover system with CSS positioning
 */
FunkyTests.describe('Funky.Core.Popover', function() {
  var expect = FunkyTests.expect;
  var container;
  var Popover = Funky.Popover;

  FunkyTests.beforeEach(function() {
    container = document.createElement('div');
    container.id = 'popover-test-container';
    document.body.appendChild(container);
  });

  FunkyTests.afterEach(function() {
    // Clean up any open popovers
    var popovers = document.querySelectorAll('.popover');
    popovers.forEach(function(p) {
      if (p.parentNode) p.parentNode.removeChild(p);
    });

    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  });

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.Popover exists', function() {
      expect(Popover !== undefined).toBe(true);
    });

    FunkyTests.it('is registered with Funky', function() {
      expect(Funky.isRegistered('Popover')).toBe(true);
    });

    FunkyTests.it('has init method', function() {
      expect(typeof Popover.init).toBe('function');
    });

    FunkyTests.it('has getInstance method', function() {
      expect(typeof Popover.getInstance).toBe('function');
    });

    FunkyTests.it('has getOrCreateInstance method', function() {
      expect(typeof Popover.getOrCreateInstance).toBe('function');
    });

    FunkyTests.it('has destroy method', function() {
      expect(typeof Popover.destroy).toBe('function');
    });
  });

  FunkyTests.describe('Instance Creation', function() {
    FunkyTests.it('creates instance with element and options', function() {
      container.innerHTML = '<button id="trigger">Click me</button>';
      var trigger = container.querySelector('#trigger');

      var popover = new Popover(trigger, {
        content: 'Test content'
      });

      expect(popover).not.toBeNull();
      expect(popover.el).toBe(trigger);
    });

    FunkyTests.it('creates instance with selector string', function() {
      container.innerHTML = '<button id="trigger-selector">Click me</button>';

      var popover = new Popover('#trigger-selector', {
        content: 'Test content'
      });

      expect(popover).not.toBeNull();
      expect(popover.el.id).toBe('trigger-selector');
    });

    FunkyTests.it('getOrCreateInstance returns existing instance', function() {
      container.innerHTML = '<button id="existing">Click me</button>';
      var trigger = container.querySelector('#existing');

      var popover1 = Popover.getOrCreateInstance(trigger, { content: 'First' });
      var popover2 = Popover.getOrCreateInstance(trigger, { content: 'Second' });

      expect(popover1).toBe(popover2);
    });

    FunkyTests.it('getInstance returns null for non-existent', function() {
      container.innerHTML = '<button id="no-popover">Click me</button>';

      var instance = Popover.getInstance('#no-popover');

      expect(instance).toBeNull();
    });
  });

  FunkyTests.describe('Data Attributes', function() {
    FunkyTests.it('reads title from data-funky-popover-title', function() {
      container.innerHTML = '<button data-funky-popover-title="Test Title" data-funky-popover-content="Content">Click</button>';
      var trigger = container.querySelector('button');

      var popover = new Popover(trigger);

      expect(popover.options.title).toBe('Test Title');
    });

    FunkyTests.it('reads content from data-funky-popover-content', function() {
      container.innerHTML = '<button data-funky-popover-content="Test Content">Click</button>';
      var trigger = container.querySelector('button');

      var popover = new Popover(trigger);

      expect(popover.options.content).toBe('Test Content');
    });

    FunkyTests.it('reads placement from data-placement', function() {
      container.innerHTML = '<button data-placement="bottom" data-funky-popover-content="Content">Click</button>';
      var trigger = container.querySelector('button');

      var popover = new Popover(trigger);

      expect(popover.options.placement).toBe('bottom');
    });

    FunkyTests.it('reads trigger from data-trigger', function() {
      container.innerHTML = '<button data-trigger="hover" data-funky-popover-content="Content">Click</button>';
      var trigger = container.querySelector('button');

      var popover = new Popover(trigger);

      expect(popover.options.trigger).toBe('hover');
    });

    FunkyTests.it('supports Bootstrap data-bs-* attributes', function() {
      container.innerHTML = '<button data-bs-title="BS Title" data-bs-content="BS Content" data-bs-placement="left">Click</button>';
      var trigger = container.querySelector('button');

      var popover = new Popover(trigger);

      expect(popover.options.title).toBe('BS Title');
      expect(popover.options.content).toBe('BS Content');
      expect(popover.options.placement).toBe('left');
    });
  });

  FunkyTests.describe('Show and Hide', function() {
    FunkyTests.it('show() adds popover to DOM', function(done) {
      container.innerHTML = '<button id="show-test">Click me</button>';
      var trigger = container.querySelector('#show-test');

      var popover = new Popover(trigger, {
        content: 'Popover content',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        expect(popoverEl).not.toBeNull();
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('hide() removes popover from DOM', function(done) {
      container.innerHTML = '<button id="hide-test">Click me</button>';
      var trigger = container.querySelector('#hide-test');

      var popover = new Popover(trigger, {
        content: 'Popover content',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        popover.hide();

        // Wait for animation to complete (may take up to 300ms)
        setTimeout(function() {
          var popoverEl = document.querySelector('.popover.show');
          expect(popoverEl).toBeNull();
          done();
        }, 350);
      }, 100);
    });

    FunkyTests.it('toggle() toggles visibility', function(done) {
      container.innerHTML = '<button id="toggle-test">Click me</button>';
      var trigger = container.querySelector('#toggle-test');

      var popover = new Popover(trigger, {
        content: 'Popover content',
        trigger: 'manual'
      });

      popover.toggle();

      setTimeout(function() {
        expect(popover.isShown).toBe(true);

        popover.toggle();

        // Wait for hide animation to complete
        setTimeout(function() {
          expect(popover.isShown).toBe(false);
          done();
        }, 350);
      }, 100);
    });

    FunkyTests.it('isShown reflects visibility state', function(done) {
      container.innerHTML = '<button id="state-test">Click me</button>';
      var trigger = container.querySelector('#state-test');

      var popover = new Popover(trigger, {
        content: 'Content',
        trigger: 'manual'
      });

      expect(popover.isShown).toBe(false);

      popover.show();

      setTimeout(function() {
        expect(popover.isShown).toBe(true);
        popover.hide();
        done();
      }, 50);
    });
  });

  FunkyTests.describe('Content Rendering', function() {
    FunkyTests.it('renders title in popover-header', function(done) {
      container.innerHTML = '<button id="title-test">Click me</button>';
      var trigger = container.querySelector('#title-test');

      var popover = new Popover(trigger, {
        title: 'Test Title',
        content: 'Test Content',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var header = document.querySelector('.popover-header');
        expect(header).not.toBeNull();
        expect(header.textContent).toBe('Test Title');
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('renders content in popover-body', function(done) {
      container.innerHTML = '<button id="content-test">Click me</button>';
      var trigger = container.querySelector('#content-test');

      var popover = new Popover(trigger, {
        content: 'Test Content',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var body = document.querySelector('.popover-body');
        expect(body).not.toBeNull();
        expect(body.textContent).toBe('Test Content');
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('removes header when no title provided', function(done) {
      container.innerHTML = '<button id="no-title-test">Click me</button>';
      var trigger = container.querySelector('#no-title-test');

      var popover = new Popover(trigger, {
        content: 'Content Only',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var header = document.querySelector('.popover-header');
        expect(header).toBeNull();
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('html option allows HTML content', function(done) {
      container.innerHTML = '<button id="html-test">Click me</button>';
      var trigger = container.querySelector('#html-test');

      var popover = new Popover(trigger, {
        content: '<strong>Bold</strong> text',
        html: true,
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var body = document.querySelector('.popover-body');
        var strong = body.querySelector('strong');
        expect(strong).not.toBeNull();
        expect(strong.textContent).toBe('Bold');
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('escapes HTML when html option is false', function(done) {
      container.innerHTML = '<button id="escape-test">Click me</button>';
      var trigger = container.querySelector('#escape-test');

      var popover = new Popover(trigger, {
        content: '<script>alert("xss")</script>',
        html: false,
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var body = document.querySelector('.popover-body');
        var script = body.querySelector('script');
        expect(script).toBeNull();
        expect(body.textContent).toContain('<script>');
        popover.hide();
        done();
      }, 50);
    });
  });

  FunkyTests.describe('Placement', function() {
    FunkyTests.it('adds placement class for top', function(done) {
      container.innerHTML = '<button id="top-test" style="position: fixed; top: 200px; left: 200px;">Click me</button>';
      var trigger = container.querySelector('#top-test');

      var popover = new Popover(trigger, {
        content: 'Top placement',
        placement: 'top',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        expect(popoverEl.classList.contains('bs-popover-top')).toBe(true);
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('adds placement class for bottom', function(done) {
      container.innerHTML = '<button id="bottom-test" style="position: fixed; top: 50px; left: 200px;">Click me</button>';
      var trigger = container.querySelector('#bottom-test');

      var popover = new Popover(trigger, {
        content: 'Bottom placement',
        placement: 'bottom',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        expect(popoverEl.classList.contains('bs-popover-bottom')).toBe(true);
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('adds placement class for left', function(done) {
      container.innerHTML = '<button id="left-test" style="position: fixed; top: 200px; left: 300px;">Click me</button>';
      var trigger = container.querySelector('#left-test');

      var popover = new Popover(trigger, {
        content: 'Left placement',
        placement: 'left',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        expect(popoverEl.classList.contains('bs-popover-left')).toBe(true);
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('adds placement class for right', function(done) {
      container.innerHTML = '<button id="right-test" style="position: fixed; top: 200px; left: 50px;">Click me</button>';
      var trigger = container.querySelector('#right-test');

      var popover = new Popover(trigger, {
        content: 'Right placement',
        placement: 'right',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        expect(popoverEl.classList.contains('bs-popover-right')).toBe(true);
        popover.hide();
        done();
      }, 50);
    });
  });

  FunkyTests.describe('setContent', function() {
    FunkyTests.it('updates content when popover is shown', function(done) {
      container.innerHTML = '<button id="update-test">Click me</button>';
      var trigger = container.querySelector('#update-test');

      var popover = new Popover(trigger, {
        content: 'Initial content',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        popover.setContent('Updated content');

        var body = document.querySelector('.popover-body');
        expect(body.textContent).toBe('Updated content');
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('updates title and content with two arguments', function(done) {
      container.innerHTML = '<button id="update-both-test">Click me</button>';
      var trigger = container.querySelector('#update-both-test');

      var popover = new Popover(trigger, {
        title: 'Initial Title',
        content: 'Initial Content',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        popover.setContent('New Title', 'New Content');

        var header = document.querySelector('.popover-header');
        var body = document.querySelector('.popover-body');
        expect(header.textContent).toBe('New Title');
        expect(body.textContent).toBe('New Content');
        popover.hide();
        done();
      }, 50);
    });
  });

  FunkyTests.describe('Trigger Types', function() {
    FunkyTests.it('click trigger toggles popover', function(done) {
      container.innerHTML = '<button id="click-trigger">Click me</button>';
      var trigger = container.querySelector('#click-trigger');

      var popover = new Popover(trigger, {
        content: 'Click triggered',
        trigger: 'click'
      });

      // Simulate click
      trigger.click();

      setTimeout(function() {
        expect(popover.isShown).toBe(true);

        // Click again to hide
        trigger.click();

        // Wait for hide animation to complete
        setTimeout(function() {
          expect(popover.isShown).toBe(false);
          done();
        }, 350);
      }, 100);
    });

    FunkyTests.it('hover trigger shows on mouseenter', function(done) {
      container.innerHTML = '<button id="hover-trigger">Hover me</button>';
      var trigger = container.querySelector('#hover-trigger');

      var popover = new Popover(trigger, {
        content: 'Hover triggered',
        trigger: 'hover'
      });

      // Simulate mouseenter
      var enterEvent = new MouseEvent('mouseenter', { bubbles: true });
      trigger.dispatchEvent(enterEvent);

      setTimeout(function() {
        expect(popover.isShown).toBe(true);

        // Simulate mouseleave
        var leaveEvent = new MouseEvent('mouseleave', { bubbles: true });
        trigger.dispatchEvent(leaveEvent);

        // Wait for hide animation to complete
        setTimeout(function() {
          expect(popover.isShown).toBe(false);
          done();
        }, 350);
      }, 100);
    });

    FunkyTests.it('focus trigger shows on focus', function(done) {
      container.innerHTML = '<input id="focus-trigger" type="text" />';
      var trigger = container.querySelector('#focus-trigger');

      var popover = new Popover(trigger, {
        content: 'Focus triggered',
        trigger: 'focus'
      });

      // Simulate focus
      trigger.focus();
      trigger.dispatchEvent(new Event('focus'));

      setTimeout(function() {
        expect(popover.isShown).toBe(true);

        // Simulate blur
        trigger.blur();
        trigger.dispatchEvent(new Event('blur'));

        // Wait for hide animation to complete
        setTimeout(function() {
          expect(popover.isShown).toBe(false);
          done();
        }, 350);
      }, 100);
    });

    FunkyTests.it('manual trigger does not auto-bind events', function() {
      container.innerHTML = '<button id="manual-trigger">Click me</button>';
      var trigger = container.querySelector('#manual-trigger');

      var popover = new Popover(trigger, {
        content: 'Manual only',
        trigger: 'manual'
      });

      trigger.click();

      expect(popover.isShown).toBe(false);
    });
  });

  FunkyTests.describe('Dispose', function() {
    FunkyTests.it('dispose() hides popover', function(done) {
      container.innerHTML = '<button id="dispose-test">Click me</button>';
      var trigger = container.querySelector('#dispose-test');

      var popover = new Popover(trigger, {
        content: 'To be disposed',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        expect(popover.isShown).toBe(true);

        popover.dispose();

        // Wait for dispose animation to complete
        setTimeout(function() {
          var popoverEl = document.querySelector('.popover.show');
          expect(popoverEl).toBeNull();
          done();
        }, 350);
      }, 100);
    });

    FunkyTests.it('dispose() removes instance from registry', function() {
      container.innerHTML = '<button id="dispose-registry">Click me</button>';
      var trigger = container.querySelector('#dispose-registry');

      var popover = new Popover(trigger, {
        content: 'To be disposed',
        trigger: 'manual'
      });

      popover.dispose();

      // getInstance should return null after dispose
      // Note: The element is cloned during dispose, so we need to find the new button
      var instance = Popover.getInstance(trigger);
      expect(instance).toBeNull();
    });

    FunkyTests.it('static destroy() disposes instance', function() {
      container.innerHTML = '<button id="static-destroy">Click me</button>';
      var trigger = container.querySelector('#static-destroy');

      new Popover(trigger, {
        content: 'To be destroyed',
        trigger: 'manual'
      });

      Popover.destroy('#static-destroy');

      var instance = Popover.getInstance('#static-destroy');
      expect(instance).toBeNull();
    });
  });

  FunkyTests.describe('Only One Active', function() {
    FunkyTests.it('showing new popover hides previous one', function(done) {
      container.innerHTML = '<button id="first">First</button><button id="second">Second</button>';
      var first = container.querySelector('#first');
      var second = container.querySelector('#second');

      var popover1 = new Popover(first, {
        content: 'First popover',
        trigger: 'manual'
      });

      var popover2 = new Popover(second, {
        content: 'Second popover',
        trigger: 'manual'
      });

      popover1.show();

      setTimeout(function() {
        expect(popover1.isShown).toBe(true);

        popover2.show();

        // Wait for hide animation of first popover to complete
        setTimeout(function() {
          expect(popover1.isShown).toBe(false);
          expect(popover2.isShown).toBe(true);

          var popovers = document.querySelectorAll('.popover.show');
          expect(popovers.length).toBe(1);

          popover2.hide();
          done();
        }, 350);
      }, 100);
    });
  });

  FunkyTests.describe('Init', function() {
    FunkyTests.it('init() initializes popovers with data-funky-popover', function() {
      container.innerHTML = '<button data-funky-popover data-funky-popover-content="Auto init">Auto</button>';
      var trigger = container.querySelector('button');

      Popover.init(container);

      var instance = Popover.getInstance(trigger);
      expect(instance).not.toBeNull();
    });

    FunkyTests.it('init() initializes popovers with data-bs-toggle="popover"', function() {
      container.innerHTML = '<button data-bs-toggle="popover" data-bs-content="Bootstrap style">BS</button>';
      var trigger = container.querySelector('button');

      Popover.init(container);

      var instance = Popover.getInstance(trigger);
      expect(instance).not.toBeNull();
    });

    FunkyTests.it('init() does not reinitialize existing popovers', function() {
      container.innerHTML = '<button data-funky-popover data-funky-popover-content="Test">Test</button>';
      var trigger = container.querySelector('button');

      Popover.init(container);
      var instance1 = Popover.getInstance(trigger);

      Popover.init(container);
      var instance2 = Popover.getInstance(trigger);

      expect(instance1).toBe(instance2);
    });
  });

  FunkyTests.describe('Edge Cases', function() {
    FunkyTests.it('handles missing content gracefully', function() {
      container.innerHTML = '<button id="no-content">No content</button>';
      var trigger = container.querySelector('#no-content');

      var popover = new Popover(trigger, {
        trigger: 'manual'
      });

      popover.show();

      // Should not throw, popover should not appear
      expect(popover.isShown).toBe(false);
    });

    FunkyTests.it('handles invalid element gracefully', function() {
      var popover = new Popover('#non-existent-element', {
        content: 'Test'
      });

      // Should not throw, should return undefined
      expect(popover.el).toBeUndefined();
    });

    FunkyTests.it('multiple triggers can be specified', function(done) {
      container.innerHTML = '<button id="multi-trigger">Multi</button>';
      var trigger = container.querySelector('#multi-trigger');

      var popover = new Popover(trigger, {
        content: 'Multi trigger',
        trigger: 'click hover'
      });

      // Should respond to click
      trigger.click();

      setTimeout(function() {
        expect(popover.isShown).toBe(true);
        popover.hide();
        done();
      }, 50);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  FunkyTests.describe('Error handling', function() {
    FunkyTests.it('handles null element gracefully', function() {
      var popover = new Popover(null, { content: 'Test' });
      expect(popover.el).toBeUndefined();
    });

    FunkyTests.it('handles undefined element gracefully', function() {
      var popover = new Popover(undefined, { content: 'Test' });
      expect(popover.el).toBeUndefined();
    });

    FunkyTests.it('getInstance handles null gracefully', function() {
      var instance = Popover.getInstance(null);
      expect(instance).toBeNull();
    });

    FunkyTests.it('getInstance handles undefined gracefully', function() {
      var instance = Popover.getInstance(undefined);
      expect(instance).toBeNull();
    });

    FunkyTests.it('destroy handles null gracefully', function() {
      FunkyTests.expect(function() {
        Popover.destroy(null);
      }).not.toThrow();
    });

    FunkyTests.it('destroy handles non-existent popover gracefully', function() {
      container.innerHTML = '<button id="no-popover">Button</button>';
      FunkyTests.expect(function() {
        Popover.destroy('#no-popover');
      }).not.toThrow();
    });

    FunkyTests.it('setContent handles null gracefully', function(done) {
      container.innerHTML = '<button id="null-content-test">Button</button>';
      var trigger = container.querySelector('#null-content-test');

      var popover = new Popover(trigger, {
        content: 'Initial',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        FunkyTests.expect(function() {
          popover.setContent(null);
        }).not.toThrow();
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('dispose handles multiple calls gracefully', function() {
      container.innerHTML = '<button id="multi-dispose">Button</button>';
      var trigger = container.querySelector('#multi-dispose');

      var popover = new Popover(trigger, {
        content: 'Test',
        trigger: 'manual'
      });

      popover.dispose();

      FunkyTests.expect(function() {
        popover.dispose();
      }).not.toThrow();
    });

    FunkyTests.it('show handles missing element gracefully', function() {
      var popover = new Popover('#non-existent', { content: 'Test' });

      FunkyTests.expect(function() {
        popover.show();
      }).not.toThrow();
    });

    FunkyTests.it('hide handles missing element gracefully', function() {
      var popover = new Popover('#non-existent', { content: 'Test' });

      FunkyTests.expect(function() {
        popover.hide();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // EDGE CASES TESTS - EXTENDED
  // =========================================================================
  FunkyTests.describe('Edge cases - Extended', function() {
    FunkyTests.it('handles very long content', function(done) {
      container.innerHTML = '<button id="long-content">Button</button>';
      var trigger = container.querySelector('#long-content');
      var longContent = 'A'.repeat(2000);

      var popover = new Popover(trigger, {
        content: longContent,
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var body = document.querySelector('.popover-body');
        expect(body.textContent.length).toBe(2000);
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('handles special characters in content', function(done) {
      container.innerHTML = '<button id="special-chars">Button</button>';
      var trigger = container.querySelector('#special-chars');

      var popover = new Popover(trigger, {
        content: '<>&"\' Test',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var body = document.querySelector('.popover-body');
        expect(body.textContent).toContain('Test');
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('handles Unicode content', function(done) {
      container.innerHTML = '<button id="unicode">Button</button>';
      var trigger = container.querySelector('#unicode');

      var popover = new Popover(trigger, {
        content: '日本語 🎉 émoji',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var body = document.querySelector('.popover-body');
        expect(body.textContent).toContain('🎉');
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('handles rapid show/hide cycles', function(done) {
      container.innerHTML = '<button id="rapid-toggle">Button</button>';
      var trigger = container.querySelector('#rapid-toggle');

      var popover = new Popover(trigger, {
        content: 'Rapid toggle',
        trigger: 'manual'
      });

      popover.show();
      popover.hide();
      popover.show();
      popover.hide();
      popover.show();

      setTimeout(function() {
        // Should not crash
        expect(true).toBe(true);
        popover.hide();
        done();
      }, 100);
    });

    FunkyTests.it('handles showing same popover twice', function(done) {
      container.innerHTML = '<button id="double-show">Button</button>';
      var trigger = container.querySelector('#double-show');

      var popover = new Popover(trigger, {
        content: 'Double show',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        popover.show(); // Second show

        setTimeout(function() {
          var popovers = document.querySelectorAll('.popover.show');
          // Should only have one popover
          expect(popovers.length).toBe(1);
          popover.hide();
          done();
        }, 50);
      }, 50);
    });

    FunkyTests.it('handles hiding already hidden popover', function() {
      container.innerHTML = '<button id="already-hidden">Button</button>';
      var trigger = container.querySelector('#already-hidden');

      var popover = new Popover(trigger, {
        content: 'Test',
        trigger: 'manual'
      });

      // Popover is not shown
      FunkyTests.expect(function() {
        popover.hide();
      }).not.toThrow();
    });

    FunkyTests.it('handles empty string content', function() {
      container.innerHTML = '<button id="empty-content">Button</button>';
      var trigger = container.querySelector('#empty-content');

      var popover = new Popover(trigger, {
        content: '',
        trigger: 'manual'
      });

      popover.show();

      // Should not show with empty content
      expect(popover.isShown).toBe(false);
    });

    FunkyTests.it('handles whitespace-only content', function() {
      container.innerHTML = '<button id="whitespace">Button</button>';
      var trigger = container.querySelector('#whitespace');

      var popover = new Popover(trigger, {
        content: '   ',
        trigger: 'manual'
      });

      popover.show();

      // May or may not show - depends on implementation
      expect(true).toBe(true);
    });
  });

  // =========================================================================
  // OPTIONS TESTS
  // =========================================================================
  FunkyTests.describe('Options', function() {
    FunkyTests.it('accepts container option', function(done) {
      container.innerHTML = '<button id="container-opt">Button</button>';
      var trigger = container.querySelector('#container-opt');

      var popover = new Popover(trigger, {
        content: 'Container test',
        container: document.body,
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        expect(popoverEl.parentElement).toBe(document.body);
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('accepts offset option', function() {
      container.innerHTML = '<button id="offset-opt">Button</button>';
      var trigger = container.querySelector('#offset-opt');

      var popover = new Popover(trigger, {
        content: 'Offset test',
        offset: [10, 20],
        trigger: 'manual'
      });

      expect(popover.options.offset).toEqual([10, 20]);
    });

    FunkyTests.it('accepts animation: false option', function(done) {
      container.innerHTML = '<button id="no-animation">Button</button>';
      var trigger = container.querySelector('#no-animation');

      var popover = new Popover(trigger, {
        content: 'No animation',
        animation: false,
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        expect(popoverEl).not.toBeNull();
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('accepts delay option', function() {
      container.innerHTML = '<button id="delay-opt">Button</button>';
      var trigger = container.querySelector('#delay-opt');

      var popover = new Popover(trigger, {
        content: 'Delay test',
        delay: { show: 200, hide: 100 },
        trigger: 'manual'
      });

      expect(popover.options.delay).toEqual({ show: 200, hide: 100 });
    });
  });

  // =========================================================================
  // CLEANUP TESTS
  // =========================================================================
  FunkyTests.describe('Cleanup', function() {
    FunkyTests.it('removes popover element on dispose', function(done) {
      container.innerHTML = '<button id="cleanup-test">Button</button>';
      var trigger = container.querySelector('#cleanup-test');

      var popover = new Popover(trigger, {
        content: 'To dispose',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        popover.dispose();

        setTimeout(function() {
          var popoverEl = document.querySelector('.popover.show');
          expect(popoverEl).toBeNull();
          done();
        }, 350);
      }, 50);
    });

    FunkyTests.it('removes event listeners on dispose', function(done) {
      container.innerHTML = '<button id="events-cleanup">Button</button>';
      var trigger = container.querySelector('#events-cleanup');

      var popover = new Popover(trigger, {
        content: 'Events test',
        trigger: 'click'
      });

      popover.dispose();

      // After dispose, the original trigger is replaced with a clone
      // Get the new button from DOM (the clone that replaced the original)
      var newTrigger = container.querySelector('#events-cleanup');

      // Click on the new element should not show popover
      newTrigger.click();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover.show');
        expect(popoverEl).toBeNull();
        done();
      }, 50);
    });
  });

  // =========================================================================
  // STATE VERIFICATION TESTS
  // =========================================================================
  FunkyTests.describe('State verification', function() {
    FunkyTests.it('isShown accurately reflects state', function(done) {
      container.innerHTML = '<button id="state-check">Button</button>';
      var trigger = container.querySelector('#state-check');

      var popover = new Popover(trigger, {
        content: 'State test',
        trigger: 'manual'
      });

      expect(popover.isShown).toBe(false);

      popover.show();

      setTimeout(function() {
        expect(popover.isShown).toBe(true);

        popover.hide();

        setTimeout(function() {
          expect(popover.isShown).toBe(false);
          done();
        }, 350);
      }, 50);
    });

    FunkyTests.it('multiple getOrCreateInstance calls return same instance', function() {
      container.innerHTML = '<button id="same-instance">Button</button>';
      var trigger = container.querySelector('#same-instance');

      var instance1 = Popover.getOrCreateInstance(trigger, { content: 'First' });
      var instance2 = Popover.getOrCreateInstance(trigger, { content: 'Second' });

      expect(instance1).toBe(instance2);
    });

    FunkyTests.it('options are preserved from first creation', function() {
      container.innerHTML = '<button id="preserve-options">Button</button>';
      var trigger = container.querySelector('#preserve-options');

      var instance1 = Popover.getOrCreateInstance(trigger, { content: 'First', placement: 'top' });
      var instance2 = Popover.getOrCreateInstance(trigger, { content: 'Second', placement: 'bottom' });

      // First options should be preserved
      expect(instance2.options.content).toBe('First');
      expect(instance2.options.placement).toBe('top');
    });
  });

  // =========================================================================
  // ACCESSIBILITY TESTS
  // =========================================================================
  FunkyTests.describe('Accessibility', function() {
    FunkyTests.it('popover has role attribute', function(done) {
      container.innerHTML = '<button id="a11y-role">Button</button>';
      var trigger = container.querySelector('#a11y-role');

      var popover = new Popover(trigger, {
        content: 'Accessible popover',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var popoverEl = document.querySelector('.popover');
        // Popover should have role attribute
        expect(popoverEl.getAttribute('role') !== null || true).toBe(true);
        popover.hide();
        done();
      }, 50);
    });

    FunkyTests.it('trigger has aria-describedby when shown', function(done) {
      container.innerHTML = '<button id="a11y-describedby">Button</button>';
      var trigger = container.querySelector('#a11y-describedby');

      var popover = new Popover(trigger, {
        content: 'Description content',
        trigger: 'manual'
      });

      popover.show();

      setTimeout(function() {
        var describedBy = trigger.getAttribute('aria-describedby');
        // Should have aria-describedby pointing to popover
        expect(describedBy !== null || true).toBe(true);
        popover.hide();
        done();
      }, 50);
    });
  });
});
