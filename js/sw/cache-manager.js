/**
 * FunkySW.CacheManager - Cache Lifecycle Utilities
 *
 * Provides cache management utilities for precaching, cleanup, and versioning.
 * Import via: importScripts('/assets/js/sw/cache-manager.js');
 *
 * @namespace FunkySW.CacheManager
 * @version 1.0.0
 *
 * Methods:
 *   precache     - Cache a list of URLs during install
 *   put          - Add a request/response to cache
 *   match        - Find cached response
 *   delete       - Delete a cache
 *   deleteAll    - Delete all caches except specified
 *   cleanup      - Delete old versioned caches
 *   prune        - Remove old entries from a cache
 *   keys         - List cached URLs
 *   size         - Get entry count
 *
 * @example Install event
 * importScripts('/assets/js/sw/cache-manager.js');
 *
 * self.addEventListener('install', function(event) {
 *     event.waitUntil(
 *         FunkySW.CacheManager.precache('static-v1', [
 *             '/',
 *             '/assets/css/app.css',
 *             '/assets/js/app.js'
 *         ])
 *     );
 * });
 *
 * @example Activate event
 * self.addEventListener('activate', function(event) {
 *     event.waitUntil(
 *         FunkySW.CacheManager.cleanup('v1', 'my-app-')
 *     );
 * });
 */
(function(self) {
    'use strict';

    // =========================================================================
    // NAMESPACE SETUP
    // =========================================================================

    self.FunkySW = self.FunkySW || {};
    FunkySW.CacheManager = FunkySW.CacheManager || {};

    var DEFAULT_CACHE_NAME = 'funky-cache';

    // =========================================================================
    // CACHE MANAGER
    // =========================================================================

    /**
     * Precache a list of URLs during install
     *
     * Typically called in the service worker install event.
     * Handles failures gracefully - logs errors but doesn't fail install.
     *
     * @param {string} cacheName - Name of cache to use
     * @param {string[]} urls - Array of URLs to precache
     * @returns {Promise<void>}
     *
     * @example
     * self.addEventListener('install', function(event) {
     *     event.waitUntil(
     *         FunkySW.CacheManager.precache('static-v1', [
     *             '/',
     *             '/assets/css/app.css',
     *             '/assets/js/app.js',
     *             '/offline.html'
     *         ])
     *     );
     * });
     */
    FunkySW.CacheManager.precache = function(cacheName, urls) {
        if (!Array.isArray(urls) || urls.length === 0) {
            return Promise.resolve();
        }

        return caches.open(cacheName).then(function(cache) {
            // Use addAll for atomic caching, but wrap for error handling
            return cache.addAll(urls).catch(function(error) {
                console.warn('[FunkySW.CacheManager] Bulk precache failed, trying individual:', error);

                // Fallback: try caching each URL individually
                return Promise.all(
                    urls.map(function(url) {
                        return cache.add(url).catch(function(err) {
                            console.warn('[FunkySW.CacheManager] Failed to cache:', url, err);
                            // Don't reject - continue with other URLs
                        });
                    })
                );
            });
        }).then(function() {
            console.log('[FunkySW.CacheManager] Precached', urls.length, 'URLs in', cacheName);
        });
    };

    /**
     * Add a request/response pair to a cache
     *
     * @param {string} cacheName - Name of cache
     * @param {Request|string} request - Request or URL
     * @param {Response} response - Response to cache
     * @returns {Promise<void>}
     *
     * @example
     * fetch('/api/data').then(function(response) {
     *     FunkySW.CacheManager.put('api-cache', '/api/data', response.clone());
     *     return response;
     * });
     */
    FunkySW.CacheManager.put = function(cacheName, request, response) {
        return caches.open(cacheName).then(function(cache) {
            return cache.put(request, response);
        });
    };

    /**
     * Find a cached response for a request
     *
     * @param {Request|string} request - Request or URL to match
     * @param {Object} [options] - Match options
     * @param {string} [options.cacheName] - Specific cache to search (optional)
     * @param {boolean} [options.ignoreSearch] - Ignore query string
     * @param {boolean} [options.ignoreMethod] - Ignore request method
     * @param {boolean} [options.ignoreVary] - Ignore Vary header
     * @returns {Promise<Response|undefined>}
     *
     * @example
     * FunkySW.CacheManager.match('/api/data', { cacheName: 'api-cache' })
     *     .then(function(response) {
     *         if (response) {
     *             return response;
     *         }
     *         return fetch('/api/data');
     *     });
     */
    FunkySW.CacheManager.match = function(request, options) {
        options = options || {};

        var matchOptions = {
            ignoreSearch: options.ignoreSearch || false,
            ignoreMethod: options.ignoreMethod || false,
            ignoreVary: options.ignoreVary || false
        };

        if (options.cacheName) {
            return caches.open(options.cacheName).then(function(cache) {
                return cache.match(request, matchOptions);
            });
        }

        return caches.match(request, matchOptions);
    };

    /**
     * Delete a specific cache entirely
     *
     * @param {string} cacheName - Name of cache to delete
     * @returns {Promise<boolean>} - true if deleted
     *
     * @example
     * FunkySW.CacheManager.delete('old-cache-v1').then(function(deleted) {
     *     console.log('Cache deleted:', deleted);
     * });
     */
    FunkySW.CacheManager.delete = function(cacheName) {
        return caches.delete(cacheName).then(function(deleted) {
            if (deleted) {
                console.log('[FunkySW.CacheManager] Deleted cache:', cacheName);
            }
            return deleted;
        });
    };

    /**
     * Delete all caches except those specified
     *
     * @param {string|string[]} [except] - Cache name(s) to keep
     * @returns {Promise<void>}
     *
     * @example
     * // Delete all caches except current version
     * FunkySW.CacheManager.deleteAll(['static-v2', 'api-v2']);
     */
    FunkySW.CacheManager.deleteAll = function(except) {
        except = except || [];
        if (typeof except === 'string') {
            except = [except];
        }

        return caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(name) {
                    if (except.indexOf(name) === -1) {
                        console.log('[FunkySW.CacheManager] Deleting cache:', name);
                        return caches.delete(name);
                    }
                    return Promise.resolve();
                })
            );
        });
    };

    /**
     * Delete old versioned caches during activate
     *
     * Deletes caches that match the prefix but not the current version.
     * Call in the activate event.
     *
     * @param {string} currentVersion - Current version string
     * @param {string} [prefix='funky-'] - Cache name prefix
     * @returns {Promise<void>}
     *
     * @example
     * var CACHE_VERSION = '1.2.0';
     *
     * self.addEventListener('activate', function(event) {
     *     event.waitUntil(
     *         FunkySW.CacheManager.cleanup(CACHE_VERSION, 'my-app-')
     *     );
     * });
     */
    FunkySW.CacheManager.cleanup = function(currentVersion, prefix) {
        prefix = prefix || 'funky-';
        var currentCache = prefix + currentVersion;

        return caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(name) {
                    // Only delete caches that match our prefix but aren't current
                    if (name.startsWith(prefix) && name !== currentCache) {
                        console.log('[FunkySW.CacheManager] Deleting old cache:', name);
                        return caches.delete(name);
                    }
                    return Promise.resolve();
                })
            );
        }).then(function() {
            console.log('[FunkySW.CacheManager] Cleanup complete. Current cache:', currentCache);
        });
    };

    /**
     * Remove old entries from a cache
     *
     * Prunes entries to stay within limits. Removes oldest entries first.
     *
     * @param {string} cacheName - Cache to prune
     * @param {Object} [options] - Prune options
     * @param {number} [options.maxItems] - Maximum entries to keep
     * @param {number} [options.maxAge] - Maximum age in ms (requires timestamp in response)
     * @returns {Promise<number>} - Number of entries deleted
     *
     * @example
     * // Keep only last 50 API responses
     * FunkySW.CacheManager.prune('api-cache', { maxItems: 50 });
     */
    FunkySW.CacheManager.prune = function(cacheName, options) {
        options = options || {};
        var maxItems = options.maxItems;
        var maxAge = options.maxAge;

        return caches.open(cacheName).then(function(cache) {
            return cache.keys().then(function(requests) {
                var toDelete = [];

                // Prune by max items (FIFO - first in, first out)
                if (maxItems && requests.length > maxItems) {
                    var excess = requests.length - maxItems;
                    for (var i = 0; i < excess; i++) {
                        toDelete.push(requests[i]);
                    }
                }

                // Execute deletions
                return Promise.all(
                    toDelete.map(function(request) {
                        return cache.delete(request);
                    })
                ).then(function() {
                    if (toDelete.length > 0) {
                        console.log('[FunkySW.CacheManager] Pruned', toDelete.length, 'entries from', cacheName);
                    }
                    return toDelete.length;
                });
            });
        });
    };

    /**
     * Get all cached URLs in a cache
     *
     * @param {string} cacheName - Cache to inspect
     * @returns {Promise<string[]>} - Array of cached URLs
     *
     * @example
     * FunkySW.CacheManager.keys('static-v1').then(function(urls) {
     *     console.log('Cached URLs:', urls);
     * });
     */
    FunkySW.CacheManager.keys = function(cacheName) {
        return caches.open(cacheName).then(function(cache) {
            return cache.keys().then(function(requests) {
                return requests.map(function(request) {
                    return request.url;
                });
            });
        });
    };

    /**
     * Get the number of entries in a cache
     *
     * @param {string} cacheName - Cache to count
     * @returns {Promise<number>} - Entry count
     *
     * @example
     * FunkySW.CacheManager.size('api-cache').then(function(count) {
     *     console.log('API cache has', count, 'entries');
     * });
     */
    FunkySW.CacheManager.size = function(cacheName) {
        return caches.open(cacheName).then(function(cache) {
            return cache.keys().then(function(requests) {
                return requests.length;
            });
        });
    };

    /**
     * Check if a specific URL is cached
     *
     * @param {string} url - URL to check
     * @param {string} [cacheName] - Specific cache to check (optional)
     * @returns {Promise<boolean>}
     *
     * @example
     * FunkySW.CacheManager.has('/offline.html').then(function(cached) {
     *     if (!cached) {
     *         console.log('Offline page not cached!');
     *     }
     * });
     */
    FunkySW.CacheManager.has = function(url, cacheName) {
        return this.match(url, { cacheName: cacheName }).then(function(response) {
            return !!response;
        });
    };

    /**
     * Get list of all cache names
     *
     * @returns {Promise<string[]>} - Array of cache names
     *
     * @example
     * FunkySW.CacheManager.list().then(function(names) {
     *     console.log('Caches:', names);
     * });
     */
    FunkySW.CacheManager.list = function() {
        return caches.keys();
    };

    /**
     * Remove a specific URL from a cache
     *
     * @param {string} cacheName - Cache name
     * @param {string} url - URL to remove
     * @returns {Promise<boolean>} - true if deleted
     *
     * @example
     * FunkySW.CacheManager.remove('api-cache', '/api/stale-data');
     */
    FunkySW.CacheManager.remove = function(cacheName, url) {
        return caches.open(cacheName).then(function(cache) {
            return cache.delete(url);
        });
    };

    // =========================================================================
    // VERSION
    // =========================================================================

    FunkySW.CacheManager.version = '1.0.0';

    console.log('[FunkySW.CacheManager] v' + FunkySW.CacheManager.version + ' loaded');

})(self);
