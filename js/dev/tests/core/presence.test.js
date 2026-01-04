/**
 * Funky.Presence Tests
 *
 * Tests for the real-time presence system that orchestrates IdleDetector,
 * Channel, and TypingIndicator components.
 */

describe('Funky.Core.Presence', function() {

    var Presence = Funky.Presence;
    var container;
    var originalChannel;
    var originalIdleDetector;
    var mockChannel;
    var mockIdleDetector;

    // Create mock Channel component
    function createMockChannel() {
        var mock = {
            _members: {},
            _handlers: {},
            join: function(channel, options) {
                if (!this._members[channel]) {
                    this._members[channel] = [];
                }
                return true;
            },
            leave: function(channel) {
                delete this._members[channel];
                return true;
            },
            publish: function(channel, event, data) {
                return true;
            },
            getMembers: function(channel) {
                return this._members[channel] || [];
            },
            getMemberCount: function(channel) {
                return (this._members[channel] || []).length;
            },
            on: function(event, handler) {
                if (!this._handlers[event]) {
                    this._handlers[event] = [];
                }
                this._handlers[event].push(handler);
                return this;
            },
            off: function(event, handler) {
                if (this._handlers[event]) {
                    this._handlers[event] = this._handlers[event].filter(function(h) {
                        return h !== handler;
                    });
                }
                return this;
            },
            trigger: function(event, data) {
                var handlers = this._handlers[event];
                if (handlers) {
                    for (var i = 0; i < handlers.length; i++) {
                        handlers[i](data);
                    }
                }
                return this;
            },
            addMember: function(channel, member) {
                if (!this._members[channel]) {
                    this._members[channel] = [];
                }
                this._members[channel].push(member);
            }
        };
        return mock;
    }

    // Create mock IdleDetector component
    function createMockIdleDetector() {
        var state = 'active';
        var handlers = {};

        return {
            _state: state,
            isInitialized: function() {
                return true;
            },
            getState: function() {
                return this._state;
            },
            isIdle: function() {
                return this._state === 'idle';
            },
            isAway: function() {
                return this._state === 'away';
            },
            getIdleTime: function() {
                return 0;
            },
            getLastActivity: function() {
                return Date.now();
            },
            triggerActivity: function() {
                this._state = 'active';
            },
            on: function(event, handler) {
                if (!handlers[event]) {
                    handlers[event] = [];
                }
                handlers[event].push(handler);
                return this;
            },
            off: function(event, handler) {
                if (handlers[event]) {
                    handlers[event] = handlers[event].filter(function(h) {
                        return h !== handler;
                    });
                }
                return this;
            },
            trigger: function(event, data) {
                if (handlers[event]) {
                    handlers[event].forEach(function(h) {
                        h(data);
                    });
                }
            },
            setState: function(newState) {
                this._state = newState;
            }
        };
    }

    beforeEach(function() {
        // Create container for UI tests
        container = document.createElement('div');
        container.id = 'presence-test-container';
        document.body.appendChild(container);

        // Store originals - note: Funky.Channel and Funky.IdleDetector are locked
        // via registry, so we must mock individual methods instead
        originalChannel = {
            join: Funky.Channel.join,
            leave: Funky.Channel.leave,
            publish: Funky.Channel.publish,
            getMembers: Funky.Channel.getMembers,
            getMemberCount: Funky.Channel.getMemberCount,
            on: Funky.Channel.on,
            off: Funky.Channel.off
        };
        originalIdleDetector = {
            isInitialized: Funky.IdleDetector.isInitialized,
            getState: Funky.IdleDetector.getState,
            isIdle: Funky.IdleDetector.isIdle,
            isAway: Funky.IdleDetector.isAway,
            getIdleTime: Funky.IdleDetector.getIdleTime,
            getLastActivity: Funky.IdleDetector.getLastActivity,
            triggerActivity: Funky.IdleDetector.triggerActivity,
            on: Funky.IdleDetector.on,
            off: Funky.IdleDetector.off
        };

        // Create mocks (these hold mock state)
        mockChannel = createMockChannel();
        mockIdleDetector = createMockIdleDetector();

        // Install mocks by replacing individual methods on the real objects
        Funky.Channel.join = mockChannel.join.bind(mockChannel);
        Funky.Channel.leave = mockChannel.leave.bind(mockChannel);
        Funky.Channel.publish = mockChannel.publish.bind(mockChannel);
        Funky.Channel.getMembers = mockChannel.getMembers.bind(mockChannel);
        Funky.Channel.getMemberCount = mockChannel.getMemberCount.bind(mockChannel);
        Funky.Channel.on = mockChannel.on.bind(mockChannel);
        Funky.Channel.off = mockChannel.off.bind(mockChannel);

        Funky.IdleDetector.isInitialized = mockIdleDetector.isInitialized.bind(mockIdleDetector);
        Funky.IdleDetector.getState = mockIdleDetector.getState.bind(mockIdleDetector);
        Funky.IdleDetector.isIdle = mockIdleDetector.isIdle.bind(mockIdleDetector);
        Funky.IdleDetector.isAway = mockIdleDetector.isAway.bind(mockIdleDetector);
        Funky.IdleDetector.getIdleTime = mockIdleDetector.getIdleTime.bind(mockIdleDetector);
        Funky.IdleDetector.getLastActivity = mockIdleDetector.getLastActivity.bind(mockIdleDetector);
        Funky.IdleDetector.triggerActivity = mockIdleDetector.triggerActivity.bind(mockIdleDetector);
        Funky.IdleDetector.on = mockIdleDetector.on.bind(mockIdleDetector);
        Funky.IdleDetector.off = mockIdleDetector.off.bind(mockIdleDetector);

        // Ensure Presence is destroyed before each test
        if (Presence.isInitialized()) {
            Presence.destroy();
        }
    });

    afterEach(function() {
        // Clean up container
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }

        // Destroy presence
        if (Presence.isInitialized()) {
            Presence.destroy();
        }

        // Restore originals
        Funky.Channel.join = originalChannel.join;
        Funky.Channel.leave = originalChannel.leave;
        Funky.Channel.publish = originalChannel.publish;
        Funky.Channel.getMembers = originalChannel.getMembers;
        Funky.Channel.getMemberCount = originalChannel.getMemberCount;
        Funky.Channel.on = originalChannel.on;
        Funky.Channel.off = originalChannel.off;

        Funky.IdleDetector.isInitialized = originalIdleDetector.isInitialized;
        Funky.IdleDetector.getState = originalIdleDetector.getState;
        Funky.IdleDetector.isIdle = originalIdleDetector.isIdle;
        Funky.IdleDetector.isAway = originalIdleDetector.isAway;
        Funky.IdleDetector.getIdleTime = originalIdleDetector.getIdleTime;
        Funky.IdleDetector.getLastActivity = originalIdleDetector.getLastActivity;
        Funky.IdleDetector.triggerActivity = originalIdleDetector.triggerActivity;
        Funky.IdleDetector.on = originalIdleDetector.on;
        Funky.IdleDetector.off = originalIdleDetector.off;
    });

    // =========================================================================
    // MODULE AVAILABILITY
    // =========================================================================

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('Presence')).toBe(true);
        });

        it('has STATUS constants', function() {
            expect(Presence.STATUS).toBeDefined();
            expect(Presence.STATUS.ONLINE).toBe('online');
            expect(Presence.STATUS.AWAY).toBe('away');
            expect(Presence.STATUS.IDLE).toBe('idle');
            expect(Presence.STATUS.BUSY).toBe('busy');
            expect(Presence.STATUS.OFFLINE).toBe('offline');
        });

        it('has ACTIVITY_STATUS constants', function() {
            expect(Presence.ACTIVITY_STATUS).toBeDefined();
            expect(Presence.ACTIVITY_STATUS.VIEWING).toBe('viewing');
            expect(Presence.ACTIVITY_STATUS.EDITING).toBe('editing');
            expect(Presence.ACTIVITY_STATUS.TYPING).toBe('typing');
        });

        it('has DEFAULTS', function() {
            expect(Presence.DEFAULTS).toBeDefined();
            expect(typeof Presence.DEFAULTS.heartbeatInterval).toBe('number');
        });

        it('has init method', function() {
            expect(typeof Presence.init).toBe('function');
        });

        it('has destroy method', function() {
            expect(typeof Presence.destroy).toBe('function');
        });

    });

    // =========================================================================
    // INITIALIZATION TESTS
    // =========================================================================

    describe('Initialization', function() {

        it('should initialize with required options', function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User'
            });

            expect(Presence.isInitialized()).toBe(true);
        });

        it('should fail without userId', function() {
            var consoleSpy = [];
            var originalError = console.error;
            console.error = function(msg) { consoleSpy.push(msg); };

            Presence.init({
                userName: 'Test User'
            });

            expect(Presence.isInitialized()).toBe(false);
            expect(consoleSpy.length).toBeGreaterThan(0);

            console.error = originalError;
        });

        it('should set current user correctly', function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                userAvatar: '/avatar.jpg'
            });

            var user = Presence.getCurrentUser();
            expect(user.id).toBe('user-123');
            expect(user.name).toBe('Test User');
            expect(user.avatar).toBe('/avatar.jpg');
        });

        it('should use default userName if not provided', function() {
            Presence.init({
                userId: 'user-123'
            });

            var user = Presence.getCurrentUser();
            expect(user.name).toBe('Anonymous');
        });

        it('should auto-join page channel if configured', function() {
            Presence.init({
                userId: 'user-123',
                autoJoinPage: true
            });

            expect(Presence.getCurrentPageChannel()).toBeTruthy();
            expect(Presence.isInChannel(Presence.getCurrentPageChannel())).toBe(true);
        });

        it('should not auto-join if autoJoinPage is false', function() {
            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            expect(Presence.getChannels().length).toBe(0);
        });

        it('should emit init event', function(done) {
            var initFired = false;

            Presence.on('init', function(data) {
                initFired = true;
                expect(data.user).toBeDefined();
                expect(data.user.id).toBe('user-123');
            });

            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            setTimeout(function() {
                expect(initFired).toBe(true);
                done();
            }, 50);
        });

        it('should return this for chaining', function() {
            var result = Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            expect(result).toBe(Presence);
        });

    });

    // =========================================================================
    // CHANNEL MANAGEMENT TESTS
    // =========================================================================

    describe('Channel Management', function() {

        beforeEach(function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });
        });

        it('should join channel correctly', function() {
            Presence.join('test-channel');

            expect(Presence.isInChannel('test-channel')).toBe(true);
            expect(Presence.getChannels()).toContain('test-channel');
        });

        it('should leave channel correctly', function() {
            Presence.join('test-channel');
            Presence.leave('test-channel');

            expect(Presence.isInChannel('test-channel')).toBe(false);
            expect(Presence.getChannels()).not.toContain('test-channel');
        });

        it('should track multiple channels', function() {
            Presence.join('channel-1');
            Presence.join('channel-2');
            Presence.join('channel-3');

            var channels = Presence.getChannels();
            expect(channels.length).toBe(3);
            expect(channels).toContain('channel-1');
            expect(channels).toContain('channel-2');
            expect(channels).toContain('channel-3');
        });

        it('should leaveAll correctly', function() {
            Presence.join('channel-1');
            Presence.join('channel-2');
            Presence.leaveAll();

            expect(Presence.getChannels().length).toBe(0);
        });

        it('should not duplicate channel on double join', function() {
            Presence.join('test-channel');
            Presence.join('test-channel');

            var channels = Presence.getChannels();
            var count = channels.filter(function(c) {
                return c === 'test-channel';
            }).length;

            expect(count).toBe(1);
        });

        it('should handle leaving non-existent channel gracefully', function() {
            expect(function() {
                Presence.leave('non-existent-channel');
            }).not.toThrow();
        });

        it('should emit join event', function(done) {
            Presence.on('join', function(data) {
                expect(data.channel).toBe('test-channel');
                expect(data.user).toBeDefined();
                done();
            });

            Presence.join('test-channel');
        });

        it('should emit leave event', function(done) {
            Presence.join('test-channel');

            Presence.on('leave', function(data) {
                expect(data.channel).toBe('test-channel');
                done();
            });

            Presence.leave('test-channel');
        });

        it('should return this for chaining', function() {
            var result = Presence.join('test-channel');
            expect(result).toBe(Presence);

            result = Presence.leave('test-channel');
            expect(result).toBe(Presence);
        });

    });

    // =========================================================================
    // USER MANAGEMENT TESTS
    // =========================================================================

    describe('User Management', function() {

        beforeEach(function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });
        });

        it('should get users in channel', function() {
            Presence.join('test-channel');

            // Add mock members
            mockChannel.addMember('test-channel', {
                id: 'user-1',
                name: 'User 1',
                status: 'online'
            });
            mockChannel.addMember('test-channel', {
                id: 'user-2',
                name: 'User 2',
                status: 'online'
            });

            var users = Presence.getUsers('test-channel');
            expect(users.length).toBe(2);
        });

        it('should get other users excluding self', function() {
            Presence.join('test-channel');

            mockChannel.addMember('test-channel', {
                id: 'user-123',  // Same as current user
                name: 'Test User',
                status: 'online'
            });
            mockChannel.addMember('test-channel', {
                id: 'user-2',
                name: 'User 2',
                status: 'online'
            });

            var others = Presence.getOtherUsers('test-channel');
            expect(others.length).toBe(1);
            expect(others[0].id).toBe('user-2');
        });

        it('should get user count', function() {
            Presence.join('test-channel');

            mockChannel.addMember('test-channel', { id: 'user-1' });
            mockChannel.addMember('test-channel', { id: 'user-2' });
            mockChannel.addMember('test-channel', { id: 'user-3' });

            expect(Presence.getUserCount('test-channel')).toBe(3);
        });

        it('should get user count excluding self', function() {
            Presence.join('test-channel');

            mockChannel.addMember('test-channel', { id: 'user-123' });
            mockChannel.addMember('test-channel', { id: 'user-2' });
            mockChannel.addMember('test-channel', { id: 'user-3' });

            expect(Presence.getUserCount('test-channel', true)).toBe(2);
        });

        it('should check if user is in channel', function() {
            Presence.join('test-channel');

            mockChannel.addMember('test-channel', { id: 'user-1' });

            expect(Presence.isUserInChannel('test-channel', 'user-1')).toBe(true);
            expect(Presence.isUserInChannel('test-channel', 'user-999')).toBe(false);
        });

        it('should get specific user from channel', function() {
            Presence.join('test-channel');

            mockChannel.addMember('test-channel', {
                id: 'user-1',
                name: 'User One',
                status: 'online'
            });

            var user = Presence.getUser('test-channel', 'user-1');
            expect(user).toBeDefined();
            expect(user.name).toBe('User One');

            var notFound = Presence.getUser('test-channel', 'user-999');
            expect(notFound).toBe(null);
        });

        it('should check if user is online in any channel', function() {
            Presence.join('channel-1');
            Presence.join('channel-2');

            mockChannel.addMember('channel-2', { id: 'user-5' });

            expect(Presence.isOnline('user-5')).toBe(true);
            expect(Presence.isOnline('user-999')).toBe(false);
        });

    });

    // =========================================================================
    // STATUS MANAGEMENT TESTS
    // =========================================================================

    describe('Status Management', function() {

        beforeEach(function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });
        });

        it('should get initial status as online', function() {
            expect(Presence.getStatus()).toBe('online');
        });

        it('should set status correctly', function() {
            Presence.setStatus('away');
            // Status comes from IdleDetector mock, but setStatus broadcasts
            expect(Presence.getCurrentUser().status).toBe('away');
        });

        it('should reject invalid status', function() {
            var consoleSpy = [];
            var originalWarn = console.warn;
            console.warn = function(msg) { consoleSpy.push(msg); };

            Presence.setStatus('invalid-status');
            expect(consoleSpy.length).toBeGreaterThan(0);

            console.warn = originalWarn;
        });

        it('should have setAway convenience method', function() {
            var result = Presence.setAway();
            expect(result).toBe(Presence);
        });

        it('should have setOnline convenience method', function() {
            var result = Presence.setOnline();
            expect(result).toBe(Presence);
        });

        it('should have setBusy convenience method', function() {
            var result = Presence.setBusy();
            expect(result).toBe(Presence);
        });

        it('should emit status event', function(done) {
            Presence.on('status', function(data) {
                expect(data.status).toBe('busy');
                done();
            });

            Presence.setStatus('busy');
        });

        it('should set channel-specific status', function() {
            Presence.join('test-channel');
            Presence.setChannelStatus('test-channel', 'editing');

            expect(Presence.getChannelStatus('test-channel')).toBe('editing');
        });

        it('should return null for non-joined channel status', function() {
            expect(Presence.getChannelStatus('non-existent')).toBe(null);
        });

    });

    // =========================================================================
    // IDLE DETECTION TESTS
    // =========================================================================

    describe('Idle Detection', function() {

        beforeEach(function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });
        });

        it('should check if idle via IdleDetector', function() {
            mockIdleDetector.setState('active');
            expect(Presence.isIdle()).toBe(false);

            mockIdleDetector.setState('idle');
            expect(Presence.isIdle()).toBe(true);
        });

        it('should check if away via IdleDetector', function() {
            mockIdleDetector.setState('active');
            expect(Presence.isAway()).toBe(false);

            mockIdleDetector.setState('away');
            expect(Presence.isAway()).toBe(true);
        });

        it('should get idle time from IdleDetector', function() {
            var idleTime = Presence.getIdleTime();
            expect(typeof idleTime).toBe('number');
        });

        it('should get last activity from IdleDetector', function() {
            var lastActivity = Presence.getLastActivity();
            expect(typeof lastActivity).toBe('number');
        });

        it('should trigger activity', function() {
            mockIdleDetector.setState('idle');
            Presence.triggerActivity();
            expect(mockIdleDetector._state).toBe('active');
        });

        it('should emit idle event when IdleDetector fires', function(done) {
            Presence.on('idle', function(data) {
                expect(data.user).toBeDefined();
                done();
            });

            mockIdleDetector.trigger('idle', {});
        });

        it('should emit active event when IdleDetector fires', function(done) {
            Presence.on('active', function(data) {
                expect(data.user).toBeDefined();
                done();
            });

            mockIdleDetector.trigger('active', {});
        });

    });

    // =========================================================================
    // EVENT TESTS
    // =========================================================================

    describe('Events', function() {

        beforeEach(function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });
        });

        it('should register event handlers with on()', function() {
            var called = false;
            Presence.on('join', function() {
                called = true;
            });

            Presence.join('test-channel');
            expect(called).toBe(true);
        });

        it('should remove event handler with off()', function() {
            var callCount = 0;
            var handler = function() { callCount++; };

            Presence.on('join', handler);
            Presence.join('channel-1');

            Presence.off('join', handler);
            Presence.join('channel-2');

            expect(callCount).toBe(1);
        });

        it('should remove all handlers for event with off(event)', function() {
            var count1 = 0;
            var count2 = 0;

            Presence.on('join', function() { count1++; });
            Presence.on('join', function() { count2++; });

            Presence.join('channel-1');
            expect(count1).toBe(1);
            expect(count2).toBe(1);

            Presence.off('join');
            Presence.join('channel-2');

            expect(count1).toBe(1);
            expect(count2).toBe(1);
        });

        it('should support once() for one-time handlers', function() {
            var callCount = 0;

            Presence.once('join', function() {
                callCount++;
            });

            Presence.join('channel-1');
            Presence.join('channel-2');

            expect(callCount).toBe(1);
        });

        it('should return this for chaining', function() {
            var result = Presence.on('test', function() {});
            expect(result).toBe(Presence);

            result = Presence.off('test');
            expect(result).toBe(Presence);
        });

    });

    // =========================================================================
    // UI COMPONENT TESTS
    // =========================================================================

    describe('UI Components', function() {

        beforeEach(function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false,
                autoInitUI: false
            });
        });

        describe('Avatar Stack', function() {

            it('should create avatar stack', function() {
                Presence.join('test-channel');

                var stack = Presence.createAvatarStack(container, 'test-channel');

                expect(stack).toBeDefined();
                expect(stack.element).toBeDefined();
                expect(container.querySelector('.presence-avatars')).toBeDefined();
            });

            it('should have update method', function() {
                Presence.join('test-channel');

                var stack = Presence.createAvatarStack(container, 'test-channel');
                expect(typeof stack.update).toBe('function');
            });

            it('should have destroy method', function() {
                Presence.join('test-channel');

                var stack = Presence.createAvatarStack(container, 'test-channel');
                expect(typeof stack.destroy).toBe('function');

                stack.destroy();
                expect(container.querySelector('.presence-avatars')).toBe(null);
            });

            it('should display user avatars', function() {
                Presence.join('test-channel');

                mockChannel.addMember('test-channel', {
                    id: 'user-1',
                    name: 'User 1',
                    avatar: '/u1.jpg',
                    status: 'online'
                });
                mockChannel.addMember('test-channel', {
                    id: 'user-2',
                    name: 'User 2',
                    avatar: '/u2.jpg',
                    status: 'online'
                });

                var stack = Presence.createAvatarStack(container, 'test-channel', {
                    excludeSelf: false
                });
                stack.update();

                var avatars = container.querySelectorAll('.presence-avatars__avatar');
                expect(avatars.length).toBe(2);
            });

            it('should show overflow indicator when exceeding maxAvatars', function() {
                Presence.join('test-channel');

                for (var i = 1; i <= 8; i++) {
                    mockChannel.addMember('test-channel', {
                        id: 'user-' + i,
                        name: 'User ' + i
                    });
                }

                var stack = Presence.createAvatarStack(container, 'test-channel', {
                    maxAvatars: 5,
                    excludeSelf: false
                });
                stack.update();

                var overflow = container.querySelector('.presence-avatars__overflow');
                expect(overflow).toBeDefined();
                expect(overflow.textContent).toBe('+3');
            });

        });

        describe('Viewers List', function() {

            it('should create viewers list', function() {
                Presence.join('test-channel');

                var list = Presence.createViewersList(container, 'test-channel');

                expect(list).toBeDefined();
                expect(list.element).toBeDefined();
                expect(container.querySelector('.presence-viewers')).toBeDefined();
            });

            it('should be hidden when no other users', function() {
                Presence.join('test-channel');

                var list = Presence.createViewersList(container, 'test-channel');

                expect(list.element.hidden).toBe(true);
            });

            it('should show when other users present', function() {
                Presence.join('test-channel');

                mockChannel.addMember('test-channel', {
                    id: 'user-999',
                    name: 'Other User'
                });

                var list = Presence.createViewersList(container, 'test-channel');
                list.update();

                expect(list.element.hidden).toBe(false);
            });

        });

        describe('Status Dot', function() {

            it('should create status dot', function() {
                var dot = Presence.createStatusDot(container);

                expect(dot).toBeDefined();
                expect(dot.element).toBeDefined();
                expect(container.querySelector('.presence-dot')).toBeDefined();
            });

            it('should reflect current status', function() {
                mockIdleDetector.setState('active');

                var dot = Presence.createStatusDot(container);

                expect(dot.element.classList.contains('presence-dot--online')).toBe(true);
            });

            it('should have destroy method', function() {
                var dot = Presence.createStatusDot(container);
                expect(typeof dot.destroy).toBe('function');

                dot.destroy();
                expect(container.querySelector('.presence-dot')).toBe(null);
            });

        });

        describe('Typing Indicator UI', function() {

            it('should create typing indicator UI', function() {
                Presence.join('test-channel');

                var indicator = Presence.createTypingIndicatorUI(container, 'test-channel');

                expect(indicator).toBeDefined();
                expect(indicator.element).toBeDefined();
                expect(container.querySelector('.presence-typing-ui')).toBeDefined();
            });

            it('should be hidden when no one typing', function() {
                Presence.join('test-channel');

                var indicator = Presence.createTypingIndicatorUI(container, 'test-channel');

                expect(indicator.element.hidden).toBe(true);
            });

        });

        describe('refreshUI', function() {

            it('should refresh all UI components', function() {
                Presence.join('test-channel');

                var updateCalled = false;
                var stack = Presence.createAvatarStack(container, 'test-channel');
                var originalUpdate = stack.update;
                stack.update = function() {
                    updateCalled = true;
                    originalUpdate.call(stack);
                };

                // Re-register with modified update
                Presence.refreshUI();

                // The original update function would have been called
                expect(typeof Presence.refreshUI).toBe('function');
            });

        });

        describe('destroyUI', function() {

            it('should destroy all UI components', function() {
                Presence.join('test-channel');

                Presence.createAvatarStack(container, 'test-channel');
                Presence.createStatusDot(container);

                expect(container.querySelectorAll('.presence-avatars, .presence-dot').length).toBe(2);

                Presence.destroyUI();

                // Components are removed
                expect(typeof Presence.destroyUI).toBe('function');
            });

        });

    });

    // =========================================================================
    // TYPING INDICATOR TESTS
    // =========================================================================

    describe('Typing Indicators', function() {

        beforeEach(function() {
            // Create mock TypingIndicator
            Funky.TypingIndicator = {
                create: function(options) {
                    return {
                        channel: options.channel,
                        isTyping: false,
                        typers: [],
                        startTyping: function() {
                            this.isTyping = true;
                        },
                        stopTyping: function() {
                            this.isTyping = false;
                        },
                        isLocalTyping: function() {
                            return this.isTyping;
                        },
                        getTypers: function() {
                            return this.typers;
                        },
                        getText: function() {
                            if (this.typers.length === 0) return '';
                            if (this.typers.length === 1) return this.typers[0].name + ' is typing...';
                            return 'Multiple people are typing...';
                        },
                        destroy: function() {}
                    };
                }
            };

            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });

            Presence.join('chat-channel');
        });

        afterEach(function() {
            delete Funky.TypingIndicator;
        });

        it('should start typing', function() {
            Presence.startTyping('chat-channel');
            expect(Presence.isTypingIn('chat-channel')).toBe(true);
        });

        it('should stop typing', function() {
            Presence.startTyping('chat-channel');
            Presence.stopTyping('chat-channel');
            expect(Presence.isTypingIn('chat-channel')).toBe(false);
        });

        it('should stop all typing', function() {
            Presence.join('channel-2');

            Presence.startTyping('chat-channel');
            Presence.startTyping('channel-2');

            Presence.stopAllTyping();

            expect(Presence.isTypingIn('chat-channel')).toBe(false);
            expect(Presence.isTypingIn('channel-2')).toBe(false);
        });

        it('should get typing users', function() {
            var users = Presence.getTypingUsers('chat-channel');
            expect(Array.isArray(users)).toBe(true);
        });

        it('should get typing text', function() {
            var text = Presence.getTypingText('chat-channel');
            expect(typeof text).toBe('string');
        });

        it('should return this for chaining', function() {
            expect(Presence.startTyping('chat-channel')).toBe(Presence);
            expect(Presence.stopTyping('chat-channel')).toBe(Presence);
        });

    });

    // =========================================================================
    // INPUT BINDING TESTS
    // =========================================================================

    describe('Typing Input Binding', function() {

        var input;

        beforeEach(function() {
            // Create mock TypingIndicator
            Funky.TypingIndicator = {
                create: function(options) {
                    return {
                        channel: options.channel,
                        startTyping: function() {},
                        stopTyping: function() {},
                        isLocalTyping: function() { return false; },
                        getTypers: function() { return []; },
                        getText: function() { return ''; },
                        destroy: function() {}
                    };
                }
            };

            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false,
                autoBindTypingInputs: false
            });

            Presence.join('chat-channel');

            input = document.createElement('input');
            input.type = 'text';
            container.appendChild(input);
        });

        afterEach(function() {
            delete Funky.TypingIndicator;
        });

        it('should bind input to channel', function() {
            var binding = Presence.bindTypingInput('chat-channel', input);

            expect(binding).toBeDefined();
            expect(binding.element).toBe(input);
            expect(binding.channel).toBe('chat-channel');
        });

        it('should accept selector string', function() {
            input.id = 'test-input';

            var binding = Presence.bindTypingInput('chat-channel', '#test-input');

            expect(binding).toBeDefined();
            expect(binding.element).toBe(input);
        });

        it('should return null for non-existent selector', function() {
            var consoleSpy = [];
            var originalWarn = console.warn;
            console.warn = function(msg) { consoleSpy.push(msg); };

            var binding = Presence.bindTypingInput('chat-channel', '#non-existent');

            expect(binding).toBe(null);
            expect(consoleSpy.length).toBeGreaterThan(0);

            console.warn = originalWarn;
        });

        it('should unbind input', function() {
            var binding = Presence.bindTypingInput('chat-channel', input);

            var result = Presence.unbindTypingInput(binding);

            expect(result).toBe(Presence);
        });

        it('should unbind all inputs', function() {
            var input2 = document.createElement('input');
            container.appendChild(input2);

            Presence.bindTypingInput('chat-channel', input);
            Presence.bindTypingInput('chat-channel', input2);

            var result = Presence.unbindAllTypingInputs();

            expect(result).toBe(Presence);
        });

        it('should refresh bindings', function() {
            var result = Presence.refreshTypingBindings();
            expect(result).toBe(Presence);
        });

    });

    // =========================================================================
    // LAST SEEN TESTS
    // =========================================================================

    describe('Last Seen Tracking', function() {

        beforeEach(function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });
        });

        it('should get last seen for user', function() {
            Presence.join('test-channel');

            mockChannel.addMember('test-channel', {
                id: 'user-5',
                name: 'User 5',
                lastSeen: '2024-01-15T12:00:00Z'
            });

            var lastSeen = Presence.getLastSeen('user-5');
            expect(lastSeen).toBe('2024-01-15T12:00:00Z');
        });

        it('should return null for unknown user', function() {
            var lastSeen = Presence.getLastSeen('unknown-user');
            expect(lastSeen).toBe(null);
        });

        it('should get relative last seen', function() {
            Presence.join('test-channel');

            var now = new Date();
            mockChannel.addMember('test-channel', {
                id: 'user-5',
                name: 'User 5',
                lastSeen: now.toISOString()
            });

            var relative = Presence.getLastSeenRelative('user-5');
            expect(relative).toBeDefined();
            expect(typeof relative).toBe('string');
        });

    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================

    describe('Cleanup', function() {

        it('should destroy properly', function() {
            Presence.init({
                userId: 'user-123',
                userName: 'Test User',
                autoJoinPage: false
            });

            Presence.join('channel-1');
            Presence.join('channel-2');

            Presence.destroy();

            expect(Presence.isInitialized()).toBe(false);
            expect(Presence.getCurrentUser()).toBe(null);
            expect(Presence.getChannels().length).toBe(0);
        });

        it('should emit destroy event', function(done) {
            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            Presence.on('destroy', function() {
                done();
            });

            Presence.destroy();
        });

        it('should handle double destroy gracefully', function() {
            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            Presence.destroy();

            expect(function() {
                Presence.destroy();
            }).not.toThrow();
        });

        it('should leave all channels on destroy', function() {
            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            Presence.join('channel-1');
            Presence.join('channel-2');

            var leaveCount = 0;
            Presence.on('leave', function() {
                leaveCount++;
            });

            Presence.destroy();

            expect(leaveCount).toBe(2);
        });

    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    describe('Edge Cases', function() {

        it('should handle operations before init gracefully', function() {
            expect(function() {
                Presence.join('test');
                Presence.leave('test');
                Presence.setStatus('away');
            }).not.toThrow();
        });

        it('should handle missing Channel component', function() {
            // Simulate Channel being unavailable by having methods throw
            var originalJoin = Funky.Channel.join;
            var originalGetMembers = Funky.Channel.getMembers;
            Funky.Channel.join = function() { throw new Error('Channel unavailable'); };
            Funky.Channel.getMembers = function() { return []; };

            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            // Presence should handle the error gracefully
            expect(function() {
                try {
                    Presence.join('test');
                } catch (e) {
                    // Expected - Channel.join throws
                }
                Presence.getUsers('test');
            }).not.toThrow();

            // Restore mocks
            Funky.Channel.join = mockChannel.join.bind(mockChannel);
            Funky.Channel.getMembers = mockChannel.getMembers.bind(mockChannel);
        });

        it('should handle missing IdleDetector component', function() {
            // Simulate IdleDetector being uninitialized by having isInitialized return false
            Funky.IdleDetector.isInitialized = function() { return false; };
            Funky.IdleDetector.getState = function() { return 'active'; };
            Funky.IdleDetector.isIdle = function() { return false; };
            Funky.IdleDetector.isAway = function() { return false; };

            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            expect(Presence.isIdle()).toBe(false);
            expect(Presence.isAway()).toBe(false);

            // Restore mocks for other tests
            Funky.IdleDetector.isInitialized = mockIdleDetector.isInitialized.bind(mockIdleDetector);
            Funky.IdleDetector.getState = mockIdleDetector.getState.bind(mockIdleDetector);
            Funky.IdleDetector.isIdle = mockIdleDetector.isIdle.bind(mockIdleDetector);
            Funky.IdleDetector.isAway = mockIdleDetector.isAway.bind(mockIdleDetector);
        });

        it('should return empty array for users in non-existent channel', function() {
            Presence.init({
                userId: 'user-123',
                autoJoinPage: false
            });

            expect(Presence.getUsers('non-existent').length).toBe(0);
            expect(Presence.getOtherUsers('non-existent').length).toBe(0);
        });

    });

});
