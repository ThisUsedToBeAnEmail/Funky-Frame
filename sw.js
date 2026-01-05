/**
 * Funky Frame Service Worker
 *
 * Provides offline support and desktop notifications for the Funky Framework playground.
 *
 * Features:
 * - Caching strategies for different asset types
 * - Push notification handling
 * - Client-SW messaging
 * - Cache versioning and cleanup
 *
 * @version 1.0.2
 */

// Import FunkySW utilities
importScripts('./js/sw/strategies.js');
importScripts('./js/sw/cache-manager.js');
importScripts('./js/sw/notifications.js');
importScripts('./js/sw/messaging.js');

// =============================================================================
// CONFIGURATION
// =============================================================================

var CACHE_VERSION = '1.0.2.2';
var CACHE_NAME = 'funky-frame-' + CACHE_VERSION;

/**
 * Static assets to precache on install
 */
var STATIC_ASSETS = [
	'/playground/',
	'/playground/index',
	'/playground/canvas'
];

/**
 * Caching strategy routes
 * Maps URL path prefixes to caching strategies
 */
var ROUTES = {
	// Static assets - cache first (rarely change)
	'/css/': 'cacheFirst',
	'/core/': 'cacheFirst',
	'/components/': 'cacheFirst',
	'/icons/': 'cacheFirst',

	// Test files - cache first for fast reloads (330+ files)
	'/js/dev/': 'cacheFirst',

	// Component demos - stale while revalidate (may change, but show cached quickly)
	'/playground/components/': 'staleWhileRevalidate',

	// External CDN resources
	'cdn.jsdelivr.net': 'cacheFirst',
	'cdnjs.cloudflare.com': 'cacheFirst'
};

/**
 * Default notification options
 */
var NOTIFICATION_DEFAULTS = {
	icon: '/icons/icon-192.png',
	badge: '/icons/badge-72.png',
	vibrate: [200, 100, 200]
};

// =============================================================================
// INSTALL EVENT
// =============================================================================

self.addEventListener('install', function(event) {
	console.log('[FunkyFrame SW] Installing v' + CACHE_VERSION);

	event.waitUntil(
		FunkySW.CacheManager.precache(CACHE_NAME, STATIC_ASSETS)
			.then(function() {
				console.log('[FunkyFrame SW] Static assets cached');
				// Activate immediately without waiting for clients to close
				return self.skipWaiting();
			})
			.catch(function(error) {
				console.warn('[FunkyFrame SW] Precache failed:', error);
				// Still skip waiting even if precache fails
				return self.skipWaiting();
			})
	);
});

// =============================================================================
// ACTIVATE EVENT
// =============================================================================

self.addEventListener('activate', function(event) {
	console.log('[FunkyFrame SW] Activating v' + CACHE_VERSION);

	event.waitUntil(
		// Clean up old caches
		FunkySW.CacheManager.cleanup(CACHE_VERSION, 'funky-frame-')
			.then(function() {
				// Take control of all clients immediately
				return self.clients.claim();
			})
			.then(function() {
				// Notify clients that SW is ready
				return FunkySW.Messaging.notifyReady(CACHE_VERSION);
			})
	);
});

// =============================================================================
// FETCH EVENT
// =============================================================================

self.addEventListener('fetch', function(event) {
	var request = event.request;

	// Only handle GET requests
	if (request.method !== 'GET') {
		return;
	}

	// Skip non-http(s) requests
	if (!request.url.startsWith('http')) {
		return;
	}

	// Determine strategy based on URL
	var strategy = FunkySW.matchRoute(request.url, ROUTES, 'networkFirst');

	event.respondWith(
		FunkySW.strategies[strategy](request, { cacheName: CACHE_NAME })
			.catch(function(error) {
				console.warn('[FunkyFrame SW] Fetch failed:', request.url, error);

				// Return offline fallback for navigation requests
				if (request.mode === 'navigate') {
					return caches.match('/playground/')
						.then(function(cached) {
							if (cached) return cached;
							return new Response('Offline - Please check your connection', {
								status: 503,
								statusText: 'Service Unavailable',
								headers: { 'Content-Type': 'text/plain' }
							});
						});
				}

				throw error;
			})
	);
});

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

self.addEventListener('push', function(event) {
	// If no data, show a default notification for testing
	if (!event.data) {
		event.waitUntil(
			self.registration.showNotification('Funky Frame Test', {
				body: 'Push notification is working!',
				icon: NOTIFICATION_DEFAULTS.icon,
				badge: NOTIFICATION_DEFAULTS.badge,
				vibrate: NOTIFICATION_DEFAULTS.vibrate,
				tag: 'test-push'
			})
		);
		return;
	}

	event.waitUntil(
		FunkySW.Notifications.handlePush(event, NOTIFICATION_DEFAULTS)
	);
});

// =============================================================================
// NOTIFICATION CLICK
// =============================================================================

self.addEventListener('notificationclick', function(event) {
	console.log('[FunkyFrame SW] Notification clicked:', event.action);

	event.waitUntil(
		FunkySW.Notifications.handleClick(event, {
			// Handle 'view' action - open the URL from notification data
			'view': function(data) {
				var url = data.url || '/playground/';
				return self.clients.openWindow(url);
			},

			// Handle 'dismiss' action - just close the notification (already done)
			'dismiss': function() {
				return Promise.resolve();
			},

			// Default action when clicking notification body (not an action button)
			'default': function(data) {
				var url = data.url || '/playground/';

				// Try to focus existing window first
				return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
					.then(function(clientList) {
						for (var i = 0; i < clientList.length; i++) {
							var client = clientList[i];
							if ('focus' in client) {
								return client.focus();
							}
						}
						// No existing window, open new one
						return self.clients.openWindow(url);
					});
			}
		})
	);
});

// =============================================================================
// NOTIFICATION CLOSE
// =============================================================================

self.addEventListener('notificationclose', function(event) {
	FunkySW.Notifications.handleClose(event, function(data) {
		console.log('[FunkyFrame SW] Notification dismissed:', data.tag || 'untagged');
	});
});

// =============================================================================
// MESSAGE HANDLING
// =============================================================================

self.addEventListener('message', function(event) {
	// Use standard handlers plus custom ones for funky-frame
	var handlers = FunkySW.Messaging.createHandlers({
		// Playground: Show notification with optional delay (matches public/sw.js)
		'SHOW_NOTIFICATION': function(data) {
			var title = data.title || 'Funky Notification';
			var body = data.body || 'Hello from the Playground!';
			var icon = data.icon || NOTIFICATION_DEFAULTS.icon;
			var delayMs = (data.delay || 0) * 1000;

			var showNotif = function() {
				return self.registration.showNotification(title, {
					body: body,
					icon: icon,
					badge: NOTIFICATION_DEFAULTS.badge,
					vibrate: NOTIFICATION_DEFAULTS.vibrate,
					tag: 'playground-demo-' + Date.now(),
					renotify: true,
					data: { url: '/playground/' }
				});
			};

			if (delayMs > 0) {
				setTimeout(showNotif, delayMs);
				console.log('[FunkyFrame SW] Notification scheduled in', data.delay, 'seconds');
				return Promise.resolve();
			}

			return showNotif();
		},

		// Custom: Show desktop notification from client
		'FUNKY_SHOW_NOTIFICATION': function(data, event) {
			if (!data || !data.title) {
				console.warn('[FunkyFrame SW] SHOW_NOTIFICATION: No title provided');
				return Promise.resolve();
			}

			var options = Object.assign({}, NOTIFICATION_DEFAULTS, data.options || {});

			return FunkySW.Notifications.show(data.title, options)
				.then(function() {
					// Notify the client that notification was shown
					if (event.source) {
						FunkySW.Messaging.send(event.source, 'FUNKY_NOTIFICATION_SHOWN', {
							title: data.title,
							tag: options.tag
						});
					}
				});
		},

		// Custom: Get SW version
		'FUNKY_GET_VERSION': function(data, event) {
			if (event.source) {
				FunkySW.Messaging.send(event.source, 'FUNKY_VERSION', {
					version: CACHE_VERSION
				});
			}
		}
	});

	FunkySW.Messaging.handleMessage(event, handlers);
});

// =============================================================================
// BACKGROUND SYNC (if supported)
// =============================================================================

self.addEventListener('sync', function(event) {
	console.log('[FunkyFrame SW] Background sync:', event.tag);

	// Handle sync events if needed
	if (event.tag === 'playground-sync') {
		event.waitUntil(
			// Placeholder for background sync logic
			Promise.resolve()
		);
	}
});

// =============================================================================
// PERIODIC SYNC (if supported)
// =============================================================================

self.addEventListener('periodicsync', function(event) {
	console.log('[FunkyFrame SW] Periodic sync:', event.tag);

	if (event.tag === 'content-update') {
		event.waitUntil(
			// Refresh cached content periodically
			caches.open(CACHE_NAME).then(function(cache) {
				return cache.addAll(STATIC_ASSETS);
			})
		);
	}
});

console.log('[FunkyFrame SW] Service Worker loaded v' + CACHE_VERSION);
