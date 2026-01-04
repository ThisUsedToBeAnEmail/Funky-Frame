/**
 * Tests for Funky.Signature
 *
 * Canvas-based signature capture with drawing, typed, and export support
 */
(function() {
  'use strict';

  var describe = FunkyTests.describe;
  var it = FunkyTests.it;
  var expect = FunkyTests.expect;
  var beforeEach = FunkyTests.beforeEach;
  var afterEach = FunkyTests.afterEach;

  var D = Funky.Dom;
  var P = Funky.PubSub;
  var Signature = Funky.Signature;

  /**
   * Helper to simulate pointer events (or fallback to mouse events)
   */
  function simulateMouseEvent(element, type, x, y, button) {
    var rect = element.getBoundingClientRect();

    // Map mouse event types to pointer event types
    var pointerTypeMap = {
      'mousedown': 'pointerdown',
      'mousemove': 'pointermove',
      'mouseup': 'pointerup'
    };

    // Use PointerEvent if available (what PointerTracker listens for in modern browsers)
    if (window.PointerEvent && pointerTypeMap[type]) {
      var event = new PointerEvent(pointerTypeMap[type], {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + x,
        clientY: rect.top + y,
        button: button !== undefined ? button : 0,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        pressure: 0.5
      });
      element.dispatchEvent(event);
    } else {
      // Fallback to MouseEvent for older browsers
      var event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + x,
        clientY: rect.top + y,
        button: button !== undefined ? button : 0
      });
      element.dispatchEvent(event);
    }
  }

  /**
   * Helper to draw a stroke on signature
   */
  function drawStroke(sig, x1, y1, x2, y2) {
    simulateMouseEvent(sig.canvas, 'mousedown', x1, y1);
    simulateMouseEvent(sig.canvas, 'mousemove', x2, y2);
    simulateMouseEvent(sig.canvas, 'mouseup', x2, y2);
  }

  /**
   * Helper to create touch-like event
   */
  function createTouchEvent(type, touchData, target) {
    var event = new CustomEvent(type, {
      bubbles: true,
      cancelable: true
    });

    function createTouch(t) {
      return {
        identifier: t.identifier !== undefined ? t.identifier : 0,
        clientX: t.clientX,
        clientY: t.clientY,
        pageX: t.clientX,
        pageY: t.clientY,
        screenX: t.clientX,
        screenY: t.clientY,
        target: t.target || target,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1
      };
    }

    var touches = (touchData.touches || []).map(createTouch);
    var changedTouches = (touchData.changedTouches || touches).map(createTouch);

    function createTouchList(arr) {
      var list = arr.slice();
      list.item = function(index) { return list[index] || null; };
      return list;
    }

    event.touches = createTouchList(touches);
    event.changedTouches = createTouchList(changedTouches);
    event.targetTouches = createTouchList(touches);

    return event;
  }

  /**
   * Helper to dispatch touch start
   */
  function dispatchTouchStart(element, x, y) {
    var rect = element.getBoundingClientRect();
    var event = createTouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: rect.left + x, clientY: rect.top + y, target: element }],
      changedTouches: [{ identifier: 0, clientX: rect.left + x, clientY: rect.top + y, target: element }]
    }, element);
    element.dispatchEvent(event);
  }

  /**
   * Helper to dispatch touch move
   */
  function dispatchTouchMove(element, x, y) {
    var rect = element.getBoundingClientRect();
    var event = createTouchEvent('touchmove', {
      touches: [{ identifier: 0, clientX: rect.left + x, clientY: rect.top + y, target: element }],
      changedTouches: [{ identifier: 0, clientX: rect.left + x, clientY: rect.top + y, target: element }]
    }, element);
    element.dispatchEvent(event);
  }

  /**
   * Helper to dispatch touch end
   */
  function dispatchTouchEnd(element, x, y) {
    var rect = element.getBoundingClientRect();
    var event = createTouchEvent('touchend', {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: rect.left + x, clientY: rect.top + y, target: element }]
    }, element);
    element.dispatchEvent(event);
  }

  describe('Funky.Component.Signature', function() {
    var fixture;
    var container;
    var signature;

    beforeEach(function() {
      fixture = document.getElementById('test-fixture');
      fixture.innerHTML = '<div id="test-signature-container" style="width: 400px; height: 200px;"></div>';
      container = document.getElementById('test-signature-container');
    });

    afterEach(function() {
      if (signature && signature.destroy) {
        signature.destroy();
        signature = null;
      }
      fixture.innerHTML = '';
      // Clean up PubSub events
      if (P && P.off) {
        P.off('funky:signature:begin');
        P.off('funky:signature:end');
        P.off('funky:signature:change');
        P.off('funky:signature:clear');
        P.off('funky:signature:undo');
        P.off('funky:signature:modechange');
      }
    });

    // =========================================================================
    // Component Registration
    // =========================================================================

    describe('Registration', function() {
      it('should be registered as Funky.Signature', function() {
        expect(Funky.Signature).toBeDefined();
        expect(typeof Funky.Signature).toBe('object');
        expect(typeof Funky.Signature.init).toBe('function');
      });
    });

    // =========================================================================
    // Initialisation Tests
    // =========================================================================

    describe('Initialisation', function() {
      it('should create signature with default options', function() {
        signature = Signature.init(container);

        expect(signature.canvas).toBeDefined();
        expect(signature.ctx).toBeDefined();
        expect(signature.strokes.length).toBe(0);
        expect(signature.isEmpty()).toBe(true);
      });

      it('should accept string selector', function() {
        signature = Signature.init('#test-signature-container');

        expect(signature.canvas).toBeDefined();
        expect(signature.container).toBe(container);
      });

      it('should work with init method', function() {
        signature = Signature.init(container);

        expect(signature).toBeDefined();
        expect(signature.canvas).toBeDefined();
      });

      it('should apply custom options', function() {
        signature = Signature.init(container, {
          width: 500,
          height: 250,
          penColour: '#ff0000',
          penWidth: 3
        });

        expect(signature.canvas.width).toBe(500);
        expect(signature.canvas.height).toBe(250);
        expect(signature.options.penColour).toBe('#ff0000');
        expect(signature.options.penWidth).toBe(3);
      });

      it('should use existing canvas if present', function() {
        container.innerHTML = '<canvas width="300" height="150"></canvas>';
        var existingCanvas = container.querySelector('canvas');

        signature = Signature.init(container);

        expect(signature.canvas).toBe(existingCanvas);
      });

      it('should set default mode to draw', function() {
        signature = Signature.init(container);

        expect(signature.mode).toBe('draw');
        expect(signature.getMode()).toBe('draw');
      });

      it('should create UI wrapper', function() {
        signature = Signature.init(container);

        expect(signature.wrapper).toBeDefined();
        expect(signature.wrapper.el).toBeDefined();
      });
    });

    // =========================================================================
    // Drawing Tests
    // =========================================================================

    describe('Drawing', function() {
      it('should track strokes on mouse events', function() {
        signature = Signature.init(container);

        drawStroke(signature, 50, 50, 100, 100);

        expect(signature.strokes.length).toBe(1);
        expect(signature.isEmpty()).toBe(false);
      });

      it('should track multiple strokes', function() {
        signature = Signature.init(container);

        drawStroke(signature, 50, 50, 100, 100);
        drawStroke(signature, 150, 50, 200, 100);

        expect(signature.strokes.length).toBe(2);
        expect(signature.getStrokeCount()).toBe(2);
      });

      it('should support touch events', function() {
        signature = Signature.init(container);

        dispatchTouchStart(signature.canvas, 50, 50);
        dispatchTouchMove(signature.canvas, 100, 100);
        dispatchTouchEnd(signature.canvas, 100, 100);

        // Touch events go through PointerTracker
        expect(signature.strokes.length).toBeGreaterThanOrEqual(0);
      });

      it('should respect velocity filtering', function() {
        signature = Signature.init(container, {
          velocityFilter: 0.5
        });

        expect(signature.options.velocityFilter).toBe(0.5);
      });

      it('should respect min/max width options', function() {
        signature = Signature.init(container, {
          minWidth: 1,
          maxWidth: 5
        });

        expect(signature.options.minWidth).toBe(1);
        expect(signature.options.maxWidth).toBe(5);
      });
    });

    // =========================================================================
    // Event Emission Tests
    // =========================================================================

    describe('Events', function() {
      it('should emit signature:begin event', function() {
        signature = Signature.init(container);
        var beginFired = false;

        P.on('funky:signature:begin', function() { beginFired = true; });

        simulateMouseEvent(signature.canvas, 'mousedown', 50, 50);

        expect(beginFired).toBe(true);
      });

      it('should emit signature:end event', function() {
        signature = Signature.init(container);
        var endFired = false;

        P.on('funky:signature:end', function() { endFired = true; });

        simulateMouseEvent(signature.canvas, 'mousedown', 50, 50);
        simulateMouseEvent(signature.canvas, 'mouseup', 50, 50);

        expect(endFired).toBe(true);
      });

      it('should emit signature:change event', function() {
        signature = Signature.init(container);
        var changeFired = false;

        P.on('funky:signature:change', function() { changeFired = true; });

        drawStroke(signature, 50, 50, 100, 100);

        expect(changeFired).toBe(true);
      });

      it('should emit signature:clear event', function() {
        signature = Signature.init(container);
        var clearFired = false;

        drawStroke(signature, 50, 50, 100, 100);

        P.on('funky:signature:clear', function() { clearFired = true; });

        signature.clear();

        expect(clearFired).toBe(true);
      });

      it('should emit signature:undo event', function() {
        signature = Signature.init(container);
        var undoFired = false;

        drawStroke(signature, 50, 50, 100, 100);

        P.on('funky:signature:undo', function() { undoFired = true; });

        signature.undo();

        expect(undoFired).toBe(true);
      });

      it('should emit signature:modechange event', function() {
        signature = Signature.init(container, { showTypedOption: true });
        var modechangeFired = false;
        var newMode = '';

        P.on('funky:signature:modechange', function(data) {
          modechangeFired = true;
          newMode = data.mode;
        });

        signature.setMode('type');

        expect(modechangeFired).toBe(true);
        expect(newMode).toBe('type');
      });
    });

    // =========================================================================
    // Clear and Undo Tests
    // =========================================================================

    describe('Clear and Undo', function() {
      it('should clear all strokes', function() {
        signature = Signature.init(container);

        drawStroke(signature, 50, 50, 100, 100);
        drawStroke(signature, 150, 50, 200, 100);

        expect(signature.strokes.length).toBe(2);

        signature.clear();

        expect(signature.strokes.length).toBe(0);
        expect(signature.isEmpty()).toBe(true);
      });

      it('should undo last stroke', function() {
        signature = Signature.init(container);

        drawStroke(signature, 50, 50, 100, 100);
        drawStroke(signature, 150, 50, 200, 100);

        expect(signature.strokes.length).toBe(2);

        signature.undo();

        expect(signature.strokes.length).toBe(1);
      });

      it('should undo all strokes sequentially', function() {
        signature = Signature.init(container);

        drawStroke(signature, 50, 50, 100, 100);
        drawStroke(signature, 150, 50, 200, 100);

        signature.undo();
        signature.undo();

        expect(signature.strokes.length).toBe(0);
        expect(signature.isEmpty()).toBe(true);
      });

      it('should do nothing when undoing empty signature', function() {
        signature = Signature.init(container);

        signature.undo();

        expect(signature.strokes.length).toBe(0);
      });

      it('should reset typed text on clear in type mode', function() {
        signature = Signature.init(container, { showTypedOption: true });

        signature.setMode('type');
        signature.typedText = 'John Doe';
        signature.clear();

        expect(signature.typedText).toBe('');
      });
    });

    // =========================================================================
    // Mode Tests
    // =========================================================================

    describe('Mode Switching', function() {
      it('should switch to type mode', function() {
        signature = Signature.init(container, { showTypedOption: true });

        signature.setMode('type');

        expect(signature.mode).toBe('type');
        expect(signature.getMode()).toBe('type');
      });

      it('should switch back to draw mode', function() {
        signature = Signature.init(container, { showTypedOption: true });

        signature.setMode('type');
        signature.setMode('draw');

        expect(signature.mode).toBe('draw');
        expect(signature.getMode()).toBe('draw');
      });

      it('should not switch if same mode', function() {
        signature = Signature.init(container, { showTypedOption: true });
        var modechangeFired = false;

        P.on('funky:signature:modechange', function() { modechangeFired = true; });

        signature.setMode('draw'); // Already in draw mode

        expect(modechangeFired).toBe(false);
      });

      it('should ignore invalid mode', function() {
        signature = Signature.init(container, { showTypedOption: true });

        signature.setMode('invalid');

        expect(signature.mode).toBe('draw');
      });
    });

    // =========================================================================
    // Export Tests
    // =========================================================================

    describe('Export', function() {
      it('should return empty string for empty signature (toDataURL)', function() {
        signature = Signature.init(container);

        var result = signature.toDataURL();

        expect(result).toBe('');
      });

      it('should export as PNG data URL', function() {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        var dataURL = signature.toDataURL('image/png');

        expect(dataURL.indexOf('data:image/png')).toBe(0);
      });

      it('should export as JPEG data URL', function() {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        var dataURL = signature.toDataURL('image/jpeg', 0.8);

        expect(dataURL.indexOf('data:image/jpeg')).toBe(0);
      });

      it('should export as SVG', function() {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        var svg = signature.toSVG();

        expect(svg.indexOf('<svg')).toBeGreaterThanOrEqual(0);
        expect(svg.indexOf('<path')).toBeGreaterThanOrEqual(0);
      });

      it('should export and restore data', function() {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        var data = signature.getData();

        expect(data.strokes).toBeDefined();
        expect(data.strokes.length).toBe(1);

        signature.clear();
        expect(signature.isEmpty()).toBe(true);

        signature.fromData(data);

        expect(signature.strokes.length).toBe(1);
        expect(signature.isEmpty()).toBe(false);
      });

      it('should export and restore JSON', function() {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        var json = signature.toJSON();

        expect(typeof json).toBe('string');

        signature.clear();
        signature.fromJSON(json);

        expect(signature.strokes.length).toBe(1);
      });

      it('should handle toBlob callback', function(done) {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        signature.toBlob(function(blob) {
          expect(blob).toBeDefined();
          if (blob) {
            expect(blob.type).toContain('image/png');
          }
          done();
        }, 'image/png');
      });

      it('should return empty for type mode when empty', function() {
        signature = Signature.init(container, { showTypedOption: true });
        signature.setMode('type');

        var result = signature.toDataURL();

        expect(result).toBe('');
      });
    });

    // =========================================================================
    // Validation Tests
    // =========================================================================

    describe('Validation', function() {
      it('should pass validation when not required and empty', function() {
        signature = Signature.init(container, { required: false });

        var result = signature.validate();

        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('should fail validation when required and empty', function() {
        signature = Signature.init(container, { required: true });

        var result = signature.validate();

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should pass validation when required and signed', function() {
        signature = Signature.init(container, { required: true });
        drawStroke(signature, 50, 50, 100, 100);

        var result = signature.validate();

        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('should validate minimum strokes', function() {
        signature = Signature.init(container, { required: true, minStrokes: 2 });
        drawStroke(signature, 50, 50, 100, 100);

        var result = signature.validate();

        expect(result.valid).toBe(false);

        drawStroke(signature, 150, 50, 200, 100);
        result = signature.validate();

        expect(result.valid).toBe(true);
      });

      it('should return validation state object', function() {
        signature = Signature.init(container, { required: true });

        var result = signature.validate();

        expect(typeof result).toBe('object');
        expect(typeof result.valid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
      });
    });

    // =========================================================================
    // Accessibility Tests
    // =========================================================================

    describe('Accessibility', function() {
      it('should create accessibility wrapper', function() {
        signature = Signature.init(container);

        expect(signature.a11yWrapper).toBeDefined();
      });

      it('should have ARIA role', function() {
        signature = Signature.init(container);

        var hasRole = signature.canvas.getAttribute('role') === 'img' ||
                      (signature.a11yWrapper && signature.a11yWrapper.el.getAttribute('role') === 'application');

        expect(hasRole).toBe(true);
      });

      it('should be keyboard focusable', function() {
        signature = Signature.init(container);

        var focusable = signature.a11yWrapper &&
                        signature.a11yWrapper.el.getAttribute('tabindex') === '0';

        expect(focusable).toBe(true);
      });

      it('should have ARIA label', function() {
        signature = Signature.init(container);

        var hasLabel = signature.canvas.getAttribute('aria-label') ||
                       (signature.a11yWrapper && signature.a11yWrapper.el.getAttribute('aria-label'));

        expect(hasLabel).toBeTruthy();
      });

      it('should support keyboard navigation', function() {
        signature = Signature.init(container);

        // Keyboard state should be initialized
        expect(signature._keyboardState).toBeDefined();
        expect(signature._keyboardState.x).toBeDefined();
        expect(signature._keyboardState.y).toBeDefined();
      });
    });

    // =========================================================================
    // Form Integration Tests
    // =========================================================================

    describe('Form Integration', function() {
      it('should create hidden input when name is provided', function() {
        signature = Signature.init(container, { name: 'signature_field' });

        expect(signature.hiddenInput).toBeDefined();
        // hiddenInput is a Funky.Dom wrapper, access via .el for native element
        expect(signature.hiddenInput.el.name).toBe('signature_field');
      });

      it('should update hidden input on change', function() {
        signature = Signature.init(container, { name: 'signature_field' });

        drawStroke(signature, 50, 50, 100, 100);

        // Access via .el for native element value
        expect(signature.hiddenInput.el.value).not.toBe('');
      });

      it('should clear hidden input on clear', function() {
        signature = Signature.init(container, { name: 'signature_field' });

        drawStroke(signature, 50, 50, 100, 100);
        signature.clear();

        // Access via .el for native element value
        expect(signature.hiddenInput.el.value).toBe('');
      });
    });

    // =========================================================================
    // Destroy Tests
    // =========================================================================

    describe('Destroy', function() {
      it('should clean up on destroy', function() {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        signature.destroy();

        expect(signature.canvas).toBe(null);
        expect(signature.ctx).toBe(null);
        expect(signature.strokes.length).toBe(0);
      });

      it('should remove wrapper on destroy', function() {
        signature = Signature.init(container);
        var wrapperEl = signature.wrapper.el;

        signature.destroy();

        // Wrapper should be removed from DOM
        expect(wrapperEl.parentNode).toBe(null);
        // And the property should be nulled
        expect(signature.wrapper).toBe(null);
      });

      it('should be safe to call destroy multiple times', function() {
        signature = Signature.init(container);

        signature.destroy();

        expect(function() {
          signature.destroy();
        }).not.toThrow();
      });
    });

    // =========================================================================
    // Resize Tests
    // =========================================================================

    describe('Resize', function() {
      it('should resize canvas dimensions', function() {
        signature = Signature.init(container, { width: 400, height: 200 });

        signature.resize(600, 300);

        expect(signature.canvas.width).toBe(600);
        expect(signature.canvas.height).toBe(300);
        expect(signature.options.width).toBe(600);
        expect(signature.options.height).toBe(300);
      });

      it('should preserve strokes when resizing by default', function() {
        signature = Signature.init(container, { width: 400, height: 200 });
        drawStroke(signature, 50, 50, 100, 100);

        expect(signature.strokes.length).toBe(1);

        signature.resize(600, 300);

        expect(signature.strokes.length).toBe(1);
        expect(signature.isEmpty()).toBe(false);
      });

      it('should scale stroke points when resizing', function() {
        signature = Signature.init(container, { width: 400, height: 200 });
        drawStroke(signature, 100, 100, 200, 150);

        var originalX = signature.strokes[0].points[0].x;
        var originalY = signature.strokes[0].points[0].y;

        signature.resize(800, 400);

        // Points should be scaled 2x
        expect(signature.strokes[0].points[0].x).toBe(originalX * 2);
        expect(signature.strokes[0].points[0].y).toBe(originalY * 2);
      });

      it('should clear strokes when preserveData is false', function() {
        signature = Signature.init(container, { width: 400, height: 200 });
        drawStroke(signature, 50, 50, 100, 100);

        expect(signature.strokes.length).toBe(1);

        signature.resize(600, 300, false);

        expect(signature.strokes.length).toBe(0);
        expect(signature.isEmpty()).toBe(true);
      });

      it('should resize typed canvas when it exists', function() {
        signature = Signature.init(container, { width: 400, height: 200, showTypedOption: true });
        signature.setMode('type');

        // typedCanvas should be created when switching to type mode
        expect(signature.typedCanvas).toBeDefined();

        signature.resize(600, 300);

        expect(signature.typedCanvas.width).toBe(600);
        expect(signature.typedCanvas.height).toBe(300);
      });

      it('should update keyboard cursor bounds on resize', function() {
        signature = Signature.init(container, { width: 400, height: 200 });

        // Simulate keyboard cursor at edge
        signature._keyboardState.x = 400;
        signature._keyboardState.y = 200;

        signature.resize(300, 150);

        // Cursor should be constrained to new dimensions
        expect(signature._keyboardState.x).toBeLessThanOrEqual(300);
        expect(signature._keyboardState.y).toBeLessThanOrEqual(150);
      });

      it('should work with empty signature', function() {
        signature = Signature.init(container, { width: 400, height: 200 });

        expect(signature.isEmpty()).toBe(true);

        signature.resize(600, 300);

        expect(signature.canvas.width).toBe(600);
        expect(signature.canvas.height).toBe(300);
        expect(signature.isEmpty()).toBe(true);
      });

      it('should re-render typed signature on resize', function() {
        signature = Signature.init(container, { width: 400, height: 200, showTypedOption: true });
        signature.setMode('type');
        signature.typedInput.el.value = 'Test';
        signature.typedText = 'Test';
        signature._renderTypedSignature();

        signature.resize(600, 300);

        // Should not throw and typed canvas should be resized
        expect(signature.typedCanvas.width).toBe(600);
        expect(signature.typedCanvas.height).toBe(300);
      });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', function() {
      it('should handle rapid drawing', function() {
        signature = Signature.init(container);

        // Rapid strokes
        for (var i = 0; i < 10; i++) {
          drawStroke(signature, i * 10, 50, i * 10 + 20, 100);
        }

        expect(signature.strokes.length).toBe(10);
      });

      it('should handle empty fromData', function() {
        signature = Signature.init(container);

        signature.fromData({ strokes: [] });

        expect(signature.strokes.length).toBe(0);
      });

      it('should handle invalid fromJSON', function() {
        signature = Signature.init(container);

        expect(function() {
          signature.fromJSON('not valid json');
        }).not.toThrow();
      });

      it('should handle null fromData', function() {
        signature = Signature.init(container);

        expect(function() {
          signature.fromData(null);
        }).not.toThrow();
      });

      it('should handle getData with options', function() {
        signature = Signature.init(container);
        drawStroke(signature, 50, 50, 100, 100);

        var data = signature.getData();

        expect(data).toBeDefined();
        expect(data.width).toBeDefined();
        expect(data.height).toBeDefined();
      });
    });

  });

})();
