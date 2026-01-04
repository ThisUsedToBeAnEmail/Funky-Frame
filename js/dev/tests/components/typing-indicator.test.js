/**
 * TypingIndicator Component Tests
 */
Funky.Test.describe('Funky.TypingIndicator', function(describe, it, expect, beforeEach, afterEach) {
    'use strict';

    var TypingIndicator = Funky.TypingIndicator;
    var container;
    var indicator;

    beforeEach(function() {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(function() {
        if (indicator) {
            indicator.destroy();
            indicator = null;
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    // =========================================================================
    // CREATION TESTS
    // =========================================================================

    describe('Creation', function() {
        it('should create instance with create()', function() {
            indicator = TypingIndicator.create();
            expect(indicator).toBeDefined();
        });

        it('should create with container element', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            expect(container.querySelector('.typing-indicator')).toBeDefined();
        });

        it('should create with container selector', function() {
            indicator = TypingIndicator.create({
                container: '#test-container'
            });

            expect(container.querySelector('.typing-indicator')).toBeDefined();
        });

        it('should create with custom timeout', function() {
            indicator = TypingIndicator.create({
                timeout: 5000
            });

            expect(indicator.options.timeout).toBe(5000);
        });

        it('should create with custom debounce', function() {
            indicator = TypingIndicator.create({
                debounce: 500
            });

            expect(indicator.options.debounce).toBe(500);
        });

        it('should have default options', function() {
            indicator = TypingIndicator.create();

            expect(indicator.options.timeout).toBe(3000);
            expect(indicator.options.debounce).toBe(300);
            expect(indicator.options.maxTypers).toBe(5);
            expect(indicator.options.showDots).toBe(true);
        });
    });

    // =========================================================================
    // LOCAL TYPING TESTS
    // =========================================================================

    describe('Local Typing', function() {
        beforeEach(function() {
            indicator = TypingIndicator.create({ timeout: 100 });
        });

        it('should start typing', function() {
            indicator.startTyping();
            expect(indicator.isLocalTyping()).toBe(true);
        });

        it('should stop typing', function() {
            indicator.startTyping();
            indicator.stopTyping();
            expect(indicator.isLocalTyping()).toBe(false);
        });

        it('should return this from startTyping for chaining', function() {
            var result = indicator.startTyping();
            expect(result).toBe(indicator);
        });

        it('should return this from stopTyping for chaining', function() {
            indicator.startTyping();
            var result = indicator.stopTyping();
            expect(result).toBe(indicator);
        });

        it('should auto-stop after timeout', function(done) {
            indicator.startTyping();

            setTimeout(function() {
                expect(indicator.isLocalTyping()).toBe(false);
                done();
            }, 150);
        });

        it('should reset timer when startTyping called again', function(done) {
            indicator.startTyping();

            // Call again after 50ms
            setTimeout(function() {
                indicator.startTyping();
            }, 50);

            // Should still be typing after 120ms (original timeout + some)
            setTimeout(function() {
                expect(indicator.isLocalTyping()).toBe(true);
            }, 120);

            // Should stop after reset timeout
            setTimeout(function() {
                expect(indicator.isLocalTyping()).toBe(false);
                done();
            }, 200);
        });

        it('should emit start event', function(done) {
            indicator.on('start', function() {
                done();
            });

            indicator.startTyping();
        });

        it('should emit stop event', function(done) {
            indicator.on('stop', function() {
                done();
            });

            indicator.startTyping();
            indicator.stopTyping();
        });

        it('should not emit start if already typing', function() {
            var startCount = 0;
            indicator.on('start', function() {
                startCount++;
            });

            indicator.startTyping();
            indicator.startTyping();
            indicator.startTyping();

            expect(startCount).toBe(1);
        });

        it('should call onStart callback', function(done) {
            indicator = TypingIndicator.create({
                timeout: 100,
                onStart: function() {
                    done();
                }
            });

            indicator.startTyping();
        });

        it('should call onStop callback', function(done) {
            indicator = TypingIndicator.create({
                timeout: 100,
                onStop: function() {
                    done();
                }
            });

            indicator.startTyping();
            indicator.stopTyping();
        });
    });

    // =========================================================================
    // REMOTE TYPERS TESTS
    // =========================================================================

    describe('Remote Typers', function() {
        beforeEach(function() {
            indicator = TypingIndicator.create();
        });

        it('should add typer', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            expect(indicator.getTyperCount()).toBe(1);
        });

        it('should add multiple typers', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            indicator.addTyper({ id: 'user-2', name: 'Jane' });
            indicator.addTyper({ id: 'user-3', name: 'Bob' });

            expect(indicator.getTyperCount()).toBe(3);
        });

        it('should remove typer', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            indicator.removeTyper('user-1');
            expect(indicator.getTyperCount()).toBe(0);
        });

        it('should not duplicate typers', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            indicator.addTyper({ id: 'user-1', name: 'John' });
            expect(indicator.getTyperCount()).toBe(1);
        });

        it('should update typer if same id added again', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            indicator.addTyper({ id: 'user-1', name: 'Johnny' });

            var typers = indicator.getTypers();
            expect(typers[0].name).toBe('Johnny');
        });

        it('should get typers list', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            indicator.addTyper({ id: 'user-2', name: 'Jane' });

            var typers = indicator.getTypers();
            expect(typers.length).toBe(2);
        });

        it('should return copy of typers not reference', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });

            var typers1 = indicator.getTypers();
            var typers2 = indicator.getTypers();

            expect(typers1).not.toBe(typers2);
        });

        it('should clear all typers', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            indicator.addTyper({ id: 'user-2', name: 'Jane' });
            indicator.clearTypers();

            expect(indicator.getTyperCount()).toBe(0);
        });

        it('should hasTypers return true when typers exist', function() {
            indicator.addTyper({ id: 'user-1', name: 'John' });
            expect(indicator.hasTypers()).toBe(true);
        });

        it('should hasTypers return false when no typers', function() {
            expect(indicator.hasTypers()).toBe(false);
        });

        it('should emit remote:start event', function(done) {
            indicator.on('remote:start', function(data) {
                expect(data.user.id).toBe('user-1');
                done();
            });

            indicator.addTyper({ id: 'user-1', name: 'John' });
        });

        it('should emit remote:stop event', function(done) {
            indicator.addTyper({ id: 'user-1', name: 'John' });

            indicator.on('remote:stop', function(data) {
                expect(data.user.id).toBe('user-1');
                done();
            });

            indicator.removeTyper('user-1');
        });

        it('should emit change event on add', function(done) {
            indicator.on('change', function(data) {
                expect(data.typers.length).toBe(1);
                done();
            });

            indicator.addTyper({ id: 'user-1', name: 'John' });
        });

        it('should emit change event on remove', function(done) {
            indicator.addTyper({ id: 'user-1', name: 'John' });

            indicator.on('change', function(data) {
                expect(data.typers.length).toBe(0);
                done();
            });

            indicator.removeTyper('user-1');
        });

        it('should not add typer without id', function() {
            indicator.addTyper({ name: 'John' });
            expect(indicator.getTyperCount()).toBe(0);
        });

        it('should use "Someone" as default name', function() {
            indicator.addTyper({ id: 'user-1' });
            var typers = indicator.getTypers();
            expect(typers[0].name).toBe('Someone');
        });

        it('should return this from addTyper for chaining', function() {
            var result = indicator.addTyper({ id: 'user-1', name: 'John' });
            expect(result).toBe(indicator);
        });
    });

    // =========================================================================
    // TEXT FORMATTING TESTS
    // =========================================================================

    describe('Text Formatting', function() {
        it('should format single typer', function() {
            var text = TypingIndicator.formatText([{ name: 'John' }]);
            expect(text).toBe('John is typing...');
        });

        it('should format two typers', function() {
            var text = TypingIndicator.formatText([
                { name: 'John' },
                { name: 'Jane' }
            ]);
            expect(text).toBe('John and Jane are typing...');
        });

        it('should format three typers', function() {
            var text = TypingIndicator.formatText([
                { name: 'John' },
                { name: 'Jane' },
                { name: 'Bob' }
            ]);
            expect(text).toBe('John, Jane, and Bob are typing...');
        });

        it('should format four typers', function() {
            var text = TypingIndicator.formatText([
                { name: 'John' },
                { name: 'Jane' },
                { name: 'Bob' },
                { name: 'Alice' }
            ]);
            expect(text).toBe('John, Jane, Bob, and Alice are typing...');
        });

        it('should use count for many typers', function() {
            var users = [];
            for (var i = 0; i < 10; i++) {
                users.push({ name: 'User' + i });
            }

            var text = TypingIndicator.formatText(users, 5);
            expect(text).toBe('10 people are typing...');
        });

        it('should respect maxNames parameter', function() {
            var users = [];
            for (var i = 0; i < 6; i++) {
                users.push({ name: 'User' + i });
            }

            var text = TypingIndicator.formatText(users, 3);
            expect(text).toBe('6 people are typing...');
        });

        it('should return empty string for no typers', function() {
            var text = TypingIndicator.formatText([]);
            expect(text).toBe('');
        });

        it('should return empty string for null', function() {
            var text = TypingIndicator.formatText(null);
            expect(text).toBe('');
        });

        it('should instance getText() work', function() {
            indicator = TypingIndicator.create();
            indicator.addTyper({ id: '1', name: 'John' });

            var text = indicator.getText();
            expect(text).toBe('John is typing...');
        });

        it('should use custom format function', function() {
            indicator = TypingIndicator.create({
                format: function(typers) {
                    return typers.length + ' typing';
                }
            });

            indicator.addTyper({ id: '1', name: 'John' });
            indicator.addTyper({ id: '2', name: 'Jane' });

            var text = indicator.getText();
            expect(text).toBe('2 typing');
        });
    });

    // =========================================================================
    // INPUT BINDING TESTS
    // =========================================================================

    describe('Input Binding', function() {
        var input;

        beforeEach(function() {
            input = document.createElement('input');
            input.type = 'text';
            container.appendChild(input);

            indicator = TypingIndicator.create({ timeout: 100, debounce: 10 });
        });

        it('should bind to input element', function() {
            indicator.bindInput(input);
            expect(indicator.boundInputs.length).toBe(1);
        });

        it('should bind to input by selector', function() {
            input.id = 'test-input';
            indicator.bindInput('#test-input');
            expect(indicator.boundInputs.length).toBe(1);
        });

        it('should unbind from input', function() {
            indicator.bindInput(input);
            indicator.unbindInput(input);
            expect(indicator.boundInputs.length).toBe(0);
        });

        it('should unbind all inputs', function() {
            var input2 = document.createElement('input');
            container.appendChild(input2);

            indicator.bindInput(input);
            indicator.bindInput(input2);
            indicator.unbindAllInputs();

            expect(indicator.boundInputs.length).toBe(0);
        });

        it('should not bind same input twice', function() {
            indicator.bindInput(input);
            indicator.bindInput(input);
            expect(indicator.boundInputs.length).toBe(1);
        });

        it('should start typing on input event', function(done) {
            indicator.bindInput(input);

            indicator.on('start', function() {
                done();
            });

            input.value = 'Hello';
            input.dispatchEvent(new Event('input'));
        });

        it('should stop typing on blur', function(done) {
            indicator.bindInput(input);
            indicator.startTyping();

            indicator.on('stop', function() {
                done();
            });

            input.dispatchEvent(new Event('blur'));
        });

        it('should stop typing on Enter key', function(done) {
            indicator.bindInput(input);
            indicator.startTyping();

            indicator.on('stop', function() {
                done();
            });

            var event = new KeyboardEvent('keydown', { key: 'Enter' });
            input.dispatchEvent(event);
        });

        it('should not stop typing on Shift+Enter', function() {
            indicator.bindInput(input);
            indicator.startTyping();

            var event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
            input.dispatchEvent(event);

            expect(indicator.isLocalTyping()).toBe(true);
        });

        it('should stop typing when input cleared', function(done) {
            indicator.bindInput(input);

            // Start typing
            input.value = 'Hello';
            input.dispatchEvent(new Event('input'));

            setTimeout(function() {
                indicator.on('stop', function() {
                    done();
                });

                // Clear input
                input.value = '';
                input.dispatchEvent(new Event('input'));
            }, 20);
        });

        it('should return this from bindInput for chaining', function() {
            var result = indicator.bindInput(input);
            expect(result).toBe(indicator);
        });

        it('should warn if input not found', function() {
            var warned = false;
            var originalWarn = console.warn;
            console.warn = function() { warned = true; };

            indicator.bindInput('#nonexistent');

            console.warn = originalWarn;
            expect(warned).toBe(true);
        });
    });

    // =========================================================================
    // UI TESTS
    // =========================================================================

    describe('UI Rendering', function() {
        it('should render UI in container', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            expect(container.querySelector('.typing-indicator')).toBeDefined();
        });

        it('should render dots by default', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            expect(container.querySelector('.typing-indicator__dots')).toBeDefined();
        });

        it('should render three dot spans', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            var dots = container.querySelectorAll('.typing-indicator__dots span');
            expect(dots.length).toBe(3);
        });

        it('should not render dots when showDots false', function() {
            indicator = TypingIndicator.create({
                container: container,
                showDots: false
            });

            expect(container.querySelector('.typing-indicator__dots')).toBe(null);
        });

        it('should render text element', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            expect(container.querySelector('.typing-indicator__text')).toBeDefined();
        });

        it('should have aria-live attribute', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            var el = container.querySelector('.typing-indicator');
            expect(el.getAttribute('aria-live')).toBe('polite');
        });

        it('should have aria-hidden on dots', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            var dots = container.querySelector('.typing-indicator__dots');
            expect(dots.getAttribute('aria-hidden')).toBe('true');
        });

        it('should hide when no typers', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            var el = container.querySelector('.typing-indicator');
            expect(el.hasAttribute('hidden')).toBe(true);
        });

        it('should show when typers added', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.addTyper({ id: '1', name: 'John' });

            var el = container.querySelector('.typing-indicator');
            expect(el.hasAttribute('hidden')).toBe(false);
        });

        it('should add active class when shown', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.addTyper({ id: '1', name: 'John' });

            var el = container.querySelector('.typing-indicator');
            expect(el.classList.contains('typing-indicator--active')).toBe(true);
        });

        it('should hide when all typers removed', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.addTyper({ id: '1', name: 'John' });
            indicator.removeTyper('1');

            var el = container.querySelector('.typing-indicator');
            expect(el.hasAttribute('hidden')).toBe(true);
        });

        it('should update text when typers change', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.addTyper({ id: '1', name: 'John' });

            var text = container.querySelector('.typing-indicator__text');
            expect(text.textContent).toBe('John is typing...');
        });

        it('should update text when typer added', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.addTyper({ id: '1', name: 'John' });
            indicator.addTyper({ id: '2', name: 'Jane' });

            var text = container.querySelector('.typing-indicator__text');
            expect(text.textContent).toBe('John and Jane are typing...');
        });

        it('show() should remove hidden attribute', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.show();

            var el = container.querySelector('.typing-indicator');
            expect(el.hasAttribute('hidden')).toBe(false);
        });

        it('hide() should add hidden attribute', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.addTyper({ id: '1', name: 'John' });
            indicator.hide();

            var el = container.querySelector('.typing-indicator');
            expect(el.hasAttribute('hidden')).toBe(true);
        });

        it('toggle() should show when hidden', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.hide();
            indicator.toggle();

            var el = container.querySelector('.typing-indicator');
            expect(el.classList.contains('typing-indicator--active')).toBe(true);
        });

        it('toggle() should hide when visible', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.show();
            indicator.toggle();

            expect(indicator.isVisible()).toBe(false);
        });

        it('toggle() should return instance for chaining', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            var result = indicator.toggle();
            expect(result).toBe(indicator);
        });

        it('isVisible() should return correct state', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.show();
            expect(indicator.isVisible()).toBe(true);

            indicator.hide();
            expect(indicator.isVisible()).toBe(false);
        });

        it('setText() should override text', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.setText('Custom text');

            var text = container.querySelector('.typing-indicator__text');
            expect(text.textContent).toBe('Custom text');
        });

        it('getElement() should return element', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            var el = indicator.getElement();
            expect(el.classList.contains('typing-indicator')).toBe(true);
        });
    });

    // =========================================================================
    // EVENT SYSTEM TESTS
    // =========================================================================

    describe('Event System', function() {
        beforeEach(function() {
            indicator = TypingIndicator.create();
        });

        it('should register event handler with on()', function() {
            var called = false;
            indicator.on('change', function() { called = true; });
            indicator.addTyper({ id: '1', name: 'John' });

            expect(called).toBe(true);
        });

        it('should remove event handler with off()', function() {
            var called = false;
            var handler = function() { called = true; };

            indicator.on('change', handler);
            indicator.off('change', handler);
            indicator.addTyper({ id: '1', name: 'John' });

            expect(called).toBe(false);
        });

        it('should remove all handlers for event with off(event)', function() {
            var count = 0;
            indicator.on('change', function() { count++; });
            indicator.on('change', function() { count++; });

            indicator.off('change');
            indicator.addTyper({ id: '1', name: 'John' });

            expect(count).toBe(0);
        });

        it('should fire once handler only once', function() {
            var count = 0;
            indicator.once('change', function() { count++; });

            indicator.addTyper({ id: '1', name: 'John' });
            indicator.addTyper({ id: '2', name: 'Jane' });

            expect(count).toBe(1);
        });

        it('should return this from on() for chaining', function() {
            var result = indicator.on('change', function() {});
            expect(result).toBe(indicator);
        });

        it('should return this from off() for chaining', function() {
            var result = indicator.off('change');
            expect(result).toBe(indicator);
        });

        it('should return this from once() for chaining', function() {
            var result = indicator.once('change', function() {});
            expect(result).toBe(indicator);
        });

        it('should handle errors in event handlers gracefully', function() {
            var secondCalled = false;

            indicator.on('change', function() {
                throw new Error('Test error');
            });
            indicator.on('change', function() {
                secondCalled = true;
            });

            indicator.addTyper({ id: '1', name: 'John' });

            expect(secondCalled).toBe(true);
        });
    });

    // =========================================================================
    // CURRENT USER TESTS
    // =========================================================================

    describe('Current User', function() {
        it('should set current user', function() {
            indicator = TypingIndicator.create();
            indicator.setCurrentUser({ id: 'me', name: 'Me' });

            expect(indicator.getCurrentUser().id).toBe('me');
        });

        it('should exclude self from typers when excludeSelf true', function() {
            indicator = TypingIndicator.create({ excludeSelf: true });
            indicator.setCurrentUser({ id: 'me', name: 'Me' });

            indicator.addTyper({ id: 'me', name: 'Me' });

            expect(indicator.getTyperCount()).toBe(0);
        });

        it('should include self when excludeSelf false', function() {
            indicator = TypingIndicator.create({ excludeSelf: false });
            indicator.setCurrentUser({ id: 'me', name: 'Me' });

            indicator.addTyper({ id: 'me', name: 'Me' });

            expect(indicator.getTyperCount()).toBe(1);
        });
    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================

    describe('Cleanup', function() {
        it('should remove rendered element on destroy', function() {
            indicator = TypingIndicator.create({
                container: container
            });

            indicator.destroy();

            expect(container.querySelector('.typing-indicator')).toBe(null);
        });

        it('should unbind inputs on destroy', function() {
            var input = document.createElement('input');
            container.appendChild(input);

            indicator = TypingIndicator.create();
            indicator.bindInput(input);
            indicator.destroy();

            expect(indicator.boundInputs.length).toBe(0);
        });

        it('should clear typers on destroy', function() {
            indicator = TypingIndicator.create();
            indicator.addTyper({ id: '1', name: 'John' });
            indicator.destroy();

            expect(indicator.getTyperCount()).toBe(0);
        });

        it('should clear event handlers on destroy', function() {
            indicator = TypingIndicator.create();
            indicator.on('change', function() {});
            indicator.destroy();

            expect(Object.keys(indicator.eventHandlers).length).toBe(0);
        });

        it('should stop typing on destroy', function() {
            indicator = TypingIndicator.create({ timeout: 1000 });
            indicator.startTyping();
            indicator.destroy();

            expect(indicator.isLocalTyping()).toBe(false);
        });

        it('should clear timers on destroy', function() {
            indicator = TypingIndicator.create({ timeout: 1000 });
            indicator.startTyping();
            indicator.destroy();

            expect(indicator.typingTimer).toBe(null);
        });
    });

    // =========================================================================
    // STATIC API TESTS
    // =========================================================================

    describe('Static API', function() {
        it('should have DEFAULTS object', function() {
            expect(TypingIndicator.DEFAULTS).toBeDefined();
            expect(TypingIndicator.DEFAULTS.timeout).toBe(3000);
        });

        it('should have getByChannel method', function() {
            indicator = TypingIndicator.create({ channel: 'test-channel' });
            TypingIndicator._instances.push(indicator);

            var found = TypingIndicator.getByChannel('test-channel');
            expect(found).toBe(indicator);

            // Cleanup
            TypingIndicator._instances = [];
        });

        it('should have destroyAll method', function() {
            var i1 = TypingIndicator.create();
            var i2 = TypingIndicator.create();
            TypingIndicator._instances = [i1, i2];

            TypingIndicator.destroyAll();

            expect(TypingIndicator._instances.length).toBe(0);
        });
    });
});
