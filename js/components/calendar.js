/**
 * Funky.Calendar
 * 
 * Interactive calendar with month/week/day views and event management.
 * Integrates with LiveBinding for real-time updates.
 * 
 * @example
 * <div data-calendar data-api="/api/events"></div>
 * 
 * // Programmatic creation
 * var cal = Funky.Calendar.create('#my-cal', { api: '/api/events' });
 * cal.goto('2025-02-01');
 */
(function(window) {
    'use strict';

    // Ensure Funky registry exists
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.Calendar] Registry not found. Load namespace.js first.');
        return;
    }

    // Ensure Funky.Date is loaded
    if (!window.Funky.Date) {
        console.error('[Funky.Calendar] Funky.Date not found. Load date.js first.');
        return;
    }

    var D = Funky.Dom;
    var E = Funky.Events;
    var DateUtil = Funky.Date;

    var SELECTOR = '[data-calendar]';
    var instances = Funky.Registry.createInstanceRegistry('Calendar');
    var instanceIdCounter = 0;
    var observer = null;

    // =========================================================================
    // DEFAULT CONFIGURATION
    // =========================================================================

    var defaults = {
        // API
        api: null,                    // API endpoint (null for local-only mode)
        entity: 'events',             // Entity name for events/cache
        source: 'api',                // Data source: 'api', 'cache', 'websocket', 'event'
        liveBinding: true,            // Use LiveBinding for data (false = simple fetch)
        events: null,                 // Pre-loaded events array (for local-only mode)
        
        // View
        view: 'month',                // Initial view: month, week, day, agenda
        date: null,                   // Initial date (defaults to today)
        
        // Field mappings
        dateField: 'start',           // Event start date field
        endField: 'end',              // Event end date field
        titleField: 'title',          // Event title field
        colorField: null,             // Field for color mapping
        colors: {},                   // Color value → theme color map
        
        // Time settings
        startHour: 0,                 // First hour in week/day views
        endHour: 24,                  // Last hour in week/day views
        weekStarts: 0,                // Week start day (0=Sunday)
        slotDuration: 30,             // Minutes per time slot
        
        // Editing
        editable: false,              // Enable drag-drop
        clickable: true,              // Enable event clicks
        
        // Locale
        locale: (typeof navigator !== 'undefined' && navigator.language) || 'en-US',
        timezone: null,               // null = local timezone
        
        // Display
        showWeekNumbers: false,
        showToday: true,
        maxEventsPerCell: 3,          // "+N more" after this
        
        // Form configuration
        fields: null,                 // Custom field definitions for modals
        
        // Callbacks
        onInit: null,
        onNavigate: null,
        onViewChange: null,
        onEventClick: null,
        onDateSelect: null
    };

    // =========================================================================
    // CALENDAR INSTANCE CLASS
    // =========================================================================

    /**
     * Calendar instance
     * @param {HTMLElement} element - Container element
     * @param {Object} options - Configuration options
     */
    function Calendar(element, options) {
        this.id = 'cal_' + (++instanceIdCounter);
        this.element = element;
        this.options = Object.assign({}, defaults, options);
        
        // State
        this.currentDate = null;      // Currently focused date
        this.currentView = null;      // Current view mode
        this.events = [];             // Loaded events
        this.selectedDate = null;     // User-selected date
        this.loading = false;
        this.destroyed = false;
        
        // DOM references
        this._header = null;
        this._body = null;
        this._title = null;
        
        // LiveBinding instance
        this._binding = null;
        
        // Swipe navigation gesture tracker
        this._swipeGesture = null;
        
        // Mark element
        element.setAttribute('data-calendar-id', this.id);
        
        this._init();
    }

    /**
     * Initialize the calendar
     */
    Calendar.prototype._init = function() {
        var self = this;
        var opts = this.options;
        
        // Set initial date
        this.currentDate = opts.date ? new Date(opts.date) : new Date();
        this.currentView = opts.view;
        
        // Build structure
        this._buildStructure();
        
        // Setup double-click for event creation
        this._setupDateDoubleClick();
        
        // Setup drag and drop
        if (opts.editable) {
            this._setupDragDrop();
            this._setupTouchHandlers();
        }
        
        // Setup accessibility
        this._setupKeyboardNav();
        this._applyAriaAttributes();
        this._createLiveRegion();
        
        // Setup LiveBinding for events
        this._setupBinding();
        
        // Emit init event
        E.emit(this.element, 'funky.calendar.init', {
            id: this.id,
            view: this.currentView,
            date: this.currentDate.toISOString()
        });
        
        // Callback
        if (typeof opts.onInit === 'function') {
            opts.onInit(this);
        }
    };

    /**
     * Build calendar DOM structure
     */
    Calendar.prototype._buildStructure = function() {
        var el = D.one(this.element);
        if (!el) return;
        
        el.classAdd('funky-calendar');
        el.attr('role', 'application');
        el.attr('aria-label', 'Calendar');
        
        // Create header
        this._header = D.create('header')
            .classAdd('calendar-header')
            .appendTo(el);
        
        this._buildHeader();
        
        // Create body container
        this._body = D.create('div')
            .classAdd('calendar-body')
            .appendTo(el);
        
        // Initial render will be triggered by LiveBinding data
    };

    /**
     * Build calendar header with navigation
     */
    Calendar.prototype._buildHeader = function() {
        var self = this;
        var header = this._header;
        
        // Navigation section
        var nav = D.create('nav')
            .classAdd('calendar-nav')
            .attr('aria-label', 'Calendar navigation')
            .appendTo(header);
        
        // Previous button
        D.create('button')
            .attr('type', 'button')
            .attr('aria-label', 'Previous')
            .classAdd('btn', 'btn-sm', 'btn-outline-secondary')
            .html('<i class="fas fa-chevron-left" aria-hidden="true"></i>')
            .on('click', function() { self.prev(); })
            .appendTo(nav);
        
        // Today button
        D.create('button')
            .attr('type', 'button')
            .classAdd('btn', 'btn-sm', 'btn-outline-primary', 'mx-2')
            .text('Today')
            .on('click', function() { self.today(); })
            .appendTo(nav);
        
        // Next button
        D.create('button')
            .attr('type', 'button')
            .attr('aria-label', 'Next')
            .classAdd('btn', 'btn-sm', 'btn-outline-secondary')
            .html('<i class="fas fa-chevron-right" aria-hidden="true"></i>')
            .on('click', function() { self.next(); })
            .appendTo(nav);
        
        // Title
        this._title = D.create('h2')
            .classAdd('calendar-title', 'mb-0', 'mx-3')
            .attr('id', this.id + '-title')
            .appendTo(header);
        
        this._updateTitle();
        
        // View switcher
        var viewMenu = D.create('menu')
            .attr('role', 'tablist')
            .attr('aria-label', 'Calendar view')
            .classAdd('calendar-views', 'btn-group')
            .appendTo(header);
        
        var views = ['month', 'week', 'day', 'agenda'];
        var viewLabels = { month: 'Month', week: 'Week', day: 'Day', agenda: 'Agenda' };
        
        views.forEach(function(view) {
            D.create('button')
                .attr('type', 'button')
                .attr('role', 'tab')
                .attr('aria-selected', view === self.currentView ? 'true' : 'false')
                .classAdd('btn', 'btn-sm', view === self.currentView ? 'btn-primary' : 'btn-outline-secondary')
                .attr('data-view', view)
                .text(viewLabels[view])
                .on('click', function() { self.setView(view); })
                .appendTo(viewMenu);
        });
    };

    /**
     * Update title based on current date and view
     */
    Calendar.prototype._updateTitle = function() {
        if (!this._title) return;
        
        var opts = this.options;
        var date = this.currentDate;
        var title = '';
        
        try {
            var formatter;
            
            if (this.currentView === 'day') {
                formatter = new Intl.DateTimeFormat(opts.locale, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else if (this.currentView === 'week') {
                // Show week range
                var weekStart = this._getWeekStart(date);
                var weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                var startFormatter = new Intl.DateTimeFormat(opts.locale, {
                    month: 'short',
                    day: 'numeric'
                });
                var endFormatter = new Intl.DateTimeFormat(opts.locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                
                title = startFormatter.format(weekStart) + ' - ' + endFormatter.format(weekEnd);
                this._title.text(title);
                return;
            } else {
                formatter = new Intl.DateTimeFormat(opts.locale, {
                    year: 'numeric',
                    month: 'long'
                });
            }
            
            title = formatter.format(date);
        } catch (e) {
            // Fallback
            title = date.toLocaleDateString();
        }
        
        this._title.text(title);
    };

    /**
     * Get the start of the week for a given date
     */
    Calendar.prototype._getWeekStart = function(date) {
        return DateUtil.startOfWeek(date, this.options.weekStarts);
    };

    // =========================================================================
    // LIVEBINDING INTEGRATION
    // =========================================================================

    /**
     * Setup LiveBinding for event data
     */
    Calendar.prototype._setupBinding = function() {
        var self = this;
        var opts = this.options;
        
        // If no API configured, skip binding (local-only mode)
        if (!opts.api) {
            // Just render with any pre-loaded events
            this._render();
            return;
        }
        
        // Check if LiveBinding is available
        if (!Funky.LiveBinding) {
            console.warn('[Funky.Calendar] LiveBinding not found, using direct API');
            this._fetchEventsDirect();
            return;
        }
        
        // Determine source type
        var sourceType = opts.source || 'api';
        var range = this.getRange();
        
        // Build source string based on type
        var source;
        switch (sourceType) {
            case 'cache':
                source = 'cache:' + opts.entity + ':list';
                break;
            case 'websocket':
                source = 'websocket:' + opts.entity;
                break;
            case 'event':
                source = 'event:' + opts.entity + ':updated';
                break;
            default:
                source = 'api';
        }
        
        // Create binding options
        var bindingOptions = {
            source: source,
            
            // API options
            url: opts.api,
            params: function() {
                var range = self.getRange();
                return {
                    start: range.start.toISOString(),
                    end: range.end.toISOString()
                };
            },
            
            // Cache options
            entity: opts.entity,
            
            // Transform response
            transform: function(data) {
                // Handle various response formats
                if (Array.isArray(data)) return data;
                if (data && data.data) return data.data;
                if (data && data.items) return data.items;
                if (data && data.events) return data.events;
                return [];
            },
            
            // Custom render (we handle rendering)
            render: function(data) {
                self._onEventsLoaded(data);
                return undefined; // Don't let LiveBinding modify DOM
            },
            
            // Update callback
            onUpdate: function(data) {
                self._onEventsLoaded(data);
            },
            
            // Don't show loading state (we handle it)
            showLoading: false,
            
            // Debounce rapid updates
            debounce: 100
        };
        
        // Create hidden binding element
        var bindingEl = document.createElement('div');
        bindingEl.style.display = 'none';
        bindingEl.setAttribute('data-live-binding-calendar', this.id);
        this.element.appendChild(bindingEl);
        
        // Create binding
        this._binding = Funky.LiveBinding.bind(bindingEl, bindingOptions);
        
        // Listen for entity events (CRUD updates)
        this._setupEntityListeners();
    };

    /**
     * Setup listeners for entity CRUD events
     */
    Calendar.prototype._setupEntityListeners = function() {
        var self = this;
        var opts = this.options;
        var entity = opts.entity;
        
        // Listen for create events
        this._onEntityCreate = function(e) {
            var data = e.detail || e;
            if (data.entity !== entity) return;
            
            // Add to events array
            var newEvent = data.record || data.data || data;
            self.events.push(newEvent);
            
            // Re-render
            self._render();
            
            E.emit(self.element, 'funky.calendar.event-added', { event: newEvent });
        };
        
        // Listen for update events
        this._onEntityUpdate = function(e) {
            var data = e.detail || e;
            if (data.entity !== entity) return;
            
            var updatedEvent = data.record || data.data || data;
            var eventId = updatedEvent.id || updatedEvent.uuid;
            
            // Find and update in array
            for (var i = 0; i < self.events.length; i++) {
                var id = self.events[i].id || self.events[i].uuid;
                if (id === eventId) {
                    // Merge updates
                    for (var key in updatedEvent) {
                        if (updatedEvent.hasOwnProperty(key)) {
                            self.events[i][key] = updatedEvent[key];
                        }
                    }
                    break;
                }
            }
            
            // Re-render
            self._render();
            
            E.emit(self.element, 'funky.calendar.event-updated', { event: updatedEvent });
        };
        
        // Listen for delete events
        this._onEntityDelete = function(e) {
            var data = e.detail || e;
            if (data.entity !== entity) return;
            
            var eventId = data.id || (data.record && (data.record.id || data.record.uuid));
            
            // Remove from array
            self.events = self.events.filter(function(event) {
                var id = event.id || event.uuid;
                return id !== eventId;
            });
            
            // Re-render
            self._render();
            
            E.emit(self.element, 'funky.calendar.event-removed', { id: eventId });
        };
        
        // Register listeners
        E.on(document, entity + ':created', this._onEntityCreate);
        E.on(document, entity + ':updated', this._onEntityUpdate);
        E.on(document, entity + ':deleted', this._onEntityDelete);
        
        // Also listen for cache updates
        E.on(document, 'cache:' + entity + ':set', this._onEntityUpdate);
        E.on(document, 'cache:' + entity + ':delete', this._onEntityDelete);
    };

    /**
     * Direct API fetch (fallback when LiveBinding not available)
     */
    Calendar.prototype._fetchEventsDirect = function() {
        var self = this;
        var opts = this.options;
        var range = this.getRange();
        
        this.loading = true;
        this._showLoading();
        
        // Use Funky.Api if available
        if (Funky.Api && Funky.Api.get) {
            Funky.Api.get(opts.api, {
                start: range.start.toISOString(),
                end: range.end.toISOString()
            }).then(function(response) {
                var data = response.data || response;
                self._onEventsLoaded(Array.isArray(data) ? data : []);
            }).catch(function(error) {
                console.error('[Funky.Calendar] API error:', error);
                self.loading = false;
                self._hideLoading();
                self._showError('Failed to load events');
            });
        } else {
            // Raw fetch
            var url = opts.api + '?start=' + encodeURIComponent(range.start.toISOString()) +
                      '&end=' + encodeURIComponent(range.end.toISOString());
            
            fetch(url, { credentials: 'same-origin' })
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    self._onEventsLoaded(Array.isArray(data) ? data : (data.data || []));
                })
                .catch(function(error) {
                    console.error('[Funky.Calendar] Fetch error:', error);
                    self.loading = false;
                    self._hideLoading();
                    self._showError('Failed to load events');
                });
        }
    };

    /**
     * Refresh events (re-fetch from source)
     */
    Calendar.prototype.refresh = function() {
        // Skip fetch if in local-only mode (no API configured)
        if (!this.options.api) {
            this._render();
            return;
        }

        if (this._binding && this._binding.refresh) {
            this._binding.refresh();
        } else {
            this._fetchEventsDirect();
        }
    };

    /**
     * Show loading state
     */
    Calendar.prototype._showLoading = function() {
        var body = D.one(this._body);
        if (!body) return;
        
        // Add loading overlay
        var existing = body.el.querySelector('.calendar-loading');
        if (existing) return;
        
        var overlay = D.create('div')
            .classAdd('calendar-loading')
            .html('<div class="calendar-loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>');
        
        body.append(overlay);
    };

    /**
     * Hide loading state
     */
    Calendar.prototype._hideLoading = function() {
        var loading = this.element.querySelector('.calendar-loading');
        if (loading) loading.remove();
    };

    /**
     * Show error message
     */
    Calendar.prototype._showError = function(message) {
        var body = D.one(this._body);
        if (!body) return;
        
        D.create('div')
            .classAdd('calendar-error', 'alert', 'alert-danger', 'm-3')
            .text(message)
            .appendTo(body);
    };

    /**
     * Fetch events for current view range (deprecated, use refresh)
     */
    Calendar.prototype._fetchEvents = function() {
        // Skip fetch if in local-only mode (no API configured)
        if (!this.options.api) {
            this._render();
            return;
        }

        if (this._binding && this._binding.refresh) {
            this._binding.refresh();
        } else {
            this._fetchEventsDirect();
        }
    };

    /**
     * Handle loaded events
     */
    Calendar.prototype._onEventsLoaded = function(events) {
        this.events = Array.isArray(events) ? events : [];
        this.loading = false;
        this._hideLoading();
        
        E.emit(this.element, 'funky.calendar.events-loaded', {
            count: this.events.length,
            range: this.getRange()
        });
        
        this._render();
    };

    /**
     * Render the calendar view
     */
    Calendar.prototype._render = function() {
        // Save focus state before re-render
        this._saveFocusState();
        
        // Dispatch to view-specific renderer
        switch (this.currentView) {
            case 'week':
                this._renderWeekView();
                break;
            case 'day':
                this._renderDayView();
                break;
            case 'agenda':
                this._renderAgendaView();
                break;
            default:
                this._renderMonthView();
        }
        
        // Update ARIA and restore focus
        this._updateMonthAriaAttributes();
        this._updateEventAriaAttributes();
        this._restoreFocus();
    };

    /**
     * Render month view grid
     */
    Calendar.prototype._renderMonthView = function() {
        var self = this;
        var opts = this.options;
        var body = D.one(this._body.el);
        
        if (!body) return;
        
        // Clear existing content
        body.html('');
        
        // Generate grid data
        var grid = DateUtil.generateMonthGrid(this.currentDate, opts.weekStarts);
        var dayNames = DateUtil.getDayNames(opts.locale, 'short', opts.weekStarts);
        var today = new Date();
        
        // Create table
        var table = D.create('table')
            .classAdd('calendar-month')
            .attr('role', 'grid')
            .attr('aria-labelledby', this.id + '-title');
        
        // Caption for screen readers
        var captionText = DateUtil.format(this.currentDate, {
            month: 'long',
            year: 'numeric'
        }, opts.locale);
        
        D.create('caption')
            .classAdd('visually-hidden')
            .text(captionText + ' calendar')
            .appendTo(table);
        
        // Table header with day names
        var thead = D.create('thead').appendTo(table);
        var headerRow = D.create('tr').appendTo(thead);
        
        // Optional week number column
        if (opts.showWeekNumbers) {
            D.create('th')
                .classAdd('calendar-week-header')
                .attr('scope', 'col')
                .text('#')
                .appendTo(headerRow);
        }
        
        // Day name headers
        var fullDayNames = DateUtil.getDayNames(opts.locale, 'long', opts.weekStarts);
        dayNames.forEach(function(name, index) {
            D.create('th')
                .classAdd('calendar-weekday-header')
                .attr('scope', 'col')
                .attr('abbr', name)
                .text(fullDayNames[index])
                .appendTo(headerRow);
        });
        
        // Table body with weeks
        var tbody = D.create('tbody').appendTo(table);
        
        grid.forEach(function(week) {
            var tr = D.create('tr').classAdd('calendar-week');
            
            // Optional week number
            if (opts.showWeekNumbers) {
                var weekNum = self._getWeekNumber(week[0].date);
                D.create('td')
                    .classAdd('calendar-week-number')
                    .text(weekNum)
                    .appendTo(tr);
            }
            
            // Day cells
            week.forEach(function(day) {
                var td = D.create('td')
                    .classAdd('calendar-day')
                    .attr('role', 'gridcell')
                    .attr('data-date', day.dateString)
                    .attr('aria-label', DateUtil.format(day.date, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }, opts.locale));
                
                // State classes
                if (day.isToday) {
                    td.classAdd('calendar-day--today');
                    td.attr('aria-current', 'date');
                }
                if (!day.isCurrentMonth) {
                    td.classAdd('calendar-day--other-month');
                }
                if (day.isWeekend) {
                    td.classAdd('calendar-day--weekend');
                }
                if (self.selectedDate && DateUtil.isSameDay(day.date, self.selectedDate)) {
                    td.classAdd('calendar-day--selected');
                    td.attr('aria-selected', 'true');
                }
                
                // Check for events to add has-events class
                var dayEvents = self._getEventsForDay(day.date);
                if (dayEvents.length > 0) {
                    td.classAdd('calendar-day--has-events');
                }
                
                // Day number with time element
                var dayHeader = D.create('div').classAdd('calendar-day-header');
                
                D.create('time')
                    .classAdd('calendar-day-number')
                    .attr('datetime', day.isoString)
                    .text(day.day)
                    .appendTo(dayHeader);
                
                dayHeader.appendTo(td);
                
                // Events container
                var eventsContainer = D.create('ul')
                    .classAdd('calendar-events')
                    .attr('aria-label', 'Events');
                
                // Render events for this day
                self._renderDayEvents(day, eventsContainer);
                
                eventsContainer.appendTo(td);
                
                // Click handler for date selection
                if (opts.clickable) {
                    td.on('click', function(e) {
                        // Don't trigger if clicking on an event
                        if (e.target.closest('.calendar-event')) return;
                        self._onDateClick(day);
                    });
                }
                
                td.appendTo(tr);
            });
            
            tr.appendTo(tbody);
        });
        
        table.appendTo(body);
        
        // Render multi-day spanning events
        var tableEl = body.el.querySelector('table');
        var tbodyEl = tableEl ? tableEl.querySelector('tbody') : null;
        if (tbodyEl) {
            this._renderMultiDayEvents(grid, tbodyEl);
        }
    };

    /**
     * Render events for a specific day
     * @param {Object} day - Day object from grid
     * @param {ElementWrapper} container - Events container element
     */
    Calendar.prototype._renderDayEvents = function(day, container) {
        var self = this;
        var opts = this.options;
        var dayEvents = this._getEventsForDay(day.date);
        var maxEvents = opts.maxEventsPerCell;
        
        // Sort events by start time
        dayEvents.sort(function(a, b) {
            var aStart = DateUtil.parse(a[opts.dateField]);
            var bStart = DateUtil.parse(b[opts.dateField]);
            return aStart - bStart;
        });
        
        // Render visible events
        var visibleCount = Math.min(dayEvents.length, maxEvents);
        
        for (var i = 0; i < visibleCount; i++) {
            var event = dayEvents[i];
            this._renderEventPill(event, container);
        }
        
        // "+N more" link if truncated
        var remaining = dayEvents.length - visibleCount;
        if (remaining > 0) {
            var moreLink = D.create('li')
                .classAdd('calendar-more')
                .html('<button type="button" class="calendar-more-btn">+' + remaining + ' more</button>')
                .on('click', function(e) {
                    e.stopPropagation();
                    self._showDayPopover(day, dayEvents);
                });
            
            container.append(moreLink);
        }
    };

    /**
     * Render a single event pill
     * @param {Object} event - Event data
     * @param {ElementWrapper} container - Container element
     */
    Calendar.prototype._renderEventPill = function(event, container) {
        var self = this;
        var opts = this.options;
        
        var title = event[opts.titleField] || 'Untitled';
        
        // Use enhanced color handling
        var colors = this._getEventColor(event);
        
        // Check if all-day or multi-day event
        var isAllDay = this._isAllDayEvent(event);
        var isMultiDay = this._isMultiDayEvent(event);
        
        var li = D.create('li').classAdd('calendar-event-item');
        
        var eventEl = D.create('a')
            .classAdd('calendar-event')
            .attr('href', '#event-' + (event.id || event.uuid || ''))
            .attr('data-event-id', event.id || event.uuid || '')
            .attr('role', 'button')
            .text(title);
        
        // Apply color classes or styles
        if (colors.bg) {
            eventEl.classAdd(colors.bg);
        }
        if (colors.style) {
            eventEl.attr('style', colors.style);
        }
        
        if (isAllDay) {
            eventEl.classAdd('calendar-event--all-day');
        }
        
        if (isMultiDay) {
            eventEl.classAdd('calendar-event--multi-day');
        }
        
        // Click handler
        if (opts.clickable) {
            eventEl.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self._onEventClick(event, eventEl.el);
            });
        }
        
        eventEl.appendTo(li);
        li.appendTo(container);
        
        // Add enhanced tooltip
        this._createEventTooltip(event, eventEl.el);
    };

    /**
     * Get events for a specific day
     * @param {Date} date
     * @returns {Array}
     */
    Calendar.prototype._getEventsForDay = function(date) {
        var opts = this.options;
        var dayStart = DateUtil.startOfDay(date);
        var dayEnd = DateUtil.endOfDay(date);
        
        return this.events.filter(function(event) {
            var eventStart = DateUtil.parse(event[opts.dateField]);
            var eventEnd = event[opts.endField] 
                ? DateUtil.parse(event[opts.endField]) 
                : eventStart;
            
            if (!eventStart) return false;
            
            // Event overlaps with this day
            return eventStart <= dayEnd && eventEnd >= dayStart;
        });
    };

    /**
     * Check if event is all-day
     */
    Calendar.prototype._isAllDayEvent = function(event) {
        var opts = this.options;
        
        // Check for explicit all_day field
        if (event.all_day === true || event.allDay === true) return true;
        
        // Check if time is midnight-to-midnight
        var start = DateUtil.parse(event[opts.dateField]);
        if (!start) return false;
        
        if (start.getHours() === 0 && start.getMinutes() === 0) {
            var end = event[opts.endField] ? DateUtil.parse(event[opts.endField]) : null;
            if (!end) return true;
            if (end.getHours() === 0 && end.getMinutes() === 0) return true;
            if (end.getHours() === 23 && end.getMinutes() === 59) return true;
        }
        
        return false;
    };

    /**
     * Get ISO week number
     */
    Calendar.prototype._getWeekNumber = function(date) {
        var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        var dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    /**
     * Handle date cell click
     */
    Calendar.prototype._onDateClick = function(day) {
        var opts = this.options;
        
        // Update selection
        this.selectedDate = day.date;
        
        // Update UI
        D.all(this.element.querySelectorAll('.calendar-day--selected')).each(function(el) {
            el.classRemove('calendar-day--selected');
            el.attr('aria-selected', null);
        });
        
        var cell = D.one(this.element.querySelector('[data-date="' + day.dateString + '"]'));
        if (cell) {
            cell.classAdd('calendar-day--selected');
            cell.attr('aria-selected', 'true');
        }
        
        // Emit event
        var dayEvents = this._getEventsForDay(day.date);
        
        // Announce for screen readers
        this._announceEvents(day.date, dayEvents.length);
        
        E.emit(this.element, 'funky.calendar.date-select', {
            date: day.date,
            dateString: day.dateString,
            events: dayEvents,
            eventCount: dayEvents.length
        });
        
        if (typeof opts.onDateSelect === 'function') {
            opts.onDateSelect(day.date, dayEvents, this);
        }
    };

    /**
     * Handle event click - open view modal
     */
    Calendar.prototype._onEventClick = function(event, element) {
        var opts = this.options;
        
        E.emit(this.element, 'funky.calendar.event-click', {
            event: event,
            element: element
        });
        
        if (typeof opts.onEventClick === 'function') {
            opts.onEventClick(event, element, this);
        } else {
            // Default: open view modal
            this.viewEvent(event);
        }
    };

    // =========================================================================
    // MODAL INTEGRATION
    // =========================================================================

    /**
     * Open create event modal
     * @param {Object} defaults - Default values (start, end, allDay)
     */
    Calendar.prototype.createEvent = function(defaults) {
        var self = this;
        var opts = this.options;
        
        defaults = defaults || {};
        
        // Emit event for external handling
        // Applications should listen and show their own modal
        E.emit(self.element, 'funky.calendar.event-create', {
            start: defaults.start,
            end: defaults.end,
            allDay: defaults.allDay,
            callback: function(event) {
                // Callback to add event after external modal saves
                if (event) {
                    self.events.push(event);
                    self._render();
                    E.emit(self.element, 'funky.calendar.event-saved', { event: event });
                }
            }
        });
    };

    /**
     * Open view event modal
     * @param {Object} event
     */
    Calendar.prototype.viewEvent = function(event) {
        var self = this;
        var opts = this.options;
        var eventId = event.id || event.uuid;
        
        // Emit event for external handling
        E.emit(self.element, 'funky.calendar.event-view', { 
            event: event,
            editable: opts.editable,
            onEdit: function() {
                self.editEvent(event);
            },
            onDelete: function() {
                self.deleteEvent(eventId);
            }
        });
    };

    /**
     * Open edit event modal
     * @param {Object} event
     */
    Calendar.prototype.editEvent = function(event) {
        var self = this;
        var opts = this.options;
        var eventId = event.id || event.uuid;
        
        // Emit event for external handling
        E.emit(self.element, 'funky.calendar.event-edit', { 
            event: event,
            callback: function(updated) {
                // Callback to update event after external modal saves
                if (updated) {
                    for (var i = 0; i < self.events.length; i++) {
                        if ((self.events[i].id || self.events[i].uuid) === eventId) {
                            self.events[i] = updated;
                            break;
                        }
                    }
                    self._render();
                    E.emit(self.element, 'funky.calendar.event-updated', { event: updated });
                }
            }
        });
    };

    /**
     * Show delete confirmation
     * @param {string|number} eventId
     */
    Calendar.prototype.deleteEvent = function(eventId) {
        var self = this;
        var opts = this.options;
        
        // Find event for title
        var event = null;
        for (var i = 0; i < this.events.length; i++) {
            if ((this.events[i].id || this.events[i].uuid) === eventId) {
                event = this.events[i];
                break;
            }
        }
        
        var title = event ? event[opts.titleField] : 'this event';
        
        // Use confirmation modal if available
        if (Funky.confirm) {
            Funky.confirm({
                title: 'Delete Event',
                message: 'Are you sure you want to delete "' + title + '"?',
                confirmText: 'Delete',
                confirmClass: 'btn-danger',
                onConfirm: function() {
                    self.removeEvent(eventId);
                }
            });
        } else if (confirm('Delete "' + title + '"?')) {
            this.removeEvent(eventId);
        }
    };

    /**
     * Get form fields for event modal
     * @param {Object} data - Current data values
     * @param {boolean} isEdit - Edit mode
     * @returns {Array} Field definitions
     */
    Calendar.prototype._getEventFormFields = function(data, isEdit) {
        var opts = this.options;
        data = data || {};
        
        // Use custom fields if provided
        if (opts.fields && Array.isArray(opts.fields)) {
            return opts.fields;
        }
        
        var fields = [];
        
        // Title field
        fields.push({
            name: opts.titleField,
            label: 'Title',
            type: 'text',
            required: true,
            value: data[opts.titleField] || ''
        });
        
        // All day toggle
        fields.push({
            name: 'all_day',
            label: 'All Day',
            type: 'checkbox',
            value: data.all_day || data.allDay || false
        });
        
        // Start date/time
        fields.push({
            name: opts.dateField,
            label: 'Start',
            type: 'datetime-local',
            required: true,
            value: data[opts.dateField] ? this._formatDateForInput(data[opts.dateField]) : ''
        });
        
        // End date/time
        fields.push({
            name: opts.endField,
            label: 'End',
            type: 'datetime-local',
            value: data[opts.endField] ? this._formatDateForInput(data[opts.endField]) : ''
        });
        
        // Color/category if using color field
        if (opts.colorField && Object.keys(opts.colors).length > 0) {
            var colorOptions = Object.keys(opts.colors).map(function(key) {
                return { value: key, label: key.charAt(0).toUpperCase() + key.slice(1) };
            });
            
            fields.push({
                name: opts.colorField,
                label: 'Category',
                type: 'select',
                options: colorOptions,
                value: data[opts.colorField] || ''
            });
        }
        
        // Description
        fields.push({
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 3,
            value: data.description || ''
        });
        
        return fields;
    };

    /**
     * Format date for datetime-local input
     * @param {Date|string} date
     * @returns {string}
     */
    Calendar.prototype._formatDateForInput = function(date) {
        var d = DateUtil.parse(date);
        if (!d) return '';
        
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1);
        var day = String(d.getDate());
        var hours = String(d.getHours());
        var minutes = String(d.getMinutes());
        
        // Pad with zeros (ES5 compatible)
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        if (hours.length < 2) hours = '0' + hours;
        if (minutes.length < 2) minutes = '0' + minutes;
        
        return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
    };

    // =========================================================================
    // DAY POPOVER
    // =========================================================================

    /**
     * Show popover with all events for a day
     * @param {Object} day - Day object
     * @param {Array} events - Events for the day
     */
    Calendar.prototype._showDayPopover = function(day, events) {
        var self = this;
        var opts = this.options;
        
        // Find the cell element
        var cell = this.element.querySelector('[data-date="' + day.dateString + '"]');
        if (!cell) return;
        
        // Remove existing popover
        this._hideDayPopover();
        
        // Create popover
        var popover = D.create('div')
            .classAdd('calendar-day-popover')
            .attr('role', 'dialog')
            .attr('aria-label', 'Events for ' + day.dateString);
        
        // Header
        var header = D.create('div').classAdd('calendar-day-popover-header');
        
        D.create('span')
            .classAdd('calendar-day-popover-date')
            .text(DateUtil.format(day.date, {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            }, opts.locale))
            .appendTo(header);
        
        D.create('button')
            .classAdd('calendar-day-popover-close', 'btn-close')
            .attr('type', 'button')
            .attr('aria-label', 'Close')
            .on('click', function() { self._hideDayPopover(); })
            .appendTo(header);
        
        header.appendTo(popover);
        
        // Events list
        var list = D.create('ul').classAdd('calendar-day-popover-events');
        
        events.forEach(function(event) {
            var li = D.create('li').classAdd('calendar-day-popover-event');
            
            var colors = self._getEventColor(event);
            var indicator = D.create('span')
                .classAdd('calendar-event-indicator');
            
            if (colors.bg) indicator.classAdd(colors.bg);
            if (colors.style) indicator.attr('style', colors.style);
            
            indicator.appendTo(li);
            
            // Time
            var startDate = DateUtil.parse(event[opts.dateField]);
            var timeStr = self._isAllDayEvent(event) 
                ? 'All day'
                : DateUtil.formatTime(startDate.getHours(), startDate.getMinutes());
            
            D.create('span')
                .classAdd('calendar-day-popover-time')
                .text(timeStr)
                .appendTo(li);
            
            // Title
            D.create('span')
                .classAdd('calendar-day-popover-title')
                .text(event[opts.titleField] || 'Untitled')
                .appendTo(li);
            
            // Click handler
            li.on('click', function() {
                self._hideDayPopover();
                self._onEventClick(event, li.el);
            });
            
            li.appendTo(list);
        });
        
        list.appendTo(popover);
        
        // Add create button if editable
        if (opts.editable) {
            var footer = D.create('div').classAdd('calendar-day-popover-footer');
            
            D.create('button')
                .classAdd('btn', 'btn-sm', 'btn-primary', 'w-100')
                .html('<i class="fas fa-plus me-1"></i> Add Event')
                .on('click', function() {
                    self._hideDayPopover();
                    self.createEvent({
                        start: day.date,
                        allDay: true
                    });
                })
                .appendTo(footer);
            
            footer.appendTo(popover);
        }
        
        // Position popover
        var cellRect = cell.getBoundingClientRect();
        var bodyRect = this.element.getBoundingClientRect();
        
        popover.css('position', 'absolute');
        popover.css('top', (cellRect.top - bodyRect.top + cell.offsetHeight) + 'px');
        popover.css('left', (cellRect.left - bodyRect.left) + 'px');
        popover.css('z-index', '1050');
        
        this.element.appendChild(popover.el);
        this._currentPopover = popover;
        
        E.emit(this.element, 'funky.calendar.day-expand', {
            date: day.date,
            events: events
        });
        
        // Close on outside click
        var closeHandler = function(e) {
            if (!popover.el.contains(e.target) && !cell.contains(e.target)) {
                self._hideDayPopover();
                document.removeEventListener('click', closeHandler);
            }
        };

        setTimeout(function() {
            document.addEventListener('click', closeHandler);
        }, 0);

        // Close on escape - use Funky.Keyboard for centralized handling
        if (Funky.Keyboard) {
            Funky.Keyboard.pushScope('calendar-popover');
            this._popoverKeyboardUnregister = Funky.Keyboard.register({
                key: 'escape',
                scope: 'calendar-popover',
                handler: function() {
                    self._hideDayPopover();
                },
                description: 'Close popover',
                group: 'Calendar',
                preventDefault: true
            });
        } else {
            // Fallback for environments without Funky.Keyboard
            var escHandler = function(e) {
                if (e.key === 'Escape') {
                    self._hideDayPopover();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            this._popoverKeyboardUnregister = function() {
                document.removeEventListener('keydown', escHandler);
            };
        }
    };

    /**
     * Hide day popover
     */
    Calendar.prototype._hideDayPopover = function() {
        if (this._currentPopover) {
            this._currentPopover.el.remove();
            this._currentPopover = null;
        }
        // Cleanup keyboard handler
        if (this._popoverKeyboardUnregister) {
            this._popoverKeyboardUnregister();
            this._popoverKeyboardUnregister = null;
            if (Funky.Keyboard) {
                Funky.Keyboard.popScope();
            }
        }
    };

    /**
     * Setup double-click to create event
     */
    Calendar.prototype._setupDateDoubleClick = function() {
        var self = this;
        var opts = this.options;
        
        if (!opts.editable) return;
        
        E.on(this.element, 'dblclick', function(e) {
            var cell = e.target.closest('.calendar-day');
            if (!cell) return;
            
            var dateStr = cell.getAttribute('data-date');
            var date = DateUtil.parse(dateStr);
            
            if (date) {
                self.createEvent({
                    start: date,
                    allDay: true
                });
            }
        });
    };

    // =========================================================================
    // DRAG AND DROP
    // =========================================================================

    /**
     * Setup drag and drop handlers
     */
    Calendar.prototype._setupDragDrop = function() {
        if (!this.options.editable) return;
        
        this._setupDragToCreate();
        this._setupEventDrag();
        this._setupEventResize();
    };

    /**
     * Setup drag to create new event
     */
    Calendar.prototype._setupDragToCreate = function() {
        var self = this;
        var opts = this.options;
        
        var dragState = null;
        
        var onMouseDown = function(e) {
            // Only on empty slots
            if (e.target.closest('.calendar-event')) return;
            
            var slot = self._getSlotFromPoint(e.clientX, e.clientY);
            if (!slot) return;
            
            var dateStr = slot.getAttribute('data-date');
            var timeStr = slot.getAttribute('data-time');
            
            if (!dateStr) return;
            
            var startDate = DateUtil.parse(dateStr);
            if (timeStr) {
                var parts = timeStr.split(':');
                startDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
            }
            
            dragState = {
                type: 'create',
                startDate: startDate,
                startSlot: slot,
                currentSlot: slot,
                preview: null
            };
            
            e.preventDefault();
        };
        
        var onMouseMove = function(e) {
            if (!dragState || dragState.type !== 'create') return;
            
            var slot = self._getSlotFromPoint(e.clientX, e.clientY);
            if (!slot) return;
            
            dragState.currentSlot = slot;
            
            // Create or update preview
            self._updateCreatePreview(dragState);
        };
        
        var onMouseUp = function(e) {
            if (!dragState || dragState.type !== 'create') return;
            
            var slot = self._getSlotFromPoint(e.clientX, e.clientY);
            
            // Calculate end date
            var endDate = new Date(dragState.startDate);
            
            if (slot) {
                var dateStr = slot.getAttribute('data-date');
                var timeStr = slot.getAttribute('data-time');
                
                if (dateStr) {
                    endDate = DateUtil.parse(dateStr);
                    if (timeStr) {
                        var parts = timeStr.split(':');
                        endDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10) + opts.slotDuration, 0, 0);
                    } else {
                        endDate = DateUtil.endOfDay(endDate);
                    }
                }
            } else {
                // Single slot selection
                endDate.setMinutes(endDate.getMinutes() + opts.slotDuration);
            }
            
            // Ensure start < end
            if (endDate <= dragState.startDate) {
                endDate = new Date(dragState.startDate);
                endDate.setMinutes(endDate.getMinutes() + opts.slotDuration);
            }
            
            // Remove preview
            self._removeCreatePreview();
            
            // Create event
            self.createEvent({
                start: dragState.startDate,
                end: endDate,
                allDay: !dragState.startSlot.hasAttribute('data-time')
            });
            
            dragState = null;
        };
        
        // Attach listeners - use wrapper for delegation
        var onMouseDownWrapper = function(e) {
            var slot = e.target.closest('.calendar-time-slot, .calendar-day');
            if (slot) onMouseDown(e);
        };
        E.on(this.element, 'mousedown', onMouseDownWrapper);
        E.on(document, 'mousemove', onMouseMove);
        E.on(document, 'mouseup', onMouseUp);
        
        // Store for cleanup
        this._dragCreateHandlers = {
            mousedown: onMouseDownWrapper,
            mousemove: onMouseMove,
            mouseup: onMouseUp
        };
    };

    /**
     * Update drag-to-create preview
     */
    Calendar.prototype._updateCreatePreview = function(dragState) {
        // Remove existing preview
        this._removeCreatePreview();
        
        var startSlot = dragState.startSlot;
        var endSlot = dragState.currentSlot;
        
        // Create preview element
        var preview = D.create('div')
            .classAdd('calendar-event', 'calendar-event--preview', 'bg-primary-subtle')
            .text('New Event');
        
        // Position based on view
        if (this.currentView === 'month') {
            // Simple highlight for month view
            var cells = this.element.querySelectorAll('.calendar-day');
            var startIdx = -1;
            var endIdx = -1;
            
            for (var i = 0; i < cells.length; i++) {
                if (cells[i] === startSlot) startIdx = i;
                if (cells[i] === endSlot) endIdx = i;
            }
            
            if (startIdx > endIdx) {
                var tmp = startIdx;
                startIdx = endIdx;
                endIdx = tmp;
            }
            
            for (var j = startIdx; j <= endIdx; j++) {
                if (j >= 0 && j < cells.length) {
                    cells[j].classList.add('calendar-day--selecting');
                }
            }
        } else {
            // Week/day view - show time span
            // Find the event layer for proper positioning
            var eventLayer = this.element.querySelector('.calendar-event-layer');
            if (!eventLayer) return;
            
            // Get day index from slot
            var dayIndex = parseInt(startSlot.getAttribute('data-day-index'), 10) || 0;
            
            // Calculate top/height using slot positions relative to the body container
            var bodyContainer = eventLayer.parentElement;
            var startRect = startSlot.getBoundingClientRect();
            var endRect = endSlot.getBoundingClientRect();
            var containerRect = bodyContainer.getBoundingClientRect();
            
            var top = Math.min(startRect.top, endRect.top) - containerRect.top + bodyContainer.scrollTop;
            var bottom = Math.max(startRect.bottom, endRect.bottom) - containerRect.top + bodyContainer.scrollTop;
            
            // Use same positioning logic as _renderWeekEvents
            var numDays = this.currentView === 'day' ? 1 : 7;
            var leftPercent = (dayIndex / numDays) * 100;
            var widthPercent = 100 / numDays;
            
            preview.style('position', 'absolute');
            preview.style('top', top + 'px');
            preview.style('height', (bottom - top) + 'px');
            preview.style('left', leftPercent + '%');
            preview.style('width', 'calc(' + widthPercent + '% - 4px)');
            preview.style('z-index', '1000');
            preview.style('pointer-events', 'auto');
            
            eventLayer.appendChild(preview.el);
            dragState.preview = preview;
        }
    };

    /**
     * Remove drag-to-create preview
     */
    Calendar.prototype._removeCreatePreview = function() {
        // Remove selection highlights
        D.all(this.element.querySelectorAll('.calendar-day--selecting')).each(function(el) {
            el.classRemove('calendar-day--selecting');
        });
        
        // Remove preview element
        var preview = this.element.querySelector('.calendar-event--preview');
        if (preview) preview.remove();
    };

    // =========================================================================
    // EVENT DRAG (MOVE)
    // =========================================================================

    /**
     * Setup event dragging to move
     */
    Calendar.prototype._setupEventDrag = function() {
        var self = this;
        var opts = this.options;
        
        var dragState = null;
        
        var onDragStart = function(e) {
            var eventEl = e.target.closest('.calendar-event');
            if (!eventEl) return;
            
            // Don't drag if on resize handle
            if (e.target.classList.contains('calendar-event-resize-handle')) return;
            
            // Don't drag preview elements
            if (eventEl.classList.contains('calendar-event--preview')) return;
            
            var eventId = eventEl.getAttribute('data-event-id');
            var event = null;
            for (var i = 0; i < self.events.length; i++) {
                if ((self.events[i].id || self.events[i].uuid) == eventId) {
                    event = self.events[i];
                    break;
                }
            }
            
            if (!event) return;
            
            // Create drag ghost
            var ghost = eventEl.cloneNode(true);
            ghost.classList.add('calendar-event--dragging');
            ghost.style.position = 'fixed';
            ghost.style.width = eventEl.offsetWidth + 'px';
            ghost.style.pointerEvents = 'none';
            ghost.style.zIndex = '9999';
            ghost.style.opacity = '0.8';
            document.body.appendChild(ghost);
            
            dragState = {
                type: 'move',
                event: event,
                eventEl: eventEl,
                ghost: ghost,
                offsetX: e.clientX - eventEl.getBoundingClientRect().left,
                offsetY: e.clientY - eventEl.getBoundingClientRect().top,
                originalStart: DateUtil.parse(event[opts.dateField]),
                originalEnd: event[opts.endField] ? DateUtil.parse(event[opts.endField]) : null
            };
            
            eventEl.classList.add('calendar-event--moving');
            
            e.preventDefault();
        };
        
        var onDragMove = function(e) {
            if (!dragState || dragState.type !== 'move') return;
            
            // Move ghost
            dragState.ghost.style.left = (e.clientX - dragState.offsetX) + 'px';
            dragState.ghost.style.top = (e.clientY - dragState.offsetY) + 'px';
            
            // Highlight target slot
            var slot = self._getSlotFromPoint(e.clientX, e.clientY);
            self._highlightDropTarget(slot);
        };
        
        var onDragEnd = function(e) {
            if (!dragState || dragState.type !== 'move') return;
            
            // Clean up ghost
            if (dragState.ghost) {
                dragState.ghost.remove();
            }
            
            dragState.eventEl.classList.remove('calendar-event--moving');
            self._clearDropHighlight();
            
            // Get drop target
            var slot = self._getSlotFromPoint(e.clientX, e.clientY);
            if (!slot) {
                dragState = null;
                return;
            }
            
            // Calculate new dates
            var dateStr = slot.getAttribute('data-date');
            var timeStr = slot.getAttribute('data-time');
            
            var newStart = DateUtil.parse(dateStr);
            if (!newStart) {
                dragState = null;
                return;
            }
            if (timeStr) {
                var parts = timeStr.split(':');
                newStart.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
            }
            
            // Calculate duration to maintain
            var duration = 0;
            if (dragState.originalEnd) {
                duration = dragState.originalEnd - dragState.originalStart;
            }
            
            var newEnd = new Date(newStart.getTime() + duration);
            
            // Update event
            var changes = {};
            changes[opts.dateField] = newStart.toISOString();
            if (opts.endField && dragState.originalEnd) {
                changes[opts.endField] = newEnd.toISOString();
            }
            
            var eventId = dragState.event.id || dragState.event.uuid;
            
            E.emit(self.element, 'funky.calendar.event-move', {
                event: dragState.event,
                from: dragState.originalStart,
                to: newStart
            });
            
            self.updateEvent(eventId, changes);
            
            dragState = null;
        };
        
        // Attach listeners - use wrapper for delegation
        var onDragStartWrapper = function(e) {
            var eventEl = e.target.closest('.calendar-event:not(.calendar-event--preview)');
            if (eventEl) onDragStart(e);
        };
        E.on(this.element, 'mousedown', onDragStartWrapper);
        E.on(document, 'mousemove', onDragMove);
        E.on(document, 'mouseup', onDragEnd);
        
        this._dragMoveHandlers = {
            start: onDragStartWrapper,
            move: onDragMove,
            end: onDragEnd
        };
    };

    // =========================================================================
    // EVENT RESIZE
    // =========================================================================

    /**
     * Setup event resize handles
     */
    Calendar.prototype._setupEventResize = function() {
        var self = this;
        var opts = this.options;
        
        var resizeState = null;
        
        var onResizeStart = function(e) {
            if (!e.target.classList.contains('calendar-event-resize-handle')) return;
            
            var eventEl = e.target.closest('.calendar-event');
            if (!eventEl) return;
            
            var eventId = eventEl.getAttribute('data-event-id');
            var event = null;
            for (var i = 0; i < self.events.length; i++) {
                if ((self.events[i].id || self.events[i].uuid) == eventId) {
                    event = self.events[i];
                    break;
                }
            }
            
            if (!event) return;
            
            resizeState = {
                type: 'resize',
                event: event,
                eventEl: eventEl,
                handle: e.target.classList.contains('calendar-event-resize-handle--top') ? 'top' : 'bottom',
                originalStart: DateUtil.parse(event[opts.dateField]),
                originalEnd: event[opts.endField] ? DateUtil.parse(event[opts.endField]) : null,
                startY: e.clientY
            };
            
            eventEl.classList.add('calendar-event--resizing');
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        var onResizeMove = function(e) {
            if (!resizeState) return;
            
            var slot = self._getSlotFromPoint(e.clientX, e.clientY);
            if (!slot || !slot.hasAttribute('data-time')) return;
            
            var timeStr = slot.getAttribute('data-time');
            var parts = timeStr.split(':');
            var newHour = parseInt(parts[0], 10);
            var newMinute = parseInt(parts[1], 10);
            
            // Update preview
            if (resizeState.handle === 'bottom') {
                // Resize end
                newMinute += opts.slotDuration; // End of slot
                var newEnd = new Date(resizeState.originalEnd || resizeState.originalStart);
                newEnd.setHours(newHour, newMinute, 0, 0);
                
                if (newEnd > resizeState.originalStart) {
                    // Update visual height
                    self._updateResizePreview(resizeState.eventEl, resizeState.originalStart, newEnd);
                }
                resizeState.newEnd = newEnd;
            } else {
                // Resize start
                var newStart = new Date(resizeState.originalStart);
                newStart.setHours(newHour, newMinute, 0, 0);
                
                var endTime = resizeState.originalEnd || resizeState.originalStart;
                if (newStart < endTime) {
                    self._updateResizePreview(resizeState.eventEl, newStart, endTime);
                }
                resizeState.newStart = newStart;
            }
        };
        
        var onResizeEnd = function(e) {
            if (!resizeState) return;
            
            resizeState.eventEl.classList.remove('calendar-event--resizing');
            
            // Build changes
            var changes = {};
            
            if (resizeState.newStart) {
                changes[opts.dateField] = resizeState.newStart.toISOString();
            }
            
            if (resizeState.newEnd) {
                changes[opts.endField] = resizeState.newEnd.toISOString();
            }
            
            if (Object.keys(changes).length > 0) {
                var eventId = resizeState.event.id || resizeState.event.uuid;
                
                E.emit(self.element, 'funky.calendar.event-resize', {
                    event: resizeState.event,
                    oldEnd: resizeState.originalEnd,
                    newEnd: resizeState.newEnd || resizeState.originalEnd
                });
                
                self.updateEvent(eventId, changes);
            }
            
            resizeState = null;
        };
        
        // Attach listeners - use wrapper for delegation
        var onResizeStartWrapper = function(e) {
            var handle = e.target.closest('.calendar-event-resize-handle');
            if (handle) onResizeStart(e);
        };
        E.on(this.element, 'mousedown', onResizeStartWrapper);
        E.on(document, 'mousemove', onResizeMove);
        E.on(document, 'mouseup', onResizeEnd);
        
        this._resizeHandlers = {
            start: onResizeStartWrapper,
            move: onResizeMove,
            end: onResizeEnd
        };
    };

    /**
     * Add resize handles to event elements
     */
    Calendar.prototype._addResizeHandles = function(eventEl) {
        if (this.currentView === 'month') return; // No resize in month view
        
        var topHandle = D.create('div')
            .classAdd('calendar-event-resize-handle', 'calendar-event-resize-handle--top');
        
        var bottomHandle = D.create('div')
            .classAdd('calendar-event-resize-handle', 'calendar-event-resize-handle--bottom');
        
        eventEl.appendChild(topHandle.el);
        eventEl.appendChild(bottomHandle.el);
    };

    /**
     * Update resize preview
     */
    Calendar.prototype._updateResizePreview = function(eventEl, start, end) {
        var top = this._timeToPercent(start);
        var height = this._durationToPercent(start, end);
        
        eventEl.style.top = top + '%';
        eventEl.style.height = Math.max(height, 2) + '%';
    };

    // =========================================================================
    // DRAG HELPER METHODS
    // =========================================================================

    /**
     * Get slot element from point
     */
    Calendar.prototype._getSlotFromPoint = function(x, y) {
        var elements = document.elementsFromPoint(x, y);
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            if (el.classList.contains('calendar-time-slot')) return el;
            if (el.classList.contains('calendar-day') && el.hasAttribute('data-date')) return el;
        }
        return null;
    };

    /**
     * Highlight drop target
     */
    Calendar.prototype._highlightDropTarget = function(slot) {
        this._clearDropHighlight();
        if (slot) {
            slot.classList.add('calendar-slot--drop-target');
        }
    };

    /**
     * Clear drop highlight
     */
    Calendar.prototype._clearDropHighlight = function() {
        D.all(this.element.querySelectorAll('.calendar-slot--drop-target')).each(function(el) {
            el.classRemove('calendar-slot--drop-target');
        });
    };

    // =========================================================================
    // TOUCH SUPPORT
    // =========================================================================

    /**
     * Setup touch handlers
     */
    Calendar.prototype._setupTouchHandlers = function() {
        var self = this;
        
        // Swipe navigation for calendar views
        this._swipeGesture = Funky.GestureTracker.create({
            target: this.element,
            namespace: 'calendar-' + this.id,
            gestures: ['swipe'],
            swipeThreshold: 50,
            swipeVelocity: 0.3,
            
            onSwipe: function(data) {
                // Only handle horizontal swipes
                if (data.direction === 'left') {
                    self.next();
                } else if (data.direction === 'right') {
                    self.prev();
                }
                // Ignore up/down swipes - allow scrolling
            }
        });
        
        // Touch start on calendar events - use manual delegation
        E.on(this.element, 'touchstart', function(e) {
            if (!self.options.editable) return;
            
            // Check if target is or is within a calendar event
            var eventEl = e.target.closest('.calendar-event');
            if (!eventEl) return;
            
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            });
            eventEl.dispatchEvent(mouseEvent);
        });
        
        E.on(document, 'touchmove', function(e) {
            if (!self.options.editable) return;
            
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            });
            document.dispatchEvent(mouseEvent);
        });
        
        E.on(document, 'touchend', function(e) {
            if (!self.options.editable) return;
            
            var mouseEvent = new MouseEvent('mouseup', {
                bubbles: true
            });
            document.dispatchEvent(mouseEvent);
        });
    };

    // =========================================================================
    // ACCESSIBILITY
    // =========================================================================

    /**
     * Setup keyboard navigation
     */
    Calendar.prototype._setupKeyboardNav = function() {
        var self = this;
        
        E.on(this.element, 'keydown', function(e) {
            // Ignore if in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            var handled = false;
            
            switch (e.key) {
                case 'ArrowLeft':
                    handled = self._handleArrowKey('left');
                    break;
                case 'ArrowRight':
                    handled = self._handleArrowKey('right');
                    break;
                case 'ArrowUp':
                    handled = self._handleArrowKey('up');
                    break;
                case 'ArrowDown':
                    handled = self._handleArrowKey('down');
                    break;
                case 'Enter':
                case ' ':
                    handled = self._handleEnterKey(e);
                    break;
                case 'Escape':
                    handled = self._handleEscapeKey();
                    break;
                case 'Home':
                    if (e.ctrlKey) {
                        self.today();
                        handled = true;
                    }
                    break;
                case 'PageUp':
                    self.prev();
                    handled = true;
                    break;
                case 'PageDown':
                    self.next();
                    handled = true;
                    break;
                case 't':
                case 'T':
                    if (!e.ctrlKey && !e.metaKey) {
                        self.today();
                        handled = true;
                    }
                    break;
                case 'm':
                case 'M':
                    if (!e.ctrlKey && !e.metaKey) {
                        self.setView('month');
                        handled = true;
                    }
                    break;
                case 'w':
                case 'W':
                    if (!e.ctrlKey && !e.metaKey) {
                        self.setView('week');
                        handled = true;
                    }
                    break;
                case 'd':
                case 'D':
                    if (!e.ctrlKey && !e.metaKey) {
                        self.setView('day');
                        handled = true;
                    }
                    break;
            }
            
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    };

    /**
     * Handle arrow key navigation
     */
    Calendar.prototype._handleArrowKey = function(direction) {
        var focused = this.element.querySelector(':focus');
        
        if (!focused) {
            // Focus first focusable element
            this._focusFirstCell();
            return true;
        }
        
        // Navigation depends on current view
        if (this.currentView === 'month') {
            return this._navigateMonthGrid(focused, direction);
        } else if (this.currentView === 'week') {
            return this._navigateWeekGrid(focused, direction);
        } else if (this.currentView === 'day') {
            return this._navigateDayGrid(focused, direction);
        }
        
        return false;
    };

    /**
     * Navigate month grid with arrows
     */
    Calendar.prototype._navigateMonthGrid = function(focused, direction) {
        var self = this;
        var cells = [];
        var cellNodes = this.element.querySelectorAll('.calendar-day');
        for (var i = 0; i < cellNodes.length; i++) {
            cells.push(cellNodes[i]);
        }
        
        var currentIndex = cells.indexOf(focused);
        
        if (currentIndex === -1) {
            // Maybe focused on an event
            var cell = focused.closest('.calendar-day');
            if (cell) currentIndex = cells.indexOf(cell);
        }
        
        if (currentIndex === -1) return false;
        
        var newIndex = currentIndex;
        
        switch (direction) {
            case 'left':
                newIndex = currentIndex - 1;
                break;
            case 'right':
                newIndex = currentIndex + 1;
                break;
            case 'up':
                newIndex = currentIndex - 7;
                break;
            case 'down':
                newIndex = currentIndex + 7;
                break;
        }
        
        // Handle grid boundaries
        if (newIndex < 0) {
            // Go to previous month
            this.prev();
            setTimeout(function() {
                var newCells = self.element.querySelectorAll('.calendar-day');
                var targetIdx = newCells.length + newIndex;
                if (targetIdx >= 0 && targetIdx < newCells.length) {
                    newCells[targetIdx].focus();
                }
            }, 50);
            return true;
        }
        
        if (newIndex >= cells.length) {
            // Go to next month
            this.next();
            setTimeout(function() {
                var newCells = self.element.querySelectorAll('.calendar-day');
                var targetIdx = newIndex - cells.length;
                if (targetIdx >= 0 && targetIdx < newCells.length) {
                    newCells[targetIdx].focus();
                }
            }, 50);
            return true;
        }
        
        cells[newIndex].focus();
        return true;
    };

    /**
     * Navigate week grid with arrows
     */
    Calendar.prototype._navigateWeekGrid = function(focused, direction) {
        var slots = [];
        var slotNodes = this.element.querySelectorAll('.calendar-time-slot');
        for (var i = 0; i < slotNodes.length; i++) {
            slots.push(slotNodes[i]);
        }
        
        var currentIndex = slots.indexOf(focused);
        if (currentIndex === -1) return false;
        
        var daysPerRow = 7;
        var newIndex = currentIndex;
        
        switch (direction) {
            case 'left':
                newIndex = currentIndex - 1;
                if (newIndex < 0 || Math.floor(newIndex / daysPerRow) !== Math.floor(currentIndex / daysPerRow)) {
                    return false;
                }
                break;
            case 'right':
                newIndex = currentIndex + 1;
                if (Math.floor(newIndex / daysPerRow) !== Math.floor(currentIndex / daysPerRow)) {
                    return false;
                }
                break;
            case 'up':
                newIndex = currentIndex - daysPerRow;
                break;
            case 'down':
                newIndex = currentIndex + daysPerRow;
                break;
        }
        
        if (newIndex >= 0 && newIndex < slots.length) {
            slots[newIndex].focus();
            return true;
        }
        
        return false;
    };

    /**
     * Navigate day grid
     */
    Calendar.prototype._navigateDayGrid = function(focused, direction) {
        var slots = [];
        var slotNodes = this.element.querySelectorAll('.calendar-time-slot');
        for (var i = 0; i < slotNodes.length; i++) {
            slots.push(slotNodes[i]);
        }
        
        var currentIndex = slots.indexOf(focused);
        if (currentIndex === -1) return false;
        
        var newIndex = currentIndex;
        
        switch (direction) {
            case 'up':
                newIndex = currentIndex - 1;
                break;
            case 'down':
                newIndex = currentIndex + 1;
                break;
            case 'left':
                this.prev();
                return true;
            case 'right':
                this.next();
                return true;
        }
        
        if (newIndex >= 0 && newIndex < slots.length) {
            slots[newIndex].focus();
            return true;
        }
        
        return false;
    };

    /**
     * Handle Enter/Space on focused element
     */
    Calendar.prototype._handleEnterKey = function(e) {
        var self = this;
        var focused = e.target;
        
        // Day cell - select date
        if (focused.classList.contains('calendar-day')) {
            var dateStr = focused.getAttribute('data-date');
            if (dateStr) {
                var date = DateUtil.parse(dateStr);
                this._onDateClick({ date: date, dateString: dateStr });
                
                // Open create modal if editable and pressing Enter
                if (this.options.editable && e.key === 'Enter') {
                    this.createEvent({ start: date, allDay: true });
                }
                return true;
            }
        }
        
        // Event - open view modal
        if (focused.classList.contains('calendar-event')) {
            var eventId = focused.getAttribute('data-event-id');
            var event = null;
            for (var i = 0; i < self.events.length; i++) {
                if ((self.events[i].id || self.events[i].uuid) == eventId) {
                    event = self.events[i];
                    break;
                }
            }
            if (event) {
                this._onEventClick(event, focused);
                return true;
            }
        }
        
        // Time slot - create event
        if (focused.classList.contains('calendar-time-slot') && this.options.editable) {
            var slotDateStr = focused.getAttribute('data-date');
            var timeStr = focused.getAttribute('data-time');
            
            if (slotDateStr) {
                var slotDate = DateUtil.parse(slotDateStr);
                if (timeStr) {
                    var parts = timeStr.split(':');
                    slotDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10));
                }
                this.createEvent({ start: slotDate, allDay: !timeStr });
                return true;
            }
        }
        
        return false;
    };

    /**
     * Handle Escape key
     */
    Calendar.prototype._handleEscapeKey = function() {
        // Close any open popover
        this._hideDayPopover();
        
        // Remove selection
        D.all(this.element.querySelectorAll('.calendar-day--selected')).each(function(el) {
            el.classRemove('calendar-day--selected');
            el.attr('aria-selected', null);
        });
        
        this.selectedDate = null;
        
        return true;
    };

    /**
     * Focus first focusable cell
     */
    Calendar.prototype._focusFirstCell = function() {
        var today = this.element.querySelector('.calendar-day--today');
        if (today) {
            today.focus();
            return;
        }
        
        var firstCell = this.element.querySelector('.calendar-day[tabindex="0"], .calendar-time-slot[tabindex="0"]');
        if (firstCell) {
            firstCell.focus();
        }
    };

    // =========================================================================
    // ARIA ATTRIBUTES
    // =========================================================================

    /**
     * Apply ARIA attributes to calendar structure
     */
    Calendar.prototype._applyAriaAttributes = function() {
        var el = D.one(this.element);
        
        // Main container
        el.attr('role', 'application');
        el.attr('aria-roledescription', 'calendar');
        el.attr('aria-label', 'Calendar');
        
        // Header navigation
        var nav = el.el.querySelector('.calendar-nav');
        if (nav) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Calendar navigation');
        }
        
        // View switcher
        var viewTabs = el.el.querySelector('.calendar-views');
        if (viewTabs) {
            viewTabs.setAttribute('role', 'tablist');
            viewTabs.setAttribute('aria-label', 'Calendar views');
        }
    };

    /**
     * Update ARIA attributes for month grid
     */
    Calendar.prototype._updateMonthAriaAttributes = function() {
        var table = this.element.querySelector('.calendar-month');
        if (!table) return;
        
        // Table attributes
        table.setAttribute('role', 'grid');
        table.setAttribute('aria-labelledby', this.id + '-title');
        
        // Day cells
        var cells = table.querySelectorAll('.calendar-day');
        for (var i = 0; i < cells.length; i++) {
            var cellEl = cells[i];
            
            cellEl.setAttribute('role', 'gridcell');
            cellEl.setAttribute('tabindex', i === 0 ? '0' : '-1');
            
            // Today
            if (cellEl.classList.contains('calendar-day--today')) {
                cellEl.setAttribute('aria-current', 'date');
            }
            
            // Selected
            if (cellEl.classList.contains('calendar-day--selected')) {
                cellEl.setAttribute('aria-selected', 'true');
            }
            
            // Other month
            if (cellEl.classList.contains('calendar-day--other-month')) {
                cellEl.setAttribute('aria-disabled', 'true');
            }
        }
    };

    /**
     * Update ARIA for events
     */
    Calendar.prototype._updateEventAriaAttributes = function() {
        var events = this.element.querySelectorAll('.calendar-event');
        for (var i = 0; i < events.length; i++) {
            var eventEl = events[i];
            eventEl.setAttribute('role', 'button');
            eventEl.setAttribute('tabindex', '0');
            eventEl.setAttribute('aria-haspopup', 'dialog');
        }
    };

    // =========================================================================
    // LIVE REGIONS
    // =========================================================================

    /**
     * Create live region for announcements
     */
    Calendar.prototype._createLiveRegion = function() {
        if (this._liveRegion) return;
        
        this._liveRegion = D.create('div')
            .attr('role', 'status')
            .attr('aria-live', 'polite')
            .attr('aria-atomic', 'true')
            .classAdd('visually-hidden')
            .appendTo(this.element);
    };

    /**
     * Announce message to screen readers
     */
    Calendar.prototype.announce = function(message) {
        if (!this._liveRegion) {
            this._createLiveRegion();
        }
        
        // Clear and set new message (forces announcement)
        this._liveRegion.text('');
        
        var region = this._liveRegion;
        setTimeout(function() {
            region.text(message);
        }, 50);
    };

    /**
     * Announce navigation changes
     */
    Calendar.prototype._announceNavigation = function() {
        var viewName = this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1);
        var dateStr = DateUtil.format(this.currentDate, {
            month: 'long',
            year: 'numeric'
        }, this.options.locale);
        
        this.announce(viewName + ' view, ' + dateStr);
    };

    /**
     * Announce event count for focused date
     */
    Calendar.prototype._announceEvents = function(date, count) {
        var dateStr = DateUtil.format(date, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }, this.options.locale);
        
        var eventText = count === 0 ? 'no events' :
                        count === 1 ? '1 event' :
                        count + ' events';
        
        this.announce(dateStr + ', ' + eventText);
    };

    // =========================================================================
    // FOCUS MANAGEMENT
    // =========================================================================

    /**
     * Manage roving tabindex for grid cells
     */
    Calendar.prototype._updateTabIndex = function(focusedElement) {
        // Remove tabindex from all cells
        D.all(this.element.querySelectorAll('[tabindex="0"]')).each(function(el) {
            el.attr('tabindex', '-1');
        });
        
        // Set tabindex on focused element
        if (focusedElement) {
            focusedElement.setAttribute('tabindex', '0');
        }
    };

    /**
     * Restore focus after re-render
     */
    Calendar.prototype._restoreFocus = function() {
        if (!this._lastFocusedDate) return;
        
        var cell = this.element.querySelector('[data-date="' + this._lastFocusedDate + '"]');
        if (cell) {
            cell.setAttribute('tabindex', '0');
            cell.focus();
        }
    };

    /**
     * Save focus state before re-render
     */
    Calendar.prototype._saveFocusState = function() {
        var focused = this.element.querySelector(':focus');
        if (focused) {
            this._lastFocusedDate = focused.getAttribute('data-date');
        }
    };

    // =========================================================================
    // ADVANCED EVENT RENDERING
    // =========================================================================

    /**
     * Get events for a date range (for multi-day detection)
     * @param {Date} start
     * @param {Date} end
     * @returns {Array}
     */
    Calendar.prototype._getEventsInRange = function(start, end) {
        var opts = this.options;
        
        return this.events.filter(function(event) {
            var eventStart = DateUtil.parse(event[opts.dateField]);
            var eventEnd = event[opts.endField] 
                ? DateUtil.parse(event[opts.endField]) 
                : eventStart;
            
            if (!eventStart) return false;
            
            // Event overlaps with range
            return eventStart < end && eventEnd > start;
        });
    };

    /**
     * Check if event spans multiple days
     * @param {Object} event
     * @returns {boolean}
     */
    Calendar.prototype._isMultiDayEvent = function(event) {
        var opts = this.options;
        var startDate = DateUtil.parse(event[opts.dateField]);
        var endDate = event[opts.endField] 
            ? DateUtil.parse(event[opts.endField]) 
            : null;
        
        if (!startDate || !endDate) return false;
        
        // Different days?
        return !DateUtil.isSameDay(startDate, endDate);
    };

    /**
     * Calculate event span info for month view
     * @param {Object} event
     * @param {Array} week - Week array from grid
     * @returns {Object|null} { startCol, endCol, isStart, isEnd, title }
     */
    Calendar.prototype._getEventSpanInfo = function(event, week) {
        var opts = this.options;
        var eventStart = DateUtil.parse(event[opts.dateField]);
        var eventEnd = event[opts.endField] 
            ? DateUtil.parse(event[opts.endField]) 
            : eventStart;
        
        if (!eventStart) return null;
        
        var weekStart = week[0].date;
        var weekEnd = DateUtil.endOfDay(week[6].date);
        
        // Event doesn't touch this week
        if (eventEnd < weekStart || eventStart > weekEnd) return null;
        
        // Find start and end columns
        var startCol = 0;
        var endCol = 6;
        
        for (var i = 0; i < 7; i++) {
            var dayStart = DateUtil.startOfDay(week[i].date);
            var dayEnd = DateUtil.endOfDay(week[i].date);
            
            if (eventStart > dayEnd) {
                startCol = i + 1;
            }
            if (eventEnd < dayStart && i < endCol) {
                endCol = i - 1;
            }
        }
        
        // Clamp to week bounds
        startCol = Math.max(0, Math.min(6, startCol));
        endCol = Math.max(startCol, Math.min(6, endCol));
        
        // Check if event continues from/to other weeks
        var isStart = eventStart >= weekStart;
        var isEnd = eventEnd <= weekEnd;
        
        return {
            event: event,
            startCol: startCol,
            endCol: endCol,
            span: endCol - startCol + 1,
            isStart: isStart,
            isEnd: isEnd,
            title: event[opts.titleField] || 'Untitled'
        };
    };

    /**
     * Render multi-day events as spanning bars in month view
     */
    Calendar.prototype._renderMultiDayEvents = function(grid, tableBody) {
        var self = this;
        var opts = this.options;
        
        // Find all multi-day events
        var multiDayEvents = this.events.filter(function(event) {
            return self._isMultiDayEvent(event) || self._isAllDayEvent(event);
        });
        
        if (multiDayEvents.length === 0) return;
        
        // Process each week
        grid.forEach(function(week, weekIndex) {
            var weekSpans = [];
            
            multiDayEvents.forEach(function(event) {
                var spanInfo = self._getEventSpanInfo(event, week);
                if (spanInfo) {
                    weekSpans.push(spanInfo);
                }
            });
            
            if (weekSpans.length === 0) return;
            
            // Sort by start column, then by span length (longer first)
            weekSpans.sort(function(a, b) {
                if (a.startCol !== b.startCol) return a.startCol - b.startCol;
                return b.span - a.span;
            });
            
            // Assign rows to avoid overlaps
            var rows = [];
            weekSpans.forEach(function(span) {
                var rowIndex = 0;
                while (true) {
                    if (!rows[rowIndex]) rows[rowIndex] = [];
                    
                    // Check if this span fits in this row
                    var fits = true;
                    for (var col = span.startCol; col <= span.endCol; col++) {
                        if (rows[rowIndex][col]) {
                            fits = false;
                            break;
                        }
                    }
                    
                    if (fits) {
                        // Reserve columns
                        for (var col = span.startCol; col <= span.endCol; col++) {
                            rows[rowIndex][col] = span;
                        }
                        span.row = rowIndex;
                        break;
                    }
                    
                    rowIndex++;
                }
            });
            
            // Get the table row for this week
            var tr = tableBody.querySelectorAll('tr')[weekIndex];
            if (!tr) return;
            
            // Render spanning events
            weekSpans.forEach(function(span) {
                self._renderSpanningEvent(span, tr, week);
            });
        });
    };

    /**
     * Render a single spanning event bar
     */
    Calendar.prototype._renderSpanningEvent = function(span, tableRow, week) {
        var self = this;
        var opts = this.options;
        
        var event = span.event;
        var colors = this._getEventColor(event);
        
        // Get the target cell (first cell of span)
        var cells = tableRow.querySelectorAll('.calendar-day');
        var startCell = cells[span.startCol];
        
        if (!startCell) return;
        
        // Create spanning event element
        var spanEl = D.create('div')
            .classAdd('calendar-event', 'calendar-event--span')
            .attr('data-event-id', event.id || event.uuid || '')
            .attr('data-span-start', span.startCol)
            .attr('data-span-end', span.endCol);
        
        // Apply colors
        if (colors.bg) {
            spanEl.classAdd(colors.bg);
        }
        if (colors.style) {
            spanEl.attr('style', colors.style);
        }
        
        // Visual indicators for continuation
        if (!span.isStart) spanEl.classAdd('calendar-event--continues-left');
        if (!span.isEnd) spanEl.classAdd('calendar-event--continues-right');
        
        // Calculate width (span across cells)
        spanEl.css('width', 'calc(' + span.span + ' * (100% / 7) - 4px)');
        spanEl.css('top', (span.row * 22 + 24) + 'px'); // 22px per row, 24px header offset
        
        spanEl.text(span.title);
        spanEl.attr('title', span.title);
        
        // Click handler
        if (opts.clickable) {
            spanEl.on('click', function(e) {
                e.stopPropagation();
                self._onEventClick(event, spanEl.el);
            });
        }
        
        // Append to first cell with absolute positioning
        var eventsContainer = startCell.querySelector('.calendar-events');
        if (eventsContainer) {
            eventsContainer.appendChild(spanEl.el);
        }
    };

    /**
     * Enhanced color handling
     */
    Calendar.prototype._getEventColor = function(event) {
        var opts = this.options;
        
        // Check for explicit color field
        if (opts.colorField && event[opts.colorField]) {
            var colorValue = event[opts.colorField];
            
            // Mapped color (e.g., status → theme color)
            if (opts.colors && opts.colors[colorValue]) {
                return {
                    bg: 'bg-' + opts.colors[colorValue],
                    text: 'text-' + opts.colors[colorValue],
                    border: 'border-' + opts.colors[colorValue]
                };
            }
            
            // Direct hex color
            if (colorValue.startsWith('#')) {
                return {
                    style: 'background-color: ' + colorValue + '; color: #fff;',
                    hex: colorValue
                };
            }
            
            // Bootstrap color name
            if (['primary', 'secondary', 'success', 'danger', 'warning', 'info'].indexOf(colorValue) !== -1) {
                return {
                    bg: 'bg-' + colorValue,
                    text: 'text-' + colorValue,
                    border: 'border-' + colorValue
                };
            }
        }
        
        // Check for category color
        if (event.category && event.category.color) {
            return {
                style: 'background-color: ' + event.category.color + '; color: #fff;',
                hex: event.category.color
            };
        }
        
        // Default
        return {
            bg: 'bg-primary',
            text: 'text-primary',
            border: 'border-primary'
        };
    };

    /**
     * Create tooltip for truncated event
     */
    Calendar.prototype._createEventTooltip = function(event, element) {
        var opts = this.options;
        var startDate = DateUtil.parse(event[opts.dateField]);
        var endDate = event[opts.endField] ? DateUtil.parse(event[opts.endField]) : null;
        
        var content = [];
        content.push(event[opts.titleField] || 'Untitled');
        
        if (this._isAllDayEvent(event)) {
            content.push('All day');
        } else if (startDate) {
            var timeStr = DateUtil.format(startDate, {
                hour: 'numeric',
                minute: '2-digit'
            }, opts.locale);
            
            if (endDate) {
                timeStr += ' - ' + DateUtil.format(endDate, {
                    hour: 'numeric',
                    minute: '2-digit'
                }, opts.locale);
            }
            
            content.push(timeStr);
        }
        
        if (event.description) {
            content.push(event.description.substring(0, 100));
        }
        
        // Use Bootstrap tooltip if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            new bootstrap.Tooltip(element, {
                title: content.join(' - '),
                placement: 'top',
                trigger: 'hover'
            });
        } else {
            element.setAttribute('title', content.join(' - '));
        }
    };

    /**
     * Advanced event positioning with better overlap handling
     * Uses a sweep-line algorithm for efficiency
     */
    Calendar.prototype._positionEventsAdvanced = function(events, date) {
        var self = this;
        var opts = this.options;
        
        if (events.length === 0) return [];
        
        // Create event segments with start/end times
        var segments = events.map(function(event, index) {
            var startDate = DateUtil.parse(event[opts.dateField]);
            var endDate = event[opts.endField] 
                ? DateUtil.parse(event[opts.endField]) 
                : new Date(startDate.getTime() + 60 * 60 * 1000);
            
            return {
                event: event,
                index: index,
                start: startDate.getTime(),
                end: endDate.getTime(),
                column: 0,
                maxColumn: 0
            };
        });
        
        // Sort by start time, then by duration (longer first)
        segments.sort(function(a, b) {
            if (a.start !== b.start) return a.start - b.start;
            return (b.end - b.start) - (a.end - a.start);
        });
        
        // Group overlapping events
        var groups = [];
        var currentGroup = null;
        
        segments.forEach(function(segment) {
            if (!currentGroup || segment.start >= currentGroup.end) {
                // Start new group
                currentGroup = {
                    start: segment.start,
                    end: segment.end,
                    segments: [segment]
                };
                groups.push(currentGroup);
            } else {
                // Add to current group
                currentGroup.segments.push(segment);
                currentGroup.end = Math.max(currentGroup.end, segment.end);
            }
        });
        
        // Assign columns within each group
        groups.forEach(function(group) {
            var columns = [];
            
            group.segments.forEach(function(segment) {
                // Find first available column
                var col = 0;
                while (columns[col] && columns[col] > segment.start) {
                    col++;
                }
                
                segment.column = col;
                columns[col] = segment.end;
            });
            
            // Calculate max columns for width
            var maxCol = columns.length;
            group.segments.forEach(function(segment) {
                segment.maxColumn = maxCol;
            });
        });
        
        // Convert to position info
        return segments.map(function(segment) {
            return {
                event: segment.event,
                column: segment.column,
                totalColumns: segment.maxColumn,
                width: 100 / segment.maxColumn
            };
        });
    };

    // =========================================================================
    // WEEK VIEW
    // =========================================================================

    /**
     * Render week view with time slots
     */
    Calendar.prototype._renderWeekView = function() {
        var self = this;
        var opts = this.options;
        var body = D.one(this._body.el);
        
        if (!body) return;
        body.html('');
        
        // Generate week grid
        var weekData = DateUtil.generateWeekGrid(this.currentDate, {
            weekStarts: opts.weekStarts,
            startHour: opts.startHour,
            endHour: opts.endHour,
            slotDuration: opts.slotDuration
        });
        
        var container = D.create('div').classAdd('calendar-week-view');
        
        // All-day section
        var allDaySection = this._renderAllDaySection(weekData.days);
        allDaySection.appendTo(container);
        
        // Time grid container (scrollable)
        var gridWrapper = D.create('div').classAdd('calendar-week-scroll');
        
        // Build time grid
        var grid = D.create('div')
            .classAdd('calendar-week-grid')
            .attr('role', 'grid')
            .attr('aria-labelledby', this.id + '-title');
        
        // Header row with day names
        var headerRow = D.create('div').classAdd('calendar-week-header-row');
        
        // Empty corner cell for time column
        D.create('div')
            .classAdd('calendar-time-gutter-header')
            .appendTo(headerRow);
        
        // Day headers
        weekData.days.forEach(function(day) {
            var dayHeader = D.create('div')
                .classAdd('calendar-day-column-header')
                .attr('data-date', day.dateString);
            
            if (day.isToday) dayHeader.classAdd('calendar-day-column-header--today');
            if (day.isWeekend) dayHeader.classAdd('calendar-day-column-header--weekend');
            
            var dayName = DateUtil.format(day.date, { weekday: 'short' }, opts.locale);
            var dayNum = day.day;
            
            D.create('span').classAdd('calendar-day-name').text(dayName).appendTo(dayHeader);
            D.create('span').classAdd('calendar-day-num').text(dayNum).appendTo(dayHeader);
            
            dayHeader.appendTo(headerRow);
        });
        
        headerRow.appendTo(grid);
        
        // Time slots body
        var bodyContainer = D.create('div').classAdd('calendar-week-body');
        
        weekData.slots.forEach(function(slot) {
            var slotRow = D.create('div')
                .classAdd('calendar-time-row')
                .attr('data-time', slot.time);
            
            if (slot.isHourStart) slotRow.classAdd('calendar-time-row--hour');
            
            // Time label (gutter)
            var timeLabel = D.create('div')
                .classAdd('calendar-time-gutter')
                .text(slot.isHourStart ? slot.time : '');
            
            timeLabel.appendTo(slotRow);
            
            // Day columns
            weekData.days.forEach(function(day, dayIndex) {
                var slotCell = D.create('div')
                    .classAdd('calendar-time-slot')
                    .attr('data-date', day.dateString)
                    .attr('data-time', slot.time)
                    .attr('data-day-index', dayIndex)
                    .attr('role', 'gridcell');
                
                if (day.isWeekend) slotCell.classAdd('calendar-time-slot--weekend');
                
                // Click to create event
                if (opts.editable) {
                    slotCell.on('click', function() {
                        self._onSlotClick(day, slot);
                    });
                }
                
                slotCell.appendTo(slotRow);
            });
            
            slotRow.appendTo(bodyContainer);
        });
        
        // Event layer - must be inside bodyContainer for proper positioning
        var eventLayer = D.create('div')
            .classAdd('calendar-event-layer');
        
        // Render events
        this._renderWeekEvents(weekData, eventLayer);
        
        eventLayer.appendTo(bodyContainer);
        bodyContainer.appendTo(grid);
        grid.appendTo(gridWrapper);
        
        gridWrapper.appendTo(container);
        container.appendTo(body);
        
        // Add current time indicator (to bodyContainer so it aligns with event layer)
        if (this._isCurrentWeek()) {
            this._addWeekTimeIndicator(bodyContainer);
        }
        
        // Scroll to current time or start of business hours
        this._scrollToTime(gridWrapper);
    };

    /**
     * Render all-day events section
     */
    Calendar.prototype._renderAllDaySection = function(days) {
        var self = this;
        var opts = this.options;
        
        var section = D.create('div').classAdd('calendar-all-day-section');
        
        // Label
        D.create('div')
            .classAdd('calendar-all-day-label')
            .text('All Day')
            .appendTo(section);
        
        // Row for each day
        var row = D.create('div').classAdd('calendar-all-day-row');
        
        days.forEach(function(day) {
            var cell = D.create('div')
                .classAdd('calendar-all-day-cell')
                .attr('data-date', day.dateString);
            
            // Get all-day events for this day
            var allDayEvents = self._getEventsForDay(day.date).filter(function(event) {
                return self._isAllDayEvent(event);
            });
            
            allDayEvents.forEach(function(event) {
                self._renderEventPill(event, cell);
            });
            
            cell.appendTo(row);
        });
        
        row.appendTo(section);
        return section;
    };

    /**
     * Render events in week view
     */
    Calendar.prototype._renderWeekEvents = function(weekData, eventLayer) {
        var self = this;
        var opts = this.options;
        
        weekData.days.forEach(function(day, dayIndex) {
            var dayEvents = self._getEventsForDay(day.date).filter(function(event) {
                return !self._isAllDayEvent(event);
            });
            
            // Position events (handle overlaps)
            var positioned = self._positionDayEvents(dayEvents, day.date);
            
            positioned.forEach(function(pos) {
                var event = pos.event;
                var startDate = DateUtil.parse(event[opts.dateField]);
                var endDate = event[opts.endField] 
                    ? DateUtil.parse(event[opts.endField]) 
                    : new Date(startDate.getTime() + 60 * 60 * 1000);
                
                // Calculate position in pixels
                var top = self._timeToPixels(startDate);
                var height = self._durationToPixels(startDate, endDate);
                
                var eventEl = self._createEventElement(event);
                eventEl.style.top = top + 'px';
                eventEl.style.height = Math.max(height, 20) + 'px';
                // Event layer starts after gutter, so use simple percentage for day columns
                eventEl.style.left = 'calc(' + (dayIndex / 7 * 100) + '% + ' + ((pos.column * pos.width) / 100 * (100 / 7)) + '%)';
                eventEl.style.width = 'calc(' + ((100 / 7) * (pos.width / 100)) + '% - 4px)';
                
                var layerEl = eventLayer.el || eventLayer;
                layerEl.appendChild(eventEl);
            });
        });
    };

    /**
     * Position overlapping events in columns
     */
    /**
     * Position overlapping events in columns
     * Uses the advanced sweep-line algorithm for better overlap handling
     */
    Calendar.prototype._positionDayEvents = function(events, date) {
        // Use advanced positioning for better overlap handling
        return this._positionEventsAdvanced(events, date);
    };

    /**
     * Convert time to percentage of day
     */
    Calendar.prototype._timeToPercent = function(date) {
        var opts = this.options;
        var totalMinutes = (opts.endHour - opts.startHour) * 60;
        var eventMinutes = (date.getHours() - opts.startHour) * 60 + date.getMinutes();
        return Math.max(0, Math.min(100, (eventMinutes / totalMinutes) * 100));
    };

    /**
     * Convert time to pixel position based on slot height
     */
    Calendar.prototype._timeToPixels = function(date) {
        var opts = this.options;
        var slotHeight = 40; // Default slot height in pixels (2.5rem ≈ 40px)
        var minutesPerSlot = opts.slotDuration;
        var eventMinutes = (date.getHours() - opts.startHour) * 60 + date.getMinutes();
        return (eventMinutes / minutesPerSlot) * slotHeight;
    };

    /**
     * Convert duration to pixel height
     */
    Calendar.prototype._durationToPixels = function(start, end) {
        var opts = this.options;
        var slotHeight = 40; // Default slot height in pixels
        var minutesPerSlot = opts.slotDuration;
        var durationMinutes = (end - start) / (1000 * 60);
        return (durationMinutes / minutesPerSlot) * slotHeight;
    };

    /**
     * Convert duration to percentage of day
     */
    Calendar.prototype._durationToPercent = function(start, end) {
        var opts = this.options;
        var totalMinutes = (opts.endHour - opts.startHour) * 60;
        var durationMinutes = (end - start) / (1000 * 60);
        return Math.max(0, Math.min(100, (durationMinutes / totalMinutes) * 100));
    };

    /**
     * Create event element for time grid
     */
    Calendar.prototype._createEventElement = function(event) {
        var self = this;
        var opts = this.options;
        
        var title = event[opts.titleField] || 'Untitled';
        
        // Use enhanced color handling
        var colors = this._getEventColor(event);
        
        var startDate = DateUtil.parse(event[opts.dateField]);
        var timeStr = DateUtil.formatTime(startDate.getHours(), startDate.getMinutes());
        
        var el = D.create('div')
            .classAdd('calendar-event calendar-event--timed')
            .attr('data-event-id', event.id || event.uuid || '')
            .attr('role', 'button')
            .attr('tabindex', '0');
        
        // Apply color classes or inline styles
        if (colors.bg) {
            el.classAdd(colors.bg);
        }
        if (colors.style) {
            el.attr('style', colors.style);
        }
        
        D.create('span').classAdd('calendar-event-time').text(timeStr).appendTo(el);
        D.create('span').classAdd('calendar-event-title').text(title).appendTo(el);
        
        // Add resize handles if editable
        if (opts.editable) {
            this._addResizeHandles(el.el);
        }
        
        // Click handler
        if (opts.clickable) {
            el.on('click', function(e) {
                e.stopPropagation();
                self._onEventClick(event, el.el);
            });
        }
        
        // Add enhanced tooltip
        this._createEventTooltip(event, el.el);
        
        return el.el;
    };

    /**
     * Check if current week is displayed
     */
    Calendar.prototype._isCurrentWeek = function() {
        var today = new Date();
        var weekStart = DateUtil.startOfWeek(this.currentDate, this.options.weekStarts);
        var weekEnd = DateUtil.endOfWeek(this.currentDate, this.options.weekStarts);
        return today >= weekStart && today <= weekEnd;
    };

    /**
     * Add current time indicator line
     */
    Calendar.prototype._addWeekTimeIndicator = function(container) {
        var self = this;
        var opts = this.options;
        
        var updateIndicator = function() {
            // Remove existing
            var existing = container.el ? container.el.querySelector('.calendar-time-indicator') : container.querySelector('.calendar-time-indicator');
            if (existing) existing.remove();
            
            var now = new Date();
            var top = self._timeToPixels(now);
            
            if (top < 0) return;
            
            var indicator = D.create('div')
                .classAdd('calendar-time-indicator')
                .style('top', top + 'px');
            
            // Calculate left position for current day
            var weekStart = DateUtil.startOfWeek(self.currentDate, opts.weekStarts);
            var dayIndex = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24));
            
            if (dayIndex >= 0 && dayIndex < 7) {
                // Account for gutter width (50px) plus day column percentage
                // Each day is (100/7)% = 14.2857%, gutter adds offset
                var dayPercent = (dayIndex / 7) * 100;
                indicator.style('left', 'calc(' + dayPercent + '% + 25px)');
                indicator.style('width', 'calc((100% - 50px) / 7)');
            }
            
            var containerEl = container.el || container;
            containerEl.appendChild(indicator.el);
        };
        
        updateIndicator();
        
        // Update every minute
        this._timeIndicatorTimer = setInterval(updateIndicator, 60000);
    };

    /**
     * Scroll to current time or business hours start
     */
    Calendar.prototype._scrollToTime = function(container) {
        var opts = this.options;
        var now = new Date();
        var scrollContainer = container.el || container;
        
        // Target: current hour or start of business
        var targetHour = Math.max(opts.startHour, Math.min(now.getHours() - 1, opts.endHour));
        var targetPercent = ((targetHour - opts.startHour) / (opts.endHour - opts.startHour)) * 100;
        
        var scrollHeight = scrollContainer.scrollHeight;
        var targetScroll = (targetPercent / 100) * scrollHeight;
        
        scrollContainer.scrollTop = targetScroll;
    };

    /**
     * Handle time slot click - open create modal
     */
    Calendar.prototype._onSlotClick = function(day, slot) {
        var startDate = new Date(day.date);
        startDate.setHours(slot.hour, slot.minute, 0, 0);
        
        var endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + this.options.slotDuration);
        
        // If editable, open create modal
        if (this.options.editable) {
            this.createEvent({
                start: startDate,
                end: endDate,
                allDay: false
            });
        } else {
            E.emit(this.element, 'funky.calendar.event-create', {
                start: startDate,
                end: endDate,
                allDay: false
            });
        }
    };

    // =========================================================================
    // DAY VIEW
    // =========================================================================

    /**
     * Render day view
     */
    Calendar.prototype._renderDayView = function() {
        var self = this;
        var opts = this.options;
        var body = D.one(this._body.el);
        
        if (!body) return;
        body.html('');
        
        // Generate day grid
        var dayData = DateUtil.generateDayGrid(this.currentDate, {
            startHour: opts.startHour,
            endHour: opts.endHour,
            slotDuration: opts.slotDuration
        });
        
        var container = D.create('div').classAdd('calendar-day-view');
        
        // All-day section
        var allDaySection = D.create('div').classAdd('calendar-all-day-section');
        
        D.create('div')
            .classAdd('calendar-all-day-label')
            .text('All Day')
            .appendTo(allDaySection);
        
        var allDayCell = D.create('div').classAdd('calendar-all-day-cell');
        
        var allDayEvents = this._getEventsForDay(this.currentDate).filter(function(event) {
            return self._isAllDayEvent(event);
        });
        
        allDayEvents.forEach(function(event) {
            self._renderEventPill(event, allDayCell);
        });
        
        allDayCell.appendTo(allDaySection);
        allDaySection.appendTo(container);
        
        // Time grid
        var gridWrapper = D.create('div').classAdd('calendar-day-scroll');
        var grid = D.create('div').classAdd('calendar-day-grid');
        
        dayData.slots.forEach(function(slot) {
            var slotRow = D.create('div')
                .classAdd('calendar-time-row')
                .attr('data-time', slot.time);
            
            if (slot.isHourStart) slotRow.classAdd('calendar-time-row--hour');
            
            // Time label
            D.create('div')
                .classAdd('calendar-time-gutter')
                .text(slot.isHourStart ? slot.time : '')
                .appendTo(slotRow);
            
            // Slot cell
            var slotCell = D.create('div')
                .classAdd('calendar-time-slot')
                .attr('data-time', slot.time)
                .attr('data-day-index', 0);
            
            if (opts.editable) {
                slotCell.on('click', function() {
                    self._onSlotClick(dayData.day, slot);
                });
            }
            
            slotCell.appendTo(slotRow);
            slotRow.appendTo(grid);
        });
        
        // Event layer - must be inside grid for proper positioning
        var eventLayer = D.create('div').classAdd('calendar-event-layer');
        
        // Render timed events
        var timedEvents = this._getEventsForDay(this.currentDate).filter(function(event) {
            return !self._isAllDayEvent(event);
        });
        
        var positioned = this._positionDayEvents(timedEvents, this.currentDate);
        
        positioned.forEach(function(pos) {
            var event = pos.event;
            var startDate = DateUtil.parse(event[opts.dateField]);
            var endDate = event[opts.endField] 
                ? DateUtil.parse(event[opts.endField]) 
                : new Date(startDate.getTime() + 60 * 60 * 1000);
            
            var top = self._timeToPixels(startDate);
            var height = self._durationToPixels(startDate, endDate);
            
            var eventEl = self._createEventElement(event);
            eventEl.style.top = top + 'px';
            eventEl.style.height = Math.max(height, 20) + 'px';
            // Event layer starts after gutter, so left is just the column position
            eventEl.style.left = (pos.column * pos.width) + '%';
            eventEl.style.width = 'calc(' + pos.width + '% - 8px)';
            
            var layerEl = eventLayer.el || eventLayer;
            layerEl.appendChild(eventEl);
        });
        
        eventLayer.appendTo(grid);
        grid.appendTo(gridWrapper);
        gridWrapper.appendTo(container);
        container.appendTo(body);
        
        // Time indicator
        if (DateUtil.isToday(this.currentDate)) {
            this._addDayTimeIndicator(gridWrapper);
        }
        
        // Scroll to current time
        this._scrollToTime(gridWrapper);
    };

    /**
     * Add time indicator for day view
     */
    Calendar.prototype._addDayTimeIndicator = function(container) {
        var self = this;
        
        var updateIndicator = function() {
            var containerEl = container.el || container;
            var existing = containerEl.querySelector('.calendar-time-indicator');
            if (existing) existing.remove();
            
            var now = new Date();
            var top = self._timeToPixels(now);
            
            if (top < 0) return;
            
            var indicator = D.create('div')
                .classAdd('calendar-time-indicator', 'calendar-time-indicator--full')
                .style('top', top + 'px');
            
            containerEl.appendChild(indicator.el);
        };
        
        updateIndicator();
        this._timeIndicatorTimer = setInterval(updateIndicator, 60000);
    };

    // =========================================================================
    // AGENDA VIEW
    // =========================================================================

    /**
     * Render agenda (list) view
     */
    Calendar.prototype._renderAgendaView = function() {
        var self = this;
        var opts = this.options;
        var body = D.one(this._body.el);
        
        if (!body) return;
        body.html('');
        
        var container = D.create('div').classAdd('calendar-agenda-view');
        
        // Get events for next 30 days
        var startDate = this.currentDate;
        var endDate = DateUtil.addDays(startDate, 30);
        
        var upcomingEvents = this.events
            .filter(function(event) {
                var eventStart = DateUtil.parse(event[opts.dateField]);
                return eventStart && eventStart >= startDate && eventStart <= endDate;
            })
            .sort(function(a, b) {
                var aStart = DateUtil.parse(a[opts.dateField]);
                var bStart = DateUtil.parse(b[opts.dateField]);
                return aStart - bStart;
            });
        
        if (upcomingEvents.length === 0) {
            D.create('div')
                .classAdd('calendar-agenda-empty', 'text-muted', 'p-4', 'text-center')
                .text('No upcoming events')
                .appendTo(container);
        } else {
            // Group by date
            var grouped = {};
            upcomingEvents.forEach(function(event) {
                var eventStart = DateUtil.parse(event[opts.dateField]);
                var dateKey = DateUtil.toDateString(eventStart);
                
                if (!grouped[dateKey]) {
                    grouped[dateKey] = {
                        date: eventStart,
                        events: []
                    };
                }
                grouped[dateKey].events.push(event);
            });
            
            // Render groups
            Object.keys(grouped).sort().forEach(function(dateKey) {
                var group = grouped[dateKey];
                
                var daySection = D.create('div').classAdd('calendar-agenda-day');
                
                // Day header
                var dayHeader = D.create('div').classAdd('calendar-agenda-day-header');
                
                var dayLabel = DateUtil.format(group.date, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                }, opts.locale);
                
                if (DateUtil.isToday(group.date)) {
                    dayLabel = 'Today - ' + dayLabel;
                    dayHeader.classAdd('calendar-agenda-day-header--today');
                }
                
                dayHeader.text(dayLabel);
                dayHeader.appendTo(daySection);
                
                // Events list
                var eventsList = D.create('ul').classAdd('calendar-agenda-events');
                
                group.events.forEach(function(event) {
                    var li = D.create('li').classAdd('calendar-agenda-event');
                    
                    var startDate = DateUtil.parse(event[opts.dateField]);
                    var timeStr = self._isAllDayEvent(event) 
                        ? 'All day'
                        : DateUtil.formatTime(startDate.getHours(), startDate.getMinutes());
                    
                    var colorValue = opts.colorField ? event[opts.colorField] : null;
                    var colorClass = colorValue && opts.colors[colorValue] 
                        ? 'text-' + opts.colors[colorValue] 
                        : 'text-primary';
                    
                    D.create('span')
                        .classAdd('calendar-agenda-event-time')
                        .text(timeStr)
                        .appendTo(li);
                    
                    D.create('span')
                        .classAdd('calendar-agenda-event-title', colorClass)
                        .text(event[opts.titleField] || 'Untitled')
                        .appendTo(li);
                    
                    if (opts.clickable) {
                        li.on('click', function() {
                            self._onEventClick(event, li.el);
                        });
                        li.css('cursor', 'pointer');
                    }
                    
                    li.appendTo(eventsList);
                });
                
                eventsList.appendTo(daySection);
                daySection.appendTo(container);
            });
        }
        
        container.appendTo(body);
    };

    // =========================================================================
    // PUBLIC API METHODS
    // =========================================================================

    /**
     * Navigate to a specific date
     */
    Calendar.prototype.goto = function(date) {
        var oldDate = this.currentDate;
        this.currentDate = typeof date === 'string' ? new Date(date) : date;
        
        this._updateTitle();
        this._fetchEvents();
        
        // Announce for screen readers
        this._announceNavigation();
        
        E.emit(this.element, 'funky.calendar.navigate', {
            direction: 'goto',
            from: oldDate.toISOString(),
            to: this.currentDate.toISOString()
        });
        
        if (typeof this.options.onNavigate === 'function') {
            this.options.onNavigate(this.currentDate, oldDate, this);
        }
    };

    /**
     * Navigate to today
     */
    Calendar.prototype.today = function() {
        this.goto(new Date());
    };

    /**
     * Navigate to next period
     */
    Calendar.prototype.next = function() {
        var date = new Date(this.currentDate);
        
        switch (this.currentView) {
            case 'week':
                date.setDate(date.getDate() + 7);
                break;
            case 'day':
                date.setDate(date.getDate() + 1);
                break;
            default: // month
                date.setMonth(date.getMonth() + 1);
        }
        
        this.goto(date);
    };

    /**
     * Navigate to previous period
     */
    Calendar.prototype.prev = function() {
        var date = new Date(this.currentDate);
        
        switch (this.currentView) {
            case 'week':
                date.setDate(date.getDate() - 7);
                break;
            case 'day':
                date.setDate(date.getDate() - 1);
                break;
            default: // month
                date.setMonth(date.getMonth() - 1);
        }
        
        this.goto(date);
    };

    /**
     * Change view mode
     */
    Calendar.prototype.setView = function(view) {
        if (this.currentView === view) return;
        
        var self = this;
        var oldView = this.currentView;
        this.currentView = view;
        
        // Update view buttons
        D.all(this._header.el.querySelectorAll('[data-view]')).each(function(btn) {
            var isActive = btn.attr('data-view') === view;
            btn.attr('aria-selected', isActive ? 'true' : 'false');
            btn.classToggle('btn-primary', isActive);
            btn.classToggle('btn-outline-secondary', !isActive);
        });
        
        this._updateTitle();
        this._render();
        
        // Announce for screen readers
        this._announceNavigation();
        
        E.emit(this.element, 'funky.calendar.view-change', {
            from: oldView,
            to: view
        });
        
        if (typeof this.options.onViewChange === 'function') {
            this.options.onViewChange(view, oldView, this);
        }
    };

    /**
     * Get current view
     */
    Calendar.prototype.getView = function() {
        return this.currentView;
    };

    /**
     * Get current date
     */
    Calendar.prototype.getDate = function() {
        return new Date(this.currentDate);
    };

    /**
     * Get visible date range
     */
    Calendar.prototype.getRange = function() {
        return DateUtil.getViewRange(
            this.currentDate, 
            this.currentView, 
            this.options.weekStarts
        );
    };

    /**
     * Get loaded events
     */
    Calendar.prototype.getEvents = function() {
        return this.events.slice();
    };

    // =========================================================================
    // OPTIMISTIC CRUD OPERATIONS
    // =========================================================================

    /**
     * Add event with optimistic update
     * @param {Object} eventData
     * @returns {Promise}
     */
    Calendar.prototype.addEvent = function(eventData) {
        var self = this;
        var opts = this.options;

        // Generate ID if not provided
        if (!eventData.id) {
            eventData.id = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // If no API configured, just add locally and emit event (local-only mode)
        if (!opts.api) {
            this.events.push(eventData);
            this._render();
            E.emit(self.element, 'funky.calendar.event-saved', { event: eventData });
            return Promise.resolve(eventData);
        }

        // Generate temp ID for optimistic update
        var tempId = 'temp_' + Date.now();
        eventData._tempId = tempId;
        eventData._pending = true;

        // Optimistic add
        this.events.push(eventData);
        this._render();

        // API call
        var promise;
        if (Funky.Api && Funky.Api.post) {
            promise = Funky.Api.post(opts.api, eventData);
        } else {
            promise = fetch(opts.api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(eventData)
            }).then(function(r) { return r.json(); });
        }

        return promise.then(function(response) {
            var savedEvent = response.data || response;

            // Replace temp event with saved
            for (var i = 0; i < self.events.length; i++) {
                if (self.events[i]._tempId === tempId) {
                    self.events[i] = savedEvent;
                    break;
                }
            }

            self._render();

            E.emit(self.element, 'funky.calendar.event-saved', { event: savedEvent });
            return savedEvent;
        }).catch(function(error) {
            // Rollback
            self.events = self.events.filter(function(e) { return e._tempId !== tempId; });
            self._render();

            E.emit(self.element, 'funky.calendar.event-error', { error: error, event: eventData });
            throw error;
        });
    };

    /**
     * Update event with optimistic update
     * @param {string|number} id
     * @param {Object} changes
     * @returns {Promise}
     */
    Calendar.prototype.updateEvent = function(id, changes) {
        var self = this;
        var opts = this.options;
        
        // Find event
        var eventIndex = -1;
        for (var i = 0; i < this.events.length; i++) {
            if ((this.events[i].id || this.events[i].uuid) === id) {
                eventIndex = i;
                break;
            }
        }
        
        if (eventIndex === -1) {
            return Promise.reject(new Error('Event not found'));
        }
        
        // Save original for rollback
        var original = {};
        for (var key in this.events[eventIndex]) {
            if (this.events[eventIndex].hasOwnProperty(key)) {
                original[key] = this.events[eventIndex][key];
            }
        }
        
        // Optimistic update
        for (var changeKey in changes) {
            if (changes.hasOwnProperty(changeKey)) {
                this.events[eventIndex][changeKey] = changes[changeKey];
            }
        }
        this.events[eventIndex]._pending = true;
        this._render();
        
        // If no API configured, just emit event and resolve (local-only mode)
        if (!opts.api) {
            delete this.events[eventIndex]._pending;
            E.emit(self.element, 'funky.calendar.event-updated', { event: this.events[eventIndex], original: original });
            return Promise.resolve(this.events[eventIndex]);
        }
        
        // API call
        var url = opts.api + '/' + id;
        var promise;
        
        if (Funky.Api && Funky.Api.put) {
            promise = Funky.Api.put(url, changes);
        } else {
            promise = fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(changes)
            }).then(function(r) { return r.json(); });
        }
        
        return promise.then(function(response) {
            var savedEvent = response.data || response;
            self.events[eventIndex] = savedEvent;
            self._render();
            
            E.emit(self.element, 'funky.calendar.event-updated', { event: savedEvent, original: original });
            return savedEvent;
        }).catch(function(error) {
            // Rollback
            self.events[eventIndex] = original;
            self._render();
            
            E.emit(self.element, 'funky.calendar.event-error', { error: error, event: changes });
            throw error;
        });
    };

    /**
     * Remove event with optimistic update
     * @param {string|number} id
     * @returns {Promise}
     */
    Calendar.prototype.removeEvent = function(id) {
        var self = this;
        var opts = this.options;
        
        // Find and remove
        var removed = null;
        var removedIndex = -1;
        
        for (var i = 0; i < this.events.length; i++) {
            if ((this.events[i].id || this.events[i].uuid) === id) {
                removed = this.events[i];
                removedIndex = i;
                break;
            }
        }
        
        if (!removed) {
            return Promise.reject(new Error('Event not found'));
        }
        
        // Optimistic remove
        this.events.splice(removedIndex, 1);
        this._render();
        
        // If no API configured, just emit event and resolve (local-only mode)
        if (!opts.api) {
            E.emit(self.element, 'funky.calendar.event-removed', { id: id, event: removed });
            return Promise.resolve(removed);
        }
        
        // API call
        var url = opts.api + '/' + id;
        var promise;
        
        if (Funky.Api && Funky.Api.delete) {
            promise = Funky.Api.delete(url);
        } else {
            promise = fetch(url, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
        }
        
        return promise.then(function() {
            E.emit(self.element, 'funky.calendar.event-removed', { id: id, event: removed });
        }).catch(function(error) {
            // Rollback - re-insert
            self.events.splice(removedIndex, 0, removed);
            self._render();
            
            E.emit(self.element, 'funky.calendar.event-error', { error: error, id: id });
            throw error;
        });
    };

    /**
     * Set events directly (replaces current events)
     * @param {Array} events
     */
    Calendar.prototype.setEvents = function(events) {
        this.events = Array.isArray(events) ? events : [];
        E.emit(this.element, 'funky.calendar.events-change', { events: this.events });
        this._render();
    };

    /**
     * Destroy the calendar instance
     */
    Calendar.prototype.destroy = function() {
        if (this.destroyed) return;
        this.destroyed = true;
        
        var opts = this.options;
        var entity = opts.entity;
        
        // Destroy swipe gesture tracker
        if (this._swipeGesture) {
            this._swipeGesture.destroy();
            this._swipeGesture = null;
        }
        
        // Cleanup time indicator timer
        if (this._timeIndicatorTimer) {
            clearInterval(this._timeIndicatorTimer);
        }
        
        // Remove drag handlers
        if (this._dragCreateHandlers) {
            E.off(document, 'mousemove', this._dragCreateHandlers.mousemove);
            E.off(document, 'mouseup', this._dragCreateHandlers.mouseup);
        }
        if (this._dragMoveHandlers) {
            E.off(document, 'mousemove', this._dragMoveHandlers.move);
            E.off(document, 'mouseup', this._dragMoveHandlers.end);
        }
        if (this._resizeHandlers) {
            E.off(document, 'mousemove', this._resizeHandlers.move);
            E.off(document, 'mouseup', this._resizeHandlers.end);
        }
        
        // Remove entity listeners
        if (this._onEntityCreate) {
            E.off(document, entity + ':created', this._onEntityCreate);
        }
        if (this._onEntityUpdate) {
            E.off(document, entity + ':updated', this._onEntityUpdate);
            E.off(document, 'cache:' + entity + ':set', this._onEntityUpdate);
        }
        if (this._onEntityDelete) {
            E.off(document, entity + ':deleted', this._onEntityDelete);
            E.off(document, 'cache:' + entity + ':delete', this._onEntityDelete);
        }
        
        // Destroy binding
        if (this._binding && this._binding.destroy) {
            this._binding.destroy();
        }
        
        // Remove from instances
        instances.unregister(this.id);
        
        // Clear element
        this.element.removeAttribute('data-calendar-id');
        this.element.innerHTML = '';
        
        E.emit(this.element, 'funky.calendar.destroyed', { id: this.id });
    };

    // =========================================================================
    // STATIC API
    // =========================================================================

    var Calendar_API = {
        _instances: instances,
        
        /**
         * Date utilities (alias for Funky.Date)
         * @deprecated Use Funky.Date directly
         */
        DateEngine: Funky.Date,
        
        /**
         * Initialize a calendar on target
         * @param {string|HTMLElement} target - Container selector or element
         * @param {Object} [options] - Configuration options
         * @returns {Calendar}
         */
        init: function(target, options) {
            var el = typeof target === 'string' ? D.one(target) : target;
            if (!el) {
                console.error('[Funky.Calendar] Target not found:', target);
                return null;
            }
            
            // Unwrap ElementWrapper
            if (el.el) el = el.el;
            
            // Check for existing instance
            var existingId = el.getAttribute('data-calendar-id');
            if (existingId && instances.get(existingId)) {
                return instances.get(existingId);
            }

            var cal = new Calendar(el, options);
            instances.register(cal.id, cal);
            return cal;
        },

        /**
         * @deprecated Use Calendar.init() instead
         */
        create: function(target, options) {
            if (Funky.debug) {
                console.warn('[Funky.Calendar] create() is deprecated. Use init() instead.');
            }
            return Calendar_API.init(target, options);
        },
        
        /**
         * Get calendar instance by element
         */
        getInstance: function(target) {
            var el = typeof target === 'string' ? D.one(target) : target;
            if (!el) return null;
            if (el.el) el = el.el;
            
            var id = el.getAttribute('data-calendar-id');
            return id ? instances.get(id) : null;
        },

        /**
         * Destroy calendar by target element
         * @param {string|HTMLElement} target
         */
        destroy: function(target) {
            var instance = Calendar_API.getInstance(target);
            if (instance) {
                instance.destroy();
            }
        },
        
        /**
         * Initialize all calendars in container
         */
        initAll: function(container) {
            container = container || document;
            var count = 0;
            
            D.all(container.querySelectorAll(SELECTOR)).each(function(el) {
                var element = el.el || el;
                if (element.getAttribute('data-calendar-id')) return;
                
                var options = parseDataAttributes(element);
                var cal = new Calendar(element, options);
                instances.register(cal.id, cal);
                count++;
            });
            
            if (count > 0) {
                E.emit(document, 'funky.calendar.init', { count: count });
            }
            
            return count;
        },
        
        /**
         * Start observing DOM for new calendars
         */
        observe: function() {
            if (observer) return;
            
            observer = new MutationObserver(function(mutations) {
                var needsInit = false;
                
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) {
                            if (node.matches && node.matches(SELECTOR)) {
                                needsInit = true;
                            } else if (node.querySelector && node.querySelector(SELECTOR)) {
                                needsInit = true;
                            }
                        }
                    });
                });
                
                if (needsInit) {
                    Calendar_API.initAll();
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        /**
         * Destroy all instances
         */
        destroyAll: function() {
            instances.destroyAll();
        }
    };

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Parse data attributes to options
     */
    function parseDataAttributes(el) {
        var opts = {};
        
        if (el.dataset.api) opts.api = el.dataset.api;
        if (el.dataset.entity) opts.entity = el.dataset.entity;
        if (el.dataset.view) opts.view = el.dataset.view;
        if (el.dataset.date) opts.date = el.dataset.date;
        if (el.dataset.dateField) opts.dateField = el.dataset.dateField;
        if (el.dataset.endField) opts.endField = el.dataset.endField;
        if (el.dataset.titleField) opts.titleField = el.dataset.titleField;
        if (el.dataset.colorField) opts.colorField = el.dataset.colorField;
        if (el.dataset.colors) {
            try { opts.colors = JSON.parse(el.dataset.colors); } catch (e) {}
        }
        if (el.dataset.startHour) opts.startHour = parseInt(el.dataset.startHour, 10);
        if (el.dataset.endHour) opts.endHour = parseInt(el.dataset.endHour, 10);
        if (el.dataset.weekStarts) opts.weekStarts = parseInt(el.dataset.weekStarts, 10);
        if (el.dataset.slotDuration) opts.slotDuration = parseInt(el.dataset.slotDuration, 10);
        if (el.dataset.editable === 'true') opts.editable = true;
        if (el.dataset.locale) opts.locale = el.dataset.locale;
        if (el.dataset.timezone) opts.timezone = el.dataset.timezone;
        if (el.dataset.showWeekNumbers === 'true') opts.showWeekNumbers = true;
        if (el.dataset.maxEventsPerCell) opts.maxEventsPerCell = parseInt(el.dataset.maxEventsPerCell, 10);
        
        return opts;
    }

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    Funky.register('Calendar', Calendar_API);

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Calendar_API.initAll();
            Calendar_API.observe();
        });
    } else {
        Calendar_API.initAll();
        Calendar_API.observe();
    }

})(window);
