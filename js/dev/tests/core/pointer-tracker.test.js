/**
 * PointerTracker Tests
 * Tests for the Funky.PointerTracker core module
 */

describe('Funky.Core.PointerTracker', function() {

    var testElement;
    var tracker;
    
    // Setup helper
    function createTestElement() {
      testElement = document.createElement('div');
      testElement.style.cssText = 'width: 200px; height: 200px; position: absolute; top: 0; left: 0;';
      document.body.appendChild(testElement);
      return testElement;
    }
    
    // Cleanup helper
    function cleanup() {
      if (tracker) {
        tracker.destroy();
        tracker = null;
      }
      if (testElement && testElement.parentNode) {
        testElement.parentNode.removeChild(testElement);
        testElement = null;
      }
    }
    
    // Simulate pointer event
    function simulatePointerDown(element, x, y, options) {
      options = options || {};
      var event = new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: options.pointerId || 1,
        pointerType: options.pointerType || 'mouse',
        pressure: options.pressure || 0.5
      });
      element.dispatchEvent(event);
    }
    
    function simulatePointerMove(element, x, y, options) {
      options = options || {};
      var event = new PointerEvent('pointermove', {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: options.pointerId || 1,
        pointerType: options.pointerType || 'mouse',
        pressure: options.pressure || 0.5
      });
      element.dispatchEvent(event);
    }
    
    function simulatePointerUp(element, x, y, options) {
      options = options || {};
      var event = new PointerEvent('pointerup', {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: options.pointerId || 1,
        pointerType: options.pointerType || 'mouse'
      });
      element.dispatchEvent(event);
    }
    
    function simulatePointerCancel(element, options) {
      options = options || {};
      var event = new PointerEvent('pointercancel', {
        bubbles: true,
        pointerId: options.pointerId || 1
      });
      element.dispatchEvent(event);
    }

    // === Constructor Tests ===
    
    it('should create instance with element', function() {
      createTestElement();
      tracker = new Funky.PointerTracker(testElement, {});
      expect(tracker).toBeDefined();
      expect(tracker.element).toBe(testElement);
      cleanup();
    });
    
    it('should work without "new" keyword', function() {
      createTestElement();
      tracker = Funky.PointerTracker(testElement, {});
      expect(tracker instanceof Funky.PointerTracker).toBe(true);
      cleanup();
    });
    
    it('should throw error without element', function() {
      var threw = false;
      try {
        tracker = new Funky.PointerTracker(null, {});
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(true);
    });
    
    it('should merge default options', function() {
      createTestElement();
      tracker = new Funky.PointerTracker(testElement, {});
      expect(tracker.options.pressure).toBe(false);
      expect(tracker.options.throttle).toBe(0);
      expect(tracker.options.preventDefault).toBe(true);
      expect(tracker.options.velocity).toBe(false);
      expect(tracker.options.tilt).toBe(false);
      expect(tracker.options.coalesced).toBe(false);
      cleanup();
    });
    
    it('should accept custom options', function() {
      createTestElement();
      tracker = new Funky.PointerTracker(testElement, {
        pressure: true,
        throttle: 16,
        preventDefault: false,
        velocity: true,
        tilt: true,
        coalesced: true
      });
      expect(tracker.options.pressure).toBe(true);
      expect(tracker.options.throttle).toBe(16);
      expect(tracker.options.preventDefault).toBe(false);
      expect(tracker.options.velocity).toBe(true);
      expect(tracker.options.tilt).toBe(true);
      expect(tracker.options.coalesced).toBe(true);
      cleanup();
    });

    // === Callback Tests ===
    
    it('should call onStart on pointer down', function() {
      createTestElement();
      var called = false;
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function(point) {
          called = true;
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50);
      
      expect(called).toBe(true);
      expect(receivedPoint).toBeDefined();
      expect(receivedPoint.x).toBe(50);
      expect(receivedPoint.y).toBe(50);
      cleanup();
    });
    
    it('should call onMove on pointer move when active', function() {
      createTestElement();
      var moveCount = 0;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {},
        onMove: function() {
          moveCount++;
        }
      });
      
      simulatePointerDown(testElement, 50, 50);
      simulatePointerMove(testElement, 60, 60);
      simulatePointerMove(testElement, 70, 70);
      
      expect(moveCount).toBe(2);
      cleanup();
    });
    
    it('should NOT call onMove when not active', function() {
      createTestElement();
      var moveCount = 0;
      
      tracker = new Funky.PointerTracker(testElement, {
        onMove: function() {
          moveCount++;
        }
      });
      
      // Move without pointer down
      simulatePointerMove(testElement, 60, 60);
      
      expect(moveCount).toBe(0);
      cleanup();
    });
    
    it('should call onEnd on pointer up', function() {
      createTestElement();
      var endCalled = false;
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {},
        onEnd: function(point) {
          endCalled = true;
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50);
      simulatePointerUp(testElement, 60, 70);
      
      expect(endCalled).toBe(true);
      expect(receivedPoint.x).toBe(60);
      expect(receivedPoint.y).toBe(70);
      cleanup();
    });
    
    it('should call onCancel on pointer cancel', function() {
      createTestElement();
      var cancelCalled = false;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {},
        onCancel: function() {
          cancelCalled = true;
        }
      });
      
      simulatePointerDown(testElement, 50, 50);
      simulatePointerCancel(testElement);
      
      expect(cancelCalled).toBe(true);
      cleanup();
    });

    // === isActive Tests ===
    
    it('should report isActive correctly', function() {
      createTestElement();
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {},
        onEnd: function() {}
      });
      
      expect(tracker.isActive()).toBe(false);
      
      simulatePointerDown(testElement, 50, 50);
      expect(tracker.isActive()).toBe(true);
      
      simulatePointerUp(testElement, 50, 50);
      expect(tracker.isActive()).toBe(false);
      
      cleanup();
    });
    
    it('should set isActive false on cancel', function() {
      createTestElement();
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {},
        onCancel: function() {}
      });
      
      simulatePointerDown(testElement, 50, 50);
      expect(tracker.isActive()).toBe(true);
      
      simulatePointerCancel(testElement);
      expect(tracker.isActive()).toBe(false);
      
      cleanup();
    });

    // === Point Data Tests ===
    
    it('should include time in point', function() {
      createTestElement();
      var receivedPoint = null;
      var beforeTime = Date.now();
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function(point) {
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50);
      var afterTime = Date.now();
      
      expect(receivedPoint.time).toBeGreaterThanOrEqual(beforeTime);
      expect(receivedPoint.time).toBeLessThanOrEqual(afterTime);
      cleanup();
    });
    
    it('should include pointerId in point', function() {
      createTestElement();
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function(point) {
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50, { pointerId: 42 });
      
      expect(receivedPoint.pointerId).toBe(42);
      cleanup();
    });
    
    it('should include pointerType in point', function() {
      createTestElement();
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function(point) {
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50, { pointerType: 'pen' });
      
      expect(receivedPoint.pointerType).toBe('pen');
      cleanup();
    });

    // === Pressure Tests ===
    
    it('should include pressure when enabled', function() {
      createTestElement();
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        pressure: true,
        onStart: function(point) {
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50, { pressure: 0.75 });
      
      expect(receivedPoint.pressure).toBe(0.75);
      cleanup();
    });
    
    it('should default pressure to 0.5 when not available', function() {
      createTestElement();
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        pressure: true,
        onStart: function(point) {
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50, { pressure: 0 });
      
      expect(receivedPoint.pressure).toBe(0.5);
      cleanup();
    });
    
    it('should always be 0.5 when pressure disabled', function() {
      createTestElement();
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        pressure: false,
        onStart: function(point) {
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50, { pressure: 0.9 });
      
      expect(receivedPoint.pressure).toBe(0.5);
      cleanup();
    });

    // === Velocity Tests ===
    
    it('should include velocity when enabled', function(done) {
      createTestElement();
      var points = [];
      
      tracker = new Funky.PointerTracker(testElement, {
        velocity: true,
        onStart: function(point) {
          points.push(point);
        },
        onMove: function(point) {
          points.push(point);
        }
      });
      
      simulatePointerDown(testElement, 50, 50);
      
      // Wait for time delta
      setTimeout(function() {
        simulatePointerMove(testElement, 100, 50);
        
        expect(points.length).toBe(2);
        expect(points[0].velocity).toBeDefined();
        expect(points[0].velocity.magnitude).toBe(0);  // First point has no velocity
        expect(points[1].velocity).toBeDefined();
        expect(points[1].velocity.x).toBeGreaterThan(0);  // Moved right
        expect(points[1].velocity.magnitude).toBeGreaterThan(0);
        
        cleanup();
        done();
      }, 20);
    });
    
    it('should reset velocity on new stroke', function(done) {
      createTestElement();
      var startPoints = [];
      
      tracker = new Funky.PointerTracker(testElement, {
        velocity: true,
        onStart: function(point) {
          startPoints.push(point);
        },
        onEnd: function() {}
      });
      
      simulatePointerDown(testElement, 50, 50);
      
      setTimeout(function() {
        simulatePointerUp(testElement, 100, 50);
        
        // Start new stroke
        simulatePointerDown(testElement, 200, 200);
        
        // Second stroke should start with zero velocity
        expect(startPoints.length).toBe(2);
        expect(startPoints[1].velocity.magnitude).toBe(0);
        
        cleanup();
        done();
      }, 20);
    });
    
    it('should NOT include velocity when disabled', function() {
      createTestElement();
      var receivedPoint = null;
      
      tracker = new Funky.PointerTracker(testElement, {
        velocity: false,
        onStart: function(point) {
          receivedPoint = point;
        }
      });
      
      simulatePointerDown(testElement, 50, 50);
      
      expect(receivedPoint.velocity).toBeUndefined();
      cleanup();
    });

    // === Destroy Tests ===
    
    it('should clean up on destroy', function() {
      createTestElement();
      var startCalled = false;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {
          startCalled = true;
        }
      });
      
      tracker.destroy();
      
      // Try triggering event after destroy
      simulatePointerDown(testElement, 50, 50);
      
      expect(startCalled).toBe(false);
      cleanup();
    });
    
    it('should reset internal state on destroy', function() {
      createTestElement();
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {}
      });
      
      simulatePointerDown(testElement, 50, 50);
      expect(tracker.isActive()).toBe(true);
      
      tracker.destroy();
      
      expect(tracker.isActive()).toBe(false);
      expect(tracker._pointerId).toBe(null);
      expect(tracker._lastPoint).toBe(null);
      cleanup();
    });

    // === Multiple Pointers ===
    
    it('should ignore second pointer by default', function() {
      createTestElement();
      var startCount = 0;
      
      tracker = new Funky.PointerTracker(testElement, {
        onStart: function() {
          startCount++;
        }
      });
      
      simulatePointerDown(testElement, 50, 50, { pointerId: 1 });
      simulatePointerDown(testElement, 100, 100, { pointerId: 2 });
      
      expect(startCount).toBe(1);
      cleanup();
    });
    
    it('should track multiple pointers when enabled', function() {
      createTestElement();
      var startCount = 0;
      
      tracker = new Funky.PointerTracker(testElement, {
        multiPointer: true,
        onStart: function() {
          startCount++;
        }
      });
      
      simulatePointerDown(testElement, 50, 50, { pointerId: 1 });
      simulatePointerDown(testElement, 100, 100, { pointerId: 2 });
      
      expect(startCount).toBe(2);
      cleanup();
    });

});
