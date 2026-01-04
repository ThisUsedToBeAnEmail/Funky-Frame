/**
 * Performance Tests: Events
 *
 * Tests event binding, dispatch, and delegation performance.
 */

describe('Funky.Perf.Events', function() {

    var Perf = FunkyTests.Perf;
    var fixture;

    // Skip all tests if Perf utilities not available
    if (!Perf) {
        it('Perf utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="events-perf-container"></div>');
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Event Binding', function() {

        it('binds 1000 click handlers in < 50ms', function() {
            var container = document.getElementById('events-perf-container');
            var buttons = [];

            for (var i = 0; i < 1000; i++) {
                var btn = document.createElement('button');
                container.appendChild(btn);
                buttons.push(btn);
            }

            Perf.assertFasterThan(function() {
                buttons.forEach(function(btn) {
                    btn.addEventListener('click', function() {});
                });
            }, 50);
        });

        it('binds multiple event types on single element in < 5ms', function() {
            var container = document.getElementById('events-perf-container');
            var element = document.createElement('div');
            container.appendChild(element);

            var eventTypes = [
                'click', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave',
                'keydown', 'keyup', 'keypress', 'focus', 'blur', 'input', 'change',
                'touchstart', 'touchend', 'touchmove', 'wheel', 'scroll'
            ];

            Perf.assertFasterThan(function() {
                eventTypes.forEach(function(type) {
                    element.addEventListener(type, function() {});
                });
            }, 5);
        });

        it('event delegation setup is fast', function() {
            var container = document.getElementById('events-perf-container');

            // Add many children
            for (var i = 0; i < 1000; i++) {
                var btn = document.createElement('button');
                btn.className = 'delegated-btn';
                container.appendChild(btn);
            }

            // Single delegated handler
            var result = Perf.benchmark('delegation setup', function() {
                container.addEventListener('click', function(e) {
                    if (e.target.classList.contains('delegated-btn')) {
                        // Handle click
                    }
                });
            }, { iterations: 100 });

            expect(result.median).toBeLessThan(1);
        });

    });

    describe('Event Dispatch', function() {

        it('dispatches 1000 click events in < 100ms', function() {
            var count = 0;
            var container = document.getElementById('events-perf-container');
            var btn = document.createElement('button');
            container.appendChild(btn);

            btn.addEventListener('click', function() { count++; });

            Perf.assertFasterThan(function() {
                for (var i = 0; i < 1000; i++) {
                    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                }
            }, 100);

            expect(count).toBe(1000);
        });

        it('dispatches custom events efficiently', function() {
            var received = 0;
            var container = document.getElementById('events-perf-container');

            container.addEventListener('custom:event', function(e) {
                received++;
            });

            Perf.assertFasterThan(function() {
                for (var i = 0; i < 1000; i++) {
                    container.dispatchEvent(new CustomEvent('custom:event', {
                        bubbles: true,
                        detail: { index: i }
                    }));
                }
            }, 100);

            expect(received).toBe(1000);
        });

        it('event bubbling through deep tree is efficient', function() {
            var container = document.getElementById('events-perf-container');

            // Create deep nesting
            var current = container;
            for (var i = 0; i < 20; i++) {
                var child = document.createElement('div');
                current.appendChild(child);
                current = child;
            }

            var leaf = current;
            var bubbled = 0;

            container.addEventListener('click', function() { bubbled++; });

            Perf.assertFasterThan(function() {
                for (var j = 0; j < 100; j++) {
                    leaf.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                }
            }, 50);

            expect(bubbled).toBe(100);
        });

    });

    describe('Handler Execution', function() {

        it('executes 1000 handlers on single event in < 50ms', function() {
            var container = document.getElementById('events-perf-container');
            var element = document.createElement('div');
            container.appendChild(element);

            var count = 0;

            // Attach 1000 handlers
            for (var i = 0; i < 1000; i++) {
                element.addEventListener('custom', function() { count++; });
            }

            Perf.assertFasterThan(function() {
                element.dispatchEvent(new CustomEvent('custom'));
            }, 50);

            expect(count).toBe(1000);
        });

        it('multiple handlers with different priorities', function() {
            var container = document.getElementById('events-perf-container');
            var element = document.createElement('div');
            container.appendChild(element);

            var order = [];

            // Attach handlers with capture and bubble phase
            for (var i = 0; i < 50; i++) {
                element.addEventListener('test', function() { order.push('bubble'); });
                element.addEventListener('test', function() { order.push('capture'); }, true);
            }

            Perf.assertFasterThan(function() {
                element.dispatchEvent(new CustomEvent('test'));
            }, 10);

            expect(order.length).toBe(100);
        });

    });

    describe('Event Removal', function() {

        it('removes 1000 handlers in < 50ms', function() {
            var container = document.getElementById('events-perf-container');
            var handlers = [];

            for (var i = 0; i < 1000; i++) {
                var btn = document.createElement('button');
                container.appendChild(btn);
                var handler = function() {};
                btn.addEventListener('click', handler);
                handlers.push({ el: btn, handler: handler });
            }

            Perf.assertFasterThan(function() {
                handlers.forEach(function(h) {
                    h.el.removeEventListener('click', h.handler);
                });
            }, 50);
        });

        it('AbortController for batch removal is efficient', function() {
            var container = document.getElementById('events-perf-container');
            var element = document.createElement('div');
            container.appendChild(element);

            var controllers = [];

            // Add handlers with AbortController
            for (var i = 0; i < 100; i++) {
                var controller = new AbortController();
                element.addEventListener('click', function() {}, { signal: controller.signal });
                controllers.push(controller);
            }

            Perf.assertFasterThan(function() {
                controllers.forEach(function(c) {
                    c.abort();
                });
            }, 10);
        });

    });

    describe('Delegation Performance', function() {

        beforeEach(function() {
            var container = document.getElementById('events-perf-container');
            for (var i = 0; i < 1000; i++) {
                var btn = document.createElement('button');
                btn.className = 'delegated item-' + (i % 10);
                btn.setAttribute('data-index', i);
                container.appendChild(btn);
            }
        });

        it('delegated click on first child is fast', function() {
            var container = document.getElementById('events-perf-container');
            var clicked = 0;

            container.addEventListener('click', function(e) {
                if (e.target.classList.contains('delegated')) {
                    clicked++;
                }
            });

            var firstBtn = container.querySelector('.delegated');

            var result = Perf.benchmark('delegated click first', function() {
                firstBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, { iterations: 100 });

            expect(result.median).toBeLessThan(1);
        });

        it('delegated click on last child is still fast', function() {
            var container = document.getElementById('events-perf-container');
            var clicked = 0;

            container.addEventListener('click', function(e) {
                if (e.target.classList.contains('delegated')) {
                    clicked++;
                }
            });

            var buttons = container.querySelectorAll('.delegated');
            var lastBtn = buttons[buttons.length - 1];

            var result = Perf.benchmark('delegated click last', function() {
                lastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, { iterations: 100 });

            expect(result.median).toBeLessThan(1);
        });

        it('complex delegation selector is reasonable', function() {
            var container = document.getElementById('events-perf-container');
            var matched = 0;

            container.addEventListener('click', function(e) {
                if (e.target.matches('.delegated.item-5[data-index]')) {
                    matched++;
                }
            });

            var btn = container.querySelector('.item-5');

            var result = Perf.benchmark('complex delegation', function() {
                btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, { iterations: 100 });

            expect(result.median).toBeLessThan(1);
        });

    });

    describe('PubSub Performance', function() {

        var PubSub;

        beforeEach(function() {
            PubSub = Funky.PubSub;
        });

        afterEach(function() {
            PubSub.clear();
        });

        it('subscribes 1000 handlers in < 20ms', function() {
            Perf.assertFasterThan(function() {
                for (var i = 0; i < 1000; i++) {
                    PubSub.on('test:event' + i, function() {});
                }
            }, 20);
        });

        it('emits to 1000 subscribers in < 50ms', function() {
            var count = 0;

            for (var i = 0; i < 1000; i++) {
                PubSub.on('mass:event', function() { count++; });
            }

            Perf.assertFasterThan(function() {
                PubSub.emit('mass:event', { data: 'test' });
            }, 50);

            expect(count).toBe(1000);
        });

        it('namespaced events are efficient', function() {
            var count = 0;

            // Subscribe to different namespaces
            for (var i = 0; i < 100; i++) {
                PubSub.on('namespace' + i + ':event', function() { count++; });
            }

            Perf.assertFasterThan(function() {
                for (var j = 0; j < 100; j++) {
                    PubSub.emit('namespace' + j + ':event', {});
                }
            }, 20);

            expect(count).toBe(100);
        });

    });

    describe('Keyboard Event Performance', function() {

        it('processes keyboard events efficiently', function() {
            var container = document.getElementById('events-perf-container');
            var input = document.createElement('input');
            container.appendChild(input);

            var keyCount = 0;

            input.addEventListener('keydown', function(e) { keyCount++; });
            input.addEventListener('keyup', function(e) { keyCount++; });
            input.addEventListener('keypress', function(e) { keyCount++; });

            Perf.assertFasterThan(function() {
                for (var i = 0; i < 100; i++) {
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
                    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'a' }));
                    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
                }
            }, 50);

            expect(keyCount).toBe(300);
        });

    });

});
