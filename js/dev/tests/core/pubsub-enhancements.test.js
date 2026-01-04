(function() {
    'use strict';

    var expect = FunkyTests.expect;
    var PubSub = Funky.PubSub;

    FunkyTests.describe('Funky.PubSub Enhancements', function() {

        // Cleanup after each test
        FunkyTests.afterEach(function() {
            PubSub.clear();
        });

        // once()
        FunkyTests.describe('once()', function() {

            FunkyTests.it('fires callback only once', function() {
                var count = 0;

                PubSub.once('test:once', function() {
                    count++;
                });

                PubSub.emit('test:once');
                PubSub.emit('test:once');
                PubSub.emit('test:once');

                expect(count).toBe(1);
            });

            FunkyTests.it('auto-removes subscriber after first fire', function() {
                PubSub.once('test:autoremove', function() {});

                expect(PubSub.has('test:autoremove')).toBeTruthy();

                PubSub.emit('test:autoremove');

                expect(PubSub.has('test:autoremove')).toBeFalsy();
            });

            FunkyTests.it('passes data to callback', function() {
                var received = null;

                PubSub.once('test:data', function(data) {
                    received = data;
                });

                PubSub.emit('test:data', { value: 42 });

                expect(received).toBeTruthy();
                expect(received.value).toBe(42);
            });

        });

        // off()
        FunkyTests.describe('off()', function() {

            FunkyTests.it('removes specific subscriber', function() {
                var count = 0;
                var handler = function() { count++; };

                PubSub.on('test:off', handler);
                PubSub.emit('test:off');

                expect(count).toBe(1);

                PubSub.off('test:off', handler);
                PubSub.emit('test:off');

                expect(count).toBe(1);
            });

            FunkyTests.it('removes all subscribers when no callback specified', function() {
                var count1 = 0;
                var count2 = 0;

                PubSub.on('test:offall', function() { count1++; });
                PubSub.on('test:offall', function() { count2++; });

                PubSub.emit('test:offall');
                expect(count1).toBe(1);
                expect(count2).toBe(1);

                PubSub.off('test:offall');
                PubSub.emit('test:offall');

                expect(count1).toBe(1);
                expect(count2).toBe(1);
            });

            FunkyTests.it('removes once() subscriber by original callback', function() {
                var fired = false;
                var handler = function() { fired = true; };

                PubSub.once('test:offonce', handler);
                PubSub.off('test:offonce', handler);

                PubSub.emit('test:offonce');

                expect(fired).toBeFalsy();
            });

            FunkyTests.it('returns this for chaining', function() {
                var result = PubSub.off('nonexistent');
                expect(result).toBe(PubSub);
            });

        });

        // has()
        FunkyTests.describe('has()', function() {

            FunkyTests.it('returns true when subscribers exist', function() {
                PubSub.on('test:has', function() {});

                expect(PubSub.has('test:has')).toBeTruthy();
            });

            FunkyTests.it('returns false when no subscribers', function() {
                expect(PubSub.has('test:nosubscribers')).toBeFalsy();
            });

            FunkyTests.it('returns false after subscribers removed', function() {
                PubSub.on('test:hasremoved', function() {});
                PubSub.off('test:hasremoved');

                expect(PubSub.has('test:hasremoved')).toBeFalsy();
            });

        });

        // subscribers()
        FunkyTests.describe('subscribers()', function() {

            FunkyTests.it('returns correct count', function() {
                expect(PubSub.subscribers('test:count')).toBe(0);

                PubSub.on('test:count', function() {});
                expect(PubSub.subscribers('test:count')).toBe(1);

                PubSub.on('test:count', function() {});
                expect(PubSub.subscribers('test:count')).toBe(2);

                PubSub.off('test:count');
                expect(PubSub.subscribers('test:count')).toBe(0);
            });

            FunkyTests.it('returns 0 for nonexistent topic', function() {
                expect(PubSub.subscribers('test:nonexistent')).toBe(0);
            });

        });

        // clear()
        FunkyTests.describe('clear()', function() {

            FunkyTests.it('removes all subscribers for a topic', function() {
                PubSub.on('test:clear1', function() {});
                PubSub.on('test:clear1', function() {});
                PubSub.on('test:clear2', function() {});

                PubSub.clear('test:clear1');

                expect(PubSub.has('test:clear1')).toBeFalsy();
                expect(PubSub.has('test:clear2')).toBeTruthy();
            });

            FunkyTests.it('removes all subscribers when no topic specified', function() {
                PubSub.on('test:clearall1', function() {});
                PubSub.on('test:clearall2', function() {});
                PubSub.on('test:clearall3', function() {});

                PubSub.clear();

                expect(PubSub.has('test:clearall1')).toBeFalsy();
                expect(PubSub.has('test:clearall2')).toBeFalsy();
                expect(PubSub.has('test:clearall3')).toBeFalsy();
            });

            FunkyTests.it('returns this for chaining', function() {
                var result = PubSub.clear();
                expect(result).toBe(PubSub);
            });

        });

        // namespace()
        FunkyTests.describe('namespace()', function() {

            FunkyTests.it('creates scoped on/emit', function() {
                var ns = PubSub.namespace('mymodule');
                var fired = false;

                ns.on('action', function() {
                    fired = true;
                });

                // Should respond to prefixed topic
                PubSub.emit('mymodule:action');

                expect(fired).toBeTruthy();
            });

            FunkyTests.it('namespace.emit works correctly', function() {
                var ns = PubSub.namespace('emitter');
                var received = null;

                PubSub.on('emitter:event', function(data) {
                    received = data;
                });

                ns.emit('event', { value: 'test' });

                expect(received).toBeTruthy();
                expect(received.value).toBe('test');
            });

            FunkyTests.it('namespace.once works correctly', function() {
                var ns = PubSub.namespace('oncetest');
                var count = 0;

                ns.once('event', function() {
                    count++;
                });

                ns.emit('event');
                ns.emit('event');

                expect(count).toBe(1);
            });

            FunkyTests.it('namespace.off removes subscriber', function() {
                var ns = PubSub.namespace('offtest');
                var count = 0;
                var handler = function() { count++; };

                ns.on('event', handler);
                ns.emit('event');

                expect(count).toBe(1);

                ns.off('event', handler);
                ns.emit('event');

                expect(count).toBe(1);
            });

            FunkyTests.it('namespace.has checks prefixed topic', function() {
                var ns = PubSub.namespace('hastest');

                ns.on('event', function() {});

                expect(ns.has('event')).toBeTruthy();
                expect(PubSub.has('hastest:event')).toBeTruthy();
            });

            FunkyTests.it('namespace.subscribers returns correct count', function() {
                var ns = PubSub.namespace('counttest');

                ns.on('event', function() {});
                ns.on('event', function() {});

                expect(ns.subscribers('event')).toBe(2);
            });

            FunkyTests.it('namespace.clear removes all namespaced topics', function() {
                var ns = PubSub.namespace('clearns');

                ns.on('event1', function() {});
                ns.on('event2', function() {});
                PubSub.on('other:topic', function() {});

                ns.clear();

                expect(ns.has('event1')).toBeFalsy();
                expect(ns.has('event2')).toBeFalsy();
                expect(PubSub.has('other:topic')).toBeTruthy();
            });

        });

    });

})();
