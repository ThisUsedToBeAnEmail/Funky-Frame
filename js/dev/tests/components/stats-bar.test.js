/**
 * Funky.StatsBar - Unit Tests
 * Tests for stats bar initialization, updates, and computations
 */
FunkyTests.describe('Funky.Component.StatsBar', function() {
    'use strict';

    var StatsBar;
    var testContainer;

    FunkyTests.beforeEach(function() {
        StatsBar = Funky.StatsBar;

        // Create test container
        testContainer = document.createElement('div');
        testContainer.id = 'statsbar-test-container';
        testContainer.className = 'stats-bar stats-bar-stretch';
        document.body.appendChild(testContainer);
    });

    FunkyTests.afterEach(function() {
        // Destroy instance
        if (StatsBar) {
            StatsBar.destroy('test-stats');
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
            FunkyTests.expect(Funky.StatsBar).toBeDefined();
        });

        FunkyTests.it('should expose expected API methods', function() {
            FunkyTests.expect(typeof StatsBar.init).toBe('function');
            FunkyTests.expect(typeof StatsBar.update).toBe('function');
            FunkyTests.expect(typeof StatsBar.compute).toBe('function');
            FunkyTests.expect(typeof StatsBar.get).toBe('function');
            FunkyTests.expect(typeof StatsBar.destroy).toBe('function');
        });

        FunkyTests.it('should expose _instances for bindable interface', function() {
            FunkyTests.expect(StatsBar._instances).toBeDefined();
            FunkyTests.expect(typeof StatsBar._instances).toBe('object');
        });

    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    FunkyTests.describe('init()', function() {

        FunkyTests.it('should initialize with stats configuration', function() {
            var instance = StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'total', label: 'Total', icon: 'fa-users' },
                    { id: 'active', label: 'Active', icon: 'fa-check' }
                ]
            });

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.container).toBe(testContainer);
        });

        FunkyTests.it('should create stat cards', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'total', label: 'Total' },
                    { id: 'active', label: 'Active' }
                ]
            });

            var cards = testContainer.querySelectorAll('.stat-card-pro');
            FunkyTests.expect(cards.length).toBe(2);
        });

        FunkyTests.it('should set stat labels', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'users', label: 'Total Users' }
                ]
            });

            var label = testContainer.querySelector('.stat-label');
            FunkyTests.expect(label.textContent).toBe('Total Users');
        });

        FunkyTests.it('should set initial value as dash', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'count', label: 'Count' }
                ]
            });

            var value = testContainer.querySelector('.stat-value');
            FunkyTests.expect(value.textContent).toBe('-');
        });

        FunkyTests.it('should apply variant class', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'success', label: 'Success', variant: 'success' }
                ]
            });

            var card = testContainer.querySelector('.stat-card-pro');
            FunkyTests.expect(card.classList.contains('stat-card-success')).toBe(true);
        });

        FunkyTests.it('should add icon', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'users', label: 'Users', icon: 'fa-users' }
                ]
            });

            var icon = testContainer.querySelector('.stat-icon i');
            FunkyTests.expect(icon).toBeDefined();
            FunkyTests.expect(icon.classList.contains('fa-users')).toBe(true);
        });

        FunkyTests.it('should set data-stat-id attribute', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'mystat', label: 'My Stat' }
                ]
            });

            var value = testContainer.querySelector('[data-stat-id="mystat"]');
            FunkyTests.expect(value).toBeDefined();
        });

        FunkyTests.it('should return null for invalid container', function() {
            var instance = StatsBar.init('#non-existent', {
                id: 'test-stats',
                stats: []
            });

            FunkyTests.expect(instance).toBe(null);
        });

    });

    // =========================================================================
    // UPDATE
    // =========================================================================

    FunkyTests.describe('update()', function() {

        FunkyTests.it('should update stat values', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'total', label: 'Total' },
                    { id: 'active', label: 'Active' }
                ]
            });

            StatsBar.update('test-stats', { total: 100, active: 85 });

            var totalEl = testContainer.querySelector('[data-stat-id="total"]');
            var activeEl = testContainer.querySelector('[data-stat-id="active"]');

            FunkyTests.expect(totalEl.textContent).toBe('100');
            FunkyTests.expect(activeEl.textContent).toBe('85');
        });

        FunkyTests.it('should format large numbers', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'big', label: 'Big Number' }
                ]
            });

            StatsBar.update('test-stats', { big: 1234567 });

            var el = testContainer.querySelector('[data-stat-id="big"]');
            // Should contain commas or locale-formatted
            FunkyTests.expect(el.textContent.length).toBeGreaterThan(7);
        });

        FunkyTests.it('should add animation class on value change', function(done) {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'count', label: 'Count' }
                ]
            });

            StatsBar.update('test-stats', { count: 10 });

            // Wait for initial value to be set
            setTimeout(function() {
                StatsBar.update('test-stats', { count: 20 });

                var el = testContainer.querySelector('[data-stat-id="count"]');
                FunkyTests.expect(el.classList.contains('stats-value-changed')).toBe(true);

                done();
            }, 50);
        });

        FunkyTests.it('should handle null/undefined values', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'nullval', label: 'Null Value' }
                ]
            });

            StatsBar.update('test-stats', { nullval: null });

            var el = testContainer.querySelector('[data-stat-id="nullval"]');
            FunkyTests.expect(el.textContent).toBe('-');
        });

    });

    // =========================================================================
    // COMPUTE
    // =========================================================================

    FunkyTests.describe('compute()', function() {

        FunkyTests.it('should compute count of items', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'total', label: 'Total' }
                ]
            });

            var data = [{}, {}, {}, {}];

            StatsBar.compute('test-stats', data, [
                { id: 'total', compute: 'count' }
            ]);

            var el = testContainer.querySelector('[data-stat-id="total"]');
            FunkyTests.expect(el.textContent).toBe('4');
        });

        FunkyTests.it('should compute countWhere', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'active', label: 'Active' }
                ]
            });

            var data = [
                { status: 'active' },
                { status: 'inactive' },
                { status: 'active' },
                { status: 'active' }
            ];

            StatsBar.compute('test-stats', data, [
                { id: 'active', compute: 'countWhere', field: 'status', value: 'active' }
            ]);

            var el = testContainer.querySelector('[data-stat-id="active"]');
            FunkyTests.expect(el.textContent).toBe('3');
        });

        FunkyTests.it('should compute sum', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'total', label: 'Total' }
                ]
            });

            var data = [
                { amount: 100 },
                { amount: 200 },
                { amount: 50 }
            ];

            StatsBar.compute('test-stats', data, [
                { id: 'total', compute: 'sum', field: 'amount' }
            ]);

            var el = testContainer.querySelector('[data-stat-id="total"]');
            FunkyTests.expect(el.textContent).toBe('350');
        });

        FunkyTests.it('should compute avg', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'average', label: 'Average' }
                ]
            });

            var data = [
                { score: 80 },
                { score: 90 },
                { score: 100 }
            ];

            StatsBar.compute('test-stats', data, [
                { id: 'average', compute: 'avg', field: 'score' }
            ]);

            var el = testContainer.querySelector('[data-stat-id="average"]');
            FunkyTests.expect(el.textContent).toBe('90');
        });

        FunkyTests.it('should compute min', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'minimum', label: 'Minimum' }
                ]
            });

            var data = [
                { value: 50 },
                { value: 25 },
                { value: 75 }
            ];

            StatsBar.compute('test-stats', data, [
                { id: 'minimum', compute: 'min', field: 'value' }
            ]);

            var el = testContainer.querySelector('[data-stat-id="minimum"]');
            FunkyTests.expect(el.textContent).toBe('25');
        });

        FunkyTests.it('should compute max', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'maximum', label: 'Maximum' }
                ]
            });

            var data = [
                { value: 50 },
                { value: 25 },
                { value: 75 }
            ];

            StatsBar.compute('test-stats', data, [
                { id: 'maximum', compute: 'max', field: 'value' }
            ]);

            var el = testContainer.querySelector('[data-stat-id="maximum"]');
            FunkyTests.expect(el.textContent).toBe('75');
        });

        FunkyTests.it('should support custom computation function', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'custom', label: 'Custom' }
                ]
            });

            var data = [
                { value: 10 },
                { value: 20 }
            ];

            StatsBar.compute('test-stats', data, [
                {
                    id: 'custom',
                    compute: 'custom',
                    fn: function(items) {
                        return items.length * 100;
                    }
                }
            ]);

            var el = testContainer.querySelector('[data-stat-id="custom"]');
            FunkyTests.expect(el.textContent).toBe('200');
        });

        FunkyTests.it('should handle empty data for avg', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'average', label: 'Average' }
                ]
            });

            StatsBar.compute('test-stats', [], [
                { id: 'average', compute: 'avg', field: 'value' }
            ]);

            var el = testContainer.querySelector('[data-stat-id="average"]');
            FunkyTests.expect(el.textContent).toBe('0');
        });

    });

    // =========================================================================
    // GET & DESTROY
    // =========================================================================

    FunkyTests.describe('get() and destroy()', function() {

        FunkyTests.it('should get instance by id', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [{ id: 'x', label: 'X' }]
            });

            var instance = StatsBar.get('test-stats');

            FunkyTests.expect(instance).toBeDefined();
            FunkyTests.expect(instance.container).toBe(testContainer);
        });

        FunkyTests.it('should return null for unknown id', function() {
            var instance = StatsBar.get('non-existent-stats');

            FunkyTests.expect(instance).toBe(null);
        });

        FunkyTests.it('should destroy instance and clear container', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [{ id: 'x', label: 'X' }]
            });

            StatsBar.destroy('test-stats');

            FunkyTests.expect(testContainer.innerHTML).toBe('');
            FunkyTests.expect(StatsBar.get('test-stats')).toBe(null);
        });

    });

    // =========================================================================
    // BINDABLE INTERFACE
    // =========================================================================

    FunkyTests.describe('Bindable Interface', function() {

        FunkyTests.it('should register instance in _instances by container id', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [{ id: 'x', label: 'X' }]
            });

            FunkyTests.expect(StatsBar._instances['statsbar-test-container']).toBeDefined();
        });

        FunkyTests.it('should support setData method', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'first', label: 'First' },
                    { id: 'second', label: 'Second' }
                ]
            });

            StatsBar.setData([
                { value: 42 },
                { value: 99 }
            ]);

            var firstEl = testContainer.querySelector('[data-stat-id="first"]');
            var secondEl = testContainer.querySelector('[data-stat-id="second"]');

            FunkyTests.expect(firstEl.textContent).toBe('42');
            FunkyTests.expect(secondEl.textContent).toBe('99');
        });

    });

    // =========================================================================
    // MULTIPLE STATS
    // =========================================================================

    FunkyTests.describe('Multiple Stats', function() {

        FunkyTests.it('should create multiple stat cards with different variants', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'total', label: 'Total', variant: 'primary' },
                    { id: 'active', label: 'Active', variant: 'success' },
                    { id: 'pending', label: 'Pending', variant: 'warning' },
                    { id: 'error', label: 'Errors', variant: 'danger' }
                ]
            });

            var cards = testContainer.querySelectorAll('.stat-card-pro');
            FunkyTests.expect(cards.length).toBe(4);

            FunkyTests.expect(cards[0].classList.contains('stat-card-primary')).toBe(true);
            FunkyTests.expect(cards[1].classList.contains('stat-card-success')).toBe(true);
            FunkyTests.expect(cards[2].classList.contains('stat-card-warning')).toBe(true);
            FunkyTests.expect(cards[3].classList.contains('stat-card-danger')).toBe(true);
        });

        FunkyTests.it('should update only specified stats', function() {
            StatsBar.init('#statsbar-test-container', {
                id: 'test-stats',
                stats: [
                    { id: 'a', label: 'A' },
                    { id: 'b', label: 'B' },
                    { id: 'c', label: 'C' }
                ]
            });

            StatsBar.update('test-stats', { a: 10 });
            StatsBar.update('test-stats', { c: 30 });

            var aEl = testContainer.querySelector('[data-stat-id="a"]');
            var bEl = testContainer.querySelector('[data-stat-id="b"]');
            var cEl = testContainer.querySelector('[data-stat-id="c"]');

            FunkyTests.expect(aEl.textContent).toBe('10');
            FunkyTests.expect(bEl.textContent).toBe('-');
            FunkyTests.expect(cEl.textContent).toBe('30');
        });

    });

});
