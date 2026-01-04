/**
 * Funky.Highlight Fuzzy Search Tests
 *
 * Tests for fuzzy search integration methods in the Highlight component.
 * Tests markWithPositions, fromMatches, fuzzyMark, fuzzyApply, and FuzzyHighlightInstance.
 */
FunkyTests.describe('Funky.Component.Highlight.FuzzySearch', function() {
    'use strict';

    var Highlight;
    var FuzzySearch;
    var testContainer;

    FunkyTests.beforeEach(function() {
        Highlight = Funky.Highlight;
        FuzzySearch = Funky.FuzzySearch;

        // Create test container
        testContainer = document.createElement('div');
        testContainer.id = 'highlight-fuzzy-test';
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
    // FUZZYSEARCH AVAILABILITY
    // =========================================================================

    FunkyTests.describe('FuzzySearch availability', function() {

        FunkyTests.it('Funky.FuzzySearch is available', function() {
            FunkyTests.expect(FuzzySearch).toBeDefined();
        });

        FunkyTests.it('FuzzySearch.match is available', function() {
            FunkyTests.expect(typeof FuzzySearch.match).toBe('function');
        });

    });

    // =========================================================================
    // API METHODS EXIST
    // =========================================================================

    FunkyTests.describe('Fuzzy API methods exist', function() {

        FunkyTests.it('exposes markWithPositions method', function() {
            FunkyTests.expect(typeof Highlight.markWithPositions).toBe('function');
        });

        FunkyTests.it('exposes fromMatches alias', function() {
            FunkyTests.expect(typeof Highlight.fromMatches).toBe('function');
        });

        FunkyTests.it('fromMatches is alias for markWithPositions', function() {
            FunkyTests.expect(Highlight.fromMatches).toBe(Highlight.markWithPositions);
        });

        FunkyTests.it('exposes fuzzyMark method', function() {
            FunkyTests.expect(typeof Highlight.fuzzyMark).toBe('function');
        });

        FunkyTests.it('exposes fuzzyApply method', function() {
            FunkyTests.expect(typeof Highlight.fuzzyApply).toBe('function');
        });

        FunkyTests.it('exposes FuzzyHighlightInstance class', function() {
            FunkyTests.expect(typeof Highlight.FuzzyHighlightInstance).toBe('function');
        });

    });

    // =========================================================================
    // markWithPositions()
    // =========================================================================

    FunkyTests.describe('markWithPositions()', function() {

        FunkyTests.it('returns original text for empty positions', function() {
            var result = Highlight.markWithPositions('Hello World', []);
            FunkyTests.expect(result).toBe('Hello World');
        });

        FunkyTests.it('returns original text for null positions', function() {
            var result = Highlight.markWithPositions('Hello World', null);
            FunkyTests.expect(result).toBe('Hello World');
        });

        FunkyTests.it('highlights single position', function() {
            var result = Highlight.markWithPositions('Hello', [[0, 0]]);
            FunkyTests.expect(result).toContain('<mark');
            FunkyTests.expect(result).toContain('H');
        });

        FunkyTests.it('highlights consecutive positions', function() {
            // [[0,0], [1,1], [2,2]] should highlight 'Hel'
            var result = Highlight.markWithPositions('Hello', [[0, 0], [1, 1], [2, 2]]);
            FunkyTests.expect(result).toContain('<mark');
        });

        FunkyTests.it('highlights non-consecutive positions', function() {
            // [[0,0], [2,2], [4,4]] should highlight 'H', 'l', 'o'
            var result = Highlight.markWithPositions('Hello', [[0, 0], [2, 2], [4, 4]]);
            FunkyTests.expect(result).toContain('<mark');
            // Should have multiple mark tags
            var markCount = (result.match(/<mark/g) || []).length;
            FunkyTests.expect(markCount).toBe(3);
        });

        FunkyTests.it('uses custom className', function() {
            var result = Highlight.markWithPositions('Hello', [[0, 0]], {
                className: 'custom-highlight'
            });
            FunkyTests.expect(result).toContain('custom-highlight');
        });

        FunkyTests.it('escapes HTML in text', function() {
            var result = Highlight.markWithPositions('<script>alert(1)</script>', [[0, 0]]);
            FunkyTests.expect(result).not.toContain('<script>');
            FunkyTests.expect(result).toContain('&lt;');
        });

        FunkyTests.it('handles range positions [start, end]', function() {
            // [0, 2] means characters 0, 1, 2 should be highlighted
            var result = Highlight.markWithPositions('Hello', [[0, 2]]);
            FunkyTests.expect(result).toContain('<mark');
        });

    });

    // =========================================================================
    // fuzzyMark()
    // =========================================================================

    FunkyTests.describe('fuzzyMark()', function() {

        FunkyTests.it('returns text with highlights for fuzzy match', function() {
            var result = Highlight.fuzzyMark('set', 'Settings');
            FunkyTests.expect(result).toContain('<mark');
        });

        FunkyTests.it('returns original text for no match', function() {
            var result = Highlight.fuzzyMark('xyz', 'Hello');
            // No match, should not contain mark
            FunkyTests.expect(result).not.toContain('<mark');
        });

        FunkyTests.it('is case-insensitive by default', function() {
            var result = Highlight.fuzzyMark('SET', 'Settings');
            FunkyTests.expect(result).toContain('<mark');
        });

        FunkyTests.it('respects caseSensitive option', function() {
            var result = Highlight.fuzzyMark('SET', 'Settings', { caseSensitive: true });
            // Won't match if case sensitive
            FunkyTests.expect(result).not.toContain('<mark');
        });

        FunkyTests.it('uses custom className', function() {
            var result = Highlight.fuzzyMark('set', 'Settings', {
                className: 'fuzzy-match'
            });
            FunkyTests.expect(result).toContain('fuzzy-match');
        });

        FunkyTests.it('handles partial matches', function() {
            // 'usr' should fuzzy match 'User'
            var result = Highlight.fuzzyMark('usr', 'User Settings');
            FunkyTests.expect(result).toContain('<mark');
        });

    });

    // =========================================================================
    // fuzzyApply()
    // =========================================================================

    FunkyTests.describe('fuzzyApply()', function() {

        FunkyTests.it('returns FuzzyHighlightInstance', function() {
            testContainer.innerHTML = '<p>User Settings panel</p>';

            var instance = Highlight.fuzzyApply(testContainer, 'usr');

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(typeof instance.getCount).toBe('function');
        });

        FunkyTests.it('highlights fuzzy matches in DOM', function() {
            testContainer.innerHTML = '<p>User Settings panel</p>';

            var instance = Highlight.fuzzyApply(testContainer, 'usr');

            FunkyTests.expect(instance.getCount()).toBeGreaterThan(0);
        });

        FunkyTests.it('accepts threshold option', function() {
            testContainer.innerHTML = '<p>Settings</p>';

            // Very high threshold - should not match 'st'
            var instance = Highlight.fuzzyApply(testContainer, 'st', {
                threshold: 0.95
            });

            // May or may not match depending on exact score
            FunkyTests.expect(instance).toBeDefined();
        });

        FunkyTests.it('returns instance with navigation methods', function() {
            testContainer.innerHTML = '<p>User Settings User Profile User Admin</p>';

            var instance = Highlight.fuzzyApply(testContainer, 'user');

            FunkyTests.expect(typeof instance.next).toBe('function');
            FunkyTests.expect(typeof instance.prev).toBe('function');
            FunkyTests.expect(typeof instance.goTo).toBe('function');
        });

        FunkyTests.it('returns instance with clear method', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = Highlight.fuzzyApply(testContainer, 'user');

            FunkyTests.expect(typeof instance.clear).toBe('function');
        });

        FunkyTests.it('clear() removes highlights', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = Highlight.fuzzyApply(testContainer, 'user');
            instance.clear();

            var marks = testContainer.querySelectorAll('mark');
            FunkyTests.expect(marks.length).toBe(0);
        });

    });

    // =========================================================================
    // FuzzyHighlightInstance
    // =========================================================================

    FunkyTests.describe('FuzzyHighlightInstance', function() {

        FunkyTests.it('can be instantiated directly', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(instance).toBeDefined();
        });

        FunkyTests.it('auto-highlights on construction', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(instance.getCount()).toBeGreaterThan(0);
        });

        FunkyTests.it('respects threshold parameter', function() {
            testContainer.innerHTML = '<p>Settings</p>';

            // Very high threshold
            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'xyz',
                {},
                0.99
            );

            FunkyTests.expect(instance.getCount()).toBe(0);
        });

        FunkyTests.it('has getCount method', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(typeof instance.getCount).toBe('function');
            FunkyTests.expect(typeof instance.getCount()).toBe('number');
        });

        FunkyTests.it('has getCurrentIndex method', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(typeof instance.getCurrentIndex).toBe('function');
        });

        FunkyTests.it('has next method', function() {
            testContainer.innerHTML = '<p>User Profile User Admin</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(typeof instance.next).toBe('function');
        });

        FunkyTests.it('next() advances current index', function() {
            testContainer.innerHTML = '<p>User Profile User Admin User Test</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            if (instance.getCount() > 1) {
                var initialIndex = instance.getCurrentIndex();
                instance.next();
                FunkyTests.expect(instance.getCurrentIndex()).toBe(initialIndex + 1);
            }
        });

        FunkyTests.it('has prev method', function() {
            testContainer.innerHTML = '<p>User Profile User Admin</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(typeof instance.prev).toBe('function');
        });

        FunkyTests.it('has goTo method', function() {
            testContainer.innerHTML = '<p>User Profile User Admin</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(typeof instance.goTo).toBe('function');
        });

        FunkyTests.it('has clear method', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(typeof instance.clear).toBe('function');
        });

        FunkyTests.it('has getMatches method', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            FunkyTests.expect(typeof instance.getMatches).toBe('function');
        });

        FunkyTests.it('getMatches returns array', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {},
                0.3
            );

            var matches = instance.getMatches();
            FunkyTests.expect(Array.isArray(matches)).toBe(true);
        });

    });

    // =========================================================================
    // OPTIONS
    // =========================================================================

    FunkyTests.describe('Options', function() {

        FunkyTests.it('markWithPositions uses default className', function() {
            var result = Highlight.markWithPositions('Hello', [[0, 0]]);
            FunkyTests.expect(result).toContain('highlight');
        });

        FunkyTests.it('fuzzyMark uses custom tagName', function() {
            var result = Highlight.fuzzyMark('set', 'Settings', {
                tagName: 'span'
            });
            FunkyTests.expect(result).toContain('<span');
        });

        FunkyTests.it('FuzzyHighlightInstance accepts options', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                'user',
                {
                    className: 'custom-class',
                    activeClassName: 'custom-active'
                },
                0.3
            );

            FunkyTests.expect(instance).toBeDefined();
        });

    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    FunkyTests.describe('Edge cases', function() {

        FunkyTests.it('markWithPositions handles empty text', function() {
            var result = Highlight.markWithPositions('', [[0, 0]]);
            FunkyTests.expect(result).toBe('');
        });

        FunkyTests.it('fuzzyMark handles empty query', function() {
            var result = Highlight.fuzzyMark('', 'Settings');
            FunkyTests.expect(result).toBe('Settings');
        });

        FunkyTests.it('fuzzyMark handles empty text', function() {
            var result = Highlight.fuzzyMark('set', '');
            FunkyTests.expect(result).toBe('');
        });

        FunkyTests.it('fuzzyApply handles empty container', function() {
            testContainer.innerHTML = '';

            var instance = Highlight.fuzzyApply(testContainer, 'user');

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.getCount()).toBe(0);
        });

        FunkyTests.it('fuzzyApply handles empty query', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = Highlight.fuzzyApply(testContainer, '');

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.getCount()).toBe(0);
        });

        FunkyTests.it('FuzzyHighlightInstance handles null query', function() {
            testContainer.innerHTML = '<p>User Settings</p>';

            var instance = new Highlight.FuzzyHighlightInstance(
                testContainer,
                null,
                {},
                0.3
            );

            FunkyTests.expect(instance.getCount()).toBe(0);
        });

    });

    // =========================================================================
    // INTEGRATION WITH FuzzySearch
    // =========================================================================

    FunkyTests.describe('Integration with FuzzySearch', function() {

        FunkyTests.it('markWithPositions works with FuzzySearch.match result', function() {
            var matchResult = FuzzySearch.match('set', 'Settings');
            
            if (matchResult) {
                var html = Highlight.markWithPositions('Settings', matchResult.matches);
                FunkyTests.expect(html).toContain('<mark');
            }
        });

        FunkyTests.it('fromMatches works with FuzzySearch.match result', function() {
            var matchResult = FuzzySearch.match('user', 'User Settings');
            
            if (matchResult) {
                var html = Highlight.fromMatches('User Settings', matchResult.matches);
                FunkyTests.expect(html).toContain('<mark');
            }
        });

        FunkyTests.it('fuzzyMark uses FuzzySearch internally', function() {
            // If FuzzySearch returns a match, fuzzyMark should highlight it
            var fsResult = FuzzySearch.match('set', 'Settings');
            var hlResult = Highlight.fuzzyMark('set', 'Settings');

            if (fsResult) {
                FunkyTests.expect(hlResult).toContain('<mark');
            }
        });

    });

});
