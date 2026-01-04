/**
 * Benchmark Suite
 *
 * Comprehensive benchmarks with reporting.
 */

describe('Funky.Perf.Benchmarks', function() {

    var Perf = FunkyTests.Perf;
    var benchmarkResults = [];

    afterAll(function() {
        // Print benchmark report
        console.log('\n');
        console.log('%c═══════════════════════════════════════════════════════════', 'color: #6c5ce7');
        console.log('%c                    BENCHMARK RESULTS                       ', 'color: #6c5ce7; font-weight: bold');
        console.log('%c═══════════════════════════════════════════════════════════', 'color: #6c5ce7');
        console.log('\n');

        var passed = 0;
        var failed = 0;

        benchmarkResults.forEach(function(r) {
            if (r.passed) {
                passed++;
            } else {
                failed++;
            }
            Perf.logResult(r, r.threshold);
        });

        console.log('\n');
        console.log('%c───────────────────────────────────────────────────────────', 'color: #636e72');
        console.log('%cTotal: ' + benchmarkResults.length + ' benchmarks, ' +
                   passed + ' passed, ' + failed + ' failed', 'font-weight: bold');
        console.log('\n');
    });

    describe('DOM Operations', function() {

        it('element creation (1000 divs)', function() {
            var result = Perf.benchmark('DOM: Create 1000 divs', function() {
                for (var i = 0; i < 1000; i++) {
                    document.createElement('div');
                }
            }, { iterations: 50 });

            result.threshold = 10;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('element append (100 children)', function() {
            var container = document.createElement('div');
            document.body.appendChild(container);

            var result = Perf.benchmark('DOM: Append 100 children', function() {
                container.innerHTML = '';
                for (var i = 0; i < 100; i++) {
                    container.appendChild(document.createElement('div'));
                }
            }, { iterations: 50 });

            container.remove();

            result.threshold = 5;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('querySelector (1000 elements)', function() {
            var container = document.createElement('div');
            for (var i = 0; i < 1000; i++) {
                var div = document.createElement('div');
                div.className = 'item item-' + i;
                container.appendChild(div);
            }
            document.body.appendChild(container);

            var result = Perf.benchmark('DOM: querySelector in 1000', function() {
                container.querySelector('.item-500');
            }, { iterations: 1000 });

            container.remove();

            result.threshold = 0.5;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

    });

    describe('Event Operations', function() {

        it('event binding (100 handlers)', function() {
            var buttons = [];
            for (var i = 0; i < 100; i++) {
                buttons.push(document.createElement('button'));
            }

            var result = Perf.benchmark('Events: Bind 100 handlers', function() {
                buttons.forEach(function(btn) {
                    btn.addEventListener('click', function() {});
                });
            }, { iterations: 50 });

            result.threshold = 5;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('event dispatch (100 events)', function() {
            var btn = document.createElement('button');
            var count = 0;
            btn.addEventListener('click', function() { count++; });

            var result = Perf.benchmark('Events: Dispatch 100 clicks', function() {
                for (var i = 0; i < 100; i++) {
                    btn.dispatchEvent(new MouseEvent('click'));
                }
            }, { iterations: 50 });

            result.threshold = 10;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

    });

    describe('PubSub Operations', function() {

        var PubSub = Funky.PubSub;

        afterEach(function() {
            PubSub.clear();
        });

        it('subscribe (100 handlers)', function() {
            var result = Perf.benchmark('PubSub: Subscribe 100', function() {
                for (var i = 0; i < 100; i++) {
                    PubSub.on('event:' + i, function() {});
                }
            }, { iterations: 50 });

            PubSub.clear();

            result.threshold = 5;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('emit to 100 subscribers', function() {
            for (var i = 0; i < 100; i++) {
                PubSub.on('mass:event', function() {});
            }

            var result = Perf.benchmark('PubSub: Emit to 100', function() {
                PubSub.emit('mass:event', { data: 'test' });
            }, { iterations: 100 });

            result.threshold = 2;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

    });

    describe('Cache Operations', function() {

        var Cache = Funky.Cache;

        afterEach(function() {
            Cache.clear();
        });

        it('cache set (100 items)', function() {
            var result = Perf.benchmark('Cache: Set 100 items', function() {
                for (var i = 0; i < 100; i++) {
                    Cache.set('key' + i, { value: i });
                }
            }, { iterations: 50 });

            Cache.clear();

            result.threshold = 5;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('cache get', function() {
            for (var i = 0; i < 100; i++) {
                Cache.set('key' + i, { value: i });
            }

            var result = Perf.benchmark('Cache: Get item', function() {
                Cache.get('key50');
            }, { iterations: 1000 });

            result.threshold = 0.1;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

    });

    describe('Component Operations', function() {

        afterEach(function() {
            var toastContainer = document.getElementById('funky-toast-container');
            if (toastContainer) toastContainer.innerHTML = '';
            Funky.Spinner.hideAll();
        });

        it('toast creation', function() {
            var result = Perf.benchmark('Toast: Create', function() {
                Funky.Toast.info('Test', { duration: 0 });
            }, { iterations: 20 });

            result.threshold = 10;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('spinner show/hide cycle', function() {
            var container = document.createElement('div');
            container.id = 'bench-spinner-container';
            document.body.appendChild(container);

            var result = Perf.benchmark('Spinner: Show/Hide', function() {
                Funky.Spinner.show('#bench-spinner-container');
                Funky.Spinner.hide('#bench-spinner-container');
            }, { iterations: 20 });

            container.remove();

            result.threshold = 15;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

    });

    describe('String Operations', function() {

        it('template string building (100 items)', function() {
            var result = Perf.benchmark('String: Build 100 items', function() {
                var html = '';
                for (var i = 0; i < 100; i++) {
                    html += '<div class="item" data-id="' + i + '">' + i + '</div>';
                }
            }, { iterations: 100 });

            result.threshold = 1;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('array join vs concatenation', function() {
            var joinResult = Perf.benchmark('String: Array join', function() {
                var parts = [];
                for (var i = 0; i < 100; i++) {
                    parts.push('<div>' + i + '</div>');
                }
                parts.join('');
            }, { iterations: 100 });

            var concatResult = Perf.benchmark('String: Concatenation', function() {
                var html = '';
                for (var i = 0; i < 100; i++) {
                    html += '<div>' + i + '</div>';
                }
            }, { iterations: 100 });

            joinResult.threshold = 1;
            joinResult.passed = joinResult.median < joinResult.threshold;
            benchmarkResults.push(joinResult);

            concatResult.threshold = 1;
            concatResult.passed = concatResult.median < concatResult.threshold;
            benchmarkResults.push(concatResult);

            expect(joinResult.passed && concatResult.passed).toBe(true);
        });

    });

    describe('Object Operations', function() {

        it('object creation (1000 objects)', function() {
            var result = Perf.benchmark('Object: Create 1000', function() {
                for (var i = 0; i < 1000; i++) {
                    var obj = { id: i, name: 'item', active: true };
                }
            }, { iterations: 100 });

            result.threshold = 2;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('object assign (100 merges)', function() {
            var base = { a: 1, b: 2, c: 3 };

            var result = Perf.benchmark('Object: Assign 100', function() {
                for (var i = 0; i < 100; i++) {
                    Object.assign({}, base, { d: i });
                }
            }, { iterations: 100 });

            result.threshold = 2;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('JSON parse/stringify cycle', function() {
            var obj = {
                users: [
                    { id: 1, name: 'Alice', email: 'alice@test.com' },
                    { id: 2, name: 'Bob', email: 'bob@test.com' }
                ],
                meta: { total: 2, page: 1 }
            };

            var result = Perf.benchmark('JSON: Parse/Stringify', function() {
                JSON.parse(JSON.stringify(obj));
            }, { iterations: 1000 });

            result.threshold = 0.5;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

    });

    describe('Array Operations', function() {

        it('array map (1000 items)', function() {
            var arr = [];
            for (var i = 0; i < 1000; i++) arr.push(i);

            var result = Perf.benchmark('Array: Map 1000', function() {
                arr.map(function(x) { return x * 2; });
            }, { iterations: 100 });

            result.threshold = 1;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('array filter (1000 items)', function() {
            var arr = [];
            for (var i = 0; i < 1000; i++) arr.push(i);

            var result = Perf.benchmark('Array: Filter 1000', function() {
                arr.filter(function(x) { return x % 2 === 0; });
            }, { iterations: 100 });

            result.threshold = 1;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('array reduce (1000 items)', function() {
            var arr = [];
            for (var i = 0; i < 1000; i++) arr.push(i);

            var result = Perf.benchmark('Array: Reduce 1000', function() {
                arr.reduce(function(sum, x) { return sum + x; }, 0);
            }, { iterations: 100 });

            result.threshold = 1;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

        it('array sort (1000 items)', function() {
            var result = Perf.benchmark('Array: Sort 1000', function() {
                var arr = [];
                for (var i = 0; i < 1000; i++) arr.push(Math.random());
                arr.sort(function(a, b) { return a - b; });
            }, { iterations: 50 });

            result.threshold = 5;
            result.passed = result.median < result.threshold;
            benchmarkResults.push(result);

            expect(result.passed).toBe(true);
        });

    });

});
