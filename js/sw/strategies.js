/**
 * FunkySW.strategies - Service Worker Caching Strategies
 *
 * Composable caching strategy functions for use in service workers.
 * Import via: importScripts('/assets/js/sw/strategies.js');
 *
 * @namespace FunkySW.strategies
 * @version 1.0.1
 *
 * Strategies:
 *   cacheFirst           - Cache first, network fallback (static assets)
 *   networkFirst         - Network first, cache fallback (API data)
 *   staleWhileRevalidate - Return cache, update in background (profiles)
 *   networkOnly          - Always fetch from network (auth)
 *   cacheOnly            - Only return from cache (offline-first)
 *
 * @example
 * importScripts('/assets/js/sw/strategies.js');
 *
 * self.addEventListener('fetch', function(event) {
 *     var strategy = FunkySW.matchRoute(event.request.url, routes);
 *     event.respondWith(FunkySW.strategies[strategy](event.request, options));
 * });
 */
(function(self) {
    'use strict';

    // =========================================================================
    // NAMESPACE SETUP
    // =========================================================================

    self.FunkySW = self.FunkySW || {};
    FunkySW.strategies = FunkySW.strategies || {};

    var DEFAULT_CACHE_NAME = 'funky-cache';
    var DEFAULT_TIMEOUT = 3000;

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Check if a response is cacheable
     * @private
     * @param {Response} response - The response to check
     * @returns {boolean}
     */
    function isCacheable(response) {
        // Don't cache error responses
        if (!response || !response.ok) {
            return false;
        }

        // Don't cache opaque responses in some strategies
        // (they have status 0 and we can't inspect them)
        if (response.type === 'opaque') {
            return true; // Allow but be cautious
        }

        return true;
    }

    /**
     * Safely cache a response
     * @private
     * @param {Cache} cache - The cache to use
     * @param {Request} request - The request key
     * @param {Response} response - The response to cache
     */
    function safeCachePut(cache, request, response) {
        // Only cache GET requests
        if (request.method !== 'GET') {
            return;
        }

        try {
            cache.put(request, response);
        } catch (e) {
            console.warn('[FunkySW] Cache put failed:', e);
        }
    }

    // =========================================================================
    // CACHING STRATEGIES
    // =========================================================================

    /**
     * Cache First Strategy
     *
     * Check cache first, fall back to network.
     * Best for: static assets that rarely change (CSS, JS, images, fonts)
     *
     * @param {Request} request - The fetch request
     * @param {Object} [options] - Strategy options
     * @param {string} [options.cacheName='funky-cache'] - Cache storage name
     * @param {boolean} [options.cache=true] - Whether to cache network responses
     * @returns {Promise<Response>}
     *
     * @example
     * event.respondWith(
     *     FunkySW.strategies.cacheFirst(event.request, { cacheName: 'static-v1' })
     * );
     */
    FunkySW.strategies.cacheFirst = function(request, options) {
        options = options || {};
        var cacheName = options.cacheName || DEFAULT_CACHE_NAME;
        var shouldCache = options.cache !== false;

        return caches.match(request).then(function(cached) {
            if (cached) {
                return cached;
            }

            return fetch(request).then(function(response) {
                if (shouldCache && isCacheable(response)) {
                    var clone = response.clone();
                    caches.open(cacheName).then(function(cache) {
                        safeCachePut(cache, request, clone);
                    });
                }
                return response;
            });
        });
    };

    /**
     * Network First Strategy
     *
     * Try network first, fall back to cache on failure or timeout.
     * Best for: frequently updated content (API data, news, user content)
     *
     * @param {Request} request - The fetch request
     * @param {Object} [options] - Strategy options
     * @param {string} [options.cacheName='funky-cache'] - Cache storage name
     * @param {number} [options.timeout=3000] - Network timeout in ms
     * @param {boolean} [options.cache=true] - Whether to cache network responses
     * @returns {Promise<Response>}
     *
     * @example
     * event.respondWith(
     *     FunkySW.strategies.networkFirst(event.request, {
     *         cacheName: 'api-v1',
     *         timeout: 5000
     *     })
     * );
     */
    FunkySW.strategies.networkFirst = function(request, options) {
        options = options || {};
        var cacheName = options.cacheName || DEFAULT_CACHE_NAME;
        var timeout = options.timeout || DEFAULT_TIMEOUT;
        var shouldCache = options.cache !== false;

        return new Promise(function(resolve, reject) {
            var timedOut = false;
            var resolved = false;

            // Timeout handler - try cache if network is slow
            var timeoutId = setTimeout(function() {
                timedOut = true;
                caches.match(request).then(function(cached) {
                    if (cached && !resolved) {
                        resolved = true;
                        resolve(cached);
                    }
                });
            }, timeout);

            // Try network
            fetch(request)
                .then(function(response) {
                    clearTimeout(timeoutId);

                    if (!resolved) {
                        resolved = true;

                        // Cache successful responses
                        if (shouldCache && isCacheable(response)) {
                            var clone = response.clone();
                            caches.open(cacheName).then(function(cache) {
                                safeCachePut(cache, request, clone);
                            });
                        }

                        resolve(response);
                    }
                })
                .catch(function(error) {
                    clearTimeout(timeoutId);

                    if (!resolved) {
                        // Network failed - try cache
                        caches.match(request).then(function(cached) {
                            if (cached) {
                                resolved = true;
                                resolve(cached);
                            } else {
                                resolved = true;
                                reject(new Error('Network failed and no cache available'));
                            }
                        });
                    }
                });
        });
    };

    /**
     * Stale While Revalidate Strategy
     *
     * Return cached response immediately, fetch and update cache in background.
     * Best for: content that can be slightly stale (user profiles, settings, feeds)
     *
     * @param {Request} request - The fetch request
     * @param {Object} [options] - Strategy options
     * @param {string} [options.cacheName='funky-cache'] - Cache storage name
     * @param {Function} [options.onUpdate] - Callback when cache is updated
     * @returns {Promise<Response>}
     *
     * @example
     * event.respondWith(
     *     FunkySW.strategies.staleWhileRevalidate(event.request, {
     *         cacheName: 'user-data-v1',
     *         onUpdate: function() {
     *             // Notify client that data was updated
     *             self.clients.matchAll().then(function(clients) {
     *                 clients.forEach(function(client) {
     *                     client.postMessage({ type: 'CACHE_UPDATED' });
     *                 });
     *             });
     *         }
     *     })
     * );
     */
    FunkySW.strategies.staleWhileRevalidate = function(request, options) {
        options = options || {};
        var cacheName = options.cacheName || DEFAULT_CACHE_NAME;
        var onUpdate = options.onUpdate;

        return caches.open(cacheName).then(function(cache) {
            return cache.match(request).then(function(cached) {
                // Always fetch to update cache
                var fetchPromise = fetch(request).then(function(response) {
                    if (isCacheable(response)) {
                        var clone = response.clone();
                        cache.put(request, clone).then(function() {
                            if (onUpdate && cached) {
                                onUpdate(request, response);
                            }
                        });
                    }
                    return response;
                }).catch(function(error) {
                    console.warn('[FunkySW] Revalidate fetch failed:', error);
                    // Return cached if fetch fails, otherwise throw
                    if (cached) {
                        return cached;
                    }
                    throw error;
                });

                // Return cached immediately if available, otherwise wait for fetch
                return cached || fetchPromise;
            });
        });
    };

    /**
     * Network Only Strategy
     *
     * Always fetch from network, never use cache.
     * Best for: requests that should never be cached (auth, real-time data, analytics)
     *
     * @param {Request} request - The fetch request
     * @param {Object} [options] - Strategy options (unused, for API consistency)
     * @returns {Promise<Response>}
     *
     * @example
     * event.respondWith(
     *     FunkySW.strategies.networkOnly(event.request)
     * );
     */
    FunkySW.strategies.networkOnly = function(request, options) {
        return fetch(request);
    };

    /**
     * Cache Only Strategy
     *
     * Only return from cache, never fetch from network.
     * Best for: offline-first scenarios with precached content
     *
     * @param {Request} request - The fetch request
     * @param {Object} [options] - Strategy options
     * @param {string} [options.cacheName='funky-cache'] - Cache storage name
     * @param {Response} [options.fallback] - Fallback response if not in cache
     * @returns {Promise<Response>}
     *
     * @example
     * event.respondWith(
     *     FunkySW.strategies.cacheOnly(event.request, {
     *         cacheName: 'offline-v1',
     *         fallback: new Response('Offline', { status: 503 })
     *     })
     * );
     */
    FunkySW.strategies.cacheOnly = function(request, options) {
        options = options || {};
        var cacheName = options.cacheName || DEFAULT_CACHE_NAME;
        var fallback = options.fallback;

        return caches.match(request).then(function(cached) {
            if (cached) {
                return cached;
            }

            if (fallback) {
                return fallback;
            }

            return new Response('Not found in cache', {
                status: 404,
                statusText: 'Not Found',
                headers: { 'Content-Type': 'text/plain' }
            });
        });
    };

    // =========================================================================
    // ROUTE MATCHING
    // =========================================================================

    /**
     * Match a URL to a caching strategy based on path patterns
     *
     * @param {string} url - The URL to match
     * @param {Object} routes - Route patterns mapped to strategy names
     * @param {string} [defaultStrategy='networkFirst'] - Default strategy if no match
     * @returns {string} Strategy name
     *
     * @example
     * var routes = {
     *     '/api/': 'networkFirst',
     *     '/assets/': 'cacheFirst',
     *     '/docs/': 'staleWhileRevalidate',
     *     '/auth/': 'networkOnly'
     * };
     *
     * var strategy = FunkySW.matchRoute(event.request.url, routes);
     * event.respondWith(FunkySW.strategies[strategy](event.request));
     */
    FunkySW.matchRoute = function(url, routes, defaultStrategy) {
        defaultStrategy = defaultStrategy || 'networkFirst';

        if (!routes || typeof routes !== 'object') {
            return defaultStrategy;
        }

        var path;
        try {
            path = new URL(url).pathname;
        } catch (e) {
            // Invalid URL
            return defaultStrategy;
        }

        // Check each route pattern
        for (var pattern in routes) {
            if (routes.hasOwnProperty(pattern)) {
                // Simple prefix matching
                if (path.startsWith(pattern)) {
                    return routes[pattern];
                }

                // Check for glob patterns (*.js, *.css)
                if (pattern.indexOf('*') !== -1) {
                    var regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                    if (regex.test(path)) {
                        return routes[pattern];
                    }
                }
            }
        }

        return defaultStrategy;
    };

    /**
     * Create a route matcher with regex support
     *
     * @param {Array} routeConfigs - Array of route configurations
     * @returns {Function} Matcher function
     *
     * @example
     * var matcher = FunkySW.createRouteMatcher([
     *     { match: /\/api\//, strategy: 'networkFirst', options: { timeout: 5000 } },
     *     { match: /\.(js|css|png|jpg)$/, strategy: 'cacheFirst' },
     *     { match: '/offline.html', strategy: 'cacheOnly' }
     * ]);
     *
     * var result = matcher(event.request.url);
     * event.respondWith(FunkySW.strategies[result.strategy](event.request, result.options));
     */
    FunkySW.createRouteMatcher = function(routeConfigs) {
        return function(url) {
            var path;
            try {
                path = new URL(url).pathname;
            } catch (e) {
                return { strategy: 'networkFirst', options: {} };
            }

            for (var i = 0; i < routeConfigs.length; i++) {
                var config = routeConfigs[i];
                var match = config.match;
                var matched = false;

                if (typeof match === 'string') {
                    matched = path.startsWith(match) || path === match;
                } else if (match instanceof RegExp) {
                    matched = match.test(path);
                } else if (typeof match === 'function') {
                    matched = match(url, path);
                }

                if (matched) {
                    return {
                        strategy: config.strategy || 'networkFirst',
                        options: config.options || {}
                    };
                }
            }

            return { strategy: 'networkFirst', options: {} };
        };
    };

    // =========================================================================
    // VERSION
    // =========================================================================

    FunkySW.strategies.version = '1.0.0';

    console.log('[FunkySW.strategies] v' + FunkySW.strategies.version + ' loaded');

})(self);
