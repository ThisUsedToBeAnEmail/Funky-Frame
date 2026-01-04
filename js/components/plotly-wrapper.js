/**
 * Funky.Plotly - Simple Plotly.js Wrapper
 * 
 * One-liner chart creation with automatic theming.
 * 
 * Usage:
 *   Funky.Plotly.bar('#chart', [{ x: 'Jan', y: 100 }, { x: 'Feb', y: 200 }]);
 *   Funky.Plotly.line('#chart', data, { title: 'Trend' });
 * 
 * @version 1.0.1
 */
(function(window) {
    'use strict';

    // Ensure dependencies
    if (!window.Funky || !window.Funky.register) {
        console.error('[Funky.Plotly] Registry not found.');
        return;
    }

    if (Funky.isRegistered('Plotly')) {
        return;
    }

    if (typeof window.Plotly === 'undefined') {
        console.warn('[Funky.Plotly] Plotly.js not loaded. Charts will not render.');
    }

    // Funky module shortcuts
    var D = Funky.Dom;
    var E = Funky.Events;
    var Prefs = Funky.Preferences;
    var Storage = Funky.Storage;

    // Instance registry
    var instances = Funky.Registry.createInstanceRegistry('Plotly');

    /**
     * Get theme colors from CSS variables
     * Uses Funky.Preferences for accent color override if set
     */
    function getThemeColors() {
        var root = document.documentElement;
        var style = getComputedStyle(root);
        
        // Check for user accent color preference
        var accentColor = null;
        if (Prefs && Prefs.get) {
            accentColor = Prefs.get('theme.accent_color');
        }
        
        return {
            primary: accentColor || style.getPropertyValue('--pro-primary').trim() || '#007bff',
            success: style.getPropertyValue('--pro-success').trim() || '#28a745',
            warning: style.getPropertyValue('--pro-warning').trim() || '#ffc107',
            danger: style.getPropertyValue('--pro-danger').trim() || '#dc3545',
            info: style.getPropertyValue('--pro-info').trim() || '#17a2b8',
            secondary: style.getPropertyValue('--pro-secondary').trim() || '#6c757d',
            text: style.getPropertyValue('--pro-text-primary').trim() || '#212529',
            textMuted: style.getPropertyValue('--pro-text-secondary').trim() || '#6c757d',
            bg: style.getPropertyValue('--pro-bg-primary').trim() || '#ffffff',
            border: style.getPropertyValue('--pro-border-color').trim() || '#dee2e6',
            gridColor: style.getPropertyValue('--pro-border-color').trim() || '#dee2e6'
        };
    }

    /**
     * Get colorway array for multi-series charts
     */
    function getColorway() {
        var colors = getThemeColors();
        return [
            colors.primary,
            colors.success,
            colors.warning,
            colors.danger,
            colors.info,
            colors.secondary,
            '#9b59b6', // purple
            '#1abc9c', // teal
            '#e67e22', // orange
            '#34495e'  // dark gray
        ];
    }

    /**
     * Get default layout with theming
     */
    function getDefaultLayout(opts) {
        var colors = getThemeColors();
        opts = opts || {};

        return {
            title: opts.title ? {
                text: opts.title,
                font: { color: colors.text, size: 16 }
            } : null,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {
                family: 'inherit',
                color: colors.text
            },
            margin: opts.margin || { t: opts.title ? 40 : 20, r: 20, b: 40, l: 50 },
            colorway: getColorway(),
            xaxis: {
                gridcolor: colors.gridColor,
                linecolor: colors.border,
                tickfont: { color: colors.textMuted },
                title: opts.xTitle ? { text: opts.xTitle, font: { color: colors.textMuted } } : null
            },
            yaxis: {
                gridcolor: colors.gridColor,
                linecolor: colors.border,
                tickfont: { color: colors.textMuted },
                title: opts.yTitle ? { text: opts.yTitle, font: { color: colors.textMuted } } : null
            },
            legend: {
                font: { color: colors.textMuted },
                bgcolor: 'transparent'
            },
            hoverlabel: {
                bgcolor: colors.bg,
                bordercolor: colors.border,
                font: { color: colors.text }
            }
        };
    }

    /**
     * Get default config
     */
    function getDefaultConfig(opts) {
        opts = opts || {};
        return {
            responsive: opts.responsive !== false,
            displayModeBar: opts.modeBar === true ? true : 'hover', // Show on hover by default
            displaylogo: false,
            modeBarButtonsToRemove: [
                'lasso2d',
                'select2d', 
                'autoScale2d',
                'hoverClosestCartesian',
                'hoverCompareCartesian',
                'toggleSpikelines'
            ],
            modeBarButtonsToAdd: [], // Can be customized via opts.modeBarButtons
            toImageButtonOptions: {
                format: 'png',
                filename: 'chart',
                scale: 2
            }
        };
    }

    /**
     * Get element from selector
     */
    function getElement(target) {
        if (!target) return null;
        if (typeof target === 'string') {
            return document.querySelector(target);
        }
        return target.el || target;
    }

    /**
     * Generate unique ID
     */
    function generateId() {
        return 'plotly-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Format value based on format option
     */
    function formatValue(format) {
        switch (format) {
            case 'currency':
                return '$,.2f';
            case 'percent':
                return '.1%';
            case 'integer':
                return ',d';
            default:
                return ',.2f';
        }
    }

    /**
     * Base chart creation
     */
    function createChart(target, traces, layoutOpts, configOpts) {
        var el = getElement(target);
        if (!el) {
            console.error('[Funky.Plotly] Element not found:', target);
            return null;
        }

        if (typeof window.Plotly === 'undefined') {
            el.innerHTML = '<div class="text-center text-muted p-4"><i class="fas fa-chart-bar me-2"></i>Plotly.js not loaded</div>';
            return null;
        }

        var id = el.id || generateId();
        el.id = id;

        // Destroy existing if present
        if (instances.get(id)) {
            instances.get(id).destroy();
        }

        var layout = Object.assign({}, getDefaultLayout(layoutOpts), layoutOpts);
        var config = Object.assign({}, getDefaultConfig(configOpts), configOpts);

        // Set percentage-based width for responsive behavior
        // Only set width - height should be controlled by parent/layout
        el.style.width = '100%';

        window.Plotly.newPlot(el, traces, layout, config);
        console.log('[Funky.Plotly] Chart created:', id, 'Element size:', el.offsetWidth + 'x' + el.offsetHeight);

        // Set up ResizeObserver for responsive charts
        var resizeObserver = null;
        var resizeTimeout = null;
        
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(function(entries) {
                console.log('[Funky.Plotly] ResizeObserver fired for:', id);
                entries.forEach(function(entry) {
                    console.log('[Funky.Plotly] Entry:', entry.contentRect.width + 'x' + entry.contentRect.height);
                });
                
                // Debounce resize calls
                if (resizeTimeout) {
                    clearTimeout(resizeTimeout);
                }
                resizeTimeout = setTimeout(function() {
                    // Check element still exists and has Plotly data
                    if (el && el.data && el.layout) {
                        console.log('[Funky.Plotly] Calling Plotly.react() for:', id);
                        // Use Plotly.react with stored data/layout/config for responsive re-render
                        window.Plotly.react(el, el.data, el.layout, config);
                        console.log('[Funky.Plotly] After react, element size:', el.offsetWidth + 'x' + el.offsetHeight);
                    } else {
                        console.log('[Funky.Plotly] Skip resize - no data/layout for:', id);
                    }
                }, 100);
            });
            resizeObserver.observe(el);
            console.log('[Funky.Plotly] ResizeObserver attached to:', id);
        }

        var instance = {
            id: id,
            el: el,
            traces: traces,
            layout: layout,
            config: config,
            _resizeObserver: resizeObserver,
            _resizeTimeout: resizeTimeout,

            update: function(newTraces, newLayout) {
                window.Plotly.react(el, newTraces || this.traces, newLayout || this.layout, this.config);
                if (newTraces) this.traces = newTraces;
                if (newLayout) this.layout = Object.assign(this.layout, newLayout);
            },

            resize: function() {
                console.log('[Funky.Plotly] Manual resize() called for:', id);
                if (el && el.data && el.layout) {
                    window.Plotly.react(el, el.data, el.layout, this.config);
                }
            },

            destroy: function() {
                if (this._resizeObserver) {
                    this._resizeObserver.disconnect();
                    this._resizeObserver = null;
                }
                if (this._resizeTimeout) {
                    clearTimeout(this._resizeTimeout);
                }
                window.Plotly.purge(el);
                instances.unregister(id);
            },

            exportPNG: function(filename) {
                window.Plotly.downloadImage(el, {
                    format: 'png',
                    filename: filename || 'chart',
                    width: el.offsetWidth,
                    height: el.offsetHeight
                });
            },

            exportSVG: function(filename) {
                window.Plotly.downloadImage(el, {
                    format: 'svg',
                    filename: filename || 'chart',
                    width: el.offsetWidth,
                    height: el.offsetHeight
                });
            }
        };

        instances.register(id, instance);

        // Emit event
        if (E) {
            E.emit(el, 'funky.plotly.created', { id: id, element: el });
        }

        return instance;
    }

    /**
     * FunkyPlotly API
     */
    var FunkyPlotly = {
        // Core methods
        _createChart: createChart,
        _getThemeColors: getThemeColors,
        _getColorway: getColorway,
        _getDefaultLayout: getDefaultLayout,
        _formatValue: formatValue,

        /**
         * Create vertical bar chart
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array|Object} data - Array of { x, y } or multi-series object
         * @param {Object} opts - Options (title, format, color, stacked, etc.)
         * @returns {Object} Chart instance
         */
        bar: function(target, data, opts) {
            opts = opts || {};
            var traces = [];
            var colors = this._getColorway();

            // Check if multi-series format
            if (data.series && Array.isArray(data.series)) {
                data.series.forEach(function(series, i) {
                    traces.push({
                        type: 'bar',
                        name: series.name || ('Series ' + (i + 1)),
                        x: data.categories || series.data.map(function(_, idx) { return idx; }),
                        y: series.data,
                        marker: { color: series.color || colors[i % colors.length] },
                        hovertemplate: '%{x}: %{y:' + formatValue(opts.format) + '}<extra></extra>'
                    });
                });
            } else {
                // Simple array format
                var x = [];
                var y = [];
                data.forEach(function(d) {
                    x.push(d.x || d.label || d.name);
                    y.push(d.y || d.value);
                });

                traces.push({
                    type: 'bar',
                    x: x,
                    y: y,
                    marker: { color: opts.color || colors[0] },
                    hovertemplate: '%{x}: %{y:' + formatValue(opts.format) + '}<extra></extra>'
                });
            }

            var layoutOpts = Object.assign({}, opts, {
                barmode: opts.stacked ? 'stack' : 'group'
            });

            return this._createChart(target, traces, layoutOpts, opts);
        },

        /**
         * Create horizontal bar chart
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array|Object} data - Array of { x, y } or multi-series object
         * @param {Object} opts - Options
         * @returns {Object} Chart instance
         */
        barh: function(target, data, opts) {
            opts = opts || {};
            var traces = [];
            var colors = this._getColorway();

            if (data.series && Array.isArray(data.series)) {
                data.series.forEach(function(series, i) {
                    traces.push({
                        type: 'bar',
                        orientation: 'h',
                        name: series.name || ('Series ' + (i + 1)),
                        y: data.categories || series.data.map(function(_, idx) { return idx; }),
                        x: series.data,
                        marker: { color: series.color || colors[i % colors.length] },
                        hovertemplate: '%{y}: %{x:' + formatValue(opts.format) + '}<extra></extra>'
                    });
                });
            } else {
                var x = [];
                var y = [];
                data.forEach(function(d) {
                    y.push(d.x || d.label || d.name);
                    x.push(d.y || d.value);
                });

                traces.push({
                    type: 'bar',
                    orientation: 'h',
                    x: x,
                    y: y,
                    marker: { color: opts.color || colors[0] },
                    hovertemplate: '%{y}: %{x:' + formatValue(opts.format) + '}<extra></extra>'
                });
            }

            var layoutOpts = Object.assign({}, opts, {
                barmode: opts.stacked ? 'stack' : 'group'
            });

            return this._createChart(target, traces, layoutOpts, opts);
        },

        /**
         * Create line chart
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array|Object} data - Array of { x, y } or multi-series object
         * @param {Object} opts - Options (smooth, markers, lineWidth, markerSize)
         * @returns {Object} Chart instance
         */
        line: function(target, data, opts) {
            opts = opts || {};
            var traces = [];
            var colors = this._getColorway();

            if (data.series && Array.isArray(data.series)) {
                data.series.forEach(function(series, i) {
                    traces.push({
                        type: 'scatter',
                        mode: opts.markers === false ? 'lines' : 'lines+markers',
                        name: series.name || ('Series ' + (i + 1)),
                        x: data.categories || series.data.map(function(_, idx) { return idx; }),
                        y: series.data,
                        line: { 
                            color: series.color || colors[i % colors.length],
                            width: opts.lineWidth || 2,
                            shape: opts.smooth ? 'spline' : 'linear'
                        },
                        marker: { size: opts.markerSize || 6 },
                        hovertemplate: '%{x}: %{y:' + formatValue(opts.format) + '}<extra></extra>'
                    });
                });
            } else {
                var x = [];
                var y = [];
                data.forEach(function(d) {
                    x.push(d.x || d.label);
                    y.push(d.y || d.value);
                });

                traces.push({
                    type: 'scatter',
                    mode: opts.markers === false ? 'lines' : 'lines+markers',
                    x: x,
                    y: y,
                    line: { 
                        color: opts.color || colors[0],
                        width: opts.lineWidth || 2,
                        shape: opts.smooth ? 'spline' : 'linear'
                    },
                    marker: { size: opts.markerSize || 6 },
                    hovertemplate: '%{x}: %{y:' + formatValue(opts.format) + '}<extra></extra>'
                });
            }

            return this._createChart(target, traces, opts, opts);
        },

        /**
         * Create area chart (filled line)
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array|Object} data - Array of { x, y } or multi-series object
         * @param {Object} opts - Options (stacked, smooth)
         * @returns {Object} Chart instance
         */
        area: function(target, data, opts) {
            opts = opts || {};
            var traces = [];
            var colors = this._getColorway();

            if (data.series && Array.isArray(data.series)) {
                data.series.forEach(function(series, i) {
                    traces.push({
                        type: 'scatter',
                        mode: 'lines',
                        fill: i === 0 ? 'tozeroy' : (opts.stacked ? 'tonexty' : 'tozeroy'),
                        name: series.name || ('Series ' + (i + 1)),
                        x: data.categories || series.data.map(function(_, idx) { return idx; }),
                        y: series.data,
                        line: { 
                            color: series.color || colors[i % colors.length],
                            shape: opts.smooth ? 'spline' : 'linear'
                        },
                        hovertemplate: '%{x}: %{y:' + formatValue(opts.format) + '}<extra></extra>'
                    });
                });
            } else {
                var x = [];
                var y = [];
                data.forEach(function(d) {
                    x.push(d.x || d.label);
                    y.push(d.y || d.value);
                });

                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    fill: 'tozeroy',
                    x: x,
                    y: y,
                    line: { 
                        color: opts.color || colors[0],
                        shape: opts.smooth ? 'spline' : 'linear'
                    },
                    hovertemplate: '%{x}: %{y:' + formatValue(opts.format) + '}<extra></extra>'
                });
            }

            return this._createChart(target, traces, opts, opts);
        },

        /**
         * Create pie chart
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array} data - Array of { label, value } objects
         * @param {Object} opts - Options (colors, showPercent, legend)
         * @returns {Object} Chart instance
         */
        pie: function(target, data, opts) {
            opts = opts || {};
            var colors = this._getColorway();

            var labels = [];
            var values = [];
            data.forEach(function(d) {
                labels.push(d.label || d.name || d.x);
                values.push(d.value || d.y);
            });

            var traces = [{
                type: 'pie',
                labels: labels,
                values: values,
                marker: {
                    colors: opts.colors || colors.slice(0, data.length)
                },
                textinfo: opts.showPercent !== false ? 'percent' : 'value',
                textposition: opts.textPosition || 'auto',
                hovertemplate: '%{label}: %{value} (%{percent})<extra></extra>',
                hole: 0
            }];

            var layoutOpts = Object.assign({}, opts, {
                showlegend: opts.legend !== false
            });

            return this._createChart(target, traces, layoutOpts, opts);
        },

        /**
         * Create donut chart (pie with hole)
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array} data - Array of { label, value } objects
         * @param {Object} opts - Options (hole, centerText, colors)
         * @returns {Object} Chart instance
         */
        donut: function(target, data, opts) {
            opts = opts || {};
            var colors = this._getColorway();
            var themeColors = this._getThemeColors();

            var labels = [];
            var values = [];
            data.forEach(function(d) {
                labels.push(d.label || d.name || d.x);
                values.push(d.value || d.y);
            });

            var traces = [{
                type: 'pie',
                labels: labels,
                values: values,
                marker: {
                    colors: opts.colors || colors.slice(0, data.length)
                },
                textinfo: opts.showPercent !== false ? 'percent' : 'value',
                textposition: opts.textPosition || 'auto',
                hovertemplate: '%{label}: %{value} (%{percent})<extra></extra>',
                hole: opts.hole || 0.4
            }];

            // Center text annotation (optional)
            var annotations = [];
            if (opts.centerText) {
                annotations.push({
                    text: opts.centerText,
                    x: 0.5,
                    y: 0.5,
                    font: { size: 20, color: themeColors.text },
                    showarrow: false
                });
            }

            var layoutOpts = Object.assign({}, opts, {
                showlegend: opts.legend !== false,
                annotations: annotations
            });

            return this._createChart(target, traces, layoutOpts, opts);
        },

        /**
         * Create gauge chart (single value indicator)
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {number} value - Current value
         * @param {Object} opts - Options (min, max, suffix, thresholds, target)
         * @returns {Object} Chart instance
         */
        gauge: function(target, value, opts) {
            opts = opts || {};
            var colors = this._getThemeColors();
            var min = opts.min !== undefined ? opts.min : 0;
            var max = opts.max !== undefined ? opts.max : 100;

            // Build steps from thresholds
            var steps = [];
            if (opts.thresholds && Array.isArray(opts.thresholds)) {
                opts.thresholds.forEach(function(t) {
                    var stepColor = colors[t.color] || t.color || colors.secondary;
                    steps.push({
                        range: t.range,
                        color: stepColor
                    });
                });
            } else {
                // Default gradient steps
                steps = [
                    { range: [min, min + (max - min) * 0.33], color: colors.danger },
                    { range: [min + (max - min) * 0.33, min + (max - min) * 0.66], color: colors.warning },
                    { range: [min + (max - min) * 0.66, max], color: colors.success }
                ];
            }

            // Determine bar color based on value
            var barColor = colors.primary;
            steps.forEach(function(step) {
                if (value >= step.range[0] && value <= step.range[1]) {
                    barColor = step.color;
                }
            });

            var traces = [{
                type: 'indicator',
                mode: opts.mode || 'gauge+number',
                value: value,
                number: {
                    suffix: opts.suffix || '',
                    font: { color: colors.text, size: opts.numberSize || 36 }
                },
                title: opts.gaugeTitle ? {
                    text: opts.gaugeTitle,
                    font: { color: colors.textMuted, size: 14 }
                } : null,
                gauge: {
                    axis: {
                        range: [min, max],
                        tickcolor: colors.border,
                        tickfont: { color: colors.textMuted }
                    },
                    bar: { color: barColor },
                    bgcolor: colors.bg,
                    bordercolor: colors.border,
                    steps: steps.map(function(s) {
                        return { range: s.range, color: s.color + '33' }; // 20% opacity for background
                    }),
                    threshold: opts.target ? {
                        line: { color: colors.danger, width: 4 },
                        thickness: 0.75,
                        value: opts.target
                    } : null
                }
            }];

            var layoutOpts = Object.assign({}, opts, {
                margin: { t: opts.title ? 40 : 20, r: 20, b: 20, l: 20 }
            });

            return this._createChart(target, traces, layoutOpts, opts);
        },

        /**
         * Create scatter plot
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array|Object} data - Array of { x, y, size?, label? } or series format
         * @param {Object} opts - Options (bubble, markerSize)
         * @returns {Object} Chart instance
         */
        scatter: function(target, data, opts) {
            opts = opts || {};
            var traces = [];
            var colors = this._getColorway();

            if (data.series && Array.isArray(data.series)) {
                data.series.forEach(function(series, i) {
                    var x = [];
                    var y = [];
                    var sizes = [];
                    var texts = [];

                    series.data.forEach(function(d) {
                        x.push(d.x);
                        y.push(d.y);
                        if (d.size) sizes.push(d.size);
                        if (d.label) texts.push(d.label);
                    });

                    traces.push({
                        type: 'scatter',
                        mode: 'markers',
                        name: series.name || ('Series ' + (i + 1)),
                        x: x,
                        y: y,
                        text: texts.length ? texts : null,
                        marker: {
                            color: series.color || colors[i % colors.length],
                            size: sizes.length ? sizes : (opts.markerSize || 10),
                            sizemode: 'diameter'
                        },
                        hovertemplate: texts.length ? '%{text}<br>X: %{x}<br>Y: %{y}<extra></extra>' : 'X: %{x}<br>Y: %{y}<extra></extra>'
                    });
                });
            } else {
                var x = [];
                var y = [];
                var sizes = [];
                var texts = [];

                data.forEach(function(d) {
                    x.push(d.x);
                    y.push(d.y);
                    if (d.size) sizes.push(d.size);
                    if (d.label) texts.push(d.label);
                });

                traces.push({
                    type: 'scatter',
                    mode: 'markers',
                    x: x,
                    y: y,
                    text: texts.length ? texts : null,
                    marker: {
                        color: opts.color || colors[0],
                        size: sizes.length ? sizes : (opts.markerSize || 10),
                        sizemode: 'diameter'
                    },
                    hovertemplate: texts.length ? '%{text}<br>X: %{x}<br>Y: %{y}<extra></extra>' : 'X: %{x}<br>Y: %{y}<extra></extra>'
                });
            }

            return this._createChart(target, traces, opts, opts);
        },

        /**
         * Create heatmap
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Object} data - { z: [[values]], x: [labels], y: [labels] }
         * @param {Object} opts - Options (colorscale, showScale)
         * @returns {Object} Chart instance
         */
        heatmap: function(target, data, opts) {
            opts = opts || {};
            var colors = this._getThemeColors();

            var colorscale = opts.colorscale || [
                [0, colors.bg],
                [0.5, colors.warning],
                [1, colors.danger]
            ];

            var traces = [{
                type: 'heatmap',
                z: data.z,
                x: data.x || null,
                y: data.y || null,
                colorscale: colorscale,
                showscale: opts.showScale !== false,
                hoverongaps: false,
                hovertemplate: '%{x}, %{y}: %{z}<extra></extra>'
            }];

            var layoutOpts = Object.assign({}, opts, {
                xaxis: Object.assign({}, opts.xaxis || {}, { side: 'bottom' }),
                yaxis: Object.assign({}, opts.yaxis || {}, { autorange: 'reversed' })
            });

            return this._createChart(target, traces, layoutOpts, opts);
        },

        /**
         * Create sparkline (minimal inline chart)
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Array} data - Array of numbers
         * @param {Object} opts - Options (fill, showEndpoint, lineWidth)
         * @returns {Object} Chart instance
         */
        sparkline: function(target, data, opts) {
            opts = opts || {};
            var colors = this._getThemeColors();

            // Determine trend color
            var trendColor = colors.secondary;
            if (data.length >= 2) {
                var first = data[0];
                var last = data[data.length - 1];
                trendColor = last > first ? colors.success : (last < first ? colors.danger : colors.secondary);
            }

            var traces = [{
                type: 'scatter',
                mode: 'lines',
                x: data.map(function(_, i) { return i; }),
                y: data,
                line: {
                    color: opts.color || trendColor,
                    width: opts.lineWidth || 2
                },
                hoverinfo: 'skip'
            }];

            // Add fill if requested
            if (opts.fill) {
                traces[0].fill = 'tozeroy';
                traces[0].fillcolor = (opts.color || trendColor) + '33'; // 20% opacity
            }

            // Add endpoint marker
            if (opts.showEndpoint !== false) {
                traces.push({
                    type: 'scatter',
                    mode: 'markers',
                    x: [data.length - 1],
                    y: [data[data.length - 1]],
                    marker: {
                        color: opts.color || trendColor,
                        size: 6
                    },
                    hoverinfo: 'skip'
                });
            }

            var layoutOpts = {
                margin: { t: 0, r: 0, b: 0, l: 0 },
                xaxis: { visible: false },
                yaxis: { visible: false },
                showlegend: false,
                hovermode: false
            };

            var configOpts = {
                responsive: true,
                displayModeBar: false
            };

            return this._createChart(target, traces, layoutOpts, configOpts);
        },

        /**
         * Create combination chart (bars + line)
         * 
         * @param {string|HTMLElement} target - Container element
         * @param {Object} data - { bars: { name, data }, line: { name, data }, categories }
         * @param {Object} opts - Options
         * @returns {Object} Chart instance
         */
        combo: function(target, data, opts) {
            opts = opts || {};
            var colors = this._getColorway();
            var themeColors = this._getThemeColors();
            var traces = [];

            // Bar trace
            if (data.bars) {
                traces.push({
                    type: 'bar',
                    name: data.bars.name || 'Values',
                    x: data.categories,
                    y: data.bars.data,
                    marker: { color: data.bars.color || colors[0] },
                    yaxis: 'y',
                    hovertemplate: '%{x}: %{y}<extra></extra>'
                });
            }

            // Line trace (secondary axis)
            if (data.line) {
                traces.push({
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: data.line.name || 'Trend',
                    x: data.categories,
                    y: data.line.data,
                    line: { color: data.line.color || colors[1], width: 2 },
                    marker: { size: 6 },
                    yaxis: 'y2',
                    hovertemplate: '%{x}: %{y}<extra></extra>'
                });
            }

            var layoutOpts = Object.assign({}, opts, {
                yaxis2: {
                    overlaying: 'y',
                    side: 'right',
                    gridcolor: 'transparent',
                    tickfont: { color: themeColors.textMuted }
                }
            });

            return this._createChart(target, traces, layoutOpts, opts);
        },

        /**
         * Get chart instance by ID or element
         */
        get: function(target) {
            var el = getElement(target);
            if (!el || !el.id) return null;
            return instances.get(el.id) || null;
        },

        /**
         * Destroy all charts and cleanup global listeners
         */
        destroyAll: function() {
            instances.destroyAll();

            // Remove global resize handler
            if (this._windowResizeHandler) {
                window.removeEventListener('resize', this._windowResizeHandler);
                this._windowResizeHandler = null;
            }
        },

        /**
         * Get chart instance by ID
         * @param {string} id - Chart ID
         * @returns {Object|null}
         */
        getInstance: function(id) {
            return instances.get(id);
        },

        /**
         * Resize all charts (useful for manual trigger after layout changes)
         */
        resizeAll: function() {
            instances.getAll().forEach(function(inst) {
                inst.resize();
            });
        },

        /**
         * Refresh theme colors on all charts
         */
        refreshTheme: function() {
            instances.getAll().forEach(function(inst) {
                var newLayout = getDefaultLayout(inst.layout);
                inst.update(null, newLayout);
            });
        },

        /**
         * Create chart from API endpoint
         * Uses Funky.Api for data fetching, Funky.Storage for caching
         * 
         * @param {string} chartType - Chart type (bar, line, pie, etc.)
         * @param {string|HTMLElement} target - Container element
         * @param {string} apiUrl - API endpoint URL
         * @param {Object} opts - Options including data mapping
         * @returns {Object} Controller with refresh(), stop(), destroy()
         */
        fromApi: function(chartType, target, apiUrl, opts) {
            opts = opts || {};
            var self = this;
            var el = typeof target === 'string' ? document.querySelector(target) : (target.el || target);
            
            if (!el) {
                console.error('[Funky.Plotly] Element not found:', target);
                return null;
            }

            var refreshInterval = null;
            var chartInstance = null;
            var cacheKey = 'plotly_cache_' + apiUrl.replace(/[^a-z0-9]/gi, '_');

            // Show loading state
            function showLoading() {
                if (Funky.Skeleton) {
                    Funky.Skeleton.show(el, { type: 'chart' });
                } else {
                    el.innerHTML = '<div class="text-center text-muted p-4"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div>';
                }
            }

            // Transform API data to chart format
            function transformData(response) {
                var items = response.data || response;
                if (!Array.isArray(items)) {
                    items = [items];
                }

                // For gauge, just return the value
                if (chartType === 'gauge') {
                    var item = items[0] || {};
                    return item[opts.value] || item.value || 0;
                }

                // For pie/donut, extract label/value
                if (chartType === 'pie' || chartType === 'donut') {
                    return items.map(function(item) {
                        return {
                            label: item[opts.label] || item.label || item.name,
                            value: item[opts.value] || item.value || item.y
                        };
                    });
                }

                // For multi-series charts
                if (opts.series && Array.isArray(opts.series)) {
                    var categories = items.map(function(item) {
                        return item[opts.x] || item.x || item.label;
                    });

                    var series = opts.series.map(function(field) {
                        return {
                            name: opts.seriesNames ? opts.seriesNames[field] : field,
                            data: items.map(function(item) {
                                return item[field];
                            })
                        };
                    });

                    return {
                        series: series,
                        categories: categories
                    };
                }

                // Simple x/y data
                return items.map(function(item) {
                    return {
                        x: item[opts.x] || item.x || item.label || item.name,
                        y: item[opts.y] || item.y || item.value
                    };
                });
            }

            // Render chart from data
            function renderChart(chartData) {
                var chartMethod = self[chartType];
                if (!chartMethod) {
                    console.error('[Funky.Plotly] Unknown chart type:', chartType);
                    return;
                }

                // Destroy existing if present
                if (chartInstance) {
                    chartInstance.destroy();
                }

                chartInstance = chartMethod.call(self, target, chartData, opts);

                // Emit event
                if (E) {
                    E.emit(el, 'funky.plotly.loaded', { 
                        element: el, 
                        type: chartType,
                        data: chartData 
                    });
                }
            }

            // Fetch and render
            function fetchAndRender(skipCache) {
                // Check cache first
                if (!skipCache && opts.cache && Storage) {
                    var cached = Storage.get(cacheKey);
                    if (cached) {
                        renderChart(cached);
                        return Promise.resolve(cached);
                    }
                }

                // Use Funky.Api for fetching if available
                var fetchPromise;
                if (Funky.Api && Funky.Api.get) {
                    fetchPromise = Funky.Api.get(apiUrl);
                } else {
                    fetchPromise = fetch(apiUrl, {
                        headers: { 'Accept': 'application/json' }
                    }).then(function(r) { return r.json(); });
                }

                return fetchPromise
                    .then(function(response) {
                        var chartData = transformData(response);
                        
                        // Cache result
                        if (opts.cache && Storage) {
                            Storage.set(cacheKey, chartData, opts.cache);
                        }

                        renderChart(chartData);
                        return chartData;
                    })
                    .catch(function(error) {
                        console.error('[Funky.Plotly] API error:', error);
                        el.innerHTML = '<div class="text-center text-danger p-4"><i class="fas fa-exclamation-triangle me-2"></i>Failed to load chart</div>';
                        
                        // Show toast error
                        if (Funky.Toast) {
                            Funky.Toast.error('Failed to load chart data');
                        }
                        
                        // Emit error event
                        if (E) {
                            E.emit(el, 'funky.plotly.error', { element: el, error: error });
                        }
                    });
            }

            // Initial load
            showLoading();
            fetchAndRender();

            // Setup auto-refresh
            if (opts.refresh && opts.refresh > 0) {
                refreshInterval = setInterval(function() {
                    fetchAndRender(true);
                }, opts.refresh);
            }

            // Return controller object
            return {
                refresh: function() { return fetchAndRender(true); },
                stop: function() {
                    if (refreshInterval) {
                        clearInterval(refreshInterval);
                        refreshInterval = null;
                    }
                },
                destroy: function() {
                    this.stop();
                    if (chartInstance) {
                        chartInstance.destroy();
                    }
                },
                getChart: function() {
                    return chartInstance;
                }
            };
        },

        /**
         * Initialize charts from data attributes
         * Scans for [data-plotly] elements and creates charts
         */
        init: function() {
            var self = this;
            var elements = document.querySelectorAll('[data-plotly]');

            elements.forEach(function(el) {
                var chartType = el.getAttribute('data-plotly');
                var apiUrl = el.getAttribute('data-api');

                if (!apiUrl) {
                    console.warn('[Funky.Plotly] No data-api attribute on', el);
                    return;
                }

                var opts = {
                    x: el.getAttribute('data-x'),
                    y: el.getAttribute('data-y'),
                    label: el.getAttribute('data-label'),
                    value: el.getAttribute('data-value'),
                    title: el.getAttribute('data-title'),
                    format: el.getAttribute('data-format'),
                    refresh: el.getAttribute('data-refresh') ? parseInt(el.getAttribute('data-refresh'), 10) : null,
                    cache: el.getAttribute('data-cache') ? parseInt(el.getAttribute('data-cache'), 10) : null
                };

                // Parse series if provided
                var seriesAttr = el.getAttribute('data-series');
                if (seriesAttr) {
                    opts.series = seriesAttr.split(',').map(function(s) { return s.trim(); });
                }

                self.fromApi(chartType, el, apiUrl, opts);
            });
        }
    };

    // Listen for theme changes
    if (E) {
        E.on(document, 'funky.theme.changed', function() {
            FunkyPlotly.refreshTheme();
        });
    }

    // Window resize handler (debounced fallback for older browsers)
    var windowResizeTimeout = null;
    var windowResizeHandler = function() {
        if (windowResizeTimeout) {
            clearTimeout(windowResizeTimeout);
        }
        windowResizeTimeout = setTimeout(function() {
            FunkyPlotly.resizeAll();
        }, 150);
    };
    window.addEventListener('resize', windowResizeHandler);

    // Store handler for cleanup
    FunkyPlotly._windowResizeHandler = windowResizeHandler;

    // Register
    Funky.register('Plotly', FunkyPlotly);

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            FunkyPlotly.init();
        });
    } else {
        FunkyPlotly.init();
    }

})(window);
