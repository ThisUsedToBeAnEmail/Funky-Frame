/**
 * Visual Regression Tests: StatsBar Component
 *
 * Tests visual appearance of stat card displays.
 */

describe('Funky.Visual.StatsBar', function() {

    var Visual = FunkyTests.Visual;
    var StatsBar = Funky.StatsBar;
    var fixture;

    beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="visual-stats-container" class="stats-bar stats-bar-stretch" style="display: flex; gap: 16px; padding: 20px; background: #f5f5f5;"></div>');
    });

    afterEach(function() {
        StatsBar.destroy('testStats');
        fixture.destroy();
    });

    describe('Stats Structure', function() {

        it('creates stat cards', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total', variant: 'primary' },
                    { id: 'active', icon: 'fa-check', label: 'Active', variant: 'success' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var cards = document.querySelectorAll('.stat-card-pro');
                expect(cards.length).toBe(2);
            });
        });

        it('stat cards have variant classes', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', label: 'Total', variant: 'primary' },
                    { id: 'active', label: 'Active', variant: 'success' },
                    { id: 'pending', label: 'Pending', variant: 'warning' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var primaryCard = document.querySelector('.stat-card-primary');
                var successCard = document.querySelector('.stat-card-success');
                var warningCard = document.querySelector('.stat-card-warning');

                expect(primaryCard).not.toBeNull();
                expect(successCard).not.toBeNull();
                expect(warningCard).not.toBeNull();
            });
        });

        it('stat cards have icon containers', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', icon: 'fa-users', label: 'Total' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var iconContainer = document.querySelector('.stat-icon');
                expect(iconContainer).not.toBeNull();
            });
        });

        it('stat cards have content containers', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', label: 'Total' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var content = document.querySelector('.stat-content');
                expect(content).not.toBeNull();
            });
        });

    });

    describe('Stat Values', function() {

        it('displays stat value element', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', label: 'Total' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var valueEl = document.querySelector('.stat-value');
                expect(valueEl).not.toBeNull();
            });
        });

        it('value element has data-stat-id', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'mystat', label: 'My Stat' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var valueEl = document.querySelector('[data-stat-id="mystat"]');
                expect(valueEl).not.toBeNull();
            });
        });

        it('displays placeholder initially', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', label: 'Total' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var valueEl = document.querySelector('.stat-value');
                expect(valueEl.textContent).toBe('-');
            });
        });

    });

    describe('Stat Labels', function() {

        it('displays stat label', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', label: 'Total Users' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var labelEl = document.querySelector('.stat-label');
                expect(labelEl).not.toBeNull();
                expect(labelEl.textContent).toBe('Total Users');
            });
        });

        it('uses id as label if label not provided', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'count' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var labelEl = document.querySelector('.stat-label');
                expect(labelEl.textContent).toBe('count');
            });
        });

    });

    describe('Update Method', function() {

        it('updates stat values', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'total', label: 'Total' },
                    { id: 'active', label: 'Active' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                StatsBar.update('testStats', { total: 150, active: 142 });

                return FunkyTests.delay(50);
            }).then(function() {
                var totalEl = document.querySelector('[data-stat-id="total"]');
                var activeEl = document.querySelector('[data-stat-id="active"]');

                expect(totalEl.textContent).toBe('150');
                expect(activeEl.textContent).toBe('142');
            });
        });

        it('formats large numbers', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'large', label: 'Large' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                StatsBar.update('testStats', { large: 12500 });

                return FunkyTests.delay(50);
            }).then(function() {
                var largeEl = document.querySelector('[data-stat-id="large"]');
                // Should have comma formatting or locale formatting
                expect(largeEl.textContent).toMatch(/12[,.]?500/);
            });
        });

        it('adds changed animation class on update', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'count', label: 'Count' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                StatsBar.update('testStats', { count: 10 });

                return FunkyTests.delay(50);
            }).then(function() {
                StatsBar.update('testStats', { count: 20 });

                return FunkyTests.delay(50);
            }).then(function() {
                var countEl = document.querySelector('[data-stat-id="count"]');
                expect(countEl.classList.contains('stats-value-changed')).toBe(true);
            });
        });

    });

    describe('Multiple Stats', function() {

        it('renders all configured stats', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 's1', label: 'Stat 1', variant: 'primary' },
                    { id: 's2', label: 'Stat 2', variant: 'success' },
                    { id: 's3', label: 'Stat 3', variant: 'warning' },
                    { id: 's4', label: 'Stat 4', variant: 'danger' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var cards = document.querySelectorAll('.stat-card-pro');
                expect(cards.length).toBe(4);
            });
        });

    });

    describe('Icon Display', function() {

        it('renders FontAwesome icon', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'users', icon: 'fa-users', label: 'Users' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var icon = document.querySelector('.stat-icon i');
                expect(icon).not.toBeNull();
                expect(icon.className).toContain('fa-users');
            });
        });

        it('uses default icon when not specified', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'generic', label: 'Generic' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var icon = document.querySelector('.stat-icon i');
                expect(icon).not.toBeNull();
                expect(icon.className).toContain('fa-chart-bar');
            });
        });

    });

    describe('Style Consistency', function() {

        it('stat cards are visible', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'test', label: 'Test' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var card = document.querySelector('.stat-card-pro');
                var styles = Visual.snapshotStyles(card);

                expect(styles.display).not.toBe('none');
                expect(styles.visibility).not.toBe('hidden');
            });
        });

        it('icon container is visible', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'test', icon: 'fa-star', label: 'Test' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                var icon = document.querySelector('.stat-icon');
                var styles = Visual.snapshotStyles(icon);

                expect(styles.display).not.toBe('none');
            });
        });

    });

    describe('Destroy', function() {

        it('clears container on destroy', function() {
            StatsBar.init('#visual-stats-container', {
                id: 'testStats',
                stats: [
                    { id: 'test', label: 'Test' }
                ]
            });

            return FunkyTests.delay(50).then(function() {
                StatsBar.destroy('testStats');

                return FunkyTests.delay(50);
            }).then(function() {
                var container = document.getElementById('visual-stats-container');
                expect(container.innerHTML).toBe('');
            });
        });

    });

});
