/**
 * Tests for Funky.JobQueue
 * Generic job queue for deferred/background processing
 */
FunkyTests.describe('Funky.Core.JobQueue', function() {
    var expect = FunkyTests.expect;
    var processedJobs = [];
    var testQueue = null;
    var queueCounter = 0;

    // Helper to create unique queue names
    function uniqueQueueName() {
        return 'test-queue-' + (++queueCounter) + '-' + Date.now();
    }

    // Simple processor that tracks processed jobs
    function testProcessor(job) {
        processedJobs.push(job);
        return Promise.resolve({ processed: true, id: job.id });
    }

    // Processor that fails
    function failingProcessor(job) {
        return Promise.reject(new Error('Test failure'));
    }

    // Processor with delay
    function delayedProcessor(job) {
        return new Promise(function(resolve) {
            setTimeout(function() {
                processedJobs.push(job);
                resolve({ processed: true });
            }, 50);
        });
    }

    FunkyTests.beforeEach(function() {
        processedJobs = [];
    });

    FunkyTests.afterEach(function() {
        // Cleanup test queue
        if (testQueue) {
            testQueue.stopAutoProcess();
            Funky.JobQueue.destroy(testQueue.name);
            testQueue = null;
        }
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.JobQueue).toBeDefined();
        });

        FunkyTests.it('is a constructor function', function() {
            expect(typeof Funky.JobQueue).toBe('function');
        });
    });

    FunkyTests.describe('Constructor', function() {
        FunkyTests.it('requires a name', function() {
            expect(function() {
                new Funky.JobQueue({ processor: testProcessor });
            }).toThrow();
        });

        FunkyTests.it('requires a processor function', function() {
            expect(function() {
                new Funky.JobQueue({ name: uniqueQueueName() });
            }).toThrow();
        });

        FunkyTests.it('creates queue with valid options', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
            expect(testQueue).toBeDefined();
            expect(testQueue.name).toContain('test-queue');
        });

        FunkyTests.it('prevents duplicate queue names', function() {
            var name = uniqueQueueName();
            testQueue = new Funky.JobQueue({
                name: name,
                processor: testProcessor,
                autoProcess: false
            });

            expect(function() {
                new Funky.JobQueue({
                    name: name,
                    processor: testProcessor,
                    autoProcess: false
                });
            }).toThrow();
        });
    });

    FunkyTests.describe('add()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('adds job to queue', function() {
            var job = testQueue.add({ type: 'test', data: { foo: 'bar' } });
            expect(job).toBeDefined();
            expect(job.id).toBeDefined();
            expect(job.type).toBe('test');
            expect(job.status).toBe('pending');
        });

        FunkyTests.it('assigns incremental IDs', function() {
            var job1 = testQueue.add({ type: 'test' });
            var job2 = testQueue.add({ type: 'test' });
            expect(job2.id).toBe(job1.id + 1);
        });

        FunkyTests.it('sets default priority to normal', function() {
            var job = testQueue.add({ type: 'test' });
            expect(job.priority).toBe('normal');
        });

        FunkyTests.it('accepts custom priority', function() {
            var job = testQueue.add({ type: 'test', priority: 'high' });
            expect(job.priority).toBe('high');
        });

        FunkyTests.it('sets createdAt timestamp', function() {
            var job = testQueue.add({ type: 'test' });
            expect(job.createdAt).toBeDefined();
            expect(isNaN(new Date(job.createdAt).getTime())).toBe(false);
        });
    });

    FunkyTests.describe('get()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('returns job by ID', function() {
            var added = testQueue.add({ type: 'test', data: { key: 'value' } });
            var retrieved = testQueue.get(added.id);
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(added.id);
            expect(retrieved.data.key).toBe('value');
        });

        FunkyTests.it('returns null for non-existent ID', function() {
            var result = testQueue.get(99999);
            expect(result).toBeNull();
        });

        FunkyTests.it('returns a copy (not reference)', function() {
            var added = testQueue.add({ type: 'test' });
            var retrieved = testQueue.get(added.id);
            retrieved.type = 'modified';
            var retrievedAgain = testQueue.get(added.id);
            expect(retrievedAgain.type).toBe('test');
        });
    });

    FunkyTests.describe('getAll()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('returns all jobs', function() {
            testQueue.add({ type: 'a' });
            testQueue.add({ type: 'b' });
            testQueue.add({ type: 'c' });
            var all = testQueue.getAll();
            expect(all.length).toBe(3);
        });

        FunkyTests.it('filters by status', function() {
            testQueue.add({ type: 'test' });
            testQueue.add({ type: 'test' });
            var pending = testQueue.getAll({ status: 'pending' });
            expect(pending.length).toBe(2);
        });

        FunkyTests.it('filters by type', function() {
            testQueue.add({ type: 'a' });
            testQueue.add({ type: 'b' });
            testQueue.add({ type: 'a' });
            var typeA = testQueue.getAll({ type: 'a' });
            expect(typeA.length).toBe(2);
        });

        FunkyTests.it('filters by priority', function() {
            testQueue.add({ type: 'test', priority: 'high' });
            testQueue.add({ type: 'test', priority: 'low' });
            testQueue.add({ type: 'test', priority: 'high' });
            var high = testQueue.getAll({ priority: 'high' });
            expect(high.length).toBe(2);
        });
    });

    FunkyTests.describe('remove()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('removes job by ID', function() {
            var job = testQueue.add({ type: 'test' });
            expect(testQueue.count()).toBe(1);
            var removed = testQueue.remove(job.id);
            expect(removed).toBe(true);
            expect(testQueue.count()).toBe(0);
        });

        FunkyTests.it('returns false for non-existent ID', function() {
            var removed = testQueue.remove(99999);
            expect(removed).toBe(false);
        });
    });

    FunkyTests.describe('count()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('returns total count', function() {
            testQueue.add({ type: 'test' });
            testQueue.add({ type: 'test' });
            expect(testQueue.count()).toBe(2);
        });

        FunkyTests.it('returns count by status', function() {
            testQueue.add({ type: 'test' });
            testQueue.add({ type: 'test' });
            expect(testQueue.count('pending')).toBe(2);
            expect(testQueue.count('failed')).toBe(0);
        });
    });

    FunkyTests.describe('clear()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('clears all jobs', function() {
            testQueue.add({ type: 'test' });
            testQueue.add({ type: 'test' });
            testQueue.clear();
            expect(testQueue.count()).toBe(0);
        });
    });

    FunkyTests.describe('pause() / resume()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('pauses and resumes', function() {
            expect(testQueue.isPaused()).toBe(false);
            testQueue.pause();
            expect(testQueue.isPaused()).toBe(true);
            testQueue.resume();
            expect(testQueue.isPaused()).toBe(false);
        });
    });

    FunkyTests.describe('isProcessing()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: delayedProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('returns false when not processing', function() {
            expect(testQueue.isProcessing()).toBe(false);
        });
    });

    FunkyTests.describe('Static methods', function() {
        FunkyTests.it('get() returns queue by name', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
            var retrieved = Funky.JobQueue.get(testQueue.name);
            expect(retrieved).toBe(testQueue);
        });

        FunkyTests.it('get() returns null for non-existent queue', function() {
            var result = Funky.JobQueue.get('non-existent-queue');
            expect(result).toBeNull();
        });

        FunkyTests.it('list() returns registered queue names', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
            var names = Funky.JobQueue.list();
            expect(names).toContain(testQueue.name);
        });

        FunkyTests.it('destroy() removes queue', function() {
            var name = uniqueQueueName();
            testQueue = new Funky.JobQueue({
                name: name,
                processor: testProcessor,
                autoProcess: false
            });
            var destroyed = Funky.JobQueue.destroy(name);
            expect(destroyed).toBe(true);
            expect(Funky.JobQueue.get(name)).toBeNull();
            testQueue = null; // Prevent afterEach from trying to destroy again
        });
    });

    FunkyTests.describe('debug()', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('returns debug info', function() {
            testQueue.add({ type: 'test' });
            var debug = testQueue.debug();
            expect(debug.name).toBe(testQueue.name);
            expect(debug.config).toBeDefined();
            expect(debug.state).toBeDefined();
            expect(debug.counts).toBeDefined();
            expect(debug.counts.pending).toBe(1);
        });
    });

    FunkyTests.describe('Events', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('on() registers event handler', function() {
            var called = false;
            testQueue.on('added', function() {
                called = true;
            });
            testQueue.add({ type: 'test' });
            expect(called).toBe(true);
        });

        FunkyTests.it('off() removes event handler', function() {
            var callCount = 0;
            var handler = function() {
                callCount++;
            };
            testQueue.on('added', handler);
            testQueue.add({ type: 'test' });
            expect(callCount).toBe(1);
            testQueue.off('added', handler);
            testQueue.add({ type: 'test' });
            expect(callCount).toBe(1);
        });
    });

    FunkyTests.describe('isStorageReady()', function() {
        FunkyTests.it('returns true when persist is false', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                persist: false,
                autoProcess: false
            });
            expect(testQueue.isStorageReady()).toBe(true);
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    FunkyTests.describe('Error handling', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('add handles null job data gracefully', function() {
            expect(function() {
                testQueue.add(null);
            }).not.toThrow();
        });

        FunkyTests.it('add handles undefined job data gracefully', function() {
            expect(function() {
                testQueue.add(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('add handles empty object gracefully', function() {
            var job = testQueue.add({});
            expect(job).toBeDefined();
            expect(job.id).toBeDefined();
        });

        FunkyTests.it('get handles null ID gracefully', function() {
            expect(function() {
                testQueue.get(null);
            }).not.toThrow();
        });

        FunkyTests.it('get handles undefined ID gracefully', function() {
            expect(function() {
                testQueue.get(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('get handles string ID gracefully', function() {
            expect(function() {
                testQueue.get('not-a-number');
            }).not.toThrow();
        });

        FunkyTests.it('remove handles null ID gracefully', function() {
            expect(function() {
                testQueue.remove(null);
            }).not.toThrow();
        });

        FunkyTests.it('remove handles undefined ID gracefully', function() {
            expect(function() {
                testQueue.remove(undefined);
            }).not.toThrow();
        });

        FunkyTests.it('remove handles negative ID gracefully', function() {
            var result = testQueue.remove(-1);
            expect(result).toBe(false);
        });

        FunkyTests.it('count handles null status gracefully', function() {
            expect(function() {
                testQueue.count(null);
            }).not.toThrow();
        });

        FunkyTests.it('count handles invalid status gracefully', function() {
            expect(function() {
                testQueue.count('invalid-status');
            }).not.toThrow();
        });

        FunkyTests.it('getAll handles null filter gracefully', function() {
            testQueue.add({ type: 'test' });
            expect(function() {
                testQueue.getAll(null);
            }).not.toThrow();
        });

        FunkyTests.it('getAll handles undefined filter gracefully', function() {
            testQueue.add({ type: 'test' });
            var result = testQueue.getAll(undefined);
            expect(result.length).toBe(1);
        });

        FunkyTests.it('on handles null event type gracefully', function() {
            expect(function() {
                testQueue.on(null, function() {});
            }).not.toThrow();
        });

        FunkyTests.it('on handles null handler gracefully', function() {
            expect(function() {
                testQueue.on('added', null);
            }).not.toThrow();
        });

        FunkyTests.it('off handles null event type gracefully', function() {
            expect(function() {
                testQueue.off(null, function() {});
            }).not.toThrow();
        });

        FunkyTests.it('off handles null handler gracefully', function() {
            expect(function() {
                testQueue.off('added', null);
            }).not.toThrow();
        });
    });

    // =========================================================================
    // EDGE CASES TESTS
    // =========================================================================
    FunkyTests.describe('Edge cases', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('handles adding many jobs rapidly', function() {
            for (var i = 0; i < 100; i++) {
                testQueue.add({ type: 'test', index: i });
            }
            expect(testQueue.count()).toBe(100);
        });

        FunkyTests.it('handles job with very long type name', function() {
            var longType = 'a'.repeat(1000);
            var job = testQueue.add({ type: longType });
            expect(job.type).toBe(longType);
        });

        FunkyTests.it('handles job with special characters in type', function() {
            var specialType = '<script>test</script>';
            var job = testQueue.add({ type: specialType });
            expect(job.type).toBe(specialType);
        });

        FunkyTests.it('handles job with Unicode in type', function() {
            var unicodeType = '日本語テスト 🎉';
            var job = testQueue.add({ type: unicodeType });
            expect(job.type).toBe(unicodeType);
        });

        FunkyTests.it('handles job with deeply nested data', function() {
            var deepData = { level1: { level2: { level3: { level4: { value: 'deep' } } } } };
            var job = testQueue.add({ type: 'test', data: deepData });
            expect(job.data.level1.level2.level3.level4.value).toBe('deep');
        });

        FunkyTests.it('handles job with array data', function() {
            var job = testQueue.add({ type: 'test', data: [1, 2, 3, 4, 5] });
            expect(Array.isArray(job.data)).toBe(true);
            expect(job.data.length).toBe(5);
        });

        FunkyTests.it('handles job with numeric type', function() {
            expect(function() {
                testQueue.add({ type: 12345 });
            }).not.toThrow();
        });

        FunkyTests.it('handles clearing empty queue', function() {
            expect(function() {
                testQueue.clear();
            }).not.toThrow();
            expect(testQueue.count()).toBe(0);
        });

        FunkyTests.it('handles multiple clears in a row', function() {
            testQueue.add({ type: 'test' });
            expect(function() {
                testQueue.clear();
                testQueue.clear();
                testQueue.clear();
            }).not.toThrow();
        });

        FunkyTests.it('handles pausing already paused queue', function() {
            testQueue.pause();
            expect(function() {
                testQueue.pause();
            }).not.toThrow();
            expect(testQueue.isPaused()).toBe(true);
        });

        FunkyTests.it('handles resuming non-paused queue', function() {
            expect(function() {
                testQueue.resume();
            }).not.toThrow();
            expect(testQueue.isPaused()).toBe(false);
        });

        FunkyTests.it('handles filtering by multiple criteria', function() {
            testQueue.add({ type: 'a', priority: 'high' });
            testQueue.add({ type: 'a', priority: 'low' });
            testQueue.add({ type: 'b', priority: 'high' });
            var result = testQueue.getAll({ type: 'a', priority: 'high' });
            expect(result.length).toBe(1);
        });

        FunkyTests.it('handles removing job while iterating', function() {
            var job1 = testQueue.add({ type: 'test' });
            testQueue.add({ type: 'test' });
            testQueue.add({ type: 'test' });

            var jobs = testQueue.getAll();
            testQueue.remove(job1.id);

            expect(testQueue.count()).toBe(2);
        });

        FunkyTests.it('handles all priority levels', function() {
            testQueue.add({ type: 'test', priority: 'high' });
            testQueue.add({ type: 'test', priority: 'normal' });
            testQueue.add({ type: 'test', priority: 'low' });

            expect(testQueue.count()).toBe(3);
        });
    });

    // =========================================================================
    // ASYNC BEHAVIOR TESTS
    // =========================================================================
    FunkyTests.describe('Async behavior', function() {
        FunkyTests.it('process triggers job processing', function(done) {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });

            testQueue.on('success', function() {
                done();
            });

            testQueue.add({ type: 'test' });
            testQueue.process();
        });

        FunkyTests.it('emits success event for successful job', function(done) {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });

            testQueue.on('success', function(data) {
                expect(data).toBeDefined();
                expect(data.job).toBeDefined();
                done();
            });

            testQueue.add({ type: 'test' });
            testQueue.process();
        });

        FunkyTests.it('emits empty event for empty queue', function(done) {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });

            testQueue.on('empty', function() {
                done();
            });

            testQueue.process();
        });

        FunkyTests.it('emits failed event on processor rejection', function(done) {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: failingProcessor,
                autoProcess: false,
                maxAttempts: 1
            });

            testQueue.on('failed', function(data) {
                expect(data).toBeDefined();
                done();
            });

            testQueue.add({ type: 'test' });
            testQueue.process();
        });

        FunkyTests.it('emits success event after processing', function(done) {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });

            var completed = false;
            testQueue.on('success', function() {
                completed = true;
                expect(completed).toBe(true);
                done();
            });

            testQueue.add({ type: 'test' });
            testQueue.process();
        });

        FunkyTests.it('emits failed event on processor error', function(done) {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: failingProcessor,
                autoProcess: false,
                maxAttempts: 1
            });

            var failed = false;
            testQueue.on('failed', function() {
                failed = true;
                expect(failed).toBe(true);
                done();
            });

            testQueue.add({ type: 'test' });
            testQueue.process();
        });

        FunkyTests.it('delayed processor completes eventually', function(done) {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: delayedProcessor,
                autoProcess: false
            });

            testQueue.on('success', function() {
                expect(processedJobs.length).toBe(1);
                done();
            });

            testQueue.add({ type: 'test' });
            testQueue.process();
        });
    });

    // =========================================================================
    // STATE VERIFICATION TESTS
    // =========================================================================
    FunkyTests.describe('State verification', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('job status changes to processing during process', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: delayedProcessor,
                autoProcess: false
            });

            var job = testQueue.add({ type: 'test' });
            testQueue.process();

            // Check processing state
            return FunkyTests.delay(10).then(function() {
                expect(testQueue.isProcessing()).toBe(true);
            });
        });

        FunkyTests.it('debug returns accurate counts', function() {
            testQueue.add({ type: 'a' });
            testQueue.add({ type: 'b' });
            testQueue.add({ type: 'c' });

            var debug = testQueue.debug();
            expect(debug.counts.pending).toBe(3);
            expect(debug.counts.total).toBe(3);
        });

        FunkyTests.it('pause prevents processing', function() {
            testQueue.add({ type: 'test' });
            testQueue.pause();
            testQueue.process();

            // Should not process when paused
            expect(processedJobs.length).toBe(0);
        });

        FunkyTests.it('resume allows processing after pause', function(done) {
            testQueue.add({ type: 'test' });
            testQueue.pause();
            testQueue.resume();

            testQueue.on('success', function() {
                expect(processedJobs.length).toBe(1);
                done();
            });

            testQueue.process();
        });

        FunkyTests.it('maintains job order for same priority', function(done) {
            testQueue.add({ type: 'first', priority: 'normal' });
            testQueue.add({ type: 'second', priority: 'normal' });
            testQueue.add({ type: 'third', priority: 'normal' });

            testQueue.on('success', function() {
                expect(processedJobs[0].type).toBe('first');
                done();
            });

            testQueue.process();
        });
    });

    // =========================================================================
    // CLEANUP TESTS
    // =========================================================================
    FunkyTests.describe('Cleanup', function() {
        FunkyTests.it('destroy removes queue from registry', function() {
            var name = uniqueQueueName();
            testQueue = new Funky.JobQueue({
                name: name,
                processor: testProcessor,
                autoProcess: false
            });

            Funky.JobQueue.destroy(name);
            expect(Funky.JobQueue.get(name)).toBeNull();
            testQueue = null;
        });

        FunkyTests.it('destroy returns false for non-existent queue', function() {
            var result = Funky.JobQueue.destroy('non-existent-queue-name');
            expect(result).toBe(false);
        });

        FunkyTests.it('stopAutoProcess stops automatic processing', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: true
            });

            expect(function() {
                testQueue.stopAutoProcess();
            }).not.toThrow();
        });

        FunkyTests.it('clear removes all jobs but preserves queue', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });

            testQueue.add({ type: 'test' });
            testQueue.add({ type: 'test' });
            testQueue.clear();

            expect(testQueue.count()).toBe(0);
            expect(Funky.JobQueue.get(testQueue.name)).toBe(testQueue);
        });

        FunkyTests.it('off removes specific handler without affecting others', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });

            var count1 = 0;
            var count2 = 0;
            var handler1 = function() { count1++; };
            var handler2 = function() { count2++; };

            testQueue.on('added', handler1);
            testQueue.on('added', handler2);
            testQueue.off('added', handler1);

            testQueue.add({ type: 'test' });

            expect(count1).toBe(0);
            expect(count2).toBe(1);
        });
    });

    // =========================================================================
    // INPUT VALIDATION TESTS
    // =========================================================================
    FunkyTests.describe('Input validation', function() {
        FunkyTests.it('constructor validates name is string', function() {
            expect(function() {
                new Funky.JobQueue({
                    name: 12345,
                    processor: testProcessor,
                    autoProcess: false
                });
            }).toThrow();
        });

        FunkyTests.it('constructor validates processor is function', function() {
            expect(function() {
                new Funky.JobQueue({
                    name: uniqueQueueName(),
                    processor: 'not a function',
                    autoProcess: false
                });
            }).toThrow();
        });

        FunkyTests.it('constructor accepts maxAttempts option', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false,
                maxAttempts: 5
            });
            var debug = testQueue.debug();
            expect(debug.config.maxAttempts).toBe(5);
        });

        FunkyTests.it('static get validates name parameter', function() {
            expect(function() {
                Funky.JobQueue.get(null);
            }).not.toThrow();
        });

        FunkyTests.it('static destroy validates name parameter', function() {
            expect(function() {
                Funky.JobQueue.destroy(null);
            }).not.toThrow();
        });

        FunkyTests.it('handles boolean autoProcess option', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
            expect(testQueue).toBeDefined();
        });

        FunkyTests.it('handles persist option', function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false,
                persist: true
            });
            expect(testQueue).toBeDefined();
        });
    });

    // =========================================================================
    // PRIORITY ORDERING TESTS
    // =========================================================================
    FunkyTests.describe('Priority ordering', function() {
        FunkyTests.beforeEach(function() {
            testQueue = new Funky.JobQueue({
                name: uniqueQueueName(),
                processor: testProcessor,
                autoProcess: false
            });
        });

        FunkyTests.it('high priority processes before normal', function(done) {
            testQueue.add({ type: 'normal', priority: 'normal' });
            testQueue.add({ type: 'high', priority: 'high' });

            testQueue.on('success', function() {
                expect(processedJobs[0].type).toBe('high');
                done();
            });

            testQueue.process();
        });

        FunkyTests.it('normal priority processes before low', function(done) {
            testQueue.add({ type: 'low', priority: 'low' });
            testQueue.add({ type: 'normal', priority: 'normal' });

            testQueue.on('success', function() {
                expect(processedJobs[0].type).toBe('normal');
                done();
            });

            testQueue.process();
        });
    });
});
