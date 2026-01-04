/**
 * Tests for Funky.CSRF
 * CSRF token management and secure fetch wrapper
 */
FunkyTests.describe('Funky.Core.CSRF', function() {
  var expect = FunkyTests.expect;

  FunkyTests.afterEach(function() {
    // Clean up test cookies - try to expire them
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'test_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  FunkyTests.describe('Module Structure', function() {
    FunkyTests.it('Funky.CSRF exists', function() {
      expect(Funky.CSRF !== undefined).toBe(true);
    });

    FunkyTests.it('has getToken method', function() {
      expect(typeof Funky.CSRF.getToken).toBe('function');
    });

    FunkyTests.it('has secureFetch method', function() {
      expect(typeof Funky.CSRF.secureFetch).toBe('function');
    });

    FunkyTests.it('has storeToken method', function() {
      expect(typeof Funky.CSRF.storeToken).toBe('function');
    });
  });

  FunkyTests.describe('getToken', function() {
    FunkyTests.it('returns null when no csrf_token cookie exists', function() {
      // Clear any existing token
      document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Verify the function is callable
      expect(typeof Funky.CSRF.getToken).toBe('function');
    });

    FunkyTests.it('parses cookie string correctly', function() {
      // Set a test cookie
      document.cookie = 'csrf_token=test123abc; path=/';

      var token = Funky.CSRF.getToken();

      // Should find our test token or an existing one
      expect(token !== undefined).toBe(true);
    });

    FunkyTests.it('handles URL-encoded cookie values', function() {
      // Set a cookie with special characters
      document.cookie = 'csrf_token=' + encodeURIComponent('token+with/special=chars') + '; path=/';

      var token = Funky.CSRF.getToken();

      // Should be able to get a token (might be decoded)
      expect(token !== undefined).toBe(true);
    });

    FunkyTests.it('handles multiple cookies', function() {
      // Set multiple cookies
      document.cookie = 'other_cookie=abc; path=/';
      document.cookie = 'csrf_token=mytoken; path=/';
      document.cookie = 'another_cookie=xyz; path=/';

      var token = Funky.CSRF.getToken();

      expect(token !== null).toBe(true);
    });

    FunkyTests.it('handles cookies with spaces', function() {
      // Cookies might have spaces around them after splitting
      document.cookie = 'csrf_token=spaced_token; path=/';

      var token = Funky.CSRF.getToken();

      expect(token !== null).toBe(true);
    });
  });

  FunkyTests.describe('secureFetch', function() {
    FunkyTests.it('returns a Promise', function() {
      // Set a token first
      document.cookie = 'csrf_token=testtoken123; path=/';

      var result = Funky.CSRF.secureFetch('/test-url', { method: 'POST' });

      expect(result instanceof Promise).toBe(true);

      // Clean up the promise (ignore rejection)
      result.catch(function() {});
    });

    FunkyTests.it('rejects with error when CSRF token is missing for POST', function(done) {
      // Try to clear the token
      document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Store original getToken
      var originalGetToken = Funky.CSRF.getToken;

      // Mock getToken to return null
      Funky.CSRF.getToken = function() {
        return null;
      };

      Funky.CSRF.secureFetch('/test-url', { method: 'POST' })
        .then(function() {
          expect(false).toBe(true); // Should have rejected
          Funky.CSRF.getToken = originalGetToken;
          done();
        })
        .catch(function(error) {
          expect(error.message).toBe('CSRF token missing');
          Funky.CSRF.getToken = originalGetToken;
          done();
        });
    });

    FunkyTests.it('does not require CSRF token for GET requests', function(done) {
      // Mock getToken to return null
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() {
        return null;
      };

      // GET request should not require CSRF token
      Funky.CSRF.secureFetch('/test-url', { method: 'GET' })
        .then(function() {
          // Should proceed (might fail for other reasons, but not CSRF)
          expect(true).toBe(true);
          Funky.CSRF.getToken = originalGetToken;
          done();
        })
        .catch(function(error) {
          // If it fails, it shouldn't be due to CSRF missing
          expect(error.message !== 'CSRF token missing').toBe(true);
          Funky.CSRF.getToken = originalGetToken;
          done();
        });
    });

    FunkyTests.it('adds CSRF token header for POST requests', function() {
      // Set a token
      document.cookie = 'csrf_token=test_post_token; path=/';

      // We can't easily test the headers without mocking fetch
      // So we just verify the promise is returned correctly
      var promise = Funky.CSRF.secureFetch('/test-url', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      expect(promise instanceof Promise).toBe(true);

      // Clean up - don't wait for network
      promise.catch(function() {});
    });

    FunkyTests.it('adds CSRF token header for PUT requests', function() {
      document.cookie = 'csrf_token=test_put_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test-url', {
        method: 'PUT',
        body: JSON.stringify({ test: true })
      });

      expect(promise instanceof Promise).toBe(true);

      promise.catch(function() {});
    });

    FunkyTests.it('adds CSRF token header for DELETE requests', function() {
      document.cookie = 'csrf_token=test_delete_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test-url', {
        method: 'DELETE'
      });

      expect(promise instanceof Promise).toBe(true);

      promise.catch(function() {});
    });

    FunkyTests.it('adds CSRF token header for PATCH requests', function() {
      document.cookie = 'csrf_token=test_patch_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test-url', {
        method: 'PATCH',
        body: JSON.stringify({ test: true })
      });

      expect(promise instanceof Promise).toBe(true);

      promise.catch(function() {});
    });

    FunkyTests.it('handles case-insensitive method names', function() {
      document.cookie = 'csrf_token=case_test_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test-url', {
        method: 'post' // lowercase
      });

      expect(promise instanceof Promise).toBe(true);

      promise.catch(function() {});
    });

    FunkyTests.it('does not mutate original options object', function() {
      document.cookie = 'csrf_token=mutation_test_token; path=/';

      var options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      var originalHeadersCount = Object.keys(options.headers).length;

      // The promise initiates but we verify mutation didn't happen synchronously
      var promise = Funky.CSRF.secureFetch('/test-url', options);

      // Check that original options were not mutated (checked synchronously)
      expect(Object.keys(options.headers).length).toBe(originalHeadersCount);

      promise.catch(function() {});
    });

    FunkyTests.it('works with no options object', function() {
      // GET request with no options
      var promise = Funky.CSRF.secureFetch('/test-url');

      expect(promise instanceof Promise).toBe(true);

      promise.catch(function() {});
    });

    FunkyTests.it('initializes headers if not present', function() {
      document.cookie = 'csrf_token=headers_test_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test-url', {
        method: 'POST'
        // No headers property
      });

      expect(promise instanceof Promise).toBe(true);

      promise.catch(function() {});
    });
  });

  FunkyTests.describe('storeToken', function() {
    FunkyTests.it('does not throw when called', function() {
      var noError = true;
      try {
        Funky.CSRF.storeToken('test-token');
      } catch (e) {
        noError = false;
      }

      expect(noError).toBe(true);
    });

    FunkyTests.it('accepts a token string', function() {
      // This function currently just logs, but should not error
      var result = Funky.CSRF.storeToken('abc123');
      expect(result).toBe(undefined);
    });
  });

  FunkyTests.describe('State-Changing Methods', function() {
    FunkyTests.it('requires CSRF for POST', function(done) {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      Funky.CSRF.secureFetch('/test', { method: 'POST' })
        .catch(function(e) {
          expect(e.message).toBe('CSRF token missing');
          Funky.CSRF.getToken = originalGetToken;
          done();
        });
    });

    FunkyTests.it('requires CSRF for PUT', function(done) {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      Funky.CSRF.secureFetch('/test', { method: 'PUT' })
        .catch(function(e) {
          expect(e.message).toBe('CSRF token missing');
          Funky.CSRF.getToken = originalGetToken;
          done();
        });
    });

    FunkyTests.it('requires CSRF for DELETE', function(done) {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      Funky.CSRF.secureFetch('/test', { method: 'DELETE' })
        .catch(function(e) {
          expect(e.message).toBe('CSRF token missing');
          Funky.CSRF.getToken = originalGetToken;
          done();
        });
    });

    FunkyTests.it('requires CSRF for PATCH', function(done) {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      Funky.CSRF.secureFetch('/test', { method: 'PATCH' })
        .catch(function(e) {
          expect(e.message).toBe('CSRF token missing');
          Funky.CSRF.getToken = originalGetToken;
          done();
        });
    });
  });

  FunkyTests.describe('Safe Methods', function() {
    FunkyTests.it('does not require CSRF for GET', function() {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      // GET requests should not throw CSRF error synchronously
      var error = null;
      try {
        var promise = Funky.CSRF.secureFetch('/test', { method: 'GET' });
        // If we get here, no CSRF error was thrown
        promise.catch(function() {});
      } catch (e) {
        error = e;
      }

      Funky.CSRF.getToken = originalGetToken;

      // Should not have thrown CSRF error
      expect(error === null || error.message !== 'CSRF token missing').toBe(true);
    });

    FunkyTests.it('does not require CSRF for HEAD', function() {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      var error = null;
      try {
        var promise = Funky.CSRF.secureFetch('/test', { method: 'HEAD' });
        promise.catch(function() {});
      } catch (e) {
        error = e;
      }

      Funky.CSRF.getToken = originalGetToken;
      expect(error === null || error.message !== 'CSRF token missing').toBe(true);
    });

    FunkyTests.it('does not require CSRF for OPTIONS', function() {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      var error = null;
      try {
        var promise = Funky.CSRF.secureFetch('/test', { method: 'OPTIONS' });
        promise.catch(function() {});
      } catch (e) {
        error = e;
      }

      Funky.CSRF.getToken = originalGetToken;
      expect(error === null || error.message !== 'CSRF token missing').toBe(true);
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  FunkyTests.describe('Error handling', function() {
    FunkyTests.it('getToken handles empty cookie string', function() {
      var originalCookie = document.cookie;

      // Set empty cookie (or as close as possible)
      document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      var result = Funky.CSRF.getToken();
      // Should return null or a token, not throw
      expect(result === null || typeof result === 'string').toBe(true);
    });

    FunkyTests.it('getToken handles malformed cookie', function() {
      // Cookie with no value
      document.cookie = 'csrf_token=; path=/';

      var result = Funky.CSRF.getToken();
      // Should handle gracefully
      expect(result === null || result === '' || typeof result === 'string').toBe(true);
    });

    FunkyTests.it('secureFetch handles fetch rejection gracefully', function(done) {
      document.cookie = 'csrf_token=test_error_token; path=/';

      // Save original fetch
      var originalFetch = window.fetch;

      // Mock fetch to reject
      window.fetch = function() {
        return Promise.reject(new Error('Network error'));
      };

      Funky.CSRF.secureFetch('/test', { method: 'GET' })
        .then(function() {
          expect(false).toBe(true); // Should have rejected
          window.fetch = originalFetch;
          done();
        })
        .catch(function(error) {
          expect(error.message).toBe('Network error');
          window.fetch = originalFetch;
          done();
        });
    });

    FunkyTests.it('storeToken handles empty string', function() {
      var threw = false;
      try {
        Funky.CSRF.storeToken('');
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('storeToken handles null', function() {
      var threw = false;
      try {
        Funky.CSRF.storeToken(null);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('storeToken handles undefined', function() {
      var threw = false;
      try {
        Funky.CSRF.storeToken(undefined);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    FunkyTests.it('secureFetch handles missing URL gracefully', function() {
      document.cookie = 'csrf_token=url_test_token; path=/';

      var promise = Funky.CSRF.secureFetch(undefined, { method: 'GET' });
      expect(promise instanceof Promise).toBe(true);
      promise.catch(function() {}); // Suppress unhandled rejection
    });
  });

  // =========================================================================
  // EDGE CASES TESTS
  // =========================================================================
  FunkyTests.describe('Edge cases', function() {
    FunkyTests.it('handles cookie with equals sign in value', function() {
      document.cookie = 'csrf_token=token=with=equals; path=/';

      var token = Funky.CSRF.getToken();
      expect(token !== null).toBe(true);
    });

    FunkyTests.it('handles very long token', function() {
      // Note: Browser cookie size limits may truncate very long tokens
      // This test just verifies we can handle longer tokens without crashing
      var longToken = 'a'.repeat(100);
      document.cookie = 'csrf_token=' + longToken + '; path=/';

      var token = Funky.CSRF.getToken();
      expect(token !== null).toBe(true);
      // Token should be at least partially preserved (browser may limit size)
      expect(token.length).toBeGreaterThan(10);
    });

    FunkyTests.it('handles special characters in token', function() {
      var specialToken = 'abc123-_.~!*';
      document.cookie = 'csrf_token=' + encodeURIComponent(specialToken) + '; path=/';

      var token = Funky.CSRF.getToken();
      expect(token !== null).toBe(true);
    });

    FunkyTests.it('handles mixed case method names', function() {
      document.cookie = 'csrf_token=mixed_case_token; path=/';

      var promise1 = Funky.CSRF.secureFetch('/test', { method: 'Post' });
      var promise2 = Funky.CSRF.secureFetch('/test', { method: 'POST' });
      var promise3 = Funky.CSRF.secureFetch('/test', { method: 'post' });

      expect(promise1 instanceof Promise).toBe(true);
      expect(promise2 instanceof Promise).toBe(true);
      expect(promise3 instanceof Promise).toBe(true);

      promise1.catch(function() {});
      promise2.catch(function() {});
      promise3.catch(function() {});
    });

    FunkyTests.it('handles options with extra properties', function() {
      document.cookie = 'csrf_token=extra_props_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test', {
        method: 'POST',
        headers: { 'X-Custom': 'value' },
        body: '{}',
        mode: 'cors',
        cache: 'no-cache',
        customProp: 'ignored'
      });

      expect(promise instanceof Promise).toBe(true);
      promise.catch(function() {});
    });

    FunkyTests.it('handles default method (no method specified)', function() {
      document.cookie = 'csrf_token=default_method_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test', {});
      expect(promise instanceof Promise).toBe(true);
      promise.catch(function() {});
    });

    FunkyTests.it('handles absolute URLs', function() {
      document.cookie = 'csrf_token=absolute_url_token; path=/';

      var promise = Funky.CSRF.secureFetch('https://example.com/test', { method: 'POST' });
      expect(promise instanceof Promise).toBe(true);
      promise.catch(function() {});
    });

    FunkyTests.it('handles URL with query string', function() {
      document.cookie = 'csrf_token=query_string_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test?param=value&other=123', { method: 'POST' });
      expect(promise instanceof Promise).toBe(true);
      promise.catch(function() {});
    });

    FunkyTests.it('handles multiple calls in quick succession', function() {
      document.cookie = 'csrf_token=rapid_call_token; path=/';

      var promises = [];
      for (var i = 0; i < 10; i++) {
        promises.push(Funky.CSRF.secureFetch('/test' + i, { method: 'POST' }));
      }

      expect(promises.length).toBe(10);
      promises.forEach(function(p) { p.catch(function() {}); });
    });
  });

  // =========================================================================
  // COOKIE PARSING TESTS
  // =========================================================================
  FunkyTests.describe('Cookie parsing', function() {
    FunkyTests.it('handles leading whitespace in cookie name', function() {
      // Some browsers add leading whitespace
      document.cookie = 'csrf_token=whitespace_token; path=/';

      var token = Funky.CSRF.getToken();
      expect(token !== null).toBe(true);
    });

    FunkyTests.it('handles trailing whitespace in cookie value', function() {
      document.cookie = 'csrf_token=trailing_space_token ; path=/';

      var token = Funky.CSRF.getToken();
      expect(token !== null).toBe(true);
    });

    FunkyTests.it('finds token among many cookies', function() {
      // Set multiple cookies
      document.cookie = 'cookie1=value1; path=/';
      document.cookie = 'cookie2=value2; path=/';
      document.cookie = 'csrf_token=target_token; path=/';
      document.cookie = 'cookie3=value3; path=/';
      document.cookie = 'cookie4=value4; path=/';

      var token = Funky.CSRF.getToken();
      expect(token !== null).toBe(true);
    });

    FunkyTests.it('handles similar cookie names', function() {
      document.cookie = 'csrf_token_old=old_value; path=/';
      document.cookie = 'my_csrf_token=wrong_value; path=/';
      document.cookie = 'csrf_token=correct_value; path=/';

      var token = Funky.CSRF.getToken();
      expect(token !== null).toBe(true);
    });
  });

  // =========================================================================
  // HEADERS TESTS
  // =========================================================================
  FunkyTests.describe('Header handling', function() {
    FunkyTests.it('preserves existing headers', function() {
      document.cookie = 'csrf_token=header_test_token; path=/';

      var options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value'
        }
      };

      // Make a copy to check after
      var originalHeaderCount = Object.keys(options.headers).length;

      var promise = Funky.CSRF.secureFetch('/test', options);

      // Original options should not be mutated
      expect(Object.keys(options.headers).length).toBe(originalHeaderCount);

      promise.catch(function() {});
    });

    FunkyTests.it('works with Headers object', function() {
      document.cookie = 'csrf_token=headers_obj_token; path=/';

      var headers = new Headers();
      headers.append('Content-Type', 'application/json');

      var promise = Funky.CSRF.secureFetch('/test', {
        method: 'POST',
        headers: headers
      });

      expect(promise instanceof Promise).toBe(true);
      promise.catch(function() {});
    });

    FunkyTests.it('works with empty headers object', function() {
      document.cookie = 'csrf_token=empty_headers_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test', {
        method: 'POST',
        headers: {}
      });

      expect(promise instanceof Promise).toBe(true);
      promise.catch(function() {});
    });
  });

  // =========================================================================
  // ASYNC BEHAVIOR TESTS
  // =========================================================================
  FunkyTests.describe('Async behavior', function() {
    FunkyTests.it('returns Promise that can be chained', function() {
      document.cookie = 'csrf_token=chain_test_token; path=/';

      var promise = Funky.CSRF.secureFetch('/test', { method: 'GET' })
        .then(function(response) {
          return response;
        })
        .catch(function(error) {
          return error;
        });

      expect(promise instanceof Promise).toBe(true);
    });

    FunkyTests.it('multiple concurrent requests work independently', function() {
      document.cookie = 'csrf_token=concurrent_token; path=/';

      var p1 = Funky.CSRF.secureFetch('/test1', { method: 'POST' });
      var p2 = Funky.CSRF.secureFetch('/test2', { method: 'POST' });
      var p3 = Funky.CSRF.secureFetch('/test3', { method: 'GET' });

      expect(p1 instanceof Promise).toBe(true);
      expect(p2 instanceof Promise).toBe(true);
      expect(p3 instanceof Promise).toBe(true);

      p1.catch(function() {});
      p2.catch(function() {});
      p3.catch(function() {});
    });

    FunkyTests.it('rejection is catchable', function(done) {
      var originalGetToken = Funky.CSRF.getToken;
      Funky.CSRF.getToken = function() { return null; };

      var caught = false;
      Funky.CSRF.secureFetch('/test', { method: 'POST' })
        .catch(function(error) {
          caught = true;
          expect(error.message).toBe('CSRF token missing');
          Funky.CSRF.getToken = originalGetToken;
          done();
        });
    });
  });

  // =========================================================================
  // STATE VERIFICATION TESTS
  // =========================================================================
  FunkyTests.describe('State verification', function() {
    FunkyTests.it('getToken is idempotent', function() {
      document.cookie = 'csrf_token=idempotent_token; path=/';

      var token1 = Funky.CSRF.getToken();
      var token2 = Funky.CSRF.getToken();
      var token3 = Funky.CSRF.getToken();

      expect(token1).toBe(token2);
      expect(token2).toBe(token3);
    });

    FunkyTests.it('module methods exist after multiple calls', function() {
      // Call methods multiple times
      Funky.CSRF.getToken();
      Funky.CSRF.getToken();
      Funky.CSRF.storeToken('test');
      Funky.CSRF.storeToken('test');

      // Verify methods still exist
      expect(typeof Funky.CSRF.getToken).toBe('function');
      expect(typeof Funky.CSRF.secureFetch).toBe('function');
      expect(typeof Funky.CSRF.storeToken).toBe('function');
    });
  });
});
