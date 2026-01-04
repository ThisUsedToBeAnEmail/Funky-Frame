/**
 * Integration Test: PubSub + Events + Components
 *
 * Tests cross-component communication via the event bus.
 */

describe('Funky.Integration.PubSub.Events', function() {

    var PubSub = Funky.PubSub;

    afterEach(function() {
        PubSub.clear();
    });

    describe('Component-to-Component Communication', function() {

        it('PubSub event triggers Toast notification', function() {
            var toastShown = false;

            // Subscribe to event
            PubSub.on('user:created', function(data) {
                Funky.Toast.success('User ' + data.name + ' created');
                toastShown = true;
            });

            // Simulate component emitting event
            PubSub.emit('user:created', { id: 1, name: 'John' });

            return FunkyTests.delay(100).then(function() {
                expect(toastShown).toBe(true);

                var toast = document.querySelector('.funky-toast-success');
                expect(toast).toBeInDocument();
            });
        });

        it('multiple subscribers receive same event', function() {
            var received = [];

            PubSub.on('data:updated', function(data) {
                received.push('handler1:' + data.id);
            });

            PubSub.on('data:updated', function(data) {
                received.push('handler2:' + data.id);
            });

            PubSub.on('data:updated', function(data) {
                received.push('handler3:' + data.id);
            });

            PubSub.emit('data:updated', { id: 42 });

            expect(received.length).toBe(3);
            expect(received).toContain('handler1:42');
            expect(received).toContain('handler2:42');
            expect(received).toContain('handler3:42');
        });

        it('events propagate data unchanged', function() {
            var originalData = { nested: { value: 'test' }, array: [1, 2, 3] };
            var receivedData = null;

            PubSub.on('complex:data', function(data) {
                receivedData = data;
            });

            PubSub.emit('complex:data', originalData);

            expect(receivedData).toEqual(originalData);
            expect(receivedData.nested.value).toBe('test');
            expect(receivedData.array).toEqual([1, 2, 3]);
        });

    });

    describe('Event Chains', function() {

        it('event can trigger another event', function() {
            var eventChain = [];

            PubSub.on('step1', function() {
                eventChain.push('step1');
                PubSub.emit('step2');
            });

            PubSub.on('step2', function() {
                eventChain.push('step2');
                PubSub.emit('step3');
            });

            PubSub.on('step3', function() {
                eventChain.push('step3');
            });

            PubSub.emit('step1');

            expect(eventChain).toEqual(['step1', 'step2', 'step3']);
        });

        it('once() does not repeat in chains', function() {
            var counts = { first: 0, second: 0 };

            PubSub.once('trigger', function() {
                counts.first++;
            });

            PubSub.on('trigger', function() {
                counts.second++;
            });

            PubSub.emit('trigger');
            PubSub.emit('trigger');

            expect(counts.first).toBe(1);
            expect(counts.second).toBe(2);
        });

    });

    describe('DOM Events + PubSub', function() {

        var fixture;

        beforeEach(function() {
            fixture = FunkyTests.fixture(
                '<div id="pubsub-test">' +
                    '<button id="action-btn">Action</button>' +
                    '<div id="status"></div>' +
                '</div>'
            );
        });

        afterEach(function() {
            fixture.destroy();
        });

        it('DOM event triggers PubSub event', function() {
            var pubsubReceived = false;

            // Setup DOM listener that emits to PubSub
            var btn = document.getElementById('action-btn');
            btn.addEventListener('click', function() {
                PubSub.emit('button:clicked', { buttonId: 'action-btn' });
            });

            // Setup PubSub listener
            PubSub.on('button:clicked', function(data) {
                pubsubReceived = true;
                expect(data.buttonId).toBe('action-btn');
            });

            // Trigger
            FunkyTests.simulate.click(btn);

            expect(pubsubReceived).toBe(true);
        });

        it('PubSub event updates DOM', function() {
            var statusEl = document.getElementById('status');

            PubSub.on('status:changed', function(data) {
                statusEl.textContent = data.message;
                statusEl.className = 'status-' + data.type;
            });

            PubSub.emit('status:changed', { message: 'Loading...', type: 'pending' });

            expect(statusEl.textContent).toBe('Loading...');
            expect(statusEl.classList.contains('status-pending')).toBe(true);
        });

    });

    describe('Keyboard + PubSub', function() {

        it('keyboard shortcut triggers PubSub event', function() {
            var eventReceived = false;
            var unregister;

            // Register keyboard shortcut that emits PubSub
            unregister = Funky.Keyboard.register({
                key: 's',
                ctrl: true,
                handler: function() {
                    PubSub.emit('save:requested');
                }
            });

            PubSub.on('save:requested', function() {
                eventReceived = true;
            });

            // Simulate keyboard
            FunkyTests.simulate.keydown(document.body, {
                key: 's',
                ctrlKey: true
            });

            expect(eventReceived).toBe(true);

            // Cleanup
            if (unregister) unregister();
        });

    });

    describe('Error Handling in Event Chains', function() {

        it('error in one handler does not block others', function() {
            var handlersCalled = [];

            // Suppress console.error for this test
            var originalError = console.error;
            console.error = function() {};

            PubSub.on('test:event', function() {
                handlersCalled.push(1);
                throw new Error('Handler 1 error');
            });

            PubSub.on('test:event', function() {
                handlersCalled.push(2);
            });

            PubSub.on('test:event', function() {
                handlersCalled.push(3);
            });

            PubSub.emit('test:event');

            console.error = originalError;

            expect(handlersCalled).toContain(1);
            expect(handlersCalled).toContain(2);
            expect(handlersCalled).toContain(3);
        });

    });

    describe('Namespaced Events', function() {

        it('different namespaces are isolated', function() {
            var results = { trade: false, client: false };

            PubSub.on('trade:created', function() {
                results.trade = true;
            });

            PubSub.on('client:created', function() {
                results.client = true;
            });

            PubSub.emit('trade:created');

            expect(results.trade).toBe(true);
            expect(results.client).toBe(false);
        });

        it('wildcard matching not supported (specific events only)', function() {
            var received = [];

            PubSub.on('entity:created', function() {
                received.push('entity:created');
            });

            // These should not trigger entity:created
            PubSub.emit('trade:created');
            PubSub.emit('client:created');

            expect(received.length).toBe(0);

            // This should trigger
            PubSub.emit('entity:created');
            expect(received.length).toBe(1);
        });

    });

    describe('State Synchronization', function() {

        it('shared state via PubSub', function() {
            var sharedState = { count: 0 };

            // Multiple "components" watching state
            var component1Value = null;
            var component2Value = null;

            PubSub.on('state:updated', function(newState) {
                component1Value = newState.count;
            });

            PubSub.on('state:updated', function(newState) {
                component2Value = newState.count;
            });

            // Update state and broadcast
            sharedState.count = 42;
            PubSub.emit('state:updated', sharedState);

            expect(component1Value).toBe(42);
            expect(component2Value).toBe(42);
        });

    });

});
