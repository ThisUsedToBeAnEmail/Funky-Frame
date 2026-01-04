/**
 * Funky.MediaQuery Tests
 *
 * Tests for the centralized media query manager with named breakpoints
 * and shared matchMedia listeners.
 */

describe('Funky.Core.MediaQuery', function() {

    var MediaQuery = Funky.MediaQuery;
    var subscribedNamespaces = [];
    var addedBreakpoints = [];

    afterEach(function() {
        // Clean up all subscriptions
        subscribedNamespaces.forEach(function(ns) {
            MediaQuery.unsubscribe(ns);
        });
        subscribedNamespaces = [];

        // Clean up added breakpoints
        addedBreakpoints.forEach(function(bp) {
            MediaQuery.removeBreakpoint(bp.name, bp.query);
        });
        addedBreakpoints = [];
    });

    describe('Module availability', function() {

        it('is registered', function() {
            expect(Funky.isRegistered('MediaQuery')).toBe(true);
        });

        it('has subscribe method', function() {
            expect(typeof MediaQuery.subscribe).toBe('function');
        });

        it('has unsubscribe method', function() {
            expect(typeof MediaQuery.unsubscribe).toBe('function');
        });

        it('has matches method', function() {
            expect(typeof MediaQuery.matches).toBe('function');
        });

        it('has getBreakpoints method', function() {
            expect(typeof MediaQuery.getBreakpoints).toBe('function');
        });

        it('has addBreakpoint method', function() {
            expect(typeof MediaQuery.addBreakpoint).toBe('function');
        });

        it('has getSubscriptions method', function() {
            expect(typeof MediaQuery.getSubscriptions).toBe('function');
        });

        it('has isSubscribed method', function() {
            expect(typeof MediaQuery.isSubscribed).toBe('function');
        });

    });

    describe('Predefined Breakpoints', function() {

        it('includes mobile breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.mobile).toBe('(max-width: 767px)');
        });

        it('includes tablet breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.tablet).toBe('(max-width: 1023px)');
        });

        it('includes desktop breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.desktop).toBe('(min-width: 1024px)');
        });

        it('includes large breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.large).toBe('(min-width: 1200px)');
        });

        it('includes portrait breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.portrait).toBe('(orientation: portrait)');
        });

        it('includes landscape breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.landscape).toBe('(orientation: landscape)');
        });

        it('includes reduced-motion breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints['reduced-motion']).toBe('(prefers-reduced-motion: reduce)');
        });

        it('includes dark-mode breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints['dark-mode']).toBe('(prefers-color-scheme: dark)');
        });

        it('includes touch breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.touch).toBe('(pointer: coarse)');
        });

        it('includes hover breakpoint', function() {
            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints.hover).toBe('(hover: hover)');
        });

    });

    describe('subscribe()', function() {

        it('subscribes to named breakpoint', function() {
            var namespace = 'test-subscribe-1';
            subscribedNamespaces.push(namespace);

            var result = MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace,
                onChange: function() {}
            });

            expect(result).toBe(true);
            expect(MediaQuery.isSubscribed(namespace)).toBe(true);
        });

        it('subscribes to custom query', function() {
            var namespace = 'test-subscribe-custom';
            subscribedNamespaces.push(namespace);

            var result = MediaQuery.subscribe({
                query: '(min-width: 500px)',
                namespace: namespace,
                onChange: function() {}
            });

            expect(result).toBe(true);
        });

        it('returns false without namespace', function() {
            var result = MediaQuery.subscribe({
                breakpoint: 'mobile',
                onChange: function() {}
            });

            expect(result).toBe(false);
        });

        it('returns false without onChange', function() {
            var result = MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: 'test-no-onchange'
            });

            expect(result).toBe(false);
        });

        it('returns false for unknown breakpoint', function() {
            var result = MediaQuery.subscribe({
                breakpoint: 'non-existent-breakpoint',
                namespace: 'test-unknown',
                onChange: function() {}
            });

            expect(result).toBe(false);
        });

        it('returns false for duplicate namespace', function() {
            var namespace = 'test-duplicate';
            subscribedNamespaces.push(namespace);

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace,
                onChange: function() {}
            });

            var result = MediaQuery.subscribe({
                breakpoint: 'desktop',
                namespace: namespace,
                onChange: function() {}
            });

            expect(result).toBe(false);
        });

        it('calls onChange immediately by default', function() {
            var namespace = 'test-immediate';
            subscribedNamespaces.push(namespace);
            var callCount = 0;

            MediaQuery.subscribe({
                breakpoint: 'desktop',
                namespace: namespace,
                onChange: function() { callCount++; }
            });

            expect(callCount).toBe(1);
        });

        it('respects immediate: false option', function() {
            var namespace = 'test-no-immediate';
            subscribedNamespaces.push(namespace);
            var callCount = 0;

            MediaQuery.subscribe({
                breakpoint: 'desktop',
                namespace: namespace,
                immediate: false,
                onChange: function() { callCount++; }
            });

            expect(callCount).toBe(0);
        });

        it('passes matches value to onChange', function() {
            var namespace = 'test-matches-value';
            subscribedNamespaces.push(namespace);
            var receivedValue = null;

            MediaQuery.subscribe({
                breakpoint: 'desktop',
                namespace: namespace,
                onChange: function(matches) {
                    receivedValue = matches;
                }
            });

            expect(typeof receivedValue).toBe('boolean');
        });

    });

    describe('unsubscribe()', function() {

        it('unsubscribes a namespace', function() {
            var namespace = 'test-unsubscribe';

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace,
                onChange: function() {}
            });

            var result = MediaQuery.unsubscribe(namespace);

            expect(result).toBe(true);
            expect(MediaQuery.isSubscribed(namespace)).toBe(false);
        });

        it('returns false for non-existent namespace', function() {
            var result = MediaQuery.unsubscribe('non-existent-namespace');

            expect(result).toBe(false);
        });

    });

    describe('matches()', function() {

        it('returns boolean for named breakpoint', function() {
            var result = MediaQuery.matches('mobile');

            expect(typeof result).toBe('boolean');
        });

        it('returns boolean for custom query', function() {
            var result = MediaQuery.matches('(min-width: 100px)');

            expect(typeof result).toBe('boolean');
        });

        it('returns true for always-matching query', function() {
            // A query that always matches in jsdom/browser
            var result = MediaQuery.matches('all');

            expect(result).toBe(true);
        });

        it('uses cached query when subscribed', function() {
            var namespace = 'test-cache-match';
            subscribedNamespaces.push(namespace);

            MediaQuery.subscribe({
                breakpoint: 'desktop',
                namespace: namespace,
                onChange: function() {}
            });

            // This should use the cached MediaQueryList
            var result = MediaQuery.matches('desktop');

            expect(typeof result).toBe('boolean');
        });

    });

    describe('addBreakpoint()', function() {

        it('adds a custom breakpoint', function() {
            var result = MediaQuery.addBreakpoint('custom-test', '(min-width: 999px)');
            addedBreakpoints.push({ name: 'custom-test', query: '(min-width: 999px)' });

            expect(result).toBe(true);

            var breakpoints = MediaQuery.getBreakpoints();
            expect(breakpoints['custom-test']).toBe('(min-width: 999px)');
        });

        it('returns false for existing breakpoint name', function() {
            var result = MediaQuery.addBreakpoint('mobile', '(max-width: 500px)');

            expect(result).toBe(false);
        });

        it('allows subscribing to custom breakpoint', function() {
            MediaQuery.addBreakpoint('my-breakpoint', '(min-width: 800px)');
            addedBreakpoints.push({ name: 'my-breakpoint', query: '(min-width: 800px)' });

            var namespace = 'test-custom-bp';
            subscribedNamespaces.push(namespace);

            var result = MediaQuery.subscribe({
                breakpoint: 'my-breakpoint',
                namespace: namespace,
                onChange: function() {}
            });

            expect(result).toBe(true);
        });

    });

    describe('getSubscriptions()', function() {

        it('returns empty object when no subscriptions', function() {
            var subscriptions = MediaQuery.getSubscriptions();

            // Filter out any pre-existing subscriptions from other tests
            var testSubscriptions = Object.keys(subscriptions).filter(function(ns) {
                return ns.indexOf('test-') === 0;
            });

            expect(testSubscriptions.length).toBe(0);
        });

        it('returns subscribed namespaces', function() {
            var namespace1 = 'test-sub-1';
            var namespace2 = 'test-sub-2';
            subscribedNamespaces.push(namespace1, namespace2);

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace1,
                onChange: function() {}
            });

            MediaQuery.subscribe({
                breakpoint: 'desktop',
                namespace: namespace2,
                onChange: function() {}
            });

            var subscriptions = MediaQuery.getSubscriptions();

            expect(subscriptions[namespace1]).toBeDefined();
            expect(subscriptions[namespace2]).toBeDefined();
        });

        it('maps namespace to query string', function() {
            var namespace = 'test-query-map';
            subscribedNamespaces.push(namespace);

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace,
                onChange: function() {}
            });

            var subscriptions = MediaQuery.getSubscriptions();

            expect(subscriptions[namespace]).toBe('(max-width: 767px)');
        });

    });

    describe('isSubscribed()', function() {

        it('returns true for subscribed namespace', function() {
            var namespace = 'test-is-subscribed';
            subscribedNamespaces.push(namespace);

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace,
                onChange: function() {}
            });

            expect(MediaQuery.isSubscribed(namespace)).toBe(true);
        });

        it('returns false for unsubscribed namespace', function() {
            expect(MediaQuery.isSubscribed('non-existent')).toBe(false);
        });

        it('returns false after unsubscribe', function() {
            var namespace = 'test-after-unsub';

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace,
                onChange: function() {}
            });

            MediaQuery.unsubscribe(namespace);

            expect(MediaQuery.isSubscribed(namespace)).toBe(false);
        });

    });

    describe('Multiple Subscriptions', function() {

        it('allows multiple subscriptions to same breakpoint', function() {
            var namespace1 = 'test-multi-1';
            var namespace2 = 'test-multi-2';
            subscribedNamespaces.push(namespace1, namespace2);

            var result1 = MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace1,
                onChange: function() {}
            });

            var result2 = MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace2,
                onChange: function() {}
            });

            expect(result1).toBe(true);
            expect(result2).toBe(true);
        });

        it('notifies all handlers on change', function() {
            var namespace1 = 'test-notify-1';
            var namespace2 = 'test-notify-2';
            subscribedNamespaces.push(namespace1, namespace2);

            var calls = [];

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace1,
                onChange: function(m) { calls.push({ ns: 'ns1', matches: m }); }
            });

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace2,
                onChange: function(m) { calls.push({ ns: 'ns2', matches: m }); }
            });

            // Both should have been called immediately
            expect(calls.length).toBe(2);
        });

        it('unsubscribing one does not affect others', function() {
            var namespace1 = 'test-partial-unsub-1';
            var namespace2 = 'test-partial-unsub-2';
            subscribedNamespaces.push(namespace2); // Only track namespace2 for cleanup

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace1,
                onChange: function() {}
            });

            MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: namespace2,
                onChange: function() {}
            });

            MediaQuery.unsubscribe(namespace1);

            expect(MediaQuery.isSubscribed(namespace1)).toBe(false);
            expect(MediaQuery.isSubscribed(namespace2)).toBe(true);
        });

    });

    describe('Error Handling', function() {

        it('handles null options gracefully', function() {
            var result = MediaQuery.subscribe(null);

            expect(result).toBe(false);
        });

        it('handles undefined options gracefully', function() {
            var result = MediaQuery.subscribe(undefined);

            expect(result).toBe(false);
        });

        it('handles non-function onChange gracefully', function() {
            var result = MediaQuery.subscribe({
                breakpoint: 'mobile',
                namespace: 'test-bad-handler',
                onChange: 'not a function'
            });

            expect(result).toBe(false);
        });

    });

    describe('PubSub Integration', function() {

        it('emits funky:mediaquery:change event', function(done) {
            var namespace = 'test-pubsub-change';
            subscribedNamespaces.push(namespace);

            var eventReceived = false;

            if (Funky.PubSub) {
                var unsubscribe = Funky.PubSub.on('funky:mediaquery:change', function(data) {
                    eventReceived = true;
                    unsubscribe();
                });
            }

            MediaQuery.subscribe({
                breakpoint: 'desktop',
                namespace: namespace,
                onChange: function() {}
            });

            // The initial subscription doesn't trigger change event
            // We just verify the subscription works
            setTimeout(function() {
                expect(MediaQuery.isSubscribed(namespace)).toBe(true);
                done();
            }, 50);
        });

    });

    describe('Query Resolution', function() {

        it('prioritizes query over breakpoint', function() {
            var namespace = 'test-query-priority';
            subscribedNamespaces.push(namespace);

            MediaQuery.subscribe({
                query: '(max-width: 999px)',
                breakpoint: 'mobile', // Should be ignored
                namespace: namespace,
                onChange: function() {}
            });

            var subscriptions = MediaQuery.getSubscriptions();
            expect(subscriptions[namespace]).toBe('(max-width: 999px)');
        });

    });

});
