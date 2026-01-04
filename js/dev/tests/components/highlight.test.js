/**
 * Funky.Highlight - Unit Tests
 * Tests for text highlighting, navigation, and search
 */
FunkyTests.describe('Funky.Component.Highlight', function() {
    'use strict';

    var Highlight;
    var testContainer;

    FunkyTests.beforeEach(function() {
        Highlight = Funky.Highlight;

        // Create test container
        testContainer = document.createElement('div');
        testContainer.id = 'highlight-test-container';
        document.body.appendChild(testContainer);
    });

    FunkyTests.afterEach(function() {
        // Clear highlights
        if (testContainer && Highlight) {
            Highlight.clear(testContainer);
        }

        // Remove test container
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    FunkyTests.describe('Registration', function() {

        FunkyTests.it('should be registered with Funky namespace', function() {
            FunkyTests.expect(Funky.Highlight).toBeDefined();
        });

        FunkyTests.it('should expose expected API methods', function() {
            FunkyTests.expect(typeof Highlight.apply).toBe('function');
            FunkyTests.expect(typeof Highlight.clear).toBe('function');
            FunkyTests.expect(typeof Highlight.next).toBe('function');
            FunkyTests.expect(typeof Highlight.prev).toBe('function');
            FunkyTests.expect(typeof Highlight.count).toBe('function');
            FunkyTests.expect(typeof Highlight.mark).toBe('function');
        });

    });

    // =========================================================================
    // APPLY HIGHLIGHTING
    // =========================================================================

    FunkyTests.describe('apply()', function() {

        FunkyTests.it('should highlight single term', function() {
            testContainer.innerHTML = '<p>The quick brown fox jumps over the lazy dog.</p>';

            var instance = Highlight.apply(testContainer, 'fox');

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.getCount()).toBe(1);
        });

        FunkyTests.it('should highlight multiple occurrences', function() {
            testContainer.innerHTML = '<p>The cat sat on the mat with the cat.</p>';

            var instance = Highlight.apply(testContainer, 'the');

            FunkyTests.expect(instance.getCount()).toBe(3);
        });

        FunkyTests.it('should highlight multiple terms', function() {
            testContainer.innerHTML = '<p>The quick brown fox jumps over the lazy dog.</p>';

            var instance = Highlight.apply(testContainer, ['fox', 'dog']);

            FunkyTests.expect(instance.getCount()).toBe(2);
        });

        FunkyTests.it('should be case insensitive by default', function() {
            testContainer.innerHTML = '<p>FOX fox Fox fOx</p>';

            var instance = Highlight.apply(testContainer, 'fox');

            FunkyTests.expect(instance.getCount()).toBe(4);
        });

        FunkyTests.it('should support case sensitive option', function() {
            testContainer.innerHTML = '<p>FOX fox Fox fOx</p>';

            var instance = Highlight.apply(testContainer, 'fox', { caseSensitive: true });

            FunkyTests.expect(instance.getCount()).toBe(1);
        });

        FunkyTests.it('should support whole word matching', function() {
            testContainer.innerHTML = '<p>fox foxes outfox refox fox</p>';

            var instance = Highlight.apply(testContainer, 'fox', { wholeWord: true });

            FunkyTests.expect(instance.getCount()).toBe(2);
        });

        FunkyTests.it('should create mark elements', function() {
            testContainer.innerHTML = '<p>Find the word here.</p>';

            Highlight.apply(testContainer, 'word');

            var marks = testContainer.querySelectorAll('mark.funky-highlight');
            FunkyTests.expect(marks.length).toBe(1);
            FunkyTests.expect(marks[0].textContent).toBe('word');
        });

        FunkyTests.it('should emit funky.highlight.applied event', function() {
            testContainer.innerHTML = '<p>Test content here.</p>';

            var eventData = null;
            Funky.Events.on(testContainer, 'funky.highlight.applied', function(e) {
                eventData = e.detail;
            });

            Highlight.apply(testContainer, 'content');

            FunkyTests.expect(eventData).toBeDefined();
            FunkyTests.expect(eventData.count).toBe(1);
            FunkyTests.expect(eventData.terms).toContain('content');
        });

    });

    // =========================================================================
    // NAVIGATION
    // =========================================================================

    FunkyTests.describe('Navigation', function() {

        FunkyTests.it('should navigate to next match', function() {
            testContainer.innerHTML = '<p>one two one three one</p>';

            var instance = Highlight.apply(testContainer, 'one');
            var first = instance.next();

            FunkyTests.expect(first).toBeDefined();
            FunkyTests.expect(first.classList.contains('funky-highlight-current')).toBe(true);
            FunkyTests.expect(instance.getCurrentIndex()).toBe(0);
        });

        FunkyTests.it('should cycle through matches with next()', function() {
            testContainer.innerHTML = '<p>a b a c a</p>';

            var instance = Highlight.apply(testContainer, 'a');

            instance.next(); // index 0
            instance.next(); // index 1
            var third = instance.next(); // index 2

            FunkyTests.expect(instance.getCurrentIndex()).toBe(2);
        });

        FunkyTests.it('should wrap around at end', function() {
            testContainer.innerHTML = '<p>x y x</p>';

            var instance = Highlight.apply(testContainer, 'x');

            instance.next(); // 0
            instance.next(); // 1
            instance.next(); // wraps to 0

            FunkyTests.expect(instance.getCurrentIndex()).toBe(0);
        });

        FunkyTests.it('should navigate to previous match', function() {
            testContainer.innerHTML = '<p>a b a c a</p>';

            var instance = Highlight.apply(testContainer, 'a');

            instance.next(); // 0
            instance.next(); // 1
            instance.prev(); // back to 0

            FunkyTests.expect(instance.getCurrentIndex()).toBe(0);
        });

        FunkyTests.it('should wrap to end when going prev from start', function() {
            testContainer.innerHTML = '<p>x y x z x</p>';

            var instance = Highlight.apply(testContainer, 'x');

            instance.next(); // 0
            instance.prev(); // wraps to last (2)

            FunkyTests.expect(instance.getCurrentIndex()).toBe(2);
        });

        FunkyTests.it('should emit funky.highlight.navigate event', function() {
            testContainer.innerHTML = '<p>test test test</p>';

            var instance = Highlight.apply(testContainer, 'test');

            var eventData = null;
            Funky.Events.on(testContainer, 'funky.highlight.navigate', function(e) {
                eventData = e.detail;
            });

            instance.next();

            FunkyTests.expect(eventData).toBeDefined();
            FunkyTests.expect(eventData.index).toBe(0);
            FunkyTests.expect(eventData.total).toBe(3);
        });

        FunkyTests.it('should go to specific index', function() {
            testContainer.innerHTML = '<p>a a a a a</p>';

            var instance = Highlight.apply(testContainer, 'a');
            var match = instance.goTo(3);

            FunkyTests.expect(instance.getCurrentIndex()).toBe(3);
            FunkyTests.expect(match.classList.contains('funky-highlight-current')).toBe(true);
        });

    });

    // =========================================================================
    // CLEAR
    // =========================================================================

    FunkyTests.describe('clear()', function() {

        FunkyTests.it('should remove all highlights', function() {
            testContainer.innerHTML = '<p>Find words here.</p>';

            Highlight.apply(testContainer, 'words');
            Highlight.clear(testContainer);

            var marks = testContainer.querySelectorAll('mark');
            FunkyTests.expect(marks.length).toBe(0);
        });

        FunkyTests.it('should restore original HTML', function() {
            var original = '<p>Original content here.</p>';
            testContainer.innerHTML = original;

            Highlight.apply(testContainer, 'content');
            Highlight.clear(testContainer);

            FunkyTests.expect(testContainer.innerHTML).toBe(original);
        });

        FunkyTests.it('should emit funky.highlight.cleared event', function() {
            testContainer.innerHTML = '<p>Test content.</p>';

            Highlight.apply(testContainer, 'Test');

            var cleared = false;
            Funky.Events.on(testContainer, 'funky.highlight.cleared', function() {
                cleared = true;
            });

            Highlight.clear(testContainer);

            FunkyTests.expect(cleared).toBe(true);
        });

    });

    // =========================================================================
    // COUNT
    // =========================================================================

    FunkyTests.describe('count()', function() {

        FunkyTests.it('should return count from existing highlights', function() {
            testContainer.innerHTML = '<p>one two one three one</p>';

            Highlight.apply(testContainer, 'one');
            var count = Highlight.count(testContainer);

            FunkyTests.expect(count).toBe(3);
        });

        FunkyTests.it('should count without applying highlights', function() {
            testContainer.innerHTML = '<p>apple banana apple cherry apple</p>';

            var count = Highlight.count(testContainer, 'apple');

            FunkyTests.expect(count).toBe(3);
            // Should clean up temp highlights
            var marks = testContainer.querySelectorAll('mark');
            FunkyTests.expect(marks.length).toBe(0);
        });

    });

    // =========================================================================
    // MARK UTILITY
    // =========================================================================

    FunkyTests.describe('mark()', function() {

        FunkyTests.it('should return marked HTML string', function() {
            var result = Highlight.mark('Hello World', 'World');

            FunkyTests.expect(result).toContain('<mark');
            FunkyTests.expect(result).toContain('World');
            FunkyTests.expect(result).toContain('funky-highlight');
        });

        FunkyTests.it('should mark multiple terms', function() {
            var result = Highlight.mark('The quick brown fox', ['quick', 'fox']);

            FunkyTests.expect(result.match(/<mark/g).length).toBe(2);
        });

        FunkyTests.it('should escape HTML in input', function() {
            var result = Highlight.mark('<script>alert("xss")</script>', 'script');

            FunkyTests.expect(result).not.toContain('<script>');
            FunkyTests.expect(result).toContain('&lt;');
        });

        FunkyTests.it('should be case insensitive by default', function() {
            var result = Highlight.mark('ABC abc AbC', 'abc');

            FunkyTests.expect(result.match(/<mark/g).length).toBe(3);
        });

        FunkyTests.it('should support case sensitive option', function() {
            var result = Highlight.mark('ABC abc AbC', 'abc', { caseSensitive: true });

            FunkyTests.expect(result.match(/<mark/g).length).toBe(1);
        });

    });

    // =========================================================================
    // HAS HIGHLIGHTS
    // =========================================================================

    FunkyTests.describe('hasHighlights()', function() {

        FunkyTests.it('should return true when highlights exist', function() {
            testContainer.innerHTML = '<p>Test content here.</p>';

            Highlight.apply(testContainer, 'content');

            FunkyTests.expect(Highlight.hasHighlights(testContainer)).toBe(true);
        });

        FunkyTests.it('should return false when no highlights', function() {
            testContainer.innerHTML = '<p>Test content here.</p>';

            FunkyTests.expect(Highlight.hasHighlights(testContainer)).toBe(false);
        });

        FunkyTests.it('should return false after clear', function() {
            testContainer.innerHTML = '<p>Test content here.</p>';

            Highlight.apply(testContainer, 'content');
            Highlight.clear(testContainer);

            FunkyTests.expect(Highlight.hasHighlights(testContainer)).toBe(false);
        });

    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    FunkyTests.describe('Edge Cases', function() {

        FunkyTests.it('should handle empty search term', function() {
            testContainer.innerHTML = '<p>Test content.</p>';

            var instance = Highlight.apply(testContainer, '');

            FunkyTests.expect(instance.getCount()).toBe(0);
        });

        FunkyTests.it('should handle no matches', function() {
            testContainer.innerHTML = '<p>Test content.</p>';

            var instance = Highlight.apply(testContainer, 'xyz123');

            FunkyTests.expect(instance.getCount()).toBe(0);
        });

        FunkyTests.it('should skip script and style elements', function() {
            testContainer.innerHTML = '<p>test</p><script>test</script><style>.test{}</style>';

            var instance = Highlight.apply(testContainer, 'test');

            // Should only match the one in <p>
            FunkyTests.expect(instance.getCount()).toBe(1);
        });

        FunkyTests.it('should escape regex special characters', function() {
            testContainer.innerHTML = '<p>Price is $100.00 (plus tax)</p>';

            var instance = Highlight.apply(testContainer, '$100.00');

            FunkyTests.expect(instance.getCount()).toBe(1);
        });

        FunkyTests.it('should respect maxMatches option', function() {
            testContainer.innerHTML = '<p>' + 'word '.repeat(100) + '</p>';

            var instance = Highlight.apply(testContainer, 'word', { maxMatches: 10 });

            FunkyTests.expect(instance.getCount()).toBe(10);
        });

    });

    // =========================================================================
    // STATIC METHODS
    // =========================================================================

    FunkyTests.describe('Static Methods', function() {

        FunkyTests.it('should support Highlight.next() static method', function() {
            testContainer.innerHTML = '<p>a b a</p>';

            Highlight.apply(testContainer, 'a');
            var current = Highlight.next(testContainer);

            FunkyTests.expect(current).toBeDefined();
            FunkyTests.expect(current.classList.contains('funky-highlight-current')).toBe(true);
        });

        FunkyTests.it('should support Highlight.prev() static method', function() {
            testContainer.innerHTML = '<p>a b a</p>';

            Highlight.apply(testContainer, 'a');
            Highlight.next(testContainer);
            Highlight.next(testContainer);
            var current = Highlight.prev(testContainer);

            FunkyTests.expect(current).toBeDefined();
            FunkyTests.expect(Highlight.getCurrentIndex(testContainer)).toBe(0);
        });

        FunkyTests.it('should support Highlight.scrollToFirst() static method', function() {
            testContainer.innerHTML = '<p>x y z x</p>';

            Highlight.apply(testContainer, 'x');
            var first = Highlight.scrollToFirst(testContainer);

            FunkyTests.expect(first).toBeDefined();
            FunkyTests.expect(Highlight.getCurrentIndex(testContainer)).toBe(0);
        });

        FunkyTests.it('should support Highlight.goTo() static method', function() {
            testContainer.innerHTML = '<p>a a a a a</p>';

            Highlight.apply(testContainer, 'a');
            var match = Highlight.goTo(testContainer, 2);

            FunkyTests.expect(match).toBeDefined();
            FunkyTests.expect(Highlight.getCurrentIndex(testContainer)).toBe(2);
        });

    });

});
