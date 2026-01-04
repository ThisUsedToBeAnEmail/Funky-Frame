/**
 * Funky Frame Tour - Cross-Page Interactive Tour
 *
 * Provides a unified tour experience across all funky-frame pages.
 * Continues seamlessly during SPA navigation.
 *
 * @requires Funky.Tour
 * @requires Funky.Morph
 * @requires Funky.Dom
 * @requires Funky.Storage
 */
(function(global) {
  'use strict';

  var Funky = global.Funky;
  var Tour = Funky && Funky.Tour;
  var D = Funky && Funky.Dom;
  var Storage = Funky && Funky.Storage;

  if (!Tour) {
    console.warn('[FunkyTour] Funky.Tour not available');
    return;
  }

  // =========================================================================
  // Configuration
  // =========================================================================

  var STORAGE_KEY = 'funky_frame_tour_state';
  var TOUR_SEEN_KEY = 'funky_frame_tour_seen';
  var currentTour = null;

  // =========================================================================
  // Page Detection and Order
  // =========================================================================

  var PAGE_ORDER = ['about', 'docs', 'playground', 'test-runner'];

  /**
   * Get current page ID from path
   */
  function getPageId() {
    var path = global.location.pathname;
    if (path === '/' || path.indexOf('/about') >= 0) return 'about';
    if (path.indexOf('/docs') >= 0) return 'docs';
    if (path.indexOf('/playground') >= 0) return 'playground';
    if (path.indexOf('/test-runner') >= 0) return 'test-runner';
    return 'about';
  }

  /**
   * Get the next page in the tour
   */
  function getNextPage(currentPage) {
    var idx = PAGE_ORDER.indexOf(currentPage);
    if (idx >= 0 && idx < PAGE_ORDER.length - 1) {
      return PAGE_ORDER[idx + 1];
    }
    return null;
  }

  /**
   * Get URL for a page
   */
  function getPageUrl(pageId) {
    var urls = {
      'about': '/about/',
      'docs': '/docs/',
      'playground': '/playground/',
      'test-runner': '/test-runner/'
    };
    return urls[pageId] || '/about/';
  }

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Save tour state for cross-page continuation
   */
  function saveTourState(continuing) {
    if (!Storage) return;
    Storage.set(STORAGE_KEY, {
      continuing: continuing,
      timestamp: Date.now()
    });
  }

  /**
   * Get saved tour state
   */
  function getTourState() {
    if (!Storage) return null;
    var state = Storage.get(STORAGE_KEY);
    // Expire after 5 minutes
    if (state && (Date.now() - state.timestamp) > 300000) {
      Storage.remove(STORAGE_KEY);
      return null;
    }
    return state;
  }

  /**
   * Clear tour state
   */
  function clearTourState() {
    if (Storage) Storage.remove(STORAGE_KEY);
  }

  /**
   * Check if user has ever seen the tour
   */
  function hasTourBeenSeen() {
    if (!Storage) return true;
    return !!Storage.get(TOUR_SEEN_KEY);
  }

  /**
   * Mark tour as seen
   */
  function markTourAsSeen() {
    if (Storage) {
      Storage.set(TOUR_SEEN_KEY, {
        seen: true,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Clean up the persisted overlay when tour is fully finished
   */
  function cleanupOverlay() {
    var overlay = D.one('.tour-overlay');
    if (overlay) {
      overlay.remove();
    }

    var style = document.getElementById('tour-spa-style-override');
    if (style) {
      style.parentNode.removeChild(style);
    }

    D.one('body').classRemove('tour-active');
  }

  // =========================================================================
  // Tour Steps by Page
  // =========================================================================

  var STEPS_BY_PAGE = {
    about: [
      {
        target: '.sidebar-logo',
        title: 'Welcome to Funky Frame!',
        content: 'This is your testing ground for the Funky JS framework. Click the logo anytime to return home.',
        position: 'right'
      },
      {
        target: '.nav-link[href="/about"], .nav-link[href="/about/"]',
        title: 'About Page',
        content: 'You are here! This page explains what Funky is all about.',
        position: 'right'
      },
      {
        target: '.about-toc',
        title: 'Quick Navigation',
        content: 'Jump to any section that interests you. Philosophy, architecture, testing — it\'s all here.',
        position: 'right',
        scrollTo: true,
        skipIf: function() {
          return !document.querySelector('.about-toc');
        }
      },
      {
        target: '#pspwa',
        title: 'What is a PSPWA?',
        content: 'Progressive Single Page Web Application — it\'s PWA meets SPA. The best of both worlds!',
        position: 'top',
        scrollTo: true,
        skipIf: function() {
          return !document.querySelector('#pspwa');
        }
      },
      {
        target: '#testing',
        title: 'Testing Framework',
        content: 'Vanilla JavaScript doesn\'t mean no tests. We\'ve got 12,000+ browser tests across all components.',
        position: 'top',
        scrollTo: true,
        skipIf: function() {
          return !document.querySelector('#testing');
        }
      },
      {
        target: '.nav-link[href="/docs"], .nav-link[href="/docs/"]',
        title: 'Up Next: Documentation',
        content: 'Let\'s explore the docs! Click Continue to head there.',
        position: 'right'
      }
    ],

    docs: [
      {
        target: '.nav-link[href="/docs"], .nav-link[href="/docs/"]',
        title: 'Documentation',
        content: 'Welcome to the docs! Everything you need to know about Funky lives here.',
        position: 'right'
      },
      {
        target: '#docsSidebar, .docs-sidebar, .funky-sidenav',
        title: 'Sidebar Navigation',
        content: 'Browse topics organised by category. Click any folder to expand it.',
        position: 'right'
      },
      {
        target: '.docs-content, #docsContent',
        title: 'Content Area',
        content: 'Documentation is rendered here. Use the table of contents to jump to sections.',
        position: 'left'
      },
      {
        target: '.nav-link[href="/playground"], .nav-link[href="/playground/"]',
        title: 'Up Next: Playground',
        content: 'Let\'s see components in action! Note: the next page may load slowly — we dynamically load 90+ uncompiled component files. In production, you\'d bundle these.',
        position: 'right'
      }
    ],

    playground: [
      {
        target: '.nav-link[href="/playground"], .nav-link[href="/playground/"]',
        title: 'Playground',
        content: 'Welcome to the component playground! This is where the magic happens.',
        position: 'right'
      },
      {
        target: '#componentSideNav, .playground-sidebar',
        title: 'Component Selector',
        content: 'Pick any component from here to load it into the canvas.',
        position: 'right'
      },
      {
        target: '.viewport-controls',
        title: 'Responsive Preview',
        content: 'Test how components look on mobile, tablet, or desktop. Responsive design made easy!',
        position: 'bottom',
        skipIf: function() {
          var el = document.querySelector('.viewport-controls');
          return !el || el.offsetParent === null || window.innerWidth < 768;
        }
      },
      {
        target: '#playgroundCanvas, .playground-canvas',
        title: 'Live Canvas',
        content: 'Your component renders here in an isolated iframe. Interact with it just like a real app!',
        position: 'left'
      },
      {
        target: '.playground-panel, .panel-tabs',
        title: 'Props, Events & Code',
        content: 'Configure props, watch events fire, and copy the usage code. All in real-time!',
        position: 'left'
      },
      {
        target: '.nav-link[href="/test-runner"], .nav-link[href="/test-runner/"]',
        title: 'Up Next: Test Runner',
        content: 'Time to run some tests! Note: the next page may load slowly — we dynamically load 330+ uncompiled test files. We do this so you can clearly see the assertions.',
        position: 'right'
      }
    ],

    'test-runner': [
      {
        target: '.nav-link[href="/test-runner"], .nav-link[href="/test-runner/"]',
        title: 'Test Runner',
        content: 'Welcome to the test runner! Execute the full test suite right in your browser.',
        position: 'right'
      },
      {
        target: '.test-runner-controls, #runAllBtn',
        title: 'Test Controls',
        content: 'Run all tests or just the failed ones. Stop a running suite anytime.',
        position: 'bottom'
      },
      {
        target: '#testFilter',
        title: 'Filter Tests',
        content: 'Search by name or use #new to find recently added tests.',
        position: 'bottom'
      },
      {
        target: '#suiteTree, .test-suite-tree',
        title: 'Test Suites',
        content: 'Browse and expand test categories. Click any test to run it individually.',
        position: 'right'
      },
      {
        target: '.test-runner-stats, #statsBar',
        title: 'Running a Demo Test',
        content: 'Let\'s run a quick demo test to show you how results appear...',
        position: 'bottom',
        beforeShow: function(step, options) {
          // Run the demo test
          var TestRunner = global.FunkyTestRunner || (global.Funky && global.Funky.TestRunner);
          if (TestRunner && TestRunner.sendToSandbox && TestRunner.testsLoaded && !TestRunner.isRunning) {
            console.log('[FunkyTour] Running demo test...');
            TestRunner.sendToSandbox('runTests', { filter: 'demo assertion details' });
          }
        }
      },
      {
        target: '#testResults, .test-results',
        title: 'Results Panel',
        content: 'Test results appear here with pass/fail status. Notice the badge showing assertion counts...',
        position: 'left',
        beforeShow: function(step, options) {
          // Wait for test to complete and results to render
          return new Promise(function(resolve) {
            var checkResults = function() {
              // Look for the assertion badge which indicates test completed with assertions
              var badge = document.querySelector('.test-assertion-badge');
              if (badge) {
                resolve();
              } else {
                // Also check for any test items as fallback
                var resultItems = document.querySelectorAll('.test-item');
                if (resultItems && resultItems.length > 0) {
                  // Wait a bit more for assertions to be added
                  setTimeout(resolve, 500);
                } else {
                  setTimeout(checkResults, 200);
                }
              }
            };
            setTimeout(checkResults, 500);
          });
        }
      },
      {
        target: '.test-assertion-badge',
        title: 'Assertion Badge',
        content: 'This badge shows how many assertions passed. Click Continue to see the details...',
        position: 'left',
        skipIf: function() {
          return !document.querySelector('.test-assertion-badge');
        }
      },
      {
        target: '.test-assertion-details',
        title: 'Assertion Details',
        content: 'Each assertion shows the matcher used, actual value, and expected value. Green means pass!',
        position: 'left',
        beforeShow: function() {
          // Click the badge to expand assertion details before showing this step
          var badge = document.querySelector('.test-assertion-badge:not(.expanded)');
          if (badge) {
            badge.click();
          }
          // Small delay to let the panel expand
          return new Promise(function(resolve) {
            setTimeout(resolve, 200);
          });
        },
        skipIf: function() {
          // Skip if no badge exists (means no test ran)
          return !document.querySelector('.test-assertion-badge');
        }
      },
      {
        target: '.sidebar, #sidebar',
        title: 'Tour Complete!',
        content: 'You\'ve seen it all! Press Shift+? or use the command palette to replay anytime.',
        position: 'right'
      }
    ]
  };

  // =========================================================================
  // Tour Creation and Lifecycle
  // =========================================================================

  /**
   * Create tour for current page
   */
  function createTourForPage() {
    var currentPage = getPageId();
    var steps = STEPS_BY_PAGE[currentPage] || STEPS_BY_PAGE.about;
    var nextPage = getNextPage(currentPage);
    var isLastPage = !nextPage;

    console.log('[FunkyTour] Creating tour for page:', currentPage, 'isLastPage:', isLastPage);

    // Destroy existing tour
    if (currentTour) {
      try {
        if (currentTour.isPaused && currentTour.isPaused()) {
          currentTour.destroy();
        } else {
          currentTour.destroy();
        }
      } catch (e) {
        // Ignore destroy errors
      }
    }

    // Remove old tour from registry
    Tour.reset('funky-frame-tour');

    // Create new tour for this page
    currentTour = Tour.create('funky-frame-tour', {
      autoStart: false,
      showOnce: false,
      showProgress: true,
      showSkip: true,
      animate: true,
      scrollBehavior: 'smooth',
      highlightPadding: 12,
      persistOverlay: true,

      // Backdrop configuration
      overlayEnabled: true,
      closeOnOverlay: false,  // Prevent accidental clicks from stopping tour

      // Morph integration for smooth spotlight transitions
      useMorph: true,
      spotlightMorph: true,
      morphEasing: 'easeOutCubic',

      steps: steps,

      // Custom labels for cross-page navigation
      labels: isLastPage ? {
        finish: 'Finish Tour'
      } : {
        next: 'Next',
        finish: 'Continue'
      },

      onEnd: function(tourInstance, result) {
        if (result && result.completed && nextPage) {
          // Tour completed on this page, navigate to next via SPA
          saveTourState(true);

          // Pause tour (keeps overlay visible) instead of destroying
          tourInstance.pause();

          var url = getPageUrl(nextPage);
          if (Funky && Funky.SPA && typeof Funky.SPA.navigate === 'function') {
            Funky.SPA.navigate(url);
          } else {
            global.location.href = url;
          }
        } else {
          // Tour skipped or finished on last page
          markTourAsSeen();
          clearTourState();
          cleanupOverlay();
        }
      },

      onSkip: function() {
        markTourAsSeen();
        clearTourState();
        cleanupOverlay();
      }
    });

    return currentTour;
  }

  // =========================================================================
  // Auto-start Logic
  // =========================================================================

  /**
   * Check if we should auto-start (continuing from another page)
   */
  function checkAutoStart() {
    var state = getTourState();
    console.log('[FunkyTour] checkAutoStart - state:', state);

    if (state && state.continuing) {
      // Continue the tour from another page
      clearTourState();

      // Helper to start tour after scrolling to top
      function startTourAfterScroll() {
        // Scroll to top of page before starting tour
        global.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Also scroll main content area if it exists
        var mainContent = document.querySelector('.main-content, #spaContent');
        if (mainContent) {
          mainContent.scrollTop = 0;
        }

        if (currentTour) {
          console.log('[FunkyTour] Starting tour on new page');
          currentTour.start();
        }
      }

      // Check if we're on test-runner page - need to wait for tests to load
      var currentPage = getPageId();
      if (currentPage === 'test-runner') {
        console.log('[FunkyTour] On test-runner page, waiting for tests to load...');

        // Wait for test runner to finish loading tests
        var maxWaitTime = 30000; // 30 seconds max
        var startWait = Date.now();
        var checkInterval = 100;

        function waitForTestRunner() {
          var TestRunner = global.FunkyTestRunner || (global.Funky && global.Funky.TestRunner);

          // Check if tests are loaded
          if (TestRunner && TestRunner.testsLoaded) {
            console.log('[FunkyTour] Tests loaded, starting tour');
            requestAnimationFrame(function() {
              setTimeout(startTourAfterScroll, 150);
            });
            return;
          }

          // Timeout check
          if (Date.now() - startWait > maxWaitTime) {
            console.warn('[FunkyTour] Timeout waiting for tests to load, starting tour anyway');
            requestAnimationFrame(function() {
              setTimeout(startTourAfterScroll, 150);
            });
            return;
          }

          // Keep checking
          setTimeout(waitForTestRunner, checkInterval);
        }

        // Start checking after initial delay for page to render
        setTimeout(waitForTestRunner, 200);
      } else {
        // Other pages - start tour with normal delay
        requestAnimationFrame(function() {
          setTimeout(startTourAfterScroll, 150);
        });
      }

      return true;
    }
    return false;
  }

  /**
   * Check and redirect first-time visitors
   */
  function checkFirstTimeVisitor() {
    if (hasTourBeenSeen()) {
      return false;
    }

    var currentPage = getPageId();

    // If not on /about, redirect there first
    if (currentPage !== 'about') {
      saveTourState(true);

      var url = getPageUrl('about');
      if (Funky && Funky.SPA && typeof Funky.SPA.navigate === 'function') {
        Funky.SPA.navigate(url);
      } else {
        global.location.href = url;
      }
      return true;
    }

    // On /about and first time - auto-start the tour after a brief delay
    requestAnimationFrame(function() {
      setTimeout(function() {
        if (currentTour) {
          currentTour.start();
        }
      }, 500);
    });

    return true;
  }

  // =========================================================================
  // Initialize
  // =========================================================================

  function initForPage() {
    console.log('[FunkyTour] initForPage - page:', getPageId());
    createTourForPage();
    checkAutoStart();
  }

  function setupSPAListener() {
    document.addEventListener('spa:pageload', function() {
      requestAnimationFrame(function() {
        initForPage();
      });
    });

    document.addEventListener('funky.spa.pageload', function() {
      requestAnimationFrame(function() {
        initForPage();
      });
    });
  }

  function init() {
    initForPage();
    setupSPAListener();
    checkFirstTimeVisitor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // =========================================================================
  // Public API
  // =========================================================================

  global.FunkyTour = {
    /**
     * Start the tour from the current page
     */
    start: function() {
      clearTourState();
      if (currentTour) {
        Tour.reset('funky-frame-tour');
        currentTour = createTourForPage();
        currentTour.start();
      }
    },

    /**
     * Start tour from the beginning (About page)
     */
    startFromBeginning: function() {
      clearTourState();
      var currentPage = getPageId();

      if (currentPage !== 'about') {
        saveTourState(true);
        var url = getPageUrl('about');
        if (Funky && Funky.SPA && typeof Funky.SPA.navigate === 'function') {
          Funky.SPA.navigate(url);
        } else {
          global.location.href = url;
        }
      } else {
        if (currentTour) {
          Tour.reset('funky-frame-tour');
          currentTour = createTourForPage();
          currentTour.start();
        }
      }
    },

    /**
     * Get the current tour instance
     */
    getTour: function() {
      return currentTour;
    },

    /**
     * Get current page ID
     */
    getCurrentPage: getPageId,

    /**
     * Check if tour has been seen
     */
    hasBeenSeen: hasTourBeenSeen,

    /**
     * Reset the seen flag (for debugging)
     */
    resetSeen: function() {
      if (Storage) Storage.remove(TOUR_SEEN_KEY);
      console.log('[FunkyTour] Tour seen flag reset. Refresh to see first-time experience.');
    },

    /**
     * Clear tour state
     */
    clearState: clearTourState,

    /**
     * Reinitialize for current page
     */
    reinit: initForPage
  };

  // Register with Funky namespace if available
  if (Funky && Funky.register) {
    Funky.register('FrameTour', global.FunkyTour);
  }

})(window);
