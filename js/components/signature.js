/**
 * Funky.Signature - Canvas-based signature capture
 * 
 * Provides smooth signature drawing with pressure sensitivity,
 * touch support, and export capabilities.
 * 
 * @module Funky.Signature
 * @version 1.0.3
 */
(function(global) {
  'use strict';

  // Ensure Funky namespace exists
  var Funky = global.Funky || (global.Funky = {});

  if (Funky.Signature) {
    console.warn('[Funky.Signature] Already initialised');
    return;
  }

  var D = Funky.Dom;
  var P = Funky.PubSub;
  var PointerTracker = Funky.PointerTracker;

  if (!D) {
    console.error('[Funky.Signature] Funky.Dom required');
    return;
  }

  if (!PointerTracker) {
    console.error('[Funky.Signature] Funky.PointerTracker required');
    return;
  }

  // =========================================================================
  // Constants
  // =========================================================================

  var DEFAULTS = {
    width: 400,
    height: 200,
    penColour: '#000000',
    penWidth: 2,
    backgroundColour: '#ffffff',
    minWidth: 0.5,
    maxWidth: 2.5,
    velocityFilter: 0.7,
    smoothing: 0.4,
    required: false,
    minStrokes: 1,
    outputFormat: 'png',
    outputQuality: 0.9,
    showTypedOption: true,
    typedFont: '"Brush Script MT", "Segoe Script", cursive',
    typedFontSize: 48,
    typedColour: null,
    mode: 'draw',
    name: null,
    validateOn: 'change',
    throttle: 0,
    onBegin: null,
    onChange: null,
    onEnd: null
  };

  // =========================================================================
  // Constructor
  // =========================================================================

  /**
   * Signature constructor
   * @param {HTMLElement|string} element - Container element or selector
   * @param {Object} options - Configuration options
   */
  function Signature(element, options) {
    // Allow calling without 'new'
    if (!(this instanceof Signature)) {
      return new Signature(element, options);
    }

    this.container = typeof element === 'string'
      ? document.querySelector(element)
      : element;

    if (!this.container) {
      console.error('[Funky.Signature] Container not found');
      return;
    }

    this.options = this._mergeOptions(options || {});
    this.canvas = null;
    this.ctx = null;
    this.strokes = [];
    this.currentStroke = null;
    this.tracker = null;
    this._lastWidth = null;

    // Typed mode properties
    this.mode = this.options.mode;
    this.typedText = '';
    this.wrapper = null;
    this.modeToggle = null;
    this.typedInput = null;
    this.typedCanvas = null;
    this.typedCtx = null;

    // Form integration properties
    this.hiddenInput = null;
    this.errorElement = null;
    this.form = null;
    this._boundHandlers = {};

    // Accessibility properties
    this.a11yWrapper = null;
    this.instructions = null;
    this.keyboardCursor = null;
    this._keyboardState = null;

    this._init();
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Merge user options with defaults
   * @private
   */
  Signature.prototype._mergeOptions = function(options) {
    var merged = {};
    for (var key in DEFAULTS) {
      if (DEFAULTS.hasOwnProperty(key)) {
        merged[key] = options[key] !== undefined ? options[key] : DEFAULTS[key];
      }
    }
    return merged;
  };

  /**
   * Initialize the signature pad
   * @private
   */
  Signature.prototype._init = function() {
    // Check reduced motion preference
    if (Funky.MediaQuery && Funky.MediaQuery.matches('reduced-motion')) {
      this.options.velocityFilter = 1;
    }

    this._createCanvas();
    this._createUI();
    this._createHiddenInput();
    this._setupAccessibility();
    this._bindPointerEvents();
    this._bindKeyboardEvents();
    this._bindFormEvents();
    this._clear();
  };

  /**
   * Create or find canvas element
   * @private
   */
  Signature.prototype._createCanvas = function() {
    // Find existing canvas or create new one
    this.canvas = this.container.querySelector('canvas');

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.container.appendChild(this.canvas);
    }

    // Set dimensions
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;

    // Prevent touch scrolling
    this.canvas.style.touchAction = 'none';

    // Get 2D context
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  };

  /**
   * Create UI wrapper and controls
   * @private
   */
  Signature.prototype._createUI = function() {
    var self = this;

    // Create wrapper for canvas and controls
    this.wrapper = D.create('div')
      .classAdd('funky-signature-wrapper');

    // Move canvas into wrapper
    this.container.appendChild(this.wrapper.el);
    this.wrapper.el.appendChild(this.canvas);

    // Mode toggle buttons (if enabled)
    if (this.options.showTypedOption) {
      this.modeToggle = D.create('div')
        .classAdd('funky-signature-mode-toggle');

      var drawBtn = D.create('button')
        .classAdd('funky-signature-mode-btn')
        .classAdd(this.mode === 'draw' ? 'active' : '')
        .attr('type', 'button')
        .attr('data-mode', 'draw')
        .html('<span class="funky-signature-icon">✏️</span> Draw');

      var typeBtn = D.create('button')
        .classAdd('funky-signature-mode-btn')
        .classAdd(this.mode === 'type' ? 'active' : '')
        .attr('type', 'button')
        .attr('data-mode', 'type')
        .html('<span class="funky-signature-icon">⌨️</span> Type');

      this.modeToggle.el.appendChild(drawBtn.el);
      this.modeToggle.el.appendChild(typeBtn.el);
      this.wrapper.el.insertBefore(this.modeToggle.el, this.canvas);

      // Bind mode toggle events
      var buttons = D.all('.funky-signature-mode-btn', this.modeToggle.el);
      buttons.each(function(btn) {
        btn.on('click', function() {
          var mode = btn.el.getAttribute('data-mode');
          self.setMode(mode);
        });
      });
    }

    // Typed input (hidden initially)
    this.typedInput = D.create('input')
      .classAdd('funky-signature-typed-input')
      .attr('type', 'text')
      .attr('placeholder', 'Type your name')
      .style({ display: 'none' });

    this.wrapper.el.appendChild(this.typedInput.el);

    this.typedInput.on('input', function() {
      self.typedText = self.typedInput.el.value;
      self._renderTypedSignature();
    });

    // If starting in type mode, show typed input
    if (this.mode === 'type') {
      this._showTypedInput();
    }
  };

  /**
   * Show typed input mode
   * @private
   */
  Signature.prototype._showTypedInput = function() {
    this.typedInput.style({ display: 'block' });
    this.canvas.style.display = 'none';

    // Show typed preview canvas
    if (!this.typedCanvas) {
      this._createTypedCanvas();
    }
    this.typedCanvas.style.display = 'block';
    this.typedInput.el.focus();
  };

  /**
   * Hide typed input mode
   * @private
   */
  Signature.prototype._hideTypedInput = function() {
    this.typedInput.style({ display: 'none' });
    this.canvas.style.display = 'block';

    if (this.typedCanvas) {
      this.typedCanvas.style.display = 'none';
    }
  };

  /**
   * Create typed canvas for preview
   * @private
   */
  Signature.prototype._createTypedCanvas = function() {
    this.typedCanvas = document.createElement('canvas');
    this.typedCanvas.width = this.canvas.width;
    this.typedCanvas.height = this.canvas.height;
    this.typedCanvas.className = 'funky-signature-typed-canvas';
    this.typedCtx = this.typedCanvas.getContext('2d');

    // Clear with background colour
    this.typedCtx.fillStyle = this.options.backgroundColour;
    this.typedCtx.fillRect(0, 0, this.typedCanvas.width, this.typedCanvas.height);

    this.wrapper.el.appendChild(this.typedCanvas);
  };

  /**
   * Render typed signature on canvas
   * @private
   */
  Signature.prototype._renderTypedSignature = function() {
    if (!this.typedCtx) return;

    var ctx = this.typedCtx;
    var width = this.typedCanvas.width;
    var height = this.typedCanvas.height;
    var text = this.typedText || '';

    // Clear
    ctx.fillStyle = this.options.backgroundColour;
    ctx.fillRect(0, 0, width, height);

    if (!text) {
      if (typeof this.options.onChange === 'function') {
        this.options.onChange.call(this);
      }
      return;
    }

    // Set font
    var colour = this.options.typedColour || this.options.penColour;
    var fontSize = this._calculateFontSize(text);

    ctx.font = fontSize + 'px ' + this.options.typedFont;
    ctx.fillStyle = colour;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text centred
    ctx.fillText(text, width / 2, height / 2);

    // Emit change event
    if (typeof this.options.onChange === 'function') {
      this.options.onChange.call(this);
    }

    if (P) {
      P.emit('funky:signature:change', {
        signature: this,
        isEmpty: !text,
        mode: 'type'
      });
    }
  };

  /**
   * Calculate optimal font size to fit canvas
   * @private
   */
  Signature.prototype._calculateFontSize = function(text) {
    var ctx = this.typedCtx;
    var maxWidth = this.typedCanvas.width * 0.9;
    var maxHeight = this.typedCanvas.height * 0.6;
    var fontSize = this.options.typedFontSize;

    // Measure and shrink if needed
    ctx.font = fontSize + 'px ' + this.options.typedFont;
    var metrics = ctx.measureText(text);

    while (metrics.width > maxWidth && fontSize > 12) {
      fontSize -= 2;
      ctx.font = fontSize + 'px ' + this.options.typedFont;
      metrics = ctx.measureText(text);
    }

    // Also check height
    if (fontSize > maxHeight) {
      fontSize = maxHeight;
    }

    return fontSize;
  };

  /**
   * Create hidden input for form submission
   * @private
   */
  Signature.prototype._createHiddenInput = function() {
    if (!this.options.name) return;

    this.hiddenInput = D.create('input')
      .attr('type', 'hidden')
      .attr('name', this.options.name)
      .classAdd('funky-signature-value');

    this.container.appendChild(this.hiddenInput.el);
  };

  /**
   * Update hidden input value
   * @private
   */
  Signature.prototype._updateHiddenInput = function() {
    if (!this.hiddenInput) return;

    var value = '';

    if (!this.isEmpty()) {
      value = this.toDataURL();
    }

    this.hiddenInput.attr('value', value);

    // Trigger native input event for form libraries
    var event;
    if (typeof Event === 'function') {
      event = new Event('input', { bubbles: true });
    } else {
      // IE fallback
      event = document.createEvent('Event');
      event.initEvent('input', true, true);
    }
    this.hiddenInput.el.dispatchEvent(event);
  };

  /**
   * Bind form events (submit/reset)
   * @private
   */
  Signature.prototype._bindFormEvents = function() {
    var self = this;

    // Find parent form
    this.form = this.container.closest('form');
    if (!this.form) return;

    // Form submit validation
    this._boundHandlers.formSubmit = function(e) {
      var result = self.validate();

      if (!result.valid) {
        e.preventDefault();
        e.stopPropagation();

        // Scroll to signature if off-screen
        if (self.container.scrollIntoView) {
          self.container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    // Form reset
    this._boundHandlers.formReset = function() {
      self.clear();
    };

    this.form.addEventListener('submit', this._boundHandlers.formSubmit);
    this.form.addEventListener('reset', this._boundHandlers.formReset);
  };

  // =========================================================================
  // Accessibility Methods
  // =========================================================================

  /**
   * Setup accessibility features
   * @private
   */
  Signature.prototype._setupAccessibility = function() {
    // Canvas ARIA
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Signature canvas');

    // Add focusable wrapper for keyboard users
    this.a11yWrapper = D.create('div')
      .attr('tabindex', '0')
      .attr('role', 'application')
      .attr('aria-label', 'Signature pad. Press Enter to start drawing with arrow keys, or Tab to use typed signature.')
      .classAdd('funky-signature-a11y-wrapper');

    // Create instructions
    var instructionsId = this._createInstructions();
    this.a11yWrapper.attr('aria-describedby', instructionsId);

    // Wrap canvas
    this.canvas.parentNode.insertBefore(this.a11yWrapper.el, this.canvas);
    this.a11yWrapper.el.appendChild(this.canvas);

    // Setup focus handlers
    this._handleFocus();
  };

  /**
   * Create hidden instructions for screen readers
   * @private
   */
  Signature.prototype._createInstructions = function() {
    var id = 'sig-instructions-' + Math.random().toString(36).substr(2, 9);

    this.instructions = D.create('div')
      .attr('id', id)
      .classAdd('visually-hidden')
      .text('Use arrow keys to move the pen. Hold Shift for larger movements. ' +
            'Press Space to toggle pen up/down. Press Escape to finish. ' +
            'Press Delete or Backspace to undo last stroke.');

    this.container.appendChild(this.instructions.el);

    return id;
  };

  /**
   * Announce message to screen readers
   * @private
   */
  Signature.prototype._announce = function(message) {
    if (Funky.Announce && Funky.Announce.polite) {
      Funky.Announce.polite(message);
    }
  };

  /**
   * Bind keyboard events for accessible drawing
   * @private
   */
  Signature.prototype._bindKeyboardEvents = function() {
    var self = this;

    if (!this.a11yWrapper) return;

    this._keyboardState = {
      drawing: false,
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      step: 5
    };

    this._boundHandlers.keydown = function(e) {
      self._handleKeyDown(e);
    };

    this.a11yWrapper.el.addEventListener('keydown', this._boundHandlers.keydown);
  };

  /**
   * Handle keyboard input for drawing
   * @private
   */
  Signature.prototype._handleKeyDown = function(e) {
    var state = this._keyboardState;
    var step = e.shiftKey ? state.step * 3 : state.step;
    var moved = false;

    switch (e.key) {
      case 'ArrowUp':
        state.y = Math.max(0, state.y - step);
        moved = true;
        break;

      case 'ArrowDown':
        state.y = Math.min(this.canvas.height, state.y + step);
        moved = true;
        break;

      case 'ArrowLeft':
        state.x = Math.max(0, state.x - step);
        moved = true;
        break;

      case 'ArrowRight':
        state.x = Math.min(this.canvas.width, state.x + step);
        moved = true;
        break;

      case ' ':  // Space - toggle pen
        e.preventDefault();
        if (state.drawing) {
          this._onPointerUp();
          this._announce('Pen lifted');
        } else {
          this._onPointerDown({ x: state.x, y: state.y, time: Date.now() });
          this._announce('Pen down, use arrow keys to draw');
        }
        state.drawing = !state.drawing;
        break;

      case 'Enter':
        e.preventDefault();
        if (!state.drawing) {
          this._announce('Arrow keys to move pen, Space to start drawing');
        }
        break;

      case 'Escape':
        if (state.drawing) {
          this._onPointerUp();
          state.drawing = false;
          this._announce('Drawing finished');
        }
        break;

      case 'Delete':
      case 'Backspace':
        if (!state.drawing) {
          e.preventDefault();
          this.undo();
          this._announce('Last stroke undone');
        }
        break;
    }

    if (moved) {
      e.preventDefault();

      if (state.drawing) {
        this._onPointerMove({ x: state.x, y: state.y, time: Date.now() });
      }

      // Show visual cursor position
      this._updateKeyboardCursor();
    }
  };

  /**
   * Update keyboard cursor position
   * @private
   */
  Signature.prototype._updateKeyboardCursor = function() {
    var state = this._keyboardState;

    if (!this.keyboardCursor) {
      this.keyboardCursor = D.create('div')
        .classAdd('funky-signature-keyboard-cursor')
        .style({
          position: 'absolute',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          border: '2px solid ' + this.options.penColour,
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)'
        });

      // Need position: relative on wrapper
      this.a11yWrapper.style({ position: 'relative' });
      this.a11yWrapper.el.appendChild(this.keyboardCursor.el);
    }

    this.keyboardCursor.style({
      left: state.x + 'px',
      top: state.y + 'px',
      display: 'block',
      backgroundColor: state.drawing ? this.options.penColour : 'transparent'
    });
  };

  /**
   * Handle focus events
   * @private
   */
  Signature.prototype._handleFocus = function() {
    var self = this;

    this._boundHandlers.focus = function() {
      if (self.wrapper) {
        self.wrapper.classAdd('focused');
      }
      self._announce('Signature pad focused');
    };

    this._boundHandlers.blur = function() {
      if (self.wrapper) {
        self.wrapper.classRemove('focused');
      }

      // Hide keyboard cursor
      if (self.keyboardCursor) {
        self.keyboardCursor.style({ display: 'none' });
      }

      // End any active drawing
      if (self._keyboardState && self._keyboardState.drawing) {
        self._onPointerUp();
        self._keyboardState.drawing = false;
      }
    };

    this.a11yWrapper.el.addEventListener('focus', this._boundHandlers.focus);
    this.a11yWrapper.el.addEventListener('blur', this._boundHandlers.blur);
  };

  /**
   * Bind pointer events using PointerTracker
   * @private
   */
  Signature.prototype._bindPointerEvents = function() {
    var self = this;

    this.tracker = new PointerTracker(this.canvas, {
      pressure: true,
      velocity: true,
      throttle: this.options.throttle,
      preventDefault: true,

      onStart: function(point) {
        self._onPointerDown(point);
      },

      onMove: function(point) {
        self._onPointerMove(point);
      },

      onEnd: function(point) {
        self._onPointerUp();
      },

      onCancel: function() {
        self._onPointerUp();
      }
    });
  };

  /**
   * Handle pointer down
   * @private
   */
  Signature.prototype._onPointerDown = function(point) {
    this._lastWidth = null;
    this.currentStroke = {
      points: [point],
      colour: this.options.penColour,
      width: this.options.penWidth
    };

    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
    this.ctx.strokeStyle = this.options.penColour;
    this.ctx.lineWidth = this._calculateWidth(point);

    if (typeof this.options.onBegin === 'function') {
      this.options.onBegin.call(this);
    }

    if (P) {
      P.emit('funky:signature:begin', { signature: this });
    }
  };

  /**
   * Handle pointer move
   * @private
   */
  Signature.prototype._onPointerMove = function(point) {
    if (!this.tracker.isActive() || !this.currentStroke) return;

    this.currentStroke.points.push(point);

    // Pressure-sensitive line width
    this.ctx.lineWidth = this._calculateWidth(point);

    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  };

  /**
   * Handle pointer up
   * @private
   */
  Signature.prototype._onPointerUp = function() {
    if (this.currentStroke && this.currentStroke.points && this.currentStroke.points.length > 0) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;

    // Update hidden input for form submission
    this._updateHiddenInput();

    // Validate if configured
    if (this.options.validateOn === 'change') {
      this.validate();
    }

    if (typeof this.options.onEnd === 'function') {
      this.options.onEnd.call(this);
    }

    if (typeof this.options.onChange === 'function') {
      this.options.onChange.call(this);
    }

    if (P) {
      P.emit('funky:signature:end', { signature: this });
      P.emit('funky:signature:change', {
        signature: this,
        isEmpty: this.isEmpty(),
        strokeCount: this.strokes.length
      });
    }
  };

  /**
   * Calculate line width based on pressure and velocity
   * @private
   */
  Signature.prototype._calculateWidth = function(point) {
    var pressure = point.pressure || 0.5;
    var velocity = point.velocity ? point.velocity.magnitude : 0;
    var minWidth = this.options.minWidth;
    var maxWidth = this.options.maxWidth;

    // Base width from pressure
    var pressureWidth = minWidth + (maxWidth - minWidth) * pressure;

    // Velocity scale: faster = thinner (0.3 to 1.0)
    var velocityScale = Math.max(0.3, 1 - velocity * this.options.velocityFilter);

    // Combine pressure and velocity
    var targetWidth = pressureWidth * velocityScale;

    // Smooth transitions between widths
    if (this._lastWidth === null) {
      this._lastWidth = targetWidth;
    } else {
      // Interpolate for smooth width changes
      var smoothing = this.options.smoothing;
      this._lastWidth = this._lastWidth * (1 - smoothing) + targetWidth * smoothing;
    }

    return this._lastWidth;
  };

  /**
   * Clear canvas (internal)
   * @private
   */
  Signature.prototype._clear = function() {
    this.strokes = [];
    this.currentStroke = null;
    this.ctx.fillStyle = this.options.backgroundColour;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  };

  /**
   * Redraw canvas from stroke history
   * @private
   */
  Signature.prototype._redraw = function() {
    var self = this;

    // Clear canvas
    this.ctx.fillStyle = this.options.backgroundColour;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Redraw all strokes
    for (var i = 0; i < this.strokes.length; i++) {
      self._drawStroke(this.strokes[i]);
    }
  };

  /**
   * Draw a single stroke
   * @private
   */
  Signature.prototype._drawStroke = function(stroke) {
    if (!stroke.points || stroke.points.length === 0) return;

    var points = stroke.points;

    this.ctx.strokeStyle = stroke.colour || this.options.penColour;
    this.ctx.lineWidth = stroke.width || this.options.penWidth;

    if (points.length === 1) {
      // Single point - draw a dot
      this.ctx.beginPath();
      this.ctx.arc(points[0].x, points[0].y, this.ctx.lineWidth / 2, 0, 2 * Math.PI);
      this.ctx.fillStyle = this.ctx.strokeStyle;
      this.ctx.fill();
      return;
    }

    // Draw with Bézier smoothing
    this._drawBezierCurve(points);
  };

  /**
   * Draw smooth Bézier curve through points
   * @private
   */
  Signature.prototype._drawBezierCurve = function(points) {
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      // Simple line for two points
      this.ctx.lineTo(points[1].x, points[1].y);
    } else {
      // Use quadratic Bézier curves for smoothing
      for (var i = 1; i < points.length - 1; i++) {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      // Last segment
      var last = points[points.length - 1];
      var secondLast = points[points.length - 2];
      this.ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
    }

    this.ctx.stroke();
  };

  // =========================================================================
  // Public Methods
  // =========================================================================

  /**
   * Set signature mode (draw or type)
   * @param {string} mode - 'draw' or 'type'
   */
  Signature.prototype.setMode = function(mode) {
    if (mode !== 'draw' && mode !== 'type') {
      console.error('[Funky.Signature] Invalid mode:', mode);
      return;
    }

    // Don't do anything if already in this mode
    if (this.mode === mode) {
      return;
    }

    var previousMode = this.mode;
    this.mode = mode;

    if (mode === 'type') {
      this._showTypedInput();
    } else {
      this._hideTypedInput();
    }

    // Update toggle button states
    if (this.modeToggle) {
      var buttons = D.all('.funky-signature-mode-btn', this.modeToggle.el);
      buttons.each(function(btn) {
        var btnMode = btn.el.getAttribute('data-mode');
        if (btnMode === mode) {
          btn.classAdd('active');
        } else {
          btn.classRemove('active');
        }
      });
    }

    if (P) {
      P.emit('funky:signature:modechange', {
        signature: this,
        mode: mode,
        previousMode: previousMode
      });
    }
  };

  /**
   * Get current mode
   * @returns {string} 'draw' or 'type'
   */
  Signature.prototype.getMode = function() {
    return this.mode;
  };

  /**
   * Check if signature pad is empty
   * @returns {boolean}
   */
  Signature.prototype.isEmpty = function() {
    if (this.mode === 'type') {
      return !this.typedText || this.typedText.trim() === '';
    }
    return this.strokes.length === 0;
  };

  /**
   * Get stroke count
   * @returns {number}
   */
  Signature.prototype.getStrokeCount = function() {
    return this.strokes.length;
  };

  /**
   * Undo last stroke
   * @returns {boolean} True if a stroke was undone
   */
  Signature.prototype.undo = function() {
    if (this.strokes.length === 0) return false;

    this.strokes.pop();
    this._redraw();

    if (P) {
      P.emit('funky:signature:undo', {
        signature: this,
        strokeCount: this.strokes.length
      });
    }

    if (typeof this.options.onChange === 'function') {
      this.options.onChange.call(this);
    }

    return true;
  };

  /**
   * Clear the signature pad
   */
  Signature.prototype.clear = function() {
    this._clear();

    // Clear typed mode
    this.typedText = '';
    if (this.typedInput) {
      this.typedInput.el.value = '';
    }
    if (this.typedCtx) {
      this.typedCtx.fillStyle = this.options.backgroundColour;
      this.typedCtx.fillRect(0, 0, this.typedCanvas.width, this.typedCanvas.height);
    }

    // Update hidden input
    this._updateHiddenInput();

    // Reset validation state
    if (this.wrapper) {
      this.wrapper.classRemove('is-valid').classRemove('is-invalid');
    }
    this._hideValidationError();

    if (P) {
      P.emit('funky:signature:clear', { signature: this });
    }

    if (typeof this.options.onChange === 'function') {
      this.options.onChange.call(this);
    }
  };

  // =========================================================================
  // Validation Methods
  // =========================================================================

  /**
   * Validate the signature
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  Signature.prototype.validate = function() {
    var isValid = true;
    var errors = [];

    if (this.options.required && this.isEmpty()) {
      isValid = false;
      errors.push('Signature is required');
    }

    if (!this.isEmpty() && this.mode === 'draw') {
      if (this.strokes.length < this.options.minStrokes) {
        isValid = false;
        errors.push('Please provide a more complete signature');
      }
    }

    // Update validation state
    this._setValidationState(isValid, errors);

    return {
      valid: isValid,
      errors: errors
    };
  };

  /**
   * Set validation state and update UI
   * @private
   */
  Signature.prototype._setValidationState = function(isValid, errors) {
    if (!this.wrapper) return;

    if (isValid) {
      this.wrapper.classRemove('is-invalid').classAdd('is-valid');
      this._hideValidationError();
    } else {
      this.wrapper.classRemove('is-valid').classAdd('is-invalid');
      this._showValidationError(errors[0]);
    }

    if (P) {
      P.emit('funky:signature:validate', {
        signature: this,
        valid: isValid,
        errors: errors
      });
    }
  };

  /**
   * Show validation error message
   * @private
   */
  Signature.prototype._showValidationError = function(message) {
    if (!this.errorElement) {
      this.errorElement = D.create('div')
        .classAdd('invalid-feedback')
        .classAdd('funky-signature-error');
      this.wrapper.el.appendChild(this.errorElement.el);
    }

    this.errorElement.text(message).style({ display: 'block' });
  };

  /**
   * Hide validation error message
   * @private
   */
  Signature.prototype._hideValidationError = function() {
    if (this.errorElement) {
      this.errorElement.style({ display: 'none' });
    }
  };

  // =========================================================================
  // Export Methods
  // =========================================================================

  /**
   * Export signature as base64 data URL
   * @param {string} [format='image/png'] - 'image/png' or 'image/jpeg'
   * @param {number} [quality=0.9] - Quality for JPEG (0-1)
   * @returns {string} Base64 data URL
   */
  Signature.prototype.toDataURL = function(format, quality) {
    format = format || 'image/' + this.options.outputFormat;
    quality = quality !== undefined ? quality : this.options.outputQuality;

    if (this.isEmpty()) {
      console.warn('[Funky.Signature] Cannot export empty signature');
      return '';
    }

    var canvas = this.mode === 'type' ? this.typedCanvas : this.canvas;
    return canvas.toDataURL(format, quality);
  };

  /**
   * Export signature as Blob (for file uploads)
   * @param {Function} callback - Called with Blob
   * @param {string} [format='image/png'] - MIME type
   * @param {number} [quality=0.9] - Quality for JPEG
   */
  Signature.prototype.toBlob = function(callback, format, quality) {
    format = format || 'image/' + this.options.outputFormat;
    quality = quality !== undefined ? quality : this.options.outputQuality;

    if (this.isEmpty()) {
      callback(null);
      return;
    }

    var canvas = this.mode === 'type' ? this.typedCanvas : this.canvas;

    // Modern browsers
    if (canvas.toBlob) {
      canvas.toBlob(callback, format, quality);
      return;
    }

    // Fallback for older browsers
    var dataURL = this.toDataURL(format, quality);
    var blob = this._dataURLToBlob(dataURL);
    callback(blob);
  };

  /**
   * Convert data URL to Blob (fallback for older browsers)
   * @private
   */
  Signature.prototype._dataURLToBlob = function(dataURL) {
    var parts = dataURL.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var bstr = atob(parts[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  };

  /**
   * Export signature as SVG string
   * @returns {string} SVG markup
   */
  Signature.prototype.toSVG = function() {
    if (this.isEmpty()) {
      return '';
    }

    var width = this.canvas.width;
    var height = this.canvas.height;
    var self = this;
    var paths = [];

    for (var i = 0; i < this.strokes.length; i++) {
      var path = self._strokeToSVGPath(this.strokes[i]);
      if (path) paths.push(path);
    }

    var svg = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" ' +
        'width="' + width + '" height="' + height + '" ' +
        'viewBox="0 0 ' + width + ' ' + height + '">',
      '  <rect width="100%" height="100%" fill="' + this.options.backgroundColour + '"/>',
      '  ' + paths.join('\n  '),
      '</svg>'
    ].join('\n');

    return svg;
  };

  /**
   * Convert stroke to SVG path element
   * @private
   */
  Signature.prototype._strokeToSVGPath = function(stroke) {
    var points = stroke.points;
    if (!points || points.length === 0) return '';

    var colour = stroke.colour || this.options.penColour;
    var width = stroke.width || this.options.penWidth;

    if (points.length === 1) {
      // Single dot
      return '<circle cx="' + points[0].x + '" cy="' + points[0].y +
             '" r="' + (width / 2) +
             '" fill="' + colour + '"/>';
    }

    // Build path data
    var d = 'M ' + points[0].x + ' ' + points[0].y;

    // Quadratic Bézier curves for smooth path
    for (var i = 1; i < points.length - 1; i++) {
      var xc = (points[i].x + points[i + 1].x) / 2;
      var yc = (points[i].y + points[i + 1].y) / 2;
      d += ' Q ' + points[i].x + ' ' + points[i].y + ', ' + xc + ' ' + yc;
    }

    // Final point
    var last = points[points.length - 1];
    d += ' L ' + last.x + ' ' + last.y;

    return '<path d="' + d + '" ' +
           'stroke="' + colour + '" ' +
           'stroke-width="' + width + '" ' +
           'fill="none" ' +
           'stroke-linecap="round" ' +
           'stroke-linejoin="round"/>';
  };

  /**
   * Get raw stroke data for storage
   * @returns {Object} Serializable data object
   */
  Signature.prototype.getData = function() {
    var strokeData = [];
    for (var i = 0; i < this.strokes.length; i++) {
      var stroke = this.strokes[i];
      strokeData.push({
        points: stroke.points,
        colour: stroke.colour,
        width: stroke.width
      });
    }

    return {
      version: 1,
      width: this.canvas.width,
      height: this.canvas.height,
      strokes: strokeData,
      options: {
        penColour: this.options.penColour,
        penWidth: this.options.penWidth,
        backgroundColour: this.options.backgroundColour
      }
    };
  };

  /**
   * Restore signature from saved data
   * @param {Object} data - Data from getData()
   */
  Signature.prototype.fromData = function(data) {
    if (!data || !data.strokes) {
      console.error('[Funky.Signature] Invalid data format');
      return;
    }

    // Resize canvas if dimensions differ
    if (data.width && data.height) {
      this.canvas.width = data.width;
      this.canvas.height = data.height;
    }

    // Restore strokes
    this.strokes = data.strokes || [];

    // Redraw
    this._redraw();

    if (P) {
      P.emit('funky:signature:load', {
        signature: this,
        strokeCount: this.strokes.length
      });
    }
  };

  /**
   * Get stroke data as JSON string
   * @returns {string} JSON string
   */
  Signature.prototype.toJSON = function() {
    return JSON.stringify(this.getData());
  };

  /**
   * Resize the signature pad
   * @param {number} width - New width in pixels
   * @param {number} height - New height in pixels
   * @param {boolean} [preserveData=true] - Whether to preserve existing strokes
   */
  Signature.prototype.resize = function(width, height, preserveData) {
    if (preserveData === undefined) preserveData = true;

    // Store current data if preserving
    var data = preserveData && !this.isEmpty() ? this.getData() : null;

    // Update options
    this.options.width = width;
    this.options.height = height;

    // Resize main canvas
    this.canvas.width = width;
    this.canvas.height = height;

    // Reset context properties after resize
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Resize typed canvas if it exists
    if (this.typedCanvas) {
      this.typedCanvas.width = width;
      this.typedCanvas.height = height;
      this.typedCtx = this.typedCanvas.getContext('2d');
    }

    // Update keyboard cursor position if active
    if (this._keyboardState) {
      this._keyboardState.x = Math.min(this._keyboardState.x, width);
      this._keyboardState.y = Math.min(this._keyboardState.y, height);
    }

    // Restore data or clear
    if (data) {
      // Scale strokes to new dimensions
      var scaleX = width / data.width;
      var scaleY = height / data.height;

      for (var i = 0; i < data.strokes.length; i++) {
        var stroke = data.strokes[i];
        for (var j = 0; j < stroke.points.length; j++) {
          stroke.points[j].x *= scaleX;
          stroke.points[j].y *= scaleY;
        }
      }
      data.width = width;
      data.height = height;
      this.fromData(data);
    } else {
      this._clear();
    }

    // Re-render typed signature if in type mode
    if (this.mode === 'type' && this.typedText) {
      this._renderTypedSignature();
    }
  };

  /**
   * Load from JSON string
   * @param {string} json - JSON from toJSON()
   */
  Signature.prototype.fromJSON = function(json) {
    try {
      var data = JSON.parse(json);
      this.fromData(data);
    } catch (e) {
      console.error('[Funky.Signature] Invalid JSON:', e);
    }
  };

  /**
   * Destroy the signature pad and clean up
   */
  Signature.prototype.destroy = function() {
    // Clean up pointer tracker
    if (this.tracker) {
      this.tracker.destroy();
      this.tracker = null;
    }

    // Clean up form event listeners
    if (this.form) {
      if (this._boundHandlers.formSubmit) {
        this.form.removeEventListener('submit', this._boundHandlers.formSubmit);
      }
      if (this._boundHandlers.formReset) {
        this.form.removeEventListener('reset', this._boundHandlers.formReset);
      }
      this.form = null;
    }

    // Clean up accessibility event listeners
    if (this.a11yWrapper) {
      if (this._boundHandlers.keydown) {
        this.a11yWrapper.el.removeEventListener('keydown', this._boundHandlers.keydown);
      }
      if (this._boundHandlers.focus) {
        this.a11yWrapper.el.removeEventListener('focus', this._boundHandlers.focus);
      }
      if (this._boundHandlers.blur) {
        this.a11yWrapper.el.removeEventListener('blur', this._boundHandlers.blur);
      }
      this.a11yWrapper = null;
    }

    this._boundHandlers = {};
    this._keyboardState = null;
    this.keyboardCursor = null;
    this.instructions = null;
    this.strokes = [];
    this.currentStroke = null;
    this.canvas = null;
    this.ctx = null;
    this.typedCanvas = null;
    this.typedCtx = null;
    this.hiddenInput = null;
    this.errorElement = null;

    // Remove wrapper from DOM
    if (this.wrapper && this.wrapper.el && this.wrapper.el.parentNode) {
      this.wrapper.el.parentNode.removeChild(this.wrapper.el);
    }
    this.wrapper = null;
  };

  // =========================================================================
  // Factory API
  // =========================================================================

  var _instances = Funky.Registry.createInstanceRegistry('Signature');
  var _instanceCounter = 0;

  var SignatureFactory = {
    /**
     * Initialize a signature pad
     * @param {HTMLElement|string} target - Container element or selector
     * @param {Object} options - Configuration options
     * @returns {Signature}
     */
    init: function(target, options) {
      var instance = new Signature(target, options);
      instance.id = 'signature-' + (++_instanceCounter);
      _instances.register(instance.id, instance);
      return instance;
    },

    /**
     * @deprecated Use init() instead
     */
    create: function(target, options) {
      return this.init(target, options);
    },

    /**
     * Get instance by ID
     * @param {string} id - Instance ID
     * @returns {Signature|null}
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
    },

    /**
     * Access to constructor for advanced use
     */
    constructor: Signature
  };

  if (Funky.register) {
    Funky.register('Signature', SignatureFactory);
  }

})(window);
