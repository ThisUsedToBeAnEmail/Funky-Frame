/**
 * Funky.Dom Tests
 *
 * Tests for DOM manipulation utilities.
 */

describe('Funky.Core.Dom', function() {

    var D = Funky.Dom;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="dom-test-container">' +
                '<div id="single-el" class="test-class" data-value="123">Single</div>' +
                '<ul id="list-container">' +
                    '<li class="item">Item 1</li>' +
                    '<li class="item">Item 2</li>' +
                    '<li class="item">Item 3</li>' +
                '</ul>' +
                '<input type="text" id="text-input" value="initial">' +
                '<button id="test-btn" disabled>Button</button>' +
            '</div>'
        );
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('D.one() - Single element selection', function() {

        it('selects element by ID', function() {
            var el = D.one('#single-el');
            expect(el).toBeDefined();
            expect(el.el.id).toBe('single-el');
        });

        it('selects element by class', function() {
            var el = D.one('.test-class');
            expect(el).toBeDefined();
        });

        it('returns wrapper with null el for non-existent element', function() {
            var el = D.one('#does-not-exist');
            // D.one returns ElementWrapper for chainability even when element not found
            expect(el).toBeDefined();
            expect(el.el).toBeNull();
        });

        it('accepts DOM element directly', function() {
            var domEl = document.getElementById('single-el');
            var wrapped = D.one(domEl);
            expect(wrapped.el).toBe(domEl);
        });

    });

    describe('D.all() - Multiple element selection', function() {

        it('selects multiple elements', function() {
            var els = D.all('.item');
            expect(els.length).toBe(3);
        });

        it('returns empty list for no matches', function() {
            var els = D.all('.non-existent');
            expect(els.length).toBe(0);
        });

        it('has each() method', function() {
            var count = 0;
            D.all('.item').each(function() {
                count++;
            });
            expect(count).toBe(3);
        });

    });

    describe('D.create() - Element creation', function() {

        it('creates element from tag name', function() {
            var el = D.create('div');
            expect(el.el.tagName.toLowerCase()).toBe('div');
        });

        it('creates element from HTML string', function() {
            var el = D.create('<span class="created">Hello</span>');
            expect(el.el.tagName.toLowerCase()).toBe('span');
            expect(el.el.className).toBe('created');
        });

    });

    describe('ElementWrapper - Class manipulation', function() {

        it('classAdd adds a class', function() {
            var el = D.one('#single-el');
            el.classAdd('new-class');
            expect(el.el.classList.contains('new-class')).toBe(true);
        });

        it('classRemove removes a class', function() {
            var el = D.one('#single-el');
            el.classRemove('test-class');
            expect(el.el.classList.contains('test-class')).toBe(false);
        });

        it('classToggle toggles a class', function() {
            var el = D.one('#single-el');

            el.classToggle('toggled');
            expect(el.el.classList.contains('toggled')).toBe(true);

            el.classToggle('toggled');
            expect(el.el.classList.contains('toggled')).toBe(false);
        });

        it('classHas checks for class', function() {
            var el = D.one('#single-el');
            expect(el.classHas('test-class')).toBe(true);
            expect(el.classHas('fake-class')).toBe(false);
        });

    });

    describe('ElementWrapper - Attributes', function() {

        it('attr gets attribute value', function() {
            var el = D.one('#single-el');
            expect(el.attr('data-value')).toBe('123');
        });

        it('attr sets attribute value', function() {
            var el = D.one('#single-el');
            el.attr('data-new', 'value');
            expect(el.el.getAttribute('data-new')).toBe('value');
        });

        it('attrRemove removes attribute', function() {
            var el = D.one('#single-el');
            el.attrRemove('data-value');
            expect(el.el.hasAttribute('data-value')).toBe(false);
        });

        it('data gets data attribute', function() {
            var el = D.one('#single-el');
            expect(el.data('value')).toBe('123');
        });

        it('data sets data attribute', function() {
            var el = D.one('#single-el');
            el.data('new', 'test');
            expect(el.el.getAttribute('data-new')).toBe('test');
        });

    });

    describe('ElementWrapper - Styles', function() {

        it('style sets single style', function() {
            var el = D.one('#single-el');
            el.style('color', 'red');
            expect(el.el.style.color).toBe('red');
        });

        it('style sets multiple styles via object', function() {
            var el = D.one('#single-el');
            el.style({ color: 'blue', fontSize: '14px' });
            expect(el.el.style.color).toBe('blue');
            expect(el.el.style.fontSize).toBe('14px');
        });

    });

    describe('ElementWrapper - Content', function() {

        it('text gets text content', function() {
            var el = D.one('#single-el');
            expect(el.text()).toBe('Single');
        });

        it('text sets text content', function() {
            var el = D.one('#single-el');
            el.text('New Text');
            expect(el.el.textContent).toBe('New Text');
        });

        it('html gets innerHTML', function() {
            var el = D.one('#list-container');
            expect(el.html()).toContain('Item 1');
        });

        it('html sets innerHTML', function() {
            var el = D.one('#single-el');
            el.html('<span>Nested</span>');
            expect(el.el.innerHTML).toBe('<span>Nested</span>');
        });

    });

    describe('ElementWrapper - DOM manipulation', function() {

        it('append adds child element', function() {
            var parent = D.one('#list-container');
            var child = D.create('<li>Item 4</li>');
            parent.append(child);

            expect(D.all('#list-container .item').length).toBe(3);
            expect(parent.el.lastElementChild.textContent).toBe('Item 4');
        });

        it('prepend adds child at beginning', function() {
            var parent = D.one('#list-container');
            var child = D.create('<li>Item 0</li>');
            parent.prepend(child);

            expect(parent.el.firstElementChild.textContent).toBe('Item 0');
        });

        it('remove removes element from DOM', function() {
            var el = D.one('#single-el');
            el.remove();

            expect(document.getElementById('single-el')).toBeNull();
        });

        it('empty clears content', function() {
            var el = D.one('#list-container');
            el.empty();

            expect(el.el.children.length).toBe(0);
        });

    });

    describe('ElementWrapper - Value handling', function() {

        it('val gets input value', function() {
            var el = D.one('#text-input');
            expect(el.val()).toBe('initial');
        });

        it('val sets input value', function() {
            var el = D.one('#text-input');
            el.val('new value');
            expect(el.el.value).toBe('new value');
        });

    });

    describe('ElementWrapper - Visibility', function() {

        it('hide hides element', function() {
            var el = D.one('#single-el');
            el.hide();
            expect(el.el.style.display).toBe('none');
        });

        it('show shows element', function() {
            var el = D.one('#single-el');
            el.hide();
            el.show();
            expect(el.el.style.display).not.toBe('none');
        });

    });

    describe('ElementWrapper - Chaining', function() {

        it('methods are chainable', function() {
            var el = D.one('#single-el');

            var result = el
                .classAdd('class1')
                .classAdd('class2')
                .attr('data-test', 'value')
                .style('color', 'green');

            expect(result).toBe(el);
            expect(el.el.classList.contains('class1')).toBe(true);
            expect(el.el.classList.contains('class2')).toBe(true);
            expect(el.el.getAttribute('data-test')).toBe('value');
            expect(el.el.style.color).toBe('green');
        });

    });

    describe('ElementWrapper - Event handling', function() {

        it('on attaches event listener', function() {
            var clicked = false;
            var btn = D.one('#test-btn');

            btn.on('click', function() {
                clicked = true;
            });

            FunkyTests.simulate.click(btn.el);
            expect(clicked).toBe(true);
        });

        it('off removes event listener', function() {
            var count = 0;
            var btn = D.one('#test-btn');
            var handler = function() { count++; };

            btn.on('click', handler);
            FunkyTests.simulate.click(btn.el);
            expect(count).toBe(1);

            btn.off('click', handler);
            FunkyTests.simulate.click(btn.el);
            expect(count).toBe(1);
        });

    });

    describe('ElementList - Batch operations', function() {

        it('each iterates over elements', function() {
            var texts = [];
            D.all('.item').each(function() {
                texts.push(this.textContent);
            });

            expect(texts).toEqual(['Item 1', 'Item 2', 'Item 3']);
        });

        it('classAdd adds class to all elements', function() {
            D.all('.item').classAdd('highlighted');

            var items = document.querySelectorAll('.item');
            for (var i = 0; i < items.length; i++) {
                expect(items[i].classList.contains('highlighted')).toBe(true);
            }
        });

        it('first returns first element', function() {
            var first = D.all('.item').first();
            expect(first.text()).toBe('Item 1');
        });

        it('last returns last element', function() {
            var last = D.all('.item').last();
            expect(last.text()).toBe('Item 3');
        });

        it('at returns element at index', function() {
            var second = D.all('.item').at(1);
            expect(second.text()).toBe('Item 2');
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('D.one handles null selector gracefully', function() {
            var el = D.one(null);
            // Returns empty wrapper for chainability
            expect(el).toBeDefined();
            expect(el.el).toBeNull();
        });

        it('D.one handles undefined selector gracefully', function() {
            var el = D.one(undefined);
            // Returns empty wrapper for chainability
            expect(el).toBeDefined();
            expect(el.el).toBeNull();
        });

        it('D.one handles empty string selector gracefully', function() {
            var el = D.one('');
            // Returns empty wrapper for chainability
            expect(el).toBeDefined();
            expect(el.el).toBeNull();
        });

        it('D.all handles null selector gracefully', function() {
            var els = D.all(null);
            expect(els.length).toBe(0);
        });

        it('D.all handles undefined selector gracefully', function() {
            var els = D.all(undefined);
            expect(els.length).toBe(0);
        });

        it('D.all handles empty string selector gracefully', function() {
            var els = D.all('');
            expect(els.length).toBe(0);
        });

        it('D.create handles empty string gracefully', function() {
            var el = D.create('');
            expect(el).toBeNull();
        });

        it('D.create handles null gracefully', function() {
            var el = D.create(null);
            expect(el).toBeNull();
        });

        it('classAdd handles null class name gracefully', function() {
            var el = D.one('#single-el');
            // Should not throw
            expect(function() {
                el.classAdd(null);
            }).not.toThrow();
        });

        it('classRemove handles non-existent class gracefully', function() {
            var el = D.one('#single-el');
            // Should not throw
            expect(function() {
                el.classRemove('non-existent-class');
            }).not.toThrow();
        });

        it('attr handles getting non-existent attribute', function() {
            var el = D.one('#single-el');
            expect(el.attr('non-existent')).toBeNull();
        });

        it('data handles getting non-existent data attribute', function() {
            var el = D.one('#single-el');
            expect(el.data('nonexistent')).toBeNull();
        });

    });

    // =========================================================================
    // EDGE CASE TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('D.one with complex selector', function() {
            var el = D.one('#list-container .item:first-child');
            expect(el).not.toBeNull();
            expect(el.text()).toBe('Item 1');
        });

        it('D.all with attribute selector', function() {
            var els = D.all('[data-value]');
            expect(els.length).toBeGreaterThan(0);
        });

        it('text escapes HTML content', function() {
            var el = D.one('#single-el');
            el.text('<script>alert("xss")</script>');
            expect(el.el.innerHTML).not.toContain('<script>');
            expect(el.el.textContent).toContain('<script>');
        });

        it('html allows HTML content', function() {
            var el = D.one('#single-el');
            el.html('<strong>Bold</strong>');
            expect(el.el.querySelector('strong')).not.toBeNull();
        });

        it('classAdd handles multiple classes', function() {
            var el = D.one('#single-el');
            el.classAdd('class-a');
            el.classAdd('class-b');
            el.classAdd('class-c');
            expect(el.classHas('class-a')).toBe(true);
            expect(el.classHas('class-b')).toBe(true);
            expect(el.classHas('class-c')).toBe(true);
        });

        it('classToggle with force parameter', function() {
            var el = D.one('#single-el');
            el.classToggle('forced-class', true);
            expect(el.classHas('forced-class')).toBe(true);
            el.classToggle('forced-class', true);
            expect(el.classHas('forced-class')).toBe(true);
            el.classToggle('forced-class', false);
            expect(el.classHas('forced-class')).toBe(false);
        });

        it('style handles CSS custom properties', function() {
            var el = D.one('#single-el');
            el.style('--custom-color', 'blue');
            expect(el.el.style.getPropertyValue('--custom-color')).toBe('blue');
        });

        it('val handles empty input value', function() {
            var el = D.one('#text-input');
            el.val('');
            expect(el.val()).toBe('');
        });

        it('append handles raw DOM element', function() {
            var parent = D.one('#list-container');
            var rawEl = document.createElement('li');
            rawEl.textContent = 'Raw Item';
            parent.append(rawEl);
            expect(parent.el.lastElementChild.textContent).toBe('Raw Item');
        });

        it('prepend handles raw DOM element', function() {
            var parent = D.one('#list-container');
            var rawEl = document.createElement('li');
            rawEl.textContent = 'First Raw';
            parent.prepend(rawEl);
            expect(parent.el.firstElementChild.textContent).toBe('First Raw');
        });

        it('empty preserves element itself', function() {
            var el = D.one('#list-container');
            var elRef = el.el;
            el.empty();
            expect(document.getElementById('list-container')).toBe(elRef);
        });

        it('remove on already removed element does not throw', function() {
            var el = D.one('#single-el');
            el.remove();
            expect(function() {
                el.remove();
            }).not.toThrow();
        });

        it('each provides correct index', function() {
            var indices = [];
            D.all('.item').each(function(wrapper, index) {
                indices.push(index);
            });
            expect(indices).toEqual([0, 1, 2]);
        });

        it('at with negative index returns null', function() {
            var el = D.all('.item').at(-1);
            expect(el).toBeNull();
        });

        it('at with out of bounds index returns null', function() {
            var el = D.all('.item').at(100);
            expect(el).toBeNull();
        });

        it('first on empty list returns null', function() {
            var first = D.all('.non-existent').first();
            expect(first).toBeNull();
        });

        it('last on empty list returns null', function() {
            var last = D.all('.non-existent').last();
            expect(last).toBeNull();
        });

    });

    // =========================================================================
    // CONTEXT AND SCOPE TESTS
    // =========================================================================
    describe('Context and scope', function() {

        it('D.one with context element', function() {
            var container = document.getElementById('list-container');
            var el = D.one('.item', container);
            expect(el).not.toBeNull();
            expect(el.text()).toBe('Item 1');
        });

        it('D.all with context element', function() {
            var container = document.getElementById('list-container');
            var els = D.all('.item', container);
            expect(els.length).toBe(3);
        });

        it('D.one does not find elements outside context', function() {
            var container = document.getElementById('list-container');
            var el = D.one('#text-input', container);
            // Returns empty wrapper for chainability
            expect(el).toBeDefined();
            expect(el.el).toBeNull();
        });

    });

    // =========================================================================
    // SPECIAL ELEMENT HANDLING TESTS
    // =========================================================================
    describe('Special element handling', function() {

        it('handles disabled attribute correctly', function() {
            var btn = D.one('#test-btn');
            expect(btn.attr('disabled')).not.toBeNull();
        });

        it('can remove disabled attribute', function() {
            var btn = D.one('#test-btn');
            btn.attrRemove('disabled');
            expect(btn.el.disabled).toBe(false);
        });

        it('handles boolean attributes', function() {
            var btn = D.one('#test-btn');
            btn.attr('hidden', '');
            expect(btn.el.hidden).toBe(true);
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    describe('Cleanup', function() {

        it('remove cleans up element from parent', function() {
            var el = D.one('#single-el');
            var parent = el.el.parentNode;
            var childCount = parent.children.length;

            el.remove();

            expect(parent.children.length).toBe(childCount - 1);
        });

        it('empty clears all child elements', function() {
            var el = D.one('#list-container');
            expect(el.el.children.length).toBe(3);

            el.empty();

            expect(el.el.children.length).toBe(0);
            expect(el.el.innerHTML).toBe('');
        });

        it('off removes specific handler without affecting others', function() {
            var count1 = 0;
            var count2 = 0;
            var btn = D.one('#test-btn');

            var handler1 = function() { count1++; };
            var handler2 = function() { count2++; };

            btn.on('click', handler1);
            btn.on('click', handler2);

            FunkyTests.simulate.click(btn.el);
            expect(count1).toBe(1);
            expect(count2).toBe(1);

            btn.off('click', handler1);

            FunkyTests.simulate.click(btn.el);
            expect(count1).toBe(1);
            expect(count2).toBe(2);
        });

    });

});
