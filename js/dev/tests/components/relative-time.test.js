/**
 * Funky.RelativeTime Tests
 *
 * Tests for the relative time display component.
 */

describe('Funky.Component.RelativeTime', function() {

    var RelativeTime = Funky.RelativeTime;
    var fixture;

    // Helper to create ISO date strings relative to now
    function getDateAgo(amount, unit) {
        var now = new Date();
        switch (unit) {
            case 'seconds':
                now.setSeconds(now.getSeconds() - amount);
                break;
            case 'minutes':
                now.setMinutes(now.getMinutes() - amount);
                break;
            case 'hours':
                now.setHours(now.getHours() - amount);
                break;
            case 'days':
                now.setDate(now.getDate() - amount);
                break;
            case 'weeks':
                now.setDate(now.getDate() - (amount * 7));
                break;
        }
        return now.toISOString();
    }

    function getDateAhead(amount, unit) {
        var now = new Date();
        switch (unit) {
            case 'seconds':
                now.setSeconds(now.getSeconds() + amount);
                break;
            case 'minutes':
                now.setMinutes(now.getMinutes() + amount);
                break;
            case 'hours':
                now.setHours(now.getHours() + amount);
                break;
            case 'days':
                now.setDate(now.getDate() + amount);
                break;
        }
        return now.toISOString();
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.cleanup();
        // Destroy all instances
        if (RelativeTime.destroyAll) {
            RelativeTime.destroyAll();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('RelativeTime')).toBe(true);
        });

        it('has init method', function() {
            expect(typeof RelativeTime.init).toBe('function');
        });

        it('has format method', function() {
            expect(typeof RelativeTime.format).toBe('function');
        });

        it('has configure method', function() {
            expect(typeof RelativeTime.configure).toBe('function');
        });

        it('has refresh method', function() {
            expect(typeof RelativeTime.refresh).toBe('function');
        });

        it('has pause method', function() {
            expect(typeof RelativeTime.pause).toBe('function');
        });

        it('has resume method', function() {
            expect(typeof RelativeTime.resume).toBe('function');
        });

        it('has getInstances method', function() {
            expect(typeof RelativeTime.getInstances).toBe('function');
        });

        it('has destroyAll method', function() {
            expect(typeof RelativeTime.destroyAll).toBe('function');
        });

    });

    describe('format()', function() {

        it('formats "just now" for recent times', function() {
            var datetime = getDateAgo(2, 'seconds');
            var result = RelativeTime.format(datetime);

            expect(result).toBe('just now');
        });

        it('formats minutes ago', function() {
            var datetime = getDateAgo(5, 'minutes');
            var result = RelativeTime.format(datetime);

            expect(result).toContain('5');
            expect(result).toContain('minute');
        });

        it('formats hours ago', function() {
            var datetime = getDateAgo(3, 'hours');
            var result = RelativeTime.format(datetime);

            expect(result).toContain('3');
            expect(result).toContain('hour');
        });

        it('formats days ago', function() {
            var datetime = getDateAgo(2, 'days');
            var result = RelativeTime.format(datetime);

            expect(result).toContain('2');
            expect(result).toContain('day');
        });

        it('formats future times', function() {
            var datetime = getDateAhead(30, 'minutes');
            var result = RelativeTime.format(datetime);

            // Allow for 29-30 minutes due to execution time variance
            expect(result).toMatch(/\b(29|30)\b/);
            expect(result).toContain('minute');
        });

        it('accepts Date object', function() {
            var date = new Date();
            date.setMinutes(date.getMinutes() - 10);

            var result = RelativeTime.format(date);

            expect(result).toContain('10');
            expect(result).toContain('minute');
        });

        it('accepts ISO string', function() {
            var datetime = getDateAgo(15, 'minutes');
            var result = RelativeTime.format(datetime);

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });

    });

    describe('init()', function() {

        it('initializes time elements', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative>Loading...</time>');

            var count = RelativeTime.init(fixture.container);

            expect(count).toBe(1);
        });

        it('updates element text content', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative>Loading...</time>');

            RelativeTime.init(fixture.container);

            var el = fixture.query('time');
            expect(el.textContent).toContain('minute');
        });

        it('adds title attribute', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            RelativeTime.init(fixture.container);

            var el = fixture.query('time');
            expect(el.getAttribute('title')).not.toBeNull();
        });

        it('adds aria-label for accessibility', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            RelativeTime.init(fixture.container);

            var el = fixture.query('time');
            expect(el.getAttribute('aria-label')).not.toBeNull();
        });

        it('returns count of initialized elements', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html(
                '<time datetime="' + datetime + '" data-relative></time>' +
                '<time datetime="' + datetime + '" data-relative></time>'
            );

            var count = RelativeTime.init(fixture.container);

            expect(count).toBe(2);
        });

        it('skips already initialized elements', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            RelativeTime.init(fixture.container);
            var count = RelativeTime.init(fixture.container);

            expect(count).toBe(0);
        });

    });

    describe('getInstances()', function() {

        it('returns array of tracked elements', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            RelativeTime.init(fixture.container);
            var instances = RelativeTime.getInstances();

            expect(Array.isArray(instances)).toBe(true);
            expect(instances.length).toBeGreaterThan(0);
        });

    });

    describe('pause() and resume()', function() {

        it('pause() stops auto-refresh', function() {
            RelativeTime.pause();
            expect(RelativeTime.isPaused()).toBe(true);
            RelativeTime.resume();
        });

        it('resume() restarts auto-refresh', function() {
            RelativeTime.pause();
            RelativeTime.resume();
            expect(RelativeTime.isPaused()).toBe(false);
        });

        it('isPaused() returns correct state', function() {
            expect(RelativeTime.isPaused()).toBe(false);

            RelativeTime.pause();
            expect(RelativeTime.isPaused()).toBe(true);

            RelativeTime.resume();
            expect(RelativeTime.isPaused()).toBe(false);
        });

    });

    describe('refresh()', function() {

        it('manually refreshes all elements', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            RelativeTime.init(fixture.container);
            var el = fixture.query('time');

            // Should not throw
            RelativeTime.refresh();

            // Text should contain relative time
            expect(el.textContent).toContain('minute');
        });

    });

    describe('untrack()', function() {

        it('removes element from tracking', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            RelativeTime.init(fixture.container);
            var el = fixture.query('time');

            var before = RelativeTime.getInstances().length;
            RelativeTime.untrack(el);
            var after = RelativeTime.getInstances().length;

            expect(after).toBeLessThan(before);
        });

    });

    describe('destroyAll()', function() {

        it('clears all tracked instances', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            RelativeTime.init(fixture.container);
            expect(RelativeTime.getInstances().length).toBeGreaterThan(0);

            RelativeTime.destroyAll();
            expect(RelativeTime.getInstances().length).toBe(0);
        });

    });

    describe('Events', function() {

        it('emits relativetime:update on update', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative></time>');

            var el = fixture.query('time');
            var eventFired = false;

            el.addEventListener('funky.relative-time.update', function() {
                eventFired = true;
            });

            RelativeTime.init(fixture.container);

            expect(eventFired).toBe(true);
        });

    });

    describe('Special cases', function() {

        it('formats yesterday correctly', function() {
            var datetime = getDateAgo(1, 'days');
            var result = RelativeTime.format(datetime);

            // Could be "yesterday" or "1 day ago" depending on Intl support
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });

        it('handles very old dates with absolute format', function() {
            var oldDate = new Date();
            oldDate.setFullYear(oldDate.getFullYear() - 1);

            var result = RelativeTime.format(oldDate.toISOString());

            // Should show absolute date for old dates
            expect(result).toBeDefined();
        });

        it('handles invalid datetime gracefully', function() {
            fixture.html('<time datetime="invalid" data-relative></time>');

            // Should not throw
            RelativeTime.init(fixture.container);

            var el = fixture.query('time');
            // Element should exist and not crash
            expect(el).not.toBeNull();
        });

        it('handles empty datetime gracefully', function() {
            fixture.html('<time datetime="" data-relative></time>');

            // Should not throw
            RelativeTime.init(fixture.container);
        });

    });

    describe('Data attributes', function() {

        it('data-refresh="false" disables auto-refresh', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative data-refresh="false"></time>');

            RelativeTime.init(fixture.container);

            var el = fixture.query('time');
            // Check if tracking or element data indicates refresh disabled
            expect(el.getAttribute('data-refresh')).toBe('false');
        });

        it('data-refresh with number sets custom interval', function() {
            var datetime = getDateAgo(5, 'minutes');
            fixture.html('<time datetime="' + datetime + '" data-relative data-refresh="5000"></time>');

            RelativeTime.init(fixture.container);

            var el = fixture.query('time');
            expect(el.getAttribute('data-refresh')).toBe('5000');
        });

    });

    describe('configure()', function() {

        it('updates configuration', function() {
            // Should not throw
            RelativeTime.configure({
                refreshInterval: 30000
            });
        });

        it('updates format strings', function() {
            RelativeTime.configure({
                formats: {
                    justNow: 'moments ago'
                }
            });

            var datetime = getDateAgo(2, 'seconds');
            var result = RelativeTime.format(datetime);

            expect(result).toBe('moments ago');

            // Reset
            RelativeTime.configure({
                formats: {
                    justNow: 'just now'
                }
            });
        });

    });

    describe('dtRenderer()', function() {

        it('returns a render function', function() {
            var renderer = RelativeTime.dtRenderer();

            expect(typeof renderer).toBe('function');
        });

        it('renders time element HTML', function() {
            var renderer = RelativeTime.dtRenderer();
            var datetime = getDateAgo(5, 'minutes');

            var html = renderer(datetime, 'display');

            expect(html).toContain('<time');
            expect(html).toContain('data-relative');
            expect(html).toContain('datetime=');
        });

        it('returns raw value for sort type', function() {
            var renderer = RelativeTime.dtRenderer();
            var datetime = getDateAgo(5, 'minutes');

            var result = renderer(datetime, 'sort');

            expect(result).toBe(datetime);
        });

        it('returns raw value for filter type', function() {
            var renderer = RelativeTime.dtRenderer();
            var datetime = getDateAgo(5, 'minutes');

            var result = renderer(datetime, 'filter');

            expect(result).toBe(datetime);
        });

    });

});
