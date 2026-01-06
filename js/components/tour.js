/**
 * Funky.Tour - Interactive Onboarding & Feature Discovery
 * 
 * Guides users through page features with step-by-step highlights,
 * tooltips, and progress tracking. Integrates with Funky.Pages for
 * automatic first-visit tour triggering.
 * 
 * @module Funky.Tour
 * @version 1.0.3
 */
(function(global) {
  'use strict';

  // Ensure Funky namespace
  var Funky = global.Funky || (global.Funky = {});

  // Prevent double initialization
  if (Funky.Tour) {
    console.warn('[Funky.Tour] Already initialized');
    return;
  }

  // Shortcuts
  var D = Funky.Dom;
  var E = Funky.Events;
  var PubSub = Funky.PubSub;
  var Storage = Funky.Storage;
  var Morph = Funky.Morph;

  // Check if Morph is available with required animateBounds method
  var hasMorph = !!(Morph && typeof Morph.animateBounds === 'function');

  // Validate dependencies
  if (!D) {
    console.error('[Funky.Tour] Funky.Dom required');
    return;
  }

  // =========================================================================
  // Constants
  // =========================================================================

  var DEFAULTS = {
    // Tour options
    id: null,                          // Required: unique tour identifier
    steps: [],                         // Required: array of step configs
    
    // Behavior
    autoStart: false,                  // Start tour automatically on create
    persist: true,                     // Remember completion in Storage
    showOnce: true,                    // Only show tour once per user
    scrollBehavior: 'smooth',          // 'smooth' | 'instant' | 'none'
    scrollPadding: 100,                // Pixels above element when scrolling
    
    // Persistence options
    showDontShowAgain: false,          // Show "don't show again" checkbox
    resumable: false,                  // Save progress and resume
    progressMaxAge: 86400000,          // Max age for saved progress (24h)
    syncToServer: true,                // Sync completion to Funky.Preferences
    
    // UI Options
    showProgress: true,                // Show step counter
    showSkip: true,                    // Show skip button
    showPrevious: true,                // Show previous button
    showClose: true,                   // Show close (X) button
    closeOnOverlay: true,              // Click overlay to close
    closeOnEscape: true,               // Escape key closes tour
    
    // Overlay
    overlayEnabled: true,              // Show backdrop overlay
    overlayOpacity: 0.5,               // Overlay opacity (0-1)
    highlightPadding: 8,               // Padding around highlighted element
    highlightRadius: 4,                // Border radius of highlight
    persistOverlay: false,             // Keep overlay visible during SPA navigation
    
    // Animation
    animate: true,                     // Enable animations
    animationDuration: 200,            // Transition duration (ms)
    
    // Morph integration (requires Funky.Morph)
    useMorph: true,                    // Use Morph for spotlight transitions when available
    spotlightMorph: true,              // Morph spotlight between targets
    tooltipMorph: false,               // Morph tooltip between positions (experimental)
    morphEasing: 'easeOutCubic',       // Easing for morph animations
    morphStagger: 50,                  // Delay between spotlight and tooltip morph (ms)
    
    // Lifecycle callbacks
    onStart: null,                     // function(tour)
    onEnd: null,                       // function(tour, { completed, skipped })
    onComplete: null,                  // function(tour)
    onSkip: null,                      // function(tour, stepIndex)
    onStepShow: null,                  // function(step, tour)
    onStepHide: null                   // function(step, tour)
  };

  var STEP_DEFAULTS = {
    target: null,                      // Required: CSS selector or element
    title: '',                         // Step title
    content: '',                       // Step description (HTML allowed)
    position: 'auto',                  // 'top' | 'bottom' | 'left' | 'right' | 'auto'
    
    // Lifecycle
    beforeShow: null,                  // function(step, tour) → Promise or void
    afterShow: null,                   // function(step, tour)
    beforeHide: null,                  // function(step, tour) → Promise or void
    afterHide: null,                   // function(step, tour)
    
    // Custom action button
    action: null,                      // { text: 'Try It', onClick: fn }
    
    // Conditional
    showIf: null,                      // function() → boolean
    skipIf: null,                      // function(data) → boolean (with LiveBinding data)
    
    // LiveBinding options (Phase 8)
    liveBinding: null,                 // { key: 'dataKey', path: 'nested.path' }
    bindingContext: null,              // Additional context for templates
    autoUpdate: true,                  // Auto-update content when data changes
    
    // Override tour defaults
    scrollBehavior: null,
    highlightPadding: null
  };

  var CLASSES = {
    // Containers
    overlay: 'tour-overlay',
    spotlight: 'tour-spotlight',
    tooltip: 'tour-tooltip',
    
    // States
    active: 'tour--active',
    animating: 'tour--animating',
    
    // Tooltip parts
    tooltipHeader: 'tour-tooltip__header',
    tooltipTitle: 'tour-tooltip__title',
    tooltipClose: 'tour-tooltip__close',
    tooltipBody: 'tour-tooltip__body',
    tooltipContent: 'tour-tooltip__content',
    tooltipFooter: 'tour-tooltip__footer',
    tooltipProgress: 'tour-tooltip__progress',
    tooltipNav: 'tour-tooltip__nav',
    tooltipArrow: 'tour-tooltip__arrow',
    
    // Buttons
    btnPrev: 'tour-btn--prev',
    btnNext: 'tour-btn--next',
    btnSkip: 'tour-btn--skip',
    btnAction: 'tour-btn--action',
    btnClose: 'tour-btn--close',
    
    // Positions
    positionTop: 'tour-tooltip--top',
    positionBottom: 'tour-tooltip--bottom',
    positionLeft: 'tour-tooltip--left',
    positionRight: 'tour-tooltip--right',
    
    // Don't show again
    dontShowAgain: 'tour-dont-show-again'
  };

  // =========================================================================
  // Storage Keys (Phase 7)
  // =========================================================================

  var STORAGE_KEYS = {
    // Tour completion: 'tour_completed_{tourId}' → true
    COMPLETED: 'tour_completed_',
    
    // Tour progress (for resumable tours): 'tour_progress_{tourId}' → { stepIndex, timestamp }
    PROGRESS: 'tour_progress_',
    
    // Global dismiss: 'tour_dismissed_all' → true
    DISMISSED_ALL: 'tour_dismissed_all',
    
    // Tour analytics: 'tour_stats_{tourId}' → { started, completed, skipped, lastSeen }
    STATS: 'tour_stats_'
  };

  // Backward compatibility
  var STORAGE_KEY_PREFIX = STORAGE_KEYS.COMPLETED;

  // =========================================================================
  // Tour State Machine
  // =========================================================================

  var STATES = {
    IDLE: 'idle',                      // Tour not active
    STARTING: 'starting',              // Initializing
    ACTIVE: 'active',                  // Showing a step
    TRANSITIONING: 'transitioning',    // Between steps
    ENDING: 'ending',                  // Cleanup in progress
    COMPLETED: 'completed'             // Tour finished
  };

  // =========================================================================
  // Accessibility Constants (Phase 10)
  // =========================================================================

  var A11Y = {
    ROLES: {
      DIALOG: 'dialog',
      ALERTDIALOG: 'alertdialog',
      TOOLTIP: 'tooltip',
      REGION: 'region'
    },
    
    LIVE_REGIONS: {
      POLITE: 'polite',
      ASSERTIVE: 'assertive',
      OFF: 'off'
    }
  };

  // Live region element for screen reader announcements
  var liveRegion = null;

  /**
   * Get or create the live region for announcements
   * @returns {Object} Funky.Dom element
   */
  function getLiveRegion() {
    if (liveRegion) return liveRegion;
    
    liveRegion = D.create('div')
      .attr('id', 'tour-live-region')
      .attr('role', 'status')
      .attr('aria-live', A11Y.LIVE_REGIONS.POLITE)
      .attr('aria-atomic', 'true')
      .classAdd('sr-only')
      .style({
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      })
      .appendTo(D.one('body'));
    
    return liveRegion;
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} [priority='polite'] - 'polite' or 'assertive'
   */
  function announce(message, priority) {
    priority = priority || A11Y.LIVE_REGIONS.POLITE;
    var region = getLiveRegion();
    
    // Update aria-live based on priority
    region.attr('aria-live', priority);
    
    // Clear and set (forces announcement)
    region.text('');
    
    setTimeout(function() {
      region.text(message);
    }, 50);
  }

  // =========================================================================
  // Tour Registry (Private)
  // =========================================================================

  var registry = {};        // tourId → Tour instance
  var activeTour = null;    // Currently active tour (only one at a time)

  // =========================================================================
  // Persistence Layer (Phase 7)
  // =========================================================================

  var Preferences = global.Funky && global.Funky.Preferences ? global.Funky.Preferences : null;

  var PreferencesIntegration = {
    /**
     * Preference key for tour data
     */
    PREF_KEY: 'tours',

    /**
     * Check if server says tour should be shown
     * Returns: true (show), false (hide), null (no server preference)
     * @param {string} tourId
     * @returns {boolean|null}
     */
    shouldShowFromServer: function(tourId) {
      var tourPrefs;
      
      if (!Preferences) return null;
      
      tourPrefs = Preferences.get(this.PREF_KEY + '.visibility.' + tourId);
      if (tourPrefs === undefined || tourPrefs === null) {
        return null; // No server preference, use local
      }
      
      return Boolean(tourPrefs);
    },

    /**
     * Check if tour is completed per server
     * @param {string} tourId
     * @returns {boolean|null}
     */
    isCompletedFromServer: function(tourId) {
      var completed;
      
      if (!Preferences) return null;
      
      completed = Preferences.get(this.PREF_KEY + '.completed.' + tourId);
      if (completed === undefined || completed === null) {
        return null;
      }
      
      return Boolean(completed);
    },

    /**
     * Mark tour as completed on server
     * @param {string} tourId
     * @returns {Promise}
     */
    markCompletedOnServer: function(tourId) {
      var data;
      
      if (!Preferences) return Promise.resolve();
      
      data = {};
      data['completed.' + tourId] = true;
      data['completed_at.' + tourId] = new Date().toISOString();
      
      return Preferences.save(this.PREF_KEY, data).catch(function(err) {
        console.warn('[Funky.Tour] Failed to sync completion to server:', err);
      });
    },

    /**
     * Clear server completion state
     * @param {string} tourId
     * @returns {Promise}
     */
    clearCompletedOnServer: function(tourId) {
      var data;
      
      if (!Preferences) return Promise.resolve();
      
      data = {};
      data['completed.' + tourId] = null;
      data['completed_at.' + tourId] = null;
      
      return Preferences.save(this.PREF_KEY, data).catch(function(err) {
        console.warn('[Funky.Tour] Failed to clear completion on server:', err);
      });
    },

    /**
     * Check global dismiss from server preferences
     * @returns {boolean}
     */
    isDismissedAllFromServer: function() {
      if (!Preferences) return false;
      return Boolean(Preferences.get(this.PREF_KEY + '.dismissed_all'));
    },

    /**
     * Set global dismiss on server
     * @param {boolean} dismissed
     * @returns {Promise}
     */
    setDismissedAllOnServer: function(dismissed) {
      if (!Preferences) return Promise.resolve();
      
      return Preferences.save(this.PREF_KEY, {
        dismissed_all: dismissed,
        dismissed_all_at: dismissed ? new Date().toISOString() : null
      });
    },

    /**
     * Get server-defined tours for current user/page
     * @param {string} [context] - Optional page/context identifier
     * @returns {Array}
     */
    getServerDefinedTours: function(context) {
      var key;
      
      if (!Preferences) return [];
      
      key = context 
        ? this.PREF_KEY + '.defined.' + context 
        : this.PREF_KEY + '.defined';
      
      return Preferences.get(key) || [];
    }
  };

  var Persistence = {
    /**
     * Check if tour has been completed (checks server first, then local)
     * @param {string} tourId
     * @returns {boolean}
     */
    isCompleted: function(tourId) {
      var serverCompleted = PreferencesIntegration.isCompletedFromServer(tourId);
      if (serverCompleted !== null) {
        return serverCompleted;
      }
      
      if (!Storage) return false;
      return Storage.get(STORAGE_KEYS.COMPLETED + tourId, false);
    },

    /**
     * Mark tour as completed (saves both locally and to server)
     * @param {string} tourId
     * @param {boolean} [syncToServer=true]
     */
    markCompleted: function(tourId, syncToServer) {
      syncToServer = syncToServer !== false;
      
      if (Storage) {
        Storage.set(STORAGE_KEYS.COMPLETED + tourId, true);
      }
      
      if (syncToServer) {
        PreferencesIntegration.markCompletedOnServer(tourId);
      }
      
      this.updateStats(tourId, 'completed');
    },

    /**
     * Clear completion status (both local and server)
     * @param {string} tourId
     */
    clearCompleted: function(tourId) {
      if (Storage) {
        Storage.remove(STORAGE_KEYS.COMPLETED + tourId);
      }
      PreferencesIntegration.clearCompletedOnServer(tourId);
    },

    /**
     * Check if user has dismissed all tours
     * @returns {boolean}
     */
    isDismissedAll: function() {
      if (PreferencesIntegration.isDismissedAllFromServer()) {
        return true;
      }
      
      if (!Storage) return false;
      return Storage.get(STORAGE_KEYS.DISMISSED_ALL, false);
    },

    /**
     * Dismiss all tours permanently (saves to both local and server)
     */
    dismissAll: function() {
      if (Storage) {
        Storage.set(STORAGE_KEYS.DISMISSED_ALL, true);
      }
      PreferencesIntegration.setDismissedAllOnServer(true);
      
      if (PubSub) {
        PubSub.emit('funky:tour:dismissed:all');
      }
    },

    /**
     * Re-enable all tours
     */
    enableAll: function() {
      if (Storage) {
        Storage.remove(STORAGE_KEYS.DISMISSED_ALL);
      }
      PreferencesIntegration.setDismissedAllOnServer(false);
    },

    /**
     * Save tour progress (for resumable tours)
     * @param {string} tourId
     * @param {number} stepIndex
     */
    saveProgress: function(tourId, stepIndex) {
      if (!Storage) return;
      Storage.set(STORAGE_KEYS.PROGRESS + tourId, {
        stepIndex: stepIndex,
        timestamp: Date.now()
      });
    },

    /**
     * Get saved progress
     * @param {string} tourId
     * @param {number} [maxAge=86400000] - Max age in ms (default: 24 hours)
     * @returns {Object|null}
     */
    getProgress: function(tourId, maxAge) {
      var progress;
      
      if (!Storage) return null;
      maxAge = maxAge || 86400000;
      
      progress = Storage.get(STORAGE_KEYS.PROGRESS + tourId, null);
      if (!progress) return null;
      
      if (Date.now() - progress.timestamp > maxAge) {
        this.clearProgress(tourId);
        return null;
      }
      
      return progress;
    },

    /**
     * Clear saved progress
     * @param {string} tourId
     */
    clearProgress: function(tourId) {
      if (!Storage) return;
      Storage.remove(STORAGE_KEYS.PROGRESS + tourId);
    },

    /**
     * Update tour statistics
     * @param {string} tourId
     * @param {string} action - 'started' | 'completed' | 'skipped'
     */
    updateStats: function(tourId, action) {
      var stats;
      
      if (!Storage) return;
      
      stats = Storage.get(STORAGE_KEYS.STATS + tourId, {
        started: 0,
        completed: 0,
        skipped: 0,
        lastSeen: null
      });
      
      if (action === 'started') stats.started++;
      if (action === 'completed') stats.completed++;
      if (action === 'skipped') stats.skipped++;
      stats.lastSeen = Date.now();
      
      Storage.set(STORAGE_KEYS.STATS + tourId, stats);
    },

    /**
     * Get tour statistics
     * @param {string} tourId
     * @returns {Object}
     */
    getStats: function(tourId) {
      if (!Storage) return null;
      return Storage.get(STORAGE_KEYS.STATS + tourId, null);
    },

    /**
     * Clear all tour data
     * @param {string} [tourId] - Specific tour, or all if omitted
     */
    clearAll: function(tourId) {
      var keys, i;
      
      if (!Storage) return;
      
      if (tourId) {
        Storage.remove(STORAGE_KEYS.COMPLETED + tourId);
        Storage.remove(STORAGE_KEYS.PROGRESS + tourId);
        Storage.remove(STORAGE_KEYS.STATS + tourId);
      } else {
        keys = Object.keys(registry);
        for (i = 0; i < keys.length; i++) {
          Storage.remove(STORAGE_KEYS.COMPLETED + keys[i]);
          Storage.remove(STORAGE_KEYS.PROGRESS + keys[i]);
          Storage.remove(STORAGE_KEYS.STATS + keys[i]);
        }
        Storage.remove(STORAGE_KEYS.DISMISSED_ALL);
      }
    }
  };

  // =========================================================================
  // LiveBinding Content Integration (Phase 8)
  // =========================================================================

  var LiveBinding = global.Funky && global.Funky.LiveBinding ? global.Funky.LiveBinding : null;

  var LiveBindingContent = {
    /**
     * Template regex for {{variable}} syntax
     */
    TEMPLATE_REGEX: /\{\{([^}]+)\}\}/g,

    /**
     * Parse template string with data
     * @param {string} template
     * @param {Object} data
     * @returns {string}
     */
    parseTemplate: function(template, data) {
      if (typeof template !== 'string') return template;
      
      return template.replace(this.TEMPLATE_REGEX, function(match, path) {
        path = path.trim();
        return LiveBindingContent.getValueByPath(data, path);
      });
    },

    /**
     * Get value from object by dot-notation path
     * @param {Object} obj
     * @param {string} path
     * @returns {*}
     */
    getValueByPath: function(obj, path) {
      var parts, i, value;
      
      if (!obj || !path) return '';
      
      parts = path.split('.');
      value = obj;
      
      for (i = 0; i < parts.length; i++) {
        if (value == null) return '';
        value = value[parts[i]];
      }
      
      return value != null ? value : '';
    },

    /**
     * Resolve content (string or function) with data
     * @param {string|Function} content
     * @param {Object} data
     * @returns {string}
     */
    resolveContent: function(content, data) {
      var result;
      
      // Function: call with data
      if (typeof content === 'function') {
        result = content(data);
        // Result might still contain templates
        return this.parseTemplate(result, data);
      }
      
      // String: parse templates
      return this.parseTemplate(content, data);
    },

    /**
     * Get data from LiveBinding for a step
     * @param {Object} config - Step's liveBinding config
     * @returns {Object|null}
     */
    getData: function(config) {
      var data;
      
      if (!LiveBinding || !config || !config.key) {
        return null;
      }
      
      data = LiveBinding.get(config.key);
      if (config.path && data) {
        data = this.getValueByPath(data, config.path);
      }
      
      return data;
    },

    /**
     * Subscribe to LiveBinding updates
     * @param {Object} config - Step's liveBinding config
     * @param {Function} callback - Called on data update
     * @returns {Function} Unsubscribe function
     */
    subscribe: function(config, callback) {
      var key, path, data, handler;
      
      if (!LiveBinding || !config || !config.key) {
        return function() {}; // No-op unsubscribe
      }
      
      key = config.key;
      path = config.path || null;
      
      // Get initial data
      data = LiveBinding.get(key);
      if (path && data) {
        data = this.getValueByPath(data, path);
      }
      callback(data);
      
      // Subscribe to updates
      handler = function(newData) {
        if (path) {
          newData = LiveBindingContent.getValueByPath(newData, path);
        }
        callback(newData);
      };
      
      LiveBinding.subscribe(key, handler);
      
      // Return unsubscribe function
      return function() {
        LiveBinding.unsubscribe(key, handler);
      };
    }
  };

  // =========================================================================
  // Utility Functions
  // =========================================================================

  /**
   * Deep merge objects
   * @param {Object} target
   * @param {Object} source
   * @returns {Object}
   */
  function merge(target, source) {
    var result = {};
    var key;
    
    for (key in target) {
      if (target.hasOwnProperty(key)) {
        result[key] = target[key];
      }
    }
    
    for (key in source) {
      if (source.hasOwnProperty(key) && source[key] !== undefined) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = merge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Get element from selector or element
   * @param {string|Element|Object} target
   * @returns {Object|null} Funky.Dom wrapped element
   */
  function getElement(target) {
    if (!target) return null;
    if (typeof target === 'string') {
      return D.one(target);
    }
    if (target.el) return target; // Already Funky.Dom wrapped
    return D.one(target);
  }

  /**
   * Generate unique ID
   * @param {string} [prefix]
   * @returns {string}
   */
  function generateId(prefix) {
    return (prefix || 'tour') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Check if user prefers reduced motion
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // =========================================================================
  // Tour Class
  // =========================================================================

  /**
   * Tour Constructor
   * @param {Object} options - Tour configuration
   */
  function Tour(options) {
    if (!options || !options.id) {
      console.error('[Funky.Tour] Tour ID is required');
      return;
    }

    if (!options.steps || !options.steps.length) {
      console.error('[Funky.Tour] At least one step is required');
      return;
    }

    // Check for duplicate ID
    if (registry[options.id]) {
      console.warn('[Funky.Tour] Tour already exists:', options.id);
      return registry[options.id];
    }

    this.id = options.id;
    this.options = merge(DEFAULTS, options);
    this.steps = this._normalizeSteps(options.steps);
    
    // State
    this.state = STATES.IDLE;
    this.currentStepIndex = -1;
    this.completed = false;
    this.skipped = false;

    // UI Elements (created when tour starts)
    this._overlay = null;
    this._spotlight = null;
    this._tooltip = null;

    // Event handlers (for cleanup)
    this._handlers = {};

    // Register
    registry[this.id] = this;

    // Emit registered event
    if (PubSub) {
      PubSub.emit('funky:tour:registered', { tourId: this.id });
    }

    // Auto-start if configured
    if (this.options.autoStart) {
      var self = this;
      setTimeout(function() { self.start(); }, 0);
    }
  }

  // =========================================================================
  // Tour Prototype - Core Methods
  // =========================================================================

  /**
   * Normalize step configurations
   * @param {Array} steps
   * @returns {Array}
   */
  Tour.prototype._normalizeSteps = function(steps) {
    var normalized = [];
    var i, step, normalizedStep;
    
    for (i = 0; i < steps.length; i++) {
      step = steps[i];
      
      // Simple string = selector only
      if (typeof step === 'string') {
        step = { target: step };
      }
      
      // Merge with defaults
      normalizedStep = merge(STEP_DEFAULTS, step);
      normalizedStep.index = i;
      normalized.push(normalizedStep);
    }
    
    return normalized;
  };

  /**
   * Check if tour should show (respects showOnce, dismissAll, and server preferences)
   * @returns {boolean}
   */
  Tour.prototype.shouldShow = function() {
    var serverVisibility;
    
    // Force option bypasses all checks (useful for demos/playgrounds)
    if (this.options.force) {
      return true;
    }
    
    // Check server-controlled visibility first
    serverVisibility = PreferencesIntegration.shouldShowFromServer(this.id);
    if (serverVisibility === false) {
      return false; // Server explicitly disabled this tour
    }
    
    // Check global dismiss
    if (Persistence.isDismissedAll()) {
      return false;
    }
    
    // If not showOnce, always show
    if (!this.options.showOnce) return true;
    if (!this.options.persist) return true;
    
    return !Persistence.isCompleted(this.id);
  };

  /**
   * Mark tour as completed in storage
   */
  Tour.prototype._markCompleted = function() {
    if (!this.options.persist) return;
    
    // Always mark if completed or if "don't show again" was checked
    if (this.completed || this._dontShowAgain) {
      Persistence.markCompleted(this.id, this.options.syncToServer);
    }
  };

  /**
   * Save progress for resumable tours
   */
  Tour.prototype._saveProgress = function() {
    if (!this.options.resumable) return;
    Persistence.saveProgress(this.id, this.currentStepIndex);
  };

  /**
   * Start the tour
   * @returns {Tour} this for chaining
   */
  Tour.prototype.start = function() {
    var self = this;
    var startIndex = 0;
    var progress;
    
    // Check if already active
    if (this.state !== STATES.IDLE) {
      console.warn('[Funky.Tour] Tour already active:', this.id);
      return this;
    }

    // Check if another tour is running
    if (activeTour && activeTour !== this) {
      console.warn('[Funky.Tour] Another tour is active. End it first.');
      return this;
    }

    // Check showOnce
    if (!this.shouldShow()) {
      console.log('[Funky.Tour] Tour already completed:', this.id);
      return this;
    }

    // Check for saved progress (resumable tours)
    if (this.options.resumable) {
      progress = Persistence.getProgress(this.id, this.options.progressMaxAge);
      if (progress) {
        startIndex = progress.stepIndex;
        console.log('[Funky.Tour] Resuming from step:', startIndex);
      }
    }

    // Store focus for restoration (a11y)
    this._storeFocus();

    this.state = STATES.STARTING;
    this.completed = false;
    this.skipped = false;
    this._dontShowAgain = false;
    activeTour = this;

    // Update stats
    Persistence.updateStats(this.id, 'started');

    // Create UI elements
    this._createUI();

    // Inject SPA overlay transparency style during tour
    this._injectTourStyles();

    // Bind global events
    this._bindEvents();

    // Add active class to body
    D.one('body').classAdd(CLASSES.active);

    // Announce tour start (a11y)
    this._announceTourStart();

    // Emit start event
    if (PubSub) {
      PubSub.emit('funky:tour:start', { tourId: this.id });
    }

    // Call onStart callback
    if (typeof this.options.onStart === 'function') {
      this.options.onStart(this);
    }

    // Show first step (or resume step)
    this.goTo(startIndex);

    return this;
  };

  /**
   * End the tour
   * @param {Object} [reason] - { completed: bool, skipped: bool }
   * @returns {Tour} this for chaining
   */
  Tour.prototype.end = function(reason) {
    var currentStep;
    
    if (this.state === STATES.IDLE || this.state === STATES.ENDING) {
      return this;
    }

    reason = reason || {};
    this.state = STATES.ENDING;
    this.completed = !!reason.completed;
    this.skipped = !!reason.skipped;

    // Unmark target element (a11y)
    currentStep = this.steps[this.currentStepIndex];
    if (currentStep && currentStep._targetElement) {
      this._unmarkTarget(currentStep._targetElement.el || currentStep._targetElement);
    }

    // Hide current step
    if (this.currentStepIndex >= 0) {
      this._hideStep(this.currentStepIndex);
    }

    // Announce tour end (a11y)
    this._announceTourEnd(this.completed);

    // Restore focus to original element
    this._restoreFocus();

    // Cleanup UI - preserve overlay if paused OR if persistOverlay option is set
    // (persistOverlay allows onEnd callback to pause the tour before overlay is removed)
    var preserveOverlay = this._paused || this.options.persistOverlay;
    this._destroyUI(preserveOverlay);

    // Remove injected tour styles only when fully ending (not paused and not persisting)
    if (!this._paused && !this.options.persistOverlay) {
      this._removeTourStyles();
    }

    // Unbind events
    this._unbindEvents();

    // Remove active class
    D.one('body').classRemove(CLASSES.active);

    // Mark as completed if finished all steps
    if (this.completed) {
      this._markCompleted();
      
      // Clear progress on completion
      Persistence.clearProgress(this.id);
      
      if (PubSub) {
        PubSub.emit('funky:tour:complete', { tourId: this.id });
      }
      
      if (typeof this.options.onComplete === 'function') {
        this.options.onComplete(this);
      }
    }

    // Emit skip event
    if (this.skipped) {
      // Track skip in stats
      Persistence.updateStats(this.id, 'skipped');
      
      // If "Don't show again" was checked, mark as completed
      if (this._dontShowAgain) {
        this._markCompleted();
        Persistence.clearProgress(this.id);
      }
      
      if (PubSub) {
        PubSub.emit('funky:tour:skip', { 
          tourId: this.id, 
          stepIndex: this.currentStepIndex 
        });
      }
      
      if (typeof this.options.onSkip === 'function') {
        this.options.onSkip(this, this.currentStepIndex);
      }
    }

    // Emit end event
    if (PubSub) {
      PubSub.emit('funky:tour:end', { 
        tourId: this.id, 
        completed: this.completed,
        skipped: this.skipped
      });
    }

    // Call onEnd callback
    if (typeof this.options.onEnd === 'function') {
      this.options.onEnd(this, { 
        completed: this.completed, 
        skipped: this.skipped 
      });
    }

    // Reset state
    this.state = STATES.IDLE;
    this.currentStepIndex = -1;
    activeTour = null;

    return this;
  };

  /**
   * Go to a specific step
   * @param {number} index - Step index (0-based)
   * @returns {Tour} this for chaining
   */
  Tour.prototype.goTo = function(index) {
    var self = this;
    var step, prevIndex, hidePromise;
    
    if (index < 0 || index >= this.steps.length) {
      console.warn('[Funky.Tour] Invalid step index:', index);
      return this;
    }

    step = this.steps[index];
    
    // Check conditional showIf (function-based)
    if (typeof step.showIf === 'function' && !step.showIf()) {
      // Skip this step
      if (index > this.currentStepIndex) {
        return this.goTo(index + 1);
      } else {
        return this.goTo(index - 1);
      }
    }
    
    // Check skipIf with LiveBinding data
    if (this._shouldSkipStep(step)) {
      if (index > this.currentStepIndex) {
        return this.goTo(index + 1);
      } else {
        return this.goTo(index - 1);
      }
    }

    prevIndex = this.currentStepIndex;
    this.state = STATES.TRANSITIONING;

    // Hide previous step (if any)
    hidePromise = prevIndex >= 0 
      ? this._hideStep(prevIndex) 
      : Promise.resolve();

    hidePromise.then(function() {
      return self._showStep(index);
    }).then(function() {
      self.currentStepIndex = index;
      self.state = STATES.ACTIVE;
      
      // Save progress for resumable tours
      self._saveProgress();
    }).catch(function(err) {
      console.error('[Funky.Tour] Step transition error:', err);
      self.state = STATES.ACTIVE;
    });

    return this;
  };

  /**
   * Go to next step
   * @returns {Tour} this for chaining
   */
  Tour.prototype.next = function() {
    if (this.currentStepIndex >= this.steps.length - 1) {
      // Last step - complete tour
      return this.end({ completed: true });
    }
    return this.goTo(this.currentStepIndex + 1);
  };

  /**
   * Go to previous step
   * @returns {Tour} this for chaining
   */
  Tour.prototype.prev = function() {
    if (this.currentStepIndex <= 0) {
      return this;
    }
    return this.goTo(this.currentStepIndex - 1);
  };

  /**
   * Skip the tour
   * @returns {Tour} this for chaining
   */
  Tour.prototype.skip = function() {
    return this.end({ skipped: true });
  };

  /**
   * Get current step
   * @returns {Object|null}
   */
  Tour.prototype.getCurrentStep = function() {
    if (this.currentStepIndex < 0) return null;
    return this.steps[this.currentStepIndex];
  };

  /**
   * Check if tour is active
   * @returns {boolean}
   */
  Tour.prototype.isActive = function() {
    return this.state === STATES.ACTIVE || this.state === STATES.TRANSITIONING;
  };

  /**
   * Update LiveBinding data for the tour
   * This allows updating placeholders in step content dynamically
   * @param {Object} data - New data to merge into liveBinding config
   * @returns {Tour} this for chaining
   */
  Tour.prototype.updateData = function(data) {
    var key;
    
    if (!data || typeof data !== 'object') {
      return this;
    }
    
    // Ensure liveBinding config exists
    if (!this.options.liveBinding) {
      this.options.liveBinding = {};
    }
    
    // Merge new data into liveBinding
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        this.options.liveBinding[key] = data[key];
      }
    }
    
    // If tour is active, re-render current step with new data
    if (this.isActive() && this.currentStepIndex >= 0) {
      var step = this.steps[this.currentStepIndex];
      if (step) {
        this._renderStepContent(step);
      }
    }
    
    return this;
  };

  /**
   * Destroy tour instance
   */
  Tour.prototype.destroy = function() {
    if (this.isActive()) {
      this.end();
    }
    delete registry[this.id];
  };

  // =========================================================================
  // Tour Prototype - Step Management (Phase 2)
  // =========================================================================

  /**
   * Resolve step target element with retry logic
   * @param {Object} step - Step configuration
   * @param {number} [maxRetries=3] - Max retry attempts
   * @param {number} [retryDelay=100] - Delay between retries (ms)
   * @returns {Promise<Object>} Funky.Dom wrapped element
   */
  Tour.prototype._resolveTarget = function(step, maxRetries, retryDelay) {
    var self = this;
    maxRetries = maxRetries || 3;
    retryDelay = retryDelay || 100;
    
    return new Promise(function(resolve, reject) {
      var attempts = 0;
      
      function tryResolve() {
        var element = null;
        var target = step.target;
        var rect, isVisible, data;
        
        attempts++;
        
        // Handle function target (can use LiveBinding data)
        if (typeof target === 'function') {
          data = step.liveBinding ? LiveBindingContent.getData(step.liveBinding) : {};
          target = target(data, step);
        }
        
        // Handle different target types
        if (typeof target === 'string') {
          element = getElement(target);
        } else if (target && target.nodeType) {
          element = D.one(target);
        } else if (target && target.el) {
          element = target;
        }
        
        // Check if element exists and is visible
        if (element && element.el) {
          rect = element.el.getBoundingClientRect();
          isVisible = rect.width > 0 && rect.height > 0;
          
          if (isVisible) {
            resolve(element);
            return;
          }
        }
        
        // Retry logic
        if (attempts < maxRetries) {
          setTimeout(tryResolve, retryDelay);
        } else {
          console.warn('[Funky.Tour] Target not found:', step.target);
          reject(new Error('Target element not found: ' + step.target));
        }
      }
      
      tryResolve();
    });
  };

  /**
   * Scroll element into view
   * @param {Object} element - Funky.Dom wrapped element
   * @returns {Promise}
   */
  Tour.prototype._scrollToElement = function(element) {
    var self = this;
    var step = this.getCurrentStep() || {};
    var behavior, el, rect, padding, inView, scrollTop;
    
    // Determine scroll behavior
    behavior = step.scrollBehavior || this.options.scrollBehavior;
    
    // Respect prefers-reduced-motion
    if (prefersReducedMotion()) {
      behavior = 'instant';
    }
    
    if (behavior === 'none') {
      return Promise.resolve();
    }
    
    return new Promise(function(resolve) {
      el = element.el || element;
      rect = el.getBoundingClientRect();
      padding = self.options.scrollPadding;
      
      // Check if already in view
      inView = (
        rect.top >= padding &&
        rect.bottom <= (window.innerHeight - padding)
      );
      
      if (inView) {
        resolve();
        return;
      }
      
      // Calculate scroll position
      scrollTop = window.pageYOffset + rect.top - padding;
      
      // Scroll
      if (behavior === 'smooth' && 'scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        
        // Wait for scroll to complete (approximate)
        setTimeout(resolve, 400);
      } else {
        window.scrollTo(0, scrollTop);
        resolve();
      }
    });
  };

  /**
   * Show a step
   * @param {number} index - Step index
   * @returns {Promise}
   */
  Tour.prototype._showStep = function(index) {
    var self = this;
    var step = this.steps[index];
    var beforePromise, result;
    
    if (!step) {
      return Promise.reject(new Error('Invalid step index: ' + index));
    }
    
    // Emit before event
    if (PubSub) {
      PubSub.emit('funky:tour:step:before', {
        tourId: this.id,
        stepIndex: index,
        step: step
      });
    }
    
    // Call beforeShow hook
    beforePromise = Promise.resolve();
    if (typeof step.beforeShow === 'function') {
      result = step.beforeShow(step, this);
      if (result && typeof result.then === 'function') {
        beforePromise = result;
      }
    }
    
    return beforePromise
      .then(function() {
        // Resolve target element
        return self._resolveTarget(step);
      })
      .then(function(targetElement) {
        step._targetElement = targetElement;
        
        // Mark target for accessibility
        self._markTarget(targetElement.el || targetElement);
        
        // Scroll to element
        return self._scrollToElement(targetElement);
      })
      .then(function() {
        // Update spotlight position
        self._updateSpotlight(step);
        
        // Update and position tooltip
        self._updateTooltip(step, index);
        
        // Store current step index (before a11y update so it knows the step)
        self.currentStepIndex = index;
        
        // Update accessibility state
        self._updateA11yState();
        
        // Emit show event
        if (PubSub) {
          PubSub.emit('funky:tour:step:show', {
            tourId: self.id,
            stepIndex: index,
            step: step
          });
        }
        
        // Call onStepShow callback
        if (typeof self.options.onStepShow === 'function') {
          self.options.onStepShow(step, self);
        }
        
        // Call afterShow hook
        if (typeof step.afterShow === 'function') {
          step.afterShow(step, self);
        }
        
        // Enable click-through on target
        self._enableTargetInteraction(step);
        
        // Focus management for accessibility
        self._focusTooltip();
      });
  };

  /**
   * Hide a step
   * @param {number} index - Step index
   * @returns {Promise}
   */
  Tour.prototype._hideStep = function(index) {
    var self = this;
    var step = this.steps[index];
    var beforePromise, result;
    
    if (!step) {
      return Promise.resolve();
    }
    
    // Clean up LiveBinding subscriptions
    this._cleanupBindings();
    
    // Call beforeHide hook
    beforePromise = Promise.resolve();
    if (typeof step.beforeHide === 'function') {
      result = step.beforeHide(step, this);
      if (result && typeof result.then === 'function') {
        beforePromise = result;
      }
    }
    
    return beforePromise.then(function() {
      // Unmark target for accessibility
      if (step._targetElement) {
        self._unmarkTarget(step._targetElement.el || step._targetElement);
      }
      
      // Disable click-through on target
      self._disableTargetInteraction(step);
      
      // Emit hide event
      if (PubSub) {
        PubSub.emit('funky:tour:step:hide', {
          tourId: self.id,
          stepIndex: index,
          step: step
        });
      }
      
      // Call onStepHide callback
      if (typeof self.options.onStepHide === 'function') {
        self.options.onStepHide(step, self);
      }
      
      // Call afterHide hook
      if (typeof step.afterHide === 'function') {
        step.afterHide(step, self);
      }
      
      // Clear cached target
      step._targetElement = null;
    });
  };

  /**
   * Manage focus for accessibility
   * @param {Object} step - Current step
   */
  Tour.prototype._manageFocus = function(step) {
    var self = this;
    var firstFocusable;
    
    // Store previous focus to restore later (only on first call)
    if (!this._previousFocus) {
      this._previousFocus = document.activeElement;
    }
    
    // Small delay to ensure tooltip is rendered
    setTimeout(function() {
      if (self._tooltip && self._tooltip.el) {
        // Focus first focusable element or tooltip container
        firstFocusable = self._tooltip.el.querySelector('button, [href], input, select, textarea');
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          self._tooltip.el.focus();
        }
      }
    }, 50);
  };

  // =========================================================================
  // Tour Prototype - Step Iteration Helpers
  // =========================================================================

  /**
   * Get visible steps (respecting showIf conditions)
   * @returns {Object[]}
   */
  Tour.prototype.getVisibleSteps = function() {
    var visible = [];
    var i, step;
    
    for (i = 0; i < this.steps.length; i++) {
      step = this.steps[i];
      if (typeof step.showIf === 'function') {
        if (step.showIf()) {
          visible.push(step);
        }
      } else {
        visible.push(step);
      }
    }
    
    return visible;
  };

  /**
   * Get total visible step count
   * @returns {number}
   */
  Tour.prototype.getTotalSteps = function() {
    return this.getVisibleSteps().length;
  };

  /**
   * Get current step number (1-indexed for display)
   * @returns {number}
   */
  Tour.prototype.getCurrentStepNumber = function() {
    var visibleSteps = this.getVisibleSteps();
    var currentStep = this.getCurrentStep();
    var i;
    
    for (i = 0; i < visibleSteps.length; i++) {
      if (visibleSteps[i] === currentStep) {
        return i + 1;
      }
    }
    return 0;
  };

  /**
   * Check if at first step
   * @returns {boolean}
   */
  Tour.prototype.isFirstStep = function() {
    return this.currentStepIndex === 0;
  };

  /**
   * Check if at last step
   * @returns {boolean}
   */
  Tour.prototype.isLastStep = function() {
    return this.currentStepIndex === this.steps.length - 1;
  };

  // =========================================================================
  // Tour Prototype - Overlay & Spotlight (Phase 3)
  // =========================================================================

  /**
   * Create the overlay element with SVG mask for spotlight cutout
   */
  Tour.prototype._createOverlay = function() {
    var self = this;
    
    if (!this.options.overlayEnabled) return;

    // Check if there's already an overlay in the DOM from a previous tour (SPA)
    var existingOverlay = D.one('.' + CLASSES.overlay);

    if (existingOverlay && existingOverlay.exists()) {
      // Reuse existing overlay from previous tour
      console.log('[Funky.Tour] Reusing existing overlay for SPA transition');
      this._overlay = existingOverlay;
      // Clear the overlay content (remove old SVG)
      this._overlay.html('');
    } else {
      // Create new overlay container
      this._overlay = D.create('div')
        .classAdd(CLASSES.overlay)
        .attr('aria-hidden', 'true')
        .style({
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          zIndex: '100000',
          pointerEvents: 'auto'
        });
    }
    
    // Create SVG for spotlight cutout
    this._spotlightSvg = this._createSpotlightSvg();
    this._overlay.el.appendChild(this._spotlightSvg);
    
    // Click handler for overlay
    if (this.options.closeOnOverlay) {
      E.on(this._overlay.el, 'click', function(e) {
        // Only close if clicking the overlay itself, not the cutout
        if (e.target === self._overlay.el || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
          self.skip();
        }
      });
    }
    
    // Append to body only if new
    if (!existingOverlay) {
      D.one('body').append(this._overlay);
    }
  };

  /**
   * Create SVG for spotlight effect
   * Using SVG mask allows for smooth rounded corners and animations
   * @returns {SVGElement}
   */
  Tour.prototype._createSpotlightSvg = function() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var defs, mask, maskBg, maskCutout, overlayRect;
    
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    
    // Create defs for mask
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Create mask
    mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', 'tour-spotlight-mask-' + this.id);
    
    // White background (visible area becomes transparent)
    maskBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    maskBg.setAttribute('x', '0');
    maskBg.setAttribute('y', '0');
    maskBg.setAttribute('width', '100%');
    maskBg.setAttribute('height', '100%');
    maskBg.setAttribute('fill', 'white');
    
    // Black rect for cutout (will be positioned dynamically)
    maskCutout = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    maskCutout.setAttribute('fill', 'black');
    maskCutout.setAttribute('rx', this.options.highlightRadius);
    maskCutout.setAttribute('ry', this.options.highlightRadius);
    // Start off-screen
    maskCutout.setAttribute('x', '-100');
    maskCutout.setAttribute('y', '-100');
    maskCutout.setAttribute('width', '0');
    maskCutout.setAttribute('height', '0');
    this._spotlightCutout = maskCutout;
    
    mask.appendChild(maskBg);
    mask.appendChild(maskCutout);
    defs.appendChild(mask);
    svg.appendChild(defs);
    
    // Create overlay rect with mask applied
    overlayRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlayRect.setAttribute('x', '0');
    overlayRect.setAttribute('y', '0');
    overlayRect.setAttribute('width', '100%');
    overlayRect.setAttribute('height', '100%');
    overlayRect.setAttribute('fill', 'rgba(0, 0, 0, ' + this.options.overlayOpacity + ')');
    overlayRect.setAttribute('mask', 'url(#tour-spotlight-mask-' + this.id + ')');
    svg.appendChild(overlayRect);
    
    return svg;
  };

  /**
   * Create spotlight highlight element (visible border around cutout)
   */
  Tour.prototype._createSpotlight = function() {
    var transitionValue = '';
    
    if (this.options.animate && !prefersReducedMotion()) {
      transitionValue = 'all ' + this.options.animationDuration + 'ms ease-out';
    }
    
    this._spotlight = D.create('div')
      .classAdd(CLASSES.spotlight)
      .attr('aria-hidden', 'true')
      .style({
        position: 'fixed',
        zIndex: '100001',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        border: '2px solid var(--pro-accent-primary, #007bff)',
        boxShadow: '0 0 0 4px rgba(0, 123, 255, 0.2), 0 0 20px rgba(0, 0, 0, 0.3)',
        transition: transitionValue,
        opacity: '0'
      });
    
    D.one('body').append(this._spotlight);
  };

  /**
   * Update spotlight position around target element
   * @param {Object} step - Step config with _targetElement
   * @param {boolean} [skipMorph] - If true, use CSS transition even when Morph available
   */
  Tour.prototype._updateSpotlight = function(step, skipMorph) {
    if (!step || !step._targetElement) return;
    
    // Use Morph for smooth FLIP-based animation if available
    var useMorphAnimation = hasMorph && 
                            this.options.useMorph && 
                            this.options.spotlightMorph && 
                            this.options.animate && 
                            !prefersReducedMotion() &&
                            !skipMorph;
    
    if (useMorphAnimation) {
      this._morphSpotlight(step);
    } else {
      this._cssTransitionSpotlight(step);
    }
  };

  /**
   * Animate spotlight using CSS transitions (fallback)
   * @param {Object} step - Step config with _targetElement
   */
  Tour.prototype._cssTransitionSpotlight = function(step) {
    var el, rect, padding, radius, x, y, width, height;
    
    el = step._targetElement.el || step._targetElement;
    rect = el.getBoundingClientRect();
    padding = step.highlightPadding !== undefined ? step.highlightPadding : this.options.highlightPadding;
    radius = this.options.highlightRadius;
    
    // Calculate spotlight dimensions
    x = rect.left - padding;
    y = rect.top - padding;
    width = rect.width + (padding * 2);
    height = rect.height + (padding * 2);
    
    // Update SVG mask cutout
    if (this._spotlightCutout) {
      if (this.options.animate && !prefersReducedMotion()) {
        this._spotlightCutout.style.transition = 'all ' + this.options.animationDuration + 'ms ease-out';
      }
      
      this._spotlightCutout.setAttribute('x', x);
      this._spotlightCutout.setAttribute('y', y);
      this._spotlightCutout.setAttribute('width', width);
      this._spotlightCutout.setAttribute('height', height);
    }
    
    // Update visible spotlight border
    if (this._spotlight) {
      this._spotlight.style({
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        borderRadius: radius + 'px',
        opacity: '1'
      });
    }
  };

  /**
   * Animate spotlight using Morph FLIP animation
   * Creates buttery-smooth transitions between tour targets
   * @param {Object} step - Step config with _targetElement
   */
  Tour.prototype._morphSpotlight = function(step) {
    var self = this;
    var el = step._targetElement.el || step._targetElement;
    var rect = el.getBoundingClientRect();
    var padding = step.highlightPadding !== undefined 
      ? step.highlightPadding 
      : this.options.highlightPadding;
    var radius = this.options.highlightRadius;
    
    // Target bounds for spotlight
    var targetBounds = {
      left: rect.left - padding,
      top: rect.top - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2)
    };
    
    // Get current spotlight bounds from SVG cutout
    var currentX = parseFloat(this._spotlightCutout.getAttribute('x')) || targetBounds.left;
    var currentY = parseFloat(this._spotlightCutout.getAttribute('y')) || targetBounds.top;
    var currentW = parseFloat(this._spotlightCutout.getAttribute('width')) || targetBounds.width;
    var currentH = parseFloat(this._spotlightCutout.getAttribute('height')) || targetBounds.height;
    
    var currentBounds = {
      left: currentX,
      top: currentY,
      width: currentW,
      height: currentH
    };
    
    // Skip animation if bounds haven't changed significantly
    var threshold = 2;
    if (Math.abs(currentBounds.left - targetBounds.left) < threshold &&
        Math.abs(currentBounds.top - targetBounds.top) < threshold &&
        Math.abs(currentBounds.width - targetBounds.width) < threshold &&
        Math.abs(currentBounds.height - targetBounds.height) < threshold) {
      return;
    }
    
    // Cancel any existing morph animation
    if (this._spotlightMorphController) {
      this._spotlightMorphController.cancel();
    }
    
    // Disable CSS transition during Morph animation
    if (this._spotlightCutout) {
      this._spotlightCutout.style.transition = 'none';
    }
    if (this._spotlight && this._spotlight.el) {
      this._spotlight.el.style.transition = 'none';
    }

    // Use Morph.animateBounds for smooth FLIP-style animation
    this._spotlightMorphController = Morph.animateBounds({
      from: currentBounds,
      to: targetBounds,
      duration: this.options.animationDuration,
      easing: this.options.morphEasing,
      onUpdate: function(bounds) {
        // Update SVG mask cutout
        if (self._spotlightCutout) {
          self._spotlightCutout.setAttribute('x', bounds.left);
          self._spotlightCutout.setAttribute('y', bounds.top);
          self._spotlightCutout.setAttribute('width', bounds.width);
          self._spotlightCutout.setAttribute('height', bounds.height);
        }
        
        // Update visible spotlight border
        if (self._spotlight) {
          self._spotlight.style({
            left: bounds.left + 'px',
            top: bounds.top + 'px',
            width: bounds.width + 'px',
            height: bounds.height + 'px',
            borderRadius: radius + 'px',
            opacity: '1'
          });
        }
      },
      onComplete: function() {
        self._spotlightMorphController = null;
        // Re-enable CSS transitions for future non-morph updates (e.g., resize)
        if (self._spotlight && self._spotlight.el) {
          self._spotlight.el.style.transition = '';
        }
      }
    });
  };

  /**
   * Handle window resize - update spotlight position
   */
  Tour.prototype._onResize = function() {
    var step = this.getCurrentStep();
    if (step && step._targetElement) {
      this._updateSpotlight(step);
      this._positionTooltip(step);
    }
  };

  /**
   * Handle scroll - update spotlight position
   */
  Tour.prototype._onScroll = function() {
    var step = this.getCurrentStep();
    if (step && step._targetElement) {
      this._updateSpotlight(step);
      this._positionTooltip(step);
    }
  };

  /**
   * Remove overlay and spotlight elements
   * @param {boolean} preserveOverlay - If true, keep overlay visible for SPA transitions
   */
  Tour.prototype._destroyOverlay = function(preserveOverlay) {
    if (this._overlay && !preserveOverlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    
    if (this._spotlight) {
      this._spotlight.remove();
      this._spotlight = null;
    }
    
    this._spotlightCutout = null;
    this._spotlightSvg = null;
  };

  /**
   * Pause tour - hide tooltip but keep overlay visible for SPA transitions
   * Call this before SPA navigation to prevent flicker
   */
  Tour.prototype.pause = function() {
    this._paused = true;
    this.state = STATES.IDLE;
    
    // Hide tooltip with fade
    if (this._tooltip) {
      this._tooltip.style({ 
        opacity: '0', 
        pointerEvents: 'none',
        visibility: 'hidden'
      });
    }
    
    // Keep overlay visible but dim spotlight
    if (this._overlay) {
      this._overlay.style({ opacity: this.options.overlayOpacity });
    }
    
    if (this._spotlight) {
      this._spotlight.style({ 
        opacity: '0.2', 
        pointerEvents: 'none',
        borderColor: 'transparent'
      });
    }
    
    return this;
  };

  /**
   * Resume tour after SPA navigation - show tooltip on new target
   * @param {Object} options - Resume options
   * @param {Array} options.steps - New steps for the resumed tour
   * @param {number} options.startAt - Step index to start at (default 0)
   */
  Tour.prototype.resume = function(options) {
    var self = this;
    options = options || {};
    
    if (!this._paused) {
      return this.start();
    }
    
    this._paused = false;
    this.state = STATES.IDLE;
    
    // Update steps if provided
    if (options.steps && options.steps.length) {
      this.steps = options.steps.map(function(s) {
        return merge(STEP_DEFAULTS, s);
      });
    }
    
    // Reset step index
    this.currentStepIndex = -1;
    
    // Re-enable pointer events on overlay, spotlight and tooltip
    if (this._overlay) {
      this._overlay.style({ pointerEvents: 'auto' });
    }
    
    if (this._spotlight) {
      this._spotlight.style({ 
        pointerEvents: 'auto',
        borderColor: ''  // Restore default color
      });
    }
    
    if (this._tooltip) {
      this._tooltip.style({ 
        pointerEvents: 'auto',
        visibility: 'visible'
      });
    }
    
    // Go to first step (or specified step)
    var startAt = options.startAt || 0;
    
    requestAnimationFrame(function() {
      self.goTo(startAt);
    });
    
    return this;
  };

  /**
   * Check if tour is currently paused
   */
  Tour.prototype.isPaused = function() {
    return !!this._paused;
  };

  // =========================================================================
  // Tour Prototype - UI Methods
  // =========================================================================

  /**
   * Create overlay, spotlight, and tooltip elements
   */
  Tour.prototype._createUI = function() {
    // Create overlay with spotlight
    this._createOverlay();
    this._createSpotlight();
    
    // Create tooltip (Phase 4)
    this._createTooltip();
  };

  /**
   * Remove UI elements
   * @param {boolean} preserveOverlay - If true, keep overlay visible for SPA transitions
   */
  Tour.prototype._destroyUI = function(preserveOverlay) {
    this._destroyOverlay(preserveOverlay);
    this._destroyTooltip();
  };

  /**
   * Inject styles to make SPA overlay transparent during tour
   */
  Tour.prototype._injectTourStyles = function() {
    // Check if already injected
    if (D.one('#tour-spa-style-override').exists()) {
      return;
    }
    
    var style = document.createElement('style');
    style.id = 'tour-spa-style-override';
    style.textContent = '.spa-loading-overlay { background: transparent !important; backdrop-filter: none !important; }';
    document.head.appendChild(style);
  };

  /**
   * Remove injected tour styles
   */
  Tour.prototype._removeTourStyles = function() {
    var style = document.getElementById('tour-spa-style-override');
    if (style) {
      style.parentNode.removeChild(style);
    }
  };

  // =========================================================================
  // Tour Prototype - Tooltip Component (Phase 4)
  // =========================================================================

  /**
   * Create tooltip element with header, body, footer, and arrow
   */
  Tour.prototype._createTooltip = function() {
    var self = this;
    var transitionValue = '';
    var tooltipId = 'tour-tooltip-' + this.id;
    var titleId = 'tour-title-' + this.id;
    var contentId = 'tour-content-' + this.id;
    
    if (this.options.animate && !prefersReducedMotion()) {
      transitionValue = 'opacity ' + this.options.animationDuration + 'ms ease, transform ' + this.options.animationDuration + 'ms ease';
    }
    
    // Main tooltip container
    this._tooltip = D.create('div')
      .classAdd(CLASSES.tooltip)
      .attr('id', tooltipId)
      .attr('role', A11Y.ROLES.DIALOG)
      .attr('aria-modal', 'true')
      .attr('aria-labelledby', titleId)
      .attr('aria-describedby', contentId)
      .attr('tabindex', '-1')
      .style({
        position: 'fixed',
        zIndex: '100002',
        opacity: '0',
        visibility: 'hidden',
        transition: transitionValue
      });
    
    // Header
    var header = D.create('div').classAdd(CLASSES.tooltipHeader);
    
    this._tooltipTitle = D.create('h4')
      .classAdd(CLASSES.tooltipTitle)
      .attr('id', titleId);
    header.append(this._tooltipTitle);
    
    // Close button
    if (this.options.showClose) {
      var closeBtn = D.create('button')
        .classAdd(CLASSES.tooltipClose)
        .classAdd(CLASSES.btnClose)
        .attr('type', 'button')
        .attr('aria-label', 'Close tour')
        .html('<i class="fas fa-times"></i>');
      
      E.on(closeBtn.el, 'click', function() {
        self.skip();
      });
      
      header.append(closeBtn);
    }
    
    this._tooltip.append(header);
    
    // Body (content area)
    var body = D.create('div').classAdd(CLASSES.tooltipBody);
    this._tooltipContent = D.create('div')
      .classAdd(CLASSES.tooltipContent)
      .attr('id', contentId);
    body.append(this._tooltipContent);
    this._tooltip.append(body);
    
    // Footer (progress + nav)
    var footer = D.create('div').classAdd(CLASSES.tooltipFooter);
    
    // Progress indicator
    if (this.options.showProgress) {
      this._tooltipProgress = D.create('span')
        .classAdd(CLASSES.tooltipProgress)
        .attr('aria-live', 'polite');
      footer.append(this._tooltipProgress);
    }
    
    // Navigation buttons container
    var nav = D.create('div').classAdd(CLASSES.tooltipNav);
    
    // Skip button
    if (this.options.showSkip) {
      this._btnSkip = D.create('button')
        .classAdd('btn btn-link btn-sm ' + CLASSES.btnSkip)
        .attr('type', 'button')
        .text('Skip');
      
      E.on(this._btnSkip.el, 'click', function() {
        self.skip();
      });
      
      nav.append(this._btnSkip);
    }
    
    // Spacer
    nav.append(D.create('span').style({ flex: '1' }));
    
    // Previous button
    if (this.options.showPrevious) {
      this._btnPrev = D.create('button')
        .classAdd('btn btn-outline-secondary btn-sm ' + CLASSES.btnPrev)
        .attr('type', 'button')
        .html('<i class="fas fa-chevron-left me-1"></i>Previous');
      
      E.on(this._btnPrev.el, 'click', function() {
        self.prev();
      });
      
      nav.append(this._btnPrev);
    }
    
    // Next/Finish button
    this._btnNext = D.create('button')
      .classAdd('btn btn-primary btn-sm ' + CLASSES.btnNext)
      .attr('type', 'button')
      .text('Next');
    
    E.on(this._btnNext.el, 'click', function() {
      self.next();
    });
    
    nav.append(this._btnNext);
    
    footer.append(nav);
    
    // Add "Don't show again" checkbox if enabled
    if (this.options.showDontShowAgain) {
      this._dontShowAgainContainer = this._createDontShowAgain();
      footer.append(this._dontShowAgainContainer);
    }
    
    this._tooltip.append(footer);
    
    // Arrow/pointer
    this._tooltipArrow = D.create('div')
      .classAdd(CLASSES.tooltipArrow)
      .attr('aria-hidden', 'true');
    this._tooltip.append(this._tooltipArrow);
    
    // Append to body
    D.one('body').append(this._tooltip);
  };

  /**
   * Create "Don't show again" checkbox
   * @returns {Object} Funky.Dom element
   */
  Tour.prototype._createDontShowAgain = function() {
    var self = this;
    var container, checkbox, label;
    
    container = D.create('div')
      .classAdd(CLASSES.dontShowAgain);
    
    checkbox = D.create('input')
      .attr('type', 'checkbox')
      .attr('id', 'tour-dont-show-' + this.id)
      .classAdd('form-check-input');
    
    label = D.create('label')
      .attr('for', 'tour-dont-show-' + this.id)
      .classAdd('form-check-label', 'small', 'text-muted')
      .text("Don't show this again");
    
    container.append(checkbox).append(label);
    
    // Handle checkbox change
    E.on(checkbox.el, 'change', function() {
      self._dontShowAgain = this.checked;
    });
    
    return container;
  };

  /**
   * Remove tooltip element and clean up references
   */
  Tour.prototype._destroyTooltip = function() {
    if (this._tooltip) {
      this._tooltip.remove();
      this._tooltip = null;
    }
    
    this._tooltipTitle = null;
    this._tooltipContent = null;
    this._tooltipProgress = null;
    this._tooltipArrow = null;
    this._btnPrev = null;
    this._btnNext = null;
    this._btnSkip = null;
    this._btnAction = null;
    this._dontShowAgainContainer = null;
  };

  /**
   * Update tooltip content for current step
   * @param {Object} step - Step config
   * @param {number} index - Step index
   */
  Tour.prototype._updateTooltip = function(step, index) {
    var self = this;
    
    // Clean up previous LiveBinding subscription
    this._cleanupBindings();
    
    // Render content (with LiveBinding if configured)
    this._renderStepContent(step);
    
    // Update progress
    if (this._tooltipProgress && this.options.showProgress) {
      var current = this.getCurrentStepNumber();
      var total = this.getTotalSteps();
      this._tooltipProgress.text('Step ' + current + ' of ' + total);
    }
    
    // Update previous button visibility
    if (this._btnPrev) {
      if (this.isFirstStep()) {
        this._btnPrev.style({ display: 'none' });
      } else {
        this._btnPrev.style({ display: '' });
      }
    }
    
    // Update next button text
    if (this._btnNext) {
      if (this.isLastStep()) {
        this._btnNext.html('Finish <i class="fas fa-check ms-1"></i>');
      } else {
        this._btnNext.html('Next <i class="fas fa-chevron-right ms-1"></i>');
      }
    }
    
    // Handle custom action button
    this._updateActionButton(step);
    
    // Position tooltip
    this._positionTooltip(step);
    
    // Show tooltip
    this._showTooltip();
  };

  /**
   * Render step content with LiveBinding support
   * @param {Object} step - Step config
   */
  Tour.prototype._renderStepContent = function(step) {
    var self = this;
    var stepConfig = step.liveBinding;
    var tourConfig = this.options.liveBinding;
    var config = stepConfig || tourConfig;
    
    // No LiveBinding config at all, render static content
    if (!config) {
      this._updateTooltipContent({
        title: step.title || '',
        content: step.content || ''
      });
      return;
    }
    
    // Check if this is a LiveBinding key reference (has 'key' property) or direct data
    var hasLiveBindingKey = config.key && LiveBinding;
    
    if (hasLiveBindingKey) {
      // Subscribe to LiveBinding updates (reactive data source)
      this._currentUnsubscribe = LiveBindingContent.subscribe(config, function(data) {
        self._renderWithData(step, data);
      });
    } else {
      // Direct data object - use it as-is for template interpolation
      this._renderWithData(step, config);
    }
  };

  /**
   * Render step content with provided data context
   * @param {Object} step - Step config
   * @param {Object} data - Data for template interpolation
   */
  Tour.prototype._renderWithData = function(step, data) {
    var context = {};
    var key;
    
    // Copy bindingContext from step if present
    if (step.bindingContext) {
      for (key in step.bindingContext) {
        if (step.bindingContext.hasOwnProperty(key)) {
          context[key] = step.bindingContext[key];
        }
      }
    }
    
    // Copy data
    if (data && typeof data === 'object') {
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          context[key] = data[key];
        }
      }
    } else if (data !== null && data !== undefined) {
      // Data is a primitive, wrap it
      context.value = data;
    }
    
    var title = LiveBindingContent.resolveContent(step.title, context);
    var content = LiveBindingContent.resolveContent(step.content, context);
    
    this._updateTooltipContent({
      title: title,
      content: content
    });
  };

  /**
   * Update tooltip title and content elements
   * @param {Object} content - { title, content }
   */
  Tour.prototype._updateTooltipContent = function(content) {
    if (this._tooltipTitle && content.title !== undefined) {
      this._tooltipTitle.text(content.title);
    }
    
    if (this._tooltipContent && content.content !== undefined) {
      this._tooltipContent.html(content.content);
    }
  };

  /**
   * Clean up LiveBinding subscriptions
   */
  Tour.prototype._cleanupBindings = function() {
    if (this._currentUnsubscribe) {
      this._currentUnsubscribe();
      this._currentUnsubscribe = null;
    }
  };

  /**
   * Check if step should be skipped based on skipIf condition
   * skipIf can be a function that receives LiveBinding data
   * @param {Object} step - Step config
   * @returns {boolean} True if step should be skipped
   */
  Tour.prototype._shouldSkipStep = function(step) {
    var skipIf = step.skipIf;
    var config = step.liveBinding;
    var data;
    
    if (!skipIf) {
      return false;
    }
    
    // If skipIf is a function, call with LiveBinding data
    if (typeof skipIf === 'function') {
      data = config ? LiveBindingContent.getData(config) : {};
      return !!skipIf(data);
    }
    
    // If skipIf is a string (path to boolean in LiveBinding data)
    if (typeof skipIf === 'string' && config) {
      data = LiveBindingContent.getData(config);
      return !!LiveBindingContent.getValueByPath(data, skipIf);
    }
    
    return !!skipIf;
  };

  /**
   * Update custom action button if present
   * @param {Object} step - Step config
   */
  Tour.prototype._updateActionButton = function(step) {
    var self = this;
    var nav;
    
    // Remove existing action button
    if (this._btnAction) {
      this._btnAction.remove();
      this._btnAction = null;
    }
    
    if (step.action && step.action.text) {
      this._btnAction = D.create('button')
        .classAdd('btn btn-outline-primary btn-sm ' + CLASSES.btnAction)
        .attr('type', 'button')
        .text(step.action.text);
      
      E.on(this._btnAction.el, 'click', function() {
        if (typeof step.action.onClick === 'function') {
          step.action.onClick(step, self);
        }
      });
      
      // Insert before nav buttons
      nav = this._tooltip.one('.' + CLASSES.tooltipNav);
      if (nav) {
        nav.el.insertBefore(this._btnAction.el, nav.el.firstChild);
      }
    }
  };

  /**
   * Position tooltip relative to target element
   * Auto-flips if insufficient space
   * @param {Object} step - Step config with _targetElement
   */
  Tour.prototype._positionTooltip = function(step) {
    var el, targetRect, tooltipRect, position, offset, padding, vw, vh, space, pos;
    
    if (!this._tooltip || !step._targetElement) return;
    
    el = step._targetElement.el || step._targetElement;
    targetRect = el.getBoundingClientRect();
    tooltipRect = this._tooltip.el.getBoundingClientRect();
    
    position = step.position || 'auto';
    offset = 16; // Distance from target
    padding = step.highlightPadding !== undefined ? step.highlightPadding : this.options.highlightPadding;
    
    // Viewport dimensions
    vw = window.innerWidth;
    vh = window.innerHeight;
    
    // Available space in each direction
    space = {
      top: targetRect.top - padding,
      bottom: vh - targetRect.bottom - padding,
      left: targetRect.left - padding,
      right: vw - targetRect.right - padding
    };
    
    // Auto-determine best position
    if (position === 'auto') {
      position = this._calculateBestPosition(tooltipRect, space);
    }
    
    // Calculate position
    pos = this._calculateTooltipPosition(
      position, targetRect, tooltipRect, offset, padding, vw, vh
    );
    
    // Apply position
    this._tooltip.style({
      left: pos.left + 'px',
      top: pos.top + 'px'
    });
    
    // Update arrow position
    this._updateArrow(position, targetRect, pos);
    
    // Update position class
    this._tooltip
      .classRemove(CLASSES.positionTop, CLASSES.positionBottom, CLASSES.positionLeft, CLASSES.positionRight)
      .classAdd(CLASSES['position' + position.charAt(0).toUpperCase() + position.slice(1)]);
  };

  /**
   * Calculate best position based on available space
   * @param {DOMRect} tooltipRect - Tooltip bounding rect
   * @param {Object} space - Available space in each direction
   * @returns {string} Position (top|bottom|left|right)
   */
  Tour.prototype._calculateBestPosition = function(tooltipRect, space) {
    var positions = ['bottom', 'top', 'right', 'left'];
    var minSpace = {
      top: tooltipRect.height + 20,
      bottom: tooltipRect.height + 20,
      left: tooltipRect.width + 20,
      right: tooltipRect.width + 20
    };
    var i, pos;
    
    // Find first position with enough space
    for (i = 0; i < positions.length; i++) {
      pos = positions[i];
      if (space[pos] >= minSpace[pos]) {
        return pos;
      }
    }
    
    // Default to bottom if nothing fits
    return 'bottom';
  };

  /**
   * Calculate tooltip coordinates
   * @param {string} position - Tooltip position
   * @param {DOMRect} targetRect - Target element bounding rect
   * @param {DOMRect} tooltipRect - Tooltip bounding rect
   * @param {number} offset - Distance from target
   * @param {number} padding - Highlight padding
   * @param {number} vw - Viewport width
   * @param {number} vh - Viewport height
   * @returns {Object} Left and top coordinates
   */
  Tour.prototype._calculateTooltipPosition = function(position, targetRect, tooltipRect, offset, padding, vw, vh) {
    var left, top, margin;
    
    switch (position) {
      case 'top':
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        top = targetRect.top - padding - offset - tooltipRect.height;
        break;
        
      case 'bottom':
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        top = targetRect.bottom + padding + offset;
        break;
        
      case 'left':
        left = targetRect.left - padding - offset - tooltipRect.width;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
        
      case 'right':
        left = targetRect.right + padding + offset;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
    }
    
    // Clamp to viewport bounds
    margin = 10;
    left = Math.max(margin, Math.min(left, vw - tooltipRect.width - margin));
    top = Math.max(margin, Math.min(top, vh - tooltipRect.height - margin));
    
    return { left: left, top: top };
  };

  /**
   * Update arrow position and direction
   * @param {string} position - Tooltip position
   * @param {DOMRect} targetRect - Target element bounding rect
   * @param {Object} tooltipPos - Calculated tooltip position
   */
  Tour.prototype._updateArrow = function(position, targetRect, tooltipPos) {
    var arrow;
    
    if (!this._tooltipArrow) return;
    
    arrow = this._tooltipArrow;
    
    // Reset styles
    arrow.style({
      top: '',
      bottom: '',
      left: '',
      right: '',
      transform: ''
    });
    
    // Position arrow based on tooltip position
    switch (position) {
      case 'top':
        arrow.style({
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%) rotate(180deg)'
        });
        break;
        
      case 'bottom':
        arrow.style({
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)'
        });
        break;
        
      case 'left':
        arrow.style({
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)'
        });
        break;
        
      case 'right':
        arrow.style({
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)'
        });
        break;
    }
  };

  /**
   * Show tooltip with animation
   */
  Tour.prototype._showTooltip = function() {
    if (!this._tooltip) return;
    
    this._tooltip.style({
      opacity: '1',
      visibility: 'visible'
    });
  };

  /**
   * Hide tooltip with animation
   */
  Tour.prototype._hideTooltip = function() {
    if (!this._tooltip) return;
    
    this._tooltip.style({
      opacity: '0',
      visibility: 'hidden'
    });
  };

  // =========================================================================
  // Tour Prototype - Event Handlers (Phase 5)
  // =========================================================================

  /**
   * Bind all event listeners
   */
  Tour.prototype._bindEvents = function() {
    var self = this;
    
    // Keyboard navigation
    this._handlers.keydown = function(e) {
      self._handleKeydown(e);
    };
    E.on(document, 'keydown', this._handlers.keydown);
    
    // Window resize (debounced)
    this._handlers.resize = function() {
      self._onResize();
    };
    E.on(window, 'resize', this._handlers.resize);
    
    // Window scroll (throttled)
    this._handlers.scroll = function() {
      self._onScroll();
    };
    E.on(window, 'scroll', this._handlers.scroll, true);
  };

  /**
   * Unbind all event listeners
   */
  Tour.prototype._unbindEvents = function() {
    if (this._handlers.keydown) {
      E.off(document, 'keydown', this._handlers.keydown);
    }
    
    if (this._handlers.resize) {
      E.off(window, 'resize', this._handlers.resize);
    }
    
    if (this._handlers.scroll) {
      E.off(window, 'scroll', this._handlers.scroll, true);
    }
    
    // Clear any pending timers
    if (this._resizeTimer) {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    }
    if (this._scrollTimer) {
      clearTimeout(this._scrollTimer);
      this._scrollTimer = null;
    }
    
    this._handlers = {};
  };

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e
   */
  Tour.prototype._handleKeydown = function(e) {
    // Don't handle if tour not active
    if (!this.isActive()) return;
    
    switch (e.key) {
      case 'Escape':
        if (this.options.closeOnEscape) {
          e.preventDefault();
          this.skip();
        }
        break;
        
      case 'ArrowRight':
      case 'ArrowDown':
        // Don't override in interactive elements
        if (!this._isInteractiveElement(e.target)) {
          e.preventDefault();
          this.next();
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        if (!this._isInteractiveElement(e.target)) {
          e.preventDefault();
          this.prev();
        }
        break;
        
      case 'Enter':
      case ' ': // Space
        // Only handle if not focused on a button or interactive element
        if (e.target.tagName.toLowerCase() !== 'button' && !this._isInteractiveElement(e.target)) {
          e.preventDefault();
          this.next();
        }
        break;
        
      case 'Tab':
        // Trap focus within tooltip
        this._trapFocus(e);
        break;
        
      case 'Home':
        // Ctrl+Home: go to first step
        if (e.ctrlKey && !this._isInteractiveElement(e.target)) {
          e.preventDefault();
          this.goTo(0);
        }
        break;
        
      case 'End':
        // Ctrl+End: go to last step
        if (e.ctrlKey && !this._isInteractiveElement(e.target)) {
          e.preventDefault();
          this.goTo(this.steps.length - 1);
        }
        break;
    }
  };

  /**
   * Setup click-through for target element
   * @param {Object} step - Current step
   */
  Tour.prototype._enableTargetInteraction = function(step) {
    var el, computed;
    
    if (!step._targetElement) return;
    
    el = step._targetElement.el || step._targetElement;
    
    // Store original styles
    this._originalZIndex = el.style.zIndex;
    this._originalPosition = el.style.position;
    
    // Only adjust position if static
    computed = window.getComputedStyle(el);
    if (computed.position === 'static') {
      el.style.position = 'relative';
    }
    
    el.style.zIndex = '100001';
    
    // Add class for styling
    D.one(el).classAdd('tour-target--active');
  };

  /**
   * Restore target element to original state
   * @param {Object} step - Step to restore
   */
  Tour.prototype._disableTargetInteraction = function(step) {
    var el;
    
    if (!step || !step._targetElement) return;
    
    el = step._targetElement.el || step._targetElement;
    
    // Restore original styles
    if (this._originalZIndex !== undefined) {
      el.style.zIndex = this._originalZIndex;
    } else {
      el.style.zIndex = '';
    }
    
    if (this._originalPosition !== undefined) {
      el.style.position = this._originalPosition;
    }
    
    // Remove class
    D.one(el).classRemove('tour-target--active');
    
    this._originalZIndex = undefined;
    this._originalPosition = undefined;
  };

  // =========================================================================
  // Accessibility Methods (Phase 10)
  // =========================================================================

  /**
   * Store focus before tour starts
   */
  Tour.prototype._storeFocus = function() {
    this._previousFocus = document.activeElement;
  };

  /**
   * Restore focus to original element when tour ends
   */
  Tour.prototype._restoreFocus = function() {
    if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
      this._previousFocus.focus();
    }
    this._previousFocus = null;
  };

  /**
   * Focus the tooltip or first focusable element within
   */
  Tour.prototype._focusTooltip = function() {
    var firstFocusable;
    
    if (!this._tooltip) return;
    
    // Focus first focusable element or tooltip itself
    firstFocusable = this._tooltip.el.querySelector('button:not([disabled]), [href], input:not([disabled])');
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      this._tooltip.el.focus();
    }
  };

  /**
   * Get all focusable elements in tooltip
   * @returns {Array} Array of focusable DOM elements
   */
  Tour.prototype._getFocusableElements = function() {
    var selector, elements;
    
    if (!this._tooltip) return [];
    
    selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    elements = this._tooltip.el.querySelectorAll(selector);
    
    return Array.prototype.filter.call(elements, function(el) {
      return el.offsetParent !== null; // Visible elements only
    });
  };

  /**
   * Trap focus within tooltip (called on Tab key)
   * @param {Event} e - Keyboard event
   */
  Tour.prototype._trapFocus = function(e) {
    var focusable = this._getFocusableElements();
    var firstFocusable, lastFocusable;
    
    if (focusable.length === 0) return;
    
    firstFocusable = focusable[0];
    lastFocusable = focusable[focusable.length - 1];
    
    if (e.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  /**
   * Announce step change to screen readers
   * @param {Object} step - Step config
   * @param {number} index - Step index
   */
  Tour.prototype._announceStep = function(step, index) {
    var stepNum = index + 1;
    var totalSteps = this.steps.length;
    var message, content;
    
    // Safety check
    if (!step) {
      return;
    }
    
    message = 'Step ' + stepNum + ' of ' + totalSteps + ': ' + (step.title || 'Untitled');
    
    if (step.content) {
      // Strip HTML and truncate
      content = step.content.replace(/<[^>]*>/g, '');
      if (content.length > 100) {
        content = content.substring(0, 100) + '...';
      }
      message += '. ' + content;
    }
    
    announce(message, A11Y.LIVE_REGIONS.POLITE);
  };

  /**
   * Announce tour start
   */
  Tour.prototype._announceTourStart = function() {
    var message = 'Starting tour. ' + 
                  this.steps.length + ' steps total. ' +
                  'Press Escape to exit, use arrow keys or Tab to navigate.';
    announce(message, A11Y.LIVE_REGIONS.ASSERTIVE);
  };

  /**
   * Announce tour end
   * @param {boolean} completed - Whether tour was completed
   */
  Tour.prototype._announceTourEnd = function(completed) {
    var message = completed 
      ? 'Tour completed successfully.'
      : 'Tour ended.';
    announce(message, A11Y.LIVE_REGIONS.POLITE);
  };

  /**
   * Update accessibility state for current step
   */
  Tour.prototype._updateA11yState = function() {
    var step = this.steps[this.currentStepIndex];
    var stepNum = this.currentStepIndex + 1;
    var totalSteps = this.steps.length;
    var isFirst = this.currentStepIndex === 0;
    var isLast = this.currentStepIndex === this.steps.length - 1;
    
    // Safety check
    if (!step) {
      console.warn('[Funky.Tour] _updateA11yState: No step at index', this.currentStepIndex);
      return;
    }
    
    // Update button states
    if (this._btnPrev) {
      if (isFirst) {
        this._btnPrev.attr('disabled', 'disabled').attr('aria-disabled', 'true');
      } else {
        this._btnPrev.el.removeAttribute('disabled');
        this._btnPrev.el.removeAttribute('aria-disabled');
      }
    }
    
    // Announce step
    this._announceStep(step, this.currentStepIndex);
  };

  /**
   * Check if element is interactive (should not override arrow keys)
   * @param {Element} el - DOM element
   * @returns {boolean}
   */
  Tour.prototype._isInteractiveElement = function(el) {
    var tagName = el.tagName.toLowerCase();
    return ['input', 'textarea', 'select'].indexOf(tagName) >= 0 ||
           el.isContentEditable;
  };

  /**
   * Mark target element for accessibility
   * @param {Element} targetEl - Target DOM element
   */
  Tour.prototype._markTarget = function(targetEl) {
    var tooltipId, existing, newValue;
    
    if (!targetEl) return;
    
    // Store original attributes
    this._originalTargetAttrs = {
      tabindex: targetEl.getAttribute('tabindex'),
      ariaDescribedby: targetEl.getAttribute('aria-describedby')
    };
    
    // Make target focusable if not already
    if (!targetEl.getAttribute('tabindex')) {
      targetEl.setAttribute('tabindex', '0');
    }
    
    // Link to tooltip
    tooltipId = 'tour-tooltip-' + this.id;
    existing = targetEl.getAttribute('aria-describedby');
    newValue = existing ? existing + ' ' + tooltipId : tooltipId;
    targetEl.setAttribute('aria-describedby', newValue);
  };

  /**
   * Restore target element attributes
   * @param {Element} targetEl - Target DOM element
   */
  Tour.prototype._unmarkTarget = function(targetEl) {
    var tooltipId, current, updated;
    
    if (!targetEl || !this._originalTargetAttrs) return;
    
    // Restore tabindex
    if (this._originalTargetAttrs.tabindex === null) {
      targetEl.removeAttribute('tabindex');
    } else if (this._originalTargetAttrs.tabindex) {
      targetEl.setAttribute('tabindex', this._originalTargetAttrs.tabindex);
    }
    
    // Restore aria-describedby
    tooltipId = 'tour-tooltip-' + this.id;
    current = targetEl.getAttribute('aria-describedby') || '';
    updated = current.replace(tooltipId, '').replace(/\s+/g, ' ').trim();
    
    if (updated) {
      targetEl.setAttribute('aria-describedby', updated);
    } else {
      targetEl.removeAttribute('aria-describedby');
    }
    
    this._originalTargetAttrs = null;
  };

  // =========================================================================
  // TourManager (Public API)
  // =========================================================================

  var TourManager = {
    /**
     * Initialize a new tour
     * @param {string} id - Tour identifier
     * @param {Object} options - Tour configuration
     * @returns {Tour} Tour instance
     */
    init: function(id, options) {
      if (typeof id === 'object') {
        options = id;
      } else {
        options = options || {};
        options.id = id;
      }
      return new Tour(options);
    },

    /**
     * @deprecated Use Tour.init() instead
     */
    create: function(id, options) {
      if (Funky.debug) {
        console.warn('[Funky.Tour] create() is deprecated. Use init() instead.');
      }
      return TourManager.init(id, options);
    },

    /**
     * Get a registered tour by ID
     * @param {string} tourId
     * @returns {Tour|null}
     */
    getInstance: function(tourId) {
      return registry[tourId] || null;
    },

    /**
     * @deprecated Use Tour.getInstance() instead
     */
    get: function(tourId) {
      return TourManager.getInstance(tourId);
    },

    /**
     * Check if a tour exists
     * @param {string} tourId
     * @returns {boolean}
     */
    has: function(tourId) {
      return !!registry[tourId];
    },

    /**
     * Start a tour by ID
     * @param {string} tourId
     * @returns {Tour|null}
     */
    start: function(tourId) {
      var tour = registry[tourId];
      if (tour) {
        tour.start();
      }
      return tour;
    },

    /**
     * End the currently active tour
     */
    endActive: function() {
      if (activeTour) {
        activeTour.end();
      }
    },

    /**
     * Get the currently active tour
     * @returns {Tour|null}
     */
    getActive: function() {
      return activeTour;
    },

    /**
     * List all registered tour IDs
     * @returns {string[]}
     */
    list: function() {
      return Object.keys(registry);
    },

    /**
     * Reset completion state for a tour
     * @param {string} tourId
     */
    reset: function(tourId) {
      if (Storage) {
        Storage.remove(STORAGE_KEY_PREFIX + tourId);
      }
    },

    /**
     * Reset all tour completion states
     */
    resetAll: function() {
      var keys = this.list();
      var i;
      for (i = 0; i < keys.length; i++) {
        this.reset(keys[i]);
      }
    },

    /**
     * Check if a tour has been completed
     * @param {string} tourId
     * @returns {boolean}
     */
    isCompleted: function(tourId) {
      if (!Storage) return false;
      return Storage.get(STORAGE_KEY_PREFIX + tourId, false);
    },

    /**
     * Destroy a tour instance
     * @param {string} tourId
     */
    destroy: function(tourId) {
      var tour = registry[tourId];
      if (tour) {
        tour.destroy();
      }
    },

    /**
     * Destroy all tours
     */
    destroyAll: function() {
      var keys = Object.keys(registry);
      var i;
      for (i = 0; i < keys.length; i++) {
        this.destroy(keys[i]);
      }
    },

    // Expose classes for testing/extension
    _Tour: Tour,
    _DEFAULTS: DEFAULTS,
    _STEP_DEFAULTS: STEP_DEFAULTS,
    _CLASSES: CLASSES,
    _STATES: STATES
  };

  // =========================================================================
  // SPA Integration (Phase 6)
  // =========================================================================

  var SPAIntegration = {
    _initialized: false,
    _currentPageId: null,
    _pageTour: null,

    /**
     * Initialize SPA integration
     * Hooks into Funky.Pages lifecycle
     */
    init: function() {
      var self = this;
      
      if (this._initialized) return;
      if (!Funky.Pages) {
        console.log('[Funky.Tour] Funky.Pages not available, SPA integration disabled');
        return;
      }

      // Listen for page changes
      if (PubSub) {
        // Page mounted event
        PubSub.on('funky:pages:mounted', function(data) {
          self._onPageMounted(data.pageId);
        });

        // Page unmounting event (cleanup)
        PubSub.on('funky:pages:unmounting', function(data) {
          self._onPageUnmounting(data.pageId);
        });

        // SPA navigation start
        PubSub.on('funky:spa:navigate:start', function() {
          self._onNavigateStart();
        });
      }

      this._initialized = true;
      console.log('[Funky.Tour] SPA integration initialized');
    },

    /**
     * Handle page mounted
     * @param {string} pageId
     */
    _onPageMounted: function(pageId) {
      var page, tourConfig, tourId, tour, config;
      var self = this;
      
      this._currentPageId = pageId;

      // Get page definition
      if (!Funky.Pages || !Funky.Pages.get) return;
      
      page = Funky.Pages.get(pageId);
      if (!page || !page.tour) return;

      tourConfig = page.tour;

      // Check condition if provided
      if (typeof tourConfig.condition === 'function') {
        if (!tourConfig.condition()) {
          console.log('[Funky.Tour] Tour condition not met for:', pageId);
          return;
        }
      }

      // Create or get existing tour
      tourId = tourConfig.id || 'page-tour-' + pageId;
      tour = TourManager.get(tourId);

      if (!tour) {
        // Build tour config
        config = this._buildTourConfig(tourConfig, pageId);
        tour = TourManager.init(config);
      }

      // Store reference
      this._pageTour = tour;

      // Auto-start if configured and should show
      if (tourConfig.autoStart !== false && tour.shouldShow()) {
        // Small delay to ensure page is fully rendered
        setTimeout(function() {
          tour.start();
          
          if (PubSub) {
            PubSub.emit('funky:tour:page:triggered', { 
              tourId: tourId, 
              pageId: pageId 
            });
          }
        }, 300);
      }
    },

    /**
     * Build tour config from page definition
     * @param {Object} tourConfig - Page tour config
     * @param {string} pageId - Page identifier
     * @returns {Object} Full tour configuration
     */
    _buildTourConfig: function(tourConfig, pageId) {
      var key;
      var config = {
        id: tourConfig.id || 'page-tour-' + pageId,
        steps: this._normalizePageSteps(tourConfig.steps),
        autoStart: false, // We handle autoStart ourselves
        persist: tourConfig.persist !== false,
        showOnce: tourConfig.showOnce !== false,
        showProgress: tourConfig.showProgress !== false,
        showSkip: tourConfig.showSkip !== false,
        onComplete: tourConfig.onComplete,
        onSkip: tourConfig.onSkip
      };

      // Merge any additional options
      for (key in tourConfig) {
        if (tourConfig.hasOwnProperty(key) && config[key] === undefined) {
          config[key] = tourConfig[key];
        }
      }

      return config;
    },

    /**
     * Normalize page steps (support simple selector arrays)
     * @param {Array} steps - Step definitions or selectors
     * @returns {Array} Normalized step configs
     */
    _normalizePageSteps: function(steps) {
      var i, normalized;
      
      if (!steps) return [];
      
      normalized = [];
      for (i = 0; i < steps.length; i++) {
        // Simple string selector
        if (typeof steps[i] === 'string') {
          normalized.push({ target: steps[i] });
        } else {
          normalized.push(steps[i]);
        }
      }

      return normalized;
    },

    /**
     * Handle page unmounting
     * @param {string} pageId
     */
    _onPageUnmounting: function(pageId) {
      // End any active tour for this page
      if (this._pageTour && this._pageTour.isActive()) {
        this._pageTour.end();
      }
      this._pageTour = null;
    },

    /**
     * Handle navigation start
     * End active tour when navigating away
     */
    _onNavigateStart: function() {
      if (activeTour) {
        activeTour.end();
      }
    },

    /**
     * Manually trigger page tour
     * @param {string} [pageId] - Page ID (defaults to current)
     * @returns {Tour|null}
     */
    triggerPageTour: function(pageId) {
      var page, tourId, tour;
      
      pageId = pageId || this._currentPageId;
      if (!pageId) return null;

      if (!Funky.Pages || !Funky.Pages.get) return null;
      
      page = Funky.Pages.get(pageId);
      if (!page || !page.tour) return null;

      tourId = page.tour.id || 'page-tour-' + pageId;
      tour = TourManager.get(tourId);

      if (tour) {
        // Reset and start
        TourManager.reset(tourId);
        tour.start();
        return tour;
      }

      return null;
    },

    /**
     * Get current page tour
     * @returns {Tour|null}
     */
    getCurrentPageTour: function() {
      return this._pageTour;
    }
  };

  // =========================================================================
  // DOM Discovery (Phase 6)
  // =========================================================================

  /**
   * Discover tour steps from data attributes
   * @param {string} tourId - Tour ID to look for
   * @param {HTMLElement} [container] - Container to search (default: document)
   * @returns {Object[]} Discovered steps
   */
  function discoverStepsFromDOM(tourId, container) {
    var steps = [];
    var selector, elements, i, el, stepAttr, parts, stepIndex;
    
    container = container || document;
    selector = '[data-tour-step^="' + tourId + ':"]';
    elements = container.querySelectorAll(selector);

    for (i = 0; i < elements.length; i++) {
      el = elements[i];
      stepAttr = el.getAttribute('data-tour-step');
      parts = stepAttr.split(':');
      stepIndex = parseInt(parts[1], 10);

      steps.push({
        target: el,
        index: stepIndex,
        title: el.getAttribute('data-tour-title') || '',
        content: el.getAttribute('data-tour-content') || '',
        position: el.getAttribute('data-tour-position') || 'auto'
      });
    }

    // Sort by index
    steps.sort(function(a, b) {
      return a.index - b.index;
    });

    return steps;
  }

  /**
   * Initialize tour start buttons
   * @param {HTMLElement} [container] - Container to search
   */
  function initStartButtons(container) {
    var buttons, i, btn, tourId;
    
    container = container || document;
    buttons = container.querySelectorAll('[data-tour-start]');

    for (i = 0; i < buttons.length; i++) {
      btn = buttons[i];
      tourId = btn.getAttribute('data-tour') || btn.getAttribute('data-tour-start');

      (function(id, button) {
        E.on(button, 'click', function(e) {
          var tour;
          
          e.preventDefault();

          tour = TourManager.get(id);
          if (tour) {
            // Reset and start
            TourManager.reset(id);
            tour.start();
          } else {
            // Try to create from DOM
            tour = TourManager.createFromDOM(id);
            if (tour) {
              tour.start();
            }
          }
        });
      })(tourId, btn);
    }
  }

  // Add to TourManager
  TourManager.spa = SPAIntegration;
  
  TourManager.createFromDOM = function(tourId, options) {
    var steps = discoverStepsFromDOM(tourId);
    var config;

    if (steps.length === 0) {
      console.warn('[Funky.Tour] No steps found for tour:', tourId);
      return null;
    }

    config = merge({ id: tourId, steps: steps }, options || {});
    return TourManager.init(config);
  };

  TourManager.discoverSteps = discoverStepsFromDOM;
  TourManager.initStartButtons = initStartButtons;
  
  TourManager.triggerPageTour = function(pageId) {
    return SPAIntegration.triggerPageTour(pageId);
  };

  // Persistence API (Phase 7)
  TourManager.dismissAll = function() {
    Persistence.dismissAll();
  };

  TourManager.enableAll = function() {
    Persistence.enableAll();
  };

  TourManager.getStats = function(tourId) {
    return Persistence.getStats(tourId);
  };

  TourManager.getServerDefinedTours = function(context) {
    return PreferencesIntegration.getServerDefinedTours(context);
  };

  /**
   * Load and register tours defined in server preferences
   * @param {string} [context] - Page/section context
   */
  TourManager.loadServerTours = function(context) {
    var serverTours = PreferencesIntegration.getServerDefinedTours(context);
    var i, tourConfig, tour;

    if (!serverTours || !serverTours.length) return;

    for (i = 0; i < serverTours.length; i++) {
      tourConfig = serverTours[i];
      
      if (!tourConfig.id || !tourConfig.steps) {
        console.warn('[Funky.Tour] Invalid server tour config:', tourConfig);
        continue;
      }

      // Skip if already registered
      if (registry[tourConfig.id]) {
        console.log('[Funky.Tour] Server tour already registered:', tourConfig.id);
        continue;
      }

      // Create and optionally auto-start
      tour = TourManager.init(tourConfig.id, tourConfig);

      if (tourConfig.autoStart && tour && tour.shouldShow()) {
        (function(t) {
          setTimeout(function() {
            t.start();
          }, 500);
        })(tour);
      }
    }
  };

  // Expose internal modules for advanced usage
  TourManager._persistence = Persistence;
  TourManager._preferencesIntegration = PreferencesIntegration;

  // =========================================================================
  // Auto-initialization
  // =========================================================================

  function autoInit() {
    TourManager.initStartButtons();
    SPAIntegration.init();
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Load server tours on page render
  if (PubSub) {
    PubSub.on('funky:pages:rendered', function(data) {
      TourManager.loadServerTours(data.pageId || data.page);
    });
  }

  // =========================================================================
  // Export
  // =========================================================================

  if (Funky.register) {
    Funky.register('Tour', TourManager);
  }

})(window);
