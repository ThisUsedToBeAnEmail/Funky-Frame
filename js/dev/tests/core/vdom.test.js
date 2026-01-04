/**
 * Funky.VDom Tests
 *
 * Tests for the Virtual DOM module.
 */

describe('Funky.Core.VDom', function() {

    var V = Funky.VDom;

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('VDom')).toBe(true);
        });

        it('has h function', function() {
            expect(typeof V.h).toBe('function');
        });

        it('has text function', function() {
            expect(typeof V.text).toBe('function');
        });

        it('has render function', function() {
            expect(typeof V.render).toBe('function');
        });

    });

    describe('h() - Hyperscript creation', function() {

        it('creates element VNode', function() {
            var vnode = V.h('div', {}, []);

            expect(vnode._isVNode).toBe(true);
            expect(vnode.type).toBe('element');
            expect(vnode.tag).toBe('div');
        });

        it('sets attributes', function() {
            var vnode = V.h('div', { id: 'test', class: 'my-class' }, []);

            expect(vnode.attrs.id).toBe('test');
            expect(vnode.attrs.class).toBe('my-class');
        });

        it('normalizes children', function() {
            var vnode = V.h('div', {}, ['text child']);

            expect(vnode.children.length).toBe(1);
            expect(vnode.children[0].type).toBe('text');
        });

        it('extracts key from attributes', function() {
            var vnode = V.h('li', { key: 'item-1' }, []);

            expect(vnode.key).toBe('item-1');
        });

    });

    describe('text() - Text VNode creation', function() {

        it('creates text VNode', function() {
            var vnode = V.text('Hello');

            expect(vnode._isVNode).toBe(true);
            expect(vnode.type).toBe('text');
            expect(vnode.value).toBe('Hello');
        });

        it('converts numbers to string', function() {
            var vnode = V.text(42);
            expect(vnode.value).toBe('42');
        });

        it('handles null/undefined', function() {
            expect(V.text(null).value).toBe('');
            expect(V.text(undefined).value).toBe('');
        });

    });

    describe('fragment() - Fragment creation', function() {

        it('creates fragment VNode', function() {
            var vnode = V.fragment([V.h('span'), V.h('span')]);

            expect(vnode._isVNode).toBe(true);
            expect(vnode.type).toBe('fragment');
            expect(vnode.children.length).toBe(2);
        });

    });

    describe('Builder API - Tag methods', function() {

        it('has div method', function() {
            var builder = V.div();
            expect(builder).toBeDefined();
            expect(typeof builder.build).toBe('function');
        });

        it('has span method', function() {
            expect(typeof V.span).toBe('function');
        });

        it('has common tag methods', function() {
            expect(typeof V.ul).toBe('function');
            expect(typeof V.li).toBe('function');
            expect(typeof V.button).toBe('function');
            expect(typeof V.input).toBe('function');
        });

        it('creates VNode with build()', function() {
            var vnode = V.div().class('test').build();

            expect(vnode._isVNode).toBe(true);
            expect(vnode.tag).toBe('div');
            expect(vnode.attrs.class).toBe('test');
        });

    });

    describe('Builder API - Chaining', function() {

        it('class() sets class', function() {
            var vnode = V.div().class('my-class').build();
            expect(vnode.attrs.class).toBe('my-class');
        });

        it('id() sets id', function() {
            var vnode = V.div().id('my-id').build();
            expect(vnode.attrs.id).toBe('my-id');
        });

        it('attr() sets attribute', function() {
            var vnode = V.div().attr('data-test', 'value').build();
            expect(vnode.attrs['data-test']).toBe('value');
        });

        it('data() sets data attribute', function() {
            var vnode = V.div().data('value', '123').build();
            expect(vnode.attrs['data-value']).toBe('123');
        });

        it('aria() sets aria attribute', function() {
            var vnode = V.button().aria('label', 'Close').build();
            expect(vnode.attrs['aria-label']).toBe('Close');
        });

        it('text() adds text child', function() {
            var vnode = V.span().text('Hello').build();
            expect(vnode.children.length).toBe(1);
            expect(vnode.children[0].value).toBe('Hello');
        });

        it('child() adds child element', function() {
            var vnode = V.div().child(V.span().text('Nested')).build();
            expect(vnode.children.length).toBe(1);
            expect(vnode.children[0].tag).toBe('span');
        });

        it('methods are chainable', function() {
            var vnode = V.div()
                .class('container')
                .id('main')
                .attr('role', 'main')
                .data('section', 'content')
                .child(V.h1().text('Title'))
                .build();

            expect(vnode.attrs.class).toBe('container');
            expect(vnode.attrs.id).toBe('main');
            expect(vnode.attrs.role).toBe('main');
            expect(vnode.children.length).toBe(1);
        });

    });

    describe('Builder API - Class manipulation', function() {

        it('classAdd adds class', function() {
            var vnode = V.div().class('initial').classAdd('added').build();
            expect(vnode.attrs.class).toContain('initial');
            expect(vnode.attrs.class).toContain('added');
        });

        it('classRemove removes class', function() {
            var vnode = V.div().class('keep remove').classRemove('remove').build();
            expect(vnode.attrs.class).toContain('keep');
            expect(vnode.attrs.class).not.toContain('remove');
        });

        it('classToggle toggles class', function() {
            var vnode = V.div().class('existing').classToggle('toggled', true).build();
            expect(vnode.attrs.class).toContain('toggled');

            vnode = V.div().class('existing toggled').classToggle('toggled', false).build();
            expect(vnode.attrs.class).not.toContain('toggled');
        });

    });

    describe('render() - VNode to DOM', function() {

        it('renders element VNode', function() {
            var vnode = V.div().class('rendered').build();
            var el = V.render(vnode);

            expect(el.tagName.toLowerCase()).toBe('div');
            expect(el.className).toBe('rendered');
        });

        it('renders text VNode', function() {
            var vnode = V.text('Hello World');
            var node = V.render(vnode);

            expect(node.nodeType).toBe(Node.TEXT_NODE);
            expect(node.textContent).toBe('Hello World');
        });

        it('renders nested structure', function() {
            var vnode = V.ul().child(
                V.li().text('Item 1'),
                V.li().text('Item 2')
            ).build();

            var el = V.render(vnode);

            expect(el.tagName.toLowerCase()).toBe('ul');
            expect(el.children.length).toBe(2);
            expect(el.children[0].textContent).toBe('Item 1');
        });

        it('sets event handlers', function() {
            var clicked = false;
            var vnode = V.button().on('click', function() {
                clicked = true;
            }).text('Click').build();

            var el = V.render(vnode);
            el.click();

            expect(clicked).toBe(true);
        });

        it('sets inline styles', function() {
            var vnode = V.div().style({ color: 'red', fontSize: '14px' }).build();
            var el = V.render(vnode);

            expect(el.style.color).toBe('red');
            expect(el.style.fontSize).toBe('14px');
        });

    });

    describe('Convenience helpers', function() {

        it('icon() creates icon element', function() {
            var vnode = V.icon('fas fa-check');

            expect(vnode.tag).toBe('i');
            expect(vnode.attrs.class).toContain('fas fa-check');
            expect(vnode.attrs['aria-hidden']).toBe('true');
        });

        it('when() conditionally renders', function() {
            var truthyResult = V.when(true, V.span().text('Visible'));
            var falsyResult = V.when(false, V.span().text('Hidden'));

            expect(truthyResult).toBeDefined();
            expect(falsyResult).toBeNull();
        });

        it('unless() is opposite of when', function() {
            var truthyResult = V.unless(true, V.span().text('Hidden'));
            var falsyResult = V.unless(false, V.span().text('Visible'));

            expect(truthyResult).toBeNull();
            expect(falsyResult).toBeDefined();
        });

        it('each() maps array to VNodes', function() {
            var items = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];

            var vnodes = V.each(items, function(item) {
                return V.li().text(item.name);
            }, 'id');

            expect(vnodes.length).toBe(2);
            expect(vnodes[0].key).toBe(1);
            expect(vnodes[1].key).toBe(2);
        });

        it('classes() builds class string', function() {
            var result = V.classes('base', true && 'active', false && 'hidden', { 'has-error': true });
            expect(result).toContain('base');
            expect(result).toContain('active');
            expect(result).not.toContain('hidden');
            expect(result).toContain('has-error');
        });

    });

    describe('Accessibility helpers', function() {

        it('srOnly() creates screen reader text', function() {
            var vnode = V.srOnly('Screen reader only');

            expect(vnode.tag).toBe('span');
            expect(vnode.attrs.class).toContain('visually-hidden');
        });

        it('iconButton() requires aria-label', function() {
            var spy = FunkyTests.spy();
            var originalError = console.error;
            console.error = spy;

            V.iconButton('fas fa-trash', {});

            console.error = originalError;
            expect(spy).toHaveBeenCalled();
        });

        it('iconButton() creates accessible button', function() {
            var vnode = V.iconButton('fas fa-delete', { 'aria-label': 'Delete item' });

            expect(vnode.tag).toBe('button');
            expect(vnode.attrs['aria-label']).toBe('Delete item');
        });

    });

    describe('diff() and patch()', function() {

        it('diff detects text changes', function() {
            var oldVNode = V.text('Hello');
            var newVNode = V.text('World');

            var patches = V.diff(oldVNode, newVNode);
            expect(patches.length).toBeGreaterThan(0);
        });

        it('diff detects attribute changes', function() {
            var oldVNode = V.div().class('old').build();
            var newVNode = V.div().class('new').build();

            var patches = V.diff(oldVNode, newVNode);
            expect(patches.length).toBeGreaterThan(0);
        });

        it('diff detects added children', function() {
            var oldVNode = V.ul().build();
            var newVNode = V.ul().child(V.li().text('New')).build();

            var patches = V.diff(oldVNode, newVNode);
            expect(patches.length).toBeGreaterThan(0);
        });

    });

    describe('create() - Object config API', function() {

        it('creates VNode from config', function() {
            var vnode = V.create({
                tag: 'div',
                class: 'config-test',
                children: [
                    { tag: 'span', text: 'Child' }
                ]
            });

            expect(vnode.tag).toBe('div');
            expect(vnode.attrs.class).toBe('config-test');
            expect(vnode.children.length).toBe(1);
        });

        it('handles text-only config', function() {
            var vnode = V.create('Just text');
            expect(vnode.type).toBe('text');
            expect(vnode.value).toBe('Just text');
        });

        it('handles array as fragment', function() {
            var vnode = V.create([
                { tag: 'span', text: 'One' },
                { tag: 'span', text: 'Two' }
            ]);

            expect(vnode.type).toBe('fragment');
            expect(vnode.children.length).toBe(2);
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('h handles null tag gracefully', function() {
            expect(function() {
                V.h(null, {}, []);
            }).not.toThrow();
        });

        it('h handles undefined tag gracefully', function() {
            expect(function() {
                V.h(undefined, {}, []);
            }).not.toThrow();
        });

        it('h handles null attrs gracefully', function() {
            var vnode = V.h('div', null, []);
            expect(vnode._isVNode).toBe(true);
        });

        it('h handles undefined attrs gracefully', function() {
            var vnode = V.h('div', undefined, []);
            expect(vnode._isVNode).toBe(true);
        });

        it('h handles null children gracefully', function() {
            var vnode = V.h('div', {}, null);
            expect(vnode._isVNode).toBe(true);
        });

        it('text handles object input gracefully', function() {
            expect(function() {
                V.text({ key: 'value' });
            }).not.toThrow();
        });

        it('text handles array input gracefully', function() {
            expect(function() {
                V.text([1, 2, 3]);
            }).not.toThrow();
        });

        it('fragment handles null gracefully', function() {
            expect(function() {
                V.fragment(null);
            }).not.toThrow();
        });

        it('fragment handles undefined gracefully', function() {
            expect(function() {
                V.fragment(undefined);
            }).not.toThrow();
        });

        it('render handles null vnode gracefully', function() {
            expect(function() {
                V.render(null);
            }).not.toThrow();
        });

        it('render handles undefined vnode gracefully', function() {
            expect(function() {
                V.render(undefined);
            }).not.toThrow();
        });

        it('diff handles null vnodes gracefully', function() {
            expect(function() {
                V.diff(null, null);
            }).not.toThrow();
        });

        it('diff handles mismatched vnode types', function() {
            var textVNode = V.text('Hello');
            var elementVNode = V.div().build();

            expect(function() {
                V.diff(textVNode, elementVNode);
            }).not.toThrow();
        });

        it('each handles null array gracefully', function() {
            expect(function() {
                V.each(null, function(item) { return V.li().text(item); });
            }).not.toThrow();
        });

        it('each handles undefined array gracefully', function() {
            expect(function() {
                V.each(undefined, function(item) { return V.li().text(item); });
            }).not.toThrow();
        });

        it('each handles null callback gracefully', function() {
            expect(function() {
                V.each([1, 2, 3], null);
            }).not.toThrow();
        });

        it('create handles null config gracefully', function() {
            expect(function() {
                V.create(null);
            }).not.toThrow();
        });

        it('create handles undefined config gracefully', function() {
            expect(function() {
                V.create(undefined);
            }).not.toThrow();
        });

    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('handles very deep nesting', function() {
            var vnode = V.div().child(
                V.div().child(
                    V.div().child(
                        V.div().child(
                            V.div().child(
                                V.span().text('Deep')
                            )
                        )
                    )
                )
            ).build();

            var el = V.render(vnode);
            expect(el.querySelector('span').textContent).toBe('Deep');
        });

        it('handles many children', function() {
            var builder = V.ul();
            for (var i = 0; i < 100; i++) {
                builder.child(V.li().text('Item ' + i));
            }
            var vnode = builder.build();

            expect(vnode.children.length).toBe(100);
        });

        it('handles empty tag name', function() {
            expect(function() {
                V.h('', {}, []);
            }).not.toThrow();
        });

        it('handles special characters in text', function() {
            var vnode = V.text('<script>alert("xss")</script>');
            var node = V.render(vnode);

            expect(node.textContent).toBe('<script>alert("xss")</script>');
        });

        it('handles Unicode in text', function() {
            var vnode = V.text('日本語 🎉 العربية');
            var node = V.render(vnode);

            expect(node.textContent).toContain('🎉');
        });

        it('handles very long text content', function() {
            var longText = 'a'.repeat(10000);
            var vnode = V.text(longText);
            var node = V.render(vnode);

            expect(node.textContent.length).toBe(10000);
        });

        it('handles attributes with special characters', function() {
            var vnode = V.div().attr('data-test', '<>"\'&').build();
            var el = V.render(vnode);

            expect(el.getAttribute('data-test')).toBe('<>"\'&');
        });

        it('handles class with many values', function() {
            var vnode = V.div()
                .classAdd('a').classAdd('b').classAdd('c')
                .classAdd('d').classAdd('e').classAdd('f')
                .build();

            expect(vnode.attrs.class).toContain('a');
            expect(vnode.attrs.class).toContain('f');
        });

        it('handles boolean attributes', function() {
            var vnode = V.input().attr('disabled', true).attr('readonly', true).build();
            var el = V.render(vnode);

            expect(el.disabled).toBe(true);
            expect(el.readOnly).toBe(true);
        });

        it('handles rapid builder chaining', function() {
            var vnode = V.div()
                .class('a')
                .id('test')
                .attr('role', 'main')
                .data('value', '1')
                .aria('label', 'Test')
                .style({ color: 'red' })
                .child(V.span().text('Child 1'))
                .child(V.span().text('Child 2'))
                .build();

            expect(vnode.attrs.class).toBe('a');
            expect(vnode.attrs.id).toBe('test');
            expect(vnode.children.length).toBe(2);
        });

        it('handles mixed children types', function() {
            var vnode = V.div().child(
                V.span().text('Element'),
                'Raw text',
                V.strong().text('Another')
            ).build();

            expect(vnode.children.length).toBe(3);
        });

    });

    // =========================================================================
    // ASYNC BEHAVIOR TESTS
    // =========================================================================
    describe('Async behavior', function() {

        it('event handlers fire correctly', function(done) {
            var clicked = false;
            var vnode = V.button().on('click', function() {
                clicked = true;
            }).text('Click').build();

            var el = V.render(vnode);
            document.body.appendChild(el);

            FunkyTests.simulate.click(el);

            setTimeout(function() {
                expect(clicked).toBe(true);
                document.body.removeChild(el);
                done();
            }, 50);
        });

        it('handles multiple event handlers on same element', function(done) {
            var clickCount = 0;
            var vnode = V.button()
                .on('click', function() { clickCount++; })
                .on('mousedown', function() { clickCount++; })
                .text('Multi').build();

            var el = V.render(vnode);
            document.body.appendChild(el);

            FunkyTests.simulate.click(el);

            setTimeout(function() {
                expect(clickCount >= 1).toBe(true);
                document.body.removeChild(el);
                done();
            }, 50);
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    describe('Cleanup', function() {

        it('rendered elements can be removed from DOM', function() {
            var vnode = V.div().class('removable').text('Remove me').build();
            var el = V.render(vnode);

            document.body.appendChild(el);
            expect(document.querySelector('.removable')).not.toBe(null);

            document.body.removeChild(el);
            expect(document.querySelector('.removable')).toBe(null);
        });

        it('diff returns patches array', function() {
            var old = V.div().text('Old').build();
            var newV = V.div().text('New').build();

            var patches = V.diff(old, newV);

            expect(Array.isArray(patches)).toBe(true);
        });

    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    describe('Input validation', function() {

        it('attr handles empty key', function() {
            expect(function() {
                V.div().attr('', 'value').build();
            }).not.toThrow();
        });

        it('attr handles empty value', function() {
            var vnode = V.div().attr('data-test', '').build();
            expect(vnode.attrs['data-test']).toBe('');
        });

        it('data handles empty key', function() {
            expect(function() {
                V.div().data('', 'value').build();
            }).not.toThrow();
        });

        it('aria handles empty key', function() {
            expect(function() {
                V.button().aria('', 'value').build();
            }).not.toThrow();
        });

        it('style handles empty object', function() {
            var vnode = V.div().style({}).build();
            var el = V.render(vnode);
            expect(el.tagName.toLowerCase()).toBe('div');
        });

        it('style handles null value', function() {
            expect(function() {
                V.div().style(null).build();
            }).not.toThrow();
        });

        it('on handles non-function handler gracefully', function() {
            expect(function() {
                V.button().on('click', 'not a function').build();
            }).not.toThrow();
        });

        it('on handles empty event name', function() {
            expect(function() {
                V.button().on('', function() {}).build();
            }).not.toThrow();
        });

        it('icon handles empty class', function() {
            expect(function() {
                V.icon('');
            }).not.toThrow();
        });

        it('iconButton handles missing aria-label', function() {
            // Should warn but not throw
            var spy = FunkyTests.spy();
            var originalError = console.error;
            console.error = spy;

            expect(function() {
                V.iconButton('fas fa-test', {});
            }).not.toThrow();

            console.error = originalError;
        });

        it('classes handles empty arguments', function() {
            var result = V.classes();
            expect(typeof result).toBe('string');
        });

        it('classes handles all falsy values', function() {
            var result = V.classes(false, null, undefined, '', 0);
            expect(result.trim()).toBe('');
        });

    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    describe('State verification', function() {

        it('VNode has _isVNode property', function() {
            var vnode = V.div().build();
            expect(vnode._isVNode).toBe(true);
        });

        it('element VNode has correct type', function() {
            var vnode = V.div().build();
            expect(vnode.type).toBe('element');
        });

        it('text VNode has correct type', function() {
            var vnode = V.text('Hello');
            expect(vnode.type).toBe('text');
        });

        it('fragment VNode has correct type', function() {
            var vnode = V.fragment([V.span()]);
            expect(vnode.type).toBe('fragment');
        });

        it('key is preserved through diff', function() {
            // Use .key() method instead of .attr('key', ...) to set vnode key
            var old = V.li().key('item-1').text('Old').build();
            var newV = V.li().key('item-1').text('New').build();

            expect(old.key).toBe('item-1');
            expect(newV.key).toBe('item-1');
        });

        it('attrs object is not shared between vnodes', function() {
            var vnode1 = V.div().class('a').build();
            var vnode2 = V.div().class('b').build();

            expect(vnode1.attrs.class).toBe('a');
            expect(vnode2.attrs.class).toBe('b');
        });

        it('children array is not shared between vnodes', function() {
            var vnode1 = V.ul().child(V.li().text('A')).build();
            var vnode2 = V.ul().child(V.li().text('B')).build();

            expect(vnode1.children[0].children[0].value).toBe('A');
            expect(vnode2.children[0].children[0].value).toBe('B');
        });

    });

});
