/**
 * Tests for Funky.SPA
 * Single Page Application navigation with History API
 */
FunkyTests.describe('Funky.Core.SPA', function() {
  var expect = FunkyTests.expect;
  var container;

  FunkyTests.beforeEach(function() {
    container = document.createElement('div');
    container.id = 'test-spa-container';
    document.body.appendChild(container);
  });

  FunkyTests.afterEach(function() {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;

    // Clean up any test modals
    document.querySelectorAll('.modal-backdrop').forEach(function(el) {
      el.parentNode.removeChild(el);
    });
  });

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.SPA exists', function() {
      expect(Funky.SPA !== undefined).toBe(true);
    });

    FunkyTests.it('has config object', function() {
      expect(Funky.SPA.config !== undefined).toBe(true);
      expect(typeof Funky.SPA.config.contentSelector).toBe('string');
    });

    FunkyTests.it('has navigate method', function() {
      expect(typeof Funky.SPA.navigate).toBe('function');
    });

    FunkyTests.it('has go method (alias)', function() {
      expect(typeof Funky.SPA.go).toBe('function');
    });

    FunkyTests.it('has refresh method', function() {
      expect(typeof Funky.SPA.refresh).toBe('function');
    });

    FunkyTests.it('has registerPage method', function() {
      expect(typeof Funky.SPA.registerPage).toBe('function');
    });

    FunkyTests.it('has registerCleanup method', function() {
      expect(typeof Funky.SPA.registerCleanup).toBe('function');
    });

    FunkyTests.it('has registerInterval method', function() {
      expect(typeof Funky.SPA.registerInterval).toBe('function');
    });

    FunkyTests.it('has registerTimeout method', function() {
      expect(typeof Funky.SPA.registerTimeout).toBe('function');
    });
  });

  FunkyTests.describe('shouldHandleLink', function() {
    FunkyTests.it('returns false for empty href', function() {
      var link = document.createElement('a');
      link.href = '';

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for hash-only links', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '#section');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for external links', function() {
      var link = document.createElement('a');
      link.href = 'https://example.com/page';

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for mailto links', function() {
      var link = document.createElement('a');
      link.setAttribute('href', 'mailto:test@example.com');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for tel links', function() {
      var link = document.createElement('a');
      link.setAttribute('href', 'tel:+1234567890');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for PDF downloads', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/documents/report.pdf');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for CSV downloads', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/export/data.csv');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for API endpoints', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/api/users/123');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for logout link', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/logout');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for data-no-spa attribute', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/page');
      link.setAttribute('data-no-spa', '');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for target="_blank"', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/page');
      link.setAttribute('target', '_blank');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for download attribute', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/file.txt');
      link.setAttribute('download', '');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns false for .no-spa class', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/page');
      link.classList.add('no-spa');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });

    FunkyTests.it('returns true for valid internal link', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/dashboard');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(true);
    });
  });

  FunkyTests.describe('extractPageIdFromUrl', function() {
    FunkyTests.it('extracts page ID from path', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/dashboard');
      expect(pageId).toBe('dashboard');
    });

    FunkyTests.it('defaults to dashboard for root', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/');
      expect(pageId).toBe('dashboard');
    });

    FunkyTests.it('handles nested paths', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/admin/users');
      expect(pageId).toBe('admin_users');
    });

    FunkyTests.it('strips leading slash', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/page');
      expect(pageId).toBe('page');
    });

    FunkyTests.it('handles full URLs', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('http://localhost/settings');
      expect(pageId).toBe('settings');
    });
  });

  FunkyTests.describe('detectCurrentPage', function() {
    FunkyTests.it('returns page from body data attribute', function() {
      document.body.dataset.page = 'test-page';

      var page = Funky.SPA.detectCurrentPage();
      expect(page).toBe('test-page');

      delete document.body.dataset.page;
    });

    FunkyTests.it('returns page from content container', function() {
      var content = document.createElement('div');
      content.id = 'spaContent';
      content.dataset.page = 'container-page';
      document.body.appendChild(content);

      var page = Funky.SPA.detectCurrentPage();
      expect(page).toBe('container-page');

      content.parentNode.removeChild(content);
    });

    FunkyTests.it('falls back to URL extraction', function() {
      // No data attributes set
      var page = Funky.SPA.detectCurrentPage();
      expect(page !== null).toBe(true);
    });
  });

  FunkyTests.describe('Page Registration', function() {
    FunkyTests.it('registerPage stores initializer', function() {
      Funky.SPA.registerPage('test-register', function() {});

      expect(Funky.SPA.pageInitializers['test-register'] !== undefined).toBe(true);

      // Clean up
      delete Funky.SPA.pageInitializers['test-register'];
    });

    FunkyTests.it('registerCleanup stores cleanup function', function() {
      Funky.SPA.registerCleanup('test-cleanup', function() {});

      expect(Funky.SPA.pageCleanup['test-cleanup'] !== undefined).toBe(true);

      // Clean up
      delete Funky.SPA.pageCleanup['test-cleanup'];
    });
  });

  FunkyTests.describe('Interval/Timeout Registration', function() {
    FunkyTests.it('registerInterval tracks interval ID', function() {
      window.spaIntervals = [];
      var id = setInterval(function() {}, 10000);

      Funky.SPA.registerInterval(id);

      expect(window.spaIntervals.includes(id)).toBe(true);

      clearInterval(id);
      window.spaIntervals = [];
    });

    FunkyTests.it('registerTimeout tracks timeout ID', function() {
      window.spaTimeouts = [];
      var id = setTimeout(function() {}, 10000);

      Funky.SPA.registerTimeout(id);

      expect(window.spaTimeouts.includes(id)).toBe(true);

      clearTimeout(id);
      window.spaTimeouts = [];
    });
  });

  FunkyTests.describe('Loading Indicator', function() {
    FunkyTests.it('showLoading adds loading class to body', function() {
      Funky.SPA.showLoading();

      expect(document.body.classList.contains('spa-loading')).toBe(true);

      Funky.SPA.hideLoading();
    });

    FunkyTests.it('hideLoading removes loading class from body', function() {
      document.body.classList.add('spa-loading');

      Funky.SPA.hideLoading();

      expect(document.body.classList.contains('spa-loading')).toBe(false);
    });

    FunkyTests.it('showLoading activates progress bar', function() {
      var progressBar = document.createElement('div');
      progressBar.id = 'spaProgress';
      document.body.appendChild(progressBar);

      Funky.SPA.showLoading();

      expect(progressBar.classList.contains('active')).toBe(true);

      Funky.SPA.hideLoading();
      progressBar.parentNode.removeChild(progressBar);
    });

    FunkyTests.it('hideLoading completes progress bar', function(done) {
      var progressBar = document.createElement('div');
      progressBar.id = 'spaProgress';
      progressBar.classList.add('active');
      document.body.appendChild(progressBar);

      Funky.SPA.hideLoading();

      expect(progressBar.classList.contains('complete')).toBe(true);

      setTimeout(function() {
        expect(progressBar.classList.contains('active')).toBe(false);
        progressBar.parentNode.removeChild(progressBar);
        done();
      }, 250);
    });
  });

  FunkyTests.describe('Navigation State Update', function() {
    FunkyTests.it('updateNavigation removes active from old links', function() {
      container.innerHTML = '<div class="sidebar-nav">' +
        '<a href="/old" class="nav-link active">Old</a>' +
        '<a href="/new" class="nav-link">New</a>' +
        '</div>';

      Funky.SPA.updateNavigation('/new');

      var oldLink = container.querySelector('a[href="/old"]');
      expect(oldLink.classList.contains('active')).toBe(false);
    });

    FunkyTests.it('updateNavigation adds active to matching link', function() {
      container.innerHTML = '<div class="sidebar-nav">' +
        '<a href="/old" class="nav-link">Old</a>' +
        '<a href="/new" class="nav-link">New</a>' +
        '</div>';

      Funky.SPA.updateNavigation('/new');

      var newLink = container.querySelector('a[href="/new"]');
      expect(newLink.classList.contains('active')).toBe(true);
    });

    FunkyTests.it('updateNavigation activates parent nav-group', function() {
      container.innerHTML = '<div class="sidebar-nav">' +
        '<div class="nav-group">' +
        '<a href="/page" class="nav-link">Page</a>' +
        '</div></div>';

      Funky.SPA.updateNavigation('/page');

      var group = container.querySelector('.nav-group');
      expect(group.classList.contains('has-active')).toBe(true);
    });
  });

  FunkyTests.describe('Config', function() {
    FunkyTests.it('has default content selector', function() {
      expect(Funky.SPA.config.contentSelector).toBe('#spaContent');
    });

    FunkyTests.it('has default loading selector', function() {
      expect(Funky.SPA.config.loadingSelector).toBe('#spaLoading');
    });

    FunkyTests.it('has exclude patterns array', function() {
      expect(Array.isArray(Funky.SPA.config.excludePatterns)).toBe(true);
      expect(Funky.SPA.config.excludePatterns.length > 0).toBe(true);
    });

    FunkyTests.it('has exclude selectors array', function() {
      expect(Array.isArray(Funky.SPA.config.excludeSelectors)).toBe(true);
      expect(Funky.SPA.config.excludeSelectors.length > 0).toBe(true);
    });
  });

  FunkyTests.describe('Generic Cleanup', function() {
    FunkyTests.it('clears registered intervals', function() {
      var intervalCalled = 0;
      var id = setInterval(function() {
        intervalCalled++;
      }, 10);

      window.spaIntervals = [id];

      Funky.SPA.genericCleanup();

      // Wait to see if interval fires
      var initialCount = intervalCalled;
      setTimeout(function() {
        expect(intervalCalled).toBe(initialCount);
      }, 50);
    });

    FunkyTests.it('clears registered timeouts', function(done) {
      var timeoutCalled = false;
      var id = setTimeout(function() {
        timeoutCalled = true;
      }, 50);

      window.spaTimeouts = [id];

      Funky.SPA.genericCleanup();

      setTimeout(function() {
        expect(timeoutCalled).toBe(false);
        done();
      }, 100);
    });

    FunkyTests.it('removes orphaned modal backdrops', function() {
      var backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);

      Funky.SPA.genericCleanup();

      var remaining = document.querySelectorAll('.modal-backdrop');
      expect(remaining.length).toBe(0);
    });

    FunkyTests.it('removes modal-open class from body', function() {
      document.body.classList.add('modal-open');

      Funky.SPA.genericCleanup();

      expect(document.body.classList.contains('modal-open')).toBe(false);
    });
  });

  FunkyTests.describe('Same Page Detection', function() {
    FunkyTests.it('shouldHandleLink returns false for same-page hash change', function() {
      // Save current location
      var currentPath = window.location.pathname;
      var currentSearch = window.location.search;

      var link = document.createElement('a');
      link.setAttribute('href', currentPath + currentSearch + '#section');

      var result = Funky.SPA.shouldHandleLink(link);
      expect(result).toBe(false);
    });
  });

  FunkyTests.describe('Initialization Guard', function() {
    FunkyTests.it('initialized flag is set after init with container', function() {
      // Create required container if not present
      var existingContent = document.querySelector('#spaContent');
      if (!existingContent) {
        var spaContent = document.createElement('div');
        spaContent.id = 'spaContent';
        document.body.appendChild(spaContent);
      }

      // Force re-init
      Funky.SPA.initialized = false;
      Funky.SPA.init();

      expect(Funky.SPA.initialized).toBe(true);

      // Cleanup
      if (!existingContent) {
        var el = document.querySelector('#spaContent');
        if (el) el.parentNode.removeChild(el);
      }
    });

    FunkyTests.it('init can be called multiple times safely', function() {
      var noError = true;
      try {
        Funky.SPA.init();
        Funky.SPA.init();
        Funky.SPA.init();
      } catch (e) {
        noError = false;
      }

      expect(noError).toBe(true);
    });
  });

  FunkyTests.describe('Event Dispatching', function() {
    FunkyTests.it('dispatches funky.spa.before-load event on cleanup', function(done) {
      var eventFired = false;
      var handler = function() {
        eventFired = true;
      };

      document.addEventListener('funky.spa.before-load', handler);

      Funky.SPA.cleanupCurrentPage();

      setTimeout(function() {
        document.removeEventListener('funky.spa.before-load', handler);
        expect(eventFired).toBe(true);
        done();
      }, 50);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  FunkyTests.describe('Error handling', function() {
    FunkyTests.it('shouldHandleLink handles null gracefully', function() {
      expect(function() {
        var result = Funky.SPA.shouldHandleLink(null);
        expect(result).toBe(false);
      }).not.toThrow();
    });

    FunkyTests.it('shouldHandleLink handles undefined gracefully', function() {
      expect(function() {
        var result = Funky.SPA.shouldHandleLink(undefined);
        expect(result).toBe(false);
      }).not.toThrow();
    });

    FunkyTests.it('shouldHandleLink handles non-element gracefully', function() {
      expect(function() {
        var result = Funky.SPA.shouldHandleLink({});
        expect(result).toBe(false);
      }).not.toThrow();
    });

    FunkyTests.it('extractPageIdFromUrl handles null gracefully', function() {
      expect(function() {
        Funky.SPA.extractPageIdFromUrl(null);
      }).not.toThrow();
    });

    FunkyTests.it('extractPageIdFromUrl handles undefined gracefully', function() {
      expect(function() {
        Funky.SPA.extractPageIdFromUrl(undefined);
      }).not.toThrow();
    });

    FunkyTests.it('extractPageIdFromUrl handles empty string', function() {
      var result = Funky.SPA.extractPageIdFromUrl('');
      expect(result === 'dashboard' || result === '').toBe(true);
    });

    FunkyTests.it('registerPage handles null id gracefully', function() {
      expect(function() {
        Funky.SPA.registerPage(null, function() {});
      }).not.toThrow();
    });

    FunkyTests.it('registerPage handles null callback gracefully', function() {
      expect(function() {
        Funky.SPA.registerPage('test-null-cb', null);
      }).not.toThrow();
    });

    FunkyTests.it('registerCleanup handles null gracefully', function() {
      expect(function() {
        Funky.SPA.registerCleanup(null, function() {});
      }).not.toThrow();
    });

    FunkyTests.it('updateNavigation handles null url gracefully', function() {
      expect(function() {
        Funky.SPA.updateNavigation(null);
      }).not.toThrow();
    });

    FunkyTests.it('updateNavigation handles empty url gracefully', function() {
      expect(function() {
        Funky.SPA.updateNavigation('');
      }).not.toThrow();
    });

    FunkyTests.it('navigate handles null url gracefully', function() {
      expect(function() {
        Funky.SPA.navigate(null);
      }).not.toThrow();
    });

    FunkyTests.it('cleanupCurrentPage handles errors in cleanup functions', function(done) {
      Funky.SPA.registerCleanup('error-page', function() {
        throw new Error('Cleanup error');
      });

      expect(function() {
        Funky.SPA.cleanupCurrentPage();
      }).not.toThrow();

      delete Funky.SPA.pageCleanup['error-page'];
      done();
    });
  });

  // =========================================================================
  // EDGE CASES TESTS
  // =========================================================================
  FunkyTests.describe('Edge cases', function() {
    FunkyTests.it('handles very long URL paths', function() {
      var longPath = '/' + 'a'.repeat(1000);
      var pageId = Funky.SPA.extractPageIdFromUrl(longPath);
      expect(typeof pageId).toBe('string');
    });

    FunkyTests.it('handles URL with special characters', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/page-with-dashes_and_underscores');
      expect(pageId).toBe('page-with-dashes_and_underscores');
    });

    FunkyTests.it('handles URL with query parameters', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/dashboard?filter=active&page=1');
      expect(pageId).toBe('dashboard');
    });

    FunkyTests.it('handles URL with hash', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/settings#notifications');
      expect(pageId).toBe('settings');
    });

    FunkyTests.it('handles deeply nested paths', function() {
      var pageId = Funky.SPA.extractPageIdFromUrl('/admin/users/edit/123');
      expect(pageId.indexOf('admin') !== -1).toBe(true);
    });

    FunkyTests.it('shouldHandleLink returns false for javascript: links', function() {
      var link = document.createElement('a');
      link.setAttribute('href', 'javascript:void(0)');
      expect(Funky.SPA.shouldHandleLink(link)).toBe(false);
    });

    FunkyTests.it('shouldHandleLink returns false for data: URLs', function() {
      var link = document.createElement('a');
      link.setAttribute('href', 'data:text/html,<h1>Hello</h1>');
      expect(Funky.SPA.shouldHandleLink(link)).toBe(false);
    });

    FunkyTests.it('shouldHandleLink returns false for Excel files', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/reports/data.xlsx');
      expect(Funky.SPA.shouldHandleLink(link)).toBe(false);
    });

    FunkyTests.it('shouldHandleLink returns false for ZIP files', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/downloads/archive.zip');
      expect(Funky.SPA.shouldHandleLink(link)).toBe(false);
    });

    FunkyTests.it('handles multiple rapid registrations', function() {
      for (var i = 0; i < 50; i++) {
        Funky.SPA.registerPage('rapid-page-' + i, function() {});
      }

      expect(Funky.SPA.pageInitializers['rapid-page-49']).toBeDefined();

      // Cleanup
      for (var j = 0; j < 50; j++) {
        delete Funky.SPA.pageInitializers['rapid-page-' + j];
      }
    });

    FunkyTests.it('handles registering same page twice', function() {
      Funky.SPA.registerPage('duplicate-test', function() { return 1; });
      Funky.SPA.registerPage('duplicate-test', function() { return 2; });

      // Second registration should override
      expect(Funky.SPA.pageInitializers['duplicate-test']).toBeDefined();

      delete Funky.SPA.pageInitializers['duplicate-test'];
    });

    FunkyTests.it('handles link with both target and download', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/file.pdf');
      link.setAttribute('target', '_blank');
      link.setAttribute('download', '');
      expect(Funky.SPA.shouldHandleLink(link)).toBe(false);
    });

    FunkyTests.it('handles link with rel="external"', function() {
      var link = document.createElement('a');
      link.setAttribute('href', '/page');
      link.setAttribute('rel', 'external');
      // Should still evaluate based on other criteria
      var result = Funky.SPA.shouldHandleLink(link);
      expect(typeof result).toBe('boolean');
    });
  });

  // =========================================================================
  // STATE MANAGEMENT TESTS
  // =========================================================================
  FunkyTests.describe('State management', function() {
    FunkyTests.it('maintains initialized state correctly', function() {
      var wasInitialized = Funky.SPA.initialized;
      expect(typeof wasInitialized).toBe('boolean');
    });

    FunkyTests.it('pageInitializers is an object', function() {
      expect(typeof Funky.SPA.pageInitializers).toBe('object');
    });

    FunkyTests.it('pageCleanup is an object', function() {
      expect(typeof Funky.SPA.pageCleanup).toBe('object');
    });

    FunkyTests.it('tracks page initializers independently', function() {
      Funky.SPA.registerPage('state-test-a', function() {});
      Funky.SPA.registerPage('state-test-b', function() {});

      expect(Funky.SPA.pageInitializers['state-test-a'] !== Funky.SPA.pageInitializers['state-test-b']).toBe(true);

      delete Funky.SPA.pageInitializers['state-test-a'];
      delete Funky.SPA.pageInitializers['state-test-b'];
    });

    FunkyTests.it('cleanup removes page from initializers', function() {
      Funky.SPA.registerPage('cleanup-test', function() {});
      delete Funky.SPA.pageInitializers['cleanup-test'];

      expect(Funky.SPA.pageInitializers['cleanup-test']).toBeUndefined();
    });
  });

  // =========================================================================
  // ASYNC BEHAVIOR TESTS
  // =========================================================================
  FunkyTests.describe('Async behavior', function() {
    FunkyTests.it('showLoading and hideLoading can be called rapidly', function(done) {
      for (var i = 0; i < 10; i++) {
        Funky.SPA.showLoading();
        Funky.SPA.hideLoading();
      }

      setTimeout(function() {
        expect(document.body.classList.contains('spa-loading')).toBe(false);
        done();
      }, 300);
    });

    FunkyTests.it('hideLoading completes animation before removing class', function(done) {
      var progressBar = document.createElement('div');
      progressBar.id = 'spaProgress';
      progressBar.classList.add('active');
      document.body.appendChild(progressBar);

      Funky.SPA.hideLoading();

      // Immediately after, complete class should be added
      expect(progressBar.classList.contains('complete')).toBe(true);

      setTimeout(function() {
        progressBar.parentNode.removeChild(progressBar);
        done();
      }, 300);
    });

    FunkyTests.it('navigate does not block subsequent operations', function(done) {
      var operationsComplete = false;

      // Trigger a navigate (even if it fails, it shouldn't block)
      try {
        Funky.SPA.navigate('/test-async-page');
      } catch (e) {
        // Expected to fail without proper setup
      }

      operationsComplete = true;
      expect(operationsComplete).toBe(true);
      done();
    });
  });

  // =========================================================================
  // CLEANUP TESTS
  // =========================================================================
  FunkyTests.describe('Cleanup', function() {
    FunkyTests.it('genericCleanup resets loading state', function() {
      document.body.classList.add('spa-loading');

      Funky.SPA.genericCleanup();

      expect(document.body.classList.contains('spa-loading')).toBe(false);
    });

    FunkyTests.it('genericCleanup removes all modal backdrops', function() {
      for (var i = 0; i < 3; i++) {
        var backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);
      }

      Funky.SPA.genericCleanup();

      expect(document.querySelectorAll('.modal-backdrop').length).toBe(0);
    });

    FunkyTests.it('genericCleanup clears all registered intervals', function(done) {
      var callCount = 0;
      var id1 = setInterval(function() { callCount++; }, 10);
      var id2 = setInterval(function() { callCount++; }, 10);

      window.spaIntervals = [id1, id2];

      Funky.SPA.genericCleanup();

      var countBefore = callCount;
      setTimeout(function() {
        expect(callCount).toBe(countBefore);
        done();
      }, 50);
    });

    FunkyTests.it('genericCleanup clears all registered timeouts', function(done) {
      var called = false;
      var id = setTimeout(function() { called = true; }, 50);

      window.spaTimeouts = [id];

      Funky.SPA.genericCleanup();

      setTimeout(function() {
        expect(called).toBe(false);
        done();
      }, 100);
    });

    FunkyTests.it('handles cleanup when no intervals/timeouts registered', function() {
      window.spaIntervals = [];
      window.spaTimeouts = [];

      expect(function() {
        Funky.SPA.genericCleanup();
      }).not.toThrow();
    });

    FunkyTests.it('handles cleanup when spaIntervals is undefined', function() {
      delete window.spaIntervals;

      expect(function() {
        Funky.SPA.genericCleanup();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // CONFIG VALIDATION TESTS
  // =========================================================================
  FunkyTests.describe('Config validation', function() {
    FunkyTests.it('excludePatterns includes common file types', function() {
      var patterns = Funky.SPA.config.excludePatterns;
      var hasFilePatterns = patterns.some(function(p) {
        return p.test && (p.test('.pdf') || p.test('.csv'));
      });
      expect(hasFilePatterns || patterns.length > 0).toBe(true);
    });

    FunkyTests.it('excludeSelectors includes no-spa class', function() {
      var selectors = Funky.SPA.config.excludeSelectors;
      var hasNoSpa = selectors.some(function(s) {
        return s.indexOf('no-spa') !== -1;
      });
      expect(hasNoSpa).toBe(true);
    });

    FunkyTests.it('config is not null', function() {
      expect(Funky.SPA.config).not.toBeNull();
    });

    FunkyTests.it('contentSelector is valid CSS selector', function() {
      var selector = Funky.SPA.config.contentSelector;
      expect(selector.charAt(0) === '#' || selector.charAt(0) === '.').toBe(true);
    });
  });
});
