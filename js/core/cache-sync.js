/**
 * Funky CacheSync - WebSocket to Cache integration
 * 
 * Listens for WebSocket entity_change events and updates the cache accordingly.
 * Since WebSocket messages only contain { entity, id, action, timestamp } (no data),
 * this module invalidates cache entries so fresh data is fetched via API.
 * 
 * Also triggers DataTable refreshes for real-time UI updates (Phase 8).
 * 
 * Actions:
 * - created: Clear list cache (new item needs to be fetched)
 * - updated: Invalidate specific item (will be refetched on next access)
 * - deleted: Invalidate specific item and remove from list
 * 
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure dependencies exist
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.CacheSync] Registry not found. Load namespace.js first.');
		return;
	}

	if (!Funky.Cache) {
		console.error('[Funky.CacheSync] Cache not found. Load cache.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('CacheSync')) {
		return;
	}

	// Event listeners for cache sync events
	var listeners = {};
	
	// Track whether DataTable integration is enabled
	var dataTableIntegrationEnabled = true;

	/**
	 * Emit an event to listeners
	 */
	function emit(event, data) {
		var handlers = listeners[event];
		if (handlers) {
			handlers.forEach(function(handler) {
				try {
					handler(data);
				} catch (e) {
					console.error('[Funky.CacheSync] Event handler error:', e);
				}
			});
		}
	}

	/**
	 * Notify DataTables of cache invalidation
	 * This triggers smart UI updates (Phase 8)
	 */
	function notifyDataTables(eventData) {
		if (!dataTableIntegrationEnabled) return;
		
		if (Funky.DataTables && typeof Funky.DataTables.handleCacheInvalidation === 'function') {
			try {
				Funky.DataTables.handleCacheInvalidation(eventData);
			} catch (e) {
				console.error('[Funky.CacheSync] DataTables notification error:', e);
			}
		}
	}

	/**
	 * Handle entity_change event from WebSocket
	 * Since WS messages contain no data, we only invalidate - clients refetch via API
	 */
	function handleEntityChange(data) {
		var entity = data.entity;
		var id = data.id;
		var action = data.action;

		console.log('[Funky.CacheSync] Entity change:', entity, id, action);

		var eventData = null;

		switch (action) {
			case 'created':
				// New item - clear list cache so it will be refetched
				Funky.Cache.clear(entity);
				eventData = { type: entity, reason: 'created' };
				emit('funky:cache-sync:invalidated', eventData);
				notifyDataTables(eventData);
				break;

			case 'updated':
				// Item updated - invalidate just this item
				// We only invalidate the specific item (not the entire entity cache)
				// to avoid race conditions from bulk cache clears during updates.
				// The DataTables notification will trigger appropriate UI refresh.
				Funky.Cache.invalidate(entity, id);
				eventData = { type: entity, id: id, reason: 'updated' };
				emit('funky:cache-sync:invalidated', eventData);
				notifyDataTables(eventData);
				break;

			case 'deleted':
				// Item deleted - remove from cache
				Funky.Cache.invalidate(entity, id);
				eventData = { type: entity, id: id, reason: 'deleted' };
				emit('funky:cache-sync:invalidated', eventData);
				notifyDataTables(eventData);
				break;

			default:
				console.warn('[Funky.CacheSync] Unknown action:', action);
		}
	}

	/**
	 * Handle bulk_change event from WebSocket
	 */
	function handleBulkChange(data) {
		var entity = data.entity;

		console.log('[Funky.CacheSync] Bulk change:', entity);

		// Clear entire cache for this entity type
		Funky.Cache.clear(entity);
		var eventData = { type: entity, reason: 'bulk' };
		emit('funky:cache-sync:invalidated', eventData);
		notifyDataTables(eventData);
	}

	/**
	 * Initialize WebSocket listeners
	 */
	function init() {
		if (!Funky.WebSocket) {
			console.warn('[Funky.CacheSync] WebSocket not available, will retry...');
			// Retry after a short delay in case WebSocket loads later
			setTimeout(init, 100);
			return;
		}

		// Listen for entity changes
		Funky.WebSocket.on('entity_change', handleEntityChange);
		Funky.WebSocket.on('bulk_change', handleBulkChange);

		// Clear all caches on reconnect (data may have changed while disconnected)
		Funky.WebSocket.on('connected', function() {
			console.log('[Funky.CacheSync] WebSocket reconnected, clearing stale caches');
			Funky.Cache.clearAll();
		});

		console.log('[Funky.CacheSync] WebSocket listeners registered');
	}

	var CacheSync = {
		/**
		 * Initialize cache sync (call after WebSocket is available)
		 */
		init: init,

		/**
		 * Register an event listener
		 * @param {string} event - Event name ('funky:cache-sync:invalidated')
		 * @param {function} handler - Event handler
		 */
		on: function(event, handler) {
			if (!listeners[event]) {
				listeners[event] = [];
			}
			listeners[event].push(handler);
		},

		/**
		 * Remove an event listener
		 * @param {string} event - Event name
		 * @param {function} handler - Handler to remove
		 */
		off: function(event, handler) {
			if (!listeners[event]) return;
			listeners[event] = listeners[event].filter(function(h) {
				return h !== handler;
			});
		},

		/**
		 * Manually trigger cache invalidation (for testing or special cases)
		 * @param {string} entity - Entity type
		 * @param {string|number} id - Entity ID (optional)
		 * @param {string} reason - Reason for invalidation (default: 'manual')
		 */
		invalidate: function(entity, id, reason) {
			reason = reason || 'manual';
			var eventData;
			if (id) {
				Funky.Cache.invalidate(entity, id);
				eventData = { type: entity, id: id, reason: reason };
			} else {
				Funky.Cache.clear(entity);
				eventData = { type: entity, reason: reason };
			}
			emit('funky:cache-sync:invalidated', eventData);
			notifyDataTables(eventData);
		},

		/**
		 * Trigger a bulk invalidation for an entity type
		 * This always forces a full refresh of DataTables
		 * @param {string} entity - Entity type
		 */
		invalidateBulk: function(entity) {
			Funky.Cache.clear(entity);
			var eventData = { type: entity, reason: 'bulk' };
			emit('funky:cache-sync:invalidated', eventData);
			notifyDataTables(eventData);
		},

		/**
		 * Enable or disable DataTable auto-refresh integration
		 * @param {boolean} enabled - Whether DataTable integration is enabled
		 */
		setDataTableIntegration: function(enabled) {
			dataTableIntegrationEnabled = !!enabled;
			console.log('[Funky.CacheSync] DataTable integration:', dataTableIntegrationEnabled ? 'enabled' : 'disabled');
		},

		/**
		 * Check if DataTable integration is enabled
		 * @returns {boolean}
		 */
		isDataTableIntegrationEnabled: function() {
			return dataTableIntegrationEnabled;
		}
	};

	// Register with Funky namespace
	Funky.register('CacheSync', CacheSync);

	// Auto-initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		// DOM already loaded, init on next tick to ensure WebSocket is registered
		setTimeout(init, 0);
	}

	console.log('[Funky.CacheSync] Initialized (v2.0 with DataTable integration)');

})(window);
