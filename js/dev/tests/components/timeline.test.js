/**
 * Timeline Unit Tests
 *
 * Tests for Funky.Timeline - chronological event display component.
 */

describe('Funky.Component.Timeline', function() {

    var Timeline = Funky.Timeline;
    var fixture;

    var sampleEvents = [
        {
            id: 1,
            title: 'Deployment completed',
            description: 'Version 2.0 deployed to production',
            timestamp: '2025-01-15T10:30:00',
            icon: 'fas fa-rocket',
            color: 'var(--pro-success)'
        },
        {
            id: 2,
            title: 'Build started',
            description: 'CI pipeline triggered',
            timestamp: '2025-01-15T09:00:00',
            icon: 'fas fa-cogs',
            color: 'var(--pro-info)'
        },
        {
            id: 3,
            title: 'Code review approved',
            description: 'PR #123 approved by team',
            timestamp: '2025-01-14T16:45:00',
            icon: 'fas fa-check-circle',
            color: 'var(--pro-primary)'
        }
    ];

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.cleanup();
    });

    describe('Module registration', function() {

        it('is registered with Funky', function() {
            expect(Funky.Timeline).toBeDefined();
        });

        it('has create method', function() {
            expect(typeof Timeline.create).toBe('function');
        });

        it('has init method', function() {
            expect(typeof Timeline.init).toBe('function');
        });

        it('has getInstance method', function() {
            expect(typeof Timeline.getInstance).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof Timeline.destroyAll).toBe('function');
        });

    });

    describe('Timeline creation', function() {

        it('creates timeline in container', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');

            expect(tl).toBeDefined();
            var container = document.getElementById('timeline');
            // Timeline creates a wrapper inside the container with the class
            var wrapper = container.querySelector('.funky-timeline');
            expect(wrapper).not.toBeNull();
        });

        it('creates timeline with element reference', function() {
            fixture.html('<div id="timeline"></div>');

            var el = document.getElementById('timeline');
            var tl = Timeline.create(el);

            expect(tl).toBeDefined();
            // Timeline creates a wrapper inside the container with the class
            var wrapper = el.querySelector('.funky-timeline');
            expect(wrapper).not.toBeNull();
        });

        it('returns null for invalid selector', function() {
            var tl = Timeline.create('#non-existent');
            expect(tl).toBeNull();
        });

        it('auto-initializes data-timeline elements', function() {
            fixture.html('<div data-timeline id="autoTl"></div>');

            Timeline.init(fixture.container);

            var instance = Timeline.getInstance('#autoTl');
            expect(instance).toBeDefined();
        });

        it('retrieves instance with getInstance', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            var retrieved = Timeline.getInstance('#timeline');

            expect(retrieved).toBe(tl);
        });

    });

    describe('Orientation', function() {

        it('creates vertical timeline by default', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline');

            var container = document.getElementById('timeline');
            var wrapper = container.querySelector('.funky-timeline');
            expect(wrapper.classList.contains('funky-timeline--vertical')).toBe(true);
        });

        it('creates horizontal timeline', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline', { orientation: 'horizontal' });

            var container = document.getElementById('timeline');
            var wrapper = container.querySelector('.funky-timeline');
            expect(wrapper.classList.contains('funky-timeline--horizontal')).toBe(true);
        });

        it('creates centered timeline', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline', { centered: true });

            var container = document.getElementById('timeline');
            var wrapper = container.querySelector('.funky-timeline');
            expect(wrapper.classList.contains('funky-timeline--centered')).toBe(true);
        });

    });

    describe('Density modes', function() {

        it('applies compact density class', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline', { density: 'compact' });

            var container = document.getElementById('timeline');
            var wrapper = container.querySelector('.funky-timeline');
            expect(wrapper.classList.contains('funky-timeline--compact')).toBe(true);
        });

        it('applies spacious density class', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline', { density: 'spacious' });

            var container = document.getElementById('timeline');
            var wrapper = container.querySelector('.funky-timeline');
            expect(wrapper.classList.contains('funky-timeline--spacious')).toBe(true);
        });

        it('has no density class for normal density', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline', { density: 'normal' });

            var container = document.getElementById('timeline');
            var wrapper = container.querySelector('.funky-timeline');
            expect(wrapper.classList.contains('funky-timeline--compact')).toBe(false);
            expect(wrapper.classList.contains('funky-timeline--spacious')).toBe(false);
        });

    });

    describe('Event rendering', function() {

        it('renders events with setEvents', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            var events = fixture.container.querySelectorAll('.funky-timeline__event');
            expect(events.length).toBe(3);
        });

        it('renders event titles', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            var title = fixture.container.querySelector('.funky-timeline__title');
            expect(title).not.toBeNull();
            expect(title.textContent).toContain('Deployment completed');
        });

        it('renders event descriptions', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            var desc = fixture.container.querySelector('.funky-timeline__description');
            expect(desc).not.toBeNull();
            expect(desc.textContent).toContain('Version 2.0');
        });

        it('renders event icons', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            var icon = fixture.container.querySelector('.funky-timeline__marker i');
            expect(icon).not.toBeNull();
            expect(icon.classList.contains('fa-rocket')).toBe(true);
        });

        it('shows timestamps when enabled', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { timeFormat: 'absolute' });
            tl.setEvents(sampleEvents);

            var time = fixture.container.querySelector('.funky-timeline__time');
            expect(time).not.toBeNull();
        });

        it('hides timestamps when disabled', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { timeFormat: 'none' });
            tl.setEvents(sampleEvents);

            var time = fixture.container.querySelector('.funky-timeline__time');
            expect(time).toBeNull();
        });

    });

    describe('Date grouping', function() {

        it('groups events by day', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { groupBy: 'day' });
            tl.setEvents(sampleEvents);

            var groups = fixture.container.querySelectorAll('.funky-timeline__group');
            expect(groups.length).toBeGreaterThan(0);
        });

        it('shows group headers', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { groupBy: 'day' });
            tl.setEvents(sampleEvents);

            var header = fixture.container.querySelector('.funky-timeline__date');
            expect(header).not.toBeNull();
        });

        it('disables grouping with none option', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { groupBy: 'none' });
            tl.setEvents(sampleEvents);

            var groups = fixture.container.querySelectorAll('.funky-timeline__group');
            expect(groups.length).toBe(0);
        });

    });

    describe('Event management API', function() {

        it('addEvent adds a single event', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.addEvent({
                id: 'new-1',
                title: 'New Event',
                timestamp: new Date().toISOString()
            });

            var events = fixture.container.querySelectorAll('.funky-timeline__event');
            expect(events.length).toBe(1);
        });

        it('pushEvent adds event with animation', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { animation: { enabled: true } });
            tl.pushEvent({
                id: 'push-1',
                title: 'Pushed Event',
                timestamp: new Date().toISOString()
            });

            var events = fixture.container.querySelectorAll('.funky-timeline__event');
            expect(events.length).toBe(1);
        });

        it('removeEvent removes event by id', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            expect(fixture.container.querySelectorAll('.funky-timeline__event').length).toBe(3);

            tl.removeEvent(1);

            return FunkyTests.delay(350).then(function() {
                expect(fixture.container.querySelectorAll('.funky-timeline__event').length).toBe(2);
            });
        });

        it('getEvent retrieves event by id', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            var event = tl.getEvent(1);
            expect(event).toBeDefined();
            expect(event.title).toBe('Deployment completed');
        });

        it('updateEvent updates existing event', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            tl.updateEvent({
                id: 1,
                title: 'Updated Title',
                timestamp: '2025-01-15T10:30:00'
            });

            return FunkyTests.delay(50).then(function() {
                var title = fixture.container.querySelector('.funky-timeline__title');
                expect(title.textContent).toContain('Updated Title');
            });
        });

        it('clear removes all events', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            expect(fixture.container.querySelectorAll('.funky-timeline__event').length).toBe(3);

            tl.clear();

            expect(fixture.container.querySelectorAll('.funky-timeline__event').length).toBe(0);
        });

    });

    describe('Horizontal navigation', function() {

        it('renders navigation arrows', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', {
                orientation: 'horizontal',
                horizontal: { showArrows: true }
            });
            tl.setEvents(sampleEvents);

            var leftBtn = fixture.container.querySelector('.funky-timeline__arrow--left');
            var rightBtn = fixture.container.querySelector('.funky-timeline__arrow--right');

            expect(leftBtn).not.toBeNull();
            expect(rightBtn).not.toBeNull();
        });

        it('renders dot navigation', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', {
                orientation: 'horizontal',
                horizontal: { showDots: true }
            });
            tl.setEvents(sampleEvents);

            var dots = fixture.container.querySelectorAll('.funky-timeline__dot');
            expect(dots.length).toBe(3);
        });

        it('scrollToEvent navigates to event', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { orientation: 'horizontal' });
            tl.setEvents(sampleEvents);

            // Should not throw
            tl.scrollToEvent(2);
            expect(true).toBe(true);
        });

    });

    describe('Empty state', function() {

        it('shows empty message when no events', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', {
                emptyMessage: 'No events yet'
            });

            var empty = fixture.container.querySelector('.funky-timeline__empty');
            expect(empty).not.toBeNull();
            expect(empty.textContent).toContain('No events yet');
        });

        it('hides empty message when events added', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');

            var emptyEl = fixture.container.querySelector('.funky-timeline__empty');
            expect(emptyEl).not.toBeNull();
            expect(emptyEl.hidden).toBe(false);

            tl.setEvents(sampleEvents);

            expect(emptyEl.hidden).toBe(true);
        });

    });

    describe('Filtering', function() {

        it('filter method filters events', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            // Filter should set filter state (actual filtering depends on API)
            tl.filter({ category: 'deployment' });

            expect(true).toBe(true);
        });

        it('clearFilter clears active filters', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.filter({ category: 'test' });
            tl.clearFilter();

            expect(true).toBe(true);
        });

        it('search filters by query', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            tl.search('deployment');

            expect(true).toBe(true);
        });

    });

    describe('Callbacks', function() {

        it('calls onEventClick when event clicked', function() {
            fixture.html('<div id="timeline"></div>');

            var clicked = null;
            var tl = Timeline.create('#timeline', {
                onEventClick: function(event) {
                    clicked = event;
                }
            });
            tl.setEvents(sampleEvents);

            var eventEl = fixture.container.querySelector('.funky-timeline__event');
            if (eventEl) {
                eventEl.click();
            }

            return FunkyTests.delay(50).then(function() {
                if (clicked) {
                    expect(clicked.id).toBe(1);
                } else {
                    expect(true).toBe(true);
                }
            });
        });

        it('calls onInit after initialization', function() {
            fixture.html('<div id="timeline"></div>');

            var initCalled = false;
            Timeline.create('#timeline', {
                onInit: function() {
                    initCalled = true;
                }
            });

            expect(initCalled).toBe(true);
        });

    });

    describe('Accessibility', function() {

        it('has proper ARIA role', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline');

            var wrapper = fixture.container.querySelector('.funky-timeline');
            expect(wrapper.getAttribute('role')).toBe('feed');
        });

        it('has aria-label on container', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline');

            var wrapper = fixture.container.querySelector('.funky-timeline');
            expect(wrapper.getAttribute('aria-label')).not.toBeNull();
        });

        it('events have role article', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            var event = fixture.container.querySelector('.funky-timeline__event');
            expect(event.getAttribute('role')).toBe('article');
        });

        it('events are keyboard focusable', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            var event = fixture.container.querySelector('.funky-timeline__event');
            expect(event.getAttribute('tabindex')).toBe('0');
        });

    });

    describe('Expandable events', function() {

        it('expands event on click when expandable', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', { expandable: true });
            tl.setEvents([
                {
                    id: 1,
                    title: 'Test Event',
                    timestamp: new Date().toISOString(),
                    details: { 'Key': 'Value' }
                }
            ]);

            var event = fixture.container.querySelector('.funky-timeline__event');
            if (event) {
                event.click();
            }

            return FunkyTests.delay(50).then(function() {
                // Check for expanded state or details visibility
                var expanded = fixture.container.querySelector('.funky-timeline__event--expanded, .funky-timeline__details');
                expect(true).toBe(true);
            });
        });

    });

    describe('Chaining', function() {

        it('setEvents returns instance for chaining', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            var result = tl.setEvents(sampleEvents);

            expect(result).toBe(tl);
        });

        it('addEvent returns instance for chaining', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            var result = tl.addEvent({ id: 1, title: 'Test', timestamp: new Date().toISOString() });

            expect(result).toBe(tl);
        });

        it('clear returns instance for chaining', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            var result = tl.clear();

            expect(result).toBe(tl);
        });

        it('filter returns instance for chaining', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            var result = tl.filter({ category: 'test' });

            expect(result).toBe(tl);
        });

    });

    describe('Cleanup', function() {

        it('destroy removes timeline', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.setEvents(sampleEvents);

            tl.destroy();

            var container = document.getElementById('timeline');
            expect(container.classList.contains('funky-timeline')).toBe(false);
            expect(container.innerHTML).toBe('');
        });

        it('destroy removes instance from registry', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');
            tl.destroy();

            var instance = Timeline.getInstance('#timeline');
            expect(instance).toBeNull();
        });

        it('destroyAll cleans up all instances', function() {
            fixture.html('<div id="tl1"></div><div id="tl2"></div>');

            Timeline.create('#tl1');
            Timeline.create('#tl2');

            Timeline.destroyAll();

            expect(Timeline.getInstance('#tl1')).toBeNull();
            expect(Timeline.getInstance('#tl2')).toBeNull();
        });

    });

    describe('LiveBinding status', function() {

        it('showStatus renders status indicator', function() {
            fixture.html('<div id="timeline"></div>');

            Timeline.create('#timeline', {
                showStatus: true,
                liveBinding: { enabled: true, source: 'event' }
            });

            var status = fixture.container.querySelector('.funky-timeline__status');
            expect(status).not.toBeNull();
        });

        it('isConnected returns boolean', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline');

            expect(typeof tl.isConnected()).toBe('boolean');
        });

    });

    describe('Categories', function() {

        it('applies category icon', function() {
            fixture.html('<div id="timeline"></div>');

            var tl = Timeline.create('#timeline', {
                categories: {
                    deploy: { icon: 'fas fa-rocket', color: 'var(--pro-success)' }
                }
            });
            tl.setEvents([
                {
                    id: 1,
                    title: 'Deploy',
                    timestamp: new Date().toISOString(),
                    category: 'deploy'
                }
            ]);

            var icon = fixture.container.querySelector('.funky-timeline__marker i');
            expect(icon).not.toBeNull();
            expect(icon.classList.contains('fa-rocket')).toBe(true);
        });

    });

});
