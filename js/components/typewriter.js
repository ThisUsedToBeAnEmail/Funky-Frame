/**
 * Funky.Typewriter - Animated Typing Text Component
 * Renders text with typewriter animation effect
 * @module Funky.Typewriter
 * @version 1.0.3
 */
(function(window) {
  'use strict';

  // Guard: Check Funky registry exists
  if (!window.Funky || !window.Funky.register) {
    console.error('[Funky.Typewriter] Registry not found. Load namespace.js first.');
    return;
  }

  var Funky = window.Funky;

  // Guard against double registration
  if (Funky.Typewriter) {
    return;
  }

  // ==========================================================================
  // DEFAULTS
  // ==========================================================================
  var DEFAULTS = {
    text: '',                    // String or array of strings
    mode: 'letter',              // 'letter', 'word', 'line'
    speed: 50,                   // ms per unit
    startDelay: 0,               // ms before starting
    cursor: true,                // Show cursor
    cursorStyle: 'bar',          // 'bar', 'underscore', 'block', 'none'
    cursorBlink: true,           // Blink cursor
    loop: false,                 // Loop through sequences
    loopDelay: 1500,             // ms between loops
    deleteSpeed: 30,             // ms per unit when deleting
    pauseOnComplete: 1000,       // ms pause after completing text
    autoStart: true,             // Start immediately
    size: null,                  // Size class: 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'
    mono: false,                 // Use monospace font
    
    // Callbacks
    onStart: null,
    onType: null,
    onComplete: null,
    onLoop: null,
    onDelete: null,
    
    // LiveBinding
    liveSource: null             // { source, url, path, interval }
  };

  // ==========================================================================
  // INSTANCE TRACKING
  // ==========================================================================
  var instances = new WeakMap();

  // ==========================================================================
  // TYPEWRITER INSTANCE CLASS
  // ==========================================================================
  function TypewriterInstance(element, options) {
    this.element = element;
    this.options = Object.assign({}, DEFAULTS, options);
    this.textContainer = null;
    this.cursorElement = null;
    this.currentText = '';
    this.targetText = '';
    this.textQueue = [];
    this.queueIndex = 0;
    this.unitIndex = 0;
    this.units = [];
    this.isTyping = false;
    this.isDeleting = false;
    this.isPaused = false;
    this.isComplete = false;
    this.timer = null;
    this.destroyed = false;
    this.loopCount = 0;
    this._liveBinding = null;
    
    this._init();
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._init = function() {
    var self = this;
    
    // Clear existing content
    this.element.innerHTML = '';
    
    // Add base class
    this.element.classList.add('funky-typewriter');
    
    // Add size class if specified
    if (this.options.size) {
      this.element.classList.add('funky-typewriter-' + this.options.size);
    }
    
    // Add mono class if specified
    if (this.options.mono) {
      this.element.classList.add('funky-typewriter-mono');
    }
    
    // Create text container
    this.textContainer = document.createElement('span');
    this.textContainer.className = 'funky-typewriter-text';
    this.textContainer.setAttribute('aria-live', 'polite');
    this.element.appendChild(this.textContainer);
    
    // Create cursor
    if (this.options.cursor && this.options.cursorStyle !== 'none') {
      this._createCursor();
    }
    
    // Handle reduced motion (use MediaQuery if available)
    var reducedMotion = Funky.MediaQuery 
      ? Funky.MediaQuery.matches('reduced-motion')
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (reducedMotion) {
      this.element.setAttribute('data-reduced-motion', 'true');
      this._showInstant();
      return;
    }
    
    // Normalize text to queue
    this._normalizeTextQueue();
    
    // Setup LiveBinding if configured
    if (this.options.liveSource) {
      this._setupLiveBinding();
    }
    
    // Auto-start
    if (this.options.autoStart && this.textQueue.length > 0) {
      if (this.options.startDelay > 0) {
        setTimeout(function() {
          if (!self.destroyed) {
            self.start();
          }
        }, this.options.startDelay);
      } else {
        this.start();
      }
    }
  };

  // --------------------------------------------------------------------------
  // Create cursor element
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._createCursor = function() {
    this.cursorElement = document.createElement('span');
    this.cursorElement.className = 'funky-typewriter-cursor funky-typewriter-cursor-' + this.options.cursorStyle;
    
    if (!this.options.cursorBlink) {
      this.cursorElement.classList.add('funky-typewriter-cursor-static');
    }
    
    // Add non-breaking space for cursor visibility
    this.cursorElement.textContent = '\u00A0';
    this.element.appendChild(this.cursorElement);
  };

  // --------------------------------------------------------------------------
  // Normalize text input to queue array
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._normalizeTextQueue = function() {
    var text = this.options.text;
    
    if (Array.isArray(text)) {
      this.textQueue = text.slice();
    } else if (typeof text === 'string') {
      this.textQueue = text ? [text] : [];
    } else {
      this.textQueue = [];
    }
  };

  // --------------------------------------------------------------------------
  // Split text by mode
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._splitText = function(text) {
    switch (this.options.mode) {
      case 'word':
        // Split by word boundaries, keeping spaces
        return text.match(/\S+|\s+/g) || [];
      case 'line':
        // Split by lines, keeping newlines
        return text.match(/[^\n]*\n|[^\n]+/g) || [];
      case 'letter':
      default:
        // Split into individual characters
        return text.split('');
    }
  };

  // --------------------------------------------------------------------------
  // Show text instantly (reduced motion)
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._showInstant = function() {
    this._normalizeTextQueue();
    
    if (this.textQueue.length > 0) {
      // Show first text immediately
      this.textContainer.textContent = this.textQueue[0];
      this.currentText = this.textQueue[0];
      this.isComplete = true;
    }
    
    // Hide cursor for reduced motion
    if (this.cursorElement) {
      this.cursorElement.style.display = 'none';
    }
    
    // Fire complete callback
    if (typeof this.options.onComplete === 'function') {
      this.options.onComplete.call(this);
    }
  };

  // --------------------------------------------------------------------------
  // Start typing
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype.start = function() {
    if (this.destroyed || this.textQueue.length === 0) return this;
    
    this.queueIndex = 0;
    this.isComplete = false;
    this._startTypingCurrent();
    
    return this;
  };

  // --------------------------------------------------------------------------
  // Start typing current queue item
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._startTypingCurrent = function() {
    if (this.queueIndex >= this.textQueue.length) {
      this._handleQueueComplete();
      return;
    }
    
    this.targetText = this.textQueue[this.queueIndex];
    this.units = this._splitText(this.targetText);
    this.unitIndex = 0;
    this.isTyping = true;
    this.isDeleting = false;
    
    this.element.classList.add('is-typing');
    this.element.classList.remove('is-deleting', 'is-paused');
    
    if (this.cursorElement) {
      this.cursorElement.classList.remove('funky-typewriter-cursor-hidden');
    }
    
    // Fire start callback
    if (typeof this.options.onStart === 'function') {
      this.options.onStart.call(this);
    }
    
    this._typeNext();
  };

  // --------------------------------------------------------------------------
  // Type next unit
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._typeNext = function() {
    var self = this;
    
    if (this.destroyed || this.isPaused) return;
    
    if (this.unitIndex < this.units.length) {
      var unit = this.units[this.unitIndex];
      this.currentText += unit;
      this.textContainer.textContent = this.currentText;
      this.unitIndex++;
      
      // Fire type callback
      if (typeof this.options.onType === 'function') {
        this.options.onType.call(this, unit, this.unitIndex);
      }
      
      this.timer = setTimeout(function() {
        self._typeNext();
      }, this.options.speed);
    } else {
      // Finished typing current text
      this._handleTypingComplete();
    }
  };

  // --------------------------------------------------------------------------
  // Handle typing complete for current text
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._handleTypingComplete = function() {
    var self = this;
    
    this.isTyping = false;
    this.element.classList.remove('is-typing');
    
    // Fire complete callback
    if (typeof this.options.onComplete === 'function') {
      this.options.onComplete.call(this);
    }
    
    // Check if there are more items in queue
    if (this.queueIndex < this.textQueue.length - 1) {
      // More items - pause then delete and type next
      this.timer = setTimeout(function() {
        if (!self.destroyed && !self.isPaused) {
          self._startDeleting();
        }
      }, this.options.pauseOnComplete);
    } else if (this.options.loop) {
      // Loop enabled - pause then restart
      this.timer = setTimeout(function() {
        if (!self.destroyed && !self.isPaused) {
          self.loopCount++;
          
          if (typeof self.options.onLoop === 'function') {
            self.options.onLoop.call(self, self.loopCount);
          }
          
          self._startDeleting();
        }
      }, this.options.loopDelay);
    } else {
      // All done
      this.isComplete = true;
      if (this.cursorElement && !this.options.cursorBlink) {
        this.cursorElement.classList.add('funky-typewriter-cursor-hidden');
      }
    }
  };

  // --------------------------------------------------------------------------
  // Start deleting
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._startDeleting = function() {
    this.isDeleting = true;
    this.element.classList.add('is-deleting');
    this.element.classList.remove('is-typing');
    
    this._deleteNext();
  };

  // --------------------------------------------------------------------------
  // Delete next unit
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._deleteNext = function() {
    var self = this;
    
    if (this.destroyed || this.isPaused) return;
    
    if (this.currentText.length > 0) {
      // Delete by the same mode
      var units = this._splitText(this.currentText);
      units.pop();
      this.currentText = units.join('');
      this.textContainer.textContent = this.currentText;
      
      // Fire delete callback
      if (typeof this.options.onDelete === 'function') {
        this.options.onDelete.call(this, this.currentText.length);
      }
      
      this.timer = setTimeout(function() {
        self._deleteNext();
      }, this.options.deleteSpeed);
    } else {
      // Finished deleting
      this.isDeleting = false;
      this.element.classList.remove('is-deleting');
      
      // Move to next in queue or loop back
      if (this.options.loop && this.queueIndex >= this.textQueue.length - 1) {
        this.queueIndex = 0;
      } else {
        this.queueIndex++;
      }
      
      this._startTypingCurrent();
    }
  };

  // --------------------------------------------------------------------------
  // Handle queue complete
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._handleQueueComplete = function() {
    this.isComplete = true;
    this.isTyping = false;
    this.isDeleting = false;
    this.element.classList.remove('is-typing', 'is-deleting');
  };

  // --------------------------------------------------------------------------
  // Type new text (clears current and types new)
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype.type = function(text) {
    if (this.destroyed) return this;
    
    // Stop any current animation
    this._stop();
    
    // Update queue
    if (Array.isArray(text)) {
      this.textQueue = text.slice();
    } else {
      this.textQueue = [text];
    }
    
    // Clear and start
    this.currentText = '';
    this.textContainer.textContent = '';
    this.queueIndex = 0;
    this.loopCount = 0;
    
    this._startTypingCurrent();
    
    return this;
  };

  // --------------------------------------------------------------------------
  // Pause animation
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype.pause = function() {
    if (this.destroyed) return this;
    
    this.isPaused = true;
    clearTimeout(this.timer);
    this.element.classList.add('is-paused');
    this.element.classList.remove('is-typing', 'is-deleting');
    
    return this;
  };

  // --------------------------------------------------------------------------
  // Resume animation
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype.resume = function() {
    if (this.destroyed || !this.isPaused) return this;
    
    this.isPaused = false;
    this.element.classList.remove('is-paused');
    
    if (this.isDeleting) {
      this.element.classList.add('is-deleting');
      this._deleteNext();
    } else if (this.isTyping || !this.isComplete) {
      this.element.classList.add('is-typing');
      this._typeNext();
    }
    
    return this;
  };

  // --------------------------------------------------------------------------
  // Clear text
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype.clear = function() {
    if (this.destroyed) return this;
    
    this._stop();
    this.currentText = '';
    this.textContainer.textContent = '';
    this.unitIndex = 0;
    this.queueIndex = 0;
    this.isComplete = false;
    this.isTyping = false;
    this.isDeleting = false;
    this.element.classList.remove('is-typing', 'is-deleting', 'is-paused');
    
    if (this.cursorElement) {
      this.cursorElement.classList.remove('funky-typewriter-cursor-hidden');
    }
    
    return this;
  };

  // --------------------------------------------------------------------------
  // Stop animation (internal)
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._stop = function() {
    clearTimeout(this.timer);
    this.timer = null;
    this.isPaused = false;
  };

  // --------------------------------------------------------------------------
  // Destroy instance
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype.destroy = function() {
    if (this.destroyed) return;
    
    this._stop();
    
    // Cleanup LiveBinding
    if (this._liveBinding && typeof this._liveBinding.destroy === 'function') {
      this._liveBinding.destroy();
    }
    
    // Remove classes
    this.element.classList.remove(
      'funky-typewriter',
      'funky-typewriter-mono',
      'is-typing',
      'is-deleting',
      'is-paused'
    );
    
    // Remove size class
    if (this.options.size) {
      this.element.classList.remove('funky-typewriter-' + this.options.size);
    }
    
    // Clear content
    this.element.innerHTML = '';
    this.element.removeAttribute('data-reduced-motion');
    
    this.destroyed = true;
  };

  // --------------------------------------------------------------------------
  // Setup LiveBinding
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._setupLiveBinding = function() {
    var self = this;
    var opts = this.options.liveSource;
    
    // Check if LiveBinding is available
    if (!Funky.LiveBinding) {
      console.warn('[Funky.Typewriter] LiveBinding not available');
      return;
    }
    
    // Create binding
    this._liveBinding = Funky.LiveBinding.bind(this.element, {
      source: opts.source,
      url: opts.url,
      path: opts.path,
      interval: opts.interval,
      showLoading: false,
      render: function(data) {
        // Extract text from data using path
        var newText = self._extractPath(data, opts.path);
        if (newText && newText !== self.targetText) {
          self.type(newText);
        }
      }
    });
  };

  // --------------------------------------------------------------------------
  // Extract value from object by path
  // --------------------------------------------------------------------------
  TypewriterInstance.prototype._extractPath = function(obj, path) {
    if (!path) return obj;
    
    var parts = path.split('.');
    var value = obj;
    
    for (var i = 0; i < parts.length; i++) {
      if (value == null) return null;
      value = value[parts[i]];
    }
    
    return value;
  };

  // ==========================================================================
  // MAIN COMPONENT OBJECT
  // ==========================================================================
  var Typewriter = {
    defaults: DEFAULTS,
    
    /**
     * Create a new typewriter instance (primary factory method)
     * @param {string|Element} selector - CSS selector or DOM element
     * @param {Object} options - Configuration options
     * @returns {TypewriterInstance|null}
     */
    init: function(selector, options) {
      var element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
      
      if (!element) {
        console.warn('[Funky.Typewriter] Element not found:', selector);
        return null;
      }
      
      // Check for existing instance and destroy it
      if (instances.has(element)) {
        instances.get(element).destroy();
      }
      
      var instance = new TypewriterInstance(element, options);
      instances.set(element, instance);
      return instance;
    },

    /**
     * @deprecated Use Typewriter.init() instead
     */
    create: function(selector, options) {
      if (Funky.debug) {
        console.warn('[Funky.Typewriter] create() is deprecated. Use init() instead.');
      }
      return Typewriter.init(selector, options);
    },
    
    /**
     * Get existing instance
     * @param {string|Element} selector
     * @returns {TypewriterInstance|null}
     */
    getInstance: function(selector) {
      var element = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
      return element ? instances.get(element) || null : null;
    },

    /**
     * @deprecated Use Typewriter.getInstance() instead
     */
    get: function(selector) {
      if (Funky.debug) {
        console.warn('[Funky.Typewriter] get() is deprecated. Use getInstance() instead.');
      }
      return Typewriter.getInstance(selector);
    },
    
    /**
     * Destroy instance
     * @param {string|Element} selector
     */
    destroy: function(selector) {
      var instance = Typewriter.getInstance(selector);
      if (instance) {
        instance.destroy();
        instances.delete(instance.element);
      }
    },

    /**
     * Destroy all instances
     */
    destroyAll: function() {
      instances.forEach(function(instance) {
        if (instance && instance.destroy) {
          instance.destroy();
        }
      });
      instances.clear();
    },
    
    /**
     * Initialize all elements with data-typewriter attribute
     * @param {Element} container - Container to search within
     * @returns {TypewriterInstance[]}
     */
    initAll: function(container) {
      container = container || document;
      var elements = container.querySelectorAll('[data-typewriter]');
      var created = [];
      
      elements.forEach(function(el) {
        if (!instances.has(el)) {
          var options = Typewriter._parseDataOptions(el);
          var instance = Typewriter.init(el, options);
          if (instance) {
            created.push(instance);
          }
        }
      });
      
      return created;
    },
    
    /**
     * Parse data attributes into options
     * @param {Element} element
     * @returns {Object}
     */
    _parseDataOptions: function(element) {
      var options = {};
      
      // Text content or data attribute
      var text = element.getAttribute('data-typewriter-text') || element.getAttribute('data-typewriter');
      if (text && text !== 'true' && text !== '') {
        // Check for pipe-separated sequences
        if (text.indexOf('|') !== -1) {
          options.text = text.split('|').map(function(s) { return s.trim(); });
        } else {
          options.text = text;
        }
      } else if (element.textContent.trim()) {
        options.text = element.textContent.trim();
      }
      
      // Mode
      var mode = element.getAttribute('data-typewriter-mode');
      if (mode) options.mode = mode;
      
      // Speed
      var speed = element.getAttribute('data-typewriter-speed');
      if (speed) options.speed = parseInt(speed, 10);
      
      // Cursor
      var cursor = element.getAttribute('data-typewriter-cursor');
      if (cursor === 'false') options.cursor = false;
      
      // Cursor style
      var cursorStyle = element.getAttribute('data-typewriter-cursor-style');
      if (cursorStyle) options.cursorStyle = cursorStyle;
      
      // Cursor blink
      var cursorBlink = element.getAttribute('data-typewriter-cursor-blink');
      if (cursorBlink === 'false') options.cursorBlink = false;
      
      // Loop
      var loop = element.getAttribute('data-typewriter-loop');
      if (loop === 'true') options.loop = true;
      
      // Loop delay
      var loopDelay = element.getAttribute('data-typewriter-loop-delay');
      if (loopDelay) options.loopDelay = parseInt(loopDelay, 10);
      
      // Delete speed
      var deleteSpeed = element.getAttribute('data-typewriter-delete-speed');
      if (deleteSpeed) options.deleteSpeed = parseInt(deleteSpeed, 10);
      
      // Pause on complete
      var pauseOnComplete = element.getAttribute('data-typewriter-pause');
      if (pauseOnComplete) options.pauseOnComplete = parseInt(pauseOnComplete, 10);
      
      // Auto start
      var autoStart = element.getAttribute('data-typewriter-auto-start');
      if (autoStart === 'false') options.autoStart = false;
      
      // Start delay
      var startDelay = element.getAttribute('data-typewriter-start-delay');
      if (startDelay) options.startDelay = parseInt(startDelay, 10);
      
      // Size
      var size = element.getAttribute('data-typewriter-size');
      if (size) options.size = size;
      
      // Mono
      var mono = element.getAttribute('data-typewriter-mono');
      if (mono === 'true') options.mono = true;
      
      return options;
    }
  };

  // ==========================================================================
  // EXPORT
  // ==========================================================================
  Funky.register('Typewriter', Typewriter);

})(window);
