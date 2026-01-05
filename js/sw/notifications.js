/**
 * FunkySW.Notifications - Push Notification Handlers
 *
 * Provides utilities for handling push notifications in the service worker.
 * Import via: importScripts('/assets/js/sw/notifications.js');
 *
 * @namespace FunkySW.Notifications
 * @version 1.0.2
 *
 * Methods:
 *   show        - Show a notification with defaults
 *   handlePush  - Parse and display push event
 *   handleClick - Route notification click actions
 *   handleClose - Handle notification dismissal
 *   getAll      - Get active notifications
 *   close       - Close notifications by tag
 *
 * @example Push event handler
 * importScripts('/assets/js/sw/notifications.js');
 *
 * self.addEventListener('push', function(event) {
 *     event.waitUntil(
 *         FunkySW.Notifications.handlePush(event, {
 *             icon: '/my-icon.png',
 *             badge: '/my-badge.png'
 *         })
 *     );
 * });
 *
 * @example Click handler with actions
 * self.addEventListener('notificationclick', function(event) {
 *     event.waitUntil(
 *         FunkySW.Notifications.handleClick(event, {
 *             'view': function(data) { return clients.openWindow(data.url); },
 *             'default': function(data) { return clients.openWindow('/'); }
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
    FunkySW.Notifications = FunkySW.Notifications || {};

    // Default notification options
    var DEFAULTS = {
        icon: '/assets/img/icon-192.png',
        badge: '/assets/img/badge-72.png',
        vibrate: [200, 100, 200],
        requireInteraction: false
    };

    // =========================================================================
    // NOTIFICATION METHODS
    // =========================================================================

    /**
     * Show a notification from the service worker
     *
     * Merges provided options with sensible defaults.
     *
     * @param {string} title - Notification title
     * @param {Object} [options] - Notification options
     * @param {string} [options.body] - Body text
     * @param {string} [options.icon] - Icon URL
     * @param {string} [options.badge] - Badge URL (small icon for mobile)
     * @param {string} [options.image] - Large image URL
     * @param {string} [options.tag] - Grouping tag (replaces existing with same tag)
     * @param {Object} [options.data] - Custom data for click handler
     * @param {Array} [options.actions] - Action buttons [{action, title, icon}]
     * @param {boolean} [options.requireInteraction] - Keep visible until interaction
     * @param {boolean} [options.silent] - Suppress sound/vibration
     * @param {Array} [options.vibrate] - Vibration pattern [ms, ms, ...]
     * @param {boolean} [options.renotify] - Vibrate again if same tag
     * @param {number} [options.timestamp] - Timestamp for the notification
     * @returns {Promise<void>}
     *
     * @example
     * FunkySW.Notifications.show('New Message', {
     *     body: 'You have a new message from John',
     *     icon: '/icons/message.png',
     *     tag: 'message-123',
     *     data: { messageId: 123, url: '/messages/123' },
     *     actions: [
     *         { action: 'view', title: 'View', icon: '/icons/view.png' },
     *         { action: 'dismiss', title: 'Dismiss' }
     *     ]
     * });
     */
    FunkySW.Notifications.show = function(title, options) {
        options = options || {};

        // Merge with defaults
        var mergedOptions = {};
        for (var key in DEFAULTS) {
            if (DEFAULTS.hasOwnProperty(key)) {
                mergedOptions[key] = DEFAULTS[key];
            }
        }
        for (var optKey in options) {
            if (options.hasOwnProperty(optKey) && options[optKey] !== undefined) {
                mergedOptions[optKey] = options[optKey];
            }
        }

        console.log('[FunkySW.Notifications] Showing:', title);

        return self.registration.showNotification(title, mergedOptions);
    };

    /**
     * Handle incoming push events with standard parsing
     *
     * Automatically parses JSON or text payloads and displays a notification.
     *
     * @param {PushEvent} event - The push event
     * @param {Object} [defaultOptions] - Default notification options
     * @param {string} [defaultOptions.title] - Default title if none in payload
     * @param {string} [defaultOptions.icon] - Default icon
     * @param {string} [defaultOptions.badge] - Default badge
     * @param {Array} [defaultOptions.actions] - Default actions
     * @param {boolean} [defaultOptions.requireInteraction] - Default interaction requirement
     * @param {Array} [defaultOptions.vibrate] - Default vibration pattern
     * @returns {Promise<void>}
     *
     * @example JSON payload format
     * {
     *     "title": "New Order",
     *     "body": "Order #1234 received",
     *     "icon": "/icons/order.png",
     *     "tag": "order-1234",
     *     "url": "/orders/1234",
     *     "actions": [
     *         { "action": "view", "title": "View Order" }
     *     ]
     * }
     *
     * @example
     * self.addEventListener('push', function(event) {
     *     event.waitUntil(
     *         FunkySW.Notifications.handlePush(event, {
     *             title: 'App Notification',
     *             icon: '/default-icon.png'
     *         })
     *     );
     * });
     */
    FunkySW.Notifications.handlePush = function(event, defaultOptions) {
        defaultOptions = defaultOptions || {};
        var data = {};

        // Parse push data (JSON or text)
        if (event.data) {
            try {
                data = event.data.json();
            } catch (e) {
                // Not JSON, treat as text body
                data = { body: event.data.text() };
            }
        }

        console.log('[FunkySW.Notifications] Push received:', data);

        // Extract notification fields
        var title = data.title || defaultOptions.title || 'Notification';

        var options = {
            body: data.body || data.message || '',
            icon: data.icon || defaultOptions.icon,
            badge: data.badge || defaultOptions.badge,
            image: data.image,
            tag: data.tag || data.id,
            data: data, // Store full payload for click handler
            actions: data.actions || defaultOptions.actions,
            requireInteraction: data.requireInteraction !== undefined
                ? data.requireInteraction
                : defaultOptions.requireInteraction,
            silent: data.silent,
            vibrate: data.vibrate || defaultOptions.vibrate,
            renotify: data.renotify,
            timestamp: data.timestamp
        };

        // Remove undefined values
        for (var key in options) {
            if (options[key] === undefined) {
                delete options[key];
            }
        }

        return FunkySW.Notifications.show(title, options);
    };

    /**
     * Handle notification click with action routing
     *
     * Routes to specific action handlers or a default handler.
     * Automatically closes the notification before handling.
     *
     * @param {NotificationEvent} event - The notification click event
     * @param {Object} [actionHandlers] - Map of action names to handlers
     * @param {Function} [actionHandlers.default] - Default click handler (no action)
     * @param {Function} [actionHandlers.{actionName}] - Handler for specific action
     * @returns {Promise<void>}
     *
     * @example
     * self.addEventListener('notificationclick', function(event) {
     *     event.waitUntil(
     *         FunkySW.Notifications.handleClick(event, {
     *             'view': function(data, event) {
     *                 return clients.openWindow(data.url);
     *             },
     *             'reply': function(data, event) {
     *                 return clients.openWindow('/reply/' + data.id);
     *             },
     *             'default': function(data, event) {
     *                 return clients.openWindow(data.url || '/');
     *             }
     *         })
     *     );
     * });
     */
    FunkySW.Notifications.handleClick = function(event, actionHandlers) {
        actionHandlers = actionHandlers || {};

        var notification = event.notification;
        var action = event.action;
        var data = notification.data || {};

        console.log('[FunkySW.Notifications] Click:', action || 'default', data);

        // Close the notification
        notification.close();

        // Handle specific action
        if (action && actionHandlers[action]) {
            return actionHandlers[action](data, event);
        }

        // Handle default click (no specific action)
        if (actionHandlers.default) {
            return actionHandlers.default(data, event);
        }

        // Fallback: open URL from data
        var url = data.url || data.click_action || data.link || '/';

        return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // Try to focus an existing window with the same URL
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    // Check if URL matches (handle trailing slashes)
                    var clientUrl = client.url.replace(/\/$/, '');
                    var targetUrl = new URL(url, self.location.origin).href.replace(/\/$/, '');

                    if (clientUrl === targetUrl && 'focus' in client) {
                        console.log('[FunkySW.Notifications] Focusing existing window');
                        return client.focus();
                    }
                }

                // No matching window, open new one
                if (self.clients.openWindow) {
                    console.log('[FunkySW.Notifications] Opening new window:', url);
                    return self.clients.openWindow(url);
                }
            });
    };

    /**
     * Handle notification close (dismissal)
     *
     * Useful for analytics or cleanup when a notification is dismissed
     * without being clicked.
     *
     * @param {NotificationEvent} event - The notification close event
     * @param {Function} [callback] - Callback function(data, event)
     * @returns {*} Result of callback if provided
     *
     * @example
     * self.addEventListener('notificationclose', function(event) {
     *     event.waitUntil(
     *         FunkySW.Notifications.handleClose(event, function(data) {
     *             // Send analytics
     *             return fetch('/api/analytics/notification-dismissed', {
     *                 method: 'POST',
     *                 body: JSON.stringify({ tag: data.tag })
     *             });
     *         })
     *     );
     * });
     */
    FunkySW.Notifications.handleClose = function(event, callback) {
        var notification = event.notification;
        var data = notification.data || {};

        console.log('[FunkySW.Notifications] Closed:', notification.tag || 'untagged');

        if (callback && typeof callback === 'function') {
            return callback(data, event);
        }
    };

    /**
     * Get all active notifications
     *
     * Optionally filter by tag.
     *
     * @param {string} [tag] - Filter by tag
     * @returns {Promise<Notification[]>}
     *
     * @example
     * // Get all notifications
     * FunkySW.Notifications.getAll().then(function(notifications) {
     *     console.log('Active notifications:', notifications.length);
     * });
     *
     * // Get notifications with specific tag
     * FunkySW.Notifications.getAll('message').then(function(notifications) {
     *     // Close old message notifications before showing new one
     * });
     */
    FunkySW.Notifications.getAll = function(tag) {
        var options = tag ? { tag: tag } : {};
        return self.registration.getNotifications(options);
    };

    /**
     * Close notifications by tag
     *
     * Closes all notifications matching the specified tag.
     *
     * @param {string} [tag] - Tag to match (undefined closes all)
     * @returns {Promise<number>} Number of notifications closed
     *
     * @example
     * // Close all message notifications
     * FunkySW.Notifications.close('message').then(function(count) {
     *     console.log('Closed', count, 'notifications');
     * });
     */
    FunkySW.Notifications.close = function(tag) {
        return FunkySW.Notifications.getAll(tag).then(function(notifications) {
            notifications.forEach(function(notification) {
                notification.close();
            });
            console.log('[FunkySW.Notifications] Closed', notifications.length, 'notifications');
            return notifications.length;
        });
    };

    /**
     * Update default notification options
     *
     * @param {Object} newDefaults - New default values to merge
     *
     * @example
     * FunkySW.Notifications.setDefaults({
     *     icon: '/my-app-icon.png',
     *     badge: '/my-badge.png',
     *     vibrate: [100, 50, 100]
     * });
     */
    FunkySW.Notifications.setDefaults = function(newDefaults) {
        for (var key in newDefaults) {
            if (newDefaults.hasOwnProperty(key)) {
                DEFAULTS[key] = newDefaults[key];
            }
        }
    };

    /**
     * Get current default options
     *
     * @returns {Object} Current defaults
     */
    FunkySW.Notifications.getDefaults = function() {
        var copy = {};
        for (var key in DEFAULTS) {
            if (DEFAULTS.hasOwnProperty(key)) {
                copy[key] = DEFAULTS[key];
            }
        }
        return copy;
    };

    // =========================================================================
    // VERSION
    // =========================================================================

    FunkySW.Notifications.version = '1.0.2';

    console.log('[FunkySW.Notifications] v' + FunkySW.Notifications.version + ' loaded');

})(self);
