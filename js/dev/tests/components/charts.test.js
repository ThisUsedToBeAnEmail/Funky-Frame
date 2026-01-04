/**
 * Tests for Funky.Charts
 * Lightweight SVG Sparkline Charts
 */
FunkyTests.describe('Funky.Component.Charts', function() {
    // Skip all tests if Charts not available
    if (!Funky.Charts) {
        FunkyTests.it('Charts module not available', function() {
            FunkyTests.expect(true).toBe(true);
        });
        return;
    }

    var expect = FunkyTests.expect;
    var fixture;

    FunkyTests.beforeEach(function() {
        fixture = FunkyTests.fixture('<div id="test-container"></div>');
    });

    FunkyTests.afterEach(function() {
        fixture.cleanup();
    });

    FunkyTests.describe('Registration', function() {
        FunkyTests.it('is registered with Funky namespace', function() {
            expect(Funky.Charts).toBeDefined();
        });

        FunkyTests.it('has line method', function() {
            expect(typeof Funky.Charts.line).toBe('function');
        });

        FunkyTests.it('has bar method', function() {
            expect(typeof Funky.Charts.bar).toBe('function');
        });

        FunkyTests.it('has getTrend method', function() {
            expect(typeof Funky.Charts.getTrend).toBe('function');
        });

        FunkyTests.it('has autoInit method', function() {
            expect(typeof Funky.Charts.autoInit).toBe('function');
        });
    });

    FunkyTests.describe('getTrend()', function() {
        FunkyTests.it('returns positive for upward trend', function() {
            var result = Funky.Charts.getTrend([1, 2, 3, 4, 5]);
            expect(result).toBe('positive');
        });

        FunkyTests.it('returns negative for downward trend', function() {
            var result = Funky.Charts.getTrend([5, 4, 3, 2, 1]);
            expect(result).toBe('negative');
        });

        FunkyTests.it('returns neutral for flat trend', function() {
            var result = Funky.Charts.getTrend([5, 3, 4, 2, 5]);
            expect(result).toBe('neutral');
        });

        FunkyTests.it('returns neutral for empty data', function() {
            var result = Funky.Charts.getTrend([]);
            expect(result).toBe('neutral');
        });

        FunkyTests.it('returns neutral for single value', function() {
            var result = Funky.Charts.getTrend([5]);
            expect(result).toBe('neutral');
        });

        FunkyTests.it('returns neutral for null data', function() {
            var result = Funky.Charts.getTrend(null);
            expect(result).toBe('neutral');
        });

        FunkyTests.it('returns neutral for undefined data', function() {
            var result = Funky.Charts.getTrend(undefined);
            expect(result).toBe('neutral');
        });
    });

    FunkyTests.describe('line()', function() {
        FunkyTests.it('creates SVG element', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg).not.toBe(null);
        });

        FunkyTests.it('uses default width of 80', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('width')).toBe('80');
        });

        FunkyTests.it('uses default height of 30', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('height')).toBe('30');
        });

        FunkyTests.it('respects custom width', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5], { width: 100 });
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('width')).toBe('100');
        });

        FunkyTests.it('respects custom height', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5], { height: 50 });
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('height')).toBe('50');
        });

        FunkyTests.it('creates polyline element', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var polyline = container.querySelector('polyline');
            expect(polyline).not.toBe(null);
        });

        FunkyTests.it('creates area path element', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var path = container.querySelector('path');
            expect(path).not.toBe(null);
        });

        FunkyTests.it('adds sparkline-line class', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var polyline = container.querySelector('.sparkline-line');
            expect(polyline).not.toBe(null);
        });

        FunkyTests.it('adds sparkline-area class', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var area = container.querySelector('.sparkline-area');
            expect(area).not.toBe(null);
        });

        FunkyTests.it('adds positive class for upward trend', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var polyline = container.querySelector('.positive');
            expect(polyline).not.toBe(null);
        });

        FunkyTests.it('adds negative class for downward trend', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [5, 4, 3, 2, 1]);
            var polyline = container.querySelector('.negative');
            expect(polyline).not.toBe(null);
        });

        FunkyTests.it('uses custom color class', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5], { color: 'custom' });
            var polyline = container.querySelector('.custom');
            expect(polyline).not.toBe(null);
        });

        FunkyTests.it('includes role="img"', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('role')).toBe('img');
        });

        FunkyTests.it('includes aria-label', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('aria-label')).toBeDefined();
            expect(svg.getAttribute('aria-label').length).toBeGreaterThan(0);
        });

        FunkyTests.it('uses custom aria-label', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1, 2, 3], { ariaLabel: 'Custom label' });
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('aria-label')).toBe('Custom label');
        });

        FunkyTests.it('handles null container', function() {
            expect(function() {
                Funky.Charts.line(null, [1, 2, 3]);
            }).not.toThrow();
        });

        FunkyTests.it('handles null data', function() {
            var container = document.getElementById('test-container');
            expect(function() {
                Funky.Charts.line(container, null);
            }).not.toThrow();
        });

        FunkyTests.it('handles insufficient data', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [1]);
            var svg = container.querySelector('svg');
            expect(svg).toBe(null);
        });

        FunkyTests.it('handles identical values', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.line(container, [5, 5, 5, 5]);
            var svg = container.querySelector('svg');
            expect(svg).not.toBe(null);
        });
    });

    FunkyTests.describe('bar()', function() {
        FunkyTests.it('creates SVG element', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg).not.toBe(null);
        });

        FunkyTests.it('uses default width of 80', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('width')).toBe('80');
        });

        FunkyTests.it('uses default height of 30', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3, 4, 5]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('height')).toBe('30');
        });

        FunkyTests.it('creates rect elements for each data point', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3, 4, 5]);
            var rects = container.querySelectorAll('rect');
            expect(rects.length).toBe(5);
        });

        FunkyTests.it('adds sparkline-bar class', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3]);
            var bars = container.querySelectorAll('.sparkline-bar');
            expect(bars.length).toBe(3);
        });

        FunkyTests.it('adds positive class for upward trend', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3, 4, 5]);
            var bar = container.querySelector('.positive');
            expect(bar).not.toBe(null);
        });

        FunkyTests.it('adds negative class for downward trend', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [5, 4, 3, 2, 1]);
            var bar = container.querySelector('.negative');
            expect(bar).not.toBe(null);
        });

        FunkyTests.it('uses custom color class', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3], { color: 'warning' });
            var bar = container.querySelector('.warning');
            expect(bar).not.toBe(null);
        });

        FunkyTests.it('includes role="img"', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('role')).toBe('img');
        });

        FunkyTests.it('includes aria-label', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3]);
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('aria-label')).toBeDefined();
        });

        FunkyTests.it('uses custom aria-label', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3], { ariaLabel: 'Custom bar chart' });
            var svg = container.querySelector('svg');
            expect(svg.getAttribute('aria-label')).toBe('Custom bar chart');
        });

        FunkyTests.it('handles null container', function() {
            expect(function() {
                Funky.Charts.bar(null, [1, 2, 3]);
            }).not.toThrow();
        });

        FunkyTests.it('handles empty data', function() {
            var container = document.getElementById('test-container');
            expect(function() {
                Funky.Charts.bar(container, []);
            }).not.toThrow();
        });

        FunkyTests.it('handles single value', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [5]);
            var rects = container.querySelectorAll('rect');
            expect(rects.length).toBe(1);
        });

        FunkyTests.it('respects custom gap option', function() {
            var container = document.getElementById('test-container');
            Funky.Charts.bar(container, [1, 2, 3], { gap: 5 });
            var svg = container.querySelector('svg');
            expect(svg).not.toBe(null);
        });
    });

    FunkyTests.describe('autoInit()', function() {
        FunkyTests.it('initializes line sparklines', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline1" data-sparkline="line" data-values="1,2,3,4,5"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline1 svg');
            expect(svg).not.toBe(null);
        });

        FunkyTests.it('initializes bar sparklines', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline2" data-sparkline="bar" data-values="1,2,3,4,5"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline2 svg');
            expect(svg).not.toBe(null);
        });

        FunkyTests.it('parses data-values attribute', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline3" data-sparkline="line" data-values="10,20,30"></span>'
            );
            Funky.Charts.autoInit();
            var polyline = document.querySelector('#sparkline3 polyline');
            expect(polyline).not.toBe(null);
        });

        FunkyTests.it('respects data-width attribute', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline4" data-sparkline="line" data-values="1,2,3" data-width="120"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline4 svg');
            expect(svg.getAttribute('width')).toBe('120');
        });

        FunkyTests.it('respects data-height attribute', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline5" data-sparkline="line" data-values="1,2,3" data-height="40"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline5 svg');
            expect(svg.getAttribute('height')).toBe('40');
        });

        FunkyTests.it('respects data-color attribute', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline6" data-sparkline="line" data-values="1,2,3" data-color="negative"></span>'
            );
            Funky.Charts.autoInit();
            var polyline = document.querySelector('#sparkline6 .negative');
            expect(polyline).not.toBe(null);
        });

        FunkyTests.it('skips elements without data-values', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline7" data-sparkline="line"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline7 svg');
            expect(svg).toBe(null);
        });

        FunkyTests.it('skips elements with insufficient data', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline8" data-sparkline="line" data-values="5"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline8 svg');
            expect(svg).toBe(null);
        });

        FunkyTests.it('handles whitespace in data-values', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline9" data-sparkline="line" data-values=" 1 , 2 , 3 "></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline9 svg');
            expect(svg).not.toBe(null);
        });

        FunkyTests.it('filters out invalid values', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline10" data-sparkline="line" data-values="1,abc,3,4,5"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline10 svg');
            expect(svg).not.toBe(null);
        });

        FunkyTests.it('accepts container parameter', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<div id="container"><span data-sparkline="line" data-values="1,2,3,4,5"></span></div>'
            );
            var container = document.getElementById('container');
            Funky.Charts.autoInit(container);
            var svg = container.querySelector('svg');
            expect(svg).not.toBe(null);
        });

        FunkyTests.it('defaults to document for container', function() {
            fixture.cleanup();
            fixture = FunkyTests.fixture(
                '<span id="sparkline11" data-sparkline="bar" data-values="1,2,3"></span>'
            );
            Funky.Charts.autoInit();
            var svg = document.querySelector('#sparkline11 svg');
            expect(svg).not.toBe(null);
        });
    });
});
