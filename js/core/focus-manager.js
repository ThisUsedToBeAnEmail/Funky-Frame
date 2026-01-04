/**
 * Funky Focus Manager - Centralized Focus History & Navigation
 *
 * Composes existing Funky modules:
 * - Funky.History for focus tracking
 * - Funky.Announce for screen reader feedback
 *
 * Features:
 * - Focus history stack for "back" navigation
 * - Region-based navigation
 * - Input completion handling (filter/search inputs)
 * - Mobile virtual keyboard dismissal
 *
 * @module Funky.FocusManager
 * @version 1.0.0
 */
(function(window) {
	'use strict';

	// Registry guard
	if (typeof Funky !== 'undefined' && Funky.isRegistered && Funky.isRegistered('FocusManager')) {
		return;
	}

	// ==========================================================================
	// CONSTANTS
	// ==========================================================================

	var FOCUSABLE_SELECTORS = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled]):not([type="hidden"])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
		'[contenteditable="true"]'
	].join(', ');

	var FILTER_INPUT_SELECTORS = [
		'[data-filter-input]',
		'[data-search-input]',
		'input[type="search"]',
		'.filter-toolbar input',
		'.search-box input'
	].join(', ');

	// ==========================================================================
	// STATE (using Funky.History!)
	// ==========================================================================

	var focusHistory = null;  // Lazy init - Funky.History instance
	var regions = [];
	var currentRegion = null;
	var _cleanups = [];       // Cleanup functions for proper memory management
	var _emitEvents = true;   // Whether to emit PubSub events

	// ==========================================================================
	// EVENT EMISSION
	// ==========================================================================

	/**
	 * Emit an event via PubSub if events are enabled
	 * @param {string} eventName - Event name (e.g., 'funky:focus:push')
	 * @param {Object} data - Event data
	 */
	function emit(eventName, data) {
		if (!_emitEvents || !Funky.PubSub) return;
		Funky.PubSub.emit(eventName, data);
	}

	/**
	 * Enable or disable event emission
	 * @param {boolean} enabled
	 */
	function setEmitEvents(enabled) {
		_emitEvents = !!enabled;
	}

	/**
	 * Get or create the focus history instance
	 * Uses Funky.History for all the heavy lifting
	 */
	function getHistory() {
		if (!focusHistory && Funky.History) {
			focusHistory = Funky.History.create({
				key: null,           // No persistence - DOM elements can't be serialized
				persist: false,
				maxItems: 20,
				dedupe: true,
				comparator: function(a, b) {
					// Compare DOM elements by identity
					return a === b;
				},
				emitEvents: false    // We'll handle our own events
			});
		}
		return focusHistory;
	}

	// ==========================================================================
	// FOCUS HISTORY
	// ==========================================================================

	/**
	 * Push current focus to history and focus a new element
	 * @param {Element} element - Element to focus
	 * @param {Object} [options]
	 * @param {boolean} [options.preventScroll] - Prevent scroll on focus
	 * @param {string} [options.label] - Label for screen reader announcement
	 */
	function focusAndPush(element, options) {
		options = options || {};
		var history = getHistory();

		if (!element || typeof element.focus !== 'function') {
			console.warn('[FocusManager] Invalid element for focus');
			return;
		}

		// Push current focus to history (if it's a real element)
		var current = document.activeElement;
		if (current && current !== document.body && current !== document) {
			if (history) {
				// Filter out stale elements before adding
				cleanHistory();
				history.add(current);

				// Emit push event
				emit('funky:focus:push', {
					previous: current,
					next: element,
					historyLength: history.size()
				});
			}
		}

		// Focus the new element
		try {
			element.focus({ preventScroll: options.preventScroll || false });

			// Announce to screen readers if label provided
			if (options.label && Funky.Announce) {
				Funky.Announce.polite('Focused: ' + options.label);
			}
		} catch (e) {
			console.warn('[FocusManager] Focus failed:', e);
		}
	}

	/**
	 * Return to previous focus (pop from history)
	 * @returns {boolean} True if focus was restored, false if history empty
	 */
	function popFocus() {
		var history = getHistory();
		if (!history) return false;

		// Iterative approach with max attempts to prevent stack overflow
		var maxAttempts = 20;
		var attempts = 0;

		while (!history.isEmpty() && attempts < maxAttempts) {
			attempts++;
			var previous = history.pop();

			// Validate element is still in DOM and focusable
			if (previous && document.body.contains(previous)) {
				try {
					previous.focus({ preventScroll: true });

					// Emit pop event
					emit('funky:focus:pop', {
						element: previous,
						historyLength: history.size()
					});

					return true;
				} catch (e) {
					// Element may no longer be focusable, try next
					continue;
				}
			}
			// Element no longer exists, try next in history
		}

		return false;
	}

	/**
	 * Clean stale elements from history (no longer in DOM)
	 */
	function cleanHistory() {
		var history = getHistory();
		if (!history) return;

		// Get all items and filter
		var items = history.getAll();
		var validItems = items.filter(function(el) {
			return el && document.body.contains(el);
		});

		// If any were removed, rebuild history
		if (validItems.length !== items.length) {
			history.clear();
			// Add back in reverse order (oldest first)
			for (var i = validItems.length - 1; i >= 0; i--) {
				history.add(validItems[i], { silent: true });
			}
		}
	}

	/**
	 * Clear focus history
	 */
	function clearHistory() {
		var history = getHistory();
		if (history) {
			history.clear();
		}
	}

	/**
	 * Get current history length
	 * @returns {number}
	 */
	function getHistoryLength() {
		var history = getHistory();
		return history ? history.size() : 0;
	}

	// ==========================================================================
	// REGION NAVIGATION
	// ==========================================================================

	/**
	 * Register a navigation region
	 * @param {Object} region
	 * @param {string} region.name - Unique region name
	 * @param {Element|string} region.element - Element or selector
	 * @param {number} [region.order] - Tab order (lower = earlier)
	 */
	function registerRegion(region) {
		if (!region.name || !region.element) {
			console.warn('[FocusManager] Invalid region');
			return;
		}

		var el = typeof region.element === 'string'
			? document.querySelector(region.element)
			: region.element;

		if (!el) {
			console.warn('[FocusManager] Region element not found:', region.element);
			return;
		}

		// Remove existing region with same name
		regions = regions.filter(function(r) { return r.name !== region.name; });

		regions.push({
			name: region.name,
			element: el,
			order: region.order || 0
		});

		// Sort by order
		regions.sort(function(a, b) { return a.order - b.order; });
	}

	/**
	 * Auto-discover regions from data attributes
	 */
	function discoverRegions() {
		regions = [];  // Clear existing
		var elements = document.querySelectorAll('[data-nav-region]');

		for (var i = 0; i < elements.length; i++) {
			var el = elements[i];
			registerRegion({
				name: el.getAttribute('data-nav-region'),
				element: el,
				order: parseInt(el.getAttribute('data-nav-order') || '0', 10)
			});
		}
	}

	/**
	 * Get all registered regions
	 * @returns {Array}
	 */
	function getRegions() {
		return regions.slice();
	}

	/**
	 * Get current focused region
	 * @returns {Object|null}
	 */
	function getCurrentRegion() {
		// First check if activeElement is in a region
		var active = document.activeElement;
		for (var i = 0; i < regions.length; i++) {
			if (regions[i].element.contains(active)) {
				currentRegion = regions[i];
				return regions[i];
			}
		}
		// Fall back to last known region
		return currentRegion;
	}

	/**
	 * Navigate to next region
	 * @returns {boolean}
	 */
	function nextRegion() {
		if (regions.length === 0) return false;

		var current = getCurrentRegion();
		var currentIndex = current ? regions.indexOf(current) : -1;
		var nextIndex = (currentIndex + 1) % regions.length;

		return focusRegion(regions[nextIndex]);
	}

	/**
	 * Navigate to previous region
	 * @returns {boolean}
	 */
	function prevRegion() {
		if (regions.length === 0) return false;

		var current = getCurrentRegion();
		var currentIndex = current ? regions.indexOf(current) : 0;
		var prevIndex = (currentIndex - 1 + regions.length) % regions.length;

		return focusRegion(regions[prevIndex]);
	}

	/**
	 * Focus a specific region by name or object
	 * @param {Object|string} region - Region object or name
	 * @returns {boolean}
	 */
	function focusRegion(region) {
		// If string, find by name
		if (typeof region === 'string') {
			for (var i = 0; i < regions.length; i++) {
				if (regions[i].name === region) {
					region = regions[i];
					break;
				}
			}
			if (typeof region === 'string') {
				console.warn('[FocusManager] Region not found:', region);
				return false;
			}
		}

		if (!region || !region.element) return false;

		// Find first focusable element in region
		var focusable = region.element.querySelectorAll(FOCUSABLE_SELECTORS);

		if (focusable.length > 0) {
			var previousRegion = currentRegion;
			focusAndPush(focusable[0], { label: region.name });
			currentRegion = region;

			// Announce region change
			if (Funky.Announce) {
				Funky.Announce.polite('Navigated to ' + region.name + ' region');
			}

			// Emit region change event
			emit('funky:region:change', {
				previous: previousRegion ? previousRegion.name : null,
				current: region.name,
				element: region.element
			});

			// Update visual indicator
			updateRegionIndicator(region);
			return true;
		}

		// If no focusable children, try the region itself
		if (region.element.tabIndex >= 0) {
			var prevRegion = currentRegion;
			focusAndPush(region.element, { label: region.name });
			currentRegion = region;

			// Emit region change event
			emit('funky:region:change', {
				previous: prevRegion ? prevRegion.name : null,
				current: region.name,
				element: region.element
			});

			updateRegionIndicator(region);
			return true;
		}

		return false;
	}

	/**
	 * Update visual region indicator (for debug mode)
	 * @param {Object|null} activeRegion - Region to mark as active
	 */
	function updateRegionIndicator(activeRegion) {
		// Remove active class from all regions
		for (var i = 0; i < regions.length; i++) {
			regions[i].element.classList.remove('nav-region-active');
		}

		// Add to active region
		if (activeRegion && activeRegion.element) {
			activeRegion.element.classList.add('nav-region-active');
		}
	}

	// ==========================================================================
	// INPUT COMPLETION
	// ==========================================================================

	/**
	 * Check if element is a filter/search input
	 * @param {Element} element
	 * @returns {boolean}
	 */
	function isFilterInput(element) {
		if (!element || element.tagName !== 'INPUT') return false;
		return element.matches(FILTER_INPUT_SELECTORS);
	}

	/**
	 * Complete input and return focus
	 * Used for filter/search inputs to dismiss mobile keyboard
	 * @param {Object} options
	 * @param {Element} options.element - Input element
	 * @param {boolean} [options.returnFocus=true] - Return to previous focus
	 * @param {boolean} [options.clearValue=false] - Clear input value
	 * @param {Element} [options.focusTarget] - Specific element to focus (overrides popFocus)
	 */
	function completeInput(options) {
		options = options || {};
		var element = options.element;
		if (!element) return;

		// Clear value if requested
		if (options.clearValue) {
			element.value = '';
			element.dispatchEvent(new Event('input', { bubbles: true }));
		}

		// Blur to dismiss mobile keyboard
		element.blur();

		// iOS-specific: ensure keyboard dismissal with temporary input trick
		var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
		if (isIOS) {
			var temp = document.createElement('input');
			temp.style.cssText = 'position:absolute;opacity:0;height:0;width:0;';
			document.body.appendChild(temp);
			temp.focus();
			temp.blur();
			document.body.removeChild(temp);
		}

		// Return to previous focus or specific target
		if (options.returnFocus !== false) {
			// Small delay for mobile to complete keyboard dismissal
			setTimeout(function() {
				if (options.focusTarget && document.body.contains(options.focusTarget)) {
					options.focusTarget.focus();
				} else {
					popFocus();
				}
			}, isIOS ? 100 : 50);
		}

		// Announce
		if (Funky.Announce) {
			Funky.Announce.polite('Search complete');
		}
	}

	// ==========================================================================
	// UTILITY
	// ==========================================================================

	/**
	 * Get all focusable elements in a container
	 * @param {Element} container
	 * @returns {NodeList}
	 */
	function getFocusableElements(container) {
		return container.querySelectorAll(FOCUSABLE_SELECTORS);
	}

	/**
	 * Check if element is focusable
	 * @param {Element} element
	 * @returns {boolean}
	 */
	function isFocusable(element) {
		return element && element.matches(FOCUSABLE_SELECTORS);
	}

	// ==========================================================================
	// FOCUS TRAP
	// ==========================================================================

	/**
	 * Create a focus trap within a container
	 * Tab and Shift+Tab cycle through focusable elements without leaving
	 * @param {Element} container - Container to trap focus within
	 * @param {Object} [options]
	 * @param {boolean} [options.autoFocus=true] - Auto-focus first element
	 * @param {Element} [options.initialFocus] - Specific element to focus initially
	 * @returns {Function} Cleanup function to remove trap
	 */
	function trapFocus(container, options) {
		options = options || {};
		if (!container) return function() {};

		var focusables = getFocusableElements(container);
		if (focusables.length === 0) return function() {};

		var first = focusables[0];
		var last = focusables[focusables.length - 1];

		function handler(e) {
			if (e.key !== 'Tab') return;

			// Refresh focusable elements in case DOM changed
			var currentFocusables = getFocusableElements(container);
			if (currentFocusables.length === 0) return;

			var currentFirst = currentFocusables[0];
			var currentLast = currentFocusables[currentFocusables.length - 1];

			if (e.shiftKey) {
				// Shift+Tab: if on first element, wrap to last
				if (document.activeElement === currentFirst) {
					e.preventDefault();
					currentLast.focus();
				}
			} else {
				// Tab: if on last element, wrap to first
				if (document.activeElement === currentLast) {
					e.preventDefault();
					currentFirst.focus();
				}
			}
		}

		container.addEventListener('keydown', handler);

		// Auto-focus first element or specified initial focus
		if (options.autoFocus !== false) {
			var initialEl = options.initialFocus || first;
			if (initialEl && typeof initialEl.focus === 'function') {
				// Use requestAnimationFrame to ensure DOM is ready
				requestAnimationFrame(function() {
					initialEl.focus();
				});
			}
		}

		// Return cleanup function
		return function() {
			container.removeEventListener('keydown', handler);
		};
	}

	// ==========================================================================
	// INITIALIZATION
	// ==========================================================================

	function init() {
		discoverRegions();

		// Re-discover on SPA navigation
		if (Funky.PubSub) {
			var unsubscribe = Funky.PubSub.on('funky:spa:pageload', function() {
				discoverRegions();
				// Clean history of stale elements on page change
				cleanHistory();
			});
			if (typeof unsubscribe === 'function') {
				_cleanups.push(unsubscribe);
			}
		}
	}

	/**
	 * Destroy FocusManager - cleanup all resources
	 * Call this when the module is no longer needed
	 */
	function destroy() {
		// Execute all cleanup functions
		_cleanups.forEach(function(fn) {
			try { fn(); } catch (e) { /* ignore */ }
		});
		_cleanups = [];

		// Clear state
		clearHistory();
		regions = [];
		currentRegion = null;
	}

	// ==========================================================================
	// PUBLIC API
	// ==========================================================================

	var FocusManager = {
		// Focus history
		focusAndPush: focusAndPush,
		popFocus: popFocus,
		clearHistory: clearHistory,
		getHistoryLength: getHistoryLength,

		// Region navigation
		registerRegion: registerRegion,
		discoverRegions: discoverRegions,
		getRegions: getRegions,
		getCurrentRegion: getCurrentRegion,
		nextRegion: nextRegion,
		prevRegion: prevRegion,
		focusRegion: focusRegion,

		// Focus trap
		trapFocus: trapFocus,

		// Input completion
		isFilterInput: isFilterInput,
		completeInput: completeInput,

		// Utility
		getFocusableElements: getFocusableElements,
		isFocusable: isFocusable,

		// Constants
		FOCUSABLE_SELECTORS: FOCUSABLE_SELECTORS,
		FILTER_INPUT_SELECTORS: FILTER_INPUT_SELECTORS,

		// Lifecycle
		init: init,
		destroy: destroy,

		// Events
		setEmitEvents: setEmitEvents
	};

	// Register with Funky
	if (typeof Funky !== 'undefined' && Funky.register) {
		Funky.register('FocusManager', FocusManager);
	}

	// Auto-init on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})(window);
