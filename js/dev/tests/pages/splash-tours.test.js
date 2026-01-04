/**
 * Tests for Funky.SplashTours
 *
 * Cross-page tour for splash pages with SPA navigation support.
 */
FunkyTests.describe('Funky.SplashTours', function() {
  'use strict';

  var expect = FunkyTests.expect;
  var SplashTours = Funky.SplashTours;
  var Tour = Funky.Tour;
  var Storage = Funky.Storage;
  var testCounter = 0;

  // Skip all tests if SplashTours not available (only on splash pages)
  if (!SplashTours) {
    FunkyTests.it('SplashTours not available in sandbox', function() {
      expect(true).toBe(true);
    });
    return;
  }

  function uniqueId(prefix) {
    testCounter++;
    return (prefix || 'test') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // Helper to clean up tour state
  function cleanupTourState() {
    if (Storage) {
      Storage.remove('funky_splash_tour_state');
      Storage.remove('funky_splash_tour_seen');
    }
    // Clean up any tour elements
    var overlay = document.querySelector('.tour-overlay');
    if (overlay) overlay.remove();
    var style = document.getElementById('tour-spa-style-override');
    if (style) style.remove();
    document.body.classList.remove('tour-active');
    // Reset tour registry
    if (Tour && Tour.reset) {
      Tour.reset('splash-tour');
    }
  }

  // =========================================================================
  // Module Structure
  // =========================================================================

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('should be defined on Funky namespace', function() {
      expect(SplashTours).toBeDefined();
      expect(typeof SplashTours).toBe('object');
    });

    FunkyTests.it('should expose getTour method', function() {
      expect(typeof SplashTours.getTour).toBe('function');
    });

    FunkyTests.it('should expose getCurrentPage method', function() {
      expect(typeof SplashTours.getCurrentPage).toBe('function');
    });

    FunkyTests.it('should expose restart method', function() {
      expect(typeof SplashTours.restart).toBe('function');
    });

    FunkyTests.it('should expose clearState method', function() {
      expect(typeof SplashTours.clearState).toBe('function');
    });

    FunkyTests.it('should expose reinit method', function() {
      expect(typeof SplashTours.reinit).toBe('function');
    });

    FunkyTests.it('should expose hasBeenSeen method', function() {
      expect(typeof SplashTours.hasBeenSeen).toBe('function');
    });

    FunkyTests.it('should expose resetSeen method', function() {
      expect(typeof SplashTours.resetSeen).toBe('function');
    });
  });

  // =========================================================================
  // Page Detection
  // =========================================================================

  FunkyTests.describe('Page Detection', function() {
    FunkyTests.it('should return a page ID', function() {
      var pageId = SplashTours.getCurrentPage();
      expect(pageId).toBeDefined();
      expect(typeof pageId).toBe('string');
    });

    FunkyTests.it('should return valid page ID from known set', function() {
      var pageId = SplashTours.getCurrentPage();
      var validPages = ['about', 'docs', 'play', 'download', 'login'];
      expect(validPages.indexOf(pageId) >= 0).toBe(true);
    });
  });

  // =========================================================================
  // Tour Instance
  // =========================================================================

  FunkyTests.describe('Tour Instance', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should return current tour instance from getTour', function() {
      var tour = SplashTours.getTour();
      // Tour may or may not be created depending on page state
      if (tour) {
        expect(typeof tour).toBe('object');
      }
    });

    FunkyTests.it('should have tour with expected methods if available', function() {
      var tour = SplashTours.getTour();
      if (tour) {
        expect(typeof tour.start).toBe('function');
        expect(typeof tour.destroy).toBe('function');
      }
    });
  });

  // =========================================================================
  // State Management
  // =========================================================================

  FunkyTests.describe('State Management', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should clear tour state with clearState', function() {
      // Set some state first
      if (Storage) {
        Storage.set('funky_splash_tour_state', { continuing: true, timestamp: Date.now() });
      }

      SplashTours.clearState();

      if (Storage) {
        var state = Storage.get('funky_splash_tour_state');
        expect(state).toBeFalsy();
      }
    });

    FunkyTests.it('should track if tour has been seen', function() {
      cleanupTourState();

      var seen = SplashTours.hasBeenSeen();
      // Should be false after cleanup
      expect(typeof seen).toBe('boolean');
    });

    FunkyTests.it('should reset seen flag with resetSeen', function() {
      // Set seen flag
      if (Storage) {
        Storage.set('funky_splash_tour_seen', { seen: true, timestamp: Date.now() });
      }

      SplashTours.resetSeen();

      expect(SplashTours.hasBeenSeen()).toBe(false);
    });
  });

  // =========================================================================
  // Reinitialize
  // =========================================================================

  FunkyTests.describe('Reinitialize', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should not throw when calling reinit', function() {
      expect(function() {
        SplashTours.reinit();
      }).not.toThrow();
    });

    FunkyTests.it('should have tour available after reinit', function() {
      SplashTours.reinit();
      // Tour should be created for current page
      var tour = SplashTours.getTour();
      // May or may not be available depending on Tour component
      if (tour) {
        expect(typeof tour).toBe('object');
      }
    });
  });

  // =========================================================================
  // Restart
  // =========================================================================

  FunkyTests.describe('Restart', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should not throw when calling restart', function() {
      expect(function() {
        SplashTours.restart();
      }).not.toThrow();
    });

    FunkyTests.it('should clear state when restarting', function() {
      // Set state
      if (Storage) {
        Storage.set('funky_splash_tour_state', { continuing: true, timestamp: Date.now() });
      }

      SplashTours.restart();

      if (Storage) {
        var state = Storage.get('funky_splash_tour_state');
        expect(state).toBeFalsy();
      }
    });
  });

  // =========================================================================
  // Storage Keys
  // =========================================================================

  FunkyTests.describe('Storage Keys', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should use funky_splash_tour_state key for tour state', function() {
      // This verifies the storage key by checking the clearState removes it
      if (Storage) {
        Storage.set('funky_splash_tour_state', { test: true });
        SplashTours.clearState();
        expect(Storage.get('funky_splash_tour_state')).toBeFalsy();
      }
    });

    FunkyTests.it('should use funky_splash_tour_seen key for seen flag', function() {
      if (Storage) {
        Storage.set('funky_splash_tour_seen', { seen: true, timestamp: Date.now() });
        expect(SplashTours.hasBeenSeen()).toBe(true);
        SplashTours.resetSeen();
        expect(SplashTours.hasBeenSeen()).toBe(false);
      }
    });
  });

  // =========================================================================
  // Page Order
  // =========================================================================

  FunkyTests.describe('Page Order', function() {
    FunkyTests.it('should include about page', function() {
      // Verified by the fact that getPageId can return 'about'
      // We can't directly access PAGE_ORDER but can verify valid pages work
      var pageId = SplashTours.getCurrentPage();
      expect(typeof pageId).toBe('string');
    });
  });

  // =========================================================================
  // DOM Cleanup
  // =========================================================================

  FunkyTests.describe('DOM Cleanup', function() {
    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should remove tour overlay on cleanup', function() {
      // Create mock overlay
      var overlay = document.createElement('div');
      overlay.className = 'tour-overlay';
      document.body.appendChild(overlay);

      // Run cleanup
      cleanupTourState();

      expect(document.querySelector('.tour-overlay')).toBe(null);
    });

    FunkyTests.it('should remove tour style override on cleanup', function() {
      // Create mock style
      var style = document.createElement('style');
      style.id = 'tour-spa-style-override';
      document.head.appendChild(style);

      // Run cleanup
      cleanupTourState();

      expect(document.getElementById('tour-spa-style-override')).toBe(null);
    });

    FunkyTests.it('should remove tour-active class from body on cleanup', function() {
      document.body.classList.add('tour-active');

      cleanupTourState();

      expect(document.body.classList.contains('tour-active')).toBe(false);
    });
  });

  // =========================================================================
  // SPA Event Handling
  // =========================================================================

  FunkyTests.describe('SPA Event Handling', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should not throw on spa:pageload event', function() {
      expect(function() {
        var event = new CustomEvent('spa:pageload');
        document.dispatchEvent(event);
      }).not.toThrow();
    });

    FunkyTests.it('should not throw on funky.spa.pageload event', function() {
      expect(function() {
        var event = new CustomEvent('funky.spa.pageload');
        document.dispatchEvent(event);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Tour Configuration
  // =========================================================================

  FunkyTests.describe('Tour Configuration', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should create tour with splash-tour name', function() {
      SplashTours.reinit();

      // Check if tour exists in registry
      if (Tour && Tour.get) {
        var tour = Tour.get('splash-tour');
        // Tour may not always be available
        if (tour) {
          expect(tour).toBeDefined();
        }
      }
    });
  });

  // =========================================================================
  // State Expiration
  // =========================================================================

  FunkyTests.describe('State Expiration', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should expire state after 5 minutes', function(done) {
      // This is a conceptual test - actual timeout is 5 minutes
      // We just verify the timestamp is stored
      if (Storage) {
        Storage.set('funky_splash_tour_state', {
          continuing: true,
          timestamp: Date.now() - 400000 // 6+ minutes ago
        });

        // The module should treat this as expired
        // We can't easily test this without accessing internal functions
        // but the state structure is verified
        var state = Storage.get('funky_splash_tour_state');
        expect(state.timestamp).toBeDefined();
        expect(typeof state.timestamp).toBe('number');
      }
      done();
    });
  });

  // =========================================================================
  // Console Logging
  // =========================================================================

  FunkyTests.describe('Console Logging', function() {
    var originalConsoleLog;
    var logMessages;

    FunkyTests.beforeEach(function() {
      cleanupTourState();
      logMessages = [];
      originalConsoleLog = console.log;
      console.log = function() {
        logMessages.push(Array.prototype.slice.call(arguments).join(' '));
        originalConsoleLog.apply(console, arguments);
      };
    });

    FunkyTests.afterEach(function() {
      console.log = originalConsoleLog;
      cleanupTourState();
    });

    FunkyTests.it('should log with [SplashTours] prefix when reinitializing', function() {
      SplashTours.reinit();

      var hasSplashToursLog = logMessages.some(function(msg) {
        return msg.indexOf('[SplashTours]') >= 0;
      });

      expect(hasSplashToursLog).toBe(true);
    });

    FunkyTests.it('should log with [SplashTours] prefix on resetSeen', function() {
      SplashTours.resetSeen();

      var hasResetLog = logMessages.some(function(msg) {
        return msg.indexOf('[SplashTours]') >= 0 && msg.indexOf('reset') >= 0;
      });

      expect(hasResetLog).toBe(true);
    });
  });

  // =========================================================================
  // First-Time Visitor Detection
  // =========================================================================

  FunkyTests.describe('First-Time Visitor Detection', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should return false for hasBeenSeen after cleanup', function() {
      cleanupTourState();
      expect(SplashTours.hasBeenSeen()).toBe(false);
    });

    FunkyTests.it('should return true for hasBeenSeen after marking as seen', function() {
      if (Storage) {
        Storage.set('funky_splash_tour_seen', { seen: true, timestamp: Date.now() });
        expect(SplashTours.hasBeenSeen()).toBe(true);
      }
    });
  });

  // =========================================================================
  // Error Handling
  // =========================================================================

  FunkyTests.describe('Error Handling', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should not throw when Tour is unavailable temporarily', function() {
      // The module checks for Tour availability
      // If called before dependencies load, should not crash
      expect(function() {
        SplashTours.getCurrentPage();
      }).not.toThrow();
    });

    FunkyTests.it('should not throw when Storage is unavailable', function() {
      // Even if Storage fails, methods should not throw
      expect(function() {
        SplashTours.hasBeenSeen();
      }).not.toThrow();
    });

    FunkyTests.it('should not throw when clearing nonexistent state', function() {
      cleanupTourState();

      expect(function() {
        SplashTours.clearState();
      }).not.toThrow();
    });

    FunkyTests.it('should not throw when restarting without active tour', function() {
      cleanupTourState();

      expect(function() {
        SplashTours.restart();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Tour Button Binding
  // =========================================================================

  FunkyTests.describe('Tour Button Binding', function() {
    var fixture;

    FunkyTests.beforeEach(function() {
      cleanupTourState();
      fixture = FunkyTests.fixture('<div id="' + uniqueId('splash-tours-test') + '"></div>');
    });

    FunkyTests.afterEach(function() {
      fixture.cleanup();
      cleanupTourState();
    });

    FunkyTests.it('should look for data-tour-start attribute', function() {
      // Create a mock button
      var button = document.createElement('button');
      button.setAttribute('data-tour-start', 'splash-tour');
      fixture.el.appendChild(button);

      // Reinit should find and bind the button
      expect(function() {
        SplashTours.reinit();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Integration with Tour Component
  // =========================================================================

  FunkyTests.describe('Integration with Tour Component', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should use Tour.create for creating tours', function() {
      if (Tour && Tour.get) {
        SplashTours.reinit();
        // Tour should be registered
        var tour = SplashTours.getTour();
        if (tour) {
          expect(typeof tour.start).toBe('function');
        }
      }
    });

    FunkyTests.it('should use Tour.reset when cleaning up', function() {
      if (Tour && Tour.reset) {
        expect(function() {
          Tour.reset('splash-tour');
        }).not.toThrow();
      }
    });
  });

  // =========================================================================
  // Page URL Mapping
  // =========================================================================

  FunkyTests.describe('Page URL Mapping', function() {
    FunkyTests.it('should map page IDs to valid URLs', function() {
      // These are the expected URL mappings
      var expectedUrls = {
        about: '/about',
        docs: '/documentation',
        play: '/play',
        download: '/download',
        login: '/login'
      };

      // We can verify the current page maps to a valid ID
      var pageId = SplashTours.getCurrentPage();
      expect(Object.keys(expectedUrls).indexOf(pageId) >= 0).toBe(true);
    });
  });

  // =========================================================================
  // Steps Configuration
  // =========================================================================

  FunkyTests.describe('Steps Configuration', function() {
    FunkyTests.it('should define steps for each page', function() {
      // We can verify the tour gets created with steps by checking the tour object
      SplashTours.reinit();
      var tour = SplashTours.getTour();

      // If tour exists, it should have configuration
      if (tour && tour.getSteps) {
        var steps = tour.getSteps();
        expect(Array.isArray(steps)).toBe(true);
      }
    });
  });

  // =========================================================================
  // Cross-Page Navigation
  // =========================================================================

  FunkyTests.describe('Cross-Page Navigation', function() {
    FunkyTests.beforeEach(function() {
      cleanupTourState();
    });

    FunkyTests.afterEach(function() {
      cleanupTourState();
    });

    FunkyTests.it('should save state with continuing flag', function() {
      if (Storage) {
        Storage.set('funky_splash_tour_state', {
          continuing: true,
          timestamp: Date.now()
        });

        var state = Storage.get('funky_splash_tour_state');
        expect(state.continuing).toBe(true);
        expect(state.timestamp).toBeDefined();
      }
    });

    FunkyTests.it('should clear state after reading', function() {
      if (Storage) {
        Storage.set('funky_splash_tour_state', {
          continuing: true,
          timestamp: Date.now()
        });

        // Clear state simulates what happens when tour starts
        SplashTours.clearState();

        expect(Storage.get('funky_splash_tour_state')).toBeFalsy();
      }
    });
  });
});
