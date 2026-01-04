/**
 * Funky.QuickNav
 * 
 * Floating navigation widget for quick access to page sections and custom actions.
 * Features: back-to-top, skip link detection, custom actions, SPA support.
 * 
 * @example
 * Funky.QuickNav.init({
 *   position: 'bottom-right',
 *   backToTop: true
 * });
 * 
 * Funky.QuickNav.addAction({
 *   id: 'help',
 *   icon: 'fas fa-question',
 *   label: 'Help',
 *   onClick: showHelp
 * });
 */
(function(global) {
  'use strict';

  // Ensure Funky registry exists
  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.QuickNav] Registry not found. Load namespace.js first.');
    return;
  }

  // Prevent duplicate registration
  if (global.Funky.isRegistered && global.Funky.isRegistered('QuickNav')) {
    return;
  }

  var Funky = global.Funky;
  var D = Funky.Dom;
  var E = Funky.Events;
  var PubSub = Funky.PubSub;

  // =========================================================================
  // State & Config
  // =========================================================================

  var state = {
    initialized: false,
    visible: true,
    expanded: false,
    element: null,
    fab: null,
    actionList: null,
    collapseTimer: null,
    defaultZIndex: 1020,
    sections: [],
    currentSectionIndex: -1,  // Track current section for up/down nav
    announcer: null,
    scrollTracker: null,  // Funky.ScrollTracker instance
    lastExpandTime: 0,  // Timestamp to prevent immediate collapse after expand
    isNavigating: false  // Flag to prevent scroll handler from updating index during programmatic navigation
  };

  var config = {
    position: 'bottom-right',
    container: 'body',
    offset: { x: 16, y: 16 },
    zIndex: 1020,
    collapsed: true,
    collapseOnAction: true,
    collapseDelay: 3000,
    backToTop: true,
    sections: true,
    announceNavigation: true,
    builtinActions: [],
    fabIcon: 'fas fa-compass',
    closeIcon: 'fas fa-times',
    ariaLabel: 'Quick navigation',
    // Scroll behavior
    scrollOffset: 0,                  // Offset in pixels to account for sticky headers
    scrollOffsetSelector: null,       // Selector for element whose height to use as offset (e.g., '.sticky-header')
    // Visibility triggers (Phase 4)
    showTrigger: 'always',            // 'scroll', 'always', 'manual'
    scrollThreshold: 200,             // Pixels scrolled before showing
    scrollDirection: 'down',          // 'down', 'up', 'both'
    hideOnInactive: false,            // Hide after inactivity
    inactiveTimeout: 5000,            // ms before hiding
    animation: 'slide',               // 'slide', 'fade', 'scale', 'none'
    animationDuration: 200,           // ms
    // SPA Integration (Phase 7)
    spa: {
      autoRefresh: true,              // Re-detect sections on route change
      persistActions: true,           // Keep custom actions across pages
      persistBadges: false            // Clear badges on navigation
    },
    // Preferences Integration (Phase 9)
    preferences: {
      enabled: true,                  // Use Funky.Preferences if available
      key: 'quicknav',                // Preference key namespace
      persist: ['position']           // Settings to persist: 'position', 'collapsed'
    }
  };

  // =========================================================================
  // Action Registry (using Funky.ActionRegistry)
  // =========================================================================

  // Guard against ActionRegistry not being loaded yet
  if (!Funky.ActionRegistry) {
    console.warn('[Funky.QuickNav] ActionRegistry not available. Load action-registry.js first.');
    return;
  }

  var ActionRegistry = Funky.ActionRegistry.create({
    schema: {
      icon: 'fas fa-circle',
      label: '',
      badge: undefined,
      badgeType: 'count',
      order: 50,
      hidden: false,
      disabled: false,
      onClick: null,
      emit: null,
      emitData: null,
      className: '',
      isAction: true,
      persistent: false               // Survives reset() and SPA navigation
    },
    onAdd: function(action) {
      if (state.initialized) {
        renderAllItems();
      }
      PubSub.emit('funky:quick-nav:action:added', { id: action.id });
    },
    onRemove: function(id) {
      if (state.initialized) {
        renderAllItems();
      }
      PubSub.emit('funky:quick-nav:action:removed', { id: id });
    },
    onUpdate: function(id, updates) {
      if (state.initialized) {
        renderAllItems();
      }
      PubSub.emit('funky:quick-nav:action:updated', { id: id, updates: updates });
    },
    onClear: function() {
      if (state.initialized) {
        renderAllItems();
      }
    }
  });

  // =========================================================================
  // Built-in Actions
  // =========================================================================

  var BUILTIN_ACTIONS = {
    'theme-toggle': {
      id: 'theme-toggle',
      icon: 'fas fa-moon',
      label: 'Toggle Theme',
      order: 90,
      onClick: function() {
        if (Funky.Theme) {
          Funky.Theme.toggle();
        }
      }
    },
    'help': {
      id: 'help',
      icon: 'fas fa-question',
      label: 'Help',
      order: 100,
      emit: 'app:help:show'
    }
  };

  /**
   * Register built-in actions from config
   */
  function registerBuiltinActions() {
    if (!Array.isArray(config.builtinActions)) return;

    config.builtinActions.forEach(function(actionId) {
      if (BUILTIN_ACTIONS[actionId]) {
        ActionRegistry.add(BUILTIN_ACTIONS[actionId]);
      } else {
        console.warn('[QuickNav] Unknown built-in action: ' + actionId);
      }
    });
  }

  // =========================================================================
  // Scroll Tracker (using Funky.ScrollTracker)
  // =========================================================================

  /**
   * Initialize scroll tracking using Funky.ScrollTracker
   */
  function initScrollTracker() {
    state.scrollTracker = Funky.ScrollTracker.create({
      namespace: 'quicknav',
      thresholds: [config.scrollThreshold, 50],
      trackDirection: true,

      onScroll: function(data) {
        // Show/hide based on scroll threshold
        if (config.showTrigger === 'scroll') {
          if (data.scrollY > config.scrollThreshold) {
            if (config.scrollDirection === 'both' ||
                config.scrollDirection === data.direction) {
              show();
            }
          } else if (data.scrollY <= 0) {
            hide();
          }
        }

        // Show/hide back-to-top section based on scroll position
        updateBackToTopVisibility(data.scrollY);
        
        // Update current section for up/down navigation
        updateCurrentSectionIndex();
      }
    });
  }

  /**
   * Destroy scroll tracker
   */
  function destroyScrollTracker() {
    if (state.scrollTracker) {
      state.scrollTracker.destroy();
      state.scrollTracker = null;
    }
  }

  /**
   * Update back-to-top visibility based on scroll position
   * @param {number} scrollY - Current scroll position
   */
  function updateBackToTopVisibility(scrollY) {
    if (!config.backToTop) return;

    var backToTopSection = null;
    for (var i = 0; i < state.sections.length; i++) {
      if (state.sections[i].isBackToTop) {
        backToTopSection = state.sections[i];
        break;
      }
    }

    if (!backToTopSection) return;

    var button = state.actionList ? state.actionList.findOne('[data-section="back-to-top"]') : null;
    if (!button) return;

    if (scrollY < 50) {
      button.classAdd('quick-nav__action--hidden');
      button.attr('aria-hidden', 'true');
    } else {
      button.classRemove('quick-nav__action--hidden');
      button.attr('aria-hidden', 'false');
    }
  }

  /**
   * Get navigable sections (excluding back-to-top)
   * @returns {Array}
   */
  function getNavigableSections() {
    return state.sections.filter(function(s) {
      return !s.isBackToTop && s.element;
    });
  }

  /**
   * Update current section index based on scroll position
   */
  function updateCurrentSectionIndex() {
    // Skip update during programmatic navigation to prevent scroll events from resetting index
    if (state.isNavigating) return;
    
    var sections = getNavigableSections();
    if (sections.length === 0) {
      state.currentSectionIndex = -1;
      return;
    }

    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var viewportHeight = window.innerHeight;
    var triggerPoint = scrollY + (viewportHeight * 0.3); // 30% down viewport

    var newIndex = -1;
    for (var i = sections.length - 1; i >= 0; i--) {
      var el = sections[i].element;
      if (el) {
        var rect = el.getBoundingClientRect();
        var elTop = rect.top + scrollY;
        if (triggerPoint >= elTop) {
          newIndex = i;
          break;
        }
      }
    }

    if (newIndex !== state.currentSectionIndex) {
      state.currentSectionIndex = newIndex;
      updateSectionNavVisibility();
    }
  }

  /**
   * Update visibility of section nav arrows
   */
  function updateSectionNavVisibility() {
    if (!state.actionList) return;

    var sections = getNavigableSections();
    var prevBtn = state.actionList.findOne('[data-action="section-prev"]');
    var nextBtn = state.actionList.findOne('[data-action="section-next"]');

    if (prevBtn) {
      if (state.currentSectionIndex > 0) {
        prevBtn.classRemove('quick-nav__action--hidden');
        prevBtn.attr('aria-hidden', 'false');
      } else {
        prevBtn.classAdd('quick-nav__action--hidden');
        prevBtn.attr('aria-hidden', 'true');
      }
    }

    if (nextBtn) {
      if (state.currentSectionIndex < sections.length - 1) {
        nextBtn.classRemove('quick-nav__action--hidden');
        nextBtn.attr('aria-hidden', 'false');
      } else {
        nextBtn.classAdd('quick-nav__action--hidden');
        nextBtn.attr('aria-hidden', 'true');
      }
    }
  }

  /**
   * Navigate to next section
   * @returns {boolean} Success
   */
  function goToNextSection() {
    var sections = getNavigableSections();
    if (sections.length === 0) return false;

    var nextIndex = state.currentSectionIndex + 1;
    if (nextIndex >= sections.length) return false;

    var section = sections[nextIndex];
    if (section && section.element) {
      // Set navigating flag to prevent scroll handler from resetting index
      state.isNavigating = true;
      scrollToElement(section.element);
      state.currentSectionIndex = nextIndex;
      updateSectionNavVisibility();
      
      // Clear navigating flag after scroll animation completes
      setTimeout(function() {
        state.isNavigating = false;
      }, 600); // Slightly longer than typical smooth scroll
      
      announce('Navigated to ' + section.label);
      PubSub.emit('funky:quick-nav:section:navigated', { 
        id: section.id,
        label: section.label,
        index: nextIndex, 
        direction: 'next' 
      });
      return true;
    }
    return false;
  }

  /**
   * Navigate to previous section
   * @returns {boolean} Success
   */
  function goToPreviousSection() {
    var sections = getNavigableSections();
    if (sections.length === 0) return false;

    var prevIndex = state.currentSectionIndex - 1;
    if (prevIndex < 0) return false;

    var section = sections[prevIndex];
    if (section && section.element) {
      // Set navigating flag to prevent scroll handler from resetting index
      state.isNavigating = true;
      scrollToElement(section.element);
      state.currentSectionIndex = prevIndex;
      updateSectionNavVisibility();
      
      // Clear navigating flag after scroll animation completes
      setTimeout(function() {
        state.isNavigating = false;
      }, 600); // Slightly longer than typical smooth scroll
      
      announce('Navigated to ' + section.label);
      PubSub.emit('funky:quick-nav:section:navigated', { 
        id: section.id,
        label: section.label,
        index: prevIndex, 
        direction: 'previous' 
      });
      return true;
    }
    return false;
  }

  // =========================================================================
  // Inactivity Tracker (Phase 4)
  // =========================================================================

  var InactivityTracker = {
    timer: null,
    _handlers: null,

    start: function() {
      if (!config.hideOnInactive) return;

      var self = this;

      // Store handlers for cleanup
      this._handlers = {
        mousemove: function() { self.reset(); },
        keydown: function() { self.reset(); },
        scroll: function() { self.reset(); },
        touchstart: function() { self.reset(); }
      };

      this.reset();

      E.on(document, 'mousemove', this._handlers.mousemove);
      E.on(document, 'keydown', this._handlers.keydown);
      E.on(window, 'scroll', this._handlers.scroll);
      E.on(document, 'touchstart', this._handlers.touchstart);
    },

    reset: function() {
      clearTimeout(this.timer);

      if (state.visible && config.hideOnInactive) {
        this.timer = setTimeout(function() {
          hide();
        }, config.inactiveTimeout);
      }
    },

    stop: function() {
      clearTimeout(this.timer);

      if (this._handlers) {
        E.off(document, 'mousemove', this._handlers.mousemove);
        E.off(document, 'keydown', this._handlers.keydown);
        E.off(window, 'scroll', this._handlers.scroll);
        E.off(document, 'touchstart', this._handlers.touchstart);
        this._handlers = null;
      }
    }
  };

  // =========================================================================
  // SPA Integration (Phase 7)
  // =========================================================================

  var SPAIntegration = {
    _lastUrl: '',
    _pollInterval: null,
    _pageloadHandler: null,

    /**
     * Initialize SPA integration
     */
    init: function() {
      var self = this;
      this._lastUrl = window.location.href;

      // Listen for Funky.SPA pageload event (DOM custom event)
      this._pageloadHandler = function(event) {
        self.onNavigated(event.detail || {});
      };
      document.addEventListener('funky.spa.pageload', this._pageloadHandler);

      // Also listen via PubSub for compatibility
      if (PubSub) {
        PubSub.on('funky:spa:navigated', function(data) {
          self.onNavigated(data);
        });
        PubSub.on('funky:spa:before:navigate', function(data) {
          self.onBeforeNavigate(data);
        });
      }

      // Listen for popstate (back/forward) - dot notation for DOM events
      E.on(window, 'popstate.quicknav.spa', function() {
        self.onPopState();
      });

      // Fallback polling for apps not using Funky.SPA
      if (!Funky.SPA) {
        this._pollInterval = setInterval(function() {
          self._checkUrlChange();
        }, 500);
      }
    },

    /**
     * Handle SPA navigation complete
     * @param {Object} data - Navigation data
     */
    onNavigated: function(data) {
      var self = this;
      var spaConfig = config.spa || {};

      if (spaConfig.autoRefresh !== false) {
        // Small delay to let new content render
        setTimeout(function() {
          refreshSections();

          if (!spaConfig.persistBadges) {
            self._clearAllBadges();
          }

          PubSub.emit('funky:quick-nav:route:changed', {
            url: data && data.url ? data.url : window.location.pathname
          });
        }, 100);
      }
    },

    /**
     * Handle before SPA navigation
     */
    onBeforeNavigate: function() {
      // Collapse before navigation
      if (state.expanded) {
        collapse();
      }
    },

    /**
     * Handle browser popstate (back/forward)
     */
    onPopState: function() {
      var spaConfig = config.spa || {};
      if (spaConfig.autoRefresh !== false) {
        refreshSections();
      }
    },

    /**
     * Check for URL changes (fallback polling)
     * @private
     */
    _checkUrlChange: function() {
      var currentUrl = window.location.href;
      if (currentUrl !== this._lastUrl) {
        this._lastUrl = currentUrl;
        this.onNavigated({ url: currentUrl });
      }
    },

    /**
     * Clear all badges from actions
     * @private
     */
    _clearAllBadges: function() {
      var actions = ActionRegistry.getAll();
      actions.forEach(function(action) {
        if (action.badge !== undefined && action.badge !== null) {
          clearBadgeOnAction(action.id);
        }
      });
    },

    /**
     * Clear non-persistent custom actions
     * @private
     */
    _clearNonPersistentActions: function() {
      var actions = ActionRegistry.getAll();
      actions.forEach(function(action) {
        // Remove if it's a custom action (not built-in) and not persistent
        if (action.isAction && !action.persistent && !BUILTIN_ACTIONS[action.id]) {
          ActionRegistry.remove(action.id);
        }
      });
    },

    /**
     * Destroy SPA integration
     */
    destroy: function() {
      // Remove DOM event listener
      if (this._pageloadHandler) {
        document.removeEventListener('funky.spa.pageload', this._pageloadHandler);
        this._pageloadHandler = null;
      }

      // Remove PubSub listeners
      if (PubSub) {
        PubSub.off('funky:spa:navigated');
        PubSub.off('funky:spa:before:navigate');
      }

      // Remove popstate listener
      E.off(window, 'popstate.quicknav.spa');

      // Clear polling interval
      if (this._pollInterval) {
        clearInterval(this._pollInterval);
        this._pollInterval = null;
      }
    }
  };

  // =========================================================================
  // Preferences Binding (Phase 9)
  // =========================================================================

  var preferencesBinding = null;

  /**
   * Initialize preferences binding using Funky.Preferences.bind()
   */
  function initPreferencesBinding() {
    var prefsConfig = config.preferences || {};
    if (!prefsConfig.enabled) return;
    if (!Funky.Preferences || !Funky.Preferences.bind) return;

    preferencesBinding = Funky.Preferences.bind({
      key: prefsConfig.key || 'quicknav',
      persist: prefsConfig.persist || ['position'],
      getState: function() {
        return {
          position: config.position,
          collapsed: config.collapsed
        };
      },
      applyState: function(saved) {
        if (saved.position) {
          config.position = saved.position;
          if (state.element) {
            setPosition(saved.position);
          }
        }
        if (saved.collapsed !== undefined) {
          config.collapsed = saved.collapsed;
        }
      },
      onLoad: 'funky:quick-nav:preferences:loaded',
      onSave: 'funky:quick-nav:preferences:saved',
      onClear: 'funky:quick-nav:preferences:cleared'
    });
  }

  /**
   * Destroy preferences binding
   */
  function destroyPreferencesBinding() {
    if (preferencesBinding) {
      preferencesBinding.destroy();
      preferencesBinding = null;
    }
  }

  // =========================================================================
  // Default Landmarks
  // =========================================================================

  var DEFAULT_LANDMARKS = [
    { 
      id: 'main', 
      icon: 'fas fa-file-alt', 
      label: 'Main Content', 
      selectors: ['main', '[role="main"]', '#main', '#content']
    },
    { 
      id: 'nav', 
      icon: 'fas fa-bars', 
      label: 'Navigation', 
      selectors: ['nav:not(.quick-nav)', '[role="navigation"]:not(.quick-nav)', '#nav']
    },
    { 
      id: 'search', 
      icon: 'fas fa-search', 
      label: 'Search', 
      selectors: ['[role="search"]', '#search', '.search-form']
    },
    { 
      id: 'footer', 
      icon: 'fas fa-info', 
      label: 'Footer', 
      selectors: ['footer', '[role="contentinfo"]', '#footer']
    }
  ];

  // =========================================================================
  // DOM Creation
  // =========================================================================

  /**
   * Create the QuickNav DOM structure
   */
  function createElements() {
    // Main container
    var container = D.create('div')
      .classAdd('quick-nav')
      .classAdd('quick-nav--' + config.position)
      .classAdd(config.collapsed ? 'quick-nav--collapsed' : 'quick-nav--expanded')
      .attr('role', 'navigation')
      .attr('aria-label', config.ariaLabel);

    // Apply custom offset via CSS variables
    container.style({
      '--quicknav-offset-x': config.offset.x + 'px',
      '--quicknav-offset-y': config.offset.y + 'px',
      '--quicknav-z-index': config.zIndex
    });

    // FAB button
    var fab = D.create('button')
      .classAdd('quick-nav__fab')
      .attr('type', 'button')
      .attr('aria-expanded', config.collapsed ? 'false' : 'true')
      .attr('aria-controls', 'quick-nav-actions')
      .attr('aria-label', config.ariaLabel + ' menu');

    // FAB icons (main + close)
    var mainIcon = D.create('span')
      .classAdd('quick-nav__fab-icon');
    D.create('i')
      .classAdd(config.fabIcon.split(' ')[0])
      .classAdd(config.fabIcon.split(' ')[1] || '')
      .appendTo(mainIcon);
    mainIcon.appendTo(fab);

    var closeIcon = D.create('span')
      .classAdd('quick-nav__fab-icon')
      .classAdd('quick-nav__fab-icon--close');
    D.create('i')
      .classAdd(config.closeIcon.split(' ')[0])
      .classAdd(config.closeIcon.split(' ')[1] || '')
      .appendTo(closeIcon);
    closeIcon.appendTo(fab);

    // Action list container
    var actionList = D.create('div')
      .attr('id', 'quick-nav-actions')
      .classAdd('quick-nav__actions')
      .attr('aria-hidden', config.collapsed ? 'true' : 'false');

    // Assemble
    fab.appendTo(container);
    actionList.appendTo(container);

    // Store references
    state.element = container;
    state.fab = fab;
    state.actionList = actionList;

    // Append to container
    var parentEl = D.one(config.container);
    if (parentEl) {
      container.appendTo(parentEl);
    } else {
      container.appendTo(D.one('body'));
    }

    return container;
  }

  // =========================================================================
  // Screen Reader Announcements
  // =========================================================================

  /**
   * Create the live region for announcements
   */
  function createAnnouncer() {
    if (state.announcer) return;

    state.announcer = D.create('div')
      .attr('role', 'status')
      .attr('aria-live', 'polite')
      .attr('aria-atomic', 'true')
      .classAdd('quick-nav__announcer')
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
      });

    D.one('body').append(state.announcer);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  function announce(message) {
    if (!config.announceNavigation || !state.announcer) return;

    // Clear and set new message (triggers announcement)
    state.announcer.text('');
    setTimeout(function() {
      state.announcer.text(message);
    }, 100);
  }

  // =========================================================================
  // Section Detection
  // =========================================================================

  /**
   * Check if user prefers reduced motion
   * Uses Funky.MediaQuery for shared listener
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    if (Funky.MediaQuery) {
      return Funky.MediaQuery.matches('reduced-motion');
    }
    // Fallback if MediaQuery not loaded
    return window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Find first matching element from selectors
   * @param {Array} selectors - CSS selectors to try
   * @returns {Element|null}
   */
  function findElement(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  /**
   * Detect skip links in the page
   * @returns {Array} Skip link sections
   */
  function detectSkipLinks() {
    var skipLinks = [];
    var links = D.all('a[href^="#"]');

    links.each(function(link) {
      var text = (link.text() || '').toLowerCase();
      var href = link.attr('href');

      // Check if it's a skip link pattern
      if (text.indexOf('skip') !== -1 || 
          link.classHas('skip-link') ||
          link.classHas('skip-to-content') ||
          link.classHas('visually-hidden')) {

        var targetId = href.substring(1);
        if (!targetId) return;

        var target = D.one('#' + targetId);

        if (target) {
          skipLinks.push({
            id: 'skip-' + targetId,
            icon: 'fas fa-forward',
            label: link.text() || 'Skip to ' + targetId,
            element: target.get(),
            isSkipLink: true
          });
        }
      }
    });

    // Also detect data-skip-target elements (used by SkipLink component)
    var skipTargets = D.all('[data-skip-target]');
    var seenIds = {};
    
    // Mark already added skip links to avoid duplicates
    skipLinks.forEach(function(skip) {
      seenIds[skip.id] = true;
    });

    var targetsArray = [];
    skipTargets.each(function(el) {
      var skipId = el.attr('data-skip-target');
      var label = el.attr('data-skip-label') || skipId;
      var order = parseInt(el.attr('data-skip-order'), 10) || 99;
      
      // Skip if already added or if it's navigation/main (handled by landmarks)
      if (seenIds[skipId] || seenIds['skip-' + skipId]) return;
      if (skipId === 'navigation' || skipId === 'main') return;
      
      targetsArray.push({
        id: 'skip-' + skipId,
        icon: 'fas fa-bookmark',
        label: label,
        element: el.get(),
        isSkipLink: true,
        order: order
      });
    });

    // Sort by order attribute
    targetsArray.sort(function(a, b) {
      return (a.order || 99) - (b.order || 99);
    });

    // Add sorted targets to skipLinks
    skipLinks = skipLinks.concat(targetsArray);

    return skipLinks;
  }

  /**
   * Detect all sections (landmarks + skip links)
   * @returns {Array} All detected sections
   */
  function detectSections() {
    var sections = [];

    // Always add back-to-top first if enabled
    if (config.backToTop) {
      sections.push({
        id: 'top',
        icon: 'fas fa-arrow-up',
        label: 'Back to Top',
        element: null,
        isBackToTop: true
      });
    }

    // Custom sections from config
    if (Array.isArray(config.sections)) {
      config.sections.forEach(function(section) {
        var el = section.selector ? document.querySelector(section.selector) : null;
        sections.push({
          id: section.id,
          icon: section.icon || 'fas fa-bookmark',
          label: section.label,
          element: el,
          isCustom: true
        });
      });
      return sections;
    }

    // Auto-detect if sections === true
    if (config.sections !== true) {
      return sections;
    }

    // Detect skip links first (higher priority)
    var skipLinks = detectSkipLinks();
    var skipLinkElements = [];

    skipLinks.forEach(function(skip) {
      sections.push(skip);
      if (skip.element) {
        skipLinkElements.push(skip.element);
      }
    });

    // Check each landmark (if not already covered by skip links)
    DEFAULT_LANDMARKS.forEach(function(landmark) {
      var element = findElement(landmark.selectors);
      if (element) {
        // Check if this element is already covered by a skip link
        var alreadyCovered = skipLinkElements.indexOf(element) !== -1;
        if (!alreadyCovered) {
          sections.push({
            id: landmark.id,
            icon: landmark.icon,
            label: landmark.label,
            element: element,
            isLandmark: true
          });
        }
      }
    });

    // Sort sections by vertical position (except back-to-top which stays first)
    var backToTop = sections.filter(function(s) { return s.isBackToTop; });
    var navigable = sections.filter(function(s) { return !s.isBackToTop && s.element; });
    
    // Sort by element's vertical position
    navigable.sort(function(a, b) {
      var rectA = a.element.getBoundingClientRect();
      var rectB = b.element.getBoundingClientRect();
      return rectA.top - rectB.top;
    });

    return backToTop.concat(navigable);
  }

  /**
   * Find section by ID
   * @param {string} sectionId - Section ID
   * @returns {Object|null}
   */
  function findSection(sectionId) {
    for (var i = 0; i < state.sections.length; i++) {
      if (state.sections[i].id === sectionId) {
        return state.sections[i];
      }
    }
    return null;
  }

  // =========================================================================
  // Navigation
  // =========================================================================

  /**
   * Get the scroll offset value (accounts for sticky headers)
   * @returns {number} Offset in pixels
   */
  function getScrollOffset() {
    // If a selector is provided, measure that element's height
    if (config.scrollOffsetSelector) {
      var offsetEl = document.querySelector(config.scrollOffsetSelector);
      if (offsetEl) {
        return offsetEl.offsetHeight;
      }
    }
    // Otherwise use the static scrollOffset value
    return config.scrollOffset || 0;
  }

  /**
   * Scroll to a specific element with smooth behavior
   * @param {Element} element - DOM element to scroll to
   */
  function scrollToElement(element) {
    if (!element) return;
    
    var offset = getScrollOffset();
    
    if (offset > 0) {
      // Use window.scrollTo with calculated position to account for offset
      var elementRect = element.getBoundingClientRect();
      var absoluteTop = elementRect.top + window.pageYOffset;
      var scrollPosition = absoluteTop - offset;
      
      window.scrollTo({
        top: scrollPosition,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    } else {
      // No offset, use native scrollIntoView
      element.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    }

    // Focus for accessibility (make focusable if not already)
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    element.focus({ preventScroll: true });
  }

  /**
   * Scroll to top of page
   */
  function scrollToTop() {
    // Set navigating flag to prevent scroll handler from resetting index
    state.isNavigating = true;
    
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });

    // Reset section index to start
    state.currentSectionIndex = -1;
    updateSectionNavVisibility();
    
    // Clear navigating flag after scroll animation completes
    setTimeout(function() {
      state.isNavigating = false;
    }, 600);

    announce('Scrolled to top of page');

    PubSub.emit('funky:quick-nav:navigate', {
      section: 'top',
      element: document.body
    });
  }

  /**
   * Navigate to a section
   * @param {string} sectionId - Section ID to navigate to
   * @returns {boolean} Success
   */
  function navigateTo(sectionId) {
    var section = findSection(sectionId);
    if (!section) {
      console.warn('[QuickNav] Section not found: ' + sectionId);
      return false;
    }

    // Back to top special case
    if (section.isBackToTop) {
      scrollToTop();
      if (config.collapseOnAction) {
        collapse();
      }
      return true;
    }

    if (!section.element) {
      console.warn('[QuickNav] Section has no element: ' + sectionId);
      return false;
    }

    // Set navigating flag to prevent scroll handler from interfering
    state.isNavigating = true;

    // Smooth scroll
    section.element.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start'
    });

    // Update current section index to match navigated section
    var sections = getNavigableSections();
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].id === sectionId) {
        state.currentSectionIndex = i;
        updateSectionNavVisibility();
        break;
      }
    }

    // Clear navigating flag after scroll animation completes
    setTimeout(function() {
      state.isNavigating = false;
    }, 600);

    // Focus for accessibility (make focusable if not already)
    if (!section.element.hasAttribute('tabindex')) {
      section.element.setAttribute('tabindex', '-1');
    }
    section.element.focus({ preventScroll: true });

    // Announce
    announce('Navigated to ' + section.label);

    // Emit event
    PubSub.emit('funky:quick-nav:navigate', {
      section: sectionId,
      element: section.element
    });

    // Collapse if configured
    if (config.collapseOnAction) {
      collapse();
    }

    return true;
  }

  // =========================================================================
  // Badge Helpers - Uses Funky.Badge directly
  // =========================================================================

  var Badge = Funky.Badge;
  var badgeSubscriptions = {};  // actionId -> subscriptionId

  /**
   * Get action button element by action ID
   * @param {string} actionId - Action ID
   * @returns {Object|null} Funky.Dom element or null
   */
  function getActionButton(actionId) {
    return state.actionList ? state.actionList.findOne('[data-action="' + actionId + '"]') : null;
  }

  /**
   * Set badge on an action
   * @param {string} actionId - Action ID
   * @param {number|string|Object} options - Badge value or options object
   * @returns {boolean} Success
   */
  function setBadgeOnAction(actionId, options) {
    var action = ActionRegistry.get(actionId);
    if (!action) {
      console.warn('[QuickNav] Action not found: ' + actionId);
      return false;
    }

    // Normalize options
    if (typeof options === 'number' || typeof options === 'string') {
      options = { value: options };
    }

    var oldValue = action.badge;
    var badgeOpts = {
      value: options.value,
      type: options.type || 'count',
      animate: options.animate !== false
    };

    // Update action registry
    action.badge = badgeOpts.value;
    action.badgeType = badgeOpts.type;

    // Use Funky.Badge to render
    var button = getActionButton(actionId);
    if (button) {
      Badge.update(button, badgeOpts);
    }

    // Announce if changed and it's a count
    if (badgeOpts.value !== oldValue && badgeOpts.type === 'count') {
      announceBadgeChange(action, badgeOpts);
    }

    PubSub.emit('funky:quick-nav:badge:updated', {
      actionId: actionId,
      value: badgeOpts.value,
      type: badgeOpts.type,
      previousValue: oldValue
    });

    return true;
  }

  /**
   * Clear badge from an action
   * @param {string} actionId - Action ID
   * @returns {boolean} Success
   */
  function clearBadgeOnAction(actionId) {
    var action = ActionRegistry.get(actionId);
    if (!action) return false;

    action.badge = null;
    action.badgeType = null;

    var button = getActionButton(actionId);
    if (button) {
      Badge.remove(button);
    }

    PubSub.emit('funky:quick-nav:badge:cleared', { actionId: actionId });
    return true;
  }

  /**
   * Announce badge change to screen readers
   * @param {Object} action - Action object
   * @param {Object} badge - Badge data
   */
  function announceBadgeChange(action, badge) {
    if (!badge.value && badge.value !== 0) return;

    var message = action.label + ': ' + badge.value;
    if (badge.type === 'count') {
      message += ' new';
    }
    announce(message);
  }

  /**
   * Subscribe action to a PubSub event for badge updates
   * @param {string} actionId - Action ID
   * @param {string} eventName - PubSub event name
   */
  function subscribeBadgeSource(actionId, eventName) {
    // Unsubscribe existing if present
    if (badgeSubscriptions[actionId]) {
      Badge.unsubscribe(badgeSubscriptions[actionId]);
      delete badgeSubscriptions[actionId];
    }

    var button = getActionButton(actionId);
    if (button) {
      // Use Funky.Badge.subscribe directly
      var subId = Badge.subscribe(button, eventName, { type: 'count' });
      if (subId) {
        badgeSubscriptions[actionId] = subId;
      }
    }
  }

  /**
   * Initialize badge sources for all actions with badgeSource config
   */
  function initBadgeSources() {
    var actions = ActionRegistry.getAll();
    actions.forEach(function(action) {
      if (action.badgeSource) {
        subscribeBadgeSource(action.id, action.badgeSource);
      }
    });
  }

  /**
   * Cleanup all badge subscriptions
   */
  function destroyBadgeSources() {
    Object.keys(badgeSubscriptions).forEach(function(actionId) {
      Badge.unsubscribe(badgeSubscriptions[actionId]);
    });
    badgeSubscriptions = {};
  }

  // =========================================================================
  // Action Rendering
  // =========================================================================

  /**
   * Create action button element for sections
   * @param {Object} section - Section data
   * @returns {Object} Funky.Dom element
   */
  function createSectionButton(section) {
    var button = D.create('button')
      .classAdd('quick-nav__action')
      .attr('type', 'button')
      .attr('data-section', section.id)
      .attr('aria-label', 'Navigate to ' + section.label);

    // Icon
    var iconSpan = D.create('span')
      .classAdd('quick-nav__action-icon');
    var iconParts = section.icon.split(' ');
    var icon = D.create('i')
      .classAdd(iconParts[0])
      .classAdd(iconParts[1] || '');
    icon.appendTo(iconSpan);
    iconSpan.appendTo(button);

    // Label (tooltip)
    var label = D.create('span')
      .classAdd('quick-nav__action-label')
      .text(section.label);
    label.appendTo(button);

    return button;
  }

  /**
   * Create action button element for custom actions
   * @param {Object} action - Action data
   * @returns {Object} Funky.Dom element
   */
  function createActionButton(action) {
    var button = D.create('button')
      .classAdd('quick-nav__action')
      .attr('type', 'button')
      .attr('data-action', action.id)
      .attr('aria-label', action.label);

    if (action.className) {
      button.classAdd(action.className);
    }

    if (action.disabled) {
      button.attr('disabled', 'disabled');
    }

    // Icon
    var iconSpan = D.create('span')
      .classAdd('quick-nav__action-icon');
    var iconParts = action.icon.split(' ');
    var icon = D.create('i')
      .classAdd(iconParts[0])
      .classAdd(iconParts[1] || '');
    icon.appendTo(iconSpan);
    iconSpan.appendTo(button);

    // Badge - use Funky.Badge
    if (action.badge !== undefined) {
      Badge.attach(button, {
        value: action.badge,
        type: action.badgeType || 'count',
        animate: false
      });
    }

    // Label (tooltip)
    var label = D.create('span')
      .classAdd('quick-nav__action-label')
      .text(action.label);
    label.appendTo(button);

    return button;
  }

  /**
   * Get all items (sections + actions) sorted by order
   * Now uses up/down navigation for sections instead of individual buttons
   * @returns {Array}
   */
  function getAllItemsSorted() {
    var items = [];
    var navigableSections = getNavigableSections();

    // Add section nav buttons (up/down) if we have navigable sections
    // Order: Down first (closest to FAB), Up second, Back-to-top last
    if (navigableSections.length > 0) {
      // Next section (down arrow) - first/closest to FAB
      items.push({
        type: 'section-nav',
        order: 1,
        data: {
          id: 'section-next',
          icon: 'fas fa-chevron-down',
          label: 'Next Section',
          action: 'next'
        }
      });

      // Previous section (up arrow)
      items.push({
        type: 'section-nav',
        order: 2,
        data: {
          id: 'section-prev',
          icon: 'fas fa-chevron-up',
          label: 'Previous Section',
          action: 'prev'
        }
      });
    }

    // Add back-to-top last (furthest from FAB)
    if (config.backToTop) {
      items.push({
        type: 'section',
        order: 3,
        data: {
          id: 'top',
          icon: 'fas fa-arrow-up',
          label: 'Back to Top',
          element: null,
          isBackToTop: true
        }
      });
    }

    // Add visible custom actions
    ActionRegistry.getSorted().forEach(function(action) {
      items.push({
        type: 'action',
        order: action.order,
        data: action
      });
    });

    // Sort by order
    items.sort(function(a, b) {
      return a.order - b.order;
    });

    return items;
  }

  /**
   * Create section nav button (up/down arrows)
   * @param {Object} navData - Nav button data
   * @returns {Object} Funky.Dom element
   */
  function createSectionNavButton(navData) {
    var button = D.create('button')
      .classAdd('quick-nav__action')
      .classAdd('quick-nav__action--section-nav')
      .attr('type', 'button')
      .attr('data-action', navData.id)
      .attr('aria-label', navData.label);

    // Icon
    var iconSpan = D.create('span')
      .classAdd('quick-nav__action-icon');
    var iconParts = navData.icon.split(' ');
    var icon = D.create('i')
      .classAdd(iconParts[0])
      .classAdd(iconParts[1] || '');
    icon.appendTo(iconSpan);
    iconSpan.appendTo(button);

    // Label (tooltip)
    var label = D.create('span')
      .classAdd('quick-nav__action-label')
      .text(navData.label);
    label.appendTo(button);

    return button;
  }

  /**
   * Render all items (sections + actions)
   */
  function renderAllItems() {
    if (!state.actionList) return;

    // Unbind existing events
    unbindActionEvents();

    // Clear existing
    state.actionList.html('');

    // Get sorted items
    var items = getAllItemsSorted();

    // Render each item
    items.forEach(function(item) {
      var button;
      if (item.type === 'section') {
        button = createSectionButton(item.data);
      } else if (item.type === 'section-nav') {
        button = createSectionNavButton(item.data);
      } else {
        button = createActionButton(item.data);
      }
      button.appendTo(state.actionList);
    });

    // Bind click events
    bindActionEvents();
    
    // Update section nav visibility based on current position
    updateCurrentSectionIndex();
  }

  /**
   * Render all section actions (alias for compatibility)
   */
  function renderSections() {
    renderAllItems();
  }

  /**
   * Handle action click
   * @param {string} actionId - Action ID
   */
  function handleActionClick(actionId) {
    // Handle section navigation actions
    if (actionId === 'section-prev') {
      goToPreviousSection();
      if (config.collapseOnAction) {
        collapse();
      }
      return;
    }
    
    if (actionId === 'section-next') {
      goToNextSection();
      if (config.collapseOnAction) {
        collapse();
      }
      return;
    }

    var action = ActionRegistry.get(actionId);
    if (!action || action.disabled) return;

    // Emit event for all actions
    PubSub.emit('funky:quick-nav:action:click', {
      id: actionId,
      action: action
    });

    // Custom callback
    if (typeof action.onClick === 'function') {
      action.onClick(action);
    }

    // PubSub emit
    if (action.emit) {
      PubSub.emit(action.emit, action.emitData || {});
    }

    // Collapse if configured
    if (config.collapseOnAction) {
      collapse();
    }
  }

  // Store cleanup functions for delegated events
  var actionEventCleanup = {
    section: null,
    action: null
  };

  /**
   * Bind click events to action buttons using delegation
   */
  function bindActionEvents() {
    if (!state.actionList) return;

    var listEl = state.actionList.get();

    // Section buttons - use delegation
    actionEventCleanup.section = E.delegate(listEl, '[data-section]', 'click', function(e) {
      e.stopPropagation();
      var sectionId = this.getAttribute('data-section');
      if (sectionId) {
        navigateTo(sectionId);
      }
      resetCollapseTimer();
    });

    // Action buttons - use delegation
    actionEventCleanup.action = E.delegate(listEl, '[data-action]', 'click', function(e) {
      e.stopPropagation();
      var actionId = this.getAttribute('data-action');
      if (actionId) {
        handleActionClick(actionId);
      }
      resetCollapseTimer();
    });
  }

  /**
   * Unbind action events
   */
  function unbindActionEvents() {
    if (actionEventCleanup.section) {
      actionEventCleanup.section();
      actionEventCleanup.section = null;
    }
    if (actionEventCleanup.action) {
      actionEventCleanup.action();
      actionEventCleanup.action = null;
    }
  }

  /**
   * Refresh sections (re-detect and re-render)
   */
  function refreshSections() {
    state.sections = detectSections();
    renderAllItems();
    
    // Update section navigation state after refresh
    updateCurrentSectionIndex();
    updateSectionNavVisibility();
    
    PubSub.emit('funky:quick-nav:sections:refreshed', { sections: state.sections });
  }

  // =========================================================================
  // Event Binding
  // =========================================================================

  // Store handlers for cleanup
  var eventHandlers = {
    fabClick: null,
    outsideClick: null,
    escapeKey: null
  };

  /**
   * Bind all event listeners
   */
  function bindEvents() {
    if (!state.fab) return;

    // FAB click - toggle expand/collapse
    eventHandlers.fabClick = function(e) {
      e.stopPropagation();
      QuickNav.toggle();
    };
    E.on(state.fab.get(), 'click', eventHandlers.fabClick);

    // Click outside to collapse
    eventHandlers.outsideClick = function(e) {
      if (state.expanded && state.element) {
        // Ignore clicks within 100ms of expanding (prevents immediate collapse from programmatic expand)
        if (Date.now() - state.lastExpandTime < 100) return;
        
        var el = state.element.get();
        if (el && !el.contains(e.target)) {
          QuickNav.collapse();
        }
      }
    };
    E.on(document, 'click', eventHandlers.outsideClick);

    // Escape key to collapse
    eventHandlers.escapeKey = function(e) {
      if (e.key === 'Escape' && state.expanded) {
        QuickNav.collapse();
        // Return focus to FAB
        if (state.fab) {
          state.fab.get().focus();
        }
      }
    };
    E.on(document, 'keydown', eventHandlers.escapeKey);
  }

  /**
   * Unbind all event listeners
   */
  function unbindEvents() {
    if (state.fab && eventHandlers.fabClick) {
      E.off(state.fab.get(), 'click', eventHandlers.fabClick);
    }
    if (eventHandlers.outsideClick) {
      E.off(document, 'click', eventHandlers.outsideClick);
    }
    if (eventHandlers.escapeKey) {
      E.off(document, 'keydown', eventHandlers.escapeKey);
    }
    eventHandlers.fabClick = null;
    eventHandlers.outsideClick = null;
    eventHandlers.escapeKey = null;
  }

  // =========================================================================
  // Expand/Collapse
  // =========================================================================

  /**
   * Expand the action list
   */
  function expand() {
    if (state.expanded || !state.element) return;

    state.expanded = true;
    state.lastExpandTime = Date.now();  // Track when we expanded
    config.collapsed = false;
    state.element.classRemove('quick-nav--collapsed');
    state.element.classAdd('quick-nav--expanded');

    if (state.fab) {
      state.fab.attr('aria-expanded', 'true');
    }

    if (state.actionList) {
      state.actionList.attr('aria-hidden', 'false');
    }

    // Start auto-collapse timer
    startCollapseTimer();

    PubSub.emit('funky:quick-nav:expanded');

    // Auto-save preferences if enabled (Phase 9)
    if (preferencesBinding && preferencesBinding.shouldPersist('collapsed')) {
      preferencesBinding.save();
    }
  }

  /**
   * Collapse the action list
   */
  function collapse() {
    if (!state.expanded || !state.element) return;

    state.expanded = false;
    config.collapsed = true;
    state.element.classRemove('quick-nav--expanded');
    state.element.classAdd('quick-nav--collapsed');

    if (state.fab) {
      state.fab.attr('aria-expanded', 'false');
    }

    if (state.actionList) {
      state.actionList.attr('aria-hidden', 'true');
    }

    // Clear timer
    clearCollapseTimer();

    PubSub.emit('funky:quick-nav:collapsed');

    // Auto-save preferences if enabled (Phase 9)
    if (preferencesBinding && preferencesBinding.shouldPersist('collapsed')) {
      preferencesBinding.save();
    }
  }

  /**
   * Toggle expand/collapse
   */
  function toggleExpanded() {
    if (state.expanded) {
      collapse();
    } else {
      expand();
    }
  }

  // =========================================================================
  // Auto-Collapse Timer
  // =========================================================================

  /**
   * Start the auto-collapse timer
   */
  function startCollapseTimer() {
    clearCollapseTimer();

    if (config.collapseDelay > 0) {
      state.collapseTimer = setTimeout(function() {
        collapse();
      }, config.collapseDelay);
    }
  }

  /**
   * Clear the auto-collapse timer
   */
  function clearCollapseTimer() {
    if (state.collapseTimer) {
      clearTimeout(state.collapseTimer);
      state.collapseTimer = null;
    }
  }

  /**
   * Reset the auto-collapse timer (e.g., on interaction)
   */
  function resetCollapseTimer() {
    if (state.expanded && config.collapseDelay > 0) {
      startCollapseTimer();
    }
  }

  // =========================================================================
  // Visibility
  // =========================================================================

  /**
   * Show the QuickNav with animation
   */
  function show() {
    if (state.visible || !state.element) return;

    state.visible = true;

    // Remove hidden class
    state.element.classRemove('quick-nav--hidden');
    state.element.classAdd('quick-nav--visible');

    // Animation
    if (!prefersReducedMotion() && config.animation !== 'none') {
      state.element.classAdd('quick-nav--animation-' + config.animation);
      state.element.classAdd('quick-nav--entering');

      setTimeout(function() {
        if (state.element) {
          state.element.classRemove('quick-nav--entering');
        }
      }, config.animationDuration);
    }

    // Start inactivity timer
    if (config.hideOnInactive) {
      InactivityTracker.start();
    }

    PubSub.emit('funky:quick-nav:shown');
  }

  /**
   * Hide the QuickNav with animation
   */
  function hide() {
    if (!state.visible || !state.element) return;

    state.visible = false;

    // Stop inactivity tracking
    InactivityTracker.stop();

    // Also collapse if expanded
    if (state.expanded) {
      collapse();
    }

    // Animation
    if (!prefersReducedMotion() && config.animation !== 'none') {
      state.element.classAdd('quick-nav--leaving');

      setTimeout(function() {
        if (state.element) {
          state.element.classRemove('quick-nav--leaving');
          state.element.classRemove('quick-nav--visible');
          state.element.classAdd('quick-nav--hidden');
        }
      }, config.animationDuration);
    } else {
      state.element.classRemove('quick-nav--visible');
      state.element.classAdd('quick-nav--hidden');
    }

    PubSub.emit('funky:quick-nav:hidden');
  }

  /**
   * Toggle visibility
   */
  function toggleVisibility() {
    if (state.visible) {
      hide();
    } else {
      show();
    }
  }

  // =========================================================================
  // Z-Index Management
  // =========================================================================

  /**
   * Set z-index
   * @param {number} z - New z-index value
   */
  function setZIndex(z) {
    if (!state.element) return;
    config.zIndex = z;
    state.element.style({ '--quicknav-z-index': z });
  }

  /**
   * Reset z-index to default
   */
  function resetZIndex() {
    setZIndex(state.defaultZIndex);
  }

  // =========================================================================
  // Position
  // =========================================================================

  /**
   * Set position
   * @param {string} position - 'bottom-right', 'bottom-left', 'top-right', 'top-left'
   */
  function setPosition(position) {
    if (!state.element) return;

    var validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    if (validPositions.indexOf(position) === -1) {
      console.warn('[QuickNav] Invalid position: ' + position);
      return;
    }

    // Remove old position class
    state.element.classRemove('quick-nav--' + config.position);

    // Add new position class
    config.position = position;
    state.element.classAdd('quick-nav--' + position);

    PubSub.emit('funky:quick-nav:position:changed', { position: position });

    // Auto-save preferences if enabled (Phase 9)
    if (preferencesBinding && preferencesBinding.shouldPersist('position')) {
      preferencesBinding.save();
    }
  }

  // =========================================================================
  // Public API
  // =========================================================================

  var QuickNav = {
    /**
     * Initialize QuickNav
     * @param {Object} options - Configuration options
     */
    init: function(options) {
      if (state.initialized) {
        console.warn('[QuickNav] Already initialized. Call destroy() first.');
        return this;
      }

      // Merge config
      if (options) {
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            if (key === 'offset' && typeof options.offset === 'object') {
              config.offset = {
                x: options.offset.x !== undefined ? options.offset.x : config.offset.x,
                y: options.offset.y !== undefined ? options.offset.y : config.offset.y
              };
            } else {
              config[key] = options[key];
            }
          }
        }
      }

      // Store default z-index
      state.defaultZIndex = config.zIndex;

      // Create announcer for screen readers
      createAnnouncer();

      // Create DOM
      createElements();

      // Register built-in actions from config
      registerBuiltinActions();

      // Detect and render sections
      state.sections = detectSections();
      renderAllItems();

      // Bind events
      bindEvents();

      // Initialize scroll tracking (using Funky.ScrollTracker)
      initScrollTracker();

      // Set initial visibility based on trigger mode
      if (config.showTrigger === 'scroll') {
        // Start hidden, show after scroll threshold
        state.visible = false;
        state.element.classAdd('quick-nav--hidden');
      } else if (config.showTrigger === 'manual') {
        // Start hidden, wait for manual show()
        state.visible = false;
        state.element.classAdd('quick-nav--hidden');
      } else {
        // 'always' - start visible
        state.visible = true;
        state.element.classAdd('quick-nav--visible');
        // Start inactivity tracker if configured
        if (config.hideOnInactive) {
          InactivityTracker.start();
        }
      }

      // Update back-to-top visibility on init
      updateBackToTopVisibility(window.scrollY || window.pageYOffset);

      // Initialize current section index based on scroll position
      // Use requestAnimationFrame to ensure DOM has painted and positions are accurate
      requestAnimationFrame(function() {
        // Re-detect sections after DOM is ready (positions may have changed)
        state.sections = detectSections();
        renderAllItems();
        updateCurrentSectionIndex();
        updateSectionNavVisibility();
        
        // Also update after a short delay to catch any late-loading content
        setTimeout(function() {
          state.sections = detectSections();
          updateCurrentSectionIndex();
          updateSectionNavVisibility();
        }, 100);
      });

      // Initialize badge sources
      initBadgeSources();

      // Initialize SPA integration (Phase 7)
      SPAIntegration.init();

      // Initialize preferences binding (Phase 9)
      initPreferencesBinding();

      state.initialized = true;
      state.expanded = !config.collapsed;

      PubSub.emit('funky:quick-nav:initialized');

      return this;
    },

    /**
     * Destroy QuickNav and cleanup
     */
    destroy: function() {
      if (!state.initialized) return this;

      // Clear timer
      clearCollapseTimer();

      // Stop trackers
      destroyScrollTracker();
      InactivityTracker.stop();
      SPAIntegration.destroy();
      destroyPreferencesBinding();

      // Cleanup badge subscriptions
      destroyBadgeSources();

      // Unbind events
      unbindActionEvents();
      unbindEvents();

      // Clear action registry
      ActionRegistry.clear();

      // Remove DOM
      if (state.element) {
        state.element.remove();
      }

      // Remove announcer
      if (state.announcer) {
        state.announcer.remove();
        state.announcer = null;
      }

      // Reset state
      state.initialized = false;
      state.visible = true;
      state.expanded = false;
      state.element = null;
      state.fab = null;
      state.actionList = null;
      state.sections = [];

      // Reset config to defaults
      config.position = 'bottom-right';
      config.collapsed = true;
      config.zIndex = 1020;

      PubSub.emit('funky:quick-nav:destroyed');

      return this;
    },

    // Expand/Collapse
    expand: expand,
    collapse: collapse,
    toggle: toggleExpanded,

    /**
     * Reset QuickNav state (Phase 7 - SPA Support)
     * @param {boolean|Object} options - true for full reset, or options object
     * @param {boolean} [options.sections=true] - Re-detect sections
     * @param {boolean} [options.badges=false] - Clear all badges
     * @param {boolean} [options.customActions=false] - Clear non-persistent custom actions
     * @param {boolean} [options.expand=false] - Collapse if expanded
     * @returns {Object} QuickNav for chaining
     */
    reset: function(options) {
      if (!state.initialized) return this;

      // Full reset
      if (options === true) {
        options = {
          sections: true,
          badges: true,
          customActions: true,
          expand: true
        };
      }

      // Apply defaults
      var opts = {
        sections: true,
        badges: false,
        customActions: false,
        expand: false
      };
      if (options && typeof options === 'object') {
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            opts[key] = options[key];
          }
        }
      }

      if (opts.sections) {
        refreshSections();
      }

      if (opts.badges) {
        SPAIntegration._clearAllBadges();
      }

      if (opts.customActions) {
        SPAIntegration._clearNonPersistentActions();
        renderAllItems();
      }

      if (opts.expand && state.expanded) {
        collapse();
      }

      PubSub.emit('funky:quick-nav:reset', opts);

      return this;
    },

    // Visibility
    show: show,
    hide: hide,
    toggleVisibility: toggleVisibility,
    isVisible: function() { return state.visible; },
    isExpanded: function() { return state.expanded; },

    // Stay Expanded (don't collapse on action)
    setStayExpanded: function(value) {
      config.collapseOnAction = !value;
      return this;
    },
    getStayExpanded: function() { return !config.collapseOnAction; },

    // Z-Index
    setZIndex: setZIndex,
    resetZIndex: resetZIndex,

    // Position
    setPosition: setPosition,
    getPosition: function() { return config.position; },

    // Timer
    resetCollapseTimer: resetCollapseTimer,

    // Sections (Phase 2)
    navigateTo: navigateTo,
    refreshSections: refreshSections,
    getSections: function() { return state.sections.slice(); },
    
    // Section Navigation (up/down arrows)
    nextSection: goToNextSection,
    previousSection: goToPreviousSection,
    getCurrentSectionIndex: function() { return state.currentSectionIndex; },

    // Actions (Phase 3)
    /**
     * Add a custom action
     * @param {Object} action - Action config {id, icon, label, onClick, emit, order, badge, badgeSource, etc}
     * @returns {Object} QuickNav for chaining
     */
    addAction: function(action) {
      if (!state.initialized) {
        console.warn('[QuickNav] Not initialized. Call init() first.');
        return this;
      }
      if (ActionRegistry.add(action)) {
        renderAllItems();
        // Subscribe to badge source if specified
        if (action.badgeSource) {
          subscribeBadgeSource(action.id, action.badgeSource);
        }
        PubSub.emit('funky:quick-nav:action:added', { id: action.id, action: action });
      }
      return this;
    },

    /**
     * Remove an action
     * @param {string} actionId - Action ID to remove
     * @returns {Object} QuickNav for chaining
     */
    removeAction: function(actionId) {
      if (ActionRegistry.remove(actionId)) {
        renderAllItems();
        PubSub.emit('funky:quick-nav:action:removed', { id: actionId });
      }
      return this;
    },

    /**
     * Update an existing action
     * @param {string} actionId - Action ID to update
     * @param {Object} updates - Properties to update
     * @returns {Object} QuickNav for chaining
     */
    updateAction: function(actionId, updates) {
      if (ActionRegistry.update(actionId, updates)) {
        renderAllItems();
        PubSub.emit('funky:quick-nav:action:updated', { id: actionId, updates: updates });
      }
      return this;
    },

    /**
     * Get an action by ID
     * @param {string} actionId - Action ID
     * @returns {Object|null} Action or null if not found
     */
    getAction: function(actionId) {
      return ActionRegistry.get(actionId);
    },

    /**
     * Get all actions
     * @returns {Array} All actions sorted by order
     */
    getActions: function() {
      return ActionRegistry.getSorted();
    },

    /**
     * Hide an action (without removing)
     * @param {string} actionId - Action ID
     * @returns {Object} QuickNav for chaining
     */
    hideAction: function(actionId) {
      ActionRegistry.hide(actionId);
      renderAllItems();
      return this;
    },

    /**
     * Show a hidden action
     * @param {string} actionId - Action ID
     * @returns {Object} QuickNav for chaining
     */
    showAction: function(actionId) {
      ActionRegistry.show(actionId);
      renderAllItems();
      return this;
    },

    /**
     * Update action badge
     * @param {string} actionId - Action ID
     * @param {number|string|Object} options - Badge value or options {value, type, animate}
     * @returns {Object} QuickNav for chaining
     */
    setBadge: function(actionId, options) {
      setBadgeOnAction(actionId, options);
      return this;
    },

    /**
     * Clear action badge
     * @param {string} actionId - Action ID
     * @returns {Object} QuickNav for chaining
     */
    clearBadge: function(actionId) {
      clearBadgeOnAction(actionId);
      return this;
    },

    // Preferences (Phase 9)
    /**
     * Get current preferences
     * @returns {Object} Current preferences
     */
    getPreferences: function() {
      return preferencesBinding ? preferencesBinding.get() : {};
    },

    /**
     * Save current preferences
     * @returns {Object} QuickNav for chaining
     */
    savePreferences: function() {
      if (preferencesBinding) preferencesBinding.save();
      return this;
    },

    /**
     * Clear saved preferences
     * @returns {Object} QuickNav for chaining
     */
    clearPreferences: function() {
      if (preferencesBinding) preferencesBinding.clear();
      return this;
    },

    // State access (for other phases)
    _getState: function() { return state; },
    _getConfig: function() { return config; },
    _getActionRegistry: function() { return ActionRegistry; }
  };

  // Register with Funky
  Funky.register('QuickNav', QuickNav);

})(window);
