/**
 * Funky.ScrollTracker
 * 
 * Factory for creating scroll tracking instances with rAF throttling,
 * direction detection, velocity calculation, and threshold callbacks.
 * 
 * @example
 * var tracker = Funky.ScrollTracker.create({
 *   onScroll: function(data) { console.log(data.scrollY, data.direction); },
 *   thresholds: [100, 300],
 *   onThreshold: function(data) { console.log('Crossed', data.threshold); }
 * });
 * 
 * tracker.destroy();
 * 
 * @version 1.0.0
 */
(function(global) {
  'use strict';

  // Ensure Funky registry exists
  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.ScrollTracker] Registry not found. Load namespace.js first.');
    return;
  }

  // Prevent duplicate registration
  if (global.Funky.isRegistered && global.Funky.isRegistered('ScrollTracker')) {
    return;
  }

  var Funky = global.Funky;
  var E = Funky.Events;

  // =========================================================================
  // Defaults
  // =========================================================================

  var DEFAULTS = {
    // Target element or window
    target: window,
    
    // Throttle mode: 'raf', 'debounce', or number (ms)
    throttle: 'raf',
    
    // Main scroll callback
    // data: { scrollY, scrollX, direction, velocity, deltaY, deltaX, timestamp }
    onScroll: null,
    
    // Threshold crossing callback
    // data: { threshold, crossed ('above'|'below'), direction ('up'|'down'), scrollY }
    onThreshold: null,
    
    // Array of scroll positions to monitor
    thresholds: [],
    
    // Feature flags
    trackDirection: true,
    trackVelocity: false,
    trackHorizontal: false,
    
    // Namespace for event cleanup (used as scroll.funky.{namespace})
    namespace: 'scrolltracker',
    
    // Auto-start on create
    autoStart: true
  };

  // =========================================================================
  // Instance Counter
  // =========================================================================

  var instanceCounter = 0;

  // =========================================================================
  // ScrollTrackerInstance Constructor
  // =========================================================================

  /**
   * ScrollTracker instance
   * @param {Object} options - Configuration options
   */
  function ScrollTrackerInstance(options) {
    this._id = 'scroll-tracker-' + (++instanceCounter);
    
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
    
    // Normalize thresholds to array
    if (!Array.isArray(this._config.thresholds)) {
      this._config.thresholds = [];
    }
    
    // Initialize state
    this._state = {
      scrollY: 0,
      scrollX: 0,
      prevScrollY: 0,
      prevScrollX: 0,
      direction: null,
      velocity: 0,
      lastTimestamp: 0,
      isActive: false,
      crossedThresholds: {}
    };

    // Internal state
    this._ticking = false;
    this._target = null;
    this._debounceTimer = null;

    // Bind handlers
    this._boundScroll = this._onScroll.bind(this);

    // Resolve target
    this._target = this._getTarget();
    if (!this._target) {
      console.warn('[ScrollTracker] Target not found:', this._config.target);
      return;
    }

    // Initialize threshold state (must be after target is resolved)
    this._initThresholdState();

    // Get initial scroll position
    this._state.scrollY = this._getScrollY();
    this._state.prevScrollY = this._state.scrollY;
    if (this._config.trackHorizontal) {
      this._state.scrollX = this._getScrollX();
      this._state.prevScrollX = this._state.scrollX;
    }
    this._state.lastTimestamp = Date.now();
    
    // Auto-start if configured
    if (this._config.autoStart) {
      this.start();
    }
  }

  // =========================================================================
  // Target Resolution
  // =========================================================================

  /**
   * Get the scroll target element
   * @returns {Element|Window}
   */
  ScrollTrackerInstance.prototype._getTarget = function() {
    var target = this._config.target;
    
    if (target === window || target === document) {
      return window;
    }
    
    if (typeof target === 'string') {
      return document.querySelector(target);
    }
    
    // Assume it's an element
    return target;
  };

  /**
   * Get current vertical scroll position
   * @returns {number}
   */
  ScrollTrackerInstance.prototype._getScrollY = function() {
    if (this._target === window) {
      return window.scrollY || window.pageYOffset || 0;
    }
    
    return this._target.scrollTop || 0;
  };

  /**
   * Get current horizontal scroll position
   * @returns {number}
   */
  ScrollTrackerInstance.prototype._getScrollX = function() {
    if (this._target === window) {
      return window.scrollX || window.pageXOffset || 0;
    }
    
    return this._target.scrollLeft || 0;
  };

  // =========================================================================
  // Threshold Initialization
  // =========================================================================

  /**
   * Initialize threshold crossed state based on current scroll
   */
  ScrollTrackerInstance.prototype._initThresholdState = function() {
    var scrollY = this._getScrollY ? this._getScrollY() : 0;
    var self = this;
    
    this._config.thresholds.forEach(function(threshold) {
      self._state.crossedThresholds[threshold] = scrollY >= threshold;
    });
  };

  // =========================================================================
  // Scroll Handling
  // =========================================================================

  /**
   * Scroll event handler
   */
  ScrollTrackerInstance.prototype._onScroll = function() {
    var self = this;
    
    // Capture current position immediately
    this._state.scrollY = this._getScrollY();
    if (this._config.trackHorizontal) {
      this._state.scrollX = this._getScrollX();
    }
    
    // Handle throttling
    if (this._config.throttle === 'raf') {
      // rAF throttling
      if (!this._ticking) {
        requestAnimationFrame(function() {
          self._update();
          self._ticking = false;
        });
        this._ticking = true;
      }
    } else if (typeof this._config.throttle === 'number') {
      // Debounce with ms delay
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(function() {
        self._update();
      }, this._config.throttle);
    } else {
      // No throttling
      this._update();
    }
  };

  /**
   * Process scroll update
   */
  ScrollTrackerInstance.prototype._update = function() {
    // Calculate direction
    if (this._config.trackDirection) {
      this._calculateDirection();
    }
    
    // Calculate velocity
    if (this._config.trackVelocity) {
      this._calculateVelocity();
    }
    
    // Check thresholds
    if (this._config.thresholds.length > 0) {
      this._checkThresholds();
    }
    
    // Call scroll callback
    if (this._config.onScroll) {
      this._config.onScroll(this._getCallbackData());
    }
    
    // Update previous values
    this._state.prevScrollY = this._state.scrollY;
    if (this._config.trackHorizontal) {
      this._state.prevScrollX = this._state.scrollX;
    }
  };

  /**
   * Get data object for callbacks
   * @returns {Object}
   */
  ScrollTrackerInstance.prototype._getCallbackData = function() {
    var data = {
      scrollY: this._state.scrollY,
      scrollX: this._state.scrollX,
      direction: this._state.direction,
      deltaY: this._state.scrollY - this._state.prevScrollY,
      deltaX: this._state.scrollX - this._state.prevScrollX,
      timestamp: Date.now()
    };
    
    if (this._config.trackVelocity) {
      data.velocity = this._state.velocity;
    }
    
    return data;
  };

  // =========================================================================
  // Direction Detection
  // =========================================================================

  /**
   * Calculate scroll direction
   */
  ScrollTrackerInstance.prototype._calculateDirection = function() {
    var deltaY = this._state.scrollY - this._state.prevScrollY;
    var deltaX = this._state.scrollX - this._state.prevScrollX;
    
    // Vertical takes priority
    if (deltaY > 0) {
      this._state.direction = 'down';
    } else if (deltaY < 0) {
      this._state.direction = 'up';
    } else if (this._config.trackHorizontal) {
      // Check horizontal only if no vertical movement
      if (deltaX > 0) {
        this._state.direction = 'right';
      } else if (deltaX < 0) {
        this._state.direction = 'left';
      }
    }
    // Keep previous direction if no change
  };

  // =========================================================================
  // Velocity Calculation
  // =========================================================================

  /**
   * Calculate scroll velocity in pixels per second
   */
  ScrollTrackerInstance.prototype._calculateVelocity = function() {
    var now = Date.now();
    var timeDelta = now - this._state.lastTimestamp;
    
    if (timeDelta > 0) {
      var distance = Math.abs(this._state.scrollY - this._state.prevScrollY);
      this._state.velocity = (distance / timeDelta) * 1000; // px/second
    }
    
    this._state.lastTimestamp = now;
  };

  // =========================================================================
  // Threshold Detection
  // =========================================================================

  /**
   * Check and fire threshold callbacks
   */
  ScrollTrackerInstance.prototype._checkThresholds = function() {
    var self = this;
    var scrollY = this._state.scrollY;
    var prevScrollY = this._state.prevScrollY;
    
    this._config.thresholds.forEach(function(threshold) {
      var wasAbove = prevScrollY >= threshold;
      var isAbove = scrollY >= threshold;
      
      if (wasAbove !== isAbove) {
        self._state.crossedThresholds[threshold] = isAbove;
        
        if (self._config.onThreshold) {
          self._config.onThreshold({
            threshold: threshold,
            crossed: isAbove ? 'above' : 'below',
            direction: self._state.direction,
            scrollY: scrollY
          });
        }
      }
    });
  };

  // =========================================================================
  // Public API
  // =========================================================================

  /**
   * Start tracking scroll events
   * @returns {ScrollTrackerInstance} this for chaining
   */
  ScrollTrackerInstance.prototype.start = function() {
    if (this._state.isActive) return this;
    if (!this._target) return this;
    
    // Use native 'scroll' event - addEventListener doesn't support jQuery-style namespaces
    // Store namespace for internal handler management only
    this._eventNamespace = 'scroll.funky.' + this._config.namespace;
    
    this._target.addEventListener('scroll', this._boundScroll, { passive: true });
    this._state.isActive = true;
    
    return this;
  };

  /**
   * Stop tracking scroll events (preserves state)
   * @returns {ScrollTrackerInstance} this for chaining
   */
  ScrollTrackerInstance.prototype.stop = function() {
    if (!this._state.isActive) return this;
    if (!this._target) return this;
    
    this._target.removeEventListener('scroll', this._boundScroll);
    this._state.isActive = false;
    
    // Clear any pending timers
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    
    return this;
  };

  /**
   * Destroy the tracker completely
   * @returns {void}
   */
  ScrollTrackerInstance.prototype.destroy = function() {
    this.stop();
    
    // Clear references
    this._target = null;
    this._config = null;
    this._state = null;
    this._boundScroll = null;
  };

  /**
   * Get current scroll state
   * @returns {Object} Copy of current state
   */
  ScrollTrackerInstance.prototype.getState = function() {
    if (!this._state) return null;
    
    return {
      scrollY: this._state.scrollY,
      scrollX: this._state.scrollX,
      direction: this._state.direction,
      velocity: this._state.velocity,
      isActive: this._state.isActive,
      crossedThresholds: Object.assign({}, this._state.crossedThresholds)
    };
  };

  /**
   * Check if tracker is currently active
   * @returns {boolean}
   */
  ScrollTrackerInstance.prototype.isActive = function() {
    return this._state ? this._state.isActive : false;
  };

  /**
   * Get tracker ID
   * @returns {string}
   */
  ScrollTrackerInstance.prototype.getId = function() {
    return this._id;
  };

  // =========================================================================
  // Factory Registration
  // =========================================================================

  // Instance registry
  var _instances = Funky.Registry.createInstanceRegistry('ScrollTracker');

  var ScrollTracker = {
    /**
     * Create a new scroll tracker instance (primary factory method)
     * @param {Object} options - Configuration options
     * @returns {ScrollTrackerInstance}
     */
    init: function(options) {
      var instance = new ScrollTrackerInstance(options);
      _instances.register(instance._id, instance);
      return instance;
    },

    /**
     * @deprecated Use ScrollTracker.init() instead
     */
    create: function(options) {
      if (Funky.debug) {
        console.warn('[Funky.ScrollTracker] create() is deprecated. Use init() instead.');
      }
      return ScrollTracker.init(options);
    },

    /**
     * Get existing instance by ID
     * @param {string} id - Instance ID
     * @returns {ScrollTrackerInstance|undefined}
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
  Funky.register('ScrollTracker', ScrollTracker);

})(window);
