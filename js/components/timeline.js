/**
 * Funky.Timeline - Chronological event display component
 * 
 * Displays events in vertical or horizontal timeline format with
 * date grouping, categories, expandable details, and live updates.
 * 
 * @namespace Funky.Timeline
 * @requires Funky.Dom
 * @requires Funky.Events
 * 
 * @example
 * var timeline = Funky.Timeline.create('#container', {
 *     categories: {
 *         trade: { icon: 'fa-exchange-alt', color: 'var(--pro-accent-primary)' }
 *     }
 * });
 * timeline.setEvents([{ id: 1, title: 'Trade', category: 'trade', timestamp: new Date() }]);
 */
(function(global) {
    'use strict';

    var D = global.Funky && global.Funky.Dom;
    var E = global.Funky && global.Funky.Events;

    if (!D || !E) {
        console.error('[Funky.Timeline] Requires Funky.Dom and Funky.Events');
        return;
    }

    // Instance registry
    var _instances = Funky.Registry.createInstanceRegistry('Timeline');
    var instanceId = 0;

    // =========================================================================
    // Default Configuration
    // =========================================================================

    var DEFAULTS = {
        // Data source - can be string URL or config object
        api: null,
        data: null,

        // Layout
        orientation: 'vertical',  // 'vertical' | 'horizontal'
        centered: false,          // Centered alternating layout (vertical only)
        density: 'normal',        // 'compact' | 'normal' | 'spacious'

        // Horizontal mode options
        horizontal: {
            showArrows: true,
            showDots: true,
            scrollBehavior: 'smooth',
            itemWidth: 200,
            gap: 24,
            centerActive: true
        },

        // Grouping
        groupBy: 'day',  // 'day' | 'week' | 'month' | 'none'
        groupLabels: null,  // Custom labels: { today: 'Today', yesterday: 'Yesterday', ... }

        // Time formatting
        timeFormat: 'absolute',  // 'relative' | 'absolute' | 'both'
        useRelativeTime: true,   // Use Funky.RelativeTime if available

        // Pagination
        pageSize: 20,

        // API configuration (when api is object)
        apiConfig: {
            method: 'GET',
            pagination: {
                enabled: true,
                pageParam: 'page',
                pageSizeParam: 'per_page'
            },
            responseMap: {
                data: 'data',
                total: 'total',
                page: 'page',
                hasMore: 'has_more'
            },
            headers: {}
        },

        // Lazy loading / infinite scroll
        lazyLoad: {
            enabled: false,
            threshold: 200,
            loadingText: 'Loading more events...'
        },

        // Filter options
        filter: {},

        // LiveBinding configuration (real-time updates)
        liveBinding: {
            enabled: false,
            source: 'websocket',      // 'websocket' | 'event' | 'cache' | 'api'
            channel: 'timeline:events',
            event: null,              // For event source
            key: null,                // For cache source
            url: null,                // For api source
            interval: null,           // For api polling
            keyField: 'id',
            actionField: 'action',    // Field containing action type
            actionMap: {}             // Map message types to actions
        },

        // Animation settings
        animation: {
            enabled: true,
            duration: 300,
            highlightDuration: 2000,
            stagger: 50
        },

        // Insert position for new live events
        insertPosition: 'top',        // 'top' | 'bottom' | 'chronological'

        // Status indicator
        showStatus: false,

        // Categories with icon and color
        categories: {},

        // Display options
        showTimestamps: true,
        expandable: true,
        animate: true,

        // Messages
        emptyMessage: 'No events to display',
        loadingMessage: 'Loading...',
        errorMessage: 'Failed to load events',

        // Callbacks
        onEventClick: null,
        onEventExpand: null,
        onLoad: null,
        onScroll: null,
        onActiveChange: null,
        onLoadStart: null,
        onLoadEnd: null,
        onLoadError: null,
        onLiveConnect: null,
        onLiveDisconnect: null,
        onLiveEvent: null
    };

    // =========================================================================
    // Timeline Class
    // =========================================================================

    /**
     * Timeline instance constructor
     * @param {string|Element} container - Container selector or element
     * @param {Object} options - Configuration options
     */
    function Timeline(container, options) {
        this._container = typeof container === 'string' 
            ? D.one(container) 
            : D.one(container);

        if (!this._container) {
            console.error('[Funky.Timeline] Container not found:', container);
            return;
        }

        this._config = Object.assign({}, DEFAULTS, options);
        this._events = [];
        this._groups = {};
        this._groupOrder = [];
        this._page = 1;
        this._hasMore = true;
        this._loading = false;
        this._initialized = false;

        // API state
        this._currentPage = 0;
        this._totalCount = 0;
        this._isLoading = false;

        // Loader references
        this._skeletonLoader = null;
        this._bottomLoader = null;
        this._scrollTracker = null;

        // LiveBinding state
        this._liveBinding = null;
        this._liveConnected = false;
        this._statusIndicator = null;
        this._statusDot = null;
        this._statusText = null;

        // DOM references
        this._wrapper = null;
        this._eventsContainer = null;
        this._loadingEl = null;
        this._emptyEl = null;

        // Horizontal mode references
        this._trackContainer = null;
        this._leftArrow = null;
        this._rightArrow = null;
        this._dotsContainer = null;
        this._activeIndex = 0;

        this._init();
    }

    // =========================================================================
    // Initialization
    // =========================================================================

    /**
     * Initialize the timeline
     * @private
     */
    Timeline.prototype._init = function() {
        this._buildStructure();
        this._bindEvents();
        this._initLazyLoad();
        this._initLiveBinding();
        this._initialized = true;

        // Load initial data
        if (this._config.api) {
            this.load();
        } else if (this._config.data) {
            this.setEvents(this._config.data);
        } else {
            // No data provided - show empty state
            this._showEmpty();
        }

        // Call onInit callback if provided
        if (typeof this._config.onInit === 'function') {
            this._config.onInit(this);
        }

        return this;
    };

    // =========================================================================
    // Structure Building
    // =========================================================================

    /**
     * Build the timeline DOM structure
     * @private
     */
    Timeline.prototype._buildStructure = function() {
        var config = this._config;

        // Clear container
        this._container.html('');

        // Create wrapper
        this._wrapper = D.create('section')
            .classAdd('funky-timeline')
            .classAdd('funky-timeline--' + config.orientation)
            .attr({
                'role': 'feed',
                'aria-label': 'Timeline',
                'aria-busy': 'false',
                'data-timeline': ''
            })
            .appendTo(this._container);

        // Add density class
        if (config.density && config.density !== 'normal') {
            this._wrapper.classAdd('funky-timeline--' + config.density);
        }

        // Add centered class for vertical layout
        if (config.orientation === 'vertical' && config.centered) {
            this._wrapper.classAdd('funky-timeline--centered');
        }

        // Build orientation-specific structure
        if (config.orientation === 'horizontal') {
            this._buildHorizontalStructure();
        } else {
            this._buildVerticalStructure();
        }

        // Loading indicator
        this._loadingEl = D.create('div')
            .classAdd('funky-timeline__loading')
            .attr({ 'role': 'status', 'aria-live': 'polite' })
            .html('<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>' + config.loadingMessage + '</span>')
            .appendTo(this._wrapper);
        this._loadingEl.el.hidden = true;

        // Empty state
        this._emptyEl = D.create('div')
            .classAdd('funky-timeline__empty')
            .html('<i class="fas fa-calendar-times" aria-hidden="true"></i><p>' + config.emptyMessage + '</p>')
            .appendTo(this._wrapper);
        this._emptyEl.el.hidden = true;
    };

    /**
     * Build vertical timeline structure
     * @private
     */
    Timeline.prototype._buildVerticalStructure = function() {
        // Events container (groups will be added here)
        this._eventsContainer = D.create('div')
            .classAdd('funky-timeline__container')
            .appendTo(this._wrapper);
    };

    /**
     * Build horizontal timeline structure
     * @private
     */
    Timeline.prototype._buildHorizontalStructure = function() {
        var self = this;
        var config = this._config;
        var horizontal = config.horizontal || {};

        // Left arrow
        if (horizontal.showArrows !== false) {
            this._leftArrow = D.create('button')
                .classAdd('funky-timeline__arrow')
                .classAdd('funky-timeline__arrow--left')
                .classAdd('funky-timeline__arrow--hidden')
                .attr({
                    'type': 'button',
                    'aria-label': 'Scroll left'
                })
                .html('<i class="fas fa-chevron-left" aria-hidden="true"></i>')
                .appendTo(this._wrapper);

            this._leftArrow.on('click', function() {
                self._scrollHorizontal(-1);
            });
        }

        // Track container (scrollable)
        this._trackContainer = D.create('div')
            .classAdd('funky-timeline__track-container')
            .appendTo(this._wrapper);

        // Track with line
        var track = D.create('div')
            .classAdd('funky-timeline__track')
            .appendTo(this._trackContainer);

        // Horizontal line
        D.create('div')
            .classAdd('funky-timeline__line')
            .appendTo(track);

        // Events container
        this._eventsContainer = D.create('div')
            .classAdd('funky-timeline__events')
            .appendTo(track);

        // Right arrow
        if (horizontal.showArrows !== false) {
            this._rightArrow = D.create('button')
                .classAdd('funky-timeline__arrow')
                .classAdd('funky-timeline__arrow--right')
                .attr({
                    'type': 'button',
                    'aria-label': 'Scroll right'
                })
                .html('<i class="fas fa-chevron-right" aria-hidden="true"></i>')
                .appendTo(this._wrapper);

            this._rightArrow.on('click', function() {
                self._scrollHorizontal(1);
            });
        }

        // Navigation dots
        if (horizontal.showDots !== false) {
            this._dotsContainer = D.create('div')
                .classAdd('funky-timeline__dots')
                .appendTo(this._wrapper);
        }

        // Scroll listener
        this._trackContainer.on('scroll', function() {
            self._updateArrowVisibility();
            self._updateActiveDot();
        });
    };

    // =========================================================================
    // Event Binding
    // =========================================================================

    /**
     * Bind event handlers
     * @private
     */
    Timeline.prototype._bindEvents = function() {
        var self = this;

        // Event click handler (delegated)
        this._wrapper.on('click', function(e) {
            var eventEl = e.target.closest('.funky-timeline__event');
            if (eventEl) {
                self._handleEventClick(eventEl, e);
            }
        });

        // Keyboard navigation
        this._wrapper.on('keydown', function(e) {
            self._handleKeydown(e);
        });

        // Expand/collapse toggle
        this._wrapper.on('click', function(e) {
            var toggle = e.target.closest('.funky-timeline__expand-toggle');
            if (toggle) {
                e.preventDefault();
                e.stopPropagation();
                var eventEl = toggle.closest('.funky-timeline__event');
                if (eventEl) {
                    self._toggleExpand(D.one(eventEl));
                }
            }
        });
    };

    /**
     * Handle event click
     * @private
     * @param {Element} eventEl - The clicked event element
     * @param {Event} e - The click event
     */
    Timeline.prototype._handleEventClick = function(eventEl, e) {
        // Handle ElementWrapper or raw element
        var el = eventEl && eventEl.el ? eventEl.el : eventEl;
        if (!el || typeof el.getAttribute !== 'function') return;

        var eventId = el.getAttribute('data-event-id');
        var eventData = this.getEvent(eventId);

        if (!eventData) return;

        // Emit click event
        this._emit('click', {
            event: eventData,
            element: eventEl,
            originalEvent: e
        });

        // Call callback if provided
        if (typeof this._config.onEventClick === 'function') {
            this._config.onEventClick(eventData, eventEl, e);
        }
    };

    /**
     * Handle keyboard navigation
     * @private
     * @param {KeyboardEvent} e
     */
    Timeline.prototype._handleKeydown = function(e) {
        var target = e.target;
        if (!target.classList.contains('funky-timeline__event')) return;

        var events = this._wrapper.el.querySelectorAll('.funky-timeline__event');
        var eventsArray = Array.prototype.slice.call(events);
        var currentIndex = eventsArray.indexOf(target);
        var newIndex = -1;

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                newIndex = Math.min(currentIndex + 1, eventsArray.length - 1);
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = eventsArray.length - 1;
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (this._config.expandable) {
                    this._toggleExpand(D.one(target));
                }
                return;
        }

        if (newIndex >= 0 && newIndex !== currentIndex) {
            eventsArray[newIndex].focus();
        }
    };

    /**
     * Toggle event expand/collapse
     * @private
     * @param {Object} eventEl - Funky.Dom wrapped event element
     */
    Timeline.prototype._toggleExpand = function(eventEl) {
        if (!eventEl || !eventEl.el) return;

        var details = D.one('.funky-timeline__details', eventEl.el);
        if (!details) return;

        var isExpanded = !details.el.hidden;
        details.el.hidden = isExpanded;

        // Update ARIA
        var toggle = D.one('.funky-timeline__expand-toggle', eventEl.el);
        if (toggle) {
            toggle.attr('aria-expanded', String(!isExpanded));
        }

        eventEl.classToggle('funky-timeline__event--expanded', !isExpanded);

        // Get event data
        var eventId = eventEl.el.getAttribute('data-event-id');
        var eventData = this.getEvent(eventId);

        // Emit event
        this._emit('expand', {
            event: eventData,
            element: eventEl.el,
            expanded: !isExpanded
        });

        // Call callback
        if (typeof this._config.onEventExpand === 'function') {
            this._config.onEventExpand(eventData, !isExpanded);
        }
    };

    // =========================================================================
    // Rendering
    // =========================================================================

    /**
     * Render events to the timeline
     * @private
     * @param {Array} events - Events to render
     * @param {boolean} append - Whether to append or replace
     */
    Timeline.prototype._renderEvents = function(events, append) {
        var self = this;
        var config = this._config;

        if (!append) {
            this._eventsContainer.html('');
            this._groups = {};
            this._groupOrder = [];
        }

        if (!events || events.length === 0) {
            if (!append && this._events.length === 0) {
                this._showEmpty();
            }
            return;
        }

        this._hideEmpty();

        // Render based on orientation
        if (config.orientation === 'horizontal') {
            events.forEach(function(event, index) {
                self._renderHorizontalEvent(event, index);
            });
            // Render navigation dots
            this._renderDots();
            // Update arrow visibility
            this._updateArrowVisibility();
        } else {
            events.forEach(function(event) {
                self._renderEvent(event);
            });
        }

        // Emit loaded event
        this._emit('loaded', {
            events: events,
            page: this._page,
            hasMore: this._hasMore
        });
    };

    /**
     * Render a single event (vertical mode)
     * @private
     * @param {Object} event - Event data
     * @param {boolean} prepend - Whether to prepend (for new events)
     * @returns {Object} The created event element wrapper
     */
    Timeline.prototype._renderEvent = function(event, prepend) {
        var config = this._config;

        // Handle horizontal mode differently
        if (config.orientation === 'horizontal') {
            return this._renderHorizontalEventSingle(event, prepend);
        }

        // Build event element
        var eventEl = this._buildEventElement(event);

        // When groupBy is 'none', render directly without group wrappers
        if (config.groupBy === 'none') {
            if (prepend) {
                this._eventsContainer.el.insertBefore(eventEl.el, this._eventsContainer.el.firstChild);
            } else {
                eventEl.appendTo(this._eventsContainer);
            }
        } else {
            var groupKey = this._getGroupKey(event);
            var group = this._getOrCreateGroup(groupKey, event);

            // Get events list in group
            var eventsList = D.one('.funky-timeline__events', group.el.el);

            if (prepend) {
                eventsList.el.insertBefore(eventEl.el, eventsList.el.firstChild);
            } else {
                eventEl.appendTo(eventsList);
            }
        }

        // Animate if enabled
        if (config.animate && prepend) {
            this._animateIn(eventEl);
        }

        return eventEl;
    };

    /**
     * Render a single event in horizontal mode (for dynamic adds)
     * @private
     * @param {Object} event - Event data
     * @param {boolean} prepend - Whether to prepend (for new events)
     * @returns {Object} The created event element wrapper
     */
    Timeline.prototype._renderHorizontalEventSingle = function(event, prepend) {
        var self = this;
        var config = this._config;
        var horizontal = config.horizontal || {};
        var category = config.categories[event.category] || {};

        var itemWidth = horizontal.itemWidth || 200;
        var markerColor = event.color || category.color || 'var(--pro-primary)';
        var markerIcon = event.icon || category.icon || 'fa-circle';

        // Calculate index based on position
        var index = prepend ? 0 : this._events.length - 1;

        // Create event item
        var item = D.create('div')
            .classAdd('funky-timeline__event')
            .classAdd('funky-timeline__event--horizontal')
            .attr({
                'data-event-id': String(event.id),
                'data-index': String(index),
                'tabindex': '0',
                'role': 'article'
            })
            .style({ width: itemWidth + 'px' });

        // Node on the line
        var node = D.create('div')
            .classAdd('funky-timeline__node');

        // Apply category color to node background/border, keep icon white
        if (markerColor) {
            node.style({
                backgroundColor: markerColor,
                borderColor: markerColor
            });
        }

        node.appendTo(item);

        D.create('i')
            .classAdd('fas')
            .classAdd(markerIcon.replace('fas ', ''))
            .appendTo(node);

        // Card below the line
        var card = D.create('div')
            .classAdd('funky-timeline__card')
            .appendTo(item);

        // Title
        D.create('div')
            .classAdd('funky-timeline__card-title')
            .text(event.title || '')
            .appendTo(card);

        // Date
        if (event.timestamp) {
            D.create('div')
                .classAdd('funky-timeline__card-date')
                .text(this._formatDate(new Date(event.timestamp)))
                .appendTo(card);
        }

        // Description
        if (event.description) {
            D.create('div')
                .classAdd('funky-timeline__card-description')
                .text(event.description)
                .appendTo(card);
        }

        // Expandable details (horizontal mode)
        if (config.expandable && event.details) {
            var detailsContainer = D.create('div')
                .classAdd('funky-timeline__card-details')
                .appendTo(card);
            detailsContainer.el.hidden = true;

            this._renderHorizontalDetails(event.details, detailsContainer);

            // Add expand toggle
            var toggle = D.create('button')
                .classAdd('funky-timeline__card-toggle')
                .attr({
                    'type': 'button',
                    'aria-expanded': 'false',
                    'aria-label': 'Toggle details'
                })
                .html('<i class="fas fa-chevron-down" aria-hidden="true"></i>')
                .appendTo(card);

            // Toggle click handler
            toggle.on('click', function(e) {
                e.stopPropagation();
                var isExpanded = !detailsContainer.el.hidden;
                detailsContainer.el.hidden = isExpanded;
                toggle.attr('aria-expanded', String(!isExpanded));
                item.classToggle('funky-timeline__event--expanded', !isExpanded);
                
                self._emit('expand', {
                    event: event,
                    element: item.el,
                    expanded: !isExpanded
                });
            });
        }

        // Click handler
        item.on('click', function() {
            self._selectHorizontalEvent(event, item, index);
        });

        // Insert at correct position
        if (prepend && this._eventsContainer.el.firstChild) {
            this._eventsContainer.el.insertBefore(item.el, this._eventsContainer.el.firstChild);
        } else {
            item.appendTo(this._eventsContainer);
        }

        // Update dots and arrows after adding
        this._renderDots();
        this._updateArrowVisibility();

        // Animate if enabled
        if (config.animate && prepend) {
            this._animateIn(item);
        }

        // Re-index all events
        this._reindexHorizontalEvents();

        // Scroll to show the new event
        console.log('[Timeline] _renderHorizontalEventSingle - prepend:', prepend, 'trackContainer:', this._trackContainer);
        if (prepend && this._trackContainer) {
            console.log('[Timeline] Attempting scroll to left: 0');
            console.log('[Timeline] Track container el:', this._trackContainer.el);
            console.log('[Timeline] Track scrollLeft before:', this._trackContainer.el.scrollLeft);
            console.log('[Timeline] Track scrollWidth:', this._trackContainer.el.scrollWidth);
            console.log('[Timeline] Track clientWidth:', this._trackContainer.el.clientWidth);
            
            // Small delay to let the DOM update
            setTimeout(function() {
                console.log('[Timeline] Inside setTimeout, scrolling now');
                console.log('[Timeline] Track scrollLeft before scroll:', self._trackContainer.el.scrollLeft);
                self._trackContainer.el.scrollTo({
                    left: 0,
                    behavior: config.horizontal.scrollBehavior || 'smooth'
                });
                console.log('[Timeline] scrollTo called, scrollLeft after:', self._trackContainer.el.scrollLeft);
                
                // Force scroll in case scrollTo doesn't work
                setTimeout(function() {
                    console.log('[Timeline] After 100ms, scrollLeft:', self._trackContainer.el.scrollLeft);
                    if (self._trackContainer.el.scrollLeft !== 0) {
                        console.log('[Timeline] Still not at 0, forcing scrollLeft = 0');
                        self._trackContainer.el.scrollLeft = 0;
                    }
                }, 100);
            }, 50);
        } else {
            console.log('[Timeline] Skipped scroll - prepend:', prepend, 'trackContainer exists:', !!this._trackContainer);
        }

        return item;
    };

    /**
     * Re-index horizontal events after add/remove
     * @private
     */
    Timeline.prototype._reindexHorizontalEvents = function() {
        var events = this._eventsContainer.el.querySelectorAll('.funky-timeline__event');
        for (var i = 0; i < events.length; i++) {
            events[i].setAttribute('data-index', String(i));
        }
    };

    /**
     * Render a single event (horizontal mode)
     * @private
     * @param {Object} event - Event data
     * @param {number} index - Event index
     */
    Timeline.prototype._renderHorizontalEvent = function(event, index) {
        var self = this;
        var config = this._config;
        var horizontal = config.horizontal || {};
        var category = config.categories[event.category] || {};

        var itemWidth = horizontal.itemWidth || 200;
        var markerColor = event.color || category.color || 'var(--pro-primary)';
        var markerIcon = event.icon || category.icon || 'fa-circle';
        // Handle icon classes that already include font prefix
        var iconClasses = /^fa[srldb]?\s/.test(markerIcon) ? markerIcon.split(' ') : ['fas', markerIcon];

        // Create event item
        var item = D.create('div')
            .classAdd('funky-timeline__event')
            .classAdd('funky-timeline__event--horizontal')
            .attr({
                'data-event-id': String(event.id),
                'data-index': String(index),
                'tabindex': '0',
                'role': 'article'
            })
            .style({ width: itemWidth + 'px' });

        // Node on the line
        var node = D.create('div')
            .classAdd('funky-timeline__node');

        // Apply category color to background/border, keep icon white for contrast
        if (markerColor) {
            node.style({
                backgroundColor: markerColor,
                borderColor: markerColor
            });
        }

        node.appendTo(item);

        var iconEl = D.create('i');
        iconClasses.forEach(function(cls) { iconEl.classAdd(cls); });
        iconEl.appendTo(node);

        // Card below the line
        var card = D.create('div')
            .classAdd('funky-timeline__card')
            .appendTo(item);

        // Title
        D.create('div')
            .classAdd('funky-timeline__card-title')
            .text(event.title || '')
            .appendTo(card);

        // Date
        if (event.timestamp) {
            D.create('div')
                .classAdd('funky-timeline__card-date')
                .text(this._formatDate(new Date(event.timestamp)))
                .appendTo(card);
        }

        // Description
        if (event.description) {
            D.create('div')
                .classAdd('funky-timeline__card-description')
                .text(event.description)
                .appendTo(card);
        }

        // Expandable details (horizontal mode)
        if (config.expandable && event.details) {
            var detailsContainer = D.create('div')
                .classAdd('funky-timeline__card-details')
                .appendTo(card);
            detailsContainer.el.hidden = true;

            this._renderHorizontalDetails(event.details, detailsContainer);

            // Add expand toggle
            var toggle = D.create('button')
                .classAdd('funky-timeline__card-toggle')
                .attr({
                    'type': 'button',
                    'aria-expanded': 'false',
                    'aria-label': 'Toggle details'
                })
                .html('<i class="fas fa-chevron-down" aria-hidden="true"></i>')
                .appendTo(card);

            // Toggle click handler
            toggle.on('click', function(e) {
                e.stopPropagation();
                var isExpanded = !detailsContainer.el.hidden;
                detailsContainer.el.hidden = isExpanded;
                toggle.attr('aria-expanded', String(!isExpanded));
                item.classToggle('funky-timeline__event--expanded', !isExpanded);
                
                self._emit('expand', {
                    event: event,
                    element: item.el,
                    expanded: !isExpanded
                });
            });
        }

        // Click handler
        item.on('click', function() {
            self._selectHorizontalEvent(event, item, index);
        });

        item.appendTo(this._eventsContainer);
    };

    /**
     * Render details for horizontal mode
     * @private
     */
    Timeline.prototype._renderHorizontalDetails = function(details, container) {
        var dl = D.create('dl')
            .classAdd('funky-timeline__card-details-list')
            .appendTo(container);

        Object.keys(details).forEach(function(key) {
            D.create('dt').text(key).appendTo(dl);
            D.create('dd').text(String(details[key])).appendTo(dl);
        });
    };

    /**
     * Select a horizontal event
     * @private
     */
    Timeline.prototype._selectHorizontalEvent = function(event, element, index) {
        // Remove previous selection
        var prevSelected = D.one('.funky-timeline__event--selected', this._wrapper.el);
        if (prevSelected) {
            prevSelected.classRemove('funky-timeline__event--selected');
        }

        // Add selection
        element.classAdd('funky-timeline__event--selected');
        this._activeIndex = index;

        // Update dot
        this._setActiveDot(index);

        // Emit click event
        this._emit('click', {
            event: event,
            element: element.el,
            index: index
        });

        if (typeof this._config.onEventClick === 'function') {
            this._config.onEventClick(event, element.el);
        }
    };

    /**
     * Build event element
     * @private
     * @param {Object} event - Event data
     * @returns {Object} Funky.Dom wrapped element
     */
    Timeline.prototype._buildEventElement = function(event) {
        var config = this._config;
        var category = config.categories[event.category] || {};

        // Create event wrapper
        var eventEl = D.create('li')
            .classAdd('funky-timeline__event')
            .attr({
                'data-event-id': String(event.id),
                'data-category': event.category || '',
                'tabindex': '0',
                'role': 'article',
                'aria-labelledby': 'event-' + event.id + '-title'
            });

        // Marker
        var markerIcon = event.icon || category.icon || 'fa-circle';
        var markerColor = event.color || category.color || null;
        // Handle icon classes that already include font prefix (fas, far, fab, etc.)
        var iconClass = /^fa[srldb]?\s/.test(markerIcon) ? markerIcon : 'fas ' + markerIcon;

        var marker = D.create('div')
            .classAdd('funky-timeline__marker')
            .attr('aria-hidden', 'true')
            .html('<i class="' + iconClass + '"></i>');

        // Apply category color to background/border, keep icon white for contrast
        if (markerColor) {
            marker.style({
                backgroundColor: markerColor,
                borderColor: markerColor
            });
        }

        marker.appendTo(eventEl);

        // Connector line
        D.create('div')
            .classAdd('funky-timeline__connector')
            .attr('aria-hidden', 'true')
            .appendTo(eventEl);

        // Content card
        var content = D.create('article')
            .classAdd('funky-timeline__content')
            .appendTo(eventEl);

        // Header with time and category
        var header = D.create('header')
            .classAdd('funky-timeline__header')
            .appendTo(content);

        // Show timestamps unless explicitly disabled via showTimestamps or timeFormat: 'none'
        var shouldShowTime = config.showTimestamps !== false && config.timeFormat !== 'none';
        if (shouldShowTime && event.timestamp) {
            var timestamp = new Date(event.timestamp);
            D.create('time')
                .classAdd('funky-timeline__time')
                .attr('datetime', timestamp.toISOString())
                .text(this._formatTime(timestamp))
                .appendTo(header);
        }

        if (event.category && category) {
            var categoryEl = D.create('span')
                .classAdd('funky-timeline__category')
                .text(this._formatCategory(event.category));

            // Apply category color as background accent, not text color
            if (markerColor) {
                categoryEl.style({
                    backgroundColor: markerColor,
                    color: 'var(--pro-primary-contrast, #fff)'
                });
            }

            categoryEl.appendTo(header);
        }

        // Title
        D.create('h4')
            .classAdd('funky-timeline__title')
            .attr('id', 'event-' + event.id + '-title')
            .text(event.title || '')
            .appendTo(content);

        // Description
        if (event.description) {
            D.create('p')
                .classAdd('funky-timeline__description')
                .text(event.description)
                .appendTo(content);
        }

        // Expandable details
        if (config.expandable && event.details) {
            var detailsContainer = D.create('div')
                .classAdd('funky-timeline__details')
                .appendTo(content);
            detailsContainer.el.hidden = true;

            this._renderDetails(event.details, detailsContainer);

            // Add expand toggle to header
            D.create('button')
                .classAdd('funky-timeline__expand-toggle')
                .attr({
                    'type': 'button',
                    'aria-expanded': 'false',
                    'aria-label': 'Toggle details'
                })
                .html('<i class="fas fa-chevron-down" aria-hidden="true"></i>')
                .appendTo(header);
        }

        // Footer with link
        if (event.link) {
            var footer = D.create('footer')
                .classAdd('funky-timeline__footer')
                .appendTo(content);

            D.create('a')
                .classAdd('funky-timeline__link')
                .attr('href', event.link)
                .text('View Details')
                .appendTo(footer);
        }

        return eventEl;
    };

    /**
     * Render event details
     * @private
     * @param {Object} details - Details object
     * @param {Object} container - Funky.Dom container
     */
    Timeline.prototype._renderDetails = function(details, container) {
        var dl = D.create('dl')
            .classAdd('funky-timeline__details-list')
            .appendTo(container);

        Object.keys(details).forEach(function(key) {
            D.create('dt').text(key).appendTo(dl);
            D.create('dd').text(String(details[key])).appendTo(dl);
        });
    };

    /**
     * Animate event entering
     * @private
     * @param {Object} eventEl - Funky.Dom element
     */
    Timeline.prototype._animateIn = function(eventEl) {
        // Check for Funky.Animate
        if (global.Funky && global.Funky.Animate && typeof global.Funky.Animate.slide === 'function') {
            global.Funky.Animate.slide(eventEl.el, 'in', {
                from: 'left',
                duration: 300
            });
        } else {
            // Fallback CSS animation
            eventEl.classAdd('funky-timeline__event--entering');
            setTimeout(function() {
                eventEl.classRemove('funky-timeline__event--entering');
            }, 300);
        }
    };

    // =========================================================================
    // Horizontal Navigation
    // =========================================================================

    /**
     * Scroll the horizontal timeline
     * @private
     * @param {number} direction - -1 for left, 1 for right
     */
    Timeline.prototype._scrollHorizontal = function(direction) {
        var config = this._config;
        var horizontal = config.horizontal || {};

        if (!this._trackContainer) return;

        var scrollAmount = horizontal.itemWidth || 200;
        var gap = horizontal.gap || 24;
        var scrollDistance = (scrollAmount + gap) * direction;
        var behavior = horizontal.scrollBehavior || 'smooth';

        this._trackContainer.el.scrollBy({
            left: scrollDistance,
            behavior: behavior
        });
    };

    /**
     * Update arrow visibility based on scroll position
     * @private
     */
    Timeline.prototype._updateArrowVisibility = function() {
        if (!this._trackContainer) return;

        var node = this._trackContainer.el;
        var scrollLeft = node.scrollLeft;
        var scrollWidth = node.scrollWidth;
        var clientWidth = node.clientWidth;

        // Hide left arrow at start
        if (this._leftArrow) {
            if (scrollLeft <= 0) {
                this._leftArrow.classAdd('funky-timeline__arrow--hidden');
            } else {
                this._leftArrow.classRemove('funky-timeline__arrow--hidden');
            }
        }

        // Hide right arrow at end
        if (this._rightArrow) {
            if (scrollLeft + clientWidth >= scrollWidth - 1) {
                this._rightArrow.classAdd('funky-timeline__arrow--hidden');
            } else {
                this._rightArrow.classRemove('funky-timeline__arrow--hidden');
            }
        }

        // Trigger onScroll callback
        if (typeof this._config.onScroll === 'function') {
            this._config.onScroll({
                scrollLeft: scrollLeft,
                scrollWidth: scrollWidth,
                clientWidth: clientWidth
            });
        }
    };

    /**
     * Render navigation dots
     * @private
     */
    Timeline.prototype._renderDots = function() {
        var config = this._config;
        var horizontal = config.horizontal || {};

        if (config.orientation !== 'horizontal' || !this._dotsContainer) return;
        if (horizontal.showDots === false) return;

        var self = this;
        var events = this._events;
        this._dotsContainer.html('');

        events.forEach(function(event, index) {
            var dot = D.create('button')
                .classAdd('funky-timeline__dot')
                .attr({
                    'type': 'button',
                    'aria-label': 'Go to event ' + (index + 1) + ': ' + (event.title || ''),
                    'data-index': String(index)
                });

            if (index === 0) {
                dot.classAdd('funky-timeline__dot--active');
            }

            dot.on('click', function() {
                self._scrollToEvent(index);
                self._setActiveDot(index);
            });

            dot.appendTo(self._dotsContainer);
        });
    };

    /**
     * Scroll to a specific event by index
     * @private
     * @param {number} index - Event index
     */
    Timeline.prototype._scrollToEvent = function(index) {
        var config = this._config;
        var horizontal = config.horizontal || {};

        if (!this._trackContainer) return;

        var eventEl = this._eventsContainer.el.querySelector('[data-index="' + index + '"]');
        if (!eventEl) return;

        var trackNode = this._trackContainer.el;
        var scrollTarget;

        if (horizontal.centerActive !== false) {
            // Center the event
            scrollTarget = eventEl.offsetLeft - (trackNode.clientWidth / 2) + (eventEl.offsetWidth / 2);
        } else {
            // Align to left
            scrollTarget = eventEl.offsetLeft;
        }

        trackNode.scrollTo({
            left: Math.max(0, scrollTarget),
            behavior: horizontal.scrollBehavior || 'smooth'
        });

        this._activeIndex = index;
    };

    /**
     * Set active navigation dot
     * @private
     * @param {number} index - Dot index
     */
    Timeline.prototype._setActiveDot = function(index) {
        if (!this._dotsContainer) return;

        var dots = this._dotsContainer.el.querySelectorAll('.funky-timeline__dot');
        for (var i = 0; i < dots.length; i++) {
            if (i === index) {
                dots[i].classList.add('funky-timeline__dot--active');
            } else {
                dots[i].classList.remove('funky-timeline__dot--active');
            }
        }
    };

    /**
     * Update active dot based on scroll position
     * @private
     */
    Timeline.prototype._updateActiveDot = function() {
        if (!this._trackContainer || !this._dotsContainer) return;

        var config = this._config;
        var trackNode = this._trackContainer.el;
        var centerX = trackNode.scrollLeft + (trackNode.clientWidth / 2);

        // Find the event closest to center
        var events = this._eventsContainer.el.querySelectorAll('.funky-timeline__event');
        var closestIndex = 0;
        var closestDistance = Infinity;

        for (var i = 0; i < events.length; i++) {
            var eventNode = events[i];
            var eventCenter = eventNode.offsetLeft + (eventNode.offsetWidth / 2);
            var distance = Math.abs(eventCenter - centerX);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }

        if (closestIndex !== this._activeIndex) {
            this._activeIndex = closestIndex;
            this._setActiveDot(closestIndex);

            // Trigger onActiveChange callback
            if (typeof config.onActiveChange === 'function' && this._events[closestIndex]) {
                config.onActiveChange(this._events[closestIndex], closestIndex);
            }
        }
    };

    /**
     * Scroll to event by ID (public method)
     * @param {string|number} eventId - Event ID
     */
    Timeline.prototype.scrollToEvent = function(eventId) {
        var eventIdStr = String(eventId);
        for (var i = 0; i < this._events.length; i++) {
            if (String(this._events[i].id) === eventIdStr) {
                this._scrollToEvent(i);
                this._setActiveDot(i);
                return this;
            }
        }
        return this;
    };

    // =========================================================================
    // API Loading
    // =========================================================================

    /**
     * Load events from API
     * @private
     * @param {Object} options - Load options
     */
    Timeline.prototype._loadFromApi = function(options) {
        var self = this;
        var config = this._config;

        options = options || {};
        var page = options.page || 1;
        var append = options.append || false;

        // Get API URL
        var apiUrl = typeof config.api === 'string' ? config.api : (config.api && config.api.url);
        if (!apiUrl) {
            console.error('[Funky.Timeline] No API URL configured');
            return;
        }

        // Show loading state
        this._setLoadingState(true, append);

        // Build request params
        var params = this._buildApiParams(page);

        // Fire load start event
        this._emit('loadStart', { page: page, append: append });
        if (typeof config.onLoadStart === 'function') {
            config.onLoadStart();
        }

        // Build URL with query string
        var url = apiUrl;
        var queryString = Object.keys(params)
            .map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            })
            .join('&');

        if (queryString) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + queryString;
        }

        // Get API config
        var apiConfig = typeof config.api === 'object' ? config.api : {};
        var method = apiConfig.method || config.apiConfig.method || 'GET';
        var headers = Object.assign({}, config.apiConfig.headers, apiConfig.headers || {});

        // Check for Funky.Api
        if (global.Funky && global.Funky.Api) {
            global.Funky.Api.request({
                url: url,
                method: method,
                headers: headers,
                success: function(response) {
                    self._handleApiResponse(response, append);
                },
                error: function(error) {
                    self._handleApiError(error);
                }
            });
        } else {
            // Fallback to fetch
            fetch(url, {
                method: method,
                headers: headers
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function(data) {
                self._handleApiResponse(data, append);
            })
            .catch(function(error) {
                self._handleApiError(error);
            });
        }
    };

    /**
     * Build API request parameters
     * @private
     * @param {number} page - Page number
     * @returns {Object} Parameters
     */
    Timeline.prototype._buildApiParams = function(page) {
        var config = this._config;
        var apiConfig = typeof config.api === 'object' ? config.api : {};
        var pagination = apiConfig.pagination || config.apiConfig.pagination || {};
        var filter = config.filter || {};

        var params = {};

        // Pagination params
        if (pagination.enabled !== false) {
            var pageParam = pagination.pageParam || 'page';
            var pageSizeParam = pagination.pageSizeParam || 'per_page';

            params[pageParam] = page;
            params[pageSizeParam] = config.pageSize;
        }

        // Filter params
        Object.keys(filter).forEach(function(key) {
            if (filter[key] !== null && filter[key] !== undefined && filter[key] !== '') {
                params[key] = filter[key];
            }
        });

        return params;
    };

    /**
     * Handle API response
     * @private
     * @param {Object} response - API response
     * @param {boolean} append - Whether to append
     */
    Timeline.prototype._handleApiResponse = function(response, append) {
        var config = this._config;
        var apiConfig = typeof config.api === 'object' ? config.api : {};
        var responseMap = apiConfig.responseMap || config.apiConfig.responseMap || {};

        // Extract data using response map
        var events = this._getNestedValue(response, responseMap.data || 'data') || [];
        if (Array.isArray(response) && !events.length) {
            events = response;
        }

        var total = this._getNestedValue(response, responseMap.total || 'total') || 0;
        var page = this._getNestedValue(response, responseMap.page || 'page') || 1;
        var hasMore = this._getNestedValue(response, responseMap.hasMore || 'has_more');

        // Default hasMore calculation if not provided
        if (hasMore === undefined || hasMore === null) {
            hasMore = events.length >= config.pageSize;
        }

        // Store pagination state
        this._currentPage = page;
        this._hasMore = hasMore;
        this._totalCount = total;

        // Update events
        if (append) {
            this._events = this._events.concat(events);
            this._renderAppendedEvents(events);
        } else {
            this.setEvents(events);
        }

        // Hide loading state
        this._setLoadingState(false, append);

        // Fire load end event
        var meta = { total: total, page: page, hasMore: hasMore };
        this._emit('loadEnd', { events: events, meta: meta });

        if (typeof config.onLoadEnd === 'function') {
            config.onLoadEnd(events, meta);
        }

        if (typeof config.onLoad === 'function') {
            config.onLoad(events, page);
        }
    };

    /**
     * Render appended events (for pagination)
     * @private
     * @param {Array} events - New events to append
     */
    Timeline.prototype._renderAppendedEvents = function(events) {
        var self = this;
        var config = this._config;

        if (config.orientation === 'horizontal') {
            var startIndex = this._events.length - events.length;
            events.forEach(function(event, i) {
                self._renderHorizontalEvent(event, startIndex + i);
            });
            this._renderDots();
        } else {
            events.forEach(function(event) {
                self._renderEvent(event, false);
            });
        }
    };

    /**
     * Get nested value from object using dot notation
     * @private
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-notation path
     * @returns {*} Value or undefined
     */
    Timeline.prototype._getNestedValue = function(obj, path) {
        if (!path) return obj;

        var parts = path.split('.');
        var current = obj;

        for (var i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[parts[i]];
        }

        return current;
    };

    /**
     * Handle API error
     * @private
     * @param {Error} error - Error object
     */
    Timeline.prototype._handleApiError = function(error) {
        var config = this._config;

        console.error('[Funky.Timeline] API Error:', error);

        this._setLoadingState(false);
        this._showError(config.errorMessage || 'Failed to load events');

        // Fire error event
        this._emit('loadError', { error: error });

        if (typeof config.onLoadError === 'function') {
            config.onLoadError(error);
        }
    };

    // =========================================================================
    // Loading States
    // =========================================================================

    /**
     * Set loading state
     * @private
     * @param {boolean} loading - Whether loading
     * @param {boolean} append - Whether appending (shows bottom loader vs skeleton)
     */
    Timeline.prototype._setLoadingState = function(loading, append) {
        this._isLoading = loading;
        this._loading = loading;

        if (!this._wrapper) return;

        if (loading) {
            this._wrapper.classAdd('funky-timeline--loading');

            if (append) {
                this._showBottomLoader();
            } else {
                this._showSkeletonLoader();
            }
        } else {
            this._wrapper.classRemove('funky-timeline--loading');
            this._hideLoaders();
        }
    };

    /**
     * Show skeleton loader for initial load
     * @private
     */
    Timeline.prototype._showSkeletonLoader = function() {
        if (this._skeletonLoader) return;

        var config = this._config;
        var skeleton = D.create('div')
            .classAdd('funky-timeline__skeleton');

        for (var i = 0; i < 3; i++) {
            var item = D.create('div')
                .classAdd('funky-timeline__skeleton-item')
                .appendTo(skeleton);

            D.create('div')
                .classAdd('funky-timeline__skeleton-node')
                .appendTo(item);

            var content = D.create('div')
                .classAdd('funky-timeline__skeleton-content')
                .appendTo(item);

            D.create('div')
                .classAdd('funky-timeline__skeleton-title')
                .appendTo(content);

            D.create('div')
                .classAdd('funky-timeline__skeleton-text')
                .appendTo(content);

            D.create('div')
                .classAdd('funky-timeline__skeleton-text')
                .classAdd('funky-timeline__skeleton-text--short')
                .appendTo(content);
        }

        skeleton.appendTo(this._eventsContainer);
        this._skeletonLoader = skeleton;
    };

    /**
     * Show bottom loader for pagination
     * @private
     */
    Timeline.prototype._showBottomLoader = function() {
        if (this._bottomLoader) return;

        var config = this._config;
        var lazyConfig = config.lazyLoad || {};

        var loader = D.create('div')
            .classAdd('funky-timeline__loader')
            .html(
                '<div class="funky-timeline__loader-spinner">' +
                '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>' +
                '</div>' +
                '<span>' + (lazyConfig.loadingText || config.loadingMessage || 'Loading...') + '</span>'
            );

        loader.appendTo(this._wrapper);
        this._bottomLoader = loader;
    };

    /**
     * Hide all loaders
     * @private
     */
    Timeline.prototype._hideLoaders = function() {
        if (this._skeletonLoader) {
            this._skeletonLoader.remove();
            this._skeletonLoader = null;
        }
        if (this._bottomLoader) {
            this._bottomLoader.remove();
            this._bottomLoader = null;
        }
    };

    /**
     * Show error message
     * @private
     * @param {string} message - Error message
     */
    Timeline.prototype._showError = function(message) {
        var errorEl = D.create('div')
            .classAdd('funky-timeline__error')
            .html(
                '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i>' +
                '<span>' + message + '</span>'
            );

        this._eventsContainer.html('');
        errorEl.appendTo(this._eventsContainer);
    };

    // =========================================================================
    // Lazy Loading
    // =========================================================================

    /**
     * Initialize lazy loading / infinite scroll
     * @private
     */
    Timeline.prototype._initLazyLoad = function() {
        var self = this;
        var config = this._config;
        var lazyConfig = config.lazyLoad || {};

        if (!lazyConfig.enabled) return;
        if (!config.api) return;

        var threshold = lazyConfig.threshold || 200;

        // Check for Funky.ScrollTracker
        if (global.Funky && global.Funky.ScrollTracker) {
            var scrollContainer;
            if (config.orientation === 'horizontal' && this._trackContainer) {
                scrollContainer = this._trackContainer.el;
            } else {
                scrollContainer = this._findScrollParent();
            }

            this._scrollTracker = global.Funky.ScrollTracker.create({
                element: scrollContainer === window ? null : scrollContainer,
                useWindow: scrollContainer === window,
                throttle: 100,
                onScroll: function(info) {
                    var distanceFromEnd;
                    if (config.orientation === 'horizontal') {
                        distanceFromEnd = info.scrollWidth - (info.scrollLeft + info.clientWidth);
                    } else {
                        distanceFromEnd = info.scrollHeight - (info.scrollTop + info.clientHeight);
                    }

                    if (distanceFromEnd < threshold && !self._isLoading && self._hasMore) {
                        self.loadMore();
                    }
                }
            });
        } else {
            // Fallback: simple scroll listener
            var scrollContainer = this._findScrollParent();
            var scrollHandler = function() {
                if (self._isLoading || !self._hasMore) return;

                var distanceFromEnd;
                if (scrollContainer === window) {
                    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    var windowHeight = window.innerHeight;
                    var docHeight = document.documentElement.scrollHeight;
                    distanceFromEnd = docHeight - (scrollTop + windowHeight);
                } else {
                    distanceFromEnd = scrollContainer.scrollHeight - (scrollContainer.scrollTop + scrollContainer.clientHeight);
                }

                if (distanceFromEnd < threshold) {
                    self.loadMore();
                }
            };

            if (scrollContainer === window) {
                window.addEventListener('scroll', scrollHandler, { passive: true });
            } else {
                scrollContainer.addEventListener('scroll', scrollHandler, { passive: true });
            }

            this._scrollHandler = scrollHandler;
            this._scrollContainer = scrollContainer;
        }
    };

    /**
     * Find the scroll parent element
     * @private
     * @returns {Element|Window} Scroll container
     */
    Timeline.prototype._findScrollParent = function() {
        var node = this._wrapper.el.parentElement;

        while (node) {
            var style = window.getComputedStyle(node);
            var overflow = style.overflowY;

            if (overflow === 'auto' || overflow === 'scroll') {
                return node;
            }

            node = node.parentElement;
        }

        return window;
    };

    // =========================================================================
    // Grouping
    // =========================================================================

    /**
     * Get group key for an event
     * @private
     * @param {Object} event - Event data
     * @returns {string} Group key
     */
    Timeline.prototype._getGroupKey = function(event) {
        var config = this._config;
        var timestamp = new Date(event.timestamp);

        if (config.groupBy === 'none') {
            return 'all';
        }

        if (config.groupBy === 'week') {
            // Get Monday of the week (Monday = 1, Sunday = 0)
            var weekStart = new Date(timestamp);
            var day = weekStart.getDay();
            // Adjust: if Sunday (0), go back 6 days; otherwise go back (day - 1)
            var diff = day === 0 ? -6 : 1 - day;
            weekStart.setDate(weekStart.getDate() + diff);
            weekStart.setHours(0, 0, 0, 0);
            return 'week-' + weekStart.toISOString().split('T')[0];
        }

        if (config.groupBy === 'month') {
            return 'month-' + timestamp.getFullYear() + '-' + String(timestamp.getMonth() + 1).padStart(2, '0');
        }

        // Default: day
        return timestamp.toISOString().split('T')[0];
    };

    /**
     * Get or create a group for the given key
     * @private
     * @param {string} groupKey - Group key
     * @param {Object} event - Event data (for label generation)
     * @returns {Object} Group object with el and key
     */
    Timeline.prototype._getOrCreateGroup = function(groupKey, event) {
        if (this._groups[groupKey]) {
            return this._groups[groupKey];
        }

        var label = this._getGroupLabel(groupKey, event);
        var groupId = 'timeline-group-' + groupKey.replace(/[^a-z0-9]/gi, '-');

        // Create group element
        var groupEl = D.create('div')
            .classAdd('funky-timeline__group')
            .attr('data-date', groupKey);

        // Group header
        D.create('h3')
            .classAdd('funky-timeline__date')
            .attr('id', groupId)
            .text(label)
            .appendTo(groupEl);

        // Events list
        D.create('ol')
            .classAdd('funky-timeline__events')
            .attr({
                'role': 'list',
                'aria-labelledby': groupId
            })
            .appendTo(groupEl);

        // Insert in chronological order
        this._insertGroupInOrder(groupEl, groupKey);

        this._groups[groupKey] = {
            key: groupKey,
            label: label,
            el: groupEl
        };

        return this._groups[groupKey];
    };

    /**
     * Insert group in chronological order
     * @private
     * @param {Object} groupEl - Funky.Dom element
     * @param {string} groupKey - Group key (date string)
     */
    Timeline.prototype._insertGroupInOrder = function(groupEl, groupKey) {
        var inserted = false;

        for (var i = 0; i < this._groupOrder.length; i++) {
            if (groupKey > this._groupOrder[i]) {
                var existingGroup = this._groups[this._groupOrder[i]];
                if (existingGroup && existingGroup.el) {
                    this._eventsContainer.el.insertBefore(groupEl.el, existingGroup.el.el);
                    this._groupOrder.splice(i, 0, groupKey);
                    inserted = true;
                    break;
                }
            }
        }

        if (!inserted) {
            groupEl.appendTo(this._eventsContainer);
            this._groupOrder.push(groupKey);
        }
    };

    /**
     * Get human-readable group label
     * @private
     * @param {string} groupKey - Group key
     * @param {Object} event - Event for timestamp
     * @returns {string} Label
     */
    Timeline.prototype._getGroupLabel = function(groupKey, event) {
        var config = this._config;
        var labels = config.groupLabels || {};
        var timestamp = new Date(event.timestamp);
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var eventDate = new Date(timestamp);
        eventDate.setHours(0, 0, 0, 0);

        if (config.groupBy === 'none') {
            return this._getLabelValue(labels.all, timestamp, 'All Events');
        }

        if (config.groupBy === 'week') {
            return this._formatWeekLabel(groupKey, timestamp);
        }

        if (config.groupBy === 'month') {
            return this._formatMonthLabel(timestamp);
        }

        // Day grouping - smart labels
        return this._formatDayLabel(eventDate, today, timestamp, labels);
    };

    /**
     * Format day group label with smart detection
     * @private
     * @param {Date} eventDate - Event date (midnight)
     * @param {Date} today - Today (midnight)
     * @param {Date} timestamp - Original timestamp
     * @param {Object} labels - Custom labels config
     * @returns {string} Label
     */
    Timeline.prototype._formatDayLabel = function(eventDate, today, timestamp, labels) {
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        var weekStart = this._getWeekStart(today);
        var lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Today
        if (eventDate.getTime() === today.getTime()) {
            return this._getLabelValue(labels.today, timestamp, 'Today');
        }

        // Yesterday
        if (eventDate.getTime() === yesterday.getTime()) {
            return this._getLabelValue(labels.yesterday, timestamp, 'Yesterday');
        }

        // This week (but not today/yesterday)
        if (eventDate >= weekStart && eventDate < yesterday) {
            if (typeof labels.thisWeek === 'function') {
                return labels.thisWeek(timestamp);
            }
            return this._getDayName(timestamp);
        }

        // Last week
        if (eventDate >= lastWeekStart && eventDate < weekStart) {
            return this._getLabelValue(labels.lastWeek, timestamp, 'Last Week');
        }

        // Earlier this month (but before last week)
        if (eventDate >= monthStart && eventDate < lastWeekStart) {
            return this._getLabelValue(labels.thisMonth, timestamp, 'Earlier this Month');
        }

        // Older - show full date
        if (typeof labels.older === 'function') {
            return labels.older(timestamp);
        }
        return this._formatMonthLabel(timestamp);
    };

    /**
     * Format week group label
     * @private
     * @param {string} groupKey - Week group key (week-YYYY-MM-DD)
     * @param {Date} timestamp - Event timestamp
     * @returns {string} Label
     */
    Timeline.prototype._formatWeekLabel = function(groupKey, timestamp) {
        var config = this._config;
        var labels = config.groupLabels || {};

        // Parse week start from group key
        var weekStartStr = groupKey.replace('week-', '');
        var weekStart = new Date(weekStartStr + 'T00:00:00');

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var thisWeekStart = this._getWeekStart(today);
        var lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        // This week
        if (weekStart.getTime() === thisWeekStart.getTime()) {
            return this._getLabelValue(labels.thisWeek, timestamp, 'This Week');
        }

        // Last week
        if (weekStart.getTime() === lastWeekStart.getTime()) {
            return this._getLabelValue(labels.lastWeek, timestamp, 'Last Week');
        }

        // Show week date range
        var weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var startStr = months[weekStart.getMonth()] + ' ' + weekStart.getDate();
        var endStr = months[weekEnd.getMonth()] + ' ' + weekEnd.getDate();

        // Add year if different from current year
        if (weekStart.getFullYear() !== today.getFullYear()) {
            endStr += ', ' + weekEnd.getFullYear();
        }

        return startStr + ' - ' + endStr;
    };

    /**
     * Format month group label
     * @private
     * @param {Date} timestamp - Event timestamp
     * @returns {string} Label
     */
    Timeline.prototype._formatMonthLabel = function(timestamp) {
        var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return monthNames[timestamp.getMonth()] + ' ' + timestamp.getFullYear();
    };

    /**
     * Get Monday of the week for a given date
     * @private
     * @param {Date} date
     * @returns {Date} Monday of that week
     */
    Timeline.prototype._getWeekStart = function(date) {
        var weekStart = new Date(date);
        var day = weekStart.getDay();
        // Sunday = 0, so go back 6 days; otherwise go back (day - 1)
        var diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(weekStart.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    };

    /**
     * Get label value from config (supports string or function)
     * @private
     * @param {string|Function} label - Label or label function
     * @param {Date} date - Date for function labels
     * @param {string} fallback - Fallback value
     * @returns {string} Label
     */
    Timeline.prototype._getLabelValue = function(label, date, fallback) {
        if (typeof label === 'function') {
            return label(date);
        }
        return label || fallback;
    };

    // =========================================================================
    // Formatting Helpers
    // =========================================================================

    /**
     * Format time for display
     * @private
     * @param {Date} date
     * @returns {string}
     */
    Timeline.prototype._formatTime = function(date) {
        var config = this._config;
        var format = config.timeFormat || 'absolute';

        // Use Funky.RelativeTime if available and configured
        if ((format === 'relative' || format === 'both') && config.useRelativeTime) {
            var RelativeTime = global.Funky && global.Funky.RelativeTime;
            if (RelativeTime) {
                var relative = RelativeTime.format(date);
                if (format === 'relative') {
                    return relative;
                }
                // 'both' - show relative with absolute in parentheses
                return relative + ' (' + this._formatAbsoluteTime(date) + ')';
            }
        }

        return this._formatAbsoluteTime(date);
    };

    /**
     * Format absolute time (12-hour format)
     * @private
     * @param {Date} date
     * @returns {string}
     */
    Timeline.prototype._formatAbsoluteTime = function(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
    };

    /**
     * Format date for display
     * @private
     * @param {Date} date
     * @returns {string}
     */
    Timeline.prototype._formatDate = function(date) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    };

    /**
     * Get day name
     * @private
     * @param {Date} date
     * @returns {string}
     */
    Timeline.prototype._getDayName = function(date) {
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    };

    /**
     * Format category name
     * @private
     * @param {string} category
     * @returns {string}
     */
    Timeline.prototype._formatCategory = function(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    };

    // =========================================================================
    // State Management
    // =========================================================================

    /**
     * Show loading state
     * @private
     */
    Timeline.prototype._showLoading = function() {
        this._loading = true;
        this._wrapper.attr('aria-busy', 'true');
        this._loadingEl.el.hidden = false;
    };

    /**
     * Hide loading state
     * @private
     */
    Timeline.prototype._hideLoading = function() {
        this._loading = false;
        this._wrapper.attr('aria-busy', 'false');
        this._loadingEl.el.hidden = true;
    };

    /**
     * Show empty state
     * @private
     */
    Timeline.prototype._showEmpty = function() {
        this._emptyEl.el.hidden = false;
    };

    /**
     * Hide empty state
     * @private
     */
    Timeline.prototype._hideEmpty = function() {
        this._emptyEl.el.hidden = true;
    };

    // =========================================================================
    // Event Emission
    // =========================================================================

    /**
     * Emit a timeline event
     * @private
     * @param {string} type - Event type
     * @param {Object} detail - Event detail
     */
    Timeline.prototype._emit = function(type, detail) {
        if (this._wrapper && this._wrapper.el) {
            E.emit(this._wrapper.el, 'funky.timeline.' + type, detail);
        }
    };

    // =========================================================================
    // LiveBinding Integration
    // =========================================================================

    /**
     * Initialize LiveBinding for real-time updates
     * @private
     */
    Timeline.prototype._initLiveBinding = function() {
        var self = this;
        var config = this._config;
        var lbConfig = config.liveBinding;

        if (!lbConfig || !lbConfig.enabled) return;

        // Check for LiveBinding support
        if (!global.Funky.LiveBinding) {
            console.warn('[Funky.Timeline] Funky.LiveBinding not available');
            return;
        }

        // Create hidden container for binding
        var bindContainer = D.create('div')
            .classAdd('funky-timeline__live-bind')
            .appendTo(this._wrapper);

        // Build LiveBinding options
        var bindOptions = {
            source: lbConfig.source || 'websocket',
            transform: function(data) {
                self._handleLiveData(data);
                return data;
            }
        };

        // Source-specific options
        switch (lbConfig.source) {
            case 'websocket':
                bindOptions.channel = lbConfig.channel || 'timeline:events';
                break;
            case 'event':
                bindOptions.event = lbConfig.event;
                break;
            case 'cache':
                bindOptions.key = lbConfig.key;
                break;
            case 'api':
                bindOptions.url = lbConfig.url;
                bindOptions.interval = lbConfig.interval;
                break;
        }

        // Create binding
        this._liveBinding = global.Funky.LiveBinding.bind(bindContainer.el, bindOptions);

        // Status indicator
        if (config.showStatus) {
            this._createStatusIndicator();
            this._setupStatusListeners();
        }
    };

    /**
     * Create connection status indicator
     * @private
     */
    Timeline.prototype._createStatusIndicator = function() {
        var indicator = D.create('div')
            .classAdd('funky-timeline__status');

        var dot = D.create('span')
            .classAdd('funky-timeline__status-dot');

        var text = D.create('span')
            .classAdd('funky-timeline__status-text')
            .text('Connecting...');

        indicator.append(dot, text);

        // Insert at top of timeline
        if (this._wrapper) {
            this._wrapper.el.insertBefore(indicator.el, this._wrapper.el.firstChild);
        }

        this._statusIndicator = indicator;
        this._statusDot = dot;
        this._statusText = text;
    };

    /**
     * Setup WebSocket connection listeners
     * @private
     */
    Timeline.prototype._setupStatusListeners = function() {
        var self = this;

        // Listen for WebSocket connection events
        if (global.Funky.WebSocket) {
            global.Funky.WebSocket.on('connect', function() {
                self._onLiveConnect();
            });

            global.Funky.WebSocket.on('disconnect', function() {
                self._onLiveDisconnect();
            });

            // Initial state
            this._liveConnected = global.Funky.WebSocket.isConnected 
                ? global.Funky.WebSocket.isConnected() 
                : false;
            this._updateStatusIndicator();
        }
    };

    /**
     * Handle live connection established
     * @private
     */
    Timeline.prototype._onLiveConnect = function() {
        var config = this._config;

        this._liveConnected = true;
        this._updateStatusIndicator();

        // Announce for accessibility
        if (global.Funky.Announce) {
            global.Funky.Announce.polite('Timeline connected, receiving live updates');
        }

        this._emit('liveConnect', {});

        if (config.onLiveConnect) {
            config.onLiveConnect();
        }
    };

    /**
     * Handle live connection lost
     * @private
     */
    Timeline.prototype._onLiveDisconnect = function() {
        var config = this._config;

        this._liveConnected = false;
        this._updateStatusIndicator();

        this._emit('liveDisconnect', {});

        if (config.onLiveDisconnect) {
            config.onLiveDisconnect();
        }
    };

    /**
     * Update status indicator UI
     * @private
     */
    Timeline.prototype._updateStatusIndicator = function() {
        if (!this._statusIndicator) return;

        if (this._liveConnected) {
            this._statusDot
                .classRemove('funky-timeline__status-dot--disconnected')
                .classAdd('funky-timeline__status-dot--connected');
            this._statusText.text('Live');
        } else {
            this._statusDot
                .classRemove('funky-timeline__status-dot--connected')
                .classAdd('funky-timeline__status-dot--disconnected');
            this._statusText.text('Reconnecting...');
        }
    };

    /**
     * Handle incoming live data
     * @private
     * @param {Object|Array} data - Live data
     */
    Timeline.prototype._handleLiveData = function(data) {
        var self = this;

        // Handle array of events (batch)
        if (Array.isArray(data)) {
            if (data.length > 1) {
                this._addBatchEvents(data);
            } else if (data.length === 1) {
                this._processLiveEvent(data[0]);
            }
            return;
        }

        // Handle single event
        this._processLiveEvent(data);
    };

    /**
     * Process a single live event
     * @private
     * @param {Object} data - Event data
     */
    Timeline.prototype._processLiveEvent = function(data) {
        var config = this._config;
        var lbConfig = config.liveBinding || {};

        // Determine action from message
        var action = 'add';

        if (lbConfig.actionField && data[lbConfig.actionField]) {
            action = data[lbConfig.actionField];
        } else if (lbConfig.actionMap) {
            var msgType = data.type || data.event;
            action = lbConfig.actionMap[msgType] || 'add';
        }

        // Extract event data
        var eventData = data.data || data.payload || data;

        // Validate
        var keyField = lbConfig.keyField || 'id';
        if (!eventData || !eventData[keyField]) {
            console.warn('[Funky.Timeline] Invalid live event data:', eventData);
            return;
        }

        // Fire callback
        this._emit('liveEvent', { event: eventData, action: action });

        if (config.onLiveEvent) {
            config.onLiveEvent(eventData, action);
        }

        // Perform action
        switch (action) {
            case 'add':
                this._addLiveEvent(eventData);
                break;
            case 'update':
                this._updateLiveEvent(eventData);
                break;
            case 'remove':
                this._removeLiveEvent(eventData);
                break;
        }
    };

    /**
     * Add a live event with animation
     * @private
     * @param {Object} event - Event data
     */
    Timeline.prototype._addLiveEvent = function(event) {
        var self = this;
        var config = this._config;
        var animConfig = config.animation || {};
        var insertPosition = config.insertPosition || 'top';

        // Check for duplicates
        var existingIndex = this._findEventIndex(event.id);
        if (existingIndex !== -1) {
            this._updateLiveEvent(event);
            return;
        }

        // Determine insert position
        var insertIndex;
        switch (insertPosition) {
            case 'top':
                insertIndex = 0;
                break;
            case 'bottom':
                insertIndex = this._events.length;
                break;
            case 'chronological':
                insertIndex = this._findChronologicalPosition(event);
                break;
            default:
                insertIndex = 0;
        }

        // Add to events array
        this._events.splice(insertIndex, 0, event);

        // Render the new event
        var eventEl = this._renderEvent(event, insertIndex === 0);

        if (!eventEl) return;

        // Animate entry using Funky.Animate
        if (animConfig.enabled !== false && global.Funky.Animate) {
            eventEl.classAdd('funky-timeline__event--new');

            global.Funky.Animate.slide(eventEl.el, 'in', {
                from: 'top',
                duration: animConfig.duration || 300,
                onComplete: function() {
                    // Remove highlight after delay
                    setTimeout(function() {
                        if (eventEl && eventEl.el) {
                            eventEl.classRemove('funky-timeline__event--new');
                        }
                    }, animConfig.highlightDuration || 2000);
                }
            });
        } else if (animConfig.enabled !== false) {
            // CSS fallback
            eventEl.classAdd('funky-timeline__event--new');
            eventEl.classAdd('funky-timeline__event--animating');

            setTimeout(function() {
                if (eventEl && eventEl.el) {
                    eventEl.classRemove('funky-timeline__event--animating');
                }
            }, animConfig.duration || 300);

            setTimeout(function() {
                if (eventEl && eventEl.el) {
                    eventEl.classRemove('funky-timeline__event--new');
                }
            }, animConfig.highlightDuration || 2000);
        }

        // Announce for accessibility
        if (global.Funky.Announce) {
            global.Funky.Announce.polite('New event: ' + (event.title || 'Untitled'));
        }

        this._hideEmpty();
    };

    /**
     * Update an existing live event
     * @private
     * @param {Object} event - Updated event data
     */
    Timeline.prototype._updateLiveEvent = function(event) {
        var config = this._config;
        var animConfig = config.animation || {};

        // Find existing event
        var index = this._findEventIndex(event.id);
        if (index === -1) {
            this._addLiveEvent(event);
            return;
        }

        // Update in array
        this._events[index] = Object.assign({}, this._events[index], event);

        // Find and update DOM element
        var eventEl = D.one(this._wrapper.el.querySelector('[data-event-id="' + event.id + '"]'));
        if (!eventEl) return;

        // Update content
        var titleEl = eventEl.el.querySelector('.funky-timeline__title');
        if (titleEl && event.title) {
            titleEl.textContent = event.title;
        }

        var descEl = eventEl.el.querySelector('.funky-timeline__description');
        if (descEl && event.description) {
            descEl.textContent = event.description;
        }

        // Update icon
        var iconEl = eventEl.el.querySelector('.funky-timeline__marker i');
        if (iconEl && event.icon) {
            iconEl.className = event.icon;
        }

        // Flash animation
        if (animConfig.enabled !== false) {
            eventEl.classAdd('funky-timeline__event--updated');

            setTimeout(function() {
                if (eventEl && eventEl.el) {
                    eventEl.classRemove('funky-timeline__event--updated');
                }
            }, animConfig.highlightDuration || 2000);
        }
    };

    /**
     * Remove a live event with animation
     * @private
     * @param {Object|string|number} event - Event data or ID
     */
    Timeline.prototype._removeLiveEvent = function(event) {
        var self = this;
        var config = this._config;
        var animConfig = config.animation || {};

        var eventId = typeof event === 'object' ? event.id : event;

        // Find in array
        var index = this._findEventIndex(eventId);
        if (index === -1) return;

        // Find DOM element
        var eventEl = D.one(this._wrapper.el.querySelector('[data-event-id="' + eventId + '"]'));
        if (!eventEl) {
            // Remove from array even if element not found
            this._events.splice(index, 1);
            return;
        }

        // Animate out using Funky.Animate
        if (animConfig.enabled !== false && global.Funky.Animate) {
            global.Funky.Animate.slide(eventEl.el, 'out', {
                from: 'left',
                duration: animConfig.duration || 300,
                onComplete: function() {
                    self._removeEventElement(eventEl, eventId, index);
                }
            });
        } else if (animConfig.enabled !== false) {
            // CSS fallback
            eventEl.classAdd('funky-timeline__event--removing');

            setTimeout(function() {
                self._removeEventElement(eventEl, eventId, index);
            }, animConfig.duration || 300);
        } else {
            this._removeEventElement(eventEl, eventId, index);
        }
    };

    /**
     * Remove event element and cleanup
     * @private
     * @param {Object} eventEl - Event element
     * @param {string|number} eventId - Event ID
     * @param {number} index - Array index
     */
    Timeline.prototype._removeEventElement = function(eventEl, eventId, index) {
        // Get group before removing
        var group = eventEl.el.closest('.funky-timeline__group');

        eventEl.remove();

        // Remove from array (re-find index in case array changed)
        var currentIndex = this._findEventIndex(eventId);
        if (currentIndex !== -1) {
            this._events.splice(currentIndex, 1);
        }

        // Remove empty group
        if (group) {
            var remainingEvents = group.querySelectorAll('.funky-timeline__event');
            if (remainingEvents.length === 0) {
                var groupKey = group.getAttribute('data-date');
                delete this._groups[groupKey];
                this._groupOrder = this._groupOrder.filter(function(k) {
                    return k !== groupKey;
                });
                group.remove();
            }
        }

        // Show empty state if no events left
        if (this._events.length === 0) {
            this._showEmpty();
        }
    };

    /**
     * Add batch of events with stagger animation
     * @private
     * @param {Array} events - Array of events
     */
    Timeline.prototype._addBatchEvents = function(events) {
        var self = this;
        var config = this._config;
        var animConfig = config.animation || {};
        var staggerDelay = animConfig.stagger || 50;

        // Filter out duplicates
        var newEvents = events.filter(function(event) {
            return self._findEventIndex(event.id) === -1;
        });

        if (newEvents.length === 0) return;

        // Prepare elements for stagger animation
        if (animConfig.enabled !== false && global.Funky.Animate && global.Funky.Animate.stagger) {
            // First render all events hidden
            var elements = [];
            newEvents.forEach(function(event) {
                self._events.unshift(event);
                var eventEl = self._renderEvent(event, true);
                if (eventEl) {
                    eventEl.style({ opacity: '0', transform: 'translateY(-20px)' });
                    elements.push(eventEl.el);
                }
            });

            // Then animate them in with stagger
            global.Funky.Animate.stagger(elements, {
                animation: { opacity: '1', transform: 'translateY(0)' },
                duration: animConfig.duration || 300,
                delay: staggerDelay
            });
        } else {
            // No animation, just render
            newEvents.forEach(function(event) {
                self._addLiveEvent(event);
            });
        }

        // Announce for accessibility
        if (global.Funky.Announce && newEvents.length > 0) {
            global.Funky.Announce.polite(newEvents.length + ' new events added');
        }

        this._hideEmpty();
    };

    /**
     * Find event index by ID
     * @private
     * @param {string|number} eventId - Event ID
     * @returns {number} Index or -1 if not found
     */
    Timeline.prototype._findEventIndex = function(eventId) {
        var events = this._events;
        var idStr = String(eventId);
        for (var i = 0; i < events.length; i++) {
            if (String(events[i].id) === idStr) {
                return i;
            }
        }
        return -1;
    };

    /**
     * Find chronological position for event
     * @private
     * @param {Object} newEvent - New event
     * @returns {number} Insert index
     */
    Timeline.prototype._findChronologicalPosition = function(newEvent) {
        var newDate = new Date(newEvent.timestamp);
        var events = this._events;

        for (var i = 0; i < events.length; i++) {
            var existingDate = new Date(events[i].timestamp);
            if (newDate > existingDate) {
                return i;
            }
        }

        return events.length;
    };

    /**
     * Destroy live binding
     * @private
     */
    Timeline.prototype._destroyLiveBinding = function() {
        // Destroy LiveBinding
        if (this._liveBinding) {
            if (this._liveBinding.destroy) {
                this._liveBinding.destroy();
            }
            this._liveBinding = null;
        }

        // Remove status indicator
        if (this._statusIndicator) {
            this._statusIndicator.remove();
            this._statusIndicator = null;
            this._statusDot = null;
            this._statusText = null;
        }

        this._liveConnected = false;
    };

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Set events (replaces existing)
     * @param {Array} events - Array of event objects
     * @returns {Timeline}
     */
    Timeline.prototype.setEvents = function(events) {
        this._events = events || [];
        this._renderEvents(this._events, false);
        return this;
    };

    /**
     * Add a single event (prepends to top)
     * @param {Object} event - Event object
     * @returns {Timeline}
     */
    Timeline.prototype.addEvent = function(event) {
        // Add to beginning of array
        this._events.unshift(event);
        this._renderEvent(event, true);
        this._hideEmpty();
        return this;
    };

    /**
     * Add multiple events
     * @param {Array} events - Events to add
     * @param {boolean} prepend - Whether to prepend (default: true)
     * @returns {Timeline}
     */
    Timeline.prototype.addEvents = function(events, prepend) {
        var self = this;
        if (prepend !== false) {
            // Prepend in reverse order to maintain order
            events.slice().reverse().forEach(function(event) {
                self.addEvent(event);
            });
        } else {
            events.forEach(function(event) {
                self._events.push(event);
                self._renderEvent(event, false);
            });
            this._hideEmpty();
        }
        return this;
    };

    /**
     * Remove an event by ID
     * @param {string|number} eventId - Event ID
     * @returns {Timeline}
     */
    Timeline.prototype.removeEvent = function(eventId) {
        var self = this;
        var eventIdStr = String(eventId);

        // Remove from data
        this._events = this._events.filter(function(e) {
            return String(e.id) !== eventIdStr;
        });

        // Remove from DOM
        var eventEl = this._wrapper.el.querySelector('[data-event-id="' + eventIdStr + '"]');
        if (eventEl) {
            var group = eventEl.closest('.funky-timeline__group');
            eventEl.remove();

            // Remove empty group
            if (group) {
                var remainingEvents = group.querySelectorAll('.funky-timeline__event');
                if (remainingEvents.length === 0) {
                    var groupKey = group.getAttribute('data-date');
                    delete this._groups[groupKey];
                    this._groupOrder = this._groupOrder.filter(function(k) {
                        return k !== groupKey;
                    });
                    group.remove();
                }
            }
        }

        // Show empty if no events
        if (this._events.length === 0) {
            this._showEmpty();
        }

        return this;
    };

    /**
     * Get an event by ID
     * @param {string|number} eventId - Event ID
     * @returns {Object|null}
     */
    Timeline.prototype.getEvent = function(eventId) {
        var eventIdStr = String(eventId);
        for (var i = 0; i < this._events.length; i++) {
            if (String(this._events[i].id) === eventIdStr) {
                return this._events[i];
            }
        }
        return null;
    };

    /**
     * Get all events
     * @returns {Array}
     */
    Timeline.prototype.getEvents = function() {
        return this._events.slice();
    };

    /**
     * Load events from API
     * @returns {Timeline}
     */
    Timeline.prototype.load = function() {
        this._currentPage = 0;
        this._hasMore = true;
        this._loadFromApi({ page: 1, append: false });
        return this;
    };

    /**
     * Load more events (next page)
     * @returns {Timeline}
     */
    Timeline.prototype.loadMore = function() {
        if (this._isLoading || !this._hasMore) {
            return this;
        }
        var nextPage = (this._currentPage || 0) + 1;
        this._loadFromApi({ page: nextPage, append: true });
        return this;
    };

    /**
     * Refresh timeline (reload from page 1)
     * @returns {Timeline}
     */
    Timeline.prototype.refresh = function() {
        return this.load();
    };

    /**
     * Apply filter and reload
     * @param {Object} filterOptions - Filter options
     * @returns {Timeline}
     */
    Timeline.prototype.filter = function(filterOptions) {
        this._config.filter = Object.assign({}, this._config.filter, filterOptions);
        return this.load();
    };

    /**
     * Clear all filters and reload
     * @returns {Timeline}
     */
    Timeline.prototype.clearFilter = function() {
        this._config.filter = {};
        return this.load();
    };

    /**
     * Set date range filter
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Timeline}
     */
    Timeline.prototype.setDateRange = function(startDate, endDate) {
        return this.filter({
            start_date: startDate,
            end_date: endDate
        });
    };

    /**
     * Search events
     * @param {string} query - Search query
     * @returns {Timeline}
     */
    Timeline.prototype.search = function(query) {
        return this.filter({ search: query });
    };

    /**
     * Push an event with animation (alias for live add)
     * @param {Object} event - Event object
     * @returns {Timeline}
     */
    Timeline.prototype.pushEvent = function(event) {
        this._addLiveEvent(event);
        return this;
    };

    /**
     * Update an event with animation
     * @param {Object} event - Event object with id
     * @returns {Timeline}
     */
    Timeline.prototype.updateEvent = function(event) {
        this._updateLiveEvent(event);
        return this;
    };

    /**
     * Check if live binding is connected
     * @returns {boolean}
     */
    Timeline.prototype.isConnected = function() {
        return this._liveConnected;
    };

    /**
     * Rebind to different live source
     * @param {Object} options - LiveBinding options
     * @returns {Timeline}
     */
    Timeline.prototype.rebind = function(options) {
        // Destroy existing binding
        this._destroyLiveBinding();

        // Update config
        this._config.liveBinding = Object.assign(
            {},
            this._config.liveBinding,
            options,
            { enabled: true }
        );

        // Reinitialize
        this._initLiveBinding();

        return this;
    };

    /**
     * Clear all events
     * @returns {Timeline}
     */
    Timeline.prototype.clear = function() {
        this._events = [];
        this._groups = {};
        this._groupOrder = [];
        this._currentPage = 0;
        this._hasMore = true;
        this._eventsContainer.html('');
        this._showEmpty();
        return this;
    };

    /**
     * Destroy the timeline instance
     */
    Timeline.prototype.destroy = function() {
        // Destroy LiveBinding
        this._destroyLiveBinding();

        // Destroy scroll tracker
        if (this._scrollTracker) {
            this._scrollTracker.destroy();
            this._scrollTracker = null;
        }

        // Remove scroll listener fallback
        if (this._scrollHandler && this._scrollContainer) {
            if (this._scrollContainer === window) {
                window.removeEventListener('scroll', this._scrollHandler);
            } else {
                this._scrollContainer.removeEventListener('scroll', this._scrollHandler);
            }
        }

        // Hide loaders
        this._hideLoaders();

        // Remove event listeners
        if (this._wrapper) {
            this._wrapper.off('click');
            this._wrapper.off('keydown');
            this._wrapper.remove();
        }

        // Remove container classes and attributes
        var container = this._container;
        if (container) {
            if (container.el) container = container.el;
            container.classList.remove('funky-timeline');
            container.classList.remove('funky-timeline--vertical');
            container.classList.remove('funky-timeline--horizontal');
            container.classList.remove('funky-timeline--centered');
            container.classList.remove('funky-timeline--compact');
            container.classList.remove('funky-timeline--spacious');
            container.removeAttribute('data-timeline-id');
            container.removeAttribute('role');
            container.removeAttribute('aria-label');
            container.innerHTML = '';
        }

        // Emit destroy event before clearing references
        this._emit('destroy', {});

        // Remove from registry
        if (this._instanceId) {
            _instances.unregister(this._instanceId);
        }

        // Clear references
        this._container = null;
        this._wrapper = null;
        this._eventsContainer = null;
        this._loadingEl = null;
        this._emptyEl = null;
        this._events = [];
        this._groups = {};
        this._groupOrder = [];
        this._currentPage = 0;
        this._hasMore = false;
        this._initialized = false;
    };

    // =========================================================================
    // Factory Method
    // =========================================================================

    /**
     * Create a new Timeline instance
     * @param {string|Element} container - Container selector or element
     * @param {Object} options - Configuration options
     * @returns {Timeline}
     */
    function create(container, options) {
        var el = typeof container === 'string' ? D.one(container) : container;

        // Unwrap ElementWrapper if needed (D.one returns ElementWrapper)
        // Check for .el property existing (could be null) and extract it
        if (el && typeof el === 'object' && 'el' in el) {
            el = el.el;
        }

        if (!el) {
            console.warn('[Funky.Timeline] Container not found:', container);
            return null;
        }
        
        // Check for existing instance
        var existingId = el.getAttribute('data-timeline-id');
        if (existingId && _instances.get(existingId)) {
            return _instances.get(existingId);
        }
        
        var timeline = new Timeline(el, options);
        var id = 'timeline-' + (++instanceId);
        el.setAttribute('data-timeline-id', id);
        _instances.register(id, timeline);
        
        // Store id on instance for cleanup
        timeline._instanceId = id;
        
        return timeline;
    }

    // =========================================================================
    // API Object
    // =========================================================================

    var Timeline_API = {
        /**
         * Create a timeline instance
         */
        create: create,
        
        /**
         * Get timeline instance by element
         */
        getInstance: function(target) {
            var el = typeof target === 'string' ? D.one(target) : target;
            if (!el) return null;
            if (el.el) el = el.el;
            
            var id = el.getAttribute('data-timeline-id');
            return id ? _instances.get(id) : null;
        },
        
        /**
         * Initialize all timelines with data-timeline attribute
         */
        init: function(container) {
            container = container || document;
            D.all(container.querySelectorAll('[data-timeline]')).each(function(el) {
                var element = el.el || el;
                if (element.getAttribute('data-timeline-id')) return;
                create(element);
            });
        },
        
        /**
         * Destroy a timeline instance by ID or element
         * @param {string|HTMLElement} target - Instance ID or element
         */
        destroy: function(target) {
            var instance = this.getInstance(target);
            if (instance) {
                instance.destroy();
            }
        },

        /**
         * Destroy all timeline instances
         */
        destroyAll: function() {
            _instances.destroyAll();
        },

        /**
         * Get all timeline instances
         */
        getAll: function() {
            return _instances.getAll();
        },
        
        /**
         * Default configuration
         */
        DEFAULTS: DEFAULTS
    };

    // =========================================================================
    // Namespace Registration
    // =========================================================================

    Funky.register('Timeline', Timeline_API);

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Timeline_API.init();
        });
    } else {
        Timeline_API.init();
    }

})(window);
