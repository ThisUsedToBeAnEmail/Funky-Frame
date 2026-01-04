/**
 * Funky.Badge - Unit Tests
 * Tests for badge attachment, updates, subscriptions, and types
 */
FunkyTests.describe('Funky.Component.Badge', function() {
    'use strict';

    var Badge;
    var testContainer;

    FunkyTests.beforeEach(function() {
        Badge = Funky.Badge;

        // Create test container
        testContainer = document.createElement('div');
        testContainer.id = 'badge-test-container';
        document.body.appendChild(testContainer);
    });

    FunkyTests.afterEach(function() {
        // Clean up subscriptions
        if (Badge && Badge.clearSubscriptions) {
            Badge.clearSubscriptions();
        }

        // Remove test container
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    FunkyTests.describe('Registration', function() {

        FunkyTests.it('should be registered with Funky namespace', function() {
            FunkyTests.expect(Funky.Badge).toBeDefined();
        });

        FunkyTests.it('should expose expected API methods', function() {
            FunkyTests.expect(typeof Badge.attach).toBe('function');
            FunkyTests.expect(typeof Badge.update).toBe('function');
            FunkyTests.expect(typeof Badge.remove).toBe('function');
            FunkyTests.expect(typeof Badge.has).toBe('function');
            FunkyTests.expect(typeof Badge.getValue).toBe('function');
            FunkyTests.expect(typeof Badge.getType).toBe('function');
            FunkyTests.expect(typeof Badge.subscribe).toBe('function');
            FunkyTests.expect(typeof Badge.unsubscribe).toBe('function');
        });

        FunkyTests.it('should expose constants', function() {
            FunkyTests.expect(Badge.CLASS).toBe('funky-badge');
            FunkyTests.expect(Array.isArray(Badge.TYPES)).toBe(true);
            FunkyTests.expect(Badge.TYPES).toContain('count');
            FunkyTests.expect(Badge.TYPES).toContain('dot');
        });

    });

    // =========================================================================
    // ATTACH
    // =========================================================================

    FunkyTests.describe('attach()', function() {

        FunkyTests.it('should attach a badge to an element', function() {
            var btn = document.createElement('button');
            btn.id = 'test-btn';
            testContainer.appendChild(btn);

            Badge.attach('#test-btn', 5);

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge).toBeDefined();
            FunkyTests.expect(badge.textContent).toBe('5');
        });

        FunkyTests.it('should accept DOM element directly', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 10);

            FunkyTests.expect(btn.querySelector('.funky-badge')).toBeDefined();
        });

        FunkyTests.it('should accept options object', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { value: 25, type: 'warning' });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('25');
            FunkyTests.expect(badge.classList.contains('funky-badge--warning')).toBe(true);
        });

        FunkyTests.it('should add position class', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { value: 1, position: 'top-left' });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.classList.contains('funky-badge--top-left')).toBe(true);
        });

        FunkyTests.it('should set relative positioning on static elements', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 1);

            var position = window.getComputedStyle(btn).position;
            FunkyTests.expect(position).toBe('relative');
        });

        FunkyTests.it('should add data attribute', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { value: 5, type: 'success' });

            FunkyTests.expect(btn.getAttribute('data-funky-badge')).toBe('success');
        });

        FunkyTests.it('should return Badge for chaining', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            var result = Badge.attach(btn, 1);
            FunkyTests.expect(result).toBe(Badge);
        });

    });

    // =========================================================================
    // BADGE TYPES
    // =========================================================================

    FunkyTests.describe('Badge Types', function() {

        FunkyTests.it('should render count badge with number', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { value: 42, type: 'count' });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('42');
            FunkyTests.expect(badge.classList.contains('funky-badge--count')).toBe(true);
        });

        FunkyTests.it('should render dot badge without text', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { type: 'dot' });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('');
            FunkyTests.expect(badge.classList.contains('funky-badge--dot')).toBe(true);
        });

        FunkyTests.it('should render warning badge with default symbol', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { type: 'warning' });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('!');
        });

        FunkyTests.it('should render success badge with default symbol', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { type: 'success' });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toContain('✓');
        });

        FunkyTests.it('should render info badge with default symbol', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { type: 'info' });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('i');
        });

    });

    // =========================================================================
    // MAX VALUE
    // =========================================================================

    FunkyTests.describe('Max Value', function() {

        FunkyTests.it('should show 99+ for values over default max', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 150);

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('99+');
        });

        FunkyTests.it('should respect custom max value', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { value: 15, max: 10 });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('10+');
        });

        FunkyTests.it('should add large class for overflow', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 100);

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.classList.contains('funky-badge--large')).toBe(true);
        });

    });

    // =========================================================================
    // UPDATE
    // =========================================================================

    FunkyTests.describe('update()', function() {

        FunkyTests.it('should update badge value', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);
            Badge.update(btn, 10);

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('10');
        });

        FunkyTests.it('should remove badge when value is undefined', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);
            Badge.update(btn, { value: undefined });

            FunkyTests.expect(btn.querySelector('.funky-badge')).toBe(null);
        });

        FunkyTests.it('should add animation class on value change', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);
            Badge.update(btn, { value: 10, animate: true });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.classList.contains('funky-badge--animate')).toBe(true);
        });

    });

    // =========================================================================
    // REMOVE
    // =========================================================================

    FunkyTests.describe('remove()', function() {

        FunkyTests.it('should remove badge from element', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);
            Badge.remove(btn);

            FunkyTests.expect(btn.querySelector('.funky-badge')).toBe(null);
        });

        FunkyTests.it('should remove data attribute', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);
            Badge.remove(btn);

            FunkyTests.expect(btn.getAttribute('data-funky-badge')).toBe(null);
        });

        FunkyTests.it('should return Badge for chaining', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            var result = Badge.remove(btn);
            FunkyTests.expect(result).toBe(Badge);
        });

    });

    // =========================================================================
    // HAS / GET
    // =========================================================================

    FunkyTests.describe('has() and getValue()', function() {

        FunkyTests.it('should return true when badge exists', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);

            FunkyTests.expect(Badge.has(btn)).toBe(true);
        });

        FunkyTests.it('should return false when no badge', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            FunkyTests.expect(Badge.has(btn)).toBe(false);
        });

        FunkyTests.it('should get badge value', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 42);

            FunkyTests.expect(Badge.getValue(btn)).toBe('42');
        });

        FunkyTests.it('should get badge type', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, { value: 1, type: 'warning' });

            FunkyTests.expect(Badge.getType(btn)).toBe('warning');
        });

    });

    // =========================================================================
    // PUBSUB SUBSCRIPTION
    // =========================================================================

    FunkyTests.describe('PubSub Subscription', function() {

        FunkyTests.it('should subscribe to PubSub event', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            var subId = Badge.subscribe(btn, 'test:badge:count');

            FunkyTests.expect(subId).toBeDefined();
            FunkyTests.expect(typeof subId).toBe('string');
        });

        FunkyTests.it('should update badge on PubSub event', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 0);
            Badge.subscribe(btn, 'test:badge:update');

            Funky.PubSub.emit('test:badge:update', 15);

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('15');
        });

        FunkyTests.it('should handle object payload with count property', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 0);
            Badge.subscribe(btn, 'test:badge:object');

            Funky.PubSub.emit('test:badge:object', { count: 7 });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('7');
        });

        FunkyTests.it('should handle object payload with value property', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 0);
            Badge.subscribe(btn, 'test:badge:value');

            Funky.PubSub.emit('test:badge:value', { value: 12 });

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('12');
        });

        FunkyTests.it('should unsubscribe from event', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);
            var subId = Badge.subscribe(btn, 'test:badge:unsub');
            Badge.unsubscribe(subId);

            Funky.PubSub.emit('test:badge:unsub', 100);

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('5');
        });

        FunkyTests.it('should unsubscribe all for element', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);
            Badge.subscribe(btn, 'test:badge:all1');
            Badge.subscribe(btn, 'test:badge:all2');

            Badge.unsubscribeAll(btn);

            Funky.PubSub.emit('test:badge:all1', 50);
            Funky.PubSub.emit('test:badge:all2', 60);

            var badge = btn.querySelector('.funky-badge');
            FunkyTests.expect(badge.textContent).toBe('5');
        });

    });

    // =========================================================================
    // PUBSUB EVENTS
    // =========================================================================

    FunkyTests.describe('PubSub Events', function() {

        FunkyTests.it('should emit funky:badge:attached on attach', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            var eventData = null;
            var unsubscribe = Funky.PubSub.on('funky:badge:attached', function(data) {
                eventData = data;
            });

            Badge.attach(btn, 5);

            FunkyTests.expect(eventData).toBeDefined();
            FunkyTests.expect(eventData.value).toBe(5);
            FunkyTests.expect(eventData.type).toBe('count');

            unsubscribe();
        });

        FunkyTests.it('should emit funky:badge:updated on update', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);

            var eventData = null;
            var unsubscribe = Funky.PubSub.on('funky:badge:updated', function(data) {
                eventData = data;
            });

            Badge.update(btn, 10);

            FunkyTests.expect(eventData).toBeDefined();
            FunkyTests.expect(eventData.value).toBe(10);
            FunkyTests.expect(eventData.previousValue).toBe('5');

            unsubscribe();
        });

        FunkyTests.it('should emit funky:badge:removed on remove', function() {
            var btn = document.createElement('button');
            testContainer.appendChild(btn);

            Badge.attach(btn, 5);

            var eventData = null;
            var unsubscribe = Funky.PubSub.on('funky:badge:removed', function(data) {
                eventData = data;
            });

            Badge.remove(btn);

            FunkyTests.expect(eventData).toBeDefined();
            FunkyTests.expect(eventData.element).toBe(btn);

            unsubscribe();
        });

    });

});
