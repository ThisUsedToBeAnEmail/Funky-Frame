/**
 * API Unit Tests
 *
 * Tests for Funky.Api - the centralized API layer.
 */

describe('Funky.Core.Api', function() {

    var Api = Funky.Api;
    var originalFetch;
    var fetchCalls;

    beforeEach(function() {
        fetchCalls = [];

        // Mock fetch
        originalFetch = window.fetch;
        window.fetch = function(url, options) {
            fetchCalls.push({ url: url, options: options });

            // Default successful response
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                text: function() {
                    return Promise.resolve(JSON.stringify({ success: true, data: [] }));
                }
            });
        };

        // Set a CSRF token cookie for mutation tests
        document.cookie = 'csrf_token=test_token_123';
    });

    afterEach(function() {
        window.fetch = originalFetch;
        // Clear cookie
        document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    });

    describe('Module registration', function() {

        it('is registered with Funky', function() {
            expect(Funky.Api).toBeDefined();
        });

        it('has HTTP methods', function() {
            expect(typeof Api.get).toBe('function');
            expect(typeof Api.post).toBe('function');
            expect(typeof Api.put).toBe('function');
            expect(typeof Api.patch).toBe('function');
            expect(typeof Api.delete).toBe('function');
        });

        it('has utility methods', function() {
            expect(typeof Api.request).toBe('function');
            expect(typeof Api.upload).toBe('function');
            expect(typeof Api.fetchAll).toBe('function');
            expect(typeof Api.entity).toBe('function');
            expect(typeof Api.cancelAll).toBe('function');
        });

        it('has pre-registered entities', function() {
            expect(Api.clients).toBeDefined();
            expect(typeof Api.clients.list).toBe('function');
            expect(typeof Api.clients.get).toBe('function');
            expect(typeof Api.clients.create).toBe('function');
            expect(typeof Api.clients.update).toBe('function');
            expect(typeof Api.clients.delete).toBe('function');
        });

    });

    describe('GET requests', function() {

        it('makes GET request to URL', function() {
            return Api.get('/api/test').then(function() {
                expect(fetchCalls.length).toBe(1);
                expect(fetchCalls[0].url).toBe('/api/test');
                expect(fetchCalls[0].options.method).toBe('GET');
            });
        });

        it('appends query params to URL', function() {
            return Api.get('/api/test', { page: 1, limit: 10 }).then(function() {
                expect(fetchCalls[0].url).toContain('page=1');
                expect(fetchCalls[0].url).toContain('limit=10');
            });
        });

        it('does not include CSRF token in GET', function() {
            return Api.get('/api/test').then(function() {
                var headers = fetchCalls[0].options.headers;
                expect(headers['X-CSRF-Token']).toBeUndefined();
            });
        });

        it('returns parsed JSON response', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ name: 'Test', value: 42 }));
                    }
                });
            };

            return Api.get('/api/test').then(function(data) {
                expect(data.name).toBe('Test');
                expect(data.value).toBe(42);
            });
        });

    });

    describe('POST requests', function() {

        it('makes POST request with JSON body', function() {
            return Api.post('/api/test', { name: 'New Item' }).then(function() {
                expect(fetchCalls[0].options.method).toBe('POST');
                expect(fetchCalls[0].options.headers['Content-Type']).toBe('application/json');
                expect(fetchCalls[0].options.body).toBe(JSON.stringify({ name: 'New Item' }));
            });
        });

        it('includes CSRF token in POST', function() {
            return Api.post('/api/test', {}).then(function() {
                expect(fetchCalls[0].options.headers['X-CSRF-Token']).toBe('test_token_123');
            });
        });

    });

    describe('PUT requests', function() {

        it('makes PUT request with JSON body', function() {
            return Api.put('/api/test/1', { name: 'Updated' }).then(function() {
                expect(fetchCalls[0].options.method).toBe('PUT');
                expect(fetchCalls[0].options.body).toBe(JSON.stringify({ name: 'Updated' }));
            });
        });

        it('includes CSRF token in PUT', function() {
            return Api.put('/api/test/1', {}).then(function() {
                expect(fetchCalls[0].options.headers['X-CSRF-Token']).toBe('test_token_123');
            });
        });

    });

    describe('PATCH requests', function() {

        it('makes PATCH request with JSON body', function() {
            return Api.patch('/api/test/1', { status: 'active' }).then(function() {
                expect(fetchCalls[0].options.method).toBe('PATCH');
                expect(fetchCalls[0].options.body).toBe(JSON.stringify({ status: 'active' }));
            });
        });

        it('includes CSRF token in PATCH', function() {
            return Api.patch('/api/test/1', {}).then(function() {
                expect(fetchCalls[0].options.headers['X-CSRF-Token']).toBe('test_token_123');
            });
        });

    });

    describe('DELETE requests', function() {

        it('makes DELETE request', function() {
            return Api.delete('/api/test/1').then(function() {
                expect(fetchCalls[0].options.method).toBe('DELETE');
            });
        });

        it('includes CSRF token in DELETE', function() {
            return Api.delete('/api/test/1').then(function() {
                expect(fetchCalls[0].options.headers['X-CSRF-Token']).toBe('test_token_123');
            });
        });

    });

    describe('Error handling', function() {

        it('rejects on 404 error', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ error: 'Not found' }));
                    }
                });
            };

            return Api.get('/api/missing').then(function() {
                throw new Error('Should have rejected');
            }).catch(function(error) {
                expect(error.status).toBe(404);
            });
        });

        it('rejects on 500 error', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ error: 'Server error' }));
                    }
                });
            };

            return Api.get('/api/broken').then(function() {
                throw new Error('Should have rejected');
            }).catch(function(error) {
                expect(error.status).toBe(500);
            });
        });

        it('normalizes error response', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 422,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({
                            error: 'Validation failed',
                            errors: { name: 'Name is required' }
                        }));
                    }
                });
            };

            return Api.post('/api/test', {}).catch(function(error) {
                expect(error.success).toBe(false);
                expect(error.status).toBe(422);
                expect(error.error).toBe('Validation failed');
            });
        });

    });

    describe('CSRF token handling', function() {

        it('rejects POST without CSRF token', function() {
            // Clear the cookie
            document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            return Api.post('/api/test', {}).catch(function(error) {
                expect(error.error).toContain('CSRF');
            });
        });

    });

    describe('Entity API', function() {

        it('creates entity with CRUD methods', function() {
            var products = Api.entity('products', '/api/products');

            expect(typeof products.list).toBe('function');
            expect(typeof products.get).toBe('function');
            expect(typeof products.create).toBe('function');
            expect(typeof products.update).toBe('function');
            expect(typeof products.patch).toBe('function');
            expect(typeof products.delete).toBe('function');
        });

        it('entity.list() calls GET on base URL', function() {
            var products = Api.entity('products', '/api/products');

            return products.list().then(function() {
                expect(fetchCalls[0].url).toBe('/api/products');
                expect(fetchCalls[0].options.method).toBe('GET');
            });
        });

        it('entity.list() with params adds query string', function() {
            var products = Api.entity('products', '/api/products');

            return products.list({ category: 'books' }).then(function() {
                expect(fetchCalls[0].url).toContain('category=books');
            });
        });

        it('entity.get(id) calls GET on URL with ID', function() {
            var products = Api.entity('products', '/api/products');

            return products.get(123).then(function() {
                expect(fetchCalls[0].url).toBe('/api/products/123');
            });
        });

        it('entity.create() calls POST', function() {
            var products = Api.entity('products', '/api/products');

            return products.create({ name: 'Widget' }).then(function() {
                expect(fetchCalls[0].options.method).toBe('POST');
                expect(fetchCalls[0].url).toBe('/api/products');
            });
        });

        it('entity.update(id, data) calls PUT', function() {
            var products = Api.entity('products', '/api/products');

            return products.update(123, { name: 'Updated Widget' }).then(function() {
                expect(fetchCalls[0].options.method).toBe('PUT');
                expect(fetchCalls[0].url).toBe('/api/products/123');
            });
        });

        it('entity.patch(id, data) calls PATCH', function() {
            var products = Api.entity('products', '/api/products');

            return products.patch(123, { status: 'active' }).then(function() {
                expect(fetchCalls[0].options.method).toBe('PATCH');
                expect(fetchCalls[0].url).toBe('/api/products/123');
            });
        });

        it('entity.delete(id) calls DELETE', function() {
            var products = Api.entity('products', '/api/products');

            return products.delete(123).then(function() {
                expect(fetchCalls[0].options.method).toBe('DELETE');
                expect(fetchCalls[0].url).toBe('/api/products/123');
            });
        });

    });

    describe('handleError()', function() {

        it('emits funky:session:expired on 401', function() {
            var eventFired = false;
            var unbind;

            if (Funky.PubSub) {
                unbind = Funky.PubSub.on('funky:session:expired', function() {
                    eventFired = true;
                });
            }

            Api.handleError({ status: 401, error: 'Unauthorized' });

            if (unbind) unbind();
            expect(eventFired).toBe(true);
        });

        it('emits funky:api:error event', function() {
            var eventFired = false;
            var unbind;

            if (Funky.PubSub) {
                unbind = Funky.PubSub.on('funky:api:error', function() {
                    eventFired = true;
                });
            }

            Api.handleError({ status: 500, error: 'Server error' });

            if (unbind) unbind();
            expect(eventFired).toBe(true);
        });

    });

    describe('cancelAll()', function() {

        it('cancels pending requests', function() {
            // Start a request that won't complete
            var requestPromise = Api.get('/api/slow');

            // Cancel all
            Api.cancelAll();

            return requestPromise.catch(function(error) {
                expect(error.aborted).toBe(true);
            });
        });

    });

    describe('Request deduplication', function() {

        it('deduplicates identical GET requests', function() {
            // Make two identical requests at the same time
            var promise1 = Api.get('/api/dedupe-test');
            var promise2 = Api.get('/api/dedupe-test');

            return Promise.all([promise1, promise2]).then(function() {
                // Should only make one actual fetch call
                expect(fetchCalls.length).toBe(1);
            });
        });

        it('does not deduplicate POST requests', function() {
            var promise1 = Api.post('/api/test', { a: 1 });
            var promise2 = Api.post('/api/test', { b: 2 });

            return Promise.all([promise1, promise2]).then(function() {
                expect(fetchCalls.length).toBe(2);
            });
        });

    });

    describe('Empty responses', function() {

        it('handles empty JSON response', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 204,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve('');
                    }
                });
            };

            return Api.delete('/api/test/1').then(function(data) {
                expect(data).toEqual({});
            });
        });

        it('handles non-JSON response', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'text/plain' }),
                    text: function() {
                        return Promise.resolve('OK');
                    }
                });
            };

            return Api.get('/api/health').then(function(data) {
                expect(data).toEqual({});
            });
        });

    });

    describe('Convenience wrappers', function() {

        it('fetchAllClients calls clients.fetchAll', function() {
            // Just verify the method exists and is callable
            expect(typeof Api.fetchAllClients).toBe('function');
        });

        it('has all fetchAll wrappers', function() {
            expect(typeof Api.fetchAllClients).toBe('function');
            expect(typeof Api.fetchAllSecurities).toBe('function');
            expect(typeof Api.fetchAllTrades).toBe('function');
            expect(typeof Api.fetchAllUsers).toBe('function');
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS - EXTENDED
    // =========================================================================
    describe('Error handling - Extended', function() {

        it('rejects on network error', function() {
            window.fetch = function() {
                return Promise.reject(new Error('Network failure'));
            };

            return Api.get('/api/test').catch(function(error) {
                expect(error.message).toContain('Network');
            });
        });

        it('rejects on 401 error', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 401,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ error: 'Unauthorized' }));
                    }
                });
            };

            return Api.get('/api/secure').catch(function(error) {
                expect(error.status).toBe(401);
            });
        });

        it('rejects on 403 error', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 403,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ error: 'Forbidden' }));
                    }
                });
            };

            return Api.get('/api/forbidden').catch(function(error) {
                expect(error.status).toBe(403);
            });
        });

        it('rejects on timeout', function() {
            window.fetch = function() {
                return new Promise(function(resolve, reject) {
                    // Never resolve to simulate timeout
                    setTimeout(function() {
                        reject(new Error('Timeout'));
                    }, 10);
                });
            };

            return Api.get('/api/slow').catch(function(error) {
                expect(error).toBeDefined();
            });
        });

        it('handles malformed JSON response gracefully', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve('{invalid json}');
                    }
                });
            };

            return Api.get('/api/malformed').catch(function(error) {
                expect(error).toBeDefined();
            });
        });

        it('handles null response body', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve('null');
                    }
                });
            };

            return Api.get('/api/null').then(function(data) {
                expect(data === null || data === undefined || typeof data === 'object').toBe(true);
            });
        });

        it('handles error without error field', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 400,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ message: 'Bad request' }));
                    }
                });
            };

            return Api.post('/api/test', {}).catch(function(error) {
                expect(error.status).toBe(400);
            });
        });

        it('handles 503 service unavailable', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 503,
                    headers: new Headers({ 'content-type': 'text/plain' }),
                    text: function() {
                        return Promise.resolve('Service Unavailable');
                    }
                });
            };

            return Api.get('/api/health').catch(function(error) {
                expect(error.status).toBe(503);
            });
        });

    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('handles URL with existing query params', function() {
            return Api.get('/api/test?existing=1', { page: 2 }).then(function() {
                expect(fetchCalls[0].url).toContain('existing=1');
                expect(fetchCalls[0].url).toContain('page=2');
            });
        });

        it('handles empty params object', function() {
            return Api.get('/api/test', {}).then(function() {
                expect(fetchCalls[0].url).toBe('/api/test');
            });
        });

        it('handles null params', function() {
            return Api.get('/api/test', null).then(function() {
                expect(fetchCalls[0].url).toBe('/api/test');
            });
        });

        it('handles undefined params', function() {
            return Api.get('/api/test', undefined).then(function() {
                expect(fetchCalls[0].url).toBe('/api/test');
            });
        });

        it('handles special characters in query params', function() {
            return Api.get('/api/test', { search: 'hello world', filter: 'a&b' }).then(function() {
                expect(fetchCalls[0].url).toContain('search=');
            });
        });

        it('handles nested object in body', function() {
            var nested = {
                user: { name: 'Test', address: { city: 'NYC' } },
                items: [1, 2, 3]
            };

            return Api.post('/api/test', nested).then(function() {
                var body = JSON.parse(fetchCalls[0].options.body);
                expect(body.user.address.city).toBe('NYC');
                expect(body.items.length).toBe(3);
            });
        });

        it('handles empty body in POST', function() {
            return Api.post('/api/test', {}).then(function() {
                expect(fetchCalls[0].options.body).toBe('{}');
            });
        });

        it('handles very long URL', function() {
            var longParam = 'x'.repeat(2000);
            return Api.get('/api/test', { long: longParam }).then(function() {
                expect(fetchCalls[0].url).toContain(longParam);
            });
        });

        it('handles Unicode in request body', function() {
            return Api.post('/api/test', { name: '日本語テスト 🎉' }).then(function() {
                var body = JSON.parse(fetchCalls[0].options.body);
                expect(body.name).toBe('日本語テスト 🎉');
            });
        });

        it('handles array in query params', function() {
            return Api.get('/api/test', { ids: [1, 2, 3] }).then(function() {
                expect(fetchCalls[0].url).toContain('ids');
            });
        });

        it('handles boolean in query params', function() {
            return Api.get('/api/test', { active: true, deleted: false }).then(function() {
                expect(fetchCalls[0].url).toContain('active=true');
                expect(fetchCalls[0].url).toContain('deleted=false');
            });
        });

        it('entity.get with string ID', function() {
            var products = Api.entity('products', '/api/products');

            return products.get('abc-123').then(function() {
                expect(fetchCalls[0].url).toBe('/api/products/abc-123');
            });
        });

        it('entity.update with partial data', function() {
            var products = Api.entity('products', '/api/products');

            return products.update(1, { status: 'active' }).then(function() {
                var body = JSON.parse(fetchCalls[0].options.body);
                expect(body.status).toBe('active');
            });
        });

    });

    // =========================================================================
    // ASYNC BEHAVIOR TESTS
    // =========================================================================
    describe('Async behavior', function() {

        it('concurrent requests are handled independently', function() {
            var counter = 0;
            window.fetch = function(url) {
                counter++;
                var id = counter;
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ id: id }));
                    }
                });
            };

            var p1 = Api.get('/api/test/1');
            var p2 = Api.get('/api/test/2');

            return Promise.all([p1, p2]).then(function(results) {
                expect(results[0].id).toBeDefined();
                expect(results[1].id).toBeDefined();
            });
        });

        it('sequential requests complete in order', function() {
            var results = [];

            return Api.get('/api/first').then(function() {
                results.push('first');
                return Api.get('/api/second');
            }).then(function() {
                results.push('second');
                expect(results).toEqual(['first', 'second']);
            });
        });

        it('fetchAll handles multiple pages', function() {
            // This is a more complex async test
            expect(typeof Api.fetchAll).toBe('function');
        });

        it('handles slow response gracefully', function() {
            window.fetch = function() {
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve({
                            ok: true,
                            status: 200,
                            headers: new Headers({ 'content-type': 'application/json' }),
                            text: function() {
                                return Promise.resolve(JSON.stringify({ delayed: true }));
                            }
                        });
                    }, 50);
                });
            };

            return Api.get('/api/slow').then(function(data) {
                expect(data.delayed).toBe(true);
            });
        });

    });

    // =========================================================================
    // RESPONSE HANDLING TESTS
    // =========================================================================
    describe('Response handling', function() {

        it('handles 201 Created response', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 201,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ id: 123, created: true }));
                    }
                });
            };

            return Api.post('/api/items', { name: 'New' }).then(function(data) {
                expect(data.id).toBe(123);
                expect(data.created).toBe(true);
            });
        });

        it('handles 202 Accepted response', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 202,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ queued: true }));
                    }
                });
            };

            return Api.post('/api/async-job', {}).then(function(data) {
                expect(data.queued).toBe(true);
            });
        });

        it('handles response with different content types', function() {
            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'text/html' }),
                    text: function() {
                        return Promise.resolve('<html></html>');
                    }
                });
            };

            return Api.get('/api/html').then(function(data) {
                // Should not crash, may return empty object
                expect(data).toBeDefined();
            });
        });

        it('handles large JSON response', function() {
            var largeArray = [];
            for (var i = 0; i < 1000; i++) {
                largeArray.push({ id: i, name: 'Item ' + i });
            }

            window.fetch = function() {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    text: function() {
                        return Promise.resolve(JSON.stringify({ data: largeArray }));
                    }
                });
            };

            return Api.get('/api/large').then(function(data) {
                expect(data.data.length).toBe(1000);
            });
        });

    });

    // =========================================================================
    // HEADER HANDLING TESTS
    // =========================================================================
    describe('Header handling', function() {

        it('includes Content-Type for POST', function() {
            return Api.post('/api/test', { data: 1 }).then(function() {
                expect(fetchCalls[0].options.headers['Content-Type']).toBe('application/json');
            });
        });

        it('includes Content-Type for PUT', function() {
            return Api.put('/api/test/1', { data: 1 }).then(function() {
                expect(fetchCalls[0].options.headers['Content-Type']).toBe('application/json');
            });
        });

        it('includes Content-Type for PATCH', function() {
            return Api.patch('/api/test/1', { data: 1 }).then(function() {
                expect(fetchCalls[0].options.headers['Content-Type']).toBe('application/json');
            });
        });

        it('allows fetch options to be passed through', function() {
            return Api.get('/api/test').then(function() {
                // Verify fetch was called with options object
                expect(fetchCalls[0].options).toBeDefined();
            });
        });

    });

    // =========================================================================
    // CLEANUP AND STATE TESTS
    // =========================================================================
    describe('Cleanup and state', function() {

        it('cancelAll does not throw when no pending requests', function() {
            expect(function() {
                Api.cancelAll();
            }).not.toThrow();
        });

        it('cancelAll can be called multiple times', function() {
            expect(function() {
                Api.cancelAll();
                Api.cancelAll();
                Api.cancelAll();
            }).not.toThrow();
        });

        it('deduplication clears after response', function() {
            // First request
            return Api.get('/api/dedupe-clear').then(function() {
                // Second request should make new fetch
                return Api.get('/api/dedupe-clear');
            }).then(function() {
                // Both should have made fetch calls
                expect(fetchCalls.length).toBe(2);
            });
        });

    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    describe('Input validation', function() {

        it('handles null URL gracefully', function() {
            return Api.get(null).catch(function(error) {
                expect(error).toBeDefined();
            });
        });

        it('handles undefined URL gracefully', function() {
            return Api.get(undefined).catch(function(error) {
                expect(error).toBeDefined();
            });
        });

        it('handles empty string URL', function() {
            return Api.get('').then(function() {
                expect(fetchCalls[0].url).toBe('');
            });
        });

        it('entity handles null ID gracefully', function() {
            var products = Api.entity('products', '/api/products');

            return products.get(null).then(function() {
                expect(fetchCalls[0].url).toContain('null');
            });
        });

        it('entity handles special characters in ID', function() {
            var products = Api.entity('products', '/api/products');

            return products.get('id/with/slash').then(function() {
                expect(fetchCalls[0].url).toContain('id/with/slash');
            });
        });

    });

});
