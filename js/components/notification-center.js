/**
 * NotificationCenter - In-app notification system
 *
 * Centralized notification center with bell icon, dropdown panel,
 * badge counts, and real-time updates.
 *
 * @namespace Funky.NotificationCenter
 * @requires Funky.Dom
 * @requires Funky.Events
 * @requires Funky.PubSub
 */
(function(global) {
	'use strict';

	var Funky = global.Funky || {};
	var D = Funky.Dom;
	var E = Funky.Events;

	// =========================================================================
	// PRIVATE STATE
	// =========================================================================

	var _instances = Funky.Registry.createInstanceRegistry('NotificationCenter');
	var _notifications = [];
	var _config = {};
	var _isOpen = false;
	var _elements = {};
	var _currentFilter = 'all';
	var _scrollTracker = null;
	var _page = 1;
	var _hasMore = false;
	var _pollTimer = null;
	var _isLoadingMore = false;
	var _wsSubscriptions = [];
	var _broadcastChannel = null;
	var _desktopPermission = 'default';
	var _audioCache = {};
	var _actionHandlers = {};
	var _focusedIndex = -1;
	var _announcer = null;
	var _keyboardBinding = null;

	// =========================================================================
	// DEFAULT OPTIONS
	// =========================================================================

	var DEFAULTS = {
		container: null,
		api: null,
		websocket: null,
		channel: null,
		maxVisible: 10,
		sound: true,
		soundVolume: 0.5,
		soundUrl: '/assets/sound/notification.mp3',
		sounds: {
			default: '/assets/sound/notification.mp3',
			success: '/assets/sound/success.mp3',
			warning: '/assets/sound/notification.mp3',
			error: '/assets/sound/notification.mp3',
			info: '/assets/sound/notification.mp3'
		},
		desktop: false,
		desktopIcon: '/assets/img/icon-192.png',
		desktopBadge: '/assets/img/badge-72.png',
		desktopTimeout: 5000,
		desktopRequireInteraction: false,
		desktopVibrate: [200, 100, 200],
		pollInterval: 0,
		categories: [],
		autoMarkRead: false,
		groupByCategory: false,
		instanceId: null,
		persistReadState: true,
		loadOnInit: true,
		apiHeaders: {},
		transformResponse: null,
		storageKey: null,
		wsEvents: {
			new: 'notification:new',
			read: 'notification:read',
			remove: 'notification:remove',
			clear: 'notification:clear',
			count: 'notification:count'
		},
		crossTabSync: true,
		defaultActions: ['view', 'dismiss'],
		actionHandlers: {},
		onAction: null,
		confirmDismiss: false,
		markReadOnAction: true
	};

	// =========================================================================
	// PRESENCE INTEGRATION STATE
	// =========================================================================

	var _presenceNotificationsEnabled = false;
	var _presenceOptions = {
		channels: ['*'],
		showJoin: true,
		showLeave: true,
		showTyping: false,
		showStatus: false,
		joinSound: null,
		leaveSound: null
	};
	var _presenceDeliveryEnabled = true;
	var _batchQueue = [];
	var _batchListener = null;
	var _originalAdd = null;

	// =========================================================================
	// PRIVATE HELPERS
	// =========================================================================

	/**
	 * Generate unique ID
	 * @returns {string}
	 */
	function generateId() {
		return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	/**
	 * Get unread notification count
	 * @returns {number}
	 */
	function getUnreadCount() {
		return _notifications.filter(function(n) {
			return !n.read;
		}).length;
	}

	/**
	 * Format timestamp fallback
	 * @param {Date|number} timestamp
	 * @returns {string}
	 */
	function formatTime(timestamp) {
		var date = new Date(timestamp);
		var now = new Date();
		var diff = now - date;

		var minutes = Math.floor(diff / 60000);
		var hours = Math.floor(diff / 3600000);
		var days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return minutes + ' min ago';
		if (hours < 24) return hours + ' hour' + (hours !== 1 ? 's' : '') + ' ago';
		if (days < 7) return days + ' day' + (days !== 1 ? 's' : '') + ' ago';

		return date.toLocaleDateString();
	}

	// =========================================================================
	// DOM BUILDING
	// =========================================================================

	/**
	 * Build trigger button
	 * @returns {FunkyDom}
	 */
	function buildTrigger() {
		var trigger = D.button()
			.class('notification-center__trigger')
			.attr('type', 'button')
			.aria('label', 'Notifications')
			.aria('haspopup', 'true')
			.aria('expanded', 'false')
			.aria('controls', 'notification-dropdown-' + _config.instanceId);

		D.icon('fas fa-bell')
			.aria('hidden', 'true')
			.appendTo(trigger);

		var badge = D.span()
			.class('notification-center__badge notification-center__badge--empty')
			.aria('label', '0 unread notifications')
			.text('0')
			.appendTo(trigger);

		_elements.badge = badge;
		_elements.trigger = trigger;

		return trigger;
	}

	/**
	 * Build dropdown panel
	 * @returns {FunkyDom}
	 */
	function buildDropdown() {
		var dropdown = D.div()
			.class('notification-center__dropdown')
			.id('notification-dropdown-' + _config.instanceId)
			.attr('role', 'region')
			.aria('label', 'Notifications')
			.aria('hidden', 'true')
			.attr('hidden', '');

		// Header
		var header = D.div()
			.class('notification-center__header')
			.appendTo(dropdown);

		D.create('h2')
			.text('Notifications')
			.appendTo(header);

		D.button()
			.class('notification-center__mark-all')
			.attr('type', 'button')
			.data('action', 'mark-all-read')
			.text('Mark all read')
			.appendTo(header);

		// Tabs/Filters
		var tabs = D.create('nav')
			.class('notification-center__tabs')
			.attr('role', 'tablist')
			.appendTo(dropdown);

		var filters = ['all', 'unread'];
		if (_config.categories && _config.categories.length > 0) {
			_config.categories.forEach(function(c) {
				filters.push(c.id || c);
			});
		}

		filters.forEach(function(filter, index) {
			var label = filter.charAt(0).toUpperCase() + filter.slice(1);
			D.button()
				.attr('type', 'button')
				.attr('role', 'tab')
				.aria('selected', index === 0 ? 'true' : 'false')
				.attr('tabindex', index === 0 ? '0' : '-1')
				.data('filter', filter)
				.text(label)
				.appendTo(tabs);
		});

		_elements.tabs = tabs;

		// List container
		var list = D.create('ul')
			.class('notification-center__list')
			.attr('role', 'list')
			.aria('live', 'polite')
			.aria('relevant', 'additions removals')
			.appendTo(dropdown);

		_elements.list = list;

		// Empty state
		var empty = D.div()
			.class('notification-center__empty')
			.attr('hidden', '')
			.appendTo(dropdown);

		D.icon('fas fa-bell-slash')
			.aria('hidden', 'true')
			.appendTo(empty);

		D.create('p')
			.text('No notifications')
			.appendTo(empty);

		_elements.empty = empty;

		// Footer
		var footer = D.div()
			.class('notification-center__footer')
			.appendTo(dropdown);

		D.a()
			.attr('href', '/notifications')
			.text('View all notifications')
			.appendTo(footer);

		_elements.dropdown = dropdown;

		return dropdown;
	}

	/**
	 * Build a single notification item
	 * @param {Object} notification - Notification data
	 * @param {number} index - Item index for roving tabindex
	 * @returns {FunkyDom}
	 */
	function buildNotificationItem(notification, index) {
		var item = D.create('li')
			.class('notification-center__item')
			.attr('role', 'listitem')
			.data('notification-id', notification.id)
			.data('category', notification.category || 'general')
			.attr('tabindex', index === 0 ? '0' : '-1');

		// Unread state
		if (!notification.read) {
			item.classAdd('notification-center__item--unread');
			item.aria('label', 'Unread: ' + notification.title);
		} else {
			item.aria('label', notification.title);
		}

		// Icon
		var iconWrapper = D.div()
			.class('notification-center__icon')
			.appendTo(item);

		var iconClass = notification.icon || 'fa-bell';
		var iconColorClass = notification.iconColor ? 'text-' + notification.iconColor : '';

		D.icon('fas ' + iconClass)
			.classAdd(iconColorClass)
			.aria('hidden', 'true')
			.appendTo(iconWrapper);

		// Content
		var content = D.div()
			.class('notification-center__content')
			.appendTo(item);

		D.create('p')
			.class('notification-center__title')
			.text(notification.title)
			.appendTo(content);

		if (notification.body) {
			D.create('p')
				.class('notification-center__body')
				.text(notification.body)
				.appendTo(content);
		}

		// Time
		var timestamp = notification.timestamp;
		if (timestamp) {
			var timeEl = D.create('time')
				.class('notification-center__time')
				.attr('datetime', new Date(timestamp).toISOString())
				.appendTo(content);

			// Use RelativeTime if available
			if (Funky.RelativeTime && typeof Funky.RelativeTime.format === 'function') {
				timeEl.text(Funky.RelativeTime.format(new Date(timestamp)));
			} else {
				timeEl.text(formatTime(timestamp));
			}
		}

		// Actions
		var actions = D.div()
			.class('notification-center__actions')
			.appendTo(item);

		// View link if href provided
		if (notification.href) {
			D.a()
				.class('notification-center__action')
				.attr('href', notification.href)
				.text('View')
				.appendTo(actions);
		}

		// Custom actions
		if (notification.actions && notification.actions.length > 0) {
			notification.actions.forEach(function(action) {
				if (action.href) {
					D.a()
						.class('notification-center__action')
						.attr('href', action.href)
						.text(action.label)
						.appendTo(actions);
				} else {
					D.button()
						.class('notification-center__action')
						.attr('type', 'button')
						.data('action', action.action)
						.data('action-data', JSON.stringify(action.data || {}))
						.text(action.label)
						.appendTo(actions);
				}
			});
		}

		// Dismiss button
		D.button()
			.class('notification-center__dismiss')
			.attr('type', 'button')
			.data('action', 'dismiss')
			.aria('label', 'Dismiss notification: ' + notification.title)
			.appendTo(actions)
			.append(
				D.icon('fas fa-times')
					.aria('hidden', 'true')
			);

		return item;
	}

	// =========================================================================
	// EVENT HANDLERS
	// =========================================================================

	/**
	 * Handle trigger click
	 * @param {Event} e
	 */
	function handleTriggerClick(e) {
		e.preventDefault();
		e.stopPropagation();
		NotificationCenter.toggle();
	}

	/**
	 * Handle outside click
	 * @param {Event} e
	 */
	function handleOutsideClick(e) {
		if (!_isOpen) return;

		var container = _elements.container;
		if (container && !container.el.contains(e.target)) {
			NotificationCenter.close();
		}
	}

	/**
	 * Handle tab click
	 * @param {Event} e
	 */
	function handleTabClick(e) {
		var tab = e.target.closest('[data-filter]');
		if (!tab) return;

		var filter = tab.getAttribute('data-filter');

		// Update tab states
		var tabs = _elements.tabs.el.querySelectorAll('[role="tab"]');
		tabs.forEach(function(t) {
			var isSelected = t === tab;
			t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
			t.setAttribute('tabindex', isSelected ? '0' : '-1');
		});

		NotificationCenter.filter(filter);
	}

	/**
	 * Handle tab keyboard navigation
	 * @param {Event} e
	 */
	function handleTabKeydown(e) {
		var currentTab = e.target;
		if (currentTab.getAttribute('role') !== 'tab') return;

		var tabs = Array.prototype.slice.call(_elements.tabs.el.querySelectorAll('[role="tab"]'));
		var currentIndex = tabs.indexOf(currentTab);
		var newIndex = currentIndex;

		switch (e.key) {
			case 'ArrowLeft':
				newIndex = currentIndex - 1;
				if (newIndex < 0) newIndex = tabs.length - 1;
				break;
			case 'ArrowRight':
				newIndex = currentIndex + 1;
				if (newIndex >= tabs.length) newIndex = 0;
				break;
			case 'Home':
				newIndex = 0;
				break;
			case 'End':
				newIndex = tabs.length - 1;
				break;
			default:
				return;
		}

		e.preventDefault();

		// Update tabindex
		tabs.forEach(function(tab, idx) {
			tab.setAttribute('tabindex', idx === newIndex ? '0' : '-1');
		});

		// Focus and activate
		tabs[newIndex].focus();
		tabs[newIndex].click();
	}

	/**
	 * Handle mark all read click
	 * @param {Event} e
	 */
	function handleMarkAllRead(e) {
		if (e.target.matches('[data-action="mark-all-read"]')) {
			NotificationCenter.markAllRead();
		}
	}

	/**
	 * Handle escape key
	 * @param {Event} e
	 */
	function handleEscape(e) {
		if (e.key === 'Escape' && _isOpen) {
			NotificationCenter.close();
			if (_elements.trigger && _elements.trigger.el) {
				_elements.trigger.el.focus();
			}
		}
	}

	/**
	 * Handle item click
	 * @param {Event} e
	 */
	function handleItemClick(e) {
		var item = e.target.closest('.notification-center__item');
		if (!item) return;

		var id = item.getAttribute('data-notification-id');
		var notification = NotificationCenter._getById(id);

		if (!notification) return;

		// Check for action button click
		var actionBtn = e.target.closest('[data-action]');

		if (actionBtn) {
			e.preventDefault();
			e.stopPropagation();

			var action = actionBtn.getAttribute('data-action');
			var actionDataStr = actionBtn.getAttribute('data-action-data');
			var actionData = actionDataStr ? JSON.parse(actionDataStr) : {};

			// Confirm dismiss if configured
			if (action === 'dismiss' && _config.confirmDismiss) {
				if (!confirm('Dismiss this notification?')) {
					return;
				}
			}

			NotificationCenter.executeAction(action, notification, actionData);
			return;
		}

		// Check for link click
		var link = e.target.closest('a');
		if (link && link.href) {
			// Let link work naturally, but mark read
			NotificationCenter.markRead(id);

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:click', {
					notification: notification,
					href: link.href
				});
			}
			return;
		}

		// Default click - execute view action
		e.preventDefault();
		NotificationCenter.executeAction('view', notification);
	}

	/**
	 * Handle list keyboard navigation
	 * @param {Event} e
	 */
	function handleListKeydown(e) {
		if (!_isOpen) return;

		var items = _elements.list.el.querySelectorAll('.notification-center__item');
		if (items.length === 0) return;

		var currentItem = document.activeElement.closest('.notification-center__item');
		if (!currentItem) return;

		var currentIndex = Array.prototype.indexOf.call(items, currentItem);
		var newIndex = currentIndex;
		var handled = false;

		switch (e.key) {
			case 'ArrowDown':
			case 'j':
				e.preventDefault();
				newIndex = Math.min(currentIndex + 1, items.length - 1);
				handled = true;
				break;

			case 'ArrowUp':
			case 'k':
				e.preventDefault();
				newIndex = Math.max(currentIndex - 1, 0);
				handled = true;
				break;

			case 'Home':
				e.preventDefault();
				newIndex = 0;
				handled = true;
				break;

			case 'End':
				e.preventDefault();
				newIndex = items.length - 1;
				handled = true;
				break;

			case 'Enter':
			case ' ':
				e.preventDefault();
				var viewId = currentItem.getAttribute('data-notification-id');
				var viewNotif = NotificationCenter._getById(viewId);
				if (viewNotif) {
					NotificationCenter.executeAction('view', viewNotif);
				}
				return;

			case 'Delete':
			case 'Backspace':
				e.preventDefault();
				var delId = currentItem.getAttribute('data-notification-id');
				var delNotif = NotificationCenter._getById(delId);
				if (delNotif) {
					NotificationCenter.executeAction('dismiss', delNotif);
				}
				return;

			case 'r':
			case 'R':
				e.preventDefault();
				var readId = currentItem.getAttribute('data-notification-id');
				var readNotif = NotificationCenter._getById(readId);
				if (readNotif) {
					if (readNotif.read) {
						NotificationCenter.executeAction('mark-unread', readNotif);
					} else {
						NotificationCenter.executeAction('mark-read', readNotif);
					}
				}
				return;
		}

		if (handled) {
			// Update roving tabindex
			Array.prototype.forEach.call(items, function(item, idx) {
				item.setAttribute('tabindex', idx === newIndex ? '0' : '-1');
			});

			// Focus new item
			items[newIndex].focus();
		}
	}

	// =========================================================================
	// BADGE UPDATE
	// =========================================================================

	/**
	 * Update badge count
	 */
	function updateBadge() {
		var count = getUnreadCount();
		var badge = _elements.badge;

		if (!badge) return;

		badge.text(count > 99 ? '99+' : String(count));

		var label = count === 0
			? 'No unread notifications'
			: count + ' unread notification' + (count !== 1 ? 's' : '');

		badge.aria('label', label);

		// Update trigger label too
		if (_elements.trigger) {
			_elements.trigger.aria('label', 'Notifications, ' + label);
		}

		if (count === 0) {
			badge.classAdd('notification-center__badge--empty');
		} else {
			badge.classRemove('notification-center__badge--empty');
		}
	}

	// =========================================================================
	// MAIN MODULE
	// =========================================================================

	var NotificationCenter = {
		/**
		 * Initialize the notification center
		 * @param {Object} options - Configuration options
		 * @returns {Object} this for chaining
		 */
		init: function(options) {
			_config = Object.assign({}, DEFAULTS, options);

			var container = _config.container;
			if (typeof container === 'string') {
				container = D.one(container);
			} else if (container && container.nodeType) {
				container = D.wrap(container);
			}

			if (!container) {
				console.warn('[NotificationCenter] Container not found');
				return this;
			}

			// Generate instance ID if not provided
			if (!_config.instanceId) {
				_config.instanceId = container.data('instance') || generateId();
			}

			_elements.container = container;
			container.classAdd('notification-center');
			container.data('notification-center', '');

			// Build UI
			var trigger = buildTrigger();
			var dropdown = buildDropdown();

			trigger.appendTo(container);
			dropdown.appendTo(container);

			// Bind events
			this._bindEvents();

			// Initialize scroll tracking
			this._initScroll();

			// Register instance for LiveBinding
			_instances.register(_config.instanceId, this);

			// Load notifications on init
			if (_config.loadOnInit) {
				if (_config.api) {
					this.load();
				} else {
					this._loadFromStorage();
				}
			}

			// Start polling if configured (only if no WebSocket)
			if (_config.pollInterval > 0 && !_config.websocket) {
				this._startPolling();
			}

			// Initialize WebSocket if configured
			if (_config.websocket) {
				this._initWebSocket();
			}

			// Initialize cross-tab sync
			this._initCrossTabSync();

			// Load user preferences (sound, desktop, volume)
			this._loadPreferences();

			// Request desktop permission if enabled
			if (_config.desktop) {
				this.requestDesktopPermission();
			}

			// Initialize built-in action handlers
			this._initBuiltinActions();

			// Register custom action handlers from config
			if (_config.actionHandlers) {
				var self = this;
				Object.keys(_config.actionHandlers).forEach(function(action) {
					if (typeof _config.actionHandlers[action] === 'function') {
						_actionHandlers[action] = _config.actionHandlers[action];
					}
				});
			}

			// Set up accessibility
			this._setupAria();
			this._setupFocusTrap();
			this._createAnnouncer();
			this._registerKeyboardShortcuts();

			// Emit initialized event
			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:init', {
					instance: _config.instanceId
				});
			}

			return this;
		},

		/**
		 * Bind event handlers
		 * @private
		 */
		_bindEvents: function() {
			// Trigger click
			_elements.trigger.on('click', handleTriggerClick);

			// Outside click to close
			document.addEventListener('click', handleOutsideClick);

			// Tab filtering
			_elements.tabs.on('click', handleTabClick);
			_elements.tabs.on('keydown', handleTabKeydown);

			// Mark all read
			_elements.dropdown.on('click', handleMarkAllRead);

			// Escape to close
			document.addEventListener('keydown', handleEscape);

			// List item events
			_elements.list.on('click', handleItemClick);
			_elements.list.on('keydown', handleListKeydown);
		},

		/**
		 * Open the dropdown
		 * @returns {Object} this for chaining
		 */
		open: function() {
			if (_isOpen) return this;

			_isOpen = true;
			_elements.dropdown.attrRemove('hidden');
			_elements.dropdown.classAdd('notification-center__dropdown--open');

			// Update ARIA state
			this._updateAriaState(true);

			// Focus management
			this._focusFirst();

			// Emit event
			if (E) {
				E.emit(_elements.container.el, 'funky.notification.open', {});
			}

			return this;
		},

		/**
		 * Close the dropdown
		 * @returns {Object} this for chaining
		 */
		close: function() {
			if (!_isOpen) return this;

			_isOpen = false;
			_elements.dropdown.attr('hidden', '');
			_elements.dropdown.classRemove('notification-center__dropdown--open');

			// Update ARIA state
			this._updateAriaState(false);

			// Restore focus to trigger
			this._restoreFocus();

			// Emit event
			if (E) {
				E.emit(_elements.container.el, 'funky.notification.close', {});
			}

			return this;
		},

		/**
		 * Toggle the dropdown
		 * @returns {Object} this for chaining
		 */
		toggle: function() {
			return _isOpen ? this.close() : this.open();
		},

		/**
		 * Check if dropdown is open
		 * @returns {boolean}
		 */
		isOpen: function() {
			return _isOpen;
		},

		/**
		 * Get unread notification count
		 * @returns {number}
		 */
		getUnreadCount: function() {
			return getUnreadCount();
		},

		/**
		 * Filter notifications by category
		 * @param {string} filter - Filter type ('all', 'unread', or category)
		 * @returns {Object} this for chaining
		 */
		filter: function(filter) {
			_currentFilter = filter;
			this._render();

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:filter', {
					filter: filter,
					count: this._getFilteredNotifications().length
				});
			}

			return this;
		},

		/**
		 * Get current filter
		 * @returns {string} Current filter value
		 */
		getFilter: function() {
			return _currentFilter;
		},

		/**
		 * Add a notification
		 * @param {Object} notification - Notification data
		 * @returns {Object} this for chaining
		 */
		add: function(notification) {
			if (!notification) return this;

			// Generate ID if not provided
			if (!notification.id) {
				notification.id = generateId();
			}

			// Set defaults
			notification.read = notification.read || false;
			notification.timestamp = notification.timestamp || Date.now();

			// Add to beginning
			_notifications.unshift(notification);

			this._render();
			updateBadge();

			// Notify user with sound/desktop if enabled and notification is unread
			if (!notification.read) {
				this._notifyUser(notification);
				// Announce to screen readers
				this._announceNew(notification);
			}

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:add', {
					notification: notification
				});
			}

			return this;
		},

		/**
		 * Mark notification as read
		 * @param {string} id - Notification ID
		 * @returns {Object} this for chaining
		 */
		markRead: function(id) {
			var self = this;
			var notification = this._getById(id);

			if (!notification || notification.read) {
				return this;
			}

			// Optimistic update
			notification.read = true;
			this._render();
			updateBadge();
			this._saveToStorage();

			// Broadcast to other tabs
			this._broadcastChange('read', { id: id });

			// Sync via WebSocket if available
			if (_config.websocket) {
				this._wsSendRead(id);
			}
			// Fallback to API
			else if (_config.api && _config.persistReadState) {
				var url = _config.api + '/' + id + '/read';

				this._apiRequest('POST', url)
					.then(function() {
						if (Funky.PubSub) {
							Funky.PubSub.emit('funky:notification:read', {
								id: id,
								synced: true
							});
						}
					})
					.catch(function(error) {
						console.error('[NotificationCenter] Failed to mark read:', error);
						// Revert on failure
						notification.read = false;
						self._render();
						updateBadge();
						self._saveToStorage();
					});
			} else {
				if (Funky.PubSub) {
					Funky.PubSub.emit('funky:notification:read', {
						id: id,
						synced: false
					});
				}
			}

			return this;
		},

		/**
		 * Mark all notifications as read
		 * @returns {Object} this for chaining
		 */
		markAllRead: function() {
			var self = this;
			var unreadIds = _notifications
				.filter(function(n) { return !n.read; })
				.map(function(n) { return n.id; });

			if (unreadIds.length === 0) {
				return this;
			}

			// Optimistic update
			_notifications.forEach(function(n) {
				n.read = true;
			});
			this._render();
			updateBadge();
			this._saveToStorage();

			// Broadcast to other tabs
			this._broadcastChange('readAll', { ids: unreadIds });

			// Sync via WebSocket if available
			if (_config.websocket) {
				this._wsSendReadAll(unreadIds);
			}
			// Fallback to API
			else if (_config.api && _config.persistReadState) {
				var url = _config.api + '/read-all';

				this._apiRequest('POST', url, { ids: unreadIds })
					.then(function() {
						if (Funky.PubSub) {
							Funky.PubSub.emit('funky:notification:read-all', {
								ids: unreadIds,
								synced: true
							});
						}
					})
					.catch(function(error) {
						console.error('[NotificationCenter] Failed to mark all read:', error);
						// Revert on failure
						unreadIds.forEach(function(id) {
							var n = self._getById(id);
							if (n) n.read = false;
						});
						self._render();
						updateBadge();
						self._saveToStorage();
					});
			} else {
				if (Funky.PubSub) {
					Funky.PubSub.emit('funky:notification:read-all', {
						ids: unreadIds,
						synced: false
					});
				}
			}

			return this;
		},

		/**
		 * Remove a notification
		 * @param {string} id - Notification ID
		 * @returns {Object} this for chaining
		 */
		remove: function(id) {
			var self = this;
			var notification = this._getById(id);

			if (!notification) {
				return this;
			}

			// Store for potential rollback
			var backup = Object.assign({}, notification);
			var index = _notifications.indexOf(notification);

			// Optimistic update
			_notifications.splice(index, 1);
			this._render();
			updateBadge();
			this._saveToStorage();

			// Broadcast to other tabs
			this._broadcastChange('remove', { id: id });

			// Sync via WebSocket if available
			if (_config.websocket) {
				this._wsSendRemove(id);
			}
			// Fallback to API
			else if (_config.api) {
				var url = _config.api + '/' + id;

				this._apiRequest('DELETE', url)
					.then(function() {
						if (Funky.PubSub) {
							Funky.PubSub.emit('funky:notification:remove', {
								id: id,
								synced: true
							});
						}
					})
					.catch(function(error) {
						console.error('[NotificationCenter] Failed to remove:', error);
						// Restore on failure
						_notifications.splice(index, 0, backup);
						self._render();
						updateBadge();
						self._saveToStorage();
					});
			} else {
				if (Funky.PubSub) {
					Funky.PubSub.emit('funky:notification:remove', {
						id: id,
						synced: false
					});
				}
			}

			return this;
		},

		/**
		 * Clear all notifications
		 * @returns {Object} this for chaining
		 */
		clear: function() {
			var self = this;
			var backup = _notifications.slice();

			// Optimistic update
			_notifications = [];
			this._render();
			updateBadge();
			this._saveToStorage();

			// Broadcast to other tabs
			this._broadcastChange('clear', {});

			// Persist to server (WebSocket doesn't typically have a clear, use API)
			if (_config.api) {
				var url = _config.api + '/clear';

				this._apiRequest('POST', url)
					.then(function() {
						if (Funky.PubSub) {
							Funky.PubSub.emit('funky:notification:clear', {
								synced: true
							});
						}
					})
					.catch(function(error) {
						console.error('[NotificationCenter] Failed to clear:', error);
						// Restore on failure
						_notifications = backup;
						self._render();
						updateBadge();
						self._saveToStorage();
					});
			} else {
				if (Funky.PubSub) {
					Funky.PubSub.emit('funky:notification:clear', {
						synced: false
					});
				}
			}

			return this;
		},

		// =====================================================================
		// LIVEBINDING INTERFACE
		// =====================================================================

		/**
		 * Set notification data (LiveBinding interface)
		 * @param {Array} notifications - Array of notification objects
		 */
		setData: function(notifications) {
			_notifications = Array.isArray(notifications) ? notifications : [];
			this._render();
			updateBadge();
		},

		/**
		 * Get current notifications (LiveBinding interface)
		 * @returns {Array}
		 */
		getData: function() {
			return _notifications.slice();
		},

		/**
		 * Add a single notification (LiveBinding interface)
		 * @param {Object} notification - Notification object
		 */
		addItem: function(notification) {
			return this.add(notification);
		},

		/**
		 * Remove a notification (LiveBinding interface)
		 * @param {string} id - Notification ID
		 */
		removeItem: function(id) {
			return this.remove(id);
		},

		/**
		 * Update a notification (LiveBinding interface)
		 * @param {string} id - Notification ID
		 * @param {Object} updates - Properties to update
		 */
		updateItem: function(id, updates) {
			var notification = this._getById(id);

			if (notification) {
				Object.assign(notification, updates);
				this._render();
				updateBadge();
			}

			return this;
		},

		// =====================================================================
		// PRIVATE METHODS
		// =====================================================================

		/**
		 * Get notification by ID
		 * @param {string} id
		 * @returns {Object|null}
		 * @private
		 */
		_getById: function(id) {
			for (var i = 0; i < _notifications.length; i++) {
				if (_notifications[i].id === id) {
					return _notifications[i];
				}
			}
			return null;
		},

		/**
		 * Get filtered notifications based on current filter
		 * @returns {Array}
		 * @private
		 */
		_getFilteredNotifications: function() {
			var filter = _currentFilter || 'all';

			if (filter === 'all') {
				return _notifications;
			}

			if (filter === 'unread') {
				return _notifications.filter(function(n) {
					return !n.read;
				});
			}

			// Category filter
			return _notifications.filter(function(n) {
				return n.category === filter;
			});
		},

		/**
		 * Render notification list
		 * @private
		 */
		_render: function() {
			var list = _elements.list;
			var empty = _elements.empty;

			if (!list) return;

			// Clear existing items
			list.empty();

			// Get filtered notifications
			var filtered = this._getFilteredNotifications();

			// Show empty state if no notifications
			if (filtered.length === 0) {
				empty.attrRemove('hidden');
				list.attr('hidden', '');
				return;
			}

			empty.attr('hidden', '');
			list.attrRemove('hidden');

			// Limit visible notifications
			var visible = filtered.slice(0, _config.maxVisible);

			// Render based on grouping setting
			if (_config.groupByCategory) {
				this._renderGrouped(visible);
			} else {
				this._renderFlat(visible);
			}

			// Show "more" indicator if truncated
			if (filtered.length > _config.maxVisible) {
				var moreCount = filtered.length - _config.maxVisible;
				D.div()
					.class('notification-center__more')
					.attr('role', 'status')
					.text('+ ' + moreCount + ' more')
					.appendTo(list);
			}

			// Update hasMore flag
			_hasMore = filtered.length > _config.maxVisible;
		},

		/**
		 * Render flat list (no grouping)
		 * @param {Array} notifications
		 * @private
		 */
		_renderFlat: function(notifications) {
			var list = _elements.list;

			notifications.forEach(function(notification, index) {
				var item = buildNotificationItem(notification, index);
				item.appendTo(list);
			});
		},

		/**
		 * Render grouped by category
		 * @param {Array} notifications
		 * @private
		 */
		_renderGrouped: function(notifications) {
			var list = _elements.list;
			var groups = {};

			// Group notifications by category
			notifications.forEach(function(notification) {
				var category = notification.category || 'general';
				if (!groups[category]) {
					groups[category] = [];
				}
				groups[category].push(notification);
			});

			// Track overall index for roving tabindex
			var itemIndex = 0;

			// Render each group
			Object.keys(groups).forEach(function(category) {
				// Group header
				D.div()
					.class('notification-center__group-header')
					.attr('role', 'heading')
					.aria('level', '3')
					.text(category.charAt(0).toUpperCase() + category.slice(1))
					.appendTo(list);

				// Group items
				groups[category].forEach(function(notification) {
					var item = buildNotificationItem(notification, itemIndex);
					item.appendTo(list);
					itemIndex++;
				});
			});
		},

		/**
		 * Initialize scroll tracking for infinite scroll
		 * @private
		 */
		_initScroll: function() {
			var list = _elements.list;
			if (!list) return;

			// Add scrollable class
			list.classAdd('notification-center__list--scrollable');

			// Use ScrollTracker if available and API configured
			if (Funky.ScrollTracker && _config.api) {
				var self = this;

				_scrollTracker = Funky.ScrollTracker.create({
					target: list.el,
					namespace: 'notification-list-' + _config.instanceId,
					thresholds: [0.9], // 90% scrolled
					onThreshold: function(data) {
						if (data.ratio >= 0.9 && _hasMore) {
							self._loadMore();
						}
					}
				});
			}
		},

		/**
		 * Load more notifications (for pagination)
		 * @private
		 */
		_loadMore: function() {
			if (!_config.api || !_hasMore) return;

			var self = this;
			_page++;

			// Show loading indicator
			var loadingEl = D.div()
				.class('notification-center__loading')
				.appendTo(_elements.list);

			D.span()
				.class('spinner-border spinner-border-sm')
				.aria('hidden', 'true')
				.appendTo(loadingEl);

			D.span()
				.text(' Loading...')
				.appendTo(loadingEl);

			// Fetch more via API
			var url = _config.api + ((_config.api.indexOf('?') > -1) ? '&' : '?') + 'page=' + _page;

			fetch(url)
				.then(function(response) {
					return response.json();
				})
				.then(function(data) {
					// Remove loading indicator
					loadingEl.remove();

					if (data.notifications && data.notifications.length > 0) {
						// Append new notifications
						data.notifications.forEach(function(notification) {
							_notifications.push(notification);
						});

						// Update hasMore
						_hasMore = data.hasMore || false;

						// Re-render
						self._render();
					} else {
						_hasMore = false;
					}
				})
				.catch(function(err) {
					console.error('[NotificationCenter] Load more failed:', err);
					loadingEl.remove();
					_page--;
				});
		},

		// =====================================================================
		// API METHODS
		// =====================================================================

		/**
		 * Make API request
		 * @param {string} method - HTTP method
		 * @param {string} url - Request URL
		 * @param {Object} body - Request body (optional)
		 * @returns {Promise}
		 * @private
		 */
		_apiRequest: function(method, url, body) {
			var options = {
				method: method,
				headers: Object.assign({
					'Content-Type': 'application/json'
				}, _config.apiHeaders)
			};

			if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
				options.body = JSON.stringify(body);
			}

			// Use Funky.Api if available, otherwise use fetch
			if (Funky.Api && typeof Funky.Api.request === 'function') {
				return Funky.Api.request(method.toLowerCase(), url, body, { headers: _config.apiHeaders });
			}

			return fetch(url, options).then(function(response) {
				if (!response.ok) {
					throw new Error('API request failed: ' + response.status);
				}
				return response.json().catch(function() {
					return {}; // Handle empty responses
				});
			});
		},

		/**
		 * Load notifications from API
		 * @param {Object} options - Load options
		 * @returns {Promise}
		 */
		load: function(options) {
			options = options || {};

			if (!_config.api) {
				console.warn('[NotificationCenter] No API endpoint configured');
				return Promise.resolve([]);
			}

			var self = this;
			var url = _config.api;

			// Add query params
			var params = [];
			if (options.limit) params.push('limit=' + options.limit);
			if (options.offset) params.push('offset=' + options.offset);
			if (options.unread) params.push('unread=1');
			if (options.since) params.push('since=' + options.since);

			if (params.length > 0) {
				url += (url.indexOf('?') > -1 ? '&' : '?') + params.join('&');
			}

			return this._apiRequest('GET', url)
				.then(function(response) {
					var data = response.data || response;

					// Apply transform if provided
					if (typeof _config.transformResponse === 'function') {
						data = _config.transformResponse(data);
					}

					// Handle different response formats
					var notifications = Array.isArray(data) ? data : (data.notifications || data.data || []);

					// Set or append based on options
					if (options.append) {
						notifications.forEach(function(n) {
							// Check if already exists
							if (!self._getById(n.id)) {
								_notifications.push(n);
							}
						});
						self._render();
						updateBadge();
					} else {
						self.setData(notifications);
					}

					// Update hasMore
					if (data.hasMore !== undefined) {
						_hasMore = data.hasMore;
					}

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:notification:loaded', {
							count: notifications.length,
							total: data.total || notifications.length
						});
					}

					return notifications;
				})
				.catch(function(error) {
					console.error('[NotificationCenter] Failed to load notifications:', error);

					if (Funky.PubSub) {
						Funky.PubSub.emit('funky:notification:error', {
							action: 'load',
							error: error
						});
					}

					return [];
				});
		},

		/**
		 * Refresh notifications from API
		 * @returns {Promise}
		 */
		refresh: function() {
			_page = 1;
			return this.load();
		},

		// =====================================================================
		// POLLING
		// =====================================================================

		/**
		 * Start polling for new notifications
		 * @private
		 */
		_startPolling: function() {
			if (!_config.api || !_config.pollInterval || _config.pollInterval < 1000) {
				return;
			}

			this._stopPolling();

			var self = this;
			_pollTimer = setInterval(function() {
				self._poll();
			}, _config.pollInterval);
		},

		/**
		 * Stop polling
		 * @private
		 */
		_stopPolling: function() {
			if (_pollTimer) {
				clearInterval(_pollTimer);
				_pollTimer = null;
			}
		},

		/**
		 * Poll for new notifications
		 * @private
		 */
		_poll: function() {
			var self = this;
			var latestTimestamp = _notifications.length > 0 ? _notifications[0].timestamp : null;

			var url = _config.api;
			if (latestTimestamp) {
				url += (url.indexOf('?') > -1 ? '&' : '?') + 'since=' + latestTimestamp;
			}

			this._apiRequest('GET', url)
				.then(function(response) {
					var data = response.data || response;

					// Apply transform if provided
					if (typeof _config.transformResponse === 'function') {
						data = _config.transformResponse(data);
					}

					var newNotifications = Array.isArray(data) ? data : (data.notifications || data.data || []);

					if (newNotifications.length > 0) {
						// Add new notifications at the beginning
						newNotifications.forEach(function(n) {
							// Check if already exists
							if (!self._getById(n.id)) {
								_notifications.unshift(n);
							}
						});

						self._render();
						updateBadge();

						if (Funky.PubSub) {
							Funky.PubSub.emit('funky:notification:new', {
								notifications: newNotifications,
								count: newNotifications.length
							});
						}
					}
				})
				.catch(function(error) {
					console.error('[NotificationCenter] Poll failed:', error);
				});
		},

		// =====================================================================
		// LOCAL STORAGE
		// =====================================================================

		/**
		 * Save to local storage as fallback
		 * @private
		 */
		_saveToStorage: function() {
			if (_config.api) return; // Don't save to storage when API is configured

			var key = _config.storageKey || ('funky_notifications_' + (_config.instanceId || 'default'));

			try {
				if (Funky.Storage && typeof Funky.Storage.set === 'function') {
					Funky.Storage.set(key, _notifications);
				} else if (typeof localStorage !== 'undefined') {
					localStorage.setItem(key, JSON.stringify(_notifications));
				}
			} catch (e) {
				console.warn('[NotificationCenter] Failed to save to storage:', e);
			}
		},

		/**
		 * Load from local storage as fallback
		 * @returns {boolean} Whether data was loaded
		 * @private
		 */
		_loadFromStorage: function() {
			if (_config.api) return false; // Don't load from storage when API is configured

			var key = _config.storageKey || ('funky_notifications_' + (_config.instanceId || 'default'));
			var saved = null;

			try {
				if (Funky.Storage && typeof Funky.Storage.get === 'function') {
					saved = Funky.Storage.get(key);
				} else if (typeof localStorage !== 'undefined') {
					var raw = localStorage.getItem(key);
					if (raw) {
						saved = JSON.parse(raw);
					}
				}

				if (saved && Array.isArray(saved)) {
					this.setData(saved);
					return true;
				}
			} catch (e) {
				console.warn('[NotificationCenter] Failed to load from storage:', e);
			}

			return false;
		},

		// =====================================================================
		// WEBSOCKET
		// =====================================================================

		/**
		 * Initialize WebSocket connection
		 * @private
		 */
		_initWebSocket: function() {
			var ws = _config.websocket;
			var channel = _config.channel;

			if (!ws) return;

			var self = this;
			var events = _config.wsEvents;

			// Subscribe to notification channel
			if (channel && typeof ws.subscribe === 'function') {
				ws.subscribe(channel);
			}

			// Listen for new notifications
			var onNew = function(data) {
				self._handleWsNew(data);
			};
			if (typeof ws.on === 'function') {
				ws.on(events.new, onNew);
				_wsSubscriptions.push({ event: events.new, handler: onNew });
			}

			// Listen for read updates
			var onRead = function(data) {
				self._handleWsRead(data);
			};
			if (typeof ws.on === 'function') {
				ws.on(events.read, onRead);
				_wsSubscriptions.push({ event: events.read, handler: onRead });
			}

			// Listen for remove updates
			var onRemove = function(data) {
				self._handleWsRemove(data);
			};
			if (typeof ws.on === 'function') {
				ws.on(events.remove, onRemove);
				_wsSubscriptions.push({ event: events.remove, handler: onRemove });
			}

			// Listen for clear updates
			var onClear = function(data) {
				self._handleWsClear(data);
			};
			if (typeof ws.on === 'function') {
				ws.on(events.clear, onClear);
				_wsSubscriptions.push({ event: events.clear, handler: onClear });
			}

			// Listen for count updates (badge only)
			var onCount = function(data) {
				self._handleWsCount(data);
			};
			if (typeof ws.on === 'function') {
				ws.on(events.count, onCount);
				_wsSubscriptions.push({ event: events.count, handler: onCount });
			}
		},

		/**
		 * Cleanup WebSocket subscriptions
		 * @private
		 */
		_destroyWebSocket: function() {
			var ws = _config.websocket;
			if (!ws) return;

			_wsSubscriptions.forEach(function(sub) {
				if (typeof ws.off === 'function') {
					ws.off(sub.event, sub.handler);
				}
			});
			_wsSubscriptions = [];

			// Unsubscribe from channel
			if (_config.channel && typeof ws.unsubscribe === 'function') {
				ws.unsubscribe(_config.channel);
			}
		},

		/**
		 * Handle new notification from WebSocket
		 * @param {Object} data - WebSocket message data
		 * @private
		 */
		_handleWsNew: function(data) {
			var notification = data.notification || data;

			// Validate notification has required fields
			if (!notification.id || !notification.title) {
				console.warn('[NotificationCenter] Invalid notification from WebSocket');
				return;
			}

			// Check for duplicate
			if (this._getById(notification.id)) {
				return;
			}

			// Add to list (this handles rendering and badge update)
			this.addItem(notification);

			// Broadcast to other tabs
			this._broadcastChange('add', { notification: notification });

			// Emit event with source
			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:ws:new', {
					notification: notification,
					source: 'websocket'
				});
			}
		},

		/**
		 * Handle read update from WebSocket
		 * @param {Object} data - WebSocket message data
		 * @private
		 */
		_handleWsRead: function(data) {
			var self = this;
			var id = data.id;
			var ids = data.ids;

			if (ids && Array.isArray(ids)) {
				// Bulk read update
				ids.forEach(function(notifId) {
					var notification = self._getById(notifId);
					if (notification && !notification.read) {
						notification.read = true;
					}
				});
				this._render();
				updateBadge();
			} else if (id) {
				var notification = this._getById(id);
				if (notification && !notification.read) {
					notification.read = true;
					this._render();
					updateBadge();
				}
			}
		},

		/**
		 * Handle remove update from WebSocket
		 * @param {Object} data - WebSocket message data
		 * @private
		 */
		_handleWsRemove: function(data) {
			var id = data.id;
			if (id && this._getById(id)) {
				// Remove without triggering API call
				var index = -1;
				for (var i = 0; i < _notifications.length; i++) {
					if (_notifications[i].id === id) {
						index = i;
						break;
					}
				}
				if (index > -1) {
					_notifications.splice(index, 1);
					this._render();
					updateBadge();
				}
			}
		},

		/**
		 * Handle clear update from WebSocket
		 * @param {Object} data - WebSocket message data
		 * @private
		 */
		_handleWsClear: function(data) {
			_notifications = [];
			this._render();
			updateBadge();
		},

		/**
		 * Handle count update from WebSocket
		 * @param {Object} data - WebSocket message data
		 * @private
		 */
		_handleWsCount: function(data) {
			var count = data.count;
			if (typeof count === 'number' && _elements.badge) {
				_elements.badge.text(count > 99 ? '99+' : String(count));

				var label = count === 0
					? 'No unread notifications'
					: count + ' unread notification' + (count !== 1 ? 's' : '');
				_elements.badge.aria('label', label);

				if (_elements.trigger) {
					_elements.trigger.aria('label', 'Notifications, ' + label);
				}

				if (count === 0) {
					_elements.badge.classAdd('notification-center__badge--empty');
				} else {
					_elements.badge.classRemove('notification-center__badge--empty');
				}
			}
		},

		/**
		 * Send read acknowledgment via WebSocket
		 * @param {string} id - Notification ID
		 * @private
		 */
		_wsSendRead: function(id) {
			var ws = _config.websocket;
			if (!ws || typeof ws.send !== 'function') return;

			ws.send({
				type: _config.wsEvents.read,
				id: id
			});
		},

		/**
		 * Send bulk read acknowledgment via WebSocket
		 * @param {Array} ids - Notification IDs
		 * @private
		 */
		_wsSendReadAll: function(ids) {
			var ws = _config.websocket;
			if (!ws || typeof ws.send !== 'function') return;

			ws.send({
				type: _config.wsEvents.read,
				ids: ids
			});
		},

		/**
		 * Send remove notification via WebSocket
		 * @param {string} id - Notification ID
		 * @private
		 */
		_wsSendRemove: function(id) {
			var ws = _config.websocket;
			if (!ws || typeof ws.send !== 'function') return;

			ws.send({
				type: _config.wsEvents.remove,
				id: id
			});
		},

		// =====================================================================
		// CROSS-TAB SYNC
		// =====================================================================

		/**
		 * Initialize cross-tab sync via BroadcastChannel
		 * @private
		 */
		_initCrossTabSync: function() {
			if (!_config.crossTabSync) return;
			if (typeof BroadcastChannel === 'undefined') return;

			var self = this;
			var channelName = 'funky_notifications_' + (_config.instanceId || 'default');

			try {
				_broadcastChannel = new BroadcastChannel(channelName);

				_broadcastChannel.onmessage = function(event) {
					var data = event.data;
					if (!data || !data.type) return;

					switch (data.type) {
						case 'add':
							if (data.notification && !self._getById(data.notification.id)) {
								// Add without broadcasting again
								if (!data.notification.id) {
									data.notification.id = generateId();
								}
								data.notification.read = data.notification.read || false;
								data.notification.timestamp = data.notification.timestamp || Date.now();
								_notifications.unshift(data.notification);
								self._render();
								updateBadge();
							}
							break;
						case 'read':
							if (data.id) {
								var notification = self._getById(data.id);
								if (notification && !notification.read) {
									notification.read = true;
									self._render();
									updateBadge();
								}
							}
							break;
						case 'readAll':
							_notifications.forEach(function(n) {
								n.read = true;
							});
							self._render();
							updateBadge();
							break;
						case 'remove':
							if (data.id) {
								var idx = -1;
								for (var i = 0; i < _notifications.length; i++) {
									if (_notifications[i].id === data.id) {
										idx = i;
										break;
									}
								}
								if (idx > -1) {
									_notifications.splice(idx, 1);
									self._render();
									updateBadge();
								}
							}
							break;
						case 'clear':
							_notifications = [];
							self._render();
							updateBadge();
							break;
					}
				};
			} catch (e) {
				console.warn('[NotificationCenter] Failed to initialize BroadcastChannel:', e);
			}
		},

		/**
		 * Broadcast change to other tabs
		 * @param {string} type - Change type (add, read, readAll, remove, clear)
		 * @param {Object} data - Additional data
		 * @private
		 */
		_broadcastChange: function(type, data) {
			if (!_broadcastChannel) return;

			try {
				_broadcastChannel.postMessage(Object.assign({ type: type }, data || {}));
			} catch (e) {
				// Ignore broadcast errors
			}
		},

		/**
		 * Cleanup cross-tab sync
		 * @private
		 */
		_destroyCrossTabSync: function() {
			if (_broadcastChannel) {
				try {
					_broadcastChannel.close();
				} catch (e) {
					// Ignore close errors
				}
				_broadcastChannel = null;
			}
		},

		// =====================================================================
		// DESKTOP NOTIFICATIONS
		// =====================================================================

		/**
		 * Request desktop notification permission
		 * Uses Funky.ServiceWorker if available, falls back to direct API
		 * @returns {Promise<string>} Permission state
		 */
		requestDesktopPermission: function() {
			// Use Funky.ServiceWorker if available
			if (Funky.ServiceWorker && Funky.ServiceWorker.requestPermission) {
				return Funky.ServiceWorker.requestPermission().then(function(permission) {
					_desktopPermission = permission;
					return permission;
				});
			}

			// Fallback to direct Notification API
			if (!('Notification' in window)) {
				console.warn('[NotificationCenter] Desktop notifications not supported');
				return Promise.resolve('unsupported');
			}

			if (Notification.permission === 'granted') {
				_desktopPermission = 'granted';
				return Promise.resolve('granted');
			}

			if (Notification.permission === 'denied') {
				_desktopPermission = 'denied';
				return Promise.resolve('denied');
			}

			return Notification.requestPermission().then(function(permission) {
				_desktopPermission = permission;
				return permission;
			});
		},

		/**
		 * Check if desktop notifications are enabled and permitted
		 * @returns {boolean}
		 */
		hasDesktopPermission: function() {
			if (!_config.desktop) return false;

			// Use Funky.ServiceWorker if available
			if (Funky.ServiceWorker && Funky.ServiceWorker.getPermission) {
				return Funky.ServiceWorker.getPermission() === 'granted';
			}

			return 'Notification' in window && Notification.permission === 'granted';
		},

		/**
		 * Get current permission state
		 * @returns {string}
		 */
		getDesktopPermission: function() {
			// Use Funky.ServiceWorker if available
			if (Funky.ServiceWorker && Funky.ServiceWorker.getPermission) {
				return Funky.ServiceWorker.getPermission();
			}

			if (!('Notification' in window)) return 'unsupported';
			return Notification.permission;
		},

		/**
		 * Show a desktop notification
		 * Uses Funky.ServiceWorker for reliable delivery with fallback to direct API
		 * @param {Object} options - Notification options
		 * @param {boolean} [options.force] - Force show even if global desktop is disabled
		 * @returns {Promise<boolean>|Notification|null}
		 */
		showDesktop: function(options) {
			// Check permission - allow force override of _config.desktop check
			var hasPermission = options && options.force
				? this.getDesktopPermission() === 'granted'
				: this.hasDesktopPermission();

			if (!hasPermission) {
				return Promise.resolve(false);
			}

			var title = options.title || 'Notification';
			var self = this;

			// Build notification options
			var notifOptions = {
				body: options.body || '',
				icon: options.icon || _config.desktopIcon,
				badge: options.badge || _config.desktopBadge,
				tag: options.tag || 'funky-notification',
				requireInteraction: options.requireInteraction || _config.desktopRequireInteraction,
				vibrate: options.vibrate || _config.desktopVibrate,
				silent: true,  // We handle sound separately
				data: {
					notificationId: options.id,
					category: options.category,
					url: options.href || options.url
				}
			};

			// Option 1: Use Funky.ServiceWorker (preferred - works in all contexts)
			if (Funky.ServiceWorker && Funky.ServiceWorker.isReady && Funky.ServiceWorker.isReady()) {
				return Funky.ServiceWorker.showNotification(title, notifOptions)
					.then(function() {
						return true;
					})
					.catch(function() {
						// Fall through to direct API
						return self._showDirectNotification(title, notifOptions, options);
					});
			}

			// Option 2: Direct Notification API (fallback)
			return this._showDirectNotification(title, notifOptions, options);
		},

		/**
		 * Show notification using direct Notification API
		 * @param {string} title - Notification title
		 * @param {Object} notifOptions - Notification options
		 * @param {Object} originalOptions - Original options with callbacks
		 * @returns {Promise<boolean>}
		 * @private
		 */
		_showDirectNotification: function(title, notifOptions, originalOptions) {
			var self = this;

			try {
				var notification = new Notification(title, {
					body: notifOptions.body,
					icon: notifOptions.icon,
					tag: notifOptions.tag,
					requireInteraction: notifOptions.requireInteraction,
					silent: true
				});

				// Auto-close
				if (_config.desktopTimeout > 0) {
					setTimeout(function() {
						notification.close();
					}, _config.desktopTimeout);
				}

				// Click handler
				notification.onclick = function(event) {
					event.preventDefault();
					window.focus();

					var href = originalOptions.href || originalOptions.url;
					if (href) {
						if (Funky.SPA && typeof Funky.SPA.go === 'function') {
							Funky.SPA.go(href);
						} else {
							window.location.href = href;
						}
					}

					if (typeof originalOptions.onClick === 'function') {
						originalOptions.onClick(event);
					}

					notification.close();
				};

				return Promise.resolve(true);
			} catch (error) {
				console.error('[NotificationCenter] Desktop notification failed:', error);
				return Promise.resolve(false);
			}
		},

		// =====================================================================
		// SOUND
		// =====================================================================

		/**
		 * Play notification sound
		 * @param {string} [type='default'] - Sound type (default, success, warning, error, info)
		 */
		playSound: function(type) {
			if (!_config.sound) return;

			type = type || 'default';

			// Use Funky.Audio if available (for unified audio management)
			if (Funky.Audio && typeof Funky.Audio.play === 'function') {
				var soundFile = type === 'default' ? 'notification.mp3' : (type + '.mp3');
				Funky.Audio.play(soundFile, {
					volume: _config.soundVolume,
					bypass: true  // Play regardless of theme
				});
				return;
			}

			// Fallback to native Audio API
			var url = _config.sounds[type] || _config.sounds.default || _config.soundUrl;
			if (!url) return;

			// Use cached audio or create new
			var audio = _audioCache[url];
			if (!audio) {
				audio = new Audio(url);
				_audioCache[url] = audio;
			}

			// Reset and play
			audio.currentTime = 0;
			audio.volume = _config.soundVolume;

			audio.play().catch(function(error) {
				// Browser may block autoplay - this is expected
				console.debug('[NotificationCenter] Sound blocked:', error.message);
			});
		},

		/**
		 * Set sound volume
		 * @param {number} volume - Volume level (0-1)
		 * @returns {Object} this for chaining
		 */
		setSoundVolume: function(volume) {
			_config.soundVolume = Math.max(0, Math.min(1, volume));
			return this;
		},

		/**
		 * Enable/disable sound
		 * @param {boolean} enabled
		 * @returns {Object} this for chaining
		 */
		setSound: function(enabled) {
			_config.sound = !!enabled;
			return this;
		},

		/**
		 * Notify user of new notification (sound + desktop)
		 * @param {Object} notification - Notification object
		 * @private
		 */
		_notifyUser: function(notification) {
			// Skip if page is visible and dropdown is open
			if (document.visibilityState === 'visible' && _isOpen) {
				return;
			}

			// Play sound
			if (_config.sound && notification.sound !== false) {
				var soundType = notification.sound || notification.iconColor || 'default';
				this.playSound(soundType);
			}

			// Show desktop notification
			// Triggers if: global desktop enabled OR notification.desktop === true
			var shouldShowDesktop = (_config.desktop && notification.desktop !== false) || notification.desktop === true;
			if (shouldShowDesktop) {
				var self = this;
				this.showDesktop({
					title: notification.title,
					body: notification.body,
					icon: notification.desktopIcon || _config.desktopIcon,
					tag: 'funky-notif-' + notification.id,
					href: notification.href,
					force: notification.desktop === true,  // Force if explicitly requested
					onClick: function() {
						self.markRead(notification.id);
					}
				});
			}

			// Vibrate on mobile (if supported and notification allows it)
			if (notification.vibrate !== false && 'vibrate' in navigator) {
				try {
					navigator.vibrate([100, 50, 100]);
				} catch (e) {
					// Ignore vibration errors
				}
			}
		},

		// =====================================================================
		// SETTINGS
		// =====================================================================

		/**
		 * Update notification settings
		 * @param {Object} settings - Settings to update
		 * @returns {Object} this for chaining
		 */
		setSettings: function(settings) {
			if (settings.sound !== undefined) {
				_config.sound = !!settings.sound;
			}
			if (settings.soundVolume !== undefined) {
				_config.soundVolume = Math.max(0, Math.min(1, settings.soundVolume));
			}
			if (settings.desktop !== undefined) {
				_config.desktop = !!settings.desktop;
				if (_config.desktop) {
					this.requestDesktopPermission();
				}
			}

			// Save to preferences if available
			this._savePreferences();

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:settings', {
					sound: _config.sound,
					soundVolume: _config.soundVolume,
					desktop: _config.desktop
				});
			}

			return this;
		},

		/**
		 * Get current settings
		 * @returns {Object}
		 */
		getSettings: function() {
			return {
				sound: _config.sound,
				soundVolume: _config.soundVolume,
				desktop: _config.desktop,
				desktopPermission: this.getDesktopPermission()
			};
		},

		/**
		 * Load settings from preferences
		 * @private
		 */
		_loadPreferences: function() {
			if (!Funky.Preferences) return;

			try {
				var soundEnabled = Funky.Preferences.get('notifications.sound');
				if (soundEnabled !== undefined) {
					_config.sound = !!soundEnabled;
				}

				var volume = Funky.Preferences.get('notifications.volume');
				if (volume !== undefined) {
					_config.soundVolume = Math.max(0, Math.min(1, parseFloat(volume)));
				}

				var desktopEnabled = Funky.Preferences.get('notifications.desktop');
				if (desktopEnabled !== undefined) {
					_config.desktop = !!desktopEnabled;
				}
			} catch (e) {
				console.warn('[NotificationCenter] Failed to load preferences:', e);
			}
		},

		/**
		 * Save settings to preferences
		 * @private
		 */
		_savePreferences: function() {
			if (!Funky.Preferences) return;

			try {
				if (typeof Funky.Preferences.set === 'function') {
					Funky.Preferences.set('notifications.sound', _config.sound);
					Funky.Preferences.set('notifications.volume', _config.soundVolume);
					Funky.Preferences.set('notifications.desktop', _config.desktop);
				}
			} catch (e) {
				console.warn('[NotificationCenter] Failed to save preferences:', e);
			}
		},

		// =====================================================================
		// ACTION HANDLERS
		// =====================================================================

		/**
		 * Register a custom action handler
		 * @param {string} action - Action name
		 * @param {Function} handler - Handler function(notification, actionData)
		 * @returns {Object} this for chaining
		 */
		registerAction: function(action, handler) {
			if (typeof handler !== 'function') {
				console.warn('[NotificationCenter] Invalid handler for action:', action);
				return this;
			}

			_actionHandlers[action] = handler;
			return this;
		},

		/**
		 * Unregister an action handler
		 * @param {string} action - Action name
		 * @returns {Object} this for chaining
		 */
		unregisterAction: function(action) {
			delete _actionHandlers[action];
			return this;
		},

		/**
		 * Get registered action handlers
		 * @returns {Object}
		 */
		getActionHandlers: function() {
			return Object.assign({}, _actionHandlers);
		},

		/**
		 * Initialize built-in action handlers
		 * @private
		 */
		_initBuiltinActions: function() {
			var self = this;

			// View action - navigate to href
			_actionHandlers['view'] = function(notification) {
				if (notification.href) {
					if (Funky.SPA && typeof Funky.SPA.go === 'function') {
						Funky.SPA.go(notification.href);
					} else {
						window.location.href = notification.href;
					}
				}
				self.close();
			};

			// Dismiss action - remove notification
			_actionHandlers['dismiss'] = function(notification) {
				self.remove(notification.id);
			};

			// Mark read action
			_actionHandlers['mark-read'] = function(notification) {
				self.markRead(notification.id);
			};

			// Mark unread action
			_actionHandlers['mark-unread'] = function(notification) {
				self.updateItem(notification.id, { read: false });
			};

			// Open in new tab
			_actionHandlers['open-new-tab'] = function(notification) {
				if (notification.href) {
					window.open(notification.href, '_blank', 'noopener');
				}
			};
		},

		/**
		 * Execute an action on a notification
		 * @param {string} action - Action name
		 * @param {Object} notification - Notification object
		 * @param {Object} [actionData] - Additional action data
		 * @returns {Object} this for chaining
		 */
		executeAction: function(action, notification, actionData) {
			actionData = actionData || {};

			// Check for custom handler first, then config handlers
			var handler = _actionHandlers[action] || (_config.actionHandlers && _config.actionHandlers[action]);

			if (handler) {
				try {
					handler.call(this, notification, actionData);
				} catch (error) {
					console.error('[NotificationCenter] Action handler error:', error);
				}
			}

			// Global callback
			if (typeof _config.onAction === 'function') {
				_config.onAction.call(this, {
					action: action,
					notification: notification,
					data: actionData
				});
			}

			// Emit event
			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:action', {
					action: action,
					notification: notification,
					data: actionData
				});
			}

			// Auto mark read on action (unless action is mark-unread)
			if (_config.markReadOnAction && action !== 'mark-unread' && !notification.read) {
				this.markRead(notification.id);
			}

			return this;
		},

		/**
		 * Execute action on multiple notifications
		 * @param {string} action - Action name
		 * @param {Array} ids - Notification IDs
		 * @param {Object} [actionData] - Additional action data
		 * @returns {Object} this for chaining
		 */
		bulkAction: function(action, ids, actionData) {
			var self = this;

			if (!Array.isArray(ids) || ids.length === 0) {
				return this;
			}

			ids.forEach(function(id) {
				var notification = self._getById(id);
				if (notification) {
					self.executeAction(action, notification, actionData);
				}
			});

			if (Funky.PubSub) {
				Funky.PubSub.emit('funky:notification:bulk-action', {
					action: action,
					ids: ids,
					count: ids.length
				});
			}

			return this;
		},

		/**
		 * Execute action on all notifications
		 * @param {string} action - Action name
		 * @param {Object} [actionData] - Additional action data
		 * @returns {Object} this for chaining
		 */
		actionAll: function(action, actionData) {
			var ids = _notifications.map(function(n) { return n.id; });
			return this.bulkAction(action, ids, actionData);
		},

		/**
		 * Execute action on filtered notifications
		 * @param {string} action - Action name
		 * @param {string|Function} filter - Filter name or function
		 * @param {Object} [actionData] - Additional action data
		 * @returns {Object} this for chaining
		 */
		actionFiltered: function(action, filter, actionData) {
			var filtered;

			if (typeof filter === 'function') {
				filtered = _notifications.filter(filter);
			} else if (filter === 'unread') {
				filtered = _notifications.filter(function(n) { return !n.read; });
			} else if (filter === 'read') {
				filtered = _notifications.filter(function(n) { return n.read; });
			} else {
				// Category filter
				filtered = _notifications.filter(function(n) {
					return n.category === filter;
				});
			}

			var ids = filtered.map(function(n) { return n.id; });
			return this.bulkAction(action, ids, actionData);
		},

		/**
		 * Add action button to notification dynamically
		 * @param {string} notificationId - Notification ID
		 * @param {Object} action - Action definition
		 * @returns {Object} this for chaining
		 */
		addActionButton: function(notificationId, action) {
			var notification = this._getById(notificationId);
			if (!notification) return this;

			// Update notification actions
			notification.actions = notification.actions || [];
			notification.actions.push(action);

			// Re-render if currently displayed
			this._render();

			return this;
		},

		/**
		 * Remove action button from notification
		 * @param {string} notificationId - Notification ID
		 * @param {string} actionId - Action identifier
		 * @returns {Object} this for chaining
		 */
		removeActionButton: function(notificationId, actionId) {
			var notification = this._getById(notificationId);
			if (!notification || !notification.actions) return this;

			notification.actions = notification.actions.filter(function(a) {
				return a.action !== actionId && a.id !== actionId;
			});

			this._render();

			return this;
		},

		// =====================================================================
		// ACCESSIBILITY
		// =====================================================================

		/**
		 * Set up ARIA attributes on component elements
		 * @private
		 */
		_setupAria: function() {
			var trigger = _elements.trigger;
			var dropdown = _elements.dropdown;
			var list = _elements.list;

			if (!trigger || !dropdown || !list) return;

			// Trigger button - already set in buildTrigger, but ensure consistency
			trigger
				.aria('haspopup', 'true')
				.aria('expanded', 'false')
				.aria('controls', 'notification-dropdown-' + _config.instanceId);

			// Dropdown region - already set in buildDropdown
			dropdown
				.id('notification-dropdown-' + _config.instanceId)
				.attr('role', 'region')
				.aria('label', 'Notifications')
				.aria('hidden', 'true');

			// List - already set in buildDropdown
			list
				.attr('role', 'list')
				.aria('live', 'polite')
				.aria('relevant', 'additions removals');

			// Update badge with count
			this._updateBadgeAria();
		},

		/**
		 * Update ARIA state on open/close
		 * @param {boolean} isOpen
		 * @private
		 */
		_updateAriaState: function(isOpen) {
			if (_elements.trigger) {
				_elements.trigger.aria('expanded', isOpen ? 'true' : 'false');
			}
			if (_elements.dropdown) {
				_elements.dropdown.aria('hidden', isOpen ? 'false' : 'true');
			}
		},

		/**
		 * Update badge ARIA label
		 * @private
		 */
		_updateBadgeAria: function() {
			var count = getUnreadCount();
			var label = count === 0
				? 'No unread notifications'
				: count + ' unread notification' + (count !== 1 ? 's' : '');

			if (_elements.badge) {
				_elements.badge.aria('label', label);
			}

			// Also update trigger label
			if (_elements.trigger) {
				_elements.trigger.aria('label', 'Notifications, ' + label);
			}
		},

		/**
		 * Set up focus trap in dropdown
		 * @private
		 */
		_setupFocusTrap: function() {
			var dropdown = _elements.dropdown;
			if (!dropdown) return;

			dropdown.on('keydown', function(e) {
				if (e.key !== 'Tab' || !_isOpen) return;

				var focusable = dropdown.el.querySelectorAll(
					'button:not([disabled]), [href], input:not([disabled]), ' +
					'select:not([disabled]), textarea:not([disabled]), ' +
					'[tabindex]:not([tabindex="-1"])'
				);

				if (focusable.length === 0) return;

				var firstFocusable = focusable[0];
				var lastFocusable = focusable[focusable.length - 1];

				if (e.shiftKey) {
					// Shift+Tab: if on first element, wrap to last
					if (document.activeElement === firstFocusable) {
						e.preventDefault();
						lastFocusable.focus();
					}
				} else {
					// Tab: if on last element, wrap to first
					if (document.activeElement === lastFocusable) {
						e.preventDefault();
						firstFocusable.focus();
					}
				}
			});
		},

		/**
		 * Focus first notification item or fallback element
		 * @private
		 */
		_focusFirst: function() {
			// Guard against uninitialized elements
			if (!_elements.list || !_elements.list.el) {
				return;
			}

			var firstItem = D.one('.notification-center__item', _elements.list.el);
			if (firstItem && firstItem.el) {
				firstItem.el.focus();
				_focusedIndex = 0;
			} else if (_elements.dropdown && _elements.dropdown.el) {
				// Focus mark all read button if no items
				var markAllBtn = D.one('.notification-center__mark-all', _elements.dropdown.el);
				if (markAllBtn && markAllBtn.el) {
					markAllBtn.el.focus();
				}
			}
		},

		/**
		 * Restore focus to trigger after close
		 * @private
		 */
		_restoreFocus: function() {
			if (_elements.trigger) {
				_elements.trigger.el.focus();
			}
			_focusedIndex = -1;
		},

		/**
		 * Create live region for screen reader announcements
		 * @private
		 */
		_createAnnouncer: function() {
			if (_announcer) return;

			_announcer = D.div()
				.class('notification-center__announcer sr-only')
				.attr('role', 'status')
				.aria('live', 'polite')
				.aria('atomic', 'true')
				.appendTo(document.body);
		},

		/**
		 * Announce message to screen readers
		 * @param {string} message - Message to announce
		 */
		announce: function(message) {
			if (!_announcer) {
				this._createAnnouncer();
			}

			// Clear and set to trigger announcement
			_announcer.text('');

			setTimeout(function() {
				_announcer.text(message);
			}, 100);
		},

		/**
		 * Announce new notification to screen readers
		 * @param {Object} notification
		 * @private
		 */
		_announceNew: function(notification) {
			var message = 'New notification: ' + notification.title;
			if (notification.body) {
				message += '. ' + notification.body;
			}
			this.announce(message);
		},

		/**
		 * Register global keyboard shortcuts
		 * @private
		 */
		_registerKeyboardShortcuts: function() {
			var self = this;

			// Global Alt+N to toggle notifications
			if (Funky.Keyboard && typeof Funky.Keyboard.register === 'function') {
				_keyboardBinding = Funky.Keyboard.register({
					key: 'n',
					alt: true,
					scope: 'global',
					description: 'Toggle notification center',
					group: 'Notifications',
					handler: function() {
						self.toggle();
					}
				});
			}
		},

		/**
		 * Unregister global keyboard shortcuts
		 * @private
		 */
		_unregisterKeyboardShortcuts: function() {
			// _keyboardBinding is the unregister function returned by Keyboard.register()
			if (_keyboardBinding && typeof _keyboardBinding === 'function') {
				_keyboardBinding();
				_keyboardBinding = null;
			}
		},

		// =====================================================================
		// INSTANCE ACCESS
		// =====================================================================

		/**
		 * Get instance by ID
		 * @param {string} instanceId
		 * @returns {Object|null}
		 */
		getInstance: function(instanceId) {
			return _instances.get(instanceId);
		},

		/**
		 * Instance registry for LiveBinding
		 */
		_instances: _instances,

		/**
		 * Destroy the notification center
		 */
		destroy: function() {
			// Stop polling
			this._stopPolling();

			// Cleanup WebSocket
			this._destroyWebSocket();

			// Cleanup cross-tab sync
			this._destroyCrossTabSync();

			// Remove event listeners
			if (_elements.trigger) {
				_elements.trigger.off('click', handleTriggerClick);
			}
			document.removeEventListener('click', handleOutsideClick);
			document.removeEventListener('keydown', handleEscape);

			// Destroy scroll tracker
			if (_scrollTracker && typeof _scrollTracker.destroy === 'function') {
				_scrollTracker.destroy();
				_scrollTracker = null;
			}

			// Remove from instances
			if (_config.instanceId && _instances.has(_config.instanceId)) {
				_instances.unregister(_config.instanceId);
			}

			// Clear DOM
			if (_elements.container) {
				_elements.container.empty();
				_elements.container.classRemove('notification-center');
				_elements.container.attrRemove('data-notification-center');
			}

			// Remove announcer from DOM
			if (_announcer) {
				_announcer.remove();
			}

			// Unregister keyboard shortcuts
			this._unregisterKeyboardShortcuts();

			// Reset state
			_notifications = [];
			_elements = {};
			_isOpen = false;
			_currentFilter = 'all';
			_page = 1;
			_hasMore = false;
			_pollTimer = null;
			_isLoadingMore = false;
			_wsSubscriptions = [];
			_broadcastChannel = null;
			_desktopPermission = 'default';
			_audioCache = {};
			_actionHandlers = {};
			_focusedIndex = -1;
			_announcer = null;
			_keyboardBinding = null;
			_config = {};
		},

		/**
		 * Destroy all notification center instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		}
	};

	// =========================================================================
	// PRESENCE INTEGRATION
	// =========================================================================

	/**
	 * Enable presence notifications
	 * @param {Object} options - Configuration options
	 * @param {Array} options.channels - Channels to watch (default: ['*'] for all)
	 * @param {boolean} options.showJoin - Show join notifications (default: true)
	 * @param {boolean} options.showLeave - Show leave notifications (default: true)
	 * @param {boolean} options.showTyping - Show typing notifications (default: false)
	 * @param {boolean} options.showStatus - Show status change notifications (default: false)
	 * @param {string} options.joinSound - Sound for user joins
	 * @param {string} options.leaveSound - Sound for user leaves
	 * @returns {Object} NotificationCenter for chaining
	 */
	NotificationCenter.enablePresenceNotifications = function(options) {
		if (!Funky.Presence) {
			console.warn('[NotificationCenter] Funky.Presence not available');
			return this;
		}

		options = options || {};
		_presenceNotificationsEnabled = true;

		_presenceOptions = {
			channels: options.channels || ['*'],
			showJoin: options.showJoin !== false,
			showLeave: options.showLeave !== false,
			showTyping: options.showTyping || false,
			showStatus: options.showStatus || false,
			joinSound: options.joinSound || null,
			leaveSound: options.leaveSound || null
		};

		// Subscribe to presence events
		Funky.Presence.on('user:join', _handlePresenceJoin);
		Funky.Presence.on('user:leave', _handlePresenceLeave);
		Funky.Presence.on('status', _handlePresenceStatus);
		Funky.Presence.on('typing:start', _handlePresenceTyping);

		console.log('[NotificationCenter] Presence notifications enabled');
		return this;
	};

	/**
	 * Disable presence notifications
	 * @returns {Object} NotificationCenter for chaining
	 */
	NotificationCenter.disablePresenceNotifications = function() {
		if (!Funky.Presence) return this;

		_presenceNotificationsEnabled = false;

		Funky.Presence.off('user:join', _handlePresenceJoin);
		Funky.Presence.off('user:leave', _handlePresenceLeave);
		Funky.Presence.off('status', _handlePresenceStatus);
		Funky.Presence.off('typing:start', _handlePresenceTyping);

		console.log('[NotificationCenter] Presence notifications disabled');
		return this;
	};

	/**
	 * Check if presence notifications are enabled
	 * @returns {boolean}
	 */
	NotificationCenter.isPresenceNotificationsEnabled = function() {
		return _presenceNotificationsEnabled;
	};

	/**
	 * Check if channel should trigger notification
	 * @param {string} channel - Channel name
	 * @returns {boolean}
	 * @private
	 */
	function _shouldNotifyChannel(channel) {
		var watched = _presenceOptions.channels || ['*'];

		if (watched.indexOf('*') !== -1) return true;
		return watched.indexOf(channel) !== -1;
	}

	/**
	 * Format channel name for display
	 * @param {string} channel - Channel name
	 * @returns {string}
	 * @private
	 */
	function _formatChannelName(channel) {
		if (!channel) return 'this page';

		if (channel.indexOf('page:') === 0) {
			return channel.replace('page:', '');
		}
		if (channel.indexOf('modal:') === 0) {
			return channel.replace('modal:', '').replace(/:/g, ' ');
		}
		if (channel.indexOf('table:') === 0) {
			return 'the data table';
		}
		if (channel.indexOf('kanban:') === 0) {
			return 'the board';
		}
		if (channel.indexOf('field:') === 0) {
			return 'a field';
		}
		return channel;
	}

	/**
	 * Handle user join event
	 * @param {Object} data - Join data
	 * @private
	 */
	function _handlePresenceJoin(data) {
		if (!_presenceNotificationsEnabled) return;
		if (!_presenceOptions.showJoin) return;
		if (!_shouldNotifyChannel(data.channel)) return;

		// Don't notify for self
		var currentUser = Funky.Presence.getCurrentUser();
		if (currentUser && data.user && data.user.id === currentUser.id) return;

		var channelName = _formatChannelName(data.channel);
		var userName = data.user ? data.user.name : 'Someone';

		NotificationCenter.add({
			id: 'presence-join-' + Date.now(),
			type: 'presence',
			subtype: 'join',
			title: userName + ' joined',
			body: 'Now viewing ' + channelName,
			icon: 'fa-user-plus',
			iconColor: 'success',
			timestamp: new Date().toISOString(),
			read: false,
			data: {
				userId: data.user ? data.user.id : null,
				channel: data.channel,
				presenceType: 'join'
			},
			autoClose: 5000
		});

		// Play sound if configured
		if (_presenceOptions.joinSound) {
			NotificationCenter.playSound(_presenceOptions.joinSound);
		}
	}

	/**
	 * Handle user leave event
	 * @param {Object} data - Leave data
	 * @private
	 */
	function _handlePresenceLeave(data) {
		if (!_presenceNotificationsEnabled) return;
		if (!_presenceOptions.showLeave) return;
		if (!_shouldNotifyChannel(data.channel)) return;

		// Don't notify for self
		var currentUser = Funky.Presence.getCurrentUser();
		if (currentUser && data.user && data.user.id === currentUser.id) return;

		var userName = data.user ? data.user.name : 'Someone';
		var channelName = _formatChannelName(data.channel);

		NotificationCenter.add({
			id: 'presence-leave-' + Date.now(),
			type: 'presence',
			subtype: 'leave',
			title: userName + ' left',
			body: 'No longer viewing ' + channelName,
			icon: 'fa-user-minus',
			iconColor: 'secondary',
			timestamp: new Date().toISOString(),
			read: false,
			data: {
				userId: data.user ? data.user.id : null,
				channel: data.channel,
				presenceType: 'leave'
			},
			autoClose: 3000
		});

		// Play sound if configured
		if (_presenceOptions.leaveSound) {
			NotificationCenter.playSound(_presenceOptions.leaveSound);
		}
	}

	/**
	 * Handle status change event
	 * @param {Object} data - Status data
	 * @private
	 */
	function _handlePresenceStatus(data) {
		if (!_presenceNotificationsEnabled) return;
		if (!_presenceOptions.showStatus) return;
		if (!_shouldNotifyChannel(data.channel)) return;

		// Don't notify for self
		var currentUser = Funky.Presence.getCurrentUser();
		if (currentUser && data.user && data.user.id === currentUser.id) return;

		// Only notify for significant status changes
		if (data.status === 'editing') {
			var channelName = _formatChannelName(data.channel);
			var userName = data.user ? data.user.name : 'Someone';

			NotificationCenter.add({
				id: 'presence-status-' + Date.now(),
				type: 'presence',
				subtype: 'status',
				title: userName + ' started editing',
				body: channelName,
				icon: 'fa-edit',
				iconColor: 'warning',
				timestamp: new Date().toISOString(),
				read: false,
				category: 'presence',
				data: {
					userId: data.user ? data.user.id : null,
					channel: data.channel,
					status: data.status,
					presenceType: 'status'
				},
				autoClose: 4000
			});
		}
	}

	/**
	 * Handle typing start event
	 * @param {Object} data - Typing data
	 * @private
	 */
	function _handlePresenceTyping(data) {
		if (!_presenceNotificationsEnabled) return;
		if (!_presenceOptions.showTyping) return;
		if (!_shouldNotifyChannel(data.channel)) return;

		// Don't notify for self
		var currentUser = Funky.Presence.getCurrentUser();
		if (currentUser && data.user && data.user.id === currentUser.id) return;

		var userName = data.user ? data.user.name : 'Someone';

		// Use transient notification (updates existing instead of creating new)
		NotificationCenter.addTransient({
			id: 'typing-' + data.channel,
			type: 'presence',
			subtype: 'typing',
			title: userName + ' is typing...',
			icon: 'fa-keyboard',
			iconColor: 'primary',
			autoClose: 3000
		});
	}

	/**
	 * Add a transient notification (replaces existing with same id)
	 * @param {Object} notification - Notification data
	 * @returns {Object} NotificationCenter for chaining
	 */
	NotificationCenter.addTransient = function(notification) {
		if (!notification || !notification.id) {
			return this.add(notification);
		}

		// Remove existing notification with same id
		var existing = this._getById(notification.id);
		if (existing) {
			this.remove(notification.id);
		}

		return this.add(notification);
	};

	// =========================================================================
	// PRESENCE-AWARE DELIVERY
	// =========================================================================

	/**
	 * Enable presence-aware notification delivery
	 * Adjusts delivery mode based on user's presence status
	 * @returns {Object} NotificationCenter for chaining
	 */
	NotificationCenter.enablePresenceDelivery = function() {
		if (!Funky.Presence) {
			console.warn('[NotificationCenter] Funky.Presence not available');
			return this;
		}

		_presenceDeliveryEnabled = true;

		// Store original add method if not already done
		if (!_originalAdd) {
			_originalAdd = NotificationCenter.add.bind(NotificationCenter);

			// Override add method
			NotificationCenter.add = function(notification) {
				if (!_presenceDeliveryEnabled || !Funky.Presence) {
					return _originalAdd(notification);
				}

				var mode = _getDeliveryMode();

				switch (mode) {
					case 'quiet':
						// Add to list but don't show popup or play sound
						notification._quiet = true;
						notification.sound = false;
						notification.desktop = false;
						break;

					case 'batch':
						// Queue for later delivery
						_batchQueue.push(notification);

						// Listen for user becoming active
						if (!_batchListener) {
							_batchListener = function() {
								_deliverBatchedNotifications();
							};
							Funky.Presence.on('active', _batchListener);
						}
						return NotificationCenter;
				}

				return _originalAdd(notification);
			};
		}

		console.log('[NotificationCenter] Presence-aware delivery enabled');
		return this;
	};

	/**
	 * Disable presence-aware notification delivery
	 * @returns {Object} NotificationCenter for chaining
	 */
	NotificationCenter.disablePresenceDelivery = function() {
		_presenceDeliveryEnabled = false;

		// Remove batch listener
		if (_batchListener && Funky.Presence) {
			Funky.Presence.off('active', _batchListener);
			_batchListener = null;
		}

		// Deliver any queued notifications
		_deliverBatchedNotifications();

		console.log('[NotificationCenter] Presence-aware delivery disabled');
		return this;
	};

	/**
	 * Check if user is idle
	 * @returns {boolean}
	 * @private
	 */
	function _isUserIdle() {
		if (!Funky.Presence) return false;
		return Funky.Presence.isIdle && Funky.Presence.isIdle();
	}

	/**
	 * Get notification delivery mode based on presence status
	 * @returns {string} 'normal', 'quiet', 'batch'
	 * @private
	 */
	function _getDeliveryMode() {
		if (!Funky.Presence || !Funky.Presence.getStatus) return 'normal';

		var status = Funky.Presence.getStatus();

		switch (status) {
			case 'busy':
				return 'quiet';  // Don't show popups, just add to list
			case 'away':
			case 'idle':
				return 'batch';  // Batch notifications for when user returns
			default:
				return 'normal';
		}
	}

	/**
	 * Deliver batched notifications when user returns
	 * @private
	 */
	function _deliverBatchedNotifications() {
		if (_batchQueue.length === 0) return;

		var queue = _batchQueue.slice();
		_batchQueue = [];

		// If many notifications, summarize
		if (queue.length > 5) {
			if (_originalAdd) {
				_originalAdd({
					id: 'batch-summary-' + Date.now(),
					type: 'summary',
					title: queue.length + ' notifications while away',
					body: 'Click to view all',
					icon: 'fa-bell',
					iconColor: 'primary',
					timestamp: new Date().toISOString(),
					read: false,
					data: { count: queue.length, batched: queue }
				});
			}
		} else {
			// Deliver each notification
			queue.forEach(function(notification) {
				if (_originalAdd) {
					_originalAdd(notification);
				}
			});
		}

		// Remove batch listener
		if (_batchListener && Funky.Presence) {
			Funky.Presence.off('active', _batchListener);
			_batchListener = null;
		}
	}

	/**
	 * Get number of batched notifications
	 * @returns {number}
	 */
	NotificationCenter.getBatchedCount = function() {
		return _batchQueue.length;
	};

	/**
	 * Force deliver batched notifications now
	 * @returns {Object} NotificationCenter for chaining
	 */
	NotificationCenter.deliverBatched = function() {
		_deliverBatchedNotifications();
		return this;
	};

	// =========================================================================
	// EXPORT
	// =========================================================================

	if (Funky.register) {
		Funky.register('NotificationCenter', NotificationCenter);
	}

})(window);
