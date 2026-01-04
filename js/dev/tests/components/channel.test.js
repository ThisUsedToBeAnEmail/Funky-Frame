/**
 * Funky.Channel Tests
 *
 * Tests for real-time room-based pub/sub system.
 */
FunkyTests.describe('Funky.Components.Channel', function() {
    var expect = FunkyTests.expect;
    var Channel = Funky.Channel;
    var mockWebSocket;

    // =========================================================================
    // TEST HELPERS
    // =========================================================================

    function createMockWebSocket() {
        return {
            messages: [],
            handlers: {},
            send: function(type, data) {
                this.messages.push({ type: type, data: data });
                return true;
            },
            on: function(event, handler) {
                if (!this.handlers[event]) {
                    this.handlers[event] = [];
                }
                this.handlers[event].push(handler);
            },
            off: function(event, handler) {
                if (this.handlers[event]) {
                    this.handlers[event] = this.handlers[event].filter(function(h) {
                        return h !== handler;
                    });
                }
            },
            trigger: function(event, data) {
                var handlers = this.handlers[event];
                if (handlers) {
                    for (var i = 0; i < handlers.length; i++) {
                        handlers[i](data);
                    }
                }
            }
        };
    }

    FunkyTests.beforeEach(function() {
        mockWebSocket = createMockWebSocket();

        // Clean up between tests
        if (Channel.isInitialized()) {
            Channel.destroy();
        }
    });

    FunkyTests.afterEach(function() {
        if (Channel.isInitialized()) {
            Channel.destroy();
        }
    });

    // =========================================================================
    // MODULE AVAILABILITY
    // =========================================================================

    FunkyTests.describe('Module availability', function() {

        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.Channel).toBeDefined();
        });

        FunkyTests.it('has init method', function() {
            expect(typeof Channel.init).toBe('function');
        });

        FunkyTests.it('has destroy method', function() {
            expect(typeof Channel.destroy).toBe('function');
        });

        FunkyTests.it('has isInitialized method', function() {
            expect(typeof Channel.isInitialized).toBe('function');
        });

        FunkyTests.it('has join method', function() {
            expect(typeof Channel.join).toBe('function');
        });

        FunkyTests.it('has leave method', function() {
            expect(typeof Channel.leave).toBe('function');
        });

        FunkyTests.it('has publish method', function() {
            expect(typeof Channel.publish).toBe('function');
        });

        FunkyTests.it('has subscribe method', function() {
            expect(typeof Channel.subscribe).toBe('function');
        });

        FunkyTests.it('has on method', function() {
            expect(typeof Channel.on).toBe('function');
        });

        FunkyTests.it('has off method', function() {
            expect(typeof Channel.off).toBe('function');
        });

        FunkyTests.it('has once method', function() {
            expect(typeof Channel.once).toBe('function');
        });

        FunkyTests.it('has getMembers method', function() {
            expect(typeof Channel.getMembers).toBe('function');
        });

        FunkyTests.it('has isJoined method', function() {
            expect(typeof Channel.isJoined).toBe('function');
        });

        FunkyTests.it('has waitFor method', function() {
            expect(typeof Channel.waitFor).toBe('function');
        });

        FunkyTests.it('has whenJoined method', function() {
            expect(typeof Channel.whenJoined).toBe('function');
        });

        FunkyTests.it('has delegate method', function() {
            expect(typeof Channel.delegate).toBe('function');
        });

        FunkyTests.it('has EVENTS constant', function() {
            expect(Channel.EVENTS).toBeDefined();
            expect(Channel.EVENTS.MESSAGE).toBe('message');
            expect(Channel.EVENTS.JOINED).toBe('joined');
            expect(Channel.EVENTS.LEFT).toBe('left');
        });

    });

    // =========================================================================
    // INITIALIZATION TESTS
    // =========================================================================

    FunkyTests.describe('Initialization', function() {

        FunkyTests.it('initializes with required options', function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123',
                userName: 'Test User'
            });

            expect(Channel.isInitialized()).toBe(true);
        });

        FunkyTests.it('fails without userId', function() {
            Channel.init({
                websocket: mockWebSocket
            });

            expect(Channel.isInitialized()).toBe(false);
        });

        FunkyTests.it('sets current user correctly', function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123',
                userName: 'Test User'
            });

            var user = Channel.getCurrentUser();
            expect(user.id).toBe('user-123');
            expect(user.name).toBe('Test User');
        });

        FunkyTests.it('does not double-initialize', function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });

            Channel.init({
                websocket: mockWebSocket,
                userId: 'different-user'
            });

            var user = Channel.getCurrentUser();
            expect(user.id).toBe('user-123');
        });

        FunkyTests.it('starts with no joined channels', function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });

            expect(Channel.getJoined().length).toBe(0);
            expect(Channel.getChannelCount()).toBe(0);
        });

    });

    // =========================================================================
    // MEMBERSHIP TESTS
    // =========================================================================

    FunkyTests.describe('Membership', function() {

        FunkyTests.beforeEach(function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123',
                userName: 'Test User'
            });
        });

        FunkyTests.it('sends join message', function() {
            Channel.join('room:test');

            var joinMessages = mockWebSocket.messages.filter(function(m) {
                return m.type === 'channel:join' && m.data.channel === 'room:test';
            });
            expect(joinMessages.length).toBe(1);
        });

        FunkyTests.it('tracks joining state', function() {
            Channel.join('room:test');

            expect(Channel.isJoining('room:test')).toBe(true);
            expect(Channel.isJoined('room:test')).toBe(false);
        });

        FunkyTests.it('tracks joined state after server confirmation', function() {
            Channel.join('room:test');

            // Simulate server response
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [{ id: 'user-123', name: 'Test User' }]
            });

            expect(Channel.isJoined('room:test')).toBe(true);
            expect(Channel.isJoining('room:test')).toBe(false);
        });

        FunkyTests.it('sends leave message', function() {
            Channel.join('room:test');
            mockWebSocket.messages = []; // Clear join message
            Channel.leave('room:test');

            var leaveMessages = mockWebSocket.messages.filter(function(m) {
                return m.type === 'channel:leave';
            });
            expect(leaveMessages.length).toBe(1);
        });

        FunkyTests.it('removes channel state on leave', function() {
            Channel.join('room:test');
            Channel.leave('room:test');

            expect(Channel.isJoined('room:test')).toBe(false);
            expect(Channel.getJoined().length).toBe(0);
        });

        FunkyTests.it('tracks members from server', function() {
            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [
                    { id: 'user-123', name: 'Test User' },
                    { id: 'user-456', name: 'Other User' }
                ]
            });

            var members = Channel.getMembers('room:test');
            expect(members.length).toBe(2);
        });

        FunkyTests.it('gets other members excluding self', function() {
            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [
                    { id: 'user-123', name: 'Test User' },
                    { id: 'user-456', name: 'Other User' }
                ]
            });

            var others = Channel.getOtherMembers('room:test');
            expect(others.length).toBe(1);
            expect(others[0].id).toBe('user-456');
        });

        FunkyTests.it('gets member count', function() {
            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [
                    { id: 'user-123', name: 'Test User' },
                    { id: 'user-456', name: 'Other User' }
                ]
            });

            expect(Channel.getMemberCount('room:test')).toBe(2);
            expect(Channel.getMemberCount('room:test', true)).toBe(1); // excludeSelf
        });

        FunkyTests.it('checks if member exists', function() {
            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [{ id: 'user-123', name: 'Test User' }]
            });

            expect(Channel.hasMember('room:test', 'user-123')).toBe(true);
            expect(Channel.hasMember('room:test', 'user-999')).toBe(false);
        });

        FunkyTests.it('leaves all channels', function() {
            Channel.join('room:1');
            Channel.join('room:2');
            mockWebSocket.messages = [];

            Channel.leaveAll();

            expect(Channel.getJoined().length).toBe(0);
        });

        FunkyTests.it('respects maxChannels limit', function() {
            Channel.destroy();
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123',
                maxChannels: 2
            });

            Channel.join('room:1');
            Channel.join('room:2');
            Channel.join('room:3'); // Should be rejected

            expect(Channel.getChannelCount()).toBeLessThanOrEqual(2);
        });

    });

    // =========================================================================
    // MESSAGING TESTS
    // =========================================================================

    FunkyTests.describe('Messaging', function() {

        FunkyTests.beforeEach(function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123',
                userName: 'Test User'
            });

            Channel.join('room:test');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: []
            });
        });

        FunkyTests.it('publishes message to channel', function() {
            Channel.publish('room:test', { text: 'Hello' });

            var publishMessages = mockWebSocket.messages.filter(function(m) {
                return m.type === 'channel:publish';
            });
            expect(publishMessages.length).toBe(1);
            expect(publishMessages[0].data.message.text).toBe('Hello');
        });

        FunkyTests.it('fails to publish when not joined', function() {
            var result = Channel.publish('room:other', { text: 'Hello' });
            expect(result).toBe(false);
        });

        FunkyTests.it('receives subscribed messages', function() {
            var received = null;

            Channel.subscribe('room:test', function(message, sender) {
                received = { message: message, sender: sender };
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { text: 'Hello' },
                sender: { id: 'other', name: 'Other' }
            });

            expect(received).not.toBe(null);
            expect(received.message.text).toBe('Hello');
            expect(received.sender.name).toBe('Other');
        });

        FunkyTests.it('filters by message type with subscribeType', function() {
            var chatCount = 0;

            Channel.subscribeType('room:test', 'chat', function(message) {
                chatCount++;
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { type: 'chat', text: 'Hello' },
                sender: { id: 'other' }
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { type: 'system', text: 'Info' },
                sender: { id: 'other' }
            });

            expect(chatCount).toBe(1);
        });

        FunkyTests.it('unsubscribes correctly', function() {
            var callCount = 0;

            var sub = Channel.subscribe('room:test', function() {
                callCount++;
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: {},
                sender: {}
            });

            Channel.unsubscribe(sub);

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: {},
                sender: {}
            });

            expect(callCount).toBe(1);
        });

        FunkyTests.it('handles subscribeOnce', function() {
            var callCount = 0;

            Channel.subscribeOnce('room:test', function() {
                callCount++;
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: {},
                sender: {}
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: {},
                sender: {}
            });

            expect(callCount).toBe(1);
        });

        FunkyTests.it('buffers messages', function() {
            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { id: 1 },
                sender: {}
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { id: 2 },
                sender: {}
            });

            var buffer = Channel.getBuffer('room:test');
            expect(buffer.length).toBe(2);
        });

        FunkyTests.it('clears buffer', function() {
            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { id: 1 },
                sender: {}
            });

            Channel.clearBuffer('room:test');

            var buffer = Channel.getBuffer('room:test');
            expect(buffer.length).toBe(0);
        });

        FunkyTests.it('broadcasts to all channels', function() {
            Channel.join('room:other');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:other',
                members: []
            });

            mockWebSocket.messages = [];

            Channel.broadcast({ text: 'Hello all' });

            var publishMessages = mockWebSocket.messages.filter(function(m) {
                return m.type === 'channel:publish';
            });
            expect(publishMessages.length).toBe(2);
        });

    });

    // =========================================================================
    // EVENT SYSTEM TESTS
    // =========================================================================

    FunkyTests.describe('Events', function() {

        FunkyTests.beforeEach(function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });
        });

        FunkyTests.it('emits joined event', function() {
            var received = null;

            Channel.on('joined', function(data) {
                received = data;
            });

            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: []
            });

            expect(received).not.toBe(null);
            expect(received.channel).toBe('room:test');
        });

        FunkyTests.it('emits join event for other members', function() {
            var received = null;

            Channel.on('join', function(data) {
                received = data;
            });

            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:member_joined',
                channel: 'room:test',
                member: { id: 'other-user', name: 'Other' }
            });

            expect(received).not.toBe(null);
            expect(received.member.id).toBe('other-user');
        });

        FunkyTests.it('emits leave event for other members', function() {
            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [{ id: 'other-user', name: 'Other' }]
            });

            var received = null;
            Channel.on('leave', function(data) {
                received = data;
            });

            mockWebSocket.trigger('message', {
                type: 'channel:member_left',
                channel: 'room:test',
                memberId: 'other-user'
            });

            expect(received).not.toBe(null);
            expect(received.member.id).toBe('other-user');
        });

        FunkyTests.it('handles channel-specific events', function() {
            var received = null;

            Channel.on('room:test:message', function(data) {
                received = data;
            });

            Channel.join('room:test');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: []
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { text: 'Hello' },
                sender: {}
            });

            expect(received).not.toBe(null);
            expect(received.channel).toBe('room:test');
        });

        FunkyTests.it('handles wildcard events', function() {
            var events = [];

            // Register wildcard handler
            Channel.on('*', function(data, event) {
                events.push({ data: data, event: event });
            });

            // Join a channel first - this adds the channel to _channels
            Channel.join('room:test');

            // Simulate server confirmation
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [{ id: 'user-123', name: 'Test User' }]
            });

            // Wildcard handler should have received the 'joined' event
            expect(events.length).toBeGreaterThan(0);
            if (events.length > 0) {
                expect(events[0].data.channel).toBe('room:test');
            }
        });

        FunkyTests.it('removes handlers with off()', function() {
            var callCount = 0;
            var handler = function() { callCount++; };

            Channel.on('joined', handler);
            Channel.join('room:test');

            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: []
            });

            Channel.off('joined', handler);

            Channel.join('room:other');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:other',
                members: []
            });

            expect(callCount).toBe(1);
        });

        FunkyTests.it('handles once() for one-time events', function() {
            var callCount = 0;

            Channel.once('joined', function() {
                callCount++;
            });

            Channel.join('room:1');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:1',
                members: []
            });

            Channel.join('room:2');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:2',
                members: []
            });

            expect(callCount).toBe(1);
        });

        FunkyTests.it('removes all channel handlers with offChannel()', function() {
            var callCount = 0;

            Channel.on('room:test:message', function() { callCount++; });
            Channel.on('room:test:join', function() { callCount++; });

            Channel.offChannel('room:test');

            // Handlers should no longer be called
            Channel.join('room:test');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: []
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: {},
                sender: {}
            });

            expect(callCount).toBe(0);
        });

    });

    // =========================================================================
    // DELEGATE TESTS
    // =========================================================================

    FunkyTests.describe('Event Delegation', function() {

        var container;

        FunkyTests.beforeEach(function() {
            container = document.createElement('div');
            container.id = 'channel-test-container';
            document.getElementById('test-fixture').appendChild(container);

            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });
        });

        FunkyTests.afterEach(function() {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        FunkyTests.it('delegates events to DOM element', function() {
            var received = null;

            container.addEventListener('funky.channel.message', function(e) {
                received = e.detail;
            });

            var delegation = Channel.delegate('room:test', container);

            Channel.join('room:test');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: []
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: { text: 'Hello' },
                sender: {}
            });

            expect(received).not.toBe(null);
            expect(received.channel).toBe('room:test');

            delegation.remove();
        });

        FunkyTests.it('removes delegation correctly', function() {
            var callCount = 0;

            container.addEventListener('funky.channel.message', function() {
                callCount++;
            });

            var delegation = Channel.delegate('room:test', container);

            Channel.join('room:test');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: []
            });

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: {},
                sender: {}
            });

            delegation.remove();

            mockWebSocket.trigger('message', {
                type: 'channel:message',
                channel: 'room:test',
                message: {},
                sender: {}
            });

            expect(callCount).toBe(1);
        });

    });

    // =========================================================================
    // PROMISE-BASED WAITING
    // =========================================================================

    FunkyTests.describe('Promise-based waiting', function() {

        FunkyTests.beforeEach(function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });
        });

        FunkyTests.it('whenJoined resolves immediately if already joined', function(done) {
            Channel.join('room:test');
            mockWebSocket.trigger('message', {
                type: 'channel:joined',
                channel: 'room:test',
                members: [{ id: 'user-123', name: 'Test' }]
            });

            // whenJoined should resolve quickly (in microtask) when already joined
            Channel.whenJoined('room:test').then(function(members) {
                expect(members.length).toBeGreaterThan(0);
                done();
            });
        });

        FunkyTests.it('getListenerCounts returns correct counts', function() {
            Channel.on('message', function() {});
            Channel.on('message', function() {});
            Channel.on('room:test:join', function() {});
            Channel.on('*', function() {});

            var counts = Channel.getListenerCounts();

            expect(counts.global.message).toBe(2);
            expect(counts.channel['room:test'].join).toBe(1);
            expect(counts.wildcard).toBe(1);
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================

    FunkyTests.describe('Cleanup', function() {

        FunkyTests.it('destroys properly', function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });

            Channel.join('room:test');
            Channel.destroy();

            expect(Channel.isInitialized()).toBe(false);
            expect(Channel.getJoined().length).toBe(0);
        });

        FunkyTests.it('sends leave messages on destroy', function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });

            Channel.join('room:1');
            Channel.join('room:2');

            mockWebSocket.messages = [];

            Channel.destroy();

            var leaveMessages = mockWebSocket.messages.filter(function(m) {
                return m.type === 'channel:leave';
            });
            expect(leaveMessages.length).toBe(2);
        });

        FunkyTests.it('clears all handlers on destroy', function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });

            Channel.on('message', function() {});
            Channel.on('*', function() {});

            Channel.destroy();

            var counts = Channel.getListenerCounts();
            expect(counts.wildcard).toBe(0);
        });

    });

    // =========================================================================
    // DEBUG HELPERS TESTS
    // =========================================================================

    FunkyTests.describe('Debug helpers', function() {

        FunkyTests.beforeEach(function() {
            Channel.init({
                websocket: mockWebSocket,
                userId: 'user-123'
            });
        });

        FunkyTests.it('toggles debug mode', function() {
            Channel.debug(true);
            Channel.debug(false);
            // Just checking it doesn't throw
            expect(true).toBe(true);
        });

        FunkyTests.it('returns listener counts', function() {
            var counts = Channel.getListenerCounts();

            expect(typeof counts.global).toBe('object');
            expect(typeof counts.channel).toBe('object');
            expect(typeof counts.wildcard).toBe('number');
        });

    });

});
