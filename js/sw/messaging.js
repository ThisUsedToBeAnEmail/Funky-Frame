/**
 * FunkySW.Messaging - Client ↔ SW Communication
 *
 * Provides a standardized message protocol for communication between
 * the client and service worker using PostMessage.
 * Import via: importScripts('/assets/js/sw/messaging.js');
 *
 * @namespace FunkySW.Messaging
 * @version 1.0.0
 *
 * Message Format:
 *   { type: 'FUNKY_SW_*', data: { ... } }
 *
 * Methods:
 *   broadcast       - Send message to all clients
 *   send            - Send to specific client
 *   handleMessage   - Route incoming messages to handlers
 *   notifyUpdate    - Broadcast that new version is waiting
 *   notifyReady     - Broadcast that SW is ready
 *
 * Standard Handlers:
 *   FUNKY_SW_SKIP_WAITING  - Activate waiting SW
 *   FUNKY_SW_CACHE_CLEAR   - Clear specified cache
 *   FUNKY_SW_NOTIFICATION  - Show notification
 *   FUNKY_SW_PRECACHE      - Precache URLs
 *   FUNKY_SW_CACHE_STATUS  - Get cache status
 *
 * @example Message handler
 * importScripts('/assets/js/sw/messaging.js');
 *
 * self.addEventListener('message', function(event) {
 *     FunkySW.Messaging.handleMessage(event, FunkySW.Messaging.standardHandlers);
 * });
 *
 * @example Activate with ready notification
 * self.addEventListener('activate', function(event) {
 *     event.waitUntil(
 *         clients.claim().then(function() {
 *             return FunkySW.Messaging.notifyReady('1.0.0');
 *         })
 *     );
 * });
 */
(function(self) {
    'use strict';

    // =========================================================================
    // NAMESPACE SETUP
    // =========================================================================

    self.FunkySW = self.FunkySW || {};
    FunkySW.Messaging = FunkySW.Messaging || {};

    // =========================================================================
    // MESSAGE TYPES
    // =========================================================================

    /**
     * Standard message types
     * @readonly
     * @enum {string}
     */
    FunkySW.Messaging.Types = {
        // SW → Client
        READY: 'FUNKY_SW_READY',
        UPDATED: 'FUNKY_SW_UPDATED',
        CACHE_STATUS_RESPONSE: 'FUNKY_SW_CACHE_STATUS_RESPONSE',

        // Client → SW
        SKIP_WAITING: 'FUNKY_SW_SKIP_WAITING',
        CACHE_CLEAR: 'FUNKY_SW_CACHE_CLEAR',
        NOTIFICATION: 'FUNKY_SW_NOTIFICATION',
        PRECACHE: 'FUNKY_SW_PRECACHE',
        CACHE_STATUS: 'FUNKY_SW_CACHE_STATUS'
    };

    // =========================================================================
    // MESSAGING METHODS
    // =========================================================================

    /**
     * Send a message to all connected clients
     *
     * @param {string} type - Message type
     * @param {*} [data] - Message data
     * @returns {Promise<void>}
     *
     * @example
     * FunkySW.Messaging.broadcast('FUNKY_SW_READY', { version: '1.0.0' });
     */
    FunkySW.Messaging.broadcast = function(type, data) {
        return self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            var message = { type: type, data: data };

            clientList.forEach(function(client) {
                try {
                    client.postMessage(message);
                } catch (e) {
                    console.warn('[FunkySW.Messaging] Failed to message client:', e);
                }
            });

            console.log('[FunkySW.Messaging] Broadcast:', type, 'to', clientList.length, 'clients');
        });
    };

    /**
     * Send a message to a specific client
     *
     * @param {Client} client - The client to message
     * @param {string} type - Message type
     * @param {*} [data] - Message data
     *
     * @example
     * // Reply to message sender
     * FunkySW.Messaging.send(event.source, 'FUNKY_SW_RESPONSE', { result: 'ok' });
     */
    FunkySW.Messaging.send = function(client, type, data) {
        if (!client) {
            console.warn('[FunkySW.Messaging] No client to send to');
            return;
        }

        try {
            client.postMessage({ type: type, data: data });
        } catch (e) {
            console.warn('[FunkySW.Messaging] Failed to send:', e);
        }
    };

    /**
     * Handle incoming messages and route to handlers
     *
     * Automatically calls event.waitUntil() for async handlers.
     *
     * @param {MessageEvent} event - The message event
     * @param {Object} handlers - Map of message types to handler functions
     * @returns {*} Handler result if any
     *
     * @example
     * self.addEventListener('message', function(event) {
     *     FunkySW.Messaging.handleMessage(event, {
     *         ...FunkySW.Messaging.standardHandlers,
     *         'MY_CUSTOM_TYPE': function(data, event) {
     *             return doSomething(data);
     *         }
     *     });
     * });
     */
    FunkySW.Messaging.handleMessage = function(event, handlers) {
        if (!event.data) return;

        var type = event.data.type;
        var data = event.data.data;

        if (!type) {
            console.warn('[FunkySW.Messaging] Message missing type:', event.data);
            return;
        }

        console.log('[FunkySW.Messaging] Received:', type);

        if (handlers && handlers[type]) {
            try {
                var result = handlers[type](data, event);

                // If handler returns a promise, wait for it
                if (result && typeof result.then === 'function') {
                    event.waitUntil(result);
                }

                return result;
            } catch (e) {
                console.error('[FunkySW.Messaging] Handler error for', type + ':', e);
            }
        } else {
            console.log('[FunkySW.Messaging] No handler for:', type);
        }
    };

    /**
     * Notify all clients that a new version is waiting
     *
     * Call this when a new SW is installed but not yet activated.
     *
     * @param {string} [version] - Version string of waiting SW
     * @returns {Promise<void>}
     *
     * @example
     * self.addEventListener('install', function(event) {
     *     event.waitUntil(
     *         precacheAssets().then(function() {
     *             FunkySW.Messaging.notifyUpdate('1.1.0');
     *         })
     *     );
     * });
     */
    FunkySW.Messaging.notifyUpdate = function(version) {
        return FunkySW.Messaging.broadcast(FunkySW.Messaging.Types.UPDATED, {
            version: version
        });
    };

    /**
     * Notify all clients that SW is ready and controlling
     *
     * Call this in the activate event after claiming clients.
     *
     * @param {string} [version] - Version string of active SW
     * @returns {Promise<void>}
     *
     * @example
     * self.addEventListener('activate', function(event) {
     *     event.waitUntil(
     *         clients.claim().then(function() {
     *             return FunkySW.Messaging.notifyReady('1.0.0');
     *         })
     *     );
     * });
     */
    FunkySW.Messaging.notifyReady = function(version) {
        return FunkySW.Messaging.broadcast(FunkySW.Messaging.Types.READY, {
            version: version
        });
    };

    // =========================================================================
    // STANDARD HANDLERS
    // =========================================================================

    /**
     * Standard message handlers for common operations
     *
     * Merge with custom handlers:
     * ```javascript
     * var handlers = Object.assign({}, FunkySW.Messaging.standardHandlers, myHandlers);
     * ```
     */
    FunkySW.Messaging.standardHandlers = {
        /**
         * Activate waiting service worker immediately
         * Client sends: { type: 'FUNKY_SW_SKIP_WAITING' }
         */
        'FUNKY_SW_SKIP_WAITING': function(data, event) {
            console.log('[FunkySW.Messaging] Skipping waiting...');
            return self.skipWaiting();
        },

        /**
         * Clear a specific cache
         * Client sends: { type: 'FUNKY_SW_CACHE_CLEAR', data: { cacheName: 'my-cache' } }
         */
        'FUNKY_SW_CACHE_CLEAR': function(data, event) {
            if (!data || !data.cacheName) {
                console.warn('[FunkySW.Messaging] CACHE_CLEAR: No cacheName provided');
                return Promise.resolve(false);
            }

            console.log('[FunkySW.Messaging] Clearing cache:', data.cacheName);
            return caches.delete(data.cacheName).then(function(deleted) {
                // Notify client of result
                if (event.source) {
                    FunkySW.Messaging.send(event.source, 'FUNKY_SW_CACHE_CLEARED', {
                        cacheName: data.cacheName,
                        deleted: deleted
                    });
                }
                return deleted;
            });
        },

        /**
         * Show a notification
         * Client sends: { type: 'FUNKY_SW_NOTIFICATION', data: { title: 'Hi', options: { body: 'World' } } }
         */
        'FUNKY_SW_NOTIFICATION': function(data, event) {
            if (!data || !data.title) {
                console.warn('[FunkySW.Messaging] NOTIFICATION: No title provided');
                return Promise.resolve();
            }

            console.log('[FunkySW.Messaging] Showing notification:', data.title);

            // Use FunkySW.Notifications if available, otherwise direct API
            if (FunkySW.Notifications && FunkySW.Notifications.show) {
                return FunkySW.Notifications.show(data.title, data.options || {});
            }

            return self.registration.showNotification(data.title, data.options || {});
        },

        /**
         * Precache URLs
         * Client sends: { type: 'FUNKY_SW_PRECACHE', data: { cacheName: 'my-cache', urls: [...] } }
         */
        'FUNKY_SW_PRECACHE': function(data, event) {
            if (!data || !data.cacheName || !data.urls || !data.urls.length) {
                console.warn('[FunkySW.Messaging] PRECACHE: Invalid data');
                return Promise.resolve();
            }

            console.log('[FunkySW.Messaging] Precaching', data.urls.length, 'URLs to', data.cacheName);

            // Use FunkySW.CacheManager if available, otherwise direct API
            if (FunkySW.CacheManager && FunkySW.CacheManager.precache) {
                return FunkySW.CacheManager.precache(data.cacheName, data.urls);
            }

            return caches.open(data.cacheName).then(function(cache) {
                return cache.addAll(data.urls);
            });
        },

        /**
         * Get cache status
         * Client sends: { type: 'FUNKY_SW_CACHE_STATUS' }
         * SW replies: { type: 'FUNKY_SW_CACHE_STATUS_RESPONSE', data: { caches: [...] } }
         */
        'FUNKY_SW_CACHE_STATUS': function(data, event) {
            return caches.keys().then(function(cacheNames) {
                var statusPromises = cacheNames.map(function(name) {
                    return caches.open(name).then(function(cache) {
                        return cache.keys().then(function(requests) {
                            return {
                                name: name,
                                count: requests.length,
                                urls: requests.slice(0, 10).map(function(r) { return r.url; }) // First 10
                            };
                        });
                    });
                });

                return Promise.all(statusPromises).then(function(cacheStatus) {
                    var response = {
                        caches: cacheStatus,
                        totalCaches: cacheStatus.length,
                        totalEntries: cacheStatus.reduce(function(sum, c) { return sum + c.count; }, 0)
                    };

                    // Reply to sender
                    if (event.source) {
                        FunkySW.Messaging.send(
                            event.source,
                            FunkySW.Messaging.Types.CACHE_STATUS_RESPONSE,
                            response
                        );
                    }

                    return response;
                });
            });
        }
    };

    /**
     * Create a merged handler object with standard + custom handlers
     *
     * @param {Object} customHandlers - Custom message handlers
     * @returns {Object} Merged handlers
     *
     * @example
     * var handlers = FunkySW.Messaging.createHandlers({
     *     'MY_APP_SYNC': function(data) { return sync(data); }
     * });
     */
    FunkySW.Messaging.createHandlers = function(customHandlers) {
        var merged = {};

        // Copy standard handlers
        for (var type in FunkySW.Messaging.standardHandlers) {
            if (FunkySW.Messaging.standardHandlers.hasOwnProperty(type)) {
                merged[type] = FunkySW.Messaging.standardHandlers[type];
            }
        }

        // Merge custom handlers (override standard if same key)
        if (customHandlers) {
            for (var customType in customHandlers) {
                if (customHandlers.hasOwnProperty(customType)) {
                    merged[customType] = customHandlers[customType];
                }
            }
        }

        return merged;
    };

    // =========================================================================
    // VERSION
    // =========================================================================

    FunkySW.Messaging.version = '1.0.0';

    console.log('[FunkySW.Messaging] v' + FunkySW.Messaging.version + ' loaded');

})(self);
