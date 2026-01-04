/**
 * Tests for Funky.GestureTracker
 *
 * Touch gesture detection: tap, swipe, long-press, and drag
 */
(function() {
  'use strict';

  var describe = FunkyTests.describe;
  var it = FunkyTests.it;
  var expect = FunkyTests.expect;
  var beforeEach = FunkyTests.beforeEach;
  var afterEach = FunkyTests.afterEach;

  /**
   * Helper to create a touch-like event using CustomEvent
   * This is more compatible across browsers than TouchEvent constructor
   */
  function createTouchEvent(type, touchData, target) {
    var event = new CustomEvent(type, {
      bubbles: true,
      cancelable: true
    });

    // Create touch-like objects with all required properties
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

    // Create array-like TouchList objects with length property and item() method
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
   * Helper to dispatch a touch start event
   */
  function dispatchTouchStart(element, x, y) {
    var event = createTouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: x, clientY: y, target: element }],
      changedTouches: [{ identifier: 0, clientX: x, clientY: y, target: element }]
    }, element);
    element.dispatchEvent(event);
  }

  /**
   * Helper to dispatch a touch move event
   */
  function dispatchTouchMove(element, x, y) {
    var event = createTouchEvent('touchmove', {
      touches: [{ identifier: 0, clientX: x, clientY: y, target: element }],
      changedTouches: [{ identifier: 0, clientX: x, clientY: y, target: element }]
    }, element);
    element.dispatchEvent(event);
  }

  /**
   * Helper to dispatch a touch end event
   */
  function dispatchTouchEnd(element, x, y) {
    var event = createTouchEvent('touchend', {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: x, clientY: y, target: element }]
    }, element);
    element.dispatchEvent(event);
  }

  /**
   * Helper to dispatch a touch cancel event
   */
  function dispatchTouchCancel(element, x, y) {
    var event = createTouchEvent('touchcancel', {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: x, clientY: y, target: element }]
    }, element);
    element.dispatchEvent(event);
  }

  describe('Funky.Component.GestureTracker', function() {
    var fixture;
    var targetEl;
    var tracker;

    beforeEach(function() {
      fixture = document.getElementById('test-fixture');
      fixture.innerHTML = '<div id="gesture-target" style="width: 200px; height: 200px; background: #333;"></div>';
      targetEl = document.getElementById('gesture-target');
    });

    afterEach(function() {
      if (tracker) {
        tracker.destroy();
        tracker = null;
      }
      fixture.innerHTML = '';
    });

    describe('Factory', function() {
      it('should be registered as Funky.GestureTracker', function() {
        expect(Funky.GestureTracker).toBeDefined();
        expect(typeof Funky.GestureTracker.create).toBe('function');
      });

      it('should create an instance with create()', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          autoStart: false
        });

        expect(tracker).toBeDefined();
        expect(typeof tracker.start).toBe('function');
        expect(typeof tracker.stop).toBe('function');
        expect(typeof tracker.destroy).toBe('function');
      });

      it('should generate unique IDs for each instance', function() {
        var tracker1 = Funky.GestureTracker.create({ target: targetEl, autoStart: false });
        var tracker2 = Funky.GestureTracker.create({ target: targetEl, autoStart: false });

        expect(tracker1.getId()).not.toBe(tracker2.getId());
        expect(tracker1.getId()).toContain('gesture-tracker-');
        expect(tracker2.getId()).toContain('gesture-tracker-');

        tracker1.destroy();
        tracker2.destroy();
      });
    });

    describe('Target Resolution', function() {
      it('should accept a DOM element as target', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          autoStart: false
        });

        expect(tracker.isActive()).toBe(false);
        tracker.start();
        expect(tracker.isActive()).toBe(true);
      });

      it('should accept a CSS selector as target', function() {
        tracker = Funky.GestureTracker.create({
          target: '#gesture-target',
          autoStart: false
        });

        tracker.start();
        expect(tracker.isActive()).toBe(true);
      });

      it('should accept a Funky.Dom element as target', function() {
        var domEl = Funky.Dom.wrap(targetEl);

        tracker = Funky.GestureTracker.create({
          target: domEl,
          autoStart: false
        });

        tracker.start();
        expect(tracker.isActive()).toBe(true);
      });

      it('should handle missing target gracefully', function() {
        tracker = Funky.GestureTracker.create({
          target: '#non-existent-element',
          autoStart: false
        });

        // Should not throw
        tracker.start();
        expect(tracker.isActive()).toBe(false);
      });

      it('should handle null target gracefully', function() {
        tracker = Funky.GestureTracker.create({
          target: null,
          autoStart: false
        });

        tracker.start();
        expect(tracker.isActive()).toBe(false);
      });
    });

    describe('Lifecycle', function() {
      it('should auto-start when autoStart is true (default)', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl
        });

        expect(tracker.isActive()).toBe(true);
      });

      it('should not auto-start when autoStart is false', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          autoStart: false
        });

        expect(tracker.isActive()).toBe(false);
      });

      it('should start tracking with start()', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          autoStart: false
        });

        expect(tracker.isActive()).toBe(false);
        tracker.start();
        expect(tracker.isActive()).toBe(true);
      });

      it('should stop tracking with stop()', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl
        });

        expect(tracker.isActive()).toBe(true);
        tracker.stop();
        expect(tracker.isActive()).toBe(false);
      });

      it('should allow restart after stop', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl
        });

        tracker.stop();
        expect(tracker.isActive()).toBe(false);

        tracker.start();
        expect(tracker.isActive()).toBe(true);
      });

      it('should chain start() and stop()', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          autoStart: false
        });

        var result = tracker.start().stop().start();
        expect(result).toBe(tracker);
        expect(tracker.isActive()).toBe(true);
      });

      it('should clean up on destroy()', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl
        });

        tracker.destroy();
        expect(tracker.isActive()).toBe(false);
        tracker = null; // Prevent double destroy in afterEach
      });

      it('should handle multiple start() calls', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          autoStart: false
        });

        tracker.start();
        tracker.start(); // Should not throw or duplicate listeners
        expect(tracker.isActive()).toBe(true);
      });

      it('should handle multiple stop() calls', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl
        });

        tracker.stop();
        tracker.stop(); // Should not throw
        expect(tracker.isActive()).toBe(false);
      });
    });

    describe('Configuration', function() {
      it('should use default gestures (tap, swipe, longpress)', function() {
        var tapCalled = false;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          onTap: function() { tapCalled = true; }
        });

        // Default should include tap
        expect(tracker).toBeDefined();
      });

      it('should accept custom gesture list', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['drag'],
          autoStart: false
        });

        expect(tracker).toBeDefined();
      });

      it('should accept custom thresholds', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          swipeThreshold: 100,
          swipeVelocity: 0.5,
          longPressDelay: 1000,
          tapThreshold: 5,
          autoStart: false
        });

        expect(tracker).toBeDefined();
      });

      it('should accept custom namespace', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl,
          namespace: 'mygestures',
          autoStart: false
        });

        expect(tracker).toBeDefined();
      });
    });

    describe('Tap Detection', function() {
      it('should fire onTap callback for quick tap', function(done) {
        var tapData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['tap'],
          onTap: function(data) {
            tapData = data;
          }
        });

        // Simulate tap (touchstart + touchend at same position)
        dispatchTouchStart(targetEl, 100, 100);
        dispatchTouchEnd(targetEl, 100, 100);

        setTimeout(function() {
          expect(tapData).not.toBeNull();
          expect(tapData.x).toBe(100);
          expect(tapData.y).toBe(100);
          expect(tapData.target).toBe(targetEl);
          done();
        }, 50);
      });

      it('should not fire tap if movement exceeds threshold', function(done) {
        var tapCalled = false;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['tap'],
          tapThreshold: 10,
          onTap: function() {
            tapCalled = true;
          }
        });

        // Start touch then end with significant movement
        dispatchTouchStart(targetEl, 100, 100);
        dispatchTouchEnd(targetEl, 150, 150);

        setTimeout(function() {
          expect(tapCalled).toBe(false);
          done();
        }, 50);
      });
    });

    describe('Swipe Detection', function() {
      it('should detect swipe right', function(done) {
        var swipeData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['swipe'],
          swipeThreshold: 50,
          swipeVelocity: 0.1,
          onSwipe: function(data) {
            swipeData = data;
          }
        });

        // Start touch and end with rightward movement
        // Need a delay so duration > 0 for velocity calculation
        dispatchTouchStart(targetEl, 50, 100);
        setTimeout(function() {
          dispatchTouchEnd(targetEl, 150, 100);

          setTimeout(function() {
            expect(swipeData).not.toBeNull();
            expect(swipeData.direction).toBe('right');
            expect(swipeData.deltaX).toBe(100);
            done();
          }, 50);
        }, 10);
      });

      it('should detect swipe left', function(done) {
        var swipeData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['swipe'],
          swipeThreshold: 50,
          swipeVelocity: 0.1,
          onSwipe: function(data) {
            swipeData = data;
          }
        });

        dispatchTouchStart(targetEl, 150, 100);
        setTimeout(function() {
          dispatchTouchEnd(targetEl, 50, 100);

          setTimeout(function() {
            expect(swipeData).not.toBeNull();
            expect(swipeData.direction).toBe('left');
            expect(swipeData.deltaX).toBe(-100);
            done();
          }, 50);
        }, 10);
      });

      it('should detect swipe up', function(done) {
        var swipeData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['swipe'],
          swipeThreshold: 50,
          swipeVelocity: 0.1,
          onSwipe: function(data) {
            swipeData = data;
          }
        });

        dispatchTouchStart(targetEl, 100, 150);
        setTimeout(function() {
          dispatchTouchEnd(targetEl, 100, 50);

          setTimeout(function() {
            expect(swipeData).not.toBeNull();
            expect(swipeData.direction).toBe('up');
            expect(swipeData.deltaY).toBe(-100);
            done();
          }, 50);
        }, 10);
      });

      it('should detect swipe down', function(done) {
        var swipeData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['swipe'],
          swipeThreshold: 50,
          swipeVelocity: 0.1,
          onSwipe: function(data) {
            swipeData = data;
          }
        });

        dispatchTouchStart(targetEl, 100, 50);
        setTimeout(function() {
          dispatchTouchEnd(targetEl, 100, 150);

          setTimeout(function() {
            expect(swipeData).not.toBeNull();
            expect(swipeData.direction).toBe('down');
            expect(swipeData.deltaY).toBe(100);
            done();
          }, 50);
        }, 10);
      });

      it('should not detect swipe below threshold', function(done) {
        var swipeCalled = false;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['swipe'],
          swipeThreshold: 100,
          onSwipe: function() {
            swipeCalled = true;
          }
        });

        dispatchTouchStart(targetEl, 100, 100);
        // Only 50px movement, threshold is 100px
        dispatchTouchEnd(targetEl, 150, 100);

        setTimeout(function() {
          expect(swipeCalled).toBe(false);
          done();
        }, 50);
      });

      it('should include velocity in swipe data', function(done) {
        var swipeData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['swipe'],
          swipeThreshold: 50,
          swipeVelocity: 0.1,
          onSwipe: function(data) {
            swipeData = data;
          }
        });

        dispatchTouchStart(targetEl, 50, 100);
        setTimeout(function() {
          dispatchTouchEnd(targetEl, 200, 100);

          setTimeout(function() {
            expect(swipeData).not.toBeNull();
            expect(typeof swipeData.velocity).toBe('number');
            expect(swipeData.velocity).toBeGreaterThan(0);
            done();
          }, 50);
        }, 10);
      });
    });

    describe('Long Press Detection', function() {
      it('should fire onLongPress after delay', function(done) {
        var longPressData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['longpress'],
          longPressDelay: 100, // Short delay for testing
          onLongPress: function(data) {
            longPressData = data;
          }
        });

        dispatchTouchStart(targetEl, 100, 100);

        // Wait for long press to fire
        setTimeout(function() {
          expect(longPressData).not.toBeNull();
          expect(longPressData.x).toBe(100);
          expect(longPressData.y).toBe(100);
          done();
        }, 150);
      });

      it('should cancel long press on movement', function(done) {
        var longPressCalled = false;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['longpress'],
          longPressDelay: 100,
          tapThreshold: 10,
          onLongPress: function() {
            longPressCalled = true;
          }
        });

        dispatchTouchStart(targetEl, 100, 100);

        // Move beyond threshold
        setTimeout(function() {
          dispatchTouchMove(targetEl, 150, 150);
        }, 30);

        // Check after long press would have fired
        setTimeout(function() {
          expect(longPressCalled).toBe(false);
          done();
        }, 150);
      });

      it('should not fire tap after long press', function(done) {
        var tapCalled = false;
        var longPressCalled = false;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['tap', 'longpress'],
          longPressDelay: 100,
          onTap: function() {
            tapCalled = true;
          },
          onLongPress: function() {
            longPressCalled = true;
          }
        });

        dispatchTouchStart(targetEl, 100, 100);

        // Wait for long press
        setTimeout(function() {
          dispatchTouchEnd(targetEl, 100, 100);

          setTimeout(function() {
            expect(longPressCalled).toBe(true);
            expect(tapCalled).toBe(false);
            done();
          }, 50);
        }, 150);
      });
    });

    describe('Drag Detection', function() {
      it('should fire onDragStart when movement exceeds threshold', function(done) {
        var dragStartData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['drag'],
          tapThreshold: 10,
          onDragStart: function(data) {
            dragStartData = data;
          }
        });

        dispatchTouchStart(targetEl, 100, 100);
        // Move beyond threshold
        dispatchTouchMove(targetEl, 150, 150);

        setTimeout(function() {
          expect(dragStartData).not.toBeNull();
          expect(dragStartData.startX).toBe(100);
          expect(dragStartData.startY).toBe(100);
          done();
        }, 50);
      });

      it('should fire onDragMove during drag', function(done) {
        var dragMoveCount = 0;
        var lastDragData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['drag'],
          tapThreshold: 10,
          onDragMove: function(data) {
            dragMoveCount++;
            lastDragData = data;
          }
        });

        dispatchTouchStart(targetEl, 100, 100);
        // First move - triggers drag start
        dispatchTouchMove(targetEl, 150, 100);
        // Second move
        dispatchTouchMove(targetEl, 200, 100);

        setTimeout(function() {
          expect(dragMoveCount).toBeGreaterThan(0);
          expect(lastDragData.deltaX).toBe(100);
          done();
        }, 50);
      });

      it('should fire onDragEnd when touch ends', function(done) {
        var dragEndData = null;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['drag'],
          tapThreshold: 10,
          onDragEnd: function(data) {
            dragEndData = data;
          }
        });

        dispatchTouchStart(targetEl, 100, 100);
        // Move to start drag
        dispatchTouchMove(targetEl, 150, 150);
        // End drag
        dispatchTouchEnd(targetEl, 200, 200);

        setTimeout(function() {
          expect(dragEndData).not.toBeNull();
          expect(dragEndData.deltaX).toBe(100);
          expect(dragEndData.deltaY).toBe(100);
          done();
        }, 50);
      });
    });

    describe('Touch Cancel', function() {
      it('should reset state on touchcancel', function(done) {
        var tapCalled = false;
        var longPressCalled = false;

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['tap', 'longpress'],
          longPressDelay: 100,
          onTap: function() { tapCalled = true; },
          onLongPress: function() { longPressCalled = true; }
        });

        dispatchTouchStart(targetEl, 100, 100);
        // Cancel touch
        dispatchTouchCancel(targetEl, 100, 100);

        // Wait for potential long press
        setTimeout(function() {
          expect(tapCalled).toBe(false);
          expect(longPressCalled).toBe(false);
          done();
        }, 150);
      });
    });

    describe('PubSub Integration', function() {
      it('should emit events when emitEvents is true', function(done) {
        var receivedEvent = null;

        Funky.PubSub.on('funky:gesture:tap', function(data) {
          receivedEvent = data;
        });

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['tap'],
          emitEvents: true
        });

        dispatchTouchStart(targetEl, 100, 100);
        dispatchTouchEnd(targetEl, 100, 100);

        setTimeout(function() {
          Funky.PubSub.off('funky:gesture:tap');
          expect(receivedEvent).not.toBeNull();
          expect(receivedEvent.gesture).toBeDefined();
          done();
        }, 50);
      });

      it('should use custom event prefix', function(done) {
        var receivedEvent = null;

        Funky.PubSub.on('myapp:tap', function(data) {
          receivedEvent = data;
        });

        tracker = Funky.GestureTracker.create({
          target: targetEl,
          gestures: ['tap'],
          emitEvents: true,
          eventPrefix: 'myapp'
        });

        dispatchTouchStart(targetEl, 100, 100);
        dispatchTouchEnd(targetEl, 100, 100);

        setTimeout(function() {
          Funky.PubSub.off('myapp:tap');
          expect(receivedEvent).not.toBeNull();
          done();
        }, 50);
      });
    });

    describe('Event Cleanup', function() {
      it('should remove event listeners on stop()', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl
        });

        tracker.stop();

        // Tracker should not respond to touch events after stop
        expect(tracker.isActive()).toBe(false);
      });

      it('should remove event listeners on destroy()', function() {
        tracker = Funky.GestureTracker.create({
          target: targetEl
        });

        tracker.destroy();

        expect(tracker.isActive()).toBe(false);
        tracker = null;
      });
    });
  });

})();
