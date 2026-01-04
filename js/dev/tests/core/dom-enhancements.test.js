/**
 * Funky.Dom Enhancements Tests
 *
 * Tests for enhancement methods: next, prev, siblings, index,
 * clone, replaceWith, wrapWith, unwrap, isEmpty
 */
(function() {
    'use strict';

    var D = Funky.Dom;

    FunkyTests.describe('Funky.Dom Enhancements', function() {
        var container;

        FunkyTests.beforeEach(function() {
            container = D.create('div').attr('id', 'test-container');
            document.body.appendChild(container.el);
        });

        FunkyTests.afterEach(function() {
            if (container && container.el && container.el.parentNode) {
                container.el.parentNode.removeChild(container.el);
            }
        });

        // =====================================================================
        // next() tests
        // =====================================================================

        FunkyTests.describe('.next()', function() {
            FunkyTests.it('returns next sibling element', function() {
                container.html('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
                var a = D.one('#a');
                var next = a.next();
                FunkyTests.assert.strictEqual(next.attr('id'), 'b');
            });

            FunkyTests.it('returns null when no next sibling', function() {
                container.html('<span id="only">Only</span>');
                var only = D.one('#only');
                FunkyTests.assert.isNull(only.next());
            });

            FunkyTests.it('filters by selector when provided', function() {
                container.html('<div id="a"></div><span id="b"></span><div id="c"></div>');
                var a = D.one('#a');
                var next = a.next('div');
                FunkyTests.assert.strictEqual(next.attr('id'), 'c');
            });

            FunkyTests.it('returns null when no matching sibling found', function() {
                container.html('<span id="a">A</span><span id="b">B</span>');
                var a = D.one('#a');
                FunkyTests.assert.isNull(a.next('.nonexistent'));
            });
        });

        // =====================================================================
        // prev() tests
        // =====================================================================

        FunkyTests.describe('.prev()', function() {
            FunkyTests.it('returns previous sibling element', function() {
                container.html('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
                var c = D.one('#c');
                var prev = c.prev();
                FunkyTests.assert.strictEqual(prev.attr('id'), 'b');
            });

            FunkyTests.it('returns null when no previous sibling', function() {
                container.html('<span id="only">Only</span>');
                var only = D.one('#only');
                FunkyTests.assert.isNull(only.prev());
            });

            FunkyTests.it('filters by selector when provided', function() {
                container.html('<div id="a"></div><span id="b"></span><div id="c"></div>');
                var c = D.one('#c');
                var prev = c.prev('div');
                FunkyTests.assert.strictEqual(prev.attr('id'), 'a');
            });
        });

        // =====================================================================
        // siblings() tests
        // =====================================================================

        FunkyTests.describe('.siblings()', function() {
            FunkyTests.it('returns all sibling elements', function() {
                container.html('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
                var b = D.one('#b');
                var siblings = b.siblings();
                FunkyTests.assert.strictEqual(siblings.length, 2);
            });

            FunkyTests.it('does not include the element itself', function() {
                container.html('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
                var b = D.one('#b');
                var siblings = b.siblings();
                var ids = siblings.map(function(el) { return el.attr('id'); });
                FunkyTests.assert.isTrue(ids.indexOf('a') !== -1);
                FunkyTests.assert.isTrue(ids.indexOf('c') !== -1);
                FunkyTests.assert.isTrue(ids.indexOf('b') === -1);
            });

            FunkyTests.it('filters by selector when provided', function() {
                container.html('<div id="a"></div><span id="b"></span><div id="c"></div><span id="d"></span>');
                var b = D.one('#b');
                var siblings = b.siblings('div');
                FunkyTests.assert.strictEqual(siblings.length, 2);
            });

            FunkyTests.it('returns empty list when no siblings', function() {
                container.html('<span id="only">Only</span>');
                var only = D.one('#only');
                FunkyTests.assert.strictEqual(only.siblings().length, 0);
            });
        });

        // =====================================================================
        // index() tests
        // =====================================================================

        FunkyTests.describe('.index()', function() {
            FunkyTests.it('returns 0 for first child', function() {
                container.html('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
                FunkyTests.assert.strictEqual(D.one('#a').index(), 0);
            });

            FunkyTests.it('returns correct index for middle child', function() {
                container.html('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
                FunkyTests.assert.strictEqual(D.one('#b').index(), 1);
            });

            FunkyTests.it('returns correct index for last child', function() {
                container.html('<span id="a">A</span><span id="b">B</span><span id="c">C</span>');
                FunkyTests.assert.strictEqual(D.one('#c').index(), 2);
            });

            FunkyTests.it('returns -1 for element without parent', function() {
                var orphan = D.create('div');
                FunkyTests.assert.strictEqual(orphan.index(), -1);
            });
        });

        // =====================================================================
        // clone() tests
        // =====================================================================

        FunkyTests.describe('.clone()', function() {
            FunkyTests.it('creates a deep clone by default', function() {
                container.html('<div id="parent"><span>Child</span></div>');
                var original = D.one('#parent');
                var cloned = original.clone();
                FunkyTests.assert.strictEqual(cloned.html(), '<span>Child</span>');
            });

            FunkyTests.it('creates a shallow clone when deep=false', function() {
                container.html('<div id="parent"><span>Child</span></div>');
                var original = D.one('#parent');
                var cloned = original.clone(false);
                FunkyTests.assert.strictEqual(cloned.html(), '');
            });

            FunkyTests.it('cloned element is independent of original', function() {
                container.html('<div id="original" class="test"></div>');
                var original = D.one('#original');
                var cloned = original.clone();
                cloned.classAdd('cloned');
                FunkyTests.assert.isFalse(original.hasClass('cloned'));
            });
        });

        // =====================================================================
        // replaceWith() tests
        // =====================================================================

        FunkyTests.describe('.replaceWith()', function() {
            FunkyTests.it('replaces element with another ElementWrapper', function() {
                container.html('<div id="old">Old</div>');
                var old = D.one('#old');
                var newEl = D.create('span').attr('id', 'new').text('New');
                old.replaceWith(newEl);
                FunkyTests.assert.isNull(D.one('#old'));
                FunkyTests.assert.isNotNull(D.one('#new'));
            });

            FunkyTests.it('replaces element with HTML string', function() {
                container.html('<div id="old">Old</div>');
                var old = D.one('#old');
                old.replaceWith('<span id="new">New</span>');
                FunkyTests.assert.isNull(D.one('#old'));
                FunkyTests.assert.strictEqual(D.one('#new').text(), 'New');
            });

            FunkyTests.it('returns wrapper around new element', function() {
                container.html('<div id="old">Old</div>');
                var old = D.one('#old');
                var result = old.replaceWith('<span id="new">New</span>');
                FunkyTests.assert.strictEqual(result.attr('id'), 'new');
            });
        });

        // =====================================================================
        // wrapWith() tests
        // =====================================================================

        FunkyTests.describe('.wrapWith()', function() {
            FunkyTests.it('wraps element with another element', function() {
                container.html('<span id="inner">Inner</span>');
                var inner = D.one('#inner');
                inner.wrapWith(D.create('div').attr('id', 'wrapper'));
                var wrapper = D.one('#wrapper');
                FunkyTests.assert.isNotNull(wrapper);
                FunkyTests.assert.strictEqual(wrapper.one('#inner').text(), 'Inner');
            });

            FunkyTests.it('wraps element with tag name string', function() {
                container.html('<span id="inner">Inner</span>');
                var inner = D.one('#inner');
                inner.wrapWith('section');
                var parent = inner.parent();
                FunkyTests.assert.strictEqual(parent.el.tagName.toLowerCase(), 'section');
            });

            FunkyTests.it('wraps element with HTML string', function() {
                container.html('<span id="inner">Inner</span>');
                var inner = D.one('#inner');
                inner.wrapWith('<div class="wrapper"></div>');
                var parent = inner.parent();
                FunkyTests.assert.isTrue(parent.hasClass('wrapper'));
            });

            FunkyTests.it('returns original element for chaining', function() {
                container.html('<span id="inner">Inner</span>');
                var inner = D.one('#inner');
                var result = inner.wrapWith('div');
                FunkyTests.assert.strictEqual(result.attr('id'), 'inner');
            });
        });

        // =====================================================================
        // unwrap() tests
        // =====================================================================

        FunkyTests.describe('.unwrap()', function() {
            FunkyTests.it('removes parent wrapper keeping element', function() {
                container.html('<div id="wrapper"><span id="inner">Inner</span></div>');
                var inner = D.one('#inner');
                inner.unwrap();
                FunkyTests.assert.isNull(D.one('#wrapper'));
                FunkyTests.assert.isNotNull(D.one('#inner'));
            });

            FunkyTests.it('preserves element content', function() {
                container.html('<div id="wrapper"><span id="inner">Inner Text</span></div>');
                var inner = D.one('#inner');
                inner.unwrap();
                FunkyTests.assert.strictEqual(D.one('#inner').text(), 'Inner Text');
            });

            FunkyTests.it('returns element for chaining', function() {
                container.html('<div id="wrapper"><span id="inner">Inner</span></div>');
                var inner = D.one('#inner');
                var result = inner.unwrap();
                FunkyTests.assert.strictEqual(result.attr('id'), 'inner');
            });
        });

        // =====================================================================
        // isEmpty() tests
        // =====================================================================

        FunkyTests.describe('.isEmpty()', function() {
            FunkyTests.it('returns true for empty element', function() {
                container.html('<div id="empty"></div>');
                FunkyTests.assert.isTrue(D.one('#empty').isEmpty());
            });

            FunkyTests.it('returns true for element with only whitespace', function() {
                container.html('<div id="whitespace">   </div>');
                FunkyTests.assert.isTrue(D.one('#whitespace').isEmpty());
            });

            FunkyTests.it('returns false for element with text', function() {
                container.html('<div id="text">Hello</div>');
                FunkyTests.assert.isFalse(D.one('#text').isEmpty());
            });

            FunkyTests.it('returns false for element with children', function() {
                container.html('<div id="parent"><span></span></div>');
                FunkyTests.assert.isFalse(D.one('#parent').isEmpty());
            });
        });

    });

})();
