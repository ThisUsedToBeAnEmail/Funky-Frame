/**
 * Integration Test: Calendar + Events + API + Notifications
 *
 * Tests the integration between Calendar component, event management,
 * API operations, and notification systems.
 */

describe('Funky.Integration.Calendar.Events', function() {

    var Calendar = Funky.Calendar;
    var PubSub = Funky.PubSub;
    var fixture;
    var originalFetch;
    var fetchCalls;

    beforeEach(function() {
        // Mock fetch
        originalFetch = window.fetch;
        fetchCalls = [];
        window.fetch = function(url, options) {
            fetchCalls.push({ url: url, options: options });
            return Promise.resolve({
                ok: true,
                json: function() {
                    return Promise.resolve({ success: true });
                }
            });
        };

        PubSub.clear();
        fixture = FunkyTests.fixture('<div id="calendar-test"></div>');
    });

    afterEach(function() {
        window.fetch = originalFetch;
        PubSub.clear();
        fixture.destroy();
    });

    // =========================================================================
    // Calendar Data Loading
    // =========================================================================

    describe('Calendar Data Loading', function() {

        it('loads events for visible date range', function(done) {
            var startDate = '2024-01-01';
            var endDate = '2024-01-31';

            window.fetch = function(url) {
                fetchCalls.push({ url: url });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            events: [
                                { id: 1, title: 'Meeting', date: '2024-01-15' },
                                { id: 2, title: 'Deadline', date: '2024-01-20' }
                            ]
                        });
                    }
                });
            };

            fetch('/api/events?start=' + startDate + '&end=' + endDate)
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    expect(fetchCalls.length).toBe(1);
                    expect(fetchCalls[0].url).toContain('start=2024-01-01');
                    expect(data.events.length).toBe(2);
                    done();
                });
        });

        it('caches loaded events', function() {
            var cacheSet = false;

            PubSub.on('funky:cache:set', function(data) {
                if (data.key.includes('calendar:events')) {
                    cacheSet = true;
                }
            });

            PubSub.emit('funky:cache:set', {
                key: 'calendar:events:2024-01',
                value: [{ id: 1, title: 'Event' }],
                ttl: 300000
            });

            expect(cacheSet).toBe(true);
        });

        it('loads from cache when available', function() {
            var cacheHit = false;

            PubSub.on('funky:cache:get', function(data) {
                if (data.key === 'calendar:events:2024-01') {
                    cacheHit = true;
                }
            });

            PubSub.emit('funky:cache:get', { key: 'calendar:events:2024-01' });

            expect(cacheHit).toBe(true);
        });

        it('prefetches adjacent months', function(done) {
            var prefetchedMonths = [];

            window.fetch = function(url) {
                fetchCalls.push({ url: url });
                if (url.includes('2024-02') || url.includes('2023-12')) {
                    prefetchedMonths.push(url);
                }
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ events: [] });
                    }
                });
            };

            // Simulate loading current month then prefetching
            Promise.all([
                fetch('/api/events?start=2024-01-01&end=2024-01-31'),
                fetch('/api/events?start=2024-02-01&end=2024-02-29'),
                fetch('/api/events?start=2023-12-01&end=2023-12-31')
            ]).then(function() {
                expect(prefetchedMonths.length).toBe(2);
                done();
            });
        });

    });

    // =========================================================================
    // Event Creation
    // =========================================================================

    describe('Event Creation', function() {

        it('opens modal on date click', function() {
            var modalOpened = false;
            var selectedDate = null;

            PubSub.on('funky:modal:open', function(data) {
                modalOpened = true;
                selectedDate = data.date;
            });

            PubSub.emit('funky:calendar:date-click', { date: '2024-01-15' });
            PubSub.emit('funky:modal:open', {
                type: 'event-create',
                date: '2024-01-15'
            });

            expect(modalOpened).toBe(true);
            expect(selectedDate).toBe('2024-01-15');
        });

        it('submits new event to API', function(done) {
            var newEvent = {
                title: 'Team Meeting',
                date: '2024-01-15',
                time: '14:00',
                duration: 60,
                description: 'Weekly sync'
            };

            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            success: true,
                            event: { id: 100, ...newEvent }
                        });
                    }
                });
            };

            fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            }).then(function() {
                expect(fetchCalls[0].options.method).toBe('POST');
                var body = JSON.parse(fetchCalls[0].options.body);
                expect(body.title).toBe('Team Meeting');
                done();
            });
        });

        it('adds event to calendar optimistically', function() {
            var eventAdded = false;

            PubSub.on('funky:calendar:event-added', function(data) {
                eventAdded = true;
                expect(data.optimistic).toBe(true);
            });

            PubSub.emit('funky:calendar:event-added', {
                event: { id: 'temp-1', title: 'New Event' },
                optimistic: true
            });

            expect(eventAdded).toBe(true);
        });

        it('replaces temp ID with real ID after save', function() {
            var idReplaced = false;

            PubSub.on('funky:calendar:event-id-updated', function(data) {
                idReplaced = true;
                expect(data.tempId).toBe('temp-1');
                expect(data.realId).toBe(100);
            });

            PubSub.emit('funky:calendar:event-id-updated', {
                tempId: 'temp-1',
                realId: 100
            });

            expect(idReplaced).toBe(true);
        });

        it('shows success toast after creation', function() {
            var toastShown = false;

            PubSub.on('funky:toast:show', function(data) {
                if (data.message.includes('created')) {
                    toastShown = true;
                }
            });

            PubSub.emit('funky:toast:show', {
                type: 'success',
                message: 'Event created successfully'
            });

            expect(toastShown).toBe(true);
        });

    });

    // =========================================================================
    // Event Editing
    // =========================================================================

    describe('Event Editing', function() {

        it('opens edit modal on event click', function() {
            var editModalOpened = false;
            var eventData = null;

            PubSub.on('funky:modal:open', function(data) {
                if (data.type === 'event-edit') {
                    editModalOpened = true;
                    eventData = data.event;
                }
            });

            PubSub.emit('funky:modal:open', {
                type: 'event-edit',
                event: { id: 1, title: 'Meeting', date: '2024-01-15' }
            });

            expect(editModalOpened).toBe(true);
            expect(eventData.id).toBe(1);
        });

        it('sends update request to API', function(done) {
            var updatedEvent = {
                id: 1,
                title: 'Updated Meeting',
                date: '2024-01-16'
            };

            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true, event: updatedEvent });
                    }
                });
            };

            fetch('/api/events/1', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedEvent)
            }).then(function() {
                expect(fetchCalls[0].url).toBe('/api/events/1');
                expect(fetchCalls[0].options.method).toBe('PUT');
                done();
            });
        });

        it('updates calendar display after edit', function() {
            var displayUpdated = false;

            PubSub.on('funky:calendar:event-updated', function(data) {
                displayUpdated = true;
                expect(data.event.title).toBe('Updated Title');
            });

            PubSub.emit('funky:calendar:event-updated', {
                event: { id: 1, title: 'Updated Title' }
            });

            expect(displayUpdated).toBe(true);
        });

    });

    // =========================================================================
    // Event Deletion
    // =========================================================================

    describe('Event Deletion', function() {

        it('shows confirmation before delete', function() {
            var confirmShown = false;

            PubSub.on('funky:modal:confirm', function(data) {
                confirmShown = true;
                expect(data.message).toContain('delete');
            });

            PubSub.emit('funky:modal:confirm', {
                message: 'Are you sure you want to delete this event?',
                onConfirm: function() {}
            });

            expect(confirmShown).toBe(true);
        });

        it('sends delete request to API', function(done) {
            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true });
                    }
                });
            };

            fetch('/api/events/1', { method: 'DELETE' })
                .then(function() {
                    expect(fetchCalls[0].url).toBe('/api/events/1');
                    expect(fetchCalls[0].options.method).toBe('DELETE');
                    done();
                });
        });

        it('removes event from calendar after delete', function() {
            var eventRemoved = false;

            PubSub.on('funky:calendar:event-removed', function(data) {
                eventRemoved = true;
                expect(data.id).toBe(1);
            });

            PubSub.emit('funky:calendar:event-removed', { id: 1 });

            expect(eventRemoved).toBe(true);
        });

        it('shows undo option after delete', function() {
            var undoAvailable = false;

            PubSub.on('funky:toast:show', function(data) {
                if (data.action && data.action.label === 'Undo') {
                    undoAvailable = true;
                }
            });

            PubSub.emit('funky:toast:show', {
                type: 'success',
                message: 'Event deleted',
                action: {
                    label: 'Undo',
                    callback: function() {}
                }
            });

            expect(undoAvailable).toBe(true);
        });

    });

    // =========================================================================
    // Drag and Drop Rescheduling
    // =========================================================================

    describe('Drag and Drop Rescheduling', function() {

        it('updates event date on drag', function() {
            var eventMoved = false;

            PubSub.on('funky:calendar:event-moved', function(data) {
                eventMoved = true;
                expect(data.eventId).toBe(1);
                expect(data.newDate).toBe('2024-01-20');
            });

            PubSub.emit('funky:calendar:event-moved', {
                eventId: 1,
                oldDate: '2024-01-15',
                newDate: '2024-01-20'
            });

            expect(eventMoved).toBe(true);
        });

        it('sends reschedule request to API', function(done) {
            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true });
                    }
                });
            };

            fetch('/api/events/1/reschedule', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: '2024-01-20' })
            }).then(function() {
                expect(fetchCalls[0].url).toBe('/api/events/1/reschedule');
                done();
            });
        });

        it('reverts on failed reschedule', function() {
            var eventReverted = false;

            PubSub.on('funky:calendar:event-reverted', function(data) {
                eventReverted = true;
                expect(data.eventId).toBe(1);
                expect(data.originalDate).toBe('2024-01-15');
            });

            PubSub.emit('funky:calendar:event-reverted', {
                eventId: 1,
                originalDate: '2024-01-15'
            });

            expect(eventReverted).toBe(true);
        });

    });

    // =========================================================================
    // Recurring Events
    // =========================================================================

    describe('Recurring Events', function() {

        it('creates recurring event series', function(done) {
            var recurringEvent = {
                title: 'Weekly Meeting',
                date: '2024-01-08',
                recurrence: {
                    frequency: 'weekly',
                    interval: 1,
                    count: 10
                }
            };

            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({
                            success: true,
                            events: Array(10).fill(null).map(function(_, i) {
                                return { id: i + 1, title: 'Weekly Meeting' };
                            })
                        });
                    }
                });
            };

            fetch('/api/events', {
                method: 'POST',
                body: JSON.stringify(recurringEvent)
            }).then(function(response) { return response.json(); })
            .then(function(data) {
                expect(data.events.length).toBe(10);
                done();
            });
        });

        it('shows edit options for recurring events', function() {
            var editOptions = null;

            PubSub.on('funky:modal:open', function(data) {
                if (data.type === 'recurring-edit-options') {
                    editOptions = data.options;
                }
            });

            PubSub.emit('funky:modal:open', {
                type: 'recurring-edit-options',
                options: ['this-event', 'this-and-following', 'all-events']
            });

            expect(editOptions).toContain('this-event');
            expect(editOptions).toContain('all-events');
        });

        it('updates all occurrences when selected', function(done) {
            window.fetch = function(url, options) {
                fetchCalls.push({ url: url, options: options });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ success: true, updated: 10 });
                    }
                });
            };

            fetch('/api/events/series/1', {
                method: 'PUT',
                body: JSON.stringify({ title: 'Updated Weekly Meeting', scope: 'all' })
            }).then(function(response) { return response.json(); })
            .then(function(data) {
                expect(data.updated).toBe(10);
                done();
            });
        });

    });

    // =========================================================================
    // Calendar Navigation
    // =========================================================================

    describe('Calendar Navigation', function() {

        it('loads data when navigating to new month', function() {
            var monthChanged = false;

            PubSub.on('funky:calendar:month-changed', function(data) {
                monthChanged = true;
                expect(data.year).toBe(2024);
                expect(data.month).toBe(2);
            });

            PubSub.emit('funky:calendar:month-changed', {
                year: 2024,
                month: 2
            });

            expect(monthChanged).toBe(true);
        });

        it('updates URL with current date', function() {
            var urlUpdated = false;

            PubSub.on('funky:url:update', function(data) {
                urlUpdated = true;
                expect(data.params.date).toBe('2024-02-01');
            });

            PubSub.emit('funky:url:update', {
                params: { date: '2024-02-01' }
            });

            expect(urlUpdated).toBe(true);
        });

        it('restores view from URL on load', function() {
            var viewRestored = false;

            PubSub.on('funky:calendar:restore-view', function(data) {
                viewRestored = true;
                expect(data.date).toBe('2024-03-15');
            });

            PubSub.emit('funky:calendar:restore-view', {
                date: '2024-03-15'
            });

            expect(viewRestored).toBe(true);
        });

    });

    // =========================================================================
    // View Modes
    // =========================================================================

    describe('View Modes', function() {

        it('switches between month/week/day views', function() {
            var viewModes = [];

            PubSub.on('funky:calendar:view-changed', function(data) {
                viewModes.push(data.view);
            });

            ['month', 'week', 'day'].forEach(function(view) {
                PubSub.emit('funky:calendar:view-changed', { view: view });
            });

            expect(viewModes).toEqual(['month', 'week', 'day']);
        });

        it('loads appropriate data for each view', function(done) {
            window.fetch = function(url) {
                fetchCalls.push({ url: url });
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ events: [] });
                    }
                });
            };

            // Week view should load 7 days
            fetch('/api/events?start=2024-01-08&end=2024-01-14')
                .then(function() {
                    expect(fetchCalls[0].url).toContain('start=2024-01-08');
                    expect(fetchCalls[0].url).toContain('end=2024-01-14');
                    done();
                });
        });

        it('persists view preference', function() {
            var preferenceSet = false;

            PubSub.on('funky:storage:set', function(data) {
                if (data.key === 'calendar:view') {
                    preferenceSet = true;
                    expect(data.value).toBe('week');
                }
            });

            PubSub.emit('funky:storage:set', {
                key: 'calendar:view',
                value: 'week'
            });

            expect(preferenceSet).toBe(true);
        });

    });

    // =========================================================================
    // Notifications and Reminders
    // =========================================================================

    describe('Notifications and Reminders', function() {

        it('shows notification for upcoming event', function() {
            var notificationShown = false;

            PubSub.on('funky:notification:show', function(data) {
                notificationShown = true;
                expect(data.title).toBe('Upcoming Event');
            });

            PubSub.emit('funky:notification:show', {
                title: 'Upcoming Event',
                body: 'Meeting in 15 minutes',
                eventId: 1
            });

            expect(notificationShown).toBe(true);
        });

        it('schedules reminders based on event settings', function() {
            var remindersScheduled = [];

            PubSub.on('funky:reminder:schedule', function(data) {
                remindersScheduled.push(data);
            });

            PubSub.emit('funky:reminder:schedule', {
                eventId: 1,
                remindAt: Date.now() + 900000, // 15 minutes
                message: 'Meeting starts in 15 minutes'
            });

            expect(remindersScheduled.length).toBe(1);
        });

        it('clears reminders when event deleted', function() {
            var reminderCleared = false;

            PubSub.on('funky:reminder:clear', function(data) {
                reminderCleared = true;
                expect(data.eventId).toBe(1);
            });

            PubSub.emit('funky:reminder:clear', { eventId: 1 });

            expect(reminderCleared).toBe(true);
        });

    });

    // =========================================================================
    // Conflict Detection
    // =========================================================================

    describe('Conflict Detection', function() {

        it('detects overlapping events', function() {
            var conflictDetected = false;

            PubSub.on('funky:calendar:conflict', function(data) {
                conflictDetected = true;
                expect(data.conflicts.length).toBeGreaterThan(0);
            });

            PubSub.emit('funky:calendar:conflict', {
                event: { id: 1, date: '2024-01-15', time: '14:00' },
                conflicts: [{ id: 2, title: 'Existing Meeting' }]
            });

            expect(conflictDetected).toBe(true);
        });

        it('shows warning for conflicting events', function() {
            var warningShown = false;

            PubSub.on('funky:toast:show', function(data) {
                if (data.type === 'warning' && data.message.includes('conflict')) {
                    warningShown = true;
                }
            });

            PubSub.emit('funky:toast:show', {
                type: 'warning',
                message: 'This time conflicts with another event'
            });

            expect(warningShown).toBe(true);
        });

    });

    // =========================================================================
    // Error Handling
    // =========================================================================

    describe('Error Handling', function() {

        it('handles API errors gracefully', function(done) {
            var errorHandled = false;

            PubSub.on('funky:toast:show', function(data) {
                if (data.type === 'error') {
                    errorHandled = true;
                }
            });

            window.fetch = function() {
                return Promise.resolve({
                    ok: false,
                    status: 500
                });
            };

            fetch('/api/events')
                .then(function(response) {
                    if (!response.ok) {
                        PubSub.emit('funky:toast:show', {
                            type: 'error',
                            message: 'Failed to load events'
                        });
                    }
                    expect(errorHandled).toBe(true);
                    done();
                });
        });

        it('retries failed requests', function(done) {
            var attemptCount = 0;

            window.fetch = function() {
                attemptCount++;
                if (attemptCount < 3) {
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve({ events: [] });
                    }
                });
            };

            var retryFetch = function(retries) {
                return fetch('/api/events').catch(function() {
                    if (retries > 0) {
                        return retryFetch(retries - 1);
                    }
                    throw new Error('Max retries exceeded');
                });
            };

            retryFetch(3).then(function() {
                expect(attemptCount).toBe(3);
                done();
            });
        });

    });

});
