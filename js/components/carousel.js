/**
 * Funky Carousel - Responsive slide/card carousel component
 * Supports touch/swipe, keyboard navigation, autoplay, and multiple layouts
 * 
 * Usage:
 *   var carousel = Funky.Carousel.create('#my-carousel', {
 *     slidesToShow: 3,
 *     slidesToScroll: 1,
 *     gap: 16,
 *     autoplay: false,
 *     onSlideChange: function(index) { console.log('Slide:', index); }
 *   });
 * 
 *   // Or from existing markup
 *   Funky.Carousel.create('.carousel-container');
 * 
 * @version 1.0.2
 */
(function(window) {
	'use strict';

	// Ensure Funky registry exists
	if (!window.Funky || !window.Funky.register) {
		console.error('[Funky.Carousel] Registry not found. Load namespace.js first.');
		return;
	}

	var D = Funky.Dom;
	var P = Funky.PubSub;

	// Ensure Funky.Dom is loaded
	if (!D || !D.create) {
		console.error('[Funky.Carousel] Funky.Dom not loaded. Load dom.js first.');
		return;
	}

	// =========================================================================
	// Default Configuration
	// =========================================================================

	var DEFAULTS = {
		// Core
		slidesToShow: 1,              // Number of slides visible
		slidesToScroll: 1,            // Number of slides to scroll per action
		initialSlide: 0,              // Starting slide index
		gap: 16,                      // Gap between slides (px or CSS value)
		
		// Animation
		speed: 400,                   // Transition speed in ms
		easing: 'ease-out',           // CSS easing function
		
		// Touch/Swipe (Phase 2)
		swipe: true,                  // Enable swipe gestures
		draggable: true,              // Enable mouse drag
		swipeThreshold: 50,           // Min distance for swipe (px)
		edgeResistance: 0.3,          // Resistance at edges (0-1)
		
		// Navigation (Phase 3)
		arrows: true,                 // Show prev/next arrows
		dots: true,                   // Show dot indicators
		arrowPrev: null,              // Custom prev arrow element/HTML
		arrowNext: null,              // Custom next arrow element/HTML
		arrowsInside: false,          // Place arrows inside viewport
		dotsPosition: 'bottom',       // 'bottom', 'top', or 'outside'
		
		// Keyboard (Phase 3)
		keyboard: true,               // Enable keyboard navigation
		keyboardScope: 'focused',     // 'focused' or 'always'
		
		// Autoplay (Phase 4)
		autoplay: false,              // Enable autoplay
		autoplaySpeed: 5000,          // Interval between slides (ms)
		pauseOnHover: true,           // Pause when mouse over
		pauseOnFocus: true,           // Pause when carousel has focus
		pauseOnInteraction: true,     // Pause after user interaction
		showPlayButton: false,        // Show play/pause toggle
		showProgress: false,          // Show progress bar
		respectReducedMotion: true,   // Honor prefers-reduced-motion
		
		// Advanced (Phase 5)
		responsive: null,             // Array of breakpoint configs
		autoResponsive: true,         // Auto-generate responsive breakpoints if none provided
		centerMode: false,            // Center active slide
		centerPadding: '50px',        // Padding on sides in center mode
		infinite: false,              // Infinite loop mode
		lazyLoad: false,              // 'ondemand' or 'progressive'
		lazyLoadAhead: 1,             // How many slides ahead to load
		fullscreen: false,            // Enable fullscreen button
		fullWidth: false,             // Stretch to full viewport width
		fullWidthSlides: false,       // Each slide takes 100% width (one at a time)
		
		// Content
		slides: null,                 // Array of slide content/elements (optional)
		slideSelector: '.carousel__slide', // Selector for existing slides
		
		// Accessibility
		ariaLabel: 'Carousel',        // Accessible label for the carousel
		
		// Callbacks
		onSlideChange: null,          // function(index, previousIndex)
		onInit: null,                 // function(carousel)
		onDestroy: null,              // function()
		onSwipe: null,                // function(direction)
		onDragStart: null,            // function()
		onDragEnd: null,              // function(fromIndex, toIndex)
		onArrowClick: null,           // function(direction) - Phase 3
		onAutoplayStart: null,        // function() - Phase 4
		onAutoplayStop: null,         // function() - Phase 4
		onAutoplayPause: null,        // function(reason) - Phase 4
		onAutoplayResume: null,       // function(reason) - Phase 4
		onLazyLoad: null,             // function(slide, image) - Phase 5
		onFullscreenChange: null,     // function(isFullscreen) - Phase 5
		onBreakpoint: null            // function(breakpoint) - Phase 5
	};

	// =========================================================================
	// Carousel Instance
	// =========================================================================

	/**
	 * Carousel Constructor
	 * @param {HTMLElement|string} container - Container element or selector
	 * @param {Object} options - Configuration options
	 */
	function FunkyCarousel(container, options) {
		// Check that D (Funky.Dom) is available
		if (!D) {
			console.error('[Funky.Carousel] Funky.Dom not loaded');
			return;
		}

		// Resolve container
		if (typeof container === 'string') {
			this.container = D.one(container);
		} else if (container && container.el) {
			// Already a Funky.Dom wrapper
			this.container = container;
		} else if (container && container.nodeType === 1) {
			// HTMLElement (use nodeType check for cross-frame compatibility)
			this.container = D.wrap(container);
		} else if (container) {
			// Try wrapping anyway
			this.container = D.wrap(container);
		}

		if (!this.container || !this.container.el) {
			console.error('[Funky.Carousel] Container not found:', container);
			return;
		}

		// Merge options with defaults
		this.config = {};
		for (var key in DEFAULTS) {
			if (DEFAULTS.hasOwnProperty(key)) {
				this.config[key] = DEFAULTS[key];
			}
		}
		if (options) {
			for (var k in options) {
				if (options.hasOwnProperty(k)) {
					this.config[k] = options[k];
				}
			}
		}

		// Auto-generate responsive breakpoints if none provided and autoResponsive is enabled
		if (this.config.autoResponsive && !this.config.responsive && this.config.slidesToShow > 1) {
			var slidesToShow = this.config.slidesToShow;
			var breakpoints = [];
			
			// Generate sensible breakpoints based on slidesToShow
			// Mobile (<576px): always 1 slide
			// Small tablet (576-767px): min(2, slidesToShow)
			// Tablet (768-991px): min(3, slidesToShow)  
			// Desktop (992+): use original slidesToShow
			
			if (slidesToShow > 1) {
				breakpoints.push({ 
					breakpoint: 575, 
					settings: { slidesToShow: 1, slidesToScroll: 1 } 
				});
			}
			if (slidesToShow > 2) {
				breakpoints.push({ 
					breakpoint: 767, 
					settings: { slidesToShow: 2, slidesToScroll: 1 } 
				});
			}
			if (slidesToShow > 3) {
				breakpoints.push({ 
					breakpoint: 991, 
					settings: { slidesToShow: 3, slidesToScroll: 1 } 
				});
			}
			
			if (breakpoints.length > 0) {
				this.config.responsive = breakpoints;
			}
		}

		// Cleanup functions array (for reliable event listener removal)
		this._cleanups = [];

		// Internal state
		this.state = {
			initialized: false,
			currentIndex: this.config.initialSlide,
			slideCount: 0,
			slideWidth: 0,
			isAnimating: false,
			
			// Touch/drag state (Phase 2)
			isDragging: false,
			dragStartX: 0,
			dragCurrentX: 0,
			dragStartIndex: 0,
			gestureTracker: null,
			
			// Navigation state (Phase 3)
			prevArrow: null,
			nextArrow: null,
			dotsContainer: null,
			dots: [],
			
			// Autoplay state (Phase 4)
			autoplayTimer: null,
			autoplayPaused: false,
			autoplayManuallyPaused: false,
			progressBar: null,
			playButton: null,
			reducedMotion: false,
			
			// Advanced state (Phase 5)
			originalConfig: null,
			currentBreakpoint: null,
			mediaQueries: [],
			lazyLoadedSlides: {},
			clonesBefore: [],
			clonesAfter: [],
			fullscreenButton: null,
			isFullscreen: false,
			
			// DOM references
			viewport: null,
			track: null,
			slides: []
		};

		// Generate unique ID if needed
		if (!this.container.attr('id')) {
			this.container.attr('id', 'carousel-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
		}

		this._init();
	}

	// =========================================================================
	// Initialization
	// =========================================================================

	/**
	 * Initialize the carousel
	 * @private
	 */
	FunkyCarousel.prototype._init = function() {
		this._buildDOM();
		this._calculateDimensions();
		this._bindEvents();

		// Phase 5: Initialize advanced features (before position update)
		this._initInfiniteLoop();
		this._initCenterMode();

		this._updatePosition(false);
		this._updateARIA();

		// Phase 3: Build navigation
		this._buildArrows();
		this._buildDots();
		this._initKeyboard();

		// Phase 4: Initialize autoplay
		this._initAutoplay();

		// Phase 5: Initialize remaining features
		this._initResponsive();
		this._initLazyLoad();
		this._initFullscreen();

		this.state.initialized = true;

		// Store reference on element for getInstance
		this.container.el._funkyCarousel = this;

		// Register in instance registry
		var containerId = this.container.attr('id');
		if (containerId) {
			_instances.register(containerId, this);
		}

		// Emit init event
		if (P) {
			P.emit('funky:carousel:init', { carousel: this });
		}

		// Callback
		if (typeof this.config.onInit === 'function') {
			this.config.onInit(this);
		}
	};

	/**
	 * Build the carousel DOM structure
	 * @private
	 */
	FunkyCarousel.prototype._buildDOM = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		// Add base class
		this.container.classAdd('carousel');
		
		// Add full-width class if enabled
		if (config.fullWidth) {
			this.container.classAdd('carousel--full-width');
		}

		// Create viewport
		state.viewport = D.create('div')
			.classAdd('carousel__viewport');

		// Create track
		state.track = D.create('div')
			.classAdd('carousel__track')
			.attr('id', this.container.attr('id') + '-track');

		// Gather slides - either from config or existing DOM
		var slideContents = [];

		if (config.slides && config.slides.length) {
			// Slides provided in config
			slideContents = config.slides;
		} else {
			// Look for existing slides in container
			var existingSlides = this.container.find(config.slideSelector);
			if (existingSlides && existingSlides.length) {
				// ElementList uses .each() not .forEach()
				existingSlides.each(function(slide) {
					slideContents.push(slide.el.cloneNode(true));
				});
				// Clear existing content
				this.container.html('');
			}
		}

		// Build slides
		slideContents.forEach(function(content, index) {
			var slide = self._createSlide(content, index);
			state.slides.push(slide);
			state.track.append(slide);
		});

		state.slideCount = state.slides.length;

		// Assemble structure
		state.viewport.append(state.track);
		this.container.append(state.viewport);

		// Add container ARIA
		this.container.attr({
			'role': 'region',
			'aria-roledescription': 'carousel',
			'aria-label': config.ariaLabel
		});

		// Track ARIA
		state.track.attr({
			'role': 'group',
			'aria-live': 'polite',
			'aria-atomic': 'false'
		});
	};

	/**
	 * Create a single slide element
	 * @param {HTMLElement|string|Object} content - Slide content
	 * @param {number} index - Slide index
	 * @returns {Object} - Funky.Dom wrapped element
	 * @private
	 */
	FunkyCarousel.prototype._createSlide = function(content, index) {
		var slide = D.create('div')
			.classAdd('carousel__slide')
			.attr({
				'role': 'group',
				'aria-roledescription': 'slide',
				'aria-label': (index + 1) + ' of ' + (this.config.slides ? this.config.slides.length : '?')
			});

		// Handle different content types
		if (typeof content === 'string') {
			slide.html(content);
		} else if (content && content.nodeType === 1) {
			// HTMLElement (use nodeType for cross-frame compatibility)
			slide.append(D.wrap(content));
		} else if (content && content.el) {
			slide.append(content);
		} else if (content && typeof content === 'object') {
			// Object with render method or template
			if (typeof content.render === 'function') {
				var rendered = content.render();
				if (typeof rendered === 'string') {
					slide.html(rendered);
				} else {
					slide.append(rendered);
				}
			} else if (content.html) {
				slide.html(content.html);
			}
		}

		return slide;
	};

	/**
	 * Get effective slides to show (accounts for fullWidthSlides and fullscreen modes)
	 * @returns {number}
	 * @private
	 */
	FunkyCarousel.prototype._getEffectiveSlidesToShow = function() {
		// In fullscreen mode, always show 1 slide at a time
		if (this.state.isFullscreen) {
			return 1;
		}
		return this.config.fullWidthSlides ? 1 : this.config.slidesToShow;
	};

	/**
	 * Calculate slide dimensions
	 * @private
	 */
	FunkyCarousel.prototype._calculateDimensions = function() {
		var state = this.state;
		var config = this.config;

		var viewportWidth = state.viewport.el.offsetWidth;
		var gapValue = typeof config.gap === 'number' ? config.gap : parseInt(config.gap, 10) || 0;
		
		// In fullscreen mode, always use full viewport width for slides
		if (state.isFullscreen) {
			state.slideWidth = window.innerWidth;
			gapValue = 0;
		}
		// Full width slides: each slide takes 100% of viewport, override slidesToShow
		else if (config.fullWidthSlides) {
			state.slideWidth = viewportWidth;
			gapValue = 0; // No gap in full width mode
		} else {
			var totalGaps = (config.slidesToShow - 1) * gapValue;
			state.slideWidth = (viewportWidth - totalGaps) / config.slidesToShow;
		}

		// Apply dimensions to slides
		state.slides.forEach(function(slide) {
			slide.style({
				width: state.slideWidth + 'px',
				flexShrink: '0'
			});
		});

		// Apply dimensions to clone slides (for infinite mode)
		if (state.clonesBefore && state.clonesBefore.length) {
			state.clonesBefore.forEach(function(clone) {
				clone.style({
					width: state.slideWidth + 'px',
					flexShrink: '0'
				});
			});
		}
		if (state.clonesAfter && state.clonesAfter.length) {
			state.clonesAfter.forEach(function(clone) {
				clone.style({
					width: state.slideWidth + 'px',
					flexShrink: '0'
				});
			});
		}

		// Apply gap to track
		state.track.style({
			gap: (state.isFullscreen || config.fullWidthSlides) ? '0px' : gapValue + 'px'
		});
	};

	/**
	 * Bind event handlers
	 * @private
	 */
	FunkyCarousel.prototype._bindEvents = function() {
		var self = this;

		// Window resize
		this._resizeHandler = function() {
			self._calculateDimensions();
			self._updatePosition(false);
		};
		window.addEventListener('resize', this._resizeHandler);

		// Register cleanup for resize handler
		this._cleanups.push(function() {
			window.removeEventListener('resize', self._resizeHandler);
		});

		// Touch/swipe handling (Phase 2)
		this._initTouchHandler();
	};

	// =========================================================================
	// Touch & Swipe Handling (Phase 2)
	// =========================================================================

	/**
	 * Initialize touch/swipe handling
	 * @private
	 */
	FunkyCarousel.prototype._initTouchHandler = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		if (!config.swipe && !config.draggable) return;

		// Check if GestureTracker is available
		if (!Funky.GestureTracker) {
			// Fallback to basic touch events
			this._initTouchFallback();
			return;
		}

		state.gestureTracker = Funky.GestureTracker.create({
			target: state.viewport.el,
			namespace: 'carousel-' + this.container.attr('id'),
			gestures: ['swipe', 'drag'],
			swipeThreshold: config.swipeThreshold,
			preventDefault: true,
			passive: false,

			onSwipe: function(data) {
				if (state.isDragging) return; // Will be handled by dragEnd

				if (data.direction === 'left') {
					self.next();
				} else if (data.direction === 'right') {
					self.prev();
				}

				if (P) {
					P.emit('funky:carousel:swipe', {
						carousel: self,
						direction: data.direction
					});
				}

				if (typeof config.onSwipe === 'function') {
					config.onSwipe(data.direction);
				}
			},

			onDragStart: function(data) {
				if (state.isAnimating) return;

				state.isDragging = true;
				state.dragStartX = data.x;
				state.dragCurrentX = data.x;
				state.dragStartIndex = state.currentIndex;

				// Remove transition during drag for instant feedback
				state.track.style({ transition: 'none' });

				// Add dragging class for styling
				self.container.classAdd('carousel--dragging');

				if (P) {
					P.emit('funky:carousel:drag:start', {
						carousel: self,
						x: data.x
					});
				}

				if (typeof config.onDragStart === 'function') {
					config.onDragStart();
				}
			},

			onDragMove: function(data) {
				if (!state.isDragging) return;

				state.dragCurrentX = data.x;

				// Calculate new track position
				var gapValue = typeof config.gap === 'number' ? config.gap : parseInt(config.gap, 10) || 0;
				var baseOffset = state.dragStartIndex * (state.slideWidth + gapValue);
				var dragOffset = data.deltaX;

				// Apply resistance at edges if not infinite
				var newOffset = baseOffset - dragOffset;
				var maxOffset = (state.slideCount - config.slidesToShow) * (state.slideWidth + gapValue);

				if (newOffset < 0) {
					// Resistance at start
					dragOffset = dragOffset * config.edgeResistance;
				} else if (newOffset > maxOffset) {
					// Resistance at end
					var overscroll = newOffset - maxOffset;
					dragOffset = data.deltaX - (overscroll * (1 - config.edgeResistance));
				}

				var newPosition = baseOffset - dragOffset;
				state.track.style({
					transform: 'translateX(-' + newPosition + 'px)'
				});

				if (P) {
					P.emit('funky:carousel:drag', {
						carousel: self,
						deltaX: data.deltaX,
						direction: data.deltaX > 0 ? 'right' : 'left'
					});
				}
			},

			onDragEnd: function(data) {
				if (!state.isDragging) return;

				state.isDragging = false;
				self.container.classRemove('carousel--dragging');

				// Restore transition
				state.track.style({
					transition: 'transform ' + config.speed + 'ms ' + config.easing
				});

				// Determine target slide based on drag distance and velocity
				var gapValue = typeof config.gap === 'number' ? config.gap : parseInt(config.gap, 10) || 0;
				var slideUnit = state.slideWidth + gapValue;
				var dragDistance = data.deltaX;

				// Calculate how many slides to move
				var slidesMoved = 0;

				// Snap based on distance (30% threshold)
				if (Math.abs(dragDistance) > slideUnit * 0.3) {
					slidesMoved = dragDistance > 0 ? -1 : 1;
				}

				var targetIndex = state.dragStartIndex + slidesMoved;

				// Clamp to valid range
				var maxIndex = state.slideCount - config.slidesToShow;
				if (maxIndex < 0) maxIndex = 0;

				targetIndex = Math.max(0, Math.min(targetIndex, maxIndex));

				self.goTo(targetIndex, true);

				if (P) {
					P.emit('funky:carousel:drag:end', {
						carousel: self,
						fromIndex: state.dragStartIndex,
						toIndex: targetIndex
					});
				}

				if (typeof config.onDragEnd === 'function') {
					config.onDragEnd(state.dragStartIndex, targetIndex);
				}
			}
		});

		// Set touch-action CSS for better touch handling
		state.viewport.style({ touchAction: 'pan-y pinch-zoom' });
	};

	/**
	 * Fallback touch handling without GestureTracker
	 * @private
	 */
	FunkyCarousel.prototype._initTouchFallback = function() {
		var self = this;
		var state = this.state;
		var startX = 0;

		this._touchStartHandler = function(e) {
			startX = e.touches[0].clientX;
		};

		this._touchEndHandler = function(e) {
			var endX = e.changedTouches[0].clientX;
			var diff = startX - endX;

			if (Math.abs(diff) > self.config.swipeThreshold) {
				if (diff > 0) {
					self.next();
				} else {
					self.prev();
				}
			}
		};

		state.viewport.el.addEventListener('touchstart', this._touchStartHandler, { passive: true });
		state.viewport.el.addEventListener('touchend', this._touchEndHandler, { passive: true });
	};

	/**
	 * Destroy touch handling
	 * @private
	 */
	FunkyCarousel.prototype._destroyTouchHandler = function() {
		var state = this.state;

		if (state.gestureTracker) {
			state.gestureTracker.destroy();
			state.gestureTracker = null;
		}

		// Fallback cleanup
		if (this._touchStartHandler && state.viewport && state.viewport.el) {
			state.viewport.el.removeEventListener('touchstart', this._touchStartHandler);
			state.viewport.el.removeEventListener('touchend', this._touchEndHandler);
		}
	};

	// =========================================================================
	// Navigation & Indicators (Phase 3)
	// =========================================================================

	/**
	 * Build navigation arrows
	 * @private
	 */
	FunkyCarousel.prototype._buildArrows = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		if (!config.arrows) return;

		// Previous Arrow
		state.prevArrow = D.create('button')
			.classAdd('carousel__arrow', 'carousel__arrow--prev')
			.attr({
				type: 'button',
				'aria-label': 'Previous slide',
				'aria-controls': this.container.attr('id') + '-track'
			});

		// Custom content or default icon
		if (config.arrowPrev) {
			if (typeof config.arrowPrev === 'string') {
				state.prevArrow.html(config.arrowPrev);
			} else {
				state.prevArrow.append(config.arrowPrev);
			}
		} else {
			state.prevArrow.html('<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>');
		}

		state.prevArrow.on('click', function(e) {
			e.preventDefault();
			self.prev();
			if (typeof config.onArrowClick === 'function') {
				config.onArrowClick('prev');
			}
		});

		// Next Arrow
		state.nextArrow = D.create('button')
			.classAdd('carousel__arrow', 'carousel__arrow--next')
			.attr({
				type: 'button',
				'aria-label': 'Next slide',
				'aria-controls': this.container.attr('id') + '-track'
			});

		if (config.arrowNext) {
			if (typeof config.arrowNext === 'string') {
				state.nextArrow.html(config.arrowNext);
			} else {
				state.nextArrow.append(config.arrowNext);
			}
		} else {
			state.nextArrow.html('<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" fill="currentColor"/></svg>');
		}

		state.nextArrow.on('click', function(e) {
			e.preventDefault();
			self.next();
			if (typeof config.onArrowClick === 'function') {
				config.onArrowClick('next');
			}
		});

		// Append to container or viewport
		if (config.arrowsInside) {
			this.container.classAdd('carousel--arrows-inside');
			state.viewport.append(state.prevArrow).append(state.nextArrow);
		} else {
			this.container.append(state.prevArrow).append(state.nextArrow);
		}

		// Update arrow states
		this._updateArrows();
	};

	/**
	 * Update arrow disabled states
	 * @private
	 */
	FunkyCarousel.prototype._updateArrows = function() {
		var config = this.config;
		var state = this.state;
		var effectiveSlidesToShow = this._getEffectiveSlidesToShow();

		if (!config.arrows || !state.prevArrow) return;

		// In infinite mode, arrows are never disabled
		if (config.infinite) {
			state.prevArrow.attr('disabled', null).classRemove('carousel__arrow--disabled');
			state.nextArrow.attr('disabled', null).classRemove('carousel__arrow--disabled');
			return;
		}

		// Calculate max index based on mode
		var maxIndex;
		if (config.centerMode || config.fullWidthSlides) {
			maxIndex = state.slideCount - 1;
		} else {
			maxIndex = state.slideCount - effectiveSlidesToShow;
			if (maxIndex < 0) maxIndex = 0;
		}

		// Previous disabled at start
		if (state.currentIndex <= 0) {
			state.prevArrow.attr('disabled', 'disabled').classAdd('carousel__arrow--disabled');
		} else {
			state.prevArrow.attr('disabled', null).classRemove('carousel__arrow--disabled');
		}

		// Next disabled at end
		if (state.currentIndex >= maxIndex) {
			state.nextArrow.attr('disabled', 'disabled').classAdd('carousel__arrow--disabled');
		} else {
			state.nextArrow.attr('disabled', null).classRemove('carousel__arrow--disabled');
		}
	};

	/**
	 * Build dot indicators
	 * @private
	 */
	FunkyCarousel.prototype._buildDots = function() {
		var self = this;
		var config = this.config;
		var state = this.state;
		var effectiveSlidesToShow = this._getEffectiveSlidesToShow();

		if (!config.dots) return;

		// Calculate dot count
		var dotsCount;
		if (config.centerMode || config.infinite || config.fullWidthSlides) {
			// Center mode, infinite mode, and full width slides: 1 dot per slide
			dotsCount = state.slideCount;
		} else if (config.slidesToScroll > 1) {
			dotsCount = Math.ceil(state.slideCount / config.slidesToScroll);
		} else {
			dotsCount = state.slideCount - effectiveSlidesToShow + 1;
		}

		if (dotsCount <= 1) return;

		state.dotsContainer = D.create('div')
			.classAdd('carousel__dots')
			.attr({ role: 'tablist', 'aria-label': 'Slide navigation' });

		if (config.dotsPosition === 'top') {
			state.dotsContainer.classAdd('carousel__dots--top');
		}

		state.dots = [];

		for (var i = 0; i < dotsCount; i++) {
			var dot = D.create('button')
				.classAdd('carousel__dot')
				.attr({
					type: 'button',
					role: 'tab',
					'aria-label': 'Go to slide ' + (i + 1),
					'aria-selected': i === 0 ? 'true' : 'false',
					tabindex: i === 0 ? '0' : '-1'
				})
				.data('index', i);

			(function(dotIndex) {
				dot.on('click', function(e) {
					e.preventDefault();
					var targetIndex;
					if (config.centerMode || config.infinite || config.fullWidthSlides) {
						// Direct mapping: dot index = slide index
						targetIndex = dotIndex;
					} else if (config.slidesToScroll > 1) {
						targetIndex = dotIndex * config.slidesToScroll;
					} else {
						targetIndex = dotIndex;
					}
					self.goTo(targetIndex, true);
				});
			})(i);

			state.dots.push(dot);
			state.dotsContainer.append(dot);
		}

		// Add keyboard navigation for dots (WCAG 2.1 tablist pattern)
		state.dotsContainer.on('keydown', function(e) {
			var currentDot = state.dots.findIndex(function(d) {
				return d.el === document.activeElement;
			});
			if (currentDot === -1) return;

			var targetDot = -1;
			var handled = false;

			switch (e.key) {
				case 'ArrowRight':
				case 'ArrowDown':
					targetDot = (currentDot + 1) % state.dots.length;
					handled = true;
					break;
				case 'ArrowLeft':
				case 'ArrowUp':
					targetDot = currentDot === 0 ? state.dots.length - 1 : currentDot - 1;
					handled = true;
					break;
				case 'Home':
					targetDot = 0;
					handled = true;
					break;
				case 'End':
					targetDot = state.dots.length - 1;
					handled = true;
					break;
			}

			if (handled && targetDot !== -1) {
				e.preventDefault();
				// Move focus and activate the dot
				state.dots[targetDot].el.focus();
				state.dots[targetDot].el.click();
			}
		});

		// Append based on position
		if (config.dotsPosition === 'outside') {
			this.container.parent().append(state.dotsContainer);
		} else {
			this.container.append(state.dotsContainer);
		}

		this._updateDots();
	};

	/**
	 * Update active dot
	 * @private
	 */
	FunkyCarousel.prototype._updateDots = function() {
		var config = this.config;
		var state = this.state;

		if (!config.dots || !state.dots.length) return;

		var activeDotIndex;
		if (config.centerMode || config.infinite || config.fullWidthSlides) {
			// In center/infinite/fullWidthSlides mode, each dot maps to a slide directly
			// Use modulo to handle wrap-around for infinite mode
			activeDotIndex = state.currentIndex;
			if (activeDotIndex < 0) {
				activeDotIndex = state.slideCount + activeDotIndex;
			} else if (activeDotIndex >= state.slideCount) {
				activeDotIndex = activeDotIndex % state.slideCount;
			}
		} else if (config.slidesToScroll > 1) {
			activeDotIndex = Math.floor(state.currentIndex / config.slidesToScroll);
		} else {
			activeDotIndex = state.currentIndex;
		}

		state.dots.forEach(function(dot, i) {
			if (i === activeDotIndex) {
				dot.classAdd('carousel__dot--active')
					.attr({ 'aria-selected': 'true', tabindex: '0' });
			} else {
				dot.classRemove('carousel__dot--active')
					.attr({ 'aria-selected': 'false', tabindex: '-1' });
			}
		});
	};

	/**
	 * Update all navigation states
	 * @private
	 */
	FunkyCarousel.prototype._updateNavigation = function() {
		this._updateArrows();
		this._updateDots();
	};

	/**
	 * Destroy navigation elements
	 * @private
	 */
	FunkyCarousel.prototype._destroyNavigation = function() {
		var state = this.state;

		if (state.prevArrow) state.prevArrow.remove();
		if (state.nextArrow) state.nextArrow.remove();
		if (state.dotsContainer) state.dotsContainer.remove();
		state.dots = [];
	};

	// =========================================================================
	// Keyboard Navigation (Phase 3)
	// =========================================================================

	/**
	 * Initialize keyboard handling
	 * @private
	 */
	FunkyCarousel.prototype._initKeyboard = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		if (!config.keyboard) return;

		this._keydownHandler = function(e) {
			// Don't handle if user is typing in an input
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

			// For scoped mode, check if carousel contains focus
			if (config.keyboardScope === 'focused') {
				if (!self.container.el.contains(document.activeElement) &&
					document.activeElement !== self.container.el) {
					return;
				}
			}

			switch (e.key) {
				case 'ArrowLeft':
					e.preventDefault();
					self.prev();
					if (P) {
						P.emit('funky:carousel:keyboard', { key: 'left', carousel: self });
					}
					break;

				case 'ArrowRight':
					e.preventDefault();
					self.next();
					if (P) {
						P.emit('funky:carousel:keyboard', { key: 'right', carousel: self });
					}
					break;

				case 'Home':
					e.preventDefault();
					self.goTo(0, true);
					if (P) {
						P.emit('funky:carousel:keyboard', { key: 'home', carousel: self });
					}
					break;

				case 'End':
					e.preventDefault();
					var lastIndex = state.slideCount - config.slidesToShow;
					if (lastIndex < 0) lastIndex = 0;
					self.goTo(lastIndex, true);
					if (P) {
						P.emit('funky:carousel:keyboard', { key: 'end', carousel: self });
					}
					break;
			}
		};

		if (config.keyboardScope === 'always') {
			document.addEventListener('keydown', this._keydownHandler);
		} else {
			// Only when carousel or its children are focused
			this.container.attr('tabindex', '0');
			this.container.on('keydown', this._keydownHandler);
		}
	};

	/**
	 * Destroy keyboard handling
	 * @private
	 */
	FunkyCarousel.prototype._destroyKeyboard = function() {
		if (!this._keydownHandler) return;

		if (this.config.keyboardScope === 'always') {
			document.removeEventListener('keydown', this._keydownHandler);
		} else {
			this.container.off('keydown', this._keydownHandler);
		}
	};

	// =========================================================================
	// Autoplay (Phase 4)
	// =========================================================================

	/**
	 * Initialize autoplay functionality
	 * @private
	 */
	FunkyCarousel.prototype._initAutoplay = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		// Check reduced motion preference
		if (config.respectReducedMotion) {
			state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

			this._reducedMotionHandler = function(e) {
				state.reducedMotion = e.matches;
				if (state.reducedMotion && config.autoplay) {
					self._stopAutoplay();
				}
			};

			window.matchMedia('(prefers-reduced-motion: reduce)')
				.addEventListener('change', this._reducedMotionHandler);
		}

		// Pause on hover
		if (config.pauseOnHover) {
			this._mouseenterHandler = function() {
				if (!state.autoplayManuallyPaused) {
					self._pauseAutoplay('hover');
				}
			};

			this._mouseleaveHandler = function() {
				if (!state.autoplayManuallyPaused) {
					self._resumeAutoplay('hover');
				}
			};

			this.container.on('mouseenter', this._mouseenterHandler);
			this.container.on('mouseleave', this._mouseleaveHandler);
		}

		// Pause on focus
		if (config.pauseOnFocus) {
			this._focusinHandler = function() {
				if (!state.autoplayManuallyPaused) {
					self._pauseAutoplay('focus');
				}
			};

			this._focusoutHandler = function(e) {
				// Only resume if focus left the carousel entirely
				if (!self.container.el.contains(e.relatedTarget) && !state.autoplayManuallyPaused) {
					self._resumeAutoplay('focus');
				}
			};

			this.container.on('focusin', this._focusinHandler);
			this.container.on('focusout', this._focusoutHandler);
		}

		// Visibility API - pause when tab hidden
		this._visibilityHandler = function() {
			if (document.hidden) {
				self._pauseAutoplay('visibility');
			} else if (!state.autoplayManuallyPaused) {
				self._resumeAutoplay('visibility');
			}
		};
		document.addEventListener('visibilitychange', this._visibilityHandler);

		// Build play button if needed
		if (config.showPlayButton) {
			this._buildPlayButton();
		}

		// Build progress bar if needed
		if (config.showProgress) {
			this._buildProgressBar();
		}

		// Start autoplay if enabled and not reduced motion
		if (config.autoplay && !state.reducedMotion) {
			this._startAutoplay();
		}
	};

	/**
	 * Start autoplay
	 * @private
	 */
	FunkyCarousel.prototype._startAutoplay = function() {
		var self = this;
		var state = this.state;
		var config = this.config;

		if (state.autoplayTimer) return;
		if (state.reducedMotion && config.respectReducedMotion) return;

		state.autoplayPaused = false;
		state.autoplayManuallyPaused = false;

		state.autoplayTimer = setInterval(function() {
			if (!state.autoplayPaused) {
				self.next();
			}
		}, config.autoplaySpeed);

		this._updatePlayButton(true);
		this._startProgress();

		this.container.classAdd('carousel--autoplay');

		if (P) {
			P.emit('funky:carousel:autoplay:start', { carousel: this });
		}

		if (typeof config.onAutoplayStart === 'function') {
			config.onAutoplayStart();
		}
	};

	/**
	 * Stop autoplay completely
	 * @private
	 */
	FunkyCarousel.prototype._stopAutoplay = function() {
		var state = this.state;
		var config = this.config;

		if (state.autoplayTimer) {
			clearInterval(state.autoplayTimer);
			state.autoplayTimer = null;
		}

		state.autoplayManuallyPaused = true;
		state.autoplayPaused = true;

		this._updatePlayButton(false);
		this._stopProgress();

		this.container.classRemove('carousel--autoplay');

		if (P) {
			P.emit('funky:carousel:autoplay:stop', { carousel: this });
		}

		if (typeof config.onAutoplayStop === 'function') {
			config.onAutoplayStop();
		}
	};

	/**
	 * Pause autoplay temporarily
	 * @param {string} reason - Why paused (hover, focus, visibility, interaction)
	 * @private
	 */
	FunkyCarousel.prototype._pauseAutoplay = function(reason) {
		var state = this.state;
		var config = this.config;

		state.autoplayPaused = true;
		this._pauseProgress();

		if (P) {
			P.emit('funky:carousel:autoplay:pause', { carousel: this, reason: reason });
		}

		if (typeof config.onAutoplayPause === 'function') {
			config.onAutoplayPause(reason);
		}
	};

	/**
	 * Resume from pause
	 * @param {string} reason - Why resuming
	 * @private
	 */
	FunkyCarousel.prototype._resumeAutoplay = function(reason) {
		var state = this.state;
		var config = this.config;

		if (!state.autoplayTimer) return;

		state.autoplayPaused = false;
		this._resumeProgress();

		if (P) {
			P.emit('funky:carousel:autoplay:resume', { carousel: this, reason: reason });
		}

		if (typeof config.onAutoplayResume === 'function') {
			config.onAutoplayResume(reason);
		}
	};

	/**
	 * Toggle autoplay on/off
	 * @private
	 */
	FunkyCarousel.prototype._toggleAutoplay = function() {
		var state = this.state;

		if (state.autoplayTimer && !state.autoplayManuallyPaused) {
			this._stopAutoplay();
		} else {
			state.autoplayManuallyPaused = false;
			this._startAutoplay();
		}
	};

	/**
	 * Build play/pause button
	 * @private
	 */
	FunkyCarousel.prototype._buildPlayButton = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		state.playButton = D.create('button')
			.classAdd('carousel__play-button')
			.attr({
				type: 'button',
				'aria-label': config.autoplay ? 'Pause autoplay' : 'Start autoplay',
				'aria-pressed': config.autoplay ? 'true' : 'false'
			})
			.html(config.autoplay ? this._getPauseIcon() : this._getPlayIcon());

		state.playButton.on('click', function(e) {
			e.preventDefault();
			self._toggleAutoplay();
		});

		this.container.append(state.playButton);
	};

	/**
	 * Update play button state
	 * @param {boolean} isPlaying
	 * @private
	 */
	FunkyCarousel.prototype._updatePlayButton = function(isPlaying) {
		var state = this.state;

		if (!state.playButton) return;

		state.playButton.attr({
			'aria-label': isPlaying ? 'Pause autoplay' : 'Start autoplay',
			'aria-pressed': isPlaying ? 'true' : 'false'
		}).html(isPlaying ? this._getPauseIcon() : this._getPlayIcon());
	};

	/**
	 * Get play icon SVG
	 * @returns {string}
	 * @private
	 */
	FunkyCarousel.prototype._getPlayIcon = function() {
		return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
	};

	/**
	 * Get pause icon SVG
	 * @returns {string}
	 * @private
	 */
	FunkyCarousel.prototype._getPauseIcon = function() {
		return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';
	};

	/**
	 * Build progress bar
	 * @private
	 */
	FunkyCarousel.prototype._buildProgressBar = function() {
		var state = this.state;

		state.progressBar = D.create('div')
			.classAdd('carousel__progress')
			.attr({ role: 'progressbar', 'aria-valuenow': '0', 'aria-valuemin': '0', 'aria-valuemax': '100' });

		var progressFill = D.create('div').classAdd('carousel__progress-fill');
		state.progressBar.append(progressFill);
		this.container.append(state.progressBar);
	};

	/**
	 * Start progress animation
	 * @private
	 */
	FunkyCarousel.prototype._startProgress = function() {
		var state = this.state;
		var config = this.config;

		if (!state.progressBar) return;

		var fill = state.progressBar.one('.carousel__progress-fill');
		if (!fill) return;

		// Reset and start
		fill.style({
			width: '0%',
			transition: 'none'
		});

		// Force reflow
		fill.el.offsetHeight;

		fill.style({
			width: '100%',
			transition: 'width ' + config.autoplaySpeed + 'ms linear'
		});
	};

	/**
	 * Pause progress animation
	 * @private
	 */
	FunkyCarousel.prototype._pauseProgress = function() {
		var state = this.state;

		if (!state.progressBar) return;

		var fill = state.progressBar.one('.carousel__progress-fill');
		if (!fill) return;

		// Get current width and freeze
		var computed = window.getComputedStyle(fill.el);
		fill.style({
			width: computed.width,
			transition: 'none'
		});
	};

	/**
	 * Resume progress animation
	 * @private
	 */
	FunkyCarousel.prototype._resumeProgress = function() {
		var state = this.state;
		var config = this.config;

		if (!state.progressBar) return;

		var fill = state.progressBar.one('.carousel__progress-fill');
		if (!fill) return;

		var computed = window.getComputedStyle(fill.el);
		var currentWidth = parseFloat(computed.width);
		var totalWidth = state.progressBar.el.offsetWidth;
		var remaining = (1 - currentWidth / totalWidth) * config.autoplaySpeed;

		fill.style({
			width: '100%',
			transition: 'width ' + remaining + 'ms linear'
		});
	};

	/**
	 * Stop and reset progress
	 * @private
	 */
	FunkyCarousel.prototype._stopProgress = function() {
		var state = this.state;

		if (!state.progressBar) return;

		var fill = state.progressBar.one('.carousel__progress-fill');
		if (fill) {
			fill.style({ width: '0%', transition: 'none' });
		}
	};

	/**
	 * Reset progress (called when slide changes)
	 * @private
	 */
	FunkyCarousel.prototype._resetProgress = function() {
		var config = this.config;
		var state = this.state;

		if (config.autoplay && !state.autoplayPaused) {
			this._startProgress();
		}
	};

	/**
	 * Destroy autoplay functionality
	 * @private
	 */
	FunkyCarousel.prototype._destroyAutoplay = function() {
		var state = this.state;

		if (state.autoplayTimer) {
			clearInterval(state.autoplayTimer);
			state.autoplayTimer = null;
		}

		// Remove event listeners
		if (this._reducedMotionHandler) {
			window.matchMedia('(prefers-reduced-motion: reduce)')
				.removeEventListener('change', this._reducedMotionHandler);
		}

		if (this._visibilityHandler) {
			document.removeEventListener('visibilitychange', this._visibilityHandler);
		}

		if (this._mouseenterHandler) {
			this.container.off('mouseenter', this._mouseenterHandler);
			this.container.off('mouseleave', this._mouseleaveHandler);
		}

		if (this._focusinHandler) {
			this.container.off('focusin', this._focusinHandler);
			this.container.off('focusout', this._focusoutHandler);
		}

		// Remove DOM elements
		if (state.playButton) state.playButton.remove();
		if (state.progressBar) state.progressBar.remove();
	};

	// =========================================================================
	// Responsive Breakpoints (Phase 5)
	// =========================================================================

	/**
	 * Initialize responsive breakpoints
	 * @private
	 */
	FunkyCarousel.prototype._initResponsive = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		if (!config.responsive || !config.responsive.length) return;

		// Store original config
		state.originalConfig = {};
		for (var key in config) {
			if (config.hasOwnProperty(key)) {
				state.originalConfig[key] = config[key];
			}
		}

		// Sort breakpoints by max-width ascending (smallest first)
		// This way we check the most specific (smallest) breakpoint first
		config.responsive.sort(function(a, b) {
			return (a.breakpoint || 0) - (b.breakpoint || 0);
		});

		// Create media query listeners
		config.responsive.forEach(function(bp, index) {
			var mq = window.matchMedia('(max-width: ' + bp.breakpoint + 'px)');

			var handler = function() {
				self._checkBreakpoint();
			};

			mq.addEventListener('change', handler);
			state.mediaQueries.push({ mq: mq, settings: bp.settings, handler: handler });
		});

		// Initial check
		this._checkBreakpoint();
	};

	/**
	 * Check and apply appropriate breakpoint
	 * @private
	 */
	FunkyCarousel.prototype._checkBreakpoint = function() {
		var config = this.config;
		var state = this.state;
		var newBreakpoint = null;
		var newSettings = null;

		// Find first matching breakpoint
		for (var i = 0; i < state.mediaQueries.length; i++) {
			if (state.mediaQueries[i].mq.matches) {
				newBreakpoint = config.responsive[i].breakpoint;
				newSettings = state.mediaQueries[i].settings;
				break;
			}
		}

		if (newBreakpoint !== state.currentBreakpoint) {
			state.currentBreakpoint = newBreakpoint;
			this._applyBreakpoint(newSettings);
		}
	};

	/**
	 * Apply breakpoint settings
	 * @param {Object} settings - Override settings or null for original
	 * @private
	 */
	FunkyCarousel.prototype._applyBreakpoint = function(settings) {
		var config = this.config;
		var state = this.state;

		// Check if rebuild is needed
		var oldSlidesToShow = config.slidesToShow;
		var oldCenterMode = config.centerMode;

		// Start with original config
		for (var key in state.originalConfig) {
			if (state.originalConfig.hasOwnProperty(key) && key !== 'responsive') {
				config[key] = state.originalConfig[key];
			}
		}

		// Merge breakpoint settings
		if (settings) {
			for (var k in settings) {
				if (settings.hasOwnProperty(k)) {
					config[k] = settings[k];
				}
			}
		}

		var needsRebuild = (
			config.slidesToShow !== oldSlidesToShow ||
			config.centerMode !== oldCenterMode
		);

		if (needsRebuild) {
			// Rebuild navigation (dots count may change)
			this._destroyNavigation();
			this._buildArrows();
			this._buildDots();

			// Recalculate dimensions
			this._calculateDimensions();

			// Ensure valid index
			var maxIndex = state.slideCount - config.slidesToShow;
			if (maxIndex < 0) maxIndex = 0;
			if (state.currentIndex > maxIndex) {
				this.goTo(maxIndex, false);
			} else {
				this._updatePosition(false);
			}

			// Update center mode
			this._updateCenterSlide();
		}

		if (P) {
			P.emit('funky:carousel:breakpoint', {
				carousel: this,
				breakpoint: state.currentBreakpoint,
				settings: settings
			});
		}

		if (typeof config.onBreakpoint === 'function') {
			config.onBreakpoint(state.currentBreakpoint);
		}
	};

	/**
	 * Destroy responsive handling
	 * @private
	 */
	FunkyCarousel.prototype._destroyResponsive = function() {
		var state = this.state;

		state.mediaQueries.forEach(function(item) {
			item.mq.removeEventListener('change', item.handler);
		});
		state.mediaQueries = [];
	};

	// =========================================================================
	// Center Mode (Phase 5)
	// =========================================================================

	/**
	 * Initialize center mode
	 * @private
	 */
	FunkyCarousel.prototype._initCenterMode = function() {
		var config = this.config;
		var state = this.state;

		if (!config.centerMode) return;

		// centerMode is redundant when fullWidthSlides is enabled
		if (config.fullWidthSlides) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('[Funky.Carousel] centerMode is ignored when fullWidthSlides is enabled - slides already fill 100% of viewport');
			}
			return;
		}

		this.container.classAdd('carousel--center');

		state.viewport.style({
			padding: '0 ' + config.centerPadding
		});

		this._updateCenterSlide();
	};

	/**
	 * Update center slide class
	 * @private
	 */
	FunkyCarousel.prototype._updateCenterSlide = function() {
		var config = this.config;
		var state = this.state;

		if (!config.centerMode) return;

		// In center mode with new positioning, currentIndex IS the centered slide
		var centerIndex = state.currentIndex;

		state.slides.forEach(function(slide, i) {
			if (i === centerIndex) {
				slide.classAdd('carousel__slide--center');
			} else {
				slide.classRemove('carousel__slide--center');
			}
		});
	};

	// =========================================================================
	// Infinite Loop (Phase 5)
	// =========================================================================

	/**
	 * Initialize infinite loop mode
	 * @private
	 */
	FunkyCarousel.prototype._initInfiniteLoop = function() {
		var config = this.config;
		var state = this.state;

		if (!config.infinite) return;

		// Use effective slides to show for fullWidthSlides mode
		var effectiveSlidesToShow = this._getEffectiveSlidesToShow();
		var cloneCount = effectiveSlidesToShow + 1;

		// Clone slides at end to prepend
		for (var i = state.slideCount - cloneCount; i < state.slideCount; i++) {
			if (i >= 0 && state.slides[i]) {
				var clone = state.slides[i].el.cloneNode(true);
				var wrappedClone = D.wrap(clone);
				wrappedClone.classAdd('carousel__slide--clone');
				wrappedClone.attr('aria-hidden', 'true');
				state.clonesBefore.push(wrappedClone);
			}
		}

		// Clone slides at start to append
		for (var j = 0; j < cloneCount; j++) {
			if (j < state.slideCount && state.slides[j]) {
				var clone = state.slides[j].el.cloneNode(true);
				var wrappedClone = D.wrap(clone);
				wrappedClone.classAdd('carousel__slide--clone');
				wrappedClone.attr('aria-hidden', 'true');
				state.clonesAfter.push(wrappedClone);
			}
		}

		// Insert clones
		state.clonesBefore.forEach(function(clone) {
			state.track.el.insertBefore(clone.el, state.track.el.firstChild);
		});

		state.clonesAfter.forEach(function(clone) {
			state.track.append(clone);
		});

		this.container.classAdd('carousel--infinite');

		// Adjust initial position
		this._adjustInfinitePosition(false);
	};

	/**
	 * Adjust track position for infinite clones
	 * @param {boolean} animate - Whether to animate
	 * @private
	 */
	FunkyCarousel.prototype._adjustInfinitePosition = function(animate) {
		var config = this.config;
		var state = this.state;

		if (!config.infinite) return;

		// In fullscreen or fullWidthSlides mode, no gap
		var gapValue = (state.isFullscreen || config.fullWidthSlides) ? 0 : 
			(typeof config.gap === 'number' ? config.gap : parseInt(config.gap, 10) || 0);
		var slideWidthWithGap = state.slideWidth + gapValue;
		var cloneOffset = state.clonesBefore.length * slideWidthWithGap;
		var currentOffset = state.currentIndex * slideWidthWithGap;
		var totalOffset = cloneOffset + currentOffset;
		
		// In center mode (but not fullWidthSlides/fullscreen), adjust to center the target slide
		if (config.centerMode && !state.isFullscreen && !config.fullWidthSlides) {
			var viewportWidth = state.viewport.el.offsetWidth;
			var centerOffset = (viewportWidth - state.slideWidth) / 2;
			totalOffset = totalOffset - centerOffset;
		}

		var speed = animate ? config.speed : 0;

		state.track.style({
			transition: speed ? 'transform ' + speed + 'ms ' + config.easing : 'none',
			transform: 'translateX(-' + totalOffset + 'px)'
		});
	};

	/**
	 * Handle wrap-around for infinite mode
	 * @param {number} index - Target index
	 * @returns {number} - Adjusted index
	 * @private
	 */
	FunkyCarousel.prototype._handleInfiniteWrap = function(index) {
		var self = this;
		var config = this.config;
		var state = this.state;
		var effectiveSlidesToShow = this._getEffectiveSlidesToShow();

		if (!config.infinite) return index;

		// In center mode, fullWidthSlides, or infinite mode, maxIndex is slideCount - 1
		var maxIndex = (config.centerMode || config.fullWidthSlides) ? state.slideCount - 1 : state.slideCount - effectiveSlidesToShow;
		if (maxIndex < 0) maxIndex = 0;

		// Wrapped past start - jump to end
		if (index < 0) {
			setTimeout(function() {
				state.track.style({ transition: 'none' });
				state.currentIndex = maxIndex;
				self._adjustInfinitePosition(false);
				state.track.el.offsetHeight; // Force reflow
			}, config.speed);
			return 0;
		}

		// Wrapped past end - jump to start
		if (index > maxIndex) {
			setTimeout(function() {
				state.track.style({ transition: 'none' });
				state.currentIndex = 0;
				self._adjustInfinitePosition(false);
				state.track.el.offsetHeight;
			}, config.speed);
			return maxIndex;
		}

		return index;
	};

	/**
	 * Destroy infinite loop clones
	 * @private
	 */
	FunkyCarousel.prototype._destroyInfiniteLoop = function() {
		var state = this.state;

		state.clonesBefore.forEach(function(clone) { clone.remove(); });
		state.clonesAfter.forEach(function(clone) { clone.remove(); });
		state.clonesBefore = [];
		state.clonesAfter = [];

		this.container.classRemove('carousel--infinite');
	};

	// =========================================================================
	// Lazy Loading (Phase 5)
	// =========================================================================

	/**
	 * Initialize lazy loading
	 * @private
	 */
	FunkyCarousel.prototype._initLazyLoad = function() {
		var config = this.config;
		var state = this.state;

		if (!config.lazyLoad) return;

		// Set up lazy load attributes
		state.slides.forEach(function(slide) {
			var images = slide.find('img[data-src]');
			if (images && images.length) {
				slide.classAdd('carousel__slide--lazy');
			}
		});

		// Load initial slides
		this._loadVisibleSlides();
	};

	/**
	 * Load images for visible slides
	 * @private
	 */
	FunkyCarousel.prototype._loadVisibleSlides = function() {
		var config = this.config;
		var state = this.state;

		var start = state.currentIndex;
		var end = state.currentIndex + config.slidesToShow + config.lazyLoadAhead;

		// Also load previous slides for infinite mode
		if (config.infinite) {
			start = state.currentIndex - config.lazyLoadAhead;
		}

		for (var i = start; i <= end; i++) {
			var index = i;

			// Wrap for infinite
			if (config.infinite) {
				index = ((i % state.slideCount) + state.slideCount) % state.slideCount;
			}

			if (index >= 0 && index < state.slideCount) {
				this._loadSlide(index);
			}
		}
	};

	/**
	 * Load images in a specific slide
	 * @param {number} index - Slide index
	 * @private
	 */
	FunkyCarousel.prototype._loadSlide = function(index) {
		var self = this;
		var config = this.config;
		var state = this.state;

		if (state.lazyLoadedSlides[index]) return;

		var slide = state.slides[index];
		if (!slide) return;

		// Ensure slide is a FunkyElement with .find() method
		if (typeof slide.find !== 'function') {
			// If it's a raw DOM element, wrap it
			if (slide.nodeType === 1) {
				slide = D.wrap(slide);
				state.slides[index] = slide;
			} else if (slide.el && slide.el.nodeType === 1) {
				// Already wrapped but missing method - skip lazy loading
				state.lazyLoadedSlides[index] = true;
				return;
			} else {
				state.lazyLoadedSlides[index] = true;
				return;
			}
		}

		var images = slide.find('img[data-src]');
		if (!images || !images.length) {
			state.lazyLoadedSlides[index] = true;
			return;
		}

		images.forEach(function(img) {
			var src = img.attr('data-src');
			var srcset = img.attr('data-srcset');

			if (src) {
				var loader = new Image();

				loader.onload = function() {
					img.attr('src', src);
					if (srcset) img.attr('srcset', srcset);

					img.classAdd('carousel__image--loaded');
					slide.classRemove('carousel__slide--lazy');
					slide.classAdd('carousel__slide--loaded');

					if (P) {
						P.emit('funky:carousel:lazyload', {
							carousel: self,
							slide: index,
							image: img.el
						});
					}

					if (typeof config.onLazyLoad === 'function') {
						config.onLazyLoad(slide.el, img.el);
					}
				};

				loader.onerror = function() {
					img.classAdd('carousel__image--error');
				};

				loader.src = src;
			}
		});

		state.lazyLoadedSlides[index] = true;
	};

	// =========================================================================
	// Fullscreen (Phase 5)
	// =========================================================================

	/**
	 * Initialize fullscreen support
	 * @private
	 */
	FunkyCarousel.prototype._initFullscreen = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		if (!config.fullscreen) return;

		// Check if fullscreen is supported
		if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) {
			return;
		}

		// Build button
		state.fullscreenButton = D.create('button')
			.classAdd('carousel__fullscreen-button')
			.attr({
				type: 'button',
				'aria-label': 'Enter fullscreen'
			})
			.html('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg>');

		state.fullscreenButton.on('click', function(e) {
			e.preventDefault();
			self._toggleFullscreen();
		});

		this.container.append(state.fullscreenButton);

		// Listen for fullscreen changes
		this._fullscreenChangeHandler = function() {
			self._onFullscreenChange();
		};

		document.addEventListener('fullscreenchange', this._fullscreenChangeHandler);
		document.addEventListener('webkitfullscreenchange', this._fullscreenChangeHandler);
	};

	/**
	 * Toggle fullscreen mode
	 * @private
	 */
	FunkyCarousel.prototype._toggleFullscreen = function() {
		var state = this.state;

		if (state.isFullscreen) {
			this._exitFullscreen();
		} else {
			this._enterFullscreen();
		}
	};

	/**
	 * Enter fullscreen mode
	 * @private
	 */
	FunkyCarousel.prototype._enterFullscreen = function() {
		var el = this.container.el;

		if (el.requestFullscreen) {
			el.requestFullscreen();
		} else if (el.webkitRequestFullscreen) {
			el.webkitRequestFullscreen();
		}
	};

	/**
	 * Exit fullscreen mode
	 * @private
	 */
	FunkyCarousel.prototype._exitFullscreen = function() {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	};

	/**
	 * Handle fullscreen change event
	 * @private
	 */
	FunkyCarousel.prototype._onFullscreenChange = function() {
		var self = this;
		var config = this.config;
		var state = this.state;

		var isNowFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);

		if (isNowFullscreen !== state.isFullscreen) {
			state.isFullscreen = isNowFullscreen;

			if (isNowFullscreen) {
				this.container.classAdd('carousel--fullscreen');
				state.fullscreenButton.attr('aria-label', 'Exit fullscreen')
					.html('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/></svg>');

				// Set up focus management for fullscreen mode
				this._setupFullscreenFocus();
			} else {
				this.container.classRemove('carousel--fullscreen');
				state.fullscreenButton.attr('aria-label', 'Enter fullscreen')
					.html('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg>');

				// Restore focus when exiting fullscreen
				this._cleanupFullscreenFocus();
			}

			// Recalculate dimensions
			this._calculateDimensions();
			this._updatePosition(false);

			if (P) {
				P.emit('funky:carousel:fullscreen', {
					carousel: this,
					isFullscreen: isNowFullscreen
				});
			}

			if (typeof config.onFullscreenChange === 'function') {
				config.onFullscreenChange(isNowFullscreen);
			}
		}
	};

	/**
	 * Set up focus management for fullscreen mode
	 * Traps focus within carousel and stores previous focus for restoration
	 * @private
	 */
	FunkyCarousel.prototype._setupFullscreenFocus = function() {
		var self = this;
		var state = this.state;
		var container = this.container.el;

		// Store trigger element for focus restoration
		state.fullscreenTrigger = document.activeElement;

		// Push to FocusManager if available
		if (Funky.FocusManager && state.fullscreenTrigger && state.fullscreenTrigger !== document.body) {
			// FocusManager will track history
		}

		// Make container focusable if not already
		if (!container.hasAttribute('tabindex')) {
			container.setAttribute('tabindex', '-1');
			state.addedTabindex = true;
		}

		// Focus the carousel container or first focusable element
		var focusTarget = container.querySelector('button, [tabindex]:not([tabindex="-1"])') || container;
		if (Funky.FocusManager && Funky.FocusManager.focusAndPush) {
			Funky.FocusManager.focusAndPush(focusTarget, { label: 'Carousel fullscreen' });
		} else {
			focusTarget.focus();
		}

		// Set up focus trap handler
		state.fullscreenFocusTrapHandler = function(e) {
			if (e.key === 'Tab') {
				self._trapFullscreenFocus(e);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				self._exitFullscreen();
			}
		};

		container.addEventListener('keydown', state.fullscreenFocusTrapHandler);

		// Announce to screen readers
		if (Funky.Announce) {
			Funky.Announce.polite('Entered fullscreen mode. Press Escape to exit.');
		}
	};

	/**
	 * Clean up fullscreen focus management and restore previous focus
	 * @private
	 */
	FunkyCarousel.prototype._cleanupFullscreenFocus = function() {
		var state = this.state;
		var container = this.container.el;

		// Remove focus trap handler
		if (state.fullscreenFocusTrapHandler) {
			container.removeEventListener('keydown', state.fullscreenFocusTrapHandler);
			state.fullscreenFocusTrapHandler = null;
		}

		// Remove tabindex if we added it
		if (state.addedTabindex) {
			container.removeAttribute('tabindex');
			state.addedTabindex = false;
		}

		// Restore focus via FocusManager or fallback
		if (Funky.FocusManager && Funky.FocusManager.popFocus) {
			var restored = Funky.FocusManager.popFocus();
			if (!restored && state.fullscreenTrigger && document.body.contains(state.fullscreenTrigger)) {
				try {
					state.fullscreenTrigger.focus();
				} catch (e) {
					// Element may not be focusable
				}
			}
		} else if (state.fullscreenTrigger && document.body.contains(state.fullscreenTrigger)) {
			try {
				state.fullscreenTrigger.focus();
			} catch (e) {
				// Element may not be focusable
			}
		}

		state.fullscreenTrigger = null;

		// Announce to screen readers
		if (Funky.Announce) {
			Funky.Announce.polite('Exited fullscreen mode');
		}
	};

	/**
	 * Trap focus within carousel during fullscreen mode
	 * @private
	 * @param {KeyboardEvent} e
	 */
	FunkyCarousel.prototype._trapFullscreenFocus = function(e) {
		var container = this.container.el;
		var focusableSelectors = 'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]';
		var focusable = container.querySelectorAll(focusableSelectors);

		if (focusable.length === 0) return;

		var first = focusable[0];
		var last = focusable[focusable.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	};

	/**
	 * Destroy fullscreen handling
	 * @private
	 */
	FunkyCarousel.prototype._destroyFullscreen = function() {
		var state = this.state;

		// Clean up focus management if in fullscreen
		if (state.isFullscreen) {
			this._cleanupFullscreenFocus();
		}

		if (state.fullscreenButton) {
			state.fullscreenButton.remove();
		}

		if (this._fullscreenChangeHandler) {
			document.removeEventListener('fullscreenchange', this._fullscreenChangeHandler);
			document.removeEventListener('webkitfullscreenchange', this._fullscreenChangeHandler);
		}
	};

	// =========================================================================
	// Navigation Methods
	// =========================================================================

	/**
	 * Go to a specific slide
	 * @param {number} index - Target slide index
	 * @param {boolean} [animate=true] - Whether to animate
	 */
	FunkyCarousel.prototype.goTo = function(index, animate) {
		var self = this;
		var state = this.state;
		var config = this.config;
		var effectiveSlidesToShow = this._getEffectiveSlidesToShow();

		if (state.isAnimating) return;
		if (animate === undefined) animate = true;

		var previousIndex = state.currentIndex;

		// Calculate max index based on mode
		var maxIndex;
		if (config.centerMode || config.infinite || config.fullWidthSlides) {
			// Center/infinite/fullWidthSlides mode: can navigate to any slide
			maxIndex = state.slideCount - 1;
		} else {
			// Normal mode: limited by how many slides fit
			maxIndex = state.slideCount - effectiveSlidesToShow;
			if (maxIndex < 0) maxIndex = 0;
		}

		// Handle infinite mode wrapping
		if (config.infinite) {
			// Going past end - animate to clone, then jump to start
			if (index > maxIndex) {
				state.currentIndex = index;
				this._animateInfiniteWrap(index, 0, animate);
				return;
			}
			// Going before start - animate to clone, then jump to end
			if (index < 0) {
				state.currentIndex = index;
				this._animateInfiniteWrap(index, maxIndex, animate);
				return;
			}
		} else {
			// Clamp index to valid range for non-infinite mode
			if (index < 0) index = 0;
			if (index > maxIndex) index = maxIndex;
		}

		// No change needed
		if (index === previousIndex) return;

		this._goToIndex(index, previousIndex, animate);
	};

	/**
	 * Internal: Perform the actual slide transition
	 * @private
	 */
	FunkyCarousel.prototype._goToIndex = function(index, previousIndex, animate) {
		var state = this.state;
		var config = this.config;

		// Emit before change
		if (P) {
			P.emit('funky:carousel:beforeChange', {
				carousel: this,
				currentIndex: previousIndex,
				nextIndex: index
			});
		}

		state.currentIndex = index;
		
		// Use infinite-aware position update
		if (config.infinite) {
			this._adjustInfinitePosition(animate);
		} else {
			this._updatePosition(animate);
		}
		
		this._updateARIA();
		this._updateNavigation();

		// Announce slide change to screen readers
		if (Funky.Announce && index !== previousIndex) {
			var slideNum = index + 1;
			var totalSlides = state.slideCount;
			Funky.Announce.polite('Slide ' + slideNum + ' of ' + totalSlides);
		}

		// Phase 4: Reset autoplay progress
		this._resetProgress();

		// Phase 5: Update center mode and lazy load
		this._updateCenterSlide();
		this._loadVisibleSlides();

		// Emit after change
		if (P) {
			P.emit('funky:carousel:change', {
				carousel: this,
				index: index,
				previousIndex: previousIndex
			});
		}

		// Callback
		if (typeof config.onSlideChange === 'function') {
			config.onSlideChange(index, previousIndex);
		}
	};

	/**
	 * Animate to clone position, then jump to target
	 * @private
	 */
	FunkyCarousel.prototype._animateInfiniteWrap = function(wrapIndex, targetIndex, animate) {
		var self = this;
		var state = this.state;
		var config = this.config;
		
		// In fullscreen or fullWidthSlides mode, no gap
		var gapValue = (state.isFullscreen || config.fullWidthSlides) ? 0 : 
			(typeof config.gap === 'number' ? config.gap : parseInt(config.gap, 10) || 0);
		var slideWidthWithGap = state.slideWidth + gapValue;
		var speed = animate ? config.speed : 0;
		
		// Calculate offset to clone position
		var cloneOffset = state.clonesBefore.length * slideWidthWithGap;
		var slideOffset = wrapIndex * slideWidthWithGap;
		var totalOffset = cloneOffset + slideOffset;
		
		// In center mode (but not fullWidthSlides/fullscreen), adjust to center the target slide
		if (config.centerMode && !state.isFullscreen && !config.fullWidthSlides) {
			var viewportWidth = state.viewport.el.offsetWidth;
			var centerOffset = (viewportWidth - state.slideWidth) / 2;
			totalOffset = totalOffset - centerOffset;
		}

		state.isAnimating = true;

		// Animate to clone
		state.track.style({
			transition: speed ? 'transform ' + speed + 'ms ' + config.easing : 'none',
			transform: 'translateX(-' + totalOffset + 'px)'
		});

		// After animation, jump to target without animation
		setTimeout(function() {
			state.currentIndex = targetIndex;
			self._adjustInfinitePosition(false);
			
			// Update navigation after wrap
			self._updateNavigation();
			
			// Update center slide highlight after wrap
			self._updateCenterSlide();
			
			// Reset autoplay timer to prevent immediate next() call
			if (state.autoplayTimer && config.autoplay) {
				clearInterval(state.autoplayTimer);
				state.autoplayTimer = null;
				self._startAutoplay();
			}
			
			// Reset progress bar
			self._resetProgress();
			
			// Mark animation complete AFTER autoplay reset
			state.isAnimating = false;
		}, speed + 20);
	};

	/**
	 * Go to next slide(s)
	 */
	FunkyCarousel.prototype.next = function() {
		var newIndex = this.state.currentIndex + this.config.slidesToScroll;
		this.goTo(newIndex, true);
	};

	/**
	 * Go to previous slide(s)
	 */
	FunkyCarousel.prototype.prev = function() {
		var newIndex = this.state.currentIndex - this.config.slidesToScroll;
		this.goTo(newIndex, true);
	};

	// =========================================================================
	// Position & Display
	// =========================================================================

	/**
	 * Update track position
	 * @param {boolean} animate - Whether to animate
	 * @private
	 */
	FunkyCarousel.prototype._updatePosition = function(animate) {
		var self = this;
		var state = this.state;
		var config = this.config;

		// In fullscreen or fullWidthSlides mode, no gap
		var gapValue = (state.isFullscreen || config.fullWidthSlides) ? 0 : 
			(typeof config.gap === 'number' ? config.gap : parseInt(config.gap, 10) || 0);
		var slideWidthWithGap = state.slideWidth + gapValue;
		var offset = state.currentIndex * slideWidthWithGap;
		
		// In center mode, offset to center the target slide
		if (config.centerMode && !state.isFullscreen && !config.fullWidthSlides) {
			var viewportWidth = state.viewport.el.offsetWidth;
			var centerOffset = (viewportWidth - state.slideWidth) / 2;
			offset = offset - centerOffset;
		}
		
		var speed = animate ? config.speed : 0;

		if (animate) {
			state.isAnimating = true;
		}

		state.track.style({
			transition: speed ? 'transform ' + speed + 'ms ' + config.easing : 'none',
			transform: 'translateX(-' + offset + 'px)'
		});

		if (animate) {
			setTimeout(function() {
				state.isAnimating = false;
			}, speed);
		}
	};

	/**
	 * Update ARIA attributes
	 * @private
	 */
	FunkyCarousel.prototype._updateARIA = function() {
		var state = this.state;
		var config = this.config;

		// Update slide labels with correct count
		state.slides.forEach(function(slide, i) {
			slide.attr('aria-label', (i + 1) + ' of ' + state.slideCount);

			// Mark visible slides
			var isVisible = i >= state.currentIndex && i < state.currentIndex + config.slidesToShow;
			slide.attr('aria-hidden', isVisible ? null : 'true');

			// Prevent keyboard focus on hidden slides (WCAG 2.1)
			// Use inert attribute if supported, otherwise manage tabindex
			if (!isVisible) {
				slide.attr('inert', '');
				// Fallback: disable focusable elements in hidden slides
				var focusables = slide.el.querySelectorAll('a, button, input, select, textarea, [tabindex]');
				focusables.forEach(function(el) {
					if (!el.hasAttribute('data-original-tabindex')) {
						el.setAttribute('data-original-tabindex', el.getAttribute('tabindex') || '0');
					}
					el.setAttribute('tabindex', '-1');
				});
			} else {
				slide.attr('inert', null);
				// Restore tabindex on visible slides
				var focusables = slide.el.querySelectorAll('[data-original-tabindex]');
				focusables.forEach(function(el) {
					var original = el.getAttribute('data-original-tabindex');
					if (original === '0') {
						el.removeAttribute('tabindex');
					} else {
						el.setAttribute('tabindex', original);
					}
					el.removeAttribute('data-original-tabindex');
				});
			}
		});
	};

	// =========================================================================
	// Public API
	// =========================================================================

	/**
	 * Get current slide index
	 * @returns {number}
	 */
	FunkyCarousel.prototype.getCurrentIndex = function() {
		return this.state.currentIndex;
	};

	/**
	 * Get total slide count
	 * @returns {number}
	 */
	FunkyCarousel.prototype.getSlideCount = function() {
		return this.state.slideCount;
	};

	/**
	 * Check if carousel can go next
	 * @returns {boolean}
	 */
	FunkyCarousel.prototype.canGoNext = function() {
		var maxIndex = this.state.slideCount - this.config.slidesToShow;
		return this.state.currentIndex < maxIndex;
	};

	/**
	 * Check if carousel can go previous
	 * @returns {boolean}
	 */
	FunkyCarousel.prototype.canGoPrev = function() {
		return this.state.currentIndex > 0;
	};

	/**
	 * Refresh carousel dimensions (call after container resize)
	 */
	FunkyCarousel.prototype.refresh = function() {
		this._calculateDimensions();
		this._updatePosition(false);
	};

	/**
	 * Toggle autoplay on/off
	 * @returns {boolean} - New autoplay state (true = playing)
	 */
	FunkyCarousel.prototype.toggleAutoplay = function() {
		this._toggleAutoplay();
		return !this.state.autoplayManuallyPaused && !!this.state.autoplayTimer;
	};

	/**
	 * Start autoplay
	 */
	FunkyCarousel.prototype.startAutoplay = function() {
		if (!this.state.autoplayTimer) {
			this.state.autoplayManuallyPaused = false;
			this._startAutoplay();
		}
	};

	/**
	 * Stop autoplay
	 */
	FunkyCarousel.prototype.stopAutoplay = function() {
		this._stopAutoplay();
	};

	/**
	 * Check if autoplay is currently active
	 * @returns {boolean}
	 */
	FunkyCarousel.prototype.isAutoplayActive = function() {
		return !!this.state.autoplayTimer && !this.state.autoplayPaused;
	};

	/**
	 * Enter fullscreen mode
	 */
	FunkyCarousel.prototype.enterFullscreen = function() {
		if (this.config.fullscreen) {
			this._enterFullscreen();
		}
	};

	/**
	 * Exit fullscreen mode
	 */
	FunkyCarousel.prototype.exitFullscreen = function() {
		this._exitFullscreen();
	};

	/**
	 * Toggle fullscreen mode
	 * @returns {boolean} - New fullscreen state
	 */
	FunkyCarousel.prototype.toggleFullscreen = function() {
		this._toggleFullscreen();
		return this.state.isFullscreen;
	};

	/**
	 * Check if currently in fullscreen mode
	 * @returns {boolean}
	 */
	FunkyCarousel.prototype.isFullscreen = function() {
		return this.state.isFullscreen;
	};

	/**
	 * Destroy carousel and clean up
	 */
	FunkyCarousel.prototype.destroy = function() {
		// Run all cleanup functions (includes resize handler)
		if (this._cleanups && this._cleanups.length) {
			this._cleanups.forEach(function(fn) { fn(); });
			this._cleanups = [];
		}

		// Destroy touch handler (Phase 2)
		this._destroyTouchHandler();

		// Destroy navigation and keyboard (Phase 3)
		this._destroyNavigation();
		this._destroyKeyboard();

		// Destroy autoplay (Phase 4)
		this._destroyAutoplay();

		// Destroy advanced features (Phase 5)
		this._destroyResponsive();
		this._destroyInfiniteLoop();
		this._destroyFullscreen();

		// Remove from instance registry
		var id = this.container.attr('id');
		if (id) {
			_instances.unregister(id);
		}
		// Also try to unregister by raw element id if different
		if (this.container.el && this.container.el.id && this.container.el.id !== id) {
			_instances.unregister(this.container.el.id);
		}

		// Remove reference from element (this also ensures getByElement won't find it)
		if (this.container.el) {
			delete this.container.el._funkyCarousel;
		}

		// Emit destroy event
		if (P) {
			P.emit('funky:carousel:destroy', { carousel: this });
		}

		// Callback
		if (typeof this.config.onDestroy === 'function') {
			this.config.onDestroy();
		}

		// Clear container (optional - keep slides?)
		this.container.classRemove('carousel');
		this.container.html('');

		this.state.initialized = false;
	};

	// =========================================================================
	// Factory
	// =========================================================================

	var _instances = Funky.Registry.createInstanceRegistry('Carousel');

	var CarouselFactory = {
		/**
		 * Initialize a carousel on container
		 * @param {HTMLElement|string} container - Container element or selector
		 * @param {Object} [options] - Configuration options
		 * @returns {FunkyCarousel}
		 */
		init: function(container, options) {
			return new FunkyCarousel(container, options);
		},

		/**
		 * @deprecated Use Carousel.init() instead
		 */
		create: function(container, options) {
			if (Funky.debug) {
				console.warn('[Funky.Carousel] create() is deprecated. Use init() instead.');
			}
			return CarouselFactory.init(container, options);
		},

		/**
		 * Get carousel instance by ID or element
		 * @param {string|HTMLElement} idOrElement - Container element ID or element
		 * @returns {FunkyCarousel|null}
		 */
		getInstance: function(idOrElement) {
			if (typeof idOrElement === 'string') {
				var byId = _instances.get(idOrElement);
				if (byId) return byId;
				var el = document.querySelector('#' + idOrElement);
				return el ? _instances.getByElement(el) : null;
			}
			return idOrElement ? _instances.getByElement(idOrElement) : null;
		},

		/**
		 * Get all carousel instances
		 * @returns {Object}
		 */
		getAll: function() {
			return _instances.getAll();
		},

		/**
		 * Destroy carousel by ID or element
		 * @param {string|HTMLElement} idOrElement
		 */
		destroy: function(idOrElement) {
			var instance = CarouselFactory.getInstance(idOrElement);
			if (instance) {
				instance.destroy();
			}
		},

		/**
		 * Destroy all carousel instances
		 */
		destroyAll: function() {
			_instances.destroyAll();
		},

		/**
		 * Default options (can be modified globally)
		 */
		defaults: DEFAULTS,

		/**
		 * Constructor reference
		 */
		constructor: FunkyCarousel
	};

	// Register with Funky namespace
	Funky.register('Carousel', CarouselFactory);

})(window);
