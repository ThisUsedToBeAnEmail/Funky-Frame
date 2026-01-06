/**
 * Funky.Morph - FLIP Animation Engine
 * 
 * Smooth element morphing and state transitions using the FLIP technique.
 * Perfect for card-to-modal expansions, thumbnail-to-lightbox, and list reordering.
 * 
 * @requires Funky.Dom
 * @requires Funky.Events
 * @optional Funky.Keyboard - Scoped escape key handling
 * @optional Funky.GestureTracker - Swipe-to-dismiss on mobile
 * @optional Funky.Animate - Reduced motion detection
 * @optional Funky.PubSub - Cross-component events
 * 
 * @example
 * // Basic morph
 * Funky.Morph.to({
 *   from: '#card',
 *   to: '#modal',
 *   duration: 300,
 *   onComplete: function() { console.log('Done!'); }
 * });
 * 
 * // Reverse morph
 * Funky.Morph.reverse('#modal');
 * 
 * @version 1.0.3
 */
(function(global) {
	'use strict';

	// =========================================================================
	// Dependency Checks
	// =========================================================================

	if (!global.Funky || !global.Funky.register) {
		console.error('[Funky.Morph] Registry not found. Load namespace.js first.');
		return;
	}

	// Prevent duplicate registration
	if (global.Funky.isRegistered && global.Funky.isRegistered('Morph')) {
		return;
	}

	var D = global.Funky.Dom;
	var E = global.Funky.Events;

	if (!D) {
		console.error('[Funky.Morph] Funky.Dom not found. Load dom.js first.');
		return;
	}

	if (!E) {
		console.error('[Funky.Morph] Funky.Events not found. Load events.js first.');
		return;
	}

	// Optional dependencies (graceful degradation)
	var Keyboard = global.Funky.Keyboard;
	var Gesture = global.Funky.GestureTracker;
	var Animate = global.Funky.Animate;
	var PubSub = global.Funky.PubSub;

	// Utility: no-operation function
	function noop() {}

	// =========================================================================
	// Default Configuration
	// =========================================================================

	var DEFAULTS = {
		duration: 300,              // Animation duration in ms
		easing: 'ease-out',         // CSS easing function
		scale: true,                // Animate scale changes
		opacity: true,              // Animate opacity
		animationStyle: 'morph',    // Animation style: morph, fade, flip, slide, zoom
		respectMotion: true,        // Honor prefers-reduced-motion
		reducedMotionDuration: 0,   // Duration when reduced motion preferred
		onStart: null,              // Callback when morph starts
		onProgress: null,           // Callback during animation (progress 0-1)
		onComplete: null,           // Callback when morph completes
		onCancel: null              // Callback if morph is cancelled
	};

	// =========================================================================
	// Animation Presets
	// =========================================================================

	var PRESETS = {
		/**
		 * Expand from center - good for card → modal
		 */
		expand: {
			duration: 300,
			easing: 'standard',
			scale: true,
			opacity: true,
			animationStyle: 'morph',
			transformOrigin: 'center center'
		},

		/**
		 * Slide from source position - good for panels
		 */
		slide: {
			duration: 250,
			easing: 'easeOut',
			scale: false,
			opacity: true,
			animationStyle: 'slide'
		},

		/**
		 * Fade only - subtle transitions
		 */
		fade: {
			duration: 200,
			easing: 'easeInOut',
			scale: false,
			opacity: true,
			animationStyle: 'fade'
		},

		/**
		 * 3D card flip
		 */
		flip: {
			duration: 400,
			easing: 'easeInOut',
			scale: false,
			opacity: false,
			animationStyle: 'flip',
			perspective: 1000,
			transformStyle: 'preserve-3d'
		},

		/**
		 * Full morph - position, size, and style interpolation
		 */
		morph: {
			duration: 350,
			easing: 'standard',
			scale: true,
			opacity: true,
			animationStyle: 'morph'
		},

		/**
		 * Zoom with slight bounce/overshoot
		 */
		zoom: {
			duration: 400,
			easing: 'overshoot',
			scale: true,
			opacity: true,
			animationStyle: 'zoom',
			transformOrigin: 'center center'
		},

		/**
		 * Hero image transition - optimized for large images
		 */
		hero: {
			duration: 450,
			easing: 'standard',
			scale: true,
			opacity: false,
			animationStyle: 'morph',
			transformOrigin: 'center center'
		}
	};

	// =========================================================================
	// Easing Library
	// =========================================================================

	var EASINGS = {
		// Standard CSS easings
		linear: 'linear',
		ease: 'ease',
		easeIn: 'ease-in',
		easeOut: 'ease-out',
		easeInOut: 'ease-in-out',

		// Material Design curves
		standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
		decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
		accelerate: 'cubic-bezier(0.4, 0, 1, 1)',

		// Expressive curves
		fastOutSlowIn: 'cubic-bezier(0.4, 0, 0.2, 1)',
		fastOutLinearIn: 'cubic-bezier(0.4, 0, 1, 1)',
		linearOutSlowIn: 'cubic-bezier(0, 0, 0.2, 1)',

		// Bounce/overshoot
		overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
		bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
		anticipate: 'cubic-bezier(0.36, 0, 0.66, -0.56)',

		// Sharp
		sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

		// Sine curves
		sineIn: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
		sineOut: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
		sineInOut: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',

		// Quad curves
		quadIn: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
		quadOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
		quadInOut: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',

		// Cubic curves
		cubicIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
		cubicOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
		cubicInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',

		// Expo curves (dramatic)
		expoIn: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
		expoOut: 'cubic-bezier(0.19, 1, 0.22, 1)',
		expoInOut: 'cubic-bezier(1, 0, 0, 1)',

		// Back (anticipation/overshoot)
		backIn: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
		backOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
		backInOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
	};

	/**
	 * Resolve easing name to CSS value
	 * @param {string} easing - Easing name or CSS value
	 * @returns {string} CSS easing value
	 */
	function resolveEasing(easing) {
		if (!easing) return EASINGS.standard;

		// Check if it's a named easing
		if (EASINGS[easing]) {
			return EASINGS[easing];
		}

		// Check for 'spring' (handled via JS animation)
		if (easing === 'spring') {
			return EASINGS.overshoot; // Fallback for CSS
		}

		// Assume it's a raw CSS value (cubic-bezier, etc.)
		return easing;
	}

	/**
	 * Apply preset to configuration
	 * @param {Object} config - User config
	 * @returns {Object} Merged config with preset values as defaults
	 */
	function applyPreset(config) {
		if (!config.preset) return config;

		var presetName = config.preset;
		var preset = PRESETS[presetName];

		if (!preset) {
			console.warn('[Funky.Morph] Unknown preset:', presetName);
			return config;
		}

		// Merge: preset values first, then user config overrides (if defined)
		var merged = {};

		// Copy preset defaults
		for (var key in preset) {
			if (preset.hasOwnProperty(key)) {
				merged[key] = preset[key];
			}
		}

		// Apply user overrides (excluding 'preset' key, and only if value is defined)
		for (var key in config) {
			if (config.hasOwnProperty(key) && key !== 'preset' && config[key] !== undefined) {
				merged[key] = config[key];
			}
		}

		console.log('[Morph.applyPreset] Preset:', presetName, 'values:', preset);
		console.log('[Morph.applyPreset] Merged result:', { duration: merged.duration, easing: merged.easing, scale: merged.scale });

		// Resolve easing name if it was set by preset
		if (merged.easing) {
			merged.easing = resolveEasing(merged.easing);
		}

		return merged;
	}

	/**
	 * Register a custom preset
	 * @param {string} name - Preset name
	 * @param {Object} config - Preset configuration
	 */
	function registerPreset(name, config) {
		if (PRESETS[name]) {
			console.warn('[Funky.Morph] Overwriting existing preset:', name);
		}
		PRESETS[name] = config;
	}

	/**
	 * Get all available preset names
	 * @returns {Array}
	 */
	function getPresets() {
		var names = [];
		for (var key in PRESETS) {
			if (PRESETS.hasOwnProperty(key)) {
				names.push(key);
			}
		}
		return names;
	}

	/**
	 * Get all available easing names
	 * @returns {Array}
	 */
	function getEasings() {
		var names = [];
		for (var key in EASINGS) {
			if (EASINGS.hasOwnProperty(key)) {
				names.push(key);
			}
		}
		return names;
	}

	// =========================================================================
	// Spring Physics Animation
	// =========================================================================

	var SpringAnimation = {
		/**
		 * Create spring animation using requestAnimationFrame
		 * @param {Object} config - Spring configuration
		 * @returns {Object} Animation controller with cancel method
		 */
		create: function(config) {
			var stiffness = config.stiffness || 100;
			var damping = config.damping || 10;
			var mass = config.mass || 1;
			var from = config.from !== undefined ? config.from : 0;
			var to = config.to !== undefined ? config.to : 1;
			var onUpdate = config.onUpdate;
			var onComplete = config.onComplete;

			var velocity = 0;
			var position = from;
			var lastTime = null;
			var animationId = null;
			var cancelled = false;

			function step(currentTime) {
				if (cancelled) return;

				if (!lastTime) lastTime = currentTime;
				var deltaTime = Math.min((currentTime - lastTime) / 1000, 0.064); // Cap at ~60fps
				lastTime = currentTime;

				// Spring physics
				var displacement = position - to;
				var springForce = -stiffness * displacement;
				var dampingForce = -damping * velocity;
				var acceleration = (springForce + dampingForce) / mass;

				velocity += acceleration * deltaTime;
				position += velocity * deltaTime;

				// Normalize to 0-1 for progress
				var progress = from !== to
					? 1 - (position - to) / (from - to)
					: 1;
				progress = Math.max(0, Math.min(1, progress));

				if (onUpdate) {
					onUpdate(progress, position);
				}

				// Check if settled (velocity and displacement near zero)
				var isSettled = Math.abs(velocity) < 0.001 && Math.abs(displacement) < 0.001;

				if (isSettled) {
					// Final update at exactly 1
					if (onUpdate) onUpdate(1, to);
					if (onComplete) onComplete();
				} else {
					animationId = requestAnimationFrame(step);
				}
			}

			animationId = requestAnimationFrame(step);

			return {
				cancel: function() {
					cancelled = true;
					if (animationId) {
						cancelAnimationFrame(animationId);
						animationId = null;
					}
				}
			};
		}
	};

	// Active morph registry (keyed by morph ID)
	var _activeMorphs = {};
	var _morphIdCounter = 0;

	// =========================================================================
	// Reduced Motion Detection
	// =========================================================================

	/**
	 * Check if user prefers reduced motion
	 * @returns {boolean}
	 */
	function prefersReducedMotion() {
		// Check Funky.Preferences first (if available)
		if (global.Funky.Preferences && typeof global.Funky.Preferences.get === 'function') {
			var animationsEnabled = global.Funky.Preferences.get('theme.animations_enabled');
			if (animationsEnabled === false) return true;
		}

		// Fall back to media query
		return global.matchMedia && 
		       global.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/**
	 * Get effective duration based on motion preference
	 * @param {number} requestedDuration
	 * @param {Object} options
	 * @returns {number}
	 */
	function getEffectiveDuration(requestedDuration, options) {
		if (options.respectMotion !== false && prefersReducedMotion()) {
			return options.reducedMotionDuration || 0;
		}
		return requestedDuration;
	}

	/**
	 * Listen for reduced motion preference changes
	 * @param {Function} callback - Called when preference changes
	 * @returns {Function|null} Cleanup function
	 */
	function watchReducedMotion(callback) {
		if (!global.matchMedia) return null;

		var mql = global.matchMedia('(prefers-reduced-motion: reduce)');

		var handler = function(e) {
			callback(e.matches);
		};

		// Modern browsers
		if (mql.addEventListener) {
			mql.addEventListener('change', handler);
			return function() {
				mql.removeEventListener('change', handler);
			};
		} else if (mql.addListener) {
			// Safari < 14
			mql.addListener(handler);
			return function() {
				mql.removeListener(handler);
			};
		}

		return null;
	}

	/**
	 * Apply reduced motion fallback (instant swap or quick fade)
	 * @param {Element} fromEl
	 * @param {Element} toEl
	 * @param {Object} config
	 * @param {Function} onComplete
	 */
	function applyReducedMotionFallback(fromEl, toEl, config, onComplete) {
		var fadeTime = config.reducedMotionDuration || 100;

		if (fadeTime > 0) {
			// Quick cross-fade
			toEl.style.opacity = '0';
			toEl.style.visibility = 'visible';
			fromEl.style.transition = 'opacity ' + fadeTime + 'ms';
			toEl.style.transition = 'opacity ' + fadeTime + 'ms';

			requestAnimationFrame(function() {
				fromEl.style.opacity = '0';
				toEl.style.opacity = '1';
			});

			setTimeout(function() {
				fromEl.style.visibility = 'hidden';
				fromEl.style.opacity = '';
				fromEl.style.transition = '';
				toEl.style.transition = '';
				toEl.style.opacity = '';
				if (onComplete) onComplete();
			}, fadeTime + 10);
		} else {
			// Instant swap
			fromEl.style.visibility = 'hidden';
			toEl.style.visibility = 'visible';
			if (onComplete) onComplete();
		}
	}

	// =========================================================================
	// Accessibility: Focus Management
	// =========================================================================

	/**
	 * Focusable element selectors
	 */
	var FOCUSABLE_SELECTORS = [
		'button:not([disabled])',
		'a[href]',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
		'[contenteditable="true"]'
	].join(', ');

	/**
	 * Get first focusable element within container
	 * @param {Element} container
	 * @returns {Element|null}
	 */
	function getFirstFocusable(container) {
		return container.querySelector(FOCUSABLE_SELECTORS);
	}

	/**
	 * Get all focusable elements within container
	 * @param {Element} container
	 * @returns {NodeList}
	 */
	function getAllFocusable(container) {
		return container.querySelectorAll(FOCUSABLE_SELECTORS);
	}

	/**
	 * Check if element is focusable
	 * @param {Element} el
	 * @returns {boolean}
	 */
	function isFocusable(el) {
		if (!el) return false;
		return el.tabIndex >= 0 ||
		       el.tagName === 'A' ||
		       el.tagName === 'BUTTON' ||
		       el.tagName === 'INPUT' ||
		       el.contentEditable === 'true';
	}

	/**
	 * Manage focus during morph transition
	 * @param {Element} fromEl - Source element
	 * @param {Element} toEl - Target element
	 * @param {Object} config - Morph configuration
	 * @returns {Object} Focus controller
	 */
	function manageFocus(fromEl, toEl, config) {
		var previousFocus = document.activeElement;
		var focusWasInSource = fromEl.contains(previousFocus);

		/**
		 * Restore/move focus after morph completes
		 */
		function restore() {
			if (!focusWasInSource && config.manageFocus !== 'always') {
				return;
			}

			var focusTarget = null;

			// 1. Check for autofocus in target
			focusTarget = toEl.querySelector('[autofocus]');

			// 2. Check for data-morph-focus marker
			if (!focusTarget) {
				focusTarget = toEl.querySelector('[data-morph-focus]');
			}

			// 3. Check for matching data-morph-child
			if (!focusTarget && previousFocus && previousFocus.hasAttribute('data-morph-child')) {
				var childKey = previousFocus.getAttribute('data-morph-child');
				focusTarget = toEl.querySelector('[data-morph-child="' + childKey + '"]');
			}

			// 4. Find first focusable element
			if (!focusTarget) {
				focusTarget = getFirstFocusable(toEl);
			}

			// 5. Fall back to target itself if it's focusable
			if (!focusTarget && isFocusable(toEl)) {
				focusTarget = toEl;
			}

			// Apply focus with slight delay to ensure element is visible
			if (focusTarget) {
				requestAnimationFrame(function() {
					focusTarget.focus({ preventScroll: true });
				});
			}
		}

		/**
		 * Return focus to previous element (for reverse)
		 */
		function returnToPrevious() {
			if (previousFocus && isFocusable(previousFocus)) {
				requestAnimationFrame(function() {
					previousFocus.focus({ preventScroll: true });
				});
			}
		}

		return {
			restore: restore,
			returnToPrevious: returnToPrevious,
			previous: previousFocus,
			wasInSource: focusWasInSource
		};
	}

	/**
	 * Create focus trap for modal-like targets
	 * @param {Element} container
	 * @returns {Object} Trap controller
	 */
	function createFocusTrap(container) {
		var focusableElements = getAllFocusable(container);

		if (focusableElements.length === 0) {
			return { destroy: function() {}, focusFirst: function() {} };
		}

		var firstFocusable = focusableElements[0];
		var lastFocusable = focusableElements[focusableElements.length - 1];

		function handleKeyDown(e) {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				// Shift + Tab
				if (document.activeElement === firstFocusable) {
					e.preventDefault();
					lastFocusable.focus();
				}
			} else {
				// Tab
				if (document.activeElement === lastFocusable) {
					e.preventDefault();
					firstFocusable.focus();
				}
			}
		}

		container.addEventListener('keydown', handleKeyDown);

		return {
			destroy: function() {
				container.removeEventListener('keydown', handleKeyDown);
			},
			focusFirst: function() {
				if (firstFocusable) firstFocusable.focus();
			}
		};
	}

	// =========================================================================
	// Accessibility: Keyboard Support
	// =========================================================================

	/**
	 * Enable escape key to reverse morph
	 * Uses Funky.Keyboard if available (scoped), falls back to native
	 * @param {Element} targetEl - The expanded/morphed element
	 * @param {Function} reverseFn - Function to call for reverse
	 * @param {string} morphId - Unique morph identifier for scoping
	 * @returns {Object} Controller with disable method
	 */
	function enableEscapeReverse(targetEl, reverseFn, morphId) {
		var unregister = null;
		var nativeHandler = null;

		if (Keyboard) {
			// Use Funky.Keyboard with scope for proper shortcut management
			unregister = Keyboard.register({
				key: 'Escape',
				scope: 'morph-' + morphId,
				description: 'Close expanded view',
				handler: function(e) {
					e.preventDefault();
					reverseFn();
				}
			});

			// Push scope to make it active
			Keyboard.pushScope('morph-' + morphId);
		} else {
			// Fallback to native keydown
			nativeHandler = function(e) {
				if (e.key === 'Escape' && !e.defaultPrevented) {
					e.preventDefault();
					reverseFn();
				}
			};
			document.addEventListener('keydown', nativeHandler);
		}

		return {
			disable: function() {
				if (Keyboard && unregister) {
					Keyboard.popScope();
					unregister();
				} else if (nativeHandler) {
					document.removeEventListener('keydown', nativeHandler);
				}
			}
		};
	}

	// =========================================================================
	// Accessibility: Screen Reader Announcements
	// =========================================================================

	var _liveRegion = null;

	/**
	 * Create or get live region for announcements
	 * @returns {Element}
	 */
	function getLiveRegion() {
		if (_liveRegion) return _liveRegion;

		_liveRegion = document.getElementById('funky-morph-live');

		if (!_liveRegion) {
			_liveRegion = document.createElement('div');
			_liveRegion.id = 'funky-morph-live';
			_liveRegion.setAttribute('role', 'status');
			_liveRegion.setAttribute('aria-live', 'polite');
			_liveRegion.setAttribute('aria-atomic', 'true');
			_liveRegion.className = 'visually-hidden';

			// Style to hide visually but keep accessible
			_liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;' +
				'padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);' +
				'white-space:nowrap;border:0;';

			document.body.appendChild(_liveRegion);
		}

		return _liveRegion;
	}

	/**
	 * Announce message to screen readers
	 * @param {string} message
	 */
	function announce(message) {
		if (!message) return;

		var liveRegion = getLiveRegion();

		// Clear and re-set to trigger announcement
		liveRegion.textContent = '';

		requestAnimationFrame(function() {
			liveRegion.textContent = message;
		});
	}

	/**
	 * Get accessible name for element
	 * @param {Element} el
	 * @returns {string}
	 */
	function getAccessibleName(el) {
		if (!el) return '';

		// aria-label
		var label = el.getAttribute('aria-label');
		if (label) return label;

		// aria-labelledby
		var labelledBy = el.getAttribute('aria-labelledby');
		if (labelledBy) {
			var labelEl = document.getElementById(labelledBy);
			if (labelEl) return labelEl.textContent.trim();
		}

		// Title/heading
		var title = el.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
		if (title) return title.textContent.trim();

		// Button text
		if (el.tagName === 'BUTTON') return el.textContent.trim();

		// data-morph-label
		var morphLabel = el.getAttribute('data-morph-label');
		if (morphLabel) return morphLabel;

		return '';
	}

	/**
	 * Announcement message generators
	 */
	var ANNOUNCEMENTS = {
		morphStart: function(fromEl, toEl) {
			var targetLabel = getAccessibleName(toEl);
			return 'Opening ' + (targetLabel || 'content');
		},
		morphComplete: function(fromEl, toEl) {
			var targetLabel = getAccessibleName(toEl);
			return (targetLabel || 'Content') + ' opened';
		},
		morphReverse: function(toEl, fromEl) {
			return 'Closing content';
		},
		morphReverseComplete: function(toEl, fromEl) {
			return 'Content closed';
		},
		listAdd: function(item, index) {
			var itemLabel = getAccessibleName(item);
			return 'Added ' + (itemLabel || 'item') + ' at position ' + (index + 1);
		},
		listRemove: function(item) {
			var itemLabel = getAccessibleName(item);
			return 'Removed ' + (itemLabel || 'item');
		},
		listReorder: function(count) {
			return count + ' items reordered';
		}
	};

	// =========================================================================
	// Accessibility: ARIA State Management
	// =========================================================================

	/**
	 * Update ARIA states during morph
	 * @param {Element} fromEl
	 * @param {Element} toEl
	 * @param {string} phase - 'start' | 'complete' | 'reverse' | 'reverseComplete'
	 */
	function updateAriaStates(fromEl, toEl, phase) {
		switch (phase) {
			case 'start':
				fromEl.setAttribute('aria-expanded', 'true');
				fromEl.setAttribute('aria-hidden', 'true');
				toEl.removeAttribute('aria-hidden');
				break;

			case 'complete':
				// No additional changes needed
				break;

			case 'reverse':
				// During reverse animation
				break;

			case 'reverseComplete':
				fromEl.setAttribute('aria-expanded', 'false');
				fromEl.removeAttribute('aria-hidden');
				toEl.setAttribute('aria-hidden', 'true');
				break;
		}
	}

	// =========================================================================
	// FLIP Utilities
	// =========================================================================

	/**
	 * Get element's bounding rect and computed styles
	 * @param {Element} el - DOM element
	 * @returns {Object} Position, size, and style data
	 */
	function getElementState(el) {
		var rect = el.getBoundingClientRect();
		var computed = global.getComputedStyle(el);

		// Store the original CSS transform for restoration
		var originalTransform = computed.transform;

		// Check if element uses centering transform (common for modals)
		// The computed transform will be a matrix that includes translate(-50%, -50%)
		// We can detect this by checking if it's fixed/absolute and has a transform containing translate
		var hasTransform = originalTransform && originalTransform !== 'none';
		var isPositioned = computed.position === 'fixed' || computed.position === 'absolute';

		// Check inline style for centering pattern (more reliable)
		var inlineTransform = el.style.transform || '';
		var cssTransformRule = '';

		// Try to get the CSS-defined transform (before any inline override)
		// We check if the element's stylesheet has translate(-50%, -50%)
		var isCenteredModal = false;
		if (isPositioned && hasTransform) {
			// Check if transform includes a translate that looks like centering
			// Matrix form of translate(-50%, -50%) on a 500x400 element would be
			// matrix(1, 0, 0, 1, -250, -200) where -250 = -50% of 500, -200 = -50% of 400
			var halfWidth = rect.width / 2;
			var halfHeight = rect.height / 2;

			// Parse the matrix to check for centering
			var matrixMatch = originalTransform.match(/matrix\(([^)]+)\)/);
			if (matrixMatch) {
				var values = matrixMatch[1].split(',').map(function(v) { return parseFloat(v.trim()); });
				// matrix(a, b, c, d, tx, ty) - tx and ty are translation
				if (values.length >= 6) {
					var tx = values[4];
					var ty = values[5];
					// Check if translation is approximately -50% of dimensions
					var txIsHalf = Math.abs(tx + halfWidth) < 2;  // Allow 2px tolerance
					var tyIsHalf = Math.abs(ty + halfHeight) < 2;
					isCenteredModal = txIsHalf && tyIsHalf;
				}
			}
		}

		return {
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height,
			opacity: parseFloat(computed.opacity),
			borderRadius: computed.borderRadius,
			transform: originalTransform,
			isCenteredModal: isCenteredModal,
			// Store the original transform to restore after animation
			originalTransform: originalTransform !== 'none' ? originalTransform : ''
		};
	}

	/**
	 * Calculate the inverse transform to go from "last" back to "first"
	 * @param {Object} first - Initial state
	 * @param {Object} last - Final state
	 * @param {Object} options - Animation options
	 * @returns {Object} Inverse transform data
	 */
	function calculateInvert(first, last, options) {
		var deltaX = first.left - last.left;
		var deltaY = first.top - last.top;
		var scaleX = options.scale ? first.width / last.width : 1;
		var scaleY = options.scale ? first.height / last.height : 1;
		var deltaOpacity = options.opacity ? first.opacity - last.opacity : 0;

		return {
			x: deltaX,
			y: deltaY,
			scaleX: scaleX,
			scaleY: scaleY,
			opacity: deltaOpacity,
			// Store for interpolation
			first: first,
			last: last,
			// Store original transform for centered modals
			originalTransform: last.originalTransform || '',
			isCenteredModal: last.isCenteredModal || false
		};
	}

	/**
	 * Apply inverse transform to element
	 * @param {Element} el - DOM element
	 * @param {Object} invert - Inverse transform data
	 */
	function applyInvert(el, invert) {
		var flipTranslate = 'translate(' + invert.x + 'px, ' + invert.y + 'px)';
		var flipScale = '';
		if (invert.scaleX !== 1 || invert.scaleY !== 1) {
			flipScale = ' scale(' + invert.scaleX + ', ' + invert.scaleY + ')';
		}

		if (invert.isCenteredModal) {
			// For centered modals (transform: translate(-50%, -50%)):
			// We need to compose the centering transform with our FLIP transform.
			// The FLIP delta is calculated from visual positions, so we add it to the centering.
			// Compose: translate(-50%, -50%) then translate(deltaX, deltaY)
			// This is equivalent to: translate(calc(-50% + deltaX), calc(-50% + deltaY))
			el.style.transform = 'translate(calc(-50% + ' + invert.x + 'px), calc(-50% + ' + invert.y + 'px))' + flipScale;
			el.style.transformOrigin = 'center center';
		} else {
			// Regular elements: just apply FLIP transform
			el.style.transform = flipTranslate + flipScale;
			el.style.transformOrigin = 'top left';
		}

		if (invert.opacity !== 0) {
			el.style.opacity = invert.first.opacity;
		}

		// Store info for playAnimation
		el._morphInvert = invert;
	}

	/**
	 * Animate to identity transform (play phase)
	 * @param {Element} el - DOM element
	 * @param {Object} options - Animation options
	 * @param {Function} onComplete - Completion callback
	 * @returns {Object} Animation controller
	 */
	function playAnimation(el, options, onComplete) {
		var duration = getEffectiveDuration(options.duration, options);
		var easing = options.easing;
		var animationStyle = options.animationStyle || 'morph';

		// Get stored invert data for centered modal handling
		var invertData = el._morphInvert || {};
		var isCenteredModal = invertData.isCenteredModal;

		// For centered modals, animate back to translate(-50%, -50%)
		// For regular elements, animate to 'none'
		var targetTransform = isCenteredModal ? 'translate(-50%, -50%)' : 'none';

		// Handle completion
		var completed = false;
		var timeoutId = null;

		var cleanup = function() {
			if (completed) return;
			completed = true;

			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			el.style.transition = '';
			el.style.transform = '';  // Let CSS take over
			el.style.transformOrigin = '';
			el.style.perspective = '';
			el.style.transformStyle = '';
			el.style.backfaceVisibility = '';

			// Cleanup stored data
			delete el._morphInvert;

			if (onComplete) onComplete();
		};

		// Listen for transition end
		var onTransitionEnd = function(e) {
			if (e.target !== el) return;
			el.removeEventListener('transitionend', onTransitionEnd);
			cleanup();
		};
		el.addEventListener('transitionend', onTransitionEnd);

		console.log('[Morph.playAnimation] animationStyle:', animationStyle, 'duration:', duration, 'isCenteredModal:', isCenteredModal);

		// Apply animation based on style
		if (animationStyle === 'fade') {
			// FADE: Just fade in, no position animation
			el.style.transform = targetTransform;
			el.style.opacity = '0';
			el.style.transition = 'opacity ' + duration + 'ms ' + easing;
			el.offsetHeight;
			el.style.opacity = '';

		} else if (animationStyle === 'flip') {
			// FLIP: 3D card flip effect - element rotates like a flipping card
			// Start at 90deg (edge-on, nearly invisible) and rotate to 0deg (facing user)
			var currentTransform = el.style.transform || '';

			// For 3D transforms, perspective() gives depth perception
			el.style.transformStyle = 'preserve-3d';

			// Start rotated 90deg (edge-on) at the FLIP-calculated position
			var startTransform;
			if (currentTransform && currentTransform !== 'none' && currentTransform !== '') {
				// For centered modal: include the FLIP offset + rotation
				startTransform = 'perspective(800px) ' + currentTransform + ' rotateY(-90deg)';
			} else {
				startTransform = 'perspective(800px) rotateY(-90deg)';
			}
			el.style.transform = startTransform;
			el.style.opacity = '0';
			el.style.transition = 'transform ' + duration + 'ms ' + easing +
			                      ', opacity ' + (duration * 0.3) + 'ms ease-out';
			el.offsetHeight;

			// Animate to final position, rotating to face forward (0deg)
			var endTransform;
			if (isCenteredModal) {
				endTransform = 'perspective(800px) translate(-50%, -50%) rotateY(0deg)';
			} else {
				endTransform = 'perspective(800px) rotateY(0deg)';
			}
			el.style.transform = endTransform;
			el.style.opacity = '';

		} else if (animationStyle === 'slide') {
			// SLIDE: Slide from current position (uses FLIP transform)
			el.style.transition = 'transform ' + duration + 'ms ' + easing;
			el.offsetHeight;
			el.style.transform = targetTransform;

		} else if (animationStyle === 'zoom') {
			// ZOOM: Scale from center with optional overshoot easing
			if (!isCenteredModal) {
				el.style.transformOrigin = options.transformOrigin || 'center center';
			}
			el.style.transition = 'transform ' + duration + 'ms ' + easing +
			                      ', opacity ' + duration + 'ms ' + easing;
			el.offsetHeight;
			el.style.transform = targetTransform;
			el.style.opacity = '';

		} else {
			// DEFAULT MORPH: Smooth position + scale + opacity from FLIP calculation
			el.style.transition = 'transform ' + duration + 'ms ' + easing +
			                      ', opacity ' + duration + 'ms ' + easing;
			el.offsetHeight;
			el.style.transform = targetTransform;
			el.style.opacity = '';
		}

		// Fallback timeout (in case transitionend doesn't fire)
		timeoutId = setTimeout(cleanup, duration + 50);

		return {
			cancel: function() {
				if (completed) return;
				completed = true;
				clearTimeout(timeoutId);
				el.removeEventListener('transitionend', onTransitionEnd);

				// Freeze at current position
				var current = global.getComputedStyle(el);
				el.style.transition = '';
				el.style.transform = current.transform;
			}
		};
	}

	// =========================================================================
	// Core Morph API
	// =========================================================================

	/**
	 * Morph from one element to another
	 * @param {Object} config - Morph configuration
	 * @param {string|Element} config.from - Source element or selector
	 * @param {string|Element} config.to - Target element or selector
	 * @param {number} [config.duration=300] - Animation duration in ms
	 * @param {string} [config.easing='ease-out'] - CSS easing function
	 * @param {boolean} [config.scale=true] - Animate scale changes
	 * @param {boolean} [config.opacity=true] - Animate opacity
	 * @param {boolean} [config.respectMotion=true] - Honor prefers-reduced-motion
	 * @param {Function} [config.onStart] - Start callback
	 * @param {Function} [config.onComplete] - Complete callback
	 * @param {Function} [config.onCancel] - Cancel callback
	 * @returns {Object|null} Morph controller with id and cancel()
	 */
	function morphTo(config) {
		// Apply preset if specified (preset values as defaults, config overrides)
		if (config.preset) {
			config = applyPreset(config);
		}

		// Resolve easing name to CSS value
		if (config.easing) {
			config.easing = resolveEasing(config.easing);
		}

		// Resolve elements
		var fromEl = resolveElement(config.from);
		var toEl = resolveElement(config.to);

		if (!fromEl || !toEl) {
			console.error('[Funky.Morph] Source or target element not found');
			return null;
		}

		// Merge options with defaults
		var options = mergeOptions(config);

		// Accessibility options with defaults
		var a11yOptions = {
			manageFocus: config.manageFocus !== false,
			announceToScreenReader: config.announceToScreenReader !== false,
			enableEscapeClose: config.enableEscapeClose !== false,
			trapFocus: config.trapFocus === true
		};

		// Generate morph ID
		var morphId = 'morph_' + (++_morphIdCounter);

		// Cancel any existing morph on these elements
		cancelExistingMorph(fromEl);
		cancelExistingMorph(toEl);

		// =====================================================================
		// Accessibility: Setup
		// =====================================================================
		var focusManager = a11yOptions.manageFocus ? manageFocus(fromEl, toEl, config) : null;
		var focusTrap = null;
		var escapeHandler = null;

		// Announce morph start
		if (a11yOptions.announceToScreenReader) {
			announce(ANNOUNCEMENTS.morphStart(fromEl, toEl));
		}

		// Update ARIA states
		updateAriaStates(fromEl, toEl, 'start');

		// =====================================================================
		// FLIP: First - Record initial state
		// =====================================================================
		var first = getElementState(fromEl);

		// =====================================================================
		// FLIP: Last - Show target, hide source, get final state
		// =====================================================================
		fromEl.style.visibility = 'hidden';
		fromEl.setAttribute('data-morph-source-active', morphId);
		
		toEl.style.visibility = 'visible';
		toEl.style.opacity = '0'; // Start invisible for smooth transition

		// Force layout calculation
		toEl.offsetHeight;

		var last = getElementState(toEl);
		toEl.style.opacity = '';

		// =====================================================================
		// FLIP: Invert - Apply inverse transform
		// =====================================================================
		var invert = calculateInvert(first, last, options);
		console.log('[Morph.to] FLIP calculation:', {
			first: { left: first.left, top: first.top, width: first.width, height: first.height },
			last: { left: last.left, top: last.top, width: last.width, height: last.height, isCenteredModal: last.isCenteredModal, transform: last.transform },
			invert: { x: invert.x, y: invert.y, scaleX: invert.scaleX, scaleY: invert.scaleY, isCenteredModal: invert.isCenteredModal },
			animationStyle: options.animationStyle
		});
		applyInvert(toEl, invert);

		// Store morph state
		var morphState = {
			id: morphId,
			from: fromEl,
			to: toEl,
			first: first,
			last: last,
			invert: invert,
			options: options,
			animation: null,
			focusManager: focusManager,
			focusTrap: focusTrap,
			escapeHandler: escapeHandler,
			a11yOptions: a11yOptions
		};
		_activeMorphs[morphId] = morphState;

		// Mark elements
		fromEl.setAttribute('data-morph-active', morphId);
		toEl.setAttribute('data-morph-active', morphId);
		toEl.setAttribute('data-morph-target-active', morphId);

		// Emit start event
		emitEvent('morph:start', { from: fromEl, to: toEl, id: morphId });
		if (options.onStart) {
			options.onStart({ from: fromEl, to: toEl, id: morphId });
		}

		// =====================================================================
		// FLIP: Play - Animate to identity
		// =====================================================================
		requestAnimationFrame(function() {
			morphState.animation = playAnimation(toEl, options, function() {
				// Cleanup
				delete _activeMorphs[morphId];
				fromEl.removeAttribute('data-morph-active');
				fromEl.removeAttribute('data-morph-source-active');
				toEl.removeAttribute('data-morph-active');
				toEl.removeAttribute('data-morph-target-active');

				// Store reverse data for potential reverse morph
				toEl.setAttribute('data-morph-reverse', morphId);
				toEl._morphReverseData = {
					sourceEl: fromEl,
					first: first,
					focusManager: focusManager,
					a11yOptions: a11yOptions
				};

				// =========================================================
				// Accessibility: Post-morph setup
				// =========================================================

				// Update ARIA states
				updateAriaStates(fromEl, toEl, 'complete');

				// Restore/move focus
				if (focusManager) {
					focusManager.restore();
				}

				// Setup focus trap for modal-like targets
				if (a11yOptions.trapFocus) {
					morphState.focusTrap = createFocusTrap(toEl);
				}

				// Enable escape key to reverse
				if (a11yOptions.enableEscapeClose) {
					morphState.escapeHandler = enableEscapeReverse(toEl, function() {
						morphReverse(toEl);
					}, morphId);
					
					// Store on element for cleanup during reverse
					toEl._morphEscapeHandler = morphState.escapeHandler;
					toEl._morphFocusTrap = morphState.focusTrap;
				}

				// Announce completion
				if (a11yOptions.announceToScreenReader) {
					announce(ANNOUNCEMENTS.morphComplete(fromEl, toEl));
				}

				// Emit complete event
				emitEvent('morph:complete', { from: fromEl, to: toEl, id: morphId });
				if (options.onComplete) {
					options.onComplete({ from: fromEl, to: toEl, id: morphId });
				}
			});
		});

		// Return controller
		return {
			id: morphId,
			cancel: function() {
				cancelMorph(morphId);
			}
		};
	}

	/**
	 * Reverse a shared morph - animates matched children back to source
	 */
	function morphSharedReverse(targetContainer, sourceContainer, reverseData, opts, morphId, focusManager, a11yOptions) {
		var childStates = reverseData.childStates || [];
		var storedOptions = reverseData.options || {};
		var duration = getEffectiveDuration(opts.duration, opts);
		var animationStyle = storedOptions.animationStyle || opts.animationStyle || 'morph';

		console.log('[Morph.sharedReverse] animationStyle:', animationStyle, 'children:', childStates.length);

		// Create clones for each matched child at their current (target) positions
		var clones = [];
		for (var i = 0; i < childStates.length; i++) {
			var state = childStates[i];
			var targetChild = state.target;
			var sourceChild = state.source;
			
			// Get current position of target child
			var currentState = getElementState(targetChild);
			// Original position of source child
			var originalState = state.first;
			
			// Create clone
			var clone = createPositionedClone(targetChild, currentState, storedOptions.cloneStyles);
			clone.setAttribute('data-morph-clone', state.key);
			document.body.appendChild(clone);
			
			clones.push({
				clone: clone,
				currentState: currentState,
				originalState: originalState,
				targetChild: targetChild,
				sourceChild: sourceChild
			});
			
			// Hide target child
			targetChild.style.opacity = '0';
		}

		// Fade out target container
		targetContainer.style.transition = 'opacity ' + Math.floor(duration * 0.4) + 'ms ease-out';
		targetContainer.style.opacity = '0';

		// Fade in source container
		sourceContainer.style.visibility = 'visible';
		sourceContainer.style.transition = 'opacity ' + Math.floor(duration * 0.3) + 'ms ease-in';
		sourceContainer.style.opacity = '1';

		// Animate clones back to source positions
		requestAnimationFrame(function() {
			for (var j = 0; j < clones.length; j++) {
				var item = clones[j];
				var deltaX = item.originalState.left - item.currentState.left;
				var deltaY = item.originalState.top - item.currentState.top;
				var scaleX = item.originalState.width / item.currentState.width;
				var scaleY = item.originalState.height / item.currentState.height;

				// Apply animation based on style
				if (animationStyle === 'fade') {
					var midX = deltaX / 2;
					var midY = deltaY / 2;
					item.clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing +
					                              ', opacity ' + (duration / 2) + 'ms ease-out';
					item.clone.style.transformOrigin = 'center center';
					item.clone.style.transform = 'translate(' + midX + 'px, ' + midY + 'px)';
					item.clone.style.opacity = '0';
					
				} else if (animationStyle === 'flip') {
					item.clone.style.perspective = '1000px';
					item.clone.style.transformStyle = 'preserve-3d';
					item.clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing;
					item.clone.style.transformOrigin = 'center center';
					item.clone.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) rotateY(-180deg) scale(' + scaleX + ', ' + scaleY + ')';
					
				} else if (animationStyle === 'slide') {
					item.clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing;
					item.clone.style.transformOrigin = 'top left';
					item.clone.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
					
				} else if (animationStyle === 'zoom') {
					item.clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing;
					item.clone.style.transformOrigin = 'center center';
					item.clone.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) scale(' + scaleX + ', ' + scaleY + ')';
					
				} else {
					// Default morph
					item.clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing;
					item.clone.style.transformOrigin = 'top left';
					var transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
					if (opts.scale !== false) {
						transform += ' scale(' + scaleX + ', ' + scaleY + ')';
					}
					item.clone.style.transform = transform;
				}
			}
		});

		// Cleanup after animation
		setTimeout(function() {
			// Remove clones
			for (var k = 0; k < clones.length; k++) {
				if (clones[k].clone.parentNode) {
					clones[k].clone.parentNode.removeChild(clones[k].clone);
				}
				// Reset target child opacity
				clones[k].targetChild.style.opacity = '';
			}

			// Hide target container
			targetContainer.style.visibility = 'hidden';
			targetContainer.style.opacity = '';
			targetContainer.style.transition = '';

			// Show source container fully
			sourceContainer.style.opacity = '';
			sourceContainer.style.transition = '';

			// Cleanup reverse data
			delete targetContainer._morphReverseData;
			targetContainer.removeAttribute('data-morph-reverse');

			// Accessibility cleanup
			updateAriaStates(sourceContainer, targetContainer, 'reverseComplete');
			if (focusManager) {
				focusManager.returnToPrevious();
			}
			if (a11yOptions.announceToScreenReader !== false) {
				announce(ANNOUNCEMENTS.morphReverseComplete(targetContainer, sourceContainer));
			}

			// Emit complete
			emitEvent('morph:complete', { from: targetContainer, to: sourceContainer, id: morphId, reversed: true });
			if (opts.onComplete) {
				opts.onComplete({ from: targetContainer, to: sourceContainer, id: morphId, reversed: true });
			}
		}, duration + 50);

		return {
			id: morphId,
			cancel: function() {
				for (var m = 0; m < clones.length; m++) {
					if (clones[m].clone.parentNode) {
						clones[m].clone.parentNode.removeChild(clones[m].clone);
					}
				}
				sourceContainer.style.visibility = '';
				targetContainer.style.visibility = '';
			}
		};
	}

	/**
	 * Reverse a morph (animate back to source)
	 * @param {string|Element} target - Target element or selector
	 * @param {Object} [options] - Override options
	 * @returns {Object|null} Morph controller
	 */
	function morphReverse(target, options) {
		var toEl = resolveElement(target);

		if (!toEl) {
			console.error('[Funky.Morph] Target element not found');
			return null;
		}

		var reverseData = toEl._morphReverseData;
		if (!reverseData) {
			console.warn('[Funky.Morph] No reverse data found for element');
			return null;
		}

		var fromEl = reverseData.sourceEl;
		var originalFirst = reverseData.first;

		// If first is missing, get current source state as fallback
		if (!originalFirst) {
			originalFirst = getElementState(fromEl);
		}

		var focusManager = reverseData.focusManager;
		var a11yOptions = reverseData.a11yOptions || {};

		// =====================================================================
		// Accessibility: Cleanup handlers before reverse
		// =====================================================================
		if (toEl._morphEscapeHandler) {
			toEl._morphEscapeHandler.disable();
			delete toEl._morphEscapeHandler;
		}
		if (toEl._morphFocusTrap) {
			toEl._morphFocusTrap.destroy();
			delete toEl._morphFocusTrap;
		}

		// Announce reverse start
		if (a11yOptions.announceToScreenReader !== false) {
			announce(ANNOUNCEMENTS.morphReverse(toEl, fromEl));
		}

		// Update ARIA states
		updateAriaStates(fromEl, toEl, 'reverse');

		// Merge options - use stored options from original morph, then override with passed options
		var storedOptions = reverseData.options || {};
		var opts = mergeOptions(options || {});
		
		// Use stored duration if not explicitly overridden
		if (storedOptions.duration && (!options || options.duration === undefined)) {
			opts.duration = storedOptions.duration;
		}
		if (storedOptions.easing && (!options || options.easing === undefined)) {
			opts.easing = storedOptions.easing;
		}

		// Generate morph ID
		var morphId = 'morph_reverse_' + (++_morphIdCounter);

		// Check if this was a shared morph - handle differently
		if (reverseData.type === 'shared') {
			return morphSharedReverse(toEl, fromEl, reverseData, opts, morphId, focusManager, a11yOptions);
		}

		console.log('[Morph.reverse] Using duration:', opts.duration, 'stored:', storedOptions.duration);

		// FLIP: First (current position of target)
		var first = getElementState(toEl);

		// FLIP: Last (original source position)
		var last = originalFirst;

		// Get effective duration
		var duration = getEffectiveDuration(opts.duration, opts);

		// Create a clone at the current position for animation
		var clone = toEl.cloneNode(true);
		clone.classList.add('funky-morph-clone');
		clone.style.position = 'fixed';
		clone.style.left = first.left + 'px';
		clone.style.top = first.top + 'px';
		clone.style.width = first.width + 'px';
		clone.style.height = first.height + 'px';
		clone.style.margin = '0';
		clone.style.zIndex = '10000';
		clone.style.pointerEvents = 'none';
		clone.removeAttribute('data-morph-reverse');
		clone.removeAttribute('id');
		document.body.appendChild(clone);

		// Hide target immediately
		toEl.style.visibility = 'hidden';

		// Calculate deltas
		var deltaX = last.left - first.left;
		var deltaY = last.top - first.top;
		var scaleX = last.width / first.width;
		var scaleY = last.height / first.height;

		// Get animation style from stored options
		var animationStyle = storedOptions.animationStyle || opts.animationStyle || 'morph';
		
		console.log('[Morph.reverse] animationStyle:', animationStyle, 'duration:', duration);

		// Emit event
		emitEvent('morph:reverse', { from: toEl, to: fromEl, id: morphId });

		// Apply animation based on style (reverse of the "in" animation)
		requestAnimationFrame(function() {
			if (animationStyle === 'fade') {
				// FADE: Move halfway and fade out
				var midX = deltaX / 2;
				var midY = deltaY / 2;
				
				clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing +
				                         ', opacity ' + (duration / 2) + 'ms ease-out';
				clone.style.transformOrigin = 'center center';
				clone.style.transform = 'translate(' + midX + 'px, ' + midY + 'px)';
				clone.style.opacity = '0';
				
			} else if (animationStyle === 'flip') {
				// FLIP: 3D rotation back
				clone.style.perspective = '1000px';
				clone.style.transformStyle = 'preserve-3d';
				clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing +
				                         ', opacity ' + duration + 'ms ' + opts.easing;
				clone.style.transformOrigin = 'center center';
				
				var transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) rotateY(-180deg)';
				if (opts.scale !== false) {
					transform += ' scale(' + scaleX + ', ' + scaleY + ')';
				}
				clone.style.transform = transform;
				clone.style.opacity = '0';
				
			} else if (animationStyle === 'slide') {
				// SLIDE: Quick slide back
				clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing +
				                         ', opacity ' + duration + 'ms ' + opts.easing;
				clone.style.transformOrigin = 'top left';
				clone.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
				clone.style.opacity = '0';
				
			} else if (animationStyle === 'zoom') {
				// ZOOM: Scale down to source
				clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing +
				                         ', opacity ' + duration + 'ms ' + opts.easing;
				clone.style.transformOrigin = 'center center';
				clone.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) scale(' + scaleX + ', ' + scaleY + ')';
				clone.style.opacity = '0';
				
			} else {
				// DEFAULT MORPH: Smooth position + scale + fade
				clone.style.transformOrigin = 'top left';
				clone.style.transition = 'transform ' + duration + 'ms ' + opts.easing +
				                         ', opacity ' + duration + 'ms ' + opts.easing;
				
				var transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
				if (opts.scale !== false) {
					transform += ' scale(' + scaleX + ', ' + scaleY + ')';
				}
				clone.style.transform = transform;
				clone.style.opacity = '0';
			}
		});

		setTimeout(function() {
			// Remove clone
			if (clone.parentNode) {
				clone.parentNode.removeChild(clone);
			}

			// Show source
			fromEl.style.visibility = '';

			// Cleanup
			delete toEl._morphReverseData;
			toEl.removeAttribute('data-morph-reverse');

			// =========================================================
			// Accessibility: Post-reverse cleanup
			// =========================================================

			// Update ARIA states
			updateAriaStates(fromEl, toEl, 'reverseComplete');

			// Return focus to original element
			if (focusManager) {
				focusManager.returnToPrevious();
			}

			// Announce completion
			if (a11yOptions.announceToScreenReader !== false) {
				announce(ANNOUNCEMENTS.morphReverseComplete(toEl, fromEl));
			}

			// Emit complete
			emitEvent('morph:complete', { from: toEl, to: fromEl, id: morphId, reversed: true });
			if (opts.onComplete) {
				opts.onComplete({ from: toEl, to: fromEl, id: morphId, reversed: true });
			}
		}, duration + 50);

		return {
			id: morphId,
			cancel: function() {
				if (clone.parentNode) {
					clone.parentNode.removeChild(clone);
				}
				fromEl.style.visibility = '';
				toEl.style.visibility = '';
			}
		};
	}

	// =========================================================================
	// Cancel / Utility Methods
	// =========================================================================

	/**
	 * Cancel an active morph
	 * @param {string} morphId - Morph ID to cancel
	 */
	function cancelMorph(morphId) {
		var morph = _activeMorphs[morphId];
		if (!morph) return;

		if (morph.animation) {
			morph.animation.cancel();
		}

		// Reset source element - restore visibility
		morph.from.style.visibility = '';
		morph.from.removeAttribute('data-morph-active');
		morph.from.removeAttribute('data-morph-source-active');

		// Reset target element - hide it and clear all transform styles
		morph.to.hidden = true;
		morph.to.style.visibility = '';
		morph.to.style.transform = '';
		morph.to.style.transition = '';
		morph.to.style.opacity = '';
		morph.to.style.transformStyle = '';
		morph.to.style.backfaceVisibility = '';
		morph.to.style.perspective = '';
		morph.to.style.transformOrigin = '';
		morph.to.removeAttribute('data-morph-active');
		morph.to.removeAttribute('data-morph-target-active');
		morph.to.removeAttribute('data-morph-reverse');

		// Cleanup stored data
		delete morph.to._morphInvert;
		delete morph.to._morphReverseData;
		delete morph.to._morphEscapeHandler;
		delete morph.to._morphFocusTrap;

		// Emit cancel event
		emitEvent('morph:cancel', { from: morph.from, to: morph.to, id: morphId });
		if (morph.options.onCancel) {
			morph.options.onCancel({ from: morph.from, to: morph.to, id: morphId });
		}

		delete _activeMorphs[morphId];
	}

	/**
	 * Cancel any existing morph on an element
	 * @param {Element} el - DOM element
	 */
	function cancelExistingMorph(el) {
		var morphId = el.getAttribute('data-morph-active');
		if (morphId) {
			cancelMorph(morphId);
		}
	}

	/**
	 * Check if an element is currently morphing
	 * @param {string|Element} element - Element or selector
	 * @returns {boolean}
	 */
	function isMorphing(element) {
		var el = resolveElement(element);
		return el ? el.hasAttribute('data-morph-active') : false;
	}

	/**
	 * Get active morph by ID
	 * @param {string} morphId - Morph ID
	 * @returns {Object|null}
	 */
	function getActiveMorph(morphId) {
		return _activeMorphs[morphId] || null;
	}

	/**
	 * Cancel all active morphs
	 */
	function cancelAll() {
		var ids = Object.keys(_activeMorphs);
		for (var i = 0; i < ids.length; i++) {
			cancelMorph(ids[i]);
		}
	}

	// =========================================================================
	// Shared Element Transitions
	// =========================================================================

	var SHARED_DEFAULTS = {
		children: null,              // Child keys to match (null = auto-detect all)
		stagger: 0,                  // Delay between child animations (ms)
		animateContainer: true,      // Animate container bounds
		crossFade: true,             // Cross-fade unmatched content
		cloneStyles: ['background', 'backgroundColor', 'border', 'borderRadius', 'boxShadow', 'color', 'fontSize', 'fontWeight', 'padding']
	};

	/**
	 * Find matching children between source and target containers
	 * @param {Element} sourceContainer
	 * @param {Element} targetContainer
	 * @param {Array|null} childKeys - Optional filter for specific children
	 * @returns {Object} matched, unmatchedSource, unmatchedTarget arrays
	 */
	function findMatchingChildren(sourceContainer, targetContainer, childKeys) {
		var sourceChildren = sourceContainer.querySelectorAll('[data-morph-child]');
		var targetChildren = targetContainer.querySelectorAll('[data-morph-child]');

		// Build target map
		var targetMap = {};
		for (var i = 0; i < targetChildren.length; i++) {
			var el = targetChildren[i];
			// Skip nested morph children (already inside another morph child)
			if (el.parentElement.closest('[data-morph-child]') && 
			    el.parentElement.closest('[data-morph-child]') !== el) {
				continue;
			}
			var key = el.getAttribute('data-morph-child');
			targetMap[key] = el;
		}

		var matches = [];
		var unmatchedSource = [];
		var unmatchedTargetKeys = Object.keys(targetMap);

		for (var j = 0; j < sourceChildren.length; j++) {
			var sourceEl = sourceChildren[j];
			// Skip nested morph children
			if (sourceEl.parentElement.closest('[data-morph-child]') && 
			    sourceEl.parentElement.closest('[data-morph-child]') !== sourceEl) {
				continue;
			}
			
			var childKey = sourceEl.getAttribute('data-morph-child');

			// Skip if filter provided and key not in filter
			if (childKeys && childKeys.indexOf(childKey) === -1) {
				continue;
			}

			var targetEl = targetMap[childKey];
			if (targetEl) {
				matches.push({
					key: childKey,
					source: sourceEl,
					target: targetEl
				});
				var idx = unmatchedTargetKeys.indexOf(childKey);
				if (idx > -1) {
					unmatchedTargetKeys.splice(idx, 1);
				}
			} else {
				unmatchedSource.push({ key: childKey, el: sourceEl });
			}
		}

		// Build unmatched target array
		var unmatchedTarget = [];
		for (var k = 0; k < unmatchedTargetKeys.length; k++) {
			var uKey = unmatchedTargetKeys[k];
			// Skip if filter provided and key not in filter
			if (childKeys && childKeys.indexOf(uKey) === -1) {
				continue;
			}
			unmatchedTarget.push({ key: uKey, el: targetMap[uKey] });
		}

		return {
			matched: matches,
			unmatchedSource: unmatchedSource,
			unmatchedTarget: unmatchedTarget
		};
	}

	/**
	 * Create a positioned clone for animation
	 * @param {Element} sourceEl - Element to clone
	 * @param {Object} state - First state with position data
	 * @param {Array} cloneStyles - Styles to copy
	 * @returns {Element} Positioned clone
	 */
	function createPositionedClone(sourceEl, state, cloneStyles) {
		var clone = sourceEl.cloneNode(true);

		// Position fixed at source location
		clone.style.position = 'fixed';
		clone.style.left = state.left + 'px';
		clone.style.top = state.top + 'px';
		clone.style.width = state.width + 'px';
		clone.style.height = state.height + 'px';
		clone.style.margin = '0';
		clone.style.zIndex = '10001';
		clone.style.pointerEvents = 'none';
		clone.style.willChange = 'transform, opacity';
		clone.classList.add('funky-morph-clone');

		// Copy computed styles
		if (cloneStyles && cloneStyles.length > 0) {
			var computed = global.getComputedStyle(sourceEl);
			for (var i = 0; i < cloneStyles.length; i++) {
				var styleName = cloneStyles[i];
				if (computed[styleName]) {
					clone.style[styleName] = computed[styleName];
				}
			}
		}

		// Handle images
		if (sourceEl.tagName === 'IMG') {
			clone.style.objectFit = 'cover';
			clone.style.objectPosition = 'center';
		}

		// Remove interactive elements' interactivity
		var interactiveEls = clone.querySelectorAll('a, button, input, select, textarea, [tabindex]');
		for (var j = 0; j < interactiveEls.length; j++) {
			interactiveEls[j].tabIndex = -1;
			interactiveEls[j].setAttribute('aria-hidden', 'true');
		}

		// Remove IDs to prevent duplicates
		clone.removeAttribute('id');
		var idEls = clone.querySelectorAll('[id]');
		for (var k = 0; k < idEls.length; k++) {
			idEls[k].removeAttribute('id');
		}

		return clone;
	}

	/**
	 * Animate clone to target position
	 * @param {Element} clone
	 * @param {Object} state - Contains first, last positions
	 * @param {Object} config - Animation config
	 * @param {Function} onComplete - Completion callback
	 */
	function animateCloneToTarget(clone, state, config, onComplete) {
		var first = state.first;
		var last = state.last;
		var duration = getEffectiveDuration(config.duration, config);

		// Calculate target transform
		var deltaX = last.left - first.left;
		var deltaY = last.top - first.top;
		var scaleX = last.width / first.width;
		var scaleY = last.height / first.height;
		
		// Respect scale option from preset
		var useScale = config.scale !== false;
		
		// Determine animation style from preset
		var animationStyle = config.animationStyle || 'morph';  // morph, fade, flip, slide

		console.log('[Morph.animateCloneToTarget]', state.key, {
			animationStyle: animationStyle,
			useScale: useScale,
			duration: duration
		});

		// Apply different animation based on style
		if (animationStyle === 'fade') {
			// FADE: Crossfade at midpoint position
			var midX = deltaX / 2;
			var midY = deltaY / 2;
			
			clone.style.transition = 'transform ' + duration + 'ms ' + config.easing +
			                         ', opacity ' + (duration / 2) + 'ms ease-out';
			clone.style.transformOrigin = 'center center';
			clone.offsetHeight;
			
			// Move halfway and fade out
			clone.style.transform = 'translate(' + midX + 'px, ' + midY + 'px)';
			clone.style.opacity = '0';
			
		} else if (animationStyle === 'flip') {
			// FLIP: 3D card flip rotation
			clone.style.perspective = '1000px';
			clone.style.transformStyle = 'preserve-3d';
			clone.style.transition = 'transform ' + duration + 'ms ' + config.easing;
			clone.style.transformOrigin = 'center center';
			clone.offsetHeight;
			
			// Rotate on Y-axis while moving
			var transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) rotateY(180deg)';
			if (useScale) {
				transform += ' scale(' + scaleX + ', ' + scaleY + ')';
			}
			clone.style.transform = transform;
			
		} else if (animationStyle === 'slide') {
			// SLIDE: Quick slide with no scale
			clone.style.transition = 'transform ' + duration + 'ms ' + config.easing;
			clone.style.transformOrigin = 'top left';
			clone.offsetHeight;
			
			clone.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
			
		} else if (animationStyle === 'zoom') {
			// ZOOM: Scale from center with overshoot
			clone.style.transition = 'transform ' + duration + 'ms ' + config.easing +
			                         ', opacity ' + duration + 'ms ' + config.easing;
			clone.style.transformOrigin = 'center center';
			clone.offsetHeight;
			
			var transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
			transform += ' scale(' + scaleX + ', ' + scaleY + ')';
			clone.style.transform = transform;
			
		} else {
			// DEFAULT MORPH: Smooth position + scale
			var transitionProps = 'transform ' + duration + 'ms ' + config.easing;
			if (config.opacity !== false) {
				transitionProps += ', opacity ' + duration + 'ms ' + config.easing;
			}
			
			clone.style.transition = transitionProps;
			clone.style.transformOrigin = 'top left';
			clone.classList.add('funky-morph-clone--animating');
			clone.offsetHeight;
			
			var transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
			if (useScale) {
				transform += ' scale(' + scaleX + ', ' + scaleY + ')';
			}
			clone.style.transform = transform;
		}

		// Handle completion
		if (onComplete) {
			setTimeout(onComplete, duration + 20);
		}
	}

	/**
	 * Shared element transition - morphs multiple matched children between containers
	 * @param {Object} config - Configuration
	 * @param {string|Element} config.from - Source container
	 * @param {string|Element} config.to - Target container
	 * @param {Array} [config.children] - Child keys to match (null = auto-detect)
	 * @param {number} [config.stagger=0] - Delay between child animations (ms)
	 * @param {boolean} [config.animateContainer=true] - Animate container bounds
	 * @param {boolean} [config.crossFade=true] - Cross-fade unmatched content
	 * @returns {Object|null} Morph controller
	 */
	function morphShared(config) {
		console.log('[Morph.shared] Input config:', { preset: config.preset, duration: config.duration, easing: config.easing });
		
		// Apply preset first if specified
		if (config.preset) {
			config = applyPreset(config);
			console.log('[Morph.shared] After applyPreset:', { preset: config.preset, duration: config.duration, easing: config.easing });
		}

		var sourceContainer = resolveElement(config.from);
		var targetContainer = resolveElement(config.to);

		if (!sourceContainer || !targetContainer) {
			console.error('[Funky.Morph.shared] Source or target container not found');
			return null;
		}

		// Merge options
		var options = mergeOptions(config);
		for (var key in SHARED_DEFAULTS) {
			if (SHARED_DEFAULTS.hasOwnProperty(key)) {
				options[key] = config.hasOwnProperty(key) ? config[key] : SHARED_DEFAULTS[key];
			}
		}
		console.log('[Morph.shared] Final options:', { duration: options.duration, easing: options.easing, animationStyle: options.animationStyle, stagger: options.stagger });

		// Generate morph ID
		var morphId = 'morph_shared_' + (++_morphIdCounter);

		// Cancel any existing morph on these elements
		cancelExistingMorph(sourceContainer);
		cancelExistingMorph(targetContainer);

		// 1. Find matching children
		var childAnalysis = findMatchingChildren(
			sourceContainer,
			targetContainer,
			options.children
		);

		// 2. Record FIRST state for all matched children
		var childStates = [];
		for (var i = 0; i < childAnalysis.matched.length; i++) {
			var pair = childAnalysis.matched[i];
			childStates.push({
				key: pair.key,
				source: pair.source,
				target: pair.target,
				first: getElementState(pair.source),
				last: null,
				invert: null
			});
		}

		// 3. Record container state if animating
		var containerFirst = options.animateContainer ? getElementState(sourceContainer) : null;

		// 4. Fade out source smoothly while measuring target
		sourceContainer.style.transition = 'opacity ' + Math.floor(options.duration * 0.3) + 'ms ease-out';
		sourceContainer.style.opacity = '0';
		sourceContainer.setAttribute('data-morph-source-active', morphId);

		targetContainer.style.visibility = 'visible';
		targetContainer.style.opacity = '0';
		targetContainer.setAttribute('data-morph-active', morphId);
		targetContainer.setAttribute('data-morph-target-active', morphId);

		// Force layout
		targetContainer.offsetHeight;

		// 5. Record LAST state for all children
		for (var j = 0; j < childStates.length; j++) {
			var state = childStates[j];
			state.last = getElementState(state.target);
			state.invert = calculateInvert(state.first, state.last, options);
		}

		var containerLast = options.animateContainer ? getElementState(targetContainer) : null;

		// 6. Create clones at FIRST positions
		var clones = [];
		for (var k = 0; k < childStates.length; k++) {
			var childState = childStates[k];
			var clone = createPositionedClone(childState.source, childState.first, options.cloneStyles);
			clone.setAttribute('data-morph-clone', childState.key);
			document.body.appendChild(clone);
			clones.push({ clone: clone, state: childState });
		}

		// 7. Hide target children temporarily (clones will be visible)
		for (var l = 0; l < childStates.length; l++) {
			childStates[l].target.style.opacity = '0';
		}

		// 8. Prepare unmatched target children for fade in
		var unmatchedTargetEls = [];
		for (var m = 0; m < childAnalysis.unmatchedTarget.length; m++) {
			var unmatchedEl = childAnalysis.unmatchedTarget[m].el;
			unmatchedEl.style.opacity = '0';
			unmatchedEl.style.transition = 'opacity ' + options.duration + 'ms ' + options.easing;
			unmatchedTargetEls.push(unmatchedEl);
		}

		// 9. Fade in target container smoothly
		targetContainer.style.transition = 'opacity ' + Math.floor(options.duration * 0.4) + 'ms ease-out';
		targetContainer.style.opacity = '1';

		// Emit start event
		var childKeys = childStates.map(function(s) { return s.key; });
		emitEvent('morph:shared:start', { 
			from: sourceContainer, 
			to: targetContainer, 
			id: morphId,
			children: childKeys 
		});
		if (options.onStart) {
			options.onStart({ 
				from: sourceContainer, 
				to: targetContainer, 
				id: morphId,
				children: childKeys 
			});
		}

		// 10. Store in active morphs
		var morphState = {
			id: morphId,
			type: 'shared',
			from: sourceContainer,
			to: targetContainer,
			clones: clones,
			childStates: childStates,
			options: options
		};
		_activeMorphs[morphId] = morphState;

		// 11. Animate clones to target positions (PLAY)
		var totalDuration = options.duration;
		var staggerTotal = options.stagger * (clones.length - 1);

		requestAnimationFrame(function() {
			for (var n = 0; n < clones.length; n++) {
				(function(index) {
					var item = clones[index];
					var delay = options.stagger ? index * options.stagger : 0;

					setTimeout(function() {
						animateCloneToTarget(item.clone, item.state, options, null);
					}, delay);
				})(n);
			}

			// Fade in unmatched target children
			var fadeInDelay = options.stagger ? Math.floor(staggerTotal / 2) : 0;
			setTimeout(function() {
				for (var o = 0; o < unmatchedTargetEls.length; o++) {
					unmatchedTargetEls[o].style.opacity = '1';
				}
			}, fadeInDelay);
		});

		// 12. Cleanup after animation
		var cleanupDelay = totalDuration + staggerTotal + 50;
		setTimeout(function() {
			// Remove from active morphs
			delete _activeMorphs[morphId];

			// Remove clones
			for (var p = 0; p < clones.length; p++) {
				var cloneEl = clones[p].clone;
				if (cloneEl.parentNode) {
					cloneEl.parentNode.removeChild(cloneEl);
				}
			}

			// Show target children
			for (var q = 0; q < childStates.length; q++) {
				var targetEl = childStates[q].target;
				targetEl.style.opacity = '';
				targetEl.style.transition = '';
			}

			// Reset unmatched
			for (var r = 0; r < unmatchedTargetEls.length; r++) {
				unmatchedTargetEls[r].style.transition = '';
			}

			// Clean up attributes and transitions
			sourceContainer.removeAttribute('data-morph-source-active');
			sourceContainer.style.transition = '';
			targetContainer.removeAttribute('data-morph-active');
			targetContainer.removeAttribute('data-morph-target-active');
			targetContainer.style.transition = '';

			// Store reverse data including original options
			targetContainer.setAttribute('data-morph-reverse', morphId);
			targetContainer._morphReverseData = {
				type: 'shared',
				sourceEl: sourceContainer,
				first: containerFirst || getElementState(sourceContainer),
				options: options,  // Store original options for reverse
				childStates: childStates.map(function(s) {
					return {
						key: s.key,
						source: s.source,
						target: s.target,
						first: s.first,
						last: s.last
					};
				})
			};

			// Emit complete event
			emitEvent('morph:shared:complete', { 
				from: sourceContainer, 
				to: targetContainer, 
				id: morphId,
				children: childKeys 
			});
			if (options.onComplete) {
				options.onComplete({ 
					from: sourceContainer, 
					to: targetContainer, 
					id: morphId,
					children: childKeys 
				});
			}
		}, cleanupDelay);

		// Return controller
		return {
			id: morphId,
			cancel: function() {
				// Remove clones
				for (var s = 0; s < clones.length; s++) {
					var cloneEl = clones[s].clone;
					if (cloneEl.parentNode) {
						cloneEl.parentNode.removeChild(cloneEl);
					}
				}
				// Reset visibility
				sourceContainer.style.visibility = '';
				sourceContainer.removeAttribute('data-morph-source-active');
				targetContainer.style.visibility = '';
				targetContainer.style.opacity = '';
				targetContainer.removeAttribute('data-morph-active');
				targetContainer.removeAttribute('data-morph-target-active');
				// Reset children
				for (var t = 0; t < childStates.length; t++) {
					childStates[t].target.style.opacity = '';
				}
				for (var u = 0; u < unmatchedTargetEls.length; u++) {
					unmatchedTargetEls[u].style.opacity = '';
					unmatchedTargetEls[u].style.transition = '';
				}
				delete _activeMorphs[morphId];
			}
		};
	}

	// =========================================================================
	// Helper Functions
	// =========================================================================

	/**
	 * Resolve element from selector, DOM element, or Funky.Dom wrapper
	 * @param {string|Element|Object} target
	 * @returns {Element|null}
	 */
	function resolveElement(target) {
		if (!target) return null;

		if (typeof target === 'string') {
			return document.querySelector(target);
		}

		// Funky.Dom wrapper
		if (target.el) {
			return target.el;
		}

		// Raw DOM element
		if (target.nodeType === 1) {
			return target;
		}

		return null;
	}

	/**
	 * Merge config with defaults
	 * @param {Object} config
	 * @returns {Object}
	 */
	function mergeOptions(config) {
		var options = {};
		// First copy all DEFAULTS
		for (var key in DEFAULTS) {
			if (DEFAULTS.hasOwnProperty(key)) {
				options[key] = config.hasOwnProperty(key) ? config[key] : DEFAULTS[key];
			}
		}
		// Then copy any extra config keys not in DEFAULTS (like animationStyle from presets)
		for (var configKey in config) {
			if (config.hasOwnProperty(configKey) && !options.hasOwnProperty(configKey)) {
				options[configKey] = config[configKey];
			}
		}
		return options;
	}

	/**
	 * Emit event via Funky.Events
	 * @param {string} eventName
	 * @param {Object} data
	 */
	function emitEvent(eventName, data) {
		if (E && E.emit) {
			E.emit(document, eventName, data);
		}

		// Also emit via PubSub if available
		if (PubSub && PubSub.emit) {
			PubSub.emit('funky:' + eventName, data);
		}
	}

	// =========================================================================
	// List Animations (MorphList)
	// =========================================================================

	var LIST_DEFAULTS = {
		duration: 300,
		easing: 'ease-out',
		stagger: 50,
		enterFrom: 'bottom',       // 'left', 'right', 'top', 'bottom', 'scale', 'fade'
		exitTo: 'top',             // 'left', 'right', 'top', 'bottom', 'scale', 'fade'
		itemSelector: '[data-morph-item]',
		itemAttribute: 'data-morph-item',
		respectMotion: true,

		// Gesture support (requires Funky.GestureTracker)
		swipeToRemove: false,
		swipeDirection: 'left',
		swipeThreshold: 100,

		// Callbacks
		onAdd: null,
		onRemove: null,
		onReorder: null
	};

	var _listIdCounter = 0;

	/**
	 * MorphList - Animated list manager
	 * @param {string|Element} container - List container
	 * @param {Object} options - Configuration
	 */
	function MorphList(container, options) {
		this._id = 'morphlist-' + (++_listIdCounter);
		this._container = resolveElement(container);

		if (!this._container) {
			console.error('[Funky.Morph.list] Container not found');
			return;
		}

		// Merge options with defaults
		this._config = {};
		for (var key in LIST_DEFAULTS) {
			if (LIST_DEFAULTS.hasOwnProperty(key)) {
				this._config[key] = (options && options.hasOwnProperty(key))
					? options[key]
					: LIST_DEFAULTS[key];
			}
		}

		this._items = [];
		this._batchMode = false;
		this._batchOperations = [];
		this._gestureTracker = null;

		// Initialize
		this._init();
	}

	/**
	 * Initialize list tracking
	 */
	MorphList.prototype._init = function() {
		this._scanItems();
		this._container.setAttribute('data-morph-list-active', this._id);
		this._initGestures();
	};

	/**
	 * Scan and track existing items
	 */
	MorphList.prototype._scanItems = function() {
		var self = this;
		var items = this._container.querySelectorAll(this._config.itemSelector);

		this._items = [];
		for (var i = 0; i < items.length; i++) {
			var el = items[i];
			// Only direct children or items within this container
			if (!this._container.contains(el)) continue;

			self._items.push({
				id: el.getAttribute(self._config.itemAttribute) || 'item-' + i,
				el: el,
				rect: el.getBoundingClientRect()
			});
		}
	};

	/**
	 * Initialize gesture support for swipe-to-remove
	 */
	MorphList.prototype._initGestures = function() {
		if (!this._config.swipeToRemove) return;

		var GestureTracker = global.Funky && global.Funky.GestureTracker;
		if (!GestureTracker) {
			console.warn('[Funky.Morph.list] swipeToRemove requires Funky.GestureTracker');
			return;
		}

		var self = this;
		var direction = this._config.swipeDirection;

		this._gestureTracker = GestureTracker.create({
			target: this._container,
			namespace: this._id,
			gestures: ['swipe'],
			swipeThreshold: this._config.swipeThreshold,

			onSwipe: function(data) {
				if (data.direction !== direction) return;

				var itemEl = data.target.closest(self._config.itemSelector);
				if (itemEl && self._container.contains(itemEl)) {
					self.remove(itemEl);
				}
			}
		});
	};

	/**
	 * Record positions of all items
	 * @returns {Object} Positions keyed by item ID
	 */
	MorphList.prototype._recordPositions = function() {
		var states = {};
		for (var i = 0; i < this._items.length; i++) {
			var item = this._items[i];
			states[item.id] = item.el.getBoundingClientRect();
		}
		return states;
	};

	/**
	 * Check reduced motion preference
	 * @returns {boolean}
	 */
	MorphList.prototype._shouldReduceMotion = function() {
		if (!this._config.respectMotion) return false;
		return prefersReducedMotion();
	};

	/**
	 * Animate item entering the list
	 * @param {Element} el
	 */
	MorphList.prototype._animateEnter = function(el) {
		var direction = this._config.enterFrom;
		var duration = this._config.duration;
		var easing = this._config.easing;

		// Set initial state based on direction
		var initialTransform = '';
		var initialOpacity = '0';

		switch (direction) {
			case 'left':
				initialTransform = 'translateX(-30px)';
				break;
			case 'right':
				initialTransform = 'translateX(30px)';
				break;
			case 'top':
				initialTransform = 'translateY(-30px)';
				break;
			case 'bottom':
				initialTransform = 'translateY(30px)';
				break;
			case 'scale':
				initialTransform = 'scale(0.8)';
				break;
			case 'fade':
			default:
				initialTransform = '';
				break;
		}

		el.style.opacity = initialOpacity;
		el.style.transform = initialTransform;
		el.setAttribute('data-morph-item-entering', 'true');
		el.offsetHeight; // Force reflow

		el.style.transition = 'opacity ' + duration + 'ms ' + easing +
		                      ', transform ' + duration + 'ms ' + easing;
		el.style.opacity = '1';
		el.style.transform = '';

		// Cleanup after animation
		var self = this;
		setTimeout(function() {
			el.style.transition = '';
			el.style.opacity = '';
			el.style.transform = '';
			el.removeAttribute('data-morph-item-entering');
		}, duration + 50);
	};

	/**
	 * Animate item exiting the list
	 * @param {Element} el
	 * @param {Function} callback
	 */
	MorphList.prototype._animateExit = function(el, callback) {
		var direction = this._config.exitTo;
		var duration = this._config.duration;
		var easing = this._config.easing;

		var targetTransform = '';

		switch (direction) {
			case 'left':
				targetTransform = 'translateX(-30px)';
				break;
			case 'right':
				targetTransform = 'translateX(30px)';
				break;
			case 'top':
				targetTransform = 'translateY(-30px)';
				break;
			case 'bottom':
				targetTransform = 'translateY(30px)';
				break;
			case 'scale':
				targetTransform = 'scale(0.8)';
				break;
			case 'fade':
			default:
				targetTransform = '';
				break;
		}

		el.setAttribute('data-morph-item-exiting', 'true');
		el.style.transition = 'opacity ' + duration + 'ms ' + easing +
		                      ', transform ' + duration + 'ms ' + easing;
		el.style.opacity = '0';
		el.style.transform = targetTransform;

		setTimeout(callback, duration);
	};

	/**
	 * Animate items from first to last positions (FLIP)
	 * @param {Object} firstStates - Initial positions keyed by ID
	 * @param {Object} lastStates - Final positions keyed by ID
	 * @param {Array} excludeIds - IDs to exclude (new/removed items)
	 */
	MorphList.prototype._animateDisplaced = function(firstStates, lastStates, excludeIds) {
		var duration = this._config.duration;
		var easing = this._config.easing;
		var stagger = this._config.stagger;

		var delay = 0;

		for (var i = 0; i < this._items.length; i++) {
			var item = this._items[i];

			if (excludeIds.indexOf(item.id) > -1) continue;

			var first = firstStates[item.id];
			var last = lastStates[item.id];

			if (!first || !last) continue;

			var deltaX = first.left - last.left;
			var deltaY = first.top - last.top;

			// Skip if no movement
			if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) continue;

			var el = item.el;

			// Apply inverse transform
			el.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
			el.style.transition = '';
			el.setAttribute('data-morph-item-moving', 'true');
			el.offsetHeight; // Force reflow

			// Animate to identity with stagger
			(function(element, d) {
				setTimeout(function() {
					element.style.transition = 'transform ' + duration + 'ms ' + easing;
					element.style.transform = '';

					// Cleanup
					setTimeout(function() {
						element.style.transition = '';
						element.removeAttribute('data-morph-item-moving');
					}, duration + 50);
				}, d);
			})(el, delay);

			delay += stagger;
		}
	};

	/**
	 * Add item to list with animation
	 * @param {string|Element} content - HTML string or element
	 * @param {Object} options - { position, animate }
	 * @returns {MorphList} this
	 */
	MorphList.prototype.add = function(content, options) {
		var opts = options || {};
		var position = typeof opts.position === 'number' ? opts.position : this._items.length;
		var animate = opts.animate !== false;

		// If batching, queue operation
		if (this._batchMode) {
			this._batchOperations.push({ type: 'add', content: content, options: opts });
			return this;
		}

		// Create element
		var newEl;
		if (typeof content === 'string') {
			var temp = document.createElement('div');
			temp.innerHTML = content.trim();
			newEl = temp.firstChild;
		} else {
			newEl = content.el || content;
		}

		if (!newEl) {
			console.warn('[Funky.Morph.list] Invalid content for add()');
			return this;
		}

		// Get/set item ID
		var itemId = newEl.getAttribute(this._config.itemAttribute) ||
		             'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
		newEl.setAttribute(this._config.itemAttribute, itemId);

		// FLIP: Record current positions
		var firstStates = this._recordPositions();

		// Insert element
		if (position >= this._items.length) {
			this._container.appendChild(newEl);
		} else if (position <= 0) {
			this._container.insertBefore(newEl, this._container.firstChild);
		} else {
			var refEl = this._items[position].el;
			this._container.insertBefore(newEl, refEl);
		}

		// Update tracking
		this._scanItems();

		if (animate && !this._shouldReduceMotion()) {
			// FLIP: Record new positions
			var lastStates = this._recordPositions();

			// Apply enter animation to new item
			this._animateEnter(newEl);

			// Animate displaced items
			this._animateDisplaced(firstStates, lastStates, [itemId]);
		}

		// Emit event
		emitEvent('morphlist:add', { item: newEl, index: position, list: this._container });
		if (this._config.onAdd) {
			this._config.onAdd({ item: newEl, index: position });
		}

		return this;
	};

	/**
	 * Add item without animation (for batch operations)
	 * @private
	 */
	MorphList.prototype._addWithoutAnimation = function(content, options) {
		var opts = options || {};
		var position = typeof opts.position === 'number' ? opts.position : this._items.length;

		var newEl;
		if (typeof content === 'string') {
			var temp = document.createElement('div');
			temp.innerHTML = content.trim();
			newEl = temp.firstChild;
		} else {
			newEl = content.el || content;
		}

		if (!newEl) return null;

		var itemId = newEl.getAttribute(this._config.itemAttribute) ||
		             'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
		newEl.setAttribute(this._config.itemAttribute, itemId);

		if (position >= this._items.length) {
			this._container.appendChild(newEl);
		} else if (position <= 0) {
			this._container.insertBefore(newEl, this._container.firstChild);
		} else {
			var refEl = this._items[position].el;
			this._container.insertBefore(newEl, refEl);
		}

		return newEl;
	};

	/**
	 * Remove item from list with animation
	 * @param {string|Element|number} item - Selector, element, or index
	 * @returns {MorphList} this
	 */
	MorphList.prototype.remove = function(item) {
		var el;

		if (typeof item === 'number') {
			el = this._items[item] ? this._items[item].el : null;
		} else if (typeof item === 'string') {
			el = this._container.querySelector(item);
		} else {
			el = item.el || item;
		}

		if (!el) {
			console.warn('[Funky.Morph.list] Item not found');
			return this;
		}

		// If batching, queue operation
		if (this._batchMode) {
			this._batchOperations.push({ type: 'remove', item: el });
			return this;
		}

		var self = this;
		var itemId = el.getAttribute(this._config.itemAttribute);

		// FLIP: Record current positions
		var firstStates = this._recordPositions();

		if (!this._shouldReduceMotion()) {
			// Animate exit
			this._animateExit(el, function() {
				// Remove from DOM after animation
				if (el.parentNode) {
					el.parentNode.removeChild(el);
				}

				// Update tracking
				self._scanItems();

				// FLIP: Record new positions and animate
				var lastStates = self._recordPositions();
				self._animateDisplaced(firstStates, lastStates, [itemId]);

				// Emit event
				emitEvent('morphlist:remove', { item: el, list: self._container });
				if (self._config.onRemove) {
					self._config.onRemove({ item: el });
				}
			});
		} else {
			// Instant remove
			if (el.parentNode) {
				el.parentNode.removeChild(el);
			}
			this._scanItems();
			emitEvent('morphlist:remove', { item: el, list: this._container });
			if (this._config.onRemove) {
				this._config.onRemove({ item: el });
			}
		}

		return this;
	};

	/**
	 * Reorder items with animation
	 * @param {Array} order - Array of item IDs in new order
	 * @returns {MorphList} this
	 */
	MorphList.prototype.reorder = function(order) {
		if (!Array.isArray(order)) {
			console.error('[Funky.Morph.list] reorder requires an array of item IDs');
			return this;
		}

		// If batching, queue operation
		if (this._batchMode) {
			this._batchOperations.push({ type: 'reorder', order: order });
			return this;
		}

		// FLIP: Record current positions
		var firstStates = this._recordPositions();

		// Create a map of items by ID
		var itemMap = {};
		for (var i = 0; i < this._items.length; i++) {
			itemMap[this._items[i].id] = this._items[i].el;
		}

		// Reorder DOM elements
		var self = this;
		for (var j = 0; j < order.length; j++) {
			var el = itemMap[order[j]];
			if (el) {
				this._container.appendChild(el);
			}
		}

		// Update tracking
		this._scanItems();

		// FLIP: Animate to new positions
		if (!this._shouldReduceMotion()) {
			var lastStates = this._recordPositions();
			this._animateDisplaced(firstStates, lastStates, []);
		}

		// Emit event
		emitEvent('morphlist:reorder', { order: order, list: this._container });
		if (this._config.onReorder) {
			this._config.onReorder({ order: order });
		}

		return this;
	};

	/**
	 * Reorder without animation (for batch operations)
	 * @private
	 */
	MorphList.prototype._reorderWithoutAnimation = function(order) {
		var itemMap = {};
		for (var i = 0; i < this._items.length; i++) {
			itemMap[this._items[i].id] = this._items[i].el;
		}

		for (var j = 0; j < order.length; j++) {
			var el = itemMap[order[j]];
			if (el) {
				this._container.appendChild(el);
			}
		}
	};

	/**
	 * Batch multiple operations into single animation pass
	 * @param {Function} fn - Function containing operations
	 * @returns {MorphList} this
	 */
	MorphList.prototype.batch = function(fn) {
		this._batchMode = true;
		this._batchOperations = [];

		// Execute operations (they will queue instead of animate)
		fn.call(this);

		this._batchMode = false;

		// Process all operations
		if (this._batchOperations.length === 0) return this;

		// Record initial state
		var firstStates = this._recordPositions();

		// Apply all DOM changes without animation
		var addedElements = [];
		var removedIds = [];
		var self = this;

		for (var i = 0; i < this._batchOperations.length; i++) {
			var op = this._batchOperations[i];

			if (op.type === 'add') {
				var newEl = this._addWithoutAnimation(op.content, op.options);
				if (newEl) addedElements.push(newEl);
			} else if (op.type === 'remove') {
				var itemId = op.item.getAttribute(this._config.itemAttribute);
				removedIds.push(itemId);
				if (op.item.parentNode) {
					op.item.parentNode.removeChild(op.item);
				}
			} else if (op.type === 'reorder') {
				this._reorderWithoutAnimation(op.order);
			}
		}

		// Update tracking
		this._scanItems();

		// Animate all changes
		if (!this._shouldReduceMotion()) {
			var lastStates = this._recordPositions();

			// Animate added items
			for (var j = 0; j < addedElements.length; j++) {
				this._animateEnter(addedElements[j]);
			}

			// Build exclude list
			var excludeIds = removedIds.slice();
			for (var k = 0; k < addedElements.length; k++) {
				excludeIds.push(addedElements[k].getAttribute(this._config.itemAttribute));
			}

			// Animate displaced items
			this._animateDisplaced(firstStates, lastStates, excludeIds);
		}

		// Emit batch event
		emitEvent('morphlist:batch', { operations: this._batchOperations.length, list: this._container });

		this._batchOperations = [];
		return this;
	};

	/**
	 * Get current order of item IDs
	 * @returns {Array} Array of item IDs
	 */
	MorphList.prototype.getOrder = function() {
		return this._items.map(function(item) {
			return item.id;
		});
	};

	/**
	 * Get item count
	 * @returns {number}
	 */
	MorphList.prototype.count = function() {
		return this._items.length;
	};

	/**
	 * Get item by index or ID
	 * @param {number|string} indexOrId
	 * @returns {Element|null}
	 */
	MorphList.prototype.get = function(indexOrId) {
		if (typeof indexOrId === 'number') {
			return this._items[indexOrId] ? this._items[indexOrId].el : null;
		}

		for (var i = 0; i < this._items.length; i++) {
			if (this._items[i].id === indexOrId) {
				return this._items[i].el;
			}
		}
		return null;
	};

	/**
	 * Refresh item tracking (call after external DOM changes)
	 * @returns {MorphList} this
	 */
	MorphList.prototype.refresh = function() {
		this._scanItems();
		return this;
	};

	/**
	 * Destroy list manager and cleanup
	 */
	MorphList.prototype.destroy = function() {
		// Cleanup gesture tracker
		if (this._gestureTracker && this._gestureTracker.destroy) {
			this._gestureTracker.destroy();
		}

		// Remove attribute
		this._container.removeAttribute('data-morph-list-active');

		// Clear references
		this._items = [];
		this._container = null;
		this._config = null;
	};

	/**
	 * Factory function to create MorphList
	 * @param {string|Element} container
	 * @param {Object} options
	 * @returns {MorphList}
	 */
	function createMorphList(container, options) {
		return new MorphList(container, options);
	}

	// =========================================================================
	// Bounds Animation (for Tour, custom spotlight animations)
	// =========================================================================

	/**
	 * Animate between two bounding rectangles
	 * Useful for custom animations like Tour spotlight transitions
	 * 
	 * @param {Object} options - Animation options
	 * @param {Object} options.from - Source bounds { left, top, width, height }
	 * @param {Object} options.to - Target bounds { left, top, width, height }
	 * @param {number} [options.duration] - Animation duration in ms
	 * @param {string} [options.easing] - Easing function name or CSS value
	 * @param {Function} [options.onUpdate] - Called each frame with current bounds
	 * @param {Function} [options.onComplete] - Called when animation completes
	 * @returns {Object} Controller with cancel() method
	 */
	function animateBounds(options) {
		var from = options.from || { left: 0, top: 0, width: 0, height: 0 };
		var to = options.to || { left: 0, top: 0, width: 0, height: 0 };
		var duration = options.duration || DEFAULTS.duration;
		var easingName = options.easing || DEFAULTS.easing;
		var onUpdate = options.onUpdate || noop;
		var onComplete = options.onComplete || noop;

		// Check reduced motion preference
		if (prefersReducedMotion()) {
			onUpdate(to);
			onComplete();
			return { cancel: noop };
		}

		// Parse easing - get the CSS cubic-bezier values
		var easingCss = resolveEasing(easingName);
		var easingFn = parseEasingToBezier(easingCss);

		var startTime = null;
		var animationId = null;
		var cancelled = false;

		function animate(timestamp) {
			if (cancelled) return;

			if (!startTime) startTime = timestamp;
			var elapsed = timestamp - startTime;
			var progress = Math.min(elapsed / duration, 1);
			var easedProgress = easingFn(progress);

			// Interpolate bounds
			var current = {
				left: from.left + (to.left - from.left) * easedProgress,
				top: from.top + (to.top - from.top) * easedProgress,
				width: from.width + (to.width - from.width) * easedProgress,
				height: from.height + (to.height - from.height) * easedProgress
			};

			onUpdate(current);

			if (progress < 1) {
				animationId = requestAnimationFrame(animate);
			} else {
				onComplete();
			}
		}

		animationId = requestAnimationFrame(animate);

		return {
			cancel: function() {
				cancelled = true;
				if (animationId) {
					cancelAnimationFrame(animationId);
				}
			}
		};
	}

	/**
	 * Parse CSS easing string to a bezier function
	 * @param {string} easingCss - CSS cubic-bezier or keyword
	 * @returns {Function} Easing function (0-1) => (0-1)
	 */
	function parseEasingToBezier(easingCss) {
		// Handle keywords
		var keywords = {
			'linear': function(t) { return t; },
			'ease': createBezier(0.25, 0.1, 0.25, 1),
			'ease-in': createBezier(0.42, 0, 1, 1),
			'ease-out': createBezier(0, 0, 0.58, 1),
			'ease-in-out': createBezier(0.42, 0, 0.58, 1)
		};

		if (keywords[easingCss]) {
			return keywords[easingCss];
		}

		// Parse cubic-bezier(x1, y1, x2, y2)
		var match = easingCss.match(/cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
		if (match) {
			return createBezier(
				parseFloat(match[1]),
				parseFloat(match[2]),
				parseFloat(match[3]),
				parseFloat(match[4])
			);
		}

		// Fallback to linear
		return function(t) { return t; };
	}

	/**
	 * Create a cubic bezier easing function
	 * Based on WebKit's implementation
	 * @param {number} x1 
	 * @param {number} y1 
	 * @param {number} x2 
	 * @param {number} y2 
	 * @returns {Function}
	 */
	function createBezier(x1, y1, x2, y2) {
		// Newton-Raphson iteration for finding t given x
		function sampleCurveX(t) {
			return ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * (3 * x1) * t;
		}

		function sampleCurveY(t) {
			return ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * (3 * y1) * t;
		}

		function solveCurveX(x) {
			var t = x;
			for (var i = 0; i < 8; i++) {
				var x2 = sampleCurveX(t) - x;
				if (Math.abs(x2) < 0.001) return t;
				var d = (3 * (1 - 3 * x2 + 3 * x1) * t * t + 2 * (3 * x2 - 6 * x1) * t + 3 * x1);
				if (Math.abs(d) < 0.000001) break;
				t = t - x2 / d;
			}
			return t;
		}

		// Simplified implementation using lookup table for performance
		var SAMPLE_COUNT = 11;
		var samples = new Array(SAMPLE_COUNT);
		for (var i = 0; i < SAMPLE_COUNT; i++) {
			samples[i] = calcBezier(i / (SAMPLE_COUNT - 1), x1, x2);
		}

		function calcBezier(t, a, b) {
			return (((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t + 3 * a) * t;
		}

		function getTForX(x) {
			var intervalStart = 0;
			var currentSample = 1;
			var lastSample = SAMPLE_COUNT - 1;

			for (; currentSample !== lastSample && samples[currentSample] <= x; ++currentSample) {
				intervalStart += 1 / (SAMPLE_COUNT - 1);
			}
			--currentSample;

			var dist = (x - samples[currentSample]) / (samples[currentSample + 1] - samples[currentSample]);
			var guessForT = intervalStart + dist / (SAMPLE_COUNT - 1);

			return guessForT;
		}

		return function(x) {
			if (x === 0 || x === 1) return x;
			return calcBezier(getTForX(x), y1, y2);
		};
	}

	// =========================================================================
	// FLIP Animation Helper (for TreeView, lists, etc.)
	// =========================================================================

	/**
	 * Perform a FLIP animation on a single element given first/last positions
	 * Useful for animating elements after DOM changes (reordering, expand/collapse)
	 * 
	 * @param {Object} options
	 * @param {Element} options.element - Element to animate
	 * @param {DOMRect} options.first - First position rect (before DOM change)
	 * @param {DOMRect} [options.last] - Last position rect (after DOM change). If omitted, uses current position
	 * @param {number} [options.duration] - Animation duration in ms
	 * @param {string} [options.easing] - Easing function name
	 * @param {Function} [options.onComplete] - Called when animation completes
	 * @returns {Object} Controller with cancel() method
	 */
	function flip(options) {
		var el = options.element;
		var first = options.first;
		var last = options.last || el.getBoundingClientRect();
		var duration = options.duration || DEFAULTS.duration;
		var easingName = options.easing || DEFAULTS.easing;
		var onComplete = options.onComplete || noop;

		// Check reduced motion preference
		if (prefersReducedMotion()) {
			onComplete();
			return { cancel: noop };
		}

		// Calculate deltas (Invert step)
		var deltaX = first.left - last.left;
		var deltaY = first.top - last.top;
		var deltaW = first.width / last.width;
		var deltaH = first.height / last.height;

		// Skip if no movement
		if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1 && 
		    Math.abs(deltaW - 1) < 0.01 && Math.abs(deltaH - 1) < 0.01) {
			onComplete();
			return { cancel: noop };
		}

		// Apply inverse transform (start from old position)
		el.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
		if (Math.abs(deltaW - 1) > 0.01 || Math.abs(deltaH - 1) > 0.01) {
			el.style.transform += ' scale(' + deltaW + ', ' + deltaH + ')';
		}
		el.style.transformOrigin = 'top left';

		// Force reflow
		el.offsetHeight;

		// Get CSS easing
		var easingCss = resolveEasing(easingName);

		// Play: animate to current position
		el.style.transition = 'transform ' + duration + 'ms ' + easingCss;
		el.style.transform = 'none';

		var cancelled = false;
		var timeoutId = setTimeout(function() {
			if (cancelled) return;
			// Cleanup
			el.style.transition = '';
			el.style.transform = '';
			el.style.transformOrigin = '';
			onComplete();
		}, duration);

		return {
			cancel: function() {
				cancelled = true;
				clearTimeout(timeoutId);
				el.style.transition = '';
				el.style.transform = '';
				el.style.transformOrigin = '';
			}
		};
	}

	/**
	 * Animate multiple elements using FLIP after a DOM change
	 * Captures positions before callback, executes callback, then animates
	 * 
	 * @param {Object} options
	 * @param {Element[]} options.elements - Elements to animate
	 * @param {Function} options.change - Function that performs the DOM change
	 * @param {number} [options.duration] - Animation duration in ms
	 * @param {string} [options.easing] - Easing function name
	 * @param {number} [options.stagger] - Delay between each element's animation
	 * @param {Function} [options.onComplete] - Called when all animations complete
	 * @returns {Object} Controller with cancel() method
	 */
	function flipBatch(options) {
		var elements = options.elements || [];
		var change = options.change;
		var duration = options.duration || DEFAULTS.duration;
		var easing = options.easing || DEFAULTS.easing;
		var stagger = options.stagger || 0;
		var onComplete = options.onComplete || noop;

		if (elements.length === 0 || typeof change !== 'function') {
			if (typeof change === 'function') change();
			onComplete();
			return { cancel: noop };
		}

		// FIRST: Capture all positions
		var firstPositions = [];
		for (var i = 0; i < elements.length; i++) {
			firstPositions.push(elements[i].getBoundingClientRect());
		}

		// Execute the DOM change
		change();

		// Force reflow
		document.body.offsetHeight;

		// LAST + INVERT + PLAY: Animate each element
		var controllers = [];
		var completed = 0;

		function checkComplete() {
			completed++;
			if (completed >= elements.length) {
				onComplete();
			}
		}

		for (var j = 0; j < elements.length; j++) {
			(function(index) {
				var delay = stagger * index;
				setTimeout(function() {
					var controller = flip({
						element: elements[index],
						first: firstPositions[index],
						duration: duration,
						easing: easing,
						onComplete: checkComplete
					});
					controllers.push(controller);
				}, delay);
			})(j);
		}

		return {
			cancel: function() {
				for (var k = 0; k < controllers.length; k++) {
					controllers[k].cancel();
				}
			}
		};
	}

	// =========================================================================
	// Public API
	// =========================================================================

	var Morph = {
		// Core methods
		to: morphTo,
		reverse: morphReverse,
		shared: morphShared,
		list: createMorphList,
		cancel: cancelMorph,
		cancelAll: cancelAll,

		// Bounds animation (for Tour spotlight, etc.)
		animateBounds: animateBounds,

		// FLIP helpers (for TreeView, lists, reordering)
		flip: flip,
		flipBatch: flipBatch,

		// Preset & Easing management
		registerPreset: registerPreset,
		getPresets: getPresets,
		getEasings: getEasings,
		resolveEasing: resolveEasing,

		// Spring animation
		spring: SpringAnimation.create,

		// Accessibility
		announce: announce,
		watchReducedMotion: watchReducedMotion,
		createFocusTrap: createFocusTrap,

		// Utilities
		isMorphing: isMorphing,
		getActiveMorph: getActiveMorph,
		prefersReducedMotion: prefersReducedMotion,

		// Constants
		DEFAULTS: DEFAULTS,
		PRESETS: PRESETS,
		EASINGS: EASINGS,
		SHARED_DEFAULTS: SHARED_DEFAULTS,
		LIST_DEFAULTS: LIST_DEFAULTS,

		// Version
		version: '1.0.0'
	};

	// Register with Funky
	global.Funky.register('Morph', Morph);

})(window);
