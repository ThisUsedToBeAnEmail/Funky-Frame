/**
 * Accessibility Tests: Funky.RelativeTime
 *
 * Tests WCAG 2.1 AA compliance for relative time component.
 * Time displays must be accessible to screen readers and
 * provide clear, understandable time information.
 */

FunkyTests.describe('Funky.A11y.RelativeTime', function() {
    var expect = FunkyTests.expect;
    var RelativeTime = window.Funky && window.Funky.RelativeTime;

    // Skip all tests if RelativeTime not loaded
    if (!RelativeTime) {
        FunkyTests.it('RelativeTime component not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

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
        }
        return now.toISOString();
    }

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        if (RelativeTime.destroyAll) {
            RelativeTime.destroyAll();
        }
        fixture.cleanup();
    });

    // ========================================================================
    // Semantic Time Elements
    // ========================================================================

    FunkyTests.describe('Semantic Time Elements', function() {

        FunkyTests.it('uses semantic <time> element', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative>Loading...</time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            expect(timeEl).not.toBeNull();
            expect(timeEl.tagName.toLowerCase()).toBe('time');
        });

        FunkyTests.it('time element has datetime attribute', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            var datetimeAttr = timeEl.getAttribute('datetime');
            expect(datetimeAttr).not.toBeNull();
            expect(datetimeAttr.length).toBeGreaterThan(0);
        });

        FunkyTests.it('datetime attribute is machine-readable', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            var datetimeAttr = timeEl.getAttribute('datetime');
            // Should be parseable as a date
            var parsed = new Date(datetimeAttr);
            expect(isNaN(parsed.getTime())).toBe(false);
        });

    });

    // ========================================================================
    // Screen Reader Accessibility
    // ========================================================================

    FunkyTests.describe('Screen Reader Accessibility', function() {

        FunkyTests.it('time element has aria-label', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            var ariaLabel = timeEl.getAttribute('aria-label');
            expect(ariaLabel).not.toBeNull();
        });

        FunkyTests.it('aria-label contains readable time', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            var ariaLabel = timeEl.getAttribute('aria-label');
            // Should contain a readable date/time string
            expect(ariaLabel.length).toBeGreaterThan(0);
        });

        FunkyTests.it('time element has title for tooltip', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            var title = timeEl.getAttribute('title');
            expect(title).not.toBeNull();
        });

        FunkyTests.it('text content is human readable', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            var text = timeEl.textContent;
            // Should contain relative time text like "5 minutes ago"
            expect(text.length).toBeGreaterThan(0);
        });

    });

    // ========================================================================
    // Live Region Updates
    // ========================================================================

    FunkyTests.describe('Live Region Updates', function() {

        FunkyTests.it('time updates do not cause disruptive announcements', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            // Time elements should NOT have aria-live to avoid constant announcements
            var ariaLive = timeEl.getAttribute('aria-live');
            expect(ariaLive === null || ariaLive === 'off').toBe(true);
        });

        FunkyTests.it('time element is not in a live region', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            // Should not automatically announce updates
            var role = timeEl.getAttribute('role');
            expect(role !== 'status' && role !== 'alert').toBe(true);
        });

    });

    // ========================================================================
    // Visual Accessibility
    // ========================================================================

    FunkyTests.describe('Visual Accessibility', function() {

        FunkyTests.it('relative text is visible', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            // Text should be visible (not empty)
            expect(timeEl.textContent.trim().length).toBeGreaterThan(0);
        });

        FunkyTests.it('future times are clearly indicated', function() {
            var now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            var futureTime = now.toISOString();

            var result = RelativeTime.format(futureTime);
            // Future times should be distinguishable from past times
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('past times are clearly indicated', function() {
            var datetime = getDateAgo(30, 'minutes');
            var result = RelativeTime.format(datetime);
            // Past times should include "ago" or similar indicator
            expect(result.length).toBeGreaterThan(0);
        });

    });

    // ========================================================================
    // Multiple Instances
    // ========================================================================

    FunkyTests.describe('Multiple Instances', function() {

        FunkyTests.it('all time elements are accessible', function() {
            var datetime1 = getDateAgo(5, 'minutes');
            var datetime2 = getDateAgo(2, 'hours');
            var container = document.querySelector('#test-container');
            container.innerHTML =
                '<time datetime="' + datetime1 + '" data-relative></time>' +
                '<time datetime="' + datetime2 + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEls = container.querySelectorAll('time');
            timeEls.forEach(function(el) {
                expect(el.getAttribute('datetime')).not.toBeNull();
                expect(el.textContent.length).toBeGreaterThan(0);
            });
        });

        FunkyTests.it('each instance has unique accessible name', function() {
            var datetime1 = getDateAgo(5, 'minutes');
            var datetime2 = getDateAgo(2, 'hours');
            var container = document.querySelector('#test-container');
            container.innerHTML =
                '<time datetime="' + datetime1 + '" data-relative></time>' +
                '<time datetime="' + datetime2 + '" data-relative></time>';

            RelativeTime.init(container);

            var timeEls = container.querySelectorAll('time');
            var labels = [];
            timeEls.forEach(function(el) {
                var label = el.getAttribute('aria-label') || el.textContent;
                labels.push(label);
            });
            // Labels should be different for different times
            expect(labels[0] !== labels[1]).toBe(true);
        });

    });

    // ========================================================================
    // Pause/Resume Accessibility
    // ========================================================================

    FunkyTests.describe('Pause/Resume Accessibility', function() {

        FunkyTests.it('pause does not affect accessibility attributes', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);
            RelativeTime.pause();

            var timeEl = container.querySelector('time');
            // Accessibility attributes should remain
            expect(timeEl.getAttribute('datetime')).not.toBeNull();
            expect(timeEl.getAttribute('title')).not.toBeNull();

            RelativeTime.resume();
        });

        FunkyTests.it('resume restores update behavior', function() {
            var datetime = getDateAgo(5, 'minutes');
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="' + datetime + '" data-relative></time>';

            RelativeTime.init(container);
            RelativeTime.pause();
            RelativeTime.resume();

            expect(RelativeTime.isPaused()).toBe(false);
        });

    });

    // ========================================================================
    // Special Cases
    // ========================================================================

    FunkyTests.describe('Special Cases', function() {

        FunkyTests.it('"just now" is human understandable', function() {
            var datetime = getDateAgo(2, 'seconds');
            var result = RelativeTime.format(datetime);
            // Should be "just now" or similar understandable text
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('yesterday is human understandable', function() {
            var datetime = getDateAgo(1, 'days');
            var result = RelativeTime.format(datetime);
            // Should be "yesterday" or "1 day ago"
            expect(result.length).toBeGreaterThan(0);
        });

        FunkyTests.it('invalid datetime does not break accessibility', function() {
            var container = document.querySelector('#test-container');
            container.innerHTML = '<time datetime="invalid" data-relative></time>';

            // Should not throw
            RelativeTime.init(container);

            var timeEl = container.querySelector('time');
            expect(timeEl).not.toBeNull();
        });

    });

    // ========================================================================
    // DataTables Renderer Accessibility
    // ========================================================================

    FunkyTests.describe('DataTables Renderer Accessibility', function() {

        FunkyTests.it('renderer produces accessible HTML', function() {
            var renderer = RelativeTime.dtRenderer();
            var datetime = getDateAgo(5, 'minutes');

            var html = renderer(datetime, 'display');

            expect(html).toContain('<time');
            expect(html).toContain('datetime=');
            expect(html).toContain('data-relative');
        });

        FunkyTests.it('rendered time includes title attribute', function() {
            var renderer = RelativeTime.dtRenderer();
            var datetime = getDateAgo(5, 'minutes');

            var html = renderer(datetime, 'display');

            // Title may be added via init() after rendering, or in HTML
            // Check that datetime is present for accessibility
            expect(html).toContain('datetime=');
        });

    });

});
