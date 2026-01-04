/**
 * Funky Forms - Form Enhancement Utilities
 * 
 * Auto-initializes Funky.ComboBox on all <select> elements.
 * Integrates with SPA lifecycle for proper cleanup on navigation.
 * 
 * Configuration via data attributes:
 *   data-placeholder="Select an option..."
 *   data-clearable="true"
 *   data-tags="true"
 *   data-min-search-length="2"
 *   data-remote-url="/api/search"
 *   data-searchable="false" - Hide search box
 *   data-no-combobox - Skip ComboBox initialization for this element
 * 
 * Usage:
 *   Funky.Forms.initComboBox();           // Init all selects in #spaContent
 *   Funky.Forms.initComboBox('#myForm');  // Init selects in specific container
 *   Funky.Forms.destroyComboBox();        // Cleanup all ComboBox in #spaContent
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Forms] Registry not found. Load namespace.js first.');
		return;
	}

	var Forms = {
		/**
		 * Initialize ComboBox on all <select> elements within a container
		 * 
		 * @param {string|Element} container - Selector or element (default: '#spaContent')
		 */
		initComboBox: function(container) {
			var ComboBox = window.Funky && window.Funky.ComboBox;
			if (!ComboBox) {
				console.warn('[Funky.Forms] Funky.ComboBox not available');
				return;
			}

			var root;
			if (container) {
				root = typeof container === 'string' ? document.querySelector(container) : container;
			} else {
				root = document.getElementById('spaContent');
			}

			if (!root) {
				return;
			}

			// Find all select elements that don't have data-no-combobox and aren't already initialized
			var selects = root.querySelectorAll('select:not([data-no-combobox]):not([data-combobox-initialized])');
			var count = 0;

			for (var i = 0; i < selects.length; i++) {
				var select = selects[i];
				var config = Forms._buildComboBoxConfig(select);

				try {
					ComboBox.init(select, config);
					select.setAttribute('data-combobox-initialized', 'true');
					count++;
				} catch (e) {
					console.error('[Funky.Forms] ComboBox init error:', e);
				}
			}

			if (count > 0) {
				console.log('[Funky.Forms] Initialized ComboBox on', count, 'elements');
			}
		},

		/**
		 * Build ComboBox configuration from data attributes
		 * 
		 * @param {HTMLElement} select - The select element
		 * @returns {object} - ComboBox configuration object
		 */
		_buildComboBoxConfig: function(select) {
			var config = {
				searchable: true,
				clearable: false
			};

			// Placeholder
			var placeholder = select.dataset.placeholder || select.getAttribute('placeholder');
			if (placeholder) {
				config.placeholder = placeholder;
				config.clearable = true; // Enable clear when placeholder is set
			}

			// Clearable
			if (select.dataset.clearable !== undefined) {
				config.clearable = select.dataset.clearable === 'true';
			}

			// Searchable (hide search box if false)
			if (select.dataset.searchable !== undefined) {
				config.searchable = select.dataset.searchable !== 'false';
			}

			// Tags mode (allow new entries)
			if (select.dataset.tags === 'true') {
				config.tags = true;
			}

			// Minimum search length
			if (select.dataset.minSearchLength) {
				config.minSearchLength = parseInt(select.dataset.minSearchLength, 10);
			}

			// Remote/AJAX configuration
			var remoteUrl = select.dataset.remoteUrl;
			if (remoteUrl) {
				config.remote = {
					url: remoteUrl,
					searchParam: 'q',
					pageParam: 'page',
					delay: 250
				};
				config.minSearchLength = config.minSearchLength || 1;
			}

			// Dropdown parent (for modals)
			var modal = select.closest('.modal');
			if (modal) {
				config.dropdownParent = modal;
			}

			// Multi-select mode
			if (select.multiple) {
				config.mode = 'multi';
			}

			return config;
		},

		/**
		 * Destroy ComboBox instances within a container
		 * 
		 * @param {string|Element} container - Selector or element (default: '#spaContent')
		 */
		destroyComboBox: function(container) {
			var ComboBox = window.Funky && window.Funky.ComboBox;
			if (!ComboBox) {
				return;
			}

			var root;
			if (container) {
				root = typeof container === 'string' ? document.querySelector(container) : container;
			} else {
				root = document.getElementById('spaContent');
			}

			if (!root) {
				return;
			}

			// Find all initialized ComboBox elements and destroy them
			var elements = root.querySelectorAll('[data-combobox-initialized]');
			for (var i = 0; i < elements.length; i++) {
				var instance = ComboBox.getInstance(elements[i]);
				if (instance) {
					try {
						instance.destroy();
					} catch (e) {
						// Ignore errors during cleanup
					}
				}
				elements[i].removeAttribute('data-combobox-initialized');
			}
		},

		/**
		 * Refresh a specific ComboBox instance (useful after dynamic option changes)
		 * 
		 * @param {string|Element} selector - The select element
		 */
		refreshComboBox: function(selector) {
			var ComboBox = window.Funky && window.Funky.ComboBox;
			if (!ComboBox) {
				return;
			}

			// Guard against invalid selector
			if (!selector) {
				return;
			}

			var element;
			if (typeof selector === 'string') {
				try {
					element = document.querySelector(selector);
				} catch (e) {
					console.warn('[Funky.Forms] Invalid selector:', selector);
					return;
				}
			} else {
				element = selector;
			}

			var instance = ComboBox.getInstance(element);
			if (instance) {
				instance.refresh();
			}
		},

		/**
		 * Set ComboBox value programmatically
		 *
		 * @param {string|Element} selector - The select element
		 * @param {*} value - The value to set
		 * @param {boolean} silent - Whether to suppress change event (default: false)
		 */
		setComboBoxValue: function(selector, value, silent) {
			var ComboBox = window.Funky && window.Funky.ComboBox;
			if (!ComboBox) {
				return;
			}

			// Guard against invalid selector
			if (!selector) {
				return;
			}

			var element;
			if (typeof selector === 'string') {
				try {
					element = document.querySelector(selector);
				} catch (e) {
					console.warn('[Funky.Forms] Invalid selector:', selector);
					return;
				}
			} else {
				element = selector;
			}

			var instance = ComboBox.getInstance(element);
			if (instance) {
				instance.setValue(value, { silent: silent });
			}
		},

		// Legacy aliases for backward compatibility during transition
		initSelect2: function(container) {
			console.warn('[Funky.Forms] initSelect2 is deprecated, use initComboBox');
			this.initComboBox(container);
		},
		destroySelect2: function(container) {
			console.warn('[Funky.Forms] destroySelect2 is deprecated, use destroyComboBox');
			this.destroyComboBox(container);
		},
		refreshSelect2: function(selector) {
			console.warn('[Funky.Forms] refreshSelect2 is deprecated, use refreshComboBox');
			this.refreshComboBox(selector);
		},
		setSelect2Value: function(selector, value, silent) {
			console.warn('[Funky.Forms] setSelect2Value is deprecated, use setComboBoxValue');
			this.setComboBoxValue(selector, value, silent);
		}
	};

	// Register with Funky namespace
	Funky.register('Forms', Forms);

})(window);
