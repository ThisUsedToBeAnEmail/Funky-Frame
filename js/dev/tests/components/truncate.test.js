/**
 * Funky.Truncate Tests
 *
 * Tests for the text truncation component.
 */

describe('Funky.Component.Truncate', function() {

    var Truncate = Funky.Truncate;
    var fixture;

    var longText = 'This is a very long piece of text that definitely needs to be truncated because it exceeds the default character limit and would look bad if displayed in full without any truncation applied to it.';

    beforeEach(function() {
        fixture = FunkyTests.fixture();
    });

    afterEach(function() {
        fixture.cleanup();
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Truncate')).toBe(true);
        });

        it('has apply method', function() {
            expect(typeof Truncate.apply).toBe('function');
        });

        it('has expand method', function() {
            expect(typeof Truncate.expand).toBe('function');
        });

        it('has collapse method', function() {
            expect(typeof Truncate.collapse).toBe('function');
        });

        it('has toggle method', function() {
            expect(typeof Truncate.toggle).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof Truncate.destroy).toBe('function');
        });

        it('has isExpanded method', function() {
            expect(typeof Truncate.isExpanded).toBe('function');
        });

        it('has text method', function() {
            expect(typeof Truncate.text).toBe('function');
        });

        it('has initAll method', function() {
            expect(typeof Truncate.initAll).toBe('function');
        });

    });

    describe('apply()', function() {

        it('returns instance object', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            var instance = Truncate.apply(el, { limit: 50 });

            expect(instance).not.toBeNull();
            expect(typeof instance.expand).toBe('function');
            expect(typeof instance.collapse).toBe('function');
        });

        it('adds funky-truncate class', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            expect(el.classList.contains('funky-truncate')).toBe(true);
        });

        it('truncates text to character limit', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            // Should be truncated (text content will be less than original)
            expect(el.textContent.length).toBeLessThan(longText.length);
        });

        it('adds ellipsis', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50, ellipsis: '...' });

            var ellipsisEl = el.querySelector('.funky-truncate-ellipsis');
            expect(ellipsisEl).not.toBeNull();
            expect(ellipsisEl.textContent).toBe('...');
        });

        it('adds toggle button', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            var toggle = el.querySelector('.funky-truncate-toggle');
            expect(toggle).not.toBeNull();
        });

        it('toggle button shows moreText', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50, moreText: 'Read more' });

            var toggle = el.querySelector('.funky-truncate-toggle');
            expect(toggle.textContent).toBe('Read more');
        });

        it('does not truncate short text', function() {
            var shortText = 'Short text';
            fixture.html('<p id="text">' + shortText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 100 });

            // Should keep original text, no toggle
            var toggle = el.querySelector('.funky-truncate-toggle');
            expect(toggle).toBeNull();
        });

        it('returns null for non-existent element', function() {
            var instance = Truncate.apply('#nonexistent');
            expect(instance).toBeNull();
        });

    });

    describe('expand() and collapse()', function() {

        it('expand() shows full text', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);

            expect(el.textContent).toContain(longText);
        });

        it('expand() adds expanded class', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);

            expect(el.classList.contains('expanded')).toBe(true);
        });

        it('collapse() returns to truncated text', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);
            Truncate.collapse(el);

            expect(el.textContent.length).toBeLessThan(longText.length);
        });

        it('collapse() removes expanded class', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);
            Truncate.collapse(el);

            expect(el.classList.contains('expanded')).toBe(false);
        });

        it('toggle button updates text on expand', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50, moreText: 'More', lessText: 'Less' });
            Truncate.expand(el);

            var toggle = el.querySelector('.funky-truncate-toggle');
            expect(toggle.textContent).toBe('Less');
        });

    });

    describe('toggle()', function() {

        it('toggles between expanded and collapsed', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            expect(Truncate.isExpanded(el)).toBe(false);

            Truncate.toggle(el);
            expect(Truncate.isExpanded(el)).toBe(true);

            Truncate.toggle(el);
            expect(Truncate.isExpanded(el)).toBe(false);
        });

    });

    describe('isExpanded()', function() {

        it('returns false initially', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            expect(Truncate.isExpanded(el)).toBe(false);
        });

        it('returns true when expanded', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);

            expect(Truncate.isExpanded(el)).toBe(true);
        });

        it('returns false for unknown element', function() {
            fixture.html('<p id="text">Text</p>');
            var el = fixture.query('#text');

            expect(Truncate.isExpanded(el)).toBe(false);
        });

    });

    describe('destroy()', function() {

        it('restores original text', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.destroy(el);

            expect(el.textContent).toBe(longText);
        });

        it('removes truncate classes', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.destroy(el);

            expect(el.classList.contains('funky-truncate')).toBe(false);
        });

        it('removes toggle button', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.destroy(el);

            var toggle = el.querySelector('.funky-truncate-toggle');
            expect(toggle).toBeNull();
        });

    });

    describe('text() utility', function() {

        it('truncates text string', function() {
            var result = Truncate.text(longText, 50);

            expect(result.length).toBeLessThanOrEqual(53); // limit + ellipsis
            expect(result.endsWith('...')).toBe(true);
        });

        it('returns original if under limit', function() {
            var short = 'Short text';
            var result = Truncate.text(short, 100);

            expect(result).toBe(short);
        });

        it('uses custom ellipsis', function() {
            var result = Truncate.text(longText, 50, '---');

            expect(result.endsWith('---')).toBe(true);
        });

        it('handles null/undefined', function() {
            expect(Truncate.text(null, 50)).toBeNull();
            expect(Truncate.text(undefined, 50)).toBeUndefined();
        });

    });

    describe('Events', function() {

        it('emits truncate:expand event', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');
            var eventFired = false;

            el.addEventListener('funky.truncate.expand', function() {
                eventFired = true;
            });

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);

            expect(eventFired).toBe(true);
        });

        it('emits truncate:collapse event', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');
            var eventFired = false;

            el.addEventListener('funky.truncate.collapse', function() {
                eventFired = true;
            });

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);
            Truncate.collapse(el);

            expect(eventFired).toBe(true);
        });

    });

    describe('Toggle button click', function() {

        it('clicking toggle expands text', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            var toggle = el.querySelector('.funky-truncate-toggle');
            FunkyTests.simulate.click(toggle);

            expect(Truncate.isExpanded(el)).toBe(true);
        });

        it('clicking toggle again collapses', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            var toggle = el.querySelector('.funky-truncate-toggle');
            FunkyTests.simulate.click(toggle);

            toggle = el.querySelector('.funky-truncate-toggle');
            FunkyTests.simulate.click(toggle);

            expect(Truncate.isExpanded(el)).toBe(false);
        });

    });

    describe('Accessibility', function() {

        it('toggle has aria-expanded', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });

            var toggle = el.querySelector('.funky-truncate-toggle');
            expect(toggle.getAttribute('aria-expanded')).toBe('false');
        });

        it('aria-expanded updates on expand', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50 });
            Truncate.expand(el);

            var toggle = el.querySelector('.funky-truncate-toggle');
            expect(toggle.getAttribute('aria-expanded')).toBe('true');
        });

    });

    describe('initAll()', function() {

        it('initializes data-truncate elements', function() {
            fixture.html('<p data-truncate="50">' + longText + '</p>');

            Truncate.initAll(fixture.container);

            var truncated = fixture.query('.funky-truncate');
            expect(truncated).not.toBeNull();
        });

        it('initializes data-truncate-lines elements', function() {
            fixture.html('<p data-truncate-lines="2">' + longText + '</p>');

            Truncate.initAll(fixture.container);

            var truncated = fixture.query('.funky-truncate-lines');
            expect(truncated).not.toBeNull();
        });

    });

    describe('Options', function() {

        it('inline option adds inline class', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50, inline: true });

            expect(el.classList.contains('funky-truncate-inline')).toBe(true);
        });

        it('animate option adds animate class', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50, animate: true });

            expect(el.classList.contains('animate')).toBe(true);
        });

        it('custom expandedClass is used', function() {
            fixture.html('<p id="text">' + longText + '</p>');
            var el = fixture.query('#text');

            Truncate.apply(el, { limit: 50, expandedClass: 'is-expanded' });
            Truncate.expand(el);

            expect(el.classList.contains('is-expanded')).toBe(true);
        });

    });

});
