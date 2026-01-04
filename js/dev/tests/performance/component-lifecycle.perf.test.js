/**
 * Performance Tests: Component Lifecycle
 *
 * Tests component creation, rendering, and destruction performance.
 */

describe('Funky.Perf.ComponentLifecycle', function() {

    var Perf = FunkyTests.Perf;
    var Toast = Funky.Toast;
    var Spinner = Funky.Spinner;
    var Tabs = Funky.Tabs;
    var fixture;

    // Skip all tests if Perf utilities not available
    if (!Perf) {
        it('Perf utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="lifecycle-container"></div>');
    });

    afterEach(function() {
        fixture.destroy();
    });

    describe('Toast Performance', function() {

        afterEach(function() {
            var container = document.getElementById('funky-toast-container');
            if (container) {
                container.innerHTML = '';
            }
        });

        it('creates toast in < 50ms', function() {
            Perf.assertFasterThan(function() {
                Toast.success('Performance test message');
            }, 50); // Lenient for CI/sandbox environments
        });

        it('creates 20 toasts in < 100ms', function() {
            Perf.assertFasterThan(function() {
                for (var i = 0; i < 20; i++) {
                    Toast.info('Toast number ' + i, { duration: 0 });
                }
            }, 100);
        });

        it('toast with action button in < 15ms', function() {
            Perf.assertFasterThan(function() {
                Toast.confirm({
                    message: 'Confirm action?',
                    confirmText: 'Yes',
                    cancelText: 'No',
                    onConfirm: function() {}
                });
            }, 15);
        });

        it('clears all toasts efficiently', function() {
            // Create many toasts
            for (var i = 0; i < 20; i++) {
                Toast.info('Toast ' + i, { duration: 0 });
            }

            return FunkyTests.delay(100).then(function() {
                var container = document.getElementById('funky-toast-container');

                Perf.assertFasterThan(function() {
                    if (container) {
                        container.innerHTML = '';
                    }
                }, 10);
            });
        });

    });

    describe('Spinner Performance', function() {

        afterEach(function() {
            Spinner.hideAll();
        });

        it('shows spinner in < 20ms', function() {
            Perf.assertFasterThan(function() {
                Spinner.show('#lifecycle-container');
            }, 20);
        });

        it('hides spinner in < 5ms', function() {
            Spinner.show('#lifecycle-container');

            Perf.assertFasterThan(function() {
                Spinner.hide('#lifecycle-container');
            }, 5);
        });

        it('overlay spinner in < 15ms', function() {
            Perf.assertFasterThan(function() {
                Spinner.overlay({ text: 'Loading...' });
            }, 15);

            Spinner.hideOverlay();
        });

        it('wrap async operation adds minimal overhead', function() {
            var container = document.getElementById('lifecycle-container');

            return Perf.measureAsync(function() {
                return Spinner.wrap('#lifecycle-container', function() {
                    return Promise.resolve('done');
                });
            }).then(function(result) {
                // Should complete quickly (just promise overhead)
                expect(result.duration).toBeLessThan(50);
            });
        });

    });

    describe('Tabs Performance', function() {

        beforeEach(function() {
            var container = document.getElementById('lifecycle-container');
            container.innerHTML =
                '<ul class="nav nav-tabs" id="perf-tabs" role="tablist">' +
                    '<li class="nav-item"><button class="nav-link active" data-funky-tab="#tab1">Tab 1</button></li>' +
                    '<li class="nav-item"><button class="nav-link" data-funky-tab="#tab2">Tab 2</button></li>' +
                    '<li class="nav-item"><button class="nav-link" data-funky-tab="#tab3">Tab 3</button></li>' +
                    '<li class="nav-item"><button class="nav-link" data-funky-tab="#tab4">Tab 4</button></li>' +
                    '<li class="nav-item"><button class="nav-link" data-funky-tab="#tab5">Tab 5</button></li>' +
                '</ul>' +
                '<div class="tab-content">' +
                    '<div class="tab-pane show active" id="tab1">Content 1</div>' +
                    '<div class="tab-pane" id="tab2">Content 2</div>' +
                    '<div class="tab-pane" id="tab3">Content 3</div>' +
                    '<div class="tab-pane" id="tab4">Content 4</div>' +
                    '<div class="tab-pane" id="tab5">Content 5</div>' +
                '</div>';
        });

        afterEach(function() {
            Tabs.destroy('#perf-tabs');
        });

        it('initializes tabs in < 10ms', function() {
            Perf.assertFasterThan(function() {
                new Tabs('#perf-tabs');
            }, 10);
        });

        it('switches tabs in < 5ms', function() {
            var tabs = new Tabs('#perf-tabs');

            Perf.assertFasterThan(function() {
                tabs.show(1);
                tabs.show(2);
                tabs.show(3);
                tabs.show(4);
                tabs.show(0);
            }, 20);
        });

        it('rapid tab switching is smooth', function() {
            var tabs = new Tabs('#perf-tabs');

            var result = Perf.benchmark('tab switch', function() {
                tabs.show(Math.floor(Math.random() * 5));
            }, { iterations: 50 });

            expect(result.median).toBeLessThan(5);
        });

    });

    describe('Multiple Component Interaction', function() {

        it('spinner + toast + tabs together in < 50ms', function() {
            var container = document.getElementById('lifecycle-container');
            container.innerHTML =
                '<ul class="nav nav-tabs" id="multi-tabs">' +
                    '<li><button class="nav-link active" data-funky-tab="#mtab1">Tab 1</button></li>' +
                    '<li><button class="nav-link" data-funky-tab="#mtab2">Tab 2</button></li>' +
                '</ul>' +
                '<div class="tab-content">' +
                    '<div class="tab-pane show active" id="mtab1">Content 1</div>' +
                    '<div class="tab-pane" id="mtab2">Content 2</div>' +
                '</div>';

            Perf.assertFasterThan(function() {
                // Initialize tabs
                var tabs = new Tabs('#multi-tabs');

                // Show spinner
                Spinner.show('#lifecycle-container');

                // Show toast
                Toast.info('Loading...', { duration: 0 });

                // Switch tab
                tabs.show(1);

                // Hide spinner
                Spinner.hide('#lifecycle-container');

                // Show success toast
                Toast.success('Done!', { duration: 0 });
            }, 50);

            // Cleanup
            Tabs.destroy('#multi-tabs');
            Spinner.hideAll();
            var toastContainer = document.getElementById('funky-toast-container');
            if (toastContainer) toastContainer.innerHTML = '';
        });

    });

    describe('Component Destruction', function() {

        it('cleans up tabs instance efficiently', function() {
            var container = document.getElementById('lifecycle-container');
            container.innerHTML =
                '<ul class="nav nav-tabs" id="destroy-tabs">' +
                    '<li><button class="nav-link active" data-funky-tab="#dtab1">Tab 1</button></li>' +
                '</ul>' +
                '<div class="tab-content"><div class="tab-pane" id="dtab1">Content</div></div>';

            var tabs = new Tabs('#destroy-tabs');

            Perf.assertFasterThan(function() {
                tabs.dispose();
            }, 5);
        });

        it('spinner cleanup is fast', function() {
            // Show multiple spinners
            Spinner.show('#lifecycle-container');
            Spinner.overlay();

            Perf.assertFasterThan(function() {
                Spinner.hideAll();
            }, 10);
        });

    });

    describe('Large DOM Component', function() {

        it('handles component with 100 items efficiently', function() {
            var container = document.getElementById('lifecycle-container');

            // Create tabs structure
            var tabsHtml = '<ul class="nav nav-tabs" id="large-tabs">';
            var contentHtml = '<div class="tab-content">';

            for (var i = 0; i < 100; i++) {
                tabsHtml += '<li><button class="nav-link' + (i === 0 ? ' active' : '') +
                           '" data-funky-tab="#ltab' + i + '">Tab ' + i + '</button></li>';
                contentHtml += '<div class="tab-pane' + (i === 0 ? ' show active' : '') +
                              '" id="ltab' + i + '">Content ' + i + '</div>';
            }

            tabsHtml += '</ul>';
            contentHtml += '</div>';

            container.innerHTML = tabsHtml + contentHtml;

            // Initialize should still be fast
            Perf.assertFasterThan(function() {
                new Tabs('#large-tabs');
            }, 50);

            Tabs.destroy('#large-tabs');
        });

    });

    describe('Memory Considerations', function() {

        it('repeated component creation does not leak significantly', function() {
            var container = document.getElementById('lifecycle-container');

            var leak = Perf.checkForLeaks(function() {
                Toast.info('Leak test', { duration: 0 });
            }, 50);

            if (leak) {
                // Allow some memory growth but not excessive
                expect(leak.delta).toBeLessThan(5 * 1024 * 1024); // 5MB
            }

            var toastContainer = document.getElementById('funky-toast-container');
            if (toastContainer) toastContainer.innerHTML = '';
        });

    });

    describe('Cache Performance', function() {

        var Cache = Funky.Cache;

        afterEach(function() {
            Cache.clear();
        });

        it('cache set is fast', function() {
            Perf.assertFasterThan(function() {
                for (var i = 0; i < 1000; i++) {
                    Cache.set('key' + i, { data: 'value' + i });
                }
            }, 50);
        });

        it('cache get is fast', function() {
            for (var i = 0; i < 1000; i++) {
                Cache.set('key' + i, { data: 'value' + i });
            }

            var result = Perf.benchmark('cache get', function() {
                Cache.get('key500');
            }, { iterations: 1000 });

            expect(result.median).toBeLessThan(0.1);
        });

        it('cache clear is fast', function() {
            for (var i = 0; i < 1000; i++) {
                Cache.set('key' + i, { data: 'value' + i });
            }

            Perf.assertFasterThan(function() {
                Cache.clear();
            }, 20);
        });

    });

    describe('Storage Performance', function() {

        var Storage = Funky.Storage;

        afterEach(function() {
            Storage.clear();
        });

        it('storage set is reasonable', function() {
            Perf.assertFasterThan(function() {
                for (var i = 0; i < 100; i++) {
                    Storage.set('key' + i, { data: 'value' + i });
                }
            }, 100);
        });

        it('storage get is fast', function() {
            for (var i = 0; i < 100; i++) {
                Storage.set('key' + i, { data: 'value' + i });
            }

            var result = Perf.benchmark('storage get', function() {
                Storage.get('key50');
            }, { iterations: 100 });

            expect(result.median).toBeLessThan(1);
        });

    });

});
