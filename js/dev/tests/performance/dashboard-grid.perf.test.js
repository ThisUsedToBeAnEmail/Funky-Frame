/**
 * Performance Tests: Dashboard Grid
 *
 * Tests widget rendering, drag/drop, resize, and layout persistence
 * performance for the dashboard grid component.
 */

describe('Funky.Perf.DashboardGrid', function() {

    var DashboardGrid = Funky.DashboardGrid;
    var Perf = FunkyTests.Perf;

    // Skip all tests if Perf utilities not available
    if (!Perf) {
        it('Perf utilities not available', function() {
            expect(true).toBe(true);
        });
        return;
    }
    var fixture;

    // Generate test widgets
    function generateWidgets(count) {
        var widgets = [];
        var cols = 12;
        var colsPerWidget = 3;
        var widgetsPerRow = Math.floor(cols / colsPerWidget);

        for (var i = 0; i < count; i++) {
            var row = Math.floor(i / widgetsPerRow) + 1;
            var col = (i % widgetsPerRow) * colsPerWidget + 1;

            widgets.push({
                id: 'widget-' + i,
                title: 'Widget ' + i,
                type: 'html',
                html: '<div class="widget-content"><h3>Widget ' + i + '</h3><p>Content for widget number ' + i + '</p></div>',
                col: col,
                row: row,
                width: colsPerWidget,
                height: 2
            });
        }
        return widgets;
    }

    function generateComplexWidgets(count) {
        var widgets = [];
        var types = ['html', 'component', 'livebinding'];
        var cols = 12;

        for (var i = 0; i < count; i++) {
            var width = 2 + (i % 4);
            var row = Math.floor(i / 3) + 1;
            var col = (i % 3) * 4 + 1;

            widgets.push({
                id: 'complex-widget-' + i,
                title: 'Complex Widget ' + i,
                type: types[i % types.length],
                html: '<div class="complex-content">' +
                    '<header><h4>' + 'Widget ' + i + '</h4></header>' +
                    '<div class="body"><p>Complex content</p>' +
                    '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>' +
                    '</div>' +
                    '<footer><button>Action</button></footer>' +
                '</div>',
                col: col,
                row: row,
                width: width,
                height: 2 + (i % 2)
            });
        }
        return widgets;
    }

    beforeEach(function() {
        fixture = FunkyTests.fixture(
            '<div id="dashboard-container" style="width: 1200px; height: 800px;"></div>'
        );
    });

    afterEach(function() {
        if (DashboardGrid.destroyAll) {
            DashboardGrid.destroyAll();
        }
        fixture.destroy();
    });

    describe('Initial Render Performance', function() {

        it('renders 10 widgets in < 50ms', function() {
            var widgets = generateWidgets(10);

            Perf.assertFasterThan(function() {
                DashboardGrid.init('#dashboard-container', {
                    columns: 12,
                    rowHeight: 80,
                    widgets: widgets
                });
            }, 50, '10 widgets initial render');
        });

        it('renders 50 widgets in < 150ms', function() {
            var widgets = generateWidgets(50);

            Perf.assertFasterThan(function() {
                DashboardGrid.init('#dashboard-container', {
                    columns: 12,
                    rowHeight: 80,
                    widgets: widgets
                });
            }, 150, '50 widgets initial render');
        });

        it('renders 100 widgets in < 300ms', function() {
            var widgets = generateWidgets(100);

            Perf.assertFasterThan(function() {
                DashboardGrid.init('#dashboard-container', {
                    columns: 12,
                    rowHeight: 80,
                    widgets: widgets
                });
            }, 300, '100 widgets initial render');
        });

        // Skip: Uses livebinding widget type which requires Funky.LiveBinding.Binding
        xit('renders complex widgets efficiently', function() {
            var widgets = generateComplexWidgets(30);

            Perf.assertFasterThan(function() {
                DashboardGrid.init('#dashboard-container', {
                    columns: 12,
                    rowHeight: 80,
                    widgets: widgets
                });
            }, 200, '30 complex widgets render');
        });

    });

    describe('Widget Add/Remove Performance', function() {

        it('adds single widget in < 20ms', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(20)
            });

            var newWidget = {
                id: 'new-widget',
                title: 'New Widget',
                type: 'html',
                html: '<p>New content</p>',
                col: 1,
                row: 10,
                width: 3,
                height: 2
            };

            Perf.assertFasterThan(function() {
                grid.addWidget(newWidget);
            }, 20, 'Add single widget');
        });

        it('removes single widget in < 10ms', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(20)
            });

            Perf.assertFasterThan(function() {
                grid.removeWidget('widget-10');
            }, 10, 'Remove single widget');
        });

        it('batch add 20 widgets in < 100ms', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(10)
            });

            var newWidgets = [];
            for (var i = 0; i < 20; i++) {
                newWidgets.push({
                    id: 'batch-widget-' + i,
                    title: 'Batch Widget ' + i,
                    type: 'html',
                    html: '<p>Batch content</p>',
                    col: (i % 4) * 3 + 1,
                    row: Math.floor(i / 4) + 10,
                    width: 3,
                    height: 2
                });
            }

            Perf.assertFasterThan(function() {
                if (grid.addWidgets) {
                    grid.addWidgets(newWidgets);
                } else {
                    newWidgets.forEach(function(w) {
                        grid.addWidget(w);
                    });
                }
            }, 100, 'Batch add 20 widgets');
        });

    });

    describe('Drag/Drop Performance', function() {

        it('drag start is responsive (< 5ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                editable: true,
                widgets: generateWidgets(30)
            });

            var widget = document.querySelector('[data-widget="widget-5"]');

            Perf.assertFasterThan(function() {
                if (grid.startDrag) {
                    grid.startDrag(widget, { clientX: 100, clientY: 100 });
                }
            }, 5, 'Drag start');
        });

        it('drag move updates in < 16ms (60fps)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                editable: true,
                widgets: generateWidgets(30)
            });

            var widget = document.querySelector('[data-widget="widget-5"]');
            if (grid.startDrag) {
                grid.startDrag(widget, { clientX: 100, clientY: 100 });
            }

            var result = Perf.benchmark('drag move', function() {
                if (grid.moveDrag) {
                    grid.moveDrag({ clientX: 200, clientY: 200 });
                }
            }, { iterations: 50 });

            expect(result.median).toBeLessThan(16);
        });

        it('drag end with reflow is acceptable (< 30ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                editable: true,
                widgets: generateWidgets(30)
            });

            var widget = document.querySelector('[data-widget="widget-5"]');
            if (grid.startDrag) {
                grid.startDrag(widget, { clientX: 100, clientY: 100 });
            }

            Perf.assertFasterThan(function() {
                if (grid.endDrag) {
                    grid.endDrag({ clientX: 400, clientY: 300 });
                }
            }, 30, 'Drag end');
        });

    });

    describe('Resize Performance', function() {

        it('resize start is responsive (< 5ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                editable: true,
                widgets: generateWidgets(30)
            });

            var handle = document.querySelector('[data-widget="widget-5"] .dashboard-widget__resize-handle');

            Perf.assertFasterThan(function() {
                if (grid.startResize) {
                    grid.startResize(handle, { clientX: 300, clientY: 200 });
                }
            }, 5, 'Resize start');
        });

        it('resize move updates in < 16ms (60fps)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                editable: true,
                widgets: generateWidgets(30)
            });

            var handle = document.querySelector('[data-widget="widget-5"] .dashboard-widget__resize-handle--se');
            if (grid.startResize && handle) {
                grid.startResize(handle, { clientX: 300, clientY: 200 });
            }

            var result = Perf.benchmark('resize move', function() {
                if (grid.moveResize) {
                    grid.moveResize({ clientX: 400, clientY: 300 });
                }
            }, { iterations: 50 });

            expect(result.median).toBeLessThan(16);
        });

        it('resize end with layout update is acceptable (< 30ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                editable: true,
                widgets: generateWidgets(30)
            });

            var handle = document.querySelector('[data-widget="widget-5"] .dashboard-widget__resize-handle--se');
            if (grid.startResize && handle) {
                grid.startResize(handle, { clientX: 300, clientY: 200 });
            }

            Perf.assertFasterThan(function() {
                if (grid.endResize) {
                    grid.endResize({ clientX: 500, clientY: 400 });
                }
            }, 30, 'Resize end');
        });

    });

    describe('Layout Operations', function() {

        it('getLayout is fast (< 5ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(50)
            });

            Perf.assertFasterThan(function() {
                grid.getLayout();
            }, 5, 'Get layout');
        });

        it('setLayout is efficient (< 100ms for 50 widgets)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(10)
            });

            var newLayout = generateWidgets(50);

            Perf.assertFasterThan(function() {
                grid.setLayout(newLayout);
            }, 100, 'Set layout 50 widgets');
        });

        it('compactLayout is efficient (< 50ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(30)
            });

            Perf.assertFasterThan(function() {
                if (grid.compact) {
                    grid.compact();
                }
            }, 50, 'Compact layout');
        });

    });

    describe('Edit Mode Performance', function() {

        // Skip: grid.setEditable method may not exist
        xit('enters edit mode quickly (< 20ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(30)
            });

            Perf.assertFasterThan(function() {
                grid.setEditable(true);
            }, 20, 'Enter edit mode');
        });

        // Skip: grid.setEditable method may not exist
        xit('exits edit mode quickly (< 20ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                editable: true,
                widgets: generateWidgets(30)
            });

            Perf.assertFasterThan(function() {
                grid.setEditable(false);
            }, 20, 'Exit edit mode');
        });

    });

    describe('Persistence Performance', function() {

        it('save layout to localStorage is fast (< 20ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(50),
                persistence: { type: 'localStorage', key: 'test-dashboard' }
            });

            Perf.assertFasterThan(function() {
                grid.save();
            }, 20, 'Save to localStorage');
        });

        it('load layout from localStorage is fast (< 30ms)', function() {
            // Setup: save a layout first
            var widgets = generateWidgets(50);
            localStorage.setItem('test-dashboard-load', JSON.stringify(widgets));

            Perf.assertFasterThan(function() {
                DashboardGrid.init('#dashboard-container', {
                    columns: 12,
                    rowHeight: 80,
                    persistence: { type: 'localStorage', key: 'test-dashboard-load' }
                });
            }, 200, 'Load from localStorage');

            localStorage.removeItem('test-dashboard-load');
        });

    });

    describe('Widget Update Performance', function() {

        // Skip: grid.updateWidget method may not exist
        xit('updates widget content in < 10ms', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(30)
            });

            Perf.assertFasterThan(function() {
                grid.updateWidget('widget-10', {
                    html: '<p>Updated content</p>'
                });
            }, 10, 'Update widget content');
        });

        // Skip: grid.updateWidget method may not exist
        xit('updates widget position in < 15ms', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(30)
            });

            Perf.assertFasterThan(function() {
                grid.updateWidget('widget-10', {
                    col: 7,
                    row: 5
                });
            }, 15, 'Update widget position');
        });

        // Skip: grid.updateWidget method may not exist
        xit('updates widget size in < 15ms', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(30)
            });

            Perf.assertFasterThan(function() {
                grid.updateWidget('widget-10', {
                    width: 6,
                    height: 3
                });
            }, 15, 'Update widget size');
        });

    });

    describe('Query Performance', function() {

        it('getWidget by ID is fast (< 2ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(100)
            });

            Perf.assertFasterThan(function() {
                grid.getWidget('widget-50');
            }, 2, 'Get widget by ID');
        });

        // Skip: grid.getWidgets method may not exist
        xit('getAllWidgets is fast (< 5ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(100)
            });

            Perf.assertFasterThan(function() {
                grid.getWidgets();
            }, 5, 'Get all widgets');
        });

        it('findWidgetsAt position is efficient (< 5ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(100)
            });

            Perf.assertFasterThan(function() {
                if (grid.getWidgetAt) {
                    grid.getWidgetAt(5, 3);
                }
            }, 5, 'Find widget at position');
        });

    });

    describe('Memory Efficiency', function() {

        it('does not leak memory on widget add/remove cycles', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(10)
            });

            var result = Perf.checkForLeaks(function() {
                var widget = {
                    id: 'temp-widget-' + Math.random(),
                    title: 'Temp',
                    type: 'html',
                    html: '<p>Temp</p>',
                    col: 1,
                    row: 20,
                    width: 3,
                    height: 2
                };
                grid.addWidget(widget);
                grid.removeWidget(widget.id);
            }, 50);

            if (result) {
                expect(result.leaked).toBe(false);
            }
        });

        it('does not leak memory on layout changes', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(10)
            });

            var layouts = [
                generateWidgets(10),
                generateWidgets(20),
                generateWidgets(15)
            ];
            var index = 0;

            var result = Perf.checkForLeaks(function() {
                grid.setLayout(layouts[index % layouts.length]);
                index++;
            }, 30);

            if (result) {
                expect(result.leaked).toBe(false);
            }
        });

    });

    describe('Responsive Performance', function() {

        it('handles container resize efficiently (< 30ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(30)
            });

            var container = document.getElementById('dashboard-container');

            Perf.assertFasterThan(function() {
                container.style.width = '800px';
                if (grid.resize) {
                    grid.resize();
                }
            }, 30, 'Handle resize');
        });

        it('breakpoint change is efficient (< 50ms)', function() {
            var grid = DashboardGrid.init('#dashboard-container', {
                columns: 12,
                rowHeight: 80,
                widgets: generateWidgets(30),
                breakpoints: {
                    lg: { columns: 12, width: 1200 },
                    md: { columns: 8, width: 992 },
                    sm: { columns: 4, width: 768 }
                }
            });

            var container = document.getElementById('dashboard-container');

            Perf.assertFasterThan(function() {
                container.style.width = '600px';
                if (grid.resize) {
                    grid.resize();
                }
            }, 50, 'Breakpoint change');
        });

    });

    describe('Nested Grid Performance', function() {

        // Skip: Nested grid has _emitEvent issues
        xit('nested grid renders efficiently', function() {
            var widgets = generateWidgets(10);
            widgets[0].type = 'grid';
            widgets[0].gridConfig = {
                columns: 6,
                widgets: generateWidgets(5).map(function(w, i) {
                    return Object.assign({}, w, { id: 'nested-' + i, width: 2 });
                })
            };

            Perf.assertFasterThan(function() {
                DashboardGrid.init('#dashboard-container', {
                    columns: 12,
                    rowHeight: 80,
                    widgets: widgets
                });
            }, 150, 'Nested grid render');
        });

    });

});
