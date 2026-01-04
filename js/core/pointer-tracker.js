/**
 * Funky.PointerTracker
 * Low-level pointer tracking with pressure support
 * 
 * Provides unified API for mouse, touch, and stylus input with
 * element-relative coordinates and optional pressure/velocity data.
 * 
 * @namespace Funky.PointerTracker
 * @version 1.0.1
 */
(function(global) {
  'use strict';

  // Ensure Funky namespace exists
  var Funky = global.Funky || (global.Funky = {});

  // =========================================================================
  // CONSTRUCTOR
  // =========================================================================

  /**
   * PointerTracker constructor
   * @param {HTMLElement} element - Element to track pointer events on
   * @param {Object} options - Configuration options
   * @param {boolean} [options.pressure=false] - Track pressure data
   * @param {number} [options.throttle=0] - Throttle onMove callbacks (ms)
   * @param {boolean} [options.preventDefault=true] - Prevent default on touch
   * @param {boolean} [options.multiPointer=false] - Track all pointers or just first
   * @param {Function} [options.onStart] - Called on pointer down
   * @param {Function} [options.onMove] - Called on pointer move (while down)
   * @param {Function} [options.onEnd] - Called on pointer up
   * @param {Function} [options.onCancel] - Called on pointer cancel
   */
  function PointerTracker(element, options) {
    // Allow calling without 'new'
    if (!(this instanceof PointerTracker)) {
      return new PointerTracker(element, options);
    }

    if (!element || !element.nodeType) {
      throw new Error('PointerTracker: element is required');
    }

    this.element = element;
    this.options = this._mergeOptions(options || {});
    this._active = false;
    this._pointerId = null;
    this._boundHandlers = {};
    this._throttledMove = null;

    this._init();
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  /**
   * Merge user options with defaults
   * @private
   */
  PointerTracker.prototype._mergeOptions = function(options) {
    return {
      // Core options
      pressure: options.pressure !== undefined ? options.pressure : false,
      throttle: options.throttle !== undefined ? options.throttle : 0,
      preventDefault: options.preventDefault !== undefined ? options.preventDefault : true,
      multiPointer: options.multiPointer !== undefined ? options.multiPointer : false,
      
      // Extended options (Phase 2)
      velocity: options.velocity !== undefined ? options.velocity : false,
      tilt: options.tilt !== undefined ? options.tilt : false,
      coalesced: options.coalesced !== undefined ? options.coalesced : false,
      
      // Callbacks
      onStart: options.onStart || function() {},
      onMove: options.onMove || function() {},
      onEnd: options.onEnd || function() {},
      onCancel: options.onCancel || function() {}
    };
  };

  /**
   * Initialize event listeners
   * @private
   */
  PointerTracker.prototype._init = function() {
    // For velocity calculation
    this._lastPoint = null;
    
    // Check for Pointer Events support
    if (global.PointerEvent) {
      this._bindPointerEvents();
    } else {
      // Fallback to mouse + touch
      this._bindMouseEvents();
      this._bindTouchEvents();
    }
  };

  /**
   * Calculate velocity between two points
   * @private
   */
  PointerTracker.prototype._calculateVelocity = function(currentPoint, lastPoint) {
    if (!lastPoint) {
      return { x: 0, y: 0, magnitude: 0 };
    }
    
    var dt = currentPoint.time - lastPoint.time;
    if (dt === 0) {
      return { x: 0, y: 0, magnitude: 0 };
    }
    
    var dx = currentPoint.x - lastPoint.x;
    var dy = currentPoint.y - lastPoint.y;
    
    var vx = dx / dt;
    var vy = dy / dt;
    var magnitude = Math.sqrt(vx * vx + vy * vy);
    
    return {
      x: vx,
      y: vy,
      magnitude: magnitude
    };
  };

  /**
   * Emit move event with optional throttling
   * @private
   */
  PointerTracker.prototype._emitMove = function(point) {
    if (this.options.throttle > 0 && Funky.Timing && Funky.Timing.throttle) {
      if (!this._throttledMove) {
        this._throttledMove = Funky.Timing.throttle(
          this.options.onMove,
          this.options.throttle
        );
      }
      this._throttledMove(point);
    } else {
      this.options.onMove(point);
    }
  };

  // =========================================================================
  // POINTER EVENTS (Modern browsers)
  // =========================================================================

  /**
   * Bind Pointer Events API handlers
   * @private
   */
  PointerTracker.prototype._bindPointerEvents = function() {
    var self = this;

    this._boundHandlers.pointerdown = function(e) {
      self._handlePointerDown(e);
    };

    this._boundHandlers.pointermove = function(e) {
      self._handlePointerMove(e);
    };

    this._boundHandlers.pointerup = function(e) {
      self._handlePointerUp(e);
    };

    this._boundHandlers.pointercancel = function(e) {
      self._handlePointerCancel(e);
    };

    this.element.addEventListener('pointerdown', this._boundHandlers.pointerdown);
    this.element.addEventListener('pointermove', this._boundHandlers.pointermove);
    this.element.addEventListener('pointerup', this._boundHandlers.pointerup);
    this.element.addEventListener('pointercancel', this._boundHandlers.pointercancel);
  };

  /**
   * Handle pointer down
   * @private
   */
  PointerTracker.prototype._handlePointerDown = function(e) {
    // Track only first pointer unless multiPointer enabled
    if (!this.options.multiPointer && this._active) return;

    if (this.options.preventDefault) {
      e.preventDefault();
    }

    // Capture pointer for drag operations
    try {
      this.element.setPointerCapture(e.pointerId);
    } catch (err) {
      // Pointer capture may fail in some browsers
    }

    this._active = true;
    this._pointerId = e.pointerId;
    
    // Reset velocity tracking
    this._lastPoint = null;

    var point = this._createPoint(e);
    
    // Store as last point for velocity
    if (this.options.velocity) {
      this._lastPoint = { x: point.x, y: point.y, time: point.time };
    }
    
    this.options.onStart(point);
  };

  /**
   * Handle pointer move
   * @private
   */
  PointerTracker.prototype._handlePointerMove = function(e) {
    if (!this._active) return;

    // Only track our pointer
    if (!this.options.multiPointer && e.pointerId !== this._pointerId) return;

    // Use coalesced events for high-resolution input (drawing apps)
    if (this.options.coalesced && e.getCoalescedEvents) {
      var events = e.getCoalescedEvents();
      for (var i = 0; i < events.length; i++) {
        var point = this._createPoint(events[i]);
        this._emitMove(point);
      }
    } else {
      var point = this._createPoint(e);
      this._emitMove(point);
    }
  };

  /**
   * Handle pointer up
   * @private
   */
  PointerTracker.prototype._handlePointerUp = function(e) {
    if (!this._active) return;
    if (!this.options.multiPointer && e.pointerId !== this._pointerId) return;

    try {
      this.element.releasePointerCapture(e.pointerId);
    } catch (err) {
      // May fail if not captured
    }

    this._active = false;
    this._pointerId = null;
    
    // Clear velocity tracking
    this._lastPoint = null;

    var point = this._createPoint(e);
    this.options.onEnd(point);
  };

  /**
   * Handle pointer cancel
   * @private
   */
  PointerTracker.prototype._handlePointerCancel = function(e) {
    if (!this._active) return;

    try {
      this.element.releasePointerCapture(e.pointerId);
    } catch (err) {
      // May fail if not captured
    }

    this._active = false;
    this._pointerId = null;

    this.options.onCancel();
  };

  /**
   * Create point object from Pointer Event
   * @private
   */
  PointerTracker.prototype._createPoint = function(e) {
    var rect = this.element.getBoundingClientRect();

    var point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: this.options.pressure ? (e.pressure || 0.5) : 0.5,
      time: Date.now(),
      pointerId: e.pointerId,
      pointerType: e.pointerType || 'mouse'
    };
    
    // Add velocity if enabled
    if (this.options.velocity) {
      point.velocity = this._calculateVelocity(point, this._lastPoint);
      this._lastPoint = { x: point.x, y: point.y, time: point.time };
    }
    
    // Add tilt data if enabled and available (stylus/pen)
    if (this.options.tilt && e.pointerType === 'pen') {
      point.tilt = {
        x: e.tiltX || 0,
        y: e.tiltY || 0
      };
      point.twist = e.twist || 0;
      point.tangentialPressure = e.tangentialPressure || 0;
    }
    
    return point;
  };

  // =========================================================================
  // MOUSE FALLBACK (Older browsers)
  // =========================================================================

  /**
   * Bind mouse event handlers
   * @private
   */
  PointerTracker.prototype._bindMouseEvents = function() {
    var self = this;

    this._boundHandlers.mousedown = function(e) {
      self._active = true;
      
      // Reset velocity tracking
      self._lastPoint = null;
      
      var point = self._createMousePoint(e);
      
      // Store as last point for velocity
      if (self.options.velocity) {
        self._lastPoint = { x: point.x, y: point.y, time: point.time };
      }
      
      self.options.onStart(point);

      // Bind move/up to document for drag
      document.addEventListener('mousemove', self._boundHandlers.mousemove);
      document.addEventListener('mouseup', self._boundHandlers.mouseup);
    };

    this._boundHandlers.mousemove = function(e) {
      if (!self._active) return;
      var point = self._createMousePoint(e);
      self._emitMove(point);
    };

    this._boundHandlers.mouseup = function(e) {
      if (!self._active) return;
      self._active = false;
      
      // Clear velocity tracking
      self._lastPoint = null;
      
      var point = self._createMousePoint(e);
      self.options.onEnd(point);

      document.removeEventListener('mousemove', self._boundHandlers.mousemove);
      document.removeEventListener('mouseup', self._boundHandlers.mouseup);
    };

    this.element.addEventListener('mousedown', this._boundHandlers.mousedown);
  };

  /**
   * Create point object from Mouse Event
   * @private
   */
  PointerTracker.prototype._createMousePoint = function(e) {
    var rect = this.element.getBoundingClientRect();
    var point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: 0.5,
      time: Date.now(),
      pointerId: 0,
      pointerType: 'mouse'
    };
    
    // Add velocity if enabled
    if (this.options.velocity) {
      point.velocity = this._calculateVelocity(point, this._lastPoint);
      this._lastPoint = { x: point.x, y: point.y, time: point.time };
    }
    
    return point;
  };

  // =========================================================================
  // TOUCH FALLBACK (Older browsers without Pointer Events)
  // =========================================================================

  /**
   * Bind touch event handlers
   * @private
   */
  PointerTracker.prototype._bindTouchEvents = function() {
    var self = this;
    
    // Force Touch detection (Safari/iOS)
    this._forceTouchSupported = 'ontouchforcechange' in document;

    this._boundHandlers.touchstart = function(e) {
      if (self.options.preventDefault) {
        e.preventDefault();
      }
      if (e.touches.length === 1) {
        self._active = true;
        
        // Reset velocity tracking
        self._lastPoint = null;
        
        var point = self._createTouchPoint(e.touches[0]);
        
        // Store as last point for velocity
        if (self.options.velocity) {
          self._lastPoint = { x: point.x, y: point.y, time: point.time };
        }
        
        self.options.onStart(point);
      }
    };

    this._boundHandlers.touchmove = function(e) {
      if (!self._active) return;
      if (self.options.preventDefault) {
        e.preventDefault();
      }
      if (e.touches.length === 1) {
        var point = self._createTouchPoint(e.touches[0]);
        self._emitMove(point);
      }
    };

    this._boundHandlers.touchend = function(e) {
      if (!self._active) return;
      self._active = false;
      
      // Clear velocity tracking
      self._lastPoint = null;
      
      // Use changedTouches for end event
      var point = e.changedTouches.length ?
        self._createTouchPoint(e.changedTouches[0]) :
        null;
      self.options.onEnd(point);
    };

    this._boundHandlers.touchcancel = function(e) {
      if (!self._active) return;
      self._active = false;
      self._lastPoint = null;
      self.options.onCancel();
    };
    
    // Force Touch: emit move on pressure change (Safari/iOS)
    if (this._forceTouchSupported && this.options.pressure) {
      this._boundHandlers.touchforcechange = function(e) {
        if (!self._active) return;
        if (e.changedTouches.length === 1) {
          var point = self._createTouchPoint(e.changedTouches[0]);
          self.options.onMove(point);  // Emit as move with updated pressure
        }
      };
      
      this.element.addEventListener('touchforcechange', this._boundHandlers.touchforcechange);
    }

    this.element.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: false });
    this.element.addEventListener('touchmove', this._boundHandlers.touchmove, { passive: false });
    this.element.addEventListener('touchend', this._boundHandlers.touchend);
    this.element.addEventListener('touchcancel', this._boundHandlers.touchcancel);
  };

  /**
   * Create point object from Touch
   * @private
   */
  PointerTracker.prototype._createTouchPoint = function(touch) {
    var rect = this.element.getBoundingClientRect();
    var point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      pressure: this.options.pressure ? (touch.force || 0.5) : 0.5,
      time: Date.now(),
      pointerId: touch.identifier,
      pointerType: 'touch'
    };
    
    // Add velocity if enabled
    if (this.options.velocity) {
      point.velocity = this._calculateVelocity(point, this._lastPoint);
      this._lastPoint = { x: point.x, y: point.y, time: point.time };
    }
    
    return point;
  };

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Check if currently tracking a pointer
   * @returns {boolean}
   */
  PointerTracker.prototype.isActive = function() {
    return this._active;
  };

  /**
   * Clean up all event listeners
   */
  PointerTracker.prototype.destroy = function() {
    // Remove pointer events
    if (this._boundHandlers.pointerdown) {
      this.element.removeEventListener('pointerdown', this._boundHandlers.pointerdown);
      this.element.removeEventListener('pointermove', this._boundHandlers.pointermove);
      this.element.removeEventListener('pointerup', this._boundHandlers.pointerup);
      this.element.removeEventListener('pointercancel', this._boundHandlers.pointercancel);
    }

    // Remove mouse events
    if (this._boundHandlers.mousedown) {
      this.element.removeEventListener('mousedown', this._boundHandlers.mousedown);
      document.removeEventListener('mousemove', this._boundHandlers.mousemove);
      document.removeEventListener('mouseup', this._boundHandlers.mouseup);
    }

    // Remove touch events
    if (this._boundHandlers.touchstart) {
      this.element.removeEventListener('touchstart', this._boundHandlers.touchstart);
      this.element.removeEventListener('touchmove', this._boundHandlers.touchmove);
      this.element.removeEventListener('touchend', this._boundHandlers.touchend);
      this.element.removeEventListener('touchcancel', this._boundHandlers.touchcancel);
    }
    
    // Remove Force Touch event
    if (this._boundHandlers.touchforcechange) {
      this.element.removeEventListener('touchforcechange', this._boundHandlers.touchforcechange);
    }

    this._boundHandlers = {};
    this._active = false;
    this._pointerId = null;
    this._throttledMove = null;
    this._lastPoint = null;
  };

  // =========================================================================
  // EXPORT
  // =========================================================================

  if (Funky.register) {
    Funky.register('PointerTracker', PointerTracker);
  }

})(window);
