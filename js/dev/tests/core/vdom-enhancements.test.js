/**
 * Funky.VDom Builder Enhancements Tests
 *
 * Tests for Builder API parity methods: hasClass, classHas, toggle,
 * isEmpty, prepend, empty, val
 */
(function() {
    'use strict';

    var V = Funky.VDom;

    FunkyTests.describe('Funky.VDom Builder Enhancements', function() {

        // =====================================================================
        // hasClass() tests
        // =====================================================================

        FunkyTests.describe('.hasClass()', function() {
            FunkyTests.it('returns true when class exists', function() {
                var builder = V.div().class('card active');
                FunkyTests.assert.isTrue(builder.hasClass('card'));
                FunkyTests.assert.isTrue(builder.hasClass('active'));
            });

            FunkyTests.it('returns false when class does not exist', function() {
                var builder = V.div().class('card');
                FunkyTests.assert.isFalse(builder.hasClass('active'));
            });

            FunkyTests.it('returns false when no classes set', function() {
                var builder = V.div();
                FunkyTests.assert.isFalse(builder.hasClass('anything'));
            });

            FunkyTests.it('returns false for empty string', function() {
                var builder = V.div().class('card');
                FunkyTests.assert.isFalse(builder.hasClass(''));
            });
        });

        // =====================================================================
        // classHas() tests (alias)
        // =====================================================================

        FunkyTests.describe('.classHas()', function() {
            FunkyTests.it('is an alias for hasClass', function() {
                var builder = V.div().class('test');
                FunkyTests.assert.strictEqual(builder.classHas('test'), builder.hasClass('test'));
            });
        });

        // =====================================================================
        // toggle() tests
        // =====================================================================

        FunkyTests.describe('.toggle()', function() {
            FunkyTests.it('adds funky-hidden when toggling without condition', function() {
                var builder = V.div();
                builder.toggle();
                FunkyTests.assert.isTrue(builder.hasClass('funky-hidden'));
            });

            FunkyTests.it('removes funky-hidden when called again', function() {
                var builder = V.div().class('funky-hidden');
                builder.toggle();
                FunkyTests.assert.isFalse(builder.hasClass('funky-hidden'));
            });

            FunkyTests.it('hides when condition is false', function() {
                var builder = V.div();
                builder.toggle(false);
                FunkyTests.assert.isTrue(builder.hasClass('funky-hidden'));
            });

            FunkyTests.it('shows when condition is true', function() {
                var builder = V.div().class('funky-hidden');
                builder.toggle(true);
                FunkyTests.assert.isFalse(builder.hasClass('funky-hidden'));
            });
        });

        // =====================================================================
        // isEmpty() tests
        // =====================================================================

        FunkyTests.describe('.isEmpty()', function() {
            FunkyTests.it('returns true for builder with no children', function() {
                var builder = V.div();
                FunkyTests.assert.isTrue(builder.isEmpty());
            });

            FunkyTests.it('returns false after adding child', function() {
                var builder = V.div().child(V.span());
                FunkyTests.assert.isFalse(builder.isEmpty());
            });

            FunkyTests.it('returns false after adding text', function() {
                var builder = V.div().text('Hello');
                FunkyTests.assert.isFalse(builder.isEmpty());
            });
        });

        // =====================================================================
        // empty() tests
        // =====================================================================

        FunkyTests.describe('.empty()', function() {
            FunkyTests.it('clears all children', function() {
                var builder = V.div()
                    .child(V.span())
                    .child(V.p())
                    .text('Hello');
                builder.empty();
                FunkyTests.assert.isTrue(builder.isEmpty());
            });

            FunkyTests.it('returns builder for chaining', function() {
                var builder = V.div().child(V.span());
                var result = builder.empty();
                FunkyTests.assert.strictEqual(result, builder);
            });
        });

        // =====================================================================
        // prepend() tests
        // =====================================================================

        FunkyTests.describe('.prepend()', function() {
            FunkyTests.it('adds child at the beginning', function() {
                var builder = V.ul()
                    .child(V.li().text('Second'))
                    .prepend(V.li().text('First'));
                var vnode = builder.build();
                FunkyTests.assert.strictEqual(vnode.children[0].children[0].value, 'First');
            });

            FunkyTests.it('handles string content', function() {
                var builder = V.div()
                    .text('End')
                    .prepend('Start');
                var vnode = builder.build();
                FunkyTests.assert.strictEqual(vnode.children[0].value, 'Start');
            });

            FunkyTests.it('returns builder for chaining', function() {
                var builder = V.div();
                var result = builder.prepend(V.span());
                FunkyTests.assert.strictEqual(result, builder);
            });
        });

        // =====================================================================
        // val() tests
        // =====================================================================

        FunkyTests.describe('.val()', function() {
            FunkyTests.it('sets value attribute', function() {
                var builder = V.input().val('test value');
                var vnode = builder.build();
                FunkyTests.assert.strictEqual(vnode.attrs.value, 'test value');
            });

            FunkyTests.it('works with form elements', function() {
                var input = V.input().attr('type', 'text').val('John');
                var vnode = input.build();
                FunkyTests.assert.strictEqual(vnode.attrs.value, 'John');
            });

            FunkyTests.it('returns builder for chaining', function() {
                var builder = V.input();
                var result = builder.val('test');
                FunkyTests.assert.strictEqual(result, builder);
            });
        });

        // =====================================================================
        // Traversal Methods
        // =====================================================================

        FunkyTests.describe('.parent()', function() {
            FunkyTests.it('returns parent builder', function() {
                var parent = V.div().class('parent');
                var child = V.span().class('child');
                parent.child(child);
                FunkyTests.assert.strictEqual(child.parent(), parent);
            });

            FunkyTests.it('returns null for root builder', function() {
                var root = V.div();
                FunkyTests.assert.isNull(root.parent());
            });
        });

        FunkyTests.describe('.closest()', function() {
            FunkyTests.it('finds ancestor by tag', function() {
                var grandparent = V.section().child(
                    V.div().child(
                        V.span().class('target')
                    )
                );
                var target = grandparent.findOne('.target');
                var found = target.closest('section');
                FunkyTests.assert.strictEqual(found._tag, 'section');
            });

            FunkyTests.it('finds ancestor by class', function() {
                var tree = V.div().class('container').child(
                    V.div().class('wrapper').child(
                        V.span().class('target')
                    )
                );
                var target = tree.findOne('.target');
                var found = target.closest('.container');
                FunkyTests.assert.isTrue(found.hasClass('container'));
            });

            FunkyTests.it('returns null when no match', function() {
                var tree = V.div().child(V.span().class('target'));
                var target = tree.findOne('.target');
                FunkyTests.assert.isNull(target.closest('.nonexistent'));
            });
        });

        FunkyTests.describe('.siblings()', function() {
            FunkyTests.it('returns all sibling builders', function() {
                var list = V.ul().child(
                    V.li().class('a'),
                    V.li().class('b'),
                    V.li().class('c')
                );
                var b = list.findOne('.b');
                var siblings = b.siblings();
                FunkyTests.assert.strictEqual(siblings.length, 2);
            });

            FunkyTests.it('filters by selector', function() {
                var list = V.ul().child(
                    V.li().class('item'),
                    V.li().class('target'),
                    V.li().class('item'),
                    V.li().class('other')
                );
                var target = list.findOne('.target');
                var items = target.siblings('.item');
                FunkyTests.assert.strictEqual(items.length, 2);
            });

            FunkyTests.it('excludes self', function() {
                var list = V.ul().child(
                    V.li().class('item'),
                    V.li().class('item target'),
                    V.li().class('item')
                );
                var target = list.findOne('.target');
                var siblings = target.siblings();
                var hasTarget = false;
                for (var i = 0; i < siblings.length; i++) {
                    if (siblings[i].hasClass('target')) hasTarget = true;
                }
                FunkyTests.assert.isFalse(hasTarget);
            });
        });

        FunkyTests.describe('.next()', function() {
            FunkyTests.it('returns next sibling', function() {
                var list = V.ul().child(
                    V.li().class('first'),
                    V.li().class('second'),
                    V.li().class('third')
                );
                var first = list.findOne('.first');
                var next = first.next();
                FunkyTests.assert.isTrue(next.hasClass('second'));
            });

            FunkyTests.it('filters by selector', function() {
                var list = V.ul().child(
                    V.li().class('a'),
                    V.li().class('skip'),
                    V.li().class('b')
                );
                var a = list.findOne('.a');
                var next = a.next('.b');
                FunkyTests.assert.isTrue(next.hasClass('b'));
            });

            FunkyTests.it('returns null when no next', function() {
                var list = V.ul().child(V.li().class('only'));
                var only = list.findOne('.only');
                FunkyTests.assert.isNull(only.next());
            });
        });

        FunkyTests.describe('.prev()', function() {
            FunkyTests.it('returns previous sibling', function() {
                var list = V.ul().child(
                    V.li().class('first'),
                    V.li().class('second'),
                    V.li().class('third')
                );
                var third = list.findOne('.third');
                var prev = third.prev();
                FunkyTests.assert.isTrue(prev.hasClass('second'));
            });

            FunkyTests.it('filters by selector', function() {
                var list = V.ul().child(
                    V.li().class('a'),
                    V.li().class('skip'),
                    V.li().class('b')
                );
                var b = list.findOne('.b');
                var prev = b.prev('.a');
                FunkyTests.assert.isTrue(prev.hasClass('a'));
            });
        });

        FunkyTests.describe('.index()', function() {
            FunkyTests.it('returns correct index', function() {
                var list = V.ul().child(
                    V.li().class('a'),
                    V.li().class('b'),
                    V.li().class('c')
                );
                FunkyTests.assert.strictEqual(list.findOne('.a').index(), 0);
                FunkyTests.assert.strictEqual(list.findOne('.b').index(), 1);
                FunkyTests.assert.strictEqual(list.findOne('.c').index(), 2);
            });

            FunkyTests.it('returns -1 for orphan', function() {
                var orphan = V.div();
                FunkyTests.assert.strictEqual(orphan.index(), -1);
            });
        });

        FunkyTests.describe('.find() / .findOne()', function() {
            FunkyTests.it('finds nested descendants', function() {
                var tree = V.div().child(
                    V.section().child(
                        V.span().class('target')
                    ),
                    V.section().child(
                        V.span().class('target')
                    )
                );
                var all = tree.find('.target');
                FunkyTests.assert.strictEqual(all.length, 2);
            });

            FunkyTests.it('findOne returns first match', function() {
                var tree = V.ul().child(
                    V.li().class('item').id('first'),
                    V.li().class('item').id('second')
                );
                var first = tree.findOne('.item');
                FunkyTests.assert.strictEqual(first._attrs.id, 'first');
            });

            FunkyTests.it('one() is alias for findOne()', function() {
                var tree = V.div().child(V.span().class('test'));
                FunkyTests.assert.strictEqual(tree.one('.test'), tree.findOne('.test'));
            });
        });

        // =====================================================================
        // Manipulation Methods
        // =====================================================================

        FunkyTests.describe('.clone()', function() {
            FunkyTests.it('creates deep clone by default', function() {
                var original = V.div().class('parent').child(
                    V.span().class('child').text('Hello')
                );
                var cloned = original.clone();
                FunkyTests.assert.notStrictEqual(cloned, original);
                FunkyTests.assert.isTrue(cloned.hasClass('parent'));
                FunkyTests.assert.isNotNull(cloned.findOne('.child'));
            });

            FunkyTests.it('creates shallow clone when deep=false', function() {
                var original = V.div().class('parent').child(
                    V.span().class('child')
                );
                var cloned = original.clone(false);
                FunkyTests.assert.isTrue(cloned.hasClass('parent'));
                FunkyTests.assert.isNull(cloned.findOne('.child'));
            });

            FunkyTests.it('cloned builder is independent', function() {
                var original = V.div().class('test');
                var cloned = original.clone();
                cloned.classAdd('cloned');
                FunkyTests.assert.isFalse(original.hasClass('cloned'));
            });
        });

        FunkyTests.describe('.replaceWith()', function() {
            FunkyTests.it('replaces builder in parent', function() {
                var parent = V.ul().child(
                    V.li().class('old')
                );
                var old = parent.findOne('.old');
                var newItem = V.li().class('new');
                old.replaceWith(newItem);
                FunkyTests.assert.isNull(parent.findOne('.old'));
                FunkyTests.assert.isNotNull(parent.findOne('.new'));
            });

            FunkyTests.it('returns the replacement', function() {
                var parent = V.div().child(V.span().class('old'));
                var old = parent.findOne('.old');
                var replacement = V.span().class('new');
                var result = old.replaceWith(replacement);
                FunkyTests.assert.strictEqual(result, replacement);
            });
        });

        FunkyTests.describe('.remove()', function() {
            FunkyTests.it('removes from parent', function() {
                var parent = V.ul().child(
                    V.li().class('keep'),
                    V.li().class('remove'),
                    V.li().class('keep')
                );
                var toRemove = parent.findOne('.remove');
                toRemove.remove();
                FunkyTests.assert.isNull(parent.findOne('.remove'));
                FunkyTests.assert.strictEqual(parent.find('.keep').length, 2);
            });

            FunkyTests.it('returns removed builder', function() {
                var parent = V.div().child(V.span().class('target'));
                var target = parent.findOne('.target');
                var result = target.remove();
                FunkyTests.assert.strictEqual(result, target);
            });
        });

        FunkyTests.describe('.appendTo()', function() {
            FunkyTests.it('appends to new parent', function() {
                var newParent = V.ul();
                var item = V.li().class('item');
                item.appendTo(newParent);
                FunkyTests.assert.isNotNull(newParent.findOne('.item'));
            });

            FunkyTests.it('moves from old parent', function() {
                var oldParent = V.div().child(V.span().class('child'));
                var newParent = V.div();
                var child = oldParent.findOne('.child');
                child.appendTo(newParent);
                FunkyTests.assert.isNull(oldParent.findOne('.child'));
                FunkyTests.assert.isNotNull(newParent.findOne('.child'));
            });
        });

        FunkyTests.describe('.css()', function() {
            FunkyTests.it('gets style value', function() {
                var builder = V.div().style({ color: 'red', fontSize: '14px' });
                FunkyTests.assert.strictEqual(builder.css('color'), 'red');
                FunkyTests.assert.strictEqual(builder.css('fontSize'), '14px');
            });

            FunkyTests.it('returns undefined for missing style', function() {
                var builder = V.div();
                FunkyTests.assert.isUndefined(builder.css('color'));
            });
        });

        FunkyTests.describe('.exists()', function() {
            FunkyTests.it('returns true for valid builder', function() {
                var builder = V.div();
                FunkyTests.assert.isTrue(builder.exists());
            });
        });

        FunkyTests.describe('.raw()', function() {
            FunkyTests.it('returns the builder itself', function() {
                var builder = V.div();
                FunkyTests.assert.strictEqual(builder.raw(), builder);
            });
        });

    });

})();
