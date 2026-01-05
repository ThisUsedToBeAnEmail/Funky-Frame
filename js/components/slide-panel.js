/**
 * Funky SlidePanel - Slide-in panel modal enhancements
 * Handles body scroll lock, focus trapping, and smooth animations for slide-in panels
 * 
 * Usage:
 *   Funky.SlidePanel.init();
 *   Funky.SlidePanel.lockScroll();
 *   Funky.SlidePanel.unlockScroll();
 * 
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.SlidePanel] Registry not found. Load namespace.js first.');
		return;
	}

	// Track open slide panels for nested modal handling
	var openPanelCount = 0;
	var scrollPosition = 0;
	var keyboardUnregisters = [];  // Track keyboard shortcut cleanup functions

	/**
	 * Lock body scroll when slide panel opens
	 */
	function lockBodyScroll() {
		if (openPanelCount === 0) {
			scrollPosition = window.pageYOffset;
			document.body.style.overflow = 'hidden';
			document.body.style.position = 'fixed';
			document.body.style.top = '-' + scrollPosition + 'px';
			document.body.style.width = '100%';
		}
		openPanelCount++;
	}

	/**
	 * Unlock body scroll when slide panel closes
	 */
	function unlockBodyScroll() {
		openPanelCount--;
		if (openPanelCount <= 0) {
			openPanelCount = 0;
			document.body.style.overflow = '';
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			window.scrollTo(0, scrollPosition);
		}
	}

	/**
	 * Simple focus trap for accessibility
	 * @param {HTMLElement} modal - The modal element to trap focus within
	 */
	function trapFocus(modal) {
		var focusableElements = modal.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		var firstFocusable = focusableElements[0];
		var lastFocusable = focusableElements[focusableElements.length - 1];

		function handleTabKey(e) {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === firstFocusable) {
					e.preventDefault();
					lastFocusable.focus();
				}
			} else {
				if (document.activeElement === lastFocusable) {
					e.preventDefault();
					firstFocusable.focus();
				}
			}
		}

		modal.addEventListener('keydown', handleTabKey);

		// Focus first focusable element
		if (firstFocusable) {
			setTimeout(function() { firstFocusable.focus(); }, 100);
		}

		return function removeTrap() {
			modal.removeEventListener('keydown', handleTabKey);
		};
	}

	/**
	 * Initialize slide panel enhancements
	 */
	function initSlidePanels() {
		// Listen for Funky modal events on slide panels
		document.querySelectorAll('.modal-slide-panel').forEach(function(modal) {
			var removeFocusTrap = null;

			// Skip if already initialized
			if (modal._slidePanelInit) return;
			modal._slidePanelInit = true;

			// When modal is about to show
			modal.addEventListener('funky.modal.show', function() {
				lockBodyScroll();
			});

			// When modal is fully shown
			modal.addEventListener('funky.modal.shown', function() {
				removeFocusTrap = trapFocus(modal);

				// Push keyboard scope for this modal
				if (Funky.Keyboard) {
					Funky.Keyboard.pushScope('slide-panel');
				}
			});

			// When modal is about to hide
			modal.addEventListener('funky.modal.hide', function() {
				if (removeFocusTrap) {
					removeFocusTrap();
					removeFocusTrap = null;
				}

				// Pop keyboard scope
				if (Funky.Keyboard) {
					Funky.Keyboard.popScope();
				}
			});

			// When modal is fully hidden
			modal.addEventListener('funky.modal.hidden', function() {
				unlockBodyScroll();
			});
		});
	}

	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSlidePanels);
	} else {
		initSlidePanels();
	}

	// Re-initialize after AJAX navigation (for SPA)
	document.addEventListener('funky.page-loaded', initSlidePanels);

	// Create SlidePanel object
	var SlidePanel = {
		/**
		 * Instance registry for Bindable Interface
		 * Allows external access via Funky.SlidePanel._instances[panelId]
		 */
		_instances: {},

		init: initSlidePanels,
		lockScroll: lockBodyScroll,
		unlockScroll: unlockBodyScroll,

		/**
		 * Register a slide panel instance by ID (Bindable Interface)
		 * @param {string} panelId - Panel element ID
		 * @param {object} [options] - Optional configuration
		 * @returns {object} Instance object with show/hide/setData methods
		 */
		register: function(panelId, options) {
			var panel = document.getElementById(panelId);
			if (!panel) {
				console.error('[Funky.SlidePanel] Panel not found:', panelId);
				return null;
			}

			var self = this;
			var instance = {
				panelId: panelId,
				options: options || {},
				element: panel,
				_data: null,

				show: function() {
					Funky.Modal.show('#' + panelId);
				},

				hide: function() {
					Funky.Modal.hide('#' + panelId);
				},

				/**
				 * Set panel content data (Bindable Interface)
				 * @param {object} data - Data to set
				 * @param {string} [data.title] - Panel title
				 * @param {string} [data.content] - Panel body content (HTML)
				 * @param {string} [data.footer] - Panel footer content (HTML)
				 */
				setData: function(data) {
					this._data = data;

					if (data.title) {
						var titleEl = panel.querySelector('.modal-title');
						if (titleEl) titleEl.textContent = data.title;
					}

					if (data.content !== undefined) {
						var bodyEl = panel.querySelector('.modal-body');
						if (bodyEl) {
							bodyEl.replaceChildren();
							bodyEl.appendChild(Funky.Util.toDom(data.content));
						}
					}

					if (data.footer !== undefined) {
						var footerEl = panel.querySelector('.modal-footer');
						if (footerEl) {
							footerEl.replaceChildren();
							footerEl.appendChild(Funky.Util.toDom(data.footer));
						}
					}

					// Store data on element for reference
					panel._panelData = data;

					// Emit event for listeners
					panel.dispatchEvent(new CustomEvent('funky.slide-panel.data-set', { detail: data }));
				},

				getData: function() {
					return this._data;
				}
			};

			this._instances[panelId] = instance;
			return instance;
		},

		/**
		 * Get instance by panel ID (Bindable Interface)
		 * @param {string} panelId - Panel ID
		 * @returns {object|null} Instance object with show/hide/setData methods
		 */
		getInstance: function(panelId) {
			return this._instances[panelId] || null;
		},

		/**
		 * Set data on a panel (convenience method)
		 * @param {string} panelId - Panel ID
		 * @param {object} data - Data to set
		 */
		setData: function(panelId, data) {
			var instance = this._instances[panelId];
			if (instance) {
				instance.setData(data);
			} else {
				// Auto-register if not already registered
				instance = this.register(panelId);
				if (instance) instance.setData(data);
			}
		},

		/**
		 * Destroy a panel instance
		 * @param {string} panelId - Panel ID
		 */
		destroy: function(panelId) {
			var instance = this._instances[panelId];
			if (instance) {
				instance.hide();
				if (instance.element) {
					instance.element._slidePanelInit = false;
				}
				delete this._instances[panelId];
			}
		},

		/**
		 * Destroy all panel instances
		 */
		destroyAll: function() {
			var self = this;
			Object.keys(this._instances).forEach(function(panelId) {
				self.destroy(panelId);
			});
		}
	};

	// Register with Funky namespace
	Funky.register('SlidePanel', SlidePanel);

})(window);
