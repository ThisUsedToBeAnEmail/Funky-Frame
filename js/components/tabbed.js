/**
 * Funky.Tabbed - Composable Tab Container
 *
 * Manages tabs with support for CRUD, DataTable, Form, and Custom tabs.
 * Uses Funky.Tabs for native tab functionality (no Bootstrap JS required).
 * Each tab has independent lifecycle and can contain Funky.CRUD instances.
 * Supports lazy loading, state persistence, and WebSocket integration.
 *
 * Usage:
 *   var page = Funky.Tabbed.init({
 *     containerId: 'myTabs',
 *     contentContainerId: 'myTabContent',
 *     tabs: [
 *       {
 *         id: 'users',
 *         label: '<i class="fas fa-users"></i> Users',
 *         type: 'crud',
 *         config: {
 *           entity: 'user',
 *           apiUrl: '/api/users',
 *           tableSelector: '#usersTable',
 *           columns: [...],
 *           features: { create: true, edit: true, delete: true }
 *         }
 *       },
 *       {
 *         id: 'settings',
 *         label: '<i class="fas fa-cog"></i> Settings',
 *         type: 'custom',
 *         onInit: function(container) { loadSettings(); },
 *         onShow: function(container) { refreshSettings(); },
 *         onDestroy: function() { cleanup(); }
 *       }
 *     ],
 *     defaultTab: 'users',
 *     rememberTab: true,
 *     updateStats: function(tabData) { ... }
 *   });
 * 
 * Tab Types:
 *   - 'crud': Full Funky.CRUD instance
 *   - 'datatable': Funky.DataTables instance (view-only)
 *   - 'form': Settings form with JSONEditor
 *   - 'custom': Full control with lifecycle hooks
 * 
 * @version 1.0.0
 * @see Funky.CRUD for CRUD tab configuration
 * @see Funky.DataTables for DataTable tab configuration
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Tabbed] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent double-registration
	if (Funky.isRegistered('Tabbed')) {
		return;
	}

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('Tabbed');

	/**
	 * Tab instance constructor
	 */
	function TabbedInstance(config) {
		this.id = config.id || config.containerId || 'tabbed_' + Date.now();
		this.containerId = config.containerId;
		// Auto-derive content container ID if not provided (e.g., 'pushTabs' -> 'pushTabsContent' or 'pushTabContent')
		this.contentContainerId = config.contentContainerId || config.containerId + 'Content';
		this.tabs = {};
		this.tabOrder = [];
		this.activeTabId = null;
		this.initializedTabs = {};
		this.config = config;

		this._init(config);
	}

	TabbedInstance.prototype = {
		/**
		 * Initialize the tabbed container
		 */
		_init: function(config) {
			var self = this;

			// Validate containers exist
			this.tabContainer = document.getElementById(this.containerId);
			
			// Try common naming conventions for content container
			this.contentContainer = document.getElementById(this.contentContainerId);
			if (!this.contentContainer) {
				// Try without 's' (e.g., 'pushTabs' -> 'pushTabContent')
				var altId = this.containerId.replace(/s$/, '') + 'Content';
				this.contentContainer = document.getElementById(altId);
				if (this.contentContainer) {
					this.contentContainerId = altId;
				}
			}

			if (!this.tabContainer) {
				console.error('[Funky.Tabbed] Tab container not found:', this.containerId);
				return;
			}

			if (!this.contentContainer) {
				console.error('[Funky.Tabbed] Content container not found:', this.contentContainerId);
				return;
			}

			// Register tabs - support both array and object format
			if (config.tabs) {
				if (Array.isArray(config.tabs)) {
					// Array format: [{ id: 'tab1', type: 'crud', ... }, ...]
					config.tabs.forEach(function(tabConfig) {
						self._registerTab(tabConfig);
					});
				} else if (typeof config.tabs === 'object') {
					// Object format: { tab1: { type: 'crud', ... }, tab2: { ... } }
					Object.keys(config.tabs).forEach(function(tabId) {
						var tabConfig = config.tabs[tabId];
						tabConfig.id = tabId;
						self._registerTab(tabConfig);
					});
				}
			}

			// Bind tab events
			this._bindEvents();

			// Determine initial tab
			var initialTab = this._getInitialTab(config);
			
			// Initialize the first/active tab directly (Bootstrap doesn't fire show.bs.tab for already-active tabs)
			var self = this;
			setTimeout(function() {
				// Check if the tab is already active in DOM
				var tabPane = document.getElementById(initialTab);
				var isAlreadyActive = tabPane && tabPane.classList.contains('active');
				
				if (isAlreadyActive) {
					// Directly initialize since Bootstrap won't fire the event
					self._handleTabShow(initialTab);
				} else {
					// Switch to tab (will trigger Bootstrap event)
					self.switchTab(initialTab);
				}
			}, 0);

			console.log('[Funky.Tabbed] Initialized with', this.tabOrder.length, 'tabs');
		},

		/**
		 * Register a tab configuration
		 */
		_registerTab: function(tabConfig) {
			if (!tabConfig.id) {
				console.error('[Funky.Tabbed] Tab missing id:', tabConfig);
				return;
			}

			this.tabs[tabConfig.id] = {
				id: tabConfig.id,
				label: tabConfig.label || tabConfig.id,
				type: tabConfig.type || 'custom',
				config: tabConfig.config || {},
				onInit: tabConfig.onInit,
				onShow: tabConfig.onShow,
				onHide: tabConfig.onHide,
				onDestroy: tabConfig.onDestroy,
				instance: null,
				data: null
			};

			this.tabOrder.push(tabConfig.id);
		},

		/**
		 * Get the initial tab to show
		 */
		_getInitialTab: function(config) {
			// Check URL hash first
			var hash = window.location.hash.slice(1);
			if (hash && this.tabs[hash]) {
				return hash;
			}

			// Check localStorage if rememberTab is enabled
			if (config.rememberTab) {
				var stored = localStorage.getItem('funky_tabbed_' + this.id);
				if (stored && this.tabs[stored]) {
					return stored;
				}
			}

			// Use default or first tab
			return config.defaultTab || this.tabOrder[0];
		},

		/**
		 * Bind Funky.Tabs events
		 */
		_bindEvents: function() {
			var self = this;

			// Use Funky.Tabs events
			this.tabContainer.addEventListener('funky.tabs.show', function(e) {
				var targetId = e.detail.tabId;
				if (targetId) {
					self._handleTabShow(targetId);
				}
			});

			this.tabContainer.addEventListener('funky.tabs.hide', function(e) {
				var targetId = e.detail.tabId;
				if (targetId) {
					self._handleTabHide(targetId);
				}
			});

			// Handle hash changes for deep linking
			window.addEventListener('hashchange', function() {
				var hash = window.location.hash.slice(1);
				if (hash && self.tabs[hash] && hash !== self.activeTabId) {
					self.switchTab(hash);
				}
			});
		},

		/**
		 * Handle tab show event
		 */
		_handleTabShow: function(tabId) {
			var tab = this.tabs[tabId];
			if (!tab) return;

			this.activeTabId = tabId;

			// Initialize tab if first time
			if (!this.initializedTabs[tabId]) {
				this._initializeTab(tabId);
				this.initializedTabs[tabId] = true;
			}

			// Call onShow callback
			if (typeof tab.onShow === 'function') {
				var container = document.getElementById(tabId);
				tab.onShow(container, tab.instance);
			}

			// Refresh DataTable if it exists (handles responsive recalculation)
			if (tab.instance && tab.instance.getTable) {
				var table = tab.instance.getTable();
				if (table && table.columns) {
					table.columns.adjust().responsive.recalc();
				}
			}

			// Update URL hash if not already set
			if (window.location.hash.slice(1) !== tabId) {
				history.replaceState(null, null, '#' + tabId);
			}

			// Remember tab if enabled
			if (this.config.rememberTab) {
				localStorage.setItem('funky_tabbed_' + this.id, tabId);
			}
		},

		/**
		 * Handle tab hide event
		 */
		_handleTabHide: function(tabId) {
			var tab = this.tabs[tabId];
			if (!tab) return;

			// Call onHide callback
			if (typeof tab.onHide === 'function') {
				var container = document.getElementById(tabId);
				tab.onHide(container, tab.instance);
			}
		},

		/**
		 * Initialize a tab's content
		 */
		_initializeTab: function(tabId) {
			var tab = this.tabs[tabId];
			if (!tab) return;

			var container = document.getElementById(tabId);
			if (!container) {
				console.error('[Funky.Tabbed] Tab content container not found:', tabId);
				return;
			}

			console.log('[Funky.Tabbed] Initializing tab:', tabId, 'type:', tab.type);

			switch (tab.type) {
				case 'crud':
					this._initCrudTab(tab, container);
					break;

				case 'datatable':
					this._initDataTableTab(tab, container);
					break;

				case 'form':
					this._initFormTab(tab, container);
					break;

				case 'custom':
				default:
					this._initCustomTab(tab, container);
					break;
			}
		},

		/**
		 * Initialize a CRUD tab
		 */
		_initCrudTab: function(tab, container) {
			if (!Funky.CRUD) {
				console.error('[Funky.Tabbed] Funky.CRUD not available for tab:', tab.id);
				return;
			}

			var config = Object.assign({}, tab.config);
			
			// Store reference to tabbed instance for stats updates
			var self = this;
			var originalUpdateStats = config.updateStats;
			config.updateStats = function(data) {
				tab.data = data;
				if (typeof originalUpdateStats === 'function') {
					originalUpdateStats(data);
				}
				self._updateGlobalStats();
			};

			tab.instance = Funky.CRUD.init(config);

			// Call onInit if provided
			if (typeof tab.onInit === 'function') {
				tab.onInit(container, tab.instance);
			}
		},

		/**
		 * Initialize a DataTable-only tab
		 */
		_initDataTableTab: function(tab, container) {
			if (!Funky.DataTables) {
				console.error('[Funky.Tabbed] Funky.DataTables not available for tab:', tab.id);
				return;
			}

			var config = tab.config;
			
			// Store reference for stats
			var self = this;
			var originalUpdateStats = config.updateStats;
			config.updateStats = function(data) {
				tab.data = data;
				if (typeof originalUpdateStats === 'function') {
					originalUpdateStats(data);
				}
				self._updateGlobalStats();
			};

			tab.instance = Funky.DataTables.init(config.tableSelector, config);

			// Setup search if configured
			if (config.searchSelector && tab.instance) {
				Funky.DataTables.setupGlobalSearch(config.searchSelector, tab.instance);
			}

			// Call onInit if provided
			if (typeof tab.onInit === 'function') {
				tab.onInit(container, tab.instance);
			}
		},

		/**
		 * Initialize a form tab
		 */
		_initFormTab: function(tab, container) {
			var config = tab.config;
			
			// For form tabs, we create a simple form handler
			// The actual form can be managed via onInit callback
			tab.instance = {
				container: container,
				config: config,
				load: function() {
					// Load data from API if configured
					if (config.apiUrl && config.loadOnInit !== false) {
						return Funky.Api ? 
							Funky.Api.get(config.apiUrl) : 
							fetch(config.apiUrl).then(function(r) { return r.json(); });
					}
					return Promise.resolve({});
				},
				save: function(data) {
					if (config.apiUrl) {
						var method = config.saveMethod || 'PUT';
						return Funky.Api ?
							(method === 'POST' ? Funky.Api.post(config.apiUrl, data) : Funky.Api.put(config.apiUrl, data)) :
							fetch(config.apiUrl, {
								method: method,
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(data)
							}).then(function(r) { return r.json(); });
					}
					return Promise.resolve(data);
				}
			};

			// Call onInit - form tabs typically need custom initialization
			if (typeof tab.onInit === 'function') {
				tab.onInit(container, tab.instance);
			}
		},

		/**
		 * Initialize a custom tab
		 */
		_initCustomTab: function(tab, container) {
			// Custom tabs are fully user-controlled
			tab.instance = {
				container: container,
				tabId: tab.id
			};

			// Call onInit callback
			if (typeof tab.onInit === 'function') {
				tab.onInit(container, tab.instance);
			}
		},

		/**
		 * Update global stats from all tabs
		 */
		_updateGlobalStats: function() {
			if (typeof this.config.updateStats !== 'function') return;

			var tabData = {};
			var self = this;
			this.tabOrder.forEach(function(tabId) {
				var tab = self.tabs[tabId];
				if (tab.data) {
					tabData[tabId] = tab.data;
				}
			});

			this.config.updateStats(tabData);
		},

		/**
		 * Switch to a specific tab
		 */
		switchTab: function(tabId) {
			if (!this.tabs[tabId]) {
				console.warn('[Funky.Tabbed] Tab not found:', tabId);
				return;
			}

			// Use Funky.Tabs to switch
			if (Funky.Tabs) {
				Funky.Tabs.show('#' + tabId);
			} else {
				console.error('[Funky.Tabbed] Funky.Tabs not available');
			}
		},

		/**
		 * Get the active tab ID
		 */
		getActiveTab: function() {
			return this.activeTabId;
		},

		/**
		 * Get a tab's instance (CRUD, DataTable, or custom)
		 */
		getTabInstance: function(tabId) {
			var tab = this.tabs[tabId];
			return tab ? tab.instance : null;
		},

		/**
		 * Refresh a specific tab or all tabs
		 */
		refresh: function(tabId) {
			var self = this;

			if (tabId) {
				this._refreshTab(tabId);
			} else {
				// Refresh all initialized tabs
				this.tabOrder.forEach(function(id) {
					if (self.initializedTabs[id]) {
						self._refreshTab(id);
					}
				});
			}
		},

		/**
		 * Refresh a single tab
		 */
		_refreshTab: function(tabId) {
			var tab = this.tabs[tabId];
			if (!tab || !tab.instance) return;

			if (tab.type === 'crud' && tab.instance.refresh) {
				tab.instance.refresh();
			} else if (tab.type === 'datatable' && tab.instance.ajax) {
				tab.instance.ajax.reload(null, false);
			} else if (typeof tab.onShow === 'function') {
				// For custom tabs, call onShow to refresh
				var container = document.getElementById(tabId);
				tab.onShow(container, tab.instance);
			}
		},

		/**
		 * Bindable Interface: Set tab definitions dynamically
		 * @param {Array|Object} tabDefs - Array or object of tab definitions
		 */
		setData: function(tabDefs) {
			var self = this;

			// Clear existing tabs (destroy instances first)
			this.tabOrder.forEach(function(tabId) {
				var tab = self.tabs[tabId];
				if (tab) {
					if (typeof tab.onDestroy === 'function') {
						tab.onDestroy();
					}
					if (tab.instance && tab.instance.destroy) {
						tab.instance.destroy();
					}
				}
			});

			// Reset state
			this.tabs = {};
			this.tabOrder = [];
			this.initializedTabs = {};

			// Register new tabs
			if (Array.isArray(tabDefs)) {
				tabDefs.forEach(function(tabConfig) {
					self._registerTab(tabConfig);
				});
			} else if (typeof tabDefs === 'object' && tabDefs !== null) {
				Object.keys(tabDefs).forEach(function(tabId) {
					var tabConfig = tabDefs[tabId];
					tabConfig.id = tabId;
					self._registerTab(tabConfig);
				});
			}

			// Re-initialize active tab if still valid
			if (this.activeTabId && this.tabs[this.activeTabId]) {
				this._handleTabShow(this.activeTabId);
			} else if (this.tabOrder.length > 0) {
				this.switchTab(this.tabOrder[0]);
			}

			console.log('[Funky.Tabbed] setData: Updated with', this.tabOrder.length, 'tabs');
		},

		/**
		 * Bindable Interface: Get current tab state
		 * @returns {Object} Current tab configuration and state
		 */
		getData: function() {
			var self = this;
			return {
				activeTabId: this.activeTabId,
				activeTab: this.tabs[this.activeTabId] || null,
				tabOrder: this.tabOrder.slice(),
				tabs: Object.keys(this.tabs).reduce(function(acc, tabId) {
					var tab = self.tabs[tabId];
					acc[tabId] = {
						id: tab.id,
						label: tab.label,
						type: tab.type,
						initialized: !!self.initializedTabs[tabId],
						data: tab.data
					};
					return acc;
				}, {}),
				initializedTabs: Object.keys(this.initializedTabs)
			};
		},

		/**
		 * Handle entity updates from WebSocket
		 */
		handleEntityUpdate: function(entityType, entityId, data, action) {
			var self = this;
			this.tabOrder.forEach(function(tabId) {
				var tab = self.tabs[tabId];
				if (tab.type === 'crud' && tab.config && tab.config.entity === entityType) {
					if (tab.instance && tab.instance.refresh) {
						tab.instance.refresh();
					}
				}
			});
		},

		/**
		 * Destroy the tabbed instance
		 */
		destroy: function() {
			var self = this;

			// Destroy all tab instances
			this.tabOrder.forEach(function(tabId) {
				var tab = self.tabs[tabId];
				
				// Call onDestroy callback
				if (typeof tab.onDestroy === 'function') {
					tab.onDestroy();
				}

				// Destroy CRUD/DataTable instances
				if (tab.instance) {
					if (tab.type === 'crud' && tab.instance.destroy) {
						tab.instance.destroy();
					} else if (tab.type === 'datatable' && tab.instance.destroy) {
						tab.instance.destroy();
					}
				}

				tab.instance = null;
			});

			// Note: Event listeners are cleaned up by cloning in _bindEvents
			// No need to explicitly unbind Funky.Tabs events

			// Clear state
			this.tabs = {};
			this.tabOrder = [];
			this.initializedTabs = {};
			this.activeTabId = null;

			// Remove from registry
			_instances.unregister(this.id);

			console.log('[Funky.Tabbed] Destroyed:', this.id);
		}
	};

	/**
	 * Funky.Tabbed public API
	 */
	var Tabbed = {
		/**
		 * Initialize a new tabbed container
		 * @param {string|object} containerIdOrConfig - Container ID string or configuration object
		 * @param {object} [options] - Options if first param is string
		 * @returns {TabbedInstance}
		 */
		init: function(containerIdOrConfig, options) {
			var config;
			
			// Support both calling conventions:
			// Funky.Tabbed.init('containerId', { tabs: {...} })
			// Funky.Tabbed.init({ containerId: 'containerId', tabs: {...} })
			if (typeof containerIdOrConfig === 'string') {
				config = Object.assign({ containerId: containerIdOrConfig }, options || {});
			} else {
				config = containerIdOrConfig;
			}
			
			if (!config || !config.containerId) {
				console.error('[Funky.Tabbed] containerId is required');
				return null;
			}

			var instance = new TabbedInstance(config);
			_instances.register(instance.id, instance);
			return instance;
		},

		/**
		 * Get an existing instance
		 * @param {string} id - Instance ID
		 * @returns {TabbedInstance|null}
		 */
		getInstance: function(id) {
			return _instances.get(id);
		},

		/**
		 * Get all instances
		 * @returns {Object}
		 */
		getAll: function() {
			return _instances.getAll();
		},

		/**
		 * Destroy an instance
		 * @param {string} id - Instance ID
		 */
		destroy: function(id) {
			var instance = _instances.get(id);
			if (instance) {
				instance.destroy();
			}
		},

		/**
		 * Destroy all instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		/**
		 * Bindable Interface: Set tab definitions on a specific instance
		 * @param {string} containerId - Container/instance ID
		 * @param {Array|Object} tabDefs - Tab definitions
		 */
		setData: function(containerId, tabDefs) {
			var instance = _instances.get(containerId);
			if (!instance) {
				console.warn('[Funky.Tabbed] setData: Instance not found:', containerId);
				return;
			}
			instance.setData(tabDefs);
		},

		/**
		 * Bindable Interface: Get tab state from a specific instance
		 * @param {string} containerId - Container/instance ID
		 * @returns {Object|null} Current tab state or null
		 */
		getData: function(containerId) {
			var instance = _instances.get(containerId);
			if (!instance) {
				return null;
			}
			return instance.getData();
		}
	};

	// Register with Funky namespace
	Funky.register('Tabbed', Tabbed);

	console.log('[Funky.Tabbed] v1.0.0 initialized');

})(window);
