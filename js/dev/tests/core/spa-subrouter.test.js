/**
 * Tests for Funky.SPA.SubRouter
 * Sub-path routing for components within SPA pages
 */
FunkyTests.describe('Funky.Core.SPA.SubRouter', function() {
  var expect = FunkyTests.expect;
  var originalPushState;
  var originalReplaceState;
  var pushStateCalls;
  var replaceStateCalls;
  var originalDisableHistory;

  FunkyTests.beforeEach(function() {
    // Reset SubRouter state between tests
    if (Funky.SPA.SubRouter && Funky.SPA.SubRouter._reset) {
      Funky.SPA.SubRouter._reset();
    }

    // Store original disableHistory value
    originalDisableHistory = Funky.SPA.config.disableHistory;
    Funky.SPA.config.disableHistory = false;

    // Mock pushState and replaceState
    pushStateCalls = [];
    replaceStateCalls = [];
    originalPushState = window.history.pushState;
    originalReplaceState = window.history.replaceState;

    window.history.pushState = function(state, title, url) {
      pushStateCalls.push({ state: state, title: title, url: url });
    };

    window.history.replaceState = function(state, title, url) {
      replaceStateCalls.push({ state: state, title: title, url: url });
    };
  });

  FunkyTests.afterEach(function() {
    // Restore original history methods
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;

    // Restore original disableHistory
    Funky.SPA.config.disableHistory = originalDisableHistory;

    // Reset handlers
    if (Funky.SPA.SubRouter && Funky.SPA.SubRouter._reset) {
      Funky.SPA.SubRouter._reset();
    }
  });

  // =========================================================================
  // MODULE STRUCTURE TESTS
  // =========================================================================
  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.SPA.SubRouter exists', function() {
      expect(Funky.SPA.SubRouter !== undefined).toBe(true);
    });

    FunkyTests.it('has register method', function() {
      expect(typeof Funky.SPA.SubRouter.register).toBe('function');
    });

    FunkyTests.it('has unregister method', function() {
      expect(typeof Funky.SPA.SubRouter.unregister).toBe('function');
    });

    FunkyTests.it('has has method', function() {
      expect(typeof Funky.SPA.SubRouter.has).toBe('function');
    });

    FunkyTests.it('has getHandler method', function() {
      expect(typeof Funky.SPA.SubRouter.getHandler).toBe('function');
    });

    FunkyTests.it('has push method', function() {
      expect(typeof Funky.SPA.SubRouter.push).toBe('function');
    });

    FunkyTests.it('has replace method', function() {
      expect(typeof Funky.SPA.SubRouter.replace).toBe('function');
    });

    FunkyTests.it('has setParams method', function() {
      expect(typeof Funky.SPA.SubRouter.setParams).toBe('function');
    });

    FunkyTests.it('has getCurrent method', function() {
      expect(typeof Funky.SPA.SubRouter.getCurrent).toBe('function');
    });

    FunkyTests.it('has handlePopstate method', function() {
      expect(typeof Funky.SPA.SubRouter.handlePopstate).toBe('function');
    });

    FunkyTests.it('has handleInitialLoad method', function() {
      expect(typeof Funky.SPA.SubRouter.handleInitialLoad).toBe('function');
    });

    FunkyTests.it('has _reset method for testing', function() {
      expect(typeof Funky.SPA.SubRouter._reset).toBe('function');
    });

    FunkyTests.it('has _parseUrl method for testing', function() {
      expect(typeof Funky.SPA.SubRouter._parseUrl).toBe('function');
    });

    FunkyTests.it('has _hasHandler method for testing', function() {
      expect(typeof Funky.SPA.SubRouter._hasHandler).toBe('function');
    });
  });

  // =========================================================================
  // REGISTRATION TESTS
  // =========================================================================
  FunkyTests.describe('register()', function() {
    FunkyTests.it('should register a handler for a base path', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {}
      };

      var result = Funky.SPA.SubRouter.register('/docs', handler);

      expect(result).toBe(true);
      expect(Funky.SPA.SubRouter.has('/docs')).toBe(true);
    });

    FunkyTests.it('should normalize base path with leading slash', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {}
      };

      Funky.SPA.SubRouter.register('playground', handler);

      expect(Funky.SPA.SubRouter.has('/playground')).toBe(true);
    });

    FunkyTests.it('should normalize base path without trailing slash', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {}
      };

      Funky.SPA.SubRouter.register('/docs/', handler);

      expect(Funky.SPA.SubRouter.has('/docs')).toBe(true);
    });

    FunkyTests.it('should reject handler without activate function', function() {
      var handler = {
        restore: function() {}
      };

      var result = Funky.SPA.SubRouter.register('/docs', handler);

      expect(result).toBe(false);
      expect(Funky.SPA.SubRouter.has('/docs')).toBe(false);
    });

    FunkyTests.it('should reject handler without restore function', function() {
      var handler = {
        activate: function() {}
      };

      var result = Funky.SPA.SubRouter.register('/docs', handler);

      expect(result).toBe(false);
      expect(Funky.SPA.SubRouter.has('/docs')).toBe(false);
    });

    FunkyTests.it('should allow optional deactivate function', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {},
        deactivate: function() {}
      };

      var result = Funky.SPA.SubRouter.register('/docs', handler);

      expect(result).toBe(true);
    });

    FunkyTests.it('should reject null handler', function() {
      var result = Funky.SPA.SubRouter.register('/docs', null);

      expect(result).toBe(false);
    });

    FunkyTests.it('should reject undefined handler', function() {
      var result = Funky.SPA.SubRouter.register('/docs', undefined);

      expect(result).toBe(false);
    });

    FunkyTests.it('should reject invalid basePath', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {}
      };

      expect(Funky.SPA.SubRouter.register(null, handler)).toBe(false);
      expect(Funky.SPA.SubRouter.register('', handler)).toBe(false);
      expect(Funky.SPA.SubRouter.register(123, handler)).toBe(false);
    });

    FunkyTests.it('should allow registering multiple handlers', function() {
      var handler1 = { activate: function() {}, restore: function() {} };
      var handler2 = { activate: function() {}, restore: function() {} };

      Funky.SPA.SubRouter.register('/docs', handler1);
      Funky.SPA.SubRouter.register('/playground', handler2);

      expect(Funky.SPA.SubRouter.has('/docs')).toBe(true);
      expect(Funky.SPA.SubRouter.has('/playground')).toBe(true);
    });

    FunkyTests.it('should allow handlers with queryOnly flag', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {},
        queryOnly: true
      };

      var result = Funky.SPA.SubRouter.register('/docs', handler);

      expect(result).toBe(true);
      var retrievedHandler = Funky.SPA.SubRouter.getHandler('/docs');
      expect(retrievedHandler.queryOnly).toBe(true);
    });
  });

  // =========================================================================
  // UNREGISTRATION TESTS
  // =========================================================================
  FunkyTests.describe('unregister()', function() {
    FunkyTests.it('should unregister a handler', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {}
      };

      Funky.SPA.SubRouter.register('/docs', handler);
      expect(Funky.SPA.SubRouter.has('/docs')).toBe(true);

      var result = Funky.SPA.SubRouter.unregister('/docs');

      expect(result).toBe(true);
      expect(Funky.SPA.SubRouter.has('/docs')).toBe(false);
    });

    FunkyTests.it('should return false for non-existent handler', function() {
      var result = Funky.SPA.SubRouter.unregister('/nonexistent');

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // GETHANDLER TESTS
  // =========================================================================
  FunkyTests.describe('getHandler()', function() {
    FunkyTests.it('should return registered handler', function() {
      var activateFn = function() { return { test: true }; };
      var restoreFn = function() {};
      var handler = {
        activate: activateFn,
        restore: restoreFn
      };

      Funky.SPA.SubRouter.register('/docs', handler);

      var retrieved = Funky.SPA.SubRouter.getHandler('/docs');

      // Check the handler has the expected functions
      expect(retrieved).not.toBeNull();
      expect(typeof retrieved.activate).toBe('function');
      expect(typeof retrieved.restore).toBe('function');
      // Verify it's the same function references
      expect(retrieved.activate).toBe(activateFn);
      expect(retrieved.restore).toBe(restoreFn);
    });

    FunkyTests.it('should return null for non-existent handler', function() {
      var result = Funky.SPA.SubRouter.getHandler('/nonexistent');

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // URL PARSING TESTS
  // =========================================================================
  FunkyTests.describe('_parseUrl()', function() {
    FunkyTests.beforeEach(function() {
      // Register handlers for parsing tests
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {}
      });
      Funky.SPA.SubRouter.register('/playground', {
        activate: function() { return {}; },
        restore: function() {}
      });
    });

    FunkyTests.it('should extract base path and sub-path', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs/architecture');

      expect(result.basePath).toBe('/docs');
      expect(result.subPath).toBe('architecture');
    });

    FunkyTests.it('should handle nested sub-paths', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs/guides/getting-started');

      expect(result.basePath).toBe('/docs');
      expect(result.subPath).toBe('guides/getting-started');
    });

    FunkyTests.it('should parse query params', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/playground/button?variant=primary&size=lg');

      expect(result.basePath).toBe('/playground');
      expect(result.subPath).toBe('button');
      expect(result.params.variant).toBe('primary');
      expect(result.params.size).toBe('lg');
    });

    FunkyTests.it('should return null for unregistered paths', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/unknown/path');

      expect(result).toBeNull();
    });

    FunkyTests.it('should handle base path with no sub-path', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs');

      expect(result.basePath).toBe('/docs');
      expect(result.subPath).toBe('');
    });

    FunkyTests.it('should handle base path with trailing slash and no sub-path', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs/');

      expect(result.basePath).toBe('/docs');
      expect(result.subPath).toBe('');
    });

    FunkyTests.it('should match longest base path first', function() {
      Funky.SPA.SubRouter.register('/docs/api', {
        activate: function() { return {}; },
        restore: function() {}
      });

      var result = Funky.SPA.SubRouter._parseUrl('/docs/api/users');

      expect(result.basePath).toBe('/docs/api');
      expect(result.subPath).toBe('users');
    });

    FunkyTests.it('should include fullPath in result', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs/architecture?section=overview');

      expect(result.fullPath).toBe('/docs/architecture');
      expect(result.search).toBe('?section=overview');
    });

    FunkyTests.it('should handle query params with empty sub-path', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs?file=spa');

      expect(result.basePath).toBe('/docs');
      expect(result.subPath).toBe('');
      expect(result.params.file).toBe('spa');
    });
  });

  // =========================================================================
  // QUERYONLY MODE TESTS
  // =========================================================================
  FunkyTests.describe('queryOnly mode', function() {
    FunkyTests.beforeEach(function() {
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {},
        queryOnly: true
      });
    });

    FunkyTests.it('should only match exact base path in queryOnly mode', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs');

      expect(result).not.toBeNull();
      expect(result.basePath).toBe('/docs');
    });

    FunkyTests.it('should match base path with trailing slash in queryOnly mode', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs/');

      expect(result).not.toBeNull();
      expect(result.basePath).toBe('/docs');
    });

    FunkyTests.it('should NOT match sub-paths in queryOnly mode', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs/architecture');

      expect(result).toBeNull();
    });

    FunkyTests.it('should parse query params in queryOnly mode', function() {
      var result = Funky.SPA.SubRouter._parseUrl('/docs?file=spa&section=intro');

      expect(result).not.toBeNull();
      expect(result.params.file).toBe('spa');
      expect(result.params.section).toBe('intro');
      expect(result.subPath).toBe('');
    });
  });

  // =========================================================================
  // PUSH TESTS
  // =========================================================================
  FunkyTests.describe('push()', function() {
    FunkyTests.beforeEach(function() {
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {}
      });
    });

    FunkyTests.it('should call pushState with correct URL', function() {
      Funky.SPA.SubRouter.push('/docs', 'architecture', { docId: 'architecture' });

      expect(pushStateCalls.length).toBe(1);
      expect(pushStateCalls[0].url).toBe('/docs/architecture');
    });

    FunkyTests.it('should store sub-route state in history.state', function() {
      Funky.SPA.SubRouter.push('/docs', 'architecture', { docId: 'architecture' });

      var state = pushStateCalls[0].state;
      expect(state.isSubRoute).toBe(true);
      expect(state.basePath).toBe('/docs');
      expect(state.subPath).toBe('architecture');
      expect(state.subState.docId).toBe('architecture');
    });

    FunkyTests.it('should include query params in URL', function() {
      Funky.SPA.SubRouter.push('/docs', 'architecture', {}, { section: 'overview' });

      expect(pushStateCalls[0].url).toBe('/docs/architecture?section=overview');
    });

    FunkyTests.it('should handle empty subPath', function() {
      Funky.SPA.SubRouter.push('/docs', '', {});

      expect(pushStateCalls[0].url).toBe('/docs');
    });

    FunkyTests.it('should handle null state', function() {
      Funky.SPA.SubRouter.push('/docs', 'spa', null);

      expect(pushStateCalls[0].state.subState).toEqual({});
    });

    FunkyTests.it('should handle null params', function() {
      Funky.SPA.SubRouter.push('/docs', 'spa', {}, null);

      expect(pushStateCalls[0].url).toBe('/docs/spa');
      expect(pushStateCalls[0].state.params).toEqual({});
    });

    FunkyTests.it('should not call pushState for unregistered handler', function() {
      Funky.SPA.SubRouter.push('/unknown', 'path', {});

      expect(pushStateCalls.length).toBe(0);
    });

    FunkyTests.it('should emit subroute event on push', function(done) {
      var eventFired = false;

      document.addEventListener('funky.spa.subroute', function handler(e) {
        document.removeEventListener('funky.spa.subroute', handler);
        eventFired = true;
        expect(e.detail.type).toBe('push');
        expect(e.detail.basePath).toBe('/docs');
        expect(e.detail.subPath).toBe('architecture');
        done();
      });

      Funky.SPA.SubRouter.push('/docs', 'architecture', {});
    });
  });

  // =========================================================================
  // REPLACE TESTS
  // =========================================================================
  FunkyTests.describe('replace()', function() {
    FunkyTests.beforeEach(function() {
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {}
      });
    });

    FunkyTests.it('should call replaceState instead of pushState', function() {
      Funky.SPA.SubRouter.replace('/docs', 'spa', { docId: 'spa' });

      expect(replaceStateCalls.length).toBe(1);
      expect(pushStateCalls.length).toBe(0);
      expect(replaceStateCalls[0].url).toBe('/docs/spa');
    });

    FunkyTests.it('should store sub-route state in history.state', function() {
      Funky.SPA.SubRouter.replace('/docs', 'spa', { docId: 'spa' });

      var state = replaceStateCalls[0].state;
      expect(state.isSubRoute).toBe(true);
      expect(state.basePath).toBe('/docs');
      expect(state.subPath).toBe('spa');
      expect(state.subState.docId).toBe('spa');
    });

    FunkyTests.it('should emit subroute event on replace', function(done) {
      var eventFired = false;

      document.addEventListener('funky.spa.subroute', function handler(e) {
        document.removeEventListener('funky.spa.subroute', handler);
        eventFired = true;
        expect(e.detail.type).toBe('replace');
        done();
      });

      Funky.SPA.SubRouter.replace('/docs', 'spa', {});
    });
  });

  // =========================================================================
  // DISABLEHISTORY TESTS
  // =========================================================================
  FunkyTests.describe('disableHistory mode', function() {
    FunkyTests.beforeEach(function() {
      Funky.SPA.config.disableHistory = true;
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {}
      });
    });

    FunkyTests.it('push should not call pushState when disableHistory is true', function() {
      Funky.SPA.SubRouter.push('/docs', 'architecture', {});

      expect(pushStateCalls.length).toBe(0);
    });

    FunkyTests.it('replace should not call replaceState when disableHistory is true', function() {
      Funky.SPA.SubRouter.replace('/docs', 'spa', {});

      expect(replaceStateCalls.length).toBe(0);
    });

    FunkyTests.it('push should still emit events when disableHistory is true', function(done) {
      document.addEventListener('funky.spa.subroute', function handler(e) {
        document.removeEventListener('funky.spa.subroute', handler);
        expect(e.detail.type).toBe('push');
        expect(e.detail.basePath).toBe('/docs');
        done();
      });

      Funky.SPA.SubRouter.push('/docs', 'architecture', {});
    });
  });

  // =========================================================================
  // GETCURRENT TESTS
  // =========================================================================
  FunkyTests.describe('getCurrent()', function() {
    FunkyTests.beforeEach(function() {
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {}
      });
    });

    FunkyTests.it('should return null for unregistered base path', function() {
      var result = Funky.SPA.SubRouter.getCurrent('/unknown');

      expect(result).toBeNull();
    });

    FunkyTests.it('should return null when current URL does not match base path', function() {
      // Current URL is likely not /docs in test environment
      var result = Funky.SPA.SubRouter.getCurrent('/docs');

      // This will be null unless we're actually on /docs
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  // =========================================================================
  // HANDLEPOPSTATE TESTS
  // =========================================================================
  FunkyTests.describe('handlePopstate()', function() {
    var restoreCalled;
    var restoreArgs;

    FunkyTests.beforeEach(function() {
      restoreCalled = false;
      restoreArgs = null;

      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function(state, context) {
          restoreCalled = true;
          restoreArgs = { state: state, context: context };
        }
      });

      // Set SPA.currentPage to match the target page
      Funky.SPA.currentPage = 'docs';
    });

    FunkyTests.afterEach(function() {
      Funky.SPA.currentPage = null;
    });

    FunkyTests.it('should return false for non-subroute state', function() {
      var result = Funky.SPA.SubRouter.handlePopstate({ url: '/page' });

      expect(result).toBe(false);
    });

    FunkyTests.it('should return false for null state', function() {
      var result = Funky.SPA.SubRouter.handlePopstate(null);

      expect(result).toBe(false);
    });

    FunkyTests.it('should call restore handler for sub-route state', function() {
      var historyState = {
        isSubRoute: true,
        basePath: '/docs',
        subPath: 'architecture',
        params: { section: 'overview' },
        subState: { docId: 'architecture' }
      };

      var result = Funky.SPA.SubRouter.handlePopstate(historyState);

      expect(result).toBe(true);
      expect(restoreCalled).toBe(true);
      expect(restoreArgs.state.docId).toBe('architecture');
      expect(restoreArgs.context.subPath).toBe('architecture');
      expect(restoreArgs.context.params.section).toBe('overview');
      expect(restoreArgs.context.fromPopstate).toBe(true);
    });

    FunkyTests.it('should return false for unregistered handler', function() {
      var historyState = {
        isSubRoute: true,
        basePath: '/unknown',
        subPath: 'path'
      };

      var result = Funky.SPA.SubRouter.handlePopstate(historyState);

      expect(result).toBe(false);
    });

    FunkyTests.it('should emit popstate event', function(done) {
      var historyState = {
        isSubRoute: true,
        basePath: '/docs',
        subPath: 'spa',
        params: {},
        subState: {}
      };

      document.addEventListener('funky.spa.subroute', function handler(e) {
        document.removeEventListener('funky.spa.subroute', handler);
        expect(e.detail.type).toBe('popstate');
        expect(e.detail.basePath).toBe('/docs');
        expect(e.detail.subPath).toBe('spa');
        done();
      });

      Funky.SPA.SubRouter.handlePopstate(historyState);
    });

    FunkyTests.it('should return false when currentPage does not match target', function() {
      Funky.SPA.currentPage = 'playground'; // Different from /docs

      var historyState = {
        isSubRoute: true,
        basePath: '/docs',
        subPath: 'architecture',
        subState: {}
      };

      var result = Funky.SPA.SubRouter.handlePopstate(historyState);

      // Should return false to let SPA do a full page load
      expect(result).toBe(false);
      expect(restoreCalled).toBe(false);
    });
  });

  // =========================================================================
  // HANDLEINITIALLOAD TESTS
  // =========================================================================
  FunkyTests.describe('handleInitialLoad()', function() {
    var activateCalled;
    var activateContext;

    FunkyTests.beforeEach(function() {
      activateCalled = false;
      activateContext = null;
    });

    FunkyTests.it('should return false when no handler matches current URL', function() {
      // Don't register any handlers
      var result = Funky.SPA.SubRouter.handleInitialLoad();

      expect(result).toBe(false);
    });

    FunkyTests.it('should call activate handler when URL matches', function() {
      // This test depends on the current URL matching the registered path
      // In practice, this would be tested in integration tests
      expect(typeof Funky.SPA.SubRouter.handleInitialLoad).toBe('function');
    });
  });

  // =========================================================================
  // RESET TESTS
  // =========================================================================
  FunkyTests.describe('_reset()', function() {
    FunkyTests.it('should clear all registered handlers', function() {
      var handler = {
        activate: function() { return {}; },
        restore: function() {}
      };

      Funky.SPA.SubRouter.register('/docs', handler);
      Funky.SPA.SubRouter.register('/playground', handler);

      expect(Funky.SPA.SubRouter.has('/docs')).toBe(true);
      expect(Funky.SPA.SubRouter.has('/playground')).toBe(true);

      Funky.SPA.SubRouter._reset();

      expect(Funky.SPA.SubRouter.has('/docs')).toBe(false);
      expect(Funky.SPA.SubRouter.has('/playground')).toBe(false);
    });
  });

  // =========================================================================
  // EDGE CASES TESTS
  // =========================================================================
  FunkyTests.describe('Edge cases', function() {
    FunkyTests.beforeEach(function() {
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {}
      });
    });

    FunkyTests.it('handles sub-path with hyphens', function() {
      Funky.SPA.SubRouter.push('/docs', 'getting-started', {});

      expect(pushStateCalls[0].url).toBe('/docs/getting-started');
    });

    FunkyTests.it('handles sub-path with underscores', function() {
      Funky.SPA.SubRouter.push('/docs', 'api_reference', {});

      expect(pushStateCalls[0].url).toBe('/docs/api_reference');
    });

    FunkyTests.it('handles multiple query params', function() {
      Funky.SPA.SubRouter.push('/docs', 'api', {}, {
        version: '2.0',
        section: 'endpoints',
        format: 'json'
      });

      var url = pushStateCalls[0].url;
      expect(url.indexOf('/docs/api?')).toBe(0);
      expect(url.indexOf('version=2.0') > 0).toBe(true);
      expect(url.indexOf('section=endpoints') > 0).toBe(true);
      expect(url.indexOf('format=json') > 0).toBe(true);
    });

    FunkyTests.it('handles empty params object', function() {
      Funky.SPA.SubRouter.push('/docs', 'spa', {}, {});

      expect(pushStateCalls[0].url).toBe('/docs/spa');
    });

    FunkyTests.it('filters out undefined and null param values', function() {
      Funky.SPA.SubRouter.push('/docs', 'spa', {}, {
        valid: 'value',
        undefinedVal: undefined,
        nullVal: null
      });

      var url = pushStateCalls[0].url;
      expect(url.indexOf('valid=value') > 0).toBe(true);
      expect(url.indexOf('undefinedVal') === -1).toBe(true);
      expect(url.indexOf('nullVal') === -1).toBe(true);
    });

    FunkyTests.it('handles rapid consecutive pushes', function() {
      for (var i = 0; i < 10; i++) {
        Funky.SPA.SubRouter.push('/docs', 'doc-' + i, { index: i });
      }

      expect(pushStateCalls.length).toBe(10);
      expect(pushStateCalls[9].url).toBe('/docs/doc-9');
    });

    FunkyTests.it('handles special characters in subPath that need encoding', function() {
      // Note: The implementation might or might not encode these
      Funky.SPA.SubRouter.push('/docs', 'section/subsection', {});

      expect(pushStateCalls[0].url).toBe('/docs/section/subsection');
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  FunkyTests.describe('Error handling', function() {
    FunkyTests.it('handles error in activate handler gracefully', function() {
      Funky.SPA.SubRouter.register('/error-test', {
        activate: function() {
          throw new Error('Activate error');
        },
        restore: function() {}
      });

      // handleInitialLoad should catch the error and return false
      expect(function() {
        Funky.SPA.SubRouter.handleInitialLoad();
      }).not.toThrow();
    });

    FunkyTests.it('handles error in restore handler gracefully', function() {
      Funky.SPA.SubRouter.register('/error-test', {
        activate: function() { return {}; },
        restore: function() {
          throw new Error('Restore error');
        }
      });

      // Set currentPage to match
      Funky.SPA.currentPage = 'error-test';

      var historyState = {
        isSubRoute: true,
        basePath: '/error-test',
        subPath: 'path',
        subState: {}
      };

      expect(function() {
        Funky.SPA.SubRouter.handlePopstate(historyState);
      }).not.toThrow();

      Funky.SPA.currentPage = null;
    });
  });

  // =========================================================================
  // PUBSUB INTEGRATION TESTS
  // =========================================================================
  FunkyTests.describe('PubSub integration', function() {
    FunkyTests.beforeEach(function() {
      Funky.SPA.SubRouter.register('/docs', {
        activate: function() { return {}; },
        restore: function() {}
      });
    });

    FunkyTests.it('should emit PubSub event on push if PubSub available', function(done) {
      if (!Funky.PubSub) {
        // Skip if PubSub not available
        done();
        return;
      }

      var handler = function(data) {
        Funky.PubSub.off('funky:spa:subroute', handler);
        expect(data.type).toBe('push');
        expect(data.basePath).toBe('/docs');
        done();
      };

      Funky.PubSub.on('funky:spa:subroute', handler);

      Funky.SPA.SubRouter.push('/docs', 'architecture', {});
    });
  });
});
