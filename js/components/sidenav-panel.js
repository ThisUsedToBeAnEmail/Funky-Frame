/**
 * Funky.SideNavPanel - SideNav + Content Panel Integration
 * Pairs a SideNav with content panels for a complete navigation solution
 * @module Funky.SideNavPanel
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Guard against double registration
	if (Funky.isRegistered && Funky.isRegistered('SideNavPanel')) {
		return;
	}

	/**
	 * SideNavPanel Constructor
	 * @param {Object} config - Configuration options
	 */
	function SideNavPanel(config) {
		// Validate required dependencies
		if (!Funky.SideNav) {
			console.error('[SideNavPanel] Funky.SideNav is required');
			return;
		}

		// Default configuration
		this.config = Object.assign({
			sidenav: null,           // Selector or existing SideNav instance
			panels: null,            // Container selector for panels
			items: [],               // Items with content/render properties
			lazyLoad: true,          // Only render panels on first activation
			animation: 'fade',       // 'fade', 'slide', 'none'
			selected: null,          // Initial selected item
			sidenavConfig: {}        // Additional config passed to SideNav
		}, config || {});

		// State
		this.sidenav = null;
		this.panelsContainer = null;
		this.panels = {};
		this.initializedPanels = {};
		this.activePanel = null;

		// Initialize
		this._init();
	}

	/**
	 * Initialize the component
	 */
	SideNavPanel.prototype._init = function() {
		var self = this;

		// Get or create SideNav
		if (this.config.sidenav instanceof Funky.SideNav) {
			this.sidenav = this.config.sidenav;
		} else if (typeof this.config.sidenav === 'string' || this.config.sidenav instanceof Element) {
			// Build items for SideNav (without content/render properties)
			var sidenavItems = this._buildSideNavItems(this.config.items);
			
			// Create SideNav with merged config
			var sidenavConfig = Object.assign({}, this.config.sidenavConfig, {
				items: sidenavItems,
				selected: this.config.selected,
				onChange: function(item) {
					self._activatePanel(item.id);
					// Call user's onChange if provided
					if (self.config.sidenavConfig && self.config.sidenavConfig.onChange) {
						self.config.sidenavConfig.onChange(item);
					}
				}
			});
			
			this.sidenav = Funky.SideNav.init(this.config.sidenav, sidenavConfig);
		} else {
			console.error('[SideNavPanel] Invalid sidenav config');
			return;
		}

		// Get panels container
		this.panelsContainer = typeof this.config.panels === 'string'
			? document.querySelector(this.config.panels)
			: this.config.panels;

		if (!this.panelsContainer) {
			console.error('[SideNavPanel] Panels container not found:', this.config.panels);
			return;
		}

		// Add class to panels container
		this.panelsContainer.classList.add('sidenav-panels');
		this.panelsContainer.classList.add('sidenav-panels--' + this.config.animation);

		// Create panel elements
		this._createPanels();

		// Wire up SideNav onChange if using existing instance
		if (this.config.sidenav instanceof Funky.SideNav) {
			var originalOnChange = this.sidenav.config.onChange;
			this.sidenav.config.onChange = function(item) {
				self._activatePanel(item.id);
				if (originalOnChange) originalOnChange(item);
			};
		}

		// Activate initial panel
		if (this.config.selected) {
			this._activatePanel(this.config.selected, true);
		} else if (this.config.items.length > 0) {
			// Find first selectable item
			var firstItem = this._findFirstSelectableItem(this.config.items);
			if (firstItem) {
				this.sidenav.select(firstItem.id, true);
				this._activatePanel(firstItem.id, true);
			}
		}

		console.log('[SideNavPanel] Initialized with', this.config.items.length, 'panels');
	};

	/**
	 * Build SideNav items (strip content/render properties)
	 */
	SideNavPanel.prototype._buildSideNavItems = function(items) {
		var self = this;
		return items.map(function(item) {
			var sidenavItem = {
				id: item.id,
				label: item.label,
				icon: item.icon,
				badge: item.badge
			};
			
			if (item.children) {
				sidenavItem.children = self._buildSideNavItems(item.children);
			}
			
			return sidenavItem;
		});
	};

	/**
	 * Find first selectable (non-group) item
	 */
	SideNavPanel.prototype._findFirstSelectableItem = function(items) {
		for (var i = 0; i < items.length; i++) {
			if (items[i].children) {
				var found = this._findFirstSelectableItem(items[i].children);
				if (found) return found;
			} else {
				return items[i];
			}
		}
		return null;
	};

	/**
	 * Create panel elements for each item
	 */
	SideNavPanel.prototype._createPanels = function() {
		var self = this;
		
		function createForItems(items) {
			items.forEach(function(item) {
				if (item.children) {
					createForItems(item.children);
				} else {
					self._createPanel(item);
				}
			});
		}
		
		createForItems(this.config.items);
	};

	/**
	 * Create a single panel element
	 */
	SideNavPanel.prototype._createPanel = function(item) {
		var panel = document.createElement('div');
		var panelId = 'sidenav-panel-' + item.id;
		panel.id = panelId;
		panel.className = 'sidenav-panel';
		panel.setAttribute('data-panel', item.id);
		panel.setAttribute('role', 'tabpanel');
		panel.setAttribute('aria-labelledby', 'sidenav-item-' + item.id);
		panel.setAttribute('aria-hidden', 'true');
		panel.style.display = 'none';

		// If not lazy loading, render content immediately
		if (!this.config.lazyLoad) {
			this._renderPanelContent(panel, item);
			this.initializedPanels[item.id] = true;
		}

		this.panelsContainer.appendChild(panel);
		this.panels[item.id] = panel;
	};

	/**
	 * Render panel content
	 */
	SideNavPanel.prototype._renderPanelContent = function(panel, item) {
		if (item.content) {
			// Static HTML content
			panel.replaceChildren(Funky.Util.toDom(item.content));
		} else if (item.render && typeof item.render === 'function') {
			// Dynamic render function
			item.render(panel);
		}

		// Call onInit hook
		if (this.config.onInit) {
			this.config.onInit(item.id, panel);
		}
	};

	/**
	 * Find item by ID in nested structure
	 */
	SideNavPanel.prototype._findItem = function(id) {
		function search(items) {
			for (var i = 0; i < items.length; i++) {
				if (items[i].id === id) return items[i];
				if (items[i].children) {
					var found = search(items[i].children);
					if (found) return found;
				}
			}
			return null;
		}
		return search(this.config.items);
	};

	/**
	 * Activate a panel by ID
	 */
	SideNavPanel.prototype._activatePanel = function(id, silent) {
		var self = this;
		var panel = this.panels[id];
		var item = this._findItem(id);

		if (!panel || !item) {
			console.warn('[SideNavPanel] Panel not found:', id);
			return;
		}

		// Deactivate current panel
		if (this.activePanel && this.activePanel !== id) {
			var currentPanel = this.panels[this.activePanel];
			if (currentPanel) {
				this._hidePanel(currentPanel);
				
				// Call onDeactivate hook
				if (this.config.onDeactivate) {
					this.config.onDeactivate(this.activePanel, currentPanel);
				}
			}
		}

		// Initialize panel if lazy loading and not yet initialized
		var isFirstActivation = false;
		if (this.config.lazyLoad && !this.initializedPanels[id]) {
			this._renderPanelContent(panel, item);
			this.initializedPanels[id] = true;
			isFirstActivation = true;
		}

		// Show panel
		this._showPanel(panel);
		this.activePanel = id;

		// Call onActivate hook
		if (this.config.onActivate) {
			this.config.onActivate(id, panel, isFirstActivation);
		}
	};

	/**
	 * Show panel with animation
	 */
	SideNavPanel.prototype._showPanel = function(panel) {
		var animation = this.config.animation;

		panel.style.display = '';
		panel.classList.add('active');
		panel.setAttribute('aria-hidden', 'false');

		if (animation === 'fade') {
			panel.style.opacity = '0';
			requestAnimationFrame(function() {
				panel.style.opacity = '1';
			});
		} else if (animation === 'slide') {
			panel.style.transform = 'translateX(20px)';
			panel.style.opacity = '0';
			requestAnimationFrame(function() {
				panel.style.transform = 'translateX(0)';
				panel.style.opacity = '1';
			});
		}
	};

	/**
	 * Hide panel with animation
	 */
	SideNavPanel.prototype._hidePanel = function(panel) {
		panel.classList.remove('active');
		panel.setAttribute('aria-hidden', 'true');
		panel.style.display = 'none';
	};

	/**
	 * Get panel element by ID
	 * @param {string} id - Panel ID
	 * @returns {Element|null}
	 */
	SideNavPanel.prototype.getPanel = function(id) {
		return this.panels[id] || null;
	};

	/**
	 * Get active panel ID
	 * @returns {string|null}
	 */
	SideNavPanel.prototype.getActive = function() {
		return this.activePanel;
	};

	/**
	 * Refresh a panel (re-render its content)
	 * @param {string} id - Panel ID
	 */
	SideNavPanel.prototype.refreshPanel = function(id) {
		var panel = this.panels[id];
		var item = this._findItem(id);

		if (panel && item) {
			panel.replaceChildren();
			this._renderPanelContent(panel, item);
		}

		return this;
	};

	/**
	 * Select a panel programmatically
	 * @param {string} id - Panel ID
	 */
	SideNavPanel.prototype.select = function(id) {
		this.sidenav.select(id);
		return this;
	};

	/**
	 * Update items dynamically
	 * @param {Array} items - New items array
	 */
	SideNavPanel.prototype.setItems = function(items) {
		this.config.items = items;
		
		// Clear existing panels
		this.panelsContainer.replaceChildren();
		this.panels = {};
		this.initializedPanels = {};
		this.activePanel = null;

		// Update SideNav
		var sidenavItems = this._buildSideNavItems(items);
		this.sidenav.setItems(sidenavItems);

		// Recreate panels
		this._createPanels();

		// Activate first panel
		var firstItem = this._findFirstSelectableItem(items);
		if (firstItem) {
			this.sidenav.select(firstItem.id, true);
			this._activatePanel(firstItem.id, true);
		}

		return this;
	};

	/**
	 * Destroy the component
	 */
	SideNavPanel.prototype.destroy = function() {
		// Clear panels
		this.panelsContainer.replaceChildren();
		this.panelsContainer.classList.remove('sidenav-panels');
		this.panelsContainer.classList.remove('sidenav-panels--fade');
		this.panelsContainer.classList.remove('sidenav-panels--slide');
		this.panelsContainer.classList.remove('sidenav-panels--none');

		// Destroy sidenav if we created it
		if (this.sidenav && typeof this.config.sidenav === 'string') {
			this.sidenav.destroy();
		}

		this.panels = {};
		this.initializedPanels = {};
		this.activePanel = null;

		// Unregister from instance registry
		if (this.id) {
			_instances.unregister(this.id);
		}
	};

	// =========================================================================
	// STATIC API
	// =========================================================================

	var _instances = Funky.Registry.createInstanceRegistry('SideNavPanel');
	var _instanceCounter = 0;

	/**
	 * Initialize a SideNavPanel
	 * @param {Object} config - Configuration options
	 * @returns {SideNavPanel}
	 */
	SideNavPanel.init = function(config) {
		var instance = new SideNavPanel(config);
		instance.id = 'sidenav-panel-' + (++_instanceCounter);
		_instances.register(instance.id, instance);
		return instance;
	};

	/**
	 * Get instance by ID
	 * @param {string} id - Instance ID
	 * @returns {SideNavPanel|null}
	 */
	SideNavPanel.getInstance = function(id) {
		return _instances.get(id);
	};

	/**
	 * Destroy instance by ID
	 * @param {string} id - Instance ID
	 */
	SideNavPanel.destroy = function(id) {
		var instance = _instances.get(id);
		if (instance) {
			instance.destroy();
		}
	};

	/**
	 * Destroy all instances
	 */
	SideNavPanel.destroyAll = function() {
		_instances.destroyAll();
	};

	// Register with Funky securely
	Funky.register('SideNavPanel', SideNavPanel);

})(window);
