/**
 * Funky.GestureTracker
 * 
 * Factory for touch gesture detection with tap, swipe, long-press, and drag support.
 * 
 * @example
 * var gesture = Funky.GestureTracker.create({
 *   target: '#my-element',
 *   gestures: ['swipe', 'longpress'],
 *   onSwipe: function(data) { console.log(data.direction); },
 *   onLongPress: function(data) { showContextMenu(data.x, data.y); }
 * });
 * 
 * gesture.destroy();
 * 
 * @version 1.0.0
 */
(function(global) {
  'use strict';

  // Ensure Funky registry exists
  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.GestureTracker] Registry not found. Load namespace.js first.');
    return;
  }

  // Prevent duplicate registration
  if (global.Funky.isRegistered && global.Funky.isRegistered('GestureTracker')) {
    return;
  }

  var Funky = global.Funky;
  var E = Funky.Events;
  var PubSub = Funky.PubSub;

  // =========================================================================
  // Defaults
  // =========================================================================

  var DEFAULTS = {
    // Target element, selector, or Funky.Dom element
    target: null,
    
    // Namespace for event cleanup (touchstart.funky.{namespace})
    namespace: 'gesturetracker',
    
    // Gestures to detect: 'tap', 'swipe', 'longpress', 'drag'
    gestures: ['tap', 'swipe', 'longpress'],
    
    // Thresholds
    swipeThreshold: 50,       // px minimum distance for swipe
    swipeVelocity: 0.3,       // px/ms minimum velocity for swipe
    longPressDelay: 500,      // ms to trigger long-press
    tapThreshold: 10,         // max px movement to still count as tap
    
    // Callbacks
    onTap: null,
    onSwipe: null,
    onLongPress: null,
    onDragStart: null,
    onDragMove: null,
    onDragEnd: null,
    
    // Options
    preventDefault: false,    // Prevent default on touchmove
    passive: true,            // Use passive listeners where possible
    hapticFeedback: false,    // Vibrate on gesture detection
    autoStart: true,          // Start tracking immediately
    
    // PubSub integration
    emitEvents: false,        // Emit PubSub events for gestures
    eventPrefix: 'funky:gesture'  // PubSub event prefix
  };

  // =========================================================================
  // Instance Counter
  // =========================================================================

  var instanceCounter = 0;

  // =========================================================================
  // GestureTrackerInstance Constructor
  // =========================================================================

  /**
   * GestureTracker instance
   * @param {Object} options - Configuration options
   */
  function GestureTrackerInstance(options) {
    this._id = 'gesture-tracker-' + (++instanceCounter);
    
    // Merge config with defaults
    this._config = {};
    for (var key in DEFAULTS) {
      if (DEFAULTS.hasOwnProperty(key)) {
        this._config[key] = DEFAULTS[key];
      }
    }
    if (options) {
      for (var optKey in options) {
        if (options.hasOwnProperty(optKey)) {
          this._config[optKey] = options[optKey];
        }
      }
    }
    
    // Normalize gestures to array
    if (!Array.isArray(this._config.gestures)) {
      this._config.gestures = [];
    }
    
    // Initialize state
    this._state = {
      // Touch tracking
      startX: 0,
      startY: 0,
      startTime: 0,
      currentX: 0,
      currentY: 0,
      
      // Gesture state
      isActive: false,
      isDragging: false,
      longPressTimer: null,
      longPressFired: false,
      
      // Touch info
      touchId: null,
      target: null,
      
      // Mouse tracking (for desktop)
      isMouseDown: false
    };
    
    this._target = null;
    
    // Bind handlers - Touch
    this._boundTouchStart = this._onTouchStart.bind(this);
    this._boundTouchMove = this._onTouchMove.bind(this);
    this._boundTouchEnd = this._onTouchEnd.bind(this);
    this._boundTouchCancel = this._onTouchCancel.bind(this);
    
    // Bind handlers - Mouse (for desktop support)
    this._boundMouseDown = this._onMouseDown.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseUp = this._onMouseUp.bind(this);
    this._boundMouseLeave = this._onMouseLeave.bind(this);
    
    // Resolve target
    this._target = this._getTarget();
    if (!this._target) {
      console.warn('[GestureTracker] Target not found:', this._config.target);
      return;
    }
    
    // Auto-start if configured
    if (this._config.autoStart) {
      this.start();
    }
  }

  // =========================================================================
  // Target Resolution
  // =========================================================================

  /**
   * Get the gesture target element
   * @returns {Element|null}
   */
  GestureTrackerInstance.prototype._getTarget = function() {
    var target = this._config.target;
    
    if (!target) return null;
    
    // Already a DOM element
    if (target.nodeType) {
      return target;
    }
    
    // Selector string
    if (typeof target === 'string') {
      return document.querySelector(target);
    }
    
    // Funky.Dom element
    if (target.get && typeof target.get === 'function') {
      return target.get();
    }
    
    return null;
  };

  // =========================================================================
  // Gesture Detection Helpers
  // =========================================================================

  /**
   * Check if a gesture type is enabled
   * @param {string} gesture - Gesture name
   * @returns {boolean}
   */
  GestureTrackerInstance.prototype._hasGesture = function(gesture) {
    return this._config.gestures.indexOf(gesture) !== -1;
  };

  /**
   * Get the tracked touch from a touch list
   * @param {TouchList} touches - Touch list from event
   * @returns {Touch|null}
   */
  GestureTrackerInstance.prototype._getTrackedTouch = function(touches) {
    if (!this._state) return null;
    for (var i = 0; i < touches.length; i++) {
      if (touches[i].identifier === this._state.touchId) {
        return touches[i];
      }
    }
    return null;
  };

  /**
   * Check if movement qualifies as a swipe
   * @param {number} distance - Total distance moved
   * @param {number} velocity - Movement velocity in px/ms
   * @returns {boolean}
   */
  GestureTrackerInstance.prototype._isSwipe = function(distance, velocity) {
    return distance >= this._config.swipeThreshold && 
           velocity >= this._config.swipeVelocity;
  };

  /**
   * Determine swipe direction from deltas
   * @param {number} deltaX - Horizontal delta
   * @param {number} deltaY - Vertical delta
   * @returns {string} 'up', 'down', 'left', or 'right'
   */
  GestureTrackerInstance.prototype._getSwipeDirection = function(deltaX, deltaY) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    }
    return deltaY > 0 ? 'down' : 'up';
  };

  // =========================================================================
  // Touch Handlers
  // =========================================================================

  /**
   * Handle touch start
   * @param {TouchEvent} e
   */
  GestureTrackerInstance.prototype._onTouchStart = function(e) {
    if (!this._config || !this._state) return;

    // Already tracking a touch
    if (this._state.touchId !== null) return;
    
    var touch = e.touches[0];
    this._state.touchId = touch.identifier;
    this._state.startX = touch.clientX;
    this._state.startY = touch.clientY;
    this._state.currentX = touch.clientX;
    this._state.currentY = touch.clientY;
    this._state.startTime = Date.now();
    this._state.target = e.target;
    this._state.longPressFired = false;
    this._state.isDragging = false;
    
    // Start long-press timer
    if (this._hasGesture('longpress')) {
      this._startLongPressTimer();
    }
  };

  /**
   * Handle touch move
   * @param {TouchEvent} e
   */
  GestureTrackerInstance.prototype._onTouchMove = function(e) {
    if (!this._config || !this._state) return;

    var touch = this._getTrackedTouch(e.touches);
    if (!touch) return;
    
    var deltaX = touch.clientX - this._state.startX;
    var deltaY = touch.clientY - this._state.startY;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    this._state.currentX = touch.clientX;
    this._state.currentY = touch.clientY;
    
    // Cancel long-press if moved too far
    if (distance > this._config.tapThreshold) {
      this._cancelLongPress();
    }
    
    // Handle drag
    if (this._hasGesture('drag')) {
      if (!this._state.isDragging && distance > this._config.tapThreshold) {
        this._state.isDragging = true;
        this._fireDragStart(e);
      }
      
      if (this._state.isDragging) {
        if (this._config.preventDefault) {
          e.preventDefault();
        }
        this._fireDragMove(e);
      }
    }
  };

  /**
   * Handle touch end
   * @param {TouchEvent} e
   */
  GestureTrackerInstance.prototype._onTouchEnd = function(e) {
    if (!this._config || !this._state) return;

    var touch = this._getTrackedTouch(e.changedTouches);
    if (!touch) return;
    
    this._cancelLongPress();
    
    var deltaX = touch.clientX - this._state.startX;
    var deltaY = touch.clientY - this._state.startY;
    var duration = Date.now() - this._state.startTime;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    // Instant gestures (duration 0) should pass velocity check
    var velocity = duration > 0 ? distance / duration : Infinity;

    // Check for drag end
    if (this._state.isDragging) {
      this._fireDragEnd(e, touch);
    }
    // Check for swipe
    else if (this._hasGesture('swipe') && this._isSwipe(distance, velocity)) {
      this._fireSwipe(deltaX, deltaY, velocity, duration);
    }
    // Check for tap (only if long-press didn't fire)
    else if (this._hasGesture('tap') && !this._state.longPressFired && distance < this._config.tapThreshold) {
      this._fireTap(touch);
    }
    
    this._resetState();
  };

  /**
   * Handle touch cancel
   */
  GestureTrackerInstance.prototype._onTouchCancel = function() {
    if (!this._config || !this._state) return;

    this._cancelLongPress();
    this._resetState();
  };

  // =========================================================================
  // Mouse Handlers (Desktop Support)
  // =========================================================================

  /**
   * Handle mouse down (equivalent to touch start)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._onMouseDown = function(e) {
    if (!this._config || !this._state) return;

    // Only track left mouse button
    if (e.button !== 0) return;

    // Already tracking
    if (this._state.isMouseDown) return;
    
    this._state.isMouseDown = true;
    this._state.startX = e.clientX;
    this._state.startY = e.clientY;
    this._state.currentX = e.clientX;
    this._state.currentY = e.clientY;
    this._state.startTime = Date.now();
    this._state.target = e.target;
    this._state.longPressFired = false;
    this._state.isDragging = false;
    
    // Start long-press timer
    if (this._hasGesture('longpress')) {
      this._startLongPressTimer();
    }
  };

  /**
   * Handle mouse move (equivalent to touch move)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._onMouseMove = function(e) {
    if (!this._config || !this._state) return;
    if (!this._state.isMouseDown) return;
    
    var deltaX = e.clientX - this._state.startX;
    var deltaY = e.clientY - this._state.startY;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    this._state.currentX = e.clientX;
    this._state.currentY = e.clientY;
    
    // Cancel long-press if moved too far
    if (distance > this._config.tapThreshold) {
      this._cancelLongPress();
    }
    
    // Handle drag
    if (this._hasGesture('drag')) {
      if (!this._state.isDragging && distance > this._config.tapThreshold) {
        this._state.isDragging = true;
        this._fireDragStartMouse(e);
      }
      
      if (this._state.isDragging) {
        if (this._config.preventDefault) {
          e.preventDefault();
        }
        this._fireDragMoveMouse(e);
      }
    }
  };

  /**
   * Handle mouse up (equivalent to touch end)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._onMouseUp = function(e) {
    if (!this._config || !this._state) return;
    if (!this._state.isMouseDown) return;
    
    this._cancelLongPress();
    
    var deltaX = e.clientX - this._state.startX;
    var deltaY = e.clientY - this._state.startY;
    var duration = Date.now() - this._state.startTime;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    // Instant gestures (duration 0) should pass velocity check
    var velocity = duration > 0 ? distance / duration : Infinity;

    // Check for drag end
    if (this._state.isDragging) {
      this._fireDragEndMouse(e);
    }
    // Check for swipe
    else if (this._hasGesture('swipe') && this._isSwipe(distance, velocity)) {
      this._fireSwipe(deltaX, deltaY, velocity, duration);
    }
    // Check for tap (only if long-press didn't fire)
    else if (this._hasGesture('tap') && !this._state.longPressFired && distance < this._config.tapThreshold) {
      this._fireTapMouse(e);
    }
    
    this._resetState();
  };

  /**
   * Handle mouse leave (equivalent to touch cancel)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._onMouseLeave = function(e) {
    if (!this._config || !this._state) return;
    if (!this._state.isMouseDown) return;
    
    this._cancelLongPress();
    
    // If dragging, fire drag end before reset
    if (this._state.isDragging) {
      this._fireDragEndMouse(e);
    }
    
    this._resetState();
  };

  // =========================================================================
  // Long-Press Timer
  // =========================================================================

  /**
   * Start long-press detection timer
   */
  GestureTrackerInstance.prototype._startLongPressTimer = function() {
    var self = this;
    this._cancelLongPress();
    
    this._state.longPressTimer = setTimeout(function() {
      self._state.longPressFired = true;
      self._fireLongPress();
    }, this._config.longPressDelay);
  };

  /**
   * Cancel long-press timer
   */
  GestureTrackerInstance.prototype._cancelLongPress = function() {
    if (this._state.longPressTimer) {
      clearTimeout(this._state.longPressTimer);
      this._state.longPressTimer = null;
    }
  };

  // =========================================================================
  // Haptic Feedback
  // =========================================================================

  /**
   * Trigger haptic feedback if enabled
   */
  GestureTrackerInstance.prototype._triggerHaptic = function() {
    if (!this._config || !this._config.hapticFeedback) return;
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // =========================================================================
  // PubSub Emission
  // =========================================================================

  /**
   * Emit PubSub event if enabled
   * @param {string} gesture - Gesture name
   * @param {Object} data - Gesture data
   */
  GestureTrackerInstance.prototype._emitEvent = function(gesture, data) {
    if (!this._config || !this._config.emitEvents || !PubSub) return;
    
    PubSub.emit(this._config.eventPrefix + ':' + gesture, {
      namespace: this._config.namespace,
      id: this._id,
      gesture: data
    });
  };

  // =========================================================================
  // Fire Callbacks
  // =========================================================================

  /**
   * Fire tap callback
   * @param {Touch} touch
   */
  GestureTrackerInstance.prototype._fireTap = function(touch) {
    if (!this._config || !this._state) return;

    var data = {
      x: touch.clientX,
      y: touch.clientY,
      target: this._state.target,
      timestamp: Date.now()
    };

    this._triggerHaptic();

    if (this._config.onTap) {
      this._config.onTap(data);
    }

    this._emitEvent('tap', data);
  };

  /**
   * Fire swipe callback
   * @param {number} deltaX
   * @param {number} deltaY
   * @param {number} velocity
   * @param {number} duration
   */
  GestureTrackerInstance.prototype._fireSwipe = function(deltaX, deltaY, velocity, duration) {
    if (!this._config || !this._state) return;

    var data = {
      direction: this._getSwipeDirection(deltaX, deltaY),
      velocity: velocity,
      deltaX: deltaX,
      deltaY: deltaY,
      duration: duration,
      startX: this._state.startX,
      startY: this._state.startY,
      endX: this._state.currentX,
      endY: this._state.currentY
    };

    this._triggerHaptic();

    if (this._config.onSwipe) {
      this._config.onSwipe(data);
    }

    this._emitEvent('swipe', data);
  };

  /**
   * Fire long-press callback
   */
  GestureTrackerInstance.prototype._fireLongPress = function() {
    if (!this._config || !this._state) return;

    var data = {
      x: this._state.startX,
      y: this._state.startY,
      target: this._state.target,
      timestamp: Date.now()
    };

    this._triggerHaptic();

    if (this._config.onLongPress) {
      this._config.onLongPress(data);
    }

    this._emitEvent('longpress', data);
  };

  /**
   * Fire drag start callback
   * @param {TouchEvent} e
   */
  GestureTrackerInstance.prototype._fireDragStart = function(e) {
    if (!this._config || !this._state) return;

    var data = {
      x: this._state.currentX,
      y: this._state.currentY,
      startX: this._state.startX,
      startY: this._state.startY,
      deltaX: this._state.currentX - this._state.startX,
      deltaY: this._state.currentY - this._state.startY,
      target: this._state.target,
      originalEvent: e
    };

    if (this._config.onDragStart) {
      this._config.onDragStart(data);
    }

    this._emitEvent('dragstart', data);
  };

  /**
   * Fire drag move callback
   * @param {TouchEvent} e
   */
  GestureTrackerInstance.prototype._fireDragMove = function(e) {
    if (!this._config || !this._state) return;

    var data = {
      x: this._state.currentX,
      y: this._state.currentY,
      startX: this._state.startX,
      startY: this._state.startY,
      deltaX: this._state.currentX - this._state.startX,
      deltaY: this._state.currentY - this._state.startY,
      target: this._state.target,
      originalEvent: e
    };

    if (this._config.onDragMove) {
      this._config.onDragMove(data);
    }

    this._emitEvent('dragmove', data);
  };

  /**
   * Fire drag end callback
   * @param {TouchEvent} e
   * @param {Touch} touch
   */
  GestureTrackerInstance.prototype._fireDragEnd = function(e, touch) {
    if (!this._config || !this._state) return;

    var data = {
      x: touch.clientX,
      y: touch.clientY,
      startX: this._state.startX,
      startY: this._state.startY,
      deltaX: touch.clientX - this._state.startX,
      deltaY: touch.clientY - this._state.startY,
      target: this._state.target,
      originalEvent: e
    };

    if (this._config.onDragEnd) {
      this._config.onDragEnd(data);
    }

    this._emitEvent('dragend', data);
  };

  // =========================================================================
  // Fire Callbacks (Mouse)
  // =========================================================================

  /**
   * Fire tap callback (mouse version)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._fireTapMouse = function(e) {
    if (!this._config || !this._state) return;

    var data = {
      x: e.clientX,
      y: e.clientY,
      target: this._state.target,
      timestamp: Date.now()
    };

    this._triggerHaptic();

    if (this._config.onTap) {
      this._config.onTap(data);
    }

    this._emitEvent('tap', data);
  };

  /**
   * Fire drag start callback (mouse version)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._fireDragStartMouse = function(e) {
    if (!this._config || !this._state) return;

    var data = {
      x: this._state.currentX,
      y: this._state.currentY,
      startX: this._state.startX,
      startY: this._state.startY,
      deltaX: this._state.currentX - this._state.startX,
      deltaY: this._state.currentY - this._state.startY,
      target: this._state.target,
      originalEvent: e
    };
    
    if (this._config.onDragStart) {
      this._config.onDragStart(data);
    }
    
    this._emitEvent('dragstart', data);
  };

  /**
   * Fire drag move callback (mouse version)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._fireDragMoveMouse = function(e) {
    if (!this._config || !this._state) return;

    var data = {
      x: this._state.currentX,
      y: this._state.currentY,
      startX: this._state.startX,
      startY: this._state.startY,
      deltaX: this._state.currentX - this._state.startX,
      deltaY: this._state.currentY - this._state.startY,
      target: this._state.target,
      originalEvent: e
    };

    if (this._config.onDragMove) {
      this._config.onDragMove(data);
    }
    
    this._emitEvent('dragmove', data);
  };

  /**
   * Fire drag end callback (mouse version)
   * @param {MouseEvent} e
   */
  GestureTrackerInstance.prototype._fireDragEndMouse = function(e) {
    if (!this._config || !this._state) return;

    var data = {
      x: e.clientX,
      y: e.clientY,
      startX: this._state.startX,
      startY: this._state.startY,
      deltaX: e.clientX - this._state.startX,
      deltaY: e.clientY - this._state.startY,
      target: this._state.target,
      originalEvent: e
    };

    if (this._config.onDragEnd) {
      this._config.onDragEnd(data);
    }

    this._emitEvent('dragend', data);
  };

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Reset tracking state
   */
  GestureTrackerInstance.prototype._resetState = function() {
    if (!this._state) return;
    this._state.touchId = null;
    this._state.isMouseDown = false;
    this._state.isDragging = false;
    this._state.longPressFired = false;
  };

  // =========================================================================
  // Public API
  // =========================================================================

  /**
   * Start tracking touch and mouse events
   * @returns {GestureTrackerInstance} this for chaining
   */
  GestureTrackerInstance.prototype.start = function() {
    if (this._state.isActive) return this;
    if (!this._target) return this;

    var passive = this._config.passive && !this._config.preventDefault;

    // Use plain event names - Funky.Events does NOT support jQuery-style namespacing.
    // Handler references are stored on instance for cleanup in stop().
    
    // Touch events
    E.on(this._target, 'touchstart', this._boundTouchStart, { passive: true });
    E.on(this._target, 'touchmove', this._boundTouchMove, { passive: passive });
    E.on(this._target, 'touchend', this._boundTouchEnd);
    E.on(this._target, 'touchcancel', this._boundTouchCancel);
    
    // Mouse events (for desktop support)
    E.on(this._target, 'mousedown', this._boundMouseDown);
    E.on(this._target, 'mousemove', this._boundMouseMove);
    E.on(this._target, 'mouseup', this._boundMouseUp);
    E.on(this._target, 'mouseleave', this._boundMouseLeave);

    this._state.isActive = true;

    return this;
  };

  /**
   * Stop tracking touch and mouse events (preserves state)
   * @returns {GestureTrackerInstance} this for chaining
   */
  GestureTrackerInstance.prototype.stop = function() {
    if (!this._state.isActive) return this;
    if (!this._target) return this;

    // Remove touch listeners
    E.off(this._target, 'touchstart', this._boundTouchStart);
    E.off(this._target, 'touchmove', this._boundTouchMove);
    E.off(this._target, 'touchend', this._boundTouchEnd);
    E.off(this._target, 'touchcancel', this._boundTouchCancel);
    
    // Remove mouse listeners
    E.off(this._target, 'mousedown', this._boundMouseDown);
    E.off(this._target, 'mousemove', this._boundMouseMove);
    E.off(this._target, 'mouseup', this._boundMouseUp);
    E.off(this._target, 'mouseleave', this._boundMouseLeave);

    this._cancelLongPress();
    this._state.isActive = false;

    return this;
  };

  /**
   * Destroy the tracker completely
   * @returns {void}
   */
  GestureTrackerInstance.prototype.destroy = function() {
    this.stop();
    
    // Clear references
    this._target = null;
    this._config = null;
    this._state = null;
    
    // Clear touch handler references
    this._boundTouchStart = null;
    this._boundTouchMove = null;
    this._boundTouchEnd = null;
    this._boundTouchCancel = null;
    
    // Clear mouse handler references
    this._boundMouseDown = null;
    this._boundMouseMove = null;
    this._boundMouseUp = null;
    this._boundMouseLeave = null;
  };

  /**
   * Check if tracker is currently active
   * @returns {boolean}
   */
  GestureTrackerInstance.prototype.isActive = function() {
    return this._state ? this._state.isActive : false;
  };

  /**
   * Get tracker ID
   * @returns {string}
   */
  GestureTrackerInstance.prototype.getId = function() {
    return this._id;
  };

  // =========================================================================
  // Factory Registration
  // =========================================================================

  // Instance registry
  var _instances = Funky.Registry.createInstanceRegistry('GestureTracker');

  var GestureTracker = {
    /**
     * Create a new gesture tracker instance (primary factory method)
     * @param {Object} options - Configuration options
     * @returns {GestureTrackerInstance}
     */
    init: function(options) {
      var instance = new GestureTrackerInstance(options);
      _instances.register(instance._id, instance);
      return instance;
    },

    /**
     * @deprecated Use GestureTracker.init() instead
     */
    create: function(options) {
      if (Funky.debug) {
        console.warn('[Funky.GestureTracker] create() is deprecated. Use init() instead.');
      }
      return GestureTracker.init(options);
    },

    /**
     * Get existing instance by ID
     * @param {string} id - Instance ID
     * @returns {GestureTrackerInstance|undefined}
     */
    getInstance: function(id) {
      return _instances.get(id);
    },

    /**
     * Destroy instance by ID
     * @param {string} id - Instance ID
     */
    destroy: function(id) {
      var instance = _instances.get(id);
      if (instance) {
        instance.destroy();
        _instances.unregister(id);
      }
    },

    /**
     * Destroy all instances
     */
    destroyAll: function() {
      _instances.destroyAll();
    }
  };

  // Register with Funky namespace
  Funky.register('GestureTracker', GestureTracker);

})(window);
