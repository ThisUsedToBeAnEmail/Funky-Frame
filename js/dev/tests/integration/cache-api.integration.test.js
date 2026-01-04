/**
 * Integration Test: Cache + API Data Flow
 *
 * Tests the integration between caching and API requests.
 */

describe('Funky.Integration.Cache.Api', function() {

    var Cache = Funky.Cache;
    var PubSub = Funky.PubSub;
    var originalFetch;
    var apiCalls;

    beforeEach(function() {
        Cache.clear();
        apiCalls = [];
        originalFetch = window.fetch;

        window.fetch = function(url, options) {
            apiCalls.push({ url: url, options: options || {} });

            // Simulate different API responses based on URL
            if (url.includes('/api/users')) {
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            data: [
                                { id: 1, name: 'User 1' },
                                { id: 2, name: 'User 2' }
                            ],
                            total: 2
                        });
                    }
                });
            }

            if (url.includes('/api/user/')) {
                var userId = url.split('/').pop();
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            id: parseInt(userId),
                            name: 'User ' + userId,
                            email: 'user' + userId + '@example.com'
                        });
                    }
                });
            }

            if (url.includes('/api/error')) {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: function() {
                        return Promise.resolve({ error: 'Server error' });
                    }
                });
            }

            return Promise.resolve({
                ok: true,
                json: function() {
                    return Promise.resolve({});
                }
            });
        };
    });

    afterEach(function() {
        window.fetch = originalFetch;
        Cache.clear();
        Cache.setMaxSize(1000); // Reset max size after LRU tests
        PubSub.clear();
    });

    describe('Cache-First Pattern', function() {

        it('returns cached data without API call', function() {
            // Pre-populate cache
            Cache.set('users:list', [{ id: 1, name: 'Cached User' }]);

            var result = null;
            var cacheKey = 'users:list';

            // Try cache first
            var cached = Cache.get(cacheKey);
            if (cached) {
                result = cached;
            }

            expect(result).toBeDefined();
            expect(result[0].name).toBe('Cached User');
            expect(apiCalls.length).toBe(0);
        });

        it('fetches from API when cache miss', function() {
            var cacheKey = 'users:list';
            var result = null;

            // Try cache first
            var cached = Cache.get(cacheKey);
            if (cached) {
                result = cached;
            } else {
                // Fetch from API
                return fetch('/api/users')
                    .then(function(response) {
                        return response.json();
                    })
                    .then(function(data) {
                        Cache.set(cacheKey, data);
                        result = data;
                        return result;
                    })
                    .then(function() {
                        expect(apiCalls.length).toBe(1);
                        expect(result.data.length).toBe(2);
                        expect(Cache.get(cacheKey)).toBeDefined();
                    });
            }
        });

        it('caches API response for subsequent requests', function() {
            var cacheKey = 'users:list';

            // First request - goes to API
            return fetch('/api/users')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    Cache.set(cacheKey, data);
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    var firstCallCount = apiCalls.length;
                    expect(firstCallCount).toBe(1);

                    // Second request - should hit cache
                    var cached = Cache.get(cacheKey);
                    expect(cached).toBeDefined();
                    expect(apiCalls.length).toBe(1); // No additional API call
                });
        });

    });

    describe('Cache Invalidation', function() {

        it('invalidates cache after mutation', function() {
            var cacheKey = 'users:list';

            // Populate cache
            Cache.set(cacheKey, [{ id: 1, name: 'Old Data' }]);

            // Simulate POST/PUT (mutation)
            return fetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({ name: 'New User' })
            })
            .then(function() {
                // Invalidate cache after mutation
                Cache.delete(cacheKey);
                return FunkyTests.delay(50);
            })
            .then(function() {
                expect(Cache.get(cacheKey)).toBeUndefined();
            });
        });

        it('clears related cache entries on mutation', function() {
            // Set multiple related cache entries
            Cache.set('users:list', [{ id: 1 }, { id: 2 }]);
            Cache.set('users:1', { id: 1, name: 'User 1' });
            Cache.set('users:2', { id: 2, name: 'User 2' });
            Cache.set('unrelated:data', { foo: 'bar' });

            // Clear all user-related cache
            Cache.clearPattern('users:');

            expect(Cache.get('users:list')).toBeUndefined();
            expect(Cache.get('users:1')).toBeUndefined();
            expect(Cache.get('users:2')).toBeUndefined();
            expect(Cache.get('unrelated:data')).toBeDefined();
        });

        it('automatically invalidates on TTL expiration', function() {
            // Set with short TTL
            Cache.set('temp:data', { value: 'temporary' }, { ttl: 100 });

            expect(Cache.get('temp:data')).toBeDefined();

            return FunkyTests.delay(150).then(function() {
                expect(Cache.get('temp:data')).toBeUndefined();
            });
        });

    });

    describe('Stale-While-Revalidate Pattern', function() {

        it('returns stale data while refreshing', function() {
            var cacheKey = 'users:swr';
            var staleData = { data: [{ id: 1, name: 'Stale User' }], stale: true };
            var freshData = null;

            // Set stale cache
            Cache.set(cacheKey, staleData, { stale: true });

            // Get stale data immediately
            var immediate = Cache.get(cacheKey);
            expect(immediate.data[0].name).toBe('Stale User');

            // Background refresh
            return fetch('/api/users')
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    freshData = data;
                    Cache.set(cacheKey, data, { stale: false });
                    return FunkyTests.delay(50);
                })
                .then(function() {
                    var updated = Cache.get(cacheKey);
                    expect(updated.data[0].name).toBe('User 1');
                });
        });

    });

    describe('Cache + PubSub Integration', function() {

        it('emits cache events on set', function() {
            var cacheEvents = [];

            PubSub.on('funky:cache:set', function(data) {
                cacheEvents.push({ type: 'set', key: data.key });
            });

            Cache.set('test:key', { value: 'test' });

            expect(cacheEvents.length).toBeGreaterThan(0);
            expect(cacheEvents[0].type).toBe('set');
        });

        it('emits cache events on delete', function() {
            var cacheEvents = [];

            PubSub.on('funky:cache:delete', function(data) {
                cacheEvents.push({ type: 'delete', key: data.key });
            });

            Cache.set('test:key', { value: 'test' });
            Cache.delete('test:key');

            expect(cacheEvents.some(function(e) { return e.type === 'delete'; })).toBe(true);
        });

        it('components can subscribe to cache updates', function() {
            var componentUpdates = [];

            // Simulate component subscribing to cache changes
            PubSub.on('funky:cache:set', function(data) {
                if (data.key.startsWith('users:')) {
                    componentUpdates.push(data);
                }
            });

            Cache.set('users:list', [{ id: 1 }]);
            Cache.set('products:list', [{ id: 1 }]);
            Cache.set('users:1', { id: 1 });

            expect(componentUpdates.length).toBe(2);
        });

    });

    describe('Request Deduplication', function() {

        it('only makes one API call for concurrent requests', function() {
            var pending = {};

            var getCached = function(key, fetchFn) {
                // Check cache first
                var cached = Cache.get(key);
                if (cached) {
                    return Promise.resolve(cached);
                }

                // Check if request is already pending
                if (pending[key]) {
                    return pending[key];
                }

                // Make request and cache the promise
                pending[key] = fetchFn()
                    .then(function(data) {
                        Cache.set(key, data);
                        delete pending[key];
                        return data;
                    });

                return pending[key];
            };

            var fetchUsers = function() {
                return fetch('/api/users').then(function(r) { return r.json(); });
            };

            // Make concurrent requests
            var request1 = getCached('users', fetchUsers);
            var request2 = getCached('users', fetchUsers);
            var request3 = getCached('users', fetchUsers);

            return Promise.all([request1, request2, request3]).then(function(results) {
                // All should get same result
                expect(results[0]).toEqual(results[1]);
                expect(results[1]).toEqual(results[2]);

                // Only one API call should have been made
                expect(apiCalls.length).toBe(1);
            });
        });

    });

    describe('Error Handling', function() {

        it('does not cache failed responses', function() {
            var cacheKey = 'error:data';

            return fetch('/api/error')
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('API error');
                    }
                    return response.json();
                })
                .then(function(data) {
                    Cache.set(cacheKey, data);
                })
                .catch(function() {
                    // Don't cache on error
                })
                .then(function() {
                    expect(Cache.get(cacheKey)).toBeUndefined();
                });
        });

        it('falls back to stale cache on error', function() {
            var cacheKey = 'fallback:data';
            var staleData = { value: 'stale but valid' };

            // Set stale data
            Cache.set(cacheKey, staleData, { stale: true });

            return fetch('/api/error')
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('API error');
                    }
                    return response.json();
                })
                .catch(function() {
                    // Fall back to stale cache
                    return Cache.get(cacheKey);
                })
                .then(function(result) {
                    expect(result.value).toBe('stale but valid');
                });
        });

    });

    describe('Cache Size Management', function() {

        it('respects max cache size', function() {
            // Set small max size
            Cache.setMaxSize(3);

            Cache.set('item:1', { id: 1 });
            Cache.set('item:2', { id: 2 });
            Cache.set('item:3', { id: 3 });
            Cache.set('item:4', { id: 4 }); // Should evict oldest

            expect(Cache.size()).toBeLessThanOrEqual(3);

            // Reset max size for other tests
            Cache.setMaxSize(1000);
        });

        it('evicts least recently used entries', function() {
            // Ensure clean state and set max size
            Cache.clear();
            Cache.setMaxSize(2);

            Cache.set('item:1', { id: 1 });

            // Add small delay to ensure different timestamps
            return FunkyTests.delay(5).then(function() {
                Cache.set('item:2', { id: 2 });

                return FunkyTests.delay(5);
            }).then(function() {
                // Access item:1 to make it recently used (updates accessTime)
                Cache.get('item:1');

                return FunkyTests.delay(5);
            }).then(function() {
                // Add new item, should evict item:2 (least recently used)
                Cache.set('item:3', { id: 3 });

                expect(Cache.get('item:1')).toBeDefined();
                expect(Cache.get('item:2')).toBeUndefined();
                expect(Cache.get('item:3')).toBeDefined();

                // Reset max size for other tests
                Cache.setMaxSize(1000);
            });
        });

    });

    describe('Typed Cache Keys', function() {

        it('supports namespaced cache keys', function() {
            Cache.set('users:list', [{ id: 1 }]);
            Cache.set('users:1:profile', { name: 'User 1' });
            Cache.set('users:1:settings', { theme: 'dark' });

            expect(Cache.get('users:list')).toBeDefined();
            expect(Cache.get('users:1:profile')).toBeDefined();
            expect(Cache.get('users:1:settings')).toBeDefined();
        });

        it('can query keys by prefix', function() {
            Cache.set('users:1', { id: 1 });
            Cache.set('users:2', { id: 2 });
            Cache.set('products:1', { id: 1 });

            var userKeys = Cache.keys('users:');

            expect(userKeys.length).toBe(2);
            expect(userKeys.every(function(k) { return k.startsWith('users:'); })).toBe(true);
        });

    });

    describe('Cache Statistics', function() {

        it('tracks cache hits and misses', function() {
            Cache.resetStats();

            Cache.set('hit:key', { value: 'test' });

            Cache.get('hit:key'); // Hit
            Cache.get('hit:key'); // Hit
            Cache.get('miss:key'); // Miss

            var stats = Cache.getStats();

            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
        });

        it('calculates hit rate', function() {
            Cache.resetStats();

            Cache.set('key', 'value');

            Cache.get('key'); // Hit
            Cache.get('key'); // Hit
            Cache.get('miss'); // Miss
            Cache.get('miss2'); // Miss

            var stats = Cache.getStats();
            expect(stats.hitRate).toBe(0.5); // 2 hits / 4 total
        });

    });

    describe('API Wrapper with Caching', function() {

        it('complete caching API wrapper flow', function() {
            var API = {
                cache: Cache,

                get: function(url, options) {
                    options = options || {};
                    var cacheKey = 'api:' + url;
                    var cacheTtl = options.cacheTtl || 60000;

                    // Check cache
                    if (options.cache !== false) {
                        var cached = this.cache.get(cacheKey);
                        if (cached) {
                            return Promise.resolve(cached);
                        }
                    }

                    // Fetch from API
                    return fetch(url)
                        .then(function(response) {
                            if (!response.ok) {
                                throw new Error('API Error');
                            }
                            return response.json();
                        })
                        .then(function(data) {
                            if (options.cache !== false) {
                                Cache.set(cacheKey, data, { ttl: cacheTtl });
                            }
                            return data;
                        });
                }
            };

            // First call - hits API
            return API.get('/api/users')
                .then(function(data) {
                    expect(apiCalls.length).toBe(1);
                    expect(data.data.length).toBe(2);

                    // Second call - hits cache
                    return API.get('/api/users');
                })
                .then(function(data) {
                    expect(apiCalls.length).toBe(1); // No new API call
                    expect(data.data.length).toBe(2);
                });
        });

    });

});
