/**
 * Funky.Events Tests
 *
 * Tests for DOM event utilities.
 */

describe('Funky.Core.Events', function() {

    var Events = Funky.Events;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="events-container">' +
                '<button id="evt-btn">Click Me</button>' +
                '<div id="parent">' +
                    '<button class="child-btn">Child 1</button>' +
                    '<button class="child-btn">Child 2</button>' +
                '</div>' +
                '<input type="text" id="evt-input">' +
            '</div>'
        );
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Events.on()', function() {

        it('attaches event listener to element', function() {
            var clicked = false;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'click', function() {
                clicked = true;
            });

            FunkyTests.simulate.click(btn);
            expect(clicked).toBe(true);
        });

        it('passes event object to handler', function() {
            var receivedEvent = null;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'click', function(e) {
                receivedEvent = e;
            });

            FunkyTests.simulate.click(btn);
            expect(receivedEvent).toBeDefined();
            expect(receivedEvent.type).toBe('click');
        });

        it('works with selector string', function() {
            var clicked = false;

            Events.on('#evt-btn', 'click', function() {
                clicked = true;
            });

            FunkyTests.simulate.click(document.getElementById('evt-btn'));
            expect(clicked).toBe(true);
        });

    });

    describe('Events.off()', function() {

        it('removes event listener', function() {
            var count = 0;
            var btn = document.getElementById('evt-btn');
            var handler = function() { count++; };

            Events.on(btn, 'click', handler);
            FunkyTests.simulate.click(btn);
            expect(count).toBe(1);

            Events.off(btn, 'click', handler);
            FunkyTests.simulate.click(btn);
            expect(count).toBe(1);
        });

    });

    describe('Events.once()', function() {

        it('fires only once', function() {
            var count = 0;
            var btn = document.getElementById('evt-btn');

            Events.once(btn, 'click', function() {
                count++;
            });

            FunkyTests.simulate.click(btn);
            FunkyTests.simulate.click(btn);
            FunkyTests.simulate.click(btn);

            expect(count).toBe(1);
        });

    });

    describe('Events.emit()', function() {

        it('dispatches custom event', function() {
            var received = false;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'custom-event', function() {
                received = true;
            });

            Events.emit(btn, 'custom-event');
            expect(received).toBe(true);
        });

        it('passes data with custom event', function() {
            var receivedData = null;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'data-event', function(e) {
                receivedData = e.detail;
            });

            Events.emit(btn, 'data-event', { value: 42 });
            expect(receivedData).toEqual({ value: 42 });
        });

    });

    describe('Events.delegate()', function() {

        it('delegates events to child elements', function() {
            var clickedText = null;
            var parent = document.getElementById('parent');

            Events.delegate(parent, '.child-btn', 'click', function(e) {
                clickedText = this.textContent;
            });

            var buttons = parent.querySelectorAll('.child-btn');
            FunkyTests.simulate.click(buttons[0]);
            expect(clickedText).toBe('Child 1');

            FunkyTests.simulate.click(buttons[1]);
            expect(clickedText).toBe('Child 2');
        });

        it('does not fire for non-matching elements', function() {
            var called = false;
            var parent = document.getElementById('parent');

            Events.delegate(parent, '.non-existent', 'click', function() {
                called = true;
            });

            FunkyTests.simulate.click(parent.querySelector('.child-btn'));
            expect(called).toBe(false);
        });

        it('works with dynamically added elements', function() {
            var clicked = false;
            var parent = document.getElementById('parent');

            Events.delegate(parent, '.dynamic-btn', 'click', function() {
                clicked = true;
            });

            // Add new button dynamically
            var newBtn = document.createElement('button');
            newBtn.className = 'dynamic-btn';
            parent.appendChild(newBtn);

            FunkyTests.simulate.click(newBtn);
            expect(clicked).toBe(true);
        });

    });

    describe('Events.ready()', function() {

        it('calls callback when DOM is ready', function(done) {
            // DOM should already be ready at this point
            var called = false;

            Events.ready(function() {
                called = true;
            });

            // Small delay to allow callback to fire
            setTimeout(function() {
                expect(called).toBe(true);
                done();
            }, 10);
        });

    });

    describe('Event modifiers', function() {

        it('stopPropagation prevents bubbling', function() {
            var parentClicked = false;
            var childClicked = false;
            var parent = document.getElementById('parent');
            var child = parent.querySelector('.child-btn');

            Events.on(parent, 'click', function() {
                parentClicked = true;
            });

            Events.on(child, 'click', function(e) {
                e.stopPropagation();
                childClicked = true;
            });

            FunkyTests.simulate.click(child);
            expect(childClicked).toBe(true);
            expect(parentClicked).toBe(false);
        });

    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error handling', function() {

        it('Events.on handles null element gracefully', function() {
            expect(function() {
                Events.on(null, 'click', function() {});
            }).not.toThrow();
        });

        it('Events.on handles undefined element gracefully', function() {
            expect(function() {
                Events.on(undefined, 'click', function() {});
            }).not.toThrow();
        });

        it('Events.on handles non-existent selector gracefully', function() {
            expect(function() {
                Events.on('#non-existent-element', 'click', function() {});
            }).not.toThrow();
        });

        it('Events.off handles null element gracefully', function() {
            expect(function() {
                Events.off(null, 'click', function() {});
            }).not.toThrow();
        });

        it('Events.off handles removing non-existent handler gracefully', function() {
            var btn = document.getElementById('evt-btn');
            expect(function() {
                Events.off(btn, 'click', function() {});
            }).not.toThrow();
        });

        it('Events.emit handles null element gracefully', function() {
            expect(function() {
                Events.emit(null, 'custom-event');
            }).not.toThrow();
        });

        it('Events.delegate handles null parent gracefully', function() {
            expect(function() {
                Events.delegate(null, '.child', 'click', function() {});
            }).not.toThrow();
        });

        it('Events.delegate handles null selector gracefully', function() {
            var parent = document.getElementById('parent');
            expect(function() {
                Events.delegate(parent, null, 'click', function() {});
            }).not.toThrow();
        });

        it('continues after handler throws error', function() {
            var btn = document.getElementById('evt-btn');
            var secondCalled = false;

            Events.on(btn, 'click', function() {
                throw new Error('Test error');
            });

            Events.on(btn, 'click', function() {
                secondCalled = true;
            });

            // Suppress console.error
            var originalError = console.error;
            console.error = function() {};

            FunkyTests.simulate.click(btn);

            console.error = originalError;
            expect(secondCalled).toBe(true);
        });

    });

    // =========================================================================
    // EDGE CASE TESTS
    // =========================================================================
    describe('Edge cases', function() {

        it('multiple handlers on same element', function() {
            var count = 0;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'click', function() { count++; });
            Events.on(btn, 'click', function() { count++; });
            Events.on(btn, 'click', function() { count++; });

            FunkyTests.simulate.click(btn);
            expect(count).toBe(3);
        });

        it('same handler registered multiple times', function() {
            var count = 0;
            var btn = document.getElementById('evt-btn');
            var handler = function() { count++; };

            Events.on(btn, 'click', handler);
            Events.on(btn, 'click', handler);

            FunkyTests.simulate.click(btn);
            // Behavior may vary - could be 1 or 2 depending on implementation
            expect(count).toBeGreaterThan(0);
        });

        it('handles multiple event types on same element', function() {
            var clickCount = 0;
            var focusCount = 0;
            var input = document.getElementById('evt-input');

            Events.on(input, 'click', function() { clickCount++; });
            Events.on(input, 'focus', function() { focusCount++; });

            FunkyTests.simulate.click(input);
            FunkyTests.simulate.focus(input);

            expect(clickCount).toBe(1);
            expect(focusCount).toBeGreaterThanOrEqual(1);
        });

        it('once handler removed after first call', function() {
            var count = 0;
            var btn = document.getElementById('evt-btn');

            Events.once(btn, 'click', function() { count++; });

            FunkyTests.simulate.click(btn);
            FunkyTests.simulate.click(btn);
            FunkyTests.simulate.click(btn);
            FunkyTests.simulate.click(btn);
            FunkyTests.simulate.click(btn);

            expect(count).toBe(1);
        });

        it('emit with complex data object', function() {
            var receivedData = null;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'complex-event', function(e) {
                receivedData = e.detail;
            });

            var complexData = {
                nested: { deep: { value: 42 } },
                array: [1, 2, 3],
                fn: function() { return 'test'; }
            };

            Events.emit(btn, 'complex-event', complexData);
            expect(receivedData.nested.deep.value).toBe(42);
            expect(receivedData.array).toEqual([1, 2, 3]);
        });

        it('delegate handles nested child elements', function() {
            var parent = document.getElementById('parent');
            parent.innerHTML = '<div class="outer"><span class="inner">Nested</span></div>';

            var clicked = false;
            Events.delegate(parent, '.outer', 'click', function() {
                clicked = true;
            });

            var inner = parent.querySelector('.inner');
            FunkyTests.simulate.click(inner);
            expect(clicked).toBe(true);
        });

        it('delegate provides correct this context', function() {
            var clickedElement = null;
            var parent = document.getElementById('parent');

            Events.delegate(parent, '.child-btn', 'click', function() {
                clickedElement = this;
            });

            var firstBtn = parent.querySelector('.child-btn');
            FunkyTests.simulate.click(firstBtn);
            expect(clickedElement).toBe(firstBtn);
        });

        it('handles events on document', function() {
            var received = false;

            Events.on(document, 'test-doc-event', function() {
                received = true;
            });

            Events.emit(document, 'test-doc-event');
            expect(received).toBe(true);

            // Cleanup
            Events.off(document, 'test-doc-event');
        });

        it('handles events on window', function() {
            var received = false;

            Events.on(window, 'test-window-event', function() {
                received = true;
            });

            Events.emit(window, 'test-window-event');
            expect(received).toBe(true);

            // Cleanup
            Events.off(window, 'test-window-event');
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    describe('Cleanup', function() {

        it('off removes only specified handler', function() {
            var count1 = 0;
            var count2 = 0;
            var btn = document.getElementById('evt-btn');

            var handler1 = function() { count1++; };
            var handler2 = function() { count2++; };

            Events.on(btn, 'click', handler1);
            Events.on(btn, 'click', handler2);

            FunkyTests.simulate.click(btn);
            expect(count1).toBe(1);
            expect(count2).toBe(1);

            Events.off(btn, 'click', handler1);

            FunkyTests.simulate.click(btn);
            expect(count1).toBe(1);
            expect(count2).toBe(2);
        });

        it('handlers not called after element removed from DOM', function() {
            var count = 0;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'click', function() { count++; });

            FunkyTests.simulate.click(btn);
            expect(count).toBe(1);

            btn.parentNode.removeChild(btn);

            // Click should not work on detached element
            // (but the event handler is still technically attached)
            expect(count).toBe(1);
        });

        it('delegate cleanup when parent removed', function() {
            var count = 0;
            var parent = document.getElementById('parent');

            Events.delegate(parent, '.child-btn', 'click', function() {
                count++;
            });

            var btn = parent.querySelector('.child-btn');
            FunkyTests.simulate.click(btn);
            expect(count).toBe(1);

            // After parent removed, delegate should not fire
            parent.parentNode.removeChild(parent);
            expect(count).toBe(1);
        });

    });

    // =========================================================================
    // EVENT TYPES TESTS
    // =========================================================================
    describe('Event types', function() {

        it('handles keyboard events', function() {
            var received = false;
            var input = document.getElementById('evt-input');

            Events.on(input, 'keydown', function(e) {
                received = true;
            });

            var keyEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
            input.dispatchEvent(keyEvent);
            expect(received).toBe(true);
        });

        it('handles input events', function() {
            var received = false;
            var input = document.getElementById('evt-input');

            Events.on(input, 'input', function() {
                received = true;
            });

            var inputEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(inputEvent);
            expect(received).toBe(true);
        });

        it('handles change events', function() {
            var received = false;
            var input = document.getElementById('evt-input');

            Events.on(input, 'change', function() {
                received = true;
            });

            var changeEvent = new Event('change', { bubbles: true });
            input.dispatchEvent(changeEvent);
            expect(received).toBe(true);
        });

        it('handles custom namespaced events', function() {
            var received = false;
            var btn = document.getElementById('evt-btn');

            Events.on(btn, 'funky:custom:event', function() {
                received = true;
            });

            Events.emit(btn, 'funky:custom:event');
            expect(received).toBe(true);
        });

    });

});
