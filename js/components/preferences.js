/**
 * Funky Preferences - User Preferences Management
 * 
 * Handles loading, saving, and applying user preferences for themes,
 * notifications, display settings, dashboard layout, and table configurations.
 * 
 * Usage:
 *   Funky.Preferences.load().then(() => Funky.Preferences.apply());
 *   Funky.Preferences.get('theme.mode');
 *   Funky.Preferences.set('theme.mode', 'dark');
 *   Funky.Preferences.save('theme', { mode: 'dark', accent_color: '#ff6600' });
 * 
 * For playground/sandbox use:
 *   Funky.Preferences.setEndpoint('/api/playground/preferences');
 *
 * Configuration options (set BEFORE script loads):
 *   window.FUNKY_PREFERENCES_CONFIG = {
 *     autoLoad: false,  // Disable auto-load on script init
 *     skipApi: true     // Skip API calls entirely, use defaults (for test sandbox)
 *   };
 * 
 * @version 1.0.3
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Preferences] Registry not found. Load namespace.js first.');
		return;
	}

	// Global configuration (can be set before script loads)
	var globalConfig = window.FUNKY_PREFERENCES_CONFIG || {};

	// Default API endpoint
	var API_ENDPOINT = globalConfig.endpoint || '/api/users/preferences';

	// Auto-load setting (default true for backwards compatibility, but false in iframes)
	var AUTO_LOAD = globalConfig.autoLoad !== undefined ? globalConfig.autoLoad : (window.self === window.top);

	// Instance registry
	var _instances = Funky.Registry.createInstanceRegistry('Preferences');

	/**
	 * FunkyPreferences Constructor
	 * @param {string} contextId - Optional context/section ID for instance registry
	 */
	function FunkyPreferences(contextId) {
		this.contextId = contextId || 'default';
		this.cache = null;
		this.loaded = false;
		this.loading = false;
		this.listeners = [];
		this.changeListeners = [];
		this.endpoint = API_ENDPOINT;

		// Register in instance registry
		_instances.register(this.contextId, this);

		// Default values (used before preferences are loaded)
		this.defaults = {
			theme: {
				mode: 'dark',
				accent_color: '#0d6efd',
				background_color: null,
				font_color: null,
				border_color: null,
				link_color: null,
				nav_position: 'left',
				font_scale: 1.0,
				density: 'comfortable',
				animations_enabled: true,
				sidebar_collapsed: false
			},
			notifications: {
				email_enabled: true,
				push_enabled: true,
				trade_alerts: true,
				system_alerts: true
			},
			display: {
				items_per_page: 25,
				date_format: 'YYYY-MM-DD',
				time_format: 'HH:mm:ss',
				timezone: 'UTC'
			},
			dashboard: {
				layout: 'default',
				visible_widgets: ['trades', 'actions', 'stats']
			},
			tables: {
				column_visibility: {},
				column_order: {},
				default_sort: {}
			},
			keyboard: {
				regionTabNavigation: false  // Tab at region boundary jumps to next region
			}
		};
	}

	/**
	 * Set a custom API endpoint (for playground/sandbox use)
	 * @param {string} endpoint - The API endpoint base URL
	 */
	FunkyPreferences.prototype.setEndpoint = function(endpoint) {
		this.endpoint = endpoint;
		this.loaded = false;
		this.cache = null;
		console.log('[Funky.Preferences] Endpoint set to:', endpoint);
	};

	/**
	 * Get the current API endpoint
	 * @returns {string} The current endpoint
	 */
	FunkyPreferences.prototype.getEndpoint = function() {
		return this.endpoint;
	};

	/**
	 * Load all preferences from server
	 * @param {boolean} forceRefresh - Force a fresh fetch from server
	 * @returns {Promise<Object>} The preferences object
	 */
	FunkyPreferences.prototype.load = function(forceRefresh) {
		var self = this;

		// Skip API calls in test sandbox or when explicitly configured
		if (globalConfig.skipApi) {
			if (!this.loaded) {
				// Deep clone defaults to avoid mutation issues
				this.cache = JSON.parse(JSON.stringify(this.defaults));
				this.loaded = true;
			}
			return Promise.resolve(this.cache);
		}

		// Check if we should use cached version
		if (!forceRefresh && this.loaded && this.cache) {
			var savedVersion = Funky.Storage.getRaw('prefs_version', null);
			var loadedVersion = this.loadedVersion;
			if (!savedVersion || (loadedVersion && parseInt(savedVersion) <= parseInt(loadedVersion))) {
				return Promise.resolve(this.cache);
			}
			this.loaded = false;
		}

		if (this.loading) {
			return new Promise(function(resolve) {
				self.listeners.push(resolve);
			});
		}

		this.loading = true;

		// Use Funky.Api if available, otherwise fall back to fetch
		var fetchFn;
		var endpoint = this.endpoint;
		if (Funky.Api && Funky.Api.get) {
			fetchFn = Funky.Api.get(endpoint, { _: Date.now() });
		} else {
			fetchFn = fetch(endpoint + '?_=' + Date.now(), {
				method: 'GET',
				credentials: 'same-origin',
				headers: {
					'Accept': 'application/json',
					'Cache-Control': 'no-cache'
				}
			}).then(function(response) {
				if (!response.ok) throw new Error('Failed to load preferences');
				return response.json();
			});
		}

		return fetchFn
			.then(function(data) {
				console.log('[Funky.Preferences] API response:', data);
				if (data.success && data.preferences) {
					self.cache = data.preferences;
					self.loaded = true;
					self.loadedVersion = Funky.Storage.getRaw('prefs_version', null) || Date.now().toString();
				} else {
					console.warn('[Funky.Preferences] Using defaults, API returned:', data);
					self.cache = self.defaults;
					self.loaded = true;
					self.loadedVersion = Date.now().toString();
				}
				self.loading = false;

				self.listeners.forEach(function(listener) {
					listener(self.cache);
				});
				self.listeners = [];

				return self.cache;
			})
			.catch(function(error) {
				console.error('[Funky.Preferences] Load error:', error);
				self.cache = self.defaults;
				self.loaded = true;
				self.loading = false;
				return self.cache;
			});
	};

	/**
	 * Save preferences for a specific category
	 * @param {string} category - The category to save (theme, notifications, etc.)
	 * @param {Object} data - The preference data
	 * @returns {Promise<Object>} The save result
	 */
	FunkyPreferences.prototype.save = function(category, data) {
		var self = this;

		// Use Funky.Api if available
		var saveFn;
		var endpoint = this.endpoint;
		if (Funky.Api && Funky.Api.put) {
			saveFn = Funky.Api.put(endpoint + '/' + category, data);
		} else {
			saveFn = fetch(endpoint + '/' + category, {
				method: 'PUT',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'X-CSRF-Token': this.getCsrfToken()
				},
				body: JSON.stringify(data)
			}).then(function(response) {
				if (!response.ok) throw new Error('Failed to save preferences');
				return response.json();
			});
		}

		return saveFn
			.then(function(result) {
				if (result.success && result.data) {
					if (!self.cache) self.cache = {};
					self.cache[category] = result.data;
					Funky.Storage.setRaw('prefs_version', Date.now().toString());
					self.notifyChangeListeners(category, result.data);
				}
				return result;
			})
			.catch(function(error) {
				console.error('[Funky.Preferences] Save error:', error);
				if (Funky.Toast) {
					Funky.Toast.error('Failed to save preferences', 'Error');
				}
				throw error;
			});
	};

	/**
	 * Save all preferences at once
	 */
	FunkyPreferences.prototype.saveAll = function(preferences) {
		var self = this;

		var saveFn;
		var endpoint = this.endpoint;
		if (Funky.Api && Funky.Api.put) {
			saveFn = Funky.Api.put(endpoint, preferences);
		} else {
			saveFn = fetch(endpoint, {
				method: 'PUT',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'X-CSRF-Token': this.getCsrfToken()
				},
				body: JSON.stringify(preferences)
			}).then(function(response) {
				if (!response.ok) throw new Error('Failed to save preferences');
				return response.json();
			});
		}

		return saveFn
			.then(function(result) {
				if (result.success) {
					self.cache = Object.assign({}, self.cache || {}, preferences);
					if (Funky.Toast) {
						Funky.Toast.success('You have saved your preferences', 'Preferences Saved');
					}
				}
				return result;
			})
			.catch(function(error) {
				console.error('[Funky.Preferences] SaveAll error:', error);
				if (Funky.Toast) {
					Funky.Toast.error('Failed to save preferences', 'Error Saving Preferences');
				}
				throw error;
			});
	};

	/**
	 * Get a preference value
	 * @param {string} key - Dot notation key (e.g., 'theme.mode')
	 * @returns {*} The preference value or default
	 */
	FunkyPreferences.prototype.get = function(key) {
		var parts = key.split('.');
		var source = this.cache || this.defaults;
		var defaults = this.defaults;

		for (var i = 0; i < parts.length; i++) {
			// Always traverse defaults in parallel to track the correct default
			defaults = defaults && defaults[parts[i]];

			if (source && typeof source === 'object' && parts[i] in source) {
				source = source[parts[i]];
			} else {
				// Key doesn't exist in source, return the default for this level
				return defaults;
			}
		}

		return source;
	};

	/**
	 * Set a preference value and save
	 */
	FunkyPreferences.prototype.set = function(key, value) {
		var parts = key.split('.');
		var category = parts[0];
		var categoryData = Object.assign({}, this.get(category) || {});

		if (parts.length === 2) {
			categoryData[parts[1]] = value;
		} else if (parts.length === 1) {
			categoryData = value;
		}

		if (!this.cache) this.cache = {};
		this.cache[category] = categoryData;

		return this.save(category, categoryData);
	};

	/**
	 * Add a listener for preference changes
	 */
	FunkyPreferences.prototype.addListener = function(callback) {
		if (typeof callback === 'function') {
			this.changeListeners.push(callback);
		}
	};

	/**
	 * Remove a preference change listener
	 */
	FunkyPreferences.prototype.removeListener = function(callback) {
		var index = this.changeListeners.indexOf(callback);
		if (index > -1) {
			this.changeListeners.splice(index, 1);
		}
	};

	/**
	 * Notify all change listeners
	 */
	FunkyPreferences.prototype.notifyChangeListeners = function(category, data) {
		this.changeListeners.forEach(function(listener) {
			try {
				listener(category, data);
			} catch (error) {
				console.error('[Funky.Preferences] Listener error:', error);
			}
		});
	};

	/**
	 * Set preferences data (Bindable Interface)
	 * @param {Object} prefs - Preferences object to set
	 */
	FunkyPreferences.prototype.setData = function(prefs) {
		if (!prefs || typeof prefs !== 'object') {
			console.warn('[Funky.Preferences] setData expects an object');
			return;
		}

		// Merge with existing cache
		this.cache = Object.assign({}, this.cache || {}, prefs);
		this.loaded = true;

		// Apply the preferences
		this.apply();

		// Notify listeners for each category
		var self = this;
		Object.keys(prefs).forEach(function(category) {
			self.notifyChangeListeners(category, prefs[category]);
		});
	};

	/**
	 * Get current preferences data (Bindable Interface)
	 * @returns {Object} - Current preferences cache (or cloned defaults if no cache)
	 */
	FunkyPreferences.prototype.getData = function() {
		if (this.cache) {
			return this.cache;
		}
		// Return a clone of defaults to prevent mutation
		return JSON.parse(JSON.stringify(this.defaults));
	};

	/**
	 * Apply loaded preferences to UI
	 */
	FunkyPreferences.prototype.apply = function() {
		var self = this;

		if (!this.cache) {
			console.warn('[Funky.Preferences] No cache available, skipping apply');
			return;
		}

		console.log('[Funky.Preferences] Applying preferences:', this.cache);

		var theme = this.cache.theme || {};

		// Apply theme mode
		if (theme.mode) {
			var effectiveMode = theme.mode;
			if (theme.mode === 'system') {
				// Use MediaQuery if available for shared listener
				var prefersDark = Funky.MediaQuery 
					? Funky.MediaQuery.matches('dark-mode')
					: window.matchMedia('(prefers-color-scheme: dark)').matches;
				effectiveMode = prefersDark ? 'dark' : 'light';
			}

			document.body.setAttribute('data-theme', effectiveMode);
			document.documentElement.setAttribute('data-theme', effectiveMode);

			var themeSelect = document.getElementById('themeSelect');
			if (themeSelect) themeSelect.value = theme.mode;
		}

		// Apply accent color
		if (theme.accent_color) {
			document.documentElement.style.setProperty('--user-accent', theme.accent_color);
			var hoverColor = this.darkenColor(theme.accent_color, 15);
			document.documentElement.style.setProperty('--user-accent-hover', hoverColor);
			var rgb = this.hexToRgb(theme.accent_color);
			if (rgb) {
				document.documentElement.style.setProperty('--user-accent-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
				document.documentElement.style.setProperty('--user-accent-muted', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.15)');
			}
		}

		// Apply navigation position FIRST (before sidebar icons)
		var navPosition = theme.nav_position || 'left';
		document.body.setAttribute('data-nav-position', navPosition);

		// Apply sidebar collapsed state
		if (theme.sidebar_collapsed !== undefined) {
			var sidebar = document.getElementById('sidebar');
			var mainWrapper = document.querySelector('.main-wrapper');
			var toggleIcon = document.querySelector('.sidebar-toggle span');

			// Get correct icons based on nav position
			var icons = { collapsed: '▶', expanded: '◀' }; // default left
			if (navPosition === 'top') {
				icons = { collapsed: '▼', expanded: '▲' };
			} else if (navPosition === 'bottom') {
				icons = { collapsed: '▲', expanded: '▼' };
			} else if (navPosition === 'right') {
				icons = { collapsed: '◀', expanded: '▶' };
			}

			if (sidebar) {
				if (theme.sidebar_collapsed) {
					sidebar.classList.add('collapsed');
					if (mainWrapper) mainWrapper.classList.add('sidebar-collapsed');
					if (toggleIcon) toggleIcon.textContent = icons.collapsed;
					Funky.Storage.setRaw('sidebar_collapsed', 'true');
				} else {
					sidebar.classList.remove('collapsed');
					if (mainWrapper) mainWrapper.classList.remove('sidebar-collapsed');
					if (toggleIcon) toggleIcon.textContent = icons.expanded;
					Funky.Storage.setRaw('sidebar_collapsed', 'false');
				}
			}
		}

		// Apply font scale, density, animations
		document.documentElement.style.setProperty('--user-font-scale', theme.font_scale || 1.0);
		document.documentElement.setAttribute('data-density', theme.density || 'comfortable');
		document.documentElement.setAttribute('data-animations', theme.animations_enabled !== false ? 'on' : 'off');

		// Apply focus style preference
		var focusStyle = theme.focus_style || theme.focusStyle || localStorage.getItem('funky_focus_style') || 'default';
		if (focusStyle && focusStyle !== 'default') {
			document.documentElement.setAttribute('data-focus-style', focusStyle);
		} else {
			document.documentElement.removeAttribute('data-focus-style');
		}

		// Apply custom colors
		this._applyCustomColors(theme);

		// Note: nav_position already applied above before sidebar collapsed state

		// Apply modal slide direction
		var modalSlideDirection = theme.modal_slide_direction || 'auto';
		if (Funky.Navigation && Funky.Navigation.setModalSlideDirection) {
			Funky.Navigation.setModalSlideDirection(modalSlideDirection, false);
		} else {
			document.body.setAttribute('data-modal-slide', modalSlideDirection);
		}

		// Hide initial loading overlay
		var loadingOverlay = document.getElementById('spaLoading');
		if (loadingOverlay && loadingOverlay.classList.contains('initial-load')) {
			setTimeout(function() {
				loadingOverlay.classList.remove('active');
				setTimeout(function() {
					loadingOverlay.classList.remove('initial-load');
				}, 200);
			}, 500);
		}
	};

	/**
	 * Apply custom color overrides
	 */
	FunkyPreferences.prototype._applyCustomColors = function(theme) {
		// Background color
		if (theme.background_color) {
			var bg = theme.background_color;
			document.documentElement.style.setProperty('--user-bg-primary', bg);
			document.documentElement.style.setProperty('--user-bg-secondary', this.lightenColor(bg, 8));
			document.documentElement.style.setProperty('--user-bg-tertiary', this.lightenColor(bg, 15));
			document.documentElement.style.setProperty('--user-bg-elevated', this.lightenColor(bg, 22));
		} else {
			document.documentElement.style.removeProperty('--user-bg-primary');
			document.documentElement.style.removeProperty('--user-bg-secondary');
			document.documentElement.style.removeProperty('--user-bg-tertiary');
			document.documentElement.style.removeProperty('--user-bg-elevated');
		}

		// Font color
		if (theme.font_color) {
			document.documentElement.style.setProperty('--user-text-primary', theme.font_color);
			document.documentElement.style.setProperty('--user-text-secondary', this.adjustColorOpacity(theme.font_color, 0.65));
		} else {
			document.documentElement.style.removeProperty('--user-text-primary');
			document.documentElement.style.removeProperty('--user-text-secondary');
		}

		// Border color
		if (theme.border_color) {
			document.documentElement.style.setProperty('--user-border-color', theme.border_color);
			document.documentElement.style.setProperty('--user-border-muted', this.adjustColorOpacity(theme.border_color, 0.5));
			document.documentElement.style.setProperty('--user-border-emphasis', this.darkenColor(theme.border_color, 15));
		} else {
			document.documentElement.style.removeProperty('--user-border-color');
			document.documentElement.style.removeProperty('--user-border-muted');
			document.documentElement.style.removeProperty('--user-border-emphasis');
		}

		// Link color
		if (theme.link_color) {
			document.documentElement.style.setProperty('--user-link-color', theme.link_color);
			document.documentElement.style.setProperty('--user-link-hover', this.lightenColor(theme.link_color, 15));
		} else {
			document.documentElement.style.removeProperty('--user-link-color');
			document.documentElement.style.removeProperty('--user-link-hover');
		}
	};

	/**
	 * Reset a category to defaults
	 */
	FunkyPreferences.prototype.reset = function(category) {
		var self = this;
		var endpoint = this.endpoint;

		var resetFn;
		if (Funky.Api && Funky.Api.delete) {
			resetFn = Funky.Api.delete(endpoint + '/' + category);
		} else {
			resetFn = fetch(endpoint + '/' + category, {
				method: 'DELETE',
				credentials: 'same-origin',
				headers: {
					'Accept': 'application/json',
					'X-CSRF-Token': this.getCsrfToken()
				}
			}).then(function(response) {
				if (!response.ok) throw new Error('Failed to reset preferences');
				return response.json();
			});
		}

		return resetFn
			.then(function(result) {
				if (result.success && result.data) {
					if (!self.cache) self.cache = {};
					self.cache[category] = result.data;
					if (Funky.Toast) {
						Funky.Toast.info('Preferences reset to defaults', 'Reset');
					}
				}
				return result;
			})
			.catch(function(error) {
				console.error('[Funky.Preferences] Reset error:', error);
				if (Funky.Toast) {
					Funky.Toast.error('Failed to reset preferences', 'Error');
				}
				throw error;
			});
	};

	// Helper methods
	FunkyPreferences.prototype.adjustColorOpacity = function(hex, opacity) {
		var rgb = this.hexToRgb(hex);
		if (!rgb) return hex;
		return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + opacity + ')';
	};

	FunkyPreferences.prototype.getCsrfToken = function() {
		var match = document.cookie.match(/csrf_token=([^;]+)/);
		return match ? match[1] : '';
	};

	FunkyPreferences.prototype.darkenColor = function(hex, percent) {
		var rgb = this.hexToRgb(hex);
		if (!rgb) return hex;
		var factor = (100 - percent) / 100;
		var r = Math.round(rgb.r * factor);
		var g = Math.round(rgb.g * factor);
		var b = Math.round(rgb.b * factor);
		return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	};

	FunkyPreferences.prototype.lightenColor = function(hex, percent) {
		var rgb = this.hexToRgb(hex);
		if (!rgb) return hex;
		var factor = percent / 100;
		var r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
		var g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
		var b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));
		return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	};

	FunkyPreferences.prototype.hexToRgb = function(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	};

	// =========================================================================
	// Preference Binding (for component integration)
	// =========================================================================

	/**
	 * Bindings registry - stores active preference bindings
	 */
	var _bindings = {};
	var _bindingIdCounter = 0;

	/**
	 * Create a preference binding for a component
	 * Provides encapsulated load/save/sync with cross-tab support
	 * 
	 * @param {Object} options - Binding configuration
	 * @param {string} options.key - Preference namespace key (e.g., 'quicknav')
	 * @param {Array<string>} [options.persist] - Settings to persist (filters getState output)
	 * @param {Function} options.getState - Returns current state to save
	 * @param {Function} options.applyState - Applies loaded state
	 * @param {string} [options.onLoad] - PubSub event to emit when loaded
	 * @param {string} [options.onSave] - PubSub event to emit when saved
	 * @param {string} [options.onClear] - PubSub event to emit when cleared
	 * @returns {Object} Binding object with save(), load(), clear(), destroy()
	 * 
	 * @example
	 * var binding = Funky.Preferences.bind({
	 *   key: 'quicknav',
	 *   persist: ['position', 'collapsed'],
	 *   getState: function() { return { position: config.position, collapsed: config.collapsed }; },
	 *   applyState: function(saved) { 
	 *     if (saved.position) setPosition(saved.position);
	 *   },
	 *   onLoad: 'funky:quicknav:preferences:loaded'
	 * });
	 * 
	 * // Later:
	 * binding.save();
	 * binding.destroy();
	 */
	FunkyPreferences.prototype.bind = function(options) {
		if (!options || !options.key) {
			console.warn('[Funky.Preferences.bind] key is required');
			return null;
		}

		if (typeof options.getState !== 'function') {
			console.warn('[Funky.Preferences.bind] getState function is required');
			return null;
		}

		if (typeof options.applyState !== 'function') {
			console.warn('[Funky.Preferences.bind] applyState function is required');
			return null;
		}

		var self = this;
		var bindingId = 'binding-' + (++_bindingIdCounter);
		var key = options.key;
		var persist = options.persist || null;  // null means persist all
		var getState = options.getState;
		var applyState = options.applyState;
		var onLoad = options.onLoad;
		var onSave = options.onSave;
		var onClear = options.onClear;

		var externalChangeHandler = null;

		/**
		 * Filter state to only include persisted keys
		 * @param {Object} state - Full state object
		 * @returns {Object} Filtered state
		 */
		function filterState(state) {
			if (!persist || !Array.isArray(persist)) {
				return state;
			}
			var filtered = {};
			persist.forEach(function(k) {
				if (state.hasOwnProperty(k)) {
					filtered[k] = state[k];
				}
			});
			return filtered;
		}

		/**
		 * Check if a setting should be persisted
		 * @param {string} setting - Setting name
		 * @returns {boolean}
		 */
		function shouldPersist(setting) {
			if (!persist || !Array.isArray(persist)) {
				return true;  // Persist all if no filter
			}
			return persist.indexOf(setting) !== -1;
		}

		/**
		 * Load saved preferences and apply them
		 */
		function load() {
			var saved = self.get(key);
			if (!saved) return;

			applyState(saved);

			if (onLoad && Funky.PubSub) {
				Funky.PubSub.emit(onLoad, saved);
			}
		}

		/**
		 * Save current preferences
		 */
		function save() {
			var state = getState();
			var filtered = filterState(state);

			self.set(key, filtered);

			if (onSave && Funky.PubSub) {
				Funky.PubSub.emit(onSave, filtered);
			}
		}

		/**
		 * Clear saved preferences
		 */
		function clear() {
			self.remove(key);

			if (onClear && Funky.PubSub) {
				Funky.PubSub.emit(onClear);
			}
		}

		/**
		 * Get current preferences (filtered)
		 * @returns {Object}
		 */
		function get() {
			return filterState(getState());
		}

		/**
		 * Initialize the binding
		 */
		function init() {
			// Load saved preferences
			load();

			// Listen for preference changes from other tabs/windows
			if (Funky.PubSub) {
				externalChangeHandler = function(data) {
					if (data && data.key === key) {
						load();
					}
				};
				Funky.PubSub.on('funky:preferences:changed', externalChangeHandler);
			}
		}

		/**
		 * Destroy the binding and cleanup
		 */
		function destroy() {
			if (externalChangeHandler && Funky.PubSub) {
				Funky.PubSub.off('funky:preferences:changed', externalChangeHandler);
				externalChangeHandler = null;
			}
			delete _bindings[bindingId];
		}

		// Create binding object
		var binding = {
			id: bindingId,
			key: key,
			load: load,
			save: save,
			clear: clear,
			get: get,
			shouldPersist: shouldPersist,
			destroy: destroy
		};

		// Store in registry
		_bindings[bindingId] = binding;

		// Initialize
		init();

		return binding;
	};

	/**
	 * Get all active bindings
	 * @returns {Object} Bindings registry
	 */
	FunkyPreferences.prototype.getBindings = function() {
		return _bindings;
	};

	/**
	 * Destroy a binding by ID
	 * @param {string} bindingId - Binding ID to destroy
	 */
	FunkyPreferences.prototype.destroyBinding = function(bindingId) {
		if (_bindings[bindingId]) {
			_bindings[bindingId].destroy();
		}
	};

	// Create default instance
	var preferencesInstance = new FunkyPreferences('default');

	// Bindable Interface: Static methods on the instance object
	/**
	 * Get Preferences instance by context ID (Bindable Interface)
	 * @param {string} contextId - Context/section ID (defaults to 'default')
	 * @returns {FunkyPreferences|undefined}
	 */
	preferencesInstance.getInstance = function(contextId) {
		return _instances.get(contextId || 'default');
	};

	/**
	 * Set preferences data by context ID (Bindable Interface)
	 * @param {string} contextId - Context/section ID
	 * @param {Object} prefs - Preferences data
	 * @returns {boolean} - True if successful
	 */
	preferencesInstance.setDataById = function(contextId, prefs) {
		var instance = _instances.get(contextId || 'default');
		if (!instance) {
			console.warn('[Funky.Preferences] setDataById: Instance not found:', contextId);
			return false;
		}
		instance.setData(prefs);
		return true;
	};

	/**
	 * Get preferences data by context ID (Bindable Interface)
	 * @param {string} contextId - Context/section ID
	 * @returns {Object|null} - Preferences data or null
	 */
	preferencesInstance.getDataById = function(contextId) {
		var instance = _instances.get(contextId || 'default');
		if (!instance) {
			return null;
		}
		return instance.getData();
	};

	// Expose getAll for debugging
	preferencesInstance.getAll = function() {
		return _instances.getAll();
	};

	// Expose _instances registry for consistency with other components
	preferencesInstance._instances = _instances;

	// Register with Funky namespace
	Funky.register('Preferences', preferencesInstance);

	// Auto-load and apply preferences on page load (if enabled)
	if (AUTO_LOAD) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				preferencesInstance.load().then(function() {
					preferencesInstance.apply();
					// Check high contrast preference after preferences are loaded
					checkHighContrastPreference();
				});
			});
		} else {
			preferencesInstance.load().then(function() {
				preferencesInstance.apply();
				// Check high contrast preference after preferences are loaded
				checkHighContrastPreference();
			});
		}
	}

	// =========================================================================
	// High Contrast OS Preference Detection
	// =========================================================================

	/**
	 * Detect OS high contrast preference and prompt user to switch themes
	 * Only prompts once per browser session unless preference changes
	 */
	var highContrastQuery = window.matchMedia('(prefers-contrast: high)');

	/**
	 * Check if user's OS has high contrast mode enabled and prompt to switch theme
	 */
	function checkHighContrastPreference() {
		// Skip if MediaQuery API not available
		if (!highContrastQuery) return;

		// Get current theme from preferences or localStorage
		var currentTheme = preferencesInstance.get('theme.mode') ||
		                   localStorage.getItem('funky-theme') ||
		                   'dark';

		// Check if we've already prompted this session
		var prompted = sessionStorage.getItem('funky-high-contrast-prompted');

		// If OS has high contrast enabled, user isn't already on high-contrast theme, and we haven't prompted
		if (highContrastQuery.matches && currentTheme !== 'high-contrast' && !prompted) {
			// Wait for Toast to be available
			var showPrompt = function() {
				if (!Funky.Toast) {
					// Try again in a moment if Toast isn't ready
					setTimeout(showPrompt, 500);
					return;
				}

				Funky.Toast.info(
					'High contrast mode detected. Would you like to enable the High Contrast theme for better visibility?',
					{
						title: 'Accessibility',
						duration: 15000,
						action: {
							label: 'Enable High Contrast',
							handler: function() {
								enableHighContrastTheme();
							}
						}
					}
				);
			};

			// Small delay to let page finish loading
			setTimeout(showPrompt, 1000);

			// Mark as prompted for this session
			sessionStorage.setItem('funky-high-contrast-prompted', 'true');
		}
	}

	/**
	 * Enable the high contrast theme and save preference
	 */
	function enableHighContrastTheme() {
		// Apply theme immediately
		document.body.setAttribute('data-theme', 'high-contrast');
		document.documentElement.setAttribute('data-theme', 'high-contrast');

		// Save to localStorage for immediate persistence
		localStorage.setItem('funky-theme', 'high-contrast');

		// Save to preferences (this will sync to server)
		preferencesInstance.set('theme.mode', 'high-contrast').then(function() {
			if (Funky.Toast) {
				Funky.Toast.success('High Contrast theme enabled', 'Theme Changed');
			}
		}).catch(function() {
			// Even if server save fails, local change is applied
			if (Funky.Toast) {
				Funky.Toast.success('High Contrast theme enabled', 'Theme Changed');
			}
		});

		// Emit event for other components
		if (Funky.PubSub) {
			Funky.PubSub.emit('funky:theme:changed', { theme: 'high-contrast' });
		}
	}

	/**
	 * Listen for OS high contrast preference changes
	 * If user enables high contrast on their OS mid-session, prompt them
	 */
	if (highContrastQuery.addEventListener) {
		highContrastQuery.addEventListener('change', function(event) {
			if (event.matches) {
				// OS just enabled high contrast - reset the prompted flag and check again
				sessionStorage.removeItem('funky-high-contrast-prompted');
				checkHighContrastPreference();
			}
		});
	} else if (highContrastQuery.addListener) {
		// Fallback for older browsers
		highContrastQuery.addListener(function(event) {
			if (event.matches) {
				sessionStorage.removeItem('funky-high-contrast-prompted');
				checkHighContrastPreference();
			}
		});
	}

	// Expose check function for manual triggering if needed
	preferencesInstance.checkHighContrastPreference = checkHighContrastPreference;

})(window);
