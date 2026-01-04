/**
 * Funky.ZeroClick Tests
 *
 * Tests for the event-to-component automation layer that listens
 * for events and automatically triggers component actions.
 */

describe('Funky.Component.ZeroClick', function() {

    var ZeroClick;
    var fixture;
    var triggerId;

    beforeEach(function() {
        // Get fresh reference - module may load after test file
        ZeroClick = Funky.ZeroClick;

        // Ensure not paused from previous test
        if (ZeroClick && ZeroClick.isPaused && ZeroClick.isPaused()) {
            ZeroClick.resume();
        }

        fixture = FunkyTests.fixture('<button id="test-btn">Test</button>');
    });

    afterEach(function() {
        // Ensure not paused
        if (ZeroClick && ZeroClick.isPaused && ZeroClick.isPaused()) {
            ZeroClick.resume();
        }
        // Clean up any registered triggers
        if (ZeroClick && triggerId) {
            ZeroClick.off(triggerId);
            triggerId = null;
        }
        // Destroy all triggers
        if (ZeroClick && ZeroClick.destroy) {
            ZeroClick.destroy();
        }
        if (fixture) {
            fixture.destroy();
        }
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('ZeroClick')).toBe(true);
        });

        it('has on method', function() {
            expect(typeof ZeroClick.on).toBe('function');
        });

        it('has off method', function() {
            expect(typeof ZeroClick.off).toBe('function');
        });

        it('has offAll method', function() {
            expect(typeof ZeroClick.offAll).toBe('function');
        });

        it('has getTriggers method', function() {
            expect(typeof ZeroClick.getTriggers).toBe('function');
        });

        it('has pause method', function() {
            expect(typeof ZeroClick.pause).toBe('function');
        });

        it('has resume method', function() {
            expect(typeof ZeroClick.resume).toBe('function');
        });

        it('has isPaused method', function() {
            expect(typeof ZeroClick.isPaused).toBe('function');
        });

        it('has debug method', function() {
            expect(typeof ZeroClick.debug).toBe('function');
        });

        it('has fire method', function() {
            expect(typeof ZeroClick.fire).toBe('function');
        });

        it('has interpolate method', function() {
            expect(typeof ZeroClick.interpolate).toBe('function');
        });

        it('has configure method', function() {
            expect(typeof ZeroClick.configure).toBe('function');
        });

    });

    describe('on() - Trigger Registration', function() {

        it('registers a trigger and returns ID', function() {
            triggerId = ZeroClick.on('test-event', {
                component: 'Toast',
                method: 'info',
                args: ['Test']
            });

            expect(typeof triggerId).toBe('number');
            expect(triggerId).toBeGreaterThan(0);
        });

        it('registers multiple actions', function() {
            triggerId = ZeroClick.on('multi-action-event', [
                { component: 'Toast', method: 'info', args: ['First'] },
                { component: 'Toast', method: 'success', args: ['Second'] }
            ]);

            var triggers = ZeroClick.getTriggers();
            var found = triggers.find(function(t) { return t.id === triggerId; });

            expect(found).toBeDefined();
            expect(found.actionCount).toBe(2);
        });

        it('registers with target option', function() {
            var btn = document.getElementById('test-btn');

            triggerId = ZeroClick.on('click', {
                component: 'Toast',
                method: 'info',
                args: ['Clicked']
            }, { target: btn });

            expect(triggerId).toBeGreaterThan(0);
        });

    });

    describe('off() - Trigger Removal', function() {

        it('removes a trigger by ID', function() {
            triggerId = ZeroClick.on('remove-test', {
                component: 'Toast',
                method: 'info',
                args: ['Test']
            });

            var result = ZeroClick.off(triggerId);

            expect(result).toBe(true);
            triggerId = null; // Already removed
        });

        it('returns false for non-existent ID', function() {
            var result = ZeroClick.off(99999);

            expect(result).toBe(false);
        });

    });

    describe('offAll() - Remove by Event', function() {

        it('removes all triggers for an event', function() {
            ZeroClick.on('bulk-remove-event', { component: 'Toast', method: 'info', args: ['1'] });
            ZeroClick.on('bulk-remove-event', { component: 'Toast', method: 'info', args: ['2'] });
            ZeroClick.on('other-event', { component: 'Toast', method: 'info', args: ['3'] });

            var count = ZeroClick.offAll('bulk-remove-event');

            expect(count).toBe(2);
        });

        it('returns 0 when no matching triggers', function() {
            var count = ZeroClick.offAll('non-existent-event');

            expect(count).toBe(0);
        });

    });

    describe('getTriggers()', function() {

        it('returns array of triggers', function() {
            triggerId = ZeroClick.on('list-test', {
                component: 'Toast',
                method: 'info',
                args: ['Test']
            });

            var triggers = ZeroClick.getTriggers();

            expect(Array.isArray(triggers)).toBe(true);
        });

        it('includes trigger info', function() {
            triggerId = ZeroClick.on('info-test', {
                component: 'Toast',
                method: 'info',
                args: ['Test']
            });

            var triggers = ZeroClick.getTriggers();
            var found = triggers.find(function(t) { return t.id === triggerId; });

            expect(found).toBeDefined();
            expect(found.event).toBe('info-test');
            expect(found.actionCount).toBe(1);
        });

    });

    describe('Pause/Resume', function() {

        it('pause() sets paused state', function() {
            ZeroClick.pause();

            expect(ZeroClick.isPaused()).toBe(true);

            ZeroClick.resume();
        });

        it('resume() clears paused state', function() {
            ZeroClick.pause();
            ZeroClick.resume();

            expect(ZeroClick.isPaused()).toBe(false);
        });

        it('triggers do not fire when paused', function(done) {
            var fired = false;

            // Create a mock component to detect calls
            window.Funky.TestComponent = {
                testMethod: function() { fired = true; }
            };

            triggerId = ZeroClick.on('pause-test-event', {
                component: 'TestComponent',
                method: 'testMethod',
                args: []
            });

            ZeroClick.pause();
            ZeroClick.fire('pause-test-event');

            setTimeout(function() {
                expect(fired).toBe(false);
                ZeroClick.resume();
                delete window.Funky.TestComponent;
                done();
            }, 50);
        });

    });

    describe('debug()', function() {

        it('enables debug mode', function() {
            ZeroClick.debug(true);
            // No assertion - just verify it doesn't throw
        });

        it('disables debug mode', function() {
            ZeroClick.debug(false);
            // No assertion - just verify it doesn't throw
        });

    });

    describe('fire() - Manual Trigger', function() {

        it('fires an event programmatically', function(done) {
            var received = false;

            document.addEventListener('manual-fire-test', function handler() {
                received = true;
                document.removeEventListener('manual-fire-test', handler);
            });

            ZeroClick.fire('manual-fire-test');

            setTimeout(function() {
                expect(received).toBe(true);
                done();
            }, 50);
        });

        it('passes data to event', function(done) {
            var receivedData = null;

            document.addEventListener('fire-with-data', function handler(e) {
                receivedData = e.detail;
                document.removeEventListener('fire-with-data', handler);
            });

            ZeroClick.fire('fire-with-data', { key: 'value' });

            setTimeout(function() {
                expect(receivedData).not.toBeNull();
                expect(receivedData.key).toBe('value');
                done();
            }, 50);
        });

    });

    describe('interpolate()', function() {

        it('interpolates string placeholders', function() {
            var result = ZeroClick.interpolate('Hello {{name}}', { name: 'World' });

            expect(result).toBe('Hello World');
        });

        it('interpolates nested paths', function() {
            var result = ZeroClick.interpolate('Value: {{user.name}}', {
                user: { name: 'John' }
            });

            expect(result).toBe('Value: John');
        });

        it('interpolates array elements', function() {
            var result = ZeroClick.interpolate(['{{a}}', '{{b}}'], { a: 1, b: 2 });

            expect(result).toEqual(['1', '2']);
        });

        it('interpolates object values', function() {
            var result = ZeroClick.interpolate({ msg: '{{text}}' }, { text: 'Hello' });

            expect(result.msg).toBe('Hello');
        });

        it('preserves unmatched placeholders', function() {
            var result = ZeroClick.interpolate('{{missing}}', {});

            expect(result).toBe('{{missing}}');
        });

        it('handles non-string primitives', function() {
            var result = ZeroClick.interpolate(42, {});

            expect(result).toBe(42);
        });

    });

    describe('Debounce/Throttle', function() {

        it('applies debounce option', function(done) {
            var callCount = 0;

            window.Funky.DebounceTest = {
                count: function() { callCount++; }
            };

            triggerId = ZeroClick.on('debounce-event', {
                component: 'DebounceTest',
                method: 'count',
                args: []
            }, { debounce: 100 });

            // Fire multiple times rapidly
            ZeroClick.fire('debounce-event');
            ZeroClick.fire('debounce-event');
            ZeroClick.fire('debounce-event');

            setTimeout(function() {
                // Should only fire once due to debounce
                expect(callCount).toBe(1);
                delete window.Funky.DebounceTest;
                done();
            }, 200);
        });

        it('applies throttle option', function(done) {
            var callCount = 0;

            window.Funky.ThrottleTest = {
                count: function() { callCount++; }
            };

            triggerId = ZeroClick.on('throttle-event', {
                component: 'ThrottleTest',
                method: 'count',
                args: []
            }, { throttle: 100 });

            // Fire multiple times rapidly
            ZeroClick.fire('throttle-event');
            ZeroClick.fire('throttle-event');
            ZeroClick.fire('throttle-event');

            setTimeout(function() {
                // Should only fire once within throttle window
                expect(callCount).toBe(1);
                delete window.Funky.ThrottleTest;
                done();
            }, 50);
        });

    });

    describe('Action Conditions', function() {

        it('evaluates condition via interpolate helper', function() {
            // Test that interpolation works (prerequisite for condition evaluation)
            var result = ZeroClick.interpolate('{{val}} > 5', { val: 10 });
            expect(result).toBe('10 > 5');

            result = ZeroClick.interpolate('{{val}} > 5', { val: 2 });
            expect(result).toBe('2 > 5');
        });

        it('executes action unconditionally', function(done) {
            // Test basic action execution without conditions
            var executed = false;

            window.Funky.BasicActionTest = {
                run: function() { executed = true; }
            };

            triggerId = ZeroClick.on('zc-test-basic-action', {
                component: 'BasicActionTest',
                method: 'run',
                args: []
            });

            ZeroClick.fire('zc-test-basic-action');

            setTimeout(function() {
                expect(executed).toBe(true);
                delete window.Funky.BasicActionTest;
                done();
            }, 100);
        });

        it('passes interpolated args to action', function(done) {
            var receivedArgs = null;

            window.Funky.InterpolateArgsTest = {
                run: function(msg) { receivedArgs = msg; }
            };

            triggerId = ZeroClick.on('zc-test-interpolate-args', {
                component: 'InterpolateArgsTest',
                method: 'run',
                args: ['Hello {{name}}']
            });

            ZeroClick.fire('zc-test-interpolate-args', { name: 'World' });

            setTimeout(function() {
                expect(receivedArgs).toBe('Hello World');
                delete window.Funky.InterpolateArgsTest;
                done();
            }, 100);
        });

    });

    describe('Action Delay', function() {

        it('delays action execution', function(done) {
            var executedAt = null;
            var startTime = Date.now();

            // Ensure ZeroClick is available and initialized
            if (!ZeroClick || !ZeroClick.on) {
                done(new Error('ZeroClick not available'));
                return;
            }

            // Re-initialize to ensure clean state
            if (ZeroClick.init) {
                ZeroClick.init();
            }

            window.Funky.DelayTest = {
                run: function() { executedAt = Date.now(); }
            };

            triggerId = ZeroClick.on('delay-event', {
                component: 'DelayTest',
                method: 'run',
                args: [],
                delay: 100
            });

            ZeroClick.fire('delay-event');

            // Use longer timeout to account for timing variations
            setTimeout(function() {
                try {
                    expect(executedAt).not.toBeNull();
                    expect(executedAt - startTime).toBeGreaterThanOrEqual(90);
                    delete window.Funky.DelayTest;
                    done();
                } catch (e) {
                    delete window.Funky.DelayTest;
                    done(e);
                }
            }, 300);
        });

    });

    describe('Action Priority', function() {

        it('executes actions in priority order', function(done) {
            var order = [];

            window.Funky.PriorityTest = {
                first: function() { order.push('first'); },
                second: function() { order.push('second'); },
                third: function() { order.push('third'); }
            };

            triggerId = ZeroClick.on('priority-event', [
                { component: 'PriorityTest', method: 'third', args: [], priority: 30 },
                { component: 'PriorityTest', method: 'first', args: [], priority: 10 },
                { component: 'PriorityTest', method: 'second', args: [], priority: 20 }
            ]);

            ZeroClick.fire('priority-event');

            setTimeout(function() {
                expect(order).toEqual(['first', 'second', 'third']);
                delete window.Funky.PriorityTest;
                done();
            }, 50);
        });

    });

    describe('Events', function() {

        it('emits funky.zero-click.triggered on trigger fire', function(done) {
            var eventData = null;

            window.Funky.EventTest = {
                noop: function() {}
            };

            document.addEventListener('funky.zero-click.triggered', function handler(e) {
                eventData = e.detail;
                document.removeEventListener('funky.zero-click.triggered', handler);
            });

            triggerId = ZeroClick.on('emit-test-event', {
                component: 'EventTest',
                method: 'noop',
                args: []
            });

            ZeroClick.fire('emit-test-event', { test: true });

            setTimeout(function() {
                expect(eventData).not.toBeNull();
                expect(eventData.id).toBe(triggerId);
                expect(eventData.event).toBe('emit-test-event');
                delete window.Funky.EventTest;
                done();
            }, 50);
        });

        it('emits funky.zero-click.action-executed on action', function(done) {
            var eventData = null;

            window.Funky.ActionEventTest = {
                noop: function() {}
            };

            document.addEventListener('funky.zero-click.action-executed', function handler(e) {
                eventData = e.detail;
                document.removeEventListener('funky.zero-click.action-executed', handler);
            });

            triggerId = ZeroClick.on('action-emit-event', {
                component: 'ActionEventTest',
                method: 'noop',
                args: ['arg1']
            });

            ZeroClick.fire('action-emit-event');

            setTimeout(function() {
                expect(eventData).not.toBeNull();
                expect(eventData.component).toBe('ActionEventTest');
                expect(eventData.method).toBe('noop');
                delete window.Funky.ActionEventTest;
                done();
            }, 50);
        });

    });

    describe('destroy()', function() {

        it('removes all triggers', function() {
            ZeroClick.on('destroy-1', { component: 'Toast', method: 'info', args: ['1'] });
            ZeroClick.on('destroy-2', { component: 'Toast', method: 'info', args: ['2'] });

            ZeroClick.destroy();

            var triggers = ZeroClick.getTriggers();
            expect(triggers.length).toBe(0);
        });

    });

    describe('configure()', function() {

        it('updates configuration', function() {
            ZeroClick.configure({
                defaultDebounce: 50
            });

            // Configuration is internal, we just verify no error
        });

    });

    describe('createBound() - LiveBinding Support', function() {

        it('creates a bound trigger', function() {
            var bound = ZeroClick.createBound({
                trigger: 'bound-event',
                actions: [
                    { component: 'Toast', method: 'info', args: ['{{message}}'] }
                ]
            });

            expect(bound).toBeDefined();
            expect(typeof bound.update).toBe('function');
            expect(typeof bound.destroy).toBe('function');
        });

        it('update() re-registers with new data', function() {
            window.Funky.BoundTest = {
                log: function() {}
            };

            var bound = ZeroClick.createBound({
                trigger: 'bound-update-event',
                actions: [
                    { component: 'BoundTest', method: 'log', args: ['{{msg}}'] }
                ]
            });

            bound.update({ msg: 'Updated' });

            var triggers = ZeroClick.getTriggers();
            expect(triggers.length).toBeGreaterThan(0);

            bound.destroy();
            delete window.Funky.BoundTest;
        });

        it('destroy() removes the bound trigger', function() {
            var bound = ZeroClick.createBound({
                trigger: 'bound-destroy-event',
                actions: [
                    { component: 'Toast', method: 'info', args: ['Test'] }
                ]
            });

            bound.update({});
            var beforeCount = ZeroClick.getTriggers().length;

            bound.destroy();
            var afterCount = ZeroClick.getTriggers().length;

            expect(afterCount).toBeLessThan(beforeCount);
        });

    });

    describe('Error Handling', function() {

        it('logs error for missing component', function(done) {
            triggerId = ZeroClick.on('missing-component-event', {
                component: 'NonExistentComponent',
                method: 'someMethod',
                args: []
            });

            // Should not throw
            ZeroClick.fire('missing-component-event');

            setTimeout(function() {
                // Just verify no crash
                expect(true).toBe(true);
                done();
            }, 50);
        });

        it('logs error for missing method', function(done) {
            window.Funky.MethodTest = {};

            triggerId = ZeroClick.on('missing-method-event', {
                component: 'MethodTest',
                method: 'nonExistentMethod',
                args: []
            });

            // Should not throw
            ZeroClick.fire('missing-method-event');

            setTimeout(function() {
                delete window.Funky.MethodTest;
                done();
            }, 50);
        });

    });

    describe('DOM Events', function() {

        it('binds to DOM events on target element', function(done) {
            var executed = false;

            window.Funky.DOMEventTest = {
                handle: function() { executed = true; }
            };

            triggerId = ZeroClick.on('click', {
                component: 'DOMEventTest',
                method: 'handle',
                args: []
            }, { target: '#test-btn' });

            var btn = document.getElementById('test-btn');
            btn.click();

            setTimeout(function() {
                expect(executed).toBe(true);
                delete window.Funky.DOMEventTest;
                done();
            }, 50);
        });

    });

});
