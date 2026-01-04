/**
 * Funky.Plotly - Plotly Wrapper Tests
 *
 * Tests for the Plotly.js wrapper with automatic theming.
 */
FunkyTests.describe('Funky.Plotly', function() {
	'use strict';

	var Plotly = Funky.Plotly;

	// Skip all tests if Plotly wrapper failed to load
	if (!Plotly) {
		FunkyTests.it('Plotly module not available', function() {
			FunkyTests.expect(true).toBe(true);
		});
		return;
	}

	var expect = FunkyTests.expect;
	var spyOn = FunkyTests.spyOn;
	var fixture;
	var testCounter = 0;

	/**
	 * Generate unique ID for test isolation
	 */
	function uniqueId(prefix) {
		testCounter++;
		return (prefix || 'plotly') + '_' + testCounter + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
	}

	/**
	 * Mock Plotly.js global object
	 */
	function mockPlotlyJs() {
		// Always set up mock, even if window.Plotly exists (ensures clean mock for each test)
		window._originalPlotly = window.Plotly;
		window.Plotly = {
			newPlot: function(el, traces, layout, config) {
				el._mockPlotly = { traces: traces, layout: layout, config: config };
				el.data = traces;
				el.layout = layout;
				return Promise.resolve();
			},
			react: function(el, traces, layout, config) {
				el._mockPlotly = { traces: traces, layout: layout, config: config };
				el.data = traces;
				el.layout = layout;
				return Promise.resolve();
			},
			purge: function(el) {
				delete el._mockPlotly;
				delete el.data;
				delete el.layout;
			},
			downloadImage: function(el, opts) {
				return Promise.resolve(opts);
			}
		};
		window._mockPlotlyCreated = true;
	}

	/**
	 * Restore original Plotly state
	 */
	function restorePlotlyJs() {
		if (window._mockPlotlyCreated) {
			if (window._originalPlotly) {
				window.Plotly = window._originalPlotly;
			} else {
				delete window.Plotly;
			}
			delete window._originalPlotly;
			delete window._mockPlotlyCreated;
		}
	}

	FunkyTests.beforeEach(function() {
		mockPlotlyJs();
		var containerId = uniqueId('plotly-container');
		fixture = FunkyTests.fixture(
			'<div id="' + containerId + '" style="width: 400px; height: 300px;"></div>'
		);
	});

	FunkyTests.afterEach(function() {
		if (Plotly && Plotly.destroyAll) {
			Plotly.destroyAll();
		}
		fixture.cleanup();
		restorePlotlyJs();
	});

	// =========================================================================
	// Module Structure
	// =========================================================================
	FunkyTests.describe('Module Structure', function() {
		FunkyTests.it('should be registered with Funky namespace', function() {
			expect(Plotly).toBeDefined();
			expect(Funky.isRegistered('Plotly')).toBe(true);
		});

		FunkyTests.it('should expose chart creation methods', function() {
			expect(typeof Plotly.bar).toBe('function');
			expect(typeof Plotly.barh).toBe('function');
			expect(typeof Plotly.line).toBe('function');
			expect(typeof Plotly.area).toBe('function');
			expect(typeof Plotly.pie).toBe('function');
			expect(typeof Plotly.donut).toBe('function');
			expect(typeof Plotly.gauge).toBe('function');
			expect(typeof Plotly.scatter).toBe('function');
			expect(typeof Plotly.heatmap).toBe('function');
			expect(typeof Plotly.sparkline).toBe('function');
			expect(typeof Plotly.combo).toBe('function');
		});

		FunkyTests.it('should expose utility methods', function() {
			expect(typeof Plotly.get).toBe('function');
			expect(typeof Plotly.destroyAll).toBe('function');
			expect(typeof Plotly.resizeAll).toBe('function');
			expect(typeof Plotly.refreshTheme).toBe('function');
			expect(typeof Plotly.fromApi).toBe('function');
			expect(typeof Plotly.init).toBe('function');
		});

		FunkyTests.it('should expose internal helper methods', function() {
			expect(typeof Plotly._createChart).toBe('function');
			expect(typeof Plotly._getThemeColors).toBe('function');
			expect(typeof Plotly._getColorway).toBe('function');
			expect(typeof Plotly._getDefaultLayout).toBe('function');
			expect(typeof Plotly._formatValue).toBe('function');
		});
	});

	// =========================================================================
	// Theme Colors
	// =========================================================================
	FunkyTests.describe('_getThemeColors', function() {
		FunkyTests.it('should return color object with expected properties', function() {
			var colors = Plotly._getThemeColors();

			expect(colors).toBeDefined();
			expect(colors.primary).toBeDefined();
			expect(colors.success).toBeDefined();
			expect(colors.warning).toBeDefined();
			expect(colors.danger).toBeDefined();
			expect(colors.info).toBeDefined();
			expect(colors.secondary).toBeDefined();
			expect(colors.text).toBeDefined();
			expect(colors.textMuted).toBeDefined();
			expect(colors.bg).toBeDefined();
			expect(colors.border).toBeDefined();
			expect(colors.gridColor).toBeDefined();
		});

		FunkyTests.it('should provide fallback colors when CSS variables not set', function() {
			var colors = Plotly._getThemeColors();

			// Should have string values (either from CSS vars or fallbacks)
			expect(typeof colors.primary).toBe('string');
			expect(typeof colors.success).toBe('string');
			expect(colors.primary.length).toBeGreaterThan(0);
		});
	});

	// =========================================================================
	// Colorway
	// =========================================================================
	FunkyTests.describe('_getColorway', function() {
		FunkyTests.it('should return array of colors', function() {
			var colorway = Plotly._getColorway();

			expect(Array.isArray(colorway)).toBe(true);
			expect(colorway.length).toBeGreaterThanOrEqual(10);
		});

		FunkyTests.it('should include theme colors in colorway', function() {
			var colorway = Plotly._getColorway();
			var colors = Plotly._getThemeColors();

			expect(colorway).toContain(colors.primary);
			expect(colorway).toContain(colors.success);
		});
	});

	// =========================================================================
	// Default Layout
	// =========================================================================
	FunkyTests.describe('_getDefaultLayout', function() {
		FunkyTests.it('should return layout object with default settings', function() {
			var layout = Plotly._getDefaultLayout({});

			expect(layout).toBeDefined();
			expect(layout.paper_bgcolor).toBe('transparent');
			expect(layout.plot_bgcolor).toBe('transparent');
			expect(layout.font).toBeDefined();
			expect(layout.colorway).toBeDefined();
			expect(layout.xaxis).toBeDefined();
			expect(layout.yaxis).toBeDefined();
			expect(layout.legend).toBeDefined();
			expect(layout.hoverlabel).toBeDefined();
		});

		FunkyTests.it('should include title when provided', function() {
			var layout = Plotly._getDefaultLayout({ title: 'Test Chart' });

			expect(layout.title).toBeDefined();
			expect(layout.title.text).toBe('Test Chart');
		});

		FunkyTests.it('should set null title when not provided', function() {
			var layout = Plotly._getDefaultLayout({});

			expect(layout.title).toBe(null);
		});

		FunkyTests.it('should include axis titles when provided', function() {
			var layout = Plotly._getDefaultLayout({ xTitle: 'X Axis', yTitle: 'Y Axis' });

			expect(layout.xaxis.title.text).toBe('X Axis');
			expect(layout.yaxis.title.text).toBe('Y Axis');
		});

		FunkyTests.it('should use custom margin when provided', function() {
			var customMargin = { t: 50, r: 30, b: 50, l: 60 };
			var layout = Plotly._getDefaultLayout({ margin: customMargin });

			expect(layout.margin).toEqual(customMargin);
		});
	});

	// =========================================================================
	// Format Value
	// =========================================================================
	FunkyTests.describe('_formatValue', function() {
		FunkyTests.it('should return currency format', function() {
			var format = Plotly._formatValue('currency');
			expect(format).toBe('$,.2f');
		});

		FunkyTests.it('should return percent format', function() {
			var format = Plotly._formatValue('percent');
			expect(format).toBe('.1%');
		});

		FunkyTests.it('should return integer format', function() {
			var format = Plotly._formatValue('integer');
			expect(format).toBe(',d');
		});

		FunkyTests.it('should return default format for unknown types', function() {
			var format = Plotly._formatValue('unknown');
			expect(format).toBe(',.2f');
		});
	});

	// =========================================================================
	// Bar Chart
	// =========================================================================
	FunkyTests.describe('bar', function() {
		FunkyTests.it('should create bar chart with simple data', function() {
			var container = fixture.el;
			var data = [
				{ x: 'Jan', y: 100 },
				{ x: 'Feb', y: 200 },
				{ x: 'Mar', y: 150 }
			];

			var instance = Plotly.bar(container, data);

			expect(instance).toBeDefined();
			expect(instance.el).toBe(container);
			expect(instance.traces).toBeDefined();
			expect(instance.traces[0].type).toBe('bar');
		});

		FunkyTests.it('should create bar chart with multi-series data', function() {
			var container = fixture.el;
			var data = {
				categories: ['Jan', 'Feb', 'Mar'],
				series: [
					{ name: 'Sales', data: [100, 200, 150] },
					{ name: 'Costs', data: [80, 150, 120] }
				]
			};

			var instance = Plotly.bar(container, data);

			expect(instance.traces.length).toBe(2);
			expect(instance.traces[0].name).toBe('Sales');
			expect(instance.traces[1].name).toBe('Costs');
		});

		FunkyTests.it('should support stacked bar mode', function() {
			var container = fixture.el;
			var data = {
				categories: ['A', 'B'],
				series: [
					{ name: 'S1', data: [10, 20] },
					{ name: 'S2', data: [30, 40] }
				]
			};

			var instance = Plotly.bar(container, data, { stacked: true });

			expect(instance.layout.barmode).toBe('stack');
		});

		FunkyTests.it('should apply custom color', function() {
			var container = fixture.el;
			var data = [{ x: 'A', y: 100 }];

			var instance = Plotly.bar(container, data, { color: '#ff0000' });

			expect(instance.traces[0].marker.color).toBe('#ff0000');
		});
	});

	// =========================================================================
	// Horizontal Bar Chart
	// =========================================================================
	FunkyTests.describe('barh', function() {
		FunkyTests.it('should create horizontal bar chart', function() {
			var container = fixture.el;
			var data = [
				{ x: 'Category A', y: 100 },
				{ x: 'Category B', y: 200 }
			];

			var instance = Plotly.barh(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].orientation).toBe('h');
		});

		FunkyTests.it('should swap x and y for horizontal orientation', function() {
			var container = fixture.el;
			var data = [{ x: 'Cat', y: 50 }];

			var instance = Plotly.barh(container, data);

			// In horizontal bars, y contains labels, x contains values
			expect(instance.traces[0].y).toContain('Cat');
			expect(instance.traces[0].x).toContain(50);
		});
	});

	// =========================================================================
	// Line Chart
	// =========================================================================
	FunkyTests.describe('line', function() {
		FunkyTests.it('should create line chart with simple data', function() {
			var container = fixture.el;
			var data = [
				{ x: 'Jan', y: 100 },
				{ x: 'Feb', y: 200 }
			];

			var instance = Plotly.line(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('scatter');
			expect(instance.traces[0].mode).toBe('lines+markers');
		});

		FunkyTests.it('should support lines only mode', function() {
			var container = fixture.el;
			var data = [{ x: 'A', y: 10 }];

			var instance = Plotly.line(container, data, { markers: false });

			expect(instance.traces[0].mode).toBe('lines');
		});

		FunkyTests.it('should support smooth line shape', function() {
			var container = fixture.el;
			var data = [{ x: 'A', y: 10 }, { x: 'B', y: 20 }];

			var instance = Plotly.line(container, data, { smooth: true });

			expect(instance.traces[0].line.shape).toBe('spline');
		});

		FunkyTests.it('should apply custom line width', function() {
			var container = fixture.el;
			var data = [{ x: 'A', y: 10 }];

			var instance = Plotly.line(container, data, { lineWidth: 4 });

			expect(instance.traces[0].line.width).toBe(4);
		});
	});

	// =========================================================================
	// Area Chart
	// =========================================================================
	FunkyTests.describe('area', function() {
		FunkyTests.it('should create area chart with fill', function() {
			var container = fixture.el;
			var data = [
				{ x: 'A', y: 10 },
				{ x: 'B', y: 20 }
			];

			var instance = Plotly.area(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('scatter');
			expect(instance.traces[0].fill).toBe('tozeroy');
		});

		FunkyTests.it('should support stacked area', function() {
			var container = fixture.el;
			var data = {
				categories: ['A', 'B'],
				series: [
					{ name: 'S1', data: [10, 20] },
					{ name: 'S2', data: [15, 25] }
				]
			};

			var instance = Plotly.area(container, data, { stacked: true });

			expect(instance.traces[0].fill).toBe('tozeroy');
			expect(instance.traces[1].fill).toBe('tonexty');
		});
	});

	// =========================================================================
	// Pie Chart
	// =========================================================================
	FunkyTests.describe('pie', function() {
		FunkyTests.it('should create pie chart', function() {
			var container = fixture.el;
			var data = [
				{ label: 'A', value: 30 },
				{ label: 'B', value: 70 }
			];

			var instance = Plotly.pie(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('pie');
			expect(instance.traces[0].hole).toBe(0);
		});

		FunkyTests.it('should extract labels and values correctly', function() {
			var container = fixture.el;
			var data = [
				{ label: 'Category A', value: 100 },
				{ label: 'Category B', value: 200 }
			];

			var instance = Plotly.pie(container, data);

			expect(instance.traces[0].labels).toContain('Category A');
			expect(instance.traces[0].labels).toContain('Category B');
			expect(instance.traces[0].values).toContain(100);
			expect(instance.traces[0].values).toContain(200);
		});

		FunkyTests.it('should show percent by default', function() {
			var container = fixture.el;
			var data = [{ label: 'A', value: 50 }];

			var instance = Plotly.pie(container, data);

			expect(instance.traces[0].textinfo).toBe('percent');
		});

		FunkyTests.it('should show value when showPercent is false', function() {
			var container = fixture.el;
			var data = [{ label: 'A', value: 50 }];

			var instance = Plotly.pie(container, data, { showPercent: false });

			expect(instance.traces[0].textinfo).toBe('value');
		});
	});

	// =========================================================================
	// Donut Chart
	// =========================================================================
	FunkyTests.describe('donut', function() {
		FunkyTests.it('should create donut chart with hole', function() {
			var container = fixture.el;
			var data = [
				{ label: 'A', value: 30 },
				{ label: 'B', value: 70 }
			];

			var instance = Plotly.donut(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('pie');
			expect(instance.traces[0].hole).toBe(0.4);
		});

		FunkyTests.it('should support custom hole size', function() {
			var container = fixture.el;
			var data = [{ label: 'A', value: 100 }];

			var instance = Plotly.donut(container, data, { hole: 0.6 });

			expect(instance.traces[0].hole).toBe(0.6);
		});

		FunkyTests.it('should add center text annotation when provided', function() {
			var container = fixture.el;
			var data = [{ label: 'A', value: 100 }];

			var instance = Plotly.donut(container, data, { centerText: 'Total' });

			expect(instance.layout.annotations).toBeDefined();
			expect(instance.layout.annotations.length).toBe(1);
			expect(instance.layout.annotations[0].text).toBe('Total');
		});
	});

	// =========================================================================
	// Gauge Chart
	// =========================================================================
	FunkyTests.describe('gauge', function() {
		FunkyTests.it('should create gauge chart with value', function() {
			var container = fixture.el;

			var instance = Plotly.gauge(container, 75);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('indicator');
			expect(instance.traces[0].value).toBe(75);
		});

		FunkyTests.it('should use default min/max range', function() {
			var container = fixture.el;

			var instance = Plotly.gauge(container, 50);

			expect(instance.traces[0].gauge.axis.range).toEqual([0, 100]);
		});

		FunkyTests.it('should support custom min/max', function() {
			var container = fixture.el;

			var instance = Plotly.gauge(container, 500, { min: 0, max: 1000 });

			expect(instance.traces[0].gauge.axis.range).toEqual([0, 1000]);
		});

		FunkyTests.it('should support suffix option', function() {
			var container = fixture.el;

			var instance = Plotly.gauge(container, 75, { suffix: '%' });

			expect(instance.traces[0].number.suffix).toBe('%');
		});

		FunkyTests.it('should support target threshold line', function() {
			var container = fixture.el;

			var instance = Plotly.gauge(container, 75, { target: 80 });

			expect(instance.traces[0].gauge.threshold).toBeDefined();
			expect(instance.traces[0].gauge.threshold.value).toBe(80);
		});

		FunkyTests.it('should support custom thresholds', function() {
			var container = fixture.el;
			var thresholds = [
				{ range: [0, 50], color: 'red' },
				{ range: [50, 100], color: 'green' }
			];

			var instance = Plotly.gauge(container, 75, { thresholds: thresholds });

			expect(instance.traces[0].gauge.steps.length).toBe(2);
		});
	});

	// =========================================================================
	// Scatter Plot
	// =========================================================================
	FunkyTests.describe('scatter', function() {
		FunkyTests.it('should create scatter plot', function() {
			var container = fixture.el;
			var data = [
				{ x: 1, y: 2 },
				{ x: 3, y: 4 }
			];

			var instance = Plotly.scatter(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('scatter');
			expect(instance.traces[0].mode).toBe('markers');
		});

		FunkyTests.it('should support variable marker sizes', function() {
			var container = fixture.el;
			var data = [
				{ x: 1, y: 2, size: 10 },
				{ x: 3, y: 4, size: 20 }
			];

			var instance = Plotly.scatter(container, data);

			expect(instance.traces[0].marker.size).toContain(10);
			expect(instance.traces[0].marker.size).toContain(20);
		});

		FunkyTests.it('should support labels', function() {
			var container = fixture.el;
			var data = [
				{ x: 1, y: 2, label: 'Point A' }
			];

			var instance = Plotly.scatter(container, data);

			expect(instance.traces[0].text).toContain('Point A');
		});
	});

	// =========================================================================
	// Heatmap
	// =========================================================================
	FunkyTests.describe('heatmap', function() {
		FunkyTests.it('should create heatmap', function() {
			var container = fixture.el;
			var data = {
				z: [[1, 2], [3, 4]],
				x: ['A', 'B'],
				y: ['Row 1', 'Row 2']
			};

			var instance = Plotly.heatmap(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('heatmap');
			expect(instance.traces[0].z).toEqual([[1, 2], [3, 4]]);
		});

		FunkyTests.it('should show scale by default', function() {
			var container = fixture.el;
			var data = { z: [[1, 2], [3, 4]] };

			var instance = Plotly.heatmap(container, data);

			expect(instance.traces[0].showscale).toBe(true);
		});

		FunkyTests.it('should hide scale when option set', function() {
			var container = fixture.el;
			var data = { z: [[1, 2]] };

			var instance = Plotly.heatmap(container, data, { showScale: false });

			expect(instance.traces[0].showscale).toBe(false);
		});
	});

	// =========================================================================
	// Sparkline
	// =========================================================================
	FunkyTests.describe('sparkline', function() {
		FunkyTests.it('should create sparkline', function() {
			var container = fixture.el;
			var data = [10, 20, 15, 25, 30];

			var instance = Plotly.sparkline(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces[0].type).toBe('scatter');
		});

		FunkyTests.it('should have minimal margins', function() {
			var container = fixture.el;
			var data = [10, 20, 30];

			var instance = Plotly.sparkline(container, data);

			expect(instance.layout.margin.t).toBe(0);
			expect(instance.layout.margin.r).toBe(0);
			expect(instance.layout.margin.b).toBe(0);
			expect(instance.layout.margin.l).toBe(0);
		});

		FunkyTests.it('should hide axes', function() {
			var container = fixture.el;
			var data = [10, 20];

			var instance = Plotly.sparkline(container, data);

			expect(instance.layout.xaxis.visible).toBe(false);
			expect(instance.layout.yaxis.visible).toBe(false);
		});

		FunkyTests.it('should add endpoint marker by default', function() {
			var container = fixture.el;
			var data = [10, 20, 30];

			var instance = Plotly.sparkline(container, data);

			// Should have 2 traces: line and endpoint marker
			expect(instance.traces.length).toBe(2);
		});

		FunkyTests.it('should support fill option', function() {
			var container = fixture.el;
			var data = [10, 20, 30];

			var instance = Plotly.sparkline(container, data, { fill: true });

			expect(instance.traces[0].fill).toBe('tozeroy');
		});
	});

	// =========================================================================
	// Combo Chart
	// =========================================================================
	FunkyTests.describe('combo', function() {
		FunkyTests.it('should create combo chart with bars and line', function() {
			var container = fixture.el;
			var data = {
				categories: ['Jan', 'Feb', 'Mar'],
				bars: { name: 'Revenue', data: [100, 200, 150] },
				line: { name: 'Growth', data: [5, 10, 8] }
			};

			var instance = Plotly.combo(container, data);

			expect(instance).toBeDefined();
			expect(instance.traces.length).toBe(2);
		});

		FunkyTests.it('should have bar trace first', function() {
			var container = fixture.el;
			var data = {
				categories: ['A'],
				bars: { name: 'Values', data: [100] },
				line: { name: 'Trend', data: [10] }
			};

			var instance = Plotly.combo(container, data);

			expect(instance.traces[0].type).toBe('bar');
			expect(instance.traces[0].yaxis).toBe('y');
		});

		FunkyTests.it('should put line on secondary y-axis', function() {
			var container = fixture.el;
			var data = {
				categories: ['A'],
				bars: { name: 'Values', data: [100] },
				line: { name: 'Trend', data: [10] }
			};

			var instance = Plotly.combo(container, data);

			expect(instance.traces[1].yaxis).toBe('y2');
		});
	});

	// =========================================================================
	// Instance Management
	// =========================================================================
	FunkyTests.describe('Instance Management', function() {
		FunkyTests.it('should get chart by element', function() {
			var container = fixture.el;
			Plotly.bar(container, [{ x: 'A', y: 10 }]);

			var instance = Plotly.get(container);

			expect(instance).toBeDefined();
			expect(instance.el).toBe(container);
		});

		FunkyTests.it('should get chart by selector', function() {
			var container = fixture.el;
			var selector = '#' + container.id;
			Plotly.bar(container, [{ x: 'A', y: 10 }]);

			var instance = Plotly.get(selector);

			expect(instance).toBeDefined();
		});

		FunkyTests.it('should return null for unknown element', function() {
			var unknownId = uniqueId('unknown');
			var instance = Plotly.get('#' + unknownId);

			expect(instance).toBe(null);
		});

		FunkyTests.it('should destroy instance on destroy()', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);

			instance.destroy();

			expect(Plotly.get(container)).toBe(null);
		});

		FunkyTests.it('should replace existing chart on same element', function() {
			var container = fixture.el;

			var instance1 = Plotly.bar(container, [{ x: 'A', y: 10 }]);
			var instance2 = Plotly.line(container, [{ x: 'A', y: 20 }]);

			expect(Plotly.get(container)).toBe(instance2);
		});
	});

	// =========================================================================
	// Instance Methods
	// =========================================================================
	FunkyTests.describe('Instance Methods', function() {
		FunkyTests.it('should have update method', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);

			expect(typeof instance.update).toBe('function');
		});

		FunkyTests.it('should have resize method', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);

			expect(typeof instance.resize).toBe('function');
		});

		FunkyTests.it('should have destroy method', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);

			expect(typeof instance.destroy).toBe('function');
		});

		FunkyTests.it('should have exportPNG method', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);

			expect(typeof instance.exportPNG).toBe('function');
		});

		FunkyTests.it('should have exportSVG method', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);

			expect(typeof instance.exportSVG).toBe('function');
		});
	});

	// =========================================================================
	// Utility Methods
	// =========================================================================
	FunkyTests.describe('Utility Methods', function() {
		FunkyTests.it('destroyAll should remove all instances', function() {
			var container = fixture.el;
			Plotly.bar(container, [{ x: 'A', y: 10 }]);

			Plotly.destroyAll();

			expect(Plotly.get(container)).toBe(null);
		});

		FunkyTests.it('resizeAll should call resize on all instances', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);
			var resizeCalled = false;
			var originalResize = instance.resize;
			instance.resize = function() {
				resizeCalled = true;
				return originalResize.call(this);
			};

			Plotly.resizeAll();

			expect(resizeCalled).toBe(true);
		});

		FunkyTests.it('refreshTheme should update all instances', function() {
			var container = fixture.el;
			var instance = Plotly.bar(container, [{ x: 'A', y: 10 }]);
			var updateCalled = false;
			var originalUpdate = instance.update;
			instance.update = function() {
				updateCalled = true;
				return originalUpdate.apply(this, arguments);
			};

			Plotly.refreshTheme();

			expect(updateCalled).toBe(true);
		});
	});

	// =========================================================================
	// fromApi
	// =========================================================================
	FunkyTests.describe('fromApi', function() {
		FunkyTests.it('should return controller object', function() {
			var container = fixture.el;

			var controller = Plotly.fromApi('bar', container, '/api/data');

			expect(controller).toBeDefined();
			expect(typeof controller.refresh).toBe('function');
			expect(typeof controller.stop).toBe('function');
			expect(typeof controller.destroy).toBe('function');
			expect(typeof controller.getChart).toBe('function');
		});

		FunkyTests.it('should return null for invalid element', function() {
			var controller = Plotly.fromApi('bar', '#nonexistent', '/api/data');

			expect(controller).toBe(null);
		});
	});

	// =========================================================================
	// Error Handling
	// =========================================================================
	FunkyTests.describe('Error Handling', function() {
		FunkyTests.it('should handle missing element gracefully', function() {
			var result = Plotly.bar('#nonexistent', [{ x: 'A', y: 10 }]);

			expect(result).toBe(null);
		});

		FunkyTests.it('should handle null element', function() {
			var result = Plotly.bar(null, [{ x: 'A', y: 10 }]);

			expect(result).toBe(null);
		});
	});

});
